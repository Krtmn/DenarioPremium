# Capa WEB — difranca / EL YAQUE **sobre `main`**

**RUN_ID:** `smoke_difranca_20260810_main` · **Fecha:** 2026-08-10 · **Modo:** 🔒 **READ-ONLY**
**Playa:** EL YAQUE — `http://denarioelyaque.ddns.net:8080/DenarioPremium`
**Empresas del tenant (guarda por TEXTO, verificada):** `*DISTRIBUIDORA DIAZ HERNANDEZ *` (`DDHP_A12`, v=2) ·
`DIFRANCA C.A` (`DIF_A12`, v=3) · `DISTRIBUIDORA DH VITAL, C.A.` (`DHVITAL01_A`, v=4)
**Credenciales:** `***` / `***` (bloque `# USUARIO WEB`, tipeadas con `browser_type`) · login **OK**

---

## 🔴 LO PRIMERO: la huella de build confirma que el experimento es válido

El veredicto de los 2 hallazgos sólo vale si El Yaque **efectivamente** cambió de versión. Medido por HTTP `HEAD`
sobre `javax.faces.resource/common.css.xhtml?ln=css`:

| Playa | `Last-Modified` | Corresponde a |
|---|---|---|
| **EL YAQUE** | **Thu, 06 Aug 2026 19:27:02 GMT** | **main** ← el 07/08 era `16/07/2026 17:25:16` (tag 20) |
| La Tortuga | Thu, 06 Aug 2026 19:27:02 GMT | main |
| Isla Coche | Thu, 06 Aug 2026 19:27:02 GMT | main |

⇒ **Las 3 playas sirven exactamente el mismo build.** difranca está en `main`. El contraste contra La Tortuga
es legítimo: mismo código, datos distintos.

---

# Veredicto de los 2 en observación

## 1 · `COB-LISTA-RENDER-VACIO` (IGTF) → 🔴 **SÍ REPRODUCE EN MAIN — SIGUE BLOQUEANTE**

**Respuesta sin ambigüedad: el listado queda VACÍO con el contador > 0. Se pintan CERO filas.**

### La vista por defecto del operador, en la empresa principal

| Búsqueda | Contados | **Pintados** |
|---|---:|---:|
| `DDHP_A12`, **sin ningún filtro** | **18.091** | **0** ❌ |
| `DDHP_A12` + rango por defecto `01/08–10/08` | 71 | **0** ❌ |
| **`DIFRANCA C.A`, sin ningún filtro** | **1.168** | **0** ❌ |

Evidencia: `COB-LISTA-RENDER-VACIO-main-18091-contados-0-pintados.png` (esta carpeta).

### Aislamiento por `# Ref` — 4 IGTF contra 3 controles sanos

Panel limpio y `value` de **todos** los selects verificado antes de cada `Buscar`; fechas vaciadas **después**
del último cambio de `<select>`.

| `# Ref` | Empresa (por TEXTO) | `co_type` | Moneda | Contados | **Pintados** | |
|---|---|---|---|---:|---:|---|
| 21832 | `*DISTRIBUIDORA DIAZ HERNANDEZ *` | 0 Cobros | US$ | 1 | **1** | ✅ control |
| 21828 | `*DISTRIBUIDORA DIAZ HERNANDEZ *` | 0 Cobros | **BSD** | 1 | **1** | ✅ control — **no es la moneda** |
| 21834 | `DIFRANCA C.A` | 0 Cobros | USD | 1 | **1** | ✅ control |
| **21831** | `*DISTRIBUIDORA DIAZ HERNANDEZ *` | **3 IGTF** | BSD | 1 | **0** | ❌ |
| **21835** | `*DISTRIBUIDORA DIAZ HERNANDEZ *` | **3 IGTF** | BSD | 1 | **0** | ❌ *(el que dejó la QA)* |
| **21836** | `DIFRANCA C.A` | **3 IGTF** | USD | 1 | **0** | ❌ *(el que dejó la QA)* |
| **21843** | `DIFRANCA C.A` | **3 IGTF** | BSD | 1 | **0** | ❌ **NUEVO, creado hoy 10/08 16:03** |

