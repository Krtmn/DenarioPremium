# WEB-RUNTIME — Denario Premium **web**
## Referencia operativa del agente web · todas las playas

Leer una sola vez al inicio de cada sesión de agente web.
Helpers: `automation/web/web-helpers.js` · Selectores: `web-selectors/_comunes.md` + `{modulo}.md`
Hechos medidos: `RECONOCIMIENTO-WEB.md` · Diseño y alcance: `../../PROPUESTA-QA-WEB.md`

> **Esto NO es la corrida móvil.** Acá no hay CDP, ni dispositivo, ni `browser_run_code_unsafe`.
> Se conduce un navegador normal con las herramientas **estándar** del MCP de Playwright.

---

## 0. La regla que manda sobre todas: **READ-ONLY**

El agente web **no crea, no edita, no borra, no aprueba nada**. Busca registros que la corrida móvil
ya creó y los **lee**. La web es **producción**.

**El único control que se toca en una fila es `Consultar`.** Prohibido explícito:

| Módulo | Controles que NO se tocan |
|---|---|
| **Visitas** | `Editar` · `Eliminar` por fila |
| **Pedidos** | `Nuevo Pedido` · `Copiar` |
| **Cobros** | el `<select>` **"Estatus del Cobro"**, editable en la propia fila |
| Todos | `Guardar`, `Aprobar`, `Procesar`, `Cambiar Clave`, cualquier `submit` |

Si un caso pareciera necesitar una acción de escritura para verse completo → **`⛔ BLOCKED` y preguntar**.
Nunca improvisar una escritura en producción.

---

## 1. Inicio de sesión de agente

```javascript
// 1. Resolver la playa (viene del host de los payloads de la corrida móvil) → URL base
//    automation/web/playas.yaml
// 2. Credenciales: leer secrets/qa-credentials.env con Read y tomar el bloque de LA PLAYA:
//    "# USUARIO WEB LA TORTUGA"  /  "# USUARIO WEB ISLA COCHE"  /  "# USUARIO WEB EL YAQUE"
//    🔴 La clave es DISTINTA POR PLAYA (confirmado 2026-07-28: la de Isla Coche da
//       "USUARIO INVALIDO" en La Tortuga). Si falta la de tu playa → WEB-N/A, nunca FAIL.
//    ⚠ NO un bloque "# Cliente:" — ese es el usuario de la APP, no de la web.
browser_navigate  → {base}/pages/login.xhtml
browser_type      → textbox "Usuario" / textbox "Clave"     (el árbol a11y resuelve limpio)
browser_click     → button "Ingresar"
// 3. Verificar que llegó: pathname termina en /pages/main
// 4. Instalar el bundle DOM una vez:  browser_evaluate(BUNDLE_DOM de web-helpers.js)
```

Login fallido devuelve el alert **"USUARIO INVALIDO"** → `WEB-N/A` para toda la corrida web
(la clave puede haber cambiado; la web **nunca** tumba la corrida móvil).

---

## 2. Observación mínima — obligatoria, no opcional

```
✗  browser_snapshot como observación por defecto
```

El snapshot de `/pages/cobros` devolvió **76.000 caracteres** y reventó el límite de tokens (F0).
**Regla:** toda lectura va por `browser_evaluate` devolviendo **solo el JSON que el oráculo necesita**:

```javascript
browser_evaluate("() => window.__qaW.leerTabla('form:cobrosDT', 5)")
browser_evaluate("() => window.__qaW.leerHojas(120)")     // cabecera del detalle
```

`browser_snapshot` queda reservado para **diagnosticar una divergencia**, nunca para operar.

---

## 3. Guarda de contexto — el error más fácil de cometer

### 3.a 🔴 PRIMERO la PLAYA, después el módulo

**Las 3 playas exponen exactamente las mismas rutas.** `/pages/cobros` existe en El Yaque, en Isla Coche
y en La Tortuga. Comprobar solo `location.pathname` **no distingue el servidor** → el agente puede leer
los datos de otra playa creyendo que son los suyos y cantar `WEB-OK` sobre registros ajenos.

