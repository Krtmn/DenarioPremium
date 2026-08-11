# Smoke Test — Módulo PEDIDOS

> # 🔴 CORRECCIÓN POSTERIOR — LA CAUSA RAÍZ DE ESTE REPORTE ES **INCORRECTA**
>
> El módulo **PRODUCTOS**, corrido después en el mismo device y la misma sesión, **refutó** la hipótesis de
> `unit_pricelist`:
> - `product-list.unitByPriceList = **false**` ⇒ **la app NO lee esa tabla**. PRODUCTOS cotiza y convierte
>   los 57 productos con `unit_pricelist` vacía.
> - El device **SÍ tiene los datos**: 57 productos · 644 precios (ninguno en 0) · 323 filas de stock (140 con
>   existencia) — idénticos a la nube.
> - PRODUCTOS **lista 8 desde `Azucar` y 30 desde `PVA`**: las **mismas dos estructuras** que PEDIDOS mostró
>   vacías.
>
> **Causa raíz REAL — es un DEFECTO DE LA APP, no dato faltante:** las estructuras de **nivel 1 (Sector)
> tienen CERO productos asignados directamente**; su badge es un **rollup del subárbol**. PRODUCTOS resuelve
> expandiendo a `idProductStructureList: Array(3)`; **PEDIDOS filtra por la estructura sola** y por eso da 0
> con el contador en 8. Además `order_type_product_structure` (el filtro real de PEDIDOS) solo mapea
> estructuras de **nivel 1**.
>
> ⇒ **NO cargar `unit_pricelist`: sería trabajo perdido.** Ver el veredicto completo y las 2 vías de
> desbloqueo en `productos.md` §Diagnóstico.
> ⚠ **El patrón de la sección "Patrones / selectores nuevos" de este archivo que afirma
> `unit_pricelist=0 ⇒ sin productos` es INCORRECTO y NO debe promoverse a `_comunes.md`.**



| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260805_133539_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Playa | Isla Coche (`denarioislacoche.ddns.net:8081`) |
| Cliente | el_palmar · empresa **1002 CENTRAL EL PALMAR, S.A.** |
| Usuario | `***` / `***` (coUser 1276 · idUser 266) |
| Resultado | **4 PASS · 0 FAIL · 0 SKIP · 10 N/A · 0 BLOCKED** |
| Estado final | HOME ✅ |

---

## 🔴 Hallazgo bloqueante del módulo (leer primero)

**El Tab Pedido no lista NINGÚN producto ⇒ en este cliente no se puede tomar un pedido.**

La UI muestra las categorías con su contador (`Azucar 8`, `PVA 30`) pero al entrar en cualquiera de
ellas responde **"No hay productos disponibles"**. Reproducido por **dos caminos independientes**:
agrupación **Sector** (P01 → 2 categorías, ambas vacías) y agrupación **Grupo de artículos**
(P02 → **0 categorías**). También `Favoritos 0 · DESTACADOS 0 · Carrito 0`.

**No es falta de sincronización ni falta de datos en el device.** Lo verificado:

| Comprobación | Resultado | Conclusión |
|---|---|---|
| `products` en BD local | 57 filas (39 en 1002 · 18 en 1003) | productos SÍ sincronizados |
| `price_lists` para la lista activa (id_list 11 · Z12 `Med.Ind.Ctro-Cap CIF`) | **13 filas** con precios reales (57,5 · 60 · 26 · 27 · 61 · 62,5 · 28…) | los productos de Azucar SÍ tienen precio en la lista activa |
| `stocks` empresa 1002 | 235 filas · **106 con `qu_stock>0`** · 38 productos | hay inventario abundante (160000010 = 2.432.900 · 160000017 = 30.000.000) |
| `product_units` | 61 filas | unidades por producto existen |
| **`unit_pricelist` (device)** | **0 filas** | ← tabla que asocia **unidad ↔ lista de precio** |
| **`unit_pricelist` (NUBE)** | **0 filas** | **vacía también en origen** ⇒ no es un fallo de sync |

**Causa raíz probable:** con `unit_pricelist` vacía en el maestro, ningún producto resuelve una
unidad vendible para la lista de precios activa y la app los descarta a todos. Encaja con el patrón
observado: vacío **total y homogéneo** en ambas agrupaciones y en las dos categorías.

