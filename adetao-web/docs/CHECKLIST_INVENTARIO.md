# Checklist — Inventario y trazabilidad (Objetivo 4)

Alcance: objetivo 4 del oficio ADETAO-00027-2026 y Plan de Trabajo 3.4. Registrar y administrar arcos, tipos de arco y piezas, relacionando el inventario con los arqueros para su trazabilidad. Semanas 6-8.

## Instrucciones para el agente

- Este archivo es la guía de trabajo del módulo de inventario. Los ítems están en orden de implementación.
- Al verificar o terminar un ítem, marcar su estado y agregar evidencia (archivo, migración, tabla, función, política).
- No marcar `[x]` sin evidencia verificable.
- Respetar `.cursor/rules/alcance-inventario.mdc`. Los ítems de la sección 10 dependen de Fernando y no se implementan sin acordarlos.

| Marca | Significado |
|---|---|
| `[x]` | Hecho: funciona de punta a punta (BD + RLS + UI cuando aplica), con evidencia |
| `[~]` | Parcial: se indica qué falta |
| `[ ]` | Pendiente |
| `[?]` | Por verificar: se indica qué probar a mano |

Última auditoría: 10 oct 2026 (solo lectura; no se modificó código ni BD). Actualizado el 10 oct 2026 con las reglas de préstamo (migración `20261010120000_inventario_reglas_prestamo.sql`, solo en local). Secciones 8 y 9 actualizadas el 10 oct 2026 con los casos funcionales ejecutados en local y la documentación de `docs/inventario/` (sin cambios de código ni migraciones). Secciones 7 y 8 actualizadas el 10 oct 2026 tras corregir DEV-13, OBS-02 y OBS-04 (solo `src/modules/inventario/`, sin migraciones).

Última verificación: 10 oct 2026, 2032c03, test db: Files=1, Tests=109, Result: PASS; lint: 0 errores (2 warnings en Dashboard.jsx:17); build: correcto. `db reset --local`: 9 migraciones y seed, correcto.

---

## Resumen del estado

| Sección | Hecho | Parcial | Pendiente | Por verificar |
|---|---|---|---|---|
| 1. Base de datos | 32 | 0 | 2 | 1 |
| 2. Tipos de arco | 5 | 0 | 0 | 0 |
| 3. Inventario | 8 | 0 | 0 | 0 |
| 4. Piezas | 4 | 0 | 0 | 0 |
| 5. Asignaciones | 9 | 0 | 2 | 0 |
| 6. Trazabilidad | 3 | 1 | 0 | 0 |
| 7. Permisos en la UI | 3 | 1 | 0 | 0 |
| 8. Calidad | 8 | 0 | 0 | 0 |
| 9. Documentación | 4 | 0 | 0 | 0 |
| 10. Dependencias con Fernando | 0 | 4 | 1 | 0 |

La BD del módulo está terminada y probada en local. La UI de tipos de arco, inventario y piezas existe en `src/modules/inventario/` y se abre desde el menú "Inventario" (secciones 2 a 4, 10 oct 2026). Préstamos, devoluciones e historiales están en la pestaña "Préstamos" (secciones 5 y 6, 10 oct 2026). Falta la vista del usuario ("Mis préstamos", sección 7).

---

## 1. Base de datos

Migraciones en `supabase/migrations/` (rutas abreviadas abajo sin la carpeta):
- `20261009141945_remote_schema.sql`: baseline traído con `db pull` desde producción, sin escribir en el historial remoto. Ya incluye `crear_perfil_usuario()`, el trigger `on_auth_user_created` sobre `auth.users`, `rls_auto_enable()` y el event trigger `ensure_rls`, así que no hizo falta una migración `auth_triggers`.
- `20261009150000_base_roles.sql`: compartida, **pendiente de acordar con Fernando** (ver sección 10).
- `20261009150100_inventario_enums.sql`, `20261009150200_inventario_estructura.sql`, `20261009150300_inventario_stock.sql`, `20261009150400_inventario_historial.sql`, `20261009150500_inventario_rls.sql`.
- `20261010120000_inventario_reglas_prestamo.sql`: arquero activo al prestar, tipo de arco activo, bloqueo de estados con unidades prestadas, `prestado` automático, sin DELETE en `tipos_arco` y `REVOKE ALL` a `anon`.
- `20261010123000_inventario_perdido_total.sql`: reemplaza `articulo_control_stock()` para que un artículo quede `perdido` cuando se pierden todas sus unidades.

Pruebas en `supabase/tests/database/inventario.test.sql` (109 pruebas pgTAP).

### Estructura
- [x] CHECK `cantidad_disponible` entre 0 y `cantidad` en `inventario` y `piezas` — evidencia: `inventario_disponible_check` y `piezas_disponible_check` en el baseline.
- [x] `inventario.tipo_arco_id` con FK a `tipos_arco` (RESTRICT) — evidencia: `inventario_tipo_arco_id_fkey` (`ON DELETE RESTRICT`) e índice `idx_inventario_tipo_arco` en `inventario_estructura`.
- [x] CHECK: si `inventario.tipo = 'arco'`, debe tener `tipo_arco_id` — evidencia: `inventario_arco_tipo_arco_check` (compara `lower(btrim(tipo))`); prueba "Un arco sin tipo_arco_id se rechaza".
- [x] `piezas.codigo` (UNIQUE) y `piezas.ubicacion` — evidencia: columnas y `piezas_codigo_unique` en `inventario_estructura`. Nota: `piezas.codigo` e `inventario.codigo` admiten `NULL`; si el código debe ser obligatorio, falta un `NOT NULL`.
- [x] `inventory_status` normalizado: `No disponible` → `no_disponible`, agregar `perdido` — evidencia: `RENAME VALUE` y `ADD VALUE` en `inventario_enums`.
- [x] Enum `estado_asignacion` (activo, devuelto, perdido, dañado) en `asignaciones` y `asignaciones_piezas` — evidencia: tipo creado en `inventario_enums`; las columnas `estado` (antes `varchar(30)`) se convierten con `USING` en `inventario_estructura`, con default `'activo'`.
- [x] CHECK `fecha_devolucion >= fecha_asignacion` — evidencia: `asignaciones_fechas_check` y `asignaciones_piezas_fechas_check`.
- [x] CHECK: estado `devuelto` implica `fecha_devolucion` no nula — evidencia: `asignaciones_devuelto_fecha_check` y `asignaciones_piezas_devuelto_fecha_check`. Si se devuelve sin fecha, el trigger pone `now()`; prueba "Al devolver sin fecha se registra fecha_devolucion".
- [x] FK de `asignaciones` y `asignaciones_piezas` hacia `arqueros` con `ON DELETE RESTRICT` — evidencia: `asignaciones_arquero_id_fkey` y `asignaciones_piezas_arquero_id_fkey` recreadas (antes `CASCADE`); prueba "No se puede borrar un arquero con asignaciones".
- [x] FK de asignaciones hacia `inventario` y `piezas` con `ON DELETE RESTRICT` — evidencia: `asignaciones_inventario_id_fkey` y `asignaciones_piezas_pieza_id_fkey` en el baseline. Un artículo con historial no se puede borrar; prueba "Admin borra inventario sin asignaciones".
- [x] Índices en `asignaciones_piezas(arquero_id)`, `asignaciones_piezas(pieza_id)` y `registrado_por` de ambas tablas de asignaciones — evidencia: `idx_asignaciones_piezas_arquero`, `idx_asignaciones_piezas_pieza`, `idx_asignaciones_registrado_por`, `idx_asignaciones_piezas_registrado_por`.
- [x] `DEFAULT auth.uid()` en `registrado_por` de ambas tablas de asignaciones — evidencia: `inventario_estructura`. Además, `asignacion_validar_alta()` fuerza `registrado_por = auth.uid()` al insertar y `asignacion_validar_cambio()` impide cambiarlo; pruebas "registrado_por se fuerza a auth.uid()" y "Cambiar registrado_por de una asignación se rechaza".
- [x] `tipos_arco.estado` (`record_status`, default `activo`) disponible para desactivar tipos de arco — evidencia: `ALTER TABLE tipos_arco ADD COLUMN estado` en el baseline. (Ítem nuevo.)

