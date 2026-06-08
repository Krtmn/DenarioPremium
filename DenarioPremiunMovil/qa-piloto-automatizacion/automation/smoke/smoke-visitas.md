# Smoke — VISITAS
## Estado inicial: HOME | Estado final: HOME

**Inicio:** `h.connectCdp(page)` → `h.waitSyncOverlay(pg)`
**Datos de prueba:** leer `automation/clientes/{QA_CLIENTE}.yaml` → `modules.visitas`

---

## Casos

| ID | Acción clave | PASS cuando | FAIL / N/A |
|----|-------------|-------------|------------|
| DM-VIS-001 | Click módulo Visitas | Título "Visitas" + 3 botones: NUEVA VISITA, RUTA DE HOY, Ver mejor ruta | FAIL: pantalla vacía |
| DM-VIS-003 | Click NUEVA VISITA | Formulario con tabs ACTIVIDADES/ADJUNTOS `disabled`; sin cliente | FAIL: tabs habilitadas sin cliente |
| DM-VIS-004 | Click RUTA DE HOY | Lista del día con searchbar visible; si vacía → sin error | FAIL: overlay no desaparece |
| DM-VIS-006 | Botón basura en visita Guardada → ACEPTAR | Alert borrado exitoso; visita desaparece | FAIL: persiste |
| DM-VIS-010 | Seleccionar `cliente_test` en modal | Tabs ACTIVIDADES y ADJUNTOS habilitadas; Sucursal cargada | FAIL: tabs siguen bloqueadas |
| DM-VIS-014 | Click "AÑADIR ACTIVIDAD/EVENTO" | Modal con selector Actividad, campo Comentario, botones CANCELAR/AGREGAR | FAIL: modal no abre |
| DM-VIS-015 | Agregar actividad → ver nota crítica abajo | Evento aparece en lista Tab Actividades | FAIL: modal cierra pero lista vacía |
| DM-VIS-019 | Click Guardar (con ≥1 evento) | Alert "La visita se ha guardado"; formulario permanece abierto | FAIL: sin alert |
| DM-VIS-020 | Click Enviar (con ≥1 evento) → ACEPTAR | "Su Visita será enviada"; navega a home módulo; visita "Visitado" | FAIL: permite enviar sin actividades |
| DM-VIS-021 | Pulsar atrás con cambios (cliente + ≥1 evento sin guardar) | Modal: Guardar y salir / Salir sin guardar / Cancelar | FAIL: sale sin modal |
| DM-VIS-022 | Elegir "Salir sin guardar" — ver nota crítica abajo | Visita nueva no aparece en RUTA DE HOY | FAIL solo si era visita nueva nunca guardada |
| DM-VIS-023 | Click en visita Guardada en lista | Formulario editable; 3 tabs; botones guardar/enviar activos | FAIL: solo lectura |
| DM-VIS-025 | Visita "No Visitado" (rojo) → abrir | INICIAR VISITA visible; ACTIVIDADES/ADJUNTOS bloqueadas | N/A si no hay visitas sincronizadas desde backend hoy (leer `smoke_na_estructural`) |
| DM-VIS-026 | Click INICIAR VISITA con GPS | Tabs habilitadas; cambia a Tab ACTIVIDADES | N/A si DM-VIS-025 es N/A |
| DM-VIS-031 | Ver nota crítica abajo | Visita en RUTA DE HOY Estatus: Guardado con evento | FAIL: Guardada sin actividades |
| DM-VIS-032 | Tab Adjuntos | Acordeón Imágenes + Archivo (si `userCanUploadFiles`) + Firma (si `signatureVisit`) | FAIL: acordeón ausente con VG activa |

---

## ⚠ Notas críticas

### DM-VIS-015 — Agregar actividad en modal (técnica CDP)
El botón AGREGAR y el selector de actividad están dentro de un `ion-modal`.
1. `browser_click` en botón "AÑADIR ACTIVIDAD/EVENTO"
2. Actividad (`ion-select interface="popover"`): `h.selectIonPopover(pg, 'ion-modal ion-select', valor)`
3. Comentario (campo usa `[(ngModel)]`): `pg.focus('ion-modal ion-input input')` + `pg.keyboard.type('Test-VIS-015-<HHMMSS>')`
4. Botón AGREGAR: `browser_click` o `pg.mouse.click(coords.x, coords.y)` — **NO `element.click()` dentro de ion-modal**
5. Verificar: `ion-list ion-item` con actividad visible en Tab Actividades

### DM-VIS-022 — "Salir sin guardar" solo aplica a visita nueva
Usar una visita **recién creada, nunca guardada desde cabecera**.
- Si la visita ya fue guardada (Estatus: Guardado) y luego se reabre → "Salir sin guardar" la mantiene en lista → **NO es FAIL, es comportamiento correcto**.
- El agente NO debe reutilizar la visita de DM-VIS-019 para este caso.

### DM-VIS-031 — "Guardar y salir" con evento obligatorio
Antes de pulsar atrás (DM-VIS-021), agregar **al menos un evento** usando la técnica de DM-VIS-015.
Si se guarda sin evento → FAIL (visita sin actividades en sistema).
Verificar Tab Actividades al reabrir desde RUTA DE HOY.
