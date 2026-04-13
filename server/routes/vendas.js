const express = require("express");
const pool = require("../db");
const router = express.Router();

// LISTAR VENDAS (GET)
router.get("/", async (req, res) => {
    try {
        const { id_usuario } = req.query;

        let query = `
            SELECT 
                v.codigovendas AS venda_id,
                v.codigoproduto AS prod_id_venda,
                v.pecaquantidade,
                v.valortotal, 
                v.statusvenda,
                v.forma_pagamento,
                v.datavenda,
                p.nomeproduto, 
                p.imagem,
                p.id AS prod_id_estoque
            FROM sistema.venda v
            LEFT JOIN sistema.produto p ON v.codigoproduto = p.id
        `;
        
        let values = [];
        if (id_usuario) {
            query += " WHERE v.id_usuario = $1";
            values.push(parseInt(id_usuario));
        }

        query += " ORDER BY v.datavenda DESC";

        const result = await pool.query(query, values);
        res.json(result.rows);
        
    } catch (err) {
        console.error("ERRO NO BANCO:", err);
        res.status(500).json({ error: "Erro ao listar vendas" });
    }
});


// CRIAR VENDA (POST) - Usada pelo pedidos.js
router.post("/", async (req, res) => {
    const { codigoproduto, pecaquantidade, valortotal, id_usuario, forma_pagamento } = req.body;

    try {
        const query = `
            INSERT INTO sistema.venda 
            (codigoproduto, pecaquantidade, valortotal, id_usuario, statusvenda, forma_pagamento, datavenda) 
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING *;
        `;

        const values = [
            codigoproduto,
            pecaquantidade,
            valortotal,
            id_usuario,
            'Finalizado',
            forma_pagamento || 'Cartão'
        ];

        const result = await pool.query(query, values);

        // Deleta do carrinho APÓS a venda ser confirmada
        await pool.query(
            "DELETE FROM sistema.carrinho WHERE id_usuario = $1 AND codigoproduto = $2",
            [id_usuario, codigoproduto]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Erro no Banco:", err.message);
        res.status(500).json({ error: "Erro ao processar venda" });
    }
});

module.exports = router;