# Selectores web — comunes a todos los módulos

> Memoria viva de la web (JSF/PrimeFaces). Espejo de `automation/cdp/module-selectors/_comunes.md`.
> Origen: reconocimiento F0 2026-07-28, Isla Coche · empresa CAPITALINA DE ALIMENTOS 212, C.A.
> Playas consolidadas: `[f0-2807]` La Tortuga · `[el_valle-20260728]` · `[el_palmar-20260805]` Isla Coche ·
> `[difranca-20260807]` **El Yaque / difranca** (5 módulos, 3 empresas, read-only).
> Todo patrón nuevo confirmado en 1 corrida entra acá con su tag. Consolidar filas antes de agregar.

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

🔴 **CORRECCIÓN `[difranca-20260807]`: los IDs `#j_idt12` / `#j_idt14` / `#j_idt16` que este archivo
documentaba como los del formulario de login YA NO LO SON.** Cambiaron en El Yaque. **Quedan derogados**:
el árbol de accesibilidad es la **única** vía soportada para loguear.

## 🔴🔴 SEGURIDAD DEL LOGIN — el código que se carga QUEDA EN EL TRANSCRIPT `[difranca-20260807]`

- **`browser_run_code_unsafe` DEVUELVE en su respuesta el código que cargó**, incluso cuando se pasa por
  `filename`. ⇒ **poner credenciales en un archivo y cargarlo NO las oculta**: aparecen igual en el transcript.
- El proceso de Playwright **no expone `require` ni `import()` dinámico** ⇒ **`fs` es inaccesible**: no hay
  forma de leer el secreto en tiempo de ejecución desde dentro del código cargado.

⇒ **POLÍTICA (obligatoria):** el login web se hace con **`browser_type` sobre los inputs del árbol de
accesibilidad**. **Nunca** credenciales embebidas en código, ni en un archivo cargado, ni impresas en salida.

## 🔴🔴 GUARDA DE TENANT — anclar al TEXTO, no al host ni al `value` `[el_palmar-20260805]`

**Es la lección que costó una corrida entera.** Antes de leer nada, verificar que se está en la playa correcta:

```js
// 1 sola llamada, sin clicks: PrimeFaces mantiene un <select> ESPEJO con todas las <option>
const empresas  = [...document.querySelectorAll('[id$=":idEnterprise_input"] option')].map(o => o.textContent.trim());
const vendedores = [...document.querySelectorAll('[id$=":idSalesmaView_input"] option')].map(o => o.textContent.trim());
// guarda: empresas esperadas presentes por TEXTO  +  vendedor esperado presente
```

- 🔴 **El `value` del `<select>` de Empresa NO es uniforme entre módulos.** En `/pages/devoluciones` es **posicional**
  (`1|CENTRAL EL PALMAR`, `2|DESTILERIA YARACUY`); en `/pages/clientesPotenciales` es el **`co_enterprise`**
  (`1002|…`, `1003|…`). ⇒ **anclar por TEXTO de la opción, nunca por `value`**, y **no compararlo contra BD**.
  **Mapa completo medido en El Yaque `[difranca-20260807]`** — el tipo cambia **dentro del mismo tenant**:

  | Módulo | `value` | Tipo |
  |---|---|---|
  | `/pages/cobros` · `/pages/devoluciones` · `/pages/visitas` | `2` | `id_enterprise` |
  | `/pages/pedidos` · `/pages/clientesPotenciales` | `DDHP_A12` | **`co_enterprise`** |

  ⇒ un selector que compare `value` contra BD **falla en 2 de 5 módulos**. **Visitas** trae además una opción
  extra `""` = *"Seleccione Empresa"*. ⚠ El TEXTO viene tal cual `na_enterprise`, **con asteriscos y espacio
  final**: `*DISTRIBUIDORA DIAZ HERNANDEZ *` ⇒ comparar normalizando, no con `===` literal a ojo.
- El `<select>` de **vendedores** usa `id_user` como `value` y el **nombre** como label (`266|Dilcia Duarte`):
  el **login** del vendedor (`1276`) **no aparece** — buscar por id o por nombre, no por login.
  🔴 **Tiene TRES formas del mismo identificador `[difranca-20260807]`:**

  | Módulo | Sufijo del `<select>` | `value` | Label |
  |---|---|---|---|
  | cobros · pedidos · devoluciones · clientes potenciales | `:idSalesmaView` | `275` (`id_user`) | `Jose Raad` |
  | **visitas** | **`:idSalesman`** | `275` (`id_user`) | **`206 - Jose Raad`** (`co_user` + nombre) |
  | **visitas (filtros)** | — | — | ⚠ en El Yaque **visitas NO tuvo filtro de vendedor** en el panel |

  Reconfirmado: el login (`VEND206`) **no aparece nunca**. ⚠ El nombre puede venir con **DOS espacios**
  (`Jose  Raad`): un `=== 'Jose Raad'` **no matchea** ⇒ normalizar con `.replace(/\s+/g,' ').trim()`.