> **Pasó de verdad (2026-07-28):** se estuvo operando sobre Isla Coche creyendo que era La Tortuga,
> porque la comprobación devolvía únicamente el pathname. Lo detectó la QA, no la herramienta.

```javascript
const ctx = await __qaW.contexto();            // { host, pathname, url, titulo }
verificarContexto(ctx, 'cobros', false, 'la_tortuga').ok    // ⚠ 4º arg = playa OBLIGATORIO
```

- La playa **se descubre en runtime** (host de los payloads del móvil) y se resuelve contra `playas.yaml`.
- Si `verificarContexto` devuelve `PLAYA EQUIVOCADA` → **detener el módulo**, no "corregir y seguir".
- Pasar un pathname suelto **impide** validar la playa: el helper lo rechaza a propósito.

### 3.b Después, el módulo

**`form:pedidosDT` lo comparten 5 módulos** (pedidos, devoluciones, depósitos, clientes potenciales,
inventarios) y aparece también en algunos **detalles**. Un helper que asuma "estoy en pedidos porque
existe `form:pedidosDT`" leerá depósitos sin enterarse.

**Antes de leer cualquier tabla:**

```javascript
const { pathname } = await __qaW.contexto();
verificarContexto(pathname, 'depositos', /*esDetalle*/ false).ok   // si no → ⛔ BLOCKED
```

Cuando el ID es auto-generado (`form:j_idt177`, `j_idt163`, `j_idt169`), **anclar por estructura**:
`__qaW.tablaPorColumnas(['Forma de pago','Monto cobrado'])` → devuelve el ID vigente.
**Nunca** escribir un `j_idt*` en un guión.

---

## 4. Localizar el registro creado por el móvil

La llave viene del manifiesto de la corrida móvil. **Hay dos, y conviene usar ambas:**

| Llave | Dónde aparece en la web |
|---|---|
| **Nro.Ref** (= `id_<x>`, PK del servidor) | columna `# Ref` de la lista · `No. de Ref.:` en el detalle |
| **Epoch `co_<x>`** | `Código {módulo}:` en el detalle (ej. `1785243271076.0`) |

| Módulo | Cómo se busca |
|---|---|
| cobros · pedidos · devoluciones · depósitos · inventarios | **filtro `# Ref`** + `Buscar` (directo) |
| **clientes potenciales** · **visitas** | ❌ sin filtro de Ref → filtrar por **vendedor + rango de fechas** y **barrer filas** |

⚠ En **clientes potenciales** el detalle **no muestra `No. de Ref.`**: la única llave es el **epoch**.

---

## 5. Veredictos

| Marca | Cuándo |
|---|---|
| `WEB-OK` | aparece y **todo campo lleno en el móvil** coincide, y los cálculos cuadran |
| `WEB-MISSING` | el cotejo BD dio `BD-OK` pero la web **no lo muestra** → defecto de la web |
| `WEB-FIELD-MISMATCH` | ≥1 campo lleno difiere |
| `WEB-CALC-MISMATCH` | los campos base cuadran pero un **derivado** no (total, IGTF, retención, conversión, suma) |
| `WEB-N/A` | no evaluable: el móvil no lo envió · la playa/login no responde · el módulo no aplica |

**Gate de precondición (no negociable):** solo se juzga lo que el cotejo BD marcó **`BD-OK`**.
Si el registro quedó `BD-SAVED`/`BD-QUEUED` (nunca llegó a la nube) → **`WEB-N/A`, jamás FAIL**:
la web no puede mostrar lo que no recibió. `gatePorBD()` lo aplica.

**Blindaje:** la web **nunca** tumba el smoke. Cualquier fallo de infra web → `WEB-N/A` con motivo,
y la parte móvil se reporta igual. Es aditivo.

