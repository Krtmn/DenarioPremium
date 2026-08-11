# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260619_173652_smoke-completo` |
| Módulo | VISITAS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa | insumar (INSUMAR DISTRIBUIDOR) |
| Cliente test | ADRIAN ARLET BASTARDO ALONZO (Cód 2738) |
| Estado inicial / final | HOME / HOME ✅ |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 2 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | `/visitas` con título "Visitas" + 3 botones: NUEVA VISITA, RUTA DE HOY, VER MEJOR RUTA |
| DM-VIS-003 | ✅ PASS | NUEVA VISITA → `/visita`; tabs ACTIVIDADES y ADJUNTOS `disabled`, GENERAL habilitada, sin cliente |
| DM-VIS-004 | ✅ PASS | RUTA DE HOY → `/listaVisitas`; searchbar visible; lista vacía al inicio sin error ni overlay colgado |
| DM-VIS-006 | ✅ PASS | Trash en fila "Guardado" → alert "¿Desea borrar la visita?…" ACEPTAR → "Se eliminó la visita de manera exitosa"; desaparece de la lista |
| DM-VIS-010 | ✅ PASS | Selección cliente 2738 en modal → clienteVal "ADRIAN ARLET BASTARDO ALONZO (2738)"; 3 tabs habilitadas |
| DM-VIS-014 | ✅ PASS | "AÑADIR ACTIVIDAD/EVENTO" abre modal con selector Actividad, selector Motivo, Comentario, botones CANCELAR/AGREGAR |
| DM-VIS-015 | ✅ PASS | Actividad "VISITA SIN ACCION" + Motivo "NEGOCIO CERRADO" + comentario → evento visible en Tab Actividades ("Observación: Test-VIS-015-005749") |
| DM-VIS-019 | ✅ PASS | Guardar con ≥1 evento → alert "La visita se ha guardado"; formulario permanece abierto en `/visita` |
| DM-VIS-020 | ✅ PASS | Enviar → alert1 "¿Desea enviar la visita?" (CANCELAR/ACEPTAR) → alert2 "Su Visita será enviada" (OK) → navega a `/visitas` |
| DM-VIS-021 | ✅ PASS | Visita nueva (cliente+evento sin guardar) → atrás dispara modal "¡Alerta!" con Guardar y salir / Salir sin guardar / Cancelar |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" sobre visita nueva nunca guardada → no aparece ítem nuevo "Guardado" en RUTA DE HOY (solo persiste la enviada "Por Enviar") |
| DM-VIS-023 | ✅ PASS | Reabrir visita Guardada → formulario editable, 3 tabs habilitadas, botones guardar/enviar activos; actividad cargada |
| DM-VIS-025 | 🚫 N/A | Sin visitas sincronizadas desde backend hoy — RUTA DE HOY vacía al inicio (no hay visita "No Visitado" rojo). Confirmado en UI |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 → N/A |
| DM-VIS-031 | ✅ PASS | "Guardar" con evento obligatorio → RUTA DE HOY "Estatus: Guardado"; al reabrir la actividad persiste (VISITA SIN ACCION / NEGOCIO CERRADO) |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos: acordeones Imágenes (`images`) + Archivo (`file`, userCanUploadFiles=true) + Firma (`sign`, signatureVisit=true) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro Ref 0 (pend. sync) | Visita cliente 2738 · 1 actividad (VISITA SIN ACCION / NEGOCIO CERRADO / Test-VIS-015-005749) | **Enviada** → "Por Enviar" en RUTA DE HOY (offline-first, pendiente sync servidor) |
| — | Visita cliente 2738 creada para DM-VIS-006 (Test-VIS-006-delete) | Guardada → **Borrada** (DM-VIS-006) — no persiste |
| — | Visita cliente 2738 con evento Test-VIS-022-discard | Descartada con "Salir sin guardar" (DM-VIS-022) — **no persiste** |

**Visitas enviadas:** 1 (Nro Ref 0, cliente 2738, pendiente de sync → mostrará Nro Ref real + "Visitado" tras sincronización).
**Visitas Guardadas pendientes:** 0 (la única Guardada se borró en DM-VIS-006).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Trash en lista RUTA DE HOY | universal | El botón borrar es `ion-item ion-icon[name="trash"]` dentro del `ion-item` con `Estatus: Guardado`. Filas "Por Enviar"/"Visitado" NO tienen el icono. Click con coords reales (`getBoundingClientRect`) sobre el `ion-icon`. Confirma nota previa "trash solo en filas Guardado" `[ins-2606]` y añade el selector exacto del icono |
| Reapertura visita Guardada Ref 0 vía CDP | cliente (insumar) | A diferencia de la limitación de COBROS (`reapertura_ref0_cdp_inestable`), en VISITAS el ítem Guardado Ref 0 SÍ abre su detalle con `mouse.click` sobre coords del `ion-item` (fallback `item.click()`). Round-trip editable confirmado |
| Estatus post-envío insumar | cliente (insumar) | Tras Enviar, la visita queda "Por Enviar" (Ref 0) en RUTA DE HOY hasta sync servidor — offline-first normal (igual que globalmp), NO "Visitado" inmediato. Es PASS |
| Re-render transitorio del `ion-item` Guardado | universal | Entre llamadas CDP el `ion-item` puede re-renderizarse; recalcular coords/elemento justo antes del click y evitar releer el handle en una llamada posterior |

> ✅ consolidado 2026-06-19

*No hubo FAIL.*

## Notas de ejecución
- Selección de cliente sin alert de coordenadas GPS (insumar no bloquea por geolocalización en este flujo).
- Las 11 actividades de insumar tienen `requiredEvent:"true"` → Motivo siempre requerido; "VISITA SIN ACCION" (idType 88) → único Motivo "NEGOCIO CERRADO" (idMotive 221). Confirmado consistente con `[ins-2610]`.
- DM-VIS-020 (defecto conocido RUNTIME §5: modal de confirmación antes de validar actividades) no aplicó como bloqueo: la visita enviada tenía ≥1 actividad. No se observó envío sin actividades.
