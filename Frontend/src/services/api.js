import axios from 'axios';

// No navegador do PC cai em localhost; no app do celular precisa do IP do PC
// na rede local (definido em VITE_API_URL, ver .env).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
});

export default api;
