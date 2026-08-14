# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260713_115814_smoke-completo` |
| Módulo | DEPÓSITOS |
| Dispositivo | `14678405BR003855` |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 (El Yaque DM ELECTRONIC) |
| Cliente | dm-electronica (BOTZ) |
| `depositos.aplica` | **true** (Efectivo en métodos de cobro) — pero **sin cobros/bancos depositables al momento** (ver abajo) |
| Resultado | **3 PASS · 0 FAIL · 0 SKIP · 9 N/A · 0 BLOCKED** |

## Contexto de datos (por qué 9 N/A)

`depositos.aplica=true` estructuralmente, pero el flujo end-to-end de creación de depósito **no fue ejecutable** en esta corrida por condición de dato, **NO por defecto del módulo**:

- El `ion-select.selectbanco` abre popover con **`ng-for-of` VACÍO (0 opciones)** — confirmado en 2 lecturas independientes.
- El **Tab Cobros** no expone cobros depositables (0 checkboxes; sin `app-deposito-cobros` poblado).
- El cobro Efectivo enviado en esta corrida (**id_collection=5**, TIENDAS RORIX, BS 6.025.296,96, confirmado en nube por el agente Cobros) **aún no volvió al device como cobro depositable** — los depositables provienen de cobros Efectivo ENVIADOS ya sincronizados de vuelta a la nube→device, y la propagación no ocurrió en la ventana de la corrida (mecanismo confirmado `[jerez-2026-07-06][ferrenuestro-2026-07-07]`).

Esto coincide con la guía explícita del prompt ("selector de banco/cobros vacío → N/A con motivo, NO FAIL") y con el oráculo de `module-selectors/depositos.md` (selectbanco con 0 opciones = sin cobros pendientes de depositar). El formulario en sí **opera correctamente** (Empresa, Moneda BS/US$, Fecha Doc datetime, Nro. Plantilla, Comentario, botones Guardar/Enviar deshabilitados sin datos válidos).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Módulo Depósitos abre `app-depositos` con botones **DEPÓSITO** y **BUSCAR** |
| DM-DEP-002 | ✅ PASS | DEPÓSITO → `app-deposito`: Empresa (BOTZ), Fecha Depósito (disabled/calculada), Moneda, Banco (`selectbanco`), Nro. Plantilla, Fecha Doc (editable), Comentario. **Guardar y Enviar deshabilitados** sin datos |
| DM-DEP-004 | 🚫 N/A | `ion-select.selectbanco` popover con `ng-for-of` VACÍO (0 bancos/cobros depositables) — sin cobros depositables al momento |
| DM-DEP-005 | ✅ PASS | Fecha Doc (`letrasFechasButton` editable) → modal `ion-datetime`; set ISO + `ionChange` + Aceptar (shadow) → modal cierra, Fecha Doc = 13/7/2026 confirmada |
| DM-DEP-006 | 🚫 N/A | Guardar no habilita sin cobros seleccionados (VG "Sin cobros → Guardar no habilita") — comportamiento esperado, no evaluable sin cobros depositables |
| DM-DEP-009 | 🚫 N/A | No se puede guardar un depósito válido sin cobros depositables (monto se deriva de cobros seleccionados) |
| DM-DEP-010 | 🚫 N/A | BUSCAR abre `app-deposito-list` **limpio** (searchbar, 0 ítems, **sin spinner colgado**) — defecto de render NO reprodujo; pero no hay depósito creado en la corrida que listar |
| DM-DEP-014 | 🚫 N/A | Sin depósito Guardado que reabrir |
| DM-DEP-017 | 🚫 N/A | Sin depósito que Enviar |
| DM-DEP-018 | 🚫 N/A | No se guardó depósito → no aplica; **defecto conocido `deposit.service.ts` NO reprodujo** (lista renderizó limpia con 0 ítems) |
| DM-DEP-019 | 🚫 N/A | Sin depósito Enviado que abrir en solo lectura |
| DM-DEP-020 | 🚫 N/A | Sin depósito Guardado con botón basura |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Ninguno — no fue posible crear depósito (sin cobros/bancos depositables) | N/A |

## Verificación BD (§10)
- **Baseline nube (`deposit`):** total=0, maxid=0 (query.js OK al inicio).
- **Re-chequeo final:** `ERR: remaining connection slots reserved` (slots agotados por agentes BD en paralelo) → **BD-N/A** (blindaje §10; la BD nunca tumba el smoke).
- **Sin registro creado** → no hay cotejo guardado→enviado pendiente. 0 payloads `depositservice/deposit` capturados (nada enviado). Marca módulo: **BD-N/A (no registro)**.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **dm-electronica `depositos.aplica=true` pero SIN dato depositable en la corrida** | cliente | El cobro Efectivo enviado (id_collection=5) no propagó de vuelta al device como depositable dentro de la ventana de la corrida; `selectbanco` `ng-for-of` vacío + Tab Cobros vacío. Confirma mecanismo `[jerez/ferrenuestro]`: depositables = cobros Efectivo ENVIADOS ya re-sincronizados, no los recién enviados. Sugerencia YAML: nota "confirmar propagación de cobro depositable antes de depósitos, o correr depósitos tras un ciclo de sync completo". |
| **Build El Yaque v6.6.18: `app-deposito` con 3 ion-selects** | cliente/build | idx0=Empresa (BOTZ, con opciones), idx1=Moneda (BS/US$, funciona), idx2=`selectbanco` (Banco). 2 `letrasFechasButton`: idx0 Fecha Depósito disabled/calculada ("DD/M/YYYY, H:MM"), idx1 Fecha Doc editable ("DD/M/YYYY", init hoy). Nro. Plantilla y Comentario por `ion-input.label`. Coincide con jerez/ferrenuestro El Yaque. |
| **Fecha Doc datetime: set `dt.value` ISO + `ionChange` + `confirmDatetime` (shadow Aceptar)** | universal | Modal `ion-datetime` en `ion-modal:not(.overlay-hidden)`; `window.__qaH.confirmDatetime('ion-modal:not(.overlay-hidden) ion-datetime')` cierra el modal y persiste la fecha. Sin botón Aceptar propio del modal (el Aceptar vive en shadow del ion-datetime). |
| **Dirty-guard back NO dispara con Fecha Doc re-fijada al mismo valor** | cliente/build | `clickBack` con Fecha Doc = valor inicial (hoy) no marcó dirty → navegó directo a depositos home sin alerta "Denario Depósito". Consistente con jerez `[jerez-2026-07-06]`. |

> ✅ consolidado 20260713 — dirty-guard-no-dispara reconfirmado (tag jerez+dm-electronica); dato depositable ausente (mecanismo jerez/ferrenuestro) + 3 ion-selects El Yaque → nota depositos.md. aplica=true ya en YAML.

## Hallazgos (solo si hay FAIL)
Ninguno. 0 FAIL. El defecto conocido `deposit.service.ts` (DM-DEP-018/019/020) **NO reprodujo** — `app-deposito-list` renderizó limpio (0 ítems, sin loader colgado).

## Estado final
HOME confirmado (`app-home`, url `http://localhost/home`).
