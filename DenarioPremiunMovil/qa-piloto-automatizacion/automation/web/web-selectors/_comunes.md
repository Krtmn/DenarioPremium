# Selectores web — comunes a todos los módulos

> Memoria viva de la web (JSF/PrimeFaces). Espejo de `automation/cdp/module-selectors/_comunes.md`.
> Origen: reconocimiento F0 2026-07-28, Isla Coche · empresa CAPITALINA DE ALIMENTOS 212, C.A.
> Playas consolidadas: `[f0-2807]` La Tortuga · `[el_valle-20260728]` · `[el_palmar-20260805]` Isla Coche ·
> `[difranca-20260807]` **El Yaque / difranca** (5 módulos, 3 empresas, read-only) ·
> `[run_vzla-20260818]` / `[run_vzla-20260819]` **La Tortuga / CORPORACION FERRE 19** (7 módulos, 4 tandas web).
> Todo patrón nuevo confirmado en 1 corrida entra acá con su tag. Consolidar filas antes de agregar.
> Módulos con archivo propio: `cobros.md` · `pedidos.md` · `visitas.md` · `inventarios.md` ·
> `devoluciones.md` · `depositos.md` · `clientesPotenciales.md`.

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

## ⚠️ TRES CORRECCIONES A ESTE ARCHIVO — **medidas en El Yaque, a VERIFICAR POR BUILD** `[grupo_fiel-20260817]`

> 🔴 **No derogan las notas de `[difranca-20260807]`: las ponen en duda.** Las tres se midieron en una sola playa
> y contradicen lo documentado. **Re-medirlas al inicio de cada corrida** — es barato — en vez de asumir
> cualquiera de las dos versiones.

| # | Lo que dice la doc `[difranca-20260807]` | Lo medido en grupo_fiel | Qué hacer |
|---|---|---|---|
| 1 | **Los filtros JSF PERSISTEN** y sobreviven a `browser_navigate`/`page.goto` (sección de abajo) | **Ya NO persisten** a `browser_navigate` | **Seguir leyendo el estado real de todos los `select` antes del 1.er `Buscar`** (el snippet de abajo). La lectura es la defensa; sirve igual en los dos builds |
| 2 | `Limpiar` **NO** resetea las fechas en cobros y pedidos | **`Limpiar` SÍ resetea las fechas en COBROS** | Verificar tras pulsar `Limpiar`, no asumir |
| 3 | Visitas **no** tiene filtro de vendedor | **Visitas SÍ tiene filtro de vendedor** en El Yaque: `[id$=":idSalesman_input"]` | Comprobar la existencia del control antes de marcar el caso N/A |

**Filtro nuevo también en visitas:** `[id$=":selectAttach_input"]` (*Adjuntos*, 3 opciones) — permite listar
directamente los registros con adjunto sin barrer toda la lista.

## 🔴 DICTAMEN sobre los filtros — medido en 4 tandas seguidas `[run_vzla-20260818][run_vzla-20260819]`

### 🔴🔴 Los COMBOS sobreviven a `browser_navigate`; el `# Ref` **no**

Medido de forma tajante en `/pages/clientesPotenciales`: **entrada fresca al módulo** y el `<select>` Vendedor
seguía en **`470`** de una tanda anterior, mientras `[id$=":n_ref"]` llegaba **vacío**.
**Costó un falso «la web pierde 6 clientes potenciales»** (con el combo en su placeholder: 6 = 6 ✅).

> **Matiz honesto de la 4.ª tanda `[run_vzla-20260819]`:** en los **4 módulos** de ese día los combos **sí**
> llegaron limpios tras `browser_navigate`. ⇒ **lo obligatorio no es el reseteo: es la VERIFICACIÓN.**
> Leer el estado real de cada combo antes de medir — nunca suponerlo, en ninguno de los dos sentidos.
> (Esto reconcilia las versiones opuestas de `[difranca-20260807]` y `[grupo_fiel-20260817]`: **las dos se
> observaron**, y la lectura previa es la defensa que sirve en ambos builds.)

### ⚠ Cambiar DOS combos en la misma `evaluate` es una CARRERA

`setCombo(A); setCombo(B)` en una sola llamada dejó **A sin aplicar** (el `<select>` espejo conservó el valor
anterior): el ajax de A **re-renderiza el panel** mientras B lo está tocando. Produjo un falso *«el filtro
Actividad devuelve 73 en vez de 317»*. ⇒ **UN combo por `evaluate`, y releer el `value` del `<select>` espejo
DESPUÉS DE CADA COMBO** — no solo antes de `Buscar`. Amplía la regla *«elegir → esperar → verificar»*.

⚠ **Reconfirmado: poblar + `Buscar` + leer en la MISMA `evaluate` devuelve la tabla ANTERIOR.**
`setCombo('orderStatus','Aprobado') + buscar() + conteo()` devolvió **229** (el resultado previo) con la columna
`Estatus` mezclada; releído en llamada aparte, **729** y columna homogénea. **Leer siempre aparte.**

### ✅ `Limpiar` en este build — **corrige la nota `[difranca-20260807]` #2**

| Módulo | `# Ref` | Fechas | Combos |
|---|---|---|---|
| pedidos · cobros · devoluciones · inventarios · depósitos | ✅ se vacía | ✅ **vuelven al mes en curso** | ❌ **NO los toca** |
| **clientes potenciales** | (no tiene filtro) | 🔎 **quedan VACÍAS** ⇒ lista la población completa | ❌ **NO los toca** |

⇒ La nota *«`Limpiar` NO resetea las fechas en cobros y pedidos»* **queda corregida**: en este build **sí** las
resetea, salvo en clientes potenciales, donde las **borra**. **En ningún módulo toca los combos** ⇒ hay que
limpiarlos a mano (`Cliente`, `Tipo`, `Status`, `Adjunto`, `Coordenadas`), uno por `evaluate`.

