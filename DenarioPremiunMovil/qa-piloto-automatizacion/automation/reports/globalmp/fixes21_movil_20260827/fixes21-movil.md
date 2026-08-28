# FIXES-21 móvil · puntos 2 y 3 — globalmp / ISLA COCHE

**Cliente:** `globalmp` — COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A. · **Playa:** ISLA COCHE
(`denarioislacoche.ddns.net:8081`)
**Fecha:** 2026-08-27 · **Build:** APK de la rama `Fixes-21` (instalado 13:26) · **versionApp** `1.0`, `db_version` 19
**Usuario:** KIMBERLIN LEON · `id_user` 300 · `co_user` V08
**Empresa usada:** **`00002` COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A.** (la de por defecto)

---

## 🟢 VEREDICTO

| Punto | Qué se reportó | Veredicto | En una línea |
|---|---|---|---|
| **2 · Saldo del cliente en la moneda del módulo** | En el selector de clientes de Pedidos el saldo salía en **Bs** aunque el módulo esté en moneda fuerte | ✅ **PASS — el fix resuelve lo reportado** | El saldo sale **`Saldo USD`**, en una sola moneda, exactamente como manda la config de `ped` |
| **3 · Detalle de producto con precio y conversión** | En el detalle **no aparecían los dos precios** (Bs y $); en la lista sí | ✅ **PASS — el fix resuelve lo reportado** | El detalle muestra **Bs + USD + tasa**, y coincide al céntimo con la lista |

Los dos puntos se dictaminan **con oráculo de BD** (no por inspección visual), y además con la
configuración leída **en vivo** del componente Angular. Ver abajo.

---

## 🔑 De dónde salió el oráculo

### La BD de `global_mp` YA NO ESTÁ BLOQUEADA — el `GRANT` fue aplicado

El encargo daba por hecho que `user_read` no tenía permisos (`permission denied`, acción DBA pendiente,
tal como quedó documentado en el smoke web de esta misma mañana). **Se probó y ya funciona:** la base
`global_mp` responde y `user_read` lee `global_configuration`, `currency_modules`, `currency_enterprise`,
`conversion_type`, `client`, `document_sale`, `price_list`, `product_structure`…

⇒ **El oráculo de estos dos puntos es la BD**, no una inferencia de pantalla. Y se contrastó contra la
configuración viva del componente Angular, que **coincide exactamente**.

> Esto además desbloquea los casos 🔵 que el informe web
> `automation/web/smoke-web/smoke-web-fixes21.md` dejó pendientes de `GRANT`.

### Oráculo 1 — configuración por módulo (BD)

`global_configuration.currencyModule = **true**` ⇒ la configuración **por módulo** está activa, así que
`currency_modules` manda.

| módulo | `id_module` | `local_currency_default` | `show_conversion` | `currency_selector` | `da_update` |
|---|---|---|---|---|---|
| **`ped` Pedidos** | 3 | **false** → principal = **moneda fuerte (USD)** | **false** → **sin** 2.ª moneda | false | **2026-08-27 15:49:49Z** |
| **`pro` Productos** | 8 | **true** → principal = **moneda local (BS)** | **true** → **con** 2.ª moneda + tasa | true | **2026-08-27 15:49:58Z** |
| `cli` Clientes | 9 | false | **true** | true | 2026-07-21 |

⚠ `currency_modules` **no tiene columna de empresa**: la configuración es de la instalación, no por empresa.

⚠ Las filas de `ped` y `pro` se tocaron **hoy a las 15:49 UTC**, con 9 s de diferencia — alguien dejó el
escenario montado para esta prueba. El dispositivo sincronizó a las **13:27 local = 17:27 UTC**, o sea
**después**, así que lleva la config nueva. No hace falta fiarse del reloj: los valores vivos del
componente coinciden uno a uno con la BD (se comprueba más abajo).

### Oráculo 2 — monedas y tasa (BD)

- `currency_enterprise` (empresas 00001 y 00002, idéntico): **BS = local**, **USD = hard**.
- Tasa vigente `conversion_type` (última de la empresa 00002): **`785,07` Bs/USD** (`CT25082026090619`,
  2026-08-25). La empresa 00001 tiene **la misma** tasa 785,07.
