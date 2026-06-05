# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| **RUN_ID** | `20260603_093706_smoke-completo` |
| **Módulo** | PRODUCTOS |
| **Fecha** | 2026-06-03 |
| **Dispositivo** | 14678405BR003855 (Isla Coche) |
| **App** | `com.kiberno.denarioPremiumPro` |
| **Cliente** | `insumar` — INSUMAR DISTRIBUIDOR (`INSUM_A`) |
| **Estado inicial** | Home principal (`/home`, `app-home` visible) |
| **Estado final** | Home principal (`/home`, `app-home` visible) |
| **Resultado global** | **10 PASS · 0 FAIL · 0 SKIP · 1 N/A** |

---

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-PRD-001 | Acceso al módulo — estructuras visibles | ✅ PASS | `app-productos` visible en `/productos`. Selector empresa (INSUMAR DISTRIBUIDOR, deshabilitado). Selector tipo activo = **"Linea"**. 18 estructuras con badges: ALIMENTOS×158, BEBIDAS×113, CARAMELOS×68, CEREALES×24, CHICLES×44, CHOCOLATES×96, CHUPETAS×30, CONDIMENTOS×90, GALLETAS×163, GOMAS×38, INFUSIONES×5, LECHE CONDENSADA×11, MISCELANEOS×28, PASAPALOS×100, POSTRES Y GELATINAS×28, TABACO×10, TORTAS×1, TURRONES Y BOCADILLOS×6. |
| DM-PRD-002 | Selector tipo → lista actualiza | ✅ PASS | "Linea" (18 ítems) → **"Sub-Linea"** (42 ítems) vía assign `ionSelect.value` + `ionChange` + `popover.dismiss()`. Lista actualizó correctamente (BARQUILLA 2, BOTELLA 13, COBERTURA 1…). Tipo restaurado a Linea sin error. |
| DM-PRD-004 | Click estructura ALIMENTOS → lista productos | ✅ PASS | Tap en ALIMENTOS (badge 158): lista cargó **50 ítems** con nombre, Código, Precio Unidad USD + BS + Precio+IVA + Inventario (ej. TOMATES PELADOS MARY 24X400G / Cód 11293 / 1,85 US$ / 958,23 BS). Input búsqueda (`inputsSearch`) e ion-button `arrow-back-outline` visibles. |
| DM-PRD-006 | Búsqueda "TOMATES" + Enter → resultados filtrados | ✅ PASS | Input `input.search-input.inputsSearch` con texto "TOMATES" + `pg.keyboard.press('Enter')`: lista filtró de 50 a **1 producto** (TOMATES PELADOS MARY 24X400G). Filtrado reactivo a Enter (no a ionInput). |
| DM-PRD-007 | Búsqueda "ZZZZZZZ" + Enter → mensaje vacío | ✅ PASS | Ingresado "ZZZZZZZ" + Enter: lista mostró **"No hay productos disponibles"** en ion-item visible. itemCount=1 (solo el mensaje), cero registros de producto. App sin colapso. |
| DM-PRD-009 | Scroll infinito → más productos cargan | ✅ PASS | `ion-infinite-scroll` presente (`disabled:false`). Tras limpiar búsqueda (Backspace+Enter), se disparó `ionInfinite` vía CustomEvent: items 50 → 51. Sin spinner colgado. Componente operativo. |
| DM-PRD-012 | Click en producto → detalle con campos básicos | ✅ PASS | Tap en TOMATES PELADOS MARY 24X400G (Cód 11293): detalle cargó con **Nombre, Código (11293), Estructura Producto (NO APLICA), Precio Unidad - UNIDADES: 1,85 US$ / 958,23 BS, Precio + IVA: 2,15 US$ / 1.111,54 BS, Almacén (ALMACEN 01), Inventario: 0,00**. `flecha-blanca.png` visible en header. |
| DM-PRD-013 | Selector lista de precios → precio actualiza | 🚫 N/A | Detalle de TOMATES PELADOS muestra solo 1 ion-select (Almacén, disabled, 1 opción "ALMACEN 01"). **Sin selector "Lista de Precios"** para insumar — cuenta con una sola lista implícita. DM-PRD-013 no aplica para esta configuración. |
| DM-PRD-019 | Botón back `arrow-back-outline` desde lista productos | ✅ PASS | Click via `pg.mouse.click()` en `ion-button[arrow-back-outline]` (coords {26,95}): desde lista productos regresó a **pantalla de estructuras** (18 ítems, 2 selects estructura/empresa). |
| DM-PRD-020 | clickBack desde detalle → lista productos | ✅ PASS | Click via `pg.mouse.click()` en `img flecha-blanca` (coords ~{34, 33}): desde detalle de TOMATES PELADOS regresó a **lista de productos** (1 ítem de búsqueda activa "TOMATES", searchInput visible). |
| DM-PRD-021 | clickBack desde estructuras → Home principal | ✅ PASS | Click via `pg.mouse.click()` en `img flecha-blanca` desde pantalla de estructuras: navegó a `http://localhost/home`. `app-home` visible. Home con módulos Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes, Sincronizar, SALIR. |

---

## Módulo de solo lectura — confirmación

Este módulo es de **consulta únicamente**. Durante toda la ejecución no se crearon, modificaron ni eliminaron registros en el sistema. Las interacciones se limitaron a navegar entre pantallas, seleccionar filtros, realizar búsquedas y visualizar detalle de productos. Confirmado.

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Ninguno (módulo solo lectura) | — |

