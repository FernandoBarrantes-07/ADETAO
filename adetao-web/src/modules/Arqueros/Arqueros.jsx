import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

import './Arqueros.css'

function Arqueros({ onDataChange }) {
  const [arqueros, setArqueros] = useState([])
  const [clubes, setClubes] = useState([])
  const [tiposArco, setTiposArco] = useState([])

  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [busqueda, setBusqueda] = useState('')

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [arqueroEditando, setArqueroEditando] = useState(null)

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const formularioInicial = {
    nombre: '',
    identificacion: '',
    fecha_nacimiento: '',
    telefono: '',
    correo: '',
    mano_dominante: '',
    tipo_arco_id: '',
    categoria: '',
    afiliacion: '',
    club_id: '',
    estado_pago: 'pendiente',
    estado: 'activo',
    observaciones: '',
  }

  const [formulario, setFormulario] = useState(formularioInicial)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setError('')

    const [
      { data: arquerosData, error: arquerosError },
      { data: clubesData, error: clubesError },
      { data: tiposArcoData, error: tiposArcoError },
    ] = await Promise.all([
      supabase
        .from('arqueros')
        .select(`
          id,
          nombre,
          identificacion,
          fecha_nacimiento,
          telefono,
          correo,
          mano_dominante,
          tipo_arco_id,
          categoria,
          afiliacion,
          club_id,
          estado_pago,
          estado,
          observaciones,
          created_at,
          tipos_arco(nombre),
          clubes(nombre)
        `)
        .order('nombre'),

      supabase
        .from('clubes')
        .select('id, nombre')
        .order('nombre'),

      supabase
        .from('tipos_arco')
        .select('id, nombre')
        .order('nombre'),
    ])

    if (arquerosError) {
      setError('No se pudieron cargar los arqueros.')
      console.error(arquerosError)
    }

    if (clubesError) {
      console.error(clubesError)
    }

    if (tiposArcoError) {
      console.error(tiposArcoError)
    }

    setArqueros(arquerosData || [])
    setClubes(clubesData || [])
    setTiposArco(tiposArcoData || [])

    setLoading(false)
  }

  const abrirNuevo = () => {
    setArqueroEditando(null)
    setFormulario(formularioInicial)
    setMensaje('')
    setError('')
    setMostrarFormulario(true)
  }

  const abrirEditar = (arquero) => {
    setArqueroEditando(arquero)

    setFormulario({
      nombre: arquero.nombre || '',
      identificacion: arquero.identificacion || '',
      fecha_nacimiento: arquero.fecha_nacimiento || '',
      telefono: arquero.telefono || '',
      correo: arquero.correo || '',
      mano_dominante: arquero.mano_dominante || '',
      tipo_arco_id: arquero.tipo_arco_id || '',
      categoria: arquero.categoria || '',
      afiliacion: arquero.afiliacion || '',
      club_id: arquero.club_id || '',
      estado_pago: arquero.estado_pago || 'pendiente',
      estado: arquero.estado || 'activo',
      observaciones: arquero.observaciones || '',
    })

    setMensaje('')
    setError('')
    setMostrarFormulario(true)
  }

  const cerrarFormulario = () => {
    if (guardando) return

    setMostrarFormulario(false)
    setArqueroEditando(null)
    setFormulario(formularioInicial)
    setMensaje('')
    setError('')
  }

  const manejarCambio = (e) => {
    const { name, value } = e.target

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  const guardarArquero = async (e) => {
    e.preventDefault()

    setMensaje('')
    setError('')

    if (!formulario.nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    if (!formulario.identificacion.trim()) {
      setError('La identificación es obligatoria.')
      return
    }

    setGuardando(true)

    const datos = {
      nombre: formulario.nombre.trim(),
      identificacion: formulario.identificacion.trim(),
      fecha_nacimiento: formulario.fecha_nacimiento || null,
      telefono: formulario.telefono.trim() || null,
      correo: formulario.correo.trim() || null,
      mano_dominante: formulario.mano_dominante || null,
      tipo_arco_id: formulario.tipo_arco_id
        ? Number(formulario.tipo_arco_id)
        : null,
      categoria: formulario.categoria.trim() || null,
      afiliacion: formulario.afiliacion.trim() || null,
      club_id: formulario.club_id
        ? Number(formulario.club_id)
        : null,
      estado_pago: formulario.estado_pago,
      estado: formulario.estado,
      observaciones: formulario.observaciones.trim() || null,
    }

    let resultado

    if (arqueroEditando) {
      resultado = await supabase
        .from('arqueros')
        .update(datos)
        .eq('id', arqueroEditando.id)
    } else {
      resultado = await supabase
        .from('arqueros')
        .insert([datos])
    }

    if (resultado.error) {
      console.error(resultado.error)

      if (resultado.error.code === '23505') {
        setError('Ya existe un arquero con esa identificación.')
      } else {
        setError('No se pudo guardar el arquero.')
      }

      setGuardando(false)
      return
    }

    setGuardando(false)
    setMostrarFormulario(false)
    setArqueroEditando(null)
    setFormulario(formularioInicial)

    setMensaje(
      arqueroEditando
        ? 'Arquero actualizado correctamente.'
        : 'Arquero registrado correctamente.'
    )

    await cargarDatos()

    if (onDataChange) {
      onDataChange()
    }
  }

  const eliminarArquero = async (arquero) => {
    const confirmar = window.confirm(
      `¿Está seguro de eliminar a ${arquero.nombre}?`
    )

    if (!confirmar) return

    setError('')
    setMensaje('')

    const { error: eliminarError } = await supabase
      .from('arqueros')
      .delete()
      .eq('id', arquero.id)

    if (eliminarError) {
      console.error(eliminarError)
      setError('No se pudo eliminar el arquero.')
      return
    }

    setMensaje('Arquero eliminado correctamente.')

    await cargarDatos()

    if (onDataChange) {
      onDataChange()
    }
  }

  const arquerosFiltrados = arqueros.filter((arquero) => {
    const texto = busqueda.toLowerCase()

    return (
      arquero.nombre?.toLowerCase().includes(texto) ||
      arquero.identificacion?.toLowerCase().includes(texto) ||
      arquero.clubes?.nombre?.toLowerCase().includes(texto)
    )
  })

  return (
    <div className="arqueros-module">

      <div className="arqueros-header">
        <div>
          <h2>Arqueros</h2>
          <p>
            Administración y registro de los arqueros de ADETAO.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={abrirNuevo}
        >
          + Registrar arquero
        </button>
      </div>

      {mensaje && (
        <div className="alert success">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <div className="arqueros-toolbar">

        <div className="search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Buscar por nombre, identificación o club..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="total-arqueros">
          {arquerosFiltrados.length} arqueros
        </div>

      </div>

      <div className="arqueros-card">

        {loading ? (
          <div className="loading-module">
            Cargando arqueros...
          </div>
        ) : arquerosFiltrados.length === 0 ? (
          <div className="empty-module">
            <span>♙</span>
            <h3>No hay arqueros registrados</h3>

            <p>
              {busqueda
                ? 'No se encontraron resultados para la búsqueda.'
                : 'Registre el primer arquero para comenzar.'}
            </p>

            {!busqueda && (
              <button
                className="btn-primary"
                onClick={abrirNuevo}
              >
                + Registrar arquero
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">

            <table className="arqueros-table">

              <thead>
                <tr>
                  <th>Arquero</th>
                  <th>Identificación</th>
                  <th>Club</th>
                  <th>Tipo de arco</th>
                  <th>Categoría</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>

                {arquerosFiltrados.map((arquero) => (
                  <tr key={arquero.id}>

                    <td>
                      <div className="table-name">
                        <div className="table-avatar">
                          {arquero.nombre
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>{arquero.nombre}</strong>

                          <span>
                            {arquero.correo || 'Sin correo'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {arquero.identificacion}
                    </td>

                    <td>
                      {arquero.clubes?.nombre || 'Sin club'}
                    </td>

                    <td>
                      {arquero.tipos_arco?.nombre || 'Sin especificar'}
                    </td>

                    <td>
                      {arquero.categoria || 'Sin categoría'}
                    </td>

                    <td>
                      <span
                        className={`status-badge payment-${arquero.estado_pago}`}
                      >
                        {arquero.estado_pago}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge record-${arquero.estado}`}
                      >
                        {arquero.estado}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">

                        <button
                          className="btn-edit"
                          title="Editar"
                          onClick={() => abrirEditar(arquero)}
                        >
                          ✎
                        </button>

                        <button
                          className="btn-delete"
                          title="Eliminar"
                          onClick={() => eliminarArquero(arquero)}
                        >
                          🗑
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {mostrarFormulario && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">
              <div>
                <h3>
                  {arqueroEditando
                    ? 'Editar arquero'
                    : 'Registrar arquero'}
                </h3>

                <p>
                  Complete la información del arquero.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={cerrarFormulario}
              >
                ×
              </button>
            </div>

            <form onSubmit={guardarArquero}>

              <div className="form-section">

                <h4>Información personal</h4>

                <div className="form-grid">

                  <div className="form-group">
                    <label>
                      Nombre completo *
                    </label>

                    <input
                      type="text"
                      name="nombre"
                      value={formulario.nombre}
                      onChange={manejarCambio}
                      placeholder="Nombre completo"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Identificación *
                    </label>

                    <input
                      type="text"
                      name="identificacion"
                      value={formulario.identificacion}
                      onChange={manejarCambio}
                      placeholder="Número de identificación"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Fecha de nacimiento
                    </label>

                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formulario.fecha_nacimiento}
                      onChange={manejarCambio}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Teléfono
                    </label>

                    <input
                      type="text"
                      name="telefono"
                      value={formulario.telefono}
                      onChange={manejarCambio}
                      placeholder="8888-8888"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Correo electrónico
                    </label>

                    <input
                      type="email"
                      name="correo"
                      value={formulario.correo}
                      onChange={manejarCambio}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Mano dominante
                    </label>

                    <select
                      name="mano_dominante"
                      value={formulario.mano_dominante}
                      onChange={manejarCambio}
                    >
                      <option value="">
                        Seleccionar
                      </option>
                      <option value="derecha">
                        Derecha
                      </option>
                      <option value="izquierda">
                        Izquierda
                      </option>
                    </select>
                  </div>

                </div>

              </div>

              <div className="form-section">

                <h4>Información deportiva</h4>

                <div className="form-grid">

                  <div className="form-group">
                    <label>
                      Tipo de arco
                    </label>

                    <select
                      name="tipo_arco_id"
                      value={formulario.tipo_arco_id}
                      onChange={manejarCambio}
                    >
                      <option value="">
                        Seleccionar tipo de arco
                      </option>

                      {tiposArco.map((tipo) => (
                        <option
                          key={tipo.id}
                          value={tipo.id}
                        >
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Categoría
                    </label>

                    <input
                      type="text"
                      name="categoria"
                      value={formulario.categoria}
                      onChange={manejarCambio}
                      placeholder="Ej. Senior"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Afiliación
                    </label>

                    <input
                      type="text"
                      name="afiliacion"
                      value={formulario.afiliacion}
                      onChange={manejarCambio}
                      placeholder="Tipo de afiliación"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Club
                    </label>

                    <select
                      name="club_id"
                      value={formulario.club_id}
                      onChange={manejarCambio}
                    >
                      <option value="">
                        Sin club
                      </option>

                      {clubes.map((club) => (
                        <option
                          key={club.id}
                          value={club.id}
                        >
                          {club.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Estado de pago
                    </label>

                    <select
                      name="estado_pago"
                      value={formulario.estado_pago}
                      onChange={manejarCambio}
                    >
                      <option value="pendiente">
                        Pendiente
                      </option>

                      <option value="pagado">
                        Pagado
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Estado
                    </label>

                    <select
                      name="estado"
                      value={formulario.estado}
                      onChange={manejarCambio}
                    >
                      <option value="activo">
                        Activo
                      </option>

                      <option value="inactivo">
                        Inactivo
                      </option>
                    </select>
                  </div>

                </div>

              </div>

              <div className="form-section">

                <h4>Observaciones</h4>

                <div className="form-group">
                  <textarea
                    name="observaciones"
                    value={formulario.observaciones}
                    onChange={manejarCambio}
                    placeholder="Información adicional..."
                    rows="4"
                  />
                </div>

              </div>

              {error && (
                <div className="form-error">
                  {error}
                </div>
              )}

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={guardando}
                >
                  {guardando
                    ? 'Guardando...'
                    : arqueroEditando
                      ? 'Guardar cambios'
                      : 'Registrar arquero'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  )
}

export default Arqueros