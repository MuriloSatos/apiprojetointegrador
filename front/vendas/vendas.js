const API = "https://apiprojetointegrador.onrender.com/vendas";
const CLIENT_API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";
const ID_USUARIO_LOGADO = 25; // O ID do cliente de teste

const listaPedidos = document.getElementById("lista-pedidos");
const loading = document.getElementById("loading");
const vazio = document.getElementById("vazio");

// Inicia a busca assim que a tela abre
document.addEventListener("DOMContentLoaded", carregarMeusPedidos);

async function carregarMeusPedidos() {
    try {
        const res = await fetch(`${API}?limit=100&offset=0`, {
            headers: { "minha-chave": CLIENT_API_KEY }
        });

        const todasVendas = await res.json();
        
        // FILTRO: Pega APENAS as compras onde a coluna id_usuario for igual a 25
        const minhasVendas = todasVendas.filter(venda => venda.id_usuario === ID_USUARIO_LOGADO);

        loading.classList.add("hide"); // Esconde a mensagem de "Buscando..."

        if (minhasVendas.length === 0) {
            vazio.classList.remove("hide"); // Mostra que está vazio se não achar nada
            return;
        }

        // Para cada venda encontrada, cria uma linha na tabela
        minhasVendas.forEach(venda => criarLinhaTabela(venda));

    } catch (e) {
        console.error("Erro ao conectar na API:", e);
        loading.innerHTML = "Erro ao carregar seus pedidos. Tente novamente.";
    }
}

function criarLinhaTabela(v) {
    const tr = document.createElement("tr");
    
    // 1. Tratamento da DATA (Formata do banco para DD/MM/AAAA)
    let dataFormatada = "-";
    if (v.datavenda) {
        const dataObj = new Date(v.datavenda);
        // O timeZone UTC previne que o navegador atrase a data em 1 dia
        dataFormatada = dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); 
    }

    // 2. Tratamento do VALOR (Corrigido para lidar com milhares de Reais corretamente)
    let valorFormatado = "R$ 0,00";
    if (v.valortotal !== null && v.valortotal !== undefined) {
        let stringValor = v.valortotal.toString();
        
        // Limpa letras e símbolos mantendo apenas números, ponto e vírgula
        let valorTratado = stringValor.replace(/[^0-9.,-]+/g, "");

        // Se tem vírgula, significa que está no padrão brasileiro (ex: 1.599,00)
        if (valorTratado.includes(',')) {
            // Remove TODOS os pontos de milhar primeiro (ex: 1.599,00 vira 1599,00)
            valorTratado = valorTratado.replace(/\./g, "");
            
            // Depois, troca a vírgula decimal por ponto para o JavaScript entender (vira 1599.00)
            valorTratado = valorTratado.replace(',', '.');
        }
        
        let valorNumerico = parseFloat(valorTratado);
        if (!isNaN(valorNumerico)) {
            // Formata o número matemático de volta para a moeda linda do Brasil
            valorFormatado = valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        } else {
            valorFormatado = v.valortotal; 
        }
    }
    
    // 3. Status visual
    let classeStatus = "tag-status processando";
    let textoStatus = v.statusvenda ? v.statusvenda : "Processando";
    
    const statusMinusculo = textoStatus.toLowerCase();
    // Adicionei "finalizad" para garantir que a sua tag amarelinha do print fique verdinha de "concluído"!
    if (statusMinusculo.includes("concluíd") || statusMinusculo.includes("pago") || statusMinusculo.includes("aprovad") || statusMinusculo.includes("finalizad")) {
        classeStatus = "tag-status concluido";
    }

    // 4. Forma de pagamento
    let pagamento = v.forma_pagamento ? v.forma_pagamento : "-";

    // 5. Monta a linha HTML baseada exatamente nos nomes do seu banco
    tr.innerHTML = `
        <td><strong>#${v.codigovendas}</strong></td>
        <td>Cód: ${v.codigoproduto}</td>
        <td>${dataFormatada}</td>
        <td>${v.pecaquantidade}x</td>
        <td>${pagamento}</td>
        <td class="valor-destaque">${valorFormatado}</td>
        <td><span class="${classeStatus}">${textoStatus}</span></td>
    `;
    
    listaPedidos.appendChild(tr);
}
