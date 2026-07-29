# Propuesta — Validación cruzada móvil → web (Denario Premium web)

> **Estado:** propuesta para revisión del equipo QA. **NO aplicada.** Gobernanza `MANUAL-CORRIDAS.md §6`.
> **Fecha:** 2026-07-28 · **Autor:** análisis técnico Claude Code · **Alcance:** `qa-piloto-automatizacion/`
> **Pedido de QA:** validar en la web los **mismos módulos transaccionales** que la corrida móvil ejecuta —
> visitas, pedidos, cobros, clientes potenciales, depósitos, inventarios, devoluciones — comprobando que
> **todos los datos llegaron como deben** y que **los cálculos son correctos**. El resto de módulos de la web
> queda **fuera de alcance** por ahora (haría la corrida demasiado pesada).

---

## 0. TL;DR

1. **No hace falta ningún MCP nuevo.** El `@playwright/mcp` que ya está configurado sirve tal cual. Lo único
   que cambia es *cómo* se conecta: hoy `connectOverCDP(:9220)` al WebView del dispositivo; en web, un
   `browser_navigate` a la URL. Verificado hoy: las **3 playas responden HTTP 200** desde esta laptop, sin VPN.
2. **El encuadre correcto no es "una segunda corrida transaccional en la web".** Es la **3ª pata del oráculo**
   que ya existe: `móvil (UI) → BD (nube) → **web (UI)**`. El agente web **no crea nada**: busca los registros
   que la corrida móvil acaba de crear y los coteja. Read-only ⇒ sin datos basura, sin riesgo, sin permisos de
   escritura.
3. **La corrida móvil ya deja hecho el trabajo difícil.** El manifiesto (`_payloads.jsonl` / `_bd-manifest.jsonl`)
   trae el **Nro.Ref = `id_<x>` = PK del servidor** (correlación ya CONFIRMADA, `RUNTIME §10`). El agente web
   sabe exactamente qué documento buscar → **cero discovery**, que es justo donde se va el tiempo.
4. **Lo que solo la web puede cazar** (y el cotejo BD no): **(a)** un registro que está bien en BD pero la web
   **no muestra o muestra mal** (filtros, permisos por vendedor, fechas, estatus); **(b)** los **recálculos del
   servidor web** — totales, IGTF, retención, conversión de moneda, saldo del cliente — que pueden diferir de
   lo que el móvil envió. **(b) es exactamente el objetivo declarado por QA.**
5. **Esfuerzo: ~8–10 días de trabajo**, en 5 fases, cada una con entregable usable. **Costo por corrida: ~+0 de
   wall-clock** si se encadena bien — el agente web usa un **recurso distinto** al dispositivo, así que corre
   **en paralelo** con los módulos móviles, igual que hoy corre el agente BD.

---

## 1. Hechos verificados (2026-07-28, no supuestos)

| Qué | Resultado | Cómo se comprobó |
|---|---|---|
| Alcance de red a las 3 playas | **HTTP 200 · ~250 ms** las tres, sin VPN | `curl` a los 3 `login.xhtml` |
| Stack de la web | **JSF (`javax.faces`) + PrimeFaces** · `ViewState` en cada form · ajax parcial (`PrimeFaces.ab`) | HTML del login |
| IDs del DOM | **auto-generados y posicionales**: `j_idt12`, `j_idt14`, `j_idt16` | HTML del login |
| Anclas estables sí disponibles | `placeholder="Usuario"` · `placeholder="Clave"` · botón con texto **"Ingresar"** · título "Autenticación en el Sistema" | HTML del login |
| Sesión | cookie `JSESSIONID` con `Path=/DenarioPremium`, `HttpOnly` | cabeceras de respuesta |
| MCP disponible | `@playwright/mcp@latest` ya configurado a nivel usuario (junto a `filesystem`) | `.claude.json` |
| BD de cotejo | RDS **central `savia`** con `user_read` — **no** cambia por playa | `automation/clientes/*.yaml`, `automation/db/query.js` |
| Trabajo web previo en el repo | **ninguno** — se parte de cero | búsqueda en todo `qa-piloto-automatizacion/` |

---

## 2. La pregunta del MCP — respuesta concreta

**No se necesita instalar nada.** El mismo servidor MCP cubre los dos mundos:

| | Corrida móvil (hoy) | Corrida web (propuesta) |
|---|---|---|
| MCP | `@playwright/mcp` | **el mismo** |
| Conexión | `connectOverCDP('http://127.0.0.1:9220')` al WebView de la app | `browser_navigate('http://<playa>.ddns.net:8080/DenarioPremium/pages/login.xhtml')` |
| Herramientas | casi todo dentro de `browser_run_code_unsafe` (por el CDP) | las **estándar**: `browser_navigate`, `browser_click`, `browser_fill_form`, `browser_snapshot`, `browser_evaluate`, `browser_wait_for` |
| Recurso físico | **el dispositivo** — singleton, obliga a serializar | **un navegador en la laptop** — no toca el dispositivo |
| Pre-vuelo | `setup-cdp.ps1` + `adb forward` | **ninguno** (solo red, ya verificada) |

**Consecuencia de diseño (importante):** como el agente web **no compite por el dispositivo**, puede correr
**en background y en paralelo** con el agente UI móvil del módulo siguiente — exactamente el patrón que ya usa
el Agente BD hoy (`prompt-orquestador-smoke.md`, instrucción 3b). Por eso el costo en wall-clock tiende a cero.

> ✅ **PROBADO (2026-07-28) — el riesgo quedó cerrado.** Con el CDP `:9220` y la pestaña web vivos a la vez:
> `connectOverCDP` deja la web **intacta** (incluido su estado JS, `window.__qaW`), y **3 idas y vueltas**
> dispositivo↔web tardaron **499 ms**. ⇒ **el paralelismo web ‖ móvil funciona y el plan B (correr la web al
> cierre, +30–45 min) queda descartado.** Reglas de convivencia en `automation/web/WEB-RUNTIME.md §9`;
> la principal: los agentes web **no se paralelizan entre sí** (comparten un solo navegador), uno en vuelo.

**URL por playa — dónde vive.** El `_schema.yaml` decidió (desacople 2026-07-24) que **el servidor NO se guarda
en el perfil del cliente**, porque los clientes migran de playa. La URL web es **propiedad del servidor**, no del
cliente → va en un archivo nuevo `automation/web/playas.yaml`:

```yaml
playas:
  el_yaque:    { url: "http://denarioelyaque.ddns.net:8080/DenarioPremium",   nombre: "El Yaque" }
  isla_coche:  { url: "http://denarioislacoche.ddns.net:8080/DenarioPremium", nombre: "Isla Coche" }
  la_tortuga:  { url: "http://denariolatortuga.ddns.net:8080/DenarioPremium", nombre: "La Tortuga" }
```

La playa efectiva se **descubre en runtime** (host de los payloads capturados en la corrida móvil) y se resuelve
contra esta tabla. Así el perfil del cliente no se toca y la regla del desacople se respeta.

---

## 3. El riesgo técnico #1 — JSF/PrimeFaces, y cómo se neutraliza

Los IDs `j_idt12`/`j_idt14`/`j_idt16` **son posicionales**: los asigna JSF por orden de aparición en el árbol de
componentes. Un cambio menor en el `.xhtml` los **corre todos**. Un guión anclado a `j_idt*` se rompe en masa al
primer despliegue — el mismo error que ya costó el primer piloto de replay (autor-a-ciegas ≠ lo que corre de verdad).

**Reglas que la web hereda del móvil, traducidas:**

| Anti-patrón (prohibido) | Regla |
|---|---|
| Seleccionar por `#j_idt*` o por índice de nodo | **Anclar por rol / label / placeholder / texto visible** (`getByRole('button', {name:'Ingresar'})`, `getByPlaceholder('Usuario')`). Ya verificado que esas anclas existen |
| `waitForTimeout` fijo tras una acción ajax | **Esperar por señal**: que aparezca/desaparezca el `ui-blockui`/overlay de PrimeFaces, o el texto del resultado (`browser_wait_for`) |
| Navegar por URL directa a una pantalla interna | **Navegar por clicks** — JSF ata la vista al `ViewState` de la sesión; entrar por URL puede devolver `ViewExpired`. Es el equivalente exacto de la regla "no `pg.goto()`" del móvil |
| Reintentar indefinidamente | **Techo de 2 intentos → `⛔ BLOCKED`** y seguir (`RUNTIME §3`), y **watchdog de módulo** (`RUNTIME §11`) también en web |

