// --- CONFIGURAÇÕES DE API ---
const API = "https://apiprojetointegrador.onrender.com/produtos";
const API_LOGIN = "https://apiprojetointegrador.onrender.com/usuarios";
const API_CARRINHO = "https://apiprojetointegrador.onrender.com/carrinho"; // ADICIONADO A API DO CARRINHO
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

const URL_BASE_BACKEND = "https://apiprojetointegrador.onrender.com/uploads/"; 

const IMAGEM_PADRAO = "https://cdn-icons-png.flaticon.com/512/1055/1055185.png";

let carrinhoLocal = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
let todosProdutos = []; 

function extrairPrecoReal(valor) {
    if (!valor) return 0;
    if (typeof valor === 'number') return valor;
    
    let texto = String(valor);
    let limpo = texto.replace(/[^0-9.,]/g, "");
    
    if (limpo.includes('.') && limpo.includes(',')) {
        let ultimoPonto = limpo.lastIndexOf('.');
        let ultimaVirgula = limpo.lastIndexOf(',');
        
        if (ultimaVirgula > ultimoPonto) {
            limpo = limpo.replace(/\./g, "").replace(",", ".");
        } else {
            limpo = limpo.replace(/,/g, "");
        }
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
    atualizarMenu();
    carregarDestaques();
});

function atualizarMenu() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const menuCentral = document.getElementById('menu-navegacao');
    const menuDireita = document.getElementById('menu-direita');

    let linksPrincipais = `
        <li><a href="index.html" class="ativo">Início</a></li>
        <li><a href="../produto/produto.html">Catálogo</a></li>
    `;

    if (!user) {
        if (menuCentral) menuCentral.innerHTML = linksPrincipais;
        if (menuDireita) {
            menuDireita.innerHTML = `
                <li><a href="javascript:void(0)" onclick="abrirModalCarrinho()"><i class="fas fa-shopping-cart"></i> <span id="contagem-carrinho" style="background:var(--primaria); color:white; border-radius:50%; padding:2px 6px; font-size:0.8rem;">0</span></a></li>
                <li><a href="javascript:void(0)" class="btn-login-nav" onclick="abrirModalLogin()"><i class="fas fa-user"></i> Entrar</a></li>
            `;
        }
    } else {
        let linksExtras = "";
        if (user.perfil === "adm") {
            linksExtras = `
                <li><a href="../vendas/vendas.html">Vendas</a></li>
                <li><a href="../usuario/usuario.html">Usuários</a></li>
            `;
        } else {
            linksExtras = `<li><a href="../vendas/vendas.html">Meus Pedidos</a></li>`;
        }

        if (menuCentral) menuCentral.innerHTML = linksPrincipais + linksExtras;
        if (menuDireita) {
            menuDireita.innerHTML = `
                <li><a href="javascript:void(0)" onclick="abrirModalCarrinho()"><i class="fas fa-shopping-cart"></i> <span id="contagem-carrinho" style="background:var(--primaria); color:white; border-radius:50%; padding:2px 6px; font-size:0.8rem;">0</span></a></li>
                <li><a href="javascript:void(0)" onclick="logout()" style="color: #ff4444; font-weight:bold;"><i class="fas fa-sign-out-alt"></i> Sair (${user.nome.split(' ')[0]})</a></li>
            `;
        }
    }
    atualizarContadorCarrinho(); 
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.reload();
}

