const API = "http://127.0.0.1:3000/produtos";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

let todosProdutos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];

document.addEventListener('DOMContentLoaded', () => {
    carregarCatalogo();
    atualizarMenu();
    atualizarInterfaceCarrinho(); // Agora a função existe abaixo

    // Eventos
    document.getElementById('input-busca')?.addEventListener('input', aplicarFiltros);
    document.getElementById('input-preco')?.addEventListener('input', aplicarFiltros);
    document.getElementById('select-tipo')?.addEventListener('change', aplicarFiltros);
    document.getElementById('form-cadastro-produto')?.addEventListener('submit', salvarNovoProduto);

    // Prévia da Imagem
    document.getElementById('cad-imagem')?.addEventListener('change', function(e) {
        const reader = new FileReader();
        reader.onload = function() {
            document.getElementById('previa-img').src = reader.result;
        };
        if(e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
    });
});

// --- MENU E LOGIN ---
function atualizarMenu() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const menuNavegacao = document.getElementById('menu-navegacao');
    const menuDireita = document.getElementById('menu-direita');
    const btnNovoProduto = document.getElementById('btn-abrir-cadastro');

    if (user && menuDireita) {
        if (user.perfil === "adm") {
            menuNavegacao.innerHTML = `
                <li><a href="../index/index.html">Início</a></li>
                <li><a href="../produto/produto.html">Catálogo</a></li>
                <li><a href="../vendas/vendas.html">Vendas</a></li>
                <li><a href="../cliente/cliente.html">Clientes</a></li>
                <li><a href="../usuario/usuario.html">Usuários</a></li>
            `;
            if (btnNovoProduto) btnNovoProduto.style.display = 'block';
        }

        menuDireita.innerHTML = `
            <li><a href="javascript:void(0)" onclick="abrirModal()">🛒 Carrinho <span id="contagem-carrinho"></span></a></li>
            <li><a href="javascript:void(0)" onclick="logout()" style="color: #ff4444; font-weight: bold; margin-left: 15px;">Sair (${user.nome.split(' ')[0]})</a></li>
        `;
    }
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.reload();
}

// --- CATALOGO ---
async function carregarCatalogo() {
    try {
        const resposta = await fetch(API, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const dados = await resposta.json();
        todosProdutos = Array.isArray(dados) ? dados : [];
        renderizarProdutos(todosProdutos);
        popularFiltroCategorias(todosProdutos);
    } catch (erro) {
        console.error("Erro:", erro);
    }
}

function renderizarProdutos(lista) {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    const URL_ASSETS = "http://127.0.0.1:3000/assets/";

    grid.innerHTML = lista.map(item => {
        const imgPath = item.imagem ? (item.imagem.startsWith('http') ? item.imagem : URL_ASSETS + item.imagem) : '../assets/sem-foto.png';
        return `
            <div class="card-produto">
                <div class="img-container"><img src="${imgPath}" onerror="this.src='../assets/sem-foto.png'"></div>
                <div class="info-produto">
                    <h3>${item.nomeproduto}</h3>
                    <p>${item.marcaproduto} | ${item.tamanhoproduto}</p>
                    <span class="preco-tag">R$ ${item.preco}</span>
                </div>
                <button class="btn-acao-comprar" onclick="adicionarAoCarrinho('${item.nomeproduto}', ${item.preco}, '${item.imagem}')">Comprar</button>
            </div>
        `;
    }).join('');
}

async function salvarNovoProduto(e) {
    e.preventDefault();

    // Cria o FormData diretamente do formulário (e.target)
    // Isso evita o erro de 'null' se algum ID estiver errado
    const formData = new FormData(e.target);

    // Verificação de segurança: se não houver arquivo, avise o usuário
    const fileInput = document.getElementById('cad-imagem');
    if (!fileInput || fileInput.files.length === 0) {
        alert("Por favor, selecione uma imagem.");
        return;
    }

    try {
        const res = await fetch(API, {
            method: 'POST',
            headers: { 
                'minha-chave': CLIENT_API_KEY 
                // NOTA: Não defina Content-Type aqui, o navegador faz isso para FormData
            },
            body: formData
        });

        if (res.ok) {
            alert("✅ Produto adicionado com sucesso!");
            location.reload();
        } else {
            const erroData = await res.json();
            alert("❌ Erro: " + (erroData.detalhes || "Verifique os dados enviados."));
        }
    } catch (err) {
        console.error("Erro na requisição:", err);
        alert("Erro ao conectar com o servidor.");
    }
}
// --- CARRINHO ---
function atualizarInterfaceCarrinho() {
    const contador = document.getElementById('contagem-carrinho');
    if (contador) {
        const total = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
        contador.innerText = `(${total})`;
    }
}

function adicionarAoCarrinho(nome, preco, imagem) {
    const item = carrinho.find(i => i.nome === nome);
    if (item) item.quantidade++;
    else carrinho.push({ nome, preco, imagem, quantidade: 1 });
    
    localStorage.setItem('carrinho_bikes', JSON.stringify(carrinho));
    atualizarInterfaceCarrinho();
    alert("Adicionado ao carrinho!");
}

// Modais
function abrirModalCadastro() { document.getElementById('modal-novo-produto').style.display = 'block'; }
function fecharModalCadastro() { document.getElementById('modal-novo-produto').style.display = 'none'; }
function aplicarFiltros() { /* sua lógica de filtro aqui */ }
function popularFiltroCategorias(p) { /* sua lógica aqui */ }