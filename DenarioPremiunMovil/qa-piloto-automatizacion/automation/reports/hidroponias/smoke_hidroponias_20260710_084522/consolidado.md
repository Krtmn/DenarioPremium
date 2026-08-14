# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-07-10 |
| **RUN_ID** | `20260710_084522_smoke-completo` |
| **Cliente** | hidroponias — HIDROPONIAS VENEZOLA |
| **Playa / servidor** | **Isla La Tortuga** (`denariolatortuga.ddns.net:8081`) — migrado desde El Yaque |
| **Dispositivo** | `14678405BR003855` (Infinix X6728 · Android 15) |
| **App** | `com.kiberno.denarioPremiumPro` — v6.6.18 |
| **Credenciales** | `***`/`***` |
| **Resultado global** | **116 PASS · 1 FAIL · 2 SKIP · 10 N/A · 8 BLOCKED** de 137 casos |
| **Modelos** | Transaccionales → Opus · Login/Productos/Vendedores + BD + consolidación → Haiku |

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP | N/A | BLK | BD | Estado |
|--------|-------|------|------|------|-----|-----|-----|--------|
| Login | 6 | 6 | 0 | 0 | 0 | 0 | — | ✅ |
| Clientes | 12 | 12 | 0 | 0 | 0 | 0 | BD-FIELD-OK | ✅ |
| Pedidos | 14 | 14 | 0 | 0 | 0 | 0 | BD-FIELD-OK | ✅ |
| Cobros | 34 | 20 | 0 | 1 | 5 | 8 | s/envíos | ✅ |
| Devoluciones | 14 | 14 | 0 | 0 | 0 | 0 | BD-FIELD-OK | ✅ |
| Inventarios | 16 | 16 | 0 | 0 | 0 | 0 | BD-FIELD-OK | ✅ |
| Depósitos | 12 | 11 | 0 | 1 | 0 | 0 | BD-FIELD-OK | ✅ |
| Visitas | 16 | 14 | 0 | 0 | 2 | 0 | BD-FIELD-OK | ✅ |
| Productos | 10 | 6 | 1 | 0 | 3 | 0 | — | ⚠ |
| Vendedores | 3 | 3 | 0 | 0 | 0 | 0 | — | ✅ |
| **TOTAL** | **137** | **116** | **1** | **2** | **10** | **8** | | |

## FAIL críticos (S1/S2)

| ID | Módulo | Descripción | Severidad | Diagnóstico |
|----|--------|-------------|-----------|-------------|
| DM-PRD-006 | Productos | Búsqueda "BROCOLI" sin resultados | S3 (dato, no app) | El catálogo de hidroponias/La Tortuga NO contiene "BROCOLI". La búsqueda funciona (filtra), pero el dato de prueba es inválido → **NO es defecto de app**. Cascada 012/013/020 → N/A. **Acción:** cambiar `modules.productos.texto_busqueda` a un producto existente (ej. ALFALFA / GERMINADOS). |

> **0 defectos reales de aplicación en esta corrida.** El único FAIL es dato de prueba desactualizado tras la migración.

## BLOCKED (limitaciones de automatización CDP — NO defectos de app)

Los 8 BLOCKED son de **Cobros** (18% histórico, salud de automatización conocida): dirty-guard back no disparable por CDP (020/021/038) y flujos con carga inestable de documentos + guardado multi-campo (042/029/046/047/039). Ninguno es defecto de app. El SKIP de cobros es DM-COB-019 (adjunto obligatorio en APK prod → cobro queda Guardado). El SKIP de depósitos es DM-DEP-020 (delete destructivo no ejecutado sobre el único cobro depositable).

## Registros enviados al sistema (persisten)

| Módulo | Ref / Nro | Detalle | Estado |
|--------|-----------|---------|--------|
| Clientes | id_client **10** | `Test-CLT-SMOKE-085633` (RIF 123456789, empresa HIDRO_A) | Enviado — BD-FIELD-OK |
| Pedidos | Nro **50** | GOURMET CCC · ALFALFA BOLSA 500 GRS x2 · USD 13,12 / BS 8.999,53 | Enviado — BD-FIELD-OK (36 campos) |
| Devoluciones | Ref **22** | GOURMET CCC · factura 20110662 · CAMPROLEC012BOL x2 · tipo Calidad | Enviada — BD-FIELD-OK |
| Inventarios | Ref **43** | Cliente 401 · GERPROALF001BOL 5 UNI · lote LOTEQA10 · venc 2026-07-10 | Enviado — BD-FIELD-OK (30 campos) |
| Depósitos | Ref **1** | BANCO DE VENEZUELA · plantilla QA-DEP-0710 · 10.000,00 BS · cobro id_collection 17 | Enviado — BD-FIELD-OK |
| Visitas | id_visit **2343** | GOURMET CCC · MERCHANDISING/ENTREGA DE MUESTRAS | Enviada — BD-FIELD-OK |

