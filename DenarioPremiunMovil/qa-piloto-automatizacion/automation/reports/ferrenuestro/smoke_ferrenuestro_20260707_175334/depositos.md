# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260707_175334_smoke-completo` |
| Módulo | DEPÓSITOS |
| Dispositivo | 14678405BR003855 (Android real, CDP :9220) |
| App | `com.kiberno.denarioPremiumPro` — build refactorizado El Yaque (Isla Coche), `window.ng=false` |
| Cliente / Playa | ferrenuestro (FERRENUESTRO MAYOR, · Isla Coche) |
| aplica | **TRUE** (confirmado en UI: 7 bancos + 13 cobros Efectivo depositables) |
| Resultado | 10 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED (12 casos) |

## Contexto / VGs verificadas en UI
- **`depositos.aplica=TRUE` CONFIRMADO con dato real:** el selector Banco abrió con **7 opciones** y el Tab Cobros mostró **13 cobros Efectivo depositables** (históricos enviados, moneda Bs.). NO fue N/A por dato — el flujo end-to-end SÍ se ejecutó.
- **Empresa única:** "FERRENUESTRO MAYOR," (idEnterprise 1). `enterpriseEnabled=true` pero sin gateway multi-empresa (1 sola opción).
- **`multiCurrencyDeposit=TRUE` confirmado:** selector Moneda con 2 opciones — Bs. (idCurrency 2, default) y $ (idCurrency 1).
- **Mecanismo depositable (universal `[jerez-2026-07-06]`):** solo cobros ENVIADOS aparecen en Tab Cobros. Los cobros creados en el módulo Cobros de esta corrida quedaron Guardados (adjunto obligatorio) → NO son depositables. Pero la nube tiene cobros Efectivo históricos enviados y pendientes de depósito → **13 depositables reales** disponibles.
- **Tabs se habilitan tras Banco + Fecha Doc** (Cobros/Total/Adjuntos pasan de disabled a enabled). Confirma patrón `[gmp-2611][dth-2612]`.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Home Depósitos con botones **DEPÓSITO** y **BUSCAR** |
| DM-DEP-002 | ✅ PASS | Form: tabs General(activa)/Cobros/Total/Adjuntos(disabled); Guardar+Enviar disabled sin datos; selects Empresa/Moneda/Banco; Fecha Doc (idx1) editable, Fecha Depósito (idx0) disabled/timestamp; inputs Nro. Plantilla + Comentario |
| DM-DEP-004 | ✅ PASS | Selector Banco (`ion-select.selectbanco`) con **7 opciones**; banco seleccionado (idBankAccount 409 BANESCO BS JU); cuenta autollenada `01340135721351027429` |
| DM-DEP-005 | ✅ PASS | Fecha Doc (idx1) confirmada = 7/7/2026 (`confirmDatetime` OK); tras Banco+Fecha las tabs Cobros/Total/Adjuntos habilitan |
| DM-DEP-006 | ✅ PASS | Tab Cobros: marcar cobro (STUDIO KYNWOD ref 211) → **"Monto total depositado 541.17 Bs"** derivado; Guardar+Enviar habilitan (no hay campo Monto libre) |
| DM-DEP-009 | ✅ PASS | Guardar → alert "Denario Depósito — El Depósito se ha guardado" (Nro. Plantilla QA-DEP-707) |
| DM-DEP-010 | ✅ PASS | BUSCAR → lista `app-deposito-list` renderiza el depósito Guardado (defecto de render NO reprodujo de forma persistente; hubo 1 transición colgada recuperada con back — ver Hallazgos) |
| DM-DEP-014 | ✅ PASS | Reabrir depósito → datos previos persisten (Banco 409/009, cuenta 0134…027429, Nro. Plantilla "QA-DEP-707", Fecha 7/7/2026, footer "Monto total depositado 541.17 Bs") — round-trip §9 OK |
| DM-DEP-017 | ✅ PASS (caveat no-persistencia) | Enviar → **2 alerts** ("Denario Depósito — El Depósito será enviado" Cancelar/Aceptar → "Denario Premium — El Depósito será enviado" OK). UI aceptó el envío; el depósito quedó **"Por Enviar" (Ref 0)** por no-persistencia de la playa (no FAIL de UI, ver Verificación BD) |
| DM-DEP-018 | ✅ PASS | BUSCAR tras guardar/enviar → lista muestra los depósitos (2 ítems en un punto: Guardado + Por Enviar) |
| DM-DEP-019 | 🚫 N/A (por dato) | El depósito no alcanzó estado **Enviado real** (quedó "Por Enviar" por no-persistencia) → no se pudo verificar "Enviado read-only". SÍ confirmado: **el ítem no-Guardado NO muestra trash** (regla de borrado solo-Guardado se cumple) |
| DM-DEP-020 | ✅ PASS | Trash (`ion-button[color="danger"]`, solo en ítem **Guardado**) → alert **CON confirmación** "¿Desea eliminar el depósito seleccionado?" → Aceptar → el Guardado desaparece de la lista |

