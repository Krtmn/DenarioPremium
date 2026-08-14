# Regresión `Tipo Cobro` + indicadores + roles ocultos — LA TORTUGA / hidroponias

**RUN_ID** `fix_tipocobro_20260812` · **Fecha** 2026-08-12 · **Modo** read-only
**Playa** `http://denariolatortuga.ddns.net:8080/DenarioPremium`
**BD** `hidroponias` (RDS savia, `user_read`)
**Empresa bajo prueba** `HIDROPONIAS VENEZOLANAS C.A` (`id_enterprise=1`, `co_enterprise=HIDRO_A`)

---

## 0. Guarda de tenant — ✅ PASA

| Comprobación | Valor leído | Veredicto |
|---|---|---|
| Host en cada lectura | `denariolatortuga.ddns.net:8080` | ✅ |
| Empresa (por TEXTO) en `/pages/cobros` | `HIDROPONIAS VENEZOLANAS C.A` | ✅ |
| Empresa (por TEXTO) en `/pages/pedidos` | `HIDROPONIAS VENEZOLANAS C.A` | ✅ |
| 2ª empresa del tenant | `Empresa de Pruebas de INtegracion Denario` (`TEST_AD`) | — |
| Otro tenant visto | **ninguno por accidente** (ver §6) | ✅ |

La playa está efectivamente en **hidroponias**. No se vio rastro de globalmp ni alipascua.

### 🔴 Prueba de que la web lee ESTA base (sin esto, nada de lo de abajo vale)

`collection` está **vacía** en BD, así que un "0" en la web podría significar
*"la web no está conectada a esta base"*. Se descartó cruzando un módulo **con** datos:

| Medición | Web | BD | |
|---|---|---|---|
| Pedidos `HIDRO_A`, rango 01/01/2020–31/12/2026 | **47** (`PF('pedidosDT').paginator.cfg.rowCount` = 47, `<tr>` pintados = 47) | **47** (`order`, `co_operation<>'D'`, `co_enterprise='HIDRO_A'`) | ✅ **exacto** |

⇒ La web de La Tortuga sirve la base `hidroponias`. **El 0 de cobros es un hecho del tenant, no una desconexión.**

---

## 1. 🔴 Hecho que condiciona TODO el encargo: hidroponias no tiene ni un cobro

```
collection                  0        collection_payment            0
collection_detail           0        collection_reconciliation     0
collect_discounts           0        deposit                       0
collect_retentions          0        deposit_collection_payment    0
collection_detail_discounts 0        erp_in_collection             0
collection_detail_retentions 0       view_reporte_cobros           0
```

`SELECT count(*) FROM collection` → **0 filas totales** (ni siquiera anuladas: `total=0`, `vivos=0`,
`min/max(da_collection)=null`). El tenant sí está poblado en lo demás: **955 clientes · 47 pedidos ·
37.630 visitas · 5 usuarios**. Es un tenant **sin módulo de cobros en uso**, no una base a medio cargar.

**Consecuencia honesta:** A, B y C **no pueden reproducir el escenario que se quería medir**. Lo que sigue
es lo que sí se pudo probar, y está marcado como tal. **No se reporta ningún FAIL por ausencia de datos.**

---

## 2. A · Filtro `Tipo Cobro` — ✅ sin defecto observable · ⚠ confirmación DÉBIL

**Rango** `01/01/2020–31/12/2026` · **Empresa** `HIDROPONIAS VENEZOLANAS C.A` · fechas fijadas
**después** del último `<select>`. Cada opción con **ajax verificado** (hook a `XMLHttpRequest`:
`sent`/`load` incrementan en las 6 pulsaciones de `Buscar`) ⇒ ningún conteo es un **0 rancio**.

| Opción | `value` | Web (paginador) | Web (`<tr>`) | BD (`da_collection`) | Veredicto |
|---|---|---|---|---|---|
| *(sin filtro)* | `""` | **0** | vacío | **0** | ✅ |
| Cobros | `0` | 0 | vacío | 0 | `N/A — sin datos` |
| Anticipo/Prepago | `1` | 0 | vacío | 0 | `N/A — sin datos` |
| Retención | `2` | 0 | vacío | 0 | `N/A — sin datos` |
| IGTF | `3` | 0 | vacío | 0 | `N/A — sin datos` |
| Cobro 25% | `4` | 0 | vacío | 0 | `N/A — sin datos` |

**Suma de las cinco = 0 = total sin filtro.** ✅ La identidad se cumple, pero **es la identidad trivial `0=0`**.

**Lo que SÍ queda probado acá (y no es poco):**

