# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `smoke_difranca_20260810_main` |
| Módulo | PRODUCTOS (solo lectura — no crea registros) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db19 · rama **main**, commit `99b138fa` |
| Playa / tenant | EL YAQUE · difranca |
| Empresa | **DDHP_A12** (id 2) — 450 productos activos |
| Runtime | `window.ng=true` · `window.sqlitePlugin` disponible |
| Resultado | **8 PASS · 1 FAIL · 0 BLOCKED · 1 N/A** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | `product-structures-list` visible; 2 `ion-select` (sel[0]=empresa `*DISTRIBUIDORA DIAZ`, sel[1]=tipo `Linea`) + 7 estructuras con badge. Badges suman 450 = productos activos de DDHP_A12 |
| DM-PRD-002 | ✅ PASS | Tipo `Linea`→`Sub-Linea`: la lista pasa de **7 a 32** estructuras y el select rotula `Sub-Linea`. Badges suman 450 en ambos tipos |
| DM-PRD-004 | ✅ PASS | Click en `BBK` → `product-list` con 50 ítems; cada uno con Nombre, `Código:`, `Precio: … BSD`, `Precio: … US$`, `Inventario:` |
| DM-PRD-006 | ✅ PASS | `Acondicionador` + Enter → 8 resultados, todos coincidentes. `Mascarilla` → 12, `MABBKRI240U` → 1. Filtra correctamente |
| DM-PRD-007 | ✅ PASS | `ZZZZZZZ` + Enter → 0 ítems + `<p class="search-empty-state">No hay productos disponibles</p>` (fuera de `ion-list`) |
| DM-PRD-009 | ❌ **FAIL** | **El scroll infinito se apaga con catálogo pendiente**: la estructura se agota en ~84-93 productos y el resto queda inalcanzable. 3 estructuras, scroll real y programático. Ver Hallazgos |
| DM-PRD-012 | ✅ PASS | Detalle de `ACPDT300`: Nombre, Código, Estructura, Unidad de venta (`Caja`), Lista de precio (`Precio 01`), Precio `43.681,39 BSD`, Almacén (`Principal`), Inventario `64` |
| DM-PRD-013 | 🚫 N/A | **N/A estructural**: DDHP_A12 tiene **una sola** lista de precio. BD nube: 1 lista por empresa (`id_list` 6→DDHP_A12, 11→DIF_A12, 16→DHVITAL01_A). El `ion-select` llega `disabled=true` con 1 opción — comportamiento correcto, no hay 2ª lista a la cual cambiar |
| DM-PRD-020 | ✅ PASS | Back desde detalle → `product-list` (no salta a estructuras). Vuelve a la 1ª página (47 ítems), re-render conocido, no pérdida de datos |
| DM-PRD-021 | ✅ PASS | Back desde `product-structures-list` → `app-home`. Estado final: HOME, 0 alerts, 0 modales |

## Verificación BD

`BD-N/A` para veredicto transaccional (módulo de solo lectura), pero la BD se usó como **oráculo de cobertura del catálogo** — es lo que destapó el FAIL.

| Fuente | Consulta | Resultado |
|---|---|---|
| Nube (`query.js`) | `product` por `id_product_structure` del subárbol BBK, `co_enterprise='DDHP_A12'` | **114** |
| Local (`sqlitePlugin`, `products`) | mismo subárbol | **114** — el sync **no** es parcial |
| Local (`product_structures.qu_products`) | badge de BBK | **114** — el badge es correcto |
| UI (`comp.productList` tras agotar scroll) | — | **93** |

⇒ El dato está completo en el dispositivo y el badge no miente: **la pérdida ocurre en el listado**.

## Hallazgos

### 🔴 PRD-LISTA-CORTA-CATALOGO — el listado por estructura se agota antes de tiempo y deja ~1/4 del catálogo cotizable inalcanzable

**Severidad: funcional alta · probabilidad en uso real: alta · NUEVO (no está en `defectos-conocidos.yaml`)**

Al entrar a una estructura, `product-list` carga una 1ª página (46-50 ítems) y una 2ª (~38-43). Después
`ion-infinite-scroll` pasa a **`disabled=true`** y no vuelve a cargar: la app **declara agotado un catálogo
que no lo está**. El corte es por la **cola alfabética** (orden `co_product`): en Pasarela lo último cargado
es `CHSPMNY30U`, y todo lo que sigue (`DPB…`, `E…`, `M…`) nunca aparece.

En la empresa DDHP_A12 quedan **98 de 381 productos cotizables (26 %) inalcanzables navegando**.

### Regla de corte (reconstruida y validada)

