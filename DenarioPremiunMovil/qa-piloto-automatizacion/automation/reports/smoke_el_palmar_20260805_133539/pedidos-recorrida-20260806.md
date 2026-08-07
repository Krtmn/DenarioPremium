# Smoke Test — Módulo PEDIDOS (re-corrida completa)

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260806_pedidos-completo` |
| Módulo | PEDIDOS (re-corrida — reemplaza el 4 PASS / 10 N/A del 05/08) |
| Dispositivo | `14678405BR003855` — Infinix X6728 / HOT 60i, Android 15 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db19, `window.ng=true` |
| Playa | ISLA COCHE (`denarioislacoche.ddns.net:8081`) |
| Sesión | coUser 1276 / idUser 266 · `hardCurrency=USD` / `localCurrency=VES` |
| Empresa efectiva | **1002 / id_enterprise 1 — CENTRAL EL PALMAR, S.A.** |
| Tasa vigente | **710,0000** (confirmada en `#tasa`, Tab Total y payload `nuValueLocal`) |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

> **Por qué se re-corrió:** el 05/08 el módulo quedó 4 PASS / 10 N/A porque el Tab Pedido no listaba
> productos (la moneda venía en **Bs** y la lista Z12 del cliente no tiene precios en esa moneda).
> ✅ **El fix está confirmado en UI:** `comp.monedaSeleccionada.coCurrency` llega en **USD** ya en el
> formulario recién abierto (`hardCurrency:"true"`), la categoría `Azucar` lista sus **6** productos
> cotizables y **los 14 casos resultaron ejecutables**. Ningún caso quedó N/A.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | `/pedidos` con los 3 `ion-button.colorBorderBuscar`: PEDIDO · BUSCAR · COPIAR |
| DM-PED-002 | ✅ PASS | Form sin cliente: General habilitada; Pedido/Total/Adjunto `disabled` + `segment-button-disabled`; `hasClient=false` |
| DM-PED-006 | ✅ PASS | Cliente 1000000803 → alerta `Pedidos / "Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?"` [Cancelar, **Aceptar**]; tras llenar `#nuPurchase` las 3 tabs habilitan en el mismo tick (`lockSegments` true→false) |
| DM-PED-015 | ✅ PASS | Tab Pedido lista `Azucar 8` + `PVA 30`; entrando a Azucar → **6 productos** con precio en USD |
| DM-PED-017 | ✅ PASS | Cantidad 2 en `160000010` → badge `contadorProductos`=2; Guardar/Enviar pasan a habilitados |
| DM-PED-024 | ✅ PASS | Tab Total con importes BS y USD ≠ 0 y **toda la aritmética cerrada** (ver §Verificación de cálculos) |
| DM-PED-026 | ✅ PASS | Trash dentro del acordeón del ítem: `Total Items 1→0`, `Total Pedido USD 133,4000 → 0,0000`. Borrado directo, sin confirmación |
| DM-PED-029 | ✅ PASS | Con 0 ítems `.imagenGuardar`/`.imagenEnviar` `disabled=true`; con ≥1 ítem `disabled=false`. **Par antes/después medido** |
| DM-PED-030 | ✅ PASS | Alert `Denario / "Pedido Guardado"` [**OK**]; aparece en BUSCAR con `Nro. Ref.: 0 · Estatus: Guardado`; comentario `Test-PED-SMOKE-161104` |
| DM-PED-031 | ✅ PASS | 3 alerts → `Denario Premium / "Pedido nro. **13806** enviado exitosamente"`; navega a `/pedidos`; **BD-OK** |
| DM-PED-032 | ✅ PASS | Form sucio + `img.fechaAtras` → modal `¡Alerta!` con **3 opciones** [Guardar y salir · Salir sin guardar · Cancelar]; Cancelar mantiene el form con 2 ítems |
| DM-PED-034 | ✅ PASS | `ion-searchbar` en `app-pedidos-lista`: 2 ítems → "ALCOHOLES" → 1 ítem → limpiar → 2 ítems (realtime) |
| DM-PED-035 | ✅ PASS | Pedido Guardado reabre editable con 4 tabs y **round-trip §9 exacto** (ver §Round-trip) |
| DM-PED-037 | ✅ PASS | Trash en lista → `Pedidos / "¿Seguro que quieres eliminar este pedido?"` [Cancelar, **Aceptar**] → el pedido desaparece (3→2 ítems) |

