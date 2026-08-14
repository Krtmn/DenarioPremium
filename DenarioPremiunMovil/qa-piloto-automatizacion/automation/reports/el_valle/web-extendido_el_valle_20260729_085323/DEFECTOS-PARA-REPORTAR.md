# Defectos de la web Denario Premium — para reportar al equipo

| | |
|---|---|
| **Corrida** | `20260729_085323_web-extendido` (guión alterno, primera ejecución) |
| **Entorno** | Playa **La Tortuga** · `denariolatortuga.ddns.net:8080` · tag **20** |
| **Empresa** | PROCESADORA DE ALIMENTOS COVADONGA, C.A (cliente `el_valle`) |
| **Alcance** | 32 casos sobre reportes, indicadores, facturaciones, datos maestros, visitas, estructura comercial y configuración — **pantallas que nunca se habían validado** |
| **Resultado** | 18 OK · 7 N/A · 4 descuadres de cálculo · 3 de campo |
| **Modo** | 100 % lectura. No se creó, editó ni borró nada |

**Cómo leer esto:** cada defecto trae **qué se observó**, **qué debería pasar**, **la evidencia numérica**,
**qué explicaciones inocentes se descartaron** y **cómo reproducirlo**. Lo marcado ✅ **verificado** lo
comprobé yo directamente contra la BD; lo demás viene del reporte del agente y está indicado como tal.

> ℹ **Dos cosas NO son defecto** y conviene decirlo antes, para que nadie las investigue:
> · Que la lista de clientes muestre 5.382 de 7.007 — la diferencia son **1.625 suspendidos** (`in_suspension`), y al pulsar `Limpiar` sí aparecen los 7.007.
> · Que Presupuesto de Venta y Cuota de Venta salgan vacíos — **no hay datos cargados**, confirmado en BD.

---

## 🔴 D-01 · Morosidad muestra CERO habiendo cartera vencida

**Pantalla:** Indicadores → Cobros → Morosidad · `/pages/protected/indicadores/indicadorMorosos.xhtml`
**Severidad:** alta — daño directo al negocio

**Observado:** los **cinco tramos de mora en 0,00** y los dos gráficos de torta vacíos (`labels: []`, `data: []`).

**Esperado:** la deuda vencida real, distribuida por tramos.

**Evidencia** (filtros de la pantalla: Empresa=1 · Moneda=USD · Tipo documento=1):

| Tramo (días) | Web | BD |
|---|---:|---:|
| 1 – 7 | 0,00 | 18.911,15 |
| 8 – 15 | 0,00 | 79.251,09 |
| 16 – 30 | 0,00 | 93.709,43 |
| 31 – 45 | 0,00 | 88.696,54 |
| 46 – 9999 | 0,00 | 481.855,39 |
| **TOTAL** | **0,00** | **762.423,60** |

⚠ **Ese total incluye documentos borrados.** ✅ **Verificado por mí:** excluyendo `co_operation='D'`, la
deuda vencida **real** es **241.573,94 USD en 732 documentos de 448 clientes**. Los otros 520.891,90
corresponden a 2.048 documentos borrados (ver **D-02**).

⇒ **Cualquiera sea la cifra correcta, la web muestra 0,00.** El defecto no depende de esa distinción.

**Descartado:** que los filtros excluyan los documentos (todos son USD / tipo 1 / empresa 1); que la mora
caiga fuera de los tramos (va de 1 a 655 días); que faltara pulsar `Buscar` (se pulsó, sigue en 0).

**Reproducción:** entrar a la pantalla con los filtros por defecto. Los cinco tramos salen en 0.

**Impacto:** un gerente que abra esta pantalla concluye que **no tiene cartera vencida**.

---

## 🔴 D-02 · La lista de Documentos incluye los registros borrados

**Pantalla:** Datos Maestros → Documentos de Venta · `/pages/documentos`
**Severidad:** alta

**Observado:** la grilla lista **2.783** documentos, incluidos **2.048 marcados como borrados**
(`co_operation='D'`). **No hay ninguna columna de estatus: se ven idénticos a los vigentes.**

**Esperado:** solo los 735 vigentes (`co_operation='I'`).

**Evidencia:**

| | Web | Correcto | Diferencia |
|---|---:|---:|---:|
| Documentos | 2.783 | 735 | **+2.048** (3,79×) |
| Deuda vencida | 762.465,84 USD | 241.573,94 USD | **+520.891,90 fantasma** |

