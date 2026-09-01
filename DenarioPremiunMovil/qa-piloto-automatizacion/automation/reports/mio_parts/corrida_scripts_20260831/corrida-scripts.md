# Corrida por scripts deterministas — mio_parts

**Cliente:** MIO LUBRICANTES Y FILTROS, CA · empresa única `MIOP_ADM` / `id_enterprise=1`
**Fecha:** 2026-08-31 · **APK** 6.6.21.3 · **rama** main · **playa** El Yaque
**Perfil:** `automation/clientes/mio_parts.yaml`
**Ejecución:** `node automation/playwright/run.js mio_parts --modulo=<modulo>`

---

## 1. Resumen por módulo

| Módulo | PASS | FAIL | N/A | BLOCKED | Total | Run dir |
|---|---:|---:|---:|---:|---:|---|
| login | 6 | 0 | 3 | 0 | 9 | `playwright_mio_parts_20260831_182748` |
| productos | 8 | **1** | 1 | 0 | 10 | `..._182827` |
| vendedores | 3 | 0 | 0 | 0 | 3 | `..._182846` |
| clientes | 12 | 0 | 0 | 0 | 12 | `..._183603` (2.ª) |
| visitas | 15 | 0 | 0 | 0 | 15 | `..._183810` |
| inventarios | 14 | 0 | 2 | 0 | 16 | `..._184002` |
| devoluciones | 23 | **1** | 3 | 0 | 27 | `..._184643` (2.ª) |
| cobros | 16 | 0 | 5 | **13** | 34 | `..._190408` |
| depositos | 11 | 0 | 1 | 0 | 12 | `..._190942` (2.ª) |
| **TOTAL** | **108** | **2** | **15** | **13** | **138** | |

- **cobros** y la 2.ª de **depositos** se ejecutaron en la 2.ª tanda, ya autorizadas. Ver **§8**.
- **pedidos** — no implementado en el runner (da error por diseño).

Tres módulos se corrieron **dos veces**; en la tabla va la segunda corrida. El motivo de cada
repetición está en G-01, G-04 y §8 — no fue inestabilidad de la app.

> ⚠ Los **13 BLOCKED** de cobros **no son 13 fallos de la app**: son casos **sin construir**
> ("Fase 2"). Ver C-01.

---

## 2. Hallazgos agrupados POR CAUSA

Los 2 FAIL **no** son 2 defectos de producto: uno lo es y el otro es un guion que mide algo que
este cliente está configurado para no hacer.

### 🔴 PRODUCTO

#### P-01 · El mensaje de "sin resultados" de Productos se dibuja EN BLANCO
**Caso:** DM-PRD-007 (FAIL) · **Categoría: defecto de producto**

El veredicto del guion es ambiguo ("Lista no vacía **o** mensaje ausente"), así que lo reproduje
por CDP para separar las dos causas. Lo medido:

| Comprobación | Resultado |
|---|---|
| Buscar `ZZZZZZZ` | la lista queda en **0 ítems** → el filtrado **sí funciona** |
| Buscar `FILTRO` (contraste) | **16 ítems** → el filtrado no está roto |
| Nodo del mensaje vacío | **existe y es visible**: 360×24 px, `visibility:visible`, `opacity:1` |
| Contenido del nodo | `<p class="search-empty-state ion-text-center">  </p>` → **dos espacios** |

El usuario ve un hueco gris donde debería leer el aviso. No es que falte el elemento: se renderiza
con el texto vacío.

**No es un problema de datos:** el tag está cargado en la BD del cliente —
`application_tags.co_application_tag='DENARIO_SIN_RESULTADOS'` (id 788, módulo `DEN`) =
**"No hay productos disponibles"**.

**Contraste que lo confirma como específico:** en la misma corrida, DM-DEV-005 (selector de
clientes de Devoluciones) **sí** muestra `"No hay clientes disponibles"`. El patrón
`search-empty-state` funciona en otros módulos; falla en Productos.

