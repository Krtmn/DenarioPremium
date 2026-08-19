# Medición — lentitud de la primera sincronización

**Cliente:** insumar (INSUMAR DISTRIBUIDOR) · **BD:** `insumar_P1`
**Fecha:** 2026-08-13 · **Usuario:** r003 · **Device:** Infinix X6728 · Android 15 · **WiFi**
**Reporte:** el cliente reporta que la primera sincronización tarda demasiado.

> El servidor contra el que corrió esta medición es el que tenía cargado el APK ese día y se
> descubrió en runtime. Se deja constancia acá —en el reporte— y **no** en el perfil del cliente:
> la playa es del servidor, es rotativa, y guardarla en el YAML solo genera valores stale.

---

## Veredicto

**Sí, la lentitud es real: 69,5 s de primera sincronización.** No es percepción.

Y no es un solo problema: son **tres costos apilados**, ninguno de los cuales es el enlace del
dispositivo. En orden de tamaño:

| # | Causa | Costo | Dónde se arregla |
|---|---|---|---|
| 1 | El servidor genera las páginas ~4-8× más lento de lo que el enlace puede transportar | ~30 s | Backend |
| 2 | La inserción en SQLite **no se solapa** con la descarga | 15,8 s | App |
| 3 | Recorrer 70 tablas de a una, aunque no traigan nada | ~12 s | App / backend |

---

## 1. Números medidos

Instrumentación: se interceptaron `Capacitor.nativePromise` (red) y `cordova.exec` (SQLite) antes
de pulsar ACEPTAR, cronometrando cada llamada por separado.

| Indicador | Primera sync | Sync posterior |
|---|---|---|
| **Total** | **69,5 s** | **12,5 s** |
| Red — tiempo | 51,1 s (74%) | 10,5 s |
| Red — llamadas | 70 | 58 |
| Red — descargado | **10,45 MB** | 0,13 MB |
| SQLite — tiempo | 15,8 s (23%) | 1,2 s |
| SQLite — sentencias | **33.103** | 225 |
| Ocioso | 2,6 s | — |
| **Solapamiento red+SQLite** | **0,1 s** | — |

### Lo que dice cada número

**El solapamiento de 0,1 s sobre 69,5 s** es el hallazgo estructural: el proceso es estrictamente
secuencial. Se confirma en el código (`synchronization.component.ts` ~862): `getSync(tabla)` →
`insertTable(...)` → `syncNextTable(...)`. Se pide una página, se espera, se inserta, se espera, y
recién entonces se pide la siguiente. Mientras la red trabaja, SQLite está parado, y al revés.

**La sync posterior cuesta 12,5 s trayendo 0,13 MB.** Ese es el **piso fijo**: el precio de
preguntarle a ~58 tablas "¿hay algo nuevo?", una por una. No depende del volumen de datos.

---

## 2. ✅ El volumen es SOLO del vendedor logueado — no baja el de todos

Primera pregunta a descartar: ¿esos 10,45 MB son las facturas de r003, o las de **todos** los
vendedores? **Son solo las de r003.** Confirmado por tres vías independientes:

| Vía | Resultado |
|---|---|
| **BD del dispositivo** | `SELECT co_user, count(*) FROM invoices GROUP BY co_user` → **una sola fila: `R003` = 1.150** |
| **Cartera** | 0 facturas de clientes fuera de los 148 asignados; 0 líneas de detalle huérfanas |
| **BD en nube** (`insumar_P1`) | `R003` = **1.150 facturas / 119 clientes** — **coincide exactamente** con el dispositivo |

**Contexto del tenant:** en esa misma ventana hay **21.218 facturas** de todos los vendedores.
El dispositivo bajó **1.150 = 5,4%**. Si no filtrara, serían ~19× más datos y la sincronización
duraría minutos, no 69 s.

> ⚠ Lo que esto **no** descarta: que el servidor *consulte* de más y filtre después en memoria.
> Eso explicaría por qué tarda ~4 s en producir una página de 3.000 filas ya filtradas. Es la
> hipótesis a verificar del lado del backend (ver §4.2), pero **lo que viaja al dispositivo es
> correcto**.

---

## 3. Dónde se va el volumen

De 32.313 filas insertadas, **23.506 (73%) son de facturas**:

| Tabla | Filas |
|---|---|
| `invoice_detail_units` | 11.753 |
| `invoice_details` | 11.753 |
| `product_units` | 1.603 |
| `price_lists` | 1.517 |
| `invoices` | 1.150 |
| `products` | 1.089 |
| `stocks` | 1.082 |

**9 de las 70 llamadas concentran 8,51 MB (81% de los bytes) y 29,7 s (58% del tiempo de red).**
Son las páginas de factura: 3.000 filas por página, 4 páginas por tabla, ~678 KB cada una.

⚠ La ventana de facturas **ya es de solo 1 mes** (14-jul a 13-ago, 1.150 facturas). No hay margen
fácil ahí: el volumen viene de la operación real del cliente, no de una configuración excesiva.

---

## 4. La prueba de que el cuello es el servidor, no el enlace

Se descargaron recursos **estáticos del mismo host, mismo WiFi, mismo dispositivo, mismo momento**
—sin consulta de base de datos detrás— y se comparó el rendimiento:

| Origen | Tamaño | Tiempo | Velocidad |
|---|---|---|---|
| `jquery-plugins.js` (estático) | 355 KB | 271 ms | **1.310 KB/s** |
| `jquery-plugins.js` (repetición) | 355 KB | 544 ms | **653 KB/s** |
| `components.css` (estático) | 107 KB | 145 ms | 733 KB/s |
| `theme.css` (estático) | 207 KB | 399 ms | 520 KB/s |
| **`getsync` factura (página)** | **678 KB** | **~4.000 ms** | **~160 KB/s** |

La página de sync se midió **3 veces**: 4.568 / 4.046 / 3.717 ms. Reproducible.

**El enlace sostiene entre 520 y 1.310 KB/s; el endpoint de sync entrega ~160 KB/s.** Entre 4 y 8
veces más lento. Transferir esos 678 KB a la velocidad del enlace tomaría menos de 1 s: toma 4 s.
La diferencia es tiempo del servidor armando la respuesta.

> ⚠ Se verificó que la comparación es válida: **ninguna de las dos respuestas viaja comprimida**
> (`content-encoding` ausente en ambas), así que se comparan bytes crudos contra bytes crudos.

### Costo fijo por llamada

| Prueba | Tiempo |
|---|---|
| Tabla chica (`returnType`) | 186 ms |
| Tabla pesada **sin cambios** | 506 ms |
| Página inexistente | 365 ms |

Entre **0,19 y 0,51 s por llamada** aunque no haya nada que traer. Multiplicado por ~58-70 tablas,
son los ~12 s que cuesta la sync incremental.

---

## 5. Recomendaciones, por relación impacto/esfuerzo

**1. Comprimir las respuestas del servicio de sync (gzip).** Es lo más barato y lo de mayor
impacto. Hoy viajan **10,45 MB de JSON sin comprimir**; JSON de este tipo suele comprimir un
80-90%, así que quedaría en 1-2 MB. Es configuración de servidor, sin tocar la app.

> 🔴 **Y es probablemente la causa de la queja de campo.** Esta medición es sobre **WiFi**. Un
> vendedor sincronizando por datos móviles a ~100 KB/s tardaría del orden de **3-5 minutos** solo
> en transferir esos 10,45 MB. Con compresión bajaría a menos de un minuto. *(Extrapolación, no
> medición: no se probó sobre datos móviles.)*

**2. Revisar la consulta de `invoice_detail` / `invoice_detail_unit` en el backend.** 9 llamadas se
llevan 29,7 s. Son las que muestran la brecha de 4-8× contra el enlace.

**3. Solapar descarga e inserción.** Hoy el solapamiento es 0,1 s de 69,5. Pedir la página
siguiente mientras se inserta la actual recuperaría buena parte de los 15,8 s de SQLite.

**4. Evaluar si las facturas deben bajar en la primera sync.** Alimentan el pedido sugerido y las
devoluciones, no el arranque. Diferirlas a segundo plano dejaría al vendedor operando en ~30 s en
vez de 70. Es decisión de producto, no de QA.

**5. Menos llamadas.** 70 llamadas a ~0,2-0,5 s fijos cada una. Agrupar tablas chicas en una sola
petición recortaría el piso de 12 s de toda sincronización, no solo la primera.

---

## 6. Hallazgos laterales del perfil y la BD

**a) El nombre de la base es `insumar_P1`, no `insumar`.** Con el slug, el cotejo devolvía
*"database does not exist"* y quedaba BD-N/A. Corregido en el perfil (`db_name`).
⚠ **Acción equipo:** el bloque `# Cliente: insumar` de `secrets/qa-db.env` trae un `QA_DB_URL` con
la base vieja, y en `query.js` **el DSN tiene precedencia sobre `db_name`** ⇒ agregar
`QA_DB_NAME=insumar_P1` a ese bloque para que el cotejo funcione sin overrides. (QA no toca secrets.)

**b) El perfil tenía la playa hardcodeada — se eliminó de TODOS los perfiles.** `insumar.yaml`
guardaba un `ws_url` de otra playa, ya stale. Pero el problema no era el valor: **era guardar la
playa**. La playa es propiedad del SERVIDOR y es rotativa; el `_schema.yaml` ya lo prohibía desde
2026-07 y 9 perfiles lo seguían violando. Se limpiaron todos (ver §7 del feedback a desarrollo).
La playa observada, si hace falta, va en el **reporte de la corrida** — como acá: esta corrida
corrió contra el servidor que tenía cargado el APK en ese momento.

## Método (reproducible)

```javascript
// Antes de pulsar ACEPTAR en el login:
//   1. envolver Capacitor.nativePromise  → registra url, ms y bytes de cada respuesta
//   2. envolver cordova.exec             → registra SQLitePlugin: acción, nº de sentencias, ms
//   3. window.__perf.t0 = performance.now()
// El solapamiento se calcula barriendo la línea de tiempo en pasos de 100 ms y
// preguntando en cada paso si había red activa, SQLite activo, ambos o ninguno.
```

Para replicar un `getsync` a mano hace falta la cabecera `Authorization: Bearer <token>`
(`localStorage.token`); sin ella el endpoint devuelve **403**. El cuerpo es
`{ "<tabla>TableLastUpdate": "1970-01-01 00:00:00.000", "page": N }`.
