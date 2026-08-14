# Pasos para verificar a mano — defectos pendientes

**Entorno:** La Tortuga · `http://denariolatortuga.ddns.net:8080/DenarioPremium` · empresa COVADONGA
**Usuario:** el del bloque `# USUARIO WEB LA TORTUGA` · **Todo es de solo lectura.**
Ya verificados y reportados por QA: **D-06** (filtros de Productos) y **S-04** (filtro Código documento).

**Orden sugerido:** empezá por **S-03**. Es el más rentable: si se confirma, **D-08 y D-07 pueden quedar
explicados por él** y te ahorrás dos reportes separados.

---

## 1 · S-03 — El plugin de gráficos revienta (hacelo PRIMERO)

**Por qué primero:** es sistémico y puede explicar otros dos defectos.

1. Abrí el navegador y pulsá **`F12`** → pestaña **`Consola`**. Dejala abierta.
2. Entrá a **Indicadores → Productos → Ventas Diarias**.
3. Mirá la consola. Debe aparecer, en rojo:
   ```
   Uncaught TypeError: Cannot read properties of undefined (reading 'helpers')
       at cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0
   ```
4. **Repetilo en estas cuatro** para comprobar que **no es de una sola pantalla**:
   - Reportes → **Plan VS Cuota**
   - Reportes → **Activación de Clientes**
   - Reportes → **Rotación de Inventario**
   - Empresa → Variables Globales → **Empresa**

**Qué demuestra:** el plugin `chartjs-plugin-datalabels` **se carga antes que Chart.js** y falla. Es un
problema de **orden de carga**, no de datos ni de una pantalla puntual.

**El dato que más le importa al equipo:** se descarga de **`cdn.jsdelivr.net`**, un servidor **externo**.
Si la red de un cliente bloquea ese dominio —común en intranets—, **la web se queda sin ningún gráfico**.

> 💡 Para probar eso último: en `F12 → Red`, filtrá por `jsdelivr`. Vas a ver la petición saliendo a
> internet. Ese es el punto único de falla.

---

## 2 · D-08 — Ventas Diarias en blanco

1. **Indicadores → Productos → Ventas Diarias**.
2. Verificá los filtros que trae por defecto: Empresa=1 · Vendedor=Todos · Vista=Día · 01/01–29/07/2026.
3. Observá la pantalla.

| Debería | Pasa |
|---|---|
| tabla o gráfico con datos | **nada** |
| o un mensaje "No se encontraron registros" | **tampoco** — ni siquiera eso |
| un botón `Buscar` | **no hay ninguno** |

**Por qué no es "no hay datos":** hay **438 pedidos** en ese rango. Y aunque no los hubiera, una pantalla
vacía debería decirlo, no quedarse muda.

⚠ **Antes de reportarlo aparte:** mirá la consola. Si sale el error de **S-03**, esto es probablemente un
**síntoma** de aquél, no un defecto propio. Vale la pena decirlo así en el reporte.

---

## 3 · D-07 — Gráfico de Cobranzas en cero

1. **Indicadores → Cobros → Cobranzas**.
2. En esa pantalla hay **dos gráficos**. Comparalos:
   - El **mensual (Facturado / Cobrado)** → todo en **0**.
   - El **otro** → sí muestra valores (≈ 1.923,97).

**Lo que lo hace sospechoso:** son **dos visualizaciones de la misma pantalla, con los mismos datos
detrás**, y una funciona y la otra no. Si fuera falta de datos, fallarían las dos.

⚠ Igual que el anterior: revisá la consola antes de reportarlo por separado.

---

## 4 · D-04 — Canales de Distribución se contradice a sí mismo

**Ruta:** `/pages/segmentacion` · Menú: **Estructura Comercial → Canales de Distribución**
*(ojo: la pantalla se llama "Canales de Distribución" aunque la ruta diga `segmentacion`)*

1. Entrá y leé el contador **`Cantidad clientes`** → dice **7.007**.
2. Pulsá el botón **`Consultar clientes`** de esa misma pantalla.
3. Contá los clientes que lista → son **5.382**.

**El defecto:** una sola pantalla mostrando **dos números incompatibles** al mismo usuario.

**La explicación —y por qué igual es defecto:** la diferencia es exactamente **1.625**, que son los clientes
**suspendidos** (`in_suspension`). O sea: el contador los incluye y el listado no. Que exista una razón
técnica **no lo justifica** — el usuario ve dos verdades distintas sin ninguna aclaración.

---

## 5 · D-02 — La lista de Documentos incluye los borrados

**Ruta:** `/pages/documentos` · Menú: **Datos Maestros → Documentos de Venta**

1. Filtrá por **rango de fechas 08/07/2026 – 10/07/2026** → `Buscar`. Salen **124 filas**.
2. Buscá con la vista estos **cuatro códigos**. **Los cuatro están marcados como borrados en la base**, y
   los cuatro **aparecen listados**:

| Código | Saldo que muestra |
|---|---:|
| `00026235` | 3.114,26 |
| `P00004562` | 2.564,45 |
| `P00004583` | 2.142,51 |
| `P00004595` | 1.394,34 |

3. Fijate que **no hay ninguna columna de estatus**: se ven idénticos a los vigentes.

