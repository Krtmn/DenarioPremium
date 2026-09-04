# Ciclo REQ «Módulo Web (CRUD) para Gestión del Catálogo de Bancos» — IMPORTADORA 4K

| Parámetro | Valor |
|---|---|
| Fecha | 2026-09-04 |
| Cliente / empresa | IMPORTADORA 4K · `DIESE` / GRUPO 4K (`id_enterprise` 1) |
| Playa | CARIBE — `http://denariocaribe.ddns.net:8080/DenarioPremium` · WS `:8081/PremiumWS` |
| Vendedor móvil | `v.0002ZONACENTRAL` — ANGEL BETANCOURT (`id_user` 300) |
| Cliente de prueba | C.0010 EURO REPUESTOS FIOVAL, C.A. (`id_client` 11) |
| APK | `com.kiberno.denarioPremiumPro` · `versionName` 6.6.21.3 — **reinstalado hoy 15:06**; la versión NO distingue builds |
| VGs verificadas | `clientBankAccount=true` · `requiredCollectionAttachments=false` · `requiredComment=true` · `colletionPayment=true-true-true-true-false-true` |
| Baseline BD | `max(id_collection)` = **2615** · `bank` = **10 filas** al abrir la corrida |

---

## 🔴 0 · Léase primero: qué salió mal y qué datos se tocaron

**1. El bloqueante de la corrida: el servidor rechaza TODOS los cobros con HTTP 500.**

`POST http://denariocaribe.ddns.net:8081/PremiumWS/services/collectionservice/collection` → **500 `"Internal error"`**, en **5 de 5 intentos**, capturado desde el bridge nativo (`Capacitor.nativePromise` → `CapacitorHttp`; la app **no** usa XHR/fetch, por eso un hook convencional no ve nada).

| Endpoint | Resultado |
|---|---|
| `collectionservice/collection` (POST) | **500 × 5** |
| `syncservice/getsync` (GET) | 200 × 56 |
| `listfilespremium` | 200 × 2 |

Hay conectividad y la sincronización funciona; **lo que falla es el endpoint de cobros**. Se probó con **tres métodos distintos**, incluido un **cobro de control con solo EFECTIVO y sin ningún banco**: también 500. ⇒ **la falla NO tiene relación con el REQ de Bancos, ni con cuentas bancarias de cliente, ni con el método de pago.**

**⚠ Correlación con la reinstalación del APK — hay que decirlo con precisión.** Los últimos cobros que **sí** llegaron hoy son los Refs 2613, 2614 y 2615, con `da_collection` **11:12:55, 11:13:50 y 12:11:20 hora local** (los timestamps de la BD son `timestamp without time zone` y el driver los imprime +4 h; la hora local del equipo y del PC es la misma, UTC−4).

El **APK se reinstaló a las 15:06**, casi **3 horas después** del último envío exitoso. ⇒ **Ningún cobro se ha enviado con éxito sobre el build actual**: no existe en la nube ni un solo cobro posterior a las 15:06.

⇒ **No se puede afirmar que sea "una caída del servidor que empezó después".** Los dos escenarios siguen abiertos y desde el cliente no se distinguen:
> **(a)** el servidor se rompió en algún momento entre las 12:11 y las 15:26 — o
> **(b)** el APK nuevo envía algo que el WS no procesa y responde 500.
>
> Lo único **descartado con evidencia** es que dependa del REQ de Bancos: el cobro de control con solo Efectivo y sin ningún banco falla igual. **Quien tenga el log del servidor cierra esto en un minuto** — el 500 viene con un stacktrace del lado del WS.

⇒ **Las secciones C, D y E quedan BLOCKED para cobros nuevos.** No se marca PASS nada que no se haya podido medir.

**2. Quedaron 3 cobros en la cola de salida del dispositivo.** Se enviarán solos en cuanto el endpoint se recupere, y **recibirán Ref en ese momento**:

| `co_collection` | Comentario | Monto | Estado |
|---|---|---|---|
| `1788550014333.0` | QA REQ BANCOS C1 TRANSFER | 69.600,00 Bs | en `pending_transactions`, `st_delivery=2` |
| `1788550891314.0` | QA REQ BANCOS C-PM PAGO MOVIL | 108.750,00 Bs | ídem |
| `1788551323162.0` | QA CONTROL EFECTIVO SIN BANCO | 373.230,00 Bs | ídem |

Un cuarto cobro quedó **solo Guardado** (nunca se intentó enviar): `1788551508334.0` — «QA REQ BANCOS CHEQUE Y NUEVA CUENTA», 65.250,00 Bs, `st_delivery=3`.

`failed_transactions` = **0** durante toda la corrida — confirma el matiz ya graduado en `RUNTIME.md §10`: **esa tabla no capta los rechazos del servidor**, y un `BD-QUEUED` persistente es indistinguible de una pérdida si uno se queda mirando solo el dispositivo.

**3. Se crearon 2 bancos de prueba que quedan ACTIVOS** en el catálogo del cliente: `555` (QA BANCO 0904 EDITADO) y `556` (QA BANCO 0904 SEGUNDO). **Bajan al móvil de todos los vendedores en la próxima sincronización.** Se dejan activos a propósito para que QA pueda reproducir lo reportado; **conviene deshabilitarlos al cerrar**.

