# IGTF POR SEPARADO — validación de punta a punta

| Parámetro | Valor |
|-----------|-------|
| Cliente QA | `el_palmar` · Isla Coche |
| Empresa | **1002 — CENTRAL EL PALMAR, S.A.** |
| Fecha | 2026-08-28 |
| Cliente de prueba | **NESTLE VENEZUELA, S.A. — `1000001897`** (id_client 1179) |
| Tasa | 710,0000 VES/USD |
| Baseline | `max(id_collection) = 27156` · `max(id_document_sale) = 107194` |
| App | `com.kiberno.denarioPremiumPro` · CDP `:9220` · `window.ng = true` |

---

## ✅ VEREDICTO

**El flujo funciona de punta a punta.** El switch «Pago separado IGTF» saca el IGTF del total a pagar, el
envío genera el documento `IGTF-<co_collection>` en la cartera del cliente por el importe exacto, y ese
documento **aparece en Cobros → IGTF para ese mismo cliente** y **se puede cobrar** (cerró el ciclo con el
cobro `co_type=3` nro. **27158**). El caso de control sin el switch se comporta al revés, como debe.

---

## Tabla de mediciones S1–S6

| # | Medición | Esperado | Medido | |
|---|----------|----------|--------|---|
| **S1** | El switch **separa** el importe | «Monto total a Pagar» baja exactamente en el IGTF | **ANTES** (switch OFF): total **22,1965 USD** / 15.759,5150 VES, con línea `IGTF USD 0,6465` · `IGTF VES 459,0150` declarada por la propia pantalla.<br>**DESPUÉS** (switch ON): total **21,5500 USD** / 15.300,5000 VES; las líneas IGTF y la columna IGTF **desaparecen** del Tab Total.<br>Δ USD = 22,1965 − 21,5500 = **0,6465** = el IGTF que la pantalla declaró. Δ VES = **459,0150**. Anclaje independiente: 21,5500 es **el saldo de la factura** 0091020007 según la cartera del cliente. | ✅ |
| **S2** | El cobro se **envía** correctamente | Acuse del servidor + fila en la nube | Acuse: **«Cobro nro. 27157 enviado exitosamente»** (3.ª alerta, la del servidor).<br>Nube: `id_collection = **27157**` · `co_collection = 1787947895613.0` · `co_type = 0` · `co_currency = USD` · **`nu_amount_total = 21.5500`** · **`nu_amount_igtf = 0.0000`** · `st_collection = 1` · pago `ef` 21,5500. | ✅ |
| **S3** | 🔑 Se **genera** el documento de IGTF | Documento nuevo en la cartera del cliente | `document_sale` **id 107195** · `co_document_sale = **IGTF-1787947895613.0**` (= `IGTF-<co_collection del cobro 27157>`) · `co_document_sale_type = **IGTF**` · `co_client = 1000001897` · USD · `nu_amount_total = **0.6465**` · `nu_balance = 0.6465` · `da_document = 28/08/2026`.<br>Confirmación independiente en UI: el **saldo del cliente** en el buscador subió de `875.972.390,8200` a `875.972.849,8350` VES ⇒ **+459,0150 VES = el IGTF exacto**. | ✅ |
| **S4** | 🔑 **Aparece en Cobros → IGTF** con ese cliente | El documento visible y seleccionable | **Sí aparece.** Cobros → IGTF → lista de clientes → NESTLE (1000001897) → Tab Documentos:<br>`Tipo **IGTF**` · `Nro. documento **IGTF-1787947895613.0**` · USD · Tasa 710,0000 VES · Monto Total **0,6465 USD / 459,0150 VES** · Saldo 0,6465 USD · Fecha 28/08/2026 · Comentario `IGTF 0.6465 1787947895613.0`.<br>Capturas **10** y **11**. **Baseline previo** (captura 01): la misma pantalla, mismo cliente, decía «No hay documentos» ⇒ el PASS no es residuo. | ✅ |
| **S5** | El **importe** coincide | Pantalla ↔ nube ↔ IGTF calculado | Pantalla `0,6465 USD` = nube `nu_amount_total 0.6465` = IGTF declarado en el cobro `0,6465` = 3 % de 21,5500. Conversión `459,0150 VES` = 0,6465 × 710. **Cuadran los cuatro.** | ✅ |
| **S6** | Comparar contra **NO separado** | IGTF dentro del total y **sin** documento aparte | Cobro de control **27159** (mismo cliente, misma sesión, IGTF 3 %, **switch OFF**): total pantalla **24,8848 USD** (= 24,1600 doc + 0,7248 IGTF, IGTF **dentro** y con su columna visible en el Tab Total). Nube: `nu_amount_total = **24.8848**` · **`nu_amount_igtf = 0.7248`** (≠ 0) · **`document_sale` no creó ningún documento** (el único nuevo sigue siendo el 107195, del cobro separado).<br>Precedente extra del mismo día sin escribir nada: **27155** (IGTF 3 % sin switch) → `nu_amount_igtf = 0.5922` y **cero documentos** `IGTF-1787946176496.0`. | ✅ |

