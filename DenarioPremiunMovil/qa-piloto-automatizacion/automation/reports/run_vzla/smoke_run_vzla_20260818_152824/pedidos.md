# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260818_152824_smoke-completo` |
| Módulo | PEDIDOS |
| Cliente | `run_vzla` |
| Empresa | `FERRE_N` / `id_enterprise=1` · rótulo UI **`CORPORACION FERRE 19`** (`lb_enterprise`) |
| App | `com.kiberno.denarioPremiumPro` · `window.ng=true` · `sqlitePlugin` disponible |
| Playa | **LA TORTUGA** — `http://denariolatortuga.ddns.net:8081/PremiumWS/services/` (host del POST `orderservice/order` capturado por el hook) |
| Usuario QA | `id_user 470` · `co_user '000208'` |
| Viewport | 360 × 744 |
| Cliente de prueba | `006831` FERRETERIA EPA, C.A (`id_client=4163`) |
| Moneda | **`US$`** (mono-moneda: `multiCurrencyOrder=false`, Tab Total solo US$) |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Watchdog | `moduleMs=60 min`, `page` pasado · **0 cuelgues**, 0 `TIMEOUT:`, 0 `CDP-DOWN:` |
| Hook de payload | heredado y **vivo** (`__qaDataHook=true`, 21 payloads al arrancar) · **NO se reinstaló** |
| Namespace propio | `window.__qaPED` (13 skills) — sin tocar `__qaH` / `__qaCLI` |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | `app-pedidos` con los 3 `ion-button.colorBorderBuscar`: PEDIDO (180,107) · BUSCAR (180,176) · COPIAR (180,245) |
| DM-PED-002 | ✅ PASS | Form `app-pedido` con 4 tabs: `General:ok` · `Pedido/Total/Adjunto:segment-button-disabled`. Sin cliente (`hasClient=false`, `lockSegments=true`), `#clienteSelect="Seleccione Cliente"`, `imagenGuardar`/`imagenEnviar` **`disabled=true`** |
| DM-PED-006 | ✅ PASS | **Las dos ramas medidas.** `006831` (saldo neto **−22,50**, `countDueDate=128`) ⇒ **NO** dispara alerta — correcto por diseño (ver *Descubrimientos*). `006540` MARIBEL HAMMANI (saldo **404,64**, `countDueDate=3`) ⇒ alerta `Pedidos / "Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?"` `[CANCELAR, ACEPTAR]`; `CANCELAR` conserva el cliente anterior. Tras seleccionar cliente las 4 tabs habilitan (`lockSegments=false`) |
| DM-PED-015 | ✅ PASS | Tab Pedido: **36 categorías** (`ion-item.listaItems`) + cabecera `Favoritos 0 / Destacados 791 / Carrito 0`. Selector de estructura = `Marca` / `Sub-Linea` |
| DM-PED-017 | ✅ PASS | `LLA-01` ×60 ⇒ badge `.contadorProductos=" 60 "`, `carrito.length=1`, `subtotal=30,60` (60 × 0,51). Inventario **se reserva en vivo**: 215.074 → 215.014 |
| DM-PED-024 | ✅ PASS | Tab Total: `Total Items: 2` · `Total Base US$: 70,60` · `Total Pedido US$: 70,60`. Σ(subtotales) = 30,60 + 40,00 = **70,60** ✅ · `Base × (1+IVA) = Total` con **IVA = 0** ✅ |
| DM-PED-026 | ✅ PASS **al 1.er intento** | Trash de `ELE01` dentro de su `ion-accordion` (26×27 px en (41,467) tras `scrollIntoView` + re-lectura de rect): **borrado directo sin confirmación**, `146,60 → 70,60` y `Total Items 3 → 2` |
| DM-PED-029 | ✅ PASS | Con cliente seleccionado y `carrito=0`, `imagenGuardar.disabled=true` y `imagenEnviar.disabled=true`. Habilitan (`false`) recién con ≥1 línea |
| DM-PED-030 | ✅ PASS · **BD-SAVED** | Alert `Denario / "Pedido Guardado"` `[OK]` a los 1,6 s. Local `orders`: `co_order=1787083096656.0`, `id_order=0`, **`st_delivery=3`**, `nu_amount_total=70,60`, `nu_details=2`, `tx_comment='Test-PED-SMOKE-160554'`. Aparece en BUSCAR como **Nro. Ref.: 0 · Estatus: Guardado** con trash |
| DM-PED-031 | ✅ PASS · **BD-OK** | **2 alerts** (no 3): `Pedidos / ¿Desea Enviar el pedido?` `[CANCELAR, ACEPTAR]` → `Denario Pedidos / Su Pedido será enviado` `[OK]` → navega a `/pedidos` **sin** el "Pedido nro. X enviado exitosamente". Nube `id_order=**2820**`, `st_order=1`, local `st_delivery=1`. En la lista queda **Nro. Ref.: 2820 · Enviado** |
| DM-PED-032 | ✅ PASS | Form sucio (2 líneas sin guardar) + `img.fechaAtras` (32,47) ⇒ modal `¡Alerta!` con **3 opciones** `[GUARDAR Y SALIR, SALIR SIN GUARDAR, CANCELAR]`. `CANCELAR` conserva el form con las 2 líneas |
| DM-PED-034 | ✅ PASS | `ion-searchbar` en `app-pedidos-lista`: 99 → **1** (`MARIBEL`) → **99** (vaciar) → **0** (`ZZZZQQ`, empty-state) → **99**. Filtra realtime y **repuebla solo** |
| DM-PED-035 | ✅ PASS · round-trip §9 OK | Reapertura del Guardado Ref 0 (click al 35 % ancho / 40 % alto): las 4 tabs habilitadas y **todos los valores intactos** — cliente `FERRETERIA EPA, C.A (006831)`, comentario `Test-PED-SMOKE-160554`, `carrito=2`, `nuAmountTotal=70,60`, `nuDetails=2`, `stDelivery=3`, `idOrder=0`. ⚠ La navegación tardó **30,3 s** (ver *Hallazgos* H-1) |
| DM-PED-037 | ✅ PASS | Trash del ítem Ref 0 en la lista (29×25 px en (301,195)) → alert `Pedidos / "¿Seguro que quieres eliminar este pedido?"` `[CANCELAR, ACEPTAR]` → lista **100 → 99** y la fila desaparece de `orders` local (`count=0`) |

