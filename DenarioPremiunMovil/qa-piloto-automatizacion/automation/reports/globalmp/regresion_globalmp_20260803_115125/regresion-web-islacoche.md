# REGRESIÓN WEB — verificación de fixes · latino_cosmetica · ISLA COCHE

**RUN_ID:** `20260803_115125_regresion`
**Fecha de la verificación:** 03/08/2026
**Base:** `http://denarioislacoche.ddns.net:8080/DenarioPremium`
**Empresa:** **LATINOCOSMETICA C.A.** (⚠ el `<select>` de empresa acá trae **una sola opción**)
**Comparación:** `regresion-web-latortuga.md` (misma corrida, playa globalmp) ·
`web-extendido_latino_cosmetica_20260731_090716/extendido.md` (esta playa, 31/07)
**Alcance:** OBJETIVO 1 = confirmar que el fix no rompió lo que ya funcionaba (regresiones) ·
OBJETIVO 2 = el desplegable `Coordenadas` de visitas. **READ-ONLY, producción.**

---

## 0 · Huella de despliegue — 🔑 **Isla Coche y La Tortuga NO tienen el mismo build**

Igual que en La Tortuga, **la web no expone versión ni build**: no hay pie con versión, ni "Acerca de",
ni comentario HTML, ni cabecera HTTP con la compilación. Verificado en el login y en `/pages/main`:
`document.createNodeIterator(SHOW_COMMENT)` devuelve **0 comentarios** y no hay ningún nodo de texto que
matchee `/versi|build|v\d+\.\d+|©|powered/`.

Se tomó la misma huella sustituta que en La Tortuga (`Last-Modified` de los recursos estáticos del WAR
servidos por Tomcat, que conservan la fecha de empaquetado):

| Recurso | Propiedad | Isla Coche (hoy) | La Tortuga (hoy) |
|---|---|---|---|
| **`common.css` (`ln=css`)** | **de la aplicación** | 🔑 **Thu, 23 Jul 2026 18:43:10 GMT** | Thu, 16 Jul 2026 17:25:16 GMT |
| `iconosinternos/style.css` | de la aplicación | Tue, 23 Sep 2025 14:53:52 GMT | idem |
| `iconosinternosmap/style.css` | de la aplicación | Tue, 23 Sep 2025 14:53:52 GMT | idem |
| `icono-negro.png` (`ln=imagenes`) | de la aplicación | Tue, 23 Sep 2025 14:53:52 GMT | idem |
| `theme.css`, `core.js`, `components.js` | PrimeFaces **11.0.0** (librería) | 23 Sep 2025 | idem |

- Stack idéntico en las dos playas: **JSF + PrimeFaces 11.0.0**, tema `primefaces-rain-cyan-light`.
- El `ETag` corrobora la fecha (`W/"11309-1784832190000"` → epoch 1784832190000 = 23/07/2026 18:43:10 UTC).

### 🔑 Lo que esto aporta a la pregunta abierta

**El recurso propio de la app difiere entre las dos playas: 23/07 acá, 16/07 en La Tortuga.**
Son **dos despliegues distintos**, hechos en momentos distintos — no un WAR común.

⇒ Aporta un **indicio a favor** de la hipótesis del encargo: en Isla Coche hay un artefacto de despliegue
del **23/07/2026**, es decir **anterior a la corrida del 31/07** en la que los 3 defectos no se reprodujeron.
Si el repunte a `main` de esta playa fue el del 23/07, **el fix ya estaba desplegado el 31/07** y la
conclusión de entonces («son defectos propios de La Tortuga») sería incorrecta: no se reprodujeron
**porque ya estaban arreglados acá**.

⚠ **Esto NO es prueba, y hay que decir por qué en las dos direcciones:**
1. `Last-Modified` es la fecha de la **entrada CSS dentro del WAR**, no la del despliegue. Si el WAR se
   redesplegó después sin tocar los recursos estáticos, la huella **no se movería** (mismo argumento que
   el apartado 5.2-ii de La Tortuga). ⇒ La fecha es un **piso**, no un techo: el despliegue fue el 23/07
   **o después**, nunca antes.
2. Tampoco prueba que el WAR del 23/07 contuviera los fixes: solo prueba que **hubo empaquetado el 23/07**.

⇒ **Sigue haciendo falta la confirmación de desarrollo** (`¿cuándo se repuntó Isla Coche a main?`), pero
ahora la pregunta tiene una **fecha candidata concreta que antes no existía: 23/07/2026**.

**Recomendación reiterada (2ª playa consecutiva):** exponer versión/build en el pie o en un "Acerca de".

---

## 0.bis · 🔴 CORRECCIÓN DEL ENCARGO — la línea base del 31/07 **no cubre** lo que se le atribuye

El encargo parte de que «en Isla Coche, el 31/07, estos comportamientos ya eran correctos». **Eso es cierto
solo para 2 módulos.** Verificado leyendo los dos reportes previos de esta playa:

| | Qué se probó realmente |
|---|---|
| **31/07** (`web-extendido_...20260731_090716`) | `Limpiar` y ordenamiento se probaron **solo en `/pages/visitas` y en la familia de reportes**. Con eso se concluyó «los 3 defectos NO se reproducen ⇒ son propios de La Tortuga» |
| **29/07** (`smoke_latino_cosmetica_20260729_133234`) | **En ESTA MISMA PLAYA los defectos SÍ se reprodujeron**, en **5 módulos**: clientes potenciales, pedidos, cobros, inventarios y depósitos |

