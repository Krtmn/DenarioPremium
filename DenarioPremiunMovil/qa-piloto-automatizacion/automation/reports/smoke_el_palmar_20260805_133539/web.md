# Capa WEB — RUN 20260805_133539_smoke-completo · cliente el_palmar

## Alcance especial pedido por QA

> «En el móvil validás los cobros ya enviados, pero **en la web necesito que valides TODOS LOS COBROS DE HOY**,
> porque no todos salen en el móvil, y hay que asegurarse de que los cálculos estén bien: **retenciones, IGTF,
> pago parcial, dev/faltantes, todo**.»

El universo no fue el manifiesto sino **los 18 cobros del 2026-08-05** extraídos de BD (ids 27068-27085),
en **las 2 empresas**.

Playa `isla_coche` · `http://denarioislacoche.ddns.net:8080/DenarioPremium` · usuario `***`/`***`
Tasa en los 18: **652,9726 VES = 1 USD** · vendedor `id_user` 266 (Dilcia Duarte, login 1276)
**Estatus literal que muestra la web para los 18: `Enviado`** (con `st_collection=1`).
Modo **READ-ONLY**: solo `Consultar`, `Buscar` y el `<select>` Empresa.

**Guarda de tenant (la lección de ayer, aplicada):** los 3 detectores pasaron — 2 empresas exactas
(`1|CENTRAL EL PALMAR, S.A.`, `2|C.A. DESTILERIA YARACUY`), vendedor 266 presente, refs en el orden 27068-27085.

## Resultado global

**11 WEB-OK · 7 WEB-CALC-MISMATCH · 0 WEB-MISSING · 0 WEB-FIELD-MISMATCH · 0 WEB-N/A**
Cliente, empresa, moneda y `nu_amount_final` de los 18 coinciden con BD.

| # Ref | co_type / rótulo web | Empresa | Mon | Total a pagar (web) | Σ pagos | Σ "Monto a pagar" docs | BD final | Marca |
|---|---|---|---|---|---|---|---|---|
| 27068 | 4 · **Cobro 25%** | YARACUY | VES | 700,0000 | 700,00 | 200+500=700 ✅ | 700 ✅ | **WEB-OK** |
| 27069 | 2 · Retención | PALMAR | VES | 500,0000 | (sin pagos) | **1.389.888,5686** ✗ | 500 | **WEB-CALC-MISMATCH** |
| 27070 | 0 · Cobros | PALMAR | VES | 560.100,0000 | 560.100,00 ✅ | 560.100,00 ✅ | 560.100 ✅ | **WEB-OK** |
| 27071 | 0 · Cobros | YARACUY | VES | 5.000,0000 | 5.000,00 ✅ | 2.000+2.000+1.000 ✅ | 5.000 ✅ | **WEB-OK** |
| 27072 | 0 · Cobros | YARACUY | VES | 29.357.697,5449 | ✅ | 29.357.197,5449+500 ✅ | ✅ | **WEB-OK** |
| 27073 | 1 · Anticipo/Prepago | PALMAR | VES | Monto pagado 1.700,0000 | 1.700,00 ✅ | **sin tabla docs** | 1.700 ✅ | **WEB-OK** |
| 27074 | 2 · Retención | PALMAR | VES | 6.700,0000 ✅ | (sin pagos) | 600+3.000+3.100 ✅ | 6.700 ✅ | **WEB-OK** |
| 27075 | 4 · **Cobro 25%** | PALMAR | USD | 375,0000 | 375,00 ✅ | 375,00 ✅ | 375 ✅ | **WEB-OK** |
| 27076 | 0 · Cobros (`igtf_cob`) | PALMAR | USD | 109,4478 | 50+59,4478 ✅ | 21,8978+9,888 | 109,4478 ✅ | **WEB-CALC-MISMATCH** |
| 27077 | 0 · Cobros (`cob4`) | PALMAR | USD | 2.000,9400 | 2.000,94 ✅ | 2.000,94 ✅ | ✅ | **WEB-CALC-MISMATCH** |
| 27078 | 0 · Cobros (`igtf_sep`) | PALMAR | USD | 858,6600 | 858,66 ✅ | 858,66 ✅ | ✅ | **WEB-OK** |
| 27079 | 2 · Retención | PALMAR | VES | 700,0000 | (sin pagos) | **1.562.590,87** ✗ | 700 | **WEB-CALC-MISMATCH** |
| 27080 | 2 · Retención | PALMAR | VES | 500,0000 | (sin pagos) | **1.427.303,8985** ✗ | 500 | **WEB-CALC-MISMATCH** |
| 27081 | 2 · Retención | PALMAR | VES | 700,0000 ✅ | (sin pagos) | 700,00 ✅ | 700 ✅ | **WEB-OK** |
| 27082 | 0 · Cobros | PALMAR | USD | 858,6600 | 858,66 ✅ | 858,66 ✅ | ✅ | **WEB-CALC-MISMATCH** |
| 27083 | 3 · **IGTF** | PALMAR | VES | 16.820,4436 | 10.000+6.820,4436 ✅ | ✅ | ✅ | **WEB-OK** |
| 27084 | 0 · Cobros | PALMAR | VES | 10.000,0000 | 10.000 ✅ | 10.000 ✅ | ✅ | **WEB-OK** |
| 27085 | 0 · Cobros | PALMAR | USD | 2.350,4000 | 2.350,40 ✅ | 2.350,40 ✅ | ✅ | **WEB-CALC-MISMATCH** |

### Oráculo de cabecera deducido y validado (aporte nuevo)

```
Total Monto a pagar = Σ(Saldo doc) − Total descuento − (Ret. IVA + Ret. ISLR)
                      − Σ(Diferencia/Faltante) + Monto total IGTF
```

Verificado exacto en 27070 (`560.681,4527 − 581,4527 = 560.100`) y en 27076
(`406,26 − 290 − 10 = 106,26`; `+3,1878 = 109,4478`).
Y **`Monto total base` = Σ(`Saldo doc.`)**, no Σ(`Monto doc`).

---

## ✅ A5 · DEFECTO CONOCIDO **YA CORREGIDO** — no es hallazgo nuevo

> **Aclarado por la responsable QA (2026-08-05):** los 3 cobros son **residuo de un defecto conocido y ya
> corregido**: *se podía enviar una retención con documentos seleccionados a los que no se les configuraban
> los datos de retención*. **El fix ya fue comprobado manualmente**: hoy exige que **todos** los documentos
> tengan sus datos de retención para poder enviar.
> ⇒ Lo que la web muestra es el reflejo fiel de datos malformados creados bajo el defecto viejo, **no un bug
> de la web**. **NO reportar.**
>
> ⚠ **Nota de build, no bloqueante:** los 3 registros tienen fecha de **hoy** (27069 16:32 · 27079 17:06 ·
> 27080 17:08), o sea que **la APK instalada en el dispositivo todavía permite crearlos**. Si el fix ya está
> montado en otro build, el de esta corrida no lo trae. Dato a tener en cuenta al interpretar el resto de la
> corrida.

### Detalle técnico (se conserva como evidencia del síntoma)

Afecta a **27069, 27079 y 27080**. Los tres tienen un **segundo documento sin retención** cuyo `Monto a pagar`
es el **saldo completo** de la factura, y la cabecera **no lo suma**:

| Ref | doc con retención | doc SIN retención (`Monto a pagar`) | Σ de las filas | Cabecera dice | Desfase |
|---|---|---|---|---|---|
| 27069 | `0092002389` 500,00 | `0092002424` **1.389.388,5686** | 1.389.888,5686 | **500,0000** | 1.389.388,5686 |
| 27079 | `0091021644` 700,00 | `0092002888` **1.561.890,8700** | 1.562.590,8700 | **700,0000** | 1.561.890,8700 |
| 27080 | `0092002424` 500,00 | `0092002426` **1.426.803,8985** | 1.427.303,8985 | **500,0000** | 1.426.803,8985 |

