# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-06-04 |
| **RUN_ID** | `20260604_122859_smoke-completo` |
| **Cliente** | romher · TRADICIONAL OV19 09 · El Yaque |
| **Dispositivo** | `14678405BR003855` · Infinix X6728 · Android 15 |
| **App** | `com.kiberno.denarioPremiumPro` · Chrome/148.0.7778.179 |
| **Credenciales** | `***`/`***` (QA_USER=170) |
| **Tipo de corrida** | Primera corrida formal — exploratoria |
| **Resultado global** | **93 PASS · 4 FAIL · 1 SKIP · 8 N/A** + 6 defecto conocido (Depósitos) |

---

## Resumen por módulo

| Módulo | PASS | FAIL | SKIP | N/A | Estado |
|--------|------|------|------|-----|--------|
| Login | 6 | 0 | 0 | 2 | ✅ |
| Clientes | 12 | 0 | 0 | 0 | ✅ |
| Pedidos | 11 | 1 | 0 | 0 | ⚠️ |
| Cobros | 14 | 0 | 1 | 3 | ✅ |
| Devoluciones | 10 | 0 | 0 | 1 | ✅ |
| Inventarios | 12 | 0 | 0 | 1 | ✅ |
| Depósitos | 6 | 0 | 0 | 0 | ⚠️ defecto conocido |
| Visitas | 12 | 1 | 0 | 0 | ⚠️ |
| Productos | 7 | 2 | 0 | 1 | ⚠️ |
| Vendedores | 3 | 0 | 0 | 0 | ✅ |
| **TOTAL** | **93** | **4** | **1** | **8** | |

> Depósitos: 6 casos marcados como defecto conocido (bug v6.6.14 `deposit.service.ts` — confirmado en hidroponias, insumar y romher).

---

## FAILs activos (nuevos en esta corrida)

| ID | Módulo | Descripción | Severidad |
|----|--------|-------------|-----------|
| DM-PED-032 | Pedidos | Modal "3 opciones" (Guardar y salir / Salir sin guardar / Cancelar) no se activa cuando el formulario está pristine — navega directo | S2 |
| DM-VIS-002 | Visitas | "VER MEJOR RUTA" lanza `ion-loading` que no se dismiss cuando GPS no resuelve en CDP; alert esperado nunca aparece | S2 |
| DM-PRD-013 | Productos | Selector "Lista de precio" cambia valor interno pero el precio en pantalla no se actualiza; reproducible en todos los productos | S2 |
| DM-PRD-019 | Productos | Back desde detalle de producto navega a lista de productos en lugar de lista de estructuras/proveedores | S3 |

---

## VGs descubiertas (romher — primera corrida formal)

| VG | Valor confirmado |
|----|----------------|
| `multiCurrency` | `true` |
| `expirationBatch` | `true` (campos opcionales, no bloquean) |
| `suggestedOrderByDispatchAndReturn` | `true` |
| `requiredCollectionAttachments` | `false` |
| `requiredComment` | `true` |
| `validateReturn` | `false` |
| `signatureReturn` | `true` |
| `signatureVisit` | `true` |
| `userCanUploadFiles` | `true` |
| `esVendedor` | `true` |
| `enterpriseEnabled` | `true` (empresa: "Tradicional OV19 09") |
| `enabledManualRate` | `false` |
| `cobroPrepago` | `true` |
| `cobroRetencion` | `true` (requiere adjunto propio) |
| `userCanSelectIGTF` | `false` |
| `userCanCollectIva` | `false` |

VGs aún pendientes: `signatureCollection`, `transportRole`, `userMustActivateGPS`

---

## Registros creados en sistema

| Módulo | Ref | Detalle | Estado |
|--------|-----|---------|--------|
| Clientes | Nro. Ref: 6 | Cliente potencial `Test-CLT-SMOKE-122859` | Enviado |
| Pedidos | Nro. 23085 | SUPERMERCADO SIDON, C.A. — producto COLGATE | Enviado |
| Cobros | Nro. 15734 | SUPERMERCADO SIDON · Depósito Banco Provincial · VED 72.385,49 | Enviado |
| Cobros | sin nro. | Retención SIDON — envío bloqueado por adjunto obligatorio | Guardado |
| Devoluciones | Nro. 67 | SIDON · SUAVITEL FRESCA PRIMAVERA 1L · Cant: 2 | Enviado |
| Inventarios | Nro. 4 | SIDON · SUAVITEL FRESCA PRIMAVERA 1L · Cant: 25 · Lote: LOTE-QA-2026 | Enviado |
| Depósitos | sin nro. | Banco Provincial · cobro seleccionado | Guardado (no enviado — defecto lista) |
| Visitas | Nro. 72559 | SIDON · VISITA SIN ACCION + NEGOCIO CERRADO | Enviado |

---

## Observaciones generales

1. **Primera corrida exploratoria exitosa.** `romher.yaml` completamente poblado para corridas futuras.
2. **4 FAILs nuevos** — ninguno es regresión de corridas anteriores; son específicos de romher o del entorno El Yaque.
3. **Bug v6.6.14 Depósitos** confirmado en el tercer cliente — evidencia suficiente para priorizar el fix en `deposit.service.ts`.
4. **romher es multiempresa** (`enterpriseEnabled=true`) pero el login no presentó selector de empresa — la cuenta QA_USER=170 tiene empresa única asignada ("Tradicional OV19 09").
5. **`requiredComment=true`** es un comportamiento diferente a hidroponias/insumar — afecta a Cobros (tabs disabled sin comentario).
6. **Retención requiere adjunto propio** (`DM-COB-029 SKIP`) igual que en insumar — patrón confirmado en 2 corridas.
7. **DM-VIS-002** (VER MEJOR RUTA + GPS) puede ser estructural en entorno CDP — evaluar si se puede resolver con mock de geolocalización.

---

## Reportes individuales

- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md) · [Cobros](cobros.md) · [Devoluciones](devoluciones.md)
- [Inventarios](inventarios.md) · [Depósitos](depositos.md) · [Visitas](visitas.md) · [Productos](productos.md) · [Vendedores](vendedores.md)

---
*Generado por Claude Code · Orquestador Smoke · 2026-06-04*