async function carregarDestaques() {
    const grid = document.getElementById('catalogo-home');
    if (!grid) return;

    try {
        grid.innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>Carregando máquinas...</p>";
        const res = await fetch(API, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const dados = await res.json();
        
        todosProdutos = Array.isArray(dados) ? dados : [];
        grid.innerHTML = "";

        const produtosOrdenados = todosProdutos.sort((a, b) => a.id - b.id);
        const destaques = produtosOrdenados.slice(0, 4);

        destaques.forEach(bike => {
            const preco = extrairPrecoReal(bike.preco);
            
            let imgPath = IMAGEM_PADRAO;
            if (bike.imagem && bike.imagem.trim() !== "" && bike.imagem !== 'undefined') {
                imgPath = bike.imagem.startsWith('http') ? bike.imagem : URL_BASE_BACKEND + bike.imagem;
            }

            const nomeSeguro = bike.nomeproduto ? bike.nomeproduto.replace(/'/g, "\\'") : 'Bicicleta Premium';
            const codSeguro = bike.codigoproduto || 0; // Previne erros no código

            const card = document.createElement('div');
            card.className = 'card-produto';
            card.innerHTML = `
                <div class="img-box">
                    <img src="${imgPath}" onerror="this.src='${IMAGEM_PADRAO}'" alt="${nomeSeguro}">
                </div>
                <div class="card-info">
                    <h3>${nomeSeguro}</h3>
                    <span class="preco">R$ ${preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <button class="btn-comprar" onclick="adicionarAoCarrinhoBanco('${codSeguro}', '${nomeSeguro}', ${preco}, '${imgPath}')">
                    <i class="fas fa-cart-plus"></i> Adicionar
                </button>
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        console.error("Erro ao buscar destaques:", e);
        grid.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:red;'>Erro ao carregar o catálogo.</p>";
    }
}

async function adicionarAoCarrinhoBanco(codigoProduto, nome, preco, imagem) {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    
    if (!user) {
        showToast("⚠️ Faça login para adicionar ao carrinho.", "error", "fa-user-lock");
        setTimeout(() => abrirModalLogin(), 1500);
        return;
    }

    const dadosApi = {
        id_usuario: parseInt(user.id),
        codigoproduto: parseInt(codigoProduto),
        pecaquantidade: 1
    };

    try {
        const response = await fetch(API_CARRINHO, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'minha-chave': CLIENT_API_KEY },
            body: JSON.stringify(dadosApi)
        });

        if (response.ok) {
            carrinhoLocal = JSON.parse(localStorage.getItem('carrinho_bikes')) || [];
            const existente = carrinhoLocal.find(i => i.nome === nome);
            if (existente) existente.quantidade++;
            else carrinhoLocal.push({ nome, preco: parseFloat(preco), imagem, quantidade: 1 });
            
            localStorage.setItem('carrinho_bikes', JSON.stringify(carrinhoLocal));
            
            showToast(`✅ ${nome} adicionado!`, "success", "fa-check-circle");
            atualizarContadorCarrinho();
            
            if(document.getElementById('modal-carrinho').classList.contains('ativo')) {
                carregarItensCarrinhoBanco();
            }
        } else {
            const erro = await response.json();
            showToast(erro.mensagem || "Erro ao adicionar", "error", "fa-exclamation-circle");
        }
    } catch (err) {
        showToast("Erro de conexão", "error", "fa-wifi");
    }
}

async function carregarItensCarrinhoBanco() {
    const listaModal = document.getElementById('itens-carrinho');
    const totalElemento = document.getElementById('total-carrinho');
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!listaModal) return;

    if (!user) {
        listaModal.innerHTML = `<div class="carrinho-vazio"><i class="fas fa-user-lock"></i><p>Faça login para ver seu carrinho.</p></div>`;
        if (totalElemento) totalElemento.innerText = "R$ 0,00";
        return;
    }

    try {
        const res = await fetch(`${API_CARRINHO}/${user.id}`, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const dados = await res.json();
        
        listaModal.innerHTML = "";
        let total = 0;

        if (!dados || dados.length === 0 || dados.erro) {
            listaModal.innerHTML = `<div class="carrinho-vazio"><i class="fas fa-box-open"></i><p>Seu carrinho está vazio.</p></div>`;
            if (totalElemento) totalElemento.innerText = "R$ 0,00";
            return;
        }

        dados.forEach(item => {
            const nome = item.nomeproduto || "Produto";
            const preco = extrairPrecoReal(item.preco);
            const qtd = parseInt(item.qtd || item.pecaquantidade) || 1;
            const subtotal = preco * qtd;
            
            const produtoCatalogo = todosProdutos.find(p => p.nomeproduto === nome);
            let imagemCrua = (item.imagem && item.imagem !== 'undefined') ? item.imagem : (produtoCatalogo ? produtoCatalogo.imagem : null);
            
            let imgPath = IMAGEM_PADRAO;
            if (imagemCrua && imagemCrua.trim() !== "" && imagemCrua !== 'undefined') {
                imgPath = imagemCrua.startsWith('http') ? imagemCrua : URL_BASE_BACKEND + imagemCrua;
            }
            
            total += subtotal;

            listaModal.innerHTML += `
                <div class="item-cart">
                    <img src="${imgPath}" onerror="this.onerror=null; this.src='${IMAGEM_PADRAO}'">
                    <div>
                        <h5>${nome}</h5>
                        <small style="color:#888;">Qtd: ${qtd}x - R$ ${preco.toFixed(2)}</small><br>
                        <span class="preco-cart">R$ ${subtotal.toFixed(2)}</span>
                    </div>
                    <button class="btn-del-cart" onclick="removerItemCarrinhoBanco(${item.id_carrinho})"><i class="fas fa-trash"></i></button>
                </div>
            `;
        });

        if (totalElemento) totalElemento.innerText = `R$ ${total.toFixed(2)}`;
    } catch (err) {
        console.error("Erro ao carregar carrinho:", err);
        listaModal.innerHTML = `<div class="carrinho-vazio"><p style="color:red">Erro ao carregar. Tente novamente.</p></div>`;
    }
}

async function removerItemCarrinhoBanco(id_carrinho) {
    try {
        const res = await fetch(`${API_CARRINHO}/${id_carrinho}`, {
            method: 'DELETE',
            headers: { 'minha-chave': CLIENT_API_KEY }
        });
        if (res.ok) {
            carregarItensCarrinhoBanco();
            atualizarContadorCarrinho();
        }
    } catch (err) {
        console.error("Erro ao remover:", err);
    }
}

async function atualizarContadorCarrinho() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const contador = document.getElementById('contagem-carrinho');
    
    if (!user || !contador) {
        if(contador) contador.innerText = "0";
        return;
    }

    try {
        const res = await fetch(`${API_CARRINHO}/${user.id}`, { headers: { 'minha-chave': CLIENT_API_KEY } });
        const dados = await res.json();
        
        if(dados && !dados.erro && Array.isArray(dados)) {
            const totalItens = dados.reduce((sum, item) => sum + parseInt(item.qtd || item.pecaquantidade || 1), 0);
            contador.innerText = totalItens;
        } else {
            contador.innerText = "0";
        }
    } catch (err) {
        contador.innerText = "0";
    }
}

function abrirModalCarrinho() {
    document.getElementById('modal-carrinho').classList.add('ativo');
    document.getElementById('overlay-carrinho').classList.add('ativo');
    carregarItensCarrinhoBanco(); 
}

function fecharModalCarrinho() {
    document.getElementById('modal-carrinho').classList.remove('ativo');
    document.getElementById('overlay-carrinho').classList.remove('ativo');
}

function abrirModalLogin() {
    document.getElementById('modal-login').classList.add('ativo');
    document.getElementById('overlay-login').classList.add('ativo');
    alternarTela('login');
}

function fecharModalLogin() {
    document.getElementById('modal-login').classList.remove('ativo');
    document.getElementById('overlay-login').classList.remove('ativo');
}

function alternarTela(tela) {
    document.getElementById('secao-login').style.display = tela === 'login' ? 'block' : 'none';
    document.getElementById('secao-cadastro').style.display = tela === 'cadastro' ? 'block' : 'none';
    document.getElementById('secao-esqueci').style.display = tela === 'esqueci' ? 'block' : 'none';
}

// ==========================================
// 🔥 NOVO SISTEMA DE LOGIN BLINDADO
// ==========================================
document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aguarde...';

    const emailInput = document.getElementById('login-email').value.trim();
    const senhaInput = document.getElementById('login-senha').value.trim();

    // 🛡️ VALIDAÇÃO: Verifica se o e-mail tem o formato correto (ex: nome@email.com)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
        showToast("⚠️ Digite um e-mail válido com @.", "error", "fa-envelope");
        btn.innerHTML = 'Entrar na Loja';
        return; 
    }

    try {
        const url = `${API_LOGIN}?email=${emailInput.toLowerCase()}&senha=${senhaInput}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'minha-chave': CLIENT_API_KEY, 'Content-Type': 'application/json' }
        });

        const usuarios = await res.json();

        if (usuarios.length > 0) {
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarios[0]));
            showToast(`Bem-vindo de volta, ${usuarios[0].nome.split(' ')[0]}!`, "success", "fa-user-check");
            setTimeout(() => window.location.reload(), 1200);
        } else {
            showToast("⚠️ Usuário ou senha incorretos.", "error", "fa-times-circle");
            btn.innerHTML = 'Entrar na Loja';
        }
    } catch (err) {
        showToast("⚠️ Erro ao conectar com o servidor.", "error", "fa-exclamation-triangle");
        btn.innerHTML = 'Entrar na Loja';
    }
});