---

## Registros creados en sistema

| Ref (UI) | Documento / Registro | Detalle | Estado | Marca BD |
|----------|----------------------|---------|--------|----------|
| **2820** | Pedido `order` · `id_order=2820` · `co_order=1787083096656.0` | Cliente `006831` FERRETERIA EPA (`id_client=4163`) · 2 líneas: **LLA-01 ×60 = 30,60** · **TM01 ×50 = 40,00** · Total US$ **70,60** · comentario `Test-PED-SMOKE-160554` · `co_payment_condition=005` (CONTADO) · almacén `001` LA MORITA · despacho 2026-08-20 | **Enviado** (`st_order=1` nube · `st_delivery=1` local) | **BD-OK** / **BD-FIELD-OK** |
| 0 | Pedido local `orders` · `co_order=1787083954495.0` (nunca enviado) | `DICGU01` ×10 = US$ 26,00 — creado exclusivamente para ejercer DM-PED-037 | **Guardado → BORRADO** | BD-SAVED (no llegó a nube, correcto) |

### Diff de baseline — filtrado por `id_user = 470` (tenant vivo, 7 vendedores transaccionando)

Baseline tomado **inmediatamente antes** de pulsar Enviar, medido con `count(*)`, nunca con `max(id)`:

| Momento | `count(*)` | `count(DISTINCT co_order)` | `max(id_order)` |
|---|---|---|---|
| Antes de Enviar | 98 | 98 | 2819 |
| Después | **99** | **99** | **2820** |

`count(*) = count(DISTINCT co_order)` ⇒ **sin duplicados**. Local: `pending_transactions = 0` · `failed_transactions = 0` · `orders` 99 filas / 99 `co_order` distintos ⇒ **sync INMEDIATA**.

### Verificación BD — cotejo campo a campo (payload ↔ nube)

Hook `Capacitor.nativePromise`: **1 solo POST** `orderservice/order`, con `data` completo, sin duplicados.

**Cabecera `order`**

