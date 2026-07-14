# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260624_125056_smoke-completo` |
| Módulo | CLIENTES |
| Cliente / Playa | jerez (multi-empresa, 3 empresas "INVERSIONES JEREZ MO") |
| App | `com.kiberno.denarioPremiumPro` |
| Empresa de prueba | **2** (idEnterprise=2, 00002 — clientes en ROJO con documentos) para 009/013/021/024/026/031; Empresa 1 para 002 inicial |
| Conexión | CDP `http://127.0.0.1:9220` (solo Playwright MCP) |
| Estado inicial / final | HOME / HOME ✅ |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` visible con 3 botones: CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL |
| DM-CLT-002 | ✅ PASS | Lista `app-client-list` con saldos BS y USD (multiCurrency). Emp 1: 3 clientes saldo 0. **Emp 2: 4 clientes con saldo > 0** |
| DM-CLT-003 | ✅ PASS | Búsqueda "FERRETERIA" (input "Clientes..." + botón search) filtró 4→1 (solo FERRETERIA MUNDIAL, C.A.) |
| DM-CLT-009 | ✅ PASS | Detalle de FERRETERIA MUNDIAL, C.A. (065027207): Nombre, RIF, Saldo BS 0,25 / USD 0,00, Crédito, Condición de Pago, Lista de Precio |
| DM-CLT-013 | ✅ PASS | Tab "Doc. de Venta" (`ion-segment-button[value="docVentas"]`) con leyenda Vigente/Vencido/A favor + tabla: doc **A *026088** USD 140,70 / BS 79.872,58 (venc 09/05/2026, 46 días) + fila IGTF. **Revierte el N/A de la corrida 2026-06-22** |
| DM-CLT-016 | ✅ PASS | `clickBack` desde lista → home clientes (3 botones); no salta a HOME |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` visible |
| DM-CLT-019 | ✅ PASS | Form potencial: 9 `ion-input` vacíos + `ion-select idEnterprise`; Guardar/Enviar disabled=true |
| DM-CLT-021 | ✅ PASS | Tras 8 campos obligatorios + empresa (idEnterprise=2): Guardar/Enviar disabled=false |
| DM-CLT-024 | ✅ PASS | Guardar → alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!" (OK). En BUSCAR aparece con Estatus: **Guardado**, Nro. Ref: 0 |
| DM-CLT-026 | ✅ PASS | Enviar → 3 alertas (confirm "¿Desea enviar...?" Cancelar/Aceptar → "será enviado" OK → "**nro. 3 creado exitosamente**" OK) → queda en home clientes. Estatus pasa a **Enviado**, Nro. Ref: **3** |
| DM-CLT-031 | ✅ PASS | Trash en potencial Guardado (`Test-CLT-DEL-...`) → **borrado directo sin confirmación previa**, solo alert "¡Cliente Potencial se borro con exito!" (OK) → desaparece de la lista |

## Registros creados en sistema

| Ref | Detalle | Estado final |
|-----|---------|--------------|
| Nro. Ref: 3 | `Test-CLT-SMOKE-130318` (RIF J123456789, empresa 2, tel 04141234567) | **Enviado** (persiste — cliente potencial real creado en sistema) |
| Nro. Ref: 0 | `Test-CLT-DEL-130538` (RIF J987654321, empresa 2) | **Borrado** (creado Guardado y eliminado en DM-CLT-031; no persiste) |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Selector de empresa en `app-client-list` | universal (multi-empresa) | `ion-select` visible (sin formcontrolname) cuyo `.value` es **objeto** `{idEnterprise, coEnterprise, lbEnterprise, coCurrencyDefault,...}`. Cambiar empresa: asignar `sel.value = opt.value` del `ion-select-option` con `idEnterprise===N` + `ionChange` → recarga lista. Las 3 opciones tienen mismo texto "INVERSIONES JEREZ MO" |
| Abrir detalle de cliente | universal | `mouse.click` en coords reales del `ion-item.listaItems` (centro). `dispatchEvent(MouseEvent)` en el `ion-item` también funciona como fallback. Clicar el `<div>`/`<p>` interno NO navega |
| Empresa en form potencial (jerez) | cliente | `ion-select[formcontrolname="idEnterprise"]`: 3 opciones (idEnterprise 1/2/3), **sin preselección** → Guardar exige seleccionar (contrasta con central_foods preseleccionado). Habilita con asignar `sel.value = opt.value` + ionChange |
| Borrado de potencial Guardado (jerez) | cliente | Botón basura = `ion-button` dentro del `ion-item` (x≈318). **Directo sin confirmación previa**, solo alert éxito (igual gmp/ins/cf) |
| Envío de potencial (jerez) | cliente | 3 alertas: confirm "¿Desea enviar nuevo Cliente Potencial?" (Cancelar/Aceptar) → "El cliente potencial será enviado" (OK) → "Cliente potencial nro. {ref} creado exitosamente" (OK) → queda en home clientes, NO HOME principal (igual insumar/central_foods) |
| Doc. de Venta jerez header | cliente | Columnas: Tipo / Nº Doc. / Moneda Doc. / Días Venc. / Tasa / Monto Base (+Conversión) / Monto IVA (+Conv) / Monto Descuento (+Conv) / Monto Total (+Conv) / Saldo (+Conv) / Fecha Doc. / Fecha Venc. / Comentario |

## Hallazgos

Sin FAIL. **Nota de actualización de dato de prueba (corrige el YAML):**

- En la corrida anterior (2026-06-22) DM-CLT-013 quedó **N/A** alegando que "ningún cliente tiene documentos de venta". Eso era cierto **solo en empresa 1** (azul). Siguiendo la instrucción de la QA, al cambiar a la **empresa 2** (clientes en rojo: FERRETERIA MUNDIAL, INVERSIONES MOTO REPUESTOS EL PODER DEL MONO, ISOLINA DEL CARMEN, MULTIREPUESTOS DRG), DM-CLT-013 se ejecuta y **PASA** con documentos reales. Sugerencia: actualizar el YAML — `cliente_detalle` con documentos = **"FERRETERIA MUNDIAL, C.A." (065027207, empresa 2)**, doc A *026088.
- Empresa 2, saldos de cartera observados: FERRETERIA MUNDIAL (BS 79.872,58 / USD 140,70), INVERSIONES MOTO REPUESTOS EL PODER DEL MONO (BS 747.986,52 / USD 1.317,62), ISOLINA DEL CARMEN (BS 54.014,75 / USD 95,15), MULTIREPUESTOS DRG (BS 610.948,57 / USD 1.076,22).
- Diferencia esperada: la lista muestra saldo agregado de documentos (79.872,58 BS); el detalle muestra saldo de cuenta corriente (0,25 BS) + créditos. No es FAIL.
