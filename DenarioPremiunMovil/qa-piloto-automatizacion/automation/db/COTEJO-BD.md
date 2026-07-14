# Cotejo BD por payload — referencia, estado y pendientes

**Qué es:** verificación **"lo que se mandó == lo que se guardó"**, campo por campo, registro completo (cabecera + líneas), para cada transacción transaccional. Capa **aditiva** sobre el smoke UI: si la BD falla, marca `BD-N/A` y la corrida sigue (la BD nunca tumba el smoke).

> Reemplaza al cotejo por columnas clave (§10) con un cotejo **campo por campo** del payload real que la app postea al servidor. Motor: `automation/db/cotejo-payload.js`. Fallback histórico (local↔nube): `automation/db/cotejo-bd.js`.

---

## 1. Cómo funciona (modelo de 2 agentes)

```
Agente UI (Playwright/CDP):  instala captura → ejecuta el smoke → al Enviar, el payload
                             que sale por CapacitorHttp.post se captura → se vuelca a archivo
Agente BD (solo Bash):       lee los payloads → cotejo-payload.js por cada uno → anexa la
                             sección "Verificación BD" al reporte del módulo (opción B)
```

- **"Lo que se mandó" = el payload** que arma `auto-send.service` y postea (ya estructurado/anidado, en nombres del modelo camelCase). Es lo más fiel; evita reconstruir el SQLite local.
- Los dos agentes usan **recursos distintos** (UI=dispositivo, BD=Bash) → el BD del módulo N puede correr **en paralelo** con el UI del N+1. Dentro de un módulo siempre es UI→BD (el BD necesita el payload + esperar el sync ~10s).

### Captura (helper `denario-cdp-helpers.js`)
- `installPayloadCapture(pg)` — engancha `Capacitor.nativePromise` (NO `CapacitorHttp.post`, que es proxy de solo-lectura). Instalar **una vez** al inicio, ANTES de Enviar.
- `getCapturedPayloads(pg)` — devuelve `[{url, data}]`. Filtrar por el endpoint del módulo y volcar a `{RUN_DIR}_payloads.jsonl` (+ un `{modulo}-payload.json` por módulo para cotejar).

### Motor `cotejo-payload.js`
`node automation/db/cotejo-payload.js <cliente> <payloadFile.json>` → compara payload ↔ nube. Reglas:
- **payload-driven:** campo con valor en el payload → debe llegar igual a la nube (MISMATCH si difiere); vacío/null → se saltea; campos del **servidor** (id/timestamps/recalc) → `ignore`.
- **camel→snake** automático (`coReturn`→`co_return`); renames con `fieldMap` (ej. `txComment`→`tx_description`, `hasIGTF`→`has_igtf`).
- **Hijas anidadas** (orderDetails→orderDetailUnit) y **headerLink** (incidence linkea por `id_visit`, no `co_visit`).
- **Fechas:** veredicto por día; diferencia de hora (zona horaria local UTC-4 vs nube UTC) → **nota**, no mismatch.
- **Marcas:** `BD-FIELD-OK` · `BD-FIELD-MISMATCH` · `BD-SAVED` (no llegó a la nube) · `BD-N/A`.

### Esquema universal · config por cliente
El mapeo (tablas/columnas/fieldMap/ignore) es del **modelo de datos del producto → igual para todos los clientes**. Por cliente solo cambia: la **conexión** (`secrets/qa-db.env`) y las **VGs/datos** (`{cliente}.yaml`). El arg `<cliente>` solo elige la conexión.

---

## 2. Estado por módulo (calibración del config en cotejo-payload.js)

| Módulo | co_type / forma | Calibrado | Validado en vivo |
|---|---|---|---|
| devoluciones | return + return_detail | ✅ | ✅ BD-FIELD-OK |
| pedidos | order + detail + unit (anidado) | ✅ | ✅ BD-FIELD-OK |
| inventarios | client_stock + detail + unit (anidado) | ✅ | ✅ BD-FIELD-OK |
| clientes | potential_client | ✅ | ✅ BD-FIELD-OK |
| visitas | visit + incidence (headerLink id_visit) | ✅ | ✅ BD-FIELD-OK |
| **cobros — normal** (co_type 0) | collection + detail + payment | ✅ | ✅ BD-FIELD-OK |
| **cobros — anticipo** (co_type 1) | collection + payments | ⏳ pendiente | — |
| **cobros — retención** (co_type 2) | collection + detail (montos retención) | ⏳ pendiente | — |
| **cobros — IGTF** (co_type 3) | collection + `nu_amount_igtf` | ⏳ pendiente | — |
| **depósitos** | deposit (cabecera, sin hijas) | ✅ | ✅ BD-FIELD-OK (jerez 2026-07-01, id_deposit 6) |

