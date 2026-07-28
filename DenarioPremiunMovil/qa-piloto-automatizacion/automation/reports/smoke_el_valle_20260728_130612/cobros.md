# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260728_130612_smoke-completo` |
| Módulo | COBROS |
| Cliente | el_valle (EL VALLE / COVADONGA) |
| Servidor | **La Tortuga** (`denariolatortuga.ddns.net:8081/PremiumWS`) · build v1.0 · `window.ng=true` |
| Dispositivo | 14678405BR003855 (Infinix X6728, Android 15) |
| Empresa | PROCESADORA DE ALIMENTOS COVADONGA,C.A |
| Resultado | **MÓDULO NO COMPLETADO — bloqueado por defecto de producto** |

---

## Veredicto

**Ningún cobro se envía.** Tras ~40 min de intentos, **cero** cobros llegaron a la nube.

**Evidencia dura (consulta a la BD, no interpretación):**

```
SELECT id_collection, co_type, nu_amount_total, st_collection, da_collection
FROM collection ORDER BY id_collection DESC;
→ id 2 · co_type 0 · 80,9500 · st 1 · 2026-06-23T18:03:55Z
→ id 1 · co_type 0 · 1238,1200 · st 1 · 2026-06-23T17:39:28Z
```

La tabla `collection` sigue con **las mismas 2 filas del 23/06** que ya existían como baseline al abrir la
corrida. **No hay ningún registro del 28/07.** El módulo no pudo producir evidencia de ningún caso.

**Estado: reportado al equipo de desarrollo por la responsable QA.**

---

## Cronología

| Momento | Hecho |
|---|---|
| 1er intento | La app quedó **colgada en la cámara nativa** al pulsar "TOMAR FOTO" en Adjuntos. Nunca tomó la foto. Hubo que reiniciar a mano; el cobro se perdió. PID del WebView 20475 → 28660 |
| Diagnóstico | Causa raíz: `Capacitor.Plugins.Camera` es un **Proxy** → el mock viejo daba un **falso OK** y el click abría la cámara real. **Corregido** interceptando `Capacitor.nativePromise` (verificado en device: `getPhoto` 7 ms, `checkPermissions` 7 ms, resto de plugins intacto) |
| 2º intento (~40 min) | Con el adjunto ya resuelto, **los cobros siguen sin enviarse**. La app volvió a reiniciarse (PID → 4084) |
| Cierre | 0 filas nuevas en `collection`. Módulo marcado como bloqueado por defecto de producto |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-* (los 34 del alcance) | ⛔ **BLOCKED** | El envío de cobros no persiste: 0 filas nuevas en `collection` tras ~40 min. Bloqueo de producto, **no** limitación de automatización |

> Se marcan **BLOCKED** y no FAIL caso por caso porque el bloqueo es único y aguas arriba: sin envío no hay
> registro que verificar, así que ningún caso llegó a producir veredicto propio. El defecto está reportado
> aparte. Al re-correr el módulo, estos casos vuelven a evaluarse desde cero.

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | ninguno | **0 cobros llegaron a la nube** |

## Verificación BD

- **Nube:** `collection` sin filas nuevas (baseline 2 = final 2). Marca: no aplica — no hay registro que cotejar.
- **Local:** `BD-N/A` — el device **no tiene `sqlite3`**, así que `local-query.js` no corre y no se puede
  determinar si los cobros quedaron en `pending_transactions` o con `st_delivery=3`. Esa mitad del oráculo
  §10 está inoperante en este device.
- ⚠ **Sin la mitad local no se puede distinguir** "el cobro se guardó pero no se envió" de "el cobro nunca se
  guardó". Es el dato que más ayudaría al equipo de desarrollo a ubicar el fallo.

## Impacto en la corrida

- **Depósitos** depende de cobros en efectivo para tener material que depositar → probablemente quede
  degradado (`N/A` por falta de datos, no por VG).
- La **capa web** no tendrá cobros que cotejar: es el módulo con más cálculos (IGTF, retención, conversión,
  pago parcial), así que ese cotejo queda pendiente para cuando el envío funcione.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Mock de cámara en `Capacitor.nativePromise` | **universal** | `Plugins.Camera` es un Proxy: parchearlo da falso OK y cuelga la app en la cámara nativa. Interceptar el bridge. Ver `_comunes.md` `[el_valle-20260728]` |
| `sqlite3` ausente en el device | cliente/build | Inhabilita toda la mitad local del oráculo BD §10 |

## Hallazgos

**S1 — Los cobros no se envían (reportado a desarrollo).** Con adjunto resuelto y comentario obligatorio
cubierto, ningún cobro alcanza la nube. `collection` no registra ni una fila nueva en ~40 min de intentos.
La app además se reinició dos veces durante el módulo (PID 20475 → 28660 → 4084), lo que sugiere que el
fallo puede estar en el POST del cobro y no en la UI. Coincide con un patrón ya visto en otro cliente
(dm-electronica: *"app crashea en POST cobro"*).

### 🔎 Dato adicional para desarrollo — el POST **sí se dispara** y **se reintenta**

Durante el módulo **siguiente** (devoluciones), el hook sobre `Capacitor.nativePromise` capturó
**4 POST repetidos a `collectionservice/collection`** — reintentos automáticos del cobro atascado,
disparados por `AutoSendService` mucho después de cerrar el módulo de cobros.

**Qué acota esto:**

- El cobro **sí quedó guardado en la BD local** y **sí entró en la cola de salida** (`pending_transactions`):
  si no, no habría nada que reintentar.
- La app **sí construye y envía el POST**: el fallo **no** está en la UI ni en el guardado local.
- El registro **nunca aparece en `collection`** en la nube ⇒ el POST **se está rechazando o fallando del
  lado del servidor** (o la respuesta no se procesa y por eso el pendiente nunca se borra y reintenta en bucle).
- Contraste útil: en la **misma sesión y el mismo servidor**, `returnservice/return` (devoluciones) **sí
  persistió a la primera** con sync inmediata (Ref 177). ⇒ **el problema es específico del endpoint de
  cobros**, no de la conectividad ni del dispositivo.

**Sugerencia para el equipo:** revisar la respuesta de `collectionservice/collection` en el log del servidor
para esos 4 intentos — ahí debería estar el error que impide persistir.

*Reporte generado por Claude Code · Orquestador Smoke · 2026-07-28*
