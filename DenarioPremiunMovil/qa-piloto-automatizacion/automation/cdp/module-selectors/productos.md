> Parte de `module-selectors/` — leer junto con `_comunes.md` (convención global).

## Módulo PRODUCTOS

### Identidad
- Ruta: `/productos` · Sub-vistas: `product-structures-list` (estructuras) → `product-list` (productos) → detalle
- Solo lectura — sin registros creados
- Selector tipo estructura: `ion-select` (valores: LINEA = idTypeProductStructure 2)

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Selector tipo | `ion-select` en estructuras — es el **2º** ion-select visible (sel[0]=empresa, sel[1]=tipo) | `[gmp-2606][ins-2606][rom-2606][ins-2610]` | cambio de tipo: tomar `value` (objeto) del `ion-select-option` por texto y asignarlo a `.value` + `ionChange`. `selectIonPopover` por texto NO aplica (valor es objeto) `[ins-2610]` |
| Estructuras (lista) | `product-structures-list ion-item.listaItems` (título en `h3.font-ListProduct` + `ion-badge` conteo) | `[ins-2610][gmp-2611]` | ⚠ `.product-structure-title` **NO existe** — el título real es `h3.font-ListProduct`. Cada ítem "NOMBRE {conteo}" (ej. "ALIMENTOS 158"); click → `product-list` con `mouse.click` en coords reales. 34 estructuras en globalmp |
| Productos (lista) | `product-list ion-item` (clase `item md item-lines-default`, **NO** `.listaItems`) | `[gmp-2611]` | cada item: Nombre + "Código: XXX" + "Precio: N BS" + "Precio: N USD" + "Inventario: N". El placeholder "No hay productos disponibles" coexiste como 1er ion-item → filtrar `!/No hay/i` |
| Campo búsqueda | `input.search-input.inputsSearch` (placeholder "Búsqueda de productos", NO ion-input) — **fuera de `product-list`** (`closest('product-list')` = null), localizar por clase global | `[gmp-2606][gmp-2611]` | limpiar con `click({clickCount:3})` + **Backspace×N** (⚠ `Control+A` NO surte efecto) + `keyboard.type` + `press('Enter')`; sin Enter no re-filtra |
| Estructura → productos | click en ítem estructura → `product-list` | `[gmp-2606]` | |
| ⚠ Placeholder residual | "No hay productos disponibles" permanece como 1er `ion-item` en `product-list` aun con productos | `[ins-2610]` | al iterar, filtrar `!/No hay/i.test(text)` para no clickearlo |
| ⚠ Empty-state en búsqueda sin resultados — **2 formas por build** | en La Tortuga v6.6.18 "No hay productos disponibles" aparece como `<p class="search-empty-state ion-text-center">` **FUERA** de `ion-list` (con `ion-list` completamente vacío), NO como 1er `ion-item` | `[latino_cosmetica-20260714]` | # candidato universal — al verificar búsqueda vacía (DM-PRD-007) **buscar el texto en todo `product-list`**, NO asumir que es un `ion-item`. Tolerar ambos patrones (gmp/ins = ion-item; La Tortuga = `<p>`) |
| Detalle producto | nombre, código, precio, unidad, estructura, almacén, inventario | `[gmp-2606][gmp-2611]` | campos núcleo: Nombre/Código/Estructura/Unidad de venta/Lista de precio/Precio/Almacén/Inventario |
| Lista de precios | `product-detail ion-select` "Lista de precio"; cambio = asignar `.value = opt.value` (**objeto** `{idList,coList,naList,...}`) + `ionChange` | `[gmp-2606][gmp-2611]` | `selectIonPopover` por texto NO aplica (value es objeto); el precio visible se recalcula. ⚠ ver defecto romher |
| Botón atrás | `productos-header > a` (`<img>` SIN clase `.fechaAtras`, top<80) → `pg.mouse.click(coords)`; **fallback ferrenuestro:** localizar la `img[src*="flecha-blanca"]` → `closest('a')` (coords ~34,51) | `[gmp-2606][gmp-2611][ins-2622][ferrenuestro-2026-07-07]` | `h.clickBack` NO sirve aquí. ⚠ **Back desde `product-list` o `product-structures-list` sale DIRECTO a HOME** (no pasa por estructuras como nivel intermedio); detalle→product-list SÍ es un nivel de back. Reconfirmado en insumar `[ins-2622]` y dm-electronica `[dm-electronica-20260713]`. ⚠ **ferrenuestro:** `productos-header > a` NO matcheó (el `<a>` no es hijo directo del header) → localizar por la img `flecha-blanca.png` es robusto. # candidato — confirmar en otras playas `[ferrenuestro-2026-07-07]` |
| Scroll infinito | `ion-infinite-scroll` (disabled si todo cabe en 1ª página); disparar `ionInfinite` 2× con settle ~1.8s carga páginas sucesivas (50→108) | `[gmp-2606][prc-2606][ins-2622]` | piercar: 77 productos en SENSORES → `ionInfinite` se dispara; spinner desaparece al agotar catálogo. ⚠ insumar: **medir baseline TRAS el settle**, no inmediatamente tras limpiar la búsqueda (la lista pasa transitoriamente por 0) `[ins-2622]` |
| `scrollIntoView` antes de click en estructura fuera de viewport | `item.scrollIntoView({behavior:'instant', block:'center'})` + wait 300ms + `mouse.click` en coords frescos | `[prc-2606]` | # candidato — las estructuras debajo del fold no reciben el click sin scroll previo |
| `ion-select` detalle producto (lista de precios) = popover interface | Asignar `.value = opt.value` (objeto completo `{idList,coList,naList,…}`) + `ionChange` + `popover.dismiss()`; sin necesidad de abrir popover primero | `[gmp-2606][gmp-2611][prc-2606]` | refuerza patrón existente; popover interface (NO action-sheet) |
| Descartar `ion-popover` residual antes de back en `productos-header > a` | `document.querySelectorAll('ion-popover').forEach(p => p.dismiss())` + wait 800ms antes del click; si hay popover visible el click no navega | `[prc-2606]` | # candidato — confirmar en otras playas |