### ⚠ El literal del combo de ADJUNTOS cambia entre módulos — **tres juegos distintos**

| Módulos | Placeholder | Opciones |
|---|---|---|
| pedidos · cobros · devoluciones · inventarios | — | **`SI` / `NO`** |
| **visitas** | — | 🔴 **`Tiene Adjuntos` / `No Tiene Adjuntos`** |
| **clientes potenciales** | 🔴 **`Tiene Adjunto`** (`value = 0`) | `SI` / `NO` |

🔴 **El placeholder de clientes potenciales se llama casi igual que un filtro real**: un
`setCombo(…, 'Tiene Adjunto')` **deja el filtro sin aplicar creyendo que lo aplicó**.
Y un `setCombo(…, 'SI')` genérico **falla en visitas**.

### Mapa de sufijos por módulo — medido en este build

```
pedidos       :idEnterprise :idSalesmaView :clientSOM :idOrderType :orderStatus :attachStatus
              :n_ref :dateB/:dateF :ajax :botonLimpiar
cobros        + :idTipo  + :idDep                      (sin :idCurrency en este tenant)
devoluciones  :idEnterprise :idSalesmaView :clientSOM :orderStatus :attachStatus :n_ref :dateB/:dateF :ajax
inventarios   idénticos a devoluciones
depositos     :idEnterprise :idSalesmaView :orderStatus :n_ref :dateB/:dateF   (sin Cliente ni Moneda)
clientesPot.  :idEnterprise :idSalesmaView :attachStatus :dateB/:dateF :ajax   🔴 SIN :n_ref
visitas       :idRol :idSalesman :idClient :idEstatus :idType :idMotive :selectAttach
              :selectDispatch :selectCoordinadas :n_ref :dateB/:dateF :btnBuscar   (NO :ajax)
```

- **Visitas** usa `:idSalesman` (**no** `:idSalesmaView`), `:idClient` (**no** `:clientSOM`) y `:btnBuscar`
  (**no** `:ajax`), y **sí tiene filtro de vendedor** (confirma la corrección `[grupo_fiel-20260817]`).
- **`PF('tablaVisit')` no expone paginator** (reconfirmado) ⇒ en visitas el conteo se lee de
  `.ui-datatable-header` → `Total de Resultados: N`, que **sí** está y es fiable.
- 🔴 **El `value` del `<select>` Empresa cambia POR MÓDULO dentro del mismo tenant** — `FERRE_N`
  (`co_enterprise`) en **pedidos y clientesPotenciales**, `1` (`id_enterprise`) en el resto ⇒ **anclar por TEXTO.**
- 🔴 **9.ª confirmación de que nunca se ancla por `j_idt*`:** los prefijos difieren **entre módulos de la misma
  sesión** (`j_idt114` vs `j_idt115` vs `j_idt116`) y **van y vienen entre builds — no es deriva monótona.**

## 🔴🔴 LOS FILTROS PERSISTEN EN LA SESIÓN y sobreviven a `page.goto` `[difranca-20260807]` — ⚠ ver corrección #1 arriba

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
| **visitas** | ✅ **SÍ tiene `[id$=":n_ref"]`** — corregido `[kron-20260817]`, reconfirmado `[run_vzla-20260818]`. ⚠ la COLUMNA se llama `Ref`, no `# Ref` (ver `visitas.md`) |
| **clientes potenciales** | ❌ **sin FILTRO** de Ref (`[id$=":n_ref"]` **no está en el DOM**) → llegar por **vendedor + rango de fechas** y **desambiguar por la columna `# Ref` de la lista**. ✅ El barrido es exacto, no aproximado. Reconfirmado `[run_vzla-20260818/19]` |

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
- 🔴 **PERO NUNCA `navigate` directo a un módulo justo después de un POST de OTRO módulo `[kron-20260817]`.**
  El servidor devuelve `<partial-response><error-name>java.lang.IndexOutOfBoundsException` y la página queda
  **en blanco** (`document.title === ''`, 0 `form`). ⇒ **pasar por `/pages/main` primero.**
  **Chequeo barato después de todo `navigate`: `document.title !== ''`.**
- 🟢 **`page.addInitScript(bundle)` reinstala el bundle solo en cada navegación `[kron-20260817]`** — se paga una
  vez y sobrevive a los `Consultar` (que son navegación completa, no ajax). **Elimina el re-pegado por módulo.**
  ✅ **Reconfirmado `[run_vzla-20260818]`:** instalado **una vez** al inicio, `window.__qaW` siguió vivo tras
  ~20 `browser_navigate`, todos los `Buscar` y los 7 `Consultar`, **sin reinstalarse**.
- 🟢 **`hit(el)` (ejecutar el `onclick`) al 100 % `[run_vzla-20260818][run_vzla-20260819]`** — ~45 `Buscar`/`Limpiar`
  + 13/13 `Buscar`/`Consultar` **sin un solo `chrome-error://`**. El anti-patrón `boton.click()` sigue vigente.
- 🟢 **Pasar por `/pages/main` entre módulos evita el `IndexOutOfBoundsException`** — aplicado en los 7 + 5
  saltos de módulo: **0 páginas en blanco**. `[run_vzla-20260818][run_vzla-20260819]`

## Anti-patrones (prohibidos)

### 🔴🔴 `boton.click()` sobre `Buscar`/`Limpiar` puede NAVEGAR A `chrome-error://` — hay que ejecutar el `onclick` `[kron-20260817]`

Los botones son `<button type="submit">` con `onclick="PrimeFaces.ab({...});return false;"`. Un `.click()` desde
`evaluate` **no cancela el default** ⇒ dispara un **submit completo en vez del ajax**: en `/pages/cobros` acabó en
`chrome-error://chromewebdata/` y **se perdió el contexto de la página**. Es también la causa raíz del falso
"filtro de fechas roto" de `/pages/visitas`.

