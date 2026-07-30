function Modal({ titulo, onFechar, children }) {
  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
        <h2>{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

export default Modal;
