# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260807_120232_smoke-difranca-tag20` |
| Módulo | PEDIDOS |
| Dispositivo | 14678405BR003855 (Infinix HOT 60i / X6728) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db 19 · `window.ng=TRUE` · `sqlitePlugin` OK |
| Playa | EL YAQUE (`denarioelyaque.ddns.net:8081`) |
| Cliente / Empresa | difranca · **DDHP_A12 (id_enterprise 2)** — `*DISTRIBUIDORA DIAZ` |
| Vendedor | `coUser='206'` / `idUser=275` |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Estado final | HOME ✅ |
| Watchdog | 0 cuelgues · 0 TIMEOUT · 0 reconexiones |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | `/pedidos` con los 3 `ion-button.colorBorderBuscar`: PEDIDO · BUSCAR · COPIAR |
| DM-PED-002 | ✅ PASS | Form abierto sin cliente: General habilitada, **Pedido/Total/Adjunto `segment-button-disabled`**, `lockSegments=true`, `hasClient=false` |
| DM-PED-006 | ✅ PASS | CAR755 seleccionado → alert **"Pedidos / Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?"** `[Cancelar, Aceptar]` → Aceptar → las 4 tabs habilitan, `lockSegments=false` |
| DM-PED-015 | ✅ PASS | Tab Pedido lista **7 categorías** (Actualizar 1 · Ampollas 16 · BBK 114 · CUIDADO DE UÑAS 4 · HD Cosmetics 118 · Pasarela 185 · Quick Fix 12); BBK hace drill-down a **50 productos** |
| DM-PED-017 | ✅ PASS | `ACBA300U` cantidad 2 → `.contadorProductos`="2", 1 badge `[color=success]`, Inventario 37→35 (reserva en vivo), Guardar/Enviar pasan a habilitados |
| DM-PED-024 | ✅ PASS | Tab Total con **ambas monedas**: Total Base US$ 4.612,67 / BSD 3.469.142,98 · Total Items 2 · Total Unidad 1001 · Tasa 752,09 |
| DM-PED-026 | ✅ PASS | Trash dentro del `ion-accordion` del ítem (Tab Total) → Items 2→1, Total **4.612,67 → 7,28 US$**. Recalculó al 1.er intento con `mouse.click` |
| DM-PED-029 | ✅ PASS | Con cliente y **sin ítems**: `.imagenGuardar` y `.imagenEnviar` ambos `disabled=true`; habilitan en el mismo tick al cargar la 1.ª cantidad |
| DM-PED-030 | ✅ PASS | Alert **"Denario / Pedido Guardado"** `[OK]`; lista BUSCAR muestra `Ref.: 0 · CAR755 · Estatus: Guardado`; comentario `Test-PED-SMOKE-125035` |
| DM-PED-031 | ✅ PASS | 3 alerts: "¿Desea Enviar el pedido?" `[Cancelar, Aceptar]` → "Su Pedido será enviado" `[OK]` → **"Pedido nro. 39795 enviado exitosamente"** `[OK]` → navega a `/pedidos` |
| DM-PED-032 | ✅ PASS | Form dirty + `img.fechaAtras` → modal **"¡Alerta!"** con las 3 opciones exactas `[Guardar y salir · Salir sin guardar · Cancelar]`; Cancelar mantiene en `/pedido` |
| DM-PED-034 | ✅ PASS | Searchbar "Pedidos..." con `CAR755` → **96 → 4** ítems, todos del cliente. Filtrado realtime |
| DM-PED-035 | ✅ PASS | Reabrir el Guardado → form editable con 4 tabs; round-trip §9 **íntegro** (ver abajo) |
| DM-PED-037 | ✅ PASS | Trash en lista → "Pedidos / ¿Seguro que quieres eliminar este pedido?" `[Cancelar, Aceptar]` → lista **97 → 96**, Ref 0 desaparece y la fila local se borra (`count=0`) |

---

## Registros creados en sistema

