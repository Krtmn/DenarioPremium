# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260619_173652_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa | insumar (INSUMAR DISTRIBUIDOR) |
| Resultado | 12 PASS · 0 FAIL · 0 SKIP · 0 N/A |
| Estado inicial → final | HOME → HOME ✅ |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | Click módulo Clientes → `app-clientes` en `/clientes` con 3 botones (CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL) |
| DM-CLT-002 | ✅ PASS | Click CLIENTES (`ion-button.colorBorderBuscar` en 180,107) → `app-client-list` con 50 ítems, cada uno con Saldo BS + Saldo US$ (multiCurrency=true) |
| DM-CLT-003 | ✅ PASS | Búsqueda "ABASTOS" (focus + keyboard.type + click `search-circle-sharp`) → 2 coincidencias, ambas contienen "ABASTOS" |
| DM-CLT-009 | ✅ PASS | Click ADRIAN ARLET BASTARDO ALONZO → `app-client-detail`: Nombre, Cód 2738, Saldo BS 59.257,92 / US$ 100,88, RIF V-223846498, Condición Pago visibles |
| DM-CLT-013 | ✅ PASS | Tab "Doc. de Venta" (`ion-segment-button[value="docVentas"]`) → tabla con leyenda Vigente/Vencido/A favor + doc FACT FACT20089663 (US$ 100,88 / BS 59.257,92, vence 11/06/2026) |
| DM-CLT-016 | ✅ PASS | `clickBack` desde listado → `app-clientes` con los 3 botones (no salta a HOME) |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` visible (no salta al home principal) |
| DM-CLT-019 | ✅ PASS | CLIENTE POTENCIAL → 9 ion-input vacíos (naClient…naWebSite) + ion-select idEnterprise(null); Guardar/Enviar `disabled=true` |
| DM-CLT-021 | ✅ PASS | `fillIonInput` ×8 campos obligatorios (nombre `Test-CLT-SMOKE-174513`) → Guardar/Enviar `disabled=false` |
| DM-CLT-024 | ✅ PASS | Click Guardar → alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!"; aparece en BUSCAR CLIENTE POTENCIAL con Ref 0 / Estatus: Guardado |
| DM-CLT-026 | ✅ PASS | Reabrir + Enviar → 3 alertas (confirm "¿Desea enviar nuevo Cliente Potencial?" → "El cliente potencial será enviado" → "Cliente potencial nro. **11** creado exitosamente"); queda en home clientes; ítem pasa a Ref 11 sin trash |
| DM-CLT-031 | ✅ PASS | Borrar potencial Guardado (Test-CLT-DEL-174714, trash en 318,227) → alert directo "¡Cliente Potencial se borro con exito!" (sin confirmación previa) → desaparece de la lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| 11 | Cliente potencial `Test-CLT-SMOKE-174513` (RIF J-123456789, tel 04242712640, empresa INSUMAR DISTRIBUIDOR) | **Enviado** (correlativo real 11) |
| 0 | Cliente potencial `Test-CLT-DEL-174714` (RIF J-987654321) | **Borrado** (creado Guardado y eliminado en DM-CLT-031) |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Trash potencial Guardado | universal | En BUSCAR CLIENTE POTENCIAL, cada `ion-item` Guardado (Ref 0) lleva `ion-button[color="danger"]` (~x318). El Enviado (Ref real) NO lo tiene. Mismo patrón que otros módulos. |
| Oráculo persistencia Ref 0→real en potencial | universal | Tras Enviar, el ítem cambia de **Ref 0 (Guardado)** a **Ref 11 (Enviado, solo lectura sin trash)** — round-trip de estado correcto. Reconfirma `[ins-2610][cf-2612]`. |
| Texto alerts confirmados (insumar) | cliente | Guardar: "Denario Cliente / ¡Cliente Potencial Guardado con exito!". Enviar (3 alerts): "Denario Clientes / ¿Desea enviar nuevo Cliente Potencial?" → "Denario Premium / El cliente potencial será enviado" → "Denario Premium / Cliente potencial nro. {N} creado exitosamente". Borrado directo: "Denario Clientes / ¡Cliente Potencial se borro con exito!" (sin confirm previa). Reconfirma `[ins-2610]`. |
| ion-select idEnterprise — opción única | cliente | insumar expone una sola empresa (value `1` = INSUMAR DISTRIBUIDOR). Guardar/Enviar habilitan con los 8 campos obligatorios incluso antes de tocar el select; igual se asigna `value=1` por seguridad. |

*(Sin patrones DOM nuevos respecto a `module-selectors.md` — la sección CLIENTES quedó plenamente confirmada en esta corrida.)*

> ✅ consolidado 2026-06-19

## Hallazgos (solo si hay FAIL)
Ninguno. 12/12 PASS.
