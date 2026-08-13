# Cobranzas para REGRESIÓN de Conciliación Bancaria — difranca

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `conciliacion_difranca_20260811` |
| Cliente / playa | **difranca** · **EL YAQUE** (`denarioelyaque.ddns.net`) |
| Empresa | **DDHP_A12** — `*DISTRIBUIDORA DIAZ HERNANDEZ *` (id_enterprise 2) |
| Vendedor | `vend206` · coUser 206 · id_user 275 |
| App | `com.kiberno.denarioPremiumPro` v1.0 · db_version 19 · `window.ng=true` |
| Cliente usado | **CAR755 — MULTIDISTRIBUIDORA JAKE, C.A** (id_client 838; 60 docs pendientes, US$ 97.784,48) |
| Moneda de los cobros | **BSD** (default del form) · tasa 752,09 BSD/US$ |
| Baseline nube | `max(id_collection) = 21853` antes de empezar |
| Resultado | **6 cobros creados y ENVIADOS** (`st_delivery=1`, cola vacía) · 9 pagos · 0 pendientes |

**Guarda de tenant verificada antes de tocar la UI**: empresas locales `DDHP_A12` · `DIF_A12` · `DHVITAL01_A` y usuario `vend206` ⇒ es difranca / El Yaque. No hubo login ni cambio de usuario.

---

## 🔴 Tabla de los pagos tal como quedaron en BD nube

Consulta de cotejo (acotada por baseline, no por `current_date`, porque hoy ya había 10 cobros previos del vendedor):

```
node automation/db/query.js difranca "SELECT p.id_collection, p.co_payment_method, p.nu_payment_doc, p.nu_amount_partial, p.da_value::date, p.na_bank FROM collection_payment p JOIN collection c ON c.id_collection=p.id_collection WHERE c.id_collection > 21853 ORDER BY p.id_collection"
```

| # | id_collection | Método | Referencia (`nu_payment_doc`) | Monto (`nu_amount_partial`) | Fecha (`da_value`) | Banco (`na_bank`) | ¿Coincide con lo pedido? |
|---|---|---|---|---:|---|---|---|
| C1 | **21854** | `tr` | `0000000000000029` | 1.000,0000 | **2026-06-30** | BANCO MERCANTIL | ✅ exacto |
| C2 | **21855** | `tr` | `61056592463` | 32.000,0000 | ⚠️ **2026-08-11** | BANESCO | ❌ **fecha de hoy** — ver abajo |
| C2 | **21855** | `tr` | `61073923961` | 1.000,0000 | **2026-04-17** | BANESCO | ✅ exacto |
| C2 | **21855** | `tr` | `61074809996` | 6.000,0000 | **2026-04-17** | BANESCO | ✅ exacto |
| C3 | **21856** | `tr` | `61073794952` | 9.000,0000 | **2026-04-17** | BANESCO | ✅ exacto |
| C4 | **21857** | `tr` | `417037338015` | 102.000,0000 | **2026-06-19** | BANCAMIGA BANCO MICROFINACIERO, C.A. | ✅ exacto |
| C5 | **21858** | `tr` | `985909344` | 71.519,6500 | **2026-06-26** | BANCAMIGA BANCO MICROFINACIERO, C.A. | ✅ exacto |
| C5 | **21858** | `tr` | `986707536` | 77.320,1000 | **2026-06-26** | BANCAMIGA BANCO MICROFINACIERO, C.A. | ✅ exacto |
| **C2bis** | **21859** | `tr` | `61056592463` | 32.000,0000 | **2026-04-15** | BANESCO | ✅ reemisión correcta del pago fallado |

**Referencias: las 8 quedaron idénticas a lo pedido**, incluidos los ceros a la izquierda de `0000000000000029` (16 caracteres, el campo no los normaliza). **Montos: los 8 exactos**, con decimales (71.519,65 / 77.320,10) intactos.

### ⚠️ La única desviación: un pago con fecha de hoy

En el **primer pago de C2** (`61056592463`, 32.000,00) el `ion-datetime` **no llegó a abrirse** y el pago se guardó con la fecha por defecto (hoy, **11/08/2026**) en vez del **15/04/2026**. Es un fallo de automatización, **no de la app** (el campo de fecha sí acepta fechas pasadas: se demostró en los otros 7 pagos).

Como el cobro 21855 ya estaba **Enviado** y un cobro enviado abre en solo lectura (3 tabs, sin Pagos), no se pudo editar. **Se emitió una cobranza correctiva `21859`** con ese mismo pago y la fecha correcta.

