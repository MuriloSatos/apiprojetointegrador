const API = "https://apiprojetointegrador.onrender.com/produtos";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

let todosProdutos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
let paginaAtual = 1;
const itensPorPagina = 8;



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
// Localize o evento de submit do seu formulário de login
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'form-login') {
        e.preventDefault();
        // ... lógica de captura de inputs ...

        try {
            const res = await fetch(API_LOGIN, { headers: { 'minha-chave': CLIENT_API_KEY } });
            const usuarios = await res.json();

            // Tenta encontrar o usuário pelo email e senha
            const user = usuarios.find(u =>
                u.email.trim() === emailInput &&
                u.senha.trim() === senhaInput
            );

            if (user) {
                // SALVAMENTO CRÍTICO: Use o ID que veio da sua tabela do banco
                localStorage.setItem('usuarioLogado', JSON.stringify({
                    id: user.id, // Certifique-se que o campo no seu banco chama 'id'
                    nome: user.nome,
                    perfil: user.perfil
                }));
                alert(`Login realizado com sucesso! Bem-vindo ${user.nome}`);
                window.location.reload();
            } else {
                alert("Usuário ou senha inválidos!");
            }
        } catch (err) {
            console.error("Erro na conexão:", err);
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
const ITENS_POR_PAGINA = 4; // Define o limite de 4 produtos

function renderizarPaginacao(totalItens, paginaAtual) {
    const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA);

    // Remove paginação antiga para não acumular
    const containerAntigo = document.querySelector('.paginacao-container');
    if (containerAntigo) containerAntigo.remove();

    // Cria o container que o CSS vai estilizar
    const container = document.createElement('div');
    container.className = 'paginacao-container';

    for (let i = 1; i <= totalPaginas; i++) {
        const botao = document.createElement('button');
        botao.innerText = i;

        // Aplica a classe que criamos no CSS
        botao.className = `pag-btn ${i === paginaAtual ? 'active' : ''}`;

        botao.onclick = () => {
            // Aqui você deve chamar sua função de carregar produtos passando a página 'i'
            carregarProdutos(i);
            window.scrollTo(0, 0);
        };

        container.appendChild(botao);
    }

    // Insere o container de paginação logo após o grid de produtos
    document.getElementById('catalogo-home').after(container);
}

function renderizarProdutos(lista, resetar = false) {
    if (resetar) paginaAtual = 1;
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    // Lógica de paginação
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const itensPagina = lista.slice(inicio, fim);

    const URL_ASSETS = "http://127.0.0.1:3000/assets/";

    grid.innerHTML = itensPagina.map(item => {
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
                        <button class="btn-acao-comprar" onclick="adicionarAoCarrinho('${item.codigoproduto}', '${item.nomeproduto}', ${precoNum})">Comprar</button>            </div>
        `;
    }).join('');

    renderizarControlesPaginacao(lista.length);
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






async function renderizarItensCarrinho() {
    const listaCarrinho = document.getElementById('itens-carrinho');
    const totalElemento = document.getElementById('total-carrinho');
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!listaCarrinho || !user) return;

    try {
        const response = await fetch(`https://apiprojetointegrador.onrender.com/carrinho/${user.id}`, {
            headers: { 'minha-chave': CLIENT_API_KEY }
        });
        const dados = await response.json();

        let totalGeral = 0;
        listaCarrinho.innerHTML = dados.map(item => {
            // Garante que o nome venha da coluna certa do seu novo routes/carrinho.js
            const nome = item.nomeproduto || "Produto Desconhecido";
            const preco = parseFloat(item.preco) || 0;
            const subtotal = preco * item.pecaquantidade;
            totalGeral += subtotal;

            return `
                <div class="item-carrinho">
                    <strong>${item.nome}</strong>
                    <span>Qtd: ${item.pecaquantidade} - R$ ${preco.toFixed(2)}</span>
                    <button onclick="removerDoCarrinho(${item.id_carrinho})">Remover</button>
                </div>
            `;
        }).join('');

        if (totalElemento) totalElemento.innerText = `R$ ${totalGeral.toFixed(2)}`;
    } catch (err) {
        console.error("Erro ao renderizar carrinho:", err);
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
    if (modal) {
        modal.style.display = 'block';
        renderizarItensCarrinho();
    }
}

function fecharModalCarrinho() {
    const modal = document.getElementById('modal-carrinho');
    if (modal) modal.style.display = 'none';
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
    // Dentro da função aplicarFiltros, substitua o final por:
    renderizarProdutos(filtrados, true);
}

function renderizarControlesPaginacao(totalItens) {
    let container = document.getElementById('paginacao-container');

    // Se o container não existir, vamos criá-lo
    if (!container) {
        container = document.createElement('div');
        container.id = 'paginacao-container';
        container.className = 'paginacao-container';

        // Em vez de buscar o 'main', vamos anexar ao final da página ou após o grid
        const grid = document.getElementById('catalogo-home');
        if (grid && grid.parentNode) {
            grid.parentNode.insertBefore(container, grid.nextSibling);
        } else {
            document.body.appendChild(container);
        }
    }

    container.innerHTML = '';
    const totalPaginas = Math.ceil(totalItens / itensPorPagina);

    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = `btn-pag ${i === paginaAtual ? 'ativo' : ''}`;
        btn.onclick = () => {
            paginaAtual = i;
            renderizarProdutos(todosProdutos);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        container.appendChild(btn);
    }
}

async function finalizarCompra() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!user) return alert("Faça login para finalizar!");

    try {
        // 1. Envia o sinal para o backend criar a venda com base no carrinho
        const response = await fetch(`https://apiprojetointegrador.onrender.com/vendas`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'minha-chave': 'SUA_CHAVE_SECRETA_MUITO_FORTE_123456' 
            },
            body: JSON.stringify({ id_usuario: user.id })
        });

        if (response.ok) {
            alert("Pedido realizado com sucesso!");
            window.location.href = "../pedidos/pedidos.html"; // Vai para a tela da sua foto
        } else {
            alert("Erro ao processar venda.");
        }
    } catch (err) {
        console.error("Erro ao finalizar:", err);
    }
}

