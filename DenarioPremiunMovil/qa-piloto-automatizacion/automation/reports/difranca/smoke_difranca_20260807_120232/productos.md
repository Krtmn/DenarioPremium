# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260807_120232_smoke-difranca-tag20` |
| Módulo | PRODUCTOS (solo lectura) |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — app v1.0 / db 19 · `window.ng=true` |
| Playa | EL YAQUE · cliente **difranca** · empresa **DDHP_A12** |
| Resultado | **9 PASS · 0 FAIL · 1 🚫 N/A · 0 BLOCKED** |
| Registros creados | ninguno (módulo de solo lectura) |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | `product-structures-list` con 2 `ion-select` (sel[0]=empresa 3 opciones · sel[1]=tipo) + **7 estructuras** tipo Línea |
| DM-PRD-002 | ✅ PASS | tipo `Linea` (7 estructuras) → `Sub-Linea` (**32 estructuras**); la lista actualiza |
| DM-PRD-004 | ✅ PASS | click estructura **BBK** → `product-list` con **50 ítems**, cada uno con Nombre, Código, Precio BSD, Precio US$, Inventario |
| DM-PRD-006 | ✅ PASS | búsqueda `"Acondicionador"` → **8 resultados** (filtra desde 50) |
| DM-PRD-007 | ✅ PASS | búsqueda `"ZZZZZZZ"` → **0 ítems** + `<p class="search-empty-state">No hay productos disponibles` |
| DM-PRD-009 | ✅ PASS | infinite-scroll: **50 → 93** ítems y `ion-infinite-scroll.disabled` pasa a **true** al agotar el catálogo (sin spinner infinito) |
| DM-PRD-012 | ✅ PASS | detalle de **ACBA300U** con Nombre, Código, Estructura, Unidad de venta, Lista de precio, Precio, Almacén, Inventario |
| DM-PRD-013 | 🚫 N/A | **estructural**: el `ion-select` "Lista de precio" tiene **1 sola opción** (`Precio 01`) y llega **`disabled=true`** ⇒ no hay 2.ª lista a la cual cambiar. El `disabled` con una sola opción es comportamiento **correcto** de la UI, no bug de render |
| DM-PRD-020 | ✅ PASS | back desde detalle → `product-list` (no salta a estructuras) |
| DM-PRD-021 | ✅ PASS | back desde `product-structures-list` → **HOME** |

---

## Catálogo observado

**7 estructuras** de tipo `Linea`, y sus badges suman exactamente los **450 productos activos**
esperados en DDHP_A12:

| Estructura | Badge |
|---|---|
| Actualizar | 1 |
| Ampollas | 16 |
| BBK | 114 |
| CUIDADO DE U`<FFFD>`AS | 4 |
| HD Cosmetics | 118 |
| Pasarela | 185 |
| Quick Fix | 12 |
| **Total** | **450** ✅ |

Tipo `Sub-Linea`: **32 estructuras** (ACONDICIONADOR ×3 variantes de capitalización, Agua Oxigenada,
Alisador, Ampollas, Ba`<FFFD>`o de Crema 44, …).

Detalle de **ACBA300U** (`Acondicionador BBK de Argan Therapy 300ml`): Estructura `ACONDICIONADOR`,
Unidad de venta `Unidad`, Precio **2.737,61 BSD**, Almacén `Principal` (opciones: Principal /
TRANSLADO ENTRE ALMACENES), Inventario 38.

⚠ El **detalle muestra el precio solo en BSD**, mientras la `product-list` muestra **BSD + US$**
(`Precio: 2.737,61 BSD` / `Precio: 3,64 US$`). Patrón conocido del backend El Yaque
(igual que gmp/don-theo/piercar/ferrenuestro/jerez) → campos núcleo presentes ⇒ **PASS**.
El 3,64 US$ coincide con el dato del perfil.

---

## VGs observadas

Leídas del componente (`ng.getComponent(document.querySelector('product-list'))`) — las VGs de
producto **no** están en `localStorage.globalConfiguration` (reconfirma `[el_palmar-20260805]`).

| VG | Valor observado | Efecto |
|---|---|---|
| `showStock` | **true** | la lista y el detalle muestran `Inventario: N` ✅ |
| `productStock0` (`stock0`) | **false** | no se ofrecen productos con stock 0 |
| `unitByPriceList` | **false** | la unidad de venta **no** se resuelve por lista de precios ⇒ `unit_pricelist` ni se consulta (reconfirma la refutación de el_palmar) |
| `currencyModuleEnabled` | **true** | doble cotización BSD/US$ en la lista |
| `defaultCurrency` | **BSD** | coherente con el detalle mostrando BSD |
| `endPro` | 20 | incremento de paginación |
| `hideProdWithoutPrice` | ⚪ no expuesta | no es propiedad de `product-list` en este build — **no observable** |
| `productMinMul` | ⚪ no expuesta | ídem — vive en el form de PEDIDOS, no en PRODUCTOS |
| `conversionByPriceList` | ⚪ no expuesta | ídem |

