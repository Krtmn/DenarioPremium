# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android USB · Playwright MCP + CDP · Cliente: LATINO COSMETICA
### 🔬 1ª corrida automatizada (alta de cliente) + LÍNEA BASE Ola 0 (piloto optimización)

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-07-14 |
| **RUN_ID** | `20260714_130727_smoke-completo` |
| **Cliente** | latino_cosmetica — **LATINOCOSMETICA C.A.** (idEnterprise=1) — 1ª corrida |
| **Playa / Servidor** | **La Tortuga** `denariolatortuga.ddns.net:8081` (mismo host que hidroponias) |
| **Dispositivo** | `14678405BR003855` (Infinix X6728, Android 15) |
| **App** | `com.kiberno.denarioPremiumPro` · Chrome/149 WebView · window.ng=TRUE |
| **Credenciales** | `***`/`***` (usuario **001**, vendedor) |
| **Resultado global** | **127 PASS · 0 FAIL · 0 SKIP · 8 N/A · 2 BLOCKED** de 137 casos |

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP | N/A | BLK | Estado |
|--------|-------|------|------|------|-----|-----|--------|
| Login | 6 | 6 | 0 | 0 | 0 | 0 | ✅ |
| Clientes | 12 | 12 | 0 | 0 | 0 | 0 | ✅ |
| Pedidos | 14 | 14 | 0 | 0 | 0 | 0 | ✅ |
| Cobros | 34 | 28 | 0 | 0 | 4 | 2 | ✅ |
| Devoluciones | 14 | 14 | 0 | 0 | 0 | 0 | ✅ |
| Inventarios | 16 | 16 | 0 | 0 | 0 | 0 | ✅ |
| Depósitos | 12 | 12 | 0 | 0 | 0 | 0 | ✅ |
| Visitas | 16 | 14 | 0 | 0 | 2 | 0 | ✅ |
| Productos | 10 | 9 | 0 | 0 | 1 | 0 | ✅ |
| Vendedores | 3 | 2 | 0 | 0 | 1 | 0 | ✅ |
| **TOTAL** | **137** | **127** | **0** | **0** | **8** | **2** | ✅ |

## FAIL críticos (S1/S2)

**Ninguno. 0 defectos de aplicación** en la 1ª corrida de LATINO COSMETICA.

## N/A (estructurales por VG o condición de dato)

| Módulo | Casos N/A | Motivo |
|--------|-----------|--------|
| Cobros | DM-COB-036, 037, 044, 045 | Sin documento IGTF sincronizado en device (userCanSelectIGTF=true pero ruta sin doc IGTF) · userCanCollectIva=false (037) |
| Visitas | DM-VIS-025, 026 | RUTA DE HOY vacía — sin visitas "No Visitado" sincronizadas desde backend |
| Productos | DM-PRD-013 | Lista de precio única ("DETAL") → sin lista alterna (userCanChangePriceList=false) |
| Vendedores | DM-VND-002 | `ion-grid` de KPIs vacío (API sin métricas para el vendedor) — no FAIL (patrón globalmp/don-theo/jerez) |

## BLOCKED (limitación de automatización, NO defecto de app)

| Módulo | Casos | Motivo |
|--------|-------|--------|
| Cobros | DM-COB-041, 042 | **Retención = variante `dynamicRetentions`** (selector "Seleccione Retención" IMPM/ISLR/IVA + Nro/Fecha Comprobante) — distinta al patrón fijo documentado en los helpers. La estructura existe (retencion=true); requiere un nuevo patrón de selector. Candidato a `module-selectors/cobros.md`. |

## Registros enviados al sistema (persisten en nube)

| Módulo | Ref / Nro | Detalle | Estado |
|--------|-----------|---------|--------|
| Clientes | id_client=9 | Potencial `Test-CLT-SMOKE-131916` (Empresa LATINOCOSMETICA C.A.) | Enviado |
| Pedidos | id_order=34 | ANNELI CA (13) · BELOTTI ACOND CEBOLLA ×2 · $12,14 | Enviado |
| Cobros | id_collection=24 | CABELLO COSMETICOS CA (37) · doc 1820 · Efectivo · BSD 1.034.714,62 | Enviado |
| Devoluciones | id_return=7 | CABELLO COSMETICOS · factura 1820 · PT004 TRATAMIENTO CENIZO ×1 | Enviada |
| Inventarios | id_client_stock=7 | ANNELI CA · BELOTTI 3058 ×5 | Enviado |
| Depósitos | id_deposit=3 | BANCO MERCANTIL (004) · vínculo cobro 24 · BSD 1.034.714,62 | Enviado |
| Visitas | id_visit=100 | ANNELI CA · MERCHANDISING/VISIBILIDAD PDV | Enviada |