## Registros creados en sistema
| Ref | Detalle | Estado | BD |
|-----|---------|--------|----|
| 0 (sin Ref servidor) | Depósito #1 — Banco 009 BANESCO BS JU, cobro STUDIO KYNWOD ref 211 (541.17 Bs), Nro. Plantilla QA-DEP-707 | **Por Enviar** (Enviar aceptado, no llegó a nube) | BD-SAVED (no-persistencia) |
| — | Depósito #2 — Banco 013 BNC JOSE, cobro STUDIO KYNWOD ref 208 (516.93 Bs) | Guardado → **ELIMINADO** (DM-DEP-020) | — |

## Verificación BD (round-trip al servidor · RUNTIME §10)
- **Nube (`deposit`):** baseline pre-corrida = 0. Post-corrida (poll ~10s + re-query final) = **0** (`count=0, max(id_deposit)=0`). **El depósito enviado NO llegó a la nube.**
- **Marca: `BD-SAVED` (no-persistencia).** Es el mismo patrón de esta playa/corrida: devoluciones e inventarios tampoco persistieron (quedaron "Por Enviar"). Evidencia adicional: la captura de payload registró **18 reintentos `returnservice/return`** en background (cola de salida atascada de devoluciones que no drena) y **0 POST `depositservice`** — la app encoló el depósito pero el envío a la nube no se materializó. **NO es FAIL de UI** (la UI aceptó Enviar y mostró la cadena de alerts correcta; el depósito quedó consistente en "Por Enviar" Ref 0). Per RUNTIME §10 blindaje: la BD no tumba el smoke.
- **Local (SQLite dispositivo):** `local-query.js` → `ERR: run-as: exec failed for sqlite3: No such file or directory` (sin binario sqlite3 en este build/dispositivo, igual que en Cobros) → **BD-N/A** para el detalle `st_delivery`/cola. El cotejo de nube (0) es evidencia suficiente de que nada se envió.
- **Correlación:** Nro.Ref UI = `id_deposit` (servidor). Como no llegó a nube, Ref quedó en 0 (sin asignación de servidor) — consistente con el estado "Por Enviar".

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Banco `ion-select.selectbanco` con 7 opciones (value objeto) | cliente ferrenuestro | Bancos: idBankAccount 403 (EFECTIVO BS, coBank 010), 404 (BANESCO ROGER, 012), 405 (BNC JOSE, 013), 406 (MERCANTIL JU, 014, cta 8029810), 407 (BNC BS JU, 007, 2008265), 408 (VENEZUELA BS JU, 008, 0115144), 409 (BANESCO BS JU, 009, cta 01340135721351027429). Asignar `sel.value=<option.value>` + `ionChange` funciona (no requiere popover) |
| Cobros depositables SÍ existen aunque los cobros de la corrida no se enviaron | cliente/universal | Confirma mecanismo `[jerez-2026-07-06]`: los depositables provienen de cobros Efectivo ENVIADOS históricos (nube), no de los cobros Guardados de la corrida. 13 depositables Bs. disponibles → `aplica=true` con dato real |
| `ion-input` Nro. Plantilla / Comentario por propiedad JS `label` | universal DEPÓSITOS | `i.label.startsWith('Nro. Plantilla')` / `'Comentario'` / `'Banco'` (cuenta autollenada). Confirma `[jerez-2026-07-06]` en build El Yaque ferrenuestro |
| Envío = 2 alerts (≠ jerez 3) | cliente/build | ferrenuestro: (1) "Denario Depósito — El Depósito será enviado" Cancelar/Aceptar → (2) "Denario Premium — El Depósito será enviado" OK. NO hubo 3er alert "Depósito nro. N enviado" (jerez sí). Coincide con insumar (2 alerts) |
| Defecto render `deposit.service.ts` — INTERMITENTE, transición colgada recuperable | universal DEPÓSITOS | Tras crear/guardar el 2º depósito, quedó un estado con `app-depositos` + `app-deposito` ambos montados y 0 botones visibles (transición congelada). **`clickBack` (img.fechaAtras) recupera** a app-depositos limpio; el siguiente BUSCAR renderizó la lista completa (2 ítems). El bug NO está cerrado (es una race) pero es recuperable, no bloqueante |
| Borrado Guardado CON confirmación | universal DEPÓSITOS | Alert "Denario Depósito — ¿Desea eliminar el depósito seleccionado?" (Cancelar/Aceptar). Trash `ion-button[color="danger"]` solo en ítem **Guardado**, ausente en "Por Enviar"/Enviado. Confirma `[ins-2610]` |

