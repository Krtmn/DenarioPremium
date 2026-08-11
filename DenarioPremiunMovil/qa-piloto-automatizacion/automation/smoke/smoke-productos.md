# Smoke — PRODUCTOS
## Módulo de solo lectura — no crea ni modifica datos
## Estado inicial: HOME | Estado final: HOME

**Inicio:** `h.connectCdp(page)` → `h.waitSyncOverlay(pg)`
**Datos de prueba:** leer `automation/clientes/{QA_CLIENTE}.yaml` → `modules.productos`

---

## Casos

| ID | Acción clave | PASS cuando | FAIL / N/A |
|----|-------------|-------------|------------|
| DM-PRD-001 | Click módulo Productos | Estructuras visibles con selector tipo + lista | FAIL: pantalla vacía |
| DM-PRD-002 | `h.selectIonPopover` selector tipo → cambiar a otro tipo | Lista de estructuras actualiza | FAIL: lista no cambia |
| DM-PRD-004 | Click en estructura (`h.clickIonItem`) | Lista de productos visible con código y precio | FAIL: lista vacía |
| DM-PRD-006 | `h.fillIonInput` texto en searchbar (`texto_busqueda`) | Resultados filtrados | FAIL: no filtra |
| DM-PRD-007 | `h.fillIonInput` texto sin coincidencias ("ZZZZZZZ") | Mensaje "No hay productos disponibles" | FAIL: lista no vacía |
| DM-PRD-009 | `h.scrollInfinite(pg)` | Más productos cargan (o spinner desaparece si no hay más) | FAIL: spinner infinito |
| DM-PRD-012 | Click en producto | Detalle con nombre, código, precio USD y BS, unidad | FAIL: detalle vacío |
| DM-PRD-013 | `h.selectIonPopover` selector lista de precios → cambiar a lista distinta | Precio se actualiza al cambiar lista. **Si precio numérico es idéntico en ambas listas → PASS con nota "precio igual en ambas listas"** | FAIL: precio **visible cambia** de valor pero UI no lo refleja; selector no responde |
| DM-PRD-020 | `h.clickBack(pg)` desde detalle | Lista de productos del tipo activo | FAIL: va a estructuras |
| DM-PRD-021 | `h.clickBack(pg)` desde estructuras | Home principal | FAIL: queda en módulo |

---

## REPORTES — exportar catálogo y lista de precios

🔴 **Condicionado a la VG `allowProductReports`.**
- `allowProductReports = true` → **los 7 casos de abajo son obligatorios.**
- `allowProductReports = false` → **todos 🚫 N/A** citando la VG. Verificar además que el botón **no** aparezca.

**Entrada:** `button.reports-entry-button` dentro de PRODUCTOS.
⚠ **`productos-reports` NO tiene ruta propia** (`*ngIf` dentro de `ProductosComponent`; la URL sigue en
`/productos`) ⇒ detectar por DOM, no por URL.

**Oráculo (calcular por cliente antes de correr):**
```sql
-- catálogo total y cotizables de la empresa bajo prueba
SELECT count(DISTINCT p.co_product) AS catalogo,
       count(DISTINCT p.co_product) FILTER (WHERE EXISTS (
         SELECT 1 FROM price_list pl WHERE pl.co_product=p.co_product
           AND pl.co_enterprise=p.co_enterprise AND pl.co_operation<>'D' AND pl.nu_price>0)) AS con_precio
FROM product p WHERE p.co_operation<>'D' AND p.co_enterprise='{EMPRESA}';
```
**Atajo del PDF:** imprime `Productos: <n>` en la metadata = `rows.length`. No hace falta parsear filas.

| ID | Acción clave | PASS cuando | FAIL / N/A |
|----|-------------|-------------|------------|
| DM-PRD-030 | Click `button.reports-entry-button` | Pantalla de reportes con selector de tipo, formato y filtros | 🚫 N/A si `allowProductReports=false`; FAIL: el botón existe pero no abre |
| DM-PRD-031 | Lista de precios → **Excel**, sin filtro | Archivo con **`con_precio` + sin-precio = `catalogo` filas** y magic bytes **`PK`** (es un ZIP) | FAIL: 0 filas, tamaño 0, o magic bytes que no son `PK` |
| DM-PRD-032 | Lista de precios → **PDF**, sin filtro | `%PDF-` al inicio, `%%EOF` al final, y meta **`Productos: {catalogo}`** | FAIL: no abre, viene cortado o el conteo no cuadra |
| DM-PRD-033 | Catálogo → **PDF**, sin filtro | Ídem DM-PRD-032 | FAIL: ídem |
| DM-PRD-034 | Catálogo → **Excel** | 🚫 **N/A ESTRUCTURAL SIEMPRE** — `canGenerateExcel()` devuelve `reportType === 'priceList'`, o sea **Excel existe solo para lista de precios, por diseño**. El botón **no se renderiza** (no queda deshabilitado) | FAIL **solo** si aparece un Excel de catálogo que no debería existir |
| DM-PRD-035 | Aplicar filtro por estructura y exportar | El conteo del archivo **coincide exacto** con el badge de esa estructura y con BD | FAIL: exporta el catálogo entero, o un número distinto al badge |
| DM-PRD-036 | Elegir filtro **sin** seleccionar valor y exportar | Alerta *"Seleccione un valor para el filtro elegido"* y **no se escribe archivo** | FAIL: exporta igual, o no avisa |