**4. Se disparó la siembra automática del catálogo venezolano.** Al operar el módulo Bancos, el trigger `trg_bank_seed_ve` insertó **22 bancos** (`id_bank` 11–32) en una sola sentencia. La tabla `bank` pasó de **10 → 32 → 34** filas. **No es daño** (es el comportamiento documentado en `req-validados-qa/req-crud-bancos_20260902/Trigger_BANK_CSV.md`), pero **cambia el catálogo que baja a todos los equipos**: el selector de Banco Emisor pasó de 9 a 32 bancos. Se verificó y se reporta en §A.bis.

---

## 1 · Resumen del veredicto

| Sección | Alcance | Resultado |
|---|---|---|
| **A · CRUD web + cotejo BD** | listar · validación · crear · editar · desactivar · reactivar | ✅ **6/6 PASS**, cotejados uno a uno en BD |
| **A.bis · Trigger de siembra** | precedencia, no-duplicación, no-pisado, 2.º INSERT | ✅ **5/5 conforme** al documento |
| **B · Catálogo alimentando los 3 métodos** | fuente · presentación · filtro por moneda | ✅ **medido y completo** |
| **C1 · Transferencia con cuenta existente** | móvil ✅ · nube ⛔ · web ⛔ | ⛔ **BLOCKED** — 500 del servidor |
| **C2 · Transferencia/Cheque «Nueva Cuenta»** | móvil ✅ + capa local ✅ · nube ⛔ · web ⛔ | ⛔ **BLOCKED parcial** — mecanismo documentado en la capa local |
| **D · Las 3 capas** | sobre cobros nuevos | ⛔ **BLOCKED** · cubierto con 2 cobros de referencia (2612, 2614) |
| **E · Anticipo** | envío nuevo ⛔ · verificado en 2614 (anticipo del mismo APK) | ⚠ **parcial** |
| **F · No-regresión «Nueva Cuenta» en Cheque y Pago Móvil** | | ✅ **PASS** |
| **Defecto 02/09 (columna duplicada)** | | ✅ **CORREGIDO** — con 1 punto abierto |

### Hallazgos

| # | Hallazgo | Severidad | Capa |
|---|---|---|---|
| **H1** | `collectionservice/collection` responde **500 a todo cobro** (5/5, incluido uno sin banco). **Ningún cobro llegó a la nube desde que se reinstaló el APK a las 15:06.** Servidor o payload del build nuevo: no se distingue desde el cliente | 🔴 **Bloqueante** | Servidor y/o envío |
| **H2** | La columna **«Cuenta» se sigue dibujando** en Pago Móvil y Cheque —métodos sin cuenta— y además **está siempre vacía en toda la base** | Media | Web |
| **H3** | En **Cheque**, el banco elegido como *Banco Emisor* se muestra en la web bajo **«Banco receptor»**, y «Banco Emisor» sale vacía | Media | Web + envío |
| **H4** | El APK de hoy **dejó de escribir** `nu_collection_payment` en Pago Móvil (antes lo llenaba) — es el campo que alimenta la única «Banco Emisor» que quedó | 🟠 Alta (riesgo de regresión) | Móvil |

---

## A · CRUD en la web (Datos Maestros → Bancos)

Pantalla `/pages/bancos`. Columnas: **Código · Nombre · Estado · Detalle · Editar · Habilitar/Deshabilitar**.

| # | Caso | Qué se hizo | Observado en la web | Cotejo en BD | Resultado |
|---|---|---|---|---|---|
| A1 | **Listar** | Abrir el módulo | **32 filas**; QA BANCO INACTIVO sale «Deshabilitado» | `bank` = 32 (tras la siembra); `co_bank='666'` → `co_operation='D'` | ✅ PASS |
| A2 | **Validación campo obligatorio** | Guardar con Código y Nombre en blanco | **«Campo obligatorio.»** en **ambos** campos; el diálogo NO cierra y no guarda | `count(*)` sin cambio | ✅ PASS |
| A3 | **Crear** | Código `555`, Nombre `QA BANCO 0904` | Aparece «Habilitado»; lista 32 → 33 | `id_bank=33` · `co_bank='555'` · `co_operation='I'` · `co_enterprise='DIESE'` · `id_enterprise=1` | ✅ PASS |
| A4 | **Editar — ¿el código queda bloqueado?** | Abrir Editar sobre `555` | **SÍ**: `#coBanco` llega con `disabled=true`, `aria-disabled="true"` y clase `ui-state-disabled`. Solo el Nombre es editable | Renombrado a `QA BANCO 0904 EDITADO` → `co_operation` **I → U**, mismo `id_bank=33`, total **sin duplicar** (33) | ✅ PASS |
| A5 | **Desactivar** | Botón Deshabilitar | Diálogo **«¿Deshabilitar este banco en todas las empresas?»** con botones **No / Si** | Tras confirmar: `co_operation='D'`, **el registro se conserva**, total sigue en 33 (borrado lógico) | ✅ PASS |
| A6 | **Reactivar** | Botón Habilitar | Vuelve a «Habilitado». **No pide confirmación** (asimétrico respecto de Deshabilitar) | `co_operation` **D → U** | ✅ PASS |

