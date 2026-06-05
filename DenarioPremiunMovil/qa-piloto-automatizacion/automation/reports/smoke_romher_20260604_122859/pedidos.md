# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260604_122859_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | CDP 127.0.0.1:9220 |
| App | `com.kiberno.denarioPremiumPro` — romher (El Yaque) |
| Playa | El Yaque · `http://denarioelyaque.ddns.net:8081/PremiumWS/services/` |
| Resultado | **11 PASS · 1 FAIL · 0 SKIP · 0 N/A** |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | `app-pedidos` visible con botones PEDIDO / BUSCAR / COPIAR |
| DM-PED-002 | ✅ PASS | 4 tabs (General / Pedido / Total / Adjunto); 3 disabled sin cliente; clienteVal vacío |
| DM-PED-006 | ✅ PASS | SIDON seleccionado; alerta deuda vencida apareció; aceptada; 0 tabs disabled |
| DM-PED-015 | ✅ PASS | Tab Pedido → lista de proveedores (listaItems) → click NESTLE → acordeón de productos visible (50 items) |
| DM-PED-017 | ✅ PASS | fillIonInput qty=2 en CALDO DE POLLO; badge "2" visible en header del acordeón |
| DM-PED-024 | ✅ PASS | Tab Total: Total Unidad: 2,00 · CALDO DE POLLO · Total USD: 31,69 (distinto de cero) |
| DM-PED-026 | ✅ PASS | Acordeón en Tab Total expandido → trash visible → click → item eliminado inmediatamente, Total Unidad: 0,00; sin alert de confirmación |
| DM-PED-029 | ✅ PASS | Guardar y Enviar disabled con 0 ítems |
| DM-PED-030 | ✅ PASS | Alert "Pedido Guardado" tras click guardar; comentario `Test-PED-SMOKE-125732` |
| DM-PED-031 | ✅ PASS | Envío: 3 alertas — (1) "¿Desea Enviar el pedido?" → (2) "Su Pedido será enviado" → (3) "Pedido nro. 23085 enviado exitosamente"; regresa a `/pedidos` |
| DM-PED-032 | ❌ FAIL | Pedido guardado y SIN cambios nuevos → click atrás navega directamente a `/pedidos` sin mostrar modal 3 opciones (Guardar y salir / Salir sin guardar / Cancelar). Modal pre-existe en DOM pero no se activa cuando no hay cambios pendientes. VER hallazgos. |
| DM-PED-034 | ✅ PASS | Searchbar filtra en tiempo real al escribir "SIDON" → 2 resultados (1 Guardado + 1 Enviado) |
| DM-PED-035 | ✅ PASS | Pedido Guardado abre formulario editable 4 tabs; cliente SIDON cargado; Enviar habilitado |
| DM-PED-037 | ✅ PASS | Botón basura en lista → alert "¿Seguro que quieres eliminar este pedido?" → Aceptar → pedido desaparece |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Pedido nro. 23085 | Cliente: SUPERMERCADO SIDON, C.A. · Producto: CALDO DE POLLO MAGGI 11,5GRS (x1) · Comentario: Test-PED-SMOKE-125732 | Enviado ✅ |
| Pedido nro. 0 (local) | Pedido de prueba para DM-PED-037 | Eliminado 🗑️ |

---

## Hallazgos

### FAIL — DM-PED-032: Modal "atrás con ítems" no aparece tras guardar sin cambios

**Comportamiento observado:** Al abrir un pedido en estatus Guardado (sin modificar ningún campo) y presionar el botón atrás, la app navega directamente a `/pedidos` sin presentar el modal de 3 opciones.

**Condición de activación probable:** El modal de 3 opciones (Guardar y salir / Salir sin guardar / Cancelar) parece activarse solo cuando el formulario tiene cambios no guardados (form dirty). Si el pedido se abre sin modificaciones, el formulario está pristine y la app navega directamente.