### 5.a 🔴 Antes de reportar: **¿reproduce en la versión que estamos probando?**

> Regla de la responsable QA, **2026-08-17**, tras descartar **4 de 6** hallazgos web de `grupo_fiel`.
> Esta familia (`M##`) lee **histórico**, así que es la que más expuesta está a este error.
> Mecánica completa en `automation/cdp/RUNTIME.md §4.b`.

**Una anomalía que solo aparece en registros VIEJOS y no se reproduce en uno NUEVO no es un defecto de la
release en prueba.** Antes de escribirla como hallazgo:

1. Identificá la **condición** que la dispara (ej. `nu_amount_total_conversion = 0`).
2. Listá los registros que la cumplen **ordenados por fecha** y encontrá el **último afectado**.
3. Si **nada posterior** la cumple —y en particular **nada creado por la corrida de hoy**— ⇒ va como
   **observación sobre datos históricos**, con la fecha del último caso. **No es hallazgo.**
4. Si aparece en un registro reciente ⇒ **ahí sí**, y tenés el caso reproducible.

⚠ Escribí **"no reproduce desde {fecha}"**, nunca *"se corrigió en la versión N"*: que no reproduzca no prueba
qué lo corrigió.

**Severidad de un problema de visibilidad:** se mide por el impacto sobre **datos ACTIVOS**. Registros que no
se listan porque pertenecen a un usuario **dado de baja** ⇒ severidad baja. Verificá con BD si hay **usuarios
activos** afectados antes de asignar severidad.

### 5.b ❌ Comportamientos POR DISEÑO — **NO volver a reportarlos**

Ya se levantaron por error más de una vez. Si los ves, **no son defecto**:

| Qué se ve | Por qué NO es defecto |
|---|---|
| La columna **`Monto cobrado`** de `/pages/cobros` muestra **varios importes** (`"2.000,00 BS 8.000,00 BS"`) | **Es un DESGLOSE por método de pago, no un total.** En ese ejemplo: 8.000 en efectivo + 2.000 en pago móvil |
| Esa misma columna viene **VACÍA** en un cobro de **Retención** (`co_type=2`) | En las retenciones **no se registra método de pago** ⇒ no hay nada que desglosar. Siempre fue así |
| El **rango de fechas por defecto** (mes en curso) acota el listado | Es el filtro inicial, no una pérdida de registros. La búsqueda por `# Ref` **no** queda tapada por él |
| La columna **Vendedor** de `clientesPotenciales` trae solo el **primer nombre** | Es así en esa pantalla; cotejar contra el nombre completo da un **falso** `WEB-FIELD-MISMATCH` |
| **`Geo = "Falta Coordenada (Sucursal)"`** en visitas | Es una clasificación que calcula la web comparando contra la coordenada **de la sucursal del cliente**; no dice que falte la de la visita |

---

## 6. Reglas de comparación

- **Números:** cada lado con su convención — el móvil manda **crudo** (`2000000.00`), la web muestra
  **es-VE** (`2.000.000,00`). Usar `parseNumeroFlexible()`; un solo parser da **falsos mismatch**.
- **Tolerancia:** `|a−b| < 0.01` (la misma de `cotejo-payload.js`) — el redondeo no es defecto.
- **Fechas:** veredicto **por día**. Hora distinta (móvil UTC-4 vs servidor UTC) → **nota**, no mismatch.
- **Local-driven:** campo **lleno en el móvil** → se compara · **vacío en el móvil** → **se saltea**.
  Lo que la web agregue por su cuenta no se juzga.
- **Texto:** comparar normalizado (espacios colapsados, mayúsculas).

---

## 7. Oráculos de cálculo confirmados en F0

