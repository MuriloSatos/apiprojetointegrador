const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";
const API_CARRINHO = "https://apiprojetointegrador.onrender.com/carrinho";
const API_VENDAS = "https://apiprojetointegrador.onrender.com/vendas";
const API_PRODUTOS = "https://apiprojetointegrador.onrender.com/produtos";

let totalCompraGeral = 0;
let valorTotalComTaxa = 0; 
let itensNoCarrinho = [];
let todosOsProdutosParaConsulta = [];
let idItemParaRemover = null; 

function extrairPrecoReal(valor) {
    if (valor === null || valor === undefined) return 0;
    
    // Convertendo tudo para string sempre
    let texto = valor.toString();
    let limpo = texto.replace(/[^0-9.,-]+/g, "");

    if (limpo.includes(',') && limpo.includes('.')) {
        limpo = limpo.replace(/\./g, "");
        limpo = limpo.replace(",", ".");
    } else if (limpo.includes(',')) {
        limpo = limpo.replace(",", ".");
    } else if (limpo.includes('.')) {
        let partes = limpo.split('.');
        if (partes[1] && partes[1].length === 3) {
            limpo = limpo.replace(".", "");
        }
    }
    return parseFloat(limpo) || 0;
}

document.addEventListener('DOMContentLoaded', () => {
    carregarTabelaDoCarrinho();
    atualizarMenuCarrinho();
    aplicarMascaraCPF();
});

function atualizarMenuCarrinho() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const menuDireita = document.getElementById('menu-direita');
    const menuNavegacao = document.getElementById('menu-navegacao');

    if (user) {
        if (menuDireita) {
            menuDireita.innerHTML = `
                <li><a href="javascript:void(0)" onclick="logout()" style="color: #ff4444; font-weight: bold;" class="btn-login-top">Sair (${user.nome.split(' ')[0]})</a></li>
            `;
        }

        let isAdm = (user.perfil === 'adm' || user.email === 'adm@gmail.com');
        if (isAdm && menuNavegacao) {
            menuNavegacao.innerHTML = `
                <li><a href="../index/index.html">Início</a></li>
                <li><a href="../produto/produto.html">Catálogo</a></li>
                <li><a href="../vendas/vendas.html" style="color: #ff6b00; font-weight: 700;">Vendas</a></li>
                <li><a href="../usuario/usuario.html">Usuários</a></li>
                <li><a href="../carrinho/carrinho.html">Carrinho</a></li>
            `;
        }
    }
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = "../index/index.html";
}

function aplicarMascaraCPF() {
    const inputCpf = document.getElementById('input-cpf');
    if (inputCpf) {
        inputCpf.addEventListener('input', function(e) {
            let valor = e.target.value.replace(/\D/g, ""); 
            if (valor.length > 11) valor = valor.slice(0, 11); 
            valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
            valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
            valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            e.target.value = valor;
        });
    }
}

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, ''); 
    if (cpf === '') return false;
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    let resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
}

