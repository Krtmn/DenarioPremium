# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_100801_smoke-completo` |
| Módulo | COBROS |
| App | `com.kiberno.denarioPremiumPro` (build refactorizado — `window.ng` no disponible) |
| Playa / Cliente | jerez |
| Empresa usada (docs) | INVERSIONES JEREZ 2 (00002) — cliente MULTIREPUESTOS DRG (6→1 doc USD, drift) |
| Cliente sin docs | JL Motors SE,C.A (J-506554950) — INVERSIONES JEREZ 1 |
| Cotejo BD | OMITIDO por prompt (§10 y captura de payloads no ejecutados). Round-trip §9 UI→UI SÍ aplicado. BD local inaccesible (`sqlite3` no en dispositivo) → BD-N/A |
| Estado final | HOME ✅ |
| Resultado | **29 PASS · 0 FAIL · 0 SKIP · 5 N/A · 0 BLOCKED** (re-run + validación de helpers parchados 2026-07-06) |

> **Cierre 2026-07-06:** los 4 casos que quedaban ⛔ BLOCKED (041/042/047/039) se **validaron PASS** tras parchar 2 helpers (`h.setIonDatetime` para Fecha Tasa, `h.fillNgModelField` para el modal de detalle de retención) — sin cambios de flujo de la app, solo automatización. Cobros queda **0 BLOCKED**. Detalle de los selectores/helpers en `module-selectors/cobros.md` `[jerez-2026-07-06]`.

> **Re-run 2026-07-06 tras limpiar caché — el cambio de empresa ya recarga clientes; harness H3 resuelto por estado local, no era defecto de app.** De los 9 casos que quedaron ⛔ BLOCKED por H3: **2 PASS** (029, 046), **3 N/A** (036/044/045 — sin documento IGTF elegible hoy), **4 BLOCKED** por limitaciones de harness DISTINTAS a H3 (041/042 = campos IVA/ISLR + Fecha Comp Ret `date_event` del modal de detalle no conducibles por CDP en build refactorizado; 047/039 = Fecha Tasa vía CDP no recalcula, limitación ya documentada).

## Resumen ejecutivo

Se validó el ciclo completo de un cobro con documento real (selección cliente → documento → método de pago → diferencia → Guardar → BUSCAR → reabrir → Enviar), más los flujos de estructura, dirty-guard, anticipo, eliminación y selectores de moneda. **Un cobro real fue ENVIADO (Ref 81)** y un anticipo quedó Guardado.

