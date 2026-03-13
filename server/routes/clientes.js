const express = require("express");
const pool = require("../db");

const router = express.Router();

// 1. LISTAR CLIENTES (Ajustado para mostrar apenas ATIVOS)
router.get("/", async (req, res) => {
  try {
    let {
      nome,
      senha,
      email,
      id,
      cpf,
      ordem,
      offset,
      limit
    } = req.query;

    // Filtros texto
    nome  = nome  ? `%${nome}%`  : `%`;
    senha = senha ? `%${senha}%` : `%`;
    email = email ? `%${email}%` : `%`;
    cpf   = cpf   ? `%${cpf}%`   : `%`;

    // ID numérico
    id = id ? parseInt(id) : null;

    // Paginação e ordenação
    ordem  = ordem && ordem.toLowerCase() === "asc" ? "ASC" : "DESC";
    offset = parseInt(offset) || 0;
    limit  = parseInt(limit) || 100;

    // AQUI O AJUSTE: Adicionado "AND ativo = true" para esconder os inativados
    const query = `
      SELECT *
      FROM sistema.cliente
      WHERE nome ILIKE $1
        AND senha ILIKE $2
        AND email ILIKE $3
        AND cpf ILIKE $4
        AND ($5::int IS NULL OR id = $5)
        AND ativo = true
      ORDER BY id ${ordem}
      LIMIT $6
      OFFSET $7
    `;

    const values = [nome, senha, email, cpf, id, limit, offset];

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erro ao listar clientes",
      detalhes: err.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await pool.query(
      "SELECT * FROM sistema.cliente WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Cliente não encontrado" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar cliente" });
  }
});

// 2. CRIAR CLIENTE (Garante que o cliente novo seja ativo)
router.post("/", async (req, res) => {
  try {
    const { nome, senha, email, id, cpf } = req.body;

    // DICA: Se você arrumou o ID para SERIAL, não precisa passar o ID no body nem no INSERT
    const result = await pool.query(
      `
      INSERT INTO sistema.cliente
      (nome, senha, email, id, cpf, ativo)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
      `,
      [nome, senha, email, id, cpf]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar cliente:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, senha, email, cpf } = req.body;

    const result = await pool.query(
      `
      UPDATE sistema.cliente
      SET nome  = $1,
          senha = $2,
          email = $3,
          cpf   = $4  
      WHERE id = $5
      RETURNING *
      `,
      [nome, senha, email, cpf, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Dentro de server/routes/clientes.js
router.patch('/inativar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Primeiro, verifica o estado atual do cliente
        const busca = await pool.query("SELECT ativo FROM sistema.cliente WHERE id = $1", [id]);
        
        if (busca.rows.length === 0) {
            return res.status(404).json({ error: "Cliente não encontrado" });
        }

        // Inverte o status atual (se true vira false, se false vira true)
        const novoStatus = !busca.rows[0].ativo;

        const query = "UPDATE sistema.cliente SET ativo = $1 WHERE id = $2 RETURNING *";
        await pool.query(query, [novoStatus, id]);
        
        res.status(200).json({ message: "Status alterado!", novoStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

module.exports = router;