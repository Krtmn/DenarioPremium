# Smoke Test Consolidado — Denario Premium Móvil
## Subset transaccional · jerez · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-06-30 / 2026-07-01 |
| **RUN_ID** | `20260630_181903_smoke-completo` |
| **Cliente / Playa** | jerez · servidor **El Yaque** (`denarioelyaque.ddns.net:8081`) |
| **Dispositivo** | 14678405BR003855 (Infinix X6728, Android 15, WebView Chrome 149) |
| **App** | `com.kiberno.denarioPremiumPro` — v1.0 |
| **Alcance** | **Subset transaccional** (7 módulos con cotejo BD). NO se corrieron login/productos/vendedores (solo lectura). |
| **Resultado global** | 73 PASS · 0 FAIL · 10 N/A · 21 BLOCKED de 104 casos ejecutados |

> **Objetivo de esta corrida (entrega 2026-06-23):** validar que los **Agentes BD en background** completan su cotejo y el **orquestador anexa** su sección al reporte **sin intervención manual** (fix de `.claude/settings.json` + agente BD que DEVUELVE en vez de escribir). **Resultado: ✅ VALIDADO.**

---

## 🎯 Veredicto de validación (lo que se venía a probar)

| Criterio | Resultado |
|---|---|
| Agentes BD en background completan sin auto-denegarse | ✅ **5/5** (clientes, pedidos, inventarios, visitas, depósitos) |
| Orquestador anexa la sección BD al reporte sin intervención manual | ✅ **5/5** secciones anexadas + temporales borrados |
| Consistencia (antes era inconsistente — CAMBIOS-SYNC-20260623) | ✅ estable en las 5 ejecuciones |
| Motor `cotejo-payload.js` campo-por-campo end-to-end | ✅ **3/3 BD-FIELD-OK** (inventarios 31/31, visitas 24/24, depósitos 14/14) |

**Conclusión:** el fix funciona de forma estable. El allowlist evitó las auto-denegaciones de permisos y el patrón "devolver + anexar" conserva el paralelismo BD‖UI sin pasos manuales. Además el oráculo BD ya aportó valor detectando hallazgos reales (ver abajo).

---

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | N/A | BLK | Cotejo BD | Estado |
|--------|-------|------|------|-----|-----|-----------|--------|
| Clientes | 12 | 11 | 0 | 1 | 0 | **BD-SAVED** (no persistió) | ✅ UI / ⚠ BD |
| Pedidos | 14 | 14 | 0 | 0 | 0 | **BD-SAVED** (no persistió) | ✅ UI / ⚠ BD |
| Cobros | 34 | 9 | 0 | 5 | 20 | BD-N/A (0 creados) | ⚠ bloqueado por harness |
| Inventarios | 16 | 14 | 0 | 2 | 0 | **BD-FIELD-OK 31/31** | ✅ |
| Visitas | 16 | 14 | 0 | 2 | 0 | **BD-FIELD-OK 24/24** | ✅ |
| Depósitos | 12 | 11 | 0 | 0 | 1 | **BD-FIELD-OK 14/14** (calibrado) | ✅ |
| Devoluciones | — | — | — | N/A | — | N/A (sin registros) | 🚫 N/A por datos |
| **TOTAL** | **104** | **73** | **0** | **10** | **21** | 3 OK · 2 SAVED · 1 N/A | |

> Devoluciones no se ejecutó (N/A estructural: sin facturas sincronizadas devolvibles + decisión QA). Cobros: 20 BLOCKED son **limitación de automatización** (build refactorizado), NO defectos de app.

---

## Registros enviados al sistema (persisten)

| Módulo | Ref / Nro | Detalle | Estado real | Cotejo BD |
|--------|-----------|---------|-------------|-----------|
| Inventarios | **7** | DANIELA HERNANDEZ F.P. · PLAN-001 · 10 PIEZA · Lote LOTE-QA01 | ✅ Enviado + persistió | BD-FIELD-OK 31/31 |
| Visitas | **18** | DANIELA HERNANDEZ F.P. · EVENTOS/SUPERVISION · "Test-VIS-015-105405" | ✅ Enviada + persistió | BD-FIELD-OK 24/24 |
| Depósitos | **6** | 79.872,58 BS · Banesco Jerez Motors · agrupa cobro 58 (doc *026088) | ✅ Enviado + persistió | BD-FIELD-OK 14/14 |
| Clientes | 0 (pendiente) | Test-CLT-SMOKE-204858 (potencial, emp 1) | ⚠ "Por Enviar" — **NO persistió** | BD-SAVED |
| Pedidos | 0 (pendiente) | Test-PED-SMOKE-210412 · JL Motors · PLAN-001×2 · 542,88 USD | ⚠ "Por Enviar" — **NO persistió** | BD-SAVED |

**Pendientes de envío manual:** ninguno por adjunto (jerez `requiredCollectionAttachments=false`). Los 2 "Por Enviar" (clientes/pedidos) son por no-persistencia, no por acción manual pendiente.

---

## Hallazgos (observaciones — 0 FAIL de app confirmados)

