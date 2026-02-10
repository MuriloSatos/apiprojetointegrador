const API = "http://127.0.0.1:3000/produtos";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";
let carrinho = [];

// 1. CARREGAR PRODUTOS DO BANCO
async function carregarProdutosDoBanco() {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    try {
        const resposta = await fetch(API, {
            headers: { 'minha-chave': CLIENT_API_KEY }
        });
        const produtos = await resposta.json();

        grid.innerHTML = ""; 

        produtos.forEach(bike => {
            const card = document.createElement('div');
            card.className = 'card';
            
            // Renderiza nomeproduto, preco e estoque conforme sua tabela
            card.innerHTML = `
                <div class="img-placeholder">
                    <img src="../assets/as.png" alt="${bike.nomeproduto}" style="width:100%; height:100%; object-fit:contain;">
                </div>
                <h3>${bike.nomeproduto}</h3>
                <p>R$ ${parseFloat(bike.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p style="color: #777; font-size: 0.85rem; margin-bottom: 10px;">Estoque: ${bike.estoque || 0} un</p> 
                <button class="cta-comprar" onclick="adicionarAoCarrinho('${bike.nomeproduto}', ${bike.preco})">Comprar</button>
            `;
            grid.appendChild(card);
        });
    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        grid.innerHTML = "<p>Erro ao carregar as bicicletas do catálogo.</p>";
    }
}

// 2. FUNÇÕES DO MODAL
function abrirModal() {
    const modal = document.getElementById('modal-carrinho');
    if (modal) modal.style.display = 'block';
}

function fecharModal() {
    const modal = document.getElementById('modal-carrinho');
    if (modal) modal.style.display = 'none';
}

// Fecha o modal se o usuário clicar fora da caixa branca
window.onclick = function(event) {
    const modal = document.getElementById('modal-carrinho');
    if (event.target == modal) fecharModal();
}

// 3. LÓGICA DO CARRINHO
function adicionarAoCarrinho(nome, preco) {
    const item = { 
        id: Date.now(), 
        nome: nome, 
        preco: parseFloat(preco) 
    };
    
    carrinho.push(item);
    atualizarTelaCarrinho();
    abrirModal(); // Abre o modal automaticamente ao clicar em comprar
}

function removerDoCarrinho(id) {
    carrinho = carrinho.filter(item => item.id !== id);
    
    // Se o carrinho esvaziar, você pode optar por fechar o modal (opcional)
    if (carrinho.length === 0) {
        // fecharModal(); 
    }
    atualizarTelaCarrinho();
}

function atualizarTelaCarrinho() {
    const lista = document.getElementById('itens-carrinho');
    const totalElemento = document.getElementById('total-carrinho');
    const contagemNav = document.getElementById('contagem-carrinho');

    if (lista) {
        lista.innerHTML = "";
        let total = 0;

        carrinho.forEach(item => {
            total += item.preco;
            lista.innerHTML += `
                <div style="display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid #eee; align-items: center;">
                    <span style="font-size: 0.95rem;"><strong>${item.nome}</strong><br><small>R$ ${item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</small></span>
                    <button onclick="removerDoCarrinho(${item.id})" style="background:#ff4444; color:white; border:none; padding:5px 12px; cursor:pointer; font-weight:bold; border-radius:4px; transition: 0.2s;">X</button>
                </div>
            `;
        });

        if (totalElemento) {
            totalElemento.innerText = `Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }
    }
    
    // Atualiza o contador (0) no menu superior
    if (contagemNav) {
        contagemNav.innerText = `(${carrinho.length})`;
    }
}

// 4. INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutosDoBanco();
});