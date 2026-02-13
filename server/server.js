const express = require("express");
require("dotenv").config();
const cors = require('cors');

const produtosRouter = require("./routes/produtos");
const clientesRouter = require("./routes/clientes");
const vendasRouter = require("./routes/vendas");
const admRouter = require("./routes/usuarios"); // Onde deve estar o seu login
const autenticarApiKey = require("./autorizar");

const app = express();
app.use(cors());
app.use(express.json());

// Rota raiz (pública)
app.get("/", (req, res) => {
  res.send("🌎 API de Produtos rodando!");
});

// Se o seu login estiver dentro de admRouter, certifique-se de que 
// a rota lá dentro seja router.get("/login", ...)
app.use("/adm", admRouter); 

// Daqui para baixo, todas as rotas exigirão a API Key no Header
app.use(autenticarApiKey);

app.use("/produtos", produtosRouter);
app.use("/clientes", clientesRouter);
app.use("/vendas", vendasRouter);
app.use("/usuarios", admRouter); // Rotas de gerenciar usuários (travadas)

// =====================
// Servidor
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor rodando em http://127.0.0.1:${PORT}`);
});