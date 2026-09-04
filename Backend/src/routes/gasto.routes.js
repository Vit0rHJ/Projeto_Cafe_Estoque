const { Router } = require('express');
const { listar, resumo } = require('../controllers/gasto.controller');

const router = Router();

router.get('/', listar);
router.get('/resumo', resumo);

module.exports = router;
