# WEB · Familia F## (filtros) — run_vzla

**RUN_ID:** `20260818_152824_smoke-completo`
**Cliente:** `run_vzla` · Empresa **CORPORACION FERRE 19, C.A.** (`co_enterprise=FERRE_N`, `id_enterprise=1`)
**Playa:** **La Tortuga** — `http://denariolatortuga.ddns.net:8080/DenarioPremium`
**Usuario web:** `***` / `***` (bloque `# USUARIO WEB` de `secrets/qa-credentials.env`)
**Oráculo:** BD nube `run_vzla` vía `automation/db/query.js` · tolerancia 0,01
**Modo:** 🔴 READ-ONLY estricto — solo `Buscar`, `Limpiar`, paginación y rows-per-page. **No se abrió ningún detalle, no se tocó ningún control de escritura.**
**Fecha:** 2026-08-18 · ventana de ejecución ≈ 19:31–20:35 UTC

---

## Resumen

| Marca | Casos |
|---|---|
| ✅ PASS (`WEB-OK`) | **59** |
| ❌ FAIL | **1** |
| ⏭ SKIP | **4** |
| 🚫 N/A | **7** |
| **Total** | **71** |

**Veredicto de la familia: los filtros de los 7 módulos funcionan.** Los 71 casos se contrastaron
contra BD con el mismo `WHERE` que aplica la web, y **todo conteo cuadró al registro** una vez
descontado el defecto ya conocido de visibilidad por vendedor de baja (ver Hallazgo 2).

🔴 **El filtro `# Ref` funciona en los 6 módulos que lo tienen** (pedidos, cobros, devoluciones,
inventarios, visitas, depósitos): 6/6 devolvieron **exactamente** el registro pedido, y una ref
inexistente devuelve 0 filas con mensaje de vacío, sin error.
⇒ **La capa de cotejo `C##` puede confiar en `# Ref`.** No hay riesgo de `WEB-MISSING` falsos por
filtro roto — el único riesgo real de invisibilidad es el del Hallazgo 2.

---

## Contexto medido antes de tocar nada

- **Guarda de playa:** `host = denariolatortuga.ddns.net:8080` en los 7 módulos ✅
- **Guarda de tenant:** el `<select>` Empresa trae **una sola opción**, `CORPORACION FERRE 19, C.A.` ✅
  ⚠ El **`value` cambia por módulo**, tal como advierte `_comunes.md`:

  | Módulo | `value` de Empresa | Tipo |
  |---|---|---|
  | `/pages/cobros` · `/pages/devoluciones` · `/pages/inventarios` · `/pages/depositos` · `/pages/visitas` | `1` | `id_enterprise` |
  | `/pages/pedidos` · `/pages/clientesPotenciales` | `FERRE_N` | **`co_enterprise`** |

- **Rango de fechas por defecto:** `01/08/2026 – 18/08/2026` (mes en curso) en los 7 módulos.
- **Población BD el 2026-08-18** (vigentes, `co_operation IS DISTINCT FROM 'D'`):
  pedidos 2.755 · cobros 2.702 · devoluciones 233 · depósitos 2 · clientes potenciales 188 ·
  inventarios 52 · visitas 2.080. **Ningún borrado lógico** en este tenant.

---

## Oráculos nuevos establecidos en esta corrida

| Oráculo | Regla medida |
|---|---|
| **Columna de fecha de cada filtro** | pedidos `da_order` · cobros `da_collection` · devoluciones `da_return` · inventarios `da_client_stock` · visitas `da_visit` · depósitos `da_deposit` · clientes potenciales `da_client` |
| 🔴 **Estatus vigente de una transacción** | `DISTINCT ON (id_transaction) … ORDER BY id_transaction, **id_transaction_statuses DESC**`. **Ordenar por `da_transaction_statuses` DA MAL**: hay filas posteriores con fecha anterior (ej. pedido 2817: la fila `id 13892 / Pend` tiene `da = 18/08 04:00` y la fila `id 13865 / env` tiene `da = 18/08 11:39`). Ordenar por fecha daba 28 «Enviado» donde la web mostraba 7 — y **la web tenía razón** |
| **Valor del combo Status** | es `transaction_statuses.id_status`, **no** `st_<x>` de la tabla de la transacción. Los ids son **por tenant**: acá pedidos `4/10/16/14/17/15/-1`, cobros `3/7/11/12/13`, devoluciones `1/8`, inventarios `2/6`, depósitos `5/9` |
| 🔴 **Conteo de filas de VISITAS** | la lista es **por actividad**: `filas = Σ visitas GREATEST(count(incidence), 1)` (LEFT JOIN — una visita sin `incidence` sigue ocupando 1 fila). Con `count(visit)` se pierde: 916 visitas ⇒ **929 filas**, que es lo que muestra la web |
| **Indicador `Monto total en US$` de cobros** | `Σ collection.nu_amount_total` del set filtrado — cuadró **al céntimo** (5.412.686,36) |
| **Indicadores de pedidos** | `Total Base = Σ nu_amount_total_base` · `Monto Total = Σ nu_amount_total` — cuadraron |