| Ref | Detalle | Empresa efectiva | Estado |
|-----|---------|------------------|--------|
| **39795** | CAR755 MULTIDISTRIBUIDORA JAKE · `ACBA300U` ×2 UND · **7,28 US$** / 5.475,22 BSD · comentario `Test-PED-SMOKE-125035` · `co_order=1786121049719.0` | **DDHP_A12 / id 2** | **Enviado — BD-OK** |
| — (Ref 0) | CAR707 IMPORTADORA FH 86 · `ACBA300U` ×1 · 2.737,6076 BSD · `co_order=1786121671450.0` | DDHP_A12 / id 2 | Guardado y **eliminado** en DM-PED-037 (no persiste) |

> Correos: `notificationsOrder=true` ⇒ el envío de la Ref 39795 disparó **1 correo real** (autorizado por QA). Se creó **1 solo** registro enviado.

---

## Verificación de cálculos

Precio base `ACBA300U` = **3,64 US$** (lista `Precio 01` / `idList 6`, coincide con el perfil). Tasa **752,0900** (`nuValueLocal`, = `conversion_type` del 2026-08-04).

**1) Línea (pedido enviado)**
```
precio base × cantidad   3,64 × 2            = 7,28 US$      ✓ UI · payload nuAmountTotal 7.28 · nube 7.2800
descuento de línea       nuDiscountTotal     = 0             (no existe el control)
descuento global         nuAmountGlobalDisc. = 0             (no existe el control)
IVA de línea             iva=0 · nuAmountTax = 0             (no existe el control)
TOTAL DEL PEDIDO         7,28 − 0 − 0 + 0    = 7,28 US$      ✓ Total Base = Total Pedido
```

**2) Conversión US$ → BSD (multiplica), tasa 752,0900, tolerancia 0,01**
```
precio unitario   3,64      × 752,09 = 2.737,6076   → payload/nube nu_price_base_conversion 2737.6076   Δ = 0,0000 ✓
total de línea    7,28      × 752,09 = 5.475,2152   → payload/nube nu_amount_total_conversion 5475.2152 Δ = 0,0000 ✓
unidad            7,28      × 752,09 = 5.475,2152   → nu_base_total_conversion 5475.2152               Δ = 0,0000 ✓
total cabecera    7,28      × 752,09 = 5.475,2152   → UI muestra 5.475,22 (redondeo 2 dec)             Δ = 0,0048 ✓
```

**3) Segunda línea antes de borrarla (`ACBBKRI300U`, 4,61 US$ × 999)**
```
4,61 × 999            = 4.605,39 US$          → UI Total US$ 4.605,39                    Δ = 0,00 ✓
4.605,39 × 752,09     = 3.463.667,765         → UI Total BSD 3.463.667,77                Δ = 0,005 ✓
Total Base US$        7,28 + 4.605,39 = 4.612,67  → UI 4.612,67                          Δ = 0,00 ✓
Total Base BSD        4.612,67 × 752,09 = 3.469.142,98 → UI 3.469.142,98                 Δ = 0,00 ✓
```
> ⓘ La app convierte el **total** (no suma los convertidos): 5.475,22 + 3.463.667,77 = 3.469.142,99 vs 3.469.142,98 mostrado. La diferencia de 0,01 es el redondeo de presentación, **no un descuadre**.

**4) Conversión inversa BSD → US$ (divide) — verificada en el modal de cliente y en el pedido B**
```
Saldo CAR755   47.023.577,3883 BSD / 752,09 = 62.523,87 US$  → UI "Saldo BSD / Saldo US$"  ✓ etiquetas correctas
pedido B en BSD  3,64 US$ × 752,09 × 1      = 2.737,6076      → orders.nu_amount_total 2737.6076 ✓
```

**Veredicto:** ✅ **la aritmética y la conversión son correctas en las dos direcciones.** `US$→BSD multiplica` confirmado en 6 campos independientes con Δ = 0,0000. No se detectó ningún descuadre.

