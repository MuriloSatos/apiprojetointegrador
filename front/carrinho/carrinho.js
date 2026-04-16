const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";
const API_CARRINHO = "https://apiprojetointegrador.onrender.com/carrinho";
const API_VENDAS = "https://apiprojetointegrador.onrender.com/vendas";
// Rota de produtos para podermos descobrir os IDs reais!
const API_PRODUTOS = "https://apiprojetointegrador.onrender.com/produtos";

let totalCompraGeral = 0;
let itensNoCarrinho = [];
let todosOsProdutosParaConsulta = []; // 🔥 Nova lista para buscar IDs

// 🛡️ FUNÇÃO BLINDADA: Lê qualquer formato de dinheiro
function extrairPrecoReal(valor) {
    if (valor === null || valor === undefined) return 0;
    if (typeof valor === 'number') return valor;

    let texto = valor.toString();
    let limpo = texto.replace(/[^0-9.,-]+/g, "");

    if (limpo.includes(',')) {
        limpo = limpo.replace(/\./g, "");
        limpo = limpo.replace(",", ".");
    } else if (limpo.includes('.')) {
        let partes = limpo.split('.');
        if (partes[1] && partes[1].length === 3) {
            limpo = limpo.replace(".", "");
        }
    }
    return parseFloat(limpo) || 0;
}

document.addEventListener('DOMContentLoaded', () => {
    carregarTabelaDoCarrinho();
    atualizarMenuCarrinho();
});

function atualizarMenuCarrinho() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const menuDireita = document.getElementById('menu-direita');
    const menuNavegacao = document.getElementById('menu-navegacao');

    if (user) {
        if (menuDireita) {
            menuDireita.innerHTML = `
                <li><a href="javascript:void(0)" onclick="logout()" style="color: #ff4444; font-weight: bold;" class="btn-login-top">Sair (${user.nome.split(' ')[0]})</a></li>
            `;
        }

        // 🔥 Arrumando o menu se for Administrador!
        let isAdm = (user.perfil === 'adm' || user.email === 'adm@gmail.com');
        if (isAdm && menuNavegacao) {
            menuNavegacao.innerHTML = `
                <li><a href="../index/index.html">Início</a></li>
                <li><a href="../produto/produto.html">Catálogo</a></li>
                <li><a href="../vendas/vendas.html" style="color: #ff6b00; font-weight: 700;">Vendas</a></li>
                <li><a href="../usuario/usuario.html">Usuários</a></li>
                <li><a href="../carrinho/carrinho.html">Carrinho</a></li>
            `;
        }
    }
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = "../index/index.html";
}

