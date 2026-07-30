# REVISIÓN (solo lectura) — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260730_094753_smoke-completo` |
| Módulo | COBROS — **modo REVISIÓN, no smoke de creación** |
| Cliente | globalmp · empresa **00002** COMERCIALIZADORA GLOBAL M&P |
| Servidor | `http://denariolatortuga.ddns.net:8081/PremiumWS` · playa **la_tortuga** |
| Usuario | **YC01** YUSNEIDI CLEMENTE (id_user 307) |
| App | `com.kiberno.denarioPremiumPro` — versionApp 1.0 · db_version 19 · `window.ng=true` |
| Moneda / tasa | BS local · USD dura · **tasa 737,88** (BS→USD **divide**) |
| Resultado | **13 PASS · 2 FAIL · 1 ⛔ BLOCKED** |

> ⚠ Los casos `DM-COB-###` del smoke de creación **NO se ejecutaron**. Este agente **no creó, no editó,
> no envió y no borró ningún registro**. IDs propios de revisión: `DM-COB-REV-###`.

## 🔴 REGISTROS CREADOS EN SISTEMA: **NINGUNO**

Este agente operó **exclusivamente en modo lectura**: abrir cobros ya enviados, leer Tab General / Tab Total /
Tab Adjuntos, y consultar la BD **local** del dispositivo por CDP (`window.sqlitePlugin`, solo `SELECT`).
No se tocó el botón Guardar ni Enviar en ningún momento. No se usó cámara ni adjuntos.

## 🔴 Cobro en estatus GUARDADO — INTACTO

`ABASTO EL SITIO DSG (AS04)` · BS 337.763,36 · 09:08 · comentario `c1` · 4 adjuntos · `st_delivery=3`.
**No se abrió, no se editó, no se intentó enviar, no se borró.** Verificado únicamente por su fila en la lista
al inicio y al cierre de la revisión: sigue presente, **Estatus: Guardado**, sin Nro. Ref. Sin cambios.

---

## ⚠ HALLAZGO DE ALCANCE — hay **5** cobros enviados hoy, no 4

El volcado `_cobros-bd-local.md` se tomó antes de que QA enviara un cobro más. La lista y la BD local
muestran un **Ref 8356** del 30/07/2026 que no figura en el oráculo:

| Ref | Cliente | Tipo | Total BS | Conv. USD | Hora | Comentario | Adj. |
|---|---|---|---|---|---|---|---|
| **8356** | SM03 ABASTOS Y FRUTERIA SANTA MARGARITA, C.A. | 0 · Cobro | **175.622,82** | **238,01** | 09:49 | `am` | 2 |

