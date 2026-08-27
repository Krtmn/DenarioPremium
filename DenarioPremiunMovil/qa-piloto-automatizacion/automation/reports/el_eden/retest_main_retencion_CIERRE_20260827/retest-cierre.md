# Retest de cierre — la retención y el saldo del documento · rama `main`

| Parámetro | Valor |
|---|---|
| Fecha | 2026-08-27 |
| Cliente QA | `el_eden` — EL EDEN IMPORT TCN, C.A. (`EDEN25_A`, empresa única) |
| Playa | **CARIBE** — `http://denariocaribe.ddns.net:8081/PremiumWS` *(descubierta en runtime desde el host del POST, no asumida)* |
| App | `com.kiberno.denarioPremiumPro` v1.0 build 1 · `db_version 21` · `window.ng = true` |
| Rama | `main` (APK recompilado 27/08 08:55) |
| Vendedor | WILLIAM PALENCIA · `id_user 306` / `co_user 009` |
| Cliente de prueba | `00069` — AUTOMERCADOS FRESCO MARKET AFN, C.A. - CLUB DE CAMPO |
| Moneda del cobro | **US$** · Tasa BS 757,54 |
| Cobro creado | **`# Ref 1037`** (`id_collection`) · `co_collection 1787837136856.0` · 3.583,28 US$ · **Enviado** |
| Componente acusado | `collection-logic.service.ts` → `applyRemainingBalanceDocAfterPartialPayment` (~1280) |

---

## 1. VEREDICTO POR CAPA

> ### 🟢 CAPA 1 — Pantalla (`Monto Saldo`, Tab TOTAL): **CORREGIDA**
> ### 🔴 CAPA 2 — Dato enviado (payload + `collection_detail.nu_balance_doc`): **SIGUE ROTA**
> ### 🔴 CAPA 3 — Web (`Saldo doc.`): **ROTA — propaga fielmente el dato de la capa 2**

### 🔴🔴 El hallazgo principal: la pantalla y la base de datos ahora **DIVERGEN**

Esto **no es «igual que antes»**. Es una situación **nueva y peor**.

| | `6.6.21.1` | **`main`** |
|---|---|---|
| Lo que ve el vendedor en pantalla | 79,00 ❌ | **54,00 ✅** |
| Lo que queda registrado en la nube | 79,00 ❌ | **79,00 ❌** |
| ¿Coinciden? | **Sí** — mal los dos, de forma consistente | **NO** |

En `6.6.21.1` el error era **visible**: la pantalla mostraba el mismo número equivocado que guardaba el
sistema, y cualquiera que mirara el móvil veía el problema. En `main` la pantalla se arregló y la base de
datos **no**: ahora **el vendedor ve 54,00 y el sistema registra 79,00**.

⇒ **Para quien concilia, esto es peor que el error original**, porque la pantalla ya no delata el problema.
Un vendedor que valide su cobro contra la app lo dará por correcto, y la diferencia solo aparecerá aguas
abajo — en la web, en el estado de cuenta del cliente y en la cobranza posterior — sin ningún punto en el
flujo donde el usuario pueda detectarla.

**El fix de la capa 1 quedó a medias: se corrigió la presentación y no la persistencia.**

---

## 2. Tabla de las tres capas

Documento con **pago parcial + retención**: `AJPM50001785` (saldo bruto 1.079,00 · pago 1.000,00 · IVA 20,00 · ISLR 5,00).

| Capa | Dónde se mide | **Valor medido** | **Debería ser** | Diferencia | Veredicto |
|---|---|---:|---:|---:|---|
| **1 · Pantalla** | Tab TOTAL → columna `Monto Saldo` | **54,00** | 54,00 | — | 🟢 **CORRECTA** |
| **2a · Payload** | `POST collectionservice/collection` → `nuBalanceDoc` | **79,00** | 54,00 | **+25,00** | 🔴 **ROTA** |
| **2b · Nube** | `collection_detail.nu_balance_doc` | **79,00** | 54,00 | **+25,00** | 🔴 **ROTA** |
| **3 · Web** | `/pages/detalleCobro` → columna `Saldo doc.` | **79,00** | 54,00 | **+25,00** | 🔴 **ROTA** |
| *3b · Web, conversión* | `Saldo doc. conversión` | *59.845,66 BS* | 40.907,16 BS | *+18.938,50 BS* | 🔴 **el error se propaga a bolívares** |