### Lógica de stock
- [x] Trigger al asignar: valida `cantidad_disponible >= cantidad` y descuenta. Error en español si no alcanza — evidencia: `asignacion_validar_alta()` con `trg_asignaciones_validar_alta` y `trg_asignaciones_piezas_validar_alta`. También rechaza altas con estado distinto de `activo` y artículos en `mantenimiento`, `dañado`, `no_disponible` o `perdido`. Un artículo `prestado` no tiene unidades disponibles, así que la regla de stock lo rechaza. Pruebas "Asignar sin stock suficiente se rechaza", "Asignar un artículo en mantenimiento se rechaza", "Una asignación nueva con estado distinto de activo se rechaza".
- [?] Bloqueo de concurrencia (`SELECT ... FOR UPDATE`) sobre el artículo al asignar — implementado en `asignacion_validar_alta()`, pero sin prueba. Probar a mano: abrir dos sesiones `psql` en local, `begin;` en ambas, insertar en cada una una asignación del mismo artículo que consuma todo el disponible; la segunda debe quedar esperando y fallar con "Stock insuficiente" al hacer `commit` la primera.
- [x] Transiciones de estado permitidas — evidencia: `asignacion_validar_cambio()` con `trg_asignaciones_validar_cambio` y `trg_asignaciones_piezas_validar_cambio`; cada caso tiene prueba sobre `asignaciones`. En `asignaciones_piezas` solo se prueba alta, stock insuficiente y devolución (la función es la misma).
  - [x] activo → devuelto: restaura disponibles.
  - [x] activo → perdido: descuenta de `cantidad`.
  - [x] activo → dañado: no restaura.
  - [x] dañado → devuelto: restaura disponibles.
  - [x] dañado → perdido: descuenta de `cantidad`.
  - [x] Cualquier otra transición se bloquea con error en español (probado: dañado → activo y devuelto → activo).
- [x] Bloqueo de UPDATE de `cantidad`, `inventario_id`/`pieza_id` y `arquero_id` en asignaciones — evidencia: `asignacion_validar_cambio()`; una prueba por campo.
- [x] Control de cantidades en `inventario` y `piezas` — evidencia: `articulo_control_stock()` con `trg_inventario_control_stock` y `trg_piezas_control_stock` en `inventario_stock`.
  - Al crear un artículo, `cantidad_disponible = cantidad`.
  - Un UPDATE directo de `cantidad_disponible` se rechaza, aunque lo haga `postgres`.
  - Al cambiar `cantidad`, `cantidad_disponible` se ajusta con la misma diferencia, y se rechaza si la nueva cantidad queda por debajo de lo asignado.
  - Los cambios que vienen del trigger de una asignación (`pg_trigger_depth() > 1`) pasan sin estas reglas; la prueba de `activo → perdido` (resultado `3/3`) lo demuestra.
  - El cálculo de `prestado` (ver abajo) sí se aplica en cualquier profundidad. Esta función se reemplazó en `inventario_reglas_prestamo`.
- [x] Sin política de DELETE en asignaciones (el historial se conserva) — evidencia: `inventario_rls` no crea políticas DELETE para estas tablas (confirmado en `pg_policies` local); pruebas "Admin/Profesor no puede borrar asignaciones" (0 filas afectadas).
- [x] La asignación exige un arquero `activo` — evidencia: `asignacion_validar_alta()` (reemplazada en `inventario_reglas_prestamo`) lee `arqueros.estado` (solo lectura, `SECURITY DEFINER`) antes de revisar el stock y da `No se puede prestar a "…": el arquero está inactivo.`; si el arquero no existe, "El arquero indicado no existe." Las devoluciones no dependen del estado del arquero. Pruebas "Prestar inventario a un arquero inactivo se rechaza", "Prestar piezas a un arquero inactivo se rechaza", "Se puede devolver aunque el arquero ya esté inactivo".
- [x] Regla para cambiar el estado de un artículo con asignaciones activas — evidencia: `articulo_control_stock()` rechaza pasar a `mantenimiento`, `dañado` o `perdido` mientras haya unidades prestadas (`cantidad - cantidad_disponible > 0`, que incluye asignaciones `dañado`): `No se puede cambiar "…" a "…": hay N unidades prestadas. Primero registre la devolución.` Pruebas "Pasar a mantenimiento/dañado/perdido con unidades prestadas se rechaza", "Con un préstamo dañado (unidades fuera) la pieza no puede pasar a mantenimiento", "Sin unidades prestadas se puede pasar a mantenimiento". `no_disponible` sigue permitido con unidades prestadas (decisión confirmada el 10 oct 2026).
- [x] `prestado` automático — evidencia: `articulo_control_stock()` pone `prestado` a un artículo en `disponible`/`prestado` cuando `cantidad > 0` y `cantidad_disponible = 0`, y lo devuelve a `disponible` cuando quedan unidades (por devolución o al subir `cantidad`). No se puede elegir a mano, ni al crear ni al editar: "El estado "prestado" se asigna automáticamente…". Si `cantidad` llega a 0 porque se perdieron las unidades prestadas (trigger de asignación), el artículo queda `perdido` (`inventario_perdido_total`). Bajar la cantidad a 0 a mano no es una pérdida y no cambia el estado. La migración normaliza primero los datos existentes. `no_disponible` sigue permitido con unidades prestadas (confirmado el 10 oct 2026). Pruebas "Sin unidades disponibles el artículo pasa a prestado", "Al quedar unidades disponibles el artículo vuelve a disponible", "Al bajar la cantidad hasta lo prestado el artículo vuelve a prestado", "Al devolver, el artículo vuelve a disponible", "Poner prestado a mano se rechaza", "Crear un artículo en estado prestado se rechaza", "Si se pierden todas las unidades, el artículo queda perdido (0/0)", "Bajar la cantidad a 0 a mano no marca el artículo como perdido". (Ítem nuevo.)
- [x] Al asignar un `tipo_arco_id` a un artículo, validar que el tipo de arco esté `activo` — evidencia: `inventario_validar_tipo_arco()` con `trg_inventario_validar_tipo_arco` (`before insert or update of tipo_arco_id`): `El tipo de arco "…" está inactivo. Elija un tipo de arco activo.` Un artículo cuyo tipo se desactivó después se puede seguir editando si no cambia de tipo. Pruebas "Crear un arco con un tipo de arco inactivo se rechaza", "Cambiar un arco a un tipo de arco inactivo se rechaza", "Editar un arco cuyo tipo se desactivó después está permitido".