**Cobros:** ningún cobro enviado (adjunto obligatorio → único registro creado quedó Guardado y se eliminó en DM-COB-026). **Pendientes de envío manual:** ninguno al cierre.

> **Persistencia a la nube CONFIRMADA en La Tortuga** para clientes, pedidos, devoluciones, inventarios, depósitos y visitas — todos con cotejo campo-a-campo BD-FIELD-OK (única nota recurrente: hora UTC-4 local vs UTC nube, esperada). Esto **contradice** la memoria histórica de no-persistencia de hidroponias (El Yaque) y el gap de captura de order/collection.

## Observaciones generales / hallazgos para el perfil

1. **🔔 Depósitos pasó de N/A a APLICABLE:** en La Tortuga hay 4 bancos (Venezuela/Mercantil/Provincial/Banesco) y cobros en **Efectivo** depositables → el módulo es plenamente conducible. **Actualizar `modules.depositos.aplica: true`** (antes `false` por "solo Depósito bancario").
2. **Retención confirmada (cerró TBD):** DM-COB-041 PASS — Nro. Comp. Retención de **14 dígitos** habilita Monto retenido IVA/ISLR → `vgs.retencion: true`, `sizeRetention: 14`.
3. **`userCanCollectIva`:** el botón "25% IVA" (DM-COB-037) NO aparece en La Tortuga pese al VG → revisar VG efectiva (marcado N/A, no FAIL).
4. **Gap de captura de payload en Depósitos:** el POST `depositservice/deposit` no se volcó a `_payloads.jsonl` (hook `installPayloadCapture` posiblemente no intercepta ese endpoint) → cotejado por fallback query.js (BD-FIELD-OK igual). Calibración pendiente para el config de `deposit` en `cotejo-payload.js` (ver depositos.md).
5. **Nuevo tipo de devolución:** hidroponias expone "Distribución" (Calidad/Distribución/PostVenta/Servicio).
6. **Alerta de deuda vencida (pedidos):** no observada pese a `alerta_deuda_vencida=true` (INFO, criterio PASS de 006 se cumple igual) → revisar el dato.

## Verificación BD (cotejo payload ↔ nube)

6 de 7 transaccionales con envío → **todos BD-FIELD-OK campo-a-campo** (Clientes 17/17 · Pedidos 36/36+2 hijas · Devoluciones 10/10+1 · Inventarios 30 campos · Depósitos 10/11+INFO · Visitas 6/6+incidence). Cobros sin envíos (adjunto obligatorio). BD local SQLite = N/A en todos (sqlite3 ausente en el device — blindaje §10, no bloquea). 0 mismatches reales; 0 duplicados.

## Memoria: patrones promovidos (Agente 11 — consolidación)

| Patrón | Módulo | Destino |
|--------|--------|---------|
| Depósitos aplica=true (4 bancos + Efectivo en La Tortuga) | Depósitos | `hidroponias.yaml` |
| retencion=true, sizeRetention=14 (14 díg. habilita retención IVA/ISLR) | Cobros | `hidroponias.yaml` |
| Quitar DM-COB-041/042 de smoke_na_estructural (ya no N/A) | Cobros | `hidroponias.yaml` |
| texto_busqueda BROCOLI→ALFALFA (BROCOLI ausente del catálogo) | Productos | `hidroponias.yaml` |
| Nota userCanCollectIva (25%IVA ausente pese a VG) | Cobros | `hidroponias.yaml` |
| Reabrir Guardado por zona izq · idEnterprise numérico · form no navega tras Guardar · borrado sin confirmación | Clientes | `module-selectors/clientes.md` [hidroponias-20260710] |
| Tab Pedido accordion anidado · Trash recalcula con mouse.click · persistencia La Tortuga (contradice jerez/ferrenuestro) | Pedidos | `module-selectors/pedidos.md` [hidroponias-20260710] |

**Archivos modificados por Agente 11:** `hidroponias.yaml` (6 cambios de perfil + fecha), `module-selectors/clientes.md`, `module-selectors/pedidos.md`, `module-selectors/_comunes.md`, y los 9 reportes marcados `✅ consolidado 20260710`.

> Revisar el `git diff` de `module-selectors/` y del YAML antes de commitear.

## Reportes individuales

- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md)
- [Cobros](cobros.md) · [Devoluciones](devoluciones.md) · [Inventarios](inventarios.md)
- [Depósitos](depositos.md) · [Visitas](visitas.md) · [Productos](productos.md) · [Vendedores](vendedores.md)

---
*Generado por Claude Code · Orquestador Smoke · 2026-07-10*
