# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260609_132051_smoke-completo` |
| Módulo | COBROS |
| Cliente / Playa | insumar — INSUMAR DISTRIBUIDOR (Isla Coche) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Conexión | Playwright MCP + CDP `http://127.0.0.1:9220` |
| Cliente test | ADRIAN ARLET BASTARDO ALONZO (Cód. 2738) — Saldo BS 54.126,82 / US$ 104,50 |
| Estado inicial / final | HOME / HOME ✅ |
| Resultado | **15 PASS · 0 FAIL · 3 SKIP · 12 N/A** (30 casos) |

## VGs confirmadas en esta corrida

| VG | Valor | Señal en UI |
|----|-------|-------------|
| requiredCollectionAttachments | false | Guardar/Enviar sin exigir adjunto en cobro normal |
| requiredComment | **false** (resuelto TBD) | campo Comentario `ng-valid` vacío; tabs habilitan sin comentario |
| multiCurrency | true | selectores Moneda cobro y Moneda documento con BS + US$ |
| cobroRetencion | true | botón RETENCIÓN visible; form 4 tabs sin Pagos |
| retencion | **true** (resuelto TBD) | detalle de doc en flujo RETENCIÓN muestra Monto IVA / Monto ISLR / Monto total retenido BS |
| userCanSelectIGTF | true | botón IGTF; form con selects empresa/moneda/tasa + doc IGTF elegible |
| userCanCollectIva | true (botón) | botón COBRO 25% IVA visible, pero **sin clientes elegibles** |
| cobroPrepago | true | botón ANTICIPO/PREPAGO; **cliente test SÍ elegible** en esta sesión |
| enabledManualRate | false | `#manualRateInput` inexistente |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | /cobros con 6 botones: COBRO, BUSCAR, RETENCIÓN, IGTF, COBRO 25% IVA, ANTICIPO/PREPAGO |
| DM-COB-002 | ✅ PASS | COBRO → 5 tabs; solo General activo, Documentos/Pagos/Total/Adjuntos `disabled`; Cliente vacío |
| DM-COB-004 | ✅ PASS | cliente 2738 seleccionado (modal `#clienteSelectModal.present()`); las 4 tabs habilitan |
| DM-COB-006 | 🚫 N/A | `requiredComment=false`: campo Comentario `ng-valid` vacío, navegación a otra tab sin error |
| DM-COB-007 | 🚫 N/A | Tab Documentos vacío para cliente test en BS y US$ (sin facturas pendientes en cobro normal) |
| DM-COB-008 | 🚫 N/A | sin documentos → no hay checkbox que marcar en cobro normal |
| DM-COB-015 | ✅ PASS | Tab Total muestra "Total General BS: 0,00" (presente con moneda; 0 por ausencia de docs) |
| DM-COB-033 | ✅ PASS | selector Moneda del cobro (Tab General) habilitado, 2 opciones BS/US$, valor BS |
| DM-COB-034 | 🚫 N/A | selector Moneda Documento funcional (2 opciones) pero lista vacía en ambas monedas → sin datos para filtrar |
| DM-COB-041 | 🚫 N/A | retención por detalle de documento en **cobro normal** no observable: cobro normal sin documentos |
| DM-COB-042 | 🚫 N/A | encadena 041 (N/A) |
| DM-COB-009 | ✅ PASS | Tab Pagos → "Agregar método de pago" abre `#eventModal` con 4 métodos (Efectivo/Depósito/Transferencia/Pago Móvil) |
| DM-COB-040 | 🚫 N/A | método Depósito se agrega y diferencia se calcula, pero `#bankPickerModal` muestra "No hay resultados" (catálogo de bancos vacío esta sesión) y sin doc no hay monto a cubrir |
| DM-COB-012 | 🚫 N/A | sin documento cobrable el total es 0; diferencia nace azul 0,00 — no se puede inducir estado rojo (insuficiente) |
| DM-COB-043 | 🚫 N/A | misma causa que 012/040: sin documento con saldo no hay transición rojo→azul observable |
| DM-COB-014 | ✅ PASS | Tab Total con tabla: Total Depósitos BS/US$, Total General, Monto total a Pagar, Pago, Diferencia, Tasa US$ 517,96 |
| DM-COB-016 | ✅ PASS | Tab Adjuntos: acordeones Imágenes (BUSCAR/TOMAR FOTO), Archivo (Subir Archivo), Firma (Borrar) |
| DM-COB-018 | ✅ PASS | Guardar → "El Cobro se ha guardado"; cobro queda Estatus: Guardado |
| DM-COB-019 | 🚫 N/A | Enviar `disabled` (cobro sin documento/monto válido); no hay cobro normal enviable sin docs elegibles |
| DM-COB-022 | ✅ PASS | BUSCAR → `app-cobros-list`, searchbar, 20 items; cobro Guardado aparece; trash solo en Estatus Guardado |
| DM-COB-024 | ✅ PASS | cobro Guardado se reabre editable; cliente y método Depósito conservados; Guardar activo |
| DM-COB-026 | ✅ PASS | trash en Guardado → alert Cancelar/Eliminar → confirmar → cobro desaparece (5→4 Guardado) |
| DM-COB-020 | ⏭ SKIP | dirty-guard back vía CDP no se dispara con `img.fechaAtras` (requiere hardware back/swipe) — limitación de automatización, no defecto |
| DM-COB-021 | ⏭ SKIP | depende de 020 (modal "Salir sin guardar" no accesible vía CDP) |
| DM-COB-038 | ⏭ SKIP | depende de 020 ("Guardar y salir" no accesible vía CDP) |
| DM-COB-029 | ✅ PASS | RETENCIÓN → form 4 tabs sin Pagos; doc FACT20086729 elegible (saldo BS 52.552,22); Tab Total con Monto IVA/ISLR/total retenido; Guardado OK. **Envío SKIP** (retención exige adjunto propio, patrón confirmado) |
| DM-COB-028 | ✅ PASS | ANTICIPO/PREPAGO → form sin tab Documentos; **cliente test SÍ elegible**; método Efectivo monto 100,00; Guardado OK |
| DM-COB-036 | ✅ PASS | IGTF → form 5 tabs, selects empresa/moneda/tasa, doc IGTF-2026-05-21 elegible (US$ 19); Guardado OK |
| DM-COB-037 | 🚫 N/A | COBRO 25% IVA → form abre, pero modal cliente: "No hay clientes disponibles" (sin elegibles) |
| DM-COB-039 | 🚫 N/A | `enabledManualRate=false`: `#manualRateInput` inexistente |