---

## Verificación de VGs

### Las 5 prioritarias

| # | VG | Perfil | UI | Veredicto |
|---|----|--------|----|-----------|
| 1 | **`validateWarehouses`** | `false` (⚠ única donde ganaba el dump de CLIENTE) | Cargué **999 uds sobre inventario 665** en `ACBBKRI300U`: **ningún `ion-alert`**, ningún bloqueo, Guardar/Enviar siguieron habilitados. `app-message` conservó el mensaje anterior con `alertMessageOpen=false` ⇒ prueba de que **la app no avisó** (no de que el click se perdiera) | ✅ **CONFIRMADA `false`** — el dump de cliente decía la verdad. **El patrón que mintió en alipascua NO se repitió acá.** |
| 2 | **`userCanSelectProductDiscount`** | `false` | El panel de la línea trae **3 `ion-select`** (`Lista de Precio` · `Unidad` · `Almacén`). **No existe "% Descuento".** Payload: `nuDiscountTotal:0`, `coDiscount:""`, `orderDetailDiscount:[]`, `nuAmountTotalProductDiscount:0` | ✅ **CONFIRMADA `false`** — la ausencia del select es la señal. Ningún descuento mueve el total |
| 3 | **`validateNuOrder`** | `false` | `ion-input#nuPurchase` llega **`required=false`** y **vacío**, y las tabs Pedido/Total/Adjunto **habilitaron igual** al seleccionar el cliente. Se guardó y envió con `nuPurchase:""` | ✅ **CONFIRMADA `false`** — el bloqueo de el_palmar **no reproduce** |
| 4 | **`userCanSelectIVA`** | `false` | No hay select "IVA" en el panel de línea. Payload y nube: `iva=0.0000`, `nu_amount_tax=0.0000`, `nuAmountTaxConversion=0`. Tab Total: **Total Base = Total Pedido** (sin línea de IVA) | ✅ **CONFIRMADA `false`** — sin IVA en el pedido |
| 5 | **`orderEnterpriseEnabled`** | `false` ⇒ "PEDIDOS sin selector de empresa" | 🔴 **HAY selector de empresa en el Tab General**, `disabled=false`, con **las 3 empresas activas** como opciones (`*DISTRIBUIDORA DIAZ` · `DIFRANCA C.A` · `DISTRIBUIDORA DH VI`) y preseleccionado en DDHP_A12 | ❌ **LA VG MIENTE — corregir el perfil a `true`.** Ver nota abajo |

**Nota sobre la VG 5 (`orderEnterpriseEnabled`).** El valor `false` venía **solo del override de cliente de 2023-02-01, sin contraparte global** — justo el perfil de "valor stale" que el YAML marcaba como sospechoso. La UI lo desmiente. **No es un defecto de la app**: el selector se comporta bien (3 opciones = las 3 activas; la empresa borrada `DDH_A12` con `co_operation='D'` **NO aparece**, como debe ser) y no rompe nada — el pedido viajó con la empresa correcta. Es el **perfil** el que hay que corregir.

### Las otras VGs pedidas

