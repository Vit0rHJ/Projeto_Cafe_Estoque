const cors = require('cors');
const express = require('express');

const autenticar = require('./middlewares/auth');
const categoriaRoutes = require('./routes/categoria.routes');
const authRoutes = require('./routes/auth.routes');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/categorias', autenticar, categoriaRoutes);

app.get('/api/ping', autenticar, (req, res) => {
  res.json({ mensagem: `Ola, ${req.usuario.nome}! Token valido.` });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});