| Campo | Payload | Nube `order` (id 2820) | ✓ |
|---|---|---|---|
| coOrder | `1787083096656.0` | `1787083096656.0` | ✅ |
| coClient / idClient | `006831` / `4163` | idem | ✅ |
| nuAmountTotal | `70.6` | `70.6000` | ✅ |
| nuAmountFinal | `70.6` | `70.6000` | ✅ |
| nuAmountTotalBase | `70.6` | `70.6000` | ✅ |
| nuAmountTax | `0` | `0.0000` | ✅ |
| nuAmountDiscount | `0` | `0.0000` | ✅ |
| nuDetails | `2` | `2` | ✅ |
| txComment | `Test-PED-SMOKE-160554` | idem | ✅ |
| coEnterprise / idEnterprise | `FERRE_N` / `1` | idem | ✅ |
| coUser / idUser | `000208` / `470` | idem | ✅ |
| coCurrency | `US$` | `US$` | ✅ |
| coPaymentCondition | `005` | `005` | ✅ |
| idOrderType | `1` | `1` | ✅ |
| coAddress / coAddressClient | `006831` | `006831` | ✅ |
| daDispatch | `2026-08-20T04:00:00` | `2026-08-20T04:00:00Z` | ✅ |
| coordenada | `11.04899,-63.8651167` | idem | ✅ |
| nuPurchase / naResponsible | `""` / `""` | `""` / `""` | ✅ |
| hasAttachments / nuAttachments | `false` / `0` | `false` / `0` | ✅ |
| procedencia | `Denario` | `Denario` | ✅ |
| daOrder | `2026-08-18 16:10:12` (local UTC-4) | `2026-08-18T20:10:12Z` | ✅ *(nota de zona horaria, no mismatch — §10.b)* |
| nuValueLocal | `null` | `0.0000` | ✅ *(mono-moneda: la moneda del pedido YA ES la de conversión — no es dato faltante)* |

**Líneas `order_detail` + `order_detail_unit`** (FK **texto** `co_order='1787083096656.0'`)

| pos | co_order_detail | co_product | nu_price_base | qu_order | nu_base_total | nu_amount_total | **iva** | nu_amount_tax | nu_discount_total | co_warehouse |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | `1787083812455.0` | **LLA-01** | 0,5100 | **60,0000** | 30,6000 | **30,6000** | **0,0000** | 0,0000 | 0,0000 | 001 |
| 1 | `1787083812455.1` | **TM01** | 0,8000 | **50,0000** | 40,0000 | **40,0000** | **0,0000** | 0,0000 | 0,0000 | 001 |

`det = 2 = nu_details` · `units = 2 ≥ det` · Σ`nu_amount_total` = **70,60** = `order.nu_amount_total` ✅
🔴 **`iva = 0,0000` leído en las DOS líneas** ⇒ el oráculo `Base × (1+IVA) == Total` se cumple. **No se levanta "el IVA no se calcula"** (confirmado en BD, no asumido).

⇒ **`BD-OK` / `BD-FIELD-OK`**. Correlación **Nro. Ref UI = `id_order` = 2820** reconfirmada en la lista y en las dos bases.

---

## 🟢 `productMinMul` — la VG nueva del cliente: **FUNCIONA, 4/4 productos**

Primera corrida de toda la serie que ejerce esta VG. `productMinMul=true` se manifiesta en **dos** lugares:

1. **En el ítem del catálogo:** el `textContent` del producto suma dos etiquetas nuevas entre `Precio:` e `Inventario:`
   `Código: LLA-01 Precio: 0,51 US$ **Mínimo: 20** **Múltiplo: 20** Inventario: 215074`
2. **En la validación al cargar cantidad**, con **auto-corrección** — la app no rechaza, **ajusta**.

| Producto | Mínimo | Múltiplo | Cantidad tecleada | Alerta | Cantidad resultante |
|---|---|---|---|---|---|
| `LLA-01` | 20 | 20 | **5** (< mínimo) | `Denario / "La Cantidad Mínima de este Producto es 20 y el múltiplo es 20"` `[OK]` | **20** (sube al mínimo) |
| `LLA-01` | 20 | 20 | **30** (no múltiplo) | misma alerta | **40** (sube al siguiente múltiplo) |
| `LLA-01` | 20 | 20 | **60** (válido) | **ninguna** | **60** ✅ |
| `TM01` | 25 | 25 | **50** (válido) | **ninguna** | **50** ✅ |
| `ELE01` | 20 | 20 | **10** (< mínimo) | misma alerta | **20** |
| `DICGU01` | 10 | 10 | **1** (< mínimo) | misma alerta | **10** |
| **`GU01`** | — | — | — | — | ⚠ **no muestra ninguna de las dos etiquetas** |

