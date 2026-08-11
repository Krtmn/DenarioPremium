# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260622_112934_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v6.6.17 |
| Playa | jerez |
| Resultado | 11 PASS · 0 FAIL · 0 SKIP · 1 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` visible con 3 botones (CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL) |
| DM-CLT-002 | ✅ PASS | Lista `app-client-list` con 3 clientes reales, cada uno con Saldo BS y Saldo USD (`multiCurrency=true`). Cartera pequeña (3 clientes, no 50+) — no es FAIL: la lista NO está vacía y renderiza saldos válidos |
| DM-CLT-003 | ✅ PASS | Buscar "JL Motors" + click botón search → filtra de 3 a 1 coincidencia |
| DM-CLT-009 | ✅ PASS | Detalle `app-client-detail`: Nombre "JL Motors SE,C.A", Código J-506554950, RIF (tag "RIF"), Saldo BS/USD y Crédito BS/USD visibles |
| DM-CLT-013 | 🚫 N/A | Tab Doc. de Venta renderiza panel + leyendas (popovers Vigente/Vencido) pero tabla con 0 filas — cliente con Saldo 0,00 sin documentos pendientes (API sin datos). UI funcional, no FAIL |
| DM-CLT-016 | ✅ PASS | `clickBack` desde listado → vuelve a `app-clientes` (3 botones), no salta a HOME |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → vuelve a `app-client-list` |
| DM-CLT-019 | ✅ PASS | Form CLIENTE POTENCIAL: 9 ion-inputs vacíos + ion-select idEnterprise vacío; Guardar/Enviar `disabled=true`; tabs General/Adjuntos |
| DM-CLT-021 | ✅ PASS | `fillIonInput` ×8 (nombre `Test-CLT-SMOKE-113845`) + `selectIonPopover` idEnterprise=1 → Guardar/Enviar `disabled=false` |
| DM-CLT-024 | ✅ PASS | Guardar → alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!" (OK) → aparece en BUSCAR CLIENTE POTENCIAL, Nro. Ref: 0, **Estatus: Guardado** |
| DM-CLT-026 | ✅ PASS | Reabrir Guardado → Enviar → 3 alertas (confirm Cancelar/Aceptar → "El cliente potencial será enviado" OK → "Cliente potencial nro. 2 creado exitosamente" OK) → **Estatus: Enviado, Nro. Ref: 2** |
| DM-CLT-031 | ✅ PASS | Cliente Guardado nuevo (`Test-CLT-DEL-114153`) → trash → borrado **directo sin confirmación** (alert "¡Cliente Potencial se borro con exito!" OK) → desaparece de la lista (2→1) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. Ref: 2 | Cliente potencial `Test-CLT-SMOKE-113845` (RIF J-123456789, empresa INVERSIONES JEREZ MO) | Enviado (persiste) |
| (sin ref) | Cliente potencial `Test-CLT-DEL-114153` (RIF J-987654321) | Creado Guardado y **borrado** en DM-CLT-031 |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Alert guardado potencial | cliente (jerez) | Título "Denario Cliente", mensaje "¡Cliente Potencial Guardado con exito!", botón **OK** (no Aceptar). Confirma dato jerez del prompt |
| Envío potencial = 3 alertas | cliente (jerez) | Igual que insumar/central_foods: confirm "¿Desea enviar nuevo Cliente Potencial?" (Cancelar/Aceptar) → "El cliente potencial será enviado" (OK) → "Cliente potencial nro. {ref} creado exitosamente" (OK); queda en home de clientes, NO navega a HOME principal |
| Borrado potencial directo | cliente (jerez) | Sin confirmación previa; solo alert éxito "¡Cliente Potencial se borro con exito!" (OK) — mismo patrón que gmp/insumar/cf |
| Trash en fila potencial | universal | `ion-item` de fila BUSCAR potencial → `ion-button[color="danger"]` / `.ion-color-danger` con `ion-icon[name="trash"]` |
| ion-select idEnterprise 3 opciones | cliente (jerez) | Las 3 opciones de empresa muestran el MISMO texto "INVERSIONES JEREZ MO" (val 1/2/3). Form vacío sin preselección (a diferencia de central_foods) — Guardar exige seleccionar |

> ✅ consolidado 2026-06-22

## Verificación de VGs contra UI
| VG (CSV dev) | UI observada | Resultado |
|--------------|--------------|-----------|
| `enterpriseEnabled=true` | ion-select idEnterprise presente y obligatorio en form potencial | ✅ coincide |
| `userCanUploadFiles=true` | tab "Adjuntos" presente en form potencial | ✅ coincide |
| `tagRif="RIF"` | etiqueta "RIF:" en detalle de cliente | ✅ coincide |
| `multiCurrency=true` | Saldo BS + Saldo USD en lista y detalle | ✅ coincide |
| alerts botón "OK" | confirmado en Guardar/Enviar/Borrar | ✅ coincide (dato jerez) |

Sin discrepancias VG. Observación menor (no VG): las 3 empresas de idEnterprise comparten nombre "INVERSIONES JEREZ MO" — posible dato de configuración del cliente.

## Datos descubiertos (consolidar en jerez.yaml → modules.clientes)
- `cliente_busqueda`: **"JL Motors"** (buscable por nombre; filtra 3→1)
- `cliente_detalle`: **"JL Motors SE,C.A"** (Código J-506554950) — único con detalle navegado; Saldo 0,00, sin Doc. de Venta
- Nota cartera jerez: solo **3 clientes** reales, todos con Saldo BS/USD 0,00:
  - DANIELA HERNANDEZ F.P. (V161051485)
  - Inversiones J.L Moto Piezas, C.A (J-50163353-3)
  - JL Motors SE,C.A (J-506554950)
- Ningún cliente tiene documentos de venta → DM-CLT-013 N/A estructural para esta cuenta en su estado actual.