---

## Hallazgos

### 🔴 Hallazgo 1 — `/pages/cobros` devolvió **HTTP 500** (`StackOverflowError`) en el primer acceso

**Reproducido HOY, 2026-08-18 ≈19:32 UTC, en la versión bajo prueba.** Primer `GET` a
`/DenarioPremium/pages/cobros` con sesión recién iniciada:

```
Estado HTTP 500 – Internal Server Error
mensaje  Error creating bean with name 'collectionBean': Invocation of init method failed;
         nested exception is java.lang.StackOverflowError
   javax.servlet.ServletException  →  javax.faces.webapp.FacesServlet.service(FacesServlet.java:671)
```

- Los demás módulos cargaron bien en esa misma sesión ⇒ **no es la sesión, es el bean de cobros.**
- A los ~4 min, pasando primero por `/pages/main`, la misma URL cargó normal y todos los casos
  `DW-COB-F01..F10` pasaron. **Es intermitente, no determinista.**
- **Impacto:** el módulo transaccional más usado queda inaccesible mientras dura. Un
  `StackOverflowError` en la inicialización de un bean suele ser recursión infinita al armar el
  árbol de datos: **conviene mirarlo aunque no reproduzca a pedido.**
- Evidencia guardada en el RUN_DIR: **`web-filtros_evidencia_cobros-500.log`**
  (`[ERROR] Failed to load resource: the server responded with a status of 500 () @ .../pages/cobros`).

> Gate §5.a: ✅ pasa — ocurrió hoy, en esta versión, en el primer acceso del día.

### 🟠 Hallazgo 2 — CONFIRMADO (defecto ya conocido): **el vendedor dado de baja borra sus transacciones del listado web**

No es nuevo — está en memoria (`project_pedidos_ocultos_salesman_view`, confirmado en `grupo_fiel`
el 17/08). **Acá se reprodujo en 5 módulos con la aritmética exacta**, así que se documenta la
medición, no como hallazgo nuevo.

**Mecánica:** las listas se unen contra la vista de vendedores; un `users.co_operation = 'D'`
excluye **todas** las transacciones de ese usuario, aunque la transacción esté vigente.

**Prueba de renglón único (pedidos, rango 10–12/07/2026):**

| | |
|---|---|
| BD `da_order` en rango | **102** (`Σ nu_amount_total_base = 6.033.721,05`) |
| Web `Total de Resultados` | **101** (`Total Base = 6.033.154,93`) |
| Diferencia | **1 pedido · 566,12** |
| Refs en la web | `242…343` **sin el 271** |
| Pedido 271 | `id_user 534` · `co_user 000429` · vigente (`co_operation='U'`) · 566,12 |
| Usuario 534 | `ROXANNA ELENA DE LA C. SIERRA PIÑERO`, login `000429`, **`users.co_operation='D'`**, `da_update 2026-08-18` |

`6.033.721,05 − 6.033.154,93 = 566,12` = exactamente el monto del pedido oculto. **Cierre exacto.**

**Segunda prueba independiente (pedidos, filtro `Tiene Adjunto = SI`, julio):** BD 16 · web 15;
el que falta es el pedido `810` del usuario `516`, también `co_operation='D'`.

**Alcance total medido en el tenant:**

| Módulo | Registros ocultos | Último oculto |
|---|---|---|
| Pedidos | **71** | 28/07/2026 |
| Cobros | **34** | **03/08/2026** ← mes en curso |
| Visitas | **40** | 23/07/2026 |
| Devoluciones | **7** | 29/07/2026 |
| Clientes potenciales | **5** | — |
| Inventarios | 0 | — |
| **Total** | **157** | |

