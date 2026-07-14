# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260708_174030_smoke-completo` |
| Módulo | COBROS |
| Cliente / tenant | osoroma (multi-empresa; **empresa DISTRIBUIDORA OSOROMA 00003**) |
| Dispositivo | 14678405BR003855 (Infinix HOT 60i) |
| App | `com.kiberno.denarioPremiumPro` — WsUrl El Yaque |
| Build | ⚠ **window.ng = TRUE** (contradice supuesto YAML "El Yaque window.ng=false") → helpers vía `window.ng` operan |
| Usuario | 001 (vendedor) |
| Resultado | **16 PASS · 0 FAIL · 7 N/A · 11 BLOCKED** (34 casos) |

## Datos de prueba usados (descubiertos en runtime)
- **Cliente con documentos:** CHEVRON GLOBAL TECHNOLOGY SERVICES COMPANY (co_client 10770, idClient 2476, empresa 00003). 2 facturas **FA en USD**: `21133482` (saldo 3.422.076,66 USD ref / 9.754.443,30 VED) y `21133688` (saldo 3.068.068,73 USD / 2.950.066,08 VED). ⚠ Montos enormes (tenant staging).
- **cliente_test SIN documentos:** A. C TODOKSHER (co 27837, saldo 0). Lista de empresa 00003 = 50 clientes cargados.
- **Pre-vuelo tipos de documento (nube, empresa 00003):** SOLO tipo `FA` (385 docs / 228 clientes). **NO existe documento tipo IGTF** → DM-COB-036/044/045 = N/A-DATA.
- **Baseline nube `collection`:** total=3, max(id_collection)=19 (pre-corrida).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Home: COBRO, ANTICIPO/PREPAGO, RETENCIÓN, IGTF, BUSCAR (sin 25%IVA → userCanCollectIva=false) |
| DM-COB-002 | ✅ PASS | 5 tabs; Documentos/Pagos/Total/Adjuntos `disabled`; Cliente vacío |
| DM-COB-004 | ✅ PASS | Al seleccionar CHEVRON → 4 tabs habilitan (sin comentario; requiredComment=false) |
| DM-COB-006 | 🚫 N/A | requiredComment=false (comentario no obligatorio) |
| DM-COB-007 | ✅ PASS | Tab Documentos: 2 docs FA + leyenda Vigente/Vencido/A favor |
| DM-COB-008 | ✅ PASS | Checkbox doc → "Monto total a pagar VED 1.830.969.420,05" (antes 0); diferencia roja |
| DM-COB-009 | ✅ PASS | Modal métodos: Efectivo/Depósito/Transferencia/Pago Móvil (Cheque/Otros OFF, coincide colletionPayment) |
| DM-COB-012 | ✅ PASS | Monto 0 < total → Diferencia **roja**; monto=total → Diferencia **azul 0,0000** |
| DM-COB-014 | ✅ PASS | Tab Total: tabla Monto a Pagar VED/USD, Tasa 596,7824, Pago VED/USD, Diferencia 0,0000 |
| DM-COB-015 | ✅ PASS | "Total General VED: 1.830.969.420,0544" visible |
| DM-COB-016 | ✅ PASS | Tab Adjuntos: acordeones Imágenes (BUSCAR/TOMAR FOTO), Archivo, Firma |
| DM-COB-018 | ✅ PASS | Guardar → alert "El Cobro se ha guardado" (Aceptar) |
| DM-COB-019 | ✅ PASS | Enviar → "El Cobro será enviado" (Aceptar) → "Su Cobro será enviado" (OK). **SIN** alerta de adjunto (requiredCollectionAttachments=false → ENVIABLE, ≠ piercar/romher) |
| DM-COB-020 | ⛔ BLOCKED | Back sobre cobro construido programáticamente fue directo a /home sin dirty-guard, PERO changesMade no fue seteado por interacción UI real → no concluyente (limitación automatización) |
| DM-COB-021 | ⛔ BLOCKED | Depende de flujo UI limpio (ver 020) |
| DM-COB-022 | ✅ PASS | BUSCAR: `app-cobros-list` con searchbar y 5 cobros (CHEVRON Por Enviar + refs 17/18/19). Nro.Ref = id_collection |
| DM-COB-024 | ⛔ BLOCKED | No se logró crear un cobro Guardado adicional (re-entrada al form corrompe estado tras el 1er enviado) |
| DM-COB-026 | ⛔ BLOCKED | Ídem (sin Guardado eliminable) |
| DM-COB-028 | ⛔ BLOCKED | Anticipo: tile abrió form pero método de pago no se agregó vía CDP en re-entrada; setMonto falló (pagoEfectivo vacío) |
| DM-COB-029 | ⛔ BLOCKED | Retención botón: depende del detalle de documento (mismo bloqueo que 041/042) |
| DM-COB-033 | ⛔ BLOCKED | Selector Moneda cobro (Tab General) no ejercido — re-entrada al form no fiable |
| DM-COB-034 | ✅ PASS | Moneda Documento: USD→2 docs, VED→0 docs, USD→2 docs (filtro por moneda funciona) |
| DM-COB-036 | 🚫 N/A-DATA | No hay documento tipo IGTF en empresa 00003 (solo FA); cobro VED no muestra línea IGTF |
| DM-COB-037 | 🚫 N/A | userCanCollectIva=false (sin botón 25% IVA) |
| DM-COB-038 | ⛔ BLOCKED | Dirty-guard (ver 020) |
| DM-COB-039 | 🚫 N/A | enabledManualRate=false (sin `#manualRateInput`) **y** canChangeRate=false → ninguna rama aplica |
| DM-COB-040 | ✅ PASS | Método Efectivo + monto=total → Diferencia **azul 0,00** (vía `setMonto`) |
| DM-COB-041 | ⛔ BLOCKED | Detalle de documento no abrible vía CDP en re-entrada (checkbox/`selectDocumentSale` no responden; lupa disabled hasta isSelected). NO es defecto de app (la selección funcionó en 008) |
| DM-COB-042 | ⛔ BLOCKED | Encadena 041 |
| DM-COB-043 | ✅ PASS | Diferencia roja (insuficiente) → azul (cubre); ambos observados |
| DM-COB-044 | 🚫 N/A-DATA | Sin documento IGTF (ver 036) |
| DM-COB-045 | 🚫 N/A-DATA | Sin documento IGTF |
| DM-COB-046 | ⛔ BLOCKED | Pago parcial requiere detalle de documento (ver 041) |
| DM-COB-047 | 🚫 N/A | canChangeRate=false (no se puede cambiar Fecha tasa) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| co_collection `1783556177766.0` | Cobro NORMAL (co_type 0), CHEVRON (10770), empresa 00003, VED, total 1.830.969.420,0544 (=3.068.068,73 USD doc 21133688), 1 método Efectivo cubriendo total, diferencia 0. **Guardado (018) + Enviado (019)** | **Por Enviar / en cola local (stD=2)** — POST `collectionservice/collection` capturado; **NO** en nube tras poll (sync diferida, ver Verificación BD) |

