# Consolidado — DIFRANCA · evaluación GO / NO-GO al **tag 20**
## 8 módulos móvil + capa web completa (4 familias) · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-08-07 |
| **RUN_ID** | `20260807_120232_smoke-difranca-tag20` |
| **Cliente** | difranca — empresa de la corrida **DISTRIBUIDORA DIAZ HERNANDEZ** (`DDHP_A12`, id 2) |
| **Playa** | **El Yaque** (`denarioelyaque.ddns.net`) |
| **Versión** | **tag 20 — confirmado por QA** (APK y web). ⚠ Ver nota de trazabilidad abajo |
| **Dispositivo** | 14678405BR003855 (Infinix X6728, Android 15) |
| **Vendedor QA** | `***` — `login_user=VEND206` / `co_user=206` / `id_user=275` (Jose Raad), 148 clientes |
| **Tasa** | 752,0900 (US$ → BSD) · local **BSD**, fuerte **US$** |
| **Móvil** | **71 PASS · 0 FAIL · 38 N/A · 0 BLOCKED** |
| **Web** | **103 casos** — 73 OK · 8 FAIL · 3 FIELD-MISMATCH · 2 CALC-MISMATCH · 1 MISSING · 16 N/A |

**Propósito:** esta corrida **no fue una cacería de defectos**. Evalúa si difranca puede **actualizarse al tag
20 sin esperar la 21**. Por cada defecto conocido la pregunta fue: *¿le afecta a ESTE cliente, dadas sus VGs y
sus datos?*

> ⚠ **Trazabilidad de versión:** la app **no permite verificar el tag** — `versionName=1.0`,
> `versionCode=1`, `localStorage.versionApp=1.0`, idénticos a builds anteriores de otros clientes. La
> confirmación de que es tag 20 **la dio QA**, no el artefacto. **Sugerencia para desarrollo:** que
> `versionName` refleje el tag haría trazable cualquier corrida.

## Alcance

| Módulo | Casos | PASS | FAIL | N/A | Estado |
|--------|-------|------|------|-----|--------|
| Login | 6 | 6 | 0 | 0 | ✅ |
| Clientes | 12 | 12 | 0 | 0 | ✅ |
| Pedidos | 14 | 14 | 0 | 0 | ✅ |
| Cobros | 34 | 0 | 0 | 34 | 🔒 solo lectura (decisión de QA) |
| Devoluciones | 14 | 13 | 0 | 1 | ✅ |
| Visitas | 16 | 14 | 0 | 2 | ✅ |
| Productos | 10 | 9 | 0 | 1 | ✅ |
| Vendedores | 3 | 3 | 0 | 0 | ✅ |
| **Inventarios** | — | — | — | — | ⛔ **no aplica**: `clientStock=false` apaga el módulo |
| **Depósitos** | — | — | — | — | ⛔ **no se corre**: decisión de QA (no lo usan) + sin efectivo en `colletionPayment` |
| **TOTAL** | **109** | **71** | **0** | **38** | **0 BLOCKED · 0 cuelgues de CDP** |

## Registros creados y verificados (móvil → BD → web)

| Módulo | Ref | Detalle | BD | Web |
|--------|-----|---------|----|-----|
| Clientes | **60** | cliente potencial · epoch `1786120036250.0` | BD-OK | WEB-OK |
| Pedidos | **39795** | 2 líneas · 7,28 US$ | BD-OK | WEB-OK |
| Pedidos | **39796** | **55 líneas** · 1.775,36 US$ = 1.335.230,50 BSD | BD-OK | WEB-OK |
| Devoluciones | **878** | CAR755 · lote `LOTE-QA-2026` · venc. 15/03/2027 | BD-OK | WEB-OK |
| Visitas | **28223** | CAR755 · 1 incidencia | BD-OK | WEB-OK |

**Los 5 con empresa efectiva `DDHP_A12` / id 2**, verificada en UI, payload y nube. Nada quedó pendiente de
envío manual.

---

# 🔴 VEREDICTO: **NO-GO** al tag 20

