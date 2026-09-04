import { NavLink } from "react-router-dom";

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <rect x="1" y="1" width="7" height="7" rx="1.5" />
      <rect x="10" y="1" width="7" height="7" rx="1.5" />
      <rect x="1" y="10" width="7" height="7" rx="1.5" />
      <rect x="10" y="10" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconSquare() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="2" y="2" width="14" height="14" rx="2.5" />
    </svg>
  );
}

function IconCircle() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="9" cy="9" r="7" />
    </svg>
  );
}

function IconDiamond() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect
        x="3.5"
        y="3.5"
        width="11"
        height="11"
        rx="2"
        transform="rotate(45 9 9)"
      />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3" y="2.5" width="12" height="14" rx="1.5" />
      <path
        d="M6.5 2.5h5a1 1 0 0 1 1 1v1h-7v-1a1 1 0 0 1 1-1z"
        fill="currentColor"
        stroke="none"
      />
      <path d="M6 9.5l2 2 4-4.5" />
    </svg>
  );
}

function IconCoin() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="9" cy="9" r="7" />
      <path d="M9 5.5v7M11.2 7.3c0-.9-1-1.6-2.2-1.6s-2.2.7-2.2 1.6.98 1.4 2.2 1.6c1.22.2 2.2.7 2.2 1.6s-1 1.6-2.2 1.6-2.2-.7-2.2-1.6" />
    </svg>
  );
}

const LINKS = [
  { to: "/", label: "Dashboard", Icone: IconGrid, exato: true },
  { to: "/produtos", label: "Produtos", Icone: IconSquare },
  { to: "/categorias", label: "Categorias", Icone: IconCircle },
  { to: "/fornecedores", label: "Fornecedores", Icone: IconDiamond },
  { to: "/contagens", label: "Contagens", Icone: IconClipboard },
  { to: "/gastos", label: "Gastos", Icone: IconCoin },
];

function Layout({ children }) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-marca">
          <span className="logo">Café_Estoque</span>
          <span className="subtitulo">Gestão interna</span>
        </div>

        <nav className="sidebar-nav">
          {LINKS.map(({ to, label, Icone, exato }) => (
            <NavLink
              key={to}
              to={to}
              end={exato}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " ativo" : ""}`
              }
            >
              <Icone />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-rodape">Uso interno</div>
      </aside>

      <main className="conteudo">{children}</main>
    </div>
  );
}

export default Layout;
