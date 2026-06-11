# Guion de regresión — Denario Premium móvil (Android)

## Módulo: Productos

---

### Alcance y exclusiones

Este guion cubre el módulo de consulta de productos de Denario Premium móvil en **Android**: pantalla de estructuras de producto (con selectores de empresa y tipo), listado de productos (vía estructura o búsqueda), búsqueda por texto, detalle de producto y navegación interna.

Constituye un **catálogo completo** de flujos observables en UI. En una corrida real se estima ejecutar ~**70 %**; el resto quedará **N/A por configuración**, no FAIL.

**Criterio de aplicabilidad:**
- **`Aplicación: Siempre`** — ejecutable con cualquier cuenta QA estándar.
- **`Aplicación: Condicional (VG: <clave>)`** — solo cuando esa configuración está activa para la empresa probada; si no aplica, marcar **N/A**.

**Incluye:** acceso al módulo, selectores de empresa y tipo de estructura, listado de estructuras con badge de cantidad, lista de productos (por estructura y por búsqueda global), búsqueda con texto, estado "sin resultados", scroll infinito, detalle con selector de lista de precios, selector de almacén, campos opcionales controlados por VG (stock, imágenes, IVA, puntos, mínimos/múltiplos, conversión de moneda, precios por unidad/lista).

**Excluye:** análisis de precios o stock desde backend; escenarios que requieran cortar la red; manipulación de localStorage o ADB; módulos que reutilizan la lista de productos de forma embebida (`productos-tab` — usado en pedidos, devoluciones e inventarios, se cubre en sus propios guiones).

---

### Mapa rápido (inferido desde código / XML)

| Elemento | Detalle |
|---|---|
| Ruta Angular | `productos` |
| Componente raíz | `src/app/productos/productos.component.ts` — orquesta las 4 vistas mediante flags booleanos |
| Cabecera | `src/app/productos/productos-header/productos-header.component.ts/html` — botón atrás contextual |
| Buscador | `src/app/productos/productos-search/productos-search.component.ts/html` — buscar, limpiar, botón Volver |
| Estructuras | `src/app/productos/product-structures-list/product-structures-list.component.ts/html` — selectores empresa + tipo, lista de estructuras |
| Lista de productos | `src/app/productos/product-list/product-list.component.ts/html` — scroll infinito, imagen, precios, stock, IVA, puntos, mín/múlt |
| Detalle | `src/app/productos/product-detail/product-detail.component.ts/html` — carousel imágenes, selectores de lista/almacén, todos los campos |
| Servicio productos | `src/app/services/products/product.service.ts` |
| Servicio pedidos (config VG) | `src/app/pedidos/pedidos.service.ts` — centraliza la mayoría de VG del módulo |
| Servicio imágenes | `src/app/services/imageServices/image-services.service.ts` |

**Flujo del módulo (pantallas en orden):**

1. **Pantalla de estructuras** (inicial): selector empresa + selector tipo de estructura → listado de estructuras con nombre y badge de cantidad de productos → toque en estructura abre listado de esa estructura.
2. **Búsqueda global** (desde pantalla inicial, sin seleccionar estructura): campo de texto + botón lupa → abre la lista de productos con resultados de toda la empresa.
3. **Lista de productos**: campo de texto con botón limpiar (X) y botón "Volver" → toque en producto abre detalle.
4. **Detalle de producto**: imagen (carousel), campos informativos, selectores de lista de precios y almacén (condicionales por VG).

**Navegación:**

| Desde | Acción | Destino |
|---|---|---|
| Estructuras | Cabecera ← | Home principal |
| Estructuras | Tocar estructura | Lista de productos |
| Lista productos | Botón "Volver" (en búsqueda) | Estructuras |
| Lista productos | Cabecera ← | Home principal |
| Detalle | Cabecera ← | Lista de productos |

**Variables globales (VG) relevantes:**

