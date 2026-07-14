# Smoke Test — Módulo PEDIDOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260707_175334_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | Android real vía CDP `http://127.0.0.1:9220` |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | Isla Coche (`http://denarioislacoche.ddns.net:8081`) |
| Cliente | ferrenuestro (usuario `leidy`) — 1ª corrida |
| Resultado | 13 PASS · 0 FAIL · 0 SKIP · 0 N/A · 1 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | `/pedidos` `app-pedidos` con botones PEDIDO, BUSCAR, COPIAR |
| DM-PED-002 | ✅ PASS | Click PEDIDO → `/pedido` `app-pedido`; tabs General habilitada, Pedido/Total/Adjunto `segment-button-disabled` sin cliente |
| DM-PED-006 | ✅ PASS | Cliente `TORNICAGUA, C.A` (cód 121793873) → alerta "Pedidos / Este cliente tiene deuda vencida, ¿Desea continuar…" (Cancelar/Aceptar) → Aceptar → 4 tabs habilitadas + sucursal auto "CTRA NACIONAL CAGUA LA VILLA…" |
| DM-PED-015 | ✅ PASS | Tab Pedido: 17 categorías/estructuras en acordeón (AGRICOLA 319, AUTOMOTRIZ 336, CONSTRUCCION 543, ELECTRICIDAD 555, HERRAMIENTAS ELECTRICAS 18, …) |
| DM-PED-017 | ✅ PASS | Cantidad=2 en TALADRO INALAMBRICO 20V (cód 080178, Inventario 2) → badge `[color=success]`, contadorProductos, sin alerta "sin inventario" |
| DM-PED-024 | ✅ PASS | Tab Total: Total Items 1, Total Base $172,80, Total IVA $27,65, Total Pedido $200,45, **Límite de Crédito 2.000,00** (showCreditLimit✓); **solo US$, sin Bs.** (multiCurrencyOrder=false✓) |
| DM-PED-026 | ⛔ BLOCKED | Trash del ítem en Tab Total (`ion-button[color=danger]`+`ion-icon[name=trash]`, w26/h27) no recalcula tras 2 intentos por CDP (click simple y pointer down/up) — build usa `ion-accordion`, difiere de insumar `[ins-2610]`. Limitación de automatización, no defecto |
| DM-PED-029 | ✅ PASS | Con cliente y **0 ítems**: `.imagenGuardar` y `.imagenEnviar` `disabled=true` (no se puede guardar sin datos) |
| DM-PED-030 | ✅ PASS | 2 ítems + comentario → Guardar → alert "Denario / Pedido Guardado" (OK); aparece en BUSCAR Nro. Ref: 0 · Estatus Guardado |
| DM-PED-031 | ✅ PASS | Reabrir Guardado → Enviar → "¿Desea Enviar el pedido?" → "Su Pedido será enviado" → "**Pedido nro. 28458 enviado exitosamente**"; navega a `/pedidos` |
| DM-PED-032 | ✅ PASS | Atrás con form dirty (2 ítems, sin guardar) → modal "¡Alerta!" 3 opciones (Guardar y salir / Salir sin guardar / Cancelar) → Cancelar mantiene el form |
| DM-PED-034 | ✅ PASS | BUSCAR (`app-pedidos-lista`, 68 ítems) → searchbar "TORNICAGUA" → filtra realtime a 16 ítems (todos TORNICAGUA) |
| DM-PED-035 | ✅ PASS | Click pedido Guardado (Ref 0, zona izq ~30%) → form editable; tras ~2s: 4 tabs habilitadas, comentario rehidratado `Test-PED-SMOKE-181948` (round-trip §9✓), Enviar habilitado |
| DM-PED-037 | ✅ PASS | 2º pedido Guardado → trash en lista (`ion-button[color=danger]` w≈29, x301) → confirm "¿Seguro que quieres eliminar este pedido?" → Aceptar → lista 69→68, Ref 0 desaparece |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| 28458 | Pedido TORNICAGUA (idClient 504) · 2 líneas: TALADRO 080178 ×2 + ESMERIL 080401 ×1 · Total $257,72 · comentario `Test-PED-SMOKE-181948` | **Enviado** (BD-OK, `id_order=28458`, `st_order=1`) |
| 0 | Pedido TORNICAGUA desechable · 1 línea ESMERIL 080401 ×1 (creado para DM-PED-037) | Guardado y luego **BORRADO** (nunca llegó a la nube — correcto) |

