# Smoke Test — Módulo INVENTARIOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_175921_smoke-completo` |
| Módulo | INVENTARIOS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | jerez |
| Resultado | 16 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

Set de datos NUEVO · SIN lectura de BD (estatus solo UI tras Enviar).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Home Inventarios con botones INVENTARIO + BUSCAR (`/inventarios`) |
| DM-INV-002 | ✅ PASS | Formulario con 4 tabs General/Inventario/Resumen/Adjuntos; Cliente vacío |
| DM-INV-004 | ✅ PASS | Cliente "DANIELA HERNANDEZ F.P. (V161051485)" seleccionado → 4 tabs habilitadas |
| DM-INV-008 | ✅ PASS | Tab Inventario: familias con conteo (Plasticos 1, Carbones 136, XCORT 31…) |
| DM-INV-010 | ✅ PASS | Click PLAN-001 (Pointer+Mouse) abre `inventory-type-stocks-modal`; sin popover residual |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard`: Cantidad=5, Lote=LOTE-QA-706, Fecha venc=6 jul 2026 (default HOY) reflejados |
| DM-INV-012 | ✅ PASS | checkmark-outline cierra modal sin error; producto "Inventariado: Exhibición" |
| DM-INV-016 | ✅ PASS | Tab Resumen: "PLAN-001 Agro silotubo… 5 PIEZA" |
| DM-INV-017 | ✅ PASS | Botón "Pedido Sugerido" (`botonAddAmarillo`) activo → modal `inventario-sugerido-modal` con producto + días. ⚠ Divergencia CSV `suggestedOrderByDispatchAndReturn=false` vs UI activa (ver nota) — cerrado con `dismiss(null,'cancel')` sin crear pedido |
| DM-INV-020 | ✅ PASS | En `inventario-sugerido-modal`: "Días desde último Inventario: 1 / Días para siguiente Inventario: 1" |
| DM-INV-021 | ✅ PASS | Guardar → confirm "¿Desea guardar el Inventario?" → "Inventario guardado con éxito" |
| DM-INV-022 | ✅ PASS | Enviar → 2 alertas ("¿Desea enviar…?" + "El Inventario será enviado") → navega a home; Ref 0 transiciona Guardado→"Por enviar" (encolado async). No quedó Guardado |
| DM-INV-023 | ✅ PASS | BUSCAR lista ítems con Nro.Ref/Cliente/Estatus/Fecha |
| DM-INV-025 | ✅ PASS | Searchbar realtime: "DANIELA"→2, "ZZZZ"→0, vacío→2 (filtra cliente/código/ref, no estatus) |
| DM-INV-026 | ✅ PASS | Reabrir Guardado Ref 0: form carga, cliente correcto. Abre en tab **General** (defecto conocido DM-INV-026, no FAIL) |
| DM-INV-028 | ✅ PASS | Basura `ion-button[color="danger"]` en Guardado → "¡EL Inventario se borro con exito!" → desaparece de lista (borrado directo, sin confirmación previa) |

## Oráculo §9 (round-trip Guardar → reabrir)
Reapertura del Guardado Ref 0 (esperando el async ~3s) — comparación 1:1 contra lo capturado:
| Campo | Guardado | Reabierto | Match |
|-------|----------|-----------|-------|
| Cliente | DANIELA HERNANDEZ F.P. (V161051485) | idem | ✅ |
| Producto | PLAN-001 Agro silotubo flex-silon extra PB 8P*50C | idem | ✅ |
| Cantidad | 5 | 5 | ✅ |
| Lote | LOTE-QA-706 | LOTE-QA-706 | ✅ |
| Fecha venc | 2026-07-06 (6 jul 2026) | 2026-07-06 | ✅ |

Sin divergencias silenciosas. Round-trip PASS.

## Registros creados en sistema
| Ref | Detalle | Estado UI |
|-----|---------|-----------|
| Ref 0 (06/07/2026) | DANIELA HERNANDEZ F.P. · PLAN-001 x5 · Lote LOTE-QA-706 · venc 06/07/2026 | Enviado → **Por enviar** (encolado async; sin BD no se confirmó flip a Enviado dentro de la ventana de poll ~13s) |
| Ref 0 (06/07/2026) | DANIELA HERNANDEZ F.P. · PLAN-001 x3 · Lote LOTE-DEL-28 | Guardado → **BORRADO** (DM-INV-028) |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `inventory-type-stocks-modal` sin segmento de tipo en jerez | cliente jerez | Tipo fijo "Exhibición" (label), sin segmento Exhibición/Depósito/Todos — igual a piercar/don-theo, distinto a insumar. Header icons: close/checkmark/trash/add. Inputs por placeholder "Ingrese cantidad"(number)/"Ingrese lote"(text). Fecha venc `ion-datetime` id=`expDate0` default HOY |
| Estatus tras Enviar sin sync inmediato = "Por enviar" | universal (confirmar) | Sin conexión/sync activa, el registro pasa Guardado→"Por enviar" (cola local) y no flip inmediato a "Enviado". Consistente con RUNTIME §10 BD-QUEUED. Filtro searchbar NO matchea el texto "Estatus" (busca cliente/código/ref) |
| DM-INV-025 searchbar filtra por cliente/código/ref, no por estatus | universal | "Enviado" como término → 0 resultados pese a existir un Enviado; "DANIELA"→2 |

> ✅ consolidado 2026-07-06

## Notas
- ⚠ **Divergencia VG confirmada de nuevo (jerez):** `suggestedOrderByDispatchAndReturn` CSV=false pero UI muestra "Pedido Sugerido" activo y funcional (modal `inventario-sugerido-modal`). NO se marcó FAIL (instrucción del orquestador). Pendiente: VERIFICAR valor efectivo con desarrollo antes de cambiar la VG.
- Sin lectura de BD en esta corrida (instrucción): el estatus reportado es solo UI. El Ref 0 enviado quedó "Por enviar"; confirmar sync a nube con cotejo BD en próxima corrida.
- HOME inicial y HOME final confirmados (`/home`, `app-home` visible).
