# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260610_180320_smoke-completo` |
| Módulo | COBROS |
| Dispositivo | Infinix X6728 (Android 15) — CDP `127.0.0.1:9220` |
| App | `com.kiberno.denarioPremiumPro` |
| Cliente / Playa | insumar (INSUMAR DISTRIBUIDOR · Isla Coche) |
| Cliente test | ADRIAN ARLET BASTARDO ALONZO (cód. 2738) |
| Resultado | **21 PASS · 0 FAIL · 1 SKIP · 10 N/A** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Home cobros: COBRO, BUSCAR + ANTICIPO/PREPAGO, RETENCIÓN, IGTF, COBRO 25% IVA (todas las VGs activas) |
| DM-COB-002 | ✅ PASS | COBRO → 5 tabs; General habilitado, Documentos/Pagos/Total/Adjuntos `disabled`; Cliente vacío |
| DM-COB-004 | ✅ PASS | Cliente 2738 seleccionado → 4 tabs restantes habilitan; sin alerta de deuda en cobro |
| DM-COB-006 | 🚫 N/A | `requiredComment=false`: comentario vacío queda `ng-valid`, sin borde de error |
| DM-COB-007 | 🚫 N/A | Sin documentos pendientes para 2738 en cobro normal (BS y US$ → "No hay documentos") |
| DM-COB-008 | 🚫 N/A | Sin documentos → sin checkbox que marcar en cobro normal |
| DM-COB-015 | ✅ PASS | Tab Total: línea "Total General BS: 0,00" visible al final |
| DM-COB-033 | ✅ PASS | Selector moneda cobro habilitado, 2 opciones (BS idCurrency=1 / US$ idCurrency=2) |
| DM-COB-034 | ✅ PASS | Selector Moneda Documento (3 opc.) recarga la lista al cambiar (BS→US$: etiqueta y contenido cambian) |
| DM-COB-009 | ✅ PASS | `#eventModal` métodos: Efectivo / Depósito / Transferencia / Pago Móvil |
| DM-COB-040 | ✅ PASS | Depósito + BANESCO RAEL (`#bankPickerModal`) + nro + monto=total → Diferencia **azul** 0,00 |
| DM-COB-012 | ✅ PASS | Cobro IGTF $ (total 3,13): monto 0 → Diferencia **roja** -3,13; monto 3,13 → **azul** 0,00 |
| DM-COB-043 | ✅ PASS | Mismo escenario doc+pago: rojo cuando insuficiente, azul cuando cubre; transición correcta |
| DM-COB-014 | ✅ PASS | Tab Total con tabla (Monto a pagar BS/US$, Tasa, Pago, Diferencia) + acordeón por método |
| DM-COB-016 | ✅ PASS | Tab Adjuntos: acordeones Imágenes / Archivo / Firma (userCanUploadFiles + firma) |
| DM-COB-018 | ✅ PASS | Guardar → "Denario Cobros — El Cobro se ha guardado" |
| DM-COB-019 | ✅ PASS | Envío exitoso vía cobro IGTF $ (`requiredCollectionAttachments=false`): "IGTF nro. 55 enviado exitosamente", sin 2ª alerta de adjunto |
| DM-COB-022 | ✅ PASS | BUSCAR (`app-cobros-list`) + searchbar; trash (`ion-button[color=danger]`) solo en Guardado |
| DM-COB-024 | ✅ PASS | Reabrir Guardado: editable; cliente 2738 y método Depósito/BANESCO RAEL persisten (round-trip) |
| DM-COB-026 | ✅ PASS | Trash en Guardado → "¿Desea eliminar el Cobro? CANCELAR/ELIMINAR" → desaparece de la lista |
| DM-COB-020 | ✅ PASS | Cobro nuevo con cambios + atrás (CDP) → modal **GUARDAR Y SALIR / SALIR SIN GUARDAR / CANCELAR** |
| DM-COB-021 | ✅ PASS | "Salir sin guardar" en cobro nuevo → no aparece en BUSCAR (0 Guardado 2738) |
| DM-COB-038 | ✅ PASS | "Guardar y salir" → "El Cobro se ha guardado" → aparece en BUSCAR como Guardado |
| DM-COB-029 | ✅ PASS (Guardado) · ⏭ SKIP envío | RETENCIÓN: 4 tabs (sin Pagos), doc US$ → "La Retención se ha guardado"; envío requiere adjunto → SKIP |
| DM-COB-028 | ✅ PASS | ANTICIPO/PREPAGO: 4 tabs (General/Pagos/Total/Adjuntos, **sin Documentos**); cliente 2738 elegible, tabs habilitan |
| DM-COB-036 | ✅ PASS | IGTF $: Guardar "El IGTF se ha guardado" + Enviar "IGTF nro. 55 enviado exitosamente" |
| DM-COB-044 | ✅ PASS | IGTF $ default → Guardar → reabrir: selector/línea IGTF **idéntico** (US$ 0,09 · BS 46,62 · col. doc 0,09). Sin mutación. |
| DM-COB-045 | 🚫 N/A | No existe selector de tasa IGTF con alternas en el build insumar: tasa única auto (~3%), 1 sola opción |
| DM-COB-037 | 🚫 N/A | COBRO 25% IVA: modal cliente "No hay clientes disponibles" (sin elegibles) |
| DM-COB-039 | 🚫 N/A | `enabledManualRate=false`: `#manualRateInput` no existe |
| DM-COB-041 | 🚫 N/A | `retencion=false` (insumar): detalle de documento NO tiene campos Retención IVA/ISLR/Comprobante en cobro |
| DM-COB-042 | 🚫 N/A | Depende de 041 (N/A) |