🔑 **Visitas y reportes eran justamente los dos módulos sanos.** La conclusión del 31/07 salió de un
**hueco de cobertura**, no de una medición que contradijera a La Tortuga.

**Lo que el 29/07 dejó documentado en Isla Coche (línea base real, con cifras):**

| Módulo | `Limpiar` restablece desplegables | Ordenamiento |
|---|---|---|
| clientes potenciales | ❌ `Tiene Adjunto` queda en `NO` → sigue **1 de 4** (`DW-CLT-F03`) | ❌ **no reordena**: 3 clics en `# Ref`, filas siempre `4,3,2,1` (`DW-CLT-D02`) |
| pedidos | ❌ `Tiene Adjunto` **2/2** → **40 y 83** filas en vez de **123** (`DW-PED-F03b`) | ✅ funciona (numérico) |
| cobros | ❌ `Tiene Adjunto` queda en `NO` → **0 filas**, pantalla vacía | ✅ funciona (con defecto aparte de orden por importe multi-moneda) |
| inventarios | ❌ `Tiene Adjunto` **y** `Status` → **2 de 18** filas (89 % oculto) | ❌ `# Ref` atada al **id del pedido relacionado** (patrón NULLS-LAST, 18 filas / 17 nulos) |
| depósitos | ❌ `Limpiar` deja `Moneda=BSD` y **oculta el único registro** (Ref 1, 240,00 $) | no probado |
| **visitas** | ✅ **sí restablece** (`selectAttach`) y vacía fechas | ✅ funciona |
| **devoluciones** | **nunca probado en web en esta playa** — sin línea base | — |

⇒ **Sí hay contra qué comparar en Isla Coche**, y no es el 31/07: es el **29/07**. Esta corrida mide
esos módulos y responde si el fix también llegó acá.

---

## 1 · VISITAS · `/pages/visitas`

**Contexto verificado:** host `denarioislacoche.ddns.net:8080` → playa `isla_coche` ✅ ·
`/DenarioPremium/pages/visitas` · empresa **`idEnterprise` = `1` LATINOCOSMETICA C.A.**
Formulario de filtros **`form:j_idt115`** · tabla **`form:tablaVisit`** · Buscar **`[id$=":btnBuscar"]`** ·
contador **`Total de Resultados:`** (hoja siguiente a la etiqueta) · vacío = **"No existe registro"**.

**Baseline (sesión limpia, 01/01/2026 – 03/08/2026, 200 filas/pág):** **Total de Resultados = 215**
— **idéntico al 31/07**. Distribución completa de `Geo` en las primeras 200 filas:
**No Realizado 90 · Correcto 81 · Fuera de Rango 24 · Falta Coordenada (Sucursal) 5.**

### 1.a · OBJETIVO 2(b) — el filtro `Coordenadas` contradice a su propia tabla · ❌ **SIGUE FALLANDO**

Reproducido hoy sobre **sesión limpia**, con el contador `Total de Resultados` (independiente del
tamaño de página). **Los números replican exactamente los del 31/07:**

| `Coordenadas` | `value` | Total 31/07 | **Total HOY** | Veredicto |
|---|---|---|---|---|
| *(neutro)* `Coordenadas` | `-1` | 215 | **215** | ✅ coherente |
| **`No Realizado`** | `1` | **0** | **0** | ❌ **la tabla muestra 90 filas con ese valor** |
| **`Por Revisar`** | `0` | **215** | **215** | ❌ **no filtra**: devuelve el universo entero |
| `Correcto` | `5` | 92 | **92** (las 92 con `Geo=Correcto`) | ✅ filtra bien |

🔑 **La prueba cerrada, sin BD:** con `Por Revisar` la tabla devuelve 215 filas que incluyen
**90 con `Geo = "No Realizado"`** — exactamente las que el filtro `No Realizado` acababa de declarar
inexistentes. **El mismo desplegable da dos respuestas incompatibles sobre las mismas filas.**

🔑 **`Correcto` = 92 es el control que valida la medición:** el panel estaba sano y el filtro
*sí* funciona para otros valores ⇒ el fallo es **específico de `No Realizado` y `Por Revisar`**,
no una avería general de la pantalla.

⇒ **El fix no tocó este defecto.** Sigue igual que el 31/07, con los mismos números.

### 1.b · OBJETIVO 2(a) — `Limpiar` no restablece `Coordenadas` · ❌ **FALLA IGUAL QUE EN LA TORTUGA**

| Paso | Observado |
|---|---|
| `Coordenadas` = `No Realizado` (`value=1`) + `Buscar` | Total 0 |
| **`Limpiar`** → `Coordenadas` | 🔴 **sigue `value=1` / "No Realizado"** — ni el widget ni el bean |
| **`Limpiar`** → los demás | `Estatus`→`0` ✅ · `Adjuntos`→`0` ✅ · `Despachado`→`0` ✅ · `Actividad`→`""` ✅ · `Motivo`→`""` ✅ · `Vendedor`→`""` ✅ · `Roles`→`""` ✅ · `# Ref`→`""` ✅ · fechas → **vacías** ✅ |
| Empresa tras `Limpiar` | **`1` LATINOCOSMETICA C.A.** ✅ (no saltó al neutro) |