> **Medición nueva respecto del 02/09:** aquel informe afirmaba que el código quedaba bloqueado al editar pero no lo respaldaba con evidencia a nivel de campo. Aquí se midió el atributo `disabled` del input — queda confirmado.

**Propagación al móvil (tras Sincronizar):** tabla local `banks` = **32** filas = 33 en la nube − 1 deshabilitado.

| Verificación | Resultado |
|---|---|
| El banco creado llega al móvil | ✅ `id_bank=33` / `co_bank='555'` presente |
| Llega **con el nombre ya editado** | ✅ `QA BANCO 0904 EDITADO` |
| El banco deshabilitado **no** llega | ✅ `666` ausente |
| La tabla local no tiene columna de operación | ✅ `banks(id_bank, na_bank, co_bank, co_enterprise, id_enterprise)` — un banco deshabilitado **desaparece** del equipo, no baja marcado (reconfirma el 02/09) |

📎 `img/A1-web-listado-bancos.png` · `A2-web-validacion-campo-obligatorio.png` · `A3-web-banco-creado-555.png` · `A4-web-editar-codigo-bloqueado.png` · `A5-web-confirmacion-todas-empresas.png` · `A6-web-banco-deshabilitado.png`

---

## A.bis · Siembra automática del catálogo venezolano (`trg_bank_seed_ve`)

Caso que el 02/09 **no se pudo probar**: la siembra **en vivo**. Al operar el módulo, el trigger insertó **22 filas** (`id_bank` 11–32), todas con **el mismo `da_update` al milisegundo** (valor guardado `2026-09-04 19:17:19.027`) ⇒ una sola sentencia.

El catálogo `bank_catalog_ve` tiene **25** filas; entraron **22**. Las **3 que no entraron** se explican exactamente por las reglas de precedencia del documento:

| Fila del CSV | Por qué no entró | Regla aplicada |
|---|---|---|
| `0108 BBVA PROVINCIAL` | ya existía `108 / PROVINCIAL` (código normalizado `108`→`0108`) | **Mismo código** → no inserta ni pisa; queda el nombre de `bank` |
| `0134 BANESCO` | ya existía `134 / BANESCO CUENTA VERDE` | **Mismo código**; además subcadena de nombre |
| `0172 BANCAMIGA BANCO UNIVERSAL, C.A.` | ya existía `101 / BANCAMIGAA`. El código **no** choca (0172 ≠ 0101) | **Nombre**: normalizado (quita `C.A.` y el sufijo `BANCO UNIVERSAL`) queda `BANCAMIGA`, subcadena de `BANCAMIGAA` (9 ≥ 6 caracteres) |

| Verificación del documento | Resultado |
|---|---|
| Sin duplicados **por código** | ✅ `GROUP BY co_bank HAVING count(*)>1` → **0 filas** |
| Sin duplicados **por nombre** | ✅ `GROUP BY na_bank HAVING count(*)>1` → **0 filas** |
| **No pisa** lo que ya estaba (nunca hay `UPDATE`) | ✅ ZELLE, BINANCE, BANESCO PANAMA, PROVINCIAL y BANCAMIGAA **conservan su `da_update` original** (28/07, 29/07, 15/08, 03/09) — todos anteriores a la siembra |
| Sembrados con `co_operation='I'` | ✅ 22/22 |
| **Segundo INSERT no vuelve a sembrar** | ✅ Se creó el banco `556`: total 33 → **34** (solo la fila nueva, **0 extra**) |
| Los sembrados **llegan al móvil** | ✅ 22/22 presentes en la tabla local `banks` y visibles en el selector de Banco Emisor |

### Observación · desfase de 4 horas en `da_update`

| Origen de la escritura | Valor **guardado** en `da_update` | Hora local real en ese momento | ¿Qué reloj escribió? |
|---|---|---|---|
| Los 22 sembrados (trigger) | `19:17:19` | ~15:17 | **UTC** |
| Banco `555` (alta desde la web) | `15:23:31` | ~15:23 | **local (VET)** |

*(El lector de BD imprime estos valores +4 h — `23:17:19` y `19:23:31` — porque la columna es `timestamp without time zone` y el proceso corre en UTC−4. La tabla muestra el valor realmente almacenado.)*

Medido en el servidor: `current_setting('TimeZone')` = **UTC**.

⇒ La columna **recibe dos relojes distintos**: el trigger escribe el **reloj UTC** y la web el **reloj local de Venezuela** (UTC−4). Son **4 horas de diferencia dentro de la misma columna**, según quién escriba.

**Se reporta como observación, no como defecto:** el móvil sincroniza por `da_update`, pero **los 22 bancos con la fecha adelantada bajaron correctamente al equipo** y aparecen en los selectores. No se detectó ningún banco que no llegara por esta causa. Queda anotado porque una fecha adelantada 4 h sí podría alterar el orden de sincronización en otros escenarios.

---

## B · El catálogo alimentando los tres métodos

