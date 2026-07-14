# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260714_130727_smoke-completo` |
| Módulo | COBROS |
| Dispositivo | 14678405BR003855 (Infinix HOT 60i / X6728) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 (dbVersion 16) |
| Servidor | La Tortuga (`denariolatortuga.ddns.net:8081/PremiumWS`) · `window.ng=TRUE` |
| Cliente/Playa | latino_cosmetica · usuario 001 (LATINOCOSMETICA C.A., emp 00001) |
| Resultado | 27 PASS · 1 PASS-parcial · 4 N/A · 2 BLOCKED · 0 FAIL |
| Baseline (Ola 0) | ~58 tool-uses CDP · módulo pesado (selección de cliente + recuperación de crash) |

## Cliente(s) sincronizado(s) usado(s) por tipo (descubierto en runtime)
- **FACT (cobro normal / retención / parcial):** **CABELLO COSMETICOS CA** (co 37, idClient 300) — 2 facturas USD: nro **1820** ($1.551,18) y **1716** ($1.160,09). Confirmado sincronizado en modal (saldo $2.711,27) y nube.
- **IGTF:** FARMA COSMETICOS DULCINEA 2019 CA (co 197) — el doc IGTF de la nube (nro "IGTF-2026-05-22 11:23:12", $2,77) **NO está sincronizado** en el device (form IGTF muestra "No hay documentos" en $ y BSD).
- Confirmado NO sincronizados para usuario 001: DISTRIBUIDORA LOOKS 4 (149), MUNDO MAYOR DOS (398) — pese a tener docs en nube (sync parcial por vendedor).
- Backup confirmado: ANNELI CA (13, 1 FACT USD $373,26).

