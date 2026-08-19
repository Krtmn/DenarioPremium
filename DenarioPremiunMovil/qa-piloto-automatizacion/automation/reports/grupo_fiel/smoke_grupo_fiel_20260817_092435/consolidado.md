# Smoke Test Consolidado — GRUPO FIEL, S.A. (GRUFISA)
## 10 módulos móvil + capa web completa · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-08-17 |
| **RUN_ID** | `20260817_092435_smoke-completo` |
| **Cliente** | `grupo_fiel` — GRUPO FIEL, S.A. (GRUFISA) · empresa única `00001` |
| **Playa** | **El Yaque** — WS `denarioelyaque.ddns.net:8081/PremiumWS` · web `:8080/DenarioPremium` |
| **Dispositivo** | `14678405BR003855` — Infinix X6728, Android 15 |
| **App** | `com.kiberno.denarioPremiumPro` — v1.0 (db19) · `window.ng`=true |
| **Usuario QA** | `***` — Johana Belandria · `id_user 463` · `co_user 003` · vendedor puro · 61 clientes en cartera |
| **BD nube** | `grupo_fiel` — read-only ✅ **185/185 tablas legibles** |
| **Resultado móvil** | **116 PASS · 0 FAIL · 0 SKIP · 21 N/A · 0 BLOCKED** de **137 casos** |
| **Resultado web** | **185 WEB-OK · 5 FIELD-MISMATCH · 2 CALC-MISMATCH · 24 MISSING · 13 N/A** de **229 casos** |
| **Corrida** | **COMPLETA** — 10/10 módulos, ningún módulo abortado |

> 🔴 **Alcance acordado con QA:** **COBROS en modo SOLO LECTURA** por decisión explícita (motivo: tiempo).
> No se creó ningún cobro — certificado por `sqlite_sequence.collections` = **18 al abrir y 18 al cerrar**.
> Los 16 casos de creación van 🚫 N/A con motivo, no son cobertura perdida por fallo.
> **Sin adjuntos en las transacciones del móvil**, también por instrucción de QA.

---

## Resumen por módulo — MÓVIL

| # | Módulo | Casos | PASS | FAIL | N/A | BLK | Registro creado | Cotejo BD |
|---|--------|-------|------|------|-----|-----|-----------------|-----------|
| 1 | Login | 6 | 6 | 0 | 0 | 0 | — | — |
| 2 | Clientes | 12 | 12 | 0 | 0 | 0 | Cliente potencial **Ref 35** | ✅ BD-FIELD-OK 17/17 |
| 3 | Pedidos | 14 | 14 | 0 | 0 | 0 | Pedido **Ref 1356** · 6.987,39 BS | ✅ BD-FIELD-OK 39/39 + 2 hijas |
| 4 | Cobros | 34 | 18 | 0 | 16 | 0 | **ninguno** (solo lectura) | n/a — nada que cotejar |
| 5 | Devoluciones | 14 | 13 | 0 | 1 | 0 | Devolución **Ref 2** | ✅ BD-FIELD-OK 14/14 + 1 hija |
| 6 | Inventarios | 16 | 16 | 0 | 0 | 0 | Inventario **Ref 2** · 3 líneas | ✅ BD-FIELD-OK 16/16 + 2+3 hijas |
| 7 | Depósitos | 12 | 11 | 0 | 1 | 0 | Depósito **Ref 3** · 8.000,00 BS | ✅ BD-FIELD-OK 15/15 |
| 8 | Visitas | 16 | 14 | 0 | 2 | 0 | Visita **Ref 111** | ✅ BD-FIELD-OK 21/21 + 1 hija |
| 9 | Productos | 10 | 9 | 0 | 1 | 0 | — (solo lectura) | — |
| 10 | Vendedores | 3 | 3 | 0 | 0 | 0 | — (solo lectura) | — |
| | **TOTAL** | **137** | **116** | **0** | **21** | **0** | **6 registros** | **6/6 transaccionales OK** |

