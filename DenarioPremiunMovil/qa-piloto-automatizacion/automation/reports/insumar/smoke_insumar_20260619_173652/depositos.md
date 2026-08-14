# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260619_173652_smoke-completo` |
| Módulo | DEPÓSITOS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa / Cliente | insumar (INSUMAR DISTRIBUIDOR) |
| `modules.depositos.aplica` | **true** (módulo visible en HOME y accesible) |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A** |
| Estado inicial / final | HOME / HOME ✅ |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Click módulo → `/depositos` con botones DEPÓSITO y BUSCAR |
| DM-DEP-002 | ✅ PASS | `app-deposito` con tabs General/Cobros/Total/Adjuntos; campos Empresa/Moneda/Banco/Fecha Doc/Fecha Depósito; Guardar+Enviar `disabled=true` sin datos |
| DM-DEP-004 | ✅ PASS | Banco BANESCO RAEL seleccionado (`sel.value.naBank`); Cuenta banco read-only autollena `01340239682391029301` |
| DM-DEP-005 | ✅ PASS | Fecha Doc confirmada 19/6/2026 vía `fechasModal` (datetime abrió con HOY, NO el bug "mayo 2021"); modal cerrado |
| DM-DEP-006 | ✅ PASS | Nro. Plantilla `QA0619173652` + cobro Ref 45 marcado → "Monto total depositado: 4765.23 BS" → Guardar habilitado (`disabled=false`) |
| DM-DEP-009 | ✅ PASS | Click Guardar → alert "Denario Depósito — El Depósito se ha guardado" → Aceptar |
| DM-DEP-010 | ✅ PASS | BUSCAR renderizó 16 ítems; depósito recién guardado en primera posición (Ref 0, Guardado) |
| DM-DEP-014 | ✅ PASS | Reabrir Guardado Ref 0 → form con datos previos: Banco BANESCO RAEL, Cuenta, **Nro. Plantilla=QA0619173652 (persiste)**, Fecha Doc 19/6/2026 — oráculo persistencia RUNTIME §9 OK |
| DM-DEP-017 | ✅ PASS | Enviar → 2 alertas ("El Depósito será enviado" Cancelar/Aceptar → OK) → estado pasó de Guardado a **"Por Enviar"** (offline-first antes de sync) |
| DM-DEP-018 | ✅ PASS | BUSCAR tras guardar renderizó la lista correctamente (no reprodujo defecto conocido) |
| DM-DEP-019 | ✅ PASS | Reabrir Enviado Ref 15 → solo lectura: banco select `disabled`, tabs reducidas a General/Total/Adjuntos (sin Cobros), sin Guardar/Enviar/basura |
| DM-DEP-020 | ✅ PASS | Trash en Guardado → alert "¿Desea eliminar el depósito seleccionado?" Cancelar/Aceptar → Aceptar → ítem desaparece (17→16, sin alert de éxito) |

## Registros creados en sistema

| Ref | Detalle | Estado final |
|-----|---------|--------------|
| Ref 0 → (sync pendiente) | Depósito BANESCO RAEL (Banco 04) · cobro Ref 45 (ANMY LEONELA URIEPERO ALONZO) · Monto BS 4765.23 · Nro. Plantilla QA0619173652 · Fecha Doc 19/6/2026 | **Por Enviar** (enviado end-to-end; servidor asignará Ref real al sincronizar) |
| Ref 0 (BANCRECER) | Depósito desechable creado SOLO para DM-DEP-020 · cobro Ref 35 (ANDREINA JOSé BARRETO) · Monto BS 17635.06 | **ELIMINADO** (borrado con confirmación) |

**Nota:** el cobro Ref 35 vinculado al depósito eliminado vuelve a quedar disponible como "pendiente de depósito" al borrarlo (no se consumió). El cobro Ref 45 quedó consumido por el depósito enviado.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Estado post-Enviar = **"Por Enviar"** (offline-first), no "Enviado" inmediato | universal | Tras Enviar end-to-end vía CDP, el ítem muestra `Estatus: Por Enviar` hasta que sincronice con servidor (que asigna Nro Ref real). Mismo patrón que VISITAS globalmp ("Por Enviar"/"Visitado"). Es PASS, no FAIL. Documentar para no marcar FAIL en futuras corridas que esperen "Enviado" inmediato. `[ins-2619]` |
| Defecto DM-DEP-010/018 **NO reprodujo** (4ª corrida limpia insumar/cf) | universal | Lista BUSCAR renderizó tras guardar, enviar y borrar. Acumulado: insumar 0609/0610/0619 + cf 0612. Candidato firme a **cerrar** el defecto v6.6.14 `deposit.service.ts`. `[ins-2619]` |
| Nro. Plantilla **sí persiste** al reabrir en insumar | cliente | A diferencia del defecto abierto H1 de central_foods (Nro. Plantilla vuelve vacío), en insumar el valor `QA0619173652` se releyó correctamente al reabrir el Guardado. Divergencia entre clientes — confirma que H1 es específico de central_foods, no universal. `[ins-2619]` |
| Datetime Fecha Doc abre con HOY (no bug "mayo 2021") | cliente | En esta corrida el `ion-datetime` de Fecha Doc abrió ya con `2026-06-19 17:05:02`. El bug "abre sin valor / mes mayo 2021" documentado en `[ins-2610]` NO se reprodujo. Mantener la asignación ISO previa a Aceptar por seguridad. `[ins-2619]` |

> ✅ consolidado 2026-06-19

## Hallazgos (FAIL)

Ninguno. 12/12 PASS.
