const API = "http://127.0.0.1:3000/produtos";
const API_LOGIN = "http://127.0.0.1:3000/usuarios";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

let carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];

// --- 1. LÓGICA DO MENU (DINÂMICO POR PERFIL) ---

function atualizarMenu() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const menuCentral = document.getElementById('menu-navegacao');
    const menuDireita = document.querySelector('.menu-direita');

    if (!user) {
        if (menuCentral) {
            menuCentral.innerHTML = `
                <li><a href="../index/index.html">Início</a></li>
                <li><a href="../produto/produto.html">Catálogo</a></li>
            `;
        }
        if (menuDireita) {
            menuDireita.innerHTML = `
                <li><a href="javascript:void(0)" onclick="abrirModal()">🛒 Carrinho <span id="contagem-carrinho">(0)</span></a></li>
                <li><a href="javascript:void(0)" onclick="abrirModalLogin()">Login</a></li>
            `;
        }
    } else {
        let linksExtras = "";
        if (user.perfil === "adm") {
            linksExtras = `
                <li><a href="../vendas/vendas.html">Venda</a></li>
                <li><a href="../cliente/cliente.html">Cliente</a></li>
                <li><a href="../usuario/usuario.html">Usuários</a></li>
            `;
        } else {
            linksExtras = `<li><a href="../meus-pedidos/pedidos.html">Meus Pedidos</a></li>`;
        }

        if (menuCentral) {
            menuCentral.innerHTML = `
                <li><a href="../index/index.html">Início</a></li>
                <li><a href="../produto/produto.html">Catálogo</a></li>
                ${linksExtras}
            `;
        }
        if (menuDireita) {
            menuDireita.innerHTML = `
                <li><a href="javascript:void(0)" onclick="abrirModal()">🛒 Carrinho <span id="contagem-carrinho">(0)</span></a></li>
                <li><a href="javascript:void(0)" onclick="logout()" style="color: #ff4444;">Sair (${user.nome})</a></li>
            `;
        }
    }
    atualizarContador();
}

// --- 2. FUNÇÃO DE ATUALIZAR CONTADOR ---

function atualizarContador() {
    const contador = document.getElementById('contagem-carrinho');
    if (contador) {
        const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
        contador.innerText = `(${totalItens})`;
    }
}

// --- 3. LÓGICA DO CARRINHO ---

function adicionarAoCarrinho(nome, preco, imagem) {
    const itemExistente = carrinho.find(item => item.nome === nome);
    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({ 
            id: Date.now(), 
            nome: nome, 
            preco: parseFloat(preco),
            imagem: imagem || '../assets/sem-foto.png',
            quantidade: 1
        });
    }
    salvarCarrinho();
    renderizarCarrinho();
    abrirModal(); 
}

function alterarQuantidade(id, delta) {
    const item = carrinho.find(item => item.id === id);
    if (item) {
        item.quantidade += delta;
        if (item.quantidade <= 0) {
            carrinho = carrinho.filter(i => i.id !== id);
        }
        salvarCarrinho();
        renderizarCarrinho();
    }
}

