# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android USB · Playwright MCP + CDP · Cliente JEREZ (nuevo set de datos)

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-07-06 |
| **RUN_ID** | `20260706_175921_smoke-completo` |
| **Cliente** | jerez — INV JEREZ MOTORS (3 empresas: VALERA / CARACAS / TURMEREMO) |
| **Dispositivo** | `14678405BR003855` |
| **App** | `com.kiberno.denarioPremiumPro` |
| **Modo** | Smoke UI completo · **SIN cotejo BD** (por instrucción) · nuevo set de datos |
| **Resultado global** | **109 PASS · 0 FAIL · 5 SKIP · 23 N/A · 0 BLOCKED** de 137 casos |

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP | N/A | BLK | Estado |
|--------|-------|------|------|------|-----|-----|--------|
| Login | 6 | 6 | 0 | 0 | 0 | 0 | ✅ |
| Clientes | 12 | 11 | 0 | 0 | 1 | 0 | ✅ |
| Pedidos | 14 | 14 | 0 | 0 | 0 | 0 | ✅ |
| Cobros | 34 | 29 | 0 | 0 | 5 | 0 | ✅ |
| Devoluciones | 14 | 4 | 0 | 0 | 10 | 0 | ✅ |
| Inventarios | 16 | 16 | 0 | 0 | 0 | 0 | ✅ |
| Depósitos | 12 | 4 | 0 | 5 | 3 | 0 | ✅ |
| Visitas | 16 | 14 | 0 | 0 | 2 | 0 | ✅ |
| Productos | 10 | 9 | 0 | 0 | 1 | 0 | ✅ |
| Vendedores | 3 | 2 | 0 | 0 | 1 | 0 | ✅ |
| **TOTAL** | **137** | **109** | **0** | **5** | **23** | **0** | ✅ |

## FAIL críticos (S1/S2)

Ninguno. **0 FAIL en toda la corrida.** Harness estable (0 BLOCKED): los parches de cobros (`setIonDatetime`, `fillNgModelField`) y el gateway de empresa sin limpiar caché sostuvieron los flujos complejos.

## Registros enviados al sistema (estatus UI — SIN cotejo BD)

> ⚠ **Corrida sin lectura de BD:** los estatus son los que muestra la UI. Varias transacciones quedaron **"Por Enviar"** (cola de salida local) y no viraron a "Enviado" en la ventana de observación. **No se confirmó persistencia en nube** — ver "Observaciones generales / H1".

| Módulo | Ref / Detalle | Estatus UI |
|--------|---------------|-----------|
| Clientes | Potencial `Test-CLT-SMOKE-181237` (Ref 1) | Enviado (permanece en lista) |
| Pedidos | Pedido `JL Motors SE,C.A` · PLAN-001 x2 · Total 542,88 USD (Ref 0) | **Por Enviar** |
| Cobros | Cobro `MULTIREPUESTOS DRG` (emp 2) · Efectivo · BS 16.154,91 | **Por Enviar** |
| Inventarios | `DANIELA HERNANDEZ F.P.` · PLAN-001 x5 · Lote LOTE-QA-706 (Ref 0) | **Por Enviar** |
| Visitas | Visita `DANIELA HERNANDEZ F.P.` · 1 evento SUPERVISION DE EVENTOS (Ref 0) | **Por Enviar** |

**Pendientes de envío manual (Guardados en Cobros):**
- Anticipo `JL Motors` BS 50,00 — Guardado
- Cobro parcial `MULTIREPUESTOS DRG` BS 400,00 — Guardado (round-trip §9 OK)
- Cobro fecha-tasa `MULTIREPUESTOS DRG` BS 20.335,83 — Guardado (recálculo §9 OK)
- Retención tipo-cobro `MULTIREPUESTOS DRG` — Guardado, pendiente adjunto para envío

**Registros temporales creados y eliminados dentro de su propio caso** (no persisten): potencial `Test-CLT-DEL-181449` (Clientes), pedido B (Pedidos DM-PED-037), inventario Lote LOTE-DEL-28 (Inventarios DM-INV-028), cobro retención A*026279 (Cobros DM-COB-026), visita B + visita C (Visitas DM-VIS-006/descarte).

## N/A y SKIP — motivos (todos por dato o defecto conocido, ninguno estructural nuevo)

| Módulo | Casos | Motivo |
|--------|-------|--------|
| Clientes | DM-CLT-013 (N/A) | Cartera alcanzable en el módulo (emp 1) sin documentos de venta |
| Cobros | DM-COB-006 (N/A) | `requiredComment=false` (estructural) |
| Cobros | DM-COB-036/044/045 (N/A) | IGTF por DATO: clientes accesibles solo con docs tipo A/FACT, ningún doc tipo IGTF elegible hoy |
| Cobros | DM-COB-037 (N/A) | 25% IVA: selector "No hay clientes disponibles" (`cliente_25iva` sigue null) |
| Devoluciones | 10 casos (N/A) | Sin facturas devolvibles bajo el nuevo set (verificado en las 3 empresas); `validateReturn=true` exige factura |
| Depósitos | DM-DEP-006/009/017 (N/A) | Sin cobro Efectivo **enviado** (con `idCollection`) → nada depositable |
| Depósitos | DM-DEP-010/014/018/019/020 (SKIP) | Defecto conocido `deposit.service.ts` (lista BUSCAR no renderiza) — **reprodujo** esta corrida (intermitente) |
| Visitas | DM-VIS-025/026 (N/A) | RUTA DE HOY sin visitas sincronizadas del backend hoy |
| Productos | DM-PRD-002 (N/A) | Tipo de estructura único (LINEA) — estructural |
| Vendedores | DM-VND-002 (N/A) | KPIs vacíos (API sin métricas) — igual a globalmp/don-theo |

