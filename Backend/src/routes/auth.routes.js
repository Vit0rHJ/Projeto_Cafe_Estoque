// routes/: define os endpoints da API, ligando cada combinação de verbo
// HTTP + URL a uma função do controller correspondente. Não tem lógica de
// negócio aqui, só o mapa das rotas. Essas rotas são registradas em
// src/server.js, onde as protegidas recebem o middleware autenticar.

const { Router } = require('express');
const { login } = require('../controllers/auth.controller');

const router = Router();

router.post('/login', login);

module.exports = router;