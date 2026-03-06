const API = "http://127.0.0.1:3000/produtos";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

let todosProdutos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];

// --- 1. FUNÇÕES DE INTERFACE ---
function atualizarInterfaceCarrinho() {
    const contador = document.getElementById('contagem-carrinho');
    if (contador) {
        const total = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
        contador.innerText = `(${total})`;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));

    // Verifica se o usuário está logado E se o perfil é válido
    const ehAdm = user && user.perfil === 'adm';
    const ehCliente = user && user.perfil === 'cliente';

    // Se NÃO for nem adm e nem cliente, bloqueia o acesso
    if (!ehAdm && !ehCliente) {
        alert("Acesso restrito a usuários logados.");
        window.location.href = "../index/index.html";
    }
});

document.addEventListener('submit', async (e) => {
    if (e.target.id === 'form-login') {
        e.preventDefault();

        // trim() remove espaços acidentais antes ou depois da digitação
        const emailInput = document.getElementById('login-email').value.trim();
        const senhaInput = document.getElementById('login-senha').value.trim();

        try {
            const res = await fetch(API_LOGIN, { headers: { 'minha-chave': CLIENT_API_KEY } });
            const usuarios = await res.json();

            // Log para verificar se os dados chegaram do banco
            console.log("Usuários carregados:", usuarios);

            // Tenta encontrar o usuário
            const user = usuarios.find(u =>
                u.email.trim() === emailInput &&
                u.senha.trim() === senhaInput
            );

            if (user) {
                localStorage.setItem('usuarioLogado', JSON.stringify(user));
                alert(`Login realizado com sucesso! Bem-vindo ${user.nome}`);
                // Redireciona ou atualiza o menu
                window.location.reload();
            } else {
                console.log("Tentativa falha para:", emailInput);
                alert("Usuário ou senha inválidos!");
            }
        } catch (err) {
            console.error("Erro na conexão:", err);
            alert("Erro ao conectar ao servidor.");
        }
    }
});


function atualizarMenu() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const menuNavegacao = document.getElementById('menu-navegacao');
    const menuDireita = document.getElementById('menu-direita');
    const btnNovoProduto = document.getElementById('btn-abrir-cadastro');

    if (user && menuDireita) {
        if (user.perfil === "adm") {
            if (menuNavegacao) {
                menuNavegacao.innerHTML = `
                    <li><a href="../index/index.html">Início</a></li>
                    <li><a href="../produto/produto.html">Catálogo</a></li>
                    <li><a href="../vendas/vendas.html">Vendas</a></li>
                    <li><a href="../cliente/cliente.html">Clientes</a></li>
                    <li><a href="../usuario/usuario.html">Usuários</a></li>
                `;
            }
            if (btnNovoProduto) btnNovoProduto.style.display = 'block';
        }

        menuDireita.innerHTML = `
            <li><a href="javascript:void(0)" onclick="abrirModalCarrinho()">🛒 Carrinho <span id="contagem-carrinho"></span></a></li>
            <li><a href="javascript:void(0)" onclick="logout()" style="color: #ff4444; font-weight: bold; margin-left: 15px;">Sair (${user.nome.split(' ')[0]})</a></li>
        `;
        atualizarInterfaceCarrinho();
    }
}

// --- 2. INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    carregarCatalogo();
    atualizarMenu();
    atualizarInterfaceCarrinho();

    // Listeners de busca e filtros
    document.getElementById('input-busca')?.addEventListener('input', aplicarFiltros);
    document.getElementById('input-preco')?.addEventListener('input', aplicarFiltros);
    document.getElementById('select-tipo')?.addEventListener('change', aplicarFiltros);
    document.getElementById('form-cadastro-produto')?.addEventListener('submit', salvarNovoProduto);

    // Pré-visualização da imagem no cadastro
    const cadImagem = document.getElementById('cad-imagem');
    if (cadImagem) {
        cadImagem.addEventListener('change', function (e) {
            const reader = new FileReader();
            reader.onload = function () {
                const imgPrevia = document.getElementById('previa-img');
                if (imgPrevia) imgPrevia.src = reader.result;
            };
            if (e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
        });
    }
});

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.reload();
}

