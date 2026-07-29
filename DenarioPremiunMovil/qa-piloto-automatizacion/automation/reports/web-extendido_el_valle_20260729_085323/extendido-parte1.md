# Smoke WEB EXTENDIDO — parte 1 (bloques 1, 2 y 7)

**RUN_ID:** `20260729_085323_web-extendido` · **Cliente:** `el_valle` · **Empresa:** PROCESADORA DE ALIMENTOS COVADONGA,C.A
**Playa:** la_tortuga (`denariolatortuga.ddns.net:8080`) — guarda de playa verificada en cada lectura, sin rastro de CAPITALINA
**Modo:** READ-ONLY. No se creó, editó, borró ni aprobó nada. En configuración solo se verificó carga.
**Fecha:** 2026-07-29

| Marca | Casos |
|---|---:|
| `WEB-OK` | 11 |
| `WEB-N/A` | 4 |
| `WEB-CALC-MISMATCH` | 3 |
| `⛔ BLOCKED` | 0 |
| **Total** | **18** |

---

# 1 · DWX-CFG-006 — Errores de aplicación (prioridad máxima)

## 1.1 🔴 Corrección de premisa: `log_error` NO son errores de usuarios

El encargo asumía que las 4.051 filas de `log_error` eran errores reales dispersos de usuarios reales.
**No lo son.** La agregación por fecha lo desmiente sin ambigüedad:

```
total=4051 · primera=2026-07-15 19:11:31.725 · última=2026-07-15 19:12:32.232
```

**Las 4.051 filas caben en 61 segundos de un único día** (hace 14 días) y solo hay **4 mensajes distintos**.
No es un log de errores de uso: es **el rechazo de una carga masiva (ETL) del ERP hacia Denario**.
No hay ni una sola fila posterior al 15/07 ⇒ **ningún error de `log_error` sigue ocurriendo**.

Eso no lo vuelve irrelevante — al contrario: **el saldo que dejó esa carga sigue vivo hoy**, y es lo que
se reporta abajo ordenado por impacto real, no por conteo de filas.

## 1.2 Los 4 errores, ordenados por IMPACTO (no por conteo)

| # | Mensaje | Filas | Tabla(s) | Impacto **vigente hoy** |
|---|---|---:|---|---|
| **1** | `NO EXISTE  USUARIO` | **3.843** | `CLIENT_TEMPLATE_USER` | 🔴 **3.843 clientes sin vendedor asignado — 54,8% de la cartera** |
| **2** | `NO EXISTE PRODUCTO` | **201** | `PRICE_LIST`(126) · `PRODUCT_UNIT`(25) · `STOCK`(25) · `ORDER_TEMPLATE`(25) | 🟠 25 productos nunca cargados; 126 precios perdidos |
| 3 | `co_currency vacio` | 4 | `BANK_ACCOUNT` | 🟡 4 cuentas bancarias sin moneda |
| 4 | `ENVIAR EL VALOR  MINIMO DE VENTA` | 3 | `PRODUCT_UNIT` | 🟢 3 unidades marcadas `deleted` — impacto nulo |

> Nota de calidad del propio log: los mensajes 1 y 4 traen **doble espacio** (`NO EXISTE  USUARIO`,
> `ENVIAR EL VALOR  MINIMO`), y `log_error` **no guarda el código del usuario/producto que faltó** —
> solo `co_campo`, que es la PK compuesta. Diagnosticar cuál era el vendedor inexistente exige
> reconstruirlo desde el ERP.

### Error #1 — 3.843 clientes quedaron sin vendedor (el hallazgo de la corrida)

`co_campo` es `co_client_template_user` = prefijo `PT01C` + `co_client`. Quitando el prefijo y cruzando:

```sql
WITH rech AS (SELECT substring(co_campo from 6) coc
              FROM log_error WHERE na_table='CLIENT_TEMPLATE_USER')
SELECT count(*) rechazados,                                    -- 3843
       count(*) FILTER (... JOIN client ...) existen_en_client, -- 3843
       ... sin_asignacion                                       -- 3843
```

