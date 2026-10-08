# ADETAO — Requerimientos de la Práctica Profesional (ISW-1111)

Fuente: Oficio ADETAO-00028-2026 (aceptación de práctica, UTN — Ingeniería del Software).
Organización: Asociación Deportiva de Tiro con Arco de Occidente (ADETAO), federada a FEDETICA / ICODER, ~70 afiliados.
Estudiante: Brandon Núñez Murillo. Horario: 20 h/semana, virtual, L-V. Mínimo 280 horas.
Período: 14 sep 2026 – 18 dic 2026.

## Contexto técnico (decisiones vigentes)

- Stack real: **React + Supabase** (el oficio menciona gestor de contenido sobre hosting con MySQL; se decidió mantener la arquitectura ya construida).
- Módulos adicionales ya existentes fuera del oficio: **Clubes, Inventario, Pagos** (se conservan; no son requisito de la práctica).
- Hosting: el hosting anterior pertenecía a otra asociación. ADETAO debe contratar hosting y dominio propios antes del despliegue final.
- "Gestor de contenido" se interpreta como un panel de administración propio que permita al personal designado publicar sin depender de un desarrollador.

## Requerimientos funcionales

Cada ítem tiene un ID para poder rastrearlo en el checklist.

### R1. Sitio web institucional con gestor de contenido

- **R1.1** Sección Inicio.
- **R1.2** Sección Historia.
- **R1.3** Sección Logros.
- **R1.4** Sección Galería (subida y gestión de imágenes).
- **R1.5** Sección Eventos y Torneos (vista pública).
- **R1.6** El personal designado puede crear, editar y publicar contenido de las secciones sin tocar código.
- **R1.7** Perfiles de usuario diferenciados: **junta directiva**, **encargado de contenido**, **afiliado**.
- **R1.8** Diseño responsivo (uso desde celular).

### R2. Afiliación en línea

- **R2.1** Formulario de solicitud de afiliación para **mayores de edad**.
- **R2.2** Formulario para **menores de edad** con datos de **representante legal**.
- **R2.3** Tipos de afiliación: **individual** y **grupal** (ej. padre + hijos).
- **R2.4** Flujo de **revisión y aprobación** por la junta directiva.
- **R2.5** Estados de afiliado: **activo / inactivo**.
- **R2.6** Control de **vigencia anual** (fecha de inicio y vencimiento).
- **R2.7** **Notificaciones de vencimiento** de la afiliación.
- **R2.8** **Consulta del padrón** de afiliados.

### R3. Calendario deportivo, eventos y torneos

- **R3.1** Registro de torneos y eventos oficiales.
- **R3.2** Categorías: **recreativo, desarrollo, competitivo**.
- **R3.3** **Modalidades** de tiro por evento.
- **R3.4** Control de **fechas de inscripción** (apertura/cierre).
- **R3.5** **Inscripción en línea** de participantes.
- **R3.6** Validación de que el arquero esté **afiliado y al día**.
- **R3.7** Control de **cupos**.
- **R3.8** **Calendario público** con: eventos propios, competencias internacionales de interés y actividades adicionales de la asociación.
- **R3.9** **Publicación automática** al calendario al crear el evento.

### R4. Divulgación de la disciplina

- **R4.1** Información sobre el tiro con arco y sus modalidades.
- **R4.2** Información de **cómo afiliarse**.
- **R4.3** Material de promoción del deporte (más allá de redes sociales).
- **R4.4** Vínculos a las redes sociales existentes de la asociación.

### R5. Administración y consultas

- **R5.1** Permisos por rol para administrar contenido, eventos y afiliaciones según la función.
- **R5.2** Consultas e **indicadores** de la información registrada (afiliados, eventos, inscripciones).

## Requerimientos técnicos y de entrega

- **T1** Modelo de datos documentado: afiliados, representantes, afiliaciones, eventos, torneos, categorías, modalidades, inscripciones, usuarios/roles.
- **T2** Ambiente de pruebas separado de producción.
- **T3** Procedimiento de **respaldo** de la base de datos.
- **T4** Pruebas funcionales documentadas.
- **T5** Revisión con usuarios finales y registro de correcciones.
- **T6** Documentación del sistema (técnica y de usuario).
- **T7** Despliegue en el hosting/dominio de la asociación.
- **T8** Capacitación básica a la organización.

## Plan de trabajo (oficio + cronograma)

| Bloque | Objetivo | Semanas | Fechas | Requerimientos |
|---|---|---|---|---|
| 2 | Requerimientos iniciales y plan de trabajo | 1-2 | 14 – 25 sep | Levantamiento |
| 3 | Diseño funcional, arquitectura de información y modelo de datos | 3-4 | 28 sep – 9 oct | T1, flujos, prototipos |
| 4 | Ambiente técnico y sitio institucional | 5-6 | 12 – 23 oct | T2, T3, R1.1–R1.4, R1.8 |
| 5 | Módulo de afiliación en línea | 7-8 | 26 oct – 6 nov | R2.x |
| 6 | Módulo de eventos, torneos y calendario | 9-10 | 9 – 20 nov | R1.5, R3.x |
| 7 | Roles de administración y consultas | 11 | 23 – 27 nov | R1.6, R1.7, R5.x |
| 8 | Versión validada (pruebas y correcciones) | 12-13 | 30 nov – 11 dic | T4, T5 |
| 9 | Sistema documentado y entregado | 14 | 14 – 18 dic | T6, T7, T8 |

R4.x (divulgación) no tiene bloque propio; se construye junto con el sitio institucional (Bloque 4).
