# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android · Playwright MCP + CDP · Cliente: FERRENUESTRO

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-07-23 (cierre 2026-07-24) |
| **RUN_ID** | `20260723_172350_smoke-completo` |
| **Cliente** | ferrenuestro — empresa "FERRENUESTRO MAYOR," (idEnterprise 1) |
| **Playa / Servidor** | ⚠ **La Tortuga v6.6.18** (`denariolatortuga.ddns.net:8081`) — **MIGRÓ desde Isla Coche** (el YAML decía Isla Coche) |
| **Dispositivo** | `14678405BR003855` (Infinix X6728) · Chrome/150 WebView · **window.ng=TRUE** |
| **Credenciales** | `***`/`***` (usuario **leidy**, vendedor) |
| **Resultado global** | **125 PASS · 0 FAIL · 1 SKIP · 11 N/A · 0 BLOCKED** de 137 casos |

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP | N/A | BLK | Estado |
|--------|-------|------|------|------|-----|-----|--------|
| Login | 6 | 6 | 0 | 0 | 0 | 0 | ✅ |
| Clientes | 12 | 12 | 0 | 0 | 0 | 0 | ✅ |
| Pedidos | 14 | 14 | 0 | 0 | 0 | 0 | ✅ |
| Cobros | 34 | 27 | 0 | 1 | 6 | 0 | ✅ |
| Devoluciones | 14 | 13 | 0 | 0 | 1 | 0 | ✅ |
| Inventarios | 16 | 16 | 0 | 0 | 0 | 0 | ✅ |
| Depósitos | 12 | 12 | 0 | 0 | 0 | 0 | ✅ |
| Visitas | 16 | 14 | 0 | 0 | 2 | 0 | ✅ |
| Productos | 10 | 8 | 0 | 0 | 2 | 0 | ✅ |
| Vendedores | 3 | 3 | 0 | 0 | 0 | 0 | ✅ |
| **TOTAL** | **137** | **125** | **0** | **1** | **11** | **0** | ✅ |

## FAIL críticos
**Ninguno. 0 defectos de aplicación.**

## SKIP / N/A (estructurales por VG o condición de dato)

| Módulo | Casos | Motivo |
|--------|-------|--------|
| Cobros | ⏭ DM-COB-019 (SKIP) | requiredCollectionAttachments=true + mock cámara no conducible → envío SKIP (queda Guardado, adjunto manual QA) |
| Cobros | 🚫 006, 036, 037, 044, 045, 047 | requiredComment=false · userCanSelectIGTF=false · userCanCollectIva=false · canChangeRate=false |
| Devoluciones | 🚫 DM-DEV-011 | validateReturn=false → sin modal de factura en cabecera (nro factura es campo libre) |
| Visitas | 🚫 DM-VIS-025/026 | RUTA DE HOY sin visitas "No Visitado" sincronizadas hoy |
| Productos | 🚫 DM-PRD-002 | 1 solo tipo de estructura (LINEA) |
| Productos | 🚫 DM-PRD-013 | ⚠ solo 1 lista de precio cargada esta sesión (regresión de dato — en julio había 2 → PASS). Verificar config |

## Registros creados en el sistema (POST capturado por payload · BD-N/A por cotejo caído)

| Módulo | Ref / Nro | Detalle | Estado |
|--------|-----------|---------|--------|
| Clientes | id_client=93 | Potencial `Test-CLT-SMOKE-173928` (empresa FERRENUESTRO MAYOR) | Enviado |
| Pedidos | id_order=29358 | TORNICAGUA · TALADRO INALAMBRICO 20V ×2 · $200,45 | Enviado |
| Cobros | — | **5 cobros GUARDADO** (normal/retención-doc/anticipo/retención-menú/parcial) · 0 enviados | Guardado (adjunto manual) |
| Devoluciones | id_return=215 | TORNICAGUA · ALDABA PORTACANDADO ×2 · Calidad | Enviada |
| Inventarios | id_client_stock=101 | TORNICAGUA · TALADRO ×5 · lote QA0723 | Enviado |
| Depósitos | id_deposit=1 | MERCANTIL JU · Bs 61.166 · cobro vinculado 707 | Enviado |
| Visitas | id_visit=2 | TORNICAGUA · MERCHANDISING/ENTREGA DE MUESTRAS | Enviada |

## Verificación BD

⚠ **Cotejo BD NO disponible esta corrida:** la BD nube dio **`permission denied` en TODAS las tablas** (el DSN de `secrets/qa-db.env` apunta a la BD vieja de **Isla Coche**; ferrenuestro migró a La Tortuga). Sustituto: **captura de payload** — TODOS los POST transaccionales (`potentialclient/order/return/clientstock/deposit/visit`) se capturaron y cuadraron 1:1 con la UI (marca **PAYLOAD-OK / BD-N/A**). Blindaje §10 respetado: la BD nunca tumbó el smoke.

## Observaciones / hallazgos clave