**Conclusiones medidas:**
- La corrección **persiste hasta la nube**: `qu_order = 60` y `50` en `order_detail_unit` del pedido 2820 son los valores **corregidos**, no los tecleados.
- **`GU01` NO rotula Mínimo/Múltiplo** ⇒ las etiquetas se renderizan **por producto**, solo cuando `quMinimum`/`quMultiple` traen valor. La VG habilita la función; el dato la activa. ⚠ **No leer la ausencia de las etiquetas como "la VG no rinde"** — hay que mirar otro producto.
- El mensaje es **uno solo** para ambas violaciones (mínimo y múltiplo), aunque la infracción sea solo de una de las dos.
- Cantidades **enteras** en todos los casos, coherente con `quUnitDecimals=false`.

---

## Descubrimientos

### 🔴 La alerta de deuda vencida NO depende de "tener documentos vencidos" — depende del **saldo NETO**

La condición exacta, leída del propio componente (`app-pedido.setClientfromSelector`), es:

```
!skipDebtValidation && !openOrder && Number((saldo1 ?? 0) + (saldo2 ?? 0)) > 0
  && order?.stDelivery !== DELIVERY_STATUS_SENT && order?.stDelivery !== null
  && cliente.countDueDate > 0
```

⇒ hacen falta **las dos** cosas: saldo neto **> 0** *y* `countDueDate > 0`.

| Cliente | `saldo1` | `saldo2` | `countDueDate` | ¿Alerta? |
|---|---|---|---|---|
| `006831` FERRETERIA EPA | **−22,50** | 0 | **128** | **NO** — el saldo neto es a favor |
| `006540` MARIBEL HAMMANI | **404,64** | 0 | 3 | **SÍ** |

📌 **El perfil declara `alerta_deuda_vencida: true` para `006831` y eso es incorrecto**: arrastra la cifra bruta (1.258,92, solo positivos) ya corregida por el agente de CLIENTES. Con el neto real **−22,50** la alerta **no debe** aparecer, y **no aparece**. **No es defecto — es el perfil el que hay que corregir.** Para ejercer la rama de deuda vencida en run_vzla hay que usar **`006540`**.

⚠ Dato colateral: `countDueDate` de `006831` es **128**, no 12 — cuenta *todos* los documentos con fecha de vencimiento pasada, incluidas las 116 notas de crédito.

### 🔴 `validateWarehouses` efectivo en el dispositivo es **`true`**, no `false` — el override del cliente **NO gana**

Leído en vivo de `orderServ`: `validateWarehouses = **true**`.

El perfil `run_vzla.yaml` lo declara `false` y lo presenta como *"la ÚNICA clave donde gana el override del cliente"* (client 2026-02-10 `false` vs global 2025-10-13 `true`). **Lo que baja al dispositivo es el valor GLOBAL (`true`).**
⇒ Se mantiene la regla de los otros tenants: **gana el global**. 📌 Corregir el YAML y retirar la nota "primer cliente donde gana un override".

### 🟢 Mapa de VGs por **ausencia de controles** (sin provocar el comportamiento)

| Dónde | Lo que hay | VG que se lee |
|---|---|---|
| Tab General · `ion-select` (5) | Empresa `disabled` (1 opción, objeto completo) · Moneda `disabled` (`US$`) · Sucursal `disabled` · Lista de precios `disabled` (2 opciones: `PRECIO LISTA 1`/`PRECIO LISTA 5`) · **Condición de pago `disabled=false`, 11 opciones** | `orderEnterpriseEnabled=false` · `multiCurrencyOrder=false` · `userCanChangePriceList=false` · **`userCanChangePaymentConditions=true` ✅** |
| Tab General · **sin** selector de tipo de pedido | — | **`selectOrderType=false` ✅** (`id_order_type=1` se resuelve solo y viaja correcto) |
| Tab **Total** · **0 `ion-select`** | — | **`userCanSelectGlobalDiscount=false` ✅** |
| Panel de línea · **3** `ion-select` | Lista de Precio `disabled` (1 opción) · Unidad `disabled=false` (1 opción `UNIDADES`) · Almacén `disabled` (`LA MORITA`) | `userCanChangePriceList=false` · **`userCanChangeWarehouse=false` ✅** · **sin "% Descuento" ⇒ `userCanSelectProductDiscount=false` ✅** · **sin "IVA" ⇒ `userCanSelectIVA=false` ✅** |

