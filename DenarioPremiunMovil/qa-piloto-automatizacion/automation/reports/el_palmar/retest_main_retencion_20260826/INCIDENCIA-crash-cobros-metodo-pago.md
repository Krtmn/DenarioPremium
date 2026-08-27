# INCIDENCIA — La app muere al agregar método de pago en COBROS (build `main`)

| Parámetro | Valor |
|---|---|
| Fecha | 2026-08-26 |
| Build | APK de **main** · `versionApp 1.0` · `db_version 21` · instalado 17:14:55 |
| Tenant donde se observó | EL EDEN IMPORT TCN, C.A. (`EDEN25_A`) · playa CARIBE |
| Severidad | 🔴 **Alta — bloqueante.** Sin método de pago no se puede enviar ningún cobro |
| Replicado a mano por QA | ✅ Sí (Grecia). No es artefacto de automatización |
| Reproducciones | **3/3** (2 por CDP + 1 manual), siempre desde relanzado limpio |
| Evidencia | `crash-evidencia.txt` (extracto de logcat de la réplica manual) |

---

## 1. Qué pasa

En el formulario de COBRO, al **agregar un método de pago** (Tab **Pagos** → *Agregar método de pago* →
marcar **Efectivo** → **Agregar**), la app entra en una **recursión infinita**, se degrada durante varios
minutos y finalmente **el proceso de render del WebView muere con SIGSEGV**: la aplicación se cierra sola.

No hay mensaje de error al usuario. La app simplemente desaparece.

---

## 2. Causa raíz — está identificada, con línea exacta

### 2.a El commit que la introduce

```
faec6736  feat(cobros): se añaden manejadores para volcar inputs pendientes antes de validar el envío
          luis.castillo@kiberno.com · 2026-08-26 14:35:28 -0400
          1 archivo · +36 líneas · src/app/services/collection/collection-logic.service.ts
```

Está en `origin/main`, con **5 commits posteriores** (ninguno lo corrige).

Ese commit añade dos cosas: `registerSendValidationFlushHandler()` y `syncPendingInputsBeforeSendValidation()`,
y —esta es la línea que cierra el ciclo— **inserta la llamada al principio de `collectCollectionSendIssues()`**:

```diff
   public async collectCollectionSendIssues(): Promise<CollectionSendIssue[]> {
+    this.syncPendingInputsBeforeSendValidation();
     const issue = await this.findFirstBlockingSendIssue();
```

### 2.b El ciclo, paso a paso

```
collectCollectionSendIssues()                     collection-logic.service.ts:3045
  └─> syncPendingInputsBeforeSendValidation()     :2734   ← AÑADIDO POR faec6736
        └─> handler registrado por cobro-pagos    cobro-pagos.component.ts:125
              └─> flushPendingPaymentInputsBeforeSend()      :1085
                    └─> setMonto(...)                        :921
                          └─> validatePayment(type, index)
                                └─> validatePaymentMethodsForSend()
                                      └─> collectService.notifyCollectionEdited()
                                            └─> void this.validateToSend()   :546
                                                  └─> evaluateSendReadiness()      :2681
                                                        └─> collectCollectionSendIssues()  ⟲ VUELVE AL INICIO
```

**No hay guarda de reentrada en ninguno de los 8 saltos** (verificado: no existe ningún flag tipo
`isFlushing` / `inSendValidation` en el servicio).

`validatePayment` tiene **dos ramas y las dos cierran el ciclo**, lo que explica los dos síntomas:

| Rama | Camino | Síntoma |
|---|---|---|
| `if (!canRecalculateAmount)` → `validatePaymentMethodsForSend(); return;` | **síncrona** | pila sin cortes ⇒ **`RangeError: Maximum call stack size exceeded`** |
| `calcularMontos(...).then(() => finalizePaymentValidation(...))` | **asíncrona** (promesa) | no desborda la pila, pero **reencola infinitamente** ⇒ bucle degradado |

### 2.c Por qué la app no falla limpio, sino que agoniza

El propio `syncPendingInputsBeforeSendValidation` **se traga el error**:

```ts
for (const handler of this.sendValidationFlushHandlers) {
  try {
    handler();
  } catch (err) {
    console.warn('[CollectionService] syncPendingInputsBeforeSendValidation handler failed', err);
  }
}
```

El `try/catch` convierte un fallo duro en un `console.warn`, así que la app **sigue corriendo rota**: se queda
en la rama asíncrona reencolándose hasta que el renderer se queda sin recursos y el sistema lo mata.

---

## 3. Evidencia del log (réplica manual de QA)

Timeline real, del logcat capturado durante la réplica:

| Hora | Evento |
|---|---|
| 18:09:27.550 | `[onChangeTab] start -> pagos` · `[CobroPagos] constructor start` — entra al Tab Pagos |
| 18:09:45.566 | vuelve a Pagos |
| **18:09:49.140** | 🔴 `[CollectionService] syncPendingInputsBeforeSendValidation handler failed RangeError: Maximum call stack size exceeded` **×7 en 16 ms** |
| 18:08:05 → 18:19:55 | 🔴 **241.864 líneas** de `returnLogicService: onReturnValid` — bucle desbocado durante ~11 min |
| 18:20:10.325 | `E/libsigchain: Setting SIGSEGV to SIG_DFL` |
| 18:20:15.513 | `F/chromium [FATAL] Render process (13285)'s crash wasn't handled by all associated webviews, triggering application crash` |
| 18:20:15.514 | `F/libc: Fatal signal 5 (SIGTRAP)` → tombstone → app cerrada |

Volumen total de consola en la sesión: **242.139 líneas**, de las cuales **241.864 (99,9 %)** son el bucle.

> El `RangeError` aparece **4 segundos después** de entrar al Tab Pagos, y nombra literalmente el método
> que añadió `faec6736`. No hace falta más para atar causa y efecto.

---

## 4. Pasos de reproducción

**Precondición:** EL EDEN, cliente `00069` (AUTOMERCADOS FRESCO MARKET AFN — CLUB DE CAMPO), moneda **US$**.

1. HOME → **Cobros** → **COBRO**
2. Cliente: `00069` → Enter → seleccionar
3. Moneda del cobro: **US$** (nace en BS)
4. Tab **Documentos** → marcar `AJPM50000880`, `AJPM50000265`, `AJPM50001785`
5. Tab **Pagos** → **Agregar método de pago** → marcar **Efectivo** → **Agregar**

**Esperado:** el acordeón de Efectivo aparece con sus campos Nro. Recibo / Monto.
**Obtenido:** 🔴 recursión infinita → la app se cierra sola en pocos minutos, sin aviso.

⚠ Reproducido **3 de 3 veces**, siempre desde app recién relanzada. No deja nada a medio guardar:
`sqlite_sequence` de `collections` / `collection_details` / `collection_payments` quedó en **62 / 55 / 64**
antes y después, y `pending_transactions` en 0.

---

## 5. Impacto

> **COBROS está inutilizable en `main`.** El método de pago es obligatorio para enviar un cobro
> (`hasSendPrerequisites()` exige `hasAddedPaymentMethodForSendUx()` salvo en retención pura `co_type=2`),
> así que **ningún cobro normal puede completarse ni enviarse** con este build.

Consecuencia directa para QA: **el retest de cobros en `main` queda bloqueado**. Se pudieron medir las capas
de **pantalla** (Tab TOTAL) y de **dato a enviar** (llamando la función de la ruta de envío), pero **no se pudo
enviar nada**, así que las capas de **nube** y **web** siguen pendientes. Ver `retest-main-retencion.md` §8.

---

## 6. Sugerencia para desarrollo

El arreglo natural es una **guarda de reentrada** en `syncPendingInputsBeforeSendValidation`:

```ts
private syncingPendingInputs = false;

public syncPendingInputsBeforeSendValidation(): void {
  if (this.syncingPendingInputs) { return; }   // corta el ciclo
  this.syncingPendingInputs = true;
  try {
    // ... cuerpo actual ...
  } finally {
    this.syncingPendingInputs = false;
  }
}
```

Dos observaciones adicionales, por si ayudan al triaje:

1. **El `try/catch` que envuelve los handlers oculta el fallo.** Convirtió un desbordamiento de pila en un
   `console.warn` y dejó la app rota pero viva 11 minutos. Vale la pena que al menos marque un flag de estado
   en vez de solo loguear.
2. **`flushPendingPaymentInputsBeforeSend` llama a `setMonto`, que es un *setter con efectos*** (recalcula
   montos, dispara validación y marca la colección como editada). Un "flush" de inputs pendientes no debería
   pasar por la ruta de edición del usuario; convendría un camino que escriba el valor sin re-disparar
   `notifyCollectionEdited()`. Nótese que `calcularMontos` y la función de la línea 2323 **ya aceptan un
   parámetro `skipValidateToSend`** — probablemente esa sea la vía prevista.

---

## 7. Dato de contexto (no es parte de la incidencia)

El fix del defecto de `Monto Saldo` con retención —el que se estaba reteseando— es el commit
**`5a3cf10b` · *feat(cobros): se implementa la lógica para calcular el saldo restante considerando retenciones
y pagos parciales*** (2026-08-26 16:00:54), que introduce `computeDetailFullExpectedNet` y reescribe
`resolveCollectionDetailRemainingBalance`. **Ese fix funciona** (verificado en pantalla, ver
`retest-main-retencion.md`). La incidencia de este documento es de `faec6736`, **1,5 h anterior** y de un
área distinta (validación de envío), y es lo que impide terminar de verificarlo.
