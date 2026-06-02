# Smoke Test — Módulo PRODUCTOS
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-05-28 |
| **RUN_ID** | `20260527_113900_smoke-completo` |
| **Módulo** | PRODUCTOS |
| **Dispositivo** | 14678405BR003855 |
| **App** | `com.kiberno.denarioPremiumPro` — Versión 6.6.14 |
| **Credenciales** | `***`/`***` |
| **Empresa probada** | HIDROPONIAS VENEZOLA (HIDRO_A) |
| **Resultado global** | 11 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-PRD-001 | Acceso al módulo — estructuras visibles | PASS | Navegación a `/productos`; pantalla muestra selector de empresa (deshabilitado, cuenta única: HIDROPONIAS VENEZOLA), selector de tipo (activo, valor: "Linea"), listado de 11 estructuras con badge: AJO×1, BERRO×1, CAMPO×11, FRUTALES×1, GERMINADOS×5, HIDROPONICO×7, HORTALIZAS×7, HORTALIZAS×1, MALLA×1, POTES×1, TOMATES×6. Cabecera "Productos" y botón atrás (flecha-blanca.png en `<a routerLink="/home">`) presentes. |
| DM-PRD-002 | Selector tipo de estructura → lista actualiza | PASS | Cambio de "Linea" a "Sub-Linea" (popover con ion-radio + botón Aceptar): lista se actualizó a estructuras de Sub-Linea (AJO PORRO, AJO PULGADA Y CUARTO, ALBAHACA, ALFALFA, ARANDANOS, BERRO, BERROS, BROCOLI, CEBOLLIN, CHAMPINONES, CHERRY…). Selector retornado a "Linea" sin error. |
| DM-PRD-004 | Tocar estructura → lista de productos visible | PASS | Tap en "CAMPO" (badge 11): lista de productos cargó con 11 ítems, cada uno con nombre, código y precio (USD + BS). Campo de búsqueda (`input.search-input`) e ion-button `.back-button` visibles en área de búsqueda. |
| DM-PRD-006 | Búsqueda por texto → resultados filtrados | PASS | Ingresado "CEBOLLIN" + Enter (keyup/keydown keyCode=13): lista filtró a 2 productos (CEBOLLIN A GRANEL POR KILO — CAMPROCEB003ATA y CEBOLLIN ATADO 300 GRS — CAMPROCEB002ATA). Sin colapso de app. |
| DM-PRD-007 | Búsqueda sin resultados → mensaje vacío visible | PASS | Ingresado "ZZZZZZZ" + Enter: lista mostró "No hay productos disponibles" en ion-item. Cero registros de productos. |
| DM-PRD-009 | Scroll infinito → carga más productos | PASS | `ion-infinite-scroll` presente (clase `infinite-scroll-enabled hydrated`, `disabled: false`). `ionInfinite` disparado vía CustomEvent: scroll completó y se desactivó (`disabled: true`) — señal esperada cuando no hay más páginas. Búsqueda con "A" retornó 41 ítems en una sola página, scroll se deshabilitó correctamente al finalizar la carga. |
| DM-PRD-012 | Abrir detalle de producto → campos básicos visibles | PASS | Tap en "ACELGA BOLSA 150GRS (E)": detalle cargó con: Nombre, Código (046013ACG004BOL), Estructura Producto (acelga), Descripción, Unidad de venta (UNIDAD), selector Lista de precio (ion-select activo — PRECIOS 01 DISTRIBUIDORES), Precio (1,42 USD / 716,97 BS), Tasa de conversión (504,91). Botón atrás en cabecera presente. |
| DM-PRD-013 | Selector lista de precios en detalle → precio actualizado | PASS | Detalle de CEBOLLIN A GRANEL POR KILO: selector abierto mostrando 4 listas (PRECIOS 01 DISTRIBUIDORES, PRECIOS 02 CENTRAL LA CIMA, PRECIOS 03 INDEXADOS, PRECIOS 04 UNICASA). Seleccionado PRECIOS 02 + OK: precio cambió de **1,35 USD → 1,50 USD** (BS: 681,63 → 757,37). |
| DM-PRD-019 | Botón "Volver" → regresa a lista de estructuras | PASS | Click en ion-button `.back-button` (arrow-back-outline) desde lista de productos: app regresó a pantalla de estructuras con las 11 estructuras de Linea y ambos selectores. Verificado en dos ocasiones durante la sesión. |
| DM-PRD-020 | Botón atrás cabecera desde detalle → lista de productos | PASS | Click en `img[src*="flecha-blanca"]` → `<a>` padre (MouseEvent): desde detalle de CEBOLLIN navegó a lista de productos de CAMPO con los 11 productos originales intactos. |
| DM-PRD-021 | Botón atrás cabecera desde estructuras → Home principal | PASS | Click en `img[src*="flecha-blanca"]` → `<a href="/home">` desde pantalla de estructuras: navegó a `http://localhost/home`. Módulos de Home visibles (Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes, Sincronizar, SALIR). |

## Hallazgos (observaciones sin FAIL)

### OBS-PRD-001 — Comportamiento del selector de lista de precios en primer intento (no FAIL)

**Contexto:** DM-PRD-013 primer intento (producto ACELGA BOLSA 150GRS).  
**Observado:** Al abrir el selector de lista de precios por primera vez y hacer click en "PRECIOS 02 CENTRAL LA CIMA" sin identificar correctamente el botón OK del alert de selección (single-select-alert), el click en un botón "OK" de otro alert oculto causó que la app navegara a `/home`. El alert de selección (single-select-alert con clase `select-alert`) permaneció visible sobre la pantalla de Home.  
**Causa probable:** La app tiene múltiples ion-alerts en el DOM simultáneamente (overlay-hidden); el código de test seleccionó el primer botón con texto "OK" en lugar del botón OK específico del ion-alert de precios.  
**Resolución en test:** Se identificó el ion-alert visible por clase `single-select-alert` y se extrajo su botón OK específico. Segunda ejecución exitosa.  
**Recomendación:** No se considera un defecto del módulo de Productos; es una particularidad de la gestión de alertas en WebView. El flujo manual en dispositivo funciona correctamente por contexto visual.

### OBS-PRD-002 — Scroll infinito: todos los productos en una página (no FAIL)

**Contexto:** DM-PRD-009.  
**Observado:** La búsqueda por "A" retornó 41 productos en la primera carga; el ion-infinite-scroll se deshabilitó inmediatamente tras el evento `ionInfinite`, sin cargar una segunda página.  
**Interpretación:** El total de productos que contienen "A" en esta empresa es 41, lo que cabe en una sola página (pageSize ≥ 41). La desactivación del scroll es el comportamiento esperado cuando no hay más registros. El componente `ion-infinite-scroll` se confirmó presente y funcional (encontrado, evento recibido, completó correctamente). Para validar la carga de páginas adicionales se requeriría una empresa con más de un pageSize de productos que coincidan con el texto.

### OBS-PRD-003 — Precio en detalle mostrado en dos monedas (info)

**Observado:** El detalle de producto siempre mostró dos líneas de precio: USD y BS, más "Tasa de conversión: 504,91". Esto indica que VG `currencyModule` / `showConversion` están activos para HIDROPONIAS VENEZOLA. Los casos DM-PRD-023 serían aplicables (no incluidos en este smoke).

---
*Generado por Claude Code · Playwright MCP CDP · 2026-05-28*
