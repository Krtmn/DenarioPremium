# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260713_115814_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | `14678405BR003855` (Infinix HOT 60i) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 (El Yaque DM ELECTRONIC) |
| Playa / Cliente | dm-electronica (BOTZ / "DM ELECTRONIC") |
| Cliente de prueba | `+ QUE MUEBLES UN SUENO, C.A` (co 00001) — sincronizado en device para vendedor 002 |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | `app-pedidos` con botones PEDIDO / BUSCAR / COPIAR |
| DM-PED-002 | ✅ PASS | Form `app-pedido`; tabs Pedido/Total/Adjunto `segment-button-disabled`, General habilitada, sin cliente. **Empresa (ion-select "BOTZ") SÍ presente** |
| DM-PED-006 | ✅ PASS | Cliente `+ QUE MUEBLES UN SUENO, C.A (00001)` → modal deuda vencida ("¿Desea continuar con el pedido?") → Aceptar → 4 tabs habilitadas |
| DM-PED-015 | ✅ PASS | Tab Pedido: categoría "LINEA BLANCA" (363 prod.); productos = `ion-accordion.accordionPedidos` (build refactorizado El Yaque) |
| DM-PED-017 | ✅ PASS | cantidad=2 en CONGELADOR GPLUS 100LTS SILVER → `.contadorProductos`=2, badge success; sin alert "sin inventario" |
| DM-PED-024 | ✅ PASS | Tab Total: Total Pedido US$ 316,00 (≠0). Solo US$ (multiCurrencyOrder=false pese a multiCurrency=true) — comportamiento módulo, matches insumar/jerez, NO FAIL |
| DM-PED-026 | ✅ PASS | Trash en acordeón de ítem (Tab Total) recalculó 522→316, Total Items 2→1. **Trash SÍ recalcula con `mouse.click`** (contradice ferrenuestro BLOCKED; confirma hidroponias) |
| DM-PED-029 | ✅ PASS | Cliente seleccionado sin ítems → `.imagenGuardar` y `.imagenEnviar` deshabilitados |
| DM-PED-030 | ✅ PASS | Guardar → alert "Denario / Pedido Guardado"; pedido Ref 0 Estatus Guardado en BUSCAR; comentario `Test-PED-SMOKE-122426` |
| DM-PED-031 | ✅ PASS | Enviar → "¿Desea Enviar el pedido?" → "Su Pedido será enviado" → **"Pedido nro. 4 enviado exitosamente"**; navega a `app-pedidos`. BD-OK (ver §BD) |
| DM-PED-032 | ✅ PASS | Form dirty (1 ítem) + atrás (`img.fechaAtras`+`mouse.click` real) → modal "¡Alerta!" 3 opciones (Guardar y salir / Salir sin guardar / Cancelar). 1er intento |
| DM-PED-034 | ✅ PASS | BUSCAR: searchbar filtra realtime — "ZZZNOMATCH"→0, "SUENO"→1, limpiar→1 restaurado |
| DM-PED-035 | ✅ PASS | Reabrir pedido Guardado Ref 0 → form 4 tabs editables (habilitan ~2s post-reapertura); ítem, total 316,00 y comentario preservados (round-trip §9) |
| DM-PED-037 | ✅ PASS | Trash en lista (Ref 0 Guardado) → "¿Seguro que quieres eliminar este pedido?" → Aceptar → pedido desaparece (queda solo Ref 4 Enviado) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Pedido Nro. **4** (id_order=4, co_order 1783959545012.0) | Cliente `+ QUE MUEBLES UN SUENO, C.A` (00001); 1 línea CONGELADOR GPLUS 100LTS SILVER (0001035) x2; Total US$ 316,00; comentario `Test-PED-SMOKE-122426` | **Enviado (BD-OK)** |
| Pedido Ref 0 (Guardado, vía "Guardar y salir" en DM-PED-032) | 1 ítem CONGELADOR 100LTS | Creado y luego **eliminado** en DM-PED-037 |

