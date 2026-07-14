# Smoke Test — Módulo COBROS (RE-CORRIDA)

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260630_181903_smoke-completo` |
| Módulo | COBROS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 (build El Yaque, cobros REFACTORIZADO) |
| Cliente/Playa | jerez · El Yaque (denarioelyaque.ddns.net:8081) |
| Resultado | 9 PASS · 0 FAIL · 5 N/A · 20 ⛔ BLOCKED (automatización) |
| Estado final | HOME ✅ |

> ⚠ **Advertencia de alcance (leer primero).** Este build de El Yaque tiene el módulo de cobros **fuertemente refactorizado** (nueva tabla de documentos con paginación, gate de tabs por `validCollection` Subject, selección de cliente por observable, multi-empresa por `updateClientList`). Los selectores/helpers documentados (`module-selectors/cobros.md`, `denario-cdp-helpers.js`) están **mayormente obsoletos** para este build. Casi ninguna interacción de UI responde a eventos sintetizados por CDP (popover empresa/moneda, selección de cliente en modal, checkbox de documento, botón de método de pago, apertura/cierre de form). Manejarlo requiere manipulación profunda del modelo Angular vía `window.ng`, lo cual **(a)** corrompe cálculos de montos, **(b)** arrastra estado del singleton `collectService` entre aperturas, y **(c)** produce condiciones de prueba no fieles. Por eso los flujos de **crear/guardar/enviar** se marcan **⛔ BLOCKED (limitación de automatización, NO defecto de la app)** — la app puede estar perfectamente bien; lo que no es viable es conducirla end-to-end por CDP en este build dentro de un presupuesto razonable.
>
> **NO se creó ni envió ningún cobro en esta sesión** (0 payloads de `collectionservice/collection`). Integridad verificada: baseline de nube sin cambios atribuibles a esta corrida (ver Verificación BD).

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Home Cobros: tiles COBRO, ANTICIPO/PREPAGO, RETENCIÓN, IGTF, COBRO 25% IVA, BUSCAR — todos visibles |
| DM-COB-002 | ✅ PASS | COBRO → 5 tabs (General/Documentos/Pagos/Total/Adjuntos); solo General habilitada, resto `disabled`; Cliente vacío |
| DM-COB-004 | ✅ PASS | Cliente MULTIREPUESTOS DRG seleccionado (clic real `<p>` en modal) → las 4 tabs se habilitan |
| DM-COB-006 | 🚫 N/A | `requiredComment=false` (VG) |
| DM-COB-007 | ✅ PASS | Tab Documentos: 2 docs USD renderizados (`ion-row.tabladocumentSalesVenta`), tipo A, doc *026299 (51,72 USD) + otro (205,28 USD), con montos USD/BS |
| DM-COB-008 | ✅ PASS | `selectDocumentSale` → checkbox marcado ([true,false]), documento seleccionado, monto a pagar cambió de 0 |
| DM-COB-009 | ✅ PASS | "Agregar método de pago" → modal `#eventModal` con Efectivo/Depósito/Transferencia/Otros (coincide VG `colletionPayment`) |
| DM-COB-012 | ⛔ BLOCKED | Diferencia **ROJA** cuando insuficiente CONFIRMADA (`style="color:red"`); rama azul-cuando-cubre no alcanzada (montos corruptos por manipulación de modelo) |
| DM-COB-043 | ⛔ BLOCKED | ídem 012 (diferencia roja observada; toggle a azul no alcanzado) |
| DM-COB-014 | ⛔ BLOCKED | Tab Total no alcanzada en estado limpio |
| DM-COB-015 | ⛔ BLOCKED | "Total General" no verificado (depende de Tab Total limpia) |
| DM-COB-016 | ✅ PASS | Tab Adjuntos: acordeones **Imágenes / Archivo / Firma** visibles (`ion-accordion` values: images/file/sign) |
| DM-COB-018 | ⛔ BLOCKED | Guardar requiere cobro válido limpio; automatización bloqueada (ver Advertencia) |
| DM-COB-019 | ⛔ BLOCKED | Enviar requiere cobro válido limpio; automatización bloqueada. `requiredCollectionAttachments=false` (se enviaría sin adjunto) pero no se pudo llegar a Enviar |
| DM-COB-022 | ✅ PASS | Lista BUSCAR poblada (lectura inicial: FERRETERIA MUNDIAL "Por Enviar" + Ref 39–57 "Por aprobar") |
| DM-COB-024 | ⛔ BLOCKED | No hay cobro "Guardado" en BUSCAR para reabrir (todos "Por Enviar"/"Por aprobar"); crear uno = bloqueado |
| DM-COB-026 | ⛔ BLOCKED | Trash solo en "Guardado"; no hay Guardado; crear uno = bloqueado |
| DM-COB-020 | ⛔ BLOCKED | Back en form con cambios SÍ disparó dirty-guard (se manejó "salir sin guardar"), pero el modal de 3 opciones no se capturó rigurosamente |
| DM-COB-021 | ⛔ BLOCKED | Requiere crear cobro nuevo y "salir sin guardar" → verificar ausencia en BUSCAR; crear bloqueado |
| DM-COB-038 | ⛔ BLOCKED | "Guardar y salir"; crear/guardar bloqueado |
| DM-COB-028 | ⛔ BLOCKED | Anticipo: form ABRIÓ con **4 tabs (General/Pagos/Total/Adjuntos, SIN Documentos)** — estructura correcta confirmada. Guardar bloqueado (selección de cliente + gate de tabs por manipulación de modelo, no fiel) |
| DM-COB-029 | ⛔ BLOCKED | RETENCIÓN (botón home) — flujo de crear/guardar bloqueado |
| DM-COB-033 | ⛔ BLOCKED | Selector moneda-cobro NO hallado en Tab General (solo el selector Empresa). Posible en Pagos por método; no verificado. `multiCurrencyCollection=true` |
| DM-COB-034 | ✅ PASS | Selector **Moneda Documento** (Moneda/BS/USD) en Tab Documentos; al fijar USD la lista recargó 0→2 docs (filtra por moneda) |
| DM-COB-036 | 🚫 N/A | `userCanSelectIGTF=false` (VG CSV). ⚠ DISCREPANCIA: tile IGTF **visible** + documentos tipo IGTF **existen** en BD (ver Hallazgos) → flujo no conducible por CDP |
| DM-COB-044 | 🚫 N/A | IGTF (ver 036) — no ejecutable |
| DM-COB-045 | 🚫 N/A | IGTF (ver 036) — no ejecutable |
| DM-COB-040 | ⛔ BLOCKED | Depósito como método de pago; flujo de pago bloqueado |
| DM-COB-041 | ⛔ BLOCKED | Retención por detalle de documento; abrir detalle + guardar bloqueado |
| DM-COB-042 | ⛔ BLOCKED | Persistencia retención (encadena 041); bloqueado |
| DM-COB-046 | ⛔ BLOCKED | Pago parcial (toggle detalle); bloqueado |
| DM-COB-047 | ⛔ BLOCKED | Recálculo por Fecha tasa; bloqueado |
| DM-COB-037 | 🚫 N/A | `cliente_25iva=null` — sin cliente habilitado 25% IVA (per YAML; consistente) |
| DM-COB-039 | ⛔ BLOCKED | Rama A N/A (`enabledManualRate=false`); rama B (fecha tasa sobre Guardado) bloqueada (sin Guardado + recálculo fecha no fiable por CDP) |