| Comprobación | Resultado |
|---|---|
| Filas rechazadas | **3.843** (todas con `co_campo` distinto — 3.843 clientes únicos) |
| ¿Esos clientes existen en `client`? | **3.843 de 3.843 — SÍ, todos** |
| ¿Tienen hoy alguna fila en `client_template_user`? | **0 de 3.843 — NINGUNO** |

**Aritmética del daño:**

```
client                                   = 7.007 clientes
client_template_user (distinct co_client) = 3.158 clientes asignados
clientes SIN vendedor                     = 3.843     (7.007 − 3.158 = 3.849 ≈ 3.843 + 6 de otras causas)
                                          = 54,8% de la cartera
```

El cliente **se cargó bien**, pero su **asignación cliente↔plantilla↔vendedor fue rechazada** porque el
`co_user` que traía el ERP no existía en Denario. Consecuencia funcional: **esos 3.843 clientes no le
aparecen a ningún vendedor en la app móvil.** Los 14 vendedores con cartera se reparten solo 3.158.

🔗 **Confirmado de forma independiente desde la web** (ver §3.7): el indicador *Pedidos por Vendedor*
declara una cartera de **exactamente 3.158** (302 efectivos + 2.856 no efectivos). La web ya está
reportando sobre el 45% de la cartera **sin avisar en ninguna parte que falta el otro 55%**.

### Error #2 — 25 productos que nunca existieron, y siguen sin existir

Los 201 rechazos se reducen a **25 códigos de producto** que el ERP referenció y Denario no tenía:

```
E0007 E0012 E0021 E0022 E0030 E0031 E0032 E0036 E0037 E0039 E0044 E0047 E0049
E0052 E0054 E0055 E0056 E0059 E0060 E0061 E0064 E0091 E0093 E0094 E0096
```

Verificado hoy: **0 de los 25 existen en `product`** (la tabla tiene 80 productos, 65 de ellos serie `E`).
Arrastre: **126 filas de lista de precio**, 25 unidades, 25 stocks y 25 plantillas de pedido perdidas.
`price_list` hoy tiene 480 filas / 80 productos: los 126 precios de los 25 códigos faltantes nunca entraron.

## 1.3 La pantalla web — contraste (y dos defectos)

**🔴 Defecto de documentación (ruta equivocada en el guión).** La ruta del guión da **HTTP 404**:

| Ruta | Resultado |
|---|---|
| `/pages/protected/administracion/erroresAplicacion/error` (guión) | ❌ **404** |
| `/pages/protected/administracion/erroresAplicacion/error.xhtml` | ❌ **404** |
| `/pages/protected/administracion/erroresAplicacion/erroresAplicacion.xhtml` | ✅ **200** (leída del menú) |

**🔴 Hallazgo estructural: la pantalla NO muestra `log_error`.** Muestra una tabla distinta,
`form:failedTxDT`, alimentada por **`failed_transactions`** — otra tabla, otro contenido:

| | `log_error` | `failed_transactions` |
|---|---|---|
| Qué guarda | rechazos de la carga ETL del ERP | **transacciones de la app móvil que el servidor no pudo procesar** |
| Filas | 4.051 | **79** |
| Ventana | 15/07/2026 (61 s) | **28/07/2026 19:33 → 20:35** |
| ¿Visible en la web? | ❌ **no hay pantalla** | ✅ sí |

⇒ **Los 4.051 rechazos de carga no son visibles desde ninguna pantalla de la web.** El único camino para
verlos es SQL. Para un operador, los 3.843 clientes sin vendedor son **invisibles y silenciosos**.

### 1.4 Lo que sí muestra la pantalla: `failed_transactions`

79 filas, **un solo usuario (`001`)**, **un solo módulo (`cob` / Cobros)**, 9 transacciones distintas.

| Mensaje | Filas | Tx | Ventana |
|---|---:|---:|---|
| `Error inesperado Transaction silently rolled back because it has been marked as rollback-only` | **77** | 8 | 28/07 19:33 → 20:35 |
| `Error inesperado Cannot invoke "java.lang.Double.doubleValue()" because the return value of "…CollectionBO.getNuAmountIgtf()" is null` | 2 | 1 | 28/07 20:23 → 20:25 |

