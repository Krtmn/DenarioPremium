# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260603_093706_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — Chrome/148.0.7778.179 (Android 15, Infinix X6728) |
| Playa | insumar (Isla Coche — `denarioislacoche.ddns.net:8081`) |
| Resultado | **11 PASS · 0 FAIL · 0 SKIP · 1 N/A** |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | `app-devoluciones` activo; botones DEVOLUCIÓN y BUSCAR visibles |
| DM-DEV-002 | ✅ PASS | Tab Productos y Adjuntos `disabled`; General habilitado; sin cliente seleccionado |
| DM-DEV-004 | ✅ PASS | Cliente "ADRIAN ARLET BASTARDO ALONZO" (Cód 2738) seleccionado; todos los tabs habilitados inmediatamente → **validateReturn = false** confirmado |
| DM-DEV-006 | ✅ PASS | Responsable="QA Tester", Precinto="PREC-001", Comentario="Prueba smoke QA" aceptados; popover Tipo abrió con opciones: Calidad / PostVenta / Servicio (valor previo=60) |
| DM-DEV-011 | 🚫 N/A | validateReturn=false — no aparece campo Factura, tabs habilitadas sin seleccionar factura |
| DM-DEV-013 | ✅ PASS | Tab Productos → AGREGAR PRODUCTO → familia ALIMENTOS → producto TOMATES PELADOS MARY 24X400G (Cód 11293); acordeón expandido con campos: Lote, Nro Factura, Fecha Venc, Cantidad Devuelta, Unidad, Motivo |
| DM-DEV-014 | ✅ PASS | Lote="LOTE-QA-001", Cantidad=2 llenados (clase `inp-write`); botones Guardar (`imagenGuardar`) y Enviar (`imagenEnviar`) visibles y habilitados en toolbar header |
| DM-DEV-015 | ✅ PASS | Tab Adjuntos muestra 3 acordeones: Imágenes (BUSCAR FOTO / TOMAR FOTO), Archivo (Subir Archivo), Firma (Borrar) → **signatureReturn=true** y **userCanUploadFiles=true** confirmados |
| DM-DEV-016 | ✅ PASS | Alert "Denario Devolución — ¡Su Devolución se ha guardado!" con botón OK |
| DM-DEV-018 | ✅ PASS | Enviar → alert "¿Desea enviar la devolución?" CANCELAR/ACEPTAR → ACEPTAR → alert "¡Su Devolución será enviada!" → navegó a home devoluciones |
| DM-DEV-019 | ✅ PASS | BUSCAR muestra 7 registros; Nro.Ref:7 (ADRIAN ARLET BASTARDO ALONZO, Enviado, 03/06/2026) creado en esta corrida |
| DM-DEV-021 | ✅ PASS | Searchbar (placeholder "Devoluciones...") filtra en tiempo real via ionInput; texto "ABASTOS" → 3 resultados de 7 |
| DM-DEV-022 | ✅ PASS | Click en Nro.Ref:0 (Guardado) abre formulario editable; Cliente pre-cargado, 3 tabs accesibles |
| DM-DEV-024 | ✅ PASS | Basura → alert "¿Desea eliminar la devolución?" CANCELAR/ELIMINAR → ELIMINAR → Nro.Ref:0 desaparece; lista vuelve a 7 items |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. Ref: 7 | ADRIAN ARLET BASTARDO ALONZO (Cód 2738) · TOMATES PELADOS MARY 24X400G (Cód 11293) · Lote LOTE-QA-001 · Cant: 2 · Fecha: 03/06/2026 | Enviado |
| Nro. Ref: 0 (local) | ADRIAN ARLET BASTARDO ALONZO (Cód 2738) · TOMATES PELADOS MARY 24X400G · Cant: 1 · Fecha: 03/06/2026 | Eliminado (DM-DEV-024) |

---

## Hallazgos y observaciones (sin FAIL)

### VGs descubiertas en esta corrida

| VG | Valor confirmado | Evidencia |
|----|-----------------|-----------|
| `validateReturn` | **false** | Al seleccionar cliente todos los tabs se habilitaron inmediatamente; no apareció campo Factura |
| `signatureReturn` | **true** | Tab Adjuntos muestra acordeón "Firma" con botón Borrar |
| `userCanUploadFiles` | **true** | Tab Adjuntos muestra acordeón "Archivo — Subir Archivo" |

### Datos de producto descubiertos

| Campo | Valor |
|-------|-------|
| `producto_test` | TOMATES PELADOS MARY 24X400G |
| `producto_code` | 11293 |
| `producto_familia` | ALIMENTOS |
| Estructura prod | familias → click expande → productos (igual a Pedidos) |

### Patrones nuevos observados

1. **Botones Guardar/Enviar son icon-only** — clase `imagenGuardar` / `imagenEnviar`, sin texto visible. Búsqueda por texto falla; usar selector de clase.
2. **Accordion campos** — Lote, Nro Factura, Fecha Venc, Cantidad Devuelta (inp-write, required), Unidad (select), Motivo (select). Más campos que el smoke guide anticipaba.
3. **Tipo popover** — 3 opciones: Calidad / PostVenta / Servicio. Valor default=60 (confirmar mapping con backend).
4. **Delete con confirmación** — alerta "¿Desea eliminar la devolución?" CANCELAR/ELIMINAR (consistente con Pedidos lista, distinto a Clientes que es directo).
5. **Nro.Ref=0** en estado Guardado local (igual a Pedidos — sin sincronizar tiene ref=0).
6. **CDP port forward** — proceso WebView cambió de PID 29712 a 5121 al inicio; re-establecer con `adb forward tcp:9220 localabstract:webview_devtools_remote_5121` fue necesario.
7. **require() no disponible** en browser_run_code_unsafe MCP — usar `connectOverCDP` con `ws://127.0.0.1:9220/devtools/browser` directamente.
8. **fillIonInput por posición** — los ion-input de devoluciones no tienen `id` como atributo DOM (es propiedad JS); seleccionar por clase `inp-write` para Cantidad o por posición en lista visible.

### Estado final

App en HOME (`http://localhost/home`, `app-home` activo).

---

*Ejecutado: 2026-06-03 · Agente QA automatizado — Playwright MCP + CDP :9220*
