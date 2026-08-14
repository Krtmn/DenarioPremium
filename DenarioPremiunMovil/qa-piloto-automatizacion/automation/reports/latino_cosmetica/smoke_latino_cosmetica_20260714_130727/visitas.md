# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260714_130727_smoke-completo` |
| Módulo | VISITAS |
| Cliente | latino_cosmetica (usuario `001`, ***) |
| Servidor | La Tortuga (`denariolatortuga.ddns.net:8081`) · `window.ng=TRUE` · sync inmediata/persistente |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 (build El Yaque, `window.ng=true` como dm-electronica) |
| Cliente de prueba | **ANNELI CA (13)** — idClient 34, idAddressClient 6631, CON coordenadas (sin alert de coordenadas) |
| Ruta de hoy | VACÍA al inicio ("No hay resultados"); poblada con las visitas creadas durante la corrida |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED** |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | Título "Visitas" + 3 botones NUEVA VISITA · RUTA DE HOY · VER MEJOR RUTA |
| DM-VIS-003 | ✅ PASS | NUEVA VISITA → /visita; tabs GENERAL habilitada, ACTIVIDADES/ADJUNTOS `disabled`; sin cliente |
| DM-VIS-004 | ✅ PASS | RUTA DE HOY → /listaVisitas (comp `app-lista-visita`), searchbar visible, lista vacía "No hay resultados" sin error |
| DM-VIS-006 | ✅ PASS | Basura en visita Guardada → "¿Desea borrar la visita? Esta acción no se puede deshacer." → Aceptar → "Se eliminó la visita de manera exitosa" → desaparece |
| DM-VIS-010 | ✅ PASS | Modal cliente → ANNELI CA (13) → tabs ACTIVIDADES/ADJUNTOS habilitadas; sucursal cargada; sin alert de coordenadas |
| DM-VIS-014 | ✅ PASS | AÑADIR ACTIVIDAD/EVENTO → `ion-modal.modalActividades` con 2 ion-select (Actividad+Motivo), comentario, botones CANCELAR/Agregar |
| DM-VIS-015 | ✅ PASS | MERCHANDISING + VISIBILIDAD PDV + comentario → "Actividad: MERCHANDISING Evento: VISIBILIDAD PDV Observación: Test-VIS-015-163223" en Tab Actividades |
| DM-VIS-019 | ✅ PASS | Guardar → alert "La visita se ha guardado"; formulario permanece abierto (/visita, botón Enviar visible) |
| DM-VIS-020 | ✅ PASS | Enviar → "¿Desea enviar la visita?" (Aceptar) → "Su Visita será enviada" (OK) → "Visita nro. 100 enviada exitosamente" → navega a /visitas. ⚠ Envió **SIN firma** pese a `signatureVisit=true` (defecto conocido DM-VIS-020, NO FAIL) |
| DM-VIS-021 | ✅ PASS | Atrás con cambios sin guardar (cliente + evento) → modal "¡Alerta!" con 3 botones: **Guardar y salir / Salir sin guardar / Cancelar** |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" sobre visita **nueva nunca guardada** → NO aparece en RUTA DE HOY (solo queda Nro 100). Comportamiento correcto |
| DM-VIS-023 | ✅ PASS | Click en visita Guardada (Nro 0) → form editable /visita; 3 tabs habilitadas; cliente cargado; botones guardar/enviar activos |
| DM-VIS-025 | 🚫 N/A | Sin visitas "No Visitado" sincronizadas desde backend hoy (ruta del día vacía; condición de dato) |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 (N/A) — no hay INICIAR VISITA que ejercer |
| DM-VIS-031 | ✅ PASS | Visita Guardada reabierta desde RUTA DE HOY muestra el evento "Actividad: MERCHANDISING Evento: PLAN SLIP Observación: Test-VIS-031-164319" (Guardado CON evento) |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos: acordeones **Imágenes** (BUSCAR/TOMAR FOTO), **Archivo** (`userCanUploadFiles=true`), **Firma** (`signatureVisit=true`) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Visita **Nro 100** | ANNELI CA (13) · 1 evento MERCHANDISING/VISIBILIDAD PDV · obs Test-VIS-015-163223 | **ENVIADA** (Visitado) — persistió en nube |
| Visita Nro 0 (temporal) | ANNELI CA (13) · 1 evento MERCHANDISING/PLAN SLIP · obs Test-VIS-031-164319 | Guardada → reabierta (VIS-023/031) → **BORRADA** en VIS-006 |
| Visita nueva (temporal) | ANNELI CA (13) · 1 evento COBRANZA/COBRANZA EFECTIVA · obs Test-VIS-022 | Descartada en VIS-022 ("Salir sin guardar") — NO persiste |

## Verificación BD
Round-trip UI→servidor de la visita enviada (RUNTIME §10):