- Los `li[id*="idEnterprise_"]` **solo existen tras abrir el combo**; el `<select>` espejo está siempre.

### 🔴 El filtro Empresa puede arrancar en la 2ª empresa y RESETEARSE AL ENTRAR FRESCO A CADA MÓDULO

Observado en 4 módulos: el filtro venía preseleccionado en la **2ª empresa** y, tras corregirlo en inventarios,
al navegar a depósitos **volvió a estar en la 2ª**. **Sin corregirlo, los registros salen invisibles y se canta
un `WEB-MISSING` falso.** Matiz importante: una vez fijado **sobrevive a `detalleX` → volver**, y la tabla vuelve
poblada **sin `Buscar`**; lo que lo resetea es **entrar fresco al módulo**. ⇒ **corregir Empresa en CADA módulo,
siempre, antes de `Buscar`.** Cambiarla **sí** obliga a `Buscar` de nuevo. `[el_palmar-20260805]`

```js
// cambiar Empresa sin browser_click, dentro de una sola evaluate:
// label.click()  →  click sobre el <li> filtrado POR TEXTO
```

⚠ **NO es universal `[difranca-20260807]`:** en El Yaque la Empresa vino preseleccionada en la **correcta**
(`DDHP_A12`, la 1ª) en los **5** módulos y **ningún módulo la reseteó** ni la tocó con `Limpiar`.
⇒ el patrón real no es "arranca en la 2ª" sino **"no se puede asumir cuál viene puesta": verificarla y
fijarla en CADA módulo antes de cada `Buscar`**.

### 🔴 El ajax de cambio de Empresa **REPUEBLA las fechas** `[difranca-20260807]`

Al limpiar `dateB_input`/`dateF_input` **antes** de cambiar Empresa, el re-render del panel **las devolvió al
rango por defecto** (`01/07/2026–31/07/2026`). Con esas fechas puestas, un `# Ref` de **hoy** devuelve
**0 contados** y se lee como *"el registro no existe"* ⇒ **falso `WEB-MISSING` servido en bandeja.**

⇒ **Limpiar las fechas SIEMPRE DESPUÉS del último cambio de `<select>`**, y **releer su `value` justo antes
de pulsar `Buscar`**.

### 🔴 Jerarquía de filtros medida: **la Empresa TAPA el `# Ref`; las fechas NO** `[difranca-20260807]`

| Pregunta | Medición | Consecuencia |
|---|---|---|
| ¿El **rango de fechas** tapa el `# Ref`? | **NO** — cobro de 07/08/2026 aparece con rango `01/01/2020–31/12/2020`; cobros de junio aparecen con rango de agosto | Sin riesgo: **no hace falta ajustar fechas para cotejar por `# Ref`** |
| ¿La **Empresa** tapa el `# Ref`? | **SÍ** — con `DDHP_A12` puesta: cobro `21829`, devolución `871` y visita `28157` (todos de otra empresa) → **0 filas** | 🔴 **Única vía real de falso `WEB-MISSING`** |

⇒ **Regla para el agente de cotejo: fijar la Empresa (por TEXTO) antes de cada `Buscar`; nunca cantar
`WEB-MISSING` sin haberla verificado.** Reconfirma el aprendizaje de El Palmar en una 2ª playa.

Rango de fechas por defecto = el mes en curso hasta hoy. `[el_palmar-20260805]`

## 🔴🔴 LOS FILTROS PERSISTEN EN LA SESIÓN y sobreviven a `page.goto` `[difranca-20260807]`

**Severidad 🔴 alta (subió de 🟡 medio): causó DOS falsos positivos en una sola corrida** — un
`PED-LISTA-SUBCONJUNTO` que **no existe** (era `Moneda=BSD` persistida) y una búsqueda fallida con tilde.

| Qué persiste | Sufijo | ¿`Limpiar` lo resetea? |
|---|---|---|
| `# Ref` | `:n_ref` | ✅ sí |
| **Moneda** | `:idCurrency` | ❌ **NO** |
| **Cliente** | `:clientSOM` | ❌ **NO** |
| **Status** | `:orderStatus` | ❌ **NO** |
| Fechas | `:dateB_input` / `:dateF_input` | ❌ **NO** en cobros y pedidos · ✅ sí en devoluciones, visitas y clientes potenciales |
| Empresa | `:idEnterprise` | — no la toca (correcto) |

