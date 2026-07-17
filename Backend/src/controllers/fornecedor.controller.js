// fornecedor.controller.js: CRUD de fornecedores, quem entrega/vende os
// produtos. O campo tipo diferencia uma EMPRESA (entrega programada) de
// uma compra feita direto no MERCADO. Assim como categorias, fornecedores
// usam soft delete (ativo = 0) em vez de exclusão definitiva.

const pool = require('../config/db');

// Únicos valores aceitos para o campo tipo (espelha o ENUM do banco em schema.sql).
const TIPOS_VALIDOS = ['EMPRESA', 'MERCADO'];

async function listar(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, tipo, telefone, ativo FROM fornecedores WHERE ativo = 1 ORDER BY nome'
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar fornecedores' });
  }
}

async function criar(req, res) {
  const { nome, tipo, telefone } = req.body || {};

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'Informe o nome do fornecedor' });
  }

  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo deve ser EMPRESA ou MERCADO' });
  }

  try {
    const [resultado] = await pool.query(
      'INSERT INTO fornecedores (nome, tipo, telefone) VALUES (?, ?, ?)',
      [nome.trim(), tipo, telefone || null]
    );
    return res.status(201).json({
      id: resultado.insertId,
      nome: nome.trim(),
      tipo,
      telefone: telefone || null,
      ativo: 1
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao criar fornecedor' });
  }
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, tipo, telefone } = req.body || {};

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'Informe o nome do fornecedor' });
  }

  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo deve ser EMPRESA ou MERCADO' });
  }

  try {
    const [resultado] = await pool.query(
      'UPDATE fornecedores SET nome = ?, tipo = ?, telefone = ? WHERE id = ?',
      [nome.trim(), tipo, telefone || null, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Fornecedor nao encontrado' });
    }

    return res.json({ id: Number(id), nome: nome.trim(), tipo, telefone: telefone || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao atualizar fornecedor' });
  }
}

async function desativar(req, res) {
  const { id } = req.params;

  try {
    const [resultado] = await pool.query(
      'UPDATE fornecedores SET ativo = 0 WHERE id = ?',
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Fornecedor nao encontrado' });
    }

    return res.json({ mensagem: 'Fornecedor desativado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao desativar fornecedor' });
  }
}

module.exports = { listar, criar, atualizar, desativar };