### ✅ Pendientes del YAML resueltos por este módulo

| # | Pendiente | Resolución medida |
|---|---|---|
| 4 | Alcance real de `requiredComment` | **En PEDIDOS el comentario NO es obligatorio.** Con `#txComment` vacío, `imagenGuardar`/`imagenEnviar` ya salen habilitados y `isCommentRequiredMissing()` devuelve `false`. `requiredCommentOrder=false` **manda sobre** `requiredComment=true`. ⚠ El `maxlength` real del input es **255**, no el 250 de `longitudComentario` (mismo patrón que kron: 255 vs 200). Rótulo en pantalla: `Mín. 0 - Máx. 255 caracteres` + contador `0/255` |
| 5 | `listProductsBy="lineas"`: ¿nombra el tipo de estructura? | **No.** El selector de estructura del Tab Pedido ofrece **`Marca` / `Sub-Linea`** — ningún rótulo dice "lineas". **Confirma kron: la VG designa el MODO de agrupar, no el rótulo.** |
| 6 | `productMinMul=true` | **Ejercida y validada, 4/4** — ver la sección dedicada |

### 🚫 Pedido Sugerido — **N/A por DATOS, medido en el insumo (no es FAIL)**

El botón no se renderiza en ninguna tab. Antes de anotarlo como la enésima "divergencia UI-vs-config", se midió la tabla que lo alimenta (receta de `[kron-20260817]`):

```
client_avg_product → 24 filas / 2 clientes: 007848 (16) y 007494 (8)
```

**`006831` no tiene una sola fila** ⇒ para el cliente de la corrida **no hay insumo** para sugerir. Además `suggestedOrder` **ni siquiera existe como propiedad de `orderServ`** en este build. ⇒ **N/A por datos**, no defecto. *(Para ejercerlo de verdad haría falta correr con `007848` o `007494`.)*

### 🟢 Inventario se reserva en vivo (4.ª confirmación) y se **satura en 0**

`LLA-01`: 215.074 → 215.054 (20 uds) → 215.034 (40) → 215.014 (60), sin recargar.
`DICGU01` (inventario **2**): al cargar 10 uds el rótulo pasó a **`Inventario: 0`** — **no baja a negativo**. No hubo alerta de "producto sin inventario", coherente con `validStock=false`.

### ⚠ Etiquetas de alert medidas en este módulo (leídas, nunca predichas)

| Momento | Título | Mensaje | Botones |
|---|---|---|---|
| Deuda vencida | `Pedidos` | `Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?` | `[CANCELAR, **ACEPTAR**]` |
| Mínimo/múltiplo | `Denario` | `La Cantidad Mínima de este Producto es N y el múltiplo es M` | `[**OK**]` |
| Guardar | `Denario` | `Pedido Guardado` | `[**OK**]` |
| Enviar · paso 1 | `Pedidos` | `¿Desea Enviar el pedido?` | `[CANCELAR, **ACEPTAR**]` |
| Enviar · paso 2 | `Denario Pedidos` | `Su Pedido será enviado` | `[**OK**]` — **y no hay paso 3** |
| Dirty-guard | `¡Alerta!` | *(sin cuerpo)* | `[GUARDAR Y SALIR, SALIR SIN GUARDAR, CANCELAR]` |
| Borrado desde lista | `Pedidos` | `¿Seguro que quieres eliminar este pedido?` | `[CANCELAR, **ACEPTAR**]` |

**Todas en MAYÚSCULAS**, como en el tramo de carga de difranca. Los ~12 alerts se resolvieron **sin un solo reintento** comparando en minúsculas por **igualdad exacta**.

### Otras confirmaciones

