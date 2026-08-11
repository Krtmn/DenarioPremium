# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260612_104156_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | Infinix X6728 (Android 15) — CDP :9220 |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | El Yaque (central_foods) |
| Cliente QA | central_foods (CENTRAL FOODS C.A.) |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A** |

> ⚠ Reporte escrito incrementalmente (intento previo se interrumpió por sobrecarga API). Cerrado: 8 casos previos (001/002/006/015/017/024/026/030) + 6 casos finales (029/031/032/034/035/037). App final en HOME.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | `app-pedidos` home con 3 botones: PEDIDO / BUSCAR / COPIAR |
| DM-PED-002 | ✅ PASS | Click PEDIDO → `app-pedido` (`/pedido`); tabs GENERAL(default, activa) / PEDIDO / TOTAL / ADJUNTO; PEDIDO/TOTAL/ADJUNTO con `segment-button-disabled`; cliente = "Seleccione Cliente" |
| DM-PED-006 | ✅ PASS | Click `#clienteSelect` → `#clienteSelectModal` (show-modal) → buscar "ALEJANDRA LEDEZMA" + botón search → click `<ion-label>` nombre → **alert deuda vencida** "Pedidos / Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" (Cancelar/Aceptar) → Aceptar → 4 tabs habilitadas; cliente = "ALEJANDRA LEDEZMA (00029)" |
| DM-PED-015 | ✅ PASS | Tab Pedido → lista de categorías (familias) en acordeón: ARROZ 7, CEPILLO DENTAL 29, GALLETAS AMAPOLA 24… Click "ARROZ 7" → 7 productos (`ion-accordion`): ARROZ MARY DORADO 0182, ESMERALDA 0180, INTEGRAL, PREMIUM… |
| DM-PED-017 | ✅ PASS | Expandir producto → input Cantidad (type=number) → `fillIonInput`=2 → badge "2" + indicador verde; Tab Total muestra totales |
| DM-PED-024 | ✅ PASS | Tab Total: Total Items 1 · Total Base US$ 2,2600 · Total Pedido US$ 2,6216 (≠ cero). **Solo US$, sin Bs.** (consistente con `multiCurrencyOrder=false`) |
| DM-PED-026 | ✅ PASS | Con 2 ítems (Total Pedido US$ 7,0412) → expandir ítem ESMERALDA en Tab Total → trash `ion-button[color="danger"]` (directo, sin confirmación) → Total Items 2→1 · Total Pedido 7,0412 → 2,6216 (recalculado) |
| DM-PED-030 | ✅ PASS | Comentario General `#txComment`=`Test-PED-SMOKE-104156`; click `.imagenGuardar` (header y≈32) → alert "Denario / Pedido Guardado" (OK). Queda en form con Fecha Pedido 12/6/2026 11:09 |
| DM-PED-029 | ✅ PASS | PEDIDO nuevo sin cliente ni ítems → `.imagenGuardar` y `.imagenEnviar` ambos `disabled` (header y≈32) |
| DM-PED-031 | ✅ PASS | Abrir Guardado (ALEJANDRA, ARROZ MARY DORADO qty 2) → `.imagenEnviar` (Pointer+Mouse+shadowBtn) → confirm "¿Desea Enviar el pedido?" (Cancelar/Aceptar) → "Denario Pedidos / Su Pedido será enviado" (OK) → **"Denario Premium / Pedido nro. 93 enviado exitosamente"** (OK) → navega a `/pedidos` home |
| DM-PED-032 | ✅ PASS | Form dirty (ALEJANDRA + ARROZ MARY DORADO qty 2, sin guardar) → `img.fechaAtras` (`getBoundingClientRect`+`mouse.click` ~31,31) → modal `ion-alert` "¡Alerta!" con 3 opciones: **Guardar y salir / Salir sin guardar / Cancelar** |
| DM-PED-034 | ✅ PASS | BUSCAR → `app-pedidos-lista` (46 ítems) → `ion-searchbar` input + type "ALEJANDRO" → filtra realtime a 4 ítems (todos "ALEJANDRO SILVA 00030") |
| DM-PED-035 | ✅ PASS | Click pedido Guardado (Nro.Ref:0, ALEJANDRA) en lista → `app-pedido` editable; las 4 tabs (default/pedido/total/adjuntos) `disabled` momentáneamente (~1.5s render async) → habilitan; cliente precargado "ALEJANDRA LEDEZMA (00029)"; Tab Pedido navegable (catálogo + Carrito) |
| DM-PED-037 | ✅ PASS | Lista BUSCAR → ítem Guardado (Nro.Ref:0, ALEJANDRA) → trash `ion-button[color="danger"]` → alert "Pedidos / ¿Seguro que quieres eliminar este pedido?" (Cancelar/Aceptar) → Aceptar → ítem desaparece (48→47, 0 Guardado; sin alert de éxito post-borrado) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. Ref: 0 → 93 | Pedido ALEJANDRA LEDEZMA (00029) · 1 ítem ARROZ MARY DORADO 30X800 GRS (Cód 0182) qty 2 · creado vía DM-PED-032 ("Guardar y salir"), reabierto DM-PED-035, **enviado DM-PED-031** | **Enviado (Nro. 93)** |
| Nro. Ref: 0 (borrado) | Pedido ALEJANDRA LEDEZMA (00029) · 1 ítem ARROZ MARY DORADO qty 2 · creado para DM-PED-037 y **eliminado** desde lista con confirmación | **Eliminado** |

