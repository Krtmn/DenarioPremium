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

## 4. ⏳ Pendiente · «Monto doc. conversión» sin convertir

`automation/reports/INCIDENCIA-monto-doc-conversion-sin-convertir.md`

`nu_amount_doc_conversion` llega repitiendo el monto en divisa en vez de convertirlo, mientras
`nu_balance_doc_conversion` del mismo renglón **sí** está convertido. Afectaba a **10 de 10** cobros
del 01–02/09; el último renglón correcto era del 24/08. No toca los importes cobrados, pero confunde
la lectura y cualquier reporte que sume esa columna.

**Sigue sin verificar si se corrigió.** Al retomar, correr la consulta del `.md` sobre un cobro
**nuevo** — no basta mirar uno viejo.

> El otro defecto que se devolvió el 02/09 —«Banco Emisor» duplicado y la columna «Cuenta» con el
> nombre del banco— **se resolvió**: verificado el 07/09, la tabla bajó de 14 a 13 columnas y
> «Cuenta» ya no muestra el nombre. De aquello solo queda que la columna se dibuja en Pago Móvil y
> Cheque donde no aplica (cosmético, severidad baja).

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

## 6. 🧪 Incorporar el REQ de Bancos a la regresión — MÓVIL y WEB

El REQ quedó **cerrado como completado** (07/09), pero su validación **no está en los scripts**:
hoy se prueba a mano cada vez. Hay que agregarla para que cada corrida haga regresión sola, igual
que se hizo con el REQ del botón Enviar (`automation/playwright/req-enviar.js`).

**Insumo listo:** `guiones-regresion/guion-req-crud-bancos.md` — tiene los casos, los datos a
preparar y las trampas. Y `automation/reports/4k/req_crud_bancos_20260907/` los valores esperados.

### 6.a · Capa WEB — el CRUD  (`automation/web/modules/`)

| Caso | Qué verifica |
|---|---|
| Listado con columnas Código · Nombre · Estado | la pantalla existe y responde |
| Guardar en blanco → «Campo obligatorio.» | la validación sigue viva |
| Crear → aparece en la lista y en BD con la empresa correcta | el alta |
| Editar → el **código queda bloqueado**, el nombre cambia sin duplicar | la edición |
| Desactivar → confirmación + **borrado lógico** (el registro se conserva) | el borrado lógico |
| Reactivar → vuelve a estar disponible | el toggle completo |
| **Siembra automática:** tras crear, no hay duplicados ni se pisan los preexistentes | el trigger |

### 6.b · Capa MÓVIL — que el catálogo alimente los cobros  (`automation/playwright/modules/cobros.js`)

| Caso | Qué verifica |
|---|---|
| El selector de **Banco Emisor** trae el catálogo en Pago Móvil y Cheque | la fuente correcta |
| En **Transferencia** trae las cuentas del cliente *(solo si `clientBankAccount=true`)* | el caso condicional |
| Un banco creado en la web **aparece tras sincronizar** | la cadena web → móvil |
| Un banco **desactivado desaparece** del selector | el borrado lógico llega al equipo |
| 🔴 **El banco elegido llega a su campo correcto** — ver 6.c | la regresión del defecto |

### 6.c · 🔴 El caso que NO puede faltar

Tras enviar un cobro con **Cheque**, verificar que el banco elegido quede en el campo del **emisor**
y **no** en el del receptor. Es el defecto reportado en
`automation/reports/INCIDENCIA-cheque-banco-emisor-como-receptor.md`, y hoy solo se detecta a mano.

```sql
SELECT co_payment_method, na_bank AS receptor, nu_collection_payment AS emisor
  FROM collection_payment WHERE id_collection = <ref>;
-- Cheque correcto: emisor con el banco, receptor vacío. Hoy ocurre al revés.
```

⚠ **Ojo al construir el caso:** elegir **bancos distintos** para emisor y receptor. Si son el mismo,
un cruce de campos pasa inadvertido — ya ocurrió con el cobro 2619.

---

## Cerrados recientemente

- ✅ **Fix del despacho consolidado (hidroponias)** — validado el 01-02/09 en las 3 capas.
  25 PASS / 0 FAIL. `automation/reports/hidroponias/fix_despacho_consolidado_20260901/`
- ✅ **REQ del botón Enviar** — convertido en regresión permanente (`req-enviar.js`) en los
  7 módulos transaccionales.
- ✅ **REQ · Catálogo de Bancos — COMPLETADO** (07/09, 4K/Caribe, 2.ª vuelta). CRUD certificado,
  siembra automática verificada, y **6 cobros enviados y cotejados en las 3 capas** (Pago Móvil ×2,
  Cheque, Transferencia con cuenta registrada y con cuenta nueva, y un **anticipo**), con montos
  correctos. `automation/reports/4k/req_crud_bancos_20260907/` — informe + **manual de uso**.
  El hallazgo de Cheque **se derivó a tarjeta aparte** (no es de este REQ): la validación en los
  scripts queda como punto 6.
  **No cubierto:** el caso multi-empresa — 4K tiene una sola empresa.
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
