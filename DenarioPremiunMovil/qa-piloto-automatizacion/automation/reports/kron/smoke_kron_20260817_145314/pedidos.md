# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_145314_smoke-completo` |
| Módulo | PEDIDOS |
| Cliente | kron — CHOCOLATES KRON, C.A (`KRON_ADM`, `id_enterprise=1`) |
| Dispositivo | Infinix X6728 (HOT 60i) — `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — app_version **1.0** / db_version **19** · `window.ng=TRUE` · `sqlitePlugin` OK |
| Playa | **ISLA COCHE** — `http://denarioislacoche.ddns.net:8081/PremiumWS/services/` (confirmada por el host del POST) |
| Usuario | `scarlet` · `id_user=309` · `co_user=VE0002` · 30 clientes |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | `/pedidos` con los 3 accesos `ion-button.colorBorderBuscar`: PEDIDO · BUSCAR · COPIAR |
| DM-PED-002 | ✅ PASS | Form sin cliente: tabs Pedido/Total/Adjunto `segment-button-disabled`, `lockSegments=true`, Guardar/Enviar `disabled` |
| DM-PED-006 | ✅ PASS | Cliente `J504480975` (id_client 524) por `co_client`; alerta **"Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?"** `[Cancelar, Aceptar]` aceptada al 1.er intento → 4 tabs habilitadas, `lockSegments=false` |
| DM-PED-015 | ✅ PASS | Tab Pedido lista 9 categorías (ARTESANAL 2 … UNTABLES 32) + líneas Favoritos/DESTACADOS/Carrito; buscador devuelve `BALLS BLANCO 10X1KG · Código: 51104106 · Precio: 101,40 USD` |
| DM-PED-017 | ✅ PASS | Cantidad 2 → `orderServ.carrito.length=1`, badge `.contadorProductos="2"`, ítem rotula `BULTO: 2` |
| DM-PED-024 | ✅ PASS | Tab Total: Total Items 2 · Base USD **385,32** / BS **297.108,69** · Tasa 771,07. Aritmética exacta (101,40×2 + 60,84×3) |
| DM-PED-026 | ✅ PASS | Trash del ítem 51104118 (1.er intento): carrito 2→1, total **385,32 → 202,80 USD**. Borrado directo, sin confirmación |
| DM-PED-029 | ✅ PASS | Con cliente y **sin ítems**, `.imagenGuardar`/`.imagenEnviar` siguen `disabled=true`; habilitan al agregar la 1.ª línea |
| DM-PED-030 | ✅ PASS | Alert **`Denario / Pedido Guardado`** `[OK]` (~6,2 s). Aparece en BUSCAR como `Nro. Ref.: 0 · Estatus: Guardado`. Comentario `Test-PED-SMOKE-153335` |
| DM-PED-031 | ✅ PASS | **3 alerts**: `¿Desea Enviar el pedido?` `[Cancelar, Aceptar]` → `Su Pedido será enviado` `[OK]` → **`Pedido nro. 5086 enviado exitosamente`** `[OK]` → navega a `/pedidos` (~14,8 s) |
| DM-PED-032 | ✅ PASS | Atrás con form dirty → modal **`¡Alerta!`** de 3 opciones `[Guardar y salir, Salir sin guardar, Cancelar]`; Cancelar conservó el pedido (carrito=1) |
| DM-PED-034 | ✅ PASS | Searchbar filtra en tiempo real 8→1 con `BIMBO`; **al vaciar repuebla a 8** (sin empty-state) |
| DM-PED-035 | ✅ PASS | Reabre el Guardado editable con las 4 tabs habilitadas (~9 s de rehidratación); `#clienteSelect` pasa a `disabled` (defensivo, no FAIL) |
| DM-PED-037 | ✅ PASS | Trash en lista → `Pedidos / ¿Seguro que quieres eliminar este pedido?` `[Cancelar, Aceptar]` → lista 9→8, Ref 0 desaparece y la fila sale de `orders` |

## Oráculo de persistencia (RUNTIME §9)

Guardar → salir → BUSCAR → reabrir. Comparación **1:1 sin divergencias**:

| Campo | Guardado | Reabierto |
|-------|----------|-----------|
| Cliente | `MINIMARKET BICENTENARIA CCS, C.A. (J504480975)` | idem |
| Tipo de pedido | PEDIDO ESTANDAR (`idOrderType=1`, `KIB-PE`) | idem |
| Moneda | USD | USD |
| Tasa | 771,07 | 771,07 |
| Línea / cantidad | 51104106 × 2 BULTO | idem |
| Comentario | `Test-PED-SMOKE-153335` | idem |
| Condición de pago | CREDITO 15 DIAS (`co 15`) | idem |
| Total | USD 202,80 / BS 156.373,00 | idem |