- ⚠ `currency_relation.nu_exchange_rate` vale **`1,0000`** para las dos empresas. **Es una tabla maestra
  muerta**: la tasa que la app usa y muestra es la de `conversion_type`. No confundirla ni usarla para
  cuadrar conversiones (daría 1:1 y validaría cualquier cosa).

### Oráculo 3 — el `userCanSelectIVA` que hacía falta para que el punto 3 fuera una prueba de verdad

`global_configuration.userCanSelectIVA = **false**` (confirmado en BD **y** en el `globalConfiguration`
del dispositivo).

Esto importa mucho: la causa raíz del punto 3 era que las filas del precio en 2.ª moneda y de la tasa
estaban **anidadas dentro del `@if` de `userCanSelectIVA`**. Con `userCanSelectIVA = false`, en el build
defectuoso esas filas **nunca** se habrían pintado. Es decir, **globalmp tiene exactamente la
configuración que dispara el defecto** — el PASS de abajo es una regresión real, no un falso positivo
por config afortunada.

---

## PUNTO 2 · El saldo del cliente sale en la moneda configurada

**Ruta:** Pedidos → `+ PEDIDO` → campo **Cliente** → se abre el selector.
**Empresa en el formulario:** COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P (00002).

### Lo que manda la config vs. lo que se ve

| Lo que manda `ped` | Lo que se midió | ¿Cumple? |
|---|---|---|
| `local_currency_default = false` → principal **USD** | Rótulo **`Saldo USD:`** en todas las filas | ✅ |
| `show_conversion = false` → **una sola** moneda | Solo una línea de saldo; **no** hay línea en Bs | ✅ |

📸 `img/p2-selector-clientes.png` — se ven el rótulo y el monto de cinco clientes.

### Valores medidos (UI) contra la BD

`client.nu_balance` de la empresa 00002, leído por SQL:

| Cliente | Cód. | UI (selector) | `client.nu_balance` (BD) | ¿Coincide? |
|---|---|---|---|---|
| ABASTOS Y FRUTERIA EL PELUSA | AP17 | `Saldo USD: 6,77` | 6,7700 | ✅ |
| ALVARO BUENO DELGADO | AD04 | `Saldo USD: 51,31` | 51,3100 | ✅ |
| AUTOMERCADO FAMOSO ALTO | AF09 | `Saldo USD: 0,00` | 0,0000 | ✅ |
| AUTOMERCADO YOKI 168 | AY07 | `Saldo USD: 176,40` | 176,4000 | ✅ |
| BIG MARKET 22 | BM17 | `Saldo USD: 260,69` | 260,6900 | ✅ |
| COMERCIAL CLUB 888 | CC67 | `Saldo USD: 349,79` | 349,7900 | ✅ |
| COMERCIAL ECONOMICO 2023 | CE21 | `Saldo USD: 465,99` | 465,9900 | ✅ |
| COMERCIAL GRAN MUNDO 128 | CM42 | `Saldo USD: 928,79` | 928,7900 | ✅ |

(20 clientes contrastados, todos coinciden.)

### ⚠ La trampa de este caso, y por qué el veredicto sigue siendo PASS

`client.co_currency` vale **`'BS'`** para todos los clientes. Leído a la ligera, eso dice
«la app rotula USD un número que está en bolívares» — que es justo el defecto reportado.

**No es así.** Se fue a los documentos, que son la fuente real del saldo:

```
select co_currency, count(*) from document_sale where co_enterprise='00002' group by co_currency
  →  USD | (única fila)
```

**Todos los documentos de la empresa 00002 están en USD.** Y cuadran uno a uno:

- **AP17** — un único documento abierto `FF083592`, `co_currency = USD`, `nu_balance = 6,77`
  ⇒ `client.nu_balance` 6,77 **USD** ⇒ UI `Saldo USD: 6,77` ✅
- **CC67** — un documento abierto, suma 349,79 USD ⇒ UI `Saldo USD: 349,79` ✅

⇒ `client.co_currency = 'BS'` es una **columna muerta** en esta base; el saldo está en USD.
El rótulo del selector es **correcto**.

### La prueba fina: el componente lee `ped`, no `cli`

El defecto original era un **cruce de módulos** (el selector vivía en Pedidos pero leía la config de
`cli`). `ped` y `cli` comparten `local_currency_default = false`, así que **el rótulo por sí solo no
distingue**. Lo que sí distingue es `show_conversion`: **`ped` = false**, **`cli` = true**.

