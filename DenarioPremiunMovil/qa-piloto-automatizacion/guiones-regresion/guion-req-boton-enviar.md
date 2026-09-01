# Guion · REQ «Botón Enviar y campos obligatorios»

**Guion transversal**: se corre sobre los **7 módulos transaccionales**, no sobre uno solo.
Nació de la 1.ª vuelta en `mio_parts` (31/08/2026, APK 6.6.21.3 / main).
Informe de referencia: `automation/reports/mio_parts/req_boton_enviar_20260831/req-boton-enviar.md`

---

## El REQ

> 1. Dejar el botón **Enviar HABILITADO al iniciar** la transacción.
> 2. **Validar al pulsar Enviar**: si hay campos con error, **deshabilitar Enviar**, poner los campos
>    obligatorios **en ROJO** y un **mensaje debajo del input**.
> 3. Tras llenar los obligatorios, **volver a validar**: si es correcta, habilitar; si no, **dejar los
>    campos con error**.

## 🔑 Los DOS criterios de aceptación — acordados con QA

**Sólo estas dos cosas cuentan como fallo:**

| # | Criterio |
|---|---|
| **C1** | **No debe dejar enviar** con obligatorios vacíos |
| **C2** | Si no deja enviar, **debe comunicar QUÉ falta** |

⚠ **La FORMA de comunicarlo NO es un fallo.** Rojo, mensaje bajo el input o alerta que nombre el
campo: los tres valen. Es información de cada módulo, no un defecto.

---

## Reglas de medición — ganadas a pulso, respetarlas

### 🔴 R1 · La transacción EMPIEZA al seleccionar el cliente
Medir el formulario en blanco **no vale**: antes de eso el botón está deshabilitado por otro motivo.
*(Error cometido en la 1.ª vuelta y corregido por la QA.)*

### 🔴 R2 · Verificar que el clic LLEGA al botón
Una alerta abierta cubre la pantalla con su fondo: el clic la descarta y **parece** que pulsaste
Enviar sin efecto.
```js
const r = btn.getBoundingClientRect();
const enPunto = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
// debe ser ION-BUTTON.imagenEnviar, no un backdrop
```

### 🔴 R3 · Una pestaña ACTIVA siempre se ve blanca
El rojo (`rgb(230, 12, 12)`) sólo se aprecia en las **inactivas**. Para evaluar la pestaña X hay que
estar situado en OTRA. Y **al pulsar Enviar la app salta sola** a la pestaña del problema.

### 🔴 R4 · Un campo vacío ≠ un campo obligatorio
Si el botón Enviar está habilitado, la app considera opcionales los campos vacíos. **Antes de
declarar un incumplimiento, comprobar que el campo es realmente obligatorio.**

### 🔴 R5 · No basta con buscar `.ion-invalid`
Los módulos marcan de tres formas distintas:

| Mecanismo | Módulos (1.ª vuelta) |
|---|---|
| `.campoObligatorio` — mensaje bajo el input | **Cobros** |
| `.ion-invalid` — campo en rojo, sin mensaje | Clientes · Devoluciones |
| Sólo alerta nombrando el campo | Depósitos · Pedidos · Inventarios · Visitas |

Un guion que mire sólo una de las dos clases **dará falsos negativos**.

---

## Casos por módulo

Aplicar a: **Pedidos · Inventarios · Cobros · Clientes · Devoluciones · Depósitos · Visitas**

| ID | Momento | Qué registrar |
|---|---|---|
| **E1** | Transacción iniciada (cliente elegido) | ¿`imagenEnviar` habilitado? |
| **E2** | Pulsar Enviar con obligatorios vacíos | ¿se deshabilita? · texto literal del aviso · **dónde aparece** (alerta vs bajo el input) · nº de campos marcados |
| **E3** | Llenar TODO y revalidar | ¿se rehabilita? ¿desaparecen las marcas? |
| **E4** | Llenar sólo PARTE | 🔑 ¿los que siguen vacíos **siguen marcados**? |
| **E5** | 🔑 **Bucle iterativo** *(ver abajo)* | ¿queda alguna pestaña roja al final? |

### 🔑 E5 — el caso que caza el defecto de la pestaña roja

**No se reproduce con un solo Enviar→corregir.** Hay que iterar, tal como lo hace un usuario real:

```
Enviar → "falta X" → llenar X
Enviar → "falta Y" → llenar Y
   …repetir hasta que la app deje de quejarse…
→ mirar las pestañas desde OTRA pestaña: ¿alguna sigue roja?
→ entrar en ella y demostrar que no falta nada
→ pulsar Enviar → si llega a "… será enviado", CANCELAR
```

