# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260729_133234_smoke-completo` |
| Módulo | PEDIDOS |
| Cliente / Playa | latino_cosmetica · isla_coche (`http://denarioislacoche.ddns.net:8081/PremiumWS`) |
| Dispositivo | Infinix X6728 (HOT 60i) · `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — app_version `1.0` · db_version `19` · `window.ng=TRUE` |
| Empresa / Usuario | LATINOCOSMETICA C.A. (`00001`) · NEIMY PARRA (co_login 100 / co_user `00014` / id_user 477) |
| Estado inicial → final | HOME → HOME ✅ |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Tile Pedidos → `/pedidos` con botones PEDIDO · BUSCAR · COPIAR |
| DM-PED-002 | ✅ PASS | `/pedido`: General habilitada; Pedido/Total/Adjunto con `segment-button-disabled`; `#clienteSelect`="Seleccione Cliente"; Guardar/Enviar `button-disabled` |
| DM-PED-006 | ✅ PASS | `setClientfromSelector(ANNELI CA)` → alert "Pedidos / Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" (Cancelar/Aceptar) → Aceptar → las 4 tabs habilitadas, cliente "ANNELI CA (13)" |
| DM-PED-015 | ✅ PASS | Tab Pedido: categorías BELOTTI 74 · BELOTTI COLOR PLUS 0 · PROKPIL 70 · ROIAL 8. Click BELOTTI 74 → 50 `ion-accordion` de productos renderizados |
| DM-PED-017 | ✅ PASS | Producto 3058 expandido (Precio 5,23 $ · IVA 16% · Inventario 23) → cantidad=2 → badge `[color=success]`="2" + `.contadorProductos`="2"; Guardar/Enviar se habilitan |
| DM-PED-024 | ✅ PASS | Tab Total con 2 líneas: **Total Items 2 · Base $15,16 · IVA $2,42 · Total $17,58**. Solo US$, sin Bs. (coherente con `multiCurrencyOrder=false`) |
| DM-PED-026 | ✅ PASS | Trash `ion-button[color=danger]` dentro del acordeón de la línea 3059 (borrado directo, sin confirmación) → **Items 2→1, Total $17,58→$12,14** recalculado |
| DM-PED-029 | ✅ PASS | Con cliente y sin ítems, `.imagenGuardar` y `.imagenEnviar` en `button-disabled` |
| DM-PED-030 | ✅ PASS | Guardar → alert "Denario / Pedido Guardado" (OK). En BUSCAR aparece `Nro. Ref.: 0 · Cliente: 13 - ANNELI CA · Estatus: Guardado · Fecha: 2026-07-29`. Comentario `Test-PED-SMOKE-135551` |
| DM-PED-031 | ✅ PASS | Enviar → 3 alerts: "¿Desea Enviar el pedido?" (Aceptar) → "Su Pedido será enviado" (OK) → **"Pedido nro. 123 enviado exitosamente"** (OK) → navega a `/pedidos`. En lista: Ref 123 · Estatus **Enviado** |
| DM-PED-032 | ✅ PASS | Con ítems sin guardar, atrás (`img.fechaAtras`→`closest('a')`, `pg.mouse.click`) → modal "¡Alerta!" con **Guardar y salir / Salir sin guardar / Cancelar**; Cancelar mantiene el form intacto |
| DM-PED-034 | ✅ PASS | Searchbar "Pedidos...": 6 ítems → tecleando "ANNELI" queda 1 → al limpiar vuelve a 6 (filtrado realtime) |
| DM-PED-035 | ✅ PASS | Click en el Guardado (Ref 0) → form editable con las 4 tabs habilitadas, cliente y comentario rehidratados, Guardar/Enviar activos |
| DM-PED-037 | ✅ PASS | Trash `ion-button[color=danger]` (w≈29) en el ítem de lista → alert "Pedidos / ¿Seguro que quieres eliminar este pedido?" → Aceptar → el pedido desaparece (7→6 ítems) |

## Registros creados en sistema

| Nro. Ref | Caso | Cliente | Producto(s) | Total | Moneda | Estado |
|----------|------|---------|-------------|-------|--------|--------|
| **123** | DM-PED-031 | ANNELI CA (co 13 / id 34) | 3058 BELOTTI ACOND CEBOLLA X 300 ML ×2 UND | **12,14** (Base 10,47 + IVA 1,67) | US$ | Enviado (`st_order=1`, `st_delivery=1`) |
| — (Ref 0) | DM-PED-030/037 | ANNELI CA (co 13) | 3060 BELOTTI ACOND HIDRATACION PROFUNDA ×1 | 5,44 aprox. | US$ | Guardado → **eliminado** en DM-PED-037 (registro de trabajo, no queda en sistema) |

> El pedido Guardado del ciclo 030→031 es el mismo que terminó Enviado como **Ref 123** (no es un registro adicional).

## Verificación BD

**Nube:** `BD-N/A` — la BD de latino_cosmetica está **sin GRANT** en esta corrida (0/185 tablas legibles); no se intentó `query.js`. La llegada a la nube la valida la capa web por **Nro. Ref 123**.

