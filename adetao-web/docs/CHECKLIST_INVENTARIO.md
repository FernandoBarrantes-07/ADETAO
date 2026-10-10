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

Última auditoría: 10 oct 2026 (solo lectura; no se modificó código ni BD). Actualizado el 10 oct 2026 con las reglas de préstamo (migración `20261010120000_inventario_reglas_prestamo.sql`, solo en local).

---

## Resumen del estado

| Sección | Hecho | Parcial | Pendiente | Por verificar |
|---|---|---|---|---|
| 1. Base de datos | 32 | 0 | 2 | 1 |
| 2. Tipos de arco | 5 | 0 | 0 | 0 |
| 3. Inventario | 8 | 0 | 0 | 0 |
| 4. Piezas | 4 | 0 | 0 | 0 |
| 5. Asignaciones | 1 | 6 | 1 | 0 |
| 6. Trazabilidad | 0 | 4 | 0 | 0 |
| 7. Permisos en la UI | 0 | 3 | 1 | 0 |
| 8. Calidad | 0 | 3 | 3 | 0 |
| 9. Documentación | 0 | 0 | 4 | 0 |
| 10. Dependencias con Fernando | 0 | 3 | 2 | 0 |

La BD del módulo está terminada y probada en local. La UI de tipos de arco, inventario y piezas existe en `src/modules/inventario/` y se abre desde el menú "Inventario" (secciones 2 a 4, 10 oct 2026). Faltan las asignaciones, los historiales y la vista del usuario (secciones 5 a 7).

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
- [x] Se eliminaron las políticas `true` anteriores de estas tablas — evidencia: 10 `drop policy` al inicio de `inventario_rls`; en la BD local solo quedan las 18 políticas nuevas (`pg_policies`, 10 oct 2026).
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
- `Inventario.jsx`: contenedor con pestañas Artículos, Piezas y Tipos de arco, sin router. Se muestra desde el menú Inventario de `Dashboard.jsx` (ver sección 10).
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

No hay UI.

- [~] Asignar artículo a un arquero: selector de arquero activo, cantidad, observaciones — BD, RLS y pruebas listos ("Profesor asigna con stock suficiente"). Falta UI, el selector de arqueros (sección 10) y la validación de arquero activo (sección 1).
- [~] Asignar piezas a un arquero — BD y pruebas listos ("Profesor asigna piezas"). Falta UI.
- [~] Mostrar el error de stock insuficiente de forma clara — la BD devuelve "Stock insuficiente para "…": se solicitaron N y hay M disponibles." Falta mostrarlo en la UI.
- [~] Registrar devolución con fecha — BD: transición a `devuelto`, fecha automática si no se envía. Falta UI.
- [~] Marcar como perdido o dañado — BD: transiciones probadas. Falta UI.
- [~] Pasar de dañado a devuelto tras reparación — BD: prueba "Transición dañado -> devuelto". Falta UI.
- [x] `registrado_por` se llena automáticamente — evidencia: default `auth.uid()` y `asignacion_validar_alta()`; prueba "registrado_por se fuerza a auth.uid() aunque se envíe otro valor". No requiere UI.
- [ ] Definir con ADETAO si los préstamos tienen fecha límite de devolución (si sí, agregar `fecha_devolucion_prevista` y estado de préstamo vencido).

## 6. Trazabilidad e historiales

No hay UI.

- [~] Historial por artículo: quién lo tuvo, cuándo, en qué estado volvió — BD: `v_historial_asignaciones` filtrando por `tipo_registro` y `articulo_id`. Falta UI.
- [~] Historial por arquero: qué tiene ahora y qué tuvo — BD: la misma vista filtrando por `arquero_id`; el usuario solo ve el suyo. Falta UI.
- [~] Listado de préstamos activos — BD: la misma vista con `estado in ('activo', 'dañado')`. Falta UI.
- [~] Mostrar el nombre de quien registró cada movimiento — BD: columna `registrado_por_nombre`. Para staff sale nulo salvo en sus propios registros, porque el RLS de `perfiles` solo deja leer el perfil propio (depende de Fernando, sección 10).

## 7. Permisos en la interfaz

El RLS de las 5 tablas está hecho y probado por rol (sección 1). En la UI solo existe el menú: `src/modules/Sidebar/Sidebar.jsx` muestra "Inventario" a `administrador` y `profesor`.

