# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260723_172350_smoke-completo` |
| Módulo | VISITAS |
| Cliente | ferrenuestro (usuario `leidy` / `***`) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 (La Tortuga) |
| Servidor | `denariolatortuga.ddns.net:8081` (Isla La Tortuga) · `window.ng=TRUE` · sync INMEDIATA |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED** |
| Estado inicial → final | HOME → HOME ✅ |

> ⚠ Discrepancia de entorno vs YAML: el YAML `ferrenuestro.yaml` (corrida 2026-07-07) documenta servidor **Isla Coche** con `window.ng=false` y sync diferida. En esta corrida el WebView apunta a **La Tortuga** (`denariolatortuga.ddns.net`) con **`window.ng=TRUE`** y sync **inmediata** (visita enviada obtuvo correlativo de servidor Ref 2 en segundos). El APK fue re-apuntado a otra playa desde la corrida anterior.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | /visitas con 3 botones: NUEVA VISITA · RUTA DE HOY · Ver mejor ruta |
| DM-VIS-003 | ✅ PASS | NUEVA VISITA → /visita; GENERAL habilitada, ACTIVIDADES/ADJUNTOS `disabled` sin cliente |
| DM-VIS-004 | ✅ PASS | RUTA DE HOY → /listaVisitas con searchbar; ruta del día vacía ("No hay resultados") sin error |
| DM-VIS-006 | ✅ PASS | Trash en visita Guardada → "¿Desea borrar la visita?…" → Aceptar → "Se eliminó la visita de manera exitosa"; ítem desaparece |
| DM-VIS-010 | ✅ PASS | Cliente TORNICAGUA (id_client 504) seleccionado; alert coordenadas dismissible; tabs ACTIVIDADES/ADJUNTOS habilitadas |
| DM-VIS-014 | ✅ PASS | AÑADIR ACTIVIDAD/EVENTO → ion-modal con selector Actividad, Motivo, Comentario, botones CANCELAR/Agregar |
| DM-VIS-015 | ✅ PASS | MERCHANDISING(47) + ENTREGA DE MUESTRAS(153) + comentario → AGREGAR → evento visible en Tab Actividades |
| DM-VIS-019 | ✅ PASS | Guardar → alert "La visita se ha guardado"; formulario permanece abierto |
| DM-VIS-020 | ✅ PASS | Enviar → "¿Desea enviar la visita?"→Aceptar → "Su Visita será enviada"→OK → /visitas; visita queda **Ref 2 · Visitado**. **POST `visitservice/visit` CAPTURADO** |
| DM-VIS-021 | ✅ PASS | Back con cambios sin guardar → modal "¡Alerta!" con 3 botones: Guardar y salir / Salir sin guardar / Cancelar |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" en visita nueva nunca guardada → NO aparece en RUTA DE HOY |
| DM-VIS-023 | ✅ PASS | Click visita Guardada en lista → /visita editable, 3 tabs habilitadas, botones guardar/enviar activos |
| DM-VIS-025 | 🚫 N/A | Ruta de hoy sin visitas "No Visitado" sincronizadas (lista vacía en DM-VIS-004) |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 (N/A) |
| DM-VIS-031 | ✅ PASS | Visita reabierta desde RUTA DE HOY (Estatus Guardado) conserva el evento MERCHANDISING/ENTREGA DE MUESTRAS en Tab Actividades |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos: 2 acordeones **Imágenes + Archivo** (userCanUploadFiles=true); **Firma AUSENTE** (signatureVisit=false) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Ref 2 (id_visit) | TORNICAGUA (id_client 504) · evento MERCHANDISING(47)/ENTREGA DE MUESTRAS(153) · comentario `Test-VIS-015-231449` | **Enviado / Visitado** (POST capturado) |
| Ref 0 (local) | TORNICAGUA · evento COBRANZA(82)/COBRANZA EFECTIVA · `Test-VIS-006` | Guardado → **borrado** (DM-VIS-006) |
| (sin persistir) | TORNICAGUA · evento MERCHANDISING/VISIBILIDAD PDV · `Test-VIS-021` | Descartado "Salir sin guardar" (DM-VIS-022) — correcto |

