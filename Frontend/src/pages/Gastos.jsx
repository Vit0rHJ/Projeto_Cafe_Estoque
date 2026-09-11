import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ErroCarregamento from '../components/ErroCarregamento';
import { IconeValor } from '../components/Icones';
import api, { mensagemDeErro } from '../services/api';

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

  // Recebe o período por parâmetro (em vez de ler o estado) para o "Limpar"
  // conseguir recarregar já sem filtro, antes do estado novo ser aplicado.
  async function carregar(inicio = dataInicio, fim = dataFim) {
    setCarregando(true);
    setErro('');
    const params = {};
    if (inicio) params.data_inicio = inicio;
    if (fim) params.data_fim = fim;

    try {
      const [respGastos, respResumo] = await Promise.all([
        api.get('/gastos', { params }),
        api.get('/gastos/resumo', { params })
      ]);
      setGastos(respGastos.data);
      setResumo(respResumo.data);
    } catch (err) {
      console.error(err);
      setErro(mensagemDeErro(err, 'Não foi possível carregar o relatório de gastos.'));
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
    carregar('', '');
  }

  const pronto = !carregando && resumo;

  return (
    <Layout>
      <div className="pagina-header">
        <div>
          <h1>Gastos</h1>
          <p>Relatório das compras e entregas registradas. Filtre por período para ver quanto foi gasto e em quê.</p>
        </div>
      </div>

      <form onSubmit={filtrar} className="card filtro-gastos">
        <div className="campo-linha">
          <div className="campo">
            <label htmlFor="gastos-de">De</label>
            <input id="gastos-de" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="gastos-ate">Até</label>
            <input id="gastos-ate" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </div>
        <div className="modal-acoes">
          <button type="button" className="btn btn-secundario" onClick={limparFiltro}>Limpar</button>
          <button type="submit" className="btn btn-dourado">Filtrar</button>
        </div>
      </form>

      {erro && <ErroCarregamento mensagem={erro} onTentar={() => carregar()} />}

      <div className="grid-gastos">
        <div className="card card-stat">
          <span className="card-icone"><IconeValor tamanho={40} espessura={1.3} /></span>
          <div className="card-valor">{pronto ? formatoMoeda.format(resumo.total_gasto) : '—'}</div>
          <div className="card-label">Total gasto no período</div>
        </div>
        <div className="card card-painel">
          <h2>Por categoria</h2>
          {!pronto ? (
            <div className="estado-vazio">{carregando ? 'Carregando...' : '—'}</div>
          ) : resumo.por_categoria.length === 0 ? (
            <div className="estado-vazio">Nenhum gasto no período.</div>
          ) : (
            resumo.por_categoria.map((item) => {
              const pct = resumo.total_gasto > 0 ? Math.round((item.total / resumo.total_gasto) * 100) : 0;
              return (
                <div className="barra-item" key={item.categoria}>
                  <div className="barra-rotulos">
                    <span>{item.categoria}</span>
                    <span>{formatoMoeda.format(item.total)} · {pct}%</span>
                  </div>
                  <div className="barra" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={item.categoria}>
                    <div className="barra-preenchida" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="tabela-wrap">
        {carregando ? (
          <div className="estado-vazio">Carregando...</div>
        ) : gastos.length === 0 ? (
          <div className="estado-vazio">{erro ? 'Não foi possível carregar os gastos.' : 'Nenhum gasto encontrado no período.'}</div>
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