- El estado sobrevive a **salir del módulo y volver por URL fresca** (`browser_navigate` / `page.goto`).
- El estado es **POR MÓDULO**: cobros en `US$` y pedidos en placeholder **a la vez** ⇒ no hay fuga cruzada.
- En `/pages/pedidos` de El Yaque `idCurrency` vino en `1` (**BSD**) **en sesión nueva** — o sea que no
  siempre es residuo: puede ser el **valor inicial** del bean.

⇒ **`Limpiar` al entrar es OBLIGATORIO y aun así INSUFICIENTE.** Antes de la 1ª medición de cada módulo:

```js
// leer el estado real de TODOS los combos en una sola llamada (no basta el .ui-selectonemenu-label)
[...document.querySelectorAll('select[id$="_input"]')]
  .map(s => ({ suf: s.id.replace(/^.*?:/,''), value: s.value,
               selText: s.selectedOptions[0]?.textContent.trim(), nOpts: s.options.length }));
```

Lo más seguro es **una vista nueva (`page.goto`) por medición**, con el `value` de todos los selects
registrado antes de cada `Buscar`.

### 🔴 Regla antes de dar por roto un filtro `[difranca-20260807]`

**elegir la opción → esperar ≥2 s → verificar `.ui-selectonemenu-label` Y el `value` del `<select>` espejo
→ recién ahí pulsar `Buscar`.** Sin esa verificación se cantan filtros "rotos" que nunca se aplicaron.

## Patrón de IDs de fila (confirmado en 7/7 módulos)

```
{idTabla}:{índiceFila}:{acción}      →  form:cobrosDT:0:consultar
```
Predecible: para actuar sobre la fila N, `#form\:cobrosDT\:N\:consultar` (escapar los `:` en CSS). `[f0-2807]`

🔴🔴 **PERO NUNCA anclar al ÍNDICE de fila: anclar al `# Ref`.** Los índices **se corren durante la corrida** si
se crean registros mientras se lee — un mismo cobro pasó de `:3:` a `:4:` a `:6:` **en 4 minutos**. Anclar al
índice **garantiza abrir el registro equivocado**. Receta: **una sola `evaluate` que construye el mapa
`# Ref → id de botón` y clickea**; luego una 2ª que lee. Ciclo real = `navigate` → `evaluate(mapa+click)` →
`evaluate(leer)` = **3 llamadas**. `[el_palmar-20260805]` `[difranca-20260807]`
✅ Reconfirmado en pedidos y clientes potenciales; con filtro de por medio el ciclo es
`navigate` → `evaluate(filtrar)` → `evaluate(mapa+click)` → `evaluate(leer)`.

## Prefijo del panel de filtros — cambia entre tandas, resolver por SUFIJO

El prefijo `form:j_idt*` del panel **cambió de `j_idt116` a `j_idt114` entre dos tandas del mismo día** ⇒ confirma
la regla de oro: **nunca anclar a `j_idt*`**. Los **sufijos SÍ son estables** (iguales en todos los módulos):

```
:idEnterprise_label  ·  :idSalesmaView_label  ·  :clientSOM_label  ·  :attachStatus_label
:orderStatus_label   ·  :n_ref  ·  :dateB_input / :dateF_input  ·  :ajax (Buscar)  ·  :botonLimpiar
```
Anclar por sufijo funcionó al **100 %**. ⚠ En devoluciones `orderStatus` trae **dos opciones distintas con el
mismo texto `Enviado`** (`8` y `23`) ⇒ filtrar por ese literal es ambiguo: **filtrar por `# Ref`**. `[el_palmar-20260805]`

✅ **Reconfirmado en El Yaque `[difranca-20260807]`:** el prefijo difiere **entre módulos de la misma sesión**
(`form:j_idt116` en cobros/pedidos/devoluciones/visitas · `form:j_idt115` en clientes potenciales — y en otra
tanda `j_idt115` en devoluciones) ⇒ **NUNCA anclarlo.** Sufijos confirmados, 100 % estables:

```
:idEnterprise_label|_input   :n_ref            :ajax (Buscar)     :botonLimpiar
:idSalesmaView_label|_input  :dateB_input      :dateF_input       :clientSOM_label|_input
:idTipo_*   :idCurrency_*   :orderStatus_*   :attachStatus_*   :idOrderType_*   :idDep_*
VISITAS →  :btnBuscar  (NO :ajax)   ·   :idSalesman_*  (NO :idSalesmaView)   ·   SIN filtro de vendedor
```