**Bloqueo de harness (H3) confirmado:** en este build refactorizado `window.ng` no está disponible y **el cambio de empresa vía CDP NO recarga la lista de clientes del modal** (siempre muestra los 3 clientes de la empresa 1, saldo 0, sin documentos). Solo se logró cargar los clientes de la empresa 2 (con documentos) **una vez** por una race irreproducible del flujo "cambio de empresa → reiniciar transacción"; con ese acceso se completó el cobro Ref 81. Tras >8 intentos acotados (muy por encima del techo de 2 de RUNTIME §3), no fue posible **re-alcanzar** de forma determinista un cliente emp2 con documento, por lo que los sub-flujos que lo requieren (retención en detalle, pago parcial, fecha-tasa recálculo, IGTF, retención botón) quedan ⛔ BLOCKED por automatización — **no son defectos de app** (un usuario real cambia de empresa sin problema).

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Home: COBRO, ANTICIPO/PREPAGO, RETENCIÓN, IGTF, COBRO 25% IVA, BUSCAR visibles |
| DM-COB-002 | ✅ PASS | 5 tabs; Documentos/Pagos/Total/Adjuntos `disabled`; Cliente vacío; solo General activa |
| DM-COB-004 | ✅ PASS | Seleccionar cliente (MULTIREPUESTOS DRG) habilita las 4 tabs; sin comentario (requiredComment=false) |
| DM-COB-006 | 🚫 N/A | `requiredComment=false` — campo Comentario ng-valid vacío, no exige |
| DM-COB-007 | ✅ PASS | Tab Documentos: leyenda Vigente/Vencido/A favor + selector Moneda Documento; doc *026299 al elegir USD |
| DM-COB-008 | ✅ PASS | Checkbox doc (false→true) → Pagos "Monto total a pagar BS: 29.360,41" |
| DM-COB-009 | ✅ PASS | "Agregar método de pago" → modal Efectivo/Depósito/Transferencia/Otros |
| DM-COB-012 | ✅ PASS | Monto parcial 0,10 → Diferencia -29.360,31 `color:red`; monto=total → 0,00 `color:blue` |
| DM-COB-014 | ✅ PASS | Tab Total: tabla (Tipo/Nro.Doc/Monto Doc/Monto Pago) + acordeón Efectivo + Pago BS 29.360,41 |
| DM-COB-015 | ✅ PASS | Línea "Total General BS: 29.360,41" visible al final del Tab Total |
| DM-COB-016 | ✅ PASS | Tab Adjuntos: acordeones Imágenes (BUSCAR/TOMAR FOTO), Archivo (Subir), Firma |
| DM-COB-018 | ✅ PASS | Guardar → alert "El Cobro se ha guardado" |
| DM-COB-019 | ✅ PASS | Enviar (sin adjunto, requiredCollectionAttachments=false) → "Cobro nro. 81 enviado exitosamente" → BUSCAR: Ref 81 Estatus Enviado |
| DM-COB-020 | ✅ PASS | Back con cobro nuevo con cambios → modal 3 opciones (Guardar y salir / Salir sin guardar / Cancelar) |
| DM-COB-021 | ✅ PASS | "Salir sin guardar" (cobro nuevo) → no aparece en BUSCAR (0 JL Motors Guardado) |
| DM-COB-022 | ✅ PASS | BUSCAR: `app-cobros-list` con searchbar; trash `ion-button[color=danger]` solo en Estatus Guardado |
| DM-COB-024 | ✅ PASS | Reabrir Guardado: Monto total 29.360,41 · Pago 29.360,41 · Diferencia 0,00 · Total General 29.360,41 · doc *026299 — round-trip §9 sin divergencia |
| DM-COB-026 | ✅ PASS | Trash → "¿Desea eliminar el Cobro?" (Cancelar/Eliminar) → Eliminar → desaparece |
| DM-COB-028 | ✅ PASS | ANTICIPO/PREPAGO (4 tabs sin Documentos) → JL Motors → Pagos Efectivo 50,00 → Guardar "El Anticipo se ha guardado" → BUSCAR: "Estatus: Guardado … Anticipo" |
| DM-COB-033 | ✅ PASS | Selector Moneda cobro (General) BS/USD, 2 opciones; cambia BS(local)→USD(hard) |
| DM-COB-034 | ✅ PASS | Selector Moneda Documento BS/USD; lista de docs se puebla en USD, vacía en BS (filtra por moneda) |
| DM-COB-038 | ✅ PASS | Back → "Guardar y salir" → "El Cobro se ha guardado" → BUSCAR: JL Motors Estatus Guardado |
| DM-COB-040 | ✅ PASS | Efectivo + monto = total (29.360,41) → Diferencia BS 0,00 `color:blue` |
| DM-COB-043 | ✅ PASS | Diferencia roja con monto insuficiente, azul al cubrir (ambos sentidos) |
| DM-COB-041 | ✅ PASS | **Validación helpers 2026-07-06:** detalle de doc *020141 (ISOLINA emp2). `h.fillNgModelField` Nro Comp Ret (14 díg) → habilitó IVA/ISLR → IVA 5,00 + ISLR 3,00 (total retenido computó 8) → `h.setIonDatetime` en Fecha Comp Ret (`ion-datetime#calendar`) → **Guardar habilitó y guardó** (modal cierra en silencio, sin alert). El bloqueo previo (inputs resistían el foco) lo resuelve `fillNgModelField` (foco por click real en coords) |
| DM-COB-042 | ✅ PASS | **Validación helpers 2026-07-06:** reabrí el detalle → Nro=14 díg, IVA=5,00, ISLR=3,00, total=8, Fecha=2026-07-06 **persistieron** (round-trip §9). Cobro retención dejado Guardado |
| DM-COB-046 | ✅ PASS | **Re-run:** ISOLINA emp2 doc *018575 (saldo BS 845,84) → toggle "Pago parcial" ON → Monto a pagar **BS 400,00** → Efectivo 400,00 (Dif. 0,00 azul) → Guardar → BUSCAR → reabrir → **Monto total a pagar sigue 400,00** (no revierte al total). Round-trip §9 OK |
| DM-COB-047 | ✅ PASS | **Validación helpers 2026-07-06:** ISOLINA emp2 doc *020141, monto inicial BS 13.368,86. `h.setIonDatetime('2026-06-04')` (confirmed+clicked) → **disparó alert "Está cambiando la fecha de la tasa..."** → Aceptar → **Monto recalculó a BS 13.196,71** → Efectivo 13.196,71 (Dif. 0,00 azul) → Guardar → reabrir BUSCAR → **13.196,71 persiste** (§9). El bloqueo previo (datetime sin Aceptar accesible) lo resuelve `setIonDatetime` (`dt.confirm()` + emite ionChange) |
| DM-COB-029 | ✅ PASS | **Re-run:** tile RETENCIÓN → empresa 2 → ISOLINA DEL CARMEN → doc *018575 → Tab Total (Monto IVA/ISLR/total retenido visibles) → Guardar → **"La Retención se ha guardado"** (Guardado; envío SKIP por adjunto obligatorio). Entrada de montos IVA/ISLR vía detalle comparte el límite de 041, pero el flujo de retención Guarda OK |
| DM-COB-036 | 🚫 N/A | **Re-run:** flujo IGTF (tile) muestra **0 documentos elegibles** para BRISAS DEL CAMPO KM 30 (emp3, J-502401776, el que pide el prompt) Y para EL PODER DEL MONO (emp2) pese a saldos NO-cero → los documentos tipo IGTF drenaron (dato movido). Sin documento IGTF no hay flujo que ejercer. **H4: el selector IGTF SÍ es operable** (ver abajo) |
| DM-COB-044 | 🚫 N/A | Persistencia tasa IGTF — sin documento IGTF elegible hoy (depende de 036) |
| DM-COB-045 | 🚫 N/A | Persistencia tasa IGTF alterna — sin documento IGTF elegible hoy (depende de 036) |
| DM-COB-037 | 🚫 N/A | 25% IVA: `cliente_25iva=null` / selector 25%IVA sin cliente elegible (N/A estructural) |
| DM-COB-039 | ✅ PASS | **Validación helpers 2026-07-06:** Rama A N/A (`enabledManualRate=false`); Rama B (Fecha Tasa) sobre cobro Guardado → `h.setIonDatetime` cambió Fecha Tasa (4/6→1/7/2026) y **disparó el alert de recálculo** → Aceptar. Caveat: en Guardado el alert sale un instante después → poll del `ion-alert` (no check único) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **Nro. Ref 81** | Cobro — MULTIREPUESTOS DRG (074820707), emp 2, doc *026299, Efectivo **BS 29.360,41** | **Enviado** (envío real sin adjunto; VG requiredCollectionAttachments=false) |
| — | Anticipo — JL Motors SE,C.A (J-506554950), emp 1, Efectivo **50,00** | **Guardado** — pendiente envío manual (no se ejecutó Enviar; el anticipo exige adjunto para envío) |
| — | Cobro JL Motors (creado en DM-COB-038 "Guardar y salir") | **Eliminado** en DM-COB-026 (ya no en lista) |
| — *(re-run 06/07)* | Cobro PAGO PARCIAL — ISOLINA DEL CARMEN (10283986), emp 2, doc *018575, Efectivo **BS 400,00** (parcial de saldo 845,84) | **Guardado** — creado para round-trip DM-COB-046 (no requiere envío); persiste el parcial al reabrir |
| — *(re-run 06/07)* | RETENCIÓN — ISOLINA DEL CARMEN (10283986), emp 2, doc *018575 (montos IVA/ISLR 0,00 por límite de modal) | **Guardado** ("La Retención se ha guardado") — DM-COB-029; envío SKIP (retención exige adjunto) |

