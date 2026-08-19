# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_145314_smoke-completo` |
| Módulo | VENDEDORES |
| Cliente | kron — CHOCOLATES KRON, C.A (`KRON_ADM`, id_enterprise 1) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db19 · `window.ng=true` |
| Playa | ISLA COCHE (`denarioislacoche.ddns.net:8081`) |
| Vendedora | scarlet · id_user 309 · co_user `VE0002` |
| Resultado | **3 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Registros creados | **ninguno** (módulo de solo lectura) |
| Verificación BD | N/A por diseño (solo lectura). BD usada **solo como oráculo** de la cartera. |

## Ruta ejecutada

```
HOME → tile "Vendedores" → /vendedores (app-vendedores)
  ├ h1 "Vendedor" + 1 acordeón "CHOCOLATES KRON, C.A"
  ├ expandir (grp.value = acc.value + ionChange) → 0 → 281 px · KPIs poblados
  ├ contraer (grp.value = undefined) → 281 → 0 px
  └ back (img.fechaAtras, sin <a>, coords 32,31) → HOME
```

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | `/vendedores` → `app-vendedores` visible con `<h1>Vendedor</h1>` y **1 `ion-accordion`** rotulado `CHOCOLATES KRON, C.A`. **0 `ion-loading`** residuales al entrar (dismiss preventivo innecesario). `comp.infoVendedores = false` leído en runtime ⇒ el módulo se autogenera, como declara el perfil |
| DM-VND-002 | ✅ PASS **pleno** | Expandir con `grp.value = acc.value` + `ionChange`: `accordion-collapsed`→`accordion-expanded`, `[slot=content]` **0 → 281 px**, con **KPIs reales poblados**: Días Hábiles **21** · Días Transcurridos **11** · Días Restantes **10** · Cartera Clientes **30** · Clientes Activados **6** · Clientes Nuevos **0** · Clientes Nuevos Activados **0**. Contraer con `grp.value = undefined` → vuelve a **0 px** y `accordion-collapsed`. **Cartera 30 == BD** (`count(DISTINCT id_client) FROM client_template_user WHERE id_user=309` → **30**) |
| DM-VND-007 | ✅ PASS | Back = `app-vendedores img.fechaAtras` (`iconosatras.png`, x=10) → `pg.mouse.click(32,31)` → `app-home` con los 12 tiles (`/home`). `document.querySelectorAll('app-vendedores a').length === 0` ⇒ `h.clickBack`/`closest('a')` fallarían |

## Registros creados en sistema

*Ninguno — módulo de solo lectura.*

## Veredicto pedido — `esVendedor` (pendiente #1 del perfil de kron)

# ✅ `esVendedor = true` — CONFIRMADO

**Cierra el pendiente #1 del perfil**, que no venía en ninguno de los dos dumps de configuración. Tres evidencias independientes, todas en la UI:

1. **Heading de rol:** `app-vendedores` renderiza `<h1>Vendedor</h1>` — el oráculo canónico del módulo (`[gmp-2606]`, usado en las 10 playas anteriores).
2. **Acordeón por empresa presente y funcional:** 1 acordeón rotulado `CHOCOLATES KRON, C.A`, que expande a **281 px** y contrae a 0.
3. **KPIs reales poblados, no placeholders:** los 7 indicadores traen valores, y **`Cartera Clientes = 30` cuadra exacto** con los 30 clientes de `scarlet` en la nube.

El módulo es además **visible en HOME** (tile "Vendedores" entre los 12), consistente con `modules.vendedores.aplica = true`.

**Acción sugerida al YAML de kron:** fijar `vgs.esVendedor: true` y `modules.vendedores.kpis_disponibles: true`, y bajar el ítem 1 de "Pendientes para la 1ª corrida".

### Sobre `VND-KPIS-SIN-SEGMENTAR` — no evaluable

`Clientes Activados (6) ≤ Cartera Clientes (30)` ⇒ la desigualdad de `[difranca-20260807]` **no se da**. Pero con **una sola empresa** no hay segunda columna contra la cual comparar: el defecto **no se prueba ni se descarta**. Siguiendo el criterio de `[grupo_fiel-20260817]`, **no se reporta como "no reproduce"** — simplemente no hay superficie donde pueda darse.

## Hallazgos

*Sin FAIL.* Nada que levantar.

