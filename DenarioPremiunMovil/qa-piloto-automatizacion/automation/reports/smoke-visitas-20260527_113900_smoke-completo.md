# Smoke Test — Módulo VISITAS
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-05-28 |
| **RUN_ID** | `20260527_113900_smoke-completo` |
| **Módulo** | VISITAS |
| **Dispositivo** | 14678405BR003855 |
| **App** | `com.kiberno.denarioPremiumPro` — Versión 6.6.14 |
| **Credenciales** | `***`/`***` |
| **Resultado global** | 13 PASS · 0 FAIL · 0 SKIP · 2 N/A · 2 PASS* |

> *PASS* = caso pasado con observación de comportamiento distinto al descrito en el guion (ver Hallazgos).

---

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-VIS-001 | Acceso al módulo → título "Visitas" + 3 botones | **PASS** | Pantalla `/visitas` con botones NUEVA VISITA, RUTA DE HOY, VER MEJOR RUTA |
| DM-VIS-002 | Ver mejor ruta sin visitas pendientes → alerta UI | **PASS** | Alert: "No hay visitas pendientes para trazar ruta." — OK funcional |
| DM-VIS-003 | Nueva Visita → formulario vacío, tabs deshabilitadas | **PASS** | Navega a `/visita`; ACTIVIDADES y ADJUNTOS `disabled=true` sin cliente |
| DM-VIS-004 | RUTA DE HOY → lista del día con searchbar | **PASS** | Navega a `/listaVisitas`; searchbar visible; lista vacía sin error (sin visitas previas) |
| DM-VIS-006 | Eliminar visita Guardado → confirmación + desaparece | **PASS** | Alert "¿Desea borrar la visita? Esta acción no se puede deshacer."; mensaje "Se eliminó la visita de manera exitosa" |
| DM-VIS-010 | Seleccionar cliente → campo relleno, tabs habilitadas | **PASS** | Cliente "ALIMENTOS GOURMET CCC, C.A." seleccionado; tabs ACTIVIDADES y ADJUNTOS habilitadas; Sucursal cargada |
| DM-VIS-014 | Modal Añadir Actividad/Evento → campos visibles | **PASS** | Modal abierto con selector Actividad, campo Comentario, botones CANCELAR/AGREGAR |
| DM-VIS-015 | Agregar evento sin motivo requerido → aparece en lista | **PASS** | Evento "VISITA SIN ACCION" + comentario "Test-VIS-SMOKE-133900" visible en lista de actividades |
| DM-VIS-019 | Guardar visita → mensaje confirmación | **PASS** | Alert: "La visita se ha guardado"; formulario permanece abierto |
| DM-VIS-020 | Enviar visita → comportamiento con/sin actividades | **PASS*** | Ver Hallazgo #1: error de "sin actividades" aparece post-confirmación. Con actividades: "Su Visita será enviada", navega a home módulo. Visita enviada como "Visitado" (sincronización inmediata online). |
| DM-VIS-021 | Salir con cambios → modal GUARDAR Y SALIR / SALIR SIN GUARDAR / CANCELAR | **PASS** | Alert: "¡Alerta!" con los 3 botones correctos al pulsar atrás con cambios no guardados |
| DM-VIS-022 | "Salir sin guardar" → visita nueva no persiste | **PASS** | Navega a `/visitas`; visita no aparece en lista RUTA DE HOY |
| DM-VIS-023 | Abrir visita Guardado → formulario editable, botones activos | **PASS** | Formulario carga con datos (cliente, sucursal, fecha); 3 tabs accesibles; botones guardar/enviar visibles |
| DM-VIS-025 | Abrir visita "No Visitado" → INICIAR VISITA bloqueado | **N/A** | No hay visitas sincronizadas desde backend con estatus "No Visitado" para hoy (supuesto 4) |
| DM-VIS-026 | INICIAR VISITA con GPS disponible → tabs habilitadas | **N/A** | Depende de DM-VIS-025; sin visitas "No Visitado" disponibles |
| DM-VIS-031 | "Guardar y salir" → visita Guardada en lista | **PASS** | Alert: "La visita se ha guardado"; navega a `/visitas` (home módulo); visita presente en RUTA DE HOY como Guardado |
| DM-VIS-032 | Tab Adjuntos → acordeones imagen/archivo/firma según VG | **PASS** | Acordeón Imágenes expandido con botones "BUSCAR FOTO" / "TOMAR FOTO"; Archivo y Firma presentes. VGs `signatureVisit=true` y `userCanUploadFiles=true` activas. Captura real (cámara) fuera de alcance de automatización CDP. |

