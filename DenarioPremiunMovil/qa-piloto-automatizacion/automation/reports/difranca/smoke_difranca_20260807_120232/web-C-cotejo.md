# WEB · Familia C## — Cotejo móvil → web

**RUN_ID:** `20260807_120232_smoke-difranca-tag20` · **Cliente:** difranca · **Playa:** EL YAQUE
**Base:** `http://denarioelyaque.ddns.net:8080/DenarioPremium` · **Empresa:** DDHP_A12 `*DISTRIBUIDORA DIAZ HERNANDEZ *`
**Vendedor:** `Jose  Raad` (`login_user=VEND206`, `id_user=275`) · **Modo:** 🔴 READ-ONLY · **Build:** tag 20
**Fecha:** 2026-08-07

## Guarda de tenant y de contexto (previa a toda lectura)

| Check | Resultado |
|---|---|
| `host` | `denarioelyaque.ddns.net:8080` → playa `el_yaque` ✅ |
| Empresas del `<select>` **por TEXTO** | `*DISTRIBUIDORA DIAZ HERNANDEZ *` · `DIFRANCA C.A` · `DISTRIBUIDORA DH VITAL, C.A.` → las 3 de difranca ✅ |
| `value` del `<select>` Empresa | **`co_enterprise`** (`DDHP_A12` · `DIF_A12` · `DHVITAL01_A`) en **pedidos** y **clientes potenciales** — confirma que NO se debe anclar al `value` |
| Vendedor esperado presente | `Jose  Raad` (dos espacios) con `value=275` = `id_user` ✅ (18 opciones) |
| `pathname` por módulo | `/pages/pedidos`, `/pages/detallePedido`, `/pages/clientesPotenciales`, `/pages/detalleClientePotencial` ✅ |

> La sesión JSF **estaba caducada** al empezar: `browser_navigate` a `/pages/pedidos` devolvió `login.xhtml`
> sin fallar. Re-login por `#j_idt12` / `#j_idt14` / `#j_idt16` → `/pages/main`. (Confirma la regla ya
> documentada; no es hallazgo nuevo.)

---

## Registros cotejados

Manifiesto `_bd-manifest.jsonl` releído al empezar y al cerrar: **2 líneas**, ambas `BD-OK` ⇒ gate de
precondición **abierto** para las dos. No aparecieron registros de devoluciones/visitas durante la ventana
de esta corrida web (ver *Cobertura* al final).

### 1 · Pedido **Ref 39795** — `DM-PED-031` — 🟢 **WEB-OK**

Epoch `co_order` = `1786121049719.0` · empresa DDHP_A12 · moneda US$ · tasa `752,0900`

**Localización:** `# Ref = 39795` + `Buscar` → **1 fila**, la correcta.
🔴 Con el panel **tal como carga**, esta búsqueda habría dado **0 filas**: ver hallazgo `PED-MONEDA-BSD-POR-DEFECTO`.

| Campo | Móvil (manifiesto) | Web (lista / detalle) | ¿Coincide? |
|---|---|---|---|
| `No. de Ref.` | 39795 | 39795 | ✅ |
| `Código pedido` (epoch) | 1786121049719.0 | `1786121049719.0` | ✅ exacto |
| Empresa | `*DISTRIBUIDORA DIAZ HERNANDEZ *` | `*DISTRIBUIDORA DIAZ HERNANDEZ *` | ✅ |
| Vendedor | `id_user=275` (`Jose  Raad`) | `Jose Raad` | ✅ (nombre completo) |
| Cliente | `CAR755 MULTIDISTRIBUIDORA JAKE, C.A` | cód. `CAR755` · `MULTIDISTRIBUIDORA JAKE, C.A` | ✅ |
| Comentario | `Test-PED-SMOKE-125035` | `Test-PED-SMOKE-125035` | ✅ |
| Condición de pago | `CRE30` | `Credito a 30` | ✅ *enriquecimiento* (C12, nota) |
| Tipo de pedido | `id_order_type=2` | `PEDIDO ESTANDAR` | ✅ *enriquecimiento* |
| Lista de precios | `01 / Precio 01` | `01 - Precio 01` | ✅ |
| Almacén | `co_warehouse=001` | `Principal` | ✅ *enriquecimiento* |
| Unidad | `UND`, cantidad 2 | `2 Unidad` | ✅ *enriquecimiento* |
| Estatus | `transaction_statuses co_status='env'` | **`Enviado`** (literal de la web) | ✅ |
| `¿Por Aprobar?` | — | `NO` | ✅ coherente con Enviado |
| Total items | `nu_details = 1` | lista `1` · detalle **1 línea** | ✅ |
| Producto | `ACBA300U` / Acondicionador BBK de Argan Therapy 300ml | idem | ✅ |
| Fecha | epoch → 07/08/2026 12:44:09 (UTC-4) | `Fecha del pedido 07/08/2026 12:52:55`; envío `12:52:58` | ✅ **mismo día** (nota: 8 min entre creación en el equipo y `da_order` del servidor) |
| Fecha de despacho | — | `09/08/2026` | la web la agrega, no se juzga |
| Coordenada | — (el manifiesto de pedidos no la trae) | `11.0490432,-63.8649956` | no se juzga |