## ¿Mock cámara funciona? — NO (pero adjunto resuelto)
`tomarImg()` invoca el **módulo webpack `@capacitor/camera` `Camera.getPhoto`**, NO `window.Capacitor.Plugins.Camera` → el mock estándar `mockCameraAdjunto`/`ensureAdjunto` NO intercepta (foto no entra al carrusel). **`mock_camara_funciona=false`** para este build. **Workaround exitoso:** replicar el efecto de `tomarImg` empujando una Foto a `adjuntoService.fotos` + `checkCarousel()` + `onAttachmentChanged()` → la foto entra al carrusel → **DM-COB-019 enviado de verdad** (BD-OK).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Menú: COBRO·ANTICIPO/PREPAGO·RETENCIÓN·IGTF·BUSCAR (sin 25%IVA, correcto por userCanCollectIva=false) |
| DM-COB-002 | ✅ PASS | 5 tabs; General(default) habilitado, Documentos/Pagos/Total/Adjuntos disabled; Cliente vacío |
| DM-COB-004 | ✅ PASS | CABELLO seleccionado + Comentario "Test-COB-004" → 4 tabs se habilitan |
| DM-COB-006 | ✅ PASS | Comentario vacío → campo `ion-invalid` + "¡Campo Obligatorio!" + tabs disabled (requiredComment=true) |
| DM-COB-007 | ✅ PASS | Tab Documentos: 2 facturas (1820 $1.551,18; 1716 $1.160,09) |
| DM-COB-008 | ✅ PASS | Checkbox doc 1820 → "Monto total a pagar BSD 1.034.714,62" en Pagos |
| DM-COB-009 | ✅ PASS | Modal métodos: Efectivo·Depósito·Transferencia·Otros·Pago Móvil (sin Cheque) |
| DM-COB-012 | ✅ PASS | Monto parcial 500.000 → Diferencia -534.714,62 **ROJO** (rgb(255,0,0)) |
| DM-COB-014 | ✅ PASS | Tab Total: tabla (Tipo/Nro.Doc/Monto), acordeón, totales (BSD 1.034.714,62 · $1.551,18 · Tasa 667,05) |
| DM-COB-015 | ✅ PASS | "Total General BSD: 1.034.714,62" visible |
| DM-COB-016 | ✅ PASS | Tab Adjuntos: acordeones Imágenes/Archivo(Subir)/Firma(Borrar) |
| DM-COB-018 | ✅ PASS | Guardar → "El Cobro se ha guardado" |
| DM-COB-019 | ✅ PASS | Enviar (con foto workaround) → 2 alertas → "Cobro nro. **24** enviado exitosamente" → **BD-OK** |
| DM-COB-020 | ✅ PASS | Back con cambios → modal 3 opciones: Guardar y salir / Salir sin guardar / Cancelar |
| DM-COB-021 | ✅ PASS | "Salir sin guardar" operativo → vuelve al menú (Guardado se preserva, correcto §4) |
| DM-COB-022 | ✅ PASS | BUSCAR: lista + searchbar; cobro CABELLO "Guardado"; otros "Por aprobar" con Nro Ref |
| DM-COB-024 | ✅ PASS | Reabrir Guardado → editable, "Monto total a pagar BSD 1.034.714,62" persiste (round-trip §9) |
| DM-COB-026 | ✅ PASS | Trash en Guardado → "¿Desea eliminar el Cobro?" [Cancelar/Eliminar] → conteo 4→3 |
| DM-COB-028 | ✅ PASS | ANTICIPO (4 tabs, sin Documentos) CABELLO + Efectivo 50.000,00 → "El Anticipo se ha guardado" (co_type 1) |
| DM-COB-029 | ✅ PASS | RETENCIÓN (4 tabs, sin Pagos) CABELLO + doc 1820 → "La Retención se ha guardado" (co_type 2) |
| DM-COB-033 | ✅ PASS | Selector Moneda cobro habilitado, 2 opciones ($ / BSD), multiCurrency real=**true** |
| DM-COB-034 | ✅ PASS | Moneda documento → BSD: "No hay documentos BSD" (0); → $: 2 docs. Filtra por moneda |
| DM-COB-038 | 🟡 PASS-parcial | Botón "Guardar y salir" presente/funcional en el modal dirty-guard; ruta no ejecutada end-to-end |
| DM-COB-039 | ✅ PASS | Rama B (Guardado): Fecha Tasa recalcula (ver 047). Rama A N/A (enabledManualRate=false) |
| DM-COB-040 | ✅ PASS | Método Efectivo + monto=total → Diferencia 0,00 **AZUL** (rgb(0,0,255)) |
| DM-COB-043 | ✅ PASS | monto<total → rojo; monto=total → azul (cambio de color correcto) |
| DM-COB-036 | 🚫 N/A | IGTF: FARMA seleccionable pero doc IGTF NO sincronizado en device (form "No hay documentos") |
| DM-COB-037 | 🚫 N/A | userCanCollectIva=false → sin botón 25% IVA |
| DM-COB-041 | ⛔ BLOCKED | Detalle de doc expone retención **dynamicRetentions** ("Seleccione Retención": IMPM/ISLR/IVA → Nro.Comp Ret + Fecha Comp Ret + montos); fill+persist no completado en techo de intentos (layout distinto al patrón fijo documentado) |
| DM-COB-042 | ⛔ BLOCKED | Depende de 041 (dynamicRetentions) |
| DM-COB-044 | 🚫 N/A | IGTF sin documento sincronizado (ver 036) |
| DM-COB-045 | 🚫 N/A | IGTF sin documento sincronizado (ver 036) |
| DM-COB-046 | ✅ PASS | Detalle doc 1820: toggle "Pago parcial" → parcial 500.000,00 → Pagos muestra 500.000,00 (no el total); Guardar→reabrir mantiene 500.000,00 (round-trip §9 OK) |
| DM-COB-047 | ✅ PASS | Fecha Tasa 4/7→15/5/2026 → alerta "…recalculará los montos ¿continuar?" → confirmada → tasa **667,05→500,00 BSD** (recálculo confirmado) |

## Registros creados en sistema
| Ref | Tipo | Cliente | Detalle | Estado | BD |
|-----|------|---------|---------|--------|-----|
| **24** | Cobro (co_type 0) | CABELLO COSMETICOS CA (37) | doc 1820, Efectivo, total BSD 1.034.714,62 / $1.551,18 | **Enviado** | **BD-OK** (nube id 24, st_collection=3, docs=1, pagos=1) |
| — | Retención (co_type 2) | CABELLO (37) | doc 1820 (029) | Guardado | BD-SAVED (local; envío manual — adjunto) |
| — | Cobro parcial (co_type 0) | CABELLO (37) | doc 1820, parcial 500.000,00 (046) | Guardado | BD-SAVED (local) |
| — | Anticipo (co_type 1) | CABELLO (37) | Efectivo 50.000,00 (028) | Creado→**Eliminado** en DM-COB-026 | — |