---

## Verificación de cálculos 🔴 (encargo principal)

Tasa **710,0000** · tolerancia 0,01 · `USD→VES multiplica` · `VES→USD divide`.

### Pedido A — 1 línea (estado intermedio, DM-PED-017/024)

`160000010` AZÚCAR KONFIT BLANCO SACO PL 1X50KG · Saco · **precio base 57,5000 USD** · cantidad **2** · IVA 16 %

| Concepto | Cuenta | Esperado | UI | ✓ |
|---|---|---|---|---|
| Subtotal línea | `57,50 × 2` | 115,0000 USD | `Total Base USD: 115,0000` | ✓ |
| Subtotal → VES | `115,00 × 710` | 81.650,0000 | `Total Base VES: 81.650,0000` | ✓ |
| IVA | `115,00 × 0,16` | 18,4000 USD | `Total IVA USD: 18,4000` | ✓ |
| IVA → VES | `18,40 × 710` | 13.064,0000 | `Total IVA VES: 13.064,0000` | ✓ |
| Total pedido | `115,00 + 18,40` | 133,4000 USD | `Total Pedido USD: 133,4000` | ✓ |
| Total → VES | `133,40 × 710` | 94.714,0000 | `Total Pedido VES: 94.714,0000` | ✓ |
| Cierre cruzado | `81.650 + 13.064` | 94.714,0000 | ✓ | ✓ |

### Pedido B — 2 líneas con IVA distinto (el que se **envió**, Ref 13806)

| # | Producto | Unidad | Precio base | Cant. | IVA | Base | IVA | Total línea |
|---|---|---|---|---|---|---|---|---|
| 1 | `160000010` | Saco (SC) | 57,5000 USD | 3 | 16 % | 172,5000 | 27,6000 | 200,1000 |
| 2 | `160000012` | FARDO (FAR) | 26,0000 USD | 2 | **0 %** | 52,0000 | 0,0000 | 52,0000 |

**Aritmética línea por línea**

| Cuenta | Resultado | UI / payload | ✓ |
|---|---|---|---|
| L1 `57,50 × 3` | 172,5000 | `nuBaseTotal: 172.5` | ✓ |
| L1 `172,50 × 0,16` | 27,6000 | `nuAmountTax: 27.6` · UI `IVA 16,0000%: 27,6000 USD` | ✓ |
| L1 `172,50 + 27,60` | 200,1000 | `nuAmountTotal: 200.1` · UI `Total USD: 200,1000` | ✓ |
| L2 `26,00 × 2` | 52,0000 | `nuBaseTotal: 52` | ✓ |
| L2 `52,00 × 0` | 0,0000 | `nuAmountTax: 0` · sin fila IVA en la UI | ✓ |
| **Σ base** `172,50 + 52,00` | 224,5000 | `Total Base USD: 224,5000` · `nuAmountTotalBase: 224.5` | ✓ |
| **Σ IVA** `27,60 + 0` | 27,6000 | `Total IVA USD: 27,6000` · `nuAmountTax: 27.6` | ✓ |
| **Total** `224,50 + 27,60` | 252,1000 | `Total Pedido USD: 252,1000` · `nuAmountTotal: 252.1` | ✓ |
| **Σ totales de línea** `200,10 + 52,00` | 252,1000 | = Total del pedido | ✓ |

**Conversión USD→VES — 12 campos verificados, TODOS multiplican (ninguno divide)**

| Campo | Cuenta | Esperado | Payload / UI | ✓ |
|---|---|---|---|---|
| `nuPriceBaseConversion` L1 | `57,50 × 710` | 40.825 | 40825 | ✓ |
| `nuBaseTotalConversion` L1 | `172,50 × 710` | 122.475 | 122475 | ✓ |
| `nuAmountTotalConversion` L1 | `200,10 × 710` | 142.071 | 142071 | ✓ |
| IVA línea L1 → VES (UI) | `27,60 × 710` | 19.596 | 19596 | ✓ |
| `nuPriceBaseConversion` L2 | `26,00 × 710` | 18.460 | 18460 | ✓ |
| `nuBaseTotalConversion` L2 | `52,00 × 710` | 36.920 | 36920 | ✓ |
| `nuAmountTotalConversion` L2 | `52,00 × 710` | 36.920 | 36920 | ✓ |
| `nuAmountTotalBaseConversion` | `224,50 × 710` | 159.395 | 159395 | ✓ |
| `nuAmountFinalConversion` | `224,50 × 710` | 159.395 | 159395 | ✓ |
| `nuAmountTaxConversion` | `27,60 × 710` | 19.596 | 19596 | ✓ |
| `nuAmountTotalConversion` (cab.) | `252,10 × 710` | 178.991 | 178991 | ✓ |
| Cierre cruzado VES | `159.395 + 19.596` | 178.991 | 178991 | ✓ |

