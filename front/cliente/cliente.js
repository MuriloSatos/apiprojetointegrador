const API = "http://127.0.0.1:3000/clientes";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

// Função para buscar TODOS os clientes
async function carregarClientes() {
    try {
        const resposta = await fetch(API, { headers: { "minha-chave": CLIENT_API_KEY } });
        const dados = await resposta.json();
        const tbody = document.getElementById("listagem");
        tbody.innerHTML = "";

        dados.forEach(c => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${c.id}</td>
                <td>${c.nome}</td>
                <td>${c.email}</td>
                <td>${c.cpf}</td>
                <td>
                    <button onclick="abrirEdicao(${c.id}, '${c.nome}', '${c.email}', '${c.senha}', '${c.cpf}')">Editar</button>
                    <button onclick="deletar(${c.id})" class="btn-deletar">Deletar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (erro) {
        console.error("Erro:", erro);
    }
}

// Inicia ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    carregarClientes();
    // Chame aqui a sua função atualizarMenu() que verifica o login
});