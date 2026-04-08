// --- CONFIGURAÇÕES DE API ---
const API = "https://apiprojetointegrador.onrender.com/produtos";
const API_CARRINHO = "https://apiprojetointegrador.onrender.com/carrinho";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

// URL para imagens e Imagem Padrão
const URL_BASE_BACKEND = "https://apiprojetointegrador.onrender.com/uploads/"; 
const IMAGEM_PADRAO = "https://dummyimage.com/200x200/f4f6f8/ff6600.png&text=Sem+Foto";

// VARIÁVEIS GLOBAIS
let todosProdutos = []; // GUARDA TUDO QUE VEM DO BANCO AQUI!
let produtosFiltrados = [];
let carrinhoLocal = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
let paginaAtual = 1;
const itensPorPagina = 8;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    verificarAcesso();
    atualizarMenu();
    carregarCatalogo();
    
    document.getElementById('input-busca')?.addEventListener('input', aplicarFiltros);
    document.getElementById('input-preco')?.addEventListener('input', aplicarFiltros);
    document.getElementById('select-tipo')?.addEventListener('change', aplicarFiltros);
    document.getElementById('form-cadastro-produto')?.addEventListener('submit', salvarNovoProduto);
    
    document.getElementById('cad-imagem-url')?.addEventListener('input', function(e) {
        const img = document.getElementById('previa-img');
        if(img) {
            img.src = e.target.value;
            img.onerror = function() { 
                this.onerror = null; 
                this.src = IMAGEM_PADRAO; 
            };
        }
    });
});

// --- SEGURANÇA E ACESSO ---
function verificarAcesso() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!user) {
        alert("⚠️ Por favor, faça login para acessar o catálogo e fazer compras.");
        window.location.href = "../index/index.html";
    }
}

// --- GESTÃO DO MENU E MEUS PEDIDOS ---
function atualizarMenu() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const menuDireita = document.getElementById('menu-direita');
    const menuCentral = document.getElementById('menu-navegacao');
    const btnNovoProduto = document.getElementById('btn-abrir-cadastro');

    if (!user) return;

    if (user.perfil === "adm") {
        if (menuCentral) {
            menuCentral.innerHTML = `
                <li><a href="../index/index.html">Início</a></li>
                <li><a href="produto.html" class="ativo">Catálogo</a></li>
                <li><a href="../vendas/vendas.html">Vendas</a></li>
                <li><a href="../cliente/cliente.html">Clientes</a></li>
                <li><a href="../usuario/usuario.html">Usuários</a></li>
            `;
        }
        if (btnNovoProduto) btnNovoProduto.style.display = 'block';
    } else {
        if (menuCentral) {
            menuCentral.innerHTML = `
                <li><a href="../index/index.html">Início</a></li>
                <li><a href="produto.html" class="ativo">Catálogo</a></li>
                <li><a href="../pedidos/pedidos.html">Meus Pedidos</a></li>
            `;
        }
        if (btnNovoProduto) btnNovoProduto.style.display = 'none';
    }

    if (menuDireita) {
        menuDireita.innerHTML = `
            <li><a href="javascript:void(0)" onclick="abrirModalCarrinho()"><i class="fas fa-shopping-cart"></i> <span id="contagem-carrinho" style="background:var(--primaria); color:white; border-radius:50%; padding:2px 6px; font-size:0.8rem;">0</span></a></li>
            <li><a href="javascript:void(0)" onclick="logout()" style="color: #ff4444; font-weight:bold;"><i class="fas fa-sign-out-alt"></i> Sair (${user.nome.split(' ')[0]})</a></li>
        `;
    }
    atualizarContadorCarrinho();
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = "../index/index.html";
}

