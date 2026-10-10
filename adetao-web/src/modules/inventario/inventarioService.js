import { supabase } from '../../lib/supabase'
import { MENSAJE_SIN_PERMISO, traducirError } from './errores'

export const TABLAS_ARTICULO = ['inventario', 'piezas']

function verificar({ data, error }) {
  if (error) {
    throw new Error(traducirError(error))
  }
  return data
}

function verificarFila(resultado) {
  const data = verificar(resultado)
  if (!data || data.length === 0) {
    throw new Error(MENSAJE_SIN_PERMISO)
  }
  return data[0]
}

function validarTabla(tabla) {
  if (!TABLAS_ARTICULO.includes(tabla)) {
    throw new Error(`Tabla de artículos no válida: ${tabla}`)
  }
}

// -----------------------------------------------------------------------------
// Tipos de arco
// -----------------------------------------------------------------------------
export async function listarTiposArco() {
  return verificar(
    await supabase
      .from('tipos_arco')
      .select('id, nombre, descripcion, estado')
      .order('nombre')
  )
}

export async function guardarTipoArco({ id, nombre, descripcion }) {
  const datos = {
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || null,
  }

  const consulta = id
    ? supabase.from('tipos_arco').update(datos).eq('id', id)
    : supabase.from('tipos_arco').insert(datos)

  return verificarFila(await consulta.select())
}

export async function cambiarEstadoTipoArco(id, estado) {
  return verificarFila(
    await supabase
      .from('tipos_arco')
      .update({ estado })
      .eq('id', id)
      .select()
  )
}

export async function contarUsoTipoArco(id) {
  const [arqueros, inventario] = await Promise.all([
    supabase
      .from('arqueros')
      .select('id', { count: 'exact', head: true })
      .eq('tipo_arco_id', id),
    supabase
      .from('inventario')
      .select('id', { count: 'exact', head: true })
      .eq('tipo_arco_id', id),
  ])

  verificar(arqueros)
  verificar(inventario)

  return {
    arqueros: arqueros.count ?? 0,
    inventario: inventario.count ?? 0,
  }
}

// -----------------------------------------------------------------------------
// Inventario y piezas
// -----------------------------------------------------------------------------
export async function listarArticulos(tabla) {
  validarTabla(tabla)

  const columnas = tabla === 'inventario'
    ? 'id, nombre, codigo, tipo, descripcion, cantidad, cantidad_disponible, ubicacion, estado, tipo_arco_id, tipos_arco(nombre)'
    : 'id, nombre, codigo, tipo, descripcion, cantidad, cantidad_disponible, ubicacion, estado'

  return verificar(
    await supabase
      .from(tabla)
      .select(columnas)
      .order('nombre')
  )
}

export function normalizarTipo(tipo) {
  return (tipo || '').trim().toLowerCase()
}

export async function guardarArticulo(tabla, articulo) {
  validarTabla(tabla)

  const tipo = normalizarTipo(articulo.tipo)

  const datos = {
    nombre: articulo.nombre.trim(),
    codigo: articulo.codigo?.trim() || null,
    tipo: tipo || null,
    descripcion: articulo.descripcion?.trim() || null,
    cantidad: Number(articulo.cantidad),
    ubicacion: articulo.ubicacion?.trim() || null,
    estado: articulo.estado,
  }

  if (tabla === 'inventario') {
    datos.tipo_arco_id = tipo === 'arco' ? Number(articulo.tipo_arco_id) || null : null
  }

  const consulta = articulo.id
    ? supabase.from(tabla).update(datos).eq('id', articulo.id)
    : supabase.from(tabla).insert(datos)

  return verificarFila(await consulta.select())
}

export async function cambiarEstadoArticulo(tabla, id, estado) {
  validarTabla(tabla)

  return verificarFila(
    await supabase
      .from(tabla)
      .update({ estado })
      .eq('id', id)
      .select()
  )
}

