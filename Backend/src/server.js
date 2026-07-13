const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/api/ping', (req, res) => {
  res.json({ mensagem: 'API do Cafe_Estoque funcionando!' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});