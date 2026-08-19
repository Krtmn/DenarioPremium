# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_092435_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Cliente | grupo_fiel — GRUPO FIEL, S.A. (GRUFISA) `00001` / id 1 (empresa única) |
| Usuario | johana · `co_user='003'` · `id_user=463` |
| Dispositivo | Infinix X6728 (HOT 60i) · `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db19 · `window.ng=true` · `sqlitePlugin` OK |
| Playa | **El Yaque** — `http://denarioelyaque.ddns.net:8081/PremiumWS/services/` |
| Resultado | **13 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |
| Watchdog | 0 cuelgues · 0 `TIMEOUT` · 0 `CDP-DOWN` · sin reconexiones |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | `/devoluciones`; botones **DEVOLUCIÓN** (180,107) y **BUSCAR** (180,176) visibles |
| DM-DEV-002 | ✅ PASS | Form abre con tabs **Productos/Adjuntos `disabled=true`**, sin cliente; `imagenGuardar`/`imagenEnviar` ambos `disabled=true` |
| DM-DEV-004 | ✅ PASS | Cliente `MP GELATO C.A. (J-504863246)` fijado con **click real** (ítem 43/61); modal cierra solo; **3 tabs habilitan**. `validateReturn=false` ⇒ sin campo Factura en cabecera (correcto por VG) |
| DM-DEV-006 | ✅ PASS | `#responsable`=`QA AUTOMATIZACION`, `#precinto`=`PRE-88123`, `#comentario`=`QA smoke devoluciones 20260817`; Tipo (2.º `ion-select`) abre **`ion-popover`** con 3 opciones → **Servicio(59)** (no-default), shadowRoot rotula `Servicio` |
| DM-DEV-011 | 🚫 N/A | `returnLogic.validateReturn=false` **leído en el modelo**: no existe `ion-input#invoiceSelect` ni `#InvoiceeSelectModal` en cabecera. El Nro. Factura va **por producto** (`requeridedNroFactura=true`) y viaja como `coDocument`. VG inactiva ⇒ N/A por §4 |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO → familia inline `Desechable (4)` → `1.5LTS`; acordeón `1786979371137.0` expande con **Lote · Nro Factura · Fecha Venc · Cantidad Devuelta · Unidad(CAJA) · Motivo** |
| DM-DEV-014 | ✅ PASS | Con `Nro Factura=B066127` + `Cantidad=6`, **`imagenEnviar` pasó `disabled` true→false en el mismo tick** (par antes/después medido). Motivo cambiado a **48 · Tiempos de Despacho (Servicio)** |
| DM-DEV-015 | ✅ PASS | Tab ADJUNTOS con los **3 acordeones**: `images` (Imágenes) · `file` (Archivo, `userCanUploadFiles=true`) · `sign` (Firma, `signatureReturn=true`, canvas 280×220) |
| DM-DEV-016 | ✅ PASS | Alert `Denario Devolución` / **"¡Su Devolución se ha guardado!"** `[OK]`. Local: `co_return=1786979219811.0`, `id_return=0`, `st_delivery=3` ⇒ **BD-SAVED** (correcto, aún sin enviar) |
| DM-DEV-018 | ✅ PASS | **3 alertas**: `¿Desea enviar la devolución?` `[Cancelar/Aceptar]` → `¡Su Devolución será enviada!` `[OK]` → **`Devolución nro. 2 enviada exitosamente`** `[OK]`. Navega al home del módulo. Nube `id_return=2`, `st_return=1` ⇒ **BD-OK** |
| DM-DEV-019 | ✅ PASS | Lista con Nro.Ref / Cliente / Estatus / Fecha: `Ref 2 · MP GELATO · Enviado`, `Ref 1 · BELMENY · Enviado`, `Ref 0 · Guardado`. Trash por ítem = `[1,0,0]` (solo el Guardado) |
| DM-DEV-021 | ✅ PASS | Filtro en tiempo real: `BELMENY`→1 ítem, `GELATO`→1 ítem. ⚠ **Vaciar el buscador SÍ repuebla** (vuelve a 2) — contraejemplo de `PRD-BUSCADOR-NO-REPUEBLA` |
| DM-DEV-022 | ✅ PASS | Reabre el Guardado **editable**, 3 tabs accesibles; **round-trip §9 12/12 valores idénticos** (ver abajo) |
| DM-DEV-024 | ✅ PASS | Trash → `¿Desea eliminar la devolución?` `[Cancelar/**Eliminar**]` → ítem desaparece. **Sin alert de éxito post-borrado** (consistente insumar/globalmp). Local `returns`=0 **y** `return_details`=0 para ese `co_return`: sin detalles huérfanos |

