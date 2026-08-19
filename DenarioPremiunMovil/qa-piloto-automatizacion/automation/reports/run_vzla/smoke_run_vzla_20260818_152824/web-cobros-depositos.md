# WEB — COBROS y DEPÓSITOS · cotejo BD→web de los 4 cobros del 19/08 + el depósito

**RUN_ID:** `20260818_152824_smoke-completo` · **Cliente:** `run_vzla` — **CORPORACION FERRE 19, C.A.**
(`FERRE_N`, `id_enterprise=1`) · **Playa: LA TORTUGA** (`http://denariolatortuga.ddns.net:8080/DenarioPremium`,
descubierta en runtime, no es campo del perfil) · **Usuario móvil:** `id_user=470` / `co_user='000208'`
**Tanda web:** 5.ª de la corrida · **read-only total** · 2026-08-19, 14:41–14:50 UTC
**Guarda de tenant verificada:** `idEnterprise` = `1` con **una sola opción**, texto `CORPORACION FERRE 19, C.A.`
en los dos módulos, antes de cada `Buscar`.

---

## 0. Resumen ejecutivo — los dos dictámenes que pedía la tanda

| Defecto | Veredicto | Evidencia dura |
|---|---|---|
| **A · `collection.nu_amount_total = 0`** | 🟢 **NO REPRODUCE** — pasa a **observación histórica** por el gate §5.a | Los 4 cobros de hoy traen el campo poblado **y el indicador de cabecera los cuenta**: `# Ref 32994` → `Monto total en US$: 123,17`; `32995` → `10,00`; `32996` → `5,00`; `32997` → `3,00`. **Último afectado: 17/08/2026** (`# Ref 32969`) |
| **B.1 · `deposit.nu_amount_doc = 0`** | 🟢 **NO REPRODUCE** — observación histórica | Los **2 depósitos creados hoy 19/08** por el usuario QA traen el campo poblado: **`# Ref 3`** = `227,0000` y **`# Ref 4`** = `123,1700`, y la web muestra `227,00 US$` y `123,17 US$`. **Último afectado: 16/07/2026** |
| **B.2 · `deposit_collection_payment` vacía** | 🔴 **SÍ REPRODUCE** | `SELECT count(*) FROM deposit_collection_payment` = **0** con **4 depósitos** en el tenant, incluidos los 2 de hoy. El vínculo sigue viviendo solo en `collection.id_deposit` |
| **B.3 🆕 · el indicador de `/pages/depositos` NO lee `nu_amount_doc`** | 🔴 **DEFECTO WEB NUEVO, reproduce hoy** | Con **2 filas** pintadas que suman **350,17 US$** (`123,17` + `227,00`), la cabecera dice **`Monto total en US$: 0,00`**. **La página se contradice a sí misma en pantalla, con el dato de origen CORRECTO** ⇒ ya no se puede seguir diciendo *"el 0,00 es fiel a la fuente"* |

**Marca por registro:** 4 cobros `WEB-OK` (con 1 hallazgo de campo acotado en el pago tipo depósito) ·
depósitos `# Ref 3` y **`# Ref 4`** `WEB-OK` en el registro, con el defecto B.3 sobre el indicador de la lista.

> 🔴 **EL DEPÓSITO NUEVO LLEGÓ A MITAD DE LA TANDA — y se remidió.** A las **14:49:12 UTC** la BD todavía
> devolvía 3 depósitos y `id_deposit IS NULL` en los 4 cobros; a las **14:57:34 UTC** apareció **`id_deposit = 4`**
> (`da_update 14:49:52 UTC`, es decir **40 s después de mi último poll**). **Se abortó el `WEB-N/A` provisional
> y se cotejó de verdad** — exactamente el precedente de la visita 2152. Ver **§2.5**.
> ⇒ **El dictamen sobre B.3 se REFUERZA:** con **2 filas** pintadas que suman **350,17 US$** el indicador
> **sigue en `0,00`**.

---

## 1. PARTE 1 — Cotejo BD→web de los 4 cobros

Los 4 pasan el gate de precondición: `co_operation='I'`, `st_collection=3`, `id_user=470`, `id_enterprise=1`,
`nu_attachments` poblado ⇒ **`BD-OK`**, evaluables.

Ciclo usado, 4/4 sin reintentos: `navigate(/pages/cobros)` → `evaluate(verificar combos + setRef + Buscar)` →
`evaluate(leer lista)` → `evaluate(abrirRef)` → `evaluate(leer detalle)`.
**Los 7 combos se leyeron uno por uno ANTES de cada `Buscar`** y llegaron limpios las 4 veces
(`idEnterprise=1`, `idSalesmaView=""`, `clientSOM=""`, `idTipo=""`, `idDep=""`, `attachStatus=0`, `orderStatus=0`);
el `# Ref` llegó **vacío** tras cada `browser_navigate`. Contados vs pintados: **1/1 en los 4**.

### 1.1 · `# Ref 32994` — cobro normal (`co_type=0`) con retención por documento → **`WEB-OK`**