**Cero FAIL y cero BLOCKED en toda la corrida.** Los 3 BLOCKED iniciales de Productos se **rescataron a PASS**
por el último agente (ver §Correcciones).

## Registros enviados al sistema (persisten)

| Módulo | Ref (servidor) | Epoch (`co_x`) | Detalle | Estado |
|--------|-----|-------|---------|--------|
| Clientes | **35** | 1786973829965.0 | `Test-CLT-SMOKE-093737` · RIF J987654321 | Enviado |
| Pedidos | **1356** | 1786975326913.0 | MP GELATO · tipo A Pedido Factura, lista 03 · 1.5LTS ×2 · 6.987,39 BS | Enviado |
| Devoluciones | **2** | 1786979219811.0 | MP GELATO · factura B066127 · 1.5LTS ×6 · tipo Servicio | Enviada |
| Inventarios | **2** | 1786980326244.0 | MP GELATO · 1.5LTS exh 8 / dep 3 · 330ML exh 5 | Enviado |
| Depósitos | **3** | 1786981585334.0 | BANESCO 7738 · planilla PL-QA-0817 · **8.000,00 BS** ← efectivo del cobro 32 | Enviado |
| Visitas | **111** | 1786983196380.0 | MP GELATO · MERCHANDISING / VISIBILIDAD PDV | Enviada |

**Pendientes de envío manual: ninguno.** Todos los registros llegaron a la nube; sync **inmediata** (<8 s).
Registros temporales creados y eliminados dentro de su propio caso (no listados): 1 cliente potencial,
1 pedido, 1 devolución, 1 inventario, 1 visita.

---

## Resumen por familia — WEB

| Familia | Qué valida | Casos | Resultado |
|---|---|---|---|
| **F##** Filtros | que la web encuentra lo que se le pide | 42 | **42 WEB-OK** — filtro `# Ref` operativo en los 6 módulos que lo exponen |
| **C-HOY** Cotejo BD→web | los 12 registros que QA cargó a mano hoy | 13 | 11 OK · **1 FIELD-MISMATCH** · 44/44 comprobaciones aritméticas exactas |
| **M##** Muestreo histórico | 113 registros históricos contra BD | 120 | 114 OK · 4 FIELD-MISMATCH · 2 CALC-MISMATCH · 4 N/A |
| **A##** Adjuntos | descarga y visor | 22 | **21 WEB-MISSING** · 1 OK — *(estado inicial, antes del fix)* |
| **D##** Comportamiento | paginación, orden, columnas, vacíos, formato | 22 | 18 OK · 1 FIELD-MISMATCH · 3 N/A |
| **Re-test A##** | adjuntos **después** del fix de desarrollo | 10 | 6 OK · 3 MISSING (registros viejos) · 1 N/A |
| | **TOTAL** | **229** | **185 OK · 5 FIELD-MISMATCH · 2 CALC-MISMATCH · 24 MISSING · 13 N/A** |

Cobertura web: **las 5 familias corrieron completas.** No quedó ninguna sin ejecutar.

---

# 🔴 HALLAZGOS — ordenados por impacto

## 1. `ADJ-BACKFILL-PENDIENTE` — los adjuntos anteriores al fix son inaccesibles desde la web · **ALTA**

**Estado: ABIERTO.** No es regresión: es **alcance faltante** del fix que hizo desarrollo hoy.

Desarrollo corrigió el "rutero" de adjuntos durante la corrida. **El fix funciona y es transversal**, verificado
en 5 módulos con doble oráculo (visor + HTTP directo, y descarga + headers de respuesta):

- El visor **ya no apunta a `localhost:8282`** — ahora construye
  `…:8080/denario/resources/images/{carpeta}/{ref}_{n}.jpeg` y sirve `200 image/jpeg`.
- La descarga entrega **`application/zip`** con `Content-Disposition: attachment` y ZIP válido; las entradas
  cuadran **4/4** contra `transaction_image` ∪ `transaction_files`.

**Pero solo para registros nuevos.** La URL es idéntica para viejos y nuevos; lo que cambia es que **los
archivos anteriores nunca se escribieron en la ubicación que sirve el rutero nuevo, y no se migraron**.

