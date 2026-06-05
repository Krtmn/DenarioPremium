# Smoke Test — Módulo PRODUCTOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260604_122859_smoke-completo` |
| Módulo | PRODUCTOS |
| Dispositivo | CDP `http://127.0.0.1:9220` |
| App | `com.kiberno.denarioPremiumPro` — Denario Premium Movil |
| Cliente | romher |
| Resultado | **7 PASS · 2 FAIL · 0 SKIP · 1 N/A** |
| Fecha ejecución | 2026-06-04 |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | `app-productos` visible · tipo selector LINEA · 11 estructuras (proveedores) listadas |
| DM-PRD-002 | 🚫 N/A | Solo un tipo de estructura disponible (LINEA) — popover abre con una única opción; no hay otro tipo al que cambiar |
| DM-PRD-004 | ✅ PASS | Click en COLGATE → 50 productos con Código y Precio (USD + IVA) visible |
| DM-PRD-006 | ✅ PASS | `focus + keyboard.type('CDC') + Enter` → lista filtrada de 174 → 27 resultados; todos contienen "CDC" |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ" → mensaje "No hay productos disponibles" · lista vacía |
| DM-PRD-009 | ✅ PASS | `ionInfinite` disparado → ítems pasaron de estado vacío a 51 cargados · spinner oculto (no quedó infinito) |
| DM-PRD-012 | ✅ PASS | Detalle muestra: Nombre · Código · Estructura Producto · Unidad de venta · Precio USD · IVA · Inventario |
| DM-PRD-013 | ❌ FAIL | Select cambia a "Lista P. Maestra." (idList:88 confirmado en `.value`) pero precio NO se actualiza en pantalla — probado en 3 productos distintos (CEP COLGATE 107122 · SUAVITEL 100985 · ZIPLOC 100102) |
| DM-PRD-019 | ❌ FAIL | `flecha-blanca.png` (arrow-back en header) desde detalle va a **lista de productos** (no a lista de estructuras como se espera) |
| DM-PRD-020 | ✅ PASS | `flecha-blanca.png` desde detalle → lista de productos del proveedor activo (50 ítems visibles con Código) |
| DM-PRD-021 | ✅ PASS | `clickBack` (`img.fechaAtras` con `href="/home"`) desde lista de productos → HOME (`app-home` visible · url `/home`) |

---

## Registros creados en sistema

*(Módulo de solo lectura — ningún registro creado)*

---

## Hallazgos

### FAIL 1 — DM-PRD-013: Precio no se actualiza al cambiar lista de precios

- **Selector afectado:** `ion-select` con `interface="alert"` en `app-productos` detalle de producto
- **Comportamiento observado:** Al seleccionar "Lista P. Maestra." (idList:88 · coList:"00") en el alert-radio y confirmar con OK, el valor del componente `.value` cambia correctamente (verificado via `ion-select.value` en DOM), pero el campo "Precio" en pantalla permanece con el valor de la lista original ("Abasto y Bodegas Col", idList:112).
- **Reproducción:** HOME → Productos → cualquier proveedor → cualquier producto → selector "Lista de precio" → cambiar a "Lista P. Maestra." → OK → Precio no cambia.
- **Impacto:** El vendedor no puede consultar precios de otra lista desde la app.
- **Defecto nuevo:** Sí (no estaba en `defectos_abiertos` de romher.yaml ni en RUNTIME.md §5).

### FAIL 2 — DM-PRD-019: Botón atrás (flecha-blanca) desde detalle navega a lista de productos en vez de estructuras

- **Comportamiento observado:** Desde el detalle de producto, `flecha-blanca.png` (parent `<A>`) retrocede a la lista de productos del proveedor activo, no a la lista de estructuras (proveedores).
- **Estructura de navegación real confirmada:**
  ```
  HOME → Estructuras (proveedores) → Lista productos → Detalle producto
                                             ↑                  |
                                   flecha-blanca (back)  ←──────┘   (DM-PRD-020 ✅)
           HOME ←─── img.fechaAtras.href="/home" ───── Lista productos  (DM-PRD-021 ✅)
  ```
- **Consecuencia:** No existe botón que regrese directamente a la lista de estructuras desde el detalle; el usuario debe hacer dos clics para llegar a estructuras (detalle → lista productos → HOME → Productos).
- **Nota técnica:** La estructura de navegación de `app-productos` usa un único componente con estados internos (no router outlet separado para estructuras vs. lista), por lo que la URL no cambia (`/productos` en todos los estados). La pila de navegación "atrás" no incluye el estado de estructuras al llegar desde producto.

---

## Datos descubiertos

| Dato | Valor |
|------|-------|
| `tipo_estructura_default` | **LINEA** (`naTypeProductStructure:"LINEA"` · `coTypeProductStructure:"1"` · `nuLevel:1`) |
| `texto_busqueda` | **CDC** (27 resultados en proveedor COLGATE; ej. "CDC TRIPLE ACCION 100ML" · "CDC MENTA MPA 90G") |
| Estructura de listas de precio | 2 listas: "Abasto y Bodegas Col" (idList:112 · coList:"24") y "Lista P. Maestra." (idList:88 · coList:"00") |
| Interface del selector de lista | `ion-alert` (radio buttons), no `ion-popover` |
| Navegación back desde detalle | `flecha-blanca.png` en `<A>` sin href (en detalle) → lista productos · `flecha-blanca.png.fechaAtras` en `<A href="/home">` (en lista) → HOME |
| Patrón búsqueda productos | `focus(input.search-input)` + `keyboard.type(texto)` + `keyboard.press('Enter')` — sin necesidad de `fillIonInput` |
| Patrón selector precio (detalle) | Abrir con `sel.shadowRoot.querySelector('button').click()` → ion-alert → `mouse.click` en radio + OK |

---

## Patrones nuevos (candidatos para lecciones-DELTA.md)

| ID tentativo | Patrón |
|--------------|--------|
| P-ROM-PRD-001 | `productos_busqueda_input_class_search_input` — input es `input.search-input.inputsSearch` (no ion-searchbar); usar `pg.focus()` + `pg.keyboard.type()` + `Enter` |
| P-ROM-PRD-002 | `productos_precio_select_interface_alert` — selector lista de precios usa `interface="alert"` (radio buttons + OK/Cancel), no popover; abrir con `shadowRoot.querySelector('button').click()` |
| P-ROM-PRD-003 | `productos_nav_detalle_a_lista_flecha_blanca` — back desde detalle = `img[src*="flecha-blanca"]` en `<A>` sin href → lista productos (no estructuras); `img.fechaAtras` en detalle es el icono del módulo (no navega) |
| P-ROM-PRD-004 | `productos_nav_lista_a_home_href` — back desde lista de productos = `img.fechaAtras` en `<A href="/home">` → HOME directo (sin pasar por estructuras) |
| P-ROM-PRD-005 | `productos_tipo_estructura_selector_disabled` — selector enterprise (`select-disabled`) + selector tipo activo; en romher solo un tipo (LINEA), por lo que DM-PRD-002 es N/A |
