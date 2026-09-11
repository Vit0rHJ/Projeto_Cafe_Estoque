import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ErroCarregamento from '../components/ErroCarregamento';
import { IconeEditar, IconeEntrada, IconeLixeira, IconeMais, IconeSaida } from '../components/Icones';
import api, { avisarEstoqueAtualizado, mensagemDeErro } from '../services/api';

const UNIDADES = ['kg', 'g', 'L', 'ml', 'un', 'pct', 'cx'];
const PRODUTO_VAZIO = { nome: '', categoria_id: '', unidade: 'un', estoque_minimo: '0' };
const ENTRADA_VAZIA = { fornecedor_id: '', quantidade: '', preco_unitario: '', tipo: 'COMPRA_DIRETA' };
const SAIDA_VAZIA = { quantidade: '', observacao: '' };

function Produtos() {
  const location = useLocation();

  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [estoquePorProduto, setEstoquePorProduto] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState('');

  const [modal, setModal] = useState(null); // 'produto' | 'entrada' | 'saida'
  const [editando, setEditando] = useState(null);
  const [produtoForm, setProdutoForm] = useState(PRODUTO_VAZIO);

  const [produtoAlvo, setProdutoAlvo] = useState(null);
  const [entradaForm, setEntradaForm] = useState(ENTRADA_VAZIA);
  const [saidaForm, setSaidaForm] = useState(SAIDA_VAZIA);

  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErroLista('');
    try {
      const [respProdutos, respCategorias, respFornecedores, respEstoque] = await Promise.all([
        api.get('/produtos'),
        api.get('/categorias'),
        api.get('/fornecedores'),
        api.get('/estoque')
      ]);
      setProdutos(respProdutos.data);
      setCategorias(respCategorias.data);
      setFornecedores(respFornecedores.data);

      const mapa = {};
      respEstoque.data.forEach((item) => {
        mapa[item.produto_id] = item;
      });
      setEstoquePorProduto(mapa);
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

  useEffect(() => {
    if (location.state?.abrirNovo) {
      abrirNovoProduto();
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  function fechar() {
    setModal(null);
    setErro('');
  }

  function depoisDeSalvar() {
    fechar();
    carregar();
    avisarEstoqueAtualizado();
  }

  function abrirNovoProduto() {
    setEditando({});
    setProdutoForm(PRODUTO_VAZIO);
    setErro('');
    setModal('produto');
  }

  function abrirEdicaoProduto(produto) {
    setEditando(produto);
    setProdutoForm({
      nome: produto.nome,
      categoria_id: String(produto.categoria_id),
      unidade: produto.unidade,
      estoque_minimo: String(produto.estoque_minimo)
    });
    setErro('');
    setModal('produto');
  }

  async function salvarProduto(evento) {
    evento.preventDefault();
    setErro('');

    if (!produtoForm.nome.trim()) {
      setErro('Informe o nome do produto');
      return;
    }
    if (!produtoForm.categoria_id) {
      setErro('Selecione uma categoria');
      return;
    }

    setSalvando(true);
    try {
      if (editando.id) {
        await api.put(`/produtos/${editando.id}`, produtoForm);
      } else {
        await api.post('/produtos', produtoForm);
      }
      depoisDeSalvar();
    } catch (err) {
      setErro(mensagemDeErro(err, 'Erro ao salvar produto'));
    } finally {
      setSalvando(false);
    }
  }

  async function desativarProduto(produto) {
    if (!window.confirm(`Desativar o produto "${produto.nome}"?`)) return;
    try {
      await api.delete(`/produtos/${produto.id}`);
      carregar();
      avisarEstoqueAtualizado();
    } catch (err) {
      setErroLista(mensagemDeErro(err, 'Erro ao desativar produto'));
    }
  }

  function abrirEntrada(produto) {
    setProdutoAlvo(produto);
    setEntradaForm({ ...ENTRADA_VAZIA, fornecedor_id: fornecedores[0]?.id ? String(fornecedores[0].id) : '' });
    setErro('');
    setModal('entrada');
  }

  async function salvarEntrada(evento) {
    evento.preventDefault();
    setErro('');

    if (!entradaForm.fornecedor_id) {
      setErro('Selecione um fornecedor');
      return;
    }
    if (!entradaForm.quantidade || Number(entradaForm.quantidade) <= 0) {
      setErro('Informe uma quantidade valida');
      return;
    }
    if (entradaForm.preco_unitario === '' || Number(entradaForm.preco_unitario) < 0) {
      setErro('Informe o preco pago');
      return;
    }

    setSalvando(true);
    try {
      await api.post('/entradas', {
        produto_id: produtoAlvo.id,
        fornecedor_id: entradaForm.fornecedor_id,
        quantidade: entradaForm.quantidade,
        preco_unitario: entradaForm.preco_unitario,
        tipo: entradaForm.tipo
      });
      depoisDeSalvar();
    } catch (err) {
      setErro(mensagemDeErro(err, 'Erro ao registrar entrada'));
    } finally {
      setSalvando(false);
    }
  }

  function abrirSaida(produto) {
    setProdutoAlvo(produto);
    setSaidaForm(SAIDA_VAZIA);
    setErro('');
    setModal('saida');
  }

  async function salvarSaida(evento) {
    evento.preventDefault();
    setErro('');

    if (!saidaForm.quantidade || Number(saidaForm.quantidade) <= 0) {
      setErro('Informe uma quantidade valida');
      return;
    }

    setSalvando(true);
    try {
      await api.post('/saidas', {
        produto_id: produtoAlvo.id,
        quantidade: saidaForm.quantidade,
        observacao: saidaForm.observacao || undefined
      });
      depoisDeSalvar();
    } catch (err) {
      setErro(mensagemDeErro(err, 'Erro ao registrar saida'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Layout>
      <div className="pagina-header">
        <div>
          <h1>Produtos</h1>
          <p>Itens controlados no estoque. Use as setas de cada linha para registrar o que chegou e o que saiu.</p>
        </div>
        <button className="btn btn-dourado" onClick={abrirNovoProduto}>
          <IconeMais tamanho={16} espessura={2.2} />
          Novo produto
        </button>
      </div>

      {erroLista && <ErroCarregamento mensagem={erroLista} onTentar={carregar} />}

      <div className="tabela-wrap">
        {carregando ? (
          <div className="estado-vazio">Carregando...</div>
        ) : produtos.length === 0 ? (
          <div className="estado-vazio">{erroLista ? 'Não foi possível carregar os produtos.' : 'Nenhum produto cadastrado.'}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th className="col-opcional">Categoria</th>
                <th>Estoque atual</th>
                <th className="col-opcional">Mínimo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => {
                const estoque = estoquePorProduto[produto.id];
                const atual = estoque ? estoque.estoque_atual : 0;
                const emAlerta = estoque ? Boolean(estoque.em_alerta) : produto.estoque_minimo > 0;

                return (
                  <tr key={produto.id}>
                    <td>{produto.nome}</td>
                    <td className="col-opcional">{produto.categoria}</td>
                    <td className={emAlerta ? 'qtd-baixa' : ''}>{atual} {produto.unidade}</td>
                    <td className="col-opcional">{produto.estoque_minimo} {produto.unidade}</td>
                    <td className="acoes">
                      <button className="btn-icone" onClick={() => abrirEntrada(produto)} title="Registrar entrada" aria-label="Registrar entrada">
                        <IconeEntrada tamanho={17} />
                      </button>
                      <button className="btn-icone" onClick={() => abrirSaida(produto)} title="Registrar saída" aria-label="Registrar saída">
                        <IconeSaida tamanho={17} />
                      </button>
                      <button className="btn-icone" onClick={() => abrirEdicaoProduto(produto)} title="Editar" aria-label="Editar">
                        <IconeEditar tamanho={15} />
                      </button>
                      <button className="btn-icone" onClick={() => desativarProduto(produto)} title="Desativar" aria-label="Desativar">
                        <IconeLixeira tamanho={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal === 'produto' && (
        <Modal titulo={editando.id ? 'Editar produto' : 'Novo produto'} onFechar={fechar}>
          <form onSubmit={salvarProduto}>
            {erro && <p className="form-erro">{erro}</p>}
            <div className="campo">
              <label>Nome</label>
              <input
                value={produtoForm.nome}
                onChange={(e) => setProdutoForm({ ...produtoForm, nome: e.target.value })}
                autoFocus
              />
            </div>
            <div className="campo">
              <label>Categoria</label>
              <select
                value={produtoForm.categoria_id}
                onChange={(e) => setProdutoForm({ ...produtoForm, categoria_id: e.target.value })}
                disabled={carregando}
              >
                <option value="">{carregando ? 'Carregando categorias...' : 'Selecione...'}</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                ))}
              </select>
              {!carregando && categorias.length === 0 && (
                <span className="campo-dica">
                  {erroLista ? 'As categorias não carregaram (veja o aviso na página).' : 'Nenhuma categoria cadastrada. Crie uma na página Categorias.'}
                </span>
              )}
            </div>
            <div className="campo-linha">
              <div className="campo">
                <label>Unidade</label>
                <select
                  value={produtoForm.unidade}
                  onChange={(e) => setProdutoForm({ ...produtoForm, unidade: e.target.value })}
                >
                  {UNIDADES.map((unidade) => (
                    <option key={unidade} value={unidade}>{unidade}</option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label>Estoque mínimo</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={produtoForm.estoque_minimo}
                  onChange={(e) => setProdutoForm({ ...produtoForm, estoque_minimo: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-acoes">
              <button type="button" className="btn btn-secundario" onClick={fechar}>Cancelar</button>
              <button type="submit" className="btn btn-dourado" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'entrada' && (
        <Modal titulo={`Registrar entrada — ${produtoAlvo.nome}`} onFechar={fechar}>
          <form onSubmit={salvarEntrada}>
            {erro && <p className="form-erro">{erro}</p>}
            <div className="campo">
              <label>Fornecedor</label>
              <select
                value={entradaForm.fornecedor_id}
                onChange={(e) => setEntradaForm({ ...entradaForm, fornecedor_id: e.target.value })}
              >
                <option value="">Selecione...</option>
                {fornecedores.map((fornecedor) => (
                  <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>
                ))}
              </select>
              {fornecedores.length === 0 && (
                <span className="campo-dica">Nenhum fornecedor cadastrado. Crie um na página Fornecedores.</span>
              )}
            </div>
            <div className="campo-linha">
              <div className="campo">
                <label>Quantidade ({produtoAlvo.unidade})</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={entradaForm.quantidade}
                  onChange={(e) => setEntradaForm({ ...entradaForm, quantidade: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="campo">
                <label>Preço unitário (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entradaForm.preco_unitario}
                  onChange={(e) => setEntradaForm({ ...entradaForm, preco_unitario: e.target.value })}
                />
              </div>
            </div>
            <div className="campo">
              <label>Tipo</label>
              <select
                value={entradaForm.tipo}
                onChange={(e) => setEntradaForm({ ...entradaForm, tipo: e.target.value })}
              >
                <option value="COMPRA_DIRETA">Compra direta</option>
                <option value="ENTREGA">Entrega</option>
              </select>
            </div>
            <div className="modal-acoes">
              <button type="button" className="btn btn-secundario" onClick={fechar}>Cancelar</button>
              <button type="submit" className="btn btn-dourado" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'saida' && (
        <Modal titulo={`Registrar saída — ${produtoAlvo.nome}`} onFechar={fechar}>
          <form onSubmit={salvarSaida}>
            {erro && <p className="form-erro">{erro}</p>}
            <div className="campo">
              <label>Quantidade ({produtoAlvo.unidade})</label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={saidaForm.quantidade}
                onChange={(e) => setSaidaForm({ ...saidaForm, quantidade: e.target.value })}
                autoFocus
              />
            </div>
            <div className="campo">
              <label>Observação (opcional)</label>
              <input
                value={saidaForm.observacao}
                onChange={(e) => setSaidaForm({ ...saidaForm, observacao: e.target.value })}
              />
            </div>
            <div className="modal-acoes">
              <button type="button" className="btn btn-secundario" onClick={fechar}>Cancelar</button>
              <button type="submit" className="btn btn-dourado" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}

export default Produtos;
