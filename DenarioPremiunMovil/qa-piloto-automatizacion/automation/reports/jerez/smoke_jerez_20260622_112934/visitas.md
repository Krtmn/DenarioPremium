# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260622_112934_smoke-completo` |
| Módulo | VISITAS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v6.6.17 |
| Playa | jerez |
| Cliente test | DANIELA HERNANDEZ F.P. (Código V161051485, empresa 1 INVERSIONES JEREZ MOTORS) |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 2 N/A |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | Título "Visitas" + 3 botones: NUEVA VISITA, RUTA DE HOY, VER MEJOR RUTA |
| DM-VIS-003 | ✅ PASS | NUEVA VISITA → `/visita`; tabs ACTIVIDADES/ADJUNTOS `disabled`, sin cliente; solo GENERAL activa |
| DM-VIS-004 | ✅ PASS | RUTA DE HOY → `/listaVisitas`, searchbar visible, lista vacía sin error/overlay |
| DM-VIS-006 | ✅ PASS | Trash en visita Guardada → "¿Desea borrar la visita?" Aceptar → "Se eliminó la visita de manera exitosa"; desaparece de la lista |
| DM-VIS-010 | ✅ PASS | Cliente DANIELA seleccionado → 3 tabs habilitadas; sucursal cargada (alert "sucursal sin coordenadas" dismissed sin agregar) |
| DM-VIS-014 | ✅ PASS | AÑADIR ACTIVIDAD/EVENTO → modal con ion-select Actividad, campo Comentario (ngModel), botones CANCELAR/Agregar |
| DM-VIS-015 | ✅ PASS | EVENTOS + Motivo SUPERVISION DE EVENTOS + comentario → "Actividad: EVENTOS Evento: SUPERVISION DE EVENTOS Observación: Test-VIS-015-132308" en Tab Actividades |
| DM-VIS-019 | ✅ PASS | Guardar con 1 evento → "Denario / La visita se ha guardado" OK; formulario permanece abierto en `/visita` |
| DM-VIS-020 | ✅ PASS | Enviar con 1 evento → 2 alertas ("¿Desea enviar la visita?" Aceptar → "Su Visita será enviada" OK) → `/visitas`. Sincronizó a Nro Ref 6 / Estatus Visitado |
| DM-VIS-021 | ✅ PASS | Visita nueva (cliente+evento sin guardar) + atrás → modal "¡Alerta!": Guardar y salir / Salir sin guardar / Cancelar |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" en visita NUEVA nunca guardada → no aparece en RUTA DE HOY (no persiste) |
| DM-VIS-023 | ✅ PASS | Click visita Guardada → `/visita` editable; 3 tabs habilitadas; Guardar/Enviar activos |
| DM-VIS-025 | 🚫 N/A | Sin visitas "No Visitado" sincronizadas desde backend con ruta de hoy (la única "Visitado" es la creada en sesión) |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 (N/A) |
| DM-VIS-031 | ✅ PASS | Visita Guardada reabierta desde RUTA DE HOY conserva la actividad EVENTOS/SUPERVISION DE EVENTOS/Observación (round-trip persiste, no Guardada sin actividades) |
| DM-VIS-032 | ✅ PASS | Tab ADJUNTOS: acordeones Imágenes + Archivo (`userCanUploadFiles=true`) + Firma (`signatureVisit=true`) — ambas VGs activas confirmadas en UI |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro Ref. 6 | Visita DANIELA HERNANDEZ F.P. (V161051485) con actividad EVENTOS / SUPERVISION DE EVENTOS / "Test-VIS-015-132308" — enviada en DM-VIS-020 | Visitado (sincronizada) |
| — | Visita Guardada (Nro Ref 0, DANIELA) creada para DM-VIS-006 | Eliminada (borrada en DM-VIS-006) |
| — | Visita nueva DM-VIS-022 (Test-VIS-022-nueva) | Descartada (Salir sin guardar — no persistió) |

**Visitas Guardadas pendientes al cierre:** ninguna (RUTA DE HOY queda solo con Nro Ref 6 Visitado).

## Datos descubiertos (consolidar en YAML)

| Campo | Valor |
|-------|-------|
| `modules.visitas.cliente_test` | `"V161051485"` — DANIELA HERNANDEZ F.P. (empresa 1) |
| Actividades (11, TODAS `requiredEvent:"true"`) | idTypes 2,47,71,75,82-88 (NO VISITO, MERCHANDISING, NO COMPRO, VISITA FUERA DE RUTA, COBRANZA, INFO DE CLIENTES, COBRANZA NO EFECTIVA, VENTA EN RUTA, EVENTOS, REUNION CON CLIENTE, VISITA SIN ACCION) |
| EVENTOS (idType 86) → Motivo único | SUPERVISION DE EVENTOS (idMotive 213) |
| Ruta de hoy | sin visitas sincronizadas "No Visitado" (lista vacía al inicio) → DM-VIS-025/026 N/A |
| Alert coordenadas | seleccionar DANIELA dispara "Esta sucursal no tiene coordenadas asignadas. ¿Desea agregarlas?" (botones [vacío]/Agregar); dismiss con 1er botón no bloquea el flujo |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| NUEVA VISITA: `mouse.move`+`mouse.click` sobre el `<a>` de `app-visitas` | universal | jerez confirma: `dispatchEvent(MouseEvent)` en el `<a>` NO navega (queda en `/visitas`); coords reales + mouse.click sí. Complementa la nota `[gmp-2606]` (shadowBtn.click) |
| Alert envío visita = 2 alertas | cliente (jerez) | "¿Desea enviar la visita?" CANCELAR/Aceptar → "Denario Visitas / Su Visita será enviada" OK → `/visitas`. Mismo patrón que insumar/central_foods |
| Alert borrado visita | universal | "Denario - Visita / ¿Desea borrar la visita? Esta acción no se puede deshacer." CANCELAR/Aceptar → "Denario / Se eliminó la visita de manera exitosa" OK. Confirma `[gmp/ins/rom-2606]` |
| Alert "sucursal sin coordenadas" | cliente (jerez) | seleccionar cliente sin coordenadas dispara el alert (igual que globalmp, ≠ central_foods/insumar que no bloquean). Dismiss con 1er botón |
| Post-envío jerez → Visitado tras sync | cliente (jerez) | Nro Ref 0 → Nro Ref 6 "Visitado" inmediato tras enviar+sync en la misma sesión (no quedó "Por Enviar"). PASS |

> ✅ consolidado 2026-06-22

## Hallazgos (solo si hay FAIL)

Ninguno. 0 FAIL.

## Notas operativas

- DM-VIS-020: el modal de confirmación aparece tras el botón Enviar; con actividad presente se envió sin problema. El defecto conocido (modal antes de validar actividades) no se forzó como FAIL — la visita tenía ≥1 evento.
- Estado final: HOME (`/home`, app-home, 10 módulos).
- Credenciales: usuario ***/*** (bloque jerez).
