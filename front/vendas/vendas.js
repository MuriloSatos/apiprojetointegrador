const API = "https://apiprojetointegrador.onrender.com/vendas";
const API_USUARIOS = "https://apiprojetointegrador.onrender.com/usuarios"; 
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";
const URL_BASE_BACKEND = "https://apiprojetointegrador.onrender.com/uploads/"; 
const IMAGEM_PADRAO = "https://cdn-icons-png.flaticon.com/512/1055/1055185.png";

const listaPedidos = document.getElementById("lista-pedidos");
const loading = document.getElementById("loading");
const vazio = document.getElementById("vazio");
const inputPesquisa = document.getElementById("input-pesquisa");

let todasAsVendas = []; 
let mapaUsuarios = {}; 

document.addEventListener("DOMContentLoaded", carregarVendas);

// SISTEMA DE PESQUISA
if(inputPesquisa) {
    inputPesquisa.addEventListener("input", (e) => {
        const termoDigitado = e.target.value.toLowerCase();
        const vendasFiltradas = todasAsVendas.filter(v => {
            const nomeProduto = (v.nomeproduto || "").toLowerCase();
            const codProd = (v.codigoproduto || "").toString().toLowerCase();
            const codVenda = (v.codigovendas || "").toString().toLowerCase();
            const idUsuario = (v.id_usuario || "").toString().toLowerCase();
            
            const nomeCliente = (mapaUsuarios[v.id_usuario] || "").toLowerCase();
            
            return nomeProduto.includes(termoDigitado) || 
                   codProd.includes(termoDigitado) || 
                   codVenda.includes(termoDigitado) || 
                   idUsuario.includes(termoDigitado) ||
                   nomeCliente.includes(termoDigitado);
        });
        renderizarTabela(vendasFiltradas);
    });
}

async function buscarNomesDosUsuarios() {
    try {
        const res = await fetch(API_USUARIOS, {
            headers: { "minha-chave": CLIENT_API_KEY }
        });
        if (res.ok) {
            const usuarios = await res.json();
            usuarios.forEach(u => {
                const id = u.id || u.id_usuario; 
                const nome = u.nome || u.nomeusuario || u.email || "Cliente Desconhecido";
                
                if (id) {
                    mapaUsuarios[id] = nome; 
                }
            });
        }
    } catch (error) {
        console.warn("Aviso: Não foi possível carregar a lista de usuários.", error);
    }
}

async function carregarVendas() {
    let ID_USUARIO_LOGADO = null; 
    let isAdm = false;
    let dadosUsuario = null;

    try {
        dadosUsuario = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (dadosUsuario) {
            ID_USUARIO_LOGADO = parseInt(dadosUsuario.id);
            if (dadosUsuario.perfil === 'adm' || dadosUsuario.email === 'adm@gmail.com') {
                isAdm = true;
            }
        }
    } catch(e) {}

    // MENU CONFIGURATION
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

    // BUSCANDO OS DADOS NA API
    try {
        if (isAdm) {
            await buscarNomesDosUsuarios();
        } else if (dadosUsuario) {
            mapaUsuarios[ID_USUARIO_LOGADO] = dadosUsuario.nome || dadosUsuario.nomeusuario || "Você";
        }

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

function extrairPreco(valor) {
    if (!valor) return 0;
    if (typeof valor === 'number') return valor;
    let stringValor = valor.toString().replace(/[^0-9.,-]+/g, "");
    if (stringValor.includes(',')) stringValor = stringValor.replace(/\./g, "").replace(',', '.');
    let valorNumerico = parseFloat(stringValor);
    return isNaN(valorNumerico) ? 0 : valorNumerico;
}

// ==========================================
// RENDERIZAR TABELA
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
        let idCheckout = v.codigovendas; 
        let pagamentoLimpo = pagamentoOriginal;

        if (pagamentoOriginal.includes('_')) {
            const partes = pagamentoOriginal.split('_');
            pagamentoLimpo = partes[0]; 
            idCheckout = partes[1];     
        }

        const chavePedido = idCheckout;
        
        if (!gruposDePedidos[chavePedido]) {
            // 🌟 AQUI NÓS ESTAMOS CAPTURANDO O CPF E O ENDEREÇO DA API
            gruposDePedidos[chavePedido] = {
                idPedido: v.codigovendas,
                id_usuario: v.id_usuario, 
                datavenda: v.datavenda,
                forma_pagamento: pagamentoLimpo,
                statusvenda: v.statusvenda,
                cpf: v.cpf_cliente || v.cpf || "Não informado", // <-- Pega o CPF
                endereco: v.endereco_entrega || v.endereco || "Não informado", // <-- Pega o Endereço
                valorTotalPedido: 0,
                qtdTotalItens: 0,
                produtos: []
            };
        }

        gruposDePedidos[chavePedido].produtos.push(v);
        gruposDePedidos[chavePedido].valorTotalPedido += extrairPreco(v.valortotal);
        gruposDePedidos[chavePedido].qtdTotalItens += parseInt(v.pecaquantidade || 1);
    });

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
                        <span style="font-size: 0.8rem; color: #888;">Cód: ${p.codigoproduto || "S/N"}</span>
                    </div>
                </div>
            `;
        });
        htmlProdutosDoPedido += `</div>`;

        let dataFormatada = "-";
        if (pedido.datavenda) {
            const dataObj = new Date(pedido.datavenda);
            if(!isNaN(dataObj)) {
                dataFormatada = dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); 
            }
        }

        let valorFormatado = pedido.valorTotalPedido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        let textoStatus = pedido.statusvenda ? pedido.statusvenda : "Pendente"; 
        let classeStatus = "tag-status processando";
        
        if (textoStatus.toLowerCase().match(/concluíd|pago|aprovad|finalizad|entregue/)) {
            classeStatus = "tag-status concluido";
        }

        const nomeDoCliente = mapaUsuarios[pedido.id_usuario] || "Cliente Não Encontrado";

        // 🌟 NOVO DESIGN DA CÉLULA: MOSTRA NOME, CPF E ENDEREÇO
        tr.innerHTML = `
            <td style="vertical-align: middle;"><strong>#${pedido.idPedido || "-"}</strong></td>
            
            <td style="vertical-align: middle; min-width: 220px;">
                <div style="display: flex; flex-direction: column; gap: 5px; text-align: left;">
                    <span style="font-weight: bold; font-size: 0.95rem; color: #222;">👤 ${nomeDoCliente}</span>
                    <span style="font-size: 0.8rem; color: #555;">
                        <i class="fas fa-id-card" style="color: #ff5e00; width: 14px;"></i> <strong>CPF:</strong> ${pedido.cpf}
                    </span>
                    <span style="font-size: 0.8rem; color: #555; word-break: break-word;">
                        <i class="fas fa-map-marker-alt" style="color: #ff5e00; width: 14px;"></i> <strong>Entrega:</strong> ${pedido.endereco}
                    </span>
                </div>
            </td>

            <td style="vertical-align: middle; min-width: 250px;">${htmlProdutosDoPedido}</td>
            <td style="vertical-align: middle;">${dataFormatada}</td>
            <td style="vertical-align: middle; text-align: center;"><strong>${pedido.qtdTotalItens}</strong></td>
            <td style="vertical-align: middle;">${pedido.forma_pagamento || "N/A"}</td>
            <td style="vertical-align: middle; color: #ff5e00; font-weight: bold; font-size: 1.1rem;">${valorFormatado}</td>
            <td style="vertical-align: middle;"><span class="${classeStatus}">${textoStatus}</span></td>
        `;
        
        listaPedidos.appendChild(tr);
    });
}