**Veredicto aplicado:** 🚫 **N/A**, no FAIL — el dato falta **en origen** (RUNTIME §4 "API no devuelve
datos → N/A"). No se imputa defecto a la app. ⚠ **Requiere confirmación con desarrollo**: no se leyó el
código, así que la relación causal `unit_pricelist` → "No hay productos disponibles" es una hipótesis
respaldada por datos, no una certeza.

**Observación secundaria (para el perfil, no es FAIL):** el contador de la categoría promete
`Azucar 8` / `PVA 30` y luego no lista nada. Ese número viene de `product_structures.qu_products`
(dato del servidor), así que la app solo lo refleja — pero la inconsistencia es visible para el usuario.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | `/pedidos` con los 3 accesos `ion-button.colorBorderBuscar`: PEDIDO · BUSCAR · COPIAR |
| DM-PED-002 | ✅ PASS | `/pedido`; tabs Pedido/Total/Adjunto `disabled`, General activa; `imagenGuardar`/`imagenEnviar` `disabled`; sin cliente |
| DM-PED-006 | ✅ PASS | Cliente 1000000803 seleccionado (`hasClient=true`, campo = "C.A. RON SANTA TERESA, S.A.C.A (1000000803)"). **Alerta de deuda vencida SÍ apareció** (ver abajo). Tabs habilitaron tras completar el Nro. de orden obligatorio |
| DM-PED-015 | 🚫 N/A | Categorías presentes (`Azucar 8`, `PVA 30`) pero **"No hay productos disponibles"** en ambas → `unit_pricelist`=0 en nube y device (ver hallazgo) |
| DM-PED-017 | 🚫 N/A | Sin producto expandible no hay `ion-input[type=number]` que llenar |
| DM-PED-024 | 🚫 N/A | Totales no alcanzables ≠0. Tab Total sí renderiza correcto en cero — ver nota de `multiCurrencyOrder` abajo |
| DM-PED-026 | 🚫 N/A | Sin ítems que eliminar |
| DM-PED-029 | ✅ PASS | Con cliente + Nro. de orden y **sin ítems**: `imagenGuardar`=`disabled`, `imagenEnviar`=`disabled`. No se puede guardar sin datos |
| DM-PED-030 | 🚫 N/A | No se puede agregar ítem |
| DM-PED-031 | 🚫 N/A | Sin pedido que enviar |
| DM-PED-032 | 🚫 N/A | Precondición no construible (requiere ítems agregados sin guardar). Con form sin ítems el back salió directo a `/pedidos` sin modal — consistente con la nota conocida "Guardar deja pristine / sin ítems no ensucia", no se marca FAIL |
| DM-PED-034 | 🚫 N/A | `ion-searchbar` "Pedidos..." presente y renderizado (h=58), pero la lista tiene **0 pedidos** (`orders` local = 0 filas) → no hay qué filtrar |
| DM-PED-035 | 🚫 N/A | No existe pedido Guardado que reabrir |
| DM-PED-037 | 🚫 N/A | No existe pedido Guardado que borrar |

### Alerta de deuda vencida — CONFIRMADA

Al seleccionar **1000000803 C.A. RON SANTA TERESA, S.A.C.A** (26 documentos vencidos):

> **Pedidos** — "Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?"
> Botones: **[Cancelar · Aceptar]**

Coincide con `alerta_deuda_vencida: true` del perfil. **No bloquea**: al pulsar `Aceptar` el cliente
queda asignado (`hasClient=true`). El saldo del modal (`Saldo USD: 25.800,1300`) coincide 1:1 con
`cliente.saldo2` y con lo que el device mostró en CLIENTES.

*(No se ejecutó el control negativo con 1000000747 INDUMAC: con el módulo ya bloqueado por falta de
productos, gastar 2 intentos más en re-seleccionar cliente no cambiaba ningún veredicto.)*

---

## Verificación de VGs

Leyenda: **✔ coincide** con el perfil · **✘ CONTRADICE** el perfil · **? no determinable**

### Encargo prioritario

| # | VG | Perfil | UI observada | Veredicto |
|---|----|--------|--------------|-----------|
| 1 | `userCanSelectProductDiscount` | `false` (⚠ sospechada mal) | — | **? no determinable** |
| 2 | `validateWarehouses` | `false` | — (parcial: sin selector de almacén en Tab General) | **? no determinable** |
| 3 | **`validateNuOrder`** | `false` | **Nro. de orden OBLIGATORIO** | **✘ CONTRADICE — es `true` en la UI** |
| 5 | `enabledManualRate` vs `canChangeRate` | contradictorias | `#tasa` = **`readonly=true`** | **Resuelto: la tasa NO se edita** |

**#3 `validateNuOrder` — evidencia dura (medición del par antes/después):**
con cliente ya seleccionado y `#nuPurchase` **vacío**, el input llega con **`required=true`** y
`lockSegments=true` ⇒ tabs Pedido/Total/Adjunto `disabled`. Tras `fillIonInput('#nuPurchase','OC-SMOKE-133539')`:
`lockSegments=false` y **las 3 tabs habilitaron en el mismo tick**. ⇒ el Nro. de orden de compra **sí es
obligatorio** para avanzar. **El perfil debe corregirse a `validateNuOrder: true`** (ganaba el dump de
CLIENTE 2026-02-17=false sobre el global 2024-07-09=true — **gana el global, como en alipascua**).
⚠ Es la **misma trampa** que el encargo señalaba para `userCanSelectProductDiscount`: el dump de cliente
viejo pisando al global. Refuerza la sospecha sobre esa clave aunque no se haya podido medir.

**#5 tasa — resuelto:** `ion-input#tasa` presenta `652,9726` con **`readonly=true`** (y `disabled=false`,
que es lo que engaña si se mira solo esa propiedad). ⇒ **la tasa NO se puede editar a mano en el pedido**;
gana `enabledManualRate=false`. `canChangeRate=true` **no se materializa** en el formulario de pedido —
probablemente aplica a otro módulo (cobros). Pregunta abierta de QA: **respondida, no editable**.

**#1 y #2 — por qué "no determinable":** ambas se evalúan en el **panel del producto expandido**
(los 5 `ion-select` de línea: Lista de Precio · Unidad · IVA · % Descuento · Almacén) y ese panel
**nunca se pudo abrir**, porque ningún producto se lista. No se inventa veredicto: quedan pendientes
para la próxima corrida, **una vez cargada `unit_pricelist`**.

### Resto del encargo (#4) y VGs observadas de paso

| VG | Perfil | UI observada | Veredicto |
|----|--------|--------------|-----------|
| `selectOrderType` | `true` | Selector **CFR** con 2 opciones, habilitado (`listaOrderTypes`=2; `tipoOrden` = idOrderType 1 / CFR / `defaultValue:true`) | **✔ coincide** |
| `userCanChangePaymentConditions` | `true` | Selector **"Vencimiento neto en 15 días"**, **15 opciones**, **habilitado** | **✔ coincide** |
| `userCanChangePriceList` | `false` | Selector **"Med.Ind.Ctro-Cap CIF"** (18 opciones) llega **`disabled`** | **✔ coincide** |
| `userCanSelectGlobalDiscount` | `false` (N/A estructural) | Sin selector de descuento global en el form | **✔ coincide** (no hay divergencia) |
| `orderEnterpriseEnabled` | `true` ⚠️VERIFICAR | **Sí hay selector de empresa en PEDIDOS** (2 opciones, habilitado) | **✔ confirmado** |
| `multiCurrencyOrder` | `true` | Tab Total muestra **VES y USD** (Total Base VES/USD, Total Pedido VES/USD) | **✔ confirmado — ver nota** |
| `multiCurrency` | `true` | Selector de moneda con 2 opciones (VES/USD), habilitado, default **VES** | **✔ coincide** |
| `requiredCommentOrder` | `false` | `#txComment` sin `required`; Guardar/Enviar nunca dependieron de él | **✔ coincide** |
| `requiredComment` (alcance COBROS `tipo=C`) | no aplica a pedidos | No se exigió comentario en pedidos | **✔ coincide** — alcance confirmado |
| `suggestedOrder` | `true` | **Botón "Pedido Sugerido" NO aparece** en ninguna tab | **✘ divergencia conocida — 7ª playa** |
| `productMinMul` · `stock0` · `userCanSelectIVA` · `userCanChangePriceListProduct` · `quUnitDecimals` · `userCanChangeWarehouse` | varios | — | **? no determinable** (todas viven en el panel del producto) |