| Campo | BD | Web | ✓ |
|---|---|---|---|
| `# Ref` / `id_collection` | 32994 | `32994` (lista y `No. de Ref.`) | ✅ |
| Cliente | `006540` / MARIBEL HAMMANI BESERENI | `006540` / MARIBEL HAMMANI BESERENI | ✅ |
| `co_type` | 0 | `Cobros` | ✅ |
| Fecha | `da_collection` 2026-08-19 **13:05:32 UTC** | `19/08/2026 09:05:32` (UTC−4) | ✅ mismo día |
| `nu_amount_total` | 123,1700 | `Monto cobrado 123,17 US$` · indicador `123,17` | ✅ |
| `nu_amount_final` | 123,1700 | `Total por cobrar 123,17 US$` · `Total Monto a pagar 123,17 US$` | ✅ |
| `nu_difference` | 0,0000 | `Diferencia cobro 0,00 US$` / `Diferencia de cobro 0,00` | ✅ |
| Pago `ef` / `REC-COB-001` / 123,17 | `collection_payment` 33165 | lista `ef: REC-COB-001` · detalle `Efectivo` · `Nro Documento REC-COB-001` · `123,17 US$` | ✅ |
| Comentario | `Test-COB-004 smoke` | `Test-COB-004 smoke` | ✅ |
| Empresa / Responsable / Vendedor | FERRE_N / QA / 000208 | `CORPORACION FERRE 19, C.A.` (=`na_enterprise`) / `QA` / `000208 000208` | ✅ |
| Ubicación | `coordenada 11.0490125,-63.8649878` | `Ubicación: Mapa` (mapa embebido) | ✅ |

**Documento (`form:documentosPagadosDT`, 15 columnas, 1 fila) — 15/15 exactas:**
`1 · 04/05/2026 · FACT · FACT50039415 · NO · 131,17 · 131,17 · 0,00 · 123,17 · 12345678901234 · 19/08/2026 · 5,00 · 3,00 · 0,00 · US$`
contra `collection_detail 40641`: `da_document 2026-05-04`, `nu_amount_doc 131,17`, `nu_balance_doc 131,17`,
`in_payment_partial false`, `nu_amount_paid 123,17`, `nu_voucher_retention 12345678901234`,
`da_voucher 2026-08-19`, `nu_amount_retention_iva 5,00`, `nu_amount_retention_islr 3,00`. ✅

**Oráculos de cálculo — los dos cuadran:**
- Regla única `Total Monto a pagar = Σ(Monto a pagar)` → `123,17 = 123,17` ✅
- Fórmula larga (aplicable porque `Pago parcial = NO`): `131,17 − 0,00 (dcto) − (5,00 + 3,00) − 0,00 + 0,00 = 123,17` ✅
- `Monto total base 131,17` = `nu_amount_doc` del documento ✅

### 1.2 · `# Ref 32995` — cobro normal con **pago parcial** y método **depósito** → **`WEB-OK`** *(con hallazgo W-H1, ver §3)*

| Campo | BD | Web | ✓ |
|---|---|---|---|
| `nu_amount_total` / `nu_amount_final` | 10,0000 / 10,0000 | `Monto cobrado 10,00` · indicador `10,00` · `Total por cobrar 10,00` · `Total Monto a pagar 10,00 US$` | ✅ |
| Documento | `FACT50009688`, `da_document 2024-05-08`, `nu_amount_doc 14,97`, `in_payment_partial **true**`, `nu_amount_paid 10,00` | `1 · 08/05/2024 · FACT · FACT50009688 · **SI** · 14,97 · 14,97 · 0,00 · 10,00 · — · — · 0,00 · 0,00 · 0,00 · US$` | ✅ |
| Pie | — | `Monto total base 14,97 US$` · **sin líneas de Retención** (IVA/ISLR = 0 ⇒ no se renderizan) | ✅ |
| Pago `de` / DEL SUR / `9988776655` / 10,00 | `collection_payment` 33166 | `Deposito` · `Banco receptor DEL SUR` · `Nro Documento 9988776655` · `10,00 US$` | ✅ |
| **Nº de cuenta del depósito** | `nu_collection_payment = 01570042473742206372` (y `nu_client_bank_account` idem) | columna **`Numero de Cuenta` VACÍA** | 🔴 **W-H1** |
| Comentario | `Test-COB-046 parcial` | `Test-COB-046 parcial` | ✅ |

⚠ Como advierte `cobros.md`, con **pago parcial** `Total por cobrar` (10,00) **≠ `Saldo doc.`** (14,97). **No es mismatch:**
la regla única `Σ(Monto a pagar) = 10,00` cuadra y la fórmula larga **no aplica** en este caso.
`Monto cobrado 10,00` es el **desglose** del único pago, no un total — §5.b, no se reporta.

### 1.3 · `# Ref 32996` — **anticipo** (`co_type=1`) → **`WEB-OK`**

| Campo | BD | Web | ✓ |
|---|---|---|---|
| Cliente | `005354` / GENESIS CASTILLO | `005354` / GENESIS CASTILLO | ✅ |
| `co_type` | 1 | `Anticipo/Prepago` | ✅ |
| `nu_amount_total` / `nu_amount_final` | 5,0000 / 5,0000 | indicador `5,00` · `Monto cobrado 5,00 US$` · `Total por cobrar 5,00 US$` · **`Monto pagado 5,00 US$`** | ✅ |
| Pago `ef` / `REC-ANT-001` / 5,00 | `collection_payment` 33167 | `Efectivo` · `REC-ANT-001` · `5,00 US$` | ✅ |
| `collection_detail` | **0 filas** (no existe) | **`form:documentosPagadosDT` NO EXISTE en el DOM** (`getElementById` → `null`; la página tiene **1 sola** `.ui-datatable`) | ✅ **por diseño** |
| Comentario | `Test-COB-028 anticipo` | `Test-COB-028 anticipo` | ✅ |