⚠ **Visitas no usa `:ajax`** — anclar su botón por TEXTO:
`[...document.querySelectorAll('button')].find(b => /buscar/i.test(b.textContent))`.

## ⚠ `form:pedidosDT` NO es único — lo comparten 5 módulos

| ID de tabla | Módulos que lo usan |
|---|---|
| `form:pedidosDT` | **pedidos · devoluciones · depósitos · clientes potenciales · inventarios** |
| `form:cobrosDT` | cobros (único) |
| `form:tablaVisit` | visitas (único) |

⇒ **Nunca identificar el módulo por el ID de la tabla.** Verificar primero `location.pathname` (o `document.title`)
y recién entonces leer. Un helper que asuma "estoy en pedidos porque existe `form:pedidosDT`" leerá depósitos
sin darse cuenta. `[f0-2807]`

⚠ **Y tampoco es fijo dentro del mismo módulo `[difranca-20260807]`:** en pedidos, `Status = Guardado` (`-1`)
**SUSTITUYE** `form:pedidosDT` por **`form:pedidosSavedDT`** ⇒ `getElementById('form:pedidosDT')` devuelve
`null` y revienta el lector. **Anclar por `.ui-datatable`, nunca por el id fijo.** (ver `pedidos.md`)

## Búsqueda del registro por Nro.Ref — no está en todos

| Módulo | Cómo se localiza el registro |
|---|---|
| cobros · pedidos · devoluciones · depósitos · inventarios | **filtro `# Ref`** + `Buscar` (directo, barato) |
| **clientes potenciales** · **visitas** | ❌ **sin FILTRO** de Ref → filtrar por **vendedor + rango de fechas** y **barrer filas**. ✅ Pero la **LISTA sí trae columna `# Ref`** (confirmado en clientes potenciales), así que el barrido es exacto, no aproximado |

✅ **Reconfirmado en El Yaque `[difranca-20260807]`: 11 refs reales probadas, 11/11 devolvieron su registro**
(cobros 3/3 · pedidos 4/4 — incluidos 3 **viejos que la vista de lista NO muestra** · devoluciones 1/1 ·
visitas 1/1, que legítimamente devuelve **2 filas con el mismo ref** porque su lista es por actividad).
Una ref inexistente da 0 filas + el mensaje de lista vacía (⚠ **no es el mismo literal en todos los módulos**).
⚠ En clientes potenciales el filtro `# Ref` sigue **sin existir**: `[id$=":n_ref"]` **no está en el DOM**.

### 🔴 La conversión de moneda NO siempre divide — depende de la moneda de la transacción

| Playa observada | Monto | Conv. | Operación |
|---|---|---|---|
| capitalina / Isla Coche | **BS** | US$ | `50.687,24 / 724 = 70,01` → **dividir** |
| el_valle / La Tortuga | **US$** | BS | `30,00 × 725,75 = 21.772,50` → **multiplicar** |

Asumir siempre división produce **falsos `WEB-CALC-MISMATCH`** en las playas que operan en US$.
`verificarConversion()` deduce la dirección de las monedas y, si no puede, **no juzga** en vez de adivinar
(`opts.direccion` la fuerza). `[el_valle-20260728]`

✅ **RESUELTO `[el_palmar-20260805]` — la moneda puede rotularse `VES`/`USD`, no solo `BS`/`US$`.** En Isla Coche
`parseMoneda()` no reconocía esos literales ⇒ `verificarConversion()` devolvía **`ok:null`** en toda la playa
("no se pudo deducir la dirección"), la causa más probable de un falso *"no evaluable"*. **Ya corregido en
`web-helpers.js`**: el regex reconoce `USD|VES` y los **normaliza** a `US$|BS`, de modo que `VES→USD` deduce
**dividir** y `USD→VES` **multiplicar**. Cubierto por 3 aserciones del self-test (93/93 OK).

⚠ **Aparece un TERCER rótulo local: `BSD` `[difranca-20260807]`.** En El Yaque el `<select>` Moneda lista
literalmente **`BSD`** y **`US$`** (no `BS`, no `VES`). Si `parseMoneda()` solo normaliza `USD|VES`, **`BSD`
puede no ser reconocido** y `verificarConversion()` vuelve a devolver **`ok:null`** en toda la playa.
⇒ **verificarlo antes de cotejar importes** y, si pasa, pasar **`opts.direccion` explícito**
(**US$ → BSD = multiplicar**; tasa medida 752,0900). ⚠ La misma UI mezcla **`USD`** y **`US$`** entre empresas
del mismo tenant (literales distintos en `co_currency`) — el filtro va por `id_currency`, pero el parser ve los dos.