**Pista para desarrollo** (solo lectura, no toqué nada):
`src/app/productos/product-list/product-list.component.html:4` → `{{ emptyResultsLabel() }}`
`src/app/productos/product-list/product-list.component.ts:260`:
```ts
return (
  this.productTags.get('DENARIO_SIN_RESULTADOS')
  ?? this.productService.getCatalogPresentationTag('DENARIO_SIN_RESULTADOS')
);
```
El tag vive en el módulo `DEN`, no en el set de tags de Productos. Además `??` solo cae al
fallback con `null`/`undefined`: si el `get` devuelve **cadena vacía**, el fallback nunca entra.
Ambas rutas terminan en blanco. **Sospecha, no diagnóstico cerrado** — lo verificado por QA es el
síntoma de la tabla.

---

### 🟠 GUION (el script no sabe operar/medir la app — no se reporta a desarrollo de producto)

#### G-01 · El cotejo contra la BD LOCAL estaba muerto y los casos daban PASS igual
**Categoría: problema del guion** · **afecta 5 módulos** · **RESUELTO en esta corrida**

En la 1.ª corrida de `clientes` la consola escupía `Cannot find module 'sql.js'` y aun así el
módulo cerraba **12/12 PASS**. Las notas delataban la degradación silenciosa:
`BD-LOCAL-NOT-FOUND` y `BD-LOCAL-PENDING(id=-1,st=?)` — es decir, el caso no comprobó nada y
se apuntó el PASS.

`automation/db/local-query.js` es el lector read-only del SQLite del teléfono y lo usan
**clientes, cobros, depositos, inventarios y visitas**. `sql.js` estaba **declarado** en
`automation/db/package.json` pero **nunca instalado**.

**Acción:** `npm install` en `automation/db/` (herramienta QA, no código de producto).
**Efecto comprobado:** al repetir `clientes`, las mismas notas pasaron a
`BD-SAVED(st=0)` y `BD-LOCAL-OK(id=135,st=2)`. Los PASS del tramo que escribe ya significan algo.

> Sin este arreglo, **todo el tramo de escritura de la corrida habría sido PASS no verificado**.

#### G-02 · DM-CLT-019 no puede fallar nunca (veredicto tautológico) + expectativa caduca
**Categoría: problema del guion**

`automation/playwright/modules/clientes.js:409`:
```js
botonesOk ? 'PASS' : (formInfo.guardarDisabled === null ? 'FAIL' : 'PASS')
```
Las dos ramas devuelven `PASS`; lo único que da FAIL es que el botón no exista. Por eso el caso
se llama *"formulario con botones disabled"* y reporta `disabled=false` … con un ✅.

Y la expectativa que le da nombre **ya no es la del producto**. En
`src/app/services/clientes/client-logic.service.ts` está documentado que los botones se habilitan
a propósito:
- l.676-679 — *"Guardar ON con cambios (dirty); el nombre se valida al pulsar"*
- l.691-692 — *"Enviar ON con General (empresa). Campos incompletos no apagan el botón (POT-SEND-001)"*

**Conclusión: NO hay defecto de producto aquí.** Hay que reescribir el caso contra la regla nueva
(y de paso DM-CLT-021, que comprueba que se habilitan botones ya habilitados: tampoco prueba nada).

#### G-03 · DM-DEV-VAL-001 es un FAIL FALSO — mide una validación que este cliente apaga
**Caso:** DM-DEV-VAL-001 (FAIL) · **Categoría: problema del guion** · **no reportar a producto**

El guion informa: *"🔴 NO bloqueó: se intentó devolver 3 de un máximo de 1"*. Suena a defecto
grave. No lo es **para este cliente**:

1. La VG en la BD dice literalmente qué apaga:
   `validateReturn=false` → *"¿Desean validar que el producto devuelto exista en una factura
   enviada? … NO: **No se valida el producto devuelto**"*.
   La app está **configurada para no validar**. Bloquear sería el comportamiento incorrecto.
2. **El "máximo de 1" se lo inventa el propio guion.** En
   `automation/playwright/modules/devoluciones.js:702-715` el tope se lee del atributo `max` del
   input o del texto *"entre 1 y N"*; si no hay ninguno — y con `validateReturn=false` no hay
   factura que lo ponga — cae al **literal `'1'`** (l.714). Luego pide `1+2=3` y lo compara contra
   su propio valor por defecto.
