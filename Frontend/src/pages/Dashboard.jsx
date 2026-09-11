import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import ErroCarregamento from '../components/ErroCarregamento';
import {
  IconeAlerta,
  IconeCategoria,
  IconeContagem,
  IconeFornecedor,
  IconeGastos,
  IconeProduto,
  IconeSeta,
  IconeValor
} from '../components/Icones';
import api, { mensagemDeErro } from '../services/api';

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const MODULOS = [
  { to: '/produtos', titulo: 'Produtos', descricao: 'Cadastro, entradas e saídas', Icone: IconeProduto },
  { to: '/categorias', titulo: 'Categorias', descricao: 'Organização dos itens', Icone: IconeCategoria },
  { to: '/fornecedores', titulo: 'Fornecedores', descricao: 'Empresas e mercados', Icone: IconeFornecedor },
  { to: '/contagens', titulo: 'Contagens', descricao: 'Inventário e ajustes', Icone: IconeContagem },
  { to: '/gastos', titulo: 'Gastos', descricao: 'Relatório por período', Icone: IconeGastos }
];

function IlustracaoCafe() {
  return (
    <svg viewBox="0 0 280 240" role="img" aria-label="Xícara de café">
      <circle cx="140" cy="122" r="104" fill="var(--amarelo-suave)" />
      <g fill="none" stroke="var(--texto)" strokeWidth="5" strokeLinecap="round" opacity="0.18">
        <path d="M108 70c-12-14 12-22 0-40" />
        <path d="M140 66c-12-14 12-22 0-40" />
        <path d="M172 70c-12-14 12-22 0-40" />
      </g>
      <ellipse cx="140" cy="206" rx="104" ry="14" fill="var(--borda-forte)" />
      <path d="M212 108h12a24 24 0 0 1 0 48h-16" fill="none" stroke="var(--amarelo)" strokeWidth="12" strokeLinecap="round" />
      <path d="M66 92h148v44c0 34-26 62-58 62h-32c-32 0-58-28-58-62z" fill="var(--amarelo)" />
      <rect x="66" y="120" width="148" height="10" fill="#ffffff" opacity="0.35" />
      <ellipse cx="140" cy="92" rx="74" ry="12" fill="#6b4226" />
    </svg>
  );
}

function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [itensAlerta, setItensAlerta] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const [respResumo, respEstoque] = await Promise.all([
        api.get('/estoque/resumo'),
        api.get('/estoque')
      ]);
      setResumo(respResumo.data);
      setItensAlerta(respEstoque.data.filter((item) => item.em_alerta));
    } catch (err) {
      console.error(err);
      setErro(mensagemDeErro(err));
    } finally {
      setCarregando(false);
    }
  }

  const pronto = !carregando && resumo;
  const qtdAlerta = resumo ? resumo.estoque_baixo : 0;

  return (
    <Layout>
      {erro && <ErroCarregamento mensagem={erro} onTentar={carregar} />}

      <section className="hero">
        <span className="deco deco-circulo" />
        <span className="deco deco-bola" />
        <span className="deco deco-pontos" />
        <svg className="deco deco-triangulo" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M9 2l7 13H2z" />
        </svg>

        <div className="hero-texto">
          <h1>
            Seu estoque,<br />
            <span className="destaque">sempre em dia.</span>
          </h1>
          <p>
            Registre o que chega e o que sai, faça a contagem de inventário e acompanhe os
            gastos do café em um só lugar.
          </p>
          <Link to="/produtos" className="btn btn-dourado">
            Registrar entrada
            <IconeSeta tamanho={16} espessura={2.2} />
          </Link>
        </div>

        <div className="hero-ilustracao">
          <IlustracaoCafe />
        </div>
      </section>

      <section className="secao">
        <div className="pagina-header">
          <div>
            <h2>Resumo do estoque</h2>
            <p>Os números mais importantes do momento, calculados a partir de todas as entradas e saídas registradas.</p>
          </div>
        </div>

        <div className="grid-stats">
          <div className="card card-stat">
            <span className="card-icone"><IconeProduto tamanho={40} espessura={1.3} /></span>
            <div className="card-valor">{pronto ? resumo.total_produtos : '—'}</div>
            <div className="card-label">Produtos cadastrados</div>
          </div>
          <div className="card card-stat">
            <span className="card-icone"><IconeValor tamanho={40} espessura={1.3} /></span>
            <div className="card-valor">{pronto ? formatoMoeda.format(resumo.valor_total_estoque) : '—'}</div>
            <div className="card-label">Valor em estoque</div>
          </div>
          <div className="card card-stat">
            <span className="card-icone"><IconeAlerta tamanho={40} espessura={1.3} /></span>
            <div className={`card-valor${pronto && qtdAlerta > 0 ? ' alerta' : ''}`}>{pronto ? qtdAlerta : '—'}</div>
            <div className="card-label">Com estoque baixo</div>
          </div>
          <div className="card card-stat">
            <span className="card-icone"><IconeFornecedor tamanho={40} espessura={1.3} /></span>
            <div className="card-valor">
              {pronto ? `${resumo.total_categorias} / ${resumo.total_fornecedores}` : '—'}
            </div>
            <div className="card-label">Categorias / Fornecedores</div>
          </div>
        </div>
      </section>

      <section className="secao">
        <div className="pagina-header">
          <div>
            <h2>Módulos do sistema</h2>
            <p>Tudo o que dá para fazer por aqui. Clique em um módulo para abrir.</p>
          </div>
        </div>

        <div className="grid-servicos">
          {MODULOS.map(({ to, titulo, descricao, Icone }) => (
            <Link to={to} className="card-servico" key={to}>
              <span className="servico-icone"><Icone tamanho={52} espessura={1.2} /></span>
              <h3>{titulo}</h3>
              <p>{descricao}</p>
            </Link>
          ))}

          <div className="card-servico">
            <h3>Estoque baixo</h3>
            <p>
              {!pronto
                ? 'Verificando os itens abaixo do estoque mínimo...'
                : qtdAlerta === 0
                  ? 'Nenhum item abaixo do mínimo. Está tudo abastecido.'
                  : `${qtdAlerta} ${qtdAlerta === 1 ? 'item está' : 'itens estão'} abaixo do estoque mínimo e ${qtdAlerta === 1 ? 'precisa' : 'precisam'} de reposição.`}
            </p>
            <a href="#itens-alerta" className="link-amarelo">
              Ver itens <IconeSeta tamanho={14} espessura={2.4} />
            </a>
          </div>
        </div>
      </section>

      <section className="card card-painel" id="itens-alerta">
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
      </section>
    </Layout>
  );
}

export default Dashboard;
