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

    // Sempre exibimos o Início e Catálogo
    let linksPrincipais = `<li><a href="../index/index.html">Início</a></li><li><a href="../produto/produto.html">Catálogo</a></li>`;

    if (!user) {
        // Menu para Visitante
        if (menuCentral) menuCentral.innerHTML = linksPrincipais;
        if (menuDireita) menuDireita.innerHTML = `<li><a href="javascript:void(0)" onclick="abrirModal()">🛒 Carrinho <span id="contagem-carrinho">(0)</span></a></li><li><a href="javascript:void(0)" onclick="abrirModalLogin()">Login</a></li>`;
    } else {
        // Lógica baseada no Perfil que você mostrou na imagem
        let linksExtras = "";

        if (user.perfil === "adm") {
            // Se for Administrador, adiciona as abas administrativas
            linksExtras = `<li><a href="../vendas/vendas.html">Venda</a></li><li><a href="../cliente/cliente.html">Cliente</a></li><li><a href="../usuario/usuario.html">Usuários</a></li>`;
        } else {
            // Se for cliente, ele vê apenas os Meus Pedidos (além do principal)
            linksExtras = `<li><a href="../meus-pedidos/pedidos.html">Meus Pedidos</a></li>`;
        }

        if (menuCentral) menuCentral.innerHTML = linksPrincipais + linksExtras;
        if (menuDireita) menuDireita.innerHTML = `<li><a href="javascript:void(0)" onclick="abrirModal()">🛒 Carrinho <span id="contagem-carrinho">(0)</span></a></li><li><a href="javascript:void(0)" onclick="logout()" style="color: #ff4444;">Sair (${user.nome})</a></li>`;
    }

    atualizarContador();
}

async function carregarDestaques() {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    try {
        const res = await fetch(API, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const dados = await res.json();
        grid.innerHTML = "";

        // 1. Ordena os produtos pelo ID (garante que os primeiros inseridos fiquem no início)
        // Se o seu ID for um número:
        const produtosOrdenados = dados.sort((a, b) => a.id - b.id);

        // 2. Pega apenas os 4 primeiros (os produtos mais antigos do seu banco)
        const destaques = produtosOrdenados.slice(0, 4);

        destaques.forEach(bike => {
            const preco = parseFloat(bike.preco || 0);
            let imgPath = bike.imagem;

            if (bike.imagem && !bike.imagem.startsWith('http')) {
                imgPath = URL_BASE_BACKEND + bike.imagem;
            }

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="img-placeholder">
                    <img src="${imgPath || '../assets/sem-foto.png'}" 
                         onerror="this.src='../assets/sem-foto.png'">
                </div>
                <h3>${bike.nomeproduto || 'Bike'}</h3>
                <span class="price">R$ ${preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <button class="cta-comprar" onclick="adicionarAoCarrinho('${bike.nomeproduto}', ${preco}, '${imgPath}')">Comprar</button>
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        console.error("Erro ao buscar destaques:", e);
        grid.innerHTML = "<p>Não foi possível carregar os destaques no momento.</p>";
    }
}

// --- 3. SISTEMA DE LOGIN ---
function alternarTela(tela) {
    const sLogin = document.getElementById('secao-login');
    const sCad = document.getElementById('secao-cadastro');
    const sEsq = document.getElementById('secao-esqueci');

    if (sLogin) sLogin.style.display = tela === 'login' ? 'block' : 'none';
    if (sCad) sCad.style.display = tela === 'cadastro' ? 'block' : 'none';
    if (sEsq) sEsq.style.display = tela === 'esqueci' ? 'block' : 'none';
}

// 1. Lógica de Login
const formLogin = document.getElementById('form-login');
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const senha = document.getElementById('login-senha').value.trim();

        try {
            const res = await fetch("http://127.0.0.1:3000/login", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'minha-chave': CLIENT_API_KEY },
                body: JSON.stringify({ email, senha })
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('usuarioLogado', JSON.stringify(data));
                alert(`Bem-vindo(a), ${data.nome}!`);
                window.location.reload();
            } else {
                alert("Erro: " + (data.message || "E-mail ou senha incorretos."));
            }
        } catch (err) {
            alert("Erro de conexão com o servidor.");
        }
    });
}