// -----------------------------------------------------------------------------
// Arqueros (tabla del módulo de arqueros: solo lectura)
// -----------------------------------------------------------------------------
export async function listarArqueros({ soloActivos = false } = {}) {
  let consulta = supabase
    .from('arqueros')
    .select('id, nombre, identificacion, estado')
    .order('nombre')

  if (soloActivos) {
    consulta = consulta.eq('estado', 'activo')
  }

  return verificar(await consulta)
}

// -----------------------------------------------------------------------------
// Préstamos (asignaciones y asignaciones_piezas) e historial
// -----------------------------------------------------------------------------
const TABLAS_PRESTAMO = {
  inventario: { tabla: 'asignaciones', columna: 'inventario_id' },
  pieza: { tabla: 'asignaciones_piezas', columna: 'pieza_id' },
}

function tablaPrestamo(tipoRegistro) {
  const destino = TABLAS_PRESTAMO[tipoRegistro]
  if (!destino) {
    throw new Error(`Tipo de préstamo no válido: ${tipoRegistro}`)
  }
  return destino
}

const COLUMNAS_HISTORIAL = [
  'tipo_registro', 'asignacion_id', 'articulo_id', 'articulo_codigo', 'articulo_nombre',
  'arquero_id', 'arquero_nombre', 'arquero_identificacion', 'cantidad', 'fecha_asignacion',
  'fecha_devolucion', 'estado', 'observaciones', 'registrado_por', 'registrado_por_nombre',
].join(', ')

export async function listarHistorial({ arqueroId, tipoRegistro, articuloId } = {}) {
  let consulta = supabase
    .from('v_historial_asignaciones')
    .select(COLUMNAS_HISTORIAL)
    .order('fecha_asignacion', { ascending: false })
    .order('asignacion_id', { ascending: false })

  if (arqueroId) consulta = consulta.eq('arquero_id', arqueroId)
  if (tipoRegistro) consulta = consulta.eq('tipo_registro', tipoRegistro)
  if (articuloId) consulta = consulta.eq('articulo_id', articuloId)

  return verificar(await consulta)
}

export async function crearPrestamo({ tipoRegistro, articuloId, arqueroId, cantidad, observaciones }) {
  const { tabla, columna } = tablaPrestamo(tipoRegistro)

  return verificarFila(
    await supabase
      .from(tabla)
      .insert({
        arquero_id: Number(arqueroId),
        [columna]: Number(articuloId),
        cantidad: Number(cantidad),
        observaciones: observaciones?.trim() || null,
      })
      .select('id')
  )
}

export function agregarObservacion(previas, registro, fecha, texto) {
  const dia = new Date(fecha).toLocaleDateString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const linea = `[${dia} ${registro}]${texto?.trim() ? ` ${texto.trim()}` : ''}`
  return previas?.trim() ? `${previas.trim()}\n${linea}` : linea
}

// La fecha_devolucion de un préstamo dañado es la de cuando el arquero lo
// entregó; al repararlo o darlo de baja se conserva y la fecha queda en la nota.
export async function registrarDevolucion({ prestamo, opcion, fecha, observaciones }) {
  const { tabla } = tablaPrestamo(prestamo.tipo_registro)

  const data = verificar(
    await supabase
      .from(tabla)
      .update({
        estado: opcion.estado,
        fecha_devolucion: prestamo.fecha_devolucion ?? new Date(fecha).toISOString(),
        observaciones: agregarObservacion(prestamo.observaciones, opcion.registro, fecha, observaciones),
      })
      .eq('id', prestamo.asignacion_id)
      .eq('estado', prestamo.estado)
      .select('id')
  )

  if (data.length > 0) return data[0]

  const { data: actual } = await supabase
    .from(tabla)
    .select('estado')
    .eq('id', prestamo.asignacion_id)
    .maybeSingle()

  if (actual && actual.estado !== prestamo.estado) {
    const error = new Error(`Este préstamo ya se registró como "${actual.estado}". Actualice la lista.`)
    error.listaDesactualizada = true
    throw error
  }
  throw new Error(MENSAJE_SIN_PERMISO)
}
