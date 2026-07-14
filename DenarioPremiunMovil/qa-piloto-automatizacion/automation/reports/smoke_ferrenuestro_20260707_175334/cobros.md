# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260707_175334_smoke-completo` |
| Módulo | COBROS |
| Dispositivo | 14678405BR003855 (Android real, CDP :9220) |
| App | `com.kiberno.denarioPremiumPro` — build refactorizado El Yaque (Isla Coche), `window.ng=false` |
| Cliente / Playa | ferrenuestro (FERRENUESTRO MAYOR, · Isla Coche) |
| Resultado | 26 PASS · 0 FAIL · 1 SKIP · 6 N/A · 1 BLOCKED (34 casos) |

## Contexto técnico
- **Build tipo jerez/El Yaque:** `window.ng=false` → helpers con fallback Angular (`openNuevoCobro`, `openDocumentDetail` fallback) inoperantes. Se condujo TODO con clicks reales / coords + `ion-segment.value` para tabs.
- **Empresa única:** "FERRENUESTRO MAYOR," (enterpriseEnabled=true, sin gateway multi-empresa).
- **Cliente con documentos usado (descubierto en runtime):** **TORNICAGUA, C.A. (co_client 121793873, id_client 504)** — 14 documentos tipo 11 en **$** visibles en UI (Moneda Documento = $; en Bs. la lista sale vacía). Pre-vuelo BD: tipo 11 top = GRUPO GRAVEN (231 docs) / OSWALDO CASTILLO GOYO (207); TORNICAGUA (125 docs) fue el seleccionado y suficiente.
- **Tasa:** tasa del día **652,97 BS/USD**; `#manualRateInput` **editable** (enabledManualRate=true) — se cambió a 700 y persistió.
- **Método de pago usado:** **Efectivo** (métodos disponibles: Efectivo, Depósito, Transferencia, Otros, Pago Móvil — SIN Cheque, coherente con `colletionPayment`).
- **Mock de cámara (adjunto):** **NO funciona** (build PROD; botón TOMAR FOTO no conducible por CDP y la foto no entra al carrusel — igual que romher/piercar/El Yaque) → `mock_camara_funciona = false`. DM-COB-019/029 envío = SKIP (cobros quedan Guardados pendientes de adjunto manual).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Home: COBRO, ANTICIPO/PREPAGO, RETENCIÓN, BUSCAR. Sin IGTF ni 25%IVA (VG off) |
| DM-COB-002 | ✅ PASS | 5 tabs; Documentos/Pagos/Total/Adjuntos disabled; `#clienteSelect` vacío |
| DM-COB-004 | ✅ PASS | Cliente TORNICAGUA → 4 tabs habilitan |
| DM-COB-006 | 🚫 N/A | `requiredComment=false` → comentario no obligatorio |
| DM-COB-007 | ✅ PASS | Moneda Documento=$ → 14 docs tipo 11; leyenda Vigente/Vencido/A favor |
| DM-COB-008 | ✅ PASS | Checkbox doc 00037106 → "Monto total a pagar Bs.: 10.891,54" (16,68$ × 652,97) |
| DM-COB-015 | ✅ PASS | Tab Total: "Total General" presente; Monto/Pago/Diferencia/tabla |
| DM-COB-033 | ✅ PASS | Selector Moneda cobro (2º ion-select): Bs./$ ; cambio Bs→$ dispara "¿cambiar moneda? El cobro será reiniciado" |
| DM-COB-034 | ✅ PASS | Moneda Documento Bs.→0 docs, $→14 docs (filtra/recarga) |
| DM-COB-041 | ✅ PASS (mecanismo) | Detalle doc: **Nro. Comp Ret (14 díg)** habilita **Monto retenido IVA + ISLR + Fecha Comp Ret**; con los 4 llenos, **Guardar del detalle habilita**. Ver Hallazgos |
| DM-COB-042 | ⛔ BLOCKED | Guardar limpio de la retención bloqueado en doc 00037106 (base Bs anómala 0,03) → retención excede documento ("El pago no puede ser mayor…"). Round-trip neto no completado. Ver Hallazgos |
| DM-COB-009 | ✅ PASS | "Agregar método de pago" → modal con Efectivo/Depósito/Transferencia/Otros/Pago Móvil |
| DM-COB-040 | ✅ PASS | Efectivo agregado; acordeón con Nro. Recibo/Monto/Fecha; diferencia azul al cubrir |
| DM-COB-012 | ✅ PASS | Monto 0 → Diferencia roja (-10.891,54); monto que cubre → Diferencia azul |
| DM-COB-043 | ✅ PASS | Color diferencia cambia rojo↔azul según cubre (lógica correcta) |
| DM-COB-014 | ✅ PASS | Tab Total: tabla + acordeón Efectivo + totales no nulos |
| DM-COB-016 | ✅ PASS | Adjuntos: acordeones Imágenes (BUSCAR/TOMAR FOTO), Archivo (Subir), Firma (Borrar) |
| DM-COB-018 | ✅ PASS | Guardar → "El Cobro se ha guardado" (previo: "Anticipo automático creado con 0,08" por `automatedPrepaid`) |
| DM-COB-019 | ⏭ SKIP | `requiredCollectionAttachments=true` + mock cámara no funciona → envío SKIP; cobro Guardado pendiente de adjunto manual (BD-SAVED) |
| DM-COB-022 | ✅ PASS | BUSCAR: lista + searchbar; Guardado sin Ref; Enviados con Nro Ref |
| DM-COB-024 | ✅ PASS | Reabrir Guardado: editable; cliente/método/montos persisten; Guardar/Enviar activos |
| DM-COB-026 | ✅ PASS | Basura (ion-button[color=danger], solo en Guardado) → "¿Desea eliminar el Cobro?" → desaparece |
| DM-COB-020 | ✅ PASS | Atrás con cobro nuevo con cambios → modal "Guardar y salir / Salir sin guardar / Cancelar" |
| DM-COB-021 | ✅ PASS | "Salir sin guardar" (cobro nuevo) → NO aparece en BUSCAR |
| DM-COB-038 | ✅ PASS | "Guardar y salir" → aparece Guardado en BUSCAR |
| DM-COB-029 | ✅ PASS | RETENCIÓN: tabs General/Documentos/Total/Adjuntos (sin Pagos); doc→Total (columnas Monto IVA/ISLR Bs)→Guardar→"La Retención se ha guardado". Envío SKIP (adjunto) |
| DM-COB-028 | ✅ PASS | ANTICIPO: tabs sin Documentos; cliente TORNICAGUA (selector NO vacío)→Pagos Efectivo 1,00→"El Anticipo se ha guardado"; visible en BUSCAR como Anticipo |
| DM-COB-036 | 🚫 N/A | `userCanSelectIGTF=false` → sin tile IGTF (estructural) |
| DM-COB-044 | 🚫 N/A | `userCanSelectIGTF=false` (estructural) |
| DM-COB-045 | 🚫 N/A | `userCanSelectIGTF=false` (estructural) |
| DM-COB-046 | ✅ PASS | Toggle "Pago parcial" (detalle doc 00037108, saldo Bs 43.200,50 sano) → "Monto a pagar" editable → parcial 0,50 → Aceptar → Pagos = 0,50 → Guardar → reabrir = **0,50 persiste** (round-trip §9) |
| DM-COB-047 | 🚫 N/A | `canChangeRate=false` → no se cambia fecha de la tasa |
| DM-COB-037 | 🚫 N/A | `userCanCollectIva=false` → sin tile 25% IVA (estructural) |
| DM-COB-039 | ✅ PASS (rama A) | `#manualRateInput` editable (enabledManualRate=true): 652,97→700 → Guardar → reabrir = **700 persiste** (round-trip §9) |