> 🔴 **El defecto de dirección de conversión conocido en COBROS (multiplica donde debe dividir) NO
> aparece en PEDIDOS.** Los 12 campos `*_conversion` multiplican por la tasa, que es la dirección
> correcta para USD→VES. **No hay hallazgo nuevo por este eje.**

### Pedido C — 1 línea, cruce contra el precio que muestra el catálogo

`160000014` AZÚCAR MONT RE COVENIN SACO PL 1X50KG · **61,0000 USD** × 1 · IVA 16 %

| Cuenta | Esperado | UI | ✓ |
|---|---|---|---|
| `61,00 × 1` | 61,0000 USD | `Total Base USD: 61,0000` | ✓ |
| `61,00 × 710` | 43.310,0000 | `Total Base VES: 43.310,0000` | ✓ |
| `61,00 × 0,16` | 9,7600 USD | `Total IVA USD: 9,7600` | ✓ |
| `9,76 × 710` | 6.929,6000 | `Total IVA VES: 6.929,6000` | ✓ |
| `61,00 + 9,76` | 70,7600 USD | `Total Pedido USD: 70,7600` | ✓ |
| `70,76 × 710` | 50.239,6000 | `Total Pedido VES: 50.239,6000` | ✓ |
| **Cruce independiente** | el catálogo rotula `Precio + IVA: 70,7600 USD` para este producto | coincide al céntimo | ✓ |

### Recálculo dinámico (prueba del selector de IVA)

Cambiando la **línea 2** de `IVA - 16` a `IVA - 0` con el pedido ya armado:

| Métrica | Antes (L2 IVA 16) | Después (L2 IVA 0) | Delta esperado | ✓ |
|---|---|---|---|---|
| Total Base USD | 224,5000 | 224,5000 | sin cambio | ✓ |
| Total IVA USD | 35,9200 | 27,6000 | `−8,32` = `52,00 × 0,16` | ✓ |
| Total IVA VES | 25.503,2000 | 19.596,0000 | `−5.907,20` = `8,32 × 710` | ✓ |
| Total Pedido USD | 260,4200 | 252,1000 | `−8,32` | ✓ |
| Total Pedido VES | 184.898,2000 | 178.991,0000 | `−5.907,20` | ✓ |

⇒ el recálculo por cambio de alícuota es **exacto en las dos monedas**.

### Descuentos

| Tipo | Estado | Motivo |
|---|---|---|
| **Descuento por producto (%)** | no verificable — VG inactiva | El panel de línea trae **3 selects** (Lista de Precio · Unidad · IVA): **no existe "% Descuento"**. Confirma `userCanSelectProductDiscount=false`. Payload: `nuAmountTotalProductDiscount: 0` / `...Conversion: 0` |
| **Descuento global (%)** | no verificable — VG inactiva | No hay campo de descuento global en el Tab Total. Confirma `userCanSelectGlobalDiscount=false`. Payload: `nuAmountGlobalDiscount: 0` / `...Conversion: 0`, `nuDiscount: 0`, `nuAmountDiscount: 0` |

> No se marcan como N/A de caso (ningún caso del set los exige); se reportan como **eje de cálculo no
> ejercitable en este cliente**, con la evidencia de que los campos correspondientes viajan en 0 y por
> lo tanto **no contaminan el total**: `224,50 − 0 + 27,60 = 252,10` ✓.

### Contraste con el defecto conocido `PED-IVA-CONV-DIV-CANTIDAD`

**Escenario que faltaba, ahora ejecutado: pedido con IVA ≠ 0 y cantidad > 1.**

