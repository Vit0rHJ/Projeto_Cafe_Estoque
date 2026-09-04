// contagem.controller.js: registra contagens de inventário. Cada contagem
// compara, item a item, o estoque esperado (vw_estoque_atual no momento da
// contagem) com o estoque contado. Quando falta produto (contado < esperado),
// gera automaticamente uma saida do tipo AJUSTE_CONTAGEM com a diferenca.
// Quando sobra ou bate, so fica registrado no item da contagem — o schema nao
// tem um jeito de "entrar" estoque sem fornecedor, entao sobra nao ajusta.

const pool = require('../config/db');

async function listar(req, res) {
  try {
    const [contagens] = await pool.query(
      `SELECT
         co.id, co.data_contagem, co.observacao, co.criado_em,
         COUNT(ci.id) AS total_itens,
         COUNT(s.id) AS total_ajustes
       FROM contagens co
       LEFT JOIN contagem_itens ci ON ci.contagem_id = co.id
       LEFT JOIN saidas s ON s.contagem_id = co.id
       GROUP BY co.id, co.data_contagem, co.observacao, co.criado_em
       ORDER BY co.data_contagem DESC, co.id DESC`
    );
    return res.json(contagens);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar contagens' });
  }
}

async function buscar(req, res) {
  const { id } = req.params;

  try {
    const [contagens] = await pool.query(
      'SELECT id, data_contagem, observacao, criado_em FROM contagens WHERE id = ?',
      [id]
    );
    if (contagens.length === 0) {
      return res.status(404).json({ erro: 'Contagem nao encontrada' });
    }

    const [itens] = await pool.query(
      `SELECT
         ci.id, ci.produto_id, p.nome AS produto, p.unidade,
         ci.estoque_esperado, ci.estoque_contado,
         (ci.estoque_contado - ci.estoque_esperado) AS diferenca
       FROM contagem_itens ci
       JOIN produtos p ON p.id = ci.produto_id
       WHERE ci.contagem_id = ?
       ORDER BY p.nome`,
      [id]
    );

    return res.json({ ...contagens[0], itens });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao buscar contagem' });
  }
}

async function criar(req, res) {
  const { data_contagem, observacao, itens } = req.body || {};

  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'Informe ao menos um item contado' });
  }

  for (const item of itens) {
    const contado = Number(item?.estoque_contado);
    if (!item?.produto_id || item.estoque_contado === undefined || isNaN(contado) || contado < 0) {
      return res.status(400).json({ erro: 'Cada item precisa de produto_id e estoque_contado (numero >= 0)' });
    }
  }

  const data = data_contagem || new Date().toISOString().slice(0, 10);
  const conexao = await pool.getConnection();

  try {
    await conexao.beginTransaction();

    const [resultadoContagem] = await conexao.query(
      'INSERT INTO contagens (data_contagem, observacao) VALUES (?, ?)',
      [data, observacao || null]
    );
    const contagemId = resultadoContagem.insertId;

    const itensSalvos = [];
    const ajustesGerados = [];

    for (const item of itens) {
      const produtoId = item.produto_id;
      const contado = Number(item.estoque_contado);

      const [produtos] = await conexao.query(
        'SELECT id, nome FROM produtos WHERE id = ? AND ativo = 1',
        [produtoId]
      );
      if (produtos.length === 0) {
        await conexao.rollback();
        return res.status(400).json({ erro: `Produto ${produtoId} nao encontrado` });
      }

      const [estoqueRows] = await conexao.query(
        'SELECT estoque_atual FROM vw_estoque_atual WHERE produto_id = ?',
        [produtoId]
      );
      const esperado = estoqueRows.length > 0 ? Number(estoqueRows[0].estoque_atual) : 0;

      await conexao.query(
        'INSERT INTO contagem_itens (contagem_id, produto_id, estoque_esperado, estoque_contado) VALUES (?, ?, ?, ?)',
        [contagemId, produtoId, esperado, contado]
      );

      itensSalvos.push({ produto_id: produtoId, produto: produtos[0].nome, estoque_esperado: esperado, estoque_contado: contado });

      if (contado < esperado) {
        const falta = Number((esperado - contado).toFixed(3));
        await conexao.query(
          `INSERT INTO saidas (produto_id, contagem_id, tipo, quantidade, data_saida, observacao)
           VALUES (?, ?, 'AJUSTE_CONTAGEM', ?, ?, ?)`,
          [produtoId, contagemId, falta, data, 'Ajuste gerado por contagem de inventario']
        );
        ajustesGerados.push({ produto_id: produtoId, produto: produtos[0].nome, quantidade_ajustada: falta });
      }
    }

    await conexao.commit();

    return res.status(201).json({
      id: contagemId,
      data_contagem: data,
      observacao: observacao || null,
      itens: itensSalvos,
      ajustes_gerados: ajustesGerados
    });
  } catch (err) {
    await conexao.rollback();
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao registrar contagem' });
  } finally {
    conexao.release();
  }
}

module.exports = { listar, buscar, criar };
