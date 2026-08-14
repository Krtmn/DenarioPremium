# Smoke Test Consolidado — Denario Premium Móvil · EL PALMAR
## 10 módulos · Android USB · Playwright MCP + CDP · capa web activa

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-08-05 |
| **RUN_ID** | `20260805_133539_smoke-completo` |
| **Cliente** | el_palmar — **CENTRAL EL PALMAR, S.A.** (`1002`, id_enterprise 1) · 2ª empresa: C.A. DESTILERIA YARACUY (`1003`) |
| **Playa** | **Isla Coche** (`denarioislacoche.ddns.net`) |
| **Dispositivo** | 14678405BR003855 (Infinix X6728, Android 15) |
| **App** | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 |
| **Vendedor QA** | `***` — coUser 1276 / idUser 266 ("Dilcia Duarte"), 144 clientes asignados |
| **Tasa del día** | 652,9726 (VES = 1 USD) |
| **Resultado global** | **97 PASS · 1 FAIL · 0 SKIP · 39 N/A · 0 BLOCKED** de 137 casos |
| **Re-corrida 2026-08-06** | PEDIDOS re-ejecutado completo con la APK corregida: **14/14 PASS**, sus 10 N/A pasaron a PASS. Ver §"Re-corrida" al final |

**Primera corrida de este cliente.** Perfil `automation/clientes/el_palmar.yaml` creado en el arranque desde
los 2 dumps de configuración (127 VGs, 17 conflictos: 14 gana el global / 3 gana el override de cliente).

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP | N/A | BLK | Estado |
|--------|-------|------|------|------|-----|-----|--------|
| Login | 6 | 6 | 0 | 0 | 0 | 0 | ✅ |
| Clientes | 12 | 12 | 0 | 0 | 0 | 0 | ✅ |
| Pedidos | 14 | **14** | 0 | 0 | **0** | 0 | ✅ **re-corrido 06/08 con la APK corregida** (era 4 PASS / 10 N/A) |
| Cobros | 34 | 0 | 0 | 0 | 34 | 0 | 🔒 solo lectura (decisión de QA) |
| Devoluciones | 14 | 13 | 0 | 0 | 1 | 0 | ✅ |
| Inventarios | 16 | 15 | 0 | 0 | 1 | 0 | ✅ |
| Depósitos | 12 | 11 | 0 | 0 | 1 | 0 | ✅ |
| Visitas | 16 | 14 | 0 | 0 | 2 | 0 | ✅ |
| Productos | 10 | 9 | **1** | 0 | 0 | 0 | ⚠️ |
| Vendedores | 3 | 3 | 0 | 0 | 0 | 0 | ✅ |
| **TOTAL** | **137** | **97** | **1** | **0** | **39** | **0** | |

**0 BLOCKED · 0 cuelgues de CDP · 0 módulos abortados** — corrida completa.

## Registros creados y verificados (móvil → BD → web)

| Módulo | Ref | Detalle | Empresa | BD | Web |
|--------|-----|---------|---------|----|-----|
| Clientes | **31** | `Test-CLT-SMOKE-135439` · RIF J987654321 | 1002 ✅ | BD-OK | WEB-OK |
| Devoluciones | **73** | RON SANTA TERESA · factura `0092002924` · lote `LOTE-QA-0805` · venc. 28/08/2026 | 1002 ✅ | BD-OK | WEB-OK |
| Inventarios | **17** | RON SANTA TERESA · `160000019` ×7 FARDO · `exh` · lote `LOTEQA0805` | 1002 ✅ | BD-OK | WEB-OK |
| Depósitos | **3** | Provincial Cepsa · `DEP-QA-0805` · 6.820,4436 VES | 1002 ✅ | BD-OK | WEB-OK |
| Visitas | **18** | RON SANTA TERESA · actividad 47 MERCHANDISING | 1002 ✅ | BD-OK | pendiente |
| Pedidos | — | ninguno (módulo bloqueado, ver H1) | — | — | — |

