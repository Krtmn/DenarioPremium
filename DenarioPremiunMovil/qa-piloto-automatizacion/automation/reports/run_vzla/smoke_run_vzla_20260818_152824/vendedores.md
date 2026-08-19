# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260818_152824_smoke-completo` |
| Módulo | VENDEDORES (solo lectura · autogenerado) |
| Cliente / empresa | `run_vzla` — **CORPORACION FERRE 19** (`FERRE_N`, `id_enterprise=1`) — **una sola empresa** |
| Playa | **LA TORTUGA** (`denariolatortuga.ddns.net:8081`) |
| App | `com.kiberno.denarioPremiumPro` · `window.ng=TRUE` |
| Usuario QA | `***` / `***` (`id_user=470`, `co_user='000208'`) |
| Namespace CDP | `window.__qaPRO` (heredado del módulo PRODUCTOS de esta misma sesión) · hook de payload **no reinstalado** |
| VG | `infoVendedores=false` ⇒ el módulo **se autogenera en la app** (confirmado en runtime) |
| Resultado | **3 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Estado final | HOME ✅ |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Tile HOME *Vendedores* (74,428) → `/vendedores`, `app-vendedores` (`VendedoresComponent`). **`<h1>Vendedor</h1>` presente** ⇒ `esVendedor=true`. **1 acordeón** rotulado `CORPORACION FERRE 19`, colapsado (`accordion-collapsed`, altura 0). ⚠ `ion-loading:not(.overlay-hidden)` = **0** al entrar (3.ª playa sin loading — su ausencia no indica fallo de carga) |
| DM-VND-002 | ✅ PASS pleno | Acordeón expandido con **KPIs POBLADOS** y el bloque de cuotas renderizado. Altura `[slot=content]` **0 → 506 px → 0** (expandir / contraer). Contenido: **Días Hábiles 21 · Transcurridos 12 · Restantes 9 · Cartera Clientes 1568 · Activados 26 · Nuevos 1 · Nuevos Activados 1**, más **2 planes de cuota**: *Plan por Dolares Americanos* (Cuota Mes 6000 US$ / **Venta Real Mes 300407.53 US$**) y *Plan por BULTOS* (0 BT / 0 BT) |
| DM-VND-007 | ✅ PASS | Back = `app-vendedores img.fechaAtras` (`iconosatras.png`, `x<100`) → `pg.mouse.click(32,31)` → **HOME** (`/home`, `app-home`, 10 tiles). Sin alerts, loadings ni modales residuales |

---

## Registros creados en sistema

**N/A — módulo de solo lectura y autogenerado.** No se creó, modificó ni envió ningún registro. Nada anexado a `_bd-manifest.jsonl`. Marca BD de los 3 casos: `BD-N/A`.

---

## Descubrimientos

### 1. ✅ `esVendedor = true` — cierra el pendiente #1 del YAML

La VG **no viene en ninguno de los dos dumps** y **tampoco existe como propiedad del componente** (`'esVendedor' in VendedoresComponent` ⇒ `false`) **ni figura en el `Map` de 176 VGs** que la app carga en runtime. Se cierra por el oráculo de UI, que es concluyente y triple:

1. El módulo **es visible en HOME** y navega a `/vendedores`.
2. `app-vendedores` renderiza **`<h1>Vendedor</h1>`** (el heading de rol).
3. El acordeón trae **KPIs reales**, cotejados contra BD (ver §3).

⇒ **`esVendedor: true`** en `run_vzla`. Alinea con las 11 corridas previas (globalmp, romher, insumar, don-theo, piercar, ferrenuestro, dm-electronica, jerez, latino_cosmetica, grupo_fiel, kron): **sigue sin aparecer un solo cliente con `esVendedor=false`.**

`comp.infoVendedores` legible en runtime = **`false`** (5.ª playa), confirmando que el módulo se autogenera.

### 2. 📌 Cartera Clientes — **1.568 en la app** vs **1.569 en BD**

| Fuente | Valor |
|---|---|
| `comp.userInfo[0].carteraClientes` **y** el KPI en pantalla | **1.568** |
| `client_template_user WHERE co_user='000208'` (filas = distintos) | **1.569** |
| ídem, excluyendo `co_operation='D'` | **1.569** |
| ídem, uniendo solo a `client` vivo | **1.569** |
| ídem, `in_suspension = false` | **1.569** (los 1.569 están sin suspensión) |
| Clientes de la cartera creados desde el 17/08 | **0** |
| Empresas distintas en la cartera | **1** (todas `FERRE_N`) |

**Brecha constante de exactamente 1**, y **ninguna** de las hipótesis baratas la explica: no es un borrado lógico, ni una suspensión, ni un alta reciente que el device aún no haya sincronizado, ni un cliente de otra empresa. El KPI lo calcula el **servidor** (`userInfo` llega armado del backend), así que el filtro exacto no es observable desde el dispositivo.
⇒ Se deja como **observación abierta de severidad muy baja**, no como defecto: el módulo es de solo lectura, el KPI es informativo, y no se puede atribuir la causa sin ver la consulta del servidor. **No inventar el motivo.**