- [~] Administrador: acceso completo al módulo — RLS listo; el menú aparece. Falta la UI del módulo.
- [~] Profesor: gestiona inventario, piezas y asignaciones; no edita el catálogo de tipos de arco — RLS listo y probado; el menú aparece. Falta la UI y ocultar la edición del catálogo.
- [~] Usuario: ve solo sus asignaciones — RLS listo y probado. El rol `usuario` no tiene ninguna entrada en el menú para ver sus préstamos (cambio en `Sidebar.jsx`, pendiente de acordar con Fernando).
- [ ] Botones y acciones ocultos según el rol (además de RLS) — falta UI.

## 8. Calidad

- [ ] Validaciones en cliente (cantidades positivas, campos obligatorios) — no hay formularios. La BD sí valida (`*_cantidad_check`, `NOT NULL`, triggers).
- [~] Mensajes de error en español — todos los `raise exception` de los triggers están en español. Falta traducir en la UI los errores de Postgres que no son nuestros (`23505` UNIQUE, `23514` CHECK, `23503` FK, `42501` RLS).
- [ ] Estados de carga y de listado vacío — no hay listados del módulo.
- [ ] Diseño usable desde celular — no hay UI del módulo.
- [~] Casos de prueba funcionales documentados — cubiertos a nivel BD por pgTAP (`inventario.test.sql`, 75/75 PASS); faltan casos funcionales de UI documentados:
  - [~] Asignar con stock suficiente — pgTAP "Profesor asigna con stock suficiente".
  - [~] Asignar sin stock suficiente — pgTAP "Asignar sin stock suficiente se rechaza" (inventario y piezas).
  - [~] Devolver — pgTAP "Transición activo -> devuelto", "Devolver piezas".
  - [~] Marcar perdido y dañado — pgTAP "Transición activo -> perdido", "Transición activo -> dañado", "Transición dañado -> perdido".
  - [~] Intentar una transición inválida — pgTAP "Transición dañado -> activo se rechaza", "Transición devuelto -> activo se rechaza".
  - [~] Intentar modificar cantidad o arquero de una asignación — pgTAP "Modificar la cantidad de una asignación se rechaza", "Cambiar el arquero de una asignación se rechaza".
  - [~] Acceso por cada rol — pgTAP para admin, profesor, usuario vinculado, usuario sin arquero y anónimo.
- [~] Linter sin errores ni warnings en los archivos del módulo — no hay archivos del módulo. `npx oxlint src` (10 oct 2026): 0 errores y 2 warnings, ambos en `Dashboard.jsx:16` (código compartido).

## 9. Documentación

- [ ] Diagrama ER de las tablas de inventario.
- [ ] Diagrama de transiciones de estado de las asignaciones — solo existe la tabla de transiciones en el comentario inicial de `20261009150300_inventario_stock.sql`.
- [ ] Manual técnico: tablas, triggers, políticas y reglas de stock — la sección 1 de este archivo y los comentarios de las migraciones sirven de base.
- [ ] Manual de usuario: registrar artículos, prestar, devolver y consultar historiales.

## 10. Dependencias con Fernando

- [~] Funciones de rol (`rol_actual`, `es_admin`, `es_staff`, `mi_arquero_id`) acordadas — implementadas en `20261009150000_base_roles.sql` (`SECURITY DEFINER`, solo para `authenticated`; un perfil `inactivo` no tiene rol). Falta acordarlas con Fernando.
- [~] `perfiles.arquero_id` acordado — implementado como `bigint UNIQUE` con FK a `arqueros(id)` `ON DELETE SET NULL` en la misma migración. Falta acordarlo con Fernando y definir quién lo asigna: hoy no hay política UPDATE en `perfiles`, así que solo el seed lo llena.
- [~] Router y layout para agregar las páginas de inventario — no hay router. Mientras tanto, `Dashboard.jsx` tiene solo un import y una rama en `renderContenido()` (`if (activeMenu === 'inventario') return <Inventario profile={profile} />`); Sidebar y layout no cambiaron. **Pendiente de acordar con Fernando.**
- [ ] Selector de arqueros (depende del módulo de arqueros) — hoy el RLS de `arqueros` es `true` para autenticados, así que el selector podría leer la tabla directamente, pero ese RLS es de Fernando y puede cambiar.
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
