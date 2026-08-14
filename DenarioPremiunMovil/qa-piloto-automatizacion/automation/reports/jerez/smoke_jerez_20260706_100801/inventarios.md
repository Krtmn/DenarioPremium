# Smoke Test — Módulo INVENTARIOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_100801_smoke-completo` |
| Módulo | INVENTARIOS |
| Dispositivo | CDP `:9220` (WebView) |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | jerez |
| Cliente test | DANIELA HERNANDEZ F.P. (V161051485, emp 1) |
| Producto | PLAN-001 "Agro silotubo flex-silon extra PB 8P*50C" (familia Plasticos) |
| Resultado | 16 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |
| Cotejo BD | OMITIDO en esta corrida (por instrucción) |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Home inventarios con botones INVENTARIO y BUSCAR |
| DM-INV-002 | ✅ PASS | 4 tabs General/Inventario/Resumen/Adjuntos; Cliente vacío |
| DM-INV-004 | ✅ PASS | Cliente "DANIELA HERNANDEZ F.P. (V161051485)" → 4 tabs habilitadas |
| DM-INV-008 | ✅ PASS | Tab Inventario: familias con productos (Plasticos 1, etc.) |
| DM-INV-010 | ✅ PASS | Click producto (Pointer+Mouse) → modal `inventory-type-stocks-modal` (Cantidad/Lote/Fecha venc) |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard` Cantidad=5, Lote=LOTEQA706; Fecha venc=HOY (2026-07-06) confirmada |
| DM-INV-012 | ✅ PASS | checkmark-outline → producto "Inventariado: Exhibición", sin error de validación |
| DM-INV-016 | ✅ PASS | Tab Resumen: "PLAN-001 Agro silotubo... 5 PIEZA" |
| DM-INV-017 | ✅ PASS* | Botón "Pedido Sugerido" presente y funcional: "Sugerido PIEZA: 5, Despacho 50" (*VG config false pero feature ACTIVA — divergencia, ver Patrones) |
| DM-INV-020 | ✅ PASS | Modal sugerido: "Días para siguiente Inventario: 1" / "Días desde último Inventario: 1" |
| DM-INV-021 | ✅ PASS | Alert "Denario Inventario — Inventario guardado con éxito"; queda en form (Guardar no navega) |
| DM-INV-022 | ✅ PASS | 2 alertas "¿Desea enviar el Inventario?" → "El Inventario será enviado"; navega a home; queda **Enviado Nro.Ref 8** |
| DM-INV-023 | ✅ PASS | BUSCAR: ítems con Nro.Ref, cliente, estatus, fecha |
| DM-INV-025 | ✅ PASS | Searchbar filtra realtime "JL Motors" 8→2, clear→8 |
| DM-INV-026 | ✅ PASS | Reabre Guardado; abre en tab General (defecto conocido, no FAIL); datos cargan async (~3s) |
| DM-INV-028 | ✅ PASS | Trash `ion-button[color="danger"]` en Guardado → borrado directo "¡EL Inventario se borro con exito!"; lista 9→8 |

## Round-trip §9 (Guardar → reabrir · UI→UI)
Registro Guardado (Ref 0) reabierto desde BUSCAR y reabierto el modal del producto:
- Cantidad **5** conservada · Lote **LOTEQA706** conservado · Fecha venc **2026-07-06** conservada.
- Sin mutación silenciosa. **Round-trip PASS.**

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Inventario **Nro.Ref 8** | DANIELA HERNANDEZ F.P. — PLAN-001 ×5 PIEZA, Lote LOTEQA706, venc 06/07/2026 | **Enviado** (sincronizó: Guardado Ref 0 → Ref 8 al Enviar) |
| Inventario (2º, temporal) | DANIELA HERNANDEZ F.P. — PLAN-001 ×3, Lote LOTEDEL706 | **Borrado** en DM-INV-028 (creado solo para probar el trash) |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| jerez: `suggestedOrderByDispatchAndReturn` ACTIVA en UI pese a config `false` | cliente (jerez) | Botón "Pedido Sugerido" (`ion-button.botonAddAmarillo`) aparece y funciona; modal `inventario-sugerido-modal` con "Sugerido PIEZA: N / Despacho / Días para siguiente Inventario". Igual divergencia UI-vs-config que piercar/expirationBatch. Actualizar VG en YAML jerez a `true` tras verificación con desarrollo. |
| jerez: reapertura Guardado carga datos **async** (~3s) | cliente (jerez) | Al reabrir un inventario Guardado, cliente/capturas aparecen vacíos si se lee <2s; a los ~3s cargan completos (cliente + Resumen "5 PIEZA" + producto "Inventariado"). Esperar antes de juzgar round-trip. |
| jerez: modal captura con placeholders "Ingrese cantidad"/"Ingrese lote" | cliente (jerez) | Igual a insumar (tiene inputs por placeholder). `ion-datetime-button` "Fecha de vencimiento" default HOY. Borrado Guardado directo sin confirmación (igual insumar). |
| jerez: inventarios SÍ sincroniza | cliente (jerez) | Guardado Ref 0 → Enviado Ref 8 tras Enviar (consistente con nota memoria "inv/vis/dep sí sincronizan"). |

> ✅ consolidado 2026-07-06

## Hallazgos (FAIL)
Ninguno.

## Notas
- Cotejo BD (§10) y captura de payloads OMITIDOS por instrucción de esta corrida.
- Estado final: **HOME** (app-home, /home).
