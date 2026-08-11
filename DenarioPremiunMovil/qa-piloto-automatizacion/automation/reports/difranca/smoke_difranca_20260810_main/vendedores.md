# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `smoke_difranca_20260810_main` |
| Módulo | VENDEDORES (solo lectura) |
| Dispositivo | El Yaque · CDP `127.0.0.1:9220` |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db_version 19 · build **main** `99b138fa` |
| Playa / tenant | EL YAQUE / **difranca** |
| Empresas | DDHP_A12 (id 2) · DIF_A12 (id 3) · DHVITAL01_A (id 4) |
| Vendedor QA | `VEND206` / `co_user` 206 / **id_user 275** — **NO está de baja** (`co_operation='I'`) |
| Runtime | `window.ng=TRUE` · `sqlitePlugin` disponible · `infoVendedores=false` |
| Resultado (casos del guion) | **3 PASS · 0 FAIL · 0 BLOCKED · 0 N/A** |
| Hallazgos fuera del guion | **1 defecto NUEVO** (`VND-CARTERA-CUENTA-DESASIGNADOS`, no bloqueante) · **1 conocido reproducido** (`VND-KPIS-SIN-SEGMENTAR`) |
| Estado final | **HOME** ✅ (0 alerts / 0 loadings / 0 modals) |

> El ledger `_results.jsonl` lleva **5 líneas** de este módulo: los 3 casos `PASS`, el defecto nuevo como
> `FAIL` (`VND-CARTERA-CUENTA-DESASIGNADOS`) y el conocido como `SKIP` con nota (RUNTIME §5 prohíbe
> re-marcarlo FAIL). Los 3 casos del guion pasan **por su propio criterio**: el defecto no lo detecta el
> guion, lo detecta el cotejo de KPIs contra BD.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Tile `Vendedores` → `/vendedores` en 5,5 s; `app-vendedores` visible, `<h1>Vendedor</h1>`, **3 acordeones** rotulados `*DISTRIBUIDORA DIAZ` / `DIFRANCA C.A` / `DISTRIBUIDORA DH VI`; overlay desapareció, 0 alerts |
| DM-VND-002 | ✅ PASS | Expandir: `grp.multiple=true` + `grp.value=[3 values]` + `ionChange` → los 3 `accordion-expanded`, `[slot=content]` **0 → 281 px**, **KPIs POBLADOS**. Contraer: `grp.value=undefined` → los 3 `accordion-collapsed`, altura **281 → 0 px** |
| DM-VND-007 | ✅ PASS | `img.fechaAtras` (`iconosatras.png`, x=10, **sin `<a>` padre**) → `mouse.click(31.7, 31.2)` → `/home` con los 12 tiles; `app-vendedores` ya no visible |

**Verificación BD: `BD-N/A` (módulo de solo lectura — no crea registros).** El cotejo de BD que sí se hizo es
de **oráculo de KPIs**, no de persistencia: está en Hallazgos.

---

## Registros creados en sistema

Ninguno — módulo de solo lectura. El baseline de `collection`/`order`/`return`/`visit` no fue tocado por este agente.

---

## 🔴 La pregunta del run: ¿el MÓVIL oculta a los vendedores dados de baja?

**Respuesta: el móvil NO tiene dónde ocultarla — no lista vendedores en absoluto. El defecto de
`salesman_view` es EXCLUSIVO DE LA WEB, no compartido.**

Evidencia medida, en tres planos independientes:

1. **No hay superficie de listado en la UI.** Dentro de `app-vendedores`: **0 `ion-select`**, **0 `ion-searchbar`**,
   **0 `ion-input`**, **0 `ion-button`**; los únicos 3 `ion-item` son las cabeceras de los acordeones de empresa.
   El heading es `<h1>Vendedor</h1>` — **singular**. El módulo muestra **al vendedor logueado y a nadie más**,
   con un acordeón por empresa.
2. **El modelo Angular tampoco trae otros vendedores.** `comp.userInfo` = **3 entradas**, todas con
   `idUser:275` / `coUser:"206"` — una por empresa (DDHP_A12 / DIF_A12 / DHVITAL01_A), no una por vendedor.
   `comp.empresas` = las 3 empresas. No existe ninguna colección de usuarios.