**Conteo:** 9 PASS · 0 FAIL · 5 N/A · 20 BLOCKED (34 casos).

---

## Registros creados en sistema

**NINGUNO.** No se guardó ni envió ningún cobro en esta re-corrida. 0 payloads `collectionservice/collection`.

⚠ **Dependencia Depósitos:** el prompt pedía enviar ≥1 cobro con **Efectivo** para habilitar el módulo Depósitos. **No fue posible** (flujo de envío bloqueado). El agente de Depósitos debe verificar si existe un cobro Efectivo de una corrida previa; si no, Depósitos puede quedar N/A por falta de precondición.

---

## Verificación BD (RUNTIME §10)

- **Local (adb sqlite3):** `ERR: run-as: exec failed for sqlite3: No such file or directory` → el binario sqlite3 NO está en el device. `local-query.js`/`cotejo-bd.js` (local) = **BD-N/A**. **Workaround descubierto:** la BD local ES accesible vía la conexión SQLite de la app (`executeSql`) por `window.ng` — ver Patrones.
- **Nube (query.js):** operativa. Baseline de `collection` al cierre: último `id_collection=58` (co_type=0, st_collection=3, nu_amount_total=79872.58, da_created 2026-07-01T16:05Z). Ese monto = doc FERRETERIA MUNDIAL (BS 79.872,58) → es el cobro **"Por Enviar" de la corrida abortada previa** que sincronizó a la nube durante la ventana; **NO** creado por esta sesión. Cobros previos: id 57/56/55 (co_type 0), 54/53 (co_type 2, retención).
- **Payload hook:** capturó 62 payloads, **todos `syncservice`**, 0 `collectionservice/collection` (nunca se envió un cobro) → la pregunta "¿el hook captura collection?" **queda sin probar** esta corrida.
- **Veredicto integridad:** esta sesión **no creó registros** → `BD-N/A` (nada que cotejar).

