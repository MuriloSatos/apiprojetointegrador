const express = require("express");
const pool = require("../db");

const router = express.Router();

// LISTAR PRODUTOS (Com Filtros)
router.get("/", async (req, res) => {
  try {
    let {
      nomeproduto,
      tipoproduto,
      tamanhoproduto,
      marcaproduto,
      preco,
      codigoproduto,
      ordem,
      offset,
      limit
    } = req.query;

    // Ajuste de filtros para busca parcial
    nomeproduto    = nomeproduto ? `%${nomeproduto}%` : `%`;
    tipoproduto    = tipoproduto ? `%${tipoproduto}%` : `%`;
    tamanhoproduto = tamanhoproduto ? `%${tamanhoproduto}%` : `%`;
    marcaproduto   = marcaproduto ? `%${marcaproduto}%` : `%`;

    preco = preco ? parseInt(preco) : null;
    codigoproduto = codigoproduto ? parseInt(codigoproduto) : null;

    ordem  = ordem && ordem.toLowerCase() === "asc" ? "ASC" : "DESC";
    offset = parseInt(offset) || 0;
    limit  = parseInt(limit) || 100;

    const query = `
      SELECT *
      FROM sistema.produto
      WHERE nomeproduto ILIKE $1
        AND tipoproduto ILIKE $2
        AND tamanhoproduto ILIKE $3
        AND marcaproduto ILIKE $4
        AND ($5::int IS NULL OR preco = $5)
        AND ($6::int IS NULL OR codigoproduto = $6)
      ORDER BY id ${ordem}
      LIMIT $7
      OFFSET $8
    `;

    const values = [
      nomeproduto,
      tipoproduto,
      tamanhoproduto,
      marcaproduto,
      preco,
      codigoproduto,
      limit,
      offset
    ];

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (err) {
    res.status(500).json({
      error: "Erro ao listar produtos",
      detalhes: err.message
    });
  }
});

// BUSCAR POR ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await pool.query(
      "SELECT * FROM sistema.produto WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Produto não encontrado" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

// CRIAR PRODUTO
router.post("/", async (req, res) => {
  try {
    const {
      nomeproduto,
      tipoproduto,
      tamanhoproduto,
      marcaproduto,
      preco,
      codigoproduto
    } = req.body;

    // AJUSTE: Removi o ID para o banco gerar automaticamente (SERIAL)
    // AJUSTE: Corrigi 'sistema.produtos' para 'sistema.produto'
    const query = `
      INSERT INTO sistema.produto
      (nomeproduto, tipoproduto, tamanhoproduto, marcaproduto, preco, codigoproduto)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const valores = [
      nomeproduto,
      tipoproduto,
      tamanhoproduto,
      marcaproduto,
      preco,
      codigoproduto
    ];

    const resultado = await pool.query(query, valores);
    res.status(201).json(resultado.rows[0]);

  } catch (erro) {
    res.status(400).json({ erro: "Erro ao inserir produto", detalhes: erro.message });
  }
});

// ATUALIZAR PRODUTO
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      nomeproduto,
      tipoproduto,
      preco,
      tamanhoproduto,
      marcaproduto,
      codigoproduto,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE sistema.produto
      SET nomeproduto=$1,
          tipoproduto=$2,
          preco=$3,
          tamanhoproduto=$4,
          marcaproduto=$5,
          codigoproduto=$6
      WHERE id=$7
      RETURNING *
      `,
      [nomeproduto, tipoproduto, preco, tamanhoproduto, marcaproduto, codigoproduto, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Produto não encontrado" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

// DELETAR PRODUTO
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await pool.query(
      "DELETE FROM sistema.produto WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Produto não encontrado" });

    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Erro ao deletar produto" });
  }
});

module.exports = router;