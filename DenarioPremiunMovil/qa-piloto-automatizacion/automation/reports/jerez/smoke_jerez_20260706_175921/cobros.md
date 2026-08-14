# Smoke Test — Módulo COBROS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_175921_smoke-completo` |
| Módulo | COBROS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` (build refactorizado El Yaque, `window.ng=false`) |
| Playa | jerez |
| Resultado | **29 PASS · 0 FAIL · 0 SKIP · 5 N/A · 0 BLOCKED** |

> Sin lectura de BD (corrida UI-only). Round-trips §9 (041/042 retención, 044/045 IGTF, 046 parcial, 047/039 fecha-tasa) ejecutados UI→UI (Guardar → reabrir desde BUSCAR → comparar 1:1).
> **Gateway empresa (H3):** el cambio de empresa (asignar value al 1º ion-select de `app-cobro-general` + ionChange → Aceptar alert de reinicio) **SÍ recargó los clientes emp2** de forma determinista SIN limpiar caché (estado fresco). Clientes emp2/3 con documentos alcanzables. 0 BLOCKED.

## Cliente(s) usado(s) (descubierto en runtime, UI)
- **cliente_test (sin docs, emp1):** JL Motors SE,C.A (J-506554950), saldo 0 → 001/002/004/021/028.
- **cliente CON documentos (emp2, ROJO):** MULTIREPUESTOS DRG (074820707) — 4 docs USD tipo A (vencidos/rojos): A*025589 (saldo BS 16.154,91), A*026279 (127.893,55), A*026299 (32.222,59), A*027326 (22.609,40). Usado para 007/008/034/040/012/043/041/042/046/047/029.
- **EL PODER DEL MONO (089129288, emp2):** 4 docs tipo A (sin docs tipo IGTF) → explorado para IGTF.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Módulo: botones COBRO, ANTICIPO/PREPAGO, RETENCIÓN, COBRO 25% IVA, BUSCAR (todos VG-driven) |
| DM-COB-002 | ✅ PASS | COBRO → 5 tabs; Documentos/Pagos/Total/Adjuntos `disabled`; Cliente vacío |
| DM-COB-004 | ✅ PASS | Seleccionar JL Motors → 4 tabs habilitadas (requiredComment=false, sin comentario) |
| DM-COB-006 | 🚫 N/A | requiredComment=false (estructural) |
| DM-COB-007 | ✅ PASS | Tab Documentos: lista + leyenda Vigente/Vencido/A favor |
| DM-COB-008 | ✅ PASS | Check doc A*025589 → Pagos "Monto total a pagar BS: 16.154,91" |
| DM-COB-015 | ✅ PASS | Tab Total: "Total General BS: 16.154,91" |
| DM-COB-033 | ✅ PASS | Selector moneda cobro (Tab General): BS↔USD, 2 opciones, habilitado |
| DM-COB-034 | ✅ PASS | Selector Moneda documento: BS→0 filas, USD→4 filas (filtra) |
| DM-COB-041 | ✅ PASS | Detalle A*026279: Nro Comp Ret 14díg + IVA 5,00 + ISLR 3,00 + Fecha → Pagos neto **127.885,55** (=saldo−8) |
| DM-COB-042 | ✅ PASS | Round-trip §9: reabrir Guardado → Pagos 127.885,55 **y** detalle IVA 5/ISLR 3/Nro/Fecha persisten (no revierte a bruto) |
| DM-COB-009 | ✅ PASS | "Agregar método de pago" → modal Efectivo/Depósito/Transferencia/Otros |
| DM-COB-040 | ✅ PASS | Efectivo monto=total → Diferencia BS 0,00 en **azul** |
| DM-COB-012 | ✅ PASS | Monto parcial (10.000) → Diferencia -6.154,91 **rojo** |
| DM-COB-043 | ✅ PASS | Rojo insuficiente → azul al cubrir (cambio de color correcto) |
| DM-COB-014 | ✅ PASS | Tab Total: tabla + acordeón; Pago BS 16.154,91, Tasa 623,02, Diferencia 0,00 |
| DM-COB-016 | ✅ PASS | Tab Adjuntos: acordeones Imágenes (BUSCAR/TOMAR FOTO) / Archivo / Firma |
| DM-COB-018 | ✅ PASS | Guardar → alert "El Cobro se ha guardado" |
| DM-COB-019 | ✅ PASS | Enviar (sin adjunto, requiredCollectionAttachments=false): 2 alertas ("El Cobro será enviado"→"Su Cobro será enviado"), queda "Por Enviar" sin 2ª alerta de adjunto |
| DM-COB-022 | ✅ PASS | BUSCAR: lista + searchbar; trash SOLO en Guardado (Por Enviar sin trash) |
| DM-COB-024 | ✅ PASS | Reabrir Guardado: form editable, Guardar/Enviar activos, monto 127.885,55 persiste |
| DM-COB-026 | ✅ PASS | Trash Guardado → "¿Desea eliminar el Cobro?" (Cancelar/Eliminar) → desaparece (1→0) |
| DM-COB-020 | ✅ PASS | Atrás con cambios → modal 3 opciones "Guardar y salir / Salir sin guardar / Cancelar" |
| DM-COB-021 | ✅ PASS | Cobro nuevo → "Salir sin guardar" → BUSCAR sin cambios (no se agrega) |
| DM-COB-038 | ✅ PASS | "Guardar y salir" → cobro parcial queda Guardado en BUSCAR |
| DM-COB-029 | ✅ PASS | Tipo RETENCIÓN (4 tabs sin Pagos) → doc A*025589 → Total → Guardar → "La Retención se ha guardado". Envío SKIP (retención siempre exige adjunto) |
| DM-COB-028 | ✅ PASS | ANTICIPO (4 tabs sin Documentos) → JL Motors → Efectivo 50,00 → Guardar → "El Anticipo se ha guardado"; BUSCAR: JL Motors "Guardado ... Anticipo" |
| DM-COB-036 | 🚫 N/A | userCanSelectIGTF=true pero SIN documento tipo IGTF elegible hoy (docs emp2 todos tipo A/FACT; sin selector IGTF en el form) — N/A por dato |
| DM-COB-044 | 🚫 N/A | ídem 036 — no hay cobro $ con documento IGTF elegible |
| DM-COB-045 | 🚫 N/A | ídem 036 |
| DM-COB-046 | ✅ PASS | Detalle A*026299: toggle "Pago parcial" ON + parcial 400,00 → Pagos "400,00" (no total 32.222,59); round-trip §9: reabrir → 400,00 persiste |
| DM-COB-047 | ✅ PASS | Cobro nuevo A*027326: Fecha tasa 29/6→4/6 → alert recálculo → monto 22.609,40→**20.335,83** (tasa 623,02→560,37); round-trip §9: reabrir → 20.335,83 + tasa 560,37 persisten |
| DM-COB-037 | 🚫 N/A | COBRO 25% IVA → selector cliente "No hay clientes disponibles" (cliente_25iva=null bajo nuevo set) |
| DM-COB-039 | ✅ PASS | Rama B (fecha tasa en Guardado): 623,02→560,37, monto 127.885,55→**115.024,75**; round-trip §9: reabrir → persiste. Rama A N/A (enabledManualRate=false) |

## Registros creados en sistema
| Ref/Cobro | Cliente / Detalle | Empresa | Estado UI |
|-----------|-------------------|---------|-----------|
| Cobro normal | MULTIREPUESTOS DRG · Efectivo BS 16.154,91 · doc A*025589 | emp2 | **Por Enviar** (enviado; sin cotejo BD) |
| Anticipo | JL Motors SE,C.A · Efectivo 50,00 | emp1 | **Guardado** (tipo Anticipo) |
| Cobro parcial | MULTIREPUESTOS DRG · doc A*026299 · parcial BS 400,00 | emp2 | **Guardado** |
| Cobro fecha-tasa | MULTIREPUESTOS DRG · doc A*027326 · BS 20.335,83 (tasa 04/06) | emp2 | **Guardado** |
| Retención (tipo cobro) | MULTIREPUESTOS DRG · doc A*025589 | emp2 | **Guardado** (pendiente envío manual: retención exige adjunto) |
| Cobro retención (041/042/039) | MULTIREPUESTOS DRG · doc A*026279 · IVA 5/ISLR 3 | emp2 | **Eliminado** en DM-COB-026 (tras validar round-trip) |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Gateway empresa recarga clientes vía CDP SIN limpiar caché | cliente (jerez) | Con estado fresco, asignar value al 1º `ion-select` de `app-cobro-general` (obj `{coEnterprise:'00002'}`) + `ionChange` → alert "Se ha detectado cambio del empresa..." (Cancelar/Aceptar) → **Aceptar** recarga `#clienteSelectModal` con clientes emp2 (con documentos). Reemplaza la nota H3-BLOCKED de `[jerez-2026-07-06]`: NO era límite permanente del harness, era estado local stale. |
| Retención detalle: habilitar IVA/ISLR requiere fijar **propiedad `.value` del ion-input** de Nro Comp Ret | cliente/universal | `fillNgModelField` con teclado NO bastaba para habilitar `Monto retenido IVA/ISLR` (seguían disabled). Solución: además de teclear, hacer `ionInput.value = inp.value` + emitir `input`/`keyup`/`ionInput`/`ionChange`/`blur`/`ionBlur`. Tras eso IVA/ISLR/Fecha Comp Ret pasan a `disabled=false`. |
| Fecha Comp Ret: `ion-datetime#calendar` oculto se revela clickeando el display, luego `dt.confirm()`+click Aceptar | cliente | Confirma patrón `[jerez-2026-07-06]`. |
| Detalle retención cierra en **silencio** (sin alert "La Retención se ha guardado") | cliente | El tipo-cobro Retención (029) SÍ da alert "La Retención se ha guardado"; el detalle-por-documento (041) NO — cierra el modal callado. Verificar por reapertura. |
| Selector moneda cobro = **2º** `ion-select` de `app-cobro-general`; Empresa = **1º**; Tasa read-only = **3º** | cliente/universal | Confirma y extiende `[jerez-2026-07-06]`. |
| Campo Monto (Pagos/parcial/retención): click coords + Ctrl+A+Delete + `keyboard.press('Digit'+ch)` por dígito de centavos + blur | cliente (jerez) | Técnica validada en 040/012/041/046/047/028 (montos formateados: 16.154,91→'1615491'; 400,00→'40000'; 50,00→'5000'). |
| Fecha Tasa recálculo (039/047) vía `setIonDatetime` inline (`dt.confirm()` + poll alert "Está cambiando la fecha de la tasa...") | cliente | SUPERADO el BLOCKED previo. Rango datetime min 04/06/2026 (inicio historial tasas) → max hoy. jerez: tasa 04/06 = 560,37 BS/USD vs 29/06 = 623,02. |

> ✅ consolidado 2026-07-06

## Notas
- **IGTF (036/044/045) N/A por DATO:** userCanSelectIGTF EFECTIVO=true, pero los clientes accesibles (emp2: MULTIREPUESTOS, EL PODER DEL MONO) solo tienen documentos tipo A (FACT) — ningún documento tipo IGTF elegible → no aparece selector IGTF en el form (scan de Documentos y Total = 0 menciones IGTF). Consistente con `[jerez-2026-07-06]` (docs IGTF drenados). Re-correr cuando exista un documento tipo IGTF vigente.
- **DM-COB-042 FAIL conocido NO reprodujo:** al reabrir, el monto neto de retención (127.885,55) y el detalle persisten correctamente → el fix está aplicado en este build (PASS, no el FAIL histórico de "vuelve al bruto").
- Dirty-guard COBROS jerez FIABLE vía CDP (no intermitente): `#alertSaveOrExit` (Guardar y salir / Salir sin guardar / Cancelar) y delete ("¿Desea eliminar el Cobro?") disparan consistentemente.
- Estado inicial HOME → estado final **HOME** confirmado.