async function carregarTabelaDoCarrinho() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!user) {
        showToast("⚠️ Faça login para ver seu carrinho.", "error");
        setTimeout(() => { window.location.href = "../login/login.html"; }, 2000);
        return;
    }

    const tbody = document.getElementById('tabela-itens-carrinho');
    const spanTotal = document.getElementById('valor-total-final');
    const spanSubtotal = document.getElementById('valor-subtotal');
    const spanTaxa = document.getElementById('valor-taxa');

    try {
        const res = await fetch(`${API_CARRINHO}/${user.id}`, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const itens = await res.json();
        itensNoCarrinho = itens;

        if (!itens || itens.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="mensagem-vazio"><i class="fas fa-box-open" style="font-size: 24px; margin-bottom: 10px; display: block; color: #ccc;"></i>Seu carrinho está vazio.</td></tr>`;
            if (spanTotal) spanTotal.innerText = "R$ 0,00";
            if (spanSubtotal) spanSubtotal.innerText = "R$ 0,00";
            if (spanTaxa) spanTaxa.innerText = "R$ 0,00";
            return;
        }

        totalCompraGeral = 0;
        let totalTaxasAdicionais = 0; 
        tbody.innerHTML = '';

        itens.forEach(item => {
            const nome = item.nomeproduto || item.nome || "Produto sem nome";
            const preco = extrairPrecoReal(item.preco);
            const qtd = parseInt(item.pecaquantidade) || parseInt(item.quantidade) || 1;
            const subtotal = preco * qtd;

            let taxaDesteProduto = preco > 100 ? subtotal * 0.10 : subtotal * 0.05;
            let textoPorcentagem = preco > 100 ? "10%" : "5%";

            totalCompraGeral += subtotal;
            totalTaxasAdicionais += taxaDesteProduto;

            const URL_BASE_BACKEND = "https://apiprojetointegrador.onrender.com/uploads/"; 
            let imgPath = item.imagem && item.imagem.trim() !== "" && item.imagem !== 'undefined' ? (item.imagem.startsWith('http') ? item.imagem : URL_BASE_BACKEND + item.imagem) : "";

            const imagemHtml = imgPath !== ""
                ? `<img src="${imgPath}" alt="${nome}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">`
                : `<div style="width: 60px; height: 60px; background: #eee; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999;">Sem Foto</div>`;

            tbody.innerHTML += `
                <tr>
                    <td><div class="produto-info">${imagemHtml}<strong>${nome}</strong></div></td>
                    <td>R$ ${preco.toFixed(2).replace('.', ',')}</td>
                    <td><strong>${qtd}</strong></td>
                    <td>
                        <span style="color: #ff6600; font-weight: bold; display: block;">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                        <span style="font-size: 12px; color: #666; display: block; margin-top: 4px;">+ R$ ${taxaDesteProduto.toFixed(2).replace('.', ',')} (Taxa ${textoPorcentagem})</span>
                    </td>
                    <td><button onclick="abrirModalConfirmacao('${item.id_carrinho || item.id}')" class="btn-remover"><i class="fas fa-trash-alt"></i> Remover</button></td>
                </tr>
            `;
        });

        valorTotalComTaxa = totalCompraGeral + totalTaxasAdicionais;

        if (spanSubtotal) spanSubtotal.innerText = `R$ ${totalCompraGeral.toFixed(2).replace('.', ',')}`;
        if (spanTaxa) spanTaxa.innerText = `+ R$ ${totalTaxasAdicionais.toFixed(2).replace('.', ',')}`;
        if (spanTotal) spanTotal.innerText = `R$ ${valorTotalComTaxa.toFixed(2).replace('.', ',')}`;

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="mensagem-vazio" style="color: red;">⚠️ Erro ao carregar carrinho.</td></tr>`;
    }
}

async function finalizarCompraDefinitiva() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const selectPagamento = document.getElementById('select-pagamento-final');
    const formaPagamento = selectPagamento ? selectPagamento.value : 'Cartão';
    
    const inputCpf = document.getElementById('input-cpf');
    const inputEndereco = document.getElementById('input-endereco');
    const cpf = inputCpf ? inputCpf.value.trim() : '';
    const endereco = inputEndereco ? inputEndereco.value.trim() : '';

    if (totalCompraGeral <= 0 || itensNoCarrinho.length === 0) {
        showToast("⚠️ Adicione produtos ao carrinho antes de finalizar!", "error");
        return;
    }

    if (cpf === "") { showToast("⚠️ Por favor, informe seu CPF.", "error"); inputCpf.focus(); return; }
    if (!validarCPF(cpf)) { showToast("⚠️ CPF inválido.", "error"); inputCpf.focus(); return; }
    if (endereco === "" || endereco.length < 10) { showToast("⚠️ Informe endereço completo.", "error"); inputEndereco.focus(); return; }

    const btnFinalizar = document.querySelector('.btn-finalizar-compra');
    if (btnFinalizar) { btnFinalizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...'; btnFinalizar.disabled = true; }

    try {
        const idUnicoCompra = Date.now(); 

        // 🌟 O TRUQUE NINJA: Escondendo os dados vitais dentro da string da forma de pagamento!
        const payloadFinalizar = {
            id_usuario: user.id,
            formaPagamento: `${formaPagamento}|${idUnicoCompra}|${cpf}|${endereco}|${valorTotalComTaxa}`,
            cpf_cliente: cpf,
            endereco_entrega: endereco
        };

        const res = await fetch(`${API_CARRINHO}/finalizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'minha-chave': CLIENT_API_KEY },
            body: JSON.stringify(payloadFinalizar)
        });

        if (res.ok) {
            showToast("🎉 Compra finalizada com sucesso!", "success");
            setTimeout(() => { window.location.href = "../vendas/vendas.html"; }, 2000);
        } else {
            reabilitarBotaoCheckout(btnFinalizar);
        }
    } catch (err) {
        showToast("⚠️ Erro de conexão.", "error");
        reabilitarBotaoCheckout(btnFinalizar);
    }
}

function reabilitarBotaoCheckout(botao) {
    if (botao) { botao.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar e Pagar'; botao.disabled = false; }
}

function abrirModalConfirmacao(idCarrinho) {
    idItemParaRemover = idCarrinho;
    document.getElementById('modal-confirmacao')?.classList.add('ativo');
    document.getElementById('overlay-confirmacao')?.classList.add('ativo');
}

function fecharModalConfirmacao() {
    idItemParaRemover = null;
    document.getElementById('modal-confirmacao')?.classList.remove('ativo');
    document.getElementById('overlay-confirmacao')?.classList.remove('ativo');
}

async function confirmarRemocaoItem() {
    if (!idItemParaRemover) return;
    try {
        const res = await fetch(`${API_CARRINHO}/${idItemParaRemover}`, { method: 'DELETE', headers: { 'minha-chave': CLIENT_API_KEY } });
        if (res.ok) {
            fecharModalConfirmacao();
            carregarTabelaDoCarrinho();
            showToast("🗑️ Item removido!", "success"); 
        }
    } catch (err) { fecharModalConfirmacao(); }
}

function showToast(mensagem, tipo = "success") {
    let container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<i class="fas fa-${tipo === "success" ? "check" : "exclamation"}-circle"></i> <span>${mensagem}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 400); }, 3000);
}