Se verificó igual que los otros cuatro (ver DM-COB-REV-010/011). **Sus cálculos también cierran.**

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-REV-001 | ✅ PASS | **8352** cabecera: AR11 ABASTOS Y LICORERIA RICO SABOR · BS · tasa 737,88 · 30/7/2026 9:25 AM · Fecha Tasa 23/7/2026 · empresa 00002 |
| DM-COB-REV-002 | ✅ PASS | **8352** Tab Total: doc `037245` 83.734,62 − **Desc. 50,00** = **Monto Pago 83.684,62** = total; USD 113,41; Dif. 0,00; Total Transferencias BS 83.684,62 / USD 113,41 |
| DM-COB-REV-003 | ✅ PASS | **8353** cabecera: AS04 ABASTO EL SITIO DSG · BS · tasa 737,88 · 30/7/2026 9:27 AM · comentario `c1.2` |
| DM-COB-REV-004 | ✅ PASS | **8353** Tab Total: `FF081402` Ret.IVA 1.000,00 + Ret.ISLR 332,00 + Pago 20.000,11 = **21.332,11 = saldo**; total 9.000,00 + 20.000,11 = **29.000,11** / USD **39,30** |
| DM-COB-REV-005 | ✅ PASS | **8353 / `FF081401` — pregunta QA:** la app muestra **Desc. = 1.000,00** (el descuento manual, correcto). El 773,05 de `nu_amount_discount` se pinta en **otra columna: "Dev/Falt."**. Cierra: 9.000 + 1.000 + 773,05 = **10.773,05 = saldo** |
| DM-COB-REV-006 | ✅ PASS | **8354** cabecera RETENCIÓN: AS04 · BS · tasa 737,88 · etiqueta **"Fecha Retención"** 30/7/2026 9:29 AM · comentario `ret1` |
| DM-COB-REV-007 | ✅ PASS | **8354** Tab Total: `FF082166` IVA 700,00 + ISLR 400,00 = **1.100,00**; `FF082165` IVA 500,00 + ISLR 1.000,00 = **1.500,00**; total **2.600,00 / USD 3,53** |
| DM-COB-REV-008 | ✅ PASS | **8355** cabecera: AS04 · BS · tasa 737,88 · 30/7/2026 9:31 AM · comentario `c2` |
| DM-COB-REV-009 | ✅ PASS | **8355** Tab Total: `FF081402` pago 10.000,00 + `FF082165` pago 5.000,00 = **15.000,00 / USD 20,33**; pagos Depósito 1.500,00 (USD 2,03) + Transferencia 13.500,00 (USD 18,30) = 15.000,00; Dif. 0,00 |
| DM-COB-REV-010 | ✅ PASS | **8356** (no previsto) cabecera: SM03 · BS · tasa 737,88 · 30/7/2026 9:49 AM · comentario `am` |
| DM-COB-REV-011 | ✅ PASS | **8356** Tab Total: `035569` pago 90.523,12 + `035571` pago 85.099,70 = **175.622,82 / USD 238,01** (122,68 + 115,33); Dif. 0,00 |
| DM-COB-REV-012 | ✅ PASS | **Hipótesis del volcado resuelta: el valor multiplicado NO se muestra en ninguna pantalla de la app.** Ver sección dedicada |
| DM-COB-REV-013 | ❌ **FAIL** | **"Total Depósitos:" se muestra SIN formato** — 8355 `BS 1500` (debería `BS 1.500,00`), 8356 `BS 175622.82` (debería `BS 175.622,82`) |
| DM-COB-REV-014 | ❌ **FAIL** | **8354** retención: `Fecha del documento: 2026-07-20T04:00:00.000+00:00` — timestamp ISO crudo en pantalla |
| DM-COB-REV-015 | ✅ PASS | Cobro **Guardado** (AS04, BS 337.763,36) sigue en la lista, Estatus Guardado, sin Ref — intacto |
| DM-COB-REV-016 | ⛔ BLOCKED | Tab Adjuntos: los acordeones Imágenes/Archivo/Firma **no expanden por CDP** (2 intentos: asignación de `ion-accordion-group.value` + click real en el header). Limitación de automatización, no defecto |

---

## 🔴 LA PREGUNTA CLAVE — `nu_amount_paid_conversion` multiplicado

### Respuesta: **NO se ve en la app. El campo mal guardado es, hoy, INOCUO.**

Se recorrieron **todas** las pantallas alcanzables de un cobro enviado (Tab General, Tab Total con su tabla de
documentos y sus acordeones de retención, Tab Adjuntos) en los 5 cobros. **En ningún punto aparece un valor de
millones.** Los importes en USD que la app muestra son los correctos:

| Ref | `nu_amount_paid_conversion` en BD | Lo que la UI muestra en USD |
|---|---:|---:|
| 8352 | 61.749.207,41 | **113,41** ✅ |
| 8353 | 6.640.920,00 + 14.757.681,17 | **39,30** ✅ |
| 8355 | 7.378.800,00 + 3.689.400,00 | **20,33** ✅ |
| 8356 | 122,68 + 115,33 (correctos) | **238,01** ✅ |

Lo mismo con el descuento: `nu_amount_collect_discount_other_conversion` = 36.894 (8352) y 737.880 (8353)
**no se renderiza en ninguna parte**; la columna "Desc." muestra el monto **sin convertir** (50,00 / 1.000,00).

### Por qué es inocuo (confirmado en código fuente)

