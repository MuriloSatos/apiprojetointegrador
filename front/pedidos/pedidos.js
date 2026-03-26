const API_VENDAS = "https://apiprojetointegrador.onrender.com/vendas";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

document.addEventListener('DOMContentLoaded', carregarMeusPedidos);

async function carregarMeusPedidos() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const corpoTabela = document.getElementById('tabela-corpo-pedidos');

    if (!user) {
        alert("Acesso negado. Faça login.");
        window.location.href = "../index/index.html";
        return;
    }

    try {
        const res = await fetch(API_VENDAS, {
            headers: { 'minha-chave': CLIENT_API_KEY }
        });
        const todasVendas = await res.json();

        // FILTRO: Só mostra vendas deste cliente específico
        const meusPedidos = todasVendas.filter(venda => venda.idcliente === user.id);

        if (meusPedidos.length === 0) {
            corpoTabela.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Nenhum pedido encontrado.</td></tr>";
            return;
        }

        corpoTabela.innerHTML = meusPedidos.map(p => `
            <tr>
                <td>${new Date(p.datavenda).toLocaleDateString('pt-BR')}</td>
                <td>Produto #${p.codigoproduto}</td>
                <td>${p.pecaquantidade}</td>
                <td>R$ ${parseFloat(p.valortotal).toFixed(2)}</td>
                <td>${p.forma_pagamento || 'N/A'}</td>
                <td><span class="status-badge status-concluido">${p.statusvenda || 'Concluído'}</span></td>
            </tr>
        `).join('');

    } catch (err) {
        console.error("Erro ao carregar pedidos:", err);
        corpoTabela.innerHTML = "<tr><td colspan='6'>Erro ao carregar dados.</td></tr>";
    }
}