**Impacto:** Bajo — el comportamiento es razonable. Si no hay cambios, no hay razón para advertir. Sin embargo el smoke case lo espera siempre "con ítems cargados".

**Recomendación:** Clarificar en el guión si DM-PED-032 aplica solo cuando hay cambios no guardados. Si el comportamiento es intencional, cambiar a N/A para pedidos ya guardados sin modificaciones.

**Evidencia DOM:** Los botones de alert (Guardar y salir / Salir sin guardar / Cancelar) están pre-cargados en el DOM pero con `visible: false`, confirmando que el modal existe pero no se dispara.

---

## Datos descubiertos — romher

### Estructura de producto confirmada

| Nivel | Descripción |
|-------|-------------|
| Nivel 1 | Lista de Proveedores/Marcas (`ion-item.listaItems`) — ej. NESTLE VENEZUELA, COLGATE, AGROINDUSTRIA ACEOR |
| Nivel 2 | Lista de productos del proveedor como `ion-accordion.accordionPedidos` |
| Detalle | Cada producto muestra: Código, Precio USD, IVA%, Almacén; ion-input type=number para cantidad |

**`estructura_producto`:** `PROVEEDOR > PRODUCTOS (acordeón colapsado por proveedor)`

### Alerta deuda vencida

**`alerta_deuda_vencida`:** `true` — SUPERMERCADO SIDON, C.A. (0001000111) tiene deuda vencida. Alert: "Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" con botones Cancelar / Aceptar.

### Tabs del formulario de pedido

Romher tiene **4 tabs** (General / Pedido / Total / Adjunto) — no 2 como en otras cuentas. La tab "Adjunto" está presente, sugiriendo posible VG de adjuntos en pedidos (TBD confirmar si se puede adjuntar).

### Flujo envío pedido

El envío genera **3 interacciones** (no 2):
1. Confirm: "¿Desea Enviar el pedido?" → Cancelar / Aceptar
2. Info: "Su Pedido será enviado" → OK
3. Éxito: "Pedido nro. XXXXX enviado exitosamente" → OK

### Selección de cliente en modal pedidos

**Patrón confirmado:** El modal `#clienteSelectModal` (trigger=clienteSelect) se abre con mouse.click en el campo. Búsqueda requiere escribir en `input[placeholder="Clientes..."]` + click en `button.clear-search`. Selección de ítem requiere mouse.click real (no dispatchEvent).

### Tab Total — eliminación de producto

El botón basura en Tab Total está dentro de un `ion-accordion.accordion-collapsed` — necesita expandirse primero. Una vez expandido, el trash aparece y la eliminación es inmediata (sin confirmación).

### Patrones nuevos detectados

| # | Patrón | Descripción |
|---|--------|-------------|
| P-ROM-PED-001 | `pedidos_tab_total_trash_dentro_acordeon` | El botón basura en Tab Total está dentro de un acordeón colapsado — expandir primero, luego click en trash |
| P-ROM-PED-002 | `pedidos_envio_tres_interacciones` | Envío pedido genera 3 pasos: confirm "¿Desea enviar?" → info "Será enviado" → éxito con nro. (distinto del patrón insumar de 2 alertas) |
| P-ROM-PED-003 | `pedidos_modal_cliente_seleccion_mouse_click` | Selección de cliente en modal pedidos requiere mouse.click real en coords del ion-item (dispatchEvent MouseEvent no activa el handler Angular) |
| P-ROM-PED-004 | `pedidos_romher_4_tabs_formulario` | Formulario pedido en romher tiene 4 tabs: General / Pedido / Total / Adjunto (no 2 como en otras cuentas) |
| P-ROM-PED-005 | `pedidos_back_guardado_sin_cambios_directo` | Pressing back en pedido ya guardado sin cambios nuevos navega directamente sin modal 3 opciones |

---

## Estado final

App en HOME (`http://localhost/home`). ✅

---

*Generado: 2026-06-04 · Agente QA autónomo · RUN_ID 20260604_122859_smoke-completo*
