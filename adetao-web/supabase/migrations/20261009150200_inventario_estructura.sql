-- Inventario: estructura de inventario, piezas y asignaciones.

-- inventario: relación con el catálogo de tipos de arco
alter table public.inventario
  add column tipo_arco_id bigint;

alter table public.inventario
  add constraint inventario_tipo_arco_id_fkey foreign key (tipo_arco_id)
  references public.tipos_arco(id) on update cascade on delete restrict;

alter table public.inventario
  add constraint inventario_arco_tipo_arco_check
  check (lower(btrim(tipo)) <> 'arco' or tipo_arco_id is not null);

create index idx_inventario_tipo_arco on public.inventario using btree (tipo_arco_id);

-- piezas: código y ubicación
alter table public.piezas
  add column codigo character varying(50),
  add column ubicacion character varying(150);

alter table public.piezas
  add constraint piezas_codigo_unique unique (codigo);

-- asignaciones y asignaciones_piezas: estado como enum
alter table public.asignaciones
  alter column estado drop default;

alter table public.asignaciones
  alter column estado type public.estado_asignacion
  using (
    case lower(btrim(estado))
      when 'activa' then 'activo'
      when 'devuelta' then 'devuelto'
      when 'perdida' then 'perdido'
      when 'danado' then 'dañado'
      when 'dañada' then 'dañado'
      when 'danada' then 'dañado'
      else lower(btrim(estado))
    end
  )::public.estado_asignacion;

alter table public.asignaciones
  alter column estado set default 'activo';

alter table public.asignaciones_piezas
  alter column estado drop default;

alter table public.asignaciones_piezas
  alter column estado type public.estado_asignacion
  using (
    case lower(btrim(estado))
      when 'activa' then 'activo'
      when 'devuelta' then 'devuelto'
      when 'perdida' then 'perdido'
      when 'danado' then 'dañado'
      when 'dañada' then 'dañado'
      when 'danada' then 'dañado'
      else lower(btrim(estado))
    end
  )::public.estado_asignacion;

alter table public.asignaciones_piezas
  alter column estado set default 'activo';

-- fechas y estado devuelto
alter table public.asignaciones
  add constraint asignaciones_fechas_check
  check (fecha_devolucion is null or fecha_devolucion >= fecha_asignacion),
  add constraint asignaciones_devuelto_fecha_check
  check (estado <> 'devuelto' or fecha_devolucion is not null);

alter table public.asignaciones_piezas
  add constraint asignaciones_piezas_fechas_check
  check (fecha_devolucion is null or fecha_devolucion >= fecha_asignacion),
  add constraint asignaciones_piezas_devuelto_fecha_check
  check (estado <> 'devuelto' or fecha_devolucion is not null);

-- el historial no se pierde al intentar borrar un arquero
alter table public.asignaciones
  drop constraint asignaciones_arquero_id_fkey;

alter table public.asignaciones
  add constraint asignaciones_arquero_id_fkey foreign key (arquero_id)
  references public.arqueros(id) on update cascade on delete restrict;

alter table public.asignaciones_piezas
  drop constraint asignaciones_piezas_arquero_id_fkey;

alter table public.asignaciones_piezas
  add constraint asignaciones_piezas_arquero_id_fkey foreign key (arquero_id)
  references public.arqueros(id) on update cascade on delete restrict;

-- índices
create index idx_asignaciones_piezas_arquero on public.asignaciones_piezas using btree (arquero_id);
create index idx_asignaciones_piezas_pieza on public.asignaciones_piezas using btree (pieza_id);
create index idx_asignaciones_registrado_por on public.asignaciones using btree (registrado_por);
create index idx_asignaciones_piezas_registrado_por on public.asignaciones_piezas using btree (registrado_por);

-- registrado_por automático
alter table public.asignaciones
  alter column registrado_por set default auth.uid();

alter table public.asignaciones_piezas
  alter column registrado_por set default auth.uid();
