# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260710_084522_smoke-completo` |
| Módulo | VISITAS |
| Dispositivo | 14678405BR003855 (Infinix X6728, Android 15) |
| App | `com.kiberno.denarioPremiumPro` — Isla La Tortuga v6.6.18 |
| Cliente / Playa | hidroponias (HIDROPONIAS VENEZOLA) |
| cliente_test | ALIMENTOS GOURMET CCC, C.A. (100146) |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | Título "Visitas" + 3 botones: NUEVA VISITA, RUTA DE HOY, Ver mejor ruta |
| DM-VIS-003 | ✅ PASS | /visita: tab GENERAL habilitada, ACTIVIDADES/ADJUNTOS `disabled`, sin cliente |
| DM-VIS-004 | ✅ PASS | /listaVisitas con searchbar visible; lista del día vacía sin error |
| DM-VIS-006 | ✅ PASS | Trash en Guardada → "¿Desea borrar la visita?" Aceptar → "Se eliminó la visita de manera exitosa"; visita desaparece |
| DM-VIS-010 | ✅ PASS | Cliente cargado "ALIMENTOS GOURMET CCC, C.A. (100146)"; tabs ACTIVIDADES/ADJUNTOS habilitadas; Sucursal cargada (2º intento click en `<p>`) |
| DM-VIS-014 | ✅ PASS | Modal abre con 2 ion-select (Actividad+Motivo), Comentario, botones CANCELAR/Agregar |
| DM-VIS-015 | ✅ PASS | Evento en lista: "Actividad: MERCHANDISING · Evento: ENTREGA DE MUESTRAS · Observación: Test-VIS-015-153516" |
| DM-VIS-019 | ✅ PASS | Alert "Denario / La visita se ha guardado"; formulario permanece abierto |
| DM-VIS-020 | ✅ PASS | 2 alerts ("¿Desea enviar la visita?" Aceptar → "Su Visita será enviada" OK) → navega a /visitas; visita "Visitado". **BD-OK** |
| DM-VIS-021 | ✅ PASS | Back con cambios sin guardar → modal "¡Alerta!": Guardar y salir / Salir sin guardar / Cancelar |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" en visita nueva nunca guardada → NO aparece en RUTA DE HOY (solo Ref 2343 Visitado) |
| DM-VIS-023 | ✅ PASS | Click en visita Guardada → /visita editable, 3 tabs habilitadas, guardar/enviar activos, evento persistido |
| DM-VIS-025 | 🚫 N/A | `smoke_na_estructural` del perfil; sin visitas "No Visitado" (rojo) sincronizadas del backend hoy |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 (N/A) |
| DM-VIS-031 | ✅ PASS | "Guardar y salir" con evento → "La visita se ha guardado"; en RUTA DE HOY como Estatus Guardado; reabierta conserva el evento (VISIBILIDAD PDV / Test-VIS-031-164233). **BD-OK** |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos: acordeones Imágenes + Archivo (userCanUploadFiles) + Firma (signatureVisit), todas las VG activas |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| 2343 | Visita enviada · cliente 100146 · 1 evento (MERCHANDISING/ENTREGA DE MUESTRAS) · Test-VIS-015-153516 | Enviado (Visitado) — nube id_visit=2343, st_visit=2 |
| — (Ref 0) | Visita Guardada · cliente 100146 · 1 evento (MERCHANDISING/VISIBILIDAD PDV) · Test-VIS-031-164233 | Creada en DM-VIS-031, **borrada** en DM-VIS-006 |
| — | Visita nueva (cliente 100146, sin guardar) | Descartada en DM-VIS-022 (Salir sin guardar) — no persiste |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| hidroponias: 11 actividades TODAS `requiredEvent="true"` / `requiredSignature="false"` | cliente | idTypes 2,47,71,75,82,83,84,85,86,87,88 (NO VISITO, MERCHANDISING, NO COMPRO, VISITA FUERA DE RUTA, COBRANZA, INFO DE CLIENTES, COBRANZA NO EFECTIVA, VENTA EN RUTA, EVENTOS, …). MERCHANDISING (47) → 5 motivos: ENTREGA DE MUESTRAS 153, LEVANTAMIENTO DATA ISSY 183, VISIBILIDAD PDV 184, PLAN SLIP 191, MUESTRA NUEVO CATALOGO 192. Igual catálogo que ferrenuestro/insumar (backend Isla). |
| hidroponias: cliente_test id_client=84, coClient 100146, idAddressClient=699 | cliente | ALIMENTOS GOURMET CCC, C.A. - COUNTRY CLUB. NO dispara alert de coordenadas (sucursal con coords: `11.0490834,-63.865005`). |
| Selección de cliente en modal a veces requiere 2º click en `<p>` | universal | El 1er `mouse.click` al centro del `<p>` del nombre puede no seleccionar (modal queda abierto); reintentar 1× con coords frescas selecciona. Confirma técnica `[gmp-2611]`. |
| NUEVA VISITA / RUTA DE HOY / AÑADIR ACTIVIDAD → `shadowRoot.querySelector('button').click()` | universal | Más fiable que `mouse.click` por coords para abrir modal/navegar. Confirma `[gmp-2611][prc-2606]`. |
| Back en /visita y /listaVisitas: `mouse.click` en `img.fechaAtras[0]` (~31,31) engancha; dispara dirty-guard con cambios | universal | 1 sola `img.fechaAtras` visible con `hasA=true`. Alinea con ferrenuestro/insumar `[ins-2610][ferrenuestro-2026-07-07]`. |
| Sync diferido: alert "Visita nro. N enviada exitosamente" (Denario Premium) aparece ~min después del envío | universal | Confirmación de sync a nube post-envío; puede solaparse con otras interacciones — dismiss OK y continuar. |
| st_visit=2 = Enviado en nube (visitas usan tabla de estados propia) | universal | Coincide con piercar/ferrenuestro. |