**4 IGTF probados · 4 rotos · 3 controles sanos.** El `21843` es especialmente valioso: **es un cobro IGTF
nacido HOY, ya sobre `main`** (lo creó la corrida móvil en paralelo). No es dato viejo arrastrado.

### La prueba decisiva — el filtro `Tipo Cobro` (empresa `DDHP_A12`)

| `Tipo Cobro` | `co_type` | Contados | **Pintados** | |
|---|---:|---:|---:|---|
| Cobros | 0 | 17.873 | **50** | ✅ |
| Anticipo/Prepago | 1 | 214 | **50** | ✅ |
| Retención | 2 | 2 | **2** | ✅ |
| **IGTF** | **3** | **2** | **0** | ❌ |

**El corte es exactamente por tipo**, idéntico a lo medido bajo tag 20. `Retención` —que también es un tipo
derivado con cobro original— pinta perfecto, así que tampoco es "los tipos derivados".

### Cruce con BD

```
SELECT co_type, count(*) FROM collection WHERE co_operation<>'D' GROUP BY 1
→  co_type 0: 19.515   ·   1: 258   ·   2: 5   ·   3 (IGTF): 4
```
Los **4** `co_type=3` del tenant son 21831, 21835 (empresa 2) y 21836, 21843 (empresa 3). **Los 4 probados,
los 4 rotos.**

### Qué pasó con el contraejemplo de el_palmar

La observación se abrió porque el_palmar (Isla Coche) tiene 10 cobros IGTF y su lista funciona, lo que apuntaba
a la versión desplegada. **Ese razonamiento queda descartado:** El Yaque ahora corre el **mismo build** que
Isla Coche (misma huella `06/08/2026 19:27:02`) **y sigue rompiendo**. ⇒ **no era la versión.** La diferencia
está en los datos o en la configuración del tenant, y el defecto **viaja con el código a la 21**.

> 🔴 **Es hallazgo bloqueante para el tag.** Dos de las tres empresas de difranca tienen hoy la pantalla de
> Cobros en blanco (18.091 y 1.168 registros contados, cero mostrados) y **cada cobro IGTF nuevo suma otra
> empresa caída**. No hay workaround: borrar el dato no evita el próximo IGTF, y `userCanSelectIGTF=true`.

---

## 2 · `PED-STATUS-CONTRADICE-COLUMNA` → 🟠 **SÍ REPRODUCE EN MAIN**

**Respuesta sin ambigüedad: SÍ. El filtro `Status = Enviado` devuelve 3 sobre 15.441 filas que la propia
grilla rotula "Enviado".**

Medido con **llamadas separadas** (una por acción, una por lectura), label **y** `value` del `<select>` espejo
verificados antes de cada `Buscar`, panel entero en placeholder y fechas vacías.

| Filtro `Status` | `value` | Contados | Pintados | Columna «Estatus» de las filas |
|---|---:|---:|---:|---|
| *(placeholder — sin filtro)* | 0 | **15.441** | 50 | **50 de 50 dicen "Enviado"** |
| **Enviado** | **6** | **3** | 3 | refs **39794 · 39795 · 39796** |
| Por aprobar | 26 | 0 | 0 | — |
| Guardado | −1 | 0 | 0 | *(la tabla conmuta a `form:pedidosSavedDT`)* |

**El filtro NO está siendo ignorado** — devuelve 3, no 15.441 ni 0, y `Guardado` conmuta de tabla. Discrimina;
lo que pasa es que **consulta la tabla equivocada**.

### La pregunta que había que responder: ¿`transaction_statuses` cubre los pedidos 1:1?

### 🔴 **NO. Cubre el 8,4 %.**

