# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260619_173652_smoke-completo` |
| Módulo | COBROS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa / Cliente | insumar (INSUMAR DISTRIBUIDOR) |
| Resultado | 25 PASS · 0 FAIL · 0 SKIP · 9 N/A |
| Nota SKIP | DM-COB-029 envío contado dentro del PASS (Guardado OK); envío SKIP por adjunto |
| Estado inicial → final | HOME → HOME ✅ |

**Cliente con documentos usado:** `3039` ALEJANDRO JOSE RAMIREZ GUARTAJ (Saldo BS 29.229,52 / US$ 49,76). Facturas US$: FACT20088816 (saldo BS 13.181,48) y FACT20090080 (saldo BS 16.042,17). Los códigos 2385 (saldo 0) no tenían documentos hoy; 3039 sí.
**Cliente sin documentos (cliente_test):** `2738` ADRIAN ARLET BASTARDO ALONZO (usado en 001/002/004/006/020/021/028).

---

## Hallazgo estructural relevante (cambio de VG en servidor)

El HOME de Cobros muestra hoy SOLO 4 botones: **COBRO · ANTICIPO/PREPAGO · RETENCIÓN · BUSCAR**.
Los botones **IGTF** y **COBRO 25% IVA** NO aparecen en el DOM, pese a que el perfil marca `userCanSelectIGTF=true` y `userCanCollectIva=true` (confirmados visibles en corridas previas [ins-2606]/[ins-2610]). Verificado 3 veces (con y sin scroll, recorriendo todos los `ion-col` de `app-cobros`). → La config web del servidor para insumar dejó de exponer esos tipos de cobro. **DM-COB-036/037/044/045 = N/A por botón ausente** (no es FAIL del caso 001, cuyo PASS solo exige COBRO+BUSCAR).

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | HOME Cobros: COBRO + BUSCAR siempre visibles; RETENCIÓN + ANTICIPO/PREPAGO presentes (cobroRetencion/cobroPrepago=true). IGTF/25%IVA ausentes (ver hallazgo) |
| DM-COB-002 | ✅ PASS | COBRO → 5 tabs; General(`default`) activa; Documentos/Pagos/Total/Adjuntos `disabled`; campo Cliente vacío |
| DM-COB-004 | ✅ PASS | Cliente 2738 seleccionado → las 4 tabs (documentos/pagos/total/adjuntos) habilitan |
| DM-COB-006 | 🚫 N/A | Tabs habilitan con Comentario vacío → `requiredComment=false` efectivo (no exige comentario) |
| DM-COB-007 | ✅ PASS | Cliente 3039, Moneda Doc=US$ → Tab Documentos lista 1 factura + leyenda Vigente/Vencido/A favor |
| DM-COB-008 | ✅ PASS | Marcar checkbox factura → sticky Tab Pagos "Monto total a pagar BS: 13.181,48" se actualiza |
| DM-COB-009 | ✅ PASS | "Agregar método de pago" → modal con Efectivo/Depósito/Transferencia/Pago Móvil |
| DM-COB-012 | ✅ PASS | Monto 5.000 < total → Diferencia roja (-8.181,48); monto = total → Diferencia azul (0,00) |
| DM-COB-014 | ✅ PASS | Tab Total: tabla por documento (FACT20088816 13.181,48) + totales no nulos (Pago BS 13.181,48, Dif 0,00) |
| DM-COB-015 | ✅ PASS | Tab Total muestra "Total General BS: 13.181,48" al final |
| DM-COB-016 | ✅ PASS | Tab Adjuntos: acordeones Imágenes(`images`)/Archivo(`file`)/Firma(`sign`) (userCanUploadFiles + signature) |
| DM-COB-018 | ✅ PASS | Guardar → "Denario Cobros / El Cobro se ha guardado" |
| DM-COB-019 | ✅ PASS | Enviar (requiredCollectionAttachments=false) → 3 alertas sin segunda alerta de adjunto → "Cobro nro. 60 enviado exitosamente" |
| DM-COB-020 | ✅ PASS | Atrás con cobro nuevo con cambios → modal "Denario Cobros": Guardar y salir / Salir sin guardar / Cancelar |
| DM-COB-021 | ✅ PASS | "Salir sin guardar" (cobro nuevo 2738) → NO aparece Guardado nuevo en BUSCAR |
| DM-COB-022 | ✅ PASS | BUSCAR: lista con 20 cobros + searchbar; Nro.60 visible Estatus Enviado; trash solo en Guardado |
| DM-COB-024 | ✅ PASS | Reabrir Guardado 3039 → form editable, 5 tabs habilitadas, Guardar/Enviar activos; cliente y montos persisten |
| DM-COB-026 | ✅ PASS | Trash en Guardado → alert "¿Desea eliminar el Cobro?" (Cancelar/Eliminar) → desaparece sin alert de éxito |
| DM-COB-028 | ✅ PASS | ANTICIPO/PREPAGO → 4 tabs (sin Documentos) → cliente 2738 → Efectivo BS 50,00 → Guardar "El Anticipo se ha guardado" → visible en BUSCAR como Guardado |
| DM-COB-029 | ✅ PASS (envío ⏭ SKIP) | RETENCIÓN → 4 tabs (sin Pagos) → cliente 3039 + doc US$ → Guardar "La Retención se ha guardado". Envío SKIP: retención siempre exige adjunto |
| DM-COB-033 | ✅ PASS | Tab General: selector Moneda cobro habilitado con 2 opciones (BS/US$); multiCurrency=true |
| DM-COB-034 | ✅ PASS | Tab Documentos: selector Moneda Documento filtra — US$=1 doc, BS=0 ("No hay documentos") |
| DM-COB-036 | 🚫 N/A | Botón IGTF ausente del HOME hoy (ver hallazgo estructural) |
| DM-COB-037 | 🚫 N/A | Botón COBRO 25% IVA ausente del HOME hoy (ver hallazgo estructural) |
| DM-COB-038 | ✅ PASS | Atrás → "Guardar y salir" → "El Cobro se ha guardado" → aparece en BUSCAR Estatus Guardado (3039) |
| DM-COB-039 | 🚫 N/A | Rama A: `enabledManualRate=false`, `#manualRateInput` ausente. Rama B (Fecha tasa): el modal datetime no propaga el cambio vía CDP (ver limitación) → ninguna rama accionable |
| DM-COB-040 | ✅ PASS | Depósito + BANESCO RAEL + Nro + monto=total (13.181,48) → Diferencia azul 0,00 |
| DM-COB-041 | 🚫 N/A | `retencion=false`: detalle de documento SIN campos Retención IVA/ISLR/Comprobante → retención va por +RETENCIÓN del menú (029) |
| DM-COB-042 | 🚫 N/A | Depende de 041 (retencion=false) |
| DM-COB-043 | ✅ PASS | Con doc + método activo: monto < total → Diferencia roja; monto = total → Diferencia azul (color cambia en ambas) |
| DM-COB-044 | 🚫 N/A | Cobro IGTF no disponible (botón IGTF ausente del HOME hoy) |
| DM-COB-045 | 🚫 N/A | Cobro IGTF no disponible (botón IGTF ausente) + insumar no expone selector de tasa IGTF (sin alterna) |
| DM-COB-046 | ✅ PASS | Detalle documento → toggle "Pago parcial:" (false→true) → "Monto a pagar BS" editable → 8.000,00 → Tab Pagos muestra 8.000,00 (no el total 16.048,04); persiste en round-trip (Tab Total = Monto Pago 8.000,00 / Total General BS 8.000,00 tras reabrir) |
| DM-COB-047 | 🚫 N/A | El botón Fecha tasa abre el modal, pero el `ion-datetime` no propaga el cambio al recálculo vía CDP en este build (limitación de automatización, no defecto) |

