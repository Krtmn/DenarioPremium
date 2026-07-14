# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260624_125056_smoke-completo` |
| Módulo | PEDIDOS |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | jerez (multi-empresa, empresa 1 "INVERSIONES JEREZ MO…") |
| Cliente test | JL Motors SE,C.A (J-506554950, saldo 0,00) |
| Producto test | PLAN-001 "Agro silotubo flex-silon extra PB 8P*50C" — familia Plasticos — 234,00 USD, PIEZA, inv 450 |
| Estado inicial / final | HOME / HOME |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Click módulo Pedidos → `app-pedidos` (`/pedidos`) con botones PEDIDO/BUSCAR/COPIAR |
| DM-PED-002 | ✅ PASS | PEDIDO → `app-pedido` (`/pedido`); tab General habilitado, Pedido/Total/Adjunto `disabled` sin cliente |
| DM-PED-006 | ✅ PASS | `#clienteSelectModal.present()` → buscar "JL Motors" → click `<p>` nombre; cliente fijado "JL Motors SE,C.A (J-506554950)", 4 tabs habilitan. Sin alerta deuda (saldo 0,00, `alerta_deuda_vencida=false`) |
| DM-PED-015 | ✅ PASS | Tab Pedido → click categoría "Plasticos" expande producto PLAN-001 (234,00 USD, inv 450) |
| DM-PED-017 | ✅ PASS | Click producto expande detalle; `fillIonInput` cantidad=2 → badge contador "2"; Guardar/Enviar habilitan |
| DM-PED-024 | ✅ PASS | Tab Total: Total Base USD 468,00 (2×234), IVA 16% 74,88, Total Pedido USD 542,88. Solo USD (`multiCurrencyOrder=false`, no FAIL) |
| DM-PED-026 | ✅ PASS | Expandir acordeón ítem en Tab Total → trash (`ion-button[color=danger]`, borrado directo sin confirmación) → Total Items 0, totales recalculan a 0,00; badge desaparece |
| DM-PED-029 | ✅ PASS | Sin ítems en el pedido, `.imagenGuardar` y `.imagenEnviar` quedan `disabled` |
| DM-PED-030 | ✅ PASS | Re-agregar ítem + comentario `Test-PED-SMOKE-131122` en `#txComment` → Guardar → alert "Denario / Pedido Guardado"; aparece en lista Estatus Guardado (Ref:0) |
| DM-PED-031 | ✅ PASS | Reabrir Guardado → Enviar → 2 alertas ("¿Desea Enviar el pedido?" → "Su Pedido será enviado") → `/pedidos`; pedido pasa a **Enviado Nro. Ref.: 11** |
| DM-PED-032 | ✅ PASS | Form dirty (ítem agregado sin guardar) + botón atrás → modal "¡Alerta!" 3 opciones (Guardar y salir / Salir sin guardar / Cancelar). "Guardar y salir" guarda y vuelve a `/pedidos` |
| DM-PED-034 | ✅ PASS | Searchbar lista: escribir "DANIELA" filtra realtime 8→4 ítems (todos DANIELA HERNANDEZ) |
| DM-PED-035 | ✅ PASS | Click pedido Guardado → `app-pedido` editable; 4 tabs habilitan tras ~2s render async. **Oráculo persistencia:** comentario "Test-PED-SMOKE-131122" persiste idéntico |
| DM-PED-037 | ✅ PASS | Trash en pedido Guardado (lista) → alert "Pedidos / ¿Seguro que quieres eliminar este pedido?" Cancelar/Aceptar → Aceptar → desaparece (9→8 ítems), sin alert de éxito posterior |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. 11 | Pedido JL Motors SE,C.A — PLAN-001 ×2, comentario `Test-PED-SMOKE-131122` | **Enviado** (DM-PED-030 Guardar → DM-PED-031 Enviar; correlativo 11 al sincronizar) |
| Nro. 0 (local) | Pedido JL Motors SE,C.A — PLAN-001 ×1 (creado por "Guardar y salir" DM-PED-032) | **Eliminado** en DM-PED-037 (no persiste) |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| jerez usa componente `productos-tab` en Tab Pedido (NO `ion-accordion`) | cliente jerez (build) | Igual que central_foods `[cf-2612]`: categorías y producto son `productos-tab ion-label`; sub-tabs Favoritos/Destacados/Carrito; buscador `productos-tab-search input` "Búsqueda de productos"; cantidad por `input[placeholder="Ingrese Cantidad:"]` filtrando `top>0 && top<750`. Reconfirma el patrón `productos-tab` en 2º cliente |
| Botón atrás en `app-pedidos-lista` requiere `pg.mouse.click` con coords reales | universal (candidato) | El `dispatchEvent(MouseEvent)` del helper `h.clickBack` NO navega desde la lista (`/pedidosLista`); sí navega con `getBoundingClientRect()` + `pg.mouse.move` + `pg.mouse.click` sobre el `<a>` padre del `img.fechaAtras`. En el formulario `app-pedido` el dispatchEvent sí funciona |
| Dirty-guard atrás en `app-pedido` (jerez) SÍ funciona vía CDP | cliente jerez | Form sucio + secuencia `pointerdown/mousedown/pointerup/mouseup/click` sobre el `<a>` padre + `pg.mouse.click` → modal "¡Alerta!" (Guardar y salir / Salir sin guardar / Cancelar). Reconfirma insumar/central_foods, contrasta con globalmp |
| Envío pedido jerez = 2 alertas | cliente jerez | "¿Desea Enviar el pedido?" (Pedidos, Cancelar/Aceptar) → "Su Pedido será enviado" (Denario Pedidos) → `/pedidos`. SIN 3ª alerta "Pedido nro. X enviado exitosamente"; correlativo se asigna al sincronizar (Ref 0 → 11). Igual divergencia de build que central_foods en otros módulos |
| Borrado desde lista = con confirmación, sin alert de éxito | cliente jerez | "Pedidos / ¿Seguro que quieres eliminar este pedido?" Cancelar/Aceptar → ítem desaparece sin alert posterior. Trash solo en filas Guardado |
| Empresa preseleccionada (multi-empresa) | cliente jerez | `app-pedido` tiene `ion-select` Empresa preseleccionado "INVERSIONES JEREZ MO…" (empresa 1, donde reside JL Motors); no requiere acción |

## Hallazgos (solo si hay FAIL)

Ninguno. 14/14 PASS.