**Aritmética explícita** (moneda de la transacción = **US$** ⇒ `US$ → BSD` **multiplica**):

| Oráculo | Cálculo | Web | Δ | Veredicto |
|---|---|---|---|---|
| C08 · línea = cantidad × precio | `2 × 3,64 = 7,28 US$` | `Subtotal: 7,28 US$` | 0 | ✅ |
| C07 · Σ líneas == Monto Total Pedido | `7,28` | `7,28 US$` | 0 | ✅ |
| C11 · Subtotal bruto − Descuento bonif. == Monto Base | `7,28 − 0,00 = 7,28` | `7,28 US$` | 0 | ✅ |
| C09 · conversión del **precio base** | `3,64 × 752,09 = 2.737,6076` | `2.737,61 BSD` | **0,0024** | ✅ (< 0,01) |
| C09 · conversión del **subtotal de línea** | `7,28 × 752,09 = 5.475,2152` | `5.475,22 BSD` | **0,0048** | ✅ (< 0,01) |
| C10 · Σ conversiones línea == conv. de cabecera | `5.475,22` | `Monto Base Pedido Conversion 5.475,22` · `Conversiòn Monto Total 5.475,22` | 0 | ✅ |
| Consistencia **lista ↔ detalle** (M05) | lista `7,28 / 7,28 / 5.475,22 / 752,09` | detalle idéntico | 0 | ✅ |

Sin IVA, sin descuento de línea, sin descuento global — coherente con el manifiesto (`iva_total=0`,
`descuento_global=0`, `descuento_producto_total=0`).

⚠ **Corrección al enunciado de la tarea:** el brief decía *"2 líneas"*; el manifiesto y la web coinciden en
**1 línea con cantidad 2** (`nu_details=1`). La web está bien; lo que estaba mal era el enunciado.

---

### 2 · Cliente potencial **Ref 60** — `DM-CLT-026` — 🟡 **WEB-OK con 1 defecto de render de la web**

Epoch `co_potential_client` = `1786120036250.0` · empresa DDHP_A12

**Localización:** sin filtro `# Ref` (limitación conocida del módulo) → empresa DDHP_A12 + rango
`01/08/2026–07/08/2026` + barrido por la columna `# Ref` → **fila 60 hallada**. Llave del detalle = `Código`.

| Campo | Móvil (manifiesto) | Web (detalle) | ¿Coincide? |
|---|---|---|---|
| `Código` (epoch) | 1786120036250.0 | `1786120036250.0` | ✅ exacto |
| `# Ref` (solo lista) | 60 | 60 | ✅ |
| `Nombre` / `na_client` | `Test-CLT-SMOKE-122750` | `Test-CLT-SMOKE-122750` | ✅ |
| `Cédula` / `nu_rif` | `J987654321` | `J987654321` | ✅ |
| `Rif. Cliente` de la **lista** | `J987654321` | `J987654321` | ✅ consistencia lista↔detalle |
| `Comentario` / `tx_client` | `Test QA difranca` | `Test QA difranca` | ✅ |
| `Responsable` / `na_responsible` | `QA Automatizacion` | `QA Automatizacion` | ✅ |
| `Correo` / `em_client` | `qa.difranca@test.com` | `qa.difranca@test.com` | ✅ |
| `Teléfono` / `nu_phone` | `04121234567` | `04121234567` | ✅ |
| `Dirección` / `tx_address` | `Av Principal El Yaque` | `Av Principal El Yaque` | ✅ sin truncar |
| `Dirección Entrega` / `tx_address_dispatch` | `Av Principal El Yaque Despacho` | `Av Principal El Yaque Despacho` | ✅ sin truncar |
| `Web` / `na_web_site` | `null` | `""` (vacío) | ✅ vacío en móvil → se saltea |
| `Fecha de Registro` | `2026-08-07 12:29:25` | `07/08/2026 12:29:25` | ✅ **exacta al segundo** |
| **Coordenada de transacción** | `11.0490573,-63.8649905` | `11.0490573,-63.8649905` | ✅ **exacta** |
| Adjuntos / firma | `nuAttachments=0`, `hasAttachments=false` | `Firma:` vacía | ✅ nada que mostrar |
| **Vendedor** | `id_user=275` = `Jose  Raad` | **`Jose`** (lista **y** detalle) | ❌ **defecto de la web** → `CLT-VENDEDOR-SIN-APELLIDO` |

