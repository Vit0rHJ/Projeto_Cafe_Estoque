import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// No navegador, a API é procurada no mesmo endereço de onde a página veio
// (localhost no PC, ou o IP do PC se aberto de outro aparelho). Assim o site
// continua funcionando quando o IP do PC muda de rede.
// No app do celular a página é servida pelo próprio app, então não dá para
// deduzir o endereço do PC: aí vale o IP fixo de VITE_API_URL (ver .env).
function urlDaApi() {
  if (Capacitor.isNativePlatform()) {
    return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }
  return `${window.location.protocol}//${window.location.hostname}:3001/api`;
}

const api = axios.create({
  baseURL: urlDaApi(),
  // Sem timeout, uma API fora do ar deixa a tela em "Carregando..." para sempre.
  timeout: 10000
});

// Mensagem amigável para mostrar na tela a partir de um erro do axios.
export function mensagemDeErro(err, padrao = 'Algo deu errado. Tente de novo.') {
  if (err?.response?.data?.erro) return err.response.data.erro;
  if (!err?.response) {
    return 'Não foi possível conectar ao servidor. Confira se o backend está rodando e, no celular, se ele está na mesma rede Wi-Fi do PC.';
  }
  return padrao;
}

// Avisa o resto da tela (a barra lateral, por exemplo) que o estoque mudou,
// para ela recarregar os números sem precisar trocar de página.
export function avisarEstoqueAtualizado() {
  window.dispatchEvent(new Event('estoque-atualizado'));
}

export default api;
