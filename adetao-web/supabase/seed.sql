-- Datos de desarrollo local. Se cargan con `npx supabase db reset`.
-- No aplicar en DEV ni en producción: las contraseñas son públicas.
--
-- Usuarios:
--   admin@adetao.test     Admin123!     administrador
--   profesor@adetao.test  Profesor123!  profesor
--   usuario@adetao.test   Usuario123!   usuario, vinculado a "María Rodríguez Solís"

-- -----------------------------------------------------------------------------
-- Usuarios de Auth (el trigger on_auth_user_created crea su perfil)
-- -----------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  extensions.crypt(u.clave, extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('nombre', u.nombre),
  now(),
  now(),
  '', '', '', ''
from (values
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'admin@adetao.test',    'Admin123!',    'Administrador de prueba'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'profesor@adetao.test', 'Profesor123!', 'Profesor de prueba'),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'usuario@adetao.test',  'Usuario123!',  'María Rodríguez Solís')
) as u(id, email, clave, nombre);

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id,
  u.id::text,
  'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(),
  now(),
  now()
from auth.users u
where u.email like '%@adetao.test';

-- -----------------------------------------------------------------------------
-- Catálogo de tipos de arco
-- -----------------------------------------------------------------------------
insert into public.tipos_arco (nombre, descripcion) values
  ('Recurvo', 'Arco olímpico de palas curvadas'),
  ('Compuesto', 'Arco con sistema de poleas'),
  ('Barebow', 'Recurvo sin visor ni estabilizadores'),
  ('Tradicional', 'Longbow y arcos de madera');

-- -----------------------------------------------------------------------------
-- Clubes (los arqueros de prueba siguen sin club)
-- -----------------------------------------------------------------------------
insert into public.clubes (nombre, ubicacion, descripcion) values
  ('Club de Tiro con Arco de San Ramón', 'San Ramón', 'Campo de entrenamiento en el occidente'),
  ('Arqueros de Naranjo', 'Naranjo', null);

insert into public.clubes (nombre, ubicacion, descripcion, estado) values
  ('Club Occidente', 'Grecia', 'Club en pausa', 'inactivo');

-- -----------------------------------------------------------------------------
-- Arqueros
-- -----------------------------------------------------------------------------
insert into public.arqueros (nombre, identificacion, fecha_nacimiento, telefono, correo, mano_dominante, tipo_arco_id)
select a.nombre, a.identificacion, a.fecha_nacimiento::date, a.telefono, a.correo, a.mano_dominante, t.id
from (values
  ('María Rodríguez Solís', '1-1111-1111', '2004-03-15', '8888-0001', 'usuario@adetao.test', 'derecha',   'Recurvo'),
  ('José Vargas Mora',      '2-2222-2222', '1998-07-02', '8888-0002', 'jose@adetao.test',    'derecha',   'Compuesto'),
  ('Ana Jiménez Castro',    '1-3333-3333', '2011-11-20', '8888-0003', null,                  'izquierda', 'Recurvo'),
  ('Luis Chaves Ureña',     '2-4444-4444', '1985-01-09', '8888-0004', 'luis@adetao.test',    'derecha',   'Barebow')
) as a(nombre, identificacion, fecha_nacimiento, telefono, correo, mano_dominante, tipo_arco)
join public.tipos_arco t on t.nombre = a.tipo_arco;

-- -----------------------------------------------------------------------------
-- Roles y vínculo perfil-arquero
-- -----------------------------------------------------------------------------
update public.perfiles set rol = 'administrador'
  where id = 'a0000000-0000-0000-0000-000000000001';

update public.perfiles set rol = 'profesor'
  where id = 'a0000000-0000-0000-0000-000000000002';

update public.perfiles
  set arquero_id = (select id from public.arqueros where identificacion = '1-1111-1111')
  where id = 'a0000000-0000-0000-0000-000000000003';

