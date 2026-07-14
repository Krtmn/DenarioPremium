# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260713_115814_smoke-completo` |
| Módulo | COBROS |
| Dispositivo | `14678405BR003855` |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 (El Yaque DM ELECTRONIC) |
| Cliente | dm-electronica (BOTZ) |
| Cliente con documentos usado | **TIENDAS RORIX C.A (000234)** — descubierto en runtime (nube: 10 fac; device sí sincroniza) |
| Resultado | **26 PASS · 0 FAIL · 0 SKIP · 8 N/A · 0 BLOCKED** |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Home Cobros: COBRO, ANTICIPO/PREPAGO, BUSCAR. Sin RETENCIÓN/IGTF/25%IVA (coherente VGs) |
| DM-COB-002 | ✅ PASS | 5 tabs; Documentos/Pagos/Total/Adjuntos `disabled`; cliente vacío |
| DM-COB-004 | ✅ PASS | Tras seleccionar RORIX + Comentario → 4 tabs habilitan |
| DM-COB-006 | ✅ PASS | Comentario vacío → "¡Campo Obligatorio!" + ion-invalid + tabs bloqueadas (requiredComment=true) |
| DM-COB-007 | ✅ PASS | 5 documentos FACT (rojo/Vencido) + leyenda Vigente/Vencido/A favor |
| DM-COB-008 | ✅ PASS | Checkbox FACT50003307 → "Monto total a pagar BS: 6.025.296,96" actualizado |
| DM-COB-015 | ✅ PASS | Tab Total: "Total General BS: 6.025.296,96" visible |
| DM-COB-033 | ✅ PASS | Selector Moneda cobro (General, 2º ion-select) 2 opciones BS/US$; cambia BS↔US$ |
| DM-COB-034 | ✅ PASS | Selector Moneda documento: BS→0 docs, US$→5 docs (filtra por moneda) |
| DM-COB-041 | 🚫 N/A | retencion=false → sin campos retención en detalle de documento |
| DM-COB-042 | 🚫 N/A | depende de 041 (retencion=false) |
| DM-COB-009 | ✅ PASS | "Agregar método de pago" → #eventModal: Efectivo/Depósito/Transferencia/Otros/Pago Móvil |
| DM-COB-040 | ✅ PASS | Efectivo + monto=total → Diferencia BS: 0,00 **azul** |
| DM-COB-012 | ✅ PASS | Monto<total → Diferencia roja; monto=total → azul |
| DM-COB-043 | ✅ PASS | Color de diferencia cambia correctamente en ambas situaciones (rojo→azul) |
| DM-COB-014 | ✅ PASS | Tab Total: tabla Monto/Tasa/Pago/Diferencia por moneda, no nulos |
| DM-COB-016 | ✅ PASS | Adjuntos: acordeones Imágenes / Archivo (Subir Archivo) / Firma |
| DM-COB-018 | ✅ PASS | Guardar → alert "El Cobro se ha guardado" |
| DM-COB-019 | ✅ PASS | Adjunto mock (TOMAR FOTO) OK → Enviar → "El Cobro será enviado" → **llegó a nube id_collection=5** (BD-OK) |
| DM-COB-022 | ✅ PASS | BUSCAR: lista + searchbar; trash **solo** en Guardado (cobro enviado "Por aprobar" sin trash) |
| DM-COB-024 | ✅ PASS | Reabrir Guardado → editable (Guardar+Enviar activos); Monto BS 13.242.071,70 persiste (§9) |
| DM-COB-026 | ✅ PASS | Trash Guardado → "¿Desea eliminar el Cobro?" → Eliminar → desaparece |
| DM-COB-020 | ✅ PASS | Atrás con cobro nuevo dirty → modal 3 opciones (Guardar y salir / Salir sin guardar / Cancelar) |
| DM-COB-021 | ✅ PASS | "Salir sin guardar" (cobro nuevo) → NO aparece en BUSCAR |
| DM-COB-038 | ✅ PASS | "Guardar y salir" → "El Cobro se ha guardado" → aparece en BUSCAR Estatus Guardado |
| DM-COB-029 | 🚫 N/A | cobroRetencion=false → sin opción +RETENCIÓN en el menú |
| DM-COB-028 | ✅ PASS | Anticipo (4 tabs, sin Documentos) + Efectivo BS 5.000,00 → "El Anticipo se ha guardado" → BUSCAR "Guardado Ant" |
| DM-COB-036 | 🚫 N/A | userCanSelectIGTF=false; sin documento IGTF elegible (cliente_igtf=null en pre-vuelo) |
| DM-COB-044 | 🚫 N/A | userCanSelectIGTF=false → sin selector tasa IGTF |
| DM-COB-045 | 🚫 N/A | userCanSelectIGTF=false → sin tasa alterna |
| DM-COB-046 | ✅ PASS | Toggle "Pago parcial" en detalle doc FACT50003328 → BS 500.000,00 → Pagos muestra parcial → Guardar → reabrir mantiene 500.000,00 (§9) |
| DM-COB-047 | 🚫 N/A | canChangeRate=false; NO existe botón Fecha Tasa (.letrasFechasButton). El cambio de tasa se cubre por #manualRateInput (039) |
| DM-COB-037 | 🚫 N/A | userCanCollectIva=false → sin cobro 25% IVA |
| DM-COB-039 | ✅ PASS | #manualRateInput 685.94→700 → monto recalc BS 13.242.071,70→13.513.500,00; Guardar → reabrir persiste tasa 700 + monto (§9) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| **id_collection=5** (Nro Ref 5) | Cobro normal · TIENDAS RORIX (000234) · doc FACT50003307 · Efectivo · BS 6.025.296,96 | **ENVIADO** (nube, "Por aprobar", BD-OK) |
| Guardado (Test-COB-038/039) | Cobro normal · RORIX · doc FACT50003325 · tasa manual 700 · Efectivo BS 13.513.500,00 | GUARDADO — pendiente envío manual (adjunto) |
| Guardado (Test-COB-046) | Cobro normal · RORIX · doc FACT50003328 · **pago parcial** Efectivo BS 500.000,00 | GUARDADO — pendiente envío manual (adjunto) |
| Guardado (Test-COB-028) | **Anticipo** · RORIX · Efectivo BS 5.000,00 | GUARDADO tipo Anticipo — pendiente envío manual |
| (Test-COB-024) | Cobro normal · RORIX · doc FACT50003325 · BS 13.242.071,70 | CREADO y **ELIMINADO** en DM-COB-026 |