## Registros creados en sistema
Todos **Guardados** (sin Nro Ref) — pendientes de envío manual por adjunto obligatorio (`requiredCollectionAttachments=true` + mock cámara no funciona). Nube `collection` sin cambios (347) → ninguno llegó a la nube (esperado).

| Ref | Detalle | Estado | BD |
|-----|---------|--------|----|
| (sin Ref) | Cobro normal TORNICAGUA — doc 00037108, pago parcial 0,50, tasa manual 700 | Guardado (pend. adjunto) | BD-SAVED (nube 347 sin cambio) |
| (sin Ref) | Retención TORNICAGUA — doc 00037106 (IVA/ISLR 0,00) | Guardado (pend. adjunto) | BD-SAVED |
| (sin Ref) | Anticipo TORNICAGUA — Efectivo 1,00 | Guardado (pend. adjunto) | BD-SAVED |
| (sin Ref) | Anticipo automático TORNICAGUA — 0,08 (por `automatedPrepaid`, diferencia positiva) | Guardado | BD-SAVED |
| — | (1 cobro normal TORNICAGUA extra fue creado y **eliminado** para DM-COB-026) | Eliminado | — |

## Verificación BD
- **Nube (`collection`):** baseline 347 → post-corrida **347** (max id 347). **Ningún cobro llegó a la nube** — correcto: todos quedaron Guardados (envío SKIP por adjunto obligatorio). Marca **BD-SAVED** para todos los registros creados.
- **Local (SQLite dispositivo):** `local-query.js` → `ERR: run-as: exec failed for sqlite3: No such file or directory` (sin sqlite3 accesible en este build/dispositivo) → **BD-N/A** para el detalle `st_delivery`. El blindaje aplica: la BD no tumba el smoke; el cotejo de nube (347 sin cambio) es evidencia suficiente de que nada se envió.
- **Payloads capturados:** 24, todos `syncservice/getsync` (polling). **0 POST de `collectservice`** — consistente con 0 cobros enviados.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Selección de cliente en modal (build El Yaque) | universal (builds `window.ng=false`) | `#clienteSelectModal.present()` → set `.value` del `input[placeholder="Clientes..."]` + evento `input`/`keyup` (NO click en el input: lo cierra) → click en el `<p>` del nombre filtrado. Confirmado end-to-end |
| Retención por detalle de documento (orden de habilitación) | universal COBROS | El **Nro. Comp Ret** (ion-input) hay que targetearlo por su fila propia (`closest ion-row/col` con "Comp Ret" y **NO** "Tipo de documento") — el 1er `ion-input` del contenedor es Tipo. Llenar Comp Ret 14 díg (`input.focus()` + `keyboard.type` + `.value` setter + input/keyup/ionInput/ionChange/blur/ionBlur) **revela y habilita** Monto retenido IVA, ISLR y Fecha Comp Ret. Sin esto, Guardar del detalle queda disabled |
| Campos monto centavos-acumulativos (IVA/ISLR/Monto pago/parcial) | universal COBROS El Yaque | teclear SOLO dígitos vía `keyboard.press('Digit'+ch)` (ej. 1,00 = "100"; la coma rompe la acumulación → "1,00" da "0,01"). Limpiar con Backspace×N, no Ctrl+A |
| Fecha Comp Ret | universal COBROS | `ion-input#inputCalendar` (display) → click revela `ion-datetime#calendar` oculto → `dt.value=ISO` + `ionChange`/`ionValueChange` + `dt.confirm()` |
| Moneda cobro / Moneda documento (ion-select con value objeto) | universal COBROS | value es objeto `{coCurrency, localCurrency, hardCurrency, ...}`; asignar `sel.value = <option.value>` + `ionChange`. General: 1º=Empresa, 2º=Moneda cobro; Documentos: 1º=Moneda documento |
| Acordeón método de pago (Efectivo) | cliente/build | no es `ion-accordion` estándar; expandir con click real en el header con texto "Efectivo"; campos Nro. Recibo/Monto/Fecha quedan visibles |
| Salida del form sobre-navega | universal build El Yaque | tras Guardar, `clickBack` desde form pasa por lista→home; controlar el destino con `getActiveView` en cada back (evitar loops de back que llegan a HOME) |

