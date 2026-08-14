# Defectos WEB de difranca — descripción y paso a paso para reproducir a mano

Estado al **2026-08-11**, tras el build con fixes. Playa **EL YAQUE** ·
`http://denarioelyaque.ddns.net:8080/DenarioPremium`
Empresas: **DDHP_A12** (principal) · **DIF_A12** (DIFRANCA C.A) · **DHVITAL01_A**

**Criterio acordado con QA:** si no se reproduce a mano, **no se reporta y se descarta.**

---

## ⚠ ANTES DE EMPEZAR — tres trampas que hacen fallar la prueba por motivos equivocados

1. 🔴 **Los filtros de la web se quedan pegados en la sesión** (`# Ref`, `Status`, `Moneda`, `Cliente`,
   fechas) y **sobreviven a cambiar de pantalla**. `Limpiar` **no** resetea los desplegables.
   ⇒ Antes de cada prueba, **verificá con qué filtros estás parado**. Esto ya nos hizo reportar un defecto
   falso que hubo que retractar.
2. 🔴 **Al cambiar de Empresa se repueblan las fechas solas.** ⇒ Elegí primero la empresa, **después** las fechas.
3. 🔴 **Render rezagado:** una lista puede aparecer vacía y llenarse al recargar. ⇒ Antes de decir "está vacío",
   **recargá y miralo dos veces**. Nos pasó hoy.

---

# W1 · La primera página de cobros aparece vacía

**Qué pasa.** Un **documento IGTF suelto** en el listado rompe el render de **la página donde cae esa fila**.
No muere la lista entera: las demás páginas se ven perfectas. Como el orden por defecto es del más reciente al
más viejo, y los IGTF son lo más nuevo, la página rota es justo la primera que ves al entrar.
**El contador del servidor siempre está bien** — dice 1.655 mientras la tabla muestra 0.

**Pasos**
1. Cobros, empresa **DDHP_A12**. **Limpiá los filtros.**
2. Rango de fechas **01/06/2026 – 11/08/2026**.
3. Mirá la página 1: **vacía**, pero el contador dice ~1.655. *(Recargá y miralo dos veces.)*
4. Andá a la **página 2**: se ven 50 filas. Página 3: otras 50. La última: 5.
5. **La prueba que lo confirma:** hacé clic en la cabecera **`# Ref`** para invertir el orden.
   La **página 1 pasa a verse bien** y ahora se rompen las **últimas** páginas — las que quedaron con los IGTF.

**Se reprodujo si:** la página 1 está vacía con contador > 0, y al invertir el orden la página vacía **se mueve**.
**Documentos IGTF que lo disparan:** `21831`, `21835`, `21846` (DDHP_A12) · `21836`, `21843` (DIF_A12).

---

# W2 · Un pedido guardado en la web no se puede enviar

**Qué pasa.** Guardás un pedido, lo reabrís con `Editar` y el carrito viene vacío, así que no hay forma de
enviarlo. **La mitad ya está arreglada:** las líneas ahora **sí se guardan** en la base (antes se perdían).
Lo que falta es que la pantalla las vuelva a leer.

**Pasos**
1. Pedidos → **Nuevo Pedido**, empresa **DDHP_A12**, cualquier cliente.
2. Agregá **2 productos**.
3. **Guardar.**
4. Salí del pedido y volvé al listado de guardados.
5. Abrilo con **`Editar`**.

**Se reprodujo si:** la cabecera vuelve completa (cliente, condición de pago, etc.) pero el carrito dice
**"No existe registro"**, y al intentar `Enviar` sale **"No hay productos en el pedido"** o
**"Por favor seleccione un producto antes de continuar"**.

---

# W3 · El botón de descargar adjuntos no hace nada y no avisa

**Qué pasa.** Dos problemas encimados. El primero es de servidor: **todos los archivos adjuntos anteriores al
07/08/2026 faltan del disco** — unos 38.900 de 38.990, en los cinco módulos. La base los tiene registrados y la
web los ofrece, pero no están.
**El segundo sí es de la aplicación, y es el reportable:** el botón está habilitado, no descarga nada y
**no muestra ningún mensaje de error**. El usuario queda pensando que su computadora falló.

**Pasos**
1. Cobros. Buscá un cobro **anterior al 07/08/2026** que indique tener adjunto (por ejemplo el **21823**).
   *(El filtro `Tiene Adjunto` sirve para encontrarlos.)*
2. Abrilo y pulsá **`Descargar adjuntos`**. Esperá ~20 segundos.
3. Ahora repetí con un cobro **de esta semana**: el **21838** o el **21844**.

**Se reprodujo si:** el viejo no descarga nada **y no aparece ningún mensaje**, mientras el nuevo descarga bien.
**Lo reportable es el silencio**, no que falten los archivos — eso último es de despliegue y necesita otro dueño.