**Pendientes de envío manual (Guardados, requieren adjunto):**
- Cobro Retención doc 1820 (DM-COB-029) — BD-SAVED
- Cobro pago-parcial BSD 500.000,00 (DM-COB-046) — BD-SAVED

## Verificación BD (payload ↔ nube · "lo guardado se envía")

| Módulo | Registro | Marca BD |
|--------|----------|----------|
| Clientes | potencial (co 1784049524213) | **BD-FIELD-OK** 17/17 |
| Pedidos | order (co 1784050255709) | **BD-FIELD-OK** 12/12 + order_detail 1/1 + unit 1/1 |
| Cobros | id_collection=24 | **BD-FIELD-OK** 5/5 + 1 doc + 1 pago (co_type=0) |
| Devoluciones | return (co 1784054258852) | **BD-FIELD-OK** 11 + return_detail 1/1 (ver nota calibración) |
| Inventarios | client_stock (co 1784056647963) | **BD-OK** (registro íntegro en nube; motor dio N/A por payload plano) |
| Depósitos | id_deposit=3 | **BD-FIELD-OK** 13/13 (config depósitos validada) |
| Visitas | id_visit=100 | **BD-OK** (cotejo inline; campo-a-campo confirmado) |

**Cero mismatches reales.** Notas: (a) zona horaria (local UTC-4 ↔ nube UTC) en varios timestamps, veredicto por día = igual; (b) calibración `cotejo-payload.js` pendiente en **devoluciones** (envelope `details` vs `returns`) e **inventarios** (payload plano vs anidado `clientStock`); depósitos y cobros-normal ya calibrados.

## Observaciones generales / hallazgos de configuración

1. **Servidor La Tortuga** (`denariolatortuga.ddns.net:8081`), **window.ng=TRUE**, **sync a nube INMEDIATA y persistente** (contrasta con la no-persistencia de jerez El Yaque). Los 7 transaccionales llegaron a la nube.
2. **Conflicto de dumps resuelto en UI (2022 vs global reciente):** `multiCurrency=TRUE` (BS+USD confirmado), `retencion=TRUE` (variante dynamicRetentions), `userCanSelectIGTF=TRUE`, `clientStock=TRUE` — **todos los valores del global reciente eran los reales**; los overrides 2022 del `global_configuration_client` estaban obsoletos. Regla "gana el da_update más reciente" validada.
3. **Empresa única:** LATINOCOSMETICA C.A. (idEnterprise=1); `enterpriseEnabled=true` aplica en todos los módulos MENOS Pedidos (`orderEnterpriseEnabled=false`, confirmado).
4. **Sync PARCIAL por vendedor 001:** la BD nube tiene todos los clientes, pero el device solo sincroniza el subconjunto del vendedor. Mis candidatos de BD (LOOKS 4 / MUNDO MAYOR / BENAMOR) **NO estaban sincronizados**; clientes reales usados: **ANNELI CA (13)** y **CABELLO COSMETICOS CA (37, con documentos)**. Los agentes deben DESCUBRIR en UI, no fiarse del código BD.
5. **Retención = `dynamicRetentions`** (nuevo patrón de UI): selector de tipo de retención (IMPM/ISLR/IVA) + Nro y Fecha de comprobante, distinto al detalle-de-documento fijo. Causó los 2 BLOCKED; necesita helper/selector nuevo.
6. **Mock de cámara NO funciona por `window.Capacitor`** (el build usa el módulo webpack `@capacitor/camera`); workaround validado: empujar Foto a `adjuntoService.fotos` + disparar `checkCarousel`/`onAttachmentChanged` → el cobro con adjunto obligatorio se ENVIÓ de verdad.
7. **App crasheó durante el POST de envío del cobro** (como dm-electronica); el cobro llegó igual a la nube. Se recuperó con re-`adb forward` al PID vivo. Riesgo de estabilidad a reportar a desarrollo.
8. **Firma:** `signatureVisit`/`signatureReturn`/`signatureStock`/`signatureClient`=true pero **el Envío procede sin firma** en visitas/devoluciones/inventarios/clientes (defecto conocido, igual piercar) — documentado, no FAIL.
9. **Depositable propaga de vuelta al device** en La Tortuga (el cobro Efectivo Ref 24 apareció depositable en la misma corrida) — contrasta con dm-electronica.

---

## 📊 LÍNEA BASE Ola 0 (piloto de optimización — instrumentación real del harness)

> Métricas capturadas por el harness (precisas), no estimadas. Es la referencia contra la que se medirá el ahorro del **replay determinista** (ver `PROPUESTA-ARQUITECTURA-OPTIMIZACION.md`).