## Verificación BD
`BD-OK` — round-trip UI→servidor confirmado (RUNTIME §10).

**Baseline pre-corrida:** `order=5005`, `max(id_order)=28457`. **Final:** `order=5006`, `max(id_order)=28458` (+1, solo el enviado).

**Nube (tabla `"order"`, ferrenuestro) — pedido enviado:**
```
id_order=28458 · co_order=1783462334628.0 · st_order=1 · nu_amount_total=257.7188 · nu_amount_final=222.1714 · nu_details=2 · det=2 · units=2
```
- `id_order=28458` = **Nro.Ref UI 28458** (correlación Ref=id_order reconfirmada · candidato a graduar a FAIL).
- `co_order=1783462334628.0` = `coOrder` del payload capturado (1:1).
- `nu_amount_total=257.7188` / `nu_amount_final=222.1714` cuadran con Tab Total (Total Pedido $257,72 / Total Base $222,17).
- `nu_details=2` = `det=2` (order_detail) = `units=2` (order_detail_unit): 2 líneas TALADRO(080178)+ESMERIL(080401). ✓
- `st_order=1` = **Enviado** (código Isla Coche/piercar-style; NO 4). Confirma la variante de estados de piercar `[prc-2606]` también en ferrenuestro.
- Payload `orderservice/order` capturado (cierra el gap `reference_qa_payload_capture_gap` en este build: order SÍ se captura vía `CapacitorHttp` hook): cabecera + `orderDetails[]` + `orderDetailUnit[]` (quOrder 2 y 1) volcados a `_payloads.jsonl`.
- Pedido Guardado desechable (Ref 0, borrado): correctamente **ausente** de la nube (nunca se envió, no dejó duplicado).

Conclusión guardado→enviado: **lo guardado se envió** (BD-OK), sin registros atascados ni duplicados.

