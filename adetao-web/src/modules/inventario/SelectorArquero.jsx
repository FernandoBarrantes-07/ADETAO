import { useMemo, useState } from 'react'

const MAX_RESULTADOS = 8

function DatosArquero({ arquero }) {
  return (
    <>
      <strong>{arquero.nombre}</strong>
      <small>
        {arquero.identificacion}
        {arquero.estado === 'inactivo' ? ' · inactivo' : ''}
      </small>
    </>
  )
}

function SelectorArquero({ arqueros, seleccionado, onSeleccionar, autoFocus = false }) {
  const [busqueda, setBusqueda] = useState('')

  const coincidencias = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return arqueros
    return arqueros.filter((a) => (
      a.nombre.toLowerCase().includes(texto) || a.identificacion.toLowerCase().includes(texto)
    ))
  }, [arqueros, busqueda])

  if (seleccionado) {
    return (
      <div className="inv-arquero-elegido">
        <div>
          <DatosArquero arquero={seleccionado} />
        </div>
        <button type="button" className="inv-btn" onClick={() => onSeleccionar(null)}>
          Cambiar
        </button>
      </div>
    )
  }

  const resultados = coincidencias.slice(0, MAX_RESULTADOS)

  return (
    <div className="inv-selector-arquero">
      <input
        type="search"
        placeholder="Buscar arquero por nombre o identificación..."
        value={busqueda}
        autoFocus={autoFocus}
        onChange={(e) => setBusqueda(e.target.value)}
        aria-label="Buscar arquero"
      />

      {resultados.length === 0 ? (
        <p className="inv-selector-nota">
          {arqueros.length === 0 ? 'No hay arqueros para mostrar.' : 'Ningún arquero coincide con la búsqueda.'}
        </p>
      ) : (
        <ul className="inv-selector-lista">
          {resultados.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => onSeleccionar(a)}>
                <DatosArquero arquero={a} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {coincidencias.length > resultados.length && (
        <p className="inv-selector-nota">
          Mostrando {resultados.length} de {coincidencias.length}. Escriba para filtrar.
        </p>
      )}
    </div>
  )
}

export default SelectorArquero
