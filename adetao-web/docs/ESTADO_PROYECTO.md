# Estado del proyecto — 8 de octubre de 2026

Reporte generado a partir de las instrucciones de [`AUDITORIA_PROYECTO.md`](../AUDITORIA_PROYECTO.md). Revisión de solo lectura: no se modificó código, migraciones ni base de datos.

## Resumen

- **Stack detectado:**
  - Frontend: React 19.2 + Vite 8.3, JavaScript (sin TypeScript). Punto de entrada: `src/main.jsx`, luego `src/App.jsx`.
  - Backend: Supabase (PostgreSQL + Auth) mediante `@supabase/supabase-js` 2.117. Cliente en `src/lib/supabase.js`, con variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
  - Linter: oxlint (`.oxlintrc.json`). Sin framework de pruebas.
  - Sin router: la navegación entre módulos es el estado `activeMenu` en `src/modules/dashboard/Dashboard.jsx`.
  - Estructura: `src/modules/{auth,dashboard,Sidebar,Topbar}`. No existe carpeta `supabase/`, ni migraciones, ni tipos generados.
- **Fuente del esquema de BD usada:** exportación del esquema real en `docs/db_schema.json` (enums, RLS, políticas, triggers, funciones, índices, constraints y vistas). La exportación **no incluye columnas**; los ítems que dependen solo de columnas se deducen de los constraints y del esquema de referencia, y se marcan `[?]` cuando no se pueden confirmar.
- **Historial git:** 3 commits (`15c59cd` Login, página principal y lista de arqueros; `e0ea250` Prueba; `fb35dc0` Auditoría de requerimientos y checklist).
- **Avance estimado por bloque del cronograma:**

  | Bloque | Estado | % aprox. |
  |---|---|---|
  | 1. Investigación y planeamiento | Completo (oficio y plan de trabajo existen fuera del repo) | 100 % |
  | 2. Análisis y diseño | Modelo de datos implementado en Supabase; faltan diagrama ER, prototipos documentados y cerrar las brechas de la sección 5.2 | 60 % |
  | 3. Desarrollo base | Login, cierre de sesión, layout con menú por rol y lista de solo lectura de 5 arqueros. Sin CRUD de ningún módulo | 15 % |
  | 4. Inventario | Solo tablas `inventario`, `piezas`, `asignaciones`, `asignaciones_piezas` con constraints básicos. Sin lógica de stock ni UI | 10 % |
  | 5. Consultas y dashboard | Tarjetas de indicadores maquetadas; solo el total de arqueros es real, el resto es `0` fijo | 5 % |
  | 6. Pruebas y validación | Sin iniciar | 0 % |
  | 7. Documentación y cierre | Sin iniciar (README es la plantilla de Vite) | 0 % |
  | 8. Pasarela de pago | Sin iniciar | 0 % |

## Diferencias entre BD real y esquema de referencia

**Coincidencias**
- Las 10 tablas del esquema de referencia existen: `clubes`, `tipos_arco`, `perfiles`, `arqueros`, `categorias`, `inventario`, `piezas`, `asignaciones`, `asignaciones_piezas`, `pagos`. No hay tablas adicionales ni vistas (`"vistas": null`).
- PK, UNIQUE (`clubes.nombre`, `tipos_arco.nombre`, `categorias.nombre`, `perfiles.correo`, `arqueros.identificacion`, `inventario.codigo`) y CHECK de `cantidad`/`monto` coinciden con la referencia.

**Mejoras presentes en la BD real que no estaban en la referencia**
- CHECK `inventario_disponible_check` y `piezas_disponible_check`: `cantidad_disponible >= 0 AND cantidad_disponible <= cantidad`.
- Acciones referenciales explícitas en todas las FK (`ON UPDATE CASCADE` y `ON DELETE` según la tabla, ver riesgos).
- Función `actualizar_updated_at()` con triggers `trg_<tabla>_updated_at` en las 9 tablas que tienen `updated_at`.
- Función `crear_perfil_usuario()` (`SECURITY DEFINER`, `search_path = public`) y trigger `on_auth_user_created` en `auth.users`. Crea el perfil con rol `usuario` y toma el nombre de `raw_user_meta_data->>'nombre'` o, si no existe, del correo.
- Función de event trigger `rls_auto_enable()` que habilita RLS automáticamente en tablas nuevas de `public`.
- Índices adicionales: `idx_arqueros_estado`, `idx_arqueros_pago`, `idx_inventario_tipo`, `idx_inventario_estado`, `idx_pagos_fecha`.

