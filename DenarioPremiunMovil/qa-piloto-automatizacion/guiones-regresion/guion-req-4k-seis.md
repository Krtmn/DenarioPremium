# Guión de pruebas · Los 6 requerimientos de 4K

**Cliente:** IMPORTADORA 4K (`DIESE` / GRUPO 4K) · playa **Isla Coche**
**Perfil:** `automation/clientes/4k.yaml`
**Creado:** 2026-09-04 · tras la vuelta parcial del 03-04/09
**Para qué sirve:** que la vuelta COMPLETA no deje nada fuera, la haga quien la haga.

> Este guión cubre **todos** los escenarios de los 6 REQ, incluidos los que en la
> vuelta parcial quedaron sin probar. Lo ya validado se marca, pero **hay que
> repetirlo todo** en la regresión: los fixes de un REQ pueden romper otro.

---

## Estado al 04/09/2026

| # | REQ | Construido | Probado | Bloqueo |
|---|---|---|---|---|
| 1 | Comentario obligatorio por motivo | ✅ | ✅ PASS | — |
| 2 | Desactivar actividades | ✅ | ✅ PASS | — |
| 3 | Zoom de imágenes | ✅ | ⏸ | **no hay productos con imagen** |
| 4 | Moneda por defecto (defecto) | n/a | ⏸ | falta el cliente/config donde reproduce |
| 5 | HTML en descripciones | ✅ | ✅ PASS | — |
| 6 | Estatus en depósitos | ⚠ parcial | ⏸ | dev corrió algo en BD; queda por validar |

---

## Precondiciones comunes

| Qué | Cómo se consigue |
|---|---|
| **CDP** | `adb forward tcp:9220 localabstract:webview_devtools_remote_<PID>` — el socket **cambia en cada reinicio** de la app |
| **Sincronizar** | 🔑 botón **«Sincronizar» en el HOME** (~15 s). **NO** salir y volver a entrar: es lento y ya colgó la app una vez |
| **Usuario móvil** | `v.0002zonacentral` — **en minúscula**, tal como lo recuerda el equipo |
| **Usuario web** | bloque `# USUARIO WEB` de `secrets/qa-credentials.env`, inyectado por portapapeles y **limpiado después** |
| **BD** | `node automation/db/query.js 4k "SELECT ..."` — solo lectura |

### 🔴 Trampas conocidas (cuestan horas si se olvidan)

1. **El selector de cliente NO abre al clic.** Ni en Visitas ni en Cobros. Hay que
   invocar `#clienteSelectModal.present()` y luego clickear el **`<p>`** del nombre
   (el centro del ítem cae en la zona de saldos).
2. **Nunca uses `history.back()` con un modal abierto.** Deja el modal huérfano:
   se ve a pantalla completa, sin marco, y bloquea todos los clics. Se arregla
   reiniciando la app. Para salir usa el botón **CANCELAR** del propio modal.
3. **Un cero no es un resultado.** Si la lista de actividades devuelve 0 cuando
   deberían ser 12, **no llegaste a la pantalla**: es un falso PASS. Verificá el
   conteo esperado antes de concluir.
4. **Puede haber varias visitas guardadas del mismo cliente.** Abrir «la primera
   que coincide» ya produjo un FAIL falso. Recorrelas todas.
5. **Alertas de la web con máscara.** El botón Desactivar abre un diálogo cuya
   `ui-dialog-mask` tapa la pantalla; si el detector no lo ve, parece que el clic
   «no hizo nada». Buscar el diálogo **sin** filtrar por `offsetParent`.
6. **Leé visibilidad, no presencia.** `ion-alert` con `overlay-hidden` son alertas
   **descartadas**, no activas. Confundirlas ya generó un falso hallazgo.

---

# REQ 1 · Comentario obligatorio según el motivo

> En la web, al crear un motivo, poder indicar si el comentario es obligatorio.
> El móvil debe exigirlo al seleccionar ese motivo.

**Artefactos:** BD · Web · WebService · Móvil

### Datos de prueba

Crear en **Empresa → Configuración → Actividades**, y dentro **Ver Eventos**:

| Actividad | Motivo | Comentario Requerido |
|---|---|---|
| `QA ACT <fecha>` | `QA MOTIVO CON COMENTARIO` | **SI** |
| `QA ACT <fecha>` | `QA MOTIVO SIN COMENTARIO` | NO |

