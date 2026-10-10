# Casos de prueba funcionales — Inventario y trazabilidad

Módulo: objetivo 4 del oficio ADETAO-00027-2026 (Plan de Trabajo 3.4). Casos de la interfaz por rol para tipos de arco, artículos, piezas, préstamos, devoluciones e historiales. Cada caso indica qué prueba pgTAP de `supabase/tests/database/inventario.test.sql` cubre la misma regla en la base de datos.

## Entorno de la ejecución

| Dato | Valor |
|---|---|
| Fecha | 10 oct 2026, 13:00 a 13:15 (UTC-6) |
| Código | rama `inventario`, commit `bad46eb` |
| Base de datos | Supabase local (`127.0.0.1:54321`), recién reiniciada con `npx supabase db reset --local` (9 migraciones + `supabase/seed.sql`) |
| Aplicación | `npm run dev` (Vite, `http://localhost:5173`), con `.env.development.local` apuntando a la BD local |
| Navegador | navegador integrado de Cursor (Chromium), ventana de 940 px; el caso UI-01 emula 390 px |
| Ejecutó | agente de Cursor, a pedido del responsable del módulo |

Usuarios del seed (solo locales; las contraseñas son públicas):

| Usuario | Contraseña | Rol | Nota |
|---|---|---|---|
| `admin@adetao.test` | `Admin123!` | administrador | "Administrador de prueba" |
| `profesor@adetao.test` | `Profesor123!` | profesor | "Profesor de prueba"; registró los préstamos del seed |
| `usuario@adetao.test` | `Usuario123!` | usuario | vinculado a la arquera María Rodríguez Solís |

Datos del seed que usan los casos: ARC-001 (4 unidades, 2 prestadas a María y Ana), ARC-003 (1 unidad, prestada a José, estado "Prestado"), ARC-004 (1 unidad), ARC-005 (en mantenimiento), DIA-001 (3), PZ-FLE-28 (36, 12 prestadas: 6 a María y 6 a Ana), PZ-FLE-30 (24), PZ-REP-01 (10). Recurvo lo usan 2 arqueros y 3 artículos.

Datos agregados solo para esta ejecución (la BD local se reinició al terminar):
- Arquero temporal "HUMO Arquero inactivo" (`HUMO-0001`, inactivo), creado con psql. La tabla `arqueros` es del módulo de arqueros; solo se insertó un dato local.
- Para PRE-05 y DEV-10 se simuló a otra persona trabajando al mismo tiempo, con `insert`/`update` por psql en local.
- Tipo de arco "PRUEBA Olímpico juvenil", artículo `PRB-ARC-01` y pieza `PRB-PZ-01`, creados desde la interfaz.

Notas de la ejecución:
- Los pasos se ejecutaron con scripts dentro de la página, que escriben en los campos y pulsan los botones con los mismos eventos que un usuario (React recibe `input`, `change` y `click`). Los mensajes de "Resultado obtenido" se copiaron del texto visible.
- La aplicación recarga todo el panel cada vez que la pestaña del navegador vuelve a quedar visible (ver OBS-01). Para que los casos largos no se interrumpieran, a partir de PRE-05 se bloqueó en esa pestaña el evento `visibilitychange`, sin tocar el código.
- Un script de la ejecución renombró ARC-004 por error (pulsó el primer "Editar" de la lista); se restauró desde la interfaz antes de seguir. No afecta ningún resultado.

Verificaciones automáticas del mismo día:
- `npx supabase test db --local`: `Files=1, Tests=109, Result: PASS`.
- `npm run lint`: 0 errores; 2 warnings, ambos en `src/modules/dashboard/Dashboard.jsx:17` (código compartido).
- `npm run build`: correcto.

### Re-ejecución del 10 oct 2026

Después de corregir DEV-13, OBS-02 y OBS-04 se repitieron los casos afectados.

| Dato | Valor |
|---|---|
| Fecha | 10 oct 2026, 13:36 a 13:42 (UTC-6) |
| Código | rama `inventario`, commit `e60c897` más los cambios sin commit en `src/modules/inventario/` (`constantes.js`, `DevolucionForm.jsx`, `inventarioService.js`, `Prestamos.jsx`, `Inventario.css`) |
| Base de datos | Supabase local, reiniciada con `npx supabase db reset --local` antes de la prueba de humo, antes del navegador y al terminar |
| Casos repetidos | DEV-13, DEV-10 (con el botón de OBS-02) y UI-01 |
| Ejecutó | agente de Cursor, a pedido del responsable del módulo |

- Prueba de humo temporal de DEV-13: script Node que cargó con Vite SSR los `inventarioService.js` y `constantes.js` reales contra la BD local. Cada préstamo se devolvió en el mismo minuto, con la fecha calculada como en el formulario (minuto actual sin segundos, pasado por `fechaDevolucionFinal()`). Resultado: **16 ok, 0 fallos**. Cubre: devolución en buen estado de ARC-004 (`fecha_asignacion` `19:36:15.792629+00`, `fecha_devolucion` `19:36:16+00`; ARC-004 vuelve a `1 / 1`); control con el cálculo anterior (`Math.max` sin redondeo), que se sigue rechazando con "La fecha de devolución no puede ser anterior a la fecha del préstamo."; PZ-REP-01 devuelta dañada y luego reparada por el profesor; PZ-FLE-30 reportada como perdida (`23 / 23`). El script se borró.
- Para UI-01 se creó por psql, solo en local, el tipo de arco inactivo "PRUEBA Olímpico juvenil editado", el nombre largo que hacía sobresalir el filtro en la ejecución anterior. Para DEV-10 se simuló otra vez a otra persona con un `update` por psql.
- Verificaciones automáticas después de los cambios: `npm run lint` 0 errores (solo los 2 warnings de `src/modules/dashboard/Dashboard.jsx:17`, compartido); `npm run build` correcto; `npx supabase test db --local` → `Files=1, Tests=109, Result: PASS`.

## Estados

| Estado | Significado |
|---|---|
| Pasa | El resultado obtenido coincide con el esperado |
| Pasa con observaciones | Funciona, pero se anotó un detalle a mejorar |
| Falla | El resultado no coincide con el esperado |
| Bloqueado | No se puede ejecutar todavía; se indica por qué |
| No aplica | La regla no tiene interfaz; se cubre en la BD |

## Resumen

| Grupo | Casos | Pasa | Pasa con obs. | Falla | Bloqueado | No aplica |
|---|---|---|---|---|---|---|
| TA — Tipos de arco | 8 | 8 | 0 | 0 | 0 | 0 |
| ART — Artículos | 10 | 10 | 0 | 0 | 0 | 0 |
| PZ — Piezas | 4 | 4 | 0 | 0 | 0 | 0 |
| PRE — Préstamos | 8 | 8 | 0 | 0 | 0 | 0 |
| DEV — Devoluciones | 13 | 13 | 0 | 0 | 0 | 0 |
| HIS — Historiales | 7 | 6 | 1 | 0 | 0 | 0 |
| PER — Permisos por rol | 6 | 4 | 0 | 0 | 1 | 1 |
| UI — Interfaz | 2 | 2 | 0 | 0 | 0 | 0 |
| **Total** | **58** | **55** | **1** | **0** | **1** | **1** |

Estado después de la [re-ejecución](#re-ejecución-del-10-oct-2026). En la primera ejecución DEV-13 fallaba y UI-01 pasaba con observaciones (53 pasan, 2 con observaciones, 1 falla); los dos se corrigieron y pasan. Observaciones fuera de los casos: OBS-01 a OBS-04, al final (OBS-02 y OBS-04 corregidas).

---

## TA — Tipos de arco

### TA-01 — Crear un tipo de arco
- **Rol:** administrador.
- **Objetivo:** registrar un tipo de arco nuevo en el catálogo.
- **Precondiciones:** sesión de admin; menú Inventario, pestaña "Tipos de arco".
- **Pasos:** 1) "+ Nuevo tipo". 2) Escribir nombre y descripción. 3) "Guardar".
- **Datos:** nombre "PRUEBA Olímpico juvenil"; descripción "Tipo creado en las pruebas funcionales".
- **Resultado esperado:** mensaje de éxito; el tipo aparece en la lista como Activo.
- **Resultado obtenido:** "Tipo de arco creado." La lista muestra `PRUEBA Olímpico juvenil | Tipo creado en las pruebas funcionales | Activo`.
- **Estado:** Pasa.
- **Cobertura en BD:** "Admin inserta tipos de arco".

