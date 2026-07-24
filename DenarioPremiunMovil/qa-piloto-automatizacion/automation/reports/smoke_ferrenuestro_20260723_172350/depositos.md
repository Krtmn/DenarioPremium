# Smoke Test — Módulo DEPÓSITOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260723_172350_smoke-completo` |
| Módulo | DEPÓSITOS |
| Cliente | ferrenuestro |
| Servidor | La Tortuga v6.6.18 (`denariolatortuga.ddns.net:8081`) — `window.ng=TRUE` · sync INMEDIATA |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 |
| Usuario | `leidy` / `******` |
| aplica | **TRUE** — 7 cobros Efectivo depositables (históricos enviados) |
| Cotejo BD | CAÍDO → **BD-N/A (payload)**; POST `depositservice/deposit` capturado por hook |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Estado | HOME → HOME ✅ |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | `app-depositos` con botones DEPÓSITO y BUSCAR |
| DM-DEP-002 | ✅ PASS | Form `app-deposito`: tabs General(activo)/Cobros/Total/Adjuntos(disabled); Guardar/Enviar disabled sin datos; inputs Nro. Plantilla + Comentario; Fecha Doc idx1=hoy editable, Fecha Depósito idx0 disabled |
| DM-DEP-004 | ✅ PASS | `ion-select.selectbanco` 7 bancos (403-409); MERCANTIL JU (406) seleccionado → cuenta autollenada `0105...8029810`; tabs Cobros/Total/Adjuntos se habilitan |
| DM-DEP-005 | ✅ PASS | Fecha Doc → modal `fechasModal` → `dt.value` ISO + `confirmDatetime` OK → 23/7/2026, modal cerrado |
| DM-DEP-006 | ✅ PASS | Nro. Plantilla `DEP-QA-0723` + cobro marcado (Monto total 61166) → Guardar/Enviar habilitados. Sin campo Monto libre: deriva del cobro |
| DM-DEP-009 | ✅ PASS | Click Guardar → alert "Denario Depósito — El Depósito se ha guardado" |
| DM-DEP-010 | ✅ PASS | BUSCAR → lista renderiza el depósito: `Nro Ref:0 · Banco:014 · Estatus:Guardado · Monto Bs.:61166.00` |
| DM-DEP-014 | ✅ PASS | Click en Guardado → form con datos previos (Banco MERCANTIL, cuenta, Nro. Plantilla DEP-QA-0723, Fecha Doc 23/7/2026) — round-trip §9 OK 1:1 |
| DM-DEP-017 | ✅ PASS | Enviar → **3 alertas** (1) "El Depósito será enviado" Cancelar/Aceptar → (2) "Denario Premium — El Depósito será enviado" OK → (3) "Depósito nro. 1 enviado exitosamente" OK. Ref 0→1. POST `depositservice/deposit` capturado |
| DM-DEP-018 | ✅ PASS | Lista renderiza tras guardar/enviar (2 ítems: Ref 1 Enviado + Guardado). Defecto render `deposit.service.ts` NO bloqueó (ver nota) |
| DM-DEP-019 | ✅ PASS | Click depósito Enviado (Ref 1) → form solo-lectura: **sin botones Guardar/Enviar y sin trash** `ion-button[color=danger]` |
| DM-DEP-020 | ✅ PASS | Trash en Guardado → alert "¿Desea eliminar el depósito seleccionado?" Cancelar/Aceptar → Aceptar → ítem desaparece (queda solo Ref 1 Enviado) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Depósito Ref **1** | Banco MERCANTIL JU (coBank 014, cuenta 0105...8029810) · Fecha Doc 23/7/2026 · Nro. Plantilla `DEP-QA-0723` · Monto Bs. 61166 · cobro vinculado `collectionIds:[707]` (CORPORACION TRADE DOER) | **Enviado** — POST capturado |
| Depósito Ref 0 (Banco 009, DEP-QA-0723B, Bs. 42594.78, cobro REFRIVEN LS) | creado Guardado para DM-DEP-020 | **Eliminado** (DM-DEP-020) |

## Verificación BD (payload — cotejo BD caído)
Cotejo Postgres/SQLite **N/A** (BD caída, RUNTIME §10 blindaje). Se usa **captura de payload** por hook `nativePromise`:
- POST **`depositservice/deposit`** CAPTURADO en el Enviar del Ref 1. Payload volcado a `_payloads.jsonl`.
- Campos confirmados en payload: `coBank:"014"`, `nuAccount:"0105...8029810"`, `nuDocument:"DEP-QA-0723"`, `daDocument:"2026-07-23"`, `nuAmountDoc:61166`, `coCurrency:"Bs."`, `idEnterprise:1`, `stDeposit:2`, `stDelivery:2`, `idUser:315`.
- **Vínculo cobro→depósito viaja por `collectionIds:[707]`**; `depositCollect:[]` vacío → confirma mecanismo `[ins-2622]` (la tabla N:M `deposit_collection_payment` no se puebla; cotejar por payload = **BD-INFO**, no MISMATCH).
- Marca: **BD-N/A (payload)** — la parte UI corrió completa y el POST llegó al servidor (Ref real 1 asignado).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| ferrenuestro en La Tortuga: envío = **3 alertas** | cliente | En este RUN (servidor La Tortuga v6.6.18) el envío de depósito dio **3 alertas** (como jerez/latino_cosmetica La Tortuga), a diferencia del run 2026-07-07 `[ferrenuestro-2026-07-07]` sobre Isla Coche que dio **2**. ferrenuestro migró de servidor → nº de alertas depende del servidor, no del cliente |
| ferrenuestro La Tortuga: `depositos.aplica=TRUE` con 7 cobros depositables | cliente | 7 checkboxes en Tab Cobros (cobros Efectivo ENVIADOS históricos de nube). Tras enviar el depósito que consume `collectionIds:[707]`, la lista bajó a 6 (exclusión del cobro depositado confirmada) |
| Defecto render `deposit.service.ts` intermitente y recuperable | universal | Tras Guardar quedó `app-deposito`+`app-deposito-general` montados con 0 botones etiquetados (transición congelada); `clickBack` (`img.fechaAtras`) recupera y el siguiente BUSCAR renderiza la lista completa. NO re-marcar FAIL (RUNTIME §5). Reproducido en cada Guardar de este RUN, siempre recuperado |
| Abrir ítem de lista: `getActiveView` reporta `app-deposito-list` aunque el form abrió | universal | Tras clicar un ítem, `app-deposito` y `app-deposito-list` quedan ambos montados; verificar por `offsetParent` de `app-deposito` (visible=true, list=false), no por `getActiveView` que devuelve el primer match |
| Enviado = solo-lectura por ausencia de botones | universal | El form del depósito Enviado NO muestra `ion-button.imagenGuardar`/`imagenEnviar` ni trash `ion-button[color=danger]`; los datos se muestran pero no hay vía de persistir (`ion-input.readonly=false` es quirk Ionic, no habilita edición efectiva) |

> ✅ consolidado 20260723

## Hallazgos (FAIL)
Ninguno. 12/12 PASS.

## Baseline (instrumentación)
| Métrica | Valor |
|---------|-------|
| Tool-uses (browser_run_code_unsafe) | ~18 |
| Duración módulo (aprox) | ~7.5 min |
| Intentos > 1 | DM-DEP-014 (2 — 1er click abrió, 2º sondeo confirmó estado) |
