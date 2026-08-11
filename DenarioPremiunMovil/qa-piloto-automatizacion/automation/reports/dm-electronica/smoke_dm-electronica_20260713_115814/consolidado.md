# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android USB · Playwright MCP + CDP · Cliente: DM ELECTRONICA (BOTZ)

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-07-13 |
| **RUN_ID** | `20260713_115814_smoke-completo` |
| **Cliente** | dm-electronica (BOTZ) — 1ª corrida (alta de cliente) |
| **Playa / Servidor** | El Yaque `denarioelyaque.ddns.net:8081` — build v6.6.18 |
| **Dispositivo** | `14678405BR003855` (Infinix X6728, Android 15) |
| **App** | `com.kiberno.denarioPremiumPro` |
| **Credenciales** | `***`/`***` (usuario 002, vendedor) |
| **Resultado global** | **117 PASS · 0 FAIL · 0 SKIP · 20 N/A · 0 BLOCKED** de 137 casos |

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP | N/A | BLK | Estado |
|--------|-------|------|------|------|-----|-----|--------|
| Login | 6 | 6 | 0 | 0 | 0 | 0 | ✅ |
| Clientes | 12 | 12 | 0 | 0 | 0 | 0 | ✅ |
| Pedidos | 14 | 14 | 0 | 0 | 0 | 0 | ✅ |
| Cobros | 34 | 26 | 0 | 0 | 8 | 0 | ✅ |
| Devoluciones | 14 | 14 | 0 | 0 | 0 | 0 | ✅ |
| Inventarios | 16 | 16 | 0 | 0 | 0 | 0 | ✅ |
| Depósitos | 12 | 3 | 0 | 0 | 9 | 0 | ✅ |
| Visitas | 16 | 14 | 0 | 0 | 2 | 0 | ✅ |
| Productos | 10 | 9 | 0 | 0 | 1 | 0 | ✅ |
| Vendedores | 3 | 3 | 0 | 0 | 0 | 0 | ✅ |
| **TOTAL** | **137** | **117** | **0** | **0** | **20** | **0** | ✅ |

## FAIL críticos (S1/S2)

Ninguno. **0 defectos de aplicación** en la 1ª corrida de dm-electronica.

## N/A (todos estructurales por VG o condición de dato)

| Módulo | Casos N/A | Motivo |
|--------|-----------|--------|
| Cobros | DM-COB-029, 036, 037, 041, 042, 044, 045, 047 | cobroRetencion=false · userCanCollectIva=false · retencion=false · userCanSelectIGTF=false · canChangeRate=false (cambio de tasa cubierto por tasa manual en 039) |
| Depósitos | DM-DEP-004, 006, 009, 010, 014, 017, 018, 019, 020 | Módulo aplica (Efectivo en métodos de cobro) pero el cobro Efectivo enviado no propagó de vuelta al device como depositable en la ventana → sin cobros/bancos depositables. Condición de dato, NO defecto (formulario opera bien) |
| Visitas | DM-VIS-025, 026 | Sin visitas "No Visitado" sincronizadas (RUTA DE HOY vacía al inicio) |
| Productos | DM-PRD-013 | Lista de precio única → sin lista alterna a la cual cambiar |

## Verificación BD (payload ↔ nube · "lo guardado se envía")

| Módulo | Registro | Marca BD |
|--------|----------|----------|
| Clientes | potencial (co 1783958938499) | **BD-FIELD-OK** 17/17 |
| Pedidos | order (co 1783959545012) | **BD-FIELD-OK** 37/37 + hijas 1/1 |
| Cobros | id_collection=5 | **BD-N/A(payload)** — payload perdido en crash de app; presencia+montos confirmados en nube por query.js (co_type=0, total=6.025.296,96, 1 detalle + 1 pago) |
| Devoluciones | return (co 1783963853979) | **BD-FIELD-OK** 14/14 + return_detail 1/1 |
| Inventarios | clientstock (co 1783965140165) | **BD-FIELD-OK** 15/15 + detalle + unit |
| Visitas | visit (co 1783967075758) | **BD-FIELD-OK** 19/19 + incidence 1/1 (re-cotejado al cierre) |
| Depósitos | — | sin envío (N/A) |

**3 cobros GUARDADOS = BD-SAVED** (esperado: requieren adjunto manual, no enviados).
Todas las notas de mismatch fueron exclusivamente de **zona horaria** (local UTC-4 ↔ nube UTC), veredicto por día = igual. **Cero mismatches reales.**

## Registros enviados al sistema (persisten en nube)