- `nuAmountPaidConversion` **no está bindeado en ningún `.html`** del proyecto (0 coincidencias).
- La app **recalcula la conversión al vuelo** para mostrarla, y los totales que pinta salen de la cabecera
  (`nu_amount_total_conversion`), que **sí está bien guardada** (113,41 / 39,30 / 3,53 / 20,33 / 238,01).

### La causa raíz (para el equipo de desarrollo)

`convertirMonto(monto, rate, currency)` — `src/app/services/collection/collection-logic.service.ts:2286-2299` —
elige multiplicar o dividir **según la moneda que se le pase como 3er argumento**. Todas las escrituras de
`nuAmountPaidConversion` a nivel de detalle le pasan la moneda **del documento** (rama multiplicar) en vez de la
moneda **del cobro** (rama dividir):

- `cobro-documents.component.ts:2007-2011` (`saveDocumentSale`), `:2138-2142` (`saveStatusDocument`), `:2226-2230`
- `collection-logic.service.ts:3376-3380`, y el caso más claro en `:5098-5108`, donde la **misma función** recibe
  `documentCurrency` para el pagado y `this.collection.coCurrency` para el IGTF, en líneas consecutivas.
- Mismo patrón en el descuento: `cobro-documents.component.ts:4243` y `:4263-4267`.
- **Por qué la retención (8354) está bien:** la rama `coType==='2'` pasa siempre `this.collection.coCurrency`
  (`collection-logic.service.ts:1156-1160`, `:1724`, `:1798-1802`; `cobro-documents.component.ts:2282-2288`).
  El guard `if (coTypeModule != "2")` es literalmente lo que produce la asimetría.

### 🔶 Riesgo latente — una vía por la que SÍ podría llegar a pantalla

`resolvePersistedNetAmountSumConversion` (`collection-logic.service.ts:1413-1418`) **usa el valor almacenado**
—sin recalcular— cuando `detail.inPaymentPartial === true`, y esa suma alimenta `montoTotalPagarConversion`,
que se pinta en `cobro-total.component.html:43`.

**8355 es exactamente ese caso** (`in_payment_partial=true` en sus dos documentos, y en el modelo cargado el
flag es un `boolean true` real con `nuAmountPaidConversion = 7.378.800 / 3.689.400`). Aun así la pantalla
muestra **20,33** correcto, porque el total desplegado se resuelve desde la cabecera persistida.

⇒ **Hoy no es un defecto visible**, pero la ruta existe. Si un cambio futuro hace que ese `netFromDocuments`
gane precedencia sobre la cabecera, el usuario vería **US$ 11.068.200,00** en un cobro de BS 15.000.
**Recomendación:** corregir el 3er argumento de `convertirMonto` en las escrituras de detalle, sin esperar a
que se manifieste. Los datos **ya están mal en la BD local** de todos los cobros tipo 0 con documento editado.

### Precisión sobre la hipótesis del volcado

El volcado decía *"multiplicado sólo en los cobros normales (tipo 0)"*. **Es más fino que eso:** el 8356 es
tipo 0 y sus conversiones **están bien**. El discriminador real es **si el monto pagado difiere del saldo del
documento**, es decir, si el usuario tocó el detalle del documento (descuento, retención o pago parcial):

| Cobro | Documento | Pagado vs saldo | ¿editado? | `paid_conversion` |
|---|---|---|---|---|
| 8352 | `037245` | 83.684,62 ≠ 83.734,62 | descuento | ❌ multiplicado |
| 8353 | `FF081401` | 9.000 ≠ 10.773,05 | descuento | ❌ multiplicado |
| 8353 | `FF081402` | 20.000,11 ≠ 21.332,11 | retención | ❌ multiplicado |
| 8355 | ambos | parciales | pago parcial | ❌ multiplicado |
| 8354 | ambos | retención (tipo 2) | — | ✅ correcto |
| **8356** | **ambos** | **pago = saldo completo** | **no editado** | **✅ correcto** |

---

## Aclaración sobre `FF081401` (8353) — no es un descuento perdido

El volcado marcaba como sospechoso que `nu_amount_discount = 773,05` conviviera con un descuento manual de
1.000,00. **La UI lo aclara: son dos conceptos distintos y la fila cierra exacta.**

