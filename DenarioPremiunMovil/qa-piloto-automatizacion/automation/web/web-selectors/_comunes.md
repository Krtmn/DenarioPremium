# Selectores web — comunes a todos los módulos

> Memoria viva de la web (JSF/PrimeFaces). Espejo de `automation/cdp/module-selectors/_comunes.md`.
> Origen: reconocimiento F0 2026-07-28, Isla Coche · empresa CAPITALINA DE ALIMENTOS 212, C.A.
> Mantener bajo ~120 líneas. Todo patrón nuevo confirmado en 1 corrida entra acá con su tag.

## Regla de oro de selectores — los IDs son MIXTOS

La web mezcla dos tipos de ID. **La diferencia importa y hay que verificarla siempre:**

| Tipo | Ejemplo | ¿Usar? |
|---|---|---|
| **Semántico** (form nombrado) | `form:cobrosDT` · `form:documentosPagadosDT` · `form:cobrosDT:0:consultar` | ✅ **Sí** — estable entre despliegues |
| **Auto-generado** (JSF posicional) | `j_idt12` · `j_idt177` · `j_id1:javax.faces.ViewState:0` | ❌ **NUNCA** — se corren al tocar el `.xhtml` |

**Cuando el ID es `j_idt*`, anclar por estructura, no por ID.** Ej. la tabla de pagos del detalle de cobro
es `form:j_idt177` → localizarla como *"el `.ui-datatable` cuyos `thead th` incluyen 'Forma de pago'"*.

En el **login** todos los IDs son `j_idt*`, pero el árbol de accesibilidad resuelve limpio:
`getByRole('textbox', {name:'Usuario'})` · `{name:'Clave'}` · `getByRole('button', {name:'Ingresar'})`. `[f0-2807]`

## Patrón de IDs de fila (confirmado en 7/7 módulos)

```
{idTabla}:{índiceFila}:{acción}      →  form:cobrosDT:0:consultar
```
Predecible: para actuar sobre la fila N, `#form\:cobrosDT\:N\:consultar` (escapar los `:` en CSS). `[f0-2807]`

## ⚠ `form:pedidosDT` NO es único — lo comparten 5 módulos

| ID de tabla | Módulos que lo usan |
|---|---|
| `form:pedidosDT` | **pedidos · devoluciones · depósitos · clientes potenciales · inventarios** |
| `form:cobrosDT` | cobros (único) |
| `form:tablaVisit` | visitas (único) |

⇒ **Nunca identificar el módulo por el ID de la tabla.** Verificar primero `location.pathname` (o `document.title`)
y recién entonces leer. Un helper que asuma "estoy en pedidos porque existe `form:pedidosDT`" leerá depósitos
sin darse cuenta. `[f0-2807]`

## Búsqueda del registro por Nro.Ref — no está en todos

| Módulo | Cómo se localiza el registro |
|---|---|
| cobros · pedidos · devoluciones · depósitos · inventarios | **filtro `# Ref`** + `Buscar` (directo, barato) |
| **clientes potenciales** · **visitas** | ❌ **sin FILTRO** de Ref → filtrar por **vendedor + rango de fechas** y **barrer filas**. ✅ Pero la **LISTA sí trae columna `# Ref`** (confirmado en clientes potenciales), así que el barrido es exacto, no aproximado |

### 🔴 La conversión de moneda NO siempre divide — depende de la moneda de la transacción

| Playa observada | Monto | Conv. | Operación |
|---|---|---|---|
| capitalina / Isla Coche | **BS** | US$ | `50.687,24 / 724 = 70,01` → **dividir** |
| el_valle / La Tortuga | **US$** | BS | `30,00 × 725,75 = 21.772,50` → **multiplicar** |

Asumir siempre división produce **falsos `WEB-CALC-MISMATCH`** en las playas que operan en US$.
`verificarConversion()` deduce la dirección de las monedas y, si no puede, **no juzga** en vez de adivinar
(`opts.direccion` la fuerza). `[el_valle-20260728]`

### Totales de cabecera: etiqueta y valor comparten padre

En **todos** los detalles (no solo pedidos) el bloque de totales no lo levanta la regla "hoja etiqueta → hoja
siguiente": el valor es un *textNode* del mismo padre. Leer con
`el.parentElement.textContent.slice(etiqueta.length)` **y poner tope de longitud**, o `Ubicación:` absorbe los
controles del mapa. Casos sueltos: **`Observaciones` no lleva `:`** y se pierde con la regla estándar; en
`detalleInventario` la **coordenada no es texto visible** (vive en el HTML del mapa). `[el_valle-20260728]`

`[f0-2807]`

## Navegación

- ✅ **La navegación directa por URL FUNCIONA** con sesión activa — `/pages/cobros` carga sin `ViewExpired`.
  No hace falta recorrer el menú por módulo. Rutas en `automation/web/playas.yaml`. `[f0-2807]`
- El **detalle** sí se abre por el botón `Consultar` de la fila (necesita el contexto de la fila), no por URL suelta.
- Login: `POST` a `/pages/login.xhtml` → redirige a `/pages/main` (título "Inicio"). Cookie `JSESSIONID`, `Path=/DenarioPremium`.
- Credenciales: bloque `# USUARIO WEB` de `secrets/qa-credentials.env` (**no** un bloque `# Cliente:`).

## Anti-patrones (prohibidos)

