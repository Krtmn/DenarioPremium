# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260603_093706_smoke-completo` |
| Módulo | VISITAS |
| Dispositivo | `14678405BR003855` (Infinix X6728, Android 15) |
| App | `com.kiberno.denarioPremiumPro` — Chrome/148 WebView |
| Cliente QA | insumar |
| Resultado | **11 PASS · 0 FAIL · 0 SKIP · 2 N/A** |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | Título "Visitas" + 3 botones: NUEVA VISITA, RUTA DE HOY, VER MEJOR RUTA |
| DM-VIS-002 | ✅ PASS | Alert "No hay visitas pendientes para trazar ruta." · app no colapsa |
| DM-VIS-003 | ✅ PASS | Formulario abre con ACTIVIDADES/ADJUNTOS `disabled`; sin cliente seleccionado |
| DM-VIS-004 | ✅ PASS | Lista RUTA DE HOY con searchbar visible; lista vacía sin error ni overlay |
| DM-VIS-006 | ✅ PASS | Alert "¿Desea borrar la visita?..." → ACEPTAR → "Se eliminó la visita de manera exitosa"; visita desaparece |
| DM-VIS-010 | ✅ PASS | Cliente ADRIAN ARLET BASTARDO ALONZO (Cód 2738) seleccionado; Sucursal cargada; tabs ACTIVIDADES/ADJUNTOS habilitadas |
| DM-VIS-014 | ✅ PASS | Modal "Agregar" abre con selector Actividad, Motivo (condicional), campo Comentario, botones CANCELAR/AGREGAR |
| DM-VIS-015 | ✅ PASS | Técnica S2v: popover click → selección actividad via coordinates + pg.keyboard.type() → evento aparece en lista ACTIVIDADES |
| DM-VIS-019 | ✅ PASS | Alert "La visita se ha guardado"; formulario permanece abierto |
| DM-VIS-020 | ✅ PASS | Alert "¿Desea enviar la visita?" → ACEPTAR → "Su Visita será enviada"; navega a home módulo; visita **Nro Ref.: 756** — Estatus: Visitado |
| DM-VIS-021 | ✅ PASS | Alert "¡Alerta!" con 3 opciones: "Guardar y salir / Salir sin guardar / Cancelar" |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" en visita nueva nunca guardada → NO aparece en RUTA DE HOY |
| DM-VIS-023 | ✅ PASS | Formulario editable al abrir visita Guardada; 3 tabs habilitadas; guardar/enviar activos |
| DM-VIS-025 | 🚫 N/A | Lista RUTA DE HOY vacía al inicio — sin visitas sincronizadas desde backend hoy (smoke_na_estructural) |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 → N/A |
| DM-VIS-031 | ✅ PASS | "Guardar y salir" → alert "La visita se ha guardado" → navega home módulo; visita en RUTA DE HOY Estatus: Guardado con evento (MERCHANDISING/VISIBILIDAD PDV) |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos: 3 acordeones — Imágenes + Archivo (userCanUploadFiles=true) + **Firma** (signatureVisit=true confirmado) |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro Ref. 756 | Visita ADRIAN ARLET BASTARDO ALONZO · Fecha 2026-06-03 · Actividad: MERCHANDISING / Evento: VISIBILIDAD PDV + COBRANZA / COBRANZA EFECTIVA | Enviada (Visitado) |
| Nro Ref. 0 (local) | Visita ADRIAN ARLET BASTARDO ALONZO · Actividad: MERCHANDISING / VISIBILIDAD PDV | Eliminada (DM-VIS-006) |

---

## Hallazgos y patrones nuevos

### Patrones descubiertos

1. **`visitas_back_requiere_mouse_click_coords`** — `dispatchEvent(MouseEvent)` en `img.fechaAtras` no dispara el Angular router. Usar `getBoundingClientRect()` + `pg.mouse.click(coords)` en todos los módulos (patrón ya aplicado en Pedidos/Cobros).

2. **`visitas_ion_select_actividad_es_objeto`** — El valor del ion-select de Actividad es un objeto `{idType, naType, requiredEvent, requiredSignature}`, no un string plano. Asignar via `sel.value = 'STRING'` no funciona para ngModel — debe usarse click directo en el ítem del popover vía `pg.mouse.click(coords)`.

3. **`visitas_motivo_condicional_requiredEvent`** — El select de Motivo aparece solo cuando `actividad.requiredEvent = "true"` (ej. COBRANZA, MERCHANDISING). Para actividades como VISITA SIN ACCION no hay Motivo.

4. **`visitas_delete_con_confirmacion`** — Botón basura en visita Guardada muestra alert "¿Desea borrar la visita? Esta acción no se puede deshacer." con CANCELAR/ACEPTAR (no borrado directo).

5. **`visitas_actividades_no_persisten_al_reabrir_si_usaron_asignacion_programatica`** — Si ion-select Actividad se asigna via `.value = 'STRING'` + CustomEvent (sin click en popover), el ngModel no se actualiza y la actividad se guarda con nombre vacío; al reabrir la visita la lista muestra vacío.

6. **`visitas_agregar_btn_in_modal_coordenadas_frescas`** — El botón AGREGAR en el modal cambia de y-coordinate según si hay 1 o 2 selects visibles (Actividad sola vs Actividad+Motivo). Siempre obtener coordenadas con getBoundingClientRect() frescos antes de hacer click.

7. **`visitas_signatureVisit_true`** — Confirmado: acordeón "Firma" visible en Tab Adjuntos para insumar. `signatureVisit: true`.

### Notas adicionales

- La actividad `COBRANZA` tiene `requiredSignature: "false"` (no requiere firma de cliente en esa actividad específica, aunque el acordeón Firma sí existe en la visita).
- El botón Enviar aparece habilitado sin requerir al menos una actividad (pattern DM-VIS-020 conocido) — la validación ocurre al confirmar.
- Visitas con estatus "Visitado" (ya enviadas) NO tienen botón trash en la lista.

---

## smoke_na_estructural confirmado (visitas)

```yaml
smoke_na_estructural:
  - "DM-VIS-025: sin visitas sincronizadas desde backend hoy — lista RUTA DE HOY vacía al inicio de corrida"
  - "DM-VIS-026: depende de DM-VIS-025 → N/A"
```

---

*Generado: 2026-06-03 · Agente QA · RUN_ID 20260603_093706_smoke-completo*
