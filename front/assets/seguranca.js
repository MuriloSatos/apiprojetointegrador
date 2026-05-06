// 1. FUNÇÃO PARA O ALERTA BONITO 🎨
function expulsarUsuario(mensagem) {
    if (document.getElementById('modal-expulsao')) return;

    const fundo = document.createElement('div');
    fundo.id = 'modal-expulsao';
    fundo.style.position = 'fixed';
    fundo.style.top = '0';
    fundo.style.left = '0';
    fundo.style.width = '100vw';
    fundo.style.height = '100vh';
    fundo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    fundo.style.backdropFilter = 'blur(6px)'; 
    fundo.style.zIndex = '999999';
    fundo.style.display = 'flex';
    fundo.style.alignItems = 'center';
    fundo.style.justifyContent = 'center';
    fundo.style.opacity = '0'; 
    fundo.style.transition = 'opacity 0.4s ease';

    const caixa = document.createElement('div');
    caixa.style.backgroundColor = '#ffffff';
    caixa.style.padding = '40px 30px';
    caixa.style.borderRadius = '16px';
    caixa.style.boxShadow = '0 20px 50px rgba(0,0,0,0.4)';
    caixa.style.textAlign = 'center';
    caixa.style.maxWidth = '400px';
    caixa.style.width = '90%';
    caixa.style.fontFamily = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

    const icone = document.createElement('div');
    icone.innerHTML = '🔒';
    icone.style.fontSize = '50px';
    icone.style.marginBottom = '15px';

    const titulo = document.createElement('h2');
    titulo.innerText = 'Acesso Encerrado';
    titulo.style.color = '#333';
    titulo.style.margin = '0 0 10px 0';
    titulo.style.fontSize = '24px';

    const texto = document.createElement('p');
    texto.innerText = mensagem;
    texto.style.color = '#666';
    texto.style.fontSize = '16px';
    texto.style.lineHeight = '1.5';
    texto.style.marginBottom = '25px';

    const botao = document.createElement('button');
    botao.innerText = 'Voltar ao Início'; // MUDEI O TEXTO DO BOTÃO AQUI
    botao.style.backgroundColor = '#ff6600'; 
    botao.style.color = '#fff';
    botao.style.border = 'none';
    botao.style.padding = '14px 24px';
    botao.style.borderRadius = '8px';
    botao.style.fontSize = '16px';
    botao.style.fontWeight = 'bold';
    botao.style.cursor = 'pointer';
    botao.style.width = '100%';
    botao.style.transition = 'background-color 0.2s';

    botao.onmouseover = () => botao.style.backgroundColor = '#e65c00';
    botao.onmouseout = () => botao.style.backgroundColor = '#ff6600';

    // 🌟 CORREÇÃO: AGORA MANDA PARA A TELA INICIAL (INDEX) 🌟
    const sairDoSite = () => {
        window.location.href = '../index/index.html'; 
    };

    botao.onclick = sairDoSite;

    caixa.appendChild(icone);
    caixa.appendChild(titulo);
    caixa.appendChild(texto);
    caixa.appendChild(botao);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);

    setTimeout(() => { fundo.style.opacity = '1'; }, 10);

    setTimeout(sairDoSite, 4000);
}

// 2. LÓGICA PRINCIPAL DE VERIFICAÇÃO 🛡️
async function verificarUsuarioLogado() {
    const chave = 'usuarioLogado';
    const dadosUsuarioStr = localStorage.getItem(chave); 

    if (!dadosUsuarioStr) return; 

    try {
        let usuario = JSON.parse(dadosUsuarioStr);
        if (Array.isArray(usuario)) usuario = usuario[0]; 

        if (!usuario || !usuario.id) return;

        const resposta = await fetch(`https://apiprojetointegrador.onrender.com/usuarios/${usuario.id}`, {
            method: 'GET',
            headers: { 'minha-chave': 'SUA_CHAVE_SECRETA_MUITO_FORTE_123456' }
        });
        
        if (resposta.status === 404) {
            localStorage.removeItem(chave); 
            expulsarUsuario("Sua conta foi removida pelo administrador ou seu acesso foi revogado.");
            return;
        } 

        if (resposta.ok) {
            const data = await resposta.json();
            if (!data || Object.keys(data).length === 0) {
                 localStorage.removeItem(chave); 
                 expulsarUsuario("Encontramos um problema com seu cadastro. Você foi desconectado.");
            }
        }

    } catch (erro) {
        console.error("Erro na verificação de segurança:", erro);
    }
}

// 3. GATILHOS (SEM PRECISAR DE F5) ⚡
document.addEventListener('DOMContentLoaded', verificarUsuarioLogado);

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        verificarUsuarioLogado();
    }
});

window.addEventListener('pageshow', verificarUsuarioLogado);
