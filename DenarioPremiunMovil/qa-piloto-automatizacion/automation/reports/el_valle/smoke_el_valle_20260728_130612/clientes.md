# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260728_130612_smoke-completo` |
| Módulo | CLIENTES |
| Cliente / playa | `el_valle` — servidor **La Tortuga** (`denariolatortuga.ddns.net:8081/PremiumWS`) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · `db_version=19` · **`window.ng=true`** |
| Empresa | PROCESADORA DE ALIMENTOS COVADONGA,C.A (`idEnterprise` value=**1**, número) |
| Resultado | **11 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |
| Estado inicial → final | HOME → HOME ✅ |
| Watchdog | `moduleMs=2700000` · 0 cuelgues · 0 `TIMEOUT:` · 0 `ABORT-MODULE:` |
| TRAZA | 29 ops · 11 casos grabados · `validateTrace` = `[]` |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | Tile "Clientes" → `app-clientes` visible con los 3 botones: CLIENTES / CLIENTE POTENCIAL / BUSCAR CLIENTE POTENCIAL |
| DM-CLT-002 | ✅ PASS | `app-client-list` con **50 ítems** (1ª página), ordenados por nombre (`clientsOrderBy=na_client`). Lista muestra `Código` + `Saldo USD` |
| DM-CLT-003 | ✅ PASS | Búsqueda "ABASTOS Y CARNICERIA HERMANOS FLORES CA" → filtró 50 → **1** ítem exacto (`J309901710`) |
| DM-CLT-009 | ✅ PASS | "ADC FOODS" → `app-client-detail` con Empresa, Nombre + RIF `J505381237`, Lista de Precio, Email, Teléfono, **Saldo BS**, Crédito USD, Condición de Pago, Dirección, Coordenada |
| DM-CLT-013 | 🚫 N/A | Tab "Doc. De Venta" renderiza y la leyenda *Documento vigente / Documento vencido* está presente, pero **0 filas**: ningún cliente sincronizado para este vendedor tiene documentos. Ver §Justificación N/A |
| DM-CLT-016 | ✅ PASS | `clickBack` desde listado → `app-clientes` con los 3 botones (no salta a HOME principal) |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` (no salta al home de clientes) |
| DM-CLT-019 | ✅ PASS | Form potencial: **9 `ion-input` vacíos** (naClient, nuRif, txAddress, txAddressDispatch, txClient, naResponsible, emClient, nuPhone, naWebSite) + `ion-select[idEnterprise]` sin valor. **Guardar y Enviar `disabled=true`** |
| DM-CLT-021 | ✅ PASS | 8 campos vía `fillIonInput` + `idEnterprise=1` (**number**) → `selVal=1`, control `ng-dirty has-value`. **Guardar y Enviar `disabled=false`**. `naWebSite` quedó vacío (opcional confirmado) |
| DM-CLT-024 | ✅ PASS | Alert `Denario Cliente` / **"¡Cliente Potencial Guardado con exito!"** (botón OK). En BUSCAR CLIENTE POTENCIAL: `Nro. Ref: 0 · Estatus: Guardado` con trash presente |
| DM-CLT-026 | ✅ PASS | Reapertura del Guardado → Enviar → **3 alertas** → **"Cliente potencial nro. 2 creado exitosamente"**. Lista: `Nro. Ref: 2 · Estatus: Enviado`, **sin trash**. `BD-OK` |
| DM-CLT-031 | ✅ PASS | Trash en `Test-CLT-DEL-134127` (Guardado) → **borrado directo sin confirmación previa** → alert `Denario Clientes` / "¡Cliente Potencial se borro con exito!" → el ítem **desaparece** de la lista |

### Justificación del N/A de DM-CLT-013

No es un fallo de render. Discriminado con evidencia de BD y de UI:

- Nube: `document_sale` tiene **2 783 filas**, pero el cliente de detalle designado (`ADC FOODS`, `J505381237`) tiene **0** documentos.
- Los clientes con más cartera en nube (`HIPERMERCADO D´ LIFE` 23 docs, `MARKET VIP ALTA VISTA` 22, `INVERSIONES KAPUL 15` 22, `AUTOMERCADO D\`LIFE CENTER` 20, …) **no están sincronizados en el device**: 10 búsquedas dirigidas en el listado (`CENTRAL SANTO`, `CHRISTIAN GREGORIO`, `ASDRUBAL`, `LLOVIZNA`, `GOBEY`, `KENDER`, `MARKET VIP`, `KAPUL`, `SUPER MARKET ORIENTE`, `ANDINITA`) dieron **0 resultados** cada una.
- Ningún cliente de la 1ª página del listado tiene saldo distinto de `0,0000`.

⇒ **Sync PARCIAL por vendedor** (patrón ya universal `[dm-electronica][latino_cosmetica]`): el subconjunto asignado a este usuario es disjunto de los clientes con cartera. Encaja en RUNTIME §4 «API no devuelve datos → N/A». Consumió los 2 intentos acotados del techo §3 (1º con `ADC FOODS`, 2º con `HIPERMERCADO`).

## Registros creados en sistema

| Ref | Detalle | Estado | BD |
|-----|---------|--------|-----|
| **2** | Cliente potencial `Test-CLT-SMOKE-133515` · RIF `J987654321` · Tel `04123053302` · Dir. `AV PRINCIPAL QA SMOKE EL VALLE` · Empresa `PROCESADORA DE ALIMENTOS COVADONGA,C.A` | **Enviado** | `BD-OK` |
| — | Cliente potencial `Test-CLT-DEL-134127` · RIF `J123456789` (creado solo para DM-CLT-031) | **Borrado** (nunca enviado) | `BD-SAVED` → eliminado |

