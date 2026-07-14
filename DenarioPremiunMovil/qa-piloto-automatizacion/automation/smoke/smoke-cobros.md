# Smoke — COBROS
## Estado inicial: HOME | Estado final: HOME

**Inicio:** `h.connectCdp(page)` → `h.waitSyncOverlay(pg)`
**Datos de prueba:** leer `automation/clientes/{QA_CLIENTE}.yaml` → `modules.cobros`
**VGs clave:** leer antes de ejecutar:
- `vgs.requiredCollectionAttachments` → DM-COB-016/018/019
- `vgs.retencion` + `vgs.sizeRetention` → DM-COB-041/042 (retención en detalle de documento)
- `vgs.cobroRetencion` → DM-COB-029 (botón RETENCIÓN home)
- `vgs.multiCurrency` → DM-COB-033/034
- `vgs.requiredComment` → DM-COB-006
- `vgs.userCanSelectIGTF` → DM-COB-036/044/045 (044/045 = persistencia tasa IGTF al reabrir)

---

## ⚠ Apertura del formulario de cobro (técnica CDP — OBLIGATORIO)

Abrir SIEMPRE con **`await h.openNuevoCobro(pg, tipo)`** (tipo: 0=cobro · 1=anticipo · 2=retención). Este helper dispara el handler **real** `nuevoCobro(N)` y **espera a que `paymentMethodList` se pueble** (carga async).

**NO usar `goToNuevoCobro(N)` directo** — salta el `showLoading()` y deja `paymentMethodList` vacía (los acordeones de método de pago no renderizan). Era la causa del módulo lento (atajos programáticos en cascada). Confirmado en `cobros-container.component.ts`.

- Retorno `OK:` → seguir.
- Retorno `OK-WARN:` (lista no pobló en 8s) → el cliente puede no tener métodos; revisar antes de tocar Pagos.
- Llamar solo el `tipo` cuya VG está activa (anticipo si `cobroPrepago`, retención si `cobroRetencion`).

Tabs y back: usar clicks reales (`ion-segment-button`, back que dispara el dirty-guard). Lo programático (`onChangeTab`, `exitCollectionWithoutSave`) solo como **fallback** si el click no responde.

---

## Selección de cliente con documentos pendientes (obligatorio)

Muchos casos requieren un cliente con **factura pendiente** (007, 008, 012, 040, 041/042, 043, 044, 046). Un cliente sin documentos los vuelve N/A artificialmente — eso **no es cobertura real**.

> ⚠ **Qué cliente tiene documentos VARÍA con el tiempo** (las facturas se cobran y se drenan). NO confiar en una lista fija del YAML — **descubrir el cliente en runtime**.

**Regla de selección del cliente (orden):**

1. **Descubrimiento dinámico (PRIMARIO — al inicio del módulo):** consultar la **BD local del dispositivo** (lo que la app realmente muestra) para traer candidatos frescos ordenados por cantidad de documentos pendientes:
   ```bash
   node automation/db/local-query.js "SELECT d.id_client, c.na_client, c.co_client, d.co_currency, count(*) docs, round(sum(d.nu_balance),2) saldo FROM document_sales d JOIN clients c ON c.id_client=d.id_client WHERE d.nu_balance > 0 GROUP BY d.id_client, c.na_client, c.co_client, d.co_currency ORDER BY docs DESC, saldo DESC LIMIT 5"
   ```
   Elegir el de **más documentos** (maximiza que aparezcan en UI; la app filtra más que la BD — un cliente con pocos docs en BD puede mostrar 0). Anotar `na_client` + `co_currency` para seleccionarlo y para fijar la Moneda Documento.
   - Si la BD local no responde (`ERR:`) → pasar al paso 2.
2. **Fallback (sin BD):** si el perfil trae `modules.cobros.clientes_con_documentos`, probarlos en orden; si ninguno tiene documentos hoy, recorrer la lista del modal de clientes **uno a uno** y elegir el **primero que muestre documentos** en Tab Documentos.
3. Registrar en el reporte **qué cliente se usó** (nombre + saldo/documento) y que fue descubierto en runtime.
4. Marcar N/A por "sin documentos" **solo** si, tras descubrimiento + recorrido, ningún cliente tiene documentos pendientes (caso extremo).

> **Tip UI (confirmado [prc-2617]):** en Tab Documentos los documentos **no cargan hasta elegir Moneda Documento** (= la `co_currency` del candidato, normalmente USD). Y al seleccionar el cliente en el modal, hacer **`scrollIntoView` del `<p>` del nombre antes de clickear** (sin eso las coordenadas caen fuera del viewport). Para abrir el detalle: `h.openDocumentDetail(pg, {match:'<nroFactura>'})`.