**La cabecera es incoherente consigo misma:** el `Monto total base` **sí** suma los dos documentos
(27080: `1.389.388,5686 + 1.426.803,8985 = 2.816.192,4671` ✅), pero el `Total Monto a pagar` solo refleja la
retención. **El usuario ve una retención de 500 Bs junto a un documento de 1,4 millones "a pagar" en la misma
pantalla.**

En **27074 y 27081 no ocurre**, porque **todos** sus documentos llevan retención. Ese es exactamente el
discriminador.

> ⚠ **Es DISTINTO de `COB-RET-TOTAL-CERO`** (que da 0,00): acá da la retención sola, no cero.
> Y se relaciona con el defecto que QA reporta desde el móvil — *dejar enviar una retención con un documento
> sin configurar* —: **este es el síntoma del mismo dato en la web**.

**Observación menor (27074):** el documento `DOC_test_extra` tiene `Monto doc 0,0000` / `Saldo 0,0000` pero
acepta retención IVA 100 + ISLR 500 = 600,00, y la web lo muestra sin objetar — retención sobre un documento
de importe cero.

## 🔴 A1 · CONFIRMADA — `nu_amount_total = 0` degrada la lista a "N/A"

Afecta a **27076, 27077, 27082, 27085**. La hipótesis "cobro sin métodos de pago" queda **descartada**: los 4
tienen pagos y suman exacto al `final`.

**El usuario NO ve un cobro de importe 0**: ni la lista (`Monto cobrado`, `Total por cobrar`) ni el detalle
(`Total Monto a pagar`) leen `nu_amount_total`. **Pero sí se rompe un campo, con correlación perfecta
(4/4 sí · 14/14 no):** en la **lista**, los 4 muestran

```
Monto conv. = "N/A VES"      Tasa conv. = "N/A"
```

mientras `Por cobrar conv.` sí calcula bien.

**Contraste directo, mismo importe y misma factura:** 27078 y 27082 son ambos 858,6600 USD sobre la factura
`0091009412`. El 27078 tiene `total=858,66` y muestra `Monto conv. = 560.681,4527 VES`; el 27082 tiene
`total=0` y muestra **N/A**. El detalle de 27082 sí convierte (`Tasa de conversión: 652,9726`).

⇒ **La columna `Monto conv.` de la lista se deriva de `nu_amount_total` y degrada a "N/A" cuando vale 0.**
Defecto de doble origen: el rollup no se hace **y** la lista no tiene respaldo.

## 🔴 A2b · NUEVO — conversión huérfana en 27076

Documento `0091021104`: `Diferencia/Faltante = 0,0000` pero `Dif/Faltante conversión = 49.234,1340 VES`
(= **75,4000 USD** × tasa). BD confirma: `nu_amount_discount=0.0000` /
`nu_amount_discount_conversion=49234.1340` / `has_discount=false`. La fila hermana (`0091025420`) sí es
coherente (10,0000 → 6.529,7260).

⚠ **No es el defecto conocido de dirección**: acá el cobro es USD y multiplicar es lo correcto. El síntoma es
**base cero con conversión no cero**. Cae en la misma familia de campos ya reportada (descuento / dev-faltante)
→ queda marcado para que QA decida si es el mismo defecto o uno nuevo.

## ✅ A2 · IGTF embebido (27076) — CUADRA, con la regla del producto

```
base 406,2600  −  descuento 0  −  (IVA 150 + ISLR 140)  −  Dif/Faltante 10,0000  =  106,2600
IGTF = 106,2600 × 3%                                                             =    3,1878  OK
Total a pagar = 106,2600 + 3,1878                                                =  109,4478  OK
Σ pagos = 50,0000 (Efectivo) + 59,4478 (Transferencia)                           =  109,4478  OK
```

**La base del IGTF es el total a pagar (106,26), NO el efectivo** (que es 50,00 → habría dado 1,50).
**Regla del producto confirmada en la web. No cobra de más.** Conversiones del pie ✅.

## ✅ A3 · DESCARTADA — 27078 no tiene IGTF inconsistente: es el modo IGTF SEPARADO

La web muestra `Monto total IGTF: 0,0000 USD` en 27078 — **no muestra ningún IGTF fantasma**, coherente con
`nu_amount_igtf=0` / `has_igtf=false`. El `nu_igtf=3` guardado es solo la **tasa configurada**.

Lo delatan los comentarios que dejó QA en el móvil: **27076 = `igtf_cob`** (embebido) vs
**27078 = `igtf_sep`** (separado). El IGTF de 27078 se emitió como **cobro aparte 27083** (`co_type=3`):

```
858,6600 USD × 652,9726 = 560.681,4527 VES   ×  3%  =  16.820,4436 VES  ==  total de 27083   (exacto)
```

⇒ **No es defecto.** El par (27078, 27083) es la evidencia de que existen dos modos de IGTF y ambos cierran.

## ✅ A4 · RESUELTO — qué son los `co_type` 3 y 4

El `<select>` **`Tipo Cobro`** del filtro de `/pages/cobros` expone el enum completo:

```
0 = Cobros · 1 = Anticipo/Prepago · 2 = Retención · 3 = IGTF · 4 = Cobro 25%
```

- **`co_type = 3` → "IGTF".** Tiene pagos y tiene `documentosPagadosDT` con **un documento sintético**
  `co_document = IGTF-<epoch>` y `co_type_doc = 'IGTF'`, sin retenciones. Es el vehículo del **IGTF separado**.
  ⚠ En 27083 el detalle rotula **ambos** pagos como **"Prepago Automático"** aunque BD guarda `de` (depósito)
  y `ef` (efectivo), y la lista los muestra como `de:`/`ef:` — **discrepancia de rótulo lista↔detalle**.
- **`co_type = 4` → "Cobro 25%".** Pagos y documentos normales, sin retenciones. **No aplica ningún 25%
  visible**: en 27075 el documento de 375,00 USD se paga completo y en 27068 se pagan 200+500 sobre saldos
  enormes. El nombre no describe la aritmética observada → **QA debe confirmar la semántica esperada**.
- **Ninguno de los dos es dev/faltantes.** Eso vive en la columna **`Diferencia/Faltante`** de
  `documentosPagadosDT` dentro de cobros normales (27077 con 426,00 · 27076 con 10,00).

## ✅ A6 · Pago parcial — correcto en 4/4

| Ref | Doc | Monto a pagar | Monto doc | Rollup |
|---|---|---|---|---|
| 27068 | `0099000712` / `0100…2023` | 200,00 / 500,00 | 33.241.940,4935 / 138.112,90 | 700 = cabecera = Σ pagos ✅ |
| 27071 | 3 docs | 2.000 / 2.000 / 1.000 | 30,6M / 33,2M / 138.112,90 | 5.000 ✅ |
| 27072 | `0100…2023` | 500,00 | 138.112,90 | 29.357.697,5449 ✅ |
| 27084 | `0091021644` | 10.000,00 | 114.270,2050 | 10.000 ✅ |

## Defectos conocidos — veredicto en esta playa

| Defecto | Veredicto |
|---|---|
| `COB-RET-TOTAL-CERO` (retención muestra `Total Monto a pagar: 0,00`) | 🟢 **NO REPRODUCE.** Los 5 cobros de retención muestran su total correcto (700 / 6.700 / 500…), pese a que la tabla de pagos dice "No se encontraron registros". **Parece ya corregido en el build de Isla Coche** |
| Conversión que multiplica en vez de dividir (descuentos manuales y dev/faltantes) | ⚠ **NO EVALUABLE HOY.** Los únicos descuentos/dev-faltantes de la corrida están en cobros **USD** (27076: 10,00 → 6.529,7260 · 27077: 426,00 → 278.166,3276), donde **multiplicar es lo correcto** y ambos dan bien. **No hay ningún dev/faltante ni descuento manual en un cobro VES**, que es donde el defecto se manifestaría ⇒ **queda sin cobertura, hace falta un caso VES** |

En los 18 cobros se revisaron **todas** las conversiones de pie, pagos y documentos: **VES→USD divide y
USD→VES multiplica, sin excepción**. La única anomalía direccional es la conversión huérfana de A2b.