### TA-02 — Nombre obligatorio
- **Rol:** administrador.
- **Objetivo:** impedir guardar un tipo sin nombre.
- **Precondiciones:** modal "Nuevo tipo de arco" abierto.
- **Pasos:** dejar el nombre vacío y pulsar "Guardar".
- **Datos:** nombre vacío.
- **Resultado esperado:** mensaje de campo obligatorio; no se guarda.
- **Resultado obtenido:** "El nombre es obligatorio."
- **Estado:** Pasa.
- **Cobertura en BD:** `tipos_arco.nombre NOT NULL` (sin prueba pgTAP específica).

### TA-03 — Nombre duplicado (negativo)
- **Rol:** administrador.
- **Objetivo:** rechazar un nombre que ya existe, sin distinguir mayúsculas.
- **Precondiciones:** existe "Recurvo".
- **Pasos:** "+ Nuevo tipo", nombre en minúsculas, "Guardar".
- **Datos:** "recurvo".
- **Resultado esperado:** mensaje claro de duplicado; no se guarda.
- **Resultado obtenido:** `Ya existe un tipo de arco llamado "recurvo".`
- **Estado:** Pasa.
- **Cobertura en BD:** restricción `tipos_arco_nombre_unique` ("Ya existe un tipo de arco con ese nombre." vía `errores.js`); sin prueba pgTAP específica.

### TA-04 — Editar un tipo de arco
- **Rol:** administrador.
- **Objetivo:** cambiar nombre y vaciar la descripción.
- **Precondiciones:** existe el tipo de TA-01.
- **Pasos:** "Editar" en su fila; cambiar el nombre; borrar la descripción (solo espacios); "Guardar".
- **Datos:** nombre "PRUEBA Olímpico juvenil editado"; descripción "   ".
- **Resultado esperado:** se guarda; la descripción vacía se muestra como "—".
- **Resultado obtenido:** "Tipo de arco actualizado." Fila: `PRUEBA Olímpico juvenil editado | — | Activo`.
- **Estado:** Pasa.
- **Cobertura en BD:** "Admin actualiza tipos de arco".

### TA-05 — Advertencia al desactivar un tipo en uso
- **Rol:** administrador.
- **Objetivo:** avisar cuántos arqueros y artículos usan el tipo antes de desactivarlo.
- **Precondiciones:** Recurvo en uso (seed).
- **Pasos:** "Desactivar" en Recurvo; leer el aviso; "Cancelar".
- **Datos:** Recurvo.
- **Resultado esperado:** aviso con 2 arqueros y 3 artículos; al cancelar, Recurvo sigue activo.
- **Resultado obtenido:** `"Recurvo" está en uso por 2 arqueros y 3 artículos de inventario. Esos registros conservarán el tipo, pero ya no se podrá elegir para arcos nuevos.` Tras "Cancelar", Recurvo sigue Activo.
- **Estado:** Pasa.
- **Cobertura en BD:** solo UI (conteo de `contarUsoTipoArco()`).

### TA-06 — Desactivar un tipo sin uso
- **Rol:** administrador.
- **Objetivo:** desactivar (no borrar) un tipo de arco.
- **Precondiciones:** el tipo de TA-04, sin uso.
- **Pasos:** "Desactivar"; confirmar con "Desactivar"; marcar "Mostrar inactivos".
- **Datos:** "PRUEBA Olímpico juvenil editado".
- **Resultado esperado:** confirmación sin advertencia; desaparece de la lista; con "Mostrar inactivos" aparece como Inactivo con "Reactivar". No existe opción de borrar.
- **Resultado obtenido:** confirmación `"PRUEBA Olímpico juvenil editado" no está en uso. ¿Desea desactivarlo?`; luego `"PRUEBA Olímpico juvenil editado" se desactivó.` Con la casilla: `… | Inactivo | Editar Reactivar`.
- **Estado:** Pasa.
- **Cobertura en BD:** "Admin no puede borrar tipos de arco (solo se desactivan)".

### TA-07 — Un tipo inactivo no se ofrece para arcos nuevos
- **Rol:** administrador.
- **Objetivo:** que el formulario de artículo no permita elegir un tipo inactivo.
- **Precondiciones:** tipo de TA-06 inactivo.
- **Pasos:** pestaña Artículos, "+ Nuevo artículo", tipo "arco", abrir "Tipo de arco".
- **Datos:** —
- **Resultado esperado:** el selector no incluye el tipo inactivo; el filtro de la lista sí lo muestra marcado "(inactivo)".
- **Resultado obtenido:** opciones: Barebow, Compuesto, Recurvo, Tradicional. El filtro "Tipo de arco" muestra `PRUEBA Olímpico juvenil editado (inactivo)`.
- **Estado:** Pasa.
- **Cobertura en BD:** "Crear un arco con un tipo de arco inactivo se rechaza", "Cambiar un arco a un tipo de arco inactivo se rechaza", "Editar un arco cuyo tipo se desactivó después está permitido".

### TA-08 — Reactivar un tipo
- **Rol:** administrador.
- **Objetivo:** volver a activar un tipo desactivado.
- **Precondiciones:** tipo de TA-06 inactivo; "Mostrar inactivos" marcado.
- **Pasos:** "Reactivar"; abrir "+ Nuevo artículo" con tipo "arco".
- **Datos:** "PRUEBA Olímpico juvenil editado".
- **Resultado esperado:** vuelve a Activo y se ofrece otra vez para arcos nuevos.
- **Resultado obtenido:** `"PRUEBA Olímpico juvenil editado" se reactivó.`; aparece en el selector "Tipo de arco".
- **Estado:** Pasa.
- **Cobertura en BD:** "Admin actualiza tipos de arco".

## ART — Artículos

### ART-01 — Búsqueda y filtros
- **Rol:** administrador.
- **Objetivo:** encontrar artículos por texto y filtros.
- **Precondiciones:** 8 artículos del seed.
- **Pasos:** buscar texto; aplicar cada filtro por separado; "Limpiar".
- **Datos:** "recurvo", "bodega b", "zzz"; estado Prestado; tipo de arco Recurvo; "Sin unidades disponibles"; tipo diana.
- **Resultado esperado:** cada búsqueda y filtro muestra solo lo que coincide, con el contador "N de M registros" y mensaje cuando no hay coincidencias.
- **Resultado obtenido:** "recurvo" → `3 de 8` (ARC-001, ARC-002, ARC-005); "bodega b" → `2 de 8` (CAR-001, PRO-001); "zzz" → `0 de 8` y "Ningún artículo coincide con los filtros."; Prestado → ARC-003; Recurvo → ARC-001, ARC-002, ARC-005; sin unidades → ARC-003; diana → DIA-001; "Limpiar" vuelve a `8 de 8`.
- **Estado:** Pasa.
- **Cobertura en BD:** solo UI.

### ART-02 — Campos obligatorios y cantidad válida (negativo)
- **Rol:** administrador.
- **Objetivo:** validar el formulario antes de enviar.
- **Precondiciones:** modal "Nuevo artículo".
- **Pasos:** guardar sin nombre; luego sin tipo; luego con cantidad negativa y decimal.
- **Datos:** cantidad `-1` y `1.5`.
- **Resultado esperado:** un mensaje por cada error; no se guarda.
- **Resultado obtenido:** "El nombre es obligatorio."; "El tipo es obligatorio."; "La cantidad debe ser un número entero igual o mayor que 0." (para `-1` y `1.5`).
- **Estado:** Pasa.
- **Cobertura en BD:** `inventario_cantidad_check` y `NOT NULL` (sin prueba pgTAP específica).

### ART-03 — Arco sin tipo de arco (negativo)
- **Rol:** administrador.
- **Objetivo:** exigir el tipo de arco cuando el tipo es "arco".
- **Precondiciones:** modal "Nuevo artículo".
- **Pasos:** tipo "Arco " (con mayúscula y espacio), sin elegir tipo de arco, "Guardar".
- **Datos:** nombre `PRUEBA Arco recurvo 62" 20 lb`.
- **Resultado esperado:** aparece el selector obligatorio y se pide elegirlo.
- **Resultado obtenido:** "Seleccione el tipo de arco."
- **Estado:** Pasa.
- **Cobertura en BD:** "Un arco sin tipo_arco_id se rechaza".