✅ **Verificado por mí** — caso concreto: `co_document_sale = 00026235`, `co_operation='D'`,
saldo 3.114,26 USD, vencido el 16/07/2026. **Aparece en pantalla.**

**Contraste que ayuda a ubicar la causa:** `/pages/itinerario` (Plan de Visitas) **sí oculta**
correctamente las visitas con `co_operation='D'`. El backend sabe filtrar borrados; **no lo hace en esta
consulta**. Sugiere un `WHERE` faltante en un repositorio puntual, no una decisión de diseño.

**Reproducción:** abrir la pantalla y buscar el documento `00026235`. Está listado.

**Impacto:** medio millón de dólares de deuda inexistente en la vista que usan los cobradores.

---

## 🔴 D-03 · Facturaciones muestra 0 de 735 documentos vivos

**Pantalla:** Transacciones → Facturaciones · `/pages/facturaciones`, filtro **Tipo = "Pendientes por cobrar"**
**Severidad:** alta

**Observado:** la grilla sale **vacía** (0 filas).

**Esperado:** los **735** documentos de venta vigentes con saldo.

**Dato de contexto:** el combo "Tipo" tiene `value` = `INVOICE` / `DOCUMENT_SALE` / `TODOS` — literalmente
los nombres de tabla. Con `INVOICE` sale vacío **correctamente** (`invoice` tiene 0 filas, es `WEB-N/A`).
El defecto es con `DOCUMENT_SALE`.

**Descartado, uno por uno:** `co_operation='D'` (ya excluido) · `nu_balance>0` (735/735 lo cumplen) ·
`st_document_sale` (valor único = 6) · empresa (hay una sola) · rango de fechas (2024-10-04 → 2026-07-15,
todo dentro) · `da_duedate` nulo (0 casos) · cliente huérfano (0 casos). **Ninguno lo explica.**

**Hipótesis de causa** — ✅ **verificada por mí en el dato, no en el código:** los 735 documentos vivos
tienen **`id_user` en NULL** (de hecho los 2.783 de la tabla). Si esta grilla hace un **`INNER JOIN` con la
tabla de usuarios** —tiene columna y filtro de Vendedor—, los descarta todos. Encaja con que
`/pages/documentos`, que no hace ese join, **sí los muestre**.
⚠ Es hipótesis, no está confirmada en código. Vale como punto de partida.

**Reproducción:** entrar a Facturaciones, elegir Tipo = "Pendientes por cobrar", pulsar Buscar. 0 filas.

**Impacto:** la cartera por cobrar aparece **completamente vacía** para el usuario.

---

## 🔴 D-04 · Canales de Distribución se contradice a sí mismo

**Pantalla:** Estructura Comercial → Canales de Distribución · `/pages/segmentacion`
**Severidad:** media

**Observado:** el contador dice **"Cantidad clientes = 7.007"**, pero su propio botón
**`Consultar clientes` lista 5.382**. Δ = **1.625**.

**Esperado:** que ambos números coincidan, sea cual sea el criterio.

**Por qué SÍ es defecto:** la diferencia es exactamente `in_suspension` (1.625 suspendidos). Pero acá el
flag **explica el origen sin justificarlo**: no son dos pantallas distintas con criterios distintos —es
**una sola pantalla mostrando dos verdades incompatibles** al mismo usuario, en el mismo momento. Una de
las dos cuenta suspendidos y la otra no.

**Reproducción:** abrir la pantalla, leer el contador, pulsar `Consultar clientes`, contar las filas.

---

## 🔴 D-05 · La columna "Límite crédito" muestra el saldo del documento

**Pantalla:** Datos Maestros → Documentos de Venta · `/pages/documentos`
**Severidad:** media — engañoso para quien decide crédito

**Observado:** la columna `Límite crédito` repite el **saldo del documento**, no el límite del cliente.
Ocurre en **40 de 40** filas revisadas.

**Evidencia** — ✅ **verificada por mí**, documento `P00004614`:

| Campo | Valor |
|---|---:|
| Saldo del documento (`nu_balance`) | **803,26** |
| Total del documento (`nu_amount_total`) | 818,55 |
| Límite de crédito del cliente (`nu_credit_limit`) | **600,00** |
| **Lo que muestra la web** | **803,26** ← el saldo |

