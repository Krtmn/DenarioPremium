# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_092435_smoke-completo` |
| Módulo | COBROS |
| Cliente | grupo_fiel — GRUPO FIEL, S.A. (GRUFISA) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db19 · `window.ng=true` · `sqlitePlugin` disponible |
| Playa | **El Yaque** — `http://denarioelyaque.ddns.net:8081/PremiumWS/services/` |
| Usuario | johana · `id_user` 463 · `co_user` '003' · 61 clientes |
| Empresa | ÚNICA `00001` GRUPO FIEL, S.A. (GRUFISA) — sin selector operable |
| Modo de corrida | 🔴 **SOLO LECTURA** (decisión QA) — **0 cobros creados, 0 Guardar, 0 Enviar** |
| Resultado | **18 PASS · 0 FAIL · 0 SKIP · 16 N/A · 0 BLOCKED** |

---

## 🔴 Registros creados en sistema

**NINGUNO.** Motivo: la responsable QA definió esta corrida de COBROS como **solo lectura**: no se creó
ningún cobro (ni normal, ni anticipo, ni retención), no se pulsó **Guardar** ni **Enviar** en ningún momento,
y no quedó ningún cobro en estado Guardado en el dispositivo.

**Evidencia dura de que no se persistió nada** (BD local vía `window.sqlitePlugin`, medida al inicio y al cierre
del módulo, idénticas):

| Oráculo | Al abrir el módulo | Al cerrar el módulo |
|---|---|---|
| `sqlite_sequence.collections` (techo histórico de inserts) | **18** | **18** ← un insert lo habría subido a 19 |
| filas en `collections` | 6 (`id_collection` 27-32, `st_delivery=1`) | 6 (idénticas) |
| `pending_transactions WHERE type='collect'` | 0 | 0 |
| `failed_transactions WHERE type='collect'` | 0 | 0 |
| ítems en BUSCAR con Estatus "Guardado" | 0 | 0 |
| ítems en BUSCAR con botón de basura | 0 | 0 |

> ⚠ **Nota de proceso.** Durante el mapeo de VGs se llegó a **llenar** el formulario de Nuevo Cobro en pantalla
> (cliente MP GELATO, comentario, 1 documento marcado y un pago Efectivo) para poder observar el cambio de color
> de la Diferencia y la lista real de métodos de pago. La responsable QA intervino durante esa fase; el formulario
> se cerró de inmediato con **"Salir sin guardar"** y nada se persistió (ver tabla de arriba). Se deja anotado
> porque llenar el formulario fue ir más lejos de lo que la consigna "abrirlo y mirarlo" habilitaba.

---

## SIN MANIFIESTO NI CAPTURA DE PAYLOAD — no es cobertura faltante

Como **no se envió ninguna transacción**, no hay POST `collectservice/collection` que capturar ni línea que
escribir en `_bd-manifest.jsonl`. El consolidado **no debe leer esto como un gap de cobertura**: es la consecuencia
esperada de una corrida de solo lectura. La verificación se hizo en el sentido inverso (nube → UI), ver §Verificación BD.

---

