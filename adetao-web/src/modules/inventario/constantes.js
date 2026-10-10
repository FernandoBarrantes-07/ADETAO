export const ESTADOS_ARTICULO = [
  { valor: 'disponible', etiqueta: 'Disponible' },
  { valor: 'mantenimiento', etiqueta: 'Mantenimiento' },
  { valor: 'dañado', etiqueta: 'Dañado' },
  { valor: 'no_disponible', etiqueta: 'No disponible' },
  { valor: 'perdido', etiqueta: 'Perdido' },
]

// 'prestado' lo calcula la BD cuando no quedan unidades disponibles; no se elige a mano.
export const ESTADOS_FILTRO = [...ESTADOS_ARTICULO, { valor: 'prestado', etiqueta: 'Prestado' }]

// Con unidades prestadas la BD rechaza estos estados hasta registrar la devolución.
const ESTADOS_BLOQUEADOS_CON_PRESTAMOS = ['mantenimiento', 'dañado', 'perdido']

export const AVISO_DEVOLUCION = 'Primero registre la devolución'

const ETIQUETAS_ESTADO = Object.fromEntries(ESTADOS_FILTRO.map((e) => [e.valor, e.etiqueta]))

export function etiquetaEstado(estado) {
  return ETIQUETAS_ESTADO[estado] || estado
}

export function opcionesEstado(estadoActual, unidadesPrestadas = 0) {
  const opciones = ESTADOS_ARTICULO.map((e) => {
    const bloqueado = unidadesPrestadas > 0
      && e.valor !== estadoActual
      && ESTADOS_BLOQUEADOS_CON_PRESTAMOS.includes(e.valor)

    return bloqueado
      ? { ...e, etiqueta: `${e.etiqueta} — ${AVISO_DEVOLUCION}`, deshabilitado: true }
      : e
  })

  if (estadoActual && !ESTADOS_ARTICULO.some((e) => e.valor === estadoActual)) {
    opciones.push({ valor: estadoActual, etiqueta: etiquetaEstado(estadoActual), deshabilitado: true })
  }

  return opciones
}

export const TIPOS_SUGERIDOS = {
  inventario: ['arco', 'diana', 'carcaj', 'protector', 'estabilizador'],
  piezas: ['flecha', 'cuerda', 'visor', 'accesorio', 'pala', 'empuñadura'],
}

export const TEXTOS_TABLA = {
  inventario: {
    singular: 'artículo',
    titulo: 'Artículos',
    nuevo: 'Nuevo artículo',
    creado: 'Artículo registrado.',
    actualizado: 'Artículo actualizado.',
    vacio: 'No hay artículos registrados.',
    sinResultados: 'Ningún artículo coincide con los filtros.',
  },
  piezas: {
    singular: 'pieza',
    titulo: 'Piezas',
    nuevo: 'Nueva pieza',
    creado: 'Pieza registrada.',
    actualizado: 'Pieza actualizada.',
    vacio: 'No hay piezas registradas.',
    sinResultados: 'Ninguna pieza coincide con los filtros.',
  },
}
