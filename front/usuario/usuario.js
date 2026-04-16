// --- CONFIGURAÇÕES TÉCNICAS ---
const API_BASE = "https://apiprojetointegrador.onrender.com/usuarios";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456"; 

let carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
let todosUsuarios = []; 

document.addEventListener('DOMContentLoaded', () => {
    atualizarMenu();
    verificarAcessoGestao(); 
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
        
        if (user && (user.perfil === "adm" || user.email === "adm@gmail.com")) {
            links += `
                <li><a href="../vendas/vendas.html">Vendas</a></li>
                <li><a href="../usuario/usuario.html">Usuários</a></li>
            `;
        } else if (user) {
            links += `<li><a href="../vendas/vendas.html">Meus Pedidos</a></li>`;
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
                <li><a href="javascript:void(0)" onclick="logout()" style="color: #ff4444; font-weight: bold;">Sair (${user.nome.split(' ')[0]})</a></li>
            `;
        }
    }
    atualizarContador();
}

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

// --- 2. GESTÃO DE USUÁRIOS (TABELA ADM) ---
async function verificarAcessoGestao() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const secaoGestao = document.getElementById('sessao-gestao');
    const secaoLogin = document.getElementById('sessao-login');

    if (user && (user.perfil === 'adm' || user.email === 'adm@gmail.com')) {
        if (secaoLogin) secaoLogin.style.display = 'none';
        if (secaoGestao) {
            secaoGestao.style.display = 'block'; 
            carregarTabelaUsuarios();
        }
    } else {
        if (secaoGestao) secaoGestao.style.display = 'none';
        if (secaoLogin) secaoLogin.style.display = 'block';
    }
}

async function carregarTabelaUsuarios() {
    const corpoTabela = document.getElementById('tabela-usuarios-corpo');
    if (!corpoTabela) return;

    corpoTabela.innerHTML = "<tr><td colspan='5' style='text-align:center; padding: 40px;'><i class='fas fa-spinner fa-spin' style='font-size: 2rem; color: #ff6600;'></i><br>Carregando usuários...</td></tr>";

    try {
        const res = await fetch(API_BASE, {
            headers: { 'minha-chave': CLIENT_API_KEY }
        });
        todosUsuarios = await res.json();
        renderizarTabela(todosUsuarios); 
    } catch (err) {
        corpoTabela.innerHTML = "<tr><td colspan='5' style='text-align:center; color: #ff4444; padding: 20px;'>Erro ao carregar dados do banco.</td></tr>";
    }
}
// --- 3. DESENHO DA TABELA E AVATARES ---
function renderizarTabela(lista) {
    const corpoTabela = document.getElementById('tabela-usuarios-corpo');
    if (!corpoTabela) return;

    if (lista.length === 0) {
        corpoTabela.innerHTML = "<tr><td colspan='5' style='text-align:center; padding: 30px; color: #888;'>Nenhum usuário encontrado.</td></tr>";
        return;
    }

    // Pega os dados de quem está logado para destacar "O Meu" usuário
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado')) || {};

    corpoTabela.innerHTML = lista.map(u => {
        const inicial = u.nome ? u.nome.charAt(0).toUpperCase() : '?';
        const corAvatar = gerarCorAvatar(inicial);
        const badgeClass = u.perfil === 'adm' ? 'badge-adm' : 'badge-cliente';
        
        // 🌟 MELHORIA 1: Identifica se a linha é o SEU usuário
        const isMeuUsuario = (u.email === usuarioLogado.email);
        const estiloLinha = isMeuUsuario ? 'background-color: #fff5f0; box-shadow: inset 4px 0 0 #ff6600;' : '';
        const tagVoce = isMeuUsuario ? `<span style="font-size: 0.65rem; background: #ff6600; color: white; padding: 3px 6px; border-radius: 4px; margin-left: 8px; font-weight: bold;">VOCÊ</span>` : '';

        return `
            <tr style="${estiloLinha}">
                <td style="color: #888; font-weight: 500;">#${u.id}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="avatar" style="background-color: ${corAvatar};">${inicial}</div>
                        <span style="font-weight: 600; color: #333;">${u.nome} ${tagVoce}</span>
                    </div>
                </td>
                <td style="color: #666; font-weight: ${isMeuUsuario ? 'bold' : 'normal'};">${u.email}</td>
                <td><span class="badge ${badgeClass}">${u.perfil}</span></td>
                <td>
                    <!-- 🌟 MELHORIA 2: Ações usando Emojis e bloqueio de exclusão do próprio usuário -->
                    <div class="acoes-tabela">
                        ${u.perfil !== 'adm' ? 
                            `<button onclick="tornarAdm(${u.id})" class="btn-acao btn-star" title="Tornar Administrador">⭐</button>` : 
                            `<button class="btn-acao btn-check" title="Já é Administrador" disabled>✔️</button>`
                        }
                        
                        ${!isMeuUsuario ? 
                            `<button onclick="excluirUsuario(${u.id})" class="btn-acao btn-lixeira" title="Excluir Usuário">🗑️</button>` :
                            `<button class="btn-acao" style="background: #eee; color: #aaa; cursor: not-allowed;" title="Você não pode excluir a si mesma" disabled>🚫</button>`
                        }
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}


function gerarCorAvatar(letra) {
    const cores = ['#FF5722', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4', '#FF9800', '#673AB7', '#3F51B5'];
    const index = letra.charCodeAt(0) % cores.length;
    return cores[index] || cores[0];
}

function filtrarUsuarios() {
    const termo = document.getElementById('input-pesquisa-usuario')?.value.toLowerCase() || "";
    const filtrados = todosUsuarios.filter(u => 
        (u.nome && u.nome.toLowerCase().includes(termo)) || 
        (u.email && u.email.toLowerCase().includes(termo))
    );
    renderizarTabela(filtrados);
}

// --- 4. AÇÕES DA TABELA (PROMOVER E EXCLUIR) ---
async function tornarAdm(id) {
    if (!confirm("Deseja promover este usuário a Administrador?")) return;

    try {
        const busca = await fetch(`${API_BASE}/${id}`, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const usuarioAtual = await busca.json();

        const resposta = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'minha-chave': CLIENT_API_KEY },
            body: JSON.stringify({ ...usuarioAtual, perfil: 'adm' })
        });

        if (resposta.ok) {
            carregarTabelaUsuarios();
        } else {
            alert("Erro ao promover usuário.");
        }
    } catch (err) { console.error(err); }
}

async function excluirUsuario(id) {
    if (!confirm("⚠️ Atenção: Tem certeza que deseja excluir este usuário permanentemente?")) return;
    
    try {
        const res = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE',
            headers: { 'minha-chave': CLIENT_API_KEY }
        });
        
        if (res.ok) {
            carregarTabelaUsuarios();
        } else {
            alert("Erro ao excluir usuário.");
        }
    } catch (err) { console.error(err); }
}

// --- 5. LÓGICA DE LOGIN E CADASTRO ---
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
            alert(data.error || "Erro ao logar. Verifique os dados.");
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
            // alternarTela('login'); // Caso use uma função para trocar de tela
        } else {
            const erro = await resposta.json();
            alert(erro.error || "Erro no cadastro.");
        }
    } catch (err) { alert("Erro de conexão."); }
}
