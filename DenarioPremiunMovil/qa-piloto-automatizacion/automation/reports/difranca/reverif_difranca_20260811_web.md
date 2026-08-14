# Re-verificación post-fix — capa WEB — difranca / EL YAQUE

`RUN_ID` **reverif_difranca_20260811** · playa `http://denarioelyaque.ddns.net:8080/DenarioPremium`
Contra: `automation/reports/smoke_difranca_20260810_main/DEFECTOS-PASO-A-PASO.md` (sección `# 🌐 WEB`)
Guarda de tenant verificada: el combo Empresa lista **exactamente** `DDHP_A12` · `DIF_A12` · `DHVITAL01_A`.
`DDH_A12` no aparece. Ninguna empresa ajena en ningún módulo.

## Método (corrección de la QA aplicada)

Cada defecto se clasifica y se mide con el registro que corresponde:

- **(A) escritura** — el registro viejo quedó mal grabado y va a verse mal para siempre ⇒ **se mide con registro NUEVO**.
- **(B) presentación** — el dato está bien y la pantalla lo pinta mal ⇒ **el registro viejo sirve**.

**Registros nuevos creados/usados hoy:** pedido web **# Ref 52** (creado por este agente, autorizado por QA) ·
cobros **21844 / 21845 / 21846** (creados a mano por la QA en el móvil, 12:36–12:43).

---

## Tabla de veredictos

