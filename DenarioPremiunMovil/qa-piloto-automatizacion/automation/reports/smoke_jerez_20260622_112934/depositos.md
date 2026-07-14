# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260622_112934_smoke-completo` |
| Módulo | DEPÓSITOS |
| Dispositivo | `14678405BR003855` |
| App | `com.kiberno.denarioPremiumPro` — v6.6.17 |
| Playa | jerez |
| Resultado | 11 PASS · 0 FAIL · 0 SKIP · 1 N/A |

**Aplica:** `modules.depositos.aplica=true` (colletionPayment incluye Efectivo, `multiCurrencyDeposit=true`). Módulo ejecutado.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Home Depósitos con botones DEPÓSITO y BUSCAR |
| DM-DEP-002 | ✅ PASS | Form con tabs GENERAL/COBROS/TOTAL/ADJUNTOS; campos Empresa/Moneda/Banco/Nro.Plantilla/Fecha Doc/Comentario; botones `imagenGuardar` e `imagenEnviar` **disabled** sin datos |
| DM-DEP-004 | ✅ PASS | Banco "Banesco Jerez Motors - ***" seleccionado (`.selectbanco`, value objeto); Cuenta read-only auto-llenada `0134....2087` |
| DM-DEP-005 | ✅ PASS | Fecha Doc abrió `fechasModal` con ion-datetime cargado en HOY (22/6/2026); asignado ISO + Aceptar → queda 22/6/2026 |
| DM-DEP-006 | ✅ PASS | Nro. Plantilla="QA-DEP-0622"; tras marcar cobro en Tab COBROS, "Monto total depositado: 79872.58 BS" y botón Guardar se **habilitó** (sin campo Monto libre) |
| DM-DEP-009 | ✅ PASS | Alert "Denario Depósito — El Depósito se ha guardado" (Aceptar) |
| DM-DEP-010 | ✅ PASS | BUSCAR renderizó lista con el depósito Guardado (Nro Ref 0, 79872.58 BS) — **defecto conocido NO reprodujo** |
| DM-DEP-014 | ✅ PASS | Reabrió Guardado con datos previos: banco, cuenta, Nro.Plantilla "QA-DEP-0622", Fecha Doc 22/6/2026 (oráculo persistencia OK) |
| DM-DEP-017 | ✅ PASS | Enviar → 3 alertas (Aceptar → OK → "Depósito nro. 3 enviado exitosamente" OK); Ref 0 → **Ref 3** real, navega a home |
| DM-DEP-018 | ✅ PASS | BUSCAR tras enviar renderizó lista; el ítem ahora "Nro Ref: 3 · Enviado · 79872.58 BS" — **defecto conocido NO reprodujo** |
| DM-DEP-019 | ✅ PASS | Enviado (Ref 3) = solo lectura: banco select disabled, sin Guardar/Enviar, tabs reducidas a GENERAL/TOTAL/ADJUNTOS (sin COBROS); lista: filas Enviado sin icono basura |
| DM-DEP-020 | 🚫 N/A | Tras enviar, no quedó ningún depósito en estado Guardado y el único cobro pendiente de depósito fue consumido → sin cobro disponible no se pudo crear otro Guardado para borrar. Confirmado en DM-DEP-019 que filas Enviado no tienen trash (trash solo en Guardado). Limitación de datos, no FAIL |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Depósito Nro Ref 3 | Banco BANESCO (Banesco Jerez Motors, cuenta 0134....2087), Empresa 1 INVERSIONES JEREZ MOTORS, Moneda BS, Nro.Plantilla QA-DEP-0622, Fecha Doc 22/6/2026, Monto 79872.58 BS (cobro vinculado: FERRETERIA MUNDIAL C.A., Ref cobro 8, 2026-06-22 12:02) | **Enviado** (Ref 0 → 3 asignado por servidor) |

## Datos descubiertos (consolidar en jerez.yaml)
- **depositos.banco:** "Banesco Jerez Motors - ***" — `idBankAccount:419, coBank:BANESCO, idBank:1, coAccount:CBA-BANESCO, nuAccount:0134....2087, coType:Cuenta`. Única cuenta receptora disponible (8º select banco con 1 opción).
- **depositos.moneda:** BS (default, localCurrency=true). Moneda select ofrece BS / USD (`multiCurrencyDeposit=true` confirmado en DOM).
- **Empresa:** 3 empresas (idEnterprise 1/2/3), default idEnterprise:1 INVERSIONES JEREZ MOTORS (coCurrencyDefault USD).
- **Cobro fuente:** FERRETERIA MUNDIAL C.A. (cliente de Empresa 2 según YAML) aparece como cobro pendiente de depósito en moneda BS — el Tab Cobros mostró 1 cobro pendiente, consumido al enviar.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Flujo envío jerez = 3 alertas | cliente | Igual que central_foods (no 2 como insumar): "El Depósito será enviado" Cancelar/Aceptar → "El Depósito será enviado" OK → "Depósito nro. N enviado exitosamente" OK; servidor asigna Nro Ref real (0 → 3) |
| Estado post-Enviar jerez = "Enviado" inmediato | cliente | Tras enviar end-to-end vía CDP, el ítem mostró `Estatus: Enviado` (no "Por Enviar") y Ref real 3 ya asignado — sync completó. Distinto a insumar [ins-2619] que quedó "Por Enviar" |
| Nro. Plantilla persiste al reabrir en jerez | cliente | Releído correctamente en Guardado (DM-DEP-014) y Enviado (DM-DEP-019) = "QA-DEP-0622". Confirma que el defecto H1 (Nro.Plantilla vuelve vacío) es específico de central_foods, no universal |
| Defecto DM-DEP-010/018/019/020 NO reprodujo en jerez | universal (evidencia para cierre) | Lista BUSCAR renderizó tras guardar Y tras enviar. Suma 5ª corrida limpia (rom/ins-2606/2610/2619, cf-2612, jerez-2622) — candidato firme a cerrar el defecto en `deposit.service.ts` |

> ✅ consolidado 2026-06-22

## Hallazgos (FAIL)
Ninguno.