**Local del device** (vía `window.sqlitePlugin`, RUNTIME §10):

| Chequeo | Resultado |
|---------|-----------|
| `orders WHERE id_order=123` | `co_order=1785347664353.0` · `id_order=123` · `st_order=1` (Enviado) · **`st_delivery=1`** (enviado) · `nu_amount_total=12.140096` · `nu_details=1` |
| `pending_transactions` | **0** — salió de la cola |
| `failed_transactions` | **0** — sin rechazo |
| Duplicados | `count(*)=6` = `count(DISTINCT co_order)=6` — sin duplicación |
| Correlación Ref↔fila | **Nro.Ref UI 123 = `id_order` 123** — reconfirma §10 (`BD-INFO`) |

**Payload capturado** (`orderservice/order`, 1 POST, sin duplicación) volcado a `_payloads.jsonl`; manifiesto en `_bd-manifest.jsonl` con cabecera + línea + unidad completas.

Conclusión **guardado→enviado**: el pedido se guardó local, se envió, el servidor devolvió PK 123 y la cola quedó vacía. Local **BD-OK**; nube **BD-N/A** (sin GRANT) pendiente de la capa web.

### Nota de precisión numérica (no es defecto)

Con 2 líneas la UI mostró `Total Base $ 15,16` mientras la suma de los precios **mostrados** (10,46 + 4,69) da 15,15. El payload aclara que el precio unitario real es `nuPriceBase=5.2328` (no 5,23): la app calcula con precisión completa y solo redondea a 2 decimales **al presentar**. No hay descuadre — `Total Pedido` = suma de las líneas en ambos casos.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `app-pedido` expone `setClientfromSelector` | universal (build `window.ng=true`) | El componente con el handler es **`app-pedido`** (no un hijo `app-pedido-general`): `ng.getComponent(document.querySelector('app-pedido')).setClientfromSelector(cli)`, con la lista en `comp.selectorCliente.clientes` (50 clientes ya cargados sin abrir el modal en form fresco) |
| `setClientfromSelector` **SÍ** dispara el alert de deuda vencida | cliente/build | Contradice la nota `[el_valle-20260728]` de `_comunes.md` ("no dispara alert en form fresco"): en latino_cosmetica dispara "Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" siempre que el cliente tenga deuda |
| Aceptar el alert de deuda requiere **bucle de reintento** | universal | En el 2º pedido el primer click en "Aceptar" no tomó y el modal de clientes quedó abierto con el form vacío. Fix: bucle de hasta 3 intentos `alert:not(.overlay-hidden) button` + `offsetParent!==null` con ~2 s entre intentos, y `modal.dismiss(null,'cancel')` si queda `ion-modal.show-modal` residual |
| Al entrar a PEDIDO el modal de cliente **auto-abre** y reusa `ion-item.listaItems` | universal | La misma clase que las categorías del Tab Pedido → un `querySelector('ion-item.listaItems')` buscando "BELOTTI 74" devuelve `null` si el modal de clientes sigue abierto. Verificar `modals===0` antes de buscar categorías |
| Cantidad: asignar `id` al `ion-input[type=number]` del acordeón | universal | `window.__qaH.fillIonInput` necesita selector; sellar `inp.id='qa-cant-<codigo>'` sobre el input del `ion-accordion[value="<codigo>"]` es estable y evita índices frágiles |
| Trash Tab Total recalcula con `pg.mouse.click` | universal (4ª confirmación) | latino_cosmetica La Tortuga → **isla_coche** `window.ng=true`: DM-PED-026 $17,58→$12,14. Refuerza que la falla de ferrenuestro-julio era estado del device |
| Alerta de guardado usa botón **"OK"**, envío usa **"Aceptar"** luego **"OK"** | cliente | "Pedido Guardado" → OK · secuencia de envío = "¿Desea Enviar el pedido?" (Cancelar/**Aceptar**) → "Su Pedido será enviado" (**OK**) → "Pedido nro. X enviado exitosamente" (**OK**) |
| `ion-select` de Empresa presente pero `disabled` con `orderEnterpriseEnabled=false` | cliente | El selector existe en el DOM con el objeto empresa completo preasignado (`idEnterprise:1`, `coEnterprise:"00001"`) y `disabled=true` — confirma el quirk de auto-asignación de este build; no pedir interacción |

## Hallazgos

Ninguno — 0 FAIL. La VG `suggestedOrder=false` se confirma en UI (botón "Pedido Sugerido" ausente) y `multiCurrencyOrder=false` también (Tab Total solo US$), ambos comportamiento esperado, no N/A de caso.

## Watchdog

0 cuelgues de CDP · 0 `TIMEOUT:` · 0 reconexiones. Un único error de script (selector nulo por modal de clientes residual) resuelto en 1 intento de recuperación — no consumió techo de intentos de ningún caso.

*Reporte generado 2026-07-29 · agente QA módulo PEDIDOS*