### ART-04 — Código duplicado (negativo)
- **Rol:** administrador.
- **Objetivo:** rechazar un código que ya existe.
- **Precondiciones:** existe ARC-001.
- **Pasos:** completar el formulario con código ARC-001 y "Guardar".
- **Datos:** código `ARC-001`.
- **Resultado esperado:** mensaje claro; no se guarda.
- **Resultado obtenido:** "Ya existe un artículo con ese código."
- **Estado:** Pasa.
- **Cobertura en BD:** restricción `inventario_codigo_unique` (sin prueba pgTAP específica).

### ART-05 — Crear un arco con tipo de arco
- **Rol:** administrador.
- **Objetivo:** registrar un arco nuevo.
- **Precondiciones:** ART-03 y ART-04 corregidos en el mismo formulario.
- **Pasos:** código `PRB-ARC-01`, tipo de arco Recurvo, cantidad 2, ubicación Bodega A, "Guardar".
- **Datos:** los indicados. El selector de estado de un artículo nuevo ofrece Disponible, Mantenimiento, Dañado, No disponible y Perdido.
- **Resultado esperado:** se guarda con disponible = total y el tipo normalizado a "arco".
- **Resultado obtenido:** "Artículo registrado." Fila: `PRB-ARC-01 | PRUEBA Arco recurvo 62" 20 lb | arco | Recurvo | Bodega A | 2 / 2 | Disponible`.
- **Estado:** Pasa.
- **Cobertura en BD:** "Al crear un artículo, cantidad_disponible = cantidad", "Profesor inserta inventario".

### ART-06 — Bajar la cantidad por debajo de lo prestado (negativo)
- **Rol:** administrador.
- **Objetivo:** impedir que el total quede por debajo de las unidades prestadas.
- **Precondiciones:** ARC-001 con 2 unidades prestadas.
- **Pasos:** "Editar" ARC-001; cantidad 1; "Guardar".
- **Datos:** cantidad `1`.
- **Resultado esperado:** el formulario avisa cuántas hay asignadas y rechaza el cambio.
- **Resultado obtenido:** nota "Asignadas: 2. No puede ser menor."; al guardar, "La cantidad no puede ser menor que 2: hay 2 unidades asignadas."
- **Estado:** Pasa.
- **Cobertura en BD:** "Bajar cantidad por debajo de lo asignado se rechaza".

### ART-07 — Subir y bajar la cantidad con préstamos activos
- **Rol:** administrador.
- **Objetivo:** que el disponible se ajuste con la misma diferencia.
- **Precondiciones:** ARC-001 `2 / 4`.
- **Pasos:** editar a 5; luego volver a 4.
- **Datos:** 5 y 4.
- **Resultado esperado:** `3 / 5` y luego `2 / 4`.
- **Resultado obtenido:** "Artículo actualizado."; `3 / 5`; luego `2 / 4`.
- **Estado:** Pasa.
- **Cobertura en BD:** "Subir cantidad ajusta cantidad_disponible con la misma diferencia", "Al bajar cantidad, cantidad_disponible baja la misma diferencia".

### ART-08 — Cambiar el estado con unidades prestadas (negativo)
- **Rol:** administrador.
- **Objetivo:** impedir pasar a mantenimiento, dañado o perdido mientras haya unidades fuera.
- **Precondiciones:** ARC-001 con 2 prestadas.
- **Pasos:** abrir el selector de estado de la fila y el del formulario de edición.
- **Datos:** —
- **Resultado esperado:** esas tres opciones deshabilitadas, con la indicación de registrar primero la devolución.
- **Resultado obtenido:** opciones `Mantenimiento — Primero registre la devolución`, `Dañado — Primero registre la devolución` y `Perdido — Primero registre la devolución`, deshabilitadas en la fila y en el formulario. Al pasar el cursor por el selector: "2 unidades prestadas. Primero registre la devolución para pasar a mantenimiento, dañado o perdido."
- **Estado:** Pasa.
- **Cobertura en BD:** "Pasar a mantenimiento con unidades prestadas se rechaza", "Pasar a dañado con unidades prestadas se rechaza", "Pasar a perdido con unidades prestadas se rechaza".

### ART-09 — "Prestado" no se elige a mano
- **Rol:** administrador.
- **Objetivo:** que "Prestado" solo lo ponga el sistema.
- **Precondiciones:** ARC-003 `0 / 1`, Prestado.
- **Pasos:** abrir su selector de estado; elegir "Disponible".
- **Datos:** —
- **Resultado esperado:** "Prestado" aparece solo como valor actual, deshabilitado; al elegir Disponible sin unidades, el artículo sigue en Prestado con un aviso.
- **Resultado obtenido:** opción `Prestado` deshabilitada. Mensaje: `"Arco compuesto 40-60 lb" sigue en estado "Prestado": no tiene unidades disponibles.`
- **Estado:** Pasa.
- **Cobertura en BD:** "Poner prestado a mano se rechaza", "Crear un artículo en estado prestado se rechaza".

### ART-10 — Cambiar el estado sin préstamos
- **Rol:** administrador.
- **Objetivo:** cambio rápido de estado desde la lista.
- **Precondiciones:** DIA-001 sin préstamos.
- **Pasos:** elegir Mantenimiento; luego Disponible.
- **Datos:** DIA-001.
- **Resultado esperado:** ambos cambios se guardan con mensaje.
- **Resultado obtenido:** `"Diana de espuma 80 cm" ahora está en estado "Mantenimiento".` y luego `… "Disponible".`
- **Estado:** Pasa.
- **Cobertura en BD:** "Sin unidades prestadas se puede pasar a mantenimiento".

## PZ — Piezas

### PZ-01 — Crear una pieza
- **Rol:** administrador.
- **Objetivo:** registrar una pieza; el tipo es opcional y no hay tipo de arco.
- **Precondiciones:** pestaña Piezas.
- **Pasos:** "+ Nueva pieza"; nombre, código, cantidad; "Guardar".
- **Datos:** "PRUEBA Pala de repuesto", `PRB-PZ-01`, 10.
- **Resultado esperado:** campos Nombre*, Código, Tipo, Cantidad total*, Ubicación, Estado, Descripción; se guarda `10 / 10`.
- **Resultado obtenido:** campos como se esperaba; "Pieza registrada."; fila `PRB-PZ-01 | PRUEBA Pala de repuesto | — | — | 10 / 10 | Disponible`.
- **Estado:** Pasa.
- **Cobertura en BD:** "Al crear una pieza, cantidad_disponible = cantidad".

### PZ-02 — Código de pieza duplicado (negativo)
- **Rol:** administrador.
- **Objetivo:** rechazar un código existente.
- **Precondiciones:** existe PZ-FLE-28.
- **Pasos:** en el mismo formulario, código PZ-FLE-28, "Guardar".
- **Datos:** `PZ-FLE-28`.
- **Resultado esperado:** mensaje claro.
- **Resultado obtenido:** "Ya existe una pieza con ese código."
- **Estado:** Pasa.
- **Cobertura en BD:** restricción `piezas_codigo_unique` (sin prueba pgTAP específica).

### PZ-03 — Bajar la cantidad por debajo de lo prestado (negativo)
- **Rol:** administrador.
- **Objetivo:** igual que ART-06, en piezas.
- **Precondiciones:** PZ-FLE-28 con 12 prestadas.
- **Pasos:** "Editar"; cantidad 5; "Guardar".
- **Datos:** 5.
- **Resultado esperado:** rechazo con la cantidad asignada.
- **Resultado obtenido:** "La cantidad no puede ser menor que 12: hay 12 unidades asignadas."
- **Estado:** Pasa.
- **Cobertura en BD:** "Bajar cantidad por debajo de lo asignado se rechaza" (misma función `articulo_control_stock()` para inventario y piezas).

### PZ-04 — Cambiar el estado de una pieza
- **Rol:** administrador.
- **Objetivo:** cambiar el estado desde el formulario y desde la lista.
- **Precondiciones:** PRB-PZ-01 sin préstamos; PZ-FLE-28 con préstamos.
- **Pasos:** editar PRB-PZ-01 a Dañado; desde la lista volver a Disponible; abrir el selector de PZ-FLE-28.
- **Datos:** —
- **Resultado esperado:** los cambios se guardan; en PZ-FLE-28 los estados bloqueados salen deshabilitados.
- **Resultado obtenido:** "Pieza actualizada." (Dañado); `"PRUEBA Pala de repuesto" ahora está en estado "Disponible".`; PZ-FLE-28 con Mantenimiento, Dañado y Perdido deshabilitados.
- **Estado:** Pasa.
- **Cobertura en BD:** "Con un préstamo dañado (unidades fuera) la pieza no puede pasar a mantenimiento".

