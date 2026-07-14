# Smoke Test — Módulo DEVOLUCIONES
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_100801_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` |
| Cliente / Playa | jerez (El Yaque) |
| Resultado | 4 PASS · 0 FAIL · 0 SKIP · 10 N/A · 0 BLOCKED |
| Cotejo BD | OMITIDO por diseño de esta corrida (sin manifiesto, sin §10) |

## Determinación clave — facturas devolvibles
**NO existen facturas sincronizadas devolvibles** (dentro de `mesesFacturas=3`) para ningún cliente accesible en el módulo Devoluciones.

- El selector de cliente de Devoluciones lista **solo 3 clientes** (empresa 1, todos saldo 0, sin documentos): DANIELA HERNANDEZ F.P. (V161051485), Inversiones J.L Moto Piezas C.A (J-50163353-3), JL Motors SE,C.A (J-506554950). Los clientes con documentos de cobros (empresas 2/3, ROJO) **no aparecen** en el selector de Devoluciones.
- Verificado en UI abriendo el modal de Factura (`#InvoiceeSelectModal`) para **2 clientes** (JL Motors SE y DANIELA): en ambos el modal lista **0 facturas** (searchbar presente, sin filas de factura).
- Con `validateReturn=true`, sin factura no se habilitan los tabs Productos/Adjuntos → **imposible crear devolución** → los 10 casos dependientes de factura son **N/A estructural** (ausencia de datos de prueba, NO defecto de app). Confirma la nota del YAML jerez (devoluciones sin facturas devolvibles).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Módulo abre; botones DEVOLUCIÓN y BUSCAR visibles (app-devoluciones, /devoluciones) |
| DM-DEV-002 | ✅ PASS | Form abre; tabs Productos/Adjuntos `disabled`, General enabled, sin cliente |
| DM-DEV-004 | ✅ PASS | Cliente seleccionado (JL Motors SE,C.A); campo Factura visible (`#invoiceSelect` + label "Factura:") — validateReturn=true confirmado en UI |
| DM-DEV-006 | ✅ PASS | Responsable/Precinto/Comentario aceptan valores; Tipo devolución = Calidad(60,default)/PostVenta/Servicio (sin "Cambio X Cambio", igual piercar) |
| DM-DEV-011 | 🚫 N/A | Modal Factura lista 0 facturas devolvibles (2 clientes verificados) → sin factura no se habilitan tabs |
| DM-DEV-013 | 🚫 N/A | Depende de factura (tab Productos requiere tabs habilitados) |
| DM-DEV-014 | 🚫 N/A | Depende de factura (cantidad en acordeón de producto de factura) |
| DM-DEV-015 | 🚫 N/A | Tab Adjuntos requiere tabs habilitados → depende de factura (no se pudo verificar acordeones Firma/Archivo por VG) |
| DM-DEV-016 | 🚫 N/A | Guardar requiere producto de factura |
| DM-DEV-018 | 🚫 N/A | Enviar requiere devolución válida |
| DM-DEV-019 | 🚫 N/A | Vista BUSCAR renderiza (searchbar presente) pero lista vacía; jerez no tiene devoluciones creadas (no se pueden crear sin factura) → lista vacía esperada, no defecto |
| DM-DEV-021 | 🚫 N/A | Filtro de searchbar no verificable sin items en lista |
| DM-DEV-022 | 🚫 N/A | Sin devoluciones Guardadas para abrir |
| DM-DEV-024 | 🚫 N/A | Sin devoluciones Guardadas para eliminar |

## Registros creados en sistema
Ninguno — no fue posible crear ninguna devolución (sin facturas devolvibles).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Modal Factura muestra alert "cambio de factura" residual | universal (candidato) | Al abrir `#InvoiceeSelectModal` sin facturas, el `ion-content` del modal muestra el texto de un ion-alert "¡Alerta! Se ha detectado cambio de la factura por lo que deberá iniciar nuevamente la devolución. Aceptar/Cancelar"; los botones del alert viven en ion-alerts portaled fuera del modal (no clicables desde el modal). Acumulación de ~26 ion-alert ocultos residuales (consistente con nota don-theo `[dth-2612]`). Limpiar con `ion-alert.dismiss()` + remover backdrops huérfanos antes de navegar. |
| Selector cliente Devoluciones ≠ selector cliente Cobros | cliente (jerez) | Devoluciones lista solo los 3 clientes de empresa 1 (saldo 0, sin docs); los clientes con documentos de empresas 2/3 no aparecen → sin facturas devolvibles por diseño de datos |
| Tipo devolución jerez | cliente (jerez) | Calidad(60,default)/PostVenta/Servicio — sin "Cambio X Cambio"(63), como piercar |

> ✅ consolidado 2026-07-06

## Estado
Inicial HOME → Final **HOME** (confirmado, app-home visible, /home).