🔑 **Que 8 controles y las 2 fechas SÍ se resetearan en la misma maniobra prueba que `Limpiar` se ejecutó.**
El problema es específico de `Coordenadas` — mismo patrón exacto que La Tortuga (4.3 de su reporte),
y misma pista de causa: **`Coordenadas` es el único desplegable del panel cuyo valor neutro es `-1`**
(los demás usan `0` o `""`); el reset no lo alcanza.

⚠ **NO es una regresión demostrable, y conviene decir por qué.** El 31/07 sí se probó `Limpiar` en visitas
(`DWX-VIS-006`, `WEB-OK`, «9 de 9 controles sincronizados»), pero en esa maniobra **`selectCoordinadas`
partía ya del valor neutro**: se verificó que *seguía* neutro, **no** que un valor puesto se soltara.
⇒ Es un defecto **no cubierto entonces**, detectado ahora — exactamente el mismo estatus que en La Tortuga.

🔑 **Observación fina sobre el mecanismo (aporta causa raíz).** En una segunda pasada se puso `Correcto`
(`5`) en el widget **sin pulsar `Buscar`** y luego `Limpiar`: el control quedó en **`0` / "Por Revisar"**,
que era el valor **del bean** (la búsqueda anterior), no el `5` del widget ni el neutro `-1`.
⇒ `Limpiar` **no limpia este campo: re-renderiza el control desde un valor de bean que nunca se resetea.**
Eso explica tanto que el valor sobreviva como que sobreviva a un `page.goto()`.

**Casos:** `REG-IC-COORD-LIMP-001` ❌ · `REG-IC-COORD-FILTRO-002` ❌ · `REG-IC-COORD-CTRL-003` ✅

### 1.c · 🔴🔴 **REGRESIÓN — `Limpiar` deja VISITAS inutilizable: toda búsqueda posterior devuelve 0** · S1

**Éste es el hallazgo más grave de la corrida y el único que califica como regresión demostrable.**

**Línea base del 31/07 (misma playa, mismo módulo, misma maniobra):** `DWX-VIS-006` dejó escrito que tras
`Limpiar` **«`Buscar` posterior devolvió 215 (coherente)»**, con las fechas vacías. Es decir: el 31/07,
`Limpiar` + `Buscar` **funcionaba**.

**Reproducción mínima de hoy — sesión recién abierta, sin ningún filtro puesto:**

| # | Paso | `Total de Resultados` |
|---|---|---|
| 1 | Rango **01/07/2026 – 31/07/2026** (tecleado) + `Buscar` | **215** ✅ |
| 2 | **`Limpiar`** (todos los controles quedan neutros; las 2 fechas quedan **vacías**) | **0** |
| 3 | `Buscar` inmediato, tal cual lo hizo el 31/07 | 🔴 **0** *(el 31/07: **215**)* |
| 4 | Se reponen **las mismas fechas 01/07–31/07, con el mismo tecleo del paso 1**, + `Buscar` | 🔴 **0** |

🔑 **El paso 4 es el control que descarta al harness.** El paso 1 y el paso 4 usan **el mismo método de
escritura de fechas, los mismos valores y la misma sesión**; lo único que cambia es que en el medio se
pulsó `Limpiar`. Uno da 215 y el otro 0. **No puede ser un problema de cómo se escriben las fechas.**

**Además, no se recupera navegando:**

| Intento de recuperación | Resultado |
|---|---|
| Volver a `Buscar` con filtros neutros y fechas válidas | 🔴 sigue 0 |
| **`page.goto()`** completo de `/pages/visitas` | 🔴 sigue 0 |
| **Cerrar sesión y volver a entrar** | ✅ **vuelve a 215** |

⇒ El estado corrupto **vive en el bean de sesión**, no en la pantalla. **La única salida para el usuario es
cerrar sesión.**

**Reproducido 3/3, en tres sesiones distintas:**
1. `Coordenadas=No Realizado` → `Limpiar` → todas las búsquedas 0 (incluso con el desplegable en neutro).
2. Tras 4 búsquedas correctas (215 · 0 · 92 · 215) → `Limpiar` → `Correcto` pasó de devolver **92 a 0**.
3. La reproducción mínima de la tabla de arriba, sin ningún filtro.

**Impacto:** en producción, un usuario que pulse `Limpiar` en Visitas —el botón que existe justamente para
volver a ver todo— **deja de ver visitas por completo**, sin mensaje de error, y **nada de lo que haga en la
pantalla lo arregla**. Es peor que el defecto que `Limpiar` debía resolver.

**Pasos para reproducir:** VISITAS → poner rango 01/07–31/07 → `Buscar` (215) → `Limpiar` → `Buscar` → 0 →
reponer el rango → `Buscar` → 0. Recupera solo cerrando sesión.

⚠ **Nota de alcance honesta:** este comportamiento **se midió hoy en Isla Coche**. En La Tortuga, el agente
de esta misma corrida **pulsó `Limpiar` en visitas y siguió obteniendo 50 filas**, así que **allá no se
manifiesta**. Falta comprobar si golpea a otros módulos de esta playa (ver secciones siguientes).

**Caso:** `REG-IC-LIMP-ROMPE-VIS-004` 🔴 **REGRESIÓN**