Se descartaron las dos alternativas usando documentos parcialmente pagados: no es el total ni el límite.

**Reproducción:** abrir la pantalla y comparar la columna con `client.nu_credit_limit` de cualquier fila.

**Impacto:** un cobrador que use esa columna para decidir si otorga crédito está leyendo otro dato.

---

## 🔴 D-06 · Los filtros de Productos no devuelven nada

**Pantalla:** Datos Maestros → Productos · `/pages/productos`
**Severidad:** media

**Observado:** filtrar por texto o por select devuelve **0 resultados sobre datos que existen**.
Ejemplo: `C0051` es **la primera fila del listado** y al filtrarlo responde *"No existe registro"*.
`Lista de precio = Precio 1` → 0 resultados, cuando en BD hay 80.

**Descartado que sea artefacto de automatización:** con los filtros vacíos, **el mismo botón** devuelve
50 filas; y la **maquinaria idéntica** (mismos ids `form:j_idt115:*`) **funciona perfecto en Clientes**
—`ABASTO` devuelve 129 resultados, equivalente a `ILIKE '%ABASTO%'`—. El defecto está acotado a la
consulta de esta pantalla.

**Reproducción:** Productos → escribir `C0051` en el filtro → Buscar. Devuelve "No existe registro"
aunque el producto esté visible en la lista sin filtrar.

**Defecto menor asociado:** `Limpiar` no limpia visualmente el campo (el texto queda en pantalla aunque
el filtro se resetee).

---

## 🟡 D-07 · Gráfico mensual de Cobranzas en cero

**Pantalla:** Indicadores → Cobros → Cobranzas · `/pages/protected/indicadores/indicadorCobros.xhtml`
**Severidad:** media

**Observado:** el gráfico mensual Facturado/Cobrado muestra **todo en 0**, mientras el **otro gráfico de
la misma pantalla** sí muestra los valores correctos (1.923,97 reales).

**Por qué llama la atención:** que dos visualizaciones de la misma pantalla, alimentadas por los mismos
datos, den resultados distintos, apunta a una consulta específica y no a falta de datos.

*(Reportado por el agente; no lo re-verifiqué contra BD.)*

---

## 🟡 D-08 · Ventas Diarias no renderiza nada

**Pantalla:** Indicadores → Productos → Ventas Diarias · `/pages/protected/indicadores/pedidosProductosVentas.xhtml`
**Severidad:** media

**Observado:** la pantalla **no muestra nada**: ni tabla, ni gráfico, **ni mensaje de vacío** — con
**438 pedidos** dentro del rango consultado.

**Por qué no es "sin datos":** hay 438 pedidos en el período. Y aunque no los hubiera, una pantalla sin
datos debería decirlo, no quedarse en blanco.

*(Reportado por el agente; no lo re-verifiqué contra BD.)*

---

# Errores de SISTEMA (no de cálculo)

Los D-01 a D-08 son mayormente de datos mal mostrados. Estos son fallos **técnicos**: excepciones del
servidor, JavaScript roto, filtros que no consultan.

---

## 🔴 S-01 · El servidor lanza `NullPointerException` al procesar un cobro sin IGTF

**Dónde:** backend, módulo Cobros (`CollectionBO`) · visible en `failed_transactions`
**Severidad:** alta — es una excepción no controlada en producción

**El error, literal:**
```
Error inesperado Cannot invoke "java.lang.Double.doubleValue()"
because the return value of "...CollectionBO.getNuAmountIgtf()" is null
```

**Qué significa:** un cobro que llega **sin monto de IGTF** hace que el servidor reviente con
`NullPointerException` en vez de validar el dato y responder un error de negocio. **Falta el guard de nulo.**

**Por qué importa más de lo que parece:** corrobora el síntoma que ya teníamos documentado como *"la app
crashea al hacer POST de cobro"*. Puede ser la causa raíz de ese comportamiento.

⚠ **Honestidad sobre el origen:** las 2 filas son del 28/07, de la ventana de la corrida QA, y la
transacción se llama `TEST-ANT-001`. **Lo disparó una sonda nuestra, no un usuario real.** Pero el fallo es
del servidor: un dato faltante no debería producir una excepción no controlada.

---

## 🔴 S-02 · Reintento sin backoff ni tope: 26 intentos en 3 minutos

**Dónde:** cola de reenvío (`failed_transactions`)
**Severidad:** alta — carga innecesaria sobre producción

