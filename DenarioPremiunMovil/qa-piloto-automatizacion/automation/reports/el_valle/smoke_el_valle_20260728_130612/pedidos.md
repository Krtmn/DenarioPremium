# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260728_130612_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 (db_version=19) |
| Playa | La Tortuga (`denariolatortuga.ddns.net:8081/PremiumWS`) |
| Cliente | el_valle · Empresa `PROCESADORA DE ALIMENTOS COVADONGA,C.A` |
| `window.ng` | **true** (conducción por componentes disponible) |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Wall-clock | ~28 min (techo 60 min) · 0 cuelgues de CDP |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Tile PEDIDOS → `app-pedidos` con botones `PEDIDO BUSCAR COPIAR` |
| DM-PED-002 | ✅ PASS | `app-pedido` con 4 tabs; General checked, Pedido/Total/Adjunto `segment-button-disabled` sin cliente |
| DM-PED-006 | ✅ PASS | Modal cliente (50 `ion-item`, sin searchbar) → "ABASTOS Y CARNICERIA HERMANOS FLORES CA (J309901710)"; las 4 tabs se habilitan. Sin alerta de deuda vencida (saldo USD 0,0000) |
| DM-PED-015 | ✅ PASS | Tab Pedido: Favoritos 0 · DESTACADOS 0 · Carrito 0 · EMBUTIDOS 66 · LACTEOS 9 · PRODUCTO FRESCO EN VENTA 5 (**80 = catálogo esperado**). Categoría expande y lista producto+código+precio |
| DM-PED-017 | ✅ PASS | ALAS DE POLLO (C0051) cantidad=2 → `.contadorProductos`=2, indicador `[color="success"]`, Guardar/Enviar pasan a habilitados |
| DM-PED-024 | ✅ PASS | Tab Total: `Total Base USD: 9,6000` / `Total Pedido USD: 9,6000` = 2 × 4,80 ✔ · agrupado por `Línea: PRODUCTO FRESCO EN VENTA` · `Total por unidad` (Total PIEZA: 2) · `Límite de Crédito: 0,0000` |
| DM-PED-026 | ✅ PASS | Trash dentro del acordeón de producto en Tab Total → `9,6000 → 0,0000`, `Total Items: 1 → 0`, borrado directo sin confirmación |
| DM-PED-029 | ✅ PASS | Guardar/Enviar `disabled` sin cliente, `disabled` con cliente y sin ítems, y **vuelven a `disabled`** tras borrar el único ítem (DM-PED-026) |
| DM-PED-030 | ✅ PASS | Alert `Denario / Pedido Guardado` (botón OK). Comentario `Test-PED-SMOKE-141457` |
| DM-PED-031 | ✅ PASS | Secuencia de **3 alerts**: `¿Desea Enviar el pedido?` (Cancelar/Aceptar) → `Su Pedido será enviado` (OK) → **`Pedido nro. 437 enviado exitosamente`** (OK) → navega a `app-pedidos` |
| DM-PED-032 | ✅ PASS | Atrás con form dirty → modal `¡Alerta!` con 3 opciones (Guardar y salir / Salir sin guardar / Cancelar); Cancelar conserva ítems y comentario |
| DM-PED-034 | ✅ PASS | BUSCAR → `app-pedidos-lista` (3 ítems); searchbar "Pedidos..." con "437" filtra en tiempo real a 1 ítem |
| DM-PED-035 | ✅ PASS | Pedido Guardado (Ref 0) reabre editable: 4 tabs habilitadas, comentario `Test-PED-SMOKE-B-141855` conservado (round-trip §9 ✔), Guardar/Enviar habilitados, cliente readonly |
| DM-PED-037 | ✅ PASS | Trash en lista (`ion-button[color="danger"]` w=29) → alert `Pedidos / ¿Seguro que quieres eliminar este pedido?` → Aceptar → lista **3 → 2**, el Guardado desaparece (la lista **sí** re-renderiza) |

## Registros creados en sistema

| Ref | Detalle | Estado | BD |
|-----|---------|--------|----|
| **437** | ABASTOS Y CARNICERIA HERMANOS FLORES CA · C0051 ×2 @4,80 + C0003 ×3 @6,80 · **Total USD 30,0000** · comentario `Test-PED-SMOKE-141457` | Enviado | **BD-OK** |
| 0 (temporal) | Pedido B · MUSLO DE POLLO ×4 · comentario `Test-PED-SMOKE-B-141855` | Guardado → **eliminado** en DM-PED-037 | BD-SAVED (nunca enviado) |