✅ **Se confirma la variante de pie del anticipo**: el detalle trae **exactamente** `Monto pagado`,
`Monto pagado conversión` y `Tasa de conversión`, y **ninguno** de los 8 campos del pie normal.
⚠ Matiz nuevo contra `[el_palmar-20260805]`: acá el anticipo llega con **`nu_amount_final = 5,00`**, no `0`
⇒ la advertencia *«derivar `Diferencia cobro` por resta da falso mismatch en anticipos porque
`nu_amount_final=0`»* **no se activa en este tenant**. Aun así se leyó `nu_difference` de BD, no por resta.

### 1.4 · `# Ref 32997` — **retención** (`co_type=2`) → **`WEB-OK`**

| Campo | BD | Web | ✓ |
|---|---|---|---|
| `co_type` | 2 | `Retención` | ✅ |
| `nu_amount_total` / `nu_amount_final` | 3,0000 / 3,0000 | indicador `3,00` · `Total por cobrar 3,00 US$` · `Total Monto a pagar 3,00 US$` | ✅ |
| Documento | `FACT50030222`, `da_document 2025-10-22`, `nu_amount_doc 41,27`, IVA 2,00 / ISLR 1,00, `nu_voucher_retention 98765432109876`, `da_voucher 2026-08-19` | `1 · 22/10/2025 · FACT · FACT50030222 · NO · 41,27 · 41,27 · 0,00 · 3,00 · 98765432109876 · 19/08/2026 · 2,00 · 1,00 · 0,00 · US$` | ✅ |
| Pie | — | `Monto total base 41,27 US$` **+ `Retención IVA 2,00 US$` + `Retención ISLR 1,00 US$`** | ✅ |
| `collection_payment` | **0 filas** | tabla de pagos = **`No se encontraron registros.`** · columnas `Pagos` y `Monto cobrado` de la lista **vacías** | ✅ **por diseño (§5.b), no se reporta** |
| Nro Retención (lista) | `98765432109876` | `98765432109876` | ✅ |
| `coordenada` | **`''` (vacía)** | `La Transacción no tiene coordenadas asignadas` · **sin campo `Ubicación`** | ✅ **fiel** |

**Oráculo de retención:** `Total Monto a pagar = Σ(Monto a pagar) = 3,00` **y** `= IVA 2,00 + ISLR 1,00` ✅ — las dos
variantes de la fórmula coinciden.
⚠ El literal *"La Transacción no tiene coordenadas asignadas"* se pega a `Firma:` — **artefacto conocido del
lector `#form.innerText`**, no un dato. Verificado contra BD: `coordenada = ''` ⇒ la web es **fiel**, no falta nada.

### 1.5 · Adjuntos — **15/15 en HTTP 200**, verificados por status, **sin descargar nada**

Verificación por `fetch(url)` desde la propia página (mismo origen), leyendo **solo `status` + `content-type` +
`content-length`**. **No se pulsó `Descargar adjuntos` en ningún momento** ⇒ 0 basura en `%TEMP%\playwright-artifacts-*`.

| `# Ref` | `nu_attachments` | Imágenes (`transaction_image`) | Firma (`transaction_signatures`) | Archivo (`transaction_files`) | Suma | HTTP |
|---|---|---|---|---|---|---|
| 32994 | **3** | `32994_0.jpeg` (93.205 B) | `32994_0.jpg` (4.640 B) | `32994_0.pdf` (5.013 B) | **3** ✅ | 3/3 · **200** |
| 32995 | **4** | `32995_0.jpeg` (108.052) · `32995_1.jpeg` (93.205) | `32995_0.jpg` (3.936) | `32995_0.pdf` (5.013) | **4** ✅ | 4/4 · **200** |
| 32996 | **4** | `32996_0.jpeg` · `32996_1.jpeg` | `32996_0.jpg` (4.031) | `32996_0.pdf` | **4** ✅ | 4/4 · **200** |
| 32997 | **4** | `32997_0.jpeg` · `32997_1.jpeg` | `32997_0.jpg` (6.575) | `32997_0.pdf` | **4** ✅ | 4/4 · **200** |

**Rutas confirmadas** (base `http://denariolatortuga.ddns.net:8080/denario/resources/`):
`images/cobros/{id}_{n}.jpeg` · `images/firmas/cobros/{id}_0.jpg` · `files/cobros/{id}_0.pdf`.
Los `content-type` llegaron correctos (`image/jpeg`, `application/pdf`) ⇒ no son páginas de error con 200.

**Render en pantalla, además del status:** `form:graImaPro` (firma) con `naturalWidth=280` y
`form:galeriaDLG:{n}:j_idt377` (galería) con `naturalWidth=720` en los 4 detalles ⇒ **las imágenes se pintan
de verdad**. La `Firma:` "vacía" del `innerText` es el artefacto de siempre: `innerText` no ve imágenes.

🔑 **`nu_attachments` de COBROS = archivos + imágenes + FIRMA** — 4/4 exacto. Corrige la nota del perfil
(*«clientesPotenciales suma la firma, los otros 4 módulos no»*): **cobros también la suma.** Sigue sin ser un
oráculo uniforme entre módulos, pero **dentro de cobros es exacto y sirve**.

✅ Estos 4 registros son **posteriores al fix del rutero de adjuntos del 17/08** ⇒ **15/15 en 200** confirma
(y extiende a 34/34 con los 19 previos) que el fix rinde. **El backfill de los ~20 archivos anteriores sigue pendiente**
y este cotejo **no lo toca**.

---

## 2. PARTE 2 — Depósitos

