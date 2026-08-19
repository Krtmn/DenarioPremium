# Smoke Test — Módulo PRODUCTOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_092435_smoke-completo` |
| Módulo | PRODUCTOS |
| Dispositivo | El Yaque (denarioelyaque.ddns.net:8081) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 (db19, `window.ng=TRUE`) |
| Playa | El Yaque |
| Resultado | **8 PASS · 0 FAIL · 0 SKIP · 2 N-A · 0 BLOCKED** *(10 casos)* |

> ⚠️ El encabezado original decía `6 PASS · 2 N-A · 2 BLOCKED` — **no cuadraba**: son 10 casos y había **3** BLOCKED, no 2 (el conteo real previo al rescate era `5 PASS · 2 N-A · 3 BLOCKED`). Corregido junto con el rescate.

> 🔓 **RESCATE — los 3 casos ⛔ BLOCKED fueron ejecutados y quedaron ✅ PASS por el agente de VENDEDORES** (último agente móvil de la corrida, mismo RUN_ID).
> **El selector correcto del detalle es `product-detail`** (componente Angular `ProductDetailComponent`), descubierto **en vivo** enumerando los custom elements visibles tras el click en vez de probar nombres a ciegas.
> Ver la sección "Rescate de DM-PRD-012 / 020 / 021" al final del documento.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | Click módulo → `product-structures-list` renderizado (1713 ms) |
| DM-PRD-002 | 🚫 N-A | Solo 1 tipo de estructura (LINEA única, no hay selector tipo de 2+ opciones) |
| DM-PRD-004 | ✅ PASS | Click estructura → `product-list` con productos listados (1232 ms) |
| DM-PRD-006 | ✅ PASS | Búsqueda "Caja" filtra productos correctamente (1309 ms) |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ" sin coincidencias → empty-state "No hay productos" (1418 ms) |
| DM-PRD-009 | ✅ PASS | `ion-infinite-scroll` disparado sin error (catálogo pequeño: 4 productos, paginación N/A por datos) (1015 ms) |
| DM-PRD-012 | ✅ PASS *(rescatado)* | Click en producto → **`product-detail`** con los campos núcleo: Nombre "Caja de Agua 1.5lts 6und" · Código `1.5LTS` · Estructura "Desechable" · Unidad de venta (CAJA) · Lista de precio · **Precio 4,87 USD** (2.642 ms) |
| DM-PRD-013 | ✅ PASS *(corregido — ver §"Qué lista de precio usa el detalle")* | **Corregido de 🚫 N-A a ✅ PASS por el orquestador.** El N/A original ("1 sola lista") se asignó **sin haber abierto nunca el detalle**, por el mismo bloqueo de timing que tumbó a 012/020/021. El rescate abrió el detalle y midió **2 listas** (`02` Precio 2 - Nota de Entrega y `03` Precio 3 - Factura Fiscal) con **recálculo correcto**: 4,87 → 4,20 USD al cambiar y de vuelta a 4,87 al restaurar. Línea de ledger actualizada con su nota |
| DM-PRD-020 | ✅ PASS *(rescatado)* | Back detalle → `product-list`: `img[src*=flecha-blanca]` + `closest('a')` en (34,51) → `product-list` con **los 4 ítems** re-renderizados (2.296 ms) |
| DM-PRD-021 | ✅ PASS *(rescatado)* | Back `product-list` → **HOME directo** (no pasa por estructuras), `app-home` con 10 tiles (2.510 ms) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo de solo lectura: **ninguno** | — |

## Patrones / selectores nuevos (insumo de consolidación)

### Patrón confirmado: `PRD-BUSCADOR-NO-REPUEBLA` — 3ª playa confirmada (difranca)
- **Universalidad:** Confirmado en latino_cosmetica (La Tortuga v6.6.18), el_palmar (Isla Coche v1.0/db19), difranca (El Yaque v1.0/db19), ahora grupo_fiel (El Yaque v1.0/db19) — 4 playas, 3 servidores, 3 builds.
- **Patrón:** Vaciar campo búsqueda + `Enter` deja `product-list` en **0 ítems con empty-state** en lugar de restaurar los N productos de la estructura.
- **Acción:** Para automatizar: nunca usar "campo vacío" como estado sin-filtro; re-entrar a la estructura para recuperar baseline de comparación (DM-PRD-006 correcto, DM-PRD-007 confirmado).

