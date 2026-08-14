# Defectos difranca / `main` — paso a paso para verificar a mano

`RUN_ID` `smoke_difranca_20260810_main` · build **main** commit `99b138fa` · playa **EL YAQUE**
**Segmentado por capa** (MÓVIL / WEB / AMBAS), y dentro de cada capa ordenado por si **bloquea operación**.

✅ **Corrida cerrada.** Móvil 9/9 módulos (sin depósitos, por instrucción de QA) · Web en 4 tandas.

| Módulo | PASS | FAIL | BLOCKED | N/A |
|---|---:|---:|---:|---:|
| Login | 6 | — | — | — |
| Clientes | 11 | 1 | — | — |
| Productos | 8 | 1 | — | 1 |
| Pedidos | 14 | — | — | — |
| Cobros *(solo lectura)* | 7 | 2 | — | 30 |
| Inventarios | 16 | — | — | — |
| Devoluciones | 15 | 1 | — | 2 |
| Visitas | 14 | — | — | 2 |
| Vendedores | 3 | — | — | — |
| **Total** | **94** | **5** | **0** | **35** |

🔴 **0 BLOCKED.** Ojo: **el conteo de FAIL no mide la gravedad** — varios de los defectos más serios cayeron
fuera de la tabla de casos, porque los oráculos del guion se cumplían y el problema estaba alrededor. Login
es el ejemplo: 6/6 PASS y ahí estaba la pérdida de datos.

---

# 🔄 ESTADO TRAS LA RE-VERIFICACIÓN DEL 2026-08-11 (build con fixes)

Móvil verificado **a mano por QA**; web por agente. Método acordado: **los registros viejos no sirven para
juzgar defectos de escritura** — para ésos se creó registro nuevo.

## Móvil

| | Defecto | Estado | Evidencia |
|---|---|---|---|
| M1 | Borra la BD local antes de autenticar | ✅ **NO ES DEFECTO** | QA 11/08: con **el mismo usuario** y contraseña mala no borra nada. Con **otro usuario** el borrado es lo esperado —cambiar de usuario debe limpiar la data del anterior—, independientemente de la contraseña. *Observación menor registrada, no reportada: como el borrado ocurre antes de validar, un **error de tipeo en el usuario** también borra. Decisión de QA: no reportar.* |
| M2 | El aviso dispara por mayúsculas | ✅ **ARREGLADO** | QA lo probó: `Vend206` vs `VEND206` ya no dispara |
| M3 | Factor de bulto ⇒ 12× de más | ❌ **FALSO POSITIVO, retractado** | `UNID` tiene `qu_unit=12` y `CAJAS` tiene 1 — la app aplicó el dato bien |
| M4 | Conversión invertida en `USD` | ✅ **ARREGLADO** | Cobro **21849** (DIF_A12, `USD`, 647,74): muestra **487.158,78**, que es 647,74 × 752,09. Antes daba 0,86 |
| M5 | Crédito Disponible en moneda equivocada | ⏳ **PENDIENTE** | Falta abrir CAR064 y restar |
| M6 | Diferencia fantasma con IGTF | ✅ **NO REPRODUCE** | Cobro **21844** (con IGTF incluido): no aparece Diferencia |
| M7-M11 | — | 🚫 **Descartados por QA** | No se reportan |

### 🆕 Defectos nuevos hallados por QA el 11/08

- 🔴 **La fecha del pago no persiste al GUARDAR el cobro.** Se pone 01/08, se guarda, se reabre y vuelve a
  mostrar la fecha de hoy. **Ya reportado por QA.**
  ⚠ **No se puede verificar desde la nube:** no existe tabla de cobro guardado (solo hay `order_saved` para
  pedidos), así que el cobro guardado vive **únicamente en la BD local del dispositivo** hasta enviarse.
  *En el cobro **enviado** la fecha sí queda bien — pero porque QA la volvió a escribir antes de enviar.*
