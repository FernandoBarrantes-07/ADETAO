-- Inventario: un artículo cuya cantidad llega a 0 porque se perdieron todas sus
-- unidades prestadas queda 'perdido' automáticamente.
--
-- Solo el trigger de una asignación (activo/dañado -> perdido) baja cantidad con
-- pg_trigger_depth() > 1; bajar la cantidad a 0 a mano no es una pérdida y sigue
-- las reglas de siempre.

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
  elsif new.cantidad = 0 and old.cantidad > 0 then
    new.estado := 'perdido';
    return new;
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
