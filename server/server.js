const express = require("express");
require("dotenv").config();

const cors = require('cors');

const produtosRouter = require("./routes/produtos");
const clientesRouter = require("./routes/clientes");
const vendasRouter = require("./routes/vendas");
const admRouter = require("./routes/usuarios");
const autenticarApiKey = require("./autorizar")

const app = express();
app.use(cors());
app.use(express.json());


// =====================1
// Rotas principais
// =====================
//app.use(autenticarApiKey)
app.use("/produtos", produtosRouter);
app.use("/clientes", clientesRouter);
app.use("/vendas", vendasRouter);
app.use("/usuarios", admRouter);

// Rota raiz
app.get("/", (req, res) => {
  res.send("🌎 API de Produtos rodando! Acesse a documentação em /api-docs");
});

// =====================
// Servidor
// =====================
const PORT = process.env.PORT || 3000;


app.listen(PORT,"0.0.0.0",  () => {
  console.log("✅ Servidor rodando em http://127.0.0.1:3000");
});