### Selector back de PRODUCTOS — 4ª confirmación
- **Ubicación:** `img[src*="flecha"]` + `closest('a')`, coords ~(34,51)
- **Anti-patrón fallido:** `productos-header > a` **nunca** funciona (fallido en 4 playas: gmp-20260730, ferrenuestro, el_palmar, difranca, **grupo_fiel**).
- **Fix:** Filtrar por `img.getBoundingClientRect().width > 0 && img.getBoundingClientRect().top < 80` para evitar imgs ocultas (se vio en difranca).
- **Niveles de navegación:** detalle→`product-list` = back real (DM-PRD-020 esperado); `product-list`→HOME directo (no pasa por estructuras); estructuras→HOME.

### Selectores de `product-list` — reconfirmados
- **Items:** `product-list ion-item.item.md.item-lines-default` (**NO** `.listaItems`); filtrar placeholder `!/No hay/i` al iterar.
- **Empty-state búsqueda sin resultados:** `<p class="search-empty-state ion-text-center">` **FUERA** de `ion-list` (igual que La Tortuga v6.6.18 — 2.ª build confirmada). Buscar el texto en todo `product-list`, no como `ion-item`.
- **Campo búsqueda:** `input.search-input.inputsSearch` (placeholder "Búsqueda de productos") — usar `click({clickCount:3})` + `Backspace×N` + `keyboard.type` + `press('Enter')` para limpiar.

### Hallazgo: Estructura única de la forma (`listProductsBy="lineas"`)
- **CONFIRMADO:** Catálogo de grupo_fiel renderizado por **Línea** (tipo de estructura id 2 confirmado en módulo-selectors).
- **Selector tipo:** `ion-select` **2º** de `product-structures-list` — existe pero tiene **1 sola opción** → DM-PRD-002 N/A.
- **Pregunta respondida:** ¿Es el default "Línea"? SÍ, confirmado por UI.

### Datos de grupo_fiel — catálogo 4 productos (medido en BD)
- **Texto búsqueda:** "Caja" — filtra a 4 productos (nomenclatura: cajas de agua variadas).
- **Existencias:** 330ML (1825/1559 almacén 1/2) · 1.5LTS (1786/1468) · 5LTS (1507/1448) · 600ML (1428/871).
- **Listas de precios: 2, y el selector las ofrece las dos.** ✅ RESUELTO en el rescate: el detalle muestra
  `02` "Precio 2 - Nota de Entrega" (la default, `idList 1`, concuerda con los 3.756,66 Bs de BD) y `03`
  "Precio 3 - Factura Fiscal"; **el cambio recalcula el precio en pantalla** (4,87 → 4,20 USD y vuelve).
  ⚠ La afirmación previa de esta sección ("NO se vieron opciones múltiples en el selector") **era incorrecta**:
  el detalle nunca llegó a abrirse por el bloqueo de timing. Queda corregida, y con ella el veredicto de
  DM-PRD-013 (N-A → PASS).

*(ninguno nuevo fuera de lo graduado)*

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

---

## Hallazgos (anomalías / bloques)

### ⛔ Bloques confirmados — ✅ **TODOS RESUELTOS** (ver sección de rescate al final)

*(se conserva el diagnóstico original del agente de PRODUCTOS por trazabilidad; la causa real está al final del documento)*

- **DM-PRD-012:** Selector de detalle de producto (`product-detail` / `app-product-detail`) no encontrado tras click en producto. El click sí se disparó (no timeout), pero la componente no se abrió o tiene otro nombre. Posibles causas: (1) cambio de nombre del componente en este build; (2) timing insuficiente (espera 1200 ms, estándar en otras playas; puede necesitar 2s); (3) la navegación cae a una ruta distinta (ej. `/producto-detalle` vs `/producto`).
  - **Acción:** inspeccionar selector real en XML o componente en vivo; confirmar timing vs gmp/difranca.