**La magnitud:** sin filtros, la pantalla lista **2.783** documentos cuando los vigentes son **735**.
Son **2.048 borrados de más**, que suman **520.891,90 USD de deuda que no existe**.

> 🔎 **Contraste útil para el reporte:** el **Plan de Visitas** (`/pages/itinerario`) **sí oculta**
> correctamente los registros borrados. El backend sabe filtrarlos; simplemente **no lo hace en esta
> consulta**. Eso apunta a un `WHERE` faltante y no a una decisión de diseño.

---

## 6 · D-05 — La columna "Límite crédito" muestra el saldo del documento

**Misma pantalla:** `/pages/documentos`

1. Buscá estas filas y compará la columna **`Límite crédito`** con lo que debería ser:

| Documento | Saldo del doc. | **Límite real del cliente** | La web muestra |
|---|---:|---:|---:|
| `P00004692` | 954,70 | **14.515.000,00** | **954,70** ← el saldo |
| `P00004685` | 334,97 | **10.886.250.000,00** | **334,97** ← el saldo |
| `P00004705` | 85,47 | 500,00 | 85,47 |
| `P00004614` | 803,26 | 600,00 | 803,26 |

**Los dos primeros son los más contundentes:** el límite real es de **millones**, y la columna muestra
**954,70** y **334,97**. Es imposible confundirlo con un redondeo o un formato.

**Se descartó** que fuera el total del documento: en `P00004614` el total es 818,55 y la web muestra 803,26,
que es el **saldo**.

**Impacto:** quien use esa columna para decidir si le da crédito a un cliente **está leyendo otro dato**.

---

## 7 · D-01 — Morosidad muestra cero

**Ruta:** `/pages/protected/indicadores/indicadorMorosos.xhtml` · **Indicadores → Cobros → Morosidad**

1. Entrá con los filtros por defecto (Empresa=1 · Moneda=USD · Tipo documento=1).
2. Mirá los **cinco tramos de mora**: 1–7 · 8–15 · 16–30 · 31–45 · 46–9999.
3. **Todos muestran 0,00.** Los dos gráficos de torta también salen vacíos.
4. Pulsá **`Buscar`** → siguen en 0.

**Lo que debería mostrar:** hay **241.573,94 USD vencidos en 732 documentos de 448 clientes** (contando
solo documentos vigentes). El más antiguo lleva **655 días** de mora.

⚠ **Nota para cuando lo reportes:** si el equipo consulta la base y le da **762.465,84**, es porque esa
cifra **incluye los documentos borrados** (los de D-02). La deuda real es **241.573,94**. Conviene aclararlo
para que no se pierdan discutiendo el número — **el defecto es que muestra 0,00**, no cuál de las dos cifras
es la correcta.

---

## 8 · S-05 — Dos pantallas con el mismo título *(menor)*

1. Abrí **Visitas → Rutero** y mirá el título de la pestaña del navegador: **"Rutero"**.
2. Abrí **Visitas → Mapa de Rutas**: el título es **"Rutero"** también.

Son dos pantallas distintas con el mismo nombre. Además varios títulos no coinciden con el menú:
`Estructura de Empresa` → *"Zonas de venta"* · `Canales de Distribución` → *"Canales de Distribucion"*.

Es cosmético para el usuario, pero **confunde al dar soporte** ("estoy en Rutero" no identifica la pantalla).

---

# Resumen

| # | Qué verificar | Dónde | Tiempo |
|---|---|---|---|
| **S-03** | error en consola, en 5 pantallas | F12 → Consola | 5 min |
| **D-08** | pantalla en blanco y muda | Ventas Diarias | 2 min |
| **D-07** | un gráfico en 0 y el otro no | Cobranzas | 2 min |
| **D-04** | 7.007 vs 5.382 en la misma pantalla | Canales de Distribución | 2 min |
| **D-02** | 4 documentos borrados listados | Documentos | 5 min |
| **D-05** | columna con el saldo en vez del límite | Documentos *(misma visita)* | 3 min |
| **D-01** | cinco tramos en 0,00 | Morosidad | 3 min |
| **S-05** | dos pantallas, mismo título | Rutero / Mapa de Rutas | 1 min |

**≈ 25 minutos** para dejar toda la web verificada a mano.

**Los dos de Documentos (D-02 y D-05) se comprueban en la misma visita**, y S-03 conviene hacerlo con la
consola abierta desde el principio para encadenar D-08 y D-07.

## Lo que NO se puede verificar desde una pantalla

- **S-01** (`NullPointerException` del servidor) — habría que enviar un cobro **sin IGTF** desde el móvil.
  Mejor pasarle el log a desarrollo y que lo reproduzcan en un ambiente controlado.
- **S-02** (reintento sin tope, 26 intentos en 3 min) — vive en la tabla `failed_transactions`, no en
  ninguna vista.
- **D-03** (Facturaciones muestra 0 de 735) — **sí se ve en pantalla**: Transacciones → Facturaciones →
  Tipo = *"Pendientes por cobrar"* → `Buscar` → 0 filas. Lo que no se puede verificar a mano es la
  **causa** (el `id_user` en NULL); eso es para desarrollo.
