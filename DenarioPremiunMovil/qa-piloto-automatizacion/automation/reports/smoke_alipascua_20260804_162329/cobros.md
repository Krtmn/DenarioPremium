# Smoke Test — Módulo COBROS (SOLO LECTURA)

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260804_162329_smoke-completo` |
| Módulo | COBROS — **solo lectura, no se creó ningún cobro** |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa | EL YAQUE (`denarioelyaque.ddns.net`) |
| Alcance | Verificar los 3 cobros que QA envió a mano el 2026-08-04 (uno por `co_type`) |
| Resultado | 0 PASS · 0 FAIL · 0 SKIP · **34 N/A** (todos los casos de creación) · 0 BLOCKED |

## Casos ejecutados

Los 34 casos del smoke de cobros (DM-COB-001…047) quedan **🚫 N/A por alcance de corrida**: la QA
determinó que en esta corrida cobros es solo lectura. No se ejecutó ningún caso de creación,
edición ni envío.

N/A estructurales que además aplicarían si se hubieran ejecutado (del perfil `alipascua.yaml`):

| Motivo (VG) | Casos afectados |
|---|---|
| `retencion=false` — no hay retención dentro del cobro normal | DM-COB-041 / 042 |
| `userCanSelectIGTF=false` | DM-COB-044 / 045 |
| `requiredCollectionAttachments=false` — se puede enviar sin adjunto | DM-COB-029 (SKIP de envío) |
| `cliente_25iva` vacío — no hay VG de cobro 25 % en los dumps | DM-COB-037 |

## Registros creados en sistema

**Ninguno.** Módulo en solo lectura por instrucción de QA.

## Verificación BD (payload ↔ nube)

**Servidor:** El Yaque · **Empresa:** ALIP_BSD (`id_enterprise` 2) · **Tasa:** 746,6297 (`nu_value_local`,
idéntica en los 3) · **Vendedor:** `id_user` 468 → `login_user` "002" (Wilmen Lara).

> ⚠ **Caveat de método:** QA envió los cobros a mano, **no hubo captura de payload** ⇒ esto **no** es un
> cotejo payload↔nube. Es verificación de **coherencia interna de la nube** (cabecera ↔ hijas ↔ conversión).
> Las marcas se dan sobre ese criterio.

| Ref (`id_collection`) | `co_type` | Marca | Cabecera | Hijas (n) | Conversión | Notas |
|---|---|---|---|---|---|---|
| **39236** | 0 = normal | **BD-FIELD-MISMATCH** | `nu_amount_total` 185.000,0000 BSD · `nu_amount_final` 179.063,4753 · `nu_difference` **5.936,5247** · IGTF 0 / `has_igtf`=false · `has_attachments`=true `nu_attachments`=4 · `co_operation`='I' · `st_collection`=3 | **5** — 2 `collection_detail` (39604 FACT46964 parcial, 39605 FACT46965) + 3 `collection_payment` (tr/ef/de) | ✅ cabecera exacta (BSD→US$ divide) | 🔴 delta explicado (ver abajo) · 2 columnas de conversión invertidas en la hija 39604 · descuento 755,00 huérfano |
| **39237** | 1 = anticipo | **BD-FIELD-OK** | 3.000,0000 BSD · `final`=`total` · `nu_difference` 0 · IGTF 0 · `nu_attachments`=4 · `st`=3 | **1** — 1 `collection_payment` (pm, Banco Provincial), **0 documentos** ✅ forma correcta del tipo | ✅ 3.000/746,6297 = 4,01805 → 4,0181 (Δ 0,00005) | Único de los 4 sin observaciones |
| **39238** | 2 = retención | **BD-FIELD-MISMATCH** | 1.800,0000 **US$** · `final`=`total` · `nu_difference` 0 · IGTF 0 · `has_attachments`=**false** `nu_attachments`=0 · `st`=3 | **2** — 2 `collection_detail`, **0 pagos** ✅ forma correcta del tipo | ✅ 1.800 × 746,6297 = 1.343.933,46 **exacto** (US$→BSD multiplica) | Hija 39607 con `nu_amount_paid` espurio y su conversión sin convertir |
| *39239* ⚠ | 2 = retención | **BD-INFO** | 1.800,0000 **BSD** · `st`=3 · creado 20:11:15 · comentario "ret" | **2** — 2 `collection_detail`, 0 pagos | ✅ 1.800/746,6297 = 2,41086 → 2,4109 | **No estaba en la lista declarada** — 4º cobro real en la nube |

**Duplicados:** `count(*)`=3, `count(DISTINCT co_collection)`=3, `count(DISTINCT id_collection)`=3, filas con
`co_operation='D'`=0 → **sin duplicados ni borrados lógicos**. Los `co_collection` (epoch) son distintos y
crecientes: `1785872536618.0` / `1785872813745.0` / `1785872948309.0`.

**Fechas:** `da_created` = `da_update` **al milisegundo** en los 3 (19:46:46.704 / 19:49:03.435 / 19:50:07.164)
⇒ **ningún registro fue tocado después del envío**. `da_collection` va 1–4 min antes de `da_created`
(armado/guardado vs envío) — coherente, no es hallazgo.

**`st_collection`=3 (valor crudo) en los 3.** En el catálogo `statuses` **de este cliente**: `id_status`=3 →
`co_status`='env' → **"Enviado"**, tipo `cob`. ⚠ Esto **contradice** la tabla genérica de
`modelo-datos-denario.md` §5 (que lista 3=`pap`/"Por aprobar"). El catálogo de alipascua tiene solo 4 estados
`cob`: 3=Enviado · 9=Por aprobar · 11=Aprobado · 12=Rechazado. El caveat "no interpretar `st_*` a ciegas"
queda **confirmado**: el mapeo es por playa.

**Adjuntos:** `nu_attachments`=4 cuadra exacto en 39236 y 39237 → 2 `transaction_image` + 1
`transaction_files` + 1 `transaction_signatures` = 4 ✅. 39238/39239 sin adjuntos (`false`/0) y aun así se
enviaron ⇒ en este cliente `requiredRetentionAttachments` **no** está bloqueando.

**Contexto verificado:** `id_user`=468 → `login_user` "002" ✅. Ambos clientes asignados a ese vendedor vía
`client_template_user` (`id_client` 901 → `co_user` "002"; `id_client` 1799 → `co_user` "002") ✅.
`user_address_clients` da 0 para los dos, pero esa tabla tiene 4 filas en toda la BD ⇒ no es el mecanismo de
asignación acá (**BD-N/A** para esa vía, no es hallazgo).

---

### 39236 — desglose del delta 185.000,00 → 179.063,4753

🔴 **El delta SÍ se explica con las filas hijas. NO es un documento editado.**

**Lado A — métodos de pago (`collection_payment`, 3 filas, `id_collection_detail`=NULL en las 3):**

| id | método | banco | monto BSD | conversión US$ | check ÷746,6297 |
|---|---|---|---|---|---|
| 39255 | `tr` transferencia | BANESCO (id 21), doc 12456 | 170.000,0000 | 227,6898 | 227,68985 ✅ |
| 39256 | `ef` efectivo | — | 5.000,0000 | 6,6968 | 6,69676 ✅ |
| 39257 | `de` depósito | PROVEEDOR IANCARINA (id 15) | 10.000,0000 | 13,3935 | 13,39352 ✅ |
| | | **Σ** | **185.000,0000** | **247,7801** | = `nu_amount_total_conversion` ✅ |

**Σ métodos de pago = 185.000,0000 = `nu_amount_total`** ✅ (reconstruye el 185.000, no el 179.063)

**Lado B — documentos aplicados (`collection_detail`, 2 filas):**

| id | documento | `nu_amount_doc` (BSD) | `nu_amount_paid` | parcial | descuento |
|---|---|---|---|---|---|
| 39604 | FACT46964 | 1.283.755,1062 | **1.500,0000** | ✅ true | 755,0000 |
| 39605 | FACT46965 | 177.563,4753 | **177.563,4753** | false | 0 |
| | | | **Σ 179.063,4753** | | |

**Σ aplicado a documentos = 1.500,0000 + 177.563,4753 = 179.063,4753 = `nu_amount_final`** ✅

**La aritmética del delta:**

```
Σ métodos de pago       185.000,0000  = nu_amount_total           ✅
Σ aplicado a documentos 179.063,4753  = nu_amount_final           ✅
                        ─────────────
