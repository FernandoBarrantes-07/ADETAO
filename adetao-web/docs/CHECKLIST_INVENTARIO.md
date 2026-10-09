# Checklist — Inventario y trazabilidad (Objetivo 4)

Alcance: objetivo 4 del oficio ADETAO-00027-2026 y Plan de Trabajo 3.4. Registrar y administrar arcos, tipos de arco y piezas, relacionando el inventario con los arqueros para su trazabilidad. Semanas 6-8.

## Instrucciones para el agente

- Este archivo es la guía de trabajo del módulo de inventario. Los ítems están en orden de implementación.
- Al verificar o terminar un ítem, marcar su estado y agregar evidencia (archivo, migración, tabla, función, política).
- No marcar `[x]` sin evidencia verificable.
- Respetar `.cursor/rules/alcance-inventario.mdc`. Los ítems de la sección 10 dependen de Fernando y no se implementan sin acordarlos.

| Marca | Significado |
|---|---|
| `[x]` | Completo y verificado |
| `[~]` | Parcial |
| `[ ]` | Pendiente |
| `[?]` | No verificado |

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
- [x] `piezas.codigo` (UNIQUE) y `piezas.ubicacion` — evidencia: columnas y `piezas_codigo_unique` en `inventario_estructura`.
- [x] `inventory_status` normalizado: `No disponible` → `no_disponible`, agregar `perdido` — evidencia: `RENAME VALUE` y `ADD VALUE` en `inventario_enums`.
- [x] Enum `estado_asignacion` (activo, devuelto, perdido, dañado) en `asignaciones` y `asignaciones_piezas` — evidencia: tipo creado en `inventario_enums`; las columnas `estado` (antes `varchar(30)`) se convierten con `USING` en `inventario_estructura`, con default `'activo'`.
- [x] CHECK `fecha_devolucion >= fecha_asignacion` — evidencia: `asignaciones_fechas_check` y `asignaciones_piezas_fechas_check`.
- [x] CHECK: estado `devuelto` implica `fecha_devolucion` no nula — evidencia: `asignaciones_devuelto_fecha_check` y `asignaciones_piezas_devuelto_fecha_check`. Si se devuelve sin fecha, el trigger pone `now()`.
- [x] FK de `asignaciones` y `asignaciones_piezas` hacia `arqueros` con `ON DELETE RESTRICT` — evidencia: `asignaciones_arquero_id_fkey` y `asignaciones_piezas_arquero_id_fkey` recreadas; prueba "No se puede borrar un arquero con asignaciones".
- [x] Índices en `asignaciones_piezas(arquero_id)`, `asignaciones_piezas(pieza_id)` y `registrado_por` de ambas tablas de asignaciones — evidencia: `idx_asignaciones_piezas_arquero`, `idx_asignaciones_piezas_pieza`, `idx_asignaciones_registrado_por`, `idx_asignaciones_piezas_registrado_por`.
- [x] `DEFAULT auth.uid()` en `registrado_por` de ambas tablas de asignaciones — evidencia: `inventario_estructura`. Además, `asignacion_validar_alta()` fuerza `registrado_por = auth.uid()` al insertar y `asignacion_validar_cambio()` impide cambiarlo; prueba "registrado_por se fuerza a auth.uid()".

### Lógica de stock
- [x] Trigger al asignar: valida `cantidad_disponible >= cantidad` y descuenta. Error en español si no alcanza — evidencia: `asignacion_validar_alta()` con `trg_asignaciones_validar_alta` y `trg_asignaciones_piezas_validar_alta`. También rechaza altas con estado distinto de `activo` y artículos en `mantenimiento`, `dañado`, `no_disponible` o `perdido`. `prestado` no participa en ninguna regla.
- [x] Bloqueo de concurrencia (`SELECT ... FOR UPDATE`) sobre el artículo al asignar — evidencia: `asignacion_validar_alta()`. No se probó con dos sesiones concurrentes.
- [x] Transiciones de estado permitidas — evidencia: `asignacion_validar_cambio()` con `trg_asignaciones_validar_cambio` y `trg_asignaciones_piezas_validar_cambio`; cada caso tiene prueba.
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
- [x] Sin política de DELETE en asignaciones (el historial se conserva) — evidencia: `inventario_rls` no crea políticas DELETE para estas tablas; pruebas "Admin/Profesor no puede borrar asignaciones" (0 filas afectadas).

### Trazabilidad
- [x] Vista de historial que una `asignaciones` y `asignaciones_piezas` (artículo, arquero, cantidad, fechas, estado, quién registró) — evidencia: `v_historial_asignaciones` (`security_invoker = true`) en `inventario_historial`; pruebas de visibilidad por rol. Nota: `registrado_por_nombre` sale nulo para quien no puede leer ese perfil, por el RLS actual de `perfiles` (se resuelve en la sección 6, de acuerdo con Fernando).

### Seguridad (RLS)
- [x] `tipos_arco`: todos leen; solo admin escribe — evidencia: políticas `tipos_arco: *` en `inventario_rls`; pruebas de admin, profesor y usuario.
- [x] `inventario`, `piezas`: staff lee y escribe; usuario lee solo los artículos de sus asignaciones; solo admin borra — evidencia: políticas `inventario: *` y `piezas: *`; pruebas de cada rol.
- [x] `asignaciones`, `asignaciones_piezas`: staff lee, inserta y modifica; usuario lee las suyas; sin DELETE — evidencia: políticas `asignaciones: *` y `asignaciones_piezas: *`; pruebas de cada rol.
- [x] Se eliminaron las políticas `true` anteriores de estas tablas — evidencia: 10 `drop policy` al inicio de `inventario_rls`.