## Registros creados en sistema

| Ref | epoch (`co_order`) | Cliente | Detalle | Total | Estado |
|-----|--------------------|---------|---------|-------|--------|
| **5086** | `1786994993455.0` | J504480975 — MINIMARKET BICENTENARIA CCS, C.A. | 51104106 BALLS BLANCO 10X1KG × 2 BULTO | **USD 202,80** (BS 156.373,00) | **Enviado** — BD-OK |
| 0 (efímero) | — | J504480975 | 51104107 × 1 | — | Guardado y **eliminado** en DM-PED-037 |

## Verificación BD (RUNTIME §10)

**Baseline:** `order` = 5053 filas · `max(id_order)` = 5085.

**Nube** (`WHERE id_order > 5085` — diff completo, 1 fila nueva):

| Campo | Valor |
|-------|-------|
| `id_order` / `co_order` | 5086 / `1786994993455.0` |
| `st_order` | 1 (Enviado) |
| `id_client` / `id_user` | 524 / 309 |
| `co_currency` / `nu_value_local` | USD / 771,07 |
| `nu_amount_total` / `_final` / `_total_base` | 202,80 / 202,80 / 202,80 |
| `nu_amount_total_conversion` | 156.372,996 |
| `nu_details` / det / units | 1 / 1 / 1 |
| `tx_comment` | `Test-PED-SMOKE-153335` |
| `id_order_type` | **1** ✅ persistió |
| `co_order_type` | NULL (ver nota) |
| `id_enterprise` / `co_enterprise` | 1 / `KRON_ADM` |
| `co_payment_condition` | `15` |

**Detalle** (`order_detail` + `order_detail_unit`): `co_product 51104106` · `nu_price_base 101,40` · `nu_amount_total 202,80` · `iva 0` · `nu_discount_total 0` · `co_price_list P151104106` · `co_product_unit 51104106BUL` · `qu_order 2` · `qu_suggested 0` · `nu_base_total 202,80`. Cuadra 1:1 con la UI y con el payload.

**Local (`sqlitePlugin`):** `orders` → `id_order=5086`, `st_delivery=1`, `nu_details=1`, comentario intacto · `pending_transactions(type='order')=0` · `failed_transactions(type='order')=0` · sin duplicados.

**Marca: `BD-OK`.** Sync a la nube **INMEDIATA**. Conclusión guardado→enviado: lo guardado se envió íntegro.

**Payload:** 1 solo POST a `orderservice/order`, capturado **una vez y con body completo** (0 duplicados). Volcado en `_payloads.jsonl`.

## Veredictos pedidos por la QA

### 1. Pedido sugerido → 🚫 **N/A por datos** (no es FAIL)

Doble evidencia, y las dos apuntan al mismo lado:

- **UI:** no existe botón de pedido sugerido en **ninguna** tab. `/suger/i` sobre `document.body.innerHTML` devuelve **false** y el barrido de nodos-hoja de `app-pedido` devuelve **0 hits**. Las tabs son exactamente General · Pedido · Total · Adjunto.
- **Código presente pero sin insumo:** el servicio **sí** expone la maquinaria — `orderServ.sugerirPedido()`, `orderServ.datosPedidoSugerido`, `orderServ.desdeSugerencia`, `marcarInventarioSugeridoStPorEnviar` — y sin embargo la tabla que la alimenta, **`client_avg_product`, tiene 0 filas y 0 clientes** en la nube de kron.

Con `suggestedOrder=true` + `suggestedOrderByDispatchAndReturn=false` (algoritmo viejo por promedio de `client_avg_product`), **no hay nada que promediar**: sin insumo no hay sugerencia que ofrecer. Coherente con `qu_suggested=0` en el detalle y en la unidad del pedido enviado. **9.ª playa** con la divergencia UI-vs-config (jerez, ferrenuestro, dm-electronica, globalmp, latino_cosmetica, alipascua, grupo_fiel, kron). ⚠ Sigue pendiente que **desarrollo confirme qué VG gobierna realmente el botón** — no tocar la VG.

### 2. ¿El tipo de pedido viaja y persiste? → ✅ **SÍ, por `id_order_type`**

- UI: el selector "Tipo de pedido" llega **habilitado** con **1 sola opción** (PEDIDO ESTANDAR), resuelta sola desde `order_types.default_value` → `comp.tipoOrden = {idOrderType:1, coOrderType:"KIB-PE", naOrderType:"PEDIDO ESTANDAR"}`.
- Payload: viaja **`idOrderType: 1`**. **No existe la clave `coOrderType`** en el body.
- Nube: `id_order_type = 1` persistido en el pedido 5086.
- Round-trip: al reabrir, el selector vuelve a rotular PEDIDO ESTANDAR con `idOrderType=1`.