**🔵 `multiCurrencyOrder=true` — dato nuevo y notable:** el Tab Total muestra **las dos monedas**
(`Total Base VES: 0,0000 / Total Base USD: 0,0000`, `Total Pedido VES / USD`, `Tasa: 652,9726 VES = 1,0000 USD`).
Es la **primera playa de la serie** donde ocurre: insumar, jerez, dm-electronica, latino_cosmetica,
globalmp y alipascua mostraban **solo US$** pese a `multiCurrency=true`. Acá `multiCurrencyOrder=true`
sí se materializa. La tabla `VG → DOM effects` de `pedidos.md` queda confirmada por primera vez.

**Conversión de moneda:** no verificable con aritmética (todos los totales en 0,00 por falta de ítems).
La **tasa presentada es correcta y en la dirección correcta** (`652,9726 VES = 1,0000 USD` ⇒ USD→VES
multiplica). El defecto de dirección conocido en cobros **no se pudo evaluar** aquí.

**Selector de empresa — sin 2º selector propio del pedido:** el encargo pedía reportar si aparecía un
segundo selector de empresa. **No lo hay**: el form tiene **un solo** selector de empresa, que llega
**preseleccionado en `CENTRAL EL PALMAR, S.A.` (idEnterprise 1 / coEnterprise 1002)** y **habilitado**
(2 opciones). ⚠ **Contrasta con el módulo CLIENTES de esta misma corrida**, donde el mismo build entrega
el select **vacío, `ng-invalid` y bloqueando la validación**: en PEDIDOS la app **sí auto-asigna**.
Y auto-asigna la **correcta (1002)**, no la marcada `enterprise_default` — el propio objeto del select
expone `enterpriseDefault: "false"`, o sea **la trampa del `enterprise_default=1003` tampoco se
materializó acá**. Empresa efectiva verificada en UI: **1002 / id 1** ✅.

---

## Verificación BD

**Baseline (nube, tomado al inicio):** `order` = 13.768 filas · `max(id_order)` = 23.147 ·
`order_detail` = 43.771 · `order_detail_unit` = 43.759.

**Diff al cierre:** `order` = 13.768 · `max(id_order)` = 23.147 · `order_detail` = 43.771 → **sin cambios**,
coherente con **0 registros creados**.

**BD local del device** (vía `window.sqlitePlugin`; `local-query.js` sigue inoperante por falta de `sqlite3`):

| Comprobación | Valor | Lectura |
|---|---|---|
| `orders` | **0 filas** | el vendedor no tiene ningún pedido, ni guardado ni enviado |
| `pending_transactions WHERE type='order'` | 0 | nada atascado en cola |
| `failed_transactions` | 0 | nada rechazado |

**Marca del módulo: `BD-N/A` — no por BD inaccesible (la BD respondió perfecto en nube y local), sino
porque no se creó ningún registro que cotejar.** La pregunta del §10 ("¿lo que se guardó, se envió?")
no aplica: no se guardó nada.

**Manifiesto:** `_bd-manifest.jsonl` **sin líneas nuevas** — no hubo pedidos enviados.
**Payloads:** `__qaH.getPayloadData()` no registró **ningún** POST a `orderservice/order`
(solo `authservice/auth`, `syncservice/getsync` y el `potentialclientservice/potentialclient` heredado
del módulo CLIENTES). Coherente con 0 envíos ⇒ `_payloads.jsonl` sin líneas nuevas.

---

## Registros creados en sistema

| Ref | epoch (`co_order`) | Detalle | Empresa efectiva | Estado |
|-----|--------------------|---------|------------------|--------|
| — | — | **ninguno** — el módulo no permite agregar líneas (ver hallazgo bloqueante) | — | — |

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **`ion-input#nuPurchase` (Nro. de orden) puede ser el que BLOQUEA las tabs** | universal | Con `validateNuOrder` efectivo, el campo llega `required=true` y mantiene `comp.lockSegments=true`: **las tabs Pedido/Total/Adjunto siguen `disabled` aunque el cliente ya esté seleccionado**. Se lee como "DM-PED-006 FALLÓ: las tabs no habilitan". **Antes de marcar FAIL, leer `comp.lockSegments` y el `required` de los inputs del Tab General.** Al llenar `#nuPurchase` las 3 tabs habilitan en el mismo tick. Hermano exacto del patrón `idEnterprise` de CLIENTES: *el botón/tab que "no responde" suele ser un campo obligatorio vacío*. `[el_palmar-20260805]` |
| 🔴 **`ion-input#tasa` engaña con `disabled=false`: hay que leer `readonly`** | universal | El campo de tasa del Tab General llega `disabled=false` pero **`readonly=true`** ⇒ NO es editable. Concluir "la tasa se puede editar" mirando solo `disabled` da un veredicto de VG equivocado (`enabledManualRate`). **Leer siempre el par (`disabled`, `readonly`).** `[el_palmar-20260805]` |
| **Orden de los `ion-input` del Tab General (build v1.0/db19, 2 empresas)** | cliente | `#clienteSelect`(0) · **`#tasa`(1)** · `#nuPurchase`(2) · `#naResponsible`(3) · `#txComment`(4). ⚠ Difiere de la nota `[ins-2610]` (que no tenía `#tasa`): **no indexar por posición, usar el `id`.** `[el_palmar-20260805]` |
| **Los 7 `ion-select` del Tab General son un mapa de VGs de cabecera** | universal | En orden: Empresa · Moneda · Dirección/Sucursal · Tipo de pedido (`CFR`) · Canal (`Industrias`) · **Lista de precios** (`disabled`) · Condición de pago (15 opciones). Leer `sel.disabled` + `nº de opciones` de los 7 resuelve de una sola pasada `orderEnterpriseEnabled`, `multiCurrency`, `selectOrderType`, `userCanChangePriceList` y `userCanChangePaymentConditions` **sin provocar el comportamiento**. Complementa el mapa de 5 selects del **panel de producto** de `[alipascua-20260804]`. `[el_palmar-20260805]` |
| **Buscador de productos oculto tras `ion-icon[name="search-circle-sharp"]`** | universal | El Tab Pedido **no** trae `ion-searchbar`: el buscador es un `input.search-input.inputsSearch` (placeholder "Búsqueda de productos") que aparece al clickear el ícono. `querySelectorAll('ion-searchbar')` devuelve `[]` y se lee como "no hay buscador". Volver de nivel: `ion-icon[name="arrow-back-outline"]`. `[el_palmar-20260805]` |
| **Selector de agrupación = `Sector` (P01) / `Grupo de artículos` (P02)** | cliente | Resuelve `estructura_producto: TBD` del YAML. Es el primer `ion-select` visible del Tab Pedido; su `value` es el objeto `type_product_structure` completo (`coTypeProductStructure` P01/P02, `nuLevel` 1/2). Variante local del `Proveedor/Línea` de alipascua ⇒ **el par de opciones cambia por cliente: leerlo, no asumirlo.** `[el_palmar-20260805]` |
| ❌ **REFUTADO — NO PROMOVER** ~~`unit_pricelist` vacía ⇒ "No hay productos disponibles"~~ | ❌ descartado por `productos.md` | Antes de reportar "el acordeón está vacío" como FAIL, comprobar en BD local **y nube**: `products`, `price_lists` de la lista activa, `stocks` y **`unit_pricelist`**. Acá las 3 primeras tenían datos y la 4ª estaba en **0 en ambas** ⇒ N/A por dato de origen, no FAIL de app. `# candidato — confirmar la relación causal con desarrollo`. `[el_palmar-20260805]` |
| **La lista de precios activa se lee en `comp.listaAnterior`** | universal | `ng.getComponent(document.querySelector('app-pedido')).listaAnterior` → `{idList, coList, naList, coEnterprise}`. Junto con `tipoOrden`, `distChannel`, `empresaSeleccionada`, `monedaSeleccionada` da el contexto completo de cabecera sin tocar el DOM. `[el_palmar-20260805]` |
| **`app-pedido` auto-asigna empresa aunque CLIENTES no lo haga** | cliente | Mismo build, mismo cliente, 2 empresas: en el form de **cliente potencial** el select llega vacío/`ng-invalid`; en el de **pedido** llega **preseleccionado en 1002 y habilitado**, con `enterpriseDefault:"false"` en el objeto ⇒ **no toma la `enterprise_default`**. Acota la regla de `_comunes.md`: *la auto-asignación depende del FORMULARIO, no solo del nº de empresas.* `[el_palmar-20260805]` |
| **Modal de cliente: 144 asignados pero el objetivo cayó en la 1ª página** | cliente | `selectorCliente.clientes` trae 50 y `1000000803` quedó en el **índice 3** ⇒ **0 rondas de `onIonInfinite`**. Ordenado por deuda vencida/saldo (`oderByDueDateAndSaldo`), no alfabético puro: los morosos suben. Paginar solo si `findIndex` falla. `[el_palmar-20260805]` |

