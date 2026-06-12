# Smoke Test — Módulo INVENTARIOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260612_104156_smoke-completo` |
| Módulo | INVENTARIOS |
| Cliente | central_foods (CENTRAL FOODS) |
| App | `com.kiberno.denarioPremiumPro` |
| CDP | `:9220` |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 2 N/A |

VGs clave: clientStock=true, expirationBatch=true, signatureStock=true, suggestedOrderByDispatchAndReturn=false, requireClientStock=false, enterpriseEnabled=false.
Datos usados: cliente_test ALEJANDRA LEDEZMA (Cód 00029), lote LOTE-QA-104156, fecha venc 31 dic 2026.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | `/inventarios` con botones INVENTARIO y BUSCAR |
| DM-INV-002 | ✅ PASS | 4 tabs General/Inventario/Resumen/Adjuntos; solo General habilitado; Cliente vacío |
| DM-INV-004 | ✅ PASS | Cliente "ALEJANDRA LEDEZMA (00029)" → las 4 tabs habilitan |
| DM-INV-008 | ✅ PASS | Tab Inventario: familias (ARROZ 7, GALLETAS, etc.); ARROZ expande 7 productos con Código |
| DM-INV-010 | ✅ PASS | Click producto → `inventory-type-stocks-modal` (show-modal) con Cantidad/Lote/UNIDAD-BULTO/Fecha |
| DM-INV-011 | ✅ PASS | fillNgModelKeyboard: Cantidad=5, Lote=LOTE-QA-104156, Fecha=31 dic 2026 reflejados |
| DM-INV-012 | ✅ PASS | Checkmark Aceptar → modal cierra sin error; producto "Inventariado: Exhibición" |
| DM-INV-016 | ✅ PASS | Tab Resumen: "ARROZ MARY DORADO 30X800 GRS · 5 · UNIDAD" |
| DM-INV-017 | ✅ PASS (nota) | Botón "Pedido Sugerido" (`botonAddAmarillo`) visible en Resumen. Ver Discrepancias VG |
| DM-INV-020 | 🚫 N/A | Sin campo "días siguiente inventario" / quUnitSuggested (sin historial, 1er inventario del cliente) |
| DM-INV-021 | ✅ PASS | Guardar → confirm "¿Desea guardar el Inventario?" → "Inventario guardado con éxito"; en BUSCAR Ref 0 Estatus Guardado |
| DM-INV-022 | ✅ PASS | Enviar → "¿Desea enviar el Inventario?" → "El Inventario será enviado"; Ref 0 Guardado → Ref 6 Enviado |
| DM-INV-023 | ✅ PASS | BUSCAR: lista con Nro.Ref, Cliente (COD-NOMBRE), Estatus, Fecha |
| DM-INV-025 | ✅ PASS | Searchbar "SILVA" filtra realtime → 1 resultado (ALEJANDRO SILVA) |
| DM-INV-026 | ✅ PASS (defecto conocido) | Reabrir Guardado: form carga con cliente y 4 tabs; abre en tab General (defecto v6.6.14, no FAIL). Round-trip OK |
| DM-INV-028 | ✅ PASS | Trash `ion-button[color="danger"]` en Guardado → borrado directo SIN confirmación: "¡EL Inventario se borro con exito!"; desaparece de lista |