**Pendientes de envío manual:** ninguno.
**La empresa efectiva fue 1002 en los 5 registros**, verificada en UI + payload + BD. El
`enterprise_default` local apunta a **YARACUY (1003)** pero **nunca se materializó** en ningún módulo.

## Capa WEB — 25 cobros del día + 4 registros del móvil

Playa **Isla Coche** · Empresa **CENTRAL EL PALMAR** · Modo **READ-ONLY**

> **Alcance especial pedido por QA:** *«en el móvil validás los cobros ya enviados, pero en la web necesito
> que valides TODOS LOS COBROS DE HOY, porque no todos salen en el móvil, y hay que asegurarse de que los
> cálculos estén bien: retenciones, IGTF, pago parcial, dev/faltantes, todo».*

**Cobros:** 25 verificados (27068-27092) — **17 WEB-OK · 8 WEB-CALC-MISMATCH · 0 WEB-MISSING · 0 WEB-N/A**.
**Registros del móvil:** 4 verificados — **4 WEB-OK** (clientes 31 · devoluciones 73 · inventarios 17 ·
depósitos 3).

⚠ Aparecieron refs **27093-27097** durante el barrido de cierre: **fuera de alcance**, quedan para una
próxima tanda.

---

# HALLAZGOS

## H1 · 🔴 Pedidos no lista productos con la moneda en Bs — **causa confirmada por QA**

> **Planteado por la responsable QA y confirmado en UI:** *«en el módulo de pedidos, con la empresa EL PALMAR,
> la moneda debe ser USD porque con Bs NO aparecen los productos»*.

**Contraste medido en la misma sesión, mismo cliente y formulario, cambiando solo el selector de moneda:**

| Categoría (badge) | **VES** | **USD** |
|---|---|---|
| `Azucar` (badge 8) | **0** — "No hay productos disponibles" | **6 productos** |
| `PVA` (badge 30) | **0** — "No hay productos disponibles" | **0** |

**Respaldo de datos** (`price_list`, `co_operation<>'D'`):

| Empresa | USD | VES |
|---|---|---|
| 1002 EL PALMAR | 396 filas / **39 productos** | 1 fila / **1 producto** |
| 1003 YARACUY | 247 filas / 18 productos | **0 / 0** |

**La causa última es el par `(lista de precios activa × moneda del pedido)`, no la moneda sola.** Acotando a
la lista que el pedido realmente usa (**Z12**, id_list 11): **USD → 13 filas / 7 productos; VES → 0 / 0**.
El único precio VES de la 1002 vive en la lista **Z01**, que este cliente no usa — por eso lo esperado con
VES es 0 y no 1. Y los 7 productos con precio en Z12 son 160000005 (Alcohol) + los 6 de Azucar: **ninguno de
PVA**, lo que explica que PVA siga vacía incluso con USD.

**El selector de moneda viene por defecto en VES** (2.º `ion-select` del Tab General, sin `id` ni `label`).

**Lectura de la evidencia:** el filtro por precio es **diseño**; el defecto es **ofrecer VES —y traerla
preseleccionada— cuando la lista asignada no tiene ni un precio en esa moneda**, sin ningún mensaje que lo
explique. Sobre `hideProdWithoutPrice=false`: apunta a defecto, pero no se pudo comprobar que esa VG gobierne
este filtro (build minificado) ⇒ **candidato, a confirmar con desarrollo**.

✅ **El módulo queda ejecutable eligiendo USD** — se cargó `160000010` ×2 (Total Base USD 115,00 · IVA 18,40 ·
Total 133,40, conversión correcta) y se salió sin guardar. **Conviene re-correr PEDIDOS completo**; sus 10 N/A
pasan a ejecutables. Salvedad: solo 6 de 39 productos son cotizables en Z12.

### ⚠ Dos diagnósticos previos quedaron REFUTADOS en el camino

