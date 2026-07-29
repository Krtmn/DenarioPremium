# Modelo de datos Denario Premium — referencia QA

> Documento de dominio (DDD) generado por exploración **solo lectura** de la BD `don_theo` (PostgreSQL 17.9).
> Objetivo: que las corridas QA **no tengan que re-indagar el esquema**. Detalla a fondo los dominios transaccionales y da inventario+propósito del resto.
> Validado con la corrida QA real: pedido **33**, cobro **17**, devolución **10**, inventario **11**, visita **5**, cliente potencial ref **84** (id_client=84, "Test-CLT-SMOKE-103920", RIF V99887766).

---

## 1. Resumen y conexión

- **RDS PostgreSQL compartido**, una **base de datos por cliente** (Denario es multi-tenant por DB, no por schema). El nombre de base por cliente es el campo `db_name` del YAML del cliente (`automation/clientes/<cliente>.yaml`). `don_theo` es la base de una de esas instancias QA.
- **Todas las bases comparten el mismo esquema Denario**, por lo que este documento sirve para *cualquier* cliente.
- Conexión QA: usuario **`user_read`** (read-only confirmado: 180 tablas legibles, 0 escribibles), `sslmode=no-verify`. Toda consulta es **SELECT**, `statement_timeout=30s`.
- Herramienta de consulta: `cd /c/Users/astri/AppData/Local/Temp/qa-db-tool && node query.js "<SQL>"` → devuelve filas como JSON.
- **180 tablas** en schema `public` (excluyendo `pg_catalog`/`information_schema`). El schema también contiene tablas PostGIS auxiliares (`geometry_columns`, `spatial_ref_sys`) y `pg_ts_*` (full-text), que **no son del dominio Denario**.

> ⚠️ Esta es la **BD del servidor (ERP/Denario web)**. La app móvil sincroniza hacia aquí. Las columnas `co_operation` (I/U/D) y `da_update` son marcadores de **sincronización** (ver §7). El `id_*` de servidor **no coincide** con el id local del dispositivo: el correlativo de negocio que sí viaja desde el móvil es `co_*` (ej. `co_order = '1781275493303.0'`, un timestamp-epoch generado en el dispositivo).

---

## 2. Convenciones de nombres

Denario usa prefijos consistentes en columnas (heredados del modelo Geometa/BDGE):

| Prefijo | Significado | Ejemplos |
|---|---|---|
| `id_` | **PK/FK interna** (entero serial del servidor) | `id_order`, `id_client`, `id_collection` |
| `co_` | **Código de negocio** (texto). En cabeceras transaccionales suele ser el correlativo epoch generado en el móvil; en catálogos es el código del ERP/SAP | `co_order`, `co_client`, `co_collection`, `co_product` |
| `na_` | **Nombre** (denormalizado para snapshot) | `na_client`, `na_responsible`, `na_product` |
| `nu_` | **Número / monto / cantidad numérica** | `nu_amount_total`, `nu_rif`, `nu_amount_paid`, `nu_attachments` |
| `qu_` | **Cantidad** (quantity, de unidades/stock) | `qu_order`, `qu_product`, `qu_stock`, `qu_suggested` |
| `da_` | **Fecha/timestamp** | `da_order`, `da_created`, `da_update`, `da_collection` |
| `st_` | **Estado/status** (entero → catálogo `statuses`) | `st_order`, `st_collection`, `st_return`, `st_visit` |
| `co_operation` | **Marcador de sincronización** (I/U/D o num.) | en casi todas las tablas transaccionales |
| `in_` | **Booleano/indicador** | `in_suspension`, `in_payment_partial`, `in_order_review` |
| `tx_` | **Texto largo / comentario** | `tx_comment`, `tx_description`, `tx_address` |
| `lb_` / `em_` | etiqueta / email | `lb_client`, `em_client` |
| `has_attachments` / `nu_attachments` | flag + conteo de adjuntos (patrón repetido en todas las cabeceras) | order, collection, return, visit, client_stock, potential_client |

**Tablas:** singular en inglés para entidades (`order`, `client`, `product`, `visit`), `_detail` para líneas, `_detail_unit` para el desglose por unidad de venta. Cabecera→detalle→detalle_unit es el patrón de **3 niveles** en pedidos e inventarios.

> Nota: `order` y `return_detail` usan PK no estándar — ver §4. La tabla `"order"` requiere comillas (palabra reservada SQL).

---

## 3. Inventario completo (180 tablas)

Agrupado por dominio. "filas" = `reltuples` aproximado (`-1` = sin analizar/vacía).