El control (el motivo con NO) **no es opcional**: sin él no se prueba que la
validación mire el motivo, solo que exige comentario siempre.

### Casos

| ID | Escenario | Resultado esperado |
|---|---|---|
| **R1-01** | Web: crear motivo con el selector en **SI** | Se guarda · listado muestra «SI» |
| **R1-02** | Web: crear motivo con el selector en **NO** | Se guarda · listado muestra «NO» |
| **R1-03** | Web: **editar** un motivo existente y cambiar SI↔NO | El cambio persiste al reabrir |
| **R1-04** | BD: `incidence_motive.required_comment` | `true` / `false` según lo marcado |
| **R1-05** | Sincronizar y abrir el selector de motivos en el móvil | Los dos motivos aparecen |
| **R1-06** | Móvil: motivo **SI** + comentario **vacío** → AGREGAR | ❌ **No agrega** · mensaje que indique qué falta |
| **R1-07** | Móvil: motivo **SI** + comentario **lleno** → AGREGAR | ✅ Agrega |
| **R1-08** | Móvil: motivo **NO** + comentario vacío → AGREGAR | ✅ Agrega *(control)* |
| **R1-09** | Móvil: dentro del mismo modal, cambiar de motivo **SI → NO** | La exigencia **se levanta** |
| **R1-10** | Móvil: cambiar de motivo **NO → SI** | La exigencia **aparece** |
| **R1-11** | Móvil: comentario de **más de 120** caracteres | Se corta o se rechaza; no revienta |
| **R1-12** | **Persistencia**: guardar la visita, salir, reabrir | El comentario sigue ahí |
| **R1-13** | **Enviar** la visita y verificar en la nube | El comentario llega completo |
| **R1-14** | Web: ver esa visita en el histórico | Muestra motivo y comentario |

### ⚠ Casos que la vuelta parcial NO cubrió

- **R1-09 / R1-10** — cambiar de motivo sin cerrar el modal. Es donde más fácil se
  queda pegado un estado anterior.
- **R1-11** — el límite de caracteres.
- **R1-12 a R1-14** — persistencia, envío y verificación en la web. **Solo se
  guardó localmente**; nunca se envió una visita ni se cotejó contra la nube.
- **Caso borde a decidir con desarrollo:** una visita **ya guardada** con un motivo
  que *después* pasa a exigir comentario. ¿Se puede enviar tal cual, o se bloquea?

### Observación abierta (no defecto)

El pie del campo dice **«Mín. 0 - Máx. 120»** aunque el campo sea obligatorio, y
justo debajo aparece «¡Campo Obligatorio!». Se contradicen. Confirmar si se ajusta.

---

# REQ 2 · Desactivar actividades

> Poder eliminar/ocultar actividades para que no aparezcan en el móvil, pero
> **sí sigan viéndose en las visitas ya guardadas**.

**Artefactos:** Web · WebService · Móvil

### Casos

| ID | Escenario | Resultado esperado |
|---|---|---|
| **R2-01** | Web: listado de Actividades | Columna **Activa** + acción Activar/Desactivar |
| **R2-02** | Web: pulsar **Desactivar** | Confirmación: «¿Está seguro…? **También se desactivarán sus motivos**» |
| **R2-03** | Web: **Cancelar** en esa confirmación | No cambia nada |
| **R2-04** | BD tras aceptar | `incidence_type.active = false` **y** todos sus `incidence_motive.active = false` |
| **R2-05** | BD: `required_comment` de esos motivos | **Se conserva** (no se pierde al desactivar) |
| **R2-06** | Móvil tras sincronizar: **visita NUEVA** | La actividad **ya no se ofrece** · el conteo baja en 1 |
| **R2-07** | Móvil: **visita GUARDADA** que la usaba | **Sigue visible**, con su actividad y motivo |
| **R2-08** | Móvil: visita **ENVIADA** que la usaba | Sigue visible en el histórico |
| **R2-09** | **Enviar** una visita guardada que usa una actividad desactivada | Debe poder enviarse |
| **R2-10** | Web: esa visita en el histórico | Muestra la actividad aunque esté desactivada |
| **R2-11** | Web: **Reactivar** la actividad | Vuelve a `active = true`… |
| **R2-12** | …¿y sus **motivos**? | 🔴 **VERIFICAR**: la desactivación cascadea, ¿la reactivación también? |
| **R2-13** | Móvil tras reactivar y sincronizar | Vuelve a ofrecerse, con sus motivos |

