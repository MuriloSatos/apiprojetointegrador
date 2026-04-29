const express = require("express");
const pool = require("../db");
const bcrypt = require("bcrypt"); // 🌟 IMPORTANDO A BIBLIOTECA DE SEGURANÇA
const router = express.Router();

// ==========================================
// ROTAS DE AUTENTICAÇÃO (PÚBLICAS E LOGIN)
// ==========================================

router.get("/", async (req, res) => {
    try {
        const { email, senha } = req.query;

        // 🌟 SE FOR UMA TENTATIVA DE LOGIN (Tem email e senha na requisição)
        if (email && senha) {
            // 1. Buscamos o usuário APENAS pelo e-mail
            const sql = "SELECT id, nome, email, senha, perfil FROM sistema.usuarios WHERE email = $1";
            const result = await pool.query(sql, [email]);

            // Se não encontrou o e-mail, barra o acesso
            if (result.rows.length === 0) {
                return res.status(401).json({ error: "E-mail ou senha incorretos." });
            }

            const usuario = result.rows[0];

            // 2. Compara a senha digitada com o Hash salvo no banco
            const senhaValida = await bcrypt.compare(senha, usuario.senha);

            if (!senhaValida) {
                return res.status(401).json({ error: "E-mail ou senha incorretos." });
            }

            // 3. Login com sucesso! Removemos a senha antes de enviar para o Frontend
            delete usuario.senha;
            
            // Retorna em formato de Array pois o seu Frontend antigo espera assim (result.rows[0])
            return res.json([usuario]); 
        }

        // 🌟 SE FOR APENAS PARA LISTAR TODOS OS USUÁRIOS (Sem email e senha)
        // Note que NÃO selecionamos a coluna 'senha' aqui por segurança
        const sqlListar = "SELECT id, nome, email, perfil FROM sistema.usuarios";
        const resultListar = await pool.query(sqlListar);
        res.json(resultListar.rows);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ==========================================
// CRIAÇÃO DE USUÁRIO (CLIENTE OU ADM)
// ==========================================
router.post("/", async (req, res) => {
    try {
        const { nome, email, senha, perfil } = req.body;
        const perfilFinal = perfil || 'cliente'; // Se não vier perfil, vira cliente padrão

        // 🌟 GERANDO O HASH DA SENHA ANTES DE SALVAR
        const saltRounds = 10; // Nível de complexidade da criptografia
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

        const result = await pool.query(
            `INSERT INTO sistema.usuarios (nome, senha, email, perfil)
             VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil`,
            [nome, senhaCriptografada, email, perfilFinal] // Salvando o Hash no banco!
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
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

        if (result.rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar usuário" });
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
