# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260818_152824_smoke-completo` |
| Módulo | DEPÓSITOS (10.º y último módulo móvil) |
| Cliente / tenant | `run_vzla` — **CORPORACION FERRE 19** (`FERRE_N`, `id_enterprise=1`) |
| Dispositivo | Infinix X6728 · serial `14678405BR003855` · viewport **360×744** |
| App | `com.kiberno.denarioPremiumPro` — **v1.0 / db19** · `window.ng=TRUE` · `sqlitePlugin` OK |
| Playa | **LA TORTUGA** — `http://denariolatortuga.ddns.net:8081/PremiumWS/services/` (host del POST `depositservice/deposit` capturado) |
| Usuario QA | `id_user=470` · `co_user='000208'` |
| Fecha de ejecución | 2026-08-19 (10:42 – 11:00 VET) |
| CDP | `:9220` → PID **29842**. Pre-vuelo de 3 comandos OK **antes** del primer `connectCdp`; 0 cuelgues, 0 `TIMEOUT:`, 0 crashes |
| Watchdog | `moduleMs = 45 min` con `page` — nunca disparó |
| Resultado | **11 PASS · 1 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** (12 casos) |

> 🟢 **`modules.depositos.aplica` = `false` en el perfil quedó DEROGADO.** El motivo registrado
> ("sin insumo") dejó de ser válido: la QA envió a mano los 4 cobros el 19/08 y **2 de ellos son
> efectivo**. Verificado en pantalla antes de ejecutar: el Tab Cobros abrió con **3 depositables
> vivos**. ⇒ **`aplica: true` — actualizar el YAML.**

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Home del módulo con **DEPÓSITO** (83,107) y **BUSCAR** (76,176). Entrada en **2,32 s**, 0 `ion-loading` ⇒ **la guarda de GPS NO se manifiesta en depósitos** |
| DM-DEP-002 | ✅ PASS | Form en **2,49 s**. 4 tabs: General habilitada, **Cobros/Total/Adjuntos `disabled=true`**. Campos: Banco (`ion-select.selectbanco`), Banco/cuenta (readonly), Nro. Plantilla, Comentario, Fecha Depósito (disabled) y Fecha Doc. `imagenGuardar` (267,32) y `imagenEnviar` (326,32) **ambos `disabled=true`** |
| DM-DEP-004 | ✅ PASS | `ion-select.selectbanco` → **`ion-popover` con 15 cuentas** (1 click) → **BANCARIBE - \*\*\* 0885358** (`idBankAccount 29`, `coBank 006`). Cuenta autollenada `01140200312000885358`; **las 4 tabs habilitan** |
| DM-DEP-005 | ❌ **FAIL** | El `fechasModal` abre y confirma correctamente, **pero el selector NO permite elegir HOY**: `ion-datetime` llega con `max="2026-08-18T04:00:00"` teniendo el device en **19/08/2026 10:44 VET**, y el día **19 está `disabled=true` llevando la clase `calendar-day-today`**. Asignar `dt.value='2026-08-19'` revierte a `18/8/2026`. **Ver H-1** |
| DM-DEP-006 | ✅ PASS | **No hay campo Monto libre** (confirmado): el monto se deriva del Tab Cobros. Al marcar el cobro 32994, `imagenGuardar` **y** `imagenEnviar` pasan de `true` a `false` **en el mismo tick** |
| DM-DEP-009 | ✅ PASS | Guardar (267,32) → alert **`Denario Depósito` / "El Depósito se ha guardado"** `[Aceptar]`. Local: `deposits` 1 fila (`co_deposit 1787150555231.0`, `id_deposit=0`, `st_delivery=3`, **`nu_amount_doc=123.17`**) + `deposit_collects` 1 fila (`id_collection 32994`, `nu_total_deposit 123.17`) |
| DM-DEP-010 | ✅ PASS | 🟢 **El defecto conocido NO reprodujo.** `app-deposito-list` renderizó en **2,22 s**, 1 ítem, 0 `ion-loading` visibles, sin backdrop interceptando: `Nro Ref: 0 \| Banco: 006 \| Estatus: Guardado \| Monto US$: 123.17`, con trash |
| DM-DEP-014 | ✅ PASS | Click (120, `y+16`) al **1.er intento** → form con **todos los datos íntegros** (banco, cuenta, `DEP-QA-0819`, comentario, Fecha Doc 18/8/2026), 4 tabs habilitadas, Guardar y Enviar habilitados, abre en tab **General**. Round-trip §9 OK |
| DM-DEP-017 | ✅ PASS | **Depósito Nro. Ref 4 ENVIADO.** 3 alertas: (1) `Denario Depósito — El Depósito será enviado` `[Cancelar, **Aceptar**]` → (2) `Denario Premium — El Depósito será enviado` `[**OK**]` → (3) `Denario Premium — **Depósito nro. 4 enviado exitosamente**` `[**OK**]`. Local `id_deposit=4`, `st_delivery=1`, `st_deposit=1`. **1 solo POST** (sin bucle). **BD-OK** |
| DM-DEP-018 | ✅ PASS | BUSCAR tras Enviar: lista en **2,22 s**, `Nro Ref: **4** \| Estatus: **Enviado** \| Monto US$: 123.17`, **trash ausente**. Ref 0 → Ref real 4 |
| DM-DEP-019 | ✅ PASS | Ítem Enviado abre al **1.er intento**. Solo lectura: los 3 `ion-select` y los 3 `ion-input` `disabled=true`, ambas `letrasFechasButton` `disabled`, **sin `imagenGuardar`/`imagenEnviar`/trash** y **el segmento Cobros DESAPARECE** (quedan General/Total/Adjuntos) |
| DM-DEP-020 | ✅ PASS | 2.º depósito (5,00 US$, cobro 32996) → trash (300,211) → alert **`Denario Depósito — "¿Desea eliminar el depósito seleccionado?"` `[Cancelar, **Aceptar**]`** → desaparece de la lista, de `deposits` **y su fila de `deposit_collects`** (borrado en cascada). Nunca llegó a la nube |

