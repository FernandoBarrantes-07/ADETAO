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
