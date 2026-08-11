# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260713_115814_smoke-completo` |
| Módulo | VISITAS |
| Dispositivo | Infinix HOT 60i (Infinix X6728) · da9f78b6e785fffc |
| App | `com.kiberno.denarioPremiumPro` — El Yaque DM ELECTRONIC v6.6.18 |
| Playa / Cliente | dm-electronica (BOTZ) · usuario 002 (idUser 475, coEnterprise BARAK_A) |
| Estado inicial / final | HOME / HOME ✅ |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED** |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | `/visitas`, título "Visitas" + 3 botones NUEVA VISITA / RUTA DE HOY / VER MEJOR RUTA |
| DM-VIS-003 | ✅ PASS | NUEVA VISITA → `/visita`; tab GENERAL habilitada, ACTIVIDADES/ADJUNTOS `disabled`; sin cliente |
| DM-VIS-004 | ✅ PASS | RUTA DE HOY → `/listaVisitas`, searchbar visible, lista del día vacía sin error/overlay |
| DM-VIS-006 | ✅ PASS | Basura en visita Guardada → "¿Desea borrar la visita?…" → Aceptar → "Se eliminó la visita de manera exitosa"; ítem desaparece |
| DM-VIS-010 | ✅ PASS | Cliente "+ QUE MUEBLES UN SUENO, C.A (00001)" → tabs ACTIVIDADES y ADJUNTOS habilitadas, sucursal cargada |
| DM-VIS-014 | ✅ PASS | "AÑADIR ACTIVIDAD/EVENTO" → modal con 2 ion-select (Actividad+Motivo), campo Comentario, botones CANCELAR/AGREGAR |
| DM-VIS-015 | ✅ PASS | Evento agregado y visible: "Actividad: MERCHANDISING · Evento: ENTREGA DE MUESTRAS · Observación: Test-VIS-015-142412" |
| DM-VIS-019 | ✅ PASS | Guardar (con evento) → alert "La visita se ha guardado"; formulario permanece abierto |
| DM-VIS-020 | ✅ PASS | Enviar → "¿Desea enviar la visita?" → Aceptar → "Su Visita será enviada" → "Visita nro. 1 enviada exitosamente"; navega a `/visitas`; ítem queda "Visitado" |
| DM-VIS-021 | ✅ PASS | Atrás con cambios sin guardar → modal 3 botones: Guardar y salir / Salir sin guardar / Cancelar |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" en visita nueva NUNCA guardada (COBRANZA/Test-VIS-022) → NO persiste en RUTA DE HOY (correcto) |
| DM-VIS-023 | ✅ PASS | Click visita Guardada → `/visita` editable, 3 tabs habilitadas, botones Guardar/Enviar activos, cliente cargado |
| DM-VIS-025 | 🚫 N/A | No hay visitas sincronizadas "No Visitado" desde backend hoy (RUTA DE HOY sin ítems al inicio) |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 (N/A) |
| DM-VIS-031 | ✅ PASS | "Guardar y salir" con evento → "La visita se ha guardado"; reabierta desde RUTA DE HOY conserva evento MERCHANDISING/VISIBILIDAD PDV (round-trip §9 OK) |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos con 3 acordeones: Imágenes + Archivo (userCanUploadFiles=true) + Firma (signatureVisit=true) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro Ref. **1** | Visita enviada · cliente 00001 "+ QUE MUEBLES UN SUENO, C.A" · 1 evento MERCHANDISING(47)/ENTREGA DE MUESTRAS(153) · `coVisit=1783967075758.0` · isVisited=true · GPS 11.049079,-63.8649949 | **Enviada / Visitado** |
| Ref 0 (temporal) | Visita Guardada (DM-VIS-031) · MERCHANDISING/VISIBILIDAD PDV/Test-VIS-031 | **Guardada → BORRADA en DM-VIS-006** |
| — (descartada) | Visita nueva DM-VIS-022 · COBRANZA/COBRANZA EFECTIVA/Test-VIS-022 · nunca guardada | **Descartada (Salir sin guardar) — correcto** |

**Visitas Guardadas pendientes al cierre:** ninguna (la de DM-VIS-031 fue borrada en DM-VIS-006). Solo persiste la enviada Ref 1 ("Visitado").

