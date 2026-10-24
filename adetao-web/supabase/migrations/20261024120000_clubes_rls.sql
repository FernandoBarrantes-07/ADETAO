-- Clubes: lectura para cualquier autenticado, escritura solo del administrador,
-- sin DELETE (un club se desactiva). El nombre único ignora mayúsculas.
-- anon pierde todos los privilegios sobre la tabla y su secuencia.

drop policy "Usuarios autenticados pueden consultar clubes" on public.clubes;
drop policy "Usuarios autenticados pueden insertar clubes" on public.clubes;
drop policy "Usuarios autenticados pueden actualizar clubes" on public.clubes;

create policy "clubes: autenticados consultan" on public.clubes
  for select to authenticated
  using (true);

create policy "clubes: admin inserta" on public.clubes
  for insert to authenticated
  with check ((select public.es_admin()));

create policy "clubes: admin actualiza" on public.clubes
  for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

-- Se conserva clubes_nombre_unique (distingue mayúsculas). Este índice rechaza
-- "Club Norte" y "club norte" como el mismo nombre.
create unique index clubes_nombre_lower_unique
  on public.clubes (lower(nombre));

revoke all on table public.clubes from anon;
revoke all on sequence public.clubes_id_seq from anon;