## PRE — Préstamos

### PRE-01 — El selector solo ofrece arqueros activos (arquero inactivo, negativo)
- **Rol:** administrador.
- **Objetivo:** que no se pueda prestar a un arquero inactivo.
- **Precondiciones:** arquero temporal "HUMO Arquero inactivo" inactivo.
- **Pasos:** pestaña Préstamos, "+ Nuevo préstamo"; ver la lista; buscar "HUMO".
- **Datos:** "HUMO".
- **Resultado esperado:** solo los 4 arqueros activos; la búsqueda del inactivo no encuentra nada.
- **Resultado obtenido:** Ana Jiménez Castro, José Vargas Mora, Luis Chaves Ureña, María Rodríguez Solís. Buscar "HUMO": "Ningún arquero coincide con la búsqueda."
- **Estado:** Pasa.
- **Cobertura en BD:** "Prestar inventario a un arquero inactivo se rechaza", "Prestar piezas a un arquero inactivo se rechaza".

### PRE-02 — Solo se ofrecen artículos disponibles con unidades
- **Rol:** administrador.
- **Objetivo:** no ofrecer artículos en mantenimiento ni sin unidades.
- **Precondiciones:** ARC-005 en mantenimiento; ARC-003 prestado.
- **Pasos:** abrir la lista "Artículo" del modal.
- **Datos:** —
- **Resultado esperado:** no aparecen ARC-005 ni ARC-003; cada opción muestra "N disp.".
- **Resultado obtenido:** ARC-004 (1 disp.), ARC-001 (2 disp.), ARC-002 (2 disp.), CAR-001 (6), DIA-001 (3), PRO-001 (8), PRB-ARC-01 (2). Después de PRE-07, ARC-001 y PRB-ARC-01 dejan de aparecer.
- **Estado:** Pasa.
- **Cobertura en BD:** "Asignar un artículo en mantenimiento se rechaza", "Asignar sin stock suficiente se rechaza".

### PRE-03 — Validaciones del formulario (negativo)
- **Rol:** administrador.
- **Objetivo:** validar arquero, artículo y cantidad antes de enviar.
- **Precondiciones:** modal "Nuevo préstamo".
- **Pasos:** registrar sin arquero; elegir José y registrar sin artículo; elegir ARC-001 y probar cantidades.
- **Datos:** cantidad `0` y `1.5`.
- **Resultado esperado:** un mensaje por cada error.
- **Resultado obtenido:** "Seleccione el arquero."; "Seleccione el artículo."; "La cantidad debe ser un número entero mayor que 0." (para `0` y `1.5`). Nota bajo la cantidad: "Disponibles: 2 de 4."
- **Estado:** Pasa.
- **Cobertura en BD:** `asignaciones_cantidad_check` (sin prueba pgTAP específica).

### PRE-04 — Prestar más de lo disponible (negativo)
- **Rol:** administrador.
- **Objetivo:** impedir prestar más unidades de las disponibles.
- **Precondiciones:** ARC-001 con 2 disponibles.
- **Pasos:** cantidad 3, "Registrar préstamo".
- **Datos:** José Vargas, ARC-001, 3.
- **Resultado esperado:** mensaje con lo disponible; no se registra.
- **Resultado obtenido:** `Solo hay 2 unidades disponibles de "Arco recurvo 66" 24 lb".`
- **Estado:** Pasa.
- **Cobertura en BD:** "Asignar sin stock suficiente se rechaza", "Asignar piezas sin stock suficiente se rechaza".

### PRE-05 — El stock cambia con el formulario abierto (negativo)
- **Rol:** administrador.
- **Objetivo:** que la BD rechace el préstamo si otra persona tomó las unidades mientras el formulario estaba abierto.
- **Precondiciones:** PRB-ARC-01 con 2 disponibles.
- **Pasos:** abrir el modal, elegir José, PRB-ARC-01 (2 disp.) y cantidad 2; mientras tanto se presta 1 unidad a María por psql; pulsar "Registrar préstamo".
- **Datos:** cantidad 2.
- **Resultado esperado:** el mensaje de la BD aparece en el modal; no se registra.
- **Resultado obtenido:** `Stock insuficiente para "PRUEBA Arco recurvo 62" 20 lb": se solicitaron 2 y hay 1 disponibles.`
- **Estado:** Pasa.
- **Cobertura en BD:** "Asignar sin stock suficiente se rechaza". El bloqueo con dos sesiones a la vez sigue sin prueba automática (checklist, sección 1).

### PRE-06 — Prestar con stock suficiente
- **Rol:** administrador.
- **Objetivo:** registrar un préstamo normal.
- **Precondiciones:** PRE-05 en el mismo modal.
- **Pasos:** cantidad 1, observación, "Registrar préstamo".
- **Datos:** José Vargas, PRB-ARC-01, 1, "Prueba funcional PRE-04".
- **Resultado esperado:** mensaje de éxito; el préstamo aparece activo con "Registrado por" = quien lo registró.
- **Resultado obtenido:** `Préstamo registrado: 1 × "PRUEBA Arco recurvo 62" 20 lb" a José Vargas Mora.` Fila con estado Activo y "Administrador de prueba".
- **Estado:** Pasa.
- **Cobertura en BD:** "Profesor asigna con stock suficiente", "Asignar descuenta cantidad_disponible (cambio desde trigger, profundidad 2)", "registrado_por se fuerza a auth.uid() aunque se envíe otro valor".

### PRE-07 — Al prestar la última unidad el artículo queda "Prestado"
- **Rol:** administrador.
- **Objetivo:** estado automático sin unidades disponibles.
- **Precondiciones:** después de PRE-05 y PRE-06.
- **Pasos:** pestaña Artículos.
- **Datos:** PRB-ARC-01, ARC-001.
- **Resultado esperado:** `0 / 2 Prestado` y `0 / 4 Prestado`.
- **Resultado obtenido:** `PRB-ARC-01 … 0 / 2 | Prestado`; `ARC-001 … 0 / 4 | Prestado` (las otras 2 unidades se prestaron por psql para PRE-05).
- **Estado:** Pasa.
- **Cobertura en BD:** "Sin unidades disponibles el artículo pasa a prestado".

### PRE-08 — Préstamo de piezas
- **Rol:** administrador.
- **Objetivo:** prestar piezas desde el mismo modal.
- **Precondiciones:** PZ-FLE-30 `24 / 24`.
- **Pasos:** "Qué se presta: Pieza"; Ana; PZ-FLE-30; 6; "Registrar préstamo".
- **Datos:** 6 flechas.
- **Resultado esperado:** la lista de piezas muestra "N disp."; queda `18 / 24`.
- **Resultado obtenido:** `Préstamo registrado: 6 × "Flecha de carbono 30"" a Ana Jiménez Castro.`; PZ-FLE-30 `18 / 24 | Disponible`.
- **Estado:** Pasa.
- **Cobertura en BD:** "Profesor asigna piezas", "Asignar piezas descuenta disponibles".

## DEV — Devoluciones

### DEV-01 — Devolución en buen estado
- **Rol:** administrador.
- **Objetivo:** devolver y recuperar el stock.
- **Precondiciones:** préstamo de PRB-ARC-01 a María.
- **Pasos:** "Devolver"; opción "Devolver en buen estado" (por defecto); "Guardar".
- **Datos:** fecha por defecto (ahora).
- **Resultado esperado:** el modal muestra arquero, artículo, cantidad y fecha del préstamo; el stock vuelve.
- **Resultado obtenido:** modal "Registrar devolución" con las tres opciones; `"PRUEBA Arco recurvo 62" 20 lb" de María Rodríguez Solís: devuelto.`; PRB-ARC-01 `1 / 2 | Disponible`.
- **Estado:** Pasa.
- **Cobertura en BD:** "Transición activo -> devuelto", "activo -> devuelto restaura disponibles", "Al devolver, el artículo vuelve a disponible".

### DEV-02 — Devolver dañado (observación obligatoria)
- **Rol:** administrador.
- **Objetivo:** registrar un equipo devuelto con daño.
- **Precondiciones:** préstamo de PRB-ARC-01 a José.
- **Pasos:** "Devolver"; "Devolver dañado"; guardar sin observación; luego con observación.
- **Datos:** "Pala inferior rajada".
- **Resultado esperado:** pide describir el daño; luego el préstamo queda Dañado con fecha de entrega, el stock no vuelve y la acción pasa a "Cerrar".
- **Resultado obtenido:** "Describa el daño en las observaciones."; luego `… de José Vargas Mora: devuelto dañado.`; PRB-ARC-01 sigue `1 / 2`; fila Dañado con fecha de devolución y botón "Cerrar".
- **Estado:** Pasa.
- **Cobertura en BD:** "Transición activo -> dañado", "activo -> dañado no restaura disponibles".