## Patrones y selectores nuevos — playa `isla_coche`

**Guarda de tenant:** `[id$=":idEnterprise_input"]` trae `1|CENTRAL EL PALMAR, S.A.` y
`2|C.A. DESTILERIA YARACUY`. ⚠ **El `value` del select es `1`/`2` posicional, NO el `co_enterprise`
1002/1003** — no compararlo contra BD. El select de vendedores usa **`id_user` como value y el nombre como
label**: `266|Dilcia Duarte` (el login `1276` **no aparece**; buscar por id).

**🔑 Catálogo de tipos gratis, sin BD:** el `<select id$=":idTipo_input">` de `/pages/cobros` expone el enum
completo de `co_type` con sus rótulos. Es la forma barata de resolver un `co_type` desconocido — mejor que el
catálogo `statuses`.

**🔑 `browser_navigate` a `/pages/cobros` NO pierde el filtro** en esta playa (contra lo documentado): el
estado (empresa, fechas, moneda) **sobrevive en la sesión JSF** y la lista vuelve con las mismas filas y los
**mismos índices**. Permitió el ciclo barato `navigate → click #form\:cobrosDT\:N\:consultar → leer`, 15 veces
seguidas. (Cambiar el `<select>` Empresa **sí** obliga a `Buscar` de nuevo.)

**🔑 Bundle DOM persistente entre páginas (ahorra ~40 % de tokens):** el bundle no sobrevive a `navigate`,
pero **`sessionStorage` sí**. Guardar `install.toString()` una vez y arrancar cada página con el bootstrap de
una línea `()=>{eval('('+sessionStorage.qa+')()'); return Q.DET()}`.

**Detalle de cobro — DOS reglas opuestas, hay que usar las dos:**
- **Cabecera** (`No. de Ref.`, `Estatus`, `Fecha`, `Nombre del cliente`, `Vendedor`, `Empresa`, `Responsable`,
  `Diferencia de cobro`, `Comentario`, `Ubicación`) → **hoja siguiente** (`leerHojas` + emparejar).
- **Pie de totales** (`Monto total base`, `…descuento`, `Retención IVA/ISLR`, `Monto total IGTF`,
  `Total Monto a pagar`, `Tasa de conversión` + sus `… conversión`) → **mismo padre** (`leerCabecera`).
  Con la regla de cabecera el pie sale **vacío**, y `Tasa de conversión` se contamina con `"Documentos Pagados"`.

**El pie CAMBIA de forma según el tipo de cobro** (no asumir campos fijos):
- Anticipo (`co_type=1`): pie **reducido** a `Monto pagado` / `… conversión` / `Tasa`, y `documentosPagadosDT`
  **ausente**.
- Retención (`co_type=2`): aparecen `Retención IVA`/`ISLR`; tabla de pagos = `"No se encontraron registros."`.
- **Si IVA o ISLR valen 0, la etiqueta directamente no se renderiza** (27069, 27080 no tienen
  `Retención ISLR`). Leer con `??`, no asumir presencia.

**Los comentarios del móvil como oráculo:** QA dejó marcas semánticas en `Comentario` (`igtf_cob`, `igtf_sep`,
`ret`, `antici`, `cob25`, `cob4`) que resolvieron A3 y A4 **más rápido que la BD**. Vale pedirlas siempre.

**Notas de BD para el próximo agente:**
- 🔴 `collection_payment.nu_collection_payment` = **número de cuenta**, NO el importe. El importe está en
  `nu_amount_partial`. Contarlo como importe da falsos "pagos vacíos".
- `collection_detail` de un `co_type=3` trae `co_type_doc='IGTF'` y `co_document='IGTF-<epoch>'`.
- `nu_amount_paid_conversion` sin convertir en 27075 (375,0000 en vez de 244.864,7250) **no es visible en la
  web** (no existe columna `Monto a pagar conversión`) ⇒ nota de BD, no defecto web.

**Confirmado del brief previo:** `documentosPagadosDT` es semántico y estable (22 columnas); la tabla de pagos
es `form:j_idt177` → anclar con `tablaPorColumnas(['Forma de pago','Monto cobrado'])`; el descuento del
documento se muestra en `Diferencia/Faltante`. Prefijo de filtros en Isla Coche: `form:j_idt116:*` (anclar
por sufijo funcionó al 100 %).

---
*Generado por Claude Code · Agente WEB read-only · 2026-08-05*

---

> ✅ consolidado 2026-08-05

# 2Âª tanda WEB â€” registros creados por el mÃ³vil

**Guarda de tenant:** âœ… verificada en las dos pÃ¡ginas â€” empresas `CENTRAL EL PALMAR, S.A.` +
`C.A. DESTILERIA YARACUY`, vendedor `266|Dilcia Duarte` presente en el select.

ðŸ”´ **El `value` del select de Empresa NO es uniforme entre mÃ³dulos:** en `/pages/devoluciones` es posicional
(`1|CENTRAL EL PALMAR`, `2|DESTILERIA YARACUY`), pero en `/pages/clientesPotenciales` es el `co_enterprise`
(`1002|CENTRAL EL PALMAR`, `1003|DESTILERIA YARACUY`). **Anclar por TEXTO de la opción, nunca por value.**

âš  En ambos mÃ³dulos el filtro venÃ­a preseleccionado en **DESTILERIA YARACUY** â†’ sin cambiarlo, ambos registros
salen invisibles y se cantarÃ­a un `WEB-MISSING` falso. Rango de fechas por defecto `01/08/2026 â†’ 05/08/2026`.

## DW-CLT-001 Â· Cliente potencial Â· Ref 31 â†’ **WEB-OK**

Localizado barriendo la lista con filtro empresa + vendedor + fechas: 1 sola fila.

| Campo | Móvil / BD | Web | Veredicto |
|---|---|---|---|
| CÃ³digo (epoch `co_client`) | `1785952445854.0` | `1785952445854.0` | âœ… |
| # Ref (lista) | 31 | `31` | âœ… |
| Fecha de Registro | `2026-08-05 13:56:14` | `05/08/2026 13:56:14` | âœ… mismo dÃ­a y hora exacta |
| Nombre | `Test-CLT-SMOKE-135439` | idÃ©ntico | âœ… |
| RIF (etiqueta `CÃ©dula::`) | `J987654321` | `J987654321` | âœ… |
| Vendedor | `266 Dilcia Duarte` | `Dilcia` | âœ… con nota |
| Responsable | `Responsable QA` | idÃ©ntico | âœ… |
| Comentario (`tx_client`) | `Contacto QA` | idÃ©ntico | âœ… |
| Correo | `qa@kiberno.com` | idÃ©ntico | âœ… |
| TelÃ©fono | `04141234567` | idÃ©ntico | âœ… |
| DirecciÃ³n | `Av Principal QA El Palmar` | idÃ©ntico | âœ… |
| DirecciÃ³n Entrega | `Av Principal QA Despacho` | idÃ©ntico | âœ… |
| Coordenada | `11.0490651,-63.865006` | idÃ©ntica | âœ… exacta |
| Empresa | `1002 CENTRAL EL PALMAR` | no expuesta en el detalle | âœ… indirecta (lista filtrada) |
| Sitio web | `null` | vacío | ⏭ salteado (local-driven) |

**Notas (no son diffs):** el vendedor sale abreviado (`Dilcia`) en lista y detalle, mientras devoluciones sí
muestra `Dilcia Duarte` â€” inconsistencia cosmÃ©tica de la web. El detalle **no expone `No. de Ref.`**: la Ãºnica
llave es `CÃ³digo:` = epoch. La lista **duplica los `th`** (7 Ã— 2) â†’ leer por Ã­ndice de `td`.

## DW-DEV-001 Â· DevoluciÃ³n Â· Ref 73 â†’ **WEB-OK**