⚠ **Honestidad sobre el origen:** estas fallas son del **28/07/2026**, la ventana de la corrida QA previa,
todas del usuario `001`, y dos de las transacciones se llaman literalmente `1785267634201-TEST` y
`TEST-ANT-001`. **No es tráfico orgánico de usuarios reales: es QA.** Aun así deja dos defectos legítimos:

- 🔴 **NPE del servidor (`getNuAmountIgtf()` is null`).** Un cobro sin monto de IGTF hace que el servidor
  lance `NullPointerException` en vez de validar y responder un error de negocio. Lo disparó una sonda de
  QA (`TEST-ANT-001`), pero el fallo es del servidor: **falta el guard de nulo**. Corrobora el síntoma ya
  conocido de "la app crashea al hacer POST de cobro".
- 🟠 **Reintento agresivo sin corte.** 9 transacciones generaron 79 fallos. La peor
  (`1785269490696.0`) se reintentó **26 veces en 3 minutos**. No hay backoff ni tope: una transacción
  irrecuperable se reintenta indefinidamente contra producción.

| Transacción | Intentos | Ventana |
|---|---:|---|
| `1785269490696.0` | **26** | 20:12:11 → 20:15:12 (3 min) |
| `1785266556477.0` | 15 | 19:33 → 19:47 |
| `1785268429266.0` | 12 | 19:54 → 20:35 |
| `1785267634201.0` | 12 | 19:42 → 19:47 |

**Veredicto DWX-CFG-006: `WEB-OK`** — la pantalla carga y muestra datos. Los defectos anexos
(ruta documentada errónea, `log_error` sin pantalla, NPE, reintentos) se reportan aparte.

---

# 2 · Bloque 1 — REPORTES (`DWX-REP-*`)

Los 4 reportes **cargan sin error**, con filtro de empresa correcto (`idEnterprise=1`) y rango por
defecto **01/07/2026 – 29/07/2026**. Los 4 devuelven `No se encontraron registros.`

**Antes de marcar nada se confirmó en BD que no hay de qué alimentarlos:**

| Tabla | Filas |
|---|---:|
| `budget` | **0** |
| `quota_plan_enterprise` · `quota_plan_product` · `quota_plan_segment` | **0 / 0 / 0** |
| `sales_plan_enterprise_structure` · `sales_plan_segment` | **0 / 0** |
| `client_stock` | 2 |

⇒ Sin plan de venta ni cuota cargados, estos reportes **no tienen insumo**. Es `WEB-N/A`, **no defecto**.

| Caso | Pantalla | Marca | Sustento |
|---|---|---|---|
| DWX-REP-001 | Plan VS Cuota | `WEB-N/A` | `budget`=0, `quota_plan_*`=0 |
| DWX-REP-002 | Cumplimiento de Cuota | `WEB-N/A` | ídem |
| DWX-REP-003 | Activación de Clientes | `WEB-N/A` | `sales_plan_*`=0 (se pulsó `Buscar`: sigue vacío) |
| DWX-REP-004 | Rotación de Inventario | `WEB-N/A` | `client_stock`=2 |
| DWX-REP-005 | Estado vacío (transversal) | `WEB-OK` | los 4 muestran mensaje de vacío, **ninguno lanza error** |

> 🔴 **"Sin datos" NO significa "la web está bien".** Significa que **no se pudo probar el cálculo**.
> Los oráculos de estos 4 reportes (total == suma de filas, coherencia al mover fechas) quedan
> **sin ejercitar**. Para probarlos hace falta un cliente con plan de venta y cuota cargados.

**Verificación adicional del filtro (DWX-REP-003):** hay **203 pedidos de 183 clientes distintos en
julio/2026**, y el reporte igual sale vacío. No es un fallo de filtro: es que *Activación* se calcula
**contra la cartera del plan de venta**, y ese plan no existe. Comprobado pulsando `Buscar` (lectura).

**Defectos cosméticos observados (no bloquean):**
- `reporteCumplimientoCuota`: encabezados con unidad sin resolver → `Cuota ()`, `()`, `Brecha Cuota ()`.
- `reporteRotacionInventario`: `Rotaciòn Inventario` — acento grave en vez de agudo.

---

# 3 · Bloque 2 — INDICADORES (`DWX-IND-*`)

**Método:** los indicadores son casi todos gráficos. **No se leyó ningún canvas.** Se extrajeron los
**datos numéricos que el servidor entrega al widget** (`PrimeFaces.widgets[*].cfg.data`), que es el valor
real enviado, independiente del render. Por eso los ceros de §3.3 son ceros **del servidor**, no un fallo
de dibujado.

## 3.1 🔴 DWX-IND-003 · MOROSIDAD — `WEB-CALC-MISMATCH` (el defecto más grave)

Filtros vigentes en pantalla: **Empresa=1 · Moneda=USD · Tipo de documento=1**.
Se replicó **exactamente esa combinación** en SQL para que la comparación sea justa.

**La web muestra CERO en los cinco tramos de mora:**

| Tramo (días) | **Web** | **BD** | **Diferencia** |
|---|---:|---:|---:|
| 1 – 7 | **0,00** | 18.911,15 | **−18.911,15** |
| 8 – 15 | **0,00** | 79.251,09 | **−79.251,09** |
| 16 – 30 | **0,00** | 93.709,43 | **−93.709,43** |
| 31 – 45 | **0,00** | 88.696,54 | **−88.696,54** |
| 46 – 9999 | **0,00** | 481.855,39 | **−481.855,39** |
| **TOTAL** | **0,00** | **762.423,60** | **−762.423,60 (100%)** |

Además los **dos gráficos de torta** de la pantalla vienen con `labels: []` y `data: []` — vacíos.

**Se descartaron las tres explicaciones inocentes:**

1. *¿Los filtros excluyen los documentos?* No. **Todos** los vencidos son `co_currency='USD'`,
   `id_document_sale_type=1`, `id_enterprise=1` — exactamente lo que la pantalla pide.
2. *¿La mora cae fuera de los tramos?* No. Mora real **mín. 1 día / máx. 655 días**: todo entra en
   `1–7 … 46–9999`. Ningún documento queda fuera.
3. *¿Faltaba pulsar `Buscar`?* No. Se pulsó `Buscar` y los cinco tramos siguen en 0.

**Oráculo global (sin filtro de tipo):** `762.465,84` en **2.780 documentos** de **812 clientes**.

⇒ La web reporta **cero morosidad** mientras hay **762.423,60 USD vencidos en 2.779 documentos de 811
clientes** (con los filtros exactos de la pantalla; 812 clientes / 762.465,84 sin filtro de tipo de
documento), el más antiguo con **655 días** de mora. Es el defecto de mayor daño al negocio de la corrida:
un gerente que abra esta pantalla concluye que **no tiene cartera vencida**.

## 3.2 🔴 DWX-IND-002 · COBRANZAS — `WEB-CALC-MISMATCH` (parcial)

La pantalla tiene dos gráficos y **se contradicen entre sí**.

**Gráfico A — por forma de pago (01/06 – 29/07): ✅ cuadra exacto**

| Forma de pago | Web | BD | Δ |
|---|---:|---:|---:|
| Transferencia (`tr`) | 1.319,07 | 1.238,12 + 80,95 = **1.319,07** | 0,00 ✓ |
| Efectivo (`ef`) | 492,90 | 20,00 + 472,90 = **492,90** | 0,00 ✓ |
| Pago Móvil (`pm`) | 100,00 | 50,00 + 50,00 = **100,00** | 0,00 ✓ |
| **Σ** | **1.911,97** | — | — |

**Gráfico B — Facturado vs Cobrado por mes: ❌ los 12 meses en CERO**

```
Facturado: [0,0,0,0,0,0,0,0,0,0,0,0]
Cobrado  : [0,0,0,0,0,0,0,0,0,0,0,0]
```
BD: **junio 1.319,07 · julio 604,90**. La serie "Cobrado" debería mostrarlos — y el propio gráfico A de
**la misma pantalla** ya los está mostrando. **Diferencia: −1.923,97** (100% del cobrado).

**🟠 Hallazgo de integridad adicional (huérfano de 12,00).** Σ gráfico A = 1.911,97, pero
`sum(collection.nu_amount_total)` en rango = **1.923,97**. La brecha de **12,00** es un cobro
(`co_collection=1785275787329.0`, 28/07 21:56) que **existe con monto total pero no tiene ni una fila en
`collection_payment`** (`co_payment_method` nulo). El gráfico A no está mal: **el dato lo está**. Un cobro
sin forma de pago es invisible en todo reporte que desglose por método.

## 3.3 ✅ DWX-IND-001 · PEDIDOS — `WEB-OK` (verificación fuerte)

Es el indicador mejor construido: trae **tabla real** (`form:tablaPedidos`) además de gráficos.

**Serie mensual 2026 — coincidencia exacta al céntimo:**

| Mes | Web | BD | Δ |
|---|---:|---:|---:|
| Mayo | 147.247.461,76 | 147.247.461,76 | 0,00 ✓ |
| Junio | 23.465,36 | 23.465,36 | 0,00 ✓ |
| Julio | 49.889,51 | 49.889,51 | 0,00 ✓ |

**Total == suma de sus filas (13 vendedores):**

```
Σ cantidad de pedidos  = 438            vs BD count(*) 2026 = 438              ✓
Σ monto total          = 147.320.816,63 vs BD sum(nu_amount_total) 2026        ✓
                                           = 147.320.816,63   → Δ = 0,00
```

Se cumple el oráculo transversal: **el total cuadra con la suma de las filas y ambos con la BD**.

## 3.4 ✅ DWX-IND-004 · PRODUCTOS (% Participación) — `WEB-OK`

Desglose por clasificación (01/01 – 29/07/2026):

```
PRODUCTO FRESCO EN VENTA          147.152.898,22
EMBUTIDOS (PRODUCTOS TERMINADOS)       91.218,43
LACTEOS                                76.699,98
                          Σ  =   147.320.816,63   == total BD 2026 ✓ Δ = 0,00
```

## 3.5 🔴 DWX-IND-005 · VENTAS DIARIAS — `WEB-CALC-MISMATCH` (no renderiza nada)

`/pages/protected/indicadores/pedidosProductosVentas.xhtml` carga (HTTP 200, filtros visibles:
Empresa=1, Vendedor=Todos, Vista=Día, 01/01–29/07/2026) pero:

- **0 tablas · 0 canvas · 0 widgets de gráfico registrados**
- **Ningún** mensaje de estado vacío ("No se encontraron registros" **no** aparece)
- **0 botones** — la pantalla ni siquiera ofrece `Buscar`

Con **438 pedidos en el rango**, la pantalla queda **en blanco y muda**: ni datos, ni explicación.

**Causa raíz probable, capturada en consola:**

```
Uncaught TypeError: Cannot read properties of undefined (reading 'helpers')
  at cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0:6:294
```

El plugin `chartjs-plugin-datalabels` se inicializa **antes** que Chart.js y revienta. Se sirve desde un
**CDN público externo** (`cdn.jsdelivr.net`). Dos consecuencias:

- 🔴 **Dependencia externa en producción:** si la red del cliente bloquea jsdelivr (habitual en intranets),
  **todos los gráficos de la web dejan de funcionar**.
- El mismo error se registró también en `reportePlanCuota`, `reporteActivacionClientes`,
  `reporteRotacionInventario` y `variablesConfiguracion` ⇒ **es sistémico, no de una pantalla**.

## 3.6 ✅ DWX-IND-006 · PEDIDOS POR CLIENTE — `WEB-OK`

```
Canal:  CANAL GENERAL → 438 pedidos · 147.320.816,63 USD
BD:                      438 pedidos · 147.320.816,63 USD     Δ = 0,00 ✓
```
Top cliente ADC FOODS, C.A = 147.237.847,26 — coincide con el pedido atípico de §4.

## 3.7 ✅ DWX-IND-007 · PEDIDOS POR VENDEDOR — `WEB-OK` (con advertencia grave de alcance)

```
Clientes Efectivos:      302   vs BD count(distinct co_client) pedidos 2026 = 302  ✓ Δ = 0
Clientes No Efectivos: 2.856
Cartera (Σ)            3.158
```

Los 302 cuadran **exacto**. Pero la **cartera de 3.158 es precisamente `client_template_user`** — o sea,
la web calcula la efectividad **solo sobre los clientes que sí lograron asignarse** (§1.2):

```
Efectividad que muestra la web : 302 / 3.158 = 9,6%
Efectividad sobre la cartera real: 302 / 7.007 = 4,3%
```

⇒ El indicador **no miente en su propia aritmética**, pero **exagera la efectividad al doble** porque su
denominador excluye en silencio a los 3.843 clientes que la carga rechazó. **Ninguna pantalla avisa.**

---

# 4 · Hallazgo transversal de calidad de dato — un pedido deforma todos los indicadores

| Pedido | Fecha | Cliente | Monto |
|---|---|---|---:|
| `1779131004688.0` | 18/05/2026 | J505381237 (ADC FOODS, C.A) | **147.237.847,26 USD** |
| *(2º más grande)* | 02/07/2026 | V058765437 | 21.118,47 USD |

Un **único pedido de 147,2 millones de USD** — **6.972 veces** el siguiente — concentra el **99,94%** del
volumen 2026. Consecuencia: en *Pedidos*, *Productos*, *Pedidos por Cliente* y *Pedidos por Vendedor*,
**todos los vendedores y productos reales quedan aplastados** contra ese valor. Los indicadores están
aritméticamente correctos y **operativamente inservibles**.

Sospecha (no verificable sin escribir): precio en BS registrado como USD, o error de cantidad. El pedido
está atribuido al usuario `001` (usuario administrador/QA), lo que refuerza que es dato espurio.

---

# 5 · Bloque 7 — CONFIGURACIÓN (`DWX-CFG-*`) — solo smoke de carga

⚠ **Se respetó la regla dura:** solo se comprobó que la pantalla abre y muestra datos.
**No se abrió ningún formulario de edición, no se tocó ningún toggle, no se pulsó Guardar/Aplicar/Eliminar.**
La verificación en lote se hizo con **GET read-only** sobre la sesión activa (equivalente a abrir la
pantalla, sin enviar formularios).

| Caso | Pantalla | HTTP | Filas | Error | Marca |
|---|---|---:|---:|---|---|
| DWX-CFG-001 | `datosEmpresa.xhtml` | 200 | — (formulario, 9 campos) | no | `WEB-OK` |
| DWX-CFG-002 | `variablesConfiguracion` | 200 | **72** | no | `WEB-OK` |
| DWX-CFG-003 | `variablesConfiguracionClientes` | 200 | 27 | no | `WEB-OK` |
| DWX-CFG-004 | `usuarios` / `dispositivos` / `supervisores` / `licencias` | 200 | 18 / 1 / 2 / 13 | no | `WEB-OK` |
| DWX-CFG-005 | `tiposdevol` 4 · `motivosdevol` 23 · `iva` 3 · `igtf` 1 · `actividades` 12 · `tipoPedidos` 4 · `feriados` 1 | 200 | — | no | `WEB-OK` |
| DWX-CFG-006 | `erroresAplicacion.xhtml` | 200 | 50 | no | `WEB-OK` |

**Las 14 pantallas cargan con HTTP 200, sin excepción y con datos.**

## 5.1 Cruce `variablesConfiguracion` ↔ `automation/clientes/el_valle.yaml`

Uso indirecto pedido: detectar perfil desactualizado **sin tocar nada**. Se leyeron los 72 renglones de VG
y se contrastó cada uno legible contra el YAML.

| VG (web) | Web | YAML `el_valle.yaml` | ¿Coincide? |
|---|---|---|---|
| Campo de empresa en todos los módulos | SI | `enterpriseEnabled: true` | ✅ |
| Transacciones con diferentes monedas | SI | `multiCurrency: true` | ✅ |
| Módulo de vendedores desde el administrativo | NO | `infoVendedores: false` | ✅ |
| Tomar fotos desde la app | SI | `showCamera: true` | ✅ |
| Adjuntar documentos | SI | `userCanUploadFiles: true` | ✅ |
| Devolver productos de distintas facturas | NO | `multiInvoices: false` | ✅ |
| Nº de factura requerido en devoluciones | SI | `requeridedNroFactura: true` | ✅ |
| Validar producto devuelto contra factura | NO | `validateReturn: false` | ✅ |
| Toma de inventario en el cliente | SI | `clientStock: true` | ✅ |
| **Inventario requerido antes del pedido** | **NO** | `requireClientStock: false` ⚠️VERIFICAR | ✅ **resuelto** |
| Fecha de expiración y lote en inventario | SI | `expirationBatch: true` | ✅ |
| Firma en visitas / pedidos / cobros / depósitos / inventarios / devoluciones / clientes pot. | SI ×7 | `signature*: true` ×7 | ✅ |

**Resultado: 0 diferencias. El perfil `el_valle.yaml` está alineado con la web.**

✅ **Se resuelve un `⚠️VERIFICAR` del perfil sin escribir nada:** `requireClientStock` estaba marcado como
conflicto (global 2026=`false` vs client-2023=`true`). **La web confirma `NO`** ⇒ gana `false`, el override
de 2023 queda descartado. Se recomienda quitar la marca `⚠️VERIFICAR` de esa línea del YAML.

> Alcance del cruce: esta pantalla **no expone** `requiredCollectionAttachments`, `requiredComment`,
> `cobroRetencion` ni las VG de tasa. Esas siguen sin verificación web (viven en otra pantalla o solo en BD).

## 5.2 Defectos menores de configuración

- 🟠 **`variablesConfiguracion` renderiza ~21 renglones completamente vacíos** de 72 (sin etiqueta ni
  valor). En una pantalla de configuración productiva, filas en blanco entre VGs reales confunden al
  operador sobre si falta una opción o está corrupta.
- 🟡 **`variablesConfiguracionClientes` tiene el `<title>` equivocado: "Productos"** (debería ser Clientes /
  Variables de Configuración Clientes). Confunde en pestañas e historial.

---

# 6 · Patrones nuevos (insumo para `web-selectors/`)

### 6.1 🔴 Corregir ruta de Errores de aplicación
```
✗ /pages/protected/administracion/erroresAplicacion/error          → 404
✗ /pages/protected/administracion/erroresAplicacion/error.xhtml    → 404
✅ /pages/protected/administracion/erroresAplicacion/erroresAplicacion.xhtml
```

### 6.2 Leer indicadores SIN tocar el canvas — patrón nuevo y reutilizable
Los indicadores no tienen tabla, pero **el dato numérico del servidor vive en el widget**:
```js
const W = PrimeFaces.widgets;
for (const k in W) { const d = W[k]?.cfg?.data; if (d?.datasets) /* labels + datasets[].data */ }
```
Devuelve `labels` y `datasets[].data` ya numéricos. **Distingue "el servidor mandó 0" de "el gráfico no
se dibujó"** — clave para no confundir un defecto de cálculo con uno de render.

### 6.3 Descubrir TODAS las rutas del sitio de una sola vez
```js
[...document.querySelectorAll('a')].map(a => a.textContent.trim()+' => '+a.getAttribute('href'))
```
Sobre `/pages/main` devuelve **51 rutas** con su nombre de menú. Una llamada en vez de adivinar URLs.

### 6.4 Smoke de carga en lote sin navegar (read-only)
```js
const res = await fetch('/DenarioPremium'+ruta, {credentials:'same-origin'});
const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
// doc.title · doc.querySelectorAll('.ui-datatable tbody tr').length · /Exception|Estado HTTP/
```
14 pantallas verificadas en **una sola llamada**. Es un `GET`: no envía formularios ⇒ seguro en
configuración. Ideal para bloques de "solo verificar que carga".

### 6.5 IDs de reportes e indicadores (semánticos — estables)
| ID | Pantalla |
|---|---|
| `form:tablaComparativoPlanCuota` | Plan VS Cuota **y** Activación de Clientes (**compartido**) |
| `form:tablaCumplimientoCuota` | Cumplimiento de Cuota |
| `form:TablaRotacion` | Rotación de Inventario (⚠ `T` mayúscula) |
| `form:tablaPedidos` | Indicador de Pedidos |
| `form:failedTxDT` | Errores de aplicación |
| `formGlobal:tablaConf` | Variables de Configuración (⚠ form `formGlobal`, no `form`) |

⚠ `form:tablaComparativoPlanCuota` **lo comparten 2 pantallas** — mismo riesgo que `form:pedidosDT`:
**nunca identificar la pantalla por el ID de la tabla**, verificar `location.pathname` primero.

### 6.6 Filtros de reportes/indicadores (bajo `form:j_idt115:` — auto-generado, anclar por sufijo)
`fechaDesde_input` · `fechaHasta_input` · `dateF_input` · `dateB_input` · `idEnterprise_input` ·
`idCurrency_input` · `idTipoDocs_input` · `vendedor_input` · `cumplimiento_input` · `ajax` (=`Buscar`) ·
`botonLimpiar`.
⚠ El prefijo `j_idt115` es **auto-generado**: anclar por el **sufijo** (`[id$=':ajax']`), nunca por el `j_idt*`.

### 6.7 Rango de fechas por defecto — no es uniforme
| Pantalla | Rango por defecto |
|---|---|
| Reportes (los 4) | 01/07/2026 – 29/07/2026 (**mes en curso**) |
| Indicador Cobranzas | 01/06/2026 – 29/07/2026 (**2 meses**) |
| Pedidos / Productos / Clientes / Vendedores | 01/01/2026 – 29/07/2026 (**año en curso**) |
⇒ **Nunca asumir el rango**: leer el `value` del input antes de comparar contra BD.

### 6.8 `log_error.co_campo` — cómo decodificarlo
Es la **PK compuesta**, no el código del registro:
`co_client_template_user = 'PT01C' || co_client` → `substring(co_campo from 6)` devuelve el `co_client`.
En productos, el código sale con `substring(co_campo from 'E[0-9]{4}')`.

### 6.9 Estatus real de cobros
Confirmado que **no debe usarse el catálogo `statuses`**: `collection.st_collection` vale `1` y `3`
en esta base; `3` corresponde a los cobros del 28/07 que la app reintentó. Usar la query de
`modelo-datos-denario.md §10`, nunca el catálogo directo.

---

# 7 · Qué revisaría primero

1. 🔴 **Morosidad en cero (§3.1).** 762.423,60 USD vencidos invisibles. Daño directo al negocio, defecto
   inequívoco, con oráculo SQL reproducible. **Prioridad 1.**
2. 🔴 **3.843 clientes sin vendedor (§1.2).** 54,8% de la cartera fuera de la app, con el agravante de que
   **no hay pantalla web que lo muestre** y de que los indicadores lo ocultan en el denominador (§3.7).
3. 🔴 **`log_error` sin pantalla.** Aunque se arregle la carga, hoy nadie puede ver 4.051 rechazos sin SQL.
4. 🟠 **Gráficos desde CDN externo (§3.5).** Un bloqueo de red deja toda la web sin gráficos.
5. 🟠 **NPE `getNuAmountIgtf()` + 26 reintentos (§1.4).** Falta guard de nulo y falta corte de reintento.
6. 🟠 **Pedido de 147,2 M USD (§4).** Mientras exista, ningún indicador monetario sirve.
7. 🟡 Cosméticos: renglones vacíos en VG, título "Productos", `Rotaciòn`, `Cuota ()`, ruta 404 del guión.

---

# 8 · Cobertura y límites honestos

**Lo que quedó sin probar y por qué:**

- **Los 4 oráculos de reportes** (total==Σfilas, coherencia al mover fechas, filtro por vendedor):
  sin plan/cuota en BD **no hay nada que recalcular**. Requiere un cliente con datos.
- **Variación por rango de fechas** en reportes: sin datos, mover el rango no prueba nada.
- **VGs no expuestas** en `variablesConfiguracion`: `requiredCollectionAttachments`, `requiredComment`,
  `cobroRetencion`, VGs de tasa — sin verificación web.
- **Pantallas de configuración:** por regla, **solo se verificó carga**. Que abran no dice nada sobre si
  guardan bien.
- `failed_transactions` (§1.4) es **actividad de QA del 28/07**, no tráfico orgánico. Los defectos que
  revela son reales; su **frecuencia en usuarios reales es desconocida**.

*Generado por el agente QA web-extendido parte 1 · read-only · sin escrituras en producción.*
