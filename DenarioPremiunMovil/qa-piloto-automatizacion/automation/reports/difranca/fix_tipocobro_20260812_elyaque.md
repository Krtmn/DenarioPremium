# Verificación fix filtro `Tipo Cobro` — EL YAQUE / difranca

**RUN_ID** `fix_tipocobro_20260812` · **Playa** El Yaque (`denarioelyaque.ddns.net:8080`) · read-only
**Veredicto: ✅ EL FILTRO `Tipo Cobro` QUEDÓ ARREGLADO.** 6/6 mediciones coinciden con BD al registro.
**Pero apareció un defecto nuevo, no relacionado:** los indicadores *Monto total* omiten la moneda `USD` (§4).

| Parámetro | Valor |
|---|---|
| Empresa principal | **DDHP_A12** = `*DISTRIBUIDORA DIAZ HERNANDEZ *` (`id_enterprise=2`) |
| 2ª empresa | **DIF_A12** = `DIFRANCA C.A` (`id_enterprise=3`) |
| Rango | **01/01/2026 – 11/08/2026** (cerrado en el pasado: no se mueve mientras se mide) |
| Contexto afirmado | host + Empresa + Tipo + fechas leídos **en la misma `evaluate`** que el conteo, en las 9 mediciones |

---

## 1. 🔴 Corrección del oráculo: el filtro de fechas va por `da_collection`, NO por `da_created`

La query prescrita en el encargo usa `da_created` y **da un falso desvío**. La primera medición sin filtro
dio web **5.060** vs BD **5.058** (+2). No era el filtro: los cobros **21863** y **21864** tienen

```
da_created   = 2026-08-12 09:55     (fuera del rango)
da_collection= 2026-08-11 20:36:39  (dentro del rango)
```

y la web los muestra en la columna **`Fecha Cobro` = 11/08/2026 20:36:39**, que es exactamente
`da_collection`. Con la columna corregida el sin-filtro cierra **5.060 = 5.060**.

⇒ **Oráculo correcto** (el que usa este reporte):

```
node automation/db/query.js difranca "SELECT co_type, count(*) FROM collection
 WHERE co_operation<>'D' AND co_enterprise='<EMPRESA>'
   AND da_collection >= '<DESDE>' AND da_collection < '<HASTA>' GROUP BY 1 ORDER BY 1"
```

🔴 **Isla Coche y La Tortuga: usen `da_collection`.** Con `da_created` van a ver diferencias de ±N que
parecen fallo del filtro y no lo son. (Los `timestamp without time zone` salen del driver desplazados
+4 h al serializarse a ISO; el valor crudo almacenado ya es hora local y es el que pinta la web.)

## 2. ✅ Las cinco opciones + el total sin filtro — DDHP_A12

| Opción del desplegable | `co_type` | Web (contados) | Web (pintados) | BD | Veredicto |
|---|---|---:|---:|---:|---|
| *(sin filtro)* | — | **5.060** | 50 (1ª pág.) | **5.060** | ✅ **OK** |
| Cobros | 0 | **5.049** | 50 (1ª pág.) | **5.049** | ✅ **OK** |
| Anticipo/Prepago | 1 | **6** | 6 | **6** | ✅ **OK** |
| Retención | 2 | **2** | 2 | **2** | ✅ **OK** |
| IGTF | 3 | **3** | 3 | **3** | ✅ **OK** |
| Cobro 25% | 4 | **0** | 0 (*"No se encontraron registros."*) | **0** | ✅ **OK** |

**Suma de las cinco = 5.049 + 6 + 2 + 3 + 0 = 5.060 = total sin filtro.** ✅ No se pierde ni se
duplica ningún cobro.

- **El síntoma reportado desapareció.** `Tipo Cobro = Cobros` devuelve **5.049**, no el total (5.060).
  El *falsy zero* ya no ignora la condición: `co_type=0` filtra.
- `Cobro 25%` = 0 es **correcto**: el tipo no existe en el tenant (0 filas en BD en las 4 empresas).
- **`co_type=4` nunca fue ejercitado con datos reales.** Que devuelva 0 prueba que no rompe, no que
  filtre bien. Si se quiere cobertura real hay que crear un cobro 25% en móvil.

### Corroboración en la 2ª empresa (DIF_A12, mismo rango)

| Opción | Web | BD | Veredicto |
|---|---:|---:|---|
| *(sin filtro)* | **363** | **363** | ✅ OK |
| Retención (2) | **2** | **2** | ✅ OK |
| IGTF (3) | **2** | **2** | ✅ OK |

## 3. ✅ Dos observaciones abiertas que quedan CERRADAS