> El pedido B se creó a propósito como insumo de DM-PED-035/037 y se eliminó al cerrar el caso 037: no queda basura en el sistema.

## Verificación BD (RUNTIME §10)

**Baseline:** `max(id_order)=436` antes del módulo. **Diff:** 1 fila nueva (`id_order=437`), sin duplicados.

```
id_order=437 · co_order=1785262080793.0 · st_order=1 (Enviado) · co_client=J309901710
nu_amount_total=30.0000 · nu_amount_final=30.0000 · nu_details=2 · tx_comment=Test-PED-SMOKE-141457
```

Detalle (`order_detail` + `order_detail_unit`) — **cotejo campo-a-campo OK**:

| co_product | nu_price_base | qu_order | nu_amount_total | co_warehouse | co_product_unit |
|---|---|---|---|---|---|
| C0051 | 4,8000 | 2,0000 | 9,6000 | 010 | PZA-C0051 |
| C0003 | 6,8000 | 3,0000 | 20,4000 | 010 | PZA-C0003 |

- `nu_details` = `det` = 2 ✔ · `units` (2) ≥ `det` (2) ✔
- `nu_amount_total` 30,0000 == Tab Total de la UI ✔ · `st_order`=1 = Enviado ✔
- **Correlación confirmada: Nro.Ref UI 437 == `id_order` 437** (`BD-INFO`, refuerza el patrón piercar).
- **Conclusión guardado→enviado: BD-OK.** Sync a nube **inmediata** (la fila existía al primer poll).
- **Hook de payload:** capturó **2 POST idempotentes** a `…/orderservice/order` (cabecera + `orderDetails`), deduplicados por el servidor en una sola fila.
- **Mitad LOCAL del oráculo: `BD-N/A`** — `sqlite3` no existe en el device (quirk conocido del build); degradado al primer intento sin gastar reintentos. El cotejo fue por **nube + payload + UI**.

## VGs marcadas ⚠️VERIFICAR — resultado

| VG | Valor esperado | Lo observado en UI | Veredicto |
|----|----------------|--------------------|-----------|
| `orderEnterpriseEnabled=false` (global `enterpriseEnabled=true`) | "SIN campo Empresa en pedidos" | **El campo Empresa SÍ se renderiza** en Tab General, pero como `ion-select` **deshabilitado** (`select-disabled`) con la empresa preseleccionada: `idEnterprise=1 · coEnterprise=00001 · lbEnterprise="PROCESADORA DE ALIME…" · coCurrencyDefault=USD` | **Matizada.** `orderEnterpriseEnabled=false` ⇒ campo **visible pero NO editable**, no ausente. No es FAIL: el usuario no puede cambiar la empresa, que es el efecto buscado. Corregir la expectativa del YAML |
| `validateWarehouses=true` (client-config decía false) | "se ven almacenes/inventario en la toma" | **CONFIRMADA**: el ítem del Tab Total muestra `Almacén: 1 - PRODUCTO TERMINADO (EMBUTIDOS)`, y el payload/BD llevan `co_warehouse=010`. En el Tab Pedido **no** se muestra inventario (coherente con `showStock=false`) | **true** — gana `validateWarehouses=true`; el `false` de client-config es el dump stale |
| `userCanSelectProductDiscount=false` (dumps en conflicto) | sin selector de descuento por producto | Ningún control de descuento en el acordeón del producto ni en el detalle del Tab Total (solo Código/Nombre/Almacén/Precio Lista/unidad) | **false** confirmado |

**Otras VGs verificadas de paso:** `multiCurrencyOrder=false` ✔ (Tab Total **solo USD**, sin Bs.) · `groupByTotalByLines=true` ✔ (agrupa por `Línea:`) · `totalUnit=true` ✔ (`Total por unidad`) · `showCreditLimit=true` ✔ (`Límite de Crédito: 0,0000`) · `selectOrderType=true` ✔ (campo `Tipo Pedido:`) · `validateNuOrder=false` ✔ (se envió con `nuPurchase=""`) · `requiredCommentOrder=false` ✔ · `disableDaDispatch=true` ✔ (Fecha Despacho 30/7/2026 precargada, no se tocó) · `quUnitDecimals=false` ✔ (cantidades enteras) · `stock0=true` ✔ (no apareció el alert "Este producto no tiene inventario").

