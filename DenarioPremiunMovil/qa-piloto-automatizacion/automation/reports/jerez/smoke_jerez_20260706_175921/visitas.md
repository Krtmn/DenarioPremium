# Smoke Test — Módulo VISITAS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_175921_smoke-completo` |
| Módulo | VISITAS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | jerez (INVERSIONES JEREZ, emp 1) |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED |
| VGs | signatureVisit=true · userCanUploadFiles=true · visitRout=true |
| Estado inicial → final | HOME → HOME ✅ |
| BD | Sin lectura de BD (corrida UI-only); estatus reportado tras Enviar/Guardar |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | /visitas + 3 botones: NUEVA VISITA, RUTA DE HOY, Ver mejor ruta |
| DM-VIS-003 | ✅ PASS | /visita: GENERAL activo; ACTIVIDADES/ADJUNTOS `disabled`; sin cliente |
| DM-VIS-004 | ✅ PASS | /listaVisitas: searchbar visible; lista vacía sin error (nuevo set, 0 visitas sync hoy) |
| DM-VIS-006 | ✅ PASS | Trash (solo fila Guardado) → "¿Desea borrar la visita?" Aceptar → "Se eliminó la visita de manera exitosa"; fila desaparece (2→1) |
| DM-VIS-010 | ✅ PASS | Modal cliente DANIELA HERNANDEZ F.P. (V161051485) → alert "sucursal sin coordenadas" dismiss 1er botón → tabs ACTIVIDADES/ADJUNTOS habilitadas + sucursal cargada |
| DM-VIS-014 | ✅ PASS | Modal AÑADIR ACTIVIDAD: selector Actividad (11 opts) + Motivo + Comentario + CANCELAR/Agregar |
| DM-VIS-015 | ✅ PASS | EVENTOS(86) → Motivo único SUPERVISION DE EVENTOS(213) → comentario Test-VIS-015 → Agregar; "Actividad: EVENTOS · Evento: SUPERVISION DE EVENTOS · Observación:..." en lista |
| DM-VIS-019 | ✅ PASS | Guardar → alert "La visita se ha guardado"; formulario permanece abierto (/visita) |
| DM-VIS-020 | ✅ PASS | Enviar (con evento) → 2 alertas ("¿Desea enviar la visita?" CANCELAR/Aceptar → "Su Visita será enviada" OK) → navega a /visitas |
| DM-VIS-021 | ✅ PASS | Back con cambios sin guardar → modal "¡Alerta!" [Guardar y salir / Salir sin guardar / Cancelar] |
| DM-VIS-022 | ✅ PASS | Visita C nueva (nunca guardada) → "Salir sin guardar" → NO aparece en RUTA DE HOY |
| DM-VIS-023 | ✅ PASS | Click visita Guardada → /visita editable, 3 tabs habilitadas, guardar/enviar activos, cliente cargado |
| DM-VIS-025 | 🚫 N/A | RUTA DE HOY sin visitas "No Visitado" sincronizadas desde backend hoy (smoke_na_estructural) |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 (INICIAR VISITA) |
| DM-VIS-031 | ✅ PASS | "Guardar y salir" con evento → "La visita se ha guardado"; reabierta desde RUTA DE HOY el Tab Actividades conserva el evento (Oráculo §9 1:1) |
| DM-VIS-032 | ✅ PASS | Tab ADJUNTOS: 3 acordeones — Imágenes (BUSCAR/TOMAR FOTO), Archivo (userCanUploadFiles), Firma (signatureVisit) |

## Oráculo de persistencia §9 (Guardar → reabrir)
Visita B Guardada (Guardar y salir) reabierta desde RUTA DE HOY:
- Cliente: DANIELA HERNANDEZ F.P. (V161051485) → **persiste** ✅
- Actividad/Evento/Observación: `EVENTOS · SUPERVISION DE EVENTOS · Test-VIS-031-030121` → **persiste 1:1** ✅
Sin divergencia silenciosa. (No hubo Enviar de esta visita: se borró en DM-VIS-006.)

## Registros creados en sistema
| Ref | Detalle | Estado UI |
|-----|---------|-----------|
| Nro Ref 0 (local) | Visita A — DANIELA HERNANDEZ F.P., 1 evento EVENTOS/SUPERVISION DE EVENTOS, **Enviada** (DM-VIS-020) | RUTA DE HOY: "Por Enviar" (offline-first; sin sync a nube aún — sin lectura BD no se confirma persistencia) |
| — | Visita B — DANIELA, 1 evento, Guardada (Guardar y salir), reabierta y comparada, luego **BORRADA** (DM-VIS-006) | Eliminada exitosamente |
| — | Visita C — DANIELA, nueva, **descartada** (Salir sin guardar, DM-VIS-022) | No persiste (correcto) |

RUTA DE HOY final: 1 visita ("Por Enviar", Visita A). Ambas Ref 0 = local sin sync (sin lectura BD por diseño de esta corrida).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Botón atrás jerez = **PRIMER** img.fechaAtras visible | cliente jerez | En /visita y /listaVisitas hay 2 `img.fechaAtras` visibles apiladas; el back real es el de arriba-izq (x≈10, `hasA=true`), NO el último (x≈301, otra acción). `imgs[0].click()` nativo navega; `imgs[last]` no. Refina la nota `[jerez-2026-07-06]` (que decía img.click sin especificar cuál) |
| `#clienteSelect.click()` nativo abre modal | cliente jerez | Confirmado: `.click()` nativo abre el modal cliente de forma fiable (no requiere mouse.click). Alinea con nota `[jerez-2026-07-06]` |
| Modal cliente: `.search-input` + `.clear-search` + click `<p>` nombre | universal | Escribir en `.search-input`, click `.clear-search` dispara filtro, seleccionar por click en `<p>` cuyo texto===nombre. Funcionó en jerez igual que gmp |
| Actividad/Motivo por asignación directa `.value`+ionChange en `ion-modal ion-select` | universal | Asignar objeto opción a `.value` + `ionChange` (sin abrir popover) fiable en jerez. Motivo carga diferida ~1.5s tras Actividad. Confirma `[ins/rom/dth/prc]` |
| Dirty-guard tras navegar tabs en visita Guardada | universal | Reabrir Guardada + cambiar de tab la marca dirty → back muestra modal "¡Alerta!"; "Salir sin guardar" la mantiene en lista (correcto, no FAIL). Confirma `[gmp-2611][ins-2610]` |
| Alert coordenadas dispara en selección de cliente, NO siempre en Guardar/Enviar | cliente jerez | DANIELA dispara "sucursal sin coordenadas" al SELECCIONAR cliente; en Guardar/Enviar de esta corrida NO reapareció. Dismiss 1er botón (vacío=Cancelar) no bloquea |

> ✅ consolidado 2026-07-06

## Datos verificados bajo nuevo set (jerez modules.visitas)
- cliente_test **DANIELA HERNANDEZ F.P. (V161051485, emp 1)**: seleccionable; alert coordenadas dismiss 1er botón, no bloquea. ✅ vigente
- **11 actividades, TODAS requiredEvent=true** (idTypes 2,47,71,75,82,83,84,85,86,87,88). ✅ coincide YAML
- **EVENTOS (idType 86) → Motivo único SUPERVISION DE EVENTOS (idMotive 213)**. ✅ coincide YAML

## Hallazgos (FAIL)
Ninguno. Defecto conocido DM-VIS-020 (modal confirmación antes de validar actividades) no re-marcado como FAIL — se ejecutó con evento presente y no afectó (RUNTIME §5).