- **`app-pedidos-lista` repuebla al vaciar el buscador (3.ª confirmación):** 99 → 1 → **99**. `PRD-BUSCADOR-NO-REPUEBLA` sigue siendo exclusivo de PRODUCTOS.
- **Guardar NO deja el form pristine (3.ª confirmación, 3.er servidor):** tras `Pedido Guardado` el atrás volvió a disparar el dirty-guard de 3 opciones. Confirma `[grupo_fiel-20260817]` (El Yaque) y `[kron-20260817]` (Isla Coche), ahora en **La Tortuga** ⇒ la nota vieja `[gmp-2611][ins-2622][jerez-2026-07-06]` queda definitivamente derogada. "Salir sin guardar" es seguro: el Guardado persiste.
- **Tab Total con 3 accordions PLANOS** (`Total por unidad` + uno por producto, los 3 con rect >0 desde el arranque) — como kron, **no** anidado por línea como grupo_fiel.
- **Estructura del catálogo = variante DRILL-DOWN** (`ion-accordion-group=0` y `ion-accordion=0` en el nivel de categorías). 4.ª confirmación de que la variante sigue al **build v1.0/db19**, no al servidor.
- **Firma:** `signatureOrder=true` pero el envío **no pidió firma** (`signature=null` en nube). Coherente con la aclaración de QA del 2026-07-29 — la VG habilita, no obliga. **No es defecto.**
- **Adjunto:** la tab existe pero `hideAdjunto=true` y el envío viajó con `hasAttachments=false` / `nuAttachments=0` sin bloquear ⇒ **nada exigió adjunto en PEDIDOS**, no hizo falta dejar nada en Guardado.

---

## Hallazgos

### 🟠 H-1 · Entrar al formulario de pedido espera un fix de GPS **sin ningún indicador**, hasta 30 s

**Supera el gate de §4.b:** reproduce **hoy**, en la build bajo prueba, con registros nuevos; se midió 3 veces en esta misma corrida.

**Mecanismo (leído del componente, no inferido):** tanto `app-pedidos.nuevoPedido()` como `app-pedidos-lista.selectOrder()` tienen la misma guarda —

```js
if (userMustActivateGPS) {
  if (!coordenadas || coordenadas.length == 0) {
    geoLoc.getCurrentPosition().then(xy => { if (xy.length > 0) { coordenadas = xy; goToNuevoPedido(); } });
  } else { goToNuevoPedido(); }
} else { goToNuevoPedido(); }
```

La navegación queda **dentro del `.then()`** del fix de GPS. `GeolocationService.getCurrentPosition()` **cachea la posición solo 60 s** (`setTimeout(() => { posicion = null; permiso = false; }, 60000)`), así que en cuanto pasa un minuto el siguiente ingreso vuelve a pagar el fix completo.

**Mediciones:**

| Acción | Espera hasta navegar |
|---|---|
| 1.er `PEDIDO` (caché de GPS vacía) | **> 20 s** — 3 clicks parecieron "no responder"; se instrumentó `nuevoPedido` y quedó registrado `nuevoPedido called → ret ok` **sin** `goToNuevoPedido` |
| `geoLoc.getCurrentPosition()` medido aislado | **10,4 s** |
| `PEDIDO` con caché caliente | **1,0 s** |
| Reabrir un Guardado desde la lista (DM-PED-035) | **30,3 s** |

**Impacto:** durante esos 10-30 s **no hay `ion-loading`, ni spinner, ni alert** — el botón simplemente no hace nada. Para el vendedor en calle es indistinguible de "la app se colgó", y el reflejo natural es volver a pulsar (cada pulsación encola otro fix). **No pierde datos y termina navegando**, por eso no es FAIL funcional: es un problema de **feedback / rendimiento percibido**.

**Sugerencia para desarrollo:** mostrar un `ion-loading` («Obteniendo ubicación…») mientras se resuelve el fix, y/o dar un techo con fallback a `getLatestPosition()`.

**Coste para la automatización:** dos casos parecieron BLOCKED antes de diagnosticarlo. **Toda espera de navegación en PEDIDOS debe tener un techo de ≥ 35 s.**

### 🟡 H-2 · `disableDaDispatch=true` no deshabilita la Fecha de Despacho — observación, **pendiente de oráculo**

Con `orderServ.disableDaDispatch = **true**` medido en vivo:

| Control | Estado |
|---|---|
| `Fecha Pedido` | `ion-button` **`disabled=true`**, rotula `18/8/2026, 3:58 P. M.` |
| `Fecha Despacho` | `ion-button.letrasFechasButton` **`disabled=false`**, rotula `Seleccione una fecha`; al clickearlo **abre el modal** (`openDaDispatchModal=true`) con un `ion-datetime` `disabled=false` / `readonly=false` |

Es decir, la fecha de despacho **es plenamente editable** con la VG en `true`. Además el modelo ya trae `fechaDespacho='2026-08-20T04:00:00'` (hoy + 2) mientras el botón sigue rotulando *"Seleccione una fecha"*, y ese valor es el que viajó a la nube (`da_dispatch=2026-08-20`).