**Valores reales de los enums**

| Enum | Valores |
|---|---|
| `record_status` | `activo`, `inactivo` |
| `payment_status` | `al_dia`, `pendiente`, `vencido` |
| `inventory_status` | `disponible`, `prestado`, `mantenimiento`, `dañado`, `No disponible` |
| `user_role` | `administrador`, `usuario`, `profesor` |

Observaciones sobre enums:
- `inventory_status` mezcla convenciones: `No disponible` lleva mayúscula y espacio, mientras que el resto va en minúscula y sin espacios. Además no incluye `perdido`.
- `user_role` incluye `profesor`, que no aparece en los documentos de requerimientos. El frontend ya lo usa (`Sidebar.jsx`, `Topbar.jsx`).

**Brechas de la referencia que siguen abiertas en la BD real**
- No existen FK `arqueros.categoria_id`, `inventario.tipo_arco_id` ni vínculo `perfiles` con `arqueros`.
- No hay CHECK para `arqueros.mano_dominante`, `arqueros.afiliacion`, `asignaciones.estado`, `asignaciones_piezas.estado`, `pagos.metodo_pago`, ni para `fecha_devolucion >= fecha_asignacion`.
- Faltan índices en `asignaciones_piezas.arquero_id` y `asignaciones_piezas.pieza_id`, aunque sí existen en `asignaciones`.
- `pagos` no tiene trigger de `updated_at`, lo que es consistente con que la tabla no tiene esa columna.
- No hay funciones RPC ni triggers para el control de stock ni para sincronizar `arqueros.estado_pago`.

## Checklist

### 5.1 Base de datos — estructura general

- [x] Existen las tablas del esquema de referencia — evidencia: las 10 tablas aparecen en `rls` de `docs/db_schema.json`. Nota: el checklist dice "11 tablas", pero el esquema de referencia de la sección 4 define 10; es un error del documento de auditoría.
- [x] Tablas en la BD real que no están en la referencia — verificado: ninguna.
- [x] Valores de los enums — ver la tabla de enums arriba.
- [ ] Migraciones versionadas en el repo — no existe `supabase/` ni archivos `.sql`. El esquema solo vive en el proyecto de Supabase y en la exportación `docs/db_schema.json`.
- [x] Trigger que actualiza `updated_at` — evidencia: función `actualizar_updated_at()` y triggers `trg_clubes_updated_at`, `trg_tipos_arco_updated_at`, `trg_perfiles_updated_at`, `trg_arqueros_updated_at`, `trg_categorias_updated_at`, `trg_inventario_updated_at`, `trg_piezas_updated_at`, `trg_asignaciones_updated_at`, `trg_asignaciones_piezas_updated_at`.
- [x] Trigger que crea el registro en `perfiles` — evidencia: trigger `on_auth_user_created` en `auth.users` y función `crear_perfil_usuario()`.
- [x] RLS habilitado en todas las tablas de `public` — evidencia: `rls_activo: true` en las 10 tablas, más la función `rls_auto_enable()` para tablas futuras.
- [ ] Políticas RLS diferenciadas por rol — todas las políticas (salvo `perfiles`) tienen `qual: true` / `with_check: true` para `authenticated`. Cualquier usuario autenticado, incluido uno recién creado con rol `usuario`, puede leer y modificar arqueros, pagos, inventario y catálogos.
- [~] Índices en columnas FK — existen `idx_arqueros_club`, `idx_arqueros_tipo_arco`, `idx_asignaciones_arquero`, `idx_asignaciones_inventario`, `idx_pagos_arquero`. Faltan: `asignaciones_piezas.arquero_id`, `asignaciones_piezas.pieza_id`, y las columnas `registrado_por` de `asignaciones`, `asignaciones_piezas` y `pagos`.
- [?] Datos semilla (categorías, tipos de arco, admin inicial) — no hay archivo de seed en el repo, y la exportación no incluye datos. No se puede saber si la BD tiene registros cargados manualmente.
- [ ] Tipos TypeScript generados — el proyecto está en JavaScript y no hay `database.types.ts`. Si se mantiene JavaScript, considerar generar los tipos igual (`supabase gen types`) y usarlos vía JSDoc.

