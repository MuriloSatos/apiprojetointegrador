const express = require("express");
require("dotenv").config();
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const produtosRouter = require("./routes/produtos");
const vendasRouter = require("./routes/vendas");
const usuariosRouter = require("./routes/usuarios");
const carrinhoRouter = require("./routes/carrinho");

const app = express();

// 1. CONFIGURAÇÃO DE CORS CORRIGIDA
// 1. CONFIGURAÇÃO DE CORS CORRIGIDA
app.use(cors({
    origin: '*', // Permite qualquer site acessar (bom para desenvolvimento)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'minha-chave', 'apikey','prefer'] 
}));
app.use(express.json());

// Assets estáticos
app.use("/assets", express.static(path.join(__dirname, "../front/assets")));

app.get("/", (req, res) => {
    res.send("🌎 API de Produtos rodando!");
});

// 2. ROTA DE USUÁRIOS (Sem proteção de chave para permitir login/cadastro)
app.use("/usuarios", usuariosRouter);

// 3. MIDDLEWARE DE PROTEÇÃO ÚNICO
app.use((req, res, next) => {
    const chaveUnica = req.headers['minha-chave'];
    
    // IMPORTANTE: Esta string abaixo deve ser IGUAL à do seu arquivo produto.js
    const CHAVE_MESTRA = 'SUA_CHAVE_SECRETA_MUITO_FORTE_123456'; 

    if (chaveUnica === CHAVE_MESTRA) {
        next();
    } else {
        console.log("Tentativa de acesso com chave errada:", chaveUnica);
        res.status(500).json({ mensagem: 'chave invalida api' });
    }
});

// 4. ROTAS PROTEGIDAS (Só funcionam se passar pelo middleware acima)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, "../front/assets/")),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Exemplo de rota para validar se o usuário ainda existe no banco
router.post('/validar-sessao', async (req, res) => {
    const { id_usuario } = req.body; // ou email, dependendo de como você salva no frontend

    if (!id_usuario) {
        return res.status(400).json({ mensagem: "ID não fornecido." });
    }

    try {
      
        
        const usuarioExiste = true; 
        if (!usuarioExiste) {
            return res.status(401).json({ mensagem: "Usuário não encontrado ou foi excluído." });
        }

        return res.status(200).json({ mensagem: "Sessão válida." });

    } catch (erro) {
        console.error("Erro ao validar sessão:", erro);
        return res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
});



app.use("/produtos", upload.single('imagem'), produtosRouter);
app.use("/vendas", vendasRouter);
app.use("/carrinho", carrinhoRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});