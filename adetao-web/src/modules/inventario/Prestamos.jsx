import { useEffect, useMemo, useState } from 'react'

import DevolucionForm from './DevolucionForm'
import HistorialArquero from './HistorialArquero'
import HistorialTabla from './HistorialTabla'
import PrestamoForm from './PrestamoForm'
import { ESTADOS_ASIGNACION, ESTADOS_PENDIENTES } from './constantes'
import { listarHistorial } from './inventarioService'

const FILTROS_VACIOS = {
  busqueda: '',
  arquero: '',
  tipo: '',
  articulo: '',
  estado: 'pendientes',
}

const VISTAS = [
  { id: 'activos', label: 'Préstamos activos' },
  { id: 'arquero', label: 'Historial por arquero' },
]

function unicos(filas, clave, etiqueta) {
  const mapa = new Map()
  filas.forEach((f) => {
    const id = clave(f)
    if (!mapa.has(id)) mapa.set(id, etiqueta(f))
  })
  return [...mapa.entries()]
    .map(([valor, texto]) => ({ valor, texto }))
    .sort((a, b) => a.texto.localeCompare(b.texto, 'es'))
}

const claveArticulo = (f) => `${f.tipo_registro}:${f.articulo_id}`

function ListaPrestamos({ version, onNuevo, onDevolver }) {
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const [reintentos, setReintentos] = useState(0)

  useEffect(() => {
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
      .finally(() => {
        if (vigente) setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [version, reintentos])

  const reintentar = () => {
    setCargando(true)
    setError('')
    setReintentos((r) => r + 1)
  }

  const arqueros = useMemo(
    () => unicos(filas, (f) => String(f.arquero_id), (f) => f.arquero_nombre),
    [filas]
  )

  const articulos = useMemo(
    () => unicos(
      filas.filter((f) => !filtros.tipo || f.tipo_registro === filtros.tipo),
      claveArticulo,
      (f) => `${f.articulo_codigo ? `${f.articulo_codigo} · ` : ''}${f.articulo_nombre}`
    ),
    [filas, filtros.tipo]
  )

  const filtradas = useMemo(() => {
    const texto = filtros.busqueda.trim().toLowerCase()

    return filas.filter((f) => {
      if (filtros.estado === 'pendientes' && !ESTADOS_PENDIENTES.includes(f.estado)) return false
      if (filtros.estado && filtros.estado !== 'pendientes' && f.estado !== filtros.estado) return false
      if (filtros.arquero && String(f.arquero_id) !== filtros.arquero) return false
      if (filtros.tipo && f.tipo_registro !== filtros.tipo) return false
      if (filtros.articulo && claveArticulo(f) !== filtros.articulo) return false
      if (texto) {
        const campos = [f.arquero_nombre, f.arquero_identificacion, f.articulo_nombre, f.articulo_codigo]
        if (!campos.some((c) => c?.toLowerCase().includes(texto))) return false
      }
      return true
    })
  }, [filas, filtros])

  const pendientes = filas.filter((f) => ESTADOS_PENDIENTES.includes(f.estado)).length
  const hayFiltros = Object.keys(FILTROS_VACIOS).some((k) => filtros[k] !== FILTROS_VACIOS[k])

  const cambiarFiltro = (campo) => (e) => {
    const valor = e.target.value
    setFiltros((f) => ({ ...f, [campo]: valor, ...(campo === 'tipo' && { articulo: '' }) }))
  }

  return (
    <div className="dashboard-card">
      <div className="inv-toolbar">
        <div className="card-header">
          <h3>Préstamos</h3>
          <p>
            {cargando
              ? 'Cargando...'
              : `${filtradas.length} de ${filas.length} registros · ${pendientes} pendientes de devolución`}
          </p>
        </div>

        <div className="inv-toolbar-acciones">
          <button className="inv-btn inv-btn-primario" onClick={onNuevo}>
            + Nuevo préstamo
          </button>
        </div>
      </div>

      <div className="inv-filtros">
        <input
          type="search"
          placeholder="Buscar por arquero, identificación, artículo o código..."
          value={filtros.busqueda}
          onChange={cambiarFiltro('busqueda')}
        />

        <select value={filtros.arquero} onChange={cambiarFiltro('arquero')} aria-label="Arquero">
          <option value="">Todos los arqueros</option>
          {arqueros.map((a) => <option key={a.valor} value={a.valor}>{a.texto}</option>)}
        </select>

        <select value={filtros.tipo} onChange={cambiarFiltro('tipo')} aria-label="Tipo">
          <option value="">Artículos y piezas</option>
          <option value="inventario">Solo artículos</option>
          <option value="pieza">Solo piezas</option>
        </select>

        <select value={filtros.articulo} onChange={cambiarFiltro('articulo')} aria-label="Artículo o pieza">
          <option value="">Todos los artículos y piezas</option>
          {articulos.map((a) => <option key={a.valor} value={a.valor}>{a.texto}</option>)}
        </select>

        <select value={filtros.estado} onChange={cambiarFiltro('estado')} aria-label="Estado">
          <option value="pendientes">Pendientes (activos y dañados)</option>
          {ESTADOS_ASIGNACION.map((e) => <option key={e.valor} value={e.valor}>{e.etiqueta}</option>)}
          <option value="">Todos los estados</option>
        </select>

        {hayFiltros && (
          <button className="inv-btn" onClick={() => setFiltros(FILTROS_VACIOS)}>
            Limpiar
          </button>
        )}
      </div>

      {cargando ? (
        <div className="inv-estado">Cargando préstamos...</div>
      ) : error ? (
        <div className="inv-alerta error">
          {error}{' '}
          <button className="inv-btn" onClick={reintentar}>Reintentar</button>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="empty-state">
          <span>▣</span>
          <p>
            {filas.length === 0
              ? 'No hay préstamos registrados.'
              : !hayFiltros
                ? 'No hay préstamos pendientes de devolución.'
                : 'Ningún préstamo coincide con los filtros.'}
          </p>
        </div>
      ) : (
        <HistorialTabla filas={filtradas} onDevolver={onDevolver} />
      )}
    </div>
  )
}

function Prestamos() {
  const [vista, setVista] = useState('activos')
  const [version, setVersion] = useState(0)
  const [mensaje, setMensaje] = useState(null)
  const [nuevo, setNuevo] = useState(false)
  const [devolviendo, setDevolviendo] = useState(null)

  const alGuardar = (texto) => {
    setNuevo(false)
    setDevolviendo(null)
    setMensaje({ tipo: 'exito', texto })
    setVersion((v) => v + 1)
  }

  const abrirDevolucion = (prestamo) => {
    setMensaje(null)
    setDevolviendo(prestamo)
  }

  return (
    <>
      <div className="inv-segmentado inv-vistas" role="tablist" aria-label="Vista de préstamos">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={vista === v.id}
            className={vista === v.id ? 'activo' : ''}
            onClick={() => setVista(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {mensaje && <div className={`inv-alerta ${mensaje.tipo}`}>{mensaje.texto}</div>}

      {vista === 'activos' ? (
        <ListaPrestamos
          version={version}
          onNuevo={() => {
            setMensaje(null)
            setNuevo(true)
          }}
          onDevolver={abrirDevolucion}
        />
      ) : (
        <HistorialArquero version={version} onDevolver={abrirDevolucion} />
      )}

      {nuevo && <PrestamoForm onCerrar={() => setNuevo(false)} onGuardado={alGuardar} />}

      {devolviendo && (
        <DevolucionForm
          prestamo={devolviendo}
          onCerrar={() => setDevolviendo(null)}
          onGuardado={alGuardar}
        />
      )}
    </>
  )
}

export default Prestamos