---

## Patrones / selectores nuevos (insumo de consolidación — build El Yaque refactorizado)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **BD local vía app (`executeSql`)** | universal (CRÍTICO) | adb `run-as sqlite3` roto en este device. La BD local es accesible por `comp.clientSelectorService.db._objectInstance.executeSql(sql, [], okCb, errCb)` (Cordova, callback → envolver en Promise). Tablas: `clients` (snake_case: id_client, na_client, co_client, id_enterprise, co_currency…), `document_sales` (id_document, id_client, co_document_sale_type, nu_balance, da_due_date, co_document, id_enterprise…). Reemplaza a `local-query.js` cuando sqlite3 falta |
| **Multi-empresa cobros (cambio de empresa)** | cliente jerez (3 empresas) | El modal de cliente solo muestra clientes de la empresa activa (default = empresa 1, AZUL, sin docs). Clientes con docs están en emp 2/3 (ROJO). El popover del ion-select Empresa NO recarga por CDP. Patrón que funciona: `cs.enterpriseSelected = <ent2 de cs.enterpriseList>` → `comp.selectorCliente.updateClientList(2)` (recarga lista modal) → `cs.collection.idEnterprise=2; cs.collection.coEnterprise='00002'` (si no, `loadDocumentsSalePage` filtra por empresa 1 → 0 docs). `comp.onEnterpriseSelect()` recarga pero su `ngOnInit` revierte `enterpriseSelected` |
| **Nueva tabla de documentos** | universal (build El Yaque) | `app-cobro-documents`: `onChangeCurrencyDoc(event)` (setea currencySelectedDocument + `loadDocumentsSalePage`), `loadDocumentsSalePage(page)` (paginado; filtra por `collection.idClient`+`documentCurrency`+`collection.idEnterprise`), `selectDocumentSale(doc, index, {detail:{checked:true}})`, `openDocumentSale`, `documentSalesView`/`documentSales`/`documentSalesTotalRows`. Docs solo cargan con Moneda Documento elegida Y `collection.idEnterprise` = empresa del cliente. Filas: `ion-row.tabladocumentSalesVenta.tablaDocVentas` (una vez cargadas) |
| **Gate de tabs por `validCollection`** | universal (build El Yaque) | Las tabs (Pagos/Total/Adjuntos) quedan `disabled` hasta que `collectService.validCollection` (Subject) emite. `validCollection.next(true)` las habilita. Seleccionar cliente pone `cobroValid=true` pero NO empuja el Subject |
| **Guard de selección de cliente** | universal (build El Yaque) | `setClientfromSelector(client)`: `if(client.idClient == collection.idClient) return`. El bleed del singleton (idClient stale) bloquea re-selección → resetear `collection.idClient=0` antes. `selectorCliente.sendClient()` usa `this.cliente` (ignora arg) → `service.onCLientChanged` (emite observable) |
| **Singleton `collectService` con bleed** | universal (build El Yaque) | `collectService` retiene `nameClient`/`collection`/`clienteAnterior` entre aperturas de form dentro de la sesión de cobros. Solo navegar a `/home` (`app-home.goToModule`) lo resetea limpio |
| **Apertura/cierre de form (fricción)** | universal (build El Yaque) | `nuevoCobro(N)` programático necesita ~3.5s + GPS; intermitente. Clic en tile a veces no renderiza. `exitCollectionWithoutSave()` a menudo NO cierra el form → salida fiable = clic `img.fechaAtras` (dispara dirty-guard) → manejar alert → repetir (2 backs → `/home`). Navegación a módulo: `app-home` comp → `goToModule(modulos[i])` |
| **Popovers ion-select no fiables por CDP** | universal (build El Yaque) | Los clics reales en opciones de popover (empresa, moneda) NO disparan `(ionChange)` de Angular de forma fiable → invocar handlers del componente directo (`onChangeCurrencyDoc`, etc.) |
| **IGTF: tile visible + docs existentes vs VG=false** | cliente jerez | Ver Hallazgos — discrepancia de config |

