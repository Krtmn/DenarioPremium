# Smoke Test — Módulo CLIENTES
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260609_132051_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | insumar |
| Resultado | 12 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` visible con 3 botones: CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL |
| DM-CLT-002 | ✅ PASS | `app-client-list` con 50 ítems mostrando Saldo BS y Saldo US$ (multiCurrency ✓) |
| DM-CLT-003 | ✅ PASS | Búsqueda "ABASTOS" (focus+type+botón search) → 2 coincidencias (ABASTOS BRISAS DEL VALLE 95, MINI ABASTOS PAPARO) |
| DM-CLT-009 | ✅ PASS | Detalle ADRIAN ARLET BASTARDO ALONZO — Cód 2738, Saldo BS 54.126,82, Saldo US$ 104,50 en `app-client-detail` |
| DM-CLT-013 | ✅ PASS | Tab `docVentas` muestra leyenda Vigente/Vencido/A favor + doc FACT FACT200867 |
| DM-CLT-016 | ✅ PASS | clickBack desde listado → `app-clientes` home con 3 botones (no salta a HOME principal) |
| DM-CLT-017 | ✅ PASS | clickBack desde detalle → `app-client-list` (no salta a home principal) |
| DM-CLT-019 | ✅ PASS | Form potencial: 9 ion-inputs + idEnterprise (ion-select); Guardar/Enviar disabled=true |
| DM-CLT-021 | ✅ PASS | Tras llenar 8 inputs + idEnterprise=INSUMAR DISTRIBUIDOR → Guardar/Enviar disabled=false |
| DM-CLT-024 | ✅ PASS | Guardar → alert "¡Cliente Potencial Guardado con exito!"; aparece en BUSCAR con Nro. Ref: 0, Estatus: Guardado |
| DM-CLT-026 | ✅ PASS | Enviar → confirm "¿Desea enviar...?" Aceptar → "Cliente potencial nro. 9 creado exitosamente"; Estatus pasa a Enviado (Ref 9) |
| DM-CLT-031 | ✅ PASS | Trash en cliente Guardado (Test-CLT-DEL) → borrado directo "se borro con exito"; desaparece de lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. Ref 9 | Test-CLT-SMOKE-132051 (RIF J-12345678-9, tel 0424-1234567) | Enviado — **persiste en sistema** |
| Nro. Ref 0 (local) | Test-CLT-DEL-132051 (RIF J-87654321-0) | Creado Guardado → **eliminado** (DM-CLT-031) |

## Notas
- Búsqueda confirmada: NO filtra on-keyup, requiere click en botón `search-circle-sharp`. Limpiar el input + botón no restaura la lista completa; búsqueda nueva sí filtra.
- Borrado de potencial Guardado: **directo sin confirmación previa** (solo alert de éxito) — coincide con notas de module-selectors `[ins-2606]`.
- Envío de potencial: secuencia de 3 alertas — confirm ("¿Desea enviar nuevo Cliente Potencial?" Cancelar/Aceptar) → "El cliente potencial será enviado" (OK) → "Cliente potencial nro. {ref} creado exitosamente" (OK). Tras OK final regresa al home `app-clientes` (no a HOME principal en insumar).
- El form potencial tiene 9 ion-inputs visibles (incluye `naWebSite`, opcional); los 8 obligatorios + idEnterprise habilitan los botones.
- Estado inicial y final: HOME (`app-home`).

## Hallazgos (FAIL)
Ninguno.