> **Resuelto el 2026-08-07 con la prueba decisiva.** La QA creó 2 cobros IGTF más a propósito (21835 BSD en
> DDHP_A12 y 21836 **USD en DIFRANCA**, este último guardado→reabierto→enviado). **Los 3 rompen la lista.**
> La medición que lo cierra: el filtro **`Tipo Cobro = IGTF`** da **2 contados / 0 pintados**, mientras
> Cobros (17.871), Anticipo (214) y **Retención (1/1)** pintan perfecto.
> ⇒ **Es el TIPO `co_type=3`, no un registro corrupto.** Descartadas moneda, empresa y flujo de creación;
> en BD los 3 son idénticos en estructura, con clientes y montos muy distintos.
> **Impacto:** 2 de las 3 empresas del tenant quedaron con Cobros en blanco (DDHP_A12 **18.086/0** ·
> DIFRANCA **1.166/0**), arrastrando cobros sanos. **Sin workaround:** borrar el dato no evita el próximo
> IGTF, que emiten desde el móvil con `userCanSelectIGTF=true`.
> 🔑 **Pista para desarrollo:** el `<select>` `Tipo Cobro` trae **`IGTF` duplicada, las dos con `value=3`** —
> único tipo duplicado del catálogo y único que no pinta.
> Detalle completo en `web-igtf-causa.md`.

## Recomendación

**NO actualizar a la 20 mientras `userCanSelectIGTF=true`.** Dos caminos si urge subir:
1. **Apagar `userCanSelectIGTF`** en difranca ⇒ el defecto queda sin disparador (pero pierden el flujo IGTF).
2. **Esperar el fix**, que **no está en la 21** — nadie conocía este defecto hasta hoy.

---

# Detalle del análisis GO / NO-GO

## Lo que NO bloquea

**El móvil está limpio: 0 FAIL en los 8 módulos.** Toda la operación del vendedor —crear clientes, pedidos,
devoluciones y visitas— funciona y persiste correctamente.

**Se descartó el reporte de campo de "más de 50 productos cuelga la app"** (ver más abajo).

**8 defectos conocidos de la 20 NO le aplican a difranca**, descartados con evidencia dura antes de correr:
los dos de IVA en pedidos (**0 de 181.864 líneas con IVA**, y en UI es imposible: el control no existe), los
dos de conversión de descuentos (**0 de 19.771 cobros con descuento**), los de visitas con ruta
(`visitRout=false`), firma de visitas (`signatureVisit=false`), banco en depósitos (sin efectivo) y lote en
inventarios (`clientStock=false`).

## Lo que sí pesa

### 🔴 1 · `COB-LISTA-RENDER-VACIO` — la lista web de cobros se vacía **(NUEVO)**

El cobro **21831** —**único `co_type=3` (IGTF) de toda la base**, creado hoy por QA— hace que **cualquier
búsqueda de cobros que lo incluya devuelva el `<tbody>` vacío**:

| Búsqueda | Contados | Mostrados |
|---|---|---|
| Sin filtros | **18.086** | **0** |
| Rango que lo excluye | 61 | 50 ✅ |
| Moneda US$ (lo excluye) | 62 | 50 ✅ |
| Moneda BSD (lo incluye) | 4 | **0** |
| Por `# Ref` 21831 | 1 | **0** |

**Reproduce 10/10 — determinista, no intermitente.** Y es **del servidor**: la respuesta ajax cruda trae
literalmente `<tbody id="form:cobrosDT_data"></tbody>` con el paginador y el total correctos.

**Atenuante:** **el móvil NO lo sufre** — lista los 100 cobros con el 21831 incluido, rotulado `IGTF ·
Enviado`, y el detalle abre y cuadra 1:1 con la nube. **El defecto es exclusivo de la web.**
**Agravante:** **`userCanSelectIGTF=true` está encendido.** Nunca habían emitido un IGTF (hay uno solo, el de
hoy), pero el día que emitan el primero en producción **la consulta web de cobros se cae entera** — y cobros
es su módulo más usado, con 19.771 registros.

