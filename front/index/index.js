// --- CONFIGURAÇÕES DE API ---
const API = "https://apiprojetointegrador.onrender.com/produtos";
const API_LOGIN = "https://apiprojetointegrador.onrender.com/usuarios";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

// URL para imagens que vêm apenas com o nome do arquivo do banco
const URL_BASE_BACKEND = "https://apiprojetointegrador.onrender.com/uploads/"; 

// Imagem padrão caso o produto não tenha foto (ícone de caixinha)
const IMAGEM_PADRAO = "https://cdn-icons-png.flaticon.com/512/1055/1055185.png";

let carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    atualizarMenu();
    carregarDestaques();
});

// --- GESTÃO DO MENU E LOGIN ---
function atualizarMenu() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const menuCentral = document.getElementById('menu-navegacao');
    const menuDireita = document.getElementById('menu-direita');

    let linksPrincipais = `
        <li><a href="index.html">Início</a></li>
        <li><a href="../produto/produto.html">Catálogo</a></li>
    `;

    if (!user) {
        if (menuCentral) menuCentral.innerHTML = linksPrincipais;
        if (menuDireita) {
            menuDireita.innerHTML = `
                <li><a href="javascript:void(0)" onclick="abrirModalCarrinho()"><i class="fas fa-shopping-cart"></i> <span id="contagem-carrinho" style="background:var(--primaria); color:white; border-radius:50%; padding:2px 6px; font-size:0.8rem;">0</span></a></li>
                <li><a href="javascript:void(0)" class="btn-login-nav" onclick="abrirModalLogin()"><i class="fas fa-user"></i> Entrar</a></li>
            `;
        }
    } else {
        let linksExtras = "";
        if (user.perfil === "adm") {
            linksExtras = `
                <li><a href="../vendas/vendas.html">Vendas</a></li>
                <li><a href="../cliente/cliente.html">Clientes</a></li>
                <li><a href="../usuario/usuario.html">Usuários</a></li>
            `;
        } else {
            linksExtras = `<li><a href="../pedidos/pedidos.html">Meus Pedidos</a></li>`;
        }

        if (menuCentral) menuCentral.innerHTML = linksPrincipais + linksExtras;
        if (menuDireita) {
            menuDireita.innerHTML = `
                <li><a href="javascript:void(0)" onclick="abrirModalCarrinho()"><i class="fas fa-shopping-cart"></i> <span id="contagem-carrinho" style="background:var(--primaria); color:white; border-radius:50%; padding:2px 6px; font-size:0.8rem;">0</span></a></li>
                <li><a href="javascript:void(0)" onclick="logout()" style="color: #ff4444; font-weight:bold;"><i class="fas fa-sign-out-alt"></i> Sair (${user.nome.split(' ')[0]})</a></li>
            `;
        }
    }
    atualizarContador();
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.reload();
}