🔴 **Anti-patrón nuevo — `Monto conv.` de la LISTA no es derivable de `Monto cobrado`.** Salen de fuentes
distintas. Un oráculo que asuma `Monto conv. == Monto cobrado / Tasa` marca MISMATCH **por la razón equivocada**.
El oráculo correcto es contra **BD**, no entre columnas de la lista. `[el_palmar-20260805]`

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
✗  Detectar un .ui-dialog con offsetParent!==null → PrimeFaces lo deja con offsetParent null aunque esté
                                                    ABIERTO (el visor de adjuntos "no abría"). Usar
                                                    getComputedStyle(d).display === 'block'  [difranca-20260807]
✗  Poblar filtros + Buscar + leer en la MISMA     → el poll se rompe con una condición que YA se cumple con
   evaluate                                         el contenido previo → falsa lectura de «filtro # Ref
                                                    ignorado». Esperar asentamiento y RELEER en una llamada
                                                    aparte.  [difranca-20260807]
✗  Credenciales dentro del código o del archivo   → ver "SEGURIDAD DEL LOGIN"  [difranca-20260807]
   que carga browser_run_code_unsafe
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
Ruido **nuevo** a filtrar (widget de noticias): `Last year was the hottest on record for the Arctic…` ·
`Minimum extent of sea ice…` · `Right… my friend…`. `[el_palmar-20260805]`

### 🔴 DOS reglas OPUESTAS de lectura del detalle — hay que usar las dos, y varían por página

| Qué se lee | Regla que funciona | Qué pasa con la otra |
|---|---|---|
| **Cabecera** (`No. de Ref.`, `Estatus`, `Fecha`, `Nombre del cliente`, `Vendedor`, `Empresa`, `Responsable`, `Comentario`, `Ubicación`) | **`leerHojas` + hoja-siguiente** | `leerCabecera` devuelve **todo vacío** salvo `Coordenada de transacción` |
| **Pie de totales** de `detalleCobro` (`Monto total base`, `…descuento`, `Retención IVA/ISLR`, `Monto total IGTF`, `Total Monto a pagar`, `Tasa de conversión`) | **mismo padre (`leerCabecera`)** | con la regla de cabecera el pie sale **vacío** y `Tasa de conversión` se contamina con `"Documentos Pagados"` |
| **`detalleInventario` y `detalleDeposito` (completos)** | **`leerHojas` + hoja-siguiente** (resolvió el 100 %) | `leerCabecera` devolvió **las 12 claves en `""`** |

⚠ **`leerHojas` + hoja-siguiente ABSORBE los títulos de sección:** `Web:` quedó emparejado con `Contacto`, que es
el encabezado de la sección siguiente. **Descartar como valor toda hoja que sea un título conocido**
(`Datos Básicos`, `Dirección`, `Contacto`, `Observaciones`). ⚠ En clientes potenciales la etiqueta del RIF es
**`Cédula::`** (doble dos-puntos) y contiene el **RIF**. `[el_palmar-20260805]`
⚠ **En El Yaque esa misma etiqueta salió como `Cédula:` con UN solo `:` `[difranca-20260807]`** ⇒ **normalizar
con `/:+$/`**, que cubre los dos builds.

🔴 **Las DOS reglas CONVIVEN EN LA MISMA PÁGINA `[difranca-20260807]`** — no es "una regla por página".
En `detallePedido`: **padre-primero** resuelve el **pie de totales** (`Subtotal bruto`, `Descuento bonif.`,
`Monto Base Pedido`, `Monto Base Pedido Conversion`, `Monto Total Pedido`, `Conversiòn Monto Total`) y
**hoja-siguiente** resuelve la **cabecera** (`No. de Ref.`, `Código pedido`, `Vendedor`, `Estatus`…).
⇒ **correr las DOS y quedarse con la que da valor, campo por campo.**

⚠ **Ruido adicional a descartar como valor** (además de los títulos de sección): **encabezados de tabla** y
**textos de botón**.

| Página | Etiqueta | Se le pega (falso valor) |
|---|---|---|
| `detallePedido` | `Conversiòn Monto Total` | el **`N°`** del encabezado de la tabla de líneas |
| `detallePedido` | `Sucursal:` (vacía) | el botón **`Descargar adjuntos`** |
| `detalleVisita` | `Ubicación:` | **`Combinaciones de teclas`** (controles del mapa) |
| `detalleDevolucion` | `Precinto:` | **`Observaciones`** (título de sección, **sin `:`**) |