✅ **RESUELTO — es el TIPO.** Con 3 IGTF en la BD, los 3 rompen la lista; el filtro `Tipo Cobro=IGTF` da
**2 contados / 0 pintados**. Moneda, empresa y flujo de creación descartados. **Severidad: BLOQUEANTE.**

### 🟠 2 · `VIS-VISITADO-SIN-FECHA-INICIO` — conocido, y **sí les pega**

Al **Guardar**, `daInitial` se puebla; al **Enviar se vacía**. La fila queda en la nube con `is_visited=true`
y `da_initial=NULL`. Es el único defecto conocido con impacto real de negocio en este cliente.

### 🟠 3 · `COB-RET-TOTAL-CERO` — conocido, reproduce **sobre datos creados hoy en tag 20**

El detalle web de un cobro de retención imprime `Total Monto a pagar: 0,00`:
`21829`: IVA 1.000,00 + ISLR 500,00 = **1.500,00** ✅ en lista y BD, **0,00** en el detalle.
`21826`: 500,00 + 400,00 = **900,00** ✅ en lista y BD, **0,00** en el detalle.

**Localización nueva y accionable:** el cero está **solo en el pie de `detalleCobro` con `co_type=2`**. La
lista muestra bien, la BD guarda bien, y `co_type=0` imprime su total correcto. **Lo que la app manda y
persiste ya está sano en tag 20; queda roto el render del detalle.**
⚠ **difranca sí usa el flujo:** tiene 3 retenciones, 2 creadas hoy.

## Hallazgos NUEVOS — no estaban en el registro de defectos conocidos

🔴 **Ninguno de estos está corregido en la 21**, porque nadie los conocía. Eso cambia el razonamiento: no
alcanza con preguntarse si aguantan hasta la 21.

| # | Hallazgo | Impacto |
|---|---|---|
| **N1** | **`COB-LISTA-RENDER-VACIO`** (arriba) | 🔴 alto — pendiente dirimir tipo vs registro |
| **N2** | **`DEV-WEB-ESTATUS-VACIO-HISTORICO`** — **793 de 795** devoluciones sin estatus en la lista web. La lista lee `transaction_statuses` (solo 2 filas) en vez de `st_return`, poblado en las 795. **No es regresión**: tag 20 es la primera versión que puebla esa tabla | 🟠 medio |
| **N3** | **`PED-STATUS-CONTRADICE-COLUMNA`** — el filtro `Status` de pedidos consulta `transaction_statuses` (1.383 filas para 15.517 pedidos) mientras la columna se pinta desde `order.st_order`. 2.049 filas dicen "Enviado" y el filtro devuelve 1 | 🟠 medio |
| **N4** | **`DEV-LISTA-ESTATUS-VACIO`** (móvil) — estatus en blanco en 3 de 6 devoluciones sincronizadas. Causa aislada en vivo: `naStatus` llega a veces objeto y a veces string, y la plantilla lee `naStatus.na_status` | 🟠 medio |
| **N5** | **Causa raíz de `CLT-VENDEDOR-SIN-APELLIDO`** — la web pinta `users.name_user` e ignora `users.lastname_user`, que **sí está poblado**; `salesman_view.na_user` ya trae el nombre completo. Jose Raad y Jose Ibarra quedan indistinguibles | 🟡 bajo |
| **N6** | Adjuntos de un registro de 2024 **no descargan** (uno de hoy tarda 315 ms) | 🟡 bajo |
| **N7** | Menores de filtros: opción **IGTF duplicada** en el selector de tipo · selector de **Tipo de Pedido sin opciones** · **`Limpiar` inconsistente** entre módulos · **filtros que persisten en sesión** · rótulo `USD` vs `US$` según empresa | 🟡 bajo |

> ⚠ **Dos hallazgos iniciales fueron REFUTADOS al revalidarlos** y no se reportan:
> **`PED-LISTA-SUBCONJUNTO`** (parecía que la web devolvía 1 de 2.049 — era un `Moneda=BSD` **persistido en
> sesión** que nadie seleccionó; con panel limpio da 2.049 == BD) y la **búsqueda con tilde en productos**
> (0 de 1.487 productos tienen acentos; el nombre real es `BaNo`).
> 🔑 Ambos siguen el patrón ya documentado en el proyecto: **filtros JSF persistidos + ajax no esperado**.

