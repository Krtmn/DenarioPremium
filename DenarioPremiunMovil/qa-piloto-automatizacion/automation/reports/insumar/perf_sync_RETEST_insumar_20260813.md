# Re-test tras los cambios — primera sincronización

**Cliente:** insumar · **Usuario:** r003 · **Fecha:** 2026-08-13 (tarde) · **WiFi** · Infinix X6728
**Build:** APK reinstalada 14:50 · **Baseline:** `perf_sync_inicial_insumar_20260813.md` (misma mañana)
**Condiciones:** idénticas a la medición base — instalación limpia (localStorage solo con
`connectionType`/`versionApp`/`connected`, sin token) y **el mismo profiler**, sin cambios.

---

## ⚠ Dos escalas de medición — no mezclarlas

El profiler (envuelve 445 llamadas: 375 a SQLite + 70 de red) **añade ~12 s**. Verificado con una
corrida limpia posterior, sin instrumentación, en las mismas condiciones:

| Base de medición | Tiempo |
|---|---|
| Instrumentada, desde click ACEPTAR | 59,4 s |
| **Limpia, desde click ACEPTAR** | **47,7 s** |
| **Limpia, desde que aparece la pantalla de sincronización** | **44,1 s** |
| (login + arranque previo) | 3,7 s |

La cifra de **~45 s** que se observa cronometrando la pantalla de sincronización corresponde a la
tercera fila, y coincide con el video grabado por QA.

🔴 **El "antes" de 69,5 s está en la escala instrumentada.** Comparar 45 s contra 69,5 s mezcla
métodos e infla la mejora a ~24 s. **La comparación válida es instrumentada contra instrumentada:
69,5 → 59,4 = −10 s.** En la escala del video, eso equivale a haber pasado de ~55 s a ~45 s.

---

## Veredicto: sí mejoró — **−10 s (−15%)**, medido en condiciones idénticas

Y la mejora es **real, no variación de red**: está explicada por un cambio concreto y verificado.

| Indicador | Antes | Ahora | Δ |
|---|---|---|---|
| **Primera sincronización** | **69,5 s** | **59,4 s** | **−10,1 s (−15%)** |
| Red — tiempo | 51,1 s | **41,1 s** | **−10,0 s** |
| Red — bytes **por el cable** | ~10,45 MB | **~0,7 MB** | **−94%** |
| Red — bytes descomprimidos | 10,45 MB | 10,45 MB | = |
| Red — llamadas | 70 | 70 | = |
| SQLite — tiempo | 15,8 s | 15,8 s | = |
| SQLite — sentencias | 33.103 | 33.103 | = |
| Solapamiento red ↔ SQLite | 0,1 s | 0,0 s | = |
| Sincronización incremental | 12,5 s | 11,4 s | −1,1 s |

**Lo único que cambió es el peso en el cable.** Mismo volumen de datos, mismas llamadas, mismas
sentencias SQL, mismo comportamiento secuencial.

---

## Qué se implementó: gzip en el servicio de sync ✅

Verificado directamente sobre el endpoint (misma página de `invoiceDetailUnit`, 3.000 filas):

| Momento | `content-encoding` | Tamaño |
|---|---|---|
| **Mañana** (antes del cambio) | ausente | **678 KB** |
| **Tarde** (después del cambio) | **`gzip`** | **43 KB** |

**Ratio ≈ 15,7× (−94%).** Es la sugerencia nº 1 del feedback, y está funcionando.

### La app YA se beneficia — y NO hay que tocarle el código

Punto importante, porque la conclusión ingenua sería la contraria. Medición controlada, 3
repeticiones de la misma página:

| Petición | Promedio | Lo que entrega | `content-encoding` |
|---|---|---|---|
| **Sin `Accept-Encoding`** (lo que hace la app hoy) | **3.230 ms** | objeto JSON válido, **3.000 filas** | ausente |
| Con `Accept-Encoding: gzip` explícito | 2.950 ms | **string de 43 KB con bytes gzip crudos** (`1f 8b 08`), **no parsea** | `gzip` |

