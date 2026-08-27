# Retest en `main` — `Monto Saldo` / `nu_balance_doc` con retención

| Parámetro | Valor |
|---|---|
| Fecha | 2026-08-26 |
| Build bajo prueba | APK de **main** · `versionName 1.0` · `db_version 21` (la anterior era `db19`) · instalado **hoy 17:14:55** |
| Defecto que se retesta | `automation/reports/el_palmar/defecto_saldo_retencion_20260826/defecto-saldo-retencion.md` |
| Fix que lo corrige | commit **`5a3cf10b`** *feat(cobros): se implementa la lógica para calcular el saldo restante considerando retenciones y pagos parciales* (26/08 16:00) |
| Tenant medido (capas 1 y 2) | **EL EDEN IMPORT TCN, C.A.** (`EDEN25_A`) · playa **CARIBE** · usuario `wpalencia` / `idUser 306` / `coUser 009` — **es el tenant que corre el APK de `main`**, por eso se prueba acá |
| Tenant medido (capa 3) | **el_palmar** · empresa 1003 · web Isla Coche · cobro **Ref 27144** (creado por **6.6.21.1**) |
| 🔴 Bloqueo | **No se pudo enviar ningún cobro**: la app muere al agregar el método de pago → `INCIDENCIA-crash-cobros-metodo-pago.md` |
| Registros creados | **NINGUNO** — ver §6 |

---

## 0. Dónde se midió cada cosa, y por qué

El fix vive en **código de producto** (`collection-logic.service.ts`), no en datos de un tenant. El APK de
`main` —el que trae el fix— está apuntado a **CARIBE / EL EDEN**, así que **ahí es donde se prueba `main`**.
Los documentos de `el_palmar` (`0090000234`, `0099000045`, `010000016710032023`) pertenecen al build
**anterior** (6.6.21.1, playa Isla Coche) y sirven como el "antes" contra el que comparar.

| Capa | Dónde se midió | Cómo |
|---|---|---|
| **1 · Pantalla** | EL EDEN, en vivo | Tab TOTAL, con capturas |
| **2 · Dato enviado** | EL EDEN, en vivo | llamando `resolveDetailBalanceDocFieldsForSend` sobre los detalles reales — el valor exacto que viajaría en el POST |
| **3 · Web** | `el_palmar`, cobro Ref **27144** | detalle en la web Isla Coche, solo lectura |

Para que la comparación sea **delta contra delta**, los tres casos de EL EDEN se armaron con montos que dan
**exactamente las mismas retenciones que los de `el_palmar`**: **11,00** en E1 (≙R1) y **25,00** en E2 (≙R2).

Sobre la capa 3: el cobro 27144 **sí llegó a la nube**, enviado a las **16:45**, y el APK de `main` se instaló
a las **17:14:55** (§5) ⇒ lo mandó **6.6.21.1**. Como la capa 2 de `main` produce **el mismo número** para ese
caso (ver §2.b), lo que la web muestra hoy es lo que seguiría mostrando con `main`.

🔴 **Lo que faltó, y por qué:** enviar un cobro **desde `main`**, que cerraría las capas 2 y 3 de forma
directa. No se pudo: **la app muere al agregar el método de pago** — recursión infinita introducida por el
commit `faec6736`, replicada a mano por QA y documentada en
**`INCIDENCIA-crash-cobros-metodo-pago.md`**. Sin método de pago no hay envío posible.

---

## 1. VEREDICTO POR CAPA