⇒ **Para el agente web:** la referencia `61056592463` aparece **DOS veces** en BD:
- `id_collection 21855` con fecha **11/08/2026** ← ignorar, es el registro defectuoso
- `id_collection 21859` con fecha **15/04/2026** ← **este es el que debe cruzar** con el extracto

Tras el fallo se endureció el paso de fecha (3 reintentos + poll del datetime + verificación de ref/monto/fecha **antes** de guardar, abortando si algo no cuadra). Los 5 pagos posteriores fijaron la fecha al primer intento.

---

## 🔴 Bancos: la "trampa del catálogo" NO se materializa así

**El selector se rotula "Banco Receptor" y NO lista el catálogo `banks`: lista las CUENTAS BANCARIAS RECEPTORAS de la empresa** (`bank_accounts` de DDHP_A12), en formato `BANCO - <número de cuenta>`. Son **14 opciones**, todas de DDHP_A12 — no aparecen los bancos duplicados de las otras empresas.

Nombres **exactos** de lo seleccionado en la app:

| Cobranza | Opción elegida (texto literal en la app) | `na_bank` grabado | `co_bank` de la fila | Moneda cuenta |
|---|---|---|---|---|
| C1 | `BANCO MERCANTIL - 01050076191076242995` | `BANCO MERCANTIL` | **`001`** | BSD |
| C2 · C3 · C2bis | `BANESCO - 01340466684661046990` | `BANESCO` | **`0134`** ✅ | BSD |
| C4 · C5 | `BANCAMIGA BANCO MICROFINACIERO, C.A. - 01720651656518049645` | `BANCAMIGA BANCO MICROFINACIERO, C.A.` | **`0117`** | BSD |

**Por qué no se pudo elegir Mercantil `0105` ni Bancamiga `0172` como pedía el guion:** en DDHP_A12 esos `id_bank` existen en el catálogo (`0105` = "Banco Mercantil" id 21; `0172` = "BANCAMIGA" id 34) **pero no tienen ninguna cuenta bancaria asociada**, así que el selector no los ofrece. Las cuentas de Mercantil cuelgan de `co_bank='001'` y las de Bancamiga de `co_bank='0117'`.

**Dato tranquilizador:** los **números de cuenta sí llevan el código real venezolano** — la de Mercantil empieza en `0105…` y la de Bancamiga en `0172…`. Es decir, la cuenta receptora es la correcta aunque el `co_bank` del maestro esté mal normalizado.

⇒ Si la conciliación no cruza, **no se puede achacar a "se eligió el banco duplicado"**: sólo había una cuenta BSD por banco y es la del código real. Lo que sí conviene revisar en la web es **si concilia por `na_bank` / `co_bank` del maestro** (`001` y `0117` no son los códigos oficiales) **o por el número de cuenta** (que sí lo es).

Catálogo completo por si hace falta: Mercantil `001`(BANCO MERCANTIL, DDHP) · `0105`(Banco Mercantil, DDHP — sin cuenta) · `0105`(BANCO MERCANTIL, C.A. …, DIF_A12) · `01051`(DHVITAL01_A). Banesco `0134`(BANESCO, DDHP) · `0134`(BANESCO BANCO UNIVERSAL S.A.C.A, DIF_A12) · `01341`(DHVITAL01_A). Bancamiga `0117`(DDHP y DIF_A12) · `0172`(BANCAMIGA, DDHP — sin cuenta) · `0172`(DHVITAL01_A).

---

## Cómo se armó cada cobranza (para reproducir)

Los montos del extracto **no** igualan el saldo de ninguna factura, y en difranca `tolerancia0=false` ⇒ **el cobro no se envía si no cierra en cero**. Se resolvió con el **toggle "Pago parcial"** del detalle del documento (`enablePartialPayment=true`): se fija "Monto a pagar BSD" = suma de los pagos de esa cobranza ⇒ Diferencia BSD **0,00 en azul** en las 6.

| Cobranza | Documento (factura) | Total del cobro BSD | Pagos |
|---|---|---:|---|
| C1 · 21854 | FACT5000084888 | 1.000,00 | 1 |
| C2 · 21855 | FACT5000084889 | 39.000,00 | 3 |
| C3 · 21856 | FACT5000084890 | 9.000,00 | 1 |
| C4 · 21857 | FACT5000086496 | 102.000,00 | 1 |
| C5 · 21858 | FACT5000086497 | 148.839,75 | 2 |
| C2bis · 21859 | FACT5000085387 | 32.000,00 | 1 |

Comentario de los cobros: `Regresion Conciliacion Bancaria` (`requiredComment=true`).
Adjuntos: **no se pidió ninguno** (`requiredCollectionAttachments=false`), los 6 se enviaron directo. No se usó mock de cámara.