| Línea | Cant. | IVA USD | IVA VES mostrado | `IVA × 710` | `IVA × 710 ÷ cant.` (lo que haría el defecto) | Veredicto |
|---|---|---|---|---|---|---|
| `160000010` | **3** | 27,6000 | **19.596** | 19.596 | 6.532 | ✅ **no reproduce** |
| `160000010` (pedido A) | **2** | 18,4000 | **13.064** | 13.064 | 6.532 | ✅ **no reproduce** |
| `160000014` | 1 | 9,7600 | 6.929,6 | 6.929,6 | 6.929,6 | (cant.=1, no discrimina) |

⇒ Con cantidad 2 y 3 el IVA convertido de línea **no está dividido entre la cantidad** en el detalle
**móvil**. ⚠ El defecto original se reportó sobre el detalle **web**; esta corrida **no cubre la capa
web**, así que cierra el escenario para móvil pero **no** da por cerrado el defecto en web.

### ⚠ Observación previa CONFIRMADA — IVA de línea como float crudo

El `IVA` convertido de cada línea del Tab Total **sigue saliendo sin formatear**:

| Dónde | Valor mostrado | Cómo debería verse |
|---|---|---|
| Línea `160000010` (cant. 3) | `IVA 16,0000%: 19596 VES` | `19.596,0000 VES` |
| Línea `160000012` (cant. 2, IVA 16) | `IVA 16,0000%: 5907.2 VES` | `5.907,2000 VES` |
| Línea `160000010` (cant. 2) | `IVA 16,0000%: 13064.000000000002 VES` | `13.064,0000 VES` |
| Línea `160000014` (cant. 1) | `IVA 16,0000%: 6929.599999999999 VES` | `6.929,6000 VES` |

**Es el ÚNICO importe sin formato de toda la pantalla**: el mismo IVA en USD (`27,6000 USD`), el
`Total IVA VES` de la cabecera (`19.596,0000`) y todos los demás campos salen con separador de miles y
4 decimales. **El valor numérico es correcto** (la aritmética cierra); el defecto es **de presentación**
y expone el error de coma flotante binaria al usuario (`13064.000000000002`).

- Severidad: **cosmético / S3**, no afecta montos ni BD.
- ID sugerido: `PED-TOTAL-IVA-LINEA-FLOAT-CRUDO`.
- Reproducción: Tab Total → expandir cualquier línea con IVA ≠ 0 → leer la fila `IVA nn%: … VES`.

---

## Round-trip §9 (Guardar → reabrir)

Pedido B, reabierto desde BUSCAR antes de enviarlo:

| Campo | Antes de Guardar | Al reabrir | ✓ |
|---|---|---|---|
| Cliente | `C.A. RON SANTA TERESA, S.A.C.A (1000000803)` | idem | ✓ |
| `#nuPurchase` | `QA-20260806` | idem | ✓ |
| `#tasa` | `710,0000` (readonly) | idem | ✓ |
| `#txComment` | `Test-PED-SMOKE-161104` | idem | ✓ |
| Moneda | USD | USD | ✓ |
| Empresa | 1002 / id 1 | 1002 / id 1 | ✓ |
| Tipo de pedido | CFR | CFR | ✓ |
| Total Items | 2 | 2 | ✓ |
| Total Base USD / VES | 224,5000 / 159.395,0000 | idem | ✓ |
| Total IVA USD / VES | 27,6000 / 19.596,0000 | idem | ✓ |
| Total Pedido USD / VES | 252,1000 / 178.991,0000 | idem | ✓ |
| IVA de la línea 2 | 0 % | 0 % (sin fila IVA) | ✓ |

Sin divergencias silenciosas. **Round-trip limpio.**

---

## Registros creados en sistema

| Ref | Detalle | Empresa efectiva | Estado |
|-----|---------|------------------|--------|
| **13806** | 2 líneas · `160000010` ×3 Saco (IVA 16) + `160000012` ×2 FARDO (IVA 0) · Base 224,50 USD · IVA 27,60 · **Total 252,10 USD / 178.991,00 VES** · comentario `Test-PED-SMOKE-161104` · orden `QA-20260806` | **1002 / id_enterprise 1** | ✅ **Enviado — BD-OK** |
| — (Ref 0) | 1 línea · `160000014` ×1 Saco · Total 70,76 USD · orden `QA-DEL-20260806` | 1002 / id 1 | Guardado y luego **eliminado** en DM-PED-037 (no persiste, por diseño del caso) |