Leyendo el componente vivo `app-cliente-selector` (`ng.getComponent`):

```
nombreModulo:         "Pedidos"
localCurrencyDefault: false     ← = currency_modules.ped.local_currency_default
showConversion:       false     ← = currency_modules.ped.show_conversion   (cli sería true)
getPrimaryCurrencyLabel()   → "USD"
getSecondaryCurrencyLabel() → "BS"
```

Y los métodos que introdujo el commit `1672315b`, ejecutados sobre los clientes reales:

| Cliente | `getPrimarySaldo()` | `getSecondarySaldo()` | Comprobación `primario × 785,07` |
|---|---|---|---|
| AP17 | 6,77 USD | 5.314,9239 BS | 6,77 × 785,07 = **5.314,9239** ✅ |
| AD04 | 51,31 USD | 40.281,9417 BS | 51,31 × 785,07 = **40.281,9417** ✅ |
| AY07 | 176,40 USD | 138.486,3480 BS | 176,40 × 785,07 = **138.486,3480** ✅ |
| BM17 | 260,69 USD | 204.659,8983 BS | 260,69 × 785,07 = **204.659,8983** ✅ |

⇒ La conversión está bien calculada, y **correctamente NO se pinta** porque `ped.show_conversion = false`.
Si el componente siguiera leyendo `cli`, `showConversion` sería `true` y aparecería una segunda línea en
Bs. No aparece. **El cruce de módulos está corregido.**

---

## PUNTO 3 · El detalle del producto muestra precio y conversión

**Ruta:** Productos → estructura **ACEITE** (8 productos) → detalle.
Prueba con **dos** productos para no dictaminar sobre una sola muestra.

### Lo que manda la config vs. lo que se ve

| Lo que manda `pro` | Lo que se midió | ¿Cumple? |
|---|---|---|
| `local_currency_default = true` → principal **BS** | `Precio 24.925,97 **BS**` va **primero** | ✅ |
| `show_conversion = true` → 2.ª moneda **y** tasa | Aparecen `Precio … USD` **y** `Tasa de conversión` | ✅ |

### 🔑 El contraste que delata el defecto: MISMO producto, lista vs. detalle

| | **ACC01** ACEITE SOYA LA PARISIENNE 12X840ML | | **MCN01** MANTECA DE CERDO NUTRIOINK 12X500GR | |
|---|---|---|---|---|
| | **Lista** | **Detalle** | **Lista** | **Detalle** |
| Precio BS | `24.925,97 BS` | `24.925,97 BS` | `50.244,48 BS` | `50.244,48 BS` |
| Precio USD | `31,75 USD` | `31,75 USD` | `64,00 USD` | `64,00 USD` |
| Tasa de conversión | — (la lista no la muestra) | **`785,07`** | — | **`785,07`** |

**Idénticos.** Ésa era exactamente la asimetría reportada («en la lista sí se ven, en el detalle no») y
ya no se produce.

📸 `img/p3-lista-aceite.png` (lista, los 6 primeros con sus dos precios)
📸 `img/p3-detalle-ACC01-tasa.png` y `img/p3-detalle-MCN01.png` (detalle completo: los dos precios **y**
la fila `Tasa de conversión`, con la etiqueta entera visible)
📸 `img/p3-detalle-ACC01.png` (primer plano del detalle sin desplazar)

### Aritmética de la conversión — los 8 productos de la estructura

`price_list` de la empresa 00002, lista `01` («Precio 1», la seleccionada por defecto). **`co_currency`
de todas las filas = `USD`**, así que el precio base es USD y el Bs es el derivado.

| Producto | `price_list.nu_price` (BD, USD) | UI USD | UI BS | `USD × 785,07` | ✔ |
|---|---|---|---|---|---|
| ACC01 | 31,75 | 31,75 | 24.925,97 | 24.925,9725 | ✅ |
| ACC02 | 1,00 | 1,00 | 785,07 | 785,0700 | ✅ |
| ACG01 | 17,92 | 17,92 | 14.068,45 | 14.068,4544 | ✅ |
| ACG02 | 23,72 | 23,72 | 18.621,86 | 18.621,8604 | ✅ |
| ACG10 | 49,54 | 49,54 | 38.892,37 | 38.892,3678 | ✅ |
| ACT01 | 53,98 | 53,98 | 42.378,08 | 42.378,0786 | ✅ |
| ACT02 | 58,59 | 58,59 | 45.997,25 | 45.997,2513 | ✅ |
| MCN01 | 64,00 | 64,00 | 50.244,48 | 50.244,4800 | ✅ |