### Transaccional QA (cabecera + detalle)
| Tabla | Dominio | Propósito | filas |
|---|---|---|---|
| `order` | pedidos | Cabecera de pedido | 32 |
| `order_detail` | pedidos | Línea de pedido (producto) | 73 |
| `order_detail_unit` | pedidos | Cantidad por unidad de venta de cada línea | 73 |
| `order_detail_bonus` / `_discount` / `_support` / `_saved` | pedidos | Bonificaciones, descuentos, soporte y borradores de líneas | — |
| `order_saved` / `order_detail_saved` / `order_detail_unit_saved` | pedidos | Pedido en borrador (no enviado) | 1 |
| `order_template` | pedidos | Plantilla de pedido (sugeridos) | 297 |
| `order_images` / `order_invoice` / `order_type` / `order_type_product_structure` | pedidos | Imágenes, vínculo a factura, tipos | — |
| `collection` | cobros | Cabecera de cobranza | 16 |
| `collection_detail` | cobros | Documentos (facturas) cobrados en la cobranza | 4 |
| `collection_payment` | cobros | Formas de pago aplicadas (efectivo/transf./cheque) | 16 |
| `collection_detail_discounts` / `collect_discounts` / `collection_discounts` | cobros | Descuentos por pronto pago | — |
| `collection_reconciliation` | cobros | Conciliación de pagos | — |
| `return` | devoluciones | Cabecera de devolución | 9 |
| `return_detail` | devoluciones | Línea de devolución (producto+motivo) | 10 |
| `return_category` / `return_motive` / `return_type` | devoluciones | Catálogos (categoría/motivo/tipo) | 2/35/12 |
| `client_stock` | inventarios | Cabecera de inventario levantado en el cliente | 10 |
| `client_stock_detail` | inventarios | Producto inventariado | 14 |
| `client_stock_detail_unit` | inventarios | Cantidad/lote/vencimiento por unidad | 18 |
| `deposit` | depositos | Depósito bancario del vendedor | 2 |
| `deposit_collection_payment` | depositos | Relaciona depósito ↔ pagos de cobranza | — |
| `visit` | visitas | Cabecera de visita planificada/realizada | 43 |
| `incidence` | visitas | Incidencia registrada en una visita | 13 |
| `incidence_motive` / `incidence_type` / `incidence_type_role` | visitas | Catálogos de incidencias | 146/47/47 |
| `visit_cycles` / `visit_planning` | visitas | Ciclos y planificación de visitas | 18/— |
| `sale_visit` / `sale_route` / `rutero` | visitas | Rutas y rutero de ventas | —/—/4 |
| `potential_client` | clientes | Cliente potencial (alta desde móvil) | 12 |

### Maestros / catálogos
| Tabla | Dominio | Propósito | filas |
|---|---|---|---|
| `client` | clientes | Maestro de clientes | 3439 |
| `client_auditoria` / `client_avg_product` / `client_bank_account` / `client_channel_order_type` / `client_stock` (ver arriba) / `client_template_user` / `client_type` | clientes | Auditoría, promedios de compra, cuentas, plantillas, tipos | — |
| `address_client` / `address_type` / `user_address_clients` | clientes | Direcciones de despacho del cliente | 3425/1/46 |
| `product` | productos | Maestro de productos | 297 |
| `product_unit` | productos | Unidades de venta de un producto (unid/bulto) | 297 |
| `product_image` / `product_min_mul_fav` / `product_structure` / `product_valor` / `user_product_favs` | productos | Imágenes, mín/múltiplo/fav, estructura, valores | — |
| `price_list` / `price_list_zone` / `unit_pricelist` | productos | Listas de precios | 875/1/— |
| `bonus` / `discount` / `global_discount` / `straight_swap` | productos | Bonificaciones/descuentos/canje directo | — |
| `stock` / `stock_history` / `warehouse` | productos | Inventario por almacén + historial | 133/72677/3 |
| `unit` / `conversions` / `conversion_type` | productos | Unidades y conversiones | 6/1/17 |
| `suggested` | productos | Sugeridos (promedios) | — |
| `invoice` | facturas | Facturas del ERP (documentos cobrables) | 2874 |
| `invoice_detail` / `invoice_detail_unit` / `invoice_detail_discount` | facturas | Líneas de factura | 6555 |
| `document_sale` / `document_sale_type` / `document_sale_type_index` / `denario_document_sale_type` / `type_document` | facturas | Documentos de venta y tipos | 1223/3/… |
| `balance_docsale` / `balance_type` | facturas | Saldos de documentos | — |

### Usuarios / seguridad / empresa
| Tabla | Propósito | filas |
|---|---|---|
| `users` / `users_data` / `user_information` | Usuarios (vendedores/admin) + datos | 16/16/— |
| `role` / `role_user` / `role_component` / `component` | Roles y permisos de menú | 12/16/91/24 |
| `users_enterprise` / `users_supervisor` / `users_device` / `device` / `devices_audit` | Empresa, supervisión, dispositivos | 15/—/—/—/98 |
| `license_type` / `license_user` | Licencias | 2/15 |
| `enterprise` / `enterprise_structure` / `enterprise_distributor` / `enterprise_konnector` / `type_enterprise_structure` | Empresa y estructura comercial | 1/32/… |
| `transaction_device_auth` | Autorización de transacciones por dispositivo | 126 |

