# Smoke Test — Módulo PEDIDOS
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-05-27 |
| **RUN_ID** | `20260527_113900_smoke-completo` |
| **Módulo** | PEDIDOS |
| **Dispositivo** | 14678405BR003855 |
| **App** | `com.kiberno.denarioPremiumPro` — Versión 6.6.14 |
| **Credenciales** | `***`/`***` |
| **Resultado global** | 13 PASS · 0 FAIL · 0 SKIP · 0 N/A |

---

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Observaciones |
|----|-------------------|-----------|--------------------------|
| DM-PED-001 | Acceso al módulo Pedidos desde Home → 3 botones | **PASS** | `app-pedidos` visible. Botones: "PEDIDO", "BUSCAR", "COPIAR" presentes. |
| DM-PED-002 | Nuevo pedido → tabs Pedido y Total deshabilitadas sin cliente | **PASS** | Tab General activa (`segment-button-checked`). Tabs Pedido, Total y Adjunto con clase `segment-button-disabled`. |
| DM-PED-006 | Seleccionar cliente → tabs habilitadas + dirección cargada | **PASS** | Cliente "ALIMENTOS GOURMET CCC, C.A." seleccionado. Modal de deuda vencida apareció y fue aceptado (comportamiento esperado). Todas las tabs habilitadas. |
| DM-PED-015 | Tab Pedido → estructuras visibles con badges | **PASS** | Estructuras visibles: AJO, BERRO, CAMPO, FRUTALES, GERMINADOS, HIDROPÓNICO, HORTALIZAS, MALLA, POTES, TOMATES — cada una con badge de productos disponibles. |
| DM-PED-017 | Ingresar cantidad 2 → badge verde + Tab Total actualizado | **PASS** | Estructura GERMINADOS → Producto "ALFALFA BOLSA DE 500 GRS." expandido. Cantidad = 2 con patrón Angular. Badge verde "2" visible. Tab Total: Total Base BS 6.624,42 / Total Pedido BS 7.684,33. |
| DM-PED-024 | Tab Total → totales distintos de cero | **PASS** | Total Items: 1. Total Base BS: 6.624,42 / USD: 13,12. Total Pedido BS: 7.684,33 / USD: 15,22. Tasa: 504 BS = 1 USD. |
| DM-PED-026 | Expandir acordeón en Tab Total → eliminar producto con ícono basura | **PASS** | Acordeón expandido. Botón `ion-color-danger` con icono `trash` clickeado. Producto desapareció. Total Items: 0. Totales recalculados a 0,00. |
| DM-PED-029 | Botones guardar/enviar deshabilitados con carrito vacío | **PASS** | Tras eliminar el único producto: `imagenGuardar` y `imagenEnviar` con clase `button-disabled` y `disabled=true`. |
| DM-PED-030 | Guardar pedido → alerta "Pedido Guardado" → estatus Guardado en lista | **PASS** | Se agregó ALFALFA BOLSA DE 500 GRS. (cant. 1). Comentario: `Test-PED-SMOKE-113900`. Botón guardar clickeado. Alerta "Pedido Guardado" confirmada con OK. Post-guardar: `imagenGuardar` deshabilitado, `imagenEnviar` habilitado. |
| DM-PED-031 | Enviar pedido → modal confirmación → navega a home pedidos | **PASS** | Botón `imagenEnviar` clickeado. Modal "¿Desea Enviar el pedido?" con CANCELAR/ACEPTAR. Al pulsar ACEPTAR: app navegó a `app-pedidos`. En lista: Nro. Ref. 34, ALIMENTOS GOURMET CCC, C.A., **Estatus: Enviado**, Fecha: 2026-05-27. |
| DM-PED-032 | Salir con cambios sin guardar → modal "¡Alerta!" con 3 opciones | **PASS** | Nuevo pedido (cliente + 1 producto). Al pulsar atrás: modal con "Guardar y salir", "Salir sin guardar", "Cancelar". Modalidad texto: "¡Alerta!". |
| DM-PED-034 | Buscar pedido → filtro en tiempo real | **PASS** | Searchbar con placeholder "Pedidos...". Al escribir "GOURMET": lista filtrada mostrando solo órdenes de "ALIMENTOS GOURMET CCC, C.A." (Ref 34, 28, 22, 21, 15…). |
| DM-PED-035 | Abrir pedido "Guardado" → formulario editable | **PASS** | Pedido Nro. Ref. 0 (Guardado, 2026-05-27) abierto con `pg.click()`. Formulario editable: todas las tabs habilitadas, `imagenGuardar` y `imagenEnviar` activos, cliente "ALIMENTOS GOURMET CCC, C.A." visible. |
| DM-PED-037 | Eliminar pedido "Guardado" → desaparece de la lista | **PASS** | Botón trash en item "Guardado" (Ref. 0) clickeado. Modal "¿Seguro que quieres eliminar este pedido?" con CANCELAR/ACEPTAR. Al pulsar ACEPTAR: lista sin registros "Guardado". Solo quedan órdenes "Enviado". |