| VG | Perfil | Comportamiento en UI | Veredicto |
|----|--------|----------------------|-----------|
| `stock0` | `true` | Se pudo pedir 999 sobre stock 665; el ítem quedó con "Inventario: 0" y siguió en el pedido | ✅ coherente (no se probó un producto que *arranque* en 0) |
| `hideProdWithoutPrice` | `true` (= sí se muestran) | Los 50 productos de BBK listaron todos con precio; no hubo ninguno sin precio en la muestra | 🚫 **no determinable** — sin producto sin lista de precio a la vista |
| `productMinMul` | `false` | Se aceptaron cantidades 1, 2 y 999 sin restricción de múltiplo ni ajuste automático | ✅ coherente |
| `suggestedOrder` | `false` | **0 botones** que matcheen `/sugerid/i` en ninguna tab | ✅ **CONFIRMADA** |
| `orderPedidoSeleccion` | `true` | Cargué `ACBA300U` y luego `ACBBKRI300U`; el Tab Total los listó en ese orden y el payload trae `posicion:0` para el primero | ✅ coherente |
| `conversionByPriceList` | `false` | Cambié la moneda **BSD → US$** y `listaAnterior` quedó **idéntica** (`idList 6 / coList 01 / Precio 01`); tampoco cambió `#tasa` | ✅ **CONFIRMADA** — no recarga listas por moneda |
| `userCanChangePriceList` | `false` | `ion-select` "Lista de precios" del Tab General llega **`disabled=true`** ("Precio 01", 5 opciones) | ✅ **CONFIRMADA** |
| `userCanChangePriceListProduct` | `true` | El select "Lista de Precio" **del panel de línea** llega **`disabled=true`** con **1 sola opción** | ⚠ **divergencia probable** — con una sola opción no se puede distinguir "VG apagada" de "disabled por falta de alternativas". Marcar ⚠️VERIFICAR |
| `userCanChangeWarehouse` | `false` | Select "Almacén" **presente pero `disabled`** ("Principal", 84 opciones) | ✅ **CONFIRMADA** |
| `userCanChangePaymentConditions` | `false` | Select "Condición de pago" **`disabled`** ("Credito a 30", 9 opciones); payload `coPaymentCondition:"CRE30"` | ✅ **CONFIRMADA** |
| `selectOrderType` / `userCanSelectChannel` | `false` / `false` | **No existen** esos selects (el Tab General tiene 5, no 7). `idOrderType:2` se resolvió solo; `idDistributionChannel:null` | ✅ **CONFIRMADAS** |
| `userCanSelectGlobalDiscount` | `false` | Sin control de descuento global; `nuAmountGlobalDiscount:0` | ✅ **CONFIRMADA** |
| `multiCurrencyOrder` | `true` | 🟢 Tab Total muestra **Bs. Y US$ simultáneamente** — a diferencia de insumar/jerez/alipascua/globalmp, donde salía solo US$ | ✅ **CONFIRMADA** (primer cliente de la serie donde de verdad se cumple) |
| `enabledManualRate` / `canChangeRate` | `false` / `false` | `ion-input#tasa` llega **`disabled=false` pero `readonly=true`** con 752,09 | ✅ **CONFIRMADAS** (leídas por `readonly`, no por `disabled`) |
| `showCreditLimit` | `true` | Tab Total encabeza con **"Límite de Crédito: 3.008.377,20"** | ✅ **CONFIRMADA** |
| `totalUnit` | `true` | "Total por unidad → Total Unidad: 1001" (2 + 999) | ✅ **CONFIRMADA** |
| `quUnitDecimals` | `false` | Solo se cargaron enteros | 🚫 **no determinable** — no se probó una cantidad decimal |
| `signatureOrder` | `true` | Las tabs son exactamente General · Pedido · Total · Adjunto: **no hay tab ni control de firma**, y el pedido se envió sin firmar | ⚠ observación, **no FAIL** (RUNTIME §5: `signature*=true` habilita, no obliga) |
| `userCanSaveGPS` | `false` | El payload viaja igual con `coordenada:"11.0490432,-63.8649956"` | ⚠ mismo patrón ya documentado en CLIENTES — **no es defecto**, la VG tiene alcance por módulo |

---

## Verificación BD

**Baseline (nube, antes del módulo):** `order` n=**16.558**, max(`id_order`)=**39.794** · `order_detail`=181.864 · `order_detail_unit`=181.776.

**Baseline-diff:** una única fila nueva con `id_order > 39794` ⇒ **cero misses, cero duplicados** (`count(*)` por `co_order` = 1).

### Ref 39795 — cotejo de los 3 niveles