### Configuración / Variables Globales (ver §6)
| Tabla | Propósito | filas |
|---|---|---|
| `global_configuration` | **Variables Globales (VGs)** clave/valor | 165 |
| `global_configuration_client` / `global_configuration_audit` / `global_configuration_types` | VGs por cliente, auditoría, tipos | 76/23/3 |
| `configuration_variables` | Parámetros numéricos (meses activación/inventario, rangos) | 1 |
| `denario_config` / `denario_versions` / `denario_script_versions` | Config y versiones de Denario | — |
| `currency` / `currency_enterprise` / `currency_modules` / `currency_relation` | Monedas y multimoneda | 2/2/9/1 |
| `payment_method` / `payment_condition` | Formas y condiciones de pago | 6/2 |
| `bank` / `bank_account` | Bancos y cuentas | 13/13 |
| `notification_email` / `collect_dashboard_config` / `igtf_list` / `iva_list` | Notificaciones, dashboard, IGTF, IVA | 2/5/—/1 |

### Adjuntos / firmas / estados (polimórficos — ver §5)
| Tabla | Propósito | filas |
|---|---|---|
| `transaction_image` / `transaction_image_saved` | Imágenes adjuntas a cualquier transacción | 21/— |
| `transaction_files` / `transaction_files_saved` | Archivos adjuntos | 3/— |
| `transaction_signatures` | Firmas digitales | 36 |
| `transaction_statuses` | Historial de cambios de estado | 73 |
| `transaction_types` / `statuses` | Catálogo de tipos de transacción y estados | 6/13 |

### Geografía / catálogos descriptivos (lov)
| Tabla | Propósito | filas |
|---|---|---|
| `country` / `state` / `municipality` / `parish` / `sector` / `zone_transport` | Jerarquía geográfica | — |
| `lov` / `lov_index` | Listas de valores genéricas (códigos descriptivos) | 76/18 |
| `sale_org` / `distribution_channel` / `code_phone_number` / `difference_codes` | Estructura comercial SAP, canales, códigos | — |

### Planificación / cuotas / sync / logs
| Tabla | Propósito | filas |
|---|---|---|
| `quota_plan_enterprise` / `quota_plan_product` / `quota_plan_product_structure` / `quota_plan_segment` | Planes de cuota | 264/—/180/— |
| `sales_plan_enterprise` (+ `_structure`/`_product`/`_product_structure`/`_segment`) | Planes de venta | 12/… |
| `budget` / `cumplimiento` / `tacometro` / `cumplimiento` | Presupuesto y KPIs dashboard | 4/2/6 |
| `sync_log` (+ `_1`/`_2`) / `sync_log_integrator` / `sync_job_log_integrator` | Bitácora de sincronización ERP↔Denario | 41/… |
| `log_error` / `failed_transactions` | Logs de error y transacciones fallidas | 15551/— |
| `anio` / `anio_fiscal` / `holiday` / `list` / `modules` / `statuses` | Calendario, módulos, listas | 13/12/…/9/13 |
| `users_enterprise_clients_auditoria` / `client_auditoria` | Auditoría cliente↔empresa | 985/— |

### Auxiliares no-Denario (PostGIS / full-text)
`geometry_columns`, `spatial_ref_sys`, `pg_ts_cfg`, `pg_ts_cfgmap`, `pg_ts_dict`, `pg_ts_parser` — **ignorar para QA**.

---

## 4. Modelo por dominio (DDD)

Para cada dominio: cabecera, detalle(s), PK/FK clave y diagrama textual. Columnas comunes en cabeceras: `id_<x>` (PK), `co_<x>` (correlativo epoch del móvil), `st_<x>` (estado), `id_client`/`co_client`, `id_user`/`co_user`, `id_enterprise`, `co_operation`, `da_update`, `da_created`, `has_attachments`, `nu_attachments`.

### 4.1 Pedidos (3 niveles)
```
order (id_order PK, co_order, st_order, nu_amount_total, nu_amount_final, nu_details,
       id_client, id_user, id_address_client, id_currency, da_created)
  └─< order_detail (id_order_detail PK, id_order FK→order, id_product, co_product,
                    nu_price_base, nu_amount_total, nu_discount_total, iva, id_price_list)
        └─< order_detail_unit (id_order_detail_unit PK, id_order_detail FK→order_detail,
                               id_product_unit, qu_order, qu_suggested)
```
- **FK confirmada:** `order_detail.id_order → order.id_order`. `order_detail_unit` se liga por `id_order_detail`/`co_order_detail` (sin FK declarada en BD, vínculo lógico).
- `order.nu_details` guarda el conteo de líneas (en pedido 33 = 1; pedido 34 = 2). **Validado:** pedido 33 → 1 detalle, 2 unidades (`qu_order` suma 2).
- Borradores: `order_saved` / `order_detail_saved` / `order_detail_unit_saved`.

