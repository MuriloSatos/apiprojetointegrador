const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";
const API_CARRINHO = "https://apiprojetointegrador.onrender.com/carrinho";
const API_VENDAS = "https://apiprojetointegrador.onrender.com/vendas";
const API_PRODUTOS = "https://apiprojetointegrador.onrender.com/produtos";

let totalCompraGeral = 0;
let valorTotalComTaxa = 0; 
let itensNoCarrinho = [];
let todosOsProdutosParaConsulta = [];
let idItemParaRemover = null; 

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

async function carregarTabelaDoCarrinho() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!user) {
        showToast("⚠️ Faça login para ver seu carrinho.", "error");
        setTimeout(() => {
            window.location.href = "../login/login.html";
        }, 2000);
        return;
    }

    const tbody = document.getElementById('tabela-itens-carrinho');
    const spanTotal = document.getElementById('valor-total-final');
    const spanSubtotal = document.getElementById('valor-subtotal');
    const spanTaxa = document.getElementById('valor-taxa');

    try {
        try {
            const resProd = await fetch(API_PRODUTOS, { headers: { "minha-chave": CLIENT_API_KEY } });
            if (resProd.ok) todosOsProdutosParaConsulta = await resProd.json();
        } catch (e) { console.warn("Não foi possível carregar produtos para consulta"); }

        const res = await fetch(`${API_CARRINHO}/${user.id}`, {
            headers: { 'minha-chave': CLIENT_API_KEY }
        });

        const itens = await res.json();
        itensNoCarrinho = itens;

        if (!itens || itens.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="mensagem-vazio"><i class="fas fa-box-open" style="font-size: 24px; margin-bottom: 10px; display: block; color: #ccc;"></i>Seu carrinho está vazio.</td></tr>`;
            if (spanTotal) spanTotal.innerText = "R$ 0,00";
            if (spanSubtotal) spanSubtotal.innerText = "R$ 0,00";
            if (spanTaxa) spanTaxa.innerText = "R$ 0,00";
            return;
        }

        totalCompraGeral = 0;
        let totalTaxasAdicionais = 0; 
        tbody.innerHTML = '';

        itens.forEach(item => {
            const nome = item.nomeproduto || item.nome || "Produto sem nome";
            const preco = extrairPrecoReal(item.preco);
            const qtd = parseInt(item.pecaquantidade) || parseInt(item.quantidade) || 1;
            const subtotal = preco * qtd;

            // 🌟 REGRA DE NEGÓCIO: CÁLCULO DA TAXA INDIVIDUAL POR PRODUTO
            let taxaDesteProduto = 0;
            let textoPorcentagem = "";

            if (preco > 100) {
                taxaDesteProduto = subtotal * 0.10; // 10% se o valor for maior que 100
                textoPorcentagem = "10%";
            } else {
                taxaDesteProduto = subtotal * 0.05; // 5% se o valor for até 100
                textoPorcentagem = "5%";
            }

            totalCompraGeral += subtotal;
            totalTaxasAdicionais += taxaDesteProduto;

            const URL_BASE_BACKEND = "https://apiprojetointegrador.onrender.com/uploads/"; 
            let imgPath = "";
            
            if (item.imagem && item.imagem.trim() !== "" && item.imagem !== 'undefined') {
                imgPath = item.imagem.startsWith('http') ? item.imagem : URL_BASE_BACKEND + item.imagem;
            }

            const imagemHtml = imgPath !== ""
                ? `<img src="${imgPath}" alt="${nome}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">`
                : `<div style="width: 60px; height: 60px; background: #eee; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999;">Sem Foto</div>`;

            // 🌟 MUDANÇA AQUI: Mostrando a taxa de cada produto na tabela
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
                    <td>
                        <span style="color: #ff6600; font-weight: bold; display: block;">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                        <span style="font-size: 12px; color: #666; display: block; margin-top: 4px;">
                            + R$ ${taxaDesteProduto.toFixed(2).replace('.', ',')} (Taxa ${textoPorcentagem})
                        </span>
                    </td>
                    <td>
                        <button onclick="abrirModalConfirmacao('${item.id_carrinho || item.id}')" class="btn-remover">
                            <i class="fas fa-trash-alt"></i> Remover
                        </button>
                    </td>
                </tr>
            `;
        });

        valorTotalComTaxa = totalCompraGeral + totalTaxasAdicionais;

        if (spanSubtotal) spanSubtotal.innerText = `R$ ${totalCompraGeral.toFixed(2).replace('.', ',')}`;
        if (spanTaxa) spanTaxa.innerText = `+ R$ ${totalTaxasAdicionais.toFixed(2).replace('.', ',')}`;
        if (spanTotal) spanTotal.innerText = `R$ ${valorTotalComTaxa.toFixed(2).replace('.', ',')}`;

    } catch (err) {
        console.error("Erro ao carregar a tabela do carrinho:", err);
        tbody.innerHTML = `<tr><td colspan="5" class="mensagem-vazio" style="color: red;">⚠️ Erro ao carregar carrinho.</td></tr>`;
    }
}

