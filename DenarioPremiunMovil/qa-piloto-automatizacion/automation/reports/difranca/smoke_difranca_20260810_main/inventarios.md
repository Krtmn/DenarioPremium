# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `smoke_difranca_20260810_main` |
| Módulo | INVENTARIOS |
| Cliente / tenant | difranca — DIFRANCA C.A |
| Playa / servidor | **EL YAQUE** (`denarioelyaque.ddns.net:8081`) |
| Build | **main**, commit `99b138fa` · app v1.0 / db19 · `window.ng=TRUE` · `sqlitePlugin` disponible |
| Empresa efectiva | **DDHP_A12 (id_enterprise 2)** — preseleccionada por el formulario |
| Vendedor QA | `id_user 275` / `co_user '206'` |
| Resultado | **16 PASS · 0 FAIL · 0 BLOCKED · 0 N/A** |
| Estado final | HOME, sin alerts ni modales residuales |

---

## 🔴 LA PREGUNTA QUE ABRE TODO: ¿el módulo existe y funciona?

**SÍ. El módulo INVENTARIOS existe, es 100 % conducible end-to-end y persiste correctamente hasta la nube.**

El perfil `difranca.yaml` traía `inventarios.aplica: false` con motivo *"N/A ESTRUCTURAL — `clientStock=false`
⇒ el módulo no debería existir"*. **Esa predicción es FALSA y queda refutada con dato vivo:**

| Evidencia | Medición |
|---|---|
| Tile en HOME | presente (`p.nombreModulos` = "Inventarios") |
| Ruta / componentes | `/inventarios` → `app-inventarios` · `app-inventario-container` · `app-inventario` |
| Formulario | 4 tabs (General/Inventario/Resumen/Adjuntos), operativo |
| Catálogo | 450 productos accesibles (100 % del catálogo de DDHP_A12) |
| Transacción creada | **Inventario Nro. Ref 17, Enviado** |
| Llegada a la nube | `client_stock` **16 → 17 filas**, cotejo campo-a-campo exacto |