### 4.2 Cobros
```
collection (id_collection PK, co_collection, st_collection, nu_amount_total, nu_amount_final,
            nu_igtf, nu_amount_igtf, has_igtf, id_client, id_user, co_currency, id_deposit?)
  ├─< collection_detail (id_collection_detail PK, id_collection FK→collection, co_document,
  │                      nu_amount_doc, nu_amount_paid, nu_balance_doc, nu_amount_retention,
  │                      in_payment_partial, has_discount)   ← documentos/facturas cobrados
  └─< collection_payment (id_collection_payment PK, id_collection FK, id_collection_detail,
                          co_payment_method, id_bank, nu_amount_partial, nu_payment_doc,
                          da_value, id_difference_code)       ← formas de pago aplicadas
```
- **FK confirmada:** `collection_detail.id_collection → collection.id_collection`. `collection_payment` se liga por `id_collection`/`id_collection_detail` (vínculo lógico).
- IGTF: columnas `nu_igtf` (tasa), `nu_amount_igtf`, `nu_amount_final` (total+IGTF). VGs `disableCheckIGTF`/`igtfDefault`/`userCanSelectIGTF` (tipo C).
- `collection_detail.co_document` referencia a `invoice.co_invoice` (documento que se cobra). **Validado:** cobro 17 → 1 detalle + 1 pago, total 7.00 Bs., st_collection=3 ("Por aprobar" para cob).
- Los **documentos cobrables** vienen de `invoice` / `invoice_detail` (facturas del ERP).

### 4.3 Devoluciones
```
return (id_return PK, co_return, st_return (→ statuses, tipo 'dev'), id_client, id_user,
        nu_amount, co_currency, co_type, co_motive, nu_seal, has_attachments)
  └─< return_detail (co_detail PK ⚠, id_return FK→return, id_product, co_product, na_product,
                     qu_product, nu_price, nu_amount, nu_lote, da_duedate, co_document, id_motive)
```
- ⚠ **PK no estándar:** `return_detail.co_detail` (no `id_return_detail`).
- **FK confirmada:** `return_detail.id_return → return.id_return`.
- **Estado: `return.st_return` apunta a `statuses` (tipo `dev`), igual que el resto de módulos** (CONFIRMADO 2026-06-16 por QA + datos). Las 10 devoluciones tienen `st_return=1` = `statuses`(id_status=1, co_transaction_type='dev', "Por aprobar"); id=8 = `dev`/"Enviado". Ver §5 para el modelo de dos catálogos (`statuses` móvil ↔ `lov` web). Corrige una versión previa de este doc que afirmaba "estado vía LOV, no statuses".
- **Validado:** devolución 10 → 1 línea en `return_detail`.

### 4.4 Inventarios en cliente (client_stock, 3 niveles)
```
client_stock (id_client_stock PK, co_client_stock, st_client_stock, id_client, id_user,
              id_address_client, coordenada, id_order?, has_attachments)
  └─< client_stock_detail (id_client_stock_detail PK, id_client_stock FK, id_product, co_product)
        └─< client_stock_detail_unit (id_client_stock_detail_unit PK, id_client_stock_detail FK,
                                      id_product_unit, qu_stock, nu_batch, da_expiration, ubicacion)
```
- Lote/vencimiento viven en `client_stock_detail_unit` (`nu_batch`, `da_expiration`). VG `expirationBatch=true` activa esto.
- **Validado:** inventario 11 → 1 detalle.
- ⚠ No confundir con `stock` (inventario por almacén del ERP) ni `stock_history`.

### 4.5 Depósitos
```
deposit (id_deposit PK, co_deposit, st_deposit, co_bank, nu_account, nu_document,
         da_document, nu_amount_doc, co_currency, id_user, coordenada)
  └─ deposit_collection_payment (id_deposit FK, id_collection_payment FK)  ← N:M depósito↔pagos
```
- Un depósito agrupa varios `collection_payment` (los pagos en efectivo/transf. que el vendedor deposita). Relación N:M vía `deposit_collection_payment`.