### DEV-03 — Cerrar un préstamo dañado como reparado
- **Rol:** administrador.
- **Objetivo:** devolver al inventario un equipo reparado.
- **Precondiciones:** DEV-02.
- **Pasos:** "Cerrar"; "Reparado: vuelve al inventario"; observación; "Guardar".
- **Datos:** "Pala cambiada en taller".
- **Resultado esperado:** el modal muestra cuándo se entregó dañado; el stock vuelve.
- **Resultado obtenido:** modal "Cerrar préstamo dañado" con "Entregado dañado el 10/10/2026, 01:07 p. m." y opciones "Reparado…" y "Dar de baja como perdido"; `… : reparado.`; PRB-ARC-01 `2 / 2`.
- **Estado:** Pasa.
- **Cobertura en BD:** "Transición dañado -> devuelto", "dañado -> devuelto restaura disponibles".

### DEV-04 — Reportar como perdido (observación obligatoria)
- **Rol:** administrador.
- **Objetivo:** dar de baja unidades perdidas.
- **Precondiciones:** préstamo de ARC-001 a Ana (creado por psql en PRE-05).
- **Pasos:** "Devolver"; "Reportar como perdido"; guardar sin observación; luego con observación.
- **Datos:** "Se perdió en el campo de tiro".
- **Resultado esperado:** pide describir la pérdida; el botón Guardar se ve en rojo; el total baja en 1.
- **Resultado obtenido:** "Describa la pérdida en las observaciones."; botón con estilo de peligro; `… de Ana Jiménez Castro: perdido.`; ARC-001 de `0 / 4` a `0 / 3`.
- **Estado:** Pasa.
- **Cobertura en BD:** "Transición activo -> perdido", "activo -> perdido descuenta de cantidad sin ajuste automático de disponibles (profundidad 2)".

### DEV-05 — Dar de baja como perdido un préstamo dañado
- **Rol:** administrador.
- **Objetivo:** dañado → perdido.
- **Precondiciones:** préstamo de ARC-001 a Luis (psql).
- **Pasos:** devolver dañado con observación; "Cerrar"; "Dar de baja como perdido"; guardar sin y con observación.
- **Datos:** "Cuerda rota y pala dañada"; "No tiene reparación".
- **Resultado esperado:** pide observación; el total baja en 1.
- **Resultado obtenido:** `… de Luis Chaves Ureña: devuelto dañado.`; "Describa la pérdida en las observaciones."; `… : perdido.`; ARC-001 `0 / 2`.
- **Estado:** Pasa.
- **Cobertura en BD:** "Transición dañado -> perdido", "dañado -> perdido descuenta de cantidad".

### DEV-06 — Si se pierden todas las unidades, el artículo queda "Perdido"
- **Rol:** administrador.
- **Objetivo:** estado automático al perder la última unidad.
- **Precondiciones:** ARC-004 `1 / 1`.
- **Pasos:** prestar ARC-004 a Luis; un minuto después, "Devolver" → "Reportar como perdido" con observación.
- **Datos:** "Extraviado en competencia".
- **Resultado esperado:** ARC-004 `0 / 0 | Perdido`.
- **Resultado obtenido:** préstamo registrado (`0 / 1 Prestado`); `"Arco barebow 25 lb" de Luis Chaves Ureña: perdido.`; `ARC-004 … 0 / 0 | Perdido`. El primer intento, en el mismo minuto del préstamo, falló (ver DEV-13, ya corregido).
- **Estado:** Pasa.
- **Cobertura en BD:** "Si se pierden todas las unidades, el artículo queda perdido (0/0)", "Bajar la cantidad a 0 a mano no marca el artículo como perdido".

### DEV-07 — Fecha de devolución anterior al préstamo (fecha inválida, negativo)
- **Rol:** administrador.
- **Objetivo:** impedir una fecha anterior al préstamo.
- **Precondiciones:** préstamo de ARC-001 a María (12:57).
- **Pasos:** "Devolver"; fecha 01/01/2026 08:00; "Guardar".
- **Datos:** `2026-01-01T08:00`.
- **Resultado esperado:** mensaje con la fecha del préstamo; no se guarda.
- **Resultado obtenido:** "La fecha no puede ser anterior al préstamo (10/10/2026, 12:57 p. m.)." El campo también limita el calendario (mín. `2026-10-10T12:57`, máx. la hora actual).
- **Estado:** Pasa.
- **Cobertura en BD:** restricción `asignaciones_fechas_check` ("La fecha de devolución no puede ser anterior a la fecha del préstamo." vía `errores.js`); sin prueba pgTAP específica.

### DEV-08 — Fecha de devolución en el futuro (fecha inválida, negativo)
- **Rol:** administrador.
- **Objetivo:** impedir fechas futuras.
- **Precondiciones:** el mismo modal.
- **Pasos:** fecha 01/01/2030 08:00; "Guardar".
- **Datos:** `2030-01-01T08:00`.
- **Resultado esperado:** mensaje; no se guarda.
- **Resultado obtenido:** "La fecha no puede estar en el futuro."
- **Estado:** Pasa.
- **Cobertura en BD:** solo UI.

### DEV-09 — Devolución sin fecha (negativo)
- **Rol:** administrador.
- **Objetivo:** exigir la fecha.
- **Precondiciones:** el mismo modal.
- **Pasos:** borrar la fecha; "Guardar"; luego "Cancelar".
- **Datos:** fecha vacía.
- **Resultado esperado:** mensaje; no se guarda.
- **Resultado obtenido:** "Indique la fecha."
- **Estado:** Pasa.
- **Cobertura en BD:** `asignaciones_devuelto_fecha_check`; "Al devolver sin fecha se registra fecha_devolucion".

### DEV-10 — Devolver sobre una lista desactualizada (negativo)
- **Rol:** administrador.
- **Objetivo:** no duplicar una devolución que otra persona ya registró.
- **Precondiciones:** préstamo de PZ-FLE-30 a Ana (PRE-08).
- **Pasos:** abrir "Devolver"; mientras tanto, por psql, se marca ese préstamo como devuelto; pulsar "Guardar".
- **Datos:** observación "Recibidas completas".
- **Resultado esperado:** aviso de que ya se registró; no se agrega otra nota.
- **Resultado obtenido (re-ejecución, con el botón de OBS-02):** préstamo de ARC-001 a Ana Jiménez Castro (seed); con el modal abierto se marcó como devuelto por psql. Al pulsar "Guardar": `Este préstamo ya se registró como "devuelto". Actualice la lista.` con un botón **Actualizar** al lado. Al pulsarlo, el modal se cierra y la lista se recarga sin cambiar de vista: el contador pasa de "7 pendientes de devolución" a "6 pendientes de devolución" y el préstamo de Ana ya no aparece. No se agregó ninguna nota al préstamo.
- **Resultado obtenido (primera ejecución):** el mismo aviso, sin botón; había que cambiar de vista o de pestaña para ver la lista actualizada (OBS-02).
- **Estado:** Pasa.
- **Cobertura en BD:** solo UI (`registrarDevolucion()` actualiza solo si el estado no cambió).

### DEV-11 — Devolver cuando el arquero ya está inactivo
- **Rol:** administrador.
- **Objetivo:** las devoluciones no dependen del estado del arquero.
- **Precondiciones:** "HUMO Arquero inactivo" activado por psql; se le prestó 1 PZ-REP-01 desde la UI; luego se inactivó por psql.
- **Pasos:** comprobar que el selector de nuevo préstamo ya no lo ofrece; "Historial por arquero" → HUMO → "Devolver" en "Tiene ahora"; "Guardar" (un minuto después del préstamo).
- **Datos:** PZ-REP-01, 1.
- **Resultado esperado:** la devolución se registra.
- **Resultado obtenido:** el selector de préstamo dice "Ningún arquero coincide con la búsqueda."; `"Reposaflechas" de HUMO Arquero inactivo: devuelto.`; "Tiene ahora: Nada pendiente de devolución", "Préstamos anteriores: 1 préstamo cerrado".
- **Estado:** Pasa.
- **Cobertura en BD:** "Se puede devolver aunque el arquero ya esté inactivo".