---

## ⚡ Pre-vuelo de datos por TIPO de cobro (OBLIGATORIO antes de correr — dinámico)

> ⚠ **NO hardcodear clientes** (los datos se mueven constantemente). **Descubrir en runtime** qué cliente usar por cada tipo de cobro, ANTES de lanzar el agente. Así el agente va directo, sin explorar ni caer en callejones (ej. abrir IGTF con un cliente que no tiene documento IGTF → 0 docs).

Correr esta consulta y resolver los objetivos por tipo:
```bash
node automation/db/query.js {QA_CLIENTE} "SELECT * FROM (SELECT d.co_document_sale_type tipo, c.na_client, c.co_client, count(*) docs, round(sum(d.nu_balance),2) saldo, row_number() OVER (PARTITION BY d.co_document_sale_type ORDER BY count(*) DESC) rn FROM document_sale d JOIN client c ON c.id_client=d.id_client WHERE d.nu_balance>0 GROUP BY d.co_document_sale_type, c.na_client, c.co_client) t WHERE rn<=2 ORDER BY tipo, docs DESC"
```

Interpretación → objetivo por tipo de cobro:
| Tipo de cobro | Documento que necesita | Cómo resolver del pre-vuelo |
|---|---|---|
| **Normal** (008/040/043) y **Retención por documento** (041/042) | `FACT` (factura con saldo) | cliente top del tipo `FACT` |
| **Retención botón** (029) | `FACT` | cliente top del tipo `FACT` |
| **IGTF** (036/044/045) | `IGTF` (documento IGTF dedicado) | cliente del tipo `IGTF`. **Si NO aparece `IGTF` en el pre-vuelo → IGTF = N/A** (no hay documento elegible; no forzar) |
| **Anticipo** (028) | ninguno (no usa documentos) | cualquier cliente (`cliente_test`) |
| **25% IVA** (037) | — | N/A si `userCanCollectIva=false` |

- Para **seleccionar el documento en la UI**, confirmar también en la BD LOCAL del dispositivo (lo que la app muestra): `local-query` sobre `document_sales` por ese cliente + `co_currency`.
- **Registrar en el reporte** qué cliente se usó por tipo (descubierto en runtime, no fijo).
- El pre-vuelo evita que el agente "piense": llega sabiendo a qué cliente ir por cada tipo.

`modules.cobros.cliente_test` se reserva para los casos que **no** requieren documentos (001, 002, 004, 006, 020/021/038).

**Casos de tipo de cobro (028 Anticipo, 036 IGTF, 037 25% IVA, 029 Retención): completar el flujo, no solo abrir el form.** Validar que el formulario abre con sus tabs es PASS parcial — el caso exige **crear y Guardar** el cobro de ese tipo y **reportarlo en "Registros creados"**. Si al abrir el tipo de cobro el selector de cliente sale vacío ("No hay clientes disponibles"), entonces sí → **N/A con ese motivo** (no hay cliente elegible para ese tipo).

---

## Casos (~34, orden de ejecución)

