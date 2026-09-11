import { IconeAlerta } from './Icones';

// Aviso mostrado quando uma tela não consegue buscar os dados da API,
// no lugar de deixar o "Carregando..." parado para sempre.
function ErroCarregamento({ mensagem, onTentar }) {
  return (
    <div className="aviso-erro" role="alert">
      <IconeAlerta tamanho={22} />
      <p>{mensagem}</p>
      {onTentar && (
        <button className="btn btn-secundario" onClick={onTentar}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export default ErroCarregamento;