### Contraste que resume el hallazgo

| | Switch **ON** (27157) | Switch **OFF** (27159) |
|---|---|---|
| `nu_amount_total` | 21,5500 (**sin** IGTF) | 24,8848 (**con** IGTF) |
| `nu_amount_igtf` | **0,0000** | **0,7248** |
| Documento IGTF generado | **Sí** — `IGTF-1787947895613.0`, 0,6465 USD | **No** |
| Dónde queda el IGTF | Deuda nueva del cliente, cobrable aparte | Cobrado dentro del mismo cobro |

---

## Etapa 2 completa — el documento no sólo aparece, se cobra

Cobré el documento desde Cobros → IGTF para cerrar el ciclo:

- Acuse del servidor: **«IGTF nro. 27158 enviado exitosamente»** (alertas: `El IGTF será enviado` →
  `Su Cobro será enviado` → acuse).
- Nube: `id_collection = **27158**` · `co_type = **3** (IGTF)` · `co_currency = VES` ·
  `nu_amount_total = **459.0150**` · pago `ef` 459,0150.
- `collection_detail` de 27158: `co_document = **IGTF-1787947895613.0**` · `co_type_doc = IGTF` ·
  `nu_amount_doc = 459.0150` · `nu_amount_paid = 459.0150` · `nu_amount_paid_conversion = **0.6465**`.
- Tras cobrarlo, la pantalla Cobros → IGTF del mismo cliente vuelve a **«No hay documentos»** (captura 13)
  ⇒ **no hay riesgo de doble cobro** desde el móvil.

Esto reproduce exactamente la forma de la cadena que ya existía en la nube
(`27094 → IGTF-1785963823837.0 → 27099` y `27129 → IGTF-1786544259624.0 → 27130`).

> ⚠ **Sobre el «precedente 27076» del encargo:** lo verifiqué y **no es este caso**. El 27076 tiene
> `nu_amount_igtf = 3.1878` ≠ 0 y su `collection_detail` son dos facturas normales (`co_type_doc = 01`) con
> retenciones y descuentos que dejan el neto en 0 — es un cobro **con IGTF adentro** cuyo total quedó en cero,
> no un cobro con IGTF separado. El verdadero precedente del flujo es **27094 → 27099**: allí el padre tiene
> `nu_amount_igtf = 0.0000` y el IGTF vive en un documento aparte. Es el patrón que reprodujo 27157.

---

## Cotejo en la nube

```sql
-- cobros creados (baseline id_collection > 27156)
27157 | co_type 0 | USD | nu_amount_total 21.5500 | nu_amount_igtf 0.0000 | st 1 | "QA IGTF SEPARADO"
27158 | co_type 3 | VES | nu_amount_total 459.0150| nu_amount_igtf 0.0000 | st 1 | "QA cobro doc IGTF"
27159 | co_type 0 | USD | nu_amount_total 24.8848 | nu_amount_igtf 0.7248 | st 1 | "QA CONTROL IGTF NO SEPARADO"

-- documento generado (baseline id_document_sale > 107194) → exactamente 1 fila nueva
107195 | IGTF-1787947895613.0 | cliente 1000001897 | tipo IGTF | USD | total 0.6465 | saldo 0.6465
```

---

## Registros creados y descartados

| Ref | Qué es | Estado | Nota |
|-----|--------|--------|------|
| **27157** | Cobro `co_type=0`, doc 0091020007 (21,5500 USD), IGTF 3 % **con switch separado** | Enviado (`st_collection=1`) | El registro que prueba S1–S3 |
| **27158** | Cobro `co_type=3` (IGTF), doc `IGTF-1787947895613.0`, 459,0150 VES | Enviado (`st_collection=1`) | Cierra la etapa 2 |
| **27159** | Cobro `co_type=0`, doc 0091022005 (24,1600 USD), IGTF 3 % **sin** switch | Enviado (`st_collection=1`) | Caso de control S6 |
| **107195** | Documento `IGTF-1787947895613.0`, 0,6465 USD | Generado por 27157, cobrado por 27158 | — |