```
SELECT st_order, count(*) FROM "order" WHERE co_operation<>'D' GROUP BY 1
→  st_order 6: 16.553   ·   1: 4   ·   5: 3        (total 16.560)

SELECT count(*) FROM transaction_statuses                    →  2.231
SELECT co_transaction_type, count(*) FROM transaction_statuses GROUP BY 1
→  ped 1.385 · cob 842 · dev 2 · inv 2

SELECT id_status, count(*) FROM transaction_statuses WHERE co_transaction_type='ped' GROUP BY 1
→  id_status 1: 1.382   ·   id_status 6: 3      ← ¡SOLO TRES con el "Enviado" (6)!
```

| | difranca / main | La Tortuga (alipascua) / main |
|---|---|---|
| Pedidos vigentes | **16.560** | 4.039 |
| Filas `ped` en `transaction_statuses` | **1.385** | **4.039** |
| **Cobertura** | **8,4 %** | **100 % (1:1)** |
| Filas con el `id_status` de "Enviado" | **3** | 4.039 |
| Resultado del filtro `Enviado` | **3** | 1.725 de 1.725 ✅ |

**La BD predice el número exacto Y las refs exactas:** los 3 `id_transaction` con `id_status=6` son
**39794, 39795, 39796** — exactamente las 3 filas que devolvió la web.

⇒ **Confirmado el mecanismo propuesto:** el filtro `Status` consulta `transaction_statuses` (historial, apenas
poblado) mientras la columna «Estatus» se pinta desde `order.st_order`. En La Tortuga no reprodujo **porque
allí esa tabla está completa**, no porque el código sea distinto. **Es maduración de datos sobre el mismo
código** — y el código de la 21 lo lleva igual.

**Impacto:** el filtro `Status` de pedidos es **inservible e induce a error**: el operador ve "Enviado" en
pantalla y filtrando "Enviado" no encuentra nada. Bajo tag 20 devolvía 1; hoy devuelve 3. **No es un fix: es
que hay 2 filas más de historial.**

---

# F## Filtros

Todas las mediciones con la **Empresa fijada por TEXTO** antes de cada `Buscar`, el `value` de todos los
`<select>` leído y registrado, y las fechas vaciadas **después** del último cambio de select.

| Caso | Módulo | Filtro | Medición | BD | Marca |
|---|---|---|---|---|---|
| `DW-PED-F01` | pedidos | `# Ref` existente (39794) | 1 contado / **1 pintado**, ref correcta | 1 | **WEB-OK** |
| `DW-PED-F02` | pedidos | `# Ref` inexistente (99999999) | 0 + *"No se encontraron registros."* | 0 | **WEB-OK** |
| `DW-PED-F03` | pedidos | **Moneda `BSD`** | **272** | 275 − **3 ocultos** = **272** | **WEB-OK** |
| `DW-PED-F04` | pedidos | **Vendedor `Jose Raad`** (v=275) | **2.051** | **2.051** | **WEB-OK** exacto |
| `DW-PED-F05` | pedidos | **Status** | 15.441 rotulados "Enviado" vs **3** | 16.553 con `st_order=6` | 🟠 **WEB-FIELD-MISMATCH** |
| `DW-PED-F06` | pedidos | **Tipo Pedido** | `<select>` con **1 sola opción** (el placeholder) | — | **WEB-MISSING** |
| `DW-PED-F07` | pedidos | Empresa | fija `DDHP_A12` por TEXTO, 15.441 | 15.519 − 78 | **WEB-OK** |
| `DW-COB-F01` | cobros | `# Ref` × 7 refs | conteo correcto **7/7**; 3 pintan, **4 IGTF no** | — | 🔴 **WEB-MISSING** (ver H1) |
| `DW-COB-F02` | cobros | **Tipo Cobro** | discrimina bien; **IGTF 2/0** | 4 IGTF | 🔴 **WEB-MISSING** |
| `DW-COB-F03` | cobros | Empresa | **tapa el `# Ref`**: 21834 (emp 3) con emp 2 → **0** | — | **WEB-OK** *(esperado)* |
| `DW-COB-F04` | cobros | rango de fechas | `01/08–10/08` → 71 contados | — | **WEB-OK** *(el conteo)* |
| `DW-DEV-F01` | devoluciones | sin filtro, `DDHP_A12` | **685 pintando 50** | **685** | **WEB-OK** exacto |
| `DW-DEV-F02` | devoluciones | `# Ref` 878 | 1 / **1** | 1 | **WEB-OK** |
| `DW-DEV-F03` | devoluciones | `# Ref` 877 (otra empresa) | 0 + mensaje vacío | *(es de `DHVITAL01_A`)* | **WEB-OK** *(esperado)* |
| `DW-DEV-F04` | devoluciones | columna «Estatus» | **49 de 50 VACÍAS** | `transaction_statuses` dev = **2** | 🟠 **WEB-FIELD-MISMATCH** (H6) |
| `DW-VIS-F01` | visitas | sin filtro, `DDHP_A12` | **25.450** | **25.492** (Δ **42**) | ⚠ **residuo, sin explicar** |
| `DW-INV-F01` | inventarios | sin filtro, `DDHP_A12` | **0 contados** | **2** filas con `id_enterprise=2` | 🔴 **WEB-MISSING** (H5) |
| `DW-INV-F02` | inventarios | `# Ref` 14 | **0** — *ni por Ref aparece* | existe | 🔴 **WEB-MISSING** |
| `DW-GUARDA-01` | todos | **empresa borrada `DDH_A12`** | **NO aparece** en ningún selector | `co_operation='D'` | ✅ **WEB-OK — no es defecto** |

