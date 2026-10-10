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

Última auditoría: 10 oct 2026 (solo lectura; no se modificó código ni BD).

---

## Resumen del estado

| Sección | Hecho | Parcial | Pendiente | Por verificar |
|---|---|---|---|---|
| 1. Base de datos | 26 | 1 | 5 | 2 |
| 2. Tipos de arco | 0 | 3 | 2 | 0 |
| 3. Inventario | 0 | 5 | 3 | 0 |
| 4. Piezas | 0 | 2 | 2 | 0 |
| 5. Asignaciones | 1 | 6 | 1 | 0 |
| 6. Trazabilidad | 0 | 4 | 0 | 0 |
| 7. Permisos en la UI | 0 | 3 | 1 | 0 |
| 8. Calidad | 0 | 3 | 3 | 0 |
| 9. Documentación | 0 | 0 | 4 | 0 |
| 10. Dependencias con Fernando | 0 | 2 | 3 | 0 |

La BD del módulo está terminada y probada en local. No existe ninguna interfaz: `src/modules/inventario/` no existe y el menú "Inventario" muestra un placeholder (ver sección 10).

---

## 1. Base de datos

Migraciones en `supabase/migrations/` (rutas abreviadas abajo sin la carpeta):
- `20261009141945_remote_schema.sql`: baseline traído con `db pull` desde producción, sin escribir en el historial remoto. Ya incluye `crear_perfil_usuario()`, el trigger `on_auth_user_created` sobre `auth.users`, `rls_auto_enable()` y el event trigger `ensure_rls`, así que no hizo falta una migración `auth_triggers`.
- `20261009150000_base_roles.sql`: compartida, **pendiente de acordar con Fernando** (ver sección 10).
- `20261009150100_inventario_enums.sql`, `20261009150200_inventario_estructura.sql`, `20261009150300_inventario_stock.sql`, `20261009150400_inventario_historial.sql`, `20261009150500_inventario_rls.sql`.

Pruebas en `supabase/tests/database/inventario.test.sql` (75 pruebas pgTAP).

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
- [x] Trigger al asignar: valida `cantidad_disponible >= cantidad` y descuenta. Error en español si no alcanza — evidencia: `asignacion_validar_alta()` con `trg_asignaciones_validar_alta` y `trg_asignaciones_piezas_validar_alta`. También rechaza altas con estado distinto de `activo` y artículos en `mantenimiento`, `dañado`, `no_disponible` o `perdido`. `prestado` no participa en ninguna regla. Pruebas "Asignar sin stock suficiente se rechaza", "Asignar un artículo en mantenimiento se rechaza", "Una asignación nueva con estado distinto de activo se rechaza".
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
- [x] Sin política de DELETE en asignaciones (el historial se conserva) — evidencia: `inventario_rls` no crea políticas DELETE para estas tablas (confirmado en `pg_policies` local); pruebas "Admin/Profesor no puede borrar asignaciones" (0 filas afectadas).
- [ ] La asignación exige un arquero `activo` — `asignacion_validar_alta()` no revisa `arqueros.estado`; hoy se puede prestar equipo a un arquero inactivo. Falta la validación en el trigger y su prueba. (Ítem nuevo.)
- [ ] Regla para cambiar el estado de un artículo con asignaciones activas — hoy staff puede poner `inventario.estado`/`piezas.estado` en `dañado`, `perdido`, `mantenimiento` o `no_disponible` aunque tenga unidades prestadas, y poner `perdido` a nivel de artículo no toca `cantidad`. Falta decidir: bloquearlo, permitirlo solo si no hay asignaciones activas, o dejarlo libre. Decidir también si se elimina el uso de `prestado` (no lo usa ninguna regla). (Ítem nuevo.)
- [ ] Al asignar un `tipo_arco_id` a un artículo, validar que el tipo de arco esté `activo` — no existe. (Ítem nuevo.)

### Trazabilidad
- [x] Vista de historial que una `asignaciones` y `asignaciones_piezas` (artículo, arquero, cantidad, fechas, estado, quién registró) — evidencia: `v_historial_asignaciones` (`security_invoker = true`) en `inventario_historial`; pruebas "Profesor ve todo el historial", "Usuario ve solo su historial", "Usuario sin arquero no ve historial", "Anónimo no puede consultar la vista de historial". Nota: `registrado_por_nombre` sale nulo para quien no puede leer ese perfil, por el RLS actual de `perfiles` (se resuelve en la sección 6, de acuerdo con Fernando).