3. **El dispositivo ni siquiera descarga un padrón de usuarios.** La BD local (`sqlitePlugin`, base
   `denarioPremium`, **87 tablas**) **no tiene tabla `users` ni `salesman` ni equivalente**
   (`WHERE name LIKE '%user%' OR '%salesman%' OR '%vend%'` → solo 3 resultados, ninguno un padrón). Las únicas con "user"
   en el nombre son `user_address_clients`, `user_product_favs` y `user_informations` — y esta última
   (`id_user, co_user, title, content, co_enterprise, id_enterprise`) es de **avisos**, no de vendedores, y
   está **vacía (0 filas)**.

⇒ **Dayana Acuña (`id_user` 283, `VEND714`, `co_operation='D'`) no aparece en el móvil, pero tampoco aparece
ningún otro vendedor.** No es el mismo defecto: en la web el combo *tiene* que listarla y la saltea; en el
móvil no hay combo. **Si desarrollo arregla `salesman_view`, el móvil no requiere cambio en este módulo.**

**Corolario operativo (para QA, no es defecto del móvil):** los **93 pedidos (100.420,72) + 157 cobros +
377 visitas** de Dayana Acuña tampoco son alcanzables desde el móvil — pero ahí es **por diseño** (cada
vendedor ve solo su propia cartera), no por un filtro roto. Quedan huérfanos en las dos capas, por causas
distintas. Recuperarlos es un problema de la web.

Confirmado en BD nube (`difranca`): **283 es el ÚNICO usuario de baja del tenant** (`users`: D=1, I=33).
`salesman_view` filtra por `co_operation<>'D'` en sus **4 JOINs** (`users_data`, `users`, `users_enterprise`,
`role_user`) y emite **1 fila por (usuario × empresa)**. El vendedor QA 275 **sí** figura en la vista, con 3 filas.

---

## Hallazgos

### 🔴 H1 · NUEVO — `VND-CARTERA-CUENTA-DESASIGNADOS`: la Cartera Clientes cuenta clientes que ya no son del vendedor

**Severidad: media. NO bloquea la operación** (KPI informativo, solo lectura; el vendedor puede trabajar igual).
Pero **corrompe la medición de desempeño** y es el mismo síntoma que el defecto de web ya confirmado por QA.

| Empresa | Cartera que muestra el móvil | Clientes reales (vivos) | Diferencia |
|---|---:|---:|---:|
| DDHP_A12 (`*DISTRIBUIDORA DIAZ`) | **178** | **148** | **+30** |
| DIF_A12 (`DIFRANCA C.A`) | **33** | **21** | **+12** |
| DHVITAL01_A (`DISTRIBUIDORA DH VI`) | **1** | **1** | 0 |
| **Total** | **212** | **170** | **+42** |

**Mecanismo identificado:** el KPI cuenta `client_template_user` **sin filtrar `co_operation<>'D'`**.
En BD nube, para `co_user='206'`: vivos 148/21/1, borrados 30/12/0 → **total sin filtrar = 178/33/1**, que es
**exactamente** lo que muestra la app. Los 42 de más son **asignaciones dadas de baja** (clientes que ya no
le corresponden). `salesman_view` sí aplica ese filtro; este KPI no.

**🔑 La evidencia más fuerte es auto-contenida — la app se contradice a sí misma, sin mirar la nube:**
la BD **local del propio dispositivo** tiene `SELECT co_enterprise, count(*) FROM clients GROUP BY 1` →
**DDHP_A12 148 · DIF_A12 21 · DHVITAL01_A 1 · total 170**. El vendedor **solo puede vender a 148 clientes en
DDHP_A12**, y la misma pantalla le dice que su cartera es de 178. No hace falta acceso a BD para reproducirlo.

**Familia:** es el gemelo móvil de **`REP-ACTIVACION-CLIENTES-CIFRAS-MALAS`** (web, `confirmado`, verificado a
mano por QA el 2026-07-31), cuyo texto dice literalmente que *"la cartera de clientes por vendedor no cuadra"*.
Este run aporta **el mecanismo concreto** (falta el filtro `co_operation<>'D'`) y números duros. Si desarrollo
toma uno, es plausible que sea **un solo arreglo en el servicio de métricas**.

⚠ **Corrige una conclusión previa del perfil:** `difranca.yaml` afirma que *"`Cartera Clientes` SÍ se segmenta
bien (178/33/1, exacto contra `client_template_user`)"*. La segmentación **por empresa** es correcta, pero el
**valor** no lo es: el cotejo del 2026-08-07 se hizo contra `client_template_user` **sin filtrar borrados**.
Actualizar el YAML a **148/21/1** como cartera correcta.