### 5.2 Base de datos — brechas detectadas en el esquema de referencia

En esta sección, `[x]` significa que la brecha ya está resuelta y `[ ]` que sigue abierta.

- [ ] `arqueros.categoria` como `varchar` en lugar de `categoria_id` — no existe ninguna FK de `arqueros` hacia `categorias` en los constraints.
- [ ] `arqueros.afiliacion` texto libre / sin agrupación — no hay CHECK, enum ni tabla de grupos de afiliación.
- [ ] Representante legal para menores — no existe tabla `representantes` ni FK relacionada. No se puede descartar que haya columnas sueltas en `arqueros` (la exportación no trae columnas), pero el frontend no las usa.
- [?] Razón de inactividad — no se puede confirmar sin columnas; no hay constraint ni uso en el frontend que indique que exista.
- [ ] CHECK en `arqueros.mano_dominante` — no existe.
- [ ] `inventario.tipo_arco_id` — no existe FK de `inventario` hacia `tipos_arco`.
- [x] CHECK de `cantidad_disponible` en `inventario` y `piezas` — evidencia: `inventario_disponible_check`, `piezas_disponible_check`.
- [?] `piezas.codigo` y `piezas.ubicacion` — no hay índice UNIQUE sobre `piezas.codigo` (a diferencia de `inventario`), lo que sugiere que la columna no existe, pero no se puede confirmar sin columnas.
- [ ] Lógica que descuente/restaure `cantidad_disponible` al asignar/devolver — no hay trigger ni función para esto; las únicas funciones son `rls_auto_enable`, `actualizar_updated_at` y `crear_perfil_usuario`. El CHECK impide valores negativos solo si alguien actualiza la cantidad manualmente.
- [ ] Valores definidos para `asignaciones.estado` / `asignaciones_piezas.estado` — sin CHECK ni enum.
- [ ] CHECK `fecha_devolucion >= fecha_asignacion` — no existe en ninguna de las dos tablas de asignaciones.
- [ ] CHECK/enum en `pagos.metodo_pago` — no existe.
- [ ] `pagos.updated_at` — `pagos` es la única tabla sin trigger de `updated_at`, lo que confirma que la columna sigue sin existir.
- [ ] Regla para sincronizar `arqueros.estado_pago` con `pagos` — no hay trigger, vista ni función.
- [ ] Vínculo `perfiles` con `arqueros` — no hay FK entre ambas tablas.

### 5.3 Autenticación y roles

- [x] Inicio de sesión con Supabase Auth — evidencia: `supabase.auth.signInWithPassword` en `src/modules/auth/Login.jsx`.
- [x] Cierre de sesión — evidencia: `supabase.auth.signOut()` en `cerrarSesion` de `src/modules/dashboard/Dashboard.jsx`, con el botón en `src/modules/Sidebar/Sidebar.jsx`.
- [ ] Recuperación de contraseña — no existe enlace, pantalla ni llamada a `resetPasswordForEmail`.
- [x] Páginas protegidas según sesión — evidencia: `src/App.jsx` muestra `Login` si no hay sesión (`getSession` + `onAuthStateChange`). No hay router, así que no existen rutas individuales que proteger.
- [~] Control de acceso por rol — la UI oculta secciones del menú según `perfiles.rol` (`administrador`, `profesor`) en `Sidebar.jsx`. Pero en la BD no hay ninguna política por rol, así que la restricción es solo visual.
- [ ] Administración de usuarios por el admin — el menú "Usuarios" muestra un placeholder. Además, RLS de `perfiles` solo permite `SELECT` del propio perfil (`id = auth.uid()`), así que el admin no podría listar ni editar perfiles aunque existiera la UI.
- [ ] `registrado_por` automático — no hay `DEFAULT auth.uid()` evidente ni trigger, y el frontend no escribe en ninguna tabla que lo use.

