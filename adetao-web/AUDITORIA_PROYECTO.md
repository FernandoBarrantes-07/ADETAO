# Auditoría del proyecto — Sistema de gestión ADETAO

Documento de instrucciones para que el agente (Claude en Cursor) revise el repositorio y la base de datos de Supabase, y genere un reporte de **qué está hecho y qué falta**.

---

## 0. Instrucciones para el agente

1. **No modificar código, migraciones ni la base de datos.** Esta tarea es solo de lectura y reporte.
2. Identificar el stack: revisar `package.json` (o equivalente), framework de frontend, estructura de carpetas, carpeta `supabase/`, migraciones, tipos generados (`database.types.ts` o similar), variables de entorno de ejemplo.
3. Obtener el esquema real de la base de datos en este orden de preferencia:
   - MCP de Supabase, si está configurado en Cursor (listar tablas, enums, políticas RLS, funciones, triggers, vistas).
   - Archivos en `supabase/migrations/`.
   - Tipos generados en el proyecto.
   - Si no hay ninguna fuente, usar el esquema de referencia de la sección 4 y marcar los ítems de BD como `[?]`.
4. Comparar el esquema real contra el esquema de referencia (sección 4) y reportar diferencias.
5. Recorrer **cada ítem** del checklist (sección 5). Para cada uno indicar estado y evidencia concreta (ruta de archivo, componente, tabla, función, política).
6. Generar el archivo `docs/ESTADO_PROYECTO.md` con el formato de la sección 6.
7. Al final, listar las tareas pendientes priorizadas según el cronograma (sección 3).

**Estados a usar:**

| Marca | Significado |
|---|---|
| `[x]` | Completo y funcional |
| `[~]` | Parcial (existe pero incompleto, sin validación, sin UI, etc.) |
| `[ ]` | No existe |
| `[?]` | No se pudo verificar |
| `[-]` | Fuera de alcance comprometido (solo informar si existe algo) |

---

## 1. Contexto

- **Organización:** Asociación Deportiva de Tiro con Arco de Occidente (ADETAO), federada a FEDETICA, adscrita al ICODER. Aproximadamente 70 afiliados. Hoy gestionan todo en hojas de cálculo.
- **Proyecto:** Práctica Profesional Supervisada, Ingeniería del Software, UTN Sede Central. 280 horas mínimo, 20 h/semana, 14 semanas.
- **Objetivo:** Sistema de administración de arqueros, clubes e inventario deportivo, con consultas y dashboard.
- **Backend:** Supabase (PostgreSQL + Auth). El frontend se debe detectar en el repositorio.

---

## 2. Fuentes de requerimientos

Hay dos documentos y **no coinciden en alcance**:

| Necesidad | Oficio ADETAO-00027-2026 | Plan de Trabajo (alcance comprometido) |
|---|---|---|
| Registro de asociados, pagos e inventario | Sí | Sí (3.1, 3.2, 3.4) |
| Consultas y dashboard | No explícito | Sí (3.3) |
| Pasarela de pago (tarjeta, SINPE, efectivo) | Sí | Opcional, sujeta a viabilidad (3.5) |
| Control de asistencia a entrenamientos | Sí | **No incluido** |
| Registro del desarrollo del atleta (rondas, vuelos, puntajes) | Sí | **No incluido** |

Los ítems "No incluido" se evalúan en la sección 5.10 con estado `[-]`.

### Requerimientos del oficio (texto resumido)

1. **Asociados, pagos e inventario**
   - Registro de socios mayores o menores de edad (menores con representante legal).
   - Tipos de afiliación: individual o grupal (ej. padre + hijos).
   - Seguimiento de pagos, estados (activo/inactivo) y razones de inactividad.
   - Pasarela de pago (tarjeta, SINPE, efectivo).
2. **Asistencia a entrenamientos**
   - Para todas las categorías (recreativo, desarrollo, competitivo).
   - Web responsiva para registrar asistencia desde el celular.
   - Los usuarios marcan si asistirán o cancelan con antelación.
