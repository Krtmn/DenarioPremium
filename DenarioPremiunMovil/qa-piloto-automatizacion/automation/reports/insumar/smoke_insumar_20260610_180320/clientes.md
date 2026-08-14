# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260610_180320_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | CDP `127.0.0.1:9220` (WebView Capacitor) |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | insumar (INSUMAR DISTRIBUIDOR) |
| Resultado | 12 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` visible con 3 botones (CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL) |
| DM-CLT-002 | ✅ PASS | Lista de 50 ítems; cada uno con "Saldo BS:" y "Saldo US$:" (multiCurrency=true) |
| DM-CLT-003 | ✅ PASS | Búsqueda "ABASTOS" (type + click botón search) → 2 coincidencias (ABASTOS BRISAS DEL VALLE 95, MINI ABASTOS PAPARO) |
| DM-CLT-009 | ✅ PASS | Detalle ADRIAN ARLET BASTARDO ALONZO (Cód 2738): Nombre, Empresa, RIF, Saldo BS/US$ visibles en `app-client-detail` |
| DM-CLT-013 | ✅ PASS | Tab "Doc. de Venta" renderiza tabla `documents-table` con FACT FACT20086729 (US$ 52.552,22), IGTF, columnas Tipo/Nº Doc/Moneda/Fecha Venc; leyenda Vigente/Vencido/A favor presente |
| DM-CLT-016 | ✅ PASS | clickBack desde listado → home de clientes (3 botones), no salta a HOME principal |
| DM-CLT-017 | ✅ PASS | clickBack desde detalle → vuelve a lista (input "Clientes..." + 50 ítems), no salta a HOME |
| DM-CLT-019 | ✅ PASS | Form potencial con 9 ion-inputs vacíos + ion-select idEnterprise; Guardar/Enviar disabled=true |
| DM-CLT-021 | ✅ PASS | fillIonInput ×8 + selectIonPopover idEnterprise(=1) → Guardar/Enviar disabled=false |
| DM-CLT-024 | ✅ PASS | Click Guardar → alert "Denario Cliente: ¡Cliente Potencial Guardado con exito!" (OK); aparece en BUSCAR con Estatus: Guardado, Nro. Ref: 0, con trash |
| DM-CLT-026 | ✅ PASS | Enviar (3 alertas): "¿Desea enviar nuevo Cliente Potencial?" → "El cliente potencial será enviado" → "Cliente potencial nro. 10 creado exitosamente"; ítem pasa a Estatus: Enviado (Ref 10), sin trash |
| DM-CLT-031 | ✅ PASS | Trash en potencial Guardado (Test-CLT-DEL-180320) → borrado **directo sin confirmación previa**, alert único "¡Cliente Potencial se borro con exito!"; desaparece de la lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. 10 | Cliente potencial `Test-CLT-SMOKE-180320` (RIF J-401803200, empresa INSUMAR DISTRIBUIDOR) | **Enviado** (queda en sistema) |
| Ref 0 (local) | Cliente potencial `Test-CLT-DEL-180320` (RIF J-401803201) | **Eliminado** (DM-CLT-031) — no persiste |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Botón home CLIENTES navega solo desde el `ion-button.colorBorderBuscar` interno, no desde el `ion-col` contenedor (área mayor que abarca el padre absorbe el click sin navegar) | universal | Localizar el `ion-button` exacto por textContent y clicar sus coords; el ion-col padre (y≈107 con w=350) no dispara la navegación |
| Tab Doc. de Venta: tabla `.doc-ventas-tab` → `.documents-view` → `.documents-table-panel--ready` / `.documents-table-scroll` / `.documents-table-stack` | universal | Documentos NO son `ion-item`; viven en tabla con header Tipo/Nº Doc/Moneda/Días Venc/Tasa/Monto/Saldo/Fecha Doc/Fecha Venc/Comentario |
| Form potencial idEnterprise insumar: una sola opción `value=1` "INSUMAR DISTRIBUIDOR" | cliente | selectIonPopover con value numérico 1 |
| Alert de guardado/borrado: textContent del `ion-alert` llega vacío justo tras click; leer `.alert-message` tras ~800ms de espera | universal | El header está en `.alert-title`, el mensaje en `.alert-message`; esperar render antes de leer |
| Envío potencial insumar: 3 alertas (confirm Cancelar/Aceptar → "será enviado" OK → "nro. {ref} creado exitosamente" OK); queda en home de clientes (NO navega a HOME principal como globalmp/romher) | cliente | Divergencia con `[gmp-2606][rom-2606]` que reportan navegación a HOME |
| Borrado potencial Guardado insumar: directo sin confirmación previa, alert único de éxito | cliente | Confirma nota previa `[ins-2606]` |

> ✅ consolidado 2026-06-10

*(Lo lee `prompt-consolidar-hallazgos.md` al cierre.)*

## Hallazgos (solo si hay FAIL)
Ninguno — 12/12 PASS.
