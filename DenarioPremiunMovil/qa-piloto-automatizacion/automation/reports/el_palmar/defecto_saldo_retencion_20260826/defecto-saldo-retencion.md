# Defecto — `Monto Saldo` del Tab TOTAL no resta la retención

| Parámetro | Valor |
|---|---|
| Fecha | 2026-08-26 |
| Cliente QA | `el_palmar` — CENTRAL EL PALMAR, S.A. |
| Playa | ISLA COCHE (`denarioislacoche.ddns.net`) · app v1.0 / db19 · `window.ng = true` |
| Empresa | **1003 — C.A. DESTILERIA YARACUY** |
| Cliente de prueba | `1000002025` — CAYETANO FARIAS E HIJOS C.A |
| Vendedor | login `1276` / `id_user 266` (Dilcia Duarte) |
| Moneda del cobro | USD · Tasa VES 710,0000 |
| Componente | `src/app/cobros/cobros-container/cobro-total/cobro-total.component.ts` → `resolveDetailRemainingBalance` (~línea 609) |
| Registros dejados | 2 cobros en **Guardado** (no enviados) — ver §7 |

---

## 1. VEREDICTO

> ### 🔴 EL DEFECTO REPRODUCE. Confirmado en los DOS flujos donde existe la columna.
>
> | Caso | ¿Reproduce? | `Monto Saldo` inflado en |
> |---|---|---|
> | **R1 — Cobro con retención (pago completo)** | ❌ **FAIL** | **11,00 USD** |
> | **R2 — Cobro parcial con retención** | ❌ **FAIL** | **25,00 USD** |
> | **R3 — Cobro tipo RETENCIÓN (`co_type=2`)** | 🚫 **N/A estructural** — esa pantalla **no tiene columna `Monto Saldo`** (ni tabla de documentos) |
> | *Control — mismo cobro, documento SIN retención* | ✅ **PASS** — cierra en 0,0000 |
>
> **El defecto es de la FÓRMULA, no de un flujo concreto**: falla igual con pago completo y con pago
> parcial, y el caso de control sin retención cierra perfecto. La única variable que lo dispara es
> **que el documento lleve retención**.
>
> 🔴 **Consecuencia directa: el PASS que se le dio a G2 el 26/08 fue incorrecto.** Ver §6.

---

## 2. La aritmética, con números reales

```
MUESTRA:      Monto Saldo  ==  bruto − pago                        ← fórmula del código
DEBERÍA:      Monto Saldo  ==  bruto − pago − retIVA − retISLR     ← deuda real del cliente
INFLADO EN:   retIVA + retISLR
```

### Tabla comparativa de los tres casos

Todos medidos en **pantalla** (celdas del Tab TOTAL) y en **modelo**
(`ng.getComponent(document.querySelector('app-cobro-total'))` → `collectService.collection.collectionDetails[i]`).

| | **R1** Cobro con retención | **R2** Parcial con retención | **CONTROL** sin retención | **R3** Cobro tipo RETENCIÓN |
|---|---|---|---|---|
| `co_type` | 0 | 0 | 0 | **2** |
| Documento | `0090000234` | `010000016710032023` | `0099000045` | `0099000011` |
| Pago parcial (`inPaymentPartial`) | `false` | `true` | `false` | *no existe el toggle* |
| **Monto Doc.** (pantalla) | `3.838,5600` | `38.581,8200` | `19.361,4400` | `50.701,1400` *(en acordeón)* |
| **Retención IVA** | `10,0000` | `20,0000` | *(celda vacía)* | `10,0000` *(en acordeón)* |
| **Retención ISLR** | `1,0000` | `5,0000` | *(celda vacía)* | `1,0000` *(en acordeón)* |
| **Monto Pago** | `3.827,5600` | `1.000,0000` | `19.361,4400` | *(columna inexistente)* |
| **🔴 Monto Saldo (mostrado)** | **`11,0000`** | **`37.581,8200`** | `0,0000` | **columna inexistente** |
| `nuBalanceDocOriginal` (modelo) | `3838.56` | `38581.82` | `19361.44` | `50701.14` |
| `nuAmountPaid` (modelo) | `3827.56` | `1000` | `19361.44` | `11` |
| `nuAmountRetention` (IVA) | `10` | `20` | `0` | `10` |
| `nuAmountRetention2` (ISLR) | `1` | `5` | `0` | `1` |
| **MUESTRA** = bruto − pago | `3838,56 − 3827,56` = **`11,00`** | `38581,82 − 1000,00` = **`37.581,82`** | `19361,44 − 19361,44` = `0,00` | — |
| **DEBERÍA** = bruto − pago − retenciones | `11,00 − 11,00` = **`0,00`** | `37.581,82 − 25,00` = **`37.556,82`** | `0,00 − 0,00` = `0,00` | — |
| **DIFERENCIA** (= retIVA + retISLR) | **`11,00`** ❌ | **`25,00`** ❌ | **`0,00`** ✅ | — |