### 2.1 · El depósito que SÍ llegó — `# Ref 3` → **`WEB-OK`** en el registro

**No es el que se estaba creando en paralelo.** `id_deposit=3`, `co_deposit 1787145056946.0`, `id_user=470`,
`da_deposit 2026-08-19 13:10:56`, `da_update **13:11:19 UTC**` — es decir, **llegó a la nube 1 h 22 min ANTES de
que llegaran los 4 cobros** (`da_created` 14:33–14:36 UTC) y **está vinculado al cobro `32993`**, no a 32994/32996.
Coherente: a las 13:11 el único cobro en efectivo **enviado** disponible era `32993`.

| Campo | BD (`deposit` 3) | Web | ✓ |
|---|---|---|---|
| `# Ref` | 3 | `3` | ✅ |
| `st_deposit` | 1 | `Enviado` | ✅ |
| `da_deposit` | 2026-08-19 13:10:56 UTC | `19/08/2026 09:10:56` (UTC−4) | ✅ |
| Vendedor | `id_user 470` | `000208 000208` | ✅ |
| `nu_account` | `01570042473742206372` | `N° cuenta: 01570042473742206372` | ✅ |
| `nu_document` | `DEP-QA-054763` | `N° Planilla: DEP-QA-054763` (lista y detalle) | ✅ |
| `da_document` | 2026-08-18 | `Fecha de planilla: 18/08/2026 00:00:00` | ✅ |
| **`nu_amount_doc`** | **227,0000** | **`Monto depositado: 227,00 US$`** (lista y detalle) | ✅ |
| `tx_comment` | `''` | `Observaciones:` vacía | ✅ |
| Adjuntos / firma | **0 filas** en las 3 tablas para `depositos` | galería vacía · `Firma:` vacía | ✅ fiel |
| `co_bank` | `003` (`bank.na_bank = **DEL SUR**`) | **`Banco: 003`** (columna y campo) | 🟡 **W-H2** |

**Tabla hija (`form:j_idt163`, anclada por `['N° Ref cobro']`), 1 fila:**
`1 · 18/08/2026 · **32993** · ALIRIO ANTONIO DURAN (INVERSIO · Efectivo · — · 0989 · 18/08/2026 · **227,00 US$**`
contra `collection 32993` (`nu_amount_total 227,00`) y `collection_payment` (`ef`, `nu_payment_doc 0989`,
`nu_amount_partial 227,00`). ✅
⚠ `ALIRIO ANTONIO DURAN (INVERSIO` viene **truncado en la propia BD** (`na_client`, 30 car.) ⇒ **la web es fiel**,
no es un recorte de la web.

✅ **El oráculo `WEB-RUNTIME §7` (`Σ hijos == Monto depositado`) SE CUMPLE por primera vez en este tenant:**
`227,00 == 227,00`. La auto-contradicción del detalle que documentaba `depositos.md`
(`Monto depositado 0,00` sobre una hija de `266,59`) **NO reproduce en el registro nuevo**.

### 2.2 · 🔴 B.3 — el indicador de cabecera de `/pages/depositos` **sigue en `0,00`** con el dato correcto

```
/pages/depositos · empresa CORPORACION FERRE 19, C.A. · fechas 01/08/2026–19/08/2026 · combos en placeholder
  cabecera :  "Monto total en US$: 0,00    Total de Resultados: 1"
  única fila:  # Ref 3 · Enviado · 19/08/2026 09:10:56 · 000208 000208 · 003 · DEP-QA-054763 · 227,00 US$
```

**La página se contradice a sí misma, y esta vez el dato de origen es CORRECTO** (`nu_amount_doc = 227,00`).
⇒ **Se revoca parcialmente el dictamen de la tanda anterior** (*«el `0,00` es fiel a la BD, el defecto está aguas
arriba»*): eso valía para la **columna** `Monto depositado` de los 2 depósitos de julio. **El indicador no lee
`nu_amount_doc`** — con `nu_amount_doc` poblado sigue dando `0,00`.

**Contraste que lo prueba, en el mismo build y la misma sesión:** en `/pages/cobros` el indicador **sí** sigue a
su campo (`# Ref 32994` → `123,17` = `nu_amount_total`, con `nu_amount_total_conversion = 0` ⇒ descarta que el
indicador de cobros lea la conversión). En depósitos, con `nu_amount_doc = 227,00`, da `0,00`.

**Dos candidatos, sin poder discriminar con un solo registro no nulo** (se documentan como hipótesis, **no** como
causa): (a) el indicador suma la tabla puente **`deposit_collection_payment`, que está VACÍA (0 filas)**;
(b) suma `deposit.nu_amount_doc_conversion`, que vale `0,0000` en los 3 depósitos.
📋 **Confirmar con desarrollo cuál de las dos.** Severidad 🟠 media: no pierde registros ni datos de fila, pero
**el KPI de cabecera de depósitos es inservible** y contradice lo que el operador ve debajo.

### 2.3 · Enlace cruzado depósito↔cobro — ✅ funciona con el registro nuevo

`/pages/cobros` con `Depositado = SI` (`:idDep` → `1|SI`, verificado en el `<select>` espejo antes de `Buscar`)
devuelve **1 contado / 1 pintado**: `# Ref 32993`, con la columna `Depósito` = **`Consultar Depósito`** (enlace vivo)
y el indicador en `227,00`. Los 4 cobros de hoy **no** aparecen — correcto, `collection.id_deposit IS NULL` en los 4.