Ambos están corregidos en `pedidos.md` (banner al inicio) y marcados **NO PROMOVER**:

1. **`unit_pricelist` vacía** — falso. La app **no lee** esa tabla (`unitByPriceList=false`) y Productos cotiza
   los 57 productos con ella en 0 filas. **Pedirla al equipo de datos habría sido trabajo perdido.**
2. **"Pedidos no expande el subárbol de estructuras"** — falso. Con USD, `Azucar` **sí** lista sus productos,
   lo que sería imposible si no resolviera el subárbol. La moneda tapaba a la otra hipótesis.

## H2 · ❌ FAIL — la búsqueda de productos no normaliza tildes

`DM-PRD-006`. Buscar **`AZÚCAR`** (el nombre exacto que la app muestra) devuelve *"No hay productos
disponibles"*; **`AZUCAR`** sin tilde devuelve los 8. Descartado el teclado: `input.value` y
`comp.searchText` contenían `AZÚCAR` (codepoint 218). **La app normaliza el nombre del producto pero no el
término tecleado.** Severidad propuesta: **S2** (el usuario no encuentra un producto escribiéndolo bien).

## H3 · 🟡 EN OBSERVACIÓN — NO REPORTADO (decisión de QA, 2026-08-06)

> **Decisión de la responsable QA:** **no se reporta por ahora.** Sin pasos de reproducción, desarrollo no
> puede tomar el caso ni buscar la causa, y la tarjeta se cerraría como "no reproduce".
> **Queda en observación: si vuelve a ocurrir, se reporta.**
>
> **Por qué no se pudo dar una receta:** se descartaron por evidencia el sobrepago, el método de pago, la
> moneda y el tipo de cobro. **El patrón resultó ser temporal, no funcional:** los 5 casos caen en una ventana
> de 2 h 12 min del 05/08 (12:48 → 15:00) y **después de las 15:02 no volvió a ocurrir en 15 cobros
> consecutivos**, incluidos sobrepagos de 22 y 38 millones y cobros USD con pago exacto — los dos perfiles de
> los afectados. Dentro de la propia ventana tampoco es determinista (27078 y 27084 salieron bien).
> Dos cobros de prueba creados a propósito el 06/08 (27107 sobrepago · 27109 exacto) **no lo reprodujeron**.
> ⇒ Apunta a un **estado transitorio** de la app (sesión / sincronización), no a una combinación de datos.
>
> **Los 5 registros quedaron mal guardados en producción** y siguen mostrando `N/A` en el listado. La
> evidencia del defecto es sólida; lo que falta es el disparador.

### Detalle técnico (se conserva para cuando reaparezca)

**Se pierde `nu_amount_total` en el cobro con vuelto (5 ocurrencias)**

Los cobros **27076, 27077, 27082, 27085 y 27086** guardan `nu_amount_total = 0` con `nu_amount_final > 0`.
**Correlación perfecta: 5/5 sí, 20/20 no.**

**Síntoma visible:** en la **lista** esos 5 muestran `Monto conv. = "N/A"` y `Tasa conv. = "N/A"`, mientras
`Por cobrar conv.` calcula bien. El **detalle está impecable** — el defecto está confinado a las columnas de
la lista alimentadas por `nu_amount_total*`.

**Causa raíz identificada:** la lista mezcla dos orígenes —`Monto cobrado` sale de Σ
`collection_payment.nu_amount_partial`, pero `Monto conv.` sale de `collection.nu_amount_total_conversion` y
`Tasa conv.` es **derivada** (`Monto conv. / Monto cobrado`) en vez de leer `nu_value_local`. **Prueba:**
`nu_value_local = 652,9726` está bien guardado en 27086 y el detalle lo muestra sin problema; solo la lista
falla. El dato correcto ya existe en BD (`nu_amount_partial_conversion = 869,8680`).