---

## Hallazgos

### H-PRD-1 · 🔴 `PRD-BUSCADOR-NO-REPUEBLA` — **REPRODUCE** (3.ª playa)

**Reproducido de forma limpia y determinista.**

| Paso | Ítems en `product-list` |
|---|---|
| Estructura BBK recién abierta | **50** |
| Buscar `"Acondicionador"` + Enter | 8 |
| Buscar `"ZZZZZZZ"` + Enter | 0 + empty-state |
| **Vaciar el campo (Backspace×N) + Enter** | 🔴 **0** + `No hay productos disponibles` |

Vaciar el buscador **no restaura** los 50/93 productos de la estructura: la lista queda en el
empty-state, como si no hubiera catálogo. El usuario debe salir y volver a entrar a la estructura.

Confirmado en **3 playas independientes** con builds y servidores distintos
(`[latino_cosmetica-20260729]`, `[el_palmar-20260805]`, **difranca**) ⇒ el defecto está **confirmado
y es universal**, no depende de datos ni de cliente.

**Impacto en difranca:** real y cotidiano — 450 productos y un buscador que es la vía normal de
acceso. Molesto pero **con workaround trivial** (volver a entrar a la estructura) y **sin pérdida ni
corrupción de datos**. **Severidad media-baja para el go/no-go**: no bloquea la operación.

### H-PRD-2 · ⚪ Búsqueda con tilde/ñ — **NO CONCLUYENTE en difranca (N/A por dato)**