| Campo | Móvil / BD | Web | Veredicto |
|---|---|---|---|
| No. de Ref. | 73 | `73` | âœ… |
| Estatus (`st_return=1`) | â€” | literal: **`Enviado`** | â„¹ reportado, no traducido |
| Fecha devoluciÃ³n | 05/08/2026 | `05/08/2026 14:52:27` | âœ… mismo dÃ­a |
| Vendedor | `266 Dilcia Duarte` | `Dilcia Duarte` | âœ… |
| Empresa | `1002 / id_enterprise 1` | `CENTRAL EL PALMAR, S.A.` | âœ… |
| CÃ³digo / Nombre cliente | `1000000803` Â· RON SANTA TERESA | idÃ©nticos | âœ… |
| Responsable | `QA AUTOMATION` | idÃ©ntico | âœ… |
| Tipo de devoluciÃ³n | `52 PostVenta` | `PostVenta` | âœ… |
| Precinto | `PREC-8051` | `PREC-8051` | âœ… |
| Cod. producto | `160000019` | `160000019` | âœ… |
| Producto | `AZUCAR MONTALBANâ€¦` | `AZÃšCAR MONTALBANâ€¦` | âœ… (la web muestra la tilde del maestro) |
| NÂ° Factura | `0092002924` | idÃ©ntico, con ceros a la izquierda | âœ… |
| Cantidad | `2` | `2` | âœ… |
| Unidad | `FAR/FARDO` | `FAR` | âœ… (web muestra solo el cÃ³digo) |
| Motivo | cÃ³digo `49` | `Atuendo Ã³ vestimenta de caleteros (Servicio)` | â„¹ literal, sin orÃ¡culo |
| Observaciones | â€” | `Devolucion QA smoke 20260805` | â„¹ presente |
| UbicaciÃ³n | â€” | `11.0490664,-63.8650062` | â„¹ presente |

**Montos:** ni la lista ni el detalle traen columna de dinero â‡’ **devoluciones no maneja montos**, confirmado.
No se aplicó ningún oráculo de importes.

### ðŸ”Ž LOTE Y VENCIMIENTO (`expirationBatch=true`, primera vez en la serie)

**Ambos se renderizan en la web con los valores exactos que mandó el móvil. Sin hallazgo.**

| Campo | Móvil (enviado) | BD (nube) | Web | Veredicto |
|---|---|---|---|---|
| **Lote** | `LOTE-QA-0805` | `LOTE-QA-0805` | **`LOTE-QA-0805`** | âœ… exacto |
| **Fecha vencimiento** | `2026-08-28` | `2026-08-28` | **`28/08/2026`** | âœ… mismo dÃ­a (formato es-VE) |

Ambos aparecen como **columnas propias de la tabla de líneas** (`Lote`, `Fecha vencimiento`), no en la
cabecera. El vencimiento se muestra sin hora. **La cadena `expirationBatch` queda cerrada extremo a extremo:
mÃ³vil â†’ BD â†’ web.**

## Patrones nuevos de la 2ª tanda (isla_coche)

1. **El prefijo del panel de filtros cambiÃ³ a `form:j_idt114:*`** (la tanda anterior era `j_idt116`) â€” confirma
   la regla: **nunca anclar a `j_idt*`**, resolver por sufijo en runtime.
2. **Sufijos estables del panel** (iguales en ambos módulos): `:idEnterprise_label` · `:idSalesmaView_label` ·
   `:clientSOM_label` · `:attachStatus_label` · `:orderStatus_label` · `:n_ref` · `:dateB_input` /
   `:dateF_input` · `:ajax` (Buscar) · `:botonLimpiar`.
3. ðŸ”´ **El `value` del select de Empresa NO es uniforme entre mÃ³dulos** â‡’ anclar la guarda de tenant al
   **TEXTO** de las opciones. Un guión que compare values falla en uno de los dos.
4. **El filtro de Empresa arranca en la 2ª empresa (YARACUY)** en ambos módulos y persiste en la sesión JSF.
5. **`sessionStorage.qa` como transporte del bundle funciona** y sobrevive a `browser_navigate` en el mismo
   origen.
6. **Las dos reglas opuestas de lectura del detalle, reconfirmadas:** la cabecera solo sale con `leerHojas` +
   hoja-siguiente; `leerCabecera` devuelve todo vacío **salvo** `Coordenada de transacción`.
7. âš  **`leerHojas` + hoja-siguiente absorbe los tÃ­tulos de secciÃ³n:** `Web:` quedÃ³ emparejado con `Contacto`,
   que es el encabezado de la sección siguiente. Descartar como valor toda hoja que sea un título conocido
   (`Datos Básicos`, `Dirección`, `Contacto`, `Observaciones`).
8. **La etiqueta del RIF en clientes potenciales es `Cédula::`** (doble dos-puntos) y contiene el **RIF**.
9. **Tabla de lÃ­neas de devoluciÃ³n:** id auto-generado `form:j_idt169` â†’ anclar por columnas
   `['Lote','Fecha vencimiento']`. Columnas: `N° · Cod. producto · Producto · Lote · N° Factura ·
   Fecha vencimiento · Devolución en · Motivo · Cantidad`. **Cero columnas de dinero.**
10. **Ruido de plantilla nuevo** a filtrar: tres frases de un widget de noticias
    (`Last year was the hottest on record for the Arcticâ€¦`, `Minimum extent of sea iceâ€¦`, `Rightâ€¦ my friendâ€¦`).
11. **La sesiÃ³n JSF caduca entre tandas:** `navigate` devolviÃ³ `login.xhtml` en vez de fallar â‡’ chequear
    `document.title`/pathname tras cada `navigate` y re-loguear.
12. `orderStatus` en devoluciones trae **dos opciones distintas con el mismo texto `Enviado`** (`8` y `23`) â‡’
    filtrar por ese literal es ambiguo; mejor por `# Ref`.


---

> ✅ consolidado 2026-08-05

# 3Âª tanda WEB â€” inventarios + depÃ³sitos

SesiÃ³n JSF caducada al arrancar (`navigate` devolviÃ³ `login.xhtml`) â†’ re-login. Guarda de tenant OK **por
TEXTO** en ambos módulos: opciones `CENTRAL EL PALMAR, S.A.` / `C.A. DESTILERIA YARACUY` (values posicionales
`1|2`) y vendedor `266|Dilcia Duarte` presente.
ðŸ”´ En **ambos** mÃ³dulos el filtro Empresa arrancÃ³ en `C.A. DESTILERIA YARACUY` y hubo que corregirlo antes de
buscar. Prefijo del panel esta tanda: `form:j_idt114`.

## DW-INV-001 Â· Inventario Ref 17 â†’ **WEB-OK**

| Campo | MÃ³vil / BD | Web | âœ“ |
|---|---|---|---|
| No. de Ref. | 17 | `17` | âœ… |
| CÃ³digo inventario (epoch) | 1785958714079.0 | `1785958714079.0` | âœ… |
| Estatus (literal) | â€” | `Enviado` | âœ… |
| Fecha | 2026-08-05 | `05/08/2026 15:38:34` | âœ… mismo dÃ­a |
| Vendedor | 266 Dilcia Duarte | `Dilcia Duarte` | âœ… |
| Empresa | 1002 CENTRAL EL PALMAR | `CENTRAL EL PALMAR, S.A.` | âœ… |
| CÃ³d. / nombre cliente | 1000000803 Â· RON SANTA TERESA | idÃ©nticos | âœ… |
| Producto | 160000019 AZÃšCAR MONTALBAN REFINO PAPEL 20X1KG | idÃ©ntico | âœ… |
| Cantidad + unidad | 7 FARDO | `7.00 FARDO` | âœ… |
| UbicaciÃ³n `exh` | ExhibiciÃ³n | valor en col. **ExhibiciÃ³n**; col. **DepÃ³sito** = `-` | âœ… |
| Comentario | null | vacío | ⏭ salteado |

- **Sucursal:** el móvil manda el código `0500002916`; la web muestra la **dirección** de la sucursal. No es
  comparable campo-a-campo â‡’ **no se juzga**, queda como nota.
