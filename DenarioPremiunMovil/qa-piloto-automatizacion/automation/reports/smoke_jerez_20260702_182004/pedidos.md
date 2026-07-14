# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260702_182004_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | 14678405BR003855 (Infinix X6728) |
| App | `com.kiberno.denarioPremiumPro` — WebView Chrome/149 |
| Playa | jerez (servidor El Yaque) |
| Cliente prueba | JL Motors SE,C.A (J-506554950, saldo 0,00, empresa 1) |
| Producto | PLAN-001 "Agro silotubo flex-silon extra PB 8P*50C" — 234,00 USD, PIEZA |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Home Pedidos con botones PEDIDO / BUSCAR / COPIAR (app-pedidos) |
| DM-PED-002 | ✅ PASS | Form app-pedido: General habilitada; Pedido/Total/Adjunto `segment-button-disabled`; sin cliente |
| DM-PED-006 | ✅ PASS | Modal cliente (`show-modal`, buscador "Clientes...") → JL Motors seleccionado; sin alerta deuda (saldo 0); 4 tabs habilitadas |
| DM-PED-015 | ✅ PASS | Tab Pedido → categoría "Plasticos 1" expandida → producto PLAN-001 visible en sub-acordeón |
| DM-PED-017 | ✅ PASS | Cantidad=2 en ion-input[type=number]; `.contadorProductos`=2 + badge success; sin alerta "sin inventario" (stock 450) |
| DM-PED-024 | ✅ PASS | Tab Total: Base USD 468,00 · IVA 74,88 · Total Pedido USD 542,88 (solo USD, multiCurrency=false) |
| DM-PED-026 | ✅ PASS | Trash dentro del acordeón del ítem (expandir → ion-button[color=danger]) → borrado directo sin confirmación; totales recalculados a 0 (Items:0, Total 0,00) |
| DM-PED-029 | ✅ PASS | Sin ítems: `.imagenGuardar` y `.imagenEnviar` deshabilitados |
| DM-PED-030 | ✅ PASS | Guardar → alert "Denario / Pedido Guardado" (OK); aparece en lista Estatus: Guardado, comentario `Test-PED-SMOKE-204527` |
| DM-PED-031 | ✅ PASS | Enviar → "¿Desea Enviar el pedido?" (Aceptar) → "Su Pedido será enviado" → **"Pedido nro. 15 enviado exitosamente"**; navega a home Pedidos. **BD-OK** (ver abajo) |
| DM-PED-032 | ✅ PASS | Atrás con form dirty (ítem sin guardar) → modal "¡Alerta!" 3 opciones: Guardar y salir / Salir sin guardar / Cancelar. (Tras Guardar, form pristine → atrás salió directo sin modal, comportamiento esperado) |
| DM-PED-034 | ✅ PASS | Searchbar "DANIELA" → filtro realtime 12 → 6 ítems (todos DANIELA HERNANDEZ) |
| DM-PED-035 | ✅ PASS | Reabrir pedido Guardado (Ref 0) → form editable 4 tabs; comentario rehidratado `Test-PED-SMOKE-204527` (round-trip §9 OK). Tabs se habilitan tras ≈2-3s (carga async de listaDirecciones) |
| DM-PED-037 | ✅ PASS | Trash en lista (ion-button[color=danger] w≈29) → alert "Pedidos / ¿Seguro que quieres eliminar este pedido?" → Aceptar → ítem desaparece (Ref 0 Guardado: 1→0) |

## Registros creados en sistema

| Ref | Detalle | Estado final |
|-----|---------|--------------|
| **15** | JL Motors SE,C.A · PLAN-001 ×2 · Base 468,00 / Total 542,88 USD · comentario `Test-PED-SMOKE-204527` | **Enviado** (id_order 15 en nube · BD-OK) |
| 0 | JL Motors SE,C.A · PLAN-001 ×2 (2º pedido, para DM-PED-037) | Guardado → **Eliminado** desde lista |

## Verificación BD (round-trip al servidor · RUNTIME §10)

**Baseline nube:** max(id_order)=14 antes de la corrida.

**Nube (durable) — `order`:**
```
id_order=15 · co_order=1783039290114.0 · st_order=1 (Enviado en jerez)
nu_amount_total=542.88 · nu_amount_final=468.00 · nu_details=1 · tx_comment="Test-PED-SMOKE-204527"
det(order_detail)=1 · units(order_detail_unit)=1
```
- **BD-OK**: el pedido guardado→enviado llegó a la nube. Baseline 14 → 15 (+1). Totales, comentario, detalle y unidades cuadran 1:1 con Tab Total y con el payload capturado.
- **Sin duplicado**: se capturaron **2 POST idénticos** a `orderservice/order` (mismo `coOrder` 1783039290114.0 — reintento de AutoSend), pero la nube dedupó por `co_order` → **una sola fila** (id 15, no 15+16). Cero `BD-MISMATCH`.
- **Correlación Ref↔fila:** Nro.Ref UI **15** = `id_order` **15** (confirmado directo).