---

## Hallazgos

### Hallazgo #1 — DM-VIS-020: Orden de validación "sin actividades" al enviar (Observación)
**Severidad:** Baja / Cosmética  
**Comportamiento observado:** Al pulsar enviar sin actividades, la app muestra primero el modal de confirmación "¿Desea enviar la visita?" (CANCELAR / ACEPTAR). Solo tras aceptar aparece el error "Debe agregar al menos una actividad para poder enviar la visita".  
**Comportamiento esperado (guion):** El error debe mostrarse antes de la confirmación, sin abrir el modal si no hay actividades.  
**Impacto:** El flujo funciona correctamente en términos de protección del envío (no se envía sin actividades), pero el UX difiere: el usuario ve un diálogo de confirmación antes del mensaje de error, lo cual puede ser confuso.  
**Recomendación:** Revisar la función `sendVisit` / `confirmSend` en `visita.component.ts:907-975` para validar actividades ANTES de abrir el modal de confirmación.

### Hallazgo #2 — Técnica de selección en ion-select popover
**Nota de automatización:** La selección en `ion-select` (popover de radio buttons) requiere:
1. Clic en el `ion-select` para abrir el popover.
2. Asignar el valor directamente vía `ion-select.value = 'OPCION'` + evento `ionChange`.
3. Llamar a `ionPopover.dismiss()` para cerrar el popover.
El clic nativo sobre `ion-item[ion-radio]` dentro del popover no desencadenó el cierre automático en esta versión de Ionic.

### Hallazgo #3 — DM-VIS-020: Visita enviada como "Visitado" (no "Por Enviar")
**Observación:** En entorno con conectividad activa, la visita se envió y sincronizó inmediatamente al servidor, apareciendo directamente como "Visitado" (estatus 2) con mensaje "Visita nro. 3 enviada exitosamente". El estatus "Por Enviar" aplica solo cuando la app está offline. Comportamiento correcto para entorno conectado.

---

## Configuración VG detectada (cuenta QA)

| VG | Valor detectado |
|----|-----------------|
| `signatureVisit` | `true` (acordeón Firma visible en Tab Adjuntos) |
| `userCanUploadFiles` | `true` (acordeón Archivo visible en Tab Adjuntos) |
| `transportRole` | `false` (título muestra "Visitas", no "Despachos") |
| `userMustActivateGPS` | No activada (Nueva Visita abre formulario sin bloqueo de GPS) |

---

## Resumen de navegación

| Ruta | Estado final |
|------|-------------|
| `/home` → `/visitas` | OK vía clic en módulo Visitas |
| `/visitas` → `/visita` | OK vía NUEVA VISITA |
| `/visita` → `/visitas` | OK vía `img[routerlink="/home"].click()` directo en img.fechaAtras |
| `/visitas` → `/listaVisitas` | OK vía RUTA DE HOY |
| `/listaVisitas` → `/visita` | OK vía clic en `ion-label` del item |
| `/visita` back (sin cambios) | Navega directo sin modal |
| `/visita` back (con cambios) | Modal GUARDAR Y SALIR / SALIR SIN GUARDAR / CANCELAR |
| Final | `/home` ✓ |

---

*Generado por Claude Code · Playwright MCP CDP · 2026-05-28*