**Nota sobre `DW-VIS-F01`:** el hueco de 42 **no** es `salesman_view` (por ahí serían 363) ni un desajuste de
`id_enterprise` (BD da 25.492 tanto por `co_enterprise` como por `id_enterprise=2`). Queda como **residuo
menor a investigar aparte**, no como hallazgo.

---

# Hallazgos

## 🔴 H1 — `COB-LISTA-RENDER-VACIO` reproduce en `main` · **BLOQUEANTE PARA EL TAG**

Ver §Veredicto 1. **4/4 cobros IGTF dejan el `<tbody>` vacío**, incluido uno creado hoy sobre este build.
Dos de las tres empresas del tenant tienen la pantalla de Cobros en blanco. El contraejemplo de el_palmar
**ya no sostiene la hipótesis de versión**: mismo build, comportamiento opuesto.

## 🟠 H2 — `PED-STATUS-CONTRADICE-COLUMNA` reproduce en `main`

Ver §Veredicto 2. Causa confirmada en BD: `transaction_statuses` cubre el **8,4 %** de los pedidos y sólo
**3 filas** llevan el `id_status` de "Enviado". **No es la versión: es el estado de la tabla de historial.**

## 🔴 H3 — Los pedidos de un vendedor de baja son invisibles (`salesman_view`) · **CONFIRMADO CONTRA LA UI**

El defecto medido en La Tortuga **aplica en difranca**, y la aritmética cerró **exacta tres veces**:

| Comprobación | Web | BD | Ocultos | ¿Cierra? |
|---|---:|---:|---:|---|
| pedidos `DDHP_A12`, sin filtro | **15.441** | 15.519 | **78** | ✅ 15.519 − 78 = **15.441** |
| pedidos `DDHP_A12`, **Moneda BSD** | **272** | 275 | **3** | ✅ 275 − 3 = **272** |
| combo **Vendedor** de pedidos | 17 vendedores, `id_user` 274→291 | 18 usuarios | — | ✅ **falta exactamente el 283** |

**Prueba directa en la UI:** el `<select>` de Vendedor lista los `id_user` 274, 275, …, 282, **284**, 285…291.
**El 283 no está.** Es `Dayana Acuña` (`VEND714`, `users.co_operation='D'`), con **93 pedidos** por
**100.420,72**. ⇒ **no hay ningún filtro de la pantalla que pueda alcanzar sus pedidos.**

⚠ **Matiz que corrige el análisis previo:** en difranca el join por `co_user` da **el mismo número** (93 = 93)
porque **este tenant no tiene códigos reciclados**. ⇒ difranca **no sirve** para demostrar el punto
`id_user` vs `co_user`; esa prueba sigue siendo la de alipascua (385 vs 233). Usar `co_user` seguiría siendo
incorrecto aunque hoy no se note.

