# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260818_152824_smoke-completo` |
| Módulo | PRODUCTOS (solo lectura) |
| Cliente / empresa | `run_vzla` — **CORPORACION FERRE 19** (`FERRE_N`, `id_enterprise=1`) |
| Playa | **LA TORTUGA** (`denariolatortuga.ddns.net:8081`) |
| App | `com.kiberno.denarioPremiumPro` · `window.ng=TRUE` · `sqlitePlugin` disponible |
| Usuario QA | `***` / `***` (`id_user=470`, `co_user='000208'`) |
| Namespace CDP | `window.__qaPRO` (7 skills) · hook de payload heredado (`__qaDataHook=true`, 153 payloads) — **no reinstalado** |
| Catálogo | **1.649 productos** · 36 estructuras (Marca) · 107 (Sub-Linea) |
| Resultado | **9 PASS · 0 FAIL · 0 SKIP · 8 N/A · 0 BLOCKED** (17 casos) |
| Estado final | HOME ✅ |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | `product-structures-list` con **36 estructuras**. `sel[0]`=empresa `CORPORACION FERRE 19` (`disabled=true`, objeto auto-asignado), `sel[1]`=tipo. 🔑 **La suma de los 36 badges da 1.649 EXACTO** = catálogo total de BD |
| DM-PRD-002 | ✅ PASS | Tipo `Marca` (36 estructuras) → **`Sub-Linea` (107)** → vuelta a `Marca` (36). Suma de badges Sub-Linea = **1.648**, cotejada con BD (1.648 productos en tipo 2 + 1 producto asignado directo a un tipo 1) |
| DM-PRD-004 | ✅ PASS | 4 estructuras abiertas: `HERRAMIENTAS MANUALES` 348 · `CERRADURAS` 109 · `ELECTRODOS` 4 · `ILUMINACION` 286. Cada ítem: Nombre + `Código:` + `Precio: N US$` + `Inventario: N` (+ `Mínimo:`/`Múltiplo:` cuando el producto los trae) |
| DM-PRD-006 | ✅ PASS · oráculo BD | `LLAVE` + **Enter** en CERRADURAS ⇒ 109 → **13**, `comp.searchText="LLAVE"`. BD: `LLAVE` = **81 en todo el catálogo / 13 en el subárbol CERRADURAS** ⇒ el buscador está **acotado a la estructura** y cuadra **al ítem**. `LLA-01` ⇒ **1** (código exacto) |
| DM-PRD-007 | ✅ PASS | `ZZZZZZZ` + Enter ⇒ **0 ítems**, `ion-item`s crudos = 0, y `<p class="search-empty-state ion-text-center">No hay productos disponibles</p>` **FUERA de `ion-list`** (5.ª build con esta forma) |
| DM-PRD-009 | ✅ PASS | Paginación real ejercida en HERRAMIENTAS MANUALES: **50 → 100 → 150 → 200 → 250 → 300 → 348** (7 páginas) con `ion-infinite-scroll.disabled` pasando a **`true`** al agotar. `modelo === dom === 348 === badge` |
| DM-PRD-012 | ✅ PASS | `product-detail` (`ProductDetailComponent`) monta a ~2,5 s y **desmonta** `product-list`+`productos-search`; URL invariante en `/productos`. `LLA-01`: Nombre · Código · Estructura **CERRADURAS DE POMO** · Unidad **UNIDADES** · Lista **PRECIO LISTA 1** · **Precio 0,51 US$** · Almacén **LA MORITA** · Inventario **215074** · **Mínimo 20 / Múltiplo 20**. `swiper-container` presente (`showProductImages=true`), 2 imágenes |
| DM-PRD-013 | 🚫 N/A estructural | **Emitido con el detalle abierto e inspeccionado en 2 productos** (`LLA-01` y `ELE01`). `priceListService.productlists` = **1 sola lista** (`PRECIO LISTA 1`, `idList:1`, `coList:'01'`) y el `ion-select` llega correctamente **`disabled=true`** con 1 opción. Coherente con `userCanChangePriceList=false`. Ver "Descubrimientos" para el contraste con la nube |
| DM-PRD-020 | ✅ PASS | Back desde detalle → `product-list` **con el filtro intacto** (`LLA-01` ⇒ 1 ítem, `input.value="LLA-01"`; y 4 ítems al volver de `ELE01`). Back = `img[src*=flecha-blanca]` → `closest('a')` en **(34,51)** |
| DM-PRD-021 | ✅ PASS | Back desde `product-structures-list` → **HOME** (`/home`, `app-home`, 10 tiles). Reconfirmado: back desde `product-list` **también sale directo a HOME** (no pasa por estructuras) |
| DM-PRD-030 | 🚫 N/A | `allowProductReports=false` (leído del Map de VGs en runtime **y** del atributo `ng-reflect-allow-product-reports="false"`). **`button.reports-entry-button` = 0** ⇒ el botón no aparece, como debe |
| DM-PRD-031 | 🚫 N/A | ídem — sin pantalla de reportes |
| DM-PRD-032 | 🚫 N/A | ídem |
| DM-PRD-033 | 🚫 N/A | ídem |
| DM-PRD-034 | 🚫 N/A | N/A estructural permanente por diseño (`canGenerateExcel()` ⇒ solo `priceList`) **+** VG apagada |
| DM-PRD-035 | 🚫 N/A | ídem |
| DM-PRD-036 | 🚫 N/A | ídem |

---

## Registros creados en sistema

**N/A — módulo de solo lectura.** No se creó, modificó ni envió ningún registro. Nada anexado a `_bd-manifest.jsonl`. Marca BD de todos los casos: `BD-N/A`.

---

## Descubrimientos

### 1. 🔑 El badge de estructura es un ROLLUP del subárbol — y se predice EXACTO

`idProductStructureList` del componente expone el subárbol expandido. En CERRADURAS trajo **`[95,96,97,98,99,100,101]`** (7 ids), y la BD lo confirma al ítem:

| id | estructura | tipo | productos |
|----|-----------|------|-----------|
| 95 | CERRADURAS | Marca | 0 |
| 96 | CERRADURAS DE POMO | Sub-Linea | 66 |
| 97 | CERRADURA DE MANILLA | Sub-Linea | 17 |
| 98 | CERRADURAS DE EMBUTIR | Sub-Linea | 6 |
| 99 | CILINDROS | Sub-Linea | 4 |
| 100 | CERROJOS | Sub-Linea | 12 |
| 101 | SEGURIDAD | Sub-Linea | 4 |
| | **Σ** | | **109 = badge = listados** |

Y a nivel catálogo: **Σ 36 badges de Marca = 1.649 = catálogo total**; **Σ 107 badges de Sub-Linea = 1.648** (BD: 1.648 productos cuelgan de una Sub-Linea y **1 solo** cuelga directo de una Marca). **Cero brecha badge↔lista en las 4 estructuras abiertas** ⇒ `PRD-LISTA-CORTA-CATALOGO` **no reproduce** en este cliente.

### 2. 🟠 `hideStock0=true` NO oculta nada en el módulo PRODUCTOS

`productService.catalogHideStock0 === true` (leído en runtime), y sin embargo los productos con inventario 0 **se listan**:

| Estructura | badge | listados | de ellos con `Inventario: 0` |
|---|---|---|---|
| HERRAMIENTAS MANUALES | 348 | **348** | **131** |
| CERRADURAS | 109 | **109** | **37** |
| ELECTRODOS | 4 | **4** | 1 (`ELE02`) |

⇒ **La receta de kron `badge − listados = ocultos` NO aplica acá: la brecha es CERO.** El catálogo muestra el 100 % de los productos de la estructura, con y sin stock.
**Precisión:** esto acota el alcance de la VG, no prueba que esté rota en toda la app — el bloqueo de venta real lo da `stock0=false` en el selector de PEDIDOS, que es otro widget. **Medir por módulo.** Severidad baja: el módulo es de solo lectura y no hay pérdida de datos.

### 3. 🟠 `quPageProduct=150` no gobierna el tamaño de página de `product-list`

La VG vale **`"150"`** en el Map de configuración en runtime, pero la paginación medida avanza de **50 en 50** (`50→100→150→200→250→300→348`, `comp.page` 0→6). Sin pérdida de datos (348 = badge = BD) y el corte por `ion-infinite-scroll.disabled` es correcto; el efecto es **3× más viajes de `ionInfinite`** de los configurados. Reproduce en vivo en el build actual. Severidad baja.

### 4. 🔴 `PRD-BUSCADOR-NO-REPUEBLA` reproduce — y tiene una **variante nueva** por el botón X

Medido contra baseline 50 (1.ª página de CERRADURAS):

| Acción | Resultado |
|---|---|
| Baseline (estructura recién abierta) | **50** ítems |
| Teclear `LLAVE` **sin** Enter | **50** — `comp.searchText=""` ⇒ **NO filtra on-keyup** |
| `LLAVE` + **Enter** | **13** · `searchText="LLAVE"` ✅ |
| Vaciar con Backspace + **Enter** | 🔴 **0 ítems + empty-state**, con `input.value===""` **y** `comp.searchText===""` (estado idéntico al baseline que da 50) |
| `LLAVE` + Enter (otra vez) | 13 ✅ |
| **`button.clear-search` (X)** | 🔴 **variante nueva:** limpia `input.value` y `comp.searchText` a `""` pero **NO re-dispara la búsqueda** ⇒ la lista queda **congelada en los 13** del filtro anterior |

⇒ Ninguno de los dos caminos de limpieza devuelve la lista de la estructura. Defecto **ya conocido** (RUNTIME §5 / `module-selectors/productos.md`) ⇒ **no se re-marca FAIL**; se reporta como reconfirmación (**6.ª corrida**, La Tortuga) **+ la variante del botón X, que es nueva**. Recuperación verificada: **re-entrar a la estructura desde HOME**.

### 5. `listProductsBy="lineas"` — cierre del pendiente #5 del YAML

El `ion-select` de tipo de estructura ofrece **exactamente dos** opciones, y ninguna se llama "lineas":

- **`Marca`** — `{idTypeProductStructure:1, coTypeProductStructure:'001'}` — **es el default**
- **`Sub-Linea`** — `{idTypeProductStructure:2, coTypeProductStructure:'002'}`

Además, **`listProductsBy` ni siquiera está presente** en el `Map` de 176 VGs que la app carga en runtime (es una clave *solo-override de cliente*, y el override no se carga). ⇒ **Confirma `[kron-20260817]` con evidencia más fuerte**: la VG designa el modo de agrupar, **no el rótulo**, y acá ni llega al dispositivo. **Leer el rótulo del `ion-select` en runtime, nunca derivarlo de la VG.** Coincide 1:1 con lo medido en PEDIDOS esta misma corrida.

### 6. `productMinMul=true` — rotulado verificado en lista **y** en detalle

`catalogProductMinMul === true`. Las etiquetas `Mínimo:` / `Múltiplo:` se renderizan **por producto**:

- `LLA-01` → `Mínimo: 20 · Múltiplo: 20` (en la lista **y** en `product-detail`)
- `DICGU01` → `Mínimo: 10 · Múltiplo: 10`
- Los 4 `ELE0x` → `Mínimo: 20 · Múltiplo: 20`
- **5 de 109** productos de CERRADURAS los traen; **0 de 348** en HERRAMIENTAS MANUALES

⇒ **La ausencia de las etiquetas NO es defecto**: la VG habilita la función, el dato la activa (reconfirma lo medido en PEDIDOS con `GU01`).

### 7. Búsqueda: substring y diacríticos

- **Substring confirmado sobre el código:** en ILUMINACION, `GU01` devuelve **`DICGU01`** (`GU01` es substring de `DICGU01`). El producto `GU01` real vive en otra Marca, así que dentro de una estructura el substring es el único match posible.
- **Diacríticos: 🚫 N/A por dato.** `SELECT count(*) … na_product ~ '[áéíóúÁÉÍÓÚñÑ]'` ⇒ **0 de 1.649**. Aplicada la receta de `[difranca-20260807]`: sin tildes en el dato, el caso no se puede probar ni fallar.

### 8. Listas de precio: la nube tiene 2, el device baja 1 (no es defecto)

| Fuente | Listas |
|---|---|
| Nube (`list`) | **2** — `01 PRECIO LISTA 1` (1.597 productos) · `05 PRECIO LISTA 5` (86 productos) |
| Device — `productService.catalogListaList` | **2** (conoce ambas) |
| Device — `productService.catalogListaPricelist` | **1.597 filas, todas `idList:1`** (los precios de la lista 05 **no bajaron**) |
| Device — `priceListService.productlists` | **1** (`PRECIO LISTA 1`) |
| UI — `ion-select` del detalle | **1 opción, `disabled=true`** |

`ELE01` está en ambas listas en la nube (**3,80** en la 01 · **3,04** en la 05) y el detalle muestra **3,80 US$** — el precio de la lista asignada, correcto. Con `userCanChangePriceList=false` el comportamiento es el esperado ⇒ **N/A, no defecto**. Los otros dos `ion-select` del detalle también llegan `disabled=true` con 1 opción, y la BD lo respalda: **1 almacén** (LA MORITA) y **1 unidad** para `LLA-01`.

### 9. Moneda del detalle

Detalle **y** `product-list` muestran **solo US$**, sin línea en Bs. Coherente con el tenant mono-moneda (`hardCurrency=""`, `multiCurrency=false`, `comp.defaultCurrency='US$'`, `basePriceHard=0`). **No** es el patrón "detalle solo USD / lista USD+BS" de El Yaque: acá **ninguna** de las dos vistas trae Bs, porque no hay moneda fuerte que mostrar.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **`productos-search` NO tiene lupa en este build — y su único `ion-button` es una TRAMPA** | universal | La `.search-row` contiene exactamente 3 elementos interactivos: **`ion-button.back-button`** (`ion-icon[name=arrow-back-outline]`, **~26,95**) que **vuelve a `product-structures-list`**, el `input.search-input.inputsSearch` (**200,95**) y **`button.clear-search`** (`ion-icon[name=close-circle]`, **325,95**). ⚠ Tomar "el primer `ion-button` de la fila de búsqueda" como lupa **saca de la lista sin aviso** (costó 2 mediciones perdidas y explica retornos a estructuras que parecían espontáneos). **El disparador de búsqueda es `Enter`**, no un botón. **Contrasta con INVENTARIOS/PEDIDOS de esta misma corrida, donde sí hay lupa `search-circle-sharp` y es obligatoria** ⇒ los buscadores **no se unifican: medir por módulo** |
| 🔴 **`button.clear-search` limpia el texto pero NO re-dispara la búsqueda** | universal (candidato) | `val` y `comp.searchText` quedan en `""` y la lista **conserva el resultado anterior** (13 de 13). Variante nueva de `PRD-BUSCADOR-NO-REPUEBLA`: el camino Enter deja **0**, el camino X deja **el filtro viejo**. Ninguno restaura la estructura |
| 🔴🔴 **`globalConfig.variables` es un `Map` de 176 claves legible en runtime** | universal | `window.ng.getComponent(document.querySelector('product-detail')).globalConfig.variables` → `Map(176)`. **Cierra el hueco de `[el_palmar-20260805]`/`[difranca-20260807]`** ("las VGs de producto no están en `localStorage` ni en la tabla local"): sí lo están, en el servicio. Recorrer con `for (const [k,v] of V)`. ⚠ **Trae SOLO las claves del dump GLOBAL** — las 10 exclusivas del override de cliente (`listProductsBy`, `showProductByGrid`, `setQuUnit1`, …) **no aparecen**, lo que corrobora la regla del YAML "gana el global" |
| 🔴 **`productService.catalog*` expone las VGs de catálogo ya resueltas** | universal | `catalogShowStock`, `catalogQuUnitDecimals`, `catalogUnitByPriceList`, `catalogValidateWarehouses`, `catalogShowProductImages`, `catalogDisplayProductPoints`, **`catalogProductMinMul`**, **`catalogHideStock0`**, **`catalogHideProdWithoutPrice`** + los datasets `catalogListaList`, `catalogListaPricelist`, `catalogListaUnitInfo`, `catalogProdMinMulMap`. **Amplía `[difranca-20260807]`**, que decía que `hideProdWithoutPrice` y `productMinMul` "hay que buscarlas en otro lado": están acá |
| **El buscador de PRODUCTOS está ACOTADO a la estructura abierta** | universal | `LLAVE` = 81 en el catálogo, **13** en el subárbol CERRADURAS, y la UI muestra **13**. Al construir el oráculo de DM-PRD-006, filtrar el `SELECT` por `id_product_structure IN (idProductStructureList)`, **no** por el catálogo entero |
| **`idProductStructureList` predice el badge al ítem** | universal | Leerlo del componente y sumar `count(*) GROUP BY id_product_structure` sobre esos ids reproduce el badge exacto. Diagnóstico de 1 paso para separar "rollup" de "lista truncada". Reconfirma `[el_palmar-20260805]` |
| **Back de PRODUCTOS: acá el `<a>` padre SÍ existe** | cliente | `img[src*=flecha-blanca]` + `closest('a')` → **(34,51)**, `anchor=true`. `productos-header > a` sigue sin matchear (**7.ª playa**). Niveles: detalle→`product-list` es back real **y conserva el filtro**; `product-list`→**HOME directo**; estructuras→**HOME** |
| **Empty-state `<p class="search-empty-state ion-text-center">` fuera de `ion-list`** | universal | 5.ª build consecutiva. `pl.querySelectorAll('ion-item')` da **0** ⇒ buscar el texto en todo `product-list` |
| **`ion-select` de tipo y de lista de precio: `value` OBJETO** | universal | `sel.value = opt.value` + `new CustomEvent('ionChange',{bubbles:true,detail:{value:opt.value}})`, sin abrir popover. Reconfirmado (Marca↔Sub-Linea, 36↔107) |
| ⚠ **`scrollIntoView` obligatorio antes de clickear una estructura fuera del fold** | universal | `it.scrollIntoView({behavior:'instant',block:'center'})` + 400 ms; con 36 estructuras casi todas caen bajo el fold. Coords estables tras el scroll: **(180,406)** |
| **Coords estables (device 360×744)** | cliente | Tile HOME *Productos* **(180,428)** · *Vendedores* **(74,74…428)** · estructura centrada **(180,406)** · input búsqueda **(200,95)** · X limpiar **(325,95)** · volver-a-estructuras **(26,95)** · back header **(34,51)** |

> OK consolidado 2026-08-19 -> module-selectors/ + RUNTIME.md  [run_vzla-20260818]

---

## Hallazgos

**0 FAIL.** Ninguno de los puntos siguientes alcanza FAIL; los tres pasaron el gate §4.b (reproducen en vivo, hoy, en el build en prueba) y se reportan con su severidad real.

| # | Severidad | Hallazgo | Evidencia | Por qué no es FAIL |
|---|-----------|----------|-----------|--------------------|
| H-PRD-1 | 🟠 Media-baja | **`hideStock0=true` no oculta en PRODUCTOS** | `catalogHideStock0===true` y 131/348 + 37/109 productos con `Inventario: 0` listados; brecha badge↔lista = **0** | El módulo es de solo lectura y **no hay pérdida de datos**. El alcance efectivo de la VG parece ser el selector de PEDIDOS. **Medir por módulo antes de extrapolar** |
| H-PRD-2 | 🟡 Baja | **`quPageProduct=150` no gobierna el tamaño de página** | VG = `"150"` en runtime; paginación medida **50 en 50** (7 páginas para 348) | Solo afecta el nº de viajes de `ionInfinite`. El total y el corte por `.disabled` son correctos |
| H-PRD-3 | 🔴 Alta (**conocido**) | **`PRD-BUSCADOR-NO-REPUEBLA` + variante del botón X** | Vaciar+Enter ⇒ **0** con `searchText===""`; botón X ⇒ lista **congelada en 13** | Defecto **ya registrado** (RUNTIME §5) ⇒ no se re-marca FAIL. **La variante del botón X es nueva** y se aporta como ampliación |

**Descartado como defecto:** que el detalle ofrezca 1 sola lista de precio teniendo la nube 2 — es coherente con `userCanChangePriceList=false` y los precios de la 2.ª lista no bajan al device. **Descartado por dato:** el caso de diacríticos (0 de 1.649 productos con tildes).

---

## Resumen técnico

- **17 casos · 9 PASS · 0 FAIL · 8 N/A · 0 SKIP · 0 BLOCKED.** Wall-clock del módulo ~22 min, **0 cuelgues de CDP**, watchdog `moduleMs=40 min` con `page`.
- **Primera corrida de la serie que ejerce la paginación de PRODUCTOS de verdad**: 348 productos en 7 páginas, con `ion-infinite-scroll.disabled` como oráculo de agotamiento (nunca el `length`).
- **Cero brecha badge↔lista en 4 estructuras** (348/348, 109/109, 4/4, 286 abierta) y **Σ badges = 1.649 = catálogo**: el defecto `PRD-LISTA-CORTA-CATALOGO` **no reproduce** en run_vzla.
- **Pendiente #5 del YAML CERRADO**: el tipo de estructura se llama **`Marca` / `Sub-Linea`**; `listProductsBy="lineas"` no lo nombra y **ni siquiera llega al dispositivo**.
- **Pendiente #6 reconfirmado desde PRODUCTOS**: `productMinMul` rotula `Mínimo`/`Múltiplo` en lista y detalle, **por producto**.
- **Dos VGs que no rinden lo que declaran** (`hideStock0`, `quPageProduct`), ambas de impacto bajo y ambas medidas contra oráculo de BD.
- **Aporte de método reutilizable**: `globalConfig.variables` (Map de 176) y `productService.catalog*` vuelven innecesaria la arqueología en `localStorage`/tabla local para las VGs de producto.
- **Ningún registro creado.** `BD-N/A` en los 17 casos; nada anexado a `_bd-manifest.jsonl`.
- App devuelta a **HOME** sin alerts, loadings ni modales residuales.