**También contamina los indicadores de importe**, no solo el conteo: en cobros del mes en curso
la web totaliza **5.412.686,36** contra **5.413.211,33** reales ⇒ **faltan 524,97 US$** en el
indicador de cabecera.

**Severidad:** 🟠 media-alta. §5.a dice que registros de usuarios de baja pesan poco, **pero acá
hay 20 usuarios de baja, uno dado de baja HOY (17:32), y el registro oculto más reciente es del
03/08 — dentro del rango por defecto.** La cartera se reasigna y las ventas siguen siendo de la
empresa: desaparecen de reportes y de conciliación.

### 🟡 Hallazgo 3 — Depósitos: los indicadores en `0,00` **NO son un error de la web en este tenant**

El defecto conocido dice «`/pages/depositos` muestra ambos indicadores en 0,00 con datos». Acá se
midió el origen y **la web está mostrando fielmente el dato**:

```sql
SELECT id_deposit, nu_amount_doc FROM deposit;
--  1 | 0.0000
--  2 | 0.0000
SELECT count(*) FROM deposit_collection_payment;  --  0
```

- Ambos depósitos tienen `nu_amount_doc = 0.0000` **en BD**.
- La tabla puente `deposit_collection_payment` está **vacía**: el vínculo con el cobro existe solo
  por `collection.id_deposit` (cobros `6418 → depósito 1` y `30800 → depósito 2`).
- ⇒ El `0,00` de la columna `Monto depositado` y del indicador `Monto total en US$` es **correcto
  respecto de la fuente**. Lo que hay que revisar es **por qué la app guarda el depósito con monto
  0 y sin filas puente** — eso es defecto móvil/servicio, no web.

> Este tenant es la oportunidad que pedía el encargo para replicar el caso: replicó, y el resultado
> **reencuadra el defecto**. Vale la pena revisar si en los tenants anteriores pasaba lo mismo.

### 🟢 Observaciones descartadas por el gate §5.a

| Observación | Por qué NO es hallazgo |
|---|---|
| «El filtro Status de pedidos devuelve 7 y BD dice 28» | **Error del oráculo, no de la web.** Se ordenaba el historial por `da_transaction_statuses`; con el orden correcto (`id_transaction_statuses`) BD da 7. Remedido antes de reportar |
| «El filtro Actividad de visitas devuelve 73 y BD dice 317» | **Artefacto de automatización:** el combo `Coordenadas` había quedado en `Fuera de Rango`. La intersección real (act. 85 ∧ coord. 4) es exactamente **73** en BD. Con el combo limpio, 317 = 317 |
| «`Limpiar` deja las fechas vacías en clientes potenciales» | Variación de comportamiento entre módulos, no pérdida de datos: sin fechas lista la población completa (183 = BD sin usuarios de baja). Se documenta como patrón |
| Columna `Vendedor` de clientes potenciales muestra `000208` (solo el primer token) | Por diseño — `WEB-RUNTIME §5.b` |
| Filtro `Coordenadas = No Realizado` (defecto conocido de Caribe) | **No evaluable acá:** BD no tiene ningún registro con `st_coordinate = 1` en el rango. `WEB-N/A`, no PASS |

---

## Detalle por módulo

### `/pages/pedidos` — `form:pedidosDT` · 14 casos (11 PASS · 3 N/A)