🔴 **CONTRASTE DE ALTO VALOR (anotarlo siempre):** el reporte **no** reutiliza `product-list.productList` — hace
su propio `SELECT … FROM products WHERE id_enterprise=?` **sin `LIMIT`**. Por eso **no hereda
`PRD-LISTA-CORTA-CATALOGO`**, el defecto por el que la lista en pantalla se corta antes de terminar.
⇒ **Si alguna vez el reporte exporta el mismo número que muestra la pantalla, eso es una regresión** y hay que
levantarla: significaría que el reporte pasó a alimentarse de la lista truncada.
*(Medido en difranca 2026-08-11: pantalla 93 / reporte 114 en BBK · pantalla 84 / reporte 118 en HD Cosmetics.)*

### Notas de ejecución (ya pagadas, no re-descubrir)

- 🔴 **Exportar dispara `Share.share` → hoja nativa de Android.** **No cuelga la app** (verificado: el CDP sigue
  respondiendo y `BACK` devuelve el foco sano), pero **el spinner queda bloqueado mientras el chooser está
  abierto** porque el `finally{hideLoading()}` espera al usuario. Para automatizar, **mockear en
  `Capacitor.nativePromise`** interceptando `plugin==='Share'` — misma receta que la cámara, porque
  `Plugins.Share` es un **Proxy** y parchearlo da falso OK. El `writeFile` real se conserva.
- 🔴 **El archivo va a `Directory.Cache`** → `/data/user/0/{pkg}/cache/`, **privado de la app**. **No** está en
  `/sdcard/Download` ni en `Android/data/{pkg}/files` ⇒ `adb pull` **no llega**. Extraer con
  `adb shell run-as {pkg} base64 cache/{archivo}` y decodificar en el host.
  ⚠ *Consecuencia funcional a verificar por cliente:* si el usuario cancela la hoja de compartir, **el archivo
  queda donde ningún gestor de archivos puede alcanzarlo.*
- ⚠ **En Git Bash las rutas `/sdcard/...` se destrozan** (`ls: C:/Program: No such file or directory`)
  ⇒ prefijar `MSYS_NO_PATHCONV=1`.
- **Los 4 `ion-select` comparten `.reports-select` sin `id`/`name`** y son **2 a 4 según el estado** ⇒ indexar
  por posición es frágil: **anclar por el `.reports-label` del `ion-col`**. En `catalog`,
  `.reports-button[0]` es **PDF**, no Excel.
- **Sus `value` son escalares** (string/number), a diferencia de los selects de estructura/lista de precio de
  PRODUCTOS, que llevan **objeto**.
- 🔴 **El campo del modelo es `structureId`, no `selectedStructureId`** — leer el segundo devuelve `undefined`
  con el filtro correctamente aplicado, y se lee como "el select no tomó".
- ⚠ **Verificar con `elementFromPoint` antes de clickear un tile de HOME recién montado:** un click en
  *Productos* sobre el grid sin asentar abrió `/pedido`.
- 🔴🔴 **Los archivos llevan precios y catálogo reales del cliente.** Borrarlos del dispositivo y del scratchpad
  apenas verificado cada caso. **Nunca** pegar su contenido en el reporte: solo nombres, tamaños, conteos y
  magic bytes.

### Defectos conocidos de esta sección (no re-levantar)

- 🟠 **`REP-NOMBRE-ARCHIVO-COLISIONA`** — el nombre es `lista_precios_{idEmpresa}_{YYYY-MM-DD}`: **sin hora, sin
  contador y sin el filtro**. Tres exportaciones distintas el mismo día (450 / 114 / 118 filas) **escribieron la
  misma ruta y se pisaron**.
- 🟠 **`REP-FILTRO-MARCA-IGUAL-ETIQUETA`** — **Marca** y **Etiqueta** devuelven **las mismas opciones con los
  mismos ids**. Además los rótulos no describen el dato (en difranca "Categoría" son las Líneas y "Marca" las
  Sub-Líneas): el mapeo es heurístico por palabra clave y falla cuando los tipos se llaman `Linea`/`Sub-Linea`.
- 🟡 La "Lista de precios" **incluye los productos sin precio** (no los filtra) — verificar si es lo esperado
  por cliente.
- 🟡 El Excel escribe el precio **sin formato numérico declarado**. Hoy no produce valores con >2 decimales,
  pero es el mismo riesgo que el `42069.132000000005` visto en la web.