---

## Defectos

**Ninguno nuevo.** Los 2 defectos de presentación del 10/08 en el Tab Total (conversión invertida en cobros USD; diferencia fantasma con IGTF embebido) **no aplican a esta corrida**: todos los cobros son BSD y sin IGTF, así que no se pasó por ese camino — **no reprodujeron ni se descartan**.

La desviación de la fecha del pago de C2 es **de automatización**, no de la app.

---

## Patrones / selectores nuevos

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| **"Banco Receptor" de Transferencia lista CUENTAS, no bancos** | universal (a confirmar) | `ion-item.bank-picker-trigger` → `#bankPickerModal` con opciones `BANCO - <nu_account>` tomadas de `bank_accounts` de la empresa del cobro. Un banco del catálogo **sin cuenta asociada no es elegible** ⇒ antes de exigir un `co_bank` concreto, comprobar en `bank_accounts` que tenga cuenta. |
| **Acordeón de Transferencia: campos y orden** | cliente difranca | `ion-accordion[value="transferenciaN"]` → `ion-item.bank-picker-trigger` (banco) · `ion-input[0]`=Nro. Referencia · `ion-input[1]`=Monto · `ion-button.letrasFechasButton`=Fecha. Seleccionar por **propiedad** `a.value`, no por atributo (`ion-accordion[value=…]` no matchea). |
| **Varios pagos del mismo método**: repetir "Agregar método de pago" | cliente difranca | Cada pasada por `#eventModal` + AGREGAR crea un acordeón nuevo (`transferencia0/1/2`) aunque el checkbox ya esté marcado. No hay botón "+" dentro del acordeón. |
| 🔴 **La fecha del pago (`da_value`) SÍ admite fechas pasadas** | cliente difranca | `ion-datetime` con `min=2026-02-12` / `max=hoy`. `dt.value=ISO` + `ionChange` + `dt.confirm(val)` basta (**no hay botón Aceptar**: `okc=null`). ⚠ **Si el datetime no alcanza a abrir, el pago se guarda con la fecha de HOY en silencio** ⇒ poll del `ion-datetime` visible + verificar el rótulo `d/m/yyyy` **antes** de Guardar. |
| 🔴 **`#eventModal` y `#clienteSelectModal` se MULTIPLICAN en el DOM** | universal | Tras varios cobros hay 3 `#eventModal` y N `#clienteSelectModal`. `document.querySelector('#…')` devuelve el **residual oculto** y revienta o no hace nada. Regla: `present()` sobre el **último**, y operar siempre sobre `ion-modal` visible y sin `.overlay-hidden`. |
| 🔴 **Un form de cobro REUTILIZADO no acepta la selección de cliente** | cliente difranca | Tras Guardar/Enviar, `nuevoCobro(0)` programático no re-renderiza; y si se reusa el form abierto, el click en el `<p>` del cliente no prende (cae en el `reset()` interno) y `#clienteSelect` queda vacío. **Reset fiable: backs reales hasta `app-home` → tile Cobros → click real (Pointer down/up + shadow) en el botón COBRO.** Con estado fresco el click en el `<p>` funciona siempre (6/6). |
| **Cerrar el alert "Cobro nro. X enviado exitosamente" antes del cobro siguiente** | universal (reconfirma `[ins-2622]`) | Si queda abierto se come los clicks del form siguiente (se manifestó como "el cliente no queda fijado"). Drenar todos los alerts al inicio de cada cobranza. |
| **Tab Documentos renderiza ~30 filas de 60** | cliente difranca | La lista no pagina sola; documentos fuera de esas 30 (p.ej. FACT5000091481) **no son alcanzables** por texto. Elegir entre los renderizados o paginar antes de darlos por inexistentes. |
| **Pago parcial para cuadrar un monto arbitrario** | universal | Con `tolerancia0=false` el cobro no se envía si no cierra en cero. Toggle "Pago parcial" del detalle → input **"Monto a pagar BSD"** (último `ion-input` editable del modal) = suma de los pagos ⇒ Diferencia 0,00 azul. Montos por **dígitos de centavos sin coma** (39.000,00 → `3900000`). |
| **Métodos de pago de difranca** | cliente difranca | `#eventModal` ofrece **solo Depósito y Transferencia** ⇒ confirma `colletionPayment=false-false-true-true-false-false`; **Pago Móvil no existe** en la UI. |
| **Moneda del cobro llega en BSD por defecto** | cliente difranca | 2.º `ion-select` de `app-cobro-general`: `BSD` (default) / `US$`; 3.º = tasa read-only `752,09 BSD`. Los documentos US$ se listan igual y la app convierte. |
