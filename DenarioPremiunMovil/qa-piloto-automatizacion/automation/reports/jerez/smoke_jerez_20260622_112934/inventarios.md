# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260622_112934_smoke-completo` |
| Módulo | INVENTARIOS |
| Cliente / Playa | jerez |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v6.6.17 |
| Empresa | 1 — INVERSIONES JEREZ MOTORS (`idEnterprise:1`, moneda default USD) |
| cliente_test usado | DANIELA HERNANDEZ F.P. (V161051485) y JL Motors SE,C.A (J-506554950) |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 2 N/A |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Home Inventarios con botones INVENTARIO y BUSCAR |
| DM-INV-002 | ✅ PASS | Form con 4 tabs (General activo; Inventario/Resumen/Adjuntos disabled); Cliente vacío |
| DM-INV-004 | ✅ PASS | Cliente "DANIELA HERNANDEZ F.P. (V161051485)" → 4 tabs habilitadas |
| DM-INV-008 | ✅ PASS | Tab Inventario lista familias con productos: Accesorios MJ 179, Carbones 136, HJ-Forza 71, Otras marcas 102, Plasticos 1, Repuestos Jerez 207, Repuestos de Motos 4041, XCORT 31 |
| DM-INV-010 | ✅ PASS | Click producto PLAN-001 → modal `inventory-type-stocks-modal` con Cantidad/Lote/Fecha venc |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard`: Cantidad=5, Lote=LOTE-QA; Fecha venc default "22 jun 2026". Valores reflejados |
| DM-INV-012 | ✅ PASS | checkmark-outline → modal cierra sin error; producto marcado "Inventariado" |
| DM-INV-016 | ✅ PASS | Tab Resumen: fila PLAN-001 / Agro silotubo… / 5 PIEZA (Exhibición) |
| DM-INV-017 | 🚫 N/A | VG `suggestedOrderByDispatchAndReturn=false`. El botón "Pedido Sugerido" (`botonAddAmarillo`) SÍ aparece, pero lo gobierna `suggestedOrder`, no la variante (mismo matiz que central_foods). No se clickeó (su Aceptar genera un PEDIDO real) |
| DM-INV-020 | 🚫 N/A | Sin campo "días para siguiente inventario" — `quUnitSuggested=0` (cliente nuevo, sin historial) |
| DM-INV-021 | ✅ PASS | Guardar → confirm "¿Desea guardar el Inventario?" (CANCELAR/ACEPTAR) → "Inventario guardado con éxito" (OK) |
| DM-INV-022 | ✅ PASS | Enviar → confirm "¿Desea enviar el Inventario?" (ACEPTAR) → "El Inventario será enviado" (OK); navega a home inventarios. Ref 0→6 |
| DM-INV-023 | ✅ PASS | BUSCAR lista 6 inventarios con Nro.Ref/Cliente/Estatus/Fecha; el enviado = Nro.Ref:6 DANIELA HERNANDEZ Enviado 22/06/2026 |
| DM-INV-025 | ✅ PASS | Searchbar "JL" filtra realtime 6→2 (ambos JL Motors) |
| DM-INV-026 | ✅ PASS | Reabre Guardado (JL Motors, Ref:0); form accesible con 4 tabs y cliente cargado. **Defecto conocido reproducido:** abre en tab General (`default`) en vez de Inventario (observación, no FAIL). Persistencia OK: Resumen muestra 3 PIEZA |
| DM-INV-028 | ✅ PASS | Trash en Guardado → borrado directo sin confirm → "¡EL Inventario se borro con exito!" (OK); lista 7→6, item desaparece |

## Verificación de VGs (vs UI)

| VG esperada | Observado | Estado |
|-------------|-----------|--------|
| `clientStock=true` (módulo toma de inventario habilitado) | Módulo INVENTARIO + selección de cliente con inventario funcionan | ✅ confirmado |
| `requireClientStock=false` | Cliente se selecciona libremente; no exige stock previo | ✅ consistente |
| `expirationBatch=true` (Lote + Fecha venc obligatorios) | Modal muestra Cantidad + Lote + Fecha de vencimiento (datetime-button con default HOY) | ✅ confirmado |
| `signatureStock=true` (Tab Adjuntos/Firma) | No verificado en detalle — Tab Adjuntos existe; acordeón Firma no inspeccionado a fondo en esta corrida | ⚠ pendiente confirmación visual de Firma |
| `suggestedOrderByDispatchAndReturn=false` | Botón Pedido Sugerido aparece (gobernado por `suggestedOrder`, no la variante) | ✅ consistente con matiz central_foods |

## Registros creados en sistema

| Ref | Cliente | Detalle | Estado |
|-----|---------|---------|--------|
| Nro.Ref:6 | DANIELA HERNANDEZ F.P. (V161051485) | PLAN-001 Agro Silotubo Flex-Silon, 5 PIEZA, Lote LOTE-QA, venc 22/06/2026 (Exhibición) | Enviado (correlativo 6 al sincronizar) |
| Nro.Ref:0 | JL Motors SE,C.A (J-506554950) | PLAN-001, 3 PIEZA, Lote LOTE-JL (Exhibición) | Guardado → **borrado en DM-INV-028** (no persiste) |

## Datos descubiertos (cliente nuevo jerez, 1ª corrida)

- **Empresa default:** `idEnterprise:1` = **INVERSIONES JEREZ MOTORS** (coEnterprise `00001`, `coCurrencyDefault:"USD"`, `enterpriseDefault:true`). ⚠ El prompt indicaba empresa 1 = "JL Motors SE,C.A"; en realidad JL Motors es un **cliente** de la empresa 1, no la empresa.
- **Clientes de empresa 1 con inventario (toma de inventario):** DANIELA HERNANDEZ F.P. (V161051485), Inversiones J.L Moto Piezas C.A (J-50163353-3), JL Motors SE,C.A (J-506554950). Los 3 habilitan las 4 tabs y muestran catálogo. No hubo selector de empresa separado en el form (empresa preseleccionada).
- **cliente_test recomendado:** DANIELA HERNANDEZ F.P. (usado, flujo completo PASS).
- **Producto con Lote/Fecha (expirationBatch):** PLAN-001 "Agro Silotubo Flex-Silon Extra PB 8P*50C" (familia Plasticos, 1 producto — el más simple para captura). Modal pide Cantidad + Lote + Fecha venc; Fecha venc trae default HOY ("22 jun 2026").
- **Catálogo:** componente estilo `productos-tab` (ion-label categorías, sin ion-accordion), igual que central_foods. Familias: Accesorios MJ (179), Carbones (136), HJ-Forza (71), Otras marcas (102), Plasticos (1), Repuestos Jerez (207), Repuestos de Motos (4041), XCORT (31). Sub-tabs Favoritos/Destacados; segmento "Ubicación del inventario" Exhibición/Depósito; filtro Todos/Inventariados.
- **Alerts jerez:** confirm de Guardar/Enviar usan **ACEPTAR**; alerts de éxito y de borrado usan **OK** (confirma nota del prompt para los OK).
- **Flujos de alertas:** Guardar = confirm(ACEPTAR) + éxito(OK). Enviar = confirm(ACEPTAR) + "será enviado"(OK), 2 alertas (igual que central_foods). Borrado Guardado = directo sin confirm + éxito(OK).

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Botón BUSCAR del home Inventarios requiere combo Pointer+Mouse | universal (refuerza patrón existente) | `mouse.click` solo NO navega; secuencia `pointerdown/mousedown/pointerup/mouseup/click` (5 eventos) sobre el `ion-button` exacto + `mouse.click` sí abre la lista. Mismo principio que el trash del Guardado. `[jerez-2622]` |
| Trash de Guardado en lista BUSCAR requiere combo Pointer+Mouse | cliente jerez (consistente con patrón global) | `mouse.click` simple intermitente; combo de 5 eventos + `mouse.click` dispara el borrado |
| Reabrir Guardado y luego `clickBack` salta directo a HOME (no a la lista) | cliente jerez | tras reabrir un Guardado desde BUSCAR, el back navega más allá de la lista; re-entrar a BUSCAR con el combo recupera la lista |
| Empresa jerez = INVERSIONES JEREZ MOTORS preseleccionada (sin selector visible en form inventario) | cliente jerez | `idEnterprise:1`, USD default |

> ✅ consolidado 2026-06-22

## Hallazgos (FAIL)

Ninguno. 0 FAIL. Único defecto observado = DM-INV-026 abre en tab General (defecto conocido, no re-marcado FAIL).

## Notas de infraestructura

- Al inicio el endpoint CDP `127.0.0.1:9220` daba "socket hang up": el `adb forward` apuntaba a un `webview_devtools_remote_21036` (PID muerto). El WebView vivo era `webview_devtools_remote_28411`. Se re-apuntó el forward (`adb forward --remove tcp:9220` + `adb forward tcp:9220 localabstract:webview_devtools_remote_28411`). Tras eso la conexión funcionó. No se usó `adb shell input` (prohibido); solo `adb forward`.