### Seguridad (RLS)
- [x] `tipos_arco`: todos leen; solo admin escribe — evidencia: políticas `tipos_arco: *` en `inventario_rls`; pruebas "Admin inserta/actualiza tipos de arco", "Profesor no puede insertar tipos de arco", "Usuario no puede insertar tipos de arco".
- [~] `tipos_arco`: desactivar en lugar de eliminar — la columna `estado` existe, pero la política `tipos_arco: admin elimina` permite borrar. Si el tipo está en `inventario`, el FK `RESTRICT` lo impide; si solo está en `arqueros`, el borrado pasa y deja `arqueros.tipo_arco_id` en `NULL` (`arqueros_tipo_arco_id_fkey ... ON DELETE SET NULL`, tabla de Fernando). Falta quitar la política DELETE o bloquear el borrado si el tipo está en uso. (Ítem nuevo.)
- [x] `inventario`, `piezas`: staff lee y escribe; usuario lee solo los artículos de sus asignaciones; solo admin borra — evidencia: políticas `inventario: *` y `piezas: *`; pruebas "Profesor inserta inventario", "Profesor no puede borrar inventario", "Usuario ve solo los artículos que tiene o tuvo asignados", "Usuario no puede modificar inventario".
- [x] `asignaciones`, `asignaciones_piezas`: staff lee, inserta y modifica; usuario lee las suyas; sin DELETE — evidencia: políticas `asignaciones: *` y `asignaciones_piezas: *`; pruebas "Usuario ve solo sus asignaciones", "Usuario no puede crear asignaciones", "Admin ve todas las asignaciones".
- [x] Se eliminaron las políticas `true` anteriores de estas tablas — evidencia: 10 `drop policy` al inicio de `inventario_rls`; en la BD local solo quedan las 18 políticas nuevas (`pg_policies`, 10 oct 2026).
- [?] Privilegios de `anon` sobre las tablas de inventario — `anon` conserva todos los privilegios del baseline (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`) sobre `inventario`, `piezas`, `asignaciones`, `asignaciones_piezas` y `tipos_arco` (consulta a `information_schema.role_table_grants` en local). RLS bloquea filas para `anon` y la vista sí tiene el privilegio revocado, pero `TRUNCATE` no pasa por RLS. PostgREST no expone `TRUNCATE`, así que el riesgo es bajo. Probar a mano con la clave anon (`INSERT`/`UPDATE`/`DELETE` vía REST deben devolver 0 filas o 401/403) y decidir si se revocan los privilegios de `anon` en estas 5 tablas. (Ítem nuevo.)

### Datos de desarrollo
- [x] Seed local con usuarios por rol y datos de inventario — evidencia: `supabase/seed.sql` crea `admin@adetao.test`, `profesor@adetao.test` y `usuario@adetao.test` (vinculado a un arquero), 4 tipos de arco, 8 artículos (uno en `mantenimiento`), 6 piezas, 4 asignaciones de inventario (una devuelta) y 3 de piezas. En local: `ARC-001 4/2` y `ARC-003 1/0`, que cuadran con las asignaciones activas. Solo para local: las contraseñas son públicas. (Ítem nuevo.)

### Validación
- [x] Migraciones aplicadas sin errores en local — evidencia: 9 oct 2026, `npx supabase db reset` aplicó las 7 migraciones ("Finished supabase db reset"). 10 oct 2026: `npx supabase migration list --local` muestra las 7 aplicadas.
- [x] Prueba de RLS por rol (admin, profesor, usuario) en `supabase/tests/` — evidencia: 10 oct 2026, `npx supabase test db` → `Files=1, Tests=75, Result: PASS` (también pasó el 9 oct). Cubre admin, profesor, usuario vinculado, usuario sin arquero y anónimo. Se corrió solo con el contenedor de Postgres (`supabase start -x ...`).
- [ ] Migraciones aplicadas en el proyecto DEV.
- [ ] Migraciones aplicadas en producción (con confirmación explícita). Antes, revisar con consultas de solo lectura los arcos sin `tipo_arco_id`, los valores de `estado` que no se puedan mapear y que `cantidad_disponible` cuadre con las asignaciones activas.

---

## 2. Catálogo de tipos de arco

No hay UI: no existe página, componente ni servicio de tipos de arco.

- [ ] Listado — falta UI.
- [~] Crear y editar (nombre único con mensaje claro) — BD: `tipos_arco_nombre_unique`. Falta UI y traducir el error `23505` a un mensaje claro.
- [~] Desactivar en lugar de eliminar — BD: columna `tipos_arco.estado`. Falta UI y quitar o restringir el DELETE (ver sección 1, Seguridad).
- [ ] Advertencia al desactivar un tipo de arco en uso (arqueros o inventario) — no existe ni en BD ni en UI. Contar en `inventario` está en el alcance; contar en `arqueros` es solo lectura de una tabla de Fernando.
- [~] Solo el administrador puede escribir (UI y RLS) — RLS hecho y probado (`tipos_arco: admin *`). Falta ocultar las acciones en la UI para profesor y usuario.

## 3. Inventario (artículos)

No hay UI: el menú "Inventario" muestra "Este módulo será desarrollado próximamente." (`renderContenido()` en `src/modules/dashboard/Dashboard.jsx`) y el botón "+ Agregar inventario" del inicio no tiene `onClick`.

- [ ] Listado con búsqueda — falta UI.
- [ ] Filtros: tipo, estado, tipo de arco, con o sin unidades disponibles — falta UI. BD: índices `idx_inventario_tipo`, `idx_inventario_estado`, `idx_inventario_tipo_arco`.
- [ ] Crear y editar: nombre, código, tipo, descripción, cantidad, ubicación, estado — falta UI. BD y RLS listos (`inventario: staff inserta/actualiza`).
- [~] Código único con mensaje claro — BD: `inventario_codigo_unique`. Falta UI y traducir el error `23505`.
- [~] Arcos: selección obligatoria de tipo de arco desde el catálogo — BD: `inventario_arco_tipo_arco_check` y FK. Falta el selector en la UI (solo tipos `activo`).
- [~] Mostrar cantidad total y disponible — BD: `cantidad` y `cantidad_disponible` mantenidas por triggers. Falta UI.
- [~] Cambiar estado del artículo (mantenimiento, dañado, no disponible) — BD: enum `inventory_status` y política de UPDATE para staff; el trigger de alta ya impide prestar artículos en esos estados. Falta UI y la regla con asignaciones activas (sección 1).
- [~] Ajuste de cantidad que no deje `cantidad` por debajo de lo asignado — BD: `articulo_control_stock()`; prueba "Bajar cantidad por debajo de lo asignado se rechaza". Falta UI que muestre el error.

## 4. Piezas

No hay UI.

- [ ] Listado con búsqueda y filtros — falta UI.
- [ ] Crear y editar: nombre, código, tipo, descripción, cantidad, ubicación, estado — falta UI. BD y RLS listos (`piezas_codigo_unique`, `piezas: staff inserta/actualiza`).
- [~] Mostrar cantidad total y disponible — BD: triggers `trg_piezas_control_stock` y de asignación. Falta UI.
- [~] Cambiar estado — BD: `piezas.estado` (`inventory_status`) y RLS. Falta UI.

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
- [ ] Router y layout para agregar las páginas de inventario — no hay router. La navegación es el estado `activeMenu` de `Dashboard.jsx`; montar el módulo requiere agregar en `renderContenido()` un caso `activeMenu === 'inventario'` que renderice el componente del módulo.
- [ ] Selector de arqueros (depende del módulo de arqueros) — hoy el RLS de `arqueros` es `true` para autenticados, así que el selector podría leer la tabla directamente, pero ese RLS es de Fernando y puede cambiar.
- [ ] Indicadores de inventario para el dashboard (objetivo 5) — la tarjeta "Inventario" del inicio muestra `0` fijo.

---

## Cambios que tocan código compartido con Fernando

Todo lo de esta lista está fuera de `src/modules/inventario/` y de las migraciones propias de inventario. Nada se cambia sin acordarlo.

**Ya hechos (pendientes de acordar):**
- `supabase/migrations/20261009150000_base_roles.sql`: agrega `perfiles.arquero_id` (UNIQUE, FK a `arqueros`, `ON DELETE SET NULL`) y las funciones `rol_actual()`, `es_admin()`, `es_staff()` y `mi_arquero_id()`.
- `supabase/migrations/20261009150200_inventario_estructura.sql`: recrea `asignaciones_arquero_id_fkey` y `asignaciones_piezas_arquero_id_fkey` hacia `arqueros` con `ON DELETE RESTRICT` (antes `CASCADE`). Efecto en Fernando: un arquero con préstamos ya no se puede borrar.
- `supabase/seed.sql`: inserta 4 arqueros y cambia `perfiles.rol` y `perfiles.arquero_id` de los usuarios de prueba (solo local).

**Necesarios a futuro:**
- `src/modules/dashboard/Dashboard.jsx`: montar el módulo en `renderContenido()`; tarjeta "Inventario" con dato real; `onClick` de "+ Agregar inventario".
- `src/modules/Sidebar/Sidebar.jsx`: entrada para que el rol `usuario` vea sus préstamos.
- RLS de `perfiles`: que staff pueda leer el nombre de quien registró cada movimiento (`registrado_por_nombre`).
- Política o flujo para asignar `perfiles.arquero_id` (quién vincula un usuario con su arquero).
- `arqueros_tipo_arco_id_fkey` (`ON DELETE SET NULL`): decidir junto con el DELETE de `tipos_arco` (sección 1, Seguridad).
- Lectura de `arqueros.estado` desde el trigger de asignación (validación de arquero activo, sección 1): solo lectura, pero conviene avisarlo.