---

## Registros creados en sistema

| Ref | `co_deposit` (epoch) | Banco / cuenta | Nro. Plantilla | Monto | Cobro vinculado | Estado |
|-----|----------------------|----------------|----------------|-------|-----------------|--------|
| **4** | `1787150555231.0` | **BANCARIBE** `coBank 006` · `01140200312000885358` | `DEP-QA-0819` | **123,17 US$** | `id_collection 32994` (`1787144733832.0`, MARIBEL HAMMANI BESERENI, efectivo) | ✅ **ENVIADO — BD-OK** |
| — | `1787151141091.0` | DEL SUR `coBank 003` · `01570042473742206372` | *(vacío)* | 5,00 US$ | `id_collection 32996` (GENESIS CASTILLO) | 🗑 **Eliminado** (caso DM-DEP-020) — nunca viajó a la nube |

**Comentario del Ref 4:** `Smoke DM-DEP run_vzla 19-08` · **Fecha Doc:** `2026-08-18` (forzada por H-1) · **Fecha Depósito:** `2026-08-19 10:42:35`.

**Estado local al cierre** (`window.sqlitePlugin`): `deposits` **1 fila** (la enviada) · `deposit_collects` **1 fila** · `pending_transactions` **0** · `failed_transactions` **0** · sin duplicados.

---

## 🔴 Verificación BD — el defecto que este módulo venía a resolver

### Veredicto 1 · `deposit.nu_amount_doc` — **NO REPRODUCE**

| `id_deposit` | Fecha | `id_user` | `nu_amount_doc` | Σ cobros vinculados | ¿Cuadra? |
|---|---|---|---|---|---|
| 1 | 13/07/2026 | 525 | **0,0000** | 170,64 | ❌ |
| 2 | 16/07/2026 | 518 | **0,0000** | 266,59 | ❌ |
| 3 | 19/08/2026 | **470** (QA, a mano) | **227,0000** | 227,00 | ✅ |
| **4** | **19/08/2026** | **470 (esta corrida)** | **123,1700** | **123,17** | ✅ |

