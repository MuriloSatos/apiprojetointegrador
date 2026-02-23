/* --- CONFIGURAÇÕES --- */
const API = "http://127.0.0.1:3000/produtos";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

let todosProdutos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];

document.addEventListener('DOMContentLoaded', () => {
    carregarCatalogo();
    atualizarMenu();
    atualizarInterfaceCarrinho();

    // Eventos de Filtro
    document.getElementById('input-busca')?.addEventListener('input', aplicarFiltros);
    document.getElementById('input-preco')?.addEventListener('input', aplicarFiltros);
    document.getElementById('select-tipo')?.addEventListener('change', aplicarFiltros);

    // Prévia de imagem em tempo real no Modal
    document.getElementById('cad-imagem')?.addEventListener('input', function () {
        const previa = document.getElementById('previa-img');
        if (previa) {
            previa.src = this.value;
            previa.onerror = () => previa.src = 'https://via.placeholder.com/200?text=Link+Invalido';
        }
    });

    // Envio do formulário
    document.getElementById('form-cadastro-produto')?.addEventListener('submit', salvarNovoProduto);
});

// --- FUNÇÕES DE CARREGAMENTO ---

async function carregarCatalogo() {
    try {
        const resposta = await fetch(API, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const dados = await resposta.json();
        todosProdutos = Array.isArray(dados) ? dados : [];
        configurarFiltroTipos(todosProdutos);
        renderizarProdutos(todosProdutos);
    } catch (erro) {
        console.error("Erro ao carregar catálogo:", erro);
    }
}

function renderizarProdutos(lista) {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    grid.innerHTML = lista.map(item => {
        // Se a imagem for nula ou vazia, usa o novo placeholder
        const imagemSrc = (item.imagem && item.imagem.trim() !== "")
            ? item.imagem
            : "https://placehold.co/300x300?text=Sem+Imagem";

        return `
            <div class="card-produto">
                <div class="img-container">
                    <img src="${imagemSrc}" 
                         alt="${item.nomeproduto}" 
                         onerror="this.src='https://placehold.co/300x300?text=Erro+na+Imagem'">
                </div>
                <div class="info-produto">
                    <h3 title="${item.nomeproduto}">${item.nomeproduto}</h3>
                    <p class="detalhes">Marca: ${item.marcaproduto || 'N/A'} | Tam: ${item.tamanhoproduto || 'N/A'}</p>
                    <span class="preco-tag">R$ ${parseFloat(item.preco).toLocaleString('pt-br', { minimumFractionDigits: 2 })}</span>
                </div>
                <button class="btn-acao-comprar" onclick="adicionarAoCarrinho('${item.nomeproduto}', ${item.preco}, '${item.imagem}')">
                    Comprar
                </button>
            </div>
        `;
    }).join('');
}

// --- SALVAR NO BANCO ---

async function salvarNovoProduto(e) {
    e.preventDefault();

    // Criamos o objeto sem o campo 'id'. 
    // Se o seu banco for SERIAL/AUTO_INCREMENT, ele gera sozinho.
    const novoProduto = {
        nomeproduto: document.getElementById('cad-nome').value,
        tipoproduto: document.getElementById('cad-tipo').value,
        preco: parseInt(document.getElementById('cad-preco').value),
        tamanhoproduto: document.getElementById('cad-tamanho').value,
        marcaproduto: document.getElementById('cad-marca').value,
        codigoproduto: parseInt(document.getElementById('cad-codigo').value),
        estoque: parseInt(document.getElementById('cad-estoque').value),
        imagem: document.getElementById('cad-imagem').value
    };

    try {
        const res = await fetch(API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'minha-chave': CLIENT_API_KEY
            },
            body: JSON.stringify(novoProduto)
        });

        const resultado = await res.json();

        if (res.ok) {
            alert("✅ Produto Salvo com Sucesso!");
            fecharModalCadastro();
            carregarCatalogo();
            e.target.reset();
            document.getElementById('previa-img').src = '';
        } else {
            // Caso ocorra o erro de chave duplicada (produto_pkey)
            alert("❌ Erro ao salvar: " + (resultado.detalhes || resultado.erro || "Verifique o código do produto."));
        }
    } catch (err) {
        console.error(err);
        alert("Erro de conexão com o servidor.");
    }
}

// --- FUNÇÕES DE INTERFACE ---

