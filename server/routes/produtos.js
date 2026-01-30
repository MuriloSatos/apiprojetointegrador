const express = require("express");
const pool = require("../db");

const router = express.Router();


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


router.post("/", async (req, res) => {
  try {
    const {
      nomeproduto,
      tipoproduto,
      preco,
      tamanhoproduto,
      marcaproduto,
      codigoproduto,
      id
    } = req.body;

    if (!nomeproduto || !tipoproduto || preco == null) {
      return res.status(400).json({
        error: "Campos obrigatórios: nomeproduto, tipoproduto, preco"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO sistema.produto
      (nomeproduto, tipoproduto, preco, tamanhoproduto, marcaproduto, codigoproduto,id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        nomeproduto,
        tipoproduto,
        Number(preco),
        tamanhoproduto || null,
        marcaproduto || null,
        codigoproduto || null,
        id 
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar produto:", err);
    res.status(500).json({ error: err.message });
  }
});



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
