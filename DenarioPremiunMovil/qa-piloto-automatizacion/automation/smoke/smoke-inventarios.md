# Smoke — INVENTARIOS
## Estado inicial: HOME | Estado final: HOME

**Inicio:** `h.connectCdp(page)` → `h.waitSyncOverlay(pg)`
**Datos de prueba:** leer `automation/clientes/{QA_CLIENTE}/{QA_CLIENTE}.yaml` → `modules.inventarios`
**VGs clave:** `expirationBatch` (lote+fecha obligatorios), `suggestedOrderByDispatchAndReturn`.

---

## Casos

| ID | Acción clave | PASS cuando | FAIL / N/A |
|----|-------------|-------------|------------|
| DM-INV-001 | Click módulo Inventarios | Home con botones INVENTARIO y BUSCAR | FAIL: pantalla vacía |
| DM-INV-002 | Click INVENTARIO → formulario | 4 tabs: General/Inventario/Resumen/Adjuntos; campo Cliente vacío | FAIL: tabs habilitadas sin cliente |
| DM-INV-004 | Seleccionar `cliente_test` → `h.clickIonItem` | Tabs habilitadas; sucursal cargada | FAIL: tabs bloqueadas |
| DM-INV-008 | Tab Inventario → lista de productos | Al menos 1 producto con campos de captura | FAIL: lista vacía |
| DM-INV-010 | Click en producto → modal `inventory-type-stocks-modal` | Modal con campos cantidad, lote, fecha | FAIL: modal no abre |
| DM-INV-011 | **`h.fillNgModelKeyboard`** cantidad (NO fillIonInput); si `expirationBatch=true`: llenar lote y fecha también con `h.fillNgModelKeyboard` | Valores reflejados en modal | FAIL: campos vacíos o sin actualizar ngModel |
| DM-INV-012 | Click Aceptar/Guardar en modal | Producto marcado con cantidad; sin error de validación | FAIL: error con datos válidos |
| DM-INV-016 | Tab Resumen | Tabla con productos capturados y cantidades | FAIL: resumen vacío con capturas hechas |
| DM-INV-017 | Tab Resumen → pedido sugerido (si `suggestedOrderByDispatchAndReturn=true`) | Sección pedido sugerido visible con cantidades | N/A si VG inactiva |
| DM-INV-020 | Campo "días para siguiente inventario" | Valor `quUnitSuggested` visible | N/A si `quUnitSuggested=0` (sin historial) |
| DM-INV-021 | Click Guardar | Alert guardado exitoso; inventario en BUSCAR Estatus: Guardado | FAIL: sin alert |
| DM-INV-022 | Click Enviar → ACEPTAR | Alert envío; navega a home inventarios | FAIL: sigue Guardado |
| DM-INV-023 | Click BUSCAR → lista | Inventario con Nro.Ref, cliente, estatus, fecha | FAIL: lista vacía |
| DM-INV-025 | Searchbar en BUSCAR | Filtra en tiempo real | FAIL: no filtra |
| DM-INV-026 | Click en inventario Guardado | Formulario carga — **defecto conocido:** puede abrir en tab General en vez de Inventario (observación, no FAIL) | FAIL solo si formulario vacío o inaccesible |
| DM-INV-028 | Botón basura en Guardado → confirmar | Desaparece de lista | FAIL: persiste |

---

## ⚠ Crítico — campos en `inventory-type-stocks-modal`

Los campos cantidad, lote y fecha usan `[(ngModel)]`, NO reactive forms.
Usar **`h.fillNgModelKeyboard(pg, selector, value)`** — si se usa `h.fillIonInput`, el ngModel no se actualiza y el modal guarda valores vacíos.
