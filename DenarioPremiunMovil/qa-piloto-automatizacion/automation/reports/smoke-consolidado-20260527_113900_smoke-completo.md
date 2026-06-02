# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-05-28 |
| **RUN_ID** | `20260527_113900_smoke-completo` |
| **Dispositivo** | `14678405BR003855` (Infinix X6728 · Android 15) |
| **App** | `com.kiberno.denarioPremiumPro` — Versión 6.6.14 |
| **Credenciales** | `***`/`***` |
| **Resultado global** | **110 PASS · 3 FAIL · 1 SKIP · 9 N/A** de 123 casos contabilizados |

> **Nota de cobertura:** El plan de pruebas define 127 casos. Los reportes individuales acumulan 123 (4 diferencia por casos de navegación consolidados en ejecución — ver tablas de casos en reportes individuales de Clientes, Pedidos y Depósitos).

---

## Resumen por módulo

| Módulo | Casos plan | PASS | FAIL | SKIP | N/A | Contabilizados | Estado |
|--------|-----------|------|------|------|-----|----------------|--------|
| Login | 9 | 6 | 0 | 0 | 3 | 9 | ✅ |
| Clientes | 12 | 9 | 0 | 1 | 0 | 10 | ✅ |
| Pedidos | 14 | 13 | 0 | 0 | 0 | 13 | ✅ |
| Cobros | 19 | 19 | 0 | 0 | 0 | 19 | ✅ |
| Devoluciones | 14 | 14 | 0 | 0 | 0 | 14 | ✅ |
| Inventarios | 16 | 15 | 0 | 0 | 1 | 16 | ✅ |
| Depósitos | 12 | 6 | 3 | 0 | 2 | 11 | ❌ |
| Visitas | 17 | 15 | 0 | 0 | 2 | 17 | ✅ |
| Productos | 11 | 11 | 0 | 0 | 0 | 11 | ✅ |
| Vendedores | 3 | 2 | 0 | 0 | 1 | 3 | ✅ |
| **TOTAL** | **127** | **110** | **3** | **1** | **9** | **123** | |

> *Visitas reporta 13 PASS + 2 PASS\* (con observación de comportamiento) = 15 PASS total.*

---

## FAIL críticos

| ID | Módulo | Descripción | Evidencia / Hipótesis |
|----|--------|-------------|----------------------|
| DM-DEP-018 | Depósitos | Lista BUSCAR no renderiza depósitos tras guardar | Alert de guardado OK pero `itemListaDepositos` queda vacío. Hipótesis: race condition en `saveDeposit()` (`deposit.service.ts` ~línea 672-675) — `this.database` usado antes de ser asignado, o `(ionChange)` del banco no disparó dejando `coBank/coCurrency` vacíos. **Severidad S1** |
| DM-DEP-019 | Depósitos | Botón enviar siempre deshabilitado | Dependencia directa del FAIL-018: sin depósito guardado visible no hay registro que enviar. **Severidad S1** |
| DM-DEP-020 | Depósitos | No se puede eliminar depósito "Guardado" | Precondición bloqueada por FAIL-018: lista vacía, sin elementos seleccionables. **Severidad S1** |

---

## N/A registrados (no son defectos)

| ID | Módulo | Motivo |
|----|--------|--------|
| DM-LOG-008/009 | Login | Sin segunda cuenta QA en `secrets/qa-credentials.env` |
| DM-LOG-017 | Login | Corrida normal sin reinstalación limpia |
| DM-INV-020 | Inventarios | Sin inventario anterior: `quUnitSuggested=0`; botón ACEPTAR deshabilitado por diseño |
| DM-DEP-010 | Depósitos | Sin cobros disponibles asociados al banco en entorno QA |
| DM-DEP-014 | Depósitos | Dependiente de DM-DEP-010 (sin cobros disponibles) |
| DM-VIS-025 | Visitas | Sin visitas "No Visitado" sincronizadas desde backend para el día de hoy |
| DM-VIS-026 | Visitas | Dependiente de DM-VIS-025; requiere GPS + visitas sincronizadas |
| DM-VND-002 | Vendedores | Acordeón funciona OK pero contenido vacío (API no devolvió datos para la empresa de la cuenta QA) |

---

## SKIP registrados

