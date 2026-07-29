# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260728_130612_smoke-completo` |
| Módulo | VENDEDORES |
| Cliente | el_valle |
| Dispositivo | WebView por CDP `:9220` |
| App | `com.kiberno.denarioPremiumPro` — v1.0 (`window.ng=true`, db_version=19) |
| Playa / servidor | **La Tortuga** |
| Empresa | PROCESADORA DE ALIMENTOS COVADONGA,C.A |
| Resultado | **3 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Verificación BD | **BD-N/A** — módulo de solo lectura, no crea transacciones (RUNTIME §10) |
| Registros creados | ninguno |
| Manifiesto web | no aplica (nada que anexar) |

---

## 🎯 Veredicto sobre `esVendedor` (tarea clave del módulo)

> ## `esVendedor = **true**` — CONFIRMADO EN UI
>
> El perfil traía `modules.vendedores: { aplica: TBD }` porque la BD no pudo resolver la VG.
> Queda resuelta por observación directa: **`aplica = true`, `vgs.esVendedor = true`**.

### Evidencia que lo sustenta (3 señales independientes, todas positivas)

| # | Señal observada | Valor capturado | Qué prueba |
|---|-----------------|-----------------|------------|
| **E1** | Tile **"Vendedores" presente en HOME** | `app-home p.nombreModulos` = `["Visitas","Inventarios","Pedidos","Devoluciones","Cobros","Depósitos",**"Vendedores"**,"Productos","Clientes","Sincronizar"]` | El módulo **se renderiza** para la cuenta QA. Si `esVendedor=false` el tile no se pinta en HOME. |
| **E2** | **Heading `<h1>Vendedor</h1>`** dentro de `app-vendedores` | `headings: ["Vendedor"]` · `innerText` = `"Vendedor\nPROCESADORA DE ALIME"` | 🔴 **Señal canónica.** Es el marcador que las corridas anteriores usan para confirmar `esVendedor=true` sin `ng.getComponent` (`[gmp-2606]`). Presente y visible. |
| **E3** | **Acordeón de empresa con KPIs POBLADOS** | 1 acordeón `ion-accordion-21` → Cartera Clientes **480**, Clientes Activados **1**, Días Hábiles 23/20/3 | El backend **reconoce al usuario como vendedor y le devuelve su cartera**. Un no-vendedor no tendría cartera asignada ni métricas. |

**Contra-hipótesis descartadas:**
- *"El módulo aparece pero está vacío"* → **NO**: el acordeón expande a `281 px` de contenido con 7 KPIs poblados y numéricos.
- *"El módulo aparece pero no es operable"* → **NO**: expande, contrae y navega de vuelta a HOME sin residuos (`ion-modal.show-modal` = 0).
- *"Es sólo el shell del módulo sin datos del servidor"* → **NO**: Cartera Clientes = **480** es un dato del servidor específico de esta cuenta.

**Conclusión operativa:** los 3 casos van a **PASS pleno**, ninguno a *N/A por rol*. La cuenta QA de el_valle
**sí es un vendedor con cartera asignada**. `infoVendedores=false` se confirma coherente: el módulo se
**autogeneró en la app** con la información de Denario (no hubo archivo USER_INFORMATION del cliente) y aun
así pobló métricas — mismo comportamiento que insumar / piercar / ferrenuestro / dm-electronica.

### Línea lista para cerrar el YAML

```yaml
  vendedores: { aplica: true }   # esVendedor=true CONFIRMADO UI [el_valle-20260728]:
                                 #   tile en HOME + <h1>Vendedor</h1> + KPIs poblados (Cartera 480)
                                 #   infoVendedores=false → autogenerado por Denario · 1 empresa
```

*(Se deja escrito, **no** se edita el YAML desde este agente — `CLAUDE.md` restringe la edición del perfil a la consolidación autorizada.)*

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ **PASS** | Click tile `Vendedores` (`<p class="nombreModulos">`→`closest('a')`, MouseEvent) → `app-vendedores` visible, **sin overlay de sync residual** (`overlaySync=false`), heading `<h1>Vendedor</h1>`, 1 acordeón de empresa renderizado. 1.803 ms |
| DM-VND-002 | ✅ **PASS pleno** | Acordeón `PROCESADORA DE ALIME` expande (`accordion-collapsed`→`accordion-expanded`, `[slot=content]` **0 → 281 px**) con **KPIs poblados**; re-contrae (`accordion-expanded`→`accordion-collapsed`, **281 → 0 px**). **No es N/A**: la API sí devolvió métricas. 2.333 ms |
| DM-VND-007 | ✅ **PASS** | `img.fechaAtras`→`closest('a')` → HOME principal con los **10 tiles** de módulos; `app-vendedores` ya no visible; `ion-modal.show-modal` = 0. 1.674 ms |

### KPIs leídos (DM-VND-002) — empresa PROCESADORA DE ALIMENTOS COVADONGA,C.A

| KPI | Valor |
|-----|-------|
| Días Hábiles | 23 |
| Días Transcurridos | 20 |
| Días Restantes | 3 |
| **Cartera Clientes** | **480** |
| Clientes Activados | 1 |
| Clientes Nuevos | 0 |
| Clientes Nuevos Activados | 0 |

**Coherencia interna:** 23 = 20 + 3 ✅. Único acordeón ⇒ 1 sola empresa habilitada para el vendedor,
consistente con la empresa de la corrida.

