-- =============================================================================
-- PENDIENTE DE ACORDAR CON FERNANDO
--
-- Objetos compartidos entre módulos: vínculo perfiles.arquero_id y funciones de
-- rol usadas por las políticas RLS. Se crean aquí porque el módulo de inventario
-- las necesita, pero su definición final debe acordarse con Fernando antes de
-- aplicarse en DEV o producción.
--
-- Un perfil con estado 'inactivo' no tiene rol ni arquero vinculado para estas
-- funciones.
-- =============================================================================

alter table public.perfiles
  add column arquero_id bigint;

alter table public.perfiles
  add constraint perfiles_arquero_id_unique unique (arquero_id);

alter table public.perfiles
  add constraint perfiles_arquero_id_fkey foreign key (arquero_id)
  references public.arqueros(id) on update cascade on delete set null;

create or replace function public.rol_actual()
  returns public.user_role
  language sql
  stable
  security definer
  set search_path = public
as $$
  select p.rol
  from public.perfiles p
  where p.id = auth.uid()
    and p.estado = 'activo';
$$;

create or replace function public.es_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select coalesce(public.rol_actual() = 'administrador', false);
$$;

create or replace function public.es_staff()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select coalesce(public.rol_actual() in ('administrador', 'profesor'), false);
$$;

create or replace function public.mi_arquero_id()
  returns bigint
  language sql
  stable
  security definer
  set search_path = public
as $$
  select p.arquero_id
  from public.perfiles p
  where p.id = auth.uid()
    and p.estado = 'activo';
$$;

revoke all on function public.rol_actual() from public, anon;
revoke all on function public.es_admin() from public, anon;
revoke all on function public.es_staff() from public, anon;
revoke all on function public.mi_arquero_id() from public, anon;

grant execute on function public.rol_actual() to authenticated, service_role;
grant execute on function public.es_admin() to authenticated, service_role;
grant execute on function public.es_staff() to authenticated, service_role;
grant execute on function public.mi_arquero_id() to authenticated, service_role;