1. El combo expone las **5 opciones con los `value` correctos `0..4`** y los literales esperados
   (`Cobros`, `Anticipo/Prepago`, `Retención`, `IGTF`, `Cobro 25%`) — el combo del fix está desplegado
   en esta playa.
2. Las 5 selecciones **viajan al servidor** y vuelven sin error, sin excepción JSF ni lista rota.
3. `<select>` espejo y `.ui-selectonemenu-label` **coinciden** en las 6 selecciones (el filtro se aplica
   de verdad, no se queda en la UI).

**Lo que NO queda probado:** que el filtro **discrimine correctamente** entre tipos. Eso solo lo
demuestran El Yaque e Isla Coche. **Esta playa no aporta evidencia a favor ni en contra.**

---

## 3. B · Indicadores `Monto total` — el defecto NO puede manifestarse acá

### Monedas del tenant

```
id_currency | co_currency | na_currency
     1      | BS          | Bolivares
     2      | USD         | Dolar Estadounidense
```

**Una sola moneda dólar** (`USD`, id 2). ⇒ **el defecto de El Yaque (indicadores que solo reconocen el
literal `US$` y omiten los cobros en `USD`) es estructuralmente imposible en hidroponias**, igual que en
Isla Coche. El alcance del defecto sigue acotado a **tenants con monedas dólar duplicadas**.

### Indicadores observados

La cabecera expone **dos** indicadores y sus rótulos salen **de las monedas del tenant**:

```
Monto total en BS:  0,00
Monto total en USD: 0,00
```

- **¿Respetan el filtro?** Se leyeron en las **6** configuraciones de `Tipo Cobro` y en 3 rangos de fecha
  distintos: siempre `0,00`. Con 0 registros **no es discriminante** — `N/A — sin datos`.
- **¿Coinciden con BD?** Sí: `0,00 == 0`. Trivial.

### ⚠ Observación derivada (para el equipo de desarrollo, no es un FAIL acá)

El rótulo del indicador en esta playa es literalmente **`USD`**, no `US$`. Si la implementación
denunciada en El Yaque **compara contra el literal `US$` hardcodeado**, entonces en un tenant cuya única
moneda dólar se llama `USD` —como este— **el indicador de dólares quedaría en 0,00 con el 100 % de los
cobros en dólares fuera**, no el 67 % de El Yaque. **No verificable acá por falta de datos**, pero es una
predicción concreta y barata de comprobar en cualquier tenant `USD`-only con cobros. Vale la pena mirarla
antes de dar el defecto por acotado.

---

## 4. C · 🔴 Cobros ocultos por rol — mecanismo CONFIRMADO, impacto CERO acá

### 4.a Medición del alcance en hidroponias

| `co_role` | Rol | Usuarios | Cobros |
|---|---|---|---|
| 1 | ROLE_ADMIN | 2 | **0** |
| 6 | **ROLE_SUPERVISOR** | **1** | **0** |
| 7 | ROLE_SALESMAN | 1 | **0** |

Y el reparto real de transacciones:

| Usuario | login | Rol | Pedidos | Visitas | Cobros |
|---|---|---|---|---|---|
| Kevin Wilches (468) | `vendedor4` | **7** | 47 | 37.630 | 0 |
| **Jose Gonzalez (467)** | `002` | **6** | **0** | **0** | **0** |
| admin (464) / Administrador Hidroponias (466) | | 1 | 0 | 0 | 0 |

**Respuesta: NO hay cobros ocultos por rol en hidroponias — son 0, y el número crudo es 0 porque
el tenant no tiene cobros y además el único usuario de rol 6 no tiene ninguna transacción de ningún tipo.**
El total sin filtro de la web (**0**) **coincide** con el total de BD (**0**): **no falta nada**.

### 4.b 🔴 PERO el mecanismo del defecto SÍ está presente — y quedó identificada la CAUSA RAÍZ

El combo `Vendedor` de La Tortuga tiene **exactamente una opción**:

```
/pages/cobros   :idSalesmaView_input →  ["" | Vendedor",  "468 | Kevin Wilches"]
/pages/pedidos  :idSalesmaView_input →  ["" | Vendedor",  "468 | Kevin Wilches"]
```

**Jose Gonzalez (`id_user=467`, `co_role=6`, `co_operation='I'` — ACTIVO, no es una baja) NO aparece**,
ni en cobros ni en pedidos. Reproduce exactamente el síntoma de Isla Coche, en un segundo tenant y en
**dos módulos**.

**Causa raíz (nueva, no estaba en el hallazgo de Isla Coche):** la tabla **`role` tiene una columna
booleana `selector`**, y el combo `Vendedor` se puebla **solo con los roles que la tienen en `true`**:

