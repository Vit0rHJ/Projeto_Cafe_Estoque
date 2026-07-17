// server.js: ponto de entrada da API. Cria o app Express, registra os
// middlewares globais (CORS, parser de JSON) e conecta cada grupo de
// rotas na sua URL base. As rotas de categorias, fornecedores e produtos
// passam pelo middleware autenticar — só quem tem um token JWT válido
// (obtido em /api/auth/login) consegue acessá-las.

const cors = require('cors');
const express = require('express');

const autenticar = require('./middlewares/auth');
const categoriaRoutes = require('./routes/categoria.routes');
const authRoutes = require('./routes/auth.routes');
const fornecedorRoutes = require('./routes/fornecedor.routes');
const produtoRoutes = require('./routes/produto.routes');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes); // pública: é aqui que se obtém o token
app.use('/api/categorias', autenticar, categoriaRoutes);
app.use('/api/fornecedores', autenticar, fornecedorRoutes);
app.use('/api/produtos', autenticar, produtoRoutes);
app.get('/api/ping', autenticar, (req, res) => {
  res.json({ mensagem: `Ola, ${req.usuario.nome}! Token valido.` });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});