### 🔴 H2 · CONOCIDO — `VND-KPIS-SIN-SEGMENTAR` REPRODUCE en `main`

Ya registrado en `defectos-conocidos.yaml` (estado `mapeado_sin_reportar`, severidad media). **No se re-marca
FAIL.** **No bloquea la operación.** Se reporta la reproducción porque aporta **la aritmética exacta** que faltaba.

KPIs leídos con los 3 acordeones abiertos (`[slot=content].innerText`):

| KPI | `*DISTRIBUIDORA DIAZ` | `DIFRANCA C.A` | `DISTRIBUIDORA DH VI` |
|---|---:|---:|---:|
| Días Hábiles / Transcurridos / Restantes | 21 / 6 / 15 | 21 / 6 / 15 | 21 / 6 / 15 |
| Cartera Clientes | 178 | 33 | 1 |
| **Clientes Activados** | **10** | **10** | **10** |
| Clientes Nuevos | 0 | 0 | 0 |
| Clientes Nuevos Activados | 0 | 0 | 0 |

- **Oráculo sin BD, vigente:** en `DISTRIBUIDORA DH VI` → **Activados 10 > Cartera 1**, aritméticamente
  imposible (activados ⊆ cartera). El absurdo **se mantiene con la cartera corregida de H1** (1 sigue siendo 1),
  así que los dos defectos son **independientes**: H1 infla el denominador, H2 no segmenta el numerador.
- **🆕 Aritmética que identifica la causa:** clientes distintos del vendedor 275 **con pedido en agosto 2026**,
  por empresa en BD nube = **9 (DDHP) + 0 (DIF) + 1 (DHVITAL) = 10**. El KPI **no está roto ni es aleatorio:
  es el TOTAL GLOBAL del vendedor, calculado sin el filtro de empresa y repetido idéntico en los 3 acordeones.**
  (La definición "pedidos del mes" queda así prácticamente confirmada: la alternativa pedidos+cobros daba
  34/1/1 = 36, que no coincide con nada de lo mostrado.)
- La segmentación es **parcial** y hay que comparar **KPI por KPI**: `Cartera Clientes` sí varía por empresa
  (178/33/1); `Activados`/`Nuevos`/`Nuevos Activados` no. Un chequeo tipo *"¿los 3 acordeones muestran lo
  mismo?"* da **falso negativo**.

### ⓘ H3 · OBSERVACIÓN (no FAIL) — el bloque Cuota Mes / Venta Real Mes no se renderiza, teniendo el dato

**No bloquea. No se levanta como defecto** (falta conocer la condición del `*ngIf` y el build v6.6.18 sí lo
mostraba con cuota 0 — puede ser variante de template, no regresión). Se deja registrado por si desarrollo
lo revisa junto a H1/H2, ya que **es el mismo servicio de métricas**.

`comp.userInfo[i].planesCuotaEmpresa` **llega poblado** (16 / 4 / 14 filas) con `cuotaMes` y `ventaRealMes`
por unidad, pero el `[slot=content]` **no muestra ninguna línea de cuota ni de venta** (`/cuota|venta/i` sobre
el `innerText` → **false**; quedan **24 / 12 / 22** comentarios `<!--container-->` = `*ngIf` suprimidos).
Datos que están y no se ven, para DDHP_A12: `ventaRealMes` **12.567.473,95 `BSD`** y **16.717,45 `US$`**;
para DHVITAL01_A **854.133,57 `BSD`** y **1.135,68 `US$`**. Todas las `cuotaMes` valen **0** (sin presupuesto
cargado) — hipótesis más probable de la supresión, no verificada.

