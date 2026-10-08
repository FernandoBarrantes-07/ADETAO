# ADETAO — Checklist de auditoría contra requerimientos

- Fecha de auditoría: 7 oct 2026 (Bloque 3 en curso: 28 sep – 9 oct).
- Fuente de requerimientos: [ADETAO_requerimientos.md](ADETAO_requerimientos.md).
- Commit auditado: `e0ea250` (rama actual, remote `origin` = `github.com/FernandoBarrantes-07/ADETAO`).
- Alcance revisado: todos los archivos versionados (`git ls-files`): `src/App.jsx`, `src/main.jsx`, `src/lib/supabase.js`, `src/modules/{auth,dashboard,Sidebar,Topbar}/*`, CSS, `index.html`, `vite.config.js`, `package.json`, `.gitignore`, `README.md`.

## Leyenda

- `[x]` **Hecho**: funciona de punta a punta (UI + datos + permisos).
- `[~]` **Parcial**: existe pero le falta algo (se indica qué).
- `[ ]` **Pendiente**: no existe.
- **Por verificar**: no se puede confirmar desde el código (se explica por qué).

## Limitación importante

El repositorio **no contiene carpeta `supabase/`**: no hay migraciones, definición de tablas, políticas RLS, funciones, triggers, edge functions ni configuración de storage. Lo único que se sabe del backend es lo que el frontend consulta:

| Tabla | Columnas usadas | Dónde |
|---|---|---|
| `perfiles` | `id, nombre, correo, rol` | `src/modules/dashboard/Dashboard.jsx` (L22-27) |
| `arqueros` | `id, nombre, identificacion, estado_pago` + FK a `tipos_arco(nombre)` y `clubes(nombre)` | `src/modules/dashboard/Dashboard.jsx` (L33-44) |

Todo lo relativo a RLS y permisos en base de datos queda **Por verificar** hasta traer el esquema al repo (`supabase db pull`).

## Estado general del frontend

- No hay router (`react-router` no está en `package.json`). `src/App.jsx` muestra `Login` si no hay sesión y `Dashboard` si la hay: **no existe sitio público**.
- El único módulo con datos reales es "Inicio" del panel (`Dashboard.jsx`). Los menús Arqueros, Clubes, Inventario, Pagos, Reportes y Usuarios muestran el placeholder "Este módulo será desarrollado próximamente." (`Dashboard.jsx` L65-75).
- Los botones de "Acciones rápidas" (`Dashboard.jsx` L253-267) no tienen `onClick`.

---

## Bloque 3 — Diseño funcional, arquitectura de información y modelo de datos (28 sep – 9 oct)

- [ ] **T1** Modelo de datos documentado.
  - Evidencia: no existe documento de modelo de datos ni migraciones. Solo se infieren `perfiles`, `arqueros`, `tipos_arco` y `clubes` desde `Dashboard.jsx`.
  - Falta modelar y documentar: afiliados, representantes, afiliaciones (individual/grupal, vigencia), eventos, torneos, categorías, modalidades, inscripciones, usuarios/roles.
  - El modelo **debe incluir consentimiento informado** (fecha, quién lo otorga, sobre qué datos) y la **relación menor–representante legal**, conforme a la **Ley 8968** (Protección de la Persona frente al Tratamiento de sus Datos Personales, Costa Rica).
- Por verificar — **Flujos funcionales** (afiliación, aprobación, inscripción a eventos, publicación de contenido).
  - No hay diagramas ni documentos de flujos en el repo; pueden existir fuera del código.
  - Ubicación: ____
- Por verificar — **Prototipos / arquitectura de información** (mapa del sitio público y del panel).
  - No hay prototipos ni mapa de sitio en el repo; pueden existir en Figma u otra herramienta.
  - Ubicación: ____

## Bloque 4 — Ambiente técnico y sitio institucional (12 – 23 oct)

