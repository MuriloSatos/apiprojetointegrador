const API = "https://apiprojetointegrador.onrender.com/produtos";
const API_LOGIN = "https://apiprojetointegrador.onrender.com/usuarios";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";


//const URL_BASE_BACKEND = "https://apiprojetointegrador.onrender.com/uploads/"; 

let carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];

function atualizarMenu() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const menuCentral = document.getElementById('menu-navegacao');
    const menuDireita = document.querySelector('.menu-direita');

    let linksPrincipais = `<li><a href="../index/index.html">Início</a></li><li><a href="../produto/produto.html">Catálogo</a></li>`;

    if (!user) {
        if (menuCentral) menuCentral.innerHTML = linksPrincipais;
        if (menuDireita) menuDireita.innerHTML = `<li><a href="javascript:void(0)" onclick="abrirModal()">🛒 Carrinho <span id="contagem-carrinho">(0)</span></a></li><li><a href="javascript:void(0)" onclick="abrirModalLogin()">Login</a></li>`;
    } else {
        let linksExtras = "";

        if (user.perfil === "adm") {
            linksExtras = `<li><a href="../vendas/vendas.html">Venda</a></li><li><a href="../cliente/cliente.html">Cliente</a></li><li><a href="../usuario/usuario.html">Usuários</a></li>`;
        } else {
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

// --- 3. SISTEMA DE LOGIN E CADASTRO ---

const formLogin = document.getElementById('form-login');

if (formLogin) {
    formLogin.onsubmit = async (e) => {
        e.preventDefault();
        
        // FORÇA A EXPULSÃO do administrador antigo antes de qualquer coisa
        localStorage.removeItem('usuarioLogado');

        const emailInput = document.getElementById('login-email').value.trim();
        const senhaInput = document.getElementById('login-senha').value.trim();

        try {
            // Sintaxe correta para busca no Supabase
            const url = `${API_LOGIN}?email=${(emailInput.toLowerCase())}&senha=${(senhaInput)}`;
            console.log(emailInput, senhaInput, url);
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': CLIENT_API_KEY,
                    'Authorization': `Bearer ${CLIENT_API_KEY}`,
                    'Accept': 'application/json'
                }
            });

            if (!res.ok) throw new Error("Erro na rede ou chave API");

            const usuarios = await res.json();
            console.table(usuarios);
            if (usuarios.length > 0) {
                const usuarioEncontrado = usuarios[0];
                
                // Salva o novo usuário (ex: Felipe)
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioEncontrado));
                
                alert(`Sucesso! Entrou como: ${usuarioEncontrado.perfil}`);
                window.location.reload(); 
            } else {
                alert("Usuário ou senha não encontrados no Supabase.");
                atualizarMenu(); // Volta o menu para "Login"
            }
        } catch (err) {
            console.error("Erro no login:", err);
            alert("Erro de conexão com o Supabase. Verifique sua chave API.");
            atualizarMenu();
        }
    };
}
// --- 2. LÓGICA DE CADASTRO (POST) ---
const formCadastro = document.getElementById('form-cadastro');
if (formCadastro) {
    formCadastro.onsubmit = async (e) => {
        e.preventDefault();
        const nome = document.getElementById('cad-nome').value.trim();
        const email = document.getElementById('cad-email').value.trim().toLowerCase();
        const senha = document.getElementById('cad-senha').value.trim();

        try {
            // Cadastro continua sendo POST para inserir na tabela
            const res = await fetch(API_LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'minha-chave': CLIENT_API_KEY,
                    'Prefer': 'return=representation' // Instrução do Supabase para retornar o objeto criado
                },
                body: JSON.stringify({
                    nome,
                    email,
                    senha,
                    perfil: 'cliente'
                })
            });

            if (res.ok) {
                alert("Conta criada com sucesso! Agora faça seu login.");
                alternarTela('login');
            } else {
                const data = await res.json();
                alert("Erro ao criar conta: " + (data.message || "E-mail já cadastrado."));
            }
        } catch (err) {
            console.error("Erro no cadastro:", err);
            alert("Erro de conexão ao tentar cadastrar.");
        }
    };
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