**Nota (dato, no defecto):** este cliente muestra **7 KPIs y NO trae `Cuota Mes` / `Venta Real Mes`**,
que sí aparecen en ferrenuestro y dm-electronica. Es variación de configuración del cliente/servidor
(el bloque de metas de venta no está poblado), **no un FAIL** — la app no omite nada que el API haya devuelto.

---

## Verificación BD

**`BD-N/A`** — VENDEDORES es un módulo de **solo lectura**: no crea ni modifica transacciones, por lo que
no aplica el oráculo §10 ni se anexa nada a `_bd-manifest.jsonl` ni al manifiesto web.

Contraste **no vinculante** solicitado en el prompt, sólo como referencia:

| Consulta | Resultado |
|----------|-----------|
| `node automation/db/query.js el_valle "SELECT count(*) FROM users"` | **18** usuarios |

Interpretación: los **18 `users`** son las cuentas de la instancia; el módulo Vendedores no lista usuarios
sino **la(s) empresa(s) del vendedor logueado con sus KPIs** — por eso 1 acordeón y no 18. No hay
discrepancia que reportar; los dos números miden cosas distintas y el módulo no lleva cotejo BD formal.

*(Intento único de contrastar `Cartera Clientes=480` contra la nube: la tabla `clients` no existe con ese
nombre en el esquema → se abandonó al 1.er intento por el techo de §3, al ser un dato meramente referencial.)*

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **Expansión `grp.value = acc.value` + `ionChange` — vigente en La Tortuga v1.0 `window.ng=true`** | universal | 8.ª confirmación consecutiva de la técnica. `[slot=content]` **0 → 281 px → 0**; `mouse.click` en el header sigue **sin** expandir. El acordeón no declara `value` propio: Ionic asigna `ion-accordion-21` → leer `acc.value` en runtime (el índice varía por sesión, **nunca hardcodearlo**). Oráculo por `getBoundingClientRect().height`, no por `offsetParent`. |
| **`esVendedor=true` en el_valle** (9.º cliente) | cliente | Heading `<h1>Vendedor</h1>` + tile en HOME + KPIs poblados. Se suma a globalmp, romher, insumar, don-theo, piercar, ferrenuestro, dm-electronica, jerez, latino_cosmetica. **Aún no hay ningún cliente observado con `esVendedor=false`** — el caso "módulo no visible por rol" sigue sin cobertura empírica en toda la suite. |
| **el_valle: 1 empresa, KPIs POBLADOS pero SIN bloque de metas** | cliente | `PROCESADORA DE ALIMENTOS COVADONGA,C.A` — Cartera 480 · Activados 1 · Nuevos 0 · Nuevos Activados 0 · Días 23/20/3. **Se alinea con** insumar/piercar/ferrenuestro/dm-electronica (KPIs pueblan) y **contrasta con** globalmp/don-theo/jerez/latino_cosmetica (vacíos). **Matiz nuevo:** aquí pueblan los 7 KPIs de cartera **pero faltan `Cuota Mes` y `Venta Real Mes`** ⇒ el poblado **no es binario** (todo-o-nada) como sugería la memoria previa: hay un tercer estado *"cartera sí / metas no"*. |
| **Header del acordeón trunca el nombre de empresa a ~20 caracteres** | universal | `"PROCESADORA DE ALIME"` en vez de `"PROCESADORA DE ALIMENTOS COVADONGA,C.A"`. Coincide con `"FERRENUESTRO MAYOR,"` `[ferrenuestro]` y `"INVERSIONES JEREZ MO..."` `[jerez]` ⇒ **truncado de plantilla, cosmético y ya conocido — NO es defecto y no debe re-marcarse FAIL.** ⚠ Corolario para automatización: **no matchear la empresa por igualdad exacta** contra el YAML; usar `startsWith`/prefijo. |
| **Traza 100 % pura-DOM ⇒ replayable sin coordenadas** | universal | Los 3 casos se conducen sólo con `dispatchEvent` + asignación de propiedad: **cero** `pg.mouse.click`, cero coords. Es el módulo con la traza más barata y estable de la suite — buen candidato a primer REPLAY end-to-end cuando se cablee el modo. |

---

## Hallazgos (FAIL)

**Ninguno.** 0 FAIL. Módulo íntegramente funcional: entra, expande, pobla, contrae y sale limpio.

---

## Traza (QA_MODE=record)

**TRAZA: 10 ops · 3 casos grabados** (DM-VND-001, DM-VND-002, DM-VND-007 — los 3 PASS, **ninguna op descartada**).

- Archivo: `automation/reports/smoke_el_valle_20260728_130612/_trace/vendedores.trace.json`
- Validación estructural: `validateTrace()` → **`[]`** (válida).
- Composición: 3 marcas de caso · 4 `eval` (entrar / expandir / contraer / volver) · 3 `assert`.
- `window.__qaTrace` fue **reseteado** al instalar el grabador (persiste entre agentes) — la traza contiene
  únicamente ops de este módulo.
- Sin credenciales ni valores de `secrets/` en `data` ni en `code`.

---

*Módulo cerrado en HOME · 0 cuelgues de CDP · 0 reconexiones · 3 `browser_run_code_unsafe` en total · wall-clock ≈ 6 s de operación de UI.*
