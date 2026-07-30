# Cobros del 30/07/2026 — volcado de la BD LOCAL del dispositivo

Extraído por el orquestador vía CDP (`window.sqlitePlugin`) antes de lanzar los agentes.
**Es la verdad del lado móvil**: contra esto se coteja lo que muestren la UI de la app y la web.

Cliente: **globalmp** · empresa **00002** COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P
Vendedor: **YC01** YUSNEIDI CLEMENTE (id_user 307) · Playa **LA TORTUGA**
Moneda de todos los cobros: **BS** · **tasa `nu_value_local` = 737,88**
⚠ La conversión BS→USD **DIVIDE** entre la tasa.

---

## Cabeceras

| Ref | co_collection (epoch) | Cliente | Tipo | Total BS | Conv. USD | Adj. | Comentario | st_delivery |
|---|---|---|---|---|---|---|---|---|
| **—** | 1785416914581.0 | ABASTO EL SITIO DSG (AS04) | 0 · Cobro | 337.763,36 | 457,75 | 4 | `c1` | **3 = GUARDADO ⛔ NO TOCAR** |
| **8352** | 1785417910262.0 | ABASTOS Y LICORERIA RICO SABOR (AR11) | 0 · Cobro | 83.684,62 | 113,41 | 2 | `prueba` | 1 Enviado |
| **8353** | 1785418058784.0 | ABASTO EL SITIO DSG (AS04) | 0 · Cobro | 29.000,11 | 39,30 | 4 | `c1.2` | 1 Enviado |
| **8354** | 1785418192435.0 | ABASTO EL SITIO DSG (AS04) | **2 · RETENCIÓN** | 2.600,00 | 3,53 | 4 | `ret1` | 1 Enviado |
| **8355** | 1785418315513.0 | ABASTO EL SITIO DSG (AS04) | 0 · Cobro | 15.000,00 | 20,33 | 4 | `c2` | 1 Enviado |

`st_collection = 3` en los cinco. `hasIGTF = false` en todos (coherente con `userCanSelectIGTF=false`).

---

## Detalle por cobro

### Ref 8352 — BS 83.684,62 (1 documento, 1 pago)
| Documento | Tipo | Monto doc | Saldo | Pagado | Descuento | Ret. IVA | Ret. ISLR |
|---|---|---|---|---|---|---|---|
| `037245` | A | 83.734,62 | 83.734,62 | 83.684,62 | 0 (+50 manual) | 0 | 0 |

Descuento aparte (`collection_detail_discounts`): **"Descuento manual" 50,00**
Pago: **Transferencia · VENEZUELA · doc 3904 · 83.684,62** → conv 113,41
✅ `83.734,62 − 50,00 = 83.684,62` = pagado = total del cobro

### Ref 8353 — BS 29.000,11 (2 documentos, 1 pago)
| Documento | Monto doc | Saldo | Pagado | Descuento | Ret. IVA | Ret. ISLR | Comprobante |
|---|---|---|---|---|---|---|---|
| `FF081401` | 215.401,93 | 10.773,05 | 9.000,00 | 773,05 | 0 | 0 | — |
| `FF081402` | 426.959,50 | 21.332,11 | 20.000,11 | 0 | 1.000,00 | 332,00 | `88888878` |

Descuento aparte: **"Descuento manual" 1.000,00** sobre `FF081401`
Pago: **Transferencia · BANPLUS · doc 888282 · 29.000,11** → conv 39,30
✅ `9.000,00 + 20.000,11 = 29.000,11` = total
✅ `FF081402`: `20.000,11 + 1.000,00 + 332,00 = 21.332,11` = saldo — **cierra exacto**
⚠ `FF081401`: `nu_amount_discount = 773,05` en la línea pero el descuento manual registrado es **1.000,00**.
   `10.773,05 − 1.000,00 = 9.773,05` y `9.000 + 773,05 = 9.773,05`. **Verificar qué muestra la web.**

### Ref 8354 — RETENCIÓN · BS 2.600,00 (2 documentos, SIN pagos — correcto en co_type=2)
| Documento | Saldo | "Pagado" | Ret. IVA | Ret. ISLR | Comprobante |
|---|---|---|---|---|---|
| `FF082166` | 5.460,31 | 1.100,00 | 700,00 | 400,00 | `77777777` |
| `FF082165` | 5.755,46 | 1.500,00 | 500,00 | 1.000,00 | `89898989` |

✅ `700 + 400 = 1.100` · ✅ `500 + 1.000 = 1.500` · ✅ total `1.100 + 1.500 = 2.600`
✅ Conversiones **correctas** (dividen): 700→0,95 · 400→0,54 · 500→0,68 · 1.000→1,36
✅ El total convertido **3,53** es la **suma de las conversiones redondeadas por línea** (1,49 + 2,04),
   no la conversión del total (`2.600 / 737,88 = 3,5236` → 3,52). **Criterio consistente, NO es defecto.**
   Mismo criterio verificado en 8353 (12,20 + 27,10 = 39,30 ✓) y 8355 (13,55 + 6,78 = 20,33 ✓).