---


> ✅ consolidado 2026-08-05
## Hallazgos

**Sin FAIL.** El hallazgo relevante del módulo no es un defecto de la app sino un **bloqueo por datos de
configuración**, documentado arriba en detalle:

1. **🔴 BLOQUEANTE — `unit_pricelist` vacía en el maestro de el_palmar (nube y device).** Deja el
   módulo PEDIDOS inoperable: no se puede agregar ninguna línea, y con ello **10 de los 14 casos del
   smoke quedan sin ejecutar**. **Acción sugerida:** cargar `unit_pricelist` para la empresa 1002 y
   **re-correr el módulo completo**; recién entonces podrán medirse las 8 VGs que quedaron
   "no determinable" (todas viven en el panel del producto expandido).
2. **⚠ `validateNuOrder` mal en el perfil** (`false` → debe ser `true`). Es el **segundo caso** en dos
   clientes seguidos donde un dump de CLIENTE viejo pisa al global y la UI le da la razón al global
   (el primero fue `userCanSelectProductDiscount` en alipascua). **Sugerencia de método:** ante
   `⚠️VERIFICAR` con esa forma (client viejo=false vs global=true), **presumir el global** hasta que la
   UI diga lo contrario.
3. **ⓘ `suggestedOrder=true` sin botón "Pedido Sugerido"** — 7ª playa consecutiva con la misma
   divergencia UI-vs-config. Ya no es un dato por playa: **corresponde preguntar a desarrollo qué VG
   gobierna realmente ese botón.**

---

*Reporte generado por el agente QA del módulo PEDIDOS · RUN_ID `20260805_133539_smoke-completo`*
*Watchdog: 0 cuelgues de CDP · 0 reconexiones · sin `ABORT-MODULE` · wall-clock muy por debajo del techo de 60 min*

---

## Verificación posterior: moneda USD vs Bs

*Verificación puntual pedida por la responsable QA tras cerrar el módulo. RUN_ID `20260805_133539_smoke-completo`.
No ejecuta casos del smoke — no toca el ledger. Estado final: HOME, sin pedidos guardados ni enviados.*

### 🔴 Veredicto

**SÍ — la moneda es el factor que destraba el módulo, y la afirmación de QA se confirma en su efecto práctico.**
Con **Bs/VES no aparece ningún producto; con USD sí aparecen.** Medido con el mismo cliente, el mismo
formulario y **sin tocar nada más que el selector de moneda**:

| Categoría (badge) | Moneda **VES** | Moneda **USD** |
|---|---|---|
| `Azucar` (badge 8) | **0** — "No hay productos disponibles" | **6 productos listados** |
| `PVA` (badge 30) | **0** — "No hay productos disponibles" | **0** — "No hay productos disponibles" |
| `Alcohol` | **la categoría no existe** en el árbol (solo hay 2: Azucar, PVA) | ídem |

Los 6 que aparecen con USD, con su precio en pantalla:
`160000010` 57,5000 · `160000012` 26,0000 · `160000014` 61,0000 · `160000016` 61,0000 ·
`160000017` 61,0000 · `160000020` 27,0000 USD.

⚠ **Pero la formulación exacta hay que corregirla en dos puntos:**
1. **Con USD NO aparecen los 39 productos, aparecen 6.** El módulo pasa de 0 % a ~15 % del catálogo.
2. **La causa última no es la moneda sola, sino el par `(lista de precios activa × moneda del pedido)`.**
   La moneda es la mitad visible del filtro; ver el desglose de abajo.

### El criterio real (resuelve el matiz del "1 producto en VES")

El encargo señalaba que en `1002/VES` la BD tiene **1 producto con precio**, así que un filtro solo-por-precio
debería mostrar **1**, no 0. La consulta acotada **a la lista que el pedido realmente usa** lo explica:

```
price_list · empresa 1002 · co_operation<>'D' · agrupado por lista y moneda
  Z12 (= LISTA ACTIVA del pedido, id_list 11 "Med.Ind.Ctro-Cap CIF"):
        USD -> 13 filas /  7 productos
        VES ->  0 filas /  0 productos     <- CERO, no uno
  Z01: USD -> 74 filas / 38 productos · VES -> 1 fila / 1 producto   <- el unico VES de 1002 vive ACA
```

⇒ **El único precio en VES de la empresa 1002 está en la lista Z01, que este cliente no usa.** En la lista
asignada (Z12) no hay ni una fila en VES. Por eso el conteo esperado con VES es **0 y no 1**: la anomalía
que hacía dudar de la hipótesis queda explicada, y la hipótesis sale reforzada, no debilitada.

