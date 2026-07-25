import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function RotaPrivada({ children }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default RotaPrivada;