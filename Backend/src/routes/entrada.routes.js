const { Router } = require('express');
const { criar } = require('../controllers/entrada.controller');

const router = Router();

router.post('/', criar);

module.exports = router;