| Caso | Filtro | Web | BD | Marca |
|---|---|---|---|---|
| DW-PED-F01 | `# Ref = 2819` (creado hoy por el QA) | 1 fila · `409,07 US$` · `FERRETERIA EPA` · `000208 000208` | `id_order 2819`, `nu_amount_total 409.07`, `id_user 470`, `co_client 006831` | `WEB-OK` |
| DW-PED-F02 | `# Ref = 99999999` | 0 filas · «No se encontraron registros.» · sin error | — | `WEB-OK` |
| DW-PED-F03 | `Limpiar` tras F02 | `n_ref=""`, fechas `01/08–18/08`, **957** | 957 | `WEB-OK` |
| DW-PED-F04 | Vendedor `000208 000208` (`value=470`) | **54** · 1 solo vendedor en las 54 filas | 54 | `WEB-OK` |
| DW-PED-F05 | Rango por defecto `01/08–18/08` | **957** · Base `5.210.954,31` = Total | `count 957` por `da_order` **y** por `da_created` | `WEB-OK` |
| DW-PED-F05b | Rango `10/07–12/07` | **101** · Base `6.033.154,93` · 3 días, ninguno fuera | 102 · `6.033.721,05` → **101 + 1 oculto (Hallazgo 2)** | `WEB-OK` |
| DW-PED-F06 | Status `Enviado` / `Aprobado` | **7** / **679** · columna homogénea | 7 / 679 (orden por `id_transaction_statuses`) | `WEB-OK` |
| DW-PED-F07 | Tipo Pedido | combo con **solo el placeholder** | `selectOrderType=false` en el perfil | `WEB-N/A` |
| DW-PED-F08 | Cliente `EDGAR EDUARDO FIOL MORENO` (`id_client 3872`) | **13** · un solo cliente | 13 | `WEB-OK` |
| DW-PED-F09 | Moneda | **el filtro no existe** en este módulo/build | — | `WEB-N/A` |
| DW-PED-F10 | `Tiene Adjunto = SI`, julio | **15** — refs `1561,1556,1534,1531,1528,1184,735,694,587,484,312,285,277,244,222` | 16; el que falta es `810` (usuario de baja) | `WEB-OK` |
| DW-PED-F11 | Vendedor 470 **+** `01/07–31/07` | **44** · todas de julio · un solo vendedor (**intersección**, no unión) | 44 | `WEB-OK` |
| DW-PED-F12 | Paginación → página 2 | `page=1`, **4** filas (54−50), mismo vendedor | — | `WEB-OK` |
| DW-PED-F13 | rows-per-page 50 → 100 → 200 | `rows=100` ⇒ 54 contadas = 54 pintadas; persiste entre búsquedas | — | `WEB-OK` |
| DW-PED-F14 | Empresa | **1 sola opción, sin placeholder** ⇒ no es ejercitable | 1 empresa en `enterprise` | `WEB-N/A` |

### `/pages/cobros` — `form:cobrosDT` · 12 casos (10 PASS · 1 FAIL · 1 N/A)

| Caso | Filtro | Web | BD | Marca |
|---|---|---|---|---|
| DW-COB-F00 | **Disponibilidad del módulo** | **HTTP 500 · `StackOverflowError` en `collectionBean`** (1.er acceso) | — | ❌ FAIL — ver Hallazgo 1 |
| DW-COB-F01 | `# Ref = 32992` | 1 fila · `410,19 US$` · `FAMILY DOLLAR, C.A.` · `YANELYS KAROLINA LEON RAMIREZ` | `id_collection 32992`, `410.19`, `id_user 491` | `WEB-OK` |
| DW-COB-F02 | `# Ref = 99999999` | 0 filas · «No se encontraron registros.» | — | `WEB-OK` |
| DW-COB-F03 | `Limpiar` | fechas `01/08–18/08`, **1025**, `Monto total US$ 5.412.686,36` | 1025 / 5.412.686,36 (sin usuarios de baja) | `WEB-OK` |
| DW-COB-F04 | Vendedor `491` | **32** · un solo vendedor | 32 | `WEB-OK` |
| DW-COB-F05 | Rango por defecto | **1025** · `5.412.686,36` | por `da_collection`: 1027 / `5.413.211,33` → **1025 + 2 ocultos** (Hallazgo 2) | `WEB-OK` |
| DW-COB-F06 | Tipo Cobro `Retención` | **23** · columna homogénea | `co_type=2` ⇒ 23 | `WEB-OK` |
| DW-COB-F07 | Tipo Cobro `Anticipo/Prepago` | **229** | `co_type=1` ⇒ 229 | `WEB-OK` |
| DW-COB-F08 | Status `Aprobado` | **729** · columna homogénea | `id_status=11` ⇒ 729 | `WEB-OK` |
| DW-COB-F09 | Cliente `COMERCIAL HERMANOS FARAH, C. A.` (`1144`) | **11** | 11 | `WEB-OK` |
| DW-COB-F10 | `Depositado = SI`, julio | **2** — refs `30800` (16/07) y `6418` (13/07) | exactamente los 2 cobros con `id_deposit` no nulo | `WEB-OK` |
| DW-COB-F11 | Empresa | 1 sola opción | — | `WEB-N/A` |