*(Nota de completitud, no defecto: el `[slot=content]` trae **8 `<!--container-->`** ⇒ el bloque Cuota Mes / Venta Real Mes existe en el template pero un `*ngIf` lo suprime, porque `userInfo[0].planesCuotaEmpresa` llega **`[]`**. Es el mismo cuadro que `[el_palmar-20260805]`: ausencia por dato, no por template.)*

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴🔴 **`comp.userInfo` es el ORÁCULO COMPLETO del módulo — trae los KPIs en objeto, sin parsear `innerText`** | universal (**resuelve** la contradicción el_palmar ↔ difranca) | `ng.getComponent(document.querySelector('app-vendedores')).userInfo` → `[{id:2, idUser:309, coUser:'VE0002', mes:'Agosto', diasHabiles:21, diasTranscurridos:11, diasRestantes:10, carteraClientes:30, clientesActivados:6, clientesNuevos:0, clientesNuevosActivados:0, coEnterprise:'KRON_ADM', naEnterprise:'CHOCOLATES KRON, C.A.', planesCuotaEmpresa:[]}]`. **Y se lee CON EL ACORDEÓN COLAPSADO** ⇒ da los KPIs de las N empresas en 1 llamada, sin expandir nada. ⚠ **Sigue sin ser fiable como oráculo de *existencia*** (en difranca llegó `[]` con los KPIs renderizados): **si trae datos son válidos; si viene vacío, caer a `[slot=content]`** — no concluir "sin KPIs". `[el_palmar-20260805][difranca-20260807][kron-20260817]` |
| 🔴 **`userInfo[0].naEnterprise` trae el nombre CON punto; el acordeón rotula `lb_enterprise` SIN punto** | universal | Contraste medido en el mismo objeto: `naEnterprise = "CHOCOLATES KRON, C.A."` vs rótulo del acordeón `"CHOCOLATES KRON, C.A"` (truncado a 19 chars, = `lb_enterprise`). **Confirma con evidencia interna** la regla de `[difranca-20260807]`: cotejar el rótulo contra `lb_enterprise`, **nunca** contra `na_enterprise` — y ahora se sabe que `userInfo` expone justamente el campo equivocado. `[kron-20260817]` |
| **Altura expandida 281 px con KPIs poblados en v1.0/db19** | universal (reconfirma) | Escala acumulada: **0** colapsado · **~20 px** expandido-vacío (latino_cosmetica) · **281 px** (el_palmar, globalmp, difranca, **kron**) · **393 px** (ferrenuestro, grupo_fiel). Confirma: **no usar umbrales altos** como oráculo de expansión. `[kron-20260817]` |
| ⚠ **Al entrar a `/vendedores` NO había `ion-loading`** | universal (reconfirma `[grupo_fiel-20260817]`) | `ion-loading:not(.overlay-hidden)` contó **0**; el `dismiss()` preventivo fue innecesario. 2.ª playa que lo contradice a el_palmar/difranca ⇒ **el dismiss sigue siendo correcto (barato, no rompe) pero su ausencia NO indica fallo de carga**. `[grupo_fiel-20260817][kron-20260817]` |
| **Expansión por `grp.value = acc.value` + `ionChange`** | universal (reconfirma) | **6.ª playa.** Los `ion-accordion` **no declaran `value` propio** (Ionic asignó `ion-accordion-120`) ⇒ leerlo en runtime. Contraer con `grp.value = undefined`. `mouse.click` en el header sigue **sin** expandir. `[kron-20260817]` |
| **Back = `img.fechaAtras` SIN `<a>` padre, coords ≈(32,31)** | universal (reconfirma) | **5.ª playa.** `document.querySelectorAll('app-vendedores a').length === 0` ⇒ `h.clickBack` y todo `closest('a')` fallan. Las 2 `img.fechaAtras` son `iconosatras.png` (**x=10**, la buena) y `vendedoresNuevoBlanco.svg` (**x=302**, decorativa, mismo 43×43) ⇒ discriminar por `src` **y** `x<100`. `[kron-20260817]` |
| **`infoVendedores` legible en runtime** | universal (reconfirma) | 4.ª playa con `false`. `ng.getComponent(document.querySelector('app-vendedores')).infoVendedores` — evita deducir la VG desde la UI. `[kron-20260817]` |

> ✅ consolidado 2026-08-17