| Nivel | Campo | Local (`orders`) | Payload | Nube | ✓ |
|---|---|---|---|---|---|
| Cabecera | `co_order` | 1786121049719.0 | 1786121049719.0 | 1786121049719.0 | ✓ |
| Cabecera | `id_order` | **39795** | (0 al enviar) | **39795** | ✓ = Nro.Ref UI |
| Cabecera | `co_enterprise` / `id_enterprise` | DDHP_A12 | DDHP_A12 / 2 | **DDHP_A12 / 2** | ✓ |
| Cabecera | `co_currency` | US$ | US$ (`idCurrency:2`) | US$ | ✓ |
| Cabecera | `nu_amount_total` / `_final` | 7.28 / 7.28 | 7.28 / 7.28 | 7.2800 / 7.2800 | ✓ |
| Cabecera | `nu_value_local` | — | 752.09 | 752.0900 | ✓ |
| Cabecera | `nu_amount_tax` | — | 0 | 0.0000 | ✓ |
| Cabecera | `nu_amount_total_conversion` | — | 5475.2152 | 5475.2152 | ✓ |
| Cabecera | `tx_comment` | Test-PED-SMOKE-125035 | idem | idem | ✓ |
| Cabecera | `nu_details` | 1 | 1 | 1 (= `det` 1) | ✓ |
| Detalle | `co_product` / `nu_price_base` | — | ACBA300U / 3.64 | ACBA300U / 3.6400 | ✓ |
| Detalle | `iva` / `nu_amount_tax` / `nu_discount_total` | — | 0 / 0 / 0 | 0.0000 / 0.0000 / 0.0000 | ✓ |
| Detalle | `co_warehouse` / `co_price_list` | — | 001 / 01ACBA300U | 001 / 01ACBA300U | ✓ |
| Detalle | `nu_price_base_conversion` | — | 2737.6076 | 2737.6076 | ✓ |
| Unidad | `co_product_unit` / `qu_order` | — | ACBA300UUND / 2 | ACBA300UUND / 2.0000 | ✓ |
| Unidad | `nu_base_total` / `_conversion` | — | 7.28 / 5475.2152 | 7.2800 / 5475.2152 | ✓ |

**Estado local:** `st_delivery=1` · `id_order=39795>0` · `pending_transactions(type='order')=0` · `failed_transactions=0` · sin duplicados.
**Payload:** **1 solo POST** `orderservice/order` con body completo (sin duplicación idempotente).

⇒ **Marca: `BD-OK` + `BD-FIELD-OK` (16/16 campos cotejados).** Lo que se guardó **se envió**, íntegro y una sola vez.

> ⚠ `st_order=1` apareció **también en el pedido Guardado** (con `id_order=0`, `st_delivery=3`) ⇒ **reconfirma el caveat de `[gmp-20260730]`**: el discriminador fiable guardado-vs-enviado es **`st_delivery`**, nunca `st_order`.

**Pedido B (Ref 0, CAR707):** guardado con `st_delivery=3` / `id_order=0` (**BD-SAVED**, correcto — nunca se intentó enviar) y **borrado**: `SELECT count(*) FROM orders WHERE co_order='1786121671450.0'` → **0**. No llegó a la nube.

---

## Defectos conocidos del tag 20 — ¿le afectan a difranca?

