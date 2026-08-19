# Verificación puntual — ¿qué campos aceptan de verdad el tope que declaran?

| | |
|---|---|
| **Fecha** | 2026-08-19 |
| **Tenant** | `run_vzla` · **CORPORACION FERRE 19** (`FERRE_N`) · playa **LA TORTUGA** |
| **Usuario** | QA `id_user=470` · `co_user='000208'` (login `***` / clave `***`) |
| **App** | `com.kiberno.denarioPremiumPro` v1.0 / db19 · Infinix X6728 360×744 · `window.ng=true` |
| **Tipo** | Verificación puntual **fuera de corrida** (no toca `_results.jsonl` ni `_bd-manifest.jsonl`) |
| **Motivo** | Cerrar la hipótesis abierta por `automation/reports/INCIDENCIA-comentario-visita-120.md` |

---

## Respuesta a la pregunta de la QA

> **NO está pasando solo en visitas: hay un segundo campo que pierde el registro en silencio — la
> Dirección del cliente potencial —, y es PEOR que el de visitas porque ni siquiera declara un tope
> ni reintenta. Los seis campos de *comentario* propiamente dichos que sí se pudieron alcanzar
> aceptan sus 255 caracteres sin perder ni truncar nada.**

---

## 1. Tabla maestra — resultado por campo

| Módulo | Campo | Tope en pantalla | `maxlength` real | Cuánto deja escribir | Largo enviado | Largo en BD nube | Veredicto |
|---|---|---|---|---|---|---|---|
| **Cliente potencial** | **Dirección** (`txAddress`) | **ninguno** (sin contador) | **ninguno** (`maxLength = -1`) | **ilimitado** (tecleé 170, aceptó 170) | 170 | **— (no llegó)** | 🔴 **FALLA** |
| **Cliente potencial** | **Dir. entrega** (`txAddressDispatch`) | **ninguno** | **ninguno** (`maxLength = -1`) | **ilimitado** (170 → 170) | 170 | **— (no llegó)** | 🔴 **FALLA** |
| Visitas | Comentario de actividad | 255 | 255 | 255 | 255 | — (no llegó) | 🔴 **FALLA** — ya probado, no se repitió |
| Cliente potencial | Observación (`txClient`) | 255 | 255 | 255 (tecleé 300) | 255 | **255** | ✅ acepta su tope |
| Devoluciones | Comentario (`#comentario`) | 255 | 255 | 255 (tecleé 300) | 255 | **255** | ✅ acepta su tope |
| Inventarios | Comentario | 255 | 255 | 255 (tecleé 300) | 255 | **255** | ✅ acepta su tope |
| Pedidos | Comentario (`#txComment`) | 255 | 255 | 255 (tecleé 300) | 255 | **255** | ✅ acepta su tope |
| Cobros | Comentario | 255 | 255 | 255 (tecleé 300) | 255 (Guardado) | *no probado* | 🟡 **no probado hasta la nube** (adjunto obligatorio) |
| Depósitos | Comentario | 255 | 255 | 255 (tecleé 300) | — | *no probado* | 🟡 **no probado hasta la nube** (sin insumo consumible) |
| Visitas | Motivo de reagenda | — | — | — | — | — | ⚠️ **no alcanzable** |
| Cobros | Comentario de **descuento** | — | — | — | — | — | ⚠️ **no alcanzable** |

**Extra medido en la misma pasada** (campos de texto libre que no son comentarios, pero comparten el mecanismo):

| Módulo | Campo | `maxlength` | Columna destino | Ancho | Resultado |
|---|---|---|---|---|---|
| Devoluciones | Responsable (`#responsable`) | 80 | `return.na_responsible` | 80 | ✅ 80 escritos → **80 en BD** (tecleé 100) |
| Devoluciones | Precinto (`#precinto`) | 30 | `return.nu_seal` | 30 | ✅ 30 escritos → **30 en BD** (tecleé 50) |
| Cobros | Responsable (`#currency` — el `id` engaña) | 80 | `collection.na_responsible` | 80 | ✅ coinciden (no ejercido al tope) |
| Pedidos | Nro. Compra / Responsable | ninguno | `order.nu_purchase` / `na_responsible` | `text` | ✅ sin riesgo (columna sin tope) |