3. **Desarrollo del atleta**
   - Evaluación por rondas de flechas (ej. 2 rondas de 6 vuelos con 6 flechas cada uno).
   - Registro de puntajes por ronda y vuelo.
   - Visualización desde el celular, almacenamiento en servidor.
   - Exportación de resultados.
4. **Inventario** de equipo prestado (arcos, flechas, etc.).

---

## 3. Cronograma comprometido

| Bloque | Semanas | Resultado esperado |
|---|---|---|
| 1. Investigación y planeamiento | 1–2 | Requerimientos iniciales y plan |
| 2. Análisis y diseño | 3 | Diseño funcional y modelo de datos (requerimientos, datos, relaciones, flujos, prototipos) |
| 3. Desarrollo base | 4–5 | Módulos de arqueros, clubes, afiliaciones y funciones administrativas |
| 4. Inventario | 6–8 | Arcos, tipos de arco, piezas, relación con arqueros (trazabilidad) |
| 5. Consultas y dashboard | 9 | Consultas e indicadores |
| 6. Pruebas y validación | 10–12 | Pruebas funcionales, revisión con usuarios, correcciones |
| 7. Documentación y cierre | 13–14 | Documentación, entrega y capacitación básica |
| 8. Pasarela de pago | Complementaria | Análisis de viabilidad y posible integración |

---

## 4. Esquema de referencia (Supabase, estado conocido)

> Exportado del panel de Supabase. Solo de referencia; el orden y las restricciones pueden no ser ejecutables tal cual.

```sql
CREATE TABLE public.clubes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre character varying NOT NULL UNIQUE,
  ubicacion character varying,
  descripcion text,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::record_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT clubes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tipos_arco (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::record_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tipos_arco_pkey PRIMARY KEY (id)
);
CREATE TABLE public.perfiles (
  id uuid NOT NULL,
  nombre character varying NOT NULL,
  correo character varying UNIQUE,
  rol USER-DEFINED NOT NULL DEFAULT 'usuario'::user_role,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::record_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT perfiles_pkey PRIMARY KEY (id),
  CONSTRAINT perfiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.arqueros (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre character varying NOT NULL,
  identificacion character varying NOT NULL UNIQUE,
  fecha_nacimiento date,
  telefono character varying,
  correo character varying,
  mano_dominante character varying,
  tipo_arco_id bigint,
  categoria character varying,
  afiliacion character varying,
  club_id bigint,
  estado_pago USER-DEFINED NOT NULL DEFAULT 'pendiente'::payment_status,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::record_status,
  observaciones text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT arqueros_pkey PRIMARY KEY (id),
  CONSTRAINT arqueros_tipo_arco_id_fkey FOREIGN KEY (tipo_arco_id) REFERENCES public.tipos_arco(id),
  CONSTRAINT arqueros_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubes(id)
);
CREATE TABLE public.categorias (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::record_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categorias_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventario (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre character varying NOT NULL,
  codigo character varying UNIQUE,
  tipo character varying NOT NULL,
  descripcion text,
  cantidad integer NOT NULL DEFAULT 1 CHECK (cantidad >= 0),
  cantidad_disponible integer NOT NULL DEFAULT 1,
  estado USER-DEFINED NOT NULL DEFAULT 'disponible'::inventory_status,
  ubicacion character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inventario_pkey PRIMARY KEY (id)
);
CREATE TABLE public.piezas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre character varying NOT NULL,
  tipo character varying,
  descripcion text,
  cantidad integer NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  cantidad_disponible integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'disponible'::inventory_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT piezas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.asignaciones (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  arquero_id bigint NOT NULL,
  inventario_id bigint NOT NULL,
  cantidad integer NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  fecha_asignacion timestamp with time zone NOT NULL DEFAULT now(),
  fecha_devolucion timestamp with time zone,
  estado character varying NOT NULL DEFAULT 'activo'::character varying,
  observaciones text,
  registrado_por uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT asignaciones_pkey PRIMARY KEY (id),
  CONSTRAINT asignaciones_inventario_id_fkey FOREIGN KEY (inventario_id) REFERENCES public.inventario(id),
  CONSTRAINT asignaciones_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.perfiles(id),
  CONSTRAINT asignaciones_arquero_id_fkey FOREIGN KEY (arquero_id) REFERENCES public.arqueros(id)
);
CREATE TABLE public.asignaciones_piezas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  arquero_id bigint NOT NULL,
  pieza_id bigint NOT NULL,
  cantidad integer NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  fecha_asignacion timestamp with time zone NOT NULL DEFAULT now(),
  fecha_devolucion timestamp with time zone,
  estado character varying NOT NULL DEFAULT 'activo'::character varying,
  observaciones text,
  registrado_por uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT asignaciones_piezas_pkey PRIMARY KEY (id),
  CONSTRAINT asignaciones_piezas_arquero_id_fkey FOREIGN KEY (arquero_id) REFERENCES public.arqueros(id),
  CONSTRAINT asignaciones_piezas_pieza_id_fkey FOREIGN KEY (pieza_id) REFERENCES public.piezas(id),
  CONSTRAINT asignaciones_piezas_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.perfiles(id)
);
CREATE TABLE public.pagos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  arquero_id bigint NOT NULL,
  concepto character varying NOT NULL,
  monto numeric NOT NULL CHECK (monto >= 0::numeric),
  fecha_pago date NOT NULL DEFAULT CURRENT_DATE,
  periodo character varying,
  metodo_pago character varying,
  referencia character varying,
  observaciones text,
  registrado_por uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pagos_pkey PRIMARY KEY (id),
  CONSTRAINT pagos_arquero_id_fkey FOREIGN KEY (arquero_id) REFERENCES public.arqueros(id),
  CONSTRAINT pagos_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.perfiles(id)
);
```