> ### Capa 1 · PANTALLA (`Monto Saldo`, Tab TOTAL) → 🟢 **CORREGIDO**
> Las tres filas cierran con la aritmética de negocio. Con retención el saldo ya descuenta IVA+ISLR.
>
> ### Capa 2 · DATO ENVIADO (`nu_balance_doc` del payload) → 🔴 **SIGUE INFLADO** en pago parcial
> `applyRemainingBalanceDocAfterPartialPayment` sigue haciendo `máx(0, bruto − pago)` **sin restar
> retenciones**. Medido, no supuesto: la función de envío devolvió **79,00** donde el neto real es **54,00**.
>
> ### Capa 3 · WEB (`Saldo doc.` del detalle del cobro) → 🔴 **MUESTRA EL VALOR INFLADO**
> En el cobro `el_palmar` Ref 27144 la web rotula `Saldo doc. = 37.581,8200` para el documento con pago
> parcial + retención de 25,00. El valor correcto sería `37.556,8200`.
>
> ### Revalidación de `Monto Doc.` → 🟢 **SIN REGRESIÓN**
> `Monto Doc.` sigue mostrando el **saldo bruto** en el pago parcial (1.079,00, no el restante), y
> `Monto Doc. − Monto Pago = Monto Saldo` cierra en la fila sin retención.

**La predicción del encargo se cumplió en las tres capas.** Se midió, no se dio por buena.

---

## 2. Tabla comparativa 6.6.21.1 → main, caso por caso y capa por capa

### 2.a Capa 1 — pantalla

| Caso | Documento (tenant) | Bruto | Ret IVA | Ret ISLR | Pago | `Monto Saldo` **6.6.21.1** | `Monto Saldo` **main** | Correcto |
|---|---|---|---|---|---|---|---|---|
| **R1 / E1** retención + pago del resto | `0090000234` (el_palmar) → **`AJPM50000880`** (el_eden) | 3.838,56 → **1.507,98** | 10,00 | 1,00 | 3.827,56 → **1.496,98** | **`11,0000`** ❌ | **`0,00`** ✅ | `0,00` |
| **Control** sin retención | `0099000045` → **`AJPM50000265`** | 19.361,44 → **1.086,30** | — | — | completo | `0,0000` ✅ | **`0,00`** ✅ | `0,00` |
| **R2 / E2** parcial + retención | `010000016710032023` → **`AJPM50001785`** | 38.581,82 → **1.079,00** | 20,00 | 5,00 | 1.000,00 | **`37.581,8200`** ❌ (inflado 25,00) | **`54,00`** ✅ | `54,00` |

> El delta del defecto es idéntico en ambos tenants: **11,00** en R1/E1 y **25,00** en R2/E2.
> En el_palmar el inflado se leía como `11,0000` (donde tocaba `0,0000`) y `37.581,8200`
> (donde tocaba `37.556,8200`); en el_eden, con la corrección, sale `0,00` y `54,00`
> — o sea, **el equivalente exacto de `0,0000` y `37.556,8200`**.

### 2.b Capa 2 — dato enviado (`nuBalanceDoc`)

Medido llamando `collectService.resolveDetailBalanceDocFieldsForSend(detail)` sobre cada detalle real
del formulario de `main`:

| Caso | `inPaymentPartial` | Bruto | Pago | Retenciones | **`nuBalanceDoc` que se enviaría (main)** | Neto real | ¿Inflado? |
|---|---|---|---|---|---|---|---|
| E1 (≙R1) | `false` | 1.507,98 | 1.496,98 | 11,00 | **1.507,98** (= bruto, sin tocar) | 0,00 | *no aplica*: el campo no pretende ser saldo restante en no-parcial |
| Control | `false` | 1.086,30 | 1.086,30 | 0 | **1.086,30** (= bruto) | 0,00 | *ídem* |
| E2 (≙R2) | `true` | 1.079,00 | 1.000,00 | 25,00 | 🔴 **79,00** | **54,00** | **SÍ, en 25,00** |

Contraste con lo que 6.6.21.1 dejó en la nube de `el_palmar` (cobro 27144, `collection_detail`):

