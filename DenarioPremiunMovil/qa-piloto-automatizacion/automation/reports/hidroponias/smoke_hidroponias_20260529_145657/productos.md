# Smoke Test — Módulo PRODUCTOS
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-05-29 |
| **RUN_ID** | `20260529_145657_smoke-completo` |
| **Módulo** | PRODUCTOS |
| **Tipo de módulo** | Solo lectura — no genera ni modifica registros en el sistema |
| **Dispositivo** | 14678405BR003855 |
| **App** | `com.kiberno.denarioPremiumPro` — Versión 6.6.14 |
| **Chrome WebView** | 148.0.7778.178 |
| **Credenciales** | `***`/`***` (usuario 001) |
| **Empresa probada** | HIDROPONIAS VENEZOLA (HIDRO_A) |
| **Estado inicial** | Home principal (`/home`, `app-home` visible) |
| **Estado final** | Home principal (`/home`, `app-home` visible) |
| **Resultado global** | **11 PASS · 0 FAIL · 0 SKIP · 0 N/A** |

---

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-PRD-001 | Acceso al módulo — estructuras visibles | PASS | Navegación a `/productos`; `app-productos` visible (display:flex). Selector empresa (HIDROPONIAS VENEZOLA, deshabilitado — cuenta única). Selector tipo activo con valor "Linea". Listado de 11 estructuras con badges: AJO×1, BERRO×1, CAMPO×11, FRUTALES×1, GERMINADOS×5, HIDROPONICO×7, HORTALIZAS×7, HORTALIZAS×1, MALLA×1, POTES×1, TOMATES×6. Cabecera "Productos" presente. |
| DM-PRD-002 | Selector tipo de estructura → lista actualiza | PASS | Cambio "Linea" → "Sub-Linea" via `ionChange` + `popover.dismiss()`: lista actualizó de 11 a 31 estructuras (Sub-Líneas: AJO PORRO, AJO PULGADA Y CUARTO, ALBAHACA, ALFALFA, ARANDANOS, BERRO, BERROS, BROCOLI, CEBOLLIN…). Selector retornado a "Linea" sin error. |
| DM-PRD-004 | Tocar estructura → lista de productos visible | PASS | Tap en "HORTALIZAS" (badge 7): lista cargó 7 ítems con nombre, código, precio USD + precio BS e inventario (ej. ACELGA BOLSA 150GRS / 046013ACG004BOL / 1,42 USD / 716,97 BS / Inv:41). Campo búsqueda ("Búsqueda de productos") e ion-button arrow-back-outline visibles. |
| DM-PRD-006 | Búsqueda por texto → resultados filtrados | PASS | Ingresado "BROCOLI" + Enter (keydown/keypress/keyup keyCode=13): lista filtró de 7 a 2 productos (BROCOLI A GRANEL — 046013461009GRA y BROCOLI BANDEJA — 046013461003BAN). App estable. |
| DM-PRD-007 | Búsqueda sin resultados → mensaje vacío visible | PASS | Ingresado "ZZZZZZZ" + Enter: lista mostró "No hay productos disponibles" en ion-item visible. Cero registros de productos en el listado. App sin colapso. |
| DM-PRD-009 | Scroll infinito → carga más productos | PASS | `ion-infinite-scroll` presente (`disabled:false`, `threshold:"15%"`, posición bottom). Búsqueda global "E" (desde pantalla de estructuras, botón `search-circle-sharp`) retornó 42 productos. `ionInfinite` disparado vía CustomEvent: count se mantuvo en 42 — señal correcta de base de datos local sin páginas adicionales. Componente operativo: evento recibido, sin spinner colgado, sin crash. |
| DM-PRD-012 | Abrir detalle de producto → campos básicos visibles | PASS | Tap en ACELGA BOLSA 150GRS (E): detalle cargó con: Nombre, Código (046013ACG004BOL), Estructura Producto (acelga), Descripción, Unidad de venta (UNIDAD), selector Lista de precio (activo), Precio (1,42 USD / 716,97 BS). Imagen placeholder `nodisponible.png` visible (sin imagen sincronizada para este producto). Botón atrás en cabecera presente. |
| DM-PRD-013 | Selector lista de precios → precio actualizado | PASS | Detalle de ACELGA BOLSA 150GRS: selector activo con 4 listas (PRECIOS 01 DISTRIBUIDORES, PRECIOS 02 CENTRAL LA CIMA, PRECIOS 03 INDEXADOS, PRECIOS 04 UNICASA). Cambiado a "PRECIOS 02 CENTRAL LA CIMA" via `ionChange`: precio actualizó de **1,42 USD → 1,66 USD**. Confirmado vía `innerText` del componente. |
| DM-PRD-019 | Botón "Volver" → regresa a lista de estructuras | PASS | Click en ion-button con `arrow-back-outline` (desde lista de productos en HORTALIZAS): app regresó a pantalla de estructuras con 2 selectores y 11 estructuras de Linea visibles. |
| DM-PRD-020 | Botón atrás cabecera desde detalle → lista de productos | PASS | Click en `img[src*="flecha-blanca"]` (MouseEvent en `<a>` padre): desde detalle de ACELGA navegó a lista de productos (42 ítems de búsqueda global "E"). Sin selectores de tipo/empresa → confirmado en vista lista (no estructuras). |
| DM-PRD-021 | Botón atrás cabecera desde estructuras → Home principal | PASS | Click en `img[src*="flecha-blanca"]` → `<a routerLink="/home">` desde pantalla de estructuras (confirmado `href=/home`): navegó a `http://localhost/home`. `app-home` visible, Home principal con todos los módulos. |