La lista pinta **ordenada por `co_product` ascendente** (coherente con la VG `productsOrderBy: "co_product"`),
y **omite siempre los productos sin precio en la lista vigente** — también los del *medio* de la lista, no sólo
los del final. Sobre ese universo ya filtrado, **carga los primeros ~84-93 y se detiene**: lo que queda es
una **cola contigua** por código.

**Validación independiente de la regla:** en Pasarela, el **90.º** producto con precio en orden de `co_product`
es `CHSPMNY30U` — exactamente el último que la app había cargado en la medición por scroll real
(`ultimos: [CHPMNY480U, CHSPMNY30, CHSPMNY30U]` = rn 88, 89, 90). La regla predice el corte medido.

⚠ **Corrección respecto de la 1.ª versión de este reporte:** los productos **sin precio** NO se cuentan como
parte del defecto — su exclusión es deliberada (se los excluye también dentro del tramo ya cargado: en BBK,
`CBA240`, `CBK380`, `CBG380U`… ocupan las posiciones 51-60 del orden y tampoco aparecen). El defecto es
**sólo la cola cortada**. Eso baja la cifra de 150 (33 %) a **98 (26 %)**.

**Medición en las 3 líneas grandes de DDHP_A12** (BD local = BD nube = badge, en los tres casos):

| Línea | Total en BD | Con precio (cotizable) | Muestra la app | **Inalcanzables (con precio)** | Último visible |
|---|---:|---:|---:|---:|---|
| BBK | 114 | 106 | 93 | **13** | `KITBBKRI300` |
| HD Cosmetics | 118 | 101 | 84 | **17** | `JHCM180U` |
| Pasarela | 185 | 158 | 90 | **68** | `CHSPMNY30U` |
| *(líneas ≤50: Actualizar 1, Ampollas 16, CUIDADO DE UÑAS 4, Quick Fix 12)* | 33 | — | 33 | 0 | — |
| **TOTAL empresa DDHP_A12** | 450 | **381** | ~300 | **98 (26 %)** | — |

### Verificación manual en 30 segundos (sin contar ítems)

No hay contador en pantalla. La comprobación barata es **el último producto de la lista**: bajar con el dedo
hasta el fondo, esperar a que el spinner *"Por favor espere…"* deje de aparecer, y leer el último ítem.

| Línea | Bajá hasta el final y vas a ver como último… | Y NO van a estar (todos con precio y stock) |
|---|---|---|
| **BBK** | `KITBBKRI300` — *KIT BBK para Risos 3 Pasos 300 ML* | `KITBBKRI300U` (mismo KIT, versión unidad, 9,75 US$ · 26 u) · `MABBKA30` *Mascarilla BBK Argan 30 GR X 24 Sachet* (18,48 US$ · 88 u) · `MABBKK30` *Mascarilla BBK Keratina* (91 u) · `MABBKRI240U` *Mascarilla BBK Definicion de Rizos 240 gr* (3,40 US$ · **6.712 u**) · `KITBGU` *KIT BBK GOLD* (39,15 US$) |
| **HD Cosmetics** | `JHCM180U` — *Locion Jabonosa HD Camomila 180ml* | `JHP180U` *Locion Jabonosa HD PiNa Colada 180ml* · `KITHCA300U` *KIT HD CACAO* · `KITHDC300U` *KIT HD COSMETICS COCONUT* · `KITHDS300U` *KIT HD COSMETICS SABILA* · `KITHO300U` *KIT HD OLIVA* |
| **Pasarela** | `CHSPMNY30U` — *Champu Matizador No Yellow 30GR Sachet* | `DPB30U` *Polvo Decolorante Pasarela Azul 30gr* (**620 u**) · `DPB300U` (182 u) · `DPB150U` (72 u) · `DPB60U` · `DPB30-1U` (14 u) — **la familia Polvo Decolorante entera** |

**Señal inequívoca:** ninguno de esos productos aparece navegando, pero **todos aparecen si se los busca por
código en el buscador** — con precio e inventario. Ese contraste (invisible navegando / visible buscando) es
la prueba del defecto, y no requiere contar nada.

⚠ **Alcance medido vs. derivado:** los conteos `93 / 84 / 90` y los últimos visibles de **BBK y Pasarela**
están **medidos en el dispositivo**. Para **HD Cosmetics** el conteo (84 de 118) está medido, pero el último
visible `JHCM180U` y su lista de ausentes están **derivados de la regla** ya validada en las otras dos —
conviene que la QA lo confirme con el dedo, es el único ítem no medido directamente.

### El conjunto ausente NO es el mismo que en PEDIDOS

