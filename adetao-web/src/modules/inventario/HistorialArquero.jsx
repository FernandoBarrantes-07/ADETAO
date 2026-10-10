import { useEffect, useState } from 'react'

import HistorialTabla from './HistorialTabla'
import SelectorArquero from './SelectorArquero'
import { ESTADOS_PENDIENTES } from './constantes'
import { listarArqueros, listarHistorial } from './inventarioService'

function HistorialArquero({ version, onDevolver }) {
  const [arqueros, setArqueros] = useState(null)
  const [errorArqueros, setErrorArqueros] = useState('')
  const [versionArqueros, setVersionArqueros] = useState(0)

  const [arquero, setArquero] = useState(null)
  const [historial, setHistorial] = useState({ arqueroId: null, filas: [] })
  const [errorHistorial, setErrorHistorial] = useState('')
  const [versionHistorial, setVersionHistorial] = useState(0)

  useEffect(() => {
    let vigente = true

    listarArqueros()
      .then((data) => {
        if (!vigente) return
        setArqueros(data)
        setErrorArqueros('')
      })
      .catch((err) => {
        if (vigente) setErrorArqueros(err.message)
      })

    return () => {
      vigente = false
    }
  }, [versionArqueros])

  useEffect(() => {
    if (!arquero) return undefined
    let vigente = true

    listarHistorial({ arqueroId: arquero.id })
      .then((filas) => {
        if (!vigente) return
        setHistorial({ arqueroId: arquero.id, filas })
        setErrorHistorial('')
      })
      .catch((err) => {
        if (vigente) setErrorHistorial(err.message)
      })

    return () => {
      vigente = false
    }
  }, [arquero, version, versionHistorial])

  const seleccionar = (a) => {
    setErrorHistorial('')
    setArquero(a)
  }

  const reintentarArqueros = () => {
    setErrorArqueros('')
    setVersionArqueros((v) => v + 1)
  }

  const reintentarHistorial = () => {
    setErrorHistorial('')
    setVersionHistorial((v) => v + 1)
  }

  const cargandoHistorial = arquero && historial.arqueroId !== arquero.id
  const filas = cargandoHistorial ? [] : historial.filas
  const actuales = filas.filter((f) => ESTADOS_PENDIENTES.includes(f.estado))
  const anteriores = filas.filter((f) => !ESTADOS_PENDIENTES.includes(f.estado))
  const unidades = actuales.reduce((total, f) => total + f.cantidad, 0)

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3>Historial por arquero</h3>
        <p>Qué tiene ahora y qué tuvo prestado. Incluye arqueros inactivos.</p>
      </div>

      {errorArqueros ? (
        <div className="inv-alerta error">
          {errorArqueros}{' '}
          <button className="inv-btn" onClick={reintentarArqueros}>Reintentar</button>
        </div>
      ) : !arqueros ? (
        <div className="inv-estado">Cargando arqueros...</div>
      ) : (
        <div className="inv-historial-selector">
          <SelectorArquero arqueros={arqueros} seleccionado={arquero} onSeleccionar={seleccionar} />
        </div>
      )}

      {!arquero ? null : errorHistorial ? (
        <div className="inv-alerta error">
          {errorHistorial}{' '}
          <button className="inv-btn" onClick={reintentarHistorial}>Reintentar</button>
        </div>
      ) : cargandoHistorial ? (
        <div className="inv-estado">Cargando historial...</div>
      ) : filas.length === 0 ? (
        <div className="empty-state">
          <span>▣</span>
          <p>{arquero.nombre} no tiene préstamos registrados.</p>
        </div>
      ) : (
        <>
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
              onDevolver={onDevolver}
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
            <HistorialTabla filas={anteriores} mostrarArquero={false} mostrarObservaciones />
          )}
        </>
      )}
    </div>
  )
}

export default HistorialArquero