**Lectura de R1 (el caso más grave):** el documento queda **totalmente saldado**
(`3.827,56` de pago + `11,00` de retención = `3.838,56` de saldo bruto), y sin embargo la app rotula
`Monto Saldo = 11,0000`. **Cero es el valor correcto, y muestra exactamente el monto retenido.**

**Lectura del CONTROL:** el mismo cobro, la misma pantalla, la misma tabla — pero sobre un documento
**sin retención** el saldo cierra en `0,0000`. Eso aísla la causa: **no es un problema de pagos, de
moneda, de redondeo ni de conversión — es la retención.**

---

## 3. Incoherencia interna: el resto de la pantalla SÍ resta la retención

Esto no es una discusión de criterio contable: **la propia app ya calcula bien en otros dos lugares**
del mismo formulario, con los mismos datos.

| Dónde | Qué muestra | ¿Resta la retención? |
|---|---|---|
| Modal **«Detalle Del Documento»** → `Monto a pagar USD` | pasó de `3.838,5600` a **`3.827,5600`** al cargar IVA 10 + ISLR 1 | ✅ **SÍ** |
| Cabecera Tab TOTAL → `Monto total a Pagar USD` | pasó de `23.200,0000` a **`23.189,0000`** al aplicar la retención de 11,00 al doc `0090000234` | ✅ **SÍ** |
| **Columna `Monto Saldo` de la tabla** | `11,0000` | ❌ **NO** |

⇒ La cabecera y el modal tratan el par *(pago + retención)* como liquidación del documento;
la columna `Monto Saldo` **solo cuenta el pago**. Es una incoherencia **dentro de la misma pantalla**.

---

## 4. Causa en el código (ya confirmada, se transcribe para desarrollo)

`src/app/cobros/cobros-container/cobro-total/cobro-total.component.ts` (~609-613):

```ts
resolveDetailRemainingBalance(detail: CollectionDetail): number {
  const balance = this.resolveDetailDocumentBalance(detail);   // nuBalanceDocOriginal || nuBalanceDoc
  const paid    = this.normalizeTotalizationAmount(detail?.nuAmountPaid);
  return Math.max(0, balance - paid);      // 🔴 nunca resta nuAmountRetention / nuAmountRetention2
}
```

El mismo componente (~615-637, `hasTotalizationColumnAmount`) **sí conoce** `nuAmountRetention`,
`nuAmountRetention2`, `nuAmountDiscount` y `nuAmountCollectDiscount` — los usa para decidir qué
columnas pintar, pero ninguno entra en la resta del saldo.

⚠ **Aviso para el fix — la semántica de `nuAmountPaid` CAMBIA con el `co_type`:**
- en `co_type = 0` (R1/R2), `nuAmountPaid` es **solo el efectivo/transferencia**, y las retenciones van aparte ⇒ **hay que restarlas**;
- en `co_type = 2` (R3), `nuAmountPaid` **ya vale exactamente la retención** (`11` = IVA 10 + ISLR 1) ⇒ restarlas otra vez la **duplicaría**.

Un fix que reste retenciones sin ramificar por `co_type` rompería el cobro tipo Retención.
(Coherente con el oráculo de cabecera por `co_type` ya documentado en `automation/clientes/el_palmar.yaml`.)

