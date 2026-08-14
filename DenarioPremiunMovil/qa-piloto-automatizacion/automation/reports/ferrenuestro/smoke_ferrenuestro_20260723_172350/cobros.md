# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260723_172350_smoke-completo` |
| Módulo | COBROS |
| Cliente | ferrenuestro (Isla Coche) · usuario `leidy` / `***` |
| App | `com.kiberno.denarioPremiumPro` |
| Infra | CDP :9220 · **window.ng = TRUE** (contradice YAML julio=false; build cambió) · alert OK/Aceptar |
| BD | **BD-N/A (payload)** — cotejo BD caído (permission-denied); verificado por captura de payload + UI/round-trip |
| Resultado | **27 PASS · 1 SKIP · 6 N/A · 0 BLOCKED** (34 casos) |
| Baseline | ~62 tool-uses `browser_run_code_unsafe` (~72 total) · ~1.797.000 ms (~30 min) |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Botones COBRO/ANTICIPO/RETENCIÓN/BUSCAR (sin IGTF ni 25%IVA, correcto por VGs) |
| DM-COB-002 | ✅ PASS | 5 tabs; General activo; Documentos/Pagos/Total/Adjuntos disabled; cliente vacío |
| DM-COB-004 | ✅ PASS | TORNICAGUA "TORNICAGUA, C.A. (121793873)" → 4 tabs habilitan |
| DM-COB-006 | 🚫 N/A | `requiredComment=false` → comentario no obligatorio |
| DM-COB-007 | ✅ PASS | Tab Documentos: 17 facturas $ + leyenda Vigente/Vencido/A favor |
| DM-COB-008 | ✅ PASS | Checkbox 00033891 → Pagos "Monto total a pagar Bs. 42.892,96" (actualiza desde 0) |
| DM-COB-009 | ✅ PASS | Modal métodos: Efectivo/Depósito/Transferencia/Otros/Pago Móvil |
| DM-COB-012 | ✅ PASS | Monto parcial (1.000,00) → diferencia **roja** −41.892,96; total → **azul** 0,00 |
| DM-COB-014 | ✅ PASS | Tab Total: tabla Tipo/Doc/Monto + acordeón "Total Efectivo Bs. 42.892,96"; totales no nulos |
| DM-COB-015 | ✅ PASS | "Total General" visible = 42.892,96 |
| DM-COB-016 | ✅ PASS | Adjuntos: acordeones Imágenes (BUSCAR/TOMAR FOTO), Archivo, Firma |
| DM-COB-018 | ✅ PASS | Guardar → alert "El Cobro se ha guardado"; aparece en BUSCAR Estatus Guardado |
| DM-COB-019 | ⏭ SKIP | `requiredCollectionAttachments=true` + `mock_camara_funciona=false` → SKIP envío; queda Guardado, adjunto manual QA |
| DM-COB-020 | ✅ PASS | Atrás con cambios → modal 3 opciones (Guardar y salir / Salir sin guardar / Cancelar) |
| DM-COB-021 | ✅ PASS | "Salir sin guardar" en cobro nuevo → conteo Guardados sin cambio (no persiste) |
| DM-COB-022 | ✅ PASS | Lista + searchbar; trash (danger) SOLO en Estatus Guardado |
| DM-COB-024 | ✅ PASS | Reabre Guardado editable (Guardar activo, Enviar disabled por adjunto); Pagos 42.892,96 persiste |
| DM-COB-026 | ✅ PASS | Trash → "¿Desea eliminar el Cobro?" (Cancelar/Eliminar) → Eliminar → conteo 3→2 |
| DM-COB-028 | ✅ PASS | Anticipo: cliente elegible; Efectivo Bs 500,00 → "El Anticipo se ha guardado"; visible BUSCAR tipo **Anticipo** |
| DM-COB-029 | ✅ PASS | Retención (botón): doc 00033891, Monto total retenido Bs 8,00 → "La Retención se ha guardado" (sin Tab Pagos); envío SKIP por adjunto |
| DM-COB-033 | ✅ PASS | Moneda cobro (2º ion-select General): 2 opciones Bs./$ enabled |
| DM-COB-034 | ✅ PASS | Moneda documento: $ carga 17 filas (Bs. vacía) — filtra la lista |
| DM-COB-036 | 🚫 N/A | `userCanSelectIGTF=false` → sin selector IGTF (estructural) |
| DM-COB-037 | 🚫 N/A | `userCanCollectIva=false` → sin cobro 25% IVA (estructural) |
| DM-COB-038 | ✅ PASS | Atrás → "Guardar y salir" → "El Cobro se ha guardado"; conteo 2→3 |
| DM-COB-039 (A) | ✅ PASS | `#manualRateInput` 737.88→700 → recalcula (Bs 42.892,96→40.691,00); persiste al reabrir (700 / 40.691,00) |
| DM-COB-040 | ✅ PASS | Efectivo monto=total → diferencia **azul** 0,00 |
| DM-COB-041 | ✅ PASS | Retención por detalle doc 00037192: Nro Comp Ret 14díg habilita IVA 5,00+ISLR 3,00; Pagos neto Bs 145.666,41 = saldo 145.674,41 − 8,00 |
| DM-COB-042 | ✅ PASS | Guardar (neto) → reabrir → Pagos mantiene Bs 145.666,41 (**NO revierte a bruto**; round-trip §9 OK — sin el FAIL conocido) |
| DM-COB-043 | ✅ PASS | Con doc + método: monto<total rojo, =total azul (ambas ramas) |
| DM-COB-044 | 🚫 N/A | `userCanSelectIGTF=false` (estructural) |
| DM-COB-045 | 🚫 N/A | `userCanSelectIGTF=false` (estructural) |
| DM-COB-046 | ✅ PASS | Toggle "Pago parcial" doc 00033891 → Monto a pagar Bs 100,00 → Pagos 100,00 → Guardar → reabrir mantiene 100,00 (round-trip §9) |
| DM-COB-047 | 🚫 N/A | `canChangeRate=false` → no se cambia Fecha tasa (estructural) |

