# Selectores web — módulo DEPÓSITOS (`/pages/depositos` · `/pages/detalleDeposito`)

> Parte de `web-selectors/` — leer junto con `_comunes.md` (regla de oro de IDs, guarda de tenant,
> filtro Empresa, verificación de combos, reglas de lectura del detalle).
> Mantener bajo ~120 líneas. Todo patrón nuevo confirmado en 1 corrida entra acá con su tag.
>
> Origen: `[run_vzla-20260818]` — playa **La Tortuga**, empresa **CORPORACION FERRE 19, C.A.**, read-only
> (8 casos de filtro: 7 PASS · 1 N/A; población del tenant: **2 depósitos**, ambos de julio).

---

## Filtros del módulo — **es el más pobre de los 7**

```
:idEnterprise  :idSalesmaView  :orderStatus  :n_ref  :dateB_input / :dateF_input  :ajax  :botonLimpiar
```

🔴 **NO tiene `:clientSOM` (Cliente) ni `:idCurrency` (Moneda)** — a diferencia de pedidos/cobros/devoluciones.
Un helper genérico que dé por sentados esos dos combos **rompe acá**.

- ✅ **Tiene filtro `# Ref`** ⇒ vía barata de cotejo (`# Ref = 2` → 1 fila, planilla `1201838918`).
- ⚠ El `value` de **Empresa** acá es **`1`** (`id_enterprise`) ⇒ **anclar por TEXTO** (`_comunes.md`).
- La columna de fecha del filtro es **`deposit.da_deposit`**.
- ✅ `Limpiar` vacía el `# Ref` y **devuelve las fechas al mes en curso**; **no toca los combos**.

## `/pages/detalleDeposito` — anclajes y lectura

| Elemento | ID real | Cómo anclarlo |
|---|---|---|
| Lista | `form:pedidosDT` | ⚠ **id compartido por 5 módulos** ⇒ verificar `location.pathname` primero |
| **Tabla hija (cobros / formas de pago)** | `form:j_idt163` (reconfirmado `[run_vzla-20260818]`) | 🔴 `tablaPorColumnas(['N° Ref cobro','Monto cobrado'])`, **nunca el id** |
| Botón de detalle de la fila | `form:pedidosDT:N:consultar` | 🔴 **anclar al `# Ref`, NUNCA a `N`** |

⚠ **La tabla hija lista las FORMAS DE PAGO del cobro vinculado, repitiendo el mismo `N° Ref cobro` por fila**
⇒ **NO sumar sus filas contra el monto depositado** (`_comunes.md`).
⚠ En este módulo **`Observaciones` SÍ trae `:`** — al revés que en devoluciones, donde es un título de sección
sin `:`. **Manejar las dos formas.**

## 🔴 Los indicadores en `0,00` **NO son un defecto de la web en este tenant**

Reencuadra el defecto conocido *«`/pages/depositos` muestra ambos indicadores en 0,00 con datos»*:

```sql
SELECT id_deposit, nu_amount_doc FROM deposit;      --  los 2 depósitos traen nu_amount_doc = 0
SELECT count(*) FROM deposit_collection_payment;    --  0  → la tabla puente está VACÍA
```

- El vínculo depósito↔cobro existe **solo por `collection.id_deposit`** (cobros `6418 → depósito 1`,
  `30800 → depósito 2`), **no** por la tabla puente.
- ⇒ El `0,00` de la columna `Monto depositado` y del indicador `Monto total en US$` es **fiel a la BD**.
  🔴 **El defecto está aguas arriba** (depósitos guardados con `nu_amount_doc = 0`), **no en el render.**
- ⚠ **Consecuencia para el oráculo:** el `Σ(hijos) == Monto depositado` que documenta `_comunes.md` **no aplica
  cuando `nu_amount_doc = 0`** — verificar el campo en BD **antes** de cantar `WEB-CALC-MISMATCH`
  (cabecera fiel, `266,59 US$` en la tabla hija contra `Monto depositado: 0,00 US$`).

## ⚠ La columna y el campo `Banco` muestran el CÓDIGO, no el nombre

`Banco: 006` contra `bank.na_bank = 'BANCARIBE'` (misma empresa, `co_operation = 'I'`). 🟡 severidad baja
(legibilidad) pero **molesto para quien concilia depósitos**. ⚠ Reserva: solo hay 2 depósitos, ambos de julio
⇒ no hay registro del día con el que exhibirlo. *(El mismo patrón reproduce hoy en la columna `Pagos` de
cobros — ver `cobros.md`.)*

## Enlace cruzado (oráculo gratis)

**Depósito → cobros:** la tabla hija da `N° Ref cobro` ⇒ salto directo al módulo de cobros.
El camino inverso es el filtro **`Depositado = SI`** de `/pages/cobros`, que devuelve exactamente los cobros
con `id_deposit` no nulo (validado 2/2).

⚠ **Precondición del módulo:** depósitos solo aplica si el cliente maneja **EFECTIVO** entre sus métodos de
pago de Cobros — verificarlo antes de marcar casos `N/A`.

## ⛔ Superficie de escritura — prohibida

El agente web es **read-only**. El único control que se toca es **`Consultar`**.

---
*Creado por la consolidación de `[run_vzla-20260818]`.*