| `co_document` | `nu_amount_doc` | `nu_balance_doc` (6.6.21.1) | `in_payment_partial` | Lo que enviaría `main` |
|---|---|---|---|---|
| `0090000234` | 3.838,5600 | **3.838,5600** | false | 3.838,5600 — **igual** |
| `0099000045` | 19.361,4400 | **19.361,4400** | false | 19.361,4400 — **igual** |
| `010000016710032023` | 38.581,8200 | 🔴 **37.581,8200** | true | 🔴 37.581,8200 — **igual, sigue inflado en 25,00** |

⇒ **La capa 2 no cambió entre 6.6.21.1 y main.**

### 2.c Capa 3 — web (`/pages/cobros` → Consultar → *Documentos Pagados*)

Cobro **Ref 27144** de `el_palmar` (Dilcia Duarte · CAYETANO FARIAS E HIJOS C.A · 24.189,0000 USD · tasa 710):

| N° | Nro Factura | Pago parcial | `Monto doc` | 🔴 **`Saldo doc.`** | `Monto a pagar` | `Retención IVA` | `Retención ISLR` |
|---|---|---|---|---|---|---|---|
| 1 | `0090000234` | NO | 3.838,5600 | **3.838,5600** | 3.827,5600 | 10,0000 | 1,0000 |
| 2 | `0099000045` | NO | 19.361,4400 | **19.361,4400** | 19.361,4400 | 0,0000 | 0,0000 |
| 3 | `010000016710032023` | **SI** | 38.581,8200 | 🔴 **37.581,8200** | 1.000,0000 | 20,0000 | 5,0000 |

Dos lecturas, y conviene no confundirlas:

- **Filas 1 y 2 (sin parcial):** `Saldo doc.` = `Monto doc`. La columna está mostrando **el saldo del
  documento al momento del cobro**, no el saldo que queda después. Es coherente en las dos filas
  (incluida la que se pagó completa) ⇒ **no es el defecto**, es la semántica de la columna.
- **Fila 3 (parcial):** `Saldo doc.` = **37.581,8200**, que **no es** el bruto (38.581,82) **ni** el neto
  restante (37.556,82). Es `bruto − pago`, sin las retenciones. **Ahí sí está el valor inflado, y el
  usuario lo ve en la web.**

---

## 3. Aritmética explícita, con números reales

```
E1 (≙ R1) — AJPM50000880 · retención, pago del resto
   bruto ................ 1.507,98
   retención IVA ........    10,00
   retención ISLR .......     1,00
   neto a pagar .........  1.496,98   ← el modal ya lo mostraba así
   pago .................  1.496,98
   Monto Saldo = (1.507,98 − 11,00) − 1.496,98 = 0,00      ✅ main muestra 0,00
   [6.6.21.1 hacía 1.507,98 − 1.496,98 = 11,00]            ❌

Control — AJPM50000265 · sin retención, pago completo
   Monto Saldo = (1.086,30 − 0,00) − 1.086,30 = 0,00       ✅ main muestra 0,00
   (Monto Doc. − Monto Pago = 1.086,30 − 1.086,30 = 0,00 → cierra)

E2 (≙ R2) — AJPM50001785 · retención + pago parcial de 1.000,00
   bruto ................ 1.079,00
   retenciones ..........    25,00   (IVA 20,00 + ISLR 5,00)
   pago parcial .........  1.000,00
   Monto Saldo = (1.079,00 − 25,00) − 1.000,00 = 54,00     ✅ main muestra 54,00
   [6.6.21.1 hacía 1.079,00 − 1.000,00 = 79,00]            ❌

   PERO el payload:
   nuBalanceDoc = máx(0, bruto − pago) = 1.079,00 − 1.000,00 = 79,00   🔴 inflado en 25,00
   (equivalente el_palmar: 38.581,82 − 1.000,00 = 37.581,82 en vez de 37.556,82)

Cabecera del Tab TOTAL (cruce independiente):
   Monto total a Pagar US$ = 1.496,98 + 1.086,30 + 1.000,00 = 3.583,28   ✅ coincide con pantalla
```

---

## 4. Dónde está cada cosa en el código de `main`