| Tenant | Roles con `selector = true` | ¿`ROLE_SUPERVISOR` (6)? |
|---|---|---|
| **hidroponias** (La Tortuga) | `7 ROLE_SALESMAN` · `15 ROLE_TRANSPORT` | `selector = false` ❌ |
| **el_palmar** (Isla Coche) | `7 ROLE_SALESMAN` · `12 ROLE_TRANSPORT` | `selector = false` ❌ |
| **difranca** (El Yaque) | `7 ROLE_SALESMAN` · `14 ROLE_TRANSPORT` | `selector = false` ❌ |

⇒ **El comportamiento no es un bug de código aleatorio: es la bandera `role.selector`.** En los tres
tenantes es idéntica. Lo que convierte eso en **defecto** es la consecuencia denunciada por Isla Coche:
un usuario **excluido del combo** deja de ser visible **también en la lista y en ambos indicadores**,
aunque sus cobros existan y estén activos. Es decir, **una bandera pensada para "quién es elegible como
vendedor" está actuando de facto como "qué transacciones existen"**.

**🔴 Nota para quien lo corrija: NO cablear el número de rol.** `ROLE_TRANSPORT` es `15` en hidroponias,
`12` en el_palmar y `14` en difranca. **El ancla estable es la bandera `selector`, no el `co_role`.**

**Diagnóstico portable a cualquier tenant (una consulta):**

```sql
SELECT r.co_role, r.na_role, r.selector,
       count(DISTINCT ru.id_user) AS usuarios,
       (SELECT count(*) FROM collection c
         WHERE c.co_operation<>'D'
           AND c.id_user IN (SELECT id_user FROM role_user r2
                              WHERE r2.co_role=r.co_role AND r2.co_operation<>'D')) AS cobros_en_riesgo
FROM role r LEFT JOIN role_user ru ON ru.co_role=r.co_role AND ru.co_operation<>'D'
WHERE r.co_operation<>'D' AND r.selector IS NOT TRUE
GROUP BY 1,2,3 HAVING count(DISTINCT ru.id_user) > 0 ORDER BY 5 DESC;
```

En hidroponias devuelve `cobros_en_riesgo = 0` para todos los roles. En el_palmar es donde da los 1.340.

---

## 5. Defectos nuevos

### 5.1 🟠 `VIS-FECHA-FUTURA` — 37.506 de 37.630 visitas tienen fecha en el FUTURO (hasta 2050)

```
futuras (da_visit > now())  : 37.506
pasadas                     :    124
min(da_visit) = 2026-07-20        max(da_visit) = 2050-07-28
```

**99,7 % de las visitas del tenant están fechadas por delante de hoy**, con un techo en **2050-07-28**,
todas del mismo usuario (`vendedor4`). Contra 124 visitas con fecha real.

- **Por qué importa:** el rango por defecto de la web es *el mes en curso hasta hoy* ⇒ un operador que
  entre a Visitas ve una fracción minúscula de lo que hay, sin ninguna señal de que falte algo. Y
  cualquier reporte por rango queda distorsionado.
- **Severidad:** 🟠 media. No se pudo determinar en esta corrida si es **carga de datos de prueba** o un
  **bug de generación de `da_visit`** en el móvil. **Requiere decisión de QA**, no la tomo yo.
- **Fuera del alcance del encargo** (cobros), pero apareció al cruzar usuarios y roles y es demasiado
  grande para no anotarlo.

### 5.2 🟢 Ningún defecto nuevo en cobros

Con 0 registros no hubo superficie donde encontrarlos. Ni excepciones JSF, ni lista rota, ni indicadores
en blanco, ni combos vacíos.

---

## 6. ¿Se vio otro tenant?

**Por accidente, no.** Todas las lecturas de web fueron contra `denariolatortuga.ddns.net:8080` con
`HIDROPONIAS VENEZOLANAS C.A` afirmada, y todas las consultas de datos contra la base `hidroponias`.

**Deliberado y declarado, sí:** para nombrar la causa raíz de §4.b se leyó **únicamente la tabla `role`**
(catálogo de roles, sin datos transaccionales ni de clientes) de **`el_palmar`** y **`difranca`**. Ninguna
cifra de este reporte sale de esas dos bases salvo la columna `selector` de la tabla comparativa.

⚠ Nota de higiene: la pestaña **0** del navegador quedó en el **login de El Yaque**
(`denarioelyaque.ddns.net`), heredada del agente anterior. **No se tocó** — se trabajó siempre en la
pestaña activa. No se abrió ninguna pestaña nueva.

