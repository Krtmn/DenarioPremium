# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260729_133234_smoke-completo` |
| Módulo | DEPÓSITOS |
| Cliente | latino_cosmetica — LATINOCOSMETICA C.A. (`co_enterprise` 00001, única) |
| Servidor | `http://denarioislacoche.ddns.net:8081/PremiumWS` · playa `isla_coche` |
| App | `com.kiberno.denarioPremiumPro` — app_version 1.0 · db_version 19 · `window.ng=true` |
| Usuario | co_login 100 — NEIMY PARRA (id_user 477) |
| Moneda | local BSD · hard US$ · tasa 737,2321 BSD = 1 $ |
| `modules.depositos.aplica` | **true** (estructural: `colletionPayment` con Efectivo = SÍ) |
| Resultado | **6 PASS · 0 FAIL · 0 SKIP · 6 N/A · 0 BLOCKED** (12 casos) |
| Registros creados | **ninguno** (ver §Precondición de dato) |

---

## 🔴 Precondición de dato — pool de depositables AGOTADO

El módulo **sí aplica** para este cliente, pero **no había ni un cobro depositable** al momento de la corrida.
Cotejo con dato vivo (UI + BD local del device, ambas monedas):

**1) Cobros que QA envió a mano hoy (BD local `collections`, los 5 con `st_delivery=1`):**

| `id_collection` | Cliente | Monto | Moneda | `co_type` | Métodos de pago |
|---|---|---|---|---|---|
| 102 | 1.000 Y UNA BELLEZA, C.A. | 5.308,07 | BSD | 3 | `de` depósito bancario — BANCO DEL TESORO |
| 101 | A DOLAR BOUTIQUE CA | 1.200,00 | BSD | 2 (retención) | — sin pagos |
| 100 | 1.000 Y UNA BELLEZA, C.A. | 1.000,00 | BSD | 1 (anticipo) | `de` depósito bancario — BANCO DEL TESORO |
| **99** | 1.000 Y UNA BELLEZA, C.A. | **240,00** | **$** | 0 | `pm` 40,00 + **`ef` EFECTIVO 200,00** |
| 98 | A DOLAR BOUTIQUE CA | 550,00 | BSD | 2 (retención) | — sin pagos |

→ **Un solo pago en EFECTIVO en todo el device**: `collection_payments` `co_payment_method='ef'` = 1 fila (cobro `1785340041060.0`, $200).

**2) Ese único efectivo YA fue depositado por QA a mano** (depósito enviado hoy 17:14:55, antes de este módulo):

```
deposits:          id_deposit=1 · co_deposit=1785345308575.0 · st_deposit=1 (Enviado) · $240,00 · da_document 2026-07-29
deposit_collects:  co_deposit_collect=1785345308575.0_1785340041060.0 · id_collection=99 · nu_total_deposit=240
```

**3) Tab Cobros verificado VACÍO en las DOS monedas** (render limpio, sin loader colgado ni spinner):

| Moneda | Cuentas en `ion-select.selectbanco` | Banco elegido | Checkboxes en Tab Cobros | Pie |
|---|---|---|---|---|
| BSD | 8 (idBankAccount 89–93, 95–97) | BANCO MERCANTIL ***5466120 (id 96) | **0** | "Monto total depositado **0 BSD**" |
| US$ | 1 (idBankAccount 94) | ZELLE ***9999999999 (id 94) | **0** | "Monto total depositado **0 $**" |

**4) La app rechaza guardar sin cobros — VG correcta, no defecto:** con Banco + Fecha Doc + Nro. Plantilla llenos,
`ion-button.imagenGuardar` queda `disabled`; forzando el guardado por la vía del dirty-guard ("Guardar y salir")
la app responde con la alerta **"Seleccione los Cobros a depositar" [OK]** y no persiste nada.