| Observación | Estado |
|---|---|
| **`COB-LISTA-RENDER-VACIO`** (lista que cuenta bien y no pinta filas) | ✅ **NO se reproduce.** El caso exacto que fallaba — `Tipo Cobro = IGTF` — hoy da **contados = pintados** en las dos empresas: DDHP_A12 **3/3** (refs 21846, 21835, 21831) y DIF_A12 **2/2** (refs 21843, 21836). Antes era *2 contados / 0 pintados*. Se midieron ambas cosas por separado en las 9 mediciones y **nunca** divergieron |
| **`COB-TIPO-IGTF-DUPLICADO`** (opción `IGTF` repetida, ambas `value=3`) | ✅ **CORREGIDO.** El `<select>` trae hoy 6 opciones, una por valor: `'' · 0 · 1 · 2 · 3 · 4`, sin repetidos |
| **Empresa `DDH_A12`** (`co_operation='D'`, 62 cobros) | ✅ **NO aparece** en el desplegable. Solo las 3 vivas: `*DISTRIBUIDORA DIAZ HERNANDEZ *`, `DIFRANCA C.A`, `DISTRIBUIDORA DH VITAL, C.A.`. Comportamiento correcto, **no es defecto** |
| **Filtro `Status`** (mismo patrón *falsy zero*, placeholder `value=0`) | ✅ **No empeoró.** Las 9 mediciones corrieron con el placeholder de Status puesto (`value=0`) y **todas** coincidieron con una BD que **no** filtra por status ⇒ el `0` del placeholder no está actuando como filtro. Confirma lo ya anotado en `_comunes.md`. ⚠ No se probaron sus dos opciones reales (`7 Enviado`, `27 Por aprobar`) |

## 4. 🔴 DEFECTO NUEVO — `COB-WEB-TOTALES-IGNORA-USD`

**Los indicadores `Monto total en BSD` y `Monto total en US$` omiten por completo los cobros cuya
moneda es `USD` (`id_currency=3`).** El cobro aparece en la lista pero no suma en ningún total.

### Repro mínimo (2 filas, verificable a mano)

> El Yaque · empresa **DIFRANCA C.A** · `Tipo Cobro = Retención` · 01/01/2026–11/08/2026

| # Ref | Moneda | `nu_amount_final` | conversión |
|---|---|---:|---:|
| 21829 | BSD | 1.500,00 | 1,99 US$ |
| 21826 | **USD** | **900,00** | **676.881,00 BSD** |

- La lista muestra **las 2 filas** (2 contados / 2 pintados).
- Los indicadores dicen **`BSD: 1.500,00`** y **`US$: 1,99`** — solo el cobro en BSD.
- Deberían decir **`BSD: 678.381,00`** y **`US$: 901,99`**.
- El cobro de **900 USD (≈ 676.881 BSD) se evapora de los dos totales.**

Reconfirmado con `Tipo Cobro = IGTF` en la misma empresa: web `BSD 4.000,00 / US$ 5,32` (solo la ref
21843, en BSD); la ref 21836 (5,88 USD = 4.422,29 BSD) no suma. Esperado: `8.422,29 / 11,20`.

### Magnitud en DIF_A12 (rango completo, 363 cobros)

| | Web muestra | Debería mostrar | Falta |
|---|---:|---:|---:|
| Monto total en BSD | 97.536.072,54 | **172.437.375,23** | **74.901.302,69** (−43 %) |
| Monto total en US$ | 180.642,24 | **336.944,43** | **156.302,19** (−46 %) |

**272 de 363 cobros (75 %) no participan de ningún total.** Los indicadores muestran exactamente —al
céntimo— el subtotal de los 91 cobros en BSD, en sus dos expresiones.

### Causa probable

difranca tiene **dos monedas dólar con el mismo rótulo en pantalla**: `US$` (`id_currency=2`) y `USD`
(`id_currency=3`), ambas `na_currency = 'DOLAR AMERICANO (US$)'`. El cálculo **solo reconoce el literal
`US$`**; una fila en `USD` no entra ni como dólar ni como local, y cae fuera de las dos sumas.

⇒ Reparte por empresa: **`DDHP_A12` y `DHVITAL01_A` usan `US$` (sanas)** · **`DIF_A12` usa `USD`
(afectada, 803 cobros en total histórico)**. Por eso pasó inadvertido: la empresa por defecto está sana.
🔴 **Isla Coche y La Tortuga: revisen `SELECT DISTINCT co_currency FROM collection` antes de dar por
buenos los indicadores.** Si aparece `USD`, el defecto está ahí también.

## 5. ✅ Semántica de los indicadores (lo que preguntó QA)

Validado al céntimo en DDHP_A12 sobre **5.060 cobros** y en 4 subconjuntos:

```
Monto total en BSD = Σ(nu_amount_final       de los cobros en BSD)
                   + Σ(nu_amount_final_conversion de los cobros en dólar)
Monto total en US$ = Σ(nu_amount_final_conversion de los cobros en BSD)
                   + Σ(nu_amount_final       de los cobros en dólar)
```