---

# W4 · El sistema acepta un pago cientos de veces mayor que el cobro

**Qué pasa.** El vendedor cobra en dólares, recibe una **transferencia** —que en la práctica es en bolívares— y
copia el monto del comprobante bancario al campo de pago. **El sistema lo acepta sin ninguna advertencia**,
aunque sea 620 veces el total del cobro. El pago no lleva moneda propia y no hay validación de que el monto
tenga sentido.
**Escala real: 638 casos desde 2024**, y son **el 80 % de las transferencias** contra cobros en dólares
(en efectivo y depósito casi no pasa).
⚠ **No es regresión** — viene de 2024, no lo introdujo la 21.

**Pasos (para verlo, no para provocarlo)**
1. Cobros, empresa **DIF_A12**, `# Ref` **21786**.
2. Mirá el total del cobro: **968,60 US$**.
3. Mirá el renglón del pago: **601.161,08**.
4. Dividí ese monto por la tasa del cobro (737,88): da **814,71**, un pago parcial perfectamente razonable
   ⇒ el vendedor tecleó bolívares en un campo que se lee como dólares.

**Se reprodujo si:** ves un pago de cientos de miles contra un cobro de tres cifras, sin ninguna alerta.
⚠ **No intentes provocarlo con un cobro nuevo:** si el cobro se crea en dólares, la app calcula todo en dólares
y no te deja cargar un pago en bolívares. Lo que hay que reportar es **la falta de validación**.

---

# W5 · La web factura con una tasa de hace un mes

**Qué pasa.** Hay **3 filas de tasa cargadas con fecha del año 2056** (una por empresa) con valor **721,35**.
La web toma siempre la tasa de fecha más reciente, así que **elige la del 2056 y seguirá eligiéndola 30 años**.
La tasa real de hoy es **752,09** ⇒ cada pedido creado por la web sale **4,09 % más barato**.
La fila se delata sola: su código es `US$13720262626`, o sea **13/07/2026** — alguien tecleó 2056 en vez de 2026.

**Pasos**
1. Creá un pedido cualquiera en la web y **mirá la tasa** que toma.
2. Compará con la tasa que muestra un pedido creado **desde el móvil** hoy.

**Se reprodujo si:** el pedido web sale con **721,35** y el móvil con **752,09**.
✅ **RESUELTO EN LA 21 con una guarda en código:** el sistema ignora las tasas con fecha futura.

🕐 **Las 3 filas corruptas SIGUEN en la base** (`id_conversion_type` **3443**, **3445**, **3447**).
**Decisión de QA (2026-08-11): NO se limpian desde acá — queda para que lo revise el propio cliente.**
⚠ Para que no se vuelva a levantar: la guarda las neutraliza **en la web**, pero el dato sigue cargado, así que
cualquier otro consumidor que lea `conversion_type` sin pasar por esa guarda (un reporte, el ERP, una
integración) seguiría tomando **721,35**. No es un pendiente nuestro; es contexto para cuando el cliente lo mire.

---

# W7 · Los pedidos de un vendedor dado de baja desaparecen del listado

> ❌ **DESCARTADO — decisión de QA, 2026-08-11. No se reporta.**
> Afecta a **una sola persona**: Dayana Acuña (`VEND714`, `id_user` 283), dada de baja el **04/08/2026**, con
> **93 pedidos y 157 cobros** entre **ago-2024 y ene-2025**. Es la única de baja entre los 34 usuarios del
> tenant, y sus registros tienen más de un año y medio. **Impacto práctico hoy: nulo.**
> Los otros dos usuarios fuera de la vista son **`admin` y `superadmin`**, cuentas de sistema con **cero
> transacciones**: que no aparezcan en un desplegable de *vendedores* es correcto.
> ⚠ **Lo único a recordar si algún día se toca:** la vista está **tapando 13 inventarios de otros clientes**
> (`LMP01`, `ALIP_BSD`, de usuarios que ni existen en `users`). **Si se arregla la visibilidad sin limpiar
> antes esos datos, quedan a la vista dentro de difranca.** Primero limpiar, después arreglar.


**Qué pasa.** El listado de pedidos se arma cruzando contra una vista que **excluye a los usuarios dados de
baja**. Resultado: **124 pedidos de difranca no aparecen en ninguna búsqueda**, aunque existen y se abren
perfectamente si los buscás por `# Ref`.
⚠ Alcanza con quitarle el rol a alguien o desasignarlo de la empresa — no hace falta darlo de baja formalmente.

**Pasos**
1. Pedidos → abrí el desplegable de **Vendedor**.
2. Recorré la lista de vendedores.

