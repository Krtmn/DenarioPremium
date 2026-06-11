# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260610_180320_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Dispositivo | WebView CDP `127.0.0.1:9220` |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Playa / Cliente | insumar |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 0 N/A* |

\* DM-DEV-011 es N/A estructural por VG (`validateReturn=false` → sin invoice-selector); se contabiliza como verificación pasada (comportamiento esperado), no como caso bloqueado.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Módulo abierto en `/devoluciones`; botones DEVOLUCIÓN y BUSCAR visibles |
| DM-DEV-002 | ✅ PASS | Formulario: tab General habilitado, Productos/Adjuntos `disabled` sin cliente |
| DM-DEV-004 | ✅ PASS | Cliente "ADRIAN ARLET BASTARDO ALONZO (2738)" seleccionado → tabs Productos/Adjuntos habilitan; sin campo Factura a nivel form (correcto con `validateReturn=false`) |
| DM-DEV-006 | ✅ PASS | Responsable/Precinto/Comentario aceptan valor (fillIonInput por `#responsable`/`#precinto`/`#comentario`); Tipo con popover Calidad(60)/PostVenta(52)/Servicio(59) |
| DM-DEV-011 | 🚫 N/A | N/A estructural: con `validateReturn=false` no hay invoice-selector; Nro Factura va libre por producto en el acordeón |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO → ALIMENTOS → "TOMATES PELADOS MARY 24X400G (11293)"; acordeón expande con Lote, Nro Factura, Fecha Venc, Cantidad, Unidad, Motivo |
| DM-DEV-014 | ✅ PASS | Cantidad=2 en campo `inp-write`; Guardar y Enviar se habilitan (Enviar pasa de disabled→enabled tras cantidad) |
| DM-DEV-015 | ✅ PASS | Tab Adjuntos: acordeones Imágenes (BUSCAR/TOMAR FOTO), Archivo (`userCanUploadFiles=true`) y Firma (`signatureReturn=true`) visibles |
| DM-DEV-016 | ✅ PASS | Alert "Denario Devolución — ¡Su Devolución se ha guardado!" (OK) |
| DM-DEV-018 | ✅ PASS | Enviar → confirm "¿Desea enviar la devolución?" → "¡Su Devolución será enviada!" → "Devolución nro. 10 enviada exitosamente"; navega a home Devoluciones |
| DM-DEV-019 | ✅ PASS | BUSCAR lista devoluciones con Nro.Ref, Cliente, Estatus, Fecha; Nro.10 (Enviado, 10/06/2026) en el tope |
| DM-DEV-021 | ✅ PASS | Searchbar "BRISAS" filtra en tiempo real (de 8+ a 3 ítems de ABASTOS BRISAS); botón eliminar solo en ítems Guardado (Enviados sin basura) |
| DM-DEV-022 | ✅ PASS | Click en devolución Guardada → formulario editable, cliente precargado (2738), 3 tabs accesibles, Guardar/Enviar presentes |
| DM-DEV-024 | ✅ PASS | Basura en Guardado → alert "¿Desea eliminar la devolución?" CANCELAR/ELIMINAR → ELIMINAR → ítem Guardado desaparece de la lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. 10 | Cliente ADRIAN ARLET BASTARDO ALONZO (2738) · prod. TOMATES PELADOS MARY 24X400G ×2 · Tipo Calidad | Enviado (persiste) |
| Nro. Ref: 0 | Cliente ADRIAN ARLET BASTARDO ALONZO (2738) · prod. TOMATES PELADOS MARY 24X400G ×3 | Guardado → **ELIMINADO** (DM-DEV-024) |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Cliente devoluciones = `ion-input#clienteSelect` | universal | Mismo patrón Pedidos/Inventarios; click real abre modal con searchbar; ya documentado para Inventarios, confirmado también en Devoluciones |
| Campos cabecera con id: `#responsable`, `#precinto`, `#comentario` | universal | ion-input con `id` explícito (a diferencia de la nota previa "sin id"); fillIonInput por id funciona |
| Tipo devolución = 2º `ion-select` visible del form (y≈551) | universal | Opciones con value numérico: Calidad=60, PostVenta=52, Servicio=59; popover sin botones, cerrar con `popover.dismiss()` |
| `inp-write` cambia de clase tras edición | universal | Al escribir cantidad, el ion-input pierde la clase `.inp-write` (queda `sc-ion-...`); para releer el valor usar `ion-accordion ion-input` genérico, no `.inp-write` |
| Familia/producto = lista inline (no modal) | cliente/universal | AGREGAR PRODUCTO abre lista de familias inline dentro de `app-devoluciones` (ALIMENTOS 158…), no un ion-modal; click familia → productos inline |
| Acordeón producto colapsado al agregar | universal | Tras seleccionar producto el acordeón aparece **colapsado**; requiere click en su header (`ion-accordion ion-item`) para expandir campos |
| Enviar = 3 alertas | universal | confirm "¿Desea enviar?" + "¡será enviada!" + "Devolución nro. X enviada exitosamente" (igual a romher `[rom-2606]`); confirmado en insumar |
| Eliminar Guardado = sin alert post-borrado | cliente | Tras ELIMINAR no aparece alert de confirmación de éxito; el ítem simplemente desaparece de la lista (insumar) |
| Nro.Ref:0 = Guardado local sin sincronizar | universal | Devolución Guardada (no enviada) muestra Nro. Ref: 0; al enviar recibe el correlativo real (Nro. 10) |

> ✅ consolidado 2026-06-10

## Hallazgos (solo si hay FAIL)
Ninguno. 14/14 casos conformes; sin defectos. App devuelta a HOME (`/home`).