### Trazabilidad
- [x] Vista de historial que una `asignaciones` y `asignaciones_piezas` (artículo, arquero, cantidad, fechas, estado, quién registró) — evidencia: `v_historial_asignaciones` (`security_invoker = true`) en `inventario_historial`; pruebas "Profesor ve todo el historial", "Usuario ve solo su historial", "Usuario sin arquero no ve historial", "Anónimo no puede consultar la vista de historial". Nota: `registrado_por_nombre` sale nulo para quien no puede leer ese perfil, por el RLS actual de `perfiles` (se resuelve en la sección 6, de acuerdo con Fernando).

### Seguridad (RLS)
- [x] `tipos_arco`: todos leen; solo admin inserta y actualiza — evidencia: políticas `tipos_arco: *` en `inventario_rls`; pruebas "Admin inserta/actualiza tipos de arco", "Profesor no puede insertar tipos de arco", "Usuario no puede insertar tipos de arco".
- [x] `tipos_arco`: desactivar en lugar de eliminar — evidencia: `inventario_reglas_prestamo` elimina la política `tipos_arco: admin elimina`; en local solo quedan `autenticados consultan`, `admin inserta` y `admin actualiza` (`pg_policies`). Un DELETE por API afecta 0 filas; prueba "Admin no puede borrar tipos de arco (solo se desactivan)". (Ítem nuevo.)
- [x] `inventario`, `piezas`: staff lee y escribe; usuario lee solo los artículos de sus asignaciones; solo admin borra — evidencia: políticas `inventario: *` y `piezas: *`; pruebas "Profesor inserta inventario", "Profesor no puede borrar inventario", "Usuario ve solo los artículos que tiene o tuvo asignados", "Usuario no puede modificar inventario".
- [x] `asignaciones`, `asignaciones_piezas`: staff lee, inserta y modifica; usuario lee las suyas; sin DELETE — evidencia: políticas `asignaciones: *` y `asignaciones_piezas: *`; pruebas "Usuario ve solo sus asignaciones", "Usuario no puede crear asignaciones", "Admin ve todas las asignaciones".
- [x] Se eliminaron las políticas `true` anteriores de estas tablas — evidencia: 10 `drop policy` al inicio de `inventario_rls`; en la BD local quedan 17 políticas (`pg_policies`, 10 oct 2026): `inventario_rls` crea 18 y `20261010120000_inventario_reglas_prestamo.sql` elimina `tipos_arco: admin elimina`.
- [x] Sin privilegios de `anon` sobre las tablas de inventario — evidencia: `revoke all ... from anon` sobre `inventario`, `piezas`, `asignaciones`, `asignaciones_piezas` y `tipos_arco` en `inventario_reglas_prestamo`; en local `information_schema.role_table_grants` da 0 filas para `anon` en esas tablas. Pruebas "anon no tiene privilegios sobre …" (una por tabla) y "Anónimo no puede consultar inventario" (42501). Las secuencias de esas tablas conservan sus privilegios del baseline (sin `INSERT`, `anon` no puede usarlas desde PostgREST). (Ítem nuevo.)

### Datos de desarrollo
- [x] Seed local con usuarios por rol y datos de inventario — evidencia: `supabase/seed.sql` crea `admin@adetao.test`, `profesor@adetao.test` y `usuario@adetao.test` (vinculado a un arquero), 4 tipos de arco, 8 artículos (uno en `mantenimiento`), 6 piezas, 4 asignaciones de inventario (una devuelta) y 3 de piezas. En local: `ARC-001 4/2` y `ARC-003 1/0`, que cuadran con las asignaciones activas; con las reglas de préstamo, ARC-003 queda `prestado` sin cambiar el seed. Solo para local: las contraseñas son públicas. (Ítem nuevo.)

### Validación
- [x] Migraciones aplicadas sin errores en local — evidencia: 9 oct 2026, `npx supabase db reset` aplicó las 7 migraciones ("Finished supabase db reset"). 10 oct 2026: `npx supabase migration list --local` muestra las 7 aplicadas. 10 oct 2026, después de agregar las reglas de préstamo y `perdido` automático: `npx supabase db reset` aplicó las 9 migraciones y el seed ("Finished supabase db reset").
- [x] Prueba de RLS por rol (admin, profesor, usuario) en `supabase/tests/` — evidencia: 10 oct 2026, `npx supabase test db` → `Files=1, Tests=109, Result: PASS` (antes de las reglas de préstamo: 75/75 el 9 y el 10 oct). Cubre admin, profesor, usuario vinculado, usuario sin arquero y anónimo. Se corrió solo con el contenedor de Postgres (`supabase start -x ...`).
- [ ] Migraciones aplicadas en el proyecto DEV.
- [ ] Migraciones aplicadas en producción (con confirmación explícita). Antes, revisar con consultas de solo lectura los arcos sin `tipo_arco_id`, los valores de `estado` que no se puedan mapear, que `cantidad_disponible` cuadre con las asignaciones activas y qué filas en `disponible`/`prestado` cambiará la normalización de `inventario_reglas_prestamo`. Los artículos que ya estén en `mantenimiento`, `dañado` o `perdido` con unidades prestadas no se tocan.

