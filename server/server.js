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
const carrinhoRouter = require("./routes/carrinho");
const autenticarApiKey = require("./autorizar");

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../front/assets/"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// Acesso a arquivos estáticos
app.use("/assets", express.static(path.join(__dirname, "../front/assets")));


app.get("/", (req, res) => {
  res.send("🌎 API de Produtos rodando!");
});

app.use("/usuarios", usuariosRouter);


app.use(autenticarApiKey);


app.use("/produtos", upload.single('imagem'), produtosRouter);
app.use("/clientes", clientesRouter);
app.use("/vendas", vendasRouter);
app.use("/carrinho", carrinhoRouter);
// Exemplo de como deve ser no seu server.js
app.post('/usuarios', (req, res) => {
    const { email, senha } = req.body;  

});

// Inicialização
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor rodando em http://127.0.0.1:${PORT}`);
});