**Memoria viva:** igual que `module-selectors/` en móvil, la web necesita `automation/web/web-selectors/`
(`_comunes.md` + uno por módulo). El Agente 11 de consolidación se extiende para promover también estos patrones.

---

## 4. Arquitectura propuesta

```
CORRIDA MÓVIL (como hoy)                                    NUEVO
──────────────────────────                          ─────────────────────
agente UI móvil ──► crea registro
     │  installPayloadCapture
     ▼
{RUN_DIR}_payloads.jsonl  +  _bd-manifest.jsonl
  (trae Nro.Ref = id_<x> = PK del servidor)
     │
     ├──► Agente BD (Bash · nube)      ──► BD-OK / BD-SAVED / BD-FIELD-MISMATCH        [hoy]
     │
     └──► Agente WEB (Playwright · web) ──► WEB-OK / WEB-MISSING / WEB-FIELD-MISMATCH  [nuevo]
              login en la playa                      / WEB-CALC-MISMATCH / WEB-N/A
              busca el Nro.Ref
              abre el detalle
              lee campos + totales a JSON
              coteja contra el payload móvil
              recalcula los derivados
```

**Vocabulario de marcas web** (espejo del vocabulario BD, para que el consolidado se lea igual):

| Marca | Significado |
|---|---|
| `WEB-OK` | el registro aparece en web y **todo campo lleno en el móvil** coincide, y los cálculos cuadran |
| `WEB-MISSING` | está en BD (`BD-OK`) pero la web **no lo muestra** → defecto de la web (filtro/permiso/estatus) |
| `WEB-FIELD-MISMATCH` | ≥1 campo difiere entre lo que envió el móvil y lo que muestra la web |
| `WEB-CALC-MISMATCH` | los campos base cuadran pero un **derivado** (total, IGTF, retención, conversión, saldo) no |
| `WEB-N/A` | no evaluable: el registro **nunca llegó a la nube** (`BD-SAVED`/`BD-QUEUED`), o la web/playa no responde |

**Dos blindajes no negociables** (heredados del oráculo BD):

1. **La web nunca tumba el smoke.** Si la playa no responde o el login falla → `WEB-N/A` con motivo y la corrida
   móvil se reporta igual. Es aditivo.
2. **Gate de precondición:** solo se evalúa en web lo que el cotejo BD marcó **`BD-OK`**. Si el móvil dejó el
   registro en `BD-SAVED`/`BD-QUEUED` (no llegó a la nube), el veredicto correcto es **`WEB-N/A`, nunca FAIL** —
   la web no puede mostrar lo que nunca recibió. Esto no es teórico: ya está documentado que en algunos
   clientes **cliente potencial y pedido quedan "Por Enviar" y no llegan a la nube**, y que otros tienen
   **sync diferida** (ferrenuestro/Isla Coche). Sin este gate, la web reportaría FAILs falsos en masa.

---

## 5. Alcance — los 7 transaccionales y qué se verifica en cada uno

| # | Módulo | Qué se busca en la web | **Cálculos a verificar** (el corazón del pedido) |
|---|---|---|---|
| 1 | **Cobros** | documento por Nro.Ref · docs aplicados · métodos de pago | **el más rico:** total vs suma de pagos · **IGTF** · **retención** (IVA/ISLR) · **anticipo** · **conversión por tasa** y **fecha de tasa** · **saldo del cliente después de aplicar** |
| 2 | **Pedidos** | pedido por Nro.Ref · líneas | precio × cantidad · **descuentos** · **impuestos por línea** · total del pedido |
| 3 | **Devoluciones** | devolución por Nro.Ref · líneas · motivo | ⚠ **corregido en F0: no hay montos** (ni lista ni detalle). Se verifica **Cantidad · Lote · N° Factura · Fecha vencimiento · Motivo · Devolución en** + precinto/observaciones de cabecera |
| 4 | **Inventarios** (clientstock) | existencia registrada por cliente | cantidad · **lote** · fecha de vencimiento · ubicación |
| 5 | **Depósitos** | depósito por Nro.Ref | banco · N° cuenta · N° planilla · fecha · ✅ **conciliación confirmada en F0**: el detalle lista los cobros que lo componen con `N° Ref cobro` ⇒ **Σ(cobros hijos) == Monto depositado** |
| 6 | **Visitas** | visita del día por vendedor/cliente | fecha/hora (**⚠ zona horaria**) · actividades marcadas · comentario · geolocalización |
| 7 | **Clientes potenciales** | cliente creado | datos fiscales (RIF/CI) · razón social · dirección · contacto · **estatus de aprobación** |

