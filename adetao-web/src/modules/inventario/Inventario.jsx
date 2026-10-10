import { useEffect, useState } from 'react'

import ArticulosTabla from './ArticulosTabla'
import Prestamos from './Prestamos'
import TiposArco from './TiposArco'
import { listarTiposArco } from './inventarioService'

import './Inventario.css'

const PESTANAS = [
  { id: 'inventario', label: 'Artículos' },
  { id: 'piezas', label: 'Piezas' },
  { id: 'prestamos', label: 'Préstamos', soloStaff: true },
  { id: 'tipos_arco', label: 'Tipos de arco' },
]

function Inventario({ profile }) {
  const [pestana, setPestana] = useState('inventario')
  const [tiposArco, setTiposArco] = useState([])
  const [cargandoTipos, setCargandoTipos] = useState(true)
  const [errorTipos, setErrorTipos] = useState('')

  const esAdmin = profile?.rol === 'administrador'
  const esStaff = esAdmin || profile?.rol === 'profesor'

  const [versionTipos, setVersionTipos] = useState(0)

  useEffect(() => {
    let vigente = true

    listarTiposArco()
      .then((data) => {
        if (!vigente) return
        setTiposArco(data)
        setErrorTipos('')
      })
      .catch((err) => {
        if (vigente) setErrorTipos(err.message)
      })
      .finally(() => {
        if (vigente) setCargandoTipos(false)
      })

    return () => {
      vigente = false
    }
  }, [versionTipos])

  const recargarTipos = () => setVersionTipos((v) => v + 1)

  return (
    <div className="inventario">
      <div className="welcome-section">
        <h2>Inventario</h2>
        <p>Arcos, equipo y piezas de la asociación.</p>
      </div>

      <div className="inv-pestanas" role="tablist">
        {PESTANAS.filter((p) => esStaff || !p.soloStaff).map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={pestana === p.id}
            className={`inv-pestana ${pestana === p.id ? 'activa' : ''}`}
            onClick={() => setPestana(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {pestana === 'prestamos' ? (
        esStaff && <Prestamos />
      ) : pestana === 'tipos_arco' ? (
        <TiposArco
          tipos={tiposArco}
          cargando={cargandoTipos}
          error={errorTipos}
          esAdmin={esAdmin}
          onCambio={recargarTipos}
        />
      ) : (
        <ArticulosTabla
          key={pestana}
          tabla={pestana}
          tiposArco={tiposArco}
          puedeEditar={esStaff}
        />
      )}
    </div>
  )
}

export default Inventario
