import { useEffect, useState } from 'react'

import Modal from '../inventario/Modal'
import { listarArquerosClub } from './clubesService'

function FichaClub({ club, esStaff, onCerrar }) {
  const [arqueros, setArqueros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true

    listarArquerosClub(club.id, { conIdentificacion: esStaff })
      .then((data) => {
        if (!vigente) return
        setArqueros(data)
        setError('')
      })
      .catch((err) => {
        if (vigente) setError(err.message)
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [club.id, esStaff])

  return (
    <Modal titulo={club.nombre} onCerrar={onCerrar} ancho>
      <div className="inv-form">
        <p>
          {club.ubicacion || 'Sin ubicación'}
          {club.descripcion ? `. ${club.descripcion}` : ''}
        </p>

        <h4 className="inv-subtitulo">
          Arqueros
          <small>{arqueros.length}</small>
        </h4>

        {cargando ? (
          <div className="inv-estado">Cargando arqueros...</div>
        ) : error ? (
          <div className="inv-alerta error">{error}</div>
        ) : arqueros.length === 0 ? (
          <p>Este club no tiene arqueros.</p>
        ) : (
          <div className="inv-tabla-contenedor">
            <table className="inv-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  {esStaff && <th>Identificación</th>}
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {arqueros.map((arquero) => (
                  <tr key={arquero.id}>
                    <td data-label="Nombre">{arquero.nombre}</td>
                    {esStaff && (
                      <td data-label="Identificación">{arquero.identificacion}</td>
                    )}
                    <td data-label="Estado">
                      <span className={`inv-badge ${arquero.estado}`}>
                        {arquero.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="inv-form-acciones">
          <button type="button" className="inv-btn" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default FichaClub
