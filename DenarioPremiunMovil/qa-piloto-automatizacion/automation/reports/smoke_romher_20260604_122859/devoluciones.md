# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260604_122859_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Dispositivo | CDP `:9220` |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Playa | El Yaque — `http://denarioelyaque.ddns.net:8081/PremiumWS/services/` |
| Resultado | **10 PASS · 0 FAIL · 0 SKIP · 1 N/A** |
| Cliente QA | SUPERMERCADO SIDON, C.A. — Código 0001000111 |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | `app-devoluciones` visible; botones DEVOLUCIÓN y BUSCAR presentes |
| DM-DEV-002 | ✅ PASS | Formulario abierto; tabs Productos y Adjuntos `disabled`; General habilitada; campo Cliente vacío |
| DM-DEV-004 | ✅ PASS | Cliente seleccionado via modal (búsqueda "SIDON" → click en `<p>` nombre); modal cerrado; tabs habilitadas; **NO apareció campo Factura** → `validateReturn=false` confirmado |
| DM-DEV-006 | ✅ PASS | Campos Responsable (`#responsable`), Precinto (`#precinto`), Comentario (`#comentario`) aceptan valores via `fillIonInput`. Tipo ion-select abre popover con opciones Calidad / PostVenta / Servicio |
| DM-DEV-011 | 🚫 N/A | `validateReturn=false` — no existe selector de factura a nivel formulario; tabs habilitadas directamente tras seleccionar cliente |
| DM-DEV-013 | ✅ PASS | Tab Productos → AGREGAR PRODUCTO → proveedor COLGATE → SUAVITEL FRESCA PRIMAVERA 1L (Código: 100985) seleccionado; acordeón expandido muestra campos Lote / Nro Factura / Fecha Venc / Cantidad Devuelta / Unidad / Motivo |
| DM-DEV-014 | ✅ PASS | Cantidad Devuelta (segundo `.inp-write`) llenado con "2"; `imagenGuardar` habilitado tras llenado |
| DM-DEV-015 | ✅ PASS | Tab Adjuntos muestra 3 acordeones: **Imágenes**, **Archivo**, **Firma** (canvas visible) |
| DM-DEV-016 | ✅ PASS | Click `imagenGuardar` → alert "¡Su Devolución se ha guardado!" |
| DM-DEV-018 | ✅ PASS | Flujo Enviar: 3 alertas — "¿Desea enviar la devolución?" → ACEPTAR → "¡Su Devolución será enviada!" → OK → "Devolución nro. **67** enviada exitosamente" → navega a home devoluciones |
| DM-DEV-019 | ✅ PASS | BUSCAR muestra lista con Nro. Ref: 67 (Enviado) + Nro. Ref: 0 (Guardado); datos: cliente, estatus, fecha |
| DM-DEV-021 | ✅ PASS | Searchbar filtra en tiempo real (ionInput); botón eliminar (danger, icon-only) visible solo en ítems Guardado |
| DM-DEV-022 | ✅ PASS | Click en ítem Guardado desde lista → formulario editable; 3 tabs accesibles; datos pre-cargados (Cliente SIDON, Responsable, Precinto, Comentario, Fecha) |
| DM-DEV-024 | ✅ PASS | Botón basura → alert "¿Desea eliminar la devolución?" → ELIMINAR → ítem desaparece de lista |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Devolución nro. 67 | Cliente: SUPERMERCADO SIDON C.A. · Producto: SUAVITEL FRESCA PRIMAVERA 1L (Cód. 100985) · Cantidad: 2 · Nro Factura: FAC-QA-001 · Motivo: Calidad | Enviado ✅ |
| Devolución local Ref:0 | Cliente: SIDON · Producto: SUAVITEL · Nro Factura: FAC-DEL-001 · Cantidad: 1 | **Eliminado** (prueba DM-DEV-024) |

---

## VGs y datos descubiertos

| Variable | Valor | Evidencia |
|----------|-------|-----------|
| `validateReturn` | **false** | Sin campo Factura a nivel formulario; tabs habilitadas directo tras seleccionar cliente |
| `signatureReturn` | **true** | Acordeón Firma con `<canvas>` visible en tab Adjuntos |
| `userCanUploadFiles` | **true** | Acordeón Archivo visible en tab Adjuntos |
| `factura_test` | `FAC-QA-001` | Nro Factura es campo requerido **dentro del acordeón de producto** (`.inp-write` index 0); sin este valor Enviar permanece disabled |
| `producto_test` | SUAVITEL FRESCA PRIMAVERA 1L — Código 100985 | Proveedor COLGATE, devolvible confirmado |

---

## Patrones nuevos descubiertos

| Código | Descripción |
|--------|-------------|
| P-ROM-DEV-001 | `devoluciones_nro_factura_por_producto_requerido` — El campo "Nro Factura" dentro del acordeón del producto es **required** (ng-invalid cuando vacío); sin este valor el botón Enviar permanece disabled aunque el resto del formulario sea válido |
| P-ROM-DEV-002 | `devoluciones_envio_tres_alertas` — Igual patrón que cobros/pedidos: confirm → "será enviada" → "nro. X enviada exitosamente" (3 interacciones) |
| P-ROM-DEV-003 | `devoluciones_tipo_popover_real_click` — Tipo ion-select abre popover; requiere click real en coordenadas (mouse.click) no dispatchEvent; opciones: Calidad / PostVenta / Servicio |
| P-ROM-DEV-004 | `devoluciones_cliente_modal_busqueda_igual_clientes` — Modal cliente en devoluciones usa mismo patrón que cobros: input `search-input` + button `clear-search` para filtrar + click en `<p>` del nombre para seleccionar |
| P-ROM-DEV-005 | `devoluciones_delete_confirmacion` — Alert "¿Desea eliminar la devolución?" con botones Cancelar / Eliminar |

---

## Estado final

App en **HOME** (`http://localhost/home`, `app-home` activo). ✅

---

*Ejecutado: 2026-06-04 · Agente: QA CDP Playwright · RUN_ID: 20260604_122859_smoke-completo*