🔴 **El caso de control que lo prueba como defecto:** 27088 (USD) y 27086 (VES) son la **misma operación**,
mismo minuto, mismo cliente, mismo vendedor — sobrepago con vuelto. **27088 guarda `total = 4.865,0000` y
27086 guarda `0`.** No es diseño.

## H4 · 🟡 El detalle del cobro no explica el excedente (UX, no error de cálculo)

En 27088 el detalle muestra `Total Monto a pagar 4.854,7200` y una tabla de pagos de `4.865,0000`, **sin
explicar los 10,28 de brecha**: `Diferencia/Faltante` = 0,0000 en todas las filas y el pie no trae línea de
diferencia. El excedente sí se ve en la **lista** (`Diferencia cobro`), en **BD** (`nu_difference`) y como
**registro propio** (el anticipo). Todos los importes son correctos y trazables ⇒ **sugerencia de UX**.

## H5 · 🔴 BUSCAR de Cobros es un historial 100 % local — nunca descarga del servidor

**El móvil muestra 5 de los 25 cobros del día (20 %).** Visibles: 27081-27085. Ausentes: los otros 20.
**No hay filtro** — se descartaron empresa, estado, fecha y `co_type` con contraejemplos.

**Cadena de evidencia:** `filteredItems=5 < pageSize=20` con infinite-scroll deshabilitado (no es paginación)
· la BD local tiene esas mismas 5 filas con `st_delivery=1`, 0 en cola, 0 rechazos ·
`sqlite_sequence.collections = 11` ⇒ **la BD local nunca tuvo más de 11 cobros** · y el dato decisivo: los
**27086-27092 nacieron durante la corrida**, con el device encendido y sincronizando, y **jamás bajaron**.

**Consecuencias operativas:** un **login limpio borra el historial visible** (se llevó los 13 de la mañana), y
un cobro hecho en otro dispositivo o en la web **nunca** aparecerá.

✅ **De fidelidad no hay problema:** se cotejaron 3 cobros de tipos distintos (normal 27085 / IGTF 27083 /
retención 27081) contra la nube — **3/3 exactos**. Es un problema de **cobertura**, no de datos.
No se marca FAIL porque ningún caso del smoke exige que BUSCAR consulte el servidor. **Para producto:
confirmar si es intencional.**

## H6 · 🟡 Otros

- **`Total Depósitos: VES 10000` sin formato de miles** junto a `Total Efectivo: VES 6.820,4436` — reproduce
  en 2º cliente el defecto de globalmp.
- **IVA de línea como float crudo** en el Tab Total de pedidos: `12014.695840000002 VES`.
- **Borrar una visita Guardada deja la incidencia huérfana** en `incidences` local (2ª playa; basura
  acumulativa, sin impacto en servidor).
- **Vendedores no pinta Cuota / Venta Real Mes** (17 `ng-container` suprimidos) pese a que el modelo trae
  Venta Real Mes USD 133,40. No se elevó a FAIL: no se identificó qué gobierna el `*ngIf`.

---

# PREGUNTAS ABIERTAS DE LA QA — RESPONDIDAS

## "¿Qué son los `co_type` 3 y 4?"

Del `<select> Tipo Cobro` de la web: `0 = Cobros · 1 = Anticipo/Prepago · 2 = Retención · **3 = IGTF** ·
**4 = Cobro 25%**`.

- **`co_type = 3` → "IGTF".** Vehículo del **IGTF separado**: cobro propio sobre un documento sintético
  `co_document = IGTF-<epoch>` con `co_type_doc='IGTF'`, con pagos y sin retenciones.
- **`co_type = 4` → "Cobro 25%".** 🔴 **No aplica ningún 25 %.** Verificado sobre **los 41 cobros
  `co_type=4` de toda la BD**: el ratio pagado/saldo va de **0,0057 % a 100,0000 %**, con **0 de 79 filas** en
  el 25 % (±1 pt) y **6 cobros al 100 %** — lo que descarta también que sea un **tope**. Es un **rótulo sin
  aritmética asociada**: se comporta como un cobro normal con `Pago parcial = SI`.