**Corte medido con precisión** — monótono, sin una sola excepción en 22 archivos de 7 módulos:
último 404 = cobro 33 (`15:35:14` UTC) · primer 200 = cobro 34 (`15:39:45` UTC)
⇒ **el fix entró entre las 15:35 y las 15:39 UTC** (11:35–11:39 local).

**Impacto:** ~20 archivos de la mañana, en 7 módulos, con datos productivos reales, existen en BD pero son
**irrecuperables desde la web**. Incluye los adjuntos de las transacciones que QA cargó a mano hoy.
**Acción:** backfill / migración de los archivos previos a la ubicación nueva.

> ⚠ **Hueco de muestra declarado:** **clientes potenciales** e **inventarios** no tienen ningún registro
> posterior al fix, así que su comportamiento post-fix **no está verificado**. Hay que re-probarlos con un
> registro nuevo antes de darlos por buenos.

## 2. `COB-ANTICIPO-MONTO-PAGADO-CERO` — 🔻 **REVISADO CON QA: NO es defecto de la versión actual** · observación sobre datos históricos

> 🔴 **CORRECCIÓN (QA, 2026-08-17, posterior al cierre de la corrida).** Este hallazgo y el nº 6
> (`COB-LISTA-TASA-NA`) **son la misma condición de datos, no dos defectos**, y **no reproducen en la versión
> actual**. Verificado en BD:
>
> | Condición | Registros |
> |---|---|
> | `nu_amount_final = 0` **y** `nu_amount_total_conversion = 0` | 7 (los anticipos del hallazgo 2) |
> | solo `nu_amount_total_conversion = 0` | 3 (las retenciones 7, 13, 17 → hallazgo 6) |
> | todo poblado | 26 |
>
> **El último registro afectado es el Ref 19, del 13/07/2026.** Del Ref 20 en adelante (13/07 por la tarde,
> 07/08, 11/08 y todo el 17/08) **no reproduce ninguno**, incluidos los anticipos de hoy (Refs 29 y 35) y las
> retenciones de hoy (Refs 30 y 36).
>
> ⚠ **Matiz honesto:** el discriminador **no es puramente la fecha** — el 18/05 conviven afectados (1, 2, 3) y
> sanos (5), y el 19/05 igual. El dato prueba que **no reproduce en nada reciente**, no *qué* lo corrigió.
> Para afirmar "se arregló en la 21" hace falta que desarrollo confirme el cambio.
>
> ⇒ **Severidad rebajada de ALTA a observación.** Se conserva la evidencia abajo por trazabilidad y por si
> alguien necesita entender los registros viejos, pero **no debe reportarse a desarrollo como defecto de la 21**.

### Evidencia original (registros históricos)

El **pie del detalle** de un cobro `co_type=1` (Anticipo/Prepago) imprime `nu_amount_final` en lugar de
`nu_amount_total`. Cuando el anticipo **aún no se aplicó a un documento** (`nu_amount_final = 0`), el detalle
informa **`Monto pagado: 0,00 BS`** aunque el dinero se haya cobrado.

| Evidencia | Ref 19 | Ref 14 |
|---|---|---|
| Lista → `Monto cobrado` | 50.000,00 BS | 81.423,31 BS |
| Detalle → tabla de pagos (misma pantalla) | 50.000,00 BS | 81.423,31 BS |
| Detalle → **pie `Monto pagado`** | **0,00 BS** 🔴 | **0,00 BS** 🔴 |

**Causa acotada:** el Ref 5 es un anticipo **ya aplicado** (`nu_amount_final = 839,57`) y su pie muestra el
importe correcto ⇒ falla exactamente cuando `nu_amount_final = 0`.
**Alcance:** 7 de los 13 anticipos históricos del cliente (refs 1, 2, 3, 14, 15, 18, 19).
**Impacto de negocio:** el detalle de un anticipo de 50.000 BS le dice al usuario que se pagó cero.

## 3. Pedidos ocultos por `salesman_view` — 🔻 **REVISADO CON QA: severidad BAJA** · comportamiento, no defecto

