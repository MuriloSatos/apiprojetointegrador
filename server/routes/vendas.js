const express = require("express");
const pool = require("../db");
const router = express.Router();

// LISTAR VENDAS (GET) - Preparado para Cliente e Admin
router.get("/", async (req, res) => {
    try {
        const { id_usuario } = req.query;

        // 1. QUERY BASE: Busca as vendas e faz um JOIN com a tabela de produtos
        // para trazer a imagem e o nome do produto para o Front-end.
        // OBS: Certifique-se de que sua tabela de produtos se chama 'sistema.produto'
        let query = `
            SELECT 
                v.codigovendas,
                v.codigoproduto,
                v.pecaquantidade,
                v.valortotal,
                v.statusvenda,
                v.forma_pagamento,
                v.datavenda,
                v.id_usuario,
                p.nomeproduto,
                p.imagem
            FROM sistema.venda v
            LEFT JOIN sistema.produto p ON v.codigoproduto = p.codigoproduto
        `;
        
        let values = [];

        // 2. A MÁGICA: Verifica se é cliente ou admin
        if (id_usuario) {
            // Se o front-end mandou o ID (é um Cliente), filtramos só as vendas dele
            query += " WHERE v.id_usuario = $1";
            values.push(parseInt(id_usuario));
        }
        // Se NÃO mandou o ID (é o Admin), ele ignora o IF e a query continua buscando TUDO!

        // 3. Ordena para mostrar as vendas mais recentes primeiro
        query += " ORDER BY v.datavenda DESC";

        const result = await pool.query(query, values);
        
        // 4. Devolve a lista pronta para o Front-end
        res.json(result.rows);
        
    } catch (err) {
        console.error("ERRO REAL NO BANCO DE DADOS:", err);
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