**No se marca FAIL:** falta el oráculo de qué debe hacer exactamente `disableDaDispatch` (¿bloquear el control, o solo impedir que el usuario *cambie* el default?), y leer `../src/` está fuera de alcance sin un FAIL S1. Reproduce **hoy** con datos de hoy, así que pasa el filtro de §4.b como cosa a mirar; lo que falta es la especificación. 📌 **Verificar con desarrollo.**

*(No es defecto y no se levanta: la ausencia del botón "Pedido Sugerido" — se midió el insumo y no hay datos; ni el IVA en 0 — se leyó `order_detail.iva=0` en las dos líneas.)*

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **La guarda de GPS bloquea la NAVEGACIÓN de PEDIDOS, no solo el guardado** | universal | `nuevoPedido()` y `selectOrder()` dejan `router.navigate` **dentro del `.then()`** de `getCurrentPosition()`. Con `userMustActivateGPS=true` y caché fría el click parece muerto **10-30 s** sin loading. **Diagnóstico barato:** envolver `comp.nuevoPedido` y ver si loguea la llamada sin llegar a `goToNuevoPedido` ⇒ es GPS, no el selector. **Techo de espera ≥ 35 s antes de declarar BLOCKED.** La caché de posición **expira a los 60 s**, así que el siguiente ingreso vuelve a pagarlo. |
| 🔴 **La alerta de deuda vencida exige `saldo1+saldo2 > 0` Y `countDueDate > 0`** | universal | Un cliente con muchos documentos vencidos pero **saldo neto a favor** (notas de crédito) **no** dispara la alerta, y eso es correcto. **Leer `saldo1`/`saldo2`/`countDueDate` del objeto de `selectorCliente.clientes` ANTES de dar el caso por fallido**, y elegir un cliente con saldo positivo si hay que ejercer la rama. |
| 🔴 **`productMinMul` AUTO-CORRIGE la cantidad; y las etiquetas son POR PRODUCTO** | universal | Alert `Denario / "La Cantidad Mínima de este Producto es N y el múltiplo es M"` `[OK]` y la app **sube** al mínimo o al siguiente múltiplo (5→20, 30→40, 1→10). El valor corregido es el que viaja a `order_detail_unit.qu_order`. ⚠ **Un producto sin `quMinimum`/`quMultiple` (ej. `GU01`) no rotula ninguna de las dos etiquetas** ⇒ no leer su ausencia como "la VG no rinde": probar otro producto. Los campos del carrito son `quMinimum` / `quMultiple`. |
| ⚠ **`#txComment` puede quedar BAJO EL FOLD (`y≈806` con viewport 744)** | universal | El rect es válido pero el punto no es clickeable: el `mouse.click` cae fuera y el comentario queda **vacío sin error** — se lee como "el comentario no persistió" (falso FAIL de round-trip §9). **`scrollIntoView({block:'center'})` + re-leer el rect** antes de teclear, y **verificar `#txComment.value` antes de Guardar**. Su posición **varía entre aperturas del mismo form** (y≈544 en una, y≈806 en otra). |
| 🔴 **La FK de `order_detail` es `co_order` (TEXTO)** | universal | `WHERE co_order='1787083096656.0'`. Un `WHERE co_order=2820` revienta con *"operator does not exist: text = integer"*. La cabecera sí se filtra por `id_order`. ⚠ `order` **no tiene** `co_address`/`id_address`: son `co_address_client`/`id_address_client`. `order_detail` **no tiene** `qu_amount` — la cantidad vive en `order_detail_unit.qu_order`; el detalle solo trae `nu_price_base`/`nu_amount_total`. |
| **Selector de estructura del Tab Pedido = `Marca` / `Sub-Linea`** | cliente | `listProductsBy="lineas"` **no** nombra el tipo. Confirma kron. 36 categorías bajo `Marca`; cabecera `Favoritos / Destacados (791) / Carrito`. |
| **Buscador de productos: la vía más barata a un SKU (4/4 sin fallo)** | universal | `ion-icon[name="search-circle-sharp"]` (315,145) → `input.search-input.inputsSearch` (180,146) → código + `Enter` deja los `ion-accordion` que matchean. ⚠ **matchea por substring**: `GU01` devolvió `DICGU01` **primero** y `GU01` segundo ⇒ **verificar el código exacto del acordeón antes de sellar el input**, o se carga el producto equivocado. |
| **Sellado del input de cantidad POR DESCARTE — 4/4** | universal | Tras expandir con `mouse.click` en `(180, rectTop+30)`, el único `ion-input[type=number]` con `height>0` y **sin `id`** es el del producto recién abierto → `el.id='qa-cant-<COD>'`. Los `ion-accordion` **no traen `value`** y el input **no trae `label`** ⇒ no valen las recetas de latino_cosmetica ni de difranca. |
| **El Tab General solo muestra sus 5 selects y 4 inputs con cliente ya seleccionado** | universal | Sin cliente: 1 `ion-select` (Empresa) + 1 `ion-input` (`#clienteSelect`). Confirma `[grupo_fiel-20260817]`. ⚠ **En este build NO existe `#tasa`** (tenant mono-moneda): el orden de inputs es `#clienteSelect` · `#nuPurchase` · `#naResponsible` · `#txComment` — **indexar por `id`, nunca por posición**. |
| **Las tabs habilitan ~2-4 s DESPUÉS de `lockSegments=false`** | universal | El snapshot inmediato tras seleccionar cliente muestra `hasClient=true`, `lockSegments=false` y las tabs **todavía** con `segment-button-disabled`. Reintentar `ng.applyChanges` + esperar; no marcar FAIL en el primer snapshot. |
| Coords estables (device Infinix, 360×744) | cliente | Home pedidos: PEDIDO (180,107) · BUSCAR (180,176) · COPIAR (180,245). Header: `imagenGuardar` (267,32) · `imagenEnviar` (326,32). Back: **(32,47)** — hay 4 `img.fechaAtras` y **solo 1 con rect >0**. Tab Pedido: lupa (315,145) · input búsqueda (180,146) · header del 1.er acordeón (180,210) · input cantidad (180,364). Lista: searchbar (180,104) · trash del 1.er ítem (301,195). |

