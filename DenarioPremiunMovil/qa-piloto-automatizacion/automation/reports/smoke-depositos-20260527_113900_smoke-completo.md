# Smoke Test — Módulo DEPÓSITOS
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-05-28 |
| **RUN_ID** | `20260527_113900_smoke-completo` |
| **Módulo** | DEPÓSITOS |
| **Dispositivo** | 14678405BR003855 |
| **App** | `com.kiberno.denarioPremiumPro` — Versión N/D |
| **Credenciales** | `***`/`***` |
| **Resultado global** | 6 PASS · 3 FAIL · 0 SKIP · 2 N/A |

---

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-DEP-001 | Acceso al módulo → pantalla con 2 botones | **PASS** | URL `/depositos`; body muestra "DEPÓSITO" y "BUSCAR"; título "Depósitos" visible en cabecera. |
| DM-DEP-002 | Botón DEPÓSITO → formulario con 4 tabs; botones guardar/enviar deshabilitados | **PASS** | 4 ion-segment-button presentes (General, Cobros, Total, Adjuntos). Ambos botones header `disabled=true` sin banco seleccionado. |
| DM-DEP-004 | Selector Banco → lista de cuentas con formato `*** XXXX` | **PASS** | Popover con 4 bancos (BS) / 3 bancos (USD); cuentas enmascaradas: `*** 0031781`, `*** 0185727`, etc. |
| DM-DEP-005 | Seleccionar banco → número de cuenta completo; tabs habilitadas | **PASS** | Después de seleccionar BANCO DE VENEZUELA: `nuAccount = 01020143870000031781` visible en ion-input read-only; botón guardar pasa a `disabled=false`. |
| DM-DEP-006 | Campos editables: Nro. Plantilla, Fecha Doc (picker), Comentario | **PASS** | Plantilla y Comentario aceptaron texto vía native setter. Fecha Doc abrió `ion-datetime` en `ion-modal`; botón "Aceptar" en shadow DOM clickeado → fecha actualizada (`28/5/2026`). |
| DM-DEP-009 | Tab Cobros → tabla con columnas correctas y título | **PASS** | Tab Cobros activa: título "Seleccione los Cobros a depositar"; columnas Selec / Cliente / Fecha Cob. / Referencia / Monto Depósito / Monto Cobro; "Monto total depositado: 0 BS/USD". Sin cobros disponibles en ninguna combinación banco/moneda (esperado, Supuesto #2). |
| DM-DEP-010 | Marcar checkbox cobro → monto total actualizado | **N/A** | No hay cobros disponibles (enviados y sin depositar) en el entorno QA para ningún banco/moneda. No aplica por configuración. |
| DM-DEP-014 | Tab Total → muestra solo cobros seleccionados | **N/A** | Depende de DM-DEP-010; sin cobros seleccionables, no aplica. |
| DM-DEP-017 | Botones guardar/enviar deshabilitados sin banco / sin cobros | **PASS** | Sin banco: ambos `disabled=true`. Con banco seleccionado (sin cobros): guardar `disabled=false`, enviar `disabled=true`. Comportamiento correcto. |
| DM-DEP-018 | Guardar depósito → mensaje confirmación + aparece en lista | **FAIL** | Alert "El Depósito se ha guardado" mostrado correctamente (save ejecutó y resolvió). Sin embargo, al ir a BUSCAR la lista `itemListaDepositos` nunca renderiza items — 0 ion-list, 0 ion-item tras múltiples intentos y hasta 8 s de espera. El depósito guardado **no aparece** en la lista. |
| DM-DEP-019 | Enviar depósito → modal confirmación → "Por Enviar" | **FAIL** | Botón enviar (`imagenEnviar`) permaneció `disabled=true` durante toda la sesión. Sin cobros seleccionados `depositService.disabledSendButton` nunca se activa. El flujo de envío no fue ejecutable en este entorno. |
| DM-DEP-020 | Salir de depósito Guardado con cambios → modal guardar/salir/cancelar | **FAIL** | Precondición no satisfecha: la lista BUSCAR no muestra depósitos (ver DM-DEP-018). Sin un depósito Guardado accesible desde la lista, el caso no pudo ejecutarse. |

---

## Hallazgos

### FAIL-1 · DM-DEP-018 — Lista BUSCAR no renderiza depósitos (S1)

**Comportamiento observado:** Tras guardar un depósito con éxito (alert "El Depósito se ha guardado" confirmado), al navegar a BUSCAR el componente `app-deposito-list` muestra solo el `ion-infinite-scroll` con spinner cargando indefinidamente. La llamada `getAllDeposits(db)` regresa pero `itemListaDepositos` queda vacío — 0 `ion-list`, 0 `ion-item` renderizados en el DOM.

**Hipótesis técnica:** `saveDeposit()` en `deposit.service.ts` lineas 672–673 ejecuta los DELETEs sobre `this.database` **antes** de asignar `this.database = dbServ` (línea 675). Si `this.database` no está inicializado en el momento del primer guardado (depósito nuevo desde `goToNuevoDeposito()`), los DELETEs pueden lanzar excepción silenciada y el INSERT posterior puede ejecutar sobre la referencia correcta — o viceversa. Adicionalmente, el `ion-select` del banco fue activado via click en `ion-radio` dentro del shadow DOM; es posible que `(ionChange)` de `app-deposito-general` no haya disparado, dejando `deposit.coBank = ""` y `deposit.coCurrency = ""` en el objeto a guardar.

**Impacto:** El flujo completo guardar → verificar en lista → enviar → eliminar (DM-DEP-018 a DM-DEP-020) queda bloqueado.

**Recomendación:** Verificar el orden de asignación `this.database = dbServ` vs. las llamadas DELETE en `saveDeposit()`. Revisar que el evento `(ionChange)` de `ion-select[banco]` dispara correctamente el handler de Angular al seleccionar desde popover de ion-radio. Ejecutar manualmente en dispositivo físico con scrcpy para confirmar si el problema es de automatización o de la app.

### FAIL-2 · DM-DEP-019 — Botón enviar nunca se habilita (S1)

**Comportamiento observado:** `imagenEnviar` permaneció `disabled=true` incluso después de seleccionar banco. El binding `[disabled]="depositService.disabledSendButton"` requiere cobros seleccionados para activarse. No hay cobros disponibles en el entorno.

**Distinción importante:** Este podría ser N/A por configuración del entorno (sin cobros disponibles) más que un FAIL de la app. Se reporta como FAIL porque la combinación `(DM-DEP-018 FAIL + sin cobros)` impide completamente la validación del flujo de envío.

### FAIL-3 · DM-DEP-020 — Modal salir-con-cambios no testeable (S2)

**Comportamiento observado:** Depende de abrir un depósito Guardado desde la lista. La lista nunca renderiza items (ver FAIL-1), por tanto el caso no fue ejecutable.

---

## Observaciones adicionales

- **Entorno sin cobros disponibles:** Todas las combinaciones de banco (BS: 4 bancos; USD: 3 bancos) devolvieron 0 cobros no depositados. Los casos DM-DEP-010 y DM-DEP-014 se marcan N/A por configuración del entorno (Supuesto #2 del guión).
- **Multimoneda activa:** Selector de moneda habilitado con opciones BS y USD — VG `multiCurrency` activa en el entorno.
- **Empresa visible:** "HIDROPONIAS VENEZOLA" (coEnterprise: HIDRO_A) — `enterpriseEnabled` activo.
- **Fecha Depósito:** Campo correcto y deshabilitado (solo lectura) mostrando fecha/hora del dispositivo.
- **Fecha Doc picker:** Funciona correctamente — el botón Aceptar está en el shadow DOM de `ion-datetime`, accesible vía `shadowRoot.querySelectorAll('ion-button')`.
- **Técnica de selección en ion-select popover:** Click directo sobre `ion-item` no cierra el popover; se requiere click en el `ion-radio` interno con `{composed: true}` para que el evento atraviese el shadow DOM.

---
*Generado por Claude Code · Playwright MCP CDP · 2026-05-28*
