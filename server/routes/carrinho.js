const express = require("express");
const pool = require("../db");
const router = express.Router();

// 1. GET - Listar itens do carrinho (CORRIGIDO)
// No seu routes/carrinho.js
// DENTRO DO SEU FILE routes/carrinho.js

router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // O ERRO ESTÁ AQUI: Você deve usar id_usuario, NÃO idcliente
        const result = await pool.query(
            "SELECT * FROM sistema.carrinho WHERE id_usuario = $1",
            [id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        // Isso vai te mostrar o erro exato se ainda falhar
        res.status(500).json({
            error: "Erro ao listar carrinho",
            detalhes: err.message
        });
    }
});

// 2. POST - Adicionar ao carrinho (CORRIGIDO)
router.post("/", async (req, res) => {
    try {
        const { id_usuario, codigoproduto, pecaquantidade } = req.body;

        const result = await pool.query(
            `INSERT INTO sistema.carrinho (id_usuario, codigoproduto, pecaquantidade) 
             VALUES ($1, $2, $3) RETURNING *`,
            [id_usuario, codigoproduto, pecaquantidade || 1]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Erro ao adicionar ao carrinho", detalhes: err.message });
    }
});

// 3. PUT - ATUALIZAR QUANTIDADE
router.put("/:id_carrinho", async (req, res) => {
    try {
        const { id_carrinho } = req.params;
        const { pecaquantidade } = req.body;

        const result = await pool.query(
            "UPDATE sistema.carrinho SET pecaquantidade = $1 WHERE id_carrinho = $2 RETURNING *",
            [pecaquantidade, id_carrinho]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: "Item não encontrado" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Erro ao atualizar", detalhes: err.message });
    }
});

// 4. DELETE - REMOVER ITEM
router.delete("/:id_carrinho", async (req, res) => {
    try {
        const { id_carrinho } = req.params;
        await pool.query("DELETE FROM sistema.carrinho WHERE id_carrinho = $1", [id_carrinho]);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: "Erro ao remover", detalhes: err.message });
    }
});

// 5. POST - FINALIZAR VENDA (AQUI ESTAVA O ERRO CRÍTICO)
router.post("/finalizar", async (req, res) => {
    const { id_usuario, formaPagamento } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // JOIN corrigido: Usando id_usuario que existe na tabela
        const queryBusca = `
    SELECT c.*, p.preco 
    FROM sistema.carrinho c 
    JOIN sistema.produto p ON c.codigoproduto = p.codigoproduto 
    WHERE c.id_usuario = $1
`;
        const itens = await client.query(queryBusca, [id_usuario]);

        if (itens.rows.length === 0) throw new Error("Carrinho vazio");

        for (const item of itens.rows) {
            const valorTotal = parseFloat(item.preco) * item.pecaquantidade;

            // CORREÇÃO: Mudado de id_usuarios para id_usuario (singular)
            const queryVenda = `
                INSERT INTO sistema.venda (id_usuario, codigoproduto, pecaquantidade, valortotal, forma_pagamento) 
                VALUES ($1, $2, $3, $4, $5)
            `;
            await client.query(queryVenda, [id_usuario, item.codigoproduto, item.pecaquantidade, valorTotal, formaPagamento]);
        }

        await client.query("DELETE FROM sistema.carrinho WHERE id_usuario = $1", [id_usuario]);

        await client.query('COMMIT');
        res.status(201).json({ mensagem: "Venda realizada com sucesso!" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("ERRO NO BANCO:", err.message);
        res.status(500).json({ erro: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;