| ID | Acción clave | PASS cuando | FAIL / N/A |
|----|-------------|-------------|------------|
| DM-COB-001 | Click módulo Cobros | Botones COBRO y BUSCAR siempre visibles; RETENCIÓN/IGTF/25%IVA/ANTICIPO según VGs | FAIL: COBRO o BUSCAR ausentes |
| DM-COB-002 | Click COBRO → formulario | 5 tabs; Documentos/Pagos/Total/Adjuntos `disabled`; campo Cliente vacío | FAIL: tabs habilitadas sin cliente |
| DM-COB-004 | Seleccionar `cliente_test` en modal (`h.clickIonItem`); llenar Comentario si `requiredComment=true` (`h.fillIonInput`) | 4 tabs habilitadas | FAIL: tabs siguen bloqueadas |
| DM-COB-006 | Con cliente seleccionado, dejar Comentario vacío e intentar guardar o navegar a otra tab | Borde de error + etiqueta roja en campo Comentario | N/A si `vgs.requiredComment=false`; FAIL: no aparece error o permite guardar con campo vacío |
| DM-COB-007 | Tab Documentos | Lista de documentos + leyenda Vigente/Vencido/A favor | FAIL: tab vacía con documentos en catálogo |
| DM-COB-008 | Click checkbox en documento (coordenadas con `pg.mouse.click`) | Monto total a pagar en sticky de Pagos actualizado | FAIL: monto no cambia |
| DM-COB-015 | Desplazarse al final del Tab Total | Línea "Total General [moneda]: X" visible | FAIL: Total General ausente o vacío |
| DM-COB-033 | Tab General → selector de moneda del cobro → cambiar entre monedas disponibles | Selector habilitado con al menos 2 opciones; campo actualiza | N/A si `vgs.multiCurrency=false`; FAIL: selector bloqueado con VG activa |
| DM-COB-034 | Tab Documentos → selector Moneda documento → cambiar entre monedas | Lista de documentos recarga/filtra por moneda | N/A si `vgs.multiCurrency=false`; FAIL: documentos no cambian al cambiar moneda |
| DM-COB-041 | Tab Documentos → abrir **detalle** de 1 documento en rojo → ingresar comprobante (longitud exacta según UI «Debe tener N caracteres»; leer de `vgs.sizeRetention`) + fecha retención + monto IVA + ISLR (leer de `modules.cobros.monto_retencion_iva/islr`) → Guardar detalle; Comentario cobro: `Test-COB-041` | Tab Pagos muestra monto neto = saldo − (IVA + ISLR) | N/A si `vgs.retencion=false`; FAIL: Pagos muestra monto bruto sin restar retenciones |
| DM-COB-042 | (encadena DM-COB-041) Completar método de pago con monto = monto neto → Guardar cobro → BUSCAR → reabrir cobro Guardado → verificar Tab Pagos y detalle documento | Pagos muestra mismo monto neto; detalle documento conserva IVA + ISLR | N/A si DM-COB-041 N/A; **FAIL conocido:** al reabrir el total puede volver al bruto (bug pendiente de fix) |
| DM-COB-009 | Tab Pagos → Click "Agregar método de pago" | Modal con métodos habilitados para el cliente | FAIL: modal no abre |
| DM-COB-040 | Marcar `metodo_pago` → AGREGAR → `h.selectIonPopover` banco → `h.fillIonInput` nro depósito + monto = total | Diferencia en **azul** (0,00) | FAIL: diferencia en rojo con datos completos |
| DM-COB-012 | Monto < total → observar diferencia; monto = total → observar | Rojo cuando insuficiente; azul cuando cubre | FAIL: color no cambia |
| DM-COB-043 | (extiende DM-COB-012) Con documento seleccionado y método de pago activo: ingresar monto < total → diferencia **roja**; monto = total → diferencia **azul** | Color cambia correctamente en ambas situaciones | FAIL: color no cambia; diferencia no se actualiza |
| DM-COB-014 | Tab Total | Tabla + acordeones por método; totales no nulos | FAIL: tab vacía |
| DM-COB-016 | Tab Adjuntos | Acordeones Imágenes/Archivo/Firma visibles según VGs | FAIL: acordeón Imágenes ausente — ver nota adjunto abajo |
| DM-COB-018 | Click Guardar | Alert "El Cobro se ha guardado"; cobro en BUSCAR Estatus: Guardado | FAIL: sin alert |
| DM-COB-019 | Click Enviar → ACEPTAR | Cobro "Por Enviar"/"Enviado" SIN segunda alerta | ⏭ SKIP si `vgs.requiredCollectionAttachments=true` — ver nota abajo |
| DM-COB-022 | Click BUSCAR | Lista con cobros + searchbar; botón eliminar solo en Guardado | FAIL: lista vacía |
| DM-COB-024 | Click en cobro Guardado | Formulario editable; botones guardar/enviar activos; **verificar que montos y retenciones (si DM-COB-041 aplicó) se mantienen al reabrir** | FAIL: solo lectura; montos no coinciden con lo guardado |
| DM-COB-026 | Botón basura en Guardado → confirmar ELIMINAR | Cobro desaparece | FAIL: persiste |
| DM-COB-020 | Pulsar atrás con cobro nuevo con cambios | Modal 3 opciones: Guardar y salir / Salir sin guardar / Cancelar | FAIL: sale sin modal |
| DM-COB-021 | Elegir "Salir sin guardar" (cobro **nuevo**, nunca guardado) | Cobro no aparece en BUSCAR | FAIL: aparece Guardado |
| DM-COB-038 | Pulsar atrás → "Guardar y salir" | Cobro aparece en BUSCAR Estatus: Guardado | FAIL: no en lista |
| DM-COB-029 | Click RETENCIÓN → cliente → documentos → Tab Total → Guardar | Guardado OK (sin Tab Pagos); Envío según nota adjunto abajo | N/A si `vgs.cobroRetencion=false`; SKIP envío si `requiredCollectionAttachments=true` |
| DM-COB-028 | Click ANTICIPO/PREPAGO → seleccionar cliente elegible → confirmar 4 tabs (sin Documentos) → Tab Pagos: agregar método + **monto > 0** → **Guardar** → BUSCAR: confirmar que aparece como **Guardado tipo Anticipo** y **reportarlo en "Registros creados"** | Anticipo **creado y Guardado** (visible en BUSCAR), no basta con el form abierto | N/A si `vgs.cobroPrepago=false` o el selector de cliente del Anticipo está vacío |
| DM-COB-036 | Click IGTF → cliente → selector tasa IGTF → documento → Guardar/Enviar | Guardado y Enviado OK | N/A si `vgs.userCanSelectIGTF=false` |
| DM-COB-044 | (encadena 036) Cobro **$** tipo IGTF. **Descubrir el default** leyendo el selector IGTF (lo configura cada cliente en web → varía). **NO** tocarlo → anotar tasa + línea IGTF del Tab Total → Guardar → BUSCAR → reabrir → releer ambos | Al reabrir, selector IGTF **y** línea IGTF del Total = **el mismo default que se guardó** (sea cual sea su %) | N/A si `userCanSelectIGTF=false`; **FAIL:** al reabrir la tasa cambió sola o selector ≠ Total |
| DM-COB-045 | (encadena 036) Cobro **$** IGTF. Leer el default y **cambiarlo a cualquier otra opción** del selector → anotar la elegida → Guardar → BUSCAR → reabrir → releer selector + Total | Al reabrir, IGTF = **la tasa elegida** (no el default), Total coherente | N/A si `userCanSelectIGTF=false` o el selector tiene 1 sola opción; **FAIL conocido (sin fix):** al reabrir revierte al default ignorando el cambio |
| DM-COB-046 | (req. cliente CON documentos) Cobro NORMAL → seleccionar 1 factura → Tab Pagos: anotar "Monto total a pagar" (= total factura) → volver a Documentos → **detalle** de la factura → activar el **toggle "Pago parcial"** (`ion-toggle` del detalle, ver module-selectors COBROS — NO la columna de la tabla) → escribir el monto parcial en el `ion-input` que queda editable → Aceptar → Tab Pagos muestra el **parcial** → Guardar → BUSCAR → reabrir → Pagos sigue mostrando el parcial | "Monto total a pagar" = parcial, idéntico antes y después de reabrir (round-trip §9) | N/A si no se halla cliente con documentos; **FAIL:** al reabrir vuelve al total completo de la factura |
| DM-COB-047 | (req. cliente CON documentos; multiCurrency) Cobro NORMAL → seleccionar factura → Tab Pagos: anotar "Monto total a pagar" → Tab General: cambiar **Fecha tasa** a una fecha **anterior** → confirmar aviso de recálculo → Tab Pagos: el monto **cambió** (recalculado con la tasa de esa fecha) → Guardar → BUSCAR → reabrir → Pagos mantiene el monto recalculado | El monto se recalcula al cambiar Fecha tasa y **persiste** al reabrir | N/A si el cobro no permite cambiar Fecha tasa (sin `canChangeRate`/`historicoTasa`) o sin documentos |
| DM-COB-037 | Click COBRO 25% IVA → seleccionar `modules.cobros.cliente_25iva` (único habilitado; si el perfil no lo trae, el que aparezca en el selector) → flujo igual que cobro normal (documentos + pago) → Guardar/Enviar → **reportar registro** | Cobro 25% IVA Guardado/Enviado y reportado | N/A si `vgs.userCanCollectIva=false` **o el selector del 25% IVA está vacío** ("No hay clientes disponibles") |
| DM-COB-039 | Abrir Guardado → cambiar tasa: **(A)** `#manualRateInput` si `enabledManualRate=true`; **(B)** **Fecha tasa** (General) si `canChangeRate`/`historicoTasa` → recálculo → Guardar; al reabrir la tasa/monto nuevo persiste | Montos recalculados; al reabrir persiste | N/A **solo** si NINGUNA rama aplica (sin manualRate y sin cambio de fecha tasa) |