| Defecto | Predicción del perfil | Lo que midió la corrida | Veredicto |
|---|---|---|---|
| **`PED-IVA-CONV-DIV-CANTIDAD`** | no aplica (0 de 181.864 líneas con IVA) | **Intenté armar un pedido con IVA ≠ 0 y es imposible por UI**: no existe el select "IVA" en el panel de línea (`userCanSelectIVA=false`) ni IVA por producto (`vatExemptProducts=false`). El pedido enviado viajó con `iva:0` / `nuAmountTax:0` / `nuAmountTaxConversion:0` | ✅ **NO APLICA — confirmado en UI, no solo por datos.** El síntoma no tiene dónde manifestarse |
| **`PED-IVA-LINEA-NULL`** | no aplica | La línea guardó `iva=0.0000` (**cero, no NULL**) y `nu_amount_tax=0.0000` en local, payload y nube | ✅ **NO APLICA — confirmado** |
| **`PED-SUGERIDO-VG-FALSE`** | TBD (no debería aparecer, por partida doble) | **0 botones "Pedido Sugerido"** en las 4 tabs | ✅ **NO REPRODUCE** — coherente con la VG. difranca es la 1.ª playa donde la VG y la UI coinciden en este punto (7 playas previas mostraban la divergencia al revés) |
| **`CLT-CREDITO-MULTIPLICADO`** (rozado desde PEDIDOS) | TBD, prioridad alta | Tab Total muestra "Límite de Crédito: **3.008.377,20**" y la BD trae `client.nu_credit_limit = 3008377.2000` ⇒ **valor idéntico, sin multiplicar por la tasa** (si estuviera multiplicado se vería ≈ 2.262 millones) | ✅ **NO REPRODUCE en PEDIDOS.** El veredicto definitivo corresponde al módulo CLIENTES |

**Ningún defecto nuevo.** 0 FAIL en el módulo.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **`onIonInfinite` pagina el MODELO pero NO re-renderiza el DOM — hace falta `ng.applyChanges(sc)`** | **universal** | En el modal de cliente de PEDIDOS, `sc.onIonInfinite(...)` llevó `sc.clientes` de 50→100, pero `document.querySelectorAll('ion-modal.show-modal ion-item')` **siguió en 50** y el ítem objetivo devolvía `null` — se lee como "el cliente no existe" (exactamente el falso negativo que `[alipascua-20260804]` documentó, pero **la receta de alipascua está incompleta**). Causa: `pg.evaluate` corre **fuera de NgZone**, así que Angular no detecta el cambio. **Fix: `window.ng.applyChanges(sc)` + esperar ~1,2 s → el DOM pasó a 100 ítems al instante.** Agregar SIEMPRE tras paginar programáticamente. |
| **Modal de cliente ordenado por deuda, con 2 páginas** | cliente | CAR755 cayó en el índice **52** ⇒ **1 ronda** de `onIonInfinite` (no la última página). Cada ítem rotula `Saldo BSD:` **y** `Saldo US$:` y ambos cuadran con la tasa — no reproduce el cruce de etiquetas de `[gmp-20260730]` |
| **3.ª variante de árbol confirmada en El Yaque: DRILL-DOWN** | cliente/build | `ion-accordion-group = 0` y `ion-accordion = 0` en el nivel de categorías; el click en `ion-item.listaItems` **navega dentro** de la categoría (las `listaItems` pasan a 0) y allí los productos **sí** son `ion-accordion`. Igual que `[el_palmar-20260805]` (Isla Coche) ⇒ la variante **no es del servidor**, sigue al build v1.0/db19 |
| **Selector de agrupación de difranca = `Linea` / `Sub-Linea`** | cliente | Resuelve el `estructura_producto: TBD` del YAML. Default `Linea`, coherente con `listProductsBy:"lineas"` |
| 🔴 **El default de moneda del pedido es BSD, pero el árbol NO se vacía: la app CONVIERTE** | **universal candidato** | Contradice la predicción del prompt y **acota la regla de `[el_palmar-20260805]`**. Con moneda **BSD** el Tab Pedido listó las 7 categorías y los 50 productos de BBK **con el precio convertido** (`ACBA300U: 2.737,61 BSD` = 3,64 × 752,09). ⇒ el vaciado de el_palmar **no es una consecuencia general de elegir la moneda local**: pasa solo cuando la lista activa **no tiene precios en ninguna moneda convertible** para ese caso. **Antes de cambiar la moneda "por precaución", mirar si el árbol está realmente vacío** — acá habría sido un cambio innecesario |
| **El selector de empresa de PEDIDOS: `ion-select` SIN `formcontrolname`, `value` = objeto empresa completo** | **universal** | Amplía la tabla de 4 variantes de `[el_palmar-20260805]`: en difranca PEDIDOS el select **no tiene `formcontrolname`**, llega `disabled=false`, `ng-valid`, y su `value` es el **objeto** `{idEnterprise, coEnterprise, lbEnterprise, coCurrencyDefault, prioritySelection, enterpriseDefault, naEnterprise, nuRif, txAddress}`. ⇒ la receta `s.value=<number>` **rompería** este form. Confirma la regla: **leer `formcontrolname` + `disabled` + `value` + `ng-invalid` antes de decidir** |
| **Al reabrir un Guardado, Empresa y Moneda pasan a `disabled`** | cliente | En el alta llegan habilitados; tras Guardar y reabrir, ambos `disabled=true` (el cliente también). Comportamiento defensivo — **no es FAIL** |
| 🔴 **Reabrir un Guardado: las tabs y `#txComment` tardan >4 s en rehidratarse** | **universal** | Snapshot inmediato (y también a los 4 s): tabs `disabled` y **`#txComment` vacío** — se lee como "el comentario no persistió" (falso FAIL de round-trip §9). **A los ~9 s** todo estaba rehidratado. Refuerza y **amplía** la nota de espera de `[jerez-2026-07-06]`: la espera aplica **también a los valores de los inputs**, no solo al estado de las tabs |
| **`enterprise_default` y `prioritySelection` coincidiendo con la empresa correcta** | cliente | Por una vez `enterpriseDefault:"true"` **y** `prioritySelection:0` apuntan a DDHP_A12, la empresa de la corrida ⇒ la trampa de `[el_palmar-20260805]` **no se activa** en difranca |
| **Etiquetas de alert del módulo (leídas, no predichas)** | cliente | deuda vencida `[Cancelar, **Aceptar**]` · guardado `[**OK**]` · envío paso 1 `[Cancelar, **Aceptar**]`, pasos 2-3 `[**OK**]` · borrado `[Cancelar, **Aceptar**]` · dirty-guard `[Guardar y salir, Salir sin guardar, **Cancelar**]`. **8 alerts resueltos sin un solo reintento** con la receta de igualdad exacta + orden de preferencia |
| **`ng.applyChanges` + namespace propio `__qaP`** | universal | Se registró `window.__qaP` (rect · alertInfo · homeTile · modBtn · tab · arbol · cat · prods) **sin tocar `__qaH`**, y se consumió `__qaH.getPayloadData()` heredado ⇒ **1 solo POST capturado, con body, sin duplicados**. 3.ª confirmación de la receta graduada |