3. No existe tabla de detalle de factura **ni en la nube ni en el SQLite del dispositivo** contra
   la que pudiera haber un tope.
4. El histórico lo corrobora: hay devoluciones con `co_document` = `"VARIOS"` / `"VÁRIOS"` (texto
   libre). El campo nunca se validó contra facturas reales en este tenant.

**Veredicto correcto: N/A por `validateReturn=false`.** El caso necesita ramificar por esa VG,
igual que ya hacen DEV-008/009/010.

#### G-04 · Sin `factura_test` el envío de Devoluciones no se ejercitaba, y el motivo del N/A era falso
**Categoría: problema del guion + perfil incompleto** · **RESUELTO en esta corrida**

1.ª corrida: DM-DEV-018 salía N/A con el motivo *"perfil sin factura_test (cliente no exige nro.
de factura)"*. **El texto afirma lo contrario de la realidad**: `requeridedNroFactura=true`
(*"El campo será obligatorio"*) y el campo `inputDocument` existe en el DOM y el guion lo rellena
(`devoluciones.js:843-859`). El cliente **sí** exige el número de factura.

Consecuencia: **3 N/A en cascada de una sola causa** (DEV-018 envío, DEV-VAL-001, DEV-023 abrir
Enviado) y — lo importante — **la rama TIPO A de envío, que era el motivo de estrenar este
cliente, no se ejercitó**.

**Acción:** tomé el nro. real de `document_sale` (`co_client=J409074560` → `FACT3446`, 2026-08-19)
y lo anoté en el perfil, que ya lo listaba como pendiente de la 1.ª corrida:
```yaml
factura_test: "3446"     # FACT3446 · 2026-08-19
```
**Efecto:** DM-DEV-018 → **PASS con devolución realmente enviada** (`return` 182, ver §3),
DM-DEV-023 → PASS, y los N/A del módulo bajaron de 6 a 3.

#### G-05 · Etiqueta engañosa en DM-DEV-014 (cosmético)
El caso imprime *"máximo permitido por la factura: 1"* pero el valor que muestra es
`cantidadPedida` — **la cantidad tecleada**, no el máximo (`maximoReal` existe y no se imprime).
El veredicto en sí es sano: relee el campo del DOM y compara. Solo engaña el texto del informe.

---

### 🟡 DATOS (no hay con qué probar)

#### D-01 · Depósitos: 8 N/A de una sola causa — no hay cobros depositables
**Categoría: falta de datos**, correctamente marcada como N/A por el guion.

Los 8 N/A dicen todos *"sin cobros depositables"*: **es una causa, no ocho fallos.** El tramo de
lectura funcionó (tile, form, banco `BANCO MERCANTIL - *** 7177163`, fecha), pero la tab Cobros
llega vacía.

Verificado antes de aceptar el N/A (regla: *Depósitos aplica sii el cliente cobra en EFECTIVO*):
- `payment_method` tiene los 6 métodos; el vector `colletionPayment="true-false-true-true-false-true"`
  mapeado por orden alfabético (`ch,de,ef,ot,pm,tr`) deja **`ef` = Efectivo en `true`**.
  ⚠ Mapeo por orden = **hipótesis**, no medición: la regla obliga a comprobarlo en la UI y eso
  ocurre dentro de Cobros, que no se corrió.
  🔴 **Medido después en la UI (§8, C-03): "Efectivo activo" era correcto, pero el mapeo alfabético
  NO lo es** — los desactivados reales son Cheque y Otros. Mi deducción acertó por casualidad.
- El cobro más reciente en nube es del **2026-07-27** y **todos** están en `st_collection=3`.

**Depósitos no está roto: está esperando a Cobros.** Para cerrarlo hay que correr `cobros` (crear
un cobro en efectivo enviado) y acto seguido `depositos`.
✅ **Confirmado en §8:** con `collection` 209 en efectivo disponible, Depósitos pasó de
4 PASS / 8 N/A a **11 PASS / 1 N/A**. La causa apuntada era la correcta.

#### D-02 · Casos que pasan sin haber probado nada
- **DM-VIS-006** (papelera de visita Guardada) → PASS con nota *"sin visitas Guardadas previas"*.
- **DM-DEV-023** en la 1.ª corrida → N/A por no existir un Enviado (se resolvió solo al arreglar G-04).