Y explica también por qué `PVA` sigue vacía **incluso con USD**: los 7 productos con precio en Z12 son
`160000005` (ALCOHOL DESNATURALIZADO) **+ los 6 de Azucar**. Ninguno es de PVA. Los 30 productos de PVA
no tienen precio en Z12 **en ninguna moneda**.

**Criterio efectivo observado:** *un producto se lista en el Tab Pedido si y solo si tiene precio en la
lista de precios activa **en la moneda seleccionada para el pedido**.*
(No se pudo confirmar leyendo el componente: `selectorProductos.productService` y `productStructureService`
no exponen nombres de método en este build minificado — `Object.getOwnPropertyNames(proto)` devuelve `[]`.
El criterio queda **inferido del contraste UI + BD**, que es consistente en los 4 casos medidos, no leído
del código. Se respetó el techo de 2 intentos.)

### Selector de moneda — ficha

| Dato | Valor |
|---|---|
| Selector | **2.º `ion-select` del Tab General** de `app-pedido`. **No tiene `id` ni `label`** → identificarlo por sus 2 `ion-select-option` (`VES`/`USD`), no por índice a ciegas |
| Orden confirmado de los 7 selects | Empresa(0) · **Moneda(1)** · Dirección/Sucursal(2) · Tipo de pedido(3) · Canal(4) · Lista de precios(5) · Condición de pago(6) |
| Habilitado | **Sí** (`disabled=false`) |
| Opciones | 2 — `VES`, `USD` |
| **Por defecto** | **VES** ← la sospecha de QA era correcta |
| Estado en runtime | `comp.monedaSeleccionada` = `{idCurrencyEnterprise:2, coCurrency:"VES", idCurrency:2, localCurrency:"true", hardCurrency:"false", coEnterprise:"1002"}` |
| Tras elegir USD | `{idCurrencyEnterprise:1, coCurrency:"USD", idCurrency:1, localCurrency:"false", hardCurrency:"true"}` |
| Efectos colaterales del cambio | **Ninguno**: sin alerta, sin recarga del form. `#tasa` sigue `652,9726` y `comp.listaAnterior` sigue `{idList:11, coList:"Z12"}` ⇒ **el contraste es limpio, solo cambió la moneda** |

### ¿Defecto o comportamiento esperado?

**La evidencia sostiene mejor esta lectura: el filtro por precio es DISEÑO; el defecto está en OFRECER una
moneda en la que no se puede cotizar nada.**

- A favor de *diseño*: la app necesita un precio en la moneda del pedido para cotizar la línea. Al pasar a
  USD, la línea cotizó perfecto y toda la aritmética cerró (ver abajo). Un producto sin precio en la moneda
  elegida no es agregable de forma útil.
- El defecto real es **de configuración expuesta en UI**: la empresa 1002 **ofrece VES como moneda de pedido
  y la trae preseleccionada por defecto**, cuando en la lista asignada al cliente no existe **ni un solo**
  precio en VES. La app deja entrar por un camino que garantiza pantalla vacía — y no da ningún mensaje que
  lo explique ("No hay productos disponibles" no dice "no hay precios en la moneda elegida").
- ⚠ **Matiz honesto sobre `hideProdWithoutPrice=false`:** el perfil dice `false` ⇒ *los productos sin precio
  deberían listarse igual*, y no se listan. Eso **apuntaría a defecto**. Pero no se pudo comprobar que esa VG
  gobierne **este** filtro concreto (no se leyó el código, y el runtime no expone el criterio). **Queda como
  candidato a defecto, pendiente de confirmar con desarrollo** — no se afirma como defecto probado.

### Relación con el diagnóstico de PRODUCTOS ("PEDIDOS no expande el subárbol de estructuras")

**Es UNA sola causa, y la moneda tapaba a la otra.** Concretamente:

- La hipótesis del subárbol queda **refutada como causa general**: con USD, `Azucar` **sí** lista sus
  productos. PEDIDOS resuelve productos bajo una estructura de nivel 1 sin problema. Si el bug fuera "PEDIDOS
  filtra por la estructura sola y no expande el subárbol", `Azucar` habría dado 0 también con USD.
- `PVA` vacía **no necesita** la explicación del subárbol: sus 30 productos no tienen precio en Z12 en
  ninguna moneda. El filtro por precio ya lo explica por completo.
- ⇒ **El filtro `(lista activa × moneda)` explica los 4 cuadrantes medidos.** Ni `unit_pricelist` (ya
  refutada por PRODUCTOS) ni el subárbol de estructuras hacen falta como causa.
- **Por qué se leyó como "vacío total y homogéneo":** con VES el filtro daba 0 en absolutamente todo, y ese
  cero uniforme es justamente lo que hizo pensar en una causa estructural. La moneda tapaba el resto.

### ✅ El módulo QUEDA EJECUTABLE eligiendo USD — conviene re-correr PEDIDOS completo

Se cargó una línea de prueba **sin guardar ni enviar** (el `160000019` que pedía el encargo **no tiene precio
en Z12**, así que se usó `160000010`):

- `160000010` AZÚCAR KONFIT BLANCO SACO PL 1X50KG × **2** Saco → badge `contadorProductos` = **2**.
- Tab Total: `Total Items: 1` · **Total Base USD 115,0000** (57,50 × 2 ✅) · **Total IVA USD 18,4000**
  (16 % ✅) · **Total Pedido USD 133,4000** ✅.
- **Conversión multi-moneda correcta y en la dirección correcta** (multiplica USD→VES):
  `115,00 × 652,9726 = 75.091,8490` ✅ · `133,40 × 652,9726 = 87.106,5448` ✅.
- Salida por `img.fechaAtras` → dirty-guard "¡Alerta!" (GUARDAR Y SALIR / **SALIR SIN GUARDAR** / CANCELAR)
  → **Salir sin guardar** → `/pedidos` → HOME. **Nada guardado, nada enviado.**

⇒ **Recomendación: re-correr el módulo PEDIDOS completo eligiendo USD.** Los 10 casos hoy en 🚫 N/A pasan a
ser ejecutables. **Con la salvedad de que solo 6 de los 39 productos son cotizables** (los que tienen precio
en Z12), todos en la categoría `Azucar` — suficiente para el smoke, no para cobertura de catálogo.

### VGs que estaban "no determinable" y esta verificación RESUELVE