- El depósito creado por el smoke llegó con **`nu_amount_doc = 123.1700`**, idéntico al total de la UI
  (`Monto total depositado 123.17 US$`) y al `nuAmountDoc: 123.17` del payload.
- **Último caso afectado: 16/07/2026** (`id_deposit=2`), y ambos ceros son de **otros vendedores**
  (525 y 518), **ninguno del usuario QA**. **Cero reproducciones** en los 2 registros creados hoy.
- ⇒ Por el **gate §4.b**: **NO es defecto de la release en prueba.** Es una **observación sobre datos
  históricos, sin reproducciones desde el 16/07/2026**.
- ⚠ Precisión: esto prueba *"no ocurre en nada reciente"*, **no** *qué* lo corrigió. Mismo desenlace que
  el `collection.nu_amount_total=0` de COBROS — la hipótesis del prompt (“es plausible que tampoco
  reproduzca”) se confirma, ahora **medida**, no asumida.
- 📌 **Corolario para la web:** el `Monto depositado: 0,00 US$` que el detalle web muestra sobre una
  tabla hija de `266,59` corresponde al **`id_deposit=2` del 16/07**. La web **es fiel a la fuente**;
  no es defecto de la web **ni** de la app en su versión actual.

### Veredicto 2 · `deposit_collection_payment` — **sigue VACÍA, y NO es oráculo**

- Antes de la corrida: **0 filas**. Después del depósito Ref 4: **0 filas**. El POST no la puebla.
- ⚠ Nulabilidad medida **por tabla** (como se pidió): las 5 columnas de
  `deposit_collection_payment` son **`is_nullable = YES`**, y su `co_operation` es **`integer`**
  (no `char`), a diferencia de `deposit.co_operation` (`YES`, char) — **no comparten dominio**.
- ⇒ **5.ª confirmación** (`[ins-2622][grupo_fiel][kron]` + los 2 depósitos previos de este tenant +
  el creado hoy) de que **esa tabla nunca se puebla**. El guión ya está corregido; **esto lo ratifica
  en un 5.º tenant y NO debe marcarse `BD-MISMATCH`** → va como `BD-INFO`.
- **Los 3 oráculos válidos del vínculo cobro↔depósito cuadran los 3, 1:1:**
  1. **Nube — FK invertido:** `collection.id_deposit = 4` para `id_collection = 32994` ✅
  2. **Payload:** `collectionIds:[32994]` (y `depositCollect:[]` vacío, como está documentado) ✅
  3. **BD local:** `deposit_collects` → `co_deposit 1787150555231.0` ↔ `id_collection 32994` ✅

### Baseline / diff (filtrado por `id_user=470`, con `count(*)`, tomado justo antes de Enviar)

`deposit WHERE id_user=470 AND co_operation IS DISTINCT FROM 'D'` → **1 antes / 2 después**;
`count(*) = count(DISTINCT co_deposit)` = **2 = 2** (sin duplicados). El depósito borrado
(`1787151141091.0`) → **0 filas en nube** ✅. `pending_transactions` y `failed_transactions` en **0**
todo el módulo.

---

## Hallazgos

### H-1 · 🟠 S3 — El selector **Fecha Doc** no deja elegir HOY: se congela en la fecha en que arrancó la sesión

**Reproduce en la versión en prueba, sobre un registro NUEVO** (gate §4.b superado), y **también en el
depósito que la QA creó a mano hoy** (`id_deposit=3`), lo que descarta que sea un artefacto de la
automatización.

| Señal | Valor medido |
|---|---|
| Fecha/hora del device | `Wed Aug 19 2026 10:44:43 GMT-0400` |
| `Fecha Depósito` (idx 0, calculada) | `19/8/2026, 10:42 a. m.` ✅ correcta |
| `depositService.dateDeposit` | `2026-08-19 10:42:35` ✅ |
| **`depositService.fechaMayor`** (el `max`) | **`2026-08-18T04:00:00`** 🔴 |
| `ion-datetime` | `max="2026-08-18T04:00:00"`, `value="2026-08-18T04:00:00"` |
| Día **19** en el calendario | **`disabled=true`** y con clase **`calendar-day-today`** |
| `app-deposito-general.daDocument` | `2026-08-19T04:00:00` ✅ (hoy — **contradice al servicio**) |

