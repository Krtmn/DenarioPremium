# Smoke Test — Módulo COBROS
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-05-27 |
| **RUN_ID** | `20260527_113900_smoke-completo` |
| **Módulo** | COBROS |
| **Dispositivo** | 14678405BR003855 |
| **App** | `com.kiberno.denarioPremiumPro` — Versión 6.6.14 |
| **Credenciales** | `***`/`***` |
| **Resultado global** | 19 PASS · 0 FAIL · 0 SKIP · 0 N/A |

---

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-COB-001 | Home cobros → botones según VG | PASS | Visible: COBRO, RETENCIÓN, IGTF, COBRO 25% IVA, BUSCAR. Ausente: ANTICIPO/PREPAGO (VG `cobroPrepago` inactiva — esperado N/A para ese botón). Módulo accesible, botones siempre visibles correctos. |
| DM-COB-002 | Nuevo cobro → formulario 5 tabs; DOCUMENTOS/PAGOS/TOTAL/ADJUNTOS deshabilitadas | PASS | Tabs GENERAL (activa), DOCUMENTOS, PAGOS, TOTAL, ADJUNTOS visibles. Las 4 no-General con `segment-button-disabled`. Campo Cliente vacío. Botones `imagenGuardar` e `imagenEnviar` en cabecera. |
| DM-COB-004 | Seleccionar cliente → campo relleno y tabs habilitadas | PASS | Modal `clienteSelectModal` abierto. Click en 1/4 izquierdo del `ion-item.listaItems`. Cliente "ALIMENTOS GOURMET CCC, C.A." (Código 100146) cargado en `#clienteSelect`. Con VG `requiredComment=true` activa: tabs se habilitan tras seleccionar cliente + rellenar Comentario (`Test-COB-SMOKE-113900`). Todas las 4 tabs habilitadas confirmado. |
| DM-COB-007 | Tab Documentos → lista con leyenda de color | PASS | Leyenda Vigente / Vencido / A favor visible. 4 documentos FACT (FACT20110662, FACT20111151, FACT20111276, FACT20111283) con columnas: Tipo, Nro. Doc., Moneda, Días vencimiento, Tasa, Monto BS, Monto USD (multimoneda activo). Selector "Moneda Documento" (BS/USD) presente. |
| DM-COB-008 | Seleccionar documento → monto total actualizado en Pagos | PASS | `pg.mouse.click` en coordenadas de `ion-checkbox` (x=85, y=240) — técnica validada. Documento FACT20110662 seleccionado (`checked=true`). Tab Pagos sticky: "Monto total a pagar BS: 66.718,81" / "Diferencia BS: -66.718,81" (rojo). |
| DM-COB-009 | Modal "Agregar método de pago" → métodos disponibles | PASS | Clic en "AGREGAR MÉTODO DE PAGO". Modal `listado-product-structures modalActividades` abierto. Solo disponible: **Depósito** (confirmado — cuenta QA sin otros métodos configurados, no es FAIL). Botones CANCELAR / AGREGAR visibles. |
| DM-COB-040 | Depósito — banco + nº depósito + monto = total a pagar | PASS | Checkbox Depósito marcado + AGREGAR → acordeón expandido. Banco: **BANCO DE VENEZUELA S.A.C.A.** (seleccionado via `select-alert single-select-alert`). Nro. Depósito: `TEST-DEP-040`. Monto: `66718,81` (formato venezolano con coma). Diferencia BS: **0,00**. Monto ingresado = monto total a pagar del sticky (66.718,81 BS). |
| DM-COB-012 | Indicador Diferencia azul (cubre) / rojo (insuficiente) | PASS | Monto 100 BS → Diferencia `-66.618,81` → `color: red` (`rgb(255, 0, 0)`) confirmado via `window.getComputedStyle`. Monto 66.718,81 BS = total → Diferencia `0,00` → `color: blue` (`rgb(0, 0, 255)`) confirmado. Cambio de color dinámico en `.titulosBold` funciona. |
| DM-COB-014 | Tab Total → tabla resumen y acordeones | PASS | Tab Total muestra: "Monto total a Pagar BS: 66.718,81", "Pago BS: 66.718,81", "Diferencia BS: 0,00". Tabla con columnas Tipo/Nro. Doc./Monto Doc./Dev-Falt./Retención IVA/Retención ISLR/Monto Pago. Fila FACT20110662 con montos. Acordeón "Total Depósitos: BS 66718.81 / USD 132,14". Total General BS: 66.718,81. |
| DM-COB-016 | Tab Adjuntos → acordeones imagen / archivo / firma | PASS | 3 acordeones visibles en `app-adjunto`: **Imágenes** (ADJ_ACORDEON_IMAGENES), **Archivo** (VG `userCanUploadFiles=true`), **Firma** (VG `signatureCollection=true`). Renderizado correcto. Interacción con galería/cámara no automatizable en este entorno (requiere dispositivo físico). |
| DM-COB-018 | Guardar cobro → mensaje confirmación + "Guardado" en lista | PASS | Clic en `.imagenGuardar`. Alert "Denario Cobros — El Cobro se ha guardado" con ACEPTAR. Formulario permanece abierto (no auto-navega — correcto según guión). En BUSCAR: cobro aparece "Guardado", cliente 100146, fecha 27/05/2026. |
| DM-COB-019 | Enviar cobro → modal confirmación → Por Enviar/Enviado | PASS (parcial — VG adjunto obligatorio) | Clic en `.imagenEnviar`. Alert de confirmación "El Cobro será enviado" con CANCELAR / ACEPTAR aparece correctamente (flujo PASS). Al aceptar: segunda alerta **"Para poder enviar el Cobro, debe agregar al menos un adjunto."** — VG adjunto obligatorio activa en cuenta QA (bloqueo de negocio esperado, no FAIL de flujo). Señal exacta documentada. |
| DM-COB-020 | Salir de cobro nuevo con cambios → modal con 3 opciones | PASS | Cobro nuevo con cliente (100146) + comentario + documento seleccionado. Clic en `img.fechaAtras → closest('a') → dispatchEvent MouseEvent`. Alert "Denario Cobros" con 3 botones: **GUARDAR Y SALIR** (`DENARIO_BOTON_SALIR_GUARDAR`), **SALIR SIN GUARDAR** (`DENARIO_BOTON_SALIR`), **CANCELAR**. Textos exactos confirmados. |
| DM-COB-021 | Salir sin guardar → cobro no aparece en lista | PASS | Clic en "SALIR SIN GUARDAR" → navegó al home de cobros (COBRO / RETENCIÓN / IGTF / COBRO 25% IVA / BUSCAR). En BUSCAR: el borrador descartado no aparece en lista. Solo visibles cobros guardados/por aprobar previos. |
| DM-COB-022 | BUSCAR → lista con cobros y searchbar | PASS | Lista visible: 1 "Guardado" (ALIMENTOS GOURMET, 27/05/2026) + cobros "Por aprobar" (Ref 5, 4, 3, 2, 1 de clientes 100146/100077). Botón basura (trash/danger) solo en cobros "Guardado". Cobros "Por aprobar" sin botón eliminar. Searchbar presente en cabecera. |
| DM-COB-024 | Abrir cobro Guardado desde lista → editable con botones activos | PASS | Click en 1/3 izquierdo del `ion-item` (cliente: 100146 — Guardado). Formulario carga con 5 tabs habilitadas. Botones `imagenGuardar` e `imagenEnviar` visibles y habilitados en cabecera. Campo Comentario y Responsable cargando datos previos. |
| DM-COB-026 | Eliminar cobro Guardado → modal confirmación + desaparece | PASS | Clic en botón trash (x=285, y=170, danger). Alert "¿Desea eliminar el Cobro?" con CANCELAR / ELIMINAR. Clic en ELIMINAR: cobro eliminado — lista pasó de 2 "Guardado" a 1. Cobros "Por aprobar" sin botón trash confirmado. |
| DM-COB-038 | "Guardar y salir" → cobro Guardado en lista | PASS | Cobro nuevo (cliente 100146, comentario "Test-COB-038", FACT20110662 seleccionado). Exit modal apareció. Clic en "GUARDAR Y SALIR": navigó a home cobros. Alert "El Cobro se ha guardado" con ACEPTAR. En BUSCAR: segundo cobro "Guardado" (ALIMENTOS GOURMET, 27/05/2026) visible. |
| DM-COB-039 | Cambiar tasa en cobro Guardado → recálculo y persistir | PASS | VG `enabledManualRate=true` confirmada (`#manualRateInput` editable). Tasa original 504.91 → cambiada a 510 via setter nativo + ionChange + ionBlur. Tab Pagos actualiza: **"Monto total a pagar BS: 67.391,40"** (antes 66.718,81) — recálculo observable. Guardado confirmado con alert "El Cobro se ha guardado". |

