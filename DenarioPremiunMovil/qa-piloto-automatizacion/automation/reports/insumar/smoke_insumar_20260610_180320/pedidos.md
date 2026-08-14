# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260610_180320_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | Android WebView (CDP `127.0.0.1:9220`) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Playa | insumar |
| Cliente prueba | ADRIAN ARLET BASTARDO ALONZO (Cód 2738, Saldo US$ 104,50) |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Módulo Pedidos abre en `/pedidos` con botones PEDIDO, BUSCAR, COPIAR |
| DM-PED-002 | ✅ PASS | PEDIDO → `/pedido`; tab General activo, Pedido/Total/Adjunto con `segment-button-disabled`; sin cliente |
| DM-PED-006 | ✅ PASS | Modal cliente (`#clienteSelectModal.present()`) → click `<p>` ADRIAN ARLET → alerta "deuda vencida" (Cancelar/Aceptar) → Aceptar → 4 tabs habilitadas |
| DM-PED-015 | ✅ PASS | Tab Pedido muestra familias en acordeón (ALIMENTOS 158, BEBIDAS 113, …, 18 familias); ALIMENTOS expande lista de productos |
| DM-PED-017 | ✅ PASS | 2 clicks (familia ALIMENTOS → producto VITTALE 12011) revela input cantidad; `fillIonInput`=2 → badge contador "2" |
| DM-PED-024 | ✅ PASS | Tab Total: Total Items 1, Total Base US$ 31,02, Total IVA US$ 4,96, Total Pedido US$ 35,98 (≠ cero). Solo US$ (sin Bs.) — comportamiento del módulo en insumar, no FAIL |
| DM-PED-026 | ✅ PASS | Con 2 ítems (Total US$ 37,05) → expandir acordeón ítem MAIZ → trash (botón danger) directo sin confirmación → Items 2→1, Total 37,05→35,98 recalculado |
| DM-PED-029 | ✅ PASS | Con 1 ítem: Guardar/Enviar habilitados. Tras borrar todos (Total Items 0): `.imagenGuardar` y `.imagenEnviar` quedan `button-disabled` |
| DM-PED-030 | ✅ PASS | Re-agregado VITTALE qty 2 + comentario `Test-PED-SMOKE-180320` (campo `#txComment` en General) → Guardar → alert "Denario / Pedido Guardado"; aparece en lista Estatus: Guardado, Nro. Ref.: 0 |
| DM-PED-031 | ✅ PASS | Reabrir Guardado → Enviar → "¿Desea Enviar el pedido?" → Aceptar → "Su Pedido será enviado" → **"Pedido nro. 26 enviado exitosamente"** → navega a `/pedidos` |
| DM-PED-032 | ✅ PASS | Form sucio (ítem agregado sin guardar) + botón atrás → modal "¡Alerta!" 3 opciones: **Guardar y salir / Salir sin guardar / Cancelar**. Dirty-guard SÍ se activa vía CDP en insumar. (Reabrir Guardado pristine + atrás → salida directa sin modal, confirmado) |
| DM-PED-034 | ✅ PASS | BUSCAR → `/pedidosLista` con `ion-searchbar`; teclear "AGROPECUARIA" filtra realtime 26→4 ítems, todos coinciden |
| DM-PED-035 | ✅ PASS | Click pedido Guardado (`pg.mouse.click`) → `/pedido` editable, 4 tabs habilitadas, cliente ADRIAN (2738) cargado, `.imagenGuardar` presente |
| DM-PED-037 | ✅ PASS | BUSCAR → pedido Guardado → trash → alert "Pedidos / ¿Seguro que quieres eliminar este pedido?" (Cancelar/Aceptar) → Aceptar → ítem desaparece (27→26, Guardados 1→0) |

### Oráculo de persistencia (round-trip Guardar → reabrir)
- Comentario: guardado `Test-PED-SMOKE-180320` → reabierto desde lista en DM-PED-035 → releído `Test-PED-SMOKE-180320` (idéntico). Cliente conservado. **Sin mutación silenciosa → PASS.**

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. Ref. 26 | Pedido ADRIAN ARLET (2738), ítem VITTALE LECHE 12011 ×2, comentario `Test-PED-SMOKE-180320` | **Enviado** (DM-PED-030 guardado → DM-PED-031 enviado) |
| Nro. Ref. 0 (temporal) | Pedido ADRIAN ARLET (2738), ítem VITTALE ×1, creado vía "Guardar y salir" (DM-PED-032) | **Eliminado** en DM-PED-037 (no persiste en sistema) |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Form de pedido vive en componente `app-pedido` (singular), NO en `app-pedidos` | universal | `app-pedidos` solo contiene el home (PEDIDO/BUSCAR/COPIAR). Tras click PEDIDO la ruta es `/pedido` y el form está en `app-pedido`. Leer totales/tabs/comentario desde `app-pedido`, no `app-pedidos`. Evita "innerText vacío" |
| Lista BUSCAR en componente `app-pedidos-lista` · ruta `/pedidosLista` | universal | Los ítems Guardado/Enviado se leen aquí, no en `app-pedidos` |
| Campo Comentario = `ion-input#txComment` (tab General, bajo el fold) | universal | Orden inputs General: `#clienteSelect`(0), Número de Orden `#nuPu…`(1), Responsable `#naRe…`(2), Comentario `#txComment`(3). Requiere scroll. `fillIonInput` funciona (reactive form, NO ngModel) |
| Trash de ítem en Tab Total: dentro del acordeón del ítem (colapsado por defecto) | cliente (insumar) | Hay que expandir el acordeón del ítem (`ion-item` con "Código: NNN") para revelar `ion-button[color="danger"]` con `ion-icon[name="trash"]`. Borrado directo sin confirmación |
| Dirty-guard atrás SÍ funciona vía CDP en insumar | cliente (insumar) | Con form sucio, `img.fechaAtras`+`mouse.click` dispara alert "¡Alerta!" con 3 botones (Guardar y salir / Salir sin guardar / Cancelar). Contrasta con globalmp COBROS (requiere hardware back). Confirma divergencia por build/cliente |
| Borrado desde lista: alert "Pedidos / ¿Seguro que quieres eliminar este pedido?" (Cancelar/Aceptar) | universal | Texto exacto del alert de borrado desde `app-pedidos-lista` |
| Envío insumar: secuencia "¿Desea Enviar el pedido?" → "Su Pedido será enviado" (×2) → "Pedido nro. X enviado exitosamente" | cliente (insumar) | Confirma nota previa de 2-3 alertas |
| Tab Total insumar: solo US$, sin Bs. pese a `multiCurrency=true` | cliente (insumar) | Comportamiento del módulo, no FAIL (per prompt) |

> ✅ consolidado 2026-06-10

## Hallazgos (solo si hay FAIL)

Ninguno. 14/14 PASS.
