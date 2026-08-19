# INCIDENCIA — La vista `view_reporte_depositos` está rota: revienta al consultarla

| | |
|---|---|
| **Detectado en** | Corrida smoke `run_vzla` (CORPORACION FERRE 19) · playa **La Tortuga** · 2026-08-19 |
| **Versión** | la 21 |
| **Severidad propuesta** | 🟠 **Media-alta** — cualquier consumidor de la vista falla; el dato de origen está bien |
| **Capa** | Base de datos + configuración del tenant (no es la app móvil) |
| **Reproduce hoy** | ✅ Sí, de forma determinista |

---

## Síntoma

```sql
SELECT * FROM view_reporte_depositos;
-- ERROR: more than one row returned by a subquery used as an expression
```

`count(*)` sí funciona (devuelve **6**) y casi todas las columnas se leen bien. **Falla una columna concreta:
`moneda_conversion_cobro`** (y por simetría `moneda_conversion`, que usa el mismo patrón).

Aislamiento por columna:

| Columna | Estado |
|---|---|
| `id_cobro`, `fecha_cobro`, `nombre_cliente`, `codigo_metodo`, `nombre_metodo`, `numero_documento`, `monto_cobrado`, `moneda_cobro`, `conversion_monto_cobrado` | ✅ ok |
| **`moneda_conversion_cobro`** | 🔴 **ROTA** |

---

## Causa raíz — está en los DATOS, no en el SQL de la app

La vista resuelve la moneda de conversión con **subconsultas escalares** que asumen que hay **exactamente una**
fila por empresa:

```sql
CASE
  WHEN de.co_currency::text = ((SELECT ce.co_currency
                                  FROM currency_enterprise ce
                                 WHERE ce.local_currency = true
                                   AND ce.id_enterprise = de.id_enterprise))::text
  THEN (SELECT ce.co_currency FROM currency_enterprise ce
         WHERE ce.hard_currency = true AND ce.id_enterprise = de.id_enterprise)
  ELSE (SELECT ce.co_currency FROM currency_enterprise ce
         WHERE ce.local_currency = true AND ce.id_enterprise = de.id_enterprise)
END AS moneda_conversion_cobro
```

Y en este tenant **hay DOS monedas marcadas como local**:

```sql
SELECT id_enterprise, co_currency, local_currency, hard_currency FROM currency_enterprise;
```

| id_enterprise | co_currency | local_currency | hard_currency |
|---|---|---|---|
| 1 | **BS** | **true** | false |
| 1 | **US$** | **true** | false |
| 1 | US$ | false | **true** |

⇒ La subconsulta `WHERE local_currency = true` devuelve **2 filas** y PostgreSQL aborta.
(La de `hard_currency = true` sí devuelve una sola, así que esa mitad no rompe.)

**Nótese además que `US$` aparece dos veces**: una marcada como local y otra como fuerte. Esa duplicidad es la
anomalía de fondo — un tenant mono-moneda no debería tener dos filas `local_currency = true`.

---

## Esperado

Que la vista se pueda consultar. Dos arreglos, complementarios:

1. **Corregir el dato** — `currency_enterprise` debe tener **una sola** fila con `local_currency = true` por
   empresa. Hay que decidir cuál es la local real de CORPORACION FERRE 19 (todo el resto del tenant opera en
   **US$**: los documentos, los cobros y los depósitos están en `US$`) y limpiar la sobrante.
2. **Blindar la vista** — que una subconsulta escalar no dependa de que el dato esté bien. Bastaría
   `... ORDER BY ... LIMIT 1`, o mejor un `LEFT JOIN` a `currency_enterprise` con la condición explícita.
   Hoy un dato mal cargado tumba la vista entera en vez de degradar una columna.

## Alcance a verificar

- 🔴 **Comprobar en los otros tenants** si `currency_enterprise` tiene el mismo duplicado. Si lo tiene, la
  vista está rota también allí. En run_vzla es determinista.
- Comprobar **qué consume esta vista** (reportes, exportaciones, pantallas). Todo lo que la use falla igual.

---

## Consultas de verificación

```sql
-- A. Reproducir el fallo
SELECT * FROM view_reporte_depositos;                       -- ERROR
SELECT count(*) FROM view_reporte_depositos;                -- 6 (funciona)
SELECT moneda_conversion_cobro FROM view_reporte_depositos; -- ERROR: la columna culpable

-- B. La causa: mas de una moneda local por empresa
SELECT id_enterprise, count(*) FILTER (WHERE local_currency) AS locales,
                              count(*) FILTER (WHERE hard_currency)  AS fuertes
FROM currency_enterprise
GROUP BY id_enterprise
HAVING count(*) FILTER (WHERE local_currency) > 1;

-- C. Ver la definicion completa
SELECT pg_get_viewdef('view_reporte_depositos'::regclass, true);
```

---

## 🟢 Corrección de un diagnóstico anterior — `deposit_collection_payment` NO es la tabla del vínculo

Durante la corrida se reportó como defecto que **`deposit_collection_payment` estuviera vacía** (0 filas con 4
depósitos). **No lo es.** La propia definición de la vista muestra que el enlace depósito↔cobro se hace por
**`collection.id_deposit`**:

```sql
FROM deposit de
  LEFT JOIN collection co        ON de.id_deposit = co.id_deposit
  LEFT JOIN collection_payment cp ON co.id_collection = cp.id_collection
```

Y ese campo **sí** está poblado: el cobro `32994` tiene `id_deposit = 4`. `deposit_collection_payment` no
participa en este flujo y aparenta ser una tabla vestigial. **Retirar ese punto de la lista de defectos.**

---

*Detectado durante la corrida `smoke_run_vzla_20260818_152824` · Claude Code · 2026-08-19*
