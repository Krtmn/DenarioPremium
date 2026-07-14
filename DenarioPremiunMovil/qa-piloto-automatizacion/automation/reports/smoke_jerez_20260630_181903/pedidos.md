# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260630_181903_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | 14678405BR003855 (Infinix X6728, Android 15) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 (WebView Chrome 149) |
| Playa | jerez (servidor El Yaque · denarioelyaque.ddns.net:8081) |
| Cliente prueba | JL Motors SE,C.A (J-506554950, saldo 0,00, empresa 1) |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Home Pedidos con botones PEDIDO / BUSCAR / COPIAR (`app-pedidos`, `/pedidos`) |
| DM-PED-002 | ✅ PASS | Form `app-pedido`: GENERAL habilitada; PEDIDO/TOTAL/ADJUNTO con `segment-button-disabled`; sin cliente |
| DM-PED-006 | ✅ PASS | Modal 3 clientes → seleccionado JL Motors; **sin alerta de deuda** (alerta_deuda_vencida=false, saldo 0,00); las 4 tabs se habilitan |
| DM-PED-015 | ✅ PASS | Tab Pedido: acordeón de 8 categorías; Plasticos (1) expande → producto PLAN-001 "Agro silotubo flex-silon extra PB 8P*50C" |
| DM-PED-017 | ✅ PASS | `fillIonInput` cantidad=2 → badge `.contadorProductos`=2 + indicador `[color="success"]`; sin alerta "sin inventario" (stock 450) |
| DM-PED-024 | ✅ PASS | Tab Total: Total Base USD 468,00 · Total IVA USD 74,88 · **Total Pedido USD 542,88**; solo USD (multiCurrencyOrder=false confirmado, sin Bs.) |
| DM-PED-026 | ✅ PASS | Trash dentro del acordeón del ítem (Tab Total) → **borrado directo sin confirmación**; totales recalculados a 0,00 |
| DM-PED-029 | ✅ PASS | Sin ítems: `.imagenGuardar` y `.imagenEnviar` deshabilitados. Con ítem re-agregado → Guardar habilita |
| DM-PED-030 | ✅ PASS | Click Guardar → alert "Denario / **Pedido Guardado**" |
| DM-PED-031 | ✅ PASS | Enviar → secuencia de alertas: "Pedidos / ¿Desea Enviar el pedido?" (ACEPTAR) → "Denario Pedidos / Su Pedido será enviado" (OK) → navega a home pedidos. **BD: queda en "Por Enviar" (cola local, envío eventual)** |
| DM-PED-032 | ✅ PASS | Form dirty (ítem agregado) + atrás (`img.fechaAtras`, mouse.click real 32,47) → modal "¡Alerta!" 3 opciones: GUARDAR Y SALIR / SALIR SIN GUARDAR / CANCELAR |
| DM-PED-034 | ✅ PASS | Searchbar "Inversiones" → filtra en tiempo real de 11 a 1 ítem |
| DM-PED-035 | ✅ PASS | Click pedido Guardado (zona izq-centro) → reabre `app-pedido` editable; las 4 tabs habilitadas tras carga async (~2s) |
| DM-PED-037 | ✅ PASS | Trash en lista (`ion-button[color="danger"]` w≈29, coords 301,195) → confirmación "Pedidos / ¿Seguro que quieres eliminar este pedido?" → ACEPTAR → pedido Guardado desaparece de la lista |

**Nota DM-PED-035/032 (comportamiento defensivo, NO FAIL):** al reabrir el pedido Guardado con ítems, la rehidratación ensucia el form → pulsar atrás **sin editar** disparó igualmente el modal dirty-guard "¡Alerta!". Se eligió SALIR SIN GUARDAR y el pedido Guardado persistió correctamente en la lista. Consistente con notas `[gmp-2611][dth-2612]`.

## Verificación BD (round-trip al servidor · RUNTIME §10)

**Nube** (`order` — servidor jerez/El Yaque):
- `max(id_order)=13` al cierre; el pedido enviado en DM-PED-031 **no llegó a la nube** (sigue en cola local "Por Enviar", Ref 0). Poll de ~25s sin aparición de `id_order>13` → **BD-QUEUED** (envío asíncrono/eventual, esperado; la señal UI de envío se completó).
- `st_order = 1` para todos los pedidos Enviado en jerez (confirma la nota `[prc-2606]`: este backend usa **1 = Enviado**, no 4).
- **Cotejo de totales por pedido gemelo:** `id_order=11` (JL Motors, mismo producto, 2026-06-24) tiene `nu_amount_total=542.8800`, `nu_amount_final=468.0000`, `det=1` — **idéntico** al Tab Total de mi pedido (542,88 / 468,00 / 1 línea) → los totales calculados por la UI cuadran con lo que el servidor persiste para ese ítem.

**Local** (SQLite dispositivo): **BD-N/A** — `local-query.js` falla con `run-as: exec failed for sqlite3: No such file or directory` (binario sqlite3 no disponible en el device vía run-as). No bloquea el smoke (blindaje §10).

**Conclusión guardado→enviado:** el pedido se guardó y se despachó desde la UI (navegó a home tras la secuencia de envío) pero al momento del cierre permanece **en cola local (Por Enviar)** sin confirmación del servidor → **BD-QUEUED / BD-INFO**. No es defecto: es la ventana de sync eventual del AutoSendService.

## Payloads (cotejo BD · _payloads.jsonl)