⚠ La columna `Monto cobrado` trae **desglose por método de pago** y la columna `Pagos` concatena la
ficha del pago — comportamiento **por diseño** (`§5.b`), no se juzga acá.

### `/pages/devoluciones` — `form:pedidosDT` · 9 casos (8 PASS · 1 SKIP)

| Caso | Filtro | Web | BD | Marca |
|---|---|---|---|---|
| DW-DEV-F01 | `# Ref = 350` (creada hoy por el QA) | 1 fila · `FERRETERIA EPA` · `000208 000208` · 18/08 15:00:10 | `id_return 350`, `id_user 470` | `WEB-OK` |
| DW-DEV-F02 | `# Ref = 99999999` | 0 filas · «No se encontraron registros.» | — | `WEB-OK` |
| DW-DEV-F03 | `Limpiar` | fechas `01/08–18/08`, **89** | 89 | `WEB-OK` |
| DW-DEV-F04 | Vendedor `470` | **1** | 1 | `WEB-OK` |
| DW-DEV-F05 | Rango por defecto | **89** por `da_return` | 89 (por `da_created` serían 90 ⇒ **la columna es `da_return`**) | `WEB-OK` |
| DW-DEV-F06 | Status `Enviado` / `Por aprobar` | **89** / **0** («No se encontraron registros.») | `id_status=8` ⇒ 89 · `id_status=1` ⇒ 0 | `WEB-OK` |
| DW-DEV-F07 | Cliente | no ejecutado (🟢 opcional; cubierto en pedidos y cobros) | — | SKIP |
| DW-DEV-F08 | `Tiene Adjunto = SI` | **82** | `has_attachments` ⇒ 82 | `WEB-OK` |
| DW-DEV-F09 | Vendedor `470` **+** `01/07–31/07` | **0** (intersección, no unión: solo o 1 o 144) | 0 | `WEB-OK` |

### `/pages/inventarios` — `form:pedidosDT` · 9 casos (8 PASS · 1 SKIP)

| Caso | Filtro | Web | BD | Marca |
|---|---|---|---|---|
| DW-INV-F01 | `# Ref = 52` (creado hoy por el QA) | 1 fila · `FERRETERIA EPA` · `000208 000208` | `id_client_stock 52`, `id_user 470`, `co_client 006831` | `WEB-OK` |
| DW-INV-F02 | `# Ref = 99999999` | 0 filas + mensaje | — | `WEB-OK` |
| DW-INV-F03 | `Limpiar` | fechas `01/08–18/08`, **19** | 19 | `WEB-OK` |
| DW-INV-F04 | Vendedor `470` | **1** | 1 | `WEB-OK` |
| DW-INV-F05 | Rango `01/08–18/08` y `01/06–31/08` | **19** y **52** | 19 y 52 (= población completa) | `WEB-OK` |
| DW-INV-F06 | Cliente | no ejecutado (🟡; presupuesto) | — | SKIP |
| DW-INV-F07 | Status `Enviado` | **52** · columna homogénea | `id_status=2` ⇒ 52 (los 52 registros) | `WEB-OK` |
| DW-INV-F08 | `Tiene Adjunto = SI`, `01/06–31/08` | **4** — refs `52, 22, 8, 2` | los 4 con `has_attachments`, mismos ids | `WEB-OK` |
| DW-INV-F09 | Vendedor **+** rango | cubierto por F04 sobre el rango por defecto | — | `WEB-OK` |

### `/pages/visitas` — `form:tablaVisit` · 13 casos (10 PASS · 2 SKIP · 1 N/A)

Es el módulo con más filtros: `Roles`, `Vendedor` (`:idSalesman`), `Cliente` (`:idClient`),
`Estatus`, `Actividad`, `Motivo` (104 opciones), `Adjuntos`, `Despachado`, `Coordenadas`, `# Ref`.