---

## Verificación BD (RUNTIME §10)

**Baseline (inicio):** `order` 13.770 filas · `order_detail` 43.773 · `order_detail_unit` 43.761.
**Al cierre:** `order` **13.771** (+1) · `order_detail` **43.775** (+2) · `order_detail_unit` **43.763** (+2). Diff exacto.

Cabecera `id_order = 13806`:

| Columna | Valor nube | Contraste UI / payload | ✓ |
|---|---|---|---|
| `co_order` | `1786046671880.0` | = `coOrder` del payload | ✓ |
| `st_order` | `1` | `transaction_statuses` `co_transaction_type='ped'` + `co_status='env'` ⇒ **Enviado** | ✓ |
| `co_enterprise` / `id_enterprise` | `1002` / `1` | **la empresa de la corrida** | ✓ |
| `co_client` | `1000000803` | cliente de prueba | ✓ |
| `co_currency` / `nu_value_local` | `USD` / `710.0000` | tasa vigente | ✓ |
| `nu_amount_total` | `252.1000` | `Total Pedido USD` | ✓ |
| `nu_amount_final` / `nu_amount_total_base` | `224.5000` | `Total Base USD` | ✓ |
| `nu_amount_tax` | `27.6000` | `Total IVA USD` | ✓ |
| `nu_amount_total_conversion` | `178991.0000` | `252,10 × 710` | ✓ |
| `nu_amount_final_conversion` | `159395.0000` | `224,50 × 710` | ✓ |
| `nu_amount_tax_conversion` | `19596.0000` | `27,60 × 710` | ✓ |
| `nu_amount_discount` | `0.0000` | sin descuentos (VGs inactivas) | ✓ |
| `nu_details` | `2` | = 2 filas en `order_detail` | ✓ |
| `tx_comment` / `nu_purchase` | `Test-PED-SMOKE-161104` / `QA-20260806` | idénticos a la UI | ✓ |
| `id_user` | `266` | vendedor QA | ✓ |

`order_detail` (2 filas) y `order_detail_unit` (2 filas) cuadran campo a campo:
`160000010` → base 57,5000 / conv 40.825 / iva 16 / tax 27,6000 / total 200,1000 / conv 142.071 · unidad `160000010-SC` qu 3, base 172,5000 / conv 122.475.
`160000012` → base 26,0000 / conv 18.460 / iva 0 / tax 0 / total 52,0000 / conv 36.920 · unidad `160000012-FAR` qu 2, base 52,0000 / conv 36.920.

**Duplicados:** `count(*)=1` y `count(DISTINCT co_order)=1` para el `co_order` creado ⇒ sin duplicación.
**Hook de payload:** **1 solo POST** a `orderservice/order` (sin los 2 idempotentes de otras playas).

**Marca: `BD-OK`** — lo guardado se envió, íntegro y una sola vez.

---

## Verificación de VGs