| Clave | Efecto observable en UI |
|---|---|
| `enterpriseService.esMultiempresa()` | Habilita selector empresa en pantalla de estructuras |
| `globalConfig.get("showProductImages")` | Muestra imagen de producto en lista y carousel en detalle |
| `globalConfig.get("validateWarehouses")` + `globalConfig.get("showStock")` | Muestra stock en lista y detalle; habilita selector de almacén |
| `globalConfig.get("hideProductWarehouse")` | Oculta selector de almacén y stock aunque validateWarehouses=true |
| `globalConfig.get("vatExemptProducts")` | Muestra % de IVA en lista y detalle |
| `globalConfig.get("displayProductPoints")` | Muestra puntos en lista y detalle |
| `globalConfig.get("productMinMul")` | Muestra cantidad mínima y/o múltiplo en lista y detalle |
| `globalConfig.get("unitByPriceList")` | Muestra precios desglosados por lista/unidad en lugar de precio único |
| `globalConfig.get("currencyModule")` + `currencyModule.showConversion` | Muestra precio en segunda moneda en lista y detalle |
| `globalConfig.get("multiCurrency")` | Muestra fila de precio en moneda dura en detalle |

---

### Casos de prueba

| ID | Escenario | Precondiciones | Pasos | Datos / ejemplo | Resultado esperado | Fallo observable (PASS/FAIL) | Severidad | Soporte en código |
|---|---|---|---|---|---|---|---|---|
| DM-PRD-001 | Acceso al módulo productos desde Home → pantalla de estructuras cargada | Sesión iniciada. App en Home. Productos sincronizados. **Aplicación: Siempre** | 1. Desde Home, pulsar el botón o icono del módulo Productos. 2. Observar la pantalla cargada. | N/A | Overlay de carga aparece y desaparece. Pantalla muestra: selector de empresa (visible aunque pueda estar deshabilitado), selector de tipo de estructura y listado de estructuras con nombre y badge de cantidad de productos. Cabecera con título del módulo. | FAIL: Pantalla en blanco; overlay no desaparece; selectores vacíos; lista de estructuras ausente. | S1 — impide acceder al módulo | `src/app/productos/productos.component.ts:61-78`, `src/app/productos/product-structures-list/product-structures-list.component.ts:42-63` |
| DM-PRD-002 | Selector de tipo de estructura → cambio actualiza la lista de estructuras | Pantalla de estructuras activa con al menos 2 tipos de estructura disponibles. **Aplicación: Siempre** | 1. Abrir el selector de tipo de estructura. 2. Elegir un tipo diferente al seleccionado actualmente. 3. Observar la lista de estructuras. | Empresa con al menos 2 tipos de estructura sincronizados | La lista de estructuras se actualiza mostrando únicamente las estructuras que pertenecen al tipo elegido. El badge de cada estructura muestra la cantidad de productos correspondiente. | FAIL: La lista no cambia al elegir un tipo diferente; la app colapsa; el selector no muestra las opciones. | S2 | `src/app/productos/product-structures-list/product-structures-list.component.ts:74-108` (`onTypeProductStructureChanged`) |
| DM-PRD-003 | Selector de empresa habilitado (cuenta multiempresa) → cambio actualiza estructuras | Sesión con cuenta que accede a múltiples empresas. Pantalla de estructuras activa. **Aplicación: Condicional (VG: `enterpriseService.esMultiempresa() = true`)** | 1. Verificar que el selector de empresa está habilitado (no deshabilitado). 2. Tocar el selector y elegir una empresa diferente. 3. Observar el listado de estructuras y el selector de tipos. | Cuenta QA con acceso a al menos 2 empresas | El selector de empresa está operable. Al cambiar la empresa, el selector de tipos se reinicia y la lista de estructuras se actualiza con las estructuras de la empresa elegida. | FAIL: Selector deshabilitado cuando debe estar activo; cambio de empresa no actualiza estructuras; app colapsa. | S2 | `src/app/productos/product-structures-list/product-structures-list.component.ts:65-72` (`onEnterpriseChanged`) |
| DM-PRD-004 | Tocar una estructura → abre lista de productos de esa estructura | Pantalla de estructuras con al menos una estructura visible. **Aplicación: Siempre** | 1. Tocar cualquier estructura del listado (con badge > 0). 2. Observar la pantalla cargada. | N/A | App muestra la lista de productos de esa estructura. Cada producto muestra al menos nombre y código. El campo de búsqueda y el botón "Volver" son visibles en la parte superior. | FAIL: Pantalla en blanco; app permanece en estructuras; lista de productos vacía sin mensaje; app colapsa. | S1 — impide ver los productos | `src/app/productos/product-structures-list/product-structures-list.component.ts:79-88` (`onProductStructureSelected`), `src/app/productos/productos.component.ts:91-98` |
| DM-PRD-005 | Estructura con 0 productos → mensaje "sin resultados" visible | Pantalla de estructuras con al menos una estructura que tenga badge = 0. **Aplicación: Siempre** | 1. Tocar una estructura cuyo badge muestre 0 productos. 2. Observar la pantalla de lista. | Estructura con 0 productos sincronizados | La app muestra la lista de productos con un mensaje de "sin resultados" (texto del tag `DENARIO_SIN_RESULTADOS`) en color rojo. No hay registros de productos en la lista. | FAIL: Pantalla en blanco sin mensaje; la app colapsa; se muestran productos de otra estructura. | S3 | `src/app/productos/product-list/product-list.component.html:2-8` (`noProductsAlertShown`) |
| DM-PRD-006 | Búsqueda de texto dentro de una estructura → actualiza lista de productos | Lista de productos de una estructura activa. **Aplicación: Siempre** | 1. Ingresar texto parcial del nombre o código de un producto en el campo de búsqueda. 2. Presionar Enter en el teclado. 3. Observar el resultado. | Texto de búsqueda: nombre parcial de producto existente en la empresa | Overlay de carga breve. La lista se actualiza mostrando los productos que coinciden con el texto en toda la empresa (no solo en la estructura, ver supuestos). | FAIL: La lista no cambia; overlay no desaparece; app colapsa al presionar Enter. | S2 | `src/app/productos/productos-search/productos-search.component.ts:39-55` (`onSearchClicked`), `src/app/productos/product-list/product-list.component.ts:157-176` (suscripción `productoSearch`) |
| DM-PRD-007 | Búsqueda de texto sin coincidencias → mensaje "sin resultados" visible | Lista de productos activa (dentro de estructura o búsqueda global). **Aplicación: Siempre** | 1. Ingresar en el campo de búsqueda un texto que no coincida con ningún producto (ej. `"ZZZZZZZ"`). 2. Presionar Enter. | Texto de búsqueda: `"ZZZZZZZ"` | Overlay de carga breve. La lista muestra el mensaje de "sin resultados" en color rojo, sin registros de productos. | FAIL: La lista queda en blanco sin mensaje; se muestran resultados irrelevantes; app colapsa. | S3 | `src/app/productos/product-list/product-list.component.html:2-8`, `product-list.component.ts:118-121` |
| DM-PRD-008 | Limpiar búsqueda con botón X → recarga la lista completa de la estructura | Lista de productos con resultados de búsqueda activa. Botón X visible. **Aplicación: Siempre** | 1. Con resultados de búsqueda visibles y texto en el campo, pulsar el botón X (limpiar). 2. Observar el resultado. | N/A | El campo de búsqueda se vacía y la lista vuelve a mostrar todos los productos de la estructura seleccionada originalmente, sin filtro. | FAIL: El campo no se vacía; la lista permanece filtrada; app colapsa al pulsar X. | S3 | `src/app/productos/productos-search/productos-search.component.ts:66-69` (`clearSearch`) |
| DM-PRD-009 | Scroll al final de la lista de productos → carga la siguiente página | Lista de productos con más registros de los que caben en pantalla. **Aplicación: Siempre** | 1. Desplazarse hacia abajo en la lista de productos hasta llegar al final del contenido visible. 2. Observar si aparece el spinner de carga y se agregan más registros. | Empresa con más de 20 productos en una estructura o búsqueda | Al llegar al final, aparece un spinner de carga y se agregan nuevos productos a la lista sin recargar la pantalla completa. Cuando no hay más productos, el scroll infinito queda deshabilitado. | FAIL: No se cargan más productos; la app colapsa; el spinner queda girando indefinidamente. | S2 | `src/app/productos/product-list/product-list.component.ts:183-211` (`onIonInfinite`) |
| DM-PRD-010 | Búsqueda global desde la pantalla de estructuras (sin seleccionar estructura) → lista de resultados | Pantalla de estructuras activa. Ninguna estructura seleccionada. **Aplicación: Siempre** | 1. Ingresar texto en el campo de búsqueda de la pantalla inicial. 2. Pulsar el botón de búsqueda (lupa) o presionar Enter. 3. Observar la pantalla. | Texto de búsqueda: nombre parcial de un producto existente | App transiciona a la lista de productos mostrando los resultados que coinciden con el texto en toda la empresa. El botón "Volver" aparece en la barra de búsqueda para regresar a las estructuras. | FAIL: La app permanece en la pantalla de estructuras; la lista de resultados está vacía sin ser texto sin resultados; app colapsa. | S2 | `src/app/productos/productos.component.ts:128-135` (`setSearchText`), `src/app/productos/product-list/product-list.component.ts:107-122` |
| DM-PRD-011 | Búsqueda global sin coincidencias desde pantalla de estructuras → mensaje "sin resultados" | Pantalla de estructuras activa. **Aplicación: Siempre** | 1. Ingresar un texto sin coincidencias (ej. `"ZZZZZZZ"`) en el campo de búsqueda de la pantalla de estructuras. 2. Pulsar lupa o Enter. | Texto: `"ZZZZZZZ"` | La app muestra la lista de productos con el mensaje de "sin resultados" en color rojo. | FAIL: Pantalla en blanco sin mensaje; se muestran resultados irrelevantes; app colapsa. | S3 | `src/app/productos/product-list/product-list.component.ts:116-121` |
| DM-PRD-012 | Abrir detalle de un producto → campos básicos visibles | Lista de productos con al menos un registro. **Aplicación: Siempre** | 1. Desde la lista de productos, tocar cualquier producto. 2. Observar la pantalla de detalle. | Cualquier producto de la lista | Se muestra el detalle del producto con campos visibles: nombre, código, estructura/categoría, descripción, unidad y precio (con la lista de precios cargada). La cabecera muestra el botón atrás. | FAIL: Pantalla en blanco; campos vacíos o nulos; app colapsa al tocar el producto; overlay de carga no desaparece. | S1 | `src/app/productos/product-detail/product-detail.component.html:45-157`, `product-detail.component.ts:64-94` |
| DM-PRD-013 | Selector de lista de precios en detalle → cambio actualiza el precio mostrado | Detalle de producto abierto. Producto con más de una lista de precios asignada. Modo `unitByPriceList = false`. **Aplicación: Siempre** (el selector está deshabilitado si el producto solo tiene 1 lista) | 1. En el detalle del producto, verificar que el selector de lista de precios es operable (no deshabilitado). 2. Tocar el selector y elegir una lista diferente. 3. Observar el precio mostrado. | Producto con 2 o más listas de precios | El precio en el campo "Precio" se actualiza con el valor correspondiente a la lista de precios seleccionada. Si hay precio en moneda dura, también se actualiza. | FAIL: El precio no cambia al seleccionar una lista diferente; app colapsa; selector no muestra opciones. | S2 | `src/app/productos/product-detail/product-detail.component.ts:117-126` (`onListChanged`), `product-detail.component.html:125-132` |
| DM-PRD-014 | Selector de almacén en detalle → cambio actualiza el stock del producto | Detalle de producto abierto. VG `validateWarehouses = true`, `hideProductWarehouse = false`. Producto con stock en más de un almacén. **Aplicación: Condicional (VG: `globalConfig.get("validateWarehouses") = true` y `globalConfig.get("hideProductWarehouse") ≠ true`)** | 1. En el detalle del producto, verificar que el selector de almacén es visible. 2. Elegir un almacén diferente en el selector. 3. Observar el campo de stock. | Producto con stock asignado a al menos 2 almacenes | El campo de stock muestra el valor correspondiente al almacén seleccionado. | FAIL: Selector de almacén no visible cuando VG lo exige; el stock no cambia al cambiar almacén; app colapsa. | S2 | `src/app/productos/product-detail/product-detail.component.ts:155-159` (`onWarehouseChanged`), `product-detail.component.html:158-173` |
| DM-PRD-015 | Stock visible en lista de productos y en detalle | Lista de productos activa. VG `validateWarehouses = true`, `showStock = true`, `hideProductWarehouse = false`. **Aplicación: Condicional (VG: `globalConfig.get("validateWarehouses") = true` y `globalConfig.get("showStock") = true`)** | 1. Observar los registros de la lista de productos. 2. Tocar un producto y observar su detalle. | N/A | En la lista: cada producto muestra una línea con el stock (etiqueta del tag `PROD_STOCK_PROD`). En el detalle: el campo de stock es visible con el valor del almacén por defecto. | FAIL: Campo de stock ausente en lista o detalle cuando VG lo exige; stock muestra valor incorrecto o "0" sin serlo. | S3 | `src/app/productos/product-list/product-list.component.html:59-62`, `product-detail.component.html:174-183` |
| DM-PRD-016 | Imágenes del producto visibles en lista y carousel en detalle | Lista de productos activa. VG `showProductImages = true`. Al menos un producto con imagen sincronizada. **Aplicación: Condicional (VG: `globalConfig.get("showProductImages") = true`)** | 1. Observar la lista de productos: verificar que cada ítem muestra la imagen del producto (o imagen de "no disponible" si no tiene). 2. Tocar un producto con imagen y observar el detalle. | Producto con imagen sincronizada | En la lista: imagen a la izquierda de cada ítem. En el detalle: la sección de carousel (swiper) aparece en la parte superior con la imagen. Si el producto tiene varias imágenes, se pueden deslizar. Si no tiene imagen, muestra el placeholder "nodisponible.png". | FAIL: Imágenes ausentes cuando VG lo exige; carousel no aparece en detalle; app colapsa al cargar imágenes. | S3 | `src/app/productos/product-list/product-list.component.html:16-21`, `product-detail.component.html:2-43` |
| DM-PRD-017 | IVA% visible en lista de productos y en detalle | Lista de productos activa. VG `vatExemptProducts = true`. **Aplicación: Condicional (VG: `globalConfig.get("vatExemptProducts") = true`)** | 1. Observar los registros de la lista de productos. 2. Tocar un producto con IVA > 0 y ver su detalle. | N/A | En la lista: cada producto muestra una línea con el porcentaje de IVA (etiqueta del tag `PROD_IVA`). En el detalle: el campo de IVA es visible con el valor correspondiente. | FAIL: Campo de IVA ausente cuando VG lo exige; se muestra "0 %" en productos que tienen IVA configurado. | S3 | `src/app/productos/product-list/product-list.component.html:44-48`, `product-detail.component.html:139-145` |
| DM-PRD-018 | Mínimos y/o múltiplos visibles en lista y detalle | Lista de productos activa. VG `productMinMul = true`. Al menos un producto con mínimo > 1 o múltiplo > 1. **Aplicación: Condicional (VG: `globalConfig.get("productMinMul") = true`)** | 1. Observar la lista de productos. 2. Localizar un producto con mínimo o múltiplo configurado. 3. Abrir su detalle. | N/A | En la lista: los productos que tienen mínimo > 1 muestran la línea `PROD_MINIMO: X`; los que tienen múltiplo > 1 muestran `PROD_MULTIPLO: X`. En el detalle: los mismos campos aparecen si aplican. | FAIL: Líneas de mínimo/múltiplo ausentes cuando VG lo exige; se muestran para todos los productos independientemente del valor. | S3 | `src/app/productos/product-list/product-list.component.html:68-79`, `product-detail.component.html:184-205` |
| DM-PRD-020 | Botón atrás en cabecera desde el detalle → regresa a la lista de productos | Detalle de un producto abierto. **Aplicación: Siempre** | 1. Desde el detalle del producto, pulsar la flecha atrás en la cabecera del módulo. 2. Observar la pantalla. | N/A | App regresa a la lista de productos mostrando los mismos resultados anteriores (estructura o búsqueda activa). | FAIL: Navega a Home en lugar de la lista; navega a las estructuras; botón no responde; detalle vuelve a abrirse. | S2 | `src/app/productos/productos-header/productos-header.component.ts:56-57` (`showProductList`), `src/app/productos/productos.component.ts:115-120` (`onBackClicked`) |
| DM-PRD-021 | Botón atrás en cabecera desde la pantalla de estructuras → navega a Home principal | Pantalla de estructuras activa (inicio del módulo). **Aplicación: Siempre** | 1. Desde la pantalla inicial de estructuras, pulsar la flecha atrás en la cabecera. 2. Observar la navegación. | N/A | App navega a la pantalla Home principal de Denario. | FAIL: Permanece en estructuras; navega a otra pantalla; botón no responde. | S2 | `src/app/productos/productos-header/productos-header.component.html:7-8` (`routerLink="/home"`) |
| DM-PRD-022 | Precios desglosados por lista de precios y unidad en lista y detalle | Lista de productos activa. VG `unitByPriceList = true`. **Aplicación: Condicional (VG: `globalConfig.get("unitByPriceList") = true`)** | 1. Observar los registros de la lista de productos. 2. Abrir el detalle de un producto con múltiples listas de precios. | N/A | En la lista: en lugar de una sola línea "Precio: X", cada producto muestra una o más líneas en formato `[NombreLista] - [Unidad]: [Precio] [Moneda]`. En el detalle: se muestran las mismas filas por lista/unidad (no hay selector de lista de precios único). | FAIL: Persiste el formato de precio único en lugar del desglosado; líneas de precio vacías o con "N/A" en todos los productos; app colapsa. | S2 | `src/app/productos/product-list/product-list.component.html:25-33`, `product-detail.component.html:96-110` |
| DM-PRD-023 | Precio en segunda moneda visible en lista y detalle (conversión multimoneda) | Lista de productos activa. VG `currencyModule activo` con `showConversion = true`. **Aplicación: Condicional (VG: `currencyModule.showConversion = true`)** | 1. Observar la lista de productos para un producto con precio en moneda dura. 2. Abrir el detalle de ese producto. | N/A | En la lista: aparece una línea adicional con el precio convertido en la moneda opuesta (ej. precio en USD si la moneda local es VES). En el detalle: aparece una fila con el precio en moneda dura y (si aplica) la tasa de conversión. | FAIL: Segunda línea de precio ausente cuando VG lo exige; precio en segunda moneda muestra "0" o texto incorrecto. | S3 | `src/app/productos/product-list/product-list.component.html:29-31, 38-42`, `product-detail.component.html:146-156` |

