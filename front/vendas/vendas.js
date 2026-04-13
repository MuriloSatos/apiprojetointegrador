const API = "https://apiprojetointegrador.onrender.com/vendas";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";
const URL_BASE_BACKEND = "https://apiprojetointegrador.onrender.com/uploads/"; 
const IMAGEM_PADRAO = "https://cdn-icons-png.flaticon.com/512/1055/1055185.png";

const listaPedidos = document.getElementById("lista-pedidos");
const loading = document.getElementById("loading");
const vazio = document.getElementById("vazio");
const inputPesquisa = document.getElementById("input-pesquisa");

let todasAsVendas = []; 

document.addEventListener("DOMContentLoaded", carregarVendas);

// FILTRO EM TEMPO REAL
inputPesquisa.addEventListener("input", (e) => {
    const termoDigitado = e.target.value.toLowerCase();
    
    const vendasFiltradas = todasAsVendas.filter(v => {
        const nome = (v.nomeproduto || "").toLowerCase();
        const codProd = (v.codigoproduto || "").toString().toLowerCase();
        const codVenda = (v.codigovendas || "").toString().toLowerCase();
        
        return nome.includes(termoDigitado) || codProd.includes(termoDigitado) || codVenda.includes(termoDigitado);
    });

    renderizarTabela(vendasFiltradas);
});

async function carregarVendas() {
    // Forçamos a busca total removendo a lógica de filtro por ID do cliente no fetch
    try {
        const res = await fetch(API, {
            headers: { "minha-chave": CLIENT_API_KEY }
        });
        
        todasAsVendas = await res.json();

        if (loading) loading.classList.add("hide");
        renderizarTabela(todasAsVendas);

    } catch (e) {
        console.error("Erro na API:", e);
        if (loading) loading.innerHTML = "Erro ao carregar as informações do servidor.";
    }
}

function renderizarTabela(vendasParaMostrar) {
    if (!listaPedidos) return;
    listaPedidos.innerHTML = "";

    if (!vendasParaMostrar || vendasParaMostrar.length === 0) {
        if (vazio) vazio.classList.remove("hide");
        return;
    }

    if (vazio) vazio.classList.add("hide");

    vendasParaMostrar.forEach(v => {
        const tr = document.createElement("tr");
        
        // Pegando os nomes que definimos no AS da query do backend
        const idVenda = v.venda_id || "N/A";
        const nomeProduto = v.nomeproduto || "Produto não identificado";
        const idProd = v.prod_id_venda || v.prod_id_estoque || "1";
        
        // Tratamento da Imagem
        let imgPath = IMAGEM_PADRAO;
        if (v.imagem && v.imagem !== 'null' && v.imagem !== 'undefined') {
            imgPath = v.imagem.startsWith('http') ? v.imagem : URL_BASE_BACKEND + v.imagem;
        }

        // --- CORREÇÃO DO VALOR (O PONTO CRÍTICO) ---
        let valorNumerico = 0;
        if (v.valortotal) {
            // Remove R$, espaços e converte vírgula em ponto para o JS entender como número
            let limpo = v.valortotal.toString().replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
            valorNumerico = parseFloat(limpo) || 0;
        }
        const valorFormatado = valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const dataFormatada = v.datavenda ? new Date(v.datavenda).toLocaleDateString('pt-BR') : "-";

        tr.innerHTML = `
            <td><strong>#${idVenda}</strong></td>
            <td style="display: flex; align-items: center; gap: 15px; text-align: left;">
                <img src="${imgPath}" onerror="this.src='${IMAGEM_PADRAO}'" 
                     style="width: 45px; height: 45px; object-fit: cover; border-radius: 5px; border: 1px solid #eee;">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 600;">${nomeProduto}</span>
                    <small style="color: #666;">ID Produto: ${idProd}</small>
                </div>
            </td>
            <td>${dataFormatada}</td>
            <td>${v.pecaquantidade || 1}x</td>
            <td>${v.forma_pagamento || "Cartão"}</td>
            <td style="color: #ff5e00; font-weight: bold;">${valorFormatado}</td>
            <td><span class="tag-status">${v.statusvenda || "Finalizado"}</span></td>
        `;
        
        listaPedidos.appendChild(tr);
    });
}