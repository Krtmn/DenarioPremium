# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260619_173652_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa | insumar (INSUMAR DISTRIBUIDOR) |
| Cliente prueba | ADRIAN ARLET BASTARDO ALONZO (Cód 2738, Saldo US$ 100,88) |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Click Pedidos → `/pedidos`, `app-pedidos` con botones PEDIDO/BUSCAR/COPIAR |
| DM-PED-002 | ✅ PASS | Click PEDIDO → `/pedido`, 4 tabs; solo General habilitada, Pedido/Total/Adjunto disabled sin cliente |
| DM-PED-006 | ✅ PASS | Modal cliente (`#clienteSelectModal.present()`) → seleccionado 2738 → alerta "Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" Aceptar → 4 tabs habilitan; cliente "ADRIAN ARLET BASTARDO ALONZO (2738)" |
| DM-PED-015 | ✅ PASS | Tab Pedido muestra familias (ALIMENTOS/BEBIDAS/CARAMELOS/CEREALES…); click familia expande productos |
| DM-PED-017 | ✅ PASS | Cantidad=2 en MAIZ PARA COTUFAS (Cód 120202) → badge "2"; Guardar/Enviar habilitan |
| DM-PED-024 | ✅ PASS | Tab Total: Total Items 1, UNIDADES 2, Total Pedido US$ 1,84 (≠0). Solo US$ pese a `multiCurrency=true` (comportamiento del módulo) |
| DM-PED-026 | ✅ PASS | Agregado 2º ítem (JAMON 3 und → US$ 10,06); eliminado desde Tab Total (trash en acordeón expandido) → recalcula a 1 ítem / US$ 1,84. Borrado directo sin confirmación |
| DM-PED-029 | ✅ PASS | Cliente sin ítems → Guardar y Enviar deshabilitados |
| DM-PED-030 | ✅ PASS | Comentario `Test-PED-SMOKE-173652` en `#txComment` → Guardar → alert "Denario / Pedido Guardado" (OK) |
| DM-PED-031 | ✅ PASS | Enviar → 3 alertas ("¿Desea Enviar el pedido?" → "Su Pedido será enviado" → "Pedido nro. 31 enviado exitosamente") → navega a `/pedidos` |
| DM-PED-032 | ✅ PASS | Form dirty (ítem agregado) + atrás → modal "¡Alerta!" 3 opciones (Guardar y salir / Salir sin guardar / Cancelar) |
| DM-PED-034 | ✅ PASS | BUSCAR → `/pedidosLista`; searchbar "ANDRES" filtra realtime 28→1 ítem, sin botón de búsqueda |
| DM-PED-035 | ✅ PASS | Click pedido Guardado (Ref 0) → `/pedido` editable, 4 tabs habilitadas, cliente y ítem (MAIZ 2 und US$ 1,84) persistidos |
| DM-PED-037 | ✅ PASS | Trash en Guardado → alert "Pedidos / ¿Seguro que quieres eliminar este pedido?" Aceptar → desaparece (29→28), sin alert de éxito |

### Notas de oráculo de persistencia (RUNTIME §9)
- Pedido Guardado reabierto: ítem MAIZ (2 und, US$ 1,84) releído correctamente. Comentario vacío esperado (este Guardado se creó vía "Guardar y salir" del dirty-guard, sin comentario escrito; el comentario `Test-PED-SMOKE-173652` fue al pedido nro. 31 enviado).
- Reabrir Guardado y navegar entre tabs marca el form **dirty** → atrás muestra modal "¡Alerta!"; "Salir sin guardar" conserva el Guardado en lista (confirmado: persiste tras salir). Consistente con `[cf-2612]`. No es FAIL.

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **Pedido nro. 31** | Cliente 2738 ADRIAN ARLET BASTARDO ALONZO · 1 ítem (MAIZ PARA COTUFAS RIOJANA 36X250G, 2 und, US$ 1,84) · comentario `Test-PED-SMOKE-173652` | **Enviado** |
| Pedido Ref 0 (temporal) | Cliente 2738 · 1 ítem (MAIZ, 2 und, US$ 1,84) — creado vía "Guardar y salir" para 035/037 | **Eliminado** (DM-PED-037) |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Entrada HOME Pedidos | universal | link `<a>` con texto "Pedidos" dentro de `ion-col` (x≈286,y≈250) → `pg.mouse.click` navega a `/pedidos`. Clicar el `<a>` interno, no el `ion-col` |
| Catálogo Tab Pedido insumar = sub-tabs Favoritos/Destacados/Carrito + buscador | cliente (insumar) | misma estructura que `productos-tab` de central_foods `[cf-2612]`: familias por `ion-label` (texto "ALIMENTOS" sin conteo) → click expande productos; click en producto expande detalle con `input[placeholder="Ingrese Cantidad:"]` (type=number). **El acordeón de familia se COLAPSA al cambiar de tab** — re-expandir al volver |
| Input cantidad insumar | cliente (insumar) | `input[placeholder="Ingrese Cantidad:"]` filtrar `r.top>0 && r.top<760` (hay duplicados ion-input+input); `fillIonInput` sobre el `<input>` habilita Guardar/Enviar y muestra badge contador. Tras agregar, el input visible vuelve a "0" (el ítem ya está en carrito) — confirmar en Tab Total |
| Trash ítem en Tab Total | universal | el `ion-button[color="danger"]`+`ion-icon[name="trash"]` aparece solo al **expandir el acordeón del ítem** asignando `grp.value = acc.value` (value Ionic interno, ej. `ion-accordion-105`) + `ionChange` al `ion-accordion-group` (el 2º group; el 1º es "Total por unidad"). El click en el header `ion-item` NO expande |
| Click trash Tab Total requiere evento combinado | universal | `mouse.click` solo NO dispara el borrado; usar `PointerEvent(pointerdown/up)` + `shadowRoot.querySelector('button').click()` + `mouse.click` combinados (mismo patrón que header fijo Guardar/Enviar) |
| Botón atrás en lista `/pedidosLista` | cliente (insumar) | hay 2 `img.fechaAtras` visibles (x≈10 y x≈302); el de la **izquierda** (menor `left`) es el atrás real → lista a `/pedidos` |
| Guardar guarda in-place | cliente (insumar) | tras Guardar ("Pedido Guardado" OK), la app **permanece en `/pedido`** (no navega a lista); permite Enviar directo desde el mismo form. "Guardar y salir" del dirty-guard sí vuelve a `/pedidos` sin alert extra |
| #clienteSelect / #txComment | universal | confirma `[ins-2610]`: `app-pedido #clienteSelect` (modal `#clienteSelectModal.present()`), `app-pedido #txComment` (`fillIonInput`, reactive form). Selección cliente: click en `<p>` del nombre, no centro del item |

> ✅ consolidado 2026-06-19

## Hallazgos (FAIL)

Ninguno. 14/14 PASS.
