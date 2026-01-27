const express = require("express");
const pool = require("../db");

const router = express.Router();

/* =========================
   LISTAR PRODUTOS (COM FILTROS)
========================= */
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
      FROM sistema.produtos
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

/* =========================
   BUSCAR PRODUTO POR ID
========================= */
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const result = await pool.query(
      "SELECT * FROM sistema.produtos WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Produto não encontrado" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

/* =========================
   CRIAR PRODUTO
========================= */
router.post("/", async (req, res) => {
  try {
    const {
      nomeproduto,
      tipoproduto,
      preco,
      tamanhoproduto,
      marcaproduto,
      codigoproduto
    } = req.body;

    if (!nomeproduto || !tipoproduto || !preco)
      return res.status(400).json({ error: "Campos obrigatórios: nomeproduto, tipoproduto, preco" });

    const result = await pool.query(
      `
      INSERT INTO sistema.produtos
      (nomeproduto, tipoproduto, preco, tamanhoproduto, marcaproduto, codigoproduto)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [nomeproduto, tipoproduto, preco, tamanhoproduto, marcaproduto, codigoproduto]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

/* =========================
   ATUALIZAR PRODUTO
========================= */
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const {
      nomeproduto,
      tipoproduto,
      preco,
      tamanhoproduto,
      marcaproduto,
      codigoproduto
    } = req.body;

    const result = await pool.query(
      `
      UPDATE sistema.produtos
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

/* =========================
   DELETAR PRODUTO
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const result = await pool.query(
      "DELETE FROM sistema.produtos WHERE id = $1 RETURNING *",
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
