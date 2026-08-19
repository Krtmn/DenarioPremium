# Verificación puntual — Indicadores "Monto total en BS / USD" con filtro por día

| Parámetro | Valor |
|---|---|
| **Fecha** | 2026-08-17 |
| **Pedido por** | Responsable QA |
| **Pregunta** | *"Si selecciono un día específico en la búsqueda, ¿los indicadores Monto Total en BS y Monto Total en $ traen el monto correcto de esa consulta?"* |
| **Alcance** | **2 clientes en 2 playas**: `grupo_fiel` (El Yaque) y `kron` (Isla Coche) |
| **Modo** | 🔴 READ-ONLY — solo `Buscar`, `Limpiar`, paginar y cambiar rows-per-page |
| **Oráculo** | BD nube (`query.js`), tolerancia 0,01 |

---

## RESPUESTA

> ✅ **En `/pages/cobros`, SÍ: los indicadores traen el monto exacto del conjunto filtrado**, en los dos
> clientes y en las dos playas. **8/8 agregados exactos**, diferencia 0,00 en todos.
> 🔴 **Pero NO en `/pages/pedidos` ni en `/pages/depositos`**, donde hay dos indicadores muertos en 0,00.

### Dónde existen estos indicadores (rótulos literales)

| Módulo | Rótulos | Veredicto |
|---|---|---|
| `/pages/cobros` | `Monto total en BS:` · `Monto total en USD:` | ✅ correctos |
| `/pages/depositos` | `Monto total en BS:` · `Monto total en USD:` | 🔴 **ambos 0,00 con datos** |
| `/pages/pedidos` | `Monto Total:` (sin moneda) + `Monto total en USD:` | 🔴 **el USD siempre 0,00** |
| `/pages/devoluciones` · `/pages/inventarios` | no existen | — |

⚠ El rótulo real es **`Monto total en USD`**, no "en $".

---

## Cómo están construidos: hipótesis **(b) CONVERTIDO, registro por registro**

Cada indicador incluye **todos** los registros del conjunto filtrado, llevando cada uno a esa moneda **con su
propia tasa** (`nu_value_local`). **No** es una vista segregada por moneda.

**grupo_fiel · 17/08/2026** (día mixto: 8 registros BS + 2 USD)

```
BD:  BS  8 reg = 440.782,06   (conversion 583,06 USD)
     USD 2 reg =     200,00   (conversion 154.214,00 BS)

Indicador BS  = 440.782,06 + 154.214,00 = 594.996,06   -> web 594.996,06   OK
Indicador USD =     583,06 +     200,00 =     783,06   -> web     783,06   OK

Hipotesis (a) SEGREGADA habria dado 440.782,06 / 200,00  -> DESCARTADA
```

**kron · 19/06/2026** (día mixto: 5 registros BS + 1 USD)

```
BD:  BS  5 reg = 512.139,11   (conversion 850,26 USD)
     USD 1 reg =      10,00   (conversion 6.023,30 BS)

Indicador BS  = 512.139,11 + 6.023,30 = 518.162,41   -> web 518.162,41   OK
Indicador USD =     850,26 +    10,00 =     860,26   -> web     860,26   OK
```

**Confirmación por el otro lado:** en un día de **una sola moneda**, el indicador de la **otra** moneda trae la
**conversión**, nunca 0 — grupo_fiel 11/08 → `133,54 USD` · kron 05/05 → `621,98 USD`.

---

## Los 4 experimentos × 2 clientes

| Exp | Cliente | Filtro | Ind. BS | Ind. USD | Esperado (b) | Veredicto |
|---|---|---|---|---|---|---|
| E1 mixto | grupo_fiel | 17/08/2026 (10 reg) | 594.996,06 | 783,06 | 594.996,06 / 783,06 | ✅ |
| E1 mixto | kron | 19/06/2026 (6 reg) | 518.162,41 | 860,26 | 518.162,41 / 860,26 | ✅ |
| E2 mono | grupo_fiel | 11/08/2026 (1 BS) | 102.068,29 | 133,54 | idem | ✅ |
| E2 mono | kron | 05/05/2026 (1 BS) | 304.796,75 | 621,98 | idem | ✅ |
| E3 día B | grupo_fiel | 07/08/2026 (3 reg) | 73.473,35 | 97,10 | idem | ✅ **sigue al filtro** |
| E3 Limpiar | grupo_fiel | 01/08–17/08 (14 reg) | 770.537,70 | 1.013,70 | idem | ✅ tercer valor distinto |
| E3 vacío | kron | 01/08–17/08 (0 reg) | 0,00 | 0,00 | conjunto vacío | ✅ |
| E3 ancho | kron | 01/01–17/08 (68 reg) | 43.925.926,20 | 2.182.812,65 | idem | ✅ |
| E4 paginación | kron cobros | 68 reg · pág 1 (50) → pág 2 (18) | sin cambio | sin cambio | no debe cambiar | ✅ |
| E4 rows-per-page | grupo_fiel pedidos | 437 reg · rpp 50 → 200 | sin cambio | — | no debe cambiar | ✅ |

