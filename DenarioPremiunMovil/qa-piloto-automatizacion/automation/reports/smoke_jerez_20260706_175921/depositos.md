# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_175921_smoke-completo` |
| Módulo | DEPÓSITOS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 (build refactorizado El Yaque, `window.ng=false`) |
| Playa | jerez |
| Cliente | jerez (`modules.depositos.aplica=true` confirmado) |
| Resultado | 4 PASS · 0 FAIL · 5 SKIP · 3 N/A |
| Estado inicial → final | HOME → HOME ✅ |

## Hallazgo principal (contexto de la corrida)

**No hay cobros Efectivo depositables en ninguna empresa (1/2/3, monedas BS y USD).** El cobro Efectivo creado en el módulo Cobros esta corrida (MULTIREPUESTOS DRG, emp2, BS 16.154,91, doc A*025589) figura **"Por Enviar"** en Cobros — no confirmado a nube, por lo tanto **sin `idCollection` de servidor** → un depósito vincula cobros por `collectionIds:[idCollection]`, y un cobro sin id de servidor no es depositable. La lista del Tab Cobros (`app-deposito-cobros`) quedó en 0 filas / 0 checkboxes / "Monto total depositado 0 BS", sin loader colgado, en las 3 empresas.

Consecuencia: el flujo end-to-end Guardar→Enviar de un depósito **con cobro vinculado no es ejecutable** esta corrida. **No es defecto del módulo Depósitos** (la exclusión de cobros no-enviados es correcta); es la condición aguas-arriba del cobro atascado "Por Enviar" (consistente con H1 no-persistencia / cola de salida El Yaque). El formulario de depósito en sí funciona (campos, validaciones, autocompletado banco/cuenta, picker fecha).

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Home `/depositos` (`app-depositos`) con botones DEPÓSITO y BUSCAR |
| DM-DEP-002 | ✅ PASS | Form `app-deposito`/`app-deposito-general`: campos Empresa(3), Fecha Depósito(calculada, disabled), Moneda(BS/USD), Banco, Fecha Doc, Nro. Plantilla, Comentario. Guardar+Enviar `disabled` sin datos |
| DM-DEP-004 | ✅ PASS | Banco `ion-select.selectbanco` = Banesco Jerez Motors (`idBankAccount:419`); cuenta read-only autocompletada `0134....2087` |
| DM-DEP-005 | ✅ PASS | Fecha Doc (`letrasFechasButton` idx 1) → modal `fechasModal` → `ion-datetime`=2026-07-06, confirmado con Aceptar del shadowRoot; modal cerró, campo = 6/7/2026 |
| DM-DEP-006 | 🚫 N/A (dato) | Nro. Plantilla `DEP175921` se llenó OK; **Guardar sigue disabled** porque no hay cobro depositable que seleccionar (VG correcta "Seleccione los Cobros a depositar"). Criterio "Guardar habilitado" no alcanzable sin dato |
| DM-DEP-009 | 🚫 N/A (dato) | Sin cobro depositable → no hay depósito que guardar |
| DM-DEP-010 | ⏭ SKIP | **Defecto conocido DM-DEP-010/018 (`deposit.service.ts`) REPRODUCIDO** — `app-deposito-list` renderiza searchbar pero loader "Por favor espere…" colgado, `ion-spinner` activo, 0 ítems tras 8s (2 intentos). No re-marcar FAIL (instrucción orquestador/RUNTIME §5) |
| DM-DEP-014 | ⏭ SKIP | Bloqueado por DM-DEP-010: la lista no presenta ítems clickables → imposible abrir un depósito Guardado |
| DM-DEP-017 | 🚫 N/A (dato) | Sin depósito nuevo que enviar (no se pudo crear por falta de cobro depositable) |
| DM-DEP-018 | ⏭ SKIP | = DM-DEP-010 (mismo defecto conocido reproducido, 2 intentos) |
| DM-DEP-019 | ⏭ SKIP | Bloqueado por DM-DEP-010: sin ítem en lista no se puede abrir depósito Enviado |
| DM-DEP-020 | ⏭ SKIP | Bloqueado por DM-DEP-010: sin ítem en lista no aparece botón basura de un Guardado |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Ninguno. No se pudo crear/guardar/enviar depósito: sin cobro Efectivo depositable (cobro emp2 quedó "Por Enviar", no depositable) | N/A |