Matriz medida sobre un cobro **en Bs** del cliente C.0010, que tiene **3 cuentas de prueba: 2 en USD y 1 en Bs**.

| Método | Qué trae el selector | Fuente | Cómo muestra cada opción | ¿«Nueva Cuenta»? | ¿Filtra por la moneda del cobro? |
|---|---|---|---|---|---|
| **Pago Móvil** | **32 bancos** del catálogo | tabla local `banks` (= `bank` activos) | **solo el nombre** — `BANESCO PANAMA` | ✅ Sí | ❌ **No** — el catálogo `bank` no tiene moneda |
| **Cheque** | **32 bancos** del catálogo | tabla local `banks` | **solo el nombre** | ✅ Sí | ❌ **No** — ídem |
| **Transferencia** | **3 cuentas del cliente** | `client_bank_account` | **banco + nº de cuenta** — `BANESCO PANAMA - 01020304050607080910` | ✅ Sí | ❌ **No** — ver abajo |
| *(contraste)* **Banco Receptor** — lo tienen Transferencia y Pago Móvil | **3 de 7** cuentas de la empresa | `bank_account` | **banco + nº de cuenta** | ❌ No | ✅ **Sí** |

### El dato que responde la pregunta del filtro por moneda

La prueba está en el **contraste dentro de la misma pantalla**, con el cobro en **Bs**:

- **Banco Emisor (Transferencia)** listó **las 3** cuentas del cliente: `BANESCO PANAMA` (USD), `PROVINCIAL` (Bs) y `BANESCO CUENTA VERDE` (USD). ⇒ **mezcla monedas: no filtra.**
- **Banco Receptor**, en esa misma pantalla, listó **solo 3 de las 7** cuentas activas de la empresa: `PROVINCIAL`, `BANESCO EN BOLIVARES` y `BANCAMIGAA` — que son **exactamente las 3 que tienen `co_currency='Bs'`**. ⇒ **sí filtra por la moneda del cobro.** Medido dos veces, en dos cobros distintos.

⇒ **El filtro por moneda existe en el producto y está aplicado al Banco Receptor, pero NO al Banco Emisor.** No es que la funcionalidad no exista: es que no alcanza a las cuentas del cliente.

### Otros comportamientos medidos

- El modal «Seleccione método de cobro…» usa casillas que **se comportan como selección única** (marcar una desmarca la anterior) ⇒ **un método por cada AGREGAR**.
- El picker (`#bankPickerModal`) trae **buscador**: escribir `QA BANCO` filtró correctamente a `QA BANCO 0904 EDITADO`.
- **Cadena completa verificada:** el banco creado en la web (`555`), renombrado y sincronizado, **aparece y es seleccionable** en el selector de Banco Emisor del móvil.
- Campos por método: **Cheque** → Banco Emisor · Fecha · Fecha valor · Nro. Cheque · Monto (**sin Banco Receptor**). **Pago Móvil** → Nº Teléfono · Tipo de documento · Banco Emisor · Banco Receptor · Nº referencia · Monto · Fecha. **Transferencia** → Banco Emisor · Banco Receptor · Nro. Referencia · Monto · Fecha.

📎 `img/B1-movil-picker-transferencia-3cuentas.png` · `B2-movil-picker-pagomovil-catalogo.png` · `B3-movil-picker-cheque-catalogo-nuevacuenta.png`

---

## C · D · E — Cobros: las tres capas

> ⚠ **Ninguno de los 4 cobros armados hoy llegó a la nube**: el endpoint devuelve 500 (H1). Van igual en la tabla, con veredicto **BLOCKED** y el motivo, porque dicen qué quedó sin cubrir.
> Para no dejar las tres capas vacías se añaden **dos cobros de referencia** (2612 y 2614) que **sí** están en las tres capas. **Ambos son ANTERIORES al APK de hoy** (2612 del 03/09; 2614 de hoy a las **11:13 hora local**, y el APK se reinstaló a las 15:06). Sirven para medir el **render de la web** —que es de hoy y no depende del APK— y para H3, que reproduce en los dos. **No** se usan como evidencia del comportamiento del APK nuevo.