**Se reprodujo si:** **falta Dayana Acuña** (usuario 283), que tiene **93 pedidos por 100.420,72**.
El combo salta del 282 al 284. Ningún filtro de la pantalla alcanza esos pedidos.

---

# W9 · No hay forma de saber el estatus de una devolución

> ❌ **DESCARTADO PARCIALMENTE — decisión de QA, 2026-08-11.**
> **El detalle nunca mostró Estatus**: es cómo está hecho el producto, no un defecto. Confirmado por QA.
> ✅ La **columna del listado** sí se arregló hacia adelante (la devolución 879, creada nueva, muestra
> `Enviado`). El histórico anterior queda mudo salvo backfill de `transaction_statuses`, que es decisión de
> datos, no de la versión.


**Qué pasa.** En el listado la columna **Estatus** sale vacía en casi todas, y al abrir el detalle **no existe
el campo Estatus en ninguna parte**. O sea que por la web nadie puede saber en qué estado está una devolución.
**Parcialmente arreglado:** las devoluciones **creadas desde el 10/08 sí muestran estatus en la lista**; las
anteriores quedan mudas. **El detalle sigue sin el campo, incluso en las nuevas.**

**Pasos**
1. Devoluciones. Mirá la columna **Estatus** en el listado.
2. Abrí la **879** (nueva): en la lista debería decir **Enviado**.
3. Abrí la **873** (vieja): en la lista sale **vacía**.
4. En las dos, **buscá el campo Estatus dentro del detalle**.

**Se reprodujo si:** el detalle no tiene campo Estatus **en ninguna de las dos**.

---

# W10 · El visor de adjuntos nunca muestra los PDF

> ❌ **DESCARTADO — decisión de QA, 2026-08-11. No se reporta.**
> **Es una característica de Denario**: el visor nunca mostró más que imágenes. Los PDF **sí viajan en el ZIP**
> descargable, así que el archivo no se pierde — solo no se previsualiza.


**Qué pasa.** `Ver adjuntos` muestra **solo imágenes**. Si el registro tiene un PDF, no aparece y **nada indica
que exista**. El archivo sí está: si descargás el ZIP, el PDF viene adentro.

**Pasos**
1. Abrí el cobro **21844** (de esta semana), que tiene **3 adjuntos**.
2. Pulsá **`Ver adjuntos`** y **contá** cuántos muestra.
3. Ahora descargá el ZIP y contá los archivos que trae.

**Se reprodujo si:** el visor muestra **2** y el ZIP trae **3**, incluido un `.pdf`.
También pasa en pedidos y visitas.

---

# W12 · Cosméticos (los tres que siguen)

| | Qué pasa | Pasos |
|---|---|---|
| **W12a** | En el detalle de un pedido, `Descuento Global:`, `IVA :` y `Descuento :` aparecen **en blanco** cuando valen 0, mientras `Descuento bonif.:` sí muestra `0,00`. **Un cero y un "no se calculó" se ven igual**, justo en los campos que hay que auditar | Abrí el detalle de cualquier pedido sin descuento y mirá esos cuatro campos |
| **W12b** | En el carrito del alta, el precio sale **crudo**: `42069.132000000005`, sin formato ni moneda. Y es **el único importe visible** mientras armás el pedido | Empezá un pedido nuevo y agregá un producto |
| **W12d** | La pantalla de alta **no muestra ningún total** mientras armás el pedido | Agregá varias líneas y buscá un subtotal o total en pantalla |

---

# ⚠ Los que probablemente NO vas a poder reproducir a mano

**W11 · Contaminación cruzada de tenants.** En la base de difranca hay filas que pertenecen a **otros clientes**
(`client_stock` 14 de 17, `potential_client` 28 de 62, con códigos de empresa `LMP01` y `ALIP_BSD`).
**No se ven en la web**, y justamente por una razón incómoda: **las tapa el mismo defecto W7**. Si algún día se
arregla W7 sin limpiar esto, esas filas **quedan a la vista bajo una empresa ajena**.
⇒ Es una advertencia para el equipo de datos, **no un defecto reproducible desde la pantalla**. Si el criterio es
"si no lo reproduzco no lo reporto", este no califica — pero conviene avisarlo igual antes de tocar W7.

**W12c · El modal fantasma "Si, Borrar".** Al escribir en el campo `Responsable` durante el alta, a veces
aparece un modal con la opción `Si, Borrar` que **borra lo que estabas tecleando**. Es **no determinista**:
apareció 1 de cada 2 veces, y en 13 aperturas de detalle no apareció nunca.
⇒ Para confirmarlo harían falta **4 o 5 altas seguidas** escribiendo en `Responsable` y contar cuántas lo
disparan. Si no aparece en ese puñado de intentos, **descartalo**.