delta                     5.936,5247  = nu_difference (cabecera)  ✅ campo a campo
delta en US$    5.936,5247 / 746,6297 = 7,95110 → nu_difference_conversion 7,9511 ✅
```

**Naturaleza del delta — descartado uno por uno:**

- ❌ **IGTF:** `nu_igtf`=0, `nu_amount_igtf`=0, `has_igtf`=false, `nu_amount_igtf_conversion`=0.
- ❌ **Retención:** `nu_amount_retention`=0 y `nu_amount_retention2`=0 en las 2 hijas;
  `collection_detail_retentions` = 0 filas.
- ❌ **Descuento:** `nu_amount_discount_total`=0 en cabecera, `collection_detail_discounts` = 0 filas.
  El 755,00 de la hija **no participa** (179.063,4753 + 755 = 179.818,4753 ≠ nada).
- ❌ **Edición web post-envío:** `da_created` = `da_update` al ms, en cabecera **y** en las 2 hijas (todas
  19:46:46.704); `co_operation`='I'. Los documentos origen en `document_sale` (id 5207/5208) tienen
  `da_update` 2026-07-31 y `id_collection`=NULL — **no fueron tocados**.
- ✅ **Sobrante de pago no aplicado.** El vendedor cargó 185.000,00 en métodos de pago pero solo aplicó
  179.063,4753 a documentos: FACT46965 completo (177.563,4753) + FACT46964 **parcial por 1.500,00** cuando
  quedaban 7.436,5247 por repartir. **7.436,5247 − 1.500,00 = 5.936,5247.** La app lo asienta en
  `nu_difference`.

**Lo que SÍ es cuestionable del delta:** los 3 pagos tienen `id_difference_code`=NULL y
`co_difference_code`=''. Se registró una diferencia de 5.936,5247 BSD **sin código de diferencia que la
justifique**. Para QA: confirmar si la UI debía exigir un código al dejar 5.936,5247 sin aplicar, o si el
parcial de 1.500,00 fue lo que se tecleó a propósito.

**Verificación de conversión de cabecera (BSD→US$, divide):**

```
185.000,0000 / 746,6297 = 247,78013  → nu_amount_total_conversion 247,7801  ✅ Δ 0,00003
179.063,4753 / 746,6297 = 239,82904  → nu_amount_final_conversion 239,8290  ✅ Δ 0,00004
  5.936,5247 / 746,6297 =   7,95110  → nu_difference_conversion     7,9511  ✅ Δ 0,00000
