import { useState } from 'react'

import Modal from './Modal'
import { TEXTOS_TABLA, TIPOS_SUGERIDOS, opcionesEstado } from './constantes'
import { guardarArticulo, normalizarTipo } from './inventarioService'

function crearFormInicial(articulo) {
  if (!articulo) {
    return {
      id: null,
      nombre: '',
      codigo: '',
      tipo: '',
      descripcion: '',
      cantidad: '1',
      ubicacion: '',
      estado: 'disponible',
      tipo_arco_id: '',
    }
  }

  return {
    id: articulo.id,
    nombre: articulo.nombre,
    codigo: articulo.codigo || '',
    tipo: articulo.tipo || '',
    descripcion: articulo.descripcion || '',
    cantidad: String(articulo.cantidad),
    ubicacion: articulo.ubicacion || '',
    estado: articulo.estado,
    tipo_arco_id: articulo.tipo_arco_id ? String(articulo.tipo_arco_id) : '',
  }
}

function validar(form, tabla, asignado) {
  if (!form.nombre.trim()) {
    return 'El nombre es obligatorio.'
  }

  if (tabla === 'inventario' && !form.tipo.trim()) {
    return 'El tipo es obligatorio.'
  }

  const cantidad = Number(form.cantidad)

  if (form.cantidad === '' || !Number.isInteger(cantidad) || cantidad < 0) {
    return 'La cantidad debe ser un número entero igual o mayor que 0.'
  }

  if (cantidad < asignado) {
    return `La cantidad no puede ser menor que ${asignado}: hay ${asignado} ${asignado === 1 ? 'unidad asignada' : 'unidades asignadas'}.`
  }

  if (tabla === 'inventario' && normalizarTipo(form.tipo) === 'arco' && !form.tipo_arco_id) {
    return 'Seleccione el tipo de arco.'
  }

  return null
}

function ArticuloForm({ tabla, articulo, tiposArco, tiposExistentes, onCerrar, onGuardado }) {
  const [form, setForm] = useState(() => crearFormInicial(articulo))
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const textos = TEXTOS_TABLA[tabla]
  const asignado = articulo ? articulo.cantidad - articulo.cantidad_disponible : 0
  const esArco = tabla === 'inventario' && normalizarTipo(form.tipo) === 'arco'

  const sugerencias = [...new Set([...TIPOS_SUGERIDOS[tabla], ...tiposExistentes])].sort()

  const tiposArcoOpciones = tiposArco.filter(
    (t) => t.estado === 'activo' || String(t.id) === form.tipo_arco_id
  )

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const guardar = async (e) => {
    e.preventDefault()

    const mensaje = validar(form, tabla, asignado)

    if (mensaje) {
      setError(mensaje)
      return
    }

    setError('')
    setGuardando(true)

    try {
      await guardarArticulo(tabla, form)
      onGuardado(form.id ? textos.actualizado : textos.creado)
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <Modal
      titulo={form.id ? `Editar ${textos.singular}` : textos.nuevo}
      onCerrar={onCerrar}
    >
      <form className="inv-form" onSubmit={guardar} noValidate>
        <div className="inv-form-grid">
          <label className="inv-form-ancho">
            Nombre *
            <input value={form.nombre} maxLength={150} autoFocus onChange={cambiar('nombre')} />
          </label>

          <label>
            Código
            <input value={form.codigo} maxLength={50} onChange={cambiar('codigo')} />
          </label>

          <label>
            Tipo {tabla === 'inventario' && '*'}
            <input
              value={form.tipo}
              maxLength={100}
              list={`tipos-${tabla}`}
              onChange={cambiar('tipo')}
            />
            <datalist id={`tipos-${tabla}`}>
              {sugerencias.map((t) => <option key={t} value={t} />)}
            </datalist>
          </label>

          {esArco && (
            <label className="inv-form-ancho">
              Tipo de arco *
              <select value={form.tipo_arco_id} onChange={cambiar('tipo_arco_id')}>
                <option value="">Seleccione...</option>
                {tiposArcoOpciones.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}{t.estado === 'inactivo' ? ' (inactivo)' : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Cantidad total *
            <input
              type="number"
              min={asignado}
              step={1}
              value={form.cantidad}
              onChange={cambiar('cantidad')}
            />
            {asignado > 0 && (
              <small>Asignadas: {asignado}. No puede ser menor.</small>
            )}
          </label>

          <label>
            Ubicación
            <input value={form.ubicacion} maxLength={150} onChange={cambiar('ubicacion')} />
          </label>

          <label>
            Estado
            <select value={form.estado} onChange={cambiar('estado')}>
              {opcionesEstado(form.estado).map((e) => (
                <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
              ))}
            </select>
          </label>

          <label className="inv-form-ancho">
            Descripción
            <textarea rows={3} value={form.descripcion} onChange={cambiar('descripcion')} />
          </label>
        </div>

        {error && <div className="inv-alerta error">{error}</div>}

        <div className="inv-form-acciones">
          <button type="button" className="inv-btn" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="inv-btn inv-btn-primario" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ArticuloForm