// ==========================================
// 🔥 NOVO SISTEMA DE CADASTRO BLINDADO
// ==========================================
document.getElementById('form-cadastro')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';

    const nome = document.getElementById('cad-nome').value.trim();
    const email = document.getElementById('cad-email').value.trim().toLowerCase();
    const senha = document.getElementById('cad-senha').value.trim();

    // 🛡️ NOVA VALIDAÇÃO: Impede números e símbolos no Nome (aceita apenas letras e espaços)
    const nomeRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
    if (!nomeRegex.test(nome)) {
        showToast("⚠️ O nome deve conter apenas letras, sem números ou símbolos.", "error", "fa-user");
        btn.innerHTML = 'Finalizar Cadastro';
        return;
    }

    // 🛡️ VALIDAÇÃO 1: Formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast("⚠️ Por favor, insira um e-mail válido (ex: joao@email.com).", "error", "fa-envelope");
        btn.innerHTML = 'Finalizar Cadastro';
        return;
    }

    // 🛡️ VALIDAÇÃO 2: Tamanho mínimo de senha
    if (senha.length < 4) {
        showToast("⚠️ A senha deve ter pelo menos 4 caracteres.", "error", "fa-lock");
        btn.innerHTML = 'Finalizar Cadastro';
        return;
    }

    try {
        // 🛡️ VALIDAÇÃO 3: Verificando no Banco de Dados se o e-mail já existe ANTES de salvar
        const urlBusca = `${API_LOGIN}?email=${email}`;
        const resBusca = await fetch(urlBusca, {
            method: 'GET',
            headers: { 'minha-chave': CLIENT_API_KEY, 'Content-Type': 'application/json' }
        });
        
        const usuariosExistentes = await resBusca.json();

        if (usuariosExistentes.length > 0) {
            // Se encontrou alguém, barra o cadastro!
            showToast("❌ Este e-mail já está cadastrado! Faça login.", "error", "fa-user-times");
            btn.innerHTML = 'Finalizar Cadastro';
            return;
        }

        // Se chegou aqui, o e-mail está liberado e bonitinho. Vamos criar a conta!
        const res = await fetch(API_LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'minha-chave': CLIENT_API_KEY, 'Prefer': 'return=representation' },
            body: JSON.stringify({ nome, email, senha, perfil: 'cliente' })
        });

        if (res.ok) {
            showToast("🎉 Conta criada com sucesso! Faça login.", "success", "fa-check");
            // Limpa os campos após o sucesso
            document.getElementById('cad-nome').value = '';
            document.getElementById('cad-email').value = '';
            document.getElementById('cad-senha').value = '';
            setTimeout(() => alternarTela('login'), 1500);
        } else {
            showToast("⚠️ Erro no servidor ao criar conta.", "error", "fa-times");
            btn.innerHTML = 'Finalizar Cadastro';
        }
    } catch (err) {
        showToast("⚠️ Erro de conexão ao cadastrar.", "error", "fa-wifi");
        btn.innerHTML = 'Finalizar Cadastro';
    }
});