---

## Registros creados en sistema

| Tipo | Cliente | Documento / Detalle | Monto | Estado | Motivo |
|------|---------|---------------------|-------|--------|--------|
| Cobro | 3039 ALEJANDRO RAMIREZ | FACT20088816 · Depósito BANESCO RAEL | BS 13.181,48 | **Enviado (Nro. 60)** | Envío end-to-end (DM-COB-019) |
| Cobro (pago parcial) | 3039 ALEJANDRO RAMIREZ | FACT20090080 · Depósito BANESCO · parcial | BS 8.000,00 / 16.048,04 | Guardado → **Eliminado** | Consumido por round-trip 046 + borrado 026 |
| Cobro | 3039 ALEJANDRO RAMIREZ | FACT20090080 · "Guardar y salir" | — | **Guardado (Ref 0)** | DM-COB-038; pendiente envío manual |
| Anticipo | 2738 ADRIAN ARLET | Efectivo | BS 50,00 | **Guardado (Ref 0)** | DM-COB-028; pendiente envío manual |
| Retención | 3039 ALEJANDRO RAMIREZ | FACT US$ | — | **Guardado (Ref 0)** | DM-COB-029; pendiente envío manual (retención exige adjunto) |

> Nota: durante la corrida se observó un 2º Guardado de 2738 en la lista BUSCAR junto al Anticipo. No bloquea ningún caso; revisar manualmente si es duplicado de esta corrida o residuo previo.