// --- CARREGAR PRODUTOS EM DESTAQUE ---
async function carregarDestaques() {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    try {
        grid.innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>Carregando máquinas...</p>";
        const res = await fetch(API, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const dados = await res.json();
        grid.innerHTML = "";

        const produtosOrdenados = dados.sort((a, b) => a.id - b.id);
        const destaques = produtosOrdenados.slice(0, 4);

        destaques.forEach(bike => {
            const preco = parseFloat(bike.preco || 0);
            
            // TRATAMENTO DA IMAGEM
            let imgPath = IMAGEM_PADRAO;
            if (bike.imagem && bike.imagem.trim() !== "" && bike.imagem !== 'undefined') {
                // Se a imagem já for um link http, usa ele, senão junta com a URL do seu backend
                imgPath = bike.imagem.startsWith('http') ? bike.imagem : URL_BASE_BACKEND + bike.imagem;
            }

            const card = document.createElement('div');
            card.className = 'card-produto';
            card.innerHTML = `
                <div class="img-box">
                    <img src="${imgPath}" onerror="this.src='${IMAGEM_PADRAO}'" alt="${bike.nomeproduto}">
                </div>
                <div class="card-info">
                    <h3>${bike.nomeproduto || 'Bicicleta Premium'}</h3>
                    <span class="preco">R$ ${preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <button class="btn-comprar" onclick="adicionarAoCarrinho('${bike.nomeproduto.replace(/'/g, "\\'")}', ${preco}, '${imgPath}')">
                    <i class="fas fa-cart-plus"></i> Adicionar
                </button>
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        console.error("Erro ao buscar destaques:", e);
        grid.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:red;'>Erro ao carregar o catálogo.</p>";
    }
}

// --- CARRINHO DE COMPRAS LOCAL ---
function adicionarAoCarrinho(nome, preco, imagem) {
    carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
    const itemExistente = carrinho.find(item => item.nome === nome);

    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ nome, preco: parseFloat(preco), imagem, quantidade: 1 });
    }

    localStorage.setItem('carrinho_bikes', JSON.stringify(carrinho));
    atualizarContador();
    showToast(`${nome} adicionado!`, "info", "fa-check-circle");
    
    if(document.getElementById('modal-carrinho').classList.contains('ativo')) {
        renderizarCarrinhoNoModal();
    }
}

function atualizarContador() {
    const c = document.getElementById('contagem-carrinho');
    if (c) c.innerText = carrinho.reduce((t, i) => t + i.quantidade, 0);
}

// --- CONTROLES DE MODAIS ---
function abrirModalCarrinho() {
    document.getElementById('modal-carrinho').classList.add('ativo');
    document.getElementById('overlay-carrinho').classList.add('ativo');
    renderizarCarrinhoNoModal();
}

function fecharModalCarrinho() {
    document.getElementById('modal-carrinho').classList.remove('ativo');
    document.getElementById('overlay-carrinho').classList.remove('ativo');
}

function abrirModalLogin() {
    document.getElementById('modal-login').classList.add('ativo');
    document.getElementById('overlay-login').classList.add('ativo');
    alternarTela('login');
}

function fecharModalLogin() {
    document.getElementById('modal-login').classList.remove('ativo');
    document.getElementById('overlay-login').classList.remove('ativo');
}

function alternarTela(tela) {
    document.getElementById('secao-login').style.display = tela === 'login' ? 'block' : 'none';
    document.getElementById('secao-cadastro').style.display = tela === 'cadastro' ? 'block' : 'none';
    document.getElementById('secao-esqueci').style.display = tela === 'esqueci' ? 'block' : 'none';
}

// --- RENDERIZAR CARRINHO NO MODAL ---
function renderizarCarrinhoNoModal() {
    const listaModal = document.getElementById('itens-carrinho');
    const totalElemento = document.getElementById('total-carrinho');
    if (!listaModal) return;

    carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
    listaModal.innerHTML = "";

    if (carrinho.length === 0) {
        listaModal.innerHTML = `<div class="carrinho-vazio"><i class="fas fa-box-open"></i><p>Seu carrinho está vazio.</p></div>`;
        if (totalElemento) totalElemento.innerText = "R$ 0,00";
        return;
    }

    let htmlCarrinho = "";
    let total = 0;

    carrinho.forEach((item, index) => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;
        
        // Garante a imagem no carrinho
        const imgCarrinho = item.imagem && item.imagem.includes('http') ? item.imagem : IMAGEM_PADRAO;

        htmlCarrinho += `
            <div class="item-cart">
                <img src="${imgCarrinho}" onerror="this.src='${IMAGEM_PADRAO}'">
                <div>
                    <h5>${item.nome}</h5>
                    <small style="color:#888;">Qtd: ${item.quantidade}x - R$ ${item.preco.toFixed(2)}</small><br>
                    <span class="preco-cart">R$ ${subtotal.toFixed(2)}</span>
                </div>
                <button class="btn-del-cart" onclick="removerDoCarrinho(${index})"><i class="fas fa-trash"></i></button>
            </div>
        `;
    });

    listaModal.innerHTML = htmlCarrinho;
    if (totalElemento) totalElemento.innerText = `R$ ${total.toFixed(2)}`;
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    localStorage.setItem('carrinho_bikes', JSON.stringify(carrinho));
    atualizarContador();
    renderizarCarrinhoNoModal();
}

// --- AUTENTICAÇÃO ---
document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aguarde...';

    const emailInput = document.getElementById('login-email').value.trim();
    const senhaInput = document.getElementById('login-senha').value.trim();

    try {
        const url = `${API_LOGIN}?email=${emailInput.toLowerCase()}&senha=${senhaInput}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'minha-chave': CLIENT_API_KEY, 'Content-Type': 'application/json' }
        });

        const usuarios = await res.json();

        if (usuarios.length > 0) {
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarios[0]));
            showToast(`Bem-vindo de volta!`, "success", "fa-user-check");
            setTimeout(() => window.location.reload(), 1200);
        } else {
            showToast("Usuário ou senha incorretos.", "error", "fa-times-circle");
            btn.innerHTML = 'Entrar na Loja';
        }
    } catch (err) {
        showToast("Erro ao conectar com o servidor.", "error", "fa-exclamation-triangle");
        btn.innerHTML = 'Entrar na Loja';
    }
});

document.getElementById('form-cadastro')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';

    const nome = document.getElementById('cad-nome').value.trim();
    const email = document.getElementById('cad-email').value.trim().toLowerCase();
    const senha = document.getElementById('cad-senha').value.trim();

    try {
        const res = await fetch(API_LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'minha-chave': CLIENT_API_KEY, 'Prefer': 'return=representation' },
            body: JSON.stringify({ nome, email, senha, perfil: 'cliente' })
        });

        if (res.ok) {
            showToast("Conta criada! Faça login.", "success", "fa-check");
            setTimeout(() => alternarTela('login'), 1500);
        } else {
            showToast("E-mail já cadastrado.", "error", "fa-times");
        }
    } catch (err) {
        showToast("Erro ao cadastrar.", "error", "fa-wifi");
    } finally {
        btn.innerHTML = 'Finalizar Cadastro';
    }
});

// --- SISTEMA DE TOAST ---
function showToast(mensagem, tipo = "info", icone = "fa-info-circle") {
    let container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<i class="fas ${icone}"></i> <span>${mensagem}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