---

## Hallazgos (observaciones — sin FAIL)

### OBS-PRD-001 — Búsqueda requiere Enter (nuevo patrón insumar)

**Contexto:** DM-PRD-006 / DM-PRD-007.
**Observado:** El input de búsqueda (`input.search-input.inputsSearch`) no filtra en tiempo real con `ionInput`/`ionChange`. La lista actualiza **solo al presionar Enter** (`pg.keyboard.press('Enter')`). Disparar eventos programáticos (`setter` + `input`/`change`/`ionInput`/`ionChange`) no es suficiente.
**Señal:** Llenando con keyboard + Enter → filtra. Llenando con fillIonInput → no filtra.
**Patrón nuevo:** `productos_busqueda_requiere_enter: true`
**Impacto:** El helper `h.fillIonInput()` NO funciona para este módulo. Usar `pg.mouse.click(rect) + pg.keyboard.type() + pg.keyboard.press('Enter')`.

### OBS-PRD-002 — Back en módulo Productos requiere pg.mouse.click con coords reales

**Contexto:** DM-PRD-019, DM-PRD-020, DM-PRD-021.
**Observado:** `dispatchEvent(MouseEvent, bubbles:true)` en `img.flecha-blanca` o su `<a>` padre NO navega (Angular router no se activa). Usar `pg.mouse.click(getBoundingClientRect coords)` en cambio sí dispara la navegación correctamente.
**Patrón nuevo:** `productos_back_requiere_mouse_click_coords: true` (igual que `visitas_back_requiere_mouse_click_coords` ya en lecciones).
**Nota:** Para el back desde la lista de productos (→ estructuras) el botón es `ion-button[arrow-back-outline]`; para back desde detalle (→ lista) y desde estructuras (→ home) el botón es `img[src*="flecha-blanca"]` dentro de `<a>`.

### OBS-PRD-003 — Selector Lista de Precios ausente en insumar

**Observado:** El detalle de producto de insumar muestra solo `ion-select` de Almacén (disabled, 1 opción "ALMACEN 01"). No hay selector de Lista de Precios ni precios múltiples cambiables. Diferente de hiroponias (4 listas de precios).
**Interpretación:** insumar tiene una sola lista de precios implícita. DM-PRD-013 es N/A estructural para esta cuenta.

### OBS-PRD-004 — Producto sin precio en lista (insumar)

**Observado:** Algunos productos en la lista muestran "Precio + IVA: 0,00 B" (ej. PEPITONA EN SALSA PICANTE 24*140 EL NORTENO, Cód 12033015). El detalle de estos productos no muestra precio USD ni BS. Estos productos existen en catálogo pero sin lista de precios asignada.
**Interpretación:** Comportamiento esperado — no es un FAIL del módulo sino datos incompletos del catálogo.

### OBS-PRD-005 — Estructura Producto "NO APLICA" en detalle

**Observado:** Varios productos muestran "Estructura Producto: NO APLICA" en el detalle. Esto ocurre para productos de la Linea ALIMENTOS que no tienen sub-estructura asignada en la BD local. No afecta la visualización de precio ni código.

### OBS-PRD-006 — multiCurrency confirmado en Productos

**Observado:** Lista y detalle muestran precios duales USD + BS (ej. 1,85 US$ / 958,23 BS + IVA). VG `multiCurrency=true` activa para insumar, confirmada también en módulo Productos. Además el campo "Precio + IVA" (extra a USD/BS base) es visible en lista e insumar — no presente en hidroponias en corrida anterior.

---

## Datos descubiertos para YAML (insumar)

```yaml
modules:
  productos:
    tipo_estructura_default: "Linea"           # Confirmado 20260603: selector tipo con valor {naTypeProductStructure:"Linea"}
    texto_busqueda: "TOMATES"                  # Confirmado 20260603: filtra en ALIMENTOS — 1 resultado (TOMATES PELADOS MARY 24X400G, Cód 11293)
    estructura_test: "ALIMENTOS"               # Linea con badge 158 — mayor catálogo disponible
    estructura_lineas_count: 18                # 18 estructuras tipo Linea
    estructura_sublineas_count: 42             # 42 estructuras tipo Sub-Linea
    busqueda_requiere_enter: true              # Nuevo patrón — fillIonInput no filtra; requiere keyboard+Enter
    back_requiere_mouse_click_coords: true     # Mismo patrón que visitas
    lista_precios_selector: false              # Sin selector de lista de precios en detalle (1 sola lista)
    precio_iva_visible: true                   # Campo "Precio + IVA" visible en lista y detalle (no presente en hidroponias)
```

---

## Nuevos patrones para lecciones-DELTA.md

```yaml
- "productos_busqueda_requiere_enter: true  # input.search-input no filtra con ionInput; requiere pg.keyboard.press('Enter') tras escribir"
- "productos_back_requiere_mouse_click_coords: true  # dispatchEvent en <a>+flecha-blanca no navega; usar pg.mouse.click(getBoundingClientRect)"
- "productos_lista_precios_na_insumar: true  # detalle producto insumar sin selector lista-de-precios; DM-PRD-013 N/A estructural"
- "productos_precio_iva_en_lista_insumar: true  # lista de productos muestra Precio+IVA además de Precio Unidad; campo no observado en hidroponias"
```

---

*Generado por Claude Code · Playwright MCP CDP · 2026-06-03*
*RUN_ID: 20260603_093706_smoke-completo · Cliente: insumar*