async function finalizarCompraDefinitiva() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const selectPagamento = document.getElementById('select-pagamento-final');
    const formaPagamento = selectPagamento ? selectPagamento.value : 'Cartão';

    if (totalCompraGeral <= 0 || itensNoCarrinho.length === 0) {
        showToast("⚠️ Adicione produtos ao carrinho antes de finalizar!", "error");
        return;
    }

    const btnFinalizar = document.querySelector('.btn-finalizar-compra');
    if (btnFinalizar) {
        btnFinalizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        btnFinalizar.disabled = true;
    }

    try {
        const idUnicoCompra = Date.now(); 

        const payloadFinalizar = {
            id_usuario: user.id,
            formaPagamento: `${formaPagamento}_${idUnicoCompra}`
        };

        const res = await fetch(`${API_CARRINHO}/finalizar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'minha-chave': CLIENT_API_KEY
            },
            body: JSON.stringify(payloadFinalizar)
        });

        if (res.ok) {
            showToast("🎉 Compra finalizada com sucesso!", "success");
            setTimeout(() => {
                window.location.href = "../vendas/vendas.html";
            }, 1500);
        } else {
            const erroBackend = await res.json();
            showToast(`⚠️ Erro ao finalizar: ${erroBackend.erro || 'Falha no servidor'}`, "error");
            reabilitarBotaoCheckout(btnFinalizar);
        }

    } catch (err) {
        console.error("Erro fatal ao finalizar pedido:", err);
        showToast("⚠️ Erro de conexão ao finalizar a compra.", "error");
        reabilitarBotaoCheckout(btnFinalizar);
    }
}

function reabilitarBotaoCheckout(botao) {
    if (botao) {
        botao.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar e Pagar';
        botao.disabled = false;
    }
}

// ==========================================
// FUNÇÕES DO MODAL DE REMOÇÃO
// ==========================================
function abrirModalConfirmacao(idCarrinho) {
    idItemParaRemover = idCarrinho;
    const modal = document.getElementById('modal-confirmacao');
    const overlay = document.getElementById('overlay-confirmacao');
    
    if (modal && overlay) {
        modal.classList.add('ativo');
        overlay.classList.add('ativo');
    }
}

function fecharModalConfirmacao() {
    idItemParaRemover = null;
    const modal = document.getElementById('modal-confirmacao');
    const overlay = document.getElementById('overlay-confirmacao');
    
    if (modal && overlay) {
        modal.classList.remove('ativo');
        overlay.classList.remove('ativo');
    }
}

async function confirmarRemocaoItem() {
    if (!idItemParaRemover) return;
    
    try {
        const btnConfirmar = document.querySelector('#modal-confirmacao .btn-primario');
        if (btnConfirmar) {
            btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removendo...';
            btnConfirmar.disabled = true;
        }

        const res = await fetch(`${API_CARRINHO}/${idItemParaRemover}`, {
            method: 'DELETE',
            headers: { 'minha-chave': CLIENT_API_KEY }
        });
        
        if (res.ok) {
            fecharModalConfirmacao();
            carregarTabelaDoCarrinho();
            showToast("🗑️ Item removido do carrinho!", "success"); 
        } else {
            fecharModalConfirmacao();
            showToast("Erro ao remover o item. Tente novamente.", "error");
        }
        
        if (btnConfirmar) {
            btnConfirmar.innerHTML = 'Sim, Remover';
            btnConfirmar.disabled = false;
        }

    } catch (err) { 
        console.error("Erro ao remover:", err); 
        fecharModalConfirmacao();
        showToast("Erro de conexão ao tentar remover.", "error");
    }
}

// ==========================================
// FUNÇÃO DE TOAST (MENSAGENS BONITAS)
// ==========================================
function showToast(mensagem, tipo = "success") {
    let container = document.getElementById('toast-container');
    if (!container) return;

    const icone = tipo === "success" ? "fa-check-circle" : "fa-exclamation-circle";
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<i class="fas ${icone}"></i> <span>${mensagem}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