### 4.6 Visitas + incidencias
```
visit (id_visit PK, co_visit, st_visit, id_client, id_user, id_address_client,
       da_visit, da_real, da_initial, coordenada, is_visited, is_dispatched, is_reassigned,
       id_cycle, has_attachments)
  └─< incidence (co_incid PK ⚠, id_visit FK→visit, co_type FK→incidence_type,
                 co_cause FK→incidence_motive, tx_description)
```
- ⚠ **PK no estándar:** `incidence.co_incid`.
- **FK confirmadas:** `incidence.id_visit→visit`, `incidence.co_type→incidence_type.id_type`, `incidence.co_cause→incidence_motive.id_motive`.
- **Validado:** visita 5 → st_visit=2 ("Enviado"), 1 incidencia asociada.

### 4.7 Clientes potenciales (alta desde móvil)
```
potential_client (id_client PK ⚠, co_client, na_client, nu_rif, na_responsible,
                  em_client, nu_phone, tx_address, coordenada, st_potential_client,
                  id_user, has_attachments, da_created)
```
- ⚠ PK es `id_client` (no `id_potential_client`); ojo, NO es FK al maestro `client` — es secuencia propia de potenciales.
- **Validado:** ref 84 → id_client=84, na_client="Test-CLT-SMOKE-103920", RIF V99887766, st=1.
- Maestro de clientes "reales": `client` (3439 filas, PK `id_client`, código `co_client`, `nu_rif`, `na_client`).

---

## 5. Adjuntos, firmas y estados (patrón polimórfico)

Las imágenes/archivos/firmas **no** se guardan por dominio; se centralizan en tablas polimórficas que apuntan a la cabecera por **nombre de módulo + id**:

| Tabla | Columnas de vínculo | Contenido |
|---|---|---|
| `transaction_image` | `na_transaction` (módulo: `pedidos`/`cobros`/`visitas`/`clientes`/`devoluciones`/`inventarios`/`depositos`), `id_transaction` (= id de la cabecera), `na_image` | imágenes/fotos adjuntas |
| `transaction_files` | `na_transaction`, `id_transaction`, `na_file` | archivos adjuntos |
| `transaction_signatures` | `na_transaction`, `id_transaction`, `na_image` | firma del cliente/vendedor |
| `transaction_statuses` | `co_transaction_type` (`ped`/`cob`/`dev`/`inv`/`dep`/`vis`), `id_transaction`, `id_status`, `da_transaction_statuses`, `tx_comment` | **historial de estados** |

> Para verificar adjuntos de una transacción: `WHERE na_transaction='cobros' AND id_transaction=<id_collection>`. La cabecera además lleva `has_attachments` + `nu_attachments` denormalizados (deben coincidir con el conteo real).

### Catálogo de tipos de transacción (`transaction_types`)
| id | co | nombre |
|---|---|---|
| 1 | `vis` | Visitas |
| 2 | `ped` | Pedidos |
| 3 | `cob` | Cobros |
| 4 | `dev` | Devoluciones |
| 5 | `inv` | Inventarios |
| 6 | `dep` | Depósitos |

### Catálogo de estados (`statuses`) — el `st_*` de cada cabecera apunta aquí
Los estados son **por tipo de transacción** (`co_transaction_type`). Estados base:
- `env` = **Enviado**, `pap` = **Por aprobar**, y para cobros además `01`=Aprobado, `02`=Pendiente, `03`=Rechazado.

| id_status | co_status | na_status | tipo |
|---|---|---|---|
| 1 | pap | Por aprobar | dev |
| 2 | env | Enviado | inv |
| 3 | pap | Por aprobar | cob |
| 4 | env | Enviado | ped |
| 5 | pap | Por aprobar | dep |
| 6 | pap | Por aprobar | inv |
| 7 | env | Enviado | cob |
| 8 | env | Enviado | dev |
| 9 | env | Enviado | dep |
| 10 | pap | Por aprobar | ped |
| 11 | 01 | Aprobado | cob |
| 12 | 02 | Pendiente | cob |
| 13 | 03 | Rechazado | cob |

> Observado: pedido 33/34 con `st_order=1`, cobro 17 con `st_collection=3` (pap/cob), visita 5 con `st_visit=2`. **Estos valores `st_*` son ids de `statuses` filtrados por su tipo**, no índices globales — confirmar con desarrollo el mapeo exacto por módulo, pues el catálogo tiene ids solapados entre tipos.

### Dos catálogos de estado: `statuses` (móvil) ↔ `lov` (web)  — CONFIRMADO 2026-06-16
Los estados viven en **dos catálogos paralelos**, cada uno en su capa. **El webservice es la fuente de verdad y los controla**; si cambian en el servidor, se **sincronizan a la móvil**.

- **`statuses` = catálogo de la MÓVIL.** Las columnas `st_*` de cada cabecera (`st_order`, `st_collection`, `st_return`, `st_visit`, `st_client_stock`, `st_deposit`) apuntan aquí, filtradas por `co_transaction_type`. **Todos los módulos están, incluidas las devoluciones (`dev`).** Tabla completa de `statuses` por tipo:

  | tipo | estados (id_status) |
  |---|---|
  | `ped` | 4=Enviado · 10=Por aprobar |
  | `cob` | 3=Por aprobar · 7=Enviado · 11=Aprobado · 12=Pendiente · 13=Rechazado |
  | `dev` | 1=Por aprobar · 8=Enviado |
  | `inv` | 2=Enviado · 6=Por aprobar |
  | `dep` | 5=Por aprobar · 9=Enviado |

