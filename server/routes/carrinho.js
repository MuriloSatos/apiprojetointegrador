const express = require("express");
const pool = require("../db");
const router = express.Router();

// server/routes/carrinho.js
router.get("/:id", async (req, res) => {
    try {
        const id_usuario = parseInt(req.params.id);
        const query = `
            SELECT 
                c.id_carrinho, 
                c.codigoproduto,
                c.pecaquantidade as qtd, 
                p.nomeproduto, 
                p.preco::NUMERIC as preco,
                p.imagem  /* 🔥 AQUI ESTAVA O SEGREDO! Pedimos a imagem e o código! */
            FROM sistema.carrinho c 
            INNER JOIN sistema.produto p ON c.codigoproduto = p.codigoproduto 
            WHERE c.id_usuario = $1;
        `;
        const result = await pool.query(query, [id_usuario]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.post("/", async (req, res) => {
    try {
        const { id_usuario, codigoproduto, pecaquantidade } = req.body;
        
        // Conversão explícita para números para evitar erros de tipo no SQL
        const uId = parseInt(id_usuario);
        const pId = parseInt(codigoproduto);
        const qtd = parseInt(pecaquantidade) || 1;

        if (isNaN(uId) || isNaN(pId)) {
            return res.status(400).json({ error: "ID de usuário ou produto inválido" });
        }

        // 1. Verifica se já existe
        const checkExist = await pool.query(
            "SELECT id_carrinho, pecaquantidade FROM sistema.carrinho WHERE id_usuario = $1 AND codigoproduto = $2",
            [uId, pId]
        );

        if (checkExist.rows.length > 0) {
            const novaQtd = parseInt(checkExist.rows[0].pecaquantidade) + qtd;
            const updateResult = await pool.query(
                "UPDATE sistema.carrinho SET pecaquantidade = $1 WHERE id_carrinho = $2 RETURNING *",
                [novaQtd, checkExist.rows[0].id_carrinho]
            );
            return res.status(200).json(updateResult.rows[0]);
        }

        // 2. Insere novo se não existir
        const result = await pool.query(
            "INSERT INTO sistema.carrinho (id_usuario, codigoproduto, pecaquantidade) VALUES ($1, $2, $3) RETURNING *",
            [uId, pId, qtd]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao adicionar no banco:", err.message);
        res.status(500).json({ error: "Erro ao adicionar ao carrinho", detalhes: err.message });
    }
});

// 3. DELETE - Remover item
router.delete("/:id_carrinho", async (req, res) => {
    try {
        const { id_carrinho } = req.params;
        await pool.query("DELETE FROM sistema.carrinho WHERE id_carrinho = $1", [id_carrinho]);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: "Erro ao remover" });
    }
});

// 4. POST - Finalizar venda (Transação Segura)
router.post("/finalizar", async (req, res) => {
    const { id_usuario, formaPagamento } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Pega os itens do carrinho + preço da tabela produto
        const queryBusca = `
            SELECT c.*, p.preco 
            FROM sistema.carrinho c 
            JOIN sistema.produto p ON c.codigoproduto = p.codigoproduto     
            WHERE c.id_usuario = $1
        `;
        const itens = await client.query(queryBusca, [id_usuario]);

        if (itens.rows.length === 0) {
            throw new Error("Carrinho vazio.");
        }

        for (const item of itens.rows) {
            // Garante que o preço seja tratado como número para o cálculo
            const precoNumerico = parseFloat(item.preco.toString().replace(/[R$\s,]/g, '')) || 0;
            const valorTotal = precoNumerico * item.pecaquantidade;

            const queryVenda = `
                INSERT INTO sistema.venda 
                (id_usuario, codigoproduto, pecaquantidade, valortotal, datavenda, statusvenda, forma_pagamento) 
                VALUES ($1, $2, $3, $4, CURRENT_DATE, 'Concluída', $5)
            `;
            
            await client.query(queryVenda, [
                id_usuario, 
                item.codigoproduto, 
                item.pecaquantidade, 
                valorTotal, 
                formaPagamento || 'Não informado'
            ]);
        }

        // Limpa o carrinho
        await client.query("DELETE FROM sistema.carrinho WHERE id_usuario = $1", [id_usuario]);

        await client.query('COMMIT');
        res.status(201).json({ mensagem: "Venda registrada com sucesso!" });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("ERRO AO FINALIZAR:", err.message);
        res.status(500).json({ erro: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;