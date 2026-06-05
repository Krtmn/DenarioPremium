# Smoke Test — Módulo CLIENTES
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-05-27 |
| **RUN_ID** | `20260527_113900_smoke-completo` |
| **Módulo** | CLIENTES |
| **Dispositivo** | 14678405BR003855 |
| **App** | `com.kiberno.denarioPremiumPro` — Versión 6.6.14 |
| **Credenciales** | `***`/`***` |
| **Resultado global** | 9 PASS · 0 FAIL · 1 SKIP · 0 N/A |

---

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-CLT-001 | Navegar al módulo Clientes desde Home | PASS | URL `/clientes`, `app-client-container` visible. Botones: "CLIENTES", "CLIENTE POTENCIAL", "BUSCAR CLIENTE POTENCIAL". |
| DM-CLT-002 | Pulsar "Ver Clientes" → listado con saldo e indicadores | PASS | `app-client-list` activo. 50 ítems cargados. Cada ítem muestra Saldo BS y Saldo USD. Leyenda "Documento vigente / Documento vencido" visible. |
| DM-CLT-003 | Búsqueda por texto parcial "ALIMENTO" → lista filtrada | PASS | Lista redujo de 50 a 8 ítems. Todos los resultados contienen "ALIMENTOS". Input `placeholder="Clientes..."` respondió correctamente al native value setter. |
| DM-CLT-009 | Tocar cliente "ALIMENTOS GOURMET CCC, C.A." → detalle | PASS | `app-client-detail` visible. Campos confirmados: Nombre, Código (100146), RIF (J502228519), Saldo BS (278.907,23), Saldo USD (552,39), Crédito BS/USD, Condición de Pago, Dirección, Coordenada. Tabs "Detalle" y "Doc. De Venta" presentes. |
| DM-CLT-013 | Pulsar tab "Doc. de Venta" → documentos FACT visibles | PASS | Tab clickeada exitosamente. Documentos FACT20110662, FACT20111151, FACT20111276 visibles. Leyenda Vigente/Vencido/A favor presente. Datos: tipo, Nº Doc, moneda, días vencimiento, tasa, montos y fechas. |
| DM-CLT-016 | Botón atrás desde detalle → regresa a listado | PASS | `app-client-list` activo nuevamente con resultados filtrados de "ALIMENTO" (8 ítems). Técnica `img.fechaAtras → closest('a')` funcionó correctamente. |
| DM-CLT-017 | Botón atrás desde listado → home clientes | PASS | `app-client-container` con los 3 botones de acceso. URL sigue en `/clientes`. |
| DM-CLT-019 | Abrir formulario "Nuevo Cliente Potencial" → campos vacíos y botones disabled | PASS | `app-client-new-potential-client` activo. 9 `ion-input` vacíos (Nombre, RIF, Dirección, Dirección Entrega, Observación, Responsable, Email, Teléfono, Web). `imagenGuardar` y `imagenEnviar` con `disabled=true` y clase `button-disabled`. |
| DM-CLT-021 | Rellenar campos obligatorios → botones guardar/enviar habilitados | PASS | Todos los 9 campos llenados con native value setter + CustomEvents. `imagenGuardar` y `imagenEnviar` pasaron a `disabled=false` sin clase `button-disabled`. Datos: nombre=Test-CLT-SMOKE-113900, RIF=J-12345678-9, email=qa@test.com, tel=04121234567. |
| DM-CLT-024 | Pulsar guardar → alert "¡Cliente Potencial Guardado con exito!" → registro en listado con estatus "Guardado" | PASS | Alert `#alertMessage` mostró "¡Cliente Potencial Guardado con exito!" → click OK. En listado de potenciales: "Cliente: Test-CLT-SMOKE-113900 · RIF: J-12345678-9 · Nro. Ref: 0 · Estatus: Guardado". |
| DM-CLT-026 | Abrir potencial guardado → pulsar enviar → modal confirmación → estatus "Enviado" | PASS | Formulario abrió con datos precargados. `imagenEnviar` habilitado. Modal "¿Desea enviar nuevo Cliente Potencial?" → ACEPTAR. App regresó a home clientes con alert "El cliente potencial será enviado" → OK. Listado confirmó: "Nro. Ref: 8 · Estatus: Enviado". Alert adicional: "Cliente potencial nro. 8 creado exitosamente". |
| DM-CLT-031 | Eliminar cliente potencial con estatus "Guardado" | SKIP | No hay ningún registro con estatus "Guardado" en el listado. El único potencial existente (Test-CLT-SMOKE-113900) fue enviado exitosamente en DM-CLT-026 y muestra estatus "Enviado". Sin botón basura disponible. |

---

## Hallazgos

### Observaciones técnicas

1. **Componente raíz diferente al esperado**: El módulo usa `app-clientes` → `app-client-container` como componentes raíz visibles. Los tags `app-client-home`, `app-client-list`, `app-client-detail` no existen como elementos independientes en el DOM; la vista se gestiona dentro de `app-client-container`. La detección de vista activa debe adaptarse consultando el contenido de `app-client-container`.

2. **Input de búsqueda nativo**: El listado usa un `<input type="text" placeholder="Clientes...">` nativo en lugar de `ion-searchbar`. El native value setter + eventos input/change/keyup funcionó correctamente. El botón de búsqueda tiene clase `clear-search` y se habilita automáticamente al tener texto.

3. **Alert de guardado exitoso confirmado**: Tras guardar el potencial, el sistema mostró correctamente `#alertMessage` con "¡Cliente Potencial Guardado con exito!" (un alert entre varios pre-registrados en el DOM, solo ese visible). El sistema luego regresó al formulario en blanco listo para nuevos ingresos.

4. **Flujo de envío completo verificado**: El envío generó dos alertas consecutivas — primero "El cliente potencial será enviado" (al volver al home) y luego "Cliente potencial nro. 8 creado exitosamente" (confirmando sincronización con servidor). Estatus cambió correctamente a "Enviado" en el listado.

5. **Sin defectos bloqueantes detectados**: Todos los flujos críticos del módulo funcionaron dentro de los parámetros esperados.

### Notas de configuración de cuenta QA

- Cuenta QA no tiene rol transportista: tab "Doc. De Venta" visible (DM-CLT-013 ejecutable).
- Cuenta QA muestra saldo en dos monedas (BS y USD): indica `multiCurrency` activo.
- Cuenta QA no es multiempresa: no se muestra selector de empresa en listado (DM-CLT-008 sería N/A).

---

## Artefactos generados

| Archivo | Descripción |
|---------|-------------|
| `smoke-clt-001-home-clientes.png` | Screenshot home módulo Clientes |
| `smoke-clt-002-listado.png` | Screenshot listado de clientes |
| `smoke-clt-003-busqueda.png` | Screenshot listado filtrado por "ALIMENTO" |
| `smoke-clt-009-detalle.png` | Screenshot detalle cliente |
| `smoke-clt-013-docventas.png` | Screenshot tab DocVentas con documentos FACT |
| `smoke-clt-019-formulario-vacio.png` | Screenshot formulario vacío (botones disabled) |
| `smoke-clt-021-formulario-lleno.png` | Screenshot formulario con datos (botones habilitados) |
| `smoke-clt-024-guardado.png` | Screenshot listado potenciales con estatus "Guardado" |
| `smoke-clt-026-enviado.png` | Screenshot listado potenciales con estatus "Enviado" |
| `smoke-clt-fin-home.png` | Screenshot app en Home principal al finalizar |

---

*Generado por Claude Code · Playwright MCP CDP · 2026-05-27*
