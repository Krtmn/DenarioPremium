# Guión de pruebas · REQ «Módulo Web (CRUD) para Gestión del Catálogo de Bancos»

**Creado:** 2026-09-04, tras la corrida que quedó a medias por caída del endpoint de cobros.
**Para qué sirve:** que la próxima vuelta no empiece de cero. Aquí está lo ya certificado, lo que
quedó pendiente, y —sobre todo— **las trampas y los datos que hay que preparar antes de empezar**.

> Corridas previas:
> `automation/reports/4k/req_crud_bancos_20260902/` — primera vuelta, se devolvió 1 defecto
> `automation/reports/4k/req_crud_bancos_20260904/` — segunda vuelta, CRUD certificado, cobros BLOCKED

---

## Estado al 04/09/2026

| Bloque | Estado | Nota |
|---|---|---|
| **A** · CRUD en la web | ✅ **6/6 PASS** | certificado con cotejo en BD |
| **A.bis** · Trigger de siembra | ✅ **5/5 conforme** | se probó en vivo, sin buscarlo |
| **B** · Selectores por método de pago | ✅ **matriz completa** | incluye el hallazgo del filtro por moneda |
| **C/D/E** · Cobros en las 3 capas | 🚫 **BLOCKED** | `POST collection` → HTTP 500 |
| **F** · No-regresión «Nueva Cuenta» | ✅ PASS | |
| Caso **multi-empresa** | 🚫 no cubrible en 4K | tenant de una sola empresa (`DIESE`) |

---

## Antes de empezar: preparar los datos

Sin esto, medio guión no se puede correr. Son 15 minutos y ahorran una tarde.

### 1 · Activar el Banco Emisor en Transferencia

Sin esto **el campo ni se dibuja** (está detrás de un `*ngIf`). Las **dos** tablas, o gana la otra:

```sql
UPDATE public.global_configuration        SET valor='true', co_operation='U', da_update=NOW() WHERE clave='clientBankAccount';
UPDATE public.global_configuration_client SET valor='true', co_operation='U', da_update=NOW() WHERE clave='clientBankAccount';
```

### 2 · Cargar cuentas al cliente de prueba

Transferencia lee `client_bank_account`, que suele estar **vacía**. Con **monedas mezcladas a
propósito**, que es lo que destapa el hallazgo del filtro:

```sql
INSERT INTO public.client_bank_account
  (co_client_bank_account, co_client, id_client, co_bank, id_bank,
   co_type, nu_account, co_currency, id_currency,
   id_enterprise, co_enterprise, co_operation, da_update)
VALUES
  ('QA-CTA-001','C.0010',11,'232',3,'CORRIENTE','01020304050607080910','USD',2,1,'DIESE','I',NOW()),
  ('QA-CTA-002','C.0010',11,'108',4,'AHORRO',   '01080011223344556677','Bs', 1,1,'DIESE','I',NOW()),
  ('QA-CTA-003','C.0010',11,'134',2,'CORRIENTE','01349988776655443322','USD',2,1,'DIESE','I',NOW());
```

⚠ El `id_bank` y el `co_bank` deben existir en `bank`; verificalos antes. Y el `id_client` debe ser
de un cliente **que cargue en el equipo** — que exista en BD no alcanza.

### 3 · Después de tocar configuración

**Cerrar sesión en el móvil, volver a entrar y sincronizar.** La configuración se lee al iniciar
sesión; sin eso el cambio no baja. (Para datos basta el botón «Sincronizar» del home, ~15 s.)

---

## A · El CRUD en la web · Datos Maestros → Bancos

| ID | Escenario | Resultado esperado |
|---|---|---|
| **B-01** | Listar | Columnas Código · Nombre · Estado + acciones Detalle/Editar/Habilitar |
| **B-02** | Guardar con el formulario **vacío** | «Campo obligatorio.» y **no** guarda |
| **B-03** | Crear con datos válidos | Fila nueva · en BD `co_operation='I'` · `id_enterprise` del tenant |
| **B-04** | Editar el nombre | El **código queda bloqueado** (`disabled=true`) · `co_operation` pasa a `U` · **no duplica** |
| **B-05** | Desactivar | Confirmación «¿…en **todas las empresas**?» → `co_operation='D'`, **registro conservado** |
| **B-06** | Reactivar | Vuelve a `U`. ⚠ **No pide confirmación**, a diferencia de desactivar |
| **B-07** | Buscador del listado | Filtra por nombre y por código |

## A.bis · El trigger de siembra `trg_bank_seed_ve`