---

## Oráculo de persistencia §9 — Guardar → reabrir desde BUSCAR

Comparación 1:1 tras reabrir la devolución Guardada. **Cero divergencias silenciosas.**

| Campo | Guardado | Al reabrir | ✓ |
|---|---|---|---|
| Cliente | `MP GELATO C.A. (J-504863246)` | idem | ✅ |
| Responsable | `QA AUTOMATIZACION` | idem | ✅ |
| No. Precinto | `PRE-88123` | idem | ✅ |
| Comentario | `QA smoke devoluciones 20260817` | idem | ✅ |
| Tipo (no-default) | `Servicio` / `59` | `59`, shadowRoot `Servicio` | ✅ |
| Empresa | objeto `idEnterprise:1 / 00001` | idem, `disabled=true` | ✅ |
| Producto | `1.5LTS — Caja de Agua 1.5lts 6und` | idem | ✅ |
| Nro Factura | `B066127` | idem | ✅ |
| Cantidad Devuelta | `6` | idem | ✅ |
| Unidad | `CAJA` / `1` | idem | ✅ |
| Motivo (no-default) | `48 — Tiempos de Despacho (Servicio)` | idem | ✅ |
| Lote / Fecha Venc | vacío / `null` | vacío / `null` | ✅ |

**Sabor "cambio conservado" cubierto en 2 campos** (Tipo `60→59` y Motivo `49→48`): ambos sobrevivieron el round-trip sin revertir al default.

---

## Verificación BD

**Baseline (apertura):** `SELECT count(*), max(id_return) FROM "return"` → **1 y 1**.
**2.º baseline-diff (cierre):** `total=2 · maxid=2 · nuevas(id>1)=1 · duplicados=0`.

### Registro enviado — `co_return 1786979219811.0` · Ref **2** · **BD-OK**

| Capa | Estado |
|---|---|
| **Nube** (`return` / `return_detail`) | `id_return=2`, `st_return=1` (Enviado), 1 fila en `return_detail` (`co_detail=3`) |
| **Local** (`returns` vía `window.sqlitePlugin`) | `id_return=2`, `st_delivery=1` (enviado) |
| **`pending_transactions`** (`type='return'`) | **0** |
| **`failed_transactions`** (`type='return'`) | **0** |
| **Duplicados** | `count(*) = count(DISTINCT co_return)` ⇒ **0** |
| **Payload** | POST `returnservice/return` capturado **1 sola vez y con body** completo |

**Conclusión guardado→enviado: SÍ.** Lo que se guardó (`st_delivery=3`/`id=0`) se envió y llegó (`st_delivery=1`/`id_return=2`, fila durable en nube). **Sync INMEDIATA** (<10 s: el correlativo del servidor ya venía en el 3.er alert).

### Cotejo campo-a-campo (local-driven) — cabecera 14/14 + detalle 7/7 = **21/21**

