# Smoke — PEDIDOS
## Estado inicial: HOME | Estado final: HOME

**Inicio:** `h.connectCdp(page)` → `h.waitSyncOverlay(pg)`
**Datos de prueba:** leer `automation/clientes/{QA_CLIENTE}.yaml` → `modules.pedidos`

---

## Casos

| ID | Acción clave | PASS cuando | FAIL / N/A |
|----|-------------|-------------|------------|
| DM-PED-001 | Click módulo Pedidos | Home con botones PEDIDO, BUSCAR, COPIAR | FAIL: pantalla vacía |
| DM-PED-002 | Click PEDIDO → formulario | Tabs Pedido/Total con `segment-button-disabled`; sin cliente | FAIL: tabs habilitadas sin cliente |
| DM-PED-006 | Click campo cliente → modal → seleccionar `cliente_test` (`h.clickIonItem`) | Si `alerta_deuda_vencida=true`: aceptar alert con `h.clickAlertButton`; tabs habilitadas | FAIL: tabs siguen bloqueadas |
| DM-PED-015 | Click tab Pedido → buscar `estructura_producto` | Lista de productos visible en acordeón | FAIL: acordeón vacío |
| DM-PED-017 | `h.fillIonInput` cantidad=2 en producto | Badge verde en ítem; Tab Total muestra totales | FAIL: badge no aparece |
| DM-PED-024 | Click tab Total | Totales BS y USD distintos de cero | FAIL: totales en cero |
| DM-PED-026 | Eliminar ítem desde Tab Total (botón basura) | Totales recalculados (menor valor) | FAIL: totales no cambian |
| DM-PED-029 | Sin ítem en pedido | Botones guardar/enviar deshabilitados | FAIL: se puede guardar sin datos |
| DM-PED-030 | Agregar ítem → Click guardar | Alert "Pedido Guardado" + pedido en lista Estatus: Guardado; comentario: `Test-PED-SMOKE-<HHMMSS>` | FAIL: sin alert |
| DM-PED-031 | Click enviar → ACEPTAR | "Pedido nro. X enviado exitosamente"; navega a home pedidos | FAIL: sigue en Guardado |
| DM-PED-032 | Click atrás con **formulario dirty** (ítems agregados o editados en esta sesión, antes de guardar desde cabecera) | Modal 3 opciones: Guardar y salir / Salir sin guardar / Cancelar | FAIL: sale sin modal con cambios pendientes. **Nota:** reabrir pedido Guardado sin editar y pulsar atrás → salida directa sin modal → **no es FAIL** |
| DM-PED-034 | BUSCAR → escribir texto en searchbar | Lista filtra en tiempo real | FAIL: no filtra |
| DM-PED-035 | Click en pedido Guardado | Formulario editable con 4 tabs | FAIL: solo lectura |
| DM-PED-037 | Botón basura en pedido Guardado → confirmar | Pedido desaparece de lista | FAIL: persiste |