---

## 2 · INVENTARIOS · `/pages/inventarios` — 🎉 **los 2 defectos del 29/07 están ARREGLADOS**

**Contexto verificado:** playa `isla_coche` ✅ · `/pages/inventarios` · empresa **`1` LATINOCOSMETICA C.A.**
Formulario **`form:j_idt114`** · tabla **`form:pedidosDT`** ⚠ (se llama `pedidosDT` aunque sea inventarios) ·
Buscar **`[id$=":ajax"]`** (≠ visitas, que usa `btnBuscar`) · Limpiar `[id$=":botonLimpiar"]`.

**Baseline (01/01/2026 – 03/08/2026): 18 filas, Refs `18…1`** — **el mismo universo exacto del 29/07**
(18 registros, Refs 1–18). Vendedores: NEIMY PARRA y CESAR SALAS. `Estatus` = **"Enviado" en las 18**.

### 2.a — `Limpiar` restablece los desplegables · 🎉 **ARREGLADO** (era ❌ el 29/07)

| Paso | `Tiene Adjunto` (`attachStatus`) | `Status` (`orderStatus`) |
|---|---|---|
| Valor puesto | `SI` → `value=1`, label "SI" | — |
| `Buscar` con el filtro | **2 filas, Refs `14` y `1`** — **idéntico al 29/07** | |
| **`Limpiar`** → label | **"Tiene Adjunto"** ✅ | **"Status"** ✅ |
| **`Limpiar`** → `value` del `<select>` | **`0`** ✅ | **`0`** ✅ |
| `Buscar` revalidando (fecha reampliada) | **18 filas `18…1`** ✅ | ✅ |

🔑 **Contraste directo con la línea base del 29/07**, que sobre **este mismo dataset** dejó escrito:
`Tiene Adjunto=SI` → 2 filas → `Limpiar` → **seguía en "SI" y seguía mostrando 2 filas** (label *y* `value`),
y `Status` **tampoco** se restablecía. **Hoy los dos se sueltan, y se sueltan en el servidor**
(vuelven las 18). El 29/07 esto dejaba la pantalla en **2 de 18 filas — 89 % de los registros ocultos**.

⚠ Igual que en La Tortuga, `Limpiar` deja las fechas en el **rango por defecto de 3 días** (01/08–03/08),
que acá devuelve **0 filas**. Sin reampliar la fecha se vería "0 filas" y se concluiría **falsamente** que
`Limpiar` no funciona. *(En visitas, en cambio, las deja vacías.)*

### 2.b — Ordenamiento · 🎉 **ARREGLADO** (era ❌ el 29/07)

Leyendo **las filas reales** (no el `aria-sort`), con espera de 3,5 s:

| Columna | Ascendente | Descendente | Veredicto |
|---|---|---|---|
| **`# Ref`** | **`1·2·3·4·5·6·7·8·9·10·11·12·13·14·15·16·17·18`** | **`18…1`** (inverso exacto) | 🎉 **ARREGLADO** |
| **`Cliente`** | `1.000 Y UNA BELLEZA(15)` · `A DOLAR(14)` · `ANNELI ×3 (18,17,16)` · `CREACIONES SPECTRAS ×3` … | `INVERSIONES LA ORIENTAL(10)` · `INVERSIONES EURO ×2` · `DISTRIBUIDORA MASTOS(2)` · `DISTRIBUIDORA LOOKS 5 ×2` … | ✅ reordena |
| `Estatus` | — | — | ⓘ **no concluyente**: las 18 filas dicen "Enviado". **No es defecto.** |

🔑 **Ésta es la evidencia más limpia de toda la corrida de que hubo un cambio real en la aplicación.**
El 29/07 se demostró, sobre **este mismo conjunto de 18 filas**, que `# Ref` ordenaba por el **id del pedido
relacionado**: la **Ref 15 —única con `Ver Pedido Relacionado`— saltaba al primer puesto** en ascendente
(`15,1,2,3,…,14,16,17,18`) y al último en descendente, patrón **NULLS-LAST/FIRST** de PostgreSQL.
**Hoy, con el mismo dataset, el 15 cae en su posición numérica exacta, entre el 14 y el 16.**
El dato no cambió; **cambió el comportamiento** ⇒ no hay condición de datos que lo explique.

**Casos:** `REG-IC-LIMP-SEL-INV-005` ✅ ARREGLADO · `REG-IC-ORD-INV-006` ✅ ARREGLADO ·
`REG-IC-LIMP-ROMPE-INV-007` ✅ (`Limpiar` **no** rompe las búsquedas acá — ver §1.c)

⚠ **`Limpiar` no toca la empresa: N/A estructural.** El `<select>` `idEnterprise` de inventarios tiene
**una única opción (`1=LATINOCOSMETICA C.A.`) y ni siquiera opción neutra** ⇒ no hay a dónde saltar.
Confirmado y **no forzado**, como pedía el encargo.

---

## 3 · CLIENTES POTENCIALES · `/pages/clientesPotenciales` — 🎉 **los 2 defectos del 29/07 están ARREGLADOS**

