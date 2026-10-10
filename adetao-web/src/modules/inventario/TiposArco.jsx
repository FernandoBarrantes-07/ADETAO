import { useState } from 'react'

import Modal from './Modal'
import {
  cambiarEstadoTipoArco,
  contarUsoTipoArco,
  guardarTipoArco,
} from './inventarioService'

const FORM_VACIO = { id: null, nombre: '', descripcion: '' }

function TiposArco({ tipos, cargando, error, esAdmin, onCambio }) {
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const [form, setForm] = useState(null)
  const [errorForm, setErrorForm] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmacion, setConfirmacion] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  const visibles = mostrarInactivos
    ? tipos
    : tipos.filter((t) => t.estado === 'activo')

  const abrirForm = (tipo) => {
    setErrorForm('')
    setForm(tipo
      ? { id: tipo.id, nombre: tipo.nombre, descripcion: tipo.descripcion || '' }
      : FORM_VACIO)
  }

  const guardar = async (e) => {
    e.preventDefault()

    const nombre = form.nombre.trim()

    if (!nombre) {
      setErrorForm('El nombre es obligatorio.')
      return
    }

    const duplicado = tipos.some(
      (t) => t.id !== form.id && t.nombre.trim().toLowerCase() === nombre.toLowerCase()
    )

    if (duplicado) {
      setErrorForm(`Ya existe un tipo de arco llamado "${nombre}".`)
      return
    }

    setGuardando(true)

    try {
      await guardarTipoArco(form)
      setForm(null)
      setMensaje({ tipo: 'exito', texto: form.id ? 'Tipo de arco actualizado.' : 'Tipo de arco creado.' })
      onCambio()
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const pedirDesactivar = async (tipo) => {
    setMensaje(null)

    try {
      const uso = await contarUsoTipoArco(tipo.id)
      setConfirmacion({ tipo, uso })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  const cambiarEstado = async (tipo, estado) => {
    setGuardando(true)

    try {
      await cambiarEstadoTipoArco(tipo.id, estado)
      setConfirmacion(null)
      setMensaje({
        tipo: 'exito',
        texto: estado === 'activo'
          ? `"${tipo.nombre}" se reactivó.`
          : `"${tipo.nombre}" se desactivó.`,
      })
      onCambio()
    } catch (err) {
      setConfirmacion(null)
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="dashboard-card">
      <div className="inv-toolbar">
        <div className="card-header">
          <h3>Tipos de arco</h3>
          <p>
            {esAdmin
              ? 'Catálogo usado por arqueros e inventario.'
              : 'Catálogo de solo lectura. Solo el administrador puede modificarlo.'}
          </p>
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
              + Nuevo tipo
            </button>
          )}
        </div>
      </div>

      {mensaje && (
        <div className={`inv-alerta ${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      {cargando ? (
        <div className="inv-estado">Cargando tipos de arco...</div>
      ) : error ? (
        <div className="inv-alerta error">{error}</div>
      ) : visibles.length === 0 ? (
        <div className="empty-state">
          <span>▣</span>
          <p>No hay tipos de arco para mostrar.</p>
        </div>
      ) : (
        <div className="inv-tabla-contenedor">
          <table className="inv-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                {esAdmin && <th className="inv-col-acciones">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {visibles.map((tipo) => (
                <tr key={tipo.id} className={tipo.estado === 'inactivo' ? 'inv-fila-inactiva' : ''}>
                  <td data-label="Nombre"><strong>{tipo.nombre}</strong></td>
                  <td data-label="Descripción">{tipo.descripcion || '—'}</td>
                  <td data-label="Estado">
                    <span className={`inv-badge ${tipo.estado}`}>
                      {tipo.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {esAdmin && (
                    <td className="inv-col-acciones">
                      <button className="inv-btn" onClick={() => abrirForm(tipo)}>
                        Editar
                      </button>
                      {tipo.estado === 'activo' ? (
                        <button
                          className="inv-btn inv-btn-peligro"
                          onClick={() => pedirDesactivar(tipo)}
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          className="inv-btn"
                          disabled={guardando}
                          onClick={() => cambiarEstado(tipo, 'activo')}
                        >
                          Reactivar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal
          titulo={form.id ? 'Editar tipo de arco' : 'Nuevo tipo de arco'}
          onCerrar={() => setForm(null)}
        >
          <form className="inv-form" onSubmit={guardar} noValidate>
            <label>
              Nombre *
              <input
                value={form.nombre}
                maxLength={100}
                autoFocus
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
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
              <button type="button" className="inv-btn" onClick={() => setForm(null)}>
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
        <Modal titulo="Desactivar tipo de arco" onCerrar={() => setConfirmacion(null)}>
          <div className="inv-form">
            {confirmacion.uso.arqueros > 0 || confirmacion.uso.inventario > 0 ? (
              <div className="inv-alerta advertencia">
                "{confirmacion.tipo.nombre}" está en uso por {confirmacion.uso.arqueros}{' '}
                {confirmacion.uso.arqueros === 1 ? 'arquero' : 'arqueros'} y{' '}
                {confirmacion.uso.inventario}{' '}
                {confirmacion.uso.inventario === 1 ? 'artículo' : 'artículos'} de inventario.
                Esos registros conservarán el tipo, pero ya no se podrá elegir para
                arcos nuevos.
              </div>
            ) : (
              <p>"{confirmacion.tipo.nombre}" no está en uso. ¿Desea desactivarlo?</p>
            )}

            <div className="inv-form-acciones">
              <button type="button" className="inv-btn" onClick={() => setConfirmacion(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="inv-btn inv-btn-peligro-solido"
                disabled={guardando}
                onClick={() => cambiarEstado(confirmacion.tipo, 'inactivo')}
              >
                {guardando ? 'Desactivando...' : 'Desactivar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default TiposArco