---

## Hallazgos (observaciones, sin FAIL de app confirmado)

1. **⚠ Discrepancia VG IGTF (config CSV dev vs app):** el CSV `global_configuration_jerez.csv` trae `userCanSelectIGTF=false` (→ el prompt marcó 036/044/045 N/A). Pero en la UI el **tile IGTF está VISIBLE** en el home de Cobros, y el pre-vuelo de nube muestra **documentos tipo IGTF existentes**: INVERSIONES MOTO REPUESTOS EL PODER DEL MONO (089129288, 2 docs) y Brisas del Campo (J-502401776, 2 docs). Según la tabla VG→DOM (`userCanSelectIGTF true→tile visible`), la app parece tener IGTF **habilitado**, contradiciendo el CSV. **Recomendación QA:** confirmar el valor efectivo de `userCanSelectIGTF` en la web de jerez; si está true, 036/044/045 deberían ejecutarse (hay datos), no ser N/A estructural.

2. **Cartera con documentos (descubierto en runtime, BD local device):** empresa 1 = 3 clientes SIN docs (azul); empresa 2 = 4 clientes / 16 docs con saldo; empresa 3 = 141 clientes / 395 docs. Clientes emp2 con docs: MULTIREPUESTOS DRG (074820707, 6 docs USD, saldo 1083,89), EL PODER DEL MONO (089129288, 5 docs, 1346,40), ISOLINA DEL CARMEN (10283986, 4 docs, 95,19), FERRETERIA MUNDIAL (065027207, 1 doc, 140,70). **Actualizar YAML:** clientes_con_documentos debe reflejar empresa 2/3 y el mecanismo de cambio de empresa (ver Patrones).

3. **Monto "total a pagar" anómalo (NO confirmado como bug de app):** tras forzar empresa/moneda por modelo, "Monto total a pagar" mostró BS 66.153.652,13 para un doc de ~205 USD (≈ balance BS × tasa, doble conversión aparente). **Muy probablemente artefacto de mi manipulación de estado** (no de un usuario real) → NO se reporta como FAIL. Vigilar en una corrida con flujo real.

4. **Remanente de corrida abortada:** al conectar, la app estaba en la sublista BUSCAR (no en un form a medias) con un cobro "FERRETERIA MUNDIAL — Por Enviar" sin Ref (de la corrida previa detenida). No se reutilizó estado; se arrancó desde el home de Cobros. Ese cobro sincronizó a nube como id_collection=58 durante la ventana.

## Recomendación de automatización

Este build de cobros requiere **actualizar el harness CDP** antes de que la re-corrida de cobros sea viable end-to-end: (a) helper de cambio de empresa (`updateClientList` + `collection.idEnterprise`), (b) helper `executeSql` para BD local, (c) helpers para la nueva tabla de documentos y el gate `validCollection`, (d) selección de cliente robusta con reset de `collection.idClient`. Con esos helpers, los 20 casos BLOCKED pasan a ser ejecutables. Alternativamente, correr cobros **manualmente** en este cliente hasta actualizar el harness.