---

```gherkin
# DM-PRD-001 / DM-PRD-004 — Happy path acceso y apertura de estructura
Dado que tengo sesión activa y productos sincronizados
Cuando accedo al módulo Productos desde Home
Entonces veo la pantalla de estructuras con selector de tipo y lista de estructuras
Cuando pulso una estructura con productos
Entonces veo la lista de productos de esa estructura con nombre y código de cada uno
```

```gherkin
# DM-PRD-006 / DM-PRD-007 — Búsqueda en lista
Dado que tengo la lista de productos abierta
Cuando ingreso texto de un producto conocido y presiono Enter
Entonces la lista muestra solo los productos que coinciden con ese texto
Cuando ingreso texto sin coincidencias y presiono Enter
Entonces la lista muestra el mensaje de "sin resultados" sin registros
```

```gherkin
# DM-PRD-020 — Navegación atrás desde detalle
Dado que tengo abierto el detalle de un producto
Cuando pulso la flecha atrás en la cabecera del módulo
Entonces regreso a la lista de productos sin que se pierdan los resultados anteriores
```

---

### Regresión mínima (smoke rápido)

IDs imprescindibles para validar el módulo productos antes de cerrar un release:

1. **DM-PRD-001** — Acceso al módulo, estructuras visibles
2. **DM-PRD-002** — Selector de tipo de estructura actualiza listado
3. **DM-PRD-004** — Tocar estructura → lista de productos
4. **DM-PRD-006** — Búsqueda por texto dentro de lista
5. **DM-PRD-007** — Búsqueda sin resultados → mensaje visible
6. **DM-PRD-009** — Scroll infinito → carga más productos
7. **DM-PRD-012** — Abrir detalle de producto
8. **DM-PRD-013** — Selector de lista de precios en detalle
9. **DM-PRD-020** — Cabecera atrás desde detalle → lista de productos
10. **DM-PRD-021** — Cabecera atrás desde estructuras → Home