## Oráculo §9 (round-trip Guardar→reabrir)

No ejecutable esta corrida: (a) no se pudo Guardar un depósito (sin cobro depositable) y (b) la lista BUSCAR no renderiza (defecto DM-DEP-010/018) → imposible reabrir un depósito existente. La observación previa del **picker Empresa que revierte a "INVERSIONES JEREZ 1" al reabrir un Guardado NO pudo re-verificarse** este run.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Nro. Plantilla input | universal | `ion-input` con propiedad JS `label`="Nro. Plantilla:" (NO atributo `label`/`placeholder`); atributo `value` muestra el binding literal sin interpolar `this.depositService.nuDocument`. Localizar por `i.label.startsWith('Nro. Plantilla')` |
| Comentario input | universal | `ion-input` con `label`="Comentario:" (binding `this.depositService.txComment`) |
| Empresa select (deposito-general) | cliente jerez | Sin clase específica; localizar por `option.value.idEnterprise`. 3 empresas: 1 INV JEREZ MOTORS VALERA (default, `enterpriseDefault:true`), 2 CARACAS, 3 TURMEREMO (todas `coCurrencyDefault:USD`). Cambio por **popover real** (click en ion-radio) recarga `app-deposito-cobros`; por DOM `value`+ionChange también fija el value |
| Moneda select | cliente jerez | option.value con `coCurrency`/`localCurrency`; BS(default, idCurrency:1) / USD(idCurrency:2). `multiCurrencyDeposit=true` confirmado en DOM |
| Banco `ion-select.selectbanco` | cliente jerez | Opción única `idBankAccount:419` BANESCO "Banesco Jerez Motors" cuenta `0134....2087` (CBA-BANESCO, cuenta corriente). Asignar value objeto + ionChange autocompleta el input cuenta read-only |
| Fecha Doc vs Fecha Depósito | cliente jerez | `letrasFechasButton` idx 0 = Fecha Depósito (disabled, timestamp completo "6/7/2026, 10:37 p. m."); idx 1 = Fecha Doc (editable, "6/7/2026"). Confirmar con Aceptar del shadowRoot del `ion-datetime` (no requirió botón externo del modal) |
| Tab Cobros = `app-deposito-cobros` | universal | Filas con `ion-checkbox`; cabecera "Selec / Cliente / Fecha Cob. / Referencia / Monto Depósito / Monto Cobro"; pie "Monto total depositado N BS". Vacío legítimo = 0 checkboxes SIN loader |
| Cobro no-enviado no es depositable | universal | Un cobro Efectivo en estado "Por Enviar" (sin `idCollection` de servidor) NO aparece en el Tab Cobros del depósito. Solo cobros con id de servidor (enviados) son depositables. Confirma el mecanismo `collectionIds:[idCollection]` |
| Dirty-guard back en DEPÓSITOS jerez | cliente jerez | Con form sucio (banco+Fecha Doc+Nro. Plantilla, sin cobro) el back (`img.fechaAtras`) **NO** disparó alerta "Denario Depósito" — navegó directo a depositos home. Contrasta con globalmp `[gmp-2611]` (sí dispara). Observación, no defecto |
| Defecto DM-DEP-010/018 intermitente | universal | Loader "Por favor espere…" colgado en `app-deposito-list` **REPRODUJO en jerez** esta corrida (2 intentos, ambos colgados). La corrida matutina `20260706_100801` NO reprodujo (lista renderizó). Confirma naturaleza intermitente del bug `deposit.service.ts` |

> ✅ consolidado 2026-07-06

## Hallazgos (FAIL)

Ninguno. 0 FAIL nuevos. El defecto DM-DEP-010/018 (lista BUSCAR no renderiza) es **conocido** (RUNTIME §5, `deposit.service.ts`) y por instrucción NO se re-marca FAIL; se documenta su reproducción intermitente esta corrida.

## Notas para el YAML de cliente

- `depositos`: confirmar que el flujo end-to-end depósito-con-cobro depende de que el cobro Efectivo esté **enviado a nube** (no "Por Enviar"). Esta corrida no tuvo cobro depositable → re-correr Depósitos solo cuando exista un cobro Efectivo ENVIADO (con Ref de servidor) pendiente de depósito.
- Observación empresa-revert (reabrir Guardado): sigue PENDIENTE de verificación con cotejo BD; no re-verificable este run por defecto de lista.
