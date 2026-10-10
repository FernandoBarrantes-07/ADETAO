function Modal({ titulo, onCerrar, ancho = false, children }) {
  return (
    <div className="inv-modal-fondo" onClick={onCerrar}>
      <div
        className={`inv-modal ${ancho ? 'inv-modal-ancho' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inv-modal-header">
          <h3>{titulo}</h3>
          <button
            type="button"
            className="inv-modal-cerrar"
            onClick={onCerrar}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}

export default Modal
