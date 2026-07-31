# Smoke WEB EXTENDIDO — todo lo que la corrida normal NO cubre

**Cuándo corre:** ⚠ **SOLO cuando la responsable QA lo pide explícitamente.** No forma parte de la corrida
smoke ni se dispara con `QA_WEB=1`.
**Depende de:** nada. **No necesita dispositivo, ni APK, ni CDP, ni corrida móvil, ni manifiesto.**
Solo la web y la BD de la playa.
**Reglas operativas:** `automation/web/WEB-RUNTIME.md` · **Selectores:** `../web-selectors/_comunes.md`
**Prefijo de casos:** **`DWX-`** (Denario Web eXtendido) — para no mezclarlos con los `DW-` de la corrida normal.

---

## Qué NO se valida acá

**Nada de lo que ya cubren los guiones transaccionales.** Los 7 módulos de la corrida normal —pedidos, cobros,
devoluciones, depósitos, inventarios, clientes potenciales y el reporte de visitas— **quedan fuera de este guión**.
Acá se cubre **el resto de la web**.

## El oráculo cambia

En la corrida normal el oráculo es *"¿llegó lo que mandó el móvil?"*. Acá **no hay móvil**, así que el oráculo es:

1. **La BD** — la web debe reflejar lo que dice `query.js`. Es el oráculo fuerte, sobre todo en reportes e
   indicadores, que son **puro cálculo agregado** y por lo tanto **recalculables** desde SQL.
2. **Consistencia interna** — que la lista coincida con el detalle, que los filtros devuelvan lo que prometen,
   que los totales sumen sus partes.

---

## 🔴 Riesgo específico de este guión: acá hay pantallas de CONFIGURACIÓN

La corrida normal solo toca pantallas de consulta. **Este guión entra a Empresa, Variables Globales, Usuarios y
Licencias — donde un click equivocado cambia el comportamiento de la app en producción.**

Cambiar una VG desde la web **altera lo que hace el móvil para un cliente real**: podría volver obligatorio un
adjunto, apagar un módulo o cambiar el formato de una retención.

**Regla dura, más estricta que la de la corrida normal:**

