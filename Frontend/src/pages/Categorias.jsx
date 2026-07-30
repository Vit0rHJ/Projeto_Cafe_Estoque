import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import api from '../services/api';

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(null);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const resp = await api.get('/categorias');
      setCategorias(resp.data);
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar categoria');
    } finally {
      setSalvando(false);
    }
  }

  async function desativar(categoria) {
    if (!window.confirm(`Desativar a categoria "${categoria.nome}"?`)) return;
    try {
      await api.delete(`/categorias/${categoria.id}`);
      carregar();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Layout>
      <div className="pagina-header">
        <div>
          <h1>Categorias</h1>
          <p>Organize os produtos por categoria</p>
        </div>
        <button className="btn btn-dourado" onClick={abrirNova}>+ Categoria</button>
      </div>

      <div className="tabela-wrap">
        {carregando ? (
          <div className="estado-vazio">Carregando...</div>
        ) : categorias.length === 0 ? (
          <div className="estado-vazio">Nenhuma categoria cadastrada.</div>
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
                    <button className="btn-icone" onClick={() => abrirEdicao(categoria)} title="Editar">✎</button>
                    <button className="btn-icone" onClick={() => desativar(categoria)} title="Desativar">✕</button>
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
