// estoque.controller.js: leitura do estoque calculado. Não grava nada,
// só consulta a view vw_estoque_atual (soma de entradas - soma de saídas,
// ver database/schema.sql) e monta o resumo usado pelo dashboard.

const pool = require('../config/db');

async function listar(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT produto_id, nome, unidade, estoque_minimo, categoria_id, categoria,
              estoque_atual, em_alerta
       FROM vw_estoque_atual
       ORDER BY nome`
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar estoque' });
  }
}

async function resumo(req, res) {
  try {
    const [[{ total_produtos }]] = await pool.query(
      'SELECT COUNT(*) AS total_produtos FROM produtos WHERE ativo = 1'
    );

    const [[{ total_categorias }]] = await pool.query(
      'SELECT COUNT(*) AS total_categorias FROM categorias WHERE ativo = 1'
    );

    const [[{ total_fornecedores }]] = await pool.query(
      'SELECT COUNT(*) AS total_fornecedores FROM fornecedores WHERE ativo = 1'
    );

    const [[{ estoque_baixo }]] = await pool.query(
      'SELECT COUNT(*) AS estoque_baixo FROM vw_estoque_atual WHERE em_alerta = 1'
    );

    // Valor em estoque = estoque_atual de cada produto x o preço da última
    // entrada registrada para ele (ROW_NUMBER pega só a compra mais recente).
    const [[{ valor_total_estoque }]] = await pool.query(`
      SELECT COALESCE(SUM(v.estoque_atual * COALESCE(ultimo_preco.preco_unitario, 0)), 0) AS valor_total_estoque
      FROM vw_estoque_atual v
      LEFT JOIN (
        SELECT produto_id, preco_unitario
        FROM (
          SELECT ei.produto_id, ei.preco_unitario,
                 ROW_NUMBER() OVER (
                   PARTITION BY ei.produto_id
                   ORDER BY en.data_entrada DESC, ei.id DESC
                 ) AS rn
          FROM entrada_itens ei
          JOIN entradas en ON en.id = ei.entrada_id
        ) precos
        WHERE rn = 1
      ) ultimo_preco ON ultimo_preco.produto_id = v.produto_id
    `);

    return res.json({
      total_produtos,
      total_categorias,
      total_fornecedores,
      estoque_baixo,
      valor_total_estoque: Number(valor_total_estoque)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao gerar resumo do estoque' });
  }
}

module.exports = { listar, resumo };
