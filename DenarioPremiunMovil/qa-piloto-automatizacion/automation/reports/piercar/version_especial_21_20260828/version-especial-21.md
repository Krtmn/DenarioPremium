# Versión especial v21 — piercar (LA TORTUGA)

| Parámetro | Valor |
|---|---|
| Cliente | **piercar** — PIERCAR REPUESTOS C.A. (`INVLDJ_AA`) |
| Playa | LA TORTUGA — `denariolatortuga.ddns.net:8081` |
| Fecha | 2026-08-28 |
| App | `com.kiberno.denarioPremiumPro` — **Versión 6.6.21** (leída en la pantalla de login) |
| Device | Infinix X6728 · 360×744 · `window.ng=true` · `sqlitePlugin` disponible |
| Usuario | 001 |
| Tasa del día | **791,67 BS = 1,00 USD** (`conversion_type` id 110, 28/08/2026) |
| Alcance | ⚠ **Cambió a mitad de corrida**: cobros pasó a STAND BY; alcance final = Productos, Pedidos y ausencia de selector de monedas |

---

## 1 · VEREDICTO — los 3 puntos del alcance nuevo

| # | Punto | Veredicto | En una línea |
|---|---|---|---|
| **1** | **PEDIDOS — saldo del cliente** (fix `1672315b`) | ✅ **PASS** | El selector de clientes encabeza con **`Saldo USD`** (moneda fuerte, como manda `ped`) y da el BS como conversión; 5 clientes cuadran contra la tasa |
| **2** | **PRODUCTOS — precio y conversión en el detalle** (fix `c9edbe3b`) | ✅ **PASS** | El detalle muestra **precio USD + precio BS + Tasa de conversión**, y **coincide dígito a dígito con la lista** en los 2 productos medidos |
| **3** | **Selector de monedas — ausencia en Pedidos y Productos** | ✅ **PASS** | Ninguna de las 7 pantallas revisadas de esos 2 módulos renderiza un selector de monedas |

> 🔴 **Un hallazgo fuera del alcance nuevo, pero del mismo tema y de peso:** en **COBROS** sí aparece un
> selector de monedas **habilitado y con 2 opciones (BS/USD)**, contra `cob.currencySelector = false`.
> Detalle y evidencia en §5. No se pudo cerrar el veredicto porque cobros quedó en stand by, pero la
> medición del control está hecha y es reproducible en 2 clicks.

---

## 2 · De dónde salió el oráculo en cada punto

El oráculo se leyó **por duplicado y las dos lecturas coinciden**, así que no depende de una sola fuente:

**(a) Nube — tabla `currency_modules` × `modules`:**

```
node automation/db/query.js piercar "SELECT m.co_module, cm.local_currency_default, cm.show_conversion, cm.currency_selector FROM modules m LEFT JOIN currency_modules cm ON cm.id_module=m.id_module ORDER BY m.id_module"
```

**(b) Device — `currencyServ.currencyModulesMap` del componente Angular en vivo:**

```js
window.ng.getComponent(document.querySelector('app-pedido')).currencyServ.currencyModulesMap
```

| `co_module` | Moneda x defecto | `show_conversion` | `currency_selector` |
|---|---|---|---|
| vis · inv · **ped** · dev · ven · **pro** · cli | **FUERTE (USD)** | sí | **NO** |
| **cob** | **LOCAL (BS)** | sí | **NO** |
| dep | FUERTE (USD) | sí | **SÍ** |

**Las 9 filas del mapa del device son idénticas a las 9 de la nube.** Es decir: la config **sí baja bien al
dispositivo**; cualquier divergencia que se vea en pantalla es de la capa que la consume, no del sync.

🔑 **Este `currencyModulesMap` es el oráculo más barato que hay para toda la familia K##**: una línea, sin
BD, y responde por los 9 módulos a la vez. Vale la pena graduarlo a `module-selectors/_comunes.md`.

**Prueba de que Pedidos lee la config de SU módulo** (no una global): en `app-pedido`,

```
monedaSeleccionada = {coCurrency:"USD", localCurrency:"false", hardCurrency:"true", idCurrency:2}
localCurrency      = {coCurrency:"BS",  localCurrency:"true"}
hardCurrency       = {coCurrency:"USD", hardCurrency:"true"}
showConversion     = true      tasaCambio = "791,67"      multimoneda = true
```

