const express = require("express");
require("dotenv").config();
const cors = require('cors');
const path = require('path');
const multer = require('multer');

// Importação dos roteadores
const produtosRouter = require("./routes/produtos");
const clientesRouter = require("./routes/clientes");
const vendasRouter = require("./routes/vendas");
const usuariosRouter = require("./routes/usuarios");
const autenticarApiKey = require("./autorizar");

const app = express();

// --- CONFIGURAÇÃO DO MULTER ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../front/assets/")); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// Acesso a arquivos estáticos
app.use("/assets", express.static(path.join(__dirname, "../front/assets")));

// ==========================================
// 1. ROTAS PÚBLICAS (NÃO precisam de API Key)
// ==========================================
app.get("/", (req, res) => {
  res.send("🌎 API de Produtos rodando!");
});

// Rota de login/cadastro deve ser pública
app.use("/usuarios", usuariosRouter); 

// ==========================================
// 2. MIDDLEWARE DE SEGURANÇA (Abaixo daqui, tudo é protegido)
// ==========================================
app.use(autenticarApiKey);

// ==========================================
// 3. ROTAS PRIVADAS
// ==========================================
app.use("/produtos", upload.single('imagem'), produtosRouter); 
app.use("/clientes", clientesRouter);
app.use("/vendas", vendasRouter);

// Inicialização
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor rodando em http://127.0.0.1:${PORT}`);
});