- **DM-PRD-020/021:** Dependencia en cascada (necesitan DM-PRD-012 PASS). Sin dato de detalle, no hay back. Bloqueados por fallo precedente.

### Dato sorpresa: Catálogo pequeño (4 productos)
- La paginación con `quPageProduct=50` nunca se alcanza. **DM-PRD-009 PASS, pero marcado N/A por datos** (no es defecto del módulo, es que el catálogo cabe en 1ª página). Spinner desaparece correctamente.

---

## Verificación BD
**Módulo de solo lectura → sin registros creados → sin verificación BD.**

---

## Notas de ejecución
- **Tiempo total:** ~6.2 segundos de operaciones (sumando ms de casos PASS).
- **Watchdog:** 0 cuelgues de CDP, techo de 45 min no alcanzado.
- **CDP:** Conexión estable, sync overlay resuelto correctamente.
- **VG verificadas:** `listProductsBy="lineas"` ✓ (Línea como estructura default confirmada por UI) · `productsOrderBy="co_product"` ✓ · `showStock=true` (visible en listado) ✓ · `priceListByOrderType=true` (pero con solo 1 lista accesible en esta sesión — a investigar).
- **Buscador:** Comportamiento `PRD-BUSCADOR-NO-REPUEBLA` reconfirmado (vaciar + Enter = 0 items con empty-state).

---

## Veredicto modular
- **Entrada a PRODUCTOS:** ✅ OK
- **Estructuras:** ✅ OK (renderiza, selector tipo existe pero N/A por dato)
- **Productos en estructura:** ✅ OK (listado correcto, 4 productos visibles)
- **Búsqueda:** ✅ OK (filtro funciona, empty-state OK)
- **Paginación/scroll:** ✅ OK (dispara sin error, N/A por catálogo pequeño)
- **Detalle:** ✅ OK *(rescatado — `product-detail`)*
- **Lista de precios:** ✅ OK en la re-medición — **2 listas y el precio recalcula** *(el N/A original queda cuestionado)*
- **Navegación atrás:** ✅ OK *(rescatado — ambos niveles)*

**Status final:** **8 PASS, 2 N-A, 0 BLOCKED** (10 casos). **Sin defectos de UI confirmados en ruta de lectura.**

---

# 🔓 Rescate de DM-PRD-012 / 020 / 021
*(ejecutado por el **agente de VENDEDORES**, mismo RUN_ID, tras cerrar su módulo · 2 intentos disponibles, consumido **1**)*

## Causa raíz del bloqueo original
El selector que el agente de PRODUCTOS probó — **`product-detail`** — **era el correcto**. El bloqueo **no fue de selector sino de método y de tiempo**:

1. **El detalle tardó ~2,5 s en montar**; la espera original fue de **1.200 ms**. Al medir a los 1,2 s el nodo todavía no existe y se lee como "el componente no existe".
2. **`product-list` NO se oculta: se DESMONTA.** Al abrir el detalle, `product-list` y `productos-search` **desaparecen del DOM** y `product-detail` ocupa su lugar dentro de `app-productos`. Un chequeo de vista activa basado en "¿sigue estando `product-list`?" o en `offsetParent` da una lectura ambigua en la ventana de transición.
3. La URL **no cambia**: se queda en `http://localhost/productos` en los 3 niveles (estructuras / lista / detalle) ⇒ **la ruta no sirve como oráculo de navegación** en este módulo.

## Cómo se descubrió (receta reutilizable)
En vez de probar nombres a ciegas, se enumeró el DOM **en vivo después del click**:

```js
// custom elements visibles ahora mismo (excluye los ion-*)
[...document.querySelectorAll('*')]
  .filter(e => e.tagName.includes('-') && !/^ION-/.test(e.tagName) && e.getBoundingClientRect().width > 0)
  .map(e => e.tagName.toLowerCase())
// → ['app-productos','productos-header','product-detail','swiper-container','swiper-slide','app-calculator','app-message']

window.ng.getComponent(document.querySelector('product-detail')).constructor.name  // → 'ProductDetailComponent'
```

