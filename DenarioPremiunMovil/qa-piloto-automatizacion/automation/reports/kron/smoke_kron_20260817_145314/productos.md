# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_145314_smoke-completo` |
| Módulo | PRODUCTOS |
| Cliente | kron — CHOCOLATES KRON, C.A (`KRON_ADM`, id_enterprise 1) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db19 · `window.ng=true` |
| Playa | ISLA COCHE (`denarioislacoche.ddns.net:8081`) |
| Vendedora | scarlet · id_user 309 · co_user `VE0002` |
| Resultado | **8 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED** |
| Registros creados | **ninguno** (módulo de solo lectura) |
| Verificación BD | N/A por diseño (solo lectura). Se usó BD **solo como oráculo de conteo**. |

## Ruta ejecutada

```
HOME → tile "Productos" → /productos
  └ product-structures-list (2 ion-select: empresa | tipo=Modelo · 9 estructuras)
      └ click GRAGEADOS → product-list (28 ítems)
          ├ ion-infinite-scroll (scrollDisable false→true, no pagina)
          ├ buscar "BALLS" → 10 · "ZZZZZZZ" → 0 + empty-state · vaciar → 0 (defecto)
          └ click 51104106 → product-detail (ProductDetailComponent, ~2,5 s)
              └ back → product-list (filtro BALLS intacto, 10)
                  └ back → HOME (directo)
HOME → Productos → estructuras → back → HOME
```

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | `/productos` → `product-structures-list` con 9 estructuras (ARTESANAL 2, BARQUILLAS 4, GOLOSINAS 10, GOTAS 44, GRAGEADOS 32, GRANULADOS 3, TABLETAS 11, TOPPING 9, UNTABLES 32) + 2 `ion-select` (sel[0]=empresa, sel[1]=tipo). 0 loadings residuales |
| DM-PRD-002 | 🚫 N/A | **Estructural: 1 solo tipo de estructura.** `sel[1]` trae una única opción `Modelo` (`idTypeProductStructure:1`, `coTypeProductStructure:'001'`). No hay segundo tipo al cual cambiar |
| DM-PRD-004 | ✅ PASS | GRAGEADOS → `product-list` con **28 ítems**, cada uno con Nombre + `Código:` + `Precio: … BS` + `Precio: … USD` + `Inventario:` (ej. `BALLS BLANCO 10X1KG / 51104106 / 78.186,50 BS / 101,40 USD / Inv 2`) |
| DM-PRD-006 | ✅ PASS | `"BALLS"` + Enter → **10 ítems**, `comp.searchText='BALLS'`, todos con "BALLS" en el nombre. Sin tildes en el término ⇒ no aplica el caveat de diacríticos |
| DM-PRD-007 | ✅ PASS | `"ZZZZZZZ"` + Enter → **0 ítems** y `<p class="search-empty-state">` "No hay productos disponibles" **fuera de `ion-list`** (4.ª build con esta forma) |
| DM-PRD-009 | ✅ PASS | Baseline 28 → `ionInfinite` + `ng.applyChanges` → sigue 28 y **`ion-infinite-scroll.disabled` pasa `false`→`true`** (catálogo de la estructura agotado; 28 < `quPageProduct=50` ⇒ una sola página). Sin spinner infinito |
| DM-PRD-012 | ✅ PASS | Click `51104106` → **`product-detail`** (`ProductDetailComponent`) montado a ~2,5 s. Campos: Nombre `BALLS BLANCO 10X1KG` · Código `51104106` · Estructura Producto **`GRAGEADOS`** · Unidad de venta `BULTO` · Lista de precio `PRECIO 1` · Precio `78.186,50 BS`. `product-list` + `productos-search` **desmontados**, URL sigue en `/productos` |
| DM-PRD-013 | 🚫 N/A | **Estructural: 1 sola lista de precio.** Detalle **sí inspeccionado**: el `ion-select` "Lista de precio" trae una única opción `{idList:1, coList:'P1', naList:'PRECIO 1'}` y llega **`disabled=true`** (UI correcta ante opción única, no bug de render). Corroborado en nube: `SELECT … FROM list WHERE co_operation<>'D'` → **1 fila** (P1 / PRECIO 1 / KRON_ADM). Además `pricelistByOrderType=false` ⇒ tampoco cambia por tipo de pedido |
| DM-PRD-020 | ✅ PASS | Back desde detalle (`img[src*=flecha-blanca]` → `closest('a')`, coords **34,51**) → vuelve a `product-list` con **el filtro "BALLS" intacto (10 ítems)**, no a estructuras |
| DM-PRD-021 | ✅ PASS | Back desde `product-structures-list` → `app-home` con los 12 tiles (`/home`). Coords ≈(32,47) |

## Registros creados en sistema