// --- CARREGAR CATÁLOGO ---
async function carregarCatalogo() {
    try {
        const res = await fetch(API, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const dados = await res.json();
        
        todosProdutos = Array.isArray(dados) ? dados.sort((a,b) => b.id - a.id) : [];
        produtosFiltrados = [...todosProdutos];
        
        popularFiltroCategorias();
        renderizarProdutos();
    } catch (err) {
        document.getElementById('catalogo-home').innerHTML = "<div class='carregando'>Erro ao carregar produtos.</div>";
    }
}

// --- RENDERIZAR VITRINE E PAGINAÇÃO ---
function renderizarProdutos(resetarPagina = false) {
    if (resetarPagina) paginaAtual = 1;
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    if (produtosFiltrados.length === 0) {
        grid.innerHTML = "<div class='carregando'>Nenhum produto encontrado com estes filtros.</div>";
        document.getElementById('paginacao-container').innerHTML = '';
        return;
    }

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const itensPagina = produtosFiltrados.slice(inicio, fim);

    grid.innerHTML = itensPagina.map(item => {
        const preco = parseFloat(item.preco || 0);
        
        let imgPath = IMAGEM_PADRAO;
        if (item.imagem && item.imagem.trim() !== "" && item.imagem !== 'undefined') {
            imgPath = item.imagem.startsWith('http') ? item.imagem : URL_BASE_BACKEND + item.imagem;
        }

        const nomeSeguro = item.nomeproduto ? item.nomeproduto.replace(/'/g, "\\'") : 'Produto';

        return `
            <div class="card-produto">
                <div class="img-box">
                    <img src="${imgPath}" onerror="this.onerror=null; this.src='${IMAGEM_PADRAO}'" alt="${item.nomeproduto}">
                </div>
                <div class="card-info">
                    <h3>${item.nomeproduto}</h3>
                    <p>${item.marcaproduto || '-'} | Tam: ${item.tamanhoproduto || '-'}</p>
                    <span class="preco">R$ ${preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <button class="btn-comprar" onclick="adicionarAoCarrinhoBanco('${item.codigoproduto}', '${nomeSeguro}', ${preco}, '${imgPath}')">
                    <i class="fas fa-cart-plus"></i> Comprar
                </button>
            </div>
        `;
    }).join('');

    renderizarControlesPaginacao();
}

function renderizarControlesPaginacao() {
    const container = document.getElementById('paginacao-container');
    if (!container) return;

    const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina);
    container.innerHTML = '';

    if (totalPaginas <= 1) return;

    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = `btn-pag ${i === paginaAtual ? 'ativo' : ''}`;
        btn.onclick = () => {
            paginaAtual = i;
            renderizarProdutos();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        container.appendChild(btn);
    }
}

// --- FILTROS ---
function aplicarFiltros() {
    const busca = document.getElementById('input-busca')?.value.toLowerCase() || "";
    const precoMax = parseFloat(document.getElementById('input-preco')?.value) || Infinity;
    const tipo = document.getElementById('select-tipo')?.value || "";

    produtosFiltrados = todosProdutos.filter(p => {
        const nomeMatch = p.nomeproduto ? p.nomeproduto.toLowerCase().includes(busca) : false;
        const marcaMatch = p.marcaproduto ? p.marcaproduto.toLowerCase().includes(busca) : false;
        const matchesBusca = nomeMatch || marcaMatch;
        const matchesPreco = parseFloat(p.preco || 0) <= (precoMax || Infinity);
        const matchesTipo = tipo === "" || p.tipoproduto === tipo;
        
        return matchesBusca && matchesPreco && matchesTipo;
    });

    renderizarProdutos(true);
}

function popularFiltroCategorias() {
    const select = document.getElementById('select-tipo');
    if (!select) return;
    const tipos = [...new Set(todosProdutos.map(p => p.tipoproduto))].filter(t => t);
    
    select.innerHTML = '<option value="">Todas as Categorias</option>' + 
        tipos.map(t => `<option value="${t}">${t}</option>`).join('');
}

// --- LÓGICA DO CARRINHO ---
async function adicionarAoCarrinhoBanco(codigoProduto, nome, preco, imagem) {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!user) return;

    const dadosApi = {
        id_usuario: parseInt(user.id),
        codigoproduto: parseInt(codigoProduto),
        pecaquantidade: 1
    };

    try {
        const response = await fetch(API_CARRINHO, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'minha-chave': CLIENT_API_KEY },
            body: JSON.stringify(dadosApi)
        });

        if (response.ok) {
            carrinhoLocal = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
            const existente = carrinhoLocal.find(i => i.nome === nome);
            if (existente) existente.quantidade++;
            else carrinhoLocal.push({ nome, preco: parseFloat(preco), imagem, quantidade: 1 });
            
            localStorage.setItem('carrinho_bikes', JSON.stringify(carrinhoLocal));
            
            showToast(`✅ ${nome} adicionado!`, "success");
            atualizarContadorCarrinho();
            
            if(document.getElementById('modal-carrinho').classList.contains('ativo')) {
                carregarItensCarrinhoBanco();
            }
        } else {
            const erro = await response.json();
            showToast(erro.mensagem || "Erro ao adicionar", "error");
        }
    } catch (err) {
        showToast("Erro de conexão", "error");
    }
}

