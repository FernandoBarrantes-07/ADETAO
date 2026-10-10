# Manual de usuario — Inventario y préstamos

Guía para el personal de ADETAO que lleva el control de los arcos, el equipo y las piezas de la asociación, y de lo que se presta a cada arquero.

## Contenido

1. [Antes de empezar](#1-antes-de-empezar)
2. [Entrar al sistema](#2-entrar-al-sistema)
3. [Ver el inventario](#3-ver-el-inventario)
4. [Agregar y editar artículos](#4-agregar-y-editar-artículos)
5. [Piezas](#5-piezas)
6. [Tipos de arco](#6-tipos-de-arco)
7. [Prestar](#7-prestar)
8. [Devolver](#8-devolver)
9. [Consultar historiales](#9-consultar-historiales)
10. [Qué significa cada estado](#10-qué-significa-cada-estado)
11. [Si aparece este mensaje](#11-si-aparece-este-mensaje)
12. [Consejos](#12-consejos)

---

## 1. Antes de empezar

En el sistema hay tres tipos de cuenta, y cada una puede hacer cosas distintas en el inventario:

| Cuenta | Qué puede hacer |
|---|---|
| **Administrador** | Todo: artículos, piezas, préstamos, devoluciones, historiales y la lista de tipos de arco. |
| **Profesor** | Lo mismo que el administrador, excepto cambiar la lista de tipos de arco (solo puede verla). |
| **Usuario (arquero)** | Por ahora no tiene acceso al inventario. Si un arquero quiere saber qué tiene prestado, el personal puede consultarlo en el historial (sección 9). |

Algunas palabras que se usan en esta guía:

- **Artículo:** equipo grande o que se presta completo: arcos, dianas, carcajes, protectores, estabilizadores.
- **Pieza:** repuestos y accesorios que se prestan por cantidad: flechas, cuerdas, visores, dactileras.
- **Préstamo:** cuando se entrega un artículo o pieza a un arquero.
- **Disponible / Total:** cuántas unidades hay en bodega ahora y cuántas tiene la asociación en total. Por ejemplo, `2 / 4` quiere decir que hay 4 en total y 2 están en bodega (las otras 2 están prestadas o en reparación).

## 2. Entrar al sistema

1. Abra la dirección del sistema en el navegador.
2. Escriba su correo y su contraseña.
3. Pulse **Iniciar sesión**.

[CAPTURA: pantalla de inicio de sesión con los campos de correo y contraseña]

4. En el menú de la izquierda, pulse **Inventario**.

[CAPTURA: menú lateral con la opción Inventario resaltada]

Verá cuatro pestañas en la parte de arriba: **Artículos**, **Piezas**, **Préstamos** y **Tipos de arco**.

[CAPTURA: pantalla de Inventario con las cuatro pestañas]

> Si no ve la opción **Inventario** en el menú, su cuenta no tiene permiso. Hable con el administrador.

Para salir, pulse **Cerrar sesión** abajo a la izquierda.

## 3. Ver el inventario

La pestaña **Artículos** muestra una tabla con:

- **Código** (por ejemplo, ARC-001), **Nombre**, **Tipo** y, en los arcos, el **Tipo de arco**.
- **Ubicación**: dónde se guarda (Bodega A, Campo, Taller…).
- **Disponible / Total**: si el primer número sale en **rojo**, no queda ninguna unidad en bodega.
- **Estado**: ver la [sección 10](#10-qué-significa-cada-estado).

[CAPTURA: tabla de artículos con la columna Disponible / Total]

Para encontrar algo:

1. Escriba en el cuadro **Buscar** parte del nombre, el código, la ubicación o la descripción.
2. Use las listas de filtros: tipo, estado, tipo de arco, y "Con unidades disponibles" o "Sin unidades disponibles".
3. Arriba de la tabla verá cuántos resultados hay, por ejemplo "3 de 8 registros".
4. Pulse **Limpiar** para quitar todos los filtros.

[CAPTURA: búsqueda "recurvo" con el contador "3 de 8 registros"]

Si nada coincide, verá el mensaje "Ningún artículo coincide con los filtros."

## 4. Agregar y editar artículos

### Agregar un artículo

1. En la pestaña **Artículos**, pulse **+ Nuevo artículo**.
2. Complete los datos. Los que tienen asterisco (*) son obligatorios:
   - **Nombre*** (por ejemplo, "Arco recurvo 66" 24 lb").
   - **Código**: debe ser único; no puede repetirse.
   - **Tipo***: escriba o elija de la lista (arco, diana, carcaj…).
   - **Tipo de arco***: solo aparece si el tipo es "arco". Elija uno de la lista.
   - **Cantidad total***: cuántas unidades hay.
   - **Ubicación**, **Estado** y **Descripción**.
3. Pulse **Guardar**.

[CAPTURA: formulario "Nuevo artículo" con el tipo "arco" y la lista "Tipo de arco"]

Al guardar, todas las unidades quedan disponibles. Verá el mensaje "Artículo registrado."

### Editar un artículo

1. Pulse **Editar** en la fila del artículo.
2. Cambie lo necesario y pulse **Guardar**.

Tenga en cuenta:

- **No puede bajar la cantidad total por debajo de lo que está prestado.** El formulario le indica cuántas unidades hay prestadas ("Asignadas: 2. No puede ser menor.").
- Si sube la cantidad total, las unidades nuevas quedan disponibles.

[CAPTURA: formulario de edición con la nota "Asignadas: 2. No puede ser menor."]

### Cambiar el estado rápidamente

En la columna **Estado** de cada fila hay una lista. Elija el nuevo estado y se guarda de inmediato.

- Mientras haya unidades prestadas, **Mantenimiento**, **Dañado** y **Perdido** aparecen en gris con el texto "Primero registre la devolución". Primero registre la devolución (sección 8) y luego cambie el estado.
- **Prestado** no se puede elegir: el sistema lo pone solo cuando no queda ninguna unidad en bodega.

[CAPTURA: lista de estado con opciones en gris "Primero registre la devolución"]

> Los artículos no se borran desde la pantalla, para no perder su historial. Si un artículo ya no se usa, póngalo en **No disponible**.

## 5. Piezas

La pestaña **Piezas** funciona igual que la de artículos: buscar, filtrar, **+ Nueva pieza**, **Editar**, cambiar estado e **Historial**.

Diferencias:

- El **tipo** es opcional (flecha, cuerda, visor, accesorio…).
- Las piezas no tienen tipo de arco.
- El código de cada pieza también debe ser único.

[CAPTURA: tabla de piezas con flechas y cuerdas]

## 6. Tipos de arco

La pestaña **Tipos de arco** tiene la lista de tipos (Recurvo, Compuesto, Barebow, Tradicional…) que se usa para los arcos del inventario y para los arqueros.

**Solo el administrador** puede cambiarla. El profesor la ve con el aviso "Catálogo de solo lectura".

### Crear o editar un tipo

1. Pulse **+ Nuevo tipo** (o **Editar** en una fila).
2. Escriba el **Nombre*** y, si quiere, una **Descripción**.
3. Pulse **Guardar**.

No puede haber dos tipos con el mismo nombre, aunque cambien mayúsculas y minúsculas ("Recurvo" y "recurvo" son el mismo).

[CAPTURA: formulario "Nuevo tipo de arco"]

### Desactivar un tipo

Los tipos de arco **no se borran: se desactivan**.

1. Pulse **Desactivar** en la fila.
2. Si el tipo está en uso, el sistema le dice cuántos arqueros y artículos lo tienen. Esos registros lo conservan, pero ya no se podrá elegir para arcos nuevos.
3. Pulse **Desactivar** para confirmar, o **Cancelar**.

[CAPTURA: aviso "Recurvo está en uso por 2 arqueros y 3 artículos de inventario"]

### Ver y reactivar tipos desactivados

1. Marque la casilla **Mostrar inactivos**.
2. Los tipos desactivados aparecen como **Inactivo**.
3. Pulse **Reactivar** para volver a usarlo.

## 7. Prestar

1. Vaya a la pestaña **Préstamos** y pulse **+ Nuevo préstamo**.
2. **Arquero***: escriba parte del nombre o de la identificación y elija al arquero de la lista. Solo aparecen arqueros **activos**.
3. **Qué se presta***: elija **Artículo** o **Pieza**.
4. Elija el artículo o la pieza. La lista solo muestra lo que está **Disponible** y tiene unidades; al lado de cada uno dice cuántas quedan ("2 disp.").
5. **Cantidad***: cuántas unidades se entregan.
6. **Observaciones**: estado del equipo al entregarlo, para qué se presta, etc.
7. Pulse **Registrar préstamo**.

[CAPTURA: formulario "Nuevo préstamo" con el arquero elegido y la lista de artículos con "disp."]

Verá un mensaje como "Préstamo registrado: 1 × "Arco recurvo 66" 24 lb" a José Vargas Mora."

No hace falta escribir la fecha ni quién registra el préstamo: el sistema guarda la fecha y hora actuales y el nombre de quien está usando el sistema.

Si al prestar la última unidad el artículo queda sin unidades en bodega, su estado cambia solo a **Prestado**.

> Si un arquero no aparece en la lista, puede estar inactivo. El estado del arquero se cambia en el módulo de **Arqueros**, no en el inventario.

## 8. Devolver

Las devoluciones se registran desde la pestaña **Préstamos**:

- En **Préstamos activos**, busque el préstamo y pulse **Devolver**.
- O en **Historial por arquero**, elija al arquero y pulse **Devolver** en la parte "Tiene ahora".

[CAPTURA: lista de préstamos activos con el botón Devolver]

Se abre una ventana con los datos del préstamo. Elija **qué pasó**, revise la **fecha de devolución** (por defecto, ahora mismo) y pulse **Guardar**.

> **Importante: una devolución siempre es por la cantidad completa del préstamo.** No se puede devolver solo una parte (por ejemplo, 4 de 6 flechas). Si eso pasa, use el procedimiento de la sección 8.4.

### 8.1 Devolución normal (en buen estado)

1. Elija **Devolver en buen estado**.
2. Si quiere, escriba en observaciones cómo se recibe el equipo.
3. Pulse **Guardar**.

Las unidades vuelven a estar disponibles en bodega.

[CAPTURA: ventana "Registrar devolución" con la opción "Devolver en buen estado"]

### 8.2 Devolución con daño

1. Elija **Devolver dañado**.
2. **Describa el daño en observaciones** (es obligatorio).
3. Pulse **Guardar**.

El préstamo queda como **Dañado**: las unidades **no** vuelven a bodega hasta que se reparen. En la lista, el botón cambia de **Devolver** a **Cerrar**.

Cuando el equipo esté reparado, o si no tiene arreglo:

1. Pulse **Cerrar** en ese préstamo.
2. Elija una opción:
   - **Reparado: vuelve al inventario**: las unidades vuelven a estar disponibles.
   - **Dar de baja como perdido**: las unidades se descuentan del total (describa el motivo en observaciones).
3. Pulse **Guardar**.

[CAPTURA: ventana "Cerrar préstamo dañado" con "Entregado dañado el …"]

### 8.3 Equipo perdido

1. Elija **Reportar como perdido**.
2. **Describa la pérdida en observaciones** (es obligatorio).
3. Pulse **Guardar** (el botón se ve en rojo).

Las unidades se descuentan de la cantidad total del artículo. Si se pierden todas las unidades de un artículo, su estado cambia solo a **Perdido**.

### 8.4 Cuando el arquero devuelve solo una parte (procedimiento provisional)

Mientras ADETAO define si necesita devoluciones parciales, siga estos pasos:

1. Registre la **devolución completa** del préstamo (por ejemplo, las 6 flechas), como en la sección 8.1. En observaciones puede anotar lo que pasó ("Entregó 4 de 6 flechas").
2. Cree enseguida un **préstamo nuevo** al mismo arquero por las unidades que todavía tiene (en el ejemplo, 2 flechas).
3. En las observaciones del préstamo nuevo escriba: **"Pendiente de devolución parcial del préstamo del [fecha]"**, con la fecha del préstamo original (por ejemplo, "Pendiente de devolución parcial del préstamo del 10/10/2026").

[CAPTURA: préstamo nuevo con la observación "Pendiente de devolución parcial del préstamo del 10/10/2026"]

> Si el arquero ya está **inactivo**, el sistema no le permite crear el préstamo nuevo del paso 2. En ese caso, avise al administrador para que revise el estado del arquero antes de continuar.

Las observaciones de la devolución se agregan a las del préstamo con la fecha y el tipo de cierre, por ejemplo: `[10/10/2026 Devuelto] Entregó 4 de 6 flechas`.

## 9. Consultar historiales

### Préstamos activos

En la pestaña **Préstamos**, la vista **Préstamos activos** muestra lo que está pendiente de devolver (activos y dañados). Arriba dice cuántos hay ("6 pendientes de devolución").

Puede filtrar por arquero, por tipo (solo artículos o solo piezas), por artículo o pieza y por estado. En el filtro de estado, **Todos los estados** muestra también los préstamos cerrados. El cuadro de búsqueda acepta nombre, identificación o código.

[CAPTURA: vista Préstamos activos con los filtros]

### Historial por arquero

1. En **Préstamos**, pulse **Historial por arquero**.
2. Busque y elija al arquero (aparecen también los inactivos).
3. Verá dos partes:
   - **Tiene ahora**: lo que todavía tiene prestado, con el botón para devolver.
   - **Préstamos anteriores**: lo que ya devolvió o se perdió.

[CAPTURA: historial de un arquero con "Tiene ahora" y "Préstamos anteriores"]

### Historial de un artículo o pieza

1. En **Artículos** o **Piezas**, pulse **Historial** en la fila.
2. Verá cada préstamo de ese artículo: quién lo tuvo, cuántas unidades, cuándo se prestó, cuándo volvió, en qué estado y las observaciones.

[CAPTURA: ventana "Historial: ARC-001 · Arco recurvo 66" 24 lb"]

> En la columna **Registrado por**, a veces aparece un guion (—) en lugar del nombre. Quiere decir que el sistema todavía no le permite ver el nombre de esa persona; el préstamo está bien registrado.

## 10. Qué significa cada estado

### Estados de un artículo o pieza

| Estado | Qué significa | Quién lo pone |
|---|---|---|
| **Disponible** | Se puede prestar (si quedan unidades en bodega). | El personal, o el sistema cuando vuelven unidades. |
| **Prestado** | No queda ninguna unidad en bodega: todas están prestadas o en reparación. | Solo el sistema. Vuelve a Disponible cuando regresa al menos una unidad. |
| **Mantenimiento** | En revisión o reparación; no se presta. | El personal (solo si no hay unidades prestadas). |
| **Dañado** | Dañado; no se presta. | El personal (solo si no hay unidades prestadas). |
| **No disponible** | Fuera de uso por otro motivo; no se presta. | El personal (se puede poner aunque haya unidades prestadas). |
| **Perdido** | Perdido; no se presta. | El personal (sin unidades prestadas), o el sistema cuando se pierden todas las unidades. |

### Estados de un préstamo

| Estado | Qué significa |
|---|---|
| **Activo** | El arquero tiene el equipo. |
| **Dañado** | El arquero lo devolvió dañado; está fuera de servicio hasta registrar la reparación o la baja. |
| **Devuelto** | Volvió a bodega. Es un estado final. |
| **Perdido** | Se perdió y se descontó del total. Es un estado final. |

Un préstamo **Devuelto** o **Perdido** ya no se puede cambiar.

## 11. Si aparece este mensaje

Los textos entre comillas cambian según el artículo o el arquero.

### Al agregar o editar

| Mensaje | Qué hacer |
|---|---|
| El nombre es obligatorio. | Escriba el nombre. |
| El tipo es obligatorio. | Escriba o elija el tipo del artículo. |
| Seleccione el tipo de arco. / Los arcos deben tener un tipo de arco. | Si el tipo es "arco", elija un tipo de arco de la lista. |
| La cantidad debe ser un número entero igual o mayor que 0. / La cantidad no puede ser negativa. | Escriba un número entero sin decimales (0, 1, 2…). |
| Ya existe un artículo con ese código. / Ya existe una pieza con ese código. | Ese código ya lo usa otro registro. Use otro código o busque el registro existente. |
| Ya existe un tipo de arco llamado "…". / Ya existe un tipo de arco con ese nombre. | Ese tipo ya existe. Si no lo ve, marque "Mostrar inactivos" y reactívelo. |
| La cantidad no puede ser menor que N: hay N unidades asignadas. / No se puede reducir la cantidad de "…" a N: hay N unidades asignadas. | Hay unidades prestadas. Registre primero las devoluciones o deje una cantidad igual o mayor. |
| No se puede cambiar "…" a "…": hay N unidades prestadas. Primero registre la devolución. | Registre la devolución de las unidades prestadas y luego cambie el estado. |
| "…" sigue en estado "Prestado": no tiene unidades disponibles. | Es normal: el artículo vuelve a Disponible solo cuando regrese al menos una unidad. |
| El estado "prestado" se asigna automáticamente… | Elija otro estado; "Prestado" lo pone el sistema. |
| El tipo de arco "…" está inactivo. Elija un tipo de arco activo. | Elija otro tipo, o pida al administrador que lo reactive. |

### Al prestar

| Mensaje | Qué hacer |
|---|---|
| Seleccione el arquero. / Seleccione el artículo. / Seleccione la pieza. | Complete el dato que falta. |
| La cantidad debe ser un número entero mayor que 0. / La cantidad prestada debe ser mayor que 0. | Escriba 1 o más, sin decimales. |
| Solo hay N unidades disponibles de "…". | Preste como máximo esa cantidad. |
| Stock insuficiente para "…": se solicitaron N y hay M disponibles. | Otra persona prestó unidades mientras usted llenaba el formulario. Cambie la cantidad o elija otro artículo. |
| No hay artículos (o piezas) disponibles con unidades para prestar. | Todo está prestado, en reparación o fuera de uso. Revise la pestaña Artículos o Piezas. |
| No se puede prestar a "…": el arquero está inactivo. | El arquero está inactivo. Su estado se revisa en el módulo de Arqueros. |
| No se puede asignar "…": el artículo está en estado "…". | Ese artículo está en mantenimiento, dañado, no disponible o perdido. Elija otro o cambie su estado si ya está listo. |

### Al devolver

| Mensaje | Qué hacer |
|---|---|
| Seleccione qué pasó con el préstamo. | Elija una de las opciones. |
| Indique la fecha. / Una devolución debe tener fecha. | Escriba la fecha y hora de la devolución. |
| La fecha no puede ser anterior al préstamo (…). | Revise la fecha: debe ser igual o posterior a la del préstamo. |
| La fecha no puede estar en el futuro. | Use la fecha de hoy o una anterior. |
| Describa el daño en las observaciones. / Describa la pérdida en las observaciones. | Escriba qué pasó; es obligatorio para dañados y perdidos. |
| La fecha de devolución no puede ser anterior a la fecha del préstamo. | Si el préstamo se registró hace menos de un minuto, espere un minuto, cierre la ventana y vuelva a intentarlo (es un fallo conocido que se está corrigiendo). En otro caso, revise la fecha. |
| Este préstamo ya se registró como "…". Actualice la lista. | Otra persona ya registró esa devolución. Cambie a otra vista o pestaña y vuelva para ver la lista actualizada. |
| Transición de estado no permitida: de "…" a "…". | Ese préstamo ya está cerrado y no admite cambios. Actualice la lista. |

### Otros

| Mensaje | Qué hacer |
|---|---|
| No tiene permisos para realizar esta acción. | Su cuenta no puede hacer eso. Hable con el administrador. |
| No se pudo conectar con el servidor. Revise su conexión. | Revise el internet y pulse **Reintentar** o vuelva a intentarlo. |
| Ocurrió un error inesperado. Intente de nuevo. / Los datos no cumplen las reglas del sistema. / El registro está relacionado con otros datos y no se puede modificar así. | Vuelva a intentarlo. Si se repite, anote qué estaba haciendo y avise al administrador. |

## 12. Consejos

- **Termine un formulario antes de cambiar de pestaña del navegador.** Si cambia a otra pestaña o ventana y vuelve, la pantalla puede recargarse y tendría que llenarlo de nuevo.
- **Para ver la lista de préstamos actualizada**, cambie a "Historial por arquero" y vuelva a "Préstamos activos", o cambie de pestaña dentro de Inventario.
- **Use las observaciones.** Anote el estado del equipo al prestarlo y al recibirlo; quedan guardadas en el historial con la fecha.
- **En el celular**, si no ve la pestaña **Tipos de arco**, deslice las pestañas hacia la izquierda.
