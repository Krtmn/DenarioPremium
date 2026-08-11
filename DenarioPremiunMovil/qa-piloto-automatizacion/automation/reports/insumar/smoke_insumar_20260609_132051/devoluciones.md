# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260609_132051_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Cliente / Playa | insumar (INSUMAR DISTRIBUIDOR) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Conexión | CDP `http://127.0.0.1:9220` |
| Estado inicial / final | HOME → HOME ✅ |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 2 N/A** |

## Datos de prueba
| Dato | Valor |
|------|-------|
| cliente_test | ADRIAN ARLET BASTARDO ALONZO (Cód 2738) |
| producto_test | TOMATES PELADOS MARY 24X400G (Cód 11293, familia ALIMENTOS) |
| factura_test | N/A (validateReturn=false) |

## VGs verificadas en DOM
| VG | Valor | Efecto observado |
|----|-------|------------------|
| validateReturn | false | tabs habilitan solo con cliente; sin invoice-selector ✅ |
| signatureReturn | true | acordeón "Firma" visible en tab Adjuntos ✅ |
| userCanUploadFiles | true | acordeón "Archivo" visible en tab Adjuntos ✅ |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Navega a `/devoluciones`; botones DEVOLUCIÓN y BUSCAR visibles |
| DM-DEV-002 | ✅ PASS | Form abre; tabs PRODUCTOS/ADJUNTOS `disabled`; `#clienteSelect` vacío |
| DM-DEV-004 | ✅ PASS | Cliente 2738 seleccionado → tabs habilitan; sin campo Factura (correcto con VG off) |
| DM-DEV-006 | ✅ PASS | Responsable/Precinto/Comentario editan; Tipo popover con [Calidad, PostVenta, Servicio]; Calidad (val=60) aplicado |
| DM-DEV-011 | 🚫 N/A | validateReturn=false → no existe invoice-selector; tabs habilitan solo con cliente (N/A estructural) |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO → ALIMENTOS → TOMATES PELADOS MARY; acordeón expande con Lote/NroFactura/FechaVenc/CantidadDevuelta/Unidad/Motivo |
| DM-DEV-014 | ✅ PASS | Cantidad Devuelta=5 → botón Enviar pasa de disabled a habilitado (Guardar ya activo) |
| DM-DEV-015 | ✅ PASS | Tab Adjuntos: acordeones Imágenes + Archivo + Firma visibles (las 3 VGs) |
| DM-DEV-016 | ✅ PASS | Guardar (`.imagenGuardar`) → alert "¡Su Devolución se ha guardado!" |
| DM-DEV-018 | ✅ PASS | Enviar → "¿Desea enviar?" ACEPTAR → "¡Su Devolución será enviada!" + "Devolución nro. 8 enviada exitosamente"; navega a home devoluciones |
| DM-DEV-019 | ✅ PASS | BUSCAR: lista con Nro.Ref, Cliente, Estatus, Fecha; Ref 8 (Enviado, 09/06/2026) en tope |
| DM-DEV-021 | ✅ PASS | Searchbar filtra en tiempo real: "ADRIAN" 8→5, "ZZZZNOEXISTE" →0, limpiar restaura; botón basura solo en estado Guardado |
| DM-DEV-022 | ✅ PASS | Devolución Guardada (Ref 0) abre form editable; cliente precargado; 3 tabs accesibles; Responsable editable (readOnly=false) |
| DM-DEV-024 | ✅ PASS | Botón basura → "¿Desea eliminar la devolución?" ELIMINAR → Guardada desaparece (0 guardadas restantes) |

## Registros creados en sistema
| Ref | Cliente | Tipo | Producto / Cant | Estado |
|-----|---------|------|-----------------|--------|
| Nro. 8 | 2738 - ADRIAN ARLET BASTARDO ALONZO | Calidad | TOMATES PELADOS MARY 24X400G / 5 | **ENVIADA** (persiste en sistema) |
| Nro. Ref: 0 | 2738 - ADRIAN ARLET BASTARDO ALONZO | — | TOMATES PELADOS MARY 24X400G / 3 | Guardada → **ELIMINADA** en DM-DEV-024 (no persiste) |

## Hallazgos
Ninguno. Sin FAIL. Comportamiento consistente con patrones de corridas previas
(`[ins-2606]`, `[gmp-2606]`, `[rom-2606]`): botones Guardar/Enviar icon-only por clase,
ion-input sin id por `.inp-write`, envío con 3 alertas (confirm + "será enviada" + "nro. X
enviada exitosamente"), borrado con confirmación CANCELAR/ELIMINAR, Guardada con Nro.Ref:0
(local sin sincronizar). N/A único: DM-DEV-011 por validateReturn=false (estructural, no FAIL).

## Notas operativas
- `require()` y `eval(fs.readFileSync)` NO disponibles en el contexto de `browser_run_code_unsafe`
  en esta corrida; los helpers (connectCdp, fillIonInput, clickAlertButton, clickBack, selectIonPopover)
  se inlinearon verbatim (Opción C de RUNTIME §1). connectOverCDP a `:9220` funcionó correctamente.
