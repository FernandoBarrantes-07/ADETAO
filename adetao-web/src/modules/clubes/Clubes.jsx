import { useEffect, useState } from 'react'

import Modal from '../inventario/Modal'
import FichaClub from './FichaClub'
import {
  cambiarEstadoClub,
  contarArquerosClub,
  guardarClub,
  listarClubes,
} from './clubesService'

import '../inventario/Inventario.css'

const FORM_VACIO = { id: null, nombre: '', ubicacion: '', descripcion: '' }

function Clubes({ profile, onCambio }) {
  const esAdmin = profile?.rol === 'administrador'
  const esStaff = esAdmin || profile?.rol === 'profesor'

  const [clubes, setClubes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const [form, setForm] = useState(null)
  const [errorForm, setErrorForm] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmacion, setConfirmacion] = useState(null)
  const [ficha, setFicha] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true

    listarClubes()
      .then((data) => {
        if (!vigente) return
        setClubes(data)
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
  }, [version])

  const recargar = () => {
    setCargando(true)
    setVersion((v) => v + 1)
    if (onCambio) onCambio()
  }

  const texto = busqueda.trim().toLowerCase()
  const visibles = clubes.filter((club) => {
    if (!mostrarInactivos && club.estado !== 'activo') return false
    if (!texto) return true
    return (
      club.nombre.toLowerCase().includes(texto)
      || (club.ubicacion || '').toLowerCase().includes(texto)
    )
  })

  const abrirForm = (club) => {
    setErrorForm('')
    setForm(club
      ? {
          id: club.id,
          nombre: club.nombre,
          ubicacion: club.ubicacion || '',
          descripcion: club.descripcion || '',
        }
      : FORM_VACIO)
  }

  const guardar = async (e) => {
    e.preventDefault()

    const nombre = form.nombre.trim()

    if (!nombre) {
      setErrorForm('El nombre es obligatorio.')
      return
    }

    const duplicado = clubes.some(
      (club) => club.id !== form.id && club.nombre.trim().toLowerCase() === nombre.toLowerCase()
    )

    if (duplicado) {
      setErrorForm(`Ya existe un club llamado "${nombre}".`)
      return
    }

    setGuardando(true)

    try {
      await guardarClub(form)
      setForm(null)
      setMensaje({
        tipo: 'exito',
        texto: form.id ? 'Club actualizado.' : 'Club creado.',
      })
      recargar()
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const pedirDesactivar = async (club) => {
    setMensaje(null)

    try {
      const arqueros = await contarArquerosClub(club.id)
      setConfirmacion({ club, arqueros })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  const cambiarEstado = async (club, estado) => {
    setGuardando(true)

    try {
      await cambiarEstadoClub(club.id, estado)
      setConfirmacion(null)
      setMensaje({
        tipo: 'exito',
        texto: estado === 'activo'
          ? `"${club.nombre}" se reactivó.`
          : `"${club.nombre}" se desactivó. Sus arqueros conservan el club.`,
      })
      recargar()
    } catch (err) {
      setConfirmacion(null)
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="inventario">
      <div className="welcome-section">
        <h2>Clubes</h2>
        <p>
          {esAdmin
            ? 'Registro de los clubes de la asociación.'
            : 'Consulta de clubes. Solo el administrador puede modificarlos.'}
        </p>
      </div>

      <div className="dashboard-card">
        <div className="inv-toolbar">
          <div className="inv-filtros">
            <input
              type="search"
              placeholder="Buscar por nombre o ubicación"
              aria-label="Buscar clubes"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="inv-toolbar-acciones">
            <label className="inv-check">
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
              />
              Mostrar inactivos
            </label>

            {esAdmin && (
              <button className="inv-btn inv-btn-primario" onClick={() => abrirForm(null)}>
                + Nuevo club
              </button>
            )}
          </div>
        </div>

        {mensaje && (
          <div className={`inv-alerta ${mensaje.tipo}`}>{mensaje.texto}</div>
        )}

        {cargando ? (
          <div className="inv-estado">Cargando clubes...</div>
        ) : error ? (
          <div className="inv-alerta error">{error}</div>
        ) : visibles.length === 0 ? (
          <div className="empty-state">
            <span>♧</span>
            <p>
              {texto
                ? 'Ningún club coincide con la búsqueda.'
                : 'No hay clubes para mostrar.'}
            </p>
          </div>
        ) : (
          <div className="inv-tabla-contenedor">
            <table className="inv-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Ubicación</th>
                  <th className="inv-col-numero">Arqueros</th>
                  <th>Estado</th>
                  <th className="inv-col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((club) => (
                  <tr key={club.id} className={club.estado === 'inactivo' ? 'inv-fila-inactiva' : ''}>
                    <td data-label="Nombre">
                      <button type="button" className="inv-btn" onClick={() => setFicha(club)}>
                        {club.nombre}
                      </button>
                    </td>
                    <td data-label="Ubicación">{club.ubicacion || '—'}</td>
                    <td data-label="Arqueros" className="inv-col-numero">{club.arqueros}</td>
                    <td data-label="Estado">
                      <span className={`inv-badge ${club.estado}`}>
                        {club.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="inv-col-acciones">
                      <button type="button" className="inv-btn" onClick={() => setFicha(club)}>
                        Ver
                      </button>
                      {esAdmin && (
                        <button type="button" className="inv-btn" onClick={() => abrirForm(club)}>
                          Editar
                        </button>
                      )}
                      {esAdmin && (club.estado === 'activo' ? (
                        <button
                          type="button"
                          className="inv-btn inv-btn-peligro"
                          onClick={() => pedirDesactivar(club)}
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="inv-btn"
                          disabled={guardando}
                          onClick={() => cambiarEstado(club, 'activo')}
                        >
                          Reactivar
                        </button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <Modal
          titulo={form.id ? 'Editar club' : 'Nuevo club'}
          onCerrar={() => !guardando && setForm(null)}
        >
          <form className="inv-form" onSubmit={guardar} noValidate>
            <label>
              Nombre *
              <input
                value={form.nombre}
                maxLength={150}
                autoFocus
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </label>

            <label>
              Ubicación
              <input
                value={form.ubicacion}
                maxLength={250}
                onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              />
            </label>

            <label>
              Descripción
              <textarea
                rows={3}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </label>

            {errorForm && <div className="inv-alerta error">{errorForm}</div>}

            <div className="inv-form-acciones">
              <button type="button" className="inv-btn" onClick={() => setForm(null)} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className="inv-btn inv-btn-primario" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmacion && (
        <Modal titulo="Desactivar club" onCerrar={() => !guardando && setConfirmacion(null)}>
          <div className="inv-form">
            {confirmacion.arqueros > 0 ? (
              <div className="inv-alerta advertencia">
                "{confirmacion.club.nombre}" tiene {confirmacion.arqueros}{' '}
                {confirmacion.arqueros === 1 ? 'arquero' : 'arqueros'}. Los conservan,
                pero ya no se podrá elegir para arqueros nuevos.
              </div>
            ) : (
              <p>"{confirmacion.club.nombre}" no tiene arqueros. ¿Desea desactivarlo?</p>
            )}

            <div className="inv-form-acciones">
              <button type="button" className="inv-btn" onClick={() => setConfirmacion(null)} disabled={guardando}>
                Cancelar
              </button>
              <button
                type="button"
                className="inv-btn inv-btn-peligro-solido"
                disabled={guardando}
                onClick={() => cambiarEstado(confirmacion.club, 'inactivo')}
              >
                {guardando ? 'Desactivando...' : 'Desactivar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {ficha && (
        <FichaClub
          club={ficha}
          esStaff={esStaff}
          onCerrar={() => setFicha(null)}
        />
      )}
    </div>
  )
}

export default Clubes
