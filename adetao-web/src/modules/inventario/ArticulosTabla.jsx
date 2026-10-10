import { useEffect, useMemo, useState } from 'react'

import ArticuloForm from './ArticuloForm'
import HistorialArticulo from './HistorialArticulo'
import {
  AVISO_DEVOLUCION,
  ESTADOS_FILTRO,
  TEXTOS_TABLA,
  etiquetaEstado,
  opcionesEstado,
} from './constantes'
import { cambiarEstadoArticulo, listarArticulos } from './inventarioService'

const FILTROS_VACIOS = {
  busqueda: '',
  tipo: '',
  estado: '',
  tipoArco: '',
  disponibilidad: '',
}

function ArticulosTabla({ tabla, tiposArco, puedeEditar }) {
  const [articulos, setArticulos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const [editando, setEditando] = useState(undefined)
  const [mensaje, setMensaje] = useState(null)
  const [cambiandoEstado, setCambiandoEstado] = useState(null)
  const [historial, setHistorial] = useState(null)

  const textos = TEXTOS_TABLA[tabla]
  const esInventario = tabla === 'inventario'

  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true

    listarArticulos(tabla)
      .then((data) => {
        if (!vigente) return
        setArticulos(data)
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
  }, [tabla, version])

  const recargar = () => setVersion((v) => v + 1)

  const reintentar = () => {
    setCargando(true)
    setError('')
    recargar()
  }

  const tiposExistentes = useMemo(
    () => [...new Set(articulos.map((a) => a.tipo).filter(Boolean))].sort(),
    [articulos]
  )

  const filtrados = useMemo(() => {
    const texto = filtros.busqueda.trim().toLowerCase()

    return articulos.filter((a) => {
      if (texto) {
        const campos = [a.nombre, a.codigo, a.ubicacion, a.descripcion]
        if (!campos.some((c) => c?.toLowerCase().includes(texto))) return false
      }
      if (filtros.tipo && a.tipo !== filtros.tipo) return false
      if (filtros.estado && a.estado !== filtros.estado) return false
      if (filtros.tipoArco && String(a.tipo_arco_id) !== filtros.tipoArco) return false
      if (filtros.disponibilidad === 'con' && a.cantidad_disponible <= 0) return false
      if (filtros.disponibilidad === 'sin' && a.cantidad_disponible > 0) return false
      return true
    })
  }, [articulos, filtros])

  const hayFiltros = Object.values(filtros).some(Boolean)

  const cambiarFiltro = (campo) => (e) => setFiltros({ ...filtros, [campo]: e.target.value })

  const cambiarEstado = async (articulo, estado) => {
    setMensaje(null)
    setCambiandoEstado(articulo.id)

    try {
      const actualizado = await cambiarEstadoArticulo(tabla, articulo.id, estado)
      setArticulos((lista) => lista.map((a) => (
        a.id === articulo.id ? { ...a, estado: actualizado.estado } : a
      )))
      setMensaje({
        tipo: 'exito',
        texto: actualizado.estado === estado
          ? `"${articulo.nombre}" ahora está en estado "${etiquetaEstado(estado)}".`
          : `"${articulo.nombre}" sigue en estado "${etiquetaEstado(actualizado.estado)}": no tiene unidades disponibles.`,
      })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setCambiandoEstado(null)
    }
  }

  const alGuardar = (texto) => {
    setEditando(undefined)
    setMensaje({ tipo: 'exito', texto })
    recargar()
  }

  return (
    <div className="dashboard-card">
      <div className="inv-toolbar">
        <div className="card-header">
          <h3>{textos.titulo}</h3>
          <p>
            {cargando ? 'Cargando...' : `${filtrados.length} de ${articulos.length} registros`}
          </p>
        </div>

        {puedeEditar && (
          <div className="inv-toolbar-acciones">
            <button className="inv-btn inv-btn-primario" onClick={() => setEditando(null)}>
              + {textos.nuevo}
            </button>
          </div>
        )}
      </div>

      <div className="inv-filtros">
        <input
          type="search"
          placeholder="Buscar por nombre, código, ubicación..."
          value={filtros.busqueda}
          onChange={cambiarFiltro('busqueda')}
        />

        <select value={filtros.tipo} onChange={cambiarFiltro('tipo')} aria-label="Tipo">
          <option value="">Todos los tipos</option>
          {tiposExistentes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={filtros.estado} onChange={cambiarFiltro('estado')} aria-label="Estado">
          <option value="">Todos los estados</option>
          {ESTADOS_FILTRO.map((e) => <option key={e.valor} value={e.valor}>{e.etiqueta}</option>)}
        </select>

        {esInventario && (
          <select value={filtros.tipoArco} onChange={cambiarFiltro('tipoArco')} aria-label="Tipo de arco">
            <option value="">Todos los tipos de arco</option>
            {tiposArco.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}{t.estado === 'inactivo' ? ' (inactivo)' : ''}
              </option>
            ))}
          </select>
        )}

        <select
          value={filtros.disponibilidad}
          onChange={cambiarFiltro('disponibilidad')}
          aria-label="Disponibilidad"
        >
          <option value="">Con y sin unidades</option>
          <option value="con">Con unidades disponibles</option>
          <option value="sin">Sin unidades disponibles</option>
        </select>

        {hayFiltros && (
          <button className="inv-btn" onClick={() => setFiltros(FILTROS_VACIOS)}>
            Limpiar
          </button>
        )}
      </div>

      {mensaje && (
        <div className={`inv-alerta ${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      {cargando ? (
        <div className="inv-estado">Cargando {textos.titulo.toLowerCase()}...</div>
      ) : error ? (
        <div className="inv-alerta error">
          {error}{' '}
          <button className="inv-btn" onClick={reintentar}>Reintentar</button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="empty-state">
          <span>▣</span>
          <p>{articulos.length === 0 ? textos.vacio : textos.sinResultados}</p>
        </div>
      ) : (
        <div className="inv-tabla-contenedor">
          <table className="inv-tabla">
            <thead>
              <tr>
                <th className="inv-col-codigo">Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                {esInventario && <th>Tipo de arco</th>}
                <th>Ubicación</th>
                <th className="inv-col-numero">Disponible / Total</th>
                <th>Estado</th>
                {puedeEditar && <th className="inv-col-acciones">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a) => {
                const prestadas = a.cantidad - a.cantidad_disponible

                return (
                  <tr key={a.id}>
                    <td data-label="Código" className="inv-col-codigo">{a.codigo || '—'}</td>
                    <td data-label="Nombre">
                      <div>
                        <strong>{a.nombre}</strong>
                        {a.descripcion && <small className="inv-descripcion">{a.descripcion}</small>}
                      </div>
                    </td>
                    <td data-label="Tipo">{a.tipo || '—'}</td>
                    {esInventario && <td data-label="Tipo de arco">{a.tipos_arco?.nombre || '—'}</td>}
                    <td data-label="Ubicación">{a.ubicacion || '—'}</td>
                    <td data-label="Disponible / Total" className="inv-col-numero">
                      <span>
                        <span className={a.cantidad_disponible === 0 ? 'inv-sin-stock' : ''}>
                          {a.cantidad_disponible}
                        </span>
                        {' / '}
                        {a.cantidad}
                      </span>
                    </td>
                    <td data-label="Estado">
                      {puedeEditar ? (
                        <select
                          className={`inv-select-estado ${a.estado}`}
                          value={a.estado}
                          disabled={cambiandoEstado === a.id}
                          onChange={(e) => cambiarEstado(a, e.target.value)}
                          aria-label={`Estado de ${a.nombre}`}
                          title={prestadas > 0
                            ? `${prestadas} ${prestadas === 1 ? 'unidad prestada' : 'unidades prestadas'}. ${AVISO_DEVOLUCION} para pasar a mantenimiento, dañado o perdido.`
                            : undefined}
                        >
                          {opcionesEstado(a.estado, prestadas).map((e) => (
                            <option key={e.valor} value={e.valor} disabled={e.deshabilitado}>
                              {e.etiqueta}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inv-badge ${a.estado}`}>{etiquetaEstado(a.estado)}</span>
                      )}
                    </td>
                    {puedeEditar && (
                      <td className="inv-col-acciones">
                        <button className="inv-btn" onClick={() => setHistorial(a)}>
                          Historial
                        </button>
                        <button className="inv-btn" onClick={() => setEditando(a)}>
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editando !== undefined && (
        <ArticuloForm
          tabla={tabla}
          articulo={editando}
          tiposArco={tiposArco}
          tiposExistentes={tiposExistentes}
          onCerrar={() => setEditando(undefined)}
          onGuardado={alGuardar}
        />
      )}

      {historial && (
        <HistorialArticulo tabla={tabla} articulo={historial} onCerrar={() => setHistorial(null)} />
      )}
    </div>
  )
}

export default ArticulosTabla