⚠ **Modo de falla adicional descubierto:** `salesman_view` tiene `id_enterprise` — es una vista
**por usuario-empresa**, no por usuario. Acotando el `NOT EXISTS` también por empresa, difranca pasa de **93**
a **124** ocultos.

## 🔴 H4 — **NUEVO · Contaminación cruzada de datos de OTROS tenants en la BD de difranca**

`client_stock` y `potential_client` contienen filas cuyo `co_enterprise` **no existe** en la tabla `enterprise`
de difranca (que sólo tiene `DDH_A12`, `DDHP_A12`, `DIF_A12`, `DHVITAL01_A`):

| Tabla | Filas contaminadas | Códigos ajenos |
|---|---|---|
| `client_stock` | **14 de 16 (87 %)** | `LMP01` (13 filas) · `ALIP_BSD` (1) |
| `potential_client` | **30 de 61 (49 %)** | `LMP01` (28) · `NULL` (2) · `'0.0'` (2) |

**Lo grave es que el `id_enterprise` de esas filas SÍ resuelve contra el catálogo local**, y los `view_reporte_*`
unen por `id_enterprise` ⇒ **la web las muestra bajo una empresa que no les corresponde**:

| Fila | `co_enterprise` real | `id_enterprise` | Empresa bajo la que la mostraría la web |
|---|---|---:|---|
| `client_stock` 15 | **`ALIP_BSD`** (¡La Tortuga!) | 2 | ***DISTRIBUIDORA DIAZ HERNANDEZ *** |
| `client_stock` 1–13 | `LMP01` | 1 | `(vieja)DISTRIBUIDORA DH VITAL` |

Ninguno de los usuarios de esas filas (468, 215, 213, 212, 211, 206, 238) **existe en la tabla `users` de
difranca**. Son huérfanos de otro tenant.

🔴 **No es sólo data histórica:** la fila `ALIP_BSD` es del **2026-08-04/05**, con `co_user 002` — el perfil
exacto de la corrida QA de **DM Electronica / El Yaque usuario 002**. **Hay contaminación entrando esta semana.**

> Hoy no se ve en pantalla **sólo porque H3 la tapa** (esos `id_user` no están en `salesman_view`). Si se
> arregla H3 sin arreglar esto, **aparecen datos de otro cliente dentro de difranca**.

## 🔴 H5 — Inventarios de `DDHP_A12` muestra **0 de 2**, y ni el `# Ref` los recupera

La empresa principal tiene **1 inventario legítimo** (`id_client_stock` 14) y la web muestra **0 contados**.
Buscando por `# Ref = 14` → **0 + "No se encontraron registros."**

Causa: los dos registros con `id_enterprise=2` tienen `id_user` **238** y **468**, y **ninguno está en
`salesman_view`**. Es H3, pero en su forma extrema: **el módulo entero queda vacío**, y a diferencia de
pedidos —donde el registro oculto **sí se abre por `# Ref`**— **acá el `# Ref` tampoco lo rescata.**

## 🟠 H6 — Devoluciones: la columna «Estatus» viene VACÍA en 49 de 50 filas · **cierra el pendiente C2**

En La Tortuga este hallazgo quedó *"no reproduce, muestra insuficiente"* con **N=2**. **Acá N=685 y reproduce.**

| | difranca / **main** | La Tortuga / main |
|---|---|---|
| Devoluciones `DDHP_A12` | **685** | 2 |
| Filas con «Estatus» pintado | **1 de 50 visibles** | 2 de 2 |

**Mecanismo, ahora identificado:** `transaction_statuses` tiene **2 filas** de tipo `dev` en todo el tenant
(`id_transaction` 877 y 878). La única fila que muestra Estatus en la primera página es **la 878**.
⇒ **la columna «Estatus» de devoluciones se pinta desde `transaction_statuses`**, no desde `return.st_return`
(que vale `1` en las 795 filas). **Es el mismo mecanismo que H2, del otro lado:** en pedidos la columna se
pinta bien y el filtro falla; en devoluciones **falla la columna**.