## Casos ejecutados (34)

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Menú con **COBRO · ANTICIPO/PREPAGO · RETENCIÓN · BUSCAR**. Sin IGTF ni 25%IVA → coherente con `userCanSelectIGTF=false` y `userCanCollectIva=false`; ANTICIPO y RETENCIÓN presentes → `cobroPrepago`/`cobroRetencion=true` ✔ |
| DM-COB-002 | ✅ PASS | 5 tabs (`default/documentos/pagos/total/adjuntos`); Documentos/Pagos/Total/Adjuntos `disabled=true`; `#clienteSelect` vacío; Guardar y Enviar `disabled=true` |
| DM-COB-004 | ✅ PASS | Cliente MP GELATO C.A. (J-504863246) + Comentario → **las 4 tabs habilitaron en el mismo tick** y Guardar pasó a `disabled=false` (par antes/después medido) |
| DM-COB-006 | ✅ PASS | Con Comentario vacío: `required=true` + `ion-invalid` + etiqueta literal **"¡Campo Obligatorio!"** y las 4 tabs siguen bloqueadas ⇒ `requiredComment=true` **sí aplica en cobros** |
| DM-COB-007 | ✅ PASS | 4 documentos de MP GELATO (B063148/B064155/B064925/B065805) + leyenda **Vigente/Vencido/A favor**. Σ Saldo = **361.024,51 BS** = exactamente el dato del perfil ✔ |
| DM-COB-008 | ✅ PASS | Checkbox de B063148 → Tab Pagos muestra **"Monto total a pagar BS: 85.004,67"** (= saldo del documento) |
| DM-COB-015 | ✅ PASS | Línea **"Total General BS: 295.639,02"** (Ref 27); presente y correcta en los 6 cobros leídos |
| DM-COB-033 | ✅ PASS | Selector Moneda cobro (2º `ion-select` de `app-cobro-general`) `disabled=false` con **2 opciones BS/USD** ⇒ `multiCurrencyCollection=true` ✔ |
| DM-COB-034 | ✅ PASS | Moneda Documento BS→USD ⇒ la lista **recarga a 0 documentos** (los 4 de MP GELATO son BS); vuelta a BS ⇒ reaparecen los 4 |
| DM-COB-041 | 🚫 N/A | cobros solo lectura (decisión QA) — exige Guardar el detalle de retención |
| DM-COB-042 | 🚫 N/A | cobros solo lectura (decisión QA) — encadena 041 y exige Guardar el cobro |
| DM-COB-009 | ✅ PASS | `#eventModal` abre con **5 métodos: Efectivo · Depósito · Transferencia · Otros · Pago Móvil** (sin Cheque) |
| DM-COB-040 | ✅ PASS | Efectivo → AGREGAR → monto = total (85.004,67) ⇒ **Diferencia BS 0,00 en azul** (`color: blue`) |
| DM-COB-012 | ✅ PASS | Monto 1.000,00 ⇒ `Diferencia BS: -84.004,67` **rojo**; monto 85.004,67 ⇒ `Diferencia BS: 0,00` **azul** |
| DM-COB-043 | ✅ PASS | Mismo par medido con `getComputedStyle`: `rgb(255,0,0)` → `rgb(0,0,255)` |
| DM-COB-014 | ✅ PASS | Tab Total con tabla de documentos + acordeones por método; totales no nulos (verificado en el form y en los 6 cobros) |
| DM-COB-016 | ✅ PASS | Tab Adjuntos con los 3 acordeones **Imágenes / Archivo / Firma** (`images`/`file`/`sign`) |
| DM-COB-018 | 🚫 N/A | cobros solo lectura (decisión QA) — exige Guardar |
| DM-COB-019 | 🚫 N/A | cobros solo lectura (decisión QA) — exige Enviar |
| DM-COB-022 | ✅ PASS | Lista con **6 cobros** + searchbar; búsqueda por cliente ("FARMA"→Ref 31) y por Nro Ref ("30"→Ref 30); empty-state **"No hay resultados"**; trash ausente (ningún cobro en Guardado) |
| DM-COB-024 | 🚫 N/A | cobros solo lectura (decisión QA) — no existe ningún cobro en Estatus **Guardado** (los 6 están "Por aprobar"); la mitad legible del caso (montos coherentes al reabrir) se cubrió en §Verificación BD |
| DM-COB-026 | 🚫 N/A | cobros solo lectura (decisión QA) — sin cobro Guardado que eliminar |
| DM-COB-020 | ✅ PASS | Back con cambios ⇒ dirty-guard `Denario Cobros` con **3 opciones**: `[Guardar y salir · Salir sin guardar · Cancelar]` |
| DM-COB-021 | ✅ PASS | **"Salir sin guardar"** (igualdad exacta) ⇒ el cobro nuevo **no aparece en BUSCAR** (6 ítems = baseline) ni en la BD local (`sqlite_sequence` intacta en 18) |
| DM-COB-038 | 🚫 N/A | cobros solo lectura (decisión QA) — "Guardar y salir" persiste el cobro |
| DM-COB-029 | 🚫 N/A | cobros solo lectura (decisión QA). El botón RETENCIÓN **existe** ✔ (`cobroRetencion=true`); la estructura de retención se leyó en el Ref 30 |
| DM-COB-028 | 🚫 N/A | cobros solo lectura (decisión QA). El botón ANTICIPO/PREPAGO **existe** ✔ (`cobroPrepago=true`); la estructura de anticipo se leyó en el Ref 29 |
| DM-COB-036 | 🚫 N/A | `userCanSelectIGTF=false` **confirmado en UI**: botón IGTF ausente del menú y 0 menciones de IGTF en las 5 tabs |
| DM-COB-044 | 🚫 N/A | idem 036 — sin selector de tasa IGTF que persistir |
| DM-COB-045 | 🚫 N/A | idem 036 |
| DM-COB-046 | 🚫 N/A | cobros solo lectura (decisión QA) — exige Guardar. El **pago parcial** se verificó por lectura en los Refs 31 y 32 |
| DM-COB-047 | 🚫 N/A | cobros solo lectura (decisión QA) — exige Guardar el recálculo por Fecha Tasa |
| DM-COB-037 | 🚫 N/A | `userCanCollectIva=false` **confirmado en UI**: botón 25%IVA ausente y 0 menciones de "25 %" en el formulario |
| DM-COB-039 | 🚫 N/A | cobros solo lectura (decisión QA). Rama (A) además **estructuralmente imposible**: `#manualRateInput` no existe |