## Observaciones generales

1. **H1 — No-persistencia / cola de salida (transversal, esta corrida):** 4 de 5 transacciones enviadas (pedido, cobro, inventario, visita) quedaron **"Por Enviar"** en UI y no viraron a "Enviado" en la ventana de observación. El cliente potencial mostró "Enviado" (Ref 1), pero **sin cotejo BD no se confirma persistencia en nube** en ningún caso. Efecto aguas-abajo: el cobro Efectivo no adquirió `idCollection` → **no fue depositable** (bloqueó el end-to-end de Depósitos). Recomendación: **re-correr con cotejo BD** para determinar si es cola El Yaque sin drenar (conectividad/sync) o los endpoints `order`/`collection`/`potentialclient`.

2. **Depósitos DM-DEP-010/018 — defecto conocido intermitente:** reprodujo esta corrida (loader "Por favor espere…" colgado); la corrida matutina `20260706_100801` NO lo reprodujo. Confirma naturaleza intermitente del bug de `deposit.service.ts`.

3. **Divergencia UI-vs-config `suggestedOrderByDispatchAndReturn`:** CSV dev = false, pero la UI muestra "Pedido Sugerido" activo/funcional en Inventarios. Re-confirmada. **Verificar con desarrollo** (no cambiar la VG a ciegas).

4. **Round-trips §9 (UI→UI) sólidos:** Pedidos-035, Cobros 041/042 (retención neta persiste, el FAIL histórico "vuelve al bruto" NO reprodujo), 046 (pago parcial), 047/039 (recálculo fecha-tasa), Inventarios y Visitas — todos conservan valores 1:1 al reabrir. Sin regresiones de persistencia local.

## Cambios del nuevo set de datos (a promover al YAML — Agente 11)

- **Nombres de empresa reales:** idEnterprise 1/2/3 = "INV JEREZ MOTORS **VALERA** / **CARACAS** / **TURMEREMO**" (antes "INVERSIONES JEREZ 1/2/3"). Consistente en Clientes, Devoluciones, Productos y Vendedores.
- **Almacén Productos:** "Ferreteria **UNIFICADO** VALERA 2 Valera" (antes "Ferreteria VALERA 2 Valera").
- **Listas de precio:** Precio 1 = idList 1 (coList 01); Precio 3 = idList **2** (coList "02").
- **Inventario PLAN-001:** ~398 (antes ~450).
- **Cartera Clientes emp 1:** sin cambios (mismos 3 clientes, saldo 0,00).
- **Devoluciones:** el form tiene selector de empresa alcanzable vía `value+ionChange` (recarga cartera del modal cliente) — sin limpiar caché.

## Memoria: patrones promovidos (Agente 11 — consolidación)

| Patrón | Módulo | Destino |
|--------|--------|---------|
| Nombres reales empresa VALERA/CARACAS/TURMEREMO (idEnterprise 1/2/3) | Clientes/Dev/Prod/Vnd/Dep | jerez.yaml (inline) |
| Gateway empresa recarga clientes SIN limpiar caché (obsoleta nota BLOCKED) | Cobros | cobros.md + YAML |
| Retención detalle: fijar `.value` del ion-input Nro Comp Ret | Cobros | cobros.md + YAML |
| IGTF 036/044/045 y 25%IVA 037 = N/A por DATO (no estructural) | Cobros | cobros.md + YAML |
| Selector empresa dentro del form recarga cartera vía value+ionChange | Devoluciones | devoluciones.md |
| Sin facturas devolvibles bajo nuevo set (10 N/A por dato) | Devoluciones | jerez.yaml |
| DM-DEP-010/018 reprodujo (bug intermitente) + cobro no-enviado no depositable | Depósitos | depositos.md + YAML |
| Almacén "Ferreteria UNIFICADO VALERA 2"; Precio 3 = idList 2 | Productos | jerez.yaml |
| Back = PRIMER `img.fechaAtras`; inventario PLAN-001 ~398 | Visitas/Inv | module-selectors + YAML |
| H1: 4/5 transacciones "Por Enviar" sin confirmar nube → re-correr con BD | Transversal | ultima_corrida.pendientes |

**Archivos actualizados:** `jerez.yaml` + 10 `module-selectors/*.md`; 10/10 reportes sellados `> ✅ consolidado 2026-07-06`; `defectos_abiertos` intacto (`[]`); sin git commit/push. **Revisar el `git diff` antes de commitear.**

## Reportes individuales

- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md) · [Cobros](cobros.md) · [Devoluciones](devoluciones.md)
- [Inventarios](inventarios.md) · [Depósitos](depositos.md) · [Visitas](visitas.md) · [Productos](productos.md) · [Vendedores](vendedores.md)
- Ledger machine-readable: `_results.jsonl` (137 líneas)

---
*Generado por Claude Code · Orquestador Smoke · 2026-07-06*