// 2. Nova Lógica de Cadastro (Cria no banco e loga automaticamente)
const formCadastro = document.getElementById('form-cadastro');
if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('cad-nome').value.trim();
        const email = document.getElementById('cad-email').value.trim().toLowerCase();
        const senha = document.getElementById('cad-senha').value.trim();

        try {
            // Altere esta linha no seu index.js
            const res = await fetch("http://127.0.0.1:3000/usuarios/cadastro", {
                method: 'POST',
                // ... restante do códig
            
                headers: { 'Content-Type': 'application/json', 'minha-chave': CLIENT_API_KEY },
                body: JSON.stringify({ nome, email, senha, perfil: 'cliente' }) // Define como cliente por padrão
            });

            if (res.ok) {
                const novoUsuario = await res.json();
                alert("Conta criada com sucesso! Você será logado agora.");

                // Loga o usuário automaticamente salvando no localStorage
                localStorage.setItem('usuarioLogado', JSON.stringify(novoUsuario));
                window.location.reload();
            } else {
                alert("Erro ao criar conta. O e-mail já pode estar em uso.");
            }
        } catch (err) {
            alert("Erro de conexão ao tentar cadastrar.");
        }
    });
}

// --- 4. FUNÇÕES GERAIS (Corrigido o erro de digitação) ---
function abrirModal() {
    const modal = document.getElementById('modal-carrinho');
    if (modal) {
        modal.classList.add('aberto'); // Corrigido de 'Faberto' para 'aberto'
        renderizarCarrinhoNoModal();
    }
}




// --- 4. FUNÇÕES GERAIS ---
function abrirModal() { document.getElementById('modal-carrinho').classList.add('Faberto'); }
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


// --- FUNÇÕES DO CARRINHO ---

function adicionarAoCarrinho(nome, preco, imagem) {
    carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];

    const itemExistente = carrinho.find(item => item.nome === nome);

    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        const imgValida = (imagem && imagem !== 'undefined') ? imagem : '../assets/sem-foto.png';
        carrinho.push({ nome, preco: parseFloat(preco), imagem: imgValida, quantidade: 1 });
    }

    localStorage.setItem('carrinho_bikes', JSON.stringify(carrinho));
    atualizarContador();
    alert(`"${nome}" adicionado ao carrinho!`);
}

function abrirModal() {
    document.getElementById('modal-carrinho').classList.add('aberto');
    renderizarCarrinhoNoModal(); // <--- IMPORTANTE: Chama a renderização ao abrir
}

function fecharModal() {
    document.getElementById('modal-carrinho').classList.remove('aberto');
}

function renderizarCarrinhoNoModal() {
    const listaModal = document.getElementById('itens-carrinho');
    const totalElemento = document.getElementById('total-carrinho');

    if (!listaModal) return;

    carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
    listaModal.innerHTML = "";

    if (carrinho.length === 0) {
        listaModal.innerHTML = "<p style='text-align:center; padding:20px;'>Carrinho vazio.</p>";
        if (totalElemento) totalElemento.innerText = "Total: R$ 0,00";
        return;
    }

    let htmlCarrinho = "";
    carrinho.forEach((item, index) => {
        htmlCarrinho += `
            <div class="linha-carrinho">
                <img src="${item.imagem}" class="cart-img-min" onerror="this.src='../assets/sem-foto.png'">
                <div class="cart-item-info">
                    <h4>${item.nome}</h4>
                    <span>Qtd: ${item.quantidade}</span>
                    <p class="cart-item-price">R$ ${(item.preco * item.quantidade).toFixed(2)}</p>
                </div>
                <button onclick="removerDoCarrinho(${index})" style="background:none; border:none; color:red; cursor:pointer;">❌</button>
            </div>
        `;
    });

    listaModal.innerHTML = htmlCarrinho;

    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    if (totalElemento) totalElemento.innerText = `Total: R$ ${total.toFixed(2)}`;
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    localStorage.setItem('carrinho_bikes', JSON.stringify(carrinho));
    atualizarContador();
    renderizarCarrinhoNoModal();
}

function finalizarCompra() {
    alert("Redirecionando para o pagamento...");
}