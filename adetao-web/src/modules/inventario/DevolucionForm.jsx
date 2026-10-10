import { useState } from 'react'

import Modal from './Modal'
import { OPCIONES_DEVOLUCION, formatearFecha } from './constantes'
import { registrarDevolucion } from './inventarioService'

function aValorLocal(fecha) {
  const d = new Date(fecha)
  d.setSeconds(0, 0)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function validar({ prestamo, opcion, fecha, observaciones }) {
  if (!opcion) return 'Seleccione qué pasó con el préstamo.'
  if (!fecha) return 'Indique la fecha.'

  const elegida = new Date(fecha)
  if (elegida < new Date(aValorLocal(prestamo.fecha_asignacion))) {
    return `La fecha no puede ser anterior al préstamo (${formatearFecha(prestamo.fecha_asignacion)}).`
  }
  if (elegida > new Date()) return 'La fecha no puede estar en el futuro.'

  if (opcion.requiereObservaciones && !observaciones.trim()) {
    return opcion.estado === 'perdido'
      ? 'Describa la pérdida en las observaciones.'
      : 'Describa el daño en las observaciones.'
  }
  return null
}

function DevolucionForm({ prestamo, onCerrar, onGuardado }) {
  const opciones = OPCIONES_DEVOLUCION[prestamo.estado] || []
  const [ahora] = useState(() => aValorLocal(new Date()))
  const [estado, setEstado] = useState(opciones[0]?.estado || '')
  const [fecha, setFecha] = useState(ahora)
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const opcion = opciones.find((o) => o.estado === estado)
  const esReparacion = prestamo.estado === 'dañado'

  const guardar = async (e) => {
    e.preventDefault()

    const mensaje = validar({ prestamo, opcion, fecha, observaciones })
    if (mensaje) {
      setError(mensaje)
      return
    }

    setError('')
    setGuardando(true)

    // Dentro del mismo minuto del préstamo, la fecha elegida (sin segundos)
    // quedaría antes que fecha_asignacion y la rechazaría el CHECK.
    const fechaFinal = new Date(Math.max(new Date(fecha), new Date(prestamo.fecha_asignacion)))

    try {
      await registrarDevolucion({ prestamo, opcion, fecha: fechaFinal, observaciones })
      onGuardado(`"${prestamo.articulo_nombre}" de ${prestamo.arquero_nombre}: ${opcion.registro.toLowerCase()}.`)
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={esReparacion ? 'Cerrar préstamo dañado' : 'Registrar devolución'} onCerrar={onCerrar}>
      <form className="inv-form" onSubmit={guardar} noValidate>
        <dl className="inv-resumen">
          <div>
            <dt>Arquero</dt>
            <dd>{prestamo.arquero_nombre}</dd>
          </div>
          <div>
            <dt>{prestamo.tipo_registro === 'pieza' ? 'Pieza' : 'Artículo'}</dt>
            <dd>
              {prestamo.articulo_codigo ? `${prestamo.articulo_codigo} · ` : ''}{prestamo.articulo_nombre}
            </dd>
          </div>
          <div>
            <dt>Cantidad</dt>
            <dd>{prestamo.cantidad}</dd>
          </div>
          <div>
            <dt>Prestado el</dt>
            <dd>{formatearFecha(prestamo.fecha_asignacion)}</dd>
          </div>
          {esReparacion && (
            <div>
              <dt>Entregado dañado el</dt>
              <dd>{formatearFecha(prestamo.fecha_devolucion)}</dd>
            </div>
          )}
        </dl>

        {opciones.length === 0 ? (
          <div className="inv-alerta advertencia">
            Este préstamo ya está cerrado ({prestamo.estado}); no admite más cambios.
          </div>
        ) : (
          <>
            <fieldset className="inv-opciones">
              <legend>¿Qué pasó? *</legend>
              {opciones.map((o) => (
                <label key={o.estado} className={estado === o.estado ? 'elegida' : ''}>
                  <input
                    type="radio"
                    name="estado-devolucion"
                    value={o.estado}
                    checked={estado === o.estado}
                    onChange={() => setEstado(o.estado)}
                  />
                  <span>
                    <strong>{o.etiqueta}</strong>
                    <small>{o.detalle}</small>
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="inv-form-grid">
              <label>
                {esReparacion ? 'Fecha *' : 'Fecha de devolución *'}
                <input
                  type="datetime-local"
                  value={fecha}
                  min={aValorLocal(prestamo.fecha_asignacion)}
                  max={ahora}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </label>

              <label className="inv-form-ancho">
                Observaciones {opcion?.requiereObservaciones && '*'}
                <textarea
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder={opcion?.estado === 'perdido'
                    ? 'Cómo y cuándo se perdió...'
                    : opcion?.estado === 'dañado' ? 'Qué daño tiene...' : 'Estado en que se recibe...'}
                />
                <small>Se agregan a las observaciones del préstamo con la fecha y el tipo de cierre.</small>
              </label>
            </div>
          </>
        )}

        {error && <div className="inv-alerta error">{error}</div>}

        <div className="inv-form-acciones">
          <button type="button" className="inv-btn" onClick={onCerrar}>
            Cancelar
          </button>
          {opciones.length > 0 && (
            <button
              type="submit"
              className={`inv-btn ${opcion?.estado === 'perdido' ? 'inv-btn-peligro-solido' : 'inv-btn-primario'}`}
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}

export default DevolucionForm