Los 8 cuadran al céntimo (la UI redondea a 2 decimales).

### Confirmación en los componentes vivos

Los dos componentes leen **la misma** configuración del módulo `pro` — que es lo que el fix `c9edbe3b`
tenía que conseguir al cerrar el bloque condicional mal anidado:

| | `product-list` | `product-detail` | BD (`pro`) |
|---|---|---|---|
| `currencyModuleEnabled` | `true` | `true` | `currencyModule = true` ✅ |
| `localCurrencyDefault` | `true` | `true` | `local_currency_default = true` ✅ |
| `showConversionInfo` | `true` | `true` | `show_conversion = true` ✅ |
| `defaultCurrency` | `"BS"` | — | BS = local ✅ |

Y en `product-detail` para ACC01: `basePriceHard = 31.75`, `basePriceLocal = 24925.9725`
— exactamente `31,75 × 785,07`.

---

## Empresa usada

- Todo se corrió con **`00002` COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A.**, que es la que el
  formulario de pedido trae seleccionada («COMERCIALIZADORA DE…») y la marcada `enterprise_default`
  en BD. Los clientes leídos (AP17, AD04, …) son de `co_enterprise = '00002'` y los precios
  contrastados también.
- En **Productos** el componente `app-productos` reporta `multiempresa = false`: ese módulo no ofrece
  selector de empresa en este build/config.
- **No se probó con `00001` HC TRADING MARKET 2021, C.A** — ver «Lo que NO se validó».

---

## ⚠ Observaciones que NO son parte de estos dos puntos

1. **`ped.currency_selector = false` en BD, pero el componente expone `currencySwitchEnabled = true`.**
   En `pro` sí concuerdan (`currency_selector = true` ↔ `enableCurrencySwitch = true`). En el selector
   de clientes de Pedidos hay discrepancia. **Puede ser inocuo** (esa propiedad quizá derive de
   `multiCurrency`, que es `true`, y no del `currency_selector` del módulo, o simplemente no se use en
   ese componente). **Queda anotado para verificar**, no se reporta como defecto: no afecta a lo que se
   pinta, que es lo que se estaba validando.
2. **`currency_relation.nu_exchange_rate = 1,0000`** en las dos empresas, mientras la tasa real vive en
   `conversion_type` (785,07). Tabla maestra desactualizada. Hoy no molesta porque la app usa
   `conversion_type`, pero es una trampa para cualquiera que cuadre conversiones contra esa tabla.
3. **`client.co_currency = 'BS'`** cuando el 100 % de los documentos son USD. Columna engañosa; ver la
   sección del punto 2. Es el error de lectura que puede producir un falso defecto.
4. **La app se reinició tres veces durante la sesión** (PID de la WebView 28582 → 31927 → 8195). **No se
   puede atribuir a la automatización**: durante la sesión hubo **otra persona operando el mismo
   dispositivo** (apareció un cobro de 20,00 USD con retención ISLR 6,00 en curso, en un módulo que esta
   corrida no tocó, y navegación posterior no provocada). Uno de los reinicios ocurrió justo tras pulsar
   el desplegable **Empresa** del formulario de pedido, pero **no se pudo reproducir de forma aislada**,
   así que **no se reporta como crash**. Queda como incidencia de entorno.

---

## Alcance real de lo ejecutado

**Los dos puntos se validaron en SOLO LECTURA.** No se creó, guardó ni envió ningún documento. Se abrió
el formulario de pedido únicamente para llegar al selector de clientes y **se descartó al salir**
(no se seleccionó cliente, no se añadieron líneas). El dispositivo quedó en el **home**, sin nada
pendiente.

---

## Lo que NO se validó

- **La empresa `00001` HC TRADING MARKET 2021, C.A.** No se repitió ningún caso con ella. Razón por la
  que se considera de bajo riesgo, pero **no es una validación**: `currency_modules` **no tiene columna
  de empresa** (la config de moneda por módulo es global a la instalación), y `currency_enterprise` y
  la tasa de `conversion_type` (785,07) son **idénticas** en las dos empresas. Aun así, **queda sin
  medir en UI**.