- `Ver Pedido Relacionado` presente pero vacío (el inventario no nació de un pedido). Correcto.
- âš  **El mÃ³dulo NO maneja montos**: el detalle no expone precio, importe ni total â‡’ **no hay orÃ¡culo de
  importes** que verificar. No se inventa ninguno.

### ðŸ”´ FOCO â€” Lote y vencimiento (`expirationBatch=true`)

**La cadena mÃ³vil â†’ BD â†’ web cierra tambiÃ©n en inventarios**, igual que en devoluciones:

| Dato | Enviado por el móvil | Mostrado por la web | Veredicto |
|---|---|---|---|
| **Lote** | `LOTEQA0805` (sin guiones) | `LOTEQA0805` | âœ… idÃ©ntico |
| **Vencimiento** | `28/08/2026` | `28/08/2026 00:00:00` | âœ… mismo dÃ­a (la web agrega la hora) |

El lote **sin guiones** no sufre distinto trato que el de devoluciones (`LOTE-QA-0805`): la web transporta el
literal tal cual en los dos formatos. Ambos viven en la **tabla de líneas** (`form:pedidosDT`), columnas
`Lote` y `Fecha expiraciÃ³n` â€” **no** en la cabecera.

## DW-DEP-001 Â· DepÃ³sito Ref 3 â†’ **WEB-OK**

(la lista trae solo 3 depÃ³sitos en toda la BD â€” esperado, no es `WEB-MISSING`)

| Campo | MÃ³vil / BD | Web | âœ“ |
|---|---|---|---|
| No. de Ref. | 3 | `3` | âœ… |
| Estatus (literal) | â€” | `Enviado` | âœ… |
| Fecha depÃ³sito | 2026-08-05 | `05/08/2026 16:04:38` | âœ… |
| Fecha de planilla | 2026-08-05 | `05/08/2026 00:00:00` | âœ… |
| NÂ° Planilla | DEP-QA-0805 | `DEP-QA-0805` | âœ… |
| Banco | BP645 Provincial Cepsa | `BP645` (solo el cÃ³digo) | âœ… cÃ³digo coincide |
| NÂ° cuenta | 0108â€¦2645 | `01080051090100002645` | âœ… |
| Monto | 6820.4436 | `6.820,4436 VES` | âœ… |
| Moneda | VES | `VES` | âœ… |
| Monto conv. | 10.4452 | `10,4452 USD` | âœ… |
| Tasa | 652.9726 | `652,9726 VES = 1 USD` | âœ… |
| Vendedor | 266 Dilcia Duarte | `Dilcia Duarte` | âœ… |
| Empresa | 1002 | `CENTRAL EL PALMAR, S.A.` | âœ… |

**AritmÃ©tica de la conversiÃ³n (VESâ†’USD â‡’ DIVIDE):**

```
6.820,4436 VES / 652,9726 (VES = 1 USD) = 10,44522174 USD
web:                                      10,4452     USD
|diff| = 0,0000217  <  0,01   ->  CUADRA
control inverso: 10,4452 x 652,9726 = 6.820,4294 VES  (~ 6.820,4436, redondeo a 4 dec.)
```

**Cobro vinculado 27083 â€” SÃ se muestra** en la tabla hija (`NÂ° Ref cobro`):

| N° | N° Ref cobro | Forma de pago | Monto cobrado | Monto conv. |
|---|---|---|---|---|
| 1 | **27083** | Deposito (Venezuela Cepsa BV454, doc. `deperyk`) | 10.000,0000 VES | 15,3146 USD |
| 2 | **27083** | **Efectivo** | **6.820,4436 VES** | **10,4452 USD** |

âš  **El orÃ¡culo `Î£(hijos) == Monto depositado` NO aplica con esta forma.** Las 2 filas llevan el **mismo**
`N° Ref cobro 27083`: no son dos cobros depositados, son las **dos formas de pago de un único cobro** (el
cobro IGTF de 16.820,4436 VES). Sumarlas darÃ­a 16.820,4436 â‰  6.820,4436 y cantarÃ­a un **`WEB-CALC-MISMATCH`
falso**. El oráculo correcto es:
`Monto depositado == monto de la lÃ­nea EFECTIVO del cobro vinculado` â†’ **6.820,4436 == 6.820,4436 âœ…**.
Coherente con el negocio: se deposita el efectivo cobrado, no el total del cobro.

**Notas de la web (no defectos):**
- La cabecera del detalle de depÃ³sito **no** trae `Monto depositado conv.` ni `Tasa conv.` â€” solo existen en
  la **lista**. Para verificar la conversión hay que leer la fila de la lista.
- La cabecera **no** expone el epoch `co_deposit`: la única llave del detalle es `No. de Ref.`.
- El campo `Banco` muestra **solo el código** (`BP645`), sin el nombre, mientras que la columna `Banco` de la
  tabla hija de cobros sí muestra nombre completo. Inconsistencia cosmética.

## Patrones nuevos de la 3ª tanda

- ðŸ”´ **El reset del filtro Empresa a YARACUY es POR MÃ“DULO, no por sesiÃ³n.** Corregido en inventarios, al
  navegar a depósitos **volvió a estar en YARACUY**. Regla: corregir Empresa **en cada módulo**, siempre.
- **Las opciones del combo se pueden leer SIN abrirlo:** PrimeFaces mantiene un `<select>` espejo en
  `[id$=":idEnterprise_input"]` con todas las `<option>` (`value|texto`). Sirve para la guarda de tenant en
  **1 sola llamada, sin clicks**. Los `li[id*="idEnterprise_"]` **solo existen tras abrir el combo**.
- ðŸ”´ **La moneda es `VES`/`USD` en esta playa, NO `BS`/`US$`.** âš  `parseMoneda()`/`verificarConversion()` de
  `web-helpers.js` solo reconocen `BS|Bs|US$|$` â‡’ acÃ¡ **no deducen la direcciÃ³n** y devuelven `ok:null`.
  Hay que pasar `opts.direccion:'dividir'` o **extender el regex de `parseMoneda` con `VES|USD`**. Es la
  causa más probable de un falso "no evaluable" en esta playa.
- **`/pages/detalleInventario`:** tabla de líneas `form:pedidosDT`, columnas `N° · Cod. producto · Producto ·
  Estructura · Depósito · Exhibición · Lote · Fecha expiración`. **La ubicación no es una columna**: `exh` se
  expresa poniendo la cantidad en **Exhibición** y dejando **Depósito = `-`**.
- **`/pages/detalleDeposito`:** tabla hija `form:j_idt163` â†’ anclar con
  `tablaPorColumnas(['N° Ref cobro','Monto cobrado'])`. Lista **las formas de pago del cobro vinculado**,
  repitiendo el mismo `NÂ° Ref cobro` por fila â‡’ **no sumar sus filas contra el monto depositado**.
- **`leerCabecera` (regla del padre) devuelve TODO vacÃ­o en `detalleInventario` y `detalleDeposito`** â€” las 12
  claves salieron `""`. Acá la regla buena es **`leerHojas` + hoja-siguiente**, que resolvió el 100 %.
- `sessionStorage.qa` como transporte del bundle: reconfirmado, sobrevive a `browser_navigate`.
- Re-login funcional por IDs `j_idt*` del login (`#j_idt12` usuario, `#j_idt14` clave, `#j_idt16` Ingresar).


---

> ✅ consolidado 2026-08-05

# BARRIDO DE CIERRE â€” cobros 27086-27092

Los 7 cobros que la QA creó mientras corría el smoke móvil.
**Con esto el día cierra en 25 cobros verificados (27068-27092).**

Tasa **652,9726** · vendedor `id_user` 266 · **estatus literal de los 7: `Enviado`** · READ-ONLY.
**Guarda de tenant:** âœ… por el `<select>` espejo, sin abrir el combo â€” 2 empresas exactas + vendedor
`266|Dilcia Duarte` en `[id$=":idSalesmaView_input"]`. Empresa anclada al **texto**, nunca al `value`.