---

## 5. R3 — Cobro tipo RETENCIÓN: qué muestra realmente

Se montó de verdad (botón **RETENCIÓN** del menú de Cobros → `coTypeModule = "2"`), no se miró de lejos.

- El formulario abre con **4 tabs**: General / Documentos / Total / Adjuntos — **sin tab Pagos**.
- El modal de detalle del documento **no tiene toggle de pago parcial**, ni `Dif. Devolución/Faltante`,
  ni `Monto a pagar`. En su lugar trae **`Monto total retenido`** (solo lectura).
- 🔴 **El Tab TOTAL de este flujo NO tiene tabla de documentos.** No hay columnas
  `Tipo / Nro. Doc. / Monto Doc. / Monto Pago / Monto Saldo`. Hay **un `ion-accordion` por documento**:

```
Nro. Doc.: 0099000011
   Fecha del documento: 2026-08-26
   Monto Doc. USD:            50.701,1400
   Monto IVA USD:                 10,0000
   Monto ISLR USD:                 1,0000
   Monto total retenido USD:      11,0000
Monto total a Pagar USD    11,0000
Monto total a Pagar VES  7.810,0000
```

⇒ **`Monto Saldo` no existe en este flujo**, así que el defecto **no puede reproducir aquí**: es
**N/A estructural, con evidencia** (captura `img/R3-tab-total-acordeon.png`). Los montos que sí muestra
son correctos: `Monto total a Pagar = IVA + ISLR = 11,00`, que es el oráculo esperado de `co_type=2`.

**Observación menor (no es el defecto):** el acordeón rotula `Fecha del documento: 2026-08-26`, pero
esa es la **Fecha Comp Ret** que se cargó hoy; la fecha real del documento `0099000011` es **2023-11-21**
(se lee en el propio modal de detalle). Etiqueta engañosa, cosmética.

---

## 6. Por qué el G2 del 26/08 dio PASS

Tres razones, las tres corregibles:

1. **Se validó contra la fórmula del código, no contra la regla de negocio.** Se comprobó que
   `Monto Saldo == Monto Doc. − Monto Pago` y se dio por bueno. Esa igualdad **se cumple siempre** —
   es literalmente lo que hace `resolveDetailRemainingBalance`. Verificarla no prueba nada: es
   preguntarle al código si hace lo que hace. El oráculo correcto es **la deuda que le queda al
   cliente**, que baja por *pago + retenciones*.
2. **La captura publicada no cubría la columna acusada.** Mostraba
   `Monto Doc. | Retención IVA | Retención ISLR` con `50.701,1400 | 10,0000 | 1,0000`, y **ni `Monto
   Pago` ni `Monto Saldo`**. Con retención activa **aparecen dos columnas extra y la tabla se desplaza
   horizontalmente** (`ion-grid.tablaDocVentasGrip`, ancho real **909 px** en un viewport de **360 px**):
   el recorte quedó sobre las columnas nuevas y dejó fuera las que importaban.
3. **No hubo caso de control.** Sin comparar contra el mismo cobro con un documento **sin** retención,
   no había con qué contrastar el `11,0000` y se leyó como "saldo residual normal".

**Regla que queda de esto:** en toda columna calculada, el oráculo es la **regla de negocio**, no la
expresión del código; y **una captura que no muestre la celda acusada no es evidencia.**

---

## 7. Evidencia

### Capturas (`img/`)

La tabla mide **909 px** y el viewport **360 px**: las 7 columnas **no caben en una sola toma** (entran
3 por pantalla). Se resolvió con **tres recortes encadenados por columnas solapadas** — no hay corte
ciego entre ellos:

| Archivo | `scrollLeft` | Columnas visibles | Solape con la anterior |
|---|---|---|---|
| `R1R2-a-nrodoc-montodoc.png` | 122 | `Nro. Doc.` · `Monto Doc.` · (borde de `Retención IVA`) | — |
| `R1R2-b-montodoc-retenciones.png` | 326 | `Monto Doc.` · `Retención IVA` · `Retención ISLR` | **`Monto Doc.`** |
| `R1R2-c-pago-saldo.png` | 559 | `Retención ISLR` · `Monto Pago` · **`Monto Saldo`** | **`Retención ISLR`** |
| `R3-tab-total-acordeon.png` | — | Tab TOTAL completo del cobro tipo RETENCIÓN (sin tabla) | — |

