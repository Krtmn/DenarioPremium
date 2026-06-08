# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260605_162806_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Dispositivo | CDP http://127.0.0.1:9220 |
| App | `com.kiberno.denarioPremiumPro` |
| Cliente | globalmp |
| Resultado | **10 PASS · 0 FAIL · 0 SKIP · 2 N/A** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | `app-devoluciones` visible; botones DEVOLUCIÓN y BUSCAR presentes |
| DM-DEV-002 | ✅ PASS | Form abierto; tabs PRODUCTOS y ADJUNTOS `segment-button-disabled`; sin cliente |
| DM-DEV-004 | ✅ PASS | "BIG MARKET 22, C.A" seleccionado; modal cerró; tabs habilitadas (disabled=false); sin invoice-selector → validateReturn=false |
| DM-DEV-006 | ✅ PASS | Responsable="QA Automatizado", Precinto="PRECINTO-QA-001", Comentario="Prueba smoke devolucion globalmp"; Tipo=Calidad(60) por defecto |
| DM-DEV-011 | 🚫 N/A | validateReturn=false → sin campo Factura en nivel de formulario; campo Nro Factura existe a nivel de producto (requeridedNroFactura=true) |
| DM-DEV-013 | ✅ PASS | Tab PRODUCTOS → AGREGAR PRODUCTO → categorías visibles → CAPRI seleccionado → PASTA ESP. TALLARIN CORTO 12x500gr (PCE03) elegido; acordeón expandido con campos Lote, Nro Factura (inp-write), Fecha Venc, Cantidad Devuelta, Unidad, Motivo |
| DM-DEV-014 | ✅ PASS | Cantidad Devuelta=5; Nro Factura=FAC-TEST-001 (fillIonInput); botones imagenGuardar (x=245) e imagenEnviar (x=304) habilitados |
| DM-DEV-015 | ✅ PASS | Tab ADJUNTOS: 3 acordeones visibles — Imágenes ✓, Archivo ✓ (userCanUploadFiles=true), Firma ✓ (signatureReturn=true) |
| DM-DEV-016 | ✅ PASS | Click imagenGuardar → alert "¡Su Devolución se ha guardado!" |
| DM-DEV-018 | ✅ PASS | Click imagenEnviar → alert "¿Desea enviar la devolución?" → ACEPTAR → alert "¡Su Devolución será enviada!"; navega a home devoluciones |
| DM-DEV-019 | ✅ PASS | BUSCAR → lista muestra Nro.Ref: 166, BM17 - BIG MARKET 22 C.A, Estatus: Enviado, Fecha: 06/06/2026 |
| DM-DEV-021 | ✅ PASS | Searchbar filtra en tiempo real: "BIG" → 1 resultado; "ZZZNOMATCH" → 0 resultados; limpiar → 1 resultado |
| DM-DEV-022 | ✅ PASS | Click en devolucion Enviado → form abre con datos precargados (BIG MARKET 22, QA Automatizado, PRECINTO-QA-001); 3 tabs accesibles; imagenGuardar/imagenEnviar ocultos (comportamiento correcto para Enviado) |
| DM-DEV-024 | ✅ PASS | Devolucion Guardado (Ref:0) creada; click basura → alert "¿Desea eliminar la devolución?" → ELIMINAR → devolucion desaparece de lista |
| DM-DEV-024b | 🚫 N/A | No aplica eliminar desde interior form (no es caso separado en smoke) |

## VGs descubiertas

| VG | Valor | Evidencia |
|----|-------|-----------|
| `validateReturn` | **false** | Sin invoice-selector en DOM tras seleccionar cliente; tabs habilitadas directamente |
| `signatureReturn` | **true** | Acordeón "Firma" visible en Tab ADJUNTOS |
| `userCanUploadFiles` | **true** | Acordeón "Archivo" visible en Tab ADJUNTOS |
| `requeridedNroFactura` | **true** (inferido) | Campo "Nro Factura" con clase inp-write y ng-invalid en acordeón producto; Enviar se habilita solo al llenar ese campo |

## Datos de prueba confirmados

| Campo | Valor |
|-------|-------|
| `factura_test` | N/A — validateReturn=false; campo Factura global no existe. Nro Factura se ingresa por producto (libre, no searchable) |
| `producto_test` | PASTA ESP. TALLARIN CORTO 12x500gr · Código: PCE03 · Categoría: CAPRI |
| `cliente_test` | BIG MARKET 22, C.A (Código BM17) |
| Devolucion enviada Ref | 166 |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| 166 | BIG MARKET 22 / PASTA ESP. TALLARIN CORTO / Cantidad: 5 / Tipo: Calidad | Enviado |
| 0 (eliminado) | BIG MARKET 22 / PCE03 / Guardado → eliminado en DM-DEV-024 | Eliminado |

## Patrones nuevos descubiertos

| Patrón | Descripción |
|--------|-------------|
| `devolucion_btn_click` | Botón DEVOLUCIÓN en `devoluciones-container` requiere secuencia: `pg.mouse.click` → `keyboard.Enter` → `CDP Input.dispatchMouseEvent` → `evaluate(shadowBtn.click)` acumuladas; la combinación activa el zone listener Angular. CDP Input solo (sin pg.mouse anterior) no navega. |
| `buscar_btn_click` | Botón BUSCAR funciona con `CDP Input.dispatchMouseEvent` solo (sin acumulación previa). |
| `nro_factura_por_producto` | Campo "Nro Factura" existe dentro del acordeón de cada producto (no en nivel formulario). Clase `inp-write`, ng-invalid si vacío. Sin relación con validateReturn. |
| `guardar_enviar_header_fixed` | imagenGuardar (x≈267) e imagenEnviar (x≈326) están en el header fijo (y≈32), accesibles desde cualquier tab. |
| `eliminar_guardado_con_alerta` | Trash en lista → alert CANCELAR/ELIMINAR. |

## Hallazgos

Sin FAIL. Todo el flujo smoke completado satisfactoriamente.

**Estado final:** App en HOME · http://localhost/home
