-- Inventario: normalización de inventory_status y estados de asignación.
-- Va en su propio archivo porque un valor agregado con ADD VALUE no puede
-- usarse dentro de la misma transacción.

alter type public.inventory_status rename value 'No disponible' to 'no_disponible';

alter type public.inventory_status add value if not exists 'perdido';

create type public.estado_asignacion as enum (
  'activo',
  'devuelto',
  'perdido',
  'dañado'
);