---

## ⚠ Nota — Adjunto obligatorio (DM-COB-016 / DM-COB-019 / DM-COB-029)

**⚡ Atajo cuando el mock no sirve (evita reintentos inútiles):** si el perfil trae
`modules.cobros.mock_camara_funciona: false` (build PROD donde `ensureAdjunto` SIEMPRE da false,
ej. piercar/romher), **NO llamar `ensureAdjunto`**. Ir directo a Guardar → ⏭ SKIP del envío →
documentar "Guardado, pendiente adjunto manual" → verificar BD LOCAL (queda SAVED). El envío real
con adjunto lo cierra la QA a mano post-corrida. Así no se gasta tiempo en reintentos que ya sabemos
que fallan. (DM-COB-016 igual se verifica: acordeones visibles → PASS.)

**Si `vgs.requiredCollectionAttachments=true` (o RETENCIÓN, que SIEMPRE exige adjunto) Y `mock_camara_funciona` NO es false:**
- DM-COB-016: verificar acordeones visibles → **PASS**.
- DM-COB-018: guardar → **PASS**.
- DM-COB-019 / DM-COB-029 (envío): **intentar ENVIAR de verdad.** Antes de Enviar:
  `const ok = await h.ensureAdjunto(pg);` — inyecta la foto mock (1px) con reintento acotado + **fail-fast**.
  - `ok === true` → Enviar normalmente → **PASS** (el cobro llega a la nube; corroborar en BD §10).
  - `ok === false` (la foto no entró tras los reintentos) → **⏭ SKIP** del envío, documentar "Guardado, pendiente envío manual", y **verificar el cobro en BD LOCAL** (queda SAVED) — así el movimiento **se contempla igual**.
