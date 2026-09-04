// gasto.controller.js: relatorio de gastos. So consulta a view vw_gastos
// (entrada_itens + entradas + produtos + fornecedores, ver database/schema.sql),
// com filtros opcionais de periodo, categoria e fornecedor.

const pool = require('../config/db');

function montarFiltros(query) {
  const { data_inicio, data_fim, categoria_id, fornecedor_id } = query || {};
  const condicoes = [];
  const parametros = [];

  if (data_inicio) {
    condicoes.push('data_entrada >= ?');
    parametros.push(data_inicio);
  }
  if (data_fim) {
    condicoes.push('data_entrada <= ?');
    parametros.push(data_fim);
  }
  if (categoria_id) {
    condicoes.push('categoria = (SELECT nome FROM categorias WHERE id = ?)');
    parametros.push(categoria_id);
  }
  if (fornecedor_id) {
    condicoes.push('fornecedor = (SELECT nome FROM fornecedores WHERE id = ?)');
    parametros.push(fornecedor_id);
  }

  const whereSql = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';
  return { whereSql, parametros };
}

async function listar(req, res) {
  try {
    const { whereSql, parametros } = montarFiltros(req.query);
    const [rows] = await pool.query(
      `SELECT entrada_id, data_entrada, tipo, fornecedor, categoria, produto,
              quantidade, preco_unitario, total_item
       FROM vw_gastos
       ${whereSql}
       ORDER BY data_entrada DESC, entrada_id DESC`,
      parametros
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar gastos' });
  }
}

async function resumo(req, res) {
  try {
    const { whereSql, parametros } = montarFiltros(req.query);

    const [[{ total_gasto }]] = await pool.query(
      `SELECT COALESCE(SUM(total_item), 0) AS total_gasto FROM vw_gastos ${whereSql}`,
      parametros
    );

    const [porCategoria] = await pool.query(
      `SELECT categoria, COALESCE(SUM(total_item), 0) AS total
       FROM vw_gastos
       ${whereSql}
       GROUP BY categoria
       ORDER BY total DESC`,
      parametros
    );

    return res.json({
      total_gasto: Number(total_gasto),
      por_categoria: porCategoria.map((c) => ({ categoria: c.categoria, total: Number(c.total) }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao gerar resumo de gastos' });
  }
}

module.exports = { listar, resumo };
