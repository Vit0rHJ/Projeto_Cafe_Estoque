// entrada.controller.js: registra entrada de estoque (compra/entrega).
// Cada chamada cria uma "nota" (entradas) com um único item
// (entrada_itens) — quantidade e preço pago naquela compra.

const pool = require('../config/db');

const TIPOS_VALIDOS = ['ENTREGA', 'COMPRA_DIRETA'];

async function criar(req, res) {
  const { produto_id, fornecedor_id, quantidade, preco_unitario, tipo, data_entrada, observacao } = req.body || {};

  if (!produto_id) {
    return res.status(400).json({ erro: 'Informe o produto' });
  }

  if (!fornecedor_id) {
    return res.status(400).json({ erro: 'Informe o fornecedor' });
  }

  const qtd = Number(quantidade);
  if (!quantidade || isNaN(qtd) || qtd <= 0) {
    return res.status(400).json({ erro: 'Quantidade deve ser um numero maior que zero' });
  }

  const preco = Number(preco_unitario);
  if (preco_unitario === undefined || isNaN(preco) || preco < 0) {
    return res.status(400).json({ erro: 'Preco unitario deve ser um numero maior ou igual a zero' });
  }

  const tipoEntrada = tipo && TIPOS_VALIDOS.includes(tipo) ? tipo : 'COMPRA_DIRETA';
  const data = data_entrada || new Date().toISOString().slice(0, 10);

  const conexao = await pool.getConnection();

  try {
    await conexao.beginTransaction();

    const [produtos] = await conexao.query(
      'SELECT id FROM produtos WHERE id = ? AND ativo = 1',
      [produto_id]
    );
    if (produtos.length === 0) {
      await conexao.rollback();
      return res.status(400).json({ erro: 'Produto nao encontrado' });
    }

    const [fornecedores] = await conexao.query(
      'SELECT id FROM fornecedores WHERE id = ? AND ativo = 1',
      [fornecedor_id]
    );
    if (fornecedores.length === 0) {
      await conexao.rollback();
      return res.status(400).json({ erro: 'Fornecedor nao encontrado' });
    }

    const [resultadoEntrada] = await conexao.query(
      'INSERT INTO entradas (fornecedor_id, tipo, data_entrada, observacao) VALUES (?, ?, ?, ?)',
      [fornecedor_id, tipoEntrada, data, observacao || null]
    );

    await conexao.query(
      'INSERT INTO entrada_itens (entrada_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
      [resultadoEntrada.insertId, produto_id, qtd, preco]
    );

    await conexao.commit();

    return res.status(201).json({
      id: resultadoEntrada.insertId,
      produto_id: Number(produto_id),
      fornecedor_id: Number(fornecedor_id),
      quantidade: qtd,
      preco_unitario: preco,
      tipo: tipoEntrada,
      data_entrada: data
    });
  } catch (err) {
    await conexao.rollback();
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao registrar entrada' });
  } finally {
    conexao.release();
  }
}

module.exports = { criar };
