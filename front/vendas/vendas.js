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

// SISTEMA DE PESQUISA (Agora pesquisa dentro dos pedidos agrupados)
if(inputPesquisa) {
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
}

// FUNÇÃO PRINCIPAL
async function carregarVendas() {
    let ID_USUARIO_LOGADO = null; 
    let isAdm = false;

    try {
        const user = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (user) {
            ID_USUARIO_LOGADO = parseInt(user.id);
            if (user.perfil === 'adm' || user.email === 'adm@gmail.com') {
                isAdm = true;
            }
        }
    } catch(e) {}

    // 2. CORREÇÃO DO MENU: Agora apontamos para as classes corretas do HTML!
    setTimeout(() => {
        const navLinks = document.querySelector(".nav-links");
        const navExtras = document.querySelector(".nav-extras");

        if (isAdm) {
            if(navLinks) {
                navLinks.innerHTML = `
                    <a href="../index/index.html">Início</a>
                    <a href="../produto/produto.html">Catálogo</a>
                    <a href="../vendas/vendas.html" class="active" style="color: #ff5e00; font-weight: bold;">Vendas da Loja</a>
                    <a href="../usuario/usuario.html">Usuários</a>
                `;
            }
            if(navExtras) {
                navExtras.innerHTML = `<a href="#" onclick="sair()" class="sair-link" style="color: #e74c3c;">➜ Sair</a>`;
            }
        } else {
            if(navLinks) {
                navLinks.innerHTML = `
                    <a href="../index/index.html">Início</a>
                    <a href="../produto/produto.html">Catálogo</a>
                    <a href="../vendas/vendas.html" class="active" style="color: #ff5e00; font-weight: bold;">Meus Pedidos</a>
                `;
            }
            if(navExtras) {
                navExtras.innerHTML = `
                    <a href="../carrinho/carrinho.html" class="cart-link">🛒</a>
                    <a href="#" onclick="sair()" class="sair-link" style="color: #e74c3c;">➜ Sair</a>
                `;
            }
        }
    }, 100);


    // 3. BUSCANDO OS DADOS NA API
    try {
        let urlFetch = isAdm ? API : `${API}?id_usuario=${ID_USUARIO_LOGADO || 0}`;

        const res = await fetch(urlFetch, {
            headers: { "minha-chave": CLIENT_API_KEY }
        });
        
        todasAsVendas = await res.json();

        if (loading) loading.classList.add("hide");
        renderizarTabela(todasAsVendas);

    } catch (e) {
        console.error("Erro na API:", e);
        if (loading) loading.innerHTML = "Erro ao carregar as informações.";
    }
}

function sair() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = "../index/index.html";
}

// Função para garantir que os cálculos não deem erro de Matemática
function extrairPreco(valor) {
    if (!valor) return 0;
    if (typeof valor === 'number') return valor;
    let stringValor = valor.toString().replace(/[^0-9.,-]+/g, "");
    if (stringValor.includes(',')) stringValor = stringValor.replace(/\./g, "").replace(',', '.');
    let valorNumerico = parseFloat(stringValor);
    return isNaN(valorNumerico) ? 0 : valorNumerico;
}