**Evidencia:** 9 transacciones distintas generaron **79 fallos**.

| Transacción | Intentos | Ventana |
|---|---:|---|
| `1785269490696.0` | **26** | 20:12:11 → 20:15:12 (**3 minutos**) |
| `1785266556477.0` | 15 | 19:33 → 19:47 |

**Mensaje dominante** (77 de 79 filas):
`Error inesperado Transaction silently rolled back because it has been marked as rollback-only`

**Qué significa:** una transacción irrecuperable **se reintenta indefinidamente contra producción**, sin
espera creciente ni límite. Con un dispositivo se notó; con cien vendedores en la calle, multiplica.

---

## 🔴 S-03 · El plugin de gráficos revienta — y es SISTÉMICO

**Dónde:** toda la web · **Severidad:** alta

**El error, capturado en consola:**
```
Uncaught TypeError: Cannot read properties of undefined (reading 'helpers')
  at cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0:6:294
```

**Qué pasa:** `chartjs-plugin-datalabels` **se inicializa antes que Chart.js** y falla. Es un problema de
**orden de carga**, no de datos.

**No es de una pantalla — se registró en cinco:**
`pedidosProductosVentas` · `reportePlanCuota` · `reporteActivacionClientes` · `reporteRotacionInventario` ·
`variablesConfiguracion`.

**Agravante:** el plugin se sirve desde **`cdn.jsdelivr.net`**, un CDN público externo. Si la red del
cliente lo bloquea —habitual en intranets corporativas— **la web se queda sin gráficos por completo**.

🔗 **Esto probablemente EXPLICA D-08** (Ventas Diarias en blanco) y quizá parte de **D-07**. Conviene
arreglar S-03 primero y volver a evaluarlos: puede que no sean defectos independientes sino síntomas de éste.

---

## 🔴 S-04 · Segundo filtro roto: `Código documento` en Documentos

**Dónde:** Datos Maestros → Documentos de Venta · `/pages/documentos`
**Severidad:** media

**Observado:** el filtro `Código documento` devuelve **0 resultados para códigos que esa misma pantalla
está mostrando**.

| Filtro | Web | BD |
|---|---:|---:|
| `Código documento = 00026237` (vigente, existe) | **0** | 1 |
| `Código documento = 00026235` (listado en pantalla) | **0** | 1 |

**Y el contraste que aísla el problema:** en la **misma pantalla**, el **filtro de rango de fechas funciona
perfecto** — 3 de 3 rangos cuadran exactos con el SQL (233, 124 y 2.783 filas).

🔗 **Mismo cuadro de fallo que D-06** (filtros de Productos). Dos pantallas distintas, filtros de
texto/código que no consultan, mientras los filtros de fecha sí funcionan. **Sugiere un componente o patrón
compartido**, no dos bugs sueltos. Vale revisarlos juntos.

---

## 🟡 S-05 · Dos pantallas distintas con el mismo `<title>`

`/pages/mapaRutas` y `/pages/protected/visitas/rutero.xhtml` **ambas** tienen `document.title = "Rutero"`.
Además varios títulos no coinciden con el nombre del menú (`/pages/estructuraEmpresa` → "Zonas de venta",
`/pages/segmentacion` → "Canales de Distribucion").

Menor para el usuario, pero **relevante para automatización y soporte**: el título no sirve para identificar
en qué pantalla está alguien.

---

# Anexo — hallazgos de DATOS, no de la aplicación

No son defectos de software, pero afectan lo que el cliente ve y conviene que alguien los mire.

### A-01 · 3.843 clientes sin vendedor asignado — el 54,8 % de la cartera
✅ **Verificado por mí:** 7.007 clientes activos, **3.158** con vendedor, **3.843 sin ninguno**.
**No aparecen en la app móvil de ningún vendedor.**
**Origen:** una carga ETL del **15/07** que rechazó 3.843 filas con el error `NO EXISTE USUARIO`.
**Agravante:** los indicadores usan 3.158 como denominador, lo que **duplica la efectividad aparente**
(9,6 % en vez de 4,3 % real) sin advertirlo en ninguna parte.

### A-02 · Un pedido de 147,2 millones de USD
Concentra el **99,94 %** del volumen total y es **6.972×** el siguiente. Deja los indicadores monetarios
operativamente inservibles.