## Sesión y transporte del bundle

- 🔴 **La sesión JSF CADUCA entre tandas y `navigate` NO falla: devuelve `login.xhtml`.** ⇒ **chequear
  `document.title`/`location.pathname` tras cada `navigate`** y re-loguear. `[el_palmar-20260805]`
  ⚠ **Re-loguear SIEMPRE por el árbol de accesibilidad**: los IDs `#j_idt12/#j_idt14/#j_idt16` que se
  documentaban acá **ya no son los del formulario** `[difranca-20260807]`.
- 🔴 **Diálogo de INACTIVIDAD de sesión `[difranca-20260807]`**: `¿Estas Aquí? La Sesión se cerrará…` aparece a
  los pocos minutos y **ROBA EL CLICK** (hizo fallar una descarga de adjuntos). ⇒ **detectarlo y pulsar `Ok`
  antes de cualquier acción.** ⚠ **No se detecta con `offsetParent !== null`** — ver anti-patrones.
- 🔑 **El bundle DOM no sobrevive a `browser_navigate`, pero `sessionStorage` sí** (~40 % menos tokens): guardar
  `install.toString()` en `sessionStorage.qa` una vez y arrancar cada página con el bootstrap de una línea
  `()=>{eval('('+sessionStorage.qa+')()'); return Q.DET()}`. Reconfirmado en 3 tandas. `[el_palmar-20260805]`
  ✅ **Reconfirmado en 8 navegaciones seguidas en El Yaque `[difranca-20260807]`.**
- 🔴 **El bundle NO sobrevive tampoco a `Consultar`** — el detalle es **navegación completa, no ajax**. Para el
  detalle usar un **lector autocontenido**: una sola `browser_evaluate` que define sus helpers y devuelve el JSON. `[el_palmar-20260805]`
  ✅ **MATIZ `[difranca-20260807]`: el transporte por `sessionStorage` SÍ sobrevive a `Consultar`** — lo que no
  sobrevive es el objeto ya instalado en el DOM. Receta validada: **dos instaladores**, `sessionStorage.qaQ`
  (listas) y `sessionStorage.qaD` (detalles), **rehidratados con `eval('('+sessionStorage.qaQ+')()')` tras cada
  `navigate` Y tras cada `Consultar`**. Ahorro grande frente al lector autocontenido repetido.

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

## Tablas hijas del detalle — anclar por COLUMNAS, nunca por su `j_idt*` `[el_palmar-20260805]`

| Página | Tabla de líneas | Cómo anclarla | Columnas / caveat |
|---|---|---|---|
| `detalleDevolucion` | `form:j_idt169` → hoy **`form:j_idt170`** `[difranca-20260807]` | `tablaPorColumnas(['Lote','Fecha vencimiento'])` | `N° · Cod. producto · Producto · Lote · N° Factura · Fecha vencimiento · Devolución en · Motivo · Cantidad`. **Cero columnas de dinero** ⇒ no construir oráculo de importes |
| `detallePedido` | `form:pedidosDT` (**mismo id que la lista**) | ver `web-selectors/pedidos.md` | ⚠ `Monto Total` / `Monto conv.` traen **dos valores en una celda** ⇒ partirlas `[difranca-20260807]` |
| `detalleInventario` | `form:pedidosDT` | por id (semántico) | `N° · Cod. producto · Producto · Estructura · Depósito · Exhibición · Lote · Fecha expiración`. ⚠ **La ubicación NO es una columna**: `exh` se expresa poniendo la cantidad en **Exhibición** y dejando **Depósito = `-`** |
| `detalleDeposito` | `form:j_idt163` | `tablaPorColumnas(['N° Ref cobro','Monto cobrado'])` | lista **las formas de pago del cobro vinculado**, repitiendo el mismo `N° Ref cobro` por fila ⇒ **NO sumar sus filas contra el monto depositado** |
| `detalleCobro` | ver `web-selectors/cobros.md` (`j_idt177` → hoy **`j_idt178`**) | — | — |

🔴 **PRUEBA VIVA de la regla `[difranca-20260807]`: entre El Palmar y El Yaque los dos `j_idt*` de detalle se
CORRIERON en +1** (`detalleDevolucion` 169→**170**, pagos de `detalleCobro` 177→**178**). Cualquier lector que
los hubiese tenido cableados **habría leído la tabla equivocada o `null`**. ⇒ **anclar SIEMPRE por columnas**:
`['Lote','Fecha vencimiento']` y `['Forma de pago','Monto cobrado']`.