---

## 7. Patrones / selectores nuevos para `web-selectors/_comunes.md`

Tag propuesto: **`[hidroponias-20260812]`**

1. **`Status` en cobros de La Tortuga vale `3 Por aprobar` / `7 Enviado`.** Tercera playa, tercer par
   distinto (El Yaque `7`/`27`, Isla Coche `2`/`12`). **Confirma definitivamente que no se cablean.**
   En **pedidos** de esta playa son otros más: `4 Enviado` / `10 Por aprobar` / `-1 Guardado`.
2. **El `value` de Empresa vuelve a cambiar de tipo entre módulos, dentro del mismo tenant:**
   `/pages/cobros` → `1` (**`id_enterprise`**) · `/pages/pedidos` → `HIDRO_A` (**`co_enterprise`**).
   Reproduce exacto el mapa de El Yaque ⇒ **anclar por TEXTO** queda reconfirmado por 3ª vez.
3. **Prefijo del panel:** `form:j_idt116` en cobros · `form:j_idt115` en pedidos, **misma sesión**.
   Enésima confirmación de no anclar a `j_idt*`. Los **sufijos funcionaron al 100 %**.
4. **`Tipo Cobro` NO persistió** al re-entrar por URL fresca a `/pages/cobros` (volvió al placeholder), y
   **las fechas SÍ se resetearon** al rango por defecto `01/08/2026–12/08/2026`. Difiere de lo anotado
   para El Yaque (donde Moneda/Cliente/Status persistían) ⇒ **la persistencia de filtros no es uniforme
   entre playas: verificar el estado real, nunca asumir ni "persiste" ni "se limpia".**
5. **Combo `Tipo Cobro`** — sufijo `:idTipo_*`, opciones estables:
   `""|Tipo Cobro · 0|Cobros · 1|Anticipo/Prepago · 2|Retención · 3|IGTF · 4|Cobro 25%`.
6. **Indicadores de cobros**: no tienen id propio; el rótulo y el valor **comparten padre**
   (`"Monto total en BS: 0,00"`) ⇒ leer con la regla **padre-primero**, y **el rótulo lleva el
   `co_currency` del tenant** (`BS` / `USD` acá), así que **no se puede anclar al literal `US$`**.
7. **Hook a `XMLHttpRequest` como prueba de ajax** — funcionó igual que en Isla Coche. Imprescindible
   cuando el resultado esperado es `0`, porque un **0 rancio** es indistinguible de un 0 real:

```js
if (!window.__qaXhr) { window.__qaXhr = { sent: 0 };
  const o = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(){ window.__qaXhr.sent++; return o.apply(this, arguments); }; }
// ... click Buscar ... ⇒ exigir  window.__qaXhr.sent > antes
```

8. **`role.selector`** (§4.b) — columna nueva documentada, con la consulta de diagnóstico portable.
   **Anclar a la bandera, nunca al número de `co_role`** (`ROLE_TRANSPORT` = 15/12/14 según tenant).

---

## 8. Veredicto

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | ¿El filtro `Tipo Cobro` quedó arreglado? | **NO EVALUABLE acá** — 5/5 opciones dan 0 con ajax real, contra 0 en BD. Combo correcto y filtro operativo; **cero poder discriminante** por falta de datos |
| 2 | ¿El total sin filtro es la suma de las cinco? | **SÍ**, `0 = 0+0+0+0+0` — identidad trivial |
| 3 | ¿Los indicadores omiten alguna moneda? | **NO puede pasar acá**: una sola moneda dólar (`USD`). Defecto sigue acotado a tenants con dólar duplicado. ⚠ ver predicción `USD`-only en §3 |
| 4 | 🔴 ¿Cobros ocultos por rol, cuántos? | **0 cobros ocultos.** Pero el **mecanismo se reprodujo**: el usuario 467 (rol 6, ACTIVO) está fuera del combo `Vendedor` en 2 módulos. **Causa raíz identificada: `role.selector = false` para `ROLE_SUPERVISOR`, idéntico en los 3 tenantes** |
| 5 | ¿Defectos nuevos? | **1** — `VIS-FECHA-FUTURA`: 37.506 visitas fechadas en el futuro (hasta 2050) |
| 6 | ¿Otro tenant? | No por accidente. Sí **deliberado y declarado**: tabla `role` de `el_palmar` y `difranca` para la causa raíz |

**Marca global de la playa:** `WEB-N/A — tenant sin cobros` para A y B · `WEB-OK` para el conteo
(web 0 == BD 0, con la conexión web↔BD probada por pedidos 47=47) · **hallazgo de causa raíz en C**.