- **NO pelear con el adjunto:** `ensureAdjunto` ya hace fail-fast; si devuelve false, SKIP y seguir (no gastar tiempo).
- Incluir cobros Guardados (no enviados) en "Registros creados" con nota "Pendiente envío manual".

**Si `vgs.requiredCollectionAttachments=false`:**
- DM-COB-016, DM-COB-018, DM-COB-019: ejecutar normalmente.
- DM-COB-019 PASS si el cobro queda "Por Enviar"/"Enviado" sin segunda alerta de adjunto.

## ⚠ Nota — Retención en documento (DM-COB-041 / DM-COB-042)

**Retención tiene DOS puntos de entrada — distintos casos, distintas VG:**
- (a) **Desde el detalle del documento** en un cobro normal → `vgs.retencion` → **DM-COB-041/042** (el monto neto baja en Tab Pagos y debe **persistir** al reabrir).
- (b) **Desde la opción +RETENCIÓN** del menú de cobros (tipo de cobro Retención) → `vgs.cobroRetencion` → **DM-COB-029** (sin Tab Pagos; montos IVA/ISLR en Tab Total; verificar que **persisten** al reabrir).

En **insumar** la retención es la **(b)**: `cobroRetencion=true`, `retencion=false` → 029 aplica; 041/042 N/A.

`vgs.retencion` controla si los campos de retención aparecen en el **detalle de un documento** dentro de un cobro normal (distinto de `cobroRetencion` que controla el botón RETENCIÓN home).

- Leer `vgs.sizeRetention` para saber la longitud exacta del número de comprobante (8, 14 o 16 caracteres según UI).
- Leer `modules.cobros.documento_retencion` para el documento de prueba (factura en rojo con saldo conocido).
- Leer `modules.cobros.monto_retencion_iva` y `monto_retencion_islr` para los montos de retención.
- DM-COB-042: FAIL conocido si al reabrir el cobro el monto en Pagos vuelve al bruto — documentar como FAIL (bug activo) pero continuar corrida.

## ⚠ Nota — Persistencia tasa IGTF (DM-COB-044 / DM-COB-045) · round-trip

Aplican el **oráculo de persistencia (RUNTIME §9)** a la tasa IGTF: verifican que sobrevive el ciclo Guardar → reabrir. Requieren `vgs.userCanSelectIGTF=true` y cobro en **moneda dura ($)**.

