# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260707_175334_smoke-completo` |
| Módulo | VISITAS |
| Dispositivo | `14678405BR003855` (Infinix X6728 · Android 15 · WebView 149) |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | ferrenuestro (Isla Coche · `denarioislacoche.ddns.net:8081`) |
| Cliente de prueba | TORNICAGUA, C.A. (co_client 121793873 · id_client 504 · CON sucursal) |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 2 N/A |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | `/visitas` (app-visitas) con 3 botones: NUEVA VISITA · RUTA DE HOY · Ver mejor ruta |
| DM-VIS-003 | ✅ PASS | NUEVA VISITA → `/visita`; tab GENERAL habilitada, ACTIVIDADES y ADJUNTOS `disabled`; cliente vacío |
| DM-VIS-004 | ✅ PASS | RUTA DE HOY → `/listaVisitas` (app-lista-visita), searchbar visible, lista vacía sin error |
| DM-VIS-006 | ✅ PASS | Basura en visita Guardada (Ref 0) → alert "¿Desea borrar la visita? Esta acción no se puede deshacer." (CANCELAR/Aceptar) → Aceptar → "Se eliminó la visita de manera exitosa" → fila desaparece |
| DM-VIS-010 | ✅ PASS | Modal cliente: buscar TORNICAGUA + ícono `search-circle-sharp` → seleccionar → tabs ACTIVIDADES y ADJUNTOS habilitan; cliente="TORNICAGUA, C.A. (121793873)"; sucursal cargada (idAddressClient 67213) |
| DM-VIS-014 | ✅ PASS | AÑADIR ACTIVIDAD/EVENTO → ion-modal con selector Actividad, selector Motivo, campo Comentario, botones CANCELAR/Agregar |
| DM-VIS-015 | ✅ PASS | Actividad MERCHANDISING (47) + Motivo ENTREGA DE MUESTRAS (153) + comentario → Agregar → "Actividad: MERCHANDISING Evento: ENTREGA DE MUESTRAS Observación: Test-VIS-015-081500" en lista Tab Actividades |
| DM-VIS-019 | ✅ PASS | Botón Guardar cabecera (`.imagenGuardar`) → alert "La visita se ha guardado" (OK); formulario permanece abierto |
| DM-VIS-020 | ✅ PASS | Enviar (`.imagenEnviar`) con 1 evento → "¿Desea enviar la visita?" (CANCELAR/Aceptar) → Aceptar → "Su Visita será enviada" (OK) → navega a `/visitas`. Aparece como Ref 5 "Visitado". **BD-OK** (ver §Verificación BD). Modal confirmación antes de validar actividades = UX conocido (RUNTIME §5) |
| DM-VIS-021 | ✅ PASS | Atrás con cambios sin guardar (cliente + 1 evento) → modal "¡Alerta!" con Guardar y salir / Salir sin guardar / Cancelar |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" sobre visita NUEVA nunca guardada → no aparece en RUTA DE HOY (0 Guardado nuevos; solo Ref 5 Visitado) |
| DM-VIS-023 | ✅ PASS | Click en visita Guardada (Ref 0) → `/visita` editable; 3 tabs habilitadas; cliente cargado; botones Guardar/Enviar activos (no disabled) |
| DM-VIS-025 | 🚫 N/A | RUTA DE HOY sin visitas "No Visitado" sincronizadas desde backend hoy (solo Visitado/Guardado propias) → no hay INICIAR VISITA que probar |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 (N/A) |
| DM-VIS-031 | ✅ PASS | Guardar visita con evento → reabrir desde RUTA DE HOY → Tab Actividades muestra "MERCHANDISING / ENTREGA DE MUESTRAS / Test-VIS-031-081932" (round-trip §9: evento persiste) |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos: acordeones **Imágenes** (BUSCAR/TOMAR FOTO) + **Archivo** (Subir Archivo); **SIN Firma** — coherente con `userCanUploadFiles=true` y `signatureVisit=false` (VG verificada en UI) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **5** | Visit A · TORNICAGUA (idClient 504) · 1 evento MERCHANDISING/ENTREGA DE MUESTRAS · coVisit 1783513016857.0 | **Enviado** (BD-OK · id_visit=5 · st_visit=2 · is_visited=true · inc=1) |
| 0 | Visit B · TORNICAGUA · 1 evento (Test-VIS-031-081932) · Guardado, reabierto (DM-VIS-023/031) | **Guardado** y luego **BORRADO** (DM-VIS-006 · nunca llegó a la nube) |
| — | Visit C · TORNICAGUA · nueva sin guardar (DM-VIS-022) → "Salir sin guardar" | Descartada (no persiste — correcto) |

## Verificación BD

Baseline pre-corrida (nube): `visit` max id_visit=4 (id 2-4 st_visit=3, inc=0).