### 2.4 · Cronología del depósito nuevo — **estuvo ausente 4 polls y llegó al 5.º**

Se consultó BD **5 veces**, con el reloj impreso en las dos últimas:

| Poll | Hora UTC | `deposit` | `collection.id_deposit` de 32994/32996 |
|---|---|---|---|
| 1 | 14:41 | 3 filas (ids 1, 2, 3) | `NULL` / `NULL` |
| 2 | 14:44 | 3 filas | `NULL` / `NULL` |
| 3 | 14:47 | 3 filas | `NULL` / `NULL` |
| 4 | **14:49:12** | 3 filas | `NULL` / `NULL` |
| **5** | **14:57:34** | 🔴 **4 filas — aparece `id_deposit = 4`** (`da_update` **14:49:52**) | **32994 → 4** · 32996 → `NULL` |

**El registro entró a la nube 40 segundos después del 4.º poll.** Se había redactado un `WEB-N/A` con motivo
(*«no llegó, queda pendiente»*); al detectarlo en el 5.º poll **se descartó esa marca y se cotejó el registro**.
📌 **Es la 2.ª vez en esta corrida que un registro "ausente" aparece a mitad de la medición** (la 1.ª fue la
visita 2152). ⇒ **La regla se confirma: nunca cerrar un `WEB-MISSING` sin un último poll con reloj.**

### 2.5 · `# Ref 4` — el depósito contra los cobros en efectivo → **`WEB-OK`**

`id_deposit=4`, `co_deposit 1787150555231.0`, `id_user=470`, `da_deposit 2026-08-19 14:42:35`, `da_update 14:49:52 UTC`.

| Campo | BD (`deposit` 4) | Web | ✓ |
|---|---|---|---|
| `# Ref` / `st_deposit` | 4 / 1 | `4` / `Enviado` | ✅ |
| `da_deposit` | 2026-08-19 14:42:35 UTC | `19/08/2026 10:42:35` (UTC−4) | ✅ |
| Vendedor / Empresa | `id_user 470` / FERRE_N | `000208 000208` / `CORPORACION FERRE 19, C.A.` | ✅ |
| `nu_account` | `01140200312000885358` | `N° cuenta: 01140200312000885358` | ✅ |
| `nu_document` | `DEP-QA-0819` | `N° Planilla: DEP-QA-0819` | ✅ |
| `da_document` | 2026-08-18 | `Fecha de planilla: 18/08/2026 00:00:00` | ✅ |
| **`nu_amount_doc`** | **123,1700** | **`Monto depositado: 123,17 US$`** (lista y detalle) | ✅ |
| `tx_comment` | `Smoke DM-DEP run_vzla 19-08` | `Observaciones: Smoke DM-DEP run_vzla 19-08` | ✅ |
| Adjuntos / firma | **0 filas** en las 3 tablas | galería vacía · `Firma:` vacía | ✅ fiel |
| `co_bank` | `006` (`bank.na_bank = **BANCARIBE**`) | **`Banco: 006`** | 🟡 **W-H2, 2.ª exhibición** |

**Tabla hija (`form:j_idt163`), 1 fila:**
`1 · 19/08/2026 · **32994** · MARIBEL HAMMANI BESERENI · Efectivo · — · REC-COB-001 · 19/08/2026 · **123,17 US$**`
✅ **Oráculo `Σ hijos == Monto depositado`: `123,17 == 123,17`.** Cuadra por 2.ª vez en la tanda.

📌 **Dato para el lado móvil, no defecto web:** el depósito agrupó **solo `32994`** (123,17). El otro cobro en
efectivo, **`32996` (anticipo, 5,00), quedó FUERA** (`collection.id_deposit` sigue `NULL`) y no aparece en la
tabla hija. **La web es fiel a lo que envió la app** — si el anticipo debía ser depositable, el faltante está
aguas arriba. 📋 Confirmar con desarrollo si el efectivo de un `co_type=1` es elegible para depósito.

### 2.6 · 🔴🔴 B.3 REFORZADO — con **2 filas** y **350,17 US$** en pantalla, el indicador sigue en `0,00`

```
/pages/depositos · empresa CORPORACION FERRE 19, C.A. · combos verificados en placeholder · sin filtro # Ref
  cabecera :  "Monto total en US$: 0,00    Total de Resultados: 2"
  fila 1   :  # Ref 4 · Enviado · 19/08/2026 10:42:35 · 006 · DEP-QA-0819    · 123,17 US$
  fila 2   :  # Ref 3 · Enviado · 19/08/2026 09:10:56 · 003 · DEP-QA-054763 · 227,00 US$
                                                              Σ pintado  =  350,17 US$
```

**Dos depósitos, ambos creados hoy, ambos con `nu_amount_doc` correcto, y el indicador en `0,00`.**
Ya no queda ninguna lectura alternativa: **el KPI de cabecera de `/pages/depositos` no lee `nu_amount_doc`.**
El contraste con `/pages/cobros` (donde el indicador **sí** sigue a `nu_amount_total`) es del mismo build y la
misma sesión. La tabla puente `deposit_collection_payment` sigue en **0 filas** también con el depósito 4.

---

## 3. Hallazgos

### 🔴 W-H1 — el **N° de cuenta** del pago tipo **Depósito** nunca se muestra en la web *(reproduce hoy)*

**Síntoma.** `detalleCobro` → tabla de formas de pago → columna **`Numero de Cuenta`** llega **vacía** en los pagos
con `co_payment_method = 'de'`, aunque el vendedor **sí** eligió una cuenta en el móvil y el dato **sí** está en la nube.

