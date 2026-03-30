const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        let {
            codigoproduto,
            codigovendas,
            statusvenda,
            id_usuarios, // Ajustado
            datavenda,
            ordem,
            offset,
            limit
        } = req.query;

        codigoproduto = codigoproduto ? parseInt(codigoproduto) : null;
        id_usuarios = id_usuarios ? parseInt(id_usuarios) : null; // Ajustado
        codigovendas = codigovendas ? `%${codigovendas}%` : `%`;
        statusvenda = statusvenda ? `%${statusvenda}%` : `%`;
        datavenda = datavenda || null;

        ordem = ordem && ordem.toLowerCase() === "asc" ? "ASC" : "DESC";
        offset = parseInt(offset) || 0;
        limit = parseInt(limit) || 100;

        const query = `
      SELECT *
      FROM sistema.venda
      ORDER BY datavenda ${ordem}
    `;

        // Nota: Embora os valores abaixo estejam definidos, 
        // a sua query SQL acima não está usando filtros WHERE. 
        // Se precisar filtrar, lembre-se de adicionar WHERE id_usuarios = $1 etc.
        const values = [
            codigovendas,
            statusvenda,
            codigoproduto,
            id_usuarios, // Ajustado
            datavenda,
            limit,
            offset
        ];

        const result = await pool.query(query);
        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Erro ao listar vendas",
            details: err.message
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const result = await pool.query(
            "SELECT * FROM sistema.venda WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Venda não encontrada" });

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar venda" });
    }
});

router.post("/", async (req, res) => {
    try {
        const {
            codigoproduto,
            datavenda,
            codigovendas,
            pecaquantidade,
            valortotal,
            statusvenda,
            id_usuarios // Ajustado
        } = req.body;

        if (
            codigoproduto == null ||
            pecaquantidade == null ||
            valortotal == null ||
            id_usuarios == null // Ajustado
        ) {
            return res.status(400).json({
                error: "Campos obrigatórios: codigoproduto, pecaquantidade, valortotal, id_usuarios"
            });
        }

        const result = await pool.query(
            `
      INSERT INTO sistema.venda
      (codigoproduto, datavenda, codigovendas, pecaquantidade, valortotal, statusvenda, id_usuarios)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
            [
                Number(codigoproduto),
                datavenda || new Date(),
                codigovendas || null,
                Number(pecaquantidade),
                Number(valortotal),
                statusvenda || "finalizada",
                Number(id_usuarios) // Ajustado
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const {
            codigoproduto, datavenda, pecaquantidade, valortotal, statusvenda, id_usuarios // Ajustado
        } = req.body;

        const result = await pool.query(
            `
      UPDATE sistema.venda
        SET codigoproduto=$1, datavenda=$2, pecaquantidade=$3, valortotal=$4, statusvenda=$5, id_usuarios=$6
      WHERE codigovendas = $7
      RETURNING *
      `,
            [
                codigoproduto, datavenda, pecaquantidade, valortotal, statusvenda, id_usuarios, id
            ]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Venda não encontrada" });

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Erro ao atualizar venda", err: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const result = await pool.query(
            "DELETE FROM sistema.venda WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Venda não encontrada" });

        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: "Erro ao deletar venda" });
    }
});

router.post('/finalizar', async (req, res) => {
    const { id_usuarios, formaPagamento } = req.body; // Ajustado

    try {
        // 1. Busca todos os itens do carrinho para este cliente
        // Ajustado c.id_usuarios e WHERE c.id_usuarios
        const resultCarrinho = await pool.query(
            "SELECT c.*, p.preco FROM carrinho c JOIN produto p ON c.codigoproduto = p.codigoproduto WHERE c.id_usuarios = $1", 
            [id_usuarios]
        );

        const itensCarrinho = resultCarrinho.rows;

        if (itensCarrinho.length === 0) return res.status(400).send("Carrinho vazio");

        // 2. Calcula o valor total
        let total = itensCarrinho.reduce((acc, item) => acc + (item.preco * item.pecaquantidade), 0);

        // 3. Insere a venda para cada item
        for (let item of itensCarrinho) {
            await pool.query(
                "INSERT INTO sistema.venda (id_usuarios, codigoproduto, pecaquantidade, valortotal, datavenda, statusvenda) VALUES ($1, $2, $3, $4, NOW(), $5)",
                [id_usuarios, item.codigoproduto, item.pecaquantidade, total, "finalizada"]
            );
        }

        // 4. Limpa o carrinho do cliente
        await pool.query("DELETE FROM carrinho WHERE id_usuarios = $1", [id_usuarios]);

        res.status(201).json({ mensagem: "Compra finalizada com sucesso!" });
    } catch (erro) {
        console.error(erro);
        res.status(500).send("Erro ao processar venda: " + erro.message);
    }
});

module.exports = router;