import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ErroCarregamento from '../components/ErroCarregamento';
import { IconeEditar, IconeLixeira, IconeMais } from '../components/Icones';
import api, { avisarEstoqueAtualizado, mensagemDeErro } from '../services/api';

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState('');
  const [editando, setEditando] = useState(null);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErroLista('');
    try {
      const resp = await api.get('/categorias');
      setCategorias(resp.data);
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

  function abrirNova() {
    setEditando({});
    setNome('');
    setErro('');
  }

  function abrirEdicao(categoria) {
    setEditando(categoria);
    setNome(categoria.nome);
    setErro('');
  }

  function fechar() {
    setEditando(null);
  }

  async function salvar(evento) {
    evento.preventDefault();
    setErro('');

    if (!nome.trim()) {
      setErro('Informe o nome da categoria');
      return;
    }

    setSalvando(true);
    try {
      if (editando.id) {
        await api.put(`/categorias/${editando.id}`, { nome });
      } else {
        await api.post('/categorias', { nome });
      }
      fechar();
      carregar();
      avisarEstoqueAtualizado();
    } catch (err) {
      setErro(mensagemDeErro(err, 'Erro ao salvar categoria'));
    } finally {
      setSalvando(false);
    }
  }

  async function desativar(categoria) {
    if (!window.confirm(`Desativar a categoria "${categoria.nome}"?`)) return;
    try {
      await api.delete(`/categorias/${categoria.id}`);
      carregar();
      avisarEstoqueAtualizado();
    } catch (err) {
      setErroLista(mensagemDeErro(err, 'Erro ao desativar categoria'));
    }
  }

  return (
    <Layout>
      <div className="pagina-header">
        <div>
          <h1>Categorias</h1>
          <p>Organize os produtos por categoria</p>
        </div>
        <button className="btn btn-dourado" onClick={abrirNova}>
          <IconeMais tamanho={16} espessura={2.2} />
          Nova categoria
        </button>
      </div>

      {erroLista && <ErroCarregamento mensagem={erroLista} onTentar={carregar} />}

      <div className="tabela-wrap">
        {carregando ? (
          <div className="estado-vazio">Carregando...</div>
        ) : categorias.length === 0 ? (
          <div className="estado-vazio">{erroLista ? 'Não foi possível carregar as categorias.' : 'Nenhuma categoria cadastrada.'}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria) => (
                <tr key={categoria.id}>
                  <td>{categoria.nome}</td>
                  <td className="acoes">
                    <button className="btn-icone" onClick={() => abrirEdicao(categoria)} title="Editar" aria-label="Editar"><IconeEditar tamanho={15} /></button>
                    <button className="btn-icone" onClick={() => desativar(categoria)} title="Desativar" aria-label="Desativar"><IconeLixeira tamanho={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editando && (
        <Modal titulo={editando.id ? 'Editar categoria' : 'Nova categoria'} onFechar={fechar}>
          <form onSubmit={salvar}>
            {erro && <p className="form-erro">{erro}</p>}
            <div className="campo">
              <label>Nome</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
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
    </Layout>
  );
}

export default Categorias;