⇒ **Corregir `clientStock` a `true` en `automation/clientes/difranca.yaml`**, y con él
`inventarios.aplica: true` (retirar `motivo_na`). Las 16 filas de `client_stock` no eran residuales: la
última era del 2026-08-07 y ahora hay una del 2026-08-10 creada por esta corrida.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Tile Inventarios → `/inventarios`, botones **INVENTARIO** y **BUSCAR** visibles |
| DM-INV-002 | ✅ PASS | 4 tabs; General habilitada+checked, Inventario/Resumen/Adjuntos `disabled`; `ion-input#clienteSelect` vacío; Guardar/Enviar `disabled` |
| DM-INV-004 | ✅ PASS | CAR755 seleccionado → las 4 tabs habilitan y Guardar pasa a `disabled=false` en el mismo tick |
| DM-INV-008 | ✅ PASS | 7 líneas con badges **1+16+114+4+118+185+12 = 450** = catálogo completo de DDHP_A12 en BD |
| DM-INV-010 | ✅ PASS | `ion-modal.inventory-type-stocks-modal` abre con `mouse.click` simple; 0 popovers residuales |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard`: cantidad **12**, lote **QA0810**, fecha **2026-12-31**; `inventoryRows[0]` refleja los 3 valores |
| DM-INV-012 | ✅ PASS | `.save-btn` acepta sin error; el ítem pasa a "Inventariado: Exhibición" |
| DM-INV-016 | ✅ PASS | Tab Resumen: `Sel │ Código │ Producto │ Exhibición │ Depósito │ Acción` → `CHHCA240U · Champu HD Cacao 240ml · 12 Unidad · —` |
| DM-INV-017 | ✅ PASS | Botón `botonAddAmarillo` "Pedido Sugerido" presente y funcional **pese a `suggestedOrderByDispatchAndReturn=false`** — divergencia UI-vs-config ya documentada en 6 playas, **no es hallazgo nuevo** (ver Observaciones) |
| DM-INV-020 | ✅ PASS | `inventario-sugerido-modal`: "Días desde último Inventario: 1 / **Días para siguiente Inventario: 1**" |
| DM-INV-021 | ✅ PASS | 2 alertas → local `id_client_stock=0`, `st_delivery=3` ⇒ **BD-SAVED** correcto |
| DM-INV-022 | ✅ PASS | 3 alertas, la 3.ª da la Ref → **Inventario nro. 17 enviado exitosamente**; local `id=17`, `st_delivery=1`, colas 0 ⇒ **BD-OK** |
| DM-INV-023 | ✅ PASS | Lista con `Nro. Ref. / Cliente / Estatus / Fecha`; trash solo en el Guardado |
| DM-INV-025 | ✅ PASS | Filtra on-keyup: JAKE→1 · ZZZZ→0 · CAR755→1 · **vacío→2 (repuebla)** |
| DM-INV-026 | ✅ PASS | Reabre el Guardado en ~5 s **en tab General** — defecto conocido cosmético, no FAIL. **Round-trip §9 PASS** |
| DM-INV-028 | ✅ PASS | Trash borra directo sin confirmación previa; desaparece de la lista **y** de la BD local |

---

## 🔴 Pregunta dirigida: ¿el selector de productos tiene el hueco de `PRD-LISTA-CORTA-CATALOGO`?

**NO. El selector de productos de INVENTARIOS NO reproduce el defecto.** Contrastado contra BD, no contra la app.

| Línea | Badge UI | Alcanzables paginando | En BD (DDHP_A12, `co_operation<>'D'`) | Hueco |
|---|---:|---:|---:|---|
| HD Cosmetics | 118 | **118** (modelo y DOM) | 118 | **0** |
| Pasarela | 185 | **185** (modelo y DOM) | 185 | **0** |
| *(los 7 badges)* | **450** | — | **450** | **0** |

- El `ion-infinite-scroll` se apaga (`disabled=true`) **exactamente al llegar al total**, no antes.
- Los 3 productos de referencia quedaron alcanzables: `CHHCA240U` (índice 36), `JHCI180U` (97), `BCBA500U` (usado en el 2.º inventario).
- Los 7 badges de estructura **cuadran 1:1 con la BD**, sin faltantes.

⇒ El hueco de 150/450 de PRODUCTOS y el de 53 del selector de PEDIDOS **no se extienden a INVENTARIOS**.
El componente es distinto (`inventario-product-list`, con `getVisibleProducts()`) y pagina completo.

⚠ **Trampa de medición documentada abajo:** durante la paginación el DOM va **una ronda atrás** del modelo
(modelo 100/DOM 50 → 150/100 → 185/150). Un guión que lea el DOM sin un `applyChanges` final concluiría
falsamente "faltan 35 productos". Con `ng.applyChanges` + ~1,5 s cuadra en 185/185.

---

## 🔴 Pregunta dirigida: la WEB reporta "Inventarios de la empresa principal: 0 de 2"

**El problema es de la WEB, no del móvil: el dato SÍ sube y SÍ está en la nube.** Evidencia:

| Momento | `client_stock` total | de los cuales `id_enterprise=2` (DDHP_A12) |
|---|---:|---:|
| Baseline (antes de la corrida) | 16 | **2** (ids 14 y 15) |
| Tras enviar el Ref 17 | **17** | **3** (ids 14, 15 y **17**) |

Los 2 inventarios que la web dice no encontrar **existen en la BD** (`id_client_stock` 14 y 15, ambos
`st_client_stock=1`, `id_enterprise=2`). El móvil acaba de agregar un tercero por el camino normal y llegó
íntegro. ⇒ **defecto de la capa web (listado/filtro), no de persistencia ni del móvil.**

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **17** | Inventario · CAR755 MULTIDISTRIBUIDORA JAKE, C.A · `CHHCA240U` Champu HD Cacao 240ml ×**12 UND** · lote `QA0810` · venc. 31/12/2026 · ubicación **Exhibición** · empresa DDHP_A12 | **Enviado** ✅ en nube |
| — | Inventario · CAR393 DISTRIBUIDORA LIANG FENG 888 · `BCBA500U` ×5 · lote `QA0810B` | **Guardado y luego BORRADO** (caso DM-INV-028) — no persiste, por diseño |

---

## Verificación BD

### Nivel §10 — guardado → enviado

| Etapa | Local (SQLite device) | Marca |
|---|---|---|
| Tras **Guardar** | `co_client_stock=1786389679982.0`, `id_client_stock=0`, `st_delivery=3`, `co_client=CAR755`; `pending_transactions` vacío | **BD-SAVED** (esperado) |
| Tras **Enviar** | `id_client_stock=**17**`, `st_delivery=**1**`; `pending_transactions`=0; `failed_transactions`=0 | **BD-OK** |

- **Sync a la nube: INMEDIATA** en este módulo (la fila ya estaba en la primera consulta, sin poll).
  ⚠ Contrasta con DEVOLUCIONES del **mismo cliente**, donde fue diferida 5-12 min ⇒ 3.ª confirmación de que
  **la inmediatez es POR MÓDULO**.
- **Correlación Ref↔fila confirmada:** el "Inventario nro. 17" del alert **es literalmente** `id_client_stock=17`
  de la nube. `BD-INFO` (falta 1 corrida limpia más para graduar).
- **Baseline-diff:** `client_stock` 16 → 17; único delta, en la empresa correcta; sin huérfanos ni duplicados.

### Nivel §10.b — cotejo campo-a-campo (**BD-FIELD-OK**)

`client_stock_detail` = 1 fila (`CHHCA240U`, id_product 621) · `client_stock_detail_unit` = 1 fila.

| Cargado en el móvil | En la nube | ✔ |
|---|---|---|
| `CHHCA240U` UND | `co_product_unit = CHHCA240UUND` | ✅ |
| cantidad 12 | `qu_stock = 12.0000` | ✅ |
| lote `QA0810` | `nu_batch = 'QA0810'` | ✅ **poblado** |
| venc. 2026-12-31 | `da_expiration = 2026-12-31 04:00 UTC` (= 31/12 00:00 VET) | ✅ **poblado** |
| Exhibición | `ubicacion = 'exh'` | ✅ |
| empresa DDHP_A12 | `id_enterprise = 2` | ✅ |

🟢 **Lote y vencimiento llegaron poblados a la nube.** La `da_expiration` viaja en UTC con offset −4: al
convertir a hora local da exactamente 31/12/2026 — es correcto, **no** un corrimiento de día.

**Payload capturado** (`__qaH.getPayloadData()`, **1 sola vez, con body**):
`POST …/PremiumWS/services/clientstockservice/clientstock` con `idEnterprise:2`, `coEnterprise:"DDHP_A12"`,
`coClient:"CAR755"`, `idUser:275`, `coUser:"206"`, `coordenada:"11.0490418,-63.8650125"`,
`daysSinceLast:1`, `daysUntilNext:1`.
⚠ El payload manda `stClientStock:0` y `stDelivery:2` — **no son fiables**: corroborar por `id` +
`st_delivery` local (reconfirma latino_cosmetica/globalmp).

---

## Variables Globales medidas en runtime (no predichas)

| VG | Valor en el perfil | Medido en INVENTARIOS | Veredicto |
|---|---|---|---|
| `clientStock` | `false` ⚠️VERIFICAR | **el módulo existe y opera end-to-end** | 🔴 **el perfil MIENTE → poner `true`** |
| `expirationBatch` | `true` | `inventario-product-list.expirationBatch === true` y **BLOQUEA** con lote vacío | ✅ correcto, **y aquí sí obliga** |
| `suggestedOrderByDispatchAndReturn` | `false` | el botón **aparece igual** y opera; el modal **no** renderiza "Sugerido UNIDADES" | ⚠ divergencia conocida (6 playas) |
| `signatureStock` | `false` | no se pidió firma en ningún paso | ✅ coherente |
| `userCanSaveGPS` | `false` | **la coordenada VIAJÓ igual** (`11.0490418,-63.8650125`) y llegó a la nube | ✅ coherente con la corrección del perfil |
| `userMustActivateGPS` | `false` | **no apareció la alerta de geolocalización**; el 1.er click en INVENTARIO abrió el form | ✅ coherente |

---

## Hallazgos

**0 FAIL.** Ningún defecto nuevo de producto en la capa móvil de este módulo.

### 🔑 Hallazgo de valor (no es defecto): `expirationBatch=true` bloquea en INVENTARIOS y NO en DEVOLUCIONES — **medido en el MISMO cliente, misma VG**

Prueba deliberada con dato vivo: cantidad **12** + **lote VACÍO** → el modal **rechaza**:

> **`Inventario`** — *"Complete cantidad, unidad, fecha y lote para continuar."* `[OK]`

Con el lote puesto (`QA0810`), acepta. El campo que efectivamente bloquea es **el LOTE**: la fecha nunca
queda vacía porque trae default de hoy.

Esto es la **prueba más limpia hasta ahora** de que el alcance de `expirationBatch` es **POR MÓDULO**:
el perfil de difranca documenta (corrida 2026-08-07) que en **DEVOLUCIONES** la misma VG en `true`
**no** obliga lote ni vencimiento. ⇒ Mismo tenant, misma VG, mismo build, **dos comportamientos**.
Antes esto se había visto en clientes distintos (el_palmar); ahora está medido dentro de uno solo.
**No es defecto** — es la VG haciendo lo que debe en el módulo donde aplica. Elimina la ambigüedad que
arrastraban `[gmp-20260730]` y `[piercar]`.

### Observaciones (no FAIL, para el consolidado)

1. **Sync parcial de la lista BUSCAR.** El móvil lista 1 inventario histórico (Ref 16, que en BD es de
   `id_enterprise=3`) y **no** los 2 de DDHP_A12 (ids 14 y 15). La BD local tenía **1 de las 16** filas de
   nube. Coherente con el sync parcial ya documentado; **no** marcar FAIL por "faltan inventarios" sin
   contrastar contra la BD local. `BD-INFO`.
2. **La lista de inventarios no parece filtrar por empresa** (muestra uno de la empresa 3 operando en la 2).
   Mismo patrón que el `selectorCliente` de PEDIDOS (296 vs 148). Anotado para verificar, no levantado.
3. **`PRD-BUSCADOR-NO-REPUEBLA` NO reproduce acá:** vaciar el searchbar de la lista BUSCAR **devuelve las 2
   filas**. El defecto es del buscador de PRODUCTOS, no universal a todo searchbar.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **`inventario-product-list` expone la VG y el catálogo completo** | universal (candidato) | `ng.getComponent(document.querySelector('inventario-product-list'))` da `expirationBatch`, `fullProductList`, `getVisibleProducts()`, `page`, `selectedInventoryType` (`'exh'`), `inventoryFilter` (`'all'`), `infiniteScroll`. **Es la forma barata de leer `expirationBatch` en runtime sin tocar la BD** — cierra el gap de "`localStorage.globalConfiguration` no sirve para leer VGs". `[difranca-20260810]` |
| **Cortar la paginación por `comp.infiniteScroll.disabled === true`** | universal (candidato) | En este componente la bandera de corte NO es `sc.scrollDisable` sino `infiniteScroll.disabled` (un `IonInfiniteScroll`). Se apaga exactamente al alcanzar el total. `[difranca-20260810]` |
| 🔴 **El DOM va UNA RONDA ATRÁS del modelo al paginar — `applyChanges` FINAL obligatorio** | universal (candidato) | Medido: modelo 100/DOM 50 → 150/100 → **185/150**. Tras el último `onIonInfinite` hace falta **un `ng.applyChanges` extra + ~1,5 s** para que el DOM cuadre (185/185). Sin eso se concluye falsamente "faltan N productos / el registro no existe". **Extiende** la regla de `[difranca-20260807]`: no basta con aplicar `applyChanges` dentro del bucle, hay que hacerlo **después de cortar**. `[difranca-20260810]` |
| **Selector de empresa de INVENTARIOS: sin `formcontrolname`, preseleccionado, `value` = objeto completo** | cliente (3.ª confirmación del patrón) | `{idEnterprise:2, coEnterprise:"DDHP_A12", lbEnterprise:"*DISTRIBUIDORA DIAZ", coCurrencyDefault:"US$", prioritySelection:0, enterpriseDefault:"true"}`, `ng-valid` ⇒ **no requiere receta**. Confirma la casilla "DEVOLUCIONES·INVENTARIOS·DEPÓSITOS·VISITAS" de la tabla de 4 variantes, ahora con **3 empresas** y en El Yaque. `[difranca-20260810]` |
| **Etiquetas y títulos de alert LEÍDOS (no predichos)** | cliente | Guardar `Denario Inventario` [Cancelar, **Aceptar**] → [**OK**] · Enviar `Denario Inventario` [Cancelar, **Aceptar**] → [**OK**] → `Denario Premium` [**OK**] · Validación de captura **`Inventario`** (¡sin el prefijo "Denario"!) [**OK**] · Borrado `Denario Inventarios` (**plural**) [**OK**], sin confirmación previa. ⚠ **4 títulos distintos en un solo módulo** — reconfirma que la etiqueta se lee, no se predice. `[difranca-20260810]` |
| **`maxlength` del Comentario = 255 en esta APK** | cliente | `ion-input#responsable` con `placeholder="Comentario:"` y `maxlength=255` — **contra 120 medido en alipascua** (misma "v1.0/db19", misma playa El Yaque). Reconfirma que la constante `TEXT_COMMENT_MAX_LENGTH` **no es fija dentro de una versión de build: hay que medirla**. `[difranca-20260810]` |
| **El searchbar de la lista BUSCAR filtra on-keyup Y repuebla al vaciar** | cliente | JAKE→1 · ZZZZ→0 · vacío→**2**. En cambio el **modal de CLIENTES exige click en la lupa** `search-circle-sharp` (≈325,95) — **6.ª confirmación** de que son dos comportamientos distintos en el mismo módulo. `[difranca-20260810]` |
| **`ion-datetime#expDate0`: `value` + `ionChange` basta, sin abrir el overlay** | universal (candidato) | El `#confirm-button` del shadowRoot vino con rect `0×0` (overlay no montado) y aun así `dt.value='2026-12-31'` + `ionChange` **tomó**: el `ion-datetime-button` pasó a rotular `"31 dic 2026"` y el valor sobrevivió Guardar→reabrir→envío→nube. Complementa la receta de `[el_palmar-20260805]` para cuando el overlay no abre. `[difranca-20260810]` |
| **El modal de captura abre con `pg.mouse.click` SIMPLE** | universal (4.ª confirmación) | Sin Pointer+Mouse combinado, pero **exige** `scrollIntoView({block:'center'})` → ~1 s → **re-leer** el rect → validar el **centro** en viewport (360×744). |
| **Cotejo de badges de estructura contra BD como oráculo barato de cobertura de catálogo** | universal (candidato) | Los badges de las 7 líneas del Tab Inventario suman el total exacto del catálogo de la empresa (450). **Comparar la suma de badges contra `count(*)` de BD detecta un hueco de catálogo sin paginar nada.** `[difranca-20260810]` |

---

## Notas para el perfil del cliente (`difranca.yaml`)

1. 🔴 **`clientStock: false` → `true`** (evidencia: módulo operativo + Ref 17 en nube). Y
   `modules.inventarios.aplica: false` → `true`, retirando `motivo_na`.
2. `expirationBatch: true` — **agregar que en INVENTARIOS SÍ es bloqueante** (lote obligatorio), a diferencia
   de DEVOLUCIONES en el mismo cliente. La nota actual dice "acá inventarios está apagado ⇒ el único módulo
   donde se puede leer es DEVOLUCIONES": ya no es cierto.
3. `modules.inventarios` — poblar con `cliente_test: CAR755`, `producto_test: CHHCA240U`,
   `estructura_producto: "Linea"`, y el dato de que el selector de empresa llega preseleccionado en DDHP_A12.
4. `longitudComentario` — el tope real del comentario de inventario en esta APK es **255**, no 120.
5. `notificationsClientStock: true` ⇒ el envío del Ref 17 **disparó correo real** (autorizado por QA).
