const API = "http://127.0.0.1:3000/produtos";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

let todosProdutos = [];
let carrinho = [];

// 1. BUSCAR PRODUTOS DO BANCO DE DADOS
async function carregarCatalogo() {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    try {
        const resposta = await fetch(API, {
            headers: { 'minha-chave': CLIENT_API_KEY }
        });

        if (!resposta.ok) throw new Error("Erro na requisição");

        const dados = await resposta.json();
        
        // Verifique no console (F12) se os dados aparecem agora que o servidor destravou
        console.log("Dados recebidos:", dados);

        todosProdutos = Array.isArray(dados) ? dados : [];
        
        // Configura os filtros usando a coluna correta e renderiza
        configurarFiltroTipos(todosProdutos);
        renderizarProdutos(todosProdutos);

    } catch (erro) {
        console.error("Erro ao carregar catálogo:", erro);
        grid.innerHTML = `<p style="color:red;">Erro de conexão. Verifique se o servidor e a chave API estão corretos.</p>`;
    }
}

// 2. FUNÇÃO PARA CRIAR AS OPÇÕES DE TIPO DINAMICAMENTE
function configurarFiltroTipos(lista) {
    const selectTipo = document.getElementById('select-tipo');
    if (!selectTipo) return;

    // USANDO 'tipoproduto' conforme sua imagem do banco
    const tiposExistentes = [...new Set(lista.map(p => p.tipoproduto).filter(t => t))];

    selectTipo.innerHTML = '<option value="">Todos os Tipos</option>';

    tiposExistentes.sort().forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        selectTipo.appendChild(option);
    });
}

// 3. RENDERIZAR PRODUTOS NA TELA
function renderizarProdutos(lista) {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    if (lista.length === 0) {
        grid.innerHTML = "<p>Nenhum produto encontrado.</p>";
        return;
    }

    grid.innerHTML = lista.map(item => {
        const nome = item.nomeproduto || "Produto sem nome";
        const preco = parseFloat(item.preco) || 0;
        const tipo = item.tipoproduto || "Geral";
        const estoque = item.estoque !== undefined ? item.estoque : 0;

        return `
            <div class="card-produto">
                <img src="../assets/as.png" alt="${nome}" onerror="this.src='https://via.placeholder.com/200?text=Sem+Imagem'">
                <h3>${nome}</h3>
                <span class="preco-tag">R$ ${preco.toLocaleString('pt-br', { minimumFractionDigits: 2 })}</span>
                <p style="font-size: 0.8rem; color: #666;">Categoria: ${tipo}</p>
                <p style="font-size: 0.8rem; color: #666;">Estoque: ${estoque} un</p>
                <button class="btn-adicionar" onclick="adicionarAoCarrinho('${nome}', ${preco})">Adicionar ao Carrinho</button>
            </div>
        `;
    }).join('');
}
// ... (mantenha suas constantes API e KEY no topo)

function aplicarFiltros() {
    // Busca os elementos
    const elBusca = document.getElementById('input-busca');
    const elPreco = document.getElementById('input-preco');
    const elTipo = document.getElementById('select-tipo');

    // SEGURANÇA: Se algum elemento não existir no HTML, a função para aqui e não dá erro
    if (!elBusca || !elPreco || !elTipo) {
        console.warn("Um ou mais campos de filtro não foram encontrados no HTML.");
        return;
    }

    const busca = elBusca.value.toLowerCase();
    const precoMax = parseFloat(elPreco.value) || Infinity;
    const tipoSelecionado = elTipo.value;

    const filtrados = todosProdutos.filter(p => {
        const nome = (p.nomeproduto || "").toLowerCase();
        const preco = parseFloat(p.preco) || 0;
        const tipoNoBanco = p.tipoproduto || ""; // Nome exato da sua imagem

        return nome.includes(busca) && 
               preco <= precoMax && 
               (tipoSelecionado === "" || tipoNoBanco === tipoSelecionado);
    });

    renderizarProdutos(filtrados);
}

function limparFiltros() {
    const elBusca = document.getElementById('input-busca');
    const elPreco = document.getElementById('input-preco');
    const elTipo = document.getElementById('select-tipo');

    if (elBusca) elBusca.value = "";
    if (elPreco) elPreco.value = "";
    if (elTipo) elTipo.value = "";
    
    renderizarProdutos(todosProdutos);
}

// 5. CARRINHO E MODAL
function adicionarAoCarrinho(nome, preco) {
    const item = { id: Date.now(), nome, preco };
    carrinho.push(item);
    atualizarInterface();
    abrirModal();
}

function atualizarInterface() {
    const contador = document.getElementById('contagem-carrinho');
    if (contador) contador.innerText = `(${carrinho.length})`;
    
    const lista = document.getElementById('itens-carrinho');
    const totalElem = document.getElementById('total-carrinho');

    if (lista) {
        lista.innerHTML = carrinho.map(i => `
            <div class="linha-carrinho" style="display:flex; justify-content:space-between; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                <span>${i.nome}</span>
                <strong>R$ ${i.preco.toLocaleString('pt-br', { minimumFractionDigits: 2 })}</strong>
            </div>
        `).join('');
    }

    if (totalElem) {
        const total = carrinho.reduce((acc, curr) => acc + curr.preco, 0);
        totalElem.innerText = `Total: R$ ${total.toLocaleString('pt-br', { minimumFractionDigits: 2 })}`;
    }
}

function abrirModal() { 
    const modal = document.getElementById('modal-carrinho');
    if(modal) modal.style.display = 'block'; 
}
function fecharModal() { 
    const modal = document.getElementById('modal-carrinho');
    if(modal) modal.style.display = 'none'; 
}

// 6. INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    carregarCatalogo();

    const inBusca = document.getElementById('input-busca');
    const inPreco = document.getElementById('input-preco');
    const selTipo = document.getElementById('select-tipo');

    if (inBusca) inBusca.addEventListener('input', aplicarFiltros);
    if (inPreco) inPreco.addEventListener('input', aplicarFiltros);
    if (selTipo) selTipo.addEventListener('change', aplicarFiltros);
});