> ✅ consolidado 2026-07-07 → banco-selectbanco (7 bancos), Nro.Plantilla-por-label, cobros-depositables, envío-2-alerts, defecto-render-recuperable, borrado-con-confirmación con tag en `module-selectors/depositos.md`; `depositos.aplica=true` + bancos + moneda en `ferrenuestro.yaml modules.depositos` + nota_sync_diferida.

## Hallazgos (no-FAIL, notables)
1. **No-persistencia de salida en esta corrida (aguas-arriba, NO defecto del módulo Depósitos).** El depósito enviado quedó "Por Enviar" (Ref 0) y no llegó a la nube; la captura muestra la cola de `returnservice/return` reintentando en background (18 hits) sin drenar. Mismo síntoma que devoluciones/inventarios de esta corrida. El módulo Depósitos se comportó correctamente (UI aceptó Enviar, alerts OK, estado consistente). Marca **BD-SAVED**.
2. **Defecto de render `deposit.service.ts` reprodujo de forma intermitente** (1 transición congelada tras guardar el 2º depósito) pero **recuperable con back** — no bloqueó ningún caso. Confirma la naturaleza de race del bug (`[jerez-2026-07-06]`: cuelga o no según el intento).
3. **`aplica=true` queda CONFIRMADO con dato vivo** para el YAML: 7 bancos + 13 cobros Efectivo depositables. Actualizar `modules.depositos.banco` con las cuentas reales (antes TBD).

## ⚠ Corrección post-corrida — SÍ persistió (sync diferida)

El diff final de baseline (cierre de corrida) confirma que el registro marcado "Por Enviar"/BD-SAVED **SÍ llegó a la nube**: `deposit` id=1 (verificado como nuestro, id_client 504 TORNICAGUA / co_* coincidente con el payload). La marca BD-SAVED durante la corrida se debió a que la **sync es asíncrona/diferida** y la fila apareció DESPUÉS de la ventana de poll (~10s–3min). No es no-persistencia de endpoint. Ver `consolidado.md` §"Verificación BD".
