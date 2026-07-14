# Smoke Test — Módulo VISITAS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_100801_smoke-completo` |
| Módulo | VISITAS |
| Dispositivo | CDP `:9220` (WebView) |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | jerez |
| Cliente test | DANIELA HERNANDEZ F.P. (V161051485, emp 1) |
| Actividad usada | EVENTOS (idType 86) → Motivo SUPERVISION DE EVENTOS (idMotive 213) |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED |
| Cotejo BD | OMITIDO en esta corrida (por instrucción) |
| Estado final | HOME ✅ |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | /visitas · título "Visitas" + 3 botones (NUEVA VISITA, RUTA DE HOY, Ver mejor ruta) |
| DM-VIS-003 | ✅ PASS | NUEVA VISITA → /visita; tab GENERAL activa, ACTIVIDADES/ADJUNTOS disabled; cliente vacío |
| DM-VIS-004 | ✅ PASS | RUTA DE HOY → /listaVisitas; searchbar visible, lista vacía sin error (overlay se disipa) |
| DM-VIS-006 | ✅ PASS | Trash en visita Guardada → "¿Desea borrar la visita?…" Aceptar → "Se eliminó la visita de manera exitosa"; fila desaparece |
| DM-VIS-010 | ✅ PASS | Cliente DANIELA HERNANDEZ F.P. seleccionado → 3 tabs habilitadas; alert "sucursal sin coordenadas" descartado con 1er botón |
| DM-VIS-014 | ✅ PASS | AÑADIR ACTIVIDAD/EVENTO → modal "Agregar" con selects Actividad/Motivo, campo comentario, CANCELAR/Agregar |
| DM-VIS-015 | ✅ PASS | EVENTOS + SUPERVISION DE EVENTOS + comentario → "Actividad: EVENTOS · Evento: SUPERVISION DE EVENTOS · Observación:…" en Tab Actividades |
| DM-VIS-019 | ✅ PASS | Guardar (header) → alert "La visita se ha guardado"; formulario permanece abierto |
| DM-VIS-020 | ✅ PASS | Enviar → 2 alertas (¿Desea enviar? Aceptar → confirmación) → navega /visitas; visita sincroniza como Ref 19 Estatus "Visitado" |
| DM-VIS-021 | ✅ PASS | Atrás con cambios sin guardar → dirty-guard "¡Alerta!" con 3 botones (Guardar y salir / Salir sin guardar / Cancelar) |
| DM-VIS-022 | ✅ PASS | Visita nueva nunca guardada → "Salir sin guardar" → NO aparece en RUTA DE HOY (lista sigue en 2 ítems) |
| DM-VIS-023 | ✅ PASS | Visita Guardada reabierta desde RUTA DE HOY → formulario editable; 3 tabs; Guardar/Enviar activos; evento conservado |
| DM-VIS-025 | 🚫 N/A | Sin visitas "No Visitado" sincronizadas desde backend hoy (RUTA DE HOY solo trae lo creado en la sesión) |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 (N/A) |
| DM-VIS-031 | ✅ PASS | "Guardar y salir" con evento → visita en RUTA DE HOY Estatus "Guardado"; al reabrir Tab Actividades conserva el evento |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos: 3 acordeones — Imágenes + Archivo (userCanUploadFiles) + Firma (signatureVisit) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro Ref. 19 | Visita DANIELA HERNANDEZ F.P. (V161051485) · 1 evento EVENTOS/SUPERVISION DE EVENTOS | ✅ Enviada — "Visitado" (sincronizada a nube) |
| Nro Ref. 0 | Visita DANIELA HERNANDEZ F.P. · 1 evento (DM-VIS-031, "Guardar y salir") | Guardada local → **ELIMINADA** en DM-VIS-006 |
| (nueva, sin ref) | Visita DANIELA HERNANDEZ F.P. · 1 evento | Descartada con "Salir sin guardar" (DM-VIS-022) — no persistió (correcto) |

**Visitas Guardadas pendientes al cierre:** ninguna (la única Guardada fue eliminada en DM-VIS-006). Enviadas: 1 (Ref 19).

## Round-trip §9 (UI→UI)
- Enviada Ref 19: reaparece en RUTA DE HOY con Ref real y Estatus "Visitado" → confirma sincronización de visitas a nube.
- Guardada Ref 0: reabierta desde RUTA DE HOY conserva cliente, tabs y el evento EVENTOS/SUPERVISION DE EVENTOS con su comentario → sin divergencia (PASS).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Back `img.fechaAtras` responde SOLO a `element.click()` nativo, NO a `pg.mouse.click` ni `dispatchEvent(MouseEvent)` | universal (confirmar) | En jerez el handler (click) del back no engancha con eventos sintéticos; `img.click()` navega |
| Con páginas apiladas (2 `ion-page` visibles) el handler (click) del back está sobre el **`img`** mismo, no sobre el `<a>` padre | universal (confirmar) | `img.closest('a').click()` falla; `img.click()` sí navega. El `<a>` no tiene href/routerLink |
| `#clienteSelect` (abrir modal cliente) más fiable con `.click()` nativo que con `pg.mouse.click` | cliente jerez / universal (confirmar) | mouse.click a veces no abre el modal; native click sí |
| jerez: DANIELA HERNANDEZ F.P. (V161051485) SÍ dispara alert "sucursal sin coordenadas" | cliente jerez | Al seleccionar y en CADA Back (se re-encola); en Back el alert de coordenadas precede al dirty-guard; descartar con 1er botón ("") no bloquea |
| jerez: 11 actividades TODAS `requiredEvent="true"` (idTypes 2,47,71,75,82-88); EVENTOS (86) → 1 motivo SUPERVISION DE EVENTOS (idMotive 213) | cliente jerez | Igual estructura que insumar/piercar/don-theo (11 actividades) |
| jerez: envío = 2 alertas ("¡Alerta!" ¿Desea enviar? CANCELAR/Aceptar → "Denario Visitas" OK) → /visitas; visita sincroniza a nube con Ref real y "Visitado" | cliente jerez | Confirma que visitas SÍ sincronizan (a diferencia de cliente potencial/pedido que quedan "Por Enviar") |
| RUTA DE HOY vacía al inicio de sesión → DM-VIS-025/026 N/A estructural | cliente jerez | No hay visitas "No Visitado" sincronizadas hoy |

> ✅ consolidado 2026-07-06

## Hallazgos (FAIL)
Ninguno. 0 FAIL.

### Defecto conocido observado (no FAIL)
- DM-VIS-020: la app permite el flujo de Enviar (modal de confirmación) — comportamiento UX conocido (RUNTIME §5); no bloquea y se envió con ≥1 evento, PASS.
