# Smoke Test — Módulo COBROS · 🔒 SOLO LECTURA

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260807_120232_smoke-difranca-tag20` |
| Módulo | COBROS (solo lectura — decisión explícita de QA) |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — app v1.0 / db 19 · `window.ng=true` |
| Playa | EL YAQUE · cliente **difranca** · empresa de corrida **DDHP_A12** (id 2) |
| Vendedor | `VEND206` = id_user **275** (Jose Raad) · `co_user='206'` |
| Resultado | 0 PASS · 0 FAIL · **34 🚫 N/A por alcance de corrida** · 0 BLOCKED |
| **Registros creados** | 🔴 **NINGUNO.** No se creó, guardó ni envió ningún cobro, anticipo ni retención. |

> Los 34 casos del smoke van 🚫 **N/A por alcance de corrida**: la QA decidió que COBROS es de
> **solo lectura** en esta corrida. El trabajo ejecutado fue de **lectura y contraste** contra la
> nube, y está en las secciones siguientes — que son lo que aporta al go/no-go.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | 🚫 N/A | alcance de corrida (menú sí observado — ver §3) |
| DM-COB-002 | 🚫 N/A | alcance de corrida (form sí observado — ver §3) |
| DM-COB-004 | 🚫 N/A | alcance de corrida — requiere seleccionar cliente |
| DM-COB-006 | 🚫 N/A | alcance de corrida — `requiredComment` no observable sin cliente |
| DM-COB-007 | 🚫 N/A | alcance de corrida |
| DM-COB-008 | 🚫 N/A | alcance de corrida |
| DM-COB-015 | 🚫 N/A | alcance de corrida (Total General sí leído en cobros históricos — §2) |
| DM-COB-033 | 🚫 N/A | alcance de corrida |
| DM-COB-034 | 🚫 N/A | alcance de corrida |
| DM-COB-041 | 🚫 N/A | alcance de corrida |
| DM-COB-042 | 🚫 N/A | alcance de corrida |
| DM-COB-009 | 🚫 N/A | alcance de corrida |
| DM-COB-040 | 🚫 N/A | alcance de corrida |
| DM-COB-012 | 🚫 N/A | alcance de corrida |
| DM-COB-043 | 🚫 N/A | alcance de corrida |
| DM-COB-014 | 🚫 N/A | alcance de corrida (Tab Total sí leído en históricos — §2) |
| DM-COB-016 | 🚫 N/A | alcance de corrida |
| DM-COB-018 | 🚫 N/A | alcance de corrida — **prohibido Guardar** |
| DM-COB-019 | 🚫 N/A | alcance de corrida — **prohibido Enviar** |
| DM-COB-022 | 🚫 N/A | alcance de corrida (lista BUSCAR sí recorrida — §1) |
| DM-COB-024 | 🚫 N/A | alcance de corrida |
| DM-COB-026 | 🚫 N/A | alcance de corrida — **prohibido eliminar** |
| DM-COB-020 | 🚫 N/A | alcance de corrida |
| DM-COB-021 | 🚫 N/A | alcance de corrida |
| DM-COB-038 | 🚫 N/A | alcance de corrida |
| DM-COB-029 | 🚫 N/A | alcance de corrida |
| DM-COB-028 | 🚫 N/A | alcance de corrida |
| DM-COB-036 | 🚫 N/A | alcance de corrida |
| DM-COB-044 | 🚫 N/A | alcance de corrida |
| DM-COB-045 | 🚫 N/A | alcance de corrida |
| DM-COB-046 | 🚫 N/A | alcance de corrida |
| DM-COB-047 | 🚫 N/A | alcance de corrida |
| DM-COB-037 | 🚫 N/A | alcance **y** estructural: `userCanCollectIva=false`, 0 cobros `co_type=4`; el botón 25% IVA **no existe** en el menú |
| DM-COB-039 | 🚫 N/A | alcance de corrida |

---

## §1 · Cobertura: ¿cuántos de los 19.771 cobros ve el móvil?

**El móvil ve 100.** Es decir **0,51 %** del histórico de la nube.

| Fuente | Cobros | Detalle |
|---|---|---|
| Nube (`collection`, `co_operation<>'D'`) | **19.771** | `st_collection=1` en los 19.771, ids 1→21832 |
| Nube, **solo del vendedor 275** | **2.379** | el vendedor QA |
| **BD local del device** (`collections`) | **100** | ids `id_collection` 20973→21832 · fechas 07-jul→07-ago |
| UI · `app-cobros-list.filteredItems` | **100** | 20 renderizados (`pageSize=20`) + infinite-scroll activo |

### 🔴 El BUSCAR de cobros NO es un historial 100 % local — acá SÍ descarga del servidor

Este es el resultado más importante de la sección, y **contradice** lo hallado en el_palmar
(`BUSCAR de Cobros NO consulta la nube — el historial es puramente LOCAL`).

Evidencia (BD local vía `window.sqlitePlugin`):

- Las 100 filas tienen **`id_collection` > 0** (PK asignada por el **servidor**) — las 100.
- Las 100 tienen **`st_delivery = 1`** (enviado) y `count(DISTINCT co_collection) = 100` (sin duplicados).
- `sqlite_sequence.collections = 100` ⇒ **nunca hubo más de 100 inserts**: no es que se hayan
  borrado filas, es que **solo bajaron 100**.
- Hay cobros de **las 3 empresas** (DDHP_A12 92 · DHVITAL01_A 4 · DIF_A12 4) ⇒ la descarga
  **no** está filtrada por la empresa de la corrida.

### El criterio del recorte: los **100 más recientes del vendedor**

| Comprobación (nube) | Resultado |
|---|---|
| Cobros en el rango de ids 20973–21832 (todos los vendedores) | **770** |
| Cobros en ese rango **del vendedor 275** | **100** ← exactamente los que tiene el device |
| Cobros del vendedor 275 con fecha ≥ 2026-07-07 | 100 |

⇒ El sync baja **los 100 cobros más recientes del vendedor logueado**, no una ventana de fechas ni
el histórico completo. **No es un defecto**: es un tope de sincronización, y es coherente
(un vendedor no necesita 19.771 cobros de toda la compañía en el teléfono). **Se documenta como
dato de operación**, que era lo pedido.

> ⚠ Consecuencia para futuros smokes: **nunca marcar FAIL "faltan cobros en la lista"** en difranca.
> El tope de 100/vendedor es el comportamiento esperado. Contrastar siempre contra la BD local.

---

## §2 · Detalle de 3 cobros cotejados contra la nube (tipos distintos)

Se abrieron **3 cobros de `co_type` distinto**, más 2 de apoyo. **Un cobro Enviado abre con 3 tabs**
(`default` / `total` / `adjuntos`) — sin Documentos ni Pagos (reconfirma `[gmp-20260730][el_palmar-20260805]`).

### a) Nro. Ref **21831** — `co_type=3` **IGTF** (el único IGTF de toda la BD)

| Campo | Móvil | Nube | ✓ |
|---|---|---|---|
| Cliente | `MEGA SOL, C.A. (CAR090)` | `co_client=CAR090` | ✅ |
| Moneda | BSD | `co_currency=BSD` | ✅ |
| Tasa | 752,09 | `nu_value_local=752.0900` | ✅ |
| Fecha Cobro | 7/8/2026, 11:19 A.M. | `2026-08-07T15:19:32Z` (= 11:19 UTC-4) | ✅ |
| Monto total a Pagar | BSD 9.167,98 / US$ 12,19 | `nu_amount_total=9167.98` | ✅ |
| Documentos | 1 (`IGTF-1786115858571.0`, 9.167,98) | `collection_detail`: 1 doc, pagado 9167.98 | ✅ |
| Pagos | Total **Transferencias** BSD 9.167,98 | `collection_payment`: 1 pago, 9167.98 | ✅ |
| Diferencia | 0,00 | — | ✅ |
| Estado rotulado | **Enviado** | `st_collection=1` | ✅ |

📌 El `Nro. Doc.` del IGTF es `IGTF-1786115858571.0`, que es el `co_collection` del **cobro 21830**
⇒ el IGTF de 21830 se cobró **por separado** (modalidad "pago separado"). El vínculo es legible
en el móvil, cosa que **ninguna pantalla de la web expone**.

### b) Nro. Ref **21829** — `co_type=2` **Retención**

| Campo | Móvil | Nube | ✓ |
|---|---|---|---|
| Etiqueta de fecha | **"Fecha Retención"** (no "Fecha Cobro") | `co_type=2` | ✅ |
| Documento | `FACT5000002983` (1 acordeón) | 1 fila en `collection_detail` | ✅ |
| Monto Doc. BSD | 147.439,72 | `nu_balance_doc=147439.72` (**el saldo**, no el monto de la factura) | ✅ |
| Monto IVA / ISLR | 1.000,00 / 500,00 | — | ✅ |
| Monto total retenido | 1.500,00 | `nu_amount_total=1500` | ✅ |
| **Monto total a Pagar** | **BSD 1.500,00** | 1500 | ✅ |
| Pagos | ninguno (sin tab Pagos) | `collection_payment`: 0 filas | ✅ |

🟢 **Dato para el go/no-go — `COB-RET-TOTAL-CERO` NO se manifiesta en el móvil.** El defecto conocido
es que el detalle **web** muestra "Total Monto a pagar" en **0,00** para retenciones. En el móvil
el mismo cobro 21829 muestra **1.500,00 correctamente**. ⇒ si el defecto existe, es **de la web**.

### c) Nro. Ref **21832** — `co_type=0` cobro normal en US$ con IGTF incluido

| Campo | Móvil | Nube | ✓ |
|---|---|---|---|
| Moneda | US$ | `co_currency=US$` | ✅ |
| IGTF | US$ 18,62 / BSD 14.003,92 | `nu_igtf=3.0000` (3 % de 620,67 = 18,62) | ✅ |
| Monto total a Pagar | US$ 620,67 / BSD 466.799,70 | `nu_amount_total=620.67` · `nu_amount_total_conversion=466799.70` | ✅ |
| Documento | `FACT5000086984` · Monto 620,67 · IGTF 18,62 · Pago 639,29 | 1 doc | ✅ |
| Pago | Transferencia · **BANCO FONDO COMUN** · Ref. `trf` · US$ 620,67 | `nu_amount_partial=620.67` | ✅ |
| Total General | US$ 620,67 | — | ✅ |

### Apoyo: 21830 (US$ 406,23) y 21828 (BSD 706.000,88, con retención y depósito) — también cuadran.

---

## §3 · VGs observadas sin crear nada

### Menú de COBROS — botones realmente presentes

`COBRO` · `ANTICIPO/PREPAGO` · `RETENCIÓN` · `IGTF` · `BUSCAR` — los 5 habilitados.
**NO existe el botón 25 % IVA.**

| VG | Perfil | Observado en UI | Veredicto |
|---|---|---|---|
| `cobroPrepago` | true | botón **ANTICIPO/PREPAGO** presente | ✅ confirmada |
| `cobroRetencion` | true | botón **RETENCIÓN** presente | ✅ confirmada |
| `userCanSelectIGTF` | true | botón **IGTF** presente + cobro `co_type=3` real | ✅ confirmada |
| `userCanCollectIva` | false | botón 25 % IVA **ausente** ⇒ DM-COB-037 N/A | ✅ confirmada |
| `signatureCollection` | false | — (no se llegó a Adjuntos) | ⚪ no observada |
| `requiredComment` | true (`tipo_variable='C'`) | ⚠ **no observable**: el campo Comentario solo se renderiza tras seleccionar cliente, y seleccionar cliente quedó fuera del alcance de solo lectura | ⚪ **no observada** |

### Métodos de pago — `colletionPayment` = SIN EFECTIVO

La lista del modal de métodos **no es legible sin seleccionar un cliente** (`paymentMethodList` se
puebla en ese momento; 2 intentos, no alcanzable dentro del alcance de solo lectura).
**Se confirmó por la vía de los datos**, que es evidencia más fuerte:

```
BD local · collection_payments · GROUP BY co_payment_method
  tr (Transferencia) → 111
  de (Depósito)      →   2