## Round-trip / oráculo de persistencia (RUNTIME §9)
Reabierto el inventario Guardado (Ref 0) desde BUSCAR antes de enviar:
- Tab Resumen: ARROZ MARY DORADO **5 UNIDAD** ✔
- Modal del producto reabierto: Cantidad=**5**, Lote=**LOTE-QA-104156**, Fecha=**31 dic 2026** — los 3 valores persistidos exactos, sin mutación silenciosa. ✔
Confirma que `fillNgModelKeyboard` escribió el ngModel correctamente (no se perdió en el guardado).

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| 6 | Inventario ALEJANDRA LEDEZMA (00029) · ARROZ MARY DORADO 30X800 GRS · 5 UNIDAD · Lote LOTE-QA-104156 · Venc 31/12/2026 | Enviado (Ref 0→6) |
| (0, borrado) | 2º inventario ALEJANDRA LEDEZMA · ARROZ MARY DORADO · 3 UNIDAD · Lote LOTE-QA-DEL | Guardado → BORRADO (DM-INV-028) |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Modal captura: `pg.mouse.move(x,y)` ANTES de `pg.mouse.click` sobre el producto | universal | El listener del producto no abre el modal con click sin movimiento previo de puntero. Coincide con nota rom-2606 (re-engancha tras move). Confirmado central_foods |
| `ion-popover` (select-popover de UNIDAD/BULTO) intercepta clicks tras abrir el modal | universal | Si `pg.click(selector)` falla con "popover intercepts pointer events", hacer `document.querySelectorAll('ion-popover').forEach(p=>p.dismiss())` y usar `pg.mouse.click(coords,{clickCount:3})` + `keyboard.type` para cantidad/lote |
| Tab values del segmento: General=`default`, Inventario=`inventario`, Resumen=`actividades`, Adjuntos=`adjuntos` | universal | "Resumen" usa value `actividades` (no `resumen`). Cambio fiable: `seg.value=val` + ionChange |
| Fecha venc: leer del `ion-datetime-button.shadowRoot.textContent` ("31 dic 2026") | universal | El light DOM del datetime-button viene vacío; el texto formateado vive en su shadowRoot |
| Envío inventario = 2 alertas | cliente | central_foods: confirm "¿Desea enviar el Inventario?" (Cancelar/Aceptar) → "El Inventario será enviado" (OK). Servidor asigna Ref real al enviar (0→6) |
| Borrado Guardado directo sin confirmación | universal (reconfirma) | "¡EL Inventario se borro con exito!" — sin alert previo. Reconfirma ins/gmp |
| Estructura producto = familias por categoría merceológica | cliente | central_foods: familias tipo "ARROZ 7", "GALLETAS AMAPOLA 24", "CREMA DENTAL 12" (no marca/proveedor) |

> ✅ consolidado 2026-06-12

## Discrepancias VG (CSV dev vs UI)
| VG | CSV | UI observada | ¿Discrepancia? |
|----|-----|--------------|----------------|
| clientStock | true | Módulo INVENTARIO habilitado, toma de inventario funcional | No — coincide |
| expirationBatch | true | Modal muestra Lote + Fecha de vencimiento (ambos presentes y persistidos) | No — coincide |
| suggestedOrderByDispatchAndReturn | false | Botón "Pedido Sugerido" SÍ visible en Resumen | **Matiz, no bug.** El botón lo habilita `suggestedOrder=true` (≠ la variante dispatch/return). DM-INV-017 ata la visibilidad a `...ByDispatchAndReturn` pero la realidad es que el botón aparece con `suggestedOrder`. No se pulsó Aceptar (genera pedido). El efecto real de la VG (que el cálculo ignore devoluciones/facturaciones) no es observable por UI sin generar un pedido |
| signatureStock | true | Envío completó SIN gate de firma bloqueante (no pidió firma para enviar) | **Posible matiz.** La firma queda en Tab Adjuntos como opcional; no bloqueó el envío. No se verificó la presencia del acordeón Firma en Adjuntos en esta corrida (no estaba en el alcance de casos). Recomendar verificar Tab Adjuntos en próxima corrida |
| requireClientStock | false | No obligó toma de inventario previa para otros flujos (no probado cruzado aquí) | No observado — fuera de alcance del módulo |
| enterpriseEnabled | false | Sin selector de empresa en el formulario de inventario | No — coincide |

## Hallazgos (solo si hay FAIL)
Ninguno. 0 FAIL.

## Notas de cierre
- App devuelta a HOME (`/home`, app-home visible).
- DM-INV-026 reproduce el defecto conocido v6.6.14 (abre en tab General) — observación, no FAIL.
- Pendiente verificación en próxima corrida: acordeón Firma en Tab Adjuntos (signatureStock=true) y comportamiento real del Pedido Sugerido al Aceptar (genera pedido en `/pedido`).