// --- 3. PRODUTOS ---
async function carregarCatalogo() {
    try {
        const resposta = await fetch(API, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const dados = await resposta.json();
        todosProdutos = Array.isArray(dados) ? dados : [];
        renderizarProdutos(todosProdutos);
        popularFiltroCategorias(todosProdutos);
    } catch (erro) {
        console.error("Erro ao carregar catálogo:", erro);
    }
}

function renderizarProdutos(lista) {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    const URL_ASSETS = "http://127.0.0.1:3000/assets/";

    grid.innerHTML = lista.map(item => {
        const imgPath = item.imagem ? (item.imagem.startsWith('http') ? item.imagem : URL_ASSETS + item.imagem) : '../assets/sem-foto.png';
        const precoNum = parseFloat(item.preco || 0);

        return `
            <div class="card-produto">
                <div class="img-container"><img src="${imgPath}" onerror="this.src='../assets/sem-foto.png'"></div>
                <div class="info-produto">
                    <h3>${item.nomeproduto}</h3>
                    <p>${item.marcaproduto} | ${item.tamanhoproduto}</p>
                    <span class="preco-tag">R$ ${precoNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <button class="btn-acao-comprar" onclick="adicionarAoCarrinho('${item.nomeproduto}', ${precoNum}, '${item.imagem}')">Comprar</button>
            </div>
        `;
    }).join('');
}

async function salvarNovoProduto(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    // Validação e limpeza de campos numéricos
    const camposNumericos = ['preco', 'codigoproduto', 'estoque'];
    for (let campo of camposNumericos) {
        let valorOriginal = formData.get(campo);
        let valorLimpo = valorOriginal.replace(',', '.').trim();

        if (valorLimpo === "" || isNaN(valorLimpo)) {
            alert(`O campo ${campo} precisa de um número válido.`);
            return;
        }

        formData.set(campo, campo === 'preco' ? parseFloat(valorLimpo) : Math.floor(Number(valorLimpo)));
    }

    try {
        const res = await fetch(API, {
            method: 'POST',
            headers: { 'minha-chave': CLIENT_API_KEY },
            body: formData
        });

        const dados = await res.json();

        if (res.ok) {
            alert("✅ Produto cadastrado com sucesso!");
            fecharModalCadastro();
            carregarCatalogo(); // Recarrega a lista sem dar refresh na página toda
        } else {
            alert("❌ Erro: " + (dados.detalhes || "Erro ao salvar."));
        }
    } catch (err) {
        console.error("Erro na requisição:", err);
        alert("Erro ao conectar com o servidor.");
    }
}

// --- 4. CARRINHO E FILTROS ---

function atualizarInterfaceCarrinho() {
    const contador = document.getElementById('contagem-carrinho');
    if (contador) {
        const carrinhoAtual = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
        const total = carrinhoAtual.reduce((sum, item) => sum + item.quantidade, 0);
        contador.innerText = `(${total})`;
    }
}

function adicionarAoCarrinho(nome, preco, imagem) {
    let carrinhoAtual = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
    
    const item = carrinhoAtual.find(i => i.nome === nome);
    if (item) {
        item.quantidade++;
    } else {
        carrinhoAtual.push({ nome, preco: parseFloat(preco), imagem, quantidade: 1 });
    }

    localStorage.setItem('carrinho_bikes', JSON.stringify(carrinhoAtual));
    atualizarInterfaceCarrinho();
    alert("🚲 " + nome + " adicionado ao carrinho!");
}

function renderizarItensCarrinho() {
    const container = document.getElementById('itens-carrinho');
    const totalElemento = document.getElementById('total-carrinho');
    const carrinhoAtual = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
    
    if (!container) return;

    if (carrinhoAtual.length === 0) {
        container.innerHTML = "<p style='text-align:center;'>Seu carrinho está vazio.</p>";
        if (totalElemento) totalElemento.innerText = "Total: R$ 0,00";
        return;
    }

    let totalGeral = 0;
    container.innerHTML = carrinhoAtual.map((item, index) => {
        const preco = parseFloat(item.preco) || 0;
        const subtotal = preco * item.quantidade;
        totalGeral += subtotal;
        
        return `
            <div class="item-carrinho" style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #ccc; padding:5px;">
                <div>
                    <strong>${item.nome}</strong><br>
                    Qtd: ${item.quantidade} - R$ ${preco.toFixed(2)}
                </div>
                <button onclick="removerDoCarrinho(${index})" style="background:red; color:white; border:none; cursor:pointer;">Remover</button>
            </div>
        `;
    }).join('');

    if (totalElemento) {
        totalElemento.innerText = `Total: R$ ${totalGeral.toFixed(2)}`;
    }
}

function removerDoCarrinho(index) {
    let carrinhoAtual = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
    carrinhoAtual.splice(index, 1);
    localStorage.setItem('carrinho_bikes', JSON.stringify(carrinhoAtual));
    atualizarInterfaceCarrinho();
    renderizarItensCarrinho(); 
}

// Modal Carrinho
function abrirModalCarrinho() { 
    const modal = document.getElementById('modal-carrinho');
    if(modal) {
        modal.style.display = 'block'; 
        renderizarItensCarrinho();
    }
}

function fecharModalCarrinho() { 
    const modal = document.getElementById('modal-carrinho');
    if(modal) modal.style.display = 'none'; 
}

// Modal Cadastro
function abrirModalCadastro() { document.getElementById('modal-novo-produto').style.display = 'block'; }
function fecharModalCadastro() { document.getElementById('modal-novo-produto').style.display = 'none'; }

// Filtros
function aplicarFiltros() {
    const busca = document.getElementById('input-busca')?.value.toLowerCase() || "";
    const precoMax = parseFloat(document.getElementById('input-preco')?.value) || Infinity;
    const tipo = document.getElementById('select-tipo')?.value || "";

    const filtrados = todosProdutos.filter(p => {
        const matchesBusca = p.nomeproduto.toLowerCase().includes(busca) || p.marcaproduto.toLowerCase().includes(busca);
        const matchesPreco = parseFloat(p.preco) <= precoMax;
        const matchesTipo = tipo === "" || p.tipoproduto === tipo;
        return matchesBusca && matchesPreco && matchesTipo;
    });
    renderizarProdutos(filtrados);
}

function popularFiltroCategorias(produtos) {
    const select = document.getElementById('select-tipo');
    if (!select) return;
    const tipos = [...new Set(produtos.map(p => p.tipoproduto))].filter(t => t);
    select.innerHTML = '<option value="">Todas</option>' +
        tipos.map(t => `<option value="${t}">${t}</option>`).join('');
}