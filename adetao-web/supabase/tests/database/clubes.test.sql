-- Pruebas del módulo de clubes: RLS por rol, nombre único sin distinguir
-- mayúsculas, desactivar en lugar de borrar y privilegios de anon.
-- Ejecutar con: npx supabase test db

begin;

create extension if not exists pgtap with schema extensions;

select plan(27);

-- -----------------------------------------------------------------------------
-- Datos de prueba (como postgres). Cada archivo corre en su transacción.
-- admin    55555555-...  administrador
-- profe    66666666-...  profesor
-- usuario  77777777-...  usuario
-- -----------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('55555555-5555-5555-5555-555555555555', 'admin-clubes@prueba.test'),
  ('66666666-6666-6666-6666-666666666666', 'profe-clubes@prueba.test'),
  ('77777777-7777-7777-7777-777777777777', 'usuario-clubes@prueba.test');

update public.perfiles set rol = 'administrador'
  where id = '55555555-5555-5555-5555-555555555555';
update public.perfiles set rol = 'profesor'
  where id = '66666666-6666-6666-6666-666666666666';

insert into public.arqueros (id, nombre, identificacion) values
  (1001, 'Arquero del club', 'C-1001');

-- -----------------------------------------------------------------------------
-- Estructura
-- -----------------------------------------------------------------------------
select policies_are(
  'public',
  'clubes',
  array[
    'clubes: admin actualiza',
    'clubes: admin inserta',
    'clubes: autenticados consultan'
  ],
  'clubes solo tiene consulta para autenticados y escritura del administrador'
);

select has_index(
  'public',
  'clubes',
  'clubes_nombre_lower_unique',
  'Existe el índice clubes_nombre_lower_unique'
);

select index_is_unique(
  'public',
  'clubes',
  'clubes_nombre_lower_unique',
  'El índice de lower(nombre) es único'
);

-- -----------------------------------------------------------------------------
-- Administrador
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';

select lives_ok(
  $$insert into public.clubes (id, nombre, ubicacion) values (1001, 'club uno', 'San Ramón')$$,
  'Admin inserta un club'
);

select lives_ok(
  $$update public.clubes set descripcion = 'Actualizado' where id = 1001$$,
  'Admin actualiza un club'
);

reset role;

update public.arqueros set club_id = 1001 where id = 1001;

set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';

select throws_ok(
  $$insert into public.clubes (nombre) values ('CLUB UNO')$$,
  '23505',
  null,
  'Un nombre igual con otra capitalización se rechaza'
);

select lives_ok(
  $$update public.clubes set estado = 'inactivo' where id = 1001$$,
  'Admin desactiva un club'
);

select is(
  (select estado::text from public.clubes where id = 1001),
  'inactivo',
  'El club desactivado sigue existiendo con estado inactivo'
);

select is(
  (select club_id from public.arqueros where id = 1001),
  1001::bigint,
  'Desactivar el club no le quita el club al arquero'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';

with d as (delete from public.clubes where id = 1001 returning 1)
select is(count(*)::int, 0, 'Admin no puede borrar un club') from d;

select is(
  (select count(*)::int from public.clubes where id = 1001),
  1,
  'El club sigue en la tabla después del DELETE bloqueado'
);

select lives_ok(
  $$update public.clubes set estado = 'activo' where id = 1001$$,
  'Admin reactiva un club'
);

-- -----------------------------------------------------------------------------
-- Profesor
-- -----------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated"}';

select is(
  (select count(*)::int from public.clubes where id = 1001),
  1,
  'Profesor consulta clubes'
);

select throws_ok(
  $$insert into public.clubes (nombre) values ('Club del profesor')$$,
  '42501',
  null,
  'Profesor no puede insertar clubes'
);

with u as (update public.clubes set descripcion = 'Cambio profesor' where id = 1001 returning 1)
select is(count(*)::int, 0, 'Profesor no puede actualizar clubes') from u;

with d as (delete from public.clubes where id = 1001 returning 1)
select is(count(*)::int, 0, 'Profesor no puede borrar clubes') from d;

reset role;

select is(
  (select descripcion from public.clubes where id = 1001),
  'Actualizado',
  'El club queda como lo dejó el administrador después de las pruebas del profesor'
);

-- -----------------------------------------------------------------------------
-- Usuario
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}';

select is(
  (select count(*)::int from public.clubes where id = 1001),
  1,
  'Usuario consulta clubes'
);

select throws_ok(
  $$insert into public.clubes (nombre) values ('Club del usuario')$$,
  '42501',
  null,
  'Usuario no puede insertar clubes'
);

with u as (update public.clubes set descripcion = 'Cambio usuario' where id = 1001 returning 1)
select is(count(*)::int, 0, 'Usuario no puede actualizar clubes') from u;

with d as (delete from public.clubes where id = 1001 returning 1)
select is(count(*)::int, 0, 'Usuario no puede borrar clubes') from d;

reset role;

select is(
  (select estado::text from public.clubes where id = 1001),
  'activo',
  'El club sigue activo después de las pruebas del usuario'
);

-- -----------------------------------------------------------------------------
-- Anónimo
-- -----------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$select count(*) from public.clubes$$,
  '42501',
  null,
  'Anónimo no puede consultar clubes'
);

select throws_ok(
  $$insert into public.clubes (nombre) values ('Club anónimo')$$,
  '42501',
  null,
  'Anónimo no puede insertar clubes'
);

select throws_ok(
  $$delete from public.clubes where id = 1001$$,
  '42501',
  null,
  'Anónimo no puede borrar clubes'
);

reset role;

select ok(
  not has_table_privilege(
    'anon',
    'public.clubes',
    'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
  ),
  'anon no tiene privilegios sobre clubes'
);

select ok(
  not has_sequence_privilege('anon', 'public.clubes_id_seq', 'USAGE, SELECT, UPDATE'),
  'anon no tiene privilegios sobre clubes_id_seq'
);

select * from finish();

rollback;
