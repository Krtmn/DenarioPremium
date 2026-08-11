# Smoke Test — Módulo DEVOLUCIONES
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-05-27 |
| **RUN_ID** | `20260527_113900_smoke-completo` |
| **Módulo** | DEVOLUCIONES |
| **Dispositivo** | 14678405BR003855 |
| **App** | `com.kiberno.denarioPremiumPro` — Versión 6.6.14 |
| **Credenciales** | `***`/`***` |
| **Resultado global** | 14 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-DEV-001 | Acceso al módulo Devoluciones desde Home → 2 botones | PASS | `APP-DEVOLUCIONES` visible; botones "DEVOLUCIÓN" y "BUSCAR" presentes en `/devoluciones` |
| DM-DEV-002 | Botón DEVOLUCIÓN → formulario con 3 tabs; Productos y Adjuntos deshabilitadas | PASS | 3 tabs presentes; General activa (`segment-button-checked`); Productos y Adjuntos con `disabled=true` (`segment-button-disabled`); campo Cliente vacío; botones guardar/enviar visibles |
| DM-DEV-004 | Seleccionar cliente → campo relleno y pestañas habilitadas | PASS | VG `validateReturn=true` activa: cliente "ALIMENTOS GOURMET CCC, C.A." seleccionado; campo Factura visible; tabs habilitadas tras seleccionar factura 20110662; comportamiento correcto según guión |
| DM-DEV-006 | Campos editables (Responsable, Precinto, Comentario, Tipo) | PASS | Responsable=`Test-DEV-006`, Precinto=`PREC-006`, Comentario=`Test-DEV-006 comentario` aceptados; selector Tipo con 4 opciones (Calidad, Distribución, PostVenta, Servicio) |
| DM-DEV-011 | Tab Productos → botón "Agregar Producto" visible | PASS | Tab Productos activa; botón "Agregar Producto" presente; al pulsarlo muestra lista de productos de la factura seleccionada (filtro por `validateReturn`) |
| DM-DEV-013 | Seleccionar producto → acordeón con campos Cantidad Devuelta, Unidad y Motivo | PASS | Acordeón expandido muestra: Lote, Nro Factura (prellenado 20110662), Cantidad Devuelta, Unidad (ion-select con valor por defecto), Motivo (ion-select con valor por defecto) |
| DM-DEV-014 | Ingresar cantidad devuelta → producto registrado en carrito | PASS | Cantidad=3 ingresada en "Cantidad Devuelta"; botones guardar/enviar habilitados (`imagenGuardar`, `imagenEnviar` con `disabled=false`) |
| DM-DEV-015 | Tab Adjuntos → acordeones Imágenes, Archivo y Firma visibles | PASS | `app-adjunto` visible; 3 acordeones: "Imágenes" (BUSCAR FOTO / TOMAR FOTO), "Archivo" (Subir Archivo), "Firma" (Borrar) — VGs `userCanUploadFiles` y `signatureReturn` activas |
| DM-DEV-016 | Guardar devolución → mensaje confirmación | PASS | Alert "Denario Devolución" con mensaje `¡Su Devolución se ha guardado!` (`DENARIO_DEV_TO_SAVE`); formulario permanece abierto; dismiss OK exitoso |
| DM-DEV-019 | Guardar + ir a BUSCAR → devolución aparece como "Guardado" | PASS | Lista BUSCAR muestra: Nro. Ref: 0, Cliente: 100146 - ALIMENTOS GOURMET CCC, C.A., Estatus: **Guardado**, Fecha: 27/05/2026 |
| DM-DEV-021 | Lista BUSCAR con filtro en tiempo real por cliente | PASS | Búsqueda "CERVECERIA" filtra de 9 a 4 ítems (solo CERVECERIA VALPARAISO C.A.); botón eliminar (trash/danger) aparece SOLO en devoluciones con Estatus "Guardado" |
| DM-DEV-022 | Abrir devolución "Guardado" → formulario editable con botones activos | PASS | Formulario carga con Cliente="ALIMENTOS GOURMET CCC, C.A.", Factura="20110662"; 3 tabs habilitadas; botones guardar/enviar visibles; fecha 27/5/2026 5:18 p.m. |
| DM-DEV-018 | Enviar devolución → modal de confirmación → "Enviado" | PASS | Alert "¿Desea enviar la devolución?" (`DENARIO_DEV_CONFIRM_SEND`) con Cancelar/Aceptar; al aceptar: mensaje `¡Su Devolución será enviada!`; app regresa a home módulo; en lista aparece Nro. Ref: 9 con Estatus: **Enviado** |
| DM-DEV-024 | Eliminar devolución "Guardado" → modal de confirmación y desaparece | PASS | Alert "¿Desea eliminar la devolución?" (`DENARIO_DEV_CONFIRM_DELETE`) con Cancelar/Eliminar; al confirmar, devolución desaparece de lista (de 10 → 9 ítems, 0 con Estatus "Guardado"); botón eliminar solo visible en Guardado |

## Hallazgos (solo si hay FAIL u observaciones importantes)

### Observaciones sin impacto en resultado (PASS)

1. **VG `validateReturn=true` activa**: El flujo de DM-DEV-004 requirió seleccionar cliente Y factura para habilitar tabs. El selector de facturas (`#InvoiceeSelectModal`) funcionó correctamente mostrando facturas del cliente (20110662, 20111151, 20111276, 20111283). Comportamiento según guión.

2. **VG `signatureReturn=true` y `userCanUploadFiles=true` activas**: Los 3 acordeones de Tab Adjuntos son visibles (Imágenes, Archivo, Firma). La captura efectiva de imágenes/archivos/firma no fue completada al requerir interacción con el SO Android (galería/cámara/canvas) fuera del alcance CDP.

3. **Screenshots**: El método `page.screenshot()` sobre el WebView CDP presenta timeout de fuentes en este entorno. Las evidencias se documentan vía snapshots DOM y evaluate JavaScript — funcionales para verificación automatizada.

4. **DM-DEV-018 estado final**: La devolución enviada aparece como "Enviado" (no "Por Enviar"). Esto puede indicar que la sincronización con servidor fue inmediata, o que `stDelivery` tomó el valor 1 (SENT) directamente. No es FAIL según el guión.

---
*Generado por Claude Code · Playwright MCP CDP · 2026-05-27*