⚠ **Y una sola vía NO alcanza: los botones de ADJUNTO usan `event` en su `onclick`** (`PrimeFaces.bcn(this,event,[…])`)
⇒ `new Function(oc)` a secas revienta con `TypeError: Cannot read properties of undefined`.
**Helper único que funcionó al 100 % en las dos familias (30+ búsquedas + toda la tanda de adjuntos):**

```js
const hit = (el) => {
  const oc = el.getAttribute('onclick');
  if (oc) { try { new Function('event', oc).call(el, new MouseEvent('click')); } catch(e) { el.click(); } }
  else el.click();
};
```

⚠ **`hit()` saltea el `disabled`** — ver la nota de adjuntos: comprobar `boton.disabled` **antes** de invocarlo, o
se produce un artefacto de automatización que no refleja la experiencia real.

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

### 🔑🔑 REGLA PREFERENTE — `document.getElementById('form').innerText` resuelve cabecera Y pie de una sola vez `[grupo_fiel-20260817]`

**Reemplaza con ventaja** el par «padre-primero + hoja-siguiente» de más abajo (que sigue documentado como fallback).
Cada línea del `innerText` es **o bien** `"Etiqueta:"` con el valor en la **línea SIGUIENTE** (patrón de cabecera),
**o bien** `"Etiqueta: valor"` en la **MISMA línea** (patrón de pie de totales). Se prueban las dos formas por campo.

```js
const txt = document.getElementById('form').innerText;      // ⚠ getElementById, NO querySelector
const lineas = txt.split('\n').map(s => s.replace(/\s+/g,' ').trim()).filter(Boolean);
// por cada línea que termine en ':' → probar (a) resto de la misma línea, (b) lineas[i+1]
```

- 🔴 **`document.querySelector('form')` NO SIRVE:** la página tiene **4 `form`** y el primero (`menuform`) tiene
  **86 caracteres**. Hay que tomar **`#form`** (o, en su defecto, el `form` de mayor `innerText`).
- ✅ **Es inmune al typo `class="font.-bold"`** de `detalleVisita` (no ancla por clase) y resuelve el **pie** de
  `detalleCobro`/`detallePedido`, que con padre-primero sale **corrido en uno** (cada etiqueta absorbe la siguiente).
- 🔴 **GUARD OBLIGATORIO para `Cédula::`:** con la regla «misma línea», `"Cédula::"` matchea y devuelve el valor
  `":"`, **ocultando el RIF que está en la línea siguiente** — casi produce un falso `WEB-FIELD-MISMATCH`.
  ⇒ **si el valor capturado en la misma línea no contiene ningún alfanumérico, descartarlo y caer a la siguiente.**

#### 🔴 CORRECCIÓN a la regla del fallback y guardas nuevas `[kron-20260817]`

- 🔴 **El fallback "el valor está en la línea siguiente" NO puede descartar líneas que contengan `:` — la HORA los trae.**
  Con esa regla, `Fecha planeada de visita:` → `17/08/2026 16:57:33` **se perdía**.
  **Regla correcta: la línea siguiente ES el valor, salvo que (a) TERMINE en `:` o (b) sea texto de botón.**
  Lista negra validada: `Descargar adjuntos|Ver adjuntos|Regresar|Imprimir|Volver|Consultar`.
  Con eso **`Firma:` deja de absorber `Descargar adjuntos`**.
- ⚠ **Trampa del mismo tipo: los TÍTULOS DE SECCIÓN se cuelan como valor.** En `detalleClientePotencial`, `Web:`
  está vacío y el parser toma **`Contacto`**, encabezado de la sección siguiente (BD `na_web_site = NULL` ⇒ el
  valor real es **vacío**). **Mantener también una lista negra de títulos de sección.**
- ⚠ **Guarda de longitud:** en `detalleInventario` **las filas de la tabla de lotes entran como claves**.
  ⇒ **descartar claves de más de ~60 caracteres o que contengan varios campos.**
- ⚠ **Artefactos conocidos del lector — ninguno es defecto, todos a filtrar:** `Comentario:` vacío absorbe
  `Descargar adjuntos` · `Firma:` vacía absorbe `La Transacción no tiene coordenadas asignadas` ·
  `Precinto:` absorbe `Observaciones` · `Conversión IVA` absorbe `Monto Total Pedido: …`.
  ✅ **Reconfirmado 8/8 detalles en 7 módulos, con los dos artefactos de siempre `[run_vzla-20260819]`:**
  (a) 🔴 **la HORA se cuela como clave** — `Fecha del cobro: 18/08/2026 07:34:56` genera además la entrada basura
  `"18/08/2026 07" → "34:56"` ⇒ **descartar toda clave con patrón de fecha**; (b) en `detallePedido` **`IVA:`
  absorbe `Monto Total Pedido:`** ⇒ el valor correcto se recupera leyendo la clave siguiente.
- ⚠ **`Observaciones` es título de sección SIN `:` en devoluciones y CON `:` en depósitos — manejar ambos.**
  En devoluciones es el contenedor real de `tx_description` (el valor va en la línea siguiente): un lector que
  exija etiqueta con `:` **pierde el campo**.
- ⚠ **`Empresa` en el DETALLE sí trae el punto final** (`CHOCOLATES KRON, C.A.` = `na_enterprise`); el rótulo sin
  punto (`lb_enterprise`) **no apareció en ninguno de los 6 detalles** ⇒ **el rótulo depende de DÓNDE se lea**:
  en la app móvil es `lb_enterprise`, en el detalle web es `na_enterprise`.
- ✅ **Guardas ya conocidas que siguen vigentes:** claves con patrón de fecha · `Cédula::` (ver arriba).