- **`lov` = catálogo genérico del lado WEB**, organizado por listas (`co_list`, ver `lov_index`). Maneja los estados a nivel web/ERP, en listas por módulo:

  | `co_list` | lista | contenido |
  |---|---|---|
  | 3 | Estatus de Transacciones | estados de integración/ERP: por generar, generado, guardado, en proceso al ERP, anulado (99) |
  | 4 | Estatus de Informe de ventas | En Proceso, Rechazado, Por Aprobar |
  | 7 | Estatus de Cobranzas | (cobros, web) |
  | 8 | Estatus de Depósitos | |
  | 9 | Estatus de Visita | |

  ⚠ **No existe una lista `lov` dedicada "Estatus de Devoluciones"** en `lov_index` (sí hay para pedidos/cobros/depósitos/visitas). A nivel web las devoluciones probablemente reutilizan `co_list=3` (Estatus de Transacciones general) — **PENDIENTE confirmar con desarrollo**.

> Para QA: al verificar BD, leer el estado por `statuses` (es lo que sincroniza la móvil). `lov` es referencia del lado web/integración.

---

## 6. Configuración / Variables Globales (VGs)

Las VGs que se usan en `automation/clientes/<cliente>.yaml` se almacenan en **`global_configuration`** (NO en `configuration_variables`, que solo tiene parámetros numéricos de dashboard).

**Estructura de `global_configuration`** (165 filas): `clave` (texto, ej. `requiredCollectionAttachments`), `valor` (texto, ej. `"false"`), `tipo_valor` (`selectBoolean`/`integer`/…), `tipo_variable`, `descripcion`, `editable`, `dependent_clave`/`dependent_valor` (VGs condicionadas).

**`tipo_variable`** clasifica el alcance:
| tipo | nº | significado |
|---|---|---|
| `G` | 78 | Global (toda la empresa) |
| `C` | 42 | Por **cliente/comportamiento** (ej. flags de cobro/IGTF) |
| `P` | 45 | Parámetro |

> VGs por cliente que sobreescriben el global → `global_configuration_client` (misma estructura, 76 filas). `global_configuration_audit` guarda cambios.

### VGs clave para QA (validadas en `don_theo`) y su mapeo al YAML
| clave (VG) | valor en don_theo | tipo | módulo QA afectado |
|---|---|---|---|
| `requiredCollectionAttachments` | `false` | C | cobros — ¿adjunto obligatorio? (coincide con `insumar.yaml`) |
| `signatureOrder` / `signatureCollection` / `signatureReturn` / `signatureVisit` / `signatureStock` / `signatureDeposit` / `signatureClient` | `true` | G | firma obligatoria por módulo |
| `cloudAttachments` | `false` | G | adjuntos en nube vs local |
| `emailWithAttach` | `true` | G | envío de email con adjunto |
| `quAttach` / `quFileAttach` | `25` / `1` | G | máximo de imágenes/archivos |
| `disableCheckIGTF` / `igtfDefault` / `userCanSelectIGTF` | `false` | C | cobros — comportamiento IGTF |
| `clientStock` | `true` | — | inventarios — habilita inventario en cliente |
| `expirationBatch` | `true` | — | inventarios — pide lote/vencimiento |
| `enablePartialPayment` / `alwaysPartialPayment` / `historicPartialPayment` | true/false/true | — | cobros — pago parcial |
| `currencyModule` / `currencyBank` / `canChangeRate` | true | — | multimoneda |
| `checkAddressClient` / `addressByUser` | true/false | — | clientes — direcciones |
| `imageWeightLimit` / `longitudComentario` / `historyMonths` / `mesesFacturas` | 30/200/1/3 | — | límites varios |

Consulta directa de una VG: `SELECT clave, valor, tipo_variable FROM global_configuration WHERE clave='requiredCollectionAttachments'`.

---

## 7. Sincronización y soft-delete (notas para QA)

- **`co_operation`** (presente en casi todas las transaccionales): marcador de operación de sync (Insert/Update/Delete). NO es un borrado físico — Denario usa **soft-state vía sync**, no se observaron columnas `deleted_at`. Una fila "borrada" en el móvil puede llegar con `co_operation='D'`.
- **`da_update`** vs **`da_created`**: `da_created` = alta; `da_update` = última sincronización/modificación.
- **`co_*` (epoch) es la clave de correlación móvil↔servidor**, no el `id_*`. Para localizar una transacción creada en el móvil, buscar por `co_order`/`co_collection`/etc. (timestamp epoch) si se conoce, o por `id_*` del servidor.
- `sync_log` / `sync_log_integrator` / `failed_transactions`: bitácora útil si una transacción del móvil **no aparece** en la cabecera (revisar fallos de integración).
- `st_integrador` (en `visit`) y similares: estado de integración hacia el ERP.