| Campo local | Valor | Nube | ✓ |
|---|---|---|---|
| `co_return` | `1786979219811.0` | idem | ✅ |
| `na_responsible` | `QA AUTOMATIZACION` | idem | ✅ |
| `nu_seal` | `PRE-88123` | idem | ✅ |
| `id_type` | `59` | idem | ✅ |
| `tx_comment` → `tx_description` | `QA smoke devoluciones 20260817` | idem | ✅ (fieldMap) |
| `co_client` / `na_client` | `J-504863246` / `MP GELATO C.A.` | idem | ✅ |
| `co_enterprise` / `id_enterprise` | `00001` / `1` | idem | ✅ |
| `id_client` / `id_user` | `401` / `463` | idem | ✅ |
| `coordenada` | `11.0490212,-63.8649873` | idem | ✅ |
| `nu_attachments` / `has_attachments` | `0` / `false` | idem | ✅ |
| `st_return` | `0` local → `1` nube | — | ⓘ campo de servidor (excluido) |
| **detalle** `co_product` | `1.5LTS` | idem | ✅ |
| **detalle** `na_product` | `Caja de Agua 1.5lts 6und` | idem | ✅ |
| **detalle** `qu_product` | `6` | `6.0000` | ✅ |
| **detalle** `co_measure_unit` / `na_measure_unit` | `CJA` / `CAJA` | idem | ✅ |
| **detalle** `nu_lote` / `da_duedate` | `""` / `null` | idem | ✅ |
| **detalle** `co_document` | `B066127` | idem | ✅ |
| **detalle** `id_motive` | `48` | idem | ✅ |

**Marca: `BD-OK` / `BD-FIELD-OK`.** `nu_amount`, `co_currency`, `co_type` y `co_motive` llegan `null` — **esperado**, no mismatch: devoluciones no maneja montos (confirmado a nivel de esquema y payload en `[gmp-20260730]`, y ratificado acá).

⚠ **`cotejo-bd.js` devolvió `BD-N/A`** porque su mitad local usa `local-query.js` → `run-as: exec failed for sqlite3: No such file or directory` (quirk conocido del build v1.0/db19). El cotejo de arriba se hizo **a mano** con la mitad local leída por `window.sqlitePlugin` — mismo criterio local-driven, mismo veredicto.

### Registro borrado — `co_return 1786979709567.0` · **BD-N/A (esperado)**
Creado solo para DM-DEV-024 (330ML ×3, factura `B066129`, responsable `QA BORRADO`). Nunca se envió (Guardado, Ref 0) y se eliminó. **Nube: `count=0` para ese `co_return`** — su ausencia es el resultado correcto. Local: `returns`=0 **y** `return_details`=0.

---

## Registros creados en sistema

| Ref | epoch (`co_return`) | Cliente | Factura | Líneas | Estado | BD |
|-----|---------------------|---------|---------|--------|--------|-----|
| **2** | `1786979219811.0` | `J-504863246` MP GELATO C.A. | `B066127` | 1 — `1.5LTS` ×6 CAJA, motivo 48 | **Enviado** (`st_return=1`) | ✅ BD-OK |
| 0 | `1786979709567.0` | `J-504863246` MP GELATO C.A. | `B066129` | 1 — `330ML` ×3 CAJA | **Eliminado** (creado para DM-DEV-024) | BD-N/A (esperado) |

---

## Veredictos de VG solicitados

### 🔴 `requiredComment=true` — **NO aplica a DEVOLUCIONES**

Alcance **acotado a COBROS**. Evidencia medida (no inferida):
- `ion-input#comentario` llega con **`required=false`** y `ng-valid` estando vacío.
- Con Cliente + Tipo + producto + `Nro Factura` + `Cantidad` completos y **el Comentario VACÍO**, `imagenGuardar` **y** `imagenEnviar` quedaron ambos `disabled=false`. Es decir: **el comentario vacío no bloquea ni Guardar ni Enviar, y tampoco bloquea las tabs** (las 3 habilitaron con solo elegir cliente).
- Contraste directo: en COBROS de esta misma corrida la VG **sí** es obligatoria y bloquea las tabs.

⇒ **Misma VG, alcance por módulo.** Que la devolución manual de la QA trajera `tx_description='test_dev1'` fue elección de la usuaria, no una exigencia de la app. El comentario se llenó igual en la corrida para dar sustancia al cotejo, pero **no era obligatorio**.

### 🔴 `expirationBatch=true` — **NO vuelve obligatorios Lote ni Fecha de vencimiento en DEVOLUCIONES**

