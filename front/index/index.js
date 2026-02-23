const API = "http://127.0.0.1:3000/produtos";
const API_LOGIN = "http://127.0.0.1:3000/usuarios";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

let carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];

// --- 1. LÓGICA DO MENU (DINÂMICO POR PERFIL) ---

function atualizarMenu() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const menuCentral = document.getElementById('menu-navegacao');
    const menuDireita = document.querySelector('.menu-direita');

    // Caso: USUÁRIO NÃO LOGADO (Mostra apenas Início e Catálogo)
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
    } 
    // Caso: USUÁRIO LOGADO (Verifica Perfil conforme imagens enviadas)
    else {
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
    atualizarContador(); // Atualiza o número no ícone após montar o menu
}

// --- 2. FUNÇÃO DE ATUALIZAR CONTADOR (ESTAVA FALTANDO) ---

function atualizarContador() {
    const contador = document.getElementById('contagem-carrinho');
    if (contador) {
        // Soma a quantidade total de itens no array (ex: 2 bikes X + 1 bike Y = 3 no ícone)
        const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
        contador.innerText = `(${totalItens})`;
    }
}

// --- 3. LÓGICA DO CARRINHO PROFISSIONAL ---

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

// --- 4. LOGIN E LOGOUT ---

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
            alert("Login inválido!");
        }
    } catch (err) { alert("Erro de conexão com o servidor."); }
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
        dados.slice(0, 4).forEach(bike => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="img-placeholder"><img src="${bike.imagem || '../assets/sem-foto.png'}" style="width:100%; height:100%; object-fit:contain;"></div>
                <h3>${bike.nomeproduto}</h3>
                <span class="price">R$ ${parseFloat(bike.preco).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                <button class="cta-comprar" onclick="adicionarAoCarrinho('${bike.nomeproduto}', ${bike.preco}, '${bike.imagem}')">Comprar</button>
            `;
            grid.appendChild(card);
        });
    } catch (e) { console.log("Erro ao carregar produtos:", e); }
}

// --- 6. CONTROLE DE MODAIS ---
function abrirModal() { document.getElementById('modal-carrinho').classList.add('aberto'); }
function fecharModal() { document.getElementById('modal-carrinho').classList.remove('aberto'); }
function abrirModalLogin() { document.getElementById('modal-login').style.display = 'block'; }
function fecharModalLogin() { document.getElementById('modal-login').style.display = 'none'; }

// Fecha clicando fora
window.onclick = (e) => {
    if (e.target.id === 'modal-login') fecharModalLogin();
    if (e.target.id === 'modal-carrinho') fecharModal();
};

document.addEventListener('DOMContentLoaded', () => {
    carregarDestaques();
    atualizarMenu();
    renderizarCarrinho();
});