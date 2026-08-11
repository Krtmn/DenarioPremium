# Re-verificación móvil — `CLT-CREDITO-DISPONIBLE-MONEDA-CRUZADA`

| Parámetro | Valor |
|-----------|-------|
| Fecha | 2026-08-11 |
| Tenant / Playa | **difranca** — EL YAQUE |
| Empresa | **DDHP_A12** — `*DISTRIBUIDORA DIAZ` |
| Módulo | CLIENTES — detalle de cliente (`app-client-detail`) |
| Dispositivo | `14678405BR003855` (Infinix X6728, Android 15, viewport 360×744) |
| CDP | `127.0.0.1:9220` → `webview_devtools_remote_31824` |
| Alcance | **Solo lectura** — no se creó, editó ni borró ningún registro |
| **Veredicto** | ❌ **SIGUE** |

---

## 1. Caso principal — `CAR064` MAXICENTER MIRANDA, C.A.

### Números crudos leídos en pantalla

Rótulos transcritos **tal cual aparecen** en el detalle (sin interpretar la moneda):

| Rótulo en pantalla | Monto |
|---|---|
| `Saldo BSD:` | **3.041.948,34** |
| `Saldo US$:` | **4.044,66** |
| `Crédito BSD:` | **367.667.695,12** |
| `Crédito Disp. BSD:` | **367.663.650,46** |
| `Crédito US$:` | **488.861,30** |
| `Crédito Disp. US$:` | **488.855,92** |

> ⚠ La pantalla muestra **dos pares** de crédito (BSD y US$), no uno solo. Las mediciones previas del 10/08
> sólo registraron el par **US$**. Se midieron **ambos** para no depender de la lectura de un solo rótulo.
> El rótulo de moneda fuerte que la UI dibuja es literalmente **`US$`** (el componente expone
> `hardCurrency = "US$"`, `localCurrency = "BSD"`).

### La cuenta

**Par US$** (el mismo par de las mediciones del 10/08):

```
Crédito US$ − Crédito Disp. US$  =  488.861,30 − 488.855,92  =  5,38
Saldo US$                                                    =  4.044,66
Saldo US$ ÷ 752,09               =  4.044,66 ÷ 752,09        =  5,3779 ≈ 5,38   ✔ coincide
```

`Crédito − Crédito Disponible` **no** da el Saldo: da el Saldo **dividido por la tasa**.

**Par BSD** (confirma el cruce de moneda de forma aún más directa):

```
Crédito BSD − Crédito Disp. BSD  =  367.667.695,12 − 367.663.650,46  =  4.044,66
Saldo BSD                                                            =  3.041.948,34
Saldo BSD ÷ 752,09               =  3.041.948,34 ÷ 752,09            =  4.044,66   ✔ exacto
```

Lo que se descuenta del crédito **en bolívares** es exactamente **4.044,66**, que es el **Saldo en dólares**
— no el saldo en bolívares. **La resta cruza la moneda: descuenta el importe en US$ contra un crédito
expresado en BSD.** El mismo desplazamiento de un escalón de tasa se repite en el par US$, donde lo
descontado (5,38) es el saldo en dólares dividido **otra vez** por la tasa.

### Contraste con el veredicto pedido

| Criterio | Esperado | Medido | |
|---|---|---|---|
| `Crédito − Crédito Disp.` ≈ `Saldo` | 4.044,66 | **5,38** | ❌ |
| `Crédito − Crédito Disp.` ≈ `Saldo ÷ 752,09` | 5,3779 | **5,38** | ✅ coincide con el caso ROTO |

⇒ **SIGUE.**

### Tasa y coherencia interna de la pantalla

La tasa **no se asumió**: se derivó de la propia pantalla y da **752,0900** exacta en los dos clientes.

```
Saldo BSD ÷ Saldo US$  =  3.041.948,3394 ÷ 4.044,66  =  752,0900
```

Además el Saldo US$ está corroborado por los propios documentos del cliente:
`Σ allDocuments.nuBalance` (16 documentos) = **4.044,66** = `saldoFuerte` **exacto**.
⇒ El Saldo que muestra la pantalla es correcto; **lo que está mal es el Crédito Disponible.**

---

## 2. Cliente de confirmación — `CAR755` MULTIDISTRIBUIDORA JAKE, C.A

### Números crudos leídos en pantalla

| Rótulo en pantalla | Monto |
|---|---|
| `Saldo BSD:` | **47.023.577,39** |
| `Saldo US$:` | **62.523,87** |
| `Crédito BSD:` | **2.262.570.408,35** |
| `Crédito Disp. BSD:` | **2.262.507.884,48** |
| `Crédito US$:` | **3.008.377,20** |
| `Crédito Disp. US$:` | **3.008.294,07** |

### La cuenta

```
Par US$:  3.008.377,20 − 3.008.294,07        =  83,13
          Saldo US$                          =  62.523,87
          62.523,87 ÷ 752,09                 =  83,1334 ≈ 83,13   ✔ coincide

Par BSD:  2.262.570.408,35 − 2.262.507.884,48 =  62.523,87
          Saldo BSD                           =  47.023.577,39
          47.023.577,39 ÷ 752,09              =  62.523,87        ✔ exacto
```