Registrar **vuelta a vuelta**: mensaje de la alerta · pestañas en rojo · estado de Enviar.
Esa traza es lo que muestra el momento en que el rojo deja de corresponderse con un problema real.

---

## Hallazgos de la 1.ª vuelta — comprobar si persisten

| # | Hallazgo | Dónde | Estado |
|---|---|---|---|
| **F1** | **Pestaña roja sin causa** al terminar de corregir. Causa: un resolvedor de «primera pestaña con error» **sin caso "ninguna"** — su último `return` es incondicional | Devoluciones `return-logic.service.ts:454` · Depósitos `deposit.service.ts:400` · Cobros `collection-logic.service.ts:3080` · Inventarios `inventarios-logic.service.ts:356` | 🔴 reportado |
| **F2** | La marca roja **se arrastra** de una transacción descartada a la siguiente, si se abre desde el listado (desde HOME nace limpia) | Devoluciones | 🔴 reportado |
| **F3** | **Devoluciones no comunica qué falta** si la fila del producto está colapsada: la clase `return-send-error-hint` se aplica pero **no pinta** | Devoluciones | 🔴 reportado |

### Observaciones que NO son fallos — no volver a levantarlas

- **Cobros nace deshabilitado**: coherente, falta agregar el método de pago.
- **Clientes no deshabilita el botón** pero tampoco deja enviar ⇒ C1 y C2 se cumplen.
- **Cada módulo comunica a su manera** ⇒ información, no defecto (ver R5).
- **Visitas** aplica la clase correcta pero su SCSS define `--color` sin el `color` plano ⇒ nunca pinta.
  Es la cara opuesta de F3; **por eso Visitas no sufre F1**.

### El patrón CORRECTO, para citarlo en las tarjetas

**Pedidos y Visitas** no fallan porque usan un **predicado de condición** («¿esta pestaña tiene error,
sí o no?») en vez de un resolvedor de «primer error». Esa pregunta sí admite un "no".
⇒ **No hay que inventar la solución: ya existe dentro del producto.**

---

## Trampas del entorno

- 🔴 **Nunca navegar con `location.href`**: recarga la app, dispara una sincronización y deja el home
  sin nombres de módulo.
- 🔴 **Si el móvil se duerme**, todo falla en el primer paso con un error que parece de selector:
  `adb shell dumpsys power | grep mWakefulness`.
- 🔴 **`ion-alert.textContent` devuelve `""`**: leer con `.alert-title` / `.alert-message`.
- 🔴 **`#eventModal.present()` MATA LA APP** (Cobros): click real sobre «Agregar método de pago».
- 🔴 **Visitas**: el aviso «Esta sucursal no tiene coordenadas asignadas» se descarta con **tap FUERA
  del cuadro**, nunca por botón — el único visible es «Agregar» y entra en un flujo que ESCRIBE.
- **Capturas**: `adb exec-out screencap -p > img/x.png` desde Bash (`pg.screenshot()` da timeout).

## Alcance de escritura

⚠ **NO ENVIAR NINGUNA TRANSACCIÓN.** Llegar hasta que Enviar quede habilitado y parar ahí, o pulsarlo
y **CANCELAR** en el diálogo de confirmación. Descartar todos los formularios sin guardar y anotarlo.

---

## Qué depende del cliente

Las validaciones varían con las VG, así que **otro cliente puede exigir campos distintos**:

| VG | Efecto |
|---|---|
| `validateReturn` | TIPO A (cliente habilita) vs TIPO B (la factura habilita) en Devoluciones |
| `requeridedNroFactura` | nro. de factura obligatorio por producto |
| `expirationBatch` | Lote y Fecha obligatorios en Inventarios |
| `requiredCollectionAttachments` | si el cobro se puede enviar sin adjunto |

**Leer el perfil del cliente antes de decidir qué es N/A.** Un N/A por un motivo distinto al que
predicen las VG **es un hallazgo**, no una casilla que tachar.

## Lo que la 1.ª vuelta NO cubrió

- El REQ en la **capa web** (sólo se midió móvil).
- **Otros clientes**: todo en `mio_parts`.
- Comparación con **RUN y EL EDEN**, donde se probó en su momento (ese material no está en el repo).
- Si el texto de los mensajes es **comprensible** para el usuario (se verificó que existe y dónde sale).