### ⚠ Casos que la vuelta parcial NO cubrió

- **R2-03** (cancelar), **R2-08 a R2-10** (enviada + web), **R2-11 a R2-13** (reactivar).
- 🔴 **R2-12 es el más importante de los que faltan.** Al desactivar, los motivos
  caen en cascada. Si al reactivar **no** vuelven, la actividad queda activa pero
  **sin motivos**, y como `required_event = true` podría quedar inservible.

---

# REQ 3 · Zoom de imágenes en Productos y Pedidos

> En el detalle del producto, poder hacer zoom a la imagen.

**Artefactos:** Móvil

### 🔴 Precondición bloqueante

**Hace falta al menos un producto CON imagen cargada.** Al 04/09 no había ninguno
en 4K, por eso quedó en stand by. Sin esto no se puede probar nada.

### Casos

| ID | Escenario | Resultado esperado |
|---|---|---|
| **R3-01** | **Productos** → detalle de un producto **con** imagen | Se ve la imagen |
| **R3-02** | Tap sobre la imagen | Abre el zoom |
| **R3-03** | Dentro del zoom: ampliar / reducir | Responde al gesto |
| **R3-04** | Cerrar el zoom | Vuelve al detalle, sin quedar bloqueado |
| **R3-05** | **Pedidos** → detalle de producto → tap en imagen | Mismo comportamiento |
| **R3-06** | Producto **sin** imagen | No abre zoom y **no rompe** la pantalla |
| **R3-07** | Imagen muy grande / muy pequeña | Se ajusta sin deformar |
| **R3-08** | Rotar el equipo con el zoom abierto | No se descuadra |

---

# REQ 4 · La moneda por defecto no se respeta *(defecto, no mejora)*

> Con moneda **fuerte y sin conversión**, en Clientes y Pedidos los saldos salen
> en bolívares cuando deberían salir en dólares.

**Artefactos:** por determinar — desarrollo pidió investigar

### 🔴 Precondición bloqueante

**Falta identificar el cliente/empresa donde reproduce.** Hay que configurar
(o encontrar) una empresa con **moneda fuerte y sin conversión**. Elegir mal el
caso lleva a reportar «no reproduce» cuando el problema sí existe.

### Casos

| ID | Escenario | Resultado esperado |
|---|---|---|
| **R4-01** | Web: Empresas → Módulos, poner moneda **fuerte sin conversión** | Queda guardado |
| **R4-02** | BD: qué monedas tiene configuradas la empresa | Documentar — desarrollo preguntó *«si hay una sola moneda, ¿por qué salen dos?»* |
| **R4-03** | Móvil → **Clientes** → detalle: los saldos | En la moneda configurada, **no** en Bs |
| **R4-04** | Móvil → **Pedidos**: montos y totales | Ídem |
| **R4-05** | Comparar contra una empresa **con** conversión | Aislar si el defecto es de la config sin conversión |
| **R4-06** | BD: la moneda del cliente y de sus documentos | Ver si el dato viene mal de origen o lo pinta mal el móvil |

**Entregable:** este REQ no se «certifica»; se **diagnostica**. Lo útil para
desarrollo es decir en qué capa se tuerce el dato.

---

# REQ 5 · HTML en las descripciones del cliente

> Que `tx_description_1` y `tx_description_2` acepten HTML (negrita, saltos),
> como ya hace `user_information` en Vendedores.

**Artefactos:** BD · Móvil · variable global `htmlClientDescription`

### Preparación

1. `V20260901_01__html_client_description.sql` — crea la variable *(ya corrido)*.
2. `prueba_html_descripciones_cliente.sql` — carga el HTML de prueba.
   🔴 Cambiar `id_client` en **los dos** CTE `params`, y correr con **Alt+X**
   (script completo), no `Ctrl+Enter`. Ya pasó que solo entró la primera sentencia.
3. Tras cambiar la flag: **cerrar sesión y volver a entrar**, luego sincronizar.

### Casos