**3.ª confirmación del alcance por módulo** (tras `[el_palmar-20260805]` y `[difranca-20260807]`):
- Ambos campos **se renderizan** (input `Lote` + `ion-button.letrasFechasButton` → `ion-datetime#fechaVence0`).
- Se dejaron **los dos vacíos** y el Enviar habilitó, el envío procedió sin alert, y viajaron como `nuLote:""` / `daDueDate:null`, persistiendo así en nube (`nu_lote=''`, `da_duedate=null`).

⇒ Consistente con la regla: **obligatoria en INVENTARIOS, inocua en DEVOLUCIONES.** No derivar un módulo del otro.

### Observación de datos del cliente — basura del catálogo `return_type` (**NO es defecto de la app**)

La tabla `return_type` de la nube tiene **9 filas**, pero **6 están marcadas `co_operation='D'` (borradas)**:

| `id_type` | `na_type` | `co_operation` | ¿llega al device? |
|---|---|---|---|
| 60 | Calidad | `I` | ✅ sí |
| 52 | PostVenta | `U` | ✅ sí |
| 59 | Servicio | `U` | ✅ sí |
| 53 | **Despacho** | `D` | ❌ no |
| 56 | hola | `D` | ❌ no |
| 54 | problemas | `D` | ❌ no |
| 58 / 55 | prueba (×2) | `D` | ❌ no |
| 57 | Prueba Tovar | `D` | ❌ no |

`returnLogic.returnTypes` trae exactamente **3** y el popover lista exactamente **3**: la basura **nunca se muestra en la app** — el filtro de borrados se aplica en la **sincronización**. 3.ª confirmación del patrón `co_operation='D'` no baja al device.