- **Contradicción dentro del MISMO formulario:** *Fecha Depósito* dice 19/08 mientras *Fecha Doc* topa
  en 18/08 y marca el 19 como deshabilitado.
- **Causa raíz confirmada en código** — `src/app/services/deposit/deposit.service.ts:78`:
  ```ts
  public fechaMayor: string = this.dateServ.hoyISO();
  ```
  Es un **inicializador de campo**: se evalúa **una sola vez, al construir el servicio singleton**
  (arranque de la app / sesión) y **nunca se refresca**. La app lleva viva desde el **18/08** ⇒
  `fechaMayor` quedó clavado en el 18/08. El template lo consume tal cual
  (`deposito-general.component.html:117`: `max="{{this.depositService.fechaMayor}}"`).
- 🔴 **El mismo patrón existe en COBROS**: `collection-logic.service.ts:305` declara `fechaMayor` igual,
  y en `cobro-general.component.ts:626-627` se refresca `fechaMenor` pero **la línea que refrescaría
  `fechaMayor` está COMENTADA** (`//this.collectService.fechaMayor = this.dateServ.hoyISO();`) ⇒
  los 6 `ion-datetime` de métodos de pago de cobros heredan el mismo tope congelado.
- **Impacto real:** un vendedor que deja la app abierta de un día para otro —el caso normal— **no puede
  fechar el depósito en el día en que lo hace**; la app lo obliga silenciosamente a la fecha anterior y
  ese valor **viaja a la nube** (`deposit.da_document = 2026-08-18` en los Ref 3 **y** 4). Los depósitos
  1 y 2 (julio) tienen `da_document = da_deposit` **el mismo día**, coherente con sesiones abiertas y
  cerradas dentro de la jornada.
- ⚠ **Acotación honesta:** con la app recién abierta el mismo día, el tope sería el correcto y el
  defecto **no se vería**. Lo que se prueba es que **el tope no se recalcula al cruzar la medianoche**.
  No se reinició la app para no perder el CDP a mitad de módulo.

### H-2 · 🟡 S4 — Un cobro **ya depositado en la nube** se sigue ofreciendo como depositable en el device

- El cobro **32993** (227,00 US$, efectivo) tiene **`collection.id_deposit = 3` en la nube** desde las
  09:10 VET de hoy, y aun así **aparece marcable en el Tab Cobros** en las 3 aperturas del formulario.
- Mecanismo: la tabla local **`deposits` llegó VACÍA** (0 filas) pese a que la nube tenía histórico, y
  `deposit_collects` solo conoce los depósitos hechos **en este device** ⇒ el filtro de depositables no
  tiene forma de saber que otro dispositivo/sesión ya lo depositó. Confirma
  `[el_palmar-20260805]` ("los depósitos históricos no bajan al device") y le agrega la consecuencia.
- **Riesgo:** doble depósito del mismo cobro. **No se ejerció a propósito** (tenant productivo): se
  eligió deliberadamente 32994 y 32996 y se dejó 32993 intacto.
- Se reporta como **riesgo de dato**, no como defecto confirmado — falta el oráculo de si el servidor
  rechaza el 2.º vínculo. 📋 **Confirmar con desarrollo.**

---

## Descubrimientos

1. 🔑 **`requiredComment` NO aplica a DEPÓSITOS — 7.º y último módulo, MAPA CERRADO.** Doble
   contrafactual medido: (a) con banco + fecha + cobro marcado y **Nro. Plantilla y Comentario ambos
   vacíos**, Guardar y Enviar pasaron de `disabled=true` a `false` **en el mismo tick**
   (`nuDocument:""`, `txComment:""`); (b) el 2.º depósito se **guardó entero con los dos campos
   vacíos** (`nu_document=''`, `tx_comment=''` en local). Ningún `ion-input` del form trae
   `required=true`. ⇒ **3.ª confirmación entre tenants** (grupo_fiel, kron, run_vzla) y **cierre de la
   serie de 7 módulos de esta corrida: `requiredComment` aplica SOLO a COBROS.**