| ID | Escenario | Resultado esperado |
|---|---|---|
| **R5-01** | `htmlClientDescription = **true**` → detalle del cliente | **Negrita y saltos** renderizados |
| **R5-02** | `<b>` y `<strong>` | Los dos funcionan |
| **R5-03** | `<br>` | Salto de línea real |
| **R5-04** | `htmlClientDescription = **false**` | 🔴 **VERIFICAR**: ¿texto plano limpio, o se ven las etiquetas crudas? |
| **R5-05** | Cliente **sin** descripción | No muestra la fila ni deja hueco |
| **R5-06** | Descripción **sin** HTML, texto normal | Se ve igual que siempre |
| **R5-07** | HTML mal cerrado (`<b>texto`) | No descuadra el resto de la pantalla |
| **R5-08** | **Sanitización**: `<script>`, `onerror=`, `<iframe>` | 🔴 **No debe ejecutarse** — existe `sanitizeDescription()`, hay que probarlo |
| **R5-09** | **No regresión**: Vendedores con `user_information` | Sigue funcionando como antes |
| **R5-10** | Descripción muy larga con varios saltos | No rompe el layout |

### ⚠ Casos que la vuelta parcial NO cubrió

- **R5-04** — el comportamiento con la flag en `false`. Es el estado por defecto
  de todos los demás clientes: si ahí se vieran las etiquetas crudas, sería peor
  que no tener la mejora.
- **R5-08** — la sanitización. Es el de más riesgo de los tres.
- **R5-09** — que no se haya roto Vendedores, que era el precedente del REQ.

---

# REQ 6 · Estatus en Depósitos, como en Cobros

> Replicar en Depósitos los estatus que ya existen en Cobros, para poder asignar
> **Validación**, **Recaudado** y **Pendiente**.

**Artefactos:** BD · Web · (móvil por confirmar)

### Estado medido el 03/09 (antes de que desarrollo corriera lo suyo)

- Catálogo ✅: los 3 estatus se crean en **Empresa → Estatus de transacciones**,
  selector **Depósitos**, con «Requiere comentario» funcionando (SI solo en Validación).
- Asignación ❌: la lista de depósitos mostraba **Estatus como texto plano**, sin
  el selector que sí tiene Cobros, y el detalle tampoco lo tenía.
- Dev corrió algo en BD después. **Hay que volver a medir desde cero.**

### Casos

| ID | Escenario | Resultado esperado |
|---|---|---|
| **R6-01** | Web: crear estatus de depósito con Requiere comentario **SI** | Se guarda |
| **R6-02** | Ídem con **NO** | Se guarda |
| **R6-03** | Web: **editar** un estatus | Persiste |
| **R6-04** | Web: **eliminar** un estatus | Borrado lógico (`co_operation = 'D'`), no se lista |
| **R6-05** | BD: `statuses` para `co_transaction_type = 'dep'` | `editable = true` en los tres |
| **R6-06** | 🔑 Web: **lista de Depósitos** → asignar un estatus a un depósito | Debe existir el selector, **como en Cobros** |
| **R6-07** | Asignar el estatus que **exige comentario** sin escribirlo | ❌ Lo rechaza |
| **R6-08** | Ídem con comentario | ✅ Lo asigna |
| **R6-09** | BD: `transaction_statuses` tras asignar | Nueva fila con el estatus y el usuario |
| **R6-10** | Web: recargar la lista | El estatus asignado persiste |
| **R6-11** | **Comparar con Cobros** lado a lado | Mismo comportamiento |
| **R6-12** | Móvil: ¿el vendedor ve el estatus del depósito? | Definir con desarrollo si aplica |

### 🔴 Punto a aclarar con desarrollo

`status_action` de «Pendiente» quedó en **3** en Depósitos, pero en Cobros
«Pendiente» es **1**. Ese campo decide si la transacción se trata como aprobada
(1), rechazada (2) o neutra (3). ¿Es intencional la diferencia?

---

## Limpieza al terminar la regresión

| Qué | Acción |
|---|---|
| Actividad y motivos `QA …` | Dejar **desactivados** (o borrar, si QA lo indica) |
| Estatus de depósito de prueba | Borrar los que no vayan a producción |
| Cliente con HTML de prueba (`id_client 11`) | Decidir si se limpia `tx_description_1/2` |
| Visitas guardadas de prueba | Borrarlas para que no ensucien la ruta |
| Portapapeles | **Limpiar** tras cada login |

---

*Guión creado el 2026-09-04 a partir de la vuelta parcial documentada en*
*`automation/reports/4k/req_incidencias_20260903/`.*