---

## Hallazgos

### H-001 — Alerta de deuda vencida al seleccionar cliente (DM-PED-006)
- **Tipo:** Comportamiento esperado / Informativo
- **Severidad:** Baja (no bloquea flujo)
- **Descripción:** Al seleccionar cliente "ALIMENTOS GOURMET CCC, C.A.", apareció alerta "Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" con CANCELAR / ACEPTAR. El tester aceptó y el flujo continuó correctamente.
- **Impacto:** Ninguno sobre el resultado del caso de prueba.

### H-002 — Alerta de "Pedido enviado exitosamente" diferida (DM-PED-031 / sesión siguiente)
- **Tipo:** Comportamiento observable / Timing de notificación
- **Severidad:** Baja
- **Descripción:** La alerta "Denario Premium — Pedido nro. 34 enviado exitosamente" apareció con retardo en la siguiente sesión de nuevo pedido (ya en pantalla de Tab Pedido del nuevo formulario), no inmediatamente tras el envío. Fue descartada con OK.
- **Impacto:** Leve confusión visual; no bloquea el flujo.

### H-003 — `dispatchEvent` vs `pg.click()` para ítems de lista (DM-PED-035)
- **Tipo:** Técnico / Automatización
- **Severidad:** N/A (solo aplica a la capa de automatización, no a la app)
- **Descripción:** Los `ION-ITEM` con binding Angular `(click)` en `app-pedidos-lista` no responden a `dispatchEvent(MouseEvent)`. Solo responden a `page.click()` (método nativo de Playwright que genera un evento de puntero real). Documentado para futuros scripts.
- **Recomendación:** Usar `pg.click(selector)` o `pg.tap(selector)` para ítems de lista; reservar `dispatchEvent` para botones de formulario.

### H-004 — Navegación de retorno a Home requiere `pg.mouse.click()` con coordenadas
- **Tipo:** Técnico / Automatización
- **Severidad:** N/A
- **Descripción:** El botón atrás del header de `app-pedidos-lista` (img.fechaAtras dentro de `<a>`) no responde a `dispatchEvent`. Se requirió `pg.mouse.click(30, 47)` para activar la navegación real a `app-pedidos` y luego a `app-home`.

---

## Estado final de la app

- **URL:** `http://localhost/home`
- **Componente activo:** `app-home`
- **Pedidos de prueba enviados:** Nro. Ref. 34 (Test-PED-SMOKE-113900) — permanece en servidor como comportamiento esperado.
- **Pedidos Guardados de prueba:** Eliminados (Ref. 0 borrado en DM-PED-037).

---

## Cobertura del smoke

| Categoría | Total casos smoke definidos | Ejecutados | PASS | FAIL | SKIP | N/A |
|-----------|----------------------------|------------|------|------|------|-----|
| Smoke mínimo | 14 | 13 | 13 | 0 | 0 | 0 |

> **Nota:** DM-PED-015 y DM-PED-017 se ejecutaron como un solo flujo (seleccionar estructura → ingresar cantidad) cumpliendo ambos criterios. Se contabilizan como 2 casos separados dentro del flujo integrado. El contador de 13 refleja los IDs de caso individuales completados.

---

*Generado por Claude Code · Playwright MCP CDP · 2026-05-27*
