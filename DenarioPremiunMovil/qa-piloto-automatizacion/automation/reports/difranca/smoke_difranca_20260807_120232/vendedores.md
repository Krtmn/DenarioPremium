# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260807_120232_smoke-difranca-tag20` |
| Módulo | VENDEDORES (solo lectura) |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — app v1.0 / db 19 · `window.ng=true` |
| Playa | EL YAQUE · cliente **difranca** · **3 empresas activas** |
| Vendedor | `VEND206` = id_user **275** (Jose Raad) · `co_user='206'` |
| Resultado | **3 PASS · 0 FAIL · 0 N/A · 0 BLOCKED** |
| Registros creados | ninguno (módulo de solo lectura) |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | `app-vendedores` visible, `<h1>Vendedor</h1>` (⇒ `esVendedor=true`), **3 acordeones** de empresa; el `ion-loading` de entrada se descartó sin residuos |
| DM-VND-002 | ✅ PASS | los 3 acordeones expanden (`[slot=content]` **0 → 281 px**, clase `accordion-expanded`) **con KPIs poblados**, y contraen de vuelta a 0 px |
| DM-VND-007 | ✅ PASS | back (`img.fechaAtras`, `src=iconosatras.png`, **sin `<a>` padre**, x<100) → **HOME** |

---

## VG `infoVendedores`

**`infoVendedores = false`** — leído en runtime:
`ng.getComponent(document.querySelector('app-vendedores')).infoVendedores`.

⇒ La información **NO viene del sistema administrativo**: se **autogenera en la app** con datos de
Denario. Coincide con lo esperado en el perfil y con el patrón de piercar/ferrenuestro.

### Campos que muestra (7 KPIs por empresa, idénticos en las 3)

| Campo | *DISTRIBUIDORA DIAZ | DIFRANCA C.A | DISTRIBUIDORA DH VI |
|---|---|---|---|
| Días Hábiles | 21 | 21 | 21 |
| Días Transcurridos | 5 | 5 | 5 |
| Días Restantes | 16 | 16 | 16 |
| **Cartera Clientes** | **178** | **33** | **1** |
| **Clientes Activados** | **7** | **7** | **7** |
| Clientes Nuevos | 0 | 0 | 0 |
| Clientes Nuevos Activados | 0 | 0 | 0 |

⚠ **No** aparecen `Cuota Mes` ni `Venta Real Mes` (sí presentes en ferrenuestro/dm-electronica).
El `[slot=content]` conserva 12–24 comentarios `<!--container-->` ⇒ el bloque **existe en el template**
pero un `*ngIf` lo suprime — no es que falte el template (técnica de `[el_palmar-20260805]`).

⚠ `comp.userInfo` llega **vacío** (`[]`) en este build/cliente, a diferencia de el_palmar (1 entrada
por empresa). Los acordeones se poblaron igual ⇒ **no usar `userInfo` como oráculo acá**.

---

## Hallazgos

### H-VND-1 · 🔴🔴 `VND-KPIS-SIN-SEGMENTAR` — **REPRODUCE** (prioridad alta para difranca)

difranca era el **escenario exacto** del defecto y lo reproduce de forma **inequívoca y medible**.

**El servicio de métricas segmenta SOLO `Cartera Clientes`. Los KPIs de activación NO se segmentan.**

| KPI | ¿Segmenta por empresa? | Evidencia |
|---|---|---|
| Días Hábiles / Transcurridos / Restantes | n/a (son del calendario) | 21/5/16 en las 3 — correcto |
| **Cartera Clientes** | ✅ **SÍ** | 178 / 33 / 1 — tres valores distintos |
| **Clientes Activados** | 🔴 **NO** | **7 / 7 / 7** — idéntico en las 3 |
| Clientes Nuevos | 🔴 NO (presunto) | 0 / 0 / 0 — no discrimina, pero al ser 0 no es concluyente por sí solo |
| Clientes Nuevos Activados | 🔴 NO (presunto) | 0 / 0 / 0 — ídem |

#### La prueba que no admite discusión: **7 activados sobre una cartera de 1**

En **DISTRIBUIDORA DH VITAL** la app muestra `Cartera Clientes: 1` y `Clientes Activados: 7`.
Los clientes activados son un **subconjunto** de la cartera ⇒ **7 ⊄ 1**. Es **aritméticamente
imposible** y se ve en pantalla sin necesidad de consultar nada.

Es exactamente el mismo síntoma que el **H1 de globalmp** (`Activados 119` sobre `Cartera 14`)
⇒ mismo servicio, mismo defecto, segunda playa que lo confirma.

#### Cruce contra BD

| Empresa | Cartera — **app** | Cartera — BD (`client_template_user`, `co_user='206'`) | ✓ |
|---|---|---|---|
| DDHP_A12 (*DISTRIBUIDORA DIAZ) | 178 | **178** | ✅ exacto |
| DIF_A12 (DIFRANCA C.A) | 33 | **33** | ✅ exacto |
| DHVITAL01_A (DISTRIBUIDORA DH VITAL) | 1 | **1** | ✅ exacto |

