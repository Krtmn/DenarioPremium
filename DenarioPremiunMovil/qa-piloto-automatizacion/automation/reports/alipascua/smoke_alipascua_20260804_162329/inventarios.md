# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260804_162329_smoke-completo` |
| Módulo | INVENTARIOS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Playa | EL YAQUE (`denarioelyaque.ddns.net:8081`) |
| Cliente QA | alipascua · empresa ALIP_BSD (id 2) · usuario 002 / idUser 468 |
| Cliente de prueba | V28556138 — RENZO FERNANDO MARTINEZ MEJIAS |
| Resultado | **15 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |
| Watchdog | 0 cuelgues · 0 reconexiones · módulo dentro del techo (45 min) |
| GPS | ✅ sin problemas — coordenada real `11.0490591,-63.8649902` persistida en la cabecera del servidor |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | `/inventarios` · `app-inventarios` visible con botones INVENTARIO y BUSCAR |
| DM-INV-002 | ✅ PASS | 4 tabs (General/Inventario/Resumen/Adjuntos); solo General habilitada, resto `disabled`; campo Cliente vacío |
| DM-INV-004 | ✅ PASS | Cliente `RENZO FERNANDO MARTINEZ MEJIAS (V28556138)` seteado → las 4 tabs habilitan; sucursal cargada (`id_address_client=884`) |
| DM-INV-008 | ✅ PASS | Nivel familias: 7 (CASA CLEAN 6, IANCARINA 95, ISOLA FOODS 192, JAI 28 GROUP 49, OLYMPIA 46, PARAWA 77, SUALCA 2) → CASA CLEAN abre 6 productos + sub-segmentos UBICACIÓN/FILTRO |
| DM-INV-010 | ✅ PASS | `ion-modal.inventory-type-stocks-modal` abre con **click simple** · campos Cantidad, Lote, Fecha venc (`ion-datetime#expDate0`), `ion-select` unidad UNIDAD/BULTO, iconos close/checkmark/trash/add |
| DM-INV-011 | ✅ PASS | `h.fillNgModelKeyboard` cantidad=12 → reflejado en el modal; 2.º inventario: cantidad=7 + lote `QA0804` también reflejados |
| DM-INV-012 | ✅ PASS | `.save-btn` cierra el modal sin error y el producto queda `Inventariado: Exhibición` — **aceptó con lote vacío** (coherente con `expirationBatch=false` a nivel validación) |
| DM-INV-016 | ✅ PASS | Tab Resumen: tabla Sel/Código/Producto/Exhibición/Depósito/Acción → `7599220000011 · CLORO BLANCURA… · 12 UNIDAD · Depósito -` |
| DM-INV-017 | 🚫 N/A | VG `suggestedOrderByDispatchAndReturn=false`: el modal `inventario-sugerido-modal` **no renderiza cantidades sugeridas** (solo Moneda + días + producto). El botón `botonAddAmarillo` sí aparece — divergencia UI-vs-config ya documentada en 6 playas, no hallazgo nuevo. Cerrado con `dismiss(null,'cancel')`: **no se creó pedido** |
| DM-INV-020 | ✅ PASS | "Días hasta siguiente inventario: **1**" (y "Días desde último inventario: 1") visibles en el modal sugerido; persistidos en nube como `days_until_next=1` / `days_since_last=1` |
| DM-INV-021 | ✅ PASS | `¿Desea guardar el Inventario?` [Cancelar/Aceptar] → `Inventario guardado con éxito` [OK]. El 2.º inventario aparece en BUSCAR con **Nro. Ref.: 0 · Estatus: Guardado** |
| DM-INV-022 | ✅ PASS | **3 alertas**: `¿Desea enviar el Inventario?` [Cancelar/Aceptar] → `El Inventario será enviado` [OK] → **`Inventario nro. 5 enviado exitosamente`** [OK] → navega al home de inventarios |
| DM-INV-023 | ✅ PASS | Lista BUSCAR con `Nro. Ref. / Cliente / Estatus / Fecha`; Ref 5 presente como **Enviado** |
| DM-INV-025 | ✅ PASS | Searchbar `Inventarios...` filtra **en tiempo real** (sin lupa): `RENZO`→1 · `ZZZZ`→0 · vacío→3 |
| DM-INV-026 | ✅ PASS | El Guardado reabre con cliente y comentario intactos. **Abre en tab General** — defecto conocido (RUNTIME §5), cosmético, no re-marcado FAIL |
| DM-INV-028 | ✅ PASS | Trash `ion-button[color="danger"]` → `¡EL Inventario se borro con exito!` [OK] (sin confirmación previa) → desaparece de la lista (4→3) **y de la BD local** |