### H1 — Patrón de NO-persistencia módulo-específico (a escalar)
Clientes (`potentialclientservice/potentialclient`) y Pedidos (`orderservice/order`) quedaron **"Por Enviar" / Ref 0 y NO llegaron a la nube** dentro de la ventana de verificación (confirmado por Agente BD: BD-SAVED en ambos, con el DSN leyendo la base correcta de El Yaque). En cambio **Inventarios, Cobros (corrida previa), Visitas y Depósitos SÍ sincronizaron** end-to-end. → El atasco **no es global del dispositivo**, es específico de esos endpoints/módulos. **Recomendación:** revisar la cola de salida / envío de `potentialclient` y `order` en el servidor de El Yaque para jerez.

### H2 — Gap de captura de payload (framework)
El hook `installPayloadCapture` (`nativePromise`) **NO captura** `orderservice/order` ni `collectionservice/collection` (el `AutoSendService` postea vía `CapacitorHttp.request`, fuera del filtro `/post/i`). **SÍ captura** `potentialclient`, `clientstock`, `visit`, `deposit`. → **Recomendación:** ampliar `installPayloadCapture` en `denario-cdp-helpers.js` para interceptar `CapacitorHttp.request` con `options.method:'POST'` → habilitaría cotejo campo-por-campo de pedidos y cobros (hoy solo por fallback query).

### H3 — Cobros: harness CDP obsoleto para el build El Yaque
El módulo de cobros de El Yaque está **fuertemente refactorizado** (nueva tabla de documentos paginada, gate de tabs por `validCollection` Subject, selección de cliente por observable, multi-empresa por `updateClientList`). Los selectores/helpers actuales quedaron obsoletos → **20 casos BLOCKED (automatización, NO defecto de app)**. Los casos de lectura/estructura sí pasaron (9 PASS). **Recomendación:** actualizar el harness (helper de cambio de empresa `updateClientList`+`collection.idEnterprise`, gate `validCollection`, nueva tabla de documentos, `executeSql` para BD local, selección de cliente con reset de `collection.idClient`) o correr cobros **manual** en jerez. Detalle completo en `cobros.md` → "Patrones / selectores nuevos".

### H4 — Discrepancia de VG: IGTF (config vs app)
CSV `global_configuration_jerez.csv` trae `userCanSelectIGTF=false` (→ 036/044/045 marcados N/A), pero en la UI el **tile IGTF está visible** y existen **documentos tipo IGTF en BD** (EL PODER DEL MONO 089129288, Brisas del Campo J-502401776). **Recomendación:** confirmar el valor efectivo de `userCanSelectIGTF` en la web de jerez; si es `true`, esos casos deberían ejecutarse (hay datos).

### H5 — Estabilidad del dispositivo
El device físico se **desconectó de adb tras el envío del depósito** (CDP `:9220` ECONNREFUSED) → DM-DEP-019 BLOCKED (el envío + cotejo ya estaban completos). Además, en la sesión de clientes el `connectCdp` estándar falló y hubo que usar `ws://127.0.0.1:9220/devtools/browser` + header `Host: localhost` (en el resto de sesiones el http estándar funcionó). Candidato a robustecer `h.connectCdp`.

### H6 — Observación de código (NO verificada · NO FAIL)
El agente de depósitos reportó que `deposit.service.ts::saveDeposit()` ejecutaría los `DELETE` sobre `this.database` **antes** de asignarla; si llegara `undefined`, lanzaría y perdería el depósito sin error visible (la navegación natural lo evita). **No se modificó código de producto.** Recomendación: confirmar en `../src/` y reordenar la asignación.

---

## Calibración lograda esta corrida
- **Depósitos:** primer cotejo en vivo → **tipo `deposit` calibrado y validado (BD-FIELD-OK 14/14)**. Ajuste sugerido en `cotejo-payload.js`: sumar `is_edit, is_edit_total, is_save, co_user` al `ignore` de `deposit`. Cierra pendiente de `COTEJO-BD.md §4`.
- **Inventarios / Visitas:** configs **validados en vivo** (BD-FIELD-OK), sin cambios.

## Datos de cliente descubiertos (insumo para el YAML jerez)
- **Cartera con documentos:** empresa 2 = 4 clientes / 16 docs; empresa 3 = 141 clientes / 395 docs. Clientes emp2 con docs: MULTIREPUESTOS DRG (074820707, 6 docs), EL PODER DEL MONO (089129288, 5 docs), ISOLINA DEL CARMEN (10283986, 4 docs), FERRETERIA MUNDIAL (065027207, 1 doc).
- **Mecanismo cambio de empresa (cobros):** el modal de cliente solo muestra la empresa activa (default 1, azul, sin docs); clientes con docs en emp 2/3 (rojo).
- **ion-select idEnterprise:** ahora muestra textos distintos "INVERSIONES JEREZ 1/2/3" (antes idénticos "INVERSIONES JEREZ MO").

---

## Nota de proceso
- **Agente 11 (consolidación de memoria) NO se lanzó:** guarda de completitud — esta fue una corrida **parcial** (subset, no 10/10). Los "Patrones / selectores nuevos" quedan en los reportes de módulo para la próxima corrida completa (o consolidación manual con `prompt-consolidar-hallazgos.md`).
- **Cobros pendiente de re-correr** (manual o con harness actualizado) antes de dar cobros por cubierto en jerez.

## Reportes individuales
- [clientes](clientes.md) · [pedidos](pedidos.md) · [cobros](cobros.md) · [inventarios](inventarios.md) · [visitas](visitas.md) · [depositos](depositos.md) · [devoluciones](devoluciones.md)

---
*Generado por Claude Code · Orquestador Smoke (subset transaccional) · 2026-07-01*