> 🔴🔴 **`detalleVisita.xhtml` usa `class="font.-bold"` — CON UN PUNTO** (typo del build). `span.font-bold` **no
> matchea nada** en esa página; es la única de las 7 que rompe el patrón. **Nunca anclar por esa clase**: usar
> `span` genérico + `textContent.endsWith(':')`, o directamente la regla `#form.innerText` de arriba. `[grupo_fiel-20260817]`

### 🔴 DOS reglas OPUESTAS de lectura del detalle — *(fallback: preferir `#form.innerText` de arriba)* — hay que usar las dos, y varían por página

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

- 💎 **RECETA DE CICLO barata y estable — 3 llamadas por registro, 12/12 sin reintentos `[grupo_fiel-20260817]`:**
  `browser_navigate(/pages/{modulo})` → `evaluate(rehidratar + abrirRef('{tabla}', ref))` → `evaluate(rehidratar + leer)`.
  El `abrirRef` construye el mapa `# Ref → botón` y clickea `[id$=":consultar"]` **dentro de la misma fila** —
  nunca toca `Editar`/`Eliminar`/`Copiar` y es **inmune al corrimiento de índices**. Transporte por
  `sessionStorage` reconfirmado: sobrevivió a ~15 navegaciones y 12 `Consultar` **sin reinstalar**.
- 🔴 **Login en El Yaque: `browser_type` con target de rol a11y (`textbox "Usuario"`) FALLA en este MCP**
  (`Unexpected token "" while parsing css selector`). Vía que funciona 100 %: `input[placeholder="Usuario"]` ·
  `input[placeholder="Clave"]` · `button[type="submit"]`. `[grupo_fiel-20260817]`

- 🔴 **La sesión JSF CADUCA entre tandas y `navigate` NO falla: devuelve `login.xhtml`.** ⇒ **chequear
  `document.title`/`location.pathname` tras cada `navigate`** y re-loguear. `[el_palmar-20260805]`
  ✅ Reconfirmado en kron: la sesión estaba caducada al arrancar y el primer `browser_navigate` devolvió
  `login.xhtml` **sin fallar**; el transporte por `sessionStorage` sobrevivió al re-login y a las ~10
  navegaciones siguientes. `[kron-20260817]`
- 🔴🔴 **PEOR AÚN — LA SESIÓN EXPIRA A MITAD DE UNA TANDA Y LA WEB MIENTE `[kron-20260817]`.** El POST de `Buscar`
  devuelve **`302 → login.xhtml`** y **la tabla queda con el resultado ANTERIOR pintado**: se ven filas
  coherentes, con encabezado y conteo, que **no responden al filtro que se acaba de mandar**. Costó 3 intentos
  creyendo que el filtro estaba roto, con el body del POST llevando los parámetros **correctos**.
  ⇒ **Instrumentar el XHR y mirar el `status`, no solo el `loadend`.**
  **Firma inequívoca de sesión caída (≠ filtro roto): `Total de Resultados` que no cambia + filas con fechas
  FUERA del rango pedido.**
  🔑 **Receta de instrumentación que convirtió un ⛔ BLOCKED en descarte** — hookear
  `XMLHttpRequest.prototype.open/send` guardando `{url, body, status, ms}`, y esperar `jq.active===0` **Y** que
  todos los registros nuevos tengan `status !== null`, + settle 1,5 s. Permite además **leer qué parámetros
  viajaron**, que es la única forma tajante de separar *"filtro roto"* de *"artefacto de automatización"*.
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

### ⚠ Mapa MEDIDO — el detalle de cada módulo expone llaves DISTINTAS `[run_vzla-20260818]`

| Detalle | `No. de Ref.` | Epoch (`Código …`) | Estatus en el detalle |
|---|---|---|---|
| `detallePedido` | ✅ | ✅ `Código pedido` | ✅ |
| `detalleInventario` | ✅ | ✅ `Código inventario` | ❌ (solo en la lista) |
| `detalleDevolucion` | ✅ | ❌ | ❌ (solo en la lista) |
| `detalleVisita` | ✅ | ❌ | ❌ (solo en la lista) |
| `detalleClientePotencial` | ❌ | ✅ `Código` | ❌ |

🔴 **Un cotejo que exija AMBAS llaves en el detalle falla en 3 de 5 módulos.** ⇒ cotejar el epoch **solo donde
existe** y el **estatus desde la LISTA** cuando el detalle no lo trae. Ninguna de las ausencias es defecto.

## URLs de detalle (se llega por `Consultar`, no por URL suelta)

```
/pages/detalleCobro   /pages/detallePedido   /pages/detalleDevolucion   /pages/detalleDeposito
/pages/detalleClientePotencial              /pages/detalleInventario
/pages/protected/visitas/detalleVisita.xhtml     ← ⚠ visitas usa la forma legacy con /protected/ y .xhtml
```

## Tablas hijas del detalle — anclar por COLUMNAS, nunca por su `j_idt*` `[el_palmar-20260805]`