- 🔴 **La primera página de cobros no se ve en la web.** ⇒ Resultó ser la forma correcta de describir W1,
  ver abajo. **Ya reportado por QA.**

## Web

| | Defecto | Estado |
|---|---|---|
| W1 | El IGTF vacía el listado de cobros | 🔴 **SIGUE — pero redefinido y menos grave**, ver abajo |
| W2 | Pedido guardado que no se puede enviar | 🔴 **SIGUE, con medio fix puesto** |
| W3 | Adjuntos viejos 404 + botón que falla en silencio | 🔴 **SIGUE** (archivos y silencio) |
| W4 | Pago en BS contra cobro en USD se reconvierte | ⏳ **PENDIENTE** — falta un cobro nuevo pagado en BS |
| W5 | Factura con la tasa de 2056 (721,35) | 🔴 **SIGUE** — las 3 filas siguen en BD |
| W6 | — | ❌ **Retractado** junto con M3 |
| W7 | Pedidos de vendedores de baja invisibles | 🟠 **SIGUE** — `15.524 − 78 = 15.446`, sigue faltando el `id_user` 283 |
| W8 | Filtro `Status` | ✅ **ARREGLADO hacia adelante** — 8 de 15.446, y son **todos** los pedidos desde el 10/08. Lo viejo queda mudo salvo backfill |
| W9 | Estatus de devoluciones | 🟠 **PARCIAL** — la **lista** se arregló hacia adelante; el **detalle sigue sin campo Estatus**, ni en los nuevos |
| W10 | Visor sin PDF | 🟠 **SIGUE** — cobro nuevo 21844: 3 en BD, 2 en el visor, y el ZIP sí trae el PDF |
| W11 | Contaminación cruzada de tenants | 🟠 **SIN CAMBIOS** (14/17 y 28/62) |
| W12 | Cosméticos | a, b y d **siguen**; **c NO MEDIDO** (no determinista) |

### 🔴 W1 REDEFINIDO — la caracterización de ayer estaba mal

**No queda vacío el listado: muere solo la página que contiene un documento IGTF.**
Con DDHP_A12 / 01/06-11/08 (1.655 filas, 34 páginas): página 1 = **0 pintadas** (leída 3 veces), página 2 =
**50/50**, página 3 = **50/50**, última = **5/5** ⇒ **1.605 de 1.655 filas visibles.**

**El defecto viaja con la FILA, no con la posición.** Invirtiendo el orden por `# Ref`, la página 1 pasó a
pintar **50/50** y se rompieron la **33 y la 34** — las que quedaron con los IGTF.

**Se pierde la página entera, no la fila:** última página en ascendente = 5 filas con **1** IGTF → **0
pintadas**. Escala con el tamaño de página: **5 perdidas por 1 IGTF, 55 por 3**, y serían 200 con páginas de 200.

🔴 **Especificación para desarrollo:** el conteo del servidor **siempre es correcto** (`rowCount` = 1.655 en
todo orden y tamaño). **Lo que falla es el render de la fila `co_type=3`, y al fallar aborta el `<tbody>`
completo de esa página** (vuelve con 0 bytes, ni el mensaje de "no existe registro").
⚠ Sin explicar: **el_palmar tiene 10 documentos IGTF sobre el mismo build y su listado funciona.** Hay un
tercer factor que no identificamos.

### 🔴 W2 — la mitad del arreglo entró

