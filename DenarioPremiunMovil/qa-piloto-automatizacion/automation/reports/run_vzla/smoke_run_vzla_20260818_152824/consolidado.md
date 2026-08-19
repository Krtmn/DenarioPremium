# Consolidado de cierre — Smoke `run_vzla`

| | |
|---|---|
| **RUN_ID** | `20260818_152824_smoke-completo` |
| **Cliente / tenant** | `run_vzla` — **CORPORACION FERRE 19, C.A.** (`co_enterprise = FERRE_N`, `id_enterprise = 1`) |
| **Playa** | **LA TORTUGA** — móvil `http://denariolatortuga.ddns.net:8081/PremiumWS/services/` · web `http://denariolatortuga.ddns.net:8080/DenarioPremium` |
| **Build** | APK `com.kiberno.denarioPremiumPro` v**1.0** / db**19** (variante v21 del modal de inventario) · device Infinix X6728 (HOT 60i), 360×744 |
| **Usuario QA** | `id_user = 470` · `co_user = '000208'` · 1.569 clientes en cartera · credenciales `***` / `***` |
| **Fechas de ejecución** | móvil **2026-08-18** (8 módulos) + **2026-08-19** (cobros) · web **2026-08-18** (F/C-HOY/A/M/D) + **2026-08-19** (C) |
| **Oráculo de datos** | BD nube `run_vzla` vía `automation/db/query.js` — **GRANT completo, 185/185 tablas** |
| **Documento de referencia** | `automation/reports/INCIDENCIA-comentario-visita-120.md` (hallazgo 🔴 más grave, ya redactado aparte) |

---

## 1 · Cifras

### Móvil — 132 casos

| | PASS | N/A | **FAIL** | SKIP |
|---|---|---|---|---|
| **Total** | **110** | 20 | **1** | 1 |

| Módulo | Casos | Módulo | Casos |
|---|---|---|---|
| login | 6 | visitas | 16 |
| clientes | 12 | productos | 17 |
| pedidos | 14 | vendedores | 3 |
| devoluciones | 14 | cobros | 34 |
| inventarios | 16 | | |

### Web — 147 casos

| | PASS | N/A | **FAIL** | SKIP |
|---|---|---|---|---|
| **Total** | **130** | 9 | **3** | 5 |

| Familia | Casos | Alcance |
|---|---|---|
| **F##** filtros | 71 | los 7 módulos de listado |
| **C-HOY** cotejo BD→web | 10 | los 5 registros del día |
| **A##** adjuntos | 23 | 19 recursos + 2 controles negativos |
| **M##** muestreo histórico | 16 | 12 registros de 7 módulos |
| **D##** comportamiento | 14 | orden, paginación, navegación, exportación |
| **C##** cotejo móvil→web | 13 | los 6 registros que llegaron a la nube |

### Total corrida: **279 casos · 4 FAIL**