**Descartados:** dos formularios IGTF abiertos sólo para leer (baseline al inicio y verificación final) —
ambos salieron por **«Salir sin guardar»**, sin insert. **3 cobros enviados de los 4 del presupuesto.**

---

## Observación (no es defecto de esta release)

**`document_sale.nu_balance` del documento IGTF no baja en la nube tras cobrarlo.** El 107195 sigue con
`nu_balance = 0.6465` pese a que el cobro 27158 lo pagó completo. **No reproduce sólo con lo nuevo**: el
documento histórico 107194 (cobrado por 27130 el 12/08) también conserva su `nu_balance = 29.3949`. Es
comportamiento del lado servidor/ERP, previo a esta release, y **el móvil no se ve afectado** — la pantalla
Cobros → IGTF deja de listar el documento en cuanto se cobra (captura 13). Se deja anotado para que
contabilidad lo mire, no como defecto móvil (RUNTIME §4.b).

---

## Lo que NO se validó

- **El switch en moneda VES del cobro.** Los tres cobros se hicieron con **moneda de cobro USD**. En la nube
  hay precedentes de documentos IGTF emitidos en VES (27129 → doc en VES), así que la rama VES existe pero
  **no la ejercí**.
- **Persistencia round-trip del switch (§9).** No guardé un cobro con el switch encendido para reabrirlo y
  comprobar que `separateIgtf` sobrevive. Los tres cobros fueron directo a Enviar.
- **IGTF separado con más de un documento**, con pago parcial, con retención o con descuento: siempre usé
  **un solo documento pagado al saldo completo**.
- **IGTF separado con métodos de pago distintos de Efectivo** (Depósito / Transferencia / Otros / Pago Móvil).
- **Apagar el switch después de encenderlo** (que el total vuelva a subir) — sólo medí OFF→ON.
- **El comportamiento con `automatedPrepaid`**: no provoqué sobrepago, así que no sé cómo interactúan el
  anticipo automático y el IGTF separado.
- **BD local del dispositivo: `BD-N/A`.** `automation/db/local-query.js` aborta con
  `Cannot find module 'sql.js'` ⇒ no pude contrastar `st_delivery` / `pending_transactions`. Lo suplí con el
  acuse del servidor (3.ª alerta) + la fila en la nube, que es el oráculo fuerte del §10.

---

## Patrones / selectores nuevos

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **El switch «IGTF POR SEPARADO» se llama «Pago separado IGTF:» y vive en el Tab DOCUMENTOS** | universal (candidato) | Único `ion-toggle` de `app-cobro-documents`, justo debajo del `ion-select` de IGTF. Localizarlo: `document.querySelector('app-cobro-documents ion-toggle')`. Ocupa toda la fila (328 px) → clickear cerca del **extremo derecho** (`rect.right - 20`), no en el centro. |
| **`collectService.separateIgtf` es el discriminador barato del switch** | universal | Junto a `montoIgtf` / `montoIgtfConversion` / `igtfSelected` / `lastPersistCreatedSeparateIgtfDocument`. Evita leer la tabla para saber si el IGTF computó y si va separado. |
| **El documento generado es `IGTF-<co_collection del cobro padre>` en `document_sale`** | universal | `co_document_sale_type = 'IGTF'`, `nu_document = ''`. Es la **única** llave visible del par cobro↔documento (confirma `[difranca-20260807]` y lo extiende al lado `document_sale`, no sólo `collection_detail`). |
| **Oráculo independiente del IGTF sin abrir nada: el saldo del cliente en el buscador** | universal | El `Saldo VES` que muestra `#clienteSelectModal` sube exactamente en el IGTF convertido tras enviar el cobro separado. Sirve para no depender de la fórmula del código. |
| **La 3.ª alerta (acuse del servidor) puede tardar >10 s y llegar YA en el menú de Cobros** | universal | En 27157 apareció ~2 min después del envío, con el agente ya en el menú. ⚠ **`ion-alert:not(.overlay-hidden)` devolvió `[]` mientras la alerta estaba visible en pantalla**: filtrar por `getBoundingClientRect().height > 0`, no por la clase. |
| 🔴 **Los DOS `#eventModal` conviven también en COBROS de el_palmar** | cliente/universal | `document.querySelector('#eventModal')` devolvió el `detail-doc-modal` **oculto** y el modal de métodos quedó invisible al script. Receta: `Array.from(document.querySelectorAll('ion-modal')).filter(m => m.getBoundingClientRect().height>0 && /Efectivo/.test(m.innerText))[0]`. Reconfirma `[ins-2610]`. |
| **El modal de métodos tarda >3,5 s en reportar altura tras el click** | cliente | Un chequeo `height>0` a los 3,5 s dio `false` con el modal **ya abierto en pantalla**. Dar ≥4 s o reintentar la lectura, no reclickear (reclickear lo cierra). |
| **Selección de cliente: `#clienteSelect` (click) → `Enter` → `chevron-forward-outline`** | cliente | **4/4 sin reintentos** en esta corrida. ⚠ Hay que **abrir la lista primero**: teclear con el modal cerrado escribe en el input de fondo y no selecciona nada (falso negativo). |
| **El form de Cobros → IGTF no tiene selector IGTF ni switch de separado** | universal | Sólo «Moneda Documento». Coherente: no se aplica IGTF sobre un cobro de IGTF. |
| **El cobro de IGTF (`co_type=3`) nace en la moneda LOCAL (VES)** | cliente | Aunque el documento IGTF esté en USD, el form abre en VES y el total a pagar sale convertido (459,0150 VES). `nu_amount_paid_conversion` del detalle guarda el USD (0,6465). |

