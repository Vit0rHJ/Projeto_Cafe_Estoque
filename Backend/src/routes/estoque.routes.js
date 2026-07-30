const { Router } = require('express');
const { listar, resumo } = require('../controllers/estoque.controller');

const router = Router();

router.get('/', listar);
router.get('/resumo', resumo);

module.exports = router;
