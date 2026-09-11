import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  IconeAlerta,
  IconeCafe,
  IconeCategoria,
  IconeContagem,
  IconeFornecedor,
  IconeGastos,
  IconeInicio,
  IconeMais,
  IconeProduto,
} from "./Icones";

const LINKS = [
  { to: "/", rotulo: "Início", Icone: IconeInicio, exato: true },
  { to: "/produtos", rotulo: "Produtos", Icone: IconeProduto },
  { to: "/categorias", rotulo: "Categorias", Icone: IconeCategoria },
  { to: "/fornecedores", rotulo: "Fornecedores", curto: "Fornec.", Icone: IconeFornecedor },
  { to: "/contagens", rotulo: "Contagens", Icone: IconeContagem },
  { to: "/gastos", rotulo: "Gastos", Icone: IconeGastos },
];

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const MAX_ITENS_REPOR = 6;

// Guardado fora do componente para sobreviver à troca de página: a barra
// lateral mostra os últimos números na hora e atualiza em segundo plano.
let ultimoResumo = null;

function useResumoEstoque() {
  const [dados, setDados] = useState(ultimoResumo);
  const [online, setOnline] = useState(ultimoResumo ? true : null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const [respResumo, respEstoque] = await Promise.all([
          api.get("/estoque/resumo"),
          api.get("/estoque"),
        ]);
        ultimoResumo = { resumo: respResumo.data, estoque: respEstoque.data };
        if (ativo) {
          setDados(ultimoResumo);
          setOnline(true);
        }
      } catch {
        if (ativo) setOnline(false);
      }
    }

    carregar();
    window.addEventListener("estoque-atualizado", carregar);
    return () => {
      ativo = false;
      window.removeEventListener("estoque-atualizado", carregar);
    };
  }, []);

  return { dados, online };
}

// % de produtos acima do estoque mínimo em cada categoria.
function saudePorCategoria(estoque) {
  const grupos = {};
  estoque.forEach((item) => {
    const grupo = grupos[item.categoria] || (grupos[item.categoria] = { total: 0, ok: 0 });
    grupo.total += 1;
    if (!item.em_alerta) grupo.ok += 1;
  });
  return Object.entries(grupos)
    .map(([categoria, { total, ok }]) => ({ categoria, pct: Math.round((ok / total) * 100) }))
    .sort((a, b) => b.pct - a.pct || a.categoria.localeCompare(b.categoria));
}

function Perfil() {
  const navigate = useNavigate();
  const { dados, online } = useResumoEstoque();
  const resumo = dados?.resumo;
  const estoque = dados?.estoque || [];
  const emAlerta = estoque.filter((item) => item.em_alerta);
  const saude = saudePorCategoria(estoque);

  const statusTexto = online === false ? "Servidor fora do ar" : online ? "Servidor conectado" : "Conectando...";

  return (
    <aside className="perfil">
      <div className="perfil-topo">
        <div className="perfil-avatar">
          <IconeCafe tamanho={44} espessura={1.4} />
          <span
            className={`perfil-status${online === true ? " online" : online === false ? " offline" : ""}`}
            title={statusTexto}
            aria-label={statusTexto}
          />
        </div>
        <div className="perfil-nome">Café Estoque</div>
        <div className="perfil-cargo">Controle de estoque</div>
      </div>

      <div className="perfil-bloco">
        <div className="info-linha">
          <span className="rotulo-amarelo">Produtos:</span>
          <span className="info-valor">{resumo ? resumo.total_produtos : "—"}</span>
        </div>
        <div className="info-linha">
          <span className="rotulo-amarelo">Em alerta:</span>
          <span className={`info-valor${!resumo ? "" : resumo.estoque_baixo > 0 ? " ruim" : " bom"}`}>
            {!resumo ? "—" : resumo.estoque_baixo > 0 ? resumo.estoque_baixo : "Nenhum"}
          </span>
        </div>
        <div className="info-linha">
          <span className="rotulo-amarelo">Categorias:</span>
          <span className="info-valor">{resumo ? resumo.total_categorias : "—"}</span>
        </div>
        <div className="info-linha">
          <span className="rotulo-amarelo">Fornecedores:</span>
          <span className="info-valor">{resumo ? resumo.total_fornecedores : "—"}</span>
        </div>
        <div className="info-linha">
          <span className="rotulo-amarelo">Valor:</span>
          <span className="info-valor">{resumo ? formatoMoeda.format(resumo.valor_total_estoque) : "—"}</span>
        </div>
      </div>

      <div className="perfil-bloco">
        <div className="perfil-titulo">Estoque em dia</div>
        <div className="perfil-dica">% dos itens acima do mínimo, por categoria</div>
        {saude.length === 0 ? (
          <div className="perfil-vazio">{dados ? "Nenhum produto cadastrado." : "—"}</div>
        ) : (
          saude.map(({ categoria, pct }) => (
            <div className="barra-item" key={categoria}>
              <div className="barra-rotulos">
                <span>{categoria}</span>
                <span>{pct}%</span>
              </div>
              <div className="barra" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={categoria}>
                <div className="barra-preenchida" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="perfil-bloco">
        <div className="perfil-titulo" style={{ marginBottom: 14 }}>Repor logo</div>
        {emAlerta.length === 0 ? (
          <div className="perfil-vazio">{dados ? "Nenhum item abaixo do mínimo." : "—"}</div>
        ) : (
          <ul className="lista-icone">
            {emAlerta.slice(0, MAX_ITENS_REPOR).map((item) => (
              <li key={item.produto_id}>
                <IconeAlerta tamanho={15} />
                {item.nome}
              </li>
            ))}
            {emAlerta.length > MAX_ITENS_REPOR && (
              <li>+ {emAlerta.length - MAX_ITENS_REPOR} outros</li>
            )}
          </ul>
        )}
      </div>

      <div className="perfil-rodape">
        <button
          className="btn btn-dourado"
          onClick={() => navigate("/produtos", { state: { abrirNovo: true } })}
        >
          <IconeMais tamanho={16} espessura={2.2} />
          Novo produto
        </button>
      </div>
    </aside>
  );
}

function Layout({ children }) {
  return (
    <div className="layout">
      <Perfil />

      <main className="conteudo">
        <div className="conteudo-interno">{children}</div>
      </main>

      <nav className="trilho" aria-label="Navegação principal">
        <NavLink to="/" className="trilho-marca" aria-label="Café Estoque — início">
          <IconeCafe tamanho={22} espessura={1.8} />
        </NavLink>
        {LINKS.map(({ to, rotulo, curto, Icone, exato }) => (
          <NavLink
            key={to}
            to={to}
            end={exato}
            data-rotulo={rotulo}
            aria-label={rotulo}
            className={({ isActive }) => `trilho-link${isActive ? " ativo" : ""}`}
          >
            <Icone tamanho={20} />
            <span className="trilho-rotulo">{curto || rotulo}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default Layout;
