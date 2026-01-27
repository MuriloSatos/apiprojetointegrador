const express = require("express");
require("dotenv").config();

const cors = require('cors');

const produtosRouter = require("./routes/produtos");
const autenticarApiKey = require("./autorizar")

const app = express();
app.use(cors());
app.use(express.json());


// =====================1
// Rotas principais
// =====================
app.use(autenticarApiKey)
app.use("/produtos", produtosRouter);

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