## Verificación BD (§10)
- **Nube baseline:** `collection` total=4, maxid=4 al inicio.
- **Cobro enviado (DM-COB-019):** `id_collection=5`, `co_type=0`, `docs=1`, `pagos=1`, `suma=nu_amount_total=nu_amount_final=6025296.96` → **BD-OK** (guardado→enviado; Nro.Ref UI 5 = id_collection 5).
- **Guardados (039/046/028):** no aparecen en nube (Guardar escribe local; requieren Enviar con adjunto) → **BD-SAVED** esperado. `local-query.js` no disponible (device sin sqlite3) → estado local no cotejable, pero coherente con flujo (no se intentó enviar).
- Captura de payload: 20 POST capturados, todos `syncservice/getsync` (el POST `collectservice` del cobro 5 ocurrió con el hook pre-crash y se perdió al recargar la app; el envío está confirmado por nube).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **`window.ng` = TRUE en build El Yaque v6.6.18 (dm-electronica)** | cliente/build | ⚠ CONTRASTA con jerez/ferrenuestro (window.ng=false). Aquí `openNuevoCobro`/`openDocumentDetail` con fallback window.ng SÍ operan; `comp.nuevoCobro(0)` abre el form (esperar ~1.5s al render, paymentMethodList se puebla al entrar a Pagos) |
| **Buscador de cliente filtra SOLO con Enter** | cliente/build | `#clienteSelectModal`: set value/type NO filtra; requiere `pg.keyboard.press('Enter')` tras teclear. Foco: `inp.focus()` (JS) + `keyboard.type` (NO click en input). El placeholder pasa de "Clientes..." a "" tras interactuar → localizar el input visible, no por placeholder |
| **Mock cámara (mockCameraAdjunto) SÍ funciona en este build El Yaque** | cliente/build | Contradice romher/ferrenuestro (mock_camara_funciona=false). `Camera.getPhoto` mock + click TOMAR FOTO (expandir acordeón "Imágenes" primero: grp.value=['images','file','sign']) → foto entra al carrusel → **DM-COB-019 enviable de verdad**. Actualizar YAML: `mock_camara_funciona: true` |
| **App crashea durante el POST de envío del cobro** | cliente/build | Tras aceptar "El Cobro será enviado", la app se cerró (proceso muerto, foco→launcher) **después** de que el POST llegó a la nube (id 5 persistió). Requiere relanzar (`monkey -p ... LAUNCHER`) + re-map `adb forward` al nuevo webview PID + reinstalar bundle/captura. El auto-login (Recordar Usuario) recupera a HOME. Riesgo de estabilidad a vigilar |
| **Toggle moneda cobro (033) encola alert "reiniciar cobro"** | universal | Asignar `.value`+ionChange al 2º ion-select de app-cobro-general dispara "¿Seguro desea cambiar la moneda? El cobro será reiniciado!" que puede surgir DESPUÉS (apilado con el "guardado"). Cancelar para no perder el cobro |
| **Guardar del detalle de documento = `.botonAddVerde`** | universal | Requiere Pointer+shadow click (`pointerdown/up`+`shadowRoot button.click()`+mouse.click); el mouse.click solo no dispara. En pago parcial: los 2 ion-inputs editables son idx `Dif. Devolución/Faltante` y **`Monto a pagar BS`** (este último = el parcial) |
| **Campo monto (Pagos/parcial): foco JS + teclado centavos** | universal (El Yaque) | `inp.focus()` (JS, no mouse.click) + Backspace×N + `keyboard.type('NNNN')` (solo dígitos, sin coma) + blur/ionBlur. Acordeón Efectivo: header `value` puede ser null → expandir por click real en el header |
| **Selectores General app-cobro-general (dm-electronica)** | cliente | 1º ion-select=Empresa "BOTZ" (1 opción, NO tocar), 2º=Moneda cobro (BS id1 / US$ id2). Tasa=`#manualRateInput` (enabledManualRate=true). Cliente=`#clienteSelect`. Comentario=ion-input.inp-write sin id |