**Nomenclatura de casos:** `DW-<ABREV>-NNN` (**DW** = Denario **W**eb, para no colisionar con `DM-` del móvil).
Ej. `DW-COB-001`. Cada caso web **referencia** el caso móvil que lo originó.

**Caveat transversal ya conocido — zona horaria.** El cotejo BD ya lo documenta (`RUNTIME §10.b`): local UTC-4 vs
servidor UTC. En web se aplica el mismo criterio: **veredicto por día**; diferencia solo de hora → **nota**, no
mismatch.

---

## 6. Estructura de archivos nueva

Espeja la del móvil para que el equipo no aprenda dos convenciones:

```
automation/web/
  WEB-RUNTIME.md                  ← reglas operativas web (equivalente de cdp/RUNTIME.md)
  playas.yaml                     ← playa → URL (propiedad del SERVIDOR, ver §2)
  web-helpers.js                  ← login, ir a módulo, buscar por Nro.Ref, leer detalle → JSON
  web-helpers.test.js             ← self-test node de la lógica pura (sin navegador)
  web-selectors/
    _comunes.md                   ← login, menú, tablas PrimeFaces, paginación, filtros
    {modulo}.md                   ← 7 archivos
  smoke-web/
    smoke-web-{modulo}.md         ← 7 guiones de casos DW-XXX-NNN
```

**Credenciales: sin archivo nuevo.** El usuario web (uno solo, `admin`, para todos los clientes) vive en el
bloque **`# USUARIO WEB`** de `secrets/qa-credentials.env`. El agente web lo lee anclando a ese marcador exacto.

> ⚠ **Consecuencia para el móvil, ya corregida (2026-07-28).** Ese bloque quedó **al principio** del archivo, con
> las **mismas claves** (`QA_USER`/`QA_PASSWORD`) que los bloques `# Cliente:`. Cualquier lectura que tomara "el
> primer `QA_USER=` del archivo" pasaría a usar el **usuario web** para el login de la app → login roto en todos
> los clientes. Se corrigió: `fetchCreds()` ahora **exige** `clienteId` y **lanza** si el bloque no existe (antes
> caía en silencio al archivo completo), y `smoke-login.md` / `module-selectors/login.md` / `RUNTIME §1` y `S4`
> quedaron con la advertencia explícita de anclar al marcador `# Cliente: {QA_CLIENTE}`.

Sin archivos stub y sin duplicar nada del móvil (política de limpieza de `CLAUDE.md`).

---

## 7. Fases y tiempo

Cada fase deja algo usable y es reversible. Estimación en **días de trabajo efectivo**, no de calendario.

| Fase | Entregable | Días | Depende de |
|---|---|:---:|---|
| **F0 · Reconocimiento guiado** ✅ **casi cerrada (2026-07-28)** | Hecho contra Isla Coche / capitalina: login, **los 7 módulos recorridos** (ruta, ID de tabla, filtros, columnas), detalle de cobros abierto, oráculo de conversión demostrado con datos reales. Salidas: `automation/web/RECONOCIMIENTO-WEB.md` · `playas.yaml` · `web-selectors/_comunes.md`. **Falta:** detalle de los otros 6 módulos · playa multi-empresa · prueba de aislamiento MCP↔CDP | **~0.3 usado** | ~~credenciales~~ ✅ |
| **F1 · Infra web** ✅ **hecha (2026-07-28)** | `WEB-RUNTIME.md` (9 secciones: read-only, observación mínima, guarda de contexto, veredictos, oráculos, esperas, reporte) · `playas.yaml` · `web-helpers.js` (mapa de módulos + lógica pura + `BUNDLE_DOM`) · `web-helpers.test.js` **67/67 sin navegador** + bundle validado contra la página real | **~0.5 usado** | F0 |
| **F2 · Piloto: 2 módulos** | `smoke-web-cobros.md` + `smoke-web-pedidos.md` con casos `DW-` y el oráculo de cálculo. **Cobros primero** porque concentra todos los cálculos difíciles: si el patrón aguanta ahí, aguanta en el resto | **2–3** | F1 |
| **F3 · Los 5 restantes** | devoluciones · inventarios · depósitos · visitas · clientes potenciales (~0.5–1 día c/u) | **3–4** | F2 validada en 1 corrida |
| **F4 · Integración** | Flag `QA_WEB=1` en el orquestador · agentes web en background (patrón 3b) · ledger `_web-results.jsonl` · sección web en el consolidado · Agente 11 promueve también `web-selectors/` | **1** | F3 |
| | **TOTAL** | **7.5–10.5** | |

