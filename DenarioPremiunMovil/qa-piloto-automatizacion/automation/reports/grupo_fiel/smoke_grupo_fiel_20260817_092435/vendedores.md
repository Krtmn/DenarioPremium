# Smoke Test — Módulo VENDEDORES
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_092435_smoke-completo` |
| Módulo | VENDEDORES |
| Dispositivo | El Yaque (`denarioelyaque.ddns.net:8081`) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 (db19, `window.ng=TRUE`) |
| Playa | El Yaque |
| Empresa | **GRUPO FIEL, S.A. (GRUFISA)** — única, sin selector |
| Usuario | `johana` · id_user 463 · co_user `'003'` |
| Resultado | **3 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Tile HOME → `/vendedores` con `app-vendedores` renderizado, `<h1>Vendedor</h1>` y **1 acordeón** "GRUPO FIEL, S.A. (GR" · 0 `ion-loading` residual · 3.086 ms |
| DM-VND-002 | ✅ PASS **pleno** | Expandir (`grp.value=acc.value`+`ionChange`) → `[slot=content]` **0 → 393,4 px**, `accordion-collapsed`→`accordion-expanded`, **KPIs POBLADOS**; contraer (`grp.value=undefined`) → vuelve a 0 px / `accordion-collapsed` · 2.876 ms |
| DM-VND-007 | ✅ PASS | `img.fechaAtras` (`iconosatras.png`, x=10, **sin `<a>`**) → `mouse.click(31.7 , 31.2)` → HOME con los 10 tiles · 2.359 ms |

### KPIs leídos (DM-VND-002)
| KPI | Valor |
|-----|-------|
| Días Hábiles / Transcurridos / Restantes | 21 / 11 / 10 |
| Cartera Clientes | **60** |
| Clientes Activados | 21 |
| Clientes Nuevos | 1 |
| Clientes Nuevos Activados | 0 |
| Plan | **Plan por CAJA** — Cuota Mes 0 CJA · **Venta Real Mes 7.882,84 CJA** |

- **`VND-KPIS-SIN-SEGMENTAR` NO reproduce:** con **una sola empresa** el contraste entre acordeones no es aplicable, y el oráculo barato de `[difranca-20260807]` (`Activados > Cartera`) **no se cumple**: 21 ≤ 60. No hay evidencia del defecto de segmentación en este tenant.
- ℹ️ **Nota de dato (no es FAIL):** `Cartera Clientes = 60` contra los **61 clientes** de `johana` en BD. La diferencia es de **1** y la corrida creó un cliente potencial (Ref 35, módulo CLIENTES) — el KPI de cartera probablemente no cuenta potenciales, o la métrica se calculó antes del alta. Además había **otro usuario activo en el tenant** (`jgomez` / 474) durante la corrida. No se levanta como hallazgo.

## Veredicto de `esVendedor` — 🔑 PENDIENTE DE PERFIL CERRADO

**`esVendedor = TRUE`, confirmado por UI.** Es uno de los 5 pendientes que esta corrida debía cerrar y **queda cerrado**:

| Evidencia | Valor |
|-----------|-------|
| Heading de rol | `<h1>Vendedor</h1>` presente en `app-vendedores` |
| Acordeones de empresa | 1 (GRUPO FIEL, S.A.) — se expanden y traen KPIs reales |
| Módulo visible en HOME | Sí (tile "Vendedores" entre los 10) |
| `salesman_view.co_role` (BD) | 7 — **coherente** con lo observado en UI |

⇒ El dump de configuración **no trae `esVendedor`** (no está en `global_configuration`), pero la UI lo resuelve sin ambigüedad. **Anotar `vgs.esVendedor: true` en `automation/clientes/grupo_fiel.yaml`.**

- **`infoVendedores = false` confirmado EN RUNTIME:** `window.ng.getComponent(document.querySelector('app-vendedores')).infoVendedores` → `false` ⇒ el módulo **se autogenera en la app** (no viene de config del servidor), como estaba previsto en el perfil.

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo de **solo lectura**: ninguno | — |

## Verificación BD
`BD-N/A` — módulo de solo lectura, sin registros creados (RUNTIME §10).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Expansión `grp.value = acc.value` + `ionChange` (contraer con `undefined`) | universal — **reconfirmado 5.ª playa** | Vigente en El Yaque v1.0/db19 `window.ng=true`. Los `ion-accordion` no declaran `value` propio: Ionic asignó `ion-accordion-237` → **leerlo en runtime**. `mouse.click` en el header **sigue sin expandir** |
| Altura expandida con KPIs poblados = **393,4 px** | universal (escala) | Escala acumulada: 0 colapsado · ~20 px expandido-vacío · 281 px (el_palmar/globalmp/difranca) · **393 px (ferrenuestro y grupo_fiel)**. Confirma: no usar umbrales altos como oráculo |
| Back = `img.fechaAtras` **sin `<a>`**, `src=iconosatras.png`, x=10 | universal — reconfirmado | `app-vendedores a` = **0 anclas** ⇒ `h.clickBack`/`closest('a')` fallan. 2.ª `img.fechaAtras` en **x=302** es `vendedoresNuevoBlanco.svg` decorativa (mismo tamaño 43×43) → discriminar por `src` **y** `x<100`. Click ≈ (32, 31) |
| ⚠ **CORRIGE `[el_palmar-20260805]` / difranca: `ion-loading` al entrar — acá hubo 0** | cliente | En el_palmar y difranca quedaba 1 `ion-loading` visible al entrar a `/vendedores`; en grupo_fiel `ion-loading:not(.overlay-hidden)` contó **0** y el `dismiss()` fue innecesario. **El dismiss preventivo sigue siendo correcto** (es barato y no rompe), pero su ausencia no indica fallo de carga |
| `comp.infoVendedores` legible en runtime | universal | Reconfirmado 3.ª playa (`false`). Evita deducir la VG desde la UI cuando `window.ng=true` |
| Oráculo `Activados > Cartera` **no aplicable con 1 empresa** | universal (matiz) | El oráculo definitivo de `[difranca-20260807]` necesita ≥1 empresa donde la desigualdad se pueda dar; con acordeón único y 21 ≤ 60 el defecto **no se prueba ni se descarta por comparación** — solo se constata que no aparece |
| Rótulo del acordeón **truncado a 19 chars** | universal — reconfirmado | "GRUPO FIEL, S.A. (GR" (de `GRUPO FIEL, S.A. (GRUFISA)`) ⇒ cotejar contra `lb_enterprise`, **nunca** contra `na_enterprise` |
| ⚠ **`comp.userInfo` NO usado como oráculo** | universal | Se respetó la corrección de `[difranca-20260807]` (llegó vacío allí). El oráculo fiable es el `[slot=content]` + su altura |

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

## Hallazgos (solo si hay FAIL)
**Ninguno.** 3/3 PASS, 0 FAIL.

---

## Notas de ejecución
- **Watchdog:** 0 cuelgues de CDP · 0 reconexiones · techo de módulo no alcanzado (~8 s de operaciones netas).
- **Estado final:** HOME (verificado: `app-home` con 10 tiles).
- **Contexto:** `jgomez` (474) estaba activo en el tenant durante la corrida; los KPIs agregados pueden haber variado. No se leyó como inconsistencia de la app.
- **Grupo "KPIs pueblan":** grupo_fiel se suma a insumar / piercar / ferrenuestro / dm-electronica / el_palmar / difranca / globalmp(0730). Contrasta con don-theo / jerez / latino_cosmetica (vacíos).