## Defectos conocidos: veredicto por cada uno

| Defecto | ¿Aplica a difranca? | Veredicto |
|---|---|---|
| `PED-IVA-CONV-DIV-CANTIDAD` · `PED-IVA-LINEA-NULL` | ❌ no | 0 de 181.864 líneas con IVA; en UI **no existe el control** |
| `COB-WEB-DCTO-CONV-MULTIPLICA` · `-ETIQUETA` | ❌ no | 0 de 19.771 cobros con descuento · `tolerancia0=false` |
| `VIS-WEB-SIN-ICONO-ADJUNTO` | ❌ no | `visitRout=false` — confirmado en UI |
| `VIS-FIRMA-NO-OBLIGATORIA` | ❌ no | `signatureVisit=false` |
| `DEP-WEB-BANCO-SIN-NOMBRE` | ❌ no | sin efectivo ⇒ no usan depósitos |
| `INV-WEB-SIN-LOTE-VENCIMIENTO` | ❌ no | `clientStock=false` |
| **`VIS-VISITADO-SIN-FECHA-INICIO`** | ✅ **sí** | 🔴 **reproduce, impacto real** |
| **`COB-RET-TOTAL-CERO`** | ✅ **sí** | 🔴 **reproduce** — acotado al pie de `detalleCobro` con `co_type=2` |
| **`VND-KPIS-SIN-SEGMENTAR`** | ✅ **sí** | `Cartera Clientes` **sí** segmenta (178/33/1, exacto), pero **`Clientes Activados` = 7 idéntico en las 3 empresas**. En DH VITAL son 7 activados sobre cartera de **1** — imposible. Desinforma, no bloquea |
| `VIS-FECHA-MAS-4H` | ✅ sí | reproduce, **cosmético**: pinta UTC como local; el dato no se corrompe |
| `PRD-BUSCADOR-NO-REPUEBLA` | ✅ sí | reproduce (**3.ª playa** ⇒ universal). Workaround trivial |
| `VIS-GUARDAR-NO-IDEMPOTENTE` | ❌ **no** | **NO reproduce** — probado en dos sabores; `sqlite_sequence` prueba que es UPDATE, no delete+reinsert |
| `VIS-WEB-LISTA-DUPLICA` · `WEB-ORDENAMIENTO-NO-ORDENA` | ❌ no | no reproducen |
| Conversión que multiplica en vez de dividir | ❌ no | **41/41 conversiones correctas** en ambas direcciones |
| `Total Depósitos` sin formato · fecha ISO cruda en retención | ✅ sí | cosméticos (2 de 113 pagos · 3 cobros en toda la BD) |

---

# Respuestas a los reportes de campo

## "Los pedidos con más de 50 productos cuelgan la app" — **REFUTADO**

Se montó un pedido de **88 líneas** y otro de **55 que se envió**. **No hay cuelgue**, ni de app ni de CDP.

**La curva es plana:** agregar la línea 88 tardó lo mismo que la línea 3 (~430 ms expandir + ~610 ms
recalcular). Las líneas 48→55, ya cruzado el umbral, fueron **las más rápidas** (1.835 ms/línea vs 2.356-2.601
al inicio). Totales exactos al céntimo en los 11 tramos. Memoria constante en 117 MB.

**El envío tampoco cuelga:** POST en **6,4 s**, congelación máxima **773 ms**, llegó completo (55/55 líneas,
`nu_details=55`, total 1.335.230,50 BSD = 1.775,36 US$ × 752,0900, exacto línea a línea).

**Lo que sí es real, y probablemente sea lo que reporta el campo:**
1. **Guardar** con 87 líneas ocupa el hilo **~4,9 s** persistiendo en SQLite ⇒ el teléfono se ve tildado.
   **Guardar es más pesado que Enviar** (4,9 s vs 773 ms): el cuello es SQLite, no el POST.
