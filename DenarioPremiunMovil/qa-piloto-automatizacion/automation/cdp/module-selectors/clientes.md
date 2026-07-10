> Parte de `module-selectors/` — leer junto con `_comunes.md` (convención global).

## Módulo CLIENTES

### Identidad
- Ruta: `/clientes` · Componente raíz: **`app-clientes`** (las sub-vistas son internas — NO existe `app-client-home`)
- Sub-vistas: `app-client-list` (lista), `app-client-detail` (detalle)
- Botones home: CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Campo búsqueda | `input[type="text"][placeholder="Clientes..."]` (plain input, NO ion-input) | `[gmp-2606][ins-2606]` | focus + `keyboard.type()` + click botón search |
| Botón búsqueda | `ion-icon[name="search-circle-sharp"]` / `.clear-search` (coords ~317,95) | `[gmp-2606][ins-2606][rom-2606]` | requerido — la lista NO filtra on-keyup |
| Botón home CLIENTES | `ion-button.colorBorderBuscar` interno (por textContent) — **NO** el `ion-col` contenedor | `[ins-2610]` | el ion-col padre (y≈107, w≈350) absorbe el click sin navegar; clicar coords del ion-button exacto |
| Detalle: tab Doc. Venta | `ion-segment-button[value="docVentas"]` — asignar `ion-segment.value='docVentas'` + `ionChange` (+ `mouse.click` en segment-button como respaldo) | `[gmp-2606][gmp-2611]` | renderiza tabla `.documents-table-panel--ready`; leyenda Vigente/Vencido/A favor |
| Detalle: tabla Doc. Venta | `.doc-ventas-tab` → `.documents-view` → `.documents-table-panel--ready` / `.documents-table-scroll` / `.documents-table-stack` | `[ins-2610]` | documentos NO son `ion-item`; tabla con header Tipo/Nº Doc/Moneda/Días Venc/Tasa/Monto/Saldo/Fecha Doc/Fecha Venc/Comentario |
| Alert guardado/borrado | `.alert-title` (título) + `.alert-message` (mensaje) | `[ins-2610]` | textContent llega vacío justo tras el click; esperar ~800ms de render antes de leer |
| Form potencial: empresa | `ion-select[formcontrolname="idEnterprise"]` | `[gmp-2606]` | requerido (`ng-invalid` vacío); usar `h.selectIonPopover` |
| Form potencial: campos | 9 ion-inputs (`formcontrolname`): naClient, nuRif, txAddress, txAddressDispatch, txClient, naResponsible, emClient, nuPhone, **naWebSite** | `[gmp-2606][ins-2606][gmp-2611]` | los 8 primeros + idEnterprise (ion-select) = 9 controles requeridos que habilitan Guardar/Enviar; **naWebSite es opcional** (Guardar habilita sin llenarlo) `[gmp-2611]` |
| Guardar / Enviar | `ion-button.imagenGuardar` / `.imagenEnviar` | `[gmp-2606]` | disabled hasta los 9 controles válidos |
| Reabrir potencial Guardado para Enviar | el ítem Guardado NO tiene botón Enviar inline; click en la **zona izquierda** del `ion-item` (≈35% del ancho, evitando el trash a la derecha) reabre el formulario con campos precargados y Enviar habilitado | `[ins-2622][jerez-2026-07-06][ferrenuestro-2026-07-07][hidroponias-20260710]` | desbloquea el envío (DM-CLT-026) sin depender de reapertura inestable; la nota `reapertura_ref0_cdp_inestable` no aplicó (navegó bien) |
| Form potencial: empresa exige **value numérico** | `ion-select[formcontrolname="idEnterprise"]`: sus `ion-select-option` tienen `value` **numérico** (1/2/3). Asignar `sel.value = 1` (number) + `ionChange{value:1}` → `ng-valid`, Guardar/Enviar habilitados | `[jerez-2026-07-06][ferrenuestro-2026-07-07][hidroponias-20260710]` | ⚠ asignar string `'1'` deja el control `ng-invalid`/`selVal=undefined` y los botones `disabled`. Refina el anti-patrón de auto-selección `[dth-2612][ins-2622]`: aquí SÍ hay opciones pero exige el **tipo** correcto. Reconfirmado en ferrenuestro con **1 sola empresa** (value=1) Y en **hidroponias** (1 sola empresa HIDROPONIAS VENEZOLA value=1): la opción única NO se auto-selecciona y exige el number explícito |