---

## Ledger

```
{"run_id":"igtf_separado_20260828","modulo":"cobros","caso":"S1-switch-separa-importe","resultado":"PASS","bd":"BD-OK"}
{"run_id":"igtf_separado_20260828","modulo":"cobros","caso":"S2-envio-cobro","resultado":"PASS","bd":"BD-OK"}
{"run_id":"igtf_separado_20260828","modulo":"cobros","caso":"S3-genera-documento-igtf","resultado":"PASS","bd":"BD-OK"}
{"run_id":"igtf_separado_20260828","modulo":"cobros","caso":"S4-aparece-en-menu-igtf","resultado":"PASS","bd":"BD-OK"}
{"run_id":"igtf_separado_20260828","modulo":"cobros","caso":"S5-importe-coincide","resultado":"PASS","bd":"BD-OK"}
{"run_id":"igtf_separado_20260828","modulo":"cobros","caso":"S6-control-no-separado","resultado":"PASS","bd":"BD-OK"}
{"run_id":"igtf_separado_20260828","modulo":"cobros","caso":"EXTRA-cobro-del-documento-igtf","resultado":"PASS","bd":"BD-OK"}
```

---

## Evidencia (`img/`)

| # | Archivo | Qué prueba |
|---|---------|-----------|
| 01 | `01-ETAPA2-baseline-IGTF-NESTLE-sin-documentos.png` | **Baseline**: Cobros → IGTF con NESTLE = «No hay documentos» |
| 02 | `02-ETAPA2-baseline-general-cliente-NESTLE.png` | Cliente y tasa del baseline |
| 03 | `03-ETAPA1-lista-clientes.png` | Lista de clientes abierta antes de buscar (etapa 1) |
| 04 | `04-S1-total-ANTES-switch-22.1965.png` | **S1 antes**: total 22,1965 con IGTF 0,6465 declarado |
| 05 | `05-S1-switch-pago-separado-IGTF-encendido.png` | El switch «Pago separado IGTF» encendido |
| 06 | `06-S1-total-DESPUES-switch-21.5500.png` | **S1 después**: total 21,5500, sin líneas IGTF |
| 07 | `07-S2-pagos-efectivo-21.55-diferencia-0.png` | Pago en efectivo por el total ya sin IGTF |
| 08 | `08-S2-acuse-servidor-cobro-27157-enviado.png` | **Acuse del servidor**: «Cobro nro. 27157 enviado exitosamente» |
| 09 | `09-S4-lista-clientes-en-menu-IGTF.png` | Lista de clientes dentro de Cobros → IGTF |
| **10** | `10-S4-EVIDENCIA-CENTRAL-doc-IGTF-visible-en-menu-IGTF.png` | 🔑 **El documento `IGTF-1787947895613.0` visible en Cobros → IGTF** |
| **11** | `11-S5-doc-IGTF-importe-0.6465-USD.png` | 🔑 Importe: **0,6465 USD / 459,0150 VES** |
| 12 | `12-S4-general-menu-IGTF-cliente-NESTLE.png` | El cliente NESTLE seleccionado en ese mismo form |
| 13 | `13-post-cobro-doc-IGTF-ya-no-aparece.png` | Tras cobrarlo, el documento desaparece (sin doble cobro) |
