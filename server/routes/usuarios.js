const express = require("express");
const pool = require("../db");
const router = express.Router();

// ==========================================
// ROTAS DE AUTENTICAÇÃO (PÚBLICAS)
// ==========================================

router.get("/", async (req, res) => {
    try {
        const sql = "SELECT id, nome, email, senha, perfil FROM sistema.usuarios";
        const result = await pool.query(sql);
        
        // --- TESTE ---
        // Se este log no terminal mostrar a senha, mas o navegador não, 
        // seu servidor tem outro middleware filtrando o JSON.
        console.log("Dados no Servidor (antes de enviar):", result.rows[0]); 
        
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CADASTRO DE CLIENTE
router.post("/cadastro", async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        const perfil = 'cliente'; 

        const result = await pool.query(
            `INSERT INTO sistema.usuarios (nome, senha, email, perfil)
             VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil`,
            [nome, senha, email, perfil]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { 
            return res.status(400).json({ error: "Este e-mail já está cadastrado" });
        }
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// ROTAS DE GESTÃO (PROTEGIDAS)
// ==========================================

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

// CRIAR USUÁRIO VIA ADM
router.post("/", async (req, res) => {
    try {
        const { nome, email, senha, perfil } = req.body;
        const result = await pool.query(
            `INSERT INTO sistema.usuarios (nome, senha, email, perfil)
             VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil`,
            [nome, senha, email, perfil]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// EDITAR USUÁRIO
router.put("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { nome, email, perfil } = req.body;

        const result = await pool.query(
            `UPDATE sistema.usuarios
             SET nome = $1, email = $2, perfil = $3
             WHERE id = $4 RETURNING id, nome, email, perfil`,
            [nome, email, perfil, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETAR USUÁRIO
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await pool.query("DELETE FROM sistema.usuarios WHERE id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: "Erro ao deletar usuário" });
    }
});

module.exports = router;