require("dotenv").config();
const pool = require("./db");

async function autenticarApiKey(req, res, next) {
    const api_key_front = req.header('minha-chave');
    
    try {
        // Busca simples sem joins ou apelidos (c.)
        const result = await pool.query(
            'SELECT * FROM sistema.api_keys WHERE api_key = $1', 
            [api_key_front]
        );

        if (result.rows.length === 1) {
            // Atualiza o consumo de forma segura
            const novoConsumo = (result.rows[0].consumo || 0) + 1;
            await pool.query(
                'UPDATE sistema.api_keys SET consumo = $1 WHERE api_key = $2', 
                [novoConsumo, api_key_front]
            );
            next();
        } else {
            console.log("Chave rejeitada:", api_key_front);
            return res.status(500).json({ mensagem: "chave invalida api" });
        }
    } catch (err) {
        console.error("Erro na autenticação:", err.message);
        return res.status(500).json({ error: "Erro interno na validação da chave", detalhes: err.message });
    }
}

module.exports = autenticarApiKey;