## Verificación BD (RUNTIME §10)
- **Nube (`query.js`):** `BD-N/A` — Postgres devolvió `remaining connection slots are reserved…` en 2 intentos (slots agotados en el servidor, no es defecto de app).
- **Local (`local-query.js`):** `BD-N/A` — `sqlite3` no disponible en el device (`run-as: exec failed for sqlite3: No such file or directory`).
- **Payload capture (hook `nativePromise`):** ✅ **BD-INFO — envío confirmado por payload.** Se interceptó el POST a `visitservice/visit` (5 reintentos, mismo `coVisit=1783967075758.0`, `stVisit=1`, `idClient=1/coClient=00001`, `coEnterprise=BARAK_A/idEnterprise=1`, `visitDetails=[{coIncid:1, coType:47, coCause:153, txDescription:"Test-VIS-015-142412"}]`, `isVisited=true`). Coincide con la alerta de la app "Visita nro. 1 enviada exitosamente" (Nro.Ref UI = id_visit = 1). Volcado en `_payloads.jsonl`.
- **Conclusión guardado→enviado:** la visita guardada con 1 evento se envió correctamente (payload + alerta de éxito). Cotejo BD durable pendiente hasta que se liberen slots de Postgres.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| dm-electronica: 11 actividades TODAS `requiredEvent="true"` / `requiredSignature="false"` | cliente | idTypes 2 NO VISITO, 47 MERCHANDISING, 71 NO COMPRO, 75 VISITA FUERA DE RUTA, 82 COBRANZA, 83 INFO DE CLIENTES, 84 COBRANZA NO EFECTIVA, 85 VENTA EN RUTA, 86 EVENTOS, 87 REUNION CON CLIENTE, 88 VISITA SIN ACCION. Mismo set que jerez/ferrenuestro. ⚠ El dump BD del YAML (Reventa/Cheque Devuelto/Precio) NO refleja lo sincronizado; las reales son el set estándar |
| dm-electronica: MERCHANDISING(47) → 5 motivos | cliente | ENTREGA DE MUESTRAS(153), LEVANTAMIENTO DATA ISSY(183), VISIBILIDAD PDV(184), PLAN SLIP(191), MUESTRA NUEVO CATALOGO(192). COBRANZA(82) → 4 motivos: COBRANZA EFECTIVA, COBRANZA PARCIAL, RETENCION, COBRANZA + RETENCION (igual piercar) |
| dm-electronica: cliente 00001 "+ QUE MUEBLES UN SUENO, C.A" sin coordenadas | cliente | alert "Esta sucursal no tiene coordenadas asignadas. ¿Desea agregarlas?" (botones `["", "Agregar"]`, idx0=Cancelar). Dispara al **SELECCIONAR** cliente y ANTES del dirty-guard en el **Back** (patrón piercar): Back#1→coordenadas (cancelar) → Back#2→dirty-guard. No bloquea Guardar/Enviar |
| dm-electronica: back `img.fechaAtras` (1 sola) `mouse.click(≈32,31)` dispara dirty-guard | cliente/universal El Yaque | Patrón ferrenuestro confirmado (build El Yaque v6.6.18): 1 sola `img.fechaAtras`, `getBoundingClientRect`+`mouse.click` engancha; modal 3 botones "Guardar y salir / Salir sin guardar / Cancelar" |
| dm-electronica: envío VISITAS sin exigir firma pese a `signatureVisit=true` | cliente | DM-VIS-020 defecto conocido confirmado (igual piercar): la app acepta Enviar sin firma en Tab Adjuntos |
| dm-electronica: payload `visitservice/visit` capturado por hook `nativePromise` | universal (build El Yaque) | Confirma nota ferrenuestro: el hook captura el POST de visit con cabecera+detalles; útil como cotejo BD cuando `sqlite3` local no está y Postgres nube inaccesible |

> ✅ consolidado 20260713 — back El Yaque + envío-sin-firma + payload nativePromise reconfirmados (tags); actividades/motivos + cliente 00001 sin coordenadas → notas visitas.md + YAML.

## Hallazgos (FAIL)
Ninguno. 0 FAIL.

### Notas
- **DM-VIS-020** (modal confirmación antes de validar actividades) es defecto conocido (RUNTIME §5); aquí se envió CON actividad, no re-marcado.
- Envío sin firma pese a `signatureVisit=true`: comportamiento ya documentado (piercar); no re-marcado FAIL.

## Verificación BD (payload ↔ nube)

Config visitas calibrada (visit + incidence). Nota: la nube dio BD-N/A por slots Postgres agotados durante la corrida; **re-cotejado exitosamente al cierre** con `cotejo-payload.js` → **BD-FIELD-OK**.

**Conteo:** BD-FIELD-OK 1 · MISMATCH 0 · SAVED 0 · BD-N/A 0

| co_x | Marca | Campos cabecera | Hijas | Mismatches | Notas |
|---|---|---|---|---|---|
| co_visit 1783967075758.0 | **BD-FIELD-OK** | 19/19 OK | incidence 1/1 OK (coType 47, coCause 153) | 0 | 3 notas TZ (da_visit/da_initial/da_real, UTC-4↔UTC, día OK) |

**Cabecera:** co_visit, coordenada (11.049079,-63.8649949), coClient 00001 (+ QUE MUEBLES UN SUENO), coUser 02, coEnterprise BARAK_A, isVisited true — idénticos payload↔nube. **Hija incidence:** coType 47 / coCause 153 / txDescription Test-VIS-015-142412. Lo enviado == lo guardado.