Idéntico patrón: al crédito en **BSD** se le descuenta el saldo en **US$**, y al crédito en **US$** se le
descuenta ese importe dividido otra vez por la tasa. Corroboración del saldo:
`Σ allDocuments.nuBalance` (149 documentos) = **62.523,87** = `saldoFuerte` exacto.

---

## 3. Resumen de las 4 mediciones

| Cliente / par | `Crédito − Crédito Disp.` | `Saldo` | `Saldo ÷ 752,09` | `Saldo / diferencia` |
|---|---|---|---|---|
| CAR064 · US$ | 5,38 | 4.044,66 | 5,3779 | **751,80** |
| CAR064 · BSD | 4.044,66 | 3.041.948,34 | 4.044,66 | **752,09** |
| CAR755 · US$ | 83,13 | 62.523,87 | 83,1334 | **83,13 → 752,12** |
| CAR755 · BSD | 62.523,87 | 47.023.577,39 | 62.523,87 | **752,09** |

En las 4 mediciones el cociente `Saldo / (Crédito − Crédito Disp.)` da **752** (las desviaciones 751,80 y
752,12 son sólo el redondeo a 2 decimales de los montos que la UI dibuja). Si el defecto estuviera
arreglado, esa columna daría **1,00**.

---

## 4. Veredicto

> ❌ **`CLT-CREDITO-DISPONIBLE-MONEDA-CRUZADA` SIGUE** — el fix **no** entró en este build.

El Crédito Disponible sigue descontando la deuda **en la moneda equivocada**, subestimando la deuda
**~752×** (la tasa vigente). Reproducido en **2 clientes** y en **los 2 pares de moneda** de cada uno
(4/4 mediciones), con la pantalla contradiciéndose sola: el Saldo que ella misma muestra —y que además
cuadra exacto contra la suma de sus documentos— no es el que resta del crédito.

**Impacto:** un cliente con deuda real de 4.044,66 US$ aparece consumiendo sólo 5,38 US$ de su cupo. El
control de límite de crédito es **inoperante**: prácticamente ningún cliente llegaría a bloquearse por
deuda. Con `showCreditLimit=true` en difranca, esto afecta a toda la cartera.

**Recomendación:** no liberar la versión 21 con este defecto abierto, o liberar con la restricción de
crédito documentada como no confiable.

### Contexto respecto de mediciones anteriores

| Fecha | Fuente | `Crédito US$ − Disp. US$` | `Saldo US$` | Resultado |
|---|---|---|---|---|
| 10/08 | agente | `488.861,30 − 488.855,92 = 5,38` | 4.044,66 | ❌ |
| 10/08 | QA a mano | `488.861,30 − 488.856,68 = 4,62` | 3.471,61 | ❌ |
| **11/08** | **agente (esta)** | `488.861,30 − 488.855,92 = 5,38` | **4.044,66** | ❌ |

El saldo de hoy (4.044,66) coincide con el de la medición del agente del 10/08 — **no hubo cobros
aplicados en el intervalo** —, pero el veredicto **no depende de ese número**: se contrastó contra el
saldo mostrado **hoy en la misma pantalla**, y la relación `÷752,09` se sostiene en las 4 mediciones.

---

## 5. Notas de ejecución

- La app se encontró en **HOME**, limpia (0 alerts, 0 modales, 0 loadings) — no había ningún flujo de la QA
  en curso. Al terminar se devolvió a **HOME**.
- **No se hizo login ni se cambió de usuario.** No se alcanzó en ningún momento la pantalla de login.
- **Sin escrituras:** sólo navegación de lectura (HOME → CLIENTES → lista → detalle → back).
- `window.ng = true` en este build, lo que permitió corroborar los valores contra el modelo Angular
  (`nuCreditLimitConversion`, `availableCreditConversion`, `saldoLocal`, `saldoFuerte`, `allDocuments`)
  además de leerlos del DOM. Ambas fuentes coinciden.
- **BD:** no se consultó — la pantalla se contradice sola y no hacía falta (así estaba especificado).

### Patrones / selectores nuevos

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| El detalle de cliente muestra **2 pares** de crédito (`Crédito BSD` / `Crédito Disp. BSD` **y** `Crédito US$` / `Crédito Disp. US$`), no uno | universal (multiCurrency) | Medir **los dos pares**: el par en moneda local hace el cruce de moneda evidente sin dividir nada (la diferencia da literalmente el Saldo de la *otra* moneda). Medir sólo el par US$ obliga a dividir por la tasa para ver el defecto. |
| `ng.getComponent(app-client-detail)` expone `nuCreditLimitConversion` / `availableCreditConversion` (strings ya formateados = lo que se dibuja) + `localCurrency` / `hardCurrency` | universal | Da el rótulo de moneda **sin interpretarlo** (`hardCurrency="US$"`) y evita depender del parseo de `innerText`. Complementa el oráculo `allDocuments`/`saldoFuerte`/`saldoLocal` de `[difranca-20260807]`. |
| Tasa derivable de la propia pantalla: `saldoLocal ÷ saldoFuerte` | universal | Dio **752,0900** exacta en los 2 clientes — evita hardcodear la tasa o ir al tab Doc. de Venta a buscarla. |
| Oráculo de veredicto robusto al saldo cambiante: `Saldo ÷ (Crédito − Crédito Disp.)` | universal | Debe dar **1,00** si está arreglado y **≈ la tasa** si sigue roto. Es inmune a que el saldo cambie entre mediciones por cobros aplicados. |
