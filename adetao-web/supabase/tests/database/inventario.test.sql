-- Pruebas del módulo de inventario: reglas de stock, transiciones de estado,
-- control de cantidades en inventario y piezas, y RLS por rol.
-- Ejecutar con: npx supabase test db

begin;

create extension if not exists pgtap with schema extensions;

select plan(75);

-- -----------------------------------------------------------------------------
-- Datos de prueba (como postgres)
-- admin    11111111-...  administrador
-- profe    22222222-...  profesor
-- usuario1 33333333-...  usuario vinculado al arquero 1001
-- usuario2 44444444-...  usuario sin arquero
-- -----------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin@prueba.test'),
  ('22222222-2222-2222-2222-222222222222', 'profe@prueba.test'),
  ('33333333-3333-3333-3333-333333333333', 'usuario1@prueba.test'),
  ('44444444-4444-4444-4444-444444444444', 'usuario2@prueba.test');

update public.perfiles set rol = 'administrador' where id = '11111111-1111-1111-1111-111111111111';
update public.perfiles set rol = 'profesor' where id = '22222222-2222-2222-2222-222222222222';

insert into public.arqueros (id, nombre, identificacion) values
  (1001, 'Arquero Uno', 'A-1001'),
  (1002, 'Arquero Dos', 'A-1002');

update public.perfiles set arquero_id = 1001 where id = '33333333-3333-3333-3333-333333333333';

insert into public.tipos_arco (id, nombre) values (1001, 'Recurvo de prueba');

insert into public.inventario (id, nombre, codigo, tipo, tipo_arco_id, cantidad) values
  (1001, 'Arco recurvo', 'INV-1001', 'arco', 1001, 5),
  (1002, 'Diana', 'INV-1002', 'diana', null, 2);

insert into public.inventario (id, nombre, codigo, tipo, cantidad, estado) values
  (1003, 'Visor en mantenimiento', 'INV-1003', 'visor', 3, 'mantenimiento');

insert into public.piezas (id, nombre, codigo, cantidad) values
  (1001, 'Flecha', 'PZ-1001', 10);

-- -----------------------------------------------------------------------------
-- Estructura y control directo de cantidades (postgres, profundidad 1)
-- -----------------------------------------------------------------------------
select is((select cantidad_disponible from public.inventario where id = 1001), 5,
  'Al crear un artículo, cantidad_disponible = cantidad');

select is((select cantidad_disponible from public.piezas where id = 1001), 10,
  'Al crear una pieza, cantidad_disponible = cantidad');

select throws_ok(
  $$insert into public.inventario (nombre, codigo, tipo, cantidad) values ('Arco sin tipo', 'INV-X', 'Arco', 1)$$,
  '23514',
  null,
  'Un arco sin tipo_arco_id se rechaza');

select throws_like(
  $$update public.inventario set cantidad_disponible = 4 where id = 1001$$,
  'La cantidad disponible no se puede modificar directamente%',
  'UPDATE directo de cantidad_disponible en inventario se rechaza aunque lo haga postgres (pg_trigger_depth = 1)');

select throws_like(
  $$update public.piezas set cantidad_disponible = 9 where id = 1001$$,
  'La cantidad disponible no se puede modificar directamente%',
  'UPDATE directo de cantidad_disponible en piezas se rechaza aunque lo haga postgres (pg_trigger_depth = 1)');

select lives_ok(
  $$update public.inventario set cantidad = 7 where id = 1001$$,
  'Subir cantidad está permitido');

select is((select cantidad_disponible from public.inventario where id = 1001), 7,
  'Subir cantidad ajusta cantidad_disponible con la misma diferencia');

select lives_ok(
  $$update public.inventario set cantidad = 5 where id = 1001$$,
  'Bajar cantidad sin asignaciones está permitido');

select is((select cantidad_disponible from public.inventario where id = 1001), 5,
  'Bajar cantidad ajusta cantidad_disponible con la misma diferencia');

