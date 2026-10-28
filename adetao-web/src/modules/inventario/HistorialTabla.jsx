import { ESTADOS_PENDIENTES, TIPOS_REGISTRO, etiquetaAsignacion, formatearFecha } from './constantes'

// El RLS de perfiles solo deja leer el perfil propio: el nombre de quien
// registró llega nulo en los movimientos de otras personas.
function RegistradoPor({ fila }) {
  if (fila.registrado_por_nombre) return fila.registrado_por_nombre
  return (
    <span className="inv-texto-tenue" title="Nombre no disponible">—</span>
  )
}

function HistorialTabla({
  filas,
  mostrarArquero = true,
  mostrarArticulo = true,
  mostrarObservaciones = false,
  mostrarRegistradoPor = true,
  onDevolver,
}) {
  return (
    <div className="inv-tabla-contenedor">
      <table className="inv-tabla">
        <thead>
          <tr>
            {mostrarArquero && <th>Arquero</th>}
            {mostrarArticulo && <th>Artículo o pieza</th>}
            <th className="inv-col-numero">Cantidad</th>
            <th>Prestado</th>
            <th>Devuelto</th>
            <th>Estado</th>
            {mostrarRegistradoPor && <th>Registrado por</th>}
            {mostrarObservaciones && <th>Observaciones</th>}
            {onDevolver && <th className="inv-col-acciones">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={`${f.tipo_registro}-${f.asignacion_id}`}>
              {mostrarArquero && (
                <td data-label="Arquero">
                  <div>
                    <strong>{f.arquero_nombre}</strong>
                    <small className="inv-descripcion">{f.arquero_identificacion}</small>
                  </div>
                </td>
              )}
              {mostrarArticulo && (
                <td data-label="Artículo o pieza">
                  <div>
                    <strong>{f.articulo_nombre}</strong>
                    <small className="inv-descripcion">
                      {TIPOS_REGISTRO[f.tipo_registro]?.etiqueta}
                      {f.articulo_codigo ? ` · ${f.articulo_codigo}` : ''}
                    </small>
                  </div>
                </td>
              )}
              <td data-label="Cantidad" className="inv-col-numero">{f.cantidad}</td>
              <td data-label="Prestado" className="inv-col-fecha">{formatearFecha(f.fecha_asignacion)}</td>
              <td data-label="Devuelto" className="inv-col-fecha">{formatearFecha(f.fecha_devolucion)}</td>
              <td data-label="Estado">
                <span className={`inv-badge asig-${f.estado}`}>{etiquetaAsignacion(f.estado)}</span>
              </td>
              {mostrarRegistradoPor && (
                <td data-label="Registrado por"><RegistradoPor fila={f} /></td>
              )}
              {mostrarObservaciones && (
                <td data-label="Observaciones" className="inv-observaciones">
                  {f.observaciones || '—'}
                </td>
              )}
              {onDevolver && (
                <td className="inv-col-acciones">
                  {ESTADOS_PENDIENTES.includes(f.estado) && (
                    <button className="inv-btn" onClick={() => onDevolver(f)}>
                      {f.estado === 'dañado' ? 'Cerrar' : 'Devolver'}
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default HistorialTabla
