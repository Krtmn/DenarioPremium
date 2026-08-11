# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260610_180320_smoke-completo` |
| Módulo | VISITAS |
| Dispositivo | CDP `http://127.0.0.1:9220` (WebView `com.kiberno.denarioPremiumPro`) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Playa / Cliente | insumar (INSUMAR DISTRIBUIDOR, Isla Coche) |
| Cliente de prueba | ADRIAN ARLET BASTARDO ALONZO (Cód 2738) |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 2 N/A |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | Click módulo Visitas → `/visitas`, título "Visitas" + 3 botones (NUEVA VISITA, RUTA DE HOY, Ver mejor ruta) |
| DM-VIS-003 | ✅ PASS | NUEVA VISITA → `/visita`; tabs ACTIVIDADES/ADJUNTOS `disabled`, sin cliente |
| DM-VIS-004 | ✅ PASS | RUTA DE HOY → `/listaVisitas`, searchbar visible, sin overlay colgado; lista vacía al inicio sin error |
| DM-VIS-006 | ✅ PASS | Trash en visita Guardado → alert "¿Desea borrar la visita?…" → Aceptar → "Se eliminó la visita de manera exitosa"; visita desaparece |
| DM-VIS-010 | ✅ PASS | Cliente seleccionado en modal → 3 tabs habilitadas; Sucursal "DESPACHAR EN EL CLIENTE LEONELA URIEPERO" cargada |
| DM-VIS-014 | ✅ PASS | AÑADIR ACTIVIDAD/EVENTO → modal "Agregar" con select Actividad, campo Comentario y botones CANCELAR/Agregar |
| DM-VIS-015 | ✅ PASS | Actividad=VISITA SIN ACCION + Motivo=NEGOCIO CERRADO + Comentario=Test-VIS-180320 → AGREGAR → evento en lista Tab Actividades |
| DM-VIS-019 | ✅ PASS | Guardar (`.imagenGuardar`) → alert "Denario — La visita se ha guardado"; formulario permanece abierto |
| DM-VIS-020 | ✅ PASS | Enviar (`.imagenEnviar`) con evento → "¿Desea enviar la visita?" → "Su Visita será enviada" → navega a home; visita sincroniza como Nro Ref. 763 "Visitado" |
| DM-VIS-021 | ✅ PASS | Atrás con cambios sin guardar (cliente + evento) → modal "¡Alerta!" con Guardar y salir / Salir sin guardar / Cancelar |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" sobre visita nueva nunca guardada → NO aparece en RUTA DE HOY (sin nueva fila "Guardado") |
| DM-VIS-023 | ✅ PASS | Click en visita Guardada → reabre editable `/visita`, 3 tabs habilitadas, botones Guardar/Enviar activos |
| DM-VIS-025 | 🚫 N/A | Lista RUTA DE HOY vacía al inicio — sin visitas "No Visitado" sincronizadas desde backend hoy (per `smoke_na_estructural`) |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 → N/A (sin INICIAR VISITA disponible) |
| DM-VIS-031 | ✅ PASS | Round-trip: visita Guardada (Nro Ref. 0) en RUTA DE HOY con Estatus Guardado; al reabrir conserva "VISITA SIN ACCION / NEGOCIO CERRADO / Test-VIS-180320" |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos: 3 acordeones — Imágenes (BUSCAR/TOMAR FOTO) + Archivo (userCanUploadFiles=true) + Firma (signatureVisit=true) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro Ref. 763 | Visita ADRIAN ARLET BASTARDO ALONZO (2738) — 1 evento VISITA SIN ACCION / NEGOCIO CERRADO / Test-VIS-180320 | **Enviada** (Visitado, sincronizada). Persiste en sistema. |
| Nro Ref. 0 (guardada, luego eliminada) | Visita Guardada con evento Test-VIS-180320-del (creada para DM-VIS-006) | **Eliminada** ("Se eliminó la visita de manera exitosa") |
| (no guardada) | Visita nueva con evento Test-VIS-180320-b (creada para DM-VIS-021/022) | **Descartada** con "Salir sin guardar" — no persiste (correcto) |

Nota: queda 1 visita en RUTA DE HOY al cierre — Nro Ref. 763 "Visitado" (la enviada). Comportamiento esperado.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Módulo Visitas en HOME | universal | Entrada es `a.ion-text-center` con texto "Visitas" dentro de `ion-col` (coords ~74,250); `pg.mouse.click` navega a `/visitas` |
| RUTA DE HOY botón | universal | `a`/`ion-col` con texto "RUTA DE HOY" (largo <30); `pg.mouse.click` real navega a `/listaVisitas` |
| Item lista RUTA DE HOY | universal | Formato `Nro Ref.: N · Cliente: COD - NOMBRE · Estatus: Guardado/Visitado · Fecha:`; trash (`ion-button[color="danger"]`) presente solo en filas "Guardado", no en "Visitado" |
| Borrar visita Guardado | universal | Trash dentro del `ion-item`/`ion-card` con `Estatus: Guardado` → alert "¿Desea borrar la visita? Esta acción no se puede deshacer." CANCELAR/Aceptar → "Se eliminó la visita de manera exitosa" |
| Alert Enviar visita | cliente (insumar) | Secuencia 2 alertas: "¿Desea enviar la visita?" (CANCELAR/Aceptar) → "Su Visita será enviada" (OK) → navega a `/visitas` |
| Dirty-guard back en visita | universal | `img.fechaAtras` con `getBoundingClientRect()+mouse.click()` (coords ~31,31) SÍ dispara el modal "¡Alerta!" Guardar y salir/Salir sin guardar/Cancelar cuando hay cambios sin guardar; con visita ya Guardada y sin cambios NO aparece modal (sale directo). Confirma anti-patrón: dispatchEvent NO navega ni dispara guard |
| Selector Actividad insumar | cliente (insumar) | TODAS las actividades tienen `requiredEvent:"true"` → campo Motivo siempre requerido (idTypes 2,47,71,75,82,83,84,85,86,87,88). Motivo de "VISITA SIN ACCION" = única opción "NEGOCIO CERRADO" |
| Reabrir visita Guardada — tabs | universal | Al reabrir, las tabs ACTIVIDADES/ADJUNTOS aparecen momentáneamente `disabled` durante render inicial (~1.5s) y luego se habilitan; no es bug, es render asíncrono. Verificar tras espera antes de marcar FAIL |
| RUTA DE HOY tras enviar | universal | La visita enviada sale de la lista de pendientes offline y reaparece tras sync como Nro Ref. real con Estatus "Visitado" |

> ✅ consolidado 2026-06-10

## Hallazgos (solo si hay FAIL)

Ninguno. Sin FAIL en esta corrida.

### Notas operativas
- `require()` no disponible en `browser_run_code_unsafe` → helpers inlinados verbatim per RUNTIME §1.
- DM-VIS-020 (defecto conocido RUNTIME §5: modal confirmación antes de validar) no se reprodujo como bloqueante: como había ≥1 actividad, el envío fue correcto. No se probó envío sin actividades.
- Selección de cliente en modal: el `<p>` del nombre a veces no está renderizado al primer intento tras la búsqueda; reintentar el click (o re-disparar búsqueda) lo resuelve.
