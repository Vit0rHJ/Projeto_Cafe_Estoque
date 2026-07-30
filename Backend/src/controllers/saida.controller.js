// saida.controller.js: registra saída manual de estoque (uso/retirada).

const pool = require('../config/db');

async function criar(req, res) {
  const { produto_id, quantidade, data_saida, observacao } = req.body || {};

  if (!produto_id) {
    return res.status(400).json({ erro: 'Informe o produto' });
  }

  const qtd = Number(quantidade);
  if (!quantidade || isNaN(qtd) || qtd <= 0) {
    return res.status(400).json({ erro: 'Quantidade deve ser um numero maior que zero' });
  }

  const data = data_saida || new Date().toISOString().slice(0, 10);

  try {
    const [produtos] = await pool.query(
      'SELECT id FROM produtos WHERE id = ? AND ativo = 1',
      [produto_id]
    );
    if (produtos.length === 0) {
      return res.status(400).json({ erro: 'Produto nao encontrado' });
    }

    const [resultado] = await pool.query(
      'INSERT INTO saidas (produto_id, tipo, quantidade, data_saida, observacao) VALUES (?, ?, ?, ?, ?)',
      [produto_id, 'MANUAL', qtd, data, observacao || null]
    );

    return res.status(201).json({
      id: resultado.insertId,
      produto_id: Number(produto_id),
      quantidade: qtd,
      data_saida: data
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao registrar saida' });
  }
}

module.exports = { criar };