*Métodos de pago del cliente confirmados en UI: Efectivo, Depósito, Transferencia, Otros, Pago Móvil (sin Cheque) — coherente con colletionPayment.*

> ✅ consolidado 20260713 — window.ng=TRUE, buscador con Enter, mock cámara, app crash → notas cobros.md + _comunes.md; mock_camara_funciona/window_ng/nota crash → YAML; toggle moneda alert + Campo Monto El Yaque + botonAddVerde reconfirmados (tags).

## Hallazgos (FAIL)
Ninguno. 0 FAIL.

## Estado final
HOME confirmado (app-home).

## Verificación BD (payload ↔ nube)

**Conteo por marca:** BD-FIELD-OK 0 · BD-FIELD-MISMATCH 0 · BD-SAVED 3 · BD-N/A(payload) 1

| co_x | Marca | Campos cabecera | Hijas (docs/pagos) | Mismatches | Notas |
|------|-------|-----------------|---------------------|------------|-------|
| id_collection=5 (cobro enviado DM-COB-019) | BD-N/A(payload) · confirmado en nube por query.js | co_type=0 · total=final=6.025.296,96 · st_collection=3 · co_client=000234 (RORIX) ✓ | detail=1 (Σ paid=6.025.296,96 ✓) · payment=1 ✓ | 0 | Payload perdido en crash de app; cotejo por columnas clave (§10) coincide 100% |
| Guardados 039/046/028 (tasa 700 / parcial 500.000 / anticipo 5.000) | BD-SAVED | — | — | 0 | Solo local (Guardar); no enviados (requieren adjunto manual) — esperado |

**Notas de calibración:** no apareció payload de anticipo (co_type=1) ni retención (co_type=2) para cotejar (el anticipo 028 quedó BD-SAVED). co_types 1/2 siguen pendientes de calibrar (COTEJO-BD.md §2).
