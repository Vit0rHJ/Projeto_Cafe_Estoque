// server.js: ponto de entrada da API. Cria o app Express, registra os
// middlewares globais (CORS, parser de JSON) e conecta cada grupo de
// rotas na sua URL base. Todas as rotas são públicas — não é exigido
// login para acessar o sistema.

const cors = require('cors');
const express = require('express');

const categoriaRoutes = require('./routes/categoria.routes');
const fornecedorRoutes = require('./routes/fornecedor.routes');
const produtoRoutes = require('./routes/produto.routes');
const estoqueRoutes = require('./routes/estoque.routes');
const entradaRoutes = require('./routes/entrada.routes');
const saidaRoutes = require('./routes/saida.routes');
const contagemRoutes = require('./routes/contagem.routes');
const gastoRoutes = require('./routes/gasto.routes');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/categorias', categoriaRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/entradas', entradaRoutes);
app.use('/api/saidas', saidaRoutes);
app.use('/api/contagens', contagemRoutes);
app.use('/api/gastos', gastoRoutes);
app.get('/api/ping', (req, res) => {
  res.json({ mensagem: 'pong' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});