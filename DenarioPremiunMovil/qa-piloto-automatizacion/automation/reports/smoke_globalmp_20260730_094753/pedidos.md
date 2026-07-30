# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260730_094753_smoke-completo` |
| Módulo | PEDIDOS |
| Cliente / Playa | globalmp — `la_tortuga` (`http://denariolatortuga.ddns.net:8081/PremiumWS`) |
| Dispositivo | Infinix X6728 (HOT 60i) · UUID `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — appVersion **1.0** · dbVersion **19** · `window.ng=true` |
| Usuario | **YC01** YUSNEIDI CLEMENTE (`id_user` 307) |
| Empresa | **00002 COMERCIALIZADORA GLOBAL M&P** (`idEnterprise` 2) — preseleccionada por el form |
| Cliente de prueba | **ABASTO EL SITIO DSG, C.A. (AS04)** — `id_client` 742 |
| Moneda / tasa | USD (dura) · local BS · `nuValueLocal` **737,88** · `multiCurrency=false` ⇒ Tab Total **solo USD** |
| Estado inicial / final | HOME → HOME ✅ |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Watchdog | `moduleMs=3.600.000` · **0 cuelgues** · 0 reconexiones |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | HOME → tile Pedidos → `/pedidos` con los 3 botones **PEDIDO · BUSCAR · COPIAR** |
| DM-PED-002 | ✅ PASS | `/pedido`: tabs **Pedido/Total/Adjunto** con `segment-button-disabled=true`, solo General activa; `#clienteSelect`="Seleccione Cliente"; Guardar/Enviar `disabled` |
| DM-PED-006 | ✅ PASS | Modal cliente → AS04 → alert **"Pedidos / Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?"** (Cancelar/**Aceptar**) → las 4 tabs quedan habilitadas, `hasClient=true` |
| DM-PED-015 | ✅ PASS | Tab Pedido lista **34 categorías/marcas** (`ion-item.listaItems`): ACEITE 8, CAPRI 60, COLGATE 208, HEINZ 1 96… |
| DM-PED-017 | ✅ PASS | CAPRI → PCE03 expandido → `fillIonInput` cantidad **2** → badge `.contadorProductos`=2 + indicador `[color="success"]` |
| DM-PED-024 | ✅ PASS | Tab Total: **Total Items 2 · Total Base USD 55,93 · Total Pedido USD 55,93**; líneas PCE03 CAJA 2 = 40,40 · PCE04 CAJA 1 = 15,53. Solo USD, sin columna BS |
| DM-PED-026 | ✅ PASS | Trash dentro del acordeón de la línea PCE04 (`ion-button[color="danger"]`, borrado directo sin confirmación) → **Items 2→1 · Total 55,93→40,40** |
| DM-PED-029 | ✅ PASS | Con cliente y **sin ítems**: `.imagenGuardar` y `.imagenEnviar` `disabled=true`; se habilitan solo al cargar la 1ª cantidad |
| DM-PED-030 | ✅ PASS | Comentario `Test-PED-SMOKE-104606` (`#txComment`) + Guardar → alert **"Denario / Pedido Guardado"** (OK); aparece en BUSCAR con **Ref 0 / Estatus Guardado**. BD local: `st_delivery=3` |
| DM-PED-031 | ✅ PASS | Enviar → 2 alerts: "¿Desea Enviar el pedido?" (**Aceptar**) → "Su Pedido será enviado" (**OK**) → navega a `/pedidos`. **Nro. Ref del servidor = 15167** (`id_order`), `st_order=1`, `st_delivery=1` |
| DM-PED-032 | ✅ PASS | Atrás con form **sucio** (ítems sin guardar) → modal **"¡Alerta!"** con 3 opciones [Guardar y salir · Salir sin guardar · **Cancelar**]; Cancelar preserva el form intacto (Items 1, Total 40,40) |
| DM-PED-034 | ✅ PASS | BUSCAR → `ion-searchbar` "Pedidos..." con "AS04" → filtra en tiempo real: de la lista completa a **11 registros, todos AS04** |
| DM-PED-035 | ✅ PASS | Click en el Guardado Ref 0 → `/pedido` editable con **4 tabs habilitadas**; comentario, cliente y Total 40,40 rehidratados (round-trip §9 OK) |
| DM-PED-037 | ✅ PASS | Trash en lista sobre el Guardado propio → alert **"Pedidos / ¿Seguro que quieres eliminar este pedido?"** (Cancelar/Aceptar) → desaparece de la lista **y** de `orders` en BD local |

---

## Registros creados en sistema

| Nro. Ref | Cliente | Empresa | Productos | Total | Moneda | Estado |
|---|---|---|---|---|---|---|
| **15167** | AS04 — ABASTO EL SITIO DSG, C.A. | 00002 COMERCIALIZADORA GLOBAL M&P | PCE03 PASTA ESP. TALLARIN CORTO 12x500gr — **2 CJA** × 20,20 | **USD 40,40** (base 40,40 · IVA 0 · desc. 0) | USD | **Enviado** |
| — (Ref 0) | AS04 — ABASTO EL SITIO DSG, C.A. | 00002 | PCE04 PASTA ESP. TALLARIN LARGO 12x500gr — 1 CJA × 15,53 | USD 15,53 | USD | **Creado, Guardado y luego ELIMINADO** en DM-PED-037 (`co_order` 1785423043132.0) |

> El pedido Guardado preexistente de **CY09** (Ref 0, `co_order` 1785416226660.0) **no se tocó**.

---

## Verificación BD

**Nube (`global_mp`): `BD-N/A`** — sin GRANT en esta corrida (decisión de QA); `query.js` no se usó.
**BD local del device (vía `window.sqlitePlugin`): consultable y usada como oráculo.**
Tablas reales: `orders` · `order_details` · `order_detail_units` (clave `co_order`, no `id_order`).

| Registro | Marca | Fila local | Cola / rechazos | Conclusión guardado→enviado |
|---|---|---|---|---|
| Ref **15167** (`co_order` 1785422440267.0) | **BD-OK (local)** + `BD-N/A` (nube) | `id_order=15167`, `st_order=1`, **`st_delivery=1`**, `nu_details=1`, 1 fila en `order_details`, 1 en `order_detail_units` | `pending_transactions=0` · `failed_transactions=0` · sin duplicados (**359 filas / 359 `co_order` distintos**) | ✅ lo guardado **se envió**; el servidor devolvió PK 15167 y la app la persistió |
| Pedido Guardado (pre-envío) | `BD-SAVED` | `id_order=0`, `st_delivery=3` | fuera de cola | esperado: Guardar no sale del teléfono |
| Guardado eliminado (`co_order` 1785423043132.0) | — | tras DM-PED-037 **ya no existe** en `orders` | 0 / 0 | borrado efectivo en BD, no solo en la vista |

**Correlación confirmada (nueva evidencia):** **Nro. Ref de la UI = `id_order`** (15167). `BD-INFO` según §10.

**Payload capturado:** 1 POST `orderservice/order` **sin duplicar** (a diferencia de los 2 idempotentes de ferrenuestro), volcado a `_payloads.jsonl`. Manifiesto en `_bd-manifest.jsonl`.

---

## Verificación de montos y conversión (defecto de conversión abierto en este cliente)

Se auditó **cada** monto con aritmética explícita contra la tasa vigente **737,88**. **No hay rastro del defecto de conversión en PEDIDOS.**

| Magnitud | Valor | Comprobación | Veredicto |
|---|---|---|---|
| Precio unitario PCE03 | 20,20 USD | catálogo = `nuPriceBase` 20.2 | ✅ |
| Subtotal línea | 40,40 USD | 20,20 × 2 = **40,40** | ✅ exacto |
| IVA | 0,00 | producto con `iva=0 %` → `nuAmountTax=0` | ✅ coherente |
| Descuentos | 0 | `nuAmountDiscount` = `nuAmountGlobalDiscount` = 0 | ✅ |
| **TOTAL** | 40,40 USD | `nuAmountTotalBase` = `nuAmountTotal` = `nuAmountFinal` = 40,40 | ✅ |
| Precio unitario convertido | 14.905,176 | 20,20 × 737,88 = **14.905,176** | ✅ **multiplica**, no divide |
| Total convertido | 29.810,352 | 40,40 × 737,88 = **29.810,352** | ✅ |
| Total con 2 líneas (pre-borrado) | 55,93 | 40,40 + 15,53 = **55,93** (mostrado 55,93) | ✅ sin desvío ni de 1 céntimo |
| Recálculo tras borrar línea | 40,40 | 55,93 − 15,53 = **40,40** | ✅ |

- El Tab Total muestra **solo USD** (`multiCurrency=false`): **no existe columna en BS** en el formulario de pedido ⇒ no hay superficie donde reproducir el cruce de etiquetas Saldo BS/USD del listado de clientes.
- El **modal selector de cliente de PEDIDOS rotula correctamente**: para AS04 muestra `Saldo USD: 2.096,23`, que coincide 1:1 con `cliente.saldo1=2096.23`. El campo `saldo2=1.546.766,1924` = 2.096,23 × 737,88 es el equivalente en BS y **no se muestra mal etiquetado acá**. ⇒ el defecto reportado por el agente de CLIENTES **no se propaga a este modal**.

---

## Hallazgos (no-FAIL) e información para el equipo

1. **[DATO, no defecto de app] Producto `MR04` "PREPARADO DE MAYONESA TRAILER 4x3.6kg" con precio de lista 0,02 USD.**
   Detectado en el pedido Guardado preexistente de CY09 (`co_order` 1785416226660.0): `nu_price_base=0,02` → total 0,0232 USD / 17,12 BS.
   Se verificó explícitamente que **no** es el defecto de conversión: 0,02 × 737,88 = 14,7576 = `nu_price_base_conversion` (**multiplicación correcta**). Es un **precio maestro mal cargado en la lista de precios**, no un cálculo erróneo de la app. Va como hallazgo de datos.
2. **Botón "Pedido Sugerido" NO aparece** en ninguna tab del formulario (General/Pedido/Total/Adjunto) pese a `suggestedOrderByDispatchAndReturn=true` en el perfil. Además **no existe una tab "Resumen"** en este build: las tabs son exactamente **General · Pedido · Total · Adjunto**. Es la **misma divergencia UI-vs-config** ya levantada en jerez / ferrenuestro / dm-electronica → ⚠ **verificar con desarrollo** qué VG gobierna realmente ese botón; el dato del perfil globalmp debe corregirse.
3. **`orderTypeByEnterprise=true` no impidió operar:** el `ion-select` de Empresa llegó **preseleccionado en 00002** (`idEnterprise=2`, `coCurrencyDefault=USD`) y habilitado; `idOrderType=4` se resolvió solo. No hizo falta forzar la empresa.
4. **Inventario reservado en vivo:** al cargar 2 unidades de PCE03 el "Inventario" mostrado bajó de **3,00 → 1,00** en la misma vista. Comportamiento consistente (reserva), se documenta por si otro agente lo lee como catálogo cambiante.
5. **La 3ª alerta de envío ("Pedido nro. X enviado exitosamente") no se observó** en esta corrida: la secuencia fue de **2 alerts** ("¿Desea Enviar el pedido?" → "Su Pedido será enviado") y la app navegó directo a `/pedidos`. El envío **sí fue exitoso** (Ref 15167 confirmada en BD local). Difiere de ferrenuestro/latino_cosmetica, que reportan 3 alerts. No es FAIL — puede ser timing de captura; se anota para la próxima corrida.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **Home de PEDIDOS usa `ion-button.colorBorderBuscar`, NO `p.nombreModulos`** | universal (candidato) | En `app-pedidos` los 3 accesos son `<ion-button class="colorBorderBuscar">` con `textContent` PEDIDO/BUSCAR/COPIAR. La convención de `_comunes.md` (`p.nombreModulos` → `closest('a')`) es de **`app-home`** y **falla dentro del módulo**. Localizar por `Array.from(root.querySelectorAll('ion-button')).find(b=>b.textContent.trim()==='PEDIDO')` + `mouse.click` al centro |
| ⚠ **`img.fechaAtras` tiene copias OCULTAS con rect 0×0** | universal | `document.querySelector('img.fechaAtras')` devuelve una instancia con `getBoundingClientRect()` = 0,0,0,0 → el click cae en (0,0) sobre el `ION-GRID` y **no navega, sin error**. Costó 2 intentos volver a HOME. **Filtrar siempre por `width>0`**: `Array.from(document.querySelectorAll('img.fechaAtras')).filter(e=>e.getBoundingClientRect().width>0)[0]`. Mismo criterio que se aplica a alerts (`offsetParent!==null`) |
| ⚠ **`setClientfromSelector` / `selectorCliente.selectClient()` NO prenden en globalmp La Tortuga v1.0** | cliente (contradice `[latino_cosmetica-20260729]`) | Con `window.ng=true`, `comp.setClientfromSelector(cli)` y `sc.selectClient(cli)+sc.sendClient()` se ejecutan **sin lanzar** pero el form queda en "Seleccione Cliente", `hasClient=false` y las tabs siguen bloqueadas. **La vía que funciona es el modal real**: click en `#clienteSelect` → `ion-item` que contiene el código del cliente → `scrollIntoView({block:'center'})` → `mouse.click` al **35 % del ancho y 35 % del alto** del item |
| **Modal de cliente de PEDIDOS: SIN searchbar, 50 items, ordenado alfabéticamente** | cliente | Sin `ion-searchbar` (confirma ferrenuestro). Cada item trae `Nombre · Código: XXNN · Saldo USD: N.NNN,NN · Más detalles`. Con clientes al inicio del alfabeto (AS04) el item queda arriba y el click es fiable |
| **Producto = sub-acordeón anidado (build viejo), NO `ion-accordion`** | cliente | globalmp La Tortuga v1.0 tiene **`ion-accordion-group` = 0** en Tab Pedido: confirma la estructura `[gmp-2611]` (categoría `ion-item.listaItems` → click inyecta productos como `ion-item` hermanos → click en el producto revela su `ion-input[type=number]`). **Contradice** la variante `ion-accordion` del build refactorizado El Yaque. Detectar por `querySelectorAll('ion-accordion-group').length` |
| **Sellar `id` sobre el input de cantidad por descarte** | universal | Generalización de `[latino_cosmetica-20260729]`: tras expandir un producto, el **único** `ion-input[type=number]` con `height>0` que **no tenga ya un id sellado** es el del producto recién abierto → asignarle `id='qa-cant-<COD>'` y usar `__qaH.fillIonInput('#qa-cant-<COD>', n)`. Evita índices frágiles y funciona con varios productos abiertos |
| **`page.__qa` persiste entre llamadas de `browser_run_code_unsafe`** | universal (candidato, alto ahorro) | El objeto `page` del MCP es **la misma instancia JS** en todas las llamadas. Inlinar `connectCdp/withTimeout/_espera/makeWatchdog/waitSyncOverlay` **una sola vez** y guardarlos en `page.__qa` permite que las llamadas siguientes empiecen con `const q=page.__qa; const pg=await q.connectCdp(page);` — ~40 líneas menos por llamada. Complementa el truco de `window.__qaSrc`+`eval` (que aplica al lado *página*; éste aplica al lado *Playwright*) |
| **`getCapturedPayloads()` de esta corrida SÍ trae `{url, data}`** | corrida | El hook heredado en el WebView de globalmp-20260730 devuelve el body completo; **no** hace falta `getPayloadData()` (que aquí no existe) ni reinstalar nada. 1 POST por envío, sin duplicación |
| **`st_order=1` también en pedidos GUARDADOS** | universal | En La Tortuga v1.0 un pedido recién Guardado ya nace con `st_order=1`; el discriminador fiable guardado-vs-enviado es **`st_delivery`** (3=guardado / 1=enviado) e `id_order` (0 vs PK). No usar `st_order` para juzgar el envío |
| **Alertas del módulo (textos exactos)** | cliente | Deuda vencida: hdr "Pedidos" / "Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" [Cancelar·**Aceptar**] · Guardar: "Denario" / "Pedido Guardado" [**OK**] · Envío: "Pedidos"/"¿Desea Enviar el pedido?" [Cancelar·**Aceptar**] → "Denario Pedidos"/"Su Pedido será enviado" [**OK**] · Borrado en lista: "Pedidos"/"¿Seguro que quieres eliminar este pedido?" [Cancelar·**Aceptar**] · Dirty-guard: hdr "**¡Alerta!**" (mensaje vacío) [Guardar y salir · Salir sin guardar · Cancelar] — **comparar por igualdad exacta** |
| **Trash de la lista `app-pedidos-lista`: w≈29 h≈25 en el borde derecho** | cliente | Coords reales del botón danger del item (x≈301). Reconfirma `[gmp-2611][ins-2622]`: para **abrir** el pedido hay que clickear al **30 % del ancho** (zona izquierda); el derecho es el trash |

---

## Notas de operación

- **0 cuelgues de CDP**, 0 reconexiones, 0 BLOCKED. Todas las operaciones bajo `wd.run(...)` con `page` pasado al watchdog.
- **Regla de adjuntos respetada:** no se tocó la cámara, no se instalaron mocks, no se adjuntó nada. La tab **Adjunto** existe pero **no fue obligatoria** para Enviar (`hasAttachments=false`, `nuAttachments=0`) ⇒ ningún caso quedó en SKIP por adjunto.
- Se respetó el pedido Guardado preexistente de CY09 y no se tocaron cobros ni depósitos.