**Nota de moneda (punto 4 del brief):** el módulo **no muestra ningún monto en pantalla**, así que la trampa
`US$` (2) vs `USD` (3) **no puede materializarse en esta UI**. En el modelo interno los códigos llegan
**correctos y por empresa**: DDHP_A12 → `US$`, DIF_A12 → **`USD`**, DHVITAL01_A → `US$`, coherente con
`enterprises.co_currency_default` de la BD local. **Sin defecto de moneda en este módulo.**

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **`comp.userInfo` VUELVE a estar poblado en `main` — corrige la nota de `[difranca-20260807]`** | universal (build) | El 2026-08-07 llegó **`[]`** con los KPIs completos y se concluyó "no es fiable". En `main` (`99b138fa`) llega con **3 entradas** (1 por empresa, todas `idUser:275`), y **coincide 1:1 con lo renderizado**. ⇒ La regla correcta no es "userInfo no sirve", sino **"leer el `[slot=content]` como oráculo primario y usar `userInfo` solo como corroboración"**: puede estar vacío sin que la UI lo esté. La propiedad además **no aparece en `Object.keys(comp)` hasta que el servicio responde** (primera lectura: `compKeys` sin `userInfo`; segunda: con `userInfo` y `observador`) ⇒ **no concluir "no existe" de un `Object.keys` temprano.** |
| 🔴 **Oráculo de KPIs sin salir del dispositivo: `clients` local vs `Cartera Clientes`** | universal | `SELECT co_enterprise, count(*) FROM clients GROUP BY 1` en la BD local da la cartera **efectiva** que la app tiene sincronizada. Compararla contra el KPI detecta el desfase **sin acceso a la nube y sin GRANT**. Es lo que probó H1 (148 local vs 178 en pantalla). **Hacerlo siempre en este módulo: cuesta una consulta.** |
| **El dispositivo NO sincroniza padrón de usuarios/vendedores** | universal | **87** tablas locales y **ninguna** `users`/`salesman`. `user_informations` existe (`id_user, co_user, title, content, co_enterprise, id_enterprise`) pero es de **avisos** y está **vacía**. ⇒ Cualquier defecto de "listado de vendedores" es **estructuralmente imposible en el móvil**: no gastar navegación buscándolo. |
| **Expandir los N acordeones a la vez + `applyChanges`** | universal | `grp.multiple=true` + `grp.value=[...todos]` + `ionChange` → esperar ~1,6 s → `window.ng.applyChanges(comp)` → ~1,2 s. Lee y compara las N empresas **en una sola llamada**; imprescindible para diagnosticar segmentación. Contraer: `grp.value=undefined` + `ionChange`. Reconfirma `[difranca-20260807]`. |
| **Back de `app-vendedores`: `img.fechaAtras` sin `<a>`** | universal | Reconfirmado en `main`: 2 instancias, ambas `hasAnchor:false`. La buena es `iconosatras.png` en **x=10** (centro **31,7 / 31,2**); la de **x=302** es `vendedoresNuevoBlanco.svg` decorativa. `h.clickBack` (que hace `closest('a')`) **falla**. Filtrar por `src` + `x<100`. |
| ⚠ **En `main` NO quedó ningún `ion-loading` visible al entrar a `/vendedores`** | cliente/build | `[el_palmar-20260805]` y `[difranca-20260807]` reportaban 1 loading visible que exigía `dismiss()`. En este build entró limpio (`loadings:0`) tras ~3,5 s. El `dismiss()` de visibles sigue siendo inocuo — mantenerlo, pero **no** asumir que hay uno. |
| **Altura expandida con KPIs poblados = 281 px** | universal | Reconfirma la escala: **0** colapsado · ~20 px expandido-vacío · **281 px** poblado (el_palmar, globalmp, difranca ×2) · 393 px (ferrenuestro). **No usar umbrales altos.** |
| **Acordeones rotulan `lb_enterprise` truncado a 19 chars** | cliente | Reconfirmado: `*DISTRIBUIDORA DIAZ` / `DIFRANCA C.A` / `DISTRIBUIDORA DH VI`. Cotejar contra `lb_enterprise`, nunca `na_enterprise`. |

---

## Para actualizar en el perfil (`automation/clientes/difranca.yaml`)

1. `modules.vendedores`: la cartera correcta del vendedor QA es **148 / 21 / 1**, no 178 / 33 / 1. El comentario
   *"`Cartera Clientes` SÍ se segmenta bien … exacto contra `client_template_user`"* debe corregirse: se cotejó
   **sin filtrar `co_operation='D'`**.
2. Retirar la nota *"`comp.userInfo` llegó vacío ⇒ NO usarlo de oráculo"* y sustituirla por la formulación
   matizada de la tabla de patrones (oráculo primario = `[slot=content]`).
3. `vgs.infoVendedores: false` — **reconfirmado en runtime** en `main` (`ng.getComponent(app-vendedores).infoVendedores`).
   El módulo aparece y lista igual: el ⚠️VERIFICAR asociado queda **cerrado**.
