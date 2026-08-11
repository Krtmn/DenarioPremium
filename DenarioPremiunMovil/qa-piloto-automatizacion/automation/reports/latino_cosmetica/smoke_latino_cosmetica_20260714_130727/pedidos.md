# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260714_130727_smoke-completo` |
| Módulo | PEDIDOS |
| Cliente | latino_cosmetica (usuario 001) |
| Servidor | La Tortuga (`denariolatortuga.ddns.net:8081`) v6.6.18 |
| App | `com.kiberno.denarioPremiumPro` · device Infinix HOT 60i (X6728) |
| `window.ng` | **true** (helpers con fallback Angular operables) |
| VGs | `orderEnterpriseEnabled=false` (sin selector Empresa) · `multiCurrencyOrder=false` (Tab Total solo US$) |
| Cliente sincronizado usado | **ANNELI CA** (código 13, id_client=34, saldo $373,26, deuda vencida) |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Estado inicial/final | HOME → HOME ✅ |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Home Pedidos con botones PEDIDO / BUSCAR / COPIAR |
| DM-PED-002 | ✅ PASS | Form `app-pedido`; GENERAL habilitada, PEDIDO/TOTAL/ADJUNTO `segment-button-disabled` sin cliente |
| DM-PED-006 | ✅ PASS | Modal `#clienteSelectModal` (`show-modal`); ANNELI CA → alert "deuda vencida" → Aceptar → 4 tabs habilitadas |
| DM-PED-015 | ✅ PASS | Catálogo cosmética visible: categorías BELOTTI 74 / PROKPIL 70 / ROIAL 8 (`ion-item.listaItems`) |
| DM-PED-017 | ✅ PASS | Producto 3058 BELOTTI ACOND CEBOLLA, cantidad=2 → badge `.contadorProductos`=2, indicador verde, sin alerta inventario |
| DM-PED-024 | ✅ PASS | Tab Total: Base $10,47 · IVA $1,67 · Total Pedido $12,14 (≠0); moneda única US$ |
| DM-PED-026 | ✅ PASS | Trash dentro del acordeón del ítem (`ion-button[color=danger]`) → Total Items 0, totales $0,00 (recálculo con `mouse.click`) |
| DM-PED-029 | ✅ PASS | Con 0 ítems, `.imagenGuardar` y `.imagenEnviar` con clase `button-disabled` |
| DM-PED-030 | ✅ PASS | Guardar → alert "Denario / Pedido Guardado" (OK); comentario `Test-PED-SMOKE-133459` |
| DM-PED-031 | ✅ PASS | Enviar → secuencia "¿Desea Enviar?" → "Su Pedido será enviado" → **"Pedido nro. 34 enviado exitosamente"** → navega a home Pedidos |
| DM-PED-032 | ✅ PASS | Atrás con form dirty → modal "¡Alerta!" 3 opciones (Guardar y salir / Salir sin guardar / Cancelar) |
| DM-PED-034 | ✅ PASS | Searchbar "ANNELI": lista filtra realtime 17 → 2 |
| DM-PED-035 | ✅ PASS | Reabrir Guardado Ref 0 → form editable, 4 tabs habilitadas (~2s async), comentario preservado (round-trip §9) |
| DM-PED-037 | ✅ PASS | Trash danger (w≈29) en lista → confirm "¿Seguro que quieres eliminar este pedido?" → Aceptar → ítem desaparece (1→0) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| **Nro. 34** (id_order=34) | Pedido ANNELI CA · 1 línea (BELOTTI ACOND CEBOLLA X 300 ML, qty=2) · Total $12,14 · comentario `Test-PED-SMOKE-133459` | **Enviado** (st_order=1) |
| Ref 0 (2º pedido) | Pedido ANNELI CA Guardado, creado para DM-PED-037 | **Eliminado** en lista (trash) |

## Verificación BD (round-trip §10)
Consulta nube `"order"` tras Enviar:
```
id_order=34 · co_order=1784050255709.0 · st_order=1 (Enviado) · nu_amount_total=12.1401 · nu_amount_final=10.4656 · nu_details=1 · det=1 · units=1
```
- `order` existe; `nu_details=det=1` = líneas cargadas por UI; `units=1 ≥ det`. ✅
- `nu_amount_total=12.14` cuadra con Tab Total. ✅
- `st_order=1` = Enviado (La Tortuga usa código 1, igual que ferrenuestro Isla Coche). ✅
- Correlación **Nro.Ref UI (34) = id_order (34)** confirmada.
- Payload capturado (`nativePromise` hook, `orderservice/order`) coincide 1:1 con nube: coClient=13, txComment, qty=2, coProduct=3058.

**Marca: BD-OK** — guardado→enviado confirmado en nube íntegro (cabecera + detalle + unidad).

## Captura de payload
- Hook `nativePromise` capturó **2 POST** `orderservice/order` (mismo `coOrder`, reintento idempotente) → volcado 1 línea deduplicada en `_payloads.jsonl`.
- Cobertura confirmada en este build/servidor (La Tortuga v6.6.18, `window.ng=true`): `order` SÍ capturado.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| latino_cosmetica en **servidor La Tortuga** v6.6.18, `window.ng=TRUE` | cliente | Mismo servidor que hidroponias (`denariolatortuga.ddns.net`). Confirma envío OK + sync inmediata + persistencia nube (contrasta no-persistencia jerez El Yaque) |
| Tab Pedido = `ion-accordion.accordionPedidos` dentro de categoría `ion-item.listaItems` | universal (reconfirma) | 3ª confirmación de la estructura `ion-accordion` real en La Tortuga v6.6.18 (tras ferrenuestro/hidroponias/dm-electronica). Header=Nombre+Código+Precio+Inventario, contenido=`ion-input[type=number]` (height 0 colapsado). Categoría se colapsa al cambiar de tab (re-expandir) |
| DM-PED-026 trash Tab Total recalcula con `pg.mouse.click` | universal (reconfirma) | 3ª confirmación (hidroponias + dm-electronica + latino_cosmetica) — la falla de ferrenuestro es específica de ese device/estado, NO del build |
| ANNELI CA dispara modal "deuda vencida" al seleccionar | cliente | "Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" (Cancelar/Aceptar) — Aceptar continúa, no bloquea. NO FAIL |
| Botón "Pedido Sugerido" NO aparece pese a `suggestedOrder` | cliente (coherente) | Misma divergencia UI-vs-config `suggestedOrderByDispatchAndReturn` que jerez/ferrenuestro/dm-electronica |

> ✅ consolidado 20260714

## Baseline (Ola 0)
- **TOOL-USES aprox:** ~40 (36 `browser_run_code_unsafe` + 2 Bash BD/append + Reads/snapshot)
- **MS aprox módulo:** ~480000 ms (~8 min wall-clock, incluye 2 pedidos creados: 1 enviado + 1 eliminado)
- Intentos por caso: 1 (ningún caso llegó al techo de 2)

## Verificación BD (payload ↔ nube · campo-a-campo · Agente BD)

| co_x | Marca | Cabecera | Hijas | Mismatches | Notas |
|------|-------|----------|-------|------------|-------|
| 1784050255709.0 | BD-FIELD-OK | 12/12 OK | order_detail 1/1 · order_detail_unit 1/1 | 0 | da_order hora (UTC-4↔UTC); redondeos de moneda esperados |

**Pedido #34 (ANNELI CA 13, BELOTTI ACOND CEBOLLA ×2, $12,14): guardado→enviado íntegro.** 12 campos cabecera + 6 detalle + 3 unidad coinciden (salvo redondeo/zona horaria). Cero mismatches reales.
