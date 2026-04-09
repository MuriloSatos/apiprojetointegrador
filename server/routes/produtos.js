const express = require("express");
const pool = require("../db");
const router = express.Router();

// 1. LISTAR PRODUTOS (Com Filtros e Blindado)
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

    preco = preco ? parseFloat(preco) : null;
    codigoproduto = codigoproduto ? parseInt(codigoproduto) : null;

    ordem  = ordem && ordem.toLowerCase() === "asc" ? "ASC" : "DESC";
    offset = parseInt(offset) || 0;
    limit  = parseInt(limit) || 100;

    // 🔥 MÁGICA 1: preco::numeric no SELECT para o Node receber um número limpo!
    // 🔥 MÁGICA 2: preco::numeric no WHERE para não dar erro de "money = integer"
    const query = `
      SELECT 
        id, nomeproduto, tipoproduto, tamanhoproduto, marcaproduto, 
        preco::numeric AS preco, 
        codigoproduto, estoque, imagem
      FROM sistema.produto
      WHERE nomeproduto ILIKE $1
        AND tipoproduto ILIKE $2
        AND tamanhoproduto ILIKE $3
        AND marcaproduto ILIKE $4
        AND ($5::numeric IS NULL OR preco::numeric = $5::numeric)
        AND ($6::int IS NULL OR codigoproduto = $6)
      ORDER BY id ${ordem}
      LIMIT $7
      OFFSET $8
    `;

    const values = [nomeproduto, tipoproduto, tamanhoproduto, marcaproduto, preco, codigoproduto, limit, offset];

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (err) {
    console.error("Erro na listagem:", err);
    // 🛑 TRUQUE AQUI: Mudei a frase do erro! 
    res.status(500).json({ error: "ERRO NA NOVA ROTA DE PRODUTOS", detalhes: err.message });
  }
});

// 2. CRIAR PRODUTO
router.post("/", async (req, res) => {
  try {
    const {
      nomeproduto, tipoproduto, tamanhoproduto, marcaproduto, 
      preco, codigoproduto, estoque 
    } = req.body;

    const imagemURL = req.file ? req.file.filename : req.body.imagem || null;

    const query = `
      INSERT INTO sistema.produto
      (nomeproduto, tipoproduto, tamanhoproduto, marcaproduto, preco, codigoproduto, estoque, imagem)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nomeproduto, tipoproduto, tamanhoproduto, marcaproduto, preco::numeric AS preco, codigoproduto, estoque, imagem;
    `;

    const valores = [
      nomeproduto, tipoproduto, tamanhoproduto, marcaproduto, 
      parseFloat(preco), parseInt(codigoproduto), parseInt(estoque) || 0, imagemURL
    ];

    const resultado = await pool.query(query, valores);
    res.status(201).json(resultado.rows[0]);

  } catch (erro) {
    res.status(400).json({ erro: "ERRO NA NOVA ROTA DE POST", detalhes: erro.message });
  }
});

// 3. BUSCAR POR ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const query = `
      SELECT id, nomeproduto, tipoproduto, tamanhoproduto, marcaproduto, preco::numeric AS preco, codigoproduto, estoque, imagem 
      FROM sistema.produto 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Produto não encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "ERRO NOVO AO BUSCAR POR ID", detalhes: err.message });
  }
});

// 4. DELETAR PRODUTO
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await pool.query("DELETE FROM sistema.produto WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Produto não encontrado" });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Erro ao deletar produto", detalhes: err.message });
  }
});

module.exports = router;