**Capa 1 — corregida.** `collection-logic.service.ts:6633`

```ts
resolveCollectionDetailRemainingBalance(detail: CollectionDetail): number {
  const gross       = this.resolveDetailGrossBalanceForTotals(detail, backup);
  const expectedNet = this.computeDetailFullExpectedNet(detail, backup, docIndex);  // bruto − deducciones
  const paid        = Number(detail?.nuAmountPaid ?? 0);
  const remaining   = expectedNet - paid;
  ...
}
```

`computeDetailFullExpectedNet` (`:1344`) resta `getDetailDeductionsForTotals` (`:1747`), que **sí** suma
`nuAmountDiscount + nuAmountCollectDiscount + (nuAmountRetention + nuAmountRetention2)`.
Es exactamente lo que faltaba en `cobro-total.component.ts` de 6.6.21.1. El componente ahora solo delega
(`cobro-total.component.ts:610`).

**Capa 2 — sin cambio.** `collection-logic.service.ts:1257`

```ts
public applyRemainingBalanceDocAfterPartialPayment(detail: CollectionDetail): void {
  ...
  detail.nuBalanceDoc = Math.max(0, gross - paid);          // 🔴 nunca resta retenciones
  detail.nuBalanceDocConversion = Math.max(0, grossConv - paidConv);
}
```

Se invoca desde `resolveDetailBalanceDocFieldsForSend` (`:1304`), que es la que arma los campos del envío.
El comentario del propio método reconoce la separación de responsabilidades
(*"Solo para payload de envío… en UI, `nuBalanceDoc` debe permanecer como saldo bruto"*), pero al payload
le falta la resta de retenciones.

---

## 5. Cómo sé qué build envió el cobro 27144

| Evento | Hora local |
|---|---|
| `collection` 27143 (`co_type=2`, 11,00 USD) llega a la nube | **16:42:45** |
| `collection` 27144 (`co_type=0`, 24.189,00 USD) llega a la nube | **16:45:53** |
| `firstInstallTime` / `lastUpdateTime` del APK de `main` en el device | **17:14:55** |
| Primer `lastUpdate` de la sesión EL EDEN (`localStorage`) | 17:15:53 |

⇒ Los dos cobros que el reporte anterior dejó como *"Guardados, no enviados"* **sí llegaron a la nube**,
**antes** de instalar `main`. Ese es un dato nuevo que corrige el §7 del reporte previo: no quedaron
solo en local. Y son la fotografía limpia del comportamiento de 6.6.21.1 en las capas 2 y 3.

---

## 6. Cobros creados

**Ninguno.** Ni enviado, ni guardado.

| Prueba | Antes | Después |
|---|---|---|
| `sqlite_sequence.collections` (BD local) | 62 | **62** |
| `sqlite_sequence.collection_details` | 55 | **55** |
| `sqlite_sequence.collection_payments` | 64 | **64** |
| POST a `collect*` capturados por el hook de `Capacitor.nativePromise` | 0 | **0** |
| `pending_transactions` | 0 | 0 |

El primer cobro de prueba de EL EDEN se descartó por el dirty-guard
(`[Guardar y salir · Salir sin guardar · Cancelar]` → **Salir sin guardar**). Los dos siguientes intentos
murieron con la app al agregar el método de pago (§ incidencia) y **tampoco dejaron rastro**: los contadores
de arriba son idénticos antes y después de los tres intentos. El tenant EL EDEN queda **intacto**; en
`el_palmar` no se creó nada (la web se usó **solo en lectura**: únicamente filtro `# Ref` + botón `Consultar`).

---

## 7. Capturas (`img/`)

La tabla del Tab TOTAL mide **909 px** en un viewport de **360**: entran 3 columnas por toma. Se resolvió
con recortes encadenados por una **columna bisagra**, sin corte ciego. Las tres filas aparecen en el mismo
orden (`AJPM50000880` · `AJPM50000265` · `AJPM50001785`) en las cuatro tomas.