| Cobro | Fecha | Método | `nu_collection_payment` (BD) | `nu_bank_account` (BD) | Columna `Numero de Cuenta` (web) |
|---|---|---|---|---|---|
| **32995** (de hoy) | 19/08/2026 | `de` DEL SUR | **`01570042473742206372`** | `''` | **VACÍA** 🔴 |
| **32675** (control, otro vendedor) | 13/08/2026 | `de` BANESCO | **`01340354613541021062`** | `''` | **VACÍA** 🔴 |
| **32958** (control positivo) | 17/08/2026 | `pm` PROVINCIAL | `BANESCO` | `01080941080100025996` | **`01080941080100025996`** ✅ |

**Causa acotada por los tres casos:** la columna renderiza **`collection_payment.nu_bank_account`**. La app llena
`nu_bank_account` en los pagos **móvil (`pm`)** pero **no** en los de **depósito (`de`)**, donde la cuenta elegida
viaja en `nu_collection_payment` / `nu_client_bank_account`. **La web nunca lee esas dos columnas** ⇒ el dato entra
a la nube y no sale por ninguna pantalla.

**Alcance medido, todo el tenant:** `co_payment_method='de'` y `co_operation IS DISTINCT FROM 'D'` → **17 pagos, y
los 17 traen cuenta capturada** (`nu_collection_payment <> ''`) ⇒ **17 de 17 (100 %) invisibles**.
**Pasa el gate §5.a:** reproduce en un registro creado **hoy** (32995) y en uno de un vendedor real del 13/08.
**Severidad 🟠 media** — población chica pero afectación total, y es justo el dato que necesita quien concilia un
depósito bancario. **Contraste que lo vuelve claramente un fallo de la web, no del dato:** la **misma cuenta**
`01570042473742206372` **sí** se muestra en `/pages/detalleDeposito` (`N° cuenta:`).
📋 Confirmar con desarrollo si la columna debe caer a `nu_collection_payment` cuando `nu_bank_account` está vacío.

### 🟡 W-H2 — `Banco` muestra el **código**, no el nombre — **ahora con un registro del día**

`/pages/depositos` (columna `Banco`) y `/pages/detalleDeposito` (campo `Banco:`) muestran **`003`** teniendo
`bank.na_bank = 'DEL SUR'` (misma empresa, `co_operation='I'`). **Reproduce en el depósito `# Ref 3`, creado hoy**
⇒ **se levanta la reserva** que dejó la tanda anterior (*«solo hay 2 depósitos, ambos de julio, no hay registro del
día con el que exhibirlo»*). Severidad 🟡 baja (legibilidad), molesto para conciliación.
⚠ **No se generaliza a cobros:** en `/pages/cobros` y en `detalleCobro` el banco sale **por nombre**
(`DEL SUR`, `BANESCO`, `PROVINCIAL`). Es específico de **depósitos**.

### 🔵 W-H3 — cosmético: `"Deposito"` sin tilde en la tabla de formas de pago de `detalleCobro`

El rótulo del método `de` se pinta **`Deposito`**. El resto de la UI acentúa (`Retención`, `Ubicación`,
`Monto total en US$`). Severidad 🔵 mínima.

### 🟢 Observaciones descartadas por el gate §5.a — **no son hallazgos de esta versión**

| Anomalía | Por qué se descarta |
|---|---|
| **`collection.nu_amount_total = 0`** | **No reproduce desde el 17/08/2026.** **31** cobros afectados (`co_operation IS DISTINCT FROM 'D'`): **30** de tipo `0` por **16.443,65 US$** + **1** de tipo `2` por 0,00. Los 4 de hoy vienen correctos. **Observación histórica, no defecto de la release** |
| **`deposit.nu_amount_doc = 0`** | **No reproduce desde el 16/07/2026.** Solo los depósitos 1 y 2; el 3 (de hoy) trae 227,00 |
| `Monto cobrado` con varios importes / vacío en retención | **Por diseño (§5.b)** — desglose por método de pago; las retenciones no llevan método |
| `Total por cobrar ≠ Saldo doc.` en 32995 | **Por diseño** — es un pago parcial |
| `Firma:` vacía en el `innerText` | **Artefacto del lector** — las 4 firmas se pintan (`form:graImaPro`, 280 px) y dan HTTP 200 |
| `Ubicación` ausente en 32997 | **Fiel a BD** — `coordenada = ''` |
| `ALIRIO ANTONIO DURAN (INVERSIO` truncado | **Fiel a BD** — `na_client` ya viene truncado a 30 car. |
| `Nº`, `Banco: 006`, `ot:`, lote en `detalleInventario` | **Ya reportados en tandas previas** — no se repiten |

### ✅ Lo que se re-verificó y **no** reproduce

| Riesgo abierto | Resultado en esta tanda |
|---|---|
| **HTTP 500 / `StackOverflowError` en `collectionBean`** | **0 ocurrencias en ~9 cargas de `/pages/cobros` + 6 `Consultar`.** Sigue siendo intermitente; **no se pudo reproducir** |
| `COB-LISTA-RENDER-VACIO` (cuenta bien, no pinta) | **7 de 7 búsquedas: contados == pintados == 1.** No reproduce (tipos 0, 1 y 2, y controles ajenos) |
| Combos que sobreviven a `browser_navigate` | **6 de 6 entradas frescas: todos limpios.** Reconfirma el matiz del 19/08 — **lo obligatorio es VERIFICARLOS**, no suponer el reseteo. Aun así el `# Ref` **sí** llegó vacío siempre |
| Sesión JSF caída a mitad de tanda | No ocurrió. La sesión **sí** estaba caducada al arrancar: el primer `navigate` devolvió `login.xhtml` sin fallar (re-login por `input[placeholder=…]`) |