Sobre el `co_order_type` NULL — **confirmado NO defecto, con evidencia nueva y más fuerte que la de grupo_fiel**: además de que la app nunca envía la clave, la **tabla local `orders` no tiene siquiera la columna `co_order_type`** (`sqlite_master` no la declara; una consulta que la incluya aborta con `no such column`). Y en la nube el campo es NULL en **los 5054 pedidos del tenant** (`count(co_order_type)=0`). No se levanta como hallazgo.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **La tabla local `orders` NO declara la columna `co_order_type`** | universal (build v1.0/db19) | Cierra la discusión abierta en grupo_fiel: el modelo local **ni siquiera tiene** el campo, así que el NULL de la nube es estructural, no una pérdida de dato. ⚠ Incluirla en un `SELECT` aborta la transacción `sqlitePlugin` con `no such column: co_order_type` — se lee como "la BD local no responde". Cotejar el tipo de pedido **siempre por `id_order_type`** |
| 🔴 **`client_avg_product` vacía ⇒ el botón de Pedido Sugerido no se renderiza** | universal candidato | Primera corrida que mide **el insumo** en vez de solo constatar la ausencia del botón: 0 filas / 0 clientes con `suggestedOrder=true`. Antes de reportar la divergencia UI-vs-config, **consultar esa tabla** — distingue "VG que no rinde" de "sin datos". La maquinaria existe en `orderServ` (`sugerirPedido`, `datosPedidoSugerido`, `desdeSugerencia`) |
| **El Tab Total de kron NO anida por línea — 3 accordions PLANOS** | cliente (contrasta grupo_fiel) | Jerarquía: `ion-accordion[Total por unidad]` + **un accordion por producto al mismo nivel**, los 3 con rect >0 desde el arranque. ⇒ el "expandir DOS niveles" de `[grupo_fiel-20260817]` **no aplica acá**; el trash salió a `y≈606` con viewport 744 y acertó al 1.er click sin re-lectura de rect. **Medir la anidación antes de elegir estrategia** |
| **El selector de EMPRESA de PEDIDOS llega `disabled` pero YA RESUELTO** (≠ el de CLIENTES) | cliente | En el mismo tenant y la misma corrida, el form de **cliente potencial** trae el select `value=null` / shadowRoot "Seleccione…", mientras **`app-pedido`** lo trae `disabled=true` con el **objeto empresa completo** y el shadowRoot ya rotulado `CHOCOLATES KRON, C.A`. Confirma `[el_palmar-20260805]`: **la auto-asignación depende del FORMULARIO**, no del nº de empresas ni de `enterpriseEnabled` |
| **Ausencia de selects = mapa de VGs, en cabecera y en línea** | universal (confirma el_palmar) | Tab Total **sin ningún `ion-select`** ⇒ `userCanSelectGlobalDiscount=false`. Panel de línea con **solo 2** selects (Lista de Precio `disabled`, Unidad) ⇒ `userCanSelectProductDiscount=false` + `userCanChangeWarehouse=false`. Se leen las VGs **sin provocar el comportamiento** |
| **Buscador de productos: la vía más barata para llegar a un SKU** | universal | En la variante DRILL-DOWN, `ion-icon[name="search-circle-sharp"]` → `input.search-input.inputsSearch` + código + `Enter` deja **un único `ion-accordion`** con el producto, sin navegar categorías ni paginar. Resolvió las 3 altas de línea de la corrida al 1.er intento |
| **`app-pedidos-lista` repuebla al vaciar el buscador (2.ª confirmación)** | universal | 8→1 con `BIMBO`, y **8 al vaciar**. Reconfirma la acotación de `RUNTIME §3`: `PRD-BUSCADOR-NO-REPUEBLA` es exclusivo de PRODUCTOS |
| **Guardar NO deja el form pristine (2.ª confirmación, otro servidor)** | universal | Tras el alert "Pedido Guardado", el atrás siguiente **volvió a disparar** el dirty-guard de 3 opciones. Confirma `[grupo_fiel-20260817]` (El Yaque) ahora en **Isla Coche** ⇒ contradice definitivamente `[gmp-2611][ins-2622][jerez-2026-07-06]`. "Salir sin guardar" es seguro: el Guardado persiste |
| **Etiquetas de alert medidas (leer, nunca predecir)** | cliente | deuda vencida `[Cancelar, Aceptar]` · guardado `[OK]` · envío pasos 1-3 `[Cancelar, Aceptar]` → `[OK]` → `[OK]` · borrado en lista `[Cancelar, Aceptar]` · dirty-guard `[Guardar y salir, Salir sin guardar, Cancelar]`. **Secuencia de envío = 3 alerts** (como ferrenuestro; ≠ los 2 de globalmp/alipascua) |
| **Sellado del input de cantidad por descarte — 3/3 sin fallo** | universal | Los `ion-accordion` de producto **no traen `value`** ni el input trae `label` ⇒ valen ni `[latino_cosmetica-20260729]` ni `[difranca-20260807]`. El único `ion-input[type=number]` con `height>0` y **sin `id`** es el del producto recién expandido |
| **El ítem de producto NO muestra "Inventario:"** | cliente | Coherente con `stock0=true` / `validStock=false` / `validateWarehouses=false`: sin validación de inventario, la app **no rotula el stock** en el ítem. La reserva en vivo documentada en gmp/alipascua/grupo_fiel **no es observable acá** |

