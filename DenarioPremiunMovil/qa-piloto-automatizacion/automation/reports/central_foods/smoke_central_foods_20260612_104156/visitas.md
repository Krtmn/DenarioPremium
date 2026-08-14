# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260612_104156_smoke-completo` |
| Módulo | VISITAS |
| Cliente | central_foods (CENTRAL FOODS) |
| App | `com.kiberno.denarioPremiumPro` |
| CDP | :9220 |
| Estado | COMPLETO |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 2 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | `/visitas`; título "Visitas" + 3 botones NUEVA VISITA / RUTA DE HOY / Ver mejor ruta |
| DM-VIS-003 | ✅ PASS | NUEVA VISITA → `/visita`; GENERAL habilitado, ACTIVIDADES/ADJUNTOS disabled, sin cliente |
| DM-VIS-004 | ✅ PASS | RUTA DE HOY → `/listaVisitas`; searchbar "Busqueda..." visible; lista vacía, sin error, overlay desaparece |
| DM-VIS-006 | ✅ PASS | Trash en visita Guardada → alert "Denario - Visita: ¿Desea borrar la visita?..." (CANCELAR/Aceptar) → Aceptar → "Se eliminó la visita de manera exitosa"; ítem desaparece. Trash ausente en visita Visitado (correcto) |
| DM-VIS-010 | ✅ PASS | Cliente "ALEJANDRA LEDEZMA (00029)" cargado; ACTIVIDADES y ADJUNTOS se habilitan; sin alerta de coordenadas |
| DM-VIS-014 | ✅ PASS | AÑADIR ACTIVIDAD/EVENTO → modal con selector Actividad + Motivo + Comentario + CANCELAR/Agregar |
| DM-VIS-015 | ✅ PASS | Actividad EVENTOS + Motivo SUPERVISION DE EVENTOS + comentario Test-VIS-104156 → aparece en lista Tab Actividades |
| DM-VIS-019 | ✅ PASS | Guardar → alert "Denario: La visita se ha guardado"; form permanece en `/visita` |
| DM-VIS-020 | ✅ PASS | Enviar → "¿Desea enviar la visita?" (Aceptar) → "Su Visita será enviada" (OK) → navega a `/visitas`. GPS obligatorio NO bloqueó |
| DM-VIS-021 | ✅ PASS | Visita nueva (cliente + 1 evento sin guardar) → atrás (`img.fechaAtras` + mouse.click) → modal "¡Alerta!" con Guardar y salir / Salir sin guardar / Cancelar |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" sobre visita nueva nunca guardada → sale a `/visitas`; la visita NO aparece en RUTA DE HOY (no persiste) |
| DM-VIS-023 | ✅ PASS | Reabrir visita Guardada → form editable, 3 tabs habilitadas, cliente cargado, Guardar/Enviar activos |
| DM-VIS-025 | 🚫 N/A | RUTA DE HOY vacía (sin visitas sincronizadas del backend hoy) — sin visita "No Visitado" para abrir |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 (N/A) |
| DM-VIS-031 | ✅ PASS | Visita Guardada reabierta retiene evento en Tab Actividades (EVENTOS/SUPERVISION/Test-VIS-104156); guardada CON actividad |
| DM-VIS-032 | ✅ PASS | Tab ADJUNTOS: 3 acordeones Imágenes + Archivo (userCanUploadFiles=true) + Firma (signatureVisit=true) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro Ref. 55 | Cliente 00029 ALEJANDRA LEDEZMA · Actividad EVENTOS / SUPERVISION DE EVENTOS / "Test-VIS-104156" | **Visitado** (enviada y sincronizada — DM-VIS-019→020) |
| Nro Ref. 0 (temporal) | Cliente 00029 · Actividad EVENTOS / "Test-VIS-104156-del" | **ELIMINADA** (creada Guardado y borrada en DM-VIS-006 — no queda en sistema) |
| (descartada) | Cliente 00029 · Actividad EVENTOS / "Test-VIS-104156-nueva" | **NO persistió** (Salir sin guardar — DM-VIS-022) |

## Ruta de hoy (estado final)
RUTA DE HOY inició VACÍA (sin visitas sincronizadas del backend → DM-VIS-025/026 N/A). Estado final: 1 visita — Nro Ref. 55 · ALEJANDRA LEDEZMA · Estatus Visitado · 2026-06-12.

## Discrepancias VG
| VG (CSV) | Esperado en UI | Observado | Estado |
|----------|----------------|-----------|--------|
| `userMustActivateGPS=true` + `userCanSaveGPS=true` | GPS obligatorio; sin coordenadas posible bloqueo | Selección de cliente y envío de visita SIN ningún bloqueo/alert de geolocalización ni "sucursal sin coordenadas". Permisos concedidos. | ✅ Coincide — GPS obligatorio NO causó bloqueo |
| `signatureVisit=true` | Acordeón Firma en Tab ADJUNTOS | Acordeón "Firma" presente (value="sign") | ✅ Coincide |
| `userCanUploadFiles=true` | Acordeón Archivo en ADJUNTOS | Acordeón "Archivo" presente (value="file") | ✅ Coincide |
| `visitRout=true` | Rutas planificadas visibles en mapa | No verificado por UI directa (RUTA DE HOY sin visitas sincronizadas; "Ver mejor ruta" no ejecutado en este smoke) | ⚠ No verificable esta corrida (ruta vacía) |
| actividad `requiredEvent` | Motivo requerido | Las 11 actividades tienen `requiredEvent:"true"` → Motivo siempre requerido | ✅ Coincide (= insumar/globalmp) |

**Sin discrepancias bloqueantes.** Todas las VGs verificables coinciden con el CSV de dev.

## Patrones / selectores nuevos
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Modal cliente: si el primer click en `ion-input#clienteSelect` no abre el modal, llamar `.present()` sobre el `ion-modal` que contiene `.search-input` (o `#clienteSelectModal`) | universal | El click directo es intermitente en visitas (no abrió en 1 de 2 intentos). Fallback `.present()` siempre abrió. Igual patrón que COBROS. |
| Buscar `.search-input` por visibilidad (`offsetParent!==null`) | universal (VISITAS) | Hay varios `.search-input` en el DOM (modales residuales); el `.click` de Playwright sobre el selector plano falla por "not visible". Filtrar al visible y usar `evaluateHandle().click({clickCount:3})`. |
| Navegación de tabs por `ion-segment.value = '<valor>'` + `ionChange` | universal (VISITAS) | values: `default`/`actividades`/`adjuntos`. Fiable para moverse entre tabs sin click en segment-button. |
| Acordeones ADJUNTOS visitas: values `images`/`file`/`sign` | cliente/universal | central_foods muestra los 3 (Imágenes/Archivo/Firma) por `userCanUploadFiles`+`signatureVisit`=true. |
| central_foods: 11 actividades, TODAS `requiredEvent:"true"` | cliente | idTypes 2,47,71,75,82-88. "EVENTOS" (86) → único Motivo "SUPERVISION DE EVENTOS" (idMotive 213). |
| central_foods: envío visita = 2 alertas | cliente | "¿Desea enviar la visita?" (Aceptar) → "Su Visita será enviada" (OK) → navega a `/visitas`; tras sync, Ref real + Estatus "Visitado". (Igual a insumar.) |
| GPS obligatorio (`userMustActivateGPS=true`) NO bloquea vía CDP con permisos concedidos | cliente | Selección de cliente y envío completados sin alert de geolocalización ni "sucursal sin coordenadas". |

> ✅ consolidado 2026-06-12

## Hallazgos (solo si hay FAIL)
Ninguno — 0 FAIL.