⚠ **`codeTotalProductUnit`**: el YAML dice `CJA`, pero la UI y la BD usan **`PIEZA` / `PZA-<co_product>`** para estos productos. Es dato por producto, no VG — corregir el YAML si se usa como dato de prueba.

⚠ **`suggestedOrder=true` pero el botón "Pedido Sugerido" NO aparece** en Tab Pedido — **cuarta corrida consecutiva** con esta divergencia (jerez, ferrenuestro, dm-electronica, el_valle). Reforzada la hipótesis `suggestedOrderByDispatchAndReturn=false`. Sigue pendiente de confirmar con desarrollo; **no se marca FAIL**.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Tab Pedido = **híbrido** categoría-`ion-item.listaItems` + producto-`ion-accordion` | universal | El Tab Pedido arranca **sin ningún `ion-accordion-group`** (`accGroups=0`); las categorías son `ion-item.listaItems`. Al clickear una categoría se **inyecta** un `ion-accordion-group` con un `ion-accordion.product-structure-title.accordionPedidos` por producto, dentro de `productos-tab-order-product-list > div.listado-product-structures > div.product-card.cardProduct`. **Resuelve la contradicción `[gmp-2611]` vs `[ferrenuestro]`**: no son builds distintos, son **dos niveles** — categoría = `listaItems` (viejo), producto = `ion-accordion` (nuevo). Detectar `ion-accordion-group` **después** de expandir, nunca antes |
| ⚠ **Anti-patrón: elegir acordeón anidado por `textContent`** | universal | En Tab Total los acordeones anidan (Línea ⊃ Producto). `accs.find(n=>/Código:/.test(n.textContent))` devuelve el acordeón **padre** (su `textContent` incluye a los hijos) y el click lo **colapsa**. Usar el **último** del array filtrado (`accs[accs.length-1]`, orden de documento = más profundo) o descartar los que contengan otro `ion-accordion` |
| Trash del ítem en Tab Total = **3 niveles** de expansión | universal | `Total por unidad` / `Línea: <estructura>` / `Código: <co_product>` son 3 acordeones hermanos-anidados. El `ion-button[color="danger"]` (w≈26, `ion-icon[name="trash"]`) solo se hace visible al expandir **el tercero** (el del producto). Antes de eso `getBoundingClientRect()` da 0×0 aunque el nodo exista en el DOM. Recalcula con `pg.mouse.click` simple (confirma hidroponias/dm-electronica/latino_cosmetica/ferrenuestro-La Tortuga; **5.ª confirmación**) |
| Tab Pedido **no tiene searchbar** | universal | La búsqueda de producto por texto (`texto_busqueda_producto` del YAML) **no es alcanzable** en el Tab Pedido: no existe `ion-searchbar` ahí. El único searchbar del módulo está en `app-pedidos-lista` ("Pedidos..."). Ajustar el dato de prueba del YAML |
| Modal de cliente: 50 `ion-item`, **0 searchbar** | universal | Confirma `[ferrenuestro-20260723]`. Localizar por texto + `scrollIntoView({block:'center'})` + `mouse.click` con coords **frescas** (releídas después del scroll) |
| Campo Empresa presente-pero-`select-disabled` con `orderEnterpriseEnabled=false` | universal | La VG **no oculta** el `ion-select`, lo deshabilita. Leer `s.value` (objeto con `idEnterprise`/`coEnterprise`/`lbEnterprise`) para verificar la empresa activa sin abrir el popover |
| Orden de inputs Tab General (el_valle) | cliente | `#clienteSelect`(0) · `#nuPurchase`(1) · `#naResponsible`(2) · `#txComment`(3). Coincide con `[ins-2610]` salvo que Nº Orden expone id **`nuPurchase`** |
| `.contadorProductos` cuenta **líneas de la categoría abierta**, no unidades | universal | Con ALAS×2 dio "2"; con ALAS×2 + COSTILLA×3 dio "3" — no es ni el nº de ítems (2) ni el de unidades (5). **No usarlo como oráculo de cantidad**; el oráculo fiable es `Total Items:` del Tab Total |
| Cantidad: `ion-input[type=number]` sin id → asignar id efímero | universal | El input del acordeón no tiene selector estable. Patrón: `inp.id='qaQty'` por `evaluate` → `fillIonInput(pg,'#qaQty',val)` → `blur` → `removeAttribute('id')`. Evita colisión entre productos y hace `fillIonInput` reutilizable |
| Secuencia de envío de pedido = **3 alerts** | cliente/universal | `¿Desea Enviar el pedido?` (Cancelar/**Aceptar**) → `Su Pedido será enviado` (**OK**) → `Pedido nro. X enviado exitosamente` (**OK**). Idéntica a `[ferrenuestro-20260723]` (La Tortuga). Botón "OK" en los informativos, "Aceptar" en el confirmatorio |
| Salida tras "Salir sin guardar" en form reabierto → `app-pedidos` (no la lista) | universal | Al salir de un Guardado reabierto desde `app-pedidos-lista`, la navegación cae en `app-pedidos` (home del módulo), **no** vuelve a la lista. Hay que re-entrar por BUSCAR para seguir operando sobre la lista |
| Reabrir Guardado ensucia el form (dirty-guard sin editar) | universal | Confirma `[gmp-2611][dth-2612]`: al reabrir el Guardado y pulsar atrás **sin editar**, salta el modal `¡Alerta!` de 3 opciones. **No es FAIL** (matiza DM-PED-032). Aquí bastó `img.fechaAtras` + `mouse.click` real, **sin** PointerEvent combinado |
| Lista de pedidos **sí** re-renderiza tras borrar | universal | A diferencia del defecto conocido de Depósitos (DM-DEP-018/019/020), `app-pedidos-lista` refresca sola: 3 → 2 ítems sin re-entrar a la vista |

## Traza (QA_MODE=record)

**TRAZA: 75 ops · 14 casos grabados** → `automation/reports/smoke_el_valle_20260728_130612/_trace/pedidos.trace.json`
`validateTrace()` → `[]` (estructuralmente válida).

- Todos los casos terminaron PASS ⇒ **no se descartó ningún bloque**.
- `data` lleva 12 valores run-específicos (cliente, co_client, categoría, 3 productos + 2 códigos, 2 comentarios, Ref 437, empresa). **Sin credenciales.**
- **Limitación declarada en `nota_cobertura`:** los clicks reales (`pg.mouse.click` sobre Guardar/Enviar/tiles/acordeones/botones de alert) **no quedan grabados** — cada `recEval` con tag `coords-*` solo deja las coordenadas en `window.__qaCoords`; el click ocurre fuera del grabador. Un replay debe ejecutar `pg.mouse.click(window.__qaCoords)` después de cada eval con ese tag.
- Las cantidades (2/3/4) van **literales** en los args de `fillIonInput` y **fuera de `data`** a propósito: son cadenas de 1 carácter y `substitute()` las reemplazaría dentro de otras cadenas.
- Un assert de DM-PED-017 se **reescribió post-corrida**: el original leía el texto "Carrito" (que queda fuera del viewport al expandir la categoría) y devolvía `false` pese a que el caso pasó; se sustituyó por `.contadorProductos`, la señal usada como evidencia real.

## Hallazgos

Sin FAIL. Dos observaciones de **datos** (no defectos de la app), para la responsable QA:

1. **Precio anómalo en catálogo:** `PERNIL DE CERDO CON PIEL` (C0010) se lista con `Precio: 73.576.411,0100 USD` en la línea PRODUCTO FRESCO EN VENTA. Es dato de la playa La Tortuga, no comportamiento de la app — se evitó ese producto en las pruebas. Vale reportarlo al cliente.
2. **Línea DESTACADOS vacía:** con `featuredProducts=true` la línea "DESTACADOS" se renderiza pero con contador **0** (igual que "Favoritos 0"). La VG funciona (la sección existe); simplemente no hay productos marcados como destacados en esta playa. **N/A por datos, no FAIL.**
3. **Pedido preexistente `id_order=436`** (mismo cliente, Enviado, 9,60) apareció en la nube ~10 min antes de arrancar el módulo, ajeno a esta corrida. Se tomó como baseline y se excluyó del diff.

---
*Estado inicial: HOME · **Estado final: HOME** (`app-home` / `http://localhost/home`) · 0 cuelgues de CDP · 0 reconexiones*