> 🔴 **CORRECCIÓN (QA, 2026-08-17).** Criterio de QA: **que no se listen los pedidos de un vendedor dado de
> baja no es grave**; el problema sería que desaparecieran pedidos de vendedores **activos**.
> **Verificado en BD y no ocurre:** el único vendedor con pedidos ocultos en todo el tenant es
> `id_user 461` (login `001`), con **3 pedidos de un único día** (22/06/2026).
> **Ningún vendedor activo pierde un solo pedido.**
> ⇒ **Severidad rebajada de MEDIA-ALTA a BAJA.** Lo que sigue teniendo valor es el **diagnóstico técnico**
> (el join va por `id_user`), que cierra el punto abierto del pendiente. La decisión de producto —si un
> vendedor de baja debe conservar su histórico visible— queda como consulta, no como defecto.

### Evidencia y diagnóstico técnico

**Reproduce el pendiente ya abierto** (`PENDIENTE-pedidos-ocultos-salesman-view`) y **cierra la duda que faltaba**.

- El vendedor `id_user 461` (`co_user 027`) **no está en `salesman_view`**.
- Sus **3 pedidos** — refs **112, 113, 114**, del 22/06/2026, `st_order=6` (Enviado), **29.826,38 BS** — existen
  en `"order"` con `co_operation <> 'D'` y **no aparecen** en `/pages/pedidos`.
- Medición inequívoca: ventana 01/05–30/06 → **BD 128 · web 125 · BD filtrado por `salesman_view` 125**.
  Global histórico: **BD 979 · web 976**.
- 🔑 **El join que reproduce la web es por `id_user`, NO por `co_user`** — era el punto abierto de la nota.

## 4. `DEP-BANCO-CODIGO-CRUDO` — Depósitos muestra el código del banco en vez del nombre · **MEDIA**

El campo rotulado `Banco` imprime `co_bank` (**`7738`**) donde debería mostrar `bank.na_bank` (**`BANESCO`**),
tanto en la lista como en el detalle. El nombre existe en el catálogo y **la misma web sí lo resuelve en cobros**
(`Banco receptor: BANCO VENEZOLANO DE CREDITO`) ⇒ inconsistencia interna de la web, no del dato.

## 5. `COB-LISTA-MONTO-COBRADO-POR-PAGO` — ❌ **DESCARTADO: NO es defecto** (error de interpretación del agente)

> 🔴 **DESCARTADO POR QA (2026-08-17). El agente leyó mal la columna.**
> · **Caso A** — que muestre `2.000,00 BS` y `8.000,00 BS` **es el comportamiento correcto**: la columna
>   `Monto cobrado` es un **desglose por método de pago**, no un total. En el Ref 32 son los 8.000 en efectivo
>   y los 2.000 en pago móvil.
> · **Caso B** — la celda vacía en el Ref 30 **también es correcta**: en las **retenciones no se registra
>   método de pago**, así que no hay nada que desglosar. Siempre funcionó así.
>
> ⇒ **No se reporta a desarrollo.** Se conserva la entrada solo para que el criterio quede escrito y ningún
> agente futuro lo vuelva a levantar: **`Monto cobrado` NO es un total; en `co_type=2` viene vacío por diseño.**
> Este criterio se promovió a `web-selectors/cobros.md`.

### Descripción original (interpretación errónea, conservada por trazabilidad)

La columna `Monto cobrado` de `/pages/cobros` no renderiza el total del cobro sino **un importe por forma de pago,
concatenados sin separador** (`"2.000,00 BS 8.000,00 BS"`). La suma cuadra con BD, pero un lector de un solo
número canta un mismatch falso.
**Corolario:** con **cero** formas de pago la celda queda **vacía** — caso del Ref 30 (`co_type=2`, retención).
⚠ Amplía el defecto conocido `COB-RET-TOTAL-CERO` a una **superficie nueva (la lista)** y con manifestación
distinta: **vacío**, no `0,00`.