### Validación
- [x] Migraciones aplicadas sin errores en local (`supabase db reset`) — evidencia: 9 oct 2026, `npx supabase db reset` aplicó las 7 migraciones ("Finished supabase db reset"). Solo corrió el contenedor de Postgres: las demás imágenes fallaron al descargar (`tls: bad record MAC`) y no se necesitan para estas pruebas.
- [x] Prueba de RLS por rol (admin, profesor, usuario) en `supabase/tests/` — evidencia: `npx supabase test db` → `Files=1, Tests=75, Result: PASS`. Cubre admin, profesor, usuario vinculado, usuario sin arquero y anónimo.
- [ ] Migraciones aplicadas en el proyecto DEV.
- [ ] Migraciones aplicadas en producción (con confirmación explícita). Antes, revisar con consultas de solo lectura los arcos sin `tipo_arco_id`, los valores de `estado` que no se puedan mapear y que `cantidad_disponible` cuadre con las asignaciones activas.

---

## 2. Catálogo de tipos de arco

- [ ] Listado.
- [ ] Crear y editar (nombre único con mensaje claro).
- [ ] Desactivar en lugar de eliminar.
- [ ] Advertencia al desactivar un tipo de arco en uso (arqueros o inventario).
- [ ] Solo el administrador puede escribir (UI y RLS).

## 3. Inventario (artículos)

- [ ] Listado con búsqueda.
- [ ] Filtros: tipo, estado, tipo de arco, con o sin unidades disponibles.
- [ ] Crear y editar: nombre, código, tipo, descripción, cantidad, ubicación, estado.
- [ ] Código único con mensaje claro.
- [ ] Arcos: selección obligatoria de tipo de arco desde el catálogo.
- [ ] Mostrar cantidad total y disponible.
- [ ] Cambiar estado del artículo (mantenimiento, dañado, no disponible).
- [ ] Ajuste de cantidad que no deje `cantidad` por debajo de lo asignado.

## 4. Piezas

- [ ] Listado con búsqueda y filtros.
- [ ] Crear y editar: nombre, código, tipo, descripción, cantidad, ubicación, estado.
- [ ] Mostrar cantidad total y disponible.
- [ ] Cambiar estado.

## 5. Asignaciones (préstamos)

- [ ] Asignar artículo a un arquero: selector de arquero activo, cantidad, observaciones.
- [ ] Asignar piezas a un arquero.
- [ ] Mostrar el error de stock insuficiente de forma clara.
- [ ] Registrar devolución con fecha.
- [ ] Marcar como perdido o dañado.
- [ ] Pasar de dañado a devuelto tras reparación.
- [ ] `registrado_por` se llena automáticamente.
- [ ] Definir con ADETAO si los préstamos tienen fecha límite de devolución (si sí, agregar `fecha_devolucion_prevista` y estado de préstamo vencido).

## 6. Trazabilidad e historiales

- [ ] Historial por artículo: quién lo tuvo, cuándo, en qué estado volvió.
- [ ] Historial por arquero: qué tiene ahora y qué tuvo.
- [ ] Listado de préstamos activos.
- [ ] Mostrar el nombre de quien registró cada movimiento.

## 7. Permisos en la interfaz

- [ ] Administrador: acceso completo al módulo.
- [ ] Profesor: gestiona inventario, piezas y asignaciones; no edita el catálogo de tipos de arco.
- [ ] Usuario: ve solo sus asignaciones.
- [ ] Botones y acciones ocultos según el rol (además de RLS).

## 8. Calidad

- [ ] Validaciones en cliente (cantidades positivas, campos obligatorios).
- [ ] Mensajes de error en español.
- [ ] Estados de carga y de listado vacío.
- [ ] Diseño usable desde celular.
- [ ] Casos de prueba funcionales documentados:
  - [ ] Asignar con stock suficiente.
  - [ ] Asignar sin stock suficiente.
  - [ ] Devolver.
  - [ ] Marcar perdido y dañado.
  - [ ] Intentar una transición inválida.
  - [ ] Intentar modificar cantidad o arquero de una asignación.
  - [ ] Acceso por cada rol.
- [ ] Linter sin errores ni warnings en los archivos del módulo.

## 9. Documentación

- [ ] Diagrama ER de las tablas de inventario.
- [ ] Diagrama de transiciones de estado de las asignaciones.
- [ ] Manual técnico: tablas, triggers, políticas y reglas de stock.
- [ ] Manual de usuario: registrar artículos, prestar, devolver y consultar historiales.

## 10. Dependencias con Fernando

- [~] Funciones de rol (`rol_actual`, `es_admin`, `es_staff`, `mi_arquero_id`) acordadas — implementadas en `20261009150000_base_roles.sql` (`SECURITY DEFINER`, solo para `authenticated`; un perfil `inactivo` no tiene rol). Falta acordarlas con Fernando.
- [~] `perfiles.arquero_id` acordado — implementado como `bigint UNIQUE` con FK a `arqueros(id)` `ON DELETE SET NULL` en la misma migración. Falta acordarlo con Fernando y definir quién lo asigna: hoy no hay política UPDATE en `perfiles`.
- [ ] Router y layout para agregar las páginas de inventario.
- [ ] Selector de arqueros (depende del módulo de arqueros).
- [ ] Indicadores de inventario para el dashboard (objetivo 5).
