const API = "http://127.0.0.1:3000/produtos";
const API_LOGIN = "http://127.0.0.1:3000/adm/login"; 
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";
let carrinho = [];

// --- 1. MODAL DE LOGIN (CENTRAL) ---
function abrirModalLogin() {
    const modal = document.getElementById('modal-login');
    if (modal) modal.style.display = 'block';
}

function fecharModalLogin() {
    const modal = document.getElementById('modal-login');
    if (modal) modal.style.display = 'none';
}

// Lógica de Login Real via Banco de Dados
document.getElementById('form-login')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    try {
        // Faz a chamada para o seu backend que consulta o Supabase
        const resposta = await fetch(API_LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            alert(`Bem-vindo, ${resultado.nome}!`);

            // Salva no localStorage para persistir o login
            localStorage.setItem('usuarioLogado', JSON.stringify(resultado));

            atualizarMenu(resultado.perfil); // 'adm' ou 'cliente'
            fecharModalLogin();
        } else {
            alert(resultado.erro || "Usuário ou senha inválidos.");
        }
    } catch (erro) {
        console.error("Erro ao fazer login:", erro);
        alert("Erro ao conectar com o servidor.");
    }
});

function atualizarMenu(perfil) {
    const menu = document.getElementById('menu-navegacao');
    if (!menu) return;

    // Se for ADM, adiciona links extras baseados na sua estrutura de pastas
    if (perfil === "adm") {
        menu.innerHTML = `
            <li><a href="../index/index.html">Inicio</a></li>
            <li><a href="../produto/produto.html">Catalago</a></li>
            <li><a href="../vendas/vendas.html" style="color: #ff6600;">Relatórios</a></li>
            <li><a href="../cliente/clientes.html" style="color: #ff6600;">Usuários</a></li>
        `;
    } else {
        menu.innerHTML = `
            <li><a href="../index/index.html">Inicio</a></li>
            <li><a href="../produto/produto.html">Catalago</a></li>
        `;
    }
}

// --- 2. CARREGAR PRODUTOS (LIMITADO A 3 PARA DESTAQUE) ---
async function carregarProdutosDoBanco() {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    try {
        const resposta = await fetch(API, {
            headers: { 'minha-chave': CLIENT_API_KEY }
        });
        const todosProdutos = await resposta.json();

        // Mostra apenas os 3 primeiros produtos na Home
        const produtosExibidos = todosProdutos.slice(0, 3);
        grid.innerHTML = "";

        produtosExibidos.forEach(bike => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="img-placeholder">
                    <img src="../assets/as.png" alt="${bike.nomeproduto}" style="width:100%; height:100%; object-fit:contain;">
                </div>
                <h3>${bike.nomeproduto}</h3>
                <p>R$ ${parseFloat(bike.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p style="color: #777; font-size: 0.85rem; margin-bottom: 10px;">Estoque: ${bike.estoque || 0} un</p> 
                <button class="cta-comprar" onclick="adicionarAoCarrinho('${bike.nomeproduto}', ${bike.preco})">Comprar</button>
            `;
            grid.appendChild(card);
        });
    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        grid.innerHTML = "<p>Erro ao carregar o catálogo.</p>";
    }
}

// --- 3. LÓGICA DO CARRINHO (SIDEBAR) ---
function abrirModal() {
    const modal = document.getElementById('modal-carrinho');
    if (modal) {
        modal.classList.add('aberto');
        document.body.style.overflow = 'hidden';
    }
}

function fecharModal() {
    const modal = document.getElementById('modal-carrinho');
    if (modal) {
        modal.classList.remove('aberto');
        document.body.style.overflow = 'auto';
    }
}

// Fechar modais ao clicar fora
window.addEventListener('click', function (event) {
    const modalLogin = document.getElementById('modal-login');
    const modalCarrinho = document.getElementById('modal-carrinho');

    if (event.target == modalLogin) fecharModalLogin();
    if (event.target == modalCarrinho) fecharModal();
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutosDoBanco();

    // Verifica se já existe alguém logado ao carregar a página
    const salvo = localStorage.getItem('usuarioLogado');
    if (salvo) {
        const user = JSON.parse(salvo);
        atualizarMenu(user.perfil);
    }
});