**Costo por corrida (una vez implementado):**

| Escenario | Wall-clock añadido |
|---|---|
| Agentes web **en paralelo** con los módulos móviles (recomendado, patrón del Agente BD) | **~0–10 min** — se solapan con el dispositivo |
| Agentes web **al cierre**, en serie (plan B si el aislamiento de contextos MCP da guerra) | **+30–45 min** |

**Recomendación de secuencia:** F0 **antes que cualquier otra cosa**. Todo lo demás es adivinar hasta ver el DOM
real — es la lección literal del piloto de replay que salió frágil por autorarse desde la documentación.

---

## 7.b Alcance AMPLIADO — presupuesto de ~2 h de web bajo las 3 h del móvil (decisión QA 2026-07-28)

**Contexto:** la web viene acumulando reportes de errores. QA quiere **validar los transaccionales lo más
posible**, sin alargar la corrida. Presupuesto acordado: **~2 h de trabajo web**, en paralelo con las ~3 h del móvil.

### La restricción que ordena todo

El límite **no es el tiempo, es la serialización**: los agentes web **no se paralelizan entre sí** (comparten
un único navegador). Con 2 h de presupuesto y un agente en vuelo a la vez, la pregunta pasa a ser **cómo se
reparte esa cola** dentro de la ventana de 3 h.

Y ahí aparece la clave: **solo el cotejo depende del móvil.** Todo lo demás —filtros, paginación,
consistencia lista↔detalle— es independiente y puede **arrancar en el minuto 0** y llenar los huecos.

### La palanca de mayor rendimiento: **muestreo BD ↔ web**

> El defecto `COB-RET-TOTAL-CERO` apareció al comparar **un** cobro de retención contra la BD.
> Con **20–30 registros por módulo** en vez de 1, la misma técnica cubre muchísimo más — y es **barata**,
> porque es lectura masiva sin crear nada.

La BD es la verdad; la web debe reflejarla. Para cada módulo se toma una **muestra de registros históricos**
(no solo los de la corrida), se traen sus valores con `query.js` y se contrastan contra lista y detalle.
Esto encuentra defectos de **presentación** —el tipo que más se le escapa al móvil y al cotejo BD— a escala.

### Los 5 bloques de trabajo web

| Bloque | Qué valida | ¿Depende del móvil? | Estimado |
|---|---|---|---|
| **A · Filtros** | los ~55 filtros de los 7 módulos, en 3 niveles. Oráculo = conteo en BD | ❌ no | 35–40 min |
| **B · Muestreo BD ↔ web** | 20–30 registros por módulo: lista y detalle contra BD | ❌ no | 40–50 min |
| **C · Cotejo de la corrida** | los registros del manifiesto, campo a campo + cálculos | ✅ **sí** | 15–20 min |
| **D · Comportamiento de la web** | paginación, orden por columna, selector de Columnas, enlaces cruzados (depósito↔cobros, inventario↔pedido), consistencia lista↔detalle | ❌ no | 15–20 min |
| **E · Barrido de rezagados** | solo lo que quedó `WEB-MISSING` | ✅ sí | ~5 min |
| | | **Total** | **≈ 1 h 50 – 2 h 15** |

### Cómo se agenda (cola con prioridad)

El agente web trabaja una **cola priorizada**, no un módulo suelto:

1. **Prioridad alta — cotejo (C):** cuando el orquestador avisa que cerró un módulo transaccional, el cotejo
   de **ese** módulo entra primero.
2. **Relleno — funcional (A, B, D):** mientras no haya cotejo pendiente, el agente consume la cola funcional.
   Como no depende del móvil, **arranca en el minuto 0**, junto con login/clientes.
3. **Cierre — E:** el barrido de rezagados al final.

⇒ En la práctica el orquestador lanza, tras cada módulo, **un agente web con: el cotejo de ese módulo + tantos
casos funcionales de la cola como entren en su ventana** (~15–25 min, la duración del módulo móvil siguiente).