// ==========================================
// A MÁGICA: AGRUPAMENTO VENDA POR VENDA
// ==========================================
function renderizarTabela(vendasParaMostrar) {
    if (!vendasParaMostrar || vendasParaMostrar.length === 0) {
        if (vazio) vazio.classList.remove("hide");
        if (listaPedidos) listaPedidos.innerHTML = "";
        return;
    }

    if (vazio) vazio.classList.add("hide");
    if (listaPedidos) listaPedidos.innerHTML = "";

    const gruposDePedidos = {};

    vendasParaMostrar.forEach(v => {
        let pagamentoOriginal = v.forma_pagamento || "Cartão";
        let idCheckout = v.codigovendas; // Se for compra antiga, separa por produto
        let pagamentoLimpo = pagamentoOriginal;

        // SEGREDO: Desempacotando o "Pix_1713289123456"
        if (pagamentoOriginal.includes('_')) {
            const partes = pagamentoOriginal.split('_');
            pagamentoLimpo = partes[0]; // Guarda só o "Pix"
            idCheckout = partes[1];     // Guarda o ID único "1713289123456"
        }

        // A Chave para agrupar agora é o MOMENTO EXATO da compra!
        const chavePedido = idCheckout;
        
        if (!gruposDePedidos[chavePedido]) {
            gruposDePedidos[chavePedido] = {
                idPedido: v.codigovendas, // O ID do primeiro produto vira o Nº do Pedido
                datavenda: v.datavenda,
                forma_pagamento: pagamentoLimpo,
                statusvenda: v.statusvenda,
                valorTotalPedido: 0,
                qtdTotalItens: 0,
                produtos: []
            };
        }

        // Adiciona o produto na caixa daquela compra específica
        gruposDePedidos[chavePedido].produtos.push(v);
        gruposDePedidos[chavePedido].valorTotalPedido += extrairPreco(v.valortotal);
        gruposDePedidos[chavePedido].qtdTotalItens += parseInt(v.pecaquantidade || 1);
    });

    // 2. DESENHANDO OS PEDIDOS SEPARADOS NA TELA
    Object.values(gruposDePedidos).forEach(pedido => {
        const tr = document.createElement("tr");
        
        let htmlProdutosDoPedido = `<div style="display: flex; flex-direction: column; gap: 15px; padding: 10px 0;">`;
        
        pedido.produtos.forEach(p => {
            const nomeProduto = p.nomeproduto || `Produto (Cód: ${p.codigoproduto})`;
            let imgPath = IMAGEM_PADRAO;
            if (p.imagem && p.imagem.trim() !== "" && p.imagem !== 'undefined') {
                imgPath = p.imagem.startsWith('http') ? p.imagem : URL_BASE_BACKEND + p.imagem;
            }

            htmlProdutosDoPedido += `
                <div style="display: flex; align-items: center; gap: 15px; text-align: left;">
                    <img src="${imgPath}" onerror="this.src='${IMAGEM_PADRAO}'" style="width: 45px; height: 45px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 600; font-size: 0.95rem; color: #222;">
                            ${nomeProduto} <strong style="color: #ff5e00; font-size: 0.9rem;">(x${p.pecaquantidade || 1})</strong>
                        </span>
                        <span style="font-size: 0.8rem; color: #888;">Cód do Produto: ${p.codigoproduto || "S/N"}</span>
                    </div>
                </div>
            `;
        });
        htmlProdutosDoPedido += `</div>`;

        let dataFormatada = "-";
        if (pedido.datavenda) {
            const dataObj = new Date(pedido.datavenda);
            dataFormatada = dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); 
        }

        let valorFormatado = pedido.valorTotalPedido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        let textoStatus = pedido.statusvenda || "Processando";
        let classeStatus = "tag-status processando";
        if (textoStatus.toLowerCase().match(/concluíd|pago|aprovad|finalizad/)) {
            classeStatus = "tag-status concluido";
        }

        tr.innerHTML = `
            <td style="vertical-align: middle;"><strong>#${pedido.idPedido || "ERRO"}</strong></td>
            <td style="vertical-align: middle; min-width: 250px;">${htmlProdutosDoPedido}</td>
            <td style="vertical-align: middle;">${dataFormatada}</td>
            <td style="vertical-align: middle;"><strong>${pedido.qtdTotalItens}</strong></td>
            <td style="vertical-align: middle;">${pedido.forma_pagamento || "Cartão"}</td>
            <td style="vertical-align: middle; color: #ff5e00; font-weight: bold; font-size: 1.1rem;">${valorFormatado}</td>
            <td style="vertical-align: middle;"><span class="${classeStatus}">${textoStatus}</span></td>
        `;
        
        listaPedidos.appendChild(tr);
    });
}