```

Las 3 dentro de tolerancia 0,01 con holgura de 3 órdenes de magnitud.

---

### Hallazgos

**H1 · 🔴 Conversión INVERTIDA en la hija de pago parcial (39236 / detalle 39604) — `BD-FIELD-MISMATCH`**

En un cobro **BSD** la conversión debe **dividir**. En la fila 39604 dos columnas **multiplican**:

```
nu_amount_paid      1.500,0000 → nu_amount_paid_conversion      1.119.944,5500
                                 = 1.500 × 746,6297  (debería ser 1.500 / 746,6297 = 2,0090)
nu_amount_discount    755,0000 → nu_amount_discount_conversion    563.705,4235
                                 = 755   × 746,6297  (debería ser 755   / 746,6297 = 1,0112)
```

**La prueba de que es un bug y no un criterio:** en la fila hermana **39605 del mismo cobro** la misma columna
**sí divide** (177.563,4753 → 237,8200 ✅), y `nu_amount_doc_conversion` divide correctamente **en la propia
39604** (1.283.755,1062 → 1.719,4000 ✅). Dos direcciones opuestas en la misma fila. El discriminador aparente
es `in_payment_partial`=true (única fila parcial de la muestra). Error de escala: **×557.000**.

**H2 · 🔴 Descuento a nivel de documento que no sube a la cabecera (39236 / 39604) — `BD-FIELD-MISMATCH`**

`nu_amount_discount`=755,0000 en la hija, pero: `has_discount`=**false** en esa misma fila,
`nu_collect_discount`=0,00, `nu_amount_collect_discount`=0, `collection_detail_discounts`=**0 filas**, y en
cabecera `nu_amount_discount_total`=**0,0000**. El descuento **no afecta ningún total** y no queda rastreable
desde la cabecera. O el 755 se guardó de más, o el rollup no existe.

**H3 · 🔴 DEFECTO CONFIRMADO POR QA — la app permite ENVIAR una retención con un documento seleccionado
cuya retención quedó VACÍA, y ese documento persiste un `nu_amount_paid` espurio (su saldo íntegro)**

> ✅ **Confirmado por la responsable QA (2026-08-04):** los cobros **39238 y 39239 se crearon a propósito
> para reportar este defecto.** Procedimiento: montar una retención, **seleccionar 2 documentos** y
> **configurar la retención de uno solo** → **la app deja enviar igual**, con una de las retenciones vacía.
> El cotejo BD detectó la huella de este defecto de forma independiente, antes de conocer la intención.

**Reproducción:** Cobros → RETENCIÓN (`co_type=2`) → seleccionar 2 documentos → cargar retención IVA/ISLR en
**uno solo** → Enviar. **Resultado observado: envía sin validar.** Esperado: la app debería exigir retención
en cada documento seleccionado, o no permitir seleccionar un documento al que no se le cargará retención.

**Huella en la nube — 2 muestras independientes:**

```
39238 / 39607  FACT46965  retención 0+0  nu_amount_paid   237,8200      (= nu_amount_doc, íntegro)
39239 / 39609  FACT47169  retención 0+0  nu_amount_paid 1.092.991,2178  (= nu_amount_doc, íntegro)
```

En la fila que **sí** tiene retención el campo es correcto (39606: `nu_amount_paid` 1.800 = 1.000 IVA + 800
ISLR ✅). La cabecera **no** suma estas filas (39238 total 1.800 ≠ Σ paid 2.037,82). La cabecera está bien y
**la hija miente**: un documento con retención cero declara haber cobrado su saldo completo. `missing_retention`
= **false** en ambas — la bandera que debería delatarlas **no se activa**, así que tampoco sirve para filtrarlas.

🔴 **El síntoma ES VISIBLE en la web** (confirmado por el agente web sobre 39239): en el detalle del cobro, la
fila **FACT47169 muestra `Monto a pagar = 1.092.991,2178`** aunque la retención total del cobro es 1.800,00
sobre el otro documento. Es decir, un cobro de retención de 1.800,00 exhibe un renglón de más de un millón.

**Impacto:** cualquier reporte o conciliación que sume `collection_detail.nu_amount_paid` sobre cobros de
retención va a inflarse por el saldo completo de los documentos sin retención. En estas 2 muestras el ruido es
de 237,82 US$ y **1.092.991,22 BSD**.

**Severidad propuesta:** S2 (dato de dinero incorrecto y visible, sin bloquear la operación). Sube a S1 si
algún proceso administrativo consume ese campo para aplicar saldos.

**H4 · 🟠 `nu_amount_paid_conversion` sin convertir (39238 / 39607) — `BD-FIELD-MISMATCH`**

Cobro en **US$** ⇒ debe multiplicar. `nu_amount_paid` 237,8200 → `nu_amount_paid_conversion` **237,8200**
(valor copiado, sin conversión; debería ser 177.563,4753, que es justo lo que sí trae
`nu_amount_doc_conversion` en esa misma fila). En la hermana 39239/39609 el mismo campo **sí** convierte bien
(1.092.991,2178 → 1.463,9000 ✅), lo que confirma que es un defecto y no el diseño.

**H5 · ✅ RESUELTO — el 4º cobro `id_collection` 39239 es INTENCIONAL, no un registro huérfano**

Detectado por el cotejo BD como "no declarado". **Aclarado por QA el 2026-08-04: lo creó ella misma para
reportar el defecto H3** (retención con 2 documentos y solo uno configurado). No es duplicado, no es error de
sync, no es alcance faltante.

Datos: mismo vendedor, mismo cliente (J296437246), `co_type`=2, 1.800,00 en **BSD** (39238 fue en **US$**),
enviado 20:11:15, comentario "ret" vs "ret1", `co_collection` propio `1785874217658.0`, documentos distintos
(FACT50019379 + FACT47169 vs FACT46964 + FACT46965). Estatus en la web: "Por aprobar", igual que los otros 3.

⇒ Sin hallazgo propio. Su valor está en ser la **2ª muestra independiente de H3**.

**H6 · 🟡 Diferencia de 5.936,5247 BSD sin código de diferencia — `BD-INFO`**

`id_difference_code`=NULL / `co_difference_code`='' en los 3 pagos de 39236.

**Sin hallazgo (verificado y correcto):** forma por `co_type` respetada en los 4 (0 → docs+pagos · 1 → solo
pagos, cero documentos · 2 → solo docs+retenciones, cero pagos) — **ninguna hija fuera de tipo**; duplicados
0; `co_operation='D'` 0; conversiones de cabecera de los 4 dentro de 0,01; adjuntos denormalizados exactos;
IGTF consistentemente en cero y `has_igtf`=false en los 4.

---

### Notas de calibración (insumo para `cotejo-payload.js`)

- **Hijas reales de `collection` en este esquema** (descubiertas por `information_schema`, no adivinadas):
  `collection_detail` (PK `id_collection_detail`), `collection_payment` (PK `id_collection_payment`),
  `collection_detail_discounts` (cuelga de `id_collection_detail`), `collection_detail_retentions` (cuelga de
  `id_collection_detail` + `co_collection`). Las dos últimas existen pero están **vacías** para los 4 cobros ⇒
  retenciones y descuentos se persisten **denormalizados en `collection_detail`**. Al calibrar co_type 2,
  apuntar a `collection_detail.nu_amount_retention` / `nu_amount_retention2`, **no** a
  `collection_detail_retentions`.
- **`erp_in_collection_payment` devuelve las mismas 4 filas que `collection_payment`** (mismos
  `id_collection_payment` 39255–39258) mientras `erp_in_collection` y `erp_in_collection_detail` dan 0 ⇒ es un
  **espejo/vista de salida al ERP**, no una hija propia. **No incluirla** o se cuentan pagos dobles.
- **`document_sale` tiene `id_collection`/`co_collection` pero quedan NULL** tras el cobro (5207/5208 sin
  vincular). El vínculo cobro↔documento va por `collection_detail.co_document` ('FACT46964') y `co_original`
  ('46964'). No usar `document_sale.id_collection` como FK de verificación.
- **Retenciones: nombres poco obvios.** IVA = `nu_amount_retention`, ISLR = `nu_amount_retention2`. Existen
  además `nu_amount_retention_iva`/`_islr` con escala de 6 decimales duplicando los mismos valores
  (1000.000000 / 800.000000). Cuatro columnas para dos conceptos; mapear con cuidado en el `fieldMap`.
- **Columnas de cabecera presentes que el modelo §4.2 no documenta:** `nu_amount_discount_total`,
  `nu_amount_discount_total_conversion`, `nu_amount_igtf_conversion`, `nu_difference_conversion`,
  `id_conversion_type` (NULL en los 4), `id_original_collection`/`co_original_collection` (NULL — para el cobro
  que anula/reemplaza a otro), `da_voucher`, `nueva_cuenta`, `nu_value_local`. **`id_conversion_type` NULL con
  conversión aplicada** sugiere que el tipo se infiere de `id_currency` (1=BSD, 2=US$) y no se persiste.
- **`collection_payment.id_collection_detail` es NULL en las 4 filas de pago** ⇒ los pagos se ligan al
  **cobro**, no al documento. La reconciliación pago↔documento no es posible a nivel de fila: solo cuadra por
  totales (que es exactamente como se resolvió el delta de 39236).
- **`statuses` es por playa.** El mapeo de `modelo-datos-denario.md` §5 (3=`pap`) **no aplica a alipascua**
  (3=`env`). Cualquier config que hardcodee ids de estado va a fallar al cambiar de cliente — leer
  `statuses WHERE co_transaction_type='cob'` en runtime.
- **`users`:** el login vive en `login_user` (='002'); no hay `co_user` en esa tabla. La asignación
  cliente↔vendedor está en `client_template_user` (1.026 filas, 64 del user 468), **no** en
  `user_address_clients` (4 filas en toda la BD).
- **`nu_balance_doc` guarda el saldo al momento del cobro, sin descontar lo pagado** (39604: paid 1.500 y
  balance sigue 1.283.755,1062). Es el comportamiento esperado, pero no cotejarlo contra el saldo post-cobro.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| Hijas de `collection` = `collection_detail` + `collection_payment`; discounts/retentions **denormalizados** en `collection_detail` | universal (esquema de producto) | Calibración de `cotejo-payload.js` para co_type 1 y 2 |
| `erp_in_collection_payment` es espejo ERP, **excluir** del cotejo | universal | Si no, se cuentan pagos dobles |
| `statuses` es **por playa** — leer en runtime, nunca hardcodear ids | universal | alipascua: 3=`env`=Enviado (el modelo genérico dice 3=`pap`) |
| Asignación cliente↔vendedor por `client_template_user`, no por `user_address_clients` | universal | `user_address_clients` tiene 4 filas en toda la BD |

---
*Generado por Claude Code · Orquestador Smoke · cotejo BD read-only · 2026-08-04*