**Sin montos** ⇒ `WEB-CALC-MISMATCH` no aplica en este módulo.
**Trampa DW-CLT-C09 verificada:** `Web:` vacío **no** absorbió el título `Contacto` con el lector usado
(hoja-siguiente + descarte de títulos de sección). ✅

---

## Resumen de veredictos

| Módulo | Ref | Casos | WEB-OK | WEB-FIELD-MISMATCH | WEB-N/A | MISSING | CALC-MISMATCH |
|---|---|---|---|---|---|---|---|
| pedidos | 39795 | 12 (C01–C12) | **12** | 0 | 0 | 0 | 0 |
| clientes potenciales | 60 | 11 (C01–C10 + C11 nuevo) | **8** | **1** | 2 | 0 | n/a |
| **Total** | | **23** | **20** | **1** | **2** | **0** | **0** |

`WEB-N/A`: `DW-CLT-C08` (el móvil no envió adjuntos ni firma) y `DW-CLT-C10` (la web **no expone** estatus de
aprobación en el detalle del cliente potencial — no es fallo, es que el dato no está en pantalla).

**Ningún `WEB-MISSING` y ningún `WEB-CALC-MISMATCH`.** Los dos registros que el móvil envió a la nube
llegaron a la web íntegros y con la aritmética correcta.

---

## Hallazgos

### 🆕 Nuevos

#### 1. `CLT-VENDEDOR-SIN-APELLIDO` — el vendedor pierde el apellido en Clientes Potenciales · **severidad media** · **AFECTA a difranca**

En `/pages/clientesPotenciales` la columna `Vendedor` y el campo `Vendedor:` de
`/pages/detalleClientePotencial` muestran **solo el nombre de pila**. Verificado a nivel HTML crudo —
no es artefacto del lector:

```
<span class="ui-column-title">Vendedor</span>Jose      ← el td contiene literalmente "Jose ", sin "Raad"
```

- **No es de este registro:** ampliando el rango a `01/01/2024–07/08/2026` salen **24 filas** y los únicos
  valores distintos de la columna son **`Jose`** y **`Emma`**. Ninguna fila muestra apellido.
- **El mismo sitio sabe el nombre completo:** el `<select>` de vendedores del propio módulo lista
  `Jose  Raad`, `Jose Ibarra`, `Emma Flores`, … (18 opciones). Es render, no dato faltante.
- **Es específico de este módulo:** `/pages/pedidos` y `/pages/detallePedido` muestran **`Jose Raad`**
  completo para el mismo `id_user=275`.
- 🔴 **Por qué le importa a difranca y no es cosmético:** el maestro de difranca tiene **dos Jose**
  (`Jose  Raad` = nuestro VEND206 y `Jose Ibarra`). En la lista de clientes potenciales **ambos se
  muestran como `Jose`** ⇒ es imposible saber qué vendedor levantó un cliente potencial sin abrir el
  detalle… que muestra lo mismo. Con `Emma Flores` pasa igual.
- **Impacto GO/NO-GO:** no corrompe datos ni bloquea la aprobación del cliente potencial (el `id_user` de
  fondo es correcto: el registro apareció bajo el filtro de empresa correcto y el resto de los campos
  cotejó exacto). Es un **defecto de trazabilidad de la lista**. **No bloquea el tag 20.**