- **Ninguno de los dos es dev/faltantes** — eso vive en la columna `Diferencia/Faltante` de cobros normales.

## "¿El IGTF calcula bien?" — ✅ SÍ, en sus dos modos

**Embebido (27076):**

```
base 406,2600 - descuento 0 - (IVA 150 + ISLR 140) - Dif/Faltante 10,0000 = 106,2600
IGTF = 106,2600 x 3%                                                      =   3,1878   OK
Total a pagar = 106,2600 + 3,1878                                         = 109,4478   OK
Sigma pagos = 50,0000 + 59,4478                                           = 109,4478   OK
```

**La base del IGTF es el total a pagar (106,26), NO el efectivo** (50,00 → habría dado 1,50). Regla del
producto **confirmada en la web. No cobra de más.**

**Separado (27078 → 27083):** `858,66 USD × 652,9726 × 3% = 16.820,4436 VES` = total exacto del cobro 27083.
Lo delatan los comentarios que dejó la QA (`igtf_cob` / `igtf_sep`), que resolvieron el caso más rápido que
la BD.

## "¿El pago parcial cierra?" — ✅ SÍ, 4/4 en la 1ª tanda + los del barrido

Todas las filas con `Pago parcial = SI` tienen `Monto a pagar < Monto doc` y rollup exacto a la cabecera.

## "¿Las retenciones cuadran?" — ✅ SÍ

27074, 27081 y 27090 cierran exactos (IVA + ISLR = total, con sus conversiones). Los 3 con desfase (27069,
27079, 27080) son **residuo del defecto ya corregido** que la QA confirmó (retención enviada con documentos
sin configurar) ⇒ **no se reportan**.

## "¿El defecto de dirección de conversión reproduce?" — ✅ NO, y la cobertura quedó cerrada

En la 1ª tanda quedó **sin evaluar** porque todos los descuentos/dev-faltantes estaban en cobros **USD**
(donde multiplicar es correcto). El barrido de cierre trajo el caso que faltaba: **27086 es VES con
`Diferencia/Faltante ≠ 0`**.

```
VES -> USD debe DIVIDIR:  7.318,5473 / 652,9726 = 11,2080 USD   CORRECTO (lista y BD)
si multiplicara:          7.318,5473 x 652,9726 = 4.778.716,..  NO ocurre
USD -> VES multiplica:       10,2800 x 652,9726 = 6.712,5583    CORRECTO
```

⚠ Único hueco restante: un **descuento por documento en VES** sigue sin muestra (el de 27086 vive en la
cabecera, no en una fila).

---

# DEFECTOS CONOCIDOS — veredicto en este build

| Defecto | Veredicto |
|---|---|
| `COB-RET-TOTAL-CERO` | 🟢 **NO reproduce** — los 6 cobros de retención muestran su total correcto. Parece ya corregido en el build de Isla Coche |
| Conversión ×tasa en descuentos manuales y dev/faltantes | 🟢 **NO reproduce** (ver arriba) |
| Retención enviable con documentos sin configurar | ⚠ **Los 3 registros son de HOY** (16:32, 17:06, 17:08) ⇒ **la APK del dispositivo todavía lo permite**. Si el fix ya está montado en otro build, este no lo trae |
| `DM-DEP-018/019/020` (lista BUSCAR no renderiza) | 🟢 **NO reprodujo** en 2 accesos — sigue intermitente |
| `DM-INV-026` (Guardado abre en tab General) | 🔴 **REPRODUCE** (4ª playa consecutiva). Cosmético, no re-marcado FAIL |
| `DM-VIS-020` (modal antes de validar actividades) | 🟢 **NO reprodujo** — con 0 actividades Guardar/Enviar están `disabled`; es imposible alcanzar el modal |
| Depósito que no sale del dispositivo (cliente anterior) | 🟢 **NO reproduce.** Acá el depósito Ref 3 posteó, llegó a la nube, `st_delivery=1`, cola vacía ⇒ **el defecto era específico de aquel cliente, no del build** |