📌 **Corrección al brief de la corrida:** "Despacho" figuraba como uno de los tipos *reales*, pero en BD está **borrado** (`co_operation='D'`). Los tipos reales de grupo_fiel son **solo Calidad / PostVenta / Servicio**. La higiene de datos pendiente en el catálogo es cosmética (registros muertos en BD), sin impacto funcional.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **Selector de EMPRESA de DEVOLUCIONES: 4.ª variante — `disabled=TRUE` + OBJETO completo como `value`** | universal (build v1.0/db19, 1 empresa) | Con UNA empresa, el 1.er `ion-select` de `app-devolucion` llega **sin `formcontrolname`, `disabled=true`, `.select-disabled`, `ng-pristine`** y con el **objeto** empresa entero (`{idEnterprise:1, coEnterprise:"00001", lbEnterprise:"GRUPO FIEL, S.A. (GR", coCurrencyDefault:"BS", prioritySelection:0,…}`). Amplía la tabla de variantes de `_comunes.md`: el_palmar (2 emp.) y difranca (3 emp.) lo vieron **`disabled=false`** + objeto; acá con 1 empresa es **`disabled=true`** + objeto. ⇒ en DEVOLUCIONES el **tipo de `value` (objeto) es estable**, lo que varía con el nº de empresas es el `disabled`. **En ambos casos: no tocar nada.** Distinto de CLIENTES, donde el discriminador es `value=null`/`ng-invalid` |
| **Dos `ion-select` del MISMO formulario abren overlays DISTINTOS: Tipo → `ion-popover`, Motivo → `ion-alert`** | universal *(candidato — 3.ª confirmación del quirk)* | En `app-devolucion`: **Tipo** (cabecera, 3 opciones) abre `ion-popover` con `ion-item`+`ion-radio`, se resuelve con **1 click**; **Motivo** (acordeón, 24 opciones) abre `ion-alert` de **26 botones** = 24 opciones + `Cancel`/`OK`, y necesita **2 clicks** (opción → acción). Ratifica que **la variante es por CONTROL, no por build ni por formulario**: probar popover y, si da `[]`, leer el alert activo |
| **Botones de acción en INGLÉS (`Cancel`/`OK`) también en el alert de Motivo de DEVOLUCIONES** | universal (build El Yaque v1.0/db19) | 2.ª confirmación tras COBROS de esta corrida. Un recorrido `['Aceptar','Cancelar']` **no encuentra nada**; `['OK','Aceptar']` resuelve. Sumar `Cancel`/`OK` al repertorio |
| **Reparto de etiquetas de alert del módulo (leídas, no predichas)** | cliente | Guardado → `[**OK**]` · Envío → `[Cancelar/**Aceptar**]` → `[**OK**]` → `[**OK**]` · Borrado → `[Cancelar/**Eliminar**]` · Motivo → `[…/Cancel/**OK**]`. El orden de preferencia `['Aceptar','OK','Eliminar']` + igualdad exacta case-insensitive + filtro `width>0` resolvió **los 8 alerts del módulo sin un solo reintento** |
| **Envío = 3 alertas en grupo_fiel (la 3.ª trae el correlativo real)** | cliente | `Devolución nro. **2** enviada exitosamente` ⇒ **la Ref se puede leer del 3.er alert acá**. Contrasta con `[difranca-20260807]` (solo 2 alertas, sin la 3.ª). Confirma `Ref UI = id_return` |
| **`ion-item` de `#clienteSelectModal` con rect 0×0 = el modal está CERRADO, no "el cliente no existe"** | universal | El 2.º intento de abrir el selector devolvió el ítem correcto con `{cx:0,cy:0,w:0}` porque el click en `ion-input#clienteSelect` no había abierto el modal. **Fix: `pg.waitForFunction` sobre `#clienteSelectModal.show-modal` + `ion-item.length>0` ANTES de leer el rect** — resolvió a la 1.ª. Hermano del quirk de `alipascua` ("el síntoma era timing"); el `waitForFunction` lo vuelve determinista en vez de "clickear de nuevo y ver" |
| **La lista del `#clienteSelectModal` PERSISTIÓ entre aperturas** | cliente | 1.ª apertura: 50→61 con **1 vuelta** de `onIonInfinite` (corte por `scrollDisable===true`); 2.ª apertura: ya venían los **61**, sin repaginar. Alinea con alipascua/el_palmar y **contrasta con difranca**. Igual conviene paginar siempre: es barato y el corte por `scrollDisable` es inmediato si ya está completa |
| **Los campos del acordeón se llenan COLAPSADO y se localizan por `ion-input.label`** | universal (2.ª confirmación tras difranca) | La 2.ª devolución se completó (`Nro Factura`, `Cantidad Devuelta`) **sin expandir el acordeón**, buscando por `x.label==='Nro Factura'`. Más estable que el índice y que `.inp-write` (que **cambia de clase al editar**: `inp-write ng-invalid` → `sc-ion-input-md-h md input-fill-`) |
| **⚠ Contraejemplo de `PRD-BUSCADOR-NO-REPUEBLA`** | cliente | En la lista de DEVOLUCIONES, borrar el texto del `ion-searchbar` con `Backspace` **SÍ repobló** la lista (2 ítems, sin empty-state). El defecto documentado como "universal en 3 playas" **no reproduce acá** ⇒ conviene reetiquetarlo como *frecuente pero no universal*, o acotarlo a los módulos donde sí se observó |
| **`returnLogic` es el oráculo barato de las VGs del módulo** | universal | `ng.getComponent(document.querySelector('app-devolucion')).returnLogic` expone `validateReturn`, `requeridedNroFactura`, `bloquearFactura`, `validateClient`, `userMustActivateGPS`, `returnTypes`, `returnMotives`, `invoices`. **Anclar a `app-devolucion`** y **serializar dentro del `evaluate`** (`returnValid*` son `Subject` de RxJS ⇒ `JSON.stringify` del objeto entero revienta con circular structure) |
| **`app-cliente-selector` es el componente dueño de la paginación** | universal | `ng.getComponent(document.querySelector('app-cliente-selector'))` expone `clientes`, `scrollDisable`, `onIonInfinite`, `searchText`. ⚠ `app-devolucion.selectorCliente` figura en `Object.keys` pero llega **falsy** ⇒ ir por el componente hijo, no por la propiedad del padre |
| **Higiene de namespace: `__qaDEV` (3 letras) instaló limpio** | universal | Confirma la corrección de `[grupo_fiel-20260817]/COBROS`: el sufijo de 3 letras evita la colisión que sufrió `__qaC`. `__qaH` heredado del agente LOGIN traía solo 5 skills **sin captura**, pero `window.__qaPayloadsData` + `__qaDataHook` **sí** estaban vivos ⇒ se consumió el array directo **sin reinstalar** y el POST se capturó **1 sola vez y con body** (0 duplicados) |

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

