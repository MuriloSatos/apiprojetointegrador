const API = "http://127.0.0.1:3000/produtos";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";
let carrinho = [];

// 1. CARREGAR PRODUTOS DO BANCO
// 1. CARREGAR PRODUTOS DO BANCO
async function carregarProdutosDoBanco() {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    try {
        const resposta = await fetch(API, {
            headers: { 'minha-chave': CLIENT_API_KEY }
        });
        const todosProdutos = await resposta.json();

        // AJUSTE AQUI: Filtra para mostrar apenas os 3 primeiros
        const produtosExibidos = todosProdutos.slice(0, 3);

        grid.innerHTML = "";

        // Agora usamos o array limitado (produtosExibidos) para o loop
        produtosExibidos.forEach(bike => {
            const card = document.createElement('div');
            card.className = 'card';

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
// 2. FUNÇÕES DO MODAL (SIDEBAR)
function abrirModal() {
    const modal = document.getElementById('modal-carrinho');
    if (modal) {
        modal.classList.add('aberto'); // Adiciona a classe para deslizar
        document.body.style.overflow = 'hidden'; // Trava o scroll da página de fundo
    }
}

function fecharModal() {
    const modal = document.getElementById('modal-carrinho');
    if (modal) {
        modal.classList.remove('aberto'); // Remove a classe para esconder
        document.body.style.overflow = 'auto'; // Libera o scroll
    }
}

// Fecha o modal se o usuário clicar no fundo escuro (fora da barra branca)
window.onclick = function (event) {
    const modal = document.getElementById('modal-carrinho');
    if (event.target == modal) {
        fecharModal();
    }
}

// Função para finalizar a compra e atualizar o estoque
async function finalizarCompra() {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    try {
        // Percorre cada item do carrinho para atualizar o estoque individualmente
        for (const item of carrinho) {
            // Buscamos o produto para saber o estoque atual (ou enviamos comando de decremento)
            await fetch(`${API}/atualizar-estoque`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'minha-chave': CLIENT_API_KEY
                },
                body: JSON.stringify({ 
                    nome: item.nome, 
                    quantidade: 1 // Diminui 1 unidade
                })
            });
        }

        alert('Pedido finalizado com sucesso! O estoque foi atualizado.');
        
        // Limpa o carrinho e fecha o modal
        carrinho = [];
        atualizarTelaCarrinho();
        fecharModal();
        
        // Recarrega os produtos na tela para mostrar o novo estoque
        carregarProdutosDoBanco();

    } catch (erro) {
        console.error("Erro ao processar compra:", erro);
        alert("Houve um erro ao finalizar a compra.");
    }
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
    abrirModal(); // Abre a barra lateral automaticamente
}

function removerDoCarrinho(id) {
    carrinho = carrinho.filter(item => item.id !== id);
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
                <div class="linha-carrinho">
                    <span style="font-size: 0.95rem;">
                        <strong>${item.nome}</strong><br>
                        <small>R$ ${item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</small>
                    </span>
                    <button class="btn-remover" onclick="removerDoCarrinho(${item.id})">X</button>
                </div>
            `;
        });

        if (totalElemento) {
            totalElemento.innerText = `Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }
    }

    if (contagemNav) {
        contagemNav.innerText = `(${carrinho.length})`;
    }
}

// 4. INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutosDoBanco();
});