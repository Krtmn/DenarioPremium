# Smoke Test Consolidado — CHOCOLATES KRON, C.A.
## 10 módulos móvil + capa web · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-08-17 |
| **RUN_ID** | `20260817_145314_smoke-completo` |
| **Cliente** | `kron` — CHOCOLATES KRON, C.A. · empresa única **`KRON_ADM`** |
| **Playa** | **Isla Coche** — WS `denarioislacoche.ddns.net:8081/PremiumWS` · web `:8080/DenarioPremium` |
| **Dispositivo** | `14678405BR003855` — Infinix X6728, Android 15 · APK recompilado hoy apuntando a Isla Coche |
| **App** | `com.kiberno.denarioPremiumPro` · `window.ng` = true |
| **Usuario QA** | `***` — SCARLET FLOREZ · `id_user 309` · `co_user VE0002` · **30 clientes** en cartera |
| **BD nube** | `kron` — read-only ✅ 184/184 tablas ⚠ **salvo `visit_view`** (falla la *secuencia*, no la tabla) |
| **Resultado móvil** | **101 PASS · 0 FAIL · 0 SKIP · 35 N/A · 1 BLOCKED** de **137 casos** |
| **Resultado web** | 92+ casos · **80 WEB-OK · 12 WEB-N/A · 0 mismatch** *(C## en curso al cierre)* |
| **Corrida** | **COMPLETA** — 10/10 módulos, ninguno abortado |

> 🔴 **Alcance acordado con QA:** **COBROS en SOLO LECTURA** (motivo: tiempo). No se creó ningún cobro —
> certificado por `sqlite_sequence`: `collections` 10→10, `collection_details` 7→7, `collection_payments` 8→8.
> **Y sin adjuntos en las transacciones del móvil**, también por instrucción de QA: la QA cargó a mano
> 8 transacciones con adjuntos antes de la corrida.
> 🔴 **Además:** a diferencia de grupo_fiel, esta vez **no se abrió el formulario de Nuevo Cobro ni para
> observar VGs** — las VGs se dirimieron desde el detalle de cobros existentes, la BD y el componente Angular.

---

## Resumen por módulo — MÓVIL

| # | Módulo | Casos | PASS | FAIL | N/A | BLK | Registro creado | Cotejo BD |
|---|--------|-------|------|------|-----|-----|-----------------|-----------|
| 1 | Login | 6 | 6 | 0 | 0 | 0 | — | — |
| 2 | Clientes | 12 | 12 | 0 | 0 | 0 | Cliente potencial **Ref 78** | ✅ BD-FIELD-OK 17/17 |
| 3 | Pedidos | 14 | 14 | 0 | 0 | 0 | Pedido **Ref 5086** · USD 202,80 | ✅ BD-FIELD-OK 38/38 + 2 hijas |
| 4 | Cobros | 34 | 5 | 0 | 29 | 0 | **ninguno** (solo lectura) | n/a — nada que cotejar |
| 5 | Devoluciones | 14 | 13 | 0 | 1 | 0 | Devolución **Ref 178** | ✅ BD-FIELD-OK 13/13 + 1 hija |
| 6 | Inventarios | 16 | 16 | 0 | 0 | 0 | Inventario **Ref 3** · 3 líneas | ✅ BD-FIELD-OK 15/15 + 3 hijas |
| 7 | Depósitos | 12 | 10 | 0 | 1 | **1** | Depósito **Ref 1** · 900.031,16 BS | ✅ BD-FIELD-OK 15/15 |
| 8 | Visitas | 16 | 14 | 0 | 2 | 0 | Visita **Ref 143** | ✅ BD-FIELD-OK 20/20 + 1 hija |
| 9 | Productos | 10 | 8 | 0 | 2 | 0 | — (solo lectura) | — |
| 10 | Vendedores | 3 | 3 | 0 | 0 | 0 | — (solo lectura) | — |
| | **TOTAL** | **137** | **101** | **0** | **35** | **1** | **6 registros** | **6/6 transaccionales OK** |

**Cero FAIL en toda la corrida.** El único BLOCKED es `DM-DEP-019` (el detalle del depósito ya Enviado no
navega por CDP tras 3 intentos) — **limitación de automatización, no defecto**.
De los 35 N/A, **29 son los casos de creación de cobros** que se decidió no ejecutar.

## Registros enviados al sistema (persisten)

| Módulo | Ref | Epoch (`co_x`) | Detalle | Estado |
|--------|-----|-------|---------|--------|
| Clientes | **78** | 1786993684489.0 | `Test-CLT-SMOKE-150841` · RIF J987654321 | Enviado |
| Pedidos | **5086** | 1786994993455.0 | BICENTENARIA CCS · `51104106` ×2 BULTO · **USD 202,80** | Enviado |
| Devoluciones | **178** | 1786997229819.0 | factura `FACT50029953` · `51104106` ×3 BUL | Enviada |
| Inventarios | **3** | 1786998592656.0 | `51104106` exh 7 / dep 3 · `51104107` exh 5 | Enviado |
| Depósitos | **1** ⭐ | 1786999437808.0 | **el PRIMERO del tenant** · BANCO PROVINCIAL 0108 · **900.031,16 BS** ← cobro 348 | Enviado |
| Visitas | **143** | 1787000414615.0 | MERCHANDISING / VISIBILIDAD PDV · `QA-VIS-015-KRON` | Enviada |

**Pendientes de envío manual: ninguno.** Sync **inmediata** en los 6.

---

# 🔴 HALLAZGOS — qué revisar

## MÓVIL

### 1. `H-1` · `Crédito Disp.` del detalle de cliente: etiquetas de moneda cruzadas y conversión invertida · **la única de la corrida que va a desarrollo**

Con `nu_credit_limit = 0` (verificado en BD), el detalle muestra:

| Cliente | Rotulado **BS** | Rotulado **USD** | Debería ser |
|---|---|---|---|
| `J504480975` | **−113.134,08** | **−146,72** | −87.234.295,07 BS / −113.134,08 USD |

El importe rotulado **BS es en realidad el USD**, y el rotulado **USD es ese mismo número dividido otra vez**
por la tasa (113.134,08 ÷ 771,07 = 146,72). **Verificado con la aritmética por el orquestador.**
Medido en **2 clientes**, es **cálculo en vivo** ⇒ **reproduce en la versión en prueba**.
✅ Los **saldos propiamente dichos están correctos** (`Σ nu_balance` de los 20 docs == `saldoFuerte` exacto):
el problema está acotado a esa línea. **Severidad S3.**

### 2. Incidencia HUÉRFANA al borrar una visita Guardada — **3.ª confirmación, 3 servidores**

Al borrar una visita en estado Guardado, la fila sale de `visits` pero **su incidencia sobrevive** en
`incidences`. Ya reproducido en **La Tortuga, El Yaque e Isla Coche**.
Solo afecta la **BD local del dispositivo** (no llega a la nube) y no impactó ningún caso, pero es **basura
acumulativa**. Con 3 servidores de evidencia, **candidato firme a defecto formal**.

### 3. Observaciones menores del móvil

| # | Observación | Severidad |
|---|---|---|
| a | `Total Depósitos: BS 2500` **sin formato de miles**, mientras Efectivo y Transferencias del mismo cobro **sí** formatean ⇒ el defecto es de esa línea, no de la moneda. 2.ª playa (antes globalmp) | cosmética |
| b | **Timestamp ISO crudo** (`2026-08-01T04:00:00.000+00:00`) en el acordeón de retención. 2.ª playa | cosmética |
| c | `ion-loading` **colgado sobre la lista ya renderizada** en depósitos, con backdrop que bloquea clicks y **no se auto-resuelve en 6 s** (en el_palmar sí se resolvía solo). ⇒ **anexar como 2.ª manifestación de `DM-DEP-018/019/020`**, no abrir defecto nuevo | media (automatización) |
| d | El 1.er click en "AÑADIR ACTIVIDAD/EVENTO" **no abre el modal; el 2.º sí** (2 de 3 veces, rect válido, sin loading). Reintentar 1 vez; no es BLOCKED | baja |
| e | El envío de la visita tardó **~90 s** dejando 2 `ion-loading` colgados y `.imagenEnviar` en `disabled`. Ese `disabled` es el estado *"enviando"*, no un botón roto — el flujo se completó correctamente | observación de performance |

## WEB

### 4. 🎉 El fix del rutero de adjuntos: **VALIDADO en Isla Coche, visor y descarga**

Los **8 registros que la QA cargó hoy** (todos post-fix) sirven adjuntos correctamente:
**8/8 visores abrieron** con imágenes que **cargan de verdad** (`naturalWidth` 720×1600, ninguna en 0) ·
**8/8 descargas** con `application/zip` + `Content-Disposition: attachment` · **25/25 entradas de ZIP == oráculo BD**
(`transaction_image` ∪ `transaction_files`) · **0 apariciones de `localhost:8282`**.

🔑 **`inventarios` (Ref 2) queda CERRADO** — era uno de los dos módulos sin muestra post-fix.
⚠ **`clientesPotenciales` sigue SIN muestra**: kron no tiene ninguno posterior al 2026-02-06, y el Ref 78 que
creó el móvil **no lleva adjuntos** (instrucción de QA) ⇒ **es el único módulo del hueco original que queda
por verificar.** Se cierra creando un cliente potencial **con adjuntos**.

🔑 **Matiz importante, distinto a grupo_fiel:** acá los registros viejos **no** son "pre-fix sin migrar" —
**no tienen ninguna fila** en las tablas de adjuntos; su `nu_attachments` es un **contador huérfano**. Por eso
la web hace lo correcto dejando los botones **`disabled`**, y su 404 era esperable con o sin fix. El peso de la
validación recae en los **200 de los registros nuevos**, que sí son concluyentes.

### 5. 🔴 Seguridad de datos: una TERCERA ubicación de descargas, no documentada

El MCP de Playwright deja el **cuerpo crudo** de cada descarga en **`%TEMP%\playwright-artifacts-*\`**, con
**nombre UUID y SIN extensión** ⇒ **invisible a un barrido por `*.zip`**. Se encontraron **7 archivos**
(172 KB–335 KB) **después** de haber limpiado las dos ubicaciones documentadas.
**`download.delete()` NO alcanza**, y además el MCP **renombra** `visita_142.zip` → `visita-142.zip`.
⇒ **Nueva regla: barrer por firma `PK\x03\x04`, no por extensión, y en las TRES ubicaciones.**
✅ **Verificado por el orquestador al cierre:** 46 carpetas `playwright-artifacts-*` en el sistema, **todas
vacías**; en el repo solo quedan las imágenes propias de la app. **Cero adjuntos productivos en disco.**

### 6. Cotejo web — sin un solo mismatch

| Familia | Alcance | Resultado |
|---|---|---|
| **F##** Filtros | 7 módulos | **36 WEB-OK · 5 N/A** (depósitos sin datos) — filtro `# Ref` operativo, 8/8 refs exactos |
| **C-HOY** | las 8 transacciones de la QA | **8/8 WEB-OK**, 0 diffs, aritmética completa verificada |
| **A##** Adjuntos | 8 post-fix + 4 pre-fix | **8/8 WEB-OK** post-fix · viejos en 404 (esperado) |
| **M##** Muestreo | **72/72 cobros (100 % del histórico)** + 43 pedidos + 24 visitas | **cero mismatches** |
| **C##** móvil→web | los 6 registros de la corrida | **6/6 WEB-OK**, 0 diffs, aritmética dentro de 0,01 |

**Total capa web: 98 casos · 86 WEB-OK · 12 WEB-N/A · 0 mismatch · 0 BLOCKED.**

### 🔴 7. El cotejo C## CONFIRMÓ dos defectos que estaban con evidencia débil

| Defecto | Antes | Ahora |
|---|---|---|
| **`D-02`** — `/pages/depositos`: **`Monto total en BS` y `Monto total en USD` en `0,00`** teniendo filas con importe | Detectado en grupo_fiel con **n = 1** (su único depósito); **no se pudo replicar** en un 2.º tenant | 🔴 **CONFIRMADO en kron**: el depósito Ref 1 vale `900.031,16 BS` / `1.167,25 USD` y **ambos indicadores marcan 0,00**, incluso **tras pulsar `Buscar`** (XHR 200). ⇒ **2 tenants, 2 playas** |
| **`D-01`** — `/pages/pedidos`: **`Monto total en USD` siempre 0,00** | Confirmado en 2 tenants | 🔴 **Reconfirmado**: en kron la cabecera **sí** calcula `Total Base: 1.385.042,10` pero el indicador USD sigue en `0,00` ⇒ el agregado está **muerto**, no es una lectura segregada |
| **`DEP-BANCO-CODIGO-CRUDO`** — Depósitos muestra el **código** del banco en vez del nombre | Detectado en grupo_fiel (`7738` en vez de `BANESCO`) | 🟠 **Misma familia en kron**: muestra `0108` en vez de `BANCO PROVINCIAL, S.A. BANCO UNIVERSAL`, en **lista y detalle**. 2.º tenant |

**Sin defectos web nuevos propios de kron.** `COB-RET-TOTAL-CERO` **no reproduce**.

---

## 🟠 Anomalías DESCARTADAS por la regla nueva (`WEB-RUNTIME §5.a`) — **no son defectos**

La regla que se documentó hoy evitó **cuatro** reportes de ruido:

| Anomalía | Por qué se descartó |
|---|---|
| **Anticipos viejos sin conversión ni tasa en la lista** (`Tasa conv. N/A`, `Total por cobrar 0,00`) — 6 afectados, refs 2-8 | **No reproduce desde el 2026-03-09.** Control fuerte: el anticipo **350, creado HOY**, renderiza `2.500,00`, tasa 771,07 y conv 3,24 correctamente. La web es **fiel a BD** en los 3 campos |
| **Dos pedidos con la línea IVA-inclusiva** | Barrido sobre los **5.054** pedidos: **solo 2 afectados**, ambos del **2026-02-23** (primer día de datos). Cabecera internamente coherente ⇒ **no reproduce desde entonces** |
| **`potential_client`: 73 filas en BD, la web lista 7** | Los 66 restantes tienen `id_user` que **ya no existe en `users`** (vendedores de baja). El conteo web coincide **exacto** con el `JOIN users` ⇒ el filtro **no está roto**. Misma familia que el pendiente de `salesman_view`. **Severidad baja** |
| **Visita 77 con la actividad duplicada** | **No atribuible**: `visit_view` es ilegible, así que no se puede decidir si el duplicado está en BD o lo genera la web |

## ⛔ El BLOCKED que resultó ser falso positivo

El agente `M##` reportó que **el filtro de fechas de `/pages/visitas` no llegaba al servidor**. Una verificación
dirigida lo **descartó de forma tajante**: enganchó el XHR y capturó el POST, que **sí lleva**
`dateB_input=01/06/2026` y `dateF_input=30/06/2026`, y el servidor **los honra**.
**6 ventanas probadas, 6 conteos exactos** contra BD (feb 1 · abr 27 · jun 23 · ago 18 · 17/08 → 1 · ene-2025 → 0).

🔑 **Causa raíz, valiosa para todas las corridas:** al entrar a `/pages/visitas` **la tabla ya viene pintada con
el resultado de la búsqueda anterior del bean**, antes de tocar `Buscar`. Si el `Buscar` no completa su ajax, se
lee un listado poblado y coherente que **parece** una respuesta al filtro.
⇒ **Queda DEROGADA la nota "la primera búsqueda de visitas devuelve resultado rancio":** el problema nunca fue
el número de búsquedas, sino **no esperar el fin real del ajax**. El `Buscar` de calentamiento no arregla nada;
enganchar el `loadend` del XHR **sí**.

---

## VGs y pendientes del perfil — **los 5 cerrados**

| # | Pendiente | Veredicto | Evidencia |
|---|---|---|---|
| 1 | **`esVendedor`** (no venía en los dumps) | ✅ **TRUE** | `<h1>Vendedor</h1>` + acordeón funcional + **KPIs reales**: Cartera **30** (cuadra exacto con los 30 clientes de `scarlet` en `client_template_user`), Activados 6, Días 21/11/10 |
| 2 | **`enterpriseEnabled=true` con 1 sola empresa: ¿aparece el selector?** | ✅ **Sí existe, pero llega `disabled` y auto-asignado** | Y el hallazgo va más lejos: **kron con la VG en `TRUE` se comporta IDÉNTICO a grupo_fiel con la VG en `FALSE`** ⇒ **`enterpriseEnabled` NO gobierna esta variante.** El predictor es el **nº de empresas**; la variante concreta la fija **cada formulario** (4 variantes distintas medidas hoy dentro del mismo tenant) |
| 3 | **Alcance de `expirationBatch`** | ✅ **SOLO INVENTARIOS** | Devoluciones **envía lote y vencimiento vacíos** y persisten así · Inventarios **rechaza**: *"Complete cantidad, unidad, fecha y lote para continuar"*. **El bloqueante es el LOTE** (la fecha nace en HOY). **3.ª confirmación** del alcance por módulo |
| 4 | **`factura_test` / `documento_retencion`** | ✅ **resueltos** (`FACT50029953` + 3 alternas) — **y con un descubrimiento**: el **Nro. de factura NO valida contra facturas reales**. Probado en ambos sentidos: la factura real pasó, y `ZZZ-NO-EXISTE-999` **también** habilitó Guardar/Enviar y persistió. Coherente con `validateReturn=false` y `coInvoice:null` ⇒ **comportamiento esperado, no defecto** |
| 5 | **Alinear el nombre del bloque de credenciales** | 📋 **sigue abierto** — el perfil es `kron` pero el bloque de `qa-credentials.env` es **`chocolates_kron`**. Funciona anclando al nombre exacto, pero conviene unificarlo |

**Extra resueltos:** `requiredComment=false` confirmado (el cobro 348 se envió con comentario vacío; el tope real
es **255**, no los 200 del YAML) · `validateCollectionDate=false` confirmado (el cobro 349 aceptó `da_value`
16 días anterior) · **`userCanSelectCollectDiscount=true` CONFIRMADO OPERATIVO** (el cobro 348 tiene un
descuento real de 16.000,00 y la web renderiza la columna `Desc.` solo cuando existe).

---

## Descubrimientos que trascienden a kron

1. 🔑 **La hipótesis "el origen del historial de cobros depende de la playa" queda ROTA.** kron **descarga del
   servidor** y está en **Isla Coche**, la misma playa que **el_palmar, que es 100 % local**. El discriminador
   **no es la playa**. Medido con precisión: de 72 cobros en la nube el móvil baja **4**, por **dos filtros
   encadenados** — vendedor (5 de scarlet) **y** una ventana de fecha (deja fuera uno del 19/03).
   ⚠ La receta de difranca (contrastar contra el conteo por vendedor) da un **falso "falta 1 cobro"** si no se
   acota también por fecha.
2. 🔑 **El motor de cotejo BD funcionó en 6 corridas contra un tenant nuevo SIN un solo ajuste** (clientes,
   pedidos, devoluciones, inventarios, depósitos, visitas). Es la confirmación práctica de que el mapeo
   pertenece al **modelo de datos del producto**, no al tenant.
3. 🔧 **La corrección al motor aplicada hoy se ejercitó en su primer caso real y funcionó.** El inventario
   Ref 3 tiene el mismo producto en **dos ubicaciones** — el escenario que antes producía mismatches falsos por
   emparejar con clave no única. Con la PK de negocio dio **BD-FIELD-OK, 0 mismatches**.
4. 🔴 **Trampa de BD nueva: `collection_payment.co_operation` viene `NULL`** ⇒ `WHERE co_operation <> 'D'`
   **oculta las filas** (`NULL <> 'D'` es `NULL`). Devolvió 0 pagos para los 4 cobros de la QA y casi produce un
   falso *"cobros sin pagos"*. **Usar `IS DISTINCT FROM 'D'`.** ⚠ Es **por tabla**: `order_detail` y
   `return_detail` sí traen `'I'`.
5. 🔴 **Anti-patrón web nuevo:** `boton.click()` sobre `Buscar`/`Limpiar` **puede navegar a una página de
   error** y perder el contexto. Son `<button type="submit">` con `onclick="PrimeFaces.ab({...});return false;"`
   — hay que **ejecutar el `onclick`**, no clickear.
   ⚠ Y necesita **dos vías**: en los botones de adjunto el `onclick` usa `event`, así que hay que pasarle un
   `MouseEvent` o revienta.
6. 🔑 **Receta anti-falso-FAIL en productos:** `badge − listados = productos sin precio` cuando
   `hideProdWithoutPrice=true`. Evitó imputar una "lista truncada" inexistente: el query por estructura
   **predijo las 9 de 9**.
7. **`PRD-BUSCADOR-NO-REPUEBLA` va por 5 playas y 4 servidores** — regla firme.
8. ⚠ **`listProductsBy="lineas"` NO nombra el tipo de estructura.** En kron el único tipo se llama **`Modelo`**.
   La VG designa el *modo* de agrupar; que en grupo_fiel el tipo se llamara "Línea" fue **casualidad del dato**.

---

## Observaciones de DATOS del cliente (no son defectos de la app)

| # | Dato | Efecto |
|---|---|---|
| a | **`client_avg_product` está VACÍA (0 filas)** | El pedido sugerido **no tiene insumo**. En inventarios cae al fallback `sugerido = currentStock` (dio 10 y 5). ⇒ **N/A por datos, nunca FAIL** |
| b | 🔴 **16 productos (10,9 % del catálogo) son INVISIBLES en el módulo** por no tener precio, con `hideProdWithoutPrice=true`. Concentrados en **GOLOSINAS, donde son el 60 %** de la estructura | Vale que lo mire alguien de datos: son productos que el vendedor no puede pedir |
| c | `return_type`: **12 tipos en BD, solo 4 activos**. Entre los borrados hay **tres de aspecto legítimo** (`Despacho`, `Vencidos`, `Falla`) | ⚠ Revisar si alguno debería estar activo. La basura de pruebas **no llega a la app** (3.ª confirmación) |
| d | **TRES clientes homónimos "MINIMARKET BICENTENARIA"** (`J504480975` CCS, `J505383973` VALENCIA, `J409215121`) — el perfil solo advertía de dos | **Anclar por `co_client`, nunca por nombre** |
| e | Las **13 cuentas bancarias son todas BS** ⇒ `currencyBank=true` **no es observable** en kron | — |
| f | Anticipos 4/5/6 con importes implausibles rotulados USD (464.987,60 · 1.222.110,00 · 402.230,00) | `co_currency='USD'` **en BD**: la web coincide. Calidad de dato de febrero |
| g | El catálogo de actividades de visita son **12**, no 5 como decía el perfil | corrige el perfil (mismo desfase que en grupo_fiel) |

---

## Cobertura — lo que NO se cubrió, declarado

| Hueco | Motivo |
|---|---|
| **Creación de cobros** (29 casos N/A) | Decisión explícita de QA: solo lectura, por tiempo |
| **Adjuntos en las transacciones del móvil** | Instrucción de QA (ella cargó 8 con adjuntos por su cuenta) |
| **Adjuntos post-fix en `clientesPotenciales`** | El Ref 78 se creó **sin** adjuntos ⇒ **único módulo del hueco original que sigue abierto** |
| **`DM-DEP-019`** (⛔ BLOCKED) | El detalle del depósito Enviado no navega por CDP tras 3 intentos. Evidencia parcial obtenida desde la lista |
| **`DM-DEP-020`** (N/A) | Tras enviar **no queda ningún Guardado que borrar**: el pool era **1 solo cobro** y se consumió. ⇒ **Para cubrir enviar Y borrar hacen falta ≥2 cobros con efectivo al llegar al módulo** |
| **`M##` en devoluciones, inventarios y depósitos** | Sin histórico (3, 3 y 0 registros) — confirmado en BD |
| **Muestreo de pedidos: 43 de 5.054** | Estratificado por mes × moneda × vendedor. Pero el **invariante se barrió sobre los 5.054** |
| **Actividad/motivo de visitas en `M##`** | `visit_view` **ilegible** (`permission denied for sequence visit_view_seq`) ⚠ **pero `incidence` SÍ tiene GRANT** — se cotejó en el módulo de visitas |
| **`VND-KPIS-SIN-SEGMENTAR`** | **No evaluable** con una sola empresa — no se reporta como "no reproduce" |

---

## Qué haría ahora

**A desarrollo:**
1. 🔴 **`D-02` — los indicadores `Monto total en BS/USD` de `/pages/depositos` están en `0,00`** teniendo datos.
   **Ahora confirmado en 2 tenants y 2 playas** (era el que quedaba con n=1). Junto con **`D-01`** (el indicador
   USD de `/pages/pedidos`, muerto en 3 mediciones), son los dos agregados rotos de la web.
2. **`H-1` — `Crédito Disp.` con monedas cruzadas** en el detalle de cliente (móvil). Único defecto de producto
   **nuevo** de esta corrida, y reproduce en la versión actual.
3. **Incidencia huérfana al borrar visitas Guardadas** — 3 servidores, candidato a defecto formal.

**Pendiente de verificación:**
3. **Crear un cliente potencial CON adjuntos** para cerrar el último módulo del hueco del rutero.

**Higiene de datos del cliente:**
4. Revisar los **16 productos sin precio** (10,9 % del catálogo, invisibles para el vendedor) y los **3 tipos
   de devolución borrados de aspecto legítimo**.

**Automatización:**
5. Corregir `smoke-depositos.md`: manda cotejar `deposit_collection_payment`, que está **vacía en los dos
   tenants** ⇒ produce `BD-MISMATCH` falsos. **4 confirmaciones** — el vínculo real es `collection.id_deposit`.

---

*Generado por Claude Code · Orquestador Smoke · 2026-08-17*
