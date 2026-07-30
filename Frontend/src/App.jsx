import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Categorias from "./pages/Categorias";
import Fornecedores from "./pages/Fornecedores";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/produtos" element={<Produtos />} />
      <Route path="/categorias" element={<Categorias />} />
      <Route path="/fornecedores" element={<Fornecedores />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