```

⇒ **0 pagos en efectivo, 0 cheque, 0 otros, 0 pago móvil** en los 113 pagos de los 100 cobros
sincronizados. Coherente al 100 % con `colletionPayment = false-false-true-true-false-false`
(solo Transferencia y Depósito). **VG confirmada por dato.**

Bancos vistos en los pagos: BANCO FONDO COMUN · BANCO VENEZUELA · BANCO PROVINCIAL ·
BFC BANCO FONDO COMUN C.A. · BANCAMIGA.

### Estado: qué rotula el móvil para `st_collection=1`

**Literal exacto: `Estatus: Enviado`.**

El valor `st_collection=1` **no existe** en el catálogo `statuses` de ninguna de las 3 empresas
(DDHP_A12 cob=7/27 · DIF_A12 cob=2/22 · DHVITAL01_A cob=17/37). El móvil **no consulta ese catálogo**:
rotula por **constantes del componente** `app-cobros-list`, leídas en runtime:

```
COLLECT_STATUS_NEW=0 · SENT=1 · TO_SEND=2 · SAVED=3
```

⇒ `st_collection=1` → `SENT` → **"Enviado"**. Reconfirma `[el_palmar-20260805]`: el hueco del catálogo
del servidor **no afecta** el rotulado del móvil, y no hay que diagnosticar por ahí.

---

## §4 · 🔴 El defecto del cobro IGTF 21831 **NO afecta al móvil**

**Es el dato más relevante de este módulo para el go/no-go.**

Contexto: se confirmó hoy que el cobro **21831** (único `co_type=3` de la BD, creado hoy por QA)
hace que la **lista web** de cobros devuelva el `<tbody>` **vacío** — 18.086 contados / 0 mostrados,
10 de 10 veces, del servidor.

**En el MÓVIL la lista funciona perfectamente:**

| Comprobación | Resultado |
|---|---|
| `app-cobros-list` visible tras BUSCAR | ✅ sí |
| `filteredItems` | **100** (todos los sincronizados) |
| `ion-item` renderizados | 20 (`pageSize=20`) + infinite-scroll operativo |
| **El cobro 21831 aparece en la lista** | ✅ **sí** — `Nro Ref: 21831 · Estatus: Enviado · IGTF` |
| El 21831 abre y se lee completo | ✅ sí (ver §2a) |
| Los cobros posteriores al 21831 (ej. 21832) siguen listándose | ✅ sí |

⇒ **El defecto es EXCLUSIVO de la web.** El móvil convive con el cobro IGTF sin degradarse:
lo lista, lo rotula con su tipo y lo abre con todos sus montos correctos. Esto **acota el impacto**
del defecto a la capa web y **no bloquea la operación móvil** de difranca en el tag 20.

---

## §5 · Hallazgos

### H-COB-1 · 🟡 `Total Depósitos:` imprime el monto sin formato — **REPRODUCE**

Defecto ya visto en globalmp (30/07/2026). Reproducido acá en el cobro **21828**:

```
Total Depósitos:      BSD 706000.88      ← sin separador de miles ni coma decimal
Total Transferencias: BSD 305.521,52     ← (otro cobro) correctamente formateado
```

Cosmético, no afecta montos ni envío. **Severidad baja.** Solo alcanza a los cobros pagados con
Depósito — en difranca son **2 de 113 pagos** (el resto son Transferencia) ⇒ **impacto muy acotado**.

### H-COB-2 · 🟡 Fecha del documento en crudo (ISO) en el acordeón de retención — **REPRODUCE**

También visto en globalmp. En el cobro **21829**:

```
Fecha del documento: 2026-08-03T04:00:00.000+00:00
```

Debería mostrarse como `03/08/2026`. Cosmético. Alcanza a los cobros de retención
(**3 en toda la BD**, 2 sincronizados) ⇒ **impacto muy acotado**.

### H-COB-3 · ⚪ "Pago BSD" mostró un valor dividido por la tasa — **NO REPRODUCIDO** (observación)

En la **primera** apertura del cobro 21832 (US$) el Tab Total mostró:

```
Monto total a Pagar BSD   466.799,70     ← correcto (620,67 × 752,09)
Pago BSD                        0,83     ← 620,67 ÷ 752,09  ⚠
```

**No se pudo reproducir** (2 intentos): al reabrir el mismo cobro y al expandir/contraer los
acordeones, "Pago BSD" mostró siempre **466.799,70** (correcto). El cobro 21830 (US$) mostró el
valor correcto desde la primera lectura.

**La nube guarda el valor correcto** (`nu_amount_partial_conversion = 466799.70`) ⇒ **no hay dato
corrupto**; fue un **estado transitorio de render** que se asienta solo. Hipótesis (no confirmada):
race de la conversión al pasar de un cobro BSD (21831) a uno US$ (21832) sin remontar el componente.

**No se marca FAIL** (RUNTIME §4: solo con evidencia reproducida). Se deja registrado porque toca
la misma familia que `COB-WEB-DCTO-CONV-MULTIPLICA` (la rama multiplicar/dividir de `convertirMonto()`)
y conviene vigilarlo en la próxima corrida con creación habilitada.

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | **NINGUNO** | 🔴 Constancia explícita: esta corrida **no creó, no guardó y no envió** ningún cobro, anticipo ni retención. Se abrió un formulario de COBRO vacío (sin cliente) solo para observar tabs y se salió sin guardar. |

**Verificación de no-intrusión:** `pending_transactions` = **0 filas** · `collections` local = 100
(igual que `sqlite_sequence`=100, sin inserts nuevos) · `id_collection` máximo local = 21832 = máximo
de la nube. **Nada se creó.**

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **El BUSCAR de cobros SÍ descarga de la nube — el hallazgo de el_palmar NO es universal** | **universal (corrige)** | En difranca las 100 filas locales tienen `id_collection>0` del servidor, `st_delivery=1` y `sqlite_sequence=100`. El criterio del recorte es **los N (=100) cobros más recientes del VENDEDOR logueado**, no una ventana de fechas ni el histórico. **Verificar el criterio por playa antes de concluir "historial local"**: contrastar `count(*)` local contra `count(*) WHERE id_user=<vendedor>` en nube, no contra el total de la tabla. `[el_palmar-20260805]` vs `[difranca-20260807]` |
| Oráculo barato de cobertura de lista sin scrollear | universal | `ng.getComponent(document.querySelector('app-cobros-list'))` → `filteredItems` (total real) vs `displayedItems` (renderizados) vs `pageSize`. Evita recorrer la lista paginada para responder "¿cuántos ve la app?" |
| Rotulado de estado por **constantes del componente**, no por catálogo | universal (reconfirma) | `st_collection=1` → `COLLECT_STATUS_SENT` → literal **"Enviado"**, aunque el valor 1 no exista en `statuses` de ninguna empresa. Reconfirma `[el_palmar-20260805]` en una 2.ª playa |
| El tipo de cobro se rotula en el `ion-item` de la lista | universal | El `innerText` del ítem termina con el tipo: `Cobros` / `IGTF` / `Retención`. Permite localizar un `co_type` concreto **sin abrir** el cobro |
| `co_type=3` (IGTF) usa el `co_collection` del cobro origen como Nro. Doc. | universal | El documento del cobro IGTF es `IGTF-<co_collection del cobro padre>`. Es la **única vía visible** de correlacionar el par cobro↔IGTF separado; la web no lo expone. Hermano de `co_original_collection` para anticipos `[el_palmar-20260805]` |
| Métodos de pago habilitados legibles **sin abrir el form** | universal | `SELECT co_payment_method, count(*) FROM collection_payments GROUP BY 1` en la BD local responde `colletionPayment` por evidencia de uso real (`tr`/`de`/`ef`/`ch`/`ot`/`pm`), sin navegar. ⚠ `paymentMethodList` **no** es alcanzable hasta seleccionar cliente |
| No existe tabla `payment_methods` en la BD local | cliente/build | Buscar `name LIKE '%payment%'` devuelve solo `payment_conditions` (condiciones de crédito) y `collection_payments`. No gastar intentos buscando el catálogo de métodos ahí |
| Navegación de lista→detalle→lista en cobros enviados | universal (reconfirma) | 1 back desde el detalle = **menú COBROS** (no la lista) ⇒ hay que volver a pulsar `BUSCAR`. Back = `img.fechaAtras` filtrando `width>0 && x<100` (`src=flecha-blanca.png`). Ciclo repetido 5 veces sin fallo |
| Tab Total: cambiar de tab con `ion-segment.value` + `ionChange` | universal (reconfirma) | Fiable en los 5 cobros abiertos; el click en el segment-button no hizo falta |
| Acordeones del Tab Total: expandir todos de una | universal (reconfirma) | `grp.value = [todos los .value]` + `ionChange`; altura del `[slot=content]` 0 → 320 px con contenido |

> ✅ consolidado 2026-08-07

---

## Verificación BD

**`BD-N/A` por diseño** — módulo de solo lectura, no se creó ningún registro que cotejar
(RUNTIME §10: login/productos/vendedores y las corridas read-only → `BD-N/A`).

Se usó la BD igualmente, en modo **`BD-INFO`**, como oráculo de **cobertura** y de **no-intrusión**:

| Comprobación | Resultado | Marca |
|---|---|---|
| Cobertura local vs nube | 100 / 19.771 (= los 100 últimos del vendedor 275) | `BD-INFO` |
| `pending_transactions` | **0** | `BD-INFO` — nada en cola |
| `failed_transactions` (type collect) | no consultada (no hubo envíos) | — |
| Duplicados (`count(*)` vs `count(DISTINCT co_collection)`) | 100 / 100 | `BD-INFO` — sin duplicados |
| 3 cobros cotejados campo a campo (21831/21829/21832) | **todos cuadran** con la nube | `BD-INFO` |

---

*Agente COBROS · corrida `smoke_difranca_20260807_120232` · 2026-08-07 · SOLO LECTURA · 0 registros creados*