| Página | Tabla de líneas | Cómo anclarla | Columnas / caveat |
|---|---|---|---|
| `detalleDevolucion` | `form:j_idt169` → **`j_idt170`** `[difranca-20260807]` → **de vuelta a `j_idt169`** `[run_vzla-20260818/19]` | `tablaPorColumnas(['Lote','Fecha vencimiento'])` | `N° · Cod. producto · Producto · Lote · N° Factura · Fecha vencimiento · Devolución en · Motivo · Cantidad`. **Cero columnas de dinero** ⇒ no construir oráculo de importes. Ver `devoluciones.md` |
| `detallePedido` | `form:pedidosDT` (**mismo id que la lista**) | ver `web-selectors/pedidos.md` | ⚠ `Monto Total` / `Monto conv.` traen **dos valores en una celda** ⇒ partirlas `[difranca-20260807]` |
| `detalleInventario` | `form:pedidosDT` | por id (semántico) | ⚠ **En este build son 6 columnas: `Lote` y `Fecha expiración` NO SE GENERAN** `[run_vzla-20260818]` — ver `inventarios.md`. **La ubicación NO es una columna**: `exh` se expresa poniendo la cantidad en **Exhibición** y dejando **Depósito = `-`** |
| `detalleDeposito` | `form:j_idt163` (**reconfirmado** `[run_vzla-20260818]`) | `tablaPorColumnas(['N° Ref cobro','Monto cobrado'])` | lista **las formas de pago del cobro vinculado**, repitiendo el mismo `N° Ref cobro` por fila ⇒ **NO sumar sus filas contra el monto depositado**. Ver `depositos.md` |
| `detalleVisita` | **`form:visitasDT`** (semántico) | por id | tabla de **actividades**; ⚠ **no confundir con `form:tablaVisit`**, que es la LISTA. Ver `visitas.md` |
| `detalleCobro` | ver `web-selectors/cobros.md` (`j_idt177` → `j_idt178` → **de vuelta a `j_idt177`**) | — | ⚠ pero **`form:documentosPagadosDT` SÍ es semántico** y se puede anclar por id |

🔴 **PRUEBA VIVA de la regla `[difranca-20260807]`: entre El Palmar y El Yaque los dos `j_idt*` de detalle se
CORRIERON en +1** (`detalleDevolucion` 169→**170**, pagos de `detalleCobro` 177→**178**). Cualquier lector que
los hubiese tenido cableados **habría leído la tabla equivocada o `null`**. ⇒ **anclar SIEMPRE por columnas**:
`['Lote','Fecha vencimiento']` y `['Forma de pago','Monto cobrado']`.
🔴 **8.ª confirmación y matiz nuevo `[run_vzla-20260818]`: los dos VOLVIERON a su valor original** (170→**169**,
178→**177**) ⇒ **no es una deriva monótona, van y vienen entre builds.** Un lector "actualizado al último
número visto" acierta por casualidad la mitad de las veces.

## Enlaces cruzados entre módulos (oráculos gratis)

- **Depósito → cobros:** la tabla hija del detalle de depósito lista los cobros con `N° Ref cobro` y
  `Monto cobrado` ⇒ **Σ(hijos) == `Monto depositado`** de la cabecera, y salto directo al módulo de cobros.
- **Inventario → pedido:** la cabecera trae `Ver Pedido Relacionado`.

## Mapas de Google embebidos

Presentes en clientes potenciales, visitas, inventarios y devoluciones. **Carga externa** → nunca esperar por el
mapa ni bloquear un caso si no carga; esperar por un dato propio de la página. La `Coordenada de transacción`
(`lat,lng`) sí es dato verificable. `[f0-2807]`

✅ **La coordenada de `detalleVisita` / `detalleInventario` NO es texto visible `[run_vzla-20260819]`** — el
lector `#form.innerText` devuelve solo `Ubicación: Mapa`. Receta barata, **sin esperar a que Google cargue**:

```js
(document.getElementById('form').innerHTML
  .match(/-?\d{1,2}\.\d{4,},\s*-?\d{1,3}\.\d{4,}/) || [null])[0]
```

⚠ **El mapa REDONDEA a 6 decimales** (`11.048725` vs `11.0487251` en BD) ⇒ **comparar con tolerancia, nunca con
`===`**, o se canta un `WEB-FIELD-MISMATCH` inexistente.

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

### 🔴🔴🔴 SEGURIDAD DE DATOS — HAY **TRES** UBICACIONES DE DESCARGA, Y LA TERCERA ES INVISIBLE `[kron-20260817]`

> **Esta es la regla más importante de esta sección. Leerla antes de la primera descarga, no después.**

`download.delete()` **NO ALCANZA**. Tras descargar 8 ZIP con adjuntos productivos y limpiar las **dos**
ubicaciones documentadas, quedaban **7 archivos de 172 KB–335 KB** en una tercera:

| Ubicación | Cómo se ve | Detectable por extensión |
|---|---|---|
| `qa-piloto-automatizacion/` (cwd, recursivo) | `cobro_119.zip` | sí |
| `DenarioPremiunMovil/.playwright-mcp/` y `qa-piloto-automatizacion/.playwright-mcp/` | copia **RENOMBRADA** (`visita_107.zip` → `visita-107.zip`) | sí |
| 🔴 **`%TEMP%\playwright-artifacts-*\`** | el **cuerpo crudo** del download, **nombre UUID y SIN extensión** | **NO — invisible a `-Include *.zip`** |

⇒ **Protocolo obligatorio de limpieza, en las TRES ubicaciones y BARRIENDO POR FIRMA, no por extensión:**
buscar los primeros 4 bytes `PK\x03\x04` en todo archivo candidato y borrar. En kron se verificaron
**46 carpetas `playwright-artifacts-*`**, todas vacías al cierre. **Un barrido `-Include *.zip` da un falso
"todo limpio" y deja adjuntos de un cliente productivo en el disco.**

#### 🔴 Correcciones y hallazgos `[grupo_fiel-20260817]`

- 🔴 **EL VISOR DE ADJUNTOS ROBA EL CLICK** (igual que el diálogo de inactividad): su
  `.ui-widget-overlay.ui-dialog-mask` intercepta el click sobre `Descargar adjuntos`, Playwright reintenta 30 s
  y expira con un error engañoso. ⇒ **cerrar el visor ANTES de descargar** (`.ui-dialog-titlebar-close`) y
  confirmar `getComputedStyle(d).display !== 'block'`.
- 🔑 **Diagnóstico correcto de una descarga rota: `page.on('response')` + `content-type`/`content-disposition`.**
  `waitForEvent('download')` solo dice *"timeout"* y **no discrimina** *"el servidor no mandó el archivo"* de
  *"el click no llegó"*. Funcionó 7/7 y convirtió un BLOCKED en un defecto con evidencia.
- ⚠ **El MCP deja una COPIA del download en `.playwright-mcp/` aunque se llame `download.delete()`**, y además
  **RENOMBRA** `visita_107.zip` → `visita-107.zip` (guion, no guion bajo). ⇒ `dl.delete()` **no alcanza**:
  barrer explícitamente `DenarioPremiunMovil/.playwright-mcp/` además del cwd. Crítico por la regla de borrar
  adjuntos productivos.
- **URL de recurso de adjunto (post-fix):** `{origin}/denario/resources/images/{carpeta}/{ref}_{n}.jpeg?pfdrid_c=true`.
  Firmas aparte: `…/images/firmas/visitas/{ref}_{n}.jpg`. El contexto es **`/denario`**, **no** `/DenarioPremium`
  (`/DenarioPremium/resources/…` da **404**, probado). Ya **no** aparece `localhost:8282`.
  Carpetas: `cobros · pedidos · devoluciones · depositos · inventarios · visitas · clientes` — **`clientes`**,
  igual que `na_transaction` en BD (no `clientes_potenciales`, que era la duda abierta).
- **El visor `Ver adjuntos` sirve de oráculo de EXISTENCIA:** `.ui-dialog` con
  `getComputedStyle(d).display==='block'` (confirmado: `offsetParent` **no** sirve). Con 0 adjuntos **no abre**;
  con adjuntos sí ⇒ discrimina sin depender de la descarga.
- **IDs de los botones por módulo** (`j_idt*`, **NO anclar**): visitas `142`/`144` · cobros `161`/`163` ·
  pedidos `202`/`204` · inventarios `155`/`157`. Anclar siempre por texto `/descargar\s+adjunto/i` y `/ver\s+adjunto/i`.
- ⚠ **`require` no existe** dentro de `browser_run_code_unsafe` ⇒ el tamaño / magic-bytes del ZIP se verifica
  desde PowerShell con `[System.IO.Compression.ZipFile]::OpenRead`, nunca desde el snippet.

#### 🔴 Correcciones y hallazgos `[kron-20260817]` — Isla Coche, post-fix del rutero

- 🔴 **CORRIGE `[difranca-20260807]`: los botones de adjunto vienen `disabled` cuando NO hay contenido.**
  Aparecen, pero **inertes** (`disabled=true` + `ui-state-disabled`). ⇒ **el oráculo barato de existencia ya no es
  "¿abre el visor?" sino `boton.disabled`**, que además es lo que ve el usuario.
  ⚠ **El helper `hit()` que fuerza el `onclick` SALTEA el `disabled`** ⇒ un visor que abre vacío puede ser un
  **artefacto propio de la automatización**, no la experiencia real. Re-verificar por el camino honesto.
- 🔑 **`page.request.get(url)` es el diagnóstico DEFINITIVO del rutero de adjuntos** — devuelve `status` +
  `content-length` sin depender del DOM, y permite contrastar `/denario` vs `/DenarioPremium` y archivo nuevo vs
  viejo **en una sola llamada**. Más barato y más tajante que `page.on('response')`.
- **URL post-fix reconfirmada:** `{origin}/denario/resources/images/{carpeta}/{ref}_{n}.jpeg?pfdrid_c=true` → **200**.
  El contexto **`/denario`** queda probado por contraste (`/DenarioPremium/resources/…` → **404** con el mismo
  archivo nuevo). **Nunca apareció `localhost:8282`.**
- **Firmas: ruta propia con MÓDULO INTERMEDIO OBLIGATORIO.** `…/images/firmas/{modulo}/{ref}_{n}.jpg` → 200
  (`firmas/cobros/`, `firmas/inventarios/`, `firmas/devoluciones/`); **`firmas/{ref}_{n}.jpg` y
  `{modulo}/{ref}_{n}.jpg` dan 404**.
- 🔴 **Las firmas NO viajan en el ZIP ⇒ `nu_attachments` da un −1 SISTEMÁTICO.** Confirmado empíricamente: los 4
  cobros traen `nu_attachments=4` y el ZIP **3 entradas**; la cuarta es la firma (`transaction_signatures`).
  ⇒ **el oráculo es `transaction_image` ∪ `transaction_files`, NUNCA `nu_attachments`** — y una diferencia de
  exactamente 1 con firma presente **no es un defecto**.
- ⚠ **Los documentos (`.pdf`/`.xlsx`) de `transaction_files` SÍ aparecen en el ZIP** — no asumir que un registro
  "no tiene adjunto" porque no tiene imagen.

#### 🔴 Correcciones y hallazgos `[run_vzla-20260818]` — La Tortuga, **19/19 recursos en 200**

- 🔑🔑 **HAY UNA TERCERA RUTA, y su ausencia se lee como *"el rutero sigue roto"*: los DOCUMENTOS viven en
  `/resources/files/`, no en `/resources/images/`.**
  ```
  imágenes    {origin}/denario/resources/images/{carpeta}/{ref}_{n}.jpeg?pfdrid_c=true
  firmas      {origin}/denario/resources/images/firmas/{modulo}/{ref}_{n}.jpg
  documentos  {origin}/denario/resources/files/{carpeta}/{ref}_{n}.{pdf|xlsx}          ← 🆕
  ```
  Probado por contraste en la misma tanda: `images/clientes/193_0.pdf` → **404** ·
  `files/clientes/193_0.pdf` → **200 `application/pdf`**. Idem en pedidos, inventarios y devoluciones.
  ⚠ **La extensión hay que LEERLA de `transaction_files.na_file`, no asumirla:** visitas **2080** trae un
  **`.xlsx`** de 570 KB. Asumir `.pdf` da un 404 falso.
- 🆕 **La carpeta de `clientesPotenciales` es `clientes` y el número de la URL es el `# Ref` (`id_client`),
  NO el epoch `co_client`** — `…/images/clientes/193_0.jpeg`. Cierra el último módulo sin muestra post-fix.