## 6. `COB-LISTA-TASA-NA` — 🔻 **REVISADO CON QA: misma condición que el nº 2, NO reproduce hoy**

> 🔴 **CORRECCIÓN (QA, 2026-08-17).** Es **la misma condición de datos del hallazgo nº 2**
> (`nu_amount_total_conversion = 0`), no un defecto aparte. **Último afectado: Ref 19 del 13/07/2026**; del
> Ref 20 en adelante no reproduce ninguno, **incluidas las retenciones de hoy (Refs 30 y 36)**, que sí traen
> conversión. Ver el detalle de la corrección en el hallazgo nº 2.
> ⇒ **No se reporta a desarrollo como defecto de la versión actual.**

### Descripción original (registros históricos)

En la lista de cobros, `Tasa conv.` muestra **`N/A`** en los 10 cobros con `nu_amount_total_conversion = 0`
(anticipos y retenciones), pero el **detalle de esos mismos cobros sí trae la tasa** (ref 7 → `515,18`;
ref 19 → `721,35`). BD guarda `nu_value_local` en 26/26. Inconsistencia lista ↔ detalle.

## 7. Observaciones menores

| # | Observación | Severidad |
|---|---|---|
| a | `INV-DET-NUMERO-FILA-CONSTANTE` — la columna `N°` de `detalleInventario` imprime `1` en todas las filas (`detallePedido` numera bien) | cosmética |
| b | **Incidencia HUÉRFANA** al borrar una visita Guardada — **2.ª confirmación** (antes solo La Tortuga, ahora El Yaque). Basura acumulativa en BD local; candidato a defecto formal | baja |
| c | `co_order_type` es **NULL en 985 de 985 pedidos** del tenant: la app envía `idOrderType` y nunca `coOrderType`. **No hay pérdida de información** (se recupera con JOIN a `order_type`), pero cualquier reporte que lea esa columna da NULL siempre | baja |
| d | `nuAmountDiscountConversion` viaja en 0 debiendo valer ~0,588 (cálculo previo al envío, no de sincronización) | baja |
| e | La app **no exige el Nº de planilla** al depositar — explica el `nu_document` vacío del depósito Ref 1 de QA: es **permitido**, no un dato perdido | observación de validación |
| f | Fecha con +4 h al reabrir (zona horaria) — cosmético, **el dato no se corrompe** | cosmética |
| g | `CLT-BOTON-DESCARGAR-ADJUNTO-SINGULAR` — en clientes potenciales el botón dice `Descargar Adjunto`; en los otros 6, `Descargar adjuntos` | trivial |

## 8. Observaciones de DATOS del cliente (no son defectos de la app)

| # | Dato | Efecto |
|---|---|---|
| a | 🔴 **`client_avg_product` apunta a 25 códigos de cliente que NO EXISTEN** en `client` (formato viejo `C000799` vs los RIF `J-…`). Cruce: **0 de 25** | El pedido sugerido no puede calcular promedios reales. En inventarios cae al fallback `sugerido = currentStock` (dio 11 y 5, no 0) |
| b | `return_type` tiene **6 de 9 filas con `co_operation='D'`** — la basura de pruebas ("hola", "prueba", "PruebaTovar") **no llega a la app**. Los tipos reales son Calidad / PostVenta / Servicio | ninguno — corrige el perfil |
| c | Las **4 cuentas bancarias del cliente son `coCurrency:"BS"`**, incluida la rotulada *"VENEZUELA USD$"* ⇒ con moneda USD el selector de banco ofrece 0 opciones | Impide depositar en USD |
| d | `nu_credit_limit` = 1e16 en el maestro · `nu_document` con el literal `"NULL"` en documentos de venta | ruido de datos |
| e | El catálogo activo de actividades de visita son **11**, no 5 | corrige el perfil |

## 9. Defectos conocidos que **NO** reprodujeron aquí