| # | Defecto | Clase | Registro | Ayer | Hoy | Veredicto |
|---|---|---|---|---|---|---|
| **W1** | Un cobro IGTF deja en blanco todo el listado | **B + A** | viejo **y nuevo** | 18.091/0 · IGTF 4/4 en 0 · Tipo IGTF 2/0 · DIF 63/0 | 1.654/0 · IGTF 5/5 en 0 · Tipo IGTF 2/0 · DIF 63/0 | 🔴 **SIGUE** |
| **W2** | Un pedido guardado no se puede enviar nunca | **A** | **nuevo (# Ref 52)** | carrito vacío · `order_detail_saved` 0 filas | carrito vacío · `order_detail_saved` **2 filas** | 🔴 **SIGUE** (mitad arreglada) |
| **W5** | La web factura con la tasa de 2056 (721,35) | **A** | **nuevo (# Ref 52)** | 721,35 | **721,35** | 🔴 **SIGUE** |
| **W7** | Pedidos de vendedores de baja invisibles | **B** | viejo | combo salta el 283 · 15.519−78=15.441 | combo salta el 283 · **15.524−78=15.446** | 🟠 **SIGUE** |
| **W8** | Filtro `Status` de pedidos devuelve 3 de 15.441 | **A** | viejo **y** nuevo | 3 de 15.441 | **8 de 15.446**; los nuevos **sí** aparecen | 🟢 **ARREGLADO hacia adelante** / el histórico SIGUE |
| **W9** | Estatus de devoluciones | **A** | 879 nueva · 873 vieja | columna vacía 49/50 · detalle sin campo | lista: 879 `Enviado` ✅ / 873 vacía ❌ · **detalle sin campo en las dos** | 🟠 **PARCIAL** — lista arreglada hacia adelante, **detalle SIGUE** |
| **W10** | El visor de adjuntos nunca muestra los PDF | **B** | **nuevo (21844)** + viejo | BD 3 / visor 2 | BD 3 / visor **2** (cobros **y** pedidos) | 🟠 **SIGUE** |
| **W10b** | `Descargar adjuntos` falla en silencio (registro viejo) | **B** | viejo (21823) | sin descarga, sin aviso | **sin descarga, sin aviso** (20 s, 0 diálogos, 0 growl) | 🟠 **SIGUE** |
| W12a | Campos en blanco cuando valen 0 | B | viejo (39794) | en blanco | **en blanco** (`Descuento bonif.` sí pinta `0,00`) | 🟡 SIGUE |
| W12b | Precio crudo en el carrito del alta | B | nuevo | `2625.7140000000004` | **`42069.132000000005`** | 🟡 SIGUE |
| W12d | El alta no muestra totales | B | nuevo | sin totales | sin totales en `nuevoPedido`; `confirmarPedido` **sí** los muestra | 🟡 SIGUE (matizado) |
| W12c | Modal espurio `Si, Borrar` en `Responsable` | B | — | 1 de 2 | no probado | ⚪ NO MEDIDO |

---

## W1 — SIGUE (bloqueante)

**Las 4 mediciones de ayer, repetidas:**

| Medición | Ayer | Hoy |
|---|---|---|
| Vista por defecto (DDHP_A12, 01/08–11/08) | 18.091 contados / **0** pintados | **71 / 0** |
| `# Ref` de los 4 IGTF viejos | 0 pintados 4/4 | **0 pintados 4/4** (1 contado cada uno) |
| `# Ref` de los 3 normales | 1/1 3/3 | **1/1 3/3** |
| `Tipo Cobro = IGTF` | 2 / **0** | **2 / 0** |
| DIF_A12 01/07–10/08 | 63 / **0** | **63 / 0** |

Controles del filtro `Tipo Cobro` sanos: `Cobros` **59/50** · `Retención` **2/2**.

🔴 **Ojo con el falso positivo de Empresa:** 21834/21836/21843 son de **DIF_A12** y con `DDHP_A12` puesta dan
0 contados. Medidos bajo **su** empresa: 21834 (normal) **1/1**, 21836 y 21843 (IGTF) **1 contado / 0 pintados**.

### 🆕 Medido también con un IGTF creado HOY (clase A)

La QA creó tres cobros a mano mientras corría esto, y el trío es un experimento limpio:

| Cobro | `co_type` | `has_igtf` | Comentario de la QA | Pinta |
|---|---|---|---|---|
| **21844** | 0 | **true** | "COBRO CON IGTF INCLUIDO" | ✅ **1/1** |
| **21845** | 0 | false | "cobro con el igtf aparte" | ✅ **1/1** (2 de 2 repeticiones) |
| **21846** | **3** | false | "igtf del cobro 21845" · `id_original_collection=21845` | ❌ **1 contado / 0 pintados** |

⇒ **El que no pinta es el documento IGTF (`co_type=3`), no el cobro que lleva IGTF incluido ni el padre.**
Reproduce igual en un registro de hoy que en los de ayer ⇒ **no es dato viejo mal grabado, es render.**

### La prueba que cierra el caso

Mismo tenant, mismos filtros, **solo cambia la fecha final**:

| Rango (DDHP_A12) | Contiene documentos IGTF | Contados | Pintados |
|---|---|---:|---:|
| 01/06/2026 – **06/08/2026** | no | 1.641 | **50** ✅ |
| 01/06/2026 – **11/08/2026** | sí (21831, 21835, **21846**) | 1.654 | **0** ❌ |

**13 filas más, 3 de ellas documentos IGTF, y se caen las 1.654.** El defecto viaja a la 21.

---

## W2 — SIGUE, pero la mitad entró (bloqueante)

Registro nuevo: pedido web **# Ref 52**, cliente `CAR916`, vendedor Jose Raad (275), 2 líneas
(`ACBBKRI300`, `AOBBK1060`), empresa `DDHP_A12`, creado hoy 12:29.

| Mitad del defecto | Ayer | Hoy | |
|---|---|---|---|
| **Escritura** — ¿guarda las líneas? | `order_detail_saved` **0 filas** para 27 guardados | **2 filas** (`id_order_saved=52`) + **2** en `order_detail_unit_saved` | 🟢 **ARREGLADO** |
| **Lectura** — ¿las devuelve al `Editar`? | carrito *"No existe registro"* | carrito **"No existe registro"** | 🔴 **SIGUE** |
| **Envío** | *"No hay productos en el pedido"* | **"Por favor seleccione un producto antes de continuar"** | 🔴 **SIGUE** |

La cabecera vuelve entera (cliente, vendedor y empresa correctos); **solo el carrito viene vacío**.
⇒ **El dato ya está en la BD y la pantalla de edición no lo lee.** El arreglo que falta es del lado de la lectura.
*(La vista `order_detail_saved_view` no se pudo inspeccionar: `permission denied for sequence order_detail_seq`
— falta un GRANT, no es defecto de producto.)*

**El pedido 52 quedó en Guardado**: no se puede enviar, que es exactamente el defecto.

---

## W5 — SIGUE

El pedido **# Ref 52**, creado hoy, se armó con **`Tasa: 721,35 BSD = 1,00 US$`**.
Corroborado en BD sobre sus propias líneas: `39.905,0820 / 55,3200 = 721,35` (con la tasa vigente 752,09
la conversión habría dado 53,06). Las 3 filas de `conversion_type` con fecha 2056 siguen ahí, y **no hay
guarda de código que las descarte**.

---

## W7 — SIGUE

- Combo de Vendedor en `/pages/pedidos`: **17 opciones**, `id_user` 274→291 **salteándose el 283**
  (Dayana Acuña). Lista completa verificada opción por opción.
- Aritmética: BD `DDHP_A12` = **15.524** pedidos vigentes · web sin filtro = **15.446** ⇒ **diferencia 78**,
  la misma de ayer. Atribución exacta en BD: los **78** son del `id_user` **283**, y es el **único** usuario
  con pedidos fuera de `salesman_view`.

---

## W8 — ARREGLADO hacia adelante, el histórico sigue mudo

| Filtro (DDHP_A12, 01/01/2015–31/12/2026) | Contados | Pintados |
|---|---:|---:|
| sin filtro | 15.446 | 50 |
| `Status = Enviado` | **8** | 8 |
| `Status = Por aprobar` (control) | **0** | 0 |
| `Status = Guardado` (control) | **1** | 1 (mi pedido 52) |

El control da números distintos ⇒ **el filtro discrimina, no se ignora.**
Ayer daba **3** (39794/39795/39796); hoy da **8** y los 5 nuevos son **39797, 39798, 39800, 39801, 39802**,
que son exactamente **todos** los pedidos creados desde el 10/08 en esa empresa. Mi pedido guardado también
aparece bajo su status.
⇒ **Los registros creados desde ayer quedan bien rotulados y el filtro los encuentra, 100 %.**
El universo viejo (15.438 restantes) va a seguir sin aparecer **por diseño**: nunca se les escribió la fila
en `transaction_statuses`. Eso **no es "sigue el defecto"**, es dato histórico que solo se arregla con un
backfill, y es decisión de datos, no de la 21.

---

## W9 — PARCIAL: la lista se arregló hacia adelante, el detalle no

| | Devolución **879** (nueva, 10/08) | Devolución **873** (vieja, 28/07) |
|---|---|---|
| Columna `Estatus` de la lista | **`Enviado`** ✅ | **vacía** ❌ |
| Campo `Estatus` en `detalleDevolucion` | **no existe** ❌ | **no existe** ❌ |

⇒ **Dos cosas distintas, y conviene reportarlas separadas:**
1. La **columna de la lista** se corrige sola hacia adelante (los nuevos traen su fila de estatus). El histórico
   queda mudo — mismo caso que W8.
2. La **ausencia del campo `Estatus` en el detalle SIGUE**, y **también en la devolución nueva** ⇒ eso **no** es
   maduración de datos, es la pantalla que no tiene el campo. **Ese arreglo no entró.**

---

## W10 — SIGUE

**Visor (medido sobre un registro NUEVO, para que no se lo pueda atribuir a datos viejos):**

| Registro | BD dice | El visor muestra |
|---|---|---|
| Cobro **21844** (creado hoy 12:36) | 2 imágenes + **1 archivo** = **3** | **2** (`21844_0.jpeg`, `21844_1.jpeg`) — **0 PDF** |
| Pedido **39794** | 2 imágenes + **1 archivo** = **3** | **2** (`39794_0.jpeg`, `39794_1.jpeg`) — **0 PDF** |

🔑 **El PDF existe y se descarga:** el ZIP del 21844 trae **3 entradas** — `21844_0.jpeg`, `21844_1.jpeg` y
**`21844_0.pdf` (5.013 bytes)**. O sea que el archivo está en el servidor y el **visor sencillamente no lo pinta,
ni avisa de que existe**. Reproduce en cobros y en pedidos.

**`Descargar adjuntos` en registro VIEJO (la pregunta de código):**

| Registro | Resultado |
|---|---|
| Cobro **21823** (04/08, anterior al corte) | **ningún evento de descarga en 20 s · 0 diálogos · 0 mensajes** ⇒ **sigue fallando en silencio** |
| Cobro **21844** (hoy) | descarga `cobro_21844.zip` (172.423 bytes, 3 entradas) ✅ |

⇒ Que los archivos viejos falten en disco es de despliegue y no de la 21, pero **la parte que sí es código
—avisar en vez de no hacer nada— NO se arregló.**

🔴 **Los adjuntos descargados se borraron inmediatamente.** Barrido verificado sobre todo
`DenarioPremiunMovil\` incluida `.playwright-mcp\`: **0 archivos `.zip/.jpeg/.jpg/.pdf`** en disco.

---

## Cosméticos

- **W12a SIGUE** — en `detallePedido` del 39794, `Descuento Global` sale **vacío** mientras
  `Descuento bonif.` sí pinta **`0,00 BSD`**. Un 0 y un "no calculado" se siguen viendo igual.
- **W12b SIGUE** — en el carrito del alta, precio crudo **`42069.132000000005`**.
- **W12d SIGUE, con matiz** — `nuevoPedido.xhtml` no muestra ningún total mientras se arma el pedido; la
  pantalla siguiente (`confirmarPedido.xhtml`) **sí** muestra `Total Base` y `Total` en las dos monedas.
- **W12c no se midió** (no determinista, requería rehacer el alta; se priorizaron los bloqueantes).

---

## Notas de método

- Filtros limpiados y **releídos** antes de cada `Buscar`; ningún veredicto se emitió sin verificar
  Empresa + fechas + `# Ref` + todos los `<select>` en la misma llamada previa.
- Nunca se pobló, buscó y leyó en la misma `evaluate`; además se esperó **cambio real del `tbody`** antes de leer.
- **Un caso lo cazó esa disciplina:** una primera lectura dio el cobro 21845 en 0 pintados; al repetirla con el
  rango ampliado dio **1/1 dos veces seguidas** ⇒ era un render rezagado, **no** un defecto. Se descarta.
- No se tocó el dispositivo Android ni el CDP `:9220` en ningún momento.

---

## Paginación: ¿se rompe la lista entera o solo la página del IGTF?

**La QA tiene razón y nosotros lo habíamos medido mal.** Hasta ahora reportábamos «`N contados / 0 pintados`»
leyendo **solo la página 1**. La lista **no** queda vacía: **se rompe únicamente la página que contiene un
documento IGTF**; todas las demás pintan perfecto.

**Montaje** (sin tocar filtros, los mismos de la medición anterior): empresa `DDHP_A12`
(*DISTRIBUIDORA DIAZ HERNANDEZ*), `01/06/2026 – 11/08/2026`, 50 filas/página.
`rowCount` refrescado = **1.655** (eran 1.654; la QA creó el 21847 mientras corría esto) ⇒ **34 páginas**.
Guarda de tenant reverificada sobre el combo: exactamente `DDHP_A12` · `DIF_A12` · `DHVITAL01_A`.

### 1. Orden DESCENDENTE (lo que ve la QA por defecto)

| Página | Refs que le tocan | Contiene IGTF | Pintadas |
|---|---|---|---:|
| **1** | 21847 → 21777 | **sí: 21831, 21835, 21846** | **0** ❌ (3 lecturas) |
| 2 | 21776 → 21721 | no | **50** ✅ (2 lecturas) |
| 3 | 21719 → 21663 | no | **50** ✅ |
| **34** (última) | 19737 → 19721 | no | **5** ✅ (=1.655−33×50, página completa) |

⇒ **1 página rota de 34.** De 1.655 filas, **1.605 se ven sin problema**. El «listado entero vacío» era un
artefacto de leer siempre la página 1.

### 2. ¿Viaja con la fila o con la posición? → **con la FILA**

Se invirtió el orden pinchando la cabecera **`# Ref`** (`aria-sort=ascending` verificado). Los IGTF, que son
los refs más altos, pasan de la página 1 al final de la lista. **El defecto se fue con ellos:**

| Página (orden ASCENDENTE) | Refs | Contiene IGTF | Pintadas |
|---|---|---|---:|
| **1** | 19721 → 19799 | no | **50** ✅ ← *estaba vacía hace un minuto* |
| 32 | 21713 → 21768 | no | **50** ✅ |
| **33** | 21769 → 21838 | **sí: 21831, 21835** | **0** ❌ (2 lecturas) |
| **34** (última) | 21841, 21844, 21845, 21846, 21847 | **sí: 21846** | **0** ❌ (2 lecturas) |

**La página 1 se curó y se rompieron la 33 y la 34.** El corte es **«la página que contiene el documento
IGTF»**, no una posición fija. Con 3 IGTF repartidos en 2 páginas ⇒ **2 páginas rotas**; en descendente los
3 caían juntos en la página 1 ⇒ **1 página rota**. La cuenta cierra en los dos sentidos.

### 3. ¿Cuántas filas se pierden? → **la página completa, no la fila**

El caso más limpio es la **última página en ascendente: 5 filas, exactamente 1 IGTF**, y se pierden **las 5**:

| Ref de esa página | `co_type` | ¿Sana? |
|---|---|---|
| 21841 | 2 | sana — **se pierde igual** |
| 21844 | 0 | sana (**pinta 1/1 sola**, ver W1) — **se pierde igual** |
| 21845 | 0 | sana (**pinta 1/1 sola**, ver W1) — **se pierde igual** |
| **21846** | **3** | **el IGTF** |
| 21847 | 0 | sana — **se pierde igual** |

**1 documento IGTF se lleva por delante 4 filas sanas.** No es que falte una fila: el `<tbody>` vuelve con
**0 bytes de HTML** — ni siquiera el mensaje de «no existe registro».

**Y el daño escala con el tamaño de página**, lo que confirma que la unidad que se pierde es *la página*:

| Filas/página | Páginas | Página con los 3 IGTF | Filas perdidas |
|---:|---:|---|---:|
| 50 | 34 | pág. 33 (2 IGTF) + pág. 34 (1 IGTF) | **55** (50 + 5) |
| 200 | 9 | pág. 9, con los 3 juntos (55 filas) | **55** |
| 200 | 9 | *control:* pág. 8 = 200 filas, sin IGTF | 0 — **200 pintadas** ✅ |

Con 50/pág. una página llena que tuviera **un solo** IGTF perdería **las 50**.

### Qué cambia para desarrollo

- **La severidad baja**: no es «la web de cobros no funciona», es «**se pierde la página donde cae un
  documento IGTF**» — hoy, con 5 IGTF en total, son **1 o 2 páginas** según el orden.
- **El síntoma que ve el usuario sigue siendo grave**: como el orden por defecto es descendente y los IGTF son
  lo más reciente, **la página 1 es justo la que se rompe** — o sea, el usuario abre Cobros y ve la lista vacía,
  aunque haya 1.605 filas sanas a un clic de distancia. Por eso parecía total.
- **La pista de código**: el conteo del servidor es correcto (`rowCount` = 1.655 siempre, en todos los órdenes
  y tamaños de página). Lo que falla es **el render de la fila `co_type=3`**, y al reventar **aborta el render
  de todo el `<tbody>`** de esa página. Hay que buscar la excepción al pintar el documento IGTF —
  probablemente un campo que en `co_type=3` viene nulo y que la columna asume presente.
- **Workaround verificable para la QA mientras tanto**: pinchar la cabecera `# Ref` para invertir el orden deja
  la página 1 utilizable.

**Lo que NO se pudo aislar:** no existe hoy una página **llena de 50** con **exactamente un** IGTF (los 5 IGTF
del sistema se agrupan por fecha), así que el «50 por 1 IGTF» queda **inferido** del patrón —
medido de verdad está **5 filas perdidas por 1 IGTF** y **55 por 3**. No se rellenó ese hueco.

**Método:** cada página vacía se leyó **dos veces** (la 1 en descendente, tres) para descartar render rezagado;
nunca se pobló y leyó en la misma `evaluate`; se ancló a **texto** de cabecera y a clases `ui-paginator-*`,
nunca a `j_idt*`; el estado se devolvió como se encontró (50/pág., descendente, mismos filtros).
No se tocó el dispositivo ni el CDP `:9220`. Solo lectura: no se creó ni modificó ningún registro.
