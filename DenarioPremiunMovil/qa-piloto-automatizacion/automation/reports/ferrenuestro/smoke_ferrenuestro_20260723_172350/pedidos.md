# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260723_172350_smoke-completo` |
| Módulo | PEDIDOS |
| Cliente / Playa | ferrenuestro (Isla Coche) |
| App | `com.kiberno.denarioPremiumPro` — build El Yaque v6.6.18 |
| Infra | `window.ng=TRUE` · alert OK · captura payload `nativePromise` OK · **BD nube caída → BD-N/A (payload)** |
| Servidor WS | `denariolatortuga.ddns.net:8081/PremiumWS` |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | `/pedidos` con botones PEDIDO/BUSCAR/COPIAR |
| DM-PED-002 | ✅ PASS | Form `/pedido`: General habilitada; Pedido/Total/Adjunto `segment-button-disabled` sin cliente |
| DM-PED-006 | ✅ PASS | Cliente TORNICAGUA seleccionado → modal "deuda vencida" (Aceptar) → 4 tabs habilitadas |
| DM-PED-015 | ✅ PASS | Tab Pedido: 17 categorías por LINEA (HERRAMIENTAS ELECTRICAS 17). "Pedido Sugerido" **NO aparece** (divergencia conocida) |
| DM-PED-017 | ✅ PASS | Cantidad=2 en TALADRO 080178 → `.contadorProductos`=2 + badge `[color=success]`; sin alert inventario |
| DM-PED-024 | ✅ PASS | Tab Total: Sub-Total $172,80 · IVA $27,65 · Total $200,45 (solo US$, `multiCurrencyOrder=false`) |
| DM-PED-026 | ✅ **PASS** | Trash en Tab Total con **`pg.mouse.click` (window.ng=TRUE)**: totales $200,45 → **$0,00**, ítem eliminado. **Resuelve el BLOCKED de julio (ferrenuestro El Yaque `window.ng=false`)** |
| DM-PED-029 | ✅ PASS | Sin ítems: `.imagenGuardar` y `.imagenEnviar` con clase `button-disabled` |
| DM-PED-030 | ✅ PASS | Guardar → alert "Denario / Pedido Guardado" (OK); form pristine, sigue en `/pedido` |
| DM-PED-031 | ✅ PASS | Enviar → "¿Desea Enviar el pedido?" (Aceptar) → "Su Pedido será enviado" → **"Pedido nro. 29358 enviado exitosamente"**; navega a `/pedidos`. **POST `orderservice/order` capturado** |
| DM-PED-032 | ✅ PASS | Atrás con form dirty → modal "¡Alerta!" 3 opciones (Guardar y salir / Salir sin guardar / Cancelar) |
| DM-PED-034 | ✅ PASS | Searchbar "TORNICAGUA" → lista filtra realtime 88 → 17 ítems |
| DM-PED-035 | ✅ PASS | Click pedido Guardado (Ref 0) → form editable; 4 tabs habilitadas tras ~2s (patrón async `listaDirecciones`) |
| DM-PED-037 | ✅ PASS | Trash en lista (Ref 0) → "¿Seguro que quieres eliminar este pedido?" (Aceptar) → desaparece (ref0 1→0, total 89→88) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| **29358** | Pedido TORNICAGUA C.A. (cód 121793873, id_client 504) · 1 línea TALADRO INALAMBRICO 20V 080178 × 2 · Total $200,45 · comentario `Test-PED-SMOKE-175440` | **Enviado** (`stOrder=1`) |
| Ref 0 (efímero) | 2º pedido TORNICAGUA · 1 línea TALADRO DE BANCO × 1 · Guardado y luego **eliminado** en DM-PED-037 | Guardado → borrado |

## Verificación BD (BD-N/A payload — nube caída, cotejo por captura POST + UI)
Marca: **BD-N/A (payload)** — la BD nube da permission-denied; no se ejecutó `query.js`/`local-query.js` (por infra de corrida). Cotejo por payload capturado + UI:

- **POST capturado:** `http://denariolatortuga.ddns.net:8081/PremiumWS/services/orderservice/order` — **2 POST idempotentes** (mismo `coOrder=1784843436824.0`, cuerpo idéntico → deduplicado por servidor). Volcado a `_payloads.jsonl`.
- **Cabecera (order):** `idOrder=0` (sin PK aún en payload), `coClient=121793873`, `idClient=504`, `nuAmountTotal=200.448`, `nuAmountFinal=172.8`, `nuAmountTax=27.648`, `stOrder=1` (=Enviado, consistente con Isla Coche), `nuDetails=1`, `txComment=Test-PED-SMOKE-175440`, `coCurrency=$`, `idOrderType=2`, `hasAttachments=false`.
- **Detalle (orderDetails[0]):** `coProduct=080178`, `naProduct=TALADRO INALAMBRICO 20V-2.0 Ah 10mm METCO`, `idProduct=196`, `nuPriceBase=86.4`, `iva=16`, `nuAmountTotal=200.448`, `coPriceList=080178-P0001`.
- **Unidad (orderDetailUnit[0]):** `coProductUnit=001-080178`, `idProductUnit=5810`, `quOrder=2`, `coUnit=001`, `nuBaseTotal=172.8`.
- **Conclusión guardado→enviado:** el POST 3 niveles (cabecera+detalle+unidad) coincide 1:1 con la UI (Total $200,45, TALADRO ×2, comentario). Ref UI **29358** = número de pedido mostrado en el alert de éxito. Sin lector de nube no se confirma persistencia durable, pero **el envío salió** (2 POST capturados + alert "enviado exitosamente"). Cobertura del hook para `order`: **confirmada** en este build (coherente con `[ferrenuestro-2026-07-07]`/`[dm-electronica]`).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| DM-PED-026 trash recalcula con `pg.mouse.click` + `window.ng=TRUE` en ferrenuestro | cliente (ferrenuestro) | **Contradice/actualiza** la nota `[ferrenuestro-2026-07-07]` "trash NO recalcula (BLOCKED)". Con `window.ng=TRUE` esta sesión el trash del `ion-accordion` en Tab Total SÍ recalcula ($200,45→$0,00) con solo `mouse.click`. Confirma que la falla de julio era específica del estado `window.ng=false` de ese device, no del build. 4ª corrida que valida trash-con-mouse.click (hidroponias+dm-electronica+latino_cosmetica+ferrenuestro-hoy) |
| Modal cliente pedidos **sin searchbar** en ferrenuestro | cliente (ferrenuestro) | El modal de selección de cliente (`ion-modal.show-modal`) lista ~50 `ion-item` **sin `ion-searchbar`** → localizar por texto + `scrollIntoView({block:'center'})` + `mouse.click` con coords frescas. Filtrado realtime SÍ existe en la lista BUSCAR (`app-pedidos-lista`), no en el modal de alta |
| Secuencia de envío ferrenuestro (3 alerts) | cliente (ferrenuestro) | Enviar → "Pedidos / ¿Desea Enviar el pedido?" (Cancelar/Aceptar) → "Denario Pedidos / Su Pedido será enviado" (OK) → "Denario Premium / Pedido nro. X enviado exitosamente" (OK). 3 alerts hasta el número |
| Producto INALAMBRICO 080178 desaparece de la categoría tras consumir su stock | cliente (ferrenuestro) | Tras enviar 2 uds del TALADRO 080178, la categoría HERRAMIENTAS ELECTRICAS pasó de 17 → 16 productos y 080178 dejó de renderizarse (posible filtro por inventario=0). Para 2º pedido se usó otro producto de la misma categoría (TALADRO DE BANCO). ⚠ verificar con desarrollo si es filtro por stock esperado |
| Tab Pedido: click General→Pedido resetea la vista virtualizada | universal (candidato) | Si la categoría queda en estado inconsistente (accordions huérfanos, listaItems=0), re-clic General y luego Pedido restaura las 17 `ion-item.listaItems` colapsadas. Útil para recuperar tras toggles múltiples |

> ✅ consolidado 20260723

## Notas
- `window.ng=TRUE` confirmado esta sesión (contrasta `[ferrenuestro-2026-07-07]` con `window.ng=false`) — coherente con la tendencia dm-electronica/latino_cosmetica v6.6.18.
- Botón de alert = **"Aceptar"** funcionó en todos los modales (deuda vencida, enviar, borrar); "OK" en los alerts informativos (Pedido Guardado, enviado exitosamente).
- Fin en HOME confirmado (`app-home` visible, `/home`).
