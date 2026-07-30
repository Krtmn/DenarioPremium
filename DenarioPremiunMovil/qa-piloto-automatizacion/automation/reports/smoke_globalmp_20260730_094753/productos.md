# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260730_094753_smoke-completo` |
| Módulo | PRODUCTOS (solo lectura) |
| Dispositivo | Android — WebView vía CDP `:9220` |
| App | `com.kiberno.denarioPremiumPro` — versionApp 1.0 · db_version 19 · `window.ng=true` |
| Playa | la_tortuga (`http://denariolatortuga.ddns.net:8081/PremiumWS`) |
| Cliente / Empresa | globalmp — **00002 COMERCIALIZADORA GLOBAL M&P** (default) |
| Usuario | YC01 YUSNEIDI CLEMENTE (id_user 307) |
| Moneda | local **BS** · dura **USD** · tasa **737,88** |
| Resultado | **9 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | `product-structures-list` con **34 estructuras** (ACEITE 8, ALBECA 30, CAPRI 60, …) + 2 `ion-select` (sel[0]=empresa 2 opciones, sel[1]=tipo) |
| DM-PRD-002 | 🚫 N/A | **Estructural**: el selector de tipo tiene **1 sola opción** — LINEA (`idTypeProductStructure=2`, `coTypeProductStructure="P1"`). No hay 2º tipo al cual cambiar. Consistente con `[gmp-2606][gmp-2611]` |
| DM-PRD-004 | ✅ PASS | Click en **CAPRI 60** → `product-list` con 50 ítems (1ª página), cada uno con Nombre + Código + Precio BS + Precio USD + Inventario |
| DM-PRD-006 | ✅ PASS | Búsqueda "CAPRI" → **27 resultados**, 100 % contienen "CAPRI" (0 falsos positivos). Coincide con el dato esperado del YAML |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ" → **0 `ion-item`** + `<p class="search-empty-state">No hay productos disponibles</p>` |
| DM-PRD-009 | ✅ PASS | `ionInfinite` → **50 → 60** productos; 2º disparo no agrega más (catálogo agotado, coincide con el badge "CAPRI **60**"); `ion-infinite-scroll.disabled=true` y spinner oculto — **sin spinner infinito** |
| DM-PRD-012 | ✅ PASS | Detalle **PCE07**: Nombre "PASTA CAPRI 3 VEGETALES RUEDA 12x500gr" · Código PCE07 · Estructura CAPRI · Unidad de venta CAJA · Lista de precio Precio 1 · **Precio 18.572,44 BS** · Almacén ALMACEN 1 (disabled, 1 opción) · Inventario 0,00 |
| DM-PRD-013 | ✅ PASS | 3 listas: **Precio 1 = 18.572,44 BS → Precio 2 = 17.915,73 BS** (el precio visible SÍ se recalcula) → Precio 3 = 17.915,73 (idéntico a Precio 2) → vuelta a Precio 1 = 18.572,44 ✓. El defecto romher **no reproduce** |
| DM-PRD-020 | ✅ PASS | Back desde detalle → `product-list` (filtro "PCE07" conservado). NO cae a estructuras ni a HOME |
| DM-PRD-021 | ✅ PASS | Back desde `product-structures-list` → **HOME** (12 tiles). Reconfirma que el back desde `product-list` **también** sale directo a HOME (no hay nivel intermedio) |

## Registros creados en sistema

**NINGUNO** — módulo de solo lectura. No se creó ni modificó ningún registro, ni local ni en la nube.
Sin verificación BD (RUNTIME §10 no aplica a solo-lectura) → `BD-N/A`.

## Verificación explícita de precios y conversión USD→BS

Catálogo en **USD**; la lista muestra ambas monedas. Regla: **USD × 737,88 = BS**.

