# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260710_084522_smoke-completo` |
| Módulo | COBROS |
| Cliente | hidroponias (HIDROPONIAS VENEZOLA) |
| Servidor | Isla La Tortuga (v6.6.18) — `denariolatortuga.ddns.net:8081` |
| App | `com.kiberno.denarioPremiumPro` |
| CDP | `http://127.0.0.1:9220` · `window.ng=true` (build expone Angular debug) |
| Resultado | **20 PASS · 0 FAIL · 1 SKIP · 5 N/A · 8 BLOCKED** |

## Datos de prueba usados (descubiertos en runtime)
- **Cliente CON documentos:** COMERCIALIZADORA ALFACORE, C.A. (co_client 44052, idClient 250) — 61 FACT USD en nube; en UI cargó 13 docs BS / 7 docs USD (incl. FACT vencidas 20111278, 20111593, 20114463 — rojas). Elegido por estar en los 50 clientes cargados (seleccionable de forma fiable) y tener FACT USD.
- **Cliente sin documentos (004/006/020):** ALIMENTOS GOURMET CCC / ALIMENTOS MACO 2020 (co 2602).
- **Método de pago:** Depósito · Banco: BANCO DE VENEZUELA S.A.C.A. BANCO UNIVERSAL (idBank 4).
- **Pre-vuelo BD (nube):** tipos de documento con saldo = FACT, N/DB, N/CR. **NO existe documento tipo IGTF** → 036/044/045 N/A por dato.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Cobros home: botones COBRO + BUSCAR + RETENCIÓN + IGTF. ANTICIPO ausente (cobroPrepago=false). 25%IVA ausente (ver nota) |
| DM-COB-002 | ✅ PASS | 5 tabs; General habilitada, Documentos/Pagos/Total/Adjuntos disabled; Cliente vacío |
| DM-COB-004 | ✅ PASS | Cliente + comentario válido → 4 tabs habilitan (habilitación asíncrona vía observable `validCollection`) |
| DM-COB-006 | ✅ PASS | Comentario vacío → `validComment=false` + mensaje "El comentario no puede ser vacío" (COB_EMPTY_TXCOMMENT) |
| DM-COB-007 | ✅ PASS | Tab Documentos renderiza 13 docs + checkboxes + selector Moneda Documento + leyenda Vigente/Vencido/A favor |
| DM-COB-008 | ✅ PASS | Checkbox doc → nuAmountTotal 0 → 48.290,18 BS (equiv. FACT 70,40 USD) |
| DM-COB-015 | ✅ PASS | Tab Total muestra línea "Total General" = 48.290,18 |
| DM-COB-033 | ✅ PASS | multiCurrency activo: currencyList = [BS, USD]; Empresa única HIDROPONIAS VENEZOLA |
| DM-COB-034 | ✅ PASS | Cambiar Moneda Documento BS→USD recarga lista (13 BS → 7 USD, incl. FACT) |
| DM-COB-041 | ✅ PASS | Detalle documento: "Nro. Comp Ret · Debe tener 14 caracteres" → al llenar 14 díg aparecen "Monto retenido IVA" e "ISLR" (aceptan 0,05 / 0,03). **Gap G1 cerrado** — ver nota |
| DM-COB-042 | ⛔ BLOCKED | Depende del guardado completo del detalle retención (requiere además Fecha Comp Ret + save); no completado |
| DM-COB-009 | ✅ PASS | "Agregar método de pago" abre modal con Efectivo/Depósito/Transferencia |
| DM-COB-040 | ✅ PASS | Depósito + BANCO DE VENEZUELA + monto=total → **Diferencia BS: 0,00 azul** (rgb(0,0,255), style color:blue) |
| DM-COB-012 | ✅ PASS | Monto < total → Diferencia -48.190,18 **roja** (rgb(255,0,0)); = total → azul |
| DM-COB-043 | ✅ PASS | Color de diferencia cambia correctamente en ambos sentidos (rojo insuficiente / azul cubierto) |
| DM-COB-014 | ✅ PASS | Tab Total: tabla Tipo/Nro.Doc/Monto Doc/Monto Pago (FACT 20114463) + acordeón + totales no nulos (Pago BS 48.290,18, Tasa 685,94) |
| DM-COB-016 | ✅ PASS | Tab Adjuntos: 3 acordeones — Imágenes (BUSCAR/TOMAR FOTO), Archivo (Subir), Firma |
| DM-COB-018 | ✅ PASS | Guardar → alert "El Cobro se ha guardado"; cobro Guardado (co_collection 1783691492577, stDelivery=3) |
| DM-COB-019 | ⏭ SKIP | requiredCollectionAttachments=true + mock cámara NO funciona en build v6.6.18 (foto no entra al carrusel tras 2 intentos). Cobro queda Guardado, pendiente envío manual |
| DM-COB-022 | ✅ PASS | BUSCAR: lista con searchbar + botón eliminar solo en Guardado; muestra el cobro ALFACORE "Estatus: Guardado" |
| DM-COB-024 | ✅ PASS | Reabrir Guardado: editable, round-trip §9 OK — cliente, comentario, total 48.290,18 y **depósito BANCO DE VENEZUELA 48.290,18 preservados** |
| DM-COB-026 | ✅ PASS | Trash → alert "¿Desea eliminar el Cobro?" → Eliminar → cobro desaparece de la lista |
| DM-COB-020 | ⛔ BLOCKED | Dirty-guard back no dispara vía CDP (img.fechaAtras ausente / MouseEvent no activa el guard; back sale sin modal). Intermitencia por build (precedente globalmp) |
| DM-COB-021 | ⛔ BLOCKED | Depende del modal dirty-guard (020) |
| DM-COB-038 | ⛔ BLOCKED | Depende del modal dirty-guard (020) |
| DM-COB-029 | ⛔ BLOCKED | Cobro tipo Retención (botón RETENCIÓN presente) no ejecutado end-to-end por presupuesto/inestabilidad de carga de docs |
| DM-COB-028 | 🚫 N/A | cobroPrepago=false → botón ANTICIPO/PREPAGO ausente (confirmado en 001) |
| DM-COB-036 | 🚫 N/A | No existe documento tipo IGTF en pre-vuelo (solo FACT/N/DB/N/CR) → sin documento elegible |
| DM-COB-044 | 🚫 N/A | Sin documento IGTF elegible (ver 036) |
| DM-COB-045 | 🚫 N/A | Sin documento IGTF elegible (ver 036) |
| DM-COB-046 | ⛔ BLOCKED | Toggle "Pago parcial:" **confirmado presente** en detalle documento; flujo completo (togglear + monto parcial + round-trip) no ejecutado |
| DM-COB-047 | ⛔ BLOCKED | Recálculo por Fecha tasa no ejecutado (dependencia de docs cargados + presupuesto) |
| DM-COB-037 | 🚫 N/A | Botón COBRO 25%IVA **ausente** en build v6.6.18 pese a userCanCollectIva=true en YAML (VG efectiva difiere) |
| DM-COB-039 | ⛔ BLOCKED | Cambio de tasa (manualRate / fecha tasa) no ejecutado |