| Columna en Tab Total | Valor |
|---|---|
| Monto Doc. | 215.401,93 |
| **Dev/Falt.** | **773,05** |
| Retención IVA | — |
| Retención ISLR | — |
| **Desc.** | **1.000,00** |
| Monto Pago | 9.000,00 |

`9.000,00 + 1.000,00 (Desc.) + 773,05 (Dev/Falt.) = 10.773,05` = **saldo del documento**. ✅
`nu_amount_discount` en la BD local corresponde a **Devolución/Faltante**, no al descuento; el descuento vive
en `nu_amount_collect_discount` / `collection_detail_discounts` (= 1.000,00). Sin defecto.

---

## Hallazgos (FAIL)

### DM-COB-REV-013 — "Total Depósitos:" se muestra sin formato numérico · Severidad **S3 (cosmético)**

En el **Tab Total** de un cobro con método **Depósito**, la línea `Total Depósitos:` imprime el monto en BS
**crudo**, sin separador de miles ni decimales, mientras el resto de la pantalla (y la línea
`Total Transferencias:` justo al lado) sí está formateada.

| Ref | Muestra | Debería |
|---|---|---|
| 8355 | `Total Depósitos: BS 1500` | `BS 1.500,00` |
| 8356 | `Total Depósitos: BS 175622.82` | `BS 175.622,82` |

Contraste en el mismo cobro 8355: `Total Transferencias: BS 13.500,00` ✅ y `USD 2,03` ✅ (el lado USD del
depósito sí se formatea). Reproducido en **2 de 2** cobros con depósito. Solo afecta presentación.

**Pasos:** COBROS → BUSCAR → abrir un cobro enviado con pago por Depósito → Tab Total → mirar la línea
"Total Depósitos:".

### DM-COB-REV-014 — Fecha del documento en timestamp ISO crudo (retención) · Severidad **S3 (cosmético)**

En el **Tab Total** de un cobro de **RETENCIÓN**, al expandir el acordeón de cada documento:

```
Fecha del documento: 2026-07-20T04:00:00.000+00:00
```

Se muestra el timestamp ISO completo con zona horaria en vez de una fecha legible (`20/07/2026`). Afecta a los
2 documentos del Ref 8354. En el resto de la app las fechas sí se formatean (`Fecha Retención 30/7/2026, 9:29 A. M.`).

**Pasos:** COBROS → BUSCAR → abrir el cobro tipo Retención (Ref 8354) → Tab Total → expandir un `Nro. Doc.`.

---

## Verificación BD

**Nube: `BD-N/A`** — la BD nube de globalmp está sin GRANT (0 de 184 tablas); QA decidió correr sin ella.
`query.js` no se usó. **BD local del device: legible y usada como oráculo** vía `window.sqlitePlugin`.

| Ref | `st_delivery` | `id_collection` | Marca | Conclusión |
|---|---|---|---|---|
| 8352 | 1 = Enviado | 8352 | `BD-OK` (local) | UI ↔ BD local cuadran en cabecera, documentos, pagos y descuentos |
| 8353 | 1 = Enviado | 8353 | `BD-OK` (local) | idem, incluidas retenciones IVA/ISLR |
| 8354 | 1 = Enviado | 8354 | `BD-OK` (local) | retención por documento cuadra; conversiones correctas |
| 8355 | 1 = Enviado | 8355 | `BD-OK` (local) | pago parcial en 2 documentos + 2 pagos cuadran |
| 8356 | 1 = Enviado | 8356 | `BD-OK` (local) | cobro no previsto en el volcado; cuadra |
| — (Guardado) | 3 = Guardado | 0 | `BD-SAVED` | esperado — caso ya reportado por QA, **no tocado** |

`BD-INFO` — el campo `nu_amount_paid_conversion` está **mal grabado** (multiplicado por la tasa) en todos los
documentos editados de los cobros tipo 0; igual `nu_amount_collect_discount_other_conversion` y
`nu_amount_discount_conversion`. **No se refleja en la UI de la app** (ver sección de la pregunta clave).
Estos valores **ya viajaron al servidor**, por lo que conviene revisar qué hace la **web** con ellos.