---

## UI del módulo (secciones 2 a 4)

Archivos en `src/modules/inventario/`:
- `Inventario.jsx`: contenedor con pestañas Artículos, Piezas, Préstamos (solo staff, sección 5) y Tipos de arco, sin router. Se muestra desde el menú Inventario de `Dashboard.jsx` (ver sección 10).
- `TiposArco.jsx`, `ArticulosTabla.jsx` (sirve para `inventario` y `piezas` según la prop `tabla`), `ArticuloForm.jsx`, `Modal.jsx`, `Inventario.css`.
- `inventarioService.js`: consultas a Supabase. Si un UPDATE no devuelve filas (RLS), muestra "No tiene permisos para realizar esta acción."
- `errores.js` (`traducirError`): convierte `23505`, `23514`, `23503` y `42501` a mensajes en español; los `P0001` de los triggers pasan tal cual.
- `constantes.js`: estados, etiquetas y textos.

Verificación del 10 oct 2026, contra la BD local (`127.0.0.1:54321`, usuarios del seed):
- `npx oxlint src/modules/inventario`: 0 errores y 0 warnings.
- `npm run build`: correcto.
- Prueba de humo: un script temporal en Node cargó el `inventarioService.js` real con el SSR de Vite e inició sesión como admin, profesor y usuario. Resultado: **32 ok, 0 fallos**. Los registros de prueba se borraron al final y el script no queda en el repo.
- Falta la revisión visual en el navegador (`npm run dev`).

Verificación de las reglas de préstamo, 10 oct 2026 (BD local):
- `npm run lint`: 0 errores; solo los 2 warnings de `Dashboard.jsx:17` (código compartido). `npm run build`: correcto.
- En el navegador, como admin: la tabla de artículos alinea el texto a la izquierda y "Disponible / Total" a la derecha, y los códigos no se parten (`Inventario.css`: `.inv-col-codigo`, `.inv-col-numero`). En el cambio rápido de estado, ARC-001 (2 prestadas) y ARC-003 (prestado) muestran "Mantenimiento/Dañado/Perdido — Primero registre la devolución" deshabilitados; `prestado` aparece solo como valor actual, sin poder elegirse.

## 2. Catálogo de tipos de arco

- [x] Listado — evidencia: `TiposArco.jsx` con nombre, descripción y estado, y la casilla "Mostrar inactivos"; `listarTiposArco()`. Prueba de humo: el admin lista los tipos.
- [x] Crear y editar (nombre único con mensaje claro) — evidencia: modal en `TiposArco.jsx`, que revisa duplicados sin distinguir mayúsculas antes de enviar; como respaldo, `tipos_arco_nombre_unique` da "Ya existe un tipo de arco con ese nombre." (`traducirError`). Prueba de humo: crear, editar (una descripción vacía se guarda `null`) y nombre duplicado.
- [x] Desactivar en lugar de eliminar — evidencia: `cambiarEstadoTipoArco()` cambia `estado` a `inactivo`/`activo` y la UI no tiene opción de borrar. Prueba de humo: desactivar y reactivar. En la BD ya no hay política de DELETE (sección 1, Seguridad).
- [x] Advertencia al desactivar un tipo de arco en uso (arqueros o inventario) — evidencia: `contarUsoTipoArco()` (conteo `head: true` en `inventario` y lectura de `arqueros`, que es de Fernando) y un modal de confirmación con "en uso por N arqueros y M artículos". Prueba de humo: Recurvo da 2 arqueros y 3 artículos; un tipo nuevo da 0 y 0. Los tipos inactivos no se ofrecen para arcos nuevos (`ArticuloForm.jsx`).
- [x] Solo el administrador puede escribir (UI y RLS) — evidencia: en `TiposArco.jsx` los botones solo aparecen con `esAdmin`; el profesor ve el catálogo en solo lectura. RLS: `tipos_arco: admin *`. Prueba de humo: el profesor no puede crear ni desactivar ("No tiene permisos para realizar esta acción.").

## 3. Inventario (artículos)

- [x] Listado con búsqueda — evidencia: `ArticulosTabla.jsx` (`tabla="inventario"`) busca por nombre, código, ubicación y descripción; muestra "N de M registros" y mensajes de carga, lista vacía y sin resultados.
- [x] Filtros: tipo, estado, tipo de arco, con o sin unidades disponibles — evidencia: selectores en `ArticulosTabla.jsx`. El de tipo de arco solo aparece en inventario; hay un botón "Limpiar".
- [x] Crear y editar: nombre, código, tipo, descripción, cantidad, ubicación, estado — evidencia: `ArticuloForm.jsx` y `guardarArticulo()`. El tipo se guarda en minúsculas y sin espacios sobrantes, un código vacío se guarda como `null` y nunca se envía `cantidad_disponible`. Prueba de humo: crear arco y diana (disponible = total) y editar ARC-001.
- [x] Código único con mensaje claro — evidencia: `inventario_codigo_unique` da "Ya existe un artículo con ese código." Prueba de humo: código duplicado.
- [x] Arcos: selección obligatoria de tipo de arco desde el catálogo — evidencia: si el tipo es `arco`, `ArticuloForm.jsx` muestra un selector obligatorio con los tipos activos (al editar se conserva el actual aunque esté inactivo); para otros tipos, `tipo_arco_id` se guarda `null`. Como respaldo, `inventario_arco_tipo_arco_check` da "Los arcos deben tener un tipo de arco." Prueba de humo: arco sin tipo rechazado; diana con `tipo_arco_id` nulo. La BD también exige que el tipo esté `activo` (`inventario_validar_tipo_arco()`, sección 1).
- [x] Mostrar cantidad total y disponible — evidencia: columna "Disponible / Total" (por ejemplo `2 / 4`); si no quedan unidades, el disponible se resalta en rojo.
- [x] Cambiar estado del artículo (mantenimiento, dañado, no disponible) — evidencia: selector en cada fila (`cambiarEstadoArticulo()`) y campo estado en el formulario. Opciones: disponible, mantenimiento, dañado, no disponible y perdido. `prestado` lo calcula la BD: aparece solo como valor actual y no se puede elegir. Con unidades prestadas, mantenimiento, dañado y perdido salen deshabilitados con "Primero registre la devolución", en la tabla y en `ArticuloForm.jsx` (`opcionesEstado()` en `constantes.js`). Si la BD deja el artículo en `prestado` (por ejemplo, al elegir "Disponible" sin unidades), el aviso lo dice. Prueba de humo: `mantenimiento` y `no_disponible`; un usuario no puede cambiarlo.
- [x] Ajuste de cantidad que no deje `cantidad` por debajo de lo asignado — evidencia: `ArticuloForm.jsx` valida contra `cantidad - cantidad_disponible` y muestra cuántas están asignadas; como respaldo, `articulo_control_stock()`. Prueba de humo: bajar ARC-001 a 1 da "No se puede reducir la cantidad de ... a 1: hay 2 unidades asignadas."; subirlo a 5 deja `5/3` y volver a 4 deja `4/2`.

