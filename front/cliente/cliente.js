// Use nomes únicos para evitar choque com o index.js
const CHAVE_API_CLIENTE = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";
const URL_API_CLIENTE = "https://apiprojetointegrador.onrender.com/clientes";

// Use nomes únicos para evitar conflitos com o index.js
const URL_BASE_CLIENTES = "https://apiprojetointegrador.onrender.com/clientes";
const CHAVE_ACESSO = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

async function carregarClientes() {
    try {
        const resposta = await fetch(URL_BASE_CLIENTES, { 
            headers: { "minha-chave": CHAVE_ACESSO } 
        });
        const dados = await resposta.json();
        
        const tbody = document.getElementById("listagem-clientes");
        if (!tbody) return;
        
        tbody.innerHTML = ""; 

        dados.forEach(c => {
            const tr = document.createElement("tr");
            // Define o texto do status e a cor (opcional via CSS)
            const statusTexto = c.ativo ? "Ativo" : "Inativo";

            tr.innerHTML = `
                <td>${c.id}</td>
                <td>${c.nome}</td>
                <td>${c.email}</td>
                <td>${c.cpf || '---'}</td>
                <td>${statusTexto}</td>
                <td>
                    <button class="btn-editar" data-id="${c.id}">Editar</button>
                    <button class="btn-deletar" data-id="${c.id}">
                        ${c.ativo ? 'Inativar' : 'Ativar'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (erro) {
        console.error("Erro ao carregar lista:", erro);
    }
}

async function alternarStatusCliente(id) {
    if (!confirm("Deseja alterar o status deste cliente?")) return;

    try {
        const response = await fetch(`${URL_BASE_CLIENTES}/inativar/${id}`, { 
            method: 'PATCH',
            headers: { 
                "Content-Type": "application/json",
                "minha-chave": CHAVE_ACESSO 
            }
        });

        if (response.ok) {
            carregarClientes(); // Atualiza a tabela na hora
        } else {
            alert("Erro ao processar no servidor (verifique se a rota existe)");
        }
    } catch (erro) {
        console.error("Erro na conexão:", erro);
    }
}

// Configura os cliques da tabela
document.addEventListener("DOMContentLoaded", () => {
    carregarClientes();
    const tabela = document.getElementById('listagem-clientes');
    if (tabela) {
        tabela.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            if (e.target.classList.contains('btn-deletar')) {
                alternarStatusCliente(id);
            }
        });
    }
});
async function deletarCliente(id) {
    if (!confirm("Deseja alterar o status (Ativo/Inativo) deste cliente?")) return;

    try {
        const resposta = await fetch(`${URL_API_CLIENTE}/inativar/${id}`, { 
            method: 'PATCH',
            headers: { 
                "Content-Type": "application/json",
                "minha-chave": MINHA_CHAVE 
            }
        });

        if (resposta.ok) {
            carregarClientes(); // Recarrega a tabela para mostrar a mudança
        } else {
            const erroData = await resposta.json();
            alert("Erro: " + (erroData.error || "Erro no servidor"));
        }
    } catch (erro) {
        console.error("Erro ao conectar ao servidor:", erro);
    }
}   

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    carregarClientes();

    const tabela = document.getElementById('listagem-clientes');
    if (tabela) {
        tabela.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            if (e.target.classList.contains('btn-deletar')) {
                deletarCliente(id);
            } else if (e.target.classList.contains('btn-editar')) {
                console.log("Editar ID:", id);
            }
        });
    }
});