**Contexto verificado:** playa `isla_coche` ✅ · empresa **`00001` LATINOCOSMETICA C.A.**
⚠ acá el `value` de Empresa es la cadena **`00001`** (con ceros), no `1` como en inventarios y visitas.
Formulario **`form:j_idt114`** · tabla **`form:pedidosDT`** · Buscar `[id$=":ajax"]`.
⚠ Este módulo **no tiene filtro `Status`**: sus desplegables son `Empresa`, `Vendedor` y `Tiene Adjunto`.

**Baseline (01/01/2026 – 03/08/2026): 4 filas, Refs `4·3·2·1`** — **el mismo universo del 29/07**
(no se crearon clientes potenciales nuevos desde entonces).

### 3.a — `Limpiar` restablece `Tiene Adjunto` · 🎉 **ARREGLADO** (era ❌ el 29/07)

| Paso | Observado |
|---|---|
| `Tiene Adjunto = NO` (`value=2`) + `Buscar` | **1 fila, Ref `4`** — **idéntico al 29/07** («sigue mostrando 1 de 4») |
| **`Limpiar`** → label / `value` | **"Tiene Adjunto"** / **`0`** ✅ *(el 29/07 quedaba pegado en "NO")* |
| **`Limpiar`** → `Vendedor` · Empresa · fechas | `""` ✅ · **`00001` LATINOCOSMETICA** ✅ · **vacías** |
| Listado inmediatamente tras `Limpiar` | **4 filas `1·2·3·4`** ✅ |
| `Buscar` revalidando | **4 filas `1·2·3·4`** ✅ ⇒ soltado **en el servidor** |

🔑 **Y este módulo aporta el contraste que necesita §1.c:** acá `Limpiar` también deja **las dos fechas
vacías**, y aun así el listado **se repuebla con las 4 filas**. ⇒ **«fechas vacías ⇒ 0 resultados» NO es el
comportamiento normal de la aplicación**, lo que refuerza que lo de visitas es una avería y no un diseño.

### 3.b — Ordenamiento · 🎉 **ARREGLADO** (era ❌ el 29/07)

Solo 3 columnas son ordenables (`Vendedor`, `# Ref`, `Fecha`); `Rif. Cliente`, `Cliente` y `Responsable`
**no** llevan `ui-sortable-column`.

| Columna | Ascendente (filas reales) | Veredicto |
|---|---|---|
| **`# Ref`** | **`1` (20/07 16:41:42) · `2` (25/07 19:16:07) · `3` (29/07 13:16:17) · `4` (29/07 13:46:13)** | 🎉 **ARREGLADO** |

El 29/07 se dieron **3 clics sobre `# Ref` y 1 sobre `Fecha`** y las filas **quedaban siempre `4,3,2,1`**
(con el `aria-sort` cambiando y el POST devolviendo 200; se muestreó el DOM 3 s / 12 muestras, sin cambio).
**Hoy, con el mismo dataset, el primer clic las deja `1,2,3,4`** y `Fecha` queda cronológica ascendente
en la misma pasada.

⚠ **Advertencia de método (heredada del reporte de La Tortuga, y vale acá):** **4 filas es un universo chico.**
Aun así el resultado **es concluyente en este caso concreto**, porque el orden natural (`4,3,2,1`) y el
ascendente (`1,2,3,4`) son **exactamente opuestos**: hay algo que reordenar y se reordenó. No es el caso
de una columna con un solo valor repetido.

**Casos:** `REG-IC-LIMP-SEL-CPO-008` ✅ ARREGLADO · `REG-IC-ORD-CPO-009` ✅ ARREGLADO ·
`REG-IC-LIMP-ROMPE-CPO-010` ✅ (`Limpiar` no rompe las búsquedas acá)

⚠ **Empresa: N/A estructural** — `<select>` con **una sola opción y sin neutro**.

---

## 4 · PEDIDOS · `/pages/pedidos` — 🎉 `Limpiar` **ARREGLADO** · ordenamiento ✅ **SIGUE OK**

**Contexto:** playa `isla_coche` ✅ · empresa **`00001` LATINOCOSMETICA C.A.** ·
Formulario **`form:j_idt115`** ⚠ (otro sufijo: inventarios y clientes potenciales usan `j_idt114`) ·
tabla `form:pedidosDT` · Buscar `[id$=":ajax"]`.
**Baseline (01/01–03/08/2026): 50 filas/pág · 3 páginas · Refs desde `124`** (el 29/07 el universo era
123 + el pedido de control `124`).

### 4.a — `Limpiar` restablece los desplegables · 🎉 **ARREGLADO** (era ❌ 2/2 el 29/07)

| Paso | Observado |
|---|---|
| `Tiene Adjunto = SI` (`value=1`) + `Buscar` | **41 filas** *(29/07: 40 SI / 83 NO sobre 123; hoy hay 1 pedido más)* |
| **`Limpiar`** → `Tiene Adjunto` | **"Tiene Adjunto"** / **`0`** ✅ *(29/07: quedaba pegado, 2/2)* |
| **`Limpiar`** → `Status` · `Tipo Pedido` · `Vendedor` | `0` ✅ · `""` ✅ · `""` ✅ |
| **`Limpiar`** → **`Moneda`** | **neutro `""`** ✅ 🎉 |
| Empresa · fechas | **`00001`** ✅ · rango por defecto 01/08–03/08 (la trampa del "0 filas") |
| `Buscar` revalidando (fecha reampliada) | **50 filas / 3 páginas, Refs desde `124`** ✅ |

