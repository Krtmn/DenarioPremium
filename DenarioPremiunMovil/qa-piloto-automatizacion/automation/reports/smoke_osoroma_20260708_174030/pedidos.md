# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260708_174030_smoke-completo` |
| Módulo | PEDIDOS |
| Cliente | osoroma (DISTRIBUIDORA OSOROMA C.A. — tenant multi-empresa CALZADOS) |
| Servidor | El Yaque (`denarioelyaque.ddns.net:8081`) |
| Dispositivo | `14678405BR003855` (Infinix X6728, Android 15) |
| App | `com.kiberno.denarioPremiumPro` — appVersion 1.0 / dbVersion 12 |
| Usuario | 001 (VENDEDOR, addressByUser=true) |
| Build | **window.ng=TRUE** (helpers CDP operativos — ver Patrones) |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Home Pedidos con botones PEDIDO / BUSCAR / COPIAR |
| DM-PED-002 | ✅ PASS | Form `app-pedido`: tab General habilitado; Pedido/Total/Adjunto `segment-button-disabled` sin cliente |
| DM-PED-006 | ✅ PASS | Cliente "ACUMULADORES DUNCAN, C.A. (20105)" seleccionado → tabs habilitan (~2s async); sucursal auto-seleccionada; **sin alerta de deuda vencida** (alerta_deuda_vencida=false confirmado) |
| DM-PED-015 | ✅ PASS | Tab Pedido: 9 categorías Línea (CalzDieléctrico/Fortis/Frio/Industrial/Profesional/Táctica/UsoGeneral/CalzadoCasual...); CalzFrio expandió 16 productos (Bota Cavero, tallas 35-50, cód 6650-NN) |
| DM-PED-017 | ✅ PASS | cantidad=2 en 6650-38 → contadorProductos=2, badge verde, **sin alerta de stock** (validStock=false confirmado) |
| DM-PED-024 | ✅ PASS | Tab Total: Base USD 152,6000 · IVA USD 24,4160 · **Total Pedido USD 177,0160**. Solo USD (multiCurrencyOrder=false), sin Límite de Crédito (showCreditLimit=false), IVA visible (userCanSelectIVA=true) |
| DM-PED-026 | ✅ PASS | 2º ítem 6650-40 agregado (Total 265,5240) → borrado desde acordeón en Tab Total (directo, sin confirmación) → recalculó a 177,0160 (Total Items 2→1) |
| DM-PED-029 | ✅ PASS | Sin cliente → Guardar/Enviar disabled; con cliente pero sin ítems → siguen disabled; habilitan solo al agregar ítem |
| DM-PED-030 | ✅ PASS | Guardar → alert "Denario / Pedido Guardado" → pedido Ref 0 Guardado en lista |
| DM-PED-031 | ✅ PASS | Enviar → "¿Desea Enviar el pedido?" (Aceptar) → "Su Pedido será enviado" (OK) → **"Pedido nro. 81 enviado exitosamente"**; navega a home Pedidos |
| DM-PED-032 | ✅ PASS | Guardar deja form pristine → atrás sale directo SIN modal. Reabrir Guardado (rehidratación ensucia) → atrás con `img.fechaAtras`+`mouse.click` real → modal "¡Alerta!" con 3 opciones (Guardar y salir / Salir sin guardar / Cancelar) |
| DM-PED-034 | ✅ PASS | BUSCAR → `ion-searchbar` "ACUMULADORES" filtra en tiempo real 5→1 |
| DM-PED-035 | ✅ PASS | Click pedido Guardado → form editable con 4 tabs habilitadas. **Round-trip §9 OK**: comentario `Test-PED-SMOKE-180449` y total 177,0160 persisten al reabrir |
| DM-PED-037 | ✅ PASS | 2º pedido Guardado → trash en lista (`ion-button[color="danger"]` w≈29) → alert "¿Seguro que quieres eliminar este pedido?" (Aceptar) → desaparece de la lista |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **Pedido Nro. 81** | ACUMULADORES DUNCAN, C.A. (20105) · 1 ítem 6650-38 (Bota Cavero talla 38) × 2 par · Total USD 177,0160 · empresa 00001 SICURA · comentario `Test-PED-SMOKE-180449` | **Enviado** (id_order=81, st_order=1) |
| Pedido temporal (Ref 0) | ACUMULADORES DUNCAN · 1 ítem 6650-42 × 1 · creado para DM-PED-037 | Guardado y luego **ELIMINADO** (no persiste) |