El panel del producto expandido —que en la corrida nunca se pudo abrir— sí se abrió con USD. Expone
**solo 3 `ion-select`**, no los 5 de `[alipascua-20260804]`:

| VG | Perfil | UI observada (panel de línea) | Veredicto |
|---|---|---|---|
| `userCanSelectProductDiscount` | `false` (⚠ sospechada mal) | **El select "% Descuento" NO EXISTE** en el panel | **✔ coincide — el perfil estaba bien**; la sospecha del encargo queda descartada |
| `validateWarehouses` / `userCanChangeWarehouse` | `false` | **El select "Almacén" NO EXISTE** en el panel | **✔ coincide** |
| `userCanChangePriceListProduct` | `false` | `Lista de Precio` = "Med.Ind.Ctro-Cap CIF", **`disabled`**, 1 opción | **✔ coincide** |
| `userCanSelectIVA` | — | `IVA - 16` **habilitado**, 2 opciones | **`true` en la UI** |
| Unidad | — | `Saco` habilitado, 1 opción | — |

### Hallazgo secundario nuevo (cosmético, no bloquea)

En el **Tab Total**, la línea del ítem imprime el IVA en VES **como float crudo sin formatear**:

> `IVA 16,0000%: 12014.695840000002 VES`

mientras el mismo importe en el bloque de totales sale bien formateado (`Total IVA VES: 12.014,6958`).
Mismo número, dos formatos; el de la línea escapa al pipe de formato. **Defecto de presentación menor.**

### Notas de ejecución

- ⚠ **La app estaba deslogueada al empezar** (`/login`), pese a que el encargo la daba en HOME logueada.
  Se volvió a entrar con el usuario `***` (coUser 1276) y se rehízo el camino desde HOME. Sin impacto en el
  resultado, pero confirma que **el estado entre agentes no es garantía: verificar `location.href` al abrir**.
- El árbol de productos de este build es **drill-down, no acordeón anidado**: el click en `ion-item.listaItems`
  **navega dentro** de la categoría (el header pasa a "Azucar" y `listaItems` queda en 0), no expande in situ.
  Se vuelve con `ion-icon[name="arrow-back-outline"]`. Un 2.º click sobre la misma categoría **no la colapsa**:
  falla con `Cannot read properties of undefined`. Dentro de la categoría los productos **sí** son
  `ion-accordion`.
- **El badge de la categoría sigue sin filtrar:** `Azucar 8` lista **6**. Reconfirma que el contador viene de
  `product_structures.qu_products` (servidor) y no refleja el filtro de precio/moneda que la app sí aplica.
- **Contraste con 1003 YARACUY (vía BD, no UI):** `price_list` empresa 1003 tiene **0 filas en VES** en
  **todas** sus listas (solo USD). ⇒ La predicción es que con VES tampoco aparecería nada allí. **No se
  verificó en UI** — habría exigido descartar y rearmar un pedido nuevo, y no cambiaba el veredicto.
- **Sanidad BD (nube):** `order` = 13.769 · `max(id_order)` = 23.147. Las 2 órdenes creadas hoy son de
  `id_client` 86 y 1095; el cliente de prueba `1000000803` es `id_client` **85 / 1454** ⇒ **ninguna es de esta
  verificación**. Consistente con "no se guardó ni envió nada".

### Patrones nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| 🔴 **El Tab Pedido filtra por `(lista de precios activa × moneda del pedido)` — la moneda puede vaciar el catálogo entero** | universal `# candidato` | Antes de diagnosticar "No hay productos disponibles" como falta de datos o bug de estructuras, **cambiar la moneda del pedido y volver a mirar**. En el_palmar: VES→0 productos en todo el árbol, USD→6. Consultar `price_list` **acotado a la lista activa** (`comp.listaAnterior.coList`) **y agrupado por `co_currency`** — el agregado por empresa engaña: 1002 tenía "1 producto en VES", pero en la lista Z12 tenía **0**. `[el_palmar-20260805]` |
| **Selector de moneda: 2.º `ion-select` del Tab General, sin `id` ni `label`** | universal | Localizarlo por sus `ion-select-option` (`VES`/`USD`), nunca por índice fijo. Cambiarlo **no** dispara alerta ni recarga: `#tasa` y `listaAnterior` quedan intactos ⇒ sirve para un A/B limpio. Estado en `comp.monedaSeleccionada` (`coCurrency`, `localCurrency`, `hardCurrency`). En el_palmar llega **por defecto en VES**, la moneda sin precios. `[el_palmar-20260805]` |
| **Árbol de productos drill-down (no acordeón) en el build Isla Coche v1.0/db19** | cliente | Click en `ion-item.listaItems` **navega dentro** de la categoría (`listaItems` pasa a 0); volver con `ion-icon[name="arrow-back-outline"]`. Un 2.º click sobre la categoría revienta con `undefined.getBoundingClientRect`. Los productos dentro sí son `ion-accordion`. Convive con las 2 variantes ya documentadas (`div.listaProductos` anidado / `ion-accordion-group`) ⇒ **son 3 variantes de árbol, detectar antes de elegir estrategia.** `[el_palmar-20260805]` |
| **El panel de línea puede traer 3 selects, no 5** | universal | La ausencia de "% Descuento" / "Almacén" **es** la señal de `userCanSelectProductDiscount=false` / `userCanChangeWarehouse=false` — leer los selects **presentes**, no asumir los 5 de `[alipascua-20260804]`. `[el_palmar-20260805]` |


> ✅ consolidado 2026-08-05
### ⚠ Correcciones a aplicar sobre el cuerpo de este reporte

1. El **banner de corrección** de arriba sigue siendo válido en lo que refuta (`unit_pricelist` **no** es la
   causa), pero su **causa raíz de reemplazo** ("PEDIDOS no expande el subárbol de estructuras") **también
   queda refutada**: con USD, `Azucar` sí lista sus productos. La causa raíz correcta es el filtro
   `(lista activa × moneda)`.
2. El **hallazgo bloqueante** deja de ser bloqueante: **el módulo se puede correr eligiendo USD**.
3. Las VGs `userCanSelectProductDiscount` y `validateWarehouses`, marcadas "? no determinable",
   quedan **resueltas y coincidiendo con el perfil** (ver tabla arriba).

*Verificación posterior · agente QA PEDIDOS · 2026-08-05 · estado final HOME, 0 registros creados*

---

## Verificación posterior: categorías por tipo de pedido y empresa