## Verificación BD (co_type-aware · RUNTIME §10)
- **Baseline nube:** `collection` total=3, max(id)=19.
- **Tras Enviar (poll ~varios minutos):** nube SIN cambios (total=3, max(id)=19). El cobro `1783556177766.0` quedó **local `st_delivery=2` (Por Enviar / en cola)**, `id_collection=0`, `st_collection=2`. → **BD-QUEUED / BD-SAVED (pendiente)**.
- **Interpretación:** sync a nube **DIFERIDA** (patrón El Yaque/ferrenuestro `[ferrenuestro-2026-07-07]`: los movimientos aparecen tras la ventana de poll). El payload SÍ se posteó (21 POST `collectionservice/collection` capturados por el hook `nativePromise`), por lo que se espera que persista más tarde. **NO concluye no-persistencia**; requiere 2º baseline-diff al cierre de la corrida (Agente-BD / re-check).
- **Local (`sqlite3`):** N/A — `run-as: exec failed for sqlite3: No such file or directory` (binario ausente en el device) → cotejo local BD-N/A.
- Payload volcado a `_payloads.jsonl`.

## Hallazgos
- **Sin FAIL.** Todo lo verificado se comportó correcto. La captura de payload confirma cabecera+detalle (doc 21133688, FA)+pago (ef, nuAmountPartial=total) bien estructurados.
- **Observación (no-FAIL, seguimiento):** el cobro enviado no llegó a la nube dentro de la ventana de poll → confirmar sync diferida al cierre. Si NO llega tras 2º baseline-diff → escalar a posible no-persistencia (tipo jerez).