⇒ **El pendiente C2 queda CERRADO: reproduce sobre main, con causa.**

## 🟡 H7 — La opción `IGTF` sigue DUPLICADA en el `<select>` `Tipo Cobro`

```
Tipo Cobro |v=""  ·  Cobros |v=0  ·  Anticipo/Prepago |v=1  ·  Retención |v=2
IGTF |v=3  ·  IGTF |v=3   ← DUPLICADA  ·  Cobro 25% |v=4
```
Reconfirma `COB-TIPO-IGTF-DUPLICADO` **en main**. Sigue siendo la pista más fuerte de causa raíz de H1: el
catálogo del tipo 3 está mal armado, y los dos síntomas apuntan al mismo lugar.

## 🟡 H8 — `Tipo Pedido` sigue sin opciones

`:idOrderType_input` trae **1 sola `<option>`** (el placeholder). Filtro inutilizable en esta playa.
Reconfirma `PED-TIPO-PEDIDO-SIN-OPCIONES` en main.

## ⚠ H9 — Residuo de 42 visitas sin explicar

Web 25.450 vs BD 25.492 para `DDHP_A12`. No es `salesman_view` (serían 363) ni `id_enterprise`. Ítem menor
a verificar aparte.

---

# Patrones / selectores nuevos

## 🔴 El anti-patrón "poblar + Buscar + leer en la MISMA `evaluate`" **volvió a morder — y así se detecta**

Un lote que hacía `pick()` de select + `Buscar` + lectura dentro de una sola `evaluate` devolvió los resultados
**desfasados una posición**: pedí `# Ref = 99999999` y la lectura trajo la fila **39794**. Se detectó porque
**la ref de la fila leída no coincidía con la ref pedida**, y porque el label de un `<select>` recién cambiado
seguía en el placeholder.

⇒ **Regla:** toda medición va en **3 llamadas** — `evaluate(acción)` → `wait_for(5–8 s)` → `evaluate(lectura)`.
⇒ **Aserción obligatoria de auto-verificación:** la lectura debe devolver **la ref/label que se pidió**. Si no
coincide, el dato se descarta. Sin esa aserción el desfase pasa por resultado bueno.

## 💎 Truco nuevo: **vaciar el `<tbody>` antes de pulsar `Buscar`**

```js
const t = document.querySelector('.ui-datatable');
if (t && t.querySelector('tbody')) t.querySelector('tbody').innerHTML = '';   // sólo cliente, no toca el server
document.querySelector('[id$=":ajax"]').click();
```
Garantiza que **ninguna lectura posterior pueda venir del render anterior**. Convierte "0 pintados" en un dato
confiable en vez de ambiguo. Es lo que permitió sostener H1 sin dudar del método.

## Selectores — correcciones a `web-selectors/`

| Qué decía la doc | Medido hoy en **main** |
|---|---|
| «los IDs `#j_idt12/14/16` del login **quedan derogados** en El Yaque» | 🔄 **Volvieron**: el login es `j_idt12` (Usuario) / `j_idt14` (Clave). **Igual NO anclarlos** — `input[placeholder="Usuario"]` y `[placeholder="Clave"]` resolvieron 100 % |
| «visitas **NO tiene** filtro de `# Ref`» | ❌ **Falso en main: `[id$=":n_ref"]` SÍ existe en visitas** |
| «en El Yaque visitas **NO tuvo filtro de vendedor**» | ❌ **Falso en main:** `:idSalesman` con 18 opciones |
| «`PF('tablaVisit')` **no** expone `paginator.cfg.rowCount`» | ❌ **Falso en main: sí lo expone** (25.450), y coincide con `Total de Resultados` |
| «devoluciones: `orderStatus` trae **dos opciones `Enviado`** (8 y 23)» | 🔄 **Ya no**: sólo `8 Enviado` y `28 Por aprobar`. La ambigüedad desapareció |
| visitas usa `:btnBuscar`, no `:ajax` | ✅ **Reconfirmado** |
| El ajax de Empresa **repuebla las fechas** | ✅ **Reconfirmado** (al cambiar a `DIFRANCA C.A`, `dateF` volvió a `10/08/2026`) |
| La Empresa **tapa** el `# Ref`; las fechas no | ✅ **Reconfirmado** (21834 con empresa 2 → 0 contados) |
| `navigate` resetea el `Status` de pedidos | ✅ **Reconfirmado** (llegó en placeholder tras cada `page.goto`) |