## Registros creados en sistema

| Ref (UI) | co_client_stock (epoch) | Detalle | Estado |
|-----|-------------------------|---------|--------|
| **5** | `1785881948981.0` | V28556138 RENZO FERNANDO MARTINEZ MEJIAS · `7599220000011` CLORO BLANCURA Y DESINFECCION TOTAL 12X1LTRS · **12 UNIDAD** · ubicación `exh` · lote vacío · venc 04/08/2026 · comentario "QA smoke 20260804 inventario alipascua" | **Enviado** (`st_client_stock=1`, local `st_delivery=1`) |
| 0 (local) | `1785882473962.0` | V28556138 · `75992200000281` DESINFECTANTE AROMA CEREZA 12X1LTRS · **7 UNIDAD** · lote `QA0804` · comentario "QA smoke 2do guardado 20260804" | **Guardado → BORRADO** en DM-INV-028 (nunca se envió; era el insumo de DM-INV-026/028) |

## Verificación BD

**Baseline (inicio):** `client_stock` → 4 filas, `max(id_client_stock)=4`.
**Diff:** exactamente **1 fila nueva** (`id=5`), la esperada. Sin filas huérfanas.

**Cabecera nube (`client_stock` id=5) — `BD-OK`**

| Campo | Nube | Cargado por UI | ✓ |
|---|---|---|---|
| `co_client_stock` | `1785881948981.0` | epoch del payload | ✓ |
| `st_client_stock` | `1` (= Enviado en El Yaque) | Enviado | ✓ |
| `co_client` / `id_client` | `V28556138` / 1744 | cliente de prueba | ✓ |
| `tx_comment` | `QA smoke 20260804 inventario alipascua` | idem | ✓ |
| `co_user` / `id_user` | `002` / 468 | usuario QA | ✓ |
| `id_enterprise` / `co_enterprise` | 2 / `ALIP_BSD` | empresa única | ✓ |
| `id_address_client` | 884 | sucursal auto-cargada | ✓ |
| `coordenada` | `11.0490591,-63.8649902` | GPS real del device | ✓ |
| `days_since_last` / `days_until_next` | 1 / 1 | lo mostrado en el modal sugerido | ✓ |
| hijas | `det=1` · `units=1` | 1 producto, 1 captura | ✓ |

**Detalle + unidad (`client_stock_detail` / `client_stock_detail_unit`) — `BD-FIELD-OK`**

| Campo | Nube | UI | ✓ |
|---|---|---|---|
| `co_product` | `7599220000011` | CLORO BLANCURA | ✓ |
| `qu_stock` | `12.0000` | 12 | ✓ |
| `co_product_unit` | `7599220000011UNI` | UNIDAD | ✓ |
| `ubicacion` | `exh` | Exhibición | ✓ |
| `nu_batch` | `""` | lote dejado vacío a propósito | ✓ |
| `da_expiration` | `2026-08-04` | default de hoy | ✓ |
| `co_enterprise` | `ALIP_BSD` | empresa | ✓ |

**Duplicados:** `count(*)=5` = `count(DISTINCT co_client_stock)=5` → sin duplicados.

**Local (SQLite del device vía `window.sqlitePlugin`)**

| Registro | `id_client_stock` | `st_delivery` | En cola | Veredicto |
|---|---|---|---|---|
| Ref 5 (mío, enviado) | 5 | **1** | no | **BD-OK** — guardado→enviado confirmado |
| 2.º inventario (guardado) | 0 | **3** | no | **BD-SAVED** antes del borrado; tras el trash desaparece de `client_stocks` |

`failed_transactions` (type=`clientStock`) = **0**. Payload `clientstockservice/clientstock` capturado **1 sola vez** para mi envío, con `data` completo (`quStock:12`, `ubicacion:"exh"`, `daysSinceLast:1`, `daysUntilNext:1`, coordenada). ⚠ El payload manda `stClientStock=0`/`stDelivery=2`: corroborar por `id` + `st_delivery` local, **no** por el `st` del payload (reconfirma latino_cosmetica/globalmp).

**Conclusión guardado→enviado:** lo que se guardó se envió; el Ref de UI (5) = `id_client_stock` (5). Round-trip §9 (Guardar→reabrir) **PASS**: cliente, comentario, cantidad (7), lote (`QA0804`) y fecha sobreviven la reapertura sin mutar.

## Observaciones (no son FAIL — para desarrollo / perfil)