| Nro Ref | Tipo | Método | Banco Emisor elegido (móvil) | Nube: `nu_collection_payment` / `co_` / `nu_` / `na_client_bank_account` | Web: qué columnas salen y con qué valor | Veredicto |
|---|---|---|---|---|---|---|
| **sin asignar** (`1788550014333.0`) | Cobro | **Transferencia · cuenta existente** | `BANESCO PANAMA - 01020304050607080910` (**QA-CTA-001**) · Receptor `PROVINCIAL - 01080087100100179088` · Ref `QA-C1-TR-001` · 69.600,00 Bs · Diferencia 0,00 | **No llegó (500).** En la **capa local** del equipo: `nu_collection_payment`=`""` · `co_client_bank_account`=`"232"` · `nu_client_bank_account`=`"01020304050607080910"` · `na_…` **no existe en la tabla local** | **No verificable** — el cobro no llegó a la web | ⛔ **BLOCKED** · HTTP 500 del servidor |
| **sin asignar** (`1788550891314.0`) | Cobro | **Pago Móvil** | `QA BANCO 0904 EDITADO` (el banco creado hoy) · Receptor `PROVINCIAL` · Tel `4141234` · Doc `12345678` · Ref `90400001` · 108.750,00 Bs · Diferencia 0,00 | **No llegó (500).** Capa local: `nu_collection_payment`=**`""` (vacío)** · `co_client_bank_account`=`"555"` · `nu_client_bank_account`=`"QA BANCO 0904 EDITADO"` | **No verificable** | ⛔ **BLOCKED** · HTTP 500 |
| **sin asignar** (`1788551508334.0`) | Cobro | **Cheque · «Nueva Cuenta»** | `Nueva Cuenta` + texto escrito a mano: `BANCO QA NUEVA CTA 999888777` · Nro. Cheque `CHQ-0904-77` · 65.250,00 Bs · Diferencia 0,00 | **Solo Guardado, no se intentó enviar.** Capa local: `na_bank`=`"Nueva Cuenta"` · `co_client_bank_account`=`"Nueva Cuenta"` · `nu_client_bank_account`=`"BANCO QA NUEVA CTA 999888777"` · `nu_collection_payment`=`""` | **No verificable** | ⛔ **BLOCKED** · endpoint caído |
| **sin asignar** (`1788551323162.0`) | Cobro | **Efectivo** *(control, sin banco)* | — (ninguno) | **No llegó (500).** Capa local: todos los campos de banco vacíos ✅ | **No verificable** | ⛔ **BLOCKED** · **prueba de que el 500 no es del REQ** |
| **2612** | Cobro | **Transferencia + Cheque + Pago Móvil** | Los 3 en el mismo cobro (creado 03/09) | `tr`: `nu_collection_payment`=`""`, `co_/nu_cba`=`""`, `na_bank`=`ZELLE`, `nu_bank_account`=`898111376149` · `ch`: `nu_collection_payment`=`""`, `co_cba`=`"QA NUEVO BANCO"`, `na_bank`=`QA NUEVO BANCO` · `pm`: `nu_collection_payment`=**`"QA NUEVO BANCO"`**, `co_cba`=`"777"`, `nu_cba`=`"QA NUEVO BANCO"`, `na_bank`=`BANESCO PANAMA` · **`na_client_bank_account`=`null` en las 3** | **13 columnas**, una sola «Banco Emisor». `tr`: Emisor **vacío**, Cuenta **vacía**, Receptor `ZELLE`, Nº Cuenta `898111376149` · `ch`: Emisor **vacío**, Cuenta **vacía**, **Receptor `QA NUEVO BANCO`** ⚠ · `pm`: **Emisor `QA NUEVO BANCO`** ✅, **Cuenta vacía**, Receptor `BANESCO PANAMA`, Nº Cuenta `201800391132` | ✅ 3 capas verificadas · ⚠ H2 y H3 |
| **2614** | **Anticipo** (`co_type=1`) | **Cheque** | `QA NUEVO BANCO` | `ch`: `na_bank`=`QA NUEVO BANCO` · `nu_collection_payment`=`""` · `co_cba`=`"QA NUEVO BANCO"` · `nu_cba`=`""` · `na_cba`=`null` | **11 columnas** (sin Tipo Documento ni Nº teléfono; «Nro Documento» en vez de «Referencia»). Emisor **vacío**, Cuenta **vacía**, **Receptor `QA NUEVO BANCO`** ⚠, 1.000,00 Bs → 1,15 USD. **Sin tabla de documentos** ✅ (correcto para anticipo) | ✅ 3 capas · ⚠ H3 reproduce |

### Notas por cobro

**Los cuatro cobros propios** quedaron correctamente armados en el móvil (Diferencia 0,00 en los cuatro, comentario obligatorio cargado, documento seleccionado) y **fallaron solo en el POST**. La capa móvil de cada uno está medida y con captura; las capas nube y web son las que no existen.

**2612 — oráculos de cálculo, todos ✅:**
- Σ pagos = 10,00 + 50,00 + 12,00 = **72,00 USD** == Total por cobrar **72,00 USD**
- Diferencia cobro = 72,00 − 72,00 = **0,00** ✅
- Monto conv. = 72,00 × 870 = **62.640,00 Bs** ✅
- Documentos: FAC 00020173 (51,00) + FAC 00020157 (21,00) = **72,00** == Σ pagos ✅
- **Monto doc. conversión: 44.370,00 = 51 × 870 ✅ y 18.270,00 = 21 × 870 ✅ — convertido correctamente**
- Cliente `C.0010` / Vendedor ANGEL BETANCOURT / Empresa GRUPO 4K / Comentario `gv` / Fecha 03/09/2026 16:32:34 — todo presente y correcto.

**2614 (anticipo) — oráculos ✅:** 1.000,00 Bs ÷ 870 = **1,1494 → 1,15 USD** ✅ · Diferencia 0,00 ✅ · comentario `g` ✅ · sin documentos, que es lo correcto para `co_type=1`.

> La columna **«Monto cobrado»** del listado muestra varios importes cuando hay varios métodos (en 2612: `50,00 USD 12,00 USD 10,00 USD`). Es el **desglose por método**, comportamiento por diseño — **no se reporta como defecto**.