**Enums referenciados (verificar valores reales):** `record_status`, `payment_status`, `inventory_status`, `user_role`.

---

## 5. Checklist

### 5.1 Base de datos — estructura general

- [ ] Existen las 11 tablas del esquema de referencia.
- [ ] Hay tablas en la BD real que no están en el esquema de referencia (listarlas).
- [ ] Valores de los enums `record_status`, `payment_status`, `inventory_status`, `user_role` (listarlos).
- [ ] Migraciones versionadas en el repo que reproducen el esquema completo.
- [ ] Trigger que actualiza `updated_at` en todas las tablas que lo tienen.
- [ ] Trigger o función que crea el registro en `perfiles` al registrarse un usuario en `auth.users`.
- [ ] RLS habilitado en todas las tablas de `public`.
- [ ] Políticas RLS diferenciadas por rol (admin vs usuario) para lectura y escritura.
- [ ] Índices en columnas FK (`arqueros.club_id`, `arqueros.tipo_arco_id`, `asignaciones.arquero_id`, `asignaciones.inventario_id`, `asignaciones_piezas.*`, `pagos.arquero_id`).
- [ ] Datos semilla (seed): categorías, tipos de arco, admin inicial.
- [ ] Tipos TypeScript generados y sincronizados con el esquema actual.

### 5.2 Base de datos — brechas detectadas en el esquema de referencia

Verificar si cada brecha ya fue resuelta en la BD real o en el código:

- [ ] `arqueros.categoria` es `varchar` aunque existe la tabla `categorias`. Debería ser `categoria_id` con FK.
- [ ] `arqueros.afiliacion` es texto libre. El requerimiento es individual o grupal (padre + hijos): falta enum/CHECK y una forma de agrupar arqueros (tabla de grupos o `grupo_afiliacion_id`).
- [ ] No hay forma de registrar **representante legal** para menores de edad (campos o tabla `representantes`).
- [ ] No hay campo para la **razón de inactividad** del arquero (solo `observaciones`).
- [ ] `arqueros.mano_dominante` es texto libre: falta CHECK (derecha/izquierda).
- [ ] `inventario` no tiene `tipo_arco_id`. El plan pide arcos como objetos de inventario asociados a un tipo de arco.
- [ ] `inventario.cantidad_disponible` y `piezas.cantidad_disponible` sin CHECK (`>= 0` y `<= cantidad`).
- [ ] `piezas` no tiene `codigo` ni `ubicacion` (inventario sí).
- [ ] No hay lógica (trigger o RPC) que descuente/restaure `cantidad_disponible` al asignar/devolver, ni que impida asignar más de lo disponible.
- [ ] `asignaciones.estado` y `asignaciones_piezas.estado` son `varchar` libre: definir valores (ej. activo, devuelto, perdido, dañado) con CHECK o enum.
- [ ] Falta CHECK `fecha_devolucion >= fecha_asignacion`.
- [ ] `pagos.metodo_pago` es texto libre: falta CHECK/enum (tarjeta, SINPE, efectivo, transferencia).
- [ ] `pagos` no tiene `updated_at`.
- [ ] `arqueros.estado_pago` puede desincronizarse de la tabla `pagos`: definir regla (trigger, vista o cálculo por período).
- [ ] `perfiles` no está vinculado con `arqueros` (necesario si los socios usarán el sistema para asistencia o ver su información).

### 5.3 Autenticación y roles

- [ ] Inicio de sesión con Supabase Auth.
- [ ] Cierre de sesión.
- [ ] Recuperación de contraseña.
- [ ] Rutas/páginas protegidas según sesión.
- [ ] Control de acceso por rol (admin vs usuario) en UI y en BD (RLS).
- [ ] Administración de usuarios/perfiles por el admin (crear, cambiar rol, desactivar).
- [ ] `registrado_por` se llena automáticamente con el usuario en sesión.

### 5.4 Clubes (Plan 3.1)

- [ ] Listado con búsqueda.
- [ ] Crear y editar club (nombre, ubicación, descripción).
- [ ] Validación de nombre único con mensaje claro.
- [ ] Desactivar en lugar de eliminar (uso de `estado`).
- [ ] Ver arqueros asociados a un club.

### 5.5 Arqueros (Plan 3.2)

- [ ] Listado con búsqueda y filtros (club, categoría, estado, estado de pago, tipo de arco).
- [ ] Crear y editar arquero con todos los campos.
- [ ] Selección de tipo de arco desde catálogo.
- [ ] Selección de categoría desde catálogo.
- [ ] Control del estado de pago.
- [ ] Control del estado (activo/inactivo) con razón de inactividad.
- [ ] Registro de mano dominante.
- [ ] Registro de tipo de afiliación (individual/grupal).
- [ ] Asociación con club.
- [ ] Validaciones: identificación única, formato de cédula, correo, teléfono, fecha de nacimiento.
- [ ] Detección de menor de edad por fecha de nacimiento y solicitud de representante legal.
- [ ] Vista de detalle con historial de pagos y equipo asignado.
- [ ] Desactivar en lugar de eliminar.

### 5.6 Catálogos

- [ ] CRUD de tipos de arco (Plan 3.4).
- [ ] CRUD de categorías (recreativo, desarrollo, competitivo como mínimo).
- [ ] No se puede desactivar un catálogo en uso sin advertencia.

### 5.7 Inventario y trazabilidad (Plan 3.4)

- [ ] CRUD de inventario (nombre, código, tipo, cantidad, ubicación, estado).
- [ ] Arcos registrados como inventario y relacionados con tipo de arco.
- [ ] CRUD de piezas.
- [ ] Asignar inventario a un arquero validando disponibilidad.
- [ ] Asignar piezas a un arquero validando disponibilidad.
- [ ] Registrar devolución (fecha y estado).
- [ ] Actualización automática de cantidad disponible.
- [ ] Historial por artículo (quién lo tuvo y cuándo).
- [ ] Historial por arquero (qué tiene y qué tuvo).
- [ ] Manejo de artículos dañados, en mantenimiento o perdidos.

### 5.8 Pagos

