-- Inventario: reglas de préstamo.
--
-- - tipos_arco ya no se elimina; solo se desactiva (estado = 'inactivo').
-- - Un artículo nuevo o un cambio de tipo_arco_id exige un tipo de arco activo.
--   Un artículo que ya tenía un tipo que después se desactivó se puede seguir
--   editando mientras no cambie de tipo.
-- - Solo se presta a arqueros activos (lectura de arqueros.estado, tabla del
--   módulo de arqueros). Las devoluciones no dependen del estado del arquero.
-- - Con unidades prestadas (asignaciones activo o dañado), un artículo no puede
--   pasar a mantenimiento, dañado o perdido: primero se registra la devolución.
-- - 'prestado' lo calcula el trigger: un artículo en disponible/prestado queda
--   'prestado' cuando cantidad > 0 y cantidad_disponible = 0, y vuelve a
--   'disponible' cuando hay unidades disponibles (o cuando cantidad llega a 0
--   porque se perdieron todas). No se puede elegir a mano.
-- - anon pierde todos los privilegios sobre las tablas del módulo.

-- -----------------------------------------------------------------------------
-- Datos: 'prestado' coherente con el stock. Va antes de reemplazar
-- articulo_control_stock(), que rechaza poner 'prestado' a mano.
-- -----------------------------------------------------------------------------
update public.inventario
  set estado = case when cantidad > 0 and cantidad_disponible = 0
                 then 'prestado' else 'disponible' end::public.inventory_status
  where estado in ('disponible', 'prestado')
    and estado <> case when cantidad > 0 and cantidad_disponible = 0
                   then 'prestado' else 'disponible' end::public.inventory_status;

update public.piezas
  set estado = case when cantidad > 0 and cantidad_disponible = 0
                 then 'prestado' else 'disponible' end::public.inventory_status
  where estado in ('disponible', 'prestado')
    and estado <> case when cantidad > 0 and cantidad_disponible = 0
                   then 'prestado' else 'disponible' end::public.inventory_status;

-- -----------------------------------------------------------------------------
-- Asignaciones: alta (agrega la validación de arquero activo)
-- -----------------------------------------------------------------------------
create or replace function public.asignacion_validar_alta()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_nombre text;
  v_estado public.inventory_status;
  v_disponible integer;
  v_arquero text;
  v_arquero_estado public.record_status;
begin
  if new.estado is distinct from 'activo' then
    raise exception 'Una asignación nueva debe registrarse con estado "activo".';
  end if;

  if new.fecha_devolucion is not null then
    raise exception 'Una asignación nueva no puede tener fecha de devolución.';
  end if;

  if auth.uid() is not null then
    new.registrado_por := auth.uid();
  end if;

  select ar.nombre, ar.estado
    into v_arquero, v_arquero_estado
    from public.arqueros ar
    where ar.id = new.arquero_id;

  if not found then
    raise exception 'El arquero indicado no existe.';
  end if;

  if v_arquero_estado <> 'activo' then
    raise exception 'No se puede prestar a "%": el arquero está inactivo.', v_arquero;
  end if;

  if tg_table_name = 'asignaciones' then
    select i.nombre, i.estado, i.cantidad_disponible
      into v_nombre, v_estado, v_disponible
      from public.inventario i
      where i.id = new.inventario_id
      for update;
  else
    select p.nombre, p.estado, p.cantidad_disponible
      into v_nombre, v_estado, v_disponible
      from public.piezas p
      where p.id = new.pieza_id
      for update;
  end if;

  if not found then
    raise exception 'El artículo indicado no existe.';
  end if;

  if v_estado in ('mantenimiento', 'dañado', 'no_disponible', 'perdido') then
    raise exception 'No se puede asignar "%": el artículo está en estado "%".', v_nombre, v_estado;
  end if;

  if v_disponible < new.cantidad then
    raise exception 'Stock insuficiente para "%": se solicitaron % y hay % disponibles.',
      v_nombre, new.cantidad, v_disponible;
  end if;

  if tg_table_name = 'asignaciones' then
    update public.inventario
      set cantidad_disponible = cantidad_disponible - new.cantidad
      where id = new.inventario_id;
  else
    update public.piezas
      set cantidad_disponible = cantidad_disponible - new.cantidad
      where id = new.pieza_id;
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- inventario y piezas: control de cantidades y de estado
-- -----------------------------------------------------------------------------
-- Las reglas de cantidades y de cambio manual de estado solo aplican a cambios
-- directos (pg_trigger_depth() = 1). El cálculo de 'prestado' aplica siempre,
-- también cuando el cambio viene del trigger de una asignación.
create or replace function public.articulo_control_stock()
  returns trigger
  language plpgsql