1. ⚠ **MIGRACIÓN DE SERVIDOR:** ferrenuestro pasó de **Isla Coche → La Tortuga v6.6.18**. Consecuencias en cadena, todas confirmadas: **window.ng=TRUE** (era false en julio), **sync a nube INMEDIATA** (era diferida ~3min), **3 alertas** al enviar depósito (eran 2), botón de alert **"OK"**. 📋 **Actualizar `ferrenuestro.yaml` (ws_url) + el bloque BD de `qa-db.env`** a La Tortuga.
2. 🎉 **`window.ng=TRUE` destrabó 2 gaps de julio:** **DM-PED-026** (trash Tab Total, BLOCKED en julio) → **PASS**; **retención por documento DM-COB-041/042** + **DM-COB-029** → **PASS** (el neto persiste al reabrir, sin el FAIL conocido). Cierra los gaps de cobertura que quedaron abiertos con `window.ng=false`.
3. ⚠ **`openNuevoCobro` programático NO renderiza el form** en este build (a diferencia de dm-electronica) → hay que **click real en el tile COBRO/ANTICIPO/RETENCIÓN**. `openDocumentDetail` sí funciona.
4. **Cobros con adjunto obligatorio:** requiredCollectionAttachments=true + mock cámara no conducible → los 5 cobros quedaron **Guardados** pendientes de adjunto manual (nada salió sin adjunto — correcto).
5. Divergencias UI↔config conocidas (no FAIL): Inventarios operable pese a clientStock=false; botón "PEDIDO SUGERIDO" con VG false; DM-INV-026 (reapertura en tab General).

## ⏱ LÍNEA BASE (instrumentación del harness)

| Módulo | Modelo | Casos | Resultado | tool-uses | ms | min |
|--------|--------|-------|-----------|-----------|-----|-----|
| Login | sonnet | 6 | 6P | 35 | 610.608 | 10,2 |
| Clientes | opus | 12 | 12P | 48 | 612.398 | 10,2 |
| Pedidos | opus | 14 | 14P | 72 | 1.140.035 | 19,0 |
| **Cobros** | opus | 34 | 27P/1SKIP/6NA | 87 | **9.708.510** | **161,8 ⚠** |
| Devoluciones | opus | 14 | 13P/1NA | 66 | 1.675.016 | 27,9 |
| Inventarios | opus | 16 | 16P | 59 | 2.522.453 | 42,0 |
| Depósitos | opus | 12 | 12P | 51 | 2.298.662 | 38,3 |
| Visitas | opus | 16 | 14P/2NA | 57 | 1.853.465 | 30,9 |
| **Productos** | sonnet | 10 | 8P/2NA | 55 | **35.562.088** | **592,7 ⚠** |
| Vendedores | sonnet | 3 | 3P | 23 | 406.062 | 6,8 |
| **TOTAL** | — | **137** | **125P/1SKIP/11NA** | **553** | **56.389.297** | **~940 min (15,7 h)** |

### ⚠ Hallazgo crítico de tiempo (para la propuesta de optimización)
- **Tiempo ACTIVO de conducción ≈ 3 h** (los 8 módulos "sanos" suman ~185 min, en línea con latino 3,24 h).
- **Pero el wall-clock total fue ~15,7 h** por **DOS cuelgues de CDP** que estancaron a los agentes horas: **Cobros (~2,7 h)** y **Productos (~9,9 h)** — módulos que activamente tardan ~9-30 min.
- **~12,5 h de las 15,7 fueron IDLE puro** esperando que el WebView/CDP se recuperara de un cuelgue.
- **Refuerza la propuesta:** el flujo agéntico tiene **wall-clock impredecible y a veces extremo** por la fragilidad del bridge CDP. Un runner con **fail-fast/watchdog de CDP** (matar y re-mapear al detectar cuelgue en vez de esperar horas) + el **replay determinista** eliminarían este riesgo. tokens UI totales ≈ **1,53 M**.

## Reportes individuales
- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md) · [Cobros](cobros.md) · [Devoluciones](devoluciones.md)
- [Inventarios](inventarios.md) · [Depósitos](depositos.md) · [Visitas](visitas.md) · [Productos](productos.md) · [Vendedores](vendedores.md)

## Memoria: patrones promovidos (Agente 11)

29 patrones inventariados · ~26 promovidos a `module-selectors/*` (tag `[ferrenuestro-20260723]`) · 13 bloques inline al `ferrenuestro.yaml` · **PROPUESTA #11 registrada** (watchdog/fail-fast CDP) · 0 graduados a RUNTIME.

| Patrón clave | Módulo | Destino |
|--------------|--------|---------|
| ferrenuestro migró **Isla Coche → La Tortuga v6.6.18** (window.ng/sync siguen al BUILD, no al slug) | transversal | `_comunes.md` + YAML |
| **DM-PED-026** (trash) + **retención 041/042/029** resueltos con `window.ng=TRUE` | pedidos/cobros | selectors + YAML |
| `openNuevoCobro` programático NO renderiza → click real en tile | cobros | `cobros.md` |
| documento_retencion 00037108 drenado → 00037192 | cobros | YAML |
| **Wall-clock ~15,7 h por 2 cuelgues de CDP** → watchdog/fail-fast | transversal | `PROPUESTAS-CAMBIOS.md #11` |
| BD DSN apunta a Isla Coche viejo → cotejo caído (team: actualizar a La Tortuga) | transversal | YAML nota |

Archivos: `ferrenuestro.yaml` + 11 `module-selectors/*.md` + 10 reportes sellados `> ✅ consolidado 20260723` + `PROPUESTAS-CAMBIOS.md`. `defectos_abiertos=[]` (0 FAIL).
*(Revisar el `git diff` antes de commitear. **Team:** actualizar DSN `qa-db.env` a La Tortuga + re-aplicar GRANT read-only + confirmar si la migración es permanente.)*

---
*Generado por Claude Code · Orquestador Smoke · ferrenuestro · 2026-07-24*