---

## 8. Mapa "Módulo QA → tablas a verificar tras una transacción"

Insumo directo para verificación BD post-transacción. Tras crear/enviar desde el móvil, hacer SELECT por la **cabecera** (filtrar por `co_<x>` epoch o el `id` recién creado) y confirmar que el/los **detalle(s)** existen y los montos cuadran.

| Módulo QA | Cabecera (PK) | Detalle(s) (FK→cabecera) | Vínculo | Adjuntos/firma/estado |
|---|---|---|---|---|
| **pedidos** | `order` (id_order) | `order_detail` (id_order) → `order_detail_unit` (id_order_detail) | `nu_details` = nº líneas | `transaction_image/files/signatures` na_transaction='pedidos'; `transaction_statuses` co_transaction_type='ped' |
| **cobros** | `collection` (id_collection) | `collection_detail` (id_collection) + `collection_payment` (id_collection) | detail=docs, payment=formas pago; total = Σ pagos | na_transaction='cobros' / `cob`; chequear `nu_igtf`/`nu_amount_final` |
| **devoluciones** | `return` (id_return) | `return_detail` (id_return, **PK co_detail**) | st vía `lov` | na_transaction='devoluciones' / `dev` |
| **inventarios** | `client_stock` (id_client_stock) | `client_stock_detail` (id_client_stock) → `client_stock_detail_unit` (id_client_stock_detail) | lote/venc. en _unit | na_transaction='inventarios' / `inv` |
| **depositos** | `deposit` (id_deposit) | `deposit_collection_payment` (id_deposit ↔ id_collection_payment) | N:M con pagos | na_transaction='depositos' / `dep` |
| **visitas** | `visit` (id_visit) | `incidence` (id_visit, **PK co_incid**) | incidencia opcional | na_transaction='visitas' / `vis`; flags `is_visited`/`is_dispatched` |
| **clientes** | `potential_client` (id_client) | — (sin detalle) | maestro real = `client` | na_transaction='clientes' |
| **productos** | `product` (id_product) | `product_unit` (id_product), `price_list` | solo lectura/consulta | — |
| **vendedores** | `users` (id_user) | `role_user`, `users_enterprise`, `license_user` | solo lectura/consulta | — |
| **login** | `users` / `role_user` / `transaction_device_auth` | — | autenticación | — |

**Consultas de verificación tipo (ejemplos):**
```sql
-- Pedido recién creado: cabecera + nº detalles + unidades
SELECT o.id_order, o.co_order, o.st_order, o.nu_amount_total, o.nu_details,
       (SELECT count(*) FROM order_detail d WHERE d.id_order=o.id_order) det,
       (SELECT count(*) FROM order_detail_unit u JOIN order_detail d ON d.id_order_detail=u.id_order_detail
        WHERE d.id_order=o.id_order) units
FROM "order" o WHERE o.id_order = <ID>;

-- Cobro: detalle (docs) + pagos + adjuntos
SELECT (SELECT count(*) FROM collection_detail WHERE id_collection=<ID>) docs,
       (SELECT count(*) FROM collection_payment WHERE id_collection=<ID>) pagos,
       (SELECT count(*) FROM transaction_image WHERE na_transaction='cobros' AND id_transaction=<ID>) imgs;
```

---

## 9. Hallazgos notables y dudas para desarrollo

- **PKs no estándar** (cuidado en JOINs): `return_detail.co_detail`, `incidence.co_incid`, `potential_client.id_client`.
- **FKs no siempre declaradas:** `order_detail_unit`, `collection_payment`, `client_stock_detail_unit` se ligan por columnas (`id_<padre>`) pero **sin constraint FK** en BD — el vínculo es lógico/aplicativo. Verificar integridad manualmente.
- **Dos catálogos de estado (CONFIRMADO 2026-06-16):** `statuses` (móvil, donde apuntan los `st_*` incl. `st_return` tipo `dev`) y `lov` (web, listas por módulo). El **webservice controla los estados y los sincroniza a la móvil**. `st_return` SÍ está en `statuses` — corregida la afirmación previa de "vía LOV, no statuses". Ver §5. Pendiente: confirmar qué lista `lov` usan las devoluciones a nivel web (no hay una dedicada).
- **Estados (`statuses`) con ids solapados por tipo** — el `st_*` de cada cabecera debe interpretarse junto con el tipo de transacción. El mapeo por tipo ya está tabulado en §5; el catálogo reutiliza nombres (pap/env) en ids distintos por tipo.
- **No hay soft-delete con flag dedicado**: el borrado viaja vía `co_operation`. Confirmar política de borrado lógico.
- **`co_*` epoch = correlación móvil↔servidor**; `id_*` es serial del servidor y no existe en el dispositivo. Para QA, identificar transacciones por `co_*` cuando se conozca el del móvil.
- VGs viven en **`global_configuration`** (clave/valor), con override por cliente en `global_configuration_client`. El campo `tipo_variable` (G/C/P) define alcance.
- `invoice`/`invoice_detail` (2874/6555 filas) son las **facturas del ERP** que alimentan los documentos cobrables (`collection_detail.co_document`).
- Tablas `*_saved` = **borradores locales** no enviados (pedido borrador en `order_saved`).