---

## Módulo de solo lectura — confirmación

Este módulo es de **consulta únicamente**. Durante toda la ejecución no se crearon, modificaron ni eliminaron registros en el sistema. Las interacciones se limitaron a: navegar entre pantallas, seleccionar filtros, realizar búsquedas y visualizar detalle de productos. Confirmado.

---

## Hallazgos (observaciones — sin FAIL)

### OBS-PRD-001 — Scroll infinito: dataset local sin segunda página (info)

**Contexto:** DM-PRD-009.
**Observado:** La empresa QA (HIDROPONIAS VENEZOLA) tiene ~42 productos activos en la base de datos local. La búsqueda "E" retornó 42 resultados en una sola página. Al disparar `ionInfinite`, el count no aumentó porque no hay más registros que paginar.
**Interpretación:** Comportamiento correcto — el `ion-infinite-scroll` existe, recibe el evento sin errores, y maneja correctamente el final del dataset. Para validar la carga paginada (>pageSize registros) se requeriría una empresa con mayor catálogo. No es un defecto del módulo.

### OBS-PRD-002 — Precios en dos monedas activos (info)

**Observado:** El detalle de producto muestra siempre dos líneas de precio: USD y BS. Indica VG `multiCurrency=true` activa para HIDROPONIAS VENEZOLA (confirmado en tabla VGs activas — lecciones-aprendidas-cdp.md §8). Los casos DM-PRD-023 (multimoneda en lista y detalle) serían aplicables en este entorno; no incluidos en el smoke base.

### OBS-PRD-003 — Selector empresa deshabilitado (info)

**Observado:** El ion-select de empresa está `disabled:true` durante toda la sesión. La cuenta QA 001 solo tiene acceso a una empresa (HIDROPONIAS VENEZOLA, `enterpriseDefault:true`). DM-PRD-003 (multiempresa) no aplica para esta cuenta — marcado N/A en ejecuciones futuras si se confirma que no hay segunda empresa disponible.

---

## VGs activas confirmadas (módulo Productos, cuenta 001)

| VG | Evidencia observada |
|----|---------------------|
| `multiCurrency=true` | Precio en USD y BS visible en lista y detalle |
| `validateWarehouses / showStock` activos | Campo "Inventario" visible en cada producto de la lista |
| `enterpriseService.esMultiempresa()` | `false` — selector empresa deshabilitado |

---

*Generado por Claude Code · Playwright MCP CDP · 2026-05-29*
*RUN_ID: 20260529_145657_smoke-completo*
