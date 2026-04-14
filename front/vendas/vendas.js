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

// ==========================================
// SISTEMA DE PESQUISA (FILTRO EM TEMPO REAL)
// ==========================================
if(inputPesquisa) {
    inputPesquisa.addEventListener("input", (e) => {
        const termoDigitado = e.target.value.toLowerCase();
        const vendasFiltradas = todasAsVendas.filter(v => {
            const nome = (v.nomeproduto || "").toLowerCase();
            const codProd = (v.codigoproduto || "").toString().toLowerCase();
            const codVenda = (v.codigovendas || v.id || v.codigo || "").toString().toLowerCase();
            return nome.includes(termoDigitado) || codProd.includes(termoDigitado) || codVenda.includes(termoDigitado);
        });
        renderizarTabela(vendasFiltradas);
    });
}

// ==========================================
// FUNÇÃO PARA BUSCAR AS VENDAS NA API
// ==========================================
async function carregarVendas() {
    let ID_USUARIO_LOGADO = null; 
    let isAdm = false;

    // 1. VERIFICA QUEM ESTÁ LOGADO
    try {
        const user = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (user) {
            if (user.id) ID_USUARIO_LOGADO = parseInt(user.id);
            
            // VERIFICAÇÃO DE ADMIN (Ajuste conforme o seu banco de dados)
            if (user.tipo === 'adm' || user.tipo === 'admin' || user.isAdm === true || user.email === 'admin@bikepromax.com' || user.email === 'adm@bikepromax.com') {
                isAdm = true;
            }
        }
    } catch(e) {}

    // 2. MONTA O MENU DINAMICAMENTE (A Mágica acontece aqui!)
    const menuNavegacao = document.getElementById("menu-navegacao");
    const menuDireita = document.getElementById("menu-direita");

    if (isAdm) {
        // MENU DO ADMINISTRADOR
        if(menuNavegacao) {
            menuNavegacao.innerHTML = `
                <li><a href="../index/index.html">Início</a></li>
                <li><a href="../catalogo/catalogo.html">Catálogo</a></li>
                <li><a href="../vendas/vendas.html" style="color: #ff6b00; font-weight: 700;">Vendas</a></li>
                <li><a href="../usuarios/usuarios.html">Usuários</a></li>
            `;
        }
        if(menuDireita) {
            menuDireita.innerHTML = `
                <li><a href="#" onclick="sair()" style="color: #e74c3c; font-weight: bold;">➜ Sair</a></li>
            `;
        }

        // Muda os textos da tela para padrão Admin
        const titulo = document.getElementById("titulo-pagina");
        const subtitulo = document.getElementById("subtitulo-pagina");
        if(titulo) titulo.innerText = "Gestão de Vendas (Admin)";
        if(subtitulo) subtitulo.innerText = "Visualize e gerencie todas as vendas realizadas na BIKEPROMAX.";

    } else {
        // MENU DO CLIENTE COMUM
        if(menuNavegacao) {
            menuNavegacao.innerHTML = `
                <li><a href="../index/index.html">Início</a></li>
                <li><a href="../catalogo/catalogo.html">Catálogo</a></li>
                <li><a href="../vendas/vendas.html" style="color: #ff6b00; font-weight: 700;">Meus Pedidos</a></li>
            `;
        }
        if(menuDireita) {
            menuDireita.innerHTML = `
                <li><a href="../carrinho/carrinho.html" style="font-size: 1.1rem;">🛒 Carrinho</a></li>
                <li><a href="#" onclick="sair()" style="color: #e74c3c; font-weight: bold;">➜ Sair</a></li>
            `;
        }
    }

    // Fallback de segurança caso alguém acesse sem logar
    if (!ID_USUARIO_LOGADO && !isAdm) {
        ID_USUARIO_LOGADO = 25; // ID de teste
    }

    // 3. BUSCA OS DADOS NA API
    try {
        let urlFetch = isAdm ? API : `${API}?id_usuario=${ID_USUARIO_LOGADO}`;

        const res = await fetch(urlFetch, {
            headers: { "minha-chave": CLIENT_API_KEY }
        });
        
        todasAsVendas = await res.json();
        console.log("VENDAS ENCONTRADAS:", todasAsVendas);

        if (loading) loading.classList.add("hide");
        renderizarTabela(todasAsVendas);

    } catch (e) {
        console.error("Erro na API:", e);
        if (loading) loading.innerHTML = "Erro ao carregar as informações. Verifique se o servidor está online.";
    }
}

// Função de sair (Logout)
function sair() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = "../index/index.html"; // Redireciona para a home
}

// ==========================================
// FUNÇÃO PARA DESENHAR A TABELA
// ==========================================
function renderizarTabela(vendasParaMostrar) {
    if (!vendasParaMostrar || vendasParaMostrar.length === 0) {
        if (vazio) vazio.classList.remove("hide");
        if (listaPedidos) listaPedidos.innerHTML = "";
        return;
    }

    if (vazio) vazio.classList.add("hide");
    if (listaPedidos) listaPedidos.innerHTML = "";

    vendasParaMostrar.forEach(v => {
        const tr = document.createElement("tr");
        
        // Verifica vários nomes de ID para garantir que um deles funcione
        const idVenda = v.codigovendas || v.id || v.id_venda || v.codigo || "ERRO";
        const idProduto = v.codigoproduto || v.produto_id || "S/N";
        const nomeProduto = v.nomeproduto || `Produto Cód: ${idProduto}`;
        
        let imgPath = IMAGEM_PADRAO;
        if (v.imagem && v.imagem.trim() !== "" && v.imagem !== 'undefined') {
            imgPath = v.imagem.startsWith('http') ? v.imagem : URL_BASE_BACKEND + v.imagem;
        }

        let dataFormatada = "-";
        if (v.datavenda) {
            const dataObj = new Date(v.datavenda);
            dataFormatada = dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); 
        }

        let valorFormatado = "R$ 0,00";
        if (v.valortotal !== null && v.valortotal !== undefined) {
            let stringValor = v.valortotal.toString().replace(/[^0-9.,-]+/g, "");
            if (stringValor.includes(',')) stringValor = stringValor.replace(/\./g, "").replace(',', '.');
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

        let pagamento = v.forma_pagamento || "Cartão";

        tr.innerHTML = `
            <td><strong>#${idVenda}</strong></td>
            
            <td style="display: flex; align-items: center; gap: 15px; text-align: left; min-width: 250px;">
                <img src="${imgPath}" onerror="this.src='${IMAGEM_PADRAO}'" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; background: #fff; padding: 2px; border: 1px solid #ddd;">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 600; font-size: 0.95rem; color: #222;">${nomeProduto}</span>
                    <span style="font-size: 0.8rem; color: #888;">Cód: ${idProduto}</span>
                </div>
            </td>

            <td>${dataFormatada}</td>
            <td>${v.pecaquantidade || 1}x</td>
            <td>${pagamento}</td>
            <td class="valor-destaque">${valorFormatado}</td>
            <td><span class="${classeStatus}">${textoStatus}</span></td>
        `;
        
        listaPedidos.appendChild(tr);
    });
}