---

# CORRECCIONES AL PERFIL `el_palmar.yaml`

Detectadas contra la UI/BD durante la corrida:

| VG | El perfil decía | **Valor real** | Evidencia |
|---|---|---|---|
| `validateNuOrder` | false | 🔴 **true** | `#nuPurchase` vacío ⇒ `lockSegments=true` y tabs bloqueadas; al llenarlo, habilitan en el mismo tick |
| `userCanUploadFiles` | true | 🔴 **false** | valor efectivo en `global_configuration`; sin acordeón Archivo |
| `signatureVisit` | true | 🔴 **false** | idem; la ausencia del acordeón Firma es correcta |
| `enabledManualRate` vs `canChangeRate` | contradictorios | **la tasa NO es editable** | `#tasa` llega `disabled=false` pero **`readonly=true`** ⇒ gana `enabledManualRate=false` |
| `userCanSelectProductDiscount` | false (⚠️VERIFICAR) | ✅ **false confirmado** | no existe el select "% Descuento" en el panel del producto |
| `validateWarehouses` | false | ✅ **false confirmado** | no existe el select "Almacén" |
| `requiredComment` | true | ✅ true pero **alcance COBROS** (`tipo=C`) | no aplica a clientes, inventarios, depósitos ni visitas — comprobado en los 4 |
| `longitudComentario` | 185 | **el tope real es 255** | lo fija `TEXT_COMMENT_MAX_LENGTH` del producto, no la VG (medido tecleando 300) |
| Catálogo de actividades de visita | 8 | **11** | el conteo solo sumaba `co_operation='U'`; `co_operation` es flag de sync, no de vigencia |
| Catálogo de motivos de devolución | 21 | **24** | idem |

**La app SÍ filtra la basura `co_operation='D'`** — verificado id por id en devoluciones y visitas.

---

# OBSERVACIONES GENERALES

1. 🔴 **El selector de empresa VARÍA POR MÓDULO dentro del mismo build** — el descubrimiento más útil de la
   corrida para futuros agentes:
   - **CLIENTES:** `ion-select[formcontrolname="idEnterprise"]`, `value=null` + `ng-invalid` ⇒ **obligatorio,
     bloquea Guardar/Enviar**. Receta: `s.value = 1` (**number**, no string) + `ionChange`.
   - **PEDIDOS:** preseleccionado en 1002 y habilitado.
   - **DEVOLUCIONES / INVENTARIOS / DEPÓSITOS / VISITAS:** preseleccionado, **sin `formcontrolname`**, con el
     **objeto empresa completo como `value`**.
   ⇒ **Leerlo, nunca asumirlo.** Y antes de marcar "el botón no habilita" como FAIL, verificar que no quede un
   campo obligatorio vacío.
2. **`expirationBatch=true` tiene alcance POR MÓDULO:** en **inventarios** el lote **es obligatorio**
   (*"Complete cantidad, unidad, fecha y lote para continuar"*), en **devoluciones NO** (con ambos vacíos
   Guardar/Enviar habilitan). La cadena cerró **extremo a extremo** (móvil → BD → web) en los dos módulos.
3. **Sync a la nube: INMEDIATA** en los 5 módulos transaccionales.
4. **`st_*` NO es traducible por catálogo en este cliente:** los 25 cobros tienen `st_collection=1`, valor que
   **no existe** en el catálogo `cob` de ninguna de las 2 empresas (1002: 2/12 · 1003: 7/22/17). La fuente
   confiable es **`transaction_statuses` mirando `co_status='env'`**. El móvil rotula "Enviado" por constantes
   hardcodeadas (`COLLECT_STATUS_SENT=1`) y la tabla local `statuses` está **vacía**, así que el hueco no lo
   afecta.
