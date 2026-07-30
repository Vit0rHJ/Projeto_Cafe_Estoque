const { Router } = require('express');
const { criar } = require('../controllers/saida.controller');

const router = Router();

router.post('/', criar);

module.exports = router;
