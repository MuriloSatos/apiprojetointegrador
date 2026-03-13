const express = require("express");
const pool = require("../db");
const router = express.Router();

// 1. LISTAR ITENS DO CARRINHO (Por Cliente)
router.get("/:idcliente", async (req, res) => {
  try {
    const { idcliente } = req.params;
    
    // Join com produto para trazer o nome e preço na mesma busca
    const query = `
      SELECT c.*, p.nomeproduto, p.preco, p.imagem
      FROM sistema.carrinho c
      JOIN sistema.produto p ON c.codigoproduto = p.codigoproduto
      WHERE c.idcliente = $1
    `;
    
    const result = await pool.query(query, [idcliente]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar carrinho", detalhes: err.message });
  }
});

// 2. ADICIONAR ITEM AO CARRINHO (Ou incrementar quantidade)
router.post("/", async (req, res) => {
  try {
    const { idcliente, codigoproduto, pecaquantidade } = req.body;

    // Verifica se já existe
    const checkQuery = "SELECT * FROM sistema.carrinho WHERE idcliente = $1 AND codigoproduto = $2";
    const checkResult = await pool.query(checkQuery, [idcliente, codigoproduto]);

    if (checkResult.rows.length > 0) {
      // Se existir, faz o UPDATE (soma a quantidade)
      const updateQuery = `
        UPDATE sistema.carrinho 
        SET pecaquantidade = pecaquantidade + $1 
        WHERE idcliente = $2 AND codigoproduto = $3 
        RETURNING *
      `;
      const result = await pool.query(updateQuery, [pecaquantidade, idcliente, codigoproduto]);
      res.json(result.rows[0]);
    } else {
      // Se não existir, faz o INSERT
      const insertQuery = `
        INSERT INTO sistema.carrinho (idcliente, codigoproduto, pecaquantidade)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const result = await pool.query(insertQuery, [idcliente, codigoproduto, pecaquantidade]);
      res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    res.status(400).json({ error: "Erro ao adicionar ao carrinho", detalhes: err.message });
  }
});

// 3. ATUALIZAR QUANTIDADE (PUT)
router.put("/:id_carrinho", async (req, res) => {
  try {
    const { id_carrinho } = req.params;
    const { pecaquantidade } = req.body;

    const query = `
      UPDATE sistema.carrinho 
      SET pecaquantidade = $1 
      WHERE id_carrinho = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [pecaquantidade, id_carrinho]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Item não encontrado no carrinho" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar quantidade" });
  }
});

// 4. DELETAR ITEM DO CARRINHO
router.delete("/:id_carrinho", async (req, res) => {
  try {
    const { id_carrinho } = req.params;
    const result = await pool.query("DELETE FROM sistema.carrinho WHERE id_carrinho = $1 RETURNING *", [id_carrinho]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Item não encontrado" });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Erro ao remover item do carrinho" });
  }
});

router.post("/finalizar", async (req, res) => {
    const { idcliente, formaPagamento } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Inicia a transação

        // Busca itens do carrinho
        const itens = await client.query(
            "SELECT c.*, p.preco FROM sistema.carrinho c JOIN sistema.produto p ON c.codigoproduto = p.codigoproduto WHERE c.idcliente = $1",
            [idcliente]
        );

        if (itens.rows.length === 0) throw new Error("Carrinho vazio");

        // Transfere para vendas
        for (const item of itens.rows) {
            const valorTotal = parseFloat(item.preco) * item.pecaquantidade;
            
            await client.query(
                `INSERT INTO sistema.venda (idcliente, codigoproduto, pecaquantidade, valortotal, forma_pagamento) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [idcliente, item.codigoproduto, item.pecaquantidade, valorTotal, formaPagamento]
            );
        }

        // Limpa o carrinho
        await client.query("DELETE FROM sistema.carrinho WHERE idcliente = $1", [idcliente]);

        await client.query('COMMIT');
        res.status(201).json({ mensagem: "Venda realizada e carrinho limpo!" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ erro: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;