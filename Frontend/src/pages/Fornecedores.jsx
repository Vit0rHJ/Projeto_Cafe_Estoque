import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import api from '../services/api';

const VAZIO = { nome: '', tipo: 'EMPRESA', telefone: '' };

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const resp = await api.get('/fornecedores');
      setFornecedores(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirNovo() {
    setEditando({});
    setForm(VAZIO);
    setErro('');
  }

  function abrirEdicao(fornecedor) {
    setEditando(fornecedor);
    setForm({ nome: fornecedor.nome, tipo: fornecedor.tipo, telefone: fornecedor.telefone || '' });
    setErro('');
  }

  function fechar() {
    setEditando(null);
  }

  async function salvar(evento) {
    evento.preventDefault();
    setErro('');

    if (!form.nome.trim()) {
      setErro('Informe o nome do fornecedor');
      return;
    }

    setSalvando(true);
    try {
      if (editando.id) {
        await api.put(`/fornecedores/${editando.id}`, form);
      } else {
        await api.post('/fornecedores', form);
      }
      fechar();
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar fornecedor');
    } finally {
      setSalvando(false);
    }
  }

  async function desativar(fornecedor) {
    if (!window.confirm(`Desativar o fornecedor "${fornecedor.nome}"?`)) return;
    try {
      await api.delete(`/fornecedores/${fornecedor.id}`);
      carregar();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Layout>
      <div className="pagina-header">
        <div>
          <h1>Fornecedores</h1>
          <p>Empresas e mercados de onde vêm os produtos</p>
        </div>
        <button className="btn btn-dourado" onClick={abrirNovo}>+ Fornecedor</button>
      </div>

      <div className="tabela-wrap">
        {carregando ? (
          <div className="estado-vazio">Carregando...</div>
        ) : fornecedores.length === 0 ? (
          <div className="estado-vazio">Nenhum fornecedor cadastrado.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Telefone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((fornecedor) => (
                <tr key={fornecedor.id}>
                  <td>{fornecedor.nome}</td>
                  <td>{fornecedor.tipo === 'EMPRESA' ? 'Empresa' : 'Mercado'}</td>
                  <td>{fornecedor.telefone || '—'}</td>
                  <td className="acoes">
                    <button className="btn-icone" onClick={() => abrirEdicao(fornecedor)} title="Editar">✎</button>
                    <button className="btn-icone" onClick={() => desativar(fornecedor)} title="Desativar">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editando && (
        <Modal titulo={editando.id ? 'Editar fornecedor' : 'Novo fornecedor'} onFechar={fechar}>
          <form onSubmit={salvar}>
            {erro && <p className="form-erro">{erro}</p>}
            <div className="campo">
              <label>Nome</label>
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus />
            </div>
            <div className="campo">
              <label>Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="EMPRESA">Empresa</option>
                <option value="MERCADO">Mercado</option>
              </select>
            </div>
            <div className="campo">
              <label>Telefone</label>
              <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
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

export default Fornecedores;
