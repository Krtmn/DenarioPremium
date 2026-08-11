# Validación en dispositivo — FIX `CLT-LISTA-SALDOS-CRUZADOS`

| Parámetro | Valor |
|-----------|-------|
| Fecha | 2026-08-06 |
| Cliente | **globalmp** |
| Playa | **LA TORTUGA** (`denariolatortuga.ddns.net:8081`) |
| Usuario | `coUser = YC01` · `idUser = 307` |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db 19 · `window.ng = true` |
| Monedas | `hardCurrency = USD` · `localCurrency = BS` |
| Tipo de corrida | **SOLO LECTURA** — no se creó, guardó ni envió ningún registro |
| Estado final | app en **HOME**, sin overlays, sin nada creado |

---

## 1. Tasa leída en la app

**`737,88`** — leída en la columna **Tasa** del tab *Doc. de Venta* de los 5 clientes alcanzados
(todos los documentos rotulan `737,88 BS`).

Coincide con la tasa vigente informada (**737,8800**) ⇒ **no hubo que recalcular ningún BS esperado**.

Confirmación cruzada independiente, sin usar la columna Tasa:
`Crédito BS / Crédito USD` = `2.177.867.577,60 / 2.951.520,00` = **737,88** exacto (AS04).

---

## 2. Saldos — listado vs. detalle vs. esperado

Todos los valores están copiados **literales**, con las etiquetas exactas de la UI
(`Saldo BS:` / `Saldo USD:` en el listado; `Saldo BS:` / `Saldo USD:` en el detalle).

| # | Cliente | Empresa | `Saldo USD` listado | `Saldo USD` detalle | **Esperado USD** | Δ |
|---|---------|---------|--------------------|--------------------|------------------|---|
| 1 | **AS04** ABASTO EL SITIO DSG, C.A. | 00002 | **2.096,23** | **2.096,23** | **2.096,23** | **0,00** |
| 2 | **AS04** ABASTOS SORRENTE, C.A | 00001 | — no sincronizado — | — | 1.720,05 | *no determinable* |
| 3 | AV10 ALIMENTOS VANDAL, C.A | 00002 | 11.603,22 | 11.603,22 | 11.603,22 | 0,00 |
| 4 | IY06 INVERSIONES YOUYU, C.A. | 00002 | 2.269,87 | 2.269,87 | 2.269,87 | 0,00 |
| 5 | VB01 VÍVERES JULIÁN BLANCO, C.A | 00001 | 1.440,18 | 1.440,18 | 1.440,18 | 0,00 |
| 6 | CS03 COMERCIALIZADORA SAVI-LOR, C.A. | 00002 | 1.281,71 | 1.281,71 | 1.281,71 | 0,00 |

| # | Cliente | `Saldo BS` listado | `Saldo BS` detalle | **Esperado BS** | Δ |
|---|---------|-------------------|-------------------|-----------------|---|
| 1 | **AS04** (00002) | **1.546.766,19** | **1.546.766,19** | **1.546.766,19** | **0,00** |
| 2 | AS04 (00001) | — no sincronizado — | — | 1.269.190,49 | *no determinable* |
| 3 | AV10 | 8.561.783,97 | 8.561.783,97 | 8.561.783,97 | 0,00 |
| 4 | IY06 | 1.674.891,68 | 1.674.891,68 | 1.674.891,68 | 0,00 |
| 5 | VB01 | 1.062.680,02 | 1.062.680,02 | 1.062.680,02 | 0,00 |
| 6 | CS03 | 945.748,17 | 945.748,17 | 945.748,17 | 0,00 |

**Los tres valores coinciden a la unidad de centavo en los 5 clientes alcanzables.**
No hay ni un solo caso donde listado y detalle difieran, ni donde difieran del esperado.

### Señal del defecto original (el "~738× más chico")

| Cliente | `Saldo USD` que mostraría el defecto (`saldo/tasa`) | `Saldo USD` que muestra HOY la app |
|---------|--------------------------------|------------------|
| AS04 (00002) | 2,84 | **2.096,23** ✅ |
| AV10 | 15,73 | **11.603,22** ✅ |
| IY06 | 3,08 | **2.269,87** ✅ |
| VB01 | 1,95 | **1.440,18** ✅ |
| CS03 | 1,74 | **1.281,71** ✅ |

El caso del reporte original (**AS04 lista `USD 2,84 / BS 2.096,23`**) **ya no reproduce**:
hoy el listado muestra `Saldo BS: 1.546.766,19` / `Saldo USD: 2.096,23`. **Defecto corregido.**

---

## 3. Tercer testigo — `Crédito − Crédito Disponible`

Restas hechas sobre las etiquetas literales del detalle (`Crédito USD:` / `Crédito Disp. USD:` /
`Crédito BS:` / `Crédito Disp. BS:`).

| Cliente | Crédito USD | Crédito Disp. USD | **Resta USD** | = Saldo USD | Crédito BS | Crédito Disp. BS | **Resta BS** | = Saldo BS | `restaBS / 737,88` |
|---------|------------|------------------|--------------|-------------|-----------|-----------------|-------------|------------|--------------------|
| AS04 (00002) | 2.951.520,00 | 2.949.423,77 | **2.096,23** | ✅ | 2.177.867.577,60 | 2.176.320.811,41 | **1.546.766,19** | ✅ | **2.096,23** ✅ |
| AV10 | 3.689.400,00 | 3.677.796,78 | **11.603,22** | ✅ | 2.722.334.472,00 | 2.713.772.688,03 | **8.561.783,97** | ✅ | **11.603,22** ✅ |
| IY06 | 1.106.820,00 | 1.104.550,13 | **2.269,87** | ✅ | 816.700.341,60 | 815.025.449,92 | **1.674.891,68** | ✅ | **2.269,87** ✅ |
| VB01 | 36.894.000,00 | 36.892.559,82 | **1.440,18** | ✅ | 27.223.344.720,00 | 27.222.282.039,98 | **1.062.680,02** | ✅ | **1.440,18** ✅ |
| CS03 | 959.244,00 | 957.962,29 | **1.281,71** | ✅ | 707.806.962,72 | 706.861.214,55 | **945.748,17** | ✅ | **1.281,71** ✅ |

- El **consumido en USD** reproduce exactamente el `Saldo USD` en los 5 clientes.
- El **consumido en BS** reproduce exactamente el `Saldo BS` en los 5 clientes.
- **`consumidoBS / tasa = consumidoUSD`** se cumple exacto en los 5 ⇒ **el defecto de mezcla de monedas
  detectado en el otro cliente NO aparece acá**, como se anticipaba (no hay documentos en BS que mezclar).

> ⚠ Ver el hallazgo **H-1** (§7): el tercer testigo da correcto, pero los **operandos** `Crédito USD` /
> `Crédito Disp. USD` **están inflados ×737,88**. La resta sobrevive porque el error es común a los dos
> operandos; el valor absoluto del crédito no.

---

## 4. Cuarto testigo (no pedido) — suma de los documentos del tab *Doc. de Venta*

Oráculo de coherencia interna: se sumó la columna **Saldo** de los documentos que **ve la app**.

| Cliente | Docs en la app | Docs esperados | Suma de la columna `Saldo` | `Saldo USD` mostrado | ¿Cuadra? |
|---------|---------------|----------------|---------------------------|---------------------|----------|
| AS04 (00002) | **16** | 16 | **2.096,23 USD** | 2.096,23 | ✅ exacto |
| AV10 | **1** | 1 | **11.603,22 USD** | 11.603,22 | ✅ exacto |
| IY06 | **3** | 3 | **2.269,87 USD** | 2.269,87 | ✅ exacto |
| VB01 | **3** | 3 | **1.440,18 USD** | 1.440,18 | ✅ exacto |
| CS03 | **4** | 4 | **1.281,71 USD** | 1.281,71 | ✅ exacto |

- **Los conteos de documentos coinciden exactamente con los esperados en los 5 clientes.**
- **100 % de los documentos están en USD** (columna `Moneda Doc.` = `USD` en todos) ⇒ un solo bucket
  por empresa, tal como describe el fix.
- La suma de la columna `Saldo Conversión` reproduce el `Saldo BS` con ≤ 2 céntimos de diferencia
  (redondeo por documento), p. ej. IY06: 1.674.891,67 sumado vs. 1.674.891,68 mostrado.

### Quinto testigo — contraste contra la nube

`client.nu_balance` de la BD nube coincide **a la unidad de centavo** con el `Saldo USD` del device en los 5:

| Cliente | `client.nu_balance` (nube) | `Saldo USD` (device) | `client.co_currency` (nube) |
|---------|---------------------------|---------------------|------------------------------|
| AS04 (00002) | 2096.2300 | 2.096,23 | **BS** ⚠ |
| AV10 | 11603.2200 | 11.603,22 | **BS** ⚠ |
| IY06 | 2269.8700 | 2.269,87 | **BS** ⚠ |
| VB01 (00001) | 1440.1800 | 1.440,18 | **BS** ⚠ |
| CS03 | 1281.7100 | 1.281,71 | **BS** ⚠ |

Esto es la **prueba de raíz del fix**: `client.co_currency` **sigue diciendo `BS`** en la nube mientras el
importe está en **USD**. La app ya **no** lo usa para el saldo (si lo usara, dividiría y mostraría 2,84).
El saldo derivado de los documentos coincide con el balance autoritativo del servidor.

---

## 5. Veredicto

| # | Cliente | Empresa | Saldo listado | Saldo detalle | Esperado | **Veredicto** |
|---|---------|---------|--------------|---------------|----------|---------------|
| 1 | **AS04** ABASTO EL SITIO DSG | 00002 | ✅ | ✅ | ✅ | **PASA** |
| 2 | AS04 ABASTOS SORRENTE | 00001 | n/d | n/d | — | **NO EJECUTADO** (no sincronizado — §6) |
| 3 | AV10 ALIMENTOS VANDAL | 00002 | ✅ | ✅ | ✅ | **PASA** |
| 4 | IY06 INVERSIONES YOUYU | 00002 | ✅ | ✅ | ✅ | **PASA** |
| 5 | VB01 VÍVERES JULIÁN BLANCO | 00001 | ✅ | ✅ | ✅ | **PASA** |
| 6 | CS03 COMERCIALIZADORA SAVI-LOR | 00002 | ✅ | ✅ | ✅ | **PASA** |

### 🟢 VEREDICTO GLOBAL DEL FIX: **PASA**

`CLT-LISTA-SALDOS-CRUZADOS` está **corregido**. En los **5 clientes alcanzables** (incluido el caso estrella
AS04 del reporte original) el `Saldo USD` y el `Saldo BS` del **listado** coinciden **exactamente** con el
**detalle** y con el **valor esperado**, y se sostienen contra **tres oráculos independientes**: la resta de
créditos, la suma de los documentos del tab *Doc. de Venta*, y el `client.nu_balance` de la nube.

**No se repite el error del fix devuelto:** las dos pantallas no solo coinciden entre sí — coinciden con
el valor correcto.

---

## 6. 🔴 Prueba de agrupación por empresa en AS04

**Resultado: PASA el test negativo. El test positivo lado-a-lado NO es determinable en este device.**

Lo verificado:

1. **La lista de clientes tiene un selector de empresa** (`app-client-list ion-select`, valor = el objeto
   empresa completo) con dos opciones: `00002` COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P (default,
   `enterpriseDefault=true`, `prioritySelection=0`) y `00001` HC TRADING MARKET 2021.
   La lista se **filtra por empresa**: 50+ clientes en la 00002, **16** en la 00001.
2. Con el selector en **00002**, AS04 muestra **2.096,23 USD**.
3. 🔴 **NO muestra 3.816,28** (= 2.096,23 + 1.720,05, la suma de las dos empresas).
   ⇒ **la agrupación por empresa NO está rota** en la forma que el reporte pedía descartar.
4. Refuerzo: los **16 documentos** que la app lista para AS04/00002 suman **exactamente 2.096,23**;
   ninguno de los 2 documentos de la empresa 00001 (1.720,10 en la nube) se cuela en el cálculo.

Lo **no** determinable: **no se pudo poner las dos AS04 lado a lado en el device**, porque
**AS04 / ABASTOS SORRENTE, C.A (empresa 00001) no está sincronizada** en este dispositivo (ver §6.b).

> Confirmación de que el par existe realmente en la nube:
> ```
> co_client  na_client                    co_enterprise  nu_balance   co_currency
> AS04       ABASTOS SORRENTE, C.A        00001          1720.0490    BS
> AS04       ABASTO EL SITIO DSG, C.A.    00002          2096.2300    BS
> ```
> Son **dos registros de cliente distintos** con el **mismo código** y empresas distintas — el escenario
> de agrupación es real, y el `1720.0490` de la nube redondea a los **1.720,05** esperados.

### 6.b Cliente no sincronizado y sustitución

- **AS04 / ABASTOS SORRENTE, C.A (empresa 00001) — NO sincronizado en el device.**
  Evidencia: con el selector en 00001 la lista trae **16 clientes completos** (sin paginación pendiente) y
  ABASTOS SORRENTE **no está**; las búsquedas por `SORRENTE` y por `ABASTOS` devuelven **0 resultados**.
  Es el patrón ya documentado de **sync parcial por vendedor**. No se pudo atribuir la causa a un vendedor
  concreto: `document_sale.id_user` viene **NULL** en todas las filas de globalmp ⇒ **causa no determinable**,
  solo el hecho.
- **Sustitución:** el caso **VB01** ya presente en la lista (#5) **cumple la misma función** que AS04 —
  es el **segundo** código repetido en las dos empresas, con clientes distintos:

  | co_client | na_client | co_enterprise | nu_balance (nube) |
  |-----------|-----------|---------------|--------------------|
  | VB01 | VÍVERES JULIÁN BLANCO, C.A | 00001 | 1440.1800 |
  | VB01 | **VIVERES BITTO 2018, C.A.** | 00002 | 89.8900 |

  En el device, VB01/00001 muestra **1.440,18** y **no** 1.530,07 (= 1.440,18 + 89,89) ⇒ **segunda
  confirmación independiente de que no hay suma cruzada entre empresas.**
  ⚠ El otro lado (VIVERES BITTO, empresa 00002) **tampoco está sincronizado** (búsqueda `BITTO` = 0
  resultados) ⇒ **el lado-a-lado tampoco se puede montar con VB01**. No se sustituyó por un tercer cliente
  porque **no existe ningún otro código repetido entre empresas con ambos lados sincronizados** en este device.

**Conclusión de la prueba de agrupación:** no hay evidencia de agrupación rota, y hay **dos** confirmaciones
independientes (AS04 y VB01) de que el saldo de una empresa **no** arrastra el de la otra. La verificación
lado-a-lado en una misma pantalla queda **pendiente**, y requiere un device/vendedor con ambos lados
sincronizados.

---

## 7. Hallazgos — cosas raras detectadas

### 🔴 H-1 · `Crédito USD` y `Crédito Disp. USD` están inflados ×737,88 (mismo defecto, campo distinto)

**El fix corrigió el `Saldo`, pero los campos de CRÉDITO del detalle siguen con el patrón original**
(un factor de conversión de más, con la etiqueta de la moneda equivocada).

Evidencia — el `nu_credit_limit` de la nube contra el `Crédito USD` que muestra la app:

| Cliente | `nu_credit_limit` (nube) | `Crédito USD` mostrado | Ratio |
|---------|--------------------------|------------------------|-------|
| AS04 (00002) | **4.000,00** | 2.951.520,00 | **737,88** |
| AV10 | **5.000,00** | 3.689.400,00 | **737,88** |
| CS03 | **1.300,00** | 959.244,00 | **737,88** |
| IY06 | **1.500,00** | 1.106.820,00 | **737,88** |
| VB01 (00001) | **50.000,00** | 36.894.000,00 | **737,88** |

Los límites reales son cifras **redondas** (4.000 / 5.000 / 1.300 / 1.500 / 50.000 USD) — coherentes con
comercios de este porte. Los valores mostrados (**~3 millones de "USD"** para un abasto, **~37 millones**
para VB01) no lo son. Y `Crédito BS` es ese número **multiplicado otra vez** por la tasa
(2.951.520,00 × 737,88 = 2.177.867.577,60), es decir el límite × tasa².

**Lo que debería mostrar AS04/00002:** `Crédito USD: 4.000,00` · `Crédito BS: 2.951.520,00` ·
`Crédito Disp. USD: 1.903,77` · `Crédito Disp. BS: 1.404.753,81`.

**Impacto funcional real** — el crédito disponible se calcula restando un saldo en **USD** de un crédito en
magnitud **BS**, así que la disponibilidad es materialmente falsa. El caso más claro es **AV10**: límite
5.000 USD contra un saldo de 11.603,22 USD ⇒ el cliente está **excedido** y `Crédito Disp.` debería ser
**negativo (−6.603,22)**; la app muestra **3.677.796,78** como disponible.

> Nota metodológica: este hallazgo **no invalida** el veredicto del fix de saldos ni el tercer testigo.
> La resta `Crédito − Crédito Disp.` sigue dando el `Saldo USD` correcto porque el mismo error afecta a los
> dos operandos. Es un **defecto hermano, en campos distintos de los que cubría el fix**.

**Recomendación:** levantar como defecto aparte (sugerido `CLT-DETALLE-CREDITO-CRUZADO`) y aplicarle el
mismo criterio del fix de saldos — derivar/interpretar el crédito sin confiar en `client.co_currency`.

### ⚠ H-2 · La nube tiene muchos más documentos abiertos que el device (no es defecto)

`document_sale` con `nu_balance <> 0` en la nube vs. lo que lista la app:

| Cliente | Docs nube | Suma nube | Docs device | Suma device |
|---------|-----------|-----------|-------------|-------------|
| AS04 (00002) | 107 | 4.956,99 | 16 | 2.096,23 |
| AV10 | 25 | 42.566,88 | 1 | 11.603,22 |
| IY06 | 43 | 4.685,58 | 3 | 2.269,87 |
| CS03 | 38 | 6.160,23 | 4 | 1.281,71 |
| VB01 (00001) | 11 | 4.981,44 | 3 | 1.440,18 |

**No es defecto** y **no afecta el veredicto**: el device es internamente consistente (sus documentos suman
su saldo) **y** coincide con `client.nu_balance` de la nube, que es el balance autoritativo. El conteo de
documentos del device coincide además **exactamente** con el esperado del reporte (16/1/3/3/4) ⇒ el subconjunto
sincronizado es justamente el que corresponde. Se deja registrado para que nadie tome
`sum(document_sale)` de la nube como oráculo del saldo.

### ⚠ H-3 · `client.co_currency = 'BS'` sigue siendo un dato erróneo en la nube

En los 6 registros de cliente inspeccionados, `co_currency` dice **`BS`** mientras `nu_balance` y
`nu_credit_limit` están en **USD**. **El fix del saldo esquiva el dato malo, pero el dato malo sigue ahí** —
y es exactamente el que H-1 sigue consumiendo. Vale la pena corregirlo en origen o dejarlo formalmente
deprecado, o cada campo nuevo que lo lea reintroducirá el defecto.

### ✅ Sin anomalías de presentación

- Etiquetas **no** cruzadas en `Saldo`: `Saldo USD` trae el importe en USD y `Saldo BS` el importe en BS
  (`Saldo BS = Saldo USD × 737,88` verificado en los 5).
- **Sin saldos repetidos entre empresas**: los dos códigos duplicados (AS04, VB01) muestran valores propios.
- Listado y detalle usan las **mismas etiquetas** (`Saldo BS:` / `Saldo USD:`) — sin inversión de moneda.
- Ningún cliente con saldo 0,00 inesperado entre los evaluados.

---

## 8. Notas técnicas (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **`app-client-list` tiene un `ion-select` de EMPRESA** | universal (multi-empresa) | Sin `formcontrolname`. Su `value` es el **objeto empresa completo** (`{idEnterprise, coEnterprise, lbEnterprise, coCurrencyDefault, prioritySelection, enterpriseDefault, naEnterprise, nuRif, txAddress}`). Cambiar con `s.value = <objeto de la ion-select-option>` + `ionChange`; la lista se recarga sola (~2,5 s). **La lista de clientes se filtra por empresa** ⇒ un cliente "ausente" puede estar simplemente en la otra empresa. Es lo primero que hay que mirar antes de cantar "no sincronizado". |
| Paginación de `app-client-list` | universal | `onIonInfinite({target:{complete:()=>{}}})` invocado por componente **NO** agrega ítems (queda en 50). Usar el **buscador** (filtra por `na_client`, substring case-insensitive) para alcanzar clientes fuera de la 1.ª página. Reconfirma `[dm-electronica-20260713][latino_cosmetica-20260714]`. |
| `app-client-list` — funciones del componente | universal | `onIonInfinite`, `onIonInfiniteFinish`, `handleInput`, `oppositeCoCurrency`, `formatNumber`, `onSearchEnter`, `onSearchClicked`, `runSearch`, `checkUserStatus`, **`onChangeEnterprise`**. Props: `indice`, `scrollDisable`, `isSearching`, `searchText`, `listaEmpresa` (llega **vacío** aunque el select sí tenga opciones). |
| Botón de búsqueda | universal | `ion-icon[name="search-circle-sharp"]` en coords **(317, 94)** en este device. Requerido: la lista **no** filtra on-keyup. Para re-buscar: click en el input → `Control+A` → `type(term)` → click en el botón. |
| Tab *Doc. de Venta* — apertura programática | universal | `seg.value='docVentas'` + `ionChange` renderiza `.documents-table-panel--ready` sin necesidad de `mouse.click` de respaldo (build v1.0/db19 La Tortuga, `window.ng=true`). Tabla con 19 columnas tab-separadas; `Saldo` es la col. 14 y `Saldo Conversión` la 15 (0-indexado sobre `innerText.split('\t')`). |
| Oráculo barato de saldos | universal | Sumar la columna `Saldo` del tab *Doc. de Venta* y cotejar contra el `Saldo USD` del detalle. Cazó los 5 casos a la primera. Reconfirma la recomendación de `[el_palmar-20260805]`. |
| `document_sale.id_user` es NULL en globalmp | cliente | No sirve para atribuir documentos a un vendedor. Para explicar un "no sincronizado" hay que ir por la asignación cliente↔vendedor, no por el documento. |
| Namespace propio `window.__qaS` | universal | Se registró un namespace propio (skills `rect`/`homeTile`/`views`/`byText`) en vez de reinstalar `__qaH`, siguiendo la receta graduada de `[alipascua-20260804][el_palmar-20260805]`. El WebView venía **sin** `__qaH` (app recién reiniciada) y **no se instaló** ninguna captura de payload: corrida de solo lectura, no hay POST que capturar. |

---

## 9. Constancia de solo-lectura

- **No** se creó, guardó, envió ni borró ningún registro.
- Las únicas escrituras en la UI fueron **texto en el buscador de clientes** (limpiado al final) y el
  **cambio del selector de empresa** (estado de vista, no dato); ambos revertidos.
- Consultas de BD: **solo `SELECT`** contra la nube de globalmp (`client`, `document_sale`,
  `information_schema.columns`).
- Estado final verificado: `views = ['app-home']`, `location.pathname = '/home'`, 0 overlays activos.