function abrirModal() { document.getElementById('modal-carrinho').style.display = 'block'; }
function fecharModal() { document.getElementById('modal-carrinho').style.display = 'none'; }
function abrirModalCadastro() { document.getElementById('modal-novo-produto').style.display = 'block'; }
function fecharModalCadastro() { document.getElementById('modal-novo-produto').style.display = 'none'; }
function abrirModalLogin() { window.location.href = "../usuario/usuario.html"; }

function aplicarFiltros() {
    const busca = document.getElementById('input-busca').value.toLowerCase();
    const precoMax = parseFloat(document.getElementById('input-preco').value) || Infinity;
    const tipo = document.getElementById('select-tipo').value;

    const filtrados = todosProdutos.filter(p => {
        const nomeOk = p.nomeproduto.toLowerCase().includes(busca);
        const precoOk = p.preco <= precoMax;
        const tipoOk = (tipo === "" || p.tipoproduto === tipo);
        return nomeOk && precoOk && tipoOk;
    });
    renderizarProdutos(filtrados);
}

function configurarFiltroTipos(lista) {
    const select = document.getElementById('select-tipo');
    if (!select) return;
    const tipos = [...new Set(lista.map(p => p.tipoproduto).filter(t => t))];
    select.innerHTML = '<option value="">Todas</option>' +
        tipos.map(t => `<option value="${t}">${t}</option>`).join('');
}

function atualizarMenu() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const btn = document.getElementById('btn-abrir-cadastro');
    if (user && user.perfil === "adm" && btn) {
        btn.style.display = 'block';
    }
}

function atualizarInterfaceCarrinho() {
    const contagem = document.getElementById('contagem-carrinho');
    if (contagem) contagem.innerText = `(${carrinho.length})`;
}

function adicionarAoCarrinho(nome, preco, img) {
    carrinho.push({ nome, preco, img });
    localStorage.setItem('carrinho_bikes', JSON.stringify(carrinho));
    atualizarInterfaceCarrinho();
    alert(`🛒 ${nome} adicionado ao carrinho!`);
}


// Altere a função atualizarMenu para gerenciar o botão de Login/Sair
function atualizarMenu() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const btnNovoProduto = document.getElementById('btn-abrir-cadastro');
    const btnLoginTop = document.querySelector('.btn-login-top');

    if (user) {
        // Se está logado, muda o botão de "Login" para "Sair"
        if (btnLoginTop) {
            btnLoginTop.innerText = `Sair (${user.nome})`;
            btnLoginTop.onclick = logout;
            btnLoginTop.style.background = "#cc0000"; // Cor de alerta para sair
        }

        // Se for admin, mostra o botão de cadastrar produto
        if (user.perfil === "adm" && btnNovoProduto) {
            btnNovoProduto.style.display = 'block';
        }
    } else {
        // Se não está logado, volta ao padrão
        if (btnLoginTop) {
            btnLoginTop.innerText = "Login";
            btnLoginTop.onclick = abrirModalLogin;
            btnLoginTop.style.background = "var(--primaria)";
        }
        if (btnNovoProduto) btnNovoProduto.style.display = 'none';
    }
}

// Função de Logout
function logout() {
    localStorage.removeItem('usuarioLogado');
    alert("Você saiu do sistema.");
    window.location.reload(); // Recarrega para atualizar a interface
}

// Ajuste na função de abrir login para garantir o caminho correto
function abrirModalLogin() {
    // Certifique-se que o caminho usuario/usuario.html existe em relação ao produto.html
    window.location.href = "../usuario/usuario.html";
}


// Exemplo de lógica para o seu arquivo usuario.js
async function realizarLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    try {
        // Aqui você chamaria sua API de usuários. 
        // Exemplo simulado baseado na estrutura que você já usa:
        const res = await fetch("http://127.0.0.1:3000/usuarios/", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const dados = await res.json();

        if (res.ok) {
            // Salva o objeto do usuário (nome, perfil, etc) no localStorage
            localStorage.setItem('usuarioLogado', JSON.stringify(dados.usuario));
            alert("Bem-vindo, " + dados.usuario.nome);
            window.location.href = "../produto/produto.html"; // Volta para o catálogo
        } else {
            alert("Usuário ou senha inválidos!");
        }
    } catch (err) {
        console.error("Erro no login:", err);
        alert("Erro ao conectar com o servidor.");
    }
}