## Verificación BD

**Nube (query.js osoroma) — BD-OK:**
```
id_order=81 · co_order=1783548215611.0 · st_order=1 (Enviado) · nu_amount_total=177.0160 ·
nu_amount_final=152.6000 · nu_details=1 · det=1 · units=1 · tx_comment=Test-PED-SMOKE-180449 · co_enterprise=00001
```
- Cabecera existe; `nu_details=det=1` = 1 línea agregada por UI; `units=1` ≥ det. ✓
- Totales cuadran 1:1 con Tab Total (177,0160 / 152,6000). ✓
- **`st_order=1` = Enviado** (osoroma/Isla Coche usa 1, NO 4 como dice el smoke genérico). ✓
- **Correlación Nro.Ref UI 81 = `id_order` 81** confirmada (BD-INFO).
- Captura de payload (`orderservice/order`) coincide con la fila nube (cabecera + orderDetails + orderDetailUnit quOrder=2 coUnit=27). Guardado→enviado **confirmado**.

**Local (local-query.js) — BD-N/A:** `sqlite3` no disponible en el device (`run-as: exec failed for sqlite3`), esperado en builds El Yaque. No bloqueante; la nube ya confirma persistencia.

**Marca final: BD-OK** (nube) · local BD-N/A (confirmatorio).

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **osoroma build El Yaque tiene `window.ng=TRUE`** | cliente osoroma | ⚠ CONTRADICE la nota del YAML osoroma ("build El Yaque → window.ng=false"). Los helpers CDP funcionan normalmente; NO se necesitó click real MCP como fallback. Actualizar `osoroma.yaml` línea 20. |
| **st_order=1 = Enviado en osoroma** | cliente osoroma (patrón Isla Coche) | El smoke-pedidos.md §Verificación BD dice "st_order=4 Enviado". osoroma/El Yaque usa **1** (igual que ferrenuestro Isla Coche `id_order=28458 st_order=1` y piercar). |
| **Payload capture SÍ captura `orderservice/order`** | universal (build El Yaque/refactorizado) | Cabecera + orderDetails + orderDetailUnit capturados vía `nativePromise`. Consistente con `[ferrenuestro-2026-07-07]`, contradice `reference_qa_payload_capture_gap` (order no capturable). |
| Producto = `div.listaProductos` / `ion-item.listaItems` (2 niveles: Línea → producto sub-acordeón) | cliente osoroma | ⚠ osoroma NO usa `ion-accordion` (a diferencia de ferrenuestro, también El Yaque). Confirma que la estructura del Tab Pedido varía por catálogo/build, no solo por servidor. Categoría "Línea", input cantidad height=0 colapsado. |
| Trash Tab Total dentro de `ion-accordion` del ítem recalcula con `mouse.click` | cliente osoroma | ✓ Funciona (a diferencia de ferrenuestro `[ferrenuestro-2026-07-07]` donde el trash NO recalculaba). Expandir acordeón del ítem primero; borrado directo sin confirmación. |
| Sin botón "Pedido Sugerido" pese a `suggestedOrder=true` | cliente osoroma | Misma divergencia UI-vs-config que jerez/ferrenuestro. `suggestedOrderByDispatchAndReturn=false`. |
| Dato de prueba: cliente **ACUMULADORES DUNCAN, C.A. (20105)** | cliente osoroma | Visible para usuario 001, sucursal auto-seleccionada ("Avenida Milan, Edif. Nageben..."), sin deuda. `estructura_producto`: Línea CalzFrio → 6650-38. |
| Empresa por defecto Pedidos = **00001 CALZADOS SICURA C.A.** | cliente osoroma | `ion-select` preseleccionado (enterpriseDefault=true). El pedido 81 se registró en empresa 00001, no OSOROMA (00003, que el YAML reserva para cobros). |
| Reabrir Guardado con `mouse.click` en zona izq (x≈35% ancho, y≈40% alto) | universal pedidos | Evita el botón danger estrecho de la derecha; navega al form. Confirma `[ins-2622]`. |
| Local sqlite3 no accesible en device osoroma | cliente osoroma | `run-as: exec failed for sqlite3` → cotejo local BD-N/A; usar payload capture + nube. |

## Hallazgos (FAIL)

Ninguno. 14/14 PASS.
