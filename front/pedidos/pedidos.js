// --- CONFIGURAÇÕES DE API ---
const API_PRODUTOS = "https://apiprojetointegrador.onrender.com/produtos";
const API_CARRINHO = "https://apiprojetointegrador.onrender.com/carrinho";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

// URL de Imagens
const URL_BASE_BACKEND = "https://apiprojetointegrador.onrender.com/uploads/"; 
const IMAGEM_PADRAO = "https://dummyimage.com/200x200/f4f6f8/ff6600.png&text=Sem+Foto";

let todosProdutos = []; // Para buscar as imagens originais
let itensCarrinho = [];

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    verificarAcesso();
    atualizarMenu();
    carregarDados();
});

// --- SEGURANÇA E MENU ---
function verificarAcesso() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!user) {
        alert("⚠️ Por favor, faça login para acessar o carrinho.");
        window.location.href = "../index/index.html";
    }
}

function atualizarMenu() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const menuCentral = document.getElementById('menu-navegacao');
    const menuDireita = document.getElementById('menu-direita');

    if (menuCentral) {
        // Agora "Meus Pedidos" vai para a tela de histórico
        menuCentral.innerHTML = `
            <li><a href="../index/index.html">Início</a></li>
            <li><a href="../produto/produto.html">Catálogo</a></li>
            <li><a href="pedidos.html">Meus Pedidos</a></li>
        `;
    }

    if (menuDireita) {
        // O carrinho agora leva para pedidos.html (esta tela)
        menuDireita.innerHTML = `
            <li><a href="pedidos.html" title="Ir para o Carrinho"><i class="fas fa-shopping-cart"></i> <span id="contagem-carrinho" style="background:var(--primaria); color:white; border-radius:50%; padding:2px 6px; font-size:0.8rem;">0</span></a></li>
            <li><a href="javascript:void(0)" onclick="logout()" style="color: #ff4444; font-weight:bold;"><i class="fas fa-sign-out-alt"></i> Sair (${user.nome.split(' ')[0]})</a></li>
        `;
    }
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = "../index/index.html";
}

// --- CARREGAR DADOS DO CARRINHO ---
async function carregarDados() {
    try {
        const resProd = await fetch(API_PRODUTOS, { headers: { 'minha-chave': CLIENT_API_KEY } });
        todosProdutos = await resProd.json();
        carregarCarrinho();
    } catch (err) {
        document.getElementById('conteudo-pedidos').innerHTML = "<p style='text-align:center; color:red;'>Erro de conexão com o servidor.</p>";
    }
}

async function carregarCarrinho() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    try {
        const res = await fetch(`${API_CARRINHO}/${user.id}`, { headers: { 'minha-chave': CLIENT_API_KEY } });
        itensCarrinho = await res.json();
        renderizarCheckout();
        atualizarContador();
    } catch (err) {
        console.error("Erro ao carregar carrinho:", err);
    }
}