| Módulo | Modelo | Casos | tool-uses | ms | min | tokens |
|--------|--------|-------|-----------|-----|-----|--------|
| Login | sonnet | 6 | 21 | 209.634 | 3,5 | 80.670 |
| Clientes | opus | 12 | 45 | 778.431 | 13,0 | 115.930 |
| Pedidos | opus | 14 | 56 | 789.334 | 13,2 | 132.455 |
| **Cobros** | opus | 34 | **127** | **2.887.087** | **48,1** | **356.989** |
| Devoluciones | opus | 14 | 158 | 2.101.493 | 35,0 | 244.916 |
| Inventarios | opus | 16 | 58 | 1.228.523 | 20,5 | 169.376 |
| Depósitos | opus | 12 | 44 | 1.815.197 | 30,3 | 174.067 |
| Visitas | opus | 16 | 52 | 1.371.429 | 22,9 | 148.568 |
| Productos | sonnet | 10 | 27 | 294.564 | 4,9 | 101.050 |
| Vendedores | sonnet | 3 | 26 | 187.358 | 3,1 | 89.712 |
| **TOTAL UI** | — | **137** | **614** | **11.663.050** | **~194 min (3,24 h)** | **1.613.733** |
| + Cotejo BD (7 agentes, haiku, en PARALELO) | haiku | — | ~55 | (no suma wall-clock) | — | ~254.000 |
| **TOTAL corrida** | — | **137** | **~669** | **~3,24 h wall-clock** | — | **~1,87 M tokens** |

**Lecturas clave para la propuesta:**
- **El módulo pesado (Cobros) = 48 min y 127 tool-uses él solo** → confirma la tesis: el tiempo está en el nº de turnos del modelo, no en la app. Es el candidato #1 a compilar a replay determinista.
- Total ~3,24 h / ~1,87 M tokens / 614 tool-uses UI para 137 casos → **coincide con la estimación de la propuesta (~3 h, ~1-3 M tokens)**, ahora MEDIDA.
- **Model tiering funcionó:** los 3 módulos no-transaccionales (Login/Productos/Vendedores) en Sonnet costaron ~271k tokens / ~11 min combinados; los cotejos BD en Haiku (~254k tokens) corrieron en paralelo sin sumar wall-clock. Dato para decidir el tiering definitivo (Ola 4).
- Meta post-replay (Fase 2 de la propuesta): estos ~194 min → **~45-70 min** en el mismo dispositivo.

## Memoria: patrones promovidos (Agente 11 — consolidación)

48 patrones inventariados (10 módulos) · promovidos/reconfirmados en 10 `module-selectors/*` con tag `[latino_cosmetica-20260714]` · **perfil YAML reescrito** (TBD/⚠️VERIFICAR → CONFIRMADO) · 0 graduados a RUNTIME/helpers (**2 marcados ⚙ candidato a helper**).

| Patrón clave | Módulo | Destino |
|--------------|--------|---------|
| Retención `dynamicRetentions` (selector IMPM/ISLR/IVA + Nro/Fecha comprobante) | cobros | `cobros.md` ⚙ candidato a helper |
| Adjunto por fabricación de Foto en `adjuntoService` (mock `window.Capacitor` falla en build webpack) | cobros | `cobros.md` ⚙ candidato a helper |
| App crashea en POST de cobro + recuperación re-`adb forward` (2ª corrida: dm-electronica+latino) | transversal | `_comunes.md` |
| `window.ng=TRUE` en La Tortuga v6.6.18 | transversal | `_comunes.md` |
| Selección cliente/factura vía Angular `selectorCliente`/`selectorInvoice` (modales no-clicables) | devoluciones | `devoluciones.md` |
| Estructura productos Marca/Categoria (no Línea) · lista única DETAL | productos | YAML + `productos.md` |
| Sync parcial por vendedor 001: descubrir cliente en UI (ANNELI CA 13 / CABELLO COSMETICOS 37) | varios | YAML `modules.*` |

Archivos modificados: `automation/clientes/latino_cosmetica.yaml` + 10 `module-selectors/*.md` + 10 reportes sellados `> ✅ consolidado 20260714`. `defectos_abiertos=[]` (0 FAIL).
*(Revisar el `git diff` de `module-selectors/` y del YAML antes de commitear — no se hizo git.)*

## Reportes individuales

- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md)
- [Cobros](cobros.md) · [Devoluciones](devoluciones.md) · [Inventarios](inventarios.md)
- [Depósitos](depositos.md) · [Visitas](visitas.md) · [Productos](productos.md)
- [Vendedores](vendedores.md)

---
*Generado por Claude Code · Orquestador Smoke · 2026-07-14 · 1ª corrida LATINO COSMETICA + baseline Ola 0*