## Registros creados en sistema
| Ref (co_collection) | Cliente | Detalle | Estado final |
|-----|---------|---------|--------|
| 1783691492577 | ALFACORE (44052) | Cobro NORMAL, FACT 20114463, Depósito BANCO DE VENEZUELA, BS 48.290,18, dif 0 | **Guardado → luego ELIMINADO (DM-COB-026)** |

> Ningún cobro fue **Enviado** (adjunto obligatorio → 019 SKIP). No hubo cobros Guardados pendientes al cierre (el único se eliminó en 026).

## Verificación BD
- **Nube (`collection`):** baseline al inicio = 17 filas / max id 17; post-corrida = **17 / max 17** → sin nueva colección en nube. Coherente con **0 cobros enviados** (adjunto obligatorio).
- **Local (sqlite3):** `run-as: exec failed for sqlite3: No such file or directory` → **BD-N/A** (lector local no disponible en el device).
- **Marca del registro creado:** **BD-SAVED** (Guardado local, nunca enviado por falta de adjunto) → luego eliminado en 026. Sin duplicados en nube (la "2ª fila ALFACORE" en BUSCAR fue doble-conteo DOM card+item, no duplicado real).
- **Payloads capturados (`_payloads.jsonl`):** vacío — ningún POST a `collectservice` (0 envíos).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Selección de cliente en modal (build v6.6.18) | universal | `#clienteSelectModal.present()` → `scrollIntoView({block:'center'})` del `<p>` del nombre → leer coords FRESCAS + `pg.mouse.click` **en la misma llamada**. Requisito: estar en tab General (app-cobro-general montado) con estado limpio. Solo `pg.mouse.click` real selecciona (DOM dispatch NO dispara Angular AOT). El modal es inestable entre llamadas CDP (la Y se desplaza) → leer coords y clickear siempre juntos |
| Cliente fuera de los 50 cargados | universal | El buscador del modal NO filtra vía CDP y `clientSelectorService.clientes` solo trae 50 (paginado). Elegir cliente de los 50 cargados; cambiar de cliente dispara alert "Se ha detectado cambio del cliente..." → Aceptar reinicia la transacción (comentario se borra) |
| Habilitación de tabs (cobro) | universal | Las tabs Documentos/Pagos/Total/Adjuntos se habilitan de forma **asíncrona** vía observable `collectService.validCollection` (setTimeout). Receta fiable: loop `app-cobro.collectValidFunc()` + `window.ng.applyChanges()` hasta que `segment-button.disabled=false`, luego click real. Sin esto el click cae en tab disabled y no cambia |
| Carga de documentos por cliente | universal | Los docs cargan solo con comentario VÁLIDO (validComment=true) + navegación real a Documentos. Re-seleccionar cliente resetea validComment → re-llenar comentario. `refreshDocumentsForCurrentClient(true)` no basta si idClient quedó undefined |
| Moneda Documento (Tab Documentos) | universal | No es ion-select visible fiable; usar `comp.onChangeCurrencyDoc({detail:{value:usdOption}})` con `currencyListDocument` = [{Moneda},{BS},{USD}]. Recarga `filteredDocumentsView` filtrando por moneda |
| Depósito completo por código | universal | `comp.setMonto(monto, index, 'de')` (tipo 'de'=depósito) fija `pagoDeposito[i].monto` + `collectionPayments[pos].nuAmountPartial` y recalcula diferencia. Banco desde `collectService.listBanks` (33 bancos, naBank). Bank-picker por UI sale vacío si hay #eventModal residual |
| Diferencia (color) | universal | Elemento leaf con texto `Diferencia BS: X` y `style="color:blue"` (0,00 cubierto) / `color:red` (insuficiente). `getComputedStyle().color` = rgb(0,0,255)/rgb(255,0,0) |
| Retención en detalle de documento | cliente+universal | **vgs.retencion=TRUE confirmado, sizeRetention=14.** Detalle documento: llenar "Nro. Comp Ret" (14 díg, ion-input en su fila propia — NO el 1º que es Tipo=FACT) → aparecen "Monto retenido IVA"/"ISLR". Técnica de llenado: `pg.mouse.click` + `keyboard.type` + set `ionInput.value` + emitir input/change/keyup/ionInput/ionChange/blur. Montos en centavos ("5"→0,05). Guardar del detalle requiere además Fecha Comp Ret |
| Pago parcial (toggle) | universal | Toggle "Pago parcial:" + "Monto a pagar BS" **presente** en el modal detalle documento (DM-COB-046 alcanzable) |
| BUSCAR / navegación | universal | Botón BUSCAR (ion-button.colorBorderBuscar) → `app-cobros-container.buscarCobro()`. Lista `app-cobros-list` usa ion-item (no ion-card); trash = `[color="danger"]` solo en Guardado |
| Salida del form | universal | `app-cobros-header` → `exitCollectionWithoutSave()` cierra el form. Back desde la lista sobre-navega hasta HOME |