⇒ Los 6 casos que exigen un depósito con cobro vinculado quedan **🚫 N/A por DATO del día** (no estructural).
**`modules.depositos.aplica` se mantiene en `true`** — lo que faltó fue el dato, no la VG.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Tile "Depósitos" → `app-depositos` visible con botones **DEPÓSITO** y **BUSCAR**; 0 alertas/loaders |
| DM-DEP-002 | ✅ PASS | Form `app-deposito`+`app-deposito-general`: Empresa (1 opt, auto LATINOCOSMETICA), Moneda (2 opts, BSD default), Banco `.selectbanco` (8 opts), Nro. Plantilla, Comentario, Fecha Depósito idx0 `disabled` "29/7/2026, 5:45 p. m.", Fecha Doc idx1 editable "29/7/2026". Tabs Cobros/Total/Adjuntos `disabled`; **Guardar y Enviar `disabled`** sin datos |
| DM-DEP-004 | ✅ PASS | `selectbanco.value = option.value` + `ionChange` → texto "BANCO MERCANTIL - *** 5466120"; **cuenta autollenada** `ion-input` label "Banco:" = `01050035481035466120` (readonly); tabs Cobros/Total/Adjuntos pasan a habilitadas |
| DM-DEP-005 | ✅ PASS | `letrasFechasButton` idx 1 → modal `fechasModal` (`ion-datetime` presentation=date, valor inicial `2026-07-29 17:02:10`) → `dt.value='2026-07-29'` + `ionChange` + `dt.confirm()` → click real en **Aceptar** → modal cerrado (0 `show-modal`), Fecha Doc = 29/7/2026 |
| DM-DEP-006 | 🚫 N/A (dato) | Nro. Plantilla se llenó OK (`DEP-QA-0729`, confirmado por propiedad `label`) y el form quedó *dirty* (dispara el guard). **No hay campo Monto libre** (monto = suma de cobros). Guardar sigue `disabled` porque no hay cobros depositables → estado objetivo "Guardar habilitado" inalcanzable. Comportamiento correcto (alerta "Seleccione los Cobros a depositar") |
| DM-DEP-009 | 🚫 N/A (dato) | Guardar no ejecutable sin cobro vinculado. Intento forzado vía "Guardar y salir" → **"Seleccione los Cobros a depositar" [OK]**; BD local sin fila nueva (`deposits` = 1 fila, la de QA) |
| DM-DEP-010 | ✅ PASS | BUSCAR → `app-deposito-list` **renderiza limpia**: `ion-searchbar` + 1 ítem "Nro Ref: 1 · Banco: 039 · Estatus: Enviado · Fecha 2026-07-29 17:14:55 · Monto $: 240.00", **0 spinners / 0 loadings**. ⚠ El defecto conocido `deposit.service.ts` (lista no renderiza) **NO reprodujo**. Nota: el único ítem es *Enviado* (el de QA) — no había Guardado que listar |
| DM-DEP-014 | 🚫 N/A (dato) | No existe depósito en estatus **Guardado** que reabrir (lista = 1 ítem Enviado). El round-trip de reapertura sí se ejercitó sobre el Enviado en DM-DEP-019 |
| DM-DEP-017 | 🚫 N/A (dato) | Enviar no ejecutable: sin depósito Guardado y sin cobro vinculable. `ion-button.imagenEnviar` `disabled` en el form nuevo |
| DM-DEP-018 | 🚫 N/A (dato) | No hubo "guardar" previo que verificar. Como señal del mismo defecto: la lista **sí renderizó** en DM-DEP-010 y de nuevo tras volver del detalle |
| DM-DEP-019 | ✅ PASS | Click en ítem Enviado (coords del **`ion-item`**, no del `ion-row`) → detalle **solo lectura**: `.imagenGuardar` y `.imagenEnviar` **no existen**, `ion-button[color=danger]` = **0**, los 3 `ion-input` y los 3 `ion-select` en `disabled`, ambas fechas `disabled`, y **el tab Cobros desaparece** (quedan General/Total/Adjuntos). Datos releídos: Empresa LATINOCOSMETICA, Moneda `$`, Banco **ZELLE** cuenta 9999999999, Fecha Depósito 29/7/2026 1:14 p. m., Fecha Doc 29/7/2026 |
| DM-DEP-020 | 🚫 N/A (dato) | Sin ítem Guardado, no hay trash que pulsar. Verificado en contrapartida que el ítem **Enviado NO expone trash** ni en la lista ni en el detalle (correcto) |