2. 🔑 **El "50" no corresponde a ningún umbral del carrito, pero coincide exacto con el tamaño de página del
   catálogo.** La lista muestra 50 productos y tarda **5-7 s** en traer el resto al seguir bajando.
   **Vale preguntar a quien lo reportó si el cuelgue les pasa BUSCANDO productos, no con el pedido cargado.**

---

# Correcciones al perfil `difranca.yaml`

| VG | El perfil decía | **Real (medido en UI)** |
|---|---|---|
| `orderEnterpriseEnabled` | false | 🔴 **true** — pedidos **sí** tiene selector de empresa, habilitado |
| `longitudComentario` | (255) | **120** — lo fija una constante de la APK, no la VG (medido: 328 tecleados → 120) |
| `userCanSaveGPS` = false | "no guarda coordenada" | **la coordenada SÍ viaja** al payload y a la nube; la VG gobierna el flag `coordenadaSaved`. Confirmado en 2 módulos |
| `validateWarehouses` = false | ⚠️VERIFICAR (la única donde ganaba el override) | ✅ **confirmada** — 999 uds sobre inventario 665, sin alerta ni bloqueo |
| `userCanSelectProductDiscount` · `validateNuOrder` · `userCanSelectIVA` | false | ✅ **confirmadas** en UI |
| `expirationBatch` = true | (obligatorio?) | los campos **se renderizan pero NO son obligatorios** en devoluciones — **alcance por módulo** |

# Observaciones generales

1. **El selector de empresa VARÍA POR MÓDULO** (3.ª confirmación en la serie): en CLIENTES llega
   `value=null` + `ng-invalid` ⇒ **obligatorio**; en PEDIDOS, DEVOLUCIONES y VISITAS llega **preseleccionado**.
   **Leerlo, nunca asumirlo.**
2. **La empresa borrada `DDH_A12` (`co_operation='D'`) no bajó al device ni aparece en la web.** El filtro
   funciona. No es hallazgo.
3. **El BUSCAR de cobros del móvil SÍ descarga del servidor** — muestra los **100 cobros más recientes del
   vendedor** (0,51 % de 19.771), con `id_collection` del servidor y `st_delivery=1`.
   ⚠ **Contradice el hallazgo de el_palmar** (donde era historial 100 % local) ⇒ **no es universal, hay que
   verificarlo por playa**.
4. **La inmediatez del sync es por MÓDULO, no por servidor:** mismo dispositivo y mismo minuto, pedidos
   inmediato y devoluciones diferido 5-12 min.
5. **`st_*` no es traducible por catálogo en este cliente:** los 19.771 cobros tienen `st_collection=1`,
   inexistente en `statuses`. Fuente confiable: `transaction_statuses` con `co_status='env'` — que **no tiene
   filas para `vis`**, así que en visitas se usó `st_visit` crudo.
6. **Los catálogos filtran bien la basura `co_operation='D'`** — verificado id por id en devoluciones
   (3 tipos, 24 motivos) y visitas (4 actividades).
7. El mojibake `U+FFFD` en nombres de estructura (`CUIDADO DE U�AS`) **ya viene de la nube** — calidad de dato
   del cliente, no del tag 20.

⚠ **Nota de seguridad para el proceso:** `browser_run_code_unsafe` **devuelve en su respuesta el código
cargado**, así que el rodeo para no exponer las credenciales web **no funcionó** y quedaron en el transcript.
**Conviene fijar una política explícita de login web** antes de la próxima corrida.

## Reportes individuales

- Móvil: [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md) · [Cobros](cobros.md) ·
  [Devoluciones](devoluciones.md) · [Visitas](visitas.md) · [Productos](productos.md) · [Vendedores](vendedores.md)
- Pruebas dirigidas: [Carga 88 líneas](prueba-carga-pedidos-50.md) · [Pedido 55 enviado](pedido-55-lineas-enviado.md)
- Web: [F## filtros](web-F-filtros.md) · [Revalidación](web-revalidacion-20260807.md) ·
  [C## cotejo](web-C-cotejo.md) · [M/A/D](web-M-A-D.md)

---
*Generado por Claude Code · Orquestador Smoke · 2026-08-07*
