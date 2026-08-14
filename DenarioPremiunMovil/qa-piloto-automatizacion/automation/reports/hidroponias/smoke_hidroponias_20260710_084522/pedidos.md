# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260710_084522_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | Infinix HOT 60i (Infinix X6728) · `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 (Isla La Tortuga) |
| Cliente | hidroponias · HIDROPONIAS VENEZOLA |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Click Pedidos → `app-pedidos` con botones PEDIDO/BUSCAR/COPIAR |
| DM-PED-002 | ✅ PASS | PEDIDO → `app-pedido`; GENERAL habilitada, PEDIDO/TOTAL/ADJUNTO `segment-button-disabled` sin cliente |
| DM-PED-006 | ✅ PASS | Cliente ALIMENTOS GOURMET CCC, C.A. (100146) seleccionado → 4 tabs habilitadas. Ver nota deuda vencida abajo |
| DM-PED-015 | ✅ PASS | Tab Pedido: 11 categorías; `GERMINADOS` (5 productos) visible en acordeón |
| DM-PED-017 | ✅ PASS | Cantidad=2 en ALFALFA BOLSA 500 GRS → badge `[color=success]`, contador; sin alerta de inventario |
| DM-PED-024 | ✅ PASS | Tab Total: Total USD 13,12 · Total BS 8.999,53 (multiCurrency ambos ≠ 0); Tasa 685,94 |
| DM-PED-026 | ✅ PASS | Basura en Tab Total borró ítem CAJA → Total Items 2→1, totales recalculados a 13,12 USD / 8.999,53 BS |
| DM-PED-029 | ✅ PASS | Form nuevo sin ítems → Guardar y Enviar deshabilitados |
| DM-PED-030 | ✅ PASS | Guardar → alert "Denario / Pedido Guardado"; comentario `Test-PED-SMOKE-091052` |
| DM-PED-031 | ✅ PASS | Enviar → "¿Desea Enviar el pedido?" → "Su Pedido será enviado" → **"Pedido nro. 50 enviado exitosamente"** → navega a `app-pedidos`. **BD-OK** |
| DM-PED-032 | ✅ PASS | Form dirty (ítem sin guardar) + atrás → modal "¡Alerta!" 3 opciones (Guardar y salir / Salir sin guardar / Cancelar) |
| DM-PED-034 | ✅ PASS | BUSCAR: searchbar "GOURMET" filtra 48→17 en tiempo real |
| DM-PED-035 | ✅ PASS | Reabrir Guardado Ref 0 → `app-pedido` editable, 4 tabs habilitadas (~2s rehidratación), Tab Pedido con 11 categorías |
| DM-PED-037 | ✅ PASS | Basura en lista sobre Ref 0 → "¿Seguro que quieres eliminar este pedido?" → Aceptar → ítem desaparece (1→0) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. 50 | Pedido ALIMENTOS GOURMET CCC (100146) · 1 línea ALFALFA BOLSA 500 GRS qty 2 · USD 13,12 / BS 8.999,53 · comentario `Test-PED-SMOKE-091052` | **Enviado** (nube id_order=50, st_order=1) |
| Ref 0 (efímero) | Pedido Guardado GOURMET creado vía "Guardar y salir" (DM-PED-032) para 035/037 | **Eliminado** en DM-PED-037 |

## Verificación BD
**DM-PED-031 (pedido enviado Nro. 50) — BD-OK**

Nube (`order`): `id_order=50` · `co_order=1783688762164.0` · `st_order=1` (Enviado) · `nu_amount_total=13.12` · `nu_amount_final=13.12` · `nu_details=1` · `det=1` · `units=1`.
Cotejo UI↔nube: cliente 100146, total USD 13,12 / conversión BS 8.999,53, 1 línea qty 2 — **todo cuadra**. Correlación **Nro.Ref UI = id_order = 50** (BD-INFO).