> 📌 La cartera real es **178 / 33 / 1** (total 212), no el 148/21/1 que anticipaba el perfil.
> **La app acierta**: coincide 1:1 con `client_template_user`. Corregir el dato en el YAML.

Y para `Clientes Activados`, la app muestra **7 en las tres**, mientras la BD da valores **distintos
entre sí** (clientes distintos con cobro en el mes: **27 / 1 / 1**). Ninguna empresa vale 7 ⇒ el
número no solo no segmenta: **no corresponde a ninguna de las tres carteras**.

⇒ Diagnóstico coherente con el de globalmp: el filtro por `idEnterprise` **está presente** en la
consulta de cartera y **ausente** en las de activación/altas.

#### Impacto para el go/no-go

- **No bloquea la operación:** el módulo es de **solo lectura**, los 3 casos del smoke **PASAN** por
  su criterio (la vista abre, expande y navega bien), y ningún flujo transaccional depende de estos KPIs.
- **Sí desinforma al vendedor:** difranca es el peor caso posible por sus carteras desparejas
  (178 / 33 / 1). El vendedor ve el mismo "7 activados" en las tres empresas, y en DH VITAL ve una
  cifra imposible. Cualquier lectura de gestión sobre esta pantalla es **inservible**.
- **Severidad: media.** Defecto de *reporting*, no de datos ni de transacciones. No corrompe nada,
  no impide vender ni cobrar. **No debería frenar el paso al tag 20**, pero conviene avisar al
  usuario de que no se guíe por estos KPIs hasta la 21.

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | ninguno | Módulo de solo lectura |

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **Oráculo definitivo de `VND-KPIS-SIN-SEGMENTAR`: la desigualdad `Activados > Cartera`** | **universal (nuevo)** | No hace falta BD para confirmarlo: si en **alguna** empresa `Clientes Activados > Cartera Clientes`, el defecto está probado (activados ⊆ cartera). En difranca DH VITAL dio **7 > 1**. Complementa la receta de el_palmar (que exigía cruzar `client_template_user` y allí dio 144/144 = coincidencia real, no defecto): **primero buscar la desigualdad; solo si no aparece, ir a la BD** |
| Segmentación **parcial**: la cartera sí, la activación no | universal | El defecto **no** es "todos los KPIs iguales": `Cartera Clientes` **sí** se segmenta correctamente (178/33/1, exacto contra `client_template_user`). Un chequeo tipo "¿los acordeones muestran lo mismo?" da **falso negativo**. Comparar **KPI por KPI**, no el bloque entero. Reconfirma el H1 de `[gmp-20260730]` |
| Expandir **los 3 acordeones a la vez** | universal | `grp.multiple = true` + `grp.value = [todos los .value]` + `ionChange` permite leer y comparar las N empresas **en una sola llamada** — clave para diagnosticar segmentación. Contraer: `grp.value = undefined`. `mouse.click` en el header sigue **sin** expandir |
| Altura expandida con KPIs poblados = **281 px** en v1.0/db19 El Yaque | universal (reconfirma) | Escala acumulada: **0** colapsado · **~20 px** expandido-vacío · **281 px** (difranca, el_palmar, globalmp) · **393 px** (ferrenuestro). No usar umbrales altos |
| ⚠ `comp.userInfo` puede llegar **vacío** aun con acordeones poblados | universal (corrige) | En difranca `userInfo=[]` con 3 acordeones y KPIs completos, contra `[el_palmar-20260805]` que lo daba como "1 entrada por EMPRESA" y lo proponía de oráculo. **No es fiable como oráculo**: usar los `[slot=content]` |
| `infoVendedores` legible en runtime | universal (reconfirma) | `ng.getComponent(document.querySelector('app-vendedores')).infoVendedores` → `false`. Evita deducir la VG desde la UI |
| Back de VENDEDORES: `img.fechaAtras` **sin `<a>`** | universal (reconfirma) | `src=iconosatras.png`, filtrar `width>0 && x<100` (la 2.ª instancia en x≈302 es `vendedoresNuevoBlanco.svg` decorativa) → `mouse.click` en el centro (~32,31). `closest('a')` da `null` |
| Al entrar a `/vendedores` queda 1 `ion-loading` visible | universal (reconfirma) | `dismiss()` de los loadings **visibles** antes de operar (nunca en bucle sobre todos) |
| Los acordeones rotulan `lb_enterprise` truncado a 19 chars | cliente (reconfirma) | `*DISTRIBUIDORA DIAZ` / `DIFRANCA C.A` / `DISTRIBUIDORA DH VI`. Cotejar contra `lb_enterprise`, nunca contra `na_enterprise` |

> ✅ consolidado 2026-08-07

---

## Verificación BD

`BD-N/A` — módulo de solo lectura (RUNTIME §10). La BD se usó en modo `BD-INFO` para cruzar los KPIs:
`client_template_user` confirmó la cartera **178/33/1** (la app acierta) y descartó que el `7` de
`Clientes Activados` corresponda a alguna empresa.

---

*Agente VENDEDORES · corrida `smoke_difranca_20260807_120232` · 2026-08-07*