> **Pregunta de la responsable QA:** *«No entiendo por qué a veces al seleccionar YARACUY me muestra la
> categoría de los productos y otras veces no. Eso está muy raro.»*
>
> Verificación en UI · 2026-08-06 · playa **Isla Coche** · app v1.0 / db19 · ADB `14678405BR003855` ·
> cliente de prueba **1000000803 C.A. RON SANTA TERESA** (disponible en **las dos** empresas — no hizo falta
> el suplente CAYETANO FARIAS) · Nro. de orden `QA-CAT-01` / `QA-CAT-02`.
> **No se guardó ni se envió ningún pedido.** Estado final: HOME.

### 1. Veredicto — ¿qué gobierna las categorías?

🔴 **Las gobierna el TIPO DE PEDIDO, no la empresa.** La hipótesis de BD queda **CONFIRMADA en UI**:
el mapeo de `order_type_product_structure` (CFR → 10+30 = Azucar+PVA · FOB → 10+20+30 = Azucar+Alcohol+PVA)
se reproduce **idéntico en las dos empresas**. **`Alcohol` aparece únicamente con FOB.**

**Matriz de 4 celdas (moneda USD en las 4, una sola variable cambiada por vez):**

| # | Empresa | Tipo | Moneda | Categorías del Tab Pedido (con su contador) | Productos al entrar en cada una |
|---|---------|------|--------|---------------------------------------------|--------------------------------|
| 1 | CENTRAL EL PALMAR (1002) | **CFR** | USD | `Azucar 8` · `PVA 30` — **2 categorías, sin Alcohol** | Azucar → **6** · PVA → **0** ("No hay productos disponibles") |
| 2 | CENTRAL EL PALMAR (1002) | **FOB** | USD | `Alcohol 1` · `Azucar 8` · `PVA 30` — **3 categorías** | Alcohol → **0** · Azucar → **6** · PVA → **0** |
| 3 | **YARACUY (1003)** | **CFR** | USD | `Azucar 10` · `PVA 2` — **2 categorías, sin Alcohol** | Azucar → **7** · PVA → **0** |
| 4 | **YARACUY (1003)** | **FOB** | USD | `Alcohol 6` · `Azucar 10` · `PVA 2` — **3 categorías** | Alcohol → **0** · Azucar → **7** · PVA → **0** |

**Respuestas puntuales:**

- **a. ¿Cambian con el tipo de pedido? ¿Alcohol solo con FOB?** — **SÍ a ambas.** CFR lista 2 categorías y
  FOB agrega `Alcohol`. Se reprodujo en **las dos empresas** (celdas 1↔2 y 3↔4).
- **b. ¿Cambian con la empresa, con el tipo FIJO?** — **NO cambia el CONJUNTO de categorías**: con CFR ambas
  empresas listan `Azucar`+`PVA`; con FOB ambas listan `Alcohol`+`Azucar`+`PVA`. Lo único que cambia con la
  empresa es el **contenido**: los contadores (`Azucar 8`→`10`, `PVA 30`→`2`, `Alcohol 1`→`6`) y los productos
  cotizables (Azucar **6** en 1002 vs **7** en 1003). ⇒ **la empresa cambia el catálogo, no la estructura.**
- **e. YARACUY + VES** — las categorías **sí** se listan (`Azucar 10` · `PVA 2`), pero **las dos entran vacías:
  0 productos**. Coincide exactamente con el dato de BD (`empresa 1003: VES 0 filas / 0 productos`).

### 2. 🔴 La explicación de la intermitencia — son DOS efectos que se suman

**Causa principal — al cambiar de empresa, el TIPO DE PEDIDO queda apuntando al objeto de la empresa ANTERIOR:**

Al elegir YARACUY sale el alert `Pedidos / El pedido tiene elementos de otra empresa, para continuar se debe
reiniciar el pedido. ¿Desea reiniciar el pedido?` (**Cancelar / Aceptar**). Tras Aceptar, medido en el
componente `app-pedido`:

```
comp.tipoOrden  =  { idOrderType: 1, coOrderType: "CFR", coEnterprise: "1002" }   <- OBJETO DE LA EMPRESA VIEJA
opciones reales del select bajo YARACUY:
      CFR -> { idOrderType: 4, coEnterprise: "1003" }
      FOB -> { idOrderType: 2, coEnterprise: "1003" }
```

El valor retenido (`idOrderType 1`, de 1002) **no coincide con ninguna opción de 1003** ⇒ consecuencias
observadas, las dos a la vez:

1. el `ion-select` de **Tipo de pedido se muestra EN BLANCO** (sin texto), y
2. el **Tab Pedido queda con CERO categorías** — ni siquiera los encabezados (`Favoritos 0 · DESTACADOS 0 ·
   Carrito 0` y nada más). Se verificó **con VES y con USD**: vacío en ambas.

**En cuanto se toca el selector y se elige CFR explícitamente** (que bajo 1003 es `idOrderType 4`), **las
categorías aparecen de inmediato**: `Azucar 10` · `PVA 2`.

⇒ **Eso es exactamente la intermitencia reportada.** El usuario que después de cambiar a YARACUY **toca el
tipo de pedido** ve las categorías; el que **no lo toca** ve el árbol vacío y concluye "YARACUY no muestra
categorías". No depende de la empresa: depende de si el tipo de pedido quedó o no en el objeto huérfano.

**Causa secundaria — la moneda se resetea a VES sola, y YARACUY no tiene ni un precio en VES:**

| Acción | Efecto medido sobre la moneda |
|---|---|
| Cambiar **empresa** (1002 → 1003) | USD → **VES** (junto con el reinicio del pedido) |
| Cambiar **tipo de pedido** (CFR ↔ FOB) | USD → **VES** — **silencioso**: el alert solo avisa *"¿Seguro desea cambiar el Tipo de Pedido? ¡El pedido será reiniciado!"*, **nunca menciona la moneda** |
| Cambiar **moneda** | **no** toca el tipo de pedido (el reseteo es unidireccional) |

Como la lista activa **Z12 de YARACUY (`idList` 28) tiene 0 filas en VES**, cada reseteo deja **todas las
categorías vacías**. El usuario ve "las categorías están pero no hay productos" sin haber tocado la moneda.

### 3. ¿Defecto o comportamiento esperado?