- 🔑 **`page.request.get()` es el ÚNICO diagnóstico compatible con "no descargar".** Devuelve `status` +
  `content-type` + `content-length` de los 19 recursos **en una sola llamada**, sin `waitForEvent('download')`,
  sin `.playwright-mcp/` y **sin dejar nada en `%TEMP%\playwright-artifacts-*\`** ⇒ **vía obligatoria en
  tenant productivo.** 🔴 **SIEMPRE con los DOS controles negativos en la misma llamada** (contexto
  `/DenarioPremium` y archivo inexistente): **sin ellos un `200` no prueba nada** — puede estar sirviendo HTML.
- ⚠🔴 **La `Firma:` NO se lee con `#form.innerText` — es un `<img id="form:graImaPro">`** (150×120, el único
  `id` no-`j_idt*` del bloque). `innerText` no incluye imágenes ⇒ la firma sale "vacía" en los 5 detalles y se
  lee como *"la firma no se muestra"*. **Falso.** ⇒ **verificar por `naturalWidth > 0`, nunca por texto.**
  🔑 **Y si el `<img>` NO EXISTE en el DOM, es que NO HAY FIRMA** (no que no se pinte): comprobado contra
  `transaction_signatures` — 5 filas en todo el tenant, cero de cobros.
- ✅ **El visor se ancla por TÍTULO** (5/5 módulos), porque sus `j_idt*` cambian (`form:j_idt179` en clientes
  potenciales):
  ```js
  const d = [...document.querySelectorAll('.ui-dialog')]
    .find(x => /adjunto/i.test((x.querySelector('.ui-dialog-title')||{}).textContent||''));
  getComputedStyle(d).display === 'block';     // ⚠ NO offsetParent
  ```
  ⚠ **Hay otro `.ui-dialog` SIEMPRE presente: `j_idt49:timeoutDialog`** — *"¿Estas Aquí?"* (inactividad).
  Filtrar por título es lo que evita confundirlos.
- ⚠ **`nu_attachments` no es oráculo homogéneo ENTRE MÓDULOS:** en pedidos, inventarios, visitas y
  devoluciones **excluye la firma** (coherente con `[kron-20260817]`), pero en **clientes potenciales la
  INCLUYE** (ref 193: `4 = 2 img + 1 file + 1 firma`). ⇒ **el oráculo sigue siendo `transaction_image ∪
  transaction_files`**, nunca el contador.

⚠ **Los botones aparecen AUNQUE NO HAYA ADJUNTOS `[difranca-20260807]` — ⚠ CORREGIDO por `[kron-20260817]`, ver arriba:**
`detalleClientePotencial` expone
`Descargar Adjunto` y `Ver adjuntos` con `nuAttachments = 0`. ⇒ **el esperado de la familia `A##` en este build
NO es "el botón no aparece"**; hay que verificar el contenido **y el `disabled`**, no la presencia del control.
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

### 📄 Rows-per-page, orden y `paginator.cfg` completo `[grupo_fiel-20260817]`

- **`PF('<tabla>').paginator.cfg`** expone, además de `rowCount`: **`rows`** (rows-per-page vigente) y **`page`**
  (índice **0-based**). Las tres juntas permiten afirmar *"contados == pintados == página correcta"* en una sola
  lectura. Reconfirmado: **`PF('tablaVisit')` no expone paginator** (lanza) ⇒ en visitas contar `.ui-paginator-page`.
- **Cambiar rows-per-page sin `browser_click`** (respeta la regla de no anclar `j_idt*`):
  ```js
  const sel = document.querySelector('.ui-paginator-rpp-options');   // acepta 50 | 100 | 200
  sel.value = '200'; sel.dispatchEvent(new Event('change', { bubbles: true }));
  ```
  **Persiste entre búsquedas** — imprescindible para leer ventanas de más de 50 filas de una pasada.
- ⚠ **Visitas tiene DOS paginadores** (arriba y abajo): `.ui-paginator-rpp-options` devuelve
  `["50","100","200","50","100","200"]` ⇒ usar **`querySelector`** (el primero), nunca `querySelectorAll` sin deduplicar.
- **Ordenar:** `th.click()` sobre el `th` con `.ui-sortable-column`; 1.er click = **asc**, 2.º = **desc**;
  **conserva el filtro y el `rowCount`**.
- ✅ **Paginar/ordenar por API de PrimeFaces, sin tocar `j_idt*` — 3/3 conservan filtro, `rowCount` e indicadores
  `[run_vzla-20260818]`:** `PF('pedidosDT').paginator.setPage(n)` (**0-based**) ·
  `.ui-paginator-rpp-options` + `Event('change')` · `th.ui-sortable-column`.
  🔴 **`rows-per-page` PERSISTE entre módulos Y ENTRE SESIONES DE AGENTE** — una tanda arrancó en `rows = 200`
  porque lo dejó así el agente anterior. ⇒ **leerlo antes de medir "pintados vs contados".**
- **Botón `Buscar`:** `[id$=":ajax"]` en cobros/pedidos/clientesPotenciales · **`[id$=":btnBuscar"]` en visitas**.
- ⚠ **El rango de fechas por defecto (mes en curso hasta hoy) SÍ acota el LISTADO** (pedidos 433 de 982 ·
  cobros 10 de 32). No contradice «las fechas no tapan el `# Ref`»: acota el listado **sin filtro**, no la
  búsqueda por Ref. ⇒ **todo conteo global debe compararse contra BD con el MISMO rango.**

