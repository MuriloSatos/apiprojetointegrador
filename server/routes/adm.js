const express = require("express");
const pool = require("../db");

const router = express.Router();


router.get("/", async (req, res) => {
    try {
        let {
            nome,
            email,
            senha,
            id,
            perfil
        } = req.query;





        const query = `
      SELECT *   FROM sistema.adm
    `;



        const result = await pool.query(query);
        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Erro ao listar adms",
            detalhes: err.message
        });
    }
});


router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const result = await pool.query(
            "SELECT * FROM sistema.adm WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Adm não encontrado" });

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar adm" });
    }
});


router.post("/", async (req, res) => {
    try {
        const {
            nome,
            email,
            senha,
            id,
            perfil,
        } = req.body;

        if (!nome || !senha || !email || !id || !perfil) {
            return res.status(400).json({
                error: "Campos obrigatórios: nome, senha, email, id, perfil"
            });
        }

        const result = await pool.query(
            `
      INSERT INTO sistema.adm
      (nome, senha, email, id, perfil)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
            [
                nome,
                email,
                senha,
                id,
                perfil,
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao criar Adm:", err);
        res.status(500).json({ error: err.message });
    }
});



router.put("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const {
            nome,
            email,
            senha,
            perfil,
        } = req.body;

        const result = await pool.query(
            `
      UPDATE sistema.adm
      SET nome  = $1,
          senha = $2,
          email = $3,
          perfil= $4
      WHERE id = $5
      RETURNING *
      `,
            [nome, senha, email, perfil, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Adm não encontrado" });
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
            "DELETE FROM sistema.adm WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Adm não encontrado" });

        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: "Erro ao deletar adm" });
    }
});

module.exports = router;