## Verificación BD (RUNTIME §10)

**Baseline** (inicio del módulo): `potential_client` = 1 fila (`id_client=1`, "Kiberno").

**Diff tras DM-CLT-026** — poll ×3 sobre ~12 s, fila estable desde el 1er intento:

```
id_client            = 2
co_client            = 1785260069928.0        (epoch, NO es el Ref)
na_client            = Test-CLT-SMOKE-133515
nu_rif               = J987654321
st_potential_client  = 1                       (Enviado)
tx_address           = AV PRINCIPAL QA SMOKE EL VALLE
nu_phone             = 04123053302
em_client            = qa.smoke@kiberno.com
na_responsible       = QA Automation
```

- **Marca: `BD-OK`** — lo guardado se envió. Cotejo campo a campo de los 6 campos de cabecera llenados por UI: **todos coinciden 1:1** (`BD-FIELD-OK`).
- **Correlación Ref UI = `id_client` CONFIRMADA de nuevo**: alert "nro. **2**" ⇔ `id_client=2`. Es la ~4ª corrida que lo reproduce (`[prc-2606][ferrenuestro-20260723][latino_cosmetica-20260714]`) → candidato firme a graduar de `BD-INFO` a regla.
- **`st_potential_client=1` para Enviados** reconfirmado (candidato `[prc-2606]` ya con 2ª confirmación).
- El registro borrado (`Test-CLT-DEL-134127`) **nunca llegó a la nube** — correcto, nunca se envió: `potential_client` quedó con exactamente 2 filas.
- **Local: `BD-N/A`** — `local-query.js` devuelve `run-as: exec failed for sqlite3: No such file or directory`. El device no tiene binario `sqlite3`, así que el cotejo local (cola `pending_transactions` / `failed_transactions`) no fue posible. No bloqueante (§10 blindaje); la nube alcanzó para el veredicto.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `sqlite3` ausente en el device ⇒ `local-query.js` inutilizable | universal (device) | `run-as: exec failed for sqlite3: No such file or directory`. El cotejo local de RUNTIME §10 (5 estados, cola, rechazos) **no corre en este device**; solo queda la nube. Los agentes deben degradar a `BD-N/A` en la mitad local sin gastar intentos |
| Botones del home de clientes: `clickTextButton` por **igualdad exacta** de `textContent` | universal | `CLIENTES` con `includes()` también matchea `BUSCAR CLIENTE POTENCIAL`/`CLIENTE POTENCIAL`. Usar `===` sobre el texto normalizado + `pg.mouse.click` en coords del `ion-button` (no del `ion-col`) |
| `searchClientes(pg, texto)` — foco por coords + `Ctrl+A`/`Delete` + `keyboard.type` + click lupa | universal | El input es `input[type="text"][placeholder="Clientes..."]` (plano). El `Ctrl+A`+`Delete` previo permite **reusar** el buscador en cadena sin volver a la lista. Pasar `''` limpia el filtro y restaura la lista completa |
| Lista de clientes **solo muestra `Saldo USD`**; `Saldo BS` solo en el DETALLE | cliente (el_valle) / coincide con ferrenuestro La Tortuga | No es FAIL. En el detalle sí aparecen `Saldo BS:` + `Crédito USD:` + `Crédito Disp. USD:` |
| `ion-item` de potencial: `Nro. Ref: 0` ⇔ Guardado · `Nro. Ref: N` ⇔ Enviado | universal | El Ref se ve en el propio texto del ítem — discriminador barato de estatus sin abrir el registro |
| `idEnterprise` con **1 sola opción** exige `value` numérico explícito | universal (5ª+ confirmación) | `value=1` (number). El `ion-select` arranca `selVal=null`; no se auto-selecciona |
| Traza RECORD: los clicks Guardar/Enviar/alert **no son grabables** con el vocabulario actual | universal (Ola 2) | Son `pg.mouse.click(x,y)` con coords frescas Playwright-side; no pasan por `eng.W`/`recEval`. Sin un helper canónico tipo `clickHeaderButton(pg,'guardar')` / `clickAlertButton` envuelto en `W`, las trazas de todo módulo transaccional quedan **partidas** justo en el paso que persiste |

## Hallazgos

Ninguno — 0 FAIL.

## Traza (QA_MODE=record)

- Archivo: `_trace/clientes.trace.json` · **29 ops · 11 casos** · `validateTrace` → `[]` (estructuralmente válida).
- DM-CLT-013 (N/A) descartado de las ops, según RUNTIME §12.
- **Cobertura parcial declarada** en el propio archivo (`nota_cobertura`): DM-CLT-024 y DM-CLT-026 conservan su marcador de caso pero los clicks que persisten (Guardar / Enviar / alerts) no figuran — en replay hay que escalar al modelo tras el último op grabado.
- 5 helpers de la traza **no son canónicos** de `denario-cdp-helpers.js` (`clickTileHome`, `clickTextButton`, `searchClientes`, `reabrirPotencial`, `borrarPotencial`): un replay necesita que se gradúen al helper file, o fallará con `helper-ausente`.
- Sin credenciales ni valores de `secrets/` en `data` ni en `code`.