> Nota: el pedido `Test-PED-SMOKE-104156` (Nro.Ref:0 del intento previo) **no estaba presente como Guardado** al reanudar — todos los ALEJANDRA en lista estaban "Enviado" (refs 91/92 hoy ya enviados). Se crearon 2 pedidos Guardados nuevos para cubrir DM-PED-031/035/037.

## Datos descubiertos (modules.pedidos)
| Clave | Valor |
|-------|-------|
| `cliente_test` | `"ALEJANDRA LEDEZMA"` (Cód 00029) — con saldo (US$ 57,0300) y deuda vencida |
| `alerta_deuda_vencida` | **`true`** — al seleccionar cliente: "Pedidos / Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" (Cancelar/Aceptar) |
| `estructura_producto` | Categorías/familias en acordeón con conteo: "ARROZ 7", "CEPILLO DENTAL 29", "GALLETAS AMAPOLA 24"… Click categoría → productos (`ion-accordion`, cada uno con Código). Producto expandido → Unidad / Cantidad / Lista de Precio / Descuento / Almacén |

## Patrones / selectores nuevos
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Tab Pedido = componente **`productos-tab`** (NO `ion-accordion`) | universal (revisar) | En esta build central_foods el catálogo de productos NO usa `ion-accordion`/`ion-item`. Categorías y productos son `productos-tab ion-label`; hay sub-tabs internos **Favoritos / DESTACADOS / Carrito**. Buscador interno: `productos-tab-search input` (placeholder "Búsqueda de productos"). Click en `ion-label` de categoría (ej. "ARROZ", **sin conteo en el texto del label**) expande productos; click en `ion-label` del producto expande su detalle con `ion-input` placeholder "Ingrese Cantidad:" |
| Cantidad producto: filtrar por `getBoundingClientRect().top` | universal | El `ion-input` Cantidad se localiza por placeholder "Ingrese Cantidad:" en el inner `<input>`; filtrar `r.top>0 && r.top<700` para tomar el visible (hay duplicados ion-input+input). `fillIonInput` (native setter + ionChange/ionInput + blur) habilita Guardar/Enviar |
| Cliente modal | universal | `#clienteSelectModal.present()` abre; buscar con input + click `.clear-search`; seleccionar click en `<ion-label>` del nombre exacto (no centro = "Más Detalles") |
| Dirty-guard back vía CDP **SÍ funciona** en central_foods | cliente central_foods | `img.fechaAtras` + `getBoundingClientRect()`+`mouse.click` (~31,31) con form sucio → modal `ion-alert` "¡Alerta!" 3 opciones (Guardar y salir / Salir sin guardar / Cancelar). Confirma patrón insumar/romher; contrasta globalmp COBROS. "Guardar y salir" guarda y vuelve a `/pedidos` sin alert de éxito extra |
| Envío pedido: secuencia 3 alertas | cliente central_foods | confirm "¿Desea Enviar el pedido?" (Cancelar/Aceptar) → "Denario Pedidos / Su Pedido será enviado" (OK) → "Denario Premium / Pedido nro. X enviado exitosamente" (OK) → `/pedidos` home |
| Borrado desde lista: CON confirmación | cliente central_foods | trash `ion-button[color="danger"]` dentro del `ion-item` Guardado → alert "Pedidos / ¿Seguro que quieres eliminar este pedido?" (Cancelar/Aceptar) → Aceptar → ítem desaparece **sin alert de éxito** |
| Searchbar lista filtra realtime | universal | `ion-searchbar input` + `keyboard.type` filtra in-place (46→4) sin botón |

> ✅ consolidado 2026-06-12

## Discrepancias VG
| VG | Observado | Nota |
|----|-----------|------|
| `multiCurrencyOrder` (≈false) | Tab Total muestra **solo US$** (sin Bs.) — consistente con DM-PED-024 previo | No FAIL; coincide con insumar (`multiCurrency=true` pero Tab Total solo US$ — comportamiento del módulo) |
| `alerta_deuda_vencida` = true | ALEJANDRA LEDEZMA dispara alert "Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" (Cancelar/Aceptar) al seleccionarla | esperado |

## Hallazgos (FAIL)
Ninguno. Los 14 casos PASS, sin defectos nuevos ni reproducción de defectos conocidos.