`BD-INFO` — 8355: la cabecera declara `nu_attachments = 4` pero el `adjuntoService` cargado en el detalle
reporta `fotos: 2, files: 1`. No concluyente (no se pudo enumerar firmas, ver DM-COB-REV-016).

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **Cobro ENVIADO abre en modo lectura con solo 3 tabs** | universal | `General / Total / Adjuntos` — **no hay tab Documentos ni Pagos** (values `default`/`total`/`adjuntos`). Todo el detalle de documentos, descuentos y retenciones se lee en el **Tab Total**. No aplica `openDocumentDetail` en cobros enviados |
| **Tab Total: tabla de documentos con columnas DINÁMICAS** | universal | El nº de `ion-col` varía según lo que tenga el cobro: 5 col (Tipo/Nro.Doc./Monto Doc./Desc./Monto Pago) en 8352; 8 col (+ Dev/Falt./Ret.IVA/Ret.ISLR) en 8353; 4 col en 8356 sin descuento. **Leer las celdas por posición contra la fila de encabezado — nunca por índice fijo**, y no fiarse de `innerText` (las celdas vacías colapsan y desalinean el mapeo) |
| **Retención (co_type=2): el detalle vive en acordeones del Tab Total** | universal | Un `ion-accordion` por documento (`Nro. Doc.: FFxxxxx`) con Monto Doc./IVA/ISLR/Total retenido. Expandir con `grp.value = [todos los values]` + `ionChange` |
| **Abrir un cobro de la lista: click REAL en el `ion-item`** | universal | `onCollectSelect()` / `openCollect()` vía `window.ng` **NO navegan** (aun con `window.ng=true`). ⚠ Verificar que la fila esté **dentro del viewport** (`vh=744`): un `getBoundingClientRect()` con `y>744` da coords válidas pero el click no llega. Usar `scrollIntoView({block:'center'})` + re-medir + `elementFromPoint` antes de clickear |
| **`listCollect` es camelCase, `displayedItems` es snake_case** | universal | `collectService.listCollect[i].idCollection` / `.coCollection` vs `displayedItems[i].id_collection`. Buscar por el campo equivocado devuelve −1 en silencio |
| **Salida del form de un cobro enviado: 1 back = menú COBROS** | universal | `img.fechaAtras` lleva a `app-cobros` (menú), **no** a la lista → hay que volver a pulsar BUSCAR. **No apilar back programático + `mouse.click`**: sobre-navega hasta HOME. Un back por vez, verificando destino con `getActiveView` |
| **Botón BUSCAR del menú COBROS es `ion-button`, no `<p>`/`ion-label`** | universal | Localizar por `app-cobros ion-button` con `textContent==='BUSCAR'`; disparar Pointer(down/up) + `shadowRoot button.click()` |
| **BD local por CDP: `nu_amount_total`/`nu_amount` NO existen** | universal | La cabecera usa **`nu_amount_total`** en `collections`… el error real es que `nu_amount` no existe: descubrir el esquema con `SELECT name,sql FROM sqlite_master WHERE type='table' AND name LIKE 'collection%'` antes de consultar. Un nombre errado **aborta la transacción en silencio** |
| **Booleanos de SQLite llegan como STRING** | universal | `in_payment_partial` viene `"true"`/`"false"` (texto) desde `executeSql`, pero el modelo Angular lo expone como `boolean` real. Comparaciones `=== true` sobre la fila cruda siempre fallan |

## Notas de build (globalmp / La Tortuga v1.0)

- `window.ng = true` — el debug de Angular sirve para **inspeccionar** (`getComponent`, servicios), pero
  **no para conducir la navegación** de la lista de cobros. Refuerza la nota `[ferrenuestro-20260723]`.
- Estatus en lista: los cobros enviados hoy figuran como **"Por aprobar"**; los de días anteriores como
  **APROBADO** / **RECHAZADO**. El `st_collection=3` local es el mismo en todos.
- Viewport del device: **360 × 744**.