| Defecto | Resultado |
|---|---|
| `COB-RET-TOTAL-CERO` (detalle de retención en `0,00`) | 🟢 **No reproduce** — verificado en las 3 retenciones históricas (refs 7, 13, 17) y en la Ref 30 de hoy |
| `DM-DEP-018/019/020` (lista BUSCAR no renderiza tras guardar) | 🟢 **No reprodujo** en los 2 accesos. Sigue intermitente |
| Saldos cruzados / crédito multiplicado (familia globalmp) | 🟢 No reproduce — 3.ª playa consecutiva |
| `DEP-BANCO-CODIGO-CRUDO` en cobros | 🟢 `detalleCobro` **sí** resuelve el nombre del banco: el defecto es exclusivo de depósitos |

---

## VGs y pendientes del perfil — resueltos en esta corrida

Los **5 pendientes** que el perfil `grupo_fiel.yaml` dejó abiertos al crearse quedan **todos cerrados**:

| # | Pendiente | Veredicto | Evidencia |
|---|---|---|---|
| 1 | `esVendedor` (no venía en los dumps) | ✅ **TRUE** | heading `<h1>Vendedor</h1>` + acordeón de empresa con KPIs reales (Cartera 60, Venta Real Mes 7.882,84 CJA) + tile en HOME. Coherente con `co_role=7` |
| 2a | Contradicción **IGTF** (`userCanSelectIGTF=false` vs `igtfDefault`/`disableCheckIGTF=true`) | ✅ **manda `userCanSelectIGTF=false`** | 0 coincidencias de `/igtf/i` en las 5 tabs del formulario y en el Tab Total de los 6 cobros. `igtfDefault` y `disableCheckIGTF` son **inertes** |
| 2b | Contradicción **TASA** (`canChangeRate=true` vs `enabledManualRate=false`) | ✅ **manda `enabledManualRate=false`** | `#manualRateInput` no existe; el control **es un `ion-select` de 1 sola opción**, no un `ion-input` ⇒ no aplica el patrón `readonly` de el_palmar |
| 3 | Que NO exista selector de empresa | ✅ **confirmado en la app** · ⚠ **en la WEB sí existe** (1 sola opción, preseleccionada) — divergencia leve e inocua |
| 4a | Alcance de `requiredComment` | ✅ **SOLO COBROS** | Medido módulo por módulo: cobros **bloquea las 4 tabs** hasta llenarlo · clientes no dirimible · devoluciones, inventarios, depósitos y visitas **no lo exigen** |
| 4b | Alcance de `expirationBatch` | ✅ **SOLO INVENTARIOS** | Devoluciones envía lote y vencimiento vacíos y persisten así · Inventarios **rechaza**: *"Complete cantidad, unidad, fecha y lote para continuar"*. **El bloqueante es el LOTE** (la fecha nace en HOY) |
| 5 | Moneda del catálogo de productos | ✅ **BS** | El catálogo llega en BS; no reprodujo el falso-FAIL de el_palmar |

**Extra confirmado:** `pricelistByOrderType=true` **funciona end-to-end** — cambiar de tipo B a A cambió el precio
de los 4 productos (1.5LTS 3.756,66 → 3.238,50 BS) y la lista de `02` a `03`, verificado hasta `order_detail`.
En el detalle de Productos el mismo selector recalcula 4,87 → 4,20 USD.

---

## Correcciones aplicadas durante la corrida

