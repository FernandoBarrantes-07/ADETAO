import { useEffect, useState } from 'react'

import HistorialTabla from './HistorialTabla'
import { ESTADOS_PENDIENTES } from './constantes'
import { listarHistorial } from './inventarioService'

import './Inventario.css'

function MisPrestamos({ profile }) {
  const vinculado = profile?.arquero_id != null
  const [filas, setFilas] = useState(null)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!vinculado) return undefined
    let vigente = true

    listarHistorial()
      .then((data) => {
        if (!vigente) return
        setFilas(data)
        setError('')
      })
      .catch((err) => {
        if (vigente) setError(err.message)
      })

    return () => {
      vigente = false
    }
  }, [vinculado, version])

  const actuales = (filas || []).filter((f) => ESTADOS_PENDIENTES.includes(f.estado))
  const anteriores = (filas || []).filter((f) => !ESTADOS_PENDIENTES.includes(f.estado))
  const unidades = actuales.reduce((total, f) => total + f.cantidad, 0)

  return (
    <div className="inventario">
      <div className="welcome-section">
        <h2>Mis préstamos</h2>
        <p>Lo que tiene ahora y lo que ya devolvió.</p>
      </div>

      {!vinculado ? (
        <div className="empty-state">
          <span>▣</span>
          <p>Su usuario no está vinculado a un arquero.</p>
        </div>
      ) : error ? (
        <div className="inv-alerta error">
          {error}{' '}
          <button className="inv-btn" onClick={() => setVersion((v) => v + 1)}>
            Reintentar
          </button>
        </div>
      ) : !filas ? (
        <div className="inv-estado">Cargando préstamos...</div>
      ) : filas.length === 0 ? (
        <div className="empty-state">
          <span>▣</span>
          <p>No tiene préstamos registrados.</p>
        </div>
      ) : (
        <div className="dashboard-card">
          <h4 className="inv-subtitulo">
            Tiene ahora
            <small>
              {actuales.length === 0
                ? 'Nada pendiente de devolución'
                : `${unidades} ${unidades === 1 ? 'unidad' : 'unidades'} en ${actuales.length} ${actuales.length === 1 ? 'préstamo' : 'préstamos'}`}
            </small>
          </h4>
          {actuales.length > 0 && (
            <HistorialTabla
              filas={actuales}
              mostrarArquero={false}
              mostrarObservaciones
              mostrarRegistradoPor={false}
            />
          )}

          <h4 className="inv-subtitulo">
            Préstamos anteriores
            <small>
              {anteriores.length === 0
                ? 'Sin préstamos cerrados'
                : `${anteriores.length} ${anteriores.length === 1 ? 'préstamo cerrado' : 'préstamos cerrados'}`}
            </small>
          </h4>
          {anteriores.length > 0 && (
            <HistorialTabla
              filas={anteriores}
              mostrarArquero={false}
              mostrarObservaciones
              mostrarRegistradoPor={false}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default MisPrestamos