## Resultado

**6 WEB-OK · 1 WEB-CALC-MISMATCH · 0 WEB-MISSING · 0 WEB-FIELD-MISMATCH · 0 WEB-N/A**

| # Ref | co_type / rótulo | Empresa | Mon | Total a pagar (web) | Σ pagos | Σ docs | BD final | Marca |
|---|---|---|---|---|---|---|---|---|
| 27086 | 0 Â· Cobros | PALMAR | VES | 560.681,4527 | **568.000,0000** | 560.681,4527 âœ… | âœ… | **WEB-CALC-MISMATCH** |
| 27087 | 1 Â· Anticipo | PALMAR | VES | Monto pagado 7.318,5473 | 7.318,5473 âœ… | sin tabla docs | âœ… | **WEB-OK** |
| 27088 | 0 Â· Cobros | PALMAR | USD | 4.854,7200 | **4.865,0000** | 2.424,45+2.430,27 âœ… | âœ… | **WEB-OK** |
| 27089 | 1 Â· Anticipo | PALMAR | USD | Monto pagado 10,2800 | 10,2800 âœ… | sin tabla docs | âœ… | **WEB-OK** |
| 27090 | 2 Â· RetenciÃ³n | PALMAR | VES | 5.500,0000 âœ… | (sin pagos) | 500+5.000 âœ… | âœ… | **WEB-OK** |
| 27091 | 0 Â· Cobros | PALMAR | VES | 1.439.602,1615 âœ… | âœ… | âœ… | âœ… | **WEB-OK** |
| 27092 | 4 Â· **Cobro 25%** | **YARACUY** | VES | 5.500,0000 âœ… | 5.500,0000 âœ… | 500+5.000 âœ… | âœ… | **WEB-OK** |

En 27086 y 27088 el Σ pagos **excede** al total a propósito: el excedente se convierte en anticipo (ver F2).
No es descuadre â€” es el mecanismo de vuelto.

## ðŸ”´ F1 Â· CONFIRMADO â€” 5Âª ocurrencia, con **causa raÃ­z identificada**

**27086 reproduce el patrón exacto en la LISTA:**

| Columna | Muestra | Debería mostrar |
|---|---|---|
| `Monto cobrado` | 568.000,0000 VES âœ… | â€” |
| **`Monto conv.`** | **`N/A USD`** âœ— | **869,8680 USD** |
| `Por cobrar conv.` | 858,6600 USD âœ… | â€” |
| **`Tasa conv.`** | **`N/A`** âœ— | **652,9726 VES = 1 USD** |

â‡’ La correlaciÃ³n queda **cerrada**: los 5 cobros con `nu_amount_total = 0` (27076, 27077, 27082, 27085,
**27086**) son exactamente los 5 que muestran `N/A`.

### Causa raíz (aporte nuevo)

La lista **mezcla dos orígenes de dato** en columnas que deberían ser coherentes:

| Columna | Origen real (deducido por contraste) | En 27086 |
|---|---|---|
| `Monto cobrado` | Î£ `collection_payment.nu_amount_partial` | 568.000,0000 âœ… |
| `Monto conv.` | `collection.nu_amount_total_conversion` | 0 â†’ `N/A` âœ— |
| `Tasa conv.` | **derivada** (`Monto conv.` / `Monto cobrado`) â€” *no* lee `nu_value_local` | 0/568.000 â†’ `N/A` âœ— |

**La prueba de que la tasa es derivada y no leída:** `collection.nu_value_local = 652,9726` **está bien
guardada** en 27086, y el **detalle** del mismo cobro muestra `Tasa de conversión: 652,9726` sin problema.
Solo la **lista** dice `N/A`. Si leyera el campo almacenado, no podría fallar.

**El dato correcto ya existe en BD:** `collection_payment.nu_amount_partial_conversion = 869,8680`
(= 568.000 / 652,9726 âœ…). La lista tiene todo lo necesario para mostrarlo bien.

âš  El **detalle de 27086 estÃ¡ impecable**. El defecto estÃ¡ **confinado a las columnas de la LISTA**
alimentadas por `nu_amount_total*`.

## ðŸ”´ F2 Â· RESUELTO â€” el par cobroâ†”anticipo, con aritmÃ©tica cerrada

**Los dos pares son el mismo mecanismo: sobrepago que el sistema convierte en anticipo automático.**

**La llave que lo prueba (BD):** `collection.co_original_collection` del **anticipo** apunta al
`co_collection` del **cobro padre**:

| Anticipo | `co_original_collection` | = `co_collection` de |
|---|---|---|
| **27087** | `1785956445049.0` | **27086** âœ… |
| **27089** | `1785956560936.0` | **27088** âœ… |

**La etiqueta que lo confirma en la UI:** la forma de pago del anticipo es **`Prepago Automático`** (no
"Efectivo"/"Depósito"), con **el mismo `Nro Documento` y banco que el pago del cobro padre**.
â‡’ El anticipo **no lo tecleÃ³ nadie: lo generÃ³ el sistema** con el vuelto.

```
Par USD 27088/27089
  Î£ pagos (Efectivo)      4.865,0000 USD
  Î£ Monto a pagar docs    2.424,4500 + 2.430,2700 = 4.854,7200 USD  = Total a pagar   OK
  Excedente               4.865,0000 - 4.854,7200 =    10,2800 USD  = anticipo 27089  EXACTO
  Conversion (USD->VES)   4.854,7200 x 652,9726 = 3.169.999,1407  OK
                             10,2800 x 652,9726 =     6.712,5583  OK (= Diferencia cambiaria)

Par VES 27086/27087  -- el numero redondo
  Sigma pagos (Deposito)    568.000,0000 VES
  Sigma Monto a pagar docs  560.681,4527 VES  = Total a pagar   OK
  Excedente                 568.000,0000 - 560.681,4527 = 7.318,5473 VES = anticipo 27087  EXACTO
  COMPROBACION              560.681,4527 + 7.318,5473 = 568.000,0000   REDONDO CONFIRMADO
```

**¿Con qué etiqueta aparece el excedente en el detalle de 27088?** **Con ninguna.** En el detalle de 27088
(y de 27086) el excedente **no se muestra**: `Diferencia/Faltante` = `0,0000` en **todas** las filas y el pie
no trae línea de diferencia. Exhibe `Total Monto a pagar 4.854,7200` y una tabla de pagos de `4.865,0000`
**sin explicar los 10,28 de brecha**. Sí se ve en la **lista** (`Diferencia cobro`), en **BD**
(`nu_difference`) y como **registro propio** (el anticipo).
ðŸ“Œ No se marca como defecto: los importes son correctos y trazables. Es una **brecha de presentaciÃ³n del
detalle** â€” sugerencia de UX.

### ðŸ”´ AcÃ¡ se cierra el cÃ­rculo con F1

| | `nu_amount_total` (= Σ pagos) | ¿Correcto? |
|---|---|---|
| **27088** (USD) | **4.865,0000** | âœ… **guarda el sobrepago** |
| **27086** (VES) | **0,0000** | âœ— **deberÃ­a ser 568.000,0000** |

â‡’ **27088 es el caso de control que prueba que el 0 de 27086 es un defecto**, no un diseÃ±o. Misma operaciÃ³n,
mismo minuto, mismo cliente, mismo vendedor â€” y uno guarda el total y el otro lo pierde.
**F1 y F2 son el mismo defecto visto por dos lados: se pierde `nu_amount_total` en el cobro con vuelto.**

## âœ… F3 Â· 27090 retenciÃ³n â€” todo cuadra, ningÃºn defecto conocido reproduce

```
Monto total base      1.426.803,8985 + 144.457,1283 = 1.571.261,0268 VES  OK (= Sigma Saldo doc)
  conversion              2.185,0900 +     221,2300 =     2.406,3200 USD  OK
                      1.571.261,0268 / 652,9726     =     2.406,3200 USD  OK (VES->USD divide)
Retencion IVA               500,0000 +   5.000,0000 =     5.500,0000 VES  OK
  conversion                  0,7657 +       7,6573 =         8,4230 USD  OK
Total Monto a pagar   500,0000 + 5.000,0000 = 5.500,0000 VES  OK = BD final  OK
Tabla de pagos:       "No se encontraron registros."  OK (retencion sin pagos)
```