## Resultado explícito DM-COB-044 / 045 (oráculo IGTF round-trip)

- **Tasas IGTF observadas:** rate único auto ≈ **3%** → IGTF **US$ 0,09 / BS 46,62** sobre saldo doc 3,04 US$ (total a pagar 3,13 US$). El build de insumar **no expone selector de tasa IGTF**; la tasa la fija el sistema por documento, sin opción de cambio en la UI.
- **DM-COB-044 (default conservado): ✅ PASS.** Guardado → reabierto desde BUSCAR: selector/línea IGTF del Tab Total = **0,09 US$ / 46,62 BS** y columna IGTF del documento = **0,09**, idénticos a lo guardado. Sin mutación silenciosa. Confirma el fix del sabor "default conservado".
- **DM-COB-045 (cambio a alterna): 🚫 N/A.** No hay alterna que elegir — un solo valor de tasa, sin selector. Por regla del smoke (1 sola tasa → N/A). El flag `igtf_persistencia_bug2_fixed=true` no se pudo verificar empíricamente por ausencia de selector con opciones; no hubo regresión observable.

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| IGTF **Nro. 55** | Cobro IGTF $ cliente 2738, doc IGTF-2026-05-21, total US$ 3,13 (Efectivo), IGTF US$ 0,09 | **Enviado** ("enviado exitosamente") |
| (sin Nro / local) | RETENCIÓN cliente 2738, doc US$ FACT20086729 (saldo 101,46 US$) | **Guardado — pendiente envío manual por QA** (envío requiere adjunto) |
| — | Cobros de prueba DM-COB-018/038 (Depósito BANESCO RAEL) | Creados y **eliminados** en DM-COB-026/038 (limpieza) |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `require()` NO disponible en `browser_run_code_unsafe` de esta sesión | universal | Inlinear helpers verbatim (RUNTIME §1 opción C); `connectOverCDP` + `contexts()[0].pages()[0]` directo |
| Modal métodos pago se abre con `m.present()` (mouse.click en "Agregar método" a veces no dispara) | universal COBROS | `document.querySelector('#eventModal').present()` |
| `#eventModal` es **reutilizado** por el modal "Detalle Del Documento" Y por el picker de métodos | universal COBROS | Pueden coexistir 2 `#eventModal`; filtrar por contenido (`/Efectivo/` vs `/Detalle Del Documento/`) y `dismiss()` el sobrante |
| Diferencia: leaf `span` con `style="color:red\|blue"` (`Diferencia US$: X`) | universal COBROS | Buscar elemento cuyo texto empieza `^Diferencia` y leer `style`/`getComputedStyle` |
| IGTF (insumar): tasa auto por documento, **sin selector de tasa** en la UI | cliente insumar | IGTF US$ 0,09 / BS 46,62 (~3%) auto; DM-COB-045 N/A; persiste round-trip (DM-COB-044 PASS) |
| Documentos solo aparecen al poner **Moneda Documento = US$** para 2738 | cliente insumar | En BS la lista está vacía; los docs del cliente son en US$ (IGTF/FACT) |
| Detalle de documento: SIN campos Retención IVA/ISLR/Comprobante → `retencion=false` | cliente insumar | Resuelve TBD del perfil: `vgs.retencion=false`, `sizeRetention` N/A |
| Dirty-guard back vía CDP (`img.fechaAtras` + mouse.click) **SÍ** muestra `#alertSaveOrExit` | cliente insumar (confirma) | "GUARDAR Y SALIR / SALIR SIN GUARDAR / CANCELAR" — 020/021/038 NO son SKIP en insumar (≠ globalmp) |
| Acordeón Efectivo/Depósito viene `accordion-collapsed`; header ion-item para expandir | cliente insumar (confirma) | Click header → inputs Nro. Recibo/Plantilla + Monto + Fecha |
| Lista BUSCAR: click intermitente (a veces requiere 2º intento Pointer+Mouse) | universal COBROS | Reintentar si `app-cobros-list` no visible |

> ✅ consolidado 2026-06-10

## Notas de actualización de perfil (insumar.yaml)

- `vgs.retencion`: TBD → **false** (sin campos retención por documento en cobro).
- `vgs.sizeRetention` / `formatRetention`: N/A (no aplican, retencion=false).
- `cobros.igtf_tasa_default`: ~3% (IGTF US$ 0,09 / BS 46,62 sobre base 3,04). `igtf_tasa_alterna`: N/A (sin selector).
- `cobros.moneda_cobro`: documentos del cliente en **US$** (la lista BS está vacía).
- DM-COB-028 (ANTICIPO/PREPAGO): cliente 2738 **SÍ elegible** (quitar del `smoke_na_estructural`).
- DM-COB-037 (25% IVA): sigue **N/A** ("No hay clientes disponibles").
