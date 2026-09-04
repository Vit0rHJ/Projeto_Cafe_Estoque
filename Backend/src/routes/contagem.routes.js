const { Router } = require('express');
const { listar, buscar, criar } = require('../controllers/contagem.controller');

const router = Router();

router.get('/', listar);
router.get('/:id', buscar);
router.post('/', criar);

module.exports = router;