## 4. Piezas

- [x] Listado con búsqueda y filtros — evidencia: `ArticulosTabla.jsx` con `tabla="piezas"`: búsqueda y filtros por tipo, estado y disponibilidad.
- [x] Crear y editar: nombre, código, tipo, descripción, cantidad, ubicación, estado — evidencia: `ArticuloForm.jsx` (en piezas el tipo es opcional y no hay tipo de arco). `piezas_codigo_unique` da "Ya existe una pieza con ese código." Prueba de humo: crear pieza (10/10), código duplicado (PZ-FLE-28), editar nombre, cantidad y estado, y no poder bajar PZ-FLE-28 a 5 (hay 12 asignadas).
- [x] Mostrar cantidad total y disponible — evidencia: la misma columna "Disponible / Total".
- [x] Cambiar estado — evidencia: selector en cada fila; prueba de humo: pieza a `dañado` y luego a `disponible` desde el formulario.

## 5. Asignaciones (préstamos)

UI en la pestaña "Préstamos" de `Inventario.jsx` (solo administrador y profesor), sin migraciones nuevas: usa `asignaciones`, `asignaciones_piezas`, sus triggers y `v_historial_asignaciones`.
- Archivos: `Prestamos.jsx` (vistas "Préstamos activos" e "Historial por arquero"), `PrestamoForm.jsx`, `DevolucionForm.jsx`, `HistorialTabla.jsx`, `HistorialArquero.jsx`, `HistorialArticulo.jsx`, `SelectorArquero.jsx`; funciones `listarArqueros`, `listarHistorial`, `crearPrestamo`, `registrarDevolucion` y `agregarObservacion` en `inventarioService.js`; `OPCIONES_DEVOLUCION`, `ESTADOS_ASIGNACION` y `formatearFecha` en `constantes.js`.
- Verificación del 10 oct 2026 (BD local): `npm run lint` sin errores (solo los 2 warnings de `Dashboard.jsx:17`, código compartido), `npm run build` correcto, y prueba de humo temporal con el `inventarioService.js` real (SSR de Vite) como admin, profesor y usuario: **27 ok, 0 fallos**. Los datos de prueba (prefijo `HUMO-`, incluidos dos arqueros temporales creados con psql) se borraron, se comprobó que el seed quedó igual (4 asignaciones, 3 de piezas, ARC-001 `4/2`, ARC-003 `1/0 prestado`) y el script se eliminó.
- Revisión en el navegador como admin: listado, modal de nuevo préstamo, modal de devolución e historial por arquero. De paso se corrigió en `Inventario.css` el texto centrado y los campos oscuros que el módulo heredaba de `#root` (`index.css`), sin tocar el CSS global.

- [x] Asignar artículo a un arquero: selector de arquero activo, cantidad, observaciones — evidencia: `PrestamoForm.jsx` busca entre los arqueros activos (`listarArqueros({ soloActivos: true })`, solo lectura de `arqueros`) y ofrece solo artículos `disponible` con unidades, con "N disp."; valida la cantidad contra lo disponible. `registrado_por`, `estado` y `fecha_asignacion` los pone la BD. Humo: "Selector: solo arqueros activos", "Admin presta 2 de 3" (`3/1`), "Sin unidades disponibles el artículo queda prestado" (`3/0 prestado`). Respaldo en BD: arquero activo (sección 1); humo "Prestar a un arquero inactivo" → `No se puede prestar a "HUMO Arquero inactivo": el arquero está inactivo.`
- [x] Asignar piezas a un arquero — evidencia: el mismo modal con "Qué se presta: Pieza" (`asignaciones_piezas`). Humo: "Profesor presta 4 piezas" (`10/6`).
- [x] Mostrar el error de stock insuficiente de forma clara — evidencia: validación en el modal ("Solo hay N unidades disponibles de …") y, como respaldo, el mensaje del trigger en la alerta del modal. Humo: "Prestar más de lo disponible" → `Stock insuficiente para "HUMO Diana": se solicitaron 2 y hay 1 disponibles.`
- [x] Registrar devolución con fecha — evidencia: `DevolucionForm.jsx` con fecha y hora (por defecto ahora; no anterior al préstamo ni futura) y observaciones, que se agregan a las del préstamo como `[dd/mm/aaaa Devuelto] texto` (`agregarObservacion()`). Humo: "Devolución normal restaura stock y vuelve a disponible" (`3/2`), "Devolución normal: estado, fecha y observaciones agregadas", "Fecha de devolución anterior al préstamo" → "La fecha de devolución no puede ser anterior a la fecha del préstamo." (`asignaciones_fechas_check` en `errores.js`).
- [x] Marcar como perdido o dañado — evidencia: el modal solo ofrece las transiciones de `asignacion_validar_cambio()` (`OPCIONES_DEVOLUCION`): desde activo, devolver en buen estado, dañado o perdido; las dos últimas piden observaciones. Humo: "Devolver dañado: no restaura stock y guarda la fecha" (`10/6`), "Devolver como perdido descuenta de la cantidad" (`7/7`). Una transición no permitida llega en español: "Transición de estado no permitida: de "devuelto" a "activo"."
- [x] Pasar de dañado a devuelto tras reparación — evidencia: en un préstamo dañado el botón es "Cerrar" y ofrece "Reparado: vuelve al inventario" o "Dar de baja como perdido"; se conserva la `fecha_devolucion` de cuando se entregó dañado y la fecha de la reparación queda en la nota. Humo: "Dañado -> reparado restaura stock" (`10/10`), "Reparado conserva la fecha de entrega y suma la nota".
- [x] `registrado_por` se llena automáticamente — evidencia: default `auth.uid()` y `asignacion_validar_alta()`; prueba "registrado_por se fuerza a auth.uid() aunque se envíe otro valor". La UI nunca lo envía.
- [x] Devolución sobre una lista desactualizada — evidencia: `registrarDevolucion()` actualiza solo si el préstamo sigue en el estado que se mostró (`.eq('estado', …)`); si otra persona ya lo cerró, avisa `Este préstamo ya se registró como "…". Actualice la lista.` en lugar de duplicar la nota, con un botón "Actualizar" que cierra el modal y recarga la lista (OBS-02, sección 8). Humo: "Devolver dos veces el mismo préstamo (lista desactualizada)". (Ítem nuevo.)
- [x] Permisos: solo administrador y profesor prestan y devuelven — evidencia: la pestaña "Préstamos" y el botón "Historial" solo se renderizan con `esStaff`; RLS de respaldo. Humo: "Usuario no puede prestar" y "Usuario no puede registrar devoluciones" → "No tiene permisos para realizar esta acción."; "El préstamo del usuario sigue activo". La vista "Mis préstamos" del rol usuario va en otro paso (sección 7). (Ítem nuevo.)
- [ ] Devolución parcial (por ejemplo, devolver 4 de 6 flechas) — no es posible: la BD no permite cambiar la `cantidad` de una asignación y la devolución cierra el préstamo completo. Si ADETAO lo necesita, hay que cambiar el modelo (por ejemplo, dividir la asignación). (Ítem nuevo.)
- [ ] Definir con ADETAO si los préstamos tienen fecha límite de devolución (si sí, agregar `fecha_devolucion_prevista` y estado de préstamo vencido).