**Local (SQLite dispositivo):** **BD-N/A** — `local-query.js` devolvió `ERR: run-as: exec failed for sqlite3: No such file or directory` (binario `sqlite3` no presente en el dispositivo Infinix). Por blindaje §10 no tumba el smoke; la confirmación de nube (BD-OK) es suficiente para "guardado→enviado".

## Captura de payload (§10.c)

- **El hook SÍ capturó `orderservice/order` en este build.** `installPayloadCapture` enganchó vía `Capacitor.nativePromise`; AutoSendService en el APK DEBUG nuevo pasa por ese canal (a diferencia de la corrida previa donde no capturó). **2 payloads de order** volcados a `_payloads.jsonl` (append, POST 1 y 2 del mismo pedido).
- Payload incluye cabecera + `orderDetails` + `orderDetailUnit` (quOrder=2, coProductUnit=PZA-PLAN-001, nuBaseTotal=468, iva=16, coCurrency=USD, coPaymentCondition=CodCredito, coEnterprise=00001).

### Verificación BD (payload ↔ nube) — Agente BD (definitivo · cotejo campo-por-campo)

> **PRIMER cotejo campo-por-campo real de pedidos** en toda la validación (antes el hook no capturaba `order` → caía a fallback query). Agente BD en background, completó y devolvió esta sección; anexada por el orquestador.

| id_order | Marca | Campos cabecera | Hijas (detail/unit) | Mismatches | Notas |
|---|---|---|---|---|---|
| 15 (co_order `1783039290114.0`) | **BD-FIELD-OK** (efectivo) | 35/35 cuadran | order_detail PLAN-001 1↔1 (12/12) · order_detail_unit PZA-PLAN-001 1↔1 (5/5) | 0 reales | 1 falso-positivo TZ en `da_order` (ver calibración) |

- **Conteo por marca:** BD-FIELD-OK efectivo = 1 · BD-SAVED = 0 · BD-N/A = 0. (El motor reportó `BD-FIELD-MISMATCH` por 1 solo campo `da_order`, que es diferencia de zona horaria, no de dato.)
- **Valores clave:** nu_amount_total=542,88 ✅ · nu_amount_final=468 ✅ · nu_amount_tax=74,88 ✅ · tx_comment=Test-PED-SMOKE-204527 ✅ · coCurrency=USD ✅ · conversiones BS OK. Detalle (PLAN-001) + unit (PZA, qu_order=2) cuadran 1↔1.
- **⚠ CALIBRACIÓN pendiente (order):** `da_order` payload `2026-07-02 20:48:32` vs nube `2026-07-03T00:48:32Z` = **mismo instante +4h (UTC-4→UTC)**. Hoy solo `da_dispatch` está en la lista de fechas tolerantes-a-TZ del motor; **agregar `da_order`** para que no lo marque como mismatch (mismo tratamiento). Con ese ajuste el veredicto del motor pasa a BD-FIELD-OK limpio.
- **Veredicto:** lo que se mandó == lo que se guardó (35 cabecera + 2 hijas anidadas). Config `order` validado en vivo (renames coAddress→co_address_client, idAddress→id_address_client OK; anidado orderDetails→orderDetailUnit OK), salvo el ajuste TZ de `da_order`.
- **Comparativa vs R1 (`20260630_181903`):** allí pedidos fue BD-SAVED (no persistió) + fallback query (hook no capturaba order). En este build: **persistió + hook capturó order + cotejo campo-por-campo real**. H1 y H2 no reproducidos.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **st_order Enviado = 1 en jerez** | cliente (jerez) | Todos los pedidos enviados (incl. baseline id 1-14 y el nuevo 15) muestran `st_order=1`, NO 4. Mismo patrón que piercar (código 1 = Enviado). Confirma que la tabla de estados de El Yaque/jerez difiere del 4/10 del smoke doc |
| **Hook payload captura order vía nativePromise** | universal (build nuevo) | En el APK DEBUG feature-branch, `Capacitor.nativePromise` está presente y AutoSendService lo usa → `installPayloadCapture` SÍ captura `orderservice/order`. Contradice el "dato conocido" de que el hook no capturaba order (CapacitorHttp.request). Verificar si persiste en builds de release |
| **Server dedup por co_order** | universal | 2 POST idénticos (reintento AutoSend, mismo coOrder) → una sola fila en nube. No genera duplicado |
| **Modal cliente en pedidos: buscador con placeholder "Clientes..."** | universal | El `input` de búsqueda está en el modal (`show-modal`) pero no siempre como `ion-searchbar`; localizar por `input[placeholder="Clientes..."]` |
| Reabrir Guardado: tabs disabled en snapshot inmediato | universal | Confirma nota `[prc-2606]`: tras reabrir, esperar ≈2-3s; General queda enabled, resto habilita async al cargar listaDirecciones. No marcar FAIL en snapshot inmediato |

## Hallazgos (FAIL)

Ninguno. 14/14 PASS.

## Notas de ejecución

- CDP se cayó una vez a mitad de corrida (ECONNREFUSED :9220, forward removido). Re-mapeado: `adb forward tcp:9220 localabstract:webview_devtools_remote_4369` + curl OK; reconexión limpia, estado (home Pedidos) conservado, `window.__qaH` persistió. Sin pérdida de datos.
- Estado final: **HOME** (app-home, /home).
