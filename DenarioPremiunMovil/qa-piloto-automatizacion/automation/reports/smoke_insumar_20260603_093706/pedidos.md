# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260603_093706_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | 14678405BR003855 (Infinix X6728, Android 15) |
| App | `com.kiberno.denarioPremiumPro` — Chrome/148.0.7778.179 |
| Cliente | insumar (primera corrida formal) |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A** |
| Fecha | 2026-06-03 |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Navegó a `app-pedidos` con botones PEDIDO / BUSCAR / COPIAR visibles |
| DM-PED-002 | ✅ PASS | Formulario abierto: tab General activo, Pedido/Total/Adjunto con `segment-button-disabled`; save/send con `aria-disabled=true` |
| DM-PED-006 | ✅ PASS | Cliente "ADRIAN ARLET BASTARDO ALONZO" seleccionado; alerta deuda vencida appeared ("Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?") + Aceptar habilitó las 4 tabs |
| DM-PED-015 | ✅ PASS | Tab Pedido con lista de categorías: ALIMENTOS (158), BEBIDAS (113), CARAMELOS (68), etc. Click en ALIMENTOS expande sub-lista de productos individuales |
| DM-PED-017 | ✅ PASS | Producto "VITTALE LECHE COMPLETA DISPLAY 6X30UNDX30G (E)" Cód 12011 — cantidad=2 via fillIonInput; badge verde `contadorProductos ion-color-success` = "2"; contador "Items 1/6" |
| DM-PED-024 | ✅ PASS | Tab Total muestra: Total Items: 1, Total Base: 31,02 US$, Total US$: 35,98 (totales distintos de cero) |
| DM-PED-026 | ✅ PASS | Botón basura en Tab Total → Total Items 1→0; eliminación inmediata sin confirmación dentro del formulario |
| DM-PED-029 | ✅ PASS | Con 0 ítems: `imagenGuardar` y `imagenEnviar` tienen `disabled=true` y `aria-disabled=true` |
| DM-PED-030 | ✅ PASS | 1 ítem + comentario "Test-PED-SMOKE-101502" → Click guardar → Alert "Pedido Guardado" (botón OK) |
| DM-PED-031 | ✅ PASS | Click enviar → Alert "¿Desea Enviar el pedido?" → Aceptar → "Su Pedido será enviado" → "Pedido nro. 17 enviado exitosamente" → navega a home pedidos |
| DM-PED-032 | ✅ PASS | Click atrás con ítems cargados → Alert "¡Alerta!" con 3 botones: ["Guardar y salir", "Salir sin guardar", "Cancelar"] |
| DM-PED-034 | ✅ PASS | BUSCAR navega a `app-pedidos-lista` con searchbar; filtro "ABASTOS" muestra solo registros de ese cliente (filtrado en tiempo real via ionInput) |
| DM-PED-035 | ✅ PASS | Click en pedido Guardado (Nro. Ref.: 0) → formulario editable con 4 tabs habilitadas; save/send enabled |
| DM-PED-037 | ✅ PASS | Click basura en pedido Guardado → Alert "¿Seguro que quieres eliminar este pedido?" → Aceptar → pedido desaparece de lista |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Pedido Nro. 17 | Cliente: ADRIAN ARLET BASTARDO ALONZO · Producto: VITTALE LECHE COMPLETA DISPLAY 6X30UNDX30G (E) · Cantidad: 1 UND · Comentario: Test-PED-SMOKE-101502 | **Enviado** ✅ |

---

## Datos descubiertos — insumar (actualizar YAML)

| Campo | Valor |
|-------|-------|
| `cliente_test` | "ADRIAN ARLET BASTARDO ALONZO" — Código 2738, Saldo US$ 104,50 |
| `estructura_producto` | Lista de familias/categorías (ej. ALIMENTOS, BEBIDAS, …); click en familia expande acordeón con productos individuales. Campos por producto: Nombre, Código, Precio Unidad (UND), Precio Bulto (BTO, si aplica), Inventario, Unidad. |
| `alerta_deuda_vencida` | `true` — aparece al seleccionar "ADRIAN ARLET BASTARDO ALONZO"; texto: "Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" |

---

## Patrones operativos descubiertos (nuevos para esta corrida)

| Patrón | Descripción |
|--------|-------------|
| **CDP port forward drop** | El `adb forward tcp:9220` se cayó durante la ejecución (la app navegó internamente y el WebView se reinició). Se re-estableció con `adb forward tcp:9220 localabstract:webview_devtools_remote_1`. Agregar watchdog de reconexión al orquestador. |
| **Modal cliente — esperar `show-modal`** | El modal `clienteSelectModal` usa la clase `show-modal` (no `overlay-hidden` ausente) para indicar apertura. Filtrar con `classList.contains('show-modal')`. Items renderizan con `getBoundingClientRect().width > 0` incluso cuando el modal está `overlay-hidden`. |
| **Ion-input cantidad — no detectado por `offsetParent`** | El `ion-input[type="number"]` de cantidad dentro del acordeón de producto no tiene `offsetParent !== null`. Usar `getBoundingClientRect().top > 0 && .top < window.innerHeight && .width > 0` como filtro de visibilidad. |
| **Envío de pedido — dos alertas secuenciales** | El flujo de envío genera dos alertas: (1) "Su Pedido será enviado" (queuing async) y (2) "Pedido nro. X enviado exitosamente" (confirmación server). Ambas deben descartarse con OK. |
| **Eliminación pedido Guardado requiere confirmación** | A diferencia del ítem dentro de la tab Total (eliminación inmediata), el botón basura en la lista `pedidosLista` sí muestra alert de confirmación "¿Seguro que quieres eliminar este pedido?" |
| **`app-pedido` en `app-pedidos-lista`** | Al abrir un pedido desde la lista, ambos componentes coexisten en DOM (`app-pedidos-lista` + `app-pedido`). Las queries de ion-segment-button deben usar `document.querySelectorAll('app-pedido ion-segment-button')` para filtrar correctamente. |
| **Tab Total — acordeón expandible por item** | Los ítems en Tab Total también son acordeones. Hacer click expande la fila y muestra: Precio Unidad, Almacén, IVA% y el botón basura (trash) para eliminar el ítem. |
| **Nro. Ref.: 0** | Los pedidos guardados localmente (no sincronizados) aparecen con Nro. Ref.: 0 hasta ser enviados/sincronizados. |

---

## Notas de ejecución

- **GPS alert**: Al abrir el módulo Pedidos se presentó un alert "¡Alerta! Para poder grabar la ubicación, te recomendamos activar el servicio de localización en tu dispositivo" — fue descartado con Aceptar antes de iniciar el flujo.
- **DM-PED-031 texto del alert**: El mensaje de éxito es "Pedido nro. X enviado exitosamente" (no genérico) — confirma que el backend asignó nro. 17.
- **DM-PED-034 búsqueda**: El searchbar en `pedidosLista` filtra en tiempo real con ionInput (a diferencia del módulo Clientes que requiere click explícito en search).
- **Estado final**: App en HOME ✅ (`http://localhost/home`, `app-home`).

---

*Generado: 2026-06-03 · Agente QA CDP · RUN_ID 20260603_093706_smoke-completo*