### 3. ✅ `Venta Real Mes` cuadra AL CÉNTIMO contra BD

El KPI más caro de validar resultó exacto:

| | |
|---|---|
| UI — *Plan por Dolares Americanos · Venta Real Mes* | **300407.53 US$** |
| BD — `SELECT sum(nu_amount_total) FROM "order" WHERE id_user=470 AND co_operation<>'D' AND da_order >= '2026-08-01'` | **300.407,53** (55 pedidos) |

⇒ **El servicio de métricas de venta es correcto en este tenant.** Es también la primera corrida de la serie donde `planesCuotaEmpresa` viene poblado (**2 planes**, US$ y BULTOS) y el bloque *Cuota Mes / Venta Real Mes* **sí** se renderiza — contrasta con `[kron-20260817]` y `[el_palmar-20260805]`, donde el `*ngIf` lo suprimía por `planesCuotaEmpresa === []`. **Confirma que ahí la ausencia era por dato, no por template.**

### 4. 🟡 Los montos del bloque *Plan* se pintan SIN formato

`Cuota Mes: 6000 US$` y `Venta Real Mes 300407.53 US$` — **sin separador de miles y con punto decimal**, mientras el resto de la app usa formato es-VE con `parteDecimal=2` (`0,51 US$` en PRODUCTOS, `1.258,92` en CLIENTES, `30,60` en PEDIDOS). Lo esperado sería **`300.407,53 US$`**.
Reproduce en vivo en el build en prueba (pasa el gate §4.b). **Severidad: cosmética.** El valor es correcto (§3); lo que falla es el pipe de formato en ese bloque del template. Afecta al KPI más visible del módulo, así que vale la pena corregirlo aunque no bloquee nada.

### 5. ⚠ `VND-KPIS-SIN-SEGMENTAR` — **no evaluable**, no "no reproduce"

Con **una sola empresa** no hay segunda columna contra la cual comparar, y la desigualdad diagnóstica de `[difranca-20260807]` no se da (**Activados 26 ≤ Cartera 1568**). Siguiendo el criterio de `[grupo_fiel-20260817]` y `[kron-20260817]`: **no hay superficie donde el defecto pueda manifestarse** ⇒ se constata que no aparece, **sin** reportarlo como descartado. El oráculo `Activados > Cartera` **no aplica**.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴🔴 **`mouse.click` en el header del acordeón SÍ EXPANDE en este build — CORRIGE 6 corridas previas** | universal (candidato fuerte) | Todas las notas desde `[gmp-2611]` hasta `[kron-20260817]` afirman que *"`mouse.click` en el header NO expande"*. Acá **sí**: un click en el centro del `ion-accordion ion-item` llevó el `[slot=content]` de **0 a 506 px** y dejó `accordion-expanded` + `grp.value='ion-accordion-84'`. **Primera playa donde el click real funciona** ⇒ el anti-patrón deja de ser universal. La vía programática `grp.value = acc.value` + `ionChange` **sigue siendo válida y es la recomendada** (determinista); pero **un click que expande ya no debe leerse como "no pasó nada"** |
| **Altura expandida = 506 px — nueva marca máxima de la escala** | cliente | Escala acumulada: **0** colapsado · **~20 px** expandido-vacío (latino_cosmetica) · **281 px** (el_palmar/globalmp/difranca/kron) · **393 px** (ferrenuestro/grupo_fiel) · **506 px** (run_vzla, con 2 planes de cuota). **Confirma por 7.ª vez: no usar umbrales altos como oráculo de expansión** — usar `height > 0` o `accordion-expanded` |
| 🔴 **El `[slot=content]` ya trae el `innerText` COMPLETO estando colapsado** | universal | Con `height=0` y `accordion-collapsed`, el `innerText` devuelve los 7 KPIs y los 2 planes enteros. **Usar el texto como oráculo de expansión da falso positivo.** Reconfirma `[gmp-20260730]` (7.ª playa) |
| **`comp.userInfo` fiable y completo acá — 1 entrada por EMPRESA** | universal | `[{id:1, idUser:470, coUser:'000208', mes:'Agosto', diasHabiles:21, diasTranscurridos:12, diasRestantes:9, carteraClientes:1568, clientesActivados:26, clientesNuevos:1, clientesNuevosActivados:1, coEnterprise:'FERRE_N', naEnterprise:'CORPORACION FERRE 19, C.A.', planesCuotaEmpresa:[2]}]`. Da los KPIs **sin expandir nada ni parsear `innerText`**. Vale la salvedad de `[kron-20260817]`: es oráculo de **valor**, no de **existencia** — si viene `[]` (caso difranca) hay que caer a `[slot=content]` |
| **`VendedoresComponent` expone 3 campos no documentados** | universal | `loadingUserInfo`, `userInfoLoadFailed` y `empresas`, junto a `userInfo` e `infoVendedores`. **`userInfoLoadFailed` es el discriminador correcto entre "el servicio falló" y "el servicio devolvió vacío"** — mejor que inferirlo del DOM |
| ⚠ **El rótulo del acordeón NO siempre se trunca a 19 chars** | universal (acota) | Acá rotula **`CORPORACION FERRE 19`** = **20 caracteres**, íntegro. La "truncación a 19" de `[difranca-20260807]`/`[grupo_fiel-20260817]`/`[kron-20260817]` era el efecto de nombres más largos, **no una regla del componente**. Lo que **sí** se mantiene: el rótulo es **`lb_enterprise`** (sin `, C.A.`) mientras `userInfo[0].naEnterprise` trae **`CORPORACION FERRE 19, C.A.`** ⇒ **cotejar contra `lb_enterprise`, nunca contra `na_enterprise`** (3.ª confirmación con evidencia interna) |
| **Back: `img.fechaAtras` sin `<a>` — 7.ª playa** | universal | `document.querySelectorAll('app-vendedores a')` = **0 anclas** ⇒ `h.clickBack` y todo `closest('a')` fallan. Click directo sobre la `<img>`: `src=iconosatras.png`, **x=32, y=31**. La 2.ª `img.fechaAtras` en **x=323** es `vendedoresNuevoBlanco.svg` (decorativa, mismo 43×43) ⇒ **discriminar por `src` Y por `x<100`** |
| **Oráculo de BD para `Venta Real Mes`** | universal | `SELECT sum(nu_amount_total) FROM "order" WHERE id_user=<id> AND co_operation<>'D' AND da_order >= <1.º del mes>` reproduce el KPI **al céntimo**. ⚠ Filtrar por **`id_user`**, no por `co_user` — en tenants productivos con varios vendedores activos el total global se mueve solo |
| ⚠ **3.ª playa SIN `ion-loading` al entrar a `/vendedores`** | universal | `ion-loading:not(.overlay-hidden)` = **0**. El dismiss preventivo sigue siendo correcto (barato, no rompe) pero **su ausencia NO indica fallo de carga**. Reconfirma `[grupo_fiel-20260817]`/`[kron-20260817]` contra el_palmar/difranca |