// --- 4. CARRINHO (INTEGRADO AO BANCO) ---

// --- 4. CARRINHO (BANCO DE DADOS - AJUSTADO) ---

// 1. ISSO DEVE ESTAR NO TOPO DO SEU ARQUIVO (FORA DE QUALQUER FUNÇÃO)
// Verifique se o valor é EXATAMENTE igual ao que está no seu backend/Render

async function atualizarInterfaceCarrinho() {
    const userData = localStorage.getItem('usuarioLogado');
    const contador = document.getElementById('contagem-carrinho');

    if (!userData || !contador) return;

    try {
        const user = JSON.parse(userData);
        // O log abaixo vai te mostrar qual ID está sendo enviado (ex: 16 ou 3)
        console.log("Buscando carrinho para o usuário ID:", user.id);

        const res = await fetch(`https://apiprojetointegrador.onrender.com/carrinho/${user.id}`, {
            headers: { 'minha-chave': CLIENT_API_KEY }
        });

        if (!res.ok) {
            const erroCorpo = await res.json();
            throw new Error(erroCorpo.mensagem || "Erro no Servidor");
        }

        const itens = await res.json();
        const total = Array.isArray(itens)
            ? itens.reduce((sum, item) => sum + (Number(item.pecaquantidade) || 0), 0)
            : 0;

        contador.innerText = `(${total})`;
    } catch (err) {
        console.error("ERRO CRÍTICO NO CONTADOR:", err.message);
    }
}

// --- NOTIFICAÇÃO NO CANTO DA TELA (TOAST) ---
function mostrarNotificacao(mensagem) {
    // Remove notificações antigas para não acumular
    const antiga = document.querySelector('.toast-notificacao');
    if (antiga) antiga.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notificacao';
    toast.innerText = mensagem;
    document.body.appendChild(toast);

    // Remove após 3 segundos
    setTimeout(() => {
        toast.classList.add('esconder');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- ADICIONAR AO CARRINHO (COM NOTIFICAÇÃO) ---
async function adicionarAoCarrinho(codigoproduto, nomeproduto, preco, imagem) {
    console.log("Adicionando:", nomeproduto, codigoproduto, preco);
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!user || !user.id) {
        alert("Faça login novamente!");
        return;
    }

    // 1. DADOS PARA O BANCO (O que o seu Thunder Client mostrou)
    const dadosApi = {
        id_usuario: parseInt(user.id),
        codigoproduto: parseInt(codigoproduto),
        pecaquantidade: 1
    };

    try {
        const response = await fetch('https://apiprojetointegrador.onrender.com/carrinho', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'minha-chave': CLIENT_API_KEY
            },
            body: JSON.stringify(dadosApi)
        });

        if (response.ok) {
            // 2. DADOS PARA A TELA (Salva no localStorage para o modal ler nome e preco)
            let carrinhoLocal = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];

            // Verifica se já existe no local para somar quantidade
            const itemExistente = carrinhoLocal.find(item => item.nome === nomeproduto);

            if (itemExistente) {
                itemExistente.quantidade++;
            } else {
                carrinhoLocal.push({
                    nome: nomeproduto, // Chave 'nome' para bater com seu modal
                    preco: parseFloat(preco),
                    imagem: imagem || '../assets/sem-foto.png',
                    quantidade: 1
                });
            }

            localStorage.setItem('carrinho_bikes', JSON.stringify(carrinhoLocal));

            // 3. ATUALIZA A INTERFACE
            if (typeof showToast === 'function') {
                showToast(`✅ ${nomeproduto} adicionado!`, "success");
            } else {
                alert(`${nomeproduto} adicionado!`);
            }

            atualizarContador(); // Atualiza o número no ícone do carrinho
            if (document.getElementById('modal-carrinho')?.classList.contains('aberto')) {
                renderizarCarrinhoNoModal();
            }
        } else {
            const erro = await response.json();
            alert("Erro: " + (erro.mensagem || "Erro ao adicionar"));
        }
    } catch (erro) {
        console.error("Erro de rede:", erro);
    }
}