-- -----------------------------------------------------------------------------
-- Profesor: asignaciones y stock
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select lives_ok(
  $$insert into public.asignaciones (id, arquero_id, inventario_id, cantidad, registrado_por)
    values (2001, 1001, 1001, 2, '11111111-1111-1111-1111-111111111111')$$,
  'Profesor asigna con stock suficiente');

select is((select cantidad_disponible from public.inventario where id = 1001), 3,
  'Asignar descuenta cantidad_disponible (cambio desde trigger, profundidad 2)');

select is((select registrado_por from public.asignaciones where id = 2001),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'registrado_por se fuerza a auth.uid() aunque se envíe otro valor');

select throws_like(
  $$insert into public.asignaciones (arquero_id, inventario_id, cantidad) values (1001, 1001, 4)$$,
  'Stock insuficiente%',
  'Asignar sin stock suficiente se rechaza');

select throws_like(
  $$insert into public.asignaciones (arquero_id, inventario_id, cantidad) values (1001, 1003, 1)$$,
  'No se puede asignar%',
  'Asignar un artículo en mantenimiento se rechaza');

select throws_like(
  $$insert into public.asignaciones (arquero_id, inventario_id, cantidad, estado, fecha_devolucion)
    values (1001, 1001, 1, 'devuelto', now())$$,
  'Una asignación nueva debe%',
  'Una asignación nueva con estado distinto de activo se rechaza');

select throws_like(
  $$update public.inventario set cantidad = 1 where id = 1001$$,
  '%unidades asignadas%',
  'Bajar cantidad por debajo de lo asignado se rechaza');

select lives_ok(
  $$update public.inventario set cantidad = 4 where id = 1001$$,
  'Bajar cantidad sin pasar de lo asignado está permitido');

select is((select cantidad || '/' || cantidad_disponible from public.inventario where id = 1001), '4/2',
  'Al bajar cantidad, cantidad_disponible baja la misma diferencia');

select throws_like(
  $$update public.inventario set cantidad_disponible = 4 where id = 1001$$,
  'La cantidad disponible no se puede modificar directamente%',
  'Profesor no puede modificar cantidad_disponible directamente');

select throws_like(
  $$update public.asignaciones set cantidad = 1 where id = 2001$$,
  'No se puede modificar la cantidad de una asignación%',
  'Modificar la cantidad de una asignación se rechaza');

select throws_like(
  $$update public.asignaciones set arquero_id = 1002 where id = 2001$$,
  'No se puede cambiar el arquero%',
  'Cambiar el arquero de una asignación se rechaza');

select throws_like(
  $$update public.asignaciones set inventario_id = 1002 where id = 2001$$,
  'No se puede cambiar el artículo%',
  'Cambiar el artículo de una asignación se rechaza');

select throws_like(
  $$update public.asignaciones set registrado_por = '11111111-1111-1111-1111-111111111111' where id = 2001$$,
  'No se puede cambiar quién registró%',
  'Cambiar registrado_por de una asignación se rechaza');

select lives_ok(
  $$update public.asignaciones set estado = 'dañado' where id = 2001$$,
  'Transición activo -> dañado');

select is((select cantidad || '/' || cantidad_disponible from public.inventario where id = 1001), '4/2',
  'activo -> dañado no restaura disponibles');

select throws_like(
  $$update public.asignaciones set estado = 'activo' where id = 2001$$,
  'Transición de estado no permitida%',
  'Transición dañado -> activo se rechaza');

select lives_ok(
  $$update public.asignaciones set estado = 'devuelto' where id = 2001$$,
  'Transición dañado -> devuelto');

select is((select cantidad || '/' || cantidad_disponible from public.inventario where id = 1001), '4/4',
  'dañado -> devuelto restaura disponibles');