---

## Verificación BD (RUNTIME §10)

| Oráculo | Estado |
|---|---|
| **Nube** (`node automation/db/query.js latino_cosmetica …`) | **BD-N/A** — BD nube de latino_cosmetica **sin GRANT** (0 de 185 tablas legibles). No se gastaron intentos |
| **Local del device** (vía CDP `window.sqlitePlugin`) | ✅ **legible** — `denarioPremium`, tablas reales `deposits` + **`deposit_collects`** (⚠ la N:M `deposit_collection_payment` es de la **nube**, no existe en local) |
| Cola de salida | `pending_transactions` = **0 filas** (antes y después) |
| Rechazos | `failed_transactions` = **0** (antes y después) |
| `deposits` al cierre | 1 fila — la de QA (`id_deposit=1`, `st_deposit=1`, $240). **Sin filas nuevas ni duplicados por esta corrida** |

**Conclusión guardado→enviado:** no aplica a esta corrida — **este agente no creó ni envió ningún depósito**
(pool de depositables agotado). El único depósito del día es el que QA envió a mano y consta **Enviado**
(`st_deposit=1`, `id_deposit=1`) con su vínculo al cobro 99 en `deposit_collects`. Marca: **BD-N/A** (nube sin grant).

### Captura de payload

`_payloads.jsonl` **sin líneas nuevas**: no hubo POST `depositservice/deposit` porque no se envió ningún depósito.
El hook (heredado, `getCapturedPayloads()` → `{url,data}` con body) estaba operativo — 36 entradas capturadas en la
sesión, únicamente `syncservice/getsync` y `clientstockservice/clientstock`. El POST del depósito manual de QA
(17:14) ocurrió **antes** de que arrancara este módulo, por eso no figura. Se instaló además
`window.__qaH.getPayloadData()` (`window.__qaDataHook`, wrapper único) sin reinstalar el bundle.

### Manifiesto

`_bd-manifest.jsonl` **sin líneas nuevas** — no se envió ningún depósito, así que no hay `Nro.Ref` propio que
exponer a la capa web. El depósito **Ref 1** que aparece en la app es de QA (envío manual), no de esta corrida.

---

## Registros creados en sistema

**Ninguno.** No se guardó ni envió ningún depósito (pool de depositables agotado — ver §Precondición de dato).
No quedaron *Guardados pendientes de envío manual*: el form de trabajo se cerró con **"Salir sin guardar"** y la
BD local quedó sin filas nuevas (`deposits` = 1, cola = 0, fallidas = 0).

Contexto (registro **preexistente**, NO creado por este agente):

| Ref | Detalle | Estado |
|-----|---------|--------|
| 1 | Banco ZELLE (coBank 039, cuenta 9999999999) · **$ 240,00** · Fecha 29/7/2026 17:14:55 · cobro vinculado `id_collection=99` (1.000 Y UNA BELLEZA, C.A., $240, efectivo $200) | Enviado — **envío manual de QA**, previo al módulo |