// --- RENDERIZAR ITENS (CORREÇÃO DO UNDEFINED) ---
async function renderizarItensCarrinho() {
    const container = document.getElementById('itens-carrinho');
    const totalElemento = document.getElementById('total-carrinho');
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!container || !user) return;

    try {
        const response = await fetch(`https://apiprojetointegrador.onrender.com/carrinho/${user.id}`, {
            headers: { 'minha-chave': 'SUA_CHAVE_SECRETA_MUITO_FORTE_123456' }
        });

        const dados = await response.json();
        console.log("DADOS QUE CHEGARAM NO FRONT:", dados); //

        container.innerHTML = "";
        let totalGeral = 0;

        if (!dados || dados.length === 0) {
            container.innerHTML = "<p style='padding:20px; text-align:center;'>Seu carrinho está vazio.</p>";
            if (totalElemento) totalElemento.innerText = "R$ 0,00";
            return;
        }

        // front/produto/produto.js
        dados.forEach(item => {
            // Agora usamos os nomes simplificados do SQL acima
            const nome = item.nomeproduto || "Produto sem nome";
            const precoUnitario = parseFloat(item.preco) || 0;
            const quantidade = parseInt(item.qtd) || 0;
            const subtotal = precoUnitario * quantidade;

            totalGeral += subtotal;

            container.innerHTML += `
        <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">
            <div>
                <strong>${nome}</strong><br>
                <span>${quantidade}x de R$ ${precoUnitario.toFixed(2)}</span>
            </div>
            <div style="text-align: right;">
                <span style="font-weight: bold;">R$ ${subtotal.toFixed(2)}</span><br>
                <button onclick="removerDoCarrinho(${item.id_carrinho})" style="color: red; border: none; background: none; cursor: pointer;">Remover</button>
            </div>
        </div>
    `;
        });

        if (totalElemento) {
            totalElemento.innerText = `R$ ${totalGeral.toFixed(2)}`;
        }

    } catch (err) {
        console.error("Erro ao carregar modal:", err);
    }
}


// Remover item do banco via ID da linha do carrinho
async function removerDoCarrinho(id_carrinho) {
    if (!confirm("Remover este item?")) return;

    try {
        const response = await fetch(`https://apiprojetointegrador.onrender.com/carrinho/${id_carrinho}`, {
            method: 'DELETE',
            headers: { 'minha-chave': CLIENT_API_KEY }
        });

        if (response.ok) {
            renderizarItensCarrinho(); // Recarrega a lista
            atualizarInterfaceCarrinho(); // Atualiza o contador
        }
    } catch (err) {
        console.error("Erro ao remover item:", err);
    }
}


function atualizarContador() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!user) return;

    fetch(`https://apiprojetointegrador.onrender.com/carrinho/${user.id}`, {
        headers: { 'minha-chave': CLIENT_API_KEY }
    })
        .then(res => res.json())
        .then(dados => {
            const spanContador = document.querySelector('.carrinho-count');
            if (spanContador) spanContador.innerText = dados.length || 0;
        })
        .catch(err => console.error("Erro no contador:", err));
}

// Exemplo de como deve ser a criação do card no seu produto.js
function criarCardProduto(produto) {
    return `
        <div class="card">
            <img src="${produto.imagem}" alt="${produto.nomeproduto}">
            <h3>${produto.nomeproduto}</h3>
            <p>R$ ${produto.preco.toFixed(2)}</p>
            <button onclick="adicionarAoCarrinho('${produto.codigoproduto}', '${produto.nomeproduto}', ${produto.preco})">
                Comprar
            </button>
        </div>
    `;
}