DM-VIS-006 debería ser **N/A por falta de datos**, no PASS: hoy no distingue "la papelera funciona"
de "no había nada que borrar".

---

## 3. Cotejo en la nube (todo lo que escribió la corrida)

Baseline tomado **antes** de correr nada. Todo lo enviado se comprobó con `query.js` contra la BD
del cliente:

| Tabla | Baseline | Después | Registro creado | Comprobación |
|---|---:|---:|---|---|
| `potential_client` | 133 | **135** | `id_client` 134 y 135 | `na_client='Test-CLT-SMOKE-*'`, `co_enterprise=MIOP_ADM`, `id_enterprise=1`, `st_potential_client=1`, `coordenada` poblada |
| `visit` | 2732 | **2733** | `id_visit=2733` | `co_client=J409074560`, `st_visit=2`, `da_visit=2026-08-31T22:38`, empresa OK |
| `client_stock` | 142 | **143** | `id_client_stock=143` | `co_client=J409074560`, `st_client_stock=1`, `da=2026-08-31T22:40` |
| `return` | 181 | **182** | `id_return=182` | `co_client=J409074560`, `st_return=1`, `co_enterprise=MIOP_ADM` |
| `return_detail` | 26 | **27** | `co_detail=27` | `co_product=MIS0239`, `qu_product=1.0000`, **`co_document="3446"`** ← la factura del perfil llegó bien |
| `collection` | 208 | 208 | — | sin cambios (cobros no se ejecutó) |
| `deposit` | 8 | 8 | — | sin cambios (ver D-01) |

Se crearon **2** clientes potenciales porque `clientes` se repitió tras arreglar G-01; el segundo
(135) es el que está verificado de punta a punta. Ambos quedaron en el tenant de QA.

**Revisado y descartado como hallazgo:**
- `potential_client.coordenada_client` quedó **vacío** en nuestro registro mientras que los 11
  anteriores lo traen poblado. Parecía una regresión de 6.6.21.3. **No lo es:** ese campo lo llena
  una pantalla aparte (`client-location`, el 3.er botón del home de Clientes, ver
  `client-header.component.html:33-35` → `saveSendLocationFunction()`), y el guion nunca la abre.
  Es cobertura que falta, no un defecto → va a §5.
- `return_detail.nu_price` / `nu_amount` llegaron en `null`. **Tampoco es regresión:** están en
  `null` en **todos** los registros históricos del tenant.

---

## 4. Contraste con las Variables Globales

| VG | Efecto esperado | Lo observado | ¿Cuadra? |
|---|---|---|---|
| `validateReturn=false` | Devoluciones TIPO A: el cliente habilita tabs, sin paso de factura | DEV-008/009/010 N/A con ese motivo; el cliente habilitó las tabs | ✅ **1.ª vez ejercitada esta rama** |
| `requeridedNroFactura=true` | nro. de factura obligatorio **por producto** | campo `inputDocument` presente; `co_document='3446'` persistido | ✅ (tras G-04) |
| `expirationBatch=true` | el modal de inventario pide **Lote + Fecha** | DM-INV-011: `expirationBatch: true; lote: LOTE-QA-4952` | ✅ |
| `signatureVisit=false` | visitas **no** pide firma | DM-VIS-032: `firma(false): false` | ✅ |
| `signatureReturn=true` | devoluciones **sí** pide firma | DM-DEV-015: `firma: true` | ✅ |
| `enterpriseEnabled=true` | aparece campo Empresa | DM-CLT-021: *"idEmpresa: none (disabled — 1 empresa auto-asignada)"* | ✅ empresa única lo autoasigna |
| `userMustActivateGPS=true` | GPS obligatorio | `coordenada` poblada en cliente potencial y en la visita | ✅ |
| `multiInvoices=false` | una sola factura por devolución | no ejercitado (un solo producto) | ⚪ sin medir |
| `requiredCollectionAttachments=false` | cobros **enviables** sin adjunto | — | ⛔ vive en Cobros |
| `userCanSelectIGTF=false` | casos IGTF deben salir **N/A** | — | ⛔ **los N/A esperados NO se comprobaron** |
| `userCanCollectIva=false` | cobro 25% IVA debe salir **N/A** | — | ⛔ **ídem** |

