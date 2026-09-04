import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Categorias from "./pages/Categorias";
import Fornecedores from "./pages/Fornecedores";
import Contagens from "./pages/Contagens";
import Gastos from "./pages/Gastos";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/produtos" element={<Produtos />} />
      <Route path="/categorias" element={<Categorias />} />
      <Route path="/fornecedores" element={<Fornecedores />} />
      <Route path="/contagens" element={<Contagens />} />
      <Route path="/gastos" element={<Gastos />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
