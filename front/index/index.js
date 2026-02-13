const API = "http://127.0.0.1:3000/produtos";
const API_LOGIN = "http://127.0.0.1:3000/usuarios"; 
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

let carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
// Lógica de Login vinculada ao formulário
document.getElementById('form-login')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const emailDigitado = document.getElementById('login-email').value.trim();
    const senhaDigitada = document.getElementById('login-senha').value.trim();

    // Criamos a URL com os parâmetros de busca para o banco de dados
    const url = `${API_LOGIN}?email=${encodeURIComponent(emailDigitado)}&senha=${encodeURIComponent(senhaDigitada)}`;

    try {
        const resposta = await fetch(url, {
            method: 'GET',
            headers: { 'minha-chave': CLIENT_API_KEY }
        });

        const resultado = await resposta.json();
        console.log("Resposta do servidor:", resultado);

        // Se o servidor retornar uma lista, pegamos o primeiro usuário que bate com os dados
        let usuarioValido = null;
        if (Array.isArray(resultado)) {
            usuarioValido = resultado.find(u => u.email === emailDigitado && u.senha === senhaDigitada);
        } else {
            usuarioValido = resultado;
        }

        if (resposta.ok && usuarioValido && usuarioValido.nome) {
            alert(`Bem-vindo, ${usuarioValido.nome}!`);

            localStorage.setItem('usuarioLogado', JSON.stringify({
                id: usuarioValido.id,
                nome: usuarioValido.nome,
                perfil: usuarioValido.perfil
            }));

            atualizarMenu(usuarioValido.perfil); 
            fecharModalLogin();

            // Se tiver itens no carrinho, pergunta se quer pagar agora
            if (carrinho.length > 0) {
                if (confirm("Você tem itens no carrinho. Deseja finalizar a compra agora?")) {
                    window.location.href = "../pagamento/pagamento.html";
                }
            }
        } else {
            alert("E-mail ou senha incorretos.");
        }
    } catch (erro) {
        console.error("Erro no login:", erro);
        alert("Erro ao conectar com o servidor.");
    }
});

function atualizarMenu(perfil) {
    const menu = document.getElementById('menu-navegacao');
    if (!menu) return;

    // Define os links com base no perfil ('adm' ou 'cliente')
    if (perfil === "adm") {
        menu.innerHTML = `
            <li><a href="../index/index.html">Início</a></li>
            <li><a href="../produto/produto.html">Catálogo</a></li>
            <li><a href="../vendas/vendas.html" style="color: #ff6600;">Relatórios</a></li>
            <li><a href="../cliente/clientes.html" style="color: #ff6600;">Usuários</a></li>
            <li><a href="#" onclick="logout()">Sair</a></li>
        `;
    } else {
        menu.innerHTML = `
            <li><a href="../index/index.html">Início</a></li>
            <li><a href="../produto/produto.html">Catálogo</a></li>
            <li><a href="#" onclick="logout()">Sair</a></li>
        `;
    }
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.reload();
}

// --- 2. PRODUTOS (DINÂMICO) ---

async function carregarProdutosDoBanco() {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    try {
        const resposta = await fetch(API, {
            headers: { 'minha-chave': CLIENT_API_KEY }
        });
        const todosProdutos = await resposta.json();

        const produtosExibidos = todosProdutos.slice(0, 4);
        grid.innerHTML = "";

        produtosExibidos.forEach(bike => {
            const imagemSrc = bike.imagem ? bike.imagem : "../assets/sem-foto.png";

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="img-placeholder" style="background: transparent;">
                    <img src="${imagemSrc}" alt="${bike.nomeproduto}" style="width:100%; height:100%; object-fit:contain;" 
                         onerror="this.src='https://via.placeholder.com/200?text=Sem+Foto'">
                </div>
                <h3>${bike.nomeproduto}</h3>
                <p>R$ ${parseFloat(bike.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p style="color: #777; font-size: 0.8rem; margin-bottom: 10px;">Estoque: ${bike.estoque || 0} un</p> 
                <button class="cta-comprar" onclick="adicionarAoCarrinho('${bike.nomeproduto}', ${bike.preco})">Comprar</button>
            `;
            grid.appendChild(card);
        });
    } catch (erro) {
        grid.innerHTML = "<p>Erro ao carregar o catálogo.</p>";
    }
}

// --- 3. CARRINHO E REDIRECIONAMENTO ---

function adicionarAoCarrinho(nome, preco) {
    carrinho.push({ nome, preco: parseFloat(preco) });
    localStorage.setItem('carrinho_bikes', JSON.stringify(carrinho));
    atualizarContador();
    abrirModal();
}

function atualizarContador() {
    const contador = document.getElementById('contagem-carrinho');
    if (contador) contador.innerText = `(${carrinho.length})`;
}

function finalizarCompra() {
    if (carrinho.length === 0) return alert("Seu carrinho está vazio!");

    const user = localStorage.getItem('usuarioLogado');
    if (!user) {
        alert("Você precisa estar logado para finalizar a compra.");
        abrirModalLogin();
        return;
    }

    // Redireciona automaticamente para a tela de pagamento
    window.location.href = "../pagamento/pagamento.html";
}

// --- 4. INTERFACE E INICIALIZAÇÃO ---

function abrirModal() { document.getElementById('modal-carrinho')?.classList.add('aberto'); }
function fecharModal() { document.getElementById('modal-carrinho')?.classList.remove('aberto'); }
function abrirModalLogin() { 
    const modal = document.getElementById('modal-login');
    if (modal) modal.style.display = 'block'; 
}
function fecharModalLogin() { 
    const modal = document.getElementById('modal-login');
    if (modal) modal.style.display = 'none'; 
}

window.addEventListener('click', (e) => {
    if (e.target.id === 'modal-login') fecharModalLogin();
    // Verifica se clicou fora do modal do carrinho usando a classe ou ID
    if (e.target.classList.contains('modal') || e.target.id === 'modal-carrinho') fecharModal();
});

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutosDoBanco();
    atualizarContador();
    
    // Verifica persistência de login
    const salvo = localStorage.getItem('usuarioLogado');
    if (salvo) {
        const user = JSON.parse(salvo);
        atualizarMenu(user.perfil);
    }
});