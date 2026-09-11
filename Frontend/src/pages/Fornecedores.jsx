import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ErroCarregamento from '../components/ErroCarregamento';
import { IconeEditar, IconeLixeira, IconeMais } from '../components/Icones';
import api, { avisarEstoqueAtualizado, mensagemDeErro } from '../services/api';

const VAZIO = { nome: '', tipo: 'EMPRESA', telefone: '' };

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState('');
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErroLista('');
    try {
      const resp = await api.get('/fornecedores');
      setFornecedores(resp.data);
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
      avisarEstoqueAtualizado();
    } catch (err) {
      setErro(mensagemDeErro(err, 'Erro ao salvar fornecedor'));
    } finally {
      setSalvando(false);
    }
  }

  async function desativar(fornecedor) {
    if (!window.confirm(`Desativar o fornecedor "${fornecedor.nome}"?`)) return;
    try {
      await api.delete(`/fornecedores/${fornecedor.id}`);
      carregar();
      avisarEstoqueAtualizado();
    } catch (err) {
      setErroLista(mensagemDeErro(err, 'Erro ao desativar fornecedor'));
    }
  }

  return (
    <Layout>
      <div className="pagina-header">
        <div>
          <h1>Fornecedores</h1>
          <p>Empresas e mercados de onde vêm os produtos</p>
        </div>
        <button className="btn btn-dourado" onClick={abrirNovo}>
          <IconeMais tamanho={16} espessura={2.2} />
          Novo fornecedor
        </button>
      </div>

      {erroLista && <ErroCarregamento mensagem={erroLista} onTentar={carregar} />}

      <div className="tabela-wrap">
        {carregando ? (
          <div className="estado-vazio">Carregando...</div>
        ) : fornecedores.length === 0 ? (
          <div className="estado-vazio">{erroLista ? 'Não foi possível carregar os fornecedores.' : 'Nenhum fornecedor cadastrado.'}</div>
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
                    <button className="btn-icone" onClick={() => abrirEdicao(fornecedor)} title="Editar" aria-label="Editar"><IconeEditar tamanho={15} /></button>
                    <button className="btn-icone" onClick={() => desativar(fornecedor)} title="Desativar" aria-label="Desativar"><IconeLixeira tamanho={16} /></button>
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