2. ✅ **No hay adjunto obligatorio en depósitos** — verificado en pantalla, no asumido: el Tab Adjuntos
   trae los 3 acordeones (`images` / `file` / `sign`) y **Guardar y Enviar ya estaban habilitados con 0
   adjuntos**; el envío completó sin tocar ningún botón de cámara. ⇒ **Contrasta con cobros/anticipo/
   retención (los 3 en `true`)** y confirma que la VG de adjunto es **por módulo**. No hizo falta el
   mock de cámara ni dejar nada en Guardado.
3. ⚠ **`signatureDeposit=true` NO obligó a firmar** — Guardar y Enviar completaron sin firma.
   Coherente con la aclaración de QA del 2026-07-29: **la VG habilita, no obliga.** No es defecto.
4. 🟡 **`currencyBank=true` no es discriminable en este tenant** — las 15 cuentas bancarias vienen
   **todas con `coCurrency:"US$"`** y `coEnterprise:"FERRE_N"`. Además el `ion-select` de **Moneda llega
   `disabled=true` con 1 sola opción**, así que **la trampa "cambiar moneda resetea el banco"
   (latino_cosmetica/grupo_fiel) es estructuralmente inalcanzable acá**. Se documenta como N/A por dato,
   no como VG verificada.
5. 🟡 **El rótulo `Banco: 006` (código crudo) también está en el MÓVIL, no solo en la web.** El ítem de
   `app-deposito-list` imprime `Banco: 006` teniendo `naBank="BANCARIBE"` disponible en el propio
   `value` del `ion-select`. La observación web del perfil **se amplía: es de producto, no de la web.**
6. ⚠ **Inconsistencia cosmética de la Referencia — 3.ª confirmación** (el_palmar, kron, run_vzla): el
   Tab **Cobros** rotula `32994` (`id_collection`) y el Tab **Total**, misma fila, `1787144733832.0`
   (`co_collection`). El payload viaja `collectionIds:[32994]` ⇒ **observación, no defecto.**
7. ✅ **El borrado libera el cobro y limpia el hijo.** Tras eliminar el 2.º depósito, `deposit_collects`
   quedó sin su fila (borrado en cascada) y **el cobro 32996 volvió a ofrecerse** en el Tab Cobros.
   ⇒ **Contrasta con `VIS-INCIDENCIA-HUERFANA` de visitas**, donde el hijo sobrevive: acá el borrado es
   limpio en las dos tablas.
8. ✅ **La guarda de GPS NO se manifiesta en DEPÓSITOS**: **2,32 s** para entrar al módulo y **2,49 s**
   para abrir el formulario, con `userMustActivateGPS=true` y `coordenadas` pobladas en el servicio
   (`11.049023,-63.8649938`, y viajaron en el payload). Nueva medición para la serie: inventarios ~87 s ·
   devoluciones 43,1 s · pedidos 30,3 s · visitas 6,85 s · cobros 2,3 s · **depósitos 2,3 s**.
   ⇒ **Refuerza que el tiempo escala con el VOLUMEN que carga el form al abrir, no con el GPS** — el
   form de depósito nace casi vacío (los cobros se cargan al entrar a la tab).
9. 🔑 **La secuenciación de ≥2 cobros en efectivo funcionó exactamente como predijo la lección de
   grupo_fiel/kron:** con 32994 y 32996 se cubrieron **Enviar Y borrar** en la misma corrida, y el pool
   bajó de 3 → 2 al consumir el primero. **1.ª corrida de la serie que cierra DM-DEP-017 y DM-DEP-020
   sin dejar ninguno en N/A por datos.**