## Limitación de automatización (causa de los BLOCKED)
Los 11 BLOCKED comparten **una sola causa raíz**: tras el **1er cobro enviado**, **re-entrar** al formulario para una 2ª transacción corrompe el estado Angular bajo automatización CDP:
1. `nuevoCobro()` programático no re-renderiza → requiere click real en tile (documentado `[ins-2622]`).
2. **Gateway de empresa** al reabrir: `alertMessageChangeEnterprise` queda en `false` tras el 1er cambio → el ion-select ya no dispara el confirm ni aplica 00003; `updateSelectedEnterprise(3)+onEnterpriseSelect()` resetea a 00001 (su `ngOnInit`).
3. **Modal cliente** reabierto a veces sin searchbar / vacío; selección por click en `<p>` intermitente.
4. **Checkbox de documento** por coords y `selectDocumentSale(d,ev)` no marcan `isSelected` → lupa (detalle) queda `disabled` → 041/042/046/029 no abren.
5. Guardar sobre el form re-manipulado dispara "Se ha detectado cambio del cliente" (estado inconsistente).

El **primer** cobro (fresco) corrió end-to-end sin problemas (001-019/022/034/040/043), lo que confirma que **la app funciona**; es la re-entrada la que no es conducible por CDP en este build. Recomendación: correr los casos multi-cobro (028/029/041/042/046/024/026/020/021/038/033) **cada uno desde app reiniciada a HOME** o cerrar/reabrir el módulo entre cobros.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **Campo Monto (Pagos) NO conducible por teclado ni native-setter** | universal (build window.ng=TRUE) | La mask usa `centsMap[uid]` construido desde keystrokes reales; `pg.keyboard.type/press` y el native value-setter NO commitean al ngModel (`nuAmountPartial` queda 0). **Solución: `comp.setMonto(valor, index, 'ef')` + `cs.calcularMontos()` vía `window.ng`** (handler real). Métodos del componente: `setMonto`, `onMontoInput`, `updateAfterChange` (`app-cobro-pagos`). |
| **osoroma build: `window.ng` = TRUE** | cliente osoroma | Contradice el supuesto del YAML (El Yaque window.ng=false). Los helpers con fallback `window.ng` (openNuevoCobro/openDocumentDetail) SÍ operan. Actualizar YAML. |
| **BUSCAR (lista cobros): no es ruta nueva** | universal | `buscarCobro()` (en `app-cobros-container`) es async (`findCollect`) y setea flags `collectService.cobrosComponent=false` / `cobroListComponent=true`; el DOM NO refresca solo → **`window.ng.applyChanges(componenteContenedor)`** para renderizar `app-cobros-list`. Lista en `collectService.listCollect`. Nro.Ref = `id_collection`. |
| **Empresa gateway (multi-empresa)** | cliente osoroma | 1ª vez: set `ion-select` (1º de `app-cobro-general`) a la opción `coEnterprise:'00003'` + `ionChange` → alert "Se ha detectado cambio del empresa..." (Cancelar/Aceptar) → Aceptar recarga clientes empresa 3. **Re-entrada NO fiable** (flag `alertMessageChangeEnterprise=false`). Métodos: `onChangeEnterprise`/`setResultEnterprise`/`onEnterpriseSelect`/`updateSelectedEnterprise`. |
| **Modal cliente sin searchbar** | cliente osoroma (build) | En re-aperturas `#clienteSelectModal` a veces renderiza SIN `ion-searchbar` (solo lista scroll). Clientes en `selectorCliente.clientes` (página de 50). `selectClient(obj)` disponible. Seleccionar por click en `<p>` del nombre. |
| **Payload capture SÍ intercepta `collectionservice/collection`** | universal (build) | El hook `nativePromise` capturó los POST de collection (cabecera+detalle+pago). Contradice el gap histórico "collection no capturable" `reference_qa_payload_capture_gap`. |
| **Sync a nube DIFERIDA** | cliente osoroma | Cobro enviado quedó local `st_delivery=2` (Por Enviar) y NO apareció en nube tras poll de minutos. Ampliar ventana de poll / 2º baseline-diff al cierre (como ferrenuestro). |
| **`sqlite3` ausente en device** | cliente osoroma | `local-query.js` da `run-as: exec failed for sqlite3` → cotejo BD local = N/A esta corrida. |
