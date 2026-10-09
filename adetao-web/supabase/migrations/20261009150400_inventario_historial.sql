-- Inventario: historial unificado de asignaciones de inventario y piezas.
-- security_invoker hace que la vista respete el RLS de quien la consulta.

create view public.v_historial_asignaciones
  with (security_invoker = true)
as
select
  'inventario'::text   as tipo_registro,
  a.id                 as asignacion_id,
  a.inventario_id      as articulo_id,
  i.codigo             as articulo_codigo,
  i.nombre             as articulo_nombre,
  i.tipo               as articulo_tipo,
  a.arquero_id,
  ar.nombre            as arquero_nombre,
  ar.identificacion    as arquero_identificacion,
  a.cantidad,
  a.fecha_asignacion,
  a.fecha_devolucion,
  a.estado,
  a.observaciones,
  a.registrado_por,
  p.nombre             as registrado_por_nombre,
  a.created_at,
  a.updated_at
from public.asignaciones a
left join public.inventario i on i.id = a.inventario_id
left join public.arqueros ar on ar.id = a.arquero_id
left join public.perfiles p on p.id = a.registrado_por

union all

select
  'pieza'::text        as tipo_registro,
  ap.id                as asignacion_id,
  ap.pieza_id          as articulo_id,
  pz.codigo            as articulo_codigo,
  pz.nombre            as articulo_nombre,
  pz.tipo              as articulo_tipo,
  ap.arquero_id,
  ar.nombre            as arquero_nombre,
  ar.identificacion    as arquero_identificacion,
  ap.cantidad,
  ap.fecha_asignacion,
  ap.fecha_devolucion,
  ap.estado,
  ap.observaciones,
  ap.registrado_por,
  p.nombre             as registrado_por_nombre,
  ap.created_at,
  ap.updated_at
from public.asignaciones_piezas ap
left join public.piezas pz on pz.id = ap.pieza_id
left join public.arqueros ar on ar.id = ap.arquero_id
left join public.perfiles p on p.id = ap.registrado_por;

revoke all on public.v_historial_asignaciones from anon, authenticated;
grant select on public.v_historial_asignaciones to authenticated, service_role;
