# Barrido de COBROS — señal de riesgo antes de liberar la v21 móvil

| Parámetro | Valor |
|---|---|
| RUN_ID | `conciliacion_difranca_20260811` · anexo pedido por QA |
| Playa / empresa | EL YAQUE · **DDHP_A12** (guarda de tenant verificada) |
| Capa | **web + BD** — *no se tocó el dispositivo ni el CDP :9220* |
| Universo | **940 cobros** (desde 01/07/2026) · **1.094 pagos** · conversión medida sobre **2.154 pagos** (desde 01/06) |
| Fecha | 2026-08-11 |

> **Alcance honesto:** esto valida lo que la app móvil **produjo y quedó en la nube**. No sustituye una
> corrida de UI sobre la 21: no prueba pantallas, validaciones de formulario ni flujos. Prueba que los
> datos que la app genera son íntegros y que los cálculos del servidor cuadran.

---

## Resumen: **7 de 7 oráculos en verde. Ningún defecto sistémico.**

| # | Validación | Universo | Resultado |
|---|---|---|---|
| V1 | **Conversión de moneda** — dirección correcta según moneda del cobro | 2.154 pagos | ✅ **100 %** |
| V2 | **Cuadre** `total − Σpagos == diferencia` | 936 cobros con pagos | ✅ **934** (2 excepciones, abajo) |
| V3 | **Doble envío** (`co_collection` repetido) | 940 cobros | ✅ **0 duplicados** |
| V4 | **Integridad de transferencias** (ref + banco + `id_bank` + fecha) | 1.067 pagos `tr` | ✅ **100 %** |
| V5 | **IGTF** | 3 cobros | ✅ **3/3 exactos** |
| V6 | **Fechas futuras / montos ≤ 0** | 1.094 pagos | ✅ **0 y 0** |
| V7 | **Efectivo sin banco/referencia** | 15 pagos `ef` | ✅ correcto por diseño |

---

## V1 · Conversión de moneda — **el defecto del 10/08 NO se reproduce en los datos**

El reporte móvil dejó abierto el defecto *"conversión invertida en cobros USD"* porque la corrida fue
toda en BSD. **Lo medí sobre 2.154 pagos reales y la conversión es correcta y consistente:**

| Moneda del cobro | Pagos | Divide (`m/tasa`) | Multiplica (`m×tasa`) | Ninguna |
|---|---:|---:|---:|---:|
| **BSD** | 645 | **645** ✅ | 0 | 0 |
| **US$** | 1.413 | 0 | **1.409** ✅ | 4 |
| **USD** | 96 | 0 | **96** ✅ | 0 |

**Ambas direcciones son las correctas**, no un error: la conversión va *desde* la moneda del cobro.
Un cobro en BSD se convierte a US$ **dividiendo**; uno en US$ se convierte a BSD **multiplicando**.
Coincide con lo ya documentado en `_comunes.md` (El Valle: `30,00 US$ × 725,75 = 21.772,50`).

⇒ **Si el defecto del 10/08 existe, es de PRESENTACIÓN en el Tab Total de la app, no de los datos
persistidos.** Eso acota mucho dónde buscarlo y confirma que no contamina la nube.

## V5 · IGTF — los 3 cuadran al céntimo

| # Ref | Total | IGTF grabado | Base (`total − igtf`) | 3 % de la base | ✓ |
|---|---:|---:|---:|---:|:-:|
| 21824 | 88,47 US$ | 2,58 | 85,89 | **2,5767 → 2,58** | ✅ |
| 21838 | 381,10 US$ | 11,10 | 370,00 | **11,10** | ✅ |
| 21844 | 390,99 US$ | 11,39 | 379,60 | **11,388 → 11,39** | ✅ |

⚠ **Matiz para la memoria del piloto:** la base del IGTF **no** es el "Total a pagar" final, sino el
total **menos** el IGTF — es decir, el total mostrado **ya lo trae embebido** (`base × 1,03 = total`, y
`nu_amount_final == nu_amount_total`). Encaja con la *"diferencia fantasma con IGTF embebido"* que
reportó el agente móvil: el importe está bien calculado, lo confuso es cómo se presenta.

---

## Lo que sí conviene mirar (3 puntos, ninguno sistémico)

### 🔴 P-1 · Cobro `21563` — pagos capturados en BSD dentro de un cobro en US$