🔴 **REGLA DE ADJUNTOS:** no se tocó el botón de cámara, no se instaló mock de cámara y no se adjuntó nada.
El tab Adjuntos solo se observó como habilitado/deshabilitado; ningún caso de este módulo requirió adjunto para Enviar.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 El popover de bancos **NO** es oráculo de `aplica` | universal (corrige `[dth-2612]`) | Con **9 cuentas** disponibles (8 BSD + 1 US$) el pool de depositables era **0**. Las cuentas son **maestro de la empresa**, no derivan de los cobros. Oráculo correcto = Tab Cobros con dato vivo, o BD local |
| ✅ Oráculo BD local **exacto** de depositables | universal | `SELECT * FROM collection_payments WHERE co_payment_method='ef'` menos los ya vinculados en `deposit_collects`. `co_payment_method`: `ef`=efectivo (único depositable) · `de`=depósito bancario · `pm`=punto/otro |
| 🔴 Las cuentas bancarias se **filtran por MONEDA** y cambiar la moneda **resetea el Banco** | universal | BSD → 8 cuentas (89–93, 95–97); US$ → 1 (ZELLE id 94). Al cambiar `Moneda`, `selectbanco.value` vuelve a `{}` y Cobros/Total/Adjuntos vuelven a `disabled` ⇒ **re-elegir el banco DESPUÉS** de fijar la moneda, o el Tab Cobros queda ilegible y parece "vacío" cuando en realidad la tab no abrió |
| Tabla local es **`deposit_collects`** | universal | El vínculo cobro→depósito en el device vive en `deposit_collects` (`co_deposit`, `co_collection`, `id_collection`, `nu_total_deposit`). `deposit_collection_payment` es de la **nube** y no existe en local. Un nombre errado **aborta la transacción `sqlitePlugin` en silencio** |
| Dirty-guard **SÍ dispara** en latino_cosmetica | cliente | Alerta "Denario Depósito" con **[Guardar y salir · Salir sin guardar · Cancelar]** al pulsar `img.fechaAtras` con form sucio. Contrasta jerez/dm-electronica (no dispara) y confirma globalmp `[gmp-2611]`. ⚠ El `.alert-message` viene **vacío**: el texto útil está en `.alert-title` |
| ⚠ Anti-patrón: matchear botones de alerta por regex laxa | universal | `/SALIR/i` **matchea "Guardar y salir"** ⇒ dispara un guardado no deseado. Comparar el `textContent` del botón por **igualdad exacta** (`.toLowerCase()===`), nunca por `includes`/regex parcial, en alertas con varias opciones |
| Validación de guardado sin cobros | universal | "Guardar y salir" con 0 cobros → alerta **"Seleccione los Cobros a depositar" [OK]**; nada persiste. Confirma que `imagenGuardar` `disabled` es la VG y no un defecto |
| Depósito **Enviado = solo lectura** y **sin tab Cobros** | universal | En el detalle de un Enviado no existen `.imagenGuardar`/`.imagenEnviar` ni `ion-button[color=danger]`; inputs y selects en `disabled`; el segmento **Cobros desaparece** (solo General/Total/Adjuntos). Amplía `[ferrenuestro-20260723]` (que solo notaba la ausencia de botones) |
| Defecto conocido DM-DEP-010/018 **no reprodujo** | universal | `app-deposito-list` renderizó limpia en los 2 accesos (1 ítem, 0 spinners, 0 loadings). Sigue intermitente |
| Tab Cobros vacío **legítimo** | universal | 0 `ion-checkbox` + encabezados "Selec / Cliente / Fecha Cob. / Referencia / Monto Depósito / Monto Cobro" + pie "Monto total depositado 0 {moneda}", **sin spinner ni loader colgado**. Distinto del defecto de render (que deja loader colgado) |

---

## Hallazgos (FAIL)

**Ninguno.** 0 FAIL. Todo lo no ejecutado fue por ausencia de dato del día (pool de cobros en efectivo agotado
por el depósito manual de QA), no por comportamiento incorrecto de la app.

## Notas de infraestructura

- Watchdog: **0 cuelgues**, 0 `TIMEOUT:`, 0 `CDP-DOWN:`. Módulo cerrado dentro del techo de 45 min.
- El quirk del `ion-loading` sobre `ion-alert` se previno haciendo `dismiss()` de los loadings antes de cada
  click en alerta; en la práctica **no apareció** ningún loading interceptor en este módulo.
- No quedaron residuos: estado final **HOME** con 0 alertas, 0 `ion-modal.show-modal`, 0 `ion-loading`, 12 tiles.
- Bundle `__qaH` heredado del agente de INVENTARIOS — **no se reinstaló** (es idempotente). Su
  `getCapturedPayloads()` **sí** trae `{url,data}` con body en esta sesión.
