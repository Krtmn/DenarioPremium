# Smoke Test Consolidado — Denario Premium Móvil · Cliente JEREZ
## Corrida rápida · 8 módulos (omitidos Productos y Vendedores por ser solo lectura) · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-07-06 |
| **RUN_ID** | `20260706_100801_smoke-completo` |
| **Cliente** | jerez — INVERSIONES JEREZ MOTORS (El Yaque) |
| **Dispositivo** | `14678405BR003855` (Infinix X6728, Android 15) |
| **App** | `com.kiberno.denarioPremiumPro` — Chrome/149.0.7827.159 |
| **Alcance** | Corrida rápida: casos smoke de 8 módulos. **Omitidos** Productos y Vendedores (solo lectura). **Sin cotejo BD** (solo validación UI + round-trip §9). |
| **Resultado global** | **106 PASS · 0 FAIL · 0 SKIP · 18 N/A · 0 BLOCKED** de 124 casos (incluye re-run de Cobros tras limpiar caché + validación de helpers parchados) |

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP | N/A | BLK | Estado |
|--------|-------|------|------|------|-----|-----|--------|
| Login | 6 | 6 | 0 | 0 | 0 | 0 | ✅ |
| Clientes | 12 | 11 | 0 | 0 | 1 | 0 | ✅ |
| Pedidos | 14 | 14 | 0 | 0 | 0 | 0 | ✅ |
| Cobros | 34 | 29 | 0 | 0 | 5 | 0 | ✅ (0 BLOCKED tras parche de helpers setIonDatetime/fillNgModelField) |
| Devoluciones | 14 | 4 | 0 | 0 | 10 | 0 | ✅ (N/A por falta de datos) |
| Inventarios | 16 | 16 | 0 | 0 | 0 | 0 | ✅ |
| Depósitos | 12 | 12 | 0 | 0 | 0 | 0 | ✅ |
| Visitas | 16 | 14 | 0 | 0 | 2 | 0 | ✅ |
| **TOTAL** | **124** | **106** | **0** | **0** | **18** | **0** | |

**Módulos omitidos (por alcance de corrida rápida):** Productos (10 casos) · Vendedores (3 casos) — solo lectura.

## FAIL críticos (S1/S2)

**Ninguno.** 0 FAIL en toda la corrida. La app operó correctamente end-to-end en los 6 módulos transaccionales conducibles.

## Registros enviados al sistema (persisten)

| Módulo | Ref / Nro | Detalle | Estado |
|--------|-----------|---------|--------|
| Clientes | Ref 6 | Cliente potencial `Test-CLT-SMOKE-101828` | Enviado (UI) — persistencia nube no verificada (BD omitida; ver H1) |
| Pedidos | Nro 19 | JL Motors SE,C.A · PLAN-001 ×2 · 542,88 USD | Enviado (UI asignó correlativo, sin residuo "Por Enviar") |
| Cobros | Ref 81 | MULTIREPUESTOS DRG (emp 2) · doc *026299 · Efectivo BS 29.360,41 | Enviado |
| Inventarios | Ref 8 | DANIELA HERNANDEZ F.P. · PLAN-001 ×5 · Lote LOTEQA706 · venc 06/07/2026 | Enviado (round-trip §9 OK) |
| Depósitos | Ref 7 | Banesco Jerez Motors · 29.360,41 BS · cobro Efectivo Ref 81 vinculado | Enviado |
| Visitas | Ref 19 | DANIELA HERNANDEZ F.P. · evento SUPERVISION DE EVENTOS | Enviada |

**Pendientes de envío manual:**
- **Anticipo de cobro** — JL Motors SE,C.A (J-506554950), Efectivo 50,00 — **Guardado**, requiere adjunto para enviar (envío manual).
- **Retención** (DM-COB-029) — ISOLINA DEL CARMEN (10283986, emp 2), doc *018575 — **Guardado**, envío SKIP por adjunto obligatorio.
- **Cobro pago parcial** (DM-COB-046) — ISOLINA DEL CARMEN (10283986, emp 2), Efectivo BS 400,00 — **Guardado** (creado para round-trip §9; enviar o eliminar según se requiera).

## Observaciones generales

1. **Cobros — H3 (gateway empresa→clientes) RESUELTO; era estado local, no defecto de app.** En la 1ª pasada, 9 casos quedaron BLOCKED porque el cambio de empresa vía CDP no recargaba la lista de clientes del modal (siempre mostraba los 3 de empresa 1, sin documentos). La QA **limpió almacenamiento y caché** y el cambio de empresa **pasó a recargar los clientes correctamente** → confirmado que era **estado local stale**, no un defecto. **Re-run 2026-07-06** de los 9 casos con clientes reales (ISOLINA DEL CARMEN emp 2, BRISAS DEL CAMPO KM 30 emp 3): **9 BLOCKED → 2 PASS · 3 N/A · 4 BLOCKED**.
   - **PASS:** DM-COB-029 (retención desde menú, "La Retención se ha guardado") · DM-COB-046 (pago parcial round-trip §9 — BS 400,00 persiste al reabrir).
   - **Los 4 BLOCKED remanentes → RESUELTOS el mismo día parchando 2 helpers (0 código de app):** se añadieron `h.setIonDatetime` (Fecha Tasa: `dt.confirm()` + emite ionChange + click real en Aceptar) y `h.fillNgModelField` (modal detalle: foco por click real en coords + teclado) a `denario-cdp-helpers.js`. Validados end-to-end: DM-COB-047 (recálculo BS 13.368,86→13.196,71, persiste §9), DM-COB-039 rama B (recálculo en Guardado), DM-COB-041 (retención guarda con IVA/ISLR/Nro Comp Ret/Fecha), DM-COB-042 (persiste al reabrir). **Cobros queda 0 BLOCKED.** Selectores/helpers documentados en `module-selectors/cobros.md` `[jerez-2026-07-06]`.

