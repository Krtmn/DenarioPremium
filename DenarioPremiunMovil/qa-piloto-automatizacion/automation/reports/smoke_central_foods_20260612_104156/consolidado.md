# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android · Playwright MCP + CDP · 1ª corrida CENTRAL FOODS

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-06-12 |
| **RUN_ID** | `20260612_104156_smoke-completo` |
| **Cliente / Playa** | central_foods — CENTRAL FOODS C.A. (El Yaque) |
| **Dispositivo** | 14678405BR003855 (Infinix X6728, Android 15) |
| **App** | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| **Perfil** | VGs precargadas del **CSV de dev** (snapshot 2026-06-12) — 1ª corrida valida VGs vs UI |
| **Resultado global** | **125 PASS · 0 FAIL · 1 SKIP · 11 N/A** de 137 casos |

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP | N/A | Estado |
|--------|-------|------|------|------|-----|--------|
| Login | 6 | 6 | 0 | 0 | 0 | ✅ |
| Clientes | 12 | 12 | 0 | 0 | 0 | ✅ |
| Pedidos | 14 | 14 | 0 | 0 | 0 | ✅ |
| Cobros | 34 | 28 | 0 | 1 | 5 | ✅ |
| Devoluciones | 14 | 14 | 0 | 0 | 0 | ✅ |
| Inventarios | 16 | 14 | 0 | 0 | 2 | ✅ |
| Depósitos | 12 | 12 | 0 | 0 | 0 | ✅ |
| Visitas | 16 | 14 | 0 | 0 | 2 | ✅ |
| Productos | 10 | 9 | 0 | 0 | 1 | ✅ |
| Vendedores | 3 | 2 | 0 | 0 | 1 | ✅ |
| **TOTAL** | **137** | **125** | **0** | **1** | **11** | |

## FAIL críticos (S1/S2)

Ninguno. **1ª corrida de central_foods sin FAIL.**

## Validación del CSV de dev (VGs config vs app real)

El enfoque CSV funcionó: las VGs precargadas permitieron al agente saber qué esperar. Validaciones destacadas:
- **Retención por detalle de documento (DM-COB-041/042) = PASS** — `retencion=true`; 1ª verificación real (insumar era N/A). El bug de persistencia (volver al bruto al reabrir) **NO reprodujo**.
- **Pago parcial (DM-COB-046, toggle) y Fecha tasa (DM-COB-047) = PASS** round-trip.
- **IGTF y 25% IVA ausentes** en UI → coinciden con `userCanSelectIGTF=false` / `userCanCollectIva=false` (DM-COB-036/044/045/037 N/A correctos).
- **Devoluciones con factura (validateReturn=true) = PASS** — flujo de selección de factura activo (≠ insumar); DM-DEV-011 aplicó.
- GPS obligatorio (`userMustActivateGPS=true`) **no bloqueó** (permisos concedidos).

### ⚠ Discrepancia / nota para dev
- **`enterpriseEnabled=false` (CSV) vs UI:** en Clientes el form de cliente potencial muestra el campo Empresa (`idEnterprise` = "CENTRAL FOODS C.A.", **preseleccionado, no editable**). En otros módulos aparece como encabezado/display no interactivo. No bloquea (1 sola empresa). **Candidato a confirmar con dev** si la VG debería reflejar este display.

## SKIP / N/A

- **SKIP (1):** DM-COB-019 (envío) — `requiredCollectionAttachments=true`, adjunto no viable por CDP → cobros quedan Guardado (envío manual).
- **N/A (11):** Cobros 006 (`requiredComment=false`), 036/044/045 (IGTF off), 037 (25%IVA off); Inventarios 020 (sin historial), 017 nota; Visitas 025/026 (RUTA DE HOY vacía); Productos 013 (`userCanChangePriceList=false`); Vendedores 002 (KPIs vacíos esta sesión).

## Hallazgos nuevos (no FAIL)

- **H1 — Depósitos: "Nro. Plantilla" no persiste** al reabrir un depósito Guardado (se guarda pero vuelve vacío; el resto persiste). Divergencia del oráculo §9. Confirmar en código si es write-only/server-side o bug de relectura.
- **Defecto v6.6.14 DM-DEP-010/018 NO reprodujo** (lista BUSCAR renderiza) — refuerza candidato a cierre.