| # | Qué | Por qué |
|---|---|---|
| 1 | 🔧 **`cotejo-payload.js` — clave de emparejamiento corregida** en `client_stock_detail_unit` y `order_detail_unit`: de `co_product_unit` a la **PK de negocio** (`co_client_stock_detail_unit` / `co_order_detail_unit`) | `co_product_unit` **no es único** cuando el mismo producto se inventaría en 2 ubicaciones (dep/exh) — el escenario **normal** del módulo. Producía `BD-FIELD-MISMATCH` **falsos**. Medido: 6 filas, 6 PK distintas, solo 2 `co_product_unit`. Verificado antes/después: inventario Ref 2 pasó de MISMATCH a **BD-FIELD-OK**, y el pedido 1356 siguió OK (no-regresión) |
| 2 | **DM-PRD-013 corregido de 🚫 N-A a ✅ PASS** | El N/A ("1 sola lista") se asignó **sin abrir nunca el detalle**, por el mismo bloqueo de timing que tumbó a 012/020/021. El rescate midió **2 listas** con recálculo correcto |
| 3 | **3 casos BLOCKED de Productos rescatados a PASS** (012, 020, 021) | El selector `product-detail` **era el correcto**; falló por **timing** (el detalle monta a ~2.500 ms, se esperaban 1.200) y porque `product-list` **se desmonta** en vez de ocultarse. La URL nunca cambia (`/productos` para estructuras, lista y detalle) ⇒ no sirve de oráculo |
| 4 | **6 líneas de ledger de Login reconstruidas** | El agente de Login reportó haberlas escrito y no lo hizo; se reconstruyeron desde su reporte |
| 5 | **Perfil `grupo_fiel.yaml`: slug de BD corregido** | Decía que el bloque de `qa-db.env` era `"grupo fiel"` con espacio; hoy los 3 bloques usan `grupo_fiel`. Con espacio da `database "grupo fiel" does not exist` |

## Diagnósticos previos desmentidos (por evidencia de esta misma corrida)

1. **`ADJ-DESCARGA-NO-ENTREGA-ZIP` no era por el `onclick` faltante.** El botón **sigue** siendo un
   `button type="submit"` sin `onclick` y **aun así entrega el ZIP** en los registros nuevos. La causa real era la
   misma que la del visor: el servlet no encontraba los archivos y devolvía la página.
2. **El oráculo del total de un cobro estaba mal.** Es `Σ(columna «Monto a pagar» de los documentos)`, válido para
   `co_type` 0 y 2. La forma `Σ(Saldo) − dcto − ret − Dif + IGTF` **falla con `Pago parcial = SÍ`** (habría dado 2
   CALC-MISMATCH falsos, en los Refs 31 y 32): con pago parcial la diferencia **no** se refleja en
   `Diferencia/Faltante`.
3. **Tres notas de `web-selectors` que este build desmiente:** los filtros JSF **ya no persisten** a
   `browser_navigate`; `Limpiar` **sí** resetea las fechas en cobros; y **visitas SÍ tiene filtro de vendedor** en
   El Yaque (`[id$=":idSalesman_input"]`).
4. **`PRD-BUSCADOR-NO-REPUEBLA` no es universal por módulo:** aplica en Productos (4.ª playa confirmada) pero
   **no** en pedidos, devoluciones ni inventarios de este build, donde vaciar el buscador **sí** repuebla.

## Falsas alarmas descartadas antes de reportarlas

| Sospecha | Realidad |
|---|---|
| "El filtro de fechas de visitas está roto" (devolvía 1 fila donde había 42) | **La primera búsqueda de `/pages/visitas` devuelve resultado rancio.** Desde la 3.ª, los conteos son exactos ⇒ hacer un `Buscar` de calentamiento |
| "El detalle de cliente potencial no muestra la Cédula/RIF" | Bug del parser: el marcado es `Cédula::` y el valor está en la línea siguiente. **El producto está bien** |
| "El depósito guarda un solo pago" (falsa alarma histórica de el_palmar) | **Se deposita la porción en EFECTIVO**, no el total. 3.ª confirmación: cobro 27 (95.000 ef) → depósito 1 de 95.000; cobro 32 (8.000 ef + 2.000 pm) → depósito 3 de 8.000 |
| "El tipo de pedido se pierde al enviar" (los pedidos de QA traían `co_order_type` NULL) | El tipo **viaja y persiste** vía `id_order_type`. La columna `co_order_type` es NULL en **985/985** pedidos: la app nunca la envía |
| "El selector de empresa llega sin asignar" (disabled + value null + "Seleccione…") | Con 1 sola empresa es **lo esperado**: los botones habilitan y el payload viaja con la empresa correcta. **Forzar el value es lo que rompe** |

---

## Contexto que condicionó la corrida