🔑 **Bonus no pedido:** el 29/07 se reportó (defecto **D4**) que **`Moneda` venía preseleccionada en `$`
al cargar la página *y* tras `Limpiar`**, ocultando los pedidos en la otra moneda. **Hoy `Moneda` arranca
neutra y `Limpiar` la deja neutra.** También arreglado.

### 4.b — Ordenamiento · ✅ **SIGUE OK** (ya funcionaba el 29/07)

| Columna | Ascendente (filas reales) | Veredicto |
|---|---|---|
| **`# Ref`** | `1·2·3·4·5·6·7·8·9·10` (baseline `124·123·122…`) | ✅ numérico, no lexicográfico |
| **`Monto Total`** | `2,03 $ · 5,12 · 7,98 · 8,05 · 10,72 · 11,21 · 12,14 · 15,27` (Refs `44·69·70·47·42·68·123·71`) | ✅ **numérico** |

ⓘ Solo son ordenables `# Ref`, `Fecha creación`, `Fecha envío`, `Monto Base` y `Monto Total`;
`Estatus`, `Vendedor`, `Cliente`, `Total items`, `Monto conv.`, `Tasa conv.` y `Tipo` **no** llevan
`ui-sortable-column`.

**Casos:** `REG-IC-LIMP-SEL-PED-011` ✅ ARREGLADO · `REG-IC-ORD-PED-012` ✅ SIGUE OK ·
`REG-IC-LIMP-ROMPE-PED-013` ✅

---

## 5 · COBROS · `/pages/cobros` — 🎉 `Limpiar` **ARREGLADO**

**Contexto:** playa `isla_coche` ✅ · empresa **`1` LATINOCOSMETICA C.A.** ·
Formulario **`form:j_idt116`** (tercer sufijo distinto) · tabla **`form:cobrosDT`** · Buscar `[id$=":ajax"]`.
**Baseline (01/01–03/08/2026): 50 filas/pág · 3 páginas · Refs desde `114`** (el 29/07 el máximo era 102).

| Paso | Observado |
|---|---|
| `Tiene Adjunto = NO` (`value=2`) + `Buscar` | **0 filas** — "No se encontraron registros." *(igual que el 29/07: todos los cobros traen adjunto)* |
| **`Limpiar`** → `Tiene Adjunto` | **"Tiene Adjunto"** / **`0`** ✅ *(29/07: quedaba pegado en "NO" y **dejaba la pantalla vacía**)* |
| **`Limpiar`** → `Status` · `Tipo Cobro` · `Depositado` · **`Moneda`** | `0` ✅ · `""` ✅ · `""` ✅ · **`""`** ✅ |
| Empresa | **`1` LATINOCOSMETICA** ✅ |
| `Buscar` revalidando | **50 filas / 3 páginas** con **4 tipos distintos** (`Cobros`, `Anticipo/Prepago`, `IGTF`, `Retención`) ⇒ soltado **en el servidor** ✅ |

🔑 El 29/07 éste era **el caso más severo** del defecto: dejaba la pantalla en **0 filas** sin señal alguna,
y **la propia automatización quedó atrapada** por él a mitad de corrida. **Hoy se recupera solo.**
🔑 También arreglado el default de `Moneda`: el 29/07 arrancaba en **BSD** y ocultaba los cobros en `$`.

🔴 **Restricción de solo-lectura cumplida:** el `<select>` prohibido **"Estatus del Cobro"** vive **dentro de
cada fila** (`form:cobrosDT:{N}:statusMenu`) y **no se tocó**. Los filtros usados son `attachStatus` del
panel de filtros.

**Casos:** `REG-IC-LIMP-SEL-COB-014` ✅ ARREGLADO · `REG-IC-LIMP-ROMPE-COB-015` ✅

---

## 6 · DEPÓSITOS · `/pages/depositos` — 🎉 **el defecto con pérdida de datos del 29/07 está ARREGLADO**

**Contexto:** playa `isla_coche` ✅ · empresa **`1`** · Formulario **`form:j_idt114`** · tabla `form:pedidosDT`.
**Baseline (01/01–03/08/2026): 1 fila** — **Ref `1`**, 29/07/2026 13:14:55, NEIMY PARRA, banco `039`,
**240,00 $ / 176.935,70 BSD**, tasa `737,23`. **Es exactamente el registro del 29/07.**

| Paso | Observado |
|---|---|
| **`Limpiar`** → **`Moneda`** | **neutro `""` / "Moneda"** ✅ 🎉 *(29/07: quedaba en **BSD**)* |
| **`Limpiar`** → `Status` · `Vendedor` · Empresa | `0` ✅ · `""` ✅ · `1` ✅ |
| `Buscar` revalidando (fecha reampliada) | **vuelve la fila `1 · 240,00 $`** ✅ |

🔑 **Éste era el defecto mejor demostrado del 29/07 y el único con pérdida de datos real**, no potencial:
tras `Limpiar`, `Moneda` quedaba en **BSD** y **el depósito Ref 1 —que está en `$`— desaparecía de la
pantalla**; volvía solo al devolver `Moneda` a neutro. **Hoy `Limpiar` deja `Moneda` en neutro y el
registro nunca se pierde.**

**Caso:** `REG-IC-LIMP-DEP-016` ✅ **ARREGLADO**

---

