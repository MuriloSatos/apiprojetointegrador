const API = "http://127.0.0.1:3000/produtos";
const API_LOGIN = "http://127.0.0.1:3000/usuarios";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";
const URL_BASE_BACKEND = "http://127.0.0.1:3000/uploads/"; // Ajuste conforme seu backend

let carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];

// --- 1. MENU E LOGIN ---
function atualizarMenu() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const menuCentral = document.getElementById('menu-navegacao');
    const menuDireita = document.querySelector('.menu-direita');

    if (!user) {
        if (menuCentral) menuCentral.innerHTML = `<li><a href="../index/index.html">Início</a></li><li><a href="../produto/produto.html">Catálogo</a></li>`;
        if (menuDireita) menuDireita.innerHTML = `<li><a href="javascript:void(0)" onclick="abrirModal()">🛒 Carrinho <span id="contagem-carrinho">(0)</span></a></li><li><a href="javascript:void(0)" onclick="abrirModalLogin()">Login</a></li>`;
    } else {
        let linksExtras = user.perfil === "adm"
            ? `<li><a href="../vendas/vendas.html">Venda</a></li><li><a href="../cliente/cliente.html">Cliente</a></li><li><a href="../usuario/usuario.html">Usuários</a></li>`
            : `<li><a href="../meus-pedidos/pedidos.html">Meus Pedidos</a></li>`;

        if (menuCentral) menuCentral.innerHTML = `<li><a href="../index/index.html">Início</a></li><li><a href="../produto/produto.html">Catálogo</a></li>${linksExtras}`;
        if (menuDireita) menuDireita.innerHTML = `<li><a href="javascript:void(0)" onclick="abrirModal()">🛒 Carrinho <span id="contagem-carrinho">(0)</span></a></li><li><a href="javascript:void(0)" onclick="logout()" style="color: #ff4444;">Sair (${user.nome})</a></li>`;
    }
    atualizarContador();
}

// --- 2. CARREGAR PRODUTOS (4 FIXOS) ---
async function carregarDestaques() {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    try {
        const res = await fetch(API, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const dados = await res.json();
        grid.innerHTML = "";

        // Pega apenas os 4 primeiros (novos produtos não entram aqui)
        const destaques = dados.slice(0, 4);

        destaques.forEach(bike => {
            const preco = parseFloat(bike.preco || 0);
            let imgPath = bike.imagem;
            if (bike.imagem && !bike.imagem.startsWith('http')) imgPath = URL_BASE_BACKEND + bike.imagem;
            
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="img-placeholder">
                    <img src="${imgPath || '../assets/sem-foto.png'}" onerror="this.src='../assets/sem-foto.png'">
                </div>
                <h3>${bike.nomeproduto || 'Bike'}</h3>
                <span class="price">R$ ${preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <button class="cta-comprar" onclick="adicionarAoCarrinho('${bike.nomeproduto}', ${preco}, '${imgPath}')">Comprar</button>
            `;
            grid.appendChild(card);
        });
    } catch (e) { console.error("Erro API:", e); }
}

// --- 3. SISTEMA DE LOGIN ---
function alternarTela(tela) {
    const sLogin = document.getElementById('secao-login');
    const sCad = document.getElementById('secao-cadastro');
    const sEsq = document.getElementById('secao-esqueci');
    
    if(sLogin) sLogin.style.display = tela === 'login' ? 'block' : 'none';
    if(sCad) sCad.style.display = tela === 'cadastro' ? 'block' : 'none';
    if(sEsq) sEsq.style.display = tela === 'esqueci' ? 'block' : 'none';
}

// Listener para o formulário de Login
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'form-login') {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-senha').value;

        try {
            const res = await fetch(API_LOGIN, { headers: { 'minha-chave': CLIENT_API_KEY } });
            const usuarios = await res.json();
            const user = usuarios.find(u => u.email === email && u.senha === senha);

            if (user) {
                localStorage.setItem('usuarioLogado', JSON.stringify(user));
                window.location.reload();
            } else {
                alert("Usuário ou senha inválidos!");
            }
        } catch (err) { alert("Erro ao conectar ao servidor."); }
    }
});

// --- 4. FUNÇÕES GERAIS ---
function abrirModal() { document.getElementById('modal-carrinho').classList.add('aberto'); }
function fecharModal() { document.getElementById('modal-carrinho').classList.remove('aberto'); }
function abrirModalLogin() { document.getElementById('modal-login').style.display = 'block'; }
function fecharModalLogin() { document.getElementById('modal-login').style.display = 'none'; }
function logout() { localStorage.removeItem('usuarioLogado'); window.location.reload(); }
function atualizarContador() {
    const c = document.getElementById('contagem-carrinho');
    if (c) c.innerText = `(${carrinho.reduce((t, i) => t + i.quantidade, 0)})`;
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDestaques();
    atualizarMenu();
});