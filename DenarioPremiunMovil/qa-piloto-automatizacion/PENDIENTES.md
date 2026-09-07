# Pendientes de QA

Lo que quedó abierto, con el detalle necesario para retomarlo sin reconstruir el contexto.
**Actualizar al cerrar cada punto** — un pendiente resuelto que sigue aquí confunde igual que
uno olvidado.

---

## 1. 🔧 Afinar el script de COBROS

`automation/playwright/modules/cobros.js`

- **Fase 2 sin escribir: 13 casos.** Retenciones (`sizeRetention`), anticipo automático en USD,
  pago parcial y tolerancia, multimoneda. Hoy se emiten como `BLOCKED` desde `blockFase2()`.
- 🔴 **Riesgo de doble envío antes de tocar nada:** `clickGuardarEnviar()` (líneas ~387-403)
  apila `pointerdown` + `pointerup` + `inner.click()` **y además** un `mouse.click`. Cuatro
  disparos para un solo botón. Revisar eso **antes** de construir la Fase 2, o se creará el
  doble de registros.
- **No está en `ORDEN_DEFAULT`** de `run.js`: hay que correrlo con `--modulo=cobros`.

## 2. 🔧 Afinar el script de PEDIDOS

`automation/playwright/modules/pedidos.js` — creado el 01/09, aún sin una corrida limpia.

Última corrida (mio_parts): **11 PASS · 8 FAIL**. Lo que quedó por verificar tras los arreglos:

- El parser del Tab Total (se corrigió: capturaba el 0 de «Total Item»).
- La paginación dentro de la categoría (`SKY 132` mostraba 50 de 132).
- La reposición de línea tras `DM-PED-026`, que insistía con el producto del perfil.
- Las etiquetas de los `ion-select` de VG, que salían en blanco.
- 🔴 **`DM-PED-029` es un hallazgo pendiente de confirmar a mano:** con **0 líneas** en el
  carrito, **Guardar sale habilitado** (Enviar no). El guion smoke espera los dos
  deshabilitados. Se repitió en dos corridas.

## 3. 🔧 Revisar el caso de CLIENTES con otro cliente

`piercar` **ya no está en ninguna playa**, así que su caso pendiente no es alcanzable tal cual.

- **`DM-CLT-031`** — botón de la alerta al eliminar un cliente potencial: quedó sin verificar.
- ⇒ **Elegir otro cliente activo** y correr `--modulo=clientes` contra él.

---

## 4. ⏳ Esperando fix · Los 2 defectos devueltos en la tarjeta del REQ de Bancos

Devueltos el **02/09** en la **misma tarjeta** del REQ, con el informe
`automation/reports/4k/req_crud_bancos_20260902/INFORME-CRUD-BANCOS.pdf` adjunto.
Cuando lleguen los fixes hay que **re-verificar los dos** en las 3 capas.

### 4.a «Banco Emisor» duplicado y columna «Cuenta» que no aplica  · WEB

`automation/reports/INCIDENCIA-banco-emisor-columna-duplicada.md`

- La web repite la columna **Banco Emisor** (la primera **vacía**) y agrega una **«Cuenta»**
  con el nombre del banco. Un banco emisor **no tiene cuenta**: `bank` solo guarda
  `co_bank` + `na_bank`.
- Probado **solo con Pago Móvil** (`pm`), único método con emisor que se alcanzó en 4K.

🔴 **Ampliar la cobertura en el ciclo del fix — dato de la QA (02/09):**

| Método | Cómo llegar al Banco Emisor |
|---|---|
| **Pago Móvil** (`pm`) | ya cubierto — es donde se detectó |
| **Cheque** | **también tiene Banco Emisor.** Cubrirlo tal cual |
| **Transferencia** (`tr`) | el emisor **no se ve por defecto**: hay que poner `clientBankAccount = true` en la empresa, **sincronizar config** y **reabrir el cobro** |

⇒ Con `clientBankAccount = true` los campos `co_/nu_/na_client_bank_account` pasan a tener un
uso legítimo. **Ahí está la prueba de fondo:** ver si la columna duplicada desaparece, si sigue
igual, o si empeora ahora que esos campos sí traen una cuenta de verdad. En 4K la variable está
en `false` y `client_bank_account` tiene **0 filas**, así que este escenario **no se probó**.