Solo **280 ms** de diferencia entre ambas. Si la primera viajara sin comprimir (678 KB) y la
segunda comprimida (43 KB), a la velocidad de enlace medida (627-1.228 KB/s) la brecha debería ser
de 0,6-1 s, no de 0,28 s.

⇒ **El tráfico de la app ya viaja comprimido.** OkHttp añade `Accept-Encoding: gzip` de forma
transparente cuando la app no lo especifica, descomprime la respuesta y elimina el header. Por eso
se ve "sin encoding" y 678 KB: **es el tamaño ya descomprimido**, no lo que cruzó la red.

> 🔴 **NO agregar `Accept-Encoding` en `getHttpOptionsAuthorization()`.** Al ponerlo explícito,
> CapacitorHttp entrega los **bytes comprimidos sin descomprimir** y el JSON no parsea (0 filas).
> **Rompería la sincronización.** El comportamiento correcto es el actual: no tocar el header.

### La aritmética cierra

10,45 MB sin comprimir, a 700-1.200 KB/s, son 9-15 s de transferencia. Comprimidos a ~0,7 MB, esa
transferencia cae a menos de 1 s. **Ahorro esperado: 8-14 s. Ahorro medido: 10,0 s.** Consistente.

---

## Lo que NO cambió

Los otros cuatro puntos del feedback siguen abiertos, y ahora pesan proporcionalmente más:

| Pendiente | Evidencia de que sigue igual |
|---|---|
| **Generación en el servidor** | La página comprimida (43 KB) sigue tardando **~3,0 s**. A velocidad de enlace, 43 KB son ~40-70 ms ⇒ **~2,9 s son puro tiempo de servidor**. Es ahora el mayor costo unitario. |
| **Sin solapar red y SQLite** | Solapamiento **0,0 s** sobre 59,4. Los 15,8 s de SQLite siguen siendo tiempo puro añadido. |
| **70 llamadas de a una** | Mismo número. La incremental sigue costando 11,4 s trayendo 0,16 MB. |
| **Facturas en la primera sync** | Mismas 23.506 filas de factura (73% del total). |

**Composición actual de los 59,4 s:** ~41 s de red (de los cuales la enorme mayoría es el servidor
generando páginas, ya no transferencia) + 15,8 s de SQLite + ~3 s ocioso.

---

## Impacto esperado en campo (lo más relevante)

La queja original venía de campo, y sospechábamos que era por **datos móviles**, no WiFi. Ahí el
cambio pesa mucho más de lo que sugiere el −15% medido sobre WiFi:

| Escenario | Antes | Ahora (estimado) |
|---|---|---|
| Transferencia sobre WiFi | 9-15 s | < 1 s |
| **Transferencia sobre datos móviles (~100 KB/s)** | **~3-5 min** | **~10-20 s** |

*(La fila de datos móviles es extrapolación: no se midió sobre esa red. Si se quiere confirmar,
la prueba es directa.)*

⇒ **Sobre WiFi la mejora se ve modesta porque la transferencia nunca fue el costo dominante ahí.
Sobre datos móviles, que es donde estaba la queja, debería resolverse en buena parte.**

---

## Recomendación

1. **Confirmar con campo** si la lentitud bajó en condiciones reales. Es la validación que falta.
2. **No tocar el manejo de headers de la app.** Ya funciona; añadir `Accept-Encoding` la rompe.
3. El siguiente cuello, ya sin la transferencia de por medio, es **la generación de las páginas de
   factura en el servidor** (~3 s por página, 9 páginas). Es donde conviene mirar ahora.

## Nota de método

Una sola corrida por escenario: los ~10 s podrían llevar algo de variación de red. Pero el
mecanismo está confirmado de forma independiente (gzip medido directamente sobre el endpoint,
3 repeticiones, con y sin header), y la aritmética coincide con lo observado ⇒ la mejora es real.
El enlace se re-midió en ambas sesiones con los mismos recursos estáticos y estaba en el mismo
rango (520-1.310 KB/s en la mañana, 627-1.228 KB/s en la tarde), así que no explica la diferencia.