---

## 2. Anchos reales de columna (nube `run_vzla`, `information_schema.columns`)

| Tabla.columna | Tipo | Ancho | ¿Honra los 255 del input? |
|---|---|---|---|
| `potential_client.tx_address` | varchar | **150** | 🔴 **y el input no declara NINGÚN tope** |
| `potential_client.tx_address_dispatch` | varchar | **150** | 🔴 **ídem** |
| `incidence.tx_description` | varchar | **120** | 🔴 no |
| `collection_detail.discount_comment` | varchar | **100** | 🔴 no (campo no alcanzable en este tenant) |
| `visit.tx_reassign_motive` | varchar | 255 | ⚠️ justo al límite, margen cero |
| `return.tx_description` | varchar | 500 | ✅ |
| `order.tx_comment` · `collection.tx_comment` · `client_stock.tx_comment` · `deposit.tx_comment` · `potential_client.tx_client` | text | — | ✅ |

La predicción del barrido estático **se confirmó en las 11 columnas**. Lo que el barrido **no** anticipaba
es que el campo peor protegido no es el de 120 sino el de 150, porque el de 150 **no tiene tope de entrada
en absoluto**.

---

## 3. 🔴 El hallazgo nuevo — Dirección del cliente potencial

### 3.1 Qué se midió

Se hizo el experimento controlado con **una sola variable**: el largo de la dirección.

| Registro | Observación | Dirección / Dir. entrega | 3.ª alerta de la app | ¿Llegó a la nube? |
|---|---|---|---|---|
| `co_client 1787153935720.0` | **255** | **170 / 170** | *"Cliente potencial nro. **null** creado exitosamente"* | 🔴 **NO** |
| `co_client 1787154117695.0` | **255** | **150 / 150** | *"Cliente potencial nro. **203** creado exitosamente"* | ✅ Sí — `id_client 203`, con `tx_client` **255**, `tx_address` **150**, `tx_address_dispatch` **150** |

La segunda fila **descarta que la causa sea la observación de 255**: con el mismo comentario de 255 y
las direcciones recortadas a 150 el registro entra completo. **La única variable que cambia el resultado
es el largo de la dirección**, y el borde cae exactamente en el ancho de la columna: **hasta 150 pasa,
por encima de 150 se pierde.**

### 3.2 Por qué es más grave que el de visitas

| | Visitas (`tx_description`, 120) | **Cliente potencial (`tx_address`, 150)** |
|---|---|---|
| ¿La app pone tope de entrada? | Sí, 255 (aunque la columna sea 120) | 🔴 **No. Ninguno.** El usuario puede teclear lo que quiera |
| ¿Hay contador en pantalla? | Sí (*"Mín. 0 - Máx. 255"*) | 🔴 **No hay contador** |
| 3.ª alerta (acuse del servidor) | No sale | 🔴 **Sale, y dice `nro. null`** |
| Estado del ítem en la lista | "Por Enviar" | 🔴 **"Estatus: Enviado"** con **Nro. Ref vacío** |
| ¿Se puede reintentar? | Sí, el POST se reintenta en bucle | 🔴 **No.** `pending_transactions = 0` |
| ¿Se puede borrar? | Sí (sigue Guardado) | 🔴 **No. Sin trash** (los Enviados no lo tienen) |
| `failed_transactions` | 0 | 0 |

En visitas el registro al menos **queda atascado y se puede rescatar acortando el texto** (fue justo lo que
hizo la QA a mano el 19/08). Acá **el registro se da por enviado, se marca `st_potential_client=2` en la
BD local con `id_client = null`, sale de la cola y no vuelve a intentarse nunca.** Para el vendedor el
cliente potencial existe y está enviado; en la nube no existe.

### 3.3 Evidencia lado dispositivo

```
BD local (potential_clients)   → co_client='1787153935720.0'
                                 id_client = NULL      ← los registros sanos traen el id del servidor
                                 st_potential_client = 2   ← "Enviado"
                                 length(tx_address) = 170
pending_transactions           → 0 filas   (no está en cola: no se reintenta)
failed_transactions            → 0 filas   (el rechazo no se registra como fallo)
UI · BUSCAR CLIENTE POTENCIAL  → "Cliente: QA-TOPE-CLIPOT-190826 … Nro. Ref:  … Estatus: Enviado"
                                 (Nro. Ref VACÍO, sin botón de borrado)
```