## Gaps de verificación (para próxima corrida)
- `signatureStock` / `signatureDeposit` (firma en inventarios/depósitos) — sin caso dedicado.
- `visitRout` (rutas en mapa) — no verificable (RUTA DE HOY vacía hoy).

## Registros enviados al sistema (persisten)

| Módulo | Ref / Nro | Detalle | Estado |
|--------|-----------|---------|--------|
| Clientes | Nro. Ref 7 | Cliente potencial `Test-CLT-SMOKE-104156` | Enviado |
| Pedidos | Nro. 93 | Pedido ALEJANDRA (00029), ARROZ MARY DORADO x2 (+ 91/92 de intentos interrumpidos por API) | Enviado |
| Devoluciones | Nro. Ref 6 | Devolución ALEJANDRA, SUNNY FLAKES x2, factura 0616402, Calidad | Enviada |
| Inventarios | Nro. Ref 6 | Inventario ALEJANDRA, ARROZ MARY DORADO x5, LOTE-QA-104156 | Enviado |
| Depósitos | Nro. 4 | Depósito BANESCO, BS 1000, cobro vinculado Ref 17 | Enviado |
| Visitas | Nro. Ref 55 | Visita ALEJANDRA, EVENTOS/SUPERVISION, `Test-VIS-104156` | Enviada |

**Cobros pendientes de envío manual (≈6 Guardado):** completo, parcial, retención, fecha-tasa, anticipo, retención-tipo — todos Guardado por `requiredCollectionAttachments=true`.

## Datos descubiertos (capa de datos — para el yaml)
- `clientes.cliente_busqueda` = "ALEJANDRA" · `cliente_detalle` = "ALEJANDRA LEDEZMA" (00029)
- `cobros.cliente_test` = "ALEJANDRA LEDEZMA" (00029, con documentos) · `clientes_con_documentos` ≈ [00029]
- `devoluciones.factura_test` = 0616402 · `producto_test` = CEREAL SUNNY FLAKES 24X230 GRS (0566)
- `pedidos.alerta_deuda_vencida` = true · `estructura_producto` = categorías/familias en acordeón
- `productos.tipo_estructura_default` = "Linea" (2 tipos) · `texto_busqueda` = "PREMIUM"
- `vgs.esVendedor` = true (resuelto de TBD)

## Memoria: patrones promovidos (Agente 11 — consolidación)

Consolidación automática `[cf-2612]` al cierre. 21 patrones clasificados.

| Destino | Cantidad | Ejemplos |
|---------|----------|----------|
| `module-selectors.md` (universal) | ~22 entradas | Tab Pedido = `productos-tab` (build divergente), `#invoiceSelect` devoluciones (validateReturn=true), retención por detalle (`search-sharp`/`openDocumentSale`), toggle pago parcial (2º cliente), fecha tasa, checkbox login |
| `central_foods.yaml` (inline) | 9 datos | banco BANESCO, doc retención FACT0615878, montos IVA/ISLR, moneda_cobro BS, metodo_pago, nota productos-tab |
| `RUNTIME.md` / `helpers.js` | 0 | (sin graduaciones; DM-DEP-010/018 = candidato fuerte a cierre, 3ª corrida limpia) |

**Hitos:** ✅ **Gap G1 cerrado** (retención por detalle de documento, 1ª verificación real). Build divergente `productos-tab` documentada. `module-selectors.md` en **546 líneas** (< 800).

> Revisar el `git diff` de `module-selectors.md` y `central_foods.yaml` antes de commitear.

## Reportes individuales

- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md)
- [Cobros](cobros.md) · [Devoluciones](devoluciones.md) · [Inventarios](inventarios.md)
- [Depósitos](depositos.md) · [Visitas](visitas.md) · [Productos](productos.md)
- [Vendedores](vendedores.md)

---
*Generado por Claude Code · Orquestador Smoke · 1ª corrida central_foods · 2026-06-12*