🔴 **Otro usuario trabajando en el mismo tenant, en simultáneo:** `jgomez` (`id_user 474` / `co_user 005`).
Entre las 15:35 y las 16:22 creó 4 cobros (33-36), 1 devolución, 1 cliente potencial, 1 depósito (`id_deposit=2`),
4 visitas (106, 108-110) y 2 pedidos (1357, 1358).

**Efectos gestionados, sin contaminación:**
- El agente de Depósitos **detectó solo** que el baseline del brief estaba viejo y lo rehízo antes de tocar la app.
- A Visitas se le inyectó la instrucción de filtrar por `id_user=463`. **`max(id)+1` no predijo la Ref**: jgomez
  consumió 108-110 y la nuestra salió **111**.
- Ningún registro ajeno fue atribuido a esta corrida.
- 💡 **Beneficio inesperado:** sus registros post-fix (cobros 34-36, visita 106, pedidos 1357-1358) fueron los que
  permitieron acotar la hora del fix del rutero a una ventana de 4½ minutos.

---

## Cobertura — lo que NO se cubrió, declarado

| Hueco | Motivo |
|---|---|
| **Creación de cobros** (16 casos N/A) | Decisión explícita de QA: solo lectura, por tiempo |
| **Adjuntos en las transacciones del móvil** | Instrucción de QA (ella creó por su cuenta la visita 107 con adjuntos) |
| **Adjuntos post-fix en clientes potenciales e inventarios** | **No existe ningún registro posterior al fix** en esos módulos ⇒ hueco de muestra, no veredicto |
| **M## en devoluciones, inventarios y depósitos** | Sin registros históricos (1 cada uno, y es de hoy) — confirmado en BD |
| **Muestreo de pedidos: 42 de 979** (~4 %) | Estratificado por mes × moneda × vendedor. **Los conteos sí se verificaron sobre el 100 %** en 7 ventanas de fecha |
| **Selector `Columnas`** (mostrar/ocultar) en la web | No probado en ningún módulo |
| **Paginación** en clientes potenciales, devoluciones, depósitos e inventarios | 1-3 registros: sin volumen que paginar |
| **Estado local del dispositivo** vía `local-query.js` / `cotejo-bd.js` | El dispositivo **no tiene `sqlite3`** ⇒ se suplió leyendo por `window.sqlitePlugin` desde CDP |

---

## Qué revisaría primero

> 🔴 **Lista revisada con QA el 2026-08-17, después del cierre.** De los 6 hallazgos web originales,
> **4 quedaron descartados o rebajados**: los nº 2 y 6 son la misma condición de datos y **no reproducen desde
> el 13/07**; el nº 5 era un **error de interpretación del agente** (la columna es un desglose, no un total);
> el nº 3 es de **severidad baja** porque solo afecta a un vendedor dado de baja. Ver cada uno.

**Lo único que va a desarrollo como defecto de la versión actual:**

1. **Backfill de los adjuntos previos al fix del rutero** (`ADJ-BACKFILL-PENDIENTE`) — hay datos productivos
   reales inaccesibles desde la web, y el fix nuevo ya demostró que la vía funciona.
2. **`DEP-BANCO-CODIGO-CRUDO`** — Depósitos muestra `7738` donde debería decir `BANESCO`, **en lista y en
   detalle**, mientras la misma web sí resuelve el nombre en cobros.

**Pendiente de verificación (no es defecto todavía):**

3. **Re-probar adjuntos en clientes potenciales e inventarios** con un registro nuevo — es el único hueco real
   de la verificación del fix. **Decisión de QA: se valida con el siguiente cliente (KRON)**, cuyos registros
   van a ser todos posteriores al fix.

**Consulta de producto, no defecto:**

4. **Pedidos de vendedores dados de baja** — el diagnóstico técnico está cerrado (el join va por `id_user`).
   Falta solo decidir si un vendedor de baja debe conservar su histórico visible. **QA considera que el
   comportamiento actual es aceptable**; lo que sí importaría es que desaparecieran pedidos de vendedores
   activos, y eso **no ocurre** (verificado: 0 casos).

---

*Generado por Claude Code · Orquestador Smoke · 2026-08-17*