> OK consolidado 2026-08-19 -> module-selectors/ + RUNTIME.md  [run_vzla-20260818]

---

## Hallazgos

**0 FAIL.** Dos observaciones, ambas pasadas por el gate §4.b (reproducen en vivo, hoy, en el build en prueba):

| # | Severidad | Hallazgo | Evidencia | Por qué no es FAIL |
|---|-----------|----------|-----------|--------------------|
| H-VND-1 | 🟡 Muy baja | **`Cartera Clientes` muestra 1.568 con 1.569 asignaciones en BD** | Brecha constante de 1; descartados borrado lógico, suspensión, altas recientes y multi-empresa | KPI informativo en módulo de solo lectura. El cálculo es del **servidor** y su filtro no es observable desde el device ⇒ **no se puede atribuir la causa**. Observación abierta, no defecto |
| H-VND-2 | 🟡 Cosmética | **Los montos del bloque *Plan* no aplican el formato de moneda** | `Cuota Mes: 6000 US$` · `Venta Real Mes 300407.53 US$`, vs. `0,51 US$` / `1.258,92` en el resto de la app (`parteDecimal=2`) | El **valor es correcto** (cuadra al céntimo con BD). Falla solo el pipe de formato del template |

**Verificado correcto y digno de mención:** `Venta Real Mes` = **300.407,53 US$** = suma exacta de los 55 pedidos de agosto de `id_user=470`.

---

## Resumen técnico

- **3 casos · 3 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED.** Wall-clock ~8 min, **0 cuelgues de CDP**.
- **Pendiente #1 del YAML CERRADO: `esVendedor = true`**, por el oráculo de UI (módulo visible + `<h1>Vendedor</h1>` + KPIs reales cotejados). La VG no está en los dumps, ni en el componente, ni en el `Map` de 176 VGs del runtime.
- **KPIs poblados y con el bloque de cuotas renderizado** — primera corrida de la serie con `planesCuotaEmpresa` no vacío (**2 planes**), lo que confirma que en kron y el_palmar la ausencia del bloque era **por dato, no por template**.
- **El KPI de venta se validó contra BD y cuadra al céntimo**; el de cartera queda **1 corto** (1.568 vs 1.569) como observación abierta.
- **Corrección de memoria importante:** `mouse.click` en el header del acordeón **sí expande en este build**, contra lo afirmado en 6 corridas anteriores.
- `VND-KPIS-SIN-SEGMENTAR` **no evaluable** con una sola empresa — se constata, no se descarta.
- **Ningún registro creado.** `BD-N/A` en los 3 casos; nada anexado a `_bd-manifest.jsonl`.
- App devuelta a **HOME** limpia (10 tiles, 0 alerts / 0 loadings / 0 modales).
