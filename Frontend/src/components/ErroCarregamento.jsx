import { podeTrocarServidor, trocarServidor } from '../services/api';
import { IconeAlerta } from './Icones';

// Aviso mostrado quando uma tela não consegue buscar os dados da API,
// no lugar de deixar o "Carregando..." parado para sempre. No app do celular
// também oferece corrigir o IP do PC, que muda quando ele troca de rede.
function ErroCarregamento({ mensagem, onTentar }) {
  function corrigirServidor() {
    if (trocarServidor() && onTentar) onTentar();
  }

  return (
    <div className="aviso-erro" role="alert">
      <IconeAlerta tamanho={22} />
      <p>{mensagem}</p>
      <div className="aviso-erro-acoes">
        {podeTrocarServidor && (
          <button className="btn btn-secundario" onClick={corrigirServidor}>
            Trocar IP
          </button>
        )}
        {onTentar && (
          <button className="btn btn-secundario" onClick={onTentar}>
            Tentar de novo
          </button>
        )}
      </div>
    </div>
  );
}

export default ErroCarregamento;