### DEV-12 — Procedimiento provisional de devolución parcial
- **Rol:** administrador.
- **Objetivo:** aplicar el procedimiento provisional del manual de usuario cuando el arquero devuelve solo una parte.
- **Precondiciones:** préstamo de 6 PZ-FLE-28 a María (seed, 10/10/2026 12:57); PZ-FLE-28 `24 / 36`.
- **Pasos:** 1) "Devolver" el préstamo completo en buen estado, con observación. 2) Crear un préstamo nuevo a María por las 2 unidades que todavía tiene, con la observación indicada.
- **Datos:** observación de la devolución "Entregó 4 de 6 flechas; 2 quedan pendientes"; observación del préstamo nuevo "Pendiente de devolución parcial del préstamo del 10/10/2026".
- **Resultado esperado:** `30 / 36` tras la devolución y `28 / 36` tras el préstamo nuevo; el historial de María muestra ambos movimientos con sus notas.
- **Resultado obtenido:** `… de María Rodríguez Solís: devuelto.` → `30 / 36`; `Préstamo registrado: 2 × "Flecha de aluminio 28"" a María Rodríguez Solís.` → `28 / 36`. Historial: préstamo nuevo Activo con la nota; el anterior Devuelto con `[10/10/2026 Devuelto] Entregó 4 de 6 flechas; 2 quedan pendientes`.
- **Estado:** Pasa.
- **Cobertura en BD:** "Modificar la cantidad de una asignación se rechaza" (por eso no hay devolución parcial).

