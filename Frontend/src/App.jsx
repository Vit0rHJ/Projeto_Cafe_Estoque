import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import RotaPrivada from "./components/RotaPrivada";
import Layout from "./components/Layout";
import "./App.css";
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/produtos"
        element={
          <RotaPrivada>
            <Layout>
              <h1>Produtos (em breve)</h1>
            </Layout>
          </RotaPrivada>
        }
      />

      <Route
        path="/categorias"
        element={
          <RotaPrivada>
            <Layout>
              <h1>Categorias (em breve)</h1>
            </Layout>
          </RotaPrivada>
        }
      />

      <Route
        path="/fornecedores"
        element={
          <RotaPrivada>
            <Layout>
              <h1>Fornecedores (em breve)</h1>
            </Layout>
          </RotaPrivada>
        }
      />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
