# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-06-03 |
| **RUN_ID** | `20260603_093706_smoke-completo` |
| **Cliente** | insumar · INSUMAR DISTRIBUIDOR · Isla Coche |
| **Dispositivo** | `14678405BR003855` · Infinix X6728 · Android 15 |
| **App** | `com.kiberno.denarioPremiumPro` · Chrome/148.0.7778.179 |
| **Credenciales** | `***`/`***` |
| **Tipo de corrida** | Primera corrida formal — exploratoria |
| **Resultado global** | **93 PASS · 2 FAIL · 4 SKIP · 14 N/A** |

---

## Resumen por módulo

| Módulo | PASS | FAIL | SKIP | N/A | Estado |
|--------|------|------|------|-----|--------|
| Login | 5 | 0 | 0 | 2 | ✅ |
| Clientes | 10 | 0 | 0 | 1 | ✅ |
| Pedidos | 12 | 0 | 0 | 0 | ✅ |
| Cobros | 12 | 0 | 1 | 5 | ✅ |
| Devoluciones | 11 | 0 | 0 | 1 | ✅ |
| Inventarios | 12 | 0 | 0 | 2 | ✅ |
| Depósitos | 7 | 2 | 3 | 0 | ⚠️ |
| Visitas | 11 | 0 | 0 | 2 | ✅ |
| Productos | 10 | 0 | 0 | 1 | ✅ |
| Vendedores | 3 | 0 | 0 | 0 | ✅ |
| **TOTAL** | **93** | **2** | **4** | **14** | |

---

## FAIL críticos

| ID | Módulo | Descripción | Severidad | Nota |
|----|--------|-------------|-----------|------|
| DM-DEP-010 | Depósitos | Lista BUSCAR no muestra depósito Guardado tras guardado | S2 | Defecto conocido v6.6.14 (`deposit.service.ts`) — confirmado también en insumar |
| DM-DEP-018 | Depósitos | Lista BUSCAR no renderiza tras guardar (bug persistente) | S2 | Mismo defecto — no re-marcar FAIL en corridas futuras sin fix confirmado |

---

## VGs descubiertas en esta corrida (insumar — primera corrida formal)

| VG | Valor confirmado |
|----|----------------|
| `multiCurrency` | `true` |
| `expirationBatch` | `true` |
| `suggestedOrderByDispatchAndReturn` | `true` |
| `requiredCollectionAttachments` | `false` |
| `validateReturn` | `false` |
| `signatureReturn` | `true` |
| `signatureVisit` | `true` |
| `userCanUploadFiles` | `true` |
| `esVendedor` | `true` |
| `enterpriseEnabled` | `true` |
| `enabledManualRate` | `false` |
| `cobroPrepago` | `true` (sin clientes elegibles) |
| `cobroRetencion` | `true` (requiere adjunto propio) |
| `userCanSelectIGTF` | `true` |
| `userCanCollectIva` | `true` (sin clientes elegibles) |

VGs aún pendientes: `requiredComment`, `signatureCollection`, `transportRole`, `userMustActivateGPS`

---

## Registros creados en sistema

| Módulo | Ref | Detalle | Estado |
|--------|-----|---------|--------|
| Clientes | Nro. Ref: 8 | Cliente potencial `Test-CLT-SMOKE-094755` | Enviado |
| Pedidos | Nro. 17 | ADRIAN ARLET BASTARDO ALONZO · VITTALE LECHE COMPLETA · 1 UND | Enviado |
| Cobros | Nro. 48 | ADRIAN ARLET (2738) · Depósito BANESCO RAEL BS 100 | Enviado |
| Cobros | s/nro | IGTF · ADRIAN ARLET · Efectivo BS 50 | Enviado |
| Devoluciones | Nro. Ref: 7 | ADRIAN ARLET BASTARDO ALONZO · TOMATES PELADOS MARY | Enviado |
| Inventarios | Nro. Ref: 9 | ADRIAN ARLET (2738) · TOMATES PELADOS MARY 24X400G · 10 UND | Enviado |
| Depósitos | s/nro | BANESCO RAEL · Cobro Ref 45 · BS 4765,23 | Guardado (no enviado — bloqueado por defecto) |
| Visitas | Nro. Ref: 756 | ADRIAN ARLET · MERCHANDISING + COBRANZA | Enviado |

---

## Observaciones generales

1. **Primera corrida exploratoria exitosa.** El perfil `insumar.yaml` fue poblado con todos los datos de prueba necesarios para corridas futuras.
2. **Los únicos FAILs son el defecto conocido v6.6.14** de Depósitos (`deposit.service.ts`). No hay regresiones nuevas.
3. **`depositos.aplica=true`** para insumar — diferente a hidroponias donde es `false`.
4. **`validateReturn=false`** para insumar — las tabs de devoluciones se habilitan sin seleccionar factura.
5. **36 patrones nuevos** documentados en `lecciones-DELTA.md` — muchos son comportamientos de la app descubiertos por primera vez en insumar.
6. **Retención requiere adjunto propio** independientemente de `requiredCollectionAttachments=false` → DM-COB-029 SKIP en insumar hasta aclarar.

---

## Reportes individuales

- [Login](login.md)
- [Clientes](clientes.md)
- [Pedidos](pedidos.md)
- [Cobros](cobros.md)
- [Devoluciones](devoluciones.md)
- [Inventarios](inventarios.md)
- [Depósitos](depositos.md)
- [Visitas](visitas.md)
- [Productos](productos.md)
- [Vendedores](vendedores.md)

---
*Generado por Claude Code · Orquestador Smoke · 2026-06-03*
