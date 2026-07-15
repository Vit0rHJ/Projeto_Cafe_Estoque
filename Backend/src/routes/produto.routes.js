const { Router } = require('express');
const { listar, buscarPorId, criar, atualizar, desativar } = require('../controllers/produto.controller');

const router = Router();

router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', desativar);

module.exports = router;