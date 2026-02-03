const API = "http://127.0.0.1:3000/clientes";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

// globais
let limite = 5;
let offset = 0;

// ligação com html
const listagem = document.getElementById("listagem");

const btnCarregar = document.getElementById("btn");
const btnSalvar = document.getElementById("btnSalvar");
const btnAtualizar = document.getElementById("btnAtualizar");
const btnCancelar = document.getElementById("btnCancelar");

// events
btnSalvar.addEventListener("click", inserirCliente);
btnAtualizar.addEventListener("click", salvarAtualizacao);
btnCancelar.addEventListener("click", cancelarEdicao);

// ================= FUNÇÕES =================

async function todoscarregar() {
    try {
        const url = `${API}?limit=${limite}&offset=${offset}`;

        const resposta = await fetch(API, {
            headers: { "minha-chave": CLIENT_API_KEY }
        });

        const dados = await resposta.json();

        listagem.innerHTML = "";
        dados.forEach(c => criarCard(c));

    } catch (erro) {
        console.error("Erro ao carregar clientes:", erro.message);
    }
}

async function carregarClientes() {
    limite = 5;
    offset = 0;
    todoscarregar();
}

// carregar direto ao abrir a página
document.addEventListener("DOMContentLoaded", carregarClientes);

function criarCard(c) {
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
    <h3>${c.nome}</h3>
    <p><strong>ID:</strong> ${c.id}</p>
    <p><strong>Email:</strong> ${c.email}</p>
    <p><strong>CPF:</strong> ${c.cpf}</p>

    <button onclick="deletar(${c.id})">Deletar</button>
    <button onclick="abrirEdicao(${c.id}, '${c.nome}', '${c.email}', '${c.senha}', '${c.cpf}')">
      Atualizar
    </button>
  `;

    listagem.appendChild(card);
}

// ================= CRUD =================

async function inserirCliente() {
    const cliente = {
        id: Number(document.getElementById("campoID").value),
        nome: document.getElementById("campoNome").value,
        email: document.getElementById("campoEmail").value,
        senha: document.getElementById("campoSenha").value,
        cpf: document.getElementById("campoCPF").value
    };

    try {
        const resposta = await fetch(API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "minha-chave": CLIENT_API_KEY
            },
            body: JSON.stringify(cliente)
        });

        if (!resposta.ok) {
            const erro = await resposta.text();
            throw new Error(erro);
        }

        carregarClientes();
        limparFormulario();

    } catch (erro) {
        console.error("Erro ao inserir cliente:", erro.message);
    }
}

async function deletar(id) {
    try {
        const resposta = await fetch(`${API}/${id}`, {
            method: "DELETE",
            headers: { "minha-chave": CLIENT_API_KEY }
        });

        if (!resposta.ok) throw new Error("Erro ao deletar");

        carregarClientes();

    } catch (erro) {
        console.error("Erro:", erro.message);
    }
}

function abrirEdicao(id, nome, email, senha, cpf) {
    document.getElementById("campoID").value = id;
    document.getElementById("campoID").readOnly = true;

    document.getElementById("campoNome").value = nome;
    document.getElementById("campoEmail").value = email;
    document.getElementById("campoSenha").value = senha;
    document.getElementById("campoCPF").value = cpf;

    btnSalvar.style.display = "none";
    btnAtualizar.style.display = "inline-block";
    btnCancelar.style.display = "inline-block";
}

async function salvarAtualizacao() {
    const id = document.getElementById("campoID").value;

    const dadosAtualizados = {
        nome: document.getElementById("campoNome").value,
        email: document.getElementById("campoEmail").value,
        senha: document.getElementById("campoSenha").value,
        cpf: document.getElementById("campoCPF").value
    };

    try {
        const resposta = await fetch(`${API}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "minha-chave": CLIENT_API_KEY
            },
            body: JSON.stringify(dadosAtualizados)
        });

        if (!resposta.ok) throw new Error("Erro ao atualizar");

        limparFormulario();
        carregarClientes();

    } catch (erro) {
        console.error("Erro ao atualizar:", erro.message);
    }
}

// ================= FORM =================

function limparFormulario() {
    document.getElementById("campoID").value = "";
    document.getElementById("campoID").readOnly = false;

    document.getElementById("campoNome").value = "";
    document.getElementById("campoEmail").value = "";
    document.getElementById("campoSenha").value = "";
    document.getElementById("campoCPF").value = "";

    btnSalvar.style.display = "inline-block";
    btnAtualizar.style.display = "none";
    btnCancelar.style.display = "none";
}

function cancelarEdicao() {
    limparFormulario();
}
