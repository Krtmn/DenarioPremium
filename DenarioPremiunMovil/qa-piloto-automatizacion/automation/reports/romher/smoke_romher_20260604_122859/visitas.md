# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260604_122859_smoke-completo` |
| Módulo | VISITAS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | El Yaque (romher) |
| Resultado | 12 PASS · 1 FAIL · 0 SKIP · 0 N/A |
| Fecha ejecución | 2026-06-04 |

---

## Nota de ejecución

**Incidencia CDP al inicio:** El endpoint `:9220` acumuló decenas de conexiones ESTABLISHED de corridas anteriores y dejó de responder al conectar. Se resolvió forzando `adb forward --remove tcp:9220` + re-forward al nuevo PID tras reinicio de la app. La app fue reiniciada (`am force-stop` → `am start`) y se inició sesión nuevamente con credenciales QA romher (usuario `170`). Se ejecutaron todos los casos desde HOME con sesión fresca. Patron nuevo: **P-ROM-VIS-001-cdp-stale-connections** (documentado en hallazgos).

**DM-VIS-002 resultado:** FAIL — VER MEJOR RUTA queda en "Cargando..." indefinido (loading + backdrop). El alert esperado "No hay visitas pendientes" nunca aparece. Posible causa: GPS no disponible en contexto CDP / device en reposo. Se forzó `ion-loading.dismiss()` para liberar la UI y continuar.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | `app-visitas` visible con títulos "NUEVA VISITA · RUTA DE HOY · VER MEJOR RUTA" |
| DM-VIS-002 | ❌ FAIL | Spinner "Cargando..." persiste indefinidamente; alert "No hay visitas pendientes" nunca aparece — GPS no resuelve en CDP |
| DM-VIS-003 | ✅ PASS | NUEVA VISITA abre form; tabs ACTIVIDADES + ADJUNTOS = `segment-button-disabled` sin cliente |
| DM-VIS-004 | ✅ PASS | RUTA DE HOY muestra lista con searchbar; 2 visitas "No Visitado" sincronizadas (Nro 72557, 72558) |
| DM-VIS-006 | ✅ PASS | Trash en "Guardado" → alert "¿Desea borrar la visita?" → ACEPTAR → "Se eliminó la visita de manera exitosa · OK"; visita desaparece de lista |
| DM-VIS-010 | ✅ PASS | Modal cliente abre al click en ion-input#clienteSelect; búsqueda por Enter; click en `<p>` del nombre → tabs habilitadas; valor=SUPERMERCADO SIDON, C.A. |
| DM-VIS-014 | ✅ PASS | "AÑADIR ACTIVIDAD/EVENTO" abre ion-modal con: ion-select Actividad, ion-select Motivo, ion-input Comentario, CANCELAR/AGREGAR |
| DM-VIS-015 | ✅ PASS | Actividad=VISITA SIN ACCION (objeto `{idType:88}`), Motivo=NEGOCIO CERRADO, Comentario="Test-VIS-015-143600" → AGREGAR → item en Tab Actividades |
| DM-VIS-019 | ✅ PASS | Guardar con ≥1 evento → alert "La visita se ha guardado · OK"; formulario permanece abierto |
| DM-VIS-020 | ✅ PASS | Enviar → alert "¿Desea enviar la visita?" → ACEPTAR → "Su Visita será enviada · OK" → navega a home módulo; visita Nro 72559 aparece con Estatus "Visitado" |
| DM-VIS-021 | ✅ PASS | Back con ≥1 evento sin guardar → alert "¡Alerta!" con 3 botones: "Guardar y salir / Salir sin guardar / Cancelar" |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" en visita nueva nunca guardada → visita NO aparece en RUTA DE HOY (lista queda con 3 ítems sin nueva entrada Guardado) |
| DM-VIS-023 | ✅ PASS | Click en visita Guardada → form editable; 3 tabs habilitadas; botones guardar + enviar activos (no disabled) |
| DM-VIS-025 | ✅ PASS | Visita "No Visitado" (Nro 72557) → INICIAR VISITA visible; 3 tabs = disabled (General, Actividades, Adjuntos) |
| DM-VIS-026 | ✅ PASS | INICIAR VISITA → GPS resuelve; 3 tabs habilitadas; "AÑADIR ACTIVIDAD/EVENTO" visible en Tab Actividades |
| DM-VIS-031 | ✅ PASS | "Guardar y salir" con ≥1 evento → "La visita se ha guardado"; en RUTA DE HOY visita aparece Estatus=Guardado |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos: acordeón Imágenes (BUSCAR FOTO/TOMAR FOTO) + acordeón Archivo (Subir Archivo) + acordeón Firma (Borrar) → `signatureVisit=true` confirmado |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro 72559 | Visita SUPERMERCADO SIDON, C.A. — Actividad: VISITA SIN ACCION / Motivo: NEGOCIO CERRADO / Obs: Test-VIS-015-143600 | **Enviada · Visitado** |
| Nro 0 (2 instancias) | Visitas Guardadas SUPERMERCADO SIDON — creadas durante pruebas de Guardar y DM-VIS-006; una eliminada (DM-VIS-006), otra enviada vía DM-VIS-020 | Una eliminada · Una enviada |