### A-03 · Producto con precio corrupto
`C0010 · PERNIL DE CERDO CON PIEL`: **73.576.411,01 USD** en dos listas de precio y 16.534.024,95 en otra.
La web **lo muestra exacto y no contamina** ninguna vista actual (ninguna pantalla de Datos Maestros suma
precios). Pero es el **99,90 %** de la suma de su lista y dispara el precio promedio de 893,30 a
920.587,28 (**×1.030**): cualquier reporte futuro que sume precios saldrá inservible.

### A-04 · Los 4.051 errores del log son un solo incidente
`log_error` tiene 4.051 filas, pero **caben en 61 segundos del 15/07** y son 4 mensajes distintos: el
rechazo de esa carga ETL. **Nada volvió a fallar desde entonces.** No es un problema recurrente.

### A-05 · Esos rechazos no son visibles desde ninguna pantalla
La pantalla "Errores de aplicación" muestra `failed_transactions` (79 filas), **no** `log_error`. Los 4.051
rechazos —y sus 3.843 clientes huérfanos— **no se ven desde la web**. Nadie se enteró hasta esta corrida.

### A-06 · Los gráficos dependen de un CDN externo
Se cargan desde **jsdelivr** y el plugin falla. Si la red de un cliente bloquea ese dominio, **toda la web
se queda sin gráficos**. Vale revisarlo para instalaciones en redes restringidas.

---

# Resumen para priorizar

| # | Hallazgo | Tipo | Severidad | Verificado |
|---|---|---|---|---|
| **D-03** | Facturaciones muestra 0 de 735 documentos | datos | 🔴 alta | ✅ dato + hipótesis de causa |
| **D-01** | Morosidad en cero | datos | 🔴 alta | ✅ |
| **D-02** | Documentos lista los borrados | datos | 🔴 alta | ✅ |
| **S-01** | `NullPointerException` del servidor en cobros sin IGTF | **sistema** | 🔴 alta | agente (log del servidor) |
| **S-03** | Plugin de gráficos roto en **5 pantallas** + CDN externo | **sistema** | 🔴 alta | agente (consola) |
| **S-02** | Reintento sin backoff: 26 intentos en 3 min | **sistema** | 🔴 alta | agente (log) |
| **D-05** | "Límite crédito" muestra el saldo | datos | 🟠 media | ✅ |
| **D-06** | Filtros de Productos no consultan | **sistema** | 🟠 media | agente (aislado con control) |
| **S-04** | Filtro `Código documento` no consulta | **sistema** | 🟠 media | agente (aislado con control) |
| **D-04** | Canales se contradice a sí mismo | datos | 🟠 media | agente |
| **D-07** | Gráfico de Cobranzas en cero | datos | 🟡 media | agente — *ver S-03* |
| **D-08** | Ventas Diarias en blanco | datos | 🟡 media | agente — *probablemente causado por S-03* |
| **S-05** | Dos pantallas con el mismo `<title>` | sistema | 🟡 baja | agente |

## Tres grupos que conviene atacar juntos

**Grupo 1 — el dinero (`document_sale`):** **D-03 · D-01 · D-02**. Los tres le mienten al usuario sobre
plata —cero cartera por cobrar, cero morosidad, medio millón de deuda inexistente— y los tres viven sobre
la misma tabla. Podrían compartir causa.

**Grupo 2 — los filtros que no consultan:** **D-06 · S-04**. Dos pantallas distintas donde el filtro de
texto/código devuelve 0 sobre datos que la propia pantalla muestra, **mientras el filtro de fechas de esa
misma pantalla funciona perfecto**. El patrón repetido sugiere un componente compartido, no dos bugs sueltos.

**Grupo 3 — los gráficos:** **S-03** primero, y **después** volver a evaluar **D-07 y D-08**. Un error de
orden de carga de JavaScript rompe los gráficos en 5 pantallas; es probable que D-08 (pantalla en blanco)
sea un síntoma de eso y no un defecto propio. Arreglar S-03 puede cerrar tres entradas de esta lista.

**Aparte, por riesgo de producción:** **S-01** (excepción no controlada) y **S-02** (reintento sin tope).
Ninguno lo provocó un usuario real, pero ambos son fallos del servidor que un usuario real puede disparar.

*Corrida de solo lectura · el detalle completo con la aritmética está en `extendido-parte1.md`,
`extendido-parte2a.md` y `extendido-parte2b.md` de esta misma carpeta.*
