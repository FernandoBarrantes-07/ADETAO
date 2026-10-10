import { useEffect, useMemo, useState } from 'react'

import Modal from './Modal'
import SelectorArquero from './SelectorArquero'
import { crearPrestamo, listarArqueros, listarArticulos } from './inventarioService'

// asignacion_validar_alta() solo acepta artículos en estado disponible con stock.
function sePuedePrestar(articulo) {
  return articulo.estado === 'disponible' && articulo.cantidad_disponible > 0
}

function PrestamoForm({ onCerrar, onGuardado }) {
  const [datos, setDatos] = useState(null)
  const [errorCarga, setErrorCarga] = useState('')
  const [arquero, setArquero] = useState(null)
  const [tipoRegistro, setTipoRegistro] = useState('inventario')
  const [articuloId, setArticuloId] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let vigente = true

    Promise.all([
      listarArqueros({ soloActivos: true }),
      listarArticulos('inventario'),
      listarArticulos('piezas'),
    ])
      .then(([arqueros, inventario, piezas]) => {
        if (vigente) setDatos({ arqueros, inventario, pieza: piezas })
      })
      .catch((err) => {
        if (vigente) setErrorCarga(err.message)
      })

    return () => {
      vigente = false
    }
  }, [])

  const opciones = useMemo(
    () => (datos ? datos[tipoRegistro].filter(sePuedePrestar) : []),
    [datos, tipoRegistro]
  )

  const articulo = opciones.find((a) => String(a.id) === articuloId) || null

  const cambiarTipo = (tipo) => {
    setTipoRegistro(tipo)
    setArticuloId('')
    setCantidad('1')
  }

  const validar = () => {
    if (!arquero) return 'Seleccione el arquero.'
    if (!articulo) return `Seleccione ${tipoRegistro === 'pieza' ? 'la pieza' : 'el artículo'}.`

    const n = Number(cantidad)
    if (cantidad === '' || !Number.isInteger(n) || n < 1) {
      return 'La cantidad debe ser un número entero mayor que 0.'
    }
    if (n > articulo.cantidad_disponible) {
      return `Solo hay ${articulo.cantidad_disponible} ${articulo.cantidad_disponible === 1 ? 'unidad disponible' : 'unidades disponibles'} de "${articulo.nombre}".`
    }
    return null
  }

  const guardar = async (e) => {
    e.preventDefault()

    const mensaje = validar()
    if (mensaje) {
      setError(mensaje)
      return
    }

    setError('')
    setGuardando(true)

    try {
      await crearPrestamo({
        tipoRegistro,
        articuloId: articulo.id,
        arqueroId: arquero.id,
        cantidad,
        observaciones,
      })
      onGuardado(`Préstamo registrado: ${cantidad} × "${articulo.nombre}" a ${arquero.nombre}.`)
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Nuevo préstamo" onCerrar={onCerrar}>
      {errorCarga ? (
        <div className="inv-alerta error">{errorCarga}</div>
      ) : !datos ? (
        <div className="inv-estado">Cargando arqueros y artículos...</div>
      ) : (
        <form className="inv-form" onSubmit={guardar} noValidate>
          <div className="inv-form-grupo">
            <span className="inv-form-etiqueta">Arquero * <small>(solo activos)</small></span>
            <SelectorArquero
              arqueros={datos.arqueros}
              seleccionado={arquero}
              onSeleccionar={setArquero}
              autoFocus
            />
          </div>

          <div className="inv-form-grupo">
            <span className="inv-form-etiqueta">Qué se presta *</span>
            <div className="inv-segmentado" role="radiogroup" aria-label="Tipo de préstamo">
              {[['inventario', 'Artículo'], ['pieza', 'Pieza']].map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  type="button"
                  role="radio"
                  aria-checked={tipoRegistro === valor}
                  className={tipoRegistro === valor ? 'activo' : ''}
                  onClick={() => cambiarTipo(valor)}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>

          <div className="inv-form-grid">
            <label className="inv-form-ancho">
              {tipoRegistro === 'pieza' ? 'Pieza *' : 'Artículo *'}
              {opciones.length === 0 ? (
                <small>
                  No hay {tipoRegistro === 'pieza' ? 'piezas' : 'artículos'} disponibles con unidades para prestar.
                </small>
              ) : (
                <select value={articuloId} onChange={(e) => setArticuloId(e.target.value)}>
                  <option value="">Seleccione...</option>
                  {opciones.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.codigo ? `${a.codigo} · ` : ''}{a.nombre} ({a.cantidad_disponible} disp.)
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label>
              Cantidad *
              <input
                type="number"
                min={1}
                max={articulo?.cantidad_disponible}
                step={1}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
              {articulo && (
                <small>
                  Disponibles: {articulo.cantidad_disponible} de {articulo.cantidad}.
                </small>
              )}
            </label>

            <label className="inv-form-ancho">
              Observaciones
              <textarea
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Estado del equipo al entregarlo, uso previsto..."
              />
            </label>
          </div>

          {error && <div className="inv-alerta error">{error}</div>}

          <div className="inv-form-acciones">
            <button type="button" className="inv-btn" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="inv-btn inv-btn-primario" disabled={guardando}>
              {guardando ? 'Registrando...' : 'Registrar préstamo'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default PrestamoForm