**Totales: 18 PASS · 0 FAIL · 0 SKIP · 16 N/A · 0 BLOCKED.**

---

## Verificación BD — cotejo UI ↔ nube (read-only, sin baseline-diff)

Como no se creó nada, no hay diff que hacer. En su lugar se recorrió el sentido inverso: **los 6 cobros que la QA
cargó hoy en la nube se abrieron uno por uno en el móvil y se cotejaron campo a campo**. Slug de BD: `grupo_fiel`.

Contexto de la tabla `collection` en la nube: **32 cobros en total**, repartidos `id_user` 462 → 25 · **463 (johana) → 6** · 473 → 1.

| Ref | `co_type` | Cliente (UI) | Moneda | Tasa UI ↔ `nu_value_local` | Total UI ↔ `nu_amount_total` | Docs / Pagos | Marca |
|-----|-----------|--------------|--------|---------------------------|------------------------------|--------------|-------|
| **27** | 0 normal | COMPLEJO MEDICO SAN LUCAS, C.A | BS | 748,79 ↔ 748,79 ✔ (**tasa propia**) | 295.639,02 ↔ 295.639,02 ✔ | 1 doc `A020358` ✔ · 2 pagos: ef 95.000,00 + tr 200.639,02 ✔ | **BD-OK** |
| **28** | 0 normal | DISTRIBUIDORA J & X C.A | BS | 771,07 ↔ 771,07 ✔ | 109.000,00 ↔ 109.000,00 ✔ | 1 doc `B065582` ✔ · 1 pago **pm** 109.000,00 ✔ · **Ret.IVA 3.000,00 + Ret.ISLR 111.111,98** ✔ | **BD-OK** |
| **29** | **1 anticipo** | GRUPO COMERCIALIZADORA FERCO | **USD** | 771,07 ↔ 771,07 ✔ | 100,00 ↔ 100,00 ✔ | **0 docs** ✔ (sin tabla de documentos) · 1 pago **ot** "test_otros_$" 100,00 ✔ | **BD-OK** |
| **30** | **2 retención** | ENTIDAD TURISTICA OCEANIA, CA | BS | 771,07 ↔ 771,07 ✔ | 2.200,00 ↔ 2.200,00 ✔ | 1 doc `B065428` ✔ · **0 pagos** ✔ · IVA 1.500,00 + ISLR 700,00 = 2.200,00 ✔ | **BD-OK** |
| **31** | 0 normal | FARMA VID DR PORTILLO, CA | **USD** | 771,07 ↔ 771,07 ✔ | 100,00 ↔ 100,00 ✔ | 1 doc `B064821` (Monto Doc. 114,17 / **Monto Pago 100,00**) ✔ · 1 pago **ef** 100,00 ✔ · `in_payment_partial=true` | **BD-OK** |
| **32** | 0 normal | GRUPPO SAPORI DI CALABRIA, CA | BS | 771,07 ↔ 771,07 ✔ | 10.000,00 ↔ 10.000,00 ✔ | 1 doc `B065289` ✔ · 2 pagos: ef 8.000,00 + pm 2.000,00 ✔ · Ret.IVA 1.000,00 + ISLR 1.355,00 ✔ · parcial | **BD-OK** |