- **Las tasas IGTF y cuál es el default los configura cada cliente desde la web → varían por cuenta.** No asumir valores fijos: el agente **descubre el default** leyendo el selector en un cobro $ nuevo y toma como **alterna** cualquier otra opción. `modules.cobros.igtf_tasa_default/alterna` solo registran lo observado — no son precondición.
- **Oráculo por invariante:** el caso NO compara contra un % esperado, sino que **lo guardado = lo reabierto**. Vale para cualquier tasa que tenga configurada el cliente.
- **Oráculo doble:** comparar **el valor del selector IGTF** Y **la línea IGTF en Tab Total** contra lo guardado — el bug puede dejar uno correcto y el otro no.
- **DM-COB-044** (dejar default): FAIL si al reabrir la tasa cambia sola (ej. 3%→0%). En insumar el fix de este sabor está aplicado → **PASS esperado**.
- **DM-COB-045** (cambiar a alterna): FAIL si al reabrir revierte al default ignorando el cambio. `igtf_persistencia_bug2_fixed=false` → **FAIL esperado** mientras no se confirme el fix; al observarse, documentar y continuar (no detiene la corrida).
- Si solo hay 1 tasa IGTF disponible para el cliente → DM-COB-045 = **N/A** (no hay alterna que elegir).

## ⚠ Oráculo — Persistencia del "Monto total a pagar" (Pagos) · los 3 disparadores

El "Monto total a pagar" del Tab Pagos **no debe desactualizarse** tras Guardar → reabrir, **venga el ajuste de donde venga**. Anotar el monto antes de guardar y compararlo tras reabrir (RUNTIME §9). FAIL si vuelve al bruto/total. Casos que lo cubren:

| Disparador del ajuste | Caso(s) |
|-----------------------|---------|
| IGTF | DM-COB-044 / 045 |
| Retención (comp. + fecha + IVA + ISLR) | DM-COB-041 (calcula neto) + **DM-COB-042** (persiste al reabrir) |
| Pago parcial por documento | **DM-COB-046** |
| Tasa por fecha (recálculo del total) | **DM-COB-047** (cobro nuevo) + DM-COB-039 rama B (cobro Guardado) |

---

## Verificación BD v2 — cotejo "lo guardado se envía" (ver RUNTIME §10)

Cobros crea varios registros y de distintos `co_type` → **verificar cada uno**. Mecánica, 5 estados, vocabulario y blindaje (BD caída ⇒ `BD-N/A`, **nunca** tumba el smoke): **RUNTIME §10**.

**1) Nube** (lo que llegó al servidor):
```bash
node automation/db/query.js {QA_CLIENTE} "SELECT c.id_collection, c.co_collection, c.co_type, c.st_collection, c.nu_amount_total, c.nu_amount_final, c.nu_amount_igtf, (SELECT count(*) FROM collection_detail d WHERE d.id_collection=c.id_collection) docs, (SELECT count(*) FROM collection_payment p WHERE p.id_collection=c.id_collection) pagos, (SELECT coalesce(sum(p.nu_amount_partial),0) FROM collection_payment p WHERE p.id_collection=c.id_collection) suma FROM collection c ORDER BY c.da_created DESC LIMIT 8"
```
**Por items, ramificado por `co_type`:**
- `0` cobro normal → `docs`≥1 + `pagos`≥1 + `suma`≈total; `nu_amount_final`=total+IGTF.
- `1` anticipo → `pagos`≥1, `docs`=0.
- `2` retención → `docs`≥1, `pagos`=0, montos de retención presentes.
- IGTF (cualquier tipo) → `nu_amount_igtf` coherente con la línea IGTF del Tab Total (refuerza §9 044/045).
- **Correlación: Nro.Ref UI = `id_collection`** (no el epoch).

**2) Local** (estado guardado→enviado · ⚠ tablas locales en PLURAL):
```bash
node automation/db/local-query.js "SELECT co_collection, id_collection, st_delivery, co_type FROM collections ORDER BY rowid DESC LIMIT 8"
node automation/db/local-query.js "SELECT count(*) en_cola FROM pending_transactions WHERE type='collect'"
node automation/db/local-query.js "SELECT count(*) rechazados FROM failed_transactions WHERE type='collect'"
node automation/db/local-query.js "SELECT count(*) total, count(DISTINCT co_collection) distintos FROM collections"
```
**Veredicto por cobro:**
- `id_collection>0` & `st_delivery=1` & no en cola → **BD-OK** (guardado **y** enviado).
- `id_collection=0` & `st_delivery=3` → **BD-SAVED** (sin enviar; esperado si no hubo adjunto — **FAIL si se envió CON adjunto y aun así quedó así**).
- en `pending_transactions` tras la ventana de sync → **BD-QUEUED** (si persiste → flag: no sincronizó).
- en `failed_transactions` → **BD-MISMATCH** (rechazado por el server).
- `total > distintos` → **BD-MISMATCH** (duplicado — no debe guardarse 2 veces).

**Descubrimiento:** `BD-INFO` hasta graduar la regla Ref↔fila a FAIL.