10. ⚠ **`deposit_collects` local trajo el valor CORRECTO del efectivo** (`nu_total_deposit = 123.17` =
    `deposits.nu_amount_doc`), sin la divergencia total-vs-efectivo de `[grupo_fiel-20260817]` — acá el
    cobro era 100 % efectivo, así que el caso no discrimina.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **`fechaMayor` es un INICIALIZADOR DE CAMPO ⇒ el tope de fecha se congela al arrancar la sesión** | universal (código de producto) | `deposit.service.ts:78` y `collection-logic.service.ts:305`: `public fechaMayor: string = this.dateServ.hoyISO();`. En COBROS la línea que lo refrescaría está **comentada** (`cobro-general.component.ts:627`). **Oráculo barato en cualquier módulo con fecha: comparar `<svc>.fechaMayor` contra `new Date()` del device ANTES de dar por buena una fecha por defecto.** Ver H-1 |
| **El tile de HOME puede devolver rect 0×0 si se lee demasiado pronto** | universal | `p.closest('a').getBoundingClientRect()` devolvió `{x:0,y:0,w:0,h:0}` en la 1.ª lectura tras entrar a HOME; el click a (0,0) no navega y **destapa alertas ajenas**. **Re-leer el rect y exigir `w>0 && h>0` antes de clickear**; con el layout asentado el tile `Depósitos` da (286, 339) |
| **DEPÓSITOS no atraviesa la guarda de GPS** | cliente (build v1.0/db19 La Tortuga) | 2,32 s módulo / 2,49 s formulario, 0 `ion-loading`. 6.ª medición de la serie de GPS de esta corrida |
| **Los 3 `ion-select` del form abren `ion-popover` (1 click), 0 `ion-alert` de radios** | universal | Empresa `disabled=true` + objeto · **Moneda `disabled=true` + objeto, 1 opción** (nuevo: en kron/grupo_fiel la moneda era editable) · Banco `.selectbanco` `disabled=false`, `value={}`, 15 opciones. **Ninguno tiene `formcontrolname`** ⇒ vía programática por string descartada |
| **Selector de empresa en DEPÓSITOS: variante "objeto completo" sin `formcontrolname`** | universal | 9.ª confirmación. `disabled=true`, `value` = objeto de 8 claves, shadowRoot rotulando `CORPORACION FERRE 19` (`lb_enterprise`). **Nada que setear** |
| **El rect de Fecha Doc NO se desplazó al elegir el banco** | universal (variabilidad) | 4.º dato del patrón: el_palmar bajó 477→348 · grupo_fiel no se movió · kron subió 462→543 · **run_vzla no se movió** (542,66 antes y después). **Confirma que el desplazamiento no es predecible: releer el rect siempre** |
| **`ion-datetime`: `#confirm-button`/`#cancel-button` en el shadowRoot + `max` que hay que LEER** | universal | La receta `dt.value=ISO` + `ionChange` → coords de `#confirm-button` → `mouse.click` sigue funcionando, **pero falla en silencio si el valor excede `max`** (revierte sin error y se lee como "el modal no confirmó"). **Leer `dt.max`/`dt.min` ANTES de asignar** |
| **Alerts de DEPÓSITOS — reparto exacto medido** | cliente | Guardado `[**Aceptar**]` · Envío 3 pasos `[Cancelar, **Aceptar**]` → `[**OK**]` → `[**OK**]` · **Borrado `[Cancelar, **Aceptar**]`** (⚠ **"Aceptar", NO "Eliminar"** como en cobros) · Dirty-guard `[Guardar y salir · Salir sin guardar · Cancelar]` con `.alert-message` **vacío**. El recorrido `['Aceptar','OK']` por **igualdad exacta** resolvió los 8 alerts **sin un solo reintento** |
| **En DEPÓSITOS, Guardar SÍ deja el form pristine** | universal (por módulo) | Tras Guardar, el back **no disparó el dirty-guard**; sí lo disparó saliendo de un form nuevo sin guardar. Se suma al mapa "varía por módulo" (devoluciones sí / pedidos no) |
| **El ítem de `app-deposito-list` abrió 2/2 al 1.er intento en `x=120, y=rect.top+16`, `{delay:150-180}`** | universal | Incluido el ítem **Enviado** ⇒ **no reproduce** el `# candidato` de `[kron-20260817]` ("el Enviado no navega"). 0 `ion-loading` interceptando en los 3 accesos a BUSCAR |
| **El envío = 3 alertas también acá, y la 3.ª trae el Nro. Ref real** | cliente | `Depósito nro. **4** enviado exitosamente`. Coherente con jerez / latino_cosmetica / ferrenuestro-La-Tortuga ⇒ **La Tortuga = 3 alertas** en las 4 corridas medidas |
| **Namespace `window.__qaDEP`** | universal | `__qaH` llegó **inexistente**; ya estaban `__qaCLI`, `__qaPED`, `__qaDEV`, `__qaINV`, `__qaVIS`, `__qaPRO`, `__qaCOB`. Hook de payload heredado consumido **sin reinstalar** (`__qaDataHook=true`, 760 → 782 payloads, **0 duplicados**) |