- âœ… **El defecto conocido (docs sin datos de retenciÃ³n) NO aplica:** los 2 documentos traen `Doc RetenciÃ³n`
  y `Fecha Comprobante`. No hay residuo que anotar.
- âœ… **`COB-RET-TOTAL-CERO` NO reproduce** â€” 6Âª no-reproducciÃ³n del dÃ­a en esta playa.
- âš  La etiqueta `RetenciÃ³n ISLR` del pie **no aparece** con valor 0, aunque su conversiÃ³n sÃ­ se renderiza en
  la tabla. Confirma: leer el pie con `??`, nunca asumir presencia.

ðŸ“Œ **Matiz al orÃ¡culo de cabecera (evita falsos positivos):** el orÃ¡culo validado en la 1Âª tanda es de
**`co_type = 0`**. En **retención (`co_type = 2`)** rige otra regla:

```
co_type 0:  Total a pagar = Sigma(Saldo doc) - Total dcto - (Ret.IVA + Ret.ISLR) - Sigma(Dif/Faltante) + IGTF
co_type 2:  Total a pagar = Sigma(Monto a pagar por doc) = Ret.IVA + Ret.ISLR   <- el saldo NO participa
```

Aplicar el de `co_type 0` a 27090 daría `1.565.761,0268` y un **falso WEB-CALC-MISMATCH**.

## âœ… F4 Â· "Cobro 25%" â€” respuesta definitiva: **NO existe ningÃºn 25 %**

27092 cuadra perfecto pero **no hay aritmética del 25 %** por ningún lado. Ratios pagado/saldo: doc1
**0,3620 %** Â· doc2 **0,0166 %** Â· total **0,0181 %**. El 25 % del base serÃ­a 7.582.553,5677 â€” no figura en
ninguna celda.

**Barrido de TODA la BD** (no se quedó en el 3er caso): ratio `nu_amount_paid / nu_balance_doc` en **los 41
cobros `co_type = 4`** de la base, todas las fechas, ambas empresas.

| Evidencia | Resultado |
|---|---|
| Rango del ratio | **0,0057 % â€¦ 100,0000 %** |
| Filas con ratio = 25 % (±1 pt) | **0 de 79** |
| Cobros con ratio = **100 %** | **6** (26846, 26847, 26849, 27033, 27034, 27075) |

â‡’ **El "Cobro 25%" no aplica ni valida ningÃºn 25 %** â€” ni sobre el saldo, ni sobre el monto del documento,
ni sobre el total. Es un **rótulo sin aritmética asociada**: se comporta como un cobro normal con
`Pago parcial = SI` y el importe tecleado libremente. Los **6 cobros al 100 %** descartan además que sea un
**tope** del 25 %. **Pregunta de la QA respondida con 41 casos, no con 3.**

## âœ… F5 Â· Dev/faltantes en cobros VES â€” la cobertura que faltaba: **NO reproduce el defecto**

27086 es un cobro **VES con `Diferencia/Faltante â‰  0`** (7.318,5473 VES) â€” exactamente lo que la 1Âª tanda no
pudo cubrir.

```
VES -> USD debe DIVIDIR:
  lista, Diferencia cambiaria 27086:  7.318,5473 / 652,9726 = 11,2080 USD   CORRECTO
  BD, nu_difference_conversion:                               11,2080       CORRECTO
  si multiplicara (el defecto):       7.318,5473 x 652,9726 = 4.778.716,..  NO ocurre

Contraste USD -> VES debe MULTIPLICAR (27088):
  lista, Diferencia cambiaria:           10,2800 x 652,9726 = 6.712,5583 VES  CORRECTO
```

â‡’ **El defecto de direcciÃ³n de conversiÃ³n NO reproduce en cobros VES.** La brecha de cobertura queda
**cerrada con veredicto positivo**.

âš  Matiz honesto: el dev/faltante de 27086 vive en la **cabecera** (`nu_difference`), no en una **fila de
documento**. Un **descuento por documento en VES** sigue sin muestra â€” Ãºnico hueco de cobertura del Ã¡rea.

## Nota de alcance

Durante el barrido aparecieron en la lista refs **27093-27097** (creadas mientras el agente leía).
**Quedan fuera de este cierre**: el alcance pactado eran los 7. Se anotan por si hace falta una 3ª tanda.

## Patrones nuevos del barrido

1. **ðŸ”´ El bundle `window.__qaW` NO sobrevive a `Consultar`** â€” el detalle es navegaciÃ³n completa, no ajax.
   Usar un **lector autocontenido** (una sola `browser_evaluate` que define sus helpers y devuelve el JSON).
2. **ðŸ”´ Mapa `# Ref â†’ id de botÃ³n` + click en una sola llamada** â€” imprescindible, no cosmÃ©tico: los Ã­ndices
   de fila **se corren durante la corrida** (27090 fue `:3:`, luego `:4:`, luego `:6:` en 4 minutos).
   **Anclar al índice garantiza abrir el cobro equivocado.** Anclar siempre al `# Ref`.
3. **Corrección al aprendizaje del filtro Empresa:** el reset ocurre al **entrar fresco al módulo**, pero una
   vez fijado **sobrevive a `detalleCobro` â†’ volver**, y la tabla vuelve poblada **sin `Buscar`**. Ciclo real:
   `navigate` â†’ `evaluate(mapa+click)` â†’ `evaluate(leer)` = **3 llamadas**.
4. **Cambiar Empresa sin `browser_click`:** `label.click()` + click sobre el `li` filtrado **por texto**,
   todo dentro de una `evaluate`.
5. **`[id$=":idSalesmaView_input"]`** â€” `<select>` espejo del filtro Vendedor (33 opciones,
   `266|Dilcia Duarte`). Completa la guarda de tenant en la misma llamada, sin clicks.
6. **Forma de pago `Prepago AutomÃ¡tico`** â€” valor **nuevo** del catÃ¡logo y **marcador semÃ¡ntico**: identifica
   un anticipo **generado por el sistema** desde el vuelto de otro cobro.
7. **`collection.co_original_collection` es la llave cobroâ†”anticipo** (`id_original_collection` viene NULL).
   Es la única forma de correlacionar el par: **la web no expone el vínculo en ninguna pantalla.**
8. **El pie del detalle tiene una 3ª forma:** en retención, `Retención ISLR` desaparece del pie con valor 0
   aunque su conversión sí se renderice en la tabla. Leer con `??`.
9. **Para `web-helpers.js`:** `parseMoneda()` no reconoce `VES`/`USD` â‡’ `verificarConversion()` devuelve
   `ok:null` en esta playa. Fix de una línea:
   `const m = String(s ?? '').match(/(US\$|USD|VES|BS|Bs\.?|\$)\s*$/i);`
   y en la deducciÃ³n: `VESâ†’USD` â‡’ dividir, `USDâ†’VES` â‡’ multiplicar.
10. **Anti-patrÃ³n nuevo â€” `Monto conv.` de la lista NO es derivable de `Monto cobrado`.** Salen de fuentes
    distintas. Un oráculo que asuma `Monto conv. == Monto cobrado / Tasa` marcaría MISMATCH en 27086 **por la
    razón equivocada**. El oráculo correcto es contra **BD**, no entre columnas de la lista.



> ✅ consolidado 2026-08-05
---

# DW-VIS-001 · Visita Ref 18 — **WEB-OK** (cierre del último hueco de cobertura)

Playa `isla_coche` · Empresa **CENTRAL EL PALMAR, S.A.** · vendedor **266 Dilcia Duarte** · gate BD = `BD-OK`.
Guarda de tenant ✅ (empresas por TEXTO; Dilcia Duarte presente).
⚠ El filtro Empresa venía en **`C.A. DESTILERIA YARACUY`** — se corrigió antes de `Buscar`; sin eso la Ref 18
no aparece (**falso MISSING confirmado otra vez**).