#### 2. `PED-MONEDA-BSD-POR-DEFECTO` — el filtro Moneda arranca en `BSD` en carga fresca · **severidad media** · **AFECTA a difranca**

Precisión sobre la trampa ya conocida ("los filtros persisten en la sesión"): con **sesión nueva**
(re-login) y **primera carga** de `/pages/pedidos`, el `<select>` de Moneda ya viene en
`value="1"` / label `BSD`, con el placeholder `Moneda` (`value=""`) disponible pero **no seleccionado**.

⇒ **No es solo persistencia: es el estado inicial.** Y `Limpiar` tampoco lo devuelve al placeholder
(ya reportado como `DW-PED-F03`).

- 🔴 **Le pega de lleno a difranca:** difranca **opera en US$** (el pedido de la corrida es `id_currency=2`).
  Un usuario que entre a Pedidos y busque el `# Ref 39795` **sin tocar Moneda** obtiene **0 filas** — el
  pedido parece no existir. Fue exactamente el mecanismo del falso positivo de hoy en la capa de filtros.
- **Verificado:** puesto el placeholder `Moneda`, la misma búsqueda devuelve la fila correcta.
- **Impacto GO/NO-GO:** no pierde datos; confunde al usuario y puede motivar reportes falsos de
  "el pedido no llegó". **No bloquea el tag 20**, pero conviene avisarle al usuario de difranca.

#### 3. `PED-TYPO-CONVERSION` — errata en la etiqueta de totales · **severidad baja** · cosmético

En `/pages/detallePedido` la etiqueta del total convertido es **`Conversiòn Monto Total`** — acento grave
(`ò`) en lugar de agudo (`ó`). El valor es correcto (`5.475,22 BSD`). Puro texto; no bloquea nada.

### ♻ Conocidos que reproducen

| Defecto conocido | ¿Reprodujo acá? | ¿Lo usa difranca en este flujo? |
|---|---|---|
| **`COB-LISTA-RENDER-VACIO`** (cobro 21831, `co_type=3` IGTF, vacía el `<tbody>`) | **No aplicable a esta tanda**: la familia C## de esta corrida no tocó cobros (el manifiesto no trae ninguno). **No se re-levanta.** Tampoco apareció ningún síntoma parecido en pedidos ni en clientes potenciales: las dos listas pintaron `nFilas` == `rowCount` en las 5 búsquedas hechas. | El defecto en sí **sí** le afecta (es su BD), pero **fuera del alcance de este cotejo** |
| **Filtros persisten / `Moneda` no se limpia** | ✅ Reproduce, y se **amplía**: en pedidos `Moneda=BSD` no es residuo de sesión, es el **valor inicial** (hallazgo 2) | ✅ Sí — difranca factura en US$ |
| **Empresa se resetea al entrar fresco a cada módulo** | ❌ **No reprodujo**: en las dos entradas frescas (pedidos y clientes potenciales) la Empresa vino ya en `DDHP_A12` = la nuestra. difranca tiene 3 empresas y la 1ª es la correcta ⇒ la trampa "arranca en la 2ª" **no le pega** a esta corrida | No en este caso |
| **Sesión JSF caduca y `navigate` devuelve `login.xhtml` sin fallar** | ✅ Reprodujo al arrancar. Mitigado con re-login | Artefacto de automatización, no defecto de producto |
| **`clientes potenciales` sin filtro `# Ref`** | ✅ Confirmado (limitación documentada, no fallo) | Encarece la localización, nada más |
| **`# Ref` no siempre pinta** (`DW-COB-F01`, ref 21831) | ❌ No reprodujo en pedidos: `# Ref 39795` pintó 1/1 | — |

---

## Patrones / selectores nuevos

1. **El `value` del `<select>` Empresa es `co_enterprise` en pedidos Y en clientes potenciales**
   (`DDHP_A12` · `DIF_A12` · `DHVITAL01_A`). Confirma que la guarda de tenant debe anclar **al TEXTO**.
   Amplía la tabla de `_comunes.md`, que solo tenía medido devoluciones (posicional) y clientes
   potenciales (`co_enterprise`).