5. **La guarda de tenant debe anclarse al TEXTO de las opciones, nunca al `value`:** el `value` del select de
   Empresa **no es uniforme entre módulos** (posicional `1|2` en devoluciones, `co_enterprise` `1002|1003` en
   clientesPotenciales).
6. **En la web el filtro Empresa arranca en la 2ª empresa (YARACUY)** y se resetea al entrar fresco a cada
   módulo ⇒ corregirlo **siempre** antes de `Buscar`, o se cantan falsos `WEB-MISSING`.
7. **`parseMoneda()` de `web-helpers.js` no reconoce `VES`/`USD`** (solo `BS|Bs|US$|$`) ⇒ `verificarConversion()`
   devuelve `ok:null` en esta playa. Fix de una línea propuesto en `web.md`.
8. **`local-query.js` no funciona en este device** (`sqlite3` ausente) ⇒ BD local por `window.sqlitePlugin`
   vía CDP. Los nombres de tabla locales van **en plural**.

## Reportes individuales

- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md) · [Cobros](cobros.md)
- [Devoluciones](devoluciones.md) · [Inventarios](inventarios.md) · [Depósitos](depositos.md)
- [Visitas](visitas.md) · [Productos](productos.md) · [Vendedores](vendedores.md)
- [Capa WEB](web.md)

---
*Generado por Claude Code · Orquestador Smoke · 2026-08-05*

---

# RE-CORRIDA · 2026-08-06 — PEDIDOS completo + regresión de saldos

Con la **APK recompilada** que trae los fixes de M1 (búsqueda con tildes), M2 (moneda por defecto en USD) y
M9 (tipo de pedido al cambiar de empresa). Los tres fixes los verificó la QA a mano.
Detalle completo en **`pedidos-recorrida-20260806.md`**. Tasa vigente **710,0000**.

## PEDIDOS — 14/14 PASS, el hueco de cobertura queda cerrado

El fix de la moneda resolvió el bloqueo de H1: el formulario **abre en USD**, `Azucar` lista sus 6 productos
cotizables y **los 14 casos fueron ejecutables**. Los 10 N/A del 05/08 pasaron a PASS.

**Registro creado:** pedido **Ref 13806** · 2 líneas · Total **252,10 USD / 178.991,00 VES** ·
empresa **1002 / id_enterprise 1** · **BD-OK** (diff de baseline exacto: +1 `order`, +2 `detail`, +2 `units`;
sin duplicados; `co_status='env'`; 1 solo POST capturado).

### Verificación de cálculos — 🟢 todo cierra, cero descuadres

```
linea 1:  57,50 x 3 = 172,50   + IVA 16% 27,60  = 200,10
linea 2:  26,00 x 2 =  52,00   + IVA  0%  0,00  =  52,00
base 224,50  ·  IVA 27,60  ·  TOTAL 252,10 USD      (200,10 + 52,00 = 252,10 OK)
```

**Conversión — 12 campos verificados, todos multiplican (USD→VES, tasa 710), 0 divisiones:**
`57,50×710=40.825` · `172,50×710=122.475` · `200,10×710=142.071` · `26×710=18.460` · `52×710=36.920` ·
`224,50×710=159.395` · `27,60×710=19.596` · `252,10×710=178.991`, con el cruce cerrando:
`159.395 + 19.596 = 178.991` ✅

🔴 **El defecto de dirección de conversión de cobros NO aparece en pedidos.** Sin hallazgo nuevo por ese eje.

**Recálculo dinámico:** al cambiar una línea de IVA-16 a IVA-0, el delta es exacto en las dos monedas
(`−8,32 USD` / `−5.907,20 VES`).

### `PED-IVA-CONV-DIV-CANTIDAD` — escenario faltante ejecutado: **NO reproduce en móvil**