## Registros creados en sistema

Todos **Guardado** (ninguno Enviado: adjunto obligatorio + `mock_camara_funciona=false` → envío SKIP, pendiente adjunto manual QA).

| Ref | Detalle | Estado |
|-----|---------|--------|
| Cobro normal | TORNICAGUA · doc 00033891 · Efectivo · tasa manual 700 → Bs 40.691,00 | Guardado (018/024/039) — pendiente adjunto |
| Cobro c/retención doc | TORNICAGUA · doc 00037192 · retención IVA 5 + ISLR 3 · neto Bs 145.666,41 | Guardado (041/042) — pendiente adjunto |
| Anticipo | TORNICAGUA · Efectivo Bs 500,00 | Guardado tipo Anticipo (028) — pendiente adjunto |
| Retención (botón) | TORNICAGUA · doc 00033891 · retenido Bs 8,00 | Guardado tipo Retención (029) — pendiente adjunto |
| Cobro pago parcial | TORNICAGUA · doc 00033891 · parcial Bs 100,00 · Efectivo | Guardado (046) — pendiente adjunto |
| (throwaway) | Cobro creado por "Guardar y salir" (038) y **ELIMINADO** en 026 | Eliminado |

Conteo final en BUSCAR: **5 Guardado TORNICAGUA** (Cobros×3, Retención×1, Anticipo×1).

## Verificación BD (BD-N/A · payload)

