const express = require("express");
require("dotenv").config();
const cors = require('cors');
const path = require('path'); // Necessário para gerenciar caminhos
const multer = require('multer'); // Biblioteca para upload de arquivos

// Importação dos roteadores
const produtosRouter = require("./routes/produtos");
const clientesRouter = require("./routes/clientes");
const vendasRouter = require("./routes/vendas");
const usuariosRouter = require("./routes/usuarios");
const autenticarApiKey = require("./autorizar");

const app = express();

// --- CONFIGURAÇÃO DO MULTER (Upload de Imagens) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Define a pasta onde as fotos serão salvas no seu projeto
        cb(null, path.join(__dirname, "../front/assets/")); 
    },
    filename: (req, file, cb) => {
        // Gera um nome único: timestamp-nomeoriginal.jpg
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// Permite que o navegador acesse a pasta assets por URL (ex: http://localhost:3000/assets/bike.jpg)
app.use("/assets", express.static(path.join(__dirname, "../front/assets")));

// ==========================================
// 1. ROTAS PÚBLICAS
// ==========================================
app.get("/", (req, res) => {
  res.send("🌎 API de Produtos rodando!");
});

app.use("/auth", usuariosRouter);

// ==========================================
// 2. MIDDLEWARE DE SEGURANÇA
// ==========================================
app.use(autenticarApiKey);

// ==========================================
// 3. ROTAS PRIVADAS
// ==========================================

// Ajuste na rota de produtos para aceitar o upload de imagem
// 'imagem' deve ser o nome (id/name) do campo no HTML
app.use("/produtos", upload.single('imagem'), produtosRouter); 

app.use("/clientes", clientesRouter);
app.use("/vendas", vendasRouter);
app.use("/usuarios", usuariosRouter);

// Inicialização
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor rodando em http://127.0.0.1:${PORT}`);
});