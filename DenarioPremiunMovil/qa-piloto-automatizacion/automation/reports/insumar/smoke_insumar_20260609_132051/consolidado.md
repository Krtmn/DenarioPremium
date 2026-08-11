# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-06-09 |
| **RUN_ID** | `20260609_132051_smoke-completo` |
| **Cliente / Playa** | insumar — INSUMAR DISTRIBUIDOR (Isla Coche) |
| **Dispositivo** | 14678405BR003855 (Infinix X6728, Android 15) |
| **App** | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| **Credenciales** | `***`/`***` |
| **Resultado global** | **115 PASS · 1 FAIL · 3 SKIP · 15 N/A** de 134 casos |

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP | N/A | Estado |
|--------|-------|------|------|------|-----|--------|
| Login | 6 | 6 | 0 | 0 | 0 | ✅ |
| Clientes | 12 | 12 | 0 | 0 | 0 | ✅ |
| Pedidos | 14 | 14 | 0 | 0 | 0 | ✅ |
| Cobros | 30 | 15 | 0 | 3 | 12 | ✅ |
| Devoluciones | 14 | 13 | 0 | 0 | 1 | ✅ |
| Inventarios | 16 | 15 | 0 | 0 | 1 | ✅ |
| Depósitos | 12 | 12 | 0 | 0 | 0 | ✅ |
| Visitas | 16 | 16 | 0 | 0 | 0 | ✅ |
| Productos | 11 | 9 | 1 | 0 | 1 | ❌ |
| Vendedores | 3 | 3 | 0 | 0 | 0 | ✅ |
| **TOTAL** | **134** | **115** | **1** | **3** | **15** | |

## FAIL críticos (S1/S2)

Ninguno. El único FAIL es de severidad menor (navegación):

| ID | Módulo | Descripción | Severidad |
|----|--------|-------------|-----------|
| DM-PRD-019 | Productos | Back desde lista de productos navega a `/home` en vez de a estructuras. Defecto conocido (ya visto en globalmp/romher), ahora confirmado también en insumar. | S3 |

## SKIP (limitación de automatización, no defecto)

| ID | Módulo | Motivo |
|----|--------|--------|
| DM-COB-020 | Cobros | Dirty-guard back no accesible vía CDP (limitación de automatización) |
| DM-COB-021 | Cobros | Ídem 020 |
| DM-COB-038 | Cobros | Ídem 020 |

## N/A estructurales (15)

- **Cobros (12):** 006 (`requiredComment=false`), 007/008 (cobro normal sin documentos pendientes), 034/012/043/040 (sin datos cobrables / catálogo de bancos vacío), 019 (sin cobro normal enviable), 041/042 (retención por documento no observable en cobro normal), 037 (COBRO 25% IVA sin clientes elegibles), 039 (`enabledManualRate=false`).
- **Devoluciones (1):** DM-DEV-011 (invoice-selector no existe con `validateReturn=false`).
- **Inventarios (1):** DM-INV-020 (sin historial, `quUnitSuggested=0`).
- **Productos (1):** DM-PRD-013 (detalle de producto en insumar no expone selector de lista de precios — único `ion-select` es Almacén).

## Registros creados en sistema (persisten)

| Módulo | Ref | Detalle |
|--------|-----|---------|
| Clientes | Nro. 9 | Cliente potencial `Test-CLT-SMOKE-132051` (RIF J-12345678-9) — **Enviado** |
| Pedidos | Nro. 20 | Pedido ADRIAN ARLET (2738), 1 ítem MAIZ x2, comentario `Test-PED-SMOKE-132051` — **Enviado** |
| Devoluciones | Nro. 8 | Devolución ADRIAN ARLET (2738), Calidad, TOMATES PELADOS MARY x5 — **Enviada** |
| Inventarios | Nro. 16 | Inventario ADRIAN ARLET (2738), CEREAL MEGA AROS x12 BULTO, Lote LOTE-QA-001 — **Enviado** |
| Depósitos | Ref 12 | Depósito QA2848623, BANESCO RAEL, 2000 BS, cobro vinculado ref 50 — **Enviado** |
| Visitas | Nro. 762 | Visita ADRIAN ARLET (2738), MERCHANDISING/VISIBILIDAD PDV, `Test-VIS-015-153332` — **Enviada** |

**Cobros Guardado pendientes de envío manual (4):** retención (doc FACT20086729), anticipo/prepago (Efectivo BS 100), IGTF (doc IGTF-2026-05-21 US$ 19), y un cobro normal reabierto. Ninguno enviado al sistema.

Todos los registros temporales (pedido Ref 0, devolución Ref 0, inventario Ref 0, depósito local 5000 BS, cliente `Test-CLT-DEL`, visitas locales) fueron **eliminados** dentro de su propio caso de prueba y no persisten.

## Observaciones generales

1. **TBDs del perfil insumar resueltos en esta corrida** (recomendado actualizar `insumar.yaml`):
   - `requiredComment = false` (confirmado en Cobros).
   - `retencion = true` (detalle de documento con campos de retención observable).
   - `cobroPrepago`: el cliente test SÍ es elegible para ANTICIPO/PREPAGO → DM-COB-028 superó su N/A previsto; conviene quitarlo de `smoke_na_estructural`.
2. **Defecto conocido DM-DEP-010/018 (v6.6.14 `deposit.service.ts`, lista BUSCAR no renderiza tras guardar) NO se reprodujo** — la lista renderizó correctamente en los 3 accesos. Revisar en próxima corrida si fue corregido o es intermitente antes de actualizar RUNTIME §5.
3. **DM-VIS-025/026 pasaron como PASS (no N/A)** — contrario a `smoke_na_estructural`: RUTA DE HOY tenía 4 visitas sincronizadas del backend (757-760). Revisar si el N/A estructural sigue aplicando o fue circunstancial.
4. **Productos:** insumar SÍ tiene 2 tipos de estructura (Línea + Sub-Línea) → DM-PRD-002 ejecutable y PASS. Precio en detalle confirmado en doble moneda (multiCurrency).
5. **`#bankPickerModal` (Cobros, método Depósito) salió con catálogo de bancos vacío** ("No hay resultados") — confirmar si es precondición de datos o fallo de carga (afecta varios N/A de Cobros).
6. **Infra:** al iniciar esta continuación el `adb forward` apuntaba a un PID WebView obsoleto (32205); se re-estableció a PID 8800. Sesión y login persistieron (app en `/home`).

## Reportes individuales

- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md)
- [Cobros](cobros.md) · [Devoluciones](devoluciones.md) · [Inventarios](inventarios.md)
- [Depósitos](depositos.md) · [Visitas](visitas.md) · [Productos](productos.md)
- [Vendedores](vendedores.md)

---
*Generado por Claude Code · Orquestador Smoke · 2026-06-09*