### 5.4 Clubes (Plan 3.1)

- [ ] Listado con búsqueda — el menú "Clubes" muestra "Este módulo será desarrollado próximamente." (`renderContenido` en `Dashboard.jsx`).
- [ ] Crear y editar club — el botón "+ Registrar club" en el inicio no tiene `onClick`.
- [~] Validación de nombre único — en la BD sí existe `clubes_nombre_unique`; falta la UI y el mensaje claro.
- [~] Desactivar en lugar de eliminar — la BD tiene la columna `estado` (`record_status`) y no hay política de `DELETE` en `clubes`, así que un usuario autenticado no puede eliminar clubes. Falta la UI.
- [ ] Ver arqueros asociados a un club — no existe.

### 5.5 Arqueros (Plan 3.2)

- [~] Listado con búsqueda y filtros — el inicio consulta todos los arqueros (con join a `tipos_arco` y `clubes`), pero solo muestra los primeros 5 con nombre, identificación y estado de pago. No hay búsqueda ni filtros, y el menú "Arqueros" es un placeholder.
- [ ] Crear y editar arquero — el botón "+ Registrar arquero" no tiene `onClick`.
- [ ] Selección de tipo de arco desde catálogo — la FK `arqueros_tipo_arco_id_fkey` existe; falta la UI.
- [ ] Selección de categoría desde catálogo — no hay UI, y en la BD sigue sin FK (ver 5.2).
- [~] Control del estado de pago — el estado se muestra como badge en el inicio (`payment-status` en `Dashboard.jsx`); no se puede editar.
- [ ] Control del estado con razón de inactividad — no existe.
- [ ] Registro de mano dominante — no existe.
- [ ] Registro de tipo de afiliación — no existe.
- [ ] Asociación con club — la FK `arqueros_club_id_fkey` existe; falta la UI.
- [~] Validaciones — solo existe la unicidad de `identificacion` en la BD. No hay validación de cédula, correo, teléfono ni fecha de nacimiento en el cliente ni en la BD.
- [ ] Detección de menor de edad y representante legal — no existe.
- [ ] Vista de detalle con historial de pagos y equipo — no existe.
- [ ] Desactivar en lugar de eliminar — la BD lo contradice: existe la política "Usuarios autenticados pueden eliminar arqueros" (`DELETE`, `qual: true`), y `pagos`, `asignaciones` y `asignaciones_piezas` tienen `ON DELETE CASCADE` hacia `arqueros`.

### 5.6 Catálogos

- [ ] CRUD de tipos de arco — la tabla `tipos_arco` existe con una política `ALL` para autenticados; no hay UI ni entrada de menú.
- [ ] CRUD de categorías — la tabla `categorias` existe; no hay UI ni entrada de menú. Ver 5.1 sobre los datos semilla.
- [ ] Advertencia al desactivar un catálogo en uso — no existe.

### 5.7 Inventario y trazabilidad (Plan 3.4)

- [ ] CRUD de inventario — la tabla existe; el menú "Inventario" es un placeholder y "+ Agregar inventario" no tiene `onClick`.
- [ ] Arcos como inventario relacionados con tipo de arco — no hay FK `inventario.tipo_arco_id` (ver 5.2).
- [ ] CRUD de piezas — no existe.
- [ ] Asignar inventario validando disponibilidad — no existe la UI ni la lógica en la BD.
- [ ] Asignar piezas validando disponibilidad — no existe.
- [ ] Registrar devolución — no existe.
- [ ] Actualización automática de cantidad disponible — no existe (ver 5.2).
- [ ] Historial por artículo — no existe. Las tablas `asignaciones` y `asignaciones_piezas` permitirían construirlo.
- [ ] Historial por arquero — no existe. Además, se perdería al eliminar un arquero por el `ON DELETE CASCADE`.
- [~] Manejo de artículos dañados, en mantenimiento o perdidos — el enum `inventory_status` tiene `mantenimiento`, `dañado` y `No disponible`, pero no `perdido`. El estado aplica al artículo completo y no por unidad o asignación. No hay UI.

