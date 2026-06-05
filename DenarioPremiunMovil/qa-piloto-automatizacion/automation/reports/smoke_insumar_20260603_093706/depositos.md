# Smoke Test — Módulo DEPÓSITOS
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-06-03 |
| **RUN_ID** | `20260603_093706_smoke-completo` |
| **Módulo** | DEPÓSITOS |
| **Cliente** | insumar |
| **App** | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| **aplica** | `true` — módulo Depósitos visible y accesible en HOME |
| **Resultado global** | 7 PASS · 2 FAIL · 3 SKIP · 0 N/A |

---

## Verificación previa: modules.depositos.aplica

- `modules.depositos.aplica` estaba en `null` (TBD) en `automation/clientes/insumar.yaml`.
- La app muestra "Depósitos" como enlace visible y accesible en HOME.
- `aplica = true` — se procedió a ejecutar todos los casos smoke.

---

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-DEP-001 | Click módulo Depósitos → pantalla con botones DEPÓSITO y BUSCAR | **PASS** | `app-depositos` activo; body muestra "DEPÓSITO" y "BUSCAR"; título "Depósitos" en cabecera. |
| DM-DEP-002 | Click DEPÓSITO → formulario con tabs; botones Guardar/Enviar deshabilitados sin datos | **PASS** | 4 tabs: General/Cobros/Total/Adjuntos. Campos: Empresa (read-only), Moneda, Banco (vacío, clase `selectbanco`), Nro. Plantilla, Fecha Doc, Comentario. `imagenGuardar` y `imagenEnviar` con `aria-disabled=true`. |
| DM-DEP-004 | `selectIonPopover` en Banco (`ion-select.selectbanco`) | **PASS** | Popover abrió con 5 bancos: BANCRECER, BANESCO RAEL, BANCO CARIBE, BANCO MERCANTIL, BANCO DE VENEZUELA ADRIANA. Seleccionado "BANESCO RAEL - *** 1029301"; popover cerrado; `has-value=true` en el selector. |
| DM-DEP-005 | `confirmDatetime` en Fecha Doc | **PASS** | ion-datetime-button abrió `ion-modal`; botón "Aceptar" encontrado en shadowRoot; modal cerró; fecha quedó en "3/6/2026". |
| DM-DEP-006 | Selección de cobro en tab COBROS → Guardar habilitado | **PASS** | Tab Cobros con 15 cobros disponibles (columnas: Selec/Cliente/Fecha Cob./Referencia/Monto Depósito/Monto Cobro). Checkbox [0] ANMY LEONELA URIEPERO ALONZO Ref:45 4765.23 BS marcado → `imagenGuardar` habilitado (`disabled=false`). Nota: el campo "Monto" es gestionado por selección de cobros en tab COBROS, no por ion-input independiente. |
| DM-DEP-009 | Click Guardar → alert confirmación "El Depósito se ha guardado" | **PASS** | Alert "Denario Depósito — El Depósito se ha guardado" apareció con botón ACEPTAR; click en ACEPTAR exitoso. |
| DM-DEP-010 | BUSCAR tras guardar → lista debería mostrar depósito Guardado | **FAIL** | Lista BUSCAR renderizó 10 depósitos con Estatus: Enviado (Nro Ref 1-10). El depósito recién guardado (Estatus: Guardado) **no aparece** tras navegar a BUSCAR. Defecto conocido `deposit.service.ts` confirmado en insumar. |
| DM-DEP-014 | Click en depósito Guardado → formulario editable con datos previos | **SKIP** | Prerrequisito DM-DEP-010 bloqueado por defecto conocido. Ningún depósito "Guardado" visible en la lista. |
| DM-DEP-017 | Click Enviar en depósito Guardado → ACEPTAR → Estatus "Enviado" | **SKIP** | Prerrequisito DM-DEP-014 no satisfecho. |
| DM-DEP-018 | BUSCAR tras guardar → lista muestra depósito Guardado | **FAIL** | Misma evidencia que DM-DEP-010: depósito Guardado no renderiza en lista `app-deposito-list`. Defecto conocido v6.6.14 confirmado en cliente insumar. |
| DM-DEP-019 | Click en depósito Enviado → solo lectura, sin botón eliminar | **PASS** | Clic en Nro Ref:10 (Banco:03, Enviado, 20000.00 BS). Formulario abrió con tabs General/Total/Adjuntos (sin COBROS). Todos los `ion-input` en `readonly`/`disabled`; todos los `ion-select` con `select-disabled`. Sin `ion-button.imagenGuardar`, sin `ion-button.imagenEnviar`, sin icono trash. Estado correcto. |
| DM-DEP-020 | Botón basura en depósito Guardado → confirmar → desaparece | **SKIP** | Prerrequisito: depósito Guardado visible en lista. Bloqueado por defecto conocido DM-DEP-010/018. |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Depósito QA (Nro Ref: pendiente asignación) | Banco: BANESCO RAEL (\*\*\* 1029301), Fecha Doc: 3/6/2026, Nro. Plantilla: QA-DEP-001, Cobro vinculado: Ref 45 (ANMY LEONELA URIEPERO ALONZO) 4765.23 BS | Guardado — no visible en BUSCAR (defecto conocido) |

---

## Hallazgos

### FAIL-1 · DM-DEP-010 / DM-DEP-018 — Lista BUSCAR no renderiza depósito Guardado (defecto conocido v6.6.14)

**Comportamiento observado:** Tras guardar un depósito nuevo (alert "El Depósito se ha guardado" confirmado con ACEPTAR), al navegar a BUSCAR la lista `app-deposito-list` muestra únicamente los 10 depósitos previos con Estatus: Enviado (Nro Ref 1-10). El depósito recién guardado (Estatus: Guardado) no aparece en ningún punto de la lista ni al final ni al desplazarse.

**Defecto:** Documentado en `RUNTIME.md` §5 — bug en `deposit.service.ts` (DM-DEP-018/019/020). Se confirma su reproducción en cliente insumar.

**Impacto:** DM-DEP-014, DM-DEP-017, DM-DEP-020 no ejecutables (SKIP).

---

## Observaciones adicionales

- **Estructura del formulario:** El formulario de depósito en insumar tiene Nro. Plantilla (no "Nro. Depósito") y no tiene campo Monto independiente — el monto se determina por los cobros seleccionados en tab COBROS. El smoke guide menciona "Nro Depósito + Monto" pero la UI real usa Nro. Plantilla + selección de cobros. Documentar para actualización futura del smoke extract.
- **15 cobros disponibles:** Todos sin depositar, disponibles en tab COBROS (Refs 21-45, montos entre 300 BS y 158050.73 BS).
- **DM-DEP-019 patrón de clic:** El click en `ion-item[button]` via MouseEvent no navega — se requiere click con coordenadas reales (`pg.mouse.click(x, y)`). Patrón documentado.
- **multiCurrency activa:** Selector Moneda visible con BS seleccionado por defecto.
- **Estado final:** App en HOME confirmado.

---

*Generado por Claude Code · Playwright MCP CDP · 2026-06-03 · RUN_ID: 20260603_093706_smoke-completo*