Payload capturado (`orderservice/order`, hook `nativePromise`) volcado a `_payloads.jsonl`: coincide 1:1 (coClient 100146, txComment Test-PED-SMOKE-091052, nuAmountTotal 13.12, orderDetail GERPROALF001BOL qty 2, nuValueLocal 685.94, conversión 8999.5328).

**Conclusión guardado→enviado:** el pedido guardado SÍ se envió y llegó a la nube (durable). ⚠ Contradice la memoria previa de hidroponias (pedido quedaba "Por Enviar" sin llegar a nube): en Isla La Tortuga v6.6.18 el envío persistió correctamente — no hubo no-persistencia esta corrida.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Tab Pedido híbrido: categorías `div.product-structure-title.listaProductos > ion-item.listaItems` + productos `ion-accordion.accordionPedidos` anidados | cliente (hidroponias La Tortuga) | Categorías NO son accordion pero los PRODUCTOS dentro SÍ son `ion-accordion.accordionPedidos` (como ferrenuestro). Header producto: click en `y=top+25` expande; `ion-input[type=number]` con height 0 colapsado. Estructura difiere de la nota `[gmp-2611]` "NO es ion-accordion" — confirma variante por build |
| Trash Tab Total SÍ recalcula con `mouse.click` | cliente (hidroponias La Tortuga) | DM-PED-026: expandir `ion-accordion` del ítem → `ion-button[color=danger]` → `mouse.click` en coords → Total Items y montos recalculan al instante. ⚠ CONTRADICE el BLOCKED de ferrenuestro (mismo build El Yaque) donde el trash no recalculaba — aquí funcionó al 1er intento |
| Envío persiste a nube en Isla La Tortuga (hidroponias v6.6.18) | cliente (hidroponias) | Pedido enviado transitó a Enviado con Ref real (id_order=50) y llegó a `order` en nube; contradice memoria `project_jerez_no_persistencia` / corridas hidroponias viejas. Actualizar supuesto de no-persistencia para hidroponias tras migración a La Tortuga |
| Alerta deuda vencida NO observada pese a `alerta_deuda_vencida=true` | cliente (hidroponias) | Al seleccionar ALIMENTOS GOURMET CCC (100146) en 2 intentos separados no apareció alerta de deuda vencida (tabs habilitaron directo). Posible: cliente sin docs vencidos en La Tortuga, o alerta fugaz. Revisar dato del YAML |

> ✅ consolidado 20260710

## Hallazgos (solo si hay FAIL)
Ninguno. 14/14 PASS.

## Notas
- Alerta de deuda vencida (`alerta_deuda_vencida=true` en YAML) no se manifestó en DM-PED-006 ni al reabrir el modal cliente en DM-PED-032. Criterio PASS de 006 (tabs habilitadas) se cumple; se marca como divergencia UI-vs-config (INFO), no FAIL.
- Toggle de categoría GERMINADOS se colapsa al cambiar de tab (comportamiento conocido) — re-expandir con click limpio en el header de categoría.
- "Guardar y salir" del dirty-guard guarda en silencio (sin alert "Pedido Guardado"), navega a `/pedidos`, deja Guardado Ref 0 verificable en BUSCAR. Confirma notas previas.
- Reabrir Guardado con ítems marca el form dirty → atrás dispara modal "¡Alerta!" (defensivo, no FAIL).

## Verificación BD (payload ↔ nube) — Agente BD (cotejo campo-a-campo)

| co_x | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|------|-------|-----------------|----------------------|-----------|-------|
| 1783688762164.0 | BD-FIELD-OK | 36/36 OK | order_detail 1/1 · order_detail_unit 1/1 | 0 | `da_order` difiere solo en hora (UTC-4→UTC), esperado |

**Conclusión:** el pedido Nro. 50 se guardó y envió íntegro a la nube — cabecera (36 campos), detalle (ALFALFA BOLSA 500 GRS, qty 2, USD 13,12 / BS 8.999,53) y unidad, 0 mismatches. Confirma persistencia OK en La Tortuga.