🔑 **Se dispara solo, al crear cualquier banco.** La primera vez sorprende: la base pasa de 10 a 33
bancos y parece que alguien insertó 22 a mano. **No es un daño.** Reglas en
`req-validados-qa/req-crud-bancos_20260902/Trigger_BANK_CSV.md`.

| ID | Escenario | Resultado esperado |
|---|---|---|
| **B-08** | Crear un banco y contar | Se siembran los venezolanos que falten (hasta 25) |
| **B-09** | Buscar duplicados por código y por nombre | **Ninguno** |
| **B-10** | Los bancos preexistentes | **Intactos**, conservando su `da_update` original — el trigger nunca hace `UPDATE` |
| **B-11** | Segundo INSERT | **0 sembrados extra** |
| **B-12** | Sincronizar el móvil | Los sembrados llegan y aparecen en los selectores |

**Cómo distinguir de un vistazo lo sembrado de lo creado a mano:** las filas sembradas comparten
`da_update` **idéntico al milisegundo** — es una sola sentencia. Un banco creado por una persona
tiene su propia marca de tiempo.

> **Observación abierta:** en la corrida del 04/09 los sembrados quedaron con `da_update` **4 horas
> por delante** del banco creado desde la web — justo el desfase de Venezuela (UTC-4). Puede ser la
> zona horaria del servidor. Importa porque **el móvil sincroniza por `da_update`**.

---

## B · Los selectores por método de pago

🔑 **Cada método lee una fuente DISTINTA, y es intencional** (confirmado con desarrollo el 04/09):

| Método | Banco Emisor sale de | Por qué |
|---|---|---|
| **Pago Móvil** | `listBanks` — el catálogo | no hay cuenta: sería el teléfono |
| **Cheque** | `listBanks` — el catálogo | ídem |
| **Transferencia** | `clientBankAccounts` — cuentas del cliente | una transferencia **sale de una cuenta** y se quiere saber cuál |

| ID | Escenario | Resultado esperado |
|---|---|---|
| **B-13** | Selector en Pago Móvil y Cheque | Todos los bancos activos, **solo el nombre** |
| **B-14** | Selector en Transferencia | Las cuentas del cliente, **banco + nº de cuenta** |
| **B-15** | Buscador del picker | Filtra correctamente |
| **B-16** | 🔴 **Filtro por moneda** | ver abajo |
| **B-17** | Un banco recién creado en la web | Aparece y es seleccionable tras sincronizar |

### 🔴 B-16 · Cómo se prueba el filtro por moneda (y por qué así)

**Con un cobro en Bs y un cliente que tenga cuentas en Bs y en USD**, comparar **en la misma
pantalla**:

- **Banco Receptor** → debe listar **solo** las cuentas de la empresa en Bs.
- **Banco Emisor** → medir si filtra igual.

Medido el 04/09: el **Receptor filtró** (3 de 7, justo las de Bs) y el **Emisor mezcló** USD y Bs.
⇒ **El filtro existe en el producto pero no alcanza a las cuentas del cliente.**

El contraste **dentro de la misma pantalla** es lo que hace sólido el hallazgo: descarta que sea un
problema de configuración o de datos.

### Campos por método (medido 04/09)

| Método | Campos |
|---|---|
| **Cheque** | Banco Emisor · Fecha · Fecha valor · Nro. Cheque · Monto — **sin Banco Receptor** |
| **Pago Móvil** | Nº Teléfono · Tipo de documento · Banco Emisor · Banco Receptor · Nº referencia · Monto · Fecha |
| **Transferencia** | Banco Emisor · Banco Receptor · Nro. Referencia · Monto · Fecha |

---

## C · D · E — Los cobros en las 3 capas  🚫 PENDIENTE

**Esto es lo que quedó sin hacer y hay que retomar.** Cinco envíos:

| ID | Caso |
|---|---|
| **B-18** | Cobro con **Pago Móvil** |
| **B-19** | Cobro con **Cheque** |
| **B-20** | Cobro con **Transferencia** · cuenta existente (`QA-CTA-00x`) |
| **B-21** | Cobro con **Transferencia** · **«Nueva Cuenta»** escrita a mano |
| **B-22** | **ANTICIPO** (`co_type=1`, botón ANTICIPO/PREPAGO) |

Por cada uno, la tabla de evidencia:

| Nro Ref | Tipo | Método | Emisor elegido (móvil) | Nube | Web | Veredicto |
|---|---|---|---|---|---|---|

