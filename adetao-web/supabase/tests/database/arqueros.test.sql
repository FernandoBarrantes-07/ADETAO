-- Pruebas del RLS de arqueros: staff lee todos, el usuario solo el suyo,
-- escritura solo del administrador, sin DELETE y sin privilegios para anon.
-- Ejecutar con: npx supabase test db

begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

-- -----------------------------------------------------------------------------
-- Datos de prueba (como postgres). Cada archivo corre en su transacción.
-- admin     88888888-...  administrador
-- profe     99999999-...  profesor
-- usuario   aaaaaaaa-...  usuario vinculado al arquero 2001
-- suelto    bbbbbbbb-...  usuario sin arquero
-- inactivo  cccccccc-...  perfil inactivo, vinculado al arquero 2003
-- -----------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('88888888-8888-8888-8888-888888888888', 'admin-arqueros@prueba.test'),
  ('99999999-9999-9999-9999-999999999999', 'profe-arqueros@prueba.test'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'usuario-arqueros@prueba.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'suelto-arqueros@prueba.test'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'inactivo-arqueros@prueba.test');

update public.perfiles set rol = 'administrador'
  where id = '88888888-8888-8888-8888-888888888888';
update public.perfiles set rol = 'profesor'
  where id = '99999999-9999-9999-9999-999999999999';

insert into public.arqueros (id, nombre, identificacion) values
  (2001, 'Arquero propio', 'ARQ-2001'),
  (2002, 'Arquero ajeno', 'ARQ-2002'),
  (2003, 'Arquero de perfil inactivo', 'ARQ-2003');

update public.perfiles set arquero_id = 2001
  where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
update public.perfiles set estado = 'inactivo', arquero_id = 2003
  where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

select set_config(
  'test.arqueros_total',
  (select count(*)::text from public.arqueros),
  true
);

-- -----------------------------------------------------------------------------
-- Estructura
-- -----------------------------------------------------------------------------
select policies_are(
  'public',
  'arqueros',
  array[
    'arqueros: admin actualiza',
    'arqueros: admin inserta',
    'arqueros: staff o propio consulta'
  ],
  'arqueros solo tiene consulta de staff o propia, y escritura del administrador'
);

-- -----------------------------------------------------------------------------
-- Administrador
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"88888888-8888-8888-8888-888888888888","role":"authenticated"}';

select is(
  (select count(*)::int from public.arqueros),
  current_setting('test.arqueros_total')::int,
  'Admin ve todos los arqueros'
);

select lives_ok(
  $$insert into public.arqueros (id, nombre, identificacion) values (2004, 'Arquero nuevo', 'ARQ-2004')$$,
  'Admin inserta un arquero'
);

select lives_ok(
  $$update public.arqueros set telefono = '8888-2001' where id = 2001$$,
  'Admin actualiza un arquero'
);

select lives_ok(
  $$update public.arqueros set estado = 'inactivo' where id = 2002$$,
  'Admin desactiva un arquero'
);

select is(
  (select estado::text from public.arqueros where id = 2002),
  'inactivo',
  'El arquero desactivado sigue en la tabla con estado inactivo'
);

with d as (delete from public.arqueros where id = 2002 returning 1)
select is(count(*)::int, 0, 'Admin no puede borrar un arquero') from d;

select is(
  (select count(*)::int from public.arqueros where id = 2002),
  1,
  'El arquero sigue en la tabla después del DELETE bloqueado'
);

-- -----------------------------------------------------------------------------
-- Profesor
-- -----------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"99999999-9999-9999-9999-999999999999","role":"authenticated"}';

select is(
  (select count(*)::int from public.arqueros where id in (2001, 2002, 2003, 2004)),
  4,
  'Profesor ve todos los arqueros de la prueba'
);

select throws_ok(
  $$insert into public.arqueros (nombre, identificacion) values ('Del profesor', 'ARQ-PROFE')$$,
  '42501',
  null,
  'Profesor no puede insertar arqueros'
);

with u as (update public.arqueros set telefono = '0000' where id = 2001 returning 1)
select is(count(*)::int, 0, 'Profesor no puede actualizar arqueros') from u;

reset role;

select is(
  (select telefono from public.arqueros where id = 2001),
  '8888-2001',
  'El arquero queda como lo dejó el administrador después de la prueba del profesor'
);

-- -----------------------------------------------------------------------------
-- Usuario vinculado
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

select is(
  (select count(*)::int from public.arqueros),
  1,
  'Usuario ve solo su arquero'
);

select is(
  (select count(*)::int from public.arqueros where identificacion = 'ARQ-2002'),
  0,
  'Usuario no ve la identificación de otro arquero'
);

select throws_ok(
  $$insert into public.arqueros (nombre, identificacion) values ('Del usuario', 'ARQ-USUARIO')$$,
  '42501',
  null,
  'Usuario no puede insertar arqueros'
);

with u as (update public.arqueros set telefono = '0000' where id = 2001 returning 1)
select is(count(*)::int, 0, 'Usuario no puede actualizar ni su propio arquero') from u;

reset role;

select is(
  (select telefono from public.arqueros where id = 2001),
  '8888-2001',
  'El arquero no cambia después del UPDATE del usuario'
);

-- -----------------------------------------------------------------------------
-- Usuario sin arquero y perfil inactivo
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';

select is(
  (select count(*)::int from public.arqueros),
  0,
  'Usuario sin arquero no ve registros'
);

set local request.jwt.claims = '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}';

select is(
  (select count(*)::int from public.arqueros),
  0,
  'Un perfil inactivo no ve arqueros aunque tenga uno vinculado'
);

-- -----------------------------------------------------------------------------
-- Anónimo
-- -----------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$select count(*) from public.arqueros$$,
  '42501',
  null,
  'Anónimo no puede consultar arqueros'
);

reset role;

select ok(
  not has_table_privilege(
    'anon',
    'public.arqueros',
    'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
  ),
  'anon no tiene privilegios sobre arqueros'
);

select ok(
  not has_sequence_privilege('anon', 'public.arqueros_id_seq', 'USAGE, SELECT, UPDATE'),
  'anon no tiene privilegios sobre arqueros_id_seq'
);

select * from finish();

rollback;
