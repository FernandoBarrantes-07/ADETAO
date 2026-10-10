import { useEffect, useState } from 'react'

import HistorialTabla from './HistorialTabla'
import Modal from './Modal'
import { ESTADOS_PENDIENTES } from './constantes'
import { listarHistorial } from './inventarioService'

function HistorialArticulo({ tabla, articulo, onCerrar }) {
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true

    listarHistorial({
      tipoRegistro: tabla === 'piezas' ? 'pieza' : 'inventario',
      articuloId: articulo.id,
    })
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
  }, [tabla, articulo.id, version])

  const reintentar = () => {
    setCargando(true)
    setError('')
    setVersion((v) => v + 1)
  }

  const pendientes = filas.filter((f) => ESTADOS_PENDIENTES.includes(f.estado))
  const unidadesFuera = pendientes.reduce((total, f) => total + f.cantidad, 0)

  return (
    <Modal
      titulo={`Historial: ${articulo.codigo ? `${articulo.codigo} · ` : ''}${articulo.nombre}`}
      onCerrar={onCerrar}
      ancho
    >
      {cargando ? (
        <div className="inv-estado">Cargando historial...</div>
      ) : error ? (
        <div className="inv-alerta error">
          {error}{' '}
          <button className="inv-btn" onClick={reintentar}>Reintentar</button>
        </div>
      ) : filas.length === 0 ? (
        <div className="empty-state">
          <span>▣</span>
          <p>{tabla === 'piezas' ? 'Esta pieza' : 'Este artículo'} no se ha prestado nunca.</p>
        </div>
      ) : (
        <>
          <p className="inv-resumen-linea">
            {filas.length} {filas.length === 1 ? 'préstamo' : 'préstamos'} registrados ·{' '}
            {unidadesFuera > 0
              ? `${unidadesFuera} ${unidadesFuera === 1 ? 'unidad' : 'unidades'} fuera en ${pendientes.length} ${pendientes.length === 1 ? 'préstamo pendiente' : 'préstamos pendientes'}`
              : 'ninguna unidad prestada ahora'}
          </p>
          <HistorialTabla filas={filas} mostrarArticulo={false} mostrarObservaciones />
        </>
      )}
    </Modal>
  )
}

export default HistorialArticulo