Las tres filas aparecen **en el mismo orden** en las tres tomas (`0090000234` · `0099000045` ·
`010000016710032023`), por lo que `Nro. Doc.` → `Monto Doc.` → `Monto Saldo` se encadenan sin ambigüedad.
`R1R2-c` es la prueba central: muestra `Monto Pago 3.827,5600` junto a **`Monto Saldo 11,0000`**, y en la
fila de control `19.361,4400` junto a `0,0000`.

> Se intentó una toma única con las tres columnas juntas por dos vías y **ninguna es posible en este
> build**: la app está **bloqueada en vertical** (`user_rotation=1` no cambia el viewport, sigue 360×744)
> y el `zoom` CSS sobre el `ion-grid` escala también el viewport de scroll, así que siguen entrando
> 3 columnas.

### Registros dejados en el dispositivo (BD local, **NO enviados**)

| `local_id` | `co_collection` | `co_type` | `st_delivery` | `id_collection` | Monto total | Contenido |
|---|---|---|---|---|---|---|
| 84 | `1787775384077.0` | 0 | **3 = Guardado** | 0 | 0,00 USD | R1 + R2 + control (3 documentos) |
| 85 | `1787776388657.0` | 2 | **3 = Guardado** | 0 | 11,00 USD | R3 (1 documento) |

`collection_details` local — la retención **persiste** tal como se cargó:

| `co_collection` | `co_document` | `nu_balance_doc_original` | `nu_amount_paid` | `nu_amount_retention` | `nu_amount_retention2` | `in_payment_partial` |
|---|---|---|---|---|---|---|
| `1787775384077.0` | `0090000234` | 3838.56 | 3827.56 | 10 | 1 | false |
| `1787775384077.0` | `0099000045` | 19361.44 | 19361.44 | 0 | 0 | false |
| `1787775384077.0` | `010000016710032023` | 38581.82 | 1000 | 20 | 5 | true |
| `1787776388657.0` | `0099000011` | 50701.14 | 11 | 10 | 1 | false |

**No se envió ninguno** (es un defecto de presentación; además el cobro con retención exige adjunto para
enviar en este cliente). Ambos quedan **Guardados** y reabribles desde BUSCAR para inspección manual.

---

## 8. Impacto para el negocio

> **El vendedor ve al cliente debiendo justo el monto que ya le retuvo.** En R1 la factura quedó
> completamente saldada (pago + retención = saldo) y la app la muestra con **11,00 USD pendientes**:
> el vendedor puede volver a gestionar cobranza sobre un documento cerrado, dejarlo abierto en su
> cartera o generar un reclamo indebido al cliente. **El error escala con el monto retenido**, y en
> retenciones reales (IVA 75 % sobre el impuesto) son cifras muy superiores a las de esta prueba.

---

## 9. Pasos de reproducción manual (sin automatización)

**Precondición:** vendedor `1276`, empresa **1003 — C.A. DESTILERIA YARACUY**, cliente
`1000002025 — CAYETANO FARIAS E HIJOS C.A`.

### Caso R1 — Cobro con retención (el reportado)

1. HOME → **Cobros** → botón **COBRO**.
2. Tab **General** → selector **Empresa**: cambiar de *CENTRAL EL PALMAR, S.A.* a **C.A. DESTILERIA YARACUY**.
   Sale el alerta *«Se ha detectado cambio del empresa…»* → **Aceptar**.
3. Tocar **Cliente** → buscar `1000002025` → pulsar **Enter** → elegir *CAYETANO FARIAS E HIJOS C.A*.
4. Selector **Moneda del cobro**: cambiar de **VES** a **USD**. *(Hacerlo antes de tocar documentos:
   el cambio de moneda reordena la lista.)*
