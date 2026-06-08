# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-06-05 / 2026-06-08 |
| **RUN_ID** | `20260605_162806_smoke-completo` |
| **Cliente** | globalmp · QA_USER=kleon |
| **Dispositivo** | `14678405BR003855` · Infinix X6728 · Android 15 |
| **App** | `com.kiberno.denarioPremiumPro` · Chrome/148.0.7778.215 |
| **Credenciales** | `***`/`***` |
| **Tipo de corrida** | Primera corrida formal — exploratoria |
| **Resultado global** | **96 PASS · 1 FAIL · 3 SKIP · 21 N/A** |

---

## Resumen por módulo

| Módulo | PASS | FAIL | SKIP | N/A | Estado |
|--------|------|------|------|-----|--------|
| Login | 6 | 0 | 0 | 0 | ✅ |
| Clientes | 11 | 0 | 0 | 0 | ✅ |
| Pedidos | 11 | 0 | 0 | 0 | ✅ |
| Cobros | 19 | 0 | 3 | 8 | ✅ |
| Devoluciones | 10 | 0 | 0 | 2 | ✅ |
| Inventarios | 12 | 0 | 0 | 1 | ✅ |
| Depósitos | 4 | 0 | 0 | 7 | ✅ |
| Visitas | 11 | 0 | 0 | 2 | ✅ |
| Productos | 9 | 1 | 0 | 1 | ⚠️ |
| Vendedores | 3 | 0 | 0 | 0 | ✅ |
| **TOTAL** | **96** | **1** | **3** | **21** | |

---

## FAILs activos

| ID | Módulo | Descripción | Severidad |
|----|--------|-------------|-----------|
| DM-PRD-019 | Productos | Back desde lista de productos navega a HOME en lugar de volver a lista de estructuras — handler no diferencia niveles | S2 |

---

## SKIPs y motivo

| ID | Módulo | Motivo |
|----|--------|--------|
| DM-COB-019 | Cobros | Retención requiere adjunto obligatorio — cobro queda Guardado, pendiente envío manual por QA |
| DM-COB-020 | Cobros | Back button hardware no simulable via CDP en globalmp (limitación estructural) |
| DM-COB-038 | Cobros | Depende de DM-COB-020 |

---

## VGs descubiertas (globalmp — primera corrida formal)

| VG | Valor confirmado |
|----|----------------|
| `multiCurrency` | `false` |
| `expirationBatch` | `true` |
| `suggestedOrderByDispatchAndReturn` | `true` |
| `requiredCollectionAttachments` | `false` (cobros normales) / `true` (Retención — dual-mode) |
| `requiredComment` | `true` |
| `validateReturn` | `false` |
| `signatureReturn` | `true` |
| `signatureVisit` | `true` |
| `userCanUploadFiles` | `true` |
| `esVendedor` | `true` |
| `enterpriseEnabled` | `true` (COMERCIALIZADORA DE + HC TRADING MARKET 20) |
| `enabledManualRate` | `false` |
| `cobroPrepago` | `false` |
| `cobroRetencion` | `true` |
| `retencion` | `true` (sizeRetention TBD — sin docs vencidos en sesión) |
| `userCanSelectIGTF` | `false` |
| `userCanCollectIva` | `false` |

VGs aún pendientes: `signatureCollection`, `transportRole`, `userMustActivateGPS`, `sizeRetention`, `formatRetention`

---

## Registros creados en sistema

| Módulo | Ref | Detalle | Estado |
|--------|-----|---------|--------|
| Clientes | Nro. Ref enviado | Cliente potencial Test-CLT-SMOKE · enterpriseEnabled form | Enviado |
| Pedidos | Nro. 10110 | BIG MARKET 22 · PCE01 PASTA LINGUINI · 2 CAJ · USD 46,78 | Enviado |
| Cobros | Nro. 5438 | BIG MARKET 22 (BM17) · Depósito MERCANTIL · BS 797.872,03 / USD 1.452,34 | Enviado |
| Cobros | sin nro. | Retención BIG MARKET 22 · FF078757 | Guardado — **pendiente envío manual por QA** |
| Devoluciones | Nro. 166 | BIG MARKET 22 · PASTA TALLARIN CORTO PCE03 · Cant: 2 | Enviado |
| Inventarios | confirmado | BIG MARKET 22 (BM17) · producto categoría CAPRI | Enviado |
| Visitas | Nro. enviada | BIG MARKET 22 · VISITA FUERA DE RUTA / VENTA EFECTIVA | Enviado |

---

## Observaciones generales

1. **Primera corrida exploratoria exitosa.** `globalmp.yaml` completamente poblado para corridas futuras.
2. **Solo 1 FAIL nuevo** — DM-PRD-019 (back navigation desde lista de productos). No hay regresiones en módulos principales.
3. **Bug v6.6.14 Depósitos** confirmado también en globalmp (lista BUSCAR no renderiza) — cuarto cliente afectado.
4. **`multiCurrency: false`** — globalmp opera solo en USD. DM-COB-033/034 son N/A estructural.
5. **Retención dual-mode:** `requiredCollectionAttachments=false` para cobros normales pero `true` para Retención — la VG es independiente por tipo de cobro en este cliente. La cobro de Retención queda Guardado para envío manual.
6. **`enterpriseEnabled: true` con 2 empresas** — todas las operaciones requieren seleccionar empresa en Tab General.
7. **Depósitos: N/A por datos** — cobros enviados no aparecen como elegibles para depósito en la misma sesión. Se necesita un cobro previo en estado "pendiente depósito" en el backend.
8. **Vendedores sin KPIs** — API no devuelve datos en esta sesión; acordeones visibles pero contenido vacío. No es FAIL (N/A por API).
9. **QA_USER=kleon** (alfanumérico) — no afecta el flujo; `fetchCreds('globalmp')` lo lee correctamente.

---

## Reportes individuales

- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md) · [Cobros](cobros.md) · [Devoluciones](devoluciones.md)
- [Inventarios](inventarios.md) · [Depósitos](depositos.md) · [Visitas](visitas.md) · [Productos](productos.md) · [Vendedores](vendedores.md)

---
*Generado por Claude Code · Orquestador Smoke · 2026-06-08*