| VG | Esperado (perfil) | Observado en UI | Veredicto |
|---|---|---|---|
| `userCanSelectProductDiscount` | false | El panel de línea trae **3 selects** (Lista de Precio · Unidad · IVA). **"% Descuento" NO existe** | ✅ **confirmada false** — la ausencia del select es la señal; reconfirma el 05/08 |
| `validateWarehouses` | false | **"Almacén" tampoco aparece** en el panel de línea; payload `coWarehouse:""` / `idWarehouse:0` | ✅ confirmada false |
| `validateNuOrder` | true | `ion-input#nuPurchase` llega `required=true` y vacío ⇒ `lockSegments=true`; al llenarlo las 3 tabs habilitan **en el mismo tick** | ✅ **confirmada true** (par antes/después medido) |
| `selectOrderType` | true | `ion-select` Tipo de pedido **habilitado**, 2 opciones `CFR` / `FOB`, default **CFR** (`order_types.default_value`) | ✅ confirmada true |
| `userCanChangePaymentConditions` | true | `ion-select` Condición de pago **habilitado**, 15 opciones, default `Vencimiento neto en 15 días` (NT15) | ✅ confirmada true |
| `userCanChangePriceList` | false | `ion-select` Lista de precios **`disabled=true`** pese a ofrecer 18 opciones; fija en `Med.Ind.Ctro-Cap CIF` (Z12) | ✅ confirmada false |
| Tasa no editable (`enabledManualRate=false`) | readonly | `ion-input#tasa` = `disabled:false` pero **`readonly:true`**, valor `710,0000` | ✅ confirmada — **gana sobre `canChangeRate=true`** |
| `multiCurrencyOrder` | true | Tab Total muestra **las dos monedas** en todas las filas (`Total Base USD` + `Total Base VES`, etc.) | ✅ confirmada true — contrasta con las playas donde el Tab Total salía solo en US$ |
| `orderEnterpriseEnabled` | true | `ion-select` Empresa **presente, habilitado y preseleccionado** en `CENTRAL EL PALMAR, S.A.` con las 2 empresas listadas | ✅ confirmada true |
| `userCanSelectIVA` | true | `ion-select` IVA por línea habilitado, opciones `IVA - 16` / `IVA - 0`; el cambio **recalcula correctamente** ambas monedas | ✅ confirmada true |
| `userCanSelectGlobalDiscount` | false | Sin campo de descuento global en el Tab Total; payload `nuAmountGlobalDiscount:0` | ✅ confirmada false |
| `requiredCommentOrder` | false | Guardar/Enviar habilitan con `#txComment` vacío (se llenó por el caso 030, no por obligación) | ✅ confirmada false |
| `stock0` | true | Productos con inventario se pidieron sin alerta; no se forzó un producto en 0 | ⚠ no ejercitada esta corrida |
| Moneda por defecto (**fix de hoy**) | USD | `comp.monedaSeleccionada = {coCurrency:"USD", hardCurrency:"true", localCurrency:"false"}` en form recién abierto | ✅ **fix verificado** |

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **Tras Guardar, el form de PEDIDOS queda SUCIO: el back dispara igual el dirty-guard** | universal (candidato) | **CONTRADICE** la nota vigente en `pedidos.md` (`[gmp-2611][ins-2622][jerez-2026-07-06]`) que dice *"Guardar con `.imagenGuardar` deja el form pristine → atrás sale directo SIN modal"*. Medido 2 veces en el_palmar v1.0/db19: tras el alert `Pedido Guardado` [OK], pulsar `img.fechaAtras` **vuelve a abrir** el modal `¡Alerta!` de 3 opciones. **No es FAIL** (es defensivo y el pedido ya está guardado), pero **el guión debe prever el modal después de Guardar** y salir con **"Salir sin guardar"** por igualdad exacta. ⚠ Un `includes('salir')` matchearía **"Guardar y salir"** y crearía un pedido duplicado |
| **El listado de CLIENTES sólo re-renderiza al forzar detección de cambios** | cliente (candidato universal) | `comp.onIonInfinite()` **sí** agranda el modelo, pero el DOM se queda en 50 `ion-item` y `scrollDisable` pasa a `true` ⇒ se lee como "el cliente no existe". **Receta que funcionó:** `onIonInfinite()` → esperar ~900 ms → disparar un `input` event sobre `input.search-input.inputsSearch` (+ `ng.applyChanges(host)`) → repetir. Traza medida: 50 → **100** → **144**. Sin el evento, 8 rondas dejan el DOM en 50 |
| **Buscador del listado de CLIENTES: `input.search-input.inputsSearch`, no `ion-searchbar`** | cliente | `querySelectorAll('ion-searchbar')` devuelve `[]` en `app-client-list`. Además `pg.keyboard.type()` **no** llega al modelo: hay que usar el setter nativo de `HTMLInputElement.value` + `input` event. ⚠ Setear `searchText` **no filtra** el render en este build (sólo dispara la carga completa) |
| **`app-client-detail` expone el oráculo de saldos completo** | universal (candidato) | `ng.getComponent(document.querySelector('app-client-detail'))` → `allDocuments[]` (los documentos que **realmente ve la app**, con `coCurrency`/`nuBalance`/`coEnterprise`), `documentSalesTotalRows`, **`saldoLocal`** y **`saldoFuerte`**. Es la vía barata de aplicar el "camino 2" (recalcular con los documentos del device) sin leer la tabla del DOM |
| **Tab Pedido: entrada a categoría por coords fijas tras drill-down** | cliente | Confirmada la 3.ª variante (drill-down) de `[el_palmar-20260805]`: `Azucar` en `cy≈331`, `PVA` en `cy≈375`. Al volver de otra tab el árbol **regresa al nivel de categorías** (no conserva el drill-down) ⇒ re-entrar siempre antes de buscar un producto |
| **Sellado de `id` en el input de cantidad por descarte — reconfirmado** | universal | Los productos son `ion-accordion` **sin atributo `value`**: el único `ion-input[type=number]` con `height>0` y **sin `id` sellado** es el del producto recién expandido. Funcionó a la primera en los 3 productos cargados |
| **Selector de IVA por línea → `ion-popover` con `ion-item`** | universal | El `ion-select` de IVA abre un popover cuyas opciones son `ion-item` (`IVA - 16` / `IVA - 0`); `querySelectorAll('button')` sobre el popover devuelve `[]`. Clickear el `ion-item` por **texto exacto**. Confirma el patrón de `[alipascua-20260804]` para "% Descuento" |
| **Etiquetas de alert medidas en este módulo** | cliente | deuda vencida `[Cancelar, **Aceptar**]` · guardado `[**OK**]` · envío paso 1 `[Cancelar, **Aceptar**]`, pasos 2 y 3 `[**OK**]` · borrado en lista `[Cancelar, **Aceptar**]` · dirty-guard `[Guardar y salir, Salir sin guardar, Cancelar]`. **Títulos inconsistentes**: `Pedidos` / `Denario` / `Denario Pedidos` / `Denario Premium` en el mismo módulo — reconfirma "la etiqueta se LEE, no se predice" |
| **Envío = 3 alerts y la 3.ª trae la Ref** | cliente | `Pedidos/"¿Desea Enviar el pedido?"` → `Denario Pedidos/"Su Pedido será enviado"` → `Denario Premium/"Pedido nro. 13806 enviado exitosamente"`. Contrasta con los 2 alerts de `[gmp-20260730][alipascua-20260804]` |
| ⚠ **Al reabrir un Guardado la etiqueta de total de línea pierde la moneda** | cliente | En el form fresco la línea rotula `Total USD: 200,1000`; al reabrir el mismo pedido rotula **`Total : 200,1000`** (sin `USD`). El importe es idéntico; sólo se cae el código de moneda de la etiqueta. Cosmético, no afecta cálculo |
| **`app-pedidos-lista` sí tiene `ion-searchbar` y filtra realtime** | cliente | A diferencia del modal de alta de cliente (sin searchbar), la lista BUSCAR filtra con `pg.keyboard.type()` normal. Confirma la distinción ya anotada en ferrenuestro |