- Cotejo BD caído (permission-denied) → NO se corrió query.js/local-query.
- Captura de payload (`nativePromise`) instalada: **120 POST capturados, todos `syncservice/getsync`**; **0 `collectservice/collection`** — coherente con 0 cobros Enviados (todos Guardado por adjunto SKIP). Marca: **BD-N/A (payload)**; validación por UI + round-trip §9.
- ⚠ Host de `getsync` observado = `denariolatortuga.ddns.net:8081` (difiere del `islacoche` del YAML). Consistente con los payloads de módulos previos (potentialclient/order) en el mismo `_payloads.jsonl`. Los datos SON ferrenuestro (TORNICAGUA cód 121793873). Observación de corrida, no defecto de cobros.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| ⚠ `nuevoCobro` programático NO renderiza el form (aun con `window.ng=true`) | cliente (build ferrenuestro El Yaque, window.ng=true) | `comp.nuevoCobro(N)` / `h.openNuevoCobro` dispara pero `app-cobros-container` queda solo con el menú (ion-grid). El form SÍ abre con **click real Pointer down/up en el tile COBRO/ANTICIPO/RETENCIÓN**. CONTRASTA con dm-electronica (window.ng=true, nuevoCobro programático SÍ operaba). |
| Dirty-guard modal con `.alert-message` VACÍO | universal (build El Yaque) | Modal 3 opciones tiene title "Denario Cobros" y **message ""** → detectar por BOTONES (`Salir sin guardar`/`Guardar y salir`), no por message. `activeAlertInfo` debe exponer `buttons`. |
| `getActiveView('app-cobros')` NO distingue menú vs form | universal | `app-cobros` es el contenedor y siempre `offsetParent!==null`. Detectar "en form" por **presencia de `ion-segment-button` visible**; "en menú" por botón COBRO/BUSCAR visible. |
| Selección de cliente (window.ng=true) | cliente | `#clienteSelectModal.present()` + `input.focus()` (JS) + `keyboard.type` + **Enter** (filtra) + click en `<p>` del nombre. (Como dm-electronica/latino: filtra con Enter, no con set value.) |
| Acordeón Efectivo (Pagos) colapsa al cerrar `#eventModal` | cliente | Tras `dismiss()` del `#eventModal` el acordeón Efectivo colapsa → **expandir con click real en el header "Efectivo"**; Monto = 2º `input` visible de `app-cobro-pagos` (idx0=Nro Recibo, idx1=Monto). |
| Retención por documento (window.ng=true) | cliente | Modal "**Detalle del documento**" (minúscula). **Nro. Comp Ret** = ion-input de la fila con texto "Comp Ret" (NO "Tipo"); llenar (click+type 14díg + set `.value`+eventos) hace **aparecer** Fecha Comp Ret + Monto retenido IVA + ISLR. IVA "5,00"="500", ISLR "3,00"="300" (dígitos, sin coma). **Fecha Comp Ret tiene default** → NO bloquea Guardar. Guardar=`.botonAddVerde` cierra en silencio (en flujo retención-botón salió alert "La Retención se ha guardado"). |
| documento_retencion 00037108 DRENADO | cliente | Ya no en cartera TORNICAGUA (desde 2026-07-07). Usar cualquier factura $ sana (se usó **00037192** $208,11). Docs $ actuales: 00033891, 00037192, 00037221, 00037225, 00037241, 00037252... (16-17 filas). |
| Monto Depósito/parcial/IVA/ISLR — técnica El Yaque confirmada window.ng=true | cliente | `input.focus()` (JS) + Backspace×N + `keyboard.type('NNNN')` (dígitos, SIN coma) + blur (`input`/`change`/`ionInput`/`ionChange`/`blur`/`ionBlur`). Aplica a Monto pago, IVA/ISLR retención, pago parcial, y `#manualRateInput`. |
| ⚠ Host payload `getsync` = denariolatortuga (no islacoche) | cliente | Observación transversal de la corrida — verificar con QA si el APK apunta al server correcto; datos SON ferrenuestro. |

*(Sin FAIL. Sin BLOCKED. La retención por documento — G1 del gap `_comunes` — quedó CERRADA en este build window.ng=true.)*

> ✅ consolidado 20260723
