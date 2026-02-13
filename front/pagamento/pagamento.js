document.addEventListener('DOMContentLoaded', () => {
    const listaItens = document.getElementById('lista-itens-pagamento');
    const valorTotalElemento = document.getElementById('valor-total');
    const carrinho = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));

    // 1. Verificar se o usuário está logado
    if (!usuario) {
        alert("Acesso negado. Faça login primeiro.");
        window.location.href = "../index/index.html";
        return;
    }

    // 2. Carregar itens do carrinho na tela
    let total = 0;
    if (carrinho.length === 0) {
        listaItens.innerHTML = "<p>Seu carrinho está vazio.</p>";
    } else {
        carrinho.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item-checkout';
            div.innerHTML = `<span>${item.nome}</span> <span>R$ ${item.preco.toFixed(2)}</span>`;
            listaItens.appendChild(div);
            total += item.preco;
        });
    }
    valorTotalElemento.innerText = `R$ ${total.toFixed(2)}`;

    // 3. Lógica para mostrar campos de cartão se selecionado
    document.getElementById('metodo').addEventListener('change', function() {
        const detalhesCartao = document.getElementById('detalhes-cartao');
        detalhesCartao.style.display = this.value === 'cartao' ? 'block' : 'none';
    });

    // 4. Finalizar Venda
    document.getElementById('form-finalizar').addEventListener('submit', function(e) {
        e.preventDefault();

        // Aqui você enviaria os dados para o seu Backend via fetch
        alert(`Obrigado, ${usuario.nome}! Compra realizada com sucesso.`);
        
        // Limpa o carrinho e volta para a home
        localStorage.removeItem('carrinho_bikes');
        window.location.href = "../index/index.html";
    });
});