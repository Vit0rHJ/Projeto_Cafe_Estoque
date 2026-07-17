// categoria.controller.js: CRUD de categorias de produtos (ex.: Limpeza,
// Congelados, Verduras). Categorias nunca são excluídas de verdade:
// "desativar" apenas marca ativo = 0, preservando o histórico e evitando
// quebrar produtos que já referenciam essa categoria (soft delete).

const pool = require('../config/db');

async function listar(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, ativo FROM categorias WHERE ativo = 1 ORDER BY nome'
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar categorias' });
  }
}

async function criar(req, res) {
  const { nome } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'Informe o nome da categoria' });
  }

  try {
    const [resultado] = await pool.query(
      'INSERT INTO categorias (nome) VALUES (?)',
      [nome.trim()]
    );
    return res.status(201).json({ id: resultado.insertId, nome: nome.trim(), ativo: 1 });
  } catch (err) {
    // ER_DUP_ENTRY = violou a constraint UNIQUE(nome) no banco (schema.sql).
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Ja existe uma categoria com esse nome' });
    }
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao criar categoria' });
  }
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'Informe o nome da categoria' });
  }

  try {
    const [resultado] = await pool.query(
      'UPDATE categorias SET nome = ? WHERE id = ?',
      [nome.trim(), id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Categoria nao encontrada' });
    }

    return res.json({ id: Number(id), nome: nome.trim() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Ja existe uma categoria com esse nome' });
    }
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao atualizar categoria' });
  }
}

async function desativar(req, res) {
  const { id } = req.params;

  try {
    const [resultado] = await pool.query(
      'UPDATE categorias SET ativo = 0 WHERE id = ?',
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Categoria nao encontrada' });
    }

    return res.json({ mensagem: 'Categoria desativada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao desativar categoria' });
  }
}

module.exports = { listar, criar, atualizar, desativar };