Tras Enviar (DM-VIS-020), poll ~8s → nube:
```
id_visit=5 · co_visit=1783513016857.0 · st_visit=2 · is_visited=true · inc=1
```
- **BD-OK**: la visita enviada SÍ llegó a la nube (baseline 4→5). El payload capturado (`visitservice/visit` POST) coincide 1:1: coVisit, idClient 504, visitDetails[coType=47, coCause=153, txDescription "Test-VIS-015-081500"], isVisited=true.
- **Correlación Ref↔id confirmada**: la UI muestra "Nro Ref.: 5" para esta visita = `id_visit=5` (PK servidor). `inc=1` = 1 actividad agregada por UI.
- `st_visit=2` = Enviado en ferrenuestro (igual que piercar; visitas usan tabla de estados propia, distinta del st=1 de pedidos/cobros).
- ⚠ **Contradice la advertencia de no-persistencia de la playa**: en VISITAS el envío SÍ persiste en la nube (a diferencia de devoluciones/inventarios/depósitos que quedaron "Por Enviar" en esta corrida). Payload capturado por hook `nativePromise` (CapacitorHttp POST). Anexado a `_payloads.jsonl`.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Modal cliente filtra al pulsar ícono `search-circle-sharp` (NO realtime) | universal (confirmar) | En ferrenuestro escribir en `.search-input` NO filtra; hay que `mouse.click` en `ion-modal.show-modal ion-icon[name="search-circle-sharp"]` (x≈325,y≈95) para aplicar el filtro. Refina nota `.clear-search` de `[gmp-2606]` |
| Back = 1 sola `img.fechaAtras`, `mouse.click(32,31)` engancha | cliente ferrenuestro | A diferencia de jerez (2 apiladas, `.click()` nativo): aquí 1 sola visible, `getBoundingClientRect+mouse.click` (~32,31) dispara dirty-guard y navega (patrón insumar `[ins-2610]`) |
| VISITAS envío persiste a la nube en ferrenuestro | cliente ferrenuestro | Pese a la no-persistencia de otros módulos de la playa, `visitservice/visit` POSTea y llega (id_visit=5). Hook `nativePromise` captura el payload |
| `#clienteSelect.click()` nativo abre modal cliente | universal (confirmar) | `.click()` DOM sobre `#clienteSelect` abre el modal fiablemente en ferrenuestro |

> ✅ consolidado 2026-07-07 → modal-cliente-search-icon (tag en selector), back-1-sola-fechaAtras, visitas-persiste-inmediato en `module-selectors/visitas.md` Notas por cliente; actividades(12)/motivos/signatureVisit + cliente_test en `ferrenuestro.yaml modules.visitas`.

## Datos descubiertos (para YAML del cliente)

- **cliente_test visitas**: `TORNICAGUA, C.A.` · co_client 121793873 · id_client 504 · CON sucursal (idAddressClient 67213, coAddressClient 4890, sin coordenadas → dispara alert "¿Desea agregarlas?" al SELECCIONAR; dismiss botón vacío idx 0, no bloquea).
- **Actividades (12, TODAS `requiredEvent="true"`, `requiredSignature="false"`)**: NO VISITO (2), MERCHANDISING (47), NO COMPRO (71), VISITA FUERA DE RUTA (75), COBRANZA (82), INFO DE CLIENTES (83), COBRANZA NO EFECTIVA (84), VENTA EN RUTA (85), EVENTOS (86), REUNION CON CLIENTE (87), Cuestonario (90), Cambio X Cambio (92).
- **Motivos MERCHANDISING (47)**: ENTREGA DE MUESTRAS (153), LEVANTAMIENTO DATA ISSY (183), VISIBILIDAD PDV (184), PLAN SLIP (191), MUESTRA NUEVO CATALOGO (192).
- **VG verificada en UI**: `signatureVisit=false` confirmado (Tab Adjuntos sin acordeón Firma); `userCanUploadFiles=true` confirmado (acordeón Archivo presente). 0 discrepancias dump↔UI.

## Verificación BD (payload ↔ nube) — Agente BD (cotejo campo-a-campo)

| co_visit | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| 1783513016857.0 | BD-FIELD-OK | 21/21 OK | incidence 1/1 | 0 | 3 notas TZ (da_visit, da_initial, da_real): hora local UTC-4 vs nube UTC, mismo día → nota |

**Cabecera (21 campos OK):** co_visit, da_visit, coordenada, id_client, co_client, na_client, nu_sequence, id_user, co_user, co_enterprise, id_enterprise, da_initial, da_real, id_address_client, co_address_client, coordenada_saved, has_attachments, nu_attachments, is_reassigned, is_dispatched, is_visited.
**Hija incidence** (1 línea 47∙153): co_type 47, co_cause 153, tx_description "Test-VIS-015-081500" — todos OK.
**Conclusión:** la visita persistió en nube (id_visit=5) y coincide campo a campo con lo enviado (BD-FIELD-OK). Contrasta con devoluciones/inventarios/depósitos (no-persistencia).
