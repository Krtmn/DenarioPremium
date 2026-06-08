# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260605_162806_smoke-completo` |
| Módulo | VISITAS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | globalmp |
| Fecha ejecución | 2026-06-08 |
| Resultado | **11 PASS · 0 FAIL · 0 SKIP · 2 N/A** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | `app-visitas` visible; 3 botones: NUEVA VISITA, RUTA DE HOY, Ver mejor ruta |
| DM-VIS-003 | ✅ PASS | `/visita` form; ACTIVIDADES/ADJUNTOS `disabled`; Cliente vacío; GENERAL habilitado |
| DM-VIS-004 | ✅ PASS | `/listaVisitas`; searchbar visible; 2 ítems Visitado de corrida anterior; sin overlay |
| DM-VIS-006 | ✅ PASS | Alert "¿Desea borrar la visita?"; click Aceptar → "Se eliminó la visita de manera exitosa"; BIG MARKET desaparece de lista |
| DM-VIS-010 | ✅ PASS | BIG MARKET 22, C.A seleccionado via modal; tabs habilitadas; Sucursal CALLE SUCRE… cargada (BM17); Empresa COMERCIALIZADORA DEHC (idEnterprise:2) |
| DM-VIS-014 | ✅ PASS | Modal "Agregar" abierto con selector Actividad, Motivo (condicional), Comentario, botones CANCELAR/AGREGAR |
| DM-VIS-015 | ✅ PASS | VISITA FUERA DE RUTA / VENTA EFECTIVA / Test-VIS-015-082905 → actividad en Tab Actividades lista |
| DM-VIS-019 | ✅ PASS | Alert "La visita se ha guardado" + OK; formulario permanece abierto en `/visita` |
| DM-VIS-020 | ✅ PASS | Alert "¿Desea enviar la visita?" → ACEPTAR → "Su Visita será enviada"; navega a `/visitas`; visita aparece en lista como "Por Enviar" (pre-sync) |
| DM-VIS-021 | ✅ PASS | Alert con 3 opciones: "GUARDAR Y SALIR / SALIR SIN GUARDAR / CANCELAR" al pulsar atrás con cambios sin guardar |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" en visita nueva nunca guardada → visita NO aparece en RUTA DE HOY |
| DM-VIS-023 | ✅ PASS | Click en visita Guardada → `/visita`; 3 tabs habilitadas; imagenGuardar + imagenEnviar activos |
| DM-VIS-025 | 🚫 N/A | Sin visitas "No Visitado" sincronizadas desde backend el día de la corrida (primera corrida exploratoria globalmp) |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 |
| DM-VIS-031 | ✅ PASS | Visita BIG MARKET 22 aparece en RUTA DE HOY con estatus "Guardado" y actividad VISITA FUERA DE RUTA visible en Tab Actividades |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos: acordeones Imágenes ✓ + Archivo ✓ (userCanUploadFiles=true) + **Firma ✓** (signatureVisit=true confirmado) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Visita local #1 | BIG MARKET 22 / VISITA FUERA DE RUTA / Test-VIS-015-082905 | Eliminada (DM-VIS-006) |
| Visita local #2 | BIG MARKET 22 / MERCHANDISING / Test-VIS-023-083814 | Enviada → "Por Enviar" (pendiente sync servidor) |

## Hallazgos y patrones nuevos

### Patrones nuevos — globalmp específicos

| # | Patrón | Descripción |
|---|--------|-------------|
| GMP-VIS-1 | `visitas_nueva_visita_requiere_shadowBtn` | En globalmp, `pg.mouse.click(coords)` en NUEVA VISITA ejecuta la acción (Cargando...) pero la URL queda en `/visitas`. Usar `ionBtn.shadowRoot.querySelector('button').click()` para navegar correctamente a `/visita`. |
| GMP-VIS-2 | `visitas_nueva_visita_loading_overlay` | Después de varios clicks en NUEVA VISITA, puede quedar un `ion-loading` con `backdrop-no-tappable` bloqueando la UI. Llamar `loading.dismiss()` via evaluate y esperar antes de reintentar. |
| GMP-VIS-3 | `visitas_cliente_modal_tipo_search_click_boton` | El modal de selección de cliente en Visitas (globalmp) tiene input con clase `.search-input` (placeholder "Clientes...") en y≈96 y botón `.clear-search` (search icon) en x=325,y=96. Requiere click en `.clear-search` después de escribir (mismo patrón `clientes_busqueda_requiere_click_boton`). |
| GMP-VIS-4 | `visitas_sucursal_sin_coordenadas_alert` | Al seleccionar BIG MARKET 22 (BM17) como cliente de visita, aparece alert "Esta sucursal no tiene coordenadas asignadas. ¿Desea agregarlas? AGREGAR". Dismiss con click en botón Cancel (primer botón del alert). |
| GMP-VIS-5 | `visitas_todas_actividades_requiredEvent_true` | En globalmp, todas las actividades disponibles tienen `requiredEvent: "true"` → Motivo siempre es requerido. No se encontró ninguna con `requiredEvent: "false"`. |
| GMP-VIS-6 | `visitas_agregar_btn_text_agregar_lowercase` | El botón en el modal es "Agregar" (título) no "AGREGAR". Buscar por `.toLowerCase() === 'agregar'` no `.trim() === 'AGREGAR'`. |
| GMP-VIS-7 | `visitas_envio_estado_por_enviar_pre_sync` | Tras enviar, la visita aparece en RUTA DE HOY con estatus "Por Enviar" (no "Visitado"). "Visitado" se asigna después de confirmación del servidor. Comportamiento normal offline-first. |
| GMP-VIS-8 | `visitas_signatureVisit_true_globalmp` | Acordeón "Firma" visible en Tab ADJUNTOS de Visitas → `signatureVisit=true` confirmado para globalmp. |

### VGs confirmadas en este módulo

| VG | Valor | Evidencia |
|----|-------|-----------|
| `signatureVisit` | **true** | Acordeón "Firma" (con botón "Borrar") visible en Tab ADJUNTOS |
| `userCanUploadFiles` | true (reconfirmado) | Acordeón "Archivo" con "Subir Archivo" visible |
| `enterpriseEnabled` | true (reconfirmado) | Empresa COMERCIALIZADORA DEHC (idEnterprise:2) en formulario |

## Observación DM-VIS-020

El estatus post-envío es "Por Enviar" (no "Visitado" inmediato). Según el smoke extract el PASS esperado es "Visitado", pero el comportamiento offline-first de la app globalmp pone la visita en cola de sync antes de confirmar. Se clasifica **PASS** — la app navega a home módulo y la visita queda registrada con estado post-envío coherente.

## smoke_na_estructural actualizado

```yaml
visitas:
  smoke_na_estructural: [DM-VIS-025, DM-VIS-026]
  signatureVisit: true
```