-- -----------------------------------------------------------------------------
-- Inventario (cantidad_disponible lo calcula el trigger)
-- -----------------------------------------------------------------------------
insert into public.inventario (nombre, codigo, tipo, descripcion, cantidad, ubicacion, tipo_arco_id)
select i.nombre, i.codigo, i.tipo, i.descripcion, i.cantidad, i.ubicacion, t.id
from (values
  ('Arco recurvo 66" 24 lb',   'ARC-001', 'arco',  'Arco de iniciación', 4, 'Bodega A', 'Recurvo'),
  ('Arco recurvo 68" 30 lb',   'ARC-002', 'arco',  'Arco intermedio',    2, 'Bodega A', 'Recurvo'),
  ('Arco compuesto 40-60 lb',  'ARC-003', 'arco',  null,                 1, 'Bodega A', 'Compuesto'),
  ('Arco barebow 25 lb',       'ARC-004', 'arco',  null,                 1, 'Bodega A', 'Barebow'),
  ('Diana de espuma 80 cm',    'DIA-001', 'diana', null,                 3, 'Campo',    null),
  ('Carcaj de cintura',        'CAR-001', 'carcaj', null,                6, 'Bodega B', null),
  ('Protector de brazo',       'PRO-001', 'protector', null,             8, 'Bodega B', null)
) as i(nombre, codigo, tipo, descripcion, cantidad, ubicacion, tipo_arco)
left join public.tipos_arco t on t.nombre = i.tipo_arco;

insert into public.inventario (nombre, codigo, tipo, cantidad, ubicacion, estado, tipo_arco_id)
select 'Arco recurvo 70" 32 lb', 'ARC-005', 'arco', 1, 'Taller', 'mantenimiento', t.id
from public.tipos_arco t
where t.nombre = 'Recurvo';

-- -----------------------------------------------------------------------------
-- Piezas
-- -----------------------------------------------------------------------------
insert into public.piezas (nombre, codigo, tipo, descripcion, cantidad, ubicacion) values
  ('Flecha de aluminio 28"', 'PZ-FLE-28', 'flecha',  null,                      36, 'Bodega B'),
  ('Flecha de carbono 30"',  'PZ-FLE-30', 'flecha',  null,                      24, 'Bodega B'),
  ('Cuerda Dacron 66"',      'PZ-CUE-66', 'cuerda',  'Para arcos de 66"',        6, 'Bodega A'),
  ('Reposaflechas',          'PZ-REP-01', 'accesorio', null,                    10, 'Bodega A'),
  ('Visor recurvo',          'PZ-VIS-01', 'visor',   null,                       3, 'Bodega A'),
  ('Dactilera',              'PZ-DAC-01', 'accesorio', null,                    12, 'Bodega B');

-- -----------------------------------------------------------------------------
-- Asignaciones de ejemplo (las registra el profesor; los triggers ajustan el stock)
-- -----------------------------------------------------------------------------
insert into public.asignaciones (arquero_id, inventario_id, cantidad, observaciones, registrado_por)
select ar.id, i.id, 1, a.observaciones, 'a0000000-0000-0000-0000-000000000002'
from (values
  ('1-1111-1111', 'ARC-001', 'Préstamo para entrenamiento'),
  ('1-3333-3333', 'ARC-001', null),
  ('2-2222-2222', 'ARC-003', null)
) as a(identificacion, codigo, observaciones)
join public.arqueros ar on ar.identificacion = a.identificacion
join public.inventario i on i.codigo = a.codigo;

insert into public.asignaciones_piezas (arquero_id, pieza_id, cantidad, registrado_por)
select ar.id, p.id, a.cantidad, 'a0000000-0000-0000-0000-000000000002'
from (values
  ('1-1111-1111', 'PZ-FLE-28', 6),
  ('1-3333-3333', 'PZ-FLE-28', 6),
  ('2-4444-4444', 'PZ-DAC-01', 1)
) as a(identificacion, codigo, cantidad)
join public.arqueros ar on ar.identificacion = a.identificacion
join public.piezas p on p.codigo = a.codigo;

-- historial: una devolución de María
insert into public.asignaciones (arquero_id, inventario_id, cantidad, fecha_asignacion, observaciones, registrado_por)
select ar.id, i.id, 1, now() - interval '30 days', 'Préstamo anterior', 'a0000000-0000-0000-0000-000000000002'
from public.arqueros ar, public.inventario i
where ar.identificacion = '1-1111-1111' and i.codigo = 'CAR-001';

update public.asignaciones
  set estado = 'devuelto', fecha_devolucion = now() - interval '7 days'
  where observaciones = 'Préstamo anterior';
