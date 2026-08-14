# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260714_130727_smoke-completo` |
| Módulo | DEPÓSITOS |
| Dispositivo | 14678405BR003855 (Infinix HOT 60i / X6728) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 (dbVersion 16) |
| Servidor | La Tortuga (`denariolatortuga.ddns.net:8081/PremiumWS`) · `window.ng=TRUE` · sync inmediata |
| Cliente/Playa | latino_cosmetica · usuario 001 (LATINOCOSMETICA C.A., emp 00001) |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| ¿Aplica? | **SÍ, con cobros depositables vivos** (Efectivo=true; Tab Cobros con 3 cobros Efectivo enviados) |
| Baseline (Ola 0) | ~25 tool-uses CDP · módulo medio (form + Guardar→Enviar end-to-end + 2º depósito para borrado) |

## Condición de dato — depositables presentes (a diferencia de dm-electronica)
El Tab Cobros mostró **3 cobros Efectivo depositables ya propagados nube→device**:
- **CABELLO COSMETICOS CA · Ref 24 · BSD 1.034.714,62** (el cobro Efectivo enviado en la corrida de COBROS de este mismo RUN — **SÍ propagó de vuelta** dentro de la ventana; contrasta con dm-electronica donde el cobro recién enviado NO propagó).
- COSMETICOS BELLA JK CA · Ref 25 · BSD 51.500,00
- DISTRIBUIDORA ULTIMATE CA · Ref 12 · BSD 20,60

→ `depositos.aplica=true` confirmado con dato vivo. El depósito completo se ejecutó y se **Envió** (BD-OK).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Home Depósitos con botones **DEPÓSITO** y **BUSCAR** |
| DM-DEP-002 | ✅ PASS | Form: Empresa (LATINOCOSMETICA 00001), Moneda (BSD), Banco (vacío), Nro.Plantilla, Comentario, Fecha Doc (14/7/2026 editable) + Fecha Depósito (disabled, calculada). Tabs Cobros/Total/Adjuntos disabled. **Guardar/Enviar disabled sin datos** |
| DM-DEP-004 | ✅ PASS | `ion-select.selectbanco` con **8 cuentas reales** (idBankAccount 89-97, todas BSD/emp 00001). Seleccionado BANCO MERCANTIL (id 96) → cuenta autollenada `01050035481035466120` |
| DM-DEP-005 | ✅ PASS | Fecha Doc (`letrasFechasButton` idx1) → datetime → 14/7/2026 confirmada |
| DM-DEP-006 | ✅ PASS | Nro.Plantilla=`QA-DEP-714`; tabs Cobros/Total/Adjuntos se habilitan tras Banco+Fecha. Guardar habilita tras marcar cobro (monto derivado, sin campo Monto libre) |
| DM-DEP-009 | ✅ PASS | Marcar cobro CABELLO Ref 24 → "Monto total depositado 1.034.714,62 BSD" → Guardar habilitado → click → alert **"Denario Depósito — El Depósito se ha guardado"** |
| DM-DEP-010 | ✅ PASS | BUSCAR → lista renderiza; depósito **Nro Ref: 0 · Banco 004 · Guardado · BSD 1034714.62**. **Defecto DM-DEP-010/018 NO reprodujo** (lista limpia) |
| DM-DEP-014 | ✅ PASS | Reabrir Guardado → datos persisten: Banco MERCANTIL, cuenta 0105…5466120, Nro.Plantilla QA-DEP-714, Fecha Doc 14/7/2026, cobro Ref 24 vinculado (round-trip §9 OK). (2 intentos: 1er click navegó con leve latencia) |
| DM-DEP-017 | ✅ PASS | Enviar → **3 alertas**: (1) "El Depósito será enviado" Cancelar/Aceptar → (2) "Denario Premium — El Depósito será enviado" OK → (3) **"Depósito nro. 3 enviado exitosamente"** OK. Ref 0 → **Ref 3**. Payload `depositservice/deposit` capturado. **BD-OK** |
| DM-DEP-018 | ✅ PASS | BUSCAR tras enviar → lista muestra **Nro Ref: 3 · Enviado · BSD 1034714.62**. Sin defecto de render |
| DM-DEP-019 | ✅ PASS | Reabrir Enviado Ref 3 → **solo lectura** (select + todos los ion-input `disabled=true`), sin botones Guardar/Enviar, **sin basura** en ningún ítem Enviado. Datos persisten |
| DM-DEP-020 | ✅ PASS | 2º depósito (BELLA Ref 25, BSD 51.500) Guardado → basura `ion-button[color="danger"]` solo en ítem Guardado → alert **"¿Desea eliminar el depósito seleccionado?"** Cancelar/Aceptar → confirmar → **desaparece** (lista 4→3, sin Guardado) |

## Registros creados en sistema
| Ref | Detalle | Estado | BD |
|-----|---------|--------|-----|
| **3** | Depósito · BANCO MERCANTIL (coBank 004, cuenta 0105…5466120) · Nro.Plantilla QA-DEP-714 · **cobro Ref 24 (CABELLO, BSD 1.034.714,62)** · tasa 667,05 · $1.551,18 | **Enviado** | **BD-OK** (nube id_deposit=3, st_deposit=1, co_deposit coincide con payload) |
| — | Depósito · BANCAMIGA (031) · Nro.Plantilla QA-DEP-DEL · cobro Ref 25 (BELLA, BSD 51.500) | Creado→**Eliminado** en DM-DEP-020 | — (nunca enviado; correctamente ausente de nube) |

