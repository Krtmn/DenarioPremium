# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260604_122859_smoke-completo` |
| Módulo | DEPÓSITOS |
| Dispositivo | CDP `http://127.0.0.1:9220` |
| App | `com.kiberno.denarioPremiumPro` — romher (El Yaque) |
| Cliente | romher |
| Resultado | **6 PASS · 0 FAIL · 0 SKIP · 5 DEFECTO CONOCIDO** |
| aplica | `true` — módulo Depósitos visible y accesible en HOME |
| Fecha | 2026-06-04 |

---

## Verificación inicial

`modules.depositos.aplica` estaba como `null` (TBD) en `romher.yaml`.

Inspección de HOME confirmó: enlace "Depósitos" con icono `depositosNuevo.svg` visible y activo.
**aplica = true** — se ejecutan todos los casos smoke.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Click módulo Depósitos → `app-depositos` visible; botones DEPÓSITO y BUSCAR presentes |
| DM-DEP-002 | ✅ PASS | Click DEPÓSITO → formulario con campos: Empresa, Fecha Depósito (auto), Moneda, Banco (selectbanco), Nro. Plantilla, Fecha Doc, Comentario; botones Guardar/Enviar `disabled` sin datos |
| DM-DEP-004 | ✅ PASS | `selectIonPopover` en `ion-select.selectbanco` → Banco Provincial - 0948780100071619 seleccionado; popover visible y dismissed correctamente |
| DM-DEP-005 | ✅ PASS | Click `ion-button.letrasFechasButton` (no disabled) → modal `fechasModal` abierto; `ion-datetime.shadowRoot` Aceptar clickeado; modal cerrado; fecha confirmada "4/6/2026" |
| DM-DEP-006 | ✅ PASS | `fillIonInput` en Nro. Plantilla → "QA-DEP-001"; selección de cobro (checkbox ion-checkbox vía mouse.click real) → Guardar habilitado; cobro seleccionado: KERLY ENRIQUE MARTINEZ BLANCO Ref:15308 Monto:25179.17 VED |
| DM-DEP-009 | ✅ PASS | Click Guardar → alert "El Depósito se ha guardado" / botón "Aceptar" activo y clickeable |
| DM-DEP-010 | ⚠ DEFECTO CONOCIDO | Click BUSCAR → `app-deposito-list` renderiza con searchbar pero lista vacía; infinite-scroll muestra "Por favor espere..." sin items — **DM-DEP-018/010 confirmado (bug `deposit.service.ts` v6.6.14)** |
| DM-DEP-014 | ⚠ DEFECTO CONOCIDO | BLOQUEADO por DM-DEP-010: lista no renderiza → no hay item clickeable; clasificado como bloqueo de bug conocido, no FAIL nuevo |
| DM-DEP-017 | ⚠ DEFECTO CONOCIDO | BLOQUEADO por DM-DEP-010: no se puede abrir depósito guardado → Enviar no alcanzable |
| DM-DEP-018 | ⚠ DEFECTO CONOCIDO | BUSCAR tras guardar: lista vacía confirmada también en sesión fresca (re-entrada desde HOME); bug reproducido en romher igual que en corridas anteriores |
| DM-DEP-019 | ⚠ DEFECTO CONOCIDO | BLOQUEADO por DM-DEP-010/018: depósito Enviado no accesible en lista |
| DM-DEP-020 | ⚠ DEFECTO CONOCIDO | BLOQUEADO por DM-DEP-010/018: trash en Guardado no testeable sin lista |

---

## Hallazgos nuevos (patrones romher — Depósitos)

| Ref | Patrón | Descripción |
|-----|--------|-------------|
| P-ROM-DEP-001 | `depositos_checkbox_cobro_requiere_mouse_click` | ion-checkbox en tab Cobros del formulario depósito requiere `getBoundingClientRect` + `pg.mouse.click()` real (mismo patrón que otros módulos). `dispatchEvent` no suficiente. |
| P-ROM-DEP-002 | `depositos_monto_via_seleccion_cobros` | No hay campo "Monto" directo en formulario. El monto del depósito se define seleccionando cobros en tab "Cobros" (checkbox por cobro). Sin cobro seleccionado, Guardar permanece disabled. |
| P-ROM-DEP-003 | `depositos_formulario_4_tabs` | Formulario depósito tiene 4 tabs: General / Cobros / Total / Adjuntos (igual estructura que cobros/pedidos). |
| P-ROM-DEP-004 | `depositos_banco_selectbanco_class` | Selector Banco usa clase CSS `selectbanco`; útil como selector directo. Selector no tiene `formControlName` ni `id` explícito. |
| P-ROM-DEP-005 | `depositos_fecha_doc_ion_button_no_button` | Fecha Doc es `ion-button.letrasFechasButton` (custom element), no `<button>`. Buscar con `querySelector('button.letrasFechasButton')` falla — usar `querySelector('ion-button.letrasFechasButton')`. |
| P-ROM-DEP-006 | `depositos_guardar_alert_text` | Alert de guardado: título "Denario Depósito", mensaje "El Depósito se ha guardado", botón "Aceptar". |
| P-ROM-DEP-007 | `depositos_buscar_lista_no_renderiza` | Defecto DM-DEP-010/018 confirmado en romher: lista BUSCAR no renderiza ni en sesión nueva ni tras re-entrada desde HOME. Persistent bug. |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Depósito QA-DEP-001 | Banco Provincial · Fecha Doc: 4/6/2026 · Cobro Ref:15308 (KERLY E. MARTINEZ BLANCO · 25179.17 VED) | Guardado (no enviado — Enviar no alcanzable por DM-DEP-010/018) |

---

## Notas de corrida

- **Estructura del formulario distinta a guión de referencia:** El guión menciona campos "Nro Depósito" y "Monto" — en romher el campo equivalente a Nro Depósito es "Nro. Plantilla", y no existe un campo Monto numérico libre: el monto se calcula automáticamente al seleccionar cobros en el tab Cobros.
- **Defecto DM-DEP-010/018 bloqueante para 5 casos:** Impide ejecutar DM-DEP-014, DM-DEP-017, DM-DEP-018, DM-DEP-019, DM-DEP-020 sin workaround de código. No se reclasifican como FAIL ya que el bug está documentado como conocido.
- **romher.yaml actualizado pendiente:** Se debe actualizar `modules.depositos.aplica` de `null` a `true` y registrar patrones P-ROM-DEP-001 a P-ROM-DEP-007.
- **Estado final:** App en HOME ✅

---

*Agente QA — DEPÓSITOS · RUN_ID: 20260604_122859_smoke-completo · romher · 2026-06-04*
