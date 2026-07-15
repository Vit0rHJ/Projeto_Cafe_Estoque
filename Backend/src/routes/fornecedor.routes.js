const { Router } = require('express');
const { listar, criar, atualizar, desativar } = require('../controllers/fornecedor.controller');

const router = Router();

router.get('/', listar);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', desativar);

module.exports = router;