---

### Supuestos y lagunas — Cobertura fuera de este guion

1. **Búsqueda dentro de estructura hace búsqueda global**: al ingresar texto y presionar Enter dentro de la lista de una estructura, la búsqueda se realiza en **todos los productos de la empresa**, no solo en la estructura activa (`product-list.component.ts:157-176` — `productoSearch` subject → `getProductsSearchedByCoProductAndNaProduct` sin filtro de estructura). Esto es comportamiento observable y puede sorprender al tester: los resultados pueden incluir productos de otras estructuras. Documentar y verificar si es intencional.

2. **Campo de búsqueda en lista de productos (botón deshabilitado)**: cuando el usuario accede a una lista de estructura SIN haber escrito texto (`searchText = ''`), el botón X (limpiar) está deshabilitado. Esto es correcto. Sin embargo, el campo de texto sí acepta entrada; el botón de búsqueda real en la vista de lista es el X (limpiar), no un botón de "buscar". La búsqueda se dispara solo con Enter. Este comportamiento difiere de la vista de búsqueda global (fuera de estructura) donde el botón de búsqueda (lupa) se activa al tener texto.

3. **Botón atrás en cabecera desde lista de productos también va a Home**: cuando el tester está en la lista de productos (`showProductDetail = false`), la flecha atrás de la cabecera usa `routerLink="/home"`, navegando a Home directamente (no a las estructuras). Para volver a las estructuras desde la lista, el tester debe usar el botón "Volver" en la barra de búsqueda. Comunicar este comportamiento al equipo si se considera confuso vs. la expectativa habitual de "atrás".