---

## 10. Queries útiles QA

> Rescatadas de `bdd-schema.md` (archivado 2026-07-28) al depurar el proyecto. Ese archivo no lo
> referenciaba nadie y estas plantillas se estaban perdiendo. Sustituir `:id_enterprise` según la playa.

### 🔴 Estatus REAL de una transacción — `st_*` NO indexa contra `statuses.id_status`

**Este es el query que evita el error más caro de interpretación de BD.** Leer `st_collection` y buscarlo
en el catálogo `statuses` **da un resultado falso**: en `el_valle-20260728`, los 4 cobros tenían
`st_collection=3`, y `statuses.id_status=3` para `co_transaction_type='cob'` es **"Rechazado"** — pero la
web mostraba **"Por aprobar"**. Reportar "cobros rechazados" habría mandado a desarrollo por el camino
equivocado. El estatus real vive en **`transaction_statuses`** (el último por fecha):

```sql
SELECT c.id_collection, c.co_type, c.nu_amount_total,
       c.st_collection,              -- ⚠ NO interpretar con el catálogo statuses
       s.na_status AS estatus_real   -- ✅ éste es el que muestra la web
FROM collection c
LEFT JOIN LATERAL (
    SELECT ts.* FROM transaction_statuses ts
    WHERE ts.co_transaction = c.co_collection
    ORDER BY ts.da_transaction_statuses DESC LIMIT 1
) ts ON true
LEFT JOIN statuses s ON s.id_status = ts.id_status
ORDER BY c.da_collection DESC;
```
✅ **Verificado 2026-07-28** contra la web de La Tortuga: devuelve `Por aprobar` para los 4 cobros, coincidiendo
1:1 con la UI. El mismo patrón aplica a las demás cabeceras (`co_order`, `co_return`, `co_deposit`, `co_visit`).

### Cobros con su tipo legible (`co_type`)

```sql
SELECT c.id_collection, c.co_collection, c.da_collection, c.co_client, c.na_client,
       CASE c.co_type WHEN 0 THEN 'Cobro normal'
                      WHEN 1 THEN 'Anticipo/Prepago'
                      WHEN 2 THEN 'Retención'
                      ELSE c.co_type::text END AS tipo_cobro,
       c.co_currency, c.nu_amount_final, c.st_collection, c.id_enterprise
FROM collection c
-- WHERE c.id_enterprise = :id_enterprise      -- descomentar si la playa es multi-empresa
ORDER BY c.da_collection DESC, c.id_collection DESC;
```

### Documentos aplicados en un cobro (retenciones y pago parcial)

```sql
SELECT c.id_collection, c.na_client, cd.co_document,
       cd.nu_amount_doc, cd.nu_balance_doc, cd.nu_amount_paid,
       cd.nu_amount_retention, cd.nu_amount_retention2, cd.in_payment_partial
FROM collection c
JOIN collection_detail cd ON cd.co_collection = c.co_collection
ORDER BY c.id_collection DESC;
```

### Empresas de la playa

```sql
SELECT id_enterprise, co_enterprise, lb_enterprise, enterprise_default FROM enterprise ORDER BY id_enterprise;
```

### Descubrir las columnas de una tabla (meta-query)

```sql
SELECT column_name, data_type, is_nullable FROM information_schema.columns
WHERE table_schema='public' AND table_name='collection' ORDER BY ordinal_position;
```
> Útil cuando una consulta falla por nombre de columna. Así se descubrió que el saldo pendiente de
> `document_sale` es **`nu_balance`** y no `nu_amount_pending`.

### Gate del GRANT read-only (correr ANTES de dar la BD por disponible)

```sql
SELECT count(*) FILTER (WHERE has_table_privilege('user_read', schemaname||'.'||tablename,'SELECT')) AS legibles,
       count(*) AS total
FROM pg_tables WHERE schemaname='public';
```
> `SELECT 1` pasa aunque no haya permisos sobre las tablas. Si `legibles < total`, falta el GRANT.
