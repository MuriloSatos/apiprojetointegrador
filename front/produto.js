const API = "http://127.0.0.1:3000/produtos";

const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";


const listagem = document.getElementById("listagem");

const btnCarregar = document.getElementById("btn");
const btnSalvar = document.getElementById("btnSalvar");
const btnAtualizar = document.getElementById("btnAtualizar");
const btnCancelar = document.getElementById("btnCancelar");

const campoBusca = document.getElementById("campoBusca");


btnCarregar.addEventListener("click", carregarProdutos);
btnSalvar.addEventListener("click", inserirProduto);
btnAtualizar.addEventListener("click", salvarAtualizacao);
btnCancelar.addEventListener("click", cancelarEdicao);

campoBusca.addEventListener("input", carregarProdutos);
async function todoscarregar() {
    try {
        const url = `${API}/?limit=${limite}&offset=${offset}`;

        const resposta = await fetch(url, {
            headers: {
                'minha-chave': CLIENT_API_KEY
            }
        });

        const dados = await resposta.json();

        listagem.innerHTML = "";
        dados.forEach(m => criarCard(m));

    } catch (erro) {
        console.error("Erro ao carregar:", erro.message);
    }
}
async function carregarProdutos() {
    limite = 3;
    offset = 0;
    todoscarregar();
}


async function carregarmais() {
    offset = offset + 3;
    todoscarregar();
}

async function carregarmenos() {
    offset = Math.max(0, offset - 3); // evita offset negativo
    todoscarregar();
}


function criarCard(p) {
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
    <h3>${p.nomeproduto}</h3>
    <p><b>Tipo:</b> ${p.tipoproduto}</p>
    <p><b>Tamanho:</b> ${p.tamanhoproduto ?? "-"}</p>
    <p><b>Marca:</b> ${p.marcaproduto ?? "-"}</p>
    <p><b>Preço:</b> R$ ${p.preco}</p>
    <p><b>Código:</b> ${p.codigoproduto ?? "-"}</p>

    <button class="btn-delete" onclick="deletar(${p.id})">Deletar</button>
    <button class="btn-atualizar"
      onclick="abrirEdicao(
        ${p.id},
        '${p.nomeproduto}',
        '${p.tipoproduto}',
        '${p.tamanhoproduto ?? ""}',
        '${p.marcaproduto ?? ""}',
        ${p.preco},
        '${p.codigoproduto ?? ""}'
      )">
      Atualizar
    </button>
  `;

    listagem.appendChild(card);
}


async function inserirProduto() {
    const produto = {
        nomeproduto: document.getElementById("campoNome").value,
        tipoproduto: document.getElementById("campoTipo").value,
        tamanhoproduto: document.getElementById("campoTamanho").value,
        marcaproduto: document.getElementById("campoMarca").value,
        preco: document.getElementById("campoPreco").value,
        codigoproduto: document.getElementById("campoCodigo").value
    };

    try {
        const resposta = await fetch(API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "minha-chave": CLIENT_API_KEY
            },
            body: JSON.stringify(produto)
        });

        if (!resposta.ok) throw new Error("Erro ao inserir produto");

        limparFormulario();
        carregarProdutos();

    } catch (erro) {
        console.error("Erro ao inserir:", erro.message);
    }
}

async function deletar(id) {
    try {
        const resposta = await fetch(`${API}/${id}`, {
            method: "DELETE",
            headers: {
                'minha-chave': CLIENT_API_KEY
            }
        });

        if (!resposta.ok) throw new Error("Erro ao deletar");

        carregarProdutos();

    } catch (erro) {
        console.error("Erro:", erro.message);
    }
}

function abrirEdicao(id, nome, tipo, tamanho, marca, preco, codigo) {
    document.getElementById("campoID").value = id;
    document.getElementById("campoNome").value = nome;
    document.getElementById("campoTipo").value = tipo;
    document.getElementById("campoTamanho").value = tamanho;
    document.getElementById("campoMarca").value = marca;
    document.getElementById("campoPreco").value = preco;
    document.getElementById("campoCodigo").value = codigo;

    btnSalvar.style.display = "none";
    btnAtualizar.style.display = "inline-block";
    btnCancelar.style.display = "inline-block";
}

async function salvarAtualizacao() {
    const id = document.getElementById("campoID").value;

    const dadosAtualizados = {
        nomeproduto: document.getElementById("campoNome").value,
        tipoproduto: document.getElementById("campoTipo").value,
        tamanhoproduto: document.getElementById("campoTamanho").value,
        marcaproduto: document.getElementById("campoMarca").value,
        preco: document.getElementById("campoPreco").value,
        codigoproduto: document.getElementById("campoCodigo").value
    };

    try {
        const resposta = await fetch(`${API}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "minha-chave": CLIENT_API_KEY },
            body: JSON.stringify(dadosAtualizados)
        });

        if (!resposta.ok) throw new Error("Erro ao atualizar");

        limparFormulario();
        carregarProdutos();

    } catch (erro) {
        console.error("Erro ao atualizar:", erro.message);
    }
}

function limparFormulario() {
    document.getElementById("campoID").value = "";
    document.getElementById("campoNome").value = "";
    document.getElementById("campoTipo").value = "";
    document.getElementById("campoTamanho").value = "";
    document.getElementById("campoMarca").value = "";
    document.getElementById("campoPreco").value = "";
    document.getElementById("campoCodigo").value = "";

    btnSalvar.style.display = "inline-block";
    btnAtualizar.style.display = "none";
    btnCancelar.style.display = "none";
}

function cancelarEdicao() {
    limparFormulario();
}


