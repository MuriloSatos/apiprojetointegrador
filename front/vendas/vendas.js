const API = "https://apiprojetointegrador.onrender.com/vendas";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

// URL Base para buscar a imagem do banco e imagem padrão
const URL_BASE_BACKEND = "https://apiprojetointegrador.onrender.com/uploads/"; 
const IMAGEM_PADRAO = "https://cdn-icons-png.flaticon.com/512/1055/1055185.png";

const listaPedidos = document.getElementById("lista-pedidos");
const loading = document.getElementById("loading");
const vazio = document.getElementById("vazio");

// Inicia a busca assim que a tela abre
document.addEventListener("DOMContentLoaded", carregarMeusPedidos);

async function carregarMeusPedidos() {
    // Busca o usuário logado. Se não achar, usa o 25 para seus testes.
    let ID_USUARIO_LOGADO = 25; 
    try {
        const user = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (user && user.id) {
            ID_USUARIO_LOGADO = parseInt(user.id);
        }
    } catch(e) {}

    try {
        // Agora só precisamos fazer UMA chamada à API. Ela já vem completa!
        const res = await fetch(`${API}?limit=100&offset=0`, {
            headers: { "minha-chave": CLIENT_API_KEY }
        });
        
        const todasVendas = await res.json();
        console.log("FOFOCA DA API:", todasVendas); // <-- ADICIONE ESTA LINHA

        
        // Filtra para o usuário atual
        const minhasVendas = todasVendas.filter(venda => parseInt(venda.id_usuario) === ID_USUARIO_LOGADO);

        loading.classList.add("hide");

        if (minhasVendas.length === 0) {
            vazio.classList.remove("hide");
            return;
        }

        // Cria a tabela
        minhasVendas.forEach(venda => criarLinhaTabela(venda));

    } catch (e) {
        console.error("Erro na API:", e);
        loading.innerHTML = "Erro ao carregar seus pedidos. Atualize a página.";
    }
}

function criarLinhaTabela(v) {
    const tr = document.createElement("tr");
    
    // ==========================================
    // 1. DADOS QUE VIERAM DO NOSSO NOVO SELECT
    // ==========================================
    const nomeProduto = v.nomeproduto ? v.nomeproduto : `Produto Cód: ${v.codigoproduto}`;
    
    let imgPath = IMAGEM_PADRAO;
    if (v.imagem && v.imagem.trim() !== "" && v.imagem !== 'undefined') {
        imgPath = v.imagem.startsWith('http') ? v.imagem : URL_BASE_BACKEND + v.imagem;
    }

    // ==========================================
    // 2. FORMATAÇÕES DE DATA, VALOR E STATUS
    // ==========================================
    let dataFormatada = "-";
    if (v.datavenda) {
        const dataObj = new Date(v.datavenda);
        dataFormatada = dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); 
    }

    let valorFormatado = "R$ 0,00";
    if (v.valortotal !== null && v.valortotal !== undefined) {
        let stringValor = v.valortotal.toString().replace(/[^0-9.,-]+/g, "");
        if (stringValor.includes(',')) {
            stringValor = stringValor.replace(/\./g, "").replace(',', '.');
        }
        let valorNumerico = parseFloat(stringValor);
        if (!isNaN(valorNumerico)) {
            valorFormatado = valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        } else {
            valorFormatado = v.valortotal; 
        }
    }
    
    let textoStatus = v.statusvenda || "Processando";
    let classeStatus = "tag-status processando";
    if (textoStatus.toLowerCase().match(/concluíd|pago|aprovad|finalizad/)) {
        classeStatus = "tag-status concluido";
    }

    let pagamento = v.forma_pagamento || "-";

    // ==========================================
    // 3. MONTAR O HTML DA LINHA
    // ==========================================
    tr.innerHTML = `
        <td><strong>#${v.codigovendas || "-"}</strong></td>
        
        <td style="display: flex; align-items: center; gap: 15px; text-align: left; min-width: 250px;">
            <img src="${imgPath}" onerror="this.src='${IMAGEM_PADRAO}'" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; background: #fff; padding: 2px; border: 1px solid #ddd;">
            <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 600; font-size: 0.95rem; color: #222;">${nomeProduto}</span>
                <span style="font-size: 0.8rem; color: #888;">Cód: ${v.codigoproduto}</span>
            </div>
        </td>

        <td>${dataFormatada}</td>
        <td>${v.pecaquantidade || 1}x</td>
        <td>${pagamento}</td>
        <td class="valor-destaque">${valorFormatado}</td>
        <td><span class="${classeStatus}">${textoStatus}</span></td>
    `;
    
    listaPedidos.appendChild(tr);
}