## Registros creados en sistema

### (a) Cobros enviados al sistema
*(ninguno — el envío de cobro normal requiere documento cobrable, no disponible; retención requiere adjunto manual; IGTF/anticipo se dejaron en Guardado)*

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | — | — |

### (b) Cobros Guardados pendientes de envío manual

| Ref local | Tipo | Cliente | Detalle | Estado |
|-----------|------|---------|---------|--------|
| Guardado #1 | Cobro normal | 2738 ADRIAN | método Depósito (sin banco/monto) | **ELIMINADO en DM-COB-026** |
| Guardado #2 | RETENCIÓN | 2738 ADRIAN | doc FACT20086729 (saldo BS 52.552,22), campos IVA/ISLR | Guardado — pendiente envío manual (requiere adjunto) |
| Guardado #3 | ANTICIPO/PREPAGO | 2738 ADRIAN | Efectivo, monto BS 100,00 | Guardado — pendiente envío manual |
| Guardado #4 | IGTF | 2738 ADRIAN | doc IGTF-2026-05-21 (US$ 19) | Guardado — pendiente envío manual |
| Guardado #5 | Cobro normal (reabierto en 024) | 2738 ADRIAN | reapertura del cobro Depósito guardado | Guardado |

> Nota: quedan **4 cobros Guardado** de ADRIAN 2738 en BUSCAR tras la corrida (uno eliminado en DM-COB-026). Pendientes de envío manual por QA.

## Hallazgos

Sin FAIL. Observaciones:

1. **`requiredComment=false` y `retencion=true` resueltos** (estaban TBD en `insumar.yaml`). Sugerencia: actualizar el perfil — `requiredComment: false`, `retencion: true`.
2. **`cobroPrepago` con cliente elegible:** contrario al N/A estructural previsto en el perfil, el cliente test 2738 SÍ resultó elegible para ANTICIPO/PREPAGO (saldo a favor). DM-COB-028 ejecutado completo. Sugerencia: quitar DM-COB-028 de `smoke_na_estructural`.
3. **`#bankPickerModal` (Depósito) catálogo vacío:** el modal de banco mostró "No hay resultados para la búsqueda" incluso sin filtro. Impidió completar el flujo de depósito con banco real (DM-COB-040). A confirmar si el catálogo de bancos receptores requiere precondición de datos o es un fallo de carga. No marcado FAIL por falta de evidencia de regresión (sesión sin documento cobrable de todos modos).
4. **Cobro normal sin documentos cobrables:** el cliente test no tiene facturas pendientes en el flujo de cobro normal (sí en RETENCIÓN e IGTF, que usan catálogos distintos). Esto bloquea por datos los casos de diferencia rojo/azul (012/040/043) y el envío de cobro normal (019).
5. **Dirty-guard back vía CDP:** confirmado que `img.fechaAtras` por CDP no dispara el modal "Salir sin guardar" en esta sesión (consistente con el patrón globalmp). DM-COB-020/021/038 quedan SKIP estructural por automatización.

---
*Agente QA COBROS · 2026-06-09 · sesión CDP única, app devuelta a HOME.*