### Flujo mínimo probado
```
1. /productos → product-structures-list (ion-select tipo)
2. Click estructura → product-list → buscar (focus+type+Enter)
3. Click producto → detalle (precio, lista de precios)
4. Back: detalle→lista OK; lista→estructuras = FAIL conocido (ver abajo)
```

### Anti-patrones confirmados
- Búsqueda NO filtra on-keyup/ionChange programático — requiere `keyboard.type()` + `press('Enter')`. `[gmp-2606]`
- Back de productos NO usa `.fechaAtras` — usar `header.querySelector('a')` + mouse.click. `[gmp-2606]`

### Notas por cliente
- globalmp/romher/don-theo: solo 1 tipo de estructura (LINEA) → DM-PRD-002 N/A estructural. `[gmp-2606][rom-2606][dth-2612]`
- **globalmp: el detalle de producto muestra solo precio BS** (sin USD), aunque la lista (`product-list`) sí muestra BS+USD. Comportamiento del módulo para este cliente — campos núcleo presentes → PASS. 3 listas de precio (Precio 1/2/3); en 0611 Precio 2 = Precio 3 numéricamente. El defecto romher DM-PRD-013 (selector no refleja en pantalla) **no reproduce** en globalmp. `[gmp-2611]`
- **insumar: 2 tipos de estructura (Línea + Sub-Línea)** → DM-PRD-002 **ejecutable y PASS** (sel[1]=tipo). Excluye a insumar de la nota N/A anterior. `[ins-2610]`
- **Defecto abierto DM-PRD-013** (romher): selector Lista de precio cambia valor interno pero precio en pantalla no se actualiza. En globalmp SÍ cambia (PASS). Divergencia por cliente/datos. `[rom-2606]` vs `[gmp-2606]`
- **don-theo: DM-PRD-013 ejecutable y PASS** — 3 listas (CONTADO P0002 / CREDITO P0001 / FABRICA); el precio visible cambia al cambiar lista (objeto `{idList,coList,naList,...}` a `.value` + `ionChange`). El defecto romher NO reproduce. Detalle muestra solo precio Bs (sin USD), igual que globalmp; la `product-list` sí muestra Bs+USD. Estructura única LINEA con `idTypeProductStructure 1`. Back desde `product-list` sale directo a HOME (reconfirma `[gmp-2606]`). `[dth-2612]`
- insumar: detalle de producto tiene un único `ion-select` = "ALMACEN 01" (**sin Lista de Precios**) → DM-PRD-013 N/A estructural en insumar. Precio USD+BS como texto fijo ("Precio Unidad - UNIDADES 1,85 US$ / 958,23 BS"), no recalculable por selector. `[ins-2610]`
- insumar: lista muestra "Precio + IVA" (no observado en hidroponias). `[ins-2606]`
- **piercar: 24 estructuras (catálogo repuestos automotrices)** — AMORTIGUADORES, BOBINAS, BOMBAS DE ACEITE/AGUA, BUJIAS, CABLES, SENSORES, etc. Solo 1 tipo (Linea) → DM-PRD-002 N/A estructural. `userCanChangePriceList=TRUE` — 2 listas: GRAN MAYOR (P1) y MAYOR (P2); cambio de precio confirmado DM-PRD-013 PASS. Detalle muestra solo precio USD (igual globalmp/don-theo). `[prc-2606]`
- **ferrenuestro: 17 estructuras, 1 tipo (LINEA idTypeProductStructure 1)** → DM-PRD-002 N/A estructural (selector tipo con 1 opción). `userCanChangePriceList=true` → DM-PRD-013 PASS: 2 listas "PRECIO 1" (idList 1, coList P0001) / "PRECIO 2" (idList 2, coList P0002); precio recalcula 86,40→63,94 $ (defecto romher NO reproduce). ⚠ **detalle Y `product-list` muestran solo precio USD ($), SIN Bs** — a diferencia de gmp/don-theo/jerez (lista con Bs+USD); campos núcleo presentes → PASS. `quPageProduct=50` (paginación 50→100→150). texto_busqueda "TALADRO". `[ferrenuestro-2026-07-07]`
- **dm-electronica: 2 tipos de estructura (Linea id 1 / Sub-Línea id 2)** → DM-PRD-002 **ejecutable y PASS** (como insumar): sel[1]=tipo con 2 opciones; Linea→1 estructura "LINEA BLANCA 363"; Sub-Línea→3: MAYOR/MENOR/UNICO. Excluye a dm-electronica de la nota N/A por tipo único. sel[0]=empresa "BOTZ" (`enterpriseEnabled=true`). **DM-PRD-013 N/A estructural** — `product-detail` con **1 sola** lista de precio ("PRECIO LISTA 1", idList 1) → no hay 2ª lista a la cual cambiar (no reproduce ni descarta el defecto romher). Detalle muestra solo US$; `product-list` muestra US$+BS (patrón backend El Yaque, como gmp/don-theo/piercar/ferrenuestro/jerez). `quPageProduct=50` (50→100→150). texto_busqueda "A/A" (28 aires). `[dm-electronica-20260713]`
- **latino_cosmetica (La Tortuga, catálogo cosmética): 2 tipos de estructura (Marca id 1 default / Categoria id 2)** → DM-PRD-002 **ejecutable y PASS** (como insumar/dm-electronica): sel[1]=tipo con 2 opciones; Marca→3 estructuras (BELOTTI 74/PROKPIL 70/ROIAL 8), Categoria→13 (CERA/CRESPOS/CUIDADO FACIAL/DEPILACION/LINEA CAPILAR/…). sel[0]=empresa "LATINOCOSMETICA C.A." (`enterpriseEnabled=true`). ⚠ el YAML asumía "Linea"; el default real es **Marca** — corregido. `userCanChangePriceList=false` → **1 sola lista "DETAL"** → DM-PRD-013 N/A estructural. Detalle Y `product-list` muestran solo precio USD (SIN Bs, patrón como piercar/ferrenuestro). texto_busqueda "BELOTTI" (47→56 con infinite-scroll). `[latino_cosmetica-20260714]`
- **jerez: 8 estructuras, 1 tipo (LINEA idTypeProductStructure=1)** → DM-PRD-002 N/A estructural. `product-structures-list` sel[0]=empresa (3 opciones "INV JEREZ MOTORS VALERA/CARACAS/TURMEREMO"), sel[1]=tipo (LINEA única). `userCanChangePriceList=true` → DM-PRD-013 PASS: 2 listas "Precio 1" (idList 1, coList "01") / "Precio 3" (idList 2, coList "02"); precio recalcula (defecto romher no reproduce). Detalle muestra solo precio USD (lista muestra USD+BS, igual gmp/don-theo/piercar); almacén = "Ferreteria UNIFICADO VALERA 2 Valera". `[jerez-2026-07-06]`

---