> ✅ consolidado 2026-08-07

---

## Hallazgos

**Ningún FAIL.** Un solo hallazgo, y es de **perfil, no de aplicación**:

- 🔴 **`orderEnterpriseEnabled` debe corregirse de `false` a `true` en `automation/clientes/difranca.yaml`.** El valor `false` provenía solo del override de cliente de 2023-02-01 sin contraparte global (marcado ⚠️VERIFICAR con razón). PEDIDOS **sí** tiene selector de empresa, habilitado y con las 3 empresas activas. Impacto en el mapa de N/A: la línea *"Selector de empresa en PEDIDOS (orderEnterpriseEnabled=false)"* debe salir de "flujos que no existen por VG apagada" y pasar a "sí aplican". No cambia el veredicto de ningún caso ni de ningún defecto de la 20.

Observaciones menores (ninguna es defecto):
- `userCanChangePriceListProduct=true` con el select de línea `disabled` y 1 sola opción ⇒ dejar ⚠️VERIFICAR (indistinguible con los datos actuales).
- `signatureOrder=true` pero no hay control de firma en el form; el envío no la exige (RUNTIME §5).
- El payload viaja con coordenada pese a `userCanSaveGPS=false` (patrón ya conocido, alcance por módulo).

---

*Agente PEDIDOS · 14/14 PASS · 0 FAIL · watchdog sin cuelgues · estado final HOME*