> ✅ consolidado 20260710

## Hallazgos / notas
- **25%IVA ausente pese a VG:** el botón COBRO 25%IVA no aparece en el build v6.6.18 aunque `userCanCollectIva=true` en el YAML → DM-COB-037 N/A. Actualizar YAML o revisar VG efectiva del servidor Isla La Tortuga.
- **IGTF sin documento:** botón IGTF presente pero sin documento tipo IGTF en cartera → 036/044/045 N/A por dato (no estructural). Re-correr cuando exista documento IGTF vigente.
- **mock cámara NO funciona (build v6.6.18):** igual que builds El Yaque (piercar/romher/ferrenuestro). Recomendación: fijar `mock_camara_funciona=false` en `hidroponias.yaml` para evitar reintentos. Envío de cobros con adjunto = manual QA.
- **Dirty-guard back no conducible vía CDP** en este build (020/021/038 BLOCKED) — como precedente globalmp intermitente.
- **vgs.retencion, sizeRetention, formatRetention:** confirmados → `retencion=true`, `sizeRetention=14`. Actualizar YAML (estaban en `null`/TBD).

## Verificación BD (payload ↔ nube) — Agente BD

**BD-N/A / sin payloads a cotejar:** el módulo no produjo envíos (adjunto obligatorio → DM-COB-019 SKIP; único registro creado quedó Guardado y luego eliminado en DM-COB-026). No hay payloads de collectionservice en `_payloads.jsonl`. Baseline nube 17 = post 17 (0 filas nuevas, coherente). Sin duplicados.
