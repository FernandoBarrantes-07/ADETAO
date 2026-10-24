import { supabase } from '../../lib/supabase'
import { MENSAJE_SIN_PERMISO, traducirError } from '../inventario/errores'

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

function conteoArqueros(arqueros) {
  if (Array.isArray(arqueros)) return arqueros[0]?.count ?? 0
  return arqueros?.count ?? 0
}

export async function listarClubes() {
  const data = verificar(
    await supabase
      .from('clubes')
      .select('id, nombre, ubicacion, descripcion, estado, arqueros(count)')
      .order('nombre')
  )

  return data.map((club) => ({
    ...club,
    arqueros: conteoArqueros(club.arqueros),
  }))
}

export async function guardarClub({ id, nombre, ubicacion, descripcion }) {
  const datos = {
    nombre: nombre.trim(),
    ubicacion: ubicacion?.trim() || null,
    descripcion: descripcion?.trim() || null,
  }

  const consulta = id
    ? supabase.from('clubes').update(datos).eq('id', id)
    : supabase.from('clubes').insert(datos)

  return verificarFila(await consulta.select())
}

export async function cambiarEstadoClub(id, estado) {
  return verificarFila(
    await supabase
      .from('clubes')
      .update({ estado })
      .eq('id', id)
      .select()
  )
}

export async function contarArquerosClub(id) {
  const resultado = await supabase
    .from('arqueros')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', id)

  verificar(resultado)
  return resultado.count ?? 0
}

export async function listarArquerosClub(id, { conIdentificacion }) {
  const columnas = conIdentificacion
    ? 'id, nombre, identificacion, estado'
    : 'id, nombre, estado'

  return verificar(
    await supabase
      .from('arqueros')
      .select(columnas)
      .eq('club_id', id)
      .order('nombre')
  )
}
