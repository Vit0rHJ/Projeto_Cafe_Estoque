import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const noApp = Capacitor.isNativePlatform();
const CHAVE_SERVIDOR = 'cafe-estoque:servidor';

function servidorSalvo() {
  try {
    return localStorage.getItem(CHAVE_SERVIDOR);
  } catch {
    return null;
  }
}

// No navegador, a API é procurada no mesmo endereço de onde a página veio
// (localhost no PC, ou o IP do PC se aberto de outro aparelho). Assim o site
// continua funcionando quando o IP do PC muda de rede.
// No app do celular a página é servida pelo próprio app, então não dá para
// deduzir o endereço do PC: vale o endereço que a pessoa salvou no app (ver
// trocarServidor) ou, se nunca salvou, o IP gravado no build (VITE_API_URL).
function urlDaApi() {
  if (noApp) {
    return servidorSalvo() || import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
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
    return noApp
      ? `Não foi possível conectar ao servidor (${api.defaults.baseURL}). Confira se o backend está rodando no PC, se o celular está na mesma rede Wi-Fi e se o IP do PC continua o mesmo.`
      : 'Não foi possível conectar ao servidor. Confira se o backend está rodando.';
  }
  return padrao;
}

// Só no app: o IP do PC muda quando ele troca de rede, então o app deixa
// corrigir o endereço na hora, sem precisar gerar outro APK.
export const podeTrocarServidor = noApp;

export function trocarServidor() {
  const atual = api.defaults.baseURL.replace(/^https?:\/\//, '').replace(/\/api\/?$/, '').replace(/:3001$/, '');
  const digitado = window.prompt('IP do PC onde o backend está rodando (ex: 192.168.0.10):', atual);
  if (!digitado || !digitado.trim()) return false;

  const endereco = digitado.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const url = `http://${endereco}${endereco.includes(':') ? '' : ':3001'}/api`;
  api.defaults.baseURL = url;
  try {
    localStorage.setItem(CHAVE_SERVIDOR, url);
  } catch {
    // sem armazenamento: vale só até fechar o app
  }
  avisarEstoqueAtualizado();
  return true;
}

// Avisa o resto da tela (a barra lateral, por exemplo) que o estoque mudou,
// para ela recarregar os números sem precisar trocar de página.
export function avisarEstoqueAtualizado() {
  window.dispatchEvent(new Event('estoque-atualizado'));
}

export default api;
