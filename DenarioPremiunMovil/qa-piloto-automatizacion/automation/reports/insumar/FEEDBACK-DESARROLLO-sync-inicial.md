# Feedback a Desarrollo — Lentitud de la primera sincronización

**De:** QA · **Fecha:** 2026-08-13 · **Origen:** reporte de INSUMAR ("la primera sincronización
tarda demasiado") · **Alcance:** el diagnóstico es **de producto**, no de este cliente.

Medición completa y método reproducible: `perf_sync_inicial_insumar_20260813.md` (misma carpeta).

---

## 1. Lo primero: NO es un problema de filtrado de datos

Antes de cualquier otra cosa descartamos la hipótesis más grave —que el dispositivo estuviera
bajando las facturas de todos los vendedores y no solo las del que se loguea—. **No ocurre.**

Con el vendedor `r003`:

| Comprobación | Resultado |
|---|---|
| Vendedores presentes en las facturas del dispositivo | **uno solo: `R003`** |
| Facturas en el dispositivo | **1.150** (119 clientes) |
| Facturas de `R003` en la nube (`insumar_P1`) | **1.150** (119 clientes) — **coincide exacto** |
| Facturas del tenant en la misma ventana | 21.218 |
| Facturas de clientes fuera de la cartera del vendedor | **0** |

**El dispositivo baja el 5,4% del universo: exactamente su parte.** El filtro por vendedor
funciona bien y no hay que tocarlo.

---

## 2. El diagnóstico: son tres costos apilados

Primera sincronización completa: **69,5 segundos** sobre WiFi.

| Componente | Tiempo | % |
|---|---|---|
| Red | 51,1 s | 74% |
| SQLite | 15,8 s | 23% |
| Ocioso | 2,6 s | 4% |
| **Solapamiento red ↔ SQLite** | **0,1 s** | **0,1%** |

Volumen: **10,45 MB** en **70 llamadas**, **33.103 sentencias** SQL, 32.313 filas.

### 2.1 · El servidor tarda mucho más de lo que el enlace justifica

Comparamos, **desde el mismo dispositivo, el mismo WiFi y el mismo host**, la descarga de recursos
estáticos (sin consulta de BD detrás) contra el endpoint de sync:

| Origen | Tamaño | Velocidad |
|---|---|---|
| `jquery-plugins.js` (estático) | 355 KB | **1.310 KB/s** |
| `jquery-plugins.js` (repetición) | 355 KB | 653 KB/s |
| `components.css` (estático) | 107 KB | 733 KB/s |
| **`getsync`, página de factura** | **678 KB** | **~160 KB/s** |

Medido 3 veces sobre la misma página: 4.568 / 4.046 / 3.717 ms. Reproducible.

**El enlace sostiene 520-1.310 KB/s; el endpoint entrega ~160 KB/s.** Esos 678 KB deberían viajar
en menos de 1 s y tardan ~4 s. La diferencia es el servidor armando la respuesta.

> Verificamos que la comparación es limpia: **ninguna de las dos respuestas viaja comprimida**, así
> que se comparan bytes crudos contra bytes crudos.

### 2.2 · La app no solapa descarga con inserción

`synchronization.component.ts` (~862) encadena: `getSync(tabla)` → `insertTable(...)` →
`syncNextTable(...)`. Se pide una página, se espera, se inserta, se espera, y recién entonces se
pide la siguiente. **Medimos 0,1 s de solapamiento sobre 69,5 s**: mientras la red trabaja SQLite
está parado, y al revés. Los 15,8 s de SQLite son tiempo puro añadido.

### 2.3 · Recorrer las tablas de a una tiene un piso fijo

Una sincronización **posterior**, que trae apenas 0,13 MB, igual cuesta **12,5 s**. Ese es el
precio de preguntarle a ~58 tablas "¿hay algo nuevo?" una por una, a 0,19-0,51 s por llamada
aunque la respuesta sea "nada".

| | Primera sync | Sync posterior |
|---|---|---|
| Total | 69,5 s | **12,5 s** |
| Descargado | 10,45 MB | 0,13 MB |
| Llamadas | 70 | 58 |

### 2.4 · Dónde está el volumen

**9 de las 70 llamadas concentran 8,51 MB (81% de los bytes) y 29,7 s (58% del tiempo de red).**
Son las páginas de `invoice_detail` e `invoice_detail_unit`: 3.000 filas por página, 4 páginas
cada tabla, ~678 KB por página. De 32.313 filas insertadas, **23.506 (73%) son de facturas**.

⚠ La ventana de facturas **ya es de 1 mes**. El volumen viene de la operación real del cliente, no
de una configuración exagerada: ahí no hay margen fácil.

---

## 3. Qué sugerimos hacer, en orden de impacto sobre esfuerzo

### 🥇 1. Comprimir las respuestas del servicio de sync (gzip)

Hoy viajan **10,45 MB de JSON sin comprimir**. JSON de este tipo comprime 80-90%: quedaría en
1-2 MB. **Es configuración de servidor y no toca la app.**

> 🔴 **Creemos que es lo que explica la queja de campo.** Nuestra medición fue sobre **WiFi**. Un
> vendedor sincronizando por **datos móviles** a ~100 KB/s tardaría del orden de **3 a 5 minutos**
> solo en transferir esos 10,45 MB. Con compresión bajaría a menos de un minuto.
> *(Es una extrapolación: no medimos sobre datos móviles. Si les sirve, la corremos.)*

### 🥈 2. Revisar la generación de `invoice_detail` / `invoice_detail_unit`

Son las 9 llamadas que se llevan 29,7 s. Tardar ~4 s en producir 3.000 filas **ya filtradas por
vendedor** sugiere revisar:

- ¿Hay índice por `(co_user, da_invoice)` —o el equivalente del filtro— o se está resolviendo con
  un recorrido amplio y filtrando después?
- ¿La paginación usa `OFFSET` sobre el conjunto completo? Encarece cada página sucesiva.
- ¿Cuánto de esos 4 s es consulta y cuánto serialización del JSON? Nosotros solo vemos el total.

### 🥉 3. Solapar descarga e inserción en la app

Pedir la página siguiente **mientras** se inserta la actual. Con el solapamiento actual en 0,1 s,
recuperaría buena parte de los 15,8 s de SQLite sin cambiar nada del backend.

### 4. Evaluar si las facturas deben bajar en la primera sincronización

Alimentan el pedido sugerido y las devoluciones — no el arranque del vendedor. Si se difieren a
segundo plano, el vendedor estaría operando en ~30 s en vez de 70. **Es decisión de producto**, la
dejamos planteada.

### 5. Agrupar tablas chicas en menos llamadas

70 llamadas a 0,2-0,5 s fijos cada una. Agruparlas bajaría el piso de 12 s que hoy paga **toda**
sincronización, no solo la primera. Es lo que más se notaría en el uso diario.

---

## 4. Cómo lo medimos (por si quieren reproducirlo)

Antes de pulsar ACEPTAR en el login, desde CDP:

1. Se envuelve `Capacitor.nativePromise` → registra url, ms y bytes de cada respuesta.
2. Se envuelve `cordova.exec` → registra `SQLitePlugin`: acción, nº de sentencias y ms.
3. `t0 = performance.now()`.

El solapamiento se calcula barriendo la línea de tiempo en pasos de 100 ms y preguntando en cada
paso si había red activa, SQLite activo, ambos o ninguno.

Para replicar un `getsync` a mano hace falta `Authorization: Bearer <token>` (sin ella devuelve
**403**). El cuerpo es `{ "<tabla>TableLastUpdate": "1970-01-01 00:00:00.000", "page": N }`.

---

## 5. Dos pedidos administrativos (no son del producto)

**a) `secrets/qa-db.env`, bloque `# Cliente: insumar`.** La base es **`insumar_P1`**, no `insumar`.
El `QA_DB_URL` de ese bloque trae la base vieja y **tiene precedencia sobre el `db_name` del
perfil**, así que el cotejo queda BD-N/A hasta que se corrija. Basta con agregar
`QA_DB_NAME=insumar_P1` al bloque. (QA no toca secrets.)

**b) Recordatorio sobre la playa.** Varios reportes nuestros venían diciendo *"actualizar el
`ws_url` del YAML"*. **Es el consejo equivocado y lo estamos corrigiendo de nuestro lado:** la
playa es propiedad del SERVIDOR, es rotativa, y no debe guardarse en el perfil del cliente. Se
descubre en runtime. Ya eliminamos el dato de los 9 perfiles que lo arrastraban. Si en algún
reporte futuro nos ven pedir "actualicen el ws_url", ignórenlo.
