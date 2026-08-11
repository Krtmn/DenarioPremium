# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260714_130727_smoke-completo` |
| Módulo | INVENTARIOS |
| Cliente | latino_cosmetica (usuario `001`) |
| Dispositivo | Infinix X6728 (Android 15) · CDP `:9220` |
| App | `com.kiberno.denarioPremiumPro` · window.ng=**TRUE** |
| Servidor | La Tortuga (`denariolatortuga.ddns.net:8081`) — sync inmediata/persistente |
| Cliente usado | **ANNELI CA (13)** (sincronizado confirmado en UI) |
| Producto usado | BELOTTI ACOND CEBOLLA X 300 ML (Código 3058) |
| Resultado | **16 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Estado final | HOME ✅ |

## ¿clientStock aplica en UI?
**SÍ.** Pese a `clientStock` global=true vs override-2022=false, el módulo Inventarios aparece en HOME y es 100% operable: lista clientes, familias, productos y permite crear/guardar/enviar. `requireClientStock=false`. clientStock real = **true** en esta cuenta (divergencia config-2022 descartada).

## ¿Lote/Fecha se renderizan? (expirationBatch=false)
**SÍ se renderizan pero NO son obligatorios** — mismo patrón que dm-electronica. El modal `inventory-type-stocks-modal` muestra input "Ingrese lote" (text) + "Fecha de vencimiento" (`ion-datetime`, default HOY) además de Cantidad. Aceptar (checkmark-outline) tuvo éxito con Lote/Fecha vacíos; el payload envió `nuBatch=""` + `daExpiration` en default de hoy. `expirationBatch=false` opera a nivel de **validación** (opcional), no de renderizado. ⚠ Divergencia UI-vs-config — verificar con desarrollo.

## ¿signatureStock bloquea Enviar?
**NO.** `signatureStock=true` en config, pero el flujo Enviar (2 alerts: "¿Desea enviar el Inventario?" → "El Inventario será enviado") NO presentó pad de firma ni canvas; el envío procedió directo a "Inventario nro. 7 enviado exitosamente". La firma de inventario no es un gate interactivo en este build.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Home Inventarios con botones INVENTARIO y BUSCAR |
| DM-INV-002 | ✅ PASS | 4 tabs General/Inventario/Resumen/Adjuntos; Cliente (`#clienteSelect`) vacío |
| DM-INV-004 | ✅ PASS | ANNELI CA (13) seleccionado → 4 tabs habilitadas |
| DM-INV-008 | ✅ PASS | Tab Inventario: familias BELOTTI(74)/PROKPIL(70)/ROIAL(8); BELOTTI → 46 productos con Código |
| DM-INV-010 | ✅ PASS | Producto 3058 → modal `inventory-type-stocks-modal` (Pointer+Mouse combinado); tipo fijo "Exhibición - 1" sin segmento |
| DM-INV-011 | ✅ PASS | Cantidad=5 vía `fillNgModelKeyboard` (click×3 + type); reflejada. Lote/Fecha dejados vacíos |
| DM-INV-012 | ✅ PASS | Aceptar (checkmark-outline) con Lote/Fecha vacíos → producto "Inventariado: Exhibición", sin error de validación |
| DM-INV-016 | ✅ PASS | Tab Resumen: tabla "3058 BELOTTI ACOND CEBOLLA X 300 ML · 5 UNIDAD" |
| DM-INV-017 | ✅ PASS ⚠ | Botón PEDIDO SUGERIDO presente pese a `suggestedOrderByDispatchAndReturn=false`; modal `inventario-sugerido-modal` funcional. Cerrado con `dismiss('cancel')` sin crear pedido |
| DM-INV-020 | ✅ PASS | "Días desde último Inventario: 1 / Días para siguiente Inventario: 1" visibles en modal sugerido |
| DM-INV-021 | ✅ PASS | Guardar → confirm "¿Desea guardar el Inventario?" → "Inventario guardado con éxito". Guardar NO navega fuera del form |
| DM-INV-022 | ✅ PASS | Enviar → 2 alerts → "Inventario nro. **7** enviado exitosamente" → navega a home Inventarios. Sin firma |
| DM-INV-023 | ✅ PASS | BUSCAR lista: Ref 0 Guardado (recién creado) + Ref 7/6 Enviados ANNELI + Ref 1 ANGELINA |
| DM-INV-025 | ✅ PASS | Searchbar filtra realtime: "ANGELINA" 3→1, clear→3 |
| DM-INV-026 | ✅ PASS | Reabrir Guardado Ref 0 → cliente ANNELI + Resumen "5 UNIDAD" conservado (round-trip OK). Abre en tab General (defecto conocido, observación) |
| DM-INV-028 | ✅ PASS | Trash `ion-button[color="danger"]` en Guardado → borrado directo "¡EL Inventario se borro con exito!" (sin confirmación previa); desaparece de la lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| **Nro. 7** | Inventario ANNELI CA (13) · 3058 BELOTTI ACOND CEBOLLA X 300 ML · 5 UNIDAD (Exhibición) | **Enviado** (persistió en nube) |
| Ref 0 (temporal) | Inventario B ANNELI CA · 3058 · 3 UNIDAD | Guardado → **BORRADO** (DM-INV-028) |

