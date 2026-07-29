# Esquema BDD — Denario Premium (PostgreSQL)

Documento vivo para QA. Describe el **esquema común** de todas las playas/clientes Denario Premium móvil. Se actualiza con hallazgos de DBeaver, corridas smoke y cruce con la app móvil.

| Campo | Valor |
|-------|-------|
| **Motor** | PostgreSQL |
| **Schema** | `public` |
| **Alcance** | Mismo conjunto de tablas en todas las BDD de clientes |
| **Primera documentación** | 2026-06-23 (capturas DBeaver) |

### Alcance del documento

- **General (este archivo):** nombres de tablas, columnas confirmadas, convenciones PG vs móvil, queries reutilizables.
- **Por cliente:** datos de conexión, multi-empresa, empresas concretas, datos de prueba, hallazgos específicos → sección [Particularidades por cliente](#particularidades-por-cliente).
- Los **tamaños** entre paréntesis (ej. `128K`) son referencia de una captura y **varían por playa**; el esquema de tablas es el mismo.

---

## Convenciones importantes

### Backend (PostgreSQL) vs app móvil (SQLite)

| Concepto | PostgreSQL (DBeaver) | SQLite (APK) |
|----------|----------------------|--------------|
| Cobros | `collection` | `collections` |
| Detalle cobro | `collection_detail` | `collection_details` |
| Pagos del cobro | `collection_payment` | `collection_payments` |
| Empresa | `enterprise` | `enterprises` |
| Cliente | `client` | `clients` |
| Pedido | `order` | `orders` |
| Devolución | `return` | `returns` |
| Depósito | `deposit` | `deposits` |
| Visita | `visit` | `visits` |

> **Regla práctica:** en DBeaver usar nombres en **singular**. El error `relation "collections" does not exist` se debe a este mapeo.

### Multi-empresa (cuando aplica)

Algunos clientes tienen **varias filas en `enterprise`** y el campo `id_enterprise` / `co_enterprise` aparece en transacciones (`collection`, `order`, `client`, etc.). Otros clientes tienen **una sola empresa** — en ese caso no hace falta filtrar por empresa en los queries.

La VG `enterpriseEnabled` (app) indica si el selector de empresa está activo en la UI. Ver detalles por playa en [Particularidades por cliente](#particularidades-por-cliente).

---

## Índice por dominio

- [Catálogo y maestros](#catálogo-y-maestros)
- [Clientes y direcciones](#clientes-y-direcciones)
- [Productos e inventario](#productos-e-inventario)
- [Pedidos](#pedidos)
- [Cobros y pagos](#cobros-y-pagos)
- [Depósitos](#depósitos)
- [Devoluciones](#devoluciones)
- [Documentos de venta](#documentos-de-venta)
- [Visitas y rutas](#visitas-y-rutas)
- [Usuarios y roles](#usuarios-y-roles)
- [Transacciones (adjuntos, estados)](#transacciones-adjuntos-estados)
- [Configuración global](#configuración-global)
- [Sincronización y auditoría](#sincronización-y-auditoría)
- [Geografía y misc](#geografía-y-misc)
- [Sistema PostgreSQL / PostGIS](#sistema-postgresql--postgis)
- [Tablas detalladas (columnas conocidas)](#tablas-detalladas-columnas-conocidas)
- [Queries útiles QA](#queries-útiles-qa)
- [Particularidades por cliente](#particularidades-por-cliente)
- [Changelog](#changelog)
- [Pendiente por verificar](#pendiente-por-verificar)

---

## Catálogo y maestros

| Tabla | Tamaño ref. | Descripción / notas |
|-------|-------------|---------------------|
| `bank` | 32K | Bancos |
| `bank_account` | 64K | Cuentas bancarias receptoras |
| `currency` | 40K | Monedas |
| `currency_enterprise` | 32K | Monedas habilitadas por empresa |
| `currency_modules` | 24K | Config moneda por módulo |
| `currency_relation` | 32K | Relación entre monedas / tasas |
| `conversion_type` | 32K | Tipos de conversión |
| `conversions` | 24K | Conversiones |
| `distribution_channel` | 48K | Canales de distribución |
| `enterprise` | 48K | **Empresas** — filtrar por `id_enterprise` |
| `enterprise_distributor` | 16K | TBD |
| `enterprise_konnector` | 24K | TBD |
| `enterprise_structure` | 48K | Estructura comercial por empresa |
| `list` | 32K | Listas de precio (cabecera) |
| `price_list` | 5.5M | Detalle listas de precio |
| `price_list_zone` | 16K | Listas por zona |
| `payment_condition` | 24K | Condiciones de pago |
| `payment_method` | 24K | Métodos de pago |
| `warehouse` | 48K | Almacenes |
| `unit` | 32K | Unidades de medida |
| `unit_pricelist` | 16K | TBD |
| `discount` | 32K | Descuentos |
| `global_discount` | 24K | Descuentos globales |
| `collect_discounts` | 16K | Descuentos en cobros |
| `igtf_list` | 24K | Tasas IGTF |
| `iva_list` | 24K | Tasas IVA |
| `difference_codes` | 16K | Códigos de diferencia en cobros |
| `modules` | 24K | Módulos de la app |
| `type_document` | 32K | Tipos de documento |
| `type_enterprise_structure` | 32K | Tipos estructura empresa |
| `type_product_structure` | 32K | Tipos estructura producto (LINEA, etc.) |
| `denario_document_sale_type` | 24K | Tipos doc venta Denario |
| `document_sale_type` | 32K | Tipos documento de venta |
| `document_sale_type_index` | 8K | Índice tipos doc venta |
| `order_type` | 32K | Tipos de pedido |
| `order_type_product_structure` | 16K | Tipo pedido × estructura producto |
| `return_type` | 24K | Tipos de devolución |
| `return_motive` | 24K | Motivos de devolución |
| `return_category` | 24K | Categorías devolución |
| `incidence_type` | 24K | Tipos de incidencia (visitas) |
| `incidence_motive` | 72K | Motivos de incidencia |
| `incidence_type_role` | 24K | Tipo incidencia × rol |
| `balance_type` | 24K | TBD |
| `bonus` | 24K | TBD |
| `budget` | 32K | TBD |
| `suggested` | 32K | Pedido sugerido |
| `straight_swap` | 8K | TBD |
| `lov` | 40K | Listas de valores |
| `lov_index` | 40K | Índice LOV |
| `application_tags` | 224K | Etiquetas i18n de la app |
| `component` | 24K | Componentes UI web |
| `role` | 40K | Roles |
| `role_component` | 64K | Rol × componente |
| `role_user` | 56K | Rol × usuario |

---

## Clientes y direcciones

| Tabla | Tamaño ref. | Descripción / notas |
|-------|-------------|---------------------|
| `client` | 2M | **Clientes** — `id_client`, `co_client`, `id_enterprise` (+ nombre según columna de la tabla) |
| `client_type` | 24K | Tipos de cliente |
| `client_bank_account` | 24K | Cuentas bancarias del cliente |
| `client_channel_order_type` | 16K | Canal × tipo pedido por cliente |
| `client_avg_product` | 56K | Promedio productos por cliente |
| `client_template_user` | 152K | Plantillas cliente × usuario |
| `client_auditoria` | 16K | Auditoría clientes |
| `potential_client` | 64K | Clientes potenciales |
| `address_client` | 632K | Direcciones / sucursales |
| `address_type` | 32K | Tipos de dirección |
| `user_address_clients` | 32K | Direcciones asignadas a usuario |
| `client_stock` | 32K | Inventario en cliente |
| `client_stock_detail` | 24K | Detalle inventario cliente |
| `client_stock_detail_unit` | 24K | Unidades detalle inventario |
| `code_phone_number` | 32K | Códigos telefónicos |

---

## Productos e inventario

| Tabla | Tamaño ref. | Descripción / notas |
|-------|-------------|---------------------|
| `product` | 3.1M | Productos |
| `product_structure` | 48K | Familias / categorías |
| `product_unit` | 2.2M | Producto × unidad |
| `product_image` | 8K | Imágenes producto |
| `product_min_mul_fav` | 24K | Mín/múlt/favoritos |
| `product_valor` | — | TBD — tamaño no visible en captura |
| `stock` | 2.7M | Existencias |
| `stock_history` | 4.5M | Histórico existencias |
| `user_product_favs` | 32K | Favoritos por usuario |

---

## Pedidos

| Tabla | Tamaño ref. | Descripción / notas |
|-------|-------------|---------------------|
| `order` | 64K | **Pedidos** enviados |
| `order_detail` | 64K | Líneas de pedido |
| `order_detail_unit` | 48K | Unidades por línea |
| `order_detail_bonus` | 32K | Bonificaciones |
| `order_detail_discount` | 32K | Descuentos por línea |
| `order_images` | 16K | Imágenes adjuntas |
| `order_invoice` | 16K | Relación pedido–factura |
| `order_saved` | 64K | Pedidos guardados (borrador) |
| `order_support` | 16K | Soporte / staging sync |
| `order_template` | 2.1M | Plantillas de pedido |
| `order_detail_saved` | 16K | Detalle guardado |
| `order_detail_support` | 16K | Detalle soporte |
| `order_detail_unit_saved` | 16K | Unidades guardadas |
| `order_detail_unit_support` | 16K | Unidades soporte |
| `order_detail_discount_saved` | 32K | Descuentos guardados |
| `order_detail_discount_support` | 16K | Descuentos soporte |

---

## Cobros y pagos

| Tabla | Tamaño ref. | Descripción / notas |
|-------|-------------|---------------------|
| `collection` | 128K | **Cobros** (normal, anticipo, retención) |
| `collection_detail` | 80K | Documentos pagados en el cobro |
| `collection_payment` | 32K | Métodos de pago del cobro |
| `collection_detail_discounts` | 8K | Descuentos por línea de cobro |
| `collection_reconciliation` | 8K | Conciliación |
| `collect_dashboard_config` | 24K | Config dashboard cobros |
| `collect_discounts` | 16K | Descuentos cobro |

### Valores conocidos (`collection`) — desde app móvil

**`co_type` (tipo de cobro)**

| Valor | Significado |
|-------|-------------|
| `0` | Cobro normal |
| `1` | Anticipo / Prepago |
| `2` | Retención |

**`st_collection` (estatus local)**

| Valor | Significado |
|-------|-------------|
| `0` | Nuevo |
| `1` | Enviado |
| `2` | Por enviar |
| `3` | Guardado |

> En PostgreSQL `co_type` es `int4`. En la UI móvil se compara como string (`'0'`, `'1'`, `'2'`).

---

## Depósitos

| Tabla | Tamaño ref. | Descripción / notas |
|-------|-------------|---------------------|
| `deposit` | 80K | Depósitos bancarios |
| `deposit_collection_payment` | — | Vincula depósito ↔ pago de cobro |

---

## Devoluciones

| Tabla | Tamaño ref. | Descripción / notas |
|-------|-------------|---------------------|
| `return` | 48K | Devoluciones |
| `return_detail` | 32K | Detalle devolución |

---

## Documentos de venta

| Tabla | Tamaño ref. | Descripción / notas |
|-------|-------------|---------------------|
| `document_sale` | 920K | **Facturas / docs de venta** — saldo, vencimiento |
| `balance_docsale` | 8K | Balance documento |
| `invoice` | 48K | Facturas (módulo facturación) |
| `invoice_detail` | 32K | Detalle factura |
| `invoice_detail_unit` | 32K | Unidades factura |
| `invoice_detail_discount` | 24K | Descuentos factura |

---

## Visitas y rutas

| Tabla | Tamaño ref. | Descripción / notas |
|-------|-------------|---------------------|
| `visit` | 128K | Visitas |
| `visit_cycles` | 24K | Ciclos de visita |
| `visit_planning` | — | Planificación visitas |
| `incidence` | 56K | Incidencias en visita |
| `sale_visit` | 8K | TBD |
| `sale_route` | 8K | Rutas de venta |
| `sale_org` | 24K | Organización ventas |
| `rutero` | 32K | Rutero |
| `sector` | 24K | Sectores |
| `zone_transport` | 24K | Zonas transporte |
| `tacometro` | 32K | TBD |

---

## Usuarios y roles

| Tabla | Tamaño ref. | Descripción / notas |
|-------|-------------|---------------------|
| `users` | 56K | Usuarios |
| `users_data` | 64K | Datos extendidos usuario |
| `users_device` | 16K | Dispositivos |
| `users_enterprise` | 80K | Usuario × empresa |
| `users_enterprise_clients_auditoria` | 784K | Auditoría cartera usuario×empresa |
| `users_supervisor` | 24K | Supervisores |
| `user_information` | 24K | Info adicional usuario |
| `license_type` | 24K | Tipos licencia |
| `license_user` | 24K | Licencias usuario |
| `device` | 40K | Dispositivos registrados |
| `devices_audit` | 6.4M | Auditoría dispositivos |

---

## Transacciones (adjuntos, estados)

| Tabla | Tamaño ref. | Descripción / notas |
|-------|-------------|---------------------|
| `transaction_statuses` | 24K | **Historial estatus** — `co_transaction` = código cobro/pedido/etc. |
| `transaction_types` | 24K | Tipos de transacción |
| `statuses` | 24K | Catálogo de estatus (`na_status`) |
| `transaction_device_auth` | 64K | Auth dispositivo por transacción |
| `transaction_files` | 32K | Archivos adjuntos |
| `transaction_image` | 32K | Imágenes adjuntas |
| `transaction_image_saved` | 16K | Imágenes guardadas |
| `transaction_signatures` | 72K | Firmas |
| `failed_transactions` | 8K | Transacciones fallidas al integrar |

---

## Configuración global

| Tabla | Tamaño ref. | Descripción / notas |
|-------|-------------|---------------------|
| `global_configuration` | 104K | Variables globales (VG) |
| `global_configuration_client` | 72K | VG por cliente/playa |
| `global_configuration_aux` | 88K | Auxiliar config |
| `global_configuration_audit` | 88K | Auditoría cambios VG |
| `global_configuration_types` | 32K | Tipos de variable |
| `configuration_variables` | 32K | Variables de configuración |
| `denario_config` | 32K | Config Denario |
| `denario_versions` | 24K | Versiones |
| `denario_script_versions` | 24K | Versiones scripts |
| `notification_email` | 16K | Notificaciones email |
| `holiday` | 32K | Días feriados |
| `anio` | 32K | Años |
| `anio_fiscal` | 32K | Años fiscales |
| `cumplimiento` | 32K | TBD |

---

## Sincronización y auditoría

| Tabla | Tamaño ref. | Descripción / notas |
|-------|-------------|---------------------|
| `sync_log` | 8K | Log sincronización |
| `sync_log_1` | — | Partición / histórico |
| `sync_log_2` | — | Partición / histórico |
| `sync_log_integrator` | 112K | Log integrador |
| `sync_job_log_integrator` | 8K | Jobs integrador |
| `log_error` | 197M | Errores aplicación |

---

## Geografía y misc

| Tabla | Tamaño ref. | Descripción / notas |
|-------|-------------|---------------------|
| `country` | 24K | Países |
| `state` | 24K | Estados |
| `municipality` | 24K | Municipios |
| `parish` | 24K | Parroquias |
| `geometry_columns` | 16K | PostGIS metadata |
| `spatial_ref_sys` | 2.4M | PostGIS sistemas de referencia |

### Planes comerciales / cuotas

| Tabla | Tamaño ref. |
|-------|-------------|
| `quota_plan_enterprise` | 16K |
| `quota_plan_product` | 16K |
| `quota_plan_product_structure` | 72K |
| `quota_plan_segment` | 16K |
| `sales_plan_enterprise` | 32K |
| `sales_plan_enterprise_structure` | 16K |
| `sales_plan_product` | 16K |
| `sales_plan_product_structure` | 16K |
| `sales_plan_segment` | 16K |

---

## Sistema PostgreSQL / PostGIS

Tablas de extensión full-text search (no son dominio Denario):

- `pg_ts_cfg`, `pg_ts_cfgmap`, `pg_ts_dict`, `pg_ts_parser`

En DBeaver también existen carpetas **Foreign Tables** y **Vistas** — pendiente documentar.

---

## Tablas detalladas (columnas conocidas)

> Columnas inferidas del esquema móvil (`createTables.json`) y sync API. **Marcar como confirmadas** cuando se verifiquen en DBeaver (`\d collection` o panel Columnas).

### `enterprise`

| Columna | Tipo ref. | Notas |
|---------|-----------|-------|
| `id_enterprise` | INTEGER PK | |
| `co_enterprise` | VARCHAR | Código empresa (ej. `00001`) |
| `lb_enterprise` | VARCHAR | Nombre corto |
| `co_currency_default` | VARCHAR | Moneda default |
| `enterprise_default` | VARCHAR | Empresa por defecto |
| `priority_selection` | INTEGER | |

### `collection` ✅ confirmado DBeaver (2026-06-23)

PK: `id_collection` (serial4). Tiene carpetas **Restricciones**, **Claves foráneas** e **Índices** (pendiente documentar FKs).

| Columna | Tipo PG | Notas |
|---------|---------|-------|
| `id_collection` | serial4 | PK. Nro. ref cobro en UI |
| `co_collection` | varchar(30) | Código único transacción |
| `id_client` | int4 | FK → `client` |
| `co_client` | varchar(30) | RIF / código cliente |
| `na_client` | varchar(80) | **Nombre cliente** (en móvil: `lb_client`) |
| `st_collection` | int4 | Ver valores estatus arriba |
| `da_collection` | timestamp | Fecha cobro |
| `na_responsible` | varchar(80) | Responsable |
| `id_enterprise` | int4 | **FK → `enterprise`** (filtrar si el cliente es multi-empresa) |
| `nu_amount_total` | numeric(29,4) | |
| `co_currency` | varchar(30) | |
| `co_type` | int4 | 0 normal, 1 anticipo, 2 retención |
| `tx_comment` | text | |
| `id_user` | int4 | Usuario que registró el cobro |
| `co_enterprise` | varchar(30) | Código empresa (`00002`, etc.) |
| `da_update` | timestamp | Última actualización en servidor |
| `co_operation` | bpchar(1) | Operación sync (I/U/D) — TBD valores |
| `id_deposit` | int4 | FK depósito vinculado (si aplica) |
| `nu_difference` | numeric(29,4) | Diferencia de pago |
| `coordenada` | varchar(50) | GPS |
| `nueva_cuenta` | bool | TBD significado negocio |
| `nu_value_local` | numeric(29,4) | Tasa / valor local |
| `id_currency` | int4 | |
| `nu_amount_total_conversion` | numeric(29,4) | |
| `nu_difference_conversion` | numeric(29,4) | |
| `tx_conversion` | text | JSON conversión moneda |
| `nu_igtf` | numeric(29,4) | % IGTF |
| `nu_amount_igtf` | numeric(29,4) | |
| `nu_amount_final` | numeric(29,4) | Monto final |
| `nu_amount_igtf_conversion` | numeric(29,4) | |
| `nu_amount_final_conversion` | numeric(29,4) | |
| `da_created` | timestamp | Fecha creación en servidor |
| `id_original_collection` | int4 | ID cobro original (reversos) |
| `co_original_collection` | varchar(100) | Código cobro original |
| `da_voucher` | timestamp | Fecha comprobante |
| `has_igtf` | bool | |
| `has_attachments` | bool | |
| `nu_attachments` | int4 | |
| `id_conversion_type` | int4 | Tipo conversión moneda |
| `nu_amount_discount_total` | numeric(29,4) | |
| `nu_amount_discount_total_conversion` | numeric(29,4) | |

**Diferencias PG vs móvil (SQLite)**

| En móvil | En PostgreSQL |
|----------|---------------|
| `lb_client` | `na_client` |
| `da_rate` | No aparece en `collection` |
| `st_delivery` | No aparece en `collection` (estatus envío puede estar en `transaction_statuses`) |

### `collection_detail`

| Columna | Tipo ref. | Notas |
|---------|-----------|-------|
| `id_collection_detail` | INTEGER | |
| `co_collection` | VARCHAR | FK → `collection` |
| `co_document` | VARCHAR | Doc de venta |
| `id_document` | INTEGER | FK → `document_sale` |
| `co_type_doc` | VARCHAR | Tipo doc (A, etc.) |
| `nu_amount_doc` | NUMERIC | Monto documento |
| `nu_balance_doc` | NUMERIC | Saldo |
| `nu_amount_paid` | NUMERIC | Monto pagado |
| `nu_amount_retention` | NUMERIC | Retención IVA |
| `nu_amount_retention2` | NUMERIC | Retención ISLR |
| `nu_voucher_retention` | VARCHAR | Nro. comprobante 14 díg |
| `in_payment_partial` | BOOLEAN | Pago parcial |
| `da_document` | TIMESTAMP | Fecha documento |

### `collection_payment`

| Columna | Tipo ref. | Notas |
|---------|-----------|-------|
| `id_collection_payment` | INTEGER | |
| `co_collection` | VARCHAR | FK → `collection` |
| `co_payment_method` | VARCHAR | Efectivo, Transferencia, etc. |
| `id_bank` | INTEGER | |
| `na_bank` | VARCHAR | |
| `nu_amount_partial` | NUMERIC | Monto del método |
| `nu_payment_doc` | VARCHAR | Nro. documento pago |
| `da_collection_payment` | TIMESTAMP | |

### `document_sale`

| Columna | Tipo ref. | Notas |
|---------|-----------|-------|
| `id_document` | INTEGER | |
| `co_document` | VARCHAR | |
| `id_client` | INTEGER | |
| `co_client` | VARCHAR | |
| `id_enterprise` | INTEGER | |
| `nu_amount_total` | NUMERIC | |
| `nu_balance` | NUMERIC | Saldo pendiente |
| `da_document` | TIMESTAMP | |
| `da_due_date` | TIMESTAMP | Vencimiento |
| `co_currency` | VARCHAR | |
| `co_collection` | VARCHAR | Último cobro aplicado (si aplica) |

### `transaction_statuses`

| Columna | Tipo ref. | Notas |
|---------|-----------|-------|
| `co_transaction` | VARCHAR | = `co_collection` para cobros |
| `id_status` | INTEGER | FK → `statuses` |
| `co_status` | VARCHAR | |
| `da_transaction_statuses` | TIMESTAMP | Ordenar DESC para último estatus |
| `id_transaction_type` | INTEGER | |
| `co_transaction_type` | VARCHAR | |

---

## Queries útiles QA

Plantillas reutilizables. Sustituir `:id_enterprise`, `:co_client`, etc. según la playa. Ejemplos concretos por cliente en [Particularidades por cliente](#particularidades-por-cliente).

### Listar empresas de la playa

```sql
SELECT id_enterprise, co_enterprise, lb_enterprise, enterprise_default
FROM enterprise
ORDER BY id_enterprise;
```

### Cobros (todos o filtrados por empresa)

```sql
SELECT
    c.id_collection,
    c.co_collection,
    c.da_collection,
    c.co_client,
    c.na_client,
    c.co_type,
    CASE c.co_type
        WHEN 0 THEN 'Cobro normal'
        WHEN 1 THEN 'Anticipo/Prepago'
        WHEN 2 THEN 'Retención'
        ELSE c.co_type::text
    END AS tipo_cobro,
    c.co_currency,
    c.nu_amount_final,
    c.st_collection,
    c.id_enterprise,
    c.co_enterprise
FROM collection c
-- WHERE c.id_enterprise = :id_enterprise   -- descomentar si multi-empresa
ORDER BY c.da_collection DESC, c.id_collection DESC;
```

### Cobros con último estatus de transacción

```sql
SELECT
    c.id_collection,
    c.co_collection,
    c.da_collection,
    c.na_client,
    c.nu_amount_final,
    c.co_currency,
    c.id_enterprise,
    s.na_status
FROM collection c
LEFT JOIN LATERAL (
    SELECT ts.*
    FROM transaction_statuses ts
    WHERE ts.co_transaction = c.co_collection
    ORDER BY ts.da_transaction_statuses DESC
    LIMIT 1
) ts ON true
LEFT JOIN statuses s ON s.id_status = ts.id_status
-- WHERE c.id_enterprise = :id_enterprise
ORDER BY c.da_collection DESC;
```

### Detalle de documentos de un cobro / empresa

```sql
SELECT
    c.id_collection,
    c.na_client,
    c.id_enterprise,
    cd.co_document,
    cd.nu_amount_doc,
    cd.nu_balance_doc,
    cd.nu_amount_paid,
    cd.nu_amount_retention,
    cd.nu_amount_retention2,
    cd.in_payment_partial
FROM collection c
JOIN collection_detail cd ON cd.co_collection = c.co_collection
-- WHERE c.id_enterprise = :id_enterprise
ORDER BY c.id_collection DESC;
```

### Descubrir columnas de una tabla (meta-query)

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'collection'
ORDER BY ordinal_position;
```

---

## Particularidades por cliente

Cada playa usa la **misma estructura de tablas**; lo que cambia son los **datos**, la **URL del WS**, si hay **multi-empresa**, y las **VG** (`global_configuration` / `global_configuration_client`). Perfil YAML de QA: `automation/clientes/{cliente}/`.

### Plantilla (copiar al documentar un cliente nuevo)

```markdown
### {cliente_id} — {nombre comercial}

| Campo | Valor |
|-------|-------|
| WS / playa | {url o TBD} |
| Multi-empresa | sí / no (`enterpriseEnabled`) |
| Empresas | {tabla id_enterprise / co_enterprise o "una sola"} |
| Notas BDD | {cualquier hallazgo específico} |
| Última revisión | {fecha} |
```

---

### `jerez` — INVERSIONES JEREZ MOTORS (El Yaque)

| Campo | Valor |
|-------|-------|
| **WS** | `http://denarioelyaque.ddns.net:8081/PremiumWS/services/` |
| **Multi-empresa** | **Sí** — `enterpriseEnabled=true`, 3 empresas |
| **Usuario QA** | `001` (ver `secrets/qa-credentials.env`) |
| **Perfil YAML** | `automation/clientes/jerez/jerez.yaml` |

**Empresas**

| id_enterprise | co_enterprise | Notas QA |
|---------------|---------------|----------|
| 1 | 00001 | Default. Cartera azul, clientes sin docs pendientes |
| 2 | 00002 | Cartera roja, clientes con documentos / saldo |
| 3 | 00003 | Igual patrón que empresa 2 |

**Queries de ejemplo (Jerez)**

```sql
-- Cobros 2ª empresa
SELECT id_collection, co_collection, da_collection, na_client, co_type, nu_amount_final, co_currency
FROM collection
WHERE id_enterprise = 2
ORDER BY da_collection DESC;

-- Confirmar empresas
SELECT * FROM enterprise ORDER BY id_enterprise;
```

**Hallazgos QA**

- Mismo esquema `collection` confirmado en DBeaver (2026-06-23).
- Clientes con docs en emp. 2/3: FERRETERIA MUNDIAL, ISOLINA DEL CARMEN, MULTIREPUESTOS DRG, etc. (ver `jerez.yaml` → `modules.cobros`).
- Sin clientes habilitados para COBRO 25% IVA en ninguna empresa.

---

### Otros clientes (pendiente documentar en esta sección)

| Cliente | Multi-empresa | Notas |
|---------|---------------|-------|
| `insumar` | TBD | Isla Coche |
| `central_foods` | TBD | |
| `globalmp` | Sí (2 empresas en UI) | |
| `hidroponias` | TBD | |
| `romher` | TBD | El Yaque (otra instancia) |

> Al conectar DBeaver a otra playa, validar que el listado de tablas coincide con este documento y anotar aquí solo lo que **difiera** (si algo difiere).

---

## Changelog

| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-06-23 | QA / Cursor | Creación inicial desde capturas DBeaver. Mapeo singular PG vs plural SQLite. |
| 2026-06-23 | QA / Cursor | Columnas de `collection` confirmadas (41 columnas). `na_client` ≠ `lb_client` móvil. |
| 2026-06-23 | QA / Cursor | Reorganización: esquema general + sección particularidades por cliente. Queries genéricos. |

---

## Pendiente por verificar

- [x] Confirmar columnas de `collection` en DBeaver (2026-06-23)
- [ ] Confirmar columnas de `collection_detail`, `collection_payment` en DBeaver
- [ ] Documentar FKs e índices de `collection` (carpetas en DBeaver)
- [ ] Significado de `co_operation`, `nueva_cuenta`, `id_deposit` en `collection`
- [ ] Documentar **Vistas** y **Foreign Tables** del schema
- [ ] PK/FK reales (constraints) de tablas de cobros
- [ ] Valores de `statuses` / `transaction_types` para cobros enviados vs guardados en servidor
- [ ] Si `st_collection` en PG coincide con los valores móviles (0–3)
- [ ] Tamaños de `deposit_collection_payment`, `product_valor`, `visit_planning`
- [ ] Completar subsecciones de particularidades: insumar, central_foods, globalmp, hidroponias, romher