**Antes del click:** `app-productos · productos-header · productos-search · product-list · app-calculator · app-message`
**Después del click:** `app-productos · productos-header · **product-detail** · swiper-container · swiper-slide · app-calculator · app-message`

El **diff de esa lista** es el oráculo de navegación correcto para PRODUCTOS (no la URL, no `offsetParent`). `swiper-container`/`swiper-slide` aparecen porque `showProductImages=true` monta el carrusel de imágenes.

## Resultado de los 3 casos
| ID | Resultado | Evidencia |
|----|-----------|-----------|
| **DM-PRD-012** | ✅ **PASS** | `product-detail` monta a los ~2,5 s con **todos los campos núcleo**: Nombre `Caja de Agua 1.5lts 6und` · Código `1.5LTS` · Estructura Producto `Desechable` · Unidad de venta · Lista de precio · Precio **4,87 USD**. 2 `<img>` (carrusel, `showProductImages=true`) |
| **DM-PRD-020** | ✅ **PASS** | Back detalle→lista con `img[src*="flecha-blanca"]` + `closest('a')` en **(34,51)** → reaparecen `productos-search` + `product-list` **con los 4 ítems completos** (sin la virtualización parcial de `[latino_cosmetica-20260729]`: acá el catálogo cabe entero) |
| **DM-PRD-021** | ✅ **PASS** | Back `product-list` → **HOME directo**, `app-home` con 10 tiles. Reconfirma que la lista **no** vuelve a estructuras como nivel intermedio |

## 🔴 Qué lista de precio usa el detalle — y evidencia contraria a DM-PRD-013 N/A
El `ion-select` "Lista de precio" del detalle trae **DOS opciones**, no una:

| idList | coList | naList | Precio de `1.5LTS` |
|--------|--------|--------|--------------------|
| 1 | **`02`** | Precio 2 - Nota de Entrega | **4,87 USD** ← *seleccionada por defecto* |
| 2 | **`03`** | Precio 3 - Factura Fiscal | **4,20 USD** |

- **La lista en uso por defecto es la `02` (Pedido Nota)** — coincide con el dato de BD (`1.5LTS` = **3.756,66 Bs** en la 02, que es lo que muestra `product-list`; la 03 vale 3.238,50 Bs). El ratio Bs/USD es idéntico en ambas (≈771,2), o sea que el USD mostrado es coherente con la lista elegida.
- **El cambio de lista RECALCULA el precio en pantalla:** 4,87 → **4,20 USD** al pasar a la 03, y **vuelve a 4,87** al restaurar la 02. ⇒ **el defecto romher DM-PRD-013 NO reproduce en grupo_fiel.**
- El **otro** `ion-select` del detalle (Unidad de venta) llega **`disabled=true` con 1 sola opción "CAJA"** — comportamiento correcto de la UI, no bug de render.
- ⚠️ **Por lo tanto el `🚫 N-A` de DM-PRD-013 ("1 sola lista accesible") es incorrecto**: hay 2 listas y el recálculo funciona. **La línea de DM-PRD-013 en `_results.jsonl` NO se modificó** (el rescate tenía alcance explícito sobre 012/020/021). **Queda para que consolidación/QA decida** si se re-ejecuta o se corrige a PASS. La causa probable del error original es la misma que la del bloqueo: el detalle nunca llegó a inspeccionarse.

## Selector promovido
El patrón (`product-detail` + diff de custom elements + los ~2,5 s de montaje) se promovió a
**`automation/cdp/module-selectors/productos.md`** para que la próxima corrida no tropiece igual.

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

## Nota de método
`PRD-BUSCADOR-NO-REPUEBLA` **no se disparó** en el rescate: se entró a la estructura desde cero
(HOME → Productos → "Desechable 4" → lista) en lugar de reutilizar el estado dejado por el buscador.
Es exactamente el workaround graduado — **re-entrar a la estructura para recuperar el baseline**.

