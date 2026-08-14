# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260805_133539_smoke-completo` |
| Módulo | PRODUCTOS (solo lectura) |
| Dispositivo | ADB 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Playa | Isla Coche (`denarioislacoche.ddns.net:8081`) |
| Cliente | el_palmar · Empresa **1002 CENTRAL EL PALMAR, S.A.** |
| Estado inicial / final | HOME / **HOME** ✅ |
| Resultado | **9 PASS · 1 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | `product-structures-list` con 3 estructuras Sector (`Alcohol 1`, `Azucar 8`, `PVA 30`) + 2 `ion-select` (sel[0]=empresa 2 opciones, sel[1]=tipo) |
| DM-PRD-002 | ✅ PASS | Tipo `Sector` (3 estructuras) ⇄ `Grupo de artículos` (10 estructuras). Ejecutable: **2 tipos**. Los 10 grupos coinciden 1:1 con las 10 estructuras nivel 2 de empresa 1002 en BD local |
| DM-PRD-004 | ✅ PASS | Click en `Azucar 8` → `product-list` con **8 ítems**, cada uno con Nombre + `Código:` + `Precio: … USD` + `Inventario:`. Contador = listado ✓ |
| DM-PRD-006 | ❌ **FAIL** | Buscar **`AZÚCAR`** (con tilde, tal como la app muestra el nombre) → **0 productos + "No hay productos disponibles"**. `AZUCAR` sin tilde → **8**. `KONFIT` → 2. Ver Hallazgo H1 |
| DM-PRD-007 | ✅ PASS | `ZZZZZZZ` → 0 ítems + `<p class="search-empty-state ion-text-center">No hay productos disponibles</p>` (patrón `<p>`, no `ion-item`) |
| DM-PRD-009 | ✅ PASS | `PVA` → 30 productos; `ion-infinite-scroll` dispara (`page` 0→2) y queda `disabled=true` al agotar el catálogo. **Sin spinner infinito** |
| DM-PRD-012 | ✅ PASS | Detalle de `160000019`: Nombre `AZÚCAR MONTALBAN REFINO PAPEL 20X1KG`, Código, Estructura `PT - Azúcar Refino`, Empaque `FARDO`, Unidad de venta (`FARDO`, select disabled — 1 sola unidad), Lista de precio, `Precio 29,0000 USD` |
| DM-PRD-013 | ✅ PASS | **4 listas de precio**. Cambio recalcula y cuadra contra BD y contra la tasa (tabla abajo) |
| DM-PRD-020 | ✅ PASS | Back desde detalle → `product-list` con los 8 productos del tipo activo (no salta a estructuras) |
| DM-PRD-021 | ✅ PASS | Back desde `product-structures-list` → `app-home` (`/home`) |

### DM-PRD-013 — oráculo BD + conversión multi-moneda

| Lista (`na_list` / `co_list`) | UI USD | BD `price_lists.nu_price` | UI VES | USD × 652,9726 |
|---|---|---|---|---|
| Autoservicio · Z01 (`idList` 1) | 29,0000 | 29 ✓ | — (ver H2) | — |
| Distrib. Aliados · Z02 (`idList` 2) | 27,0000 | 27 ✓ | 17.630,2602 | **17.630,2602** ✓ |
| Resto del país · Z04 (`idList` 4) | 28,2000 | 28.2 ✓ | 18.413,8273 | **18.413,8273** ✓ |

Conversión exacta al céntimo en ambos casos.

---

## Registros creados en sistema

Ninguno — módulo de solo lectura. `BD-N/A` para el oráculo §10 (escritura). La BD **sí** se usó como oráculo de lectura para el diagnóstico.

---

## Diagnóstico: por qué no se listan productos

### Respuesta corta

**El módulo PRODUCTOS lista los productos correctamente.** El dato está completo en el device. Lo que
falló en PEDIDOS **no es falta de dato**: es que PEDIDOS no resuelve la **jerarquía de estructuras**
que PRODUCTOS sí resuelve, sobre exactamente las mismas filas.

### (a) ¿El módulo PRODUCTOS lista algo? ¿Cuántos y cuáles?

Sí, y en todas las ramas probadas:

| Entrada | Ítems listados | Contador del badge |
|---|---|---|
| Sector → `Azucar` | **8** | 8 ✓ |
| Sector → `PVA` | **30** | 30 ✓ |
| Grupo de artículos | 10 estructuras, con sus conteos | ✓ |

Productos de `Azucar`: `160000010`, `160000012`, `160000014`, `160000016`, `160000017`, `160000019`,
`160000020`, `160000021` — con nombre, código, precio USD e inventario.

### (b) ¿Error o spinner colgado?

Ninguno. Sin errores, sin spinner infinito, sin vista vacía. El empty-state solo aparece cuando
corresponde (búsqueda sin coincidencias) y con el patrón `<p class="search-empty-state">`.

### (c) Contraste contador vs listado

**En PRODUCTOS el contador y el listado coinciden siempre** (`Azucar 8` → 8 ítems; `PVA 30` → 30 ítems).
No hay inconsistencia en este módulo.

La inconsistencia que vio PEDIDOS (`Azucar 8` → 0 ítems) tiene una causa estructural medible:

- El contador del badge es `product_structures.qu_products`, que en **nivel 1 (Sector) es un rollup del
  subárbol**. Verificado: `Azucar` (id 1) `qu_products=8` = 2 de `PT - Azúcar Blanco` (id 2) + 6 de
  `PT - Azúcar Refino` (id 3). `PVA` (id 6) `qu_products=30` = suma de sus 7 grupos hijos. `Alcohol` = 1.
- **Ninguna estructura de nivel 1 tiene productos asignados directamente.** `SELECT id_product_structure,
  count(*) FROM products GROUP BY 1` no devuelve ni una fila para los ids 1, 4, 6 (ni 14, 17, 21 de la
  otra empresa). Los 57 productos cuelgan **todos** de estructuras de nivel 2.
- **PRODUCTOS resuelve esto expandiendo el subárbol.** Al entrar en `Azucar`, el componente
  `product-list` recibe `idProductStructureList: Array(3)` — la estructura clickeada **más sus 2 hijas**.
  Por eso lista 8 y no 0.

⇒ Un contador correcto sobre un listado vacío **solo lo puede producir el código**, no la falta de dato:
el mismo `qu_products` que PEDIDOS usa para el badge es consistente con las filas que PRODUCTOS sí muestra.

### (d) BD LOCAL del device vs nube

`node automation/db/local-query.js` **no funciona en este device** (`run-as: exec failed for sqlite3: No
such file or directory`) — mismo caso que `[el_valle-20260728]`. Se leyó por **`window.sqlitePlugin` vía
CDP**, que sí opera. Nombres de tabla locales en plural (`products`, `price_lists`, `stocks`, `units`),
distintos de la nube.

| Tabla | Nube | **Device (local)** | Veredicto |
|---|---|---|---|
| `product` / `products` | 57 | **57** | ✅ bajó completo |
| `product_unit` / `product_units` | 61 | **61** | ✅ |
| `price_list` / `price_lists` | 644 | **644** | ✅ |
| `stock` / `stocks` | 323 | **323** | ✅ |
| `unit` / `units` | 16 | **16** | ✅ |
| `product_structure` / `product_structures` | 23 | **23** | ✅ |
| `unit_pricelist` | 0 | **0** | vacía en ambos — **pero irrelevante, ver abajo** |

Además, medido en local:

- **`price_lists`: 644 filas, `0` con `nu_price = 0`.** 643 en USD, 1 en VES. **Hay precios reales.**
- **`stocks`: 323 filas, 140 con `qu_stock > 0`** (106 de empresa 1002). **Hay inventario.**
- `product_min_muls`: 0 filas → `productMinMul=false` coherente.

**El device SÍ tiene los productos, sus precios y su inventario. La app no los muestra en PEDIDOS.**

### (e) El criterio real, leído del estado de Angular (sin tocar `../src/`)

`window.ng.getComponent(document.querySelector('product-list'))` en el módulo PRODUCTOS:

```
unitByPriceList: false      ← decisivo
showStock: true
productStock0: false
currencyModuleEnabled: true
defaultCurrency: "VES"      localCurrencyDefault: true
productList: Array(8)       idProductStructureList: Array(3)
endPro: 20                  page: 0
```

🔴 **`unitByPriceList: false` desmonta la hipótesis de `unit_pricelist`.** Esa tabla solo se consulta
cuando la unidad de venta se resuelve *por lista de precios*. Con la VG en `false`, la app **no la
necesita** — y la prueba empírica es que PRODUCTOS lista, cotiza y convierte los 57 productos con
`unit_pricelist` **vacía**. La nota del reporte de pedidos (`unit_pricelist=0 ⇒ "No hay productos
disponibles"`, marcada allí como hipótesis a confirmar) **queda refutada**.

**Lo que sí filtra en PEDIDOS — `order_type_product_structure` (10 filas, leída del device):**

| `co_order_type` | `id_order_type` | `id_product_structure` | Estructura | Nivel | Empresa |
|---|---|---|---|---|---|
| CFR | 1 | **1** | Azucar (`10`) | 1 | 1002 |
| CFR | 1 | **6** | PVA (`30`) | 1 | 1002 |
| FOB | 3 | 1 | Azucar (`10`) | 1 | 1002 |
| FOB | 3 | 4 | Alcohol (`20`) | 1 | 1002 |
| … | | | (idem para 1003) | 1 | 1003 |

**Las 10 filas apuntan exclusivamente a estructuras de nivel 1** (`co_product_structure` = `10`, `20`,
`30`). Y el tipo de pedido por defecto de la empresa 1002 es **CFR** (`default_value=1`) → habilita
`Azucar` y `PVA`: **exactamente las dos categorías que el agente de pedidos vio con contador.** El
encaje es exacto, no coincidencia.

De ahí las dos ramas del síntoma:
- **Agrupación Sector:** las estructuras habilitadas son de nivel 1, que no tienen productos directos.
  Sin expandir el subárbol → 0.
- **Agrupación Grupo de artículos:** las estructuras son de nivel 2, que **no tienen ninguna fila** en
  `order_type_product_structure` → la intersección con el tipo de pedido es vacía → 0.

Ambas ramas dan 0 con el dato presente. *(Esta última cadena es inferencia sobre el código de PEDIDOS,
no medición dentro de ese módulo — ver "Confirmación pendiente".)*

### (f) 🔴 VEREDICTO

> ## **(3) El dato está en el device y la app no lo muestra ⇒ DEFECTO CLARO.**

Sostenido por estos números:

1. El device tiene **57 productos, 644 precios (ninguno en 0), 323 filas de stock (140 con existencia)** —
   idénticos a la nube. No falta dato de producto.
2. **PRODUCTOS lista 8 desde `Azucar` y 30 desde `PVA`** — las **mismas dos estructuras** que PEDIDOS
   mostró vacías, en el **mismo device, misma empresa, misma sesión**.
3. PRODUCTOS lo consigue expandiendo el subárbol (`idProductStructureList: Array(3)`); las estructuras de
   nivel 1 tienen **0 productos directos** y su contador es un rollup.
4. `unit_pricelist=0` **no es la causa**: `unitByPriceList=false`, y PRODUCTOS opera perfecto con esa
   tabla vacía.

**No es la opción (1)** (dato faltante + app correcta): el dato no falta y la app no es correcta.
**No es la opción (2)**: no es una discusión sobre `hideProdWithoutPrice`, porque **los productos SÍ
tienen precio** (644 filas, cero en 0) — la VG ni siquiera llega a aplicar.

⇒ **El N/A de PEDIDOS debe reclasificarse.** Los 10 casos N/A de ese módulo estaban justificados por
"dato ausente en origen", premisa que esta evidencia invalida.

### (g) Qué hace falta para que PEDIDOS / DEVOLUCIONES / INVENTARIOS sean ejecutables

🔴 **NO hace falta cargar `unit_pricelist`.** Pedirlo al equipo de datos sería trabajo perdido: con
`unitByPriceList=false` la app no la lee, y PRODUCTOS funciona con ella vacía.

**Vía A — corrección de código (la correcta, para desarrollo).**
Que el listado de productos de PEDIDOS resuelva la jerarquía igual que PRODUCTOS: expandir la estructura
seleccionada a **ella + sus descendientes** antes de filtrar (el equivalente al `idProductStructureList`
de `product-list`). Es un defecto de producto: cualquier cliente con estructuras de 2 niveles y productos
asignados solo al nivel hoja lo reproduce.

**Vía B — workaround por datos (desbloquea la corrida sin tocar la app).**
Agregar en `order_type_product_structure` las estructuras de **nivel 2** además de las de nivel 1, para
cada tipo de pedido. Para la empresa 1002 son los `id_product_structure` **2, 3, 5, 7, 8, 9, 10, 11, 12,
13**; para la 1003, **15, 16, 18, 19, 20, 22, 23**. Hoy esa tabla solo tiene los 10 mapeos de nivel 1.

**Recomendación operativa para la QA:** con la Vía B aplicada, **re-correr PEDIDOS** (los 10 N/A pasan a
ejecutables). **DEVOLUCIONES e INVENTARIOS no se probaron en este módulo** y no comparten necesariamente
este filtro (devoluciones parte de facturas, inventarios de `client_stocks`); si su bloqueo fue "no hay
productos", conviene re-verificarlos **después** de la Vía B, pero no hay evidencia aquí de que sea la
misma causa.

### Confirmación pendiente (1 medición, barata)

Para cerrar la cadena al 100%: abrir PEDIDOS, llegar al Tab Pedido con cliente y tipo elegidos, y leer
`idProductStructureList` del `product-list` de ese módulo. Si trae `Array(1)` (solo la estructura
clickeada) en vez de `Array(3)`, queda demostrado en el propio módulo. No se hizo aquí por no crear
estado transaccional desde un módulo de solo lectura.

---

## Hallazgos

### H1 — ❌ FAIL · La búsqueda no encuentra productos si el término se escribe **con tilde** (DM-PRD-006)

**Qué pasa:** todos los productos se llaman `AZÚCAR …` (con tilde, así en BD y así en pantalla). Escribir
`AZÚCAR` en la búsqueda devuelve **"No hay productos disponibles"**. Escribir `AZUCAR` devuelve los 8.

**Descartado que sea el teclado de automatización:**

| Término tecleado | `input.value` | Codepoints | `comp.searchText` | Resultados |
|---|---|---|---|---|
| `AZÚCAR` | `AZÚCAR` | `65,90,**218**,67,65,82` | `AZÚCAR` | **0** |
| `ZÚCAR` | `ZÚCAR` | `90,**218**,67,65,82` | `ZÚCAR` | **0** |
| `KONFIT` | `KONFIT` | `75,79,78,70,73,84` | `KONFIT` | 2 ✓ |
| `AZUCAR` | `AZUCAR` | `65,90,**85**,67,65,82` | `AZUCAR` | 8 ✓ |

Codepoint 218 = `Ú` — el término llegó íntegro al input **y al componente**. El dato contiene la tilde,
el término contiene la tilde, y el match falla. La búsqueda normaliza (quita diacríticos) **el nombre del
producto** pero **no el término tecleado**, así que un acento en la consulta nunca puede casar.

**Impacto real:** el usuario que escribe lo que ve en pantalla obtiene un catálogo vacío. Con un catálogo
donde ~el 70% de los nombres empieza por `AZÚCAR`, es el término de búsqueda más natural del cliente.

**Reproducción manual:** Productos → Sector → `Azucar` → escribir `AZÚCAR` en la búsqueda → Enter.

### H2 — ⚠ `Precio: 0,0000` (moneda local) en `product-list`, aunque el detalle sí convierte

En la lista, cada ítem muestra dos líneas de precio: `Precio: 0,0000` (VES) y `Precio: 68,5000 USD`. La
línea VES sale **siempre en 0,0000**, pese a `currencyModuleEnabled=true`, `defaultCurrency="VES"`,
`showConversionInfo=true` y tasa 652,9726 disponible. El **detalle del mismo producto sí convierte
correctamente** (27,0000 USD → 17.630,2602 VES). Divergencia lista ↔ detalle. No tumba ningún caso del
smoke (DM-PRD-004 pide "código y precio", y el precio USD está), pero muestra un precio cero al usuario.

### H3 — ⚠ `Inventario: 0,0000` en el render inicial de la lista; el valor real aparece tras buscar

Al entrar por estructura, los 8 ítems muestran `Inventario: 0,0000`. Tras ejecutar una búsqueda válida
(`AZUCAR`) el mismo ítem muestra `Inventario: 2.432.400,0000` — que es el `qu_stock` real del almacén
1401 en BD local. El dato existe desde el principio; el primer render no lo resuelve. Mismo patrón de
"render inicial incompleto" que H2.

### H4 — ⚠ Limpiar la búsqueda deja la lista vacía (2ª playa — confirma `[latino_cosmetica-20260729]`)

Vaciar el campo de búsqueda + Enter deja `product-list` en **0 ítems con empty-state**, en vez de
restaurar los 8 productos de la estructura. Reproduce el defecto observado en latino_cosmetica. Con esta
2ª playa independiente **deja de ser "# candidato"**. Workaround de automatización: re-buscar un término
amplio o re-entrar a la estructura.

---

## Verificación de VGs

| VG | Valor esperado (perfil) | Observado | Veredicto |
|---|---|---|---|
| `hideProdWithoutPrice` | `false` | **No aplica en la práctica** — los 57 productos tienen precio (`price_lists` 644 filas, **0 en cero**). La VG nunca llega a filtrar nada | ⚠ **la premisa "productos sin precio" es falsa en este cliente** |
| `showStock` | `true` | ✅ `product-list.showStock = true`; la lista renderiza línea `Inventario:` | **✔ coincide** |
| `stock0` | `true` (⚠VERIFICAR) | 🔴 **`product-list.productStock0 = false`** | ⚠ **DIVERGENCIA** — el componente lee `false`. En PRODUCTOS no filtra (lista productos con `qu_stock=0`, ej. `160000019`), pero si PEDIDOS lo aplica, exigiría inventario para pedir. **Confirmar cuál es el valor configurado en `global_configuration` de la nube** |
| `productMinMul` | `false` (⚠VERIFICAR) | ✅ `product_min_muls` = **0 filas** en BD local | **✔ coincide** |
| `multiCurrency` | `true`, tasa 652,9726 (VES + USD) | ✅ `currencyModuleEnabled=true`, `defaultCurrency="VES"`, tasa **652,9726** rotulada en detalle; conversión exacta (ver DM-PRD-013) | **✔ coincide** — con la salvedad de H2 (la lista no convierte) |
| `unitByPriceList` | no estaba en el perfil | **`false`** — descubierta. Explica que `unit_pricelist=0` sea inocua | **➕ agregar al perfil del cliente** |
| `userCanChangePriceList` | no estaba en el perfil | **`true` de facto** — 4 listas seleccionables y el precio recalcula | **➕ agregar al perfil** |
| `quPageProduct` | no estaba en el perfil | **20** (`endPro: 20`), no 50 como en El Yaque/La Tortuga | **➕ agregar al perfil** |

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| 🔴 **El contador del badge de estructura es un ROLLUP del subárbol — contrastarlo SIEMPRE contra el listado antes de concluir "faltan datos"** | **universal** | `product_structures.qu_products` en estructuras de **nivel 1** agrega los productos de sus **hijas**, que es donde realmente están asignados (`products.id_product_structure` no apunta a ninguna estructura de nivel 1). PRODUCTOS lo resuelve expandiendo a `idProductStructureList: Array(n)` = estructura + descendientes. **Un módulo que filtre por la estructura sola da 0 ítems con el badge en 8/30.** Receta de diagnóstico: `SELECT id_product_structure, count(*) FROM products GROUP BY 1` y comparar contra `SELECT id_product_structure, qu_products FROM product_structures` — si los ids del badge no aparecen en el primero, el vacío es de código, no de dato. `[el_palmar-20260805]` |
| 🔴 **`unit_pricelist` vacía NO implica "sin productos" — leer `unitByPriceList` primero** | **universal** (corrige la nota de `pedidos.md` de esta misma corrida) | La tabla solo se consulta si la unidad de venta se resuelve por lista de precios. Con `product-list.unitByPriceList=false` la app no la toca: en el_palmar PRODUCTOS lista, cotiza y convierte los 57 productos con `unit_pricelist=0` en device **y** nube. **Antes de pedir la carga de esa tabla al equipo de datos, leer la bandera del componente.** `[el_palmar-20260805]` |
| **`order_type_product_structure` es el filtro de catálogo de PEDIDOS** | **universal** (descubierta acá) | Mapea `id_order_type` → `id_product_structure` habilitadas, por empresa. El tipo por defecto sale de `order_types.default_value=1`. Si sus filas apuntan solo a estructuras de nivel 1, el Tab Pedido muestra categorías con contador y ningún producto. Tabla a inspeccionar siempre que PEDIDOS liste 0 productos. `[el_palmar-20260805]` |
| **`local-query.js` inoperante también en Isla Coche v1.0/db19 → usar `window.sqlitePlugin`** | universal (2ª confirmación de `[el_valle-20260728]`) | `run-as: exec failed for sqlite3: No such file or directory`. **No gastar reintentos.** Por CDP sí se lee todo. ⚠ **Los nombres de tabla locales van en PLURAL y difieren de la nube:** `products`/`product_units`/`price_lists`/`stocks`/`units`/`product_structures` (nube: singular). `unit_pricelist` es la excepción (igual en ambas). `[el_palmar-20260805]` |
| **Búsqueda de productos: no normaliza diacríticos del término** | cliente (candidato universal) | Ver H1. Al automatizar DM-PRD-006 **usar el término SIN tilde**, o el caso se lee como "no filtra". Verificar siempre `input.value` + codepoints + `comp.searchText` antes de imputar el fallo al teclado de Playwright. `[el_palmar-20260805]` |
| **Back de PRODUCTOS: `img[src*=flecha]` + `closest('a')`, coords ~(34,51)** | universal (3ª playa) | `productos-header > a` **no matchea** tampoco acá. Filtrar `width>0 && top<80`. Confirmado: detalle→`product-list` es un nivel real de back; `product-list`→**HOME directo** (no pasa por estructuras); estructuras→HOME. `[el_palmar-20260805]` |
| **`ion-select` de tipo de estructura y de lista de precio: `value` es OBJETO** | universal (reconfirma) | Asignar `sel.value = opt.value` (objeto completo) + `new CustomEvent('ionChange',{bubbles:true,detail:{value:opt.value}})`. **No hace falta abrir el popover.** Funciona igual para el selector de agrupación (`{idTypeProductStructure, naTypeProductStructure, …}`) y el de lista (`{idList, coList, naList, …}`). `[el_palmar-20260805]` |
| **Empty-state de búsqueda = `<p class="search-empty-state ion-text-center">`** | universal (2ª build) | Igual que La Tortuga v6.6.18, **fuera** de `ion-list`. Buscar el texto en todo `product-list`, no como `ion-item`. `[el_palmar-20260805]` |
| ✅ **Limpiar la búsqueda NO restaura la lista — GRADUADO de "# candidato" a confirmado** | universal | 2ª playa independiente (latino_cosmetica + el_palmar), builds y servidores distintos. Ver H4. `[latino_cosmetica-20260729][el_palmar-20260805]` |
| **Las VGs de PRODUCTO tampoco están en `localStorage.globalConfiguration`** | universal (amplía la nota de `enterpriseEnabled`) | Las 180 claves no matchean `/prod|price|stock|hide|unit|min|mul|curren|rate|page/i` — **0 coincidencias**. Leerlas del componente Angular (`window.ng.getComponent(document.querySelector('product-list'))` expone `showStock`, `productStock0`, `unitByPriceList`, `currencyModuleEnabled`, `defaultCurrency`, `endPro`) o de la tabla de BD. `[el_palmar-20260805]` |
| ⚠ **`global_configuration` de la BD LOCAL es ilegible por columnas** | cliente (candidato) | `pragma_table_info` da `id_config,clave,valor,descripcion` pero las ~318 filas devuelven **los 4 campos NULL**. No sirve como oráculo de VGs en este build; usar el componente Angular. `[el_palmar-20260805]` |

---


> ✅ consolidado 2026-08-05
## Notas por cliente (para `automation/cdp/module-selectors/productos.md`)

**el_palmar (Isla Coche, v1.0/db19, catálogo azucarero):** **2 tipos de estructura** — `Sector` (P01,
nivel 1) / `Grupo de artículos` (P02, nivel 2) → **DM-PRD-002 ejecutable y PASS**. sel[0]=empresa
(2 opciones, `enterpriseEnabled=true`), sel[1]=tipo. Sector → 3 estructuras (`Alcohol 1`, `Azucar 8`,
`PVA 30`); Grupo de artículos → 10. **Jerarquía real de 2 niveles con productos solo en las hojas** —
primer cliente del piloto con esta forma, y es la que destapa el defecto de PEDIDOS.
`userCanChangePriceList=true` → **4 listas** (Autoservicio Z01 / Distrib. Aliados Z02 /
Ccs.Car.Ara.Mda.Varg Z03 / Resto del país Z04) → **DM-PRD-013 PASS** con recálculo verificado contra BD.
`quPageProduct=20`. Detalle muestra **USD + VES + tasa** (a diferencia de gmp/don-theo/piercar, que solo
muestran una moneda); `product-list` muestra VES+USD pero **la línea VES siempre en 0,0000** (H2).
texto_busqueda: **usar `AZUCAR` sin tilde** (H1).