El agente de pedidos midió otro corte (BBK 83/**106**, HD 71/**101**). Los denominadores encajan: **106 y 101
son exactamente los productos con precio** de cada línea — o sea, ambos módulos parten del mismo universo
cotizable, pero **cortan en puntos distintos** (Productos 93, Pedidos 83 en BBK). Por eso los códigos ausentes
difieren: `BCBA500U`, `BCBG500U` y `JHCI180U`, ausentes en Pedidos, **sí se ven en Productos** (posiciones 20,
42 y 82 del orden). ⇒ **Al reportar hay que citar los códigos del módulo que se está probando.**

**Descartes hechos antes de emitir el veredicto** (ninguno explica la ausencia):

1. **No es sync parcial** — los 114/118/185 están en la BD **local** del dispositivo.
2. **No es el badge rollup** de `[el_palmar-20260805]` — el badge coincide exacto con el conteo real de `products` del subárbol, en local y en nube. Acá el badge tiene razón y la lista no.
3. **No es "producto sin precio"** — de los 21 ausentes en BBK, **13 tienen precio en la lista vigente (id_list 6, US$)**: `KITBCU` 39,15 · `MABBKRI240` 81,60 · `MABBKA30` 18,48 · `KITBBKRI300U` 9,75 … En Pasarela, **68 de los 95** ausentes tienen precio en L6. *(Los 8 restantes de BBK, sin precio, quedan fuera del cómputo del defecto: ver "Regla de corte".)*
4. **No es filtro por inventario** — entre los **mostrados** hay 22 con stock 0 y 11 sin fila de stock (la app sí muestra sin inventario), y entre los **ausentes** hay `MABBKRI240U` con **6.712** unidades, `MABBKK30` 91, `MABBKC30` 90, `MABBKA30` 88, `DPB30U` 620, `DPB300U` 182. En Pasarela, **41** ausentes tienen precio **y** stock positivo.
5. **No es artefacto de automatización** — reproducido con **scroll real de rueda del mouse** (no sólo con `ionInfinite` programático): 47 → 90 y se detiene; 4 rondas más de rueda no cargan nada y `infDisabled` queda `true`.
6. **Los productos existen y son alcanzables por buscador** — `Mascarilla` devuelve `MABBKA30` y `MABBKA30U`; `MABBKRI240U` devuelve su ficha con precio. Es decir: **están en el dataset, pero el listado por estructura no los muestra**.

**Impacto operativo:** un vendedor que navega el catálogo por línea —el gesto natural— no puede ver ni cotizar
**1 de cada 4 productos cotizables** de la empresa (98 de 381). Sólo los alcanza si sabe de memoria el nombre
o el código exacto para buscarlos. En Pasarela, la línea más grande, **68 de 158 (43 %)** son invisibles,
incluida la familia *Polvo Decolorante* completa.

**Nota metodológica (por si se compara con otros módulos):** los conteos `93 / 90 / 84` se leyeron de
**`comp.productList.length` (el modelo Angular)**, no del DOM, y en las lecturas donde se tomaron ambos
coincidían (`model:90, dom:90`). No aplica el artefacto de "el DOM va una ronda atrás del modelo" reportado por
inventarios: ese artefacto hace que el **DOM subestime al modelo**, y acá la fuente es el modelo. El corte se
reprodujo además con **rueda de mouse real** (47 → 90, y 4 rondas más sin cargar nada, `infDisabled=true`).

**Agravante combinado con `PRD-BUSCADOR-NO-REPUEBLA`:** el workaround documentado para el buscador es
"re-entrar a la estructura para recuperar el baseline" — pero ese baseline **ya viene incompleto**. Los dos
defectos juntos dejan al vendedor sin ninguna vía de navegación que muestre el catálogo entero.

**Reproducción manual (sin herramientas):**
1. PRODUCTOS → tipo `Linea` → entrar a **Pasarela** (badge **185**).
2. Bajar con el dedo hasta el final de la lista, esperando a que cargue cada tanda.
3. La lista se detiene en **90** productos y el spinner "Por favor espere…" ya no vuelve a aparecer.
4. Buscar `DPB30U` en el buscador: **aparece**, con precio y 620 de inventario — pero no estaba en la lista.

### ⚠ `PRD-BUSCADOR-NO-REPUEBLA` — SIGUE REPRODUCIENDO EN `main` (no corregido)

Verificado como pedía el encargo. Tras `ZZZZZZZ`, vaciar el campo (Backspace×N) + `Enter` deja
`product-list` en **0 ítems** con `<p class="search-empty-state">No hay productos disponibles</p>`, y
**persiste tras 5 s** (no es settle). Defecto ya graduado (3 playas / 3 builds) — **no se levanta como nuevo**,
pero se deja constancia de que **el tag 21 lo arrastra sin cambios**.

### ✅ Falsos positivos descartados (no son defectos)

- **`U+FFFD` en nombres de estructura** (`CUIDADO DE U<FFFD>AS`, `Ba<FFFD>o de Crema`): viene de la **nube**, el móvil refleja. Ya documentado; no es defecto de sync.
- **Detalle muestra sólo BSD** mientras la lista muestra BSD + US$: patrón ya visto en globalmp/don-theo/ferrenuestro. Campos núcleo presentes → PASS.
- **Búsqueda y tildes:** N/A por dato — **0 de 1.487** productos tienen acentos (verificado en corrida previa; el catálogo es `BaNo`, no `Baño`). No se levanta.

## Registros creados en sistema

Ninguno — módulo de solo lectura.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **Oráculo de cobertura de catálogo: `badge` vs `comp.productList` vs `products` local** | universal | Contrastar los **tres** al entrar a una estructura. Es lo que separa este defecto del badge-rollup de `[el_palmar-20260805]`: allí el badge sobre-contaba, acá el badge acierta y **la lista pierde**. Receta: `SELECT count(*) FROM products WHERE id_product_structure IN (<comp.idProductStructureList>)` vs `comp.productList.length` |
| 🔴 **`ion-infinite-scroll.disabled===true` NO prueba "catálogo agotado"** | universal | El criterio de corte recomendado (`sc.scrollDisable===true`) es **necesario pero no suficiente**: acá la lista se declara agotada con ~1/4 del catálogo cotizable pendiente. Siempre cerrar contra el conteo de BD, nunca contra el flag |
| **Confirmar cortes de lista con `pg.mouse.wheel`, no sólo con `ionInfinite` programático** | universal | Prueba de control barata que separa defecto de app de artefacto de automatización. Acá: 12 rondas de rueda real reprodujeron el mismo tope de 90 |
| `comp.productList` es el nombre del array del modelo (no `products`) | universal | En `product-list`, `ng.getComponent(el).productList`. `productListView` queda en 0. `c.products` es `undefined` — usarlo da un falso `null` |
| Esquema local `products` **sin** columna de estado | cliente/universal | `products` local: `id_product, co_product, na_product, co_primary_unit, co_product_structure, id_product_structure, tx_dimension, tx_packing, points, nu_priority, featured_product, tx_description, co_enterprise, id_enterprise, nu_tax`. **No** existen `st_product` ni `co_operation` ⇒ no se puede filtrar "producto inactivo" en local |
| `stocks` local: `qu_stock` (no `nu_stock`), agregar por `id_product` | universal | Hay múltiples filas por producto (una por almacén). "Sin fila" ≠ stock 0 |
| `price_lists` local trae `co_enterprise=null` | cliente | Para atribuir la lista a una empresa hay que ir a la nube (`price_list.co_enterprise`). En difranca: **1 lista por empresa** (6/11/16) ⇒ DM-PRD-013 N/A estructural en las 3 |
| Estructura de difranca: `Linea` (7) / `Sub-Linea` (32), badges suman 450 en ambos | cliente | El total por tipo es consistente; la inconsistencia vive en el listado, no en el árbol |
| Reconfirmados (5ª playa) | universal | Back = `img[src*=flecha]` + `closest('a')`, `width>0 && top<80`, coords ≈(34,51); `productos-header > a` **no** matchea. Niveles: detalle→`product-list` back real; `product-list`→**HOME directo**; estructuras→HOME. `ion-select` de tipo con `value` **OBJETO** + `ionChange` sin abrir popover. Empty-state `<p class="search-empty-state">` fuera de `ion-list`. Limpieza del buscador: `click({clickCount:3})` + Backspace×N + `type` + **Enter** |

## Nota para `defectos-conocidos.yaml`

Alta sugerida:

```yaml
- id: PRD-LISTA-CORTA-CATALOGO
  titulo: "El listado por estructura se agota antes de tiempo y oculta ~1/4 del catálogo cotizable (98 de 381 en difranca/DDHP_A12)"
  capa: movil
  modulo: productos
  detectado_en: "main (pre-tag 21)"
  estado: confirmado
  confirmado_por: "smoke_difranca_20260810_main (3 estructuras, scroll real + programático, cotejo BD local y nube)"
  severidad: funcional
  probabilidad_en_uso_real: alta
  patron: 'infinite.*disabled|catalogo incompleto|productList.*93|lista corta'
```