- **El resto de módulos.** `vis`, `inv`, `dev`, `cob`, `dep` y `ven` tienen su propia fila en
  `currency_modules` (varias con `local_currency_default = true`, distinta de `ped`) y **no se
  comprobó** que respeten su configuración. El escape de la v21 fue precisamente un cruce entre módulos,
  así que ésta es la extensión natural del caso.
- **El selector de moneda** (`currency_selector`) y el cambio de moneda en vivo: no se ejercitó en
  ninguno de los dos módulos. Ver observación 1.
- **Otras listas de precio.** El detalle ofrece 3 listas (`lists = [array 3]`); solo se midió la
  lista **`01` / «Precio 1»**, la que viene por defecto. No se comprobó que al cambiar de lista se
  recalculen bien **las dos** monedas y la tasa.
- **Otras unidades de venta.** Solo se midió la unidad por defecto (`CAJA`).
- **Otras estructuras de producto.** Solo **ACEITE**. Las otras 34 estructuras no se abrieron.
- **El comportamiento con `userCanSelectIVA = true`.** No se puede probar aquí sin tocar la config del
  cliente (y este cliente lo tiene en `false`). Como el fix consistió en **sacar** las filas de moneda
  de ese `@if`, convendría comprobar en otro cliente que con `userCanSelectIVA = true` tampoco se
  duplican ni desaparecen.
- **Los puntos 1 y 4** del tag: son de la web y están en
  `automation/web/smoke-web/smoke-web-fixes21.md`.

---

## Nota de utillaje (para quien repita esto)

La copia de trabajo **no tenía** el andamiaje que da por supuesto el encargo: no existen
`automation/cdp/`, `automation/clientes/` (ni `globalmp.yaml`), `automation/module-selectors/`,
`automation/GUION-CONFORMIDAD-CONFIG.md` ni `automation/db/currency-matrix.js` — bajo
`qa-piloto-automatizacion/automation/` solo hay `db/`, `playwright/`, `reports/` y `web/`, y **nada de
eso está versionado** (`git ls-files` devuelve 0 ficheros). Se levantó un driver mínimo para poder
trabajar, que queda en `automation/playwright/`:

| Fichero | Para qué |
|---|---|
| `drv.js` | Conecta por CDP y ejecuta un guión. **No llama a `browser.close()`**: sobre CDP eso repliega la WebView y **la app se vuelve al home** (costó un rato descubrirlo). |
| `lib.js` | `sweepAlerts` (barrido de alertas), `tap` con comprobación de oclusión, `findByText` |
| `s_page.js`, `s_modal.js`, `s_gc.js`, `findText.js` | Volcados de estado, alertas/modales, `globalConfiguration`, búsqueda de texto visible con sus coordenadas |
| `tapText.js`, `tapXY.js`, `scroll.js`, `goBack.js` | Interacción |
| `p2_*.js`, `p3_list.js` | Los guiones concretos de estos dos puntos |

**Tres trazas que cuestan tiempo si no se saben:**

1. **La pantalla y el viewport están desplazados.** El dispositivo es 720×1488 con DPR 2, pero el
   viewport CSS (360×744) **empieza bajo la barra de estado**: `y_css = (y_dispositivo − 80) / 2`,
   `x_css = x_dispositivo / 2`. Sin ese −80 los taps caen ~40 px arriba y parece que el elemento «no
   responde».
2. **Los `ion-modal` cerrados se quedan en el DOM con su contenido intacto.** Leer el texto de la página
   puede devolver el contenido de un modal **ya cerrado** (`overlay-hidden`, `display:none`) y dar un
   PASS falso sobre algo que no está en pantalla. **Hay que comprobar `show-modal` / `display:flex`
   antes de dar por buena una lectura** — pasó en esta misma corrida antes de capturar la evidencia del
   punto 2.
3. **Si el dispositivo se duerme, CDP deja de responder** (`socket hang up` / timeout) aunque el socket
   `webview_devtools_remote_*` siga listado. Despertar con
   `adb shell input keyevent KEYCODE_WAKEUP`. Y si la app se reinicia, **el socket cambia de número**:
   hay que releerlo con
   `adb shell "cat /proc/net/unix | grep -o 'webview_devtools_remote_[0-9]*' | sort -u"` y rehacer el
   `adb forward`.