---

## 4. Patrones / selectores nuevos

### 4.1 · 🔑🔑 Las **TRES variantes de `detalleCobro`** — medidas en la misma sesión, una por `co_type`

Esta tanda cubrió los 3 tipos con 3 registros del mismo día, mismo build y misma sesión ⇒ es la medición
más limpia del mapa. **Un lector con campos fijos falla en 2 de cada 3 cobros.**

| | **`co_type=0` · Cobro** (32994) | **`co_type=1` · Anticipo** (32996) | **`co_type=2` · Retención** (32997) |
|---|---|---|---|
| **Campos del pie** | `Monto total base` · `…base conversión` · `Monto total descuento` · `…descuento conversión` · `Monto total IGTF` · `…IGTF conversión` · `Total Monto a pagar` · `…a pagar conversión` · `Tasa de conversión` | 🔴 **SOLO 3:** `Monto pagado` · `Monto pagado conversión` · `Tasa de conversión` | idénticos a `co_type=0` |
| **`Retención IVA` / `Retención ISLR`** | ✅ **SÍ, si hay retención > 0** | ❌ nunca | ✅ sí |
| **`form:documentosPagadosDT`** | ✅ existe (15 col.) | 🔴 **NO EXISTE** (`getElementById` → `null`) | ✅ existe (15 col.) |
| **Tabla de pagos** | ✅ con filas | ✅ con filas | 🔴 **`No se encontraron registros.`** |
| **`.ui-datatable` en la página** | **2** | **1** | **2** |

🔴 **CORRECCIÓN al mapa de `web-selectors/cobros.md`.** La tabla vigente atribuye `Retención IVA`/`Retención ISLR`
**solo** a `co_type=2`. **Falso:** el cobro **32994 es `co_type=0` y las trae** (5,00 / 3,00).
⇒ **La regla correcta no es por `co_type`, es por DATO:** *las líneas de retención se renderizan cuando
`nu_amount_retention_iva`/`_islr` > 0, sea cual sea el tipo* — coherente con la nota ya existente
(*«cualquier tipo con IVA o ISLR en 0 NO renderiza esa etiqueta»*), que ahora queda como **la única regla**.
Contraprueba en la misma tanda: **32995**, también `co_type=0`, **sin retención**, **no** las renderiza.

🔑 **Oráculo robusto de tipo (barato, 1 sola lectura, sin BD):**
```js
const tieneDocs   = !!document.getElementById('form:documentosPagadosDT');
const tienePagos  = !/No se encontraron registros/.test(tablaPagos.innerText);
// (docs && pagos) → co_type 0   ·   (!docs && pagos) → co_type 1   ·   (docs && !pagos) → co_type 2
```

### 4.2 · 🔑🔑 **La tabla de PAGOS cambia de COLUMNAS según el método** — patrón NUEVO, no documentado

Anclarla por `['Forma de pago','Monto cobrado']` (como manda la doc) **sigue funcionando**, pero **el índice de
cada columna se corre** y un lector posicional lee la celda equivocada.

| Método | Nº col. | Columnas |
|---|---|---|
| `ef` (efectivo) · `de` (depósito) | **8** | `N°` · `Forma de pago` · `Banco receptor` · `Numero de Cuenta` · `Fecha valor` · `Nro Documento` · `Fecha documento` · `Monto cobrado` |
| **`pm` (pago móvil)** | **11** | `N°` · `Forma de pago` · `Banco receptor` · `Numero de Cuenta` · **`Banco Emisor`** · **`Tipo Documento`** · **`Nº teléfono`** · `Fecha valor` · **`Referencia`** · `Fecha documento` · `Monto cobrado` |

⚠ En `pm` **`Nro Documento` desaparece y su dato pasa a `Referencia`** (`062290168769`) ⇒ un cotejo que busque
`Nro Documento` contra `nu_payment_doc` **da un falso `WEB-MISSING`** en todo pago móvil.
⇒ **Regla: mapear las celdas por el TEXTO de su `th`, nunca por índice.**

### 4.3 · Anclajes reconfirmados en este build

| Elemento | ID medido hoy | Nota |
|---|---|---|
| Lista de cobros | `form:cobrosDT` | semántico, estable |
| Documentos pagados | **`form:documentosPagadosDT`** | ✅ semántico, **15 columnas** (3.ª confirmación) |
| Formas de pago (detalle cobro) | **`form:j_idt177`** | ❌ auto-generado — **estable en `177` en las 6 aperturas de hoy** (no volvió a oscilar a `178`) |
| Tabla hija de depósito | **`form:j_idt163`** | ❌ auto-generado — **reconfirmado en `163`**; anclar por `['N° Ref cobro','Monto cobrado']` |
| Lista de depósitos | `form:pedidosDT` | ⚠ id compartido por 5 módulos ⇒ verificar `location.pathname` primero |
| Panel de filtros de cobros | `form:j_idt116:*` | ❌ nunca anclarlo; **los sufijos funcionaron al 100 %** |
| Firma del detalle | **`form:graImaPro`** | `naturalWidth > 0` es el oráculo (el `innerText` no ve imágenes) |
| Galería de adjuntos | **`form:galeriaDLG:{n}:j_idt377`** | 🔑 **`{n}` es el índice de la imagen** ⇒ `document.querySelectorAll('[id^="form:galeriaDLG:"]').length` **cuenta las imágenes sin abrir el visor** — 1/2/2/2, exacto contra `transaction_image` |