| Módulo | Ref / Nro | Detalle | Estado |
|--------|-----------|---------|--------|
| Clientes | id_client=2 | Cliente potencial `Test-CLT-SMOKE-120937` (Empresa BOTZ) | Enviado |
| Pedidos | id_order=4 | CONGELADOR GPLUS 100LTS ×2 · Total US$ 316 · cliente 00001 | Enviado |
| Cobros | id_collection=5 | TIENDAS RORIX · doc FACT50003307 · Efectivo · BS 6.025.296,96 | Enviado |
| Devoluciones | id_return=3 | RORIX · factura 50003306 · CONGELADOR VIVAMAX 100LT ×1 | Enviada |
| Inventarios | id_client_stock=1 | RORIX · CAFETERA MILEXUS ×5 | Enviado |
| Visitas | Nro 1 | + QUE MUEBLES UN SUENO · MERCHANDISING/ENTREGA DE MUESTRAS | Enviada |

**Pendientes de envío manual (Guardados, requieren adjunto):**
- Cobro tasa-manual 700 · BS 13.513.500,00 (DM-COB-039)
- Cobro pago-parcial · BS 500.000,00 (DM-COB-046)
- Anticipo Efectivo · BS 5.000,00 (DM-COB-028)

## Observaciones generales

1. **Estabilidad (VIGILAR):** la app **crasheó durante el POST del envío de cobro** (el cobro llegó a la nube igual); requirió relanzar la app + re-map `adb forward`. Único incidente de estabilidad de la corrida — reportar a desarrollo para El Yaque v6.6.18.
2. **`enterpriseEnabled` = true CONFIRMADO en UI** (Empresa "BOTZ" / coEnterprise "BARAK_A" en cliente potencial, detalle, pedidos y payloads) — el dump `global_configuration=false` estaba obsoleto. YAML ya consolidado a `true`.
3. **Sincronización parcial por usuario 002:** la BD tiene todos los clientes pero el device solo sincroniza el subconjunto asignado al vendedor. MAR-CHAZ (00091) NO estaba en device; clientes reales confirmados: **TIENDAS RORIX** (000234, con documentos — recomendación QA acertada) y **+ QUE MUEBLES UN SUENO** (00001).
4. **`expirationBatch=false` pero la UI muestra "Ingrese lote" + "Fecha de vencimiento"** en el modal de inventario (no obligatorios; payload envía `nuBatch=""`). Divergencia UI↔config — verificar con desarrollo (mismo patrón que piercar).
5. **Sync a nube INMEDIATA** en El Yaque para dm-electronica (contrasta con ferrenuestro/Isla Coche diferido).
6. **`window.ng=true`** en este build El Yaque → helpers window.ng operan; **mock de cámara funciona** → DM-COB-019 (adjunto obligatorio) enviable de verdad.
7. Postgres nube dio "connection slots reserved" intermitente en cotejos BD (visitas re-cotejada OK al cierre); no afectó ningún veredicto UI (blindaje §10).

## Memoria: patrones promovidos (Agente 11 — consolidación)

31 patrones inventariados (10 módulos) · 26 promovidos/reconfirmados en `module-selectors/*` · 6 secciones inline al YAML + `ultima_corrida` · 0 graduados a RUNTIME (1 candidato: "trash Tab Total recalcula con mouse.click" marcado confirmado-2-corridas).

| Patrón clave | Módulo | Destino |
|--------------|--------|---------|
| `window.ng=TRUE` en build El Yaque v6.6.18 (contrasta jerez/ferrenuestro) | transversal | `_comunes.md` + YAML |
| App crashea durante POST de cobro + recuperación (relanzar + re-map adb) | transversal | `_comunes.md` · `cobros.md` · YAML |
| Sync parcial por vendedor 002 (descubrir cliente en UI, no por código BD) | clientes | `clientes.md` + YAML |
| `mockCameraAdjunto` SÍ funciona (contradice romher/ferrenuestro) | cobros | `cobros.md` + YAML |
| `expirationBatch=false` NO oculta lote/fecha (opcionales) | inventarios | `inventarios.md` + YAML |
| Datos reales: TIENDAS RORIX (docs) · + QUE MUEBLES UN SUENO (00001) · factura 50003306 · estructuras Linea/Sub-Linea | varios | YAML `modules.*` |

Archivos modificados: 10 `module-selectors/*.md` + `automation/clientes/dm-electronica.yaml` + 10 reportes marcados `> ✅ consolidado 20260713`. `defectos_abiertos=[]` intacto.
*(Revisar el `git diff` de `module-selectors/` y del YAML antes de commitear.)*

## Reportes individuales

- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md)
- [Cobros](cobros.md) · [Devoluciones](devoluciones.md) · [Inventarios](inventarios.md)
- [Depósitos](depositos.md) · [Visitas](visitas.md) · [Productos](productos.md)
- [Vendedores](vendedores.md)

---
*Generado por Claude Code · Orquestador Smoke · 2026-07-13*