as $$
declare
  v_asignado integer;
begin
  if tg_op = 'INSERT' then
    if new.estado = 'prestado' then
      raise exception 'El estado "prestado" se asigna automáticamente cuando no quedan unidades disponibles; no se puede elegir a mano.';
    end if;

    new.cantidad_disponible := new.cantidad;
    return new;
  end if;

  if pg_trigger_depth() <= 1 then
    if new.cantidad_disponible is distinct from old.cantidad_disponible then
      raise exception 'La cantidad disponible no se puede modificar directamente; se calcula a partir de las asignaciones.';
    end if;

    v_asignado := old.cantidad - old.cantidad_disponible;

    if new.estado is distinct from old.estado then
      if new.estado = 'prestado' then
        raise exception 'El estado "prestado" se asigna automáticamente cuando no quedan unidades disponibles; no se puede elegir a mano.';
      end if;

      if v_asignado > 0 and new.estado in ('mantenimiento', 'dañado', 'perdido') then
        raise exception 'No se puede cambiar "%" a "%": hay % unidades prestadas. Primero registre la devolución.',
          old.nombre, new.estado, v_asignado;
      end if;
    end if;

    if new.cantidad is distinct from old.cantidad then
      if new.cantidad < v_asignado then
        raise exception 'No se puede reducir la cantidad de "%" a %: hay % unidades asignadas.',
          old.nombre, new.cantidad, v_asignado;
      end if;

      new.cantidad_disponible := old.cantidad_disponible + (new.cantidad - old.cantidad);
    end if;
  end if;

  if new.estado in ('disponible', 'prestado') then
    new.estado := case
      when new.cantidad > 0 and new.cantidad_disponible = 0 then 'prestado'::public.inventory_status
      else 'disponible'::public.inventory_status
    end;
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- inventario: el tipo de arco asignado debe estar activo
-- -----------------------------------------------------------------------------
create or replace function public.inventario_validar_tipo_arco()
  returns trigger
  language plpgsql
  set search_path = public
as $$
declare
  v_nombre text;
  v_estado public.record_status;
begin
  if new.tipo_arco_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.tipo_arco_id is not distinct from old.tipo_arco_id then
    return new;
  end if;

  select t.nombre, t.estado
    into v_nombre, v_estado
    from public.tipos_arco t
    where t.id = new.tipo_arco_id;

  if found and v_estado <> 'activo' then
    raise exception 'El tipo de arco "%" está inactivo. Elija un tipo de arco activo.', v_nombre;
  end if;

  return new;
end;
$$;

create trigger trg_inventario_validar_tipo_arco
  before insert or update of tipo_arco_id on public.inventario
  for each row
  execute function public.inventario_validar_tipo_arco();

-- -----------------------------------------------------------------------------
-- tipos_arco: sin DELETE (se desactiva)
-- -----------------------------------------------------------------------------
drop policy "tipos_arco: admin elimina" on public.tipos_arco;

-- -----------------------------------------------------------------------------
-- anon: sin privilegios sobre las tablas del módulo
-- -----------------------------------------------------------------------------
revoke all on table
  public.inventario,
  public.piezas,
  public.asignaciones,
  public.asignaciones_piezas,
  public.tipos_arco
from anon;
