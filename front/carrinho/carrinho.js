const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";
const API_CARRINHO = "https://apiprojetointegrador.onrender.com/carrinho";
const API_VENDAS = "https://apiprojetointegrador.onrender.com/vendas";

let totalCompraGeral = 0;
let itensNoCarrinho = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarTabelaDoCarrinho();
    atualizarMenuCarrinho();
});

function atualizarMenuCarrinho() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const menuDireita = document.getElementById('menu-direita');

    if (user && menuDireita) {
        menuDireita.innerHTML = `
            <li><a href="javascript:void(0)" onclick="logout()" style="color: #ff4444; font-weight: bold;" class="btn-login-top">Sair (${user.nome.split(' ')[0]})</a></li>
        `;
    }
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = "../index/index.html";
}

// 1. CARREGAR OS DADOS DA TABELA (Ajustado para evitar erro de imagem)
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
            const preco = parseFloat(item.preco) || 0;
            const qtd = parseInt(item.pecaquantidade) || parseInt(item.quantidade) || 1;
            const subtotal = preco * qtd;

            // Se não tiver imagem, deixa vazio para não mostrar o ícone quebrado feio
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



async function finalizarCompraDefinitiva() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const selectPagamento = document.getElementById('select-pagamento-final');
    const formaPagamento = selectPagamento ? selectPagamento.value : 'Cartão'; 

    if (totalCompraGeral <= 0 || itensNoCarrinho.length === 0) {
        alert("⚠️ Adicione produtos ao carrinho antes de finalizar!");
        return;
    }

    const btnFinalizar = document.querySelector('.btn-finalizar-compra');
    if(btnFinalizar) {
        btnFinalizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        btnFinalizar.disabled = true;
    }

    try {
        let errosNaVenda = 0; 

        for (const item of itensNoCarrinho) {
            const qtdProduto = parseInt(item.pecaquantidade) || parseInt(item.quantidade) || 1;
            const precoProduto = parseFloat(item.preco) || 0;
            const valorTotalProduto = qtdProduto * precoProduto;

            // Mantivemos o 1 temporário para a venda passar, 
            // até você arrumar a rota de GET do carrinho no backend.
            const idDoProdutoReal = item.codigoproduto || 1; 

            // 📦 PACOTE EXATAMENTE IGUAL AO SEU BACKEND
            const payloadVenda = {
                codigoproduto: idDoProdutoReal, 
                pecaquantidade: qtdProduto,
                valortotal: valorTotalProduto,
                id_usuario: user.id, // SINGULAR! Igual ao seu req.body
                forma_pagamento: formaPagamento
            };

            console.log("📦 Pacote indo para o Render:", payloadVenda);

            const resVenda = await fetch(API_VENDAS, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'minha-chave': CLIENT_API_KEY
                },
                body: JSON.stringify(payloadVenda)
            });

            if (!resVenda.ok) {
                errosNaVenda++;
                console.error(`❌ Erro no servidor:`, await resVenda.text());
            }
            // 🚨 REMOVEMOS O DELETE DAQUI! 
            // O seu Backend (Node.js) já está deletando do carrinho automaticamente! 🎉
        }

        if (errosNaVenda === 0) {
            localStorage.removeItem('carrinho_bikes'); 
            alert("🎉 Compra finalizada com sucesso! Seu pedido foi gerado.");
            window.location.href = "../pedidos/pedidos.html"; 
        } else {
            alert(`⚠️ Tivemos erro em ${errosNaVenda} produto(s). Olhe o console.`);
            reabilitarBotaoCheckout(btnFinalizar);
        }

    } catch (err) {
        console.error("Erro fatal:", err);
        reabilitarBotaoCheckout(btnFinalizar);
    }
}

function reabilitarBotaoCheckout(botao) {
    if(botao) {
        botao.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar e Pagar';
        botao.disabled = false;
    }
}


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

        if (res.ok) {
            carregarTabelaDoCarrinho();
        } else {
            alert("Erro ao remover o item. Tente novamente.");
        }
    } catch (err) {
        console.error("Erro ao remover:", err);
    }
}
