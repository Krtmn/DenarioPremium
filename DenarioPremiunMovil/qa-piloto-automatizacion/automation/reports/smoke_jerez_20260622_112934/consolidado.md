# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-06-22 |
| **RUN_ID** | `20260622_112934_smoke-completo` |
| **Cliente / Playa** | jerez (**1ª corrida** — cliente nuevo) |
| **Dispositivo** | 14678405BR003855 (Infinix X6728, Android 15) |
| **App** | `com.kiberno.denarioPremiumPro` — v6.6.17 |
| **Credenciales** | `***`/`***` |
| **Resultado global** | **109 PASS · 0 FAIL · 1 PARCIAL · 30 N/A** |

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP/PARC | N/A | Estado |
|--------|-------|------|------|-----------|-----|--------|
| Login | 6 | 6 | 0 | 0 | 0 | ✅ |
| Clientes | 12 | 11 | 0 | 0 | 1 | ✅ |
| Pedidos | 14 | 14 | 0 | 0 | 0 | ✅ |
| Cobros | 37 | 27 | 0 | 1 | 9 | ✅ |
| Devoluciones | 14 | 0 | 0 | 0 | 14 | 🚫 N/A (sin facturas) |
| Inventarios | 16 | 14 | 0 | 0 | 2 | ✅ |
| Depósitos | 12 | 11 | 0 | 0 | 1 | ✅ |
| Visitas | 16 | 14 | 0 | 0 | 2 | ✅ |
| Productos | 10 | 9 | 0 | 0 | 1 | ✅ |
| Vendedores | 3 | 3 | 0 | 0 | 0 | ✅ |
| **TOTAL** | **140** | **109** | **0** | **1** | **30** | ✅ |

## FAIL críticos (S1/S2)

| ID | Módulo | Descripción | Severidad |
|----|--------|-------------|-----------|
| — | — | **Ningún FAIL de producto en toda la corrida** | — |

## Registros enviados al sistema (persisten)

| Módulo | Ref / Nro | Detalle | Estado |
|--------|-----------|---------|--------|
| Clientes | Ref 2 | Cliente potencial `Test-CLT-SMOKE-113845` (RIF J-123456789) | Enviado |
| Pedidos | Nro 9 | JL Motors SE,C.A · PLAN-001 ×2 · USD 468,00 · com. `Test-PED-SMOKE-114817` | Enviado |
| Cobros | Nro 8 | FERRETERIA MUNDIAL (emp 2) · Efectivo BS 79.872,58 · doc *026088 | Enviado |
| Inventarios | Ref 6 | DANIELA HERNANDEZ F.P. · PLAN-001 ×5 · Lote LOTE-QA · venc 22/06/2026 | Enviado |
| Depósitos | Ref 3 | Banesco · BS 79.872,58 · cobro vinculado FERRETERIA MUNDIAL | Enviado |
| Visitas | Ref 6 | DANIELA HERNANDEZ F.P. · actividad EVENTOS/SUPERVISIÓN | Enviada (Visitado) |

**Pendientes de envío manual:** En Cobros quedaron cobros en estado **Guardado** (no enviados) generados durante pruebas de retención, anticipo y pago parcial sobre FERRETERIA MUNDIAL / JL Motors — ver detalle en `cobros.md`. Requieren revisión/envío manual o eliminación. El resto de módulos: ninguno.

## Observaciones generales

- **Cliente nuevo (1ª corrida):** todos los datos de prueba estaban en TBD y fueron **descubiertos en corrida**. Pendiente consolidarlos en `jerez.yaml` (Agente 11).
- **Estructura multi-empresa:** jerez tiene **3 empresas** ("INVERSIONES JEREZ MO" 00001/00002/00003). Primer cliente del piloto con >2 empresas. La empresa 1 (INVERSIONES JEREZ MOTORS, USD) tiene 3 clientes sin documentos (azules); las empresas 2/3 tienen clientes con documentos (rojos).
- **Convención de color confirmada (guía QA):** en Cobros, cliente **rojo = con documentos pendientes**, **azul = sin documentos**. Para cobrar facturas hay que cambiar a empresa 2/3 y elegir clientes en rojo. → guardado en memoria del proyecto.
- **Devoluciones N/A completo (14):** `validateReturn=true` exige factura, pero jerez **no tiene facturas sincronizadas devolvibles** (dentro de `mesesFacturas=3`). Decisión QA: documentar y continuar sin invertir tiempo. No es defecto de producto.
- **Cobros DM-COB-029 PARCIAL:** estructura validada, pero el guardado quedó bloqueado por una limitación de automatización CDP al cambiar de empresa (el `ion-select` de empresa solo responde a click físico). No es defecto de producto.
- **cliente_25iva inexistente:** selector 25% IVA vacío en las 3 empresas → DM-COB-037 N/A.
- **Defectos conocidos que NO reprodujeron:** DM-DEP-018/019/020 (lista BUSCAR depósitos) — 5ª corrida limpia, candidato firme a cierre. DM-INV-026 reprodujo (tab General) — sin cambio, sigue conocido.
- **Dato jerez universal:** alerts de login usan botón **"OK"** (no "Aceptar"); confirmaciones usan ACEPTAR, éxito/borrado usan OK.
- **Infra:** durante Inventarios el PID del WebView cambió (21036→28411); el agente re-apuntó el `adb forward` (solo `adb forward`, sin `adb shell input`). CDP estable el resto de la corrida.

## Memoria: patrones promovidos (Agente 11 — consolidación)

Consolidación ejecutada 2026-06-22. **53 tags `[jerez-2026-06-22]`** en `module-selectors.md` (576 líneas, bajo el límite ~800), `jerez.yaml` poblado con datos de prueba reales (10 secciones de módulo + cabecera + `ultima_corrida`), 10 reportes marcados `> ✅ consolidado 2026-06-22`. **0 graduaciones a RUNTIME** (`productos-tab` queda como candidato firme para la 2ª corrida). `defectos_abiertos` intacto.

| Patrón | Módulo | Destino |
|--------|--------|---------|
| Alerts login botón "OK" (no "Aceptar") | Login | module-selectors.md (nota cliente) |
| Selector de empresa recarga clientes solo con click físico | Cobros | module-selectors.md (fila nueva) |
| Color de cliente = color del Saldo en modal (rojo=con docs, azul=sin docs) | Cobros | module-selectors.md + jerez.yaml |
| Sin facturas devolvibles → N/A estructural | Devoluciones | jerez.yaml (nota cliente) |
| Detalle `product-detail` + scroll infinito físico | Productos | module-selectors.md (2 filas) |
| 1 solo tipo LINEA (idType=1) → DM-PRD-002 N/A | Productos | jerez.yaml |
| jerez multi-empresa (3 acordeones) / entrada Vendedores por coords | Vendedores | module-selectors.md + jerez.yaml |
| DM-DEP-018/019/020 NO reproduce (5ª corrida limpia) | Depósitos | nota crítica (candidato a cierre) |
| Datos de prueba reales (clientes, productos, bancos, estructuras) | Todos | jerez.yaml (TBD → valores reales) |

*Revisar el `git diff` de `module-selectors.md` y `jerez.yaml` antes de commitear.*

## Reportes individuales

- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md)
- [Cobros](cobros.md) · [Devoluciones](devoluciones.md) · [Inventarios](inventarios.md)
- [Depósitos](depositos.md) · [Visitas](visitas.md) · [Productos](productos.md)
- [Vendedores](vendedores.md)

---
*Generado por Claude Code · Orquestador Smoke · 2026-06-22*