5. Escribir cualquier texto en **Comentario** (es obligatorio en este cliente) → se habilitan las 4 tabs.
6. Tab **Documentos** → **Moneda Documento = USD**.
7. Marcar el check del documento **`0090000234`** (saldo `3.838,5600` USD).
8. En esa misma fila, pulsar la **lupa** → abre *Detalle Del Documento*.
9. **`Nro. Comp Ret`** → escribir **`12345`** (debe tener **5 dígitos**). Al hacerlo se habilitan
   *Fecha Comp Ret*, *Monto retenido IVA* y *Monto retenido ISLR*.
10. **`Monto retenido IVA`** = `10,0000` · **`Monto retenido ISLR`** = `1,0000`.
    → Observar que **`Monto a pagar USD` baja sola a `3.827,5600`** (la app ya descontó los 11,00).
11. **GUARDAR** el detalle.
12. Ir al Tab **TOTAL** y **desplazar la tabla hacia la derecha hasta ver la columna `Monto Saldo`**.

**Resultado esperado:** `Monto Saldo = 0,0000` (el documento quedó saldado: 3.827,56 + 11,00 = 3.838,56).
**Resultado obtenido:** 🔴 **`Monto Saldo = 11,0000`** — exactamente el monto retenido.

### Caso de control (obligatorio, aísla la causa)

13. Volver al Tab **Documentos** y marcar además **`0099000045`** (saldo `19.361,4400`), **sin** cargarle
    ninguna retención.
14. Tab **TOTAL** → esa fila muestra `Monto Pago 19.361,4400` y **`Monto Saldo 0,0000`** ✅.

⇒ Misma pantalla, misma tabla: **solo falla la fila con retención**.

### Caso R2 — Pago parcial con retención

15. Tab **Documentos** → marcar **`010000016710032023`** (saldo `38.581,8200`) → **lupa**.
16. `Nro. Comp Ret` = `54321` · IVA = `20,0000` · ISLR = `5,0000`.
17. Activar el toggle **«Pago parcial»** → `Monto a pagar` se resetea → escribir **`1.000,0000`**.
18. **GUARDAR** → Tab **TOTAL**.

**Esperado:** `37.556,8200` · **Obtenido:** 🔴 **`37.581,8200`** (inflado en los 25,00 retenidos).

### Caso R3 — Cobro tipo RETENCIÓN

19. Salir del cobro (**Guardar y salir**) → menú Cobros → botón **RETENCIÓN**.
20. Repetir pasos 2-6 (empresa 1003, cliente, USD, comentario, moneda documento USD).
21. Marcar **`0099000011`** → **lupa** → `Nro. Comp Ret` = `11111` → **Fecha Comp Ret** (obligatoria en
    este flujo: sin ella el botón GUARDAR no habilita) → IVA `10,0000` · ISLR `1,0000` → **GUARDAR**.
22. Tab **TOTAL** → expandir el acordeón `Nro. Doc.: 0099000011`.

**Resultado:** no hay tabla ni columna `Monto Saldo`; solo *Monto Doc. / Monto IVA / Monto ISLR /
Monto total retenido* y `Monto total a Pagar USD = 11,0000` (correcto). **El defecto no aplica aquí.**

---

## 10. Notas de perfil que quedan pendientes de corregir

- 🔴 **`vgs.sizeRetention` en `automation/clientes/el_palmar.yaml` sigue en `0`** (marcado ⚠️VERIFICAR).
  El valor real, leído en la UI de hoy, es **5**: el modal rotula literalmente *«Debe tener 5 caracteres.»*
  y con menos de 5 dígitos el campo no habilita IVA/ISLR. **Actualizar a `sizeRetention: 5`.**
- `dynamicRetentions = false` confirmado en runtime ⇒ este tenant usa la **variante FIJA** del detalle de
  retención (`Nro. Comp Ret` → habilita *Fecha Comp Ret* + *IVA* + *ISLR*), no el selector dinámico.
- En el flujo `co_type = 2` la **Fecha Comp Ret SÍ bloquea** el GUARDAR del detalle (en `co_type = 0` no).