### 5.8 Pagos

- [ ] Registrar pago — la tabla `pagos` existe; el menú "Pagos" es un placeholder.
- [ ] Listado con filtros — no existe. El índice `idx_pagos_fecha` ayudaría a implementarlo.
- [ ] Actualización del estado de pago del arquero al registrar un pago — no existe (ver 5.2).
- [ ] Listado de arqueros con pagos pendientes/morosos — no existe; la tarjeta "Pagos pendientes" del inicio muestra `0` fijo.
- [ ] Pasarela de pago (opcional) — no hay documento de viabilidad ni integración.

### 5.9 Consultas y dashboard (Plan 3.3)

- [ ] Consultas filtradas sobre arqueros, clubes, inventario y pagos — no existen. El menú "Reportes" es un placeholder.
- [ ] Indicador: arqueros activos/inactivos — no existe. La tarjeta "Arqueros" muestra solo el total (`arqueros.length`).
- [ ] Indicador: arqueros por club, categoría y tipo de arco — no existe.
- [ ] Indicador: pagos pendientes vs al día — la tarjeta está maquetada con `0` fijo.
- [ ] Indicador: ingresos por período — no existe.
- [ ] Indicador: inventario disponible vs asignado — la tarjeta "Inventario" está maquetada con `0` fijo.
- [ ] Indicador: asignaciones activas y con devolución pendiente — no existe.
- [ ] Vistas SQL o funciones RPC para los indicadores — no hay vistas (`"vistas": null`) ni funciones RPC. El único conteo actual se calcula en el cliente descargando todos los arqueros.
- [ ] Gráficos — no existen, y no hay librería de gráficos instalada.
- [ ] Exportación de datos (CSV o Excel) — no existe.

### 5.10 Requerimientos del oficio fuera del alcance del plan

- [-] Asistencia: tablas de entrenamientos/sesiones y asistencias — no existe nada implementado.
- [-] Asistencia: vista móvil para marcar asistencia — no existe nada implementado.
- [-] Desarrollo del atleta: tablas de evaluaciones, rondas, vuelos y puntajes — no existe nada implementado.
- [-] Desarrollo del atleta: registro y visualización desde el celular — no existe nada implementado.
- [-] Desarrollo del atleta: exportación de resultados — no existe nada implementado.
- [-] Presencia web de la asociación — no existe nada implementado.

### 5.11 Calidad y requisitos no funcionales

- [~] Diseño responsivo — `Dashboard.css` colapsa la barra lateral a 70 px por debajo de 750 px y reorganiza las grillas por debajo de 1100 px; `index.css` tiene ajustes por debajo de 1024 px. Falta un menú móvil real (la barra fija sigue ocupando espacio) y no se ha probado en celular.
- [~] Manejo de errores en español — el login muestra "Correo o contraseña incorrectos."; los errores al cargar `perfiles` y `arqueros` en `Dashboard.jsx` se ignoran sin avisar al usuario.
- [~] Estados de carga y vacíos — existen "Cargando..." (`App.jsx`), "Cargando sistema..." (`Dashboard.jsx`), "Ingresando..." (`Login.jsx`) y el vacío "Todavía no hay arqueros registrados."; no existen listados completos donde aplicarlos.
- [~] Validación en cliente y en BD — la BD tiene UNIQUE y algunos CHECK (ver 5.2); el cliente solo valida `required` y `type="email"` en el login.
- [~] La `service_role` key no se expone en el frontend — el código solo lee `VITE_SUPABASE_ANON_KEY`, que es lo correcto. El valor del `.env` no se inspeccionó, así que hay que confirmar que sea la clave anon/publishable. Además, `src/lib/supabase.js` ejecuta `console.log(import.meta.env)`, que imprime todas las variables `VITE_*` en la consola del navegador.
- [ ] Archivo `.env.example` — no existe (el `.gitignore` ya lo contempla con `!.env.example`). El `.env` no está versionado, lo cual es correcto.
- [~] Compila y pasa el linter sin errores — `vite build` compila correctamente y `oxlint` no reporta errores, pero sí 2 warnings en `src/modules/dashboard/Dashboard.jsx:16` (`cargarDatos` se usa en `useEffect` antes de declararse y falta en las dependencias). El build no empaqueta el logo (ver riesgos).
- [ ] Pruebas automatizadas — no hay framework de pruebas ni archivos de prueba.
- [ ] Plan o casos de pruebas funcionales documentados — no existen.
- [ ] Despliegue configurado — no hay configuración de hosting en el repo (Vercel, Netlify u otro). No se puede verificar si existe un proyecto de Supabase separado para producción.