> ✅ consolidado 2026-08-17

## Hallazgos

**Ninguno.** 0 FAIL. No se levanta el `co_order_type` NULL (ver §2 de veredictos) ni la ausencia del botón de sugerido (N/A por datos).

## Notas de ejecución

- **Adjuntos:** 🚫 no se adjuntó nada, por instrucción expresa de la QA. Mock de cámara **no usado**. El pedido viajó con `nuAttachments:0` / `hasAttachments:"false"`.
- **Hook de payload:** llegó ya instalado (`window.__qaDataHook=true`, array `window.__qaPayloadsData` con 26 entradas previas). **No se reinstaló** — se consumió por offset, y el POST del pedido quedó capturado 1 sola vez con `data` completo.
- **Namespace propio `__qaPED`** (8 skills) registrado sin tocar `__qaH` (que traía solo 2 skills y **no** expone `getPayloadData`).
- **0 reintentos de alert · 0 BLOCKED · 0 cuelgues de CDP.** Ningún caso consumió más de 1 intento salvo el click del botón PEDIDO, que trae guarda de reintento preventiva (no llegó a usarla).
- **Tiempos:** Guardar ~6,2 s · Enviar ~14,8 s (3 alerts incluidos). Consistente con el hallazgo de difranca de que Guardar pesa por SQLite.

---

## Verificación BD (payload ↔ nube) — Agente BD, cotejo campo-a-campo automático

| co_x | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| `1786994993455.0` (Ref 5086) | **BD-FIELD-OK** | **38/38 OK** | `order_detail` 1/1 · `order_detail_unit` 1/1 | **0** | 2 (zona horaria) |

**Sin mismatches.** Los 38 campos de cabecera (`co_order`, `co_client`, `id_client`, `nu_amount_total`,
`nu_amount_final`, `co_currency`, `id_order_type`, `nu_details`, montos de conversión…) coinciden
payload↔nube. Las dos filas hijas — `order_detail` (`co_order_detail` 1786995347509.0) y `order_detail_unit`
(`co_order_detail_unit` 1786995347509.0U0) — coinciden en todos sus campos (`co_product` 51104106,
`qu_order` 2, `nu_base_total` 202,80…), **emparejadas por PK de negocio**.

### Notas de calibración (ninguna es mismatch)

1. `da_order` (2026-08-17 15:35:47 → `19:35:47Z`) y `da_dispatch` (2026-08-19 08:00 → `04:00Z`): 4 h de
   diferencia, **zona horaria** local UTC-4 vs nube UTC ⇒ nota esperada.
2. ✅ **`co_order_type` no apareció ni en mismatches ni en notas del motor** — coherente con lo medido por el
   agente UI: la tabla local **ni declara esa columna** y la app manda **solo** `idOrderType`, que **sí**
   coincidió (payload 1 == nube 1). Queda cerrado como diseño.
3. ✅ **`qu_suggested = 0`** en ambas hijas — coherente con `client_avg_product` **vacía** en kron
   (0 filas ⇒ sin insumo para el pedido sugerido). Marcado `ok`, **no es un campo mal guardado**.
4. **La corrección de hoy al emparejamiento no llegó a activarse**: este pedido tiene 1 sola línea, así que el
   caso de `co_product_unit` no-único no se dio. Sin anomalías de matching.
5. El pedido **Guardado y eliminado** de DM-PED-037 **no aparece** en `_payloads.jsonl` (solo 2 líneas:
   1 `potentialclient` + 1 `order`) ⇒ nunca se envió, no requiere cotejo ni genera `BD-SAVED`.

**Conteo por marca:** BD-FIELD-OK 1 · BD-FIELD-MISMATCH 0 · BD-SAVED 0 · BD-N/A 0.

> 🆕 **2.ª corrida del motor contra el esquema de `kron`** (la 1.ª fue clientes). El config `order` funcionó
> **sin necesitar ajustes**, igual que `potentialClient` ⇒ refuerza que el mapeo es del **modelo de datos del
> producto**, no del tenant.