// --- RENDERIZAR TELA DE CHECKOUT ---
function renderizarCheckout() {
    const container = document.getElementById('conteudo-pedidos');

    if (!itensCarrinho || itensCarrinho.length === 0) {
        container.innerHTML = `
            <div class="vazio">
                <i class="fas fa-shopping-basket"></i>
                <h2>Seu carrinho está vazio!</h2>
                <p>Nenhum pedido pendente. Que tal dar uma olhada nas nossas novidades?</p>
                <br>
                <a href="../produto/produto.html" style="display:inline-block; background:var(--primaria); color:white; padding:12px 25px; text-decoration:none; border-radius:5px; font-weight:bold;">Ir para o Catálogo</a>
            </div>
        `;
        return;
    }

    let linhasTabela = "";
    let valorTotal = 0;

    itensCarrinho.forEach(item => {
        const nome = item.nomeproduto || "Produto";
        const preco = parseFloat(item.preco) || 0;
        const qtd = parseInt(item.qtd || item.pecaquantidade) || 1; 
        const subtotal = preco * qtd;
        valorTotal += subtotal;

        const produtoCatalogo = todosProdutos.find(p => p.nomeproduto === nome);
        let imagemCrua = (item.imagem && item.imagem !== 'undefined') ? item.imagem : (produtoCatalogo ? produtoCatalogo.imagem : null);
        
        let imgPath = IMAGEM_PADRAO;
        if (imagemCrua && imagemCrua.trim() !== "" && imagemCrua !== 'undefined') {
            imgPath = imagemCrua.startsWith('http') ? imagemCrua : URL_BASE_BACKEND + imagemCrua;
        }

        linhasTabela += `
            <tr>
                <td>
                    <div class="produto-info">
                        <img src="${imgPath}" onerror="this.onerror=null; this.src='${IMAGEM_PADRAO}'">
                        <strong>${nome}</strong>
                    </div>
                </td>
                <td><strong>${qtd}x</strong></td>
                <td>R$ ${preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                <td style="font-weight:bold; color:var(--primaria);">R$ ${subtotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                <td style="text-align:center;">
                    <button class="btn-remover" onclick="removerDoCheckout(${item.id_carrinho})" title="Remover item da compra">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    container.innerHTML = `
        <table class="tabela-pedidos">
            <thead>
                <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Preço Un.</th>
                    <th>Subtotal</th>
                    <th style="text-align:center;">Remover</th>
                </tr>
            </thead>
            <tbody>
                ${linhasTabela}
            </tbody>
        </table>

        <div class="resumo-compra">
            <div class="form-pagamento">
                <label for="forma-pagamento"><strong>Forma de Pagamento:</strong></label>
                <select id="forma-pagamento">
                    <option value="Pix (10% de Desconto)">Pix (10% de Desconto)</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Boleto Bancário">Boleto Bancário</option>
                </select>
            </div>
            
            <div class="total-valor">
                Total da Compra: <span id="valor-total-final">R$ ${valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            </div>

            <button class="btn-finalizar" onclick="finalizarCompraCompleta()">
                <i class="fas fa-lock"></i> Finalizar Pedido
            </button>
        </div>
    `;
}

// --- REMOVER ITEM INDIVIDUAL ---
async function removerDoCheckout(id_carrinho) {
    if(!confirm("Tem certeza que deseja remover este item da compra?")) return;
    
    try {
        const res = await fetch(`${API_CARRINHO}/${id_carrinho}`, {
            method: 'DELETE',
            headers: { 'minha-chave': CLIENT_API_KEY }
        });
        if (res.ok) {
            showToast("Item removido com sucesso!", "success");
            carregarCarrinho(); 
        }
    } catch (err) {
        showToast("Erro ao remover item", "error");
    }
}

// --- FINALIZAR COMPRA E GERAR HISTÓRICO ---
async function finalizarCompraCompleta() {
    const btn = document.querySelector('.btn-finalizar');
    const selectPgto = document.getElementById('forma-pagamento');
    const formaPgto = selectPgto.options[selectPgto.selectedIndex].value;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando Pagamento...';
    btn.disabled = true;

    try {
        // 1. Limpa o carrinho no banco de dados da API
        for (const item of itensCarrinho) {
            await fetch(`${API_CARRINHO}/${item.id_carrinho}`, {
                method: 'DELETE',
                headers: { 'minha-chave': CLIENT_API_KEY }
            });
        }
        
        // 2. Prepara os itens para salvar no Histórico de Vendas com a imagem certa
        const historicoVendas = JSON.parse(localStorage.getItem('historicoVendas')) || [];
        
        const itensComprados = itensCarrinho.map(item => {
            const nome = item.nomeproduto || "Produto";
            const preco = parseFloat(item.preco) || 0;
            const qtd = parseInt(item.qtd || item.pecaquantidade) || 1; 
            
            const produtoCatalogo = todosProdutos.find(p => p.nomeproduto === nome);
            let imagemCrua = (item.imagem && item.imagem !== 'undefined') ? item.imagem : (produtoCatalogo ? produtoCatalogo.imagem : null);
            let imgPath = IMAGEM_PADRAO;
            if (imagemCrua && imagemCrua.trim() !== "" && imagemCrua !== 'undefined') {
                imgPath = imagemCrua.startsWith('http') ? imagemCrua : URL_BASE_BACKEND + imagemCrua;
            }

            return { nome: nome, preco: preco, quantidade: qtd, imagem: imgPath };
        });

        // 3. Cria a Venda Finalizada
        const novaVenda = {
            id: 'PED-' + Math.floor(Math.random() * 1000000), // Gera código tipo PED-548931
            data: new Date().toLocaleDateString('pt-BR'),
            itens: itensComprados,
            formaPagamento: formaPgto,
            status: 'Pagamento Aprovado'
        };

        // 4. Salva no "Banco de Dados" do Histórico
        historicoVendas.push(novaVenda);
        localStorage.setItem('historicoVendas', JSON.stringify(historicoVendas));
        
        localStorage.removeItem('carrinho_bikes'); // Limpa sujeira local
        atualizarContador(0); 
        
        // 5. Redireciona para a tela de pedidos
        showToast("Compra Aprovada! Redirecionando...", "success");
        setTimeout(() => {
            window.location.href = "pedidos.html";
        }, 2000);

    } catch (error) {
        showToast("Erro ao processar compra.", "error");
        btn.innerHTML = '<i class="fas fa-lock"></i> Finalizar Pedido';
        btn.disabled = false;
    }
}

// --- CONTADOR DO MENU SUPERIOR ---
async function atualizarContador(zerarForcado = null) {
    const contador = document.getElementById('contagem-carrinho');
    if (!contador) return;

    if (zerarForcado !== null) {
        contador.innerText = "0";
        return;
    }

    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!user) return;
    try {
        const res = await fetch(`${API_CARRINHO}/${user.id}`, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const dados = await res.json();
        const totalItens = Array.isArray(dados) ? dados.reduce((sum, item) => sum + parseInt(item.qtd || item.pecaquantidade || 1), 0) : 0;
        contador.innerText = totalItens;
    } catch (err) {}
}

// --- SISTEMA DE NOTIFICAÇÕES