select ok((select fecha_devolucion is not null from public.asignaciones where id = 2001),
  'Al devolver sin fecha se registra fecha_devolucion');

select throws_like(
  $$update public.asignaciones set estado = 'activo' where id = 2001$$,
  'Transición de estado no permitida%',
  'Transición devuelto -> activo se rechaza');

select lives_ok(
  $$insert into public.asignaciones (id, arquero_id, inventario_id, cantidad) values (2002, 1001, 1001, 1)$$,
  'Segunda asignación');

select lives_ok(
  $$update public.asignaciones set estado = 'perdido' where id = 2002$$,
  'Transición activo -> perdido');

select is((select cantidad || '/' || cantidad_disponible from public.inventario where id = 1001), '3/3',
  'activo -> perdido descuenta de cantidad sin ajuste automático de disponibles (profundidad 2)');

select lives_ok(
  $$insert into public.asignaciones (id, arquero_id, inventario_id, cantidad) values (2003, 1001, 1001, 1)$$,
  'Tercera asignación');

select lives_ok(
  $$update public.asignaciones set estado = 'devuelto' where id = 2003$$,
  'Transición activo -> devuelto');

select is((select cantidad || '/' || cantidad_disponible from public.inventario where id = 1001), '3/3',
  'activo -> devuelto restaura disponibles');

select lives_ok(
  $$insert into public.asignaciones (id, arquero_id, inventario_id, cantidad) values (2004, 1001, 1001, 1)$$,
  'Cuarta asignación');

select lives_ok(
  $$update public.asignaciones set estado = 'dañado' where id = 2004$$,
  'Cuarta asignación pasa a dañado');

select lives_ok(
  $$update public.asignaciones set estado = 'perdido' where id = 2004$$,
  'Transición dañado -> perdido');

select is((select cantidad || '/' || cantidad_disponible from public.inventario where id = 1001), '2/2',
  'dañado -> perdido descuenta de cantidad');

-- piezas
select lives_ok(
  $$insert into public.asignaciones_piezas (id, arquero_id, pieza_id, cantidad) values (3001, 1001, 1001, 4)$$,
  'Profesor asigna piezas');

select is((select cantidad || '/' || cantidad_disponible from public.piezas where id = 1001), '10/6',
  'Asignar piezas descuenta disponibles');

select throws_like(
  $$insert into public.asignaciones_piezas (arquero_id, pieza_id, cantidad) values (1001, 1001, 7)$$,
  'Stock insuficiente%',
  'Asignar piezas sin stock suficiente se rechaza');

select lives_ok(
  $$update public.asignaciones_piezas set estado = 'devuelto' where id = 3001$$,
  'Devolver piezas');

select is((select cantidad || '/' || cantidad_disponible from public.piezas where id = 1001), '10/10',
  'Devolver piezas restaura disponibles');

select lives_ok(
  $$insert into public.asignaciones_piezas (id, arquero_id, pieza_id, cantidad) values (3002, 1002, 1001, 1)$$,
  'Asignación de piezas a otro arquero');

select lives_ok(
  $$insert into public.asignaciones (id, arquero_id, inventario_id, cantidad) values (2005, 1002, 1002, 1)$$,
  'Asignación de inventario a otro arquero');

-- RLS del profesor
select throws_ok(
  $$insert into public.tipos_arco (nombre) values ('Compuesto profe')$$,
  '42501',
  null,
  'Profesor no puede insertar tipos de arco');

with d as (delete from public.inventario where id = 1003 returning 1)
select is(count(*)::int, 0, 'Profesor no puede borrar inventario') from d;

with d as (delete from public.asignaciones where id = 2001 returning 1)
select is(count(*)::int, 0, 'Profesor no puede borrar asignaciones') from d;

select lives_ok(
  $$insert into public.inventario (id, nombre, codigo, tipo, cantidad) values (1004, 'Carcaj', 'INV-1004', 'carcaj', 2)$$,
  'Profesor inserta inventario');