### 5.12 Documentación y cierre (Bloque 7)

- [ ] `README.md` con descripción, stack, instalación y ejecución — `README.md` es el texto por defecto de la plantilla React + Vite.
- [ ] Diagrama entidad-relación — no existe.
- [ ] Manual técnico — no existe.
- [ ] Manual de usuario — no existe.
- [ ] Material de capacitación básica — no existe.
- [~] Documentos de la práctica — datos pendientes:
  - [?] Cédula jurídica de la organización — el documento no está en el repo.
  - [?] Teléfono del contacto — el documento no está en el repo.
  - [?] Página web de la organización — el documento no está en el repo.
  - [ ] Nombre unificado — la inconsistencia también está en el sistema: `src/modules/Topbar/Topbar.jsx` muestra "Asociación de Arqueros de Alajuela", mientras que el oficio usa "Asociación Deportiva de Tiro con Arco de Occidente (ADETAO)".

## Pendientes priorizados

1. **(Bloque 3) Seguridad de la BD por rol.** Crear una función tipo `es_admin()` / `rol_actual()` basada en `perfiles.rol` y reescribir las políticas: escritura solo para `administrador` (y `profesor` donde aplique), y lectura según rol. Agregar políticas de `perfiles` para que el admin pueda listar y editar usuarios, quitar la política de `DELETE` de `arqueros` y deshabilitar el registro público en Supabase Auth. Es lo más urgente porque hoy cualquier cuenta autenticada puede modificar todos los datos, y todo lo demás se construye encima.
2. **(Bloques 2 y 3) Cerrar las brechas del esquema y versionarlo.** Inicializar `supabase/` y hacer `supabase db pull` para tener migraciones en el repo. Después:
   - Agregar `categoria_id`, afiliación individual/grupal con agrupación, representante legal y razón de inactividad.
   - Agregar los CHECK de `mano_dominante`, `metodo_pago`, estado de asignaciones y fechas.
   - Cambiar `ON DELETE CASCADE` por `RESTRICT` en `pagos` y en las asignaciones.
   - Crear los índices faltantes de `asignaciones_piezas`.

   Conviene hacerlo antes de construir formularios para no rehacerlos.
3. **(Bloque 3) Módulos base.** Router (por ejemplo `react-router`) y CRUD con validaciones de clubes, arqueros (incluida la detección de menores), catálogos (tipos de arco, categorías) y usuarios. Llenar `registrado_por` automáticamente con un `DEFAULT auth.uid()` o un trigger. Es el bloque de semanas 4–5 y hoy está alrededor del 15 %.
4. **(Bloque 4) Inventario con trazabilidad.**
   - Agregar `inventario.tipo_arco_id`, y `codigo`/`ubicacion` en `piezas`.
   - Crear RPC transaccionales `asignar_*` / `devolver_*` que validen y actualicen `cantidad_disponible`.
   - Construir la UI de inventario, piezas, asignaciones, devoluciones e historiales.
   - Normalizar `inventory_status` (`No disponible`, añadir `perdido`).