---

## Observaciones (no defectos)

1. **Alerta ajena en HOME durante el pre-vuelo:** a los ~49 s de un click fallido apareció
   `¡Alerta! — "¿Desea enviar la visita?"` `[CANCELAR, Aceptar]`, que **se auto-resolvió** antes de
   poder cancelarla. Es coherente con el reintento en bucle de la visita atascada por el defecto del
   comentario >120 caracteres (ver `INCIDENCIA-comentario-visita-120.md`). **No se tocó**; no afecta a
   depósitos.
2. **`nuAmountDoc` del servicio lee `0` mientras la UI muestra el total correcto** durante toda la
   edición (`totalDeposit:0` / `nuAmountDoc:0` con el pie en `123.17 US$`). **No es el campo que se
   persiste**: al guardar, `deposits.nu_amount_doc` quedó en `123.17` y el payload viajó con
   `nuAmountDoc: 123.17`. **No confundir el campo del modelo con el persistido** al diagnosticar.
3. **`nu_amount_doc_conversion = 0` y `nuValueLocal = 0`** en el registro nuevo: correcto en tenant
   mono-moneda (`hardCurrency=""`), misma lógica ya aceptada en pedidos. No es dato faltante.
4. **La BD local `deposits` arrancó VACÍA** con 3 depósitos en la nube — confirma
   `[el_palmar-20260805]`. **No confundir con defecto de render.**

---

## Resumen técnico

- **12 casos · 11 PASS · 1 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED.** 0 cuelgues de CDP, 0 crashes,
  0 reintentos de selector más allá del techo. Wall-clock ≈ **18 min**; **17 llamadas** a
  `browser_run_code_unsafe`.
- **`depositos.aplica` pasa de `false` a `true`**: el módulo se ejecutó completo por primera vez en este
  tenant, con **≥2 cobros en efectivo**, cubriendo **Enviar Y borrar sin ningún N/A por datos**.
- 🔴 **Los dos veredictos que se pedían:**
  - **`deposit.nu_amount_doc` → NO REPRODUCE.** El Ref 4 llegó con `123.1700`, exacto. Los únicos ceros
    son de julio (13/07 y 16/07) y de **otros vendedores**. Baja a **observación histórica**.
  - **`deposit_collection_payment` → sigue en 0 filas**, pero **NO es oráculo** (5.ª confirmación):
    el vínculo real viaja por `collection.id_deposit`, `collectionIds[]` y `deposit_collects`, **y los
    tres cuadran 1:1**. Marca **`BD-INFO`**, nunca `BD-MISMATCH`.
- **1 defecto nuevo (S3):** `fechaMayor` congelado en la fecha de arranque de la sesión ⇒ **no se puede
  fechar un depósito HOY**; confirmado en código y presente **también en COBROS** (con el refresco
  comentado). **1 riesgo de dato (S4):** cobro ya depositado en la nube que el device vuelve a ofrecer.
- **`requiredComment` cierra el mapa de los 7 módulos: aplica SOLO a COBROS.**
- App devuelta a **HOME**, 0 alerts, 0 modals, 0 loadings, `pending_transactions` y
  `failed_transactions` en **0**.
