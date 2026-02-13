const express = require("express");
const pool = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { email, senha } = req.query;

        // LOGIN: Se houver email e senha, filtra no banco
        if (email && senha) {
            const query = `
                SELECT id, nome, email, perfil 
                FROM sistema.usuarios 
                WHERE email = $1 AND senha = $2
            `;
            const result = await pool.query(query, [email, senha]);

            if (result.rows.length > 0) {
                // Retorna apenas o objeto do usuário (o que evita o erro de undefined)
                return res.json(result.rows[0]);
            } else {
                return res.status(401).json({ error: "Credenciais inválidas" });
            }
        }

        // LISTAGEM GERAL: Se não houver filtro, retorna todos (usado pelo ADM)
        const result = await pool.query("SELECT id, nome, email, perfil FROM sistema.usuarios");
        res.json(result.rows);

    } catch (err) {
        res.status(500).json({ error: "Erro no servidor" });
    }
});
// BUSCAR POR ID
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await pool.query(
            "SELECT id, nome, email, perfil FROM sistema.usuarios WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Usuário não encontrado" });

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar usuário" });
    }
});

// CRIAR USUÁRIO
router.post("/", async (req, res) => {
    try {
        const { nome, email, senha, perfil } = req.body;

        if (!nome || !senha || !email || !perfil) {
            return res.status(400).json({
                error: "Campos obrigatórios: nome, senha, email, perfil"
            });
        }

        const result = await pool.query(
            `INSERT INTO sistema.usuarios (nome, senha, email, perfil)
             VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil`,
            [nome, senha, email, perfil]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao criar Usuário:", err);
        res.status(500).json({ error: err.message });
    }
});

// EDITAR USUÁRIO
router.put("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { nome, email, senha, perfil } = req.body;

        const result = await pool.query(
            `UPDATE sistema.usuarios
             SET nome = $1, senha = $2, email = $3, perfil = $4
             WHERE id = $5 RETURNING id, nome, email, perfil`,
            [nome, senha, email, perfil, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETAR USUÁRIO
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await pool.query(
            "DELETE FROM sistema.usuarios WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Usuário não encontrado" });

        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: "Erro ao deletar usuário" });
    }
});

module.exports = router;