📎 `img/C1-movil-transferencia-cuenta-existente.png` · `C-PM-movil-pagomovil-lleno.png` · `C2-movil-nueva-cuenta-cheque.png` · `D1-web-2612-tipos-de-pago-13-columnas.png` · `E1-web-2614-anticipo-cheque.png`

---

## 4 · El caso «Nueva Cuenta»

**Cómo funciona en el móvil:** «Nueva Cuenta» es la **primera opción** del selector de Banco Emisor, en los **tres** métodos. Al elegirla aparece **un campo de texto libre** («Nueva cuenta», máx. 50 caracteres) justo debajo del selector, donde el vendedor escribe a mano.

**Qué guarda (medido en la capa local del dispositivo, cobro `1788551508334.0`):**

| Campo | Valor guardado |
|---|---|
| `na_bank` | `Nueva Cuenta` ← el **literal de la opción**, no lo escrito |
| `co_client_bank_account` | `Nueva Cuenta` ← ídem |
| `nu_client_bank_account` | `BANCO QA NUEVA CTA 999888777` ← **lo que escribió el usuario** |
| `nu_collection_payment` | `""` (vacío) |
| `id_bank` | `0` |

**Cómo se vería en el detalle web** — *inferencia, no observación*: por el mapeo campo→columna confirmado abajo, el texto escrito por el vendedor **no aparecería en ninguna columna**: «Banco Emisor» lee `nu_collection_payment` (vacío) y «Cuenta» lee `na_client_bank_account` (siempre `null`). El literal `Nueva Cuenta` saldría bajo **«Banco receptor»** (que lee `na_bank`). **No se pudo confirmar** porque el cobro no llegó a la web (H1).

---

## 5 · Veredicto sobre la columna «Cuenta» en Pago Móvil

### El mapeo campo → columna, confirmado hoy

Cotejando el cobro 2612 entre BD y web:

| Columna de la web | Campo que la alimenta | Evidencia |
|---|---|---|
| **Banco Emisor** | `nu_collection_payment` | 2612 `pm` tiene `"QA NUEVO BANCO"` en BD y la web muestra `QA NUEVO BANCO`; `tr` y `ch` lo tienen vacío y la web los muestra vacíos |
| **Cuenta** | `na_client_bank_account` | 2612 `pm` tiene `nu_client_bank_account="QA NUEVO BANCO"` pero la web muestra **vacío** ⇒ **ya no lee ese campo**; `na_client_bank_account` es `null` |
| **Banco receptor** | `na_bank` | — |
| **Numero de Cuenta** | `nu_bank_account` | — |

### ¿Se corrigió el defecto del 02/09? — **SÍ, en gran parte**

| Lo reportado el 02/09 | Estado hoy |
|---|---|
| «Banco Emisor» aparecía **DOS veces** (14 columnas) | ✅ **CORREGIDO** — aparece **una sola vez**; la tabla bajó a **13 columnas** |
| La primera «Banco Emisor» salía **vacía** | ✅ **CORREGIDO** — la única que queda trae el valor correcto |
| «Cuenta» mostraba **el nombre del banco** (`nu_client_bank_account`) | ✅ **CORREGIDO** — ya no muestra un dato equivocado |
| **La columna «Cuenta» no debería dibujarse en Pago Móvil** | ❌ **SIGUE ABIERTO** |

### El punto que sigue abierto (H2)

La columna **«Cuenta» se sigue dibujando** en los bloques de **Pago Móvil** y de **Cheque** — métodos que, por diseño, **no tienen cuenta asociada**. Ya no muestra un dato equivocado, pero **ocupa una columna que siempre está vacía**.

Y hay un agravante medible: **`na_client_bank_account` es `null` en las 2.518 filas de `collection_payment` de toda la base**, y la tabla local del móvil **ni siquiera tiene esa columna** ⇒ el móvil **nunca** la envía. Por lo tanto **«Cuenta» sale vacía para todos los métodos, incluida Transferencia**, que es justamente el único caso donde sí existe un número de cuenta real — y que el móvil sí manda, pero en `nu_client_bank_account`, que la web ya no lee.

⇒ **Recomendación:** que «Cuenta» **no se dibuje** en Pago Móvil ni en Cheque, y que en **Transferencia** lea `nu_client_bank_account` (donde viaja el nº de cuenta de verdad) en lugar de `na_client_bank_account`.

### H3 · En Cheque, el Banco Emisor se muestra como «Banco receptor»

Reproduce en **2612** (03/09) y en **2614** (anticipo de hoy, mismo APK). En Cheque el móvil guarda el banco elegido en `na_bank` con `id_bank=0`; la web pinta `na_bank` en la columna **«Banco receptor»**. Resultado: el banco que el vendedor eligió como **emisor** del cheque aparece rotulado como **receptor**, y la columna «Banco Emisor» queda vacía. Un cheque no tiene banco receptor, así que la etiqueta es incorrecta en los dos sentidos.

### H4 · Riesgo de regresión en Pago Móvil — el APK dejó de llenar `nu_collection_payment`

