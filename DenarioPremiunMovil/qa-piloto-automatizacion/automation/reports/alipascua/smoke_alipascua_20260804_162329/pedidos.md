# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260804_162329_smoke-completo` |
| Módulo | PEDIDOS |
| Cliente QA | alipascua |
| Dispositivo | 14678405BR003855 (Infinix HOT 60i · X6728) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Playa / servidor | EL YAQUE — `http://denarioelyaque.ddns.net:8081/PremiumWS/services/` |
| Empresa | ALIPASCUA, C.A. (`ALIP_BSD`, id_enterprise=2) — `ion-select` **disabled** (enterpriseEnabled=false) |
| Usuario / vendedor | coUser `002` · idUser `468` |
| Cliente de prueba | V28556138 — RENZO FERNANDO MARTINEZ MEJIAS (id_client 1744) |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Watchdog | 0 cuelgues · 0 `TIMEOUT` · 0 `CDP-DOWN` |
| GPS | ✅ sin problemas — `coordenada` viajó en el payload: `11.0490588,-63.8649885` |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | `/pedidos` con los 3 accesos `ion-button`: PEDIDO · BUSCAR · COPIAR |
| DM-PED-002 | ✅ PASS | Form `/pedido`: General activo; Pedido/Total/Adjunto con `segment-button-disabled`; cliente vacío; Guardar y Enviar disabled |
| DM-PED-006 | ✅ PASS | Alerta **"Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?"** (Cancelar/**Aceptar**) → aceptada al 1er intento → `hasClient=true` y las 4 tabs habilitadas |
| DM-PED-015 | ✅ PASS | Tab Pedido lista 7 categorías por Proveedor: CASA CLEAN 6 · IANCARINA 95 · ISOLA FOODS 192 · JAI 28 GROUP 49 · OLYMPIA 46 · PARAWA 77 · SUALCA 2 |
| DM-PED-017 | ✅ PASS | Cantidad=2 en `75992200000281`: badge `contadorProductos`=2, "Items 1/15", indicador `[color=success]`, Guardar/Enviar habilitados |
| DM-PED-024 | ✅ PASS | Tab Total ≠ 0: Base US$ 3,5600 · Desc. productos 0,1780 · Desc. Global 0,2367 · **Total Pedido US$ 3,1453** |
| DM-PED-026 | ✅ PASS | Trash dentro del `ion-accordion` del ítem (tras `scrollIntoView`): Items 2→1 y Total **7,8631 → 3,1453** |
| DM-PED-029 | ✅ PASS | Sin ítems (con y sin cliente) Guardar y Enviar quedan `button-disabled`; habilitan recién al cargar la 1ª cantidad |
| DM-PED-030 | ✅ PASS | Alert **"Denario / Pedido Guardado"** (botón OK) + pedido en BUSCAR con `Nro. Ref.: 0 … Estatus: Guardado`; comentario `Test-PED-SMOKE-170049` |
| DM-PED-031 | ✅ PASS | Envío OK → **Nro. Ref. 4309 · Estatus: Enviado** en lista y `id_order=4309` en BD. ⚠ Secuencia de **2 alerts** (no 3), ver Hallazgos-menores |
| DM-PED-032 | ✅ PASS | Atrás con form sucio → modal **"¡Alerta!"** con las 3 opciones: Guardar y salir / Salir sin guardar / Cancelar |
| DM-PED-034 | ✅ PASS | Searchbar "RENZO": lista filtra en tiempo real 97 → 8 ítems, todos del cliente buscado |
| DM-PED-035 | ✅ PASS | Reabrir el Guardado: form editable con las 4 tabs habilitadas; cliente y comentario rehidratados; totales idénticos (round-trip §9 OK) |
| DM-PED-037 | ✅ PASS | Trash en lista (`ion-button[color=danger]`, w≈29) → alert "¿Seguro que quieres eliminar este pedido?" → Aceptar → lista 98 → 97, Ref 0 desaparece |

---

## Verificación de VGs

### 1. `userCanSelectProductDiscount` — perfil dice **false** → **VALOR REAL = `true`** ❌ perfil incorrecto

**Manda la UI, y la UI lo contradice de forma inequívoca.**

| Evidencia | Detalle |
|---|---|
| Selector existe | En el panel expandido de **cada producto** hay un `ion-select` rotulado **"Descuento"** con placeholder `% Descuento` |
| Está habilitado | `sel.disabled === false` (contrastar con los dos selects del mismo panel que sí llegan `disabled`: Lista de Precio y Almacén) |
| Tiene opciones reales | `% Descuento`(v=0) · **5**(9547) · **7**(9550) · **8**(9553) · **10**(9556) · **3**(9559) |
| Acepta valor | Click real → `ion-popover` con `ion-radio-group` → opción **10** → `sel.value` pasó `9547` → `9556` |
| **Impacta el total** | Al pasar de 5 % a 10 %: `Descuento productos US$` **0,1780 → 0,3560**; línea del ítem `Descuento 5,0000%: 0,0890 US$` → `Descuento 10,0000%: 0,1780 US$`; `Monto - Desc.` 1,6910 → 1,6020; **Total Pedido US$ 3,1453 → 2,9797** |
| **Viaja al servidor** | El payload de `orderservice/order` trae la colección `orderDetailDiscount`: `{"idDiscount":9547,"quDiscount":5,"nuPriceFinal":1.691}` y la cabecera `nuAmountTotalProductDiscount: 0.178` |
| **Persiste en BD** | `order_detail.id_discount = 9547` · `order_detail.nu_discount_total = 0.1780` |

**Veredicto: el descuento por línea existe, es seleccionable, altera el total y llega a la base. `userCanSelectProductDiscount` real = `true`. Corregir el perfil de alipascua (dice `false`).**

> Nota operativa: el descuento **nace pre-aplicado en 5 %** (no en "sin descuento") al expandir el producto, y **vuelve a 5 % si se colapsa y re-expande el acordeón** — por eso el pedido finalmente enviado quedó con 5 %. No se reporta como defecto: el re-render del acordeón reinicia el control y el usuario ve el valor vigente en pantalla; queda como observación para desarrollo.

### 2. `validateWarehouses` — perfil dice **false** → **CONFIRMADO `false`** ✅ perfil correcto

| Evidencia | Detalle |
|---|---|
| Prueba directa | Con el producto `75992200000281` (Inventario **30**) se cargó cantidad **999** |
| Resultado | **Aceptado sin ninguna alerta y sin bloqueo**: `contadorProductos`=999, el ítem quedó válido, Guardar/Enviar siguieron habilitados. Ningún `ion-alert` activo, `app-message.messageService.showingMessage=false` |
| Almacén asignado | Se resolvió solo a `3 - ALMACEN` (`co_warehouse="01"`) sin validar disponibilidad |
| No hay alerta de almacén | En ningún momento del módulo apareció mensaje de disponibilidad/almacén |

**Veredicto: la app NO valida disponibilidad por almacén al cargar líneas. `validateWarehouses` real = `false`.**

**Relacionado — `userCanChangeWarehouse=false` ✅ CONFIRMADO:** el `ion-select` "Almacén" del panel del producto llega **`disabled=true`** con `ALMACEN`(3) preseleccionado (la 2ª opción, `TRANSLADO ENTRE ALMACENES`(4), es inalcanzable). El Tab General **no** expone ningún selector de almacén.

### 3. Otras VGs observadas en este módulo

| VG | Perfil | UI observada | Veredicto |
|----|--------|--------------|-----------|
| `selectOrderType` | true | Tab General trae selector **Tipo Pedido** con `Nota` / `Factura`; el payload viajó `idOrderType: 2` | ✅ coincide |
| `stock0` | false | Producto con **Inventario 0** (`75992200000282`, `7599220000042`) **no expande su panel** → imposible cargar cantidad. 2 intentos acotados, sin alerta | ✅ coincide (se aplica ocultando el input, no con alerta) |
| `showStock` | true | Cada producto muestra `Inventario: N`; **se reserva en vivo** (30 → 28 al cargar 2 uds) | ✅ coincide |
| `hideProdWithoutPrice` | true | Los 6 productos listados traen precio; ninguno sin precio | ✅ coincide (no falsable con estos datos) |
| `userCanChangePriceList` | true | Tab General: selector **Lista de Precio** habilitado con 3 opciones. ⚠ El select de lista **dentro del panel del producto** llega `disabled` con 1 sola opción (`PRECIO LISTA 1`) | ✅ coincide a nivel cabecera |
| `userCanSelectGlobalDiscount` | true | Tab Total: selector **Descuento Global** habilitado (`SIN DESCUENTO` / `5%` / `10 %`). Aplicado 7 % por defecto del cliente (`nuDiscount: 7`) | ✅ coincide |
| `userCanChangePaymentConditions` | true | Tab General: **Condición de pago** habilitado (CONTADO / CREDITO 15 / 21 / …) | ✅ coincide |
| `userCanSelectIVA` | true | Panel del producto: selector **IVA** habilitado (`IVA - 0` / `IVA - 16`) | ✅ coincide |
| `multiCurrency` | true | Selector **Moneda** presente (BSD/US$) pero `disabled`. **Tab Total muestra solo US$**, sin línea en Bs. | ⚠ mismo patrón que insumar/jerez/dm-electronica/latino/globalmp (`multiCurrencyOrder=false`) — **NO es FAIL** |
| `enabledManualRate` | false | La tasa no se edita en ninguna parte del form; viajó `nuValueLocal: 746.6297` | ✅ coincide |
| `parteDecimal` | 4 | Todos los montos se presentan con 4 decimales (`3,5600`, `1,7800`, `0,0890`) | ✅ coincide |
| `signatureOrder` | true | Existe tab **Adjunto**; **el Enviar NO exigió adjunto** (`nuAttachments: 0`, `hasAttachments: "false"`) — no hubo que dejar nada en Guardado | ✅ no bloqueante |
| `requiredComment` / `longitudComentario=200` | true / 200 | Campo `#txComment` presente y usado. ⚠ **Ver Hallazgos-menores**: Guardar y Enviar habilitan **antes** de escribir comentario, y el input **no declara `maxlength`** | ⚠ ver nota |
| `suggestedOrder` | true | **Botón "Pedido Sugerido" NO aparece** en ninguna tab | ⚠ 6ª playa con la misma divergencia UI-vs-config (jerez, ferrenuestro, dm-electronica, globalmp, latino) — verificar con desarrollo qué VG gobierna el botón |
| `userMustActivateGPS` | true | GPS operativo: `coordenada: "11.0490588,-63.8649885"` en el payload | ✅ sin incidencias |
| `alerta_deuda_vencida` | true | **Confirmado**: RENZO (7 docs, `countDueDate=8`, `daDueDate=2026-07-09`) dispara la alerta. **Control negativo**: WEICHAO FENG (Saldo US$ 0) **no** la dispara | ✅ coincide |
| `estructura_producto` (era TBD) | — | **RESUELTO**: hay un `ion-select` en el Tab Pedido con **`Proveedor`** (default, `coTypeProductStructure=001`) y **`Línea`** (`002`). Con "Proveedor" se listan las 7 categorías | 📌 actualizar YAML |

---

## Verificación BD

**Baseline (inicio de módulo, nube):** `order` → 4031 filas, `max(id_order)=4308` · `order_detail` 25521 · `order_detail_unit` 25548.

### Pedido enviado — Nro. Ref. **4309** → `BD-OK`

Cabecera `order` (`id_order=4309`, `co_order=1785876691636.0`):

| Campo BD | Valor | Cotejo UI / payload |
|---|---|---|
| `st_order` | 1 (Enviado) | Lista muestra "Estatus: Enviado" ✅ |
| `id_client` / `co_client` | 1744 / `V28556138` | RENZO FERNANDO MARTINEZ MEJIAS ✅ |
| `id_user` | 468 | vendedor 002 ✅ |
| `nu_details` / `det` / `units` | 1 / 1 / 1 | 1 línea cargada, `units ≥ det` ✅ |
| `nu_amount_total` / `nu_amount_final` | 3.1453 / 3.1453 | Tab Total "Total Pedido US$ 3,1453" ✅ |
| `nu_amount_tax` | 0.0000 | IVA - 0 ✅ |
| `nu_amount_discount` | 0.4147 | = 0,178 (producto) + 0,2367 (global) ✅ |
| `nu_amount_global_discount` | 0.2367 | Tab Total "Descuento Global US$ 0,2367" ✅ |
| `tx_comment` | `Test-PED-SMOKE-170049` | comentario cargado ✅ |
| `co_currency` | `US$` | ✅ |

Detalle `order_detail` (`id_order_detail=26291`): `co_product=75992200000281` · `nu_price_base=1.7800` · `id_warehouse=3` / `co_warehouse="01"` · `id_discount=9547` · `nu_discount_total=0.1780` · `iva=0.0000` · `nu_amount_total=3.1453` ✅
Unidad `order_detail_unit` (`id_order_detail_unit=26318`): `co_product_unit=75992200000281UNI` · **`qu_order=2.0000`** · `nu_base_total=3.5600` ✅

**Duplicados:** `SELECT count(*), count(DISTINCT co_order) WHERE id_order>4308` → **1 / 1** → sin duplicados.
**Correlación:** `Nro.Ref UI (4309) = id_order` → **reconfirmado** (`BD-INFO`).
**Guardado → enviado:** el pedido se guardó (Ref 0, local) y luego se envió; llegó íntegro a la nube con sus 3 niveles. ✅

### 🔎 Dirección de la conversión de moneda — **CORRECTA, no reproduce el bug de cobros**

Tasa `nuValueLocal = 746,6297` (BSD por US$). Todas las columnas `*_conversion` **multiplican** (US$ → BSD), que es la dirección correcta:

| Columna | US$ | `*_conversion` (BSD) | Aritmética explícita | ✔ |
|---|---|---|---|---|
| `order_detail.nu_price_base` | 1,78 | 1329,0009 | 1,78 × 746,6297 = **1329,00086** | ✅ |
| `order_detail.nu_discount_total` | 0,178 | 132,9001 | 0,178 × 746,6297 = **132,90009** | ✅ |
| `order_detail_unit.nu_base_total` | 3,56 | 2658,0017 | 3,56 × 746,6297 = **2658,00173** | ✅ |
| `order.nu_amount_final` | 3,14526 | 2348,3445 | 3,14526 × 746,6297 = **2348,34453** | ✅ |
| `order.nu_amount_global_discount` | 0,23674 | 176,7571 | 0,23674 × 746,6297 = **176,75712** | ✅ |

**Conclusión: en PEDIDOS la conversión US$→BSD multiplica correctamente. El defecto de dirección detectado hoy en una hija de cobro NO se reproduce en este módulo.**
(Detalle fino: las columnas `*_conversion` se calculan sobre el valor **sin redondear** — `3,14526`, no `3,1453` — por eso 2348,3445 y no 2348,3744. No es descuadre.)

### Pedido guardado y luego eliminado (DM-PED-037) — `BD-N/A` (correcto)

El 2º pedido (WEICHAO FENG, `Test-PED-DEL-170705`) se **guardó** (Ref 0 = solo BD local) y se **eliminó** desde la lista sin enviarse. No debía llegar a la nube y **no llegó** (solo 1 fila nueva > 4308). Comportamiento correcto.

> `automation/db/local-query.js` no se usó: `sqlite3` no existe en este device (quirk conocido `[el_valle-20260728]`). El cotejo se hizo con nube + payload capturado.

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **4309** | RENZO FERNANDO MARTINEZ MEJIAS (V28556138) · 1 línea: `75992200000281` DESINFECTANTE AROMA CEREZA 12X1LTRS · 2 UNIDAD · Base US$ 3,5600 · Desc. producto 5 % (0,1780) · Desc. global 7 % (0,2367) · IVA 0 · **Total US$ 3,1453** (BSD 2.348,3445 @ 746,6297) · Tipo Pedido `idOrderType=2` · Almacén 3 - ALMACEN · Comentario `Test-PED-SMOKE-170049` | **Enviado** (`st_order=1`, BD-OK) |
| — (Ref 0) | WEICHAO FENG (E844111587) · 1 línea `75992200000281` × 1 · Comentario `Test-PED-DEL-170705` | **Guardado → eliminado** en DM-PED-037 (nunca salió del device) |

---

## Hallazgos menores (ninguno califica como FAIL)

1. **`requiredComment=true` no se aplica como bloqueo.** Con cliente y 1 ítem cargados pero **comentario vacío**, `.imagenGuardar` y `.imagenEnviar` ya estaban habilitados (`button-disabled=false`). No se llegó a guardar sin comentario porque el guion exige cargarlo, así que **no se afirma que la app permita enviar sin comentario** — queda como **punto a verificar a mano por QA** (guardar con `#txComment` vacío). No se marca FAIL: la evidencia disponible no es concluyente.
2. **Tope de 200 caracteres del comentario: no determinable por CDP.** `#txComment` **no declara atributo `maxlength`** y un set programático de 250 caracteres quedó con `value.length = 250` sin truncar. Pero `fillIonInput` escribe el valor directamente y **saltea** cualquier límite que el navegador aplicaría al teclear, así que el resultado no distingue "no hay tope" de "el tope solo actúa al teclear". **Requiere verificación manual con teclado real.** No se marca FAIL.
3. **Secuencia de envío = 2 alerts, no 3.** `¿Desea Enviar el pedido?` (Cancelar/**Aceptar**) → `Denario Pedidos / Su Pedido será enviado` (**OK**) → navega directo a `/pedidos`. **No aparece** el alert `"Pedido nro. X enviado exitosamente"` que menciona el guion DM-PED-031. El envío igualmente fue exitoso (Ref 4309 confirmada en lista y en BD). Idéntico a `[gmp-20260730]` (La Tortuga v1.0) ⇒ es variante de **build v1.0**, no defecto. El criterio del smoke debería contemplar ambas variantes.
4. **Cosmético:** al **reabrir** un pedido Guardado, las líneas del Tab Total pierden el sufijo de moneda (`Total : 3,1453` / `Precio Lista : 1,7800` en vez de `Total US$: …`). Los totales de cabecera sí conservan `US$`. Cosmético, no afecta datos.
5. **Descuento por producto se reinicia a 5 % al colapsar/re-expandir el acordeón del producto** (ver nota en Verificación de VGs §1).

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Modal de cliente **paginado** — `sc.onIonInfinite()` | universal | El modal trae solo los **primeros 50** clientes aunque el vendedor tenga más (acá 64). Buscar el `ion-item` por código devuelve `null` sin más señal. Cargar el resto con `const sc = ng.getComponent(document.querySelector('app-pedido')).selectorCliente; await sc.onIonInfinite({target:{complete(){}}})` en bucle hasta que `sc.scrollDisable===true`; después `scrollIntoView({block:'center'})` + `mouse.click` al 35 % ancho / 35 % alto del ítem. |
| Panel del producto expandido = **mapa de VGs de línea** | universal | Al expandir un producto aparecen **5 `ion-select` en orden fijo**: `Lista de Precio` · `Unidad` · `IVA` · `% Descuento` · `Almacén`. Leer `sel.disabled` de cada uno resuelve de una sola pasada `userCanChangePriceList`, `userCanSelectIVA`, `userCanSelectProductDiscount` y `userCanChangeWarehouse` **sin** tener que provocar el comportamiento. Los selects quedan **bajo el fold** (y≈568-892 con viewport 744) → `scrollIntoView` obligatorio antes de clickear. |
| `stock0=false` se aplica **impidiendo la expansión**, no con alerta | universal | Un producto con `Inventario: 0` **no abre su panel** al clickearlo (ningún `ion-input[type=number]` pasa a `height>0`) y **no dispara ningún alert**. Contrasta con `[dth-2612]`, donde sí salía `ion-alert#alertNB "Este producto no tiene inventario"`. Antes de concluir "el ítem no responde", comprobar el inventario del producto. |
| `ion-select` de descuento: popover con `ion-radio-group` | universal | `mouse.click` en el select abre un `ion-popover` **sin `button`s directos**: las opciones son `ion-item`/`ion-radio` dentro de `ion-select-popover > ion-list > ion-radio-group`. Buscar los botones con `querySelectorAll('button')` devuelve `[]` y se lee como "el popover no abrió". Clickear el `ion-item` por su texto exacto. |
| Trash del Tab Total cae **bajo el fold** | universal | El `ion-button[color=danger]` dentro del `ion-accordion` del ítem aparece en y≈756 con viewport 744 ⇒ el click no llega. `b.scrollIntoView({block:'center'})` + re-leer rect antes de clickear (aplicación directa del quirk de coords fuera de viewport de `[gmp-20260730]`). |
| Selector **Proveedor / Línea** en Tab Pedido | universal | El primer `ion-select` visible del Tab Pedido conmuta la `estructura_producto` (`Proveedor`=001 default, `Línea`=002). Es el que define qué categorías se listan — útil cuando el YAML trae `estructura_producto: TBD`. |
| Botón de alerta: **"Aceptar" en decisiones, "OK" en informativos** | cliente (El Yaque v1.0) | Confirmado en este módulo: deuda vencida, envío y borrado usan **Aceptar**/Cancelar; los informativos ("Pedido Guardado", "Su Pedido será enviado") usan **OK**. La receta de probar `'Aceptar'` y caer a `'OK'` funciona en todos los casos del módulo. |
| Botón PEDIDO puede **no navegar al primer click** | cliente | Volviendo de `/pedidosLista` a `/pedidos`, el 1er `mouse.click` sobre `ion-button` PEDIDO no navegó (siguió en `/pedidos`) pese a `elementFromPoint` correcto; el 2º sí. Verificar `location.href==='http://localhost/pedido'` tras el click y reintentar una vez antes de dar por fallido el flujo. |

---

## Nota de instrumentación

Se reutilizó el bundle **`window.__qaC`** ya instalado por el agente de COBROS (skills `fillIonInput`, `coordsOf`, `dismissLoadings`, …) y el hook de payload existente protegido por `window.__qaDataHook`. **No** se reinstaló el bundle ni se forzó `__qaCaptureInstalled=false` — por eso el POST `orderservice/order` se capturó **una sola vez y con `data` completo** (0 duplicados). Confirma la receta `[alipascua-20260804]` de `_comunes.md`.

Baseline de payloads al iniciar el módulo: 16 → al cerrar: 33; de ellos **1** es `orderservice/order`.