### 4.4 · Rutas de adjuntos y receta de verificación **sin descargar**

```
imágenes :  {base}/denario/resources/images/cobros/{id_collection}_{n}.jpeg
firma    :  {base}/denario/resources/images/firmas/cobros/{id_collection}_0.jpg
archivos :  {base}/denario/resources/files/cobros/{id_collection}_0.pdf
```
🔴 **La extensión NO es deducible del tipo:** la firma es **`.jpg`** y la foto **`.jpeg`** dentro del mismo cobro.
**Leerla de `transaction_image.na_image` / `transaction_signatures.na_image` / `transaction_files.na_file`.**
Verificar con `fetch(url)` **dentro de la página** (mismo origen, hereda la sesión) y quedarse con
`status` + `content-type` + `content-length`. **Nunca `Descargar adjuntos`.**

### 4.5 · Catálogos leídos del propio `<select>` (no reusar los de otra playa)

- **`:idDep` (Depositado)** — 3 opciones: `""|Depositado` · **`1|SI`** · **`2|NO`**.
- **`:attachStatus` de cobros** — el placeholder es **`Tiene Adjunto` con `value = 0`**, igual que en
  clientes potenciales. ⚠ **Corrige `_comunes.md`**, que agrupa cobros en el juego *«`SI`/`NO` sin placeholder»*:
  un `setCombo(…, 'Tiene Adjunto')` **cree que filtró y no filtró nada**.
- **`:idEnterprise` de depósitos y cobros** — `value = 1` (`id_enterprise`), **una sola opción**. Anclar por TEXTO.
- **`:orderStatus`** — 6 opciones; el placeholder es **`0|Status`** (no `""`).
- La celda `Estatus del Cobro` de la lista trae el `<select>` completo concatenado
  (`AprobadoPendientePor aprobarRechazado` + valor) ⇒ el valor real es **el sufijo**. ⛔ **No se tocó** (superficie de escritura).

### 4.6 · Notas de BD confirmadas / nuevas

- ✅ `collection_payment.co_operation` = **`NULL`** en las 3 filas nuevas ⇒ **`IS DISTINCT FROM 'D'`** obligatorio.
  `deposit.co_operation`, en cambio, trae **`'I'`** ⇒ **la nulabilidad se comprueba por tabla**, no se generaliza.
- 🆕 **`deposit` NO tiene `da_created` ni `nu_attachments`** (a diferencia de `collection`) ⇒ un `SELECT` genérico
  revienta con `column … does not exist`. Sus 20 columnas usan `da_update` como marca de llegada a la nube.
- 🆕 **`collection` NO tiene `co_user`** — solo `id_user`. **Filtrar siempre por `id_user`** (aquí, `470`).
- 🆕 **`collection_detail` guarda la retención POR DUPLICADO**: `nu_amount_retention`/`nu_amount_retention2`
  (numeric 4 dec.) **y** `nu_amount_retention_iva`/`nu_amount_retention_islr` (6 dec.). Coinciden en los 2 casos
  medidos. La web muestra 2 decimales.
- `deposit_collection_payment` — **0 filas** en todo el tenant, con 3 depósitos.

---

## 5. Ledger

**5 líneas** añadidas (**append**) a `_web-results.jsonl`: casos **C14 · C15 · C16 · C17 · C18**.
Verificado programáticamente: **152 líneas** finales, **0 JSON inválido**, las **147 previas intactas**
(la 147 sigue siendo `C13 / clientesPotenciales`) + 5 nuevas.
⚠ **La línea `C18` se reescribió una vez**, ya dentro de mis 5: nació como `SKIP / WEB-N-A` (*«el depósito no
llegó»*) y se reemplazó por `PASS / WEB-OK` cuando el registro apareció en el 5.º poll y se pudo cotejar.
**No se tocó ninguna de las 147 anteriores.**

---

## 6. Pendientes que deja esta tanda

1. 🔴 **Reportar B.3 a desarrollo** — el indicador `Monto total en US$` de `/pages/depositos` no lee
   `nu_amount_doc`. Discriminar entre `deposit_collection_payment` (vacía) y `nu_amount_doc_conversion` (0).
2. 🔴 **W-H1** — la cuenta del pago tipo Depósito (17/17 registros) nunca sale por pantalla en cobros.
3. 🟡 **W-H2** — `Banco` por código en depósitos; ahora con un registro del día que lo exhibe.
4. ✅ **CERRADO** — el depósito nuevo llegó (`# Ref 4`) y se cotejó: `WEB-OK`, `Σ hijos == Monto depositado`.
   📋 Queda una pregunta **para el lado móvil**: agrupó solo `32994` (123,17) y dejó fuera el efectivo del
   **anticipo `32996`** (5,00). Confirmar con desarrollo si un `co_type=1` es elegible para depósito.
5. 📋 **`deposit_collection_payment` vacía** sigue abierto: reproduce con el registro de hoy y el vínculo vive
   solo en `collection.id_deposit`.
6. 📋 Backfill de los ~20 adjuntos anteriores al fix del 17/08 — **fuera del alcance de esta tanda**, sin cambios.

---

*WEB — COBROS y DEPÓSITOS · run_vzla · La Tortuga · 2026-08-19 · read-only, 0 escrituras, 0 descargas.*