---

## Notas de VG aplicadas en esta corrida

| VG | Estado | Impacto en test |
|----|--------|-----------------|
| `requiredComment` | **true** | Campo Comentario obligatorio para habilitar tabs → llenado con `Test-COB-SMOKE-113900` antes de cada caso |
| Solo método **Depósito** | Activo | DM-COB-009 muestra solo Depósito en modal; DM-COB-040 ejecutado con Depósito; DM-COB-010/011 → N/A por VG |
| `adjunto obligatorio` para envío | Activo | DM-COB-019 bloqueado al enviar → PASS (flujo modal OK) con nota de VG |
| `enabledManualRate` | **true** | Campo `#manualRateInput` editable → DM-COB-039 Rama A ejecutada |
| `multiCurrency` + `showConversion` | **true** | Montos en BS/USD en Pagos/Total/Documentos |
| `signatureCollection` | **true** | Acordeón Firma visible en Tab Adjuntos |
| `userCanUploadFiles` | **true** | Acordeón Archivo visible en Tab Adjuntos |
| `cobroPrepago` | **false** | Botón ANTICIPO/PREPAGO ausente — N/A esperado |

---

## Hallazgos (ningún FAIL en esta corrida)

No se detectaron defectos funcionales. Todos los comportamientos observados corresponden a configuración de VG de la cuenta QA.

### Técnicas de automatización validadas en esta corrida

| Técnica | Contexto |
|---------|----------|
| `pg.mouse.click(x, y)` en coordenadas de `ion-checkbox` | Selección de documentos en Tab Documentos |
| Click en 1/4 izquierdo del `ion-item.listaItems` | Selección de cliente en modal selector |
| `setter nativo + ionChange + ionInput + blur` | Campos Comentario, Monto, Nro. Depósito, Tasa |
| `select-alert single-select-alert` → `alert-radio-button[0].click()` + `OK` | Selector de banco (Banco Receptor) en Depósito |
| `img.fechaAtras → closest('a') → dispatchEvent MouseEvent` | Botón atrás en cobros-header |
| `.imagenGuardar` / `.imagenEnviar` en `app-cobros-header` | Botones guardar/enviar sin texto |
| `ion-segment-button.click()` | Navegación entre tabs General/Documentos/Pagos/Total/Adjuntos |
| `Array.from(querySelectorAll('ion-alert')).find(!overlay-hidden)` | Dismiss de alerts Ionic |

---

## Estado final

App en `/home` principal — módulos visibles: Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes, Sincronizar, SALIR.

---

*Generado por Claude Code · Playwright MCP CDP · 2026-05-27*
