-- Inventario: políticas RLS por rol para tipos_arco, inventario, piezas,
-- asignaciones y asignaciones_piezas. Reemplaza las políticas "true" anteriores.

drop policy "Usuarios autenticados pueden consultar tipos de arco" on public.tipos_arco;
drop policy "Usuarios autenticados pueden modificar tipos de arco" on public.tipos_arco;
drop policy "Usuarios autenticados pueden consultar inventario" on public.inventario;
drop policy "Usuarios autenticados pueden modificar inventario" on public.inventario;
drop policy "Usuarios autenticados pueden consultar piezas" on public.piezas;
drop policy "Usuarios autenticados pueden modificar piezas" on public.piezas;
drop policy "Usuarios autenticados pueden consultar asignaciones" on public.asignaciones;
drop policy "Usuarios autenticados pueden modificar asignaciones" on public.asignaciones;
drop policy "Usuarios autenticados pueden consultar asignaciones piezas" on public.asignaciones_piezas;
drop policy "Usuarios autenticados pueden modificar asignaciones piezas" on public.asignaciones_piezas;

-- -----------------------------------------------------------------------------
-- tipos_arco: todos leen; solo admin escribe
-- -----------------------------------------------------------------------------
create policy "tipos_arco: autenticados consultan" on public.tipos_arco
  for select to authenticated
  using (true);

create policy "tipos_arco: admin inserta" on public.tipos_arco
  for insert to authenticated
  with check ((select public.es_admin()));

create policy "tipos_arco: admin actualiza" on public.tipos_arco
  for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

create policy "tipos_arco: admin elimina" on public.tipos_arco
  for delete to authenticated
  using ((select public.es_admin()));

-- -----------------------------------------------------------------------------
-- inventario: staff lee y escribe; usuario lee lo que tiene o tuvo asignado;
-- solo admin borra
-- -----------------------------------------------------------------------------
create policy "inventario: staff o asignado consulta" on public.inventario
  for select to authenticated
  using (
    (select public.es_staff())
    or exists (
      select 1
      from public.asignaciones a
      where a.inventario_id = inventario.id
        and a.arquero_id = (select public.mi_arquero_id())
    )
  );

create policy "inventario: staff inserta" on public.inventario
  for insert to authenticated
  with check ((select public.es_staff()));

create policy "inventario: staff actualiza" on public.inventario
  for update to authenticated
  using ((select public.es_staff()))
  with check ((select public.es_staff()));

create policy "inventario: admin elimina" on public.inventario
  for delete to authenticated
  using ((select public.es_admin()));

-- -----------------------------------------------------------------------------
-- piezas: mismas reglas que inventario
-- -----------------------------------------------------------------------------
create policy "piezas: staff o asignado consulta" on public.piezas
  for select to authenticated
  using (
    (select public.es_staff())
    or exists (
      select 1
      from public.asignaciones_piezas ap
      where ap.pieza_id = piezas.id
        and ap.arquero_id = (select public.mi_arquero_id())
    )
  );

create policy "piezas: staff inserta" on public.piezas
  for insert to authenticated
  with check ((select public.es_staff()));

create policy "piezas: staff actualiza" on public.piezas
  for update to authenticated
  using ((select public.es_staff()))
  with check ((select public.es_staff()));

create policy "piezas: admin elimina" on public.piezas
  for delete to authenticated
  using ((select public.es_admin()));

-- -----------------------------------------------------------------------------
-- asignaciones: staff lee, inserta y modifica; usuario lee las suyas; sin DELETE
-- -----------------------------------------------------------------------------
create policy "asignaciones: staff o propias consulta" on public.asignaciones
  for select to authenticated
  using (
    (select public.es_staff())
    or arquero_id = (select public.mi_arquero_id())
  );

create policy "asignaciones: staff inserta" on public.asignaciones
  for insert to authenticated
  with check ((select public.es_staff()));

create policy "asignaciones: staff actualiza" on public.asignaciones
  for update to authenticated
  using ((select public.es_staff()))
  with check ((select public.es_staff()));

-- -----------------------------------------------------------------------------
-- asignaciones_piezas: mismas reglas que asignaciones
-- -----------------------------------------------------------------------------
create policy "asignaciones_piezas: staff o propias consulta" on public.asignaciones_piezas
  for select to authenticated
  using (
    (select public.es_staff())
    or arquero_id = (select public.mi_arquero_id())
  );

create policy "asignaciones_piezas: staff inserta" on public.asignaciones_piezas
  for insert to authenticated
  with check ((select public.es_staff()));

create policy "asignaciones_piezas: staff actualiza" on public.asignaciones_piezas
  for update to authenticated
  using ((select public.es_staff()))
  with check ((select public.es_staff()));