## Enlaces cruzados entre módulos (oráculos gratis)

- **Depósito → cobros:** la tabla hija del detalle de depósito lista los cobros con `N° Ref cobro` y
  `Monto cobrado` ⇒ **Σ(hijos) == `Monto depositado`** de la cabecera, y salto directo al módulo de cobros.
- **Inventario → pedido:** la cabecera trae `Ver Pedido Relacionado`.

## Mapas de Google embebidos

Presentes en clientes potenciales, visitas, inventarios y devoluciones. **Carga externa** → nunca esperar por el
mapa ni bloquear un caso si no carga; esperar por un dato propio de la página. La `Coordenada de transacción`
(`lat,lng`) sí es dato verificable. `[f0-2807]`

## 📎 Descarga de adjuntos — SÍ es testeable (probado 2026-07-28)

El botón **`Descargar adjuntos`** del detalle genera un **ZIP real** y Playwright puede capturarlo.
Verificado end-to-end en La Tortuga: `cobro_119.zip`, **144 KB, 3 entradas, en 1,2 s**.

```js
// en browser_run_code_unsafe (acá `page` ES la página web, no el WebView)
const boton = page.getByRole('button', { name: /Descargar adjuntos/i }).first();  // ⚠ por TEXTO: el id es j_idt*
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 30000 }),
  boton.click(),
]);
const nombre = download.suggestedFilename();   // → "cobro_119.zip"
const ruta   = await download.path();          // espera a que termine
const falla  = await download.failure();       // null si salió bien
```
Verificar afuera (Bash/PowerShell): **magic bytes `PK\x03\x04`**, tamaño > 0 y **listar entradas** con
`[System.IO.Compression.ZipFile]::OpenRead(...)`. ⚠ `tar -tf` **no** pudo listar estos ZIP.

🔴 **BORRAR EL ZIP DESPUÉS.** Contiene **adjuntos reales de un cliente productivo** (fotos, documentos).
No dejarlo en disco ni commitearlo.

⚠ **Los botones aparecen AUNQUE NO HAYA ADJUNTOS `[difranca-20260807]`:** `detalleClientePotencial` expone
`Descargar Adjunto` y `Ver adjuntos` con `nuAttachments = 0`. ⇒ **el esperado de la familia `A##` en este build
NO es "el botón no aparece"**; hay que verificar el contenido, no la presencia del control.
⚠ El **visor** de adjuntos es un `.ui-dialog`: **no se detecta con `offsetParent !== null`** (ver anti-patrones),
y el **diálogo de inactividad** puede robarle el click.

### 🔑 El oráculo son DOS tablas, no una

El ZIP trae **imágenes + documentos**, y se registran por separado:

| Tabla | Qué guarda | Ejemplo |
|---|---|---|
| `transaction_image` | **fotos** (las del adjunto de cámara) | `119_0.jpeg`, `119_1.jpeg` |
| `transaction_files` | **documentos** | `119_0.pdf` |

⚠ **Contar solo `transaction_files` da un falso negativo:** para el cobro 119 esa tabla dice **1 archivo**
pero el ZIP trae **3**. Verificado: la unión de ambas da exactamente las entradas del ZIP.

```sql
SELECT id_transaction ref,
       count(*) FILTER (WHERE origen='imagen')  imagenes,
       count(*) FILTER (WHERE origen='archivo') archivos,
       count(*) total_esperado_en_zip
FROM (SELECT id_transaction,'imagen'  origen FROM transaction_image WHERE na_transaction='cobros'
      UNION ALL
      SELECT id_transaction,'archivo'        FROM transaction_files WHERE na_transaction='cobros') x
GROUP BY id_transaction ORDER BY id_transaction;
```
Cambiar `'cobros'` por el módulo. *(Hay además `transaction_signatures` para las firmas; en el ZIP del 119
no venían — verificar por módulo antes de incluirlas en la cuenta.)*

## Formato de datos (es-VE)

- **Números:** `.` = miles · `,` = decimales → `2.000.000,00`. Parsear con `s.replace(/\./g,'').replace(',','.')`.
- **Moneda:** sufijo ` BS` / ` US$`.
- **Fechas:** `DD/MM/YYYY HH:mm:ss`. Veredicto **por día** (móvil UTC-4 vs servidor UTC) — igual que `RUNTIME §10.b`.
- **Tasa:** `"724,00 BS = 1 US$"` → extraer el número antes de ` BS`.

## Filtros de lista (patrón común)