| Medición (DDHP_A12) | Web BSD | Web US$ | BD | |
|---|---:|---:|---|---|
| *(sin filtro)* | 2.134.514.322,98 | 4.373.989,03 | idem | ✅ |
| Anticipo/Prepago | 500,00 | 0,66 | idem | ✅ |
| Retención | 2.211,00 | 3,93 | idem | ✅ |
| IGTF | 40.988,91 | 54,50 | idem | ✅ |
| Cobro 25% | 0,00 | 0,00 | idem | ✅ |

Respuestas puntuales:

1. **¿Respetan el filtro activo?** ✅ **SÍ.** Cambian con `Tipo Cobro` y con `Empresa`, y van a `0,00`
   cuando el filtro no devuelve nada. No suman "todo".
2. **¿Coinciden con BD?** ✅ **Sí en DDHP_A12** (5/5, al céntimo). ❌ **No en DIF_A12** — por §4.
3. **¿El "$" suma las dos monedas dólar?** ❌ **No: solo `US$` (id 2).** `USD` (id 3) **no suma en
   ninguno de los dos indicadores** — ni siquiera como local. Es el defecto de §4.
4. **¿Nativo o convertido?** **Ambos indicadores son el MISMO dinero expresado en dos monedas**, no dos
   subconjuntos. `Monto total en BSD` = todo llevado a BSD; `Monto total en US$` = todo llevado a US$.
   Los rótulos ("*en* BSD" / "*en* US$") lo reflejan bien.
5. **¿Doble conteo?** **No es defecto.** Cada cobro entra en los dos indicadores, pero por diseño: son
   dos vistas del mismo total. Solo sería error sumar BSD + US$ entre sí, cosa que la pantalla no hace
   ni sugiere. ⚠ El rótulo real es **`Monto total en US$:`**, no `Monto total en $`.

## 6. Qué NO se midió (para que lo cierren Isla Coche / La Tortuga)

- **`co_type=4` con datos reales** — en difranca no existe ninguno; solo se probó el caso 0 filas.
- **Empresa `DHVITAL01_A`** — no medida (usa `US$`, se espera sana).
- **DIF_A12 opciones `Cobros`, `Anticipo/Prepago` y `Cobro 25%`** por separado (sí el sin-filtro y las
  otras dos, todas OK).
- **Filtro `Status`** con sus opciones reales (`7 Enviado`, `27 Por aprobar`); solo se verificó que su
  placeholder `0` no filtra de más.
- El **desglose de los indicadores por moneda** no existe en pantalla: no se puede auditar desde la UI
  cuál de las dos monedas dólar entró. Hizo falta BD.

## 7. Protocolo usado (reproducible)

Por medición, **dos llamadas** —nunca poblar + Buscar + leer en la misma `evaluate`—:

1. `evaluate` A: afirma `location.host` → `PrimeFaces.widgets[...:idTipo].selectValue(v)` → espera ajax
   (`jq.active===0` + settle 1,2 s) → **recién ahí** `setDate` de `dateB`/`dateF` (el ajax de los
   `<select>` repuebla las fechas) → click en `[id$=":ajax"]` → espera ajax.
2. `evaluate` B: devuelve en un solo JSON `{host, empresa{v,t}, tipo{v,t}, status, moneda, dateB, dateF,
   contados: paginator.cfg.rowCount, pintados: <tr> del tbody, indicadores}`.
   **Si `host` o cualquier label no es el esperado, la lectura se descarta.**

Widgets y selects resueltos **por sufijo** (`:idTipo`, `:idEnterprise`, `:dateB`, `:dateF`, `:ajax`),
nunca por `j_idt*` — el prefijo de esta tanda fue `form:j_idt116`.

## 8. Nota de infraestructura — por qué esta corrida se hizo en dos tiempos

El primer intento se abortó sin medir: los **3 agentes de playa compartían un único navegador MCP** y
todas las llamadas se enrutan a la pestaña *current*. En ~90 s hubo tres cruces (un click mío cayó en el
login de Isla Coche; dos pestañas mías fueron navegadas a La Tortuga, una de ellas recién creada con
`browser_tabs new`). `WEB-RUNTIME.md §9.1` ya lo advierte: *"los agentes web NO se paralelizan entre sí"*.
Se serializó y **esta corrida se hizo con el navegador en exclusiva**. Ninguna medición de este reporte
proviene del período de contención. **No se vio ningún tenant ajeno durante la medición**: las 9 lecturas
afirman `denarioelyaque.ddns.net:8080` y una de las 3 empresas válidas.

---
*2026-08-12 · read-only · sin escrituras en producción salvo el submit de login accidental en la pestaña
de Isla Coche durante la contención (§8).*