| # | Observación | Veredicto |
|---|---|---|
| 1 | El **tipo de pedido** gobierna qué categorías se listan | ✅ **Comportamiento esperado — por diseño.** Es literalmente lo que modela `order_type_product_structure`. **No es defecto.** |
| 2 | 🔴 Al cambiar de empresa, `tipoOrden` **conserva el objeto de la empresa anterior** ⇒ selector en blanco + **Tab Pedido con 0 categorías** hasta que el usuario reelija el tipo | ❌ **DEFECTO.** El reinicio del pedido no reasigna el tipo por defecto **de la empresa entrante** (`order_types.default_value=1` de 1003 = `idOrderType 4`). Es la causa directa de la intermitencia reportada. Deja al usuario ante un módulo aparentemente vacío **sin ningún mensaje**. |
| 3 | La **moneda se resetea a VES** al cambiar tipo o empresa, **sin avisarlo** | ⚠ **DEFECTO menor / UX.** El alert anuncia el reinicio del pedido pero no que la moneda vuelve al default. Combinado con "YARACUY no tiene precios en VES" produce un catálogo vacío que se lee como falta de datos. |
| 4 | El **badge de la categoría** no refleja el filtro de precio/moneda (`Azucar 8` lista 6 · `Azucar 10` lista 7 · `Alcohol 6` lista 0) | ⚠ **Cosmético**, ya registrado en el cuerpo de este reporte. **Reconfirmado en las dos empresas.** |

### 4. Estado residual e inconsistencias al cambiar de empresa

| Elemento | Comportamiento observado | Lectura |
|---|---|---|
| **Tipo de pedido** | 🔴 **queda el objeto de la empresa anterior** (`idOrderType 1` / `coEnterprise 1002` bajo YARACUY) | **Defecto** — ver punto 2 |
| **Moneda** | se resetea a **VES** | Defecto menor (silencioso) |
| **Cliente** | se **limpia** a "Seleccione Cliente" | ✅ Correcto, y **avisado** por el alert de reinicio |
| **Nro. de orden (`#nuPurchase`)** | se **limpia** | ✅ Coherente con el reinicio |
| **Tabs Pedido/Total/Adjunto** | **vuelven a `disabled`** (`lockSegments=true`) | ✅ Coherente: el `#nuPurchase` obligatorio quedó vacío |
| **Lista de precios** | queda **transitoriamente** la de la empresa vieja (`idList 11`, Z12 de 1002); **se corrige sola** al seleccionar el cliente nuevo (`idList 28`, Z12 de 1003) | ⚠ Residuo transitorio, **no llegó a materializarse** en el catálogo |
| **Tasa (`#tasa`)** | `652,9726`, `readonly=true` | Sin cambios |

**¿El árbol refresca (pregunta d)?** — **Sí.** Los tres selectores viven en el **Tab General**, así que siempre
hay un cambio de tab de por medio; al volver al Tab Pedido el árbol **siempre** reflejó la combinación vigente.
**No se observó estado viejo** (categorías de la combinación anterior) en ninguna de las 6 lecturas.
⇒ **no hay defecto de refresco**: el árbol vacío de YARACUY **no** es falta de refresco, es el tipo de pedido
huérfano del punto 2.

### Patrones nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| 🔴 **El TIPO DE PEDIDO es el que filtra las CATEGORÍAS del Tab Pedido — la empresa solo cambia el catálogo** | universal | `order_type_product_structure` mapea `id_order_type` → estructuras habilitadas. Verificado en UI en las 2 empresas de el_palmar: CFR → `Azucar`+`PVA`; FOB → agrega `Alcohol`. **Con el tipo fijo, cambiar de empresa NO cambia el conjunto de categorías**, solo contadores y productos cotizables. Antes de atribuir a la empresa un cambio de categorías, **leer `comp.tipoOrden`**. `[el_palmar-20260806]` |
| 🔴🔴 **Al cambiar de empresa, `comp.tipoOrden` retiene el objeto de la empresa ANTERIOR ⇒ selector en blanco y Tab Pedido con 0 categorías** | universal `# candidato` | Los `idOrderType` son **distintos por empresa** para el mismo código (`CFR` = 1 en 1002 y **4** en 1003; `FOB` = 3 en 1002 y **2** en 1003). Tras el alert *"El pedido tiene elementos de otra empresa… ¿Desea reiniciar el pedido?"* el valor viejo no matchea ninguna opción ⇒ el `ion-select` **renderiza vacío** y el árbol queda en **cero categorías, sin mensaje de error**. **Se destraba reeligiendo el tipo a mano.** Diagnóstico: comparar `comp.tipoOrden.coEnterprise` contra `comp.empresaSeleccionada.coEnterprise` — si difieren, el form está en estado huérfano. `[el_palmar-20260806]` |
| 🔴 **Cambiar el TIPO DE PEDIDO resetea la MONEDA a VES en silencio** | universal `# candidato` | El alert *"¿Seguro desea cambiar el Tipo de Pedido? ¡El pedido será reiniciado!"* **no menciona la moneda**, pero `comp.monedaSeleccionada` vuelve a `VES`. El reseteo es **unidireccional**: cambiar la moneda **no** toca el tipo. Combinado con el filtro `(lista activa × moneda)` ya documentado, **vacía el catálogo entero** en clientes sin precios en VES. **Re-verificar la moneda después de CADA cambio de tipo o de empresa.** `[el_palmar-20260806]` |
| **`ion-select` sin `id`: los del Tab General se re-renderizan según el estado del form** | universal | Los 7 `ion-select` del Tab General **solo existen tras seleccionar el cliente** (con el form recién abierto hay **1**: Empresa). Tras cambiar de empresa vuelven a ser 1. Índices estables una vez completo el form: `0` Empresa · `1` Moneda · `2` Dirección · `3` Tipo de pedido · `4` Canal · `5` Lista de precios (`disabled`) · `6` Condición de pago. `[el_palmar-20260806]` |
| **Popover de `ion-select`: las opciones son `ion-item`, sin `button`** | universal (confirma `[alipascua-20260804]`) | `ion-popover:not(.overlay-hidden) ion-item` + `mouse.click` con `{delay:150}`. `querySelectorAll('button')` sobre el popover devuelve `[]` y se lee como "no abrió". `[el_palmar-20260806]` |
| **Selección de cliente en el modal: esperar ~1,1 s tras `scrollIntoView` antes de leer el rect** | cliente | Con 900 ms el `mouse.click` al 35 %/35 % **no tomó** (form quedó sin cliente, sin error). Con **1100 ms** tomó al primer intento. `setClientfromSelector` **no prende** en este build (confirma `[gmp-20260730]`, contradice `[latino_cosmetica-20260729]`). El cliente `1000000803` cae en el **índice 3** en **ambas** empresas ⇒ 0 rondas de `onIonInfinite`. `[el_palmar-20260806]` |

*Verificación posterior · agente QA PEDIDOS · 2026-08-06 · estado final HOME · 0 pedidos guardados · 0 enviados*
