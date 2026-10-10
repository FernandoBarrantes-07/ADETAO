export const ESTADOS_ARTICULO = [
  { valor: 'disponible', etiqueta: 'Disponible' },
  { valor: 'mantenimiento', etiqueta: 'Mantenimiento' },
  { valor: 'dañado', etiqueta: 'Dañado' },
  { valor: 'no_disponible', etiqueta: 'No disponible' },
  { valor: 'perdido', etiqueta: 'Perdido' },
]

// 'prestado' existe en el enum pero no participa en las reglas de stock.
const ETIQUETAS_ESTADO = {
  ...Object.fromEntries(ESTADOS_ARTICULO.map((e) => [e.valor, e.etiqueta])),
  prestado: 'Prestado',
}

export function etiquetaEstado(estado) {
  return ETIQUETAS_ESTADO[estado] || estado
}

export function opcionesEstado(estadoActual) {
  if (estadoActual && !ESTADOS_ARTICULO.some((e) => e.valor === estadoActual)) {
    return [...ESTADOS_ARTICULO, { valor: estadoActual, etiqueta: etiquetaEstado(estadoActual) }]
  }
  return ESTADOS_ARTICULO
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