async function carregarItensCarrinhoBanco() {
    const listaModal = document.getElementById('itens-carrinho');
    const totalElemento = document.getElementById('total-carrinho');
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!listaModal || !user) return;

    try {
        const res = await fetch(`${API_CARRINHO}/${user.id}`, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const dados = await res.json();
        
        listaModal.innerHTML = "";
        let total = 0;

        if (!dados || dados.length === 0) {
            listaModal.innerHTML = `<div class="carrinho-vazio"><i class="fas fa-box-open"></i><p>Seu carrinho está vazio.</p></div>`;
            if (totalElemento) totalElemento.innerText = "R$ 0,00";
            return;
        }

        dados.forEach(item => {
            const nome = item.nomeproduto || "Produto";
            const preco = parseFloat(item.preco) || 0;
            const qtd = parseInt(item.qtd || item.pecaquantidade) || 1;
            const subtotal = preco * qtd;
            
            // 🔥 O SEGREDO AQUI: Busca a imagem do catálogo original!
            // Procura na lista global de produtos um produto com o mesmo nome
            const produtoCatalogo = todosProdutos.find(p => p.nomeproduto === nome);
            
            // Pega a imagem que veio no carrinho OU pega a imagem do Catálogo
            let imagemCrua = (item.imagem && item.imagem !== 'undefined') ? item.imagem : (produtoCatalogo ? produtoCatalogo.imagem : null);
            
            let imgPath = IMAGEM_PADRAO;
            if (imagemCrua && imagemCrua.trim() !== "" && imagemCrua !== 'undefined') {
                imgPath = imagemCrua.startsWith('http') ? imagemCrua : URL_BASE_BACKEND + imagemCrua;
            }
            
            total += subtotal;

            listaModal.innerHTML += `
                <div class="item-cart">
                    <img src="${imgPath}" onerror="this.onerror=null; this.src='${IMAGEM_PADRAO}'">
                    <div>
                        <h5>${nome}</h5>
                        <small style="color:#888;">Qtd: ${qtd}x - R$ ${preco.toFixed(2)}</small><br>
                        <span class="preco-cart">R$ ${subtotal.toFixed(2)}</span>
                    </div>
                    <button class="btn-del-cart" onclick="removerItemCarrinhoBanco(${item.id_carrinho})"><i class="fas fa-trash"></i></button>
                </div>
            `;
        });

        if (totalElemento) totalElemento.innerText = `R$ ${total.toFixed(2)}`;
    } catch (err) {
        console.error("Erro ao carregar carrinho:", err);
    }
}

async function removerItemCarrinhoBanco(id_carrinho) {
    try {
        const res = await fetch(`${API_CARRINHO}/${id_carrinho}`, {
            method: 'DELETE',
            headers: { 'minha-chave': CLIENT_API_KEY }
        });
        if (res.ok) {
            carregarItensCarrinhoBanco();
            atualizarContadorCarrinho();
        }
    } catch (err) {
        console.error("Erro ao remover:", err);
    }
}

async function atualizarContadorCarrinho() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const contador = document.getElementById('contagem-carrinho');
    if (!user || !contador) return;

    try {
        const res = await fetch(`${API_CARRINHO}/${user.id}`, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const dados = await res.json();
        
        const totalItens = Array.isArray(dados) ? dados.reduce((sum, item) => sum + parseInt(item.qtd || item.pecaquantidade || 1), 0) : 0;
        contador.innerText = totalItens;
    } catch (err) {}
}

// --- CONTROLE DE MODAIS ---
function abrirModalCarrinho() {
    document.getElementById('modal-carrinho').classList.add('ativo');
    document.getElementById('overlay-carrinho').classList.add('ativo');
    carregarItensCarrinhoBanco();
}
function fecharModalCarrinho() {
    document.getElementById('modal-carrinho').classList.remove('ativo');
    document.getElementById('overlay-carrinho').classList.remove('ativo');
}

function abrirModalCadastro() {
    document.getElementById('modal-novo-produto').classList.add('ativo');
    document.getElementById('overlay-cadastro').classList.add('ativo');
}
function fecharModalCadastro() {
    document.getElementById('modal-novo-produto').classList.remove('ativo');
    document.getElementById('overlay-cadastro').classList.remove('ativo');
    document.getElementById('form-cadastro-produto').reset();
    document.getElementById('previa-img').src = IMAGEM_PADRAO;
}

// --- LÓGICA DO ADMINISTRADOR (SALVAR PRODUTO) ---
async function salvarNovoProduto(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const dadosApi = {
        nomeproduto: formData.get('nomeproduto'),
        tipoproduto: formData.get('tipoproduto'),
        preco: parseFloat(formData.get('preco').replace(',', '.')),
        tamanhoproduto: formData.get('tamanhoproduto'),
        marcaproduto: formData.get('marcaproduto'),
        codigoproduto: parseInt(formData.get('codigoproduto')),
        estoque: parseInt(formData.get('estoque')),
        imagem: formData.get('imagem')
    };

    try {
        const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'minha-chave': CLIENT_API_KEY },
            body: JSON.stringify(dadosApi)
        });

        if (res.ok) {
            showToast("Produto cadastrado com sucesso!", "success");
            fecharModalCadastro();
            carregarCatalogo();
        } else {
            showToast("Erro ao cadastrar. Verifique o código SKU.", "error");
        }
    } catch (err) {
        showToast("Erro de conexão com servidor.", "error");
    }
}

// --- SISTEMA DE TOAST (NOTIFICAÇÕES) ---
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