**Cobros pendientes de envío manual por QA:** los 3 Guardados (Cobro 3039 Ref0, Anticipo 2738, Retención 3039). La Retención requiere adjunto manual para poder enviarse.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Limpieza de input acumulador de centavos (Monto Depósito/Efectivo, Monto a pagar parcial) | universal | `pg.mouse.click` en el `<input>` → `keyboard.press('Backspace')` ×10-12 con delay (deja "0,00") → `keyboard.type(digitos)` (sin coma; ej. `'800000'` = 8.000,00) → blur + ionBlur. Más fiable que `fillIonInput` (que multiplica el valor). Reconfirma nota globalmp `[gmp-2606]` |
| Toggle "Pago parcial" en detalle de documento | cliente insumar (reconfirma [ins-2611]) | dentro de `ion-modal` "Detalle del documento": `ion-toggle` (1 solo) → click activa → el `ion-input` "Monto a pagar BS" (idx ~12 de los ion-input visibles del modal) pasa `readonly=false` → escribir parcial con acumulador → Guardar del modal (Pointer+shadow+mouse, coords frescas tras blur). Tab Pagos refleja el parcial; persiste en round-trip (verificado en Tab Total) |
| `#bankPickerModal` lista solo aparece tras escribir en su buscador | cliente insumar | tras abrir `.bank-picker-trigger`, la lista viene vacía ("Buscar banco"); enfocar el `input` interno + `keyboard.type('BANESCO')` → aparece "BANESCO RAEL - <cuenta>". Seleccionar el elemento más profundo (menor textContent.length) que contiene el nombre |
| Reapertura Guardado Ref 0 vía CDP | cliente insumar | la secuencia de 5 eventos (`pointerdown/mousedown/pointerup/mouseup/click`) sobre el `ion-label` interno + el `ion-item` SÍ abrió el detalle del Ref 0 esta corrida (contradice parcialmente `reapertura_ref0_cdp_inestable` — funcionó de forma consistente hoy) |
| Modal de Fecha tasa (`.letrasFechasButton`) NO accionable vía CDP en insumar | cliente insumar | el `ion-datetime` del modal de fecha tasa NO tiene botón Aceptar en su shadowRoot (modo inline) y ni asignar `.value`+ionChange, ni click en día del calendario, ni `dt.confirm(true)` propagan el cambio al recálculo de la app. La fecha del botón no cambia y no se dispara el alert de recálculo. → DM-COB-047 y 039-B no automatizables aquí (≠ central_foods donde sí funcionó) |
| Botones IGTF / 25%IVA ausentes del HOME insumar 20260619 | cliente insumar | pese a `userCanSelectIGTF=true`/`userCanCollectIva=true` en perfil, hoy no se renderizan (solo COBRO/ANTICIPO/RETENCIÓN/BUSCAR). Cambio de config web del servidor |

> ✅ consolidado 2026-06-19

---

## Hallazgos (no hay FAIL)

No se registraron FAIL. Dos puntos a comunicar al equipo:

1. **Botones IGTF y COBRO 25% IVA desaparecieron del HOME de Cobros** (insumar) pese a las VGs `userCanSelectIGTF`/`userCanCollectIva=true` del perfil. Si se espera que esos tipos de cobro estén disponibles, revisar la config web del servidor de insumar (Isla Coche). Si es intencional, actualizar las VGs del perfil a `false`.

2. **Limitación de automatización (no defecto):** el modal de Fecha tasa (`.letrasFechasButton` → `ion-datetime` inline) no es accionable vía CDP en este build; el cambio de fecha no se propaga al recálculo. DM-COB-047 y la rama B de DM-COB-039 no pudieron ejecutarse automatizadamente. El flujo existe en la app (manual) — solo no es automatizable hoy.
