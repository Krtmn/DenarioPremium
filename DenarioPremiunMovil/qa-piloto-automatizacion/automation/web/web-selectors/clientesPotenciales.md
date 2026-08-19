# Selectores web — módulo CLIENTES POTENCIALES (`/pages/clientesPotenciales` · `/pages/detalleClientePotencial`)

> Parte de `web-selectors/` — leer junto con `_comunes.md` (regla de oro de IDs, guarda de tenant,
> filtro Empresa, verificación de combos, reglas de lectura del detalle).
> Mantener bajo ~120 líneas. Todo patrón nuevo confirmado en 1 corrida entra acá con su tag.
>
> Origen: `[run_vzla-20260818]` / `[run_vzla-20260819]` — playa **La Tortuga**, empresa
> **CORPORACION FERRE 19, C.A.**, read-only. Es **el módulo más atípico después de visitas**.

---

## 🔴🔴 NO tiene filtro `# Ref` — hay que llegar por vendedor + fechas

`[id$=":n_ref"]` **no está en el DOM** (reconfirmado en 2 tandas). Sufijos reales:

```
:idEnterprise  :idSalesmaView  :attachStatus  :dateB_input / :dateF_input  :ajax  :botonLimpiar
```

⇒ **Camino de cotejo:** fijar **Vendedor + rango de fechas** y **desambiguar por la columna `# Ref` de la
LISTA**, que sí existe ⇒ el barrido es **exacto, no aproximado**. Con vendedor `470` + el día, la lista
devolvió exactamente los 2 registros del QA.

🔴 **Y `Limpiar` DEJA LAS FECHAS VACÍAS** en este módulo (en los otros 5 las devuelve al mes en curso)
⇒ tras `Limpiar` la lista trae la **población completa**. Para llegar a un registro del día hay que
**ponerlas a mano**:

```js
for (const [,w] of Object.entries(PrimeFaces.widgets)) {
  if (/dateB$/.test(w.id||'')) w.setDate('18/08/2026');
  if (/dateF$/.test(w.id||'')) w.setDate('18/08/2026');
}
```
…y **después** `Buscar`, **nunca en la misma `evaluate` que la lectura** (`_comunes.md`).

## ⚠ El placeholder del combo de adjuntos se llama `Tiene Adjunto` — y engaña

Opciones reales: **`Tiene Adjunto` (placeholder, `value = 0`)** · `SI` · `NO`.
🔴 **El placeholder se llama casi igual que un filtro real:** un `setCombo(…, 'Tiene Adjunto')` **deja el
filtro sin aplicar creyendo que lo aplicó**. Es un **tercer** juego de literales, distinto del `SI`/`NO` del
resto y del `Tiene Adjuntos`/`No Tiene Adjuntos` de visitas.

## ⚠ Los combos de este módulo fueron los que probaron que SOBREVIVEN a `browser_navigate`

Entrada fresca al módulo y el `<select>` **Vendedor** seguía en `470` de una tanda anterior, mientras el
`# Ref` llegaba vacío. **Costó un falso «la web pierde 6 clientes potenciales»** (con el combo en su
placeholder: 6 = 6 ✅). ⇒ **leer el estado real de cada combo antes de medir**, uno por `evaluate`
(dictamen completo en `_comunes.md`).

## Anclajes y llaves del detalle

| Elemento | ID real | Cómo anclarlo |
|---|---|---|
| Lista | `form:pedidosDT` | ⚠ **id compartido por 5 módulos** ⇒ verificar `location.pathname` primero |
| Botón de detalle de la fila | `form:pedidosDT:N:consultar` | 🔴 **anclar al `# Ref`, NUNCA a `N`** |
| Visor de adjuntos | `form:j_idt179` | 🔴 anclar el `.ui-dialog` **por su TÍTULO** `/adjunto/i` |

🔴 **El detalle NO muestra `No. de Ref.`: su ÚNICA llave es el epoch `Código:`** (= `potential_client.co_client`).
Es limitación conocida del módulo, **no defecto**. El `# Ref` solo existe en la LISTA.
⚠ El `value` del `<select>` **Empresa** acá es **`FERRE_N`** (`co_enterprise`), no `1` ⇒ **anclar por TEXTO.**

### 🔑 En BD la PK NO se llama `id_potential_client`: se llama `id_client`

```sql
-- ❌ ERR: column "id_potential_client" does not exist
SELECT * FROM potential_client WHERE co_client = '<epoch>';   -- ✅ y el "# Ref" de la lista es id_client
```

`id_client` **no es un FK al cliente real**: es el `# Ref` de la lista. Coherente con que la carpeta de
adjuntos del módulo se llame `clientes` y con que la URL del recurso use el `# Ref`.

### Campos del detalle validados 13/13 contra `potential_client`

`Código:`=`co_client` · `Fecha de Registro:`=`da_client` (UTC−4) · `Nombre:`=`na_client` ·
`Vendedor:`=`co_user` · `Cédula::`=`nu_rif` · `Comentario:`=`tx_client` · `Web:`=`na_web_site` ·
`Responsable:`=`na_responsible` · `Correo:`=`em_client` · `Teléfono:`=`nu_phone` · `Dirección:`=`tx_address` ·
`Dirección Entrega:`=`tx_address_dispatch` · `Coordenada de transacción`.

⚠ **Guardas del lector** (`_comunes.md`): la etiqueta del RIF es **`Cédula::`** (doble `:` en unos builds, uno
solo en otros ⇒ normalizar con `/:+$/`), y **`Web:` vacío absorbe `Contacto`**, título de la sección siguiente.
⚠ `Vendedor` muestra solo el código (`000208`) — **por diseño** (`WEB-RUNTIME §5.b`), no se reporta.

## 📎 Adjuntos — **la carpeta es `clientes` y el número de la URL es el `# Ref`**

```
{origin}/denario/resources/images/clientes/{#Ref}_{n}.jpeg?pfdrid_c=true
{origin}/denario/resources/files/clientes/{#Ref}_{n}.{pdf|xlsx}      ← documentos, NO en images/
```

- **No** es `clientes_potenciales`, y **no** se usa el epoch `co_client`: la URL lleva el **`id_client`**.
  Este módulo era el último sin muestra posterior al fix del rutero — **queda cerrado, 200 en todos los recursos**.
- 🔴 **`nu_attachments` acá SÍ incluye la firma** (ref 193: `4 = 2 img + 1 file + 1 firma`), a diferencia de los
  otros 4 módulos ⇒ **el oráculo sigue siendo `transaction_image ∪ transaction_files`**, nunca el contador.

## ⛔ Superficie de escritura — prohibida

El agente web es **read-only**. El único control que se toca es **`Consultar`**.

---
*Creado por la consolidación de `[run_vzla-20260818]`.*