| Producto | USD (UI) | BS (UI) | Cuenta USD × 737,88 | Veredicto |
|----------|---------:|--------:|--------------------:|-----------|
| CP09 PASTA CON ESPINACA PLUMA | 17,92 | 13.222,81 | 17,92 × 737,88 = **13.222,81** | ✅ exacto |
| PAN01 PASTA NAPOLI CODITO | 16,52 | 12.189,78 | 16,52 × 737,88 = **12.189,78** | ✅ exacto |
| PAN02 PASTA NAPOLI VERMICELLI | 15,15 | 11.178,88 | 15,15 × 737,88 = **11.178,88** | ✅ exacto |
| PCE07 CAPRI 3 VEGETALES RUEDA | 25,17 | 18.572,44 | 25,17 × 737,88 = **18.572,44** | ✅ exacto |
| PCE08 CAPRI 3 VEGETALES PLUMA | 22,98 | 16.956,48 | 22,98 × 737,88 = **16.956,48** | ✅ exacto |
| PCE09 CAPRI 3 VEG. TORNILLO | 22,68 | 16.735,12 | 22,68 × 737,88 = **16.735,12** | ✅ exacto |
| PCE07 con **Precio 2** | 24,28 (derivado) | 17.915,73 | 24,28 × 737,88 = **17.915,73** | ✅ exacto |

**Conclusión: 0 defectos de conversión en PRODUCTOS.** Las 7 conversiones verificadas multiplican correctamente,
al céntimo, sin factor entero ni división invertida. Los 2 defectos de conversión abiertos hoy en este cliente
**no se manifiestan en este módulo**.

> ⓘ El precio de lista 0,02 USD de `MR04` es hallazgo de datos ya conocido (precio maestro mal cargado, no
> defecto de conversión) — no se re-reporta.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **Back de PRODUCTOS: `productos-header > a` NO matchea; el robusto es la `img[src*="flecha"]` → `closest('a')`** | universal (**2ª playa** → graduar) | En La Tortuga v1.0/globalmp el `<a>` **no es hijo directo** de `productos-header`, exactamente como en `[ferrenuestro-2026-07-07]`. Fallback que sí opera: `Array.from(document.querySelectorAll('img')).filter(i => /flecha/i.test(i.src) && rect.width>0 && rect.top<80)[0].closest('a')` → coords **~34,51**. Con 2 playas independientes confirmándolo, deja de ser "# candidato": **usar la img como vía primaria y `productos-header > a` como fallback**, no al revés |
| **Empty-state de búsqueda = `<p class="search-empty-state">` fuera de `ion-list`** | universal La Tortuga (**2ª confirmación**) | Reconfirma `[latino_cosmetica-20260714]`: con 0 resultados `product-list` tiene **0 `ion-item`** y el aviso vive en un `<p>`. Buscar el texto en todo `product-list`, nunca asumir `ion-item` |
| Back desde `product-list` **y** desde `product-structures-list` sale **directo a HOME** | universal (re-confirmado) | Verificado en ambos niveles en la misma sesión. Solo detalle→lista es un nivel real de back |
| `ionInfinite` como `CustomEvent` con `detail.complete` no-op dispara la paginación | universal | `s.dispatchEvent(new CustomEvent('ionInfinite',{detail:{complete:()=>{}}}))` + settle 2,5 s. Al agotar el catálogo el propio componente pone `disabled=true` |
| globalmp: **3 listas de precio** (Precio 1 idList 4 / Precio 2 / Precio 3), **Precio 2 == Precio 3** | cliente | Reconfirma `[gmp-2611]`. `userCanChangePriceList` efectivo = true → DM-PRD-013 ejecutable y PASS |
| globalmp: **el detalle muestra solo BS**, la lista muestra BS+USD | cliente (re-confirmado) | Reconfirma `[gmp-2611]`. Campos núcleo presentes → PASS, no FAIL |
| globalmp: 34 estructuras, **1 solo tipo** LINEA `idTypeProductStructure=2` / `coTypeProductStructure="P1"` | cliente | DM-PRD-002 N/A estructural, estable a lo largo de 3 corridas |
| `quPageProduct` efectivo = **50** | cliente | 50 → 60 (tope real de la estructura CAPRI 60) |

## Hallazgos (FAIL)

**Ninguno.** 0 FAIL en el módulo.

## Cierre

Los 10 casos del guión fueron **alcanzados**; nada quedó sin probar por limitación de automatización
(0 BLOCKED, 0 cuelgues de CDP, watchdog nunca disparó). El único caso no ejecutado es **DM-PRD-002**, y es
**N/A estructural legítimo**: el cliente tiene un único tipo de estructura (LINEA), así que no existe un 2º
tipo al cual cambiar — no es una limitación del harness ni un defecto de la app.
