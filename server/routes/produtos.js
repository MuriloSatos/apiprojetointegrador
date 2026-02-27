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

    const values = [nomeproduto, tipoproduto, tamanhoproduto, marcaproduto, preco, codigoproduto, limit, offset];

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: "Erro ao listar produtos", detalhes: err.message });
  }
});

// CRIAR PRODUTO (Ajustado para Upload de Imagem)
router.post("/", async (req, res) => {
  try {
    // Os campos de texto vem em req.body
    const {
      nomeproduto,
      tipoproduto,
      tamanhoproduto,
      marcaproduto,
      preco,
      codigoproduto,
      estoque // Adicionado estoque que estava no seu banco
    } = req.body;

    // O arquivo da imagem vem em req.file (graças ao multer no server.js)
    // Salvamos apenas o nome do arquivo no banco
    const imagem = req.file ? req.file.filename : null;

    const query = `
      INSERT INTO sistema.produto
      (nomeproduto, tipoproduto, tamanhoproduto, marcaproduto, preco, codigoproduto, estoque, imagem)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const valores = [
      nomeproduto,
      tipoproduto,
      tamanhoproduto,
      marcaproduto,
      parseInt(preco),
      parseInt(codigoproduto),
      parseInt(estoque) || 0,
      imagem
    ];

    const resultado = await pool.query(query, valores);
    res.status(201).json(resultado.rows[0]);

  } catch (erro) {
    console.error(erro);
    res.status(400).json({ erro: "Erro ao inserir produto", detalhes: erro.message });
  }
});

// BUSCAR POR ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await pool.query("SELECT * FROM sistema.produto WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Produto não encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

// DELETAR PRODUTO
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await pool.query("DELETE FROM sistema.produto WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Produto não encontrado" });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Erro ao deletar produto" });
  }
});

module.exports = router;