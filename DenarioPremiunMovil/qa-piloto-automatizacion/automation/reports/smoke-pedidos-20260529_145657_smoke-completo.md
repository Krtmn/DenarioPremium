# Smoke Test — Módulo PEDIDOS
**RUN_ID:** 20260529_145657_smoke-completo  
**Fecha:** 2026-05-29  
**Ejecutado por:** Agente QA CDP (Claude Sonnet 4.6)  
**App:** com.kiberno.denarioPremiumPro · Ionic 6 + Angular 19 + Capacitor 6  
**Cuenta QA:** Yaque · Usuario 001 (ALIMENTOS GOURMET CCC, C.A. como cliente de prueba)  
**Estado inicial:** HOME principal · **Estado final:** HOME principal

---

## Resumen

| Total | PASS | FAIL | SKIP | N/A |
|-------|------|------|------|-----|
| 14 | 14 | 0 | 0 | 0 |

---

## Tabla de resultados

| ID | Resultado | Evidencia |
|----|-----------|-----------|
| DM-PED-001 | PASS | `app-pedidos` visible con 3 botones: PEDIDO, BUSCAR, COPIAR |
| DM-PED-002 | PASS | 4 tabs presentes; Pedido/Total/Adjunto con `segment-button-disabled`; save/send `disabled=true` |
| DM-PED-006 | PASS | Modal clientes abierto (50 ítems); ALIMENTOS GOURMET seleccionado; alerta deuda vencida → ACEPTAR; tabs Pedido/Total/Adjunto habilitadas |
| DM-PED-015 | PASS | Estructura GERMINADOS abierta → 5 productos en acordeón (ALFALFA, GRANO CHINO) con nombre, código y precio |
| DM-PED-017 | PASS | Cantidad 2 ingresada vía `fillIonInput`; badge verde `color=success` con texto "2" visible |
| DM-PED-024 | PASS | Tab Total: `Total Items: 1`, `Total Base BS: 6.624,42`, `Total Pedido BS: 7.684,33` — distintos de cero |
| DM-PED-026 | PASS | Segundo ítem agregado (ALFALFA CAJA qty=1); Tab Total con 2 ítems y total 8.826,43 BS; botón trash → ítem eliminado; totales recalculados a 1.142,11 BS |
| DM-PED-029 | PASS | Al abrir nuevo pedido sin cliente: todos los botones `disabled=true`; confirmado en DM-PED-002 |
| DM-PED-030 | PASS | Comentario `Test-PED-SMOKE-145657` guardado; alerta "Pedido Guardado"; pedido Nro. Ref.: 0 aparece en lista con Estatus: Guardado |
| DM-PED-031 | PASS | Botón enviar → alerta "¿Desea Enviar el pedido?" → ACEPTAR → alerta "Su Pedido será enviado" + "Pedido nro. 39 enviado exitosamente"; navega a app-pedidos |
| DM-PED-032 | PASS | Click atrás con ítems en carrito → alerta ¡Alerta! con 3 opciones: "Guardar y salir", "Salir sin guardar", "Cancelar" |
| DM-PED-034 | PASS | Searchbar filtra en tiempo real: texto "GOURMET" muestra solo pedidos de ALIMENTOS GOURMET CCC, C.A. |
| DM-PED-035 | PASS | Pedido Guardado (Nro. 0) abierto: formulario editable, 4 tabs habilitadas, cliente ALIMENTOS GOURMET cargado, botones guardar/enviar habilitados |
| DM-PED-037 | PASS | Botón trash → alerta "¿Seguro que quieres eliminar este pedido?" → ACEPTAR → pedido desaparece de lista (hasGuardado=false) |

---

## Notas de ejecución

### Patrón de navegación (aprendizaje de esta corrida)

- El botón atrás (`img.fechaAtras`) en la lista de pedidos **no responde** a `dispatchEvent(MouseEvent)` — requiere `pg.mouse.click()` en coords reales. Coords estables: `x=31.74, y=46.66` (link) o `y=31.08` (img).
- El botón "Nuevo Pedido" en app-pedidos se llama **"PEDIDO"** (etiqueta corta), no "Nuevo Pedido". Los otros: "BUSCAR" y "COPIAR".
- Al seleccionar cliente ALIMENTOS GOURMET aparece alerta de "deuda vencida" — se acepta con ACEPTAR; esto es comportamiento normal de la cuenta QA.
- El modal de clientes muestra 50 ítems sin necesidad de búsqueda previa.
- El botón Guardar está en x=267,y=32 y el botón Enviar en x=326,y=32 (sin texto visible — iconos en shadow DOM). El Guardar es el de la izquierda.
- Tras guardar y enviar el mismo pedido, el pedido se actualiza a "Enviado" inmediatamente. Para DM-PED-030/035/037 se requiere crear un segundo pedido que sólo se guarda.
- `app-pedidos-lista` tiene un botón trash (papelera) visible directamente para el único pedido en estado Guardado; no requiere swipe.

### Variables globales activas observadas

- `multiCurrency=true`: totales en BS y USD visibles en Tab Total.
- `showCreditLimit` o similar: sin semáforo de crédito visible en este cliente.
- `enterpriseEnabled`: empresa "HIDROPONIAS VENEZOLA" implícita en el formulario.

### Observaciones menores (no FAIL)

- Pedido guardado asignado como Nro. Ref.: 0 (ID local antes de sincronizar) — comportamiento esperado.
- La alerta de "deuda vencida" aparece para el cliente QA seleccionado (ALIMENTOS GOURMET CCC); no es defecto del módulo pedidos.

---

*Generado por agente CDP — RUN_ID 20260529_145657_smoke-completo — 2026-05-29*