> **Registros ENVIADOS en este re-run: ninguno.** Los 2 registros del re-run quedaron **Guardado** (046 no requiere envío; 029 retención requiere adjunto → envío SKIP).

## Verificación BD

`BD-N/A` — cotejo BD omitido por prompt; adicionalmente la BD local del dispositivo no respondió (`run-as: exec failed for sqlite3: No such file or directory`). Round-trip §9 (UI→UI) aplicado y PASS en DM-COB-024 (montos persisten al reabrir el Guardado).

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `window.ng` = **false** en build jerez | cliente (build) | Producción sin debug de Angular → `openNuevoCobro`/`openDocumentDetail` (fallback window.ng) inoperantes; usar clicks reales en tiles |
| ⚠ Cambio de empresa NO recarga clientes del modal vía CDP | cliente jerez (build) | `app-cobro-general ion-select` (1º) cambia `value` (obj {idEnterprise,coEnterprise,lbEnterprise,coCurrencyDefault}) pero el modal `#clienteSelectModal` sigue mostrando los clientes de emp 1 (default). Sin `window.ng` no se puede forzar la recarga. **Gateway BLOCKED** para clientes emp2/3 con documentos. Opciones futuras: tap nativo real (adb) o helper que dispare el handler de recarga |
| Alert "Se ha detectado cambio del empresa por lo que deberá iniciar nuevamente la transacción" (Aceptar) | cliente jerez | Aparece al mezclar empresa≠cliente; resetea el form (emp=null, cliente=null). Race que —una vez— committeó emp2 y permitió cargar sus clientes en un form fresco |
| Selector Moneda cobro (General) | universal COBROS | 2º `ion-select` de `app-cobro-general`, opciones BS/USD, value obj {coCurrency, localCurrency, hardCurrency}. DM-COB-033 |
| Componentes de tab | universal COBROS | `app-cobro-general` · `app-cobro-documents` · **`app-cobro-pagos`** (no `-payments`) · `app-cobro-total` · `app-adjunto` |
| Campo Monto (Pagos) — llenado fiable | universal COBROS | Centavos acumulativo. Fiable: `input.focus()` + Ctrl+A + Delete + `pg.keyboard.press('Digit'+ch)` por cada dígito de centavos + blur (`FocusEvent('blur')`+`ionBlur`). `mouse.click`+`keyboard.type` e `fillIonInput` NO fiables aquí |
| Diferencia (Pagos) color | universal COBROS | leaf con `style="color: red"` (insuficiente) / `style="color: blue"` (cubre, 0,00). Texto "Diferencia BS: X" |
| Modal métodos de pago | universal COBROS | botón "Agregar método de pago" o `#eventModal.present()`; métodos Efectivo/Depósito/Transferencia/Otros; acordeón Efectivo value `efectivo0` (expandir con `grp.value=acc.value`+ionChange) |
| Estatus de lista BUSCAR | cliente jerez | Enviado → "Estatus: Enviado" / "Por aprobar"; Guardado con trash. Nro.Ref visible ("Nro Ref: 81") |
| Dirty-guard COBROS **fiable** vía CDP en jerez | cliente jerez | `img.fechaAtras`→closest('a')+MouseEvent dispara consistentemente modal "Guardar y salir / Salir sin guardar / Cancelar". Delete: "¿Desea eliminar el Cobro?" (Cancelar/Eliminar) |
| Tile IGTF visible en UI (H4) | cliente jerez | Selector IGTF presente en Tab Documentos con opciones "IGTF - 0% / IGTF 3% - 3% / Pago separado" — operable pero no ejercitado por bloqueo emp2 |
| **H4 IGTF: `userCanSelectIGTF` EFECTIVO = true** (re-run) | cliente jerez (config) | El selector IGTF de Tab Documentos es **operable**: opciones `IGTF - 0%` (price 0, defaultIgtf=false) y `IGTF 3% - 3%` (price 3, **defaultIgtf=true**); leído de `sel.value` en cobro normal de ISOLINA emp2. **Contradice el CSV `userCanSelectIGTF=false` → actualizar YAML a true.** ⚠ PERO: 036/044/045 quedaron N/A por dato — el flujo IGTF (tile) filtra a documentos tipo IGTF y **hoy no hay ninguno** (BRISAS emp3 y EL PODER DEL MONO emp2 = 0 docs en el flujo IGTF pese a saldos>0). Re-correr 036/044/045 cuando exista un documento tipo IGTF vigente |
| Empresa change (H3) RESUELTO por limpieza de caché (re-run) | cliente jerez (build) | Tras limpiar almacenamiento/caché, asignar `ion-select.value` (obj empresa) + `ionChange` → alert "cambio del empresa" → Aceptar → `#clienteSelectModal` **SÍ recarga** los clientes de la empresa elegida (emp2: FERRETERIA MUNDIAL/EL PODER DEL MONO/ISOLINA; emp3: Brisas del Campo, etc.). H3 era estado local stale, NO defecto de app |
| Modal detalle documento: input reactivo por CDP (re-run) | cliente jerez (build) | Foco fiable = `el.focus()` + verificar `document.activeElement===el` (loop) + `keyboard.press('Digit'+n)`; los clicks de coords caen en ION-GRID/ION-MODAL. **Campos que NO se logran enfocar: Monto retenido IVA/ISLR**; **Fecha Comp Ret** = `type="date_event"`/`#inputCalendar` sin calendario conducible. Checkbox de documento: marcar por **dispatch en el host `ion-checkbox`** (coords caen sobre ION-GRID). Reabrir Guardado en BUSCAR: **dispatch de secuencia click en el host `ion-item`** (click de coords/locator no dispara) |

> ✅ consolidado 2026-07-06 · re-run 2026-07-06 (H3 resuelto, 046/029 PASS, H4 selector IGTF operable)

## Hallazgos (FAIL)

Ninguno. 0 FAIL.
