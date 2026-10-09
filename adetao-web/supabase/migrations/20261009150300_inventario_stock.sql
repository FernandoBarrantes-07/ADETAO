-- Inventario: control de stock de inventario y piezas a partir de las asignaciones.
--
-- Transiciones de estado de una asignación:
--   activo   -> devuelto : cantidad_disponible += cantidad
--   activo   -> perdido  : cantidad -= cantidad
--   activo   -> dañado   : sin cambio (las unidades siguen fuera)
--   dañado   -> devuelto : cantidad_disponible += cantidad
--   dañado   -> perdido  : cantidad -= cantidad
-- Cualquier otra transición se rechaza.
--
-- inventario.estado = 'prestado' no participa en ninguna regla: lo prestado se
-- deduce de cantidad - cantidad_disponible.

-- -----------------------------------------------------------------------------
-- Asignaciones: alta
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
-- Asignaciones: cambios
-- -----------------------------------------------------------------------------
create or replace function public.asignacion_validar_cambio()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_delta_cantidad integer := 0;
  v_delta_disponible integer := 0;
begin
  if new.cantidad is distinct from old.cantidad then
    raise exception 'No se puede modificar la cantidad de una asignación. Registre la devolución y cree una nueva asignación.';
  end if;

  if new.arquero_id is distinct from old.arquero_id then
    raise exception 'No se puede cambiar el arquero de una asignación.';
  end if;

  if tg_table_name = 'asignaciones' then
    if new.inventario_id is distinct from old.inventario_id then
      raise exception 'No se puede cambiar el artículo de una asignación.';
    end if;
  else
    if new.pieza_id is distinct from old.pieza_id then
      raise exception 'No se puede cambiar la pieza de una asignación.';
    end if;
  end if;

  if new.registrado_por is distinct from old.registrado_por then
    raise exception 'No se puede cambiar quién registró una asignación.';
  end if;

  if new.estado = old.estado then
    return new;
  end if;

  if old.estado in ('activo', 'dañado') and new.estado = 'devuelto' then
    v_delta_disponible := old.cantidad;
  elsif old.estado in ('activo', 'dañado') and new.estado = 'perdido' then
    v_delta_cantidad := -old.cantidad;
  elsif old.estado = 'activo' and new.estado = 'dañado' then
    null;
  else
    raise exception 'Transición de estado no permitida: de "%" a "%".', old.estado, new.estado;
  end if;

  if new.estado = 'devuelto' and new.fecha_devolucion is null then
    new.fecha_devolucion := now();
  end if;

  if v_delta_cantidad <> 0 or v_delta_disponible <> 0 then
    if tg_table_name = 'asignaciones' then
      update public.inventario
        set cantidad = cantidad + v_delta_cantidad,
            cantidad_disponible = cantidad_disponible + v_delta_disponible
        where id = old.inventario_id;
    else
      update public.piezas
        set cantidad = cantidad + v_delta_cantidad,
            cantidad_disponible = cantidad_disponible + v_delta_disponible
        where id = old.pieza_id;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_asignaciones_validar_alta
  before insert on public.asignaciones
  for each row
  execute function public.asignacion_validar_alta();

create trigger trg_asignaciones_validar_cambio
  before update on public.asignaciones
  for each row
  execute function public.asignacion_validar_cambio();

create trigger trg_asignaciones_piezas_validar_alta
  before insert on public.asignaciones_piezas
  for each row
  execute function public.asignacion_validar_alta();

create trigger trg_asignaciones_piezas_validar_cambio
  before update on public.asignaciones_piezas
  for each row
  execute function public.asignacion_validar_cambio();

-- -----------------------------------------------------------------------------
-- inventario y piezas: control de cantidades
-- -----------------------------------------------------------------------------
-- Solo los triggers de asignación (pg_trigger_depth() > 1) pueden mover
-- cantidad y cantidad_disponible sin pasar por estas reglas. Si otro trigger
-- llegara a actualizar inventario o piezas, también quedaría exento.
create or replace function public.articulo_control_stock()
  returns trigger
  language plpgsql
as $$
declare
  v_asignado integer;
begin
  if tg_op = 'INSERT' then
    new.cantidad_disponible := new.cantidad;
    return new;
  end if;

  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if new.cantidad_disponible is distinct from old.cantidad_disponible then
    raise exception 'La cantidad disponible no se puede modificar directamente; se calcula a partir de las asignaciones.';
  end if;

  if new.cantidad is distinct from old.cantidad then
    v_asignado := old.cantidad - old.cantidad_disponible;

    if new.cantidad < v_asignado then
      raise exception 'No se puede reducir la cantidad de "%" a %: hay % unidades asignadas.',
        old.nombre, new.cantidad, v_asignado;
    end if;

    new.cantidad_disponible := old.cantidad_disponible + (new.cantidad - old.cantidad);
  end if;

  return new;
end;
$$;

create trigger trg_inventario_control_stock
  before insert or update on public.inventario
  for each row
  execute function public.articulo_control_stock();

create trigger trg_piezas_control_stock
  before insert or update on public.piezas
  for each row
  execute function public.articulo_control_stock();