| ID | Módulo | Motivo |
|----|--------|--------|
| DM-CLT-031 | Clientes | El único cliente potencial existente (Test-CLT-SMOKE-113900) fue enviado en DM-CLT-026, pasando a estatus "Enviado"; sin elementos con estatus "Guardado" disponibles para eliminar |

---

## Observaciones generales

1. **Infraestructura CDP:** La app `com.kiberno.denarioPremiumPro` no estaba instalada al inicio de la sesión 2026-05-28. Se realizó `adb install -r` exitoso desde `android/app/build/outputs/apk/debug/app-debug.apk`. El port forward `:9220 → webview_devtools_remote_2097` se reestableció correctamente. El servidor de credenciales en `:19001` permaneció activo durante toda la corrida.

2. **VGs activas en cuenta QA:** `expirationBatch=true`, `suggestedOrderByDispatchAndReturn=true` (Inventarios), `validateReturn=true` (Devoluciones), `signatureReturn=true`, `userCanUploadFiles=true` (Devoluciones/Visitas), `multiCurrency=true` (Clientes/Productos), `esVendedor=true` (Vendedores).

3. **Técnica ion-select en Ionic:** En esta versión (Ionic 6 + Chrome 148), el popover de radio no cierra al hacer clic en ítem vía MouseEvent desde CDP. Workaround: asignación directa de `value` + `ionPopover.dismiss()`. Documentado en Visitas (DM-VIS-019).

4. **Alerts residuales en DOM:** El DOM de Ionic 6 no descarta elementos `ion-alert` cerrados — permanecen con clase `overlay-hidden`. Los agentes deben filtrar por visibilidad (`offsetParent !== null`, `classList.contains('overlay-hidden') === false`) para evitar ambigüedades en los selectores.

5. **Corrida en dos sesiones:** Los módulos 1-5 se ejecutaron el 2026-05-27. Los módulos 6-10 se ejecutaron el 2026-05-28 tras reinstalación de APK. No hay impacto en resultados; los datos de prueba del día anterior persistieron en BD local (visible en Visitas DM-VIS-010, Devoluciones DM-DEV-021).

6. **Versión confirmada:** `6.6.14` en todos los módulos (footer de login y atributo en DOM).

---

## Reportes individuales

| Módulo | Archivo | Resultado |
|--------|---------|-----------|
| [Login](smoke-login-20260527_113900_smoke-completo.md) | `smoke-login-20260527_113900_smoke-completo.md` | 6P · 0F · 0S · 3N/A |
| [Clientes](smoke-clientes-20260527_113900_smoke-completo.md) | `smoke-clientes-20260527_113900_smoke-completo.md` | 9P · 0F · 1S · 0N/A |
| [Pedidos](smoke-pedidos-20260527_113900_smoke-completo.md) | `smoke-pedidos-20260527_113900_smoke-completo.md` | 13P · 0F · 0S · 0N/A |
| [Cobros](smoke-cobros-20260527_113900_smoke-completo.md) | `smoke-cobros-20260527_113900_smoke-completo.md` | 19P · 0F · 0S · 0N/A |
| [Devoluciones](smoke-devoluciones-20260527_113900_smoke-completo.md) | `smoke-devoluciones-20260527_113900_smoke-completo.md` | 14P · 0F · 0S · 0N/A |
| [Inventarios](smoke-inventarios-20260527_113900_smoke-completo.md) | `smoke-inventarios-20260527_113900_smoke-completo.md` | 15P · 0F · 0S · 1N/A |
| [Depósitos](smoke-depositos-20260527_113900_smoke-completo.md) | `smoke-depositos-20260527_113900_smoke-completo.md` | 6P · **3F** · 0S · 2N/A |
| [Visitas](smoke-visitas-20260527_113900_smoke-completo.md) | `smoke-visitas-20260527_113900_smoke-completo.md` | 15P · 0F · 0S · 2N/A |
| [Productos](smoke-productos-20260527_113900_smoke-completo.md) | `smoke-productos-20260527_113900_smoke-completo.md` | 11P · 0F · 0S · 0N/A |
| [Vendedores](smoke-vendedores-20260527_113900_smoke-completo.md) | `smoke-vendedores-20260527_113900_smoke-completo.md` | 2P · 0F · 0S · 1N/A |

---

*Generado por Claude Code · Orquestador Smoke · 2026-05-28*
