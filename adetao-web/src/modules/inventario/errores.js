const MENSAJES_UNIQUE = {
  tipos_arco_nombre_unique: 'Ya existe un tipo de arco con ese nombre.',
  inventario_codigo_unique: 'Ya existe un artículo con ese código.',
  piezas_codigo_unique: 'Ya existe una pieza con ese código.',
}

const MENSAJES_CHECK = {
  inventario_arco_tipo_arco_check: 'Los arcos deben tener un tipo de arco.',
  inventario_cantidad_check: 'La cantidad no puede ser negativa.',
  piezas_cantidad_check: 'La cantidad no puede ser negativa.',
}

export const MENSAJE_SIN_PERMISO = 'No tiene permisos para realizar esta acción.'

export function traducirError(error) {
  if (!error) return null

  const mensaje = error.message || ''

  if (error.code === '23505') {
    const constraint = Object.keys(MENSAJES_UNIQUE).find((c) => mensaje.includes(c))
    return constraint ? MENSAJES_UNIQUE[constraint] : 'Ya existe un registro con esos datos.'
  }

  if (error.code === '23514') {
    const constraint = Object.keys(MENSAJES_CHECK).find((c) => mensaje.includes(c))
    return constraint ? MENSAJES_CHECK[constraint] : 'Los datos no cumplen las reglas del sistema.'
  }

  if (error.code === '23503') {
    return 'El registro está relacionado con otros datos y no se puede modificar así.'
  }

  if (error.code === '42501') {
    return MENSAJE_SIN_PERMISO
  }

  if (error.code === 'P0001') {
    return mensaje
  }

  if (mensaje.includes('Failed to fetch')) {
    return 'No se pudo conectar con el servidor. Revise su conexión.'
  }

  return 'Ocurrió un error inesperado. Intente de nuevo.'
}