### Ref 8355 — BS 15.000,00 (2 documentos, 2 pagos — pago parcial)
| Documento | Saldo | Pagado | Parcial |
|---|---|---|---|
| `FF081402` | 21.332,11 | 10.000,00 | **sí** |
| `FF082165` | 5.755,46 | 5.000,00 | **sí** |

Pagos: **Depósito · VENEZUELA · doc 12344567 · cta 01020125050000178055 · 1.500,00** → 2,03
       **Transferencia · PROVINCIAL · doc 886754 · 13.500,00** → 18,30
✅ `10.000 + 5.000 = 15.000` = total · ✅ `1.500 + 13.500 = 15.000` = total

---

## 🔴 HIPÓTESIS A VERIFICAR — `nu_amount_paid_conversion` invertido en cobros normales

En la BD **local**, la conversión del **monto pagado por documento** parece **MULTIPLICAR** por la tasa
en vez de dividir, **solo en los cobros de tipo 0**. En la retención (tipo 2) divide bien.

| Cobro | Documento | Pagado BS | `nu_amount_paid_conversion` | ÷ 737,88 (correcto) | × 737,88 |
|---|---|---:|---:|---:|---:|
| 8352 | `037245` | 83.684,62 | **61.749.207,41** | 113,41 | 61.749.207,4 ← coincide |
| 8353 | `FF081401` | 9.000,00 | **6.640.920,00** | 12,20 | 6.640.920 ← coincide |
| 8353 | `FF081402` | 20.000,11 | **14.757.681,17** | 27,10 | 14.757.681,2 ← coincide |
| 8355 | `FF081402` | 10.000,00 | **7.378.800,00** | 13,55 | 7.378.800 ← coincide |
| 8355 | `FF082165` | 5.000,00 | **3.689.400,00** | 6,78 | 3.689.400 ← coincide |
| **8354** | `FF082166` | 1.100,00 | **1,49** ✅ | 1,49 | — |
| **8354** | `FF082165` | 1.500,00 | **2,04** ✅ | 2,03 (=0,68+1,36) | — |

**Lo llamativo es que en la MISMA FILA conviven ambos criterios:** `nu_amount_doc_conversion` y
`nu_balance_doc_conversion` **dividen bien** (83.734,62 → 113,48 ✓), y las conversiones de retención
también (1.000 → 1,36 ✓); solo `nu_amount_paid_conversion` sale multiplicado.

Mismo patrón en el **descuento**: `nu_amount_collect_discount_other_conversion` = 50 → **36.894**
(= 50 × 737,88) y 1.000 → **737.880**. Debería ser 0,07 y 1,36.

⚠ **ESTO ES UNA HIPÓTESIS SOBRE LA BD LOCAL, NO UN DEFECTO CONFIRMADO.**
Falta lo esencial: **¿ese valor se muestra en alguna pantalla?** Si la app y la web calculan la conversión
al vuelo para mostrarla, el campo mal guardado sería inocuo. Si alguna de las dos lo pinta tal cual,
el usuario ve un número absurdo (61,7 millones de dólares por un cobro de 83 mil bolívares).
**Los agentes deben responder eso mirando la UI, no la BD.**

---

## ✅ CORRECCIÓN — resultado de la revisión móvil (30/07/2026)

La hipótesis de arriba quedó **parcialmente refutada**. Lo que estableció el agente móvil:

1. **El discriminador NO es "cobros de tipo 0".** Apareció un **Ref 8356** (tipo 0, BS 175.622,82, cliente
   SM03 ABASTOS Y FRUTERIA SANTA MARGARITA, 09:49 — enviado por QA *después* de tomarse este volcado) que
   está **correcto**. El discriminador real es **si el documento fue EDITADO** (descuento, retención o pago
   parcial): pagar el saldo completo sin tocar nada graba bien. Por eso 8352/8353/8355 fallan y 8356 no.
2. **En la APP el valor es INOCUO.** `nuAmountPaidConversion` **no está bindeado en ningún `.html`**: la app
   recalcula la conversión al vuelo y los totales salen de la cabecera, que sí está bien guardada. Se
   recorrieron las 3 pantallas de los 5 cobros y **no aparece ningún número de millones**.
3. **Causa raíz localizada:** `convertirMonto()` (`collection-logic.service.ts:2286-2299`) recibe la moneda
   **del documento** (rama que multiplica) en vez de la **del cobro**. La retención siempre pasa la del cobro,
   por eso el 8354 está bien.
4. **Ruta latente a vigilar:** `resolvePersistedNetAmountSumConversion` (`:1413-1418`) **sí usa el valor
   almacenado** cuando `inPaymentPartial === true` — el 8355 es justo ese caso. Hoy no se manifiesta porque
   gana la cabecera, pero conviene corregirlo antes de que aflore.
5. 🔴 **El dato malo YA VIAJÓ AL SERVIDOR** ⇒ lo que decide si el defecto es real o inocuo es **qué hace la
   WEB con él**. Esa verificación la resuelve el agente web.

**Además, `FF081401` del 8353 quedó aclarado:** la app muestra `Desc. = 1.000,00` (el descuento manual,
correcto) y el `773,05` se pinta en una columna **distinta, "Dev/Falt."** — son conceptos diferentes, no un
descuento perdido. La fila cierra: `9.000 + 1.000 + 773,05 = 10.773,05` = saldo. **No es defecto.**
