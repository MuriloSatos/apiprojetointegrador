const API = "https://apiprojetointegrador.onrender.com/vendas";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";
const ID_USUARIO_LOGADO = 25; // O ID do cliente de teste

const listaPedidos = document.getElementById("lista-pedidos");
const loading = document.getElementById("loading");
const vazio = document.getElementById("vazio");

// Inicia a busca assim que a tela abre
document.addEventListener("DOMContentLoaded", carregarMeusPedidos);

async function carregarMeusPedidos() {
    try {
        const res = await fetch(`${API}?limit=100&offset=0`, {
            headers: { "minha-chave": CLIENT_API_KEY }
        });

        const todasVendas = await res.json();
        
        // FILTRO: Pega APENAS as compras onde a coluna id_usuario for igual a 25
        const minhasVendas = todasVendas.filter(venda => venda.id_usuario === ID_USUARIO_LOGADO);

        loading.classList.add("hide"); // Esconde a mensagem de "Buscando..."

        if (minhasVendas.length === 0) {
            vazio.classList.remove("hide"); // Mostra que está vazio se não achar nada
            return;
        }

        // Para cada venda encontrada, cria uma linha na tabela
        minhasVendas.forEach(venda => criarLinhaTabela(venda));

    } catch (e) {
        console.error("Erro ao conectar na API:", e);
        loading.innerHTML = "Erro ao carregar seus pedidos. Tente novamente.";
    }
}

function criarLinhaTabela(v) {
    const tr = document.createElement("tr");
    
    // 1. Tratamento da DATA (Formata do banco para DD/MM/AAAA)
    let dataFormatada = "-";
    if (v.datavenda) {
        const dataObj = new Date(v.datavenda);
        // O timeZone UTC previne que o navegador atrase a data em 1 dia
        dataFormatada = dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); 
    }

    // 2. Tratamento do VALOR (Como no banco é 'money', limpamos e formatamos para R$)
    let valorFormatado = "R$ 0,00";
    if (v.valortotal) {
        let valorTratado = v.valortotal.toString().replace(/[^0-9.,-]+/g, "");
        valorTratado = valorTratado.replace(',', '.'); 
        
        let valorNumerico = parseFloat(valorTratado);
        if (!isNaN(valorNumerico)) {
            valorFormatado = valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        } else {
            valorFormatado = v.valortotal; 
        }
    }
    
    // 3. Status visual
    let classeStatus = "tag-status processando";
    let textoStatus = v.statusvenda ? v.statusvenda : "Processando";
    
    const statusMinusculo = textoStatus.toLowerCase();
    if (statusMinusculo.includes("concluíd") || statusMinusculo.includes("pago") || statusMinusculo.includes("aprovad")) {
        classeStatus = "tag-status concluido";
    }

    // 4. Forma de pagamento
    let pagamento = v.forma_pagamento ? v.forma_pagamento : "-";

    // 5. Monta a linha HTML baseada exatamentes nos nomes do seu banco
    tr.innerHTML = `
        <td><strong>#${v.codigovendas}</strong></td>
        <td>Cód: ${v.codigoproduto}</td>
        <td>${dataFormatada}</td>
        <td>${v.pecaquantidade}x</td>
        <td>${pagamento}</td>
        <td class="valor-destaque">${valorFormatado}</td>
        <td><span class="${classeStatus}">${textoStatus}</span></td>
    `;
    
    listaPedidos.appendChild(tr);
}