function showToast(mensagem, tipo = "info", icone = "fa-info-circle") {
    let container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<i class="fas ${icone}"></i> <span>${mensagem}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}


// Função para verificar se o usuário logado ainda é válido no banco de dados
async function verificarSessao() {
    // 1. Pega os dados do usuário salvo no navegador (ajuste a chave conforme o seu projeto)
    const usuarioLogado = localStorage.getItem('usuario_bikepromax'); 

    // Se não tem ninguém logado no navegador, não precisa fazer nada
    if (!usuarioLogado) return; 

    // Converte o texto do localStorage de volta para objeto (se você salvou como JSON)
    const dadosUsuario = JSON.parse(usuarioLogado);

    try {
        // 2. Chama a nova rota do backend que criamos no Passo 1
        const resposta = await fetch('http://localhost:3000/usuarios/validar-sessao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Se a rota de usuários precisar da chave mestre, descomente abaixo:
                // 'minha-chave': 'SUA_CHAVE_SECRETA_MUITO_FORTE_123456' 
            },
            // Manda o ID do usuário para o backend conferir
            body: JSON.stringify({ id_usuario: dadosUsuario.id }) 
        });

        // 3. Se o backend disser que deu erro (ex: 401), significa que foi deletado
        if (!resposta.ok) {
            console.warn("Usuário não existe mais no banco de dados. Deslogando...");
            
            // Limpa os dados do navegador
            localStorage.removeItem('usuario_bikepromax'); 
            
            // Mostra um aviso (opcional)
            alert("Sua sessão expirou ou a conta não existe mais. Faça login novamente.");
            
            // Redireciona para a página de login
            window.location.href = '/login.html'; 
        }

    } catch (erro) {
        console.error("Erro ao validar o usuário com o servidor:", erro);
    }
}

// Executa a função assim que a página terminar de carregar
document.addEventListener('DOMContentLoaded', verificarSessao);