### 3.4 Evidencia lado servidor

```sql
SELECT count(*) FROM potential_client WHERE co_client='1787153935720.0';   -- 0
```

Comprobado **inmediatamente después del envío y de nuevo ~25 minutos más tarde**: 0 filas las dos veces.

Además, **la secuencia de `id_client` tiene un hueco justo donde debía caer ese registro**: existen `201`
y `203`, y **`202` no existe en toda la tabla**. Es coherente con un `INSERT` que el servidor intentó y
abortó (`value too long for type character varying(150)`) quemando el valor de secuencia. ⚠ Lo doy como
**indicio corroborante, no como prueba** — había otra sesión QA transaccionando con el mismo usuario
durante la verificación (ver §6) y el hueco podría ser suyo.

### 3.5 Producción — todavía no ha mordido, pero está a 14 caracteres

```sql
SELECT count(*), max(length(tx_address)), count(*) FILTER (WHERE length(tx_address)=150)
FROM potential_client WHERE co_operation IS DISTINCT FROM 'D' AND id_client <> 203;
-- 195 registros · máximo 136 · ninguno en 150
```

Es exactamente el mismo cuadro que describía la incidencia (188 / 136 / 0), ahora con 195 registros.
**El riesgo dejó de ser teórico: está medido.**

---

## 4. Lo que se comprobó que SÍ funciona

Los cuatro módulos con columna `text` o `varchar(500)` **aceptan sus 255 caracteres de punta a punta**,
verificado con `length()` sobre la nube:

| Registro creado | Módulo | Comentario en BD |
|---|---|---|
| Devolución **Ref 352** (`co_return 1787154439691.0`) | Devoluciones | `length(tx_description)` = **255** |
| Inventario **Ref 59** (`co_client_stock 1787154715133.0`) | Inventarios | `length(tx_comment)` = **255** |
| Pedido **Ref 2822** (`co_order 1787154921973.0`) | Pedidos | `length(tx_comment)` = **255** |
| Cliente potencial **Ref 203** (`co_client 1787154117695.0`) | Cliente potencial (observación) | `length(tx_client)` = **255** |

En los cuatro, el `maxlength` del input frena exactamente en 255 aunque se tecleen 300 caracteres, el
contador de pantalla llega a `255/255`, y el texto llega íntegro (comprobado también por el final del
texto, no solo por el largo).

**Devoluciones es el módulo mejor alineado de todos**: sus tres campos de texto libre de cabecera declaran
exactamente el ancho de su columna (comentario 255 → varchar 500 · responsable 80 → varchar 80 ·
precinto 30 → varchar 30) y los tres frenan en el tope correcto al teclear de más.

### 4.b Cobros — round-trip local ✅, viaje a la nube **no probado**

`requiredCollectionAttachments/Anticipo/Retention = true` ⇒ un cobro no se puede **Enviar** sin adjunto, y
la instrucción vigente de la QA es no usar mock de cámara. Se hizo por tanto el oráculo §9:

1. Cobro nuevo, cliente `006540`, comentario tecleado de 300 → el input frenó en **255** (`validComment`
   pasó a `true` y se destrabaron las 4 tabs y el Guardar).
2. **Guardar** → `"El Cobro se ha guardado"` → BD local: `tx_comment` de **255**, `st_delivery=3`, `id_collection=0`.
3. Salir → **BUSCAR** → reabrir el Guardado → el campo vuelve con **255** caracteres y el contador en `255/255`.

⇒ **El round-trip local es correcto. Que 255 caracteres lleguen a `collection.tx_comment` en la nube queda
SIN PROBAR** — aunque la columna es `text`, igual que las tres que sí se verificaron.

### 4.c Depósitos — medido en pantalla, **no probado hasta la nube**

El formulario **sí es alcanzable** (contra lo que decía `modules.depositos.aplica: false` del perfil): abre,
renderiza `app-deposito-general` y su comentario declara *"Mín. 0 - Máx. 255 caracteres"* con `maxlength=255`,
que frena en 255 al teclear 300.