> ✅ consolidado 2026-07-07 → retención-por-detalle, Fecha-Comp-Ret, Moneda-cobro, centavos-acumulativos con tag en `module-selectors/cobros.md`; selección-cliente-El-Yaque, acordeón-Efectivo, salida-sobre-navega y mock_camara/automatedPrepaid en Notas por cliente; datos en `ferrenuestro.yaml modules.cobros`.

## Hallazgos (no-FAIL, notables)
1. **Documentos con base Bs anómala (dato, no bug de app confirmado).** El doc **00037106** muestra Monto base Bs **0,03** para 16,68 $ (mientras 00037108 tiene Bs **43.200,50** para 61,72 $, sano). En el cobro/retención sobre 00037106 el motor usa el saldo Bs ínfimo (0,03) para la diferencia y para validar la retención → cualquier IVA/ISLR sensato "excede el documento" y dispara "El pago no puede ser mayor al monto del documento", dejando Guardar del detalle disabled. Esto **bloqueó DM-COB-042** (round-trip neto). Recomendación: rehacer 041/042 sobre un doc con Bs sano (ej. 00037108) — el mecanismo de retención ya quedó validado (041 PASS).
2. **DM-COB-041 mecanismo validado:** `sizeRetention=14` confirmado en UI ("Debe tener 14 caracteres"); Nro. Comp Ret habilita IVA/ISLR/Fecha; el modal de retención **cierra en silencio** (sin alert "La Retención se ha guardado" en el detalle — como jerez).
3. **`automatedPrepaid=true` operativo:** un cobro con diferencia positiva (sobrepago) dispara "Anticipo automático creado con X" y guarda el anticipo junto al cobro.
4. **Mock de cámara NO inyecta** (build PROD, `window.ng=false`) → `mock_camara_funciona=false` para el YAML. Envíos de cobro/retención quedan pendientes de adjunto manual por QA.

*Sin FAIL. VGs verificadas contra UI coinciden con el dump (sin discrepancias estructurales): sin IGTF, sin 25%IVA, RETENCIÓN y ANTICIPO presentes, Efectivo habilitado, multiCurrency activo, manualRate editable, canChangeRate off.*