`order_detail_saved` pasó de **0 → 2 filas** al guardar el pedido nuevo (# Ref 52) ⇒ **la escritura ya
funciona, las líneas dejaron de perderse.** Pero `Editar` sigue devolviendo *"No existe registro"* y no deja
enviar ⇒ **falta que la lectura vaya a buscarlas.**

## 📊 Uso real de los flujos rotos — lo que decide el impacto en difranca

| Flujo | Uso real |
|---|---|
| Documentos IGTF (W1) | **0 en toda la historia.** Los 5 que existen los creó QA esta semana |
| Alta de pedidos por web (W2) | **1 pedido enviado en toda la historia** (el de esta corrida). 13 guardados en 2 años |

⇒ **Ninguno de los dos bloqueantes afecta la operación diaria de difranca**, que es 100 % móvil
(16.565 pedidos por móvil contra 1 por web).

## ✅ Recomendación antes de liberar

1. **Borrar las 3 filas de `conversion_type` con fecha 2056** (ids 3443/3445/3447). Es la única de las que
   quedan que mueve plata —4 % menos en cada pedido web— y **no necesita código**.
2. Dejar W1 y W2 **abiertos y documentados**, no cerrados. A W2 le falta poco: la lectura.
3. **Los adjuntos anteriores al 07/08 necesitan dueño aparte** — es pérdida de archivos en el despliegue, no
   un bug de la 21, y a difranca le pega hoy: no puede recuperar el respaldo de ningún cobro viejo.

---

**Datos de contexto que se repiten abajo**
Empresas: **DDHP_A12** (id 2, principal) · **DIF_A12** (id 3) · **DHVITAL01_A** (id 4, la única con bultos).
Monedas: `BSD` (1) · `US$` (2) · `USD` (3) — 🔴 **`US$` y `USD` muestran el mismo rótulo.** Tasa vigente **752,09**.

---
---

# 📱 MÓVIL

## M1 🔴 · La base local se borra ANTES de validar la contraseña
**Estado: ya reportado por QA** — reproducido con `Vend206` en vez de `VEND206`.

Cronología medida cada 0,9 s, 2 de 2: `t=0` 87 tablas / 170 clientes → `t+1,2 s` **BD destruida** y todavía
**sin respuesta del servidor** → `t+2,1 s` recién aparece *"Usuario y/o contraseña incorrectos"*.
Se lleva `pending_transactions`: **cobros, pedidos y devoluciones guardados sin enviar se pierden.**

**Paso a paso**
1. Montá un cobro y **dejalo Guardado sin enviar**.
2. Salí de la app.
3. Volvé a entrar escribiendo el usuario **con distinta caja** (`Vend206`) — o dejá que el teclado te
   autocapitalice — y una **contraseña equivocada**.
4. Aceptá el aviso de borrado.
5. Entrá bien: **el cobro guardado ya no está.**

**Va junto con M2**, que es lo que hace que el escenario sea cotidiano en vez de raro.

## M2 🟠 · El aviso de borrado dispara con el MISMO usuario, por mayúsculas
**Estado: ya reportado por QA.**
La app compara lo tecleado contra `localStorage.login` **sensible a la caja** y guarda literalmente lo tecleado.
3 disparos en la corrida, mismo usuario y dispositivo, solo alternando mayúsculas.
**Paso a paso:** logueate con `VEND206`, salí, y volvé a entrar con `Vend206`. Salta el aviso de borrado.

## ~~M3~~ ❌ RETRACTADO — **FALSO POSITIVO. No reportar.**
*(QA no pudo reproducirlo el 10/08 y la revisión de datos le dio la razón.)*

**Lo que se había afirmado:** que el factor de bulto no se aplicaba al precio y el pedido **39799** se
facturaba 12× de más (1.135,68 US$ en vez de 94,64).

**Por qué era falso.** El agente asumió que `CAJAS` era el bulto de 12 y `UNID` la unidad suelta.
**En el dato es al revés:**

| Unidad | `qu_unit` |
|---|---:|
| `CHBK300CAJAS` | **1** |
| `CHBK300UNID` | **12** |

Con eso la cuenta cierra sola y es consistente en las dos filas — `cantidad × precio × factor`:
`2 × 43,68 × 1 = 87,36` y `2 × 43,68 × 12 = 1.048,32`. **La app aplicó el dato tal como está cargado.**
El "debería ser 94,64" salía de la suposición invertida, no del dato.

**Sin daño histórico:** en toda la BD hay **una sola** fila de `order_detail_unit` con factor ≠ 1 — la que creó
esta corrida. Nadie había pedido nunca las dos unidades en la misma línea.

⚠ **Lo único que queda, y es de configuración, no de la 21:** que el maestro de DHVITAL01_A tenga una unidad
llamada **"UNID" con factor 12** y otra llamada **"CAJAS" con factor 1** es confuso y se presta exactamente a
este malentendido. Vale mencionarlo a quien administra los maestros; **no es defecto de producto.**

🔴 **W6 cae con esto** — era la cara web del mismo supuesto.

## M4 🔴 · Cobros en `USD`: la conversión se muestra invertida
**DIF_A12 · 801 cobros expuestos** · la BD está **bien**, miente la pantalla

La app solo reconoce **`US$`** como moneda fuerte ⇒ trata **`USD`** como moneda local y **divide en vez de
multiplicar**.

**Paso a paso**
1. Abrí el cobro **21839** (DIF_A12, moneda `USD`).
2. Tab Total: dice `Monto total a Pagar BSD 0,26`.
3. **Dos líneas más abajo**, la misma pantalla dice `Total Transferencias: BSD 147.439,72`.
4. La cuenta: `196,04 ÷ 752,09 = 0,26` — debería **multiplicar**.
5. Control: los cobros en `US$` (**21838**, **21824**) multiplican bien.

## M5 🔴 · Crédito Disponible descuenta la deuda en la moneda equivocada
**Regresión respecto de v6.6.18** · **226 clientes con límite < 10.000** lo sufren de verdad
⚠ **Decisión pendiente de QA:** en globalmp se resolvió no reportar los campos de crédito por "informativos".
Si alguien despacha a crédito mirando este número, cambia la severidad.

**Paso a paso — la pantalla se contradice sola, no hace falta BD**
1. Abrí el detalle de **CAR064 — MAXICENTER MIRANDA**.
2. Restá `Crédito − Crédito Disponible`.
3. Comparalo con el **Saldo** que muestra **esa misma pantalla**.
4. No coinciden, y el cociente da la **tasa del día**.

Medición de QA el 10/08: `488.861,30 − 488.856,68 = 4,62` y `3.471,61 ÷ 752,09 = 4,62` ✅
Con límite 5.000 y deuda 4.000 mostraría **4.994,68** disponibles en vez de 1.000 ⇒ la venta a crédito se
aprueba sola.

## M6 🟠 · Diferencia fantasma en cobros con IGTF
"Monto total a Pagar" se calcula **sin** el IGTF pero "Pago" **sí** lo incluye ⇒ el Tab Total imprime una
Diferencia igual al IGTF en un cobro que en BD cierra en cero.
**Paso a paso:** abrí el **21838** (Diferencia `11,10` = el IGTF) o el **21824** (`2,58`).
Agravantes: la Diferencia se pinta **azul**, el color de "cubierto", y **el IGTF no figura en ese tab**.
difranca tiene `tolerancia0=false`.

## M7 🟠 · "Cartera Clientes" cuenta clientes que ya no están asignados
Muestra **178 / 33 / 1** cuando los reales son **148 / 21 / 1**: cuenta `client_template_user` **sin filtrar
`co_operation='D'`**, sumando **42 asignaciones de baja**.
**Paso a paso:** entrá a VENDEDORES y mirá "Cartera Clientes" (**178**). Entrá a CLIENTES y contá los que
realmente podés seleccionar: **148**.
🔴 **Es el gemelo móvil de `REP-ACTIVACION-CLIENTES-CIFRAS-MALAS`** (web, ya confirmado a mano por QA) ⇒
**probablemente un solo arreglo en el servicio de métricas cubra las dos capas.** Dos tarjetas se vuelven una.

## M8 🟠 · Doble toque en Guardar crea dos visitas, y una queda sin actividades
**Conocido desde el tag 20, sigue sin arreglar.** Reproduce en main, y con un agravante que la ficha no recoge.
**Paso a paso:** armá una visita con al menos una actividad y tocá `Guardar` **dos veces rápido**. Aparecen dos
`Ref 0 · Guardado`; abrí las dos: **una viene sin actividades**.
**Contención:** las duplicadas **quedan locales**, la nube no se ensucia.

## M9 🟡 · Borrar una visita deja la incidencia huérfana
3 de 3, solo BD local. La visita sale de `visits` pero su fila sobrevive en `incidences`.
Descrito en `module-selectors` desde globalmp pero **sin ficha en `defectos-conocidos.yaml`** — conviene registrarlo.

## M10 🕐 · El catálogo corta antes de terminar — **MAPEADO, NO SE REPORTA**
**Decisión de QA (10/08):** *"si el producto aparece al buscarlo, no hay gran defecto… podemos dejarlo mapeado
y ver su comportamiento en el resto de clientes."*
**98 de 381 productos cotizables (26 %)** inalcanzables navegando. Pinta por `co_product` ascendente salteando
los sin precio, y corta en cola contigua.
Para retomarlo: últimos visibles **BBK** `KITBBKRI300` · **Pasarela** `CHSPMNY30U` · **HD Cosmetics** `JHCM180U`
*(derivado, no medido)*. Caso más claro: **`MABBKRI240U`** (6.712 unidades) no aparece bajando y sí buscándolo.
⚠ **Cortes distintos por componente:** Productos 93/114 en BBK · selector del Pedido 83/106.
**Inventarios y Devoluciones NO lo tienen** (llegan a 450/450 y 114/114).

## M11 · `VND-KPIS-SIN-SEGMENTAR` — conocido, reproducido, no se re-levanta
`Activados = 10` idéntico en las 3 empresas, y `9 + 0 + 1 = 10` es el total global del vendedor ⇒ es **el global
sin el filtro de empresa, repetido**. Oráculo sin BD: `Activados 10 > Cartera 1` en DH VITAL.

---
---

# 🌐 WEB

## W1 🔴 · Un solo cobro IGTF deja en blanco TODO el listado de cobros de la empresa
**Bloqueante para el tag** · reproducido 4 de 4 · **el móvil está sano**

El listado **cuenta N y pinta 0**. Vista por defecto: **18.091 contados / 0 pintados**.
Medido en DIF_A12 del 01/07 al 10/08: **63 contados / 0 pintados**; excluyendo los IGTF → **56/50** ✅.

**Paso a paso**
1. Entrá al listado de cobros y **limpiá los filtros** (persisten en sesión y ya causaron un falso positivo).
2. Filtrá un rango que **incluya** el cobro **21843** (IGTF creado hoy sobre main) ⇒ **lista vacía con
   contador > 0**.
3. Cambiá el rango para **excluir** los IGTF ⇒ la lista **aparece**.
4. Control por `# Ref`: **21828 / 21832 / 21834** (normales) pintan 1/1 ✅ · **21831 / 21835 / 21836 / 21843**
   (IGTF) pintan **0** ❌.
5. Filtro `Tipo Cobro`: Cobros 17.873/50 ✅ · Anticipo 214/50 ✅ · Retención 2/2 ✅ · **IGTF 2/0** ❌.
6. En el **móvil** el 21843 **se ve y se abre** ⇒ exclusivo de la web.

🔴 **El contraejemplo de el_palmar ya no vale:** corre el mismo build (`common.css` 06/08 idéntico en las tres
playas) y no rompe. **No era la versión** ⇒ el defecto viaja con el código a la 21.

## W2 🔴 · Un pedido guardado en la web no se puede enviar nunca
**Bloqueante** · confirmado en BD

**Paso a paso:** creá un pedido web con 2 líneas → **Guardar** → salí → volvé a entrar → `Editar`.
La cabecera vuelve entera pero el carrito dice *"No existe registro"*, y `Enviar` responde *"No hay productos
en el pedido"*.
**Corroboración:** **27 pedidos guardados** en el tenant (algunos de 2024) y `order_detail_saved` con **0 filas**.
En toda la historia de difranca hay **1 solo pedido web enviado** — el 39797 de hoy, y solo porque se
recargaron las líneas a mano.

## W3 🔴 · Faltan del disco todos los adjuntos anteriores al 07/08/2026
**Los 5 módulos** · ~**38.900 de 38.990** archivos · **no es bug de la 21**, es pérdida en el despliegue

La BD los registra y la web los ofrece; el servidor devuelve **404**.
**Descartado que sea la extensión o el módulo:** un `.jpeg` de **2024** también da 404, y un `.jpg` de **agosto
2026** también. **El corte es la fecha.**
🔴 **La parte que SÍ es código y viaja a la 21:** el botón `Descargar adjuntos` **falla en silencio** —
habilitado, sin descarga y sin mensaje de error.

**Paso a paso:** abrí cualquier cobro o devolución **anterior al 07/08** que diga tener adjunto y pulsá
`Descargar adjuntos`: no pasa nada **y no avisa**. Repetí con el cobro **21838** o la devolución **879** (de
hoy): descargan bien.

## W4 🔴 · Un pago en bolívares contra un cobro en dólares se vuelve a convertir
**DIF_A12 · 21 de 33 documentos en USD afectados** (0 de 17 en BSD) · **no es regresión de main**, es estructural

`collection_payment` **no tiene columna de moneda**: el importe se guarda pelado y se le asume la moneda del cobro.

**Paso a paso**
1. Abrí el cobro **21786** (968,60 USD, tasa 737,88).
2. Mirá el renglón de pago: **443.584.737,71 BSD**. Un abono de 443 millones contra un cobro de 968,60 US$ es
   imposible.
3. Dividí el importe guardado por la tasa: `601.161,08 ÷ 737,88 = 814,71` — **un pago parcial razonable**.
4. Repetí con otros cobros en `USD` de DIF_A12.

Deja inservible cualquier reporte de cuentas por cobrar de esa empresa.

## W5 🔴 · La web factura con una tasa de hace un mes (−4,09 % por pedido)
**Solo al CREAR** (mostrar registros está sano) · **solo difranca** entre los 4 tenants

Hay **3 filas de `conversion_type`** (ids 3443/3445/3447, una por empresa) con `date_conversion` = **25/07/2056**
y tasa **721,35**. La web resuelve por `max(date_conversion)` ⇒ **esa fila gana siempre, y seguiría ganando 30
años**. La fila se delata sola: su código es `US$13720262626`, o sea **13/07/2026** — alguien tecleó 2056.

**Paso a paso:** creá un pedido en la web y mirá la tasa: **721,35**. Creá uno en el móvil con el mismo cliente:
**752,09**. En BD **ninguno de los 16.560 pedidos móviles** usa 721,35.
**Dos arreglos distintos:** limpiar esas 3 filas en difranca (inmediato) **y** una guarda contra fechas futuras
en el código (el arreglo de verdad).

## ~~W6~~ ❌ RETRACTADO junto con M3 — **no reportar como defecto de dinero**
Se había dicho que la web volvía "inauditable" un sobrecosto de 1.041,04 US$. **Ese sobrecosto no existe:**
el cálculo era correcto (ver M3 retractado).

**Queda un residuo menor, de presentación:** la web colapsa las dos filas de unidad en **un renglón**
(`2 CAJAS 2 UNIDADES` a `43,68 US$`, subtotal `1.135,68`), así que **con los números en pantalla no se puede
reconstruir el subtotal** — no se ve qué factor se aplicó a cada unidad. Es un problema de auditabilidad, 🟡,
no de plata. Ubicarlo con los cosméticos de W12 si se decide reportarlo.

## W7 🟠 · Pedidos de vendedores dados de baja desaparecen del listado
**124 pedidos** en difranca · **los pedidos existen y se abren por `# Ref`**

**Paso a paso:** abrí el combo de Vendedor: lista los `id_user` 274→291 **salteándose el 283**
(**Dayana Acuña**, de baja, **93 pedidos por 100.420,72**). Ningún filtro de la pantalla los alcanza.
Aritmética verificada 3 veces: `15.519 − 78 = 15.441`.

⚠ La vista encadena **4 tablas** (`users_data`/`users`/`users_enterprise`/`role_user`) y basta `'D'` en **una**:
quitarle el rol o desasignarlo de la empresa produce el mismo borrado.
**Afecta a 3 de 4 tenants** — el palmar es el único sano, y es el único que nunca dio de baja a nadie.
✅ **Exclusivo de la web:** el móvil **no lista vendedores en absoluto** (0 selects, 0 buscadores, sin padrón
`users` local) ⇒ si se arregla la vista, el móvil no requiere cambio.
Detalle en `automation/reports/PENDIENTE-pedidos-ocultos-salesman-view.md`.

## W8 🟠 · El filtro `Status` de pedidos devuelve 3 de 15.441
**Paso a paso:** listá pedidos sin filtro → **15.441**, con las 50 filas visibles rotuladas "Enviado".
Aplicá `Status = Enviado` → **3** (refs 39794/39795/39796). Probá otro status de control: da un número distinto
⇒ el filtro **sí discrimina**, no es que se ignore.
Causa: el filtro consulta `transaction_statuses`, que cubre el **8,4 %** (1.385 filas para 16.560 pedidos).
⚠ En La Tortuga cubría **100 %** y por eso allá no reproducía ⇒ **es maduración de datos sobre el mismo código,
no la versión.**

## W9 🟠 · El estatus de las devoluciones no se puede saber por la web
La columna sale vacía en **49 de 50**, y **el detalle no tiene campo Estatus en absoluto** (probado con la 878,
la única poblada en la lista). Misma causa que W8: `transaction_statuses` con **2 filas para 795 devoluciones**.
✅ **En main los registros nuevos ya salen bien** — la devolución **879** generó su fila con `id_status=8`
⇒ se corrige solo hacia adelante; el histórico queda mudo.
⚠ En el **móvil** también sale vacío en los históricos (867/865/857), pero los nuevos salen bien.

## W10 🟠 · El visor de adjuntos nunca muestra los PDF
Donde la BD dice 3 archivos, el visor enseña **2**, y nada indica que el PDF exista.
**Paso a paso:** abrí `Ver adjuntos` en un cobro con 3 archivos y contá. Reproduce en **cobros, pedidos y
visitas** — o sea en los módulos que "funcionan".

## W11 🟠 · Contaminación cruzada de tenants en la BD
`client_stock` **14 de 16** filas y `potential_client` **30 de 61** traen `co_enterprise` de **otros clientes**
(`LMP01`, `ALIP_BSD`), con usuarios inexistentes en `users`. Su `id_enterprise` **sí resuelve**, así que la web
las mostraría bajo una empresa ajena. **Una fila entró el 04/08.**
⚠ Hoy no se ve **solo porque `salesman_view` la tapa** — W7 y W11 se están cubriendo mutuamente. Si se arregla
W7 sin arreglar esto, la contaminación queda a la vista.

## W12 🟡 · Cosméticos

| | Qué | Cómo verlo |
|---|---|---|
| W12a | `Descuento Global:`, `IVA :` y `Descuento :` van **en blanco** cuando valen 0, mientras `Descuento bonif.:` sí muestra `0,00`. Un 0 y un "no calculado" se ven igual | Abrí el detalle de un pedido. **También pasa en pedidos creados desde el móvil** (39794) ⇒ no es del alta web |
| W12b | Precio crudo sin formato en el carrito del alta: `2625.7140000000004` | Es el **único** importe visible mientras se arma el pedido. El detalle sí formatea bien |
| W12c | Modal espurio con `Si, Borrar` que **borra lo tecleado** | Escribí en `Responsable` durante el alta. **No determinista** (1 de 2). Confinado al alta: 0 de 13 aperturas de detalle |
| W12d | El alta **no muestra ningún total** mientras se arma el pedido | Cero elementos con "total/subtotal/monto" en toda la pantalla |
| W12e | 6 botones icónicos de plantilla **sin rótulo ni acción**, y **ningún** Volver / Imprimir / Exportar | En los 5 detalles |
| W12f | La firma **no viaja en el ZIP** (sí se ve en pantalla) y `nu_attachments` la excluye | Descargá el ZIP de un cobro con firma |
| W12g | La columna `N°` vale **`1`** en las 4 líneas del detalle de inventario | Abrí el detalle del inventario 16 |

---
---

# ✅ Verificado y SANO — no re-testear

- **Aritmética de pedidos y cobros:** exacta contra BD en los 3 pedidos y los 7 cobros de hoy, incluida la
  conversión con la tasa correcta y el IGTF como 3 % sobre el total a pagar.
- **El cuelgue con más de 50 productos NO existe.** 2.ª vez que no reproduce, ahora sobre main: 55 líneas,
  curva plana (2.044-2.284 ms), y **las 5 líneas posteriores a la 50 fueron las más rápidas**. `Guardar` tardó
  **6.351 ms con 2 líneas y 720 ms con 55** ⇒ su costo **no escala** con el tamaño.
- **Descuento global automático: FALSO POSITIVO, retractado.** difranca tiene `global_discount` **vacía**,
  0/4.558 clientes con descuento en ficha, y el pedido web salió en `0.0000` igual que los 5 pedidos móviles
  del mismo cliente. La hipótesis de QA era correcta.
- **La tasa corrupta no contamina la consulta**, solo el alta: 64 filas históricas pintan cada una su tasa.
- **El IGTF no rompe el móvil** · **la web no invierte la conversión `USD`** (50/50 filas correctas) ·
  **inventarios funciona** (el "0 de 2" era otra cara de W7) · **el adjunto SÍ sube desde el móvil**, con el
  mismo patrón de nombre y carpeta que cobros.
- **Los adjuntos posteriores al 07/08 descargan y abren bien** en los 4 módulos (verificados por magic bytes).
- **El pedido de 55 líneas se renderiza entero en la web**, numerado 1-55 y sin paginar.
- **Visitas:** `VIS-FECHA-MAS-4H` **no reproduce** · la coordenada viaja pese a `userCanSaveGPS=false`
  (3.ª confirmación) · el estatus lo resuelve el componente por constante, **no** por JOIN ⇒ visitas nunca
  dependió del problema de W9.
- **La empresa borrada `DDH_A12` no aparece** en ningún selector, ni web ni móvil.

# Correcciones al perfil (aplicar al consolidar)

`clientStock` → **true** · `inventarios.aplica` → **true** · `validateWarehouses` → **true** ·
sync de **devoluciones y visitas: inmediata** (no diferida 5-12 min) · el envío trae **3 alertas**, no 2 ·
el recorte del BUSCAR de cobros es la ventana de **`historyMonths`**, no "los 100 más recientes" ·
tope del comentario **255** en main (era 120 en el tag 20).

**Oráculo que le faltaba a `VIS-SIN-FECHA-INICIADA`:** el móvil envía `daInitial:""` y la nube guarda `NULL`
cuando la visita se crea desde NUEVA VISITA ⇒ **no es pérdida en el envío**, ese flujo no genera fecha de inicio.