**N/A que salieron por un motivo distinto al previsto** (revisados uno a uno):

- **DM-INV-017 / DM-INV-020** salen N/A por `suggestedOrderByDispatchAndReturn=false`, que **no es**
  el `suggestedOrder=true` del perfil. Fui a la BD: son **dos claves distintas** y la del N/A
  vale `false` de verdad (*"¿Desea que se tomen en cuenta las Devoluciones y Facturaciones para el
  pedido sugerido?"*). **El N/A es legítimo**, pero `suggestedOrderByDispatchAndReturn` **falta en
  el YAML** — conviene añadirla para que el motivo sea rastreable sin ir a la BD.
- **DM-DEV-018 / VAL-001 / 023** (1.ª corrida) salían N/A citando *"el cliente no exige nro. de
  factura"*, que **contradice** `requeridedNroFactura=true` → era G-04, ya corregido.
- **DM-LOG-008/009/017** N/A por alcance del perfil (2.º usuario, reinstalación), no por VG. OK.

---

## 5. Lo que NO se validó

| Área | Estado | Motivo |
|---|---|---|
| **Cobros** (módulo entero) | ✅ **ejecutado en la 2.ª tanda** | ya autorizado → **§8**. Quedan 13 casos BLOCKED por no estar construidos (C-01) |
| IGTF · IVA 25% | ✅ **contrastado** | N/A correctos por `userCanSelectIGTF=false` / `userCanCollectIva=false` (§8.1) |
| **Retenciones · prepago/anticipo USD · pago parcial · multimoneda de cobro** | ⛔ **sigue sin validarse** | casos BLOCKED "Fase 2" → detalle y motivo en **§8.4** |
| Métodos de pago reales de la UI | ✅ **medidos** | Efectivo · Depósito · Transferencia · Pago Móvil → **C-03** (el orden alfabético resultó falso) |
| **Depósitos**, tramo de escritura (8 casos) | ✅ **cerrado** | 7 de 8 pasaron a PASS al existir un cobro en efectivo (§8.2); queda 1 por falta de un 2.º cobro |
| **Pedidos** | ⛔ | no implementado en el runner |
| Pantalla **Ubicación de cliente** (`client-location`) | ⛔ | el guion no abre el 3.er botón de Clientes; por eso `coordenada_client` quedó vacío |
| Adjuntos reales (cámara / archivo) | ⛔ | solo se comprobó que los acordeones existen, no que se suba un archivo |
| `multiInvoices=false` | ⚪ | se devolvió un único producto, no se intentó una 2.ª factura |
| Login 2.º usuario · post-reinstalación | ⚪ | fuera del alcance del smoke |

---

## 6. Cambios que dejé hechos (ninguno en código de producto)

1. `automation/db/` → `npm install` (instala `sql.js`, ya declarado en su `package.json`).
   Sin esto, los cotejos contra la BD local no corren y los casos dan **PASS sin verificar**.
2. `automation/clientes/mio_parts.yaml` → añadido `factura_test: "3446"` en `devoluciones`, con
   nota de por qué (el perfil lo listaba como pendiente de la 1.ª corrida).

No se tocó `src/`, `android/` ni `www/`. Las lecturas de `src/` fueron solo para explicar causas.

---

## 7. Recomendaciones, por orden de valor

1. **Reportar a desarrollo P-01** (empty state en blanco en Productos). Es el único defecto de
   producto de la corrida y se ve en pantalla.
2. **Arreglar G-03 antes de la próxima corrida**: DM-DEV-VAL-001 debe ramificar por
   `validateReturn`. Tal cual está, todo cliente con `validateReturn=false` va a producir un FAIL
   rojo que no es un defecto — y ese ruido es el que hace que se dejen de mirar los FAIL.
3. **Arreglar G-02**: el ternario de `clientes.js:409` y la expectativa caduca de DM-CLT-019/021.
4. ~~**Correr `cobros` expresamente** y a continuación `depositos`~~ → **HECHO en la 2.ª tanda
   (§8)**: cerró 7 de los 8 N/A de Depósitos y midió los métodos de pago reales. Lo que queda
   pendiente ahí son Retenciones y el Anticipo en USD (§8.4).
5. Convertir **DM-VIS-006** en N/A cuando no hay Guardados previos (hoy es un PASS vacío).
6. Añadir `suggestedOrderByDispatchAndReturn: false` al YAML del cliente.
7. Considerar cobertura para la pantalla `client-location` (hoy `coordenada_client` nunca se llena
   desde los guiones).

---

# 8. Cobros y DepÃ³sitos (2.Âª tanda â€” autorizada)

Baseline previo: `collection` **208** Â· `deposit` **8**. Pre-vuelo OK (`mWakefulness=Awake`,
forward `:9220 â†’ webview_devtools_remote_22221` vivo).

| MÃ³dulo | PASS | FAIL | N/A | BLOCKED | Total |
|---|---:|---:|---:|---:|---:|
| cobros | 16 | 0 | 5 | **13** | 34 |
| depositos (2.Âª) | 11 | 0 | 1 | 0 | 12 |

---

## 8.1 Â· Hallazgos de Cobros

### ðŸŸ  C-01 Â· Los 13 BLOCKED son UNA causa: los casos no estÃ¡n construidos
**CategorÃ­a: problema del guion (cobertura), no defecto de producto**

Los 13 BLOCKED llevan todos el mismo motivo â€” *"Fase 2 â€” pendiente de construir/depurar en
device"* â€” y salen de un bloque que los marca en masa (`cobros.js:922-924`). **La app no fallÃ³ 13
veces: hay 13 casos sin escribir.** Leerlos como fallos serÃ­a el error de bulto de esta corrida.

Lo que queda sin cubrir por este motivo (lo importante no es el nÃºmero, es *quÃ©*):

| Sin construir | QuÃ© se deja de validar |
|---|---|
| DM-COB-019 | **Enviar un cobro** â€” ver C-02 |
| DM-COB-033/034/038/039 | **Retenciones** (`sizeRetention=14`) |
| DM-COB-041/042/046/047 | **Pago parcial / tolerancia0**, dejar-uno-fuera por mÃ©todo |
| DM-COB-014/015/028/029 | Multimoneda de cobro, ediciÃ³n de pagos |

### ðŸ”´ C-02 Â· El cliente que MÃS fÃ¡cil lo tiene para enviar es el Ãºnico donde no se prueba
**Caso:** DM-COB-019 (BLOCKED) Â· **CategorÃ­a: problema del guion** Â· **la mÃ¡s costosa de la tanda**

El motivo que imprime es *"ensureAdjunto/mock cÃ¡mara standalone pendiente"* â€” una precondiciÃ³n de
**adjunto**. Pero este cliente tiene **`requiredCollectionAttachments=false`** (verificado en
`global_configuration`): **no hace falta adjunto para enviar**.

La lÃ³gica (`cobros.js:800-812`):

```js
if (!guardadoOk)                        â†’ N/A
else if (DATA.requiredCollectionAttachments && DATA.mockCamaraFunciona === false) â†’ SKIP
else                                    â†’ BLOCKED 'Fase 2 â€” ensureAdjunto/mock cÃ¡mara pendiente'
```

Con `requiredCollectionAttachments=false` la 2.Âª rama **no entra**, y cae a un `else` que bloquea
**incondicionalmente** por un motivo de adjuntos que aquÃ­ no aplica. Efecto neto: **en el cliente
donde enviar es trivial, el envÃ­o nunca se intenta.**

**Consecuencia en cadena:** 0 cobros enviados â†’ `collection` se quedÃ³ en 208 â†’ DepÃ³sitos sin nada
que depositar (era exactamente D-01 de la 1.Âª tanda).

### âœ… C-02b Â· VerificaciÃ³n manual: el envÃ­o SÃ funciona sin adjunto

Como el guion no lo prueba, **conduje el flujo a mano por CDP** (respetando las trampas conocidas:
click real en Â«Agregar mÃ©todo de pagoÂ», modal de selecciÃ³n Ãºnica, alertas por
`.alert-title`/`.alert-message`, **un solo** click en `.imagenEnviar` sin apilar eventos):

| Paso | Resultado |
|---|---|
| Cliente + 4 documentos (moneda doc **US$**) | total **BS 2.677.302,32** |
| MÃ©todo **Efectivo** = total | Diferencia `-2.677.302,32` (rojo) â†’ **`0,00` (azul)** |
| Guardar | *"Denario Cobros Â· El Cobro se ha guardado"* |
| **Enviar SIN adjunto** | 2 alertas; la **Ãºltima**: *"Denario Premium Â· **Cobro nro. 209 enviado exitosamente**"* â† acuse del servidor |

**â‡’ `requiredCollectionAttachments=false` se comporta como especifica: el cobro se ENVÃA y no queda
Guardado.** No es hallazgo: es la VG cumpliÃ©ndose. El hallazgo es que **el guion no lo comprueba**.

### ðŸ”‘ C-03 Â· MÃ©todos de pago MEDIDOS en la UI â€” el orden alfabÃ©tico NO sirve
**CategorÃ­a: dato de configuraciÃ³n â€” corrige una deducciÃ³n mÃ­a de la 1.Âª tanda**

Lo que la UI ofrece de verdad en el modal (leÃ­do del `#eventModal`):

> **Efectivo Â· DepÃ³sito Â· Transferencia Â· Pago MÃ³vil**

Contraste con la deducciÃ³n alfabÃ©tica que yo mismo habÃ­a anotado como hipÃ³tesis en Â§2/D-01:

| | Cheque | DepÃ³sito | Efectivo | Otros | Pago MÃ³vil | Transferencia |
|---|---|---|---|---|---|---|
| Deducido por orden `ch,de,ef,ot,pm,tr` | âœ… | âŒ | âœ… | âœ… | âŒ | âœ… |
| **Medido en la UI** | **âŒ** | **âœ…** | âœ… | **âŒ** | **âœ…** | âœ… |

**Los dos desactivados reales son Cheque y Otros**, no DepÃ³sito y Pago MÃ³vil. Coinciden el nÃºmero
(4 activos) y el que me importaba (Efectivo), pero **el mapeo posicional es falso**: acertÃ©
"Efectivo activo" por casualidad. Queda confirmada la advertencia de no deducir por orden de
catÃ¡logo â€” **hay que medirlo en la UI, siempre**.

### N/A de Cobros contrastados contra las VG â€” todos correctos

| Caso | Motivo del N/A | VG en BD | Â¿Esperado? |
|---|---|---|---|
| DM-COB-036/044/045 | `userCanSelectIGTF=false` | `false` âœ” | âœ… sÃ­ |
| DM-COB-037 (IVA 25%) | `userCanCollectIva=false` | `false` âœ” | âœ… sÃ­ |
| DM-COB-006 (comentario oblig.) | `requiredComment=false` | `false` âœ” | âœ… sÃ­, pero **la VG no estÃ¡ en el YAML** (igual que `suggestedOrderByDispatchAndReturn`) |

**NingÃºn N/A saliÃ³ por un motivo distinto al esperado.** Los 3 de IGTF y el de IVA son exactamente
los que las VG anticipaban.

---

## 8.2 Â· DepÃ³sitos â€” la pregunta del coordinador, respondida

**SÃ­: dejÃ³ de estar en N/A, y por la causa que se habÃ­a apuntado.**

| | 1.Âª corrida (sin cobros) | 2.Âª corrida (con `collection` 209 en efectivo) |
|---|---:|---:|
| PASS | 4 | **11** |
| N/A | 8 | **1** |

Los 7 N/A que se cerraron lo hicieron **solos**, sin tocar el guion: lo Ãºnico que cambiÃ³ es que
existÃ­a un cobro en efectivo enviado. Confirma que D-01 era **falta de datos**, no un defecto.

**El N/A que queda** â€” DM-DEP-020 (papelera de un Guardado) â€” es *"sin segundo cobro depositable"*:
**la misma causa**, un solo cobro disponible. Se cerrarÃ­a con dos cobros en efectivo. LegÃ­timo.

---

## 8.3 Â· Cotejo en la nube â€” 2.Âª tanda

| Tabla | Baseline | DespuÃ©s | Registro | ComprobaciÃ³n |
|---|---:|---:|---|---|
| `collection` | 208 | **209** | `id_collection=209` | `co_client=J409074560`, `nu_amount_total=2677302.3200` (= el total de pantalla), `co_currency=BS`, `co_type=0`, `st_collection=3` |
| `collection_payment` | â€” | +1 | `id_collection=209` | **`co_payment_method='ef'`** (Efectivo) â‡’ depositable |
| `deposit` | 8 | **9** | `id_deposit=9` | `nu_document='DEP-QA-783448'` (= Nro. Plantilla de pantalla), **`nu_amount_doc=2677302.3200`** = importe exacto de la 209, `st_deposit=1` |

**Cadena verificada de punta a punta:** cobro en efectivo 209 â†’ depÃ³sito 9 por el mismo importe.
NingÃºn PASS de esta tanda se apoya solo en pantalla.

**Revisado y descartado como hallazgo:** `deposit_collection_payment` estÃ¡ **vacÃ­a (0 filas)** â€”
pero lo estÃ¡ para los **9** depÃ³sitos, histÃ³ricos incluidos. Pre-existente en el tenant, no
regresiÃ³n de 6.6.21.3.

---

## 8.4 Â· Lo que sigue SIN validarse tras esta tanda

| Ãrea | Motivo |
|---|---|
| **Retenciones** â€” que el comprobante exija **14 dÃ­gitos exactos** (`sizeRetention=14`) | casos BLOCKED (C-01); el botÃ³n RETENCIÃ“N del home no se toca en ningÃºn caso ejecutado |
| **Anticipo automÃ¡tico en USD** (`automatedPrepaid=true`, `prepaidCurrency=USD`) | casos BLOCKED **y** mi cobro manual pagÃ³ **exacto** (diferencia `0,00`) â‡’ sin excedente no hay anticipo que generar. No existe tabla de anticipos: parecen ser `collection.co_type=1` (10 histÃ³ricos) |
| **Dejar-uno-fuera por mÃ©todo de pago** (quÃ© campos exige de verdad cada uno) | requiere los casos BLOCKED; sin ellos solo se sabe que Efectivo envÃ­a con `Nro. Recibo` **vacÃ­o** |
| **Multimoneda de cobro** (`multiCurrencyCollection=true`) | solo se cambiÃ³ la moneda de **documentos** (US$); el cobro saliÃ³ en BS. No se probÃ³ cobrar en otra moneda |
| **Pago parcial / `tolerancia0`** | casos BLOCKED |
| DepÃ³sito con **2+ cobros** y papelera de Guardado | un solo cobro depositable disponible |

âš  **Riesgo latente detectado de paso:** `clickGuardarEnviar` (`cobros.js:387-403`) apila
`pointerdown` + `pointerup` + `inner.click()` **y ademÃ¡s** `mouse.click`. Es justo el patrÃ³n que
puede **enviar dos veces** en `.imagenEnviar`. Hoy no llegÃ³ a ejercitarse (DM-COB-019 BLOCKED); en
mi envÃ­o manual usÃ© **un solo** click y bastÃ³. Conviene arreglarlo **antes** de construir la Fase 2,
o el primer envÃ­o automatizado puede duplicar el cobro.

---

## 8.5 Â· Recomendaciones aÃ±adidas

1. **Arreglar el gate de DM-COB-019** (C-02): cuando `requiredCollectionAttachments=false` debe
   **enviar sin adjunto**, no bloquear por adjunto. Es un cambio pequeÃ±o con el mayor retorno de
   toda la tanda: desbloquea el envÃ­o y, con Ã©l, DepÃ³sitos.
2. **Quitar el apilado de eventos en `.imagenEnviar`** antes de construir la Fase 2 (riesgo de
   cobro duplicado).
3. **Construir la Fase 2 priorizando Retenciones y Anticipo en USD**: son las dos VG especÃ­ficas de
   este cliente que hoy no tienen ninguna cobertura.
4. Para cerrar DM-DEP-020, generar **dos** cobros en efectivo antes de correr `depositos`.
5. AÃ±adir `requiredComment` (y `suggestedOrderByDispatchAndReturn`) al YAML del perfil.