> ✅ consolidado 20260710

## Verificación BD
Baseline nube al inicio: `max(id_visit)=2342`.

**DM-VIS-020 — visita enviada (round-trip UI→servidor):** `BD-OK`
- Nube `visit`: `id_visit=2343`, `co_visit=1783697747914.0`, `st_visit=2` (Enviado), `is_visited=true`, `is_dispatched=false`, `inc=1`.
- Nube `incidence`: `co_incid=10`, `id_visit=2343`, `co_type=47`, `co_cause=153`, `tx_description="Test-VIS-015-153516"` → **coincide 1:1** con lo cargado por UI (MERCHANDISING/ENTREGA DE MUESTRAS + comentario).
- Payload capturado (`visitservice/visit`): coincide (stVisit=1 al enviar → server asigna st=2; visitDetails[0] = {coIncid:1, coType:47, coCause:153, txDescription:"Test-VIS-015-153516"}, isVisited=true). Volcado a `_payloads.jsonl`.
- Conclusión guardado→enviado: **confirmado** (llegó de inmediato, poll ~10s; alert de sync "Visita nro. 2343 enviada exitosamente" reconfirmó).

**DM-VIS-031 — visita Guardada con evento:** `BD-OK` (persistencia UI verificada; permanece local `id_visit=0` hasta envío, no aplica fila nube; luego **borrada** en DM-VIS-006).

**BD local (§10):** `BD-N/A` — `sqlite3` no está disponible en el dispositivo (`run-as: exec failed for sqlite3`). Blindaje aplicado: no tumba el smoke; la parte UI y la verificación de nube corrieron completas.

## Hallazgos (FAIL)
Ninguno. 0 FAIL. Defecto conocido DM-VIS-020 (modal de confirmación aparece antes de validar actividades) no re-marcado: en esta corrida la visita tenía evento, envío correcto.

**Estado final: HOME** (`/home`, `app-home`).

## Verificación BD (payload ↔ nube) — Agente BD (cotejo campo-a-campo)

| co_x | Marca | Campos cabecera | Hijas (incidence) | Mismatches | Notas |
|------|-------|-----------------|-------------------|------------|-------|
| 1783697747914.0 | BD-FIELD-OK | 6/6 OK | 1 fila (co_type 47, co_cause 153, tx_description=Test-VIS-015-153516) 3/3 OK | 0 | ninguna |

**Conclusión:** visita Ref 2343 (cliente 100146 ALIMENTOS GOURMET CCC) enviada íntegra a la nube — cabecera (is_visited=true) + incidencia (MERCHANDISING/ENTREGA DE MUESTRAS), 0 mismatches.
