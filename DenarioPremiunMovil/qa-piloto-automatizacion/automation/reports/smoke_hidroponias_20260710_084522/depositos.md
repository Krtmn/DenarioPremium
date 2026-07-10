# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260710_084522_smoke-completo` |
| Módulo | DEPÓSITOS |
| Dispositivo | Infinix HOT 60i (X6728) · android · UUID da9f78b6e785fffc |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 (Isla La Tortuga) |
| Playa / Cliente | hidroponias — HIDROPONIAS VENEZOLA |
| Servidor | `denariolatortuga.ddns.net:8081` |
| Resultado | 11 PASS · 0 FAIL · 1 SKIP · 0 N/A · 0 BLOCKED |

## ⚠ `aplica` CAMBIÓ A TRUE tras la migración a Isla La Tortuga

El perfil `hidroponias.yaml` marca `modules.depositos.aplica=false` con motivo histórico
("solo método Depósito bancario habilitado; requiere cobro con Efectivo"). **Verificado en UI
tras la migración a La Tortuga (v6.6.18): el módulo AHORA ES PLENAMENTE CONDUCIBLE.**

Oráculo de `aplica` (Tab Cobros del formulario DEPÓSITO):
- **4 bancos** configurados en el select (idBankAccount 15/16/18/19 · HIDRO_A · BS): BANCO DE VENEZUELA,
  MERCANTIL, PROVINCIAL, BANESCO.
- **1 cobro depositable** en Tab Cobros: cliente "ALIMENTOS MR SUB CCS,C.A", Ref cobro **17**,
  Monto 10000 BS, fecha 2026-07-07 (cobro Efectivo ENVIADO en histórico de la nube).

Es decir: ya existen cobros Efectivo enviados depositables → **flujo end-to-end depósito-con-cobro
ejecutable → `aplica` debe pasar a `true`** en el perfil (ver "Actualización de perfil" abajo).

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Módulo Depósitos → home con botones DEPÓSITO y BUSCAR |
| DM-DEP-002 | ✅ PASS | DEPÓSITO → `app-deposito`; tabs General/Cobros/Total/Adjuntos; Banco/Fecha Doc/Nro.Plantilla; Guardar deshabilitado sin cobro |
| DM-DEP-004 | ✅ PASS | Banco = "BANCO DE VENEZUELA S.A.C.A." (4 bancos disponibles); cuenta 01020143870000031781 autollenada |
| DM-DEP-005 | ✅ PASS | Fecha Doc (`letrasFechasButton` idx 1) → modal → `dt.value` ISO + ionChange → confirmDatetime (Aceptar shadow) = 9/7/2026 |
| DM-DEP-006 | ✅ PASS | Nro. Plantilla = "QA-DEP-0710"; cobro Ref 17 marcado → "Monto total depositado 10000 BS" (monto derivado, sin campo libre); Guardar habilitado |
| DM-DEP-009 | ✅ PASS | Guardar → alert "Denario Depósito / El Depósito se ha guardado" [Aceptar] |
| DM-DEP-010 | ✅ PASS | BUSCAR renderizó lista (Ref 0, Banco 0102, **Guardado**, 10000.00) — **defecto conocido v6.6.14 NO reprodujo** |
| DM-DEP-014 | ✅ PASS | Reabrir Guardado desde BUSCAR → datos íntegros (Banco, cuenta, Nro.Plantilla QA-DEP-0710, Fecha 9/7/2026); round-trip §9 OK |
| DM-DEP-017 | ✅ PASS | Enviar → **3 alerts** (confirmación Cancelar/Aceptar → "El Depósito será enviado" OK → "Depósito nro. 1 enviado exitosamente" OK) → **Enviado**, Ref 0→**1** |
| DM-DEP-018 | ✅ PASS | BUSCAR tras enviar renderizó (Ref 1, **Enviado**, 10000.00) — defecto conocido NO reprodujo |
| DM-DEP-019 | ✅ PASS | Reabrir Enviado → **solo lectura**: botones Guardar/Enviar ocultos, todos los inputs `disabled`, fechas `disabled`, **sin botón basura** |
| DM-DEP-020 | ⏭ SKIP | Botón basura verificado **presente en Guardado** y **ausente en Enviado** (correcto); el delete destructivo NO se ejecutó — un único cobro depositable (Ref 17) → se priorizó el envío end-to-end §10 |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Depósito Nro.Ref **1** (id_deposit=1) | Banco 0102 (BANCO DE VENEZUELA), Nro.Plantilla QA-DEP-0710, cobro vinculado Ref **17** (collectionIds:[17]), Monto **10000.00 BS** | **Enviado** (nube La Tortuga) |

## Verificación BD (RUNTIME §10)

**Payload (hook CapacitorHttp):** POST capturado a
`.../PremiumWS/services/depositservice/deposit` con keys `deposit`, `collectionIds`, `transactionDeviceAuth`
y **`collectionIds:[17]`** → el vínculo cobro→depósito viaja por `collectionIds` (confirma `[ins-2622]`),
`depositCollect` vacío. Servidor destino: **denariolatortuga.ddns.net** (La Tortuga confirmada).