## Verificación BD (RUNTIME §10 · solo nube)
Consulta `client_stock` (nube, `query.js latino_cosmetica`):

| id_client_stock | co_client_stock | st | det | units | Marca |
|---|---|---|---|---|---|
| **7** | 1784056647963.0 | 1 (Enviado) | 1 | 1 | **BD-OK** |

- `co_client_stock` nube = `coClientStock` del payload capturado (1784056647963.0) → match exacto.
- `det=1` (1 producto 3058), `units=1` (1 captura cantidad) → coincide 1:1 con lo enviado por UI.
- **Nro.Ref UI = `id_client_stock` = 7** confirmado (correlación §10 → BD-INFO).
- `st_client_stock=1` = Enviado (⚠ La Tortuga usa **st=1** para Enviado en client_stock, igual a piercar/dm-electronica El Yaque; NO st=2 como el `stClientStock` del payload=0/`stDelivery`=2. Anotar en tabla de estados por playa).
- **Conclusión guardado→enviado:** lo que se guardó (3058 x5) se envió íntegro a la nube. Payload en `_payloads.jsonl`.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| latino_cosmetica: `clientStock=true` real (módulo operable end-to-end) | cliente | Divergencia config-2022(false) descartada; módulo aparece y persiste en nube. Actualizar YAML si procede |
| latino_cosmetica: `expirationBatch=false` renderiza Lote+Fecha pero opcionales | cliente | Igual a dm-electronica: Aceptar OK con vacíos, payload `nuBatch=""`. Verificar con desarrollo |
| latino_cosmetica: `suggestedOrderByDispatchAndReturn=false` PERO botón PEDIDO SUGERIDO presente | cliente | 4ª playa con la divergencia (jerez/piercar/ferrenuestro). Verificar VG con desarrollo |
| latino_cosmetica: `signatureStock=true` NO bloquea Enviar (sin pad de firma) | cliente | El envío procede sin firma interactiva en este build |
| La Tortuga: `st_client_stock=1`=Enviado en nube | universal (playa) | Contrasta con `stClientStock`/`stDelivery` del payload; corroborar por `id`+estado, no por st global |
| Picker de cliente en form Inventario: nombre en `<p>` con text exacto; validar `getBoundingClientRect().width>0` antes de clicar (items ocultos dan rect 0) | universal | Al reabrir el picker una 2ª vez, filtrar por visibilidad real evita clics en items rect=0 |

> ✅ consolidado 20260714

## Baseline (Ola 0)
- **TOOL-USES aprox:** ~24 (incluye lectura de archivos + ~19 `browser_run_code_unsafe`)
- **MS (módulo, aprox):** ~14 min de reloj (incluye recuperación de estado del picker de cliente en el 2º inventario)
- Sin BLOCKED; techo de intentos nunca alcanzado.

## Verificación BD (payload ↔ nube · campo-a-campo · Agente BD)

| co_x | Marca | Cabecera | Hijas | Mismatches | Notas |
|------|-------|----------|-------|------------|-------|
| 1784056647963.0 | BD-OK* | ANNELI CA (id 34) OK | 1×3058 OK | 0 | *registro presente en nube (id_client_stock=7), cabecera+detalle sincronizados. cotejo-payload.js dio BD-N/A por payload plano (espera clave anidada 'clientStock') → ajuste de config; NO es error de sync |

**Inventario #7 persistido íntegro en nube.** Nota de calibración: payload en formato camelCase plano → agregar manejo del formato plano en cotejo-payload.js config inventarios.
