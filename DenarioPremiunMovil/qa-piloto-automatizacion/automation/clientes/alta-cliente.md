# Alta de cliente nuevo — QA Denario Premium móvil

Guía para dar de alta un cliente dejando su perfil **casi 100% establecido ANTES de correr**, usando el CSV de config + la BD read-only. La 1ª corrida ya no "descubre desde cero": solo **confirma y caza divergencias UI**.

Ejemplos vivos: `don-theo.yaml`, `piercar.yaml`. Esquema del YAML: `_schema.yaml`.

---

## Fuentes — qué sale de dónde (clave)

| Qué | Fuente | ¿Discovery en vivo? |
|---|---|---|
| **VGs** (`vgs:`) — qué features y tipos de cobro aplican | **CSV `global_configuration`** | ❌ establecido |
| **Estructura BD** (tablas, `co_type`, relaciones) | esquema COMPARTIDO (`automation/db/modelo-datos-denario.md`) | ❌ igual para todos |
| **Dato de prueba** (`modules.*`): cliente, factura, productos, bancos, tipos | **BD read-only** (`query.js`) | ⚠️ consultable → pre-poblar |
| Divergencias UI vs config, quirks de selectores | **corrida** | ✅ único residual real |

---

## Paso 1 — VGs desde el CSV (`global_configuration_<cliente>.csv`)

1. Mapear cada `clave`/`valor` del CSV a la sección `vgs:` del YAML.
2. Quedan **fijados antes de correr**: tipos de cobro (`cobroPrepago`/`cobroRetencion`/`retencion`/`userCanSelectIGTF`/`userCanCollectIva`), `expirationBatch`, `validateReturn`, firmas, `requiredCollectionAttachments`, etc. → el **mapa de N/A vs aplicable** del smoke.
3. `esVendedor` **NO viene en el CSV** (depende del rol del usuario QA) → **confirmar con QA**.
4. Override por cliente: si hay dudas, la verdad de la VG está en la BD: `global_configuration` (global) + `global_configuration_client` (override).

---

## Paso 2 — Pre-poblar `modules.*` desde la BD (read-only)

**Requisitos:** bloque `# Cliente: <slug>` en `secrets/qa-db.env` + GRANT read-only en esa base (es POR-BASE; ver memoria `qa-db-oracle`). Verificar con `node automation/db/query.js <slug> "SELECT 1"`.

### Cliente CON documentos (cobros / devoluciones)

> ⚠ **Corregido 2026-07-28 (el_valle).** La consulta anterior usaba `invoice`, que en el esquema real está
> **vacía**. Los documentos de venta viven en **`document_sale`** y el saldo pendiente es **`nu_balance`**.
> Y sobre todo: **hay que filtrar por el vendedor QA** (`client_template_user`) — un cliente con documentos
> que no esté asignado al vendedor **no aparece en la app** y no sirve para el smoke.

```bash
# $U = QA_USER del bloque "# Cliente: <slug>" (leerlo del archivo, NO escribirlo en el guión)
node automation/db/query.js <slug> "SELECT d.co_client, max(c.na_client) na_client, count(*) docs, count(*) FILTER (WHERE d.da_duedate < CURRENT_DATE) vencidos, round(sum(d.nu_balance),2) saldo, max(d.co_currency) mon FROM document_sale d JOIN client c ON c.co_client=d.co_client JOIN client_template_user ctu ON ctu.co_client=d.co_client AND lower(ctu.co_user)=lower('$U') AND ctu.co_operation<>'D' WHERE d.co_operation<>'D' AND d.nu_balance>0 GROUP BY d.co_client ORDER BY docs DESC LIMIT 5"
```

**Gate del GRANT antes de nada** (`SELECT 1` pasa aunque no haya permisos sobre las tablas):
```bash
node automation/db/query.js <slug> "SELECT count(*) FILTER (WHERE has_table_privilege('user_read', schemaname||'.'||tablename,'SELECT')) legibles, count(*) total FROM pg_tables WHERE schemaname='public'"
```
Si `legibles < total` → falta el GRANT; el cotejo BD será `BD-N/A` y `modules.*` no se puede pre-poblar.

### Productos del catálogo (pedidos / devoluciones / inventarios)
```bash
node automation/db/query.js <slug> "SELECT co_product, na_product FROM product WHERE co_operation<>'D' ORDER BY na_product LIMIT 10"
```

### Bancos (depósitos / cobros con depósito-transferencia)
```bash
node automation/db/query.js <slug> "SELECT co_bank, na_bank FROM bank WHERE co_operation<>'D'"
```

### Tipos y motivos de devolución
```bash
node automation/db/query.js <slug> "SELECT id_type, na_type FROM return_type"
node automation/db/query.js <slug> "SELECT id_motive, co_motive, na_motive FROM return_motive"
```

### Actividades de visita
```bash
node automation/db/query.js <slug> "SELECT id_type, na_type FROM incidence_type"
```

### Estados `st_*` por módulo (cómo marca "Enviado" esta playa)
```bash
node automation/db/query.js <slug> "SELECT id_status, co_status, na_status, co_transaction_type FROM statuses ORDER BY co_transaction_type, id_status"
```

→ Volcar lo descubierto en `modules.*` del YAML. Lo que no se resuelva por BD queda `TBD` (lo confirma la 1ª corrida).

---

## Paso 3 — Lo que SOLO la corrida confirma (residual)

- **Divergencias UI vs config** — ej. piercar: `expirationBatch=false` en config pero la UI mostró Lote+Fecha. Solo se ve corriendo.
- **Selectores / quirks** nuevos del cliente.
- Que el dato elegido **funciona en el flujo** (el cliente con factura sí habilita las tabs, el producto existe en la factura para devolución, etc.).

Tras la 1ª corrida, el **Agente 11** consolida lo descubierto al YAML / `module-selectors/`.

---

## Cotejo BD en la corrida (ver RUNTIME §10)

Una vez con el perfil listo, el oráculo v2 verifica **"lo guardado se envía"** por módulo: nube (`query.js`) + local (`local-query.js`), 5 estados (enviado / guardado / en cola / rechazado / duplicado), por items y `co_type`-aware en cobros.

---

## Checklist de alta

- [ ] `secrets/qa-credentials.env` → bloque `# Cliente: <slug>` (login QA)
- [ ] `secrets/qa-db.env` → bloque `# Cliente: <slug>` (DSN) + **GRANT read-only** en esa base
- [ ] `automation/clientes/<slug>.yaml` → `vgs` (del CSV) + `modules.*` (pre-poblado de BD o TBD)
- [ ] Confirmar `esVendedor` con QA
- [ ] **Confirmar que el dispositivo apunta al MISMO servidor que la BD** (tenant correcto — si no, el cotejo BD compara contra otro servidor)
- [ ] Setup dispositivo (ADB + CDP `:9220`) — ver orquestador
- [ ] 1ª corrida → confirmar + consolidar (Agente 11)

---
*Creado 2026-06-17 · complementa la nota de memoria de alta (don-theo) con el pre-poblado desde BD.*
