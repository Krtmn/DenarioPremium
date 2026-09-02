# INCIDENCIA · «Banco Emisor» duplicado y «Cuenta» con el nombre del banco

**Detectado:** 2026-09-02 · corrida `4k/req_crud_bancos_20260902`
**Cliente / playa:** GRUPO 4K (`DIESE`) · Isla Coche
**Dónde se ve:** web → Transacciones → Cobros → Consultar → tabla **Tipos de Pago**, cobros con **Pago Móvil**
**Severidad:** baja-media — no afecta importes; confunde la lectura y deja una columna vacía en pantalla

---

## Qué pasa

En un cobro con **Pago Móvil**, la tabla *Tipos de Pago* trae **14 columnas**, y entre ellas
**«Banco Emisor» aparece dos veces**:

| # | Columna | Valor (REF 2680) | |
|---|---|---|---|
| 3 | **Banco Emisor** | *(vacía)* | ❌ |
| 4 | **Cuenta** | `QA NUEVO BANCO` — es el **nombre del banco**, no una cuenta | ❌ |
| 5 | Banco receptor | `BANESCO PANAMA` | ✅ |
| 6 | Numero de Cuenta | `201800391132` | ✅ |
| 7 | **Banco Emisor** *(otra vez)* | `QA NUEVO BANCO` | ✅ |

La segunda «Banco Emisor» es la buena. **La corrección va en la web:** el dato viaja bien
y se guarda bien; lo que está mal es cómo la pantalla lo presenta.

## Por qué la columna «Cuenta» no debería existir

No es que muestre un dato equivocado: muestra **un dato que no existe**. Las tres tablas
dejan clara la separación entre banco y cuenta:

| Tabla | Qué guarda | En 4K |
|---|---|---|
| `bank` — el catálogo del REQ | `co_bank` + `na_bank` (+ empresa, conciliación). **No tiene ninguna columna de cuenta** | 32 filas |
| `bank_account` — cuentas de la **EMPRESA** | Aquí sí vive `nu_account`. Alimenta el **banco RECEPTOR** | 8 filas |
| `client_bank_account` — cuentas del **CLIENTE** | Es la fuente de las columnas 3 y 4 | **0 filas** |

La cuenta `201800391132` que muestra el cobro pertenece a **BANESCO PANAMA** en `bank_account`,
que es el **banco receptor** — ahí la pareja banco + cuenta es correcta y viene de donde debe.

**El banco emisor no tiene contraparte en ninguna tabla de cuentas: es solo un nombre.**
Por eso la columna «Cuenta» junto a él sobra, y la primera «Banco Emisor» duplica una columna
que ya existe más adelante en la misma tabla.

## Qué se recomienda

**En la web, detalle del cobro:** quitar del bloque de Pago Móvil la columna **Cuenta** y la
primera **Banco Emisor**. Debe quedar **una sola** columna *Banco Emisor*: la que ya lee
`nu_collection_payment` y muestra el dato correcto.

> **Dato de contexto para desarrollo, no un pedido de QA:** el banco emisor viaja **repetido**
> en el registro del pago, y una de las dos copias ocupa campos de *cuenta bancaria del cliente*.
> Desde afuera no se puede determinar cuál de las dos fuentes es la canónica ni si esa redundancia
> es intencional — eso se decide mirando el código. Se anota porque explica de dónde salen las
> columnas de más.

## De dónde saca la web esos valores

El registro del pago trae el **banco emisor por partida doble**, y la web lo lee de los dos lados:

| Campo en `collection_payment` | Valor (REF 2680) | Alimenta |
|---|---|---|
| `nu_collection_payment` | `QA NUEVO BANCO` | columna 7 — **la correcta** |
| `co_client_bank_account` | `7777777` — el código del mismo banco | — |
| `nu_client_bank_account` | `QA NUEVO BANCO` | columna 4, rotulada «Cuenta» |
| `na_client_bank_account` | `null` | columna 3 → por eso sale **vacía** |

Los tres últimos son campos de **cuenta bancaria del cliente**: una tabla que en 4K está
vacía y cuya variable, `clientBankAccount`, está en `false`.

## Lo que NO se puede afirmar

En toda la base de 4K hay **solo 4 pagos con `co_payment_method = 'pm'`**, y los cuatro son de
hoy (02/09/2026), creados en esta prueba. **No hay histórico contra el cual comparar**, así que
no se puede decir si esto es nuevo o si siempre fue así — a diferencia de
[`INCIDENCIA-monto-doc-conversion-sin-convertir.md`](INCIDENCIA-monto-doc-conversion-sin-convertir.md),
donde sí hubo antes/después. Se reporta como está: **reproduce hoy, en los dos cobros probados**.

## Alcance de lo probado, y qué falta cubrir cuando llegue el fix

Se probó **solo con Pago Móvil** (`pm`), que fue el único método con banco emisor alcanzable
en 4K. **Hay al menos dos más que también lo tienen** (dato de la QA, 02/09):

| Método | Cómo llegar al Banco Emisor |
|---|---|
| **Pago Móvil** (`pm`) | ya cubierto — es donde se detectó |
| **Cheque** | también tiene Banco Emisor. Cubrirlo tal cual |
| **Transferencia** (`tr`) | el emisor **no se ve por defecto**: poner `clientBankAccount = true` en la empresa, **sincronizar config** y **reabrir el cobro** |

🔴 **El escenario con `clientBankAccount = true` es la prueba de fondo de esta incidencia.**
Con la variable activa, los campos `co_/nu_/na_client_bank_account` pasan a tener un uso
legítimo. Hay que ver si la columna duplicada **desaparece**, **sigue igual** o **empeora**
ahora que esos campos sí traen una cuenta de verdad. En 4K la variable está en `false` y
`client_bank_account` tiene 0 filas, así que **este caso no se probó**.

## Cómo reproducirlo

1. Móvil → Cobros → cliente con documentos → seleccionar factura.
2. Pestaña **Pagos** → Agregar método → **Pago Móvil** → elegir un **Banco Emisor**.
3. Guardar y enviar.
4. Web → Cobros → filtrar por `# Ref` → **Consultar** → desplazar *Tipos de Pago* a la derecha.

## Consulta de verificación (read-only)

```sql
SELECT c.id_collection, c.da_collection::date AS fecha,
       cp.nu_collection_payment      AS banco_emisor_texto,
       cp.co_client_bank_account, cp.nu_client_bank_account, cp.na_client_bank_account
FROM collection_payment cp
JOIN collection c USING (id_collection)
WHERE cp.co_payment_method = 'pm'
ORDER BY c.id_collection DESC;
```

## Evidencia

`automation/reports/4k/req_crud_bancos_20260902/15-web-cobro-2680-columna-duplicada.png`
y `16-web-cobro-2680-banco-emisor.png`, ambas en el informe `INFORME-CRUD-BANCOS.pdf`.
