// --- CONFIGURAÇÕES TÉCNICAS ---
const API_BASE = "http://127.0.0.1:3000";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456"; // Alinhado com seu .env

// Inicialização do Carrinho (Recupera do localStorage ou cria vazio)
let carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];

document.addEventListener('DOMContentLoaded', () => {
    atualizarMenu();
    verificarAcessoGestao(); // Se estiver na página de usuários, carrega a tabela
});

// --- 1. MENU DINÂMICO ---
function atualizarMenu() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const menuNavegacao = document.getElementById('menu-navegacao');
    const menuDireita = document.querySelector('.menu-direita');

    if (menuNavegacao) {
        let links = `
            <li><a href="../index/index.html">Início</a></li>
            <li><a href="../produto/produto.html">Catálogo</a></li>
        `;
        
        if (user && user.perfil === "adm") {
            links += `
                <li><a href="../vendas/vendas.html">Vendas</a></li>
                <li><a href="../cliente/cliente.html">Clientes</a></li>
                <li><a href="../usuario/usuario.html">Usuários</a></li>
            `;
        } else if (user) {
            links += `<li><a href="../meus-pedidos/pedidos.html">Meus Pedidos</a></li>`;
        }
        menuNavegacao.innerHTML = links;
    }

    if (menuDireita) {
        if (!user) {
            menuDireita.innerHTML = `
                <li><a href="javascript:void(0)" onclick="abrirModal()">🛒 Carrinho <span id="contagem-carrinho"></span></a></li>
                <li><a href="../usuario/usuario.html">Login</a></li>
            `;
        } else {
            menuDireita.innerHTML = `
                <li><a href="javascript:void(0)" onclick="abrirModal()">🛒 Carrinho <span id="contagem-carrinho"></span></a></li>
                <li><a href="javascript:void(0)" onclick="logout()" style="color: #ff4444;">Sair (${user.nome.split(' ')[0]})</a></li>
            `;
        }
    }
    atualizarContador();
}

// --- 2. LOGICA DE LOGIN E CADASTRO (POST) ---

async function realizarLogin(email, senha) {
    try {
        const resposta = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await resposta.json();

        if (resposta.ok) {
            localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
            window.location.href = data.usuario.perfil === 'adm' ? "usuario.html" : "../produto/produto.html";
        } else {
            alert(data.error || "Erro ao logar.");
        }
    } catch (err) { alert("Erro ao conectar com o servidor."); }
}

async function realizarCadastro(nome, email, senha) {
    try {
        const resposta = await fetch(`${API_BASE}/auth/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        if (resposta.ok) {
            alert("Cadastro realizado com sucesso! Faça seu login.");
            alternarTela('login');
        } else {
            const erro = await resposta.json();
            alert(erro.error || "Erro no cadastro.");
        }
    } catch (err) { alert("Erro de conexão."); }
}

// --- 3. GESTÃO DE USUÁRIOS (TABELA ADM) ---

async function verificarAcessoGestao() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const secaoGestao = document.getElementById('sessao-gestao');
    const secaoLogin = document.getElementById('sessao-login');

    if (user && user.perfil === 'adm' && secaoGestao) {
        secaoLogin.style.display = 'none';
        secaoGestao.style.display = 'block';
        carregarTabelaUsuarios();
    }
}

async function carregarTabelaUsuarios() {
    const corpoTabela = document.getElementById('tabela-usuarios-corpo');
    if (!corpoTabela) return;

    try {
        const res = await fetch(`${API_BASE}/usuarios`, {
            headers: { 'minha-chave': CLIENT_API_KEY }
        });
        const usuarios = await res.json();

        corpoTabela.innerHTML = usuarios.map(u => `
            <tr>
                <td>#${u.id}</td>
                <td>${u.nome}</td>
                <td>${u.email}</td>
                <td><span class="badge ${u.perfil}">${u.perfil}</span></td>
                <td>
                    <button onclick="excluirUsuario(${u.id})" class="btn-tabela">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        corpoTabela.innerHTML = "<tr><td colspan='5'>Erro ao carregar dados.</td></tr>";
    }
}

// --- 4. FUNÇÕES DO CARRINHO (REUTILIZÁVEIS) ---

function atualizarContador() {
    const contador = document.getElementById('contagem-carrinho');
    if (contador) {
        const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
        contador.innerText = `(${totalItens})`;
    }
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = "../index/index.html";
}