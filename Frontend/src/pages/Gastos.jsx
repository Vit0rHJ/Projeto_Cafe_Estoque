import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatarData(valor) {
  if (!valor) return '—';
  const [ano, mes, dia] = String(valor).slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

function Gastos() {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [gastos, setGastos] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    setErro('');
    const params = {};
    if (dataInicio) params.data_inicio = dataInicio;
    if (dataFim) params.data_fim = dataFim;

    try {
      const [respGastos, respResumo] = await Promise.all([
        api.get('/gastos', { params }),
        api.get('/gastos/resumo', { params })
      ]);
      setGastos(respGastos.data);
      setResumo(respResumo.data);
    } catch (err) {
      console.error(err);
      setErro('Não foi possível carregar o relatório de gastos.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function filtrar(evento) {
    evento.preventDefault();
    carregar();
  }

  function limparFiltro() {
    setDataInicio('');
    setDataFim('');
    setTimeout(carregar, 0);
  }

  return (
    <Layout>
      <div className="pagina-header">
        <div>
          <h1>Gastos</h1>
          <p>Relatório de compras e entregas registradas</p>
        </div>
      </div>

      <form onSubmit={filtrar} className="card card-painel" style={{ marginBottom: 20 }}>
        <div className="campo-linha">
          <div className="campo">
            <label>De</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="campo">
            <label>Até</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </div>
        <div className="modal-acoes" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn-secundario" onClick={limparFiltro}>Limpar</button>
          <button type="submit" className="btn btn-dourado">Filtrar</button>
        </div>
      </form>

      {erro && (
        <div className="card card-painel" style={{ marginBottom: 20 }}>
          <p className="form-erro" style={{ marginBottom: 12 }}>{erro}</p>
          <button className="btn btn-secundario" onClick={carregar}>Tentar de novo</button>
        </div>
      )}

      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <div className="card card-stat">
          <div className="card-label">Total gasto no período</div>
          <div className="card-valor">{carregando || !resumo ? '—' : formatoMoeda.format(resumo.total_gasto)}</div>
        </div>
        <div className="card card-painel">
          <h2>Por categoria</h2>
          {carregando || !resumo ? (
            <div className="estado-vazio">Carregando...</div>
          ) : resumo.por_categoria.length === 0 ? (
            <div className="estado-vazio">Nenhum gasto no período.</div>
          ) : (
            <div className="lista-alerta">
              {resumo.por_categoria.map((item) => (
                <div className="lista-alerta-item" key={item.categoria}>
                  <div className="nome">{item.categoria}</div>
                  <span>{formatoMoeda.format(item.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="tabela-wrap" style={{ marginTop: 20 }}>
        {carregando ? (
          <div className="estado-vazio">Carregando...</div>
        ) : gastos.length === 0 ? (
          <div className="estado-vazio">Nenhum gasto encontrado no período.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Fornecedor</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Quantidade</th>
                <th>Preço unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((gasto) => (
                <tr key={`${gasto.entrada_id}-${gasto.produto}`}>
                  <td>{formatarData(gasto.data_entrada)}</td>
                  <td>{gasto.fornecedor}</td>
                  <td>{gasto.produto}</td>
                  <td>{gasto.categoria}</td>
                  <td>{gasto.quantidade}</td>
                  <td>{formatoMoeda.format(gasto.preco_unitario)}</td>
                  <td>{formatoMoeda.format(gasto.total_item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

export default Gastos;