| Oráculo | Regla |
|---|---|
| **Conversión de moneda** | `Monto / Tasa conv. == Monto conv.` — verificado en 3 cobros reales |
| **Depósito ↔ cobros** | el detalle del depósito lista sus cobros ⇒ `Σ(Monto cobrado hijos) == Monto depositado` |
| **Cobro** | `Monto cobrado == Σ pagos` · `Diferencia cobro == Total por cobrar − Monto cobrado` |
| **Retención** | `Retención IVA` / `Retención ISLR` del detalle contra lo que envió el móvil |
| **Inventario → pedido** | la cabecera trae `Ver Pedido Relacionado` (enlace cruzado) |

⚠ **Devoluciones NO tiene montos** (ni lista ni detalle): se verifica cantidad, lote, N° factura,
fecha de vencimiento y motivo. No inventar un oráculo de importes ahí.

---

## 8. Esperas y estabilidad

- **PrimeFaces es ajax:** esperar por **señal** (`browser_wait_for` sobre un texto/dato propio de la página),
  nunca `waitForTimeout` fijo.
- **Navegación directa por URL FUNCIONA** con sesión activa (no hay `ViewExpired`) → ir directo a
  `{base}{ruta}` sin recorrer el menú. El **detalle** sí se abre con el botón `Consultar` de la fila.
- **Mapas de Google embebidos** (clientes potenciales, visitas, inventarios, devoluciones): carga externa
  → **nunca** esperar por el mapa ni bloquear un caso porque no cargó.
- **Techo de 2 intentos** por caso y **watchdog de módulo**, igual que en móvil (`cdp/RUNTIME.md §3` y `§11`).

---

## 9. Convivencia con la corrida móvil — ✅ PROBADO (2026-07-28)

**El navegador web y el CDP del dispositivo conviven sin pisarse.** Verificado con las dos cosas vivas:

| Prueba | Resultado |
|---|---|
| `connectOverCDP(:9220)` con la pestaña web abierta | ✅ la web queda **intacta** (misma URL, mismo DOM) |
| Estado JS de la web tras el CDP | ✅ `window.__qaW` **sigue vivo** — no se pierde el bundle |
| 3 idas y vueltas dispositivo→web→dispositivo | ✅ estables, **499 ms** las tres |

⇒ **El agente web puede correr en background, en paralelo con el agente UI móvil del módulo siguiente**
(patrón *offset*, igual que el Agente BD). Costo en wall-clock ≈ 0.

### Reglas de convivencia (para que siga siendo cierto)

1. **Los agentes web NO se paralelizan entre sí.** Comparten un único navegador. El paralelismo es
   **web ‖ móvil**, nunca web ‖ web. Un agente web en vuelo a la vez.
2. **El agente web trabaja en su pestaña y NUNCA cierra la pestaña 0** — el `page` que reciben los
   agentes móviles cuelga de ella; cerrarla les rompe el handle.
3. **El agente móvil nunca navega el navegador local.** Solo usa `page` para obtener el `browserType`
   y de ahí en más trabaja contra `pg` (el WebView del dispositivo).
4. **El agente web puede darse el lujo de esperar.** Al estar fuera del camino crítico, ante un
   registro que no aparece debe **reintentar** (el sync a la nube puede ser diferido — hubo casos de
   ~3 min) antes de concluir `WEB-MISSING`. Esperar ahí no le cuesta wall-clock a nadie.
5. **Barrido de rezagados al cierre:** al terminar la corrida, repasar **solo** lo que quedó
   `WEB-MISSING`. Así los rezagados por sync diferido se resuelven sin que el resto pague la espera.

---

## 10. Reporte

Un `.md` por módulo web en `{RUN_DIR}web-{modulo}.md` + línea por caso en `{RUN_DIR}_web-results.jsonl`:

```json
{"run_id":"<RUN_ID>","capa":"web","modulo":"cobros","caso":"DW-COB-001","ref":"526","marca":"WEB-OK","ms":1200}
```

Los casos web se numeran **`DW-<ABREV>-NNN`** (DW = Denario **W**eb) y **referencian** el caso móvil
que creó el registro.

---

*F1 · 2026-07-28 · basado en el reconocimiento F0 (Isla Coche / CAPITALINA), read-only*