> OK consolidado 2026-08-19 -> module-selectors/ + RUNTIME.md  [run_vzla-20260818]

---

## Resumen técnico

**14/14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED · 0 cuelgues de CDP.** Wall-clock ≈ 25 min, **26 `browser_run_code_unsafe`**.

1. **Pedido Ref 2820 Enviado, `BD-OK` + `BD-FIELD-OK`**: cabecera 22/22 campos y las 2 líneas con sus 2 unidades cuadran payload ↔ nube; diff de baseline filtrado por `id_user=470` exactamente **+1** (98 → 99, `count(*) = count(DISTINCT co_order)`), colas vacías, sync inmediata, sin duplicados.
2. **Los dos oráculos de pedidos se cumplen**: Σ(subtotales) = 30,60 + 40,00 = **70,60** = Monto Base, y `Base × (1+IVA) = Total` con **`iva=0,0000` leído en las dos líneas de `order_detail`** — el IVA 0 de este tenant queda confirmado en BD, no asumido.
3. **`productMinMul` ejercida por primera vez en la serie y funciona**: valida y **auto-corrige** (5→20, 30→40, 1→10), el valor corregido llega a la nube, y las etiquetas `Mínimo:`/`Múltiplo:` son **por producto** (`GU01` no las trae).
4. **Round-trip §9 perfecto** al reabrir el Guardado: cliente, comentario, 2 líneas y total intactos.
5. **Dos correcciones al perfil**: `alerta_deuda_vencida` de `006831` es **false** (saldo neto −22,50; la alerta exige saldo > 0), y `validateWarehouses` efectivo en el dispositivo es **`true`** — **gana el global**, no el override del cliente.
6. **Tres pendientes del YAML cerrados** (#4 `requiredComment` no aplica a pedidos y el `maxlength` real es 255 · #5 `listProductsBy` no nombra el tipo, el selector dice `Marca`/`Sub-Linea` · #6 `productMinMul` validada).
7. **Dos hallazgos abiertos**: H-1 espera de GPS de hasta 30 s sin feedback al entrar al form (usabilidad/rendimiento, supera §4.b), y H-2 `disableDaDispatch=true` con la fecha de despacho plenamente editable (observación, falta el oráculo).
8. App devuelta a **HOME** (`app-home` visible, 0 alerts, 0 modals) para el módulo siguiente (DEVOLUCIONES).

---
Agente: **PEDIDOS** · modelo Opus · RUN_ID `20260818_152824_smoke-completo`