**La diferencia es exactamente `25,00` = `Retención IVA 20,00 + Retención ISLR 5,00`** en las tres capas rotas.
La conversión a BS confirma que no es un redondeo: `79,00 × 757,54 = 59.845,66` — el dato inflado se
multiplica por la tasa y viaja igual de mal en la moneda local.

---

## 3. Aritmética explícita, documento por documento

```
FÓRMULA CORRECTA (deuda real que le queda al cliente):
    saldo = bruto − pago − retIVA − retISLR

FÓRMULA QUE APLICA EL CÓDIGO AL ENVIAR (applyRemainingBalanceDocAfterPartialPayment):
    saldo = máx(0, bruto − pago)                    ← nunca resta las retenciones
```

### D1 · `AJPM50000880` — retención + pago completo

```
bruto 1.507,98 − pago 1.496,98 − IVA 10,00 − ISLR 1,00  =  0,00     ← neto real
PANTALLA  Monto Saldo .......  0,00      ✅
PAYLOAD   nuBalanceDoc ....... 1.507,98  ⚠ (bruto sin tocar — ver §3.b)
NUBE      nu_balance_doc ..... 1.507,98  ⚠
WEB       Saldo doc. ......... 1.507,98  ⚠
```

### D2 · `AJPM50000265` — **CONTROL**, sin retención, pago completo

```
bruto 1.086,30 − pago 1.086,30 − 0,00 − 0,00  =  0,00               ← neto real
PANTALLA  Monto Saldo .......  0,00      ✅
PAYLOAD   nuBalanceDoc ....... 1.086,30  ⚠ (bruto sin tocar — ver §3.b)
NUBE      nu_balance_doc ..... 1.086,30  ⚠
WEB       Saldo doc. ......... 1.086,30  ⚠
```

### D3 · `AJPM50001785` — **retención + PAGO PARCIAL** · 🔴 **el caso que rompe**

```
bruto 1.079,00 − pago 1.000,00 − IVA 20,00 − ISLR 5,00  =   54,00   ← neto real
bruto 1.079,00 − pago 1.000,00                          =   79,00   ← lo que hace el código

PANTALLA  Monto Saldo .......  54,00     ✅  CORRECTO
PAYLOAD   nuBalanceDoc .......  79,00    🔴  INFLADO EN 25,00
NUBE      nu_balance_doc .....  79,00    🔴  INFLADO EN 25,00
WEB       Saldo doc. .........  79,00    🔴  INFLADO EN 25,00
```

**El control (D2) es el que aísla la causa:** mismo cobro, misma pantalla, misma tabla — pero sin retención
el número cierra. La única variable que dispara la divergencia es **que el documento lleve retención**,
y solo se materializa **cuando además hay pago parcial**.

### 3.b · Matiz descubierto hoy: `nuBalanceDoc` **solo se recalcula si hay pago parcial**

Dato nuevo, no medido en `6.6.21.1` (allí el crash impidió llegar al envío):

| Documento | `inPaymentPartial` | `nuBalanceDocOriginal` | `nuBalanceDoc` enviado | ¿Se recalculó? |
|---|---|---:|---:|---|
| `AJPM50000880` | `false` | 1.507,98 | **1.507,98** | **no** — viaja el bruto intacto |
| `AJPM50000265` | `false` | 1.086,30 | **1.086,30** | **no** — viaja el bruto intacto |
| `AJPM50001785` | **`true`** | 1.079,00 | **79,00** | **sí** — y mal |

