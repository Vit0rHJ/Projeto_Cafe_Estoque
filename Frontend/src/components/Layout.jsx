import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <header className="topo">
        <span className="logo">Cafe_Estoque</span>
        <nav className="menu">
          <Link to="/produtos">Produtos</Link>
          <Link to="/categorias">Categorias</Link>
          <Link to="/fornecedores">Fornecedores</Link>
        </nav>
        <div className="usuario">
          <span>{usuario?.nome}</span>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <main className="conteudo">
        {children}
      </main>
    </div>
  );
}

export default Layout;