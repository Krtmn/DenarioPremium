# Regresión Móvil — Verificación de fix `CLT-LISTA-SALDOS-CRUZADOS`

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260803_115125_regresion` |
| Capa | regresion-movil |
| Módulo | CLIENTES |
| Cliente / playa | globalmp · la_tortuga |
| App | `com.kiberno.denarioPremiumPro` — versionApp **1.0** · `window.ng=true` |
| Usuario | **YC01** YUSNEIDI CLEMENTE |
| Empresa | 00002 COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A. (`id_enterprise=2`) |
| Defecto verificado | `CLT-LISTA-SALDOS-CRUZADOS` (reportado 2026-07-30, `smoke_globalmp_20260730_094753/clientes.md` H-1) |
| Alcance | **Solo lectura.** 0 registros creados · 0 enviados · 0 mocks instalados |
| Estado final | HOME · DOM limpio (0 alerts, 0 modales) |

---

# 🔴 VEREDICTO: REGRESIÓN — y el defecto original SIGUE FALLANDO

**No está arreglado.** El listado quedó **exactamente igual que el 30/07** (mismos números, mismas
etiquetas cruzadas), y el **DETALLE — que era la pantalla correcta — ahora está mal**.

Lo que se hizo no fue corregir el listado: fue **alinear el detalle al listado roto**. Las dos pantallas
ahora coinciden, pero coinciden **en el valor equivocado**. El resultado es peor que el defecto original,
porque desapareció la discrepancia que permitía detectarlo desde la UI: hoy un vendedor no tiene ninguna
pantalla en la app que le muestre su saldo correcto.

> ⚠ **Atención al criterio de aceptación.** El paso 5 del guion decía "el fix está bien si listado y
> detalle coinciden". **Hoy coinciden — y aun así está mal.** La coincidencia por sí sola no prueba nada:
> hay que anclar contra la tasa y contra la BD. Este caso es el contraejemplo.

---

## 1. Tabla listado vs. detalle — 4 clientes abiertos en detalle

Tasa vigente leída de la app: **737,88 BS/USD** (tab Doc. de Venta, ver §3).

| Cliente | | Saldo USD | Saldo BS | ¿Correcto? |
|---------|---|-----------|----------|-----------|
| **AS04** ABASTO EL SITIO DSG | Listado | `2,84` | `2.096,23` | ❌ |
| | Detalle **hoy** | `2,84` | `2.096,23` | ❌ **regresión** |
| | Detalle **30/07** | `2.096,23` | `1.546.766,19` | ✅ era correcto |
| | **Verdad (BD local)** | **2.096,23** | **1.546.766,19** | — |
| **CB10** BIG BANG IMPORT | Listado | `0,62` | `458,55` | ❌ |
| | Detalle **hoy** | `0,62` | `458,55` | ❌ **regresión** |
| | Detalle **30/07** | `458,55` | `338.354,87` | ✅ era correcto |
| | **Verdad (BD local)** | **458,55** | **338.354,87** | — |
| **AV10** ALIMENTOS VANDAL | Listado | `15,73` | `11.603,22` | ❌ |
| | Detalle hoy | `15,73` | `11.603,22` | ❌ |
| | **Verdad (BD local)** | **11.603,22** | **8.561.783,97** | — |
| **CH01** CHA CHA AUTOMERCADO | Listado | `0,86` | `634,42` | ❌ |
| | Detalle hoy | `0,86` | `634,42` | ❌ |
| | **Verdad (BD local)** | **634,42** | **468.125,83** | — |

**Los valores de AS04 y CB10 son idénticos a los del 30/07** ⇒ el saldo del cliente **no cambió** entre
ambas corridas. La comparación es limpia: no hay cobros ni pedidos nuevos que expliquen la diferencia.
Lo único que cambió es que **el detalle dejó de estar bien**.

---

## 2. La aritmética explícita, con la tasa vigente (737,88)

La relación correcta es `Saldo BS / tasa = Saldo USD`. Lo que muestra la app **no la cumple**:

| Cliente | Lo que muestra la app (BS / tasa) | Da | Pero la app rotula USD | Coincide con la relación correcta |
|---------|-----------------------------------|-----|------------------------|------------------------------------|
| AS04 | 2.096,23 / 737,88 | 2,84 | 2,84 | ❌ *(2.096,23 no son bolívares)* |
| CB10 | 458,55 / 737,88 | 0,62 | 0,62 | ❌ |
| AV10 | 11.603,22 / 737,88 | 15,73 | 15,73 | ❌ |
| CH01 | 634,42 / 737,88 | 0,86 | 0,86 | ❌ |

La app **sí es internamente coherente**: divide bien. El problema es de **qué divide**. Toma un importe
que ya está **en USD** y lo trata como si fueran bolívares.

**La relación correcta, con los valores reales:**

| Cliente | Saldo USD real | × 737,88 | = Saldo BS real |
|---------|----------------|----------|-----------------|
| AS04 | 2.096,23 | | **1.546.766,19** |
| CB10 | 458,55 | | **338.354,87** |
| AV10 | 11.603,22 | | **8.561.783,97** |
| CH01 | 634,42 | | **468.125,83** |

**Magnitud del error:** el "Saldo USD" que ve el vendedor está subestimado **737,88×**. Para AS04 se
muestran **2,84 USD** de deuda cuando son **2.096,23 USD**.

---

## 3. Qué dice la BD local del dispositivo (oráculo independiente)

Consultada por CDP vía `window.sqlitePlugin` (base `denarioPremium`). Esquema descubierto con
`PRAGMA table_info` antes de consultar.

**Hallazgo de esquema:** `clients` **no tiene columna de saldo** (`id_client, co_client, na_client,
nu_rif, …, nu_credit_limit, id_currency, co_currency, multimoneda, …`). El saldo del cliente se **calcula**
como la suma de `document_sales.nu_balance`.

```sql
SELECT c.co_client, ROUND(SUM(d.nu_balance),2) AS saldo, GROUP_CONCAT(DISTINCT d.co_currency) AS mon
FROM clients c JOIN document_sales d ON d.id_client = c.id_client
GROUP BY c.co_client
```

**Todos los documentos de estos clientes están en `co_currency = 'USD'`.** El saldo nativo es USD.

| Cliente | BD: Σ `nu_balance` (USD) | n docs | Listado "Saldo BS" | ¿Igual? |
|---------|--------------------------|--------|--------------------|---------|
| AS04 | **2.096,23** | 16 | 2.096,23 | ✔ idéntico |
| CB10 | **458,55** | 5 | 458,55 | ✔ |
| AV10 | **11.603,22** | 1 | 11.603,22 | ✔ |
| CH01 | **634,42** | 10 | 634,42 | ✔ |
| SM03 | **647,49** | 6 | 647,49 | ✔ |
| AR11 | **113,48** | 1 | 113,48 | ✔ |
| AS05 | **138,48** | 1 | 138,48 | ✔ |
| AC03 | **794,16** | 6 | 794,16 | ✔ |
| AL01 | **51,25** | 2 | 51,25 | ✔ |
| ALS01 | **489,76** | 9 | 489,76 | ✔ |
| CB22 | **74,79** | 3 | 74,79 | ✔ |

**11/11 exacto.** La columna rotulada **"Saldo BS"** contiene, sin ninguna conversión, **el saldo real
en USD**. Es la prueba directa de que la etiqueta está cruzada: no es una discrepancia de redondeo ni de
tasa, es el mismo número con el rótulo equivocado.

### Confirmación adicional dentro de la propia pantalla de detalle

Las líneas de **Crédito** del mismo detalle usan internamente el saldo **correcto**:

| Cliente | Crédito USD − Crédito Disp. USD | = | Crédito BS − Crédito Disp. BS | = |
|---------|--------------------------------|---|-------------------------------|---|
| AS04 | 2.951.520,00 − 2.949.423,77 | **2.096,23** | 2.177.867.577,60 − 2.176.320.811,41 | **1.546.766,19** |
| CB10 | 1.475.760,00 − 1.475.301,45 | **458,55** | 1.088.933.788,80 − 1.088.595.433,93 | **338.354,87** |
| AV10 | 3.689.400,00 − 3.677.796,78 | **11.603,22** | 2.722.334.472,00 − 2.713.772.688,03 | **8.561.783,97** |
| CH01 | 737.880,00 − 737.245,58 | **634,42** | 544.466.894,40 − 543.998.768,57 | **468.125,83** |

El crédito disponible se calcula restando **2.096,23 USD** (y **1.546.766,19 BS**) — exactamente los
valores que el detalle mostraba bien el 30/07. **La pantalla se contradice a sí misma:** el motor de
crédito usa el saldo correcto, y las dos líneas "Saldo" muestran otra cosa.

### Y el tab Doc. de Venta también está bien

El tab `docVentas` del mismo detalle rotula correctamente (columnas *Saldo* y *Saldo Conversión*):

| Nº Doc | Tasa | Monto Total | Saldo | Saldo Conversión |
|--------|------|-------------|-------|------------------|
| 036332 | 737,88 BS | 450,24 USD | **450,24 USD** | **332.223,09 BS** |
| FF081398 | 737,88 BS | 209,68 USD | 10,49 USD | 7.740,36 BS |
| 037003 | 737,88 BS | 513,27 USD | 513,27 USD | 378.731,67 BS |

`450,24 × 737,88 = 332.223,09` ✓. **Tres fuentes dentro de la misma pantalla (Doc. de Venta, líneas de
Crédito y BD local) coinciden entre sí y contradicen las dos líneas de "Saldo".**

---

## 4. Grupo de control — el detalle **se rompió**

Era el pedido explícito del guion: verificar que el detalle, que estaba bien, siguiera bien.

| | 30/07 (reporte original) | 03/08 (hoy) |
|---|---|---|
| AS04 detalle Saldo USD | `2.096,23` ✅ | `2,84` ❌ |
| AS04 detalle Saldo BS | `1.546.766,19` ✅ | `2.096,23` ❌ |
| CB10 detalle Saldo USD | `458,55` ✅ | `0,62` ❌ |
| CB10 detalle Saldo BS | `338.354,87` ✅ | `458,55` ❌ |

🔴 **El grupo de control falla.** El detalle pasó de correcto a incorrecto, con el saldo del cliente sin
cambios. **Es una regresión introducida por el intento de fix**, y es lo más urgente de este reporte.

---

## 5. Causa raíz observable (sin leer código de producto)

La app está aplicando **una división por la tasa que no corresponde**, porque asume que el saldo que
recibe está en **moneda local (BS)** cuando en realidad llega en **USD** (`document_sales.co_currency =
'USD'` en el 100% de los documentos).

```
valor almacenado (USD)  ──rotulado──►  "Saldo BS"     ← etiqueta equivocada, sin convertir
valor almacenado / 737,88 ──rotulado──► "Saldo USD"   ← conversión de más
```

Correcto sería:

```
valor almacenado          ──►  "Saldo USD"
valor almacenado × 737,88 ──►  "Saldo BS"
```

Es decir: **el operador está invertido (÷ donde va ×) y las dos etiquetas están corridas un lugar.**
El fix aplicado propagó esta misma lógica al detalle en vez de corregirla en el listado.

### ⚠ Observación adjunta (fuera del alcance pedido, no se investigó a fondo)

Las líneas de **Crédito** del detalle tienen **una multiplicación de más**, simétrica al error del saldo.
`clients.nu_credit_limit` en BD son números redondos: AS04 `4000`, CB10 `2000`, CH01 `1000`, AV10 `5000`.
La UI muestra:

| Cliente | `nu_credit_limit` (BD) | UI "Crédito USD" | = límite × 737,88 | UI "Crédito BS" | = límite × 737,88² |
|---------|------------------------|------------------|-------------------|-----------------|---------------------|
| AS04 | 4000 | 2.951.520,00 | ✔ | 2.177.867.577,60 | ✔ |
| CB10 | 2000 | 1.475.760,00 | ✔ | 1.088.933.788,80 | ✔ |
| CH01 | 1000 | 737.880,00 | ✔ | 544.466.894,40 | ✔ |
| AV10 | 5000 | 3.689.400,00 | ✔ | 2.722.334.472,00 | ✔ |

Un límite de crédito de **2.951.520,00 USD** para un abasto no es plausible; el dato de BD es `4000`.
**Se deja anotado como hallazgo separado** — no formaba parte del defecto a verificar y no se profundizó.
Sugiere que el manejo de moneda de la pantalla de clientes tiene el mismo problema en más de un campo.

---

## 6. Cómo reproducirlo a mano (~3 min, sin herramientas)

1. HOME → **Clientes** → **CLIENTES**.
2. Buscar `ABASTO EL SITIO DSG`. Anotar del listado: **Saldo USD 2,84 · Saldo BS 2.096,23**.
3. Abrir el cliente. El detalle muestra **Saldo BS 2.096,23 · Saldo USD 2,84** — los mismos dos números.
4. En el **mismo detalle**, mirar **Crédito USD 2.951.520,00** y **Crédito Disp. USD 2.949.423,77**.
   La resta da **2.096,23** — el saldo que la app dice que son *bolívares* es el que usa como *dólares*.
5. Abrir el tab **Doc. de Venta**: la tasa es **737,88** y el primer documento arrastra **450,24 USD**
   de saldo él solo. Un saldo total de **2,84 USD** es imposible.

---

## 7. Casos ejecutados

| ID | Resultado | Evidencia |
|----|-----------|-----------|
| REG-CLT-SALDOS-001 | ❌ **FAIL** | AS04 · listado `USD 2,84 / BS 2.096,23` = detalle `BS 2.096,23 / USD 2,84`; verdad `USD 2.096,23 / BS 1.546.766,19`. Idéntico al 30/07 en el listado |
| REG-CLT-SALDOS-002 | ❌ **FAIL** | CB10 · listado y detalle `0,62 / 458,55`; verdad `458,55 / 338.354,87` |
| REG-CLT-SALDOS-003 | ❌ **FAIL** | AV10 · listado y detalle `15,73 / 11.603,22`; verdad `11.603,22 / 8.561.783,97` |
| REG-CLT-SALDOS-004 | ❌ **FAIL** | CH01 · listado y detalle `0,86 / 634,42`; verdad `634,42 / 468.125,83` |
| REG-CLT-CONTROL-005 | 🔴 **FAIL (regresión)** | Grupo de control: el DETALLE, correcto el 30/07, hoy muestra los valores cruzados. Saldo del cliente sin cambios |
| REG-CLT-BD-006 | ❌ **FAIL** | Oráculo BD local: en 11/11 clientes `Σ document_sales.nu_balance` (USD) == columna rotulada "Saldo BS" del listado |
| REG-CLT-TASA-007 | ✅ PASS | Tasa vigente leída de la app (tab Doc. de Venta) = **737,88 BS/USD**, sin cambios desde el 30/07. Aritmética por documento correcta (`450,24 × 737,88 = 332.223,09`) |

**Total: 6 FAIL (1 de ellos regresión) · 1 PASS · 0 BLOCKED · 0 N/A**

---

## 8. Notas de ejecución

- 0 cuelgues de CDP · 0 reintentos por selector · watchdog `moduleMs=1800000` sin disparos.
- `__qaH` **no** se instaló: no hizo falta. Se cachearon `connectCdp`/`makeWatchdog`/`waitSyncOverlay`/
  `getActiveView`/`clickBack` en `page.__qa` (patrón `[gmp-20260730]`), una sola vez.
- No se usó `.remove()` sobre ningún overlay. No hubo alerts que descartar en todo el recorrido.
- **No se creó ni envió nada.** No se tocó la cámara ni se instalaron mocks. App devuelta a HOME.
- `automation/db/query.js` **no** se usó (BD nube `global_mp` sin GRANT, según el guion).

### Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **El saldo del cliente NO está en `clients`: se calcula como `SUM(document_sales.nu_balance)`** | universal | `clients` no tiene columna de saldo. `document_sales` (`id_client, nu_balance, co_currency, nu_value_local, nu_amount_total`) es la fuente. Da un oráculo de saldo exacto sin depender de la UI ni de la BD nube |
| `currency_relations.nu_exchange_rate` = **1**, NO es la tasa real | cliente (globalmp) | La tasa vigente (737,88) **no está persistida** en `currency_relations` ni en `global_configuration` (174 claves, 0 matches de tasa/rate/conversión). **Leerla del tab Doc. de Venta**, columna *Tasa* |
| Detalle de cliente: las líneas de **Crédito** sirven de oráculo del saldo | universal | `Crédito USD − Crédito Disp. USD` = saldo real en USD; `Crédito BS − Crédito Disp. BS` = saldo real en BS. Permite validar el saldo **dentro de la misma pantalla**, sin abrir otro tab |
| Lectura de la fila del listado sin abrirla | universal | `app-client-list ion-item` → `innerText` trae `Nombre \| Código: XX \| Saldo USD: … \| Saldo BS: …`. Filtrar por `offsetParent!==null`; el listado carga 50 filas |
| ⚠ **"Listado y detalle coinciden" NO es criterio de aceptación suficiente** | universal | Este fix hizo coincidir ambas pantallas **en el valor equivocado**. Anclar siempre contra la tasa y contra `SUM(nu_balance)` de la BD local |

---

*Agente REGRESIÓN MÓVIL · 7/7 casos ejecutados · solo lectura · app en HOME.*
