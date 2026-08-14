# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260609_132051_smoke-completo` |
| Módulo | VISITAS |
| Cliente / Playa | insumar (INSUMAR DISTRIBUIDOR — Isla Coche) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Cliente de prueba | ADRIAN ARLET BASTARDO ALONZO (Cód 2738) |
| VGs | signatureVisit=true · userCanUploadFiles=true |
| Estado inicial / final | HOME / HOME |
| Resultado | **16 PASS · 0 FAIL · 0 SKIP · 0 N/A** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | Módulo Visitas abre `/visitas`; 3 botones: NUEVA VISITA, RUTA DE HOY, Ver mejor ruta |
| DM-VIS-003 | ✅ PASS | NUEVA VISITA → `/visita`; tab GENERAL activa, ACTIVIDADES/ADJUNTOS `disabled`, sin cliente |
| DM-VIS-004 | ✅ PASS | RUTA DE HOY → `/listaVisitas`; searchbar "Busqueda..." visible; overlay desaparece; lista renderiza 4 visitas |
| DM-VIS-006 | ✅ PASS | Basura en visita Guardada → alert "Denario - Visita" CANCELAR/Aceptar → Aceptar → éxito "Denario" OK → visita desaparece |
| DM-VIS-010 | ✅ PASS | Cliente "ADRIAN ARLET BASTARDO ALONZO" cargado; las 3 tabs habilitadas; modal cierra |
| DM-VIS-014 | ✅ PASS | "AÑADIR ACTIVIDAD/EVENTO" abre modal con selectores Actividad/Motivo, Comentario y botones CANCELAR/Agregar |
| DM-VIS-015 | ✅ PASS | Evento agregado y visible en lista Actividades: "Actividad: MERCHANDISING · Evento: VISIBILIDAD PDV · Observación: Test-VIS-015-153332" |
| DM-VIS-019 | ✅ PASS | Guardar (≥1 evento) → alert de guardado (OK); formulario permanece abierto; evento persiste |
| DM-VIS-020 | ✅ PASS | Enviar → "¿Desea enviar la visita?" → "Su Visita será enviada" → **"Visita nro. 762 enviada exitosamente"**; navega a `/visitas` |
| DM-VIS-021 | ✅ PASS | Atrás con cambios (cliente + evento sin guardar) → modal: Guardar y salir / Salir sin guardar / Cancelar |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" en visita nueva nunca guardada → NO aparece en RUTA DE HOY (0 Guardado de ADRIAN) |
| DM-VIS-023 | ✅ PASS | Click en visita Guardada → reabre `/visita` editable; 3 tabs habilitadas; Guardar/Enviar activos |
| DM-VIS-025 | ✅ PASS | Visita "No Visitado" (Nro 759) abre `/visita`; INICIAR VISITA visible/habilitado; ACTIVIDADES/ADJUNTOS bloqueadas |
| DM-VIS-026 | ✅ PASS | Click INICIAR VISITA → 3 tabs habilitan y vista cambia automáticamente a ACTIVIDADES (sin alerta GPS) |
| DM-VIS-031 | ✅ PASS | Visita Guardada reabierta desde RUTA DE HOY (Estatus: Guardado, Nro 0) conserva el evento MERCHANDISING en Tab Actividades |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos muestra acordeones Imágenes (BUSCAR/TOMAR FOTO) + Archivo (Subir Archivo) + Firma (Borrar) — ambas VGs activas |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro 762 | Visita ADRIAN ARLET BASTARDO ALONZO (Cód 2738) · Actividad MERCHANDISING / Evento VISIBILIDAD PDV / Obs Test-VIS-015-153332 | **Enviada** (Visitado) |
| (Nro 0 local) | Visita ADRIAN ARLET · creada y Guardada para DM-VIS-006 | **Borrada** (eliminada en DM-VIS-006) |
| (sin Ref) | Visita ADRIAN ARLET nueva con evento Test-VIS-022-nueva | **Descartada** (Salir sin guardar, no persistió) |

> Nota: la visita nro. 762 enviada queda como registro permanente en sistema para el cliente ADRIAN ARLET BASTARDO ALONZO. Las otras dos no dejaron registro (borrada / descartada).

## Notas de la corrida

- **DM-VIS-025/026 ejecutados como PASS (no N/A):** contrario a la nota de N/A estructural del prompt, la lista RUTA DE HOY SÍ tenía visitas sincronizadas desde backend hoy (Nro 757-760: 2 No Visitado + 2 Visitado). La visita 759 "No Visitado" permitió ejecutar el flujo INICIAR VISITA completo. La advertencia de N/A condicional no aplicó esta corrida.
- **Actividad como objeto confirmado:** MERCHANDISING = `{idType:47, naType:"MERCHANDISING", requiredEvent:"true", requiredSignature:"false"}`. Con `requiredEvent=true` el select Motivo se pobló con 5 opciones (ENTREGA DE MUESTRAS, LEVANTAMIENTO DATA ISSY, VISIBILIDAD PDV, PLAN SLIP, MUESTRA NUEVO CATALOGO) — patrón Motivo condicional confirmado.
- **11 actividades disponibles** en insumar: NO VISITO, MERCHANDISING, NO COMPRO, VISITA FUERA DE RUTA, COBRANZA, INFO DE CLIENTES, COBRANZA NO EFECTIVA, VENTA EN RUTA, EVENTOS, REUNION CON CLIENTE, VISITA SIN ACCION.
- **Dirty-guard back con mouse.click funciona en insumar:** `getBoundingClientRect` + `pg.mouse.click()` sobre `img.fechaAtras` SÍ dispara el modal de salida (Guardar y salir / Salir sin guardar / Cancelar). Confirma patrón insumar (vs globalmp que requiere hardware back).
- **Texto de envío:** secuencia de 3 alertas "¿Desea enviar la visita?" → "Su Visita será enviada" → "Visita nro. X enviada exitosamente".
- **Sin alerta de coordenadas/GPS** al seleccionar ADRIAN ni al INICIAR VISITA — el cliente tiene coordenadas asignadas.

## Hallazgos (FAIL)

Ninguno. Los 16 casos pasaron.