---

## Hallazgos

**Ninguno.** 0 FAIL. Todo lo que podría leerse como anomalía quedó explicado y verificado:

- Comentario/Lote/Fecha no obligatorios ⇒ **alcance por módulo de la VG**, no incumplimiento (medido con el par botones antes/después).
- `nu_amount` / `co_currency` / `co_type` / `co_motive` en `null` ⇒ **devoluciones no maneja montos**, patrón ya establecido.
- Basura del catálogo `return_type` ⇒ **registros `co_operation='D'` que no bajan al device**; observación de datos del cliente, no defecto de la app.
- `cotejo-bd.js` en `BD-N/A` ⇒ **limitación de infra** (`sqlite3` ausente en el build), suplida con `window.sqlitePlugin`; no contamina el veredicto.

---

*Agente DEVOLUCIONES · 2026-08-17 · 0 cuelgues de CDP · 0 casos BLOCKED · estado final: HOME*

---

## Verificación BD (payload ↔ nube) — Agente BD, cotejo campo-a-campo automático

**Payloads con endpoint `returnservice/return`:** 1. Corresponde a la devolución `co_return = 1786979219811.0`
(Ref 2). La devolución eliminada del caso DM-DEV-024 (`co_return 1786979709567.0`) **no aparece en
`_payloads.jsonl`** — nunca llegó a capturarse un envío para ella, consistente con que se borró antes de Enviar.
No se reporta como mismatch ni como BD-N/A: no hay payload de origen.

| co_return | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| `1786979219811.0` | **BD-FIELD-OK** | 14/14 OK | `return_detail` 1/1 líneas OK | **0** | 1 (zona horaria) |

**Detalle — 0 mismatches.** Los 14 campos de cabecera (`co_return, da_return, na_responsible, nu_seal, id_type,
tx_description, id_user, co_client, id_client, coordenada, co_enterprise, id_enterprise, nu_attachments,
has_attachments`) coincidieron payload↔nube. La única línea hija (`return_detail`, producto `1.5LTS`, factura
`B066127`) coincidió en sus 9 campos comparados, incluido `qu_product` (6 vs `6.0000`: mismo valor con el formato
decimal de la BD, no es mismatch).

**Notas de calibración:**

1. `da_return` — payload `2026-08-17 11:06:59` vs nube `2026-08-17T15:06:59.000Z`: 4 h de diferencia
   (local UTC-4 vs nube UTC) ⇒ **nota**, no mismatch, tal como está calibrado en `cotejo-payload.js`.
2. `nu_lote` / `da_due_date` (vacíos en el payload: `""` / `null`) fueron correctamente **salteados** por el motor
   (regla payload-driven: vacío/null no se compara) ⇒ el cotejo **automático** confirma lo que el agente UI ya
   había verificado a mano: `expirationBatch` no los vuelve obligatorios en este módulo.
3. `nu_amount` / `co_currency` no aparecen en el reporte del motor porque no están en el payload — devoluciones
   **no maneja montos por diseño** ⇒ sin falsa alarma.
4. No se detectaron campos del payload sin columna en nube ni campos extra sin mapear. El config de devoluciones
   (piloto del Nivel 2) sigue calibrado, sin cambios.

**Conteo por marca:** BD-FIELD-OK 1 · BD-FIELD-MISMATCH 0 · BD-SAVED 0 · BD-N/A 0.

> Este cotejo automático es independiente del manual 21/21 que hizo el agente UI: **ambos coinciden**.
