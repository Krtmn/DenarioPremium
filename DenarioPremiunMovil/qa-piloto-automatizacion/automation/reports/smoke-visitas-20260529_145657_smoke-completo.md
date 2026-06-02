# Smoke — Módulo VISITAS
**RUN_ID:** 20260529_145657_smoke-completo  
**Fecha de ejecución:** 2026-06-01  
**App:** com.kiberno.denarioPremiumPro — versión 6.6.14  
**Dispositivo:** Android 15 / Infinix X6728 / Chrome WebView 148  
**Cuenta QA:** 001 (empresa HIDROPONIAS VENEZOLA)  
**Estado inicial:** HOME principal | **Estado final:** HOME principal

---

## Resumen de resultados

| Resultado | Cantidad |
|-----------|----------|
| PASS | 13 |
| FAIL | 1 |
| SKIP | 0 |
| N/A | 3 |

---

## Tabla de casos

| ID | P/F/S/N | Evidencia |
|----|---------|-----------|
| DM-VIS-001 | PASS | app-visitas visible; título "Visitas"; 3 botones: NUEVA VISITA, RUTA DE HOY, VER MEJOR RUTA |
| DM-VIS-002 | PASS | Alert: "No hay visitas pendientes para trazar ruta." al pulsar VER MEJOR RUTA sin pendientes |
| DM-VIS-003 | PASS | Formulario abierto en /visita; ACTIVIDADES y ADJUNTOS disabled (propDisabled=true, clase segment-button-disabled) |
| DM-VIS-004 | PASS | Lista /listaVisitas visible; visitas del día 2026-06-01 con Ref., cliente, estatus; searchbar presente |
| DM-VIS-006 | PASS | Alert confirmación "¿Desea borrar la visita?" → Aceptar → visita desaparece de lista (3 ítems → 2) |
| DM-VIS-010 | PASS | Modal selector → clic ion-item → "ALIMENTOS GOURMET CCC, C.A." en campo; ACTIVIDADES y ADJUNTOS enabled |
| DM-VIS-014 | PASS | Modal "Agregar" con ion-select Actividad, ion-select Motivo, ion-input Comentario (máx 120), CANCELAR/AGREGAR |
| DM-VIS-015 | PASS | VISITA SIN ACCION / NEGOCIO CERRADO / Test-VIS-015-130958 visible en lista de actividades; modal cerrado |
| DM-VIS-019 | PASS | Alert "La visita se ha guardado"; formulario permanece abierto; visita aparece como Guardado en lista |
| DM-VIS-020 | PASS | Con actividades: alert confirmación "¿Desea enviar la visita?" → Aceptar → alert "Su Visita será enviada" → navega a /visitas (obs: confirmación antes de validar actividades — defecto conocido DM-VIS-020) |
| DM-VIS-021 | PASS | Alert con botones GUARDAR Y SALIR / SALIR SIN GUARDAR / CANCELAR al pulsar atrás con cambios |
| DM-VIS-022 | FAIL | Al pulsar "SALIR SIN GUARDAR" en visita nueva (sin guardar previo), la app mostró alert "La visita se ha guardado" y la visita apareció como Guardado en la lista — comportamiento incorrecto |
| DM-VIS-023 | PASS | Visita Guardada abre editable; cliente, fecha, 3 tabs accesibles; botones guardar + enviar visibles en cabecera |
| DM-VIS-025 | N/A | No hay visitas "No Visitado" sincronizadas desde backend para fecha 2026-06-01 |
| DM-VIS-026 | N/A | N/A (depende de DM-VIS-025) |
| DM-VIS-031 | PASS | "Guardar y salir" → alert "La visita se ha guardado" → navega a /visitas; visita Guardada en lista con evento Test-VIS-031-132843; Tab Actividades muestra evento al reabrir |
| DM-VIS-032 | PASS | Tab ADJUNTOS muestra 3 acordeones: Imágenes, Archivo (VG userCanUploadFiles=true), Firma (VG signatureVisit=true) |

---

## Detalle FAIL

### DM-VIS-022 — FAIL: "Salir sin guardar" guarda la visita de todas formas

**Severidad:** S2  
**Pasos reproducidos:**
1. Desde home Visitas → NUEVA VISITA → formulario abierto
2. Seleccionar cliente (ALIMENTOS GOURMET CCC, C.A.) → tabs habilitadas
3. Sin agregar actividades ni guardar desde cabecera, pulsar atrás (img.fechaAtras)
4. Alert aparece: GUARDAR Y SALIR (y≈362) / SALIR SIN GUARDAR (y≈402) / CANCELAR (y≈442)
5. Clic en "SALIR SIN GUARDAR" (coordenadas x=176, y=402)

**Resultado real:** Alert "La visita se ha guardado" aparece. La visita nueva aparece en la lista del día con estatus "Guardado".  
**Resultado esperado:** La visita nueva NO debe aparecer en la lista; la app debe navegar sin guardar.  
**Hipótesis:** El botón "GUARDAR Y SALIR" pudo haberse activado en lugar de "SALIR SIN GUARDAR" por diferencia de coordenadas táctiles en el WebView, o el código en `role: 'exit'` no está descartando la visita correctamente cuando ya tiene un cliente seleccionado. Confirmar manualmente con scrcpy para descartar error de coordenadas CDP antes de abrir defecto formal.  
**Referencia código:** `visita.component.ts:1105-1111` (`buttonsSalvar`, role `exit`)

---

## Casos no ejecutados del smoke (fuera del scope de esta corrida)

Los casos DM-VIS-019 (segunda ejecución "enviar sin actividades") no se probó en ruta separada porque la cuenta QA no disponía de un formulario sin actividades al momento de testear el envío. El defecto conocido DM-VIS-020 (confirmación antes de validar actividades) se observó y registró como observación, no como FAIL nuevo.

---

## Registros creados en sistema

| # | Ref. | Cliente | Actividad | Comentario evento | Estado final |
|---|------|---------|-----------|-------------------|--------------|
| 1 | 4 | ALIMENTOS GOURMET CCC, C.A. | VISITA SIN ACCION / NEGOCIO CERRADO | Test-VIS-015-130958 | Visitado (enviado) |
| 2 | 0 | ALIMENTOS GOURMET CCC, C.A. | VISITA SIN ACCION / NEGOCIO CERRADO | Test-VIS-006-131524 | Eliminado (DM-VIS-006) |
| 3 | 0 | ALIMENTOS GOURMET CCC, C.A. | (ninguna — visita creada para DM-VIS-022) | — | Guardado (FAIL: no debería haberse guardado) |
| 4 | 0 | ALIMENTOS GOURMET CCC, C.A. | VISITA SIN ACCION / NEGOCIO CERRADO | Test-VIS-031-132843 | Guardado (DM-VIS-031) |

> **Nota:** Las visitas con Ref. 0 son locales (no sincronizadas al servidor). La visita Ref. 4 fue enviada como "Por Enviar" y quedó marcada como "Visitado" tras sincronización. Para limpiar el entorno QA, eliminar las visitas Guardado pendientes (Ref. 0) desde la pantalla RUTA DE HOY.

---

*Generado por agente QA CDP · RUN_ID 20260529_145657_smoke-completo · 2026-06-01*