Comparación **en la misma capa** (BD local del dispositivo), que es lo que hace válido el contraste:

| Cobro | Fecha | APK | `nu_collection_payment` (método `pm`) |
|---|---|---|---|
| 2607, 2608, 2611, 2612 | 03/09 | anterior | **`"QA NUEVO BANCO"`** — con valor, en los 4 |
| `1788550891314.0` | **04/09, post-reinstalación** | actual | **`""` — vacío** |

`nu_collection_payment` es **el campo que alimenta la única columna «Banco Emisor» que quedó tras el fix**. Si el APK actual ya no lo llena en Pago Móvil, **los cobros nuevos mostrarían «Banco Emisor» vacía** — es decir, el fix de la web quedaría sin dato que mostrar.

⚠ **Esto es una inferencia sólida, no una observación directa.** Está medido en la capa local del dispositivo y apoyado en el mapeo campo→columna confirmado arriba, **pero no se pudo ver el render web** porque el cobro no llegó (H1). **Es lo primero que hay que comprobar en cuanto el endpoint de cobros vuelva.** No se descarta que el servidor rellene ese campo al recibir el POST; desde el cliente no se puede saber.

---

## F · No-regresión de «Nueva Cuenta» en Cheque y Pago Móvil

Con `clientBankAccount=true` la opción **«Nueva Cuenta»** aparece también en Cheque y en Pago Móvil, donde antes no estaba.

| Verificación | Resultado |
|---|---|
| El selector sigue trayendo **el catálogo completo** (no lo reemplaza) | ✅ 32 bancos + «Nueva Cuenta» en ambos métodos |
| «Nueva Cuenta» va **primera**, sin desplazar ni ocultar bancos | ✅ |
| Elegir un **banco normal** sigue funcionando | ✅ `QA BANCO 0904 EDITADO` seleccionado y persistido en el formulario |
| Elegir «Nueva Cuenta» **no rompe** el resto del bloque | ✅ Fecha, Fecha valor, Nro. Cheque y Monto siguen operativos; Diferencia llegó a 0,00 |
| El buscador del picker sigue filtrando | ✅ |
| El cobro **se guarda** sin error con «Nueva Cuenta» | ✅ «El Cobro se ha guardado» |

⇒ **PASS.** No se detectó regresión en Cheque ni en Pago Móvil por la activación de la VG. *(Queda fuera de alcance el render web de ese cobro — H1.)*

---

## 6 · Lo no medible en esta corrida — BLOCKED con motivo

| Caso | Motivo |
|---|---|
| **C1** Transferencia con cuenta existente — capas nube y web | ⛔ HTTP 500 en `collectionservice/collection`. La capa móvil sí quedó medida y capturada |
| **C2** «Nueva Cuenta» — capas nube y web | ⛔ ídem. El mecanismo y lo que guarda están documentados desde la capa local |
| **D** Las 3 capas sobre cobros nuevos | ⛔ ídem. Cubierto parcialmente con 2612 y 2614 |
| **E** Anticipo **enviado en esta corrida** | ⛔ ídem. Se verificó el anticipo **2614** (de hoy 11:13, **anterior** al APK de las 15:06) en las 3 capas: sirve para el render web y para H3, **no** para validar el build actual |
| **H4** Confirmar en la web que «Banco Emisor» sale vacía en un Pago Móvil nuevo | ⛔ ídem. **Es la verificación pendiente más importante** |
| Replicación del alta **a todas las empresas** (el diálogo dice «en todas las empresas») | 🚫 N/A — 4K tiene **una sola empresa** (`DIESE`). Requiere un cliente multi-empresa |
| Filtro por moneda del **Banco Emisor** con un cobro en **USD** | ⚠ Se midió con cobro en **Bs**. El resultado (no filtra) es concluyente porque mostró cuentas de ambas monedas; con un cobro USD solo se confirmaría lo mismo |
| `nu_amount_doc_conversion` sin convertir (incidencia del 02/09) | ⚠ **No se puede cerrar aquí.** Ver abajo |

### Sobre `nu_amount_doc_conversion`

En **esta** base (CARIBE) el defecto aparece en **1 de 7** renglones en divisa: `id_collection` **2605** (03/09) tiene `nu_amount_doc_conversion = 303,00` igual al monto en divisa, mientras `nu_balance_doc_conversion = 263.610,00` sí está convertido. Los demás —incluidos **2606 y 2612 del mismo día**— están **correctamente convertidos** (2612: 51 × 870 = 44.370,00 ✅).

⚠ **Aclaración importante:** los cobros citados en la incidencia del 02/09 (2664, 2667, 2671, 2676, 2679, 2680) **no existen en esta base**. Aquella corrida fue sobre **Isla Coche**; ésta es **CARIBE**, y aquí `max(id_collection)` es 2615. **No es la misma base de datos**, así que no hay comparación fila a fila posible. Con lo que hay aquí: **no reproduce de forma sistemática**, y **no se pudo probar sobre un registro nuevo** por H1. Se deja como **observación**, no como defecto confirmado ni como corregido.

---

## 7 · Registros y datos creados en el sistema