- **Manifiesto BD (`_bd-manifest.jsonl`): 19 registros, esquema 100 % correcto.**
- **`_hoy-manifest.jsonl`: 7 registros** (los que la QA cargó a mano el 18/08 y sirvieron de insumo a C-HOY y A##).
- Registros creados y **enviados** en esta corrida: cliente potencial **194** · pedido **2820** · devolución **351** · inventario **53** · visitas **2084** y **2086**. Los 6 cotejados campo a campo contra la nube: `BD-OK` + `BD-FIELD-OK`, y los 6 verificados en la web: `WEB-OK`, sin un solo `WEB-MISSING` ni `WEB-FIELD-MISMATCH`.

---

## 2 · Alcance — lo que se cubrió y lo que no

**Se cubrió:** los 9 módulos móviles del smoke y las 6 familias web, con cotejo campo a campo contra BD en las 6 transacciones enviadas y contraste con los 12 registros históricos del muestreo web.

### 🔴 DEPÓSITOS no se corrió — y este es el motivo exacto

El módulo **exige cobros en efectivo enviados** como insumo, y no los hubo:

1. El perfil declaraba que el usuario QA tenía **cero cobros** en todo el tenant. Eso **ya no es cierto** — existe la Ref **32993** (18/08, 227,48 US$), pero está **"Por aprobar"** y no es efectivo disponible del vendedor.
2. Los **4 cobros creados por la corrida quedaron en estado Guardado**: `requiredCollectionAttachments` / `requiredAnticipoAttachments` / `requiredRetentionAttachments` están en **`true`**, el envío exige adjunto, y la instrucción explícita de la QA fue **no usar mock de cámara** ⇒ DM-COB-019 se marcó **SKIP** con motivo, no PASS.
3. Sin cobro en efectivo enviado, no hay porción que depositar ⇒ el módulo queda **sin insumo**, no "sin probar por descuido".

La lección de `grupo_fiel` y `kron` sigue vigente: **depósitos debe correrse junto con cobros y con ≥ 2 cobros en efectivo disponibles** (con uno solo no se pueden cubrir Enviar Y borrar: se consume en el primero).

**Lo que sí se pudo medir de depósitos** fue por la vía web: la familia F## ejerció sus 8 filtros y M## abrió el detalle del depósito 2 — de ahí sale el hallazgo W-3 (abajo).

### Otras lagunas declaradas honestamente

| Qué | Por qué no se cerró |
|---|---|
| **Pedido sugerido** (móvil, pedidos e inventarios) | 🚫 **N/A por DATOS, medido**: `client_avg_product` tiene **24 filas de solo 2 clientes** y **cero** para `006831`. Sin insumo el modal no puede rotular cantidad. Para ejercerlo de verdad hay que correr con `007848` o `007494`. |
| **IGTF, tasa, moneda del cobro, moneda del documento** | 🚫 **N/A ESTRUCTURAL probado en pantalla** (no asumido): ver §7. |
| **Diacríticos en el buscador de productos** | 🚫 N/A por dato: **0 de 1.649** productos tienen tildes. |
| **`VND-KPIS-SIN-SEGMENTAR`** | **No evaluable**, no "no reproduce": con una sola empresa no hay segunda columna contra la que comparar. |
| **Exportaciones web (D07)** | La funcionalidad **no existe en este build**: barrido de los 34 controles visibles de `/pages/pedidos`, cero botones de Excel/PDF/CSV/Imprimir. |
| **`Mapa de Activación`** (`/pages/pedidos`) | Control **no documentado**, no se pulsó por prudencia read-only. Propuesto para el guión web extendido. |

---

## 3 · Hallazgos MÓVIL que superaron el gate

> **Gate `RUNTIME §4.b`:** solo entra lo que **reproduce hoy, en la versión bajo prueba, con registros de hoy**. Lo que solo falla en datos viejos está en §6.

### 🔴 M-1 · Un comentario de más de 120 caracteres hace que la visita **nunca llegue al servidor**, sin ningún aviso

**Severidad: ALTA — pérdida silenciosa de datos de campo. Es el único FAIL móvil de la corrida (DM-VIS-020).**

📄 **Está redactado completo en `automation/reports/INCIDENCIA-comentario-visita-120.md`.** Aquí solo el resumen; no se duplica.

- **Qué pasa.** El comentario de una actividad de visita admite **255 caracteres** (`maxlength=255`, `comp.textCommentMaxLength=255`), pero la columna destino es **`incidence.tx_description varchar(120)`**. El POST sale con el texto completo, el servidor no lo puede insertar y **la transacción nunca se confirma**.
- **Por qué es grave.** Salen **2 de las 3 alertas** (falta justo la del acuse), **la app navega igual** a la lista, el ítem queda "Por Enviar", y **`failed_transactions` se queda en `0`**: el fallo no se registra como fallo. Se contaron **5 POST reintentados** del mismo registro, con `pending_transactions` viva 13 minutos después.
- **Evidencia.** Experimento controlado de 3 visitas variando una sola cosa por vez: 255 car./2 eventos ⇒ **se pierde** · 60 car./1 evento ⇒ Ref **2084** en ~14 s · 18+18 car./**2 eventos** ⇒ Ref **2086** en ~7 s (esta tercera **descarta el confusor** de la multiplicidad de eventos).
- 🔴 **Confirmado a mano por la QA (19/08), sin conocer el diagnóstico:** tomó la visita atascada, **acortó la observación a 9 caracteres** y la visita **entró de inmediato** como **`id_visit 2152`**, con el mismo `co_visit 1787088154545.0`. Mismo dispositivo, mismo usuario, mismo cliente, mismo epoch: **la única variable que cambió fue el largo del texto.** Descarta red, sesión, cola y datos del registro.
- **Alcance en producción.** `incidence`: 2.157 filas, `max(length(tx_description)) = 120` exacto y **8 filas de exactamente 120**, todas cortadas a mitad de palabra, entre el **08/07 y el 07/08/2026**. Son notas de vendedores reales sobre clientes reales, ya perdidas.
- **Tres fuentes, tres límites:** columna **120** · input de la app **255** · VG `longitudComentario` **250**.
- **Qué haría falta para cerrarlo.** (a) Alinear el tope del cliente con el de la BD (o ampliar la columna a 255). (b) **Imprescindible pase lo que pase:** que un POST rechazado caiga en `failed_transactions` y **avise al usuario** — hoy un error de servidor es indistinguible de "sin señal". (c) Deseable: techo de reintentos con backoff.
- ⚠ **Efecto colateral de proceso:** el registro se había dejado atascado en la cola como evidencia viva; se reenvió durante la ventana en que dos agentes tocaban el mismo dispositivo, así que **ya no queda un caso reproducible en el device**. Si Desarrollo necesita verlo en vivo, hay que recrearlo.

### 🟠 M-2 · La guarda de GPS bloquea la navegación **sin indicador útil** — hasta ~87 s

**Un solo defecto medido en 5 módulos. No son 5 hallazgos.**

- **Mecanismo (leído del componente, no inferido).** Con `userMustActivateGPS=true`, tanto `nuevoPedido()` como `selectOrder()` (y sus equivalentes) dejan el `router.navigate` **dentro del `.then()`** de `geoLoc.getCurrentPosition()`. La caché de posición **expira a los 60 s** (`setTimeout(() => { posicion = null; permiso = false; }, 60000)`), así que pasado un minuto el siguiente ingreso vuelve a pagar el fix completo.
- **Mediciones, mismo dispositivo y misma corrida:**

  | Módulo | Peor espera medida | Indicador durante la espera |
  |---|---|---|
  | **Inventarios** | **~87 s** (y un intento previo > 61 s) | `ion-loading` visible **con el mensaje VACÍO** |
  | **Devoluciones** | **43,1 s** (un techo de 40 s falló antes) | **ninguno** — la pantalla no muestra nada |
  | **Pedidos** | **> 20–30 s** (30,3 s al reabrir un Guardado) | **ninguno** |
  | **Visitas** | **6,85 s** (máximo de 7 mediciones) | `ion-loading` con mensaje legible **"Cargando…"** |
  | **Cobros** | **2,3 s** | — (no llega a percibirse) |

- 🔑 **La correlación NO es con lo ligado al GPS que esté el módulo.** VISITAS es el módulo **más** atado al GPS (`userMustActivateGPS=true`, coordenada obligatoria en cada visita) y es **de los más rápidos**. La correlación que sobrevive es con el **volumen de datos que el formulario carga al abrir**: inventarios trae stocks y sugerido; el form de cobro nace vacío.
- 🔴 **Tres variantes de indicador en el mismo build**: ninguno · `ion-loading` con mensaje **vacío** · `ion-loading` con "Cargando…". Ni siquiera son consistentes entre sí.
- **Impacto.** No se pierden datos y termina navegando ⇒ **no es FAIL funcional, es feedback / rendimiento percibido**. Pero el costo es de campo: un vendedor que entra a tomar inventario espera **minuto y medio** sin saber por qué, y el reflejo natural es volver a pulsar (cada pulsación encola otro fix).
- **Qué haría falta para cerrarlo.** `ion-loading` **con mensaje** («Obteniendo ubicación…») en los tres caminos, y/o techo con fallback a `getLatestPosition()`. Y unificar la variante de indicador entre módulos.
- **Coste ya pagado por la automatización:** dos casos parecieron BLOCKED antes de diagnosticarlo. El techo de espera subió tres veces en la misma corrida (≥35 s → ≥60 s → **≥120 s**).

### 🟡 M-3 · En un cobro **nuevo**, Guardar se apaga al marcar el primer documento y **solo revive al adjuntar** (S4)

> 🔴 **CORREGIDO 2026-08-19 tras comprobación manual de la QA.** La versión original de este hallazgo decía
> *"y no vuelve nunca"* y lo clasificaba **S3**. **Es falso:** la QA verificó a mano que **el botón se
> reactiva al colocar el adjunto**. Se rebaja a **S4** y se reescribe el mecanismo.

- **Qué pasa.** `imagenGuardar.disabled` pasa a `false` al llenar el comentario y vuelve a **`true`** en cuanto se marca el checkbox del primer documento. No baja con la retención cargada, ni con el pago completo, ni con `Diferencia 0,00` — el agente paró de medir ahí y concluyó de más. **Al adjuntar la foto, Guardar se habilita de nuevo** (comprobado por la QA).
- **Mecanismo real, leído en el código.** Hay **dos vías** que escriben el mismo flag:
  1. La suscripción normal `collectValidToSave` (`cobros-header.component.ts:172`) → `disableSavedButton = data ? false : true`. Ésta **no se re-emite** tras seleccionar documento, y ahí nace el apagón.
  2. La suscripción de adjuntos (`cobros-header.component.ts:182`):
     ```ts
     this.adjuntoService.AttachmentChanged.subscribe(() => {
       this.collectService.markCollectionDirty();
       this.collectService.validateToSend();
       this.collectService.disableSavedButton = this.collectService.disableSendButton;  // ← revive acá
     });
     ```
     **Guardar hereda el estado de Enviar.** Como al adjuntar el cobro ya está completo, Enviar está habilitado y Guardar revive con él.
- **Lo que queda como defecto** no es que el botón no vuelva, sino que **entre marcar el documento y adjuntar, Guardar está apagado sin motivo**, y que a partir del adjunto **Guardar y Enviar comparten condición** — o sea que no se puede guardar un borrador incompleto una vez adjuntado. Un "guardar borrador" que exige que el registro esté listo para enviar deja de ser un borrador.
- **No hay bloqueo:** el registro se guarda igual por el dirty-guard (back → **"Guardar y salir"** → `saveCollection(..., stDelivery=3)`), que es la ruta que usó el agente para 3 de los 4 cobros. Al reabrir el Guardado desde BUSCAR el botón está habilitado.
- **Impacto: bajo.** En este tenant el adjunto es obligatorio, así que en el flujo normal el vendedor siempre acaba adjuntando y el botón vuelve. La ventana de molestia es real pero corta.
- ⚠ **No confundir** con el `disableSavedButton=true` legítimo que aparece **tras** Guardar (anti-doble-guardado).
- **Qué haría falta para cerrarlo.** Re-emitir `collectValidToSave` cuando el cobro sigue siendo válido tras seleccionar documentos, y **desacoplar Guardar de `disableSendButton`** en la vía del adjunto.
- 📌 **Lección de método:** el agente declaró "no vuelve nunca" sin haber recorrido el flujo completo — le faltaba el paso del adjunto, que en este tenant es obligatorio. **Un "nunca" exige haber agotado el camino feliz.**

### 🟠 M-4 · `hideStock0=true` no oculta nada en el módulo PRODUCTOS

- `productService.catalogHideStock0 === true` leído en runtime, y sin embargo: **HERRAMIENTAS MANUALES 348/348 listados con 131 en `Inventario: 0`** · **CERRADURAS 109/109 con 37 en 0** · ELECTRODOS 4/4 con 1 en 0.
- **La brecha badge↔lista es CERO** ⇒ la receta de kron `badge − listados = ocultos` **no aplica acá**: el catálogo muestra el 100 % de los productos, con y sin stock.
- **Precisión importante:** esto **acota el alcance de la VG, no prueba que esté rota en toda la app**. El bloqueo de venta real lo da `stock0=false` en el selector de PEDIDOS, que es otro widget. **Medir por módulo antes de extrapolar.**
- **Severidad media-baja:** módulo de solo lectura, **sin pérdida de datos**.

### 🔴 M-5 · `PRD-BUSCADOR-NO-REPUEBLA` reconfirmado (6.ª corrida) — **y con una variante nueva**

**Defecto ya conocido y registrado (`RUNTIME §5`) ⇒ no se re-marca FAIL.** Lo nuevo es el segundo camino de limpieza:

| Acción | Resultado |
|---|---|
| Baseline (estructura recién abierta) | **50** ítems |
| `LLAVE` + Enter | **13** ✅ |
| Vaciar con Backspace + **Enter** | 🔴 **0 ítems + empty-state**, con `input.value===""` **y** `comp.searchText===""` — el mismo estado que da 50 en el baseline |
| **`button.clear-search` (X)** | 🔴 **variante NUEVA:** limpia texto y `searchText` pero **NO re-dispara la búsqueda** ⇒ la lista queda **congelada en los 13** del filtro anterior |

⇒ **Ninguno de los dos caminos devuelve la lista de la estructura.** Recuperación verificada: re-entrar a la estructura desde HOME.

### 🟡 M-6 · Se puede **Guardar una devolución sin ninguna línea de producto**

- Con el cliente seleccionado y **cero productos**: `imagenGuardar.disabled = false` (habilita al elegir cliente), el Guardar completa con alert de éxito y deja fila en `returns` con **0 filas** en `return_details`; en la lista aparece como `Nro. Ref: 0 · Guardado`.
- **Contenido:** `imagenEnviar` **sí** valida y queda en `true` ⇒ **el registro vacío no puede llegar a la nube**, y el vendedor puede borrarlo con el trash. El daño es ruido en la lista de Guardados.
- **Contraste dentro de la misma corrida:** en PEDIDOS (DM-PED-029) `imagenGuardar` **sí** queda deshabilitado hasta que hay ≥ 1 línea ⇒ **la validación existe en el producto y falta en devoluciones**.
- **Qué haría falta:** que `imagenGuardar` exija ≥ 1 línea, igual que `imagenEnviar`.

### 🟡 M-7 · El buscador de la lista de DEVOLUCIONES no encuentra por `Nro. Ref` ni por `Estatus` — justo lo que la lista muestra

| Término | Devoluciones | Inventarios (mismo build, misma corrida) |
|---|---|---|
| Cliente / código | 3 de 3 ✅ | filtra ✅ |
| **Nro. Ref** | `351` → **0** 🔴 | `52` → **1** ✅ |
| Estatus (`Guardado`) | 0 | 0 |

- Cada ítem rotula `Nro. Ref · Cliente · Estatus · Fecha`, pero el filtro **solo mira el cliente**. Con varias devoluciones del mismo cliente, filtrar por cliente **no discrimina nada**.
- **Que INVENTARIOS sí cubra la Ref prueba que no es limitación del componente ni del build**: es una diferencia de implementación entre módulos. (VISITAS se comporta como devoluciones — `2084` → 0 — pero es el mismo hallazgo, no uno nuevo.)
- **No se marca FAIL** porque DM-DEV-021 solo exige "filtra en tiempo real" y eso se cumple; **falta el oráculo** de por qué campos debe buscar. Impacto bajo hoy (3 registros), creciente en un vendedor con historial.

### 🟡 M-8 · `quPageProduct=150` no gobierna el tamaño de página de `product-list`

La VG vale `"150"` en el `Map` de configuración en runtime, pero la paginación medida avanza **de 50 en 50** (`50→100→150→200→250→300→348`, `comp.page` 0→6). **Sin pérdida de datos** (348 = badge = BD) y el corte por `ion-infinite-scroll.disabled` es correcto; el efecto es **3× más viajes de `ionInfinite`** de los configurados.

### 🟡 M-9 · `disableDaDispatch=true` no deshabilita la Fecha de Despacho — falta el oráculo

Con `orderServ.disableDaDispatch = true` medido en vivo: `Fecha Pedido` llega `disabled=true`, pero **`Fecha Despacho` llega `disabled=false`**, abre el modal y su `ion-datetime` es `disabled=false` / `readonly=false`. Además el modelo ya trae `fechaDespacho = hoy+2` mientras el botón rotula "Seleccione una fecha", y **ese valor es el que viajó a la nube** (`da_dispatch = 2026-08-20`, correcto).
**No se marca FAIL:** falta la especificación de qué debe hacer exactamente la VG (¿bloquear el control, o solo impedir que el usuario cambie el default?). 📌 **Verificar con desarrollo.**

### 🟡 M-10 · VENDEDORES: los montos del bloque *Plan* se pintan **sin formato de moneda**

`Cuota Mes: 6000 US$` y `Venta Real Mes 300407.53 US$` — sin separador de miles y con punto decimal, mientras el resto de la app usa formato es-VE con `parteDecimal=2` (`0,51 US$`, `1.258,92`, `30,60`). Lo esperado sería `300.407,53 US$`.
**El valor es correcto** — cuadra al céntimo contra BD (ver §7). Falla solo el pipe de formato de ese bloque del template. **Cosmético**, pero afecta al KPI más visible del módulo.

### 🟡 M-11 · `Cartera Clientes` muestra **1.568** con **1.569** asignaciones en BD

Brecha **constante de exactamente 1**. Se descartaron todas las hipótesis baratas: no es borrado lógico, ni suspensión (`in_suspension = false` en los 1.569), ni alta reciente sin sincronizar (0 clientes creados desde el 17/08), ni multi-empresa (todas `FERRE_N`).
**El KPI lo calcula el servidor** (`userInfo` llega armado del backend), así que el filtro exacto **no es observable desde el dispositivo** ⇒ **no se puede atribuir la causa sin ver la consulta del servidor**. Observación abierta de severidad muy baja, no defecto. **No se inventa el motivo.**

### 🔵 M-12 · El acordeón de Retención rotula `Fecha del documento` con la fecha del **comprobante de retención** (cosmético)

En el cobro `co_type=2` sobre `FACT50030222` (emitida el **22/10/2025**), el acordeón del Tab Total imprime `Fecha del documento: 2026-08-19`, que es `da_voucher` (Fecha Comp Ret). La fecha de emisión real sí sale correcta en el modal de detalle (`Fecha emisión factura: 2025-10-22`). **Es un rótulo equivocado, no un dato mal guardado**: `collection_details` guarda ambas correctamente. Hermano del hallazgo de `globalmp-20260730` en ese mismo acordeón.

### 🟡 M-13 · `clientsOrderBy="due_date"` **no gobierna el orden** de la lista de clientes

Medido en el modelo (`clientLogic.clients`), lista completa y filtrada: **`saldo1` estrictamente decreciente y `daDueDate` sin orden alguno**; al final, los clientes con saldo `0,00` por **código ascendente**. La regla observada es *"saldo ≠ 0 por saldo DESC, luego saldo 0 por código ASC"*.
**No se marca FAIL** porque ningún caso del smoke cubre el orden y **falta el oráculo** de qué debería producir el valor `due_date`: o la VG no se aplica, o `due_date` significa otra cosa. Reproduce hoy con datos vivos ⇒ pasa el gate como cosa a mirar; lo que falta es la especificación, no la evidencia. **Impacto práctico bajo** (el orden efectivo prioriza deudores, que es útil para el vendedor).

---

## 4 · Hallazgos WEB que superaron el gate

> **Gate `WEB-RUNTIME §5.a`** — mismo criterio. Y `§5.b`: lo que es **por diseño** no se juzga (ver §6).

### 🔴 W-1 · `/pages/cobros` devolvió **HTTP 500 (`StackOverflowError`)** en el primer acceso del día

```
Estado HTTP 500 – Internal Server Error
mensaje  Error creating bean with name 'collectionBean': Invocation of init method failed;
         nested exception is java.lang.StackOverflowError
   javax.servlet.ServletException  →  javax.faces.webapp.FacesServlet.service(FacesServlet.java:671)
```

- **Reproducido hoy, 2026-08-18 ≈ 19:32 UTC**, con sesión recién iniciada. **Los demás módulos cargaron bien en esa misma sesión ⇒ no es la sesión, es el bean de cobros.**
- A los ~4 min, pasando primero por `/pages/main`, la misma URL cargó normal y los 10 casos `DW-COB-F01..F10` pasaron ⇒ **es intermitente, no determinista.**
- **Impacto:** el módulo transaccional más usado queda inaccesible mientras dura.
- **Qué haría falta para cerrarlo.** Un `StackOverflowError` en la inicialización de un bean suele ser **recursión infinita al armar el árbol de datos**: conviene mirarlo aunque no reproduzca a pedido. Evidencia guardada en `web-filtros_evidencia_cobros-500.log`.
- ⚠ **No reprodujo en la 4.ª tanda web (19/08), pero el módulo no se tocó** ⇒ ni se confirma ni se desmiente. **El hallazgo sigue en pie.**

### 🟠 W-2 · Los registros de vendedores dados de baja **desaparecen del listado web — y contaminan los indicadores**

**Defecto ya conocido** (`project_pedidos_ocultos_salesman_view`, confirmado en `grupo_fiel` el 17/08) ⇒ **no es un hallazgo nuevo.** Y la QA ya dictaminó que **la invisibilidad en sí no es grave**: le preocuparía si fueran usuarios activos. Lo que esta corrida aporta —y es lo que hay que mirar— es la **aritmética exacta** y, sobre todo, **la contaminación de los importes**.

**Mecánica:** las listas se unen contra la vista de vendedores; un `users.co_operation = 'D'` excluye **todas** las transacciones de ese usuario, aunque la transacción esté vigente.

**Prueba de renglón único (pedidos, 10–12/07/2026):**

| | |
|---|---|
| BD en rango | **102** · `Σ nu_amount_total_base = 6.033.721,05` |
| Web `Total de Resultados` | **101** · `Total Base = 6.033.154,93` |
| Diferencia | **1 pedido · 566,12** = exactamente el monto del pedido `271` (usuario 534, `co_operation='D'`) |

Segunda prueba independiente (pedidos, `Tiene Adjunto = SI`, julio): BD 16 · web 15; falta el pedido `810` del usuario `516`, también de baja.

**Alcance total medido:**

| Módulo | Ocultos | Último oculto |
|---|---|---|
| Pedidos | 71 | 28/07/2026 |
| **Cobros** | **34** | **03/08/2026** ← dentro del rango por defecto |
| Visitas | 40 | 23/07/2026 |
| Devoluciones | 7 | 29/07/2026 |
| Clientes potenciales | 5 | — |
| Inventarios | 0 | — |
| **Total** | **157** | |

🔴 **Lo nuevo y lo que importa: también contamina los importes.** En cobros del mes en curso la web totaliza **5.412.686,36** contra **5.413.211,33** reales ⇒ **faltan 524,97 US$** en el indicador de cabecera. Con **20 usuarios de baja** en el tenant (uno dado de baja el propio 18/08 a las 17:32) y el registro oculto más reciente **dentro del rango por defecto**, la cartera se reasigna pero las ventas siguen siendo de la empresa: **desaparecen de reportes y de conciliación**.

**Qué haría falta para cerrarlo:** que el listado se una a la transacción por `id_user` sin exigir que el vendedor esté vigente, o al menos que los indicadores de importe no se calculen sobre el conjunto recortado.

### 🟠 W-3 · `nu_amount_total = 0` en cobros y `nu_amount_doc = 0` en depósitos — **un solo defecto de captura móvil con dos síntomas visibles en la web**

🔑 **No son dos defectos de la web.** La web **suma fielmente lo que hay guardado**; lo que hay guardado es un cero que no corresponde. Se presentan juntos porque comparten causa.

**Síntoma A — el indicador de cobros contradice la propia lista.** Filtrando `# Ref = 32969` (cobro del 17/08, dentro del rango por defecto) la pantalla queda así:

```
Cabecera:  Monto total en US$: 0,00        Total de Resultados: 1
Fila:      # Ref 32969 … Monto cobrado 1.233,36 US$ … Total por cobrar 1.233,36 US$
```

Los tres orígenes se midieron y se confirmaron con el anticipo `32974` (2 pagos, desglose `54,13 + 203,87 = 258,00`):

| Qué pinta la web | De dónde sale | En 32969 |
|---|---|---|
| Indicador `Monto total en US$` | `Σ collection.nu_amount_total` | **0,00** |
| Columna `Monto cobrado` | los **pagos** (`collection_payment`) | 1.233,36 |
| Columna `Total por cobrar` | `collection.nu_amount_final` | 1.233,36 |

**Síntoma B — el detalle del depósito se desmiente a sí mismo**, y aquí ni siquiera hace falta comparar contra BD: los dos números están en la misma página.

```
Cabecera del detalle:   Monto depositado: 0,00 US$
Tabla hija:  1 · 16/07/2026 · N° Ref cobro 30800 · NR INDUSTRIAL, C.A · Otros · Monto cobrado 266,59 US$
```

El oráculo `WEB-RUNTIME §7` (`Σ Monto cobrado de los hijos == Monto depositado`) **falla en pantalla**: 266,59 ≠ 0,00. Los 2 depósitos del tenant tienen `nu_amount_doc = 0.0000` en BD y la tabla puente `deposit_collection_payment` está **vacía** (el vínculo existe solo por `collection.id_deposit`).

**Alcance en producción (cobros) — remedido con `query.js` el 2026-08-19 al cierre:**

| | |
|---|---|
| Cobros con `nu_amount_total = 0` y `nu_amount_final > 0` | **30** — **todos de tipo normal** (`co_type=0`), sobre **1.950** cobros normales ⇒ ≈ **1,5 %** (de 2.706 en total) |
| **Vendedores distintos afectados** | **8** |
| En el rango por defecto (01–18/08), medido por el agente web | **25 de 1.026** |
| Importe invisible para el indicador (`Σ nu_amount_final` de los afectados) | **16.443,65 US$** (13.472,88 US$ solo del mes en curso) |
| Último caso | **2026-08-17 23:38** |

*(El tenant es productivo y vivo: los totales se mueven entre mediciones. Estas cifras son de la lectura de cierre del 19/08; el agente web midió `30 / 2.703` el 18/08 — mismo conjunto de afectados, el denominador es lo que creció.)*

🔴 **Aplicando el gate con honestidad: la causa raíz NO reproduce.** Los **4 cobros creados hoy** traen `nu_amount_total` poblado y coincidente con `nu_amount_final` (`123,17/123,17` · `10/10` · `5/5` · `3/3`), y el único cobro pre-existente del usuario QA en nube (Ref 32993) trae `227,00` con `nu_amount_final 227,48` ⇒ **poblado**. El desechable trajo `0/0`, que es **correcto** porque no tenía documentos ni pagos.
⇒ **No es una regresión de esta release.** Baja a **observación sobre datos históricos**, con dos acotaciones que hay que decir en voz alta:

1. Los 4 registros quedaron **Guardados, no enviados** ⇒ la comprobación es sobre el valor que la app **calcula y persiste localmente**, que es exactamente el que viaja en el payload. **La confirmación definitiva llega cuando la QA envíe uno y se relea `collection.nu_amount_total` en nube.**
2. En depósitos **no se pudo reproducir sobre un registro de hoy porque no hay depósitos nuevos** (el módulo quedó fuera de la corrida móvil, ver §2).

**Lo que sí supera el gate y es de la web** es que **la pantalla se contradiga a sí misma**: 25 de las 1.026 filas del rango vigente aportan 0 al total de cabecera mostrando importe en su fila, y el detalle del depósito ofrece como "Monto depositado" un número que desmiente la tabla que él mismo está dibujando. **La web no recalcula el total desde los hijos que pinta.**

**Qué haría falta para cerrarlo:** (a) que la app no grabe `nu_amount_total = 0` en un cobro con pagos —y análogamente `nu_amount_doc` en depósitos—; (b) que la web no titule "Monto total" a algo que contradice la columna de al lado.

### 🟡 W-4 · La columna `N°` vale **`1` en todas las filas** — en `detalleInventario` **y** en `detalleVisita`

```
detalleInventario (inventario 53, creado HOY)     detalleVisita (visita 2050, 2 actividades)
1  CDR002 …                                        1  NO COMPRO  OTROS  crédito
1  CDR001 …                                        1  NO COMPRO  OTROS  va a cabcelar la nota …
1  ABS02  …
1  ABS01  …
```

- **Contraste que lo prueba:** `detallePedido` numeró **1..53** sin fallo (pedido 2808) y `detalleDevolucion` numeró **1..11** (devolución 331). **La web sabe numerar**; son estas dos pantallas las que no.
- **Sistemático, no puntual:** también sale `1,1,1` en el inventario **22** (registro viejo). **Reproduce hoy** en el inventario **53** creado por la corrida.
- **Causa probable:** el `N°` se toma del índice de la **unidad** dentro del detalle (`client_stock_detail_unit`, siempre 1 por producto en este tenant) en vez del índice del producto.
- ⚠ En visitas el síntoma solo se puede exhibir con el registro del 17/08 (ninguna visita de hoy tiene más de una incidencia), pero **la causa es compartida con inventarios, que sí reproduce hoy**.
- **Severidad baja, cosmético** — no altera cantidades ni actividades. Se reporta junto **para que el arreglo cubra las dos pantallas**.

### 🟡 W-5 · Códigos crudos donde el nombre está disponible

| Dónde | Muestra | Lo que hay | Prueba de que la web sabe resolverlo |
|---|---|---|---|
| `/pages/devoluciones` — `Devolución en` | `1` | `return_detail.co_measure_unit='1'` con **`na_measure_unit='UNIDADES'`** en la misma fila | `detalleInventario` **sí** usa el nombre (`2.00 UNIDADES`) |
| `/pages/depositos` — columna y campo `Banco:` | `006` | `bank.na_bank = 'BANCARIBE'` | — |
| `/pages/cobros` — columna `Pagos` | `ot: …` | `payment_method.na_method = 'Otros'` | 🔑 **el detalle del mismo cobro rotula `Forma de pago: Otros`** |

El tercero es el más claro: **la misma transacción se rotula con el código en la lista y con el nombre en el detalle** — no hay ambigüedad de diseño posible entre dos pantallas del mismo registro.
⚠ **Reserva honesta:** en `Devolución en` **no hay oráculo escrito** de qué debe mostrar esa columna; si el diseño pretendía el código, no es defecto. **Confirmar la intención con Desarrollo.** Los **485** registros de `return_detail` del tenant tienen la misma unidad ⇒ el usuario siempre ve `1`.
⚠ En depósitos solo hay 2 registros, de julio: **no hay registro de hoy con el que exhibirlo**. El caso de cobros **sí reproduce hoy** (cobro 32992, 18/08).

### 🟡 W-6 · El **lote** capturado por la app no se muestra en ninguna parte del detalle de inventario

- `detalleInventario` renderiza **6 columnas** (`N° · Cod. producto · Producto · Estructura · Depósito · Exhibición`). **No existen `Lote` ni `Fecha expiración`** — verificado en el DOM: no están ocultas por CSS, **no se generan** (6 `th` en total, `toggler` ausente). `web-selectors/_comunes.md` documenta esas dos columnas para esta pantalla ⇒ **este build no las pinta**.
- **El dato existe y es de hoy:** el inventario **53** trae `client_stock_detail_unit.nu_batch = 'QA-INV-0818'` para `TM01`. Es **el único lote de todo el tenant** (1 de 426 unidades) y **es invisible en la web**.
- ⚠ **Reserva honesta:** con `expirationBatch = false` ocultar esas columnas **puede ser intencional**. Lo que no encaja es que **la app permita capturar un lote que después no se puede consultar en ningún lado**. Confirmar la intención con Desarrollo.
- **Severidad baja en este tenant (1 lote); sería alta en un tenant que use lotes de verdad.**

---

## 5 · Riesgos abiertos — mecanismo probado, **NO confirmados end-to-end**

### 🟠 R-1 · `txAddress` / `txAddressDispatch` sin `maxlength` contra `varchar(150)`

**Misma causa que M-1**, y por eso se levanta: en el formulario de **cliente potencial**, los campos **Dirección** y **Dirección de entrega** **no declaran ningún `maxlength`** — entrada ilimitada — contra columnas `varchar(150)`.

- **Todavía no ha mordido:** de **188** clientes potenciales en producción, el máximo es **136 de 150** y **ninguno** está exactamente en 150 (que sería la firma del truncamiento).
- 🔴 **No se provocó a propósito** para no dejar basura en un tenant productivo. ⇒ **Se declara como riesgo, no como defecto.**
- El campo *Observación* del mismo formulario **sí** está acotado (255) y su columna es `text` ⇒ ahí no hay riesgo.
- 📌 Vale la pena corregirlo junto con el de visitas: es la misma causa y está **a 14 caracteres de ocurrir**.
- 📌 **Chequeo pendiente antes de cerrar la release:** el mismo desfase 255-vs-columna puede existir en los `tx_comment` de PEDIDOS, DEVOLUCIONES e INVENTARIOS. En esta corrida **no reprodujo porque los comentarios que se cargaron eran cortos**, no porque esté descartado.

### 🟠 R-2 · `requeridedNroFactura=true` obliga a llenar el Nro. de factura pero **NO lo valida**

- Se cargó `NOEXISTE-ZZZ999`: **ningún alert**, `ng-invalid = false`, y Guardar/Enviar siguen habilitables. El campo es **texto libre**: obligatorio en presencia, **no cotejado** contra `document_sale`.
- **2.ª confirmación (tras kron), ahora con `multiInvoices` activo** ⇒ el riesgo **se multiplica por línea**: una devolución puede cerrar N facturas y **ninguna** de las N está verificada.
- Confirmado desde la web con datos reales: la devolución **331** trae `N° Factura` = `001`, `002`, `003`, `0001` — texto libre en producción.
- **Se mantiene el criterio de kron: no se reporta como defecto** (es el diseño con `validateReturn=false`), pero queda como **riesgo de calidad de dato a confirmar con desarrollo**, ahora con evidencia de que escala con la VG nueva. *(Se corrigió a `FACT6855` antes de guardar: ninguna factura inventada llegó a la nube desde la corrida.)*

### 🟠 R-3 · Pagos cargados en **bolívares dentro de cobros en US$** (tenant mono-moneda)

El cobro `32455` muestra `Monto cobrado 675.556,52 US$` sobre un documento de 1.114,72 US$, con una `Diferencia cobro` de **674.441,80**. **Los tres números están así en BD** ⇒ la web es fiel. Son **5 cobros del usuario 488**. También aparece `Total Monto a pagar conversión: 349,76` con `Tasa de conversión: 0,00` en el cobro 32689, con `nu_value_local = 0`.
**No es defecto de la web ni de la release**, pero **contamina toda la conciliación** y merece una validación de rango en la app.

### 🟡 R-4 · `VIS-INCIDENCIA-HUERFANA` — 4.ª confirmación (3 playas, 4 clientes)

Al borrar una visita Guardada, la fila sale de `visits` (UI y tabla ✅) pero **su fila de `incidences` sobrevive**. Impacto: **basura acumulativa en la BD LOCAL**; la nube no se ve afectada (la visita nunca llegó al servidor). 📋 Candidato ya abierto que gestiona el orquestador — **no se tipifica aquí**.

---

## 6 · Observaciones descartadas — y por qué

> Esta sección es tan importante como la anterior. Cada línea es algo que **parecía** defecto y **se cayó al medirlo**. Se dejan escritas para que nadie las vuelva a levantar.

### 6.1 · Descartadas por el gate (solo fallan en datos viejos, o no reproducen)

| Observación | Por qué NO entra |
|---|---|
| **`nu_amount_total = 0` / `nu_amount_doc = 0` como defecto de la release** | 🔴 **No reproduce.** Los 4 cobros nuevos traen el campo poblado y coincidente con `nu_amount_final`; el último caso afectado es del **17/08**. Baja a observación histórica (ver W-3 para el alcance y las dos acotaciones honestas). |
| **H-1 conocido: `Crédito Disp.` con monedas cruzadas** | 🚫 **N/A ESTRUCTURAL, con medición**: el tenant es mono-moneda (`hardCurrency=""`), el detalle pinta dos líneas **ambas en US$**, y `availableCreditConversion` / `nuCreditLimitConversion` llegan como **cadena vacía** — justo el campo donde vivía el defecto en kron. La aritmética de la única línea cuadra contra BD. **No puede reproducir por ausencia de conversión, no por estar corregido.** |
| **«El filtro Status de pedidos devuelve 7 y BD dice 28»** | **Error del ORÁCULO, no de la web.** Se ordenaba el historial por `da_transaction_statuses`; con el orden correcto (`id_transaction_statuses DESC`) BD da 7 y **la web tenía razón**. Fue la trampa de BD más cara de la corrida. |
| **«El filtro Actividad de visitas devuelve 73 y BD dice 317»** | **Artefacto de automatización:** el combo `Coordenadas` había quedado en `Fuera de Rango`. La intersección real (act. 85 ∧ coord. 4) es exactamente **73**. Con el combo limpio: 317 = 317. |
| **«`/pages/clientesPotenciales` devuelve 0 para el 17/08 habiendo 6 en BD»** | **Artefacto de automatización:** el combo Vendedor seguía en `470` del lado del servidor, arrastrado de una tanda anterior, y **sobrevivió a un `browser_navigate` fresco**. Con el combo en su placeholder: **6 = 6**. |
| **«El defecto conocido `Monto total en USD = 0,00` de pedidos»** | **Ese indicador NO EXISTE en este build.** `/pages/pedidos` expone `Total Base · Total Descuentos · Total IVA · Monto Total`, y **los cuatro cuadran exacto** contra BD. `WEB-N/A`: ni se confirma ni se desmiente. |
| **«Los indicadores de depósitos en `0,00` son un error de la web»** | **Reencuadrado:** la web muestra fielmente `deposit.nu_amount_doc = 0.0000`. El defecto es de captura móvil/servicio, no de render (ver W-3). |
| **«Las líneas de la devolución 351 salen en orden inverso al capturado en el móvil»** | **Sin oráculo de orden.** La numeración `N°` es coherente con lo dibujado y los datos son exactos. Observación, no hallazgo. |
| **El defecto cosmético de «+4 h al reabrir» de `[gmp-20260730]`** | **No reproduce en este build:** guardada con `da_visit = 17:18:05`, la UI rotula `5:18 p. m.` ✅. El modelo trae UTC pero **el render corrige**. |
| **`PRD-LISTA-CORTA-CATALOGO`** | **No reproduce:** cero brecha badge↔lista en 4 estructuras (348/348, 109/109, 4/4) y **Σ 36 badges = 1.649 = catálogo completo**. |
| **`PRD-BUSCADOR-NO-REPUEBLA` fuera de PRODUCTOS** | **No es universal** — 4.ª acotación: clientes, pedidos, devoluciones, visitas y cobros **sí repueblan** al vaciar el buscador. Es exclusivo de PRODUCTOS. |

### 6.2 · Comportamientos POR DISEÑO — dictamen de la QA, no son defectos

| Observación | Dictamen |
|---|---|
| `Monto cobrado` de la lista de cobros «trae varias cifras» | Es un **desglose por método de pago**, no un total. Confirmado con el anticipo `32974`: `54,13 + 203,87 = 258,00` = `nu_amount_total`. |
| En **retenciones** las columnas `Pagos` / `Monto cobrado` salen vacías y la tabla de pagos dice «No se encontraron registros» | **En retenciones no se agrega método de pago** ⇒ celda vacía **por diseño**. |
| «El rango de fechas por defecto esconde registros» | El rango por defecto **acota la lista al mes en curso**, por diseño. |
| Columna `Vendedor` de clientes potenciales muestra solo `000208` | **Por diseño** (`WEB-RUNTIME §5.b`) — solo el primer token. |
| `Geo = "Fuera de Rango"` / `"Falta Coordenada (Sucursal)"` | Clasificación que **calcula la web contra la coordenada de la sucursal**. Por diseño. |
| «El `IVA :` del pie de `detallePedido` sale vacío» y `Base == Total` | **Coherente y declarado en el perfil:** `order_detail.iva = 0.0000` y `nu_amount_tax = 0` **leídos en cada línea**; `userCanSelectIVA = false`. El oráculo `Base × (1+IVA) == Total` **se cumple con IVA = 0**. Patrón uniforme "sin valor ⇒ celda vacía", el mismo criterio ya aceptado para las retenciones. 🚫 **NO se reporta "el IVA no se calcula".** |
| «`nu_value_local = 0` y los `*_conversion` en 0 en los pedidos» | La moneda del pedido **YA ES** la de conversión (US$) ⇒ **no es dato faltante**. |
| «Se puede Enviar sin firma teniendo `signature*=true`» | La VG **habilita la función, no la vuelve obligatoria** (aclarado por QA el 2026-07-29). Reconfirmado en pedidos, devoluciones, inventarios y visitas. |
| «La `Firma:` sale vacía en los detalles web» | **Artefacto del lector:** `innerText` no ve imágenes. En los 5 registros con firma el `<img id="form:graImaPro">` está **cargado y visible**. Y donde el `<img>` **no existe en el DOM** es porque **no hay firma que mostrar** (`transaction_signatures` tiene 5 filas en todo el tenant, cero de cobros). |
| «El visor de adjuntos no muestra el PDF/XLSX» | El visor es una **galería de imágenes**; el documento existe y responde **200** en `/denario/resources/**files**/…`. La vía de usuario es `Descargar adjuntos` (ZIP), que no se ejerció por política de no descargar productivos. |
| «`clientesPotenciales` no muestra `No. de Ref.` en el detalle» | **Limitación conocida y documentada**; la llave del detalle es el epoch, y coincide. |
| «`Fecha Iniciada` vacía en visitas» | **Local-driven:** el móvil no informó el campo ⇒ se saltea (`WEB-RUNTIME §6`). |
| «La columna `Pagos` de cobros muestra basura (`Tasa: Bs Referencia: AC: Días de crédito: XX \| Descuento: XX%`)» | **Es texto que tecleó el vendedor.** `collection_payment.nu_payment_doc` del cobro 32992 contiene esa cadena **literal, plantilla sin rellenar incluida**. La web la imprime tal cual. Verificado carácter a carácter contra BD. |
| «El saldo del cliente `006831` es −22,50 y el perfil decía 1.258,92» | **La app tiene razón y el perfil medía otra cosa.** La app pinta el **neto** y coincide **al céntimo** con `Σ document_sale.nu_balance` (129 documentos, 116 notas de crédito). El `1.258,92` salía de filtrar `nu_balance > 0` ignorando las notas de crédito, que la propia UI reconoce con la leyenda **"A favor"**. |
| «`006831` tiene 128 documentos vencidos y NO sale la alerta de deuda vencida» | **Correcto por diseño.** La condición leída del componente es `(saldo1+saldo2) > 0` **Y** `countDueDate > 0`: con saldo neto **−22,50** falla la primera. Para ejercer esa rama hay que usar **`006540`** (404,64 positivo, 3 vencidos), y ahí **sí dispara**. |
| «El detalle ofrece 1 sola lista de precio teniendo la nube 2» | Coherente con `userCanChangePriceList=false`; los precios de la lista `05` **no bajan al device**. `ELE01` muestra 3,80 US$ = precio de su lista asignada. |
| «`Tipo de Pedido: PEDIDO ESTANDAR` en el detalle web con `selectOrderType=false`» | **No es contradicción:** la VG gobierna si el vendedor **elige**, no si el pedido tiene tipo. `id_order_type = 1` se resuelve solo y viaja correcto. |
| «El botón Pedido Sugerido no aparece / aparece sin cantidades» | 🚫 **N/A por DATOS, medido en el insumo**: `client_avg_product` = 24 filas de 2 clientes, **0 para `006831`**. Sin promedio no hay sugerido. Evita levantar el mismo falso hallazgo por 11.ª vez. |
| «`Guardar` habilita con el formulario casi vacío en inventarios» | El **envío sí valida** y el registro vacío no puede llegar a la nube. Ya documentado en 2 corridas. *(En devoluciones sí se levanta — M-6 — porque allí el contraste con pedidos es directo.)* |
| «`maxlength` real 255 contra `longitudComentario = 250`» | Patrón conocido en 4 módulos y en kron: **el tope lo fija la constante de producto, no la VG**. Sin oráculo ⇒ no es incumplimiento. *(Se subsume en M-1, donde sí importa.)* |
| «Los `st_*` locales no coinciden con los de la nube» | **Dominios distintos, no mismatch** (`RUNTIME §10`). Medidos los tres valores de `st_potential_client`: local `0`=Guardado / `2`=Enviado · nube `1`=Enviado. |
| «La hora local difiere de la de la nube» | **Nota de zona horaria** (`§10.b`), device en UTC−4: mismos minutos y segundos. |

---

## 7 · Lo que este cliente aportó — VGs y casos que ningún tenant anterior pudo probar

| Aporte | Resultado medido |
|---|---|
| 🟢 **`multiInvoices = true`** — varias facturas en una devolución | **Funciona end-to-end.** La devolución **Ref 351** cerró **dos facturas reales distintas** del mismo cliente en un solo registro (`FACT6855` en `LLA-01`×2 y `FACT6561` en `TM01`×3), con `co_document` distinto por `return_detail` y `coInvoice` de cabecera en `null`. **La web muestra las dos**, 2/2 exactas contra `return_detail`. ⚠ **La VG no es legible desde el modelo**: no existe como propiedad de `returnLogic`; su oráculo es `bloquearFactura === false` + el comportamiento del 2.º acordeón. |
| 🟢 **`productMinMul = true`** — mínimo y múltiplo de venta | **Valida y AUTO-CORRIGE**, no rechaza: `5 → 20`, `30 → 40`, `1 → 10`, con un único mensaje para ambas violaciones. **El valor corregido es el que viaja a la nube** (`qu_order = 60` y `50` en el pedido 2820). ⚠ Las etiquetas `Mínimo:`/`Múltiplo:` se renderizan **POR PRODUCTO**: `GU01` no las trae ⇒ **no leer su ausencia como "la VG no rinde"**. La VG habilita la función; **el dato la activa**. Rotulado verificado en lista y en detalle. |
| 🟢 **`expirationBatch = false`** — **primer contrafactual medido** | Se guardó con el **lote VACÍO**, el modal cerró **sin ninguna alerta de validación**, y la nube guardó `nu_batch = ''` con `da_expiration` = hoy. En `el_palmar` / `grupo_fiel` / `kron`, con la VG en `true`, el lote **bloqueaba**. ⇒ **La regla graduada en `RUNTIME §3` queda cerrada por el otro lado: la VG discrimina de verdad, no es cosmética.** Cuando el lote sí se llena (`TM01` → `QA-INV-0818`), también cuadra. |
| ✅ **Mismo producto en 2 ubicaciones** en un inventario | `LLA-01` **exh 7 + dep 3** en el mismo registro. **No se fusionan en ninguna de las 5 capas** (modal vacío al reabrir desde la otra ubicación · rótulo `Inventariado: Exhibición / Depósito` · tabla del Resumen con 2 columnas · 2 filas en local · 2 filas en nube). 🔑 Las dos unidades comparten `co_product_unit = 'LLA-011'` y solo se distinguen por su PK — **exactamente la colisión que rompía el motor**. `cotejo-payload.js` devolvió **`BD-FIELD-OK`, 0 mismatches** ⇒ **2.º caso real que valida el arreglo** (tras kron), ahora con 3 unidades y 2 detalles. **La web tampoco los fusiona** (verificado por dos agentes independientes). |
| ✅ **El fix del rutero de adjuntos queda CERRADO** | `clientesPotenciales` era **el último módulo sin muestra posterior al fix**. El registro **193** lo cierra: **19/19 recursos en `200`** (9 imágenes + 4 PDF + 1 XLSX + 5 firmas) en los **5 módulos**, con el `content-type` correcto, el visor abriendo en los 5 y las imágenes pintando de verdad (`naturalWidth 720 × 1600`). 🔴 **`localhost:8282` no aparece en ninguna parte.** Con **dos controles negativos** en la misma tanda: contexto `/DenarioPremium` → **404**, y archivo inexistente → **404 `text/html`** ⇒ el servidor 404 de verdad, no devuelve HTML con 200. |
| ✅ **Paginación real de PRODUCTOS** | Primera corrida de la serie que la ejerce de verdad: **348 productos en 7 páginas**, con `ion-infinite-scroll.disabled` como oráculo de agotamiento. `modelo === dom === 348 === badge`. |
| ✅ **`planesCuotaEmpresa` poblado** | Primera corrida con **2 planes de cuota** (US$ y BULTOS) y el bloque *Cuota Mes / Venta Real Mes* renderizado ⇒ **confirma que en kron y el_palmar la ausencia era por DATO, no por template.** Y `Venta Real Mes 300.407,53 US$` cuadra **al céntimo** con `Σ nu_amount_total` de los 55 pedidos de agosto del `id_user 470`. |
| ✅ **Cotejo web de un tenant productivo con volumen** | 12 registros de 7 módulos muestreados con formas que no existían en tenants anteriores: cobro con **nota de crédito** (se pinta en negativo y entra en el subtotal ✅), **retención con IVA + ISLR a la vez**, **anticipo con 2 pagos**, pedido de **53 líneas** (numeradas 1..53, sin paginador, `Σ = 26.640,83` exacta), devolución de **11 líneas / 4 facturas**. |

---

## 8 · Correcciones de criterio que quedan registradas

| # | Corrección | Evidencia |
|---|---|---|
| 1 | ✅ **Al resolver los dos dumps de config, gana el GLOBAL — aunque el override del cliente sea más reciente.** `da_update` **NO es criterio de precedencia.** | `validateWarehouses` lo desempató: override `false` del **2026-02-10** vs global `true` del **2025-10-13**, y `orderServ.validateWarehouses` en el dispositivo devuelve **`true`**. Coherente con que la UI sí muestra almacenes e inventario en la toma de pedido. **Refuerzo independiente:** el `Map` de 176 VGs que la app carga en runtime **trae solo las claves del dump GLOBAL** — las 10 exclusivas del override (`listProductsBy`, `showProductByGrid`, `setQuUnit1`, …) **ni siquiera llegan al dispositivo**. ⇒ La regla anterior («gana el `da_update` más reciente») solo se había validado en casos donde global y reciente coincidían. **Solo las claves que existen ÚNICAMENTE en el override se toman de ahí.** |
| 2 | ✅ **`requiredComment` aplica SOLO a cobros** — pendiente CERRADO con la serie completa de 6 módulos | CLIENTES **N/A estructural** (no hay campo) · PEDIDOS **NO** (`requiredCommentOrder=false` manda) · DEVOLUCIONES **NO** · INVENTARIOS **NO** (la UI rotula sola *"Mín. 0 - Máx. 255 caracteres"*) · VISITAS **NO** (`required=false`, evento agregado con el campo vacío) · **COBROS SÍ** (`required=true`, `ion-invalid`, literal **"¡Campo Obligatorio!"**, las 4 tabs y Guardar/Enviar bloqueados hasta llenarlo). **2.ª confirmación del patrón de `grupo_fiel`, ahora en otro tenant y otra playa.** |
| 3 | ✅ **IGTF: `userCanSelectIGTF=false` MANDA sobre `igtfDefault=true`, que queda inerte** (2.ª confirmación) | Medido en el modelo vivo y en pantalla: **sin botón IGTF** en el menú, **0 menciones** de IGTF en Tab Documentos ni Tab Total, `montoIgtf=0`. ⇒ **El par `igtfDefault`/`disableCheckIGTF` no debe marcarse ⚠️VERIFICAR en los YAML mientras `userCanSelectIGTF=false`.** |
| 4 | ✅ **Tasa: N/A ESTRUCTURAL por tenant mono-moneda — el control NO existe** | `app-cobro-general` tiene exactamente **2 `ion-select`** (Empresa `disabled` y Moneda `disabled=false` con **1 sola opción `US$`**); **no hay 3.er select de tasa**, **no existe `#manualRateInput`**, y el único `ion-button` del tab es **"Fecha Cobro"**. ⇒ `canChangeRate=true` y `mesesTasa=3` son **inoperantes** sin moneda alterna. Coherente con PEDIDOS, donde tampoco existe `#tasa`. |
| 5 | ✅ **El defecto H-1 de crédito con monedas cruzadas NO aplica: es N/A estructural** | `hardCurrency = ""`, `multiCurrency=false`, y `availableCreditConversion` / `nuCreditLimitConversion` llegan **como cadena vacía**. **No existe el par BS/USD** que el defecto necesita para cruzarse. |
| 6 | ✅ **Mis propias cifras de saldo del perfil estaban mal** | El perfil contaba solo `nu_balance > 0`. Medido completo, `006831` tiene **129 documentos** y saldo **NETO −22,50** (116 notas de crédito). **La app tiene razón; el perfil medía otra cosa.** Corregido en el YAML. |
| 7 | ✅ **`clientsOrderBy="due_date"` NO gobierna el orden de la lista** | Observación abierta (M-13), no defecto. |
| 8 | ✅ **`listProductsBy="lineas"` no nombra el tipo de estructura** | El selector ofrece **`Marca` / `Sub-Linea`**, y la VG **ni siquiera llega al dispositivo** (es solo-override). Confirma kron con evidencia más fuerte. |
| 9 | ✅ **`esVendedor = true`** — pendiente cerrado por el oráculo de UI (módulo visible + `<h1>Vendedor</h1>` + KPIs reales cotejados contra BD). La VG no está en los dumps, ni en el componente, ni en el `Map` de 176. **Sigue sin aparecer un solo cliente con `esVendedor=false`** en 12 corridas. |
| 10 | ✅ **`rolPlanta=true` habilita algo, pero solo en el modelo** | `app-visita` expone `rolTransportista`, `estadoDespacho`, `observacionDespacho`, `showReagendarModal`… **ninguno se renderiza** con `transportRole=false`. Y explica el recorte del catálogo: **el dispositivo filtra también por ROL, no solo por `co_operation='D'`** (nube 14 activas → device **11**; las 3 ausentes son las de `required_signature=true`, todas de despacho). ⇒ **Contar el catálogo en la tabla LOCAL (`incidence_types`), nunca en la nube.** |
| 11 | ✅ **La playa NO se confirma con `http://localhost/home`** | Es el webview local que sirve Capacitor, idéntico en todas las playas y todos los clientes. **La playa solo se confirma desde el host de un POST real.** Un agente lo usó como prueba y hubo que retirarlo. |
| 12 | ✅ **`mouse.click` en el header del acordeón SÍ expande en este build** | Corrige 6 corridas previas que lo daban por anti-patrón universal. La vía programática sigue siendo la recomendada por determinista, pero **un click que expande ya no debe leerse como "no pasó nada"**. |
| 13 | ✅ **El estatus vigente de una transacción se resuelve por `id_transaction_statuses DESC`, NUNCA por fecha** | Contraejemplo medido: el pedido 2817 tiene una fila posterior con fecha anterior. Ordenar por fecha daba 28 «Enviado» donde la web mostraba 7 — **y la web tenía razón**. |

---

## 9 · Pendientes y próximos pasos

### 🔴 Acción inmediata de la QA

1. **Enviar a mano los 4 cobros que quedaron en Guardado**, adjuntando la foto. Ruta: HOME → Cobros → **BUSCAR** → abrir el ítem → Tab **Adjuntos** → acordeón **Imágenes** → TOMAR/BUSCAR FOTO → **Enviar**.

   | # | `co_collection` | Tipo | Cliente | Documento | Monto | Qué lleva cargado |
   |---|---|---|---|---|---|---|
   | 1 | `1787144733832.0` | Cobro (`co_type=0`) | `006540` MARIBEL HAMMANI | `FACT50039415` | **123,17 US$** | Retención por documento (comp. `12345678901234`, IVA 5,00 + ISLR 3,00) · Efectivo `REC-COB-001` · Diferencia 0,00 |
   | 2 | `1787145447779.0` | Cobro (`co_type=0`) | `006540` | `FACT50009688` | **10,00 US$** | **Pago parcial** (10,00 sobre 14,97) · Depósito `DEL SUR - 01570042473742206372`, planilla `9988776655` |
   | 3 | `1787145827101.0` | **Anticipo** (`co_type=1`) | `005354` GENESIS CASTILLO | — | **5,00 US$** | Efectivo `REC-ANT-001` · 0 documentos, 1 pago |
   | 4 | `1787145921638.0` | **Retención** (`co_type=2`) | `006540` | `FACT50030222` | **3,00 US$** | Comp. `98765432109876`, IVA 2,00 + ISLR 1,00 · 1 documento, **0 pagos** (por diseño) |

   ⚠ **Al enviarlos, releer `collection.nu_amount_total` en nube**: es lo que cierra definitivamente la acotación de W-3.

2. **Correr DEPÓSITOS** una vez enviados ≥ 2 cobros **en efectivo** (con uno solo no se pueden cubrir Enviar Y borrar).

### 🟠 Pendiente de producto ya identificado

3. 🔴 **Backfill de los ~20 archivos de adjunto anteriores al fix del rutero.** El fix del 17/08 (~15:37 UTC) sirve **solo a registros nuevos** — esta corrida lo confirmó con 19/19 en `200` sobre registros posteriores al fix. **Los archivos previos siguen en 404** y **eso es lo único que queda abierto del hilo de adjuntos.**

### 📋 A verificar con Desarrollo (falta el oráculo, no la evidencia)

4. `disableDaDispatch` — ¿debe bloquear el control o solo impedir que el usuario cambie el default? (M-9)
5. `clientsOrderBy = "due_date"` — ¿la VG no se aplica, o `due_date` significa otra cosa? (M-13)
6. `Devolución en` en la web — ¿debe mostrar el código o el nombre de la unidad? (W-5)
7. `Lote`/`Fecha expiración` en `detalleInventario` — ¿ocultarlas con `expirationBatch=false` es intencional? Si lo es, ¿por qué la app deja capturar un lote que después no se puede consultar? (W-6)
8. `userCanAddRetention=false` **no impidió cargar retención**: la funcionalidad está completa y el Tab Total del cobro tipo Retención muestra un botón "AGREGAR RETENCIÓN". **La VG parece gobernar otra cosa** (probablemente la variante `dynamicRetentions`). No se marcó N/A por esa VG porque la pantalla se abrió y la funcionalidad está presente.
9. **Los 4 documentos tipo `AJPM` de `006540`** (635,20 US$ cobrables en nube) **no se listan** en el Tab Documentos del cobro — solo los 11 `FACT`. No hay oráculo en el smoke sobre qué tipos de documento son cobrables desde el móvil. ¿`AJPM` es un tipo excluido por diseño?
10. **El criterio de `nu_attachments` no es homogéneo entre módulos:** en 4 de 5 excluye la firma, pero en **clientes potenciales la incluye** (`4 = 2+1+1`). No afecta a la web, pero **invalida cualquier oráculo que lo use de forma uniforme**. Conviene unificarlo del lado del servicio.
11. **Chequear `character_maximum_length` de los `tx_comment`** de `order`, `return` y `client_stock` antes de cerrar la release: el desfase de M-1 puede existir ahí y en esta corrida **no reprodujo porque los comentarios cargados eran cortos**, no porque esté descartado.

### 📋 Higiene de proceso

12. **No volver a marcar un registro como "evidencia viva" sin dejarlo fuera del alcance del siguiente agente.** El registro atascado de M-1 se reenvió durante la ventana en que dos agentes tocaban el mismo dispositivo, y se perdió el caso reproducible.
13. **Borrar el bloque `# Cliente: run` duplicado** de `secrets/qa-credentials.env` (líneas 25 y 70; se comparó por huella y son idénticos, así que el duplicado es inofensivo, pero conviene que nadie edite el equivocado).
14. **No fijar cifras de documentos por cliente en el YAML.** Los datos del tenant se movieron mucho entre el 18 y el 19/08: `007554` 44 → **60** docs (22.787,73 → **31.832,98**), `006831` 13 → **45** FACT, `006510` 7 → **20** (3.085,67 → **4.124,41**). **Descubrirlas en runtime.**
15. **Todo agregado web hay que medirlo contra una BD leída en el mismo minuto.** F## midió `1025 / 5.412.686,36` a las 20:35 y M## `1026 / 5.412.913,36` a las 21:17: la diferencia es el cobro `32993`, creado entre ambas mediciones — **no un descuadre**.
16. **`Mapa de Activación`** (`form:j_idt115:botonMapa`, barra de filtros de `/pages/pedidos`) — control no documentado, no se pulsó. Propuesto para el **guión web extendido**.

---

## 10 · Veredicto

**La release se comporta correctamente en el camino feliz de los 9 módulos móviles y de los 7 módulos web.** Los 6 registros que la corrida creó y envió llegaron completos a la nube, cuadraron campo a campo (`BD-FIELD-OK`, 0 mismatches) y se ven íntegros y con los cálculos correctos en la web (`WEB-OK`, 6/6). Los dos casos delicados que este tenant permitía probar por primera vez —**varias facturas en una devolución** y **el mismo producto en dos ubicaciones**— **funcionan de punta a punta**, y el fix del rutero de adjuntos **queda cerrado con 19/19 recursos en `200`**.

**Lo que hay que atender, por orden:**

1. 🔴 **`incidence.tx_description varchar(120)` contra un input de 255** — pérdida silenciosa de datos de campo, con 8 comentarios de vendedores ya truncados en producción y confirmación manual de la QA. *(Ver la incidencia dedicada.)*
2. 🔴 **`collectionBean` / `StackOverflowError`** — deja el módulo de cobros caído de forma intermitente.
3. 🟠 **La guarda de GPS sin indicador útil** — hasta ~87 s de espera muda, con tres variantes de indicador distintas en el mismo build.
4. 🟠 **El botón Guardar del cobro que se apaga y no vuelve** — y en este tenant guardar borradores es el flujo normal.
5. 🟠 **La exclusión por vendedor de baja contaminando los indicadores** — 524,97 US$ que faltan en el total del mes en curso.
6. 🟠 **`nu_amount_total = 0` / `nu_amount_doc = 0`** — 16.443,65 US$ invisibles para el indicador y un detalle de depósito que se desmiente a sí mismo en pantalla. **No reproduce en registros nuevos** ⇒ observación, no regresión, **hasta que la QA envíe uno de los 4 cobros y lo confirme.**

---

*Consolidado de cierre · corrida `smoke_run_vzla_20260818_152824` · oráculo BD `run_vzla` · Claude Code*

---
---

# ADENDA — Cierre real del 2026-08-19 (posterior a la consolidación)

> Este consolidado se escribió **mientras la QA enviaba a mano los 4 cobros**, así que su cuerpo quedó
> desfasado en dos puntos: declaraba depósitos como "no corrido" y listaba "enviar los cobros" como pendiente.
> **Ambos se resolvieron el mismo día.** Todo lo de abajo es posterior y **manda sobre el cuerpo**.

## Cifras finales

| | Casos | PASS | N/A | FAIL | SKIP |
|---|---|---|---|---|---|
| Móvil (**10 módulos**) | **144** | 121 | 20 | **2** | 1 |
| Web (**6 tandas**) | **152** | — | — | **3** | — |
| **Total** | **296** | | | **5** | |

Manifiesto BD: **21 registros**. Módulos móviles: **los 10** (depósitos incluido).

## 1 · Los cobros llegaron — dos defectos se cierran

La QA envió los 4 cobros a mano el 19/08. Llegaron como **32994-32997**, los cuatro con **`nu_amount_total`
poblado y coincidente** con `nu_amount_final` (123,17 / 10,00 / 5,00 / 3,00) y con **3-4 adjuntos cada uno**.
Cotejo web **4/4 `WEB-OK`**, adjuntos **15/15 en HTTP 200**, y el indicador de cabecera **sí los cuenta**.

⇒ 🟢 **`collection.nu_amount_total = 0` NO REPRODUCE — defecto cerrado para la versión actual.** Quedan 31
registros históricos (30 de `co_type=0` por **16.443,65 US$**, último el **17/08**) que el indicador no cuenta.
**Observación histórica, no regresión.**

⇒ 🟢 **`deposit.nu_amount_doc = 0` TAMPOCO REPRODUCE.** Los 2 depósitos creados hoy traen **227,00** y
**123,17**. Los únicos afectados son los de julio, **de otros vendedores**, el último del **16/07**.
Esto además cierra el hilo web: el `Monto depositado 0,00` sobre una tabla hija de `266,59` era el
`id_deposit = 2` ⇒ **la web era fiel a la fuente**.

## 2 · 🟢 Depósitos SÍ se corrió — 12 casos · 11 PASS · 1 FAIL

`modules.depositos.aplica` queda **derogado a `true`**: verificado en pantalla, con 3 cobros depositables.
Depósito **Ref 4** enviado (BANCARIBE `006`, `DEP-QA-0819`, **123,17 US$**, cobro 32994), `BD-OK`, con la 3.ª
alerta recibida. Un 2.º depósito de 5,00 se creó y se eliminó. **Primera corrida de la serie que cubre Enviar
y borrar sin ningún N/A por datos**, gracias a tener 2 cobros en efectivo.
⚠ Sin adjunto obligatorio en depósitos — verificado en pantalla, no hizo falta dejar nada en Guardado.

## 3 · 🔴 NUEVO S3 — La fecha del documento no deja elegir HOY, y la fecha equivocada viaja a la nube

El selector **Fecha Doc** llega con `max="2026-08-18"` teniendo el device en **19/08**: el día de hoy aparece
`disabled` **y con la clase `calendar-day-today`**, que es la contradicción que lo delata.

**Causa raíz en el código** (`deposit.service.ts:78`):
```ts
public fechaMayor = this.dateServ.hoyISO();   // inicializador de campo
```
Se evalúa **una sola vez al construir el singleton** y nunca se refresca ⇒ **una sesión que cruza la
medianoche queda con el tope congelado en el día anterior**.

🔴 **El dato erróneo llega a producción**: los depósitos **Ref 3 y Ref 4** tienen `da_document = 2026-08-18`
con `da_deposit = 2026-08-19`. **El Ref 3 lo creó la QA a mano**, así que no es un artefacto de la
automatización — le pasó a una persona operando normalmente.

🔴 **El mismo patrón está en COBROS**: `collection-logic.service.ts:305` tiene
`public fechaMayor: string = this.dateServ.hoyISO();` con la línea de refresco **comentada**.

*Acotación honesta:* con la app recién abierta el mismo día no se manifiesta. Requiere una sesión larga o que
cruce medianoche — que es justo lo que hace un vendedor que no cierra la app.

### 🔻 REBAJA DE SEVERIDAD (S3 → S4) tras observación de la QA — el campo no lo consume nadie

La QA notó que **la fecha 18/08 no vuelve a aparecer en ningún lado**, en particular al ver el depósito en la
web. Se comprobó y **tiene razón**:

1. **`da_document` NO está en `view_reporte_depositos`.** La vista sí expone `de.nu_document AS numero_planilla`
   (el **número** de planilla), pero **no la fecha**. El reporte no la lleva.
2. **En uso normal el campo es un duplicado de `da_deposit`:**

   | id_deposit | Quién | `da_document` | `da_deposit` | ¿Coinciden? |
   |---|---|---|---|---|
   | 1 (13/07) | vendedor real | 13/07 | 13/07 | ✅ |
   | 2 (16/07) | vendedor real | 16/07 | 16/07 | ✅ |
   | **3** (19/08) | **QA, a mano** | **18/08** | 19/08 | 🔴 |
   | **4** (19/08) | agente smoke | **18/08** | 19/08 | 🔴 |

   Los **2 casos reales** coinciden al día. Solo divergen los de la sesión que cruzó medianoche.

⇒ **Consecuencia práctica actual: ninguna.** El dato erróneo se guarda pero **no se muestra ni se reporta**, y
en el camino normal es idéntico a la fecha del depósito. Por eso nadie lo había detectado.

⇒ **Pero el defecto sigue siendo real y hay que arreglarlo**, por dos motivos distintos:
- **El bloqueo de la UI se ve igual.** El vendedor que intenta poner la fecha de la planilla de hoy **no
  puede**, y el día aparece deshabilitado *con la marca de "hoy"*. Es confuso con independencia de lo que se
  haga después con el dato.
- **El campo existe para poder diferir de la fecha del depósito** (la planilla puede ser de otro día). Si hoy
  siempre coincide, es porque el tope roto y el valor por defecto lo impiden — o sea que **la funcionalidad
  que justifica el campo no se puede usar**.

⇒ 📋 **Pregunta para desarrollo, que surge de esto:** si `da_document` no se muestra ni se reporta en ninguna
parte, **¿para qué se captura, se valida y se bloquea?** O se consume en algún sitio (y entonces el dato
erróneo sí importa), o es un campo muerto que conviene retirar del formulario. Las dos respuestas son
accionables; el estado actual —capturar y bloquear algo que nadie lee— no.

⚠ **No verificado:** si la pantalla de detalle de la web (JSF) lee `deposit.da_document` directamente, al
margen de la vista. La QA observó que no aparece; no se inspeccionó el fuente JSF para confirmarlo.

## 4 · 🔴 NUEVO — La vista `view_reporte_depositos` está rota

`SELECT * FROM view_reporte_depositos` aborta con *"more than one row returned by a subquery used as an
expression"*. La columna culpable es **`moneda_conversion_cobro`**, y la causa está en los **datos**: el tenant
tiene **DOS filas con `local_currency = true`** (BS y US$) donde la vista asume una sola.
📄 **Incidencia dedicada:** `automation/reports/INCIDENCIA-vista-reporte-depositos-rota.md`

## 5 · 🟠 NUEVO W-H1 — El número de cuenta del pago tipo Depósito nunca se muestra

La columna renderiza `nu_bank_account`, que la app llena en los pagos `pm` (pago móvil) pero **no** en los `de`
(ahí la cuenta viaja en `nu_collection_payment`). **17 de 17 pagos `de` del tenant afectados.**
Prueba de que es de la web y no de la captura: **la misma cuenta sí aparece en `detalleDeposito`**.

## 6 · 🟠 NUEVO B.3 — El indicador de `/pages/depositos` sigue en 0,00 con el dato de origen correcto

Con **2 filas** que suman **350,17 US$** y `nu_amount_doc` bien poblado, la cabecera muestra
`Monto total en US$: 0,00`. **Revoca parcialmente** el dictamen previo ("el 0,00 es fiel a la fuente"): eso
valía para la *columna* de los depósitos de julio, **no para el indicador**.
Contraste del mismo build: en cobros el indicador **sí** sigue al campo base — medido con
`nu_amount_total_conversion = 0` en 3 de los 4 cobros nuevos y aun así contados correctamente.
⚠ **Causa sin determinar.** Requiere el fuente JSF; no se puede discriminar solo desde BD.

## 7 · Correcciones a hallazgos de este mismo consolidado

- 🟢 **`deposit_collection_payment` vacía NO es defecto — retirado.** La definición de la vista muestra que el
  enlace depósito↔cobro va por **`collection.id_deposit`** (`LEFT JOIN collection co ON de.id_deposit = co.id_deposit`),
  y ese campo **sí** está poblado (cobro 32994 → `id_deposit = 4`). La tabla aparenta ser vestigial.
  Convergen dos vías independientes: el agente de depósitos (5.ª confirmación del guion) y la lectura de la vista.
- 🟡 **M-3 (botón Guardar) rebajado de S3 a S4 y reescrito** — ver la corrección en su propia sección: la QA
  comprobó a mano que **el botón revive al adjuntar** (`cobros-header.component.ts:182`, donde Guardar hereda
  el estado de Enviar). El agente concluyó "no vuelve nunca" sin recorrer el flujo completo.
- ✅ **Umbral del comentario de visita acotado por los dos lados**: la QA midió **exactamente 120 → SÍ envía**,
  contra 255 → no envía. Confirma que el límite es el ancho de la columna y nada más.
- ✅ **`requiredComment`: mapa CERRADO con los 7 módulos** — aplica **solo a COBROS**. Depósitos fue el 7.º y
  se cerró con doble contrafactual.
- ⚠ **`nu_attachments` de cobros SÍ suma la firma** (4/4 exacto) — corrige la nota del perfil, que lo daba por
  no homogéneo sin distinguir el caso de cobros.
- ⚠ **`web-selectors/cobros.md` atribuía `Retención IVA/ISLR` solo a `co_type=2`: es falso.** El cobro 32994 es
  `co_type=0` y las trae. La regla real es **por dato** (`> 0`), no por tipo.

## 8 · 🟠 Riesgo nuevo, no ejercido

El cobro **32993**, ya vinculado a `id_deposit = 3` en la nube, **se sigue ofreciendo como depositable** en el
device (la tabla local `deposits` llega vacía) ⇒ **riesgo de doble depósito**. **No se ejerció** por tratarse
de un tenant productivo. Conviene verificarlo en un entorno de pruebas.

## 9 · Pendientes que siguen abiertos

1. **Backfill de los ~20 adjuntos previos al fix del rutero** — lo único abierto de ese hilo.
2. **Confirmar si `currency_enterprise` tiene el mismo duplicado en los otros tenants** (rompería la vista allí también).
3. **Decisión de `git commit`** — tres corridas completas sin commitear, más dos incidencias y los perfiles nuevos.
4. Con desarrollo: `disableDaDispatch`, `clientsOrderBy`, `userCanAddRetention`, `AJPM` no cobrable,
   `Devolución en`, lote en `detalleInventario`, y el indicador de depósitos (B.3).

---

*Adenda de cierre · 2026-08-19 · 296 casos · 5 FAIL · Claude Code*
