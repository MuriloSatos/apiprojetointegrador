const express = require("express");
const pool = require("../db");
const router = express.Router();

// ==========================================
// ROTAS DE AUTENTICAÇÃO (PÚBLICAS)
// ==========================================

// LOGIN: POST /usuarios/login
router.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;

        const query = `
            SELECT id, nome, email, perfil 
            FROM sistema.usuarios 
            WHERE email = $1 AND senha = $2
        `;
        const result = await pool.query(query, [email, senha]);

        if (result.rows.length > 0) {
            // Retorna o objeto usuario para o frontend salvar no localStorage
            return res.json({ usuario: result.rows[0] });
        } else {
            return res.status(401).json({ error: "E-mail ou senha incorretos" });
        }
    } catch (err) {
        res.status(500).json({ error: "Erro interno no servidor" });
    }
});

// CADASTRO DE CLIENTE: POST /usuarios/cadastro
// Rota pública para quando o cliente se registra sozinho
router.post("/cadastro", async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        const perfil = 'cliente'; // Todo cadastro via site nasce como cliente

        const result = await pool.query(
            `INSERT INTO sistema.usuarios (nome, senha, email, perfil)
             VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil`,
            [nome, senha, email, perfil]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Erro de e-mail duplicado no banco
            return res.status(400).json({ error: "Este e-mail já está cadastrado" });
        }
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// ROTAS DE GESTÃO (PROTEGIDAS PELA API KEY NO SERVER.JS)
// ==========================================

// LISTAR TODOS (Usado na tabela de gestão)
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, nome, email, perfil FROM sistema.usuarios ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar usuários" });
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