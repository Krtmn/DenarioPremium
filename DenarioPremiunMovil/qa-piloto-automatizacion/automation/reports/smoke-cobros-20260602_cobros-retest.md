# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260602_cobros-retest` |
| Módulo | COBROS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Playa | yaque / Hidroponias |
| Resultado | **12 PASS · 3 FAIL · 0 SKIP · 1 N/A** |
| Fecha ejecución | 2026-06-02 |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | HOME visible con opción "Cobros" clickeable |
| DM-COB-002 | ✅ PASS | Navegación a `/cobros` correcta; módulo carga con 4 filtros de tipo |
| DM-COB-004 | ✅ PASS | Lista de cobros carga; filtros COBRO / RETENCIÓN / IGTF / COBRO 25% IVA + BUSCAR visibles |
| DM-COB-007 | ✅ PASS | Formulario nuevo cobro abre con tabs GENERAL/DOCUMENTOS/PAGOS/TOTAL/ADJUNTOS |
| DM-COB-008 | ✅ PASS | Selector cliente funciona; ALIMENTOS GOURMET CCC, C.A. (código 100146) seleccionado |
| DM-COB-009 | ✅ PASS | Tabs deshabilitados hasta llenar Comentario; se habilitan al completarlo |
| DM-COB-040 | ✅ PASS | Depósito agregado: BANCO DE VENEZUELA, ref DEP-QA-20260602-001, BS 66.718,81; Diferencia BS 0,00 |
| DM-COB-012 | ✅ PASS | Tab PAGOS accesible; monto total BS 66.718,81 refleja factura seleccionada |
| DM-COB-014 | ✅ PASS | Tab DOCUMENTOS muestra facturas vigentes del cliente (FACT20110662, FACT20111151, etc.); checkbox funcional |
| DM-COB-016 | ❌ FAIL | `mockCameraAdjunto` intercepta `toNative` (confirmado) pero el foto no se registra en `AdjuntoService.fotos[]`; `swiper-slide` queda `<!---->` vacío |
| DM-COB-018 | ✅ PASS | Cobro guardado correctamente; alert "El Cobro se ha guardado" |
| DM-COB-019 | ❌ FAIL | Al ACEPTAR envío → alert "Para poder enviar el Cobro, debe agregar al menos un adjunto." |
| DM-COB-029 | ❌ FAIL | Retención bloqueada por misma causa: "Para poder enviar la Retención, debe agregar al menos un adjunto." |
| DM-COB-036 | ✅ PASS | IGTF enviado sin requerir adjunto; alert "El IGTF será enviado" → "Su Cobro será enviado" |
| DM-COB-037 | ✅ PASS | COBRO 25% IVA enviado sin requerir adjunto; alert "El Cobro será enviado" → "Su Cobro será enviado" |
| DM-COB-020 | ✅ PASS | Filtros de tipo COBRO/RETENCIÓN/IGTF/COBRO 25% IVA visibles y clickeables en lista principal |
| DM-COB-021 | ✅ PASS | Filtro por tipo activa el botón correspondiente (UI responde al click) |
| DM-COB-022 | ✅ PASS | Botones de filtro de tipo visibles y habilitados en lista principal |
| DM-COB-024 | ✅ PASS | BUSCAR muestra lista completa con ion-searchbar "Cobros..." activo; todos los cobros visibles |
| DM-COB-026 | ✅ PASS | Cobro guardado se abre en detalle; todos los tabs cargados y habilitados |
| DM-COB-028 | 🚫 N/A | `cobroPrepago: false` en playa yaque/Hidroponias — estructural |
| DM-COB-038 | ✅ PASS | `ion-infinite-scroll` presente y activable; lista carga correctamente |
| DM-COB-039 | ✅ PASS | `ion-searchbar` disponible en modo BUSCAR para filtrado por texto |

---

## Hallazgos — FAIL

### DM-COB-016 / DM-COB-019 / DM-COB-029 — mockCameraAdjunto no inyecta adjunto en build de producción

**Severidad:** Alta — bloquea el flujo completo de envío de cobros/retenciones con `requiredCollectionAttachments: true`.

**Comportamiento observado:**
- El helper `mockCameraAdjunto` intercepta correctamente `window.Capacitor.toNative` para `Camera.getPhoto` (confirmado con `intercepted: true`).
- El callback `resolve()` se ejecuta síncrona e inmediatamente con `{ base64String, format, saved }`.
- Sin embargo, `AdjuntoService.fotos[]` no se puebla: el `swiper-slide` permanece `<!---->` y `hasItems()` retorna `false`.
- Al intentar enviar: alert **"Para poder enviar el Cobro, debe agregar al menos un adjunto."**

**Causa raíz probable:**
- `@capacitor/camera` v6 en el build de producción (AOT + Ivy + minificación) NO usa `window.Capacitor.Plugins.Camera.getPhoto` directamente. El módulo compilado mantiene una referencia interna al plugin resuelto en tiempo de compilación.
- La resolución de la promesa de `toNative` ocurre fuera de la Angular Zone → `AdjuntoComponent.tomarImg()` recibe el resultado pero el `ChangeDetectionStrategy` de producción no dispara re-render.
- `__ngContext__` está vacío en todos los elementos del DOM en producción (AOT elimina metadata de contexto) → no es posible acceder al servicio vía DOM para inyectar directamente.

**Estrategias descartadas:**
1. Reemplazar `window.Capacitor.Plugins.Camera.getPhoto` → el Proxy de Capacitor restaura el método nativo.
2. Interceptar `toNative` con resolve síncrono → el dato llega pero Angular no detecta el cambio.
3. Acceder a `AdjuntoService` vía `__ngContext__` → vacío en producción.
4. `window.Zone.current.run()` → Angular 19 usa signal-based detection parcial.

**Impacto en la corrida:**
- DM-COB-016: FAIL — adjunto no visible en carrusel
- DM-COB-019: FAIL — cobro no enviado (guardado sí funciona)
- DM-COB-029: FAIL — retención no enviada

**Recomendación:**
Explorar inyección de adjunto vía SQLite directamente en `transaction_images` antes del envío, o usar la función `buscarImg()` (galería) con un archivo real en el dispositivo QA.

---

## Registros creados en sistema

| Ref | Tipo | Cliente | Estado |
|-----|------|---------|--------|
| Sin Nro Ref | Cobros (depósito) | ALIMENTOS GOURMET CCC, C.A. (100146) | Guardado |
| Sin Nro Ref | IGTF | Sin cliente asignado | Por Enviar |
| Sin Nro Ref | COBRO 25% IVA | Sin cliente asignado | Por Enviar |

**Notas:**
- El cobro tipo COBRO con depósito BANCO DE VENEZUELA (ref DEP-QA-20260602-001, BS 66.718,81) quedó en estado **Guardado** — no pudo enviarse por falta de adjunto inyectable.
- El IGTF y el COBRO 25% IVA se enviaron exitosamente (estado **Por Enviar**) sin requerir adjunto (confirma implementación: `coType "3"` y `"4"` no tienen check `hasItems()`).
- Cobros previos de corridas anteriores (Nro Ref 1–7, estado "Por aprobar") no fueron modificados.