**Resultado: 6/6 BD-OK. Cero mismatch.** Cada cobro lleva su propia tasa y la UI la respeta (27 con 748,79 frente a 771,07 en los otros cinco).

### Confirmaciones puntuales del cotejo

- ✅ **Oráculo del total confirmado, incluido el caso trampa.** `Total a pagar = Σ(columna «Monto a pagar»)` cuadra
  en los 6. En el **Ref 31** (`Pago parcial = SÍ`) la UI muestra `Monto Doc. 114,17` y `Monto Pago 100,00`, con
  **`Diferencia 0,00`** — es decir, la diferencia **no** refleja los 14,17 faltantes. Usar la fórmula
  `Σ(Saldo) − dcto − retenciones − Σ(Dif)` habría producido dos falsos mismatch (Refs 31 y 32). El oráculo corregido es el bueno.
- ✅ **`co_type=2` (Ref 30): el saldo NO participa.** El acordeón rotula `Monto Doc. BS: 768.959,27` (el saldo del
  documento) pero el `Total a pagar` es **2.200,00 = Ret.IVA + Ret.ISLR**, exactamente como dicta el oráculo.
- ✅ **`nu_collection_payment` es el BANCO EMISOR, no un importe** — reconfirmado por render: el Ref 28 trae
  `nu_collection_payment='BANCO VENEZUELA'` y la UI lo rotula literalmente **"Banco Emisor: BANCO VENEZUELA"**,
  mientras `na_bank` sale como **"Banco Receptor"**. El importe vive en `nu_amount_partial`. Es un **string**, no un número.
- ✅ **`st_collection` NO es traducible por el catálogo `statuses`** — reconfirmado: los 6 tienen `st_collection=3`
  y la UI los rotula **"Por aprobar"** (no "Guardado", que es lo que sugeriría la constante `COLLECT_STATUS_SAVED=3`).
  Diagnosticar el estado por el catálogo lleva a conclusiones falsas.
- ⚠ **La columna "Monto Doc." NO significa lo mismo en las dos vistas.** En la tabla de `co_type=0` muestra el
  **`nu_amount_doc`** real (Ref 28: 258.809,90, no el saldo 223.111,98), pero en el **acordeón de retención de
  `co_type=2`** muestra el **saldo**. La nota de `[el_palmar-20260805]` valía solo para el acordeón: **acotada, no contradicha**.
- ❌ **Defecto cosmético reconfirmado (ya conocido de globalmp):** en el acordeón de retención del Ref 30 la fecha
  del documento se imprime como **timestamp ISO crudo**: `Fecha del documento: 2026-08-01T04:00:00.000+00:00`.
  Cosmético, no bloquea. No se cuenta como FAIL por ser defecto ya registrado.

---

## 🔑 Veredicto — ORIGEN DEL HISTORIAL de cobros del móvil

> ### El BUSCAR de cobros **SE DESCARGA DEL SERVIDOR**, filtrado por vendedor.
> Comportamiento **tipo `difranca`**, NO tipo `el_palmar` (que es 100 % local).

La prueba es limpia porque **este dispositivo nunca creó un cobro**: los 6 que muestra la lista fueron cargados
por la QA **directamente en la nube** el mismo día, y aun así bajaron al móvil.

| Evidencia | Dato |
|---|---|
| Cobros en la lista del móvil | **6** — Refs 27, 28, 29, 30, 31, 32 |
| Esos mismos cobros en la nube | los 6, todos `id_user=463` (johana) |
| Cobros creados en este dispositivo | **0** |
| `id_collection` de las filas locales | **27-32 — PKs del servidor**, no ceros |
| `st_delivery` de las 6 filas locales | **1** (= vinieron resueltas, no en cola) |
| Total de cobros en la nube | **32** (462→25 · **463→6** · 473→1) |
| Cobros de OTROS vendedores visibles en el móvil | **0** |
| `sqlite_sequence.collections` vs `count(*)` | **18 vs 6** ⇒ 12 filas insertadas y luego borradas |

El par `sqlite_sequence=18 / count(*)=6` es el detalle decisivo: la tabla local **se limpia y se re-inserta**
en cada sincronización desde el servidor. Si el historial fuera puramente local, filas nunca creadas en el
dispositivo no podrían existir, y menos con la PK del servidor.

**Criterio del recorte: los cobros del VENDEDOR logueado** (`id_user=463`), no una ventana de fechas ni el
histórico completo. Con solo 6 cobros de johana en la nube no se puede determinar si además hay un tope tipo
"los N más recientes" como los 100 de difranca — haría falta un vendedor con más de 100 cobros para medirlo.

⚠ **Consecuencia operativa:** en grupo_fiel **nunca marcar FAIL por "faltan cobros en la lista"** sin antes
contrastar `count(*)` local contra `count(*) WHERE id_user=463` en la nube. Comparar contra el total de la tabla
(32) daría un falso hallazgo de cobertura.

---

## VGs resueltas por observación

### 🔴 CONTRADICCIÓN 1 — IGTF · **RESUELTA: manda `userCanSelectIGTF=false`**

`userCanSelectIGTF=false` vs `igtfDefault=true` + `disableCheckIGTF=true`.

**Veredicto: la que manda es `userCanSelectIGTF`.** El IGTF **no existe en la UI**:

- El menú COBROS **no tiene botón IGTF** (solo COBRO / ANTICIPO/PREPAGO / RETENCIÓN / BUSCAR).
- Barrido `/igtf/i` sobre el `innerText` de **las 5 tabs** del formulario (General, Documentos, Pagos, Total,
  Adjuntos) → **0 coincidencias**, con cliente y documento ya cargados.
- Barrido `/igtf/i` en el Tab Total de los 6 cobros existentes → **0 coincidencias**.
- Coherente con la nube: los 6 cobros traen `has_igtf=false` y `nu_amount_igtf=0`.

⇒ `igtfDefault`/`disableCheckIGTF` son **inertes** cuando `userCanSelectIGTF=false`. **DM-COB-036/044/045 = N/A estructural** (no por dato).

### 🔴 CONTRADICCIÓN 2 — TASA · **RESUELTA: manda `enabledManualRate=false`**

`canChangeRate=true` vs `enabledManualRate=false`.

**Veredicto: la tasa NO es editable a mano.** Y el hallazgo relevante es que **en este build la tasa ni siquiera es un `ion-input`**:

| Observación | Dato |
|---|---|
| `#manualRateInput` | **NO EXISTE** en el DOM ⇒ `enabledManualRate=false` ✔ |
| Control de tasa en Tab General | es un **`ion-select`**, no un `ion-input` — rotula `"771,07 BS"` |
| Opciones de ese `ion-select` | **1 sola** ⇒ no hay tasa alterna elegible |
| `disabled` del selector | `false` (habilitado, pero con una única opción) |

⇒ **No aplica el patrón `readonly` de el_palmar: acá directamente no hay input de tasa que leer.** La única vía
de cambio de tasa que ofrece la UI es el botón **Fecha Tasa** (`14/8/2026`), coherente con `canChangeRate=true` +
`historicoTasa=true`. Sobre `showExchangeRateSelector=false`: **hay** un selector de tasa, pero con una sola
opción, así que es funcionalmente indistinguible de no tenerlo — **la VG no queda desmentida**.

### 🔴 `requiredComment` — **RESUELTO: SÍ es obligatorio en COBROS**

Lo que no se pudo dirimir en CLIENTES (allá los 8 campos eran obligatorios) queda cerrado acá con el par medido:

| Momento | Comentario | `required` | clase | Tabs 2-5 | Guardar |
|---|---|---|---|---|---|
| Tras elegir cliente | vacío | `true` | `ion-invalid` + **"¡Campo Obligatorio!"** | `disabled=true` | `disabled=true` |
| Tras llenar el comentario | "QA lectura 20260817" | `true` | válido | **`disabled=false`** | **`disabled=false`** |

⇒ **`requiredComment=true` gobierna COBROS**: el comentario es el **único** campo que bloquea las tabs
(el Responsable, `#currency`, llega `required=false`). Alcance acotado y confirmado.

### Métodos de pago realmente ofrecidos — **VG cumplida 6/6**

`colletionPayment = "true-false-true-true-true-true"`. Lista real del `#eventModal`:

| Posición de la VG | Valor | Ofrecido en la UI | ✔ |
|---|---|---|---|
| 1 Efectivo | true | **Efectivo** | ✔ |
| 2 Cheque | **false** | **ausente** | ✔ |
| 3 Transferencia | true | **Transferencia** | ✔ |
| 4 Depósito | true | **Depósito** | ✔ |
| 5 Otros | true | **Otros** | ✔ |
| 6 Pago Móvil | true | **Pago Móvil** | ✔ |

**5 métodos ofrecidos, sin Cheque — coherencia perfecta con la VG.** Corroborado además por uso real en la BD
local (`SELECT co_payment_method, count(*) FROM collection_payments GROUP BY 1` → `ef` 3 · `pm` 2 · `ot` 1 · `tr` 1).

### Otras VGs observadas

| VG | Esperado | Observado | Veredicto |
|---|---|---|---|
| `userCanCollectIva=false` | sin 25 % IVA | botón ausente del menú · 0 menciones de "25 %" en el form | ✔ coherente |
| `userCanSelectCollectDiscount=false` | sin descuento | 0 menciones de "descuento" en las 5 tabs | ✔ coherente |
| `retencion=true` | columnas Ret. IVA/ISLR en Tab Total | presentes en Refs 28 y 32 (tabla de 6 columnas) | ✔ coherente |
| `cobroRetencion=true` | botón RETENCIÓN | **presente** | ✔ coherente |
| `cobroPrepago=true` | botón ANTICIPO | **presente** (rotula "ANTICIPO/PREPAGO") | ✔ coherente |
| `multiCurrencyCollection=true` | selector moneda cobro con ≥2 opciones | habilitado, **BS + USD** | ✔ coherente |
| `enablePartialPayment=true` | pago parcial operativo | confirmado por dato en Refs 31 y 32 (`in_payment_partial=true`) | ✔ coherente |
| `enterpriseEnabled=false` | sin selector de empresa | `ion-select` de empresa **`disabled=true`, 1 sola opción** | ✔ coherente |
| `requiredCollectionAttachments=false` | envío sin adjunto | no verificable sin enviar un cobro | ⚪ no verificable |
| `sizeRetention=14` · `formatRetention="2"` | comprobante de 14 caracteres | no verificable sin abrir el detalle de retención para editar. **Dato indirecto de la nube:** los comprobantes de los Refs 28/30/32 tienen **14 dígitos** (`33333211525264`, `27472772738244`, `14242425251511`) ⇒ compatible con `sizeRetention=14` | ⚪ parcial |
| `tolerancia0` · `MonedaTolerancia=USD` | tolerancia por importe | no verificable sin crear un cobro con diferencia | ⚪ no verificable |
| `validateCollectionDate` · `clientBankAccount` · `currencyBank` | — | no verificable sin crear un cobro | ⚪ no verificable |

> Las marcadas ⚪ quedan como **"no verificable sin crear cobro (corrida en solo lectura por decisión QA)"**.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **El `ion-select` de Moneda Documento abre un `ion-alert` con radios, y su `value` es un OBJETO** | universal (variante por control) | La asignación programática `s.value='USD'` + `ionChange` **NO surte efecto** (el shadowRoot queda en `""` y la lista no filtra) — se lee como "el filtro de moneda está roto" y casi produce un FAIL falso. El `value` real es el objeto `{idCurrencyEnterprise,idCurrency,coCurrency,localCurrency,hardCurrency,coEnterprise,idEnterprise}`, así que un string nunca matchea. **Receta: click real en el `ion-select` → `ion-alert` con botones `[Moneda, BS, USD, Cancel, OK]` → 2 clicks (opción, luego acción) por igualdad exacta.** Reconfirma en COBROS el quirk ya visto en PEDIDOS/grupo_fiel. ⚠ **El botón de acción se rotula `OK` y el de cancelar `Cancel` — en INGLÉS**, mezclados con opciones en español: matchear por `includes` es doblemente peligroso. `[grupo_fiel-20260817]` |
| **La TASA del cobro puede ser un `ion-select`, no un `ion-input`** | universal (por build) | En v1.0/db19 El Yaque el control de tasa del Tab General es un **`ion-select`** que rotula `"771,07 BS"`, con `#manualRateInput` **ausente**. Buscar el par `(disabled, readonly)` de un `ion-input` —la receta de `[el_palmar-20260805]`— **no encuentra nada** y se concluye erróneamente "no hay campo de tasa". **Antes de juzgar `enabledManualRate`/`canChangeRate`, comprobar de qué TIPO de control se trata**, y contar sus opciones: 1 sola opción ⇒ no hay tasa alterna aunque el selector esté habilitado. `[grupo_fiel-20260817]` |
| **`sqlite_sequence` como prueba NEGATIVA (no se creó nada)** | universal | En una corrida de solo lectura, comparar `sqlite_sequence.<tabla>` al abrir y al cerrar el módulo demuestra que **no hubo ningún insert** (18 → 18), incluso tras llenar un formulario y descartarlo. Es evidencia más fuerte que "la lista sigue igual" (que solo prueba render) y **la única forma de responder con certeza "¿quedó algo Guardado?"**. Uso nuevo, hermano de los ya registrados (borrado-vs-nunca-llegó e idempotencia). `[grupo_fiel-20260817]` |
| **El origen del historial de COBROS es por PLAYA: acá SE DESCARGA del servidor, filtrado por vendedor** | cliente (grupo_fiel) | 3.er dato de la serie `el_palmar` (100 % local) vs `difranca` (descarga del servidor). grupo_fiel = **descarga**, con la prueba más limpia posible: el dispositivo **nunca creó un cobro** y aun así ve los 6 que la QA cargó en la nube ese mismo día, con `id_collection` del servidor y `st_delivery=1`. Filtro = `id_user` del vendedor logueado (nube 32 cobros → móvil 6). **Sigue sin ser universal: verificarlo por playa.** `[grupo_fiel-20260817]` |
| **`PRD-BUSCADOR-NO-REPUEBLA` NO reproduce en COBROS de este build** | cliente (grupo_fiel) | RUNTIME §3 lo da por **universal en 3 playas**. Acá, vaciar el searchbar de `app-cobros-list` + `Enter` **repobló la lista a los 6 cobros** (`filteredItems` 0 → 6), sin necesidad de re-entrar a la estructura. ⇒ el patrón **no es universal**; conviene degradarlo a "frecuente, verificar por módulo/build" en vez de darlo por hecho. `[grupo_fiel-20260817]` |
| **El buscador de la lista de cobros NO indexa el nº de documento** | cliente (grupo_fiel) | Filtra por **nombre/código de cliente** y por **Nro Ref**, pero buscar `B065582` (el documento del Ref 28) devuelve `0` y el empty-state "No hay resultados". No es defecto (el guion no lo exige) pero **evita perder intentos** buscando un cobro por su factura. `[grupo_fiel-20260817]` |
| **La variante del selector de EMPRESA en COBROS: sin `formcontrolname`, `disabled=true`, 1 opción** | universal (amplía la tabla) | Fila nueva para la tabla de variantes de `_comunes.md`: en **COBROS** el `ion-select` de empresa llega **sin `formcontrolname`**, `disabled=true`, `value` = objeto, **1 sola opción** rotulada `"GRUPO FIEL, S.A. (GR"` (`lb_enterprise` truncado). Fuera de la validación: no hay nada que setear. Coherente con `enterpriseEnabled=false` + 1 empresa. `[grupo_fiel-20260817]` |
| **"Monto Doc." significa cosas distintas según la vista** | universal | En la **tabla** del Tab Total de `co_type=0` muestra `nu_amount_doc` (el monto real de la factura); en el **acordeón de retención** de `co_type=2` muestra el **saldo**. **Acota** —no contradice— la nota de `[el_palmar-20260805]`, que estaba enunciada como si valiera para toda la vista. Cotejar contra el campo que corresponda a cada una. `[grupo_fiel-20260817]` |
| **El selector de tabs `ion-segment.value` + `ionChange` es fiable en cobro abierto y en form nuevo** | universal (reconfirma) | 100 % de acierto en ~20 cambios de tab de esta corrida, sin un solo click en `ion-segment-button`. Reconfirma `[difranca-20260807]`. Ídem expandir todos los acordeones del Tab Total de una con `grp.value=[todos los .value]`+`ionChange`. `[grupo_fiel-20260817]` |
| **Navegación lista→detalle→lista: 1 back devuelve al MENÚ, no a la lista** | universal (reconfirma) | 3.ª playa que lo confirma. Hay que volver a pulsar **BUSCAR** cada vez. Ciclo repetido 6 veces sin un fallo con `img.fechaAtras` filtrando `width>0 && x<100`. `[el_palmar-20260805][difranca-20260807][grupo_fiel-20260817]` |
| **Etiquetas del dirty-guard de COBROS** | cliente (grupo_fiel) | Title `Denario Cobros`, **message vacío**, botones `[Guardar y salir · Salir sin guardar · Cancelar]`. Detectar por BOTONES, nunca por message. **Igualdad exacta obligatoria**: cualquier regex `/salir/i` matchea *"Guardar y salir"* y **dispara un guardado no deseado** — crítico en una corrida de solo lectura. `[grupo_fiel-20260817]` |
| **`window.__qaC` ya estaba tomado por un agente anterior** | universal (higiene) | La receta "un namespace por módulo" **colisionó**: `__qaC` existía con otras skills, y como el bundle es idempotente el `if (window.__qaC) return` devolvió las skills ajenas → `C.alertInfo is not a function`. **Usar un sufijo de módulo de 2-3 letras (`__qaCOB`) y no una sola inicial**, o verificar la firma antes de confiar en el namespace. `[grupo_fiel-20260817]` |

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

