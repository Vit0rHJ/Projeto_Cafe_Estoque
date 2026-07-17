// produto.controller.js: CRUD de produtos do estoque. Cada produto
// pertence a uma categoria e tem uma unidade de medida e um
// estoque_minimo (usado depois pela view vw_estoque_atual do banco para
// disparar alerta quando o estoque calculado fica igual ou abaixo desse
// valor). Repare que o estoque em si não é armazenado aqui — ele é
// calculado a partir de entradas e saídas (ver database/schema.sql).

const pool = require('../config/db');

// Únicos valores aceitos para o campo unidade (espelha o ENUM do banco em schema.sql).
const UNIDADES_VALIDAS = ['kg', 'g', 'L', 'ml', 'un', 'pct', 'cx'];

async function listar(req, res) {
  const { categoria_id } = req.query;

  try {
    // Monta a query dinamicamente: o filtro por categoria é opcional
    // (só entra no SQL/valores se categoria_id vier na querystring).
    let sql = `
      SELECT p.id, p.nome, p.categoria_id, c.nome AS categoria,
             p.unidade, p.estoque_minimo, p.ativo
      FROM produtos p
      JOIN categorias c ON c.id = p.categoria_id
      WHERE p.ativo = 1
    `;
    const valores = [];

    if (categoria_id) {
      sql += ' AND p.categoria_id = ?';
      valores.push(categoria_id);
    }

    sql += ' ORDER BY c.nome, p.nome';

    const [rows] = await pool.query(sql, valores);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar produtos' });
  }
}

async function buscarPorId(req, res) {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.nome, p.categoria_id, c.nome AS categoria,
              p.unidade, p.estoque_minimo, p.ativo
       FROM produtos p
       JOIN categorias c ON c.id = p.categoria_id
       WHERE p.id = ? AND p.ativo = 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Produto nao encontrado' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao buscar produto' });
  }
}

async function criar(req, res) {
  const { nome, categoria_id, unidade, estoque_minimo } = req.body || {};

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'Informe o nome do produto' });
  }

  if (!categoria_id) {
    return res.status(400).json({ erro: 'Informe a categoria' });
  }

  if (!unidade || !UNIDADES_VALIDAS.includes(unidade)) {
    return res.status(400).json({ erro: `Unidade deve ser: ${UNIDADES_VALIDAS.join(', ')}` });
  }

  // Se não informado, assume 0 (sem alerta de estoque mínimo).
  const minimo = estoque_minimo === undefined ? 0 : Number(estoque_minimo);

  if (isNaN(minimo) || minimo < 0) {
    return res.status(400).json({ erro: 'Estoque minimo deve ser um numero maior ou igual a zero' });
  }

  try {
    // Confere se a categoria existe e está ativa antes de gravar o produto
    // (o banco também tem FOREIGN KEY, mas aqui já devolvemos um erro claro).
    const [categorias] = await pool.query(
      'SELECT id FROM categorias WHERE id = ? AND ativo = 1',
      [categoria_id]
    );

    if (categorias.length === 0) {
      return res.status(400).json({ erro: 'Categoria nao encontrada' });
    }

    const [resultado] = await pool.query(
      'INSERT INTO produtos (nome, categoria_id, unidade, estoque_minimo) VALUES (?, ?, ?, ?)',
      [nome.trim(), categoria_id, unidade, minimo]
    );

    return res.status(201).json({
      id: resultado.insertId,
      nome: nome.trim(),
      categoria_id: Number(categoria_id),
      unidade,
      estoque_minimo: minimo,
      ativo: 1
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao criar produto' });
  }
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, categoria_id, unidade, estoque_minimo } = req.body || {};

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'Informe o nome do produto' });
  }

  if (!categoria_id) {
    return res.status(400).json({ erro: 'Informe a categoria' });
  }

  if (!unidade || !UNIDADES_VALIDAS.includes(unidade)) {
    return res.status(400).json({ erro: `Unidade deve ser: ${UNIDADES_VALIDAS.join(', ')}` });
  }

  // Se não informado, assume 0 (sem alerta de estoque mínimo).
  const minimo = estoque_minimo === undefined ? 0 : Number(estoque_minimo);

  if (isNaN(minimo) || minimo < 0) {
    return res.status(400).json({ erro: 'Estoque minimo deve ser um numero maior ou igual a zero' });
  }

  try {
    // Confere se a categoria existe e está ativa antes de gravar o produto
    // (o banco também tem FOREIGN KEY, mas aqui já devolvemos um erro claro).
    const [categorias] = await pool.query(
      'SELECT id FROM categorias WHERE id = ? AND ativo = 1',
      [categoria_id]
    );

    if (categorias.length === 0) {
      return res.status(400).json({ erro: 'Categoria nao encontrada' });
    }

    const [resultado] = await pool.query(
      'UPDATE produtos SET nome = ?, categoria_id = ?, unidade = ?, estoque_minimo = ? WHERE id = ?',
      [nome.trim(), categoria_id, unidade, minimo, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Produto nao encontrado' });
    }

    return res.json({
      id: Number(id),
      nome: nome.trim(),
      categoria_id: Number(categoria_id),
      unidade,
      estoque_minimo: minimo
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao atualizar produto' });
  }
}

async function desativar(req, res) {
  const { id } = req.params;

  try {
    const [resultado] = await pool.query(
      'UPDATE produtos SET ativo = 0 WHERE id = ?',
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Produto nao encontrado' });
    }

    return res.json({ mensagem: 'Produto desativado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao desativar produto' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, desativar };