`monedaSeleccionada` resolvió a **la fuerte**, que es exactamente lo que pide `ped.local_currency_default=false`.
Esto responde la advertencia del encargo (*"el rótulo por sí solo no distingue si está leyendo la config
correcta"*): **no nos apoyamos en el rótulo, se leyó el modelo en vivo.**

---

## 3 · PRODUCTOS — la comparación LISTA vs DETALLE, lado a lado

Familia **BUJIAS** (45 productos). Mismo producto, misma sesión, sin recargar.

### Producto A — `18814-11051`

| | **LISTA** (`app-productos`, listado de la familia) | **DETALLE** (Detalle de Producto) |
|---|---|---|
| Precio fuerte | **1,44 USD** | **1,44 USD** |
| Precio local | **1.140,00 BS** | **1.140,00 BS** |
| Tasa de conversión | (no se rotula en la lista) | **791,67** |
| Selector de monedas | ausente | ausente |

### Producto B — `4003`

| | **LISTA** | **DETALLE** |
|---|---|---|
| Precio fuerte | **2,15 USD** | **2,15 USD** |
| Precio local | **1.702,09 BS** | **1.702,09 BS** |
| Tasa de conversión | — | **791,67** |

**Coinciden en moneda y en monto, dígito a dígito, en los dos productos.** ✅

**Aritmética** (`precio_local ≈ precio_fuerte × tasa`):

| Producto | Fuerte | × 791,67 | App muestra | Δ |
|---|---|---|---|---|
| `18814-11051` | 1,44 | 1.140,0048 | **1.140,00** | 0,00 |
| `4003` | 2,15 | 1.702,0905 | **1.702,09** | 0,00 |

Y en la lista completa se verificaron 2 filas más: `3179` 2,00 USD → 1.583,34 BS y `41-110` 2,00 USD →
1.583,34 BS (2,00 × 791,67 = 1.583,34) ✅.

> 📌 **Esto cierra el defecto que traía el YAML del cliente.** `piercar.yaml` tenía anotado
> `detalle_precio_solo_usd: true` — *"producto-detail muestra solo precio USD; product-list muestra USD+BS"*
> `[prc-2606]`. **Ya no reproduce**: el detalle muestra las dos monedas y además la tasa.
> Corresponde actualizar esa clave del YAML.

**Evidencia:** `img/PRO-lista-bujias.png` · `img/PRO-detalle-18814-11051.png` · `img/PRO-detalle-precios-y-tasa.png`

---

## 4 · PEDIDOS — el saldo del cliente

**Ruta:** HOME → Pedidos → **PEDIDO** (nuevo) → `#clienteSelectModal`.

El modal rotula **`Saldo USD` en primer lugar** y `Saldo BS` debajo, como conversión:

| Cliente | Código | **Saldo USD** | Saldo BS | USD × 791,67 | ✔ |
|---|---|---|---|---|---|
| 7 CARS | `7CARS` | **1.350,14** | 1.068.865,33 | 1.068.865,34 | ✅ |
| ANA MANZANARES | `MANZANARES` | **489,65** | 387.641,22 | 387.641,25 | ✅ |
| ANTHONY GREGORIO | `V18941788` | **21,00** | 16.625,07 | 16.625,07 | ✅ |
| ANTONIO MENDEZ CARBURADORES 18 | `MENDEZ` | **47,50** | 37.604,33 | 37.604,33 | ✅ |
| AUTO PARTES EL PENON C.A. | `ESPENON` | **176,70** | 139.888,09 | 139.888,09 | ✅ |

Tres clientes más (`J310995389`, `J502733361`, `J403300275`) llegan en 0,00 / 0,00 — coherente.

**El orden del rótulo es el discriminador, y contrasta limpio contra Cobros.** El mismo `#clienteSelectModal`,
abierto desde **COBROS** en esta misma corrida y con el mismo cliente, encabezó con **`Saldo BS: 60.784,42`**
y puso `Saldo USD: 76,78` debajo. Es decir: **el modal encabeza con la moneda por defecto del módulo desde
el que se lo abre** — BS en cobros (`cob`=LOCAL), USD en pedidos (`ped`=FUERTE). Los dos correctos.
Ese contraste dentro de la misma sesión es más fuerte que mirar Pedidos solo.

**Tab TOTAL del pedido** (con cliente `ESPENON` seleccionado, carrito vacío):

```
Total Base USD: 0,00 | Total Base BS: 0,00 | Total Pedido USD: 0,00 | Total Pedido BS: 0,00
Tasa: 791,67 BS = 1,00 USD
```

**USD primero + BS como conversión + tasa explícita** ⇒ coherente con `ped` = FUERTE con conversión. ✅

**Evidencia:** `img/PED-selector-clientes-saldo-USD.png` · `img/PED-tab-total-USD-BS-tasa.png`

---

## 5 · Selector de monedas — dónde NO aparece, y dónde SÍ

### 5.1 PEDIDOS y PRODUCTOS — ✅ correcto, no aparece

Se listaron **todos** los `ion-select` visibles de cada pantalla y se leyó su rótulo y sus opciones:

| Módulo | Pantalla | `ion-select` visibles | ¿Selector de monedas? |
|---|---|---|---|
| Productos | Estructuras | Empresa *(disabled, 1 opción)* · **Linea / Sub-Linea** | ❌ no |
| Productos | Lista de la familia | *(ninguno)* | ❌ no |
| Productos | **Detalle de producto** | Unidad de venta *(disabled, "UNIDAD")* · Lista de precio *("GRAN MAYOR"/"MAYOR")* | ❌ no |
| Pedidos | Menú | *(ninguno)* | ❌ no |
| Pedidos | Tab General | Empresa *(disabled, 1 opción)* | ❌ no |
| Pedidos | Tab Pedido | **Linea / Sub-Linea** | ❌ no |
| Pedidos | Tab Total | Descuento global *("SIN DESCUENTO"/15%/25%/10%/32%/40%)* | ❌ no |

**7 pantallas, 0 selectores de monedas.** Concuerda con `ped.currency_selector=false` y `pro.currency_selector=false`.

### 5.2 🔴 COBROS — aparece, y no debería

Medido en el Tab General de un cobro nuevo, con el cliente ya seleccionado:

```
ion-select[1]   disabled = FALSE          ← habilitado
                shadowRoot label = "BS"
                ion-select-option = ["BS", "USD"]     ← 2 opciones
                value = {coCurrency:"BS", localCurrency:"true", hardCurrency:"false", ...}
```

Los otros dos `ion-select` de ese tab sí son correctos y **están deshabilitados**: Empresa
(`PIERCAR REPUESTOS C.`, 1 opción) y Tasa (`791,67 BS`, 1 opción).

- **Lo que la config dice:** `cob.currency_selector = false`, en la nube **y** en el `currencyModulesMap`
  del propio device.
- **Lo que la app hace:** renderiza un selector operable con las dos monedas.
- La **moneda por defecto sí es la correcta** (BS = local, `localCurrency:"true"`), y la **conversión también**
  se muestra ⇒ de las tres columnas del oráculo, **falla solo la del selector**.

**Por qué importa y no es cosmético:** durante la corrida un cobro terminó **en USD** partiendo del default BS.
Con el selector fuera, ese camino no existiría. Es la diferencia entre "sobra un control" y "sobra un control
que cambia la moneda del documento".

**Evidencia:** `img/K03-cobros-selector-moneda.png`

> ⚠ **No se marca FAIL formal** porque cobros entró en stand by antes de poder cerrarlo con una segunda
> medición limpia. Queda como **hallazgo abierto con evidencia**, listo para retomar.

---

## 6 · Cobros — medido antes del stand by

> ⛔ **Todo lo de esta sección quedó PENDIENTE DE CONFIGURACIÓN.** La QA detuvo la validación del anticipo
> porque **`prepaidCurrency` no persiste en la base**. Lo de acá **no cierra veredicto**: es lo que alcanzó
> a medirse, y **habrá que repetirlo** una vez resuelta la configuración.

### 6.1 El punto de partida, confirmado en BD

`prepaidCurrency` **no existe** en `global_configuration` de piercar. Lo que sí está:

| Clave | Valor |
|---|---|
| `automatedPrepaid` | `true` |
| `prepaidRangeAmount` | `1` |
| `prepaidRangeCurrency` | `USD` |
| `prepaidPaymentMethod` | `pa` |
| `tolerancia0` / `RangoToleranciaPositiva` / `MonedaTolerancia` | `true` / `50` / `USD` |

Umbral efectivo: **1 USD = 791,67 BS** al día de hoy.

### 6.2 Lo que se alcanzó a medir

| ID | Caso | Resultado | Medición |
|---|---|---|---|
| **P1** | ¿se genera el anticipo con diferencia > 1 USD? | ✅ **SÍ** | Cobro Ref **4** (BS 5.000,00 sobre saldo BS 2.375,01) generó el Anticipo Ref **5** |
| **P2** | Moneda del **MENSAJE** | **USD** | Ver texto literal abajo |
| **P3** | Moneda del **ANTICIPO en la app** | **BS** | El anticipo Ref 5 abre con `Moneda: BS` y `Tasa BS: 791,67` |
| **P4** | `co_currency` y monto **en la nube** | **BS** | `id_collection=5, co_type=1, co_currency='BS', nu_amount_total=2624.99` |
| **P5** | Segunda medición independiente | ✅ hecha (accidental, ver §6.4) | Cobro **6** en **USD** → anticipo **7** en **USD** por 10,75 |
| **P6** | Aritmética | ✅ cuadra | ver abajo |
| **P7** | Umbral < 1 USD **no** debe generar anticipo | ⛔ **NO MEDIDO** | quedó fuera por el stand by |

**P2 — texto literal del mensaje** (`.alert-title` + `.alert-message`):

```
Denario Cobros
Se creará un anticipo automático por el monto excedente de USD 12,00.
Se enviará un anticipo junto al cobro.
                                                      [ Aceptar ]
```

Y en el Tab Pagos, bajo el método de pago, la app rotula: **`Este pago creó el anticipo automático`**
(sin monto ni moneda).

Al enviar, la 3.ª alerta —la del servidor— llegó por duplicado, una por documento creado:

```
Denario Premium · "Cobro nro. 4 enviado exitosamente"      [ OK ]
Denario Premium · "Anticipo nro. 5 enviado exitosamente"   [ OK ]
```

**P6 — aritmética, con la tasa:**

| Concepto | BS | ÷ 791,67 | USD que muestra la app |
|---|---|---|---|
| Monto total a pagar | 2.375,01 | 3,0000 | **3,00** |
| Pago | 5.000,00 | 6,3157 | **6,32** |
| **Diferencia → anticipo** | **2.624,99** | **3,3157** | **3,32** |

✅ Cuadra. Y el mismo número llegó a la nube: `collection_payment.nu_amount_partial = 2624.99`,
`nu_amount_partial_conversion = 3.32`.

### 6.3 🔴 Lo relevante para la configuración pendiente

**El anticipo hereda la moneda del cobro padre; NO usa `prepaidRangeCurrency`.** Dos mediciones
independientes, mismo día, misma sesión:

| Cobro padre | Su moneda | Anticipo | **Moneda del anticipo** | Monto |
|---|---|---|---|---|
| Ref **4** | **BS** | Ref **5** | **BS** | 2.624,99 |
| Ref **6** | **USD** | Ref **7** | **USD** | 10,75 |

Es decir: **con `prepaidCurrency` ausente, el anticipo de un cobro en bolívares nace en bolívares** —
justo el caso que se quería descartar. `prepaidRangeCurrency=USD` **sí** se usa (el mensaje habla en USD y
el umbral se evalúa en USD), pero **solo para el umbral y el aviso**, no para la moneda del documento.

⚠ **Esto es la medición, no el veredicto.** Con `prepaidCurrency` sin persistir no se puede saber si el
comportamiento observado es el correcto o el que el fix debía evitar. **Por eso el stand by es acertado.**

**Observación adicional para el mismo análisis:** el anticipo se grabó con
`collection_payment.co_payment_method = **'ef'**` (el método del cobro origen), **no `'pa'`** como indica
`prepaidPaymentMethod`. Conviene verificarlo junto con `prepaidCurrency` — huele al mismo tipo de causa
(una VG de prepago que no se está consumiendo).

### 6.4 F1 · El desajuste en bolívares — **la comparación pedida**

En el anticipo Ref **5** (Tab TOTAL), los dos importes que el defecto de globalmp descuadraba:

| Línea | Importe |
|---|---|
| **Total Efectivo:** | **BS 2.624,99** · USD 3,32 |
| **Monto BS:** (detalle de pago) | **2.624,99** |
| Monto USD: | 3,32 |
| Total General BS: | 2.624,99 |

**COINCIDEN.** ✅

Y no coinciden por casualidad: si la app recalculara desde el USD ya redondeado —que era la causa del
defecto— mostraría **3,32 × 791,67 = 2.628,34**, con un desfase de **3,35 BS**. Muestra el bolívar guardado.

⚠ **Caveat honesto:** el defecto original se reportó sobre la línea **«Total Depósitos»**, y este anticipo
se pagó con **Efectivo**, así que la línea medida es **«Total Efectivo»**. Es el mismo bloque de plantilla
(`Total <método>` del Tab Total), pero **la variante literal con Depósito no se llegó a medir**: los dos
intentos de armar un cobro con Depósito se perdieron (§6.5) y luego entró el stand by.

**Evidencia:** `img/P3-F1-anticipo5-tab-total.png`

### 6.5 F2 · El modal del detalle de pago al reloguear

Procedimiento por intento: **SALIR** desde HOME → login real → Cobros → BUSCAR → abrir el Anticipo Ref 5 →
Tab TOTAL → **click real** sobre la cabecera del acordeón «Total Efectivo:».

Oráculo: **altura del `[slot="content"]`**, no su presencia en el DOM (el contenido existe colapsado siempre).

| Intento | Relogueo | Altura antes del click | Altura después | Contenido desplegado |
|---|---|---|---|---|
| 1 | ✅ real | 0 px | **176 px** | `Monto BS: 2.624,99 · Monto USD: 3,32 · Nro. Recibo:` |
| 2 | ✅ real | 0 px | **176 px** | idéntico |
| 3 | ✅ real | 0 px | **176 px** | idéntico |

**Cargó 3 de 3.** El acordeón nació colapsado las 3 veces y desplegó completo al 1.er click, sin reintentos.

⚠ **Lo que esto prueba y lo que no.** Prueba que **en 3 relogueos consecutivos no reprodujo**. El reporte
original dice *«a veces»*, así que 3 de 3 **no cierra** el defecto: acota. Para decir "corregido" harían
falta más ciclos, o el commit que lo explique.

### 6.6 Alertas al enviar un cobro incompleto (Prioridad 3 del alcance original)

| ID | Caso | Resultado | Cómo bloquea · texto literal |
|---|---|---|---|
| **A1** | Referencia llena, **sin monto** (0,00) → Enviar | ✅ **bloquea** | Sin alerta: el campo Monto rotula **`¡Campo Obligatorio!`** y **`imagenEnviar` pasa a `disabled=true`** |
| **A2** | Monto lleno, **sin referencia** → Enviar | ⚠ **NO bloquea** — *y es correcto* | El hint del campo dice **`Mín. 0 - Máx. 50 caracteres`** ⇒ Nro. Recibo es **opcional por diseño** en Efectivo. El envío avanzó hasta el control de adjunto |
| **A3** | **Ambos vacíos** → Enviar | ✅ **bloquea con alerta** | `Denario Cobros` / **`Hay un método de pago incompleto. Complételo o elimínelo antes de enviar.`** `[Aceptar]` |
| **A4** | Cobro **guardado y reabierto**, incompleto → Enviar | ⛔ **NO MEDIDO** | quedó fuera por el stand by |
| **A5** | Todo lleno → Enviar | ✅ **no bloquea** | El cobro Ref 4 se envió limpio con monto, adjunto y documento |

🔑 **Dato para el reporte de alertas: son DOS mecanismos distintos, no uno.** Con el campo Monto **sin tocar**
sale el `ion-alert`; una vez **tocado y dejado en 0,00**, el bloqueo pasa a ser *campo obligatorio + botón
Enviar apagado* y **el alert ya no aparece**. Un guion que solo busque el alert va a leer A1 como "no bloquea".

Alerta de adjunto (`requiredCollectionAttachments=true`), texto literal:

```
Denario Cobros
Para poder enviar el Cobro, debe agregar al menos un adjunto.      [ Aceptar ]
```

Aceptarla **lleva sola al Tab Adjuntos**.

**Evidencia:** `img/A1-sin-monto-campo-obligatorio.png` · `img/A3-alerta-ambos-vacios.png`

### 6.7 El adjunto obligatorio se resuelve firmando — confirmado

`Tab Adjuntos` → acordeón **`sign`** (los tres son `images` / `file` / `sign`) → el `<canvas>` acepta
`mouse.down` + `mouse.move` + `mouse.up` y la firma queda dibujada; aparece el botón **BORRAR** y el
Enviar deja de reclamar adjunto. **Sin mock de cámara, 1 intento.**

`img/P1-firma-canvas.png`

### 6.8 Cobros creados en el sistema

| Ref (`id_collection`) | Tipo | Moneda | Monto | Cliente | Estado | Origen |
|---|---|---|---|---|---|---|
| **4** | Cobro (`co_type=0`) | **BS** | 5.000,00 | RICARDO BARUTA (385) | Enviado | **intencional** — caso P1 |
| **5** | **Anticipo** (`co_type=1`) | **BS** | 2.624,99 | RICARDO BARUTA (385) | Enviado | **automático** — generado por el Ref 4 |
| **6** | Cobro (`co_type=0`) | **USD** | 140,00 | id_client 369 | Enviado | ⚠ **accidental** — ver nota |
| **7** | **Anticipo** (`co_type=1`) | **USD** | 10,75 | id_client 369 | Enviado | **automático** — generado por el Ref 6 |

**Baseline previo `max(id_collection) = 3`** ⇒ los 4 son de esta corrida. `co_original_collection` enlaza
correctamente 5→4 y 7→6.

⚠ **Sobre el Ref 6 — hay que decirlo sin adornos.** No lo envié a propósito. Se creó mientras el dispositivo
entró en **«Sincronizando - Empresas»** con un formulario de cobro a medio llenar: la app se llevó el
formulario por delante y, entre el estado inconsistente y mis clicks por coordenadas sobre una pantalla que
ya había cambiado, quedó armado y enviado un cobro con otro cliente y otro documento
(`FACT0000010306`, 129,25 USD, pagado 140,00). **Es un artefacto de la automatización, no un defecto del
producto** — un usuario real no llega a ese estado — y por eso **no se reporta como hallazgo**.
Aporta, eso sí, la segunda medición independiente de §6.3, que es válida: el par cobro↔anticipo se grabó
coherente en USD.

**Guardados de apoyo: NINGUNO quedó.** Verificado en la BD local del dispositivo:

```
collections: 7 filas, TODAS con st_delivery = 1 (enviadas)   ·   0 en st_delivery = 3 (guardado)
pending_transactions: 0        failed_transactions: 0
sqlite_sequence.collections = 9  ⇒  los local_id 4 y 5 (los 2 intentos descartados) se borraron de verdad
```

Los formularios que se descartaron se cerraron con el dirty-guard
`[Guardar y salir · Salir sin guardar · Cancelar]` eligiendo **`Salir sin guardar`**.

**Pedidos: 0 creados.** `max(id_order)` en la nube sigue en **402**, del 27/08, y la tabla local `orders` ni
siquiera tiene entrada en `sqlite_sequence`. El formulario de pedido que se abrió para llegar al selector de
clientes se descartó al salir.

---

## 7 · Lo que NO se validó

**Del alcance nuevo — nada quedó pendiente.** Los 3 puntos se midieron completos.

**Del alcance de cobros, detenido por el stand by:**

| No validado | Motivo |
|---|---|
| **P7 — umbral**: que una diferencia **< 1 USD** (< 791,67 BS) **no** genere anticipo | ⛔ stand by antes de armar el caso |
| **A4** — cobro guardado y reabierto, incompleto → Enviar | ⛔ stand by |
| **F1 con la línea literal «Total Depósitos»** | ⛔ 2 intentos de armar un cobro con Depósito se perdieron por la sync; medido con **«Total Efectivo»** (§6.4) |
| **Veredicto sobre la moneda del anticipo** | ⛔ depende de `prepaidCurrency`, que no persiste. La **medición** está (§6.3); el **juicio**, no |
| **K04 — cruce Cobros↔Clientes** | parcial: se observó que dentro de un cobro los documentos salen en **su** moneda (USD) con la conversión BS al lado, y que el saldo del cliente encabeza en BS. Sin veredicto por el stand by |
| **Cierre del selector de monedas de COBROS (§5.2)** | medido y con evidencia, pero **sin segunda medición limpia** ⇒ hallazgo abierto, no FAIL formal |
| Excel de pedidos en la web | fuera de alcance por indicación expresa — lo cubre la QA |

**Nota de estabilidad, para quien retome cobros.** La app **sincroniza sola a mitad de sesión**
(«Sincronizando - Empresas», ~1 min) y **se lleva por delante el formulario abierto**: pasa por la pantalla
de login, vuelve a HOME y el trabajo en curso se pierde. Pasó **2 veces** en esta corrida y es lo que
arruinó los dos intentos de cobro con Depósito. Quien retome cobros conviene que **arme cada cobro de una
sola pasada** y que **verifique la vista activa antes de cada click por coordenadas**.

---

## 8 · Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| 🔑 **`currencyServ.currencyModulesMap`** | **universal** | `ng.getComponent(<cualquier form>).currencyServ.currencyModulesMap` devuelve los **9 módulos** con `localCurrencyDefault` / `showConversion` / `currencySelector`. Es el oráculo K## completo en **una línea**, sin BD y sin navegar. Coincidió 9/9 con `currency_modules` de la nube |
| **`monedaSeleccionada` del componente de módulo** | universal | Prueba **de qué módulo** salió la config sin depender del rótulo de pantalla. En `app-pedido` resolvió a `hardCurrency=true` ⇒ Pedidos lee `ped` |
| **El `#clienteSelectModal` encabeza con la moneda por defecto DEL MÓDULO** | universal | Mismo modal, mismo cliente: desde COBROS `Saldo BS` primero; desde PEDIDOS `Saldo USD` primero. Sirve como oráculo de 1 vistazo, y el contraste entre dos módulos de la misma sesión es evidencia mucho más fuerte que mirar uno solo |
| **Adjunto obligatorio de cobros por FIRMA en canvas** | universal | `app-adjunto ion-accordion-group` → `grp.value='sign'` + `ionChange` → `<canvas>` visible → `mouse.down`/`move`/`up`. **Sin mock de cámara, 1 intento.** Deroga `mock_camara_funciona=false` como bloqueante: no hace falta la cámara |
| **Alertas de "método de pago incompleto": 2 mecanismos** | universal | Campo **sin tocar** ⇒ `ion-alert`. Campo **tocado y en 0,00** ⇒ `¡Campo Obligatorio!` + `imagenEnviar.disabled=true` y **sin alert**. Buscar solo el alert produce un falso "no bloquea" |
| **`app-login` sigue en el DOM con `offsetParent!==null` estando en HOME** | universal | Con rects en 0×0. **No sirve como oráculo de "sesión cerrada"** — usar `getBoundingClientRect().width>0` de sus `ion-input` |
| **`document_sales` local usa `co_document`; la nube usa `co_document_sale`** | universal | Consultar el nombre de nube contra SQLite **aborta la transacción** con `no such column` |
| ⚠ **La sync automática mata el formulario abierto** | cliente (visto 2×) | «Sincronizando - Empresas» a mitad de sesión ⇒ pasa por login, vuelve a HOME y pierde el form. Armar cada transacción de una sola pasada |
| 🔴 **COBROS renderiza selector de monedas contra `cob.currency_selector=false`** | cliente (piercar) | Ver §5.2 — hallazgo abierto |
| ✅ **`detalle_precio_solo_usd` ya no reproduce** | cliente (piercar) | El detalle muestra USD + BS + tasa. Actualizar `piercar.yaml` |