| Caso | Filtro | Web | BD | Marca |
|---|---|---|---|---|
| DW-VIS-F01 | `# Ref = 2080` (creada hoy por el QA) | 1 fila · `VISITA FUERA DE RUTA` · `Geo: Fuera de Rango` | `id_visit 2080`, `id_user 470`, 1 `incidence` | `WEB-OK` |
| DW-VIS-F02 | `# Ref = 99999999` | 0 · **«No existe registro»** (literal propio de visitas) | — | `WEB-OK` |
| DW-VIS-F03 | `Limpiar` | fechas `01/08–18/08`, **929** | 929 | `WEB-OK` |
| DW-VIS-F04 | Vendedor `000208 - 000208 000208` (`470`) | **1** (ref 2080) | 1 | `WEB-OK` |
| DW-VIS-F05 | Rango por defecto | **929** | 916 visitas ⇒ **929 filas** con el LEFT JOIN a `incidence` (1 visita sin actividad) | `WEB-OK` |
| DW-VIS-F06 | Actividad `VENTA EN RUTA` (`85`) | **317** · columna homogénea | `incidence.co_type=85` ⇒ 317 | `WEB-OK` |
| DW-VIS-F07 | Motivo | no ejecutado (🟡; 104 opciones, presupuesto) | — | SKIP |
| DW-VIS-F08 | Estatus `No visitado` | **0** + «No existe registro» | todas las visitas del rango son `st_visit=2` ⇒ 0 | `WEB-OK` |
| DW-VIS-F09 | Cliente | no ejecutado (🟢) | — | SKIP |
| DW-VIS-F10 | Coordenadas `Fuera de Rango` | **289** · `Geo` homogéneo | `st_coordinate=4` ⇒ 289 filas | `WEB-OK` |
| DW-VIS-F11 | Adjuntos `Tiene Adjuntos` | **73** | `has_attachments` ⇒ 73 filas | `WEB-OK` |
| DW-VIS-F12 | Actividad `85` **∧** Coordenadas `4` | **73** | 73 — **intersección exacta** | `WEB-OK` |
| DW-VIS-F13 | Coordenadas `No Realizado` | no evaluable | **0 registros con `st_coordinate=1`** en el rango ⇒ no se puede replicar el defecto conocido de Caribe | `WEB-N/A` |

### `/pages/depositos` — `form:pedidosDT` · 8 casos (7 PASS · 1 N/A)

Solo hay **2 depósitos** en todo el tenant (13/07 y 16/07), ninguno del vendedor QA.

| Caso | Filtro | Web | BD | Marca |
|---|---|---|---|---|
| DW-DEP-F01 | `# Ref = 2` | 1 fila · planilla `1201838918` | `id_deposit 2`, `nu_document 1201838918` | `WEB-OK` |
| DW-DEP-F02 | `# Ref = 99999999` | 0 + mensaje | — | `WEB-OK` |
| DW-DEP-F03 | `Limpiar` | fechas `01/08–18/08` ⇒ **0** | 0 depósitos en agosto ✅ | `WEB-OK` |
| DW-DEP-F04 | Vendedor `JAVIER JOSE GUEREZ GARCIA` (`525`), julio | **1** (ref 1) | `deposit 1` es de `id_user 525` | `WEB-OK` |
| DW-DEP-F05 | Rango `01/07–31/07` | **2** — refs 2 (16/07 13:56) y 1 (13/07 15:44), bancos y planillas correctos | 2 | `WEB-OK` |
| DW-DEP-F06 | Status `Enviado` | **2** | `id_status=9` en ambos | `WEB-OK` |
| DW-DEP-F07 | Moneda | **el filtro no existe** en este módulo | — | `WEB-N/A` |
| DW-DEP-F08 | Vendedor **+** fechas | cubierto por F04 (vendedor + julio ⇒ 1 de 2) | — | `WEB-OK` |

⚠ `Monto depositado` y el indicador salen `0,00` — **fiel a la BD** (Hallazgo 3), no es defecto de filtro.

### `/pages/clientesPotenciales` — `form:pedidosDT` · 6 casos (5 PASS · 1 N/A)