// 1. CARREGAR OS DADOS DA TABELA
async function carregarTabelaDoCarrinho() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!user) {
        alert("⚠️ Faça login para ver seu carrinho.");
        window.location.href = "../login/login.html";
        return;
    }

    const tbody = document.getElementById('tabela-itens-carrinho');
    const spanTotal = document.getElementById('valor-total-final');
    const spanSubtotal = document.getElementById('valor-subtotal');

    try {
        // 🔥 Baixamos os produtos reais para usar como "dicionário" depois
        try {
            const resProd = await fetch(API_PRODUTOS, { headers: { "minha-chave": CLIENT_API_KEY } });
            if (resProd.ok) todosOsProdutosParaConsulta = await resProd.json();
        } catch (e) { console.warn("Não foi possível carregar produtos para consulta de ID"); }

        const res = await fetch(`${API_CARRINHO}/${user.id}`, {
            headers: { 'minha-chave': CLIENT_API_KEY }
        });

        const itens = await res.json();
        itensNoCarrinho = itens;

        if (!itens || itens.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="mensagem-vazio"><i class="fas fa-box-open" style="font-size: 24px; margin-bottom: 10px; display: block; color: #ccc;"></i>Seu carrinho está vazio.</td></tr>`;
            if (spanTotal) spanTotal.innerText = "R$ 0,00";
            if (spanSubtotal) spanSubtotal.innerText = "R$ 0,00";
            return;
        }

        totalCompraGeral = 0;
        tbody.innerHTML = '';

        itens.forEach(item => {
            const nome = item.nomeproduto || item.nome || "Produto sem nome";
            const preco = extrairPrecoReal(item.preco);
            const qtd = parseInt(item.pecaquantidade) || parseInt(item.quantidade) || 1;
            const subtotal = preco * qtd;

            const imagemHtml = (item.imagem && item.imagem.trim() !== "")
                ? `<img src="${item.imagem}" alt="${nome}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">`
                : `<div style="width: 60px; height: 60px; background: #eee; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999;">Sem Foto</div>`;

            totalCompraGeral += subtotal;

            tbody.innerHTML += `
                <tr>
                    <td>
                        <div class="produto-info">
                            ${imagemHtml}
                            <strong>${nome}</strong>
                        </div>
                    </td>
                    <td>R$ ${preco.toFixed(2).replace('.', ',')}</td>
                    <td><strong>${qtd}</strong></td>
                    <td style="color: #ff6600; font-weight: bold;">R$ ${subtotal.toFixed(2).replace('.', ',')}</td>
                    <td>
                        <button onclick="removerItemTabela(${item.id_carrinho || item.id})" class="btn-remover">
                            <i class="fas fa-trash-alt"></i> Remover
                        </button>
                    </td>
                </tr>
            `;
        });

        const valorFormatado = `R$ ${totalCompraGeral.toFixed(2).replace('.', ',')}`;
        if (spanTotal) spanTotal.innerText = valorFormatado;
        if (spanSubtotal) spanSubtotal.innerText = valorFormatado;

    } catch (err) {
        console.error("Erro ao carregar a tabela do carrinho:", err);
        tbody.innerHTML = `<tr><td colspan="5" class="mensagem-vazio" style="color: red;">⚠️ Erro ao carregar carrinho.</td></tr>`;
    }
}
// 2. FINALIZAR COMPRA (Agora usando a rota Profissional do seu Backend!)
async function finalizarCompraDefinitiva() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const selectPagamento = document.getElementById('select-pagamento-final');
    const formaPagamento = selectPagamento ? selectPagamento.value : 'Cartão';

    if (totalCompraGeral <= 0 || itensNoCarrinho.length === 0) {
        alert("⚠️ Adicione produtos ao carrinho antes de finalizar!");
        return;
    }

    const btnFinalizar = document.querySelector('.btn-finalizar-compra');
    if (btnFinalizar) {
        btnFinalizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        btnFinalizar.disabled = true;
    }

    try {
        // O pacote agora é super leve! Só mandamos quem é o usuário e como ele vai pagar.
        // O seu backend (na rota /finalizar) vai ler o carrinho lá no banco e fazer o resto!
        // -------------------------------------------------------------------
        // SUBSTITUA ESTA PARTE NO SEU CARRINHO.JS:
        // -------------------------------------------------------------------
        
        // Geramos um código único exato para ESTE carrinho
        const idUnicoCompra = Date.now(); 

        const payloadFinalizar = {
            id_usuario: user.id,
            // Truque Sênior: Enviamos o pagamento + ID único. Ex: "Pix_1713289123"
            formaPagamento: `${formaPagamento}_${idUnicoCompra}`
        };
        
        // -------------------------------------------------------------------


        console.log("📦 Enviando pedido completo para o backend:", payloadFinalizar);

        // Chamando a sua rota perfeita: /carrinho/finalizar
        const res = await fetch(`${API_CARRINHO}/finalizar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'minha-chave': CLIENT_API_KEY
            },
            body: JSON.stringify(payloadFinalizar)
        });

        if (res.ok) {
            // Sucesso total! O backend já salvou as vendas e já limpou o carrinho.
            alert("🎉 Compra finalizada com sucesso! Seu pedido foi gerado.");
            window.location.href = "../vendas/vendas.html";
        } else {
            const erroBackend = await res.json();
            alert(`⚠️ Erro ao finalizar: ${erroBackend.erro || 'Falha no servidor'}`);
            reabilitarBotaoCheckout(btnFinalizar);
        }

    } catch (err) {
        console.error("Erro fatal ao finalizar pedido:", err);
        alert("⚠️ Erro de conexão ao finalizar a compra.");
        reabilitarBotaoCheckout(btnFinalizar);
    }
}

// Reabilita o botão em caso de erro
function reabilitarBotaoCheckout(botao) {
    if (botao) {
        botao.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar e Pagar';
        botao.disabled = false;
    }
}


// 3. REMOVER ITEM DA TABELA
async function removerItemTabela(id_carrinho) {
    if (!confirm("Tem certeza que deseja remover este item?")) return;
    try {
        const res = await fetch(`${API_CARRINHO}/${id_carrinho}`, {
            method: 'DELETE',
            headers: { 'minha-chave': CLIENT_API_KEY }
        });
        if (res.ok) carregarTabelaDoCarrinho();
        else alert("Erro ao remover o item. Tente novamente.");
    } catch (err) { console.error("Erro ao remover:", err); }
}