5. **(Bloque 3/4) Pagos.** Registro y listado con filtros, y una regla única para `estado_pago` (trigger o vista por período) para que no se desincronice de la tabla `pagos`.
6. **(Bloque 5) Consultas y dashboard.** Vistas SQL o RPC para cada indicador de la sección 5.9, gráficos, exportación a CSV, y reemplazar los `0` fijos del inicio.
7. **(Bloque 6) Pruebas.** Casos de prueba funcionales documentados, pruebas automatizadas mínimas (Vitest para la lógica y validaciones, y opcionalmente Playwright para los flujos principales) y una revisión con usuarios de ADETAO.
8. **(Bloque 7) Documentación.** README real, `.env.example`, diagrama ER, manual técnico, manual de usuario y material de capacitación. Unificar el nombre de la organización en los documentos y en `Topbar.jsx`.
9. **(Bloque 8, opcional) Pasarela de pago.** Documento de viabilidad (SINPE Móvil, proveedores de tarjeta, costos y requisitos) antes de decidir si se integra.
10. **Correcciones rápidas (menos de 1 hora):**
    - Quitar `console.log(import.meta.env)` de `src/lib/supabase.js`.
    - Importar el logo como módulo en `Login.jsx` y `Sidebar.jsx`.
    - Corregir los 2 warnings del linter en `Dashboard.jsx`.
    - Eliminar los archivos de plantilla sin uso: `src/App.css`, `src/assets/hero.png`, `react.svg` y `vite.svg`.

## Riesgos y observaciones

- **Acceso total para cualquier cuenta autenticada.** Las políticas RLS son `true` para `authenticated`, y `crear_perfil_usuario()` asigna el rol `usuario` a cualquier alta en `auth.users`. Si el registro público de Supabase Auth está habilitado, cualquier persona podría crear una cuenta y modificar o eliminar datos de socios y pagos. El menú por rol del frontend no protege nada por sí solo.
- **Pérdida de historial al eliminar arqueros.** `pagos`, `asignaciones` y `asignaciones_piezas` usan `ON DELETE CASCADE` hacia `arqueros`, y existe una política que permite eliminar arqueros. Un borrado accidental elimina el historial financiero y de préstamos.
- **El esquema no está versionado.** No hay migraciones en el repo; el único respaldo es `docs/db_schema.json`, que no incluye columnas. Si se pierde o se altera el proyecto de Supabase, no hay forma de reconstruirlo de forma reproducible.
- **Datos personales de menores.** El sistema guardará datos de menores de edad y de sus representantes. Hay que revisar el cumplimiento de la Ley 8968 de Protección de la Persona frente al tratamiento de sus datos personales, y limitar el acceso por rol.
- **El logo se rompe en producción.** `Login.jsx` y `Sidebar.jsx` usan la ruta literal `src="src/assets/ADETAO LOGO.png"`, que solo funciona con el servidor de desarrollo. Al ejecutar `vite build`, el logo no se incluye entre los assets generados.
- **Variables de entorno en la consola.** `console.log(import.meta.env)` en `src/lib/supabase.js` imprime la URL y la clave de Supabase en la consola de cada visitante. La clave anon es pública por diseño, pero el log es innecesario y expondría cualquier otra variable `VITE_*` que se agregue después.
- **Indicadores calculados en el cliente.** El inicio descarga todos los arqueros para mostrar el total y los primeros 5. Con unos 70 afiliados no es un problema hoy, pero el patrón no escala a pagos ni a asignaciones.
- **Rol `profesor` sin definición.** Existe en el enum y en el menú (ve Inventario y Reportes), pero no está en los documentos de requerimientos. Hay que definir sus permisos antes de escribir las políticas por rol.
- **Cronograma.** El desarrollo base (semanas 4–5) está alrededor del 15 % y los bloques 4 y 5 apenas tienen las tablas. Si el proyecto ya pasó la semana 5, hay atraso acumulado y conviene priorizar los pendientes 1 a 6 antes de cualquier funcionalidad opcional (pasarela, sección 5.10).
- **Estado del repositorio.** Hay dos archivos borrados sin confirmar en git (`ADETAO_requerimientos.md`, `CHECKLIST.md`), y `AUDITORIA_PROYECTO.md` y `docs/` no están versionados. Conviene confirmar si esos borrados son intencionales y hacer commit para no perder documentación.
- **Error en el documento de auditoría.** El ítem 5.1 menciona "11 tablas", pero el esquema de referencia define 10.