### Filtros nuevos de visitas no documentados

`:idRol` (Roles) · `:idSalesman` (Vendedor) · `:idClient` · `:idEstatus` (`2 Visitado` / `3 No visitado`) ·
`:idType` (Actividad, 4 opciones) · `:idMotive` (**89 opciones**) · `:selectAttach` · `:selectDispatch` ·
**`:selectCoordinadas`** (7 valores: *Por Revisar · No Realizado · Falta Coordenada (Sucursal) · Falta
Coordenada (Destino) · Fuera de Rango · Correcto*) — este último es un oráculo GPS regalado, sin explotar.

### Nombres reales de tablas (para el cotejo BD)

| Módulo | Tabla | `# Ref` |
|---|---|---|
| devoluciones | **`"return"`** (reservada, requiere comillas) — ⚠ **`devolution` NO existe** | `id_return` |
| clientes potenciales | `potential_client` | **`id_client`** (no `id_potential_client`) |
| depósitos | `deposit` | `id_deposit` |
| inventarios | `client_stock` | `id_client_stock` |
| visitas | `visit` | `id_visit` |

⚠ Ninguna de las 5 tiene PRIMARY KEY declarada.

### Quoting de `"order"` desde la línea de comandos

**PowerShell se come las comillas dobles** y `node query.js` recibe SQL roto (`syntax error at or near "order"`).
Usar el tool **Bash**:
```sh
node automation/db/query.js difranca 'SELECT count(*) FROM "order" WHERE co_operation<>'"'"'D'"'"''
```

### Huella de build por HTTP (sin navegador, 1 comando)

```
HEAD {base}/javax.faces.resource/common.css.xhtml?ln=css   →  Last-Modified
```
⚠ La ruta `resources/demo/css/common.css` **da 404**: hay que usar la forma `javax.faces.resource/...xhtml`.

---

## Resumen para el go/no-go del tag 21

| # | Hallazgo | Veredicto sobre `main` | Severidad |
|---|---|---|---|
| **H1** | `COB-LISTA-RENDER-VACIO` (IGTF deja Cobros en blanco) | 🔴 **REPRODUCE — 4/4** | **BLOQUEANTE** |
| **H2** | `PED-STATUS-CONTRADICE-COLUMNA` | 🟠 **REPRODUCE** (15.441 vs 3) | media-alta |
| **H3** | Pedidos de vendedor de baja invisibles (`salesman_view`) | 🔴 **CONFIRMADO en UI**, aritmética exacta ×3 | alta |
| **H4** | Contaminación cruzada de tenants en BD | 🔴 **NUEVO** | alta |
| **H5** | Inventarios muestra 0 de 2, ni por `# Ref` | 🔴 **NUEVO** | alta |
| **H6** | Devoluciones: «Estatus» vacío 49/50 | 🟠 **REPRODUCE** (cierra C2) | media |
| **H7** | `IGTF` duplicado en el `<select>` | 🟡 reconfirmado | baja |
| **H8** | `Tipo Pedido` sin opciones | 🟡 reconfirmado | baja |

**Lo que la QA esperaba saber: los dos hallazgos en observación REPRODUCEN sobre `main`.** Ninguno de los dos
se arregló al subir, y en ambos casos la hipótesis de "es la versión desplegada" queda **descartada por
medición**: El Yaque sirve hoy el mismo build que las playas donde no se veían.

---

*Capa web · 2026-08-10 · difranca / EL YAQUE · `main` · READ-ONLY (sólo `Buscar`, `<select>` de filtro,
`# Ref` y rango de fechas — ningún control de escritura tocado)*
