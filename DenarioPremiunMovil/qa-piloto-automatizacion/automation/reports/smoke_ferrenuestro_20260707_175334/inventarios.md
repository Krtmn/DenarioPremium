# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260707_175334_smoke-completo` |
| Módulo | INVENTARIOS |
| Dispositivo | Android real (Infinix HOT 60i / X6728) vía CDP `:9220` |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | ferrenuestro (Isla Coche — `denarioislacoche.ddns.net:8081`) |
| Cliente de prueba | TORNICAGUA, C.A. (código 121793873 · id 504) |
| Resultado | **16 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## ⚠ Hallazgo estructural principal — divergencia config↔UI + no-persistencia

El YAML/dump marca **`clientStock=false` + `requireClientStock=false`** → se esperaba módulo **N/A ESTRUCTURAL** (deshabilitado). **NO fue el caso:**

1. El **módulo "Inventarios" SÍ aparece** en HOME (entre los 16 módulos) y es **100% operable** por UI: formulario 4 tabs, selección de cliente, captura de productos (cantidad+lote+fecha), Guardar y Enviar — todo funciona sin bloqueo. Divergencia UI-vs-config **igual a piercar** (`expirationBatch`) y **jerez** (`suggestedOrderByDispatchAndReturn`).
2. **PERO el inventario "enviado" NO llega a la nube.** Tras Guardar→Enviar (UI confirmó "El Inventario será enviado"), el registro queda en BUSCAR con **Estatus "Por enviar" / Nro.Ref: 0**, y la tabla nube `client_stock` **permanece en 0** tras poll de varios minutos (baseline pre-corrida = 0).
   → Consistente con el patrón **jerez no-persistencia** extendido a inventarios: `clientStock=false` actúa como **gate efectivo del servidor** — el registro se guarda local pero nunca sincroniza. La habilitación del módulo en la UI es una **divergencia de configuración a verificar con desarrollo** (¿debe ocultarse el módulo cuando `clientStock=false`, o debe persistir el servidor?).

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Home Inventarios con botones INVENTARIO y BUSCAR |
| DM-INV-002 | ✅ PASS | 4 tabs GENERAL/INVENTARIO/RESUMEN/ADJUNTOS; Cliente vacío |
| DM-INV-004 | ✅ PASS | TORNICAGUA seleccionado → 4 tabs habilitadas; sin alerta de sucursal |
| DM-INV-008 | ✅ PASS | Tab Inventario: familias (AGRICOLA 319…CONSTRUCCION 543); BOMBILLOS → 50 productos con captura |
| DM-INV-010 | ✅ PASS | Modal `inventory-type-stocks-modal` abre (Pointer+Mouse); "Exhibición - 1" tipo fijo |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard`: Cantidad=5, Lote=QA0707, Fecha=HOY (`expDate0`) reflejados |
| DM-INV-012 | ✅ PASS | checkmark-outline → modal cierra, producto marcado INVENTARIADO, sin error |
| DM-INV-016 | ✅ PASS | Tab Resumen: tabla `151707 REFLECTOR 200W… 5 UND` en Exhibición |
| DM-INV-017 | ✅ PASS* | Botón "PEDIDO SUGERIDO" (`botonAddAmarillo`) presente pese a `suggestedOrderByDispatchAndReturn=false` → *divergencia (ver Hallazgos). Modal `inventario-sugerido-modal` visible; cerrado con `dismiss('cancel')` (NO se creó pedido) |
| DM-INV-020 | ✅ PASS | Modal sugerido: "Días desde último Inventario: 1 / Días para siguiente Inventario: 1" |
| DM-INV-021 | ✅ PASS | Confirm "¿Desea guardar?" → "Inventario guardado con éxito" |
| DM-INV-022 | ✅ PASS (UI) | 2 alertas "¿Desea enviar?" → "El Inventario será enviado"; navega a home inventarios. **BD-SAVED** (no persiste en nube — ver Hallazgo) |
| DM-INV-023 | ✅ PASS | BUSCAR: item "Nro. Ref.: 0 · TORNICAGUA · Estatus: Por enviar · 07/07/2026" |
| DM-INV-025 | ✅ PASS | Searchbar filtra realtime: "TORNICAGUA"→1, "ZZZZNOPE"→0, vacío→1 |
| DM-INV-026 | ✅ PASS | Reapertura abre en tab **GENERAL** (defecto conocido v6.6.14, no FAIL); cliente cargado; round-trip §9: Resumen conserva REFLECTOR 200W 5 UND |
| DM-INV-028 | ✅ PASS | Trash `ion-button[color="danger"]` solo en item **Guardado** (creado 2º inventario para probar) → borrado directo sin confirmación: "¡EL Inventario se borro con exito!" → desaparece de lista |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Ref 0 (inv #1) | TORNICAGUA — REFLECTOR 200W+PANEL SOLAR (5 UND, Lote QA0707) | **Por enviar** (Guardar+Enviar UI; NO sincronizó a nube — BD-SAVED) |
| Ref 0 (inv #2) | TORNICAGUA — BOMBILLOS (3 UND, Lote QA0707B) | **Borrado** (creado solo-Guardado para DM-INV-028; eliminado con trash) |

## Verificación BD

| Chequeo | Resultado | Marca |
|---------|-----------|-------|
| Baseline nube `client_stock` (pre-corrida) | 0 filas | — |
| Nube `client_stock` tras Enviar (poll ~30s + reintentos varios min) | **0 filas** (sin cambio) | **BD-SAVED** |
| Local SQLite `client_stocks` / `pending_transactions` | `sqlite3` no disponible en el device (`run-as: exec failed for sqlite3`) | **BD-N/A** (blindaje §10 — no tumba el smoke) |
| Correlación Ref↔`id_client_stock` | UI muestra Ref 0 (nunca asignó id de servidor) | N/A |

**Conclusión guardado→enviado:** el inventario se guarda localmente pero **NO se envía a la nube** pese a que la UI declara "El Inventario será enviado". Estatus persistente = "Por enviar", Ref 0, `client_stock` nube = 0. → **`clientStock=false` es gate de servidor efectivo**; la habilitación del módulo en UI es divergencia de config. Captura de payload: 0 payloads clientStock interceptados (gap conocido + registro no despachado a nube).

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Modal de cliente en Inventarios **requiere click en `ion-icon[name="search-circle-sharp"]`** para ejecutar el filtro | # candidato universal (confirmar otras playas) | El input `placeholder="Clientes..."` NO filtra en tiempo real; escribir texto y luego clickear el ícono lupa dispara la búsqueda. Selección por `<p>` del nombre habilita las 4 tabs |
| ferrenuestro: Tab Inventario con **sub-segmentos UBICACIÓN (EXHIBICIÓN/DEPÓSITO) + FILTRO (TODOS/INVENTARIADOS)** + input `placeholder="Búsqueda de productos"` | cliente ferrenuestro | Familias con conteo (AGRICOLA 319…); click en familia navega a su lista de productos filtrada por ubicación; familia sin stock de esa ubicación muestra "No hay productos disponibles" (ej. DESCUENTOS VARIOS) |
| ferrenuestro: `inventory-type-stocks-modal` tipo fijo "Exhibición - 1" SIN segmento, PERO con inputs por placeholder ("Ingrese cantidad" number / "Ingrese lote" text) + `ion-datetime id=expDate0` default HOY; header icons close/checkmark/trash/add | cliente ferrenuestro | Igual a jerez (placeholders + tipo fijo). `expirationBatch=TRUE` confirmado en UI |
| **`clientStock=false` NO oculta el módulo en ferrenuestro** — módulo operable en UI pero registro no persiste en nube (queda "Por enviar", Ref 0) | cliente ferrenuestro (patrón jerez no-persistencia) | Divergencia config↔UI. Actualizar YAML: `inventarios.aplica` = true-en-UI / false-en-persistencia; VERIFICAR con desarrollo |
| Botón "PEDIDO SUGERIDO" (`botonAddAmarillo`) presente pese a `suggestedOrderByDispatchAndReturn=false` | cliente ferrenuestro (misma divergencia que jerez) | Modal `inventario-sugerido-modal` funcional; VERIFICAR VG con desarrollo antes de cambiarla |

> ✅ consolidado 2026-07-07 → modal-cliente-search-icon, tab-inventario-sub-segmentos, clientStock-no-oculta (persistió, sync diferida), pedido-sugerido-divergencia en `module-selectors/inventarios.md` Notas por cliente; tipo-fijo-Exhibición con tag en Inputs modal captura; datos + `inventarios.aplica=true` en `ferrenuestro.yaml modules.inventarios`.

## Hallazgos

**No hay FAIL de aplicación.** Divergencias de configuración a elevar a desarrollo (no re-marcar sin cambio de código/config):

1. **Módulo Inventarios habilitado con `clientStock=false`** — el módulo aparece y es operable end-to-end en UI, pero el inventario **no persiste en la nube** (`client_stock`=0, estatus "Por enviar" permanente, Ref 0). Decisión de dev requerida: ocultar el módulo cuando `clientStock=false`, o habilitar la persistencia servidor. (Patrón jerez no-persistencia extendido a inventarios.)
2. **`suggestedOrderByDispatchAndReturn=false` pero botón "Pedido Sugerido" activo en UI** — misma divergencia UI-vs-config observada en jerez/piercar. Verificar con desarrollo.
3. **DM-INV-026 defecto conocido confirmado** (v6.6.14): reapertura abre en tab General en vez de Inventario. No es FAIL. El round-trip §9 (dato capturado conservado) sí pasó.

## ⚠ Corrección post-corrida — SÍ persistió (sync diferida)

El diff final de baseline (cierre de corrida) confirma que el registro marcado "Por Enviar"/BD-SAVED **SÍ llegó a la nube**: `client_stock` id=101 (verificado como nuestro, id_client 504 TORNICAGUA / co_* coincidente con el payload). La marca BD-SAVED durante la corrida se debió a que la **sync es asíncrona/diferida** y la fila apareció DESPUÉS de la ventana de poll (~10s–3min). No es no-persistencia de endpoint. Ver `consolidado.md` §"Verificación BD".