| Registro | Marca | Fila nube | Payload (visitservice/visit) | Conclusión |
|----------|-------|-----------|------------------------------|------------|
| Visita Nro 100 | **BD-OK / BD-FIELD-OK** | `id_visit=100`, `co_visit=1784061179544.0`, `st_visit=2` (Enviado), `is_visited=true`, `inc=1` (1 incidence) | idClient=34, coClient="13" ANNELI CA, coordenada 11.0490849,-63.8649992, visitDetails[0]: coIncid=1, coType=47 (MERCHANDISING), coCause=184 (VISIBILIDAD PDV), txDescription="Test-VIS-015-163223" | Lo guardado se envió íntegro. UI "Visita nro. 100" = `id_visit=100` (correlación Nro.Ref = id_visit confirmada). Hook `nativePromise` capturó el payload (BD-FIELD, cabecera+incidence cuadran) |

- Baseline pre-envío: `max(id_visit)=99`. Post-envío: id_visit=100 nuevo (>baseline), sin duplicados.
- `payloads` en `_payloads.jsonl` (1 POST visitservice/visit dedup por coVisit).

## Datos del cliente — actividades latino_cosmetica
- **11 actividades, TODAS `requiredEvent="true"` / `requiredSignature="false"`** (mismo set El Yaque que jerez/ferrenuestro/dm-electronica): NO VISITO, MERCHANDISING, NO COMPRO, VISITA FUERA DE RUTA, COBRANZA, INFO DE CLIENTES, +5.
- MERCHANDISING (idType 47) → 5 motivos: ENTREGA DE MUESTRAS, LEVANTAMIENTO DATA ISSY, VISIBILIDAD PDV (184), PLAN SLIP, MUESTRA NUEVO CATALOGO.
- COBRANZA (82) → motivos incl. COBRANZA EFECTIVA.
- Selector Motivo carga diferida (~1.8 s tras asignar Actividad).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Componente lista RUTA DE HOY = `app-lista-visita` (singular) | universal | En La Tortuga v6.6.18 el componente activo de /listaVisitas es `app-lista-visita`, NO `app-listaVisitas`. Los ítems son `ion-item` con textContent "Nro Ref.: N Cliente: COD - NOMBRE Estatus: Visitado/Guardado Fecha:". Trash = 2× `ion-button[color="danger"]` solo en filas Guardado |
| Entrada HOME Visitas por `a/ion-col/ion-label` texto exacto "Visitas" + `mouse.click` | universal | En build La Tortuga navega a /visitas de forma fiable |
| NUEVA VISITA / RUTA DE HOY vía `ionBtn.shadowRoot.querySelector('button').click()` | universal | Confirmado en latino_cosmetica (La Tortuga) — reafirma `[gmp-2611][prc-2606]` |
| `#clienteSelect.click()` nativo abre modal; selección por click al centro del `<p>` nombre exacto | universal | Reafirma `[gmp-2611]`; ANNELI CA seleccionada sin fallar |
| Back = 1 sola `img.fechaAtras`, `getBoundingClientRect+mouse.click(≈x,y)` engancha dirty-guard | cliente/build | La Tortuga v6.6.18 se comporta como ferrenuestro/dm-electronica (1 sola, mouse.click), NO como jerez (2 apiladas). Dirty-guard "¡Alerta!" 3 botones confirmado |
| latino_cosmetica: ANNELI CA (13) CON coordenadas | cliente | NO dispara alert "sucursal sin coordenadas" al seleccionar ni al Guardar/Enviar (a diferencia de dm-electronica cliente 00001) |
| Envío sin firma pese a `signatureVisit=true` | universal (defecto DM-VIS-020) | Reconfirmado en latino_cosmetica — se suma a piercar/dm-electronica |

> ✅ consolidado 20260714

## Hallazgos (FAIL)
Ninguno. 0 FAIL.

## Notas de ejecución
- `window.ng=TRUE` en este build El Yaque de La Tortuga (igual que dm-electronica, contrasta jerez/ferrenuestro con `window.ng=false`).
- GPS: `userMustActivateGPS=true` pero NO bloqueó ninguna transacción; ningún diálogo nativo Android de permiso GPS interrumpió (0 BLOCKED). Coordenada real capturada en el payload (11.0490849,-63.8649992).
- Estado inicial HOME → estado final HOME ✅.
- Baseline (Ola 0): ~34 tool-uses del módulo (browser_run_code_unsafe + 4 consultas Bash BD); duración del módulo ≈ 18 min.

## Verificación BD (payload ↔ nube · campo-a-campo · Agente BD)

| co_x | Marca | Cabecera | Hijas | Mismatches | Notas |
|------|-------|----------|-------|------------|-------|
| 1784061179544.0 | BD-FIELD-OK | 21/21 OK | incidence 1/1 (47·184) | 0 | zona horaria en da_visit/da_initial/da_real (esperado) |

**Visita #100 (ANNELI CA 13, MERCHANDISING/VISIBILIDAD PDV): enviada→íntegra en nube.** 21/21 campos cabecera + 1 incidence coinciden. Cero mismatches reales.
