-- =============================================================================
-- PENDIENTE DE ACORDAR CON FERNANDO
--
-- RLS de arqueros. La tabla es de Fernando; estas políticas reemplazan las del
-- baseline (USING true) porque cualquier autenticado veía todos los registros
-- y la cédula. No aplicar en DEV ni en producción sin acordarlo.
--
-- Staff (administrador y profesor) lee todos. El usuario lee solo el arquero
-- vinculado en perfiles.arquero_id. Solo el administrador inserta y actualiza.
-- No hay DELETE: un arquero se desactiva.
-- =============================================================================

drop policy "Usuarios autenticados pueden actualizar arqueros" on public.arqueros;
drop policy "Usuarios autenticados pueden consultar arqueros" on public.arqueros;
drop policy "Usuarios autenticados pueden eliminar arqueros" on public.arqueros;
drop policy "Usuarios autenticados pueden insertar arqueros" on public.arqueros;

create policy "arqueros: staff o propio consulta" on public.arqueros
  for select to authenticated
  using (
    (select public.es_staff())
    or id = (select public.mi_arquero_id())
  );

create policy "arqueros: admin inserta" on public.arqueros
  for insert to authenticated
  with check ((select public.es_admin()));

create policy "arqueros: admin actualiza" on public.arqueros
  for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

revoke all on table public.arqueros from anon;
revoke all on sequence public.arqueros_id_seq from anon;
