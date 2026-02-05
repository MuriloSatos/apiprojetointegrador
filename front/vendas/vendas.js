const API = "http://127.0.0.1:3000/vendas";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

const listagem = document.getElementById("listagem");
const btnCarregar = document.getElementById("btn");
const btnSalvar = document.getElementById("btnSalvar");
const btnAtualizar = document.getElementById("btnAtualizar");
const btnCancelar = document.getElementById("btnCancelar");
const campoBusca = document.getElementById("campoBusca");

let limit = 5;
let offset = 0;

btnCarregar.onclick = carregarVendas;
btnSalvar.onclick = inserirVenda;
btnAtualizar.onclick = salvarAtualizacao;
btnCancelar.onclick = cancelarEdicao;

async function carregarVendas() {
    try {
        const url = `${API}?codigovendas=${campoBusca.value || ""}&limit=${limit}&offset=${offset}`;

        const res = await fetch(url, {
            headers: { "minha-chave": CLIENT_API_KEY }
        });

        const dados = await res.json();
        listagem.innerHTML = "";
        dados.forEach(v => criarCard(v));

    } catch (e) {
        console.error(e);
    }
}

function criarCard(v) {
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
    <h3>Venda #${v.codigovendas}</h3>
    <p><b>Produto:</b> ${v.codigoproduto}</p>
    <p><b>Cliente:</b> ${v.idcliente}</p>
    <p><b>Quantidade:</b> ${v.pecaquantidade}</p>
    <p><b>Valor:</b> R$ ${v.valortotal}</p>
    <p><b>Status:</b> ${v.statusvenda}</p>
    <p><b>Data:</b> ${v.datavenda}</p>

    <button class="btn-delete" onclick="deletar(${v.codigovendas})">Deletar</button>
    <button class="btn-atualizar" onclick="abrirEdicao(
      ${v.codigovendas},
      ${v.codigoproduto},
      ${v.idcliente},
      ${v.pecaquantidade},
      ${v.valortotal},
      '${v.statusvenda}',
      '${v.datavenda}'
    )">Atualizar</button>
  `;

    listagem.appendChild(card);
}

async function inserirVenda() {
    const venda = {
        codigoproduto: campoCodigoProduto.value,
        idcliente: campoCliente.value,
        pecaquantidade: campoQuantidade.value,
        valortotal: campoValorTotal.value,
        statusvenda: campoStatus.value,
        datavenda: campoData.value
    };

    await fetch(API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "minha-chave": CLIENT_API_KEY
        },
        body: JSON.stringify(venda)
    });

    limparFormulario();
    carregarVendas();
}

function abrirEdicao(id, produto, cliente, qtd, valor, status, data) {
    campoCodigoVenda.value = id;
    campoCodigoProduto.value = produto;
    campoCliente.value = cliente;
    campoQuantidade.value = qtd;
    campoValorTotal.value = valor;
    campoStatus.value = status;
    campoData.value = data;

    btnSalvar.style.display = "none";
    btnAtualizar.style.display = "inline-block";
    btnCancelar.style.display = "inline-block";
}

async function salvarAtualizacao() {
    const id = campoCodigoVenda.value;

    const venda = {
        codigoproduto: campoCodigoProduto.value,
        idcliente: campoCliente.value,
        pecaquantidade: campoQuantidade.value,
        valortotal: campoValorTotal.value,
        statusvenda: campoStatus.value,
        datavenda: campoData.value
    };

    await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "minha-chave": CLIENT_API_KEY
        },
        body: JSON.stringify(venda)
    });

    limparFormulario();
    carregarVendas();
}

async function deletar(id) {
    await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { "minha-chave": CLIENT_API_KEY }
    });

    carregarVendas();
}

function limparFormulario() {
    document.querySelectorAll("input").forEach(i => i.value = "");
    btnSalvar.style.display = "inline-block";
    btnAtualizar.style.display = "none";
    btnCancelar.style.display = "none";
}

function cancelarEdicao() {
    limparFormulario();
}