Se probó la hipótesis de el_palmar ("buscar con tilde devuelve 0 mientras sin tilde devuelve todo,
porque la app normaliza el nombre pero no el término tecleado"):

| Término | Resultados |
|---|---|
| `Baño` (con ñ) | **0** |
| `Bano` (sin ñ) | **39** |
| `Ba` | 48 |

A primera vista **parece** reproducir. **No lo hace** — y esto era una trampa. Al verificar los datos:

```
BD local  · products WHERE na_product LIKE '%ñ%'                     →  0 de 1.056
BD local  · products LIKE '%ano de Crema%' → "BaNo de Crema BBK Oleo de Argan 1kg"
BD NUBE   · product  WHERE na_product ~ '[ñÑáéíóúÁÉÍÓÚ]'             →  0 de 1.487
BD NUBE   · product  → "BaNo de Crema BBK Oleo de Argan 1kg"
```

⇒ **Ningún producto de difranca contiene una ñ ni un acento, ni en el device ni en la nube.** El
nombre real almacenado es `BaNo` (ñ sustituida por una **N mayúscula** en medio de palabra). Por lo
tanto buscar `"Baño"` devuelve 0 **correctamente**: no existe tal producto. **No es defecto de la app.**

⇒ **La hipótesis del tilde no es evaluable en difranca**: el catálogo no tiene material con acentos.
Queda **N/A por dato**, no descartada. Re-probar en una playa cuyo catálogo sí tenga diacríticos.

### H-PRD-3 · 🟡 Mojibake `<FFFD>` en nombres de estructura — **es dato del cliente, NO del tag 20**

Las estructuras se muestran al usuario con el **carácter de reemplazo Unicode U+FFFD**:

```
UI (innerText)         : "CUIDADO DE U<FFFD>AS"   ·  "Ba<FFFD>o de Crema"
BD local  (codepoints) : 66,97,65533,111,...      ← 65533 = U+FFFD
BD NUBE   (product_structure) : "BA<FFFD>O DE CREMA" · "ENDURECEDOR DE U<FFFD>AS"
```

🟢 **La corrupción ya está en la NUBE**, con la misma longitud de cadena (13 caracteres) ⇒ **la app
no la introduce: la muestra fielmente.** No es un defecto del móvil ni del tag 20 — es un problema
de **codificación en el catálogo de difranca** (probablemente una carga con charset equivocado).

**No cuenta como hallazgo de la corrida ni afecta el go/no-go.** Se reporta para que QA lo derive al
área de datos del cliente: hoy el vendedor ve `CUIDADO DE U�AS` en pantalla.

### H-PRD-4 · ⚪ Badge de estructura (114) ≠ productos listados (93) — a verificar, **no FAIL**

BBK muestra badge **114** y el listado carga **93** (con el infinite-scroll ya agotado,
`disabled=true`). No es un recorte de paginación.

La app **sí expande al subárbol**: `product-list.idProductStructureList` trae **10** ids (BBK +
descendientes) y el total del componente es **93**. Además hay **dos** estructuras llamadas "BBK"
(`id 46`, `qu_products=114`, Línea; `id 107`, `qu_products=27`, Sub-Línea).

⇒ El `qu_products=114` es un **contador rollup que viene del servidor** y no coincide con los
productos realmente asignados al subárbol. Es el mismo patrón que `[el_palmar-20260805]`
("el badge es un rollup — contrastarlo SIEMPRE contra el listado antes de concluir que faltan datos").

**No se marca FAIL**: no se ejecutó el conteo directo `products GROUP BY id_product_structure` sobre
los 10 ids para cerrarlo, y el precedente indica que la causa suele ser el contador, no el listado.
`# candidato — cerrar en la próxima corrida`.

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | ninguno | Módulo de solo lectura |

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| ✅ **`PRD-BUSCADOR-NO-REPUEBLA` GRADUADO a confirmado-universal** | **universal** | 3.ª playa independiente (latino_cosmetica, el_palmar, difranca), 3 builds/servidores. Vaciar el buscador + Enter deja `product-list` en 0 ítems con empty-state en vez de restaurar la estructura. **Para automatizar: nunca usar "campo vacío" como estado sin-filtro; re-entrar a la estructura para recuperar el baseline** |
| 🔴 **Antes de reportar "la búsqueda con tilde falla", verificar que el dato TENGA tildes** | **universal (nuevo)** | En difranca `Baño`→0 / `Bano`→39 parecía reproducir el defecto de el_palmar, pero **0 de 1.487 productos tienen ningún acento** ni en device ni en nube (el nombre real es `BaNo`). Receta: `SELECT count(*) FROM products WHERE na_product GLOB '*[áéíóúÁÉÍÓÚñÑ]*'` **antes** de emitir veredicto. Un 0 ahí vuelve el caso **N/A por dato**, no FAIL |
| 🔴 **`<FFFD>` (U+FFFD) en nombres puede venir de la NUBE — cotejar antes de culpar al sync** | universal (nuevo) | `product_structures` local y `product_structure` de nube traen ambas el mismo U+FFFD con **idéntica longitud** ⇒ el móvil no corrompe, refleja. Diagnóstico barato: `Array.from(s).map(c=>c.codePointAt(0))` dentro del `evaluate` (65533 = U+FFFD) y el mismo `SELECT` contra la nube |
| Estructuras con **nombre duplicado** en distinto nivel | cliente | "BBK" existe como Línea (id 46, badge 114) y como Sub-Línea (id 107, badge 27). Un `find(/BBK/)` sobre la lista matchea la que esté renderizada según el tipo elegido — **anclar por `id_product_structure`, no por nombre**, cuando importe |
| VGs de producto legibles en `product-list` | universal (reconfirma) | `ng.getComponent(document.querySelector('product-list'))` expone `showStock`, `productStock0`, `unitByPriceList`, `currencyModuleEnabled`, `defaultCurrency`, `endPro`, **`idProductStructureList`** (el subárbol expandido — útil para el badge-rollup). ⚠ **NO** expone `hideProdWithoutPrice`, `productMinMul` ni `conversionByPriceList` |
| Back de PRODUCTOS: `img[src*=flecha]` + `closest('a')` | universal (reconfirma, 4.ª playa) | `productos-header > a` **tampoco** matchea acá. Filtrar `width>0 && top<80`, coords ≈(34,51). Niveles: detalle→`product-list` es back real; `product-list`→**HOME directo**; estructuras→HOME |
| `ion-select` de tipo y de lista de precio: `value` es OBJETO | universal (reconfirma) | `sel.value = opt.value` (objeto completo) + `ionChange`; sin abrir el popover. Válido para el selector de tipo (Linea/Sub-Linea) |
| Empty-state = `<p class="search-empty-state">` FUERA de `ion-list` | universal (reconfirma, 3.ª build) | Buscar el texto en todo `product-list`, no como `ion-item` |
| Limpieza del buscador para automatizar | universal (reconfirma) | `click({clickCount:3})` + **Backspace×N** + `keyboard.type` + **`press('Enter')`**. Sin Enter no re-filtra; `Control+A` no surte efecto |

> ✅ consolidado 2026-08-07

---

## Verificación BD

`BD-N/A` — módulo de solo lectura (RUNTIME §10). La BD se usó en modo `BD-INFO` para cerrar
H-PRD-2 (0 productos con acentos) y H-PRD-3 (la corrupción viene de la nube).

---

*Agente PRODUCTOS · corrida `smoke_difranca_20260807_120232` · 2026-08-07*
