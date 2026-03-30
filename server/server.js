const express = require("express");
require("dotenv").config();
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const produtosRouter = require("./routes/produtos");
const clientesRouter = require("./routes/clientes");
const vendasRouter = require("./routes/vendas");
const usuariosRouter = require("./routes/usuarios");
const carrinhoRouter = require("./routes/carrinho");

const app = express();

// 1. CONFIGURAÇÃO DE CORS CORRIGIDA
app.use(cors({
    origin: '*', 
    allowedHeaders: ['Content-Type', 'minha-chave'] // Permite sua chave personalizada
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

app.use("/produtos", upload.single('imagem'), produtosRouter);
app.use("/clientes", clientesRouter);
app.use("/vendas", vendasRouter);
app.use("/carrinho", carrinhoRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});