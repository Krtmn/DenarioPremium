# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260619_173652_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa | insumar |
| Cliente test | ADRIAN ARLET BASTARDO ALONZO (Cód 2738) |
| VGs clave | validateReturn=false · signatureReturn=true · userCanUploadFiles=true |
| Resultado | **13 PASS · 0 FAIL · 0 SKIP · 1 N/A** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Click módulo → `/devoluciones`; botones DEVOLUCIÓN y BUSCAR visibles |
| DM-DEV-002 | ✅ PASS | Form abierto: tab General activa; Productos/Adjuntos `disabled=true`; sin cliente |
| DM-DEV-004 | ✅ PASS | Cliente "ADRIAN ARLET BASTARDO ALONZO (2738)" seleccionado → tabs Productos/Adjuntos habilitan. Campo Factura **ausente** (correcto: validateReturn=false) |
| DM-DEV-006 | ✅ PASS | Responsable/Precinto/Comentario editables (`fillIonInput` por id); Tipo cambiado Calidad(60)→PostVenta(52) vía popover |
| DM-DEV-011 | 🚫 N/A | Requiere validateReturn=true (selector Factura). insumar=false → no aplica |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO → árbol familias (ALIMENTOS 158/BEBIDAS 115) → TOMATES PELADOS MARY (11293) → acordeón con Lote/NroFactura/Cantidad(inp-write)/Unidad/Motivo/FechaVenc |
| DM-DEV-014 | ✅ PASS | Cantidad=3 en `.inp-write` → botón Enviar pasó disabled→enabled |
| DM-DEV-015 | ✅ PASS | Tab Adjuntos: 3 acordeones Imágenes(`images`) + Archivo(`file`, userCanUploadFiles) + Firma(`sign`, signatureReturn) |
| DM-DEV-016 | ✅ PASS | Guardar → alert "Denario Devolución / ¡Su Devolución se ha guardado!" (OK) |
| DM-DEV-018 | ✅ PASS | Enviar → 3 alertas: confirm "¿Desea enviar la devolución?" → "¡Su Devolución será enviada!" → "Devolución nro. 10 enviada exitosamente"; navega a home devoluciones |
| DM-DEV-019 | ✅ PASS | BUSCAR → lista renderiza; Ref 10 en tope: "Cliente: 2738 · Estatus: Enviado · Fecha: 19/06/2026" |
| DM-DEV-021 | ✅ PASS | Searchbar filtra realtime (filtro "1976" → 8 ítems a 2; limpiar → 8). Botón eliminar (`ion-button[color=danger]`) **solo** en fila Guardado, ausente en Enviado |
| DM-DEV-022 | ✅ PASS | Reabrir Guardado (Ref 0) → editable: cliente precargado, 3 tabs accesibles, Guardar/Enviar habilitados |
| DM-DEV-024 | ✅ PASS | Trash en Guardado → alert "¿Desea eliminar la devolución?" (Cancelar/Eliminar) → Eliminar → ítem desaparece (lista 9→8, Guardados 1→0); SIN alert de éxito posterior |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **Nro. 10** | Cliente 2738 ADRIAN ARLET BASTARDO ALONZO · TOMATES PELADOS MARY 24X400G (11293) · Cant 3 · Tipo PostVenta · NroFactura FAC-0619 | **Enviada** (sincronizada, correlativo real 10) |
| Ref 0 (local) | Cliente 2738 · TOMATES PELADOS MARY · Cant 2 · NroFactura FAC-G0619 | Guardada → **Eliminada en DM-DEV-024** (no persiste) |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Tabs DEVOLUCIONES values | universal | `ion-segment-button` values: General=`default`, Productos=`productos`, Adjuntos=`adjuntos`. Cambio fiable: `seg.value=val`+ionChange |
| Acordeón producto: orden ion-input | universal | idx 0=Lote, 1=NroFactura, 2=Cantidad(`.inp-write`); + 2 ion-select (Unidad/Motivo) + ion-datetime-button FechaVenc. Expandir con `grp.value=acc.value`+ionChange |
| Tipo devolución = 2º ion-select del acordeón-padre form | universal | en tab General el 1er ion-select es Empresa (preseleccionado), el 2º es Tipo (Calidad=60/PostVenta=52/Servicio=59). `selectIonPopover` por índice [1] |
| Botón atrás CDP NO navega en form Guardado reabierto (insumar) | cliente | `img.fechaAtras`→`<a>` (click sintético, mouse.click coords, 5-event pointer/mouse, click físico down/up) NO disparan navegación en una devolución Guardada reabierta. **Workaround fiable: `window.dispatchEvent(new PopStateEvent('popstate'))`** → vuelve a home devoluciones. Reconfirma `reapertura_ref0_cdp_inestable` del YAML (limitación de automatización, NO defecto de app) |
| Borrado Guardado sin alert de éxito | cliente | confirma `[ins-2610]`: alert previo "¿Desea eliminar la devolución?" (Cancelar/Eliminar) → ítem desaparece sin alert posterior |
| Envío = 3 alertas (insumar) | cliente | confirm "¿Desea enviar la devolución?" → "¡Su Devolución será enviada!" → "Devolución nro. X enviada exitosamente". (≠ central_foods que da 2) |

> ✅ consolidado 2026-06-19

## Hallazgos (solo si hay FAIL)

Sin FAIL. Nota operativa: el botón atrás vía CDP no navega en el formulario de una devolución Guardada reabierta — se resolvió con `popstate`. Es limitación de automatización ya documentada en el YAML, no defecto de la app.