**El indicador nunca se quedó con el total del histórico ni con la página visible.** En el rango ancho de kron
ya cubría los 68 registros teniendo solo 50 pintados.

---

## 🔴 D-01 · `/pages/pedidos` → `Monto total en USD` está SIEMPRE en 0,00

| Caso | Web | Esperado | Diferencia |
|---|---|---|---|
| grupo_fiel · 19/05/2026 — **32 pedidos, TODOS en USD** | **0,00** | **6.051,37** | **−6.051,37** |
| kron · 01/08–17/08 — **511 pedidos, TODOS en USD** | **0,00** | **1.383.717,90** | **−1.383.717,90** |
| grupo_fiel · 01/08–17/08 — 437 pedidos en BS | **0,00** | 52.869,17 (conversión) | −52.869,17 |

**El caso decisivo es el conjunto 100 % USD:** bajo la hipótesis (a) *y* bajo la (b) el indicador debería traer
el total en USD, y trae cero. No es una lectura segregada legítima — **el agregado está muerto**.
En la misma cabecera, `Total Base`, `Total IVA` y `Monto Total` **sí** cuadran contra BD al céntimo ⇒ el defecto
está **aislado en ese campo**.

✅ **Pasa el gate de `WEB-RUNTIME §5.a`:** reproduce en **2 tenants, 2 playas y con datos de hoy** (17/08/2026).
Es defecto de la versión actual, no una anomalía de datos históricos.

⚠ **Observación asociada:** en pedidos **no existe** un `Monto total en BS`. El rótulo `Monto Total` es la suma
cruda de `nu_amount_total` **sin moneda y sin convertir**: en grupo_fiel sale en BS y en kron en USD, bajo la
**misma etiqueta**. No se pudo probar un día mixto en pedidos (ningún tenant tiene uno), pero es un **riesgo
latente de sumar monedas distintas**.

## 🔴 D-02 · `/pages/depositos` → los DOS indicadores en 0,00 con datos en la lista

`grupo_fiel`, depósito **# Ref 3**, creado **hoy 17/08/2026**:
`Monto depositado 8.000,00 BS` · conversión `10,38 USD` · `Total de Resultados: 1`
→ `Monto total en BS: 0,00` · `Monto total en USD: 0,00`. **Diferencia −8.000,00 BS.**
Persiste tras `Buscar` explícito y ampliando el rango a 2025–2026.

⚠ **Muestra honesta: n = 1.** Es el único depósito de grupo_fiel y kron no tiene ninguno ⇒ **no se pudo
replicar en un segundo tenant**. Confirmarlo requiere un depósito más.

---

## Patrones nuevos (insumo para `web-selectors/`)

1. 🔑 **Leer todos los agregados de una lista en una sola llamada:**
   `document.querySelector('.ui-datatable-header').textContent` devuelve **todos** los indicadores y el
   `Total de Resultados` en una cadena. Más barato y robusto que buscar `span.font-bold` uno por uno.
2. ⚠ **`Total por cobrar` de la lista ≠ `nu_amount_total`** cuando hay **pago parcial** (kron ref 347: lista
   486,35 USD, BD 10,00). Sumar esa columna para cotejar el indicador da un **falso mismatch**: el indicador se
   construye sobre `nu_amount_total` / `nu_amount_total_conversion`.
3. ⚠ **`Total IVA` de pedidos NO sale de `order.nu_amount_tax`** sino de `Σ order_detail.nu_amount_tax`
   (886.450,71 exacto vs 27.364,86). Casi se reporta como defecto — no lo es.
4. **El rows-per-page mínimo es 50** ⇒ el experimento de paginación **no es ejecutable** en tenants con menos de
   50 registros; hay que ir al módulo con volumen (pedidos) o ampliar el rango.
5. **isla_coche queda alineada con el_yaque:** misma clave del bloque único `# USUARIO WEB`, mismos sufijos
   (`:ajax`, `:botonLimpiar`, `:dateB_input`, `:idEnterprise_input`), mismos rótulos de indicadores, y `Limpiar`
   **sí** resetea las fechas al mes en curso. **El `value` de Empresa vuelve a cambiar por módulo:** `1` en
   cobros y depósitos, **`KRON_ADM`** en pedidos ⇒ anclar por TEXTO.
6. ⚠ **OneDrive deshidrata carpetas de forma transitoria:** `automation/web/` y `automation/db/query.js` dieron
   "no existe" a mitad de la corrida y volvieron solos al reintentar. **No dar por borrado un archivo sin
   reintentar.**

---

*Generado por Claude Code · verificación puntual fuera de corrida · 2026-08-17*