```
✗  browser_snapshot como observación por defecto  → el de /pages/cobros dio 76k caracteres y reventó el
                                                     límite de tokens. Usar browser_evaluate devolviendo
                                                     SOLO el JSON que el oráculo necesita.  [f0-2807]
✗  Anclar a #j_idt*                               → ver regla de oro
✗  waitForTimeout fijo tras acción ajax           → esperar por señal/texto (browser_wait_for)
✗  Identificar el módulo por el ID de la tabla    → ver la sección de form:pedidosDT
```

### ⛔ Superficie de ESCRITURA — el agente web es READ-ONLY

**El único control que se toca en una fila es `Consultar`.** Todo lo demás está prohibido:

| Módulo | Controles que NO se tocan |
|---|---|
| **Visitas** | **`Editar` · `Eliminar` por fila** — la superficie más peligrosa del sitio |
| **Pedidos** | `Nuevo Pedido` · `Copiar` (por fila) |
| **Cobros** | `<select>` **"Estatus del Cobro", editable en la propia fila** — cambiarlo altera el documento en producción |

`[f0-2807]`

## Lectura de celdas — ⚠ el texto trae el encabezado pegado

PrimeFaces (modo responsive) **duplica el `th` dentro del `td`**. El `textContent` crudo sale así:

```
"# Ref526"                 → encabezado "# Ref"  + valor "526"
"Monto cobrado 50.687,24 BS"
"Tasa conv.724,00 BS = 1 US$"
```

⇒ El lector debe **quitar el prefijo del encabezado** antes de comparar. Caso especial: las celdas con
`<select>` traen **todas las opciones concatenadas y el valor actual al final**:
`"Estatus del CobroAprobadoPendientePor aprobarRechazadoPor aprobar"` → valor real = `"Por aprobar"`. `[f0-2807]`

## Lectura de la CABECERA del detalle (vale para los 7)

Secuencia de **nodos hoja**: la **etiqueta termina en `:`**, el **valor es el nodo siguiente**.

```js
// "No. de Ref.:" → "1801"   ·   "Fecha del pedido:" → "28/07/2026 09:06:36"
const hojas = [...document.querySelectorAll('body *')]
  .filter(el => !el.children.length && el.offsetParent !== null)
  .map(el => (el.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean);
// emparejar: si hojas[i] termina en ':' → campo hojas[i] = hojas[i+1]
```

⚠ **Filtrar el ruido de plantilla que aparece en TODAS las páginas:** el menú completo (`Transacciones`,
`Cobros`, `Reportes`…) más un dashboard demo — `Rain Clothing` · `Products` `12K` · `Orders` `26K` ·
`Sales` `$200K` · `Tamas Bunce` · `Olivia Arribas` · `N mins ago` · `Denario Premium Configuración`. `[f0-2807]`

## 🔑 Dos llaves de correlación con el móvil

| Llave | Dónde | Nota |
|---|---|---|
| `No. de Ref.` | cabecera del detalle + columna `# Ref` de la lista | = `id_<x>`, PK del servidor (`RUNTIME §10`) |
| `Código {módulo}` | cabecera del detalle | = **epoch `co_<x>`** (ej. `1785243271076.0`) — el mismo que manda el móvil |

Confirmado en pedidos e inventarios. **En clientes potenciales NO hay `No. de Ref.` en el detalle: el epoch
`Código:` es la única llave.** Devoluciones/depósitos/visitas: solo `No. de Ref.` observado. `[f0-2807]`

## URLs de detalle (se llega por `Consultar`, no por URL suelta)

```
/pages/detalleCobro   /pages/detallePedido   /pages/detalleDevolucion   /pages/detalleDeposito
/pages/detalleClientePotencial              /pages/detalleInventario
/pages/protected/visitas/detalleVisita.xhtml     ← ⚠ visitas usa la forma legacy con /protected/ y .xhtml
```

## Enlaces cruzados entre módulos (oráculos gratis)

- **Depósito → cobros:** la tabla hija del detalle de depósito lista los cobros con `N° Ref cobro` y
  `Monto cobrado` ⇒ **Σ(hijos) == `Monto depositado`** de la cabecera, y salto directo al módulo de cobros.
- **Inventario → pedido:** la cabecera trae `Ver Pedido Relacionado`.

## Mapas de Google embebidos

Presentes en clientes potenciales, visitas, inventarios y devoluciones. **Carga externa** → nunca esperar por el
mapa ni bloquear un caso si no carga; esperar por un dato propio de la página. La `Coordenada de transacción`
(`lat,lng`) sí es dato verificable. `[f0-2807]`

## Formato de datos (es-VE)

- **Números:** `.` = miles · `,` = decimales → `2.000.000,00`. Parsear con `s.replace(/\./g,'').replace(',','.')`.
- **Moneda:** sufijo ` BS` / ` US$`.
- **Fechas:** `DD/MM/YYYY HH:mm:ss`. Veredicto **por día** (móvil UTC-4 vs servidor UTC) — igual que `RUNTIME §10.b`.
- **Tasa:** `"724,00 BS = 1 US$"` → extraer el número antes de ` BS`.

## Filtros de lista (patrón común)

Botones `Buscar` · `Limpiar` · `Columnas`. El filtro **`# Ref`** es la llave de cotejo con el móvil
(Nro.Ref UI = `id_<x>` = PK del servidor, ver `RUNTIME §10`) — es como el agente web encuentra
el registro que creó la corrida móvil, sin discovery.
