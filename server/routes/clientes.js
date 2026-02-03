const express = require("express");
const pool = require("../db");

const router = express.Router();


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

    const query = `
      SELECT *
      FROM sistema.cliente
      WHERE nome ILIKE $1
        AND senha ILIKE $2
        AND email ILIKE $3
        AND cpf ILIKE $4
        AND ($5::int IS NULL OR id = $5)
      ORDER BY id ${ordem}
      LIMIT $6
      OFFSET $7
    `;

    const values = [
      nome,
      senha,
      email,
      cpf,
      id,
      limit,
      offset
    ];

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


router.post("/", async (req, res) => {
  try {
    const {
      nome,
      senha,
      email,
      id,
      cpf
    } = req.body;

    if (!nome || !senha || !email || !id || !cpf) {
      return res.status(400).json({
        error: "Campos obrigatórios: nome, senha, email, id, cpf"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO sistema.cliente
      (nome, senha, email, id, cpf)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        nome,
        senha,
        email,
        id,
        cpf
      ]
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

    const {
      nome,
      senha,
      email,
      cpf
    } = req.body;

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


router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const result = await pool.query(
      "DELETE FROM sistema.cliente WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Cliente não encontrado" });

    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Erro ao deletar cliente",erros: err.message});
  }
});

module.exports = router;