## 6. Trazabilidad e historiales

- [x] Historial por artículo: quién lo tuvo, cuándo, en qué estado volvió — evidencia: botón "Historial" en cada fila de `ArticulosTabla.jsx` (artículos y piezas, solo staff) que abre `HistorialArticulo.jsx` con `listarHistorial({ tipoRegistro, articuloId })` sobre `v_historial_asignaciones`: arquero, cantidad, fechas, estado, registrado por y observaciones, con resumen de unidades fuera. Humo: "Historial por pieza: 2 préstamos".
- [x] Historial por arquero: qué tiene ahora y qué tuvo — evidencia: vista "Historial por arquero" (`HistorialArquero.jsx`): se elige cualquier arquero (incluidos inactivos) y se ve "Tiene ahora" (activos y dañados, con acción Devolver/Cerrar) y "Préstamos anteriores". Humo: "Historial por arquero: 4 movimientos (2 artículo + 2 pieza)"; en el navegador, María muestra 2 préstamos activos (7 unidades) y 1 cerrado.
- [x] Listado de préstamos activos — evidencia: vista "Préstamos activos" (`Prestamos.jsx`): arquero, artículo o pieza con código, cantidad, fechas, estado y registrado por; filtros por arquero, tipo, artículo o pieza y estado ("Pendientes (activos y dañados)" por defecto, o activo, dañado, devuelto, perdido, todos); búsqueda por nombre, identificación o código; mensajes de carga, lista vacía, sin resultados y error con "Reintentar". En el navegador: 6 pendientes de 7 registros del seed.
- [~] Mostrar el nombre de quien registró cada movimiento — UI hecha: columna "Registrado por" con `registrado_por_nombre`; cuando la BD no lo devuelve se muestra "—" con la nota "Nombre no disponible". Humo: "El admin ve su nombre en "registrado por"" y "El profesor no ve el nombre del admin (RLS de perfiles)". Falta que el RLS de `perfiles` deje al staff leer el nombre de otros (depende de Fernando, sección 10).

## 7. Permisos en la interfaz