| Objeto | Identificador | Estado en que queda |
|---|---|---|
| Banco de prueba | `555` — QA BANCO 0904 EDITADO (`id_bank` 33) | **Habilitado** — se sugiere deshabilitar al cerrar |
| Banco de prueba | `556` — QA BANCO 0904 SEGUNDO (`id_bank` 34) | **Habilitado** — ídem |
| Bancos sembrados por el trigger | `id_bank` 11–32 (22 bancos VE) | Habilitados — **no tocar**: es el catálogo estándar |
| Cobro Transferencia | `1788550014333.0` | 🕓 **En cola** — se enviará solo al recuperarse el WS |
| Cobro Pago Móvil | `1788550891314.0` | 🕓 **En cola** |
| Cobro Efectivo (control) | `1788551323162.0` | 🕓 **En cola** |
| Cobro Cheque + Nueva Cuenta | `1788551508334.0` | 💾 **Solo Guardado** |

**Nada se borró ni se modificó fuera de esto.** Todas las consultas a la nube fueron de solo lectura.

---

## 8 · Qué hay que hacer cuando el endpoint vuelva

1. **Verificar H4 primero.** El cobro `1788550891314.0` (Pago Móvil) se enviará solo. Abrir su Ref en la web y mirar la columna **«Banco Emisor»**: si sale **vacía**, H4 queda confirmado como regresión del APK.
2. Verificar el de Transferencia (`1788550014333.0`): si «Cuenta» sigue vacía teniendo una cuenta real, H2 queda confirmado también para Transferencia.
3. Enviar el de Cheque + Nueva Cuenta (quedó Guardado) y ver cómo se describe en el detalle.
4. Repetir el anticipo con envío propio para cerrar E.
5. Deshabilitar los bancos `555` y `556`.

---

## 9 · Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| 🔴 **La app postea por `CapacitorHttp`, no por XHR/fetch** | **universal** | Un hook sobre `XMLHttpRequest`/`fetch` **no captura nada** y da un falso "no hubo tráfico". Hay que envolver **`window.Capacitor.nativePromise`** y filtrar `plugin==='CapacitorHttp'`. Es lo único que dejó ver el **500** que explicaba tres cobros atascados |
| 🔴 **`ion-modal` con IDs DUPLICADOS** | universal | Conviven **3 `#eventModal`** en el DOM; `querySelector('#eventModal')` devuelve uno **oculto** y las lecturas dan vacío. Seleccionar siempre por **visibilidad**: `[...document.querySelectorAll('ion-modal')].find(m => !m.classList.contains('overlay-hidden') && m.getBoundingClientRect().height>0)` |
| **El modal de métodos de pago es de selección ÚNICA** | universal (cobros) | Las casillas se comportan como radios: marcar una desmarca la anterior ⇒ **un método por AGREGAR**, no se pueden marcar 3 de una vez |
| 🔴 **Datatable JSF: la tabla de cabecera está VACÍA** | universal (web) | En `/pages/cobros` hay una tabla de `<thead>` congelado con **0 filas** y otra con los datos. `[...document.querySelectorAll('table')].find(t=>t.querySelector('thead th'))` cae en la vacía y devuelve **0 filas** (trampa del "cero no es resultado"). Usar el **id real**: `#form\\:cobrosDT` |
| **Diálogo de Bancos: `#bancoM`, no `.ui-dialog` visible por `offsetParent`** | cliente/web | El alta/edición vive en `#bancoM`; `offsetParent!==null` lo descarta. Filtrar por `getComputedStyle(d).display!=='none'` |
| **`adb exec-out screencap -p > f.png` corrompe el PNG en PowerShell** | universal | La redirección de PS inserta BOM. Usar `adb shell screencap -p /sdcard/x.png` + `adb pull`, y en Git Bash **`MSYS_NO_PATHCONV=1`** o `/sdcard/...` se reescribe a ruta Windows |
| **Selector de cliente: `present()` + click en el `<p>`** | cliente | Confirmado otra vez; el `<p>` del nombre está a `y≈182` en la primera tarjeta |
| **El código del banco llega `disabled=true` al editar** | cliente/web | Oráculo barato para "¿el código queda bloqueado?": leer el atributo, no la apariencia |

---

*Corrida ejecutada conduciendo la UI por CDP (`:9220`) para el móvil y Playwright para la web, sin usar `automation/playwright/modules/*.js`. Credenciales web inyectadas por portapapeles y limpiadas al terminar; no aparecen en ningún argumento, log ni en este informe.*

> **Nota sobre las horas.** `da_collection`, `da_created` y `da_update` son `timestamp without time zone`; el lector de BD los imprime **+4 h** respecto del valor guardado (proceso en UTC−4). Todas las horas de este informe están expresadas en **hora local de Venezuela**, que es la del equipo y la del PC. De ahí se desprenden dos cosas que conviene no confundir:
> - **2614 (11:13) y 2615 (12:11) son ANTERIORES** al APK reinstalado a las 15:06 ⇒ no hay ningún cobro en la nube creado con el build actual.
> - Los 22 bancos sembrados llevan el **reloj UTC** y el banco creado desde la web el **reloj local**, dentro de la misma columna (§A.bis).
