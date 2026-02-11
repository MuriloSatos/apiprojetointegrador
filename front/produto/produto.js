// Simulação de Banco de Dados de Bikes
const maquinas = [
    { id: 1, nome: "Mountain Pro Extreme", preco: 4500.00, img: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=500" },
    { id: 2, nome: "Speed Carbon R", preco: 8200.00, img: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500" },
    { id: 3, nome: "Urban City Light", preco: 2100.00, img: "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=500" },
];

let carrinho = [];

// Função para renderizar o catálogo
function carregarCatalogo() {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    grid.innerHTML = maquinas.map(item => `
        <div class="card-produto">
            <img src="${item.img}" alt="${item.nome}">
            <h3>${item.nome}</h3>
            <span class="preco-tag">R$ ${item.preco.toLocaleString('pt-br', {minimumFractionDigits: 2})}</span>
            <button class="btn-adicionar" onclick="adicionarAoCarrinho(${item.id})">Adicionar ao Carrinho</button>
        </div>
    `).join('');
}

// Lógica do Carrinho
function adicionarAoCarrinho(id) {
    const item = maquinas.find(p => p.id === id);
    carrinho.push(item);
    atualizarInterface();
}

function atualizarInterface() {
    // Atualiza número no menu
    document.getElementById('contagem-carrinho').innerText = `(${carrinho.length})`;
    
    // Atualiza lista no modal
    const lista = document.getElementById('itens-carrinho');
    const totalElem = document.getElementById('total-carrinho');
    
    lista.innerHTML = carrinho.map(i => `<p style="display:flex; justify-content:space-between;">${i.nome} <span>R$ ${i.preco}</span></p>`).join('');
    
    const total = carrinho.reduce((acc, curr) => acc + curr.preco, 0);
    totalElem.innerText = `Total: R$ ${total.toLocaleString('pt-br', {minimumFractionDigits: 2})}`;
}

// Funções do Modal
function abrirModal() {
    document.getElementById('modal-carrinho').style.display = 'block';
}

function fecharModal() {
    document.getElementById('modal-carrinho').style.display = 'none';
}

// Iniciar
window.onload = carregarCatalogo;