⇒ `applyRemainingBalanceDocAfterPartialPayment` **solo toca el detalle con `inPaymentPartial = true`**.
Eso tiene dos consecuencias que conviene que desarrollo tenga presentes:

1. **Acota el defecto:** el `nu_balance_doc` corrupto se produce **únicamente en documentos con pago parcial
   y retención**. Los documentos pagados al saldo completo mandan el bruto sin tocar (semántica de "saldo del
   documento al momento del cobro"), y el servidor los liquida por otra vía.
2. **Produce una columna de semántica mixta en la web** (ver §5): en la misma tabla, `Saldo doc.` significa
   *saldo previo* en unas filas y *saldo remanente* en otras.

---

## 4. Capa 2 — la evidencia

### 4.a · El payload capturado (hook `Capacitor.nativePromise`)

**1 solo POST** a `collectionservice/collection` (`2026-08-27T13:40:25.654Z`) ⇒ **no hubo reintentos**:
el envío entró limpio a la primera, no es una transacción atascada.

```jsonc
// data.collection.collectionDetails[2]
{
  "coDocument":            "AJPM50001785",
  "nuAmountDoc":            1079,
  "nuBalanceDocOriginal":   1079,
  "nuBalanceDoc":             79,     // 🔴 debería ser 54
  "nuAmountPaid":           1000,
  "nuAmountRetention":        20,
  "nuAmountRetention2":        5,
  "inPaymentPartial":       true
}
```

⇒ **El dato ya sale mal del dispositivo.** No es un problema del servidor, ni de la sincronización, ni de la
web: el móvil calcula mal y envía mal.

### 4.b · La fila de la nube

Cotejada por la responsable QA sobre `collection_detail` de `# Ref 1037`:

```
AJPM50000265  parcial=false  pago 1.086,30  amtDoc 1.086,30  balDoc 1.086,30  ret 0+0
AJPM50000880  parcial=false  pago 1.496,98  amtDoc 1.507,98  balDoc 1.507,98  ret 10+1
AJPM50001785  parcial=TRUE   pago 1.000,00  amtDoc 1.079,00  balDoc    79,00  ret 20+5   🔴
```

Payload y nube **coinciden exactamente** ⇒ el servidor persiste tal cual lo que recibe. La cadena queda
cerrada sin ningún eslabón dudoso: **cálculo en el móvil → payload → fila de nube → web**.

---

## 5. Capa 3 — la web

`http://denariocaribe.ddns.net:8080/DenarioPremium/pages/cobros` → filtro `# Ref = 1037` → **Consultar**
→ `/pages/detalleCobro` → sección **Documentos Pagados**.
🔴 Se respetó que la web es **PRODUCCIÓN y SOLO LECTURA**: se tocaron únicamente el filtro y `Consultar`.

| N° | Nro Factura | Pago parcial | Monto doc | **Saldo doc.** | Monto a pagar | Ret. IVA | Ret. ISLR |
|---|---|---|---:|---:|---:|---:|---:|
| 1 | `AJPM50001785` | **SI** | 1.079,00 | **🔴 79,00** | 1.000,00 | 20,00 | 5,00 |
| 2 | `AJPM50000880` | NO | 1.507,98 | 1.507,98 | 1.496,98 | 10,00 | 1,00 |
| 3 | `AJPM50000265` | NO | 1.086,30 | 1.086,30 | 1.086,30 | 0,00 | 0,00 |

Captura: `img/E-capa3-web-saldo-doc.png` — muestra la columna `Saldo doc.` con las tres filas.
*(Para que la columna acusada entrara en la toma se ocultaron por CSS las columnas de conversión; los
valores no se alteraron. Los datos completos, con conversiones, están transcritos arriba y en §2.)*

La cabecera del cobro cuadra: `Retención IVA 30,00` (10+20) · `Retención ISLR 6,00` (1+5) ·
`Total Monto a pagar 3.583,28 US$` · `Tasa 757,54`.

**Observación secundaria (misma causa, no es el defecto acusado):** la columna `Saldo doc.` tiene
**semántica mixta dentro de la misma tabla** — en las filas sin pago parcial muestra el **saldo previo**
del documento (1.507,98 / 1.086,30) y en la fila con pago parcial muestra el **remanente** (79,00). Es
consecuencia directa de que el móvil solo recalcula el campo en el caso parcial (§3.b). No se levanta
como defecto aparte: **se resuelve solo si se arregla el origen**, y ahí es donde debe decidirse qué
significa la columna.

---

## 6. Comparativa `6.6.21.1` → `main`, por capa

| | `6.6.21.1` (el_palmar, 26/08) | `main` (el_eden, 27/08) | Saldo |
|---|---|---|---|
| **Capa 1** — doc. saldado con retención | ❌ `11,00` (= lo retenido) | ✅ **`0,00`** | **corregido** |
| **Capa 1** — parcial + retención | ❌ inflado en `25,00` | ✅ **cierra exacto (`54,00`)** | **corregido** |
| **Capa 1** — control sin retención | ✅ `0,00` | ✅ `0,00` | sin cambios |
| **Incoherencia interna** (cabecera y modal restaban, la columna no) | ❌ presente | ✅ resuelta | **corregido** |
| **Crash al agregar método de pago** | ⛔ tumbaba la app y bloqueaba el envío | ✅ **no reproduce** | **corregido** |
| **Capa 2** — `nu_balance_doc` enviado | ⛔ nunca se pudo medir *(bloqueado por el crash)* | 🔴 **`79,00` en vez de `54,00`** | **sigue roto** |
| **Capa 3** — `Saldo doc.` en web | ⛔ nunca se pudo medir | 🔴 **`79,00`** | **sigue roto** |
| **Coherencia pantalla ↔ BD** | ✅ *(mal las dos, pero coherentes)* | 🔴 **DIVERGEN: 54,00 vs 79,00** | **empeoró** |

**Lectura:** `main` cerró **tres** frentes reales (la columna, la incoherencia interna de la pantalla y el
crash que bloqueaba el envío) y **abrió uno**: al arreglar solo la presentación, el error de persistencia
quedó **oculto** en vez de resuelto. Los cambios `computeDetailFullExpectedNet` (capa 1),
`syncPendingInputsBeforeSendValidation` y `flushPendingPaymentInputsBeforeSend` → `applyMontoToCollection`
(crash) están confirmados **por comportamiento**, no solo por lectura de código.

---

## 7. 🔴 Aviso para desarrollo — qué falta arreglar

**Archivo:** `src/app/.../collection-logic.service.ts` → **`applyRemainingBalanceDocAfterPartialPayment`** (~línea 1280)

```ts
// lo que hace hoy:
nuBalanceDoc = Math.max(0, bruto - pago);     // 🔴 nunca resta nuAmountRetention / nuAmountRetention2

// lo que debería:
nuBalanceDoc = Math.max(0, bruto - pago - retIVA - retISLR);
```

Es **la misma clase de omisión** que ya se corrigió en `cobro-total.component.ts` para la pantalla
(`computeDetailFullExpectedNet`): el fix se aplicó a la capa de presentación y **no** a la de persistencia.

### ⚠ El fix DEBE ramificar por `co_type` — si no, rompe el cobro tipo Retención

La semántica de `nuAmountPaid` **cambia con el tipo de cobro**:

| `co_type` | Qué vale `nuAmountPaid` | Qué hacer con las retenciones |
|---|---|---|
| **0** (cobro normal) | **solo** el efectivo/transferencia; las retenciones van aparte | **restarlas** |
| **2** (cobro tipo Retención) | **ya equivale exactamente a la retención** (IVA + ISLR) | **NO restarlas** — se duplicarían |

Un fix que reste retenciones sin ramificar por `co_type` dejaría el cobro tipo Retención con el saldo
descontado dos veces. Es el mismo aviso que se dio al corregir la capa 1, y sigue vigente.

### Decidir además la semántica de `nu_balance_doc`

El campo **solo se recalcula cuando `inPaymentPartial = true`** (§3.b); en los demás casos viaja el bruto.
Al tocarlo hay que definir explícitamente qué representa —*saldo previo* o *remanente*—, porque hoy la web
pinta ambas cosas en la misma columna. **Cualquiera de las dos es defendible; lo que no lo es, es que
convivan.**

---

## 8. Cobros creados en el sistema

| `# Ref` (`id_collection`) | `co_collection` | `co_type` | Estado móvil | Estado web | Monto | Contenido |
|---:|---|---:|---|---|---:|---|
| **1037** | `1787837136856.0` | 0 | **Enviado** (`st_delivery=1`) | **Por aprobar** | 3.583,28 US$ | 3 documentos (D1 retención · D2 control · D3 parcial+retención) |

Baseline de nube al inicio: `max(id_collection) = 1036` ⇒ **1037 es el único registro creado por esta corrida.**
Método de pago: Efectivo · `Nro. Recibo REC-QA-0827` · `Diferencia 0,00`.
Comprobantes de retención: `RET20260827001` (D1) y `RET20260827002` (D3), ambos con `Fecha Comp Ret 27/08/2026`.

**Estado final del dispositivo:** app en **HOME** (`/home`), sin alerts, sin modales y sin loadings residuales.

---

## 9. Evidencia (`img/`)

| Archivo | Capa | Qué muestra |
|---|---|---|
| `A1-capa1-nrodoc-montodoc.png` | 1 | `Nro. Doc.` · `Monto Doc.` · borde de `Retención IVA` (`scrollLeft` 122) |
| `B1-capa1-montodoc-retenciones.png` | 1 | `Monto Doc.` · `Retención IVA` · `Retención ISLR` (`scrollLeft` 326) |
| **`C1-capa1-pago-saldo.png`** | **1** | **`Retención ISLR` · `Monto Pago` · `Monto Saldo`** (`scrollLeft` 549) — la prueba de la capa 1 |
| `D-tab-adjuntos-entrega-QA.png` | — | estado en que se entregó el cobro a la QA para el adjunto manual |
| **`E-capa3-web-saldo-doc.png`** | **3** | **web, «Documentos Pagados» con `Saldo doc. = 79,00`** — la prueba de la capa 3 |

La tabla del Tab TOTAL mide **909 px** en un viewport de **360 px** (7 columnas con retención, entran 3 por
toma). Las capturas 1 están **encadenadas por columna bisagra** (`A1`→`B1` comparten `Monto Doc.`;
`B1`→`C1` comparten `Retención ISLR`), con las tres filas en el mismo orden en las tres tomas ⇒
`Nro. Doc.` → `Monto Doc.` → `Monto Saldo` se encadena sin ambigüedad.

> ⚠ En `C1` el botón flotante de la calculadora tapa parcialmente el **rótulo** `Monto Saldo`, no sus valores.
> Las tres celdas (`0,00` · `0,00` · `54,00`) se leen sin ambigüedad.

**Nota metodológica heredada de `6.6.21.1` y respetada aquí:** *una captura que no muestre la celda acusada
no es evidencia*, y *el oráculo de una columna calculada es la regla de negocio, no la expresión del código*.
Fue por saltarse ambas que el G2 del 26/08 dio un PASS incorrecto.

---

## 10. El adjunto — cómo se cerró el envío

`requiredCollectionAttachments = true`: al pulsar Enviar la app rechaza con *«Para poder enviar el Cobro,
debe agregar al menos un adjunto.»* y **salta sola al Tab ADJUNTOS**. El adjunto **lo puso la QA a mano**
(el mock de cámara está prohibido: abre la cámara nativa, fuera del WebView, y cuelga CDP sin salida
automática).

El hook de payload se instaló **antes** de armar el cobro, con guarda propia (`window.__qaDataHook`), y
**sobrevivió** a la pausa: al reanudar tenía 26 entradas, con el POST del cobro capturado **una sola vez y
con `data` completo**. Es la pieza que permitió medir la capa 2 sin depender de la BD.

---

## 11. Lo que NO se validó

- **Cobro tipo RETENCIÓN (`co_type = 2`):** no se montó hoy. En `6.6.21.1` quedó como **N/A estructural** en
  la capa 1 (esa pantalla no tiene columna `Monto Saldo` ni tabla de documentos, solo acordeones por
  documento). ⚠ **Pero su capa 2 nunca se midió, ni ayer ni hoy** — y es justo el caso donde el fix propuesto
  puede duplicar la resta (§7). **Debe probarse antes de dar el arreglo por bueno.**
- **Anticipo (`co_type = 1`):** fuera de alcance. **IGTF (`co_type = 3`):** N/A estructural en este cliente
  (`userCanSelectIGTF = false` en el global).
- **Round-trip §9 (Guardar → salir → reabrir desde BUSCAR):** no se ejecutó. El cobro se guardó, se envió y
  se salió a HOME sin reabrirlo ⇒ **no está probado que la retención y el pago parcial se relean bien al
  reabrir un Guardado**.
- **Pago parcial SIN retención:** no se probó. Sería el control que aísla si `máx(0, bruto − pago)` es
  correcto en ausencia de retención — **útil para acotar el fix**, y hoy falta.
- **Retención con pago parcial en un cobro en BS:** el cobro se armó íntegramente en **US$**. No se midió el
  caso donde la conversión por tasa entra en juego desde el origen. *(Sí se verificó que el error se propaga
  a la conversión BS de la web: `79,00 × 757,54 = 59.845,66`.)*
- **Otros métodos de pago:** solo **Efectivo**. Transferencia / Depósito / Otros / Pago Móvil no se tocaron,
  ni se verificó que Cheque siga OFF.
- **Tolerancia y anticipo automático:** el cobro cerró con `Diferencia = 0,00` exacta ⇒ no se ejercitó
  `tolerancia0` ni `automatedPrepaid` (umbral 11 US$).
- **Oclusión de la paginación de documentos:** **no aplica** — el cliente `00069` tiene 5 documentos en
  **1 sola página** (`documentSalesTotalPages = 1`, `canShowDocumentPagination = false`), así que no había
  paginación que el botón de la calculadora pudiera tapar.
- **Firma:** `signatureCollection = true`, pero no se firmó (la VG habilita, no obliga).
- **Estado del cobro en la web:** quedó **«Por aprobar»**; no se siguió el flujo de aprobación (la web es
  solo lectura para QA).

---

## 12. Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Alcance | Detalle |
|---|---|---|
| 🔴 **Hay DOS `#eventModal` en el DOM a la vez, y `querySelector('#eventModal')` devuelve el VACÍO** | universal | Tras abrir el detalle del documento coexisten dos nodos con `id="eventModal"`: el primero **sin hijos** y el segundo con los 17 `ion-input`. `document.querySelector('#eventModal')` toma el primero ⇒ se lee como *«el modal se cerró solo»* y se pierden intentos. **Localizar por contenido:** `Array.from(document.querySelectorAll('ion-modal')).find(m => /Detalle del documento/.test(m.textContent))`. Amplía la nota de `[ins-2610]`, que hablaba de dos modales **distintos**; acá son **dos instancias del mismo id**. |
| **La lista de documentos vive en `filteredDocumentsView`, no en `documentSales`** | build `main` | En este build `comp.documentSales` **no existe** y la lista real es `comp.filteredDocumentsView` (items con `coDocument`, `nuBalance`, `coCurrency`, `isSelected`). Paginación por getters: `documentSalesTotalPages`, `canGoToNextDocumentsPage`, `canShowDocumentPagination`. **Acota la nota vigente** de que «`documentSales[]` usa `coDocument`». |
| **El Tab Documentos nace SIN documentos hasta fijar `Moneda Documento`** | universal | Con el filtro en la opción neutra `Moneda` (`idCurrency: 0`) la lista viene **vacía** ⇒ se lee como *«el cliente no tiene documentos»*. Hay que asignar el **objeto** de la opción US$/BS + `ionChange`: el `value` es objeto, así que `s.value='US$'` **no matchea nunca** (caso de la trampa ya documentada en `[grupo_fiel-20260817]`). |
| **La lupa que abre el detalle es la de la 1.ª columna (`search-sharp`); la 2.ª (`receipt-outline`) nace `disabled`** | universal | En la misma fila conviven dos `ion-button` con ícono: `search-sharp` (x≈27, **habilitado**, abre *Detalle del documento*) y `receipt-outline` (x≈135, **disabled**, historial de pago parcial). Confirma y da coordenadas a la advertencia de `[ins-2611]`. |
| **`ion-datetime`: Aceptar/Cancelar están en el `shadowRoot` como `ion-button`, NO como `button`** | universal | `dt.shadowRoot.querySelectorAll('button')` devuelve **solo los días del calendario** ⇒ se lee como *«no hay botón Aceptar»*. `dt.confirm()` por sí solo **no cierra el overlay**. Receta que funcionó **2/2**: click real en `button.calendar-day-today` del shadowRoot → luego `dt.shadowRoot.querySelectorAll('ion-button')` y click real en el de texto `Aceptar`. |
| **El scroll horizontal de la tabla del Tab TOTAL lo lleva el `ion-grid.tablaDocVentasGrip`, no las `ion-row`** | universal | Asignar `scrollLeft` a las `ion-row` **no mueve nada** (quedan en 0), pero el grid arrastra cabecera y filas **juntas y alineadas**. Ancho real **909 px** sobre viewport 360 ⇒ 3 columnas por toma. |
| **`sizeRetention` se lee del rótulo del propio campo, no del YAML** | universal | El `ion-col` de `Nro. Comp Ret` rotula literalmente *«Debe tener N caracteres.»*. Es la fuente más barata y confiable. En `el_eden`: **14** (coincide con el YAML; en `el_palmar` era 5). |
| **Máscara de importes de `el_eden` = 2 decimales** (`parteDecimal: 2`) | cliente | `10,00` se teclea `1000`; `1.000,00` se teclea `100000`. **No** son 4 decimales. Confirmado en IVA, ISLR, pago parcial y Monto del método de pago. |
| ✅ **`#eventModal.present()` sigue prohibido — el click real funciona a la 1.ª** | universal | Se abrió el picker de métodos de pago con `pg.mouse.click` sobre «Agregar método de pago» y se pulsó **Agregar** sin ningún cuelgue. **Confirma que el atajo era el problema, no el botón** — y cierra la duda que dejó abierta el crash de ayer. |
| **El hook de payload sobrevive a una pausa larga con intervención humana** | universal | Instalado con guarda propia (`window.__qaDataHook`) antes de armar el cobro, siguió capturando durante el adjunto y el envío manuales de la QA: **26 entradas, el POST del cobro 1 sola vez y con `data` completo, 0 duplicados**. **`1 POST = envío limpio`** (N POST del mismo `co_collection` = transacción atascada, `[run_vzla-20260818]`). Es la vía para medir «el dato enviado» cuando el envío no lo hace el agente. |
| **Filtro por `# Ref` en la web: `#form:j_idt117:n_ref` + botón `#form:j_idt117:ajax` («Buscar»)** | universal (web) | Llega directo al cobro sin paginar el listado. El detalle abre **navegando a `/pages/detalleCobro`**, no en un `ui-dialog` ⇒ buscar las tablas en `document`, no dentro de `.ui-dialog`. La tabla de documentos es la de 22 columnas con encabezado `Saldo doc.`. |