---

## Datos descubiertos (primera corrida)

| Variable | Valor descubierto | Caso que lo confirma |
|----------|-------------------|----------------------|
| `signatureVisit` | **true** | DM-VIS-032 — acordeón Firma visible con canvas/botón "Borrar" en Tab Adjuntos |
| `smoke_na_estructural` | **[]** (ninguno N/A) | DM-VIS-025/026 — hay visitas sincronizadas desde backend con Estatus No Visitado |
| Visitas backend hoy | Nro 72557 (GRUPO HERMANOS DE GOUVEIA C.H.D.G) + Nro 72558 (EYKERSON JOHAN BRACHO CALDERON) | DM-VIS-004 |
| Actividades disponibles | NO VISITO · MERCHANDISING · NO COMPRO · VISITA FUERA DE RUTA · COBRANZA · INFO DE CLIENTES · COBRANZA NO EFECTIVA · VENTA EN RUTA · EVENTOS · REUNION CON CLIENTE · VISITA SIN ACCION | DM-VIS-015 — todas con `requiredEvent: "true"` |
| Motivo para VISITA SIN ACCION | NEGOCIO CERRADO (`idMotive:221`) | DM-VIS-015 |
| Estructura Actividad | Objeto `{idType, naType, requiredEvent, requiredSignature}` | DM-VIS-015 — no string plano |
| Alert borrar visita | "Denario - Visita · ¿Desea borrar la visita? Esta acción no se puede deshacer. · CANCELAR/ACEPTAR" | DM-VIS-006 |
| Alert enviar visita | "¿Desea enviar la visita? CANCELAR/ACEPTAR" → "Su Visita será enviada · OK" (2 alerts) | DM-VIS-020 |
| requiredComment en visitas | No aplica — tabs habilitadas con solo cliente (no requiere Comentario) | DM-VIS-010 |

---

## Patrones nuevos descubiertos

| ID | Patrón | Detalle |
|----|--------|---------|
| P-ROM-VIS-001 | `visitas_cdp_stale_connections_block` | Después de múltiples corridas, el endpoint `:9220` acumula ESTABLISHED TCP y deja de responder al nuevo `connectOverCDP`. Solución: `adb forward --remove tcp:9220` → re-forward al PID activo → restart app si necesario. |
| P-ROM-VIS-002 | `visitas_ver_mejor_ruta_loading_sin_gps` | VER MEJOR RUTA dispara `ion-loading` con backdrop que no se auto-dismiss si GPS no resuelve — se debe llamar `ion-loading.dismiss()` manualmente para liberar UI |
| P-ROM-VIS-003 | `visitas_actividad_objeto_set_directo` | La técnica de click en item del popover falla cuando el item está fuera del viewport (coords fuera de pantalla). Alternativa funcional: asignar objeto directamente a `ion-select.value` + dispatch `ionChange` |
| P-ROM-VIS-004 | `visitas_motivo_requerido_siempre` | Todas las actividades tienen `requiredEvent: "true"` en romher → Motivo es siempre requerido |
| P-ROM-VIS-005 | `visitas_alert_borrar_con_confirmacion` | Trash en visita Guardada muestra alert "¿Desea borrar...?" con CANCELAR/ACEPTAR (mismo patrón cobros/inventarios) |
| P-ROM-VIS-006 | `visitas_cliente_modal_click_input_id_clienteSelect` | Click en `ion-input#clienteSelect` abre modal de búsqueda de clientes |
| P-ROM-VIS-007 | `visitas_envio_dos_alertas` | Envío de visita requiere: (1) "¿Desea enviar la visita?" ACEPTAR → (2) "Su Visita será enviada" OK (2 alerts, no 3) |

---

## Hallazgos (FAILs)

### DM-VIS-002 — VER MEJOR RUTA: loading indefinido sin GPS

**Comportamiento observado:** Clic en "VER MEJOR RUTA" → `ion-loading` con `ion-backdrop` aparece con texto "Cargando..." y permanece indefinidamente. No aparece el alert esperado "No hay visitas pendientes para trazar ruta."

**Esperado:** Alert "No hay visitas pendientes para trazar ruta." o bien "No hay GPS activo" o similar.

**Hipótesis:** La función obtiene GPS antes de verificar visitas; en contexto CDP (emulador/dispositivo sin GPS activo) la promesa de geolocalización no resuelve ni rechaza con timeout → loading no se dismiss.

**Impacto:** UX bloqueante — usuario queda atrapado en pantalla de carga sin poder cerrarla excepto con botón atrás del sistema.

**Severidad:** Media (workaround: botón atrás del sistema).

**No marcar como defecto conocido** — no aparece en lista de `v6.6.14`.

---

## Estado final

App en **HOME** (`app-home`). Sync overlay ausente. Sin alertas pendientes.
