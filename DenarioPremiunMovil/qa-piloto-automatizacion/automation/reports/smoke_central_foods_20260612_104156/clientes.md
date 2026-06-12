# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260612_104156_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | Infinix X6728 (Android 15) — CDP :9220 |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | El Yaque (central_foods) |
| Cliente QA | central_foods (CENTRAL FOODS C.A.) |
| Resultado | 12 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` visible con 3 botones: CLIENTES / CLIENTE POTENCIAL / BUSCAR CLIENTE POTENCIAL |
| DM-CLT-002 | ✅ PASS | Lista `app-client-list` con 50 ítems; cada uno con Saldo BS + Saldo US$ (multiCurrency=true confirmado) |
| DM-CLT-003 | ✅ PASS | Búsqueda "ALEJANDRA" → filtra a 1 coincidencia (ALEJANDRA LEDEZMA 00029). Requiere click en botón search (no filtra on-keyup) |
| DM-CLT-009 | ✅ PASS | Detalle: Nombre ALEJANDRA LEDEZMA (00029), RIF V18692983, Saldo BS 32.937,6765 / US$ 57,0300, Empresa CENTRAL FOODS C.A. |
| DM-CLT-013 | ✅ PASS | Tab "Doc. de Venta": tabla con leyendas Vigente/Vencido/A favor + docs (FACT0615669, FACT0615878...) con columnas Tipo/Nº Doc/Moneda/Días Venc/Tasa/Montos/Saldo/Fechas |
| DM-CLT-016 | ✅ PASS | `clickBack` desde lista → `app-clientes` home (3 botones), NO salta a HOME principal |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` visible (50 ítems); detalle oculto |
| DM-CLT-019 | ✅ PASS | Form CLIENTE POTENCIAL: 9 ion-input vacíos + ion-select Empresa preseleccionado; Guardar/Enviar `disabled=true` |
| DM-CLT-021 | ✅ PASS | `fillIonInput` ×8 campos obligatorios → Guardar/Enviar `disabled=false` |
| DM-CLT-024 | ✅ PASS | Guardar → alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!" → aparece en BUSCAR con Estatus: Guardado, Nro. Ref: 0 |
| DM-CLT-026 | ✅ PASS | Enviar → 3 alertas (confirm Cancelar/Aceptar → "será enviado" OK → "nro. 7 creado exitosamente" OK) → Estatus: Enviado, Nro. Ref: 7 |
| DM-CLT-031 | ✅ PASS | Trash en cliente Guardado (Test-CLT-DEL-104156) → borrado DIRECTO sin confirmación previa (solo alert "¡Cliente Potencial se borro con exito!") → desaparece de la lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. Ref: 7 | Cliente potencial `Test-CLT-SMOKE-104156` (RIF V12345678, tel 04241234567, Empresa CENTRAL FOODS C.A.) | **Enviado** — creado exitosamente nro. 7 |
| Nro. Ref: 0 | Cliente potencial `Test-CLT-DEL-104156` (RIF V87654321) | **Borrado** — creado Guardado y eliminado en DM-CLT-031 |

## Datos descubiertos (para poblar el yaml — modules.clientes)
| Clave | Valor |
|-------|-------|
| `cliente_busqueda` | `"ALEJANDRA"` — devuelve 1 coincidencia (ALEJANDRA LEDEZMA) |
| `cliente_detalle` | `"ALEJANDRA LEDEZMA"` código `00029` — CON saldo (BS 32.937,6765 / US$ 57,0300) y documentos de venta (FACT0615669, FACT0615878...) para DM-CLT-009/013 |

Otros nombres reales observados en la lista (alternativas válidas de búsqueda): ALEJANDRO SILVA (00030), ALEXBERT RODRIGUEZ (00033). El primer ítem de la lista es "NULO" código 00000 (saldo 0).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Form potencial: 9º ion-input = `naWebSite` | universal (central_foods) | Los 9 ion-input son: naClient, nuRif, txAddress, txAddressDispatch, txClient, naResponsible, emClient, nuPhone, **naWebSite** (este último OPCIONAL — Guardar habilita con los 8 primeros + Empresa preseleccionada). En la doc previa de module-selectors el 9º era idEnterprise (ion-select); aquí idEnterprise es ion-select separado y naWebSite completa los 9 ion-input |
| Form potencial: estructura por tabs General / Adjuntos | universal (central_foods) | El form de cliente potencial tiene segmentos "General" (datos) y "Adjuntos"; el acordeón Firma (signatureClient=true) vive bajo Adjuntos, no en el form General — no es discrepancia |
| Envío potencial central_foods = 3 alertas → vuelve a home de clientes | cliente (central_foods) | Secuencia: "¿Desea enviar nuevo Cliente Potencial?" (Cancelar/Aceptar) → "El cliente potencial será enviado" (OK) → "Cliente potencial nro. N creado exitosamente" (OK). Tras enviar navega al HOME de clientes (3 botones), NO al HOME principal. Igual patrón que insumar |
| Borrado potencial Guardado = directo sin confirmación | cliente (central_foods) | Trash `ion-button[color="danger"]` dentro del `ion-item` → borra directo, solo alert éxito "¡Cliente Potencial se borro con exito!". Confirma patrón ya visto en gmp/ins/rom |
| Detalle: tabs `default` (Detalle) / `docVentas` (Doc. de Venta) | universal | `ion-segment-button[value="docVentas"]`; tabla `.documents-table-stack` con header Tipo/Nº Doc/Moneda Doc/Días Venc/Tasa/Monto Base/Monto IVA/Descuento/Total/Saldo/Fecha Doc/Fecha Venc/Comentario |

> ✅ consolidado 2026-06-12

## Discrepancias VG (CSV dev vs UI real)
| VG (CSV) | Esperado por perfil | UI real | Veredicto |
|----------|---------------------|---------|-----------|
| `enterpriseEnabled=false` | El form de cliente potencial NO debe tener campo Empresa | El form **SÍ tiene** `ion-select[formcontrolname="idEnterprise"]` = "CENTRAL FOODS C.A." (preseleccionado, no editable en la práctica) | ⚠ **DISCREPANCIA** — el campo Empresa aparece en el form de cliente potencial pese a `enterpriseEnabled=false` en el CSV dev. NO bloquea el flujo (viene preseleccionado y Guardar habilita sin tocarlo). Posible bug de configuración o que `enterpriseEnabled` no gobierne este form específico. Recomendado verificar con dev antes de fijar la VG en el yaml |
| `signatureClient=true` (prompt) | Acordeón Firma en cliente potencial | No visible en tab General; el form tiene tab "Adjuntos" donde normalmente vive Firma (no inspeccionado a fondo) | ✅ Sin discrepancia aparente — Firma vive bajo Adjuntos (no en General). No fue parte de los casos ejecutados |

## Hallazgos (FAIL)
Ninguno. 12/12 PASS.

## Notas
- Estado inicial y final: HOME ✅ (app devuelta a `app-home`).
- `multiCurrency=true` verificado en UI: lista y detalle muestran Saldo BS + Saldo US$.
- `cliente_busqueda` requiere click en botón search (`ion-icon[name="search-circle-sharp"]` / `.clear-search`) — no filtra on-keyup, consistente con gmp/ins/rom.