| Archivo | `scrollLeft` | Columnas visibles | Bisagra con la anterior |
|---|---|---|---|
| `0-tipo-nrodoc.png` | 0 | `Tipo` · `Nro. Doc.` | — |
| `a-nrodoc-montodoc.png` | 122 | `Nro. Doc.` · `Monto Doc.` | **`Nro. Doc.`** |
| `b-montodoc-retenciones.png` | 326 | `Monto Doc.` · `Retención IVA` · `Retención ISLR` | **`Monto Doc.`** |
| **`c-pago-saldo.png`** | 549 | `Retención ISLR` · `Monto Pago` · 🟢 **`Monto Saldo`** | **`Retención ISLR`** |
| `web-27144-saldo-doc.png` | — | Web Isla Coche · detalle del cobro 27144 con 🔴 **`Saldo doc.`** | — |

`c-pago-saldo.png` es la prueba central de la capa 1: muestra `1,00 \| 1.496,98 \| 0,00` ·
`(vacío) \| 1.086,30 \| 0,00` · `5,00 \| 1.000,00 \| 54,00`.
`web-27144-saldo-doc.png` es la prueba central de la capa 3: `Saldo doc.` con
`3.838,5600` · `19.361,4400` · **`37.581,8200`**.

Offsets de columna medidos (para reproducir): `Tipo` 5 · `Nro. Doc.` 122 · `Monto Doc.` 326 ·
`Retención IVA` 442 · `Retención ISLR` 559 · `Monto Pago` 676 · `Monto Saldo` 792 (ancho total 909).

---

## 8. Lo que NO se validó

1. 🔴 **No hubo POST real desde `main`** — bloqueado por el crash al agregar método de pago
   (`INCIDENCIA-crash-cobros-metodo-pago.md`). La capa 2 se midió llamando la función de la ruta de envío
   sobre los detalles reales, que es el valor que viajaría — pero **no** se observó un payload en vuelo
   ni una fila nueva en la nube escrita por `main`. La igualdad "lo que devuelve la función = lo que
   viaja" queda apoyada en la lectura del código (`resolveDetailBalanceDocFieldsForSend` es el único
   productor de esos dos campos en el envío), no en un POST capturado.
2. 🔴 **La capa 3 se leyó sobre datos de 6.6.21.1**, no de `main`. Es válida como demostración de que un
   `nu_balance_doc` inflado llega a la pantalla de la web — y `main` produce ese mismo número para ese
   caso — pero **no** es una fila escrita por `main`.
3. **El adjunto obligatorio no se ejerció.** En EL EDEN `requiredCollectionAttachments=true`, así que el
   envío habría exigido adjunto; como nunca se llegó a enviar, no se probó ni el mock de cámara ni el bloqueo.
4. **`co_type = 2` (cobro tipo RETENCIÓN) no se re-midió.** El reporte anterior lo cerró como N/A
   estructural (esa pantalla no tiene columna `Monto Saldo`); no se volvió a verificar en `main`.
   ⚠ Ojo: ese flujo **no exige método de pago** (`hasSendPrerequisites` lo omite en `co_type=2`), así que
   **es el único tipo de cobro que hoy sí podría enviarse** pese al crash.
5. **No se comprobó si el ERP/administrativo consume `nu_balance_doc`** para reabrir cartera. El impacto
   real de la capa 2 depende de eso y no se puede medir desde QA móvil.
6. **VGs distintas entre tenants.** EL EDEN corre `parteDecimal=2` y `sizeRetention=14`; `el_palmar`
   corre `parteDecimal=4` y `sizeRetention=5`. Eso cambia el formato en pantalla, no la aritmética;
   pero un defecto que dependiera del redondeo a 4 decimales no se habría visto acá.

---

## 9. Qué hace falta para cerrar esto

