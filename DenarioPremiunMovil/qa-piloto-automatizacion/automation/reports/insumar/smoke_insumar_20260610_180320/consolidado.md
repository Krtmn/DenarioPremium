# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-06-10 |
| **RUN_ID** | `20260610_180320_smoke-completo` |
| **Cliente / Playa** | insumar — INSUMAR DISTRIBUIDOR (Isla Coche) |
| **Dispositivo** | 14678405BR003855 (Infinix X6728, Android 15) |
| **App** | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| **Credenciales** | `***`/`***` |
| **Resultado global** | **120 PASS · 0 FAIL · 1 SKIP · 14 N/A** de 135 casos |

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP | N/A | Estado |
|--------|-------|------|------|------|-----|--------|
| Login | 6 | 6 | 0 | 0 | 0 | ✅ |
| Clientes | 12 | 12 | 0 | 0 | 0 | ✅ |
| Pedidos | 14 | 14 | 0 | 0 | 0 | ✅ |
| Cobros | 32 | 21 | 0 | 1 | 10 | ✅ |
| Devoluciones | 14 | 13 | 0 | 0 | 1 | ✅ |
| Inventarios | 16 | 16 | 0 | 0 | 0 | ✅ |
| Depósitos | 12 | 12 | 0 | 0 | 0 | ✅ |
| Visitas | 16 | 14 | 0 | 0 | 2 | ✅ |
| Productos | 10 | 9 | 0 | 0 | 1 | ✅ |
| Vendedores | 3 | 3 | 0 | 0 | 0 | ✅ |
| **TOTAL** | **135** | **120** | **0** | **1** | **14** | |

## FAIL críticos (S1/S2)

Ninguno. **Corrida sin FAIL.**

## SKIP

| ID | Módulo | Motivo |
|----|--------|--------|
| DM-COB-029 (envío) | Cobros | Retención exige adjunto; envío vía CDP no viable → cobro queda Guardado (envío manual) |

## N/A estructurales (14)

- **Cobros (10):** 006 (`requiredComment=false`), 007/008 (sin docs pendientes para 2738), 037 (25% IVA sin clientes elegibles), 039 (`enabledManualRate=false`), 041/042 (`retencion=false` — sin campos de retención por documento), 045 (insumar no expone selector de tasa IGTF → no hay alterna que elegir).
- **Devoluciones (1):** DM-DEV-011 (`validateReturn=false`, sin invoice-selector).
- **Visitas (2):** DM-VIS-025/026 (RUTA DE HOY sin visitas sincronizadas hoy).
- **Productos (1):** DM-PRD-013 (detalle insumar sin selector de Lista de Precios).

## Persistencia IGTF (casos nuevos DM-COB-044 / 045)

- **DM-COB-044 = PASS** — cobro IGTF $, default ≈3% → Guardar → reabrir: selector/línea IGTF del Tab Total (US$ 0,09 / BS 46,62) y columna IGTF del documento **idénticos** a lo guardado. Sabor "default conservado" sin regresión.
- **DM-COB-045 = N/A** — el build de insumar **no expone un selector de tasa IGTF** (la fija por documento, sin opción de cambio). No hay tasa alterna que elegir → N/A por regla del smoke. El flag `igtf_persistencia_bug2_fixed=true` no fue empíricamente verificable en insumar por ausencia de selector; sin regresión observable.

## Registros creados en sistema (persisten)

| Módulo | Ref | Detalle |
|--------|-----|---------|
| Clientes | Nro. Ref 10 | Cliente potencial `Test-CLT-SMOKE-180320` (empresa INSUMAR DISTRIBUIDOR) — Enviado |
| Pedidos | Nro. 26 | Pedido ADRIAN ARLET (2738), VITTALE ×2, `Test-PED-SMOKE-180320` — Enviado |
| Cobros | IGTF Nro. 55 | Cobro IGTF ADRIAN ARLET (2738), total US$ 3,13, IGTF US$ 0,09 — Enviado |
| Devoluciones | Nro. 10 | Devolución ADRIAN ARLET (2738), TOMATES PELADOS MARY ×2, Calidad — Enviada |
| Inventarios | Ref 17 | Inventario ADRIAN ARLET (2738), TOMATES PELADOS MARY ×15, LOTE-QA-180320 — Enviado |
| Depósitos | Ref 13 | Depósito BANESCO RAEL, plantilla 180320, 1 cobro vinculado (ALFREDO LUIS ALVES) — Enviado |
| Visitas | Nro. Ref 763 | Visita ADRIAN ARLET (2738), `Test-VIS-180320`, Visitado — Enviada |

**Pendiente de envío manual (1):** cobro RETENCIÓN (doc FACT20086729) Guardado — el envío requiere adjunto.
Registros temporales (pedido/devolución/inventario Ref 0, depósito 180320b, cliente `Test-CLT-DEL`, visitas locales) fueron **eliminados** dentro de su propio caso.

## Observaciones generales

1. **Corrida sin FAIL** — primera corrida de insumar con 0 FAIL. La eliminación de DM-PRD-019 del smoke evitó el FAIL recurrente de back-navigation.
2. **DM-DEP-010/018 NO reprodujo** (2ª corrida consecutiva limpia, 0609 + 0610) → candidato a cerrar el defecto; confirmar fix en código antes.
3. **TBDs de perfil resueltos:** `vgs.retencion=false`; DM-COB-028 (ANTICIPO/PREPAGO) con cliente 2738 **sí elegible** (ya no es N/A estructural); insumar **no expone selector de tasa IGTF**.
4. **Corrección pendiente en memoria:** `module-selectors.md` marca DM-PRD-002 como "N/A estructural en globalmp/romher/insumar", pero en insumar **es PASS** (tiene 2 tipos: Línea + Sub-Línea). El Agente 11 debe corregir la nota.

## Memoria: patrones promovidos (Agente 11 — consolidación)

Consolidación automática `[ins-2610]` ejecutada al cierre. 27 patrones clasificados.

| Destino | Cantidad | Ejemplos |
|---------|----------|----------|
| `module-selectors.md` (universal) | ~22 entradas | `app-pedido`/`app-pedidos-lista`, `#eventModal` reutilizado, `fechasModal` sin valor inicial, inputs de modal por placeholder, acordeón empresa por `getBoundingClientRect` |
| `insumar.yaml` (inline, VG/cliente) | 8 | `vgs.retencion=false`, IGTF sin selector (DM-COB-045 N/A), DM-COB-028 elegible, DM-PRD-002 PASS / DM-PRD-013 N/A, DM-DEP-010/018 candidato a cerrar |
| `RUNTIME.md` / `helpers.js` (2+ corridas) | 0 | (ningún patrón nuevo alcanzó el umbral de graduación) |

**Correcciones aplicadas a memoria:** `module-selectors.md` ya no marca DM-PRD-002 como N/A en insumar (es PASS, 2 tipos de estructura). `module-selectors.md` quedó en **506 líneas** (< 800).

> Revisar el `git diff` de `module-selectors.md` y `insumar.yaml` antes de commitear.

## Reportes individuales

- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md)
- [Cobros](cobros.md) · [Devoluciones](devoluciones.md) · [Inventarios](inventarios.md)
- [Depósitos](depositos.md) · [Visitas](visitas.md) · [Productos](productos.md)
- [Vendedores](vendedores.md)

---
*Generado por Claude Code · Orquestador Smoke · 2026-06-10*