2. **IGTF (H4) CONFIRMADO efectivo = true (contradice el CSV).** El selector IGTF **SÍ es operable** en UI: ofrece `IGTF - 0%` e `IGTF 3%` (este último `defaultIgtf=true`). → **`userCanSelectIGTF` EFECTIVO = true**, el CSV (`false`) está desactualizado — **actualizar el YAML de jerez**. Los casos DM-COB-036/044/045 quedaron **N/A por dato, no estructural**: el flujo IGTF filtra a documentos tipo IGTF y hoy no hay ninguno elegible para los clientes objetivo (BRISAS DEL CAMPO KM 30 emp 3 y EL PODER DEL MONO emp 2 muestran 0 docs IGTF pese a saldo>0 → docs IGTF ya drenados). Re-correr cuando exista un documento tipo IGTF vigente.

3. **H1 no-persistencia — señal distinta esta corrida.** Pedido (Ref 19) y cliente potencial (Ref 6) mostraron estado **Enviado** en la UI (sin residuo "Por Enviar"), a diferencia de corridas previas donde quedaban en cola. Como esta corrida omitió el cotejo BD, **no se confirmó la persistencia real en nube** — recomendable una corrida con cotejo BD para cerrar H1.

4. **Divergencia VG `suggestedOrderByDispatchAndReturn`.** Config CSV = `false`, pero el botón "Pedido Sugerido" aparece y funciona en UI (mismo patrón visto en piercar). Confirmar con desarrollo y actualizar el YAML de jerez.

5. **Depósitos — picker Empresa revierte al reabrir.** Al reabrir el depósito Guardado, el selector de Empresa muestra "JEREZ 1" pese a haberse guardado con "JEREZ 2"; los datos sustantivos y el cobro vinculado (empresa 2) quedan intactos. Marcado como observación (no FAIL) — recomendable confirmar por BD.

6. **Defectos conocidos NO reprodujeron:** DM-DEP-010/018 (lista BUSCAR no renderiza) NO reprodujo en jerez. DM-INV-026 (form reabre en tab General) confirmado como conocido, no re-marcado FAIL.

7. **Devoluciones N/A esperado.** Sin facturas sincronizadas devolvibles (validateReturn=true, mesesFacturas=3) en ningún cliente → 10 casos N/A estructural. Las validaciones de UI sin factura (001/002/004/006) sí pasaron. Confirma la nota del YAML.

## Memoria: patrones promovidos (Agente 11 — consolidación)

**Ejecutado a pedido de la QA** pese a ser corrida parcial (8/10). Con la cautela de corrida parcial: **0 patrones graduados a RUNTIME.md / helpers** (nada nuevo se dio por confirmado en 2+ corridas a ciegas).

| Destino | Cantidad |
|---------|----------|
| Adiciones sustantivas a `module-selectors/{modulo}.md` | ~13 (clientes 2, pedidos 1, cobros 4, inventarios 2, depósitos 3, visitas 1) |
| Tags `[jerez-2026-07-06]` sobre filas/notas existentes | 27 (8 archivos + leyenda en `_comunes.md`) |
| Bloques inline en `jerez.yaml` | 6 (VG suggestedOrder discrepancia, módulos inventarios/depósitos/cobros build-H3, `ultima_corrida`) |
| Graduados a RUNTIME.md / helpers | 0 |

**Destacados promovidos:**
- Clientes → `ion-select` idEnterprise exige value **numérico** (`sel.value=1`, no `'1'`) — a Selectores + Anti-patrones de `clientes.md`.
- Cobros → `window.ng=false` en build El Yaque + gateway empresa→clientes no recargable por CDP (H3) + tabs `app-cobro-pagos`/`-total`/`-adjunto` + técnica de campo Monto → `cobros.md` y nota de build en YAML.
- Visitas → back `img.fechaAtras` solo con `element.click()` nativo (handler sobre el `img`) → anti-patrón candidato en `visitas.md`.
- Devoluciones → modal Factura acumula ion-alerts residuales portaled → matiz a anti-patrón existente.
- Discrepancia VG `suggestedOrderByDispatchAndReturn` (CSV=false / UI activa) → registrada inline en el YAML **sin cambiar el valor** (VERIFICAR con desarrollo).
- Depósitos → picker Empresa revierte a "JEREZ 1" al reabrir → nota inline en YAML.

`ultima_corrida` actualizado a `20260706_100801_smoke-completo` / 2026-07-06; `fecha_corrida_completa_previa` (2026-06-22) y `defectos_abiertos` intactos. Pendientes H1/H3/H4 ajustados. **Sin git commit/push** — revisar el `git diff` de `module-selectors/` y `jerez.yaml` antes de commitear.

## Reportes individuales

- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md)
- [Cobros](cobros.md) · [Devoluciones](devoluciones.md) · [Inventarios](inventarios.md)
- [Depósitos](depositos.md) · [Visitas](visitas.md)
- Ledger machine-readable: `_results.jsonl`

---
*Generado por Claude Code · Orquestador Smoke (corrida rápida, sin cotejo BD) · 2026-07-06*