### 🔴 `query.js` — CUATRO trampas que producen falsos negativos `[grupo_fiel-20260817][kron-20260817]`

1. **`WHERE da_update > '2026-08-17 15:20'` devolvió 0 filas habiendo filas posteriores.** Usar
   **`da_update::date = '2026-08-17'`** para el barrido del día; el comparador con timestamp no es de fiar acá.
2. **Un `LIMIT` bajo puede OCULTAR MÓDULOS ENTEROS de un barrido:** un `LIMIT 40` tapó por completo las filas de
   `inventarios`, lo que casi produce un falso *"el visor inventa imágenes"*. **Subir el LIMIT o filtrar por
   módulo antes de concluir.**
3. 🔴 **REVIENTA POR `statement timeout` con subconsultas correlacionadas sobre miles de filas** (5.054 pedidos).
   **Reescribir como CTE + JOIN** — corre instantáneo e **es imprescindible para los barridos `§5.a` sobre la
   población completa**:
   ```sql
   WITH s AS (SELECT co_order, sum(...) AS total FROM order_detail GROUP BY co_order)
   SELECT ... FROM "order" o JOIN s USING (co_order)
   ```
4. 🔴🔴 **MEDIR CON `count(*)`, NUNCA CON `max(id)` — pasó DOS veces en una sola corrida.** El alcance declarado
   traía "177 devoluciones" (**son 3**) y "351 cobros" (**son 72**): los números eran los **id máximos**, no los
   conteos. **Contamina el alcance declarado del reporte y el denominador de todo muestreo.**

### 🔴 `query.js` — CINCO llaves que NO están donde uno las busca `[run_vzla-20260818][run_vzla-20260819]`

> **Las tres primeras producen falsos hallazgos de la web; las dos últimas producen consultas que revientan.**

1. 🔴🔴 **El estatus vigente se resuelve por `id_transaction_statuses DESC`, NO por `da_transaction_statuses`.**
   Fue la trampa más cara de la corrida: ordenar por fecha produjo un falso *«la web pierde 21 pedidos»*
   (contraejemplo medido: **pedido 2817**). CTE canónica, vale para los 5 `co_transaction_type`:
   ```sql
   WITH ts AS (
     SELECT DISTINCT ON (id_transaction) id_transaction, id_status
     FROM transaction_statuses
     WHERE co_transaction_type = 'ped'          -- ped | cob | dev | inv | dep
       AND co_operation IS DISTINCT FROM 'D'
     ORDER BY id_transaction, id_transaction_statuses DESC   -- ⚠ NO por da_transaction_statuses
   )
   SELECT ts.id_status, count(*) FROM w LEFT JOIN ts ON ts.id_transaction = w.id_order GROUP BY 1;
   ```
2. 🔴 **El conteo de la lista de VISITAS es `Σ greatest(count(incidence),1)`, no `count(visit)`** — la lista es
   **por actividad** (ver `visitas.md`). Medido: **916 visitas ⇒ 929 filas**; `count(visit)` da de menos.
   El `greatest(...,1)` importa: una visita **sin** `incidence` sigue ocupando una fila.
   ```sql
   WITH w AS (SELECT id_visit FROM visit WHERE co_operation IS DISTINCT FROM 'D' AND da_visit::date BETWEEN … ),
        i AS (SELECT id_visit, count(*) n FROM incidence WHERE co_operation IS DISTINCT FROM 'D' GROUP BY 1)
   SELECT sum(greatest(coalesce(i.n,0),1)) FROM w LEFT JOIN i USING (id_visit);
   ```
3. 🔴 **Todo conteo web debe EXCLUIR a los usuarios de baja**, o **todos** los agregados globales dan de más
   (pedidos, cobros, devoluciones, visitas y clientes potenciales):
   ```sql
   AND id_user NOT IN (SELECT id_user FROM users WHERE co_operation = 'D')
   ```
4. 🔑 **La cantidad del pedido NO está en `order_detail`: vive en la tabla nieta `order_detail_unit`**
   (`ERR: column od.qu_order does not exist`). `order_detail` sí trae `nu_price_base`, `iva`,
   `nu_amount_total` y `nu_amount_tax` ⇒ **el oráculo `precio × cantidad == subtotal` necesita LAS DOS.**
   Mismo patrón ya conocido de `client_stock_detail` → `client_stock_detail_unit` (`ubicacion`/`qu_stock`/`nu_batch`).
   ```sql
   SELECT u.co_product_unit, u.qu_order, u.nu_base_total
   FROM order_detail d JOIN order_detail_unit u ON u.co_order_detail = d.co_order_detail
   WHERE d.co_order = '<epoch>';
   ```
5. 🔑 **Catálogos de visitas y PK de clientes potenciales — los nombres engañan:**
   ```sql
   incidence        (co_incid, id_visit, co_type, co_cause, tx_description, …)
   incidence_type   (id_type, na_type)      -- ⚠ se une por  it.id_type = i.co_type
   incidence_motive (id_type, id_motive, na_motive)  -- ⚠ el "motivo" es co_cause;
                                                     --   incidence_cause NO EXISTE
   potential_client (id_client, co_client, …)        -- ⚠ NO hay id_potential_client:
                                                     --   la PK es id_client, y ES el "# Ref" de la lista
   ```
   🔴 **`incidence` NO tiene `co_visit`: la FK a la visita es `id_visit`** — **excepción** a la regla general
   *"en las tablas hijas la FK es el epoch en texto"*, que sí se cumple en `order_detail`, `return_detail`
   y `client_stock_detail`.

⚠ **`co_operation` viene NULL en varias tablas** (no solo `collection_payment`, ver `cobros.md`) ⇒
**usar SIEMPRE `co_operation IS DISTINCT FROM 'D'`**; `<> 'D'` oculta las filas nuevas.

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