- [ ] Registrar pago (concepto, monto, fecha, período, método, referencia).
- [ ] Listado con filtros (arquero, período, método, fechas).
- [ ] Actualización del estado de pago del arquero al registrar un pago.
- [ ] Listado de arqueros con pagos pendientes/morosos.
- [ ] **Pasarela de pago (Plan 3.5, opcional):** documento de análisis de viabilidad (proveedores, SINPE, costos, requisitos legales) y, si aplica, integración.

### 5.9 Consultas y dashboard (Plan 3.3)

- [ ] Consultas filtradas sobre arqueros, clubes, inventario y pagos.
- [ ] Indicador: arqueros activos/inactivos.
- [ ] Indicador: arqueros por club, por categoría y por tipo de arco.
- [ ] Indicador: pagos pendientes vs al día.
- [ ] Indicador: ingresos por período.
- [ ] Indicador: inventario disponible vs asignado.
- [ ] Indicador: asignaciones activas y con devolución pendiente.
- [ ] Vistas SQL o funciones RPC en Supabase para los indicadores (no cálculos pesados en el cliente).
- [ ] Gráficos en el dashboard.
- [ ] Exportación de datos (CSV o Excel).

### 5.10 Requerimientos del oficio fuera del alcance del plan

Marcar con `[-]` e informar solo si existe algo implementado:

- [-] Asistencia: tablas de entrenamientos/sesiones y asistencias (confirmar, cancelar con antelación), por categoría.
- [-] Asistencia: vista móvil para que el socio marque asistencia.
- [-] Desarrollo del atleta: tablas de evaluaciones, rondas, vuelos y puntajes por flecha.
- [-] Desarrollo del atleta: registro y visualización desde el celular.
- [-] Desarrollo del atleta: exportación de resultados.
- [-] Presencia web de la asociación (sitio informativo).

### 5.11 Calidad y requisitos no funcionales

- [ ] Diseño responsivo (uso desde celular).
- [ ] Manejo de errores y mensajes al usuario en español.
- [ ] Estados de carga y vacíos en listados.
- [ ] Validación en cliente y en BD (constraints).
- [ ] La `service_role` key no se expone en el frontend.
- [ ] Archivo `.env.example` con las variables necesarias.
- [ ] El proyecto compila y pasa el linter sin errores.
- [ ] Pruebas automatizadas (unitarias, integración o e2e).
- [ ] Plan o casos de pruebas funcionales documentados (Bloque 6).
- [ ] Despliegue configurado (hosting del frontend, proyecto Supabase de producción).

### 5.12 Documentación y cierre (Bloque 7)

- [ ] `README.md` con descripción, stack, instalación y ejecución.
- [ ] Diagrama entidad-relación actualizado.
- [ ] Manual técnico (arquitectura, BD, despliegue, mantenimiento).
- [ ] Manual de usuario.
- [ ] Material de capacitación básica.
- [ ] Documentos de la práctica — datos pendientes detectados:
  - Cédula jurídica de la organización ("Falta por agregar").
  - Teléfono del contacto ("Falta por agregar").
  - Página web de la organización (vacío).
  - Nombre inconsistente: el oficio dice "Asociación Deportiva de Tiro con Arco de Occidente (ADETAO)" y el plan dice "Asociación de Arqueros de Alajuela". Unificar.

---

## 6. Formato del reporte de salida

Generar `docs/ESTADO_PROYECTO.md` con esta estructura:

```markdown
# Estado del proyecto — <fecha>

## Resumen
- Stack detectado: ...
- Fuente del esquema de BD usada: MCP / migraciones / tipos / referencia
- Avance estimado por bloque del cronograma:
  | Bloque | Estado | % aprox. |
  |---|---|---|

## Diferencias entre BD real y esquema de referencia
- ...

## Checklist
### <Sección>
- [x] Ítem — evidencia: `ruta/archivo.tsx`, tabla `x`
- [~] Ítem — qué falta: ...
- [ ] Ítem
- [?] Ítem — motivo

## Pendientes priorizados
1. (Bloque N) Tarea — por qué es prioritaria
2. ...

## Riesgos y observaciones
- ...
```
