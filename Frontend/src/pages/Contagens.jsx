import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ErroCarregamento from '../components/ErroCarregamento';
import { IconeMais, IconeOlho } from '../components/Icones';
import api, { avisarEstoqueAtualizado, mensagemDeErro } from '../services/api';

function formatarData(valor) {
  if (!valor) return '—';
  const [ano, mes, dia] = String(valor).slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function Contagens() {
  const [tela, setTela] = useState('lista'); // 'lista' | 'nova' | 'detalhe'
  const [contagens, setContagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState('');

  const [produtos, setProdutos] = useState([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);
  const [dataContagem, setDataContagem] = useState(hoje());
  const [observacao, setObservacao] = useState('');
  const [contados, setContados] = useState({}); // produto_id -> string
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const [detalhe, setDetalhe] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState('');
  const [contagemAberta, setContagemAberta] = useState(null);

  async function carregar() {
    setCarregando(true);
    setErroLista('');
    try {
      const resp = await api.get('/contagens');
      setContagens(resp.data);
    } catch (err) {
      console.error(err);
      setErroLista(mensagemDeErro(err));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function abrirNova() {
    setErro('');
    setResultado(null);
    setDataContagem(hoje());
    setObservacao('');
    setTela('nova');
    setCarregandoProdutos(true);
    try {
      const [respProdutos, respEstoque] = await Promise.all([
        api.get('/produtos'),
        api.get('/estoque')
      ]);
      const estoquePorProduto = {};
      respEstoque.data.forEach((item) => {
        estoquePorProduto[item.produto_id] = item.estoque_atual;
      });

      const lista = respProdutos.data.map((produto) => ({
        ...produto,
        estoque_esperado: estoquePorProduto[produto.id] ?? 0
      }));
      setProdutos(lista);

      const iniciais = {};
      lista.forEach((produto) => {
        iniciais[produto.id] = String(produto.estoque_esperado);
      });
      setContados(iniciais);
    } catch (err) {
      console.error(err);
      setErro(mensagemDeErro(err, 'Não foi possível carregar os produtos.'));
    } finally {
      setCarregandoProdutos(false);
    }
  }

  function voltarLista() {
    setTela('lista');
    setDetalhe(null);
    setResultado(null);
    carregar();
  }

  async function abrirDetalhe(contagem) {
    setTela('detalhe');
    setContagemAberta(contagem);
    setDetalhe(null);
    setErroDetalhe('');
    setCarregandoDetalhe(true);
    try {
      const resp = await api.get(`/contagens/${contagem.id}`);
      setDetalhe(resp.data);
    } catch (err) {
      console.error(err);
      setErroDetalhe(mensagemDeErro(err));
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  async function salvar(evento) {
    evento.preventDefault();
    setErro('');

    const itens = produtos
      .map((produto) => ({
        produto_id: produto.id,
        estoque_contado: contados[produto.id]
      }))
      .filter((item) => item.estoque_contado !== '' && item.estoque_contado !== undefined);

    if (itens.length === 0) {
      setErro('Informe a quantidade contada de ao menos um produto');
      return;
    }

    setSalvando(true);
    try {
      const resp = await api.post('/contagens', {
        data_contagem: dataContagem,
        observacao: observacao || undefined,
        itens
      });
      setResultado(resp.data);
      avisarEstoqueAtualizado();
    } catch (err) {
      setErro(mensagemDeErro(err, 'Erro ao registrar contagem'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Layout>
      {tela === 'lista' && (
        <>
          <div className="pagina-header">
            <div>
              <h1>Contagens</h1>
              <p>Inventário: compare o estoque físico com o esperado pelo sistema</p>
            </div>
            <button className="btn btn-dourado" onClick={abrirNova}>
              <IconeMais tamanho={16} espessura={2.2} />
              Nova contagem
            </button>
          </div>

          {erroLista && <ErroCarregamento mensagem={erroLista} onTentar={carregar} />}

          <div className="tabela-wrap">
            {carregando ? (
              <div className="estado-vazio">Carregando...</div>
            ) : contagens.length === 0 ? (
              <div className="estado-vazio">{erroLista ? 'Não foi possível carregar as contagens.' : 'Nenhuma contagem registrada ainda.'}</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Observação</th>
                    <th>Itens contados</th>
                    <th>Ajustes gerados</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {contagens.map((contagem) => (
                    <tr key={contagem.id}>
                      <td>{formatarData(contagem.data_contagem)}</td>
                      <td>{contagem.observacao || '—'}</td>
                      <td>{contagem.total_itens}</td>
                      <td className={contagem.total_ajustes > 0 ? 'qtd-baixa' : ''}>{contagem.total_ajustes}</td>
                      <td className="acoes">
                        <button className="btn-icone" onClick={() => abrirDetalhe(contagem)} title="Ver detalhes" aria-label="Ver detalhes"><IconeOlho tamanho={17} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tela === 'nova' && (
        <>
          <div className="pagina-header">
            <div>
              <h1>Nova contagem</h1>
              <p>Confira o estoque de cada produto e corrija a quantidade contada</p>
            </div>
            <button className="btn btn-secundario" onClick={voltarLista}>Voltar</button>
          </div>

          {resultado ? (
            <div className="card card-painel">
              <h2>Contagem registrada</h2>
              {resultado.ajustes_gerados.length === 0 ? (
                <div className="estado-vazio">Nenhuma diferença encontrada — estoque bateu com o esperado.</div>
              ) : (
                <div className="lista-alerta">
                  {resultado.ajustes_gerados.map((ajuste) => (
                    <div className="lista-alerta-item" key={ajuste.produto_id}>
                      <div className="nome">{ajuste.produto}</div>
                      <span className="badge-alerta">−{ajuste.quantidade_ajustada}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="modal-acoes">
                <button className="btn btn-dourado" onClick={voltarLista}>Concluir</button>
              </div>
            </div>
          ) : (
            <form onSubmit={salvar}>
              {erro && <p className="form-erro">{erro}</p>}

              <div className="card card-painel" style={{ marginBottom: 20 }}>
                <div className="campo-linha">
                  <div className="campo">
                    <label>Data da contagem</label>
                    <input type="date" value={dataContagem} onChange={(e) => setDataContagem(e.target.value)} />
                  </div>
                  <div className="campo">
                    <label>Observação (opcional)</label>
                    <input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="tabela-wrap">
                {carregandoProdutos ? (
                  <div className="estado-vazio">Carregando produtos...</div>
                ) : produtos.length === 0 ? (
                  <div className="estado-vazio">Nenhum produto cadastrado.</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Categoria</th>
                        <th>Esperado</th>
                        <th>Contado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtos.map((produto) => (
                        <tr key={produto.id}>
                          <td>{produto.nome}</td>
                          <td>{produto.categoria}</td>
                          <td>{produto.estoque_esperado} {produto.unidade}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.001"
                              value={contados[produto.id] ?? ''}
                              onChange={(e) => setContados({ ...contados, [produto.id]: e.target.value })}
                              className="input-tabela"
                              aria-label={`Quantidade contada de ${produto.nome}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="modal-acoes">
                <button type="button" className="btn btn-secundario" onClick={voltarLista}>Cancelar</button>
                <button type="submit" className="btn btn-dourado" disabled={salvando || carregandoProdutos}>
                  {salvando ? 'Registrando...' : 'Registrar contagem'}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {tela === 'detalhe' && (
        <>
          <div className="pagina-header">
            <div>
              <h1>Detalhe da contagem</h1>
              <p>{detalhe ? `${formatarData(detalhe.data_contagem)} — ${detalhe.observacao || 'sem observação'}` : ''}</p>
            </div>
            <button className="btn btn-secundario" onClick={voltarLista}>Voltar</button>
          </div>

          {erroDetalhe && (
            <ErroCarregamento mensagem={erroDetalhe} onTentar={() => abrirDetalhe(contagemAberta)} />
          )}

          <div className="tabela-wrap">
            {erroDetalhe ? (
              <div className="estado-vazio">Não foi possível carregar a contagem.</div>
            ) : carregandoDetalhe || !detalhe ? (
              <div className="estado-vazio">Carregando...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Esperado</th>
                    <th>Contado</th>
                    <th>Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {detalhe.itens.map((item) => (
                    <tr key={item.id}>
                      <td>{item.produto}</td>
                      <td>{item.estoque_esperado} {item.unidade}</td>
                      <td>{item.estoque_contado} {item.unidade}</td>
                      <td className={item.diferenca < 0 ? 'qtd-baixa' : ''}>
                        {item.diferenca > 0 ? '+' : ''}{item.diferenca}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}

export default Contagens;