---

## Hallazgos

**Sin FAIL.** Dos observaciones menores, ninguna bloqueante:

1. ❌ **Cosmético (defecto ya conocido, reconfirmado):** en el acordeón de retención del Tab Total (`co_type=2`,
   Ref 30) la fecha del documento se imprime como timestamp ISO crudo —
   `Fecha del documento: 2026-08-01T04:00:00.000+00:00`— en vez de formateada. Ya registrado en globalmp 30/07/2026;
   **2.ª playa donde se observa**, lo que sugiere que es del componente y no de los datos.
2. ⚠ **Observación (no defecto):** el buscador de la lista de cobros no permite localizar un cobro por el número de
   documento que cobra. Es una limitación de alcance del filtro, no un incumplimiento del guion.

---

## Notas de cierre

- **Estado final: HOME alcanzable** — el módulo cierra en el menú COBROS / lista, sin formularios abiertos,
  sin alerts pendientes y sin overlays residuales.
- **Watchdog:** techo de 60 min, **0 cuelgues de CDP**, 0 `TIMEOUT`, 0 reconexiones. Ningún caso consumió más de
  2 intentos (el único que necesitó un 2.º fue DM-COB-034, por el quirk del `ion-select`→`ion-alert`).
- **Modo RECORD:** no solicitado por el orquestador ⇒ no se grabó traza.