### Lo que esto cuesta de verdad

- **Wall-clock:** ~0. Todo cae dentro de la ventana del móvil, salvo la cola del último módulo y el barrido:
  **+5–15 min reales**.
- **Tokens:** ⚠ **esto sí sube y conviene decirlo.** Los agentes web de la corrida `el_valle-20260728`
  consumieron 80–160 k tokens cada uno. Un programa de ~2 h son del orden de **400–700 k tokens por corrida**,
  además de los del móvil. Es el costo real de la ampliación; el wall-clock es gratis, los tokens no.
- **Riesgo operativo:** más tiempo de sesión web ⇒ más probabilidad de `ViewExpiredException`. Ya está
  mitigado (el agente re-loguea y sigue), pero hay que mantenerlo en los guiones.

### Lo que NO entra (el límite se mantiene)

Sigue **fuera de alcance** la web como aplicación completa: facturaciones, datos maestros, reportes,
indicadores, empresa, estructura comercial, usuarios/licencias. El alcance son **los 7 transaccionales** —
lo que se amplía es la **profundidad** sobre ellos, no la superficie.

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| IDs `j_idt*` cambian con cada despliegue y rompen los guiones | Selectores por rol/label/texto (§3); `web-selectors/` como memoria viva; un selector roto degrada ese caso a `⛔ BLOCKED`, no tumba el módulo |
| ~~El usuario web no ve los registros del vendedor (permisos por rol)~~ | **Cerrado por decisión §9.1:** se entra con **`admin`**, que ve todos los vendedores ⇒ un `WEB-MISSING` es defecto real, no falta de permiso |
| Sync diferida: la web se consulta antes de que el registro llegue | Gate `BD-OK` (§4) + poll/reintento con la misma ventana que ya usa el cotejo BD |
| Dos contextos de navegador (CDP del dispositivo + web) se pisan | Aislar por pestaña/contexto; validar en F0; plan B = agentes web al cierre |
| Falsos `WEB-CALC-MISMATCH` por redondeo | Misma tolerancia que ya se aplica en BD: `Math.abs(a-b) < 0.01` |
| Alcance que se estira ("ya que estamos, agreguemos módulos web") | El alcance está fijado en §5: **7 transaccionales, read-only**. Cualquier módulo extra entra como propuesta nueva |
| La web escribe datos de prueba en producción | **El agente web es read-only por diseño** — no crea, no edita, no borra. Ningún guión `DW-` incluye acciones de escritura |

---

## 9. Decisiones de QA — TOMADAS (2026-07-28, responsable QA)

| # | Decisión | Consecuencia de diseño |
|---|---|---|
| 1 | **Usuario web = `admin`**, **uno solo para todos los clientes** (a veces cambia la clave, el usuario no) | El agente ve los registros de **todos** los vendedores ⇒ **`WEB-MISSING` es veredicto confiable**: si no aparece, es defecto de la web, no falta de permiso. Elimina el riesgo "permisos" de §8. **Sin archivo de credenciales nuevo:** vive en el bloque **`# USUARIO WEB`** de `secrets/qa-credentials.env` (ya gitignored). **Nunca** en guiones ni en chat |
| 2 | **Read-only confirmado** — el agente no crea, edita ni borra nada en la web | Ningún guión `DW-` lleva acciones de escritura. Si un módulo exigiera *aprobar/procesar* para ver el detalle completo, **se detiene y se pregunta**: es escritura en producción y necesita aprobación aparte, módulo por módulo |
| 3 | **Encadenada a la corrida móvil** | Los agentes web corren **en background, en paralelo** con los módulos móviles (patrón del Agente BD, instrucción 3b). El veredicto web queda en el **mismo consolidado**. Wall-clock añadido ~0–10 min. F4 se diseña para este modo; el modo "independiente sobre un `RUN_DIR` viejo" queda como capacidad secundaria si sale gratis, no como objetivo |

**Con el usuario `admin` decidido, el único bloqueante de F0 son las credenciales web** (usuario + clave de admin
por playa) en `secrets/qa-web-credentials.env`, con el mismo formato de bloques por cliente/playa que ya usa
`secrets/qa-credentials.env`.

---

*Propuesta para revisión QA · registrar en `PROPUESTAS-CAMBIOS.md` si se aprueba avanzar · no crear archivos sin visto bueno.*