1. 🔴 **Primero, el crash.** Mientras `faec6736` siga sin guarda de reentrada, **ningún cobro normal se
   puede enviar en `main`** y las capas 2 y 3 no se pueden medir de punta a punta. Ver la incidencia.
2. **Con el crash resuelto**, repetir E1/Control/E2 en EL EDEN y **enviar**. Lo que hay que mirar en la
   nube es el `nu_balance_doc` de `AJPM50001785`: **79,00 ⇒ el defecto de la capa 2 sigue vivo**;
   **54,00 ⇒ corregido también ahí**.
3. **El fix pendiente de la capa 2 es de una línea de semántica**, en
   `applyRemainingBalanceDocAfterPartialPayment` (`collection-logic.service.ts:1280`): el saldo restante
   que se envía debería ser `bruto − pago − descuentos − retenciones`, igual que ya hace
   `computeDetailFullExpectedNet` para la pantalla.
   ⚠ Sigue vigente el aviso del reporte anterior: **ramificar por `co_type`**. En `co_type=2` el
   `nuAmountPaid` **ya vale** la retención, y restarla otra vez la duplicaría.
4. **Opcional, si urge cerrar el `el_palmar` original:** un APK de `main` apuntado a Isla Coche permitiría
   repetir R1/Control/R2 sobre los documentos exactos. Siguen con el saldo intacto en BD
   (`3.838,5600` · `19.361,4400` · `38.581,8200`).

---

## 10. Notas de perfil / selectores nuevos

| Patrón | Alcance | Detalle |
|---|---|---|
| 🔴 **Verificar la EMPRESA de la BD local antes de correr, no el host** | universal | `SELECT * FROM enterprises` vía `window.sqlitePlugin` + `localStorage.login`. Acá el APK de `main` venía apuntado a **Caribe/EL EDEN** y todo el encargo era de `el_palmar`. Sin esta guarda se reporta contra otro tenant |
| `ion-toggle` de pago parcial: `mouse.click` **no lo mueve** | cobros | `elementFromPoint` devuelve el propio `ION-TOGGLE` (no hay oclusión) y aun así el click no dispara. **Fix a la 1.ª: `t.shadowRoot.querySelector('input').click()`** |
| El scroll horizontal de la tabla del Tab TOTAL vive en el **`ion-grid.tablaDocVentasGrip`** | cobros | Los `ion-row` también tienen scroll propio, pero **ignoran** la asignación de `scrollLeft`; el que manda es el `ion-grid`. Offsets de columna vía `col.offsetLeft` sobre `ion-row.cabecera` |
| Selector de **moneda del cobro** en este build abre **`ion-popover`**, no `ion-alert` | cobros | 2.º `ion-select` de `app-cobro-general`; `value` es objeto ⇒ click real + click en el `ion-item` del popover. **No** salió el alert "el cobro será reiniciado" |
| `resolveDetailBalanceDocFieldsForSend` es alcanzable desde CDP | universal (oráculo) | Permite medir **qué se enviaría** sin hacer el POST: `ng.getComponent(el).collectService.resolveDetailBalanceDocFieldsForSend(detail)`. Los nombres de método privados **no** están minificados en el bundle de producción |
| `db_version` en `localStorage` distingue builds | universal | `19` en 6.6.21.1 · **`21`** en `main`. Señal barata y no ambigua de que el APK cambió |
| 🔴 **Ante un crash del WebView, el `logcat` de la consola de Capacitor da la causa en JS** | universal | `grep "Capacitor/Console"` + agrupar mensajes por frecuencia. Acá **241.864 de 242.139 líneas** eran un solo mensaje en bucle, y el `RangeError` nombraba el método culpable. Mucho más barato que leer el tombstone nativo |
| Un crash del **render process** (SIGSEGV) suele ser recursión JS, no OOM nativo | universal | Buscar `RangeError: Maximum call stack size exceeded` **antes** del `Fatal signal`; el `F/chromium [FATAL] Render process ... triggering application crash` es solo la consecuencia |