## Verificación BD (nube; local N/A — device sin `sqlite3` para `run-as`)
- **Cobro 24 (DM-COB-019): BD-OK.** Nube `collection` id 24: co_type 0, st_collection 3, nu_amount_total 1.034.714,62, docs 1, pagos 1. `co_collection`=`1784051930619.0` coincide con el payload capturado. Guardado→enviado confirmado.
- **Guardados (029/046): BD-SAVED** — no llegan a la nube (Guardar no envía; envío requiere adjunto manual). Coherente con §10.
- **BD local: N/A** toda la corrida (`run-as: exec failed for sqlite3: No such file or directory`).
- **Payload capturado** (`_payloads.jsonl`): POST `collectionservice/collection` con `hasAttachments:true`, `nuAttachments:2`, detail doc 1820, pago "ef" 1.034.714,62.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Selección de cliente vía `setClientfromSelector` (ng) | universal (builds `window.ng=true`) | El click real en el `<p>` del modal NO disparó la selección en este build. Fiable: buscar (Enter) para poblar `app-cobro-general` → `selectorCliente.clientes`, luego `comp.setClientfromSelector(cli)` en collection **fresca** (`idClient==0`, rama primera-vez → `loadData()`), esperar ~3s + `window.ng.applyChanges`. En collection no-fresca cae en `reset()` y queda inconsistente. |
| Menú de tiles Cobros | universal | `app-cobros-container .munubotones` con `ion-col` textContent COBRO/ANTICIPO/PREPAGO/RETENCIÓN/IGTF/BUSCAR. Tras Guardar/exit, `nuevoCobro()` programático NO re-renderiza; usar click real en el tile. `exitCollectionWithoutSave()` a veces no sale → `clickBack` (img.fechaAtras) es el fallback fiable a HOME. |
| Adjunto: mock webpack Camera falla → fabricar Foto | cliente/build (La Tortuga v6.6.18) | `tomarImg()` usa el módulo `@capacitor/camera` (no `window.Capacitor.Plugins.Camera`) → mock estándar inservible. Workaround: `adjuntoService.fotos.push({format:'jpeg',foto:B64,base64String:B64,...})` + `comp.checkCarousel()` + `comp.onAttachmentChanged()` → foto entra al carrusel → envío real posible. `mock_camara_funciona=false`. |
| ⚠ Crash de app en POST de envío del cobro | cliente/build | Igual que dm-electronica: 1er Enviar cerró/recargó la webview durante el POST (CDP se cae). Recuperación: re-`adb forward tcp:9220 localabstract:webview_devtools_remote_<nuevoPID>` + reinstalar bundle/captura; el cobro quedó **Guardado** (no llegó a nube) y el **reintento desde el Guardado sí completó** (id 24, sin crash). Payload `collectionservice/collection` SÍ se capturó en el reintento exitoso (contradice la nota previa "collection nunca se captura"). |
| Retención por documento = **dynamicRetentions** | cliente (VGs `dynamicRetentions=true`, `userCanAddRetention=true`) | El detalle del documento NO usa los campos fijos Nro.Comp Ret+IVA+ISLR de jerez/ferrenuestro. Usa selector "Seleccione Retención" (opciones IMPM/ISLR/IVA); al elegir IVA aparecen "Nro. Comp Ret" + "Fecha Comp Ret:" + montos. Requiere mapear el layout dinámico (pendiente) → DM-COB-041/042 BLOCKED esta corrida. |
| Selectores app-cobro-general (order) | cliente | 1º ion-select=Empresa "LATINOCOSMETICA C.A." (00001, 1 opción), 2º=Moneda cobro ($/BSD), 3º=Tasa (read-only "667,05 BSD"). Fecha Tasa=`ion-button` con fecha; datetime rango min 2026-04-22→max hoy. |
| Buscador de cliente filtra con Enter | cliente/build | `#clienteSelectModal`: set value del input + `pg.keyboard.press('Enter')` (como dm-electronica). Métodos de pago: Efectivo/Depósito/Transferencia/Otros/Pago Móvil. |

> ✅ consolidado 20260714

## Hallazgos (FAIL)
Ninguno (0 FAIL). Notas: DM-COB-041/042 BLOCKED por variante dynamicRetentions (no defecto). IGTF N/A por sync parcial (doc IGTF de FARMA no en device). Crash de app en POST de envío = riesgo de estabilidad a vigilar (recuperable).

## Estado final: HOME ✅

## Verificación BD (payload ↔ nube · campo-a-campo · Agente BD)

| co_x | Marca | Cabecera | Hijas | Mismatches | Notas |
|------|-------|----------|-------|------------|-------|
| 1784051930619.0 | BD-FIELD-OK | 5/5 OK | docs 1/1 · pagos 1/1 | 0 | co_type=0, método=ef; txComment payload-only (sin columna nube, no mismatch); st_collection=3; nuAttachments=2 |

**Cobro Ref 24 (CABELLO COSMETICOS 37, doc 1820, Efectivo BSD 1.034.714,62): enviado→procesado en nube.** Cabecera 5/5 + 1 doc + 1 pago coinciden. Cero mismatches reales. Nota de calibración: `txComment` sin columna en `collection` (revisar fieldMap).