## Datos reales descubiertos (insumo YAML — modules.pedidos)
| Clave | Valor descubierto |
|-------|-------------------|
| cliente_test | `TORNICAGUA, C.A` · código 121793873 · id_client 504 · CON sucursal (auto-selecciona "CTRA NACIONAL CAGUA LA VILLA EDIF SAN ANTONIO…") → habilita tabs |
| alerta_deuda_vencida | **true** — alerta "Pedidos / Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" (Cancelar/Aceptar) al seleccionar TORNICAGUA |
| estructura_producto | catálogo ferretería, 17 categorías por familia: AGRICOLA(319), AUTOMOTRIZ(336), BOMBILLOS(64), CERRAJERIA(161), CONSTRUCCION(543), DESCUENTOS VARIOS(1), ELECTRICIDAD(555), GALVANIZADO(184), GRIFERIA(199), HERRAMIENTAS ELECTRICAS(18), HERRAMIENTAS MANUALES(191), MISCELANEOS(347), PEGAMENTOS(110), PINTURA(183), PLOMERIA(191), PROMOCION(0), PVC(241) |
| producto_test | `TALADRO INALAMBRICO 20V-2.0 Ah 10mm METCO` · código 080178 · idProduct 196 · BULTO-1 · Precio 86,40 $ / +IVA 100,22 $ · Inventario 2 (estructura HERRAMIENTAS ELECTRICAS). Alt: ESMERIL ANGULAR 4 1/2 750W METCO (080401, Inv 5) |
| multiCurrencyOrder | false — Tab Total solo US$ (sin Bs.) ✓ verificado |
| showCreditLimit | true — "Límite de Crédito: 2.000,00" en Tab Total ✓ |
| suggestedOrder | **DISCREPANCIA**: config=true pero botón "Pedido Sugerido" NO aparece en Tab Pedido (misma divergencia que jerez `[jerez-2026-07-06]`) |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Producto = `ion-accordion.product-structure-title.accordionPedidos` dentro de `ion-accordion-group` | universal (build nuevo) | **Contradice** la nota `[gmp-2611]` "NO es ion-accordion". En ferrenuestro (Isla Coche) los productos SÍ son `ion-accordion`; header = `ion-item` (nombre+Código+Precio+Inventario), contenido = `ion-grid.contenidoProductos` con `ion-input[type=number]` (height 0 mientras colapsado). Click en header (`y=top+30`) expande y revela el input |
| Modal cliente (pedidos) = `input` plano placeholder "Clientes..." + icono `ion-icon[name=search-circle-sharp]` | universal (refuerza clientes) | El searchbar NO es `ion-searchbar`: es `input` nativo; setear value + `input` event y **hacer click en el icono search-circle-sharp** para disparar el filtro (typing solo no filtra). Igual patrón que módulo Clientes |
| Trash Tab Total no responde por CDP en build ion-accordion | cliente ferrenuestro / build Isla Coche | `ion-button[color=danger]`+`trash` dentro del acordeón del ítem no recalcula con `mouse.click` ni pointer down/up (DM-PED-026 BLOCKED). Difiere de insumar donde funcionó `[ins-2610]`. Reintentar con `window.ng` handler o Pointer+Mouse combinado en próxima corrida |
| Toggle de categoría se colapsa al cambiar de tab | universal (confirma `[dth-2612]`) | Volver a Tab Pedido re-colapsa la categoría; re-expandir con click limpio |
| Captura de payload `orderservice/order` operativa | universal (actualiza `reference_qa_payload_capture_gap`) | El hook `CapacitorHttp` vía `Cap.nativePromise` SÍ capturó el POST de pedido (order) en este build — cabecera+detalle+unidad completos. Revisar si el gap era específico de otro build |
| `st_order=1`=Enviado (no 4) | cliente/playa Isla Coche | Confirma la tabla de estados piercar-style `[prc-2606]` en ferrenuestro |

> ✅ consolidado 2026-07-07 → ion-accordion-build, trash-BLOCKED, toggle-colapsa, st_order=1 y suggestedOrder-divergencia en `module-selectors/pedidos.md`; payload orderservice/order en `_comunes.md`; datos de prueba en `ferrenuestro.yaml modules.pedidos`.

## Hallazgos (solo si hay FAIL)
Sin FAIL. Observaciones:
- **DM-PED-026 BLOCKED** (no defecto de app): trash de ítem en Tab Total no conducible por CDP en este build.
- **Divergencia config↔UI**: `suggestedOrder=true` pero sin botón "Pedido Sugerido" en Tab Pedido (idéntico a jerez; posible que dependa de `suggestedOrderByDispatchAndReturn`, que en ferrenuestro=false).

## Nota de estado final
App queda en **HOME** (`/home`, `app-home`), lista para el siguiente agente.

## Verificación BD (payload ↔ nube) — Agente BD (cotejo campo-a-campo)

| co_order | Marca | Campos cabecera | Hijas payload/nube | Mismatches | Notas |
|---|---|---|---|---|---|
| 1783462334628.0 | BD-FIELD-OK | 35/35 OK | order_detail 2/2 · order_detail_unit 1/1 + 1/1 | 0 | 2 notas TZ (da_order, da_dispatch): hora difiere UTC-4↔UTC, día OK |

**Detalle:** sin MISMATCH. Cabecera 35/35 (co_order, co_client, id_client, montos, conversiones, impuestos, condición de pago, dirección, coordenada, tx_comment, etc.). Líneas: 2 order_detail (080178, 080401) + order_detail_unit coinciden en co_product/id_product/precio/monto/IVA/cantidad. Montos: nube trunca a 4 decimales (mismo valor). Fechas da_order/da_dispatch difieren +4h (UTC-4↔UTC), día OK.