function renderizarCarrinho() {
    const container = document.getElementById('itens-carrinho');
    const totalElemento = document.getElementById('total-carrinho');
    if (!container) return;

    container.innerHTML = "";
    let totalGeral = 0;

    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        totalGeral += subtotal;
        const div = document.createElement('div');
        div.className = 'linha-carrinho';
        div.innerHTML = `
            <img src="${item.imagem}" class="cart-img-min" style="width:60px; height:60px; object-fit:contain; border-radius:5px;">
            <div style="flex-grow:1; margin-left:15px;">
                <strong style="display:block; font-size:0.9rem;">${item.nome}</strong>
                <span style="color: #ff6600; font-weight:bold;">R$ ${item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <div style="display:flex; align-items:center; gap:10px; margin-top:5px;">
                    <button onclick="alterarQuantidade(${item.id}, -1)" style="cursor:pointer; border:1px solid #ddd;">-</button>
                    <span>${item.quantidade}</span>
                    <button onclick="alterarQuantidade(${item.id}, 1)" style="cursor:pointer; border:1px solid #ddd;">+</button>
                </div>
            </div>
            <button onclick="removerDoCarrinho(${item.id})" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold;">✕</button>
        `;
        container.appendChild(div);
    });

    if (totalElemento) {
        totalElemento.innerText = `Total: R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    atualizarContador();
}

function salvarCarrinho() {
    localStorage.setItem('carrinho_bikes', JSON.stringify(carrinho));
}

function removerDoCarrinho(id) {
    carrinho = carrinho.filter(item => item.id !== id);
    salvarCarrinho();
    renderizarCarrinho();
}

// --- 4. SISTEMA DE LOGIN, CADASTRO E RECUPERAÇÃO ---

// Alternar entre as telas do Modal
function alternarTela(tela) {
    const login = document.getElementById('secao-login');
    const cadastro = document.getElementById('secao-cadastro');
    const esqueci = document.getElementById('secao-esqueci');

    if (login) login.style.display = 'none';
    if (cadastro) cadastro.style.display = 'none';
    if (esqueci) esqueci.style.display = 'none';

    if (tela === 'login') login.style.display = 'block';
    if (tela === 'cadastro') cadastro.style.display = 'block';
    if (tela === 'esqueci') esqueci.style.display = 'block';
}

// Lógica de Login (Existente)
document.getElementById('form-login')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value.trim();
    try {
        const url = `${API_LOGIN}?email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`;
        const resposta = await fetch(url, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const data = await resposta.json();
        const user = Array.isArray(data) ? data[0] : data;

        if (user && user.nome) {
            localStorage.setItem('usuarioLogado', JSON.stringify(user));
            window.location.reload();
        } else {
            alert("E-mail ou senha incorretos.");
        }
    } catch (err) { alert("Erro ao conectar com o servidor."); }
});

// --- LOGICA DE CADASTRO AJUSTADA ---
document.getElementById('form-cadastro')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    
    // Captura os valores
    const nome = document.getElementById('cad-nome').value.trim();
    const email = document.getElementById('cad-email').value.trim();
    const senha = document.getElementById('cad-senha').value.trim();

    const novoUsuario = {
        id: String(Date.now()), // Gerar ID como string evita erros em alguns servidores
        nome: nome,
        email: email,
        senha: senha,
        perfil: "cliente"
    };

    try {
        const resposta = await fetch(API_LOGIN, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
                // Remova a 'minha-chave' temporariamente se o json-server estiver bloqueando
            },
            body: JSON.stringify(novoUsuario)
        });

        if (resposta.ok) {
            alert("Cadastro realizado com sucesso!");
            alternarTela('login');
        } else {
            const erroTexto = await resposta.text();
            console.error("Erro do servidor:", erroTexto);
            alert("Erro ao salvar no banco de dados. Verifique o console do VS Code.");
        }
    } catch (err) {
        console.error("Erro de conexão:", err);
        alert("Não foi possível conectar ao servidor.");
    }
});
// Lógica de Esqueci Senha (Simulação)
document.getElementById('form-esqueci')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('esqueci-email').value;
    alert(`Enviamos um link de recuperação para: ${email}`);
    alternarTela('login');
});

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.reload();
}

// --- 5. CARREGAR PRODUTOS ---

async function carregarDestaques() {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;
    try {
        const res = await fetch(API, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const dados = await res.json();
        grid.innerHTML = "";

        // Definimos o caminho padrão de erro uma única vez para facilitar
        const IMG_DEFAULT = '/front/assets/sem-foto.png';

        dados.slice(0, 4).forEach(bike => {
            // Verificamos se bike.imagem existe. Se sim, usamos ela. 
            // Se não, usamos o IMG_DEFAULT.
            let imagemExibir = bike.imagem ? bike.imagem : IMG_DEFAULT;

            // Se o caminho no banco não começar com http ou /, 
            // podemos ajustar para garantir que aponte para a pasta certa
            if (bike.imagem && !bike.imagem.startsWith('http') && !bike.imagem.startsWith('/')) {
                imagemExibir = `/front/${bike.imagem}`;
            }

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="img-placeholder">
                    <img src="${imagemExibir}" 
                         alt="${bike.nomeproduto || 'Produto'}"
                         onerror="this.onerror=null;this.src='${IMG_DEFAULT}'" 
                         style="width:100%; height:100%; object-fit:contain;">
                </div>
                <h3>${bike.nomeproduto || 'Sem nome'}</h3>
                <span class="price">R$ ${parseFloat(bike.preco || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                <button class="cta-comprar" onclick="adicionarAoCarrinho('${bike.nomeproduto}', ${bike.preco}, '${imagemExibir}')">Comprar</button>
            `;
            grid.appendChild(card);
        });
    } catch (e) { 
        console.error("Erro ao carregar produtos:", e); 
    }
}
// --- 6. CONTROLE DE MODAIS ---
function abrirModal() { document.getElementById('modal-carrinho').classList.add('aberto'); }
function fecharModal() { document.getElementById('modal-carrinho').classList.remove('aberto'); }
function abrirModalLogin() { 
    document.getElementById('modal-login').style.display = 'block'; 
    alternarTela('login'); // Sempre abre na tela de login
}
function fecharModalLogin() { document.getElementById('modal-login').style.display = 'none'; }

window.onclick = (e) => {
    if (e.target.id === 'modal-login') fecharModalLogin();
    if (e.target.id === 'modal-carrinho') fecharModal();
};

document.addEventListener('DOMContentLoaded', () => {
    carregarDestaques();
    atualizarMenu();
    renderizarCarrinho();
});