*Ninguno — módulo de solo lectura.*

## Veredictos pedidos

### 1. `listProductsBy="lineas"` — ¿la estructura por defecto es Línea?

🔴 **NO. El único tipo de estructura de kron se llama `Modelo`, no "Línea".**

El `ion-select` de tipo trae **una sola opción**: `{idTypeProductStructure: 1, coTypeProductStructure: "001", naTypeProductStructure: "Modelo"}`.

⇒ La VG `listProductsBy="lineas"` **no nombra la estructura**: designa el *modo* de agrupar (por estructura de producto), y el **rótulo del tipo lo pone el catálogo del cliente**. Leer `listProductsBy` como "el tipo por defecto es Línea" es una inferencia inválida — en kron el mismo valor `"lineas"` produce un tipo rotulado **Modelo**, con `co='001'`. Esto **cierra el `⚠️VERIFICAR` del perfil** y **acota** la nota de `[grupo_fiel-20260817]` ("`listProductsBy="lineas"` confirmado como default por UI"), donde la coincidencia de nombre fue casualidad del dato.

### 2. Comportamiento del buscador al vaciarlo — **medido**

🔴 **`PRD-BUSCADOR-NO-REPUEBLA` REPRODUCE en kron. 5.ª playa, 4.º servidor.**

Secuencia medida en la misma sesión, misma estructura (GRAGEADOS, baseline 28):

| Paso | `ion-item` en DOM | `comp.productList` | `comp.searchText` | empty-state |
|---|---|---|---|---|
| baseline (entrar a la estructura) | 28 | 28 | `""` | no |
| `"BALLS"` + Enter | 10 | 10 | `BALLS` | no |
| `"ZZZZZZZ"` + Enter | 0 | 0 | `ZZZZZZZ` | sí |
| **vaciar (Backspace×N) + Enter** | **0** | **0** | `""` | **sí** |

Con el `input.value === ""` y `comp.searchText === ""` —o sea, **el mismo estado que el baseline**— la lista queda en **0 con empty-state** en vez de volver a los 28. Persistió tras 2,5 s (no es settle).

**Recuperación verificada:** re-entrar al módulo desde HOME restaura las 9 estructuras y el input vuelve a `""` limpio ⇒ el workaround documentado sigue siendo el correcto. **Nunca usar "campo vacío" como estado sin-filtro en PRODUCTOS.**

### 3. ¿Cuántos productos tiene el catálogo?

**147 productos** (nube: `count(DISTINCT co_product) FROM product WHERE co_operation<>'D' AND co_enterprise='KRON_ADM'`).

**La suma de los 9 badges de estructura da exactamente 147** ⇒ en kron los badges **no** son rollup (jerarquía plana de un solo nivel), a diferencia de `[el_palmar-20260805]`.

De esos 147, **131 tienen precio > 0**; los **16 restantes no se listan en pantalla** (ver hallazgo H1 abajo).

## Hallazgos

*Sin FAIL.* Una observación de configuración con valor de diagnóstico:

### H1 — `hideProdWithoutPrice=true` explica la brecha badge↔lista (NO es lista truncada) · informativo

El badge de GRAGEADOS dice **32** pero `product-list` muestra **28**. La lectura ingenua es `PRD-LISTA-CORTA-CATALOGO` (lista truncada) → **falso FAIL**. El cotejo contra la nube lo descarta:

| Estructura | badge UI | productos BD | con precio>0 BD |
|---|---|---|---|
| ARTESANAL | 2 | 2 | 2 |
| BARQUILLAS | 4 | 4 | 4 |
| GOLOSINAS | 10 | 10 | **4** |
| GOTAS | 44 | 44 | **39** |
| **GRAGEADOS** | **32** | **32** | **28** ← = los 28 listados |
| GRANULADOS | 3 | 3 | 3 |
| TABLETAS | 11 | 11 | 11 |
| TOPPING | 9 | 9 | 9 |
| UNTABLES | 32 | 32 | **31** |
| **Total** | **147** | **147** | **131** |

⇒ **`con_precio` de la estructura predice exactamente el nº de ítems renderizados.** La VG `hideProdWithoutPrice=true` está **efectiva y funcionando**: el badge cuenta el total de la estructura, la lista muestra solo los cotizables. **Comportamiento correcto — no es defecto.**