| Tipo de pantalla | Qué se permite |
|---|---|
| Consulta (reportes, indicadores, datos maestros, facturaciones) | `Buscar` · `Limpiar` · `Consultar` · paginar · ordenar |
| **Configuración** (Variables Globales, Usuarios, Licencias, Dispositivos, Supervisores, Configuración/*) | **SOLO verificar que la pantalla carga y muestra datos.** ❌ No abrir formularios de edición, no tocar toggles, no pulsar Guardar/Aplicar/Eliminar, **ni siquiera para "ver qué hace"** |

Ante la duda en una pantalla de configuración → **⛔ BLOCKED y preguntar.** El costo de un error acá no es un
caso mal reportado: es romperle la configuración a un cliente productivo.

---

## Bloque 1 · REPORTES — el de mayor rendimiento

Son **agregaciones puras**, así que la BD puede recalcular exactamente lo mismo. Si no cuadra, es defecto real.

| ID | Pantalla | Ruta | Oráculo |
|----|----------|------|---------|
| **DWX-REP-001** | Plan VS Cuota | `/pages/reportePlanCuota` | totales por vendedor vs `presupuestoVenta`/`presupuestoCuota` en BD |
| **DWX-REP-002** | Cumplimiento de Cuota | `/pages/reporteCumplimientoCuota` | % cumplimiento == real/cuota recalculado en SQL |
| **DWX-REP-003** | Activación de Clientes | `/pages/reporteActivacionClientes` | nº de clientes con ≥1 transacción en el período vs `count(distinct co_client)` |
| **DWX-REP-004** | Rotación de Inventario | `/pages/reporteRotacionInventario` | contra `client_stock` / `stock_history` |
| **DWX-REP-0xx** | *(cada uno)* | | **filtros** del reporte: rango de fechas, vendedor, empresa — conteo vs BD |

**Verificaciones transversales de todo reporte:** que el **total de la tabla == suma de sus filas**; que al
**cambiar el rango de fechas** los números cambien de forma coherente; que **sin datos** muestre vacío y no error.

## Bloque 2 · INDICADORES — cálculo agregado, mismo oráculo

| ID | Pantalla | Ruta |
|----|----------|------|
| **DWX-IND-001** | Pedidos | `/pages/indicadoresPedidos` |
| **DWX-IND-002** | Cobranzas | `/pages/protected/indicadores/indicadorCobros.xhtml` |
| **DWX-IND-003** | **Morosidad** | `/pages/protected/indicadores/indicadorMorosos.xhtml` |
| **DWX-IND-004** | % de Participación (productos) | `/pages/indicadoresProductos` |
| **DWX-IND-005** | Ventas Diarias | `/pages/protected/indicadores/pedidosProductosVentas.xhtml` |
| **DWX-IND-006** | Pedidos por Cliente | `/pages/pedidosClientes` |
| **DWX-IND-007** | Pedidos por Vendedor | `/pages/pedidosVendedores` |

💡 **Morosidad es el más contrastable de todos:** debe cuadrar con
`SELECT co_client, sum(nu_balance) FROM document_sale WHERE nu_balance>0 AND da_duedate < CURRENT_DATE GROUP BY co_client`.
Si la web dice otra cosa, es defecto — y del tipo que le duele al negocio.

⚠ Los indicadores suelen traer **gráficos**: no intentar leer el canvas. Validar la **tabla o los valores
numéricos** que lo acompañan; si solo hay gráfico sin datos legibles → `WEB-N/A` con el motivo.

## Bloque 3 · FACTURACIONES — el transaccional que la corrida normal no cubre

| ID | Qué |
|----|-----|
| **DWX-FAC-001** | La lista carga y pagina · ruta `/pages/facturaciones` |
| **DWX-FAC-002** | Filtros (Ref, vendedor, cliente, fechas, estatus) — conteo vs BD |
| **DWX-FAC-003** | Detalle: cabecera y líneas contra BD |
| **DWX-FAC-004** | **Cálculos**: Σ líneas == total · impuestos · conversión de moneda |
| **DWX-FAC-005** | **Enlace cruzado** factura ↔ documento de venta cobrable (`document_sale`) |

> ⚠ En `el_valle` la tabla `invoice` está **vacía** y los documentos viven en `document_sale`. Si la lista sale
> vacía, **verificar en BD antes de reportar**: puede ser `WEB-N/A` por falta de datos, no defecto.

## Bloque 4 · DATOS MAESTROS

| ID | Pantalla | Ruta | Oráculo |
|----|----------|------|---------|
| **DWX-MAE-001** | Productos | `/pages/productos` | conteo y muestreo vs `product` · listas de precio |
| **DWX-MAE-002** | Clientes | `/pages/clientes` | conteo vs `client` · datos fiscales · sucursales (`address_client`) |
| **DWX-MAE-003** | Documentos de Venta | `/pages/documentos` | **saldos vs `document_sale.nu_balance`** · vencidos |
| **DWX-MAE-0xx** | *(cada una)* | | filtros + paginación + orden por columna |

## Bloque 5 · VISITAS (lo que no cubre el reporte de visitas)

| ID | Pantalla | Ruta |
|----|----------|------|
| **DWX-VIS-001** | Plan de Visitas / Itinerario | `/pages/itinerario` |
| **DWX-VIS-002** | Rutero | `/pages/protected/visitas/rutero.xhtml` |
| **DWX-VIS-003** | Mapa de Rutas | `/pages/mapaRutas` |

> 💡 Estas pantallas explican los `N/A` de la corrida móvil: **DM-VIS-025/026** quedaron sin probar por no haber
> **ruta planificada del día**. Acá se puede verificar si el plan existe y qué contiene.

## Bloque 6 · ESTRUCTURA COMERCIAL

| ID | Pantalla | Ruta |
|----|----------|------|
| **DWX-EST-001** | Estructura de Productos | `/pages/estructuraProducto` |
| **DWX-EST-002** | Estructura de Ventas | `/pages/estructuraEmpresa` |
| **DWX-EST-003** | Canales de Distribución | `/pages/segmentacion` |
| **DWX-EST-004** | Plan de Venta | `/pages/presupuestoVenta` |
| **DWX-EST-005** | Cuota de Venta | `/pages/presupuestoCuota` |

## Bloque 7 · CONFIGURACIÓN — ⚠ SOLO SMOKE DE CARGA, sin interactuar

**Objetivo acotado: que la pantalla abra, muestre datos y no lance error.** Nada más.
Es de bajo valor de prueba y **alto riesgo de romper producción**, así que la relación no da para más.

| ID | Pantalla | Ruta |
|----|----------|------|
| **DWX-CFG-001** | Datos Empresa | `/pages/protected/empresa/datosEmpresa.xhtml` |
| **DWX-CFG-002** | Variables Globales — Empresa | `/pages/variablesConfiguracion` |
| **DWX-CFG-003** | Variables Globales — Clientes | `/pages/variablesConfiguracionClientes` |
| **DWX-CFG-004** | Usuarios · Dispositivos · Supervisores · Licencias | `/pages/usuarios` · `/pages/dispositivos` · `/pages/supervisores` · `/pages/licencias` |
| **DWX-CFG-005** | Catálogos: tipos/motivos de devolución, IVA, IGTF, actividades, tipos de pedido, feriados | `/pages/tiposdevol` · `/pages/motivosdevol` · `/pages/iva` · `/pages/igtf` · `/pages/actividades` · `/pages/tipoPedidos` · `/pages/feriados` |
| **DWX-CFG-006** | **Errores de aplicación** | `/pages/protected/administracion/erroresAplicacion/erroresAplicacion.xhtml` |

💎 **`DWX-CFG-006` merece atención especial:** es el log de errores de la aplicación. **Revisarlo puede
descubrir defectos que ninguna prueba provocó** — errores reales de usuarios reales. Vale la pena mirar los
más recientes y reportar los que se repitan.

💡 **`DWX-CFG-002/003` tienen un uso indirecto valioso:** son las VGs que alimentan los perfiles de cliente.
Comparar lo que muestra la web contra `automation/clientes/{cliente}.yaml` **detecta perfiles desactualizados**
sin tocar nada.

---

## Estimación

| Bloque | Casos aprox. | Tiempo |
|---|---:|---|
| 1 · Reportes | ~12 | 15–20 min |
| 2 · Indicadores | ~14 | 15–20 min |
| 3 · Facturaciones | ~8 | 10 min |
| 4 · Datos maestros | ~12 | 15 min |
| 5 · Visitas (plan/rutero/mapa) | ~6 | 8 min |
| 6 · Estructura comercial | ~8 | 10 min |
| 7 · Configuración (solo carga) | ~15 | 10 min |
| | **~75** | **≈ 1 h 20 – 1 h 40** |

Como **no depende del dispositivo**, esa hora y media es tiempo de máquina, no de QA: se lanza y se revisa el
reporte al final.

## Salidas

- Reporte: `automation/reports/web-extendido_{cliente}_{YYYYMMDD}_{HHMMSS}/extendido.md`
- Ledger: `_web-results.jsonl` con `"capa":"web-extendido"` para que **no se mezcle** con el de las corridas normales.
- Patrones nuevos → `web-selectors/`.

## Veredictos

`WEB-OK` · `WEB-FIELD-MISMATCH` · `WEB-CALC-MISMATCH` · `WEB-N/A` · `⛔ BLOCKED`
⚠ Acá **no aplica `WEB-MISSING`**: no hay un registro del móvil que pueda faltar.
Pantalla vacía por falta de datos → `WEB-N/A` **tras confirmarlo en BD**, nunca defecto.

---

*Guión alterno · independiente de la corrida móvil · se lanza solo a pedido explícito de QA · 2026-07-28*