Botones `Buscar` · `Limpiar` · `Columnas`. El filtro **`# Ref`** es la llave de cotejo con el móvil
(Nro.Ref UI = `id_<x>` = PK del servidor, ver `RUNTIME §10`) — es como el agente web encuentra
el registro que creó la corrida móvil, sin discovery.

### ⏱ Espera fiable de ajax de PrimeFaces (sin `waitForTimeout` a ciegas) `[difranca-20260807]`

```js
const jq = (window.PrimeFaces && PrimeFaces.$) || window.jQuery;
await new Promise(r => setTimeout(r, 600));
for (let i = 0; i < 80; i++) { if (jq.active === 0) break; await new Promise(r => setTimeout(r, 250)); }
await new Promise(r => setTimeout(r, 1000));   // settle del render
```
100 % en los 5 módulos. 🔴 **El settle final de 1 s es NECESARIO**: sin él el `<select>` de vendedor de visitas
se lee todavía en el placeholder (fue la causa del único reintento de la tanda).

### 🧹 Receta para LIMPIAR / CAMBIAR un combo de filtro (`Limpiar` no lo hace) `[difranca-20260807]`

En **una sola `evaluate`**, sin `browser_click` (respeta la regla de oro: nada de `j_idt*`):

1. `[id$=":<suf>_label"]`.click()
2. esperar ~600 ms
3. click sobre el `li.ui-selectonemenu-item` **filtrado POR TEXTO** dentro de `[id$=":<suf>_panel"]` — para
   **limpiar**, el `<li>` cuyo texto es el **placeholder** (`'Moneda'`, `'Cliente'`…)
4. esperar ~2,2–2,5 s
5. **verificar `.ui-selectonemenu-label` Y el `value` del `<select>` espejo** antes de seguir

Validado en pedidos y cobros (Moneda y Empresa).

### 💎 Leer el CONTEO por el paginador, no por las filas del DOM `[difranca-20260807]`

```js
PF('cobrosDT').paginator.cfg.rowCount    // conteo real del servidor
PF('pedidosDT').paginator.cfg.rowCount
```
Salvó los 6 casos de filtros de cobros, que si no habrían quedado FAIL o BLOCKED cuando el `<tbody>` no pinta.
**Medir SIEMPRE las dos cosas: contados (paginador) y pintados (`<tr>` reales del `tbody`).**

🔴 **PERO `paginator.cfg.rowCount` QUEDA RANCIO:** en una carga fresca de `/pages/cobros` marcaba **30** (el
conteo de la búsqueda **anterior**) con el `<tbody>` en **0** ⇒ **NO vale como prueba de que la búsqueda se
ejecutó.** Solo es válido leído **después** de un `Buscar` cuyo ajax se esperó.
⚠ `PF('tablaVisit')` (visitas) **no** expone `paginator.cfg.rowCount` — contar links de página.
⚠ `.ui-paginator-current` viene **vacío** en El Yaque (plantilla sin `{currentPage} of {totalPages}`).

### 📅 Las fechas SÍ se pueden setear por widget `[difranca-20260807]`

```js
// localizar el widget SIN escribir el j_idt*:
Object.entries(PrimeFaces.widgets).filter(([k, v]) => /date[BF]/.test(v.id));
PrimeFaces.widgets['widget_form_j_idt115_dateB'].setDate('01/01/2024');
```
(`el.value = …` también quedó pegado en este build, pero el **widget es la vía segura**.) Corrige lo anotado
para Caribe en `playas.yaml`. ⚠ Recordar: **setear las fechas DESPUÉS del último cambio de `<select>`**.

### Mensajes de lista vacía — el literal **NO es uniforme** `[difranca-20260807]`

| Módulos | Literal |
|---|---|
| cobros · pedidos · devoluciones | `"No se encontraron registros."` |
| **visitas** | **`"No existe registro"`** |

Un oráculo que compare contra un único literal **da falso negativo en visitas**.

### ✅ El placeholder de `Status` vale `0`, no `""` — pero **NO filtra** `[difranca-20260807]`

A diferencia de Vendedor/Tipo/Moneda/Cliente (placeholder `value=""`), el de `Status` (`:orderStatus`) vale
**`0`**. **Se sospechó que actuaba como filtro real (`st=0`) y se DESCARTÓ**: con el placeholder puesto los
conteos de cobros coinciden exactamente con BD. **Anotado para no volver a perseguirlo.**
Opciones reales: cobros `7 Enviado` / `27 Por aprobar` · pedidos `6 Enviado` / `26 Por aprobar` / `-1 Guardado`.
