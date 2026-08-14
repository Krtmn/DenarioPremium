# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260610_180320_smoke-completo` |
| Módulo | INVENTARIOS |
| Dispositivo | CDP `http://127.0.0.1:9220` (`com.kiberno.denarioPremiumPro`) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Playa | insumar (INSUMAR DISTRIBUIDOR, Isla Coche) |
| Cliente test | ADRIAN ARLET BASTARDO ALONZO (cód. 2738) |
| Resultado | 16 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Click módulo Inventarios → `/inventarios` con botones INVENTARIO y BUSCAR |
| DM-INV-002 | ✅ PASS | INVENTARIO → 4 tabs (General activo; Inventario/Resumen/Adjuntos disabled); campo Cliente vacío |
| DM-INV-004 | ✅ PASS | Cliente "ADRIAN ARLET BASTARDO ALONZO (2738)" cargado; las 4 tabs habilitadas |
| DM-INV-008 | ✅ PASS | Tab Inventario muestra familias con conteo (ALIMENTOS 158, BEBIDAS 113, CARAMELOS 68…) |
| DM-INV-010 | ✅ PASS | Click producto TOMATES PELADOS MARY (11293) → modal `inventory-type-stocks-modal` con Cantidad, Lote y Fecha de vencimiento |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard` Cantidad=15 + Lote=LOTE-QA-180320; Fecha vía ion-datetime-button→Aceptar(shadowRoot). Valores reflejados |
| DM-INV-012 | ✅ PASS | checkmark-outline → modal cierra sin error; producto marca "Inventariado: Exhibición" |
| DM-INV-016 | ✅ PASS | Tab Resumen: tabla "11293 TOMATES PELADOS MARY 24X400G \| 15 UNIDADES" (col. Exhibición) |
| DM-INV-017 | ✅ PASS | Botón "Pedido Sugerido" (`.botonAddAmarillo`) → modal `inventario-sugerido-modal` con "Sugerido UNIDADES: 15,00" + desglose Inv.Actual/Despacho (confirma `suggestedOrderByDispatchAndReturn=true`) |
| DM-INV-020 | ✅ PASS | Modal sugerido muestra "Días para siguiente Inventario: 1" (>0, hay historial — no N/A) |
| DM-INV-021 | ✅ PASS | Guardar (`.imagenGuardar`) → confirm Cancelar/Aceptar → alert "Denario Inventario — Inventario guardado con éxito"; queda en BUSCAR como Ref 0 Guardado |
| DM-INV-022 | ✅ PASS | Enviar (`.imagenEnviar`) → "¿Desea enviar el Inventario?" → "El Inventario será enviado" → home Inventarios. Aparece Ref 17 Enviado |
| DM-INV-023 | ✅ PASS | BUSCAR → lista con Nro.Ref / Cliente / Estatus / Fecha (Ref 17 Enviado + Ref 0 Guardado del cliente test, 18 ítems totales) |
| DM-INV-025 | ✅ PASS | Searchbar "Inventarios..." filtra en tiempo real: "AGROPECUARIA" reduce 18 → 2 ítems |
| DM-INV-026 | ✅ PASS | Inventario Guardado abre formulario con cliente y captura intactos (Resumen 15 UNIDADES). **Defecto conocido confirmado:** abre en tab **General** en vez de Inventario (observación, no FAIL) |
| DM-INV-028 | ✅ PASS | Trash en Guardado → **borrado directo sin confirmación previa** → alert "¡EL Inventario se borro con exito!"; item desaparece (1→0) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| 17 | Inventario — ADRIAN ARLET BASTARDO ALONZO (2738) — TOMATES PELADOS MARY 24X400G ×15, LOTE-QA-180320 | **Enviado** (persiste) |
| 0 | Inventario — ADRIAN ARLET BASTARDO ALONZO (2738) — mismo producto, copia local Guardada | **Guardado → eliminado** en DM-INV-028 |

> Nota: el flujo Guardar→Enviar generó dos entradas en BUSCAR (Ref 0 local Guardado + Ref 17 Enviado tras sincronizar). El Guardado (Ref 0) se usó para DM-INV-026/028 y luego se eliminó. Queda 1 registro neto en sistema: **Ref 17 Enviado**.

## Oráculo de persistencia (round-trip)

Reabierto el inventario Guardado desde BUSCAR (DM-INV-026): producto TOMATES (11293), cantidad 15 UNIDADES y captura en Exhibición se releyeron **idénticos** a lo guardado. Sin divergencias silenciosas. PASS.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `ion-input#clienteSelect` → modal cliente (mismo patrón Pedidos): focus `input[placeholder="Clientes..."]` + type + click `.clear-search` + click `<p>` del nombre | universal | Confirmado en inventarios insumar; selección por `<p>` del nombre (no centro del item) habilita las 4 tabs |
| Modal captura: inputs Cantidad `placeholder="Ingrese cantidad"` (type=number) + Lote `placeholder="Ingrese lote"` (type=text); IDs `ion-input-NNN` dinámicos (cambian por apertura) | universal | Localizar por placeholder, no por id fijo. `fillNgModelKeyboard` = `pg.click(sel,{clickCount:3})` + `keyboard.type` confirmado |
| Modal captura tiene segmento interno **Exhibición / Depósito / Todos** (tipo de stock) | cliente (expirationBatch ctx) | El producto capturado queda etiquetado "Inventariado: Exhibición" |
| **Botón "Pedido Sugerido" abre modal `inventario-sugerido-modal`** con "Días desde/para siguiente Inventario" + "Sugerido UNIDADES" + Inv.Actual/Despacho; su botón **Aceptar genera un PEDIDO** y navega a `/pedido` | cliente (VG suggestedOrderByDispatchAndReturn) | ⚠ Aceptar en el modal sugerido NO solo cierra: crea pedido y saca del form de inventario. Para solo inspeccionar, leer el modal y cerrarlo con Aceptar asumiendo que generará pedido — o evitar Aceptar. En esta corrida se salió del pedido con clickBack sin guardar |
| Guardar inventario: alert confirm previo (Cancelar/Aceptar) → alert éxito "Inventario guardado con éxito" (OK) | universal | Doble alert, distinto a guardado directo de otros módulos |
| Enviar: "¿Desea enviar el Inventario?" (Cancelar/Aceptar) → "El Inventario será enviado" (OK) → home. 2 alertas | universal | |
| Lista BUSCAR: ítems `ion-item` con texto "Nro. Ref.: N Cliente: COD - NOMBRE Estatus: X Fecha: DD/MM/AAAA"; searchbar `ion-searchbar` "Inventarios..." filtra realtime | universal | El botón BUSCAR del home requiere coords del `ion-button` (no del `ion-col` contenedor); navega in-place (URL sigue `/inventarios`) |
| Borrado Guardado: trash `ion-button[color="danger"]` dentro del item → directo sin confirm → "¡EL Inventario se borro con exito!" | universal | Confirma patrón `[ins-2606][gmp-2606]` |

> ✅ consolidado 2026-06-10

## Hallazgos (FAIL)

Ninguno. 16/16 PASS. El único comportamiento atípico (DM-INV-026 abre en tab General) es defecto conocido v6.6.14 ya registrado en RUNTIME §5 y module-selectors — no se re-marca FAIL.