| Campo | Valor |
|---|---|
| Fecha / vendedor | 27/07/2026 · `id_user` 274 · cliente RIMA 22 C.A |
| Moneda del cobro | **US$** · tasa 737,88 |
| Total | **1.940,71 US$** (conversión a BSD 1.432.011,09 ✅ correcta) |
| 3 pagos | 360.000,00 · 670.000,00 · 569.649,10 → **Σ 1.599.649,10** |
| `nu_difference` | **−1.234.449,29** |
| `nu_difference_conversion` | **−910.875.442,11** |

Los importes de los pagos (360 mil, 670 mil) son inequívocamente **bolívares**, pero el cobro es en
**US$**, así que el sistema los trató como dólares: convirtió `360.000 × 737,88 = 265.402.800` y calculó
la diferencia restando **US$ menos BSD**. De ahí el número de 910 millones.

**Es un caso único en 940 cobros.** No sé si el origen es captura del vendedor o un fallo de la app al
no fijar la moneda del pago a la del cobro — **eso solo se dirime probando el formulario en la 21**.
Lo que sí es seguro: **no hay ninguna barrera que impida que vuelva a pasar**, y el resultado es un
cobro con una diferencia disparatada en producción.

⇒ **Sugerencia de caso para la corrida móvil de la 21:** crear un cobro en **US$** y cargar un pago con
un importe de magnitud "bolívar"; verificar si la app avisa, convierte o lo acepta en silencio.

### 🟡 P-2 · Cobro `21032` — la diferencia no descuenta el pago

Cobro BSD del 09/07 (`id_user` 276): total **42.823,23**, **un pago de 36.917,29**, y sin embargo
`nu_difference = 42.823,23` — **exactamente el total**, como si no se hubiera cobrado nada.
Lo esperable era `42.823,23 − 36.917,29 = 5.905,94`.

También único en 940. Puede ser un pago agregado después de calcular la diferencia (orden de guardado).
Vale una mirada al momento en que la app calcula `nu_difference` respecto de cuándo persiste los pagos.

### 🟡 P-3 · 4 cobros enviados **sin un solo método de pago** — y son del propio piloto QA

`21826` (900 USD) · `21829` (1.500 BSD) · `21841` (2.200 BSD) · `21842` (162 US$).

Los 4 tienen **documentos aplicados** en `collection_detail` (`nu_amount_paid` = 900 / 1.500 / 2.200 /
162) pero **cero filas** en `collection_payment`, y aun así están **`st_collection = 1` (Enviado)** con
`nu_difference = 0`, o sea declarando que cuadran.

**Verificación que separa artefacto de defecto:** filtré todos los cobros con documentos y sin pagos
desde enero de 2025. Salen **exactamente estos 4**, **todos del `id_user` 275** (el usuario del piloto)
y **todos del 07 y 10 de agosto** — las fechas de nuestras propias corridas de automatización.
**En 20 meses, ningún vendedor real generó uno.**

⇒ **No es un patrón de producción**; son residuos de corridas QA que quedaron a medias. Pero deja dos
cosas sobre la mesa:

1. **El backend los aceptó.** Un cobro con dinero aplicado a facturas y sin forma de pago no debería
   poder llegar a `Enviado`. No hay validación server-side que lo impida.
2. **Hay 4 cobros basura en producción** creados por el piloto (4.762 en importe mezclado). Conviene
   decidir con la QA si se anulan — yo no toco nada: **el agente web es read-only** salvo la subida de
   extractos de la conciliación.

---

## Lo que este barrido NO cubre

- **Nada de UI de la app.** Validaciones de formulario, mensajes, tolerancia 0, toggle de pago parcial,
  adjuntos obligatorios: todo eso exige conducir la 21 en el dispositivo.
- **Cobros que la app no llegó a enviar** (quedaron `Guardado`/`Por enviar` en el teléfono): por
  definición no están en la nube y este barrido no los ve.
- **Devoluciones, depósitos y su enlace con cobros.**

---

## Recomendación

**Desde el lado de los datos, cobros está en condiciones de recibir la 21.** Los cálculos que importan
—conversión, cuadre, IGTF, integridad de referencias bancarias— dan verde sobre volumen real, y no hay
duplicados por doble envío, que es el fallo más caro en una release móvil.

Los 3 puntos abiertos son **casos aislados (2) y basura propia (1)**; ninguno bloquea. El único que
merece un caso explícito en la corrida de la 21 es **P-1** (moneda del pago vs moneda del cobro).

---

*Barrido hecho desde web + BD, read-only. Sin tocar dispositivo ni CDP. Ningún control de escritura de
la web fue accionado.*