4. **Puntos en lista y detalle (`displayProductPoints`)**: cuando `globalConfig.get("displayProductPoints") = true`, cada producto muestra una línea con sus puntos en lista y detalle. No se incluyó como caso de tabla por ser idéntico en forma a los casos DM-PRD-017 (IVA) y DM-PRD-018 (mínimos). Verificar igual que esos casos si la configuración está activa en el cliente probado.

5. **`orderService.hideStock0` y `orderService.hideProdWithoutPrice`**: el código incluye un método `filterProductList()` que puede filtrar productos sin stock o sin precio, pero está comentado en la versión actual (`product-list.component.ts:140-155`). No se incluyen casos para estas condiciones al no estar activas en el flujo de código actual.

6. **Imágenes descargadas en background al acceder al módulo**: `productos.component.ts:73-74` llama a `imageServices.downloadWithConcurrency()` al cargar el módulo. Si la descarga está en curso, las imágenes en la lista pueden aparecer progresivamente. Esto es comportamiento esperado y no representa un fallo, pero el tester puede ver breves placeholders "nodisponible.png" mientras se cargan.

7. **`conversionByPriceList`**: existe la VG `globalConfig.get("conversionByPriceList")` que afecta el cálculo de precios en el detalle (`product-detail.component.ts:67`), pero no genera un elemento UI nuevo (no hay fila adicional condicional). Se aplica internamente en los cálculos de precio. No se genera caso de tabla independiente.

8. **`priceListInfoModal`**: la VG `globalConfig.get("priceListInfoModal")` está declarada en `PedidosService` pero no se encontró su uso en los componentes del módulo `productos/` en esta revisión. Si genera un modal informativo sobre la lista de precios, se deberá documentar en la próxima revisión.