## Verificación BD (round-trip al servidor · RUNTIME §10)
- **Nube (`order`):** baseline max id_order=3 → tras Enviar: `id_order=4`, `st_order=1` (Enviado — El Yaque/Isla Coche usan 1=Enviado, cf. ferrenuestro/piercar), `nu_amount_total=316.00`, `nu_amount_final=316.00`, `nu_details=1`, `order_detail`=1, `order_detail_unit`=1 (`qu_order=2`). Cuadra 1:1 con Tab Total UI. → **BD-OK**
- **Correlación Ref↔fila:** "Pedido nro. 4" (UI) = `id_order=4` (PK servidor). → **BD-INFO** confirmado.
- **Payload capturado** (`orderservice/order`, volcado a `_payloads.jsonl`): cabecera + `orderDetails[1]` + `orderDetailUnit[1]` (`quOrder:2`, `coProduct:0001035`), `txComment:"Test-PED-SMOKE-122426"`, `coEnterprise:"BARAK_A"`/`idEnterprise:1`, `stOrder:1`, `coCurrency:"US$"`. Cotejo "lo guardado = lo enviado" ✅.
- **Local (SQLite):** `sqlite3` no disponible en el device (`run-as: exec failed for sqlite3`) → cotejo local **BD-N/A** (blindaje §10; no tumba el smoke). Verificación cubierta por nube + payload.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| dm-electronica usa **build refactorizado El Yaque** en Tab Pedido | cliente | Productos = `ion-accordion.product-structure-title.accordionPedidos` dentro de categoría `ion-item.listaItems`; input cantidad `ion-input[type=number]` height=0 colapsado, >0 al expandir. Estructura ion-accordion (como ferrenuestro/hidroponias), NO `div.listaProductos` |
| **Trash Tab Total SÍ recalcula con `mouse.click`** en dm-electronica | cliente | Contradice ferrenuestro (mismo build, BLOCKED) y confirma hidroponias v6.6.18: DM-PED-026 recalculó 522→316. La divergencia ferrenuestro parece específica de ese device/estado, no del build |
| **Selector Empresa (ion-select "BOTZ") SÍ aparece en Pedidos** | cliente | Pese a `orderEnterpriseEnabled` (override 2022)=false, el form de pedido expone Empresa y el payload lleva `idEnterprise:1`/`coEnterprise:"BARAK_A"`. Manda `enterpriseEnabled=true` de la UI (igual que en clientes). Actualizar YAML |
| **alerta_deuda_vencida=true** para `+ QUE MUEBLES UN SUENO, C.A` | cliente | Al seleccionar el cliente dispara modal "Pedidos / Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" (Cancelar/Aceptar). Confirmar en YAML `modules.pedidos.alerta_deuda_vencida` |
| **"Pedido Sugerido" NO aparece en Tab Pedido** pese a `suggestedOrder=true` | cliente | Misma divergencia UI-vs-config que jerez/ferrenuestro (`suggestedOrderByDispatchAndReturn=false`). No es FAIL |
| Tab Total solo US$ pese a `multiCurrency=true` | cliente | `multiCurrencyOrder`=false para pedidos (aplica solo a cobros). Consistente con insumar/jerez |
| Cliente de prueba: MAR-CHAZ (00091) NO sirve; usar MUEBLES (00001) | cliente | MAR-CHAZ no sincroniza para vendedor 002. MUEBLES (00001) sí, con catálogo LINEA BLANCA cargado. Actualizar `modules.pedidos.cliente_test` |

> ✅ consolidado 20260713 — ion-accordion y trash-recalcula reconfirmados (tags en pedidos.md; trash confirmado 2ª corrida); cliente_test/estructura/deuda_vencida → YAML; suggestedOrder/Tab Total US$ → nota universal.

## Hallazgos (solo si hay FAIL)
Ninguno — 14/14 PASS.

## Verificación BD (payload ↔ nube)

**Conteo por marca:** BD-FIELD-OK ×1 · BD-FIELD-MISMATCH ×0 · BD-SAVED ×0 · BD-N/A ×0

| co_x | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| `1783959545012.0` | **BD-FIELD-OK** | 37/37 OK | order_detail 1/1 · order_detail_unit 1/1 | 0 | 2 (zona horaria en da_order y da_dispatch) |

**Detalle:** cabecera order 37 campos OK (co_client 00001, montos 316 / conv 216757.04, tx_comment Test-PED-SMOKE-122426, empresa BARAK_A). Hija order_detail (0001035 CONGELADOR GPLUS 100LTS) 21 campos OK. Nieta order_detail_unit 12 campos OK (qu_order 2). Renames del motor: coAddress→co_address_client, idAddress→id_address_client. Notas TZ (da_order/da_dispatch UTC-4↔UTC), veredicto por día = igual. Sin mismatches ni registros atascados.
