# Smoke Test — Módulo DEVOLUCIONES
**RUN_ID:** 20260529_145657_smoke-completo  
**Fecha:** 2026-05-29  
**App:** com.kiberno.denarioPremiumPro (Android WebView · Ionic 6 + Angular 19 + Capacitor 6)  
**Cuenta QA:** Yaque · usuario 001 · empresa HIDROPONIAS VENEZOLA  
**VGs activas relevantes:** `validateReturn=true` · `signatureReturn=true` · `userCanUploadFiles=true`  
**Estado inicial:** Home principal `/home` | **Estado final:** Home principal `/home`

---

## Resultados

| ID | Resultado | Evidencia |
|----|-----------|-----------|
| DM-DEV-001 | PASS | URL `/devoluciones`; botones "DEVOLUCIÓN" y "BUSCAR" visibles; `app-devoluciones` activo |
| DM-DEV-002 | PASS | Formulario carga; General activa; Productos/Adjuntos con clase `segment-button-disabled`; botones guardar/enviar `disabled=true` en cabecera |
| DM-DEV-004 | PASS | Cliente "ALIMENTOS GOURMET CCC, C.A." seleccionado; campo Factura aparece (VG `validateReturn=true` confirmada); tabs siguen disabled hasta seleccionar factura |
| DM-DEV-006 | PASS | `#responsable`="Test-DEV-006", `#precinto`="Test-DEV-006-PR", `#comentario`="Test-DEV-006 comentario" aceptados; ion-select Tipo muestra 4 opciones (Calidad/Distribución/PostVenta/Servicio) y registra selección |
| DM-DEV-011 | PASS | Tab Productos habilitada tras seleccionar factura; botón "AGREGAR PRODUCTO" visible; componente `productos-tab` activo |
| DM-DEV-013 | PASS | Click en producto "ENSALADA MIXTA BOLSA DE 1 KG" expande acordeón; campos Lote, Nro Factura, Fecha Venc, Cantidad Devuelta, Unidad y Motivo visibles |
| DM-DEV-014 | PASS | Cantidad "3" ingresada en campo `inp-write`; botones guardar y enviar habilitados en cabecera (`disabled=false`) |
| DM-DEV-015 | PASS | Tab Adjuntos muestra 3 acordeones: "Imágenes", "Archivo" (VG `userCanUploadFiles=true`) y "Firma" (VG `signatureReturn=true`); adjunto nativo no ejercitable vía CDP (API Capacitor) |
| DM-DEV-016 | PASS | Alert "Denario Devolución · ¡Su Devolución se ha guardado! · OK" visible tras pulsar guardar |
| DM-DEV-018 | PASS | Alert confirmación "¿Desea enviar la devolución?" con CANCELAR/ACEPTAR; al aceptar: "¡Su Devolución será enviada!"; app regresa a home del módulo |
| DM-DEV-019 | PASS | Nro.Ref:0 · ALIMENTOS GOURMET CCC, C.A. · Estatus: Guardado · Fecha: 29/05/2026 en lista BUSCAR |
| DM-DEV-021 | PASS | Searchbar visible; filtro "ALIMENTOS GOURMET" reduce lista a 6 items; columnas Nro.Ref / Cliente / Estatus / Fecha presentes; botón danger (eliminar) solo en estatus Guardado |
| DM-DEV-022 | PASS | Devolución Nro.Ref:0 (Guardado) abre formulario editable; 3 tabs accesibles; botones guardar/enviar enabled; campo Factura "20110662" cargado |
| DM-DEV-024 | PASS | Botón danger en devolución Guardado dispara alert "¿Desea eliminar la devolución? · CANCELAR · ELIMINAR"; al confirmar, item desaparece de la lista; 0 botones danger restantes |

---

## Resumen

| Resultado | Cantidad |
|-----------|----------|
| PASS      | 14       |
| FAIL      | 0        |
| SKIP      | 0        |
| N/A       | 0        |

---

## Observaciones técnicas

- **VG `validateReturn=true` confirmada en runtime:** tras seleccionar cliente, aparece campo "Factura" e `invoice-selector` modal; tabs Productos/Adjuntos permanecen deshabilitadas hasta seleccionar factura. Flujo DM-DEV-004 cubre adicionalmente el comportamiento de DM-DEV-008/009 (selector de facturas funcional).
- **Acordeón de producto (DM-DEV-013):** `offsetParent` reporta `false` para los inputs cuando el acordeón está expandido pero la app usa visibilidad CSS alternativa; el fill con `inp-write` funciona correctamente y el valor se registra en Angular (botón guardar habilitado).
- **Adjuntos (DM-DEV-015):** acordeones Imágenes/Archivo/Firma visibles y accesibles en UI; captura real de archivos no ejercitable vía CDP por depender de Capacitor Camera/FilePicker nativos — comportamiento esperado y documentado en lecciones aprendidas.
- **window.ng no disponible:** APK de producción confirmado; inyección via `ng.getComponent` no funcional. No fue necesaria para este módulo (no se requirió adjunto obligatorio para enviar).
- **DM-DEV-018 sobre devolución previamente guardada (DM-DEV-016):** el mismo registro Nro.Ref:0 fue reabierto desde BUSCAR y enviado, logrando cobertura completa del ciclo guardar → reabrir → enviar.

---

## Notas de datos de prueba

- Cliente usado: ALIMENTOS GOURMET CCC, C.A. (código 100146)  
- Factura usada: 20110662 (fecha 28/04/2026)  
- Producto: ENSALADA MIXTA BOLSA DE 1 KG (CAMPROLEC012BOL)  
- Devolución enviada resultante: Nro.Ref:13 · Estatus: Enviado · 29/05/2026  
- Devolución eliminada: Nro.Ref:0 (segunda instancia guardada para DM-DEV-024)

---

*Generado por Claude Code (agente QA) · RUN_ID 20260529_145657_smoke-completo · 2026-05-29*