El RLS de las 5 tablas está hecho y probado por rol (sección 1). La UI aplica los mismos permisos: `src/modules/Sidebar/Sidebar.jsx` (compartido) muestra "Inventario" solo a `administrador` y `profesor`, e `Inventario.jsx` calcula `esAdmin` y `esStaff` a partir de `profile.rol` y los pasa a cada vista. Verificado en los casos PER-01 a PER-04 del 10 oct 2026 ([`casos-de-prueba.md`](inventario/casos-de-prueba.md#per--permisos-por-rol)).

- [x] Administrador: acceso completo al módulo — evidencia: pestañas Artículos, Piezas, Préstamos y Tipos de arco, con crear, editar, historial, cambio de estado, préstamos, devoluciones y desactivar tipos de arco. Caso PER-01: Pasa. RLS: "Admin inserta tipos de arco", "Admin ve todas las asignaciones".
- [x] Profesor: gestiona inventario, piezas y asignaciones; no edita el catálogo de tipos de arco — evidencia: mismas pestañas que el admin; en `TiposArco.jsx` los botones "+ Nuevo tipo", "Editar" y "Desactivar" y la columna Acciones solo se muestran con `esAdmin`, y el profesor ve "Catálogo de solo lectura. Solo el administrador puede modificarlo." Casos PER-02 y PER-03: Pasa. RLS: "Profesor no puede insertar tipos de arco", "Profesor inserta inventario", "Profesor asigna con stock suficiente".
- [~] Usuario: ve solo sus asignaciones — RLS listo y probado ("Usuario ve solo sus asignaciones", "Usuario ve solo su historial", entre otras). El usuario no ve el menú Inventario (PER-04: Pasa). Falta la vista "Mis préstamos" y su entrada en `Sidebar.jsx` para el rol `usuario` (cambio en código compartido, **pendiente de acordar con Fernando**); por eso PER-05 está Bloqueado.
- [x] Botones y acciones ocultos según el rol (además de RLS) — evidencia: en `Inventario.jsx`, la pestaña Préstamos solo se renderiza con `esStaff`; en `ArticulosTabla.jsx`, `puedeEditar={esStaff}` oculta "+ Nuevo artículo/pieza", "Historial", "Editar" y el selector de estado (sin permiso se muestra solo la etiqueta); en `TiposArco.jsx`, la escritura depende de `esAdmin`. Casos PER-02 a PER-04: Pasa.

## 8. Calidad

Casos funcionales ejecutados el 10 oct 2026 en el navegador contra la BD local (`127.0.0.1:54321`, recién reiniciada, usuarios del seed), rama `inventario`, commit `bad46eb`: [`docs/inventario/casos-de-prueba.md`](inventario/casos-de-prueba.md). Resultado de esa ejecución: 58 casos, 53 pasan, 2 pasan con observaciones (HIS-07, UI-01), 1 falla (DEV-13), 1 bloqueado (PER-05) y 1 no aplica (PER-06). Ese paso no modificó código ni migraciones.

Después se corrigieron DEV-13, OBS-02 y OBS-04, y se volvieron a ejecutar DEV-13, DEV-10 y UI-01 el mismo día ([re-ejecución](inventario/casos-de-prueba.md#re-ejecución-del-10-oct-2026)). Resultado actual: 55 pasan, 1 pasa con observaciones (HIS-07), 0 fallan, 1 bloqueado (PER-05) y 1 no aplica (PER-06).

- [x] Validaciones en cliente (cantidades positivas, campos obligatorios) — evidencia: `ArticuloForm.jsx` (nombre, tipo, tipo de arco si es arco, cantidad entera `>= 0` y no menor que lo asignado), `TiposArco.jsx` (nombre obligatorio y duplicado sin distinguir mayúsculas), `PrestamoForm.jsx` (arquero, artículo, cantidad entera `> 0` y no mayor que lo disponible), `DevolucionForm.jsx` (opción, fecha no anterior al préstamo ni futura, observaciones obligatorias para dañado y perdido). Casos TA-02, TA-03, ART-02, ART-03, ART-06, PZ-03, PRE-03, PRE-04, DEV-02, DEV-04, DEV-07, DEV-08 y DEV-09: Pasa. La BD valida lo mismo como respaldo.
- [x] Mensajes de error en español — evidencia: `errores.js` (`traducirError`) traduce `23505`, `23514`, `23503` y `42501`, y deja pasar los `P0001` de los triggers, que ya están en español; "Failed to fetch" da "No se pudo conectar con el servidor. Revise su conexión." Casos con el mensaje copiado de la pantalla: ART-04 y PZ-02 (UNIQUE), PRE-05 (`Stock insuficiente…`), PRE-01/DEV-11 (arquero inactivo), ART-08 (`Primero registre la devolución`), DEV-10 (lista desactualizada), PER-02 a PER-04 (permisos). La tabla de mensajes y qué hacer ante cada uno está en el [manual de usuario](inventario/manual-usuario.md#11-si-aparece-este-mensaje).
- [x] Estados de carga y de listado vacío — evidencia: caso UI-02 ("Cargando...", "Cargando arqueros y artículos...", "Ningún artículo coincide con los filtros.", "Ningún préstamo coincide con los filtros.", "Este artículo no se ha prestado nunca.", "Ningún arquero coincide con la búsqueda.", "Nada pendiente de devolución"). El estado de error con "Reintentar" existe en el código, pero no se forzó en la ejecución.
- [x] Diseño usable desde celular — caso UI-01 (390 px): Pasa. La tabla pasa a tarjetas y el modal ocupa una columna. OBS-04 corregida en `Inventario.css`: `.inv-pestanas` muestra una sombra en el borde por donde hay más pestañas (fondos `local`/`scroll`, sin JavaScript) y los filtros llevan `min-width: 0` en pantallas angostas, así que el de tipo de arco ya no sobresale aunque haya un nombre largo (medido: todos los filtros de Artículos y Préstamos quedan dentro de la tarjeta). El selector "Préstamos activos / Historial por arquero" (`.inv-vistas`) tenía el mismo corte de unos 21 px; lleva la misma sombra, con tapas `#f7f7f7`. Verificado a 390 px: sombra en el borde por donde hay más, y al final "Historial por arquero" se ve completo.
- [x] Casos de prueba funcionales documentados — evidencia: [`casos-de-prueba.md`](inventario/casos-de-prueba.md), por rol y con formato ID, objetivo, precondiciones, pasos, datos, resultado esperado, resultado obtenido y estado, más el anexo regla de BD → prueba pgTAP → caso de UI.
  - [x] Asignar con stock suficiente — PRE-06 y PRE-08; pgTAP "Profesor asigna con stock suficiente".
  - [x] Asignar sin stock suficiente — PRE-04 y PRE-05 (otra persona presta con el formulario abierto); pgTAP "Asignar sin stock suficiente se rechaza".
  - [x] Devolver — DEV-01, DEV-11 (arquero ya inactivo) y DEV-12 (procedimiento provisional de devolución parcial); pgTAP "Transición activo -> devuelto", "Devolver piezas". DEV-13 (devolver en el mismo minuto del préstamo) se corrigió y pasa (ver abajo).
  - [x] Marcar perdido y dañado — DEV-02 a DEV-06; pgTAP "Transición activo -> perdido", "Transición activo -> dañado", "Transición dañado -> perdido".
  - [x] Intentar una transición inválida — la UI solo ofrece las transiciones válidas (DEV-01 a DEV-05) y DEV-10 cubre el préstamo ya cerrado por otra persona; pgTAP "Transición dañado -> activo se rechaza", "Transición devuelto -> activo se rechaza".
  - [x] Intentar modificar cantidad o arquero de una asignación — la UI no permite editar un préstamo; DEV-12 aplica el procedimiento provisional que reemplaza el cambio de cantidad; pgTAP "Modificar la cantidad de una asignación se rechaza", "Cambiar el arquero de una asignación se rechaza".
  - [~] Acceso por cada rol — PER-01 a PER-04 y PER-06 (No aplica, cubierto en BD) para admin, profesor, usuario y anónimo. PER-05 ("Mis préstamos" del usuario) está bloqueado porque la vista no existe (sección 7). pgTAP cubre los cinco perfiles.
- [x] Linter sin errores ni warnings en los archivos del módulo — evidencia: 10 oct 2026, `npm run lint` (oxlint): 0 errores; los 2 warnings son de `src/modules/dashboard/Dashboard.jsx:17` (código compartido), ninguno en `src/modules/inventario/`. `npm run build`: correcto. `npx supabase test db --local`: `Files=1, Tests=109, Result: PASS`.
- [x] Corregir DEV-13: devolver en el mismo minuto en que se registró el préstamo daba "La fecha de devolución no puede ser anterior a la fecha del préstamo." porque `fecha_asignacion` tiene microsegundos y JavaScript la trunca a milisegundos — evidencia: `fechaDevolucionFinal()` en `constantes.js` sube `fecha_asignacion` al segundo siguiente (cubre también `.000` con microsegundos) y `DevolucionForm.jsx` la usa en lugar del `Math.max` anterior. Prueba de humo temporal del 10 oct 2026 (Vite SSR con `inventarioService.js` y `constantes.js` reales, BD local): **16 ok, 0 fallos**; incluye un control donde el cálculo anterior sigue rechazándose, y devoluciones en el mismo minuto en buen estado, dañado → reparado y perdido. El script se borró y la BD local se reinició. Caso DEV-13 en el navegador: Pasa. (Ítem nuevo.)
- [x] Botón "Actualizar" en el aviso de lista desactualizada (OBS-02) — evidencia: `registrarDevolucion()` marca el error con `listaDesactualizada`; `DevolucionForm.jsx` muestra "Actualizar" junto al mensaje y `Prestamos.jsx` cierra el modal y recarga "Préstamos activos" e "Historial por arquero" (`version`). Caso DEV-10: Pasa (7 → 6 pendientes sin cambiar de vista). (Ítem nuevo.)

Verificación después de las correcciones (10 oct 2026): `npm run lint` sin errores (solo los 2 warnings de `Dashboard.jsx:17`, compartido), `npm run build` correcto y `npx supabase test db --local` → `Files=1, Tests=109, Result: PASS`.

Otras observaciones de la ejecución, en [`casos-de-prueba.md`](inventario/casos-de-prueba.md#observaciones-fuera-de-los-casos): OBS-01, el panel se recarga al volver a la pestaña del navegador (`App.jsx`/`Dashboard.jsx`, **pendiente de acordar con Fernando**); OBS-02 (botón "Actualizar") y OBS-04 (celular), corregidas; OBS-03, la tarjeta "Inventario" del inicio del usuario (sección 10).

## 9. Documentación

Documentos en `docs/inventario/`, escritos el 10 oct 2026.

- [x] Diagrama ER de las tablas de inventario — evidencia: [`documentacion-tecnica.md`, sección 1](inventario/documentacion-tecnica.md#1-modelo-de-datos) (mermaid `erDiagram`): las 5 tablas del módulo, `arqueros` y `perfiles` (de Fernando) y cada FK con su `ON DELETE`.
- [x] Diagrama de transiciones de estado de las asignaciones — evidencia: [`documentacion-tecnica.md`, sección 4](inventario/documentacion-tecnica.md#4-estados-y-transiciones) (mermaid `stateDiagram-v2`) con el efecto en el stock y la opción de la UI de cada transición. Incluye también el diagrama de estados del artículo (`prestado` y `perdido` automáticos).
- [x] Manual técnico: tablas, triggers, políticas y reglas de stock — evidencia: [`documentacion-tecnica.md`](inventario/documentacion-tecnica.md): tablas y restricciones, triggers con sus mensajes, matriz RLS por rol, vista `v_historial_asignaciones`, migraciones, estructura de `src/modules/inventario/`, cómo correr pgTAP/lint/build en local, dependencias con Fernando, límites conocidos (devolución parcial, fecha límite de devolución, "Registrado por" y RLS de `perfiles`) y problemas abiertos de la UI.
- [x] Manual de usuario: registrar artículos, prestar, devolver y consultar historiales — evidencia: [`manual-usuario.md`](inventario/manual-usuario.md): entrar, ver el inventario, artículos, piezas, tipos de arco, prestar, devolver (normal, dañado, perdido), historiales, significado de cada estado y qué hacer ante cada mensaje. Indica que una devolución siempre es por la cantidad completa del préstamo e incluye el procedimiento provisional para devoluciones parciales. Las imágenes quedan como 19 marcadores `[CAPTURA: …]`.

## 10. Dependencias con Fernando

- [~] Funciones de rol (`rol_actual`, `es_admin`, `es_staff`, `mi_arquero_id`) acordadas — implementadas en `20261009150000_base_roles.sql` (`SECURITY DEFINER`, solo para `authenticated`; un perfil `inactivo` no tiene rol). Falta acordarlas con Fernando.
- [~] `perfiles.arquero_id` acordado — implementado como `bigint UNIQUE` con FK a `arqueros(id)` `ON DELETE SET NULL` en la misma migración. Falta acordarlo con Fernando y definir quién lo asigna: hoy no hay política UPDATE en `perfiles`, así que solo el seed lo llena.
- [~] Router y layout para agregar las páginas de inventario — no hay router. Mientras tanto, `Dashboard.jsx` tiene solo un import y una rama en `renderContenido()` (`if (activeMenu === 'inventario') return <Inventario profile={profile} />`); Sidebar y layout no cambiaron. **Pendiente de acordar con Fernando.**
- [~] Selector de arqueros (depende del módulo de arqueros) — hecho en `SelectorArquero.jsx` con `listarArqueros()`, que lee `id, nombre, identificacion, estado` de `arqueros` directamente (solo lectura). Funciona porque hoy el RLS de `arqueros` es `true` para autenticados; ese RLS es de Fernando y, si cambia, el staff debe seguir pudiendo leer esas columnas. Falta acordarlo.
- [ ] Indicadores de inventario para el dashboard (objetivo 5) — la tarjeta "Inventario" del inicio muestra `0` fijo.

---

## Cambios que tocan código compartido con Fernando

Todo lo de esta lista está fuera de `src/modules/inventario/` y de las migraciones propias de inventario. Nada se cambia sin acordarlo.

**Ya hechos (pendientes de acordar):**
- `supabase/migrations/20261009150000_base_roles.sql`: agrega `perfiles.arquero_id` (UNIQUE, FK a `arqueros`, `ON DELETE SET NULL`) y las funciones `rol_actual()`, `es_admin()`, `es_staff()` y `mi_arquero_id()`.
- `supabase/migrations/20261009150200_inventario_estructura.sql`: recrea `asignaciones_arquero_id_fkey` y `asignaciones_piezas_arquero_id_fkey` hacia `arqueros` con `ON DELETE RESTRICT` (antes `CASCADE`). Efecto en Fernando: un arquero con préstamos ya no se puede borrar.
- `supabase/seed.sql`: inserta 4 arqueros y cambia `perfiles.rol` y `perfiles.arquero_id` de los usuarios de prueba (solo local).
- `src/modules/dashboard/Dashboard.jsx` (10 oct 2026): un import de `Inventario` y la rama `activeMenu === 'inventario'` en `renderContenido()`. Nada más cambió.
- `supabase/migrations/20261010120000_inventario_reglas_prestamo.sql`: `asignacion_validar_alta()` lee `arqueros.estado` (solo lectura) para rechazar préstamos a arqueros inactivos. No modifica la tabla `arqueros`, pero si Fernando cambia el significado de `estado`, esta regla cambia con él.

**Necesarios a futuro:**
- `src/modules/dashboard/Dashboard.jsx`: tarjeta "Inventario" con dato real; `onClick` de "+ Agregar inventario".
- `src/modules/Sidebar/Sidebar.jsx`: entrada para que el rol `usuario` vea sus préstamos.
- RLS de `perfiles`: que staff pueda leer el nombre de quien registró cada movimiento (`registrado_por_nombre`).
- Política o flujo para asignar `perfiles.arquero_id` (quién vincula un usuario con su arquero).
- `arqueros_tipo_arco_id_fkey` (`ON DELETE SET NULL`): ya no aplica desde inventario, porque `tipos_arco` no se puede borrar por API (sección 1, Seguridad).