La corrida del 05/08 no pudo evaluarlo porque el pedido tenía IVA 0. Ahora se armó con **IVA ≠ 0 y cantidades
2 y 3**: el IVA convertido de línea da `19.596` (cant. 3) y `13.064` (cant. 2), o sea `IVA × 710` **sin
dividir**. Si el defecto existiera darían `6.532`.
⚠ **Salvedad de alcance:** el defecto se reportó en el detalle **WEB**, que esta re-corrida no cubrió.

### Descuentos — no ejercitables en este cliente (confirma el perfil)

El panel de línea trae 3 selects y **no incluye "% Descuento"**, y no hay descuento global. El payload viaja
con `nuAmountTotalProductDiscount: 0` y `nuAmountGlobalDiscount: 0`, así que **no contaminan el total**
(`224,50 − 0 + 27,60 = 252,10`). ⇒ **`userCanSelectProductDiscount = false` confirmado.**

### Hallazgo de la re-corrida

**`PED-TOTAL-IVA-LINEA-FLOAT-CRUDO` · S3 · cosmético.** El IVA convertido **de cada línea** se pinta como
float crudo — `19596`, `5907.2`, `6929.599999999999`, `13064.000000000002` — siendo el único importe sin
formato de la pantalla. **Los valores son correctos.** Reproduce la observación H6 del 05/08.

## Regresión de saldos — 🟢 SIN REGRESIÓN

Se verificó que el fix de saldos (validado en globalmp) **no rompió nada en el_palmar**. Los 4 clientes dan
**diferencia cero**, con **listado = detalle = valor derivado de documentos** — no solo coincidiendo entre sí,
que es lo que dejó pasar el fix devuelto del 03/08.

| Cliente | Docs en el device | Saldo BS | Saldo USD | Δ |
|---|---|---|---|---|
| 1000000804 ALCOHOLES DEL CARIBE | 26 USD | 34.812.762,6000 | 49.032,0600 | **0 / 0** |
| 1000000803 RON SANTA TERESA | 13 USD | 18.318.092,3000 | 25.800,1300 | **0 / 0** |
| **1000001897 NESTLE** (mixto) | 91 USD + 6 VES | 875.972.390,8200 | 1.233.763,9307 | **0 / 0** |
| **1000001943 JOSE PUIG** (mixto) | 9 USD + 12 VES | 118.615.337,5500 | 167.063,8557 | **0 / 0** |

```
NESTLE:     25.688,32   + 1.233.727,75 x 710 =   875.972.390,82   OK
            1.233.727,75 +    25.688,32 / 710 =     1.233.763,9307 OK
JOSE PUIG:  3.131.707,55 +   162.653,00 x 710 =   118.615.337,55   OK
              162.653,00 + 3.131.707,55 / 710 =       167.063,8557 OK
```

⚠ **Nota de método:** se comparó contra los documentos que ve **la app**, no contra la nube. El device
sincroniza un subconjunto (RON SANTA TERESA: **13 docs en el teléfono / 40 en la nube**). Comparar contra la
nube habría dado un falso mismatch. La agrupación por empresa sigue correcta: los documentos de la 1003
quedan fuera en los 4.

⚠ **Persiste `CLT-CREDITO-DISP-MEZCLA-MONEDAS`** (defecto residual, ajeno al fix de saldos): el crédito
consumido suma VES + USD **en crudo**. Matiz nuevo: **tampoco sirve de testigo en clientes de una sola
moneda** — en el 1000000803 el campo USD da `36,3382`, que es `25.800,13 ÷ 710`.

## Nota para automatización

Tras **Guardar** un pedido, el formulario **no queda pristine**: el botón atrás re-dispara el dirty-guard.
🔴 Matchear los botones del alert por `includes('salir')` pegaría en **"Guardar y salir"** y **duplicaría el
pedido**. Contradice la nota vigente en `module-selectors/pedidos.md` — corregida.

---
*Re-corrida generada por Claude Code · 2026-08-06*