## Campos cotejados

| Campo | Móvil / BD | Web | Veredicto |
|---|---|---|---|
| `No. de Ref.` | 18 | **18** | ✅ |
| Cód. cliente | 1000000803 | 1000000803 | ✅ |
| Nombre del cliente | C.A. RON SANTA TERESA, S.A.C.A | idéntico | ✅ |
| Vendedor | 266 Dilcia Duarte | Dilcia Duarte | ✅ |
| Empresa | 1002 CENTRAL EL PALMAR | CENTRAL EL PALMAR, S.A. | ✅ |
| Fecha | 2026-08-05 | Programada `05/08/2026` · Enviada `05/08/2026 16:28:43` · Planeada `16:23:25` | ✅ mismo día |
| **Estatus (literal)** | `st_visit=2` / `is_visited=true` | **`visitado`** (minúscula, columna `Status` de la LISTA) | ✅ reportado sin traducir |
| Coordenada | `11.0490672,-63.8650075` | `11.049067,-63.865007` (URL del mapa) | ✅ Δ < 1e-6 (la web trunca a 6 dec.) |
| Título | — | `2026-08-05-C.A. RON SANTA TERESA, S.A.C.A` | ℹ️ generado por la web |
| Orden de visita | — | `1` | ℹ️ |
| Ubicación | — | `24XM+8VC, C. Flamboyant, La Asunción 6311, Nueva Esparta` | ℹ️ |

`cotejarCampos()`: **8 comparados · 0 diffs · 0 notas**.
Hora: epoch `1785961638978` = **16:27:18 (UTC-4)**; la web muestra Enviada 16:28:43 → mismo día, nota.

## Actividad / incidencia — tabla `form:visitasDT`

| N° | Actividad | Motivo | Descripción |
|---|---|---|---|
| 1 | **MERCHANDISING** (`co_type=47`) | **ENTREGA DE MUESTRAS** (`co_cause=153`) | **`Test-VIS-015-162550`** |

**Exactamente UNA fila** ✅ (BD: `incidencias:1`). Doble corroboración: **la LISTA repite una fila por
incidencia** — la Ref 17 sale **2 veces** y la Ref 18 **1 sola vez**.

## Notas sin veredicto

- **`Geo` = `Falta Coordenada (Sucursal)`** en la fila. Es un juicio sobre la coordenada **de la sucursal del
  cliente**, no la de la transacción (que sí llegó). Concuerda con `coordenadaSaved:false` del móvil.
- **Columnas de dinero: NO hay ninguna**, ni en lista ni en detalle. Nada que reportar.
- El detalle **no expone el epoch `co_visit` ni el estatus** ⇒ en visitas la **única llave de correlación es
  `No. de Ref.`**, y el estatus **solo se lee en la lista**.

## ⚠️ REGRESIÓN SEGUIDA — filtro `Coordenadas = No Realizado`

**Veredicto: NO REPRODUCE en esta playa — pero el caso quedó SIN POBLACIÓN (no concluyente).**

El filtro **existe**: `[id$=":selectCoordinadas_input"]`, opciones `Coordenadas(-1) · Por Revisar(0) ·
**No Realizado(1)** · Falta Coordenada (Sucursal)(2) · Falta Coordenada (Destino)(3) · Fuera de Rango(4) ·
Correcto(5)`.

| Prueba (Empresa=CENTRAL EL PALMAR · 01/01/2026→05/08/2026) | Filas devueltas | Filas con ese valor | ¿Coherente? |
|---|---|---|---|
| Sin filtro (`Coordenadas`, -1) | 3 (Refs 18, 17, 17) | — | — |
| `Falta Coordenada (Sucursal)` (2) | **3** | 3 | ✅ exacto |
| `Correcto` (5) | **0** (`No existe registro`) | 0 | ✅ correcto |
| **`No Realizado` (1)** | **0** | **0** | ✅ coherente… **pero sin población** |

**Conclusión honesta:** el mecanismo del filtro funciona (3/3 exactas para el valor que sí existe, 0 para uno
que no existe). Pero el bug reportado —*devuelve 0 filas aunque la tabla muestre filas con ese valor*—
**no se pudo ejercitar**: en toda la playa hay **solo 3 visitas** (las 3 de EL PALMAR; YARACUY tiene 0) y
**ninguna** muestra `No Realizado`. ⇒ **No cuenta como verificación de fix**: hace falta una visita con
`Geo = No Realizado` para cerrar el caso.

## Patrones nuevos de `/pages/visitas` — rompe 3 convenciones

1. 🔴 **El botón Buscar NO es `:ajax` — en visitas es `[id$=":btnBuscar"]`.** Un guión anclado a `:ajax` no
   busca nada acá. `:botonLimpiar` sí se mantiene.
2. 🔴 **El vendedor NO está en `idSalesmaView` — en visitas es `[id$=":idSalesman_input"]`** (33 opciones).
   Y **el label es el LOGIN**: `value=266` / texto `1276 - Dilcia Duarte` — **al revés que en los otros
   módulos**, donde el login no aparecía. ⇒ la guarda de tenant en visitas debe buscar por `value=266` **o**
   por el nombre, nunca por el patrón `266 - …`.
3. **`value` de Empresa = `1`/`2` (posicional)**, no `1002`/`1003`. Otra confirmación de anclar al TEXTO.

| Qué | Selector | Nota |
|---|---|---|
| Tabla lista | `form:tablaVisit` | único de visitas |
| Botón fila | `form:tablaVisit:{i}:consultar` | y `…:Editar` / `…:Eliminar` — **🚫 prohibidos** (mayúscula inicial) |
| Filtro `# Ref` | `[id$=":n_ref"]` | ✅ **visitas SÍ tiene filtro de Ref y funciona** — desmiente la tabla de `_comunes.md` §"Búsqueda por Nro.Ref", que la lista como "sin filtro" |
| Estatus | `[id$=":idEstatus_input"]` | `Estatus(0) · No visitado(3) · Visitado(2)` — ⚠ el filtro dice `Visitado`, la columna muestra `visitado` en minúscula |
| Actividad | `[id$=":idType_input"]` | value = `co_type` (MERCHANDISING = **47**, coincide con BD) |
| Motivo | `[id$=":idMotive_input"]` | |
| Adjuntos / Despacho / Coordenadas | `[id$=":selectAttach_input"]` · `[id$=":selectDispatch_input"]` · `[id$=":selectCoordinadas_input"]` | ⚠ `selectCoordinadas` (typo del producto: "Coordinadas") |
| Tabla hija del detalle | **`form:visitasDT`** (ID semántico) | cols `N° · Actividad · Motivo · Descripción` — **una fila por incidencia** |
| Detalle | `/pages/protected/visitas/detalleVisita.xhtml` | forma legacy con `/protected/` y `.xhtml` |

4. **Regla MIXTA de lectura dentro de la MISMA página:** en `detalleVisita` la cabecera sale con
   **`leerHojas` + hoja-siguiente** (9 campos), pero **`Titulo:` solo sale con la regla del mismo padre
   (`leerCabecera`)** — con `leerHojas` absorbe el `N°` del encabezado de la tabla siguiente. **Primer detalle
   donde hay que combinar las dos reglas**, no elegir una.
5. **La coordenada no es texto visible:** vive en la URL del iframe del mapa, **truncada a 6 decimales** ⇒
   comparar con tolerancia ~1e-6, nunca por string. Mismo caso que `detalleInventario`.
6. **Al `Buscar`, el panel de filtros se re-renderiza** y el widget de Empresa puede quedar en
   `Seleccione Empresa`. ⇒ **verificar el label después de cada `Buscar`**, y **separar "setear filtro" de
   "clickear Buscar" en dos llamadas** (hacerlo en una sola dejó una búsqueda ambigua).
7. Mensaje de tabla vacía = **`No existe registro`** (distingue 0 filas de una fila en blanco).