## 7 · DEVOLUCIONES · `/pages/devoluciones` — ✅ funciona · ⚠ **sin línea base previa**

**Contexto:** playa `isla_coche` ✅ · Formulario **`form:j_idt114`** · tabla `form:pedidosDT`.
**Baseline (01/01–03/08/2026): 2 filas, Refs `7` y `6`**, ambas "Enviado".

⚠ **Este módulo NUNCA se probó en la capa web de esta playa** (no hay `devoluciones.md` en la corrida del
29/07 y su `_web-results.jsonl` no lo incluye) ⇒ **no hay contra qué comparar.** Lo de hoy es la
**primera medición real** del módulo en Isla Coche. Se reporta como *funciona*, **no** como *arreglado*.

| Control | Evidencia | Veredicto |
|---|---|---|
| `Limpiar` restablece los desplegables | `Tiene Adjunto = SI` (`value=1`) + `Buscar` → `Limpiar`: `Tiene Adjunto`→**`0`** ✅ · `Status`→`0` ✅ · `Vendedor`→`""` ✅ · Empresa→`1` ✅ · fechas → rango por defecto. `Buscar` revalidando → **2 filas `6·7`** | ✅ funciona |
| El ordenamiento reordena | `# Ref` asc → **`6·7`** (baseline `7·6`) | ✅ reordena |
| `Limpiar` no rompe las búsquedas | tras `Limpiar` + reampliar fecha, vuelven las 2 filas | ✅ |
| `Estatus` | las 2 filas dicen "Enviado" | ⓘ **no concluyente**, no es defecto |

ⓘ **El typo del encabezado `Fecha Devoluciòn`** (acento grave) **también está en Isla Coche** — o sea
**no es de una playa: es de la versión.** En La Tortuga se anotó hoy lo mismo.
ⓘ El ordenamiento **sobrevivió a `Limpiar`** (las filas siguieron en `6·7`), igual que en La Tortuga.

**Casos:** `REG-IC-LIMP-SEL-DEV-017` ✅ · `REG-IC-ORD-DEV-018` ✅

---

## 8 · RESUMEN DE VEREDICTOS

| Módulo | `Limpiar` restablece desplegables | Ordenamiento | `Limpiar` no rompe la búsqueda | Empresa |
|---|---|---|---|---|
| **visitas** | ⚠ **OK salvo `Coordenadas`** (§1.b) | ✅ (31/07) | 🔴🔴 **REGRESIÓN** (§1.c) | ⚠ N/A |
| **inventarios** | 🎉 **ARREGLADO** | 🎉 **ARREGLADO** (`# Ref`) | ✅ | ⚠ N/A |
| **clientes potenciales** | 🎉 **ARREGLADO** | 🎉 **ARREGLADO** | ✅ | ⚠ N/A |
| **pedidos** | 🎉 **ARREGLADO** (+ `Moneda`) | ✅ sigue OK | ✅ | ⚠ N/A |
| **cobros** | 🎉 **ARREGLADO** (+ `Moneda`) | no evaluado | ✅ | ⚠ N/A |
| **depósitos** | 🎉 **ARREGLADO** (`Moneda`, con pérdida de datos) | no evaluado | ✅ | ⚠ N/A |
| **devoluciones** | ✅ funciona *(sin línea base)* | ✅ funciona *(sin línea base)* | ✅ | ⚠ N/A |

- 🎉 **El fix SÍ llegó a Isla Coche.** Los defectos que el **29/07** se midieron **en esta misma playa**
  están arreglados en **5 de 5 módulos** (inventarios, clientes potenciales, pedidos, cobros, depósitos),
  incluidos **3 que no estaban en el encargo**: el default de `Moneda` en pedidos, en cobros y en depósitos.
- 🔴🔴 **1 REGRESIÓN, y es grave:** `Limpiar` deja **visitas** inutilizable (§1.c). **S1.**
- ❌ **1 defecto que SIGUE FALLANDO igual:** el filtro `Coordenadas` contra su propia tabla (§1.a),
  con **los mismos números del 31/07** (0 vs 90 · 215 sin filtrar). **El fix no lo tocó.**
- 🔴 **1 defecto NUEVO** (no cubierto el 31/07): `Limpiar` no restablece `Coordenadas` (§1.b) —
  **el mismo defecto hallado hoy en La Tortuga**, así que **es de la versión, no de una playa**.
- ⚠ **`Limpiar` cambia la empresa: N/A estructural en las 7 pantallas.** El `<select>` `idEnterprise`
  trae **una sola empresa**; en visitas hay además un neutro `""`, y **tampoco salta a él**. No se forzó.

### 8.1 · Lo que hay que corregir del reporte del 31/07 antes de mandarlo a desarrollo

🔴 **La conclusión «los 3 defectos son propios de La Tortuga» debe retirarse.** No se sostiene:
1. El 31/07 **solo se probó `Limpiar`/ordenamiento en visitas y reportes** — los dos módulos que **ya
   estaban sanos el 29/07**. Nunca se re-midieron los 5 módulos donde el defecto vivía en esta playa.
2. El **29/07, en Isla Coche**, los defectos **sí se reprodujeron**, con cifras y Refs.
3. Hoy, esos 5 módulos **están arreglados en Isla Coche** ⇒ el fix **también aplicó acá**.

⇒ **Eran defectos de la versión, no de La Tortuga.**

