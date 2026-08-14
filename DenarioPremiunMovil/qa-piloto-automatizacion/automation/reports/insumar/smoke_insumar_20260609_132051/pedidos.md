# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260609_132051_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Playa | insumar |
| Cliente prueba | ADRIAN ARLET BASTARDO ALONZO (Cód 2738, Saldo US$ 104,50) |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Click módulo Pedidos → `/pedidos`, home con botones PEDIDO, BUSCAR, COPIAR |
| DM-PED-002 | ✅ PASS | Click PEDIDO → form `app-pedido`; tabs Pedido/Total/Adjunto con `segment-button-disabled`, solo General activo |
| DM-PED-006 | ✅ PASS | Modal `#clienteSelectModal.present()` → click `<p>` nombre → alerta deuda vencida (Cancelar/Aceptar) → Aceptar → 4 tabs habilitadas |
| DM-PED-015 | ✅ PASS | Tab Pedido muestra familias ALIMENTOS (158)/BEBIDAS (113); click expande acordeón con productos (Código, Precio UND/BTO, Inventario) |
| DM-PED-017 | ✅ PASS | Click producto MAIZ → fillIonInput cantidad=2 → badge "2", contador "Items 0/6"→"1/6" |
| DM-PED-024 | ✅ PASS | Tab Total: Base US$ 1,84 / IVA US$ 0,29 / Pedido US$ 2,13 (≠ 0). Ver nota multiCurrency |
| DM-PED-026 | ✅ PASS | Acordeón item Tab Total → botón danger (basura) → Items 1→0, Total 2,13→0,00 (sin confirmación, borrado directo) |
| DM-PED-029 | ✅ PASS | Pedido vacío: `.imagenGuardar` y `.imagenEnviar` con pointer-events:none (deshabilitados) |
| DM-PED-030 | ✅ PASS | Ítem + comentario `Test-PED-SMOKE-132051` → Guardar → alert "Denario / Pedido Guardado" |
| DM-PED-031 | ✅ PASS | Enviar → "¿Desea Enviar el pedido?" → Aceptar → "Su Pedido será enviado" → **"Pedido nro. 20 enviado exitosamente"** → navega a `/pedidos` |
| DM-PED-032 | ✅ PASS | Form dirty (ítem agregado) + atrás (`mouse.click` en `img.fechaAtras`) → modal 3 opciones: Guardar y salir / Salir sin guardar / Cancelar |
| DM-PED-034 | ✅ PASS | BUSCAR → searchbar "AGROPECUARIA" filtra realtime: 20→2 filas |
| DM-PED-035 | ✅ PASS | Click pedido Guardado (Ref 0) → form `/pedido` editable, 4 tabs habilitadas, cliente cargado, Guardar/Enviar activos (no solo lectura) |
| DM-PED-037 | ✅ PASS | Botón danger en fila Guardado → alert "¿Seguro que quieres eliminar este pedido?" → Aceptar → pedido desaparece (lista 21→20, sin Guardado) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. 20 | Pedido ADRIAN ARLET BASTARDO ALONZO, 1 ítem (MAIZ PARA COTUFAS x2), comentario `Test-PED-SMOKE-132051` | **Enviado** (queda en sistema) |
| Ref 0 | Pedido ADRIAN ARLET BASTARDO ALONZO, 1 ítem (MAIZ x3), creado para DM-035/037 | **Eliminado** (DM-PED-037) — no persiste |

## Notas / patrones de selector confirmados y nuevos

- **Componente formulario = `app-pedido` (singular)**, no `app-pedidos`. `app-pedidos` es el home (botones PEDIDO/BUSCAR/COPIAR); la lista BUSCAR es ruta interna `/pedidosLista`. El formulario edita en ruta `/pedido`.
- **Visibilidad por `getBoundingClientRect()`** (width/height > 0): dentro de `app-pedido` el `offsetParent` da null aunque el elemento sea visible. NO usar offsetParent en este módulo.
- **Input de cantidad oculto hasta 2 clicks**: click familia (ALIMENTOS) expande acordeón de productos; un **segundo click separado** en el producto abre su panel con el ion-input de cantidad (rect pasa de 0x0 a visible). Hacer ambos clicks en el mismo bloque colapsa el panel — separarlos.
- **Borrado item Tab Total**: requiere expandir el acordeón del item (2 toggles); botón `ion-button.ion-color-danger`; borrado directo sin confirmación.
- **Comentario en Tab General**: ion-input asociado al label "Comentario:" (proximidad vertical). fillIonInput estándar funciona.
- **Modal cliente**: `#clienteSelectModal.present()` + click `<p>` del nombre a `y = rect.top + 6` (evita activar "Más detalles"). Igual que cobros.
- **Eliminar desde lista**: botón `ion-color-danger` dentro de la fila + alert "¿Seguro que quieres eliminar este pedido?" (Cancelar/Aceptar). Difiere del Tab Total (directo).
- **multiCurrency**: aunque `vgs.multiCurrency=true`, el Tab Total de Pedidos en insumar muestra **solo US$** (no líneas Bs.). La conversión a Bs. vive en Cobros. Comportamiento del módulo, no FAIL — totales USD correctos y ≠ 0.
- **Dirty-guard back (DM-PED-032)**: en insumar el modal de 3 opciones SÍ se dispara con `pg.mouse.click()` en `img.fechaAtras` (no requiere hardware back). Confirma divergencia por build vs globalmp (que requiere hardware back en cobros). Consistente con romher/insumar en cobros.
- **Texto envío insumar**: secuencia 2 alertas "Su Pedido será enviado" → "Pedido nro. X enviado exitosamente". Confirmado.