### DEV-13 — Devolver en el mismo minuto en que se registró el préstamo
- **Rol:** administrador.
- **Objetivo:** devolver un préstamo recién creado (por ejemplo, si se registró por error).
- **Precondiciones:** un préstamo creado en el minuto actual.
- **Pasos:** prestar; sin esperar al minuto siguiente, "Devolver" con cualquier opción; "Guardar".
- **Datos:** re-ejecución: ARC-004 a Luis (13:38:00), "Devolver en buen estado"; PZ-REP-01 a Luis (13:39:00), "Devolver dañado" con la observación "Prueba DEV-13: pala rajada". Primera ejecución: ARC-004 a Luis (13:08:27) y PZ-REP-01 a HUMO (13:10).
- **Resultado esperado:** la devolución se registra.
- **Resultado obtenido (re-ejecución):** ARC-004: modal con "Prestado el 10/10/2026, 01:38 p. m." y fecha por defecto `2026-10-10T13:38`; al guardar en el mismo segundo, `"Arco barebow 25 lb" de Luis Chaves Ureña: devuelto.` PZ-REP-01: `"Reposaflechas" de Luis Chaves Ureña: devuelto dañado.` (13:39:04); la fila queda Dañado con fecha de préstamo y de devolución 01:39 p. m. y el botón "Cerrar". La prueba de humo de la [re-ejecución](#re-ejecución-del-10-oct-2026) cubre además perdido y dañado → reparado en el mismo minuto.
- **Resultado obtenido (primera ejecución):** en los 2 intentos: "La fecha de devolución no puede ser anterior a la fecha del préstamo." Repetido después del cambio de minuto, funcionaba (DEV-06 y DEV-11). Causa: la BD guarda `fecha_asignacion` con microsegundos (`19:08:27.438466+00`) y JavaScript la lee con milisegundos (`.438`). `DevolucionForm.jsx` usaba `max(fecha elegida, fecha_asignacion)` para no quedar antes del préstamo, pero ese valor quedaba 0,466 ms antes del real y `asignaciones_fechas_check` lo rechazaba.
- **Corrección:** `fechaDevolucionFinal()` en `constantes.js`, usada por `DevolucionForm.jsx`, sube `fecha_asignacion` al segundo siguiente antes de compararla con la fecha elegida. Se usa el segundo siguiente y no `Math.ceil` porque, si los milisegundos son `.000` pero hay microsegundos, `ceil` no cambiaría el valor.
- **Estado:** Pasa (en la primera ejecución: Falla).
- **Cobertura en BD:** `asignaciones_fechas_check` (la regla de BD es correcta; el fallo estaba en la UI).

## HIS — Historiales

### HIS-01 — Historial por artículo
- **Rol:** administrador.
- **Objetivo:** ver quién tuvo un artículo, cuándo y cómo volvió.
- **Precondiciones:** ARC-001 después de DEV-04 y DEV-05.
- **Pasos:** Artículos → "Historial" en ARC-001.
- **Datos:** ARC-001.
- **Resultado esperado:** todos los préstamos con arquero, cantidad, fechas y estado, y un resumen de unidades fuera.
- **Resultado obtenido:** título `Historial: ARC-001 · Arco recurvo 66" 24 lb`; "4 préstamos registrados · 2 unidades fuera en 2 préstamos pendientes"; filas: Ana (Perdido), Luis (Perdido), Ana (Activo), María (Activo).
- **Estado:** Pasa.
- **Cobertura en BD:** "Profesor ve todo el historial".

### HIS-02 — Artículo que nunca se prestó
- **Rol:** administrador.
- **Objetivo:** mensaje de historial vacío.
- **Precondiciones:** DIA-001 sin préstamos (antes de PER-03).
- **Pasos:** "Historial" en DIA-001.
- **Datos:** DIA-001.
- **Resultado esperado:** mensaje claro.
- **Resultado obtenido:** "Este artículo no se ha prestado nunca."
- **Estado:** Pasa.
- **Cobertura en BD:** solo UI.

### HIS-03 — Historial por pieza
- **Rol:** administrador.
- **Objetivo:** historial de una pieza.
- **Precondiciones:** PZ-FLE-28 después de DEV-12.
- **Pasos:** Piezas → "Historial" en PZ-FLE-28.
- **Datos:** PZ-FLE-28.
- **Resultado esperado:** 3 préstamos y 8 unidades fuera.
- **Resultado obtenido:** "3 préstamos registrados · 8 unidades fuera en 2 préstamos pendientes".
- **Estado:** Pasa.
- **Cobertura en BD:** "Profesor ve todo el historial".

### HIS-04 — Historial por arquero
- **Rol:** administrador.
- **Objetivo:** ver qué tiene ahora y qué tuvo un arquero.
- **Precondiciones:** María después de DEV-12.
- **Pasos:** Préstamos → "Historial por arquero" → María.
- **Datos:** María Rodríguez Solís.
- **Resultado esperado:** "Tiene ahora" con lo pendiente y "Préstamos anteriores" con lo cerrado, con observaciones.
- **Resultado obtenido:** "Tiene ahora: 3 unidades en 2 préstamos" (2 PZ-FLE-28 y 1 ARC-001); "Préstamos anteriores: 3 préstamos cerrados" (PRB-ARC-01, PZ-FLE-28 y el CAR-001 del seed, devuelto el 03/10/2026).
- **Estado:** Pasa.
- **Cobertura en BD:** "Usuario ve solo su historial" (misma vista, filtrada por arquero).

### HIS-05 — El historial por arquero incluye inactivos
- **Rol:** administrador.
- **Objetivo:** consultar arqueros inactivos.
- **Precondiciones:** "HUMO Arquero inactivo".
- **Pasos:** "Historial por arquero"; buscar "HUMO".
- **Datos:** "HUMO".
- **Resultado esperado:** aparece marcado como inactivo.
- **Resultado obtenido:** `HUMO Arquero inactivo HUMO-0001 · inactivo`.
- **Estado:** Pasa.
- **Cobertura en BD:** solo UI.

### HIS-06 — Préstamos activos: filtros y búsqueda
- **Rol:** administrador.
- **Objetivo:** filtrar la lista general de préstamos.
- **Precondiciones:** 15 registros después de los casos DEV.
- **Pasos:** revisar el filtro por defecto; cambiar estado, tipo y arquero; buscar por identificación; "Limpiar".
- **Datos:** estados Todos, Perdido, Devuelto, Dañado; "Solo piezas"; arquero Luis; búsqueda "1-1111".
- **Resultado esperado:** cada filtro muestra solo lo que coincide; mensaje cuando no hay nada.
- **Resultado obtenido:** por defecto "6 de 15 registros · 6 pendientes de devolución"; Todos → 15; Perdido → 3 (Luis ARC-004, Ana ARC-001, Luis ARC-001); Devuelto → 6; Dañado → "Ningún préstamo coincide con los filtros."; Solo piezas → 3 pendientes y el filtro de artículo solo lista piezas; Luis con todos los estados → ARC-004 Perdido, ARC-001 Perdido, PZ-DAC-01 Activo; "1-1111" → 2 préstamos de María.
- **Estado:** Pasa.
- **Cobertura en BD:** "Admin ve todas las asignaciones".

### HIS-07 — Columna "Registrado por"
- **Rol:** administrador y profesor.
- **Objetivo:** mostrar quién registró cada préstamo.
- **Precondiciones:** préstamos del seed (registrados por el profesor) y de esta ejecución (admin).
- **Pasos:** ver la columna como admin y luego como profesor.
- **Datos:** —
- **Resultado esperado:** el nombre de quien registró.
- **Resultado obtenido:** cada rol ve su propio nombre en lo que registró y "—" (con la ayuda "Nombre no disponible") en lo que registró el otro. Los préstamos insertados por psql no tienen quien los registró y también muestran "—".
- **Estado:** Pasa con observaciones. La pantalla hace lo previsto, pero el nombre depende del RLS de `perfiles`, que solo deja leer el perfil propio (límite conocido; depende de Fernando).
- **Cobertura en BD:** "Profesor ve todo el historial" (las filas sí llegan; solo falta el nombre).

## PER — Permisos por rol

### PER-01 — Administrador: acceso completo
- **Rol:** administrador.
- **Objetivo:** ver todas las pestañas y acciones.
- **Precondiciones:** sesión de admin.
- **Pasos:** abrir Inventario y recorrer las pestañas.
- **Datos:** —
- **Resultado esperado:** pestañas Artículos, Piezas, Préstamos y Tipos de arco; botones de crear, editar, historial y desactivar.
- **Resultado obtenido:** como se esperaba (casos TA, ART, PZ, PRE y DEV).
- **Estado:** Pasa.
- **Cobertura en BD:** "Admin inserta tipos de arco", "Admin ve todas las asignaciones", "Admin borra inventario sin asignaciones".

### PER-02 — Profesor: catálogo de tipos de arco en solo lectura (sin permisos, negativo)
- **Rol:** profesor.
- **Objetivo:** el profesor no modifica el catálogo.
- **Precondiciones:** sesión de profesor.
- **Pasos:** Inventario → "Tipos de arco".
- **Datos:** —
- **Resultado esperado:** sin botones de crear, editar ni desactivar; texto de solo lectura.
- **Resultado obtenido:** "Catálogo de solo lectura. Solo el administrador puede modificarlo."; 0 botones "+ Nuevo tipo", "Editar" o "Desactivar"; la tabla no tiene columna Acciones.
- **Estado:** Pasa.
- **Cobertura en BD:** "Profesor no puede insertar tipos de arco".

### PER-03 — Profesor: gestiona artículos, préstamos y devoluciones
- **Rol:** profesor.
- **Objetivo:** el profesor trabaja con inventario y préstamos.
- **Precondiciones:** sesión de profesor.
- **Pasos:** ver pestañas y botones; devolver el préstamo de ARC-001 de María; prestar 1 DIA-001 a Ana.
- **Datos:** observaciones "Recibido en buen estado" y "Préstamo del profesor".
- **Resultado esperado:** mismas pestañas que el admin; puede devolver y prestar; no hay opción de borrar.
- **Resultado obtenido:** pestañas Artículos, Piezas, Préstamos y Tipos de arco; "+ Nuevo artículo" e "Historial / Editar" en cada fila; `… de María Rodríguez Solís: devuelto.`; `Préstamo registrado: 1 × "Diana de espuma 80 cm" a Ana Jiménez Castro.` con "Registrado por: Profesor de prueba".
- **Estado:** Pasa.
- **Cobertura en BD:** "Profesor inserta inventario", "Profesor asigna con stock suficiente", "Profesor no puede borrar inventario", "Profesor no puede borrar asignaciones".

### PER-04 — Usuario: sin acceso a la gestión de inventario (sin permisos, negativo)
- **Rol:** usuario.
- **Objetivo:** el usuario no ve la gestión del inventario.
- **Precondiciones:** sesión de `usuario@adetao.test`.
- **Pasos:** revisar el menú lateral.
- **Datos:** —
- **Resultado esperado:** no aparece Inventario.
- **Resultado obtenido:** menú con "Inicio" y "Arqueros" solamente. En el inicio aparecen la tarjeta "Inventario 0" y la acción "+ Agregar inventario" (ver OBS-03).
- **Estado:** Pasa.
- **Cobertura en BD:** "Usuario no puede crear asignaciones", "Usuario no puede modificar inventario", "Usuario no puede insertar tipos de arco".

### PER-05 — Usuario: consultar "Mis préstamos"
- **Rol:** usuario.
- **Objetivo:** que el arquero vea lo que tiene prestado.
- **Precondiciones:** usuario vinculado a María.
- **Pasos:** —
- **Datos:** —
- **Resultado esperado:** una vista con sus préstamos actuales y anteriores, sin acciones.
- **Resultado obtenido:** no hay entrada en el menú para el rol usuario.
- **Estado:** Bloqueado. Falta la vista y su entrada en `Sidebar.jsx` (checklist, sección 7; cambio en código compartido, pendiente de acordar con Fernando). La BD ya filtra los datos por arquero.
- **Cobertura en BD:** "Usuario ve solo sus asignaciones", "Usuario ve solo sus asignaciones de piezas", "Usuario ve solo los artículos que tiene o tuvo asignados", "Usuario ve solo su historial", "El historial del usuario no incluye a otros arqueros", "Usuario sin arquero no ve historial".

### PER-06 — Anónimo
- **Rol:** sin sesión.
- **Objetivo:** que nadie sin sesión lea el inventario.
- **Precondiciones:** —
- **Pasos:** —
- **Datos:** —
- **Resultado esperado:** sin acceso.
- **Resultado obtenido:** la interfaz siempre pide iniciar sesión; la regla se verifica en la BD.
- **Estado:** No aplica (cubierto en BD).
- **Cobertura en BD:** "Anónimo no puede consultar inventario", "Anónimo no puede consultar la vista de historial", "anon no tiene privilegios sobre …" (una prueba por tabla).

## UI — Interfaz

### UI-01 — Uso desde celular (390 px)
- **Rol:** administrador.
- **Objetivo:** que el módulo se pueda usar en una pantalla de celular.
- **Precondiciones:** emulación de 390 × 844 px.
- **Pasos:** ver Artículos; deslizar las pestañas hasta "Tipos de arco"; ver los filtros de Artículos y de Préstamos; abrir "+ Nuevo artículo" con tipo "arco".
- **Datos:** tipo de arco inactivo "PRUEBA Olímpico juvenil editado" (re-ejecución, creado por psql en local).
- **Resultado esperado:** sin desbordes; la tabla y los formularios se leen bien; se nota que hay más pestañas a los lados.
- **Resultado obtenido (re-ejecución):** las pestañas miden 413 px en 278 px visibles. Al inicio se ve una sombra en el borde derecho; a mitad del desplazamiento, en los dos bordes; al final, "Tipos de arco" queda completa y solo con la sombra izquierda. Todos los filtros de Artículos, incluido "Tipo de arco" con la opción `PRUEBA Olímpico juvenil editado (inactivo)`, y los de Préstamos quedan dentro de la tarjeta (114 a 346 px; contenido de la tarjeta de 113 a 347 px), sin desplazamiento horizontal de la página. La tabla pasa a tarjetas y el modal "Nuevo artículo" ocupa una columna (20 a 370 px) sin campos fuera. El menú lateral (compartido) ocupa 70 px. Detalle menor fuera de esta corrección: el selector "Préstamos activos / Historial por arquero" mide 305 px en 284 px y corta unos 21 px de "Historial por arquero" (se desliza, pero sin sombra).
- **Resultado obtenido (primera ejecución):** la pestaña "Tipos de arco" quedaba fuera de la vista sin indicación visual y el filtro "Todos los tipos de arco" sobresalía unos 40 px de la tarjeta (OBS-04).
- **Estado:** Pasa (en la primera ejecución: Pasa con observaciones).
- **Cobertura en BD:** no aplica.

### UI-02 — Estados de carga, lista vacía y sin resultados
- **Rol:** administrador.
- **Objetivo:** mensajes mientras carga o cuando no hay datos.
- **Precondiciones:** —
- **Pasos:** observar durante los casos anteriores.
- **Datos:** —
- **Resultado esperado:** mensajes claros en cada caso.
- **Resultado obtenido:** "Cargando...", "Cargando arqueros y artículos...", "Ningún artículo coincide con los filtros.", "Ningún préstamo coincide con los filtros.", "Este artículo no se ha prestado nunca.", "Ningún arquero coincide con la búsqueda.", "Tiene ahora: Nada pendiente de devolución". El estado de error con "Reintentar" no se forzó en esta ejecución.
- **Estado:** Pasa.
- **Cobertura en BD:** no aplica.

---

## Observaciones fuera de los casos

### OBS-01 — El panel se recarga al volver a la pestaña del navegador (código compartido)
Cada vez que la pestaña vuelve a quedar visible, Supabase emite un evento de sesión con un objeto nuevo. `App.jsx` lo guarda con `setSession` y `Dashboard.jsx` vuelve a cargar el perfil (`useEffect(…, [session])`), mostrando "Cargando sistema…". Inventario se desmonta: la pestaña vuelve a "Artículos" y se pierde cualquier formulario abierto (por ejemplo, un préstamo a medio llenar). En la ejecución ocurrió cada vez que el navegador integrado se volvía a mostrar; en un navegador normal pasa al cambiar de pestaña y volver. **Pendiente de acordar con Fernando:** que `Dashboard.jsx` dependa de `session.user.id` en lugar del objeto `session`, o que no muestre la pantalla de carga al refrescar.

### OBS-02 — No hay botón para actualizar la lista de préstamos (corregida)
El aviso de DEV-10 decía "Actualice la lista", pero no había botón para hacerlo; había que cambiar de vista o de pestaña y volver. **Corregida el 10 oct 2026:** `registrarDevolucion()` marca ese error con `listaDesactualizada`, `DevolucionForm.jsx` muestra un botón "Actualizar" junto al aviso y `Prestamos.jsx` cierra el modal y recarga "Préstamos activos" e "Historial por arquero". Verificado en DEV-10.

### OBS-03 — Inicio del rol usuario (código compartido)
El rol usuario ve la tarjeta "Inventario" con `0` fijo y la acción "+ Agregar inventario", que no hace nada (`Dashboard.jsx`, sin `onClick`). **Pendiente de acordar con Fernando** (checklist, sección 10).

### OBS-04 — Detalles en celular (corregida)
Ver UI-01: la pestaña "Tipos de arco" sin indicación de desplazamiento y el filtro de tipo de arco que sobresalía. **Corregida el 10 oct 2026 en `Inventario.css`:** `.inv-pestanas` tiene sombras en los bordes por donde hay más pestañas (fondos con `background-attachment: local` y `scroll`, sin JavaScript; las tapas usan `#f5f5f5`, el fondo del panel) y, en pantallas de 750 px o menos, los filtros llevan `min-width: 0` para que un `<select>` no se ensanche hasta su opción más larga. Verificado en UI-01.

---

## Anexo: reglas de BD y sus pruebas pgTAP

Resultado del 10 oct 2026 (antes y después de las correcciones de DEV-13, OBS-02 y OBS-04): `npx supabase test db --local` → `Files=1, Tests=109, Result: PASS`.

| Regla | Pruebas pgTAP | Casos de UI |
|---|---|---|
| Disponible = total al crear | "Al crear un artículo, cantidad_disponible = cantidad", "Al crear una pieza, cantidad_disponible = cantidad" | ART-05, PZ-01 |
| Arco exige tipo de arco | "Un arco sin tipo_arco_id se rechaza" | ART-03 |
| Tipo de arco activo | "Crear un arco con un tipo de arco inactivo se rechaza", "Cambiar un arco a un tipo de arco inactivo se rechaza", "Editar un arco cuyo tipo se desactivó después está permitido" | TA-07, TA-08 |
| Disponible no se edita a mano | "UPDATE directo de cantidad_disponible en inventario/piezas se rechaza…", "Profesor no puede modificar cantidad_disponible directamente" | (sin campo en la UI) |
| Ajuste de cantidad | "Subir cantidad está permitido", "Subir cantidad ajusta…", "Bajar cantidad sin asignaciones está permitido", "Bajar cantidad ajusta…", "Bajar cantidad por debajo de lo asignado se rechaza", "Bajar cantidad sin pasar de lo asignado está permitido", "Al bajar cantidad, cantidad_disponible baja la misma diferencia" | ART-06, ART-07, PZ-03 |
| Stock al prestar | "Profesor asigna con stock suficiente", "Asignar descuenta cantidad_disponible…", "Asignar sin stock suficiente se rechaza", "Profesor asigna piezas", "Asignar piezas descuenta disponibles", "Asignar piezas sin stock suficiente se rechaza" | PRE-04 a PRE-08 |
| Estado del artículo al prestar | "Asignar un artículo en mantenimiento se rechaza" | PRE-02 |
| Alta solo en estado activo | "Una asignación nueva con estado distinto de activo se rechaza" | (la UI no envía estado) |
| Arquero activo | "Prestar inventario a un arquero inactivo se rechaza", "Prestar piezas a un arquero inactivo se rechaza", "Se puede devolver aunque el arquero ya esté inactivo" | PRE-01, DEV-11 |
| registrado_por automático | "registrado_por se fuerza a auth.uid() aunque se envíe otro valor", "Cambiar registrado_por de una asignación se rechaza" | PRE-06, HIS-07 |
| Campos fijos del préstamo | "Modificar la cantidad de una asignación se rechaza", "Cambiar el arquero de una asignación se rechaza", "Cambiar el artículo de una asignación se rechaza" | DEV-12 |
| Transiciones | "Transición activo -> dañado / dañado -> devuelto / activo -> perdido / activo -> devuelto / dañado -> perdido", "Transición dañado -> activo se rechaza", "Transición devuelto -> activo se rechaza", "Devolver piezas", "Devolver piezas restaura disponibles" | DEV-01 a DEV-05 |
| Fecha al devolver | "Al devolver sin fecha se registra fecha_devolucion" | DEV-07 a DEV-09, DEV-13 |
| "Prestado" automático | "Sin unidades disponibles el artículo pasa a prestado", "Al quedar unidades disponibles el artículo vuelve a disponible", "Al bajar la cantidad hasta lo prestado el artículo vuelve a prestado", "Al devolver, el artículo vuelve a disponible", "Poner prestado a mano se rechaza", "Crear un artículo en estado prestado se rechaza" | PRE-07, ART-09, DEV-01 |
| Estado con unidades prestadas | "Pasar a mantenimiento/dañado/perdido con unidades prestadas se rechaza", "Con un préstamo dañado (unidades fuera) la pieza no puede pasar a mantenimiento", "Sin unidades prestadas se puede pasar a mantenimiento" | ART-08, ART-10, PZ-04 |
| "Perdido" automático | "Si se pierden todas las unidades, el artículo queda perdido (0/0)", "Bajar la cantidad a 0 a mano no marca el artículo como perdido" | DEV-06 |
| Historial se conserva | "Profesor/Admin no puede borrar asignaciones", "Admin no puede borrar asignaciones de piezas", "No se puede borrar un arquero con asignaciones (ON DELETE RESTRICT)", "Admin borra inventario sin asignaciones" | (sin botón de borrar en la UI) |
| RLS de tipos de arco | "Admin inserta/actualiza tipos de arco", "Admin no puede borrar tipos de arco (solo se desactivan)", "Profesor no puede insertar tipos de arco", "Usuario no puede insertar tipos de arco", "Usuario lee el catálogo de tipos de arco", "Usuario sin arquero lee el catálogo de tipos de arco" | TA-01 a TA-08, PER-02 |
| RLS de inventario y préstamos | "Profesor inserta inventario", "Profesor no puede borrar inventario", "Profesor ve todo el historial", "Admin ve todas las asignaciones", "Usuario ve solo sus asignaciones (y de piezas)", "Usuario ve solo los artículos/piezas que tiene o tuvo asignados", "Usuario ve solo su historial", "El historial del usuario no incluye a otros arqueros", "Usuario no puede crear asignaciones", "Usuario no puede modificar inventario", "Usuario sin arquero no ve asignaciones / inventario / historial" | PER-01, PER-03 a PER-05, HIS-06 |
| Anónimo | "Anónimo no puede consultar inventario", "Anónimo no puede consultar la vista de historial", "anon no tiene privilegios sobre inventario / piezas / asignaciones / asignaciones_piezas / tipos_arco" | PER-06 |
