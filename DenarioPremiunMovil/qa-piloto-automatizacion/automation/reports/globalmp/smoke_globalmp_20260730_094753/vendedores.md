# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260730_094753_smoke-completo` |
| Módulo | VENDEDORES (solo lectura) |
| Dispositivo | Android — WebView vía CDP `:9220` |
| App | `com.kiberno.denarioPremiumPro` — versionApp 1.0 · db_version 19 · `window.ng=true` |
| Playa | la_tortuga (`http://denariolatortuga.ddns.net:8081/PremiumWS`) |
| Cliente | globalmp — 2 empresas (00001 HC TRADING MARKET 2021 · 00002 COMERCIALIZADORA GLOBAL M&P) |
| Usuario | YC01 YUSNEIDI CLEMENTE (id_user 307) |
| Resultado | **3 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | `app-vendedores` visible con `<h1>Vendedor</h1>` (confirma `esVendedor=true`); **2 acordeones**: "COMERCIALIZADORA DE" + "HC TRADING MARKET 20". **0 overlays** residuales — el sync overlay desapareció solo |
| DM-VND-002 | ✅ PASS | 🔴 **KPIs POBLADOS esta corrida** (ver abajo — corrige la expectativa `kpis_disponibles:false`). Expansión vía `grp.value=acc.value`+`ionChange`: altura `[slot=content]` **0 → 281 px**, clase `accordion-collapsed`→`accordion-expanded`; expandir el 2º **contrae el 1º** (comportamiento de acordeón único, correcto); `grp.value=undefined` contrae ambos → 0 px. Todo al **1er intento** |
| DM-VND-007 | ✅ PASS | Back → **HOME** con los 10 tiles (`app-vendedores` ya no visible, `location.href=/home`). 2 intentos: el 1º falló por el quirk de selector documentado abajo |

## Registros creados en sistema

**NINGUNO** — módulo de solo lectura. No se creó ni modificó ningún registro, ni local ni en la nube.
Sin verificación BD (RUNTIME §10 no aplica a solo-lectura) → `BD-N/A`.

## Dato vivo de KPIs — la expectativa previa quedó desactualizada

El prompt de corrida traía `kpis_disponibles: false` (en junio la API no devolvió métricas y el contenido salió
vacío). **Se verificó con dato vivo antes de marcar N/A y hoy SÍ hay métricas**, así que DM-VND-002 es
**PASS pleno, no N/A**:

| KPI | COMERCIALIZADORA DE (00002) | HC TRADING MARKET 20 (00001) |
|-----|---------------------------:|-----------------------------:|
| Días Hábiles | 23 | 23 |
| Días Transcurridos | 22 | 22 |
| Días Restantes | 1 | 1 |
| **Cartera Clientes** | **357** | **14** |
| Clientes Activados | 119 | 119 |
| Clientes Nuevos | 2 | 2 |
| Clientes Nuevos Activados | 0 | 0 |

Esto **corrige la nota histórica** de `module-selectors/vendedores.md` que registraba "globalmp: KPIs vacíos"
en `[gmp-2606][gmp-2611]`. globalmp pasa al grupo de clientes con KPIs que pueblan
(insumar / piercar / ferrenuestro / dm-electronica).

## Hallazgos

### H1 · Los KPIs de clientes **no se segmentan por empresa** — "Activados 119" sobre una cartera de 14 (severidad media)

**Qué se observó.** De los 4 KPIs de clientes, **solo `Cartera Clientes` cambia entre empresas** (357 vs 14).
`Clientes Activados` (119), `Clientes Nuevos` (2) y `Clientes Nuevos Activados` (0) son **idénticos byte a byte**
en los dos acordeones.

**Por qué es un defecto y no un dato plausible.** En **HC TRADING MARKET 20** la app muestra
**Cartera Clientes 14** y **Clientes Activados 119**: los activados son un **subconjunto** de la cartera, así que
`Activados ≤ Cartera` siempre. **119 > 14 es aritméticamente imposible** — no es un valor raro, es un valor que
no puede existir. El patrón (uno segmentado, tres constantes) apunta a que el servicio de métricas filtra por
`idEnterprise` en la consulta de cartera pero **no** en las de activación/altas, que vuelven globales del
vendedor.

**Impacto.** El vendedor lee, para la empresa chica, una tasa de activación de 119/14 = **850 %**. Es un
indicador de gestión: induce a error directo sobre el avance de la cuota.