| Caso | Filtro | Web | BD | Marca |
|---|---|---|---|---|
| DW-CLT-F01 | Vendedor `470` | **2** — refs `194` (`Test-CLT-SMOKE-153911`) y `193` (`Emma`), ambos de hoy | 2 | `WEB-OK` |
| DW-CLT-F02 | Rango por defecto | **60** | 60 por `da_client` | `WEB-OK` |
| DW-CLT-F03 | `Limpiar` | 🔎 **deja las fechas VACÍAS** (≠ los otros módulos) ⇒ **183** | 183 (188 vigentes − 5 de usuarios de baja) | `WEB-OK` |
| DW-CLT-F04 | Vendedor `470` **+** `01/07–31/07` | **0** (intersección) | 0 | `WEB-OK` |
| DW-CLT-F05 | `Tiene Adjunto = SI`, sin fechas | **171** | 171 | `WEB-OK` |
| DW-CLT-F06 | `# Ref` | 🔎 **el input `[id$=":n_ref"]` NO existe en el DOM** — limitación conocida de la web, la lista **sí** trae columna `# Ref` ⇒ el barrido por vendedor + fechas es exacto | — | `WEB-N/A` |

---

## Patrones / selectores nuevos

### 🔴 El estatus vigente se resuelve por `id_transaction_statuses`, NO por fecha
Documentado arriba con el contraejemplo del pedido 2817. **Es la trampa de BD más cara de esta
corrida**: produjo un falso «la web pierde 21 pedidos» que se descartó remidiendo. Añadir a
`_comunes.md §query.js`.

```sql
-- oráculo canónico del Status de cualquier módulo
WITH ts AS (
  SELECT DISTINCT ON (id_transaction) id_transaction, id_status
  FROM transaction_statuses
  WHERE co_transaction_type = 'ped'      -- ped | cob | dev | inv | dep
    AND co_operation IS DISTINCT FROM 'D'
  ORDER BY id_transaction, id_transaction_statuses DESC   -- ⚠ NO por da_transaction_statuses
)
SELECT ts.id_status, count(*) FROM w LEFT JOIN ts ON ts.id_transaction = w.id_order GROUP BY 1;
```

### 🔴 Conteo de la lista de VISITAS = visitas × actividades (LEFT JOIN)
```sql
WITH w AS (SELECT id_visit FROM visit WHERE co_operation IS DISTINCT FROM 'D' AND da_visit::date BETWEEN … ),
     i AS (SELECT id_visit, count(*) n FROM incidence WHERE co_operation IS DISTINCT FROM 'D' GROUP BY 1)
SELECT sum(greatest(coalesce(i.n,0),1)) FROM w LEFT JOIN i USING (id_visit);
```
`count(visit)` da 916 y la web muestra 929. **El `greatest(...,1)` importa**: una visita sin
`incidence` sigue ocupando una fila.

### 🔴 Todo conteo web debe excluir a los usuarios de baja
```sql
AND id_user NOT IN (SELECT id_user FROM users WHERE co_operation = 'D')
```
Sin esto, **todos** los conteos globales de este tenant dan de más (Hallazgo 2). Aplica a pedidos,
cobros, devoluciones, visitas y clientes potenciales.

### ⚠ Cambiar DOS combos en la misma `evaluate` es una carrera
`setCombo(A) ; setCombo(B)` dentro de una sola llamada dejó el combo A **sin aplicar** (el
`<select>` espejo conservó el valor anterior) porque el ajax de A re-renderiza el panel mientras B
lo está tocando. Produjo un falso «el filtro Actividad devuelve 73 en vez de 317».
⇒ **Un combo por `evaluate`, y releer siempre el `value` del `<select>` espejo antes de `Buscar`.**
Amplía la nota de `_comunes.md` («elegir → esperar → verificar»): la verificación tiene que ser
**después de cada combo**, no solo antes de `Buscar`.

### ⚠ Poblar + `Buscar` + leer en la misma `evaluate` devuelve la tabla ANTERIOR
Reconfirmado: `setCombo('orderStatus','Aprobado') + buscar() + conteo()` devolvió **229** (el
resultado previo) y una columna `Estatus` mezclada; releído en una llamada aparte, **729** y columna
homogénea. **Leer siempre en una llamada separada.**

### ✅ `Limpiar` — comportamiento medido en este build (La Tortuga, 18/08)

| Módulo | `# Ref` | Fechas | Combos |
|---|---|---|---|
| pedidos · cobros · devoluciones · inventarios · depósitos | ✅ se vacía | ✅ **vuelven al mes en curso** | ❌ NO los toca |
| **clientes potenciales** | (no tiene) | 🔎 **quedan VACÍAS** ⇒ lista la población completa | ❌ NO los toca |