## Verificación BD (§10) — BD-N/A (payload)
Cotejo por SQLite/query.js **CAÍDO** en esta corrida → cotejo por **captura de payload + UI** (marca **BD-N/A (payload)**).

- **POST `visitservice/visit` CAPTURADO** (hook `nativePromise`), 7 reintentos idempotentes (mismo `coVisit=1784862938290.0`).
- Payload ↔ UI (round-trip): `idClient=504` TORNICAGUA · `coType=47` (MERCHANDISING) · `coCause=153` (ENTREGA DE MUESTRAS) · `txDescription="Test-VIS-015-231449"` · `isVisited=true` · `stVisit=1` · `coEnterprise="00001"` · `idAddressClient=67213` · `coordenada=11.0490851,-63.8649822`.
- `hasAttachments=false` / `nuAttachments=0` — coherente con **envío sin firma** (signatureVisit=false).
- Confirmación UI adicional: tras enviar, la visita reaparece en RUTA DE HOY como **Ref 2 · Estatus Visitado** (correlativo asignado por servidor → sync inmediata confirmada).
- Payload volcado a `_payloads.jsonl` (línea `module:visitas / caso:DM-VIS-020`).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Entorno ferrenuestro migró a La Tortuga `window.ng=TRUE` | cliente | Esta corrida: `denariolatortuga.ddns.net`, `window.ng=TRUE`, sync INMEDIATA (visita → Ref 2 Visitado en segundos). Contradice YAML 2026-07-07 (Isla Coche, `window.ng=false`, sync diferida). Actualizar `ferrenuestro.yaml`/`ws_url` si el re-apuntado es permanente. |
| Alert coordenadas TORNICAGUA: idx0 vacío = **Cancelar**; "Agregar" abre modal de MAPA | cliente | Al SELECCIONAR TORNICAGUA (sin coordenadas) sale "Esta sucursal no tiene coordenadas asignadas. ¿Desea agregarlas?" botones `["","Agregar"]`. **Cerrar con idx0 (Cancelar)**; clicar "Agregar" abre `ion-modal` con `agm-map`/google-map (cerrar con `img.fechaAtras` del modal). No reaparece en Guardar/Enviar. |
| /listaVisitas: 2 `img.fechaAtras`, back = `imgs[0]` + `mouse.click(≈32,31)` | cliente | En La Tortuga aparecen 2 `img.fechaAtras` en /listaVisitas y /visita (como jerez), pero aquí el back real es `imgs[0]` con `getBoundingClientRect+mouse.click` (patrón ferrenuestro/insumar), NO `.click()` nativo de jerez. |
| RUTA DE HOY nav = `ionBtn.shadowRoot.querySelector('button').click()` | universal | Reconfirmado en La Tortuga (mismo patrón NUEVA VISITA); `component=app-lista-visita` (singular). |
| Selector Actividad/Motivo: asignar `.value` = objeto opción + `ionChange` | universal | ferrenuestro: 12 actividades todas `requiredEvent=true`; MERCHANDISING(47)→5 motivos; COBRANZA(82)→COBRANZA EFECTIVA etc. Motivo carga ~1.5s tras Actividad. |

> ✅ consolidado 20260723

## Hallazgos (FAIL)
Ninguno. 0 FAIL.

## Notas
- DM-VIS-025/026 N/A estructural del día (RUTA DE HOY sin visitas "No Visitado" sincronizadas), consistente con `smoke_na_estructural` del YAML.
- `signatureVisit=false` reconfirmado: Tab Adjuntos sin acordeón Firma; envío procede sin firma.
- Techo de intentos respetado: todos los casos en 1 intento.