2. **`/pages/pedidos` de El Yaque carga con `idCurrency` = `1` (BSD) en sesión nueva.** Antes de cualquier
   conteo, leer el `value` de **todos** los `select[id$="_input"]`, no solo el `.ui-selectonemenu-label`.
   Lector de una sola llamada que usé:
   ```js
   document.querySelectorAll('select[id$="_input"]')  // suf, value, selText, labelUI, nOpts
   ```

3. **Cambiar un `selectonemenu` sin `browser_click`, respetando la regla de oro**, en una sola `evaluate`:
   `label.click()` → `sleep 600` → click sobre el `li.ui-selectonemenu-item` **filtrado por TEXTO** dentro
   de `[id$=":<suf>_panel"]` → `sleep 2500` → **verificar `_label` y el `value` del `<select>` espejo**.
   Funcionó 1/1 para poner Moneda en placeholder.

4. **Las fechas SÍ se pueden setear por widget** (contra lo anotado en `playas.yaml` para Caribe):
   ```js
   PrimeFaces.widgets['widget_form_j_idt115_dateB'].setDate('01/01/2024')
   ```
   Localizar el widget por `Object.entries(PrimeFaces.widgets).filter(([k,v]) => /date[BF]/.test(v.id))`
   en vez de escribir el `j_idt*`. `el.value = ...` también quedó pegado en este build, pero el widget es
   la vía segura.

5. **Botón `Consultar` anclado al `# Ref`, nunca al índice** — una sola `evaluate` que construye el mapa
   `# Ref → botón` y clickea. Ciclo `navigate` → `evaluate(filtrar)` → `evaluate(mapa+click)` →
   `evaluate(leer)`. Confirmado en los dos módulos.

6. **Las DOS reglas de lectura del detalle conviven en la MISMA página** (`detallePedido`) — hay que correr
   las dos y quedarse con la que da valor:
   - **padre-primero** resuelve el pie de totales: `Subtotal bruto`, `Descuento bonif.`,
     `Monto Base Pedido`, `Monto Base Pedido Conversion`, `Monto Total Pedido`, `Conversiòn Monto Total`.
   - **hoja-siguiente** resuelve la cabecera: `No. de Ref.`, `Código pedido`, `Vendedor`, `Estatus`, …
   - ⚠ Con hoja-siguiente, `Conversiòn Monto Total` absorbe el **`N°`** del encabezado de la tabla de
     líneas, y `Sucursal:` (vacío) absorbe el botón **`Descargar adjuntos`**. Descartar como valor toda
     hoja que sea un encabezado de tabla o el texto de un botón.

7. **`detalleClientePotencial`**: la etiqueta del RIF salió como **`Cédula:`** (un solo `:`) en este build,
   no `Cédula::` como estaba documentado. Normalizar `/:+$/` cubre los dos casos.

8. **Tabla de líneas de `detallePedido` = `form:pedidosDT`** (el mismo id que la lista). Columnas:
   `N° · Cod. producto · Producto · Almacen · Lista de precio · Unidades pedidas · Monto Total · Monto conv.`
   Las dos últimas traen **dos valores en una celda**:
   `"Precio base: 3,64 US$ Subtotal: 7,28 US$"` ⇒ hay que partirlas para cotejar precio y subtotal por
   separado. Es donde se verifica C08 y C09 de una sola lectura.

9. **`detalleClientePotencial` expone `Descargar Adjunto` y `Ver adjuntos` aun con 0 adjuntos**
   (`nuAttachments=0`). No ejecutado (fuera del alcance C## y es un cliente productivo). Queda anotado
   para la familia `A##`: el esperado de `DW-CLT-A07` en este build **no** es "el botón no aparece".

> ✅ consolidado 2026-08-07

---

## Cobertura

- Manifiesto leído **al empezar** y **al cerrar**: **2 líneas**, ambas cotejadas. **100 % de cobertura**
  de lo que el manifiesto tenía durante la ventana de este agente.
- Los registros anunciados como futuros (**devoluciones**, **visitas**, **pedido grande**) **no llegaron a
  aparecer** en `_bd-manifest.jsonl`. No se marcan `WEB-MISSING` — no se marcan de ninguna forma: no
  existen todavía en el insumo. Requieren una segunda pasada del agente web cuando el manifiesto crezca.
- **Ningún control de escritura fue tocado.** Solo `Buscar`, el `<select>` de filtro `Moneda`, los campos
  de fecha del filtro y `Consultar`.