**Reglas:** el **Nro Ref es obligatorio** — sin él nadie puede auditar el caso. Las tres capas se
llenan **siempre**; si una no se pudo ver, va el motivo, nunca vacía. Una captura por capa y por
cobro. Un método que no se pudo enviar va igual, con **BLOCKED** y su motivo.

### Y revisar los MONTOS, no solo el banco

```
Monto cobrado           == Σ de los pagos
Diferencia cobro        == Total por cobrar − Monto cobrado
Monto / Tasa            == Monto conv.
Base − descuento + IGTF == Total a pagar
```

Más: cliente, vendedor, comentario, facturas pagadas (nº, monto, saldo, diferencia), referencia,
teléfono, tipo de documento y fechas.

⚠ **No reportar como defecto:** la columna «Monto cobrado» del listado muestra **varios importes**
cuando hay varios métodos — es un **desglose**, no un total (`WEB-RUNTIME.md §5.b`).

---

## Hallazgos vivos — verificar si siguen

| # | Hallazgo | Estado al 04/09 |
|---|---|---|
| **H1** | «Banco Emisor» duplicado + «Cuenta» con el nombre del banco | ✅ **corregido** — la tabla bajó de 14 a 13 columnas |
| **H2** | La columna **«Cuenta» se sigue dibujando** en Pago Móvil y Cheque, donde no aplica | 🔴 abierto. Agravante: `na_client_bank_account` está **NULL en las 2.518 filas** de la base, así que **sale vacía siempre** |
| **H3** | En **Cheque**, el banco elegido como emisor se guarda en `na_bank` (el campo del **receptor**) y el del emisor queda vacío | 🔴 abierto — verificado en BD en los cobros 2612 y 2614 |
| **H4** | El APK del 04/09 **dejó de escribir `nu_collection_payment`** en Pago Móvil — el campo que alimenta la única «Banco Emisor» que queda | ⚠ **inferencia**: medido en la capa local, sin render web porque el cobro no llegó. **Confirmarlo es lo primero al retomar** |

---

## 🔴 Trampas — cada una costó horas

1. **El selector de cliente NO abre al clic.** Invocar `#clienteSelectModal.present()` y clickear el
   **`<p>`** del nombre: el centro del ítem cae en la zona de saldos.
2. **`requiredComment=true`** ⇒ las 5 pestañas de Cobros siguen bloqueadas hasta llenar el comentario.
3. **El modal de métodos usa el CHECKBOX de la izquierda (x≈64)**, no el `ion-item`. Y se comporta
   como **selección única**: un método por cada AGREGAR.
4. **Nunca `history.back()` con un modal abierto**: lo deja huérfano, a pantalla completa,
   bloqueando todos los clics. Salir con el CANCELAR del propio modal.
5. **Nunca aceptar alertas a ciegas.** Filtrar por `overlay-hidden`: un `ion-alert` oculto es una
   alerta **ya descartada**. Calcular coordenadas sobre una descartada y pulsar hizo que un agente
   **enviara un cobro sin querer**.
6. **Un cero no es un resultado.** Si una lista da 0 donde deberían ser N, no llegaste a la pantalla.
7. En la web, Desactivar abre un diálogo cuya `ui-dialog-mask` tapa todo: buscar el diálogo **sin**
   filtrar por `offsetParent`.
8. 🔑 **La app postea por `CapacitorHttp`, no por XHR.** Un hook sobre `fetch`/XHR **no ve nada** y un
   fallo de red se lee como «la app no hizo nada». Para ver los POST hay que envolver
   `Capacitor.nativePromise`. Así se descubrió el HTTP 500 que bloqueó esta corrida.
9. **`failed_transactions` puede quedar en 0** aunque el envío falle: no sirve como oráculo.
10. **La BD tiene RLS forzado** en `collection`, `deposit` e `invoice`: sin declarar
    `app.current_scope` devuelven **cero filas sin error**. `automation/db/query.js` ya lo hace.
    **Un GRANT no lo arregla**: el GRANT abre la tabla, RLS filtra las filas.

---

## Limpieza al terminar

| Qué | Acción |
|---|---|
| Bancos `QA …` creados | Dejar **deshabilitados** |
| Cuentas `QA-CTA-*` | Borrar si no se van a reutilizar |
| `clientBankAccount` | Decidir si vuelve a `false` — con `true` aparece «Nueva Cuenta» también en Cheque y Pago Móvil |
| Cobros de prueba | En ambiente de pruebas se pueden dejar |

---

*Basado en las corridas del 02/09 y 04/09 sobre IMPORTADORA 4K.*