**1. `BD-INFO` — un pendiente `clientStock` ya aceptado por el servidor se re-postea indefinidamente.**
`pending_transactions` contiene 1 fila `co_transaction=1785872185773.0` type=`clientStock` que **ya está en la nube** (`id_client_stock=4`, `st_client_stock=1`, creada 19:36 UTC, previa a esta corrida — no la generó este módulo). El hook de payload capturó **22 POST idénticos** de ese mismo registro a lo largo de ~2,7 h (≈1 cada 7 min) contra `clientstockservice/clientstock`. Localmente quedó con `st_delivery=2` (ni 1=enviado ni 3=guardado), que parece ser el estado que impide cerrar el pendiente.
Aritmética: 23 POST capturados a `clientstock` = **22 del registro 1785872185773.0** + **1 del mío**. Sin daño de datos (el servidor deduplica: 5 filas / 5 `co_client_stock` distintos), pero la cola nunca se limpia y el tráfico se repite sin fin. **Verificar con desarrollo** por qué el ACK no marca el pendiente como resuelto cuando el registro quedó en `st_delivery=2`.

**2. Perfil a corregir — `longitudComentario: 200` no gobierna el comentario de inventarios.**
Medido: se tecleraron **200** caracteres, el campo aceptó **120** (`maxlength=120` en el DOM). No es defecto de la app: el límite viene de la constante de producto `TEXT_COMMENT_MAX_LENGTH` (`src/app/utils/text-comment-field.constants.ts`), aplicada vía `applyTextCommentMaxLength` en `inventario-general.component`. En el fuente actual esa constante vale **255**; la APK instalada (El Yaque v1.0) trae **120**. La VG `requiredComment`/`longitudComentario` gobierna **cobros** (`requiredCommentOrder` en pedidos), no inventarios. ⇒ Ajustar el YAML de alipascua: la nota de "comentario obligatorio, 200 caracteres" no aplica a este módulo (aquí el comentario **no** fue obligatorio: Guardar y Enviar estaban habilitados con el campo vacío).

**3. `expirationBatch=false` renderiza igual Lote y Fecha de vencimiento** (7.ª playa con la misma divergencia). Confirmado a nivel **validación**: el modal aceptó con lote vacío y la nube recibió `nu_batch=""`. Sin cambio de veredicto.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Tabs por `textContent` **case-insensitive** | universal | El `ion-segment-button` rotula `Inventario`/`Resumen`; el MAYÚSCULAS es CSS `text-transform`. Un match exacto contra `'INVENTARIO'` **falla** (costó 1 reintento). Comparar con `.toLowerCase()` |
| Campo Comentario del form de inventario | universal | `input[placeholder="Comentario:"]` — el `ion-input` tiene **id dinámico** (`ion-input-NNN`); localizar por placeholder. Foco por `mouse.click` en coords + `keyboard.type` + emitir `input/change/ionInput/ionChange/blur` |
| `maxlength` del comentario = constante de producto, no VG | universal | `TEXT_COMMENT_MAX_LENGTH` (120 en APK El Yaque v1.0 / 255 en fuente). No leerlo como incumplimiento de `longitudComentario` |
| Searchbar de la lista BUSCAR **sí** filtra on-keyup | cliente (El Yaque v1.0) | Contrasta con el **modal de clientes**, que en el mismo build **no** filtra al teclear y exige click en `ion-icon[name="search-circle-sharp"]` (4.ª confirmación de la lupa) |
| Modal de captura abre con **click simple** | cliente (El Yaque v1.0) | No hizo falta el Pointer+Mouse combinado de `[gmp-2611]`; sí hizo falta `scrollIntoView({block:'center'})` + re-leer rect + validar `0<y<744` |
| Sin alerta de geolocalización y **el 1.er click en INVENTARIO abre el form** | cliente (El Yaque v1.0) | Como globalmp, contrasta con latino_cosmetica. Depende del permiso de ubicación del device, no del build |
| Envío = **3 alertas**, la 3.ª trae el Nro.Ref | universal (3.ª confirmación) | `Inventario nro. <REF> enviado exitosamente` — evita volver a la lista para obtener la Ref |
| Trash del Guardado **sin confirmación previa** | universal | Va directo a `¡EL Inventario se borro con exito!` [OK]; borra también en la BD local |
| Cola local legible sin `sqlite3` | universal | `pending_transactions` tiene solo 3 columnas: `co_transaction`, `id_transaction`, `type`. Descubrir esquema con `pragma_table_info` antes de consultar |

*Traza RECORD: no aplica (sin `QA_MODE=record` en el prompt).*
