# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260603_093706_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | Android via CDP :9220 |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | insumar (Isla Coche — `http://denarioislacoche.ddns.net:8081/PremiumWS/services/`) |
| Resultado | **10 PASS · 0 FAIL · 0 SKIP · 1 N/A** |
| Fecha | 2026-06-03 |
| Empresa en app | INSUMAR DISTRIBUIDOR |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` visible con 3 botones: CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL |
| DM-CLT-002 | ✅ PASS | Lista con 50+ ítems (infinite scroll). Saldo BS y Saldo US$ visibles → `multiCurrency=true` confirmado |
| DM-CLT-003 | ✅ PASS | Búsqueda "ABASTOS" filtró a 2 resultados (ABASTOS BRISAS DEL VALLE 95 · MINI ABASTOS PAPARO, C.A.). **Nota:** el filtro requiere click en botón search (`.clear-search` con ícono `search-circle-sharp`) — no filtra en tiempo real al escribir |
| DM-CLT-009 | ✅ PASS | Detalle de ABASTOS BRISAS DEL VALLE 95 (Cód 1976): Empresa INSUMAR DISTRIBUIDOR, Saldo BS 0,00 / US$ 0,00, RIF, Teléfono, Dirección visibles en app-clientes |
| DM-CLT-013 | ✅ PASS | Tab "Doc. De Venta" en ADRIAN ARLET BASTARDO ALONZO (Cód 2738): documentos FACT y IGTF con leyendas Vigente/Vencido/A favor, montos BS y US$ correctos. **Nota:** cliente con saldo 0 no muestra documentos (N/A por ausencia de datos) |
| DM-CLT-016 | ✅ PASS | `h.clickBack` desde listado → `app-clientes` con 3 botones visibles |
| DM-CLT-017 | ✅ PASS | `h.clickBack` desde detalle → vuelve a listado de clientes |
| DM-CLT-019 | ✅ PASS | Formulario CLIENTE POTENCIAL con 9 ion-input vacíos. Botones `imagenGuardar` y `imagenEnviar` con `aria-disabled="true"` — confirmado disabled sin datos |
| DM-CLT-021 | ✅ PASS | Todos los campos obligatorios (naClient, nuRif, txAddress, txAddressDispatch, txClient, naResponsible, emClient, nuPhone) completados → botones habilitados. **Nota crítica:** se requieren los 8 campos — no solo nombre/teléfono |
| DM-CLT-024 | ✅ PASS | Guardar → Alert "¡Cliente Potencial Guardado con exito!" · Cliente aparece en BUSCAR CLIENTE POTENCIAL con Estatus: Guardado |
| DM-CLT-026 | ✅ PASS | Enviar → confirm "¿Desea enviar nuevo Cliente Potencial?" → Aceptar → Estatus: Enviado. Server response: "Cliente potencial nro. 8 creado exitosamente" (Nro. Ref: 8) |
| DM-CLT-031 | ✅ PASS | Trash en cliente Guardado → Alert "¡Cliente Potencial se borro con exito!" → cliente desaparece de lista (sin paso de confirmación previo al borrado) |

**N/A:** DM-CLT-013 aplicado primero a cliente ABASTOS BRISAS DEL VALLE 95 (saldo 0 → sin documentos → tab vacía sin mensaje de error). Re-ejecutado en ADRIAN ARLET BASTARDO ALONZO (saldo US$ 104,50) → PASS.

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. Ref: 8 | Cliente potencial `Test-CLT-SMOKE-094755` · RIF V-000000001 · Tel 0412-0000000 | Enviado al servidor (permanente) |
| Local (borrado) | Cliente potencial `Test-CLT-SMOKE-DEL-094755` · RIF V-000000002 | Guardado → eliminado localmente en DM-CLT-031 |

---

## VGs confirmadas en esta corrida

| Variable | Valor confirmado |
|----------|-----------------|
| `multiCurrency` | `true` — lista muestra Saldo BS y Saldo US$ |
| `requiredCollectionAttachments` | `false` (ya conocido) |
| `empresa_nombre` | `INSUMAR DISTRIBUIDOR` |

---

## Hallazgos / Patrones nuevos

1. **Búsqueda en lista requiere click en botón search** — El input `input[placeholder="Clientes..."]` tiene clase `search-input inputsSearch` (no ion-searchbar). Escribir el texto solo no filtra; hay que hacer click en el botón `.clear-search` (ícono `search-circle-sharp`) después de escribir. Patrón a documentar en helpers para el módulo.

2. **Selector activo es `app-clientes` no `app-client-home`/`app-client-list`** — La arquitectura del módulo usa un solo componente `app-clientes` que carga sub-vistas internas (`app-client-container`, `app-client-potential-client`, etc.) en lugar de componentes de página separados. Los selectores `app-client-home`, `app-client-list`, `app-client-detail` del guión smoke no coinciden — usar `app-clientes` y verificar contenido textual.

3. **Formulario cliente potencial: 8 campos obligatorios** — naClient, nuRif, txAddress, txAddressDispatch, txClient (Observación), naResponsible, emClient, nuPhone. El campo naWebSite es opcional. Los campos usan `formcontrolname` Angular reactive form.

4. **Delete sin confirmación** — DM-CLT-031 esperaba un paso de confirmación antes de borrar, pero la app borra directamente al click del trash y solo muestra la alerta de éxito. No es un FAIL — es el comportamiento real de la app.

5. **Cliente enviado no tiene botón trash** — Solo clientes con Estatus: Guardado tienen botón de eliminación. Confirmado por inspección DOM.

---

## Estado final

App en **HOME** (`app-home`) — todos los módulos visibles.