**No se envió a propósito.** El Tab COBROS lista **un solo cobro elegible** (GENESIS CASTILLO, Ref 32996,
5 US$). Consumirlo dejaría a la QA sin el insumo del pendiente **B** de su propio perfil (*"correr DEPÓSITOS
con ≥ 2 cobros en efectivo enviados"*). ⇒ **no probado hasta la nube**, no "correcto".

---

## 5. Lo declarado NO ALCANZABLE (con la medición que lo sostiene)

| Campo | Por qué | Evidencia leída en vivo |
|---|---|---|
| **Comentario de descuento de cobros** (`discountComment` → `collection_detail.discount_comment` **varchar(100)**, input 255) | La VG está apagada | `collectService.userCanSelectCollectDiscount === false` leído del modelo del cobro abierto. El menú no ofrece descuento. |
| **Motivo de reagenda de visitas** (`motivoReagendo` → `visit.tx_reassign_motive` **varchar(255)**) | El rol no lo habilita | En `app-visita`: `showReagendarModal === false`, `rolTransportista === false`, `motivoReagendo === ""` y **0 apariciones** de la cadena "reagend" en el `innerText` del formulario. Coherente con `transportRole=false`. |

⚠ **Los dos siguen siendo riesgo real donde la VG o el rol estén activos**, y el de descuento es el más
apretado de todos: **columna 100 contra un input que declara 255** — 155 caracteres de margen para perder
el detalle del cobro. No se pudo medir; **no se marca como correcto**.

---

## 6. Riesgos NUEVOS del mismo patrón — medidos en el DOM, **NO provocados**

Al abrir cada formulario se listaron todos sus campos de texto y se cruzaron con el ancho de su columna.
Aparecieron **dos campos más sin ningún `maxlength` contra columnas estrechas**, exactamente el mismo
mecanismo que acaba de perder el cliente potencial:

| Módulo | Campo | `maxlength` | Columna destino | Ancho |
|---|---|---|---|---|
| Devoluciones (línea) | **Nro. Factura** (texto libre, obligatorio) | **ninguno** (`maxLength = -1`) | `return_detail.co_document` | **varchar(30)** |
| Devoluciones (línea) | **Lote** (texto libre) | **ninguno** (`maxLength = -1`) | `return_detail.nu_lote` | **varchar(30)** |

**No se provocaron** para no arriesgar otra pérdida en un tenant productivo. El riesgo **escala por línea**:
una devolución puede cerrar N facturas y basta con que **una** supere 30 caracteres para —si se comporta
como el cliente potencial— perder la devolución entera sin aviso. 📋 Vale la pena revisarlos junto con el
resto.

---

## 7. Qué se creó y qué se borró

| Registro | Estado | ¿Borrado? |
|---|---|---|
| Cobro Guardado `co_collection 1787155240658.0` (cliente 006540) | Guardado, nunca enviado | ✅ **BORRADO** — trash → *"¿Desea eliminar el Cobro?"* `[Eliminar]`; verificada la desaparición de la fila en la BD local |
| Cliente potencial **Ref 203** `QA-TOPE-CLIPOT-B` | Enviado a la nube | ❌ **No borrable** — los Enviados no tienen trash |
| Devolución **Ref 352** | Enviada | ❌ No borrable |
| Inventario **Ref 59** | Enviado | ❌ No borrable |
| Pedido **Ref 2822** | Enviado | ❌ No borrable |
| Cliente potencial `co_client 1787153935720.0` (`QA-TOPE-CLIPOT-190826`) | 🔴 **Fantasma**: existe solo en la BD local del dispositivo, rotulado "Enviado" con Nro. Ref vacío | ❌ **No borrable** — sin trash. **Es la evidencia viva del defecto**: si se quiere limpiar, hay que borrarlo desde la BD local o dejarlo como prueba |

No se creó ningún registro en visitas ni en depósitos. El formulario de visita y el de depósito se
abrieron, se midieron y se salió con **"Salir sin guardar"**. La app quedó en **HOME**.

⚠ **Nota de higiene del entorno:** durante la verificación hubo **otra sesión QA transaccionando con el
mismo `id_user=470`** (aparecieron 4 clientes potenciales `Test-CLT-SMOKE-*` — ids 199/200/201/204 — y
varios `client_stock` que no cree yo). Por eso **ningún veredicto de este reporte se apoya en un `count(*)`
ni en un `max(id)`**: todos se anclan al `co_*` (epoch) exacto del registro creado.

---

## 8. Consultas de verificación

```sql
-- A. El registro con dirección de 170 nunca llegó
SELECT count(*) FROM potential_client WHERE co_client = '1787153935720.0';   -- 0

-- B. El mismo formulario con dirección de 150 sí llega, y con la observación completa
SELECT id_client, length(tx_address), length(tx_address_dispatch), length(tx_client)
FROM potential_client WHERE co_client = '1787154117695.0';                   -- 203 | 150 | 150 | 255

-- C. Los cuatro comentarios de 255 que sí llegaron
SELECT length(tx_description) FROM "return"      WHERE co_return       = '1787154439691.0';  -- 255
SELECT length(tx_comment)     FROM client_stock  WHERE co_client_stock = '1787154715133.0';  -- 255
SELECT length(tx_comment)     FROM "order"       WHERE co_order        = '1787154921973.0';  -- 255

-- D. Producción todavía no muerde (excluyendo el registro de QA)
SELECT count(*), max(length(tx_address)), count(*) FILTER (WHERE length(tx_address) = 150)
FROM potential_client WHERE co_operation IS DISTINCT FROM 'D' AND id_client <> 203;  -- 195 | 136 | 0

-- E. Anchos de columna (la consulta barata que hay que correr ANTES de teclear al tope)
SELECT table_name, column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE (table_name, column_name) IN (
  ('potential_client','tx_address'), ('potential_client','tx_address_dispatch'),
  ('incidence','tx_description'), ('collection_detail','discount_comment'),
  ('return_detail','co_document'), ('return_detail','nu_lote'));
```

---

## 9. Qué debería arreglarse

1. 🔴 **Poner `maxlength` a Dirección y Dir. entrega del cliente potencial** (o ensanchar las columnas a
   `text`, como ya están `tx_client` y los otros cinco comentarios). Hoy no hay **ningún** freno del lado
   de la app.
2. 🔴 **Ensanchar `incidence.tx_description` a 255 o `text`** — sigue siendo la propuesta de la incidencia
   original y esta vuelta la confirma: es la única de las siete columnas de comentario que no honra los 255.
3. 🔴 **Un envío rechazado por el servidor tiene que verse.** Este caso es la prueba más fuerte hasta ahora
   de que el silencio es un defecto por sí mismo, independiente del ancho: la app mostró
   ***"creado exitosamente"* con `nro. null`**, marcó el registro como Enviado, lo sacó de la cola y no
   dejó nada en `failed_transactions`. **La 3.ª alerta no sirve como acuse del servidor si puede salir con
   `null`**: o valida que hay un Ref real, o no debería salir.
4. 🟠 **Revisar `Nro. Factura` y `Lote` de las líneas de devolución** (§6) y **`collection_detail.discount_comment`**
   (§5): mismo patrón, no ejercidos.
5. 📋 **Alinear la VG `longitudComentario` (250)** con la constante de la app (255). Sigue siendo un tercer
   número que no gobierna nada.

---

## 10. Método aplicado — vale para cualquier campo de texto nuevo

**El `maxlength` del input no es el tope: el tope es el mínimo entre el `maxlength` y el ancho de la
columna. Y un input sin `maxlength` no significa "sin límite", significa "el límite lo pone la BD y nadie
avisa".**

Receta barata, antes de teclear al tope:

1. Leer `input.maxLength` de cada campo del formulario (`-1` = sin tope declarado ⇒ **bandera roja**).
2. Correr la consulta E de §8 sobre las columnas destino.
3. Comparar. Si `maxLength > ancho`, o si `maxLength === -1` y el ancho no es `text`, hay riesgo de pérdida.
4. Al probar, variar **una sola cosa por vez** y bisecar contra el ancho de la columna.

---

*Verificación puntual · Claude Code · 2026-08-19 · app dejada en HOME · sin cambios en `../src/`*