> Calibrar = correr 1 ejemplo del tipo → el motor marca como **notas** los renames/campos payload-only → agregarlos a `fieldMap`/`ignore` del config de ese tipo (igual que se hizo con los 6 ya calibrados). Las notas **no** son mismatch (no rompen).

---

## 3. Pre-vuelo de datos por TIPO de cobro (OBLIGATORIO, dinámico)

⚠ **NO hardcodear clientes** — los datos se mueven. Descubrir en runtime, ANTES de correr cobros:
```bash
node automation/db/query.js <cliente> "SELECT * FROM (SELECT d.co_document_sale_type tipo, c.na_client, c.co_client, count(*) docs, round(sum(d.nu_balance),2) saldo, row_number() OVER (PARTITION BY d.co_document_sale_type ORDER BY count(*) DESC) rn FROM document_sale d JOIN client c ON c.id_client=d.id_client WHERE d.nu_balance>0 GROUP BY d.co_document_sale_type, c.na_client, c.co_client) t WHERE rn<=2 ORDER BY tipo, docs DESC"
```
| Tipo de cobro | Documento | Objetivo |
|---|---|---|
| Normal / Retención (botón y por documento) | `FACT` | cliente top de `FACT` |
| IGTF | `IGTF` | cliente del tipo `IGTF`. **Si no hay `IGTF` → IGTF = N/A** (no forzar) |
| Anticipo | ninguno | cualquier cliente |
| 25% IVA | — | N/A si `userCanCollectIva=false` |

(También en `smoke-cobros.md`.)

---

## 4. Pendientes — plan para cerrar el formato

### Cobros (faltan 3 co_types)
Cada uno: el agente UI arma+Guarda → **adjunto manual (QA)** → Enviar → cotejo+calibrar.
1. **Anticipo** (co_type 1): cualquier cliente → Tab Pagos: Efectivo monto>0 → Guardar.
2. **Retención botón** (co_type 2): cliente `FACT` → Documentos → `h.openDocumentDetail` → comprobante 14 díg + fecha + IVA + ISLR → Guardar detalle → Guardar.
3. **IGTF** (co_type 3): cliente del tipo `IGTF` (pre-vuelo) → Documentos → pago → Guardar.
- Cobertura UI extra (sin envío): pago parcial (046), retención por documento (041/042), método Depósito (040), oráculo reabrir (024).

### Depósitos — ✅ Calibrado y validado en vivo (jerez 2026-07-01)
- Validado con id_deposit=6 (79.872,58 BS, Banesco): **BD-FIELD-OK 14/14 campos**. `deposit` es **cabecera pura sin hijas** (`arrays:[]`).
- **Vínculo con el cobro:** NO se persiste como detalle → el FK se invierte: **`collection.id_deposit`** apunta al depósito (verificado: coll 58 → dep 6). El `collectionIds:[N]` viaja como campo hermano fuera de `data.deposit` (el motor no lo mira).
- **Banco:** la tabla `deposit` NO tiene `id_bank_account`; el banco se persiste denormalizado como `co_bank` + `nu_account` (ambos se cotejan). El `idBankAccount` es solo referencia UI.
- **ignore calibrado:** `is_edit, is_edit_total, is_save, co_user` (flags UI / payload-only) — ya agregados a `cotejo-payload.js`.
- Precondición para reproducir: al menos un cobro **enviado** con pago depositable (Efectivo). ⚠ BUSCAR puede no renderizar tras guardar (bug conocido §5, esperado).

---

## 5. Restricciones operativas
- **Adjunto en cobros (build prod):** `requiredCollectionAttachments` / `requiredAnticipoAttachments` / `requiredRetentionAttachments` = true (defecto si la VG no está) → cobros/anticipo/retención **exigen adjunto** para Enviar y el mock de cámara no anda en build prod → **adjunto manual** (o build debug, o VG off). Sin enviar → quedan `BD-SAVED` (no cotejan campos).
- **2 horas / 1 emulador:** el cuello de botella es la UI (1 device = 1 agente UI a la vez; no se paraleliza en un solo emulador). El cotejo BD es instantáneo. Para cubrir todo en ≤2h: smoke subset (no regresión completa) o varios emuladores (puertos CDP distintos), repartiendo módulos.

---
*Generado por Claude Code · sistema de cotejo BD por payload · 2026-06-17*