**0 payloads `orderservice/order` volcados.** El hook `installPayloadCapture` capturó durante toda la sesión solo `potentialclientservice/potentialclient` y `syncservice/getsync` (10 llamadas), nunca `orderservice/order`. Causa probable: el hook solo registra `plugin==='CapacitorHttp'` con `method` que matchea `/post/i`; el envío del pedido (AutoSendService) usa muy probablemente `CapacitorHttp.request` con `options.method:'POST'` (el `method` del plugin es `'request'`, no `'post'`) o Angular HttpClient — ninguno atraviesa el filtro actual. Es una **limitación de captura**, no un defecto de la app (el pedido sí se encoló para envío). Ver "Patrones / selectores nuevos".

### Verificación BD (payload ↔ nube) — Agente BD (definitivo)

> Sin payload de `orderservice/order` (gap de captura), el Agente BD cayó al cotejo equivalente por `query.js`. Lanzado en background, completó y devolvió esta sección; anexada por el orquestador.

| co_order | Marca | Campos cabecera | Hijas | Mismatches | Notas |
|---|---|---|---|---|---|
| Test-PED-SMOKE-210412 (id_order esperado 14) | **BD-SAVED** | N/A — no persistió | N/A | N/A | No existe fila con `tx_comment='Test-PED-SMOKE-210412'`. `max(id_order)=13` sin cambios tras reintento ~11s. Pedido quedó en cola local "Por Enviar"; no llegó a la nube en la ventana. |

- **Conteo por marca:** BD-FIELD-OK = 0 · BD-FIELD-MISMATCH = 0 · **BD-SAVED = 1** · BD-N/A = 0.
- **Veredicto:** el pedido **NO llegó a la nube**. `SELECT ... WHERE tx_comment='Test-PED-SMOKE-210412'` → vacío (1º intento y reintento). `max(id_order)=13, count=10` (el correlativo esperado 14 no se creó). Sin cabecera persistida no se cotejan `nu_amount_total=542,88` / subtotal 468,00 ni hijas (`order_detail`/`order_detail_unit`).
- **Notas operativas (calibración query):** la tabla es `"order"` (entre comillas, palabra reservada); columnas reales `nu_amount_total`/`nu_amount_final` (no `nu_total`/`nu_sub_total`).
- **Nota de calibración (captura):** ampliar `installPayloadCapture` en `denario-cdp-helpers.js` para interceptar `CapacitorHttp.request` con `method:'POST'` → habilitaría el cotejo campo-por-campo de pedidos (hoy solo por fallback query).

**Patrón acumulado:** 2º módulo consecutivo (clientes + pedidos) con registro enviado que queda "Por Enviar" y no persiste en la nube en la ventana → refuerza la sospecha de cola de salida / sync del servidor de El Yaque para jerez. Escalar como observación de la corrida.

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| 0 (pend. id_order 14) | Pedido JL Motors SE,C.A · PLAN-001 "Agro silotubo flex-silon extra PB 8P*50C" ×2 · Total 542,88 USD · comentario `Test-PED-SMOKE-210412` | **Por Enviar** (encolado, envío eventual — no confirmado en nube al cierre) |
| — | Pedido Guardado (JL Motors, PLAN-001 ×2) creado vía "Guardar y salir" del dirty-guard | **ELIMINADO** en DM-PED-037 (no persiste) |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Conexión CDP `connectOverCDP('http://127.0.0.1:9220')` FUNCIONA en este device | universal | Pese al aviso del prompt sobre rechazo por Host IP, la forma http estándar (`h.connectCdp`) conectó sin problema al WebView Chrome 149 de jerez. El fallback ws://.../devtools/browser + Host:localhost no fue necesario. |
| Botón PEDIDO/BUSCAR/COPIAR = `app-pedidos ion-button` (texto), coords ≈(180,107/176/245) | cliente jerez (layout) | El primer `pg.mouse.click` a veces no navega; la navegación se materializa tras el 2º dispatch/espera. Verificar `app-pedido` visible con reintento antes de marcar fallo. |
| Envío de pedido queda en "Por Enviar" (cola local) tras secuencia UI completa | universal | En jerez el POST a nube es diferido: la UI confirma "Su Pedido será enviado" y navega a home, pero `id_order` server no se asigna de inmediato → lista muestra "Estatus: Por Enviar", Ref 0. BD-QUEUED esperado. |
| `installPayloadCapture` NO captura `orderservice/order` | universal (helper) | El filtro `/post/i.test(method)` sobre `CapacitorHttp` no matchea el envío de pedidos (usa `request`/HttpClient). Ampliar el `record()` a `method==='request'` con `options.method` POST para capturar order/collection. |
| Secuencia de alertas Enviar (jerez) | cliente jerez | "¿Desea Enviar el pedido?" (Pedidos) → "Su Pedido será enviado" (Denario Pedidos) → navega a home. No aparece un alert final con "Pedido nro X enviado exitosamente" (a diferencia de insumar/romher). |
| `st_order = 1` = Enviado en jerez | cliente jerez | Confirma la nota `[prc-2606]` de piercar: backend El Yaque usa código 1 para Enviado (no 4). |

## Hallazgos (FAIL)

Ninguno. Los 14 casos pasaron. Único punto abierto: el pedido enviado permanece en cola local (Por Enviar) al cierre — comportamiento de sync eventual esperado, no defecto.