---

## 9 · Respuesta a la pregunta abierta: ¿cuándo se repuntó Isla Coche a `main`?

**No se puede cerrar desde la web** (no hay versión ni build expuestos), pero esta corrida acota la ventana
mucho más que la huella de despliegue sola:

| Evidencia | Qué acota |
|---|---|
| Los defectos **se reprodujeron el 29/07** en Isla Coche (5 módulos, con cifras) | El fix **NO estaba desplegado el 29/07** |
| Los mismos defectos **están arreglados hoy (03/08)** sobre **los mismos datasets** | El fix **se desplegó entre el 30/07 y el 03/08** |
| `common.css` de Isla Coche: **23/07/2026** (La Tortuga: 16/07) | Hay **al menos un** empaquetado del 23/07; **no refuta** uno posterior (un WAR que solo recompile clases/XHTML no mueve la fecha de los estáticos) |
| El 31/07 «no se reprodujeron» | **No es evidencia de fecha**: no se probaron los módulos afectados (§0.bis) |

🔑 **Conclusión: la ventana del repunte a `main` en Isla Coche es 30/07 – 03/08**, y **no** el 23/07 como
sugeriría la huella de `Last-Modified` por sí sola. La hipótesis del encargo —«el fix ya estaba ahí el
31/07»— **queda descartada por la corrida del 29/07**, que es medición directa y no un argumento de fechas.

⚠ Lo que **sigue abierto** y solo desarrollo puede cerrar: la fecha exacta y **si el despliegue de Isla Coche
introdujo la regresión de `Limpiar` en visitas** (§1.c), que en La Tortuga **no se manifiesta**.

**Recomendación (2ª playa consecutiva):** exponer versión/build en el pie o en un "Acerca de".

---

## 10 · Patrones / selectores nuevos (insumo de consolidación)

| Patrón | Detalle |
|---|---|
| 🔑 **Coexisten TRES sufijos de form de filtros, también en Isla Coche** | `form:j_idt114` (inventarios · clientes potenciales · depósitos · **devoluciones**) · `form:j_idt115` (**pedidos** · **visitas**) · `form:j_idt116` (cobros). **Idéntico reparto al de La Tortuga hoy** ⇒ mismo XHTML en las dos playas |
| 🔑 **El botón Buscar NO es igual en todos** | `[id$=":btnBuscar"]` **solo en visitas** · `[id$=":ajax"]` en los otros 6 |
| 🔑 **El estado corrupto de un módulo vive en el BEAN DE SESIÓN y es POR MÓDULO** | Con visitas roto, **inventarios seguía funcionando**. No se limpia con `page.goto()`; **solo con cerrar sesión** |
| 🔑 **Cerrar sesión es la recuperación fiable** | El enlace `Cerrar Sesión` está **oculto** en un menú (clic de Playwright da timeout). Se dispara con `PrimeFaces.ab({s:<id>})`; el id (`j_idt40`) es autogenerado → localizarlo por texto |
| ⚠ **Los ids del paginador (`j_id19`/`j_id38`) cambian dentro del MISMO despliegue** tras un re-render | No solo cambian entre despliegues. Anclar por `select.ui-paginator-rpp-options` (hay 2: arriba y abajo) |
| 🔑 **Contador `Total de Resultados:` en visitas** | Independiente del tamaño de página ⇒ **es el conteo correcto para comparar**, evita la trampa de comparar vistas con paginación distinta |
| **El valor neutro de los desplegables no es uniforme** | `0` (`attachStatus`, `orderStatus`, `idEstatus`, `selectAttach`, `selectDispatch`) · `""` (`idCurrency`, `idTipo`, `idDep`, `idOrderType`, `idSalesmaView`, `clientSOM`, `idType`, `idMotive`, `idRol`) · **`-1`** (`selectCoordinadas`, el único, y el único que `Limpiar` no resetea) |
| **El `value` de Empresa no es uniforme** | `1` en visitas, inventarios, cobros, depósitos y devoluciones · **`00001`** en clientes potenciales y pedidos. Comparar como cadena |
| **`Limpiar` deja las fechas de dos maneras** | **Vacías**: visitas · clientes potenciales. **Rango por defecto de 3 días** (01/08–03/08, que suele dar 0 filas — la trampa): inventarios · pedidos · cobros · depósitos · devoluciones |
| ⚠ **«Fechas vacías» NO implica «0 resultados»** | En clientes potenciales `Limpiar` vacía las fechas y el listado **igual se repuebla**. Por eso el 0 de visitas es una avería, no el diseño |
| **Anclar el trigger como HIJO DIRECTO** | `[id="<id completo>"] > .ui-selectonemenu-trigger` — con `[id$=":campo"]` hay *strict mode violation* |
| **Antídoto de overlays antes de cada clic** | `document.querySelectorAll('.ui-selectonemenu-panel,.ui-datepicker,.ui-columntoggler').forEach(p=>{p.style.display='none';p.classList.add('ui-helper-hidden');})` |
| ⓘ **El typo `Fecha Devoluciòn` está en las DOS playas** | Es de la versión, no de una configuración |
| 🔑 **Escribir fechas con el `fill()` real de Playwright, no por JS** | Y **validar el método dentro de la misma sesión** antes de acusar a la aplicación: fue lo que permitió descartar el harness en §1.c |