- [ ] **T2** Ambiente de pruebas separado de producción.
  - Evidencia: `src/lib/supabase.js` usa un único par `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. No hay `.env.example`, `.env.staging` ni modos de Vite configurados (`vite.config.js` solo carga el plugin de React). Si existe un segundo proyecto Supabase, no está reflejado en el repo.
- [ ] **T3** Procedimiento de respaldo de la base de datos.
  - Evidencia: no hay scripts, documentación ni carpeta `supabase/`. Los respaldos automáticos del plan de Supabase son Por verificar en el dashboard.
- [ ] **R1.1** Sección Inicio (institucional).
  - Evidencia: el "Inicio" existente (`Dashboard.jsx`, función `Inicio`, L123-275) es un resumen administrativo detrás del login, no la página pública institucional.
- [ ] **R1.2** Sección Historia. Evidencia: no existe componente, ruta ni tabla.
- [ ] **R1.3** Sección Logros. Evidencia: no existe componente, ruta ni tabla.
- [ ] **R1.4** Sección Galería (subida y gestión de imágenes). Evidencia: no hay uso de `supabase.storage` en el código ni bucket documentado.
- [~] **R1.8** Diseño responsivo.
  - Evidencia: `index.html` tiene `meta viewport`; `Dashboard.css` (L235-282) tiene `@media` 1100px y 750px que colapsan la barra lateral a 70px; `index.css` tiene `@media` 1024px.
  - Falta: no existe sitio público que evaluar; la barra lateral es `position: fixed` (`Sidebar.css` L8) y en celular sigue ocupando 70px sin menú hamburguesa; no se ha probado en dispositivos reales (Por verificar).
- [ ] **R4.1** Información sobre el tiro con arco y sus modalidades. Evidencia: no existe.
- [ ] **R4.2** Información de cómo afiliarse. Evidencia: no existe.
- [ ] **R4.3** Material de promoción del deporte. Evidencia: no existe.
- [ ] **R4.4** Vínculos a redes sociales. Evidencia: no hay enlaces en ningún componente (`public/icons.svg` es el sprite de la plantilla de Vite).

## Bloque 5 — Módulo de afiliación en línea (26 oct – 6 nov)

- [ ] **R2.1** Formulario de afiliación para mayores de edad. Evidencia: no existe formulario ni tabla de solicitudes.
- [ ] **R2.2** Formulario para menores con datos de representante legal. Evidencia: no existe; no hay tabla de representantes.
- [ ] **R2.3** Afiliación individual y grupal. Evidencia: no existe.
- [ ] **R2.4** Revisión y aprobación por la junta directiva. Evidencia: no existe flujo ni estado de solicitud.
- [ ] **R2.5** Estados activo / inactivo.
  - Evidencia: `arqueros.estado_pago` (`Dashboard.jsx` L40, L229-235) es un estado de **pago**, no de afiliación. No hay columna de estado de afiliado.
- [ ] **R2.6** Vigencia anual (inicio y vencimiento). Evidencia: no hay columnas de fechas de afiliación.
- [ ] **R2.7** Notificaciones de vencimiento. Evidencia: no hay edge functions, cron (`pg_cron`) ni envío de correos.
- [~] **R2.8** Consulta del padrón de afiliados.
  - Evidencia: `Dashboard.jsx` (L33-44) consulta `arqueros` y muestra los primeros 5 (L208) con nombre e identificación.
  - Falta: página de padrón completa (el menú "Arqueros" es placeholder), búsqueda y filtros, estado de afiliación, y restricción por rol. RLS de `arqueros`: Por verificar (no hay migraciones).

## Bloque 6 — Eventos, torneos y calendario (9 – 20 nov)

- [ ] **R1.5** Sección pública de Eventos y Torneos. Evidencia: no existe.
- [ ] **R3.1** Registro de torneos y eventos oficiales. Evidencia: no hay tabla ni formulario.
- [ ] **R3.2** Categorías recreativo / desarrollo / competitivo. Evidencia: no existe.
- [ ] **R3.3** Modalidades de tiro por evento. Evidencia: solo existe `tipos_arco` (tipo de arco del arquero), que no es modalidad por evento.
- [ ] **R3.4** Fechas de apertura/cierre de inscripción. Evidencia: no existe.
- [ ] **R3.5** Inscripción en línea. Evidencia: no existe.
- [ ] **R3.6** Validación de afiliado al día. Evidencia: no existe (no hay afiliación con vigencia contra la cual validar).
- [ ] **R3.7** Control de cupos. Evidencia: no existe.
- [ ] **R3.8** Calendario público (eventos propios, internacionales, actividades). Evidencia: no existe.
- [ ] **R3.9** Publicación automática al calendario al crear el evento. Evidencia: no existe.

## Bloque 7 — Roles de administración y consultas (23 – 27 nov)

- [ ] **R1.6** Personal designado crea, edita y publica contenido sin tocar código. Evidencia: no hay tablas de contenido ni editor; todo texto está fijo en JSX.
- [~] **R1.7** Perfiles diferenciados: junta directiva, encargado de contenido, afiliado.
  - Evidencia: existe `perfiles.rol` (`Dashboard.jsx` L25) y los roles conocidos en código son `administrador`, `profesor`, `usuario` (`Topbar.jsx` L7-11, `Sidebar.jsx` L110, L152).
  - Falta: los roles no coinciden con los del oficio (junta directiva, encargado de contenido, afiliado); no hay gestión de usuarios (menú "Usuarios" es placeholder).
- [~] **R5.1** Permisos por rol para contenido, eventos y afiliaciones.
  - Evidencia: `Sidebar.jsx` oculta secciones del menú según `role`.
  - Falta: la protección es **solo visual en el cliente**; cualquier usuario autenticado puede consultar las tablas directamente si RLS no lo impide. RLS: Por verificar.
- [~] **R5.2** Consultas e indicadores (afiliados, eventos, inscripciones).
  - Evidencia: tarjeta "Arqueros" con `arqueros.length` real (`Dashboard.jsx` L148).
  - Falta: las tarjetas Clubes, Inventario y Pagos pendientes tienen `0` fijo (L159, L170, L181); no hay indicadores de afiliaciones, eventos ni inscripciones; el menú "Reportes" es placeholder.

## Bloque 8 — Versión validada (30 nov – 11 dic)

- [ ] **T4** Pruebas funcionales documentadas. Evidencia: no hay pruebas (sin Vitest/Playwright en `package.json`) ni documento de casos de prueba.
- [ ] **T5** Revisión con usuarios finales y registro de correcciones. Evidencia: no hay registro en el repo (puede gestionarse fuera; Por verificar cuando ocurra).

## Bloque 9 — Sistema documentado y entregado (14 – 18 dic)

- [ ] **T6** Documentación técnica y de usuario. Evidencia: `README.md` es la plantilla por defecto de Vite; no hay carpeta `docs/`.
- [ ] **T7** Despliegue en hosting/dominio de la asociación. Evidencia: no hay configuración de despliegue; según los requerimientos, ADETAO aún debe contratar hosting y dominio.
- [ ] **T8** Capacitación básica. Evidencia: no hay material de capacitación.

---

## Fuera de alcance (módulos existentes no incluidos en el oficio)

Se conservan sin eliminar ni modificar.

| Módulo | Estado general | Evidencia |
|---|---|---|
| Clubes | Esqueleto | Tabla `clubes` referenciada solo vía join en `arqueros` (`Dashboard.jsx` L42); menú en `Sidebar.jsx` L24 con placeholder; contador fijo en `0` (`Dashboard.jsx` L159); botón "+ Registrar club" sin acción. |
| Inventario | Solo placeholder | Menú en `Sidebar.jsx` (L29, L47); sin tabla referenciada; contador fijo en `0` (`Dashboard.jsx` L170); botón "+ Agregar inventario" sin acción. |
| Pagos | Mínimo | Columna `arqueros.estado_pago` mostrada como badge (`Dashboard.jsx` L229-235); menú en `Sidebar.jsx` L35 con placeholder; contador "Pagos pendientes" fijo en `0` (L181). |

---

## Resumen

| Bloque | Hecho | Parcial | Pendiente | Por verificar |
|---|---|---|---|---|
| 3 — Diseño y modelo de datos | 0 | 0 | 1 | 2 (flujos, prototipos) |
| 4 — Ambiente y sitio institucional | 0 | 1 | 10 | 0 |
| 5 — Afiliación en línea | 0 | 1 | 7 | 0 |
| 6 — Eventos, torneos y calendario | 0 | 0 | 10 | 0 |
| 7 — Roles y consultas | 0 | 3 | 1 | 0 |
| 8 — Versión validada | 0 | 0 | 2 | 0 |
| 9 — Documentado y entregado | 0 | 0 | 3 | 0 |
| **Total (39 IDs)** | **0** | **5** | **34** | **2** |

## Riesgos y deuda técnica

1. **RLS no verificable.** No hay migraciones en el repo; no se puede confirmar que `perfiles`, `arqueros`, `clubes` y `tipos_arco` tengan RLS activo ni qué políticas aplican.
2. **Exposición de datos personales.** `Dashboard.jsx` consulta `arqueros` sin filtro e incluye `identificacion` de todos los registros para cualquier usuario autenticado. Puede incluir datos de **menores de edad**.
3. **Datos de menores sin consentimiento modelado.** No existen representante legal ni consentimiento informado (fecha, quién lo otorga), requeridos por la Ley 8968.
4. **Permisos solo en el cliente.** El control por rol se limita a ocultar menús en `Sidebar.jsx`; sin RLS por rol, un usuario puede leer o escribir tablas con la anon key.
5. **Fuga de configuración en consola.** `src/lib/supabase.js` L1 hace `console.log(import.meta.env)`, que imprime todas las variables `VITE_*` en el navegador.
6. **Secretos y `.env`.** `.env` está en `.gitignore` (L28) y no aparece en `git ls-files` (correcto). **Por verificar**: que ninguna variable `VITE_*` contenga la `service_role` key; todo lo que inicia con `VITE_` se incluye en el bundle público. Revisarlo a mano (decodificar el JWT y confirmar `"role":"anon"`) y revisar que `.env` nunca se haya subido en el historial de git (`git log --all -- .env`). El contenido de `.env` no se leyó en esta auditoría a propósito.
7. **Repositorio de otro usuario.** El remote `origin` es `github.com/FernandoBarrantes-07/ADETAO`; la práctica requiere un repositorio propio del estudiante o de ADETAO.
8. **Roles desalineados con el oficio.** `administrador / profesor / usuario` frente a `junta directiva / encargado de contenido / afiliado`.
9. **Sin ambiente de pruebas ni respaldo.** Un único proyecto Supabase configurado; sin `.env.example` ni procedimiento de respaldo.
10. **Ruta de logo frágil.** `Login.jsx` L35 y `Sidebar.jsx` L75 usan `src="src/assets/ADETAO LOGO.png"` (ruta relativa con espacio); funciona en `vite dev` pero se rompe en `vite build` y en rutas anidadas. Debe importarse como módulo.
11. **Textos incorrectos.** `Topbar.jsx` L18 dice "Asociación de Arqueros de Alajuela"; `index.html` tiene `lang="en"` y título `adetao-web`.
12. **Código muerto / plantilla.** `src/App.css` no se importa en ningún archivo; `README.md`, `src/assets/react.svg`, `vite.svg` y `public/icons.svg` son de la plantilla de Vite.
13. **Sin router.** No hay rutas públicas ni protegidas; agregar el sitio institucional requiere introducir un router.
14. **Errores silenciados.** `Dashboard.jsx` L33-46 descarta el error de la consulta de `arqueros`; si RLS bloquea la lectura, el panel muestra "Todavía no hay arqueros registrados" sin avisar.

## Siguientes pasos recomendados (en orden, respetando el plan por bloques)

1. **Traer el esquema de Supabase al repo** (`supabase init` + `supabase db pull` → `supabase/migrations/`) para auditar RLS, resolver los "Por verificar" y tener una base versionada para T1 y T2.
2. **T1 — Diseñar y documentar el modelo de datos** (`docs/modelo-datos.md` con ERD en mermaid): afiliados, representantes, afiliaciones (individual/grupal, vigencia), eventos y torneos, categorías, modalidades, inscripciones, roles (`junta_directiva`, `encargado_contenido`, `afiliado`), **consentimiento informado** (fecha, quién lo otorga) y **relación menor–representante legal** (Ley 8968).
3. **Arquitectura de información y flujos**: mapa de rutas público / administración (con router), flujos de afiliación, aprobación e inscripción; completar los campos "Ubicación:" de flujos y prototipos. Esto deja listo el arranque del Bloque 4 (T2).