⚠ *Consecuencia funcional a decidir por el cliente:* **16 productos (10,9 % del catálogo) son invisibles en el módulo PRODUCTOS**, concentrados en GOLOSINAS (6 de 10 ocultos = 60 % de la estructura). El badge sigue prometiendo 10. No es un bug de la app, pero sí un dato de configuración que conviene que kron confirme como deseado.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **`listProductsBy` NO nombra el tipo de estructura — es el MODO de agrupar** | universal (acota `[grupo_fiel-20260817]`) | En kron `listProductsBy="lineas"` convive con un tipo único rotulado **`Modelo`** (`idTypeProductStructure:1`, `co:'001'`). **Nunca derivar el rótulo del tipo desde la VG**: leerlo del `ion-select` en runtime. En grupo_fiel el nombre coincidió por casualidad del dato. `[kron-20260817]` |
| 🔴🔴 **Receta anti-falso-FAIL: `badge − listados = productos sin precio` cuando `hideProdWithoutPrice=true`** | universal | Antes de imputar `PRD-LISTA-CORTA-CATALOGO`, correr el `count(*) FILTER (WHERE EXISTS … price_list … nu_price>0)` por estructura. En kron predijo **9 de 9** estructuras y explicó la brecha 32→28 exacta. **El badge cuenta el total de la estructura; la lista, solo los cotizables.** `[kron-20260817]` |
| 🔴 **`PRD-BUSCADOR-NO-REPUEBLA` — 5.ª playa, 4.º servidor (Isla Coche)** | universal DE PRODUCTOS | Vaciar + Enter deja `product-list` en 0 con `p.search-empty-state`, con `input.value===""` **y** `comp.searchText===""` (idénticos al baseline de 28). Recuperación: re-entrar al módulo desde HOME. Servidores acumulados: La Tortuga · El Yaque · Isla Coche. `[latino_cosmetica-20260729][el_palmar-20260805][difranca-20260807][grupo_fiel-20260817][kron-20260817]` |
| **`ion-infinite-scroll.disabled` es el oráculo de "catálogo agotado", no el `length`** | universal (reconfirma RUNTIME §3) | En kron pasó `false`→`true` tras un solo `ionInfinite` + `ng.applyChanges`, con el count estable en 28. Cortar por el flag evita el falso "el scroll no cargó nada". `[kron-20260817]` |
| **`product-detail` a ~2,5 s + `product-list` DESMONTADO + URL invariante** | universal | Reconfirmado en 2.ª playa. Oráculo válido = **diff de custom elements visibles**: antes `[app-productos, productos-header, productos-search, product-list]` → después `[app-productos, productos-header, **product-detail**, swiper-container, swiper-slide]`. `swiper-*` presentes por `showProductImages=true`. `[grupo_fiel-20260817][kron-20260817]` |
| **Detalle muestra solo BS; `product-list` muestra BS+USD** | cliente (Isla Coche / `defaultCurrency='BS'`) | **Patrón INVERSO** al de El Yaque/La Tortuga (gmp/don-theo/piercar/ferrenuestro/jerez/dm-electronica/grupo_fiel, donde el detalle muestra solo USD). Acá `comp.defaultCurrency='BS'` y el detalle rotula `78.186,50 BS`, mientras la lista trae ambas. ⇒ **la moneda del detalle sigue a `defaultCurrency`, no al servidor**; al reportar un precio, decir siempre moneda y lista. `[kron-20260817]` |
| **`ion-select` de lista de precio `disabled=true` con opción única** | universal (reconfirma) | 3.ª evidencia (ferrenuestro-20260723 lista única, grupo_fiel unidad única, kron **ambas**: Unidad `BULTO` y Lista `PRECIO 1` llegan las dos `disabled=true`). Comportamiento correcto de la UI ⇒ **N/A estructural, no BLOCKED**. Corroborar en nube con `SELECT … FROM list`. `[kron-20260817]` |
| **Back de PRODUCTOS: `img[src*=flecha-blanca]` + `closest('a')`, coords (34,51)** | universal | **6.ª playa.** `productos-header > a` **tampoco** matchea acá. A diferencia de VENDEDORES, el `<a>` padre **sí** existe. Niveles: detalle→`product-list` back real (con el filtro de búsqueda **intacto**); `product-list`→**HOME directo**; estructuras→HOME. `[kron-20260817]` |
| **Empty-state = `<p class="search-empty-state">` fuera de `ion-list`** | universal | 4.ª build con esta forma (La Tortuga v6.6.18, el_palmar, difranca, kron). `[kron-20260817]` |
| **VGs de producto legibles en `product-list`** | universal (reconfirma) | `ng.getComponent(document.querySelector('product-list'))` → `showStock:true`, `productStock0:false`, `unitByPriceList:false`, `currencyModuleEnabled:true`, `defaultCurrency:'BS'`, `endPro:20`, `productList`, `idProductStructureList`, `searchText`. ⚠ `endPro` se mantuvo en **20** con 28 ítems renderizados ⇒ **no** es el puntero de render: **no usarlo como oráculo de paginación** (usar `productList.length` + `scrollDisable`). `[kron-20260817]` |

> ✅ consolidado 2026-08-17