### 4.b «Monto doc. conversión» sin convertir  · ajeno al REQ

`automation/reports/INCIDENCIA-monto-doc-conversion-sin-convertir.md`

- `nu_amount_doc_conversion` llega repitiendo el monto en divisa. **10 de 10** cobros del
  01–02/09 (refs 2671-2680); el último renglón correcto es del **24/08**.
- Al re-verificar, correr la consulta del `.md` y confirmar que el **primer cobro nuevo** ya
  sale convertido — no basta con mirar uno viejo.

---

## 5. 🔁 Regresión completa de los 6 REQ de 4K

**Guión:** `guiones-regresion/guion-req-4k-seis.md` — tiene TODOS los escenarios,
incluidos los que la vuelta parcial no cubrió. Es el documento a seguir.

**Vuelta parcial (03-04/09):** `automation/reports/4k/req_incidencias_20260903/`
→ REQ **1, 2 y 5 PASS**; **3, 4 y 6 en espera**. Ese informe **no es el de cierre**:
sirve de contexto para no repetir el reconocimiento.

Lo que hace falta para destrabar los tres que faltan:

| REQ | Bloqueo |
|---|---|
| **3** zoom | un producto **con imagen** cargada en 4K |
| **4** moneda | identificar el cliente/empresa con **moneda fuerte y sin conversión** |
| **6** estatus depósitos | desarrollo ajustó la BD tras la medición; **volver a medir de cero** |

🔴 Y dentro de los que dieron PASS quedaron huecos que la regresión debe cerrar:
enviar la visita y cotejarla en la nube/web (REQ 1), **reactivar** la actividad y ver
si sus motivos vuelven (REQ 2), y el comportamiento con `htmlClientDescription=false`
más la sanitización de HTML (REQ 5).

---

## Cerrados recientemente

- ✅ **Fix del despacho consolidado (hidroponias)** — validado el 01-02/09 en las 3 capas.
  25 PASS / 0 FAIL. `automation/reports/hidroponias/fix_despacho_consolidado_20260901/`
- ✅ **REQ del botón Enviar** — convertido en regresión permanente (`req-enviar.js`) en los
  7 módulos transaccionales.
- ✅ **REQ · Catálogo de Bancos — CICLO COMPLETO** (07/09, 4K/Caribe). CRUD certificado, siembra
  automática verificada, y **6 cobros enviados y cotejados en las 3 capas** (Pago Móvil ×2, Cheque,
  Transferencia con cuenta registrada y con cuenta nueva, y un **anticipo**). Montos correctos en los 6.
  `automation/reports/4k/req_crud_bancos_20260907/` — informe de testing + **manual de uso**.
  🔴 **Queda 1 defecto abierto:** en **Cheque** el banco emisor se guarda en el campo del receptor
  (confirmado en 3 cobros, el último con el APK actual). 2 observaciones menores: la columna «Cuenta»
  se dibuja donde no aplica, y el filtro por moneda no alcanza al Banco Emisor.
  **No cubierto:** el caso multi-empresa (4K tiene una sola empresa).
- ✅ **REQ · CRUD de Bancos** — probado el 02/09 en `4k` (Isla Coche), 3 capas. Los 4 criterios
  del CRUD se cumplen; la tarjeta se **devolvió** con 2 defectos → ver punto 4.
  Perfil creado: `automation/clientes/4k.yaml`.
  **Sin cubrir:** el caso **multi-empresa** (4K tiene una sola empresa, `DIESE`) y las
  **cuentas bancarias de cliente** (`clientBankAccount = false`). Para el multi-empresa hace
  falta otro tenant — ver `project_playas_activas_qa`.
- ✅ **Fix · Métodos de pago que no llegaban al detalle del cobro en la WEB** — **no reproduce**
  (02/09, 4K). Verificado en el cobro **2679** (Pago Móvil) y en el **2676**, que trae
  **3 métodos** (efectivo + depósito + transferencia): la web lista los tres.
  ⚠ El cobro **208** de `mio_parts`, que era el caso que la causa de desarrollo no explicaba,
  **no se re-verificó**: quedó en otra playa. Si vuelve a aparecer el síntoma, empezar por ahí.