---

## Hallazgos

**Sin FAIL.** Un único defecto **cosmético** confirmado:

### `PED-TOTAL-IVA-LINEA-FLOAT-CRUDO` — S3 / cosmético

El importe de IVA convertido a VES de **cada línea** del Tab Total se pinta como número crudo de
JavaScript, sin el formato de 4 decimales y separador de miles que usa el resto de la pantalla:
`19596`, `5907.2`, `6929.599999999999`, `13064.000000000002`.
El valor es **numéricamente correcto** en los 4 casos observados; el problema es sólo de presentación,
pero el error de coma flotante (`…000000000002`) queda a la vista del usuario.
Reproduce en el form fresco y también al reabrir un pedido Guardado.

### Observación sin severidad (comportamiento, no defecto)

Tras `Guardar`, el formulario **no queda pristine**: el botón atrás vuelve a disparar el dirty-guard de
3 opciones. Es defensivo y no pierde datos, pero **contradice la nota vigente** en `module-selectors/pedidos.md`
y puede inducir a un guión automatizado a pulsar "Guardar y salir" (duplicando el pedido) si matchea
los botones por `includes` en vez de por igualdad exacta.

---

## Estado final

- App en **HOME**, sesión intacta, sin overlays residuales.
- 1 pedido **Enviado** (Ref **13806**, empresa 1002) y 1 pedido de prueba creado y **eliminado**.
- Ledger: 14 líneas en `_results.jsonl` con `"modulo":"pedidos-recorrida"` (no pisan las del 05/08).
- Manifiesto: 1 línea en `_bd-manifest.jsonl`. Payload: 1 línea en `_payloads.jsonl`.
