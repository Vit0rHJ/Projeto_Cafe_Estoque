import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function Dashboard() {
  const navigate = useNavigate();
  const [resumo, setResumo] = useState(null);
  const [itensAlerta, setItensAlerta] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [respResumo, respEstoque] = await Promise.all([
          api.get('/estoque/resumo'),
          api.get('/estoque')
        ]);
        setResumo(respResumo.data);
        setItensAlerta(respEstoque.data.filter((item) => item.em_alerta));
      } catch (err) {
        console.error(err);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  return (
    <Layout>
      <div className="pagina-header">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral do estoque</p>
        </div>
        <button className="btn btn-dourado" onClick={() => navigate('/produtos', { state: { abrirNovo: true } })}>
          + Produto
        </button>
      </div>

      <div className="grid-stats">
        <div className="card card-stat">
          <div className="card-label">Total de produtos</div>
          <div className="card-valor">{carregando ? '—' : resumo.total_produtos}</div>
        </div>
        <div className="card card-stat">
          <div className="card-label">Valor total em estoque</div>
          <div className="card-valor">{carregando ? '—' : formatoMoeda.format(resumo.valor_total_estoque)}</div>
        </div>
        <div className="card card-stat">
          <div className="card-label">Estoque baixo</div>
          <div className={`card-valor${!carregando && resumo.estoque_baixo > 0 ? ' alerta' : ''}`}>
            {carregando ? '—' : resumo.estoque_baixo}
          </div>
        </div>
        <div className="card card-stat">
          <div className="card-label">Categorias / Fornecedores</div>
          <div className="card-valor">
            {carregando ? '—' : `${resumo.total_categorias} / ${resumo.total_fornecedores}`}
          </div>
        </div>
      </div>

      <div className="card card-painel">
        <h2>Itens com estoque baixo</h2>
        {carregando ? (
          <div className="estado-vazio">Carregando...</div>
        ) : itensAlerta.length === 0 ? (
          <div className="estado-vazio">Nenhum item com estoque baixo no momento.</div>
        ) : (
          <div className="lista-alerta">
            {itensAlerta.map((item) => (
              <div className="lista-alerta-item" key={item.produto_id}>
                <div>
                  <div className="nome">{item.nome}</div>
                  <div className="categoria">{item.categoria}</div>
                </div>
                <span className="badge-alerta">
                  {item.estoque_atual} / {item.estoque_minimo} {item.unidade}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Dashboard;