**Nube (`deposit`):**
```
id_deposit=1 · co_deposit=1783696190859.0 · st_deposit=1 · nu_amount_doc=10000.0000 · da_deposit=2026-07-10T15:09:50Z
```
- Fila existe en nube; `nu_amount_doc`=10000.00 = Monto UI; **Nro.Ref UI 1 = id_deposit 1** (correlación directa).
- ⚠ `st_deposit=**1**` (no 9). El código `st_deposit` del servidor La Tortuga difiere del mapeo histórico
  documentado (Guardado 5 / Enviado 9). Corroborar por `id_deposit>0` + presencia durable en nube (RUNTIME §10:
  los `st_*` de servidor varían por playa) → **BD-INFO**, no MISMATCH.

**Marca: `BD-OK`** — el depósito guardado se envió y persistió en la nube (fila durable + monto exacto +
collectionIds:[17] en payload). Sin cola pendiente ni rechazo observado.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| hidroponias `depositos.aplica` = **true** post-migración La Tortuga | cliente | Histórico N/A (solo Depósito bancario); en La Tortuga v6.6.18 hay 4 bancos + cobros Efectivo enviados depositables (Ref 17). Actualizar `hidroponias.yaml`: `aplica:true` |
| Tabs General/Cobros/Total/Adjuntos habilitadas desde apertura del form | universal (build La Tortuga) | En este build las 4 tabs aparecen `enabled` sin requerir Banco+Fecha; el contenido de Tab Cobros carga tras montar. Difiere de la nota histórica "tabs se habilitan tras Banco+Fecha" |
| Fecha Doc idx 1 inicializa en la fecha de ayer/hoy (9/7/2026), no vacía | universal (build La Tortuga) | Coincide con globalmp 0611 (abre con fecha), no con insumar (abría vacío). `dt.value` ISO + ionChange antes de Aceptar sigue siendo seguro |
| Nro. Plantilla / Comentario / Banco por propiedad JS `label` | universal (build El Yaque/La Tortuga) | `i.label`="Nro. Plantilla:" / "Comentario:" / "Banco:" (cuenta autollenada en input Banco). Confirma jerez/ferrenuestro en La Tortuga |
| Envío hidroponias = **3 alerts** | cliente/servidor | Confirmación Cancelar/Aceptar → "El Depósito será enviado" OK → "Depósito nro. N enviado exitosamente" OK. Coincide con jerez (3), difiere de insumar/ferrenuestro (2) |
| `st_deposit`=1 en nube La Tortuga para Enviado | universal (servidor La Tortuga) | El código difiere del mapeo histórico (9=Enviado). Corroborar por id_deposit + presencia durable, no por st_deposit |
| Defecto render `deposit.service.ts` (DM-DEP-010/018) NO reprodujo | universal | Lista BUSCAR renderizó limpia en Guardado y Enviado (0 loader colgado). Confirma naturaleza intermitente del bug |

> ✅ consolidado 20260710

## Hallazgos (FAIL)

Ninguno. 0 FAIL.

## Verificación BD (payload ↔ nube) — Agente BD (cotejo campo-a-campo)

| co_x | Marca | Campos cabecera | Vínculo cobro | Mismatches | Notas |
|------|-------|-----------------|---------------|------------|-------|
| 1783696190859.0 | BD-FIELD-OK | 10/11 OK (+1 BD-INFO) | collection.id_deposit=id_deposit ← id_collection 17 | 0 | `st_deposit=1` código playa La Tortuga (no 9 histórico) = BD-INFO |

**Conclusión:** Depósito Ref 1 (id_deposit=1) llegó íntegro a la nube — banco 0102 (BANCO DE VENEZUELA), cuenta 01020143870000031781, plantilla QA-DEP-0710, 10.000,00 BS, moneda BS, vinculado al cobro id_collection=17. 0 mismatches.

**Notas de calibración (para Agente 11 / cotejo-payload.js):**
- **Gap de captura:** el payload `depositservice/deposit` NO se volcó a `_payloads.jsonl` (el hook `installPayloadCapture` podría no interceptar ese endpoint). Cotejo hecho por fallback `query.js` → BD-FIELD-OK igual. Acción: verificar filtro de URLs en `installPayloadCapture`.
- **Esquema `deposit`:** cabecera pura (sin hijas anidadas); vínculo REVERSO por `collection.id_deposit` (no FK forward). fieldMap sugerido: `nuTemplateNumber→nu_document`, `daDocument→da_document`, `nuAmountDoc→nu_amount_doc`, `coCurrency→co_currency`, `txComment→tx_comment`; `collectionIds` no es columna (FK reverso). ignore: `st_deposit` (código playa-variable), PK/epoch/recalc/geoloc.