select is((select count(*)::int from public.v_historial_asignaciones), 7,
  'Profesor ve todo el historial');

-- -----------------------------------------------------------------------------
-- Administrador
-- -----------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$insert into public.tipos_arco (id, nombre) values (1002, 'Compuesto de prueba')$$,
  'Admin inserta tipos de arco');

select lives_ok(
  $$update public.tipos_arco set descripcion = 'Actualizado' where id = 1002$$,
  'Admin actualiza tipos de arco');

with d as (delete from public.asignaciones where id = 2001 returning 1)
select is(count(*)::int, 0, 'Admin no puede borrar asignaciones') from d;

with d as (delete from public.asignaciones_piezas where id = 3001 returning 1)
select is(count(*)::int, 0, 'Admin no puede borrar asignaciones de piezas') from d;

with d as (delete from public.inventario where id = 1003 returning 1)
select is(count(*)::int, 1, 'Admin borra inventario sin asignaciones') from d;

select is((select count(*)::int from public.asignaciones), 5,
  'Admin ve todas las asignaciones');

-- -----------------------------------------------------------------------------
-- Usuario vinculado al arquero 1001
-- -----------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select is((select count(*)::int from public.asignaciones), 4,
  'Usuario ve solo sus asignaciones');

select is((select count(*)::int from public.asignaciones_piezas), 1,
  'Usuario ve solo sus asignaciones de piezas');

select is((select array_agg(id order by id) from public.inventario), array[1001::bigint],
  'Usuario ve solo los artículos que tiene o tuvo asignados');

select is((select count(*)::int from public.piezas), 1,
  'Usuario ve solo las piezas que tiene o tuvo asignadas');

select is((select count(*)::int from public.v_historial_asignaciones), 5,
  'Usuario ve solo su historial');

select is((select count(*)::int from public.v_historial_asignaciones where arquero_id <> 1001), 0,
  'El historial del usuario no incluye a otros arqueros');

select throws_ok(
  $$insert into public.asignaciones (arquero_id, inventario_id, cantidad) values (1001, 1001, 1)$$,
  '42501',
  null,
  'Usuario no puede crear asignaciones');

with u as (update public.inventario set nombre = 'Cambio' where id = 1001 returning 1)
select is(count(*)::int, 0, 'Usuario no puede modificar inventario') from u;

select is((select count(*)::int from public.tipos_arco), 2,
  'Usuario lee el catálogo de tipos de arco');

select throws_ok(
  $$insert into public.tipos_arco (nombre) values ('Tipo usuario')$$,
  '42501',
  null,
  'Usuario no puede insertar tipos de arco');

-- -----------------------------------------------------------------------------
-- Usuario sin arquero vinculado
-- -----------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';

select is((select count(*)::int from public.asignaciones), 0,
  'Usuario sin arquero no ve asignaciones');

select is((select count(*)::int from public.inventario), 0,
  'Usuario sin arquero no ve inventario');

select is((select count(*)::int from public.v_historial_asignaciones), 0,
  'Usuario sin arquero no ve historial');

select is((select count(*)::int from public.tipos_arco), 2,
  'Usuario sin arquero lee el catálogo de tipos de arco');

-- -----------------------------------------------------------------------------
-- Anónimo
-- -----------------------------------------------------------------------------
reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select is((select count(*)::int from public.inventario), 0,
  'Anónimo no ve inventario');

select throws_ok(
  $$select * from public.v_historial_asignaciones$$,
  '42501',
  null,
  'Anónimo no puede consultar la vista de historial');

-- -----------------------------------------------------------------------------
-- Integridad del historial
-- -----------------------------------------------------------------------------
reset role;

select throws_ok(
  $$delete from public.arqueros where id = 1001$$,
  '23503',
  null,
  'No se puede borrar un arquero con asignaciones (ON DELETE RESTRICT)');

select * from finish();

rollback;