### Flujo mínimo probado
```
1. Click módulo → app-clientes (3 botones)
2. app-client-list → buscar: focus input + keyboard.type + click search
3. Click ítem → app-client-detail (saldos, tab Doc. Venta)
4. clickBack: detail→list→clientes (no salta a HOME)
5. Potencial: fillIonInput ×8 + selectIonPopover idEnterprise → Guardar/Enviar habilitan
```

### Anti-patrones confirmados
- `fillIonInput` solo NO basta para la búsqueda: hace falta click en botón search. `[ins-2606]`
- No esperar que idEnterprise sea un ion-input — es ion-select, invisible en la lista de inputs. `[gmp-2606]`
- ⚠ **idEnterprise con una sola empresa NO se auto-selecciona** — aunque solo haya 1 opción, Guardar/Enviar siguen `disabled` hasta asignar `value` explícito + `ionChange`. `[dth-2612][ins-2622]`
- ⚠ **idEnterprise exige `value` NUMÉRICO, no string** — `sel.value='1'` deja el control `ng-invalid` (selVal=undefined) → botones disabled; `sel.value=1` (number) + `ionChange` valida. Confirmado con multi-empresa (3 opciones val 1/2/3) Y con **1 sola empresa** en ferrenuestro (value=1: opción única tampoco se auto-selecciona). `[jerez-2026-07-06][ferrenuestro-2026-07-07]`

### Notas por cliente
- Enviar potencial = **3 alertas**: "¿Desea enviar nuevo Cliente Potencial?" (Cancelar/Aceptar) → "El cliente potencial será enviado" (OK) → "Cliente potencial nro. {ref} creado exitosamente" (OK). El registro pasa de Estatus Guardado → Enviado (sin trash) con el correlativo real. `[gmp-2606][rom-2606][ins-2610][gmp-2611]`
- **Correlación Ref UI = `id_client` (PK secuencial) en BD:** Nro. mostrado en alert "cliente potencial nro. X" = `id_client` de la tabla `potential_client`. El campo `co_client` es epoch timestamp (no el Ref). Confirmado piercar: UI "nro. 5" = `id_client=5`. # candidato — confirmar en 2+ corridas para graduar. `[prc-2606]`
- **`st_potential_client=1` en BD para registros Enviados:** el campo adopta valor 1 en servidor; los Guardados locales (Ref:0) nunca llegan a la BD. # candidato — confirmar en próxima corrida. `[prc-2606]`
- **Títulos mixtos en alertas de envío potencial:** 1ª alerta = "Denario Clientes" (¿Desea enviar nuevo Cliente Potencial?), 2ª y 3ª = "Denario Premium" (El cliente potencial será enviado → Cliente potencial nro. N creado exitosamente). Confirmado piercar + globalmp + don-theo + jerez. `[prc-2606][jerez-2026-07-06]`
- ⚠ **Destino post-envío:** queda en el **home de clientes**, NO navega a HOME principal — confirmado en insumar Y globalmp 0611 (matiza la nota previa `[gmp-2606]` que decía "navegación a HOME"; esa observación no se reprodujo). `[ins-2610][gmp-2611]`
- ⚠ **Tras Guardar, el form NO navega a la lista** — queda en el formulario; el registro Guardado solo es visible navegando a BUSCAR CLIENTE POTENCIAL. Confirmado don-theo e **hidroponias** La Tortuga. `[dth-2612][hidroponias-20260710]`
- Borrado de potencial Guardado: **directo sin confirmación previa** (solo alert de éxito). El trash (`ion-button[color="danger"]` dentro del `ion-item`) aparece **solo** en Estatus Guardado, ausente en Enviado. Confirmado también en **hidroponias**. `[gmp-2606][ins-2606][ins-2610][gmp-2611][ins-2622][hidroponias-20260710]`
- Mensajes exactos globalmp: guardado "Denario Cliente / ¡Cliente Potencial Guardado con exito!"; borrado "¡Cliente Potencial se borro con exito!" ("exito" sin tilde). `[gmp-2611]`
- don-theo coincide en mensajes: borrado título **"Denario Clientes"** (plural) "¡Cliente Potencial se borro con exito!"; guardado título "Denario Cliente" (singular). Confirma globalmp. `[dth-2612]`

---