**Reproducción (2 min, manual).** HOME → Vendedores → expandir "HC TRADING MARKET 20" → comparar
`Cartera Clientes` contra `Clientes Activados` → contrastar con el acordeón "COMERCIALIZADORA DE".

**No bloquea** el smoke: el módulo es de solo lectura y el criterio del caso DM-VND-002 (contenido visible,
expande/contrae) **se cumple**, por eso el caso queda PASS. Se levanta como hallazgo del **servicio de métricas
de vendedor**, no del componente móvil. Es la contraparte del pendiente ya abierto en otro cliente
(latino_cosmetica lleva 2 corridas con KPIs **vacíos**): en globalmp el servicio responde, pero **responde mal
para la 2ª empresa**. Ambas cosas apuntan al mismo servicio y conviene revisarlas juntas.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **En VENDEDORES el `img.fechaAtras` NO tiene `<a>` padre — `closest('a')` devuelve `null` y `h.clickBack` falla** | universal (**nuevo**) | `app-vendedores` renderiza el back como `<img class="fechaAtras" src="iconosatras.png">` **suelto dentro del `ion-col`**, sin ancla (`anchors` dentro de `app-vendedores` = **0**). Toda receta basada en `→ closest('a')` (incluido `h.clickBack`) devuelve null y se lee como "no existe botón atrás". **Fix: clickear la `<img>` directamente** — `pg.mouse.click` en el centro de su rect (coords **~32,31**), `elementFromPoint` confirma `IMG`. Es el **tercer sabor** del quirk de back del build: (a) `.fechaAtras` con copias rect 0×0 en pedidos, (b) sin `.fechaAtras` en productos, (c) **con `.fechaAtras` pero sin `<a>`** en vendedores |
| 🔴 **`img.fechaAtras` NO es unívoco: la 2ª instancia es el ICONO del módulo, no el back** | universal (**nuevo**) | En `app-vendedores` hay **2 imgs con clase `fechaAtras`**: `iconosatras.png` en **x=10** (el back real) y `vendedoresNuevoBlanco.svg` en **x=302** (icono decorativo del header, misma clase). Filtrar por rect visible **no alcanza** — ambas miden 43×43. **Filtrar además por `/atras/i.test(img.src)` o por `x < 100`**; tomar "el primer `.fechaAtras` visible" es una moneda al aire |
| 🔴 **El `[slot="content"]` del acordeón ya contiene el `innerText` de los KPIs estando COLAPSADO** | universal (**nuevo**) | Con el acordeón cerrado, `content.innerText` **ya devuelve los KPIs completos** con `height=0`. ⇒ usar presencia de texto como oráculo de expansión da **falso positivo** (parece expandido sin estarlo) y como oráculo de KPIs da falso positivo de "hay datos" cuando el acordeón nunca abrió. **Oráculo correcto: `getBoundingClientRect().height` o la clase `accordion-expanded`** — nunca el texto |
| Altura de `[slot=content]` **con KPIs poblados = 281 px** (globalmp) | referencia | Completa la escala del oráculo de altura: **0** colapsado · **~20 px** expandido-pero-vacío (latino_cosmetica) · **281 px** (globalmp) · **393 px** (ferrenuestro). Confirma la advertencia de no usar umbrales altos para decidir si expandió |
| `grp.value=acc.value`+`ionChange` sigue vigente en La Tortuga v1.0 `window.ng=true` | universal (re-confirmado) | Expandir y contraer (`grp.value=undefined`) al 1er intento. Los acordeones no declaran `value` propio: Ionic asignó `ion-accordion-6` / `ion-accordion-7` → leer `acc.value` en runtime |
| **globalmp: KPIs POBLADOS** — corrige la nota "KPIs vacíos" de `[gmp-2606][gmp-2611]` | cliente | Ver tabla arriba. Actualizar `modules.vendedores.kpis_disponibles` de `false` a `true` en el YAML del cliente |
| globalmp: 2 acordeones, `esVendedor=true` | cliente (re-confirmado) | "COMERCIALIZADORA DE" + "HC TRADING MARKET 20", heading `<h1>Vendedor</h1>` |

## Cierre

Los **3 casos del guión se ejecutaron y pasaron** — nada quedó sin probar. En particular **DM-VND-002 NO quedó
en N/A**: se verificó con dato vivo, la API devolvió métricas y el caso se ejecutó completo. 0 BLOCKED, 0
cuelgues de CDP, watchdog nunca disparó. Queda abierto el hallazgo **H1** sobre la segmentación por empresa de
los KPIs, que es del servicio de métricas y no impide cerrar el módulo.