## Verificación BD (round-trip al servidor · RUNTIME §10)
- **Depósito Ref 3 (DM-DEP-017): BD-OK.** Nube `deposit` id_deposit=3, `co_deposit`=`1784058163379.0` (**coincide exacto con el `coDeposit` del payload capturado**), `st_deposit`=1 (Enviado — los 3 enviados históricos también son st_deposit=1 en este server; el mapeo 5/9 del smoke NO aplica aquí, todos los Enviado=1), `nu_amount_doc`=1034714.6200 (= monto UI), `da_deposit`=2026-07-14 19:42:43Z (local 15:42:43). Guardado→enviado confirmado.
- **Vínculo cobro→depósito: BD-INFO.** Viaja por `collectionIds:[24]` en el payload `depositservice/deposit`; `depositCollect:[]` vacío y `deposit_collection_payment` con `pagos=0` (tabla N:M NO se puebla — confirma la nota `[ins-2622]` de insumar en La Tortuga). Cotejo del vínculo por payload, no por esa tabla.
- **Payload capturado** (`_payloads.jsonl`): POST `depositservice/deposit` con `coDeposit 1784058163379.0`, `coBank 004`, `nuAccount 01050035481035466120`, `nuDocument QA-DEP-714`, `nuAmountDoc 1034714.62`, `nuAmountDocConversion 1551.18`, `nuValueLocal 667.05`, `coCurrency BSD`, `idEnterprise 1`, `stDeposit 2/stDelivery 2`, `coordenada 11.049,-63.865`, **`collectionIds:[24]`**.
- **BD local: N/A** (device sin `sqlite3` para `run-as`, igual que COBROS de este RUN).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| latino_cosmetica: `depositos.aplica=true` con **cobro de la misma corrida propagado de vuelta** | cliente (La Tortuga, sync inmediata/persistente) | El cobro Efectivo Ref 24 enviado en COBROS de este RUN **SÍ apareció como depositable** en el Tab Cobros del mismo run. Contrasta con dm-electronica (El Yaque) donde el cobro recién enviado NO propagó dentro de la ventana. Confirma que en La Tortuga la re-sincronización nube→device de depositables es lo bastante rápida para el flujo end-to-end en una sola corrida. |
| Tab Cobros: checkbox por posición Y (no anida texto de fila) | universal | Los `app-deposito-cobros ion-checkbox` no tienen la fila como ancestro con texto aislado (el ancestro abarca toda la tabla). Fiable: mapear por **orden vertical** (`getBoundingClientRect().y` ascendente) = orden de filas de datos; click real `pg.mouse.click(x,y)` sobre el checkbox. En este build: x≈34,7; filas a y≈235/284/333. |
| Envío = **3 alertas** en La Tortuga | cliente | (1) "Denario Depósito — El Depósito será enviado" Cancelar/Aceptar → (2) "Denario Premium — El Depósito será enviado" OK → (3) "Depósito nro. N enviado exitosamente" OK. Igual que jerez (3), difiere de insumar/ferrenuestro (2). Ref 0 → Ref real servidor. |
| Borrado depósito Guardado: alert "¿Desea eliminar el depósito seleccionado?" | universal | Trash `ion-button[color="danger"]` **solo** en ítem Guardado (ausente en Enviado). Con confirmación Cancelar/Aceptar → ítem desaparece. Confirma insumar/ferrenuestro. |
| Enviado = form 100% `disabled` sin Guardar/Enviar | universal | Reabrir un depósito Enviado deja `ion-select`+todos los `ion-input` con `disabled=true` y sin botones imagenGuardar/imagenEnviar en el header. Solo lectura. |
| `st_deposit=1` = Enviado en La Tortuga | cliente | Todos los depósitos Enviado (id 1/2/3) tienen `st_deposit=1` en nube; el mapeo genérico del smoke (Guardado=5 / Enviado=9) NO aplica a este server. Corroborar por `id_deposit` + presencia en nube, no por `st_deposit` global. |

> ✅ consolidado 20260714

## Hallazgos (FAIL)
Ninguno (0 FAIL). El defecto conocido DM-DEP-010/018/019/020 (`deposit.service.ts`, lista BUSCAR no renderiza) **NO reprodujo** esta corrida — la lista renderizó limpia en las 3 llamadas a BUSCAR (coherente con su naturaleza intermitente/race documentada).

## Estado final: HOME ✅

## Verificación BD (payload ↔ nube · campo-a-campo · Agente BD)

| co_x | Marca | Cabecera | Hijas | Mismatches | Notas |
|------|-------|----------|-------|------------|-------|
| 1784058163379.0 | BD-FIELD-OK | 13/13 OK | — (deposit sin hijas) | 0 | zona horaria en da_deposit/da_document (esperado). Config depósitos de cotejo-payload.js VALIDADA (banco denormalizado co_bank+nu_account + conversión divisa nu_amount_doc_conversion) |

**Depósito Ref 3 (BANCO MERCANTIL 004, BSD 1.034.714,62): enviado→íntegro en nube.** 13/13 campos cabecera coinciden. Cero mismatches reales. `collectionIds=[24]` viaja como meta (vínculo cobro = BD-INFO).