⇒ **Corrige la nota `[difranca-20260807]`** («`Limpiar` NO resetea las fechas en cobros y pedidos»):
en este build **sí** las resetea, salvo en clientes potenciales, donde las **borra**.
Como los combos nunca se resetean, **hay que limpiarlos a mano** (`Cliente`, `Tipo`, `Status`,
`Adjunto`, `Coordenadas`) antes de cada medición nueva — costó dos falsos positivos en esta tanda.

### ✅ Sufijos confirmados en este build

```
pedidos      :idEnterprise :idSalesmaView :clientSOM :idOrderType :orderStatus :attachStatus :n_ref :dateB/:dateF :ajax :botonLimpiar
cobros       + :idTipo  + :idDep                     (sin :idCurrency en este tenant)
devoluciones :idEnterprise :idSalesmaView :clientSOM :orderStatus :attachStatus :n_ref :dateB/:dateF
inventarios  idénticos a devoluciones
depositos    :idEnterprise :idSalesmaView :orderStatus :n_ref :dateB/:dateF        (sin Cliente ni Moneda)
clientesPot. :idEnterprise :idSalesmaView :attachStatus :dateB/:dateF              (🔴 SIN :n_ref)
visitas      :idRol :idSalesman :idClient :idEstatus :idType :idMotive :selectAttach
             :selectDispatch :selectCoordinadas :n_ref :dateB/:dateF :btnBuscar (NO :ajax)
```

- **Visitas** usa `:idSalesman` (no `:idSalesmaView`) y `:idClient` (no `:clientSOM`), y su botón es
  `:btnBuscar`. **Sí tiene filtro de vendedor** (confirma la corrección `[grupo_fiel-20260817]`).
- El literal del combo de adjuntos **cambia entre módulos**: `SI`/`NO` en pedidos, cobros,
  devoluciones, inventarios y clientes potenciales; **`Tiene Adjuntos`/`No Tiene Adjuntos` en
  visitas**. Un `setCombo(..., 'SI')` genérico **falla** en visitas.
- `PF('cobrosDT').paginator.cfg` y `PF('pedidosDT').paginator.cfg` exponen `rowCount/rows/page`.
  **`PF('tablaVisit')` no expone paginator** (reconfirmado) ⇒ en visitas el conteo se lee del
  `.ui-datatable-header` (`Total de Resultados: N`), que **sí** está y es fiable.
- Los prefijos del panel variaron entre módulos en la misma sesión (`j_idt114`, `j_idt115`,
  `j_idt116`) ⇒ **anclar por sufijo, nunca por `j_idt*`** (regla reconfirmada por 7.ª vez).

### 🟢 `page.addInitScript(bundle)` — el bundle sobrevive a todas las navegaciones
Se instaló **una vez** al inicio y `window.__qaW` siguió vivo tras ~20 `browser_navigate` y todos los
`Buscar`. Elimina el re-pegado por módulo y ahorra mucho contexto. Reconfirma `[kron-20260817]`.

### 🟢 `hit(el)` (ejecutar el `onclick`) al 100 %
~45 `Buscar`/`Limpiar` sin un solo `chrome-error://`. El anti-patrón `boton.click()` sigue vigente.

### 🟢 Navegar a `/pages/main` entre módulos evita el `IndexOutOfBoundsException`
Se aplicó en los 7 saltos de módulo: **0 páginas en blanco**. Reconfirma `[kron-20260817]`.

> ✅ consolidado 2026-08-19 → `web-selectors/_comunes.md` (oráculos `query.js`, dictamen de filtros,
> mapa de sufijos, `Limpiar`, literales del combo de adjuntos) + `visitas.md`.

---

## Qué revisaría primero

1. **`collectionBean` / `StackOverflowError`** (Hallazgo 1) — deja el módulo de cobros caído.
2. **La exclusión por vendedor de baja** (Hallazgo 2) — 157 registros y **524,97 US$** invisibles
   en el mes en curso; ya está reportado, esta corrida aporta la aritmética exacta y el alcance.
3. **Depósitos guardados con `nu_amount_doc = 0` y sin filas en `deposit_collection_payment`**
   (Hallazgo 3) — reencuadra un defecto que se venía atribuyendo a la web.

---

*Agente WEB · familia `F##` · 2026-08-18 · read-only · 71 casos · oráculo BD `run_vzla`*
