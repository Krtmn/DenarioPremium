# automation/reports — Convención de estructura

## Organización

🔴 **Las corridas se agrupan POR CLIENTE** (cambio del 2026-08-11). Cada cliente tiene su carpeta, y dentro
van todas sus corridas. Así, para encontrar la última corrida de un cliente se entra a su carpeta y se ordena
por fecha, en vez de buscar entre decenas de corridas de todos los clientes mezcladas.

```
reports/
  {cliente}/                                   ← p. ej. difranca, hidroponias, el_palmar
    {tipo}_{cliente}_{YYYYMMDD}_{HHMMSS}/      ← una carpeta por corrida
      consolidado.md
      login.md
      clientes.md
      pedidos.md
      cobros.md
      devoluciones.md
      inventarios.md
      depositos.md
      visitas.md
      productos.md
      vendedores.md
    {informe suelto}.md                        ← re-verificaciones, repros manuales, etc.
```

El nombre de la corrida **sigue llevando el cliente**, aunque ahora sea redundante con la carpeta: así los
nombres siguen siendo únicos y no se rompe nada que los referencie.

### Corridas de SCRIPT: prefijo `script`, y también dentro de la carpeta del cliente

🔴 **Cambio del 2026-09-02.** Los runners escribían en la **raíz** de `reports/`
(`playwright_{cliente}_{fecha}_{hora}`) y se acumularon **82 carpetas** mezcladas con los informes reales.
Ahora van donde va todo lo demás — dentro de `{cliente}/` — con el prefijo **`script`** como identificador:

| Qué se corrió | Carpeta | Runner |
|---|---|---|
| Todos los módulos | `{cliente}/script_{cliente}_{fecha}_{hora}/` | `playwright/run.js` |
| **Un solo módulo** (`--modulo=cobros`) | `{cliente}/script-cobros_{cliente}_{fecha}_{hora}/` | `playwright/run.js` |
| Capa web | `{cliente}/script-web_{cliente}_{fecha}_{hora}/` | `playwright/run-web.js` |
| Web extendido | `{cliente}/script-web-ext_{cliente}_{fecha}_{hora}/` | `playwright/run-web-extendido.js` |

Así, dentro de la carpeta de un cliente se distingue de un vistazo lo que **generó un script** de lo que
**se redactó a mano** (`fix_*`, `req_*`, `smoke-*`, informes sueltos).

**Quién depende de estos nombres** — si se cambian, hay que tocar los tres:
`playwright/report.js` (`nombreRun`) · `playwright/consolidar.js` (`ultimoDir`) ·
`web/manifest.js` (`detectarUltimoRun`).

⚠ **Al detectar «la última corrida», ordenar por el TIMESTAMP del final, nunca por el nombre completo.**
En ASCII `_` (0x5F) va después de `-` (0x2D), así que `script_…_20260901` queda alfabéticamente **después**
de `script-cobros_…_20260902` y se elige la corrida **más vieja**. Ya pasó al hacer este cambio.

**`{cliente}/_iteraciones-script/`** guarda las corridas viejas de la raíz — iteraciones de depuración de
los días en que se construyeron los scripts, con minutos de diferencia entre sí. Se conservan por si acaso;
se pueden borrar sin perder nada.

**Archivos globales (raíz):** este `README.md` (índice + convención) · `leer-corrida.js` · `aggregate.js` ·
e informes **transversales** que abarcan varios clientes (p. ej.
`PENDIENTE-pedidos-ocultos-salesman-view.md`, que mide el mismo defecto en 4 tenants).

### 🔴 El nombre de la carpeta es el SLUG del cliente, no el de la empresa

La carpeta debe llamarse **exactamente igual que el perfil** `automation/clientes/{slug}.yaml`, que es el mismo
`QA_CLIENTE` con el que se lanza la corrida. **No** usar el nombre comercial ni el de la empresa: un cliente
puede operar bajo una razón social distinta y se terminan creando dos carpetas para el mismo cliente.

*Ya pasó:* la corrida de la playa Caribe se guardó como `covadonga` porque la empresa se llama
**PROCESADORA DE ALIMENTOS COVADONGA**, pero el cliente es **`el_valle`**. Se fusionó el 2026-08-11.

Slugs canónicos y su razón social, para no confundirlos:

| Slug (= carpeta) | Razón social |
|---|---|
| `el_valle` | EL VALLE **(COVADONGA)** |
| `dm-electronica` | DM ELECTRONICA (aparece como **BOTZ** en notas viejas) |
| `don-theo` | COMERCIALIZADORA HNOS TORRES 2017, C.A. |
| `globalmp` | COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A. |
| `el_palmar` | CENTRAL EL PALMAR, S.A. |
| `jerez` | INV JEREZ MOTORS VALERA |
| `osoroma` | DISTRIBUIDORA OSOROMA C.A. |

⚠ **Ante la duda, la fuente de verdad es `ls automation/clientes/`.** Si no existe perfil para ese slug, es
señal de que se está por crear una carpeta con el nombre equivocado.

⚠ **Las dos herramientas recorren los dos niveles** y siguen aceptando corridas sueltas en la raíz, así que la
estructura vieja no se rompe. Se las invoca con la ruta completa:

```bash
node automation/reports/leer-corrida.js                                    # la más reciente POR FECHA
node automation/reports/leer-corrida.js difranca/smoke_difranca_20260810_main
node automation/reports/aggregate.js --cliente difranca
```

## Nombre de carpeta

```
{tipo}_{cliente}_{YYYYMMDD}_{HHMMSS}
```

| Parte | Valores | Ejemplo |
|-------|---------|---------|
| tipo | `smoke` / `fulltest` | `smoke` |
| cliente | slug del YAML (`insumar`, `hidroponias`, `romher`) | `insumar` |
| fecha | `YYYYMMDD` del RUN_ID | `20260603` |
| hora | `HHMMSS` del RUN_ID | `093706` |

## Corridas registradas

| Carpeta | Cliente | Fecha | Módulos | Resultado |
|---------|---------|-------|---------|-----------|
| [smoke_hidroponias_20260527_113900](hidroponias/smoke_hidroponias_20260527_113900/consolidado.md) | hidroponias | 2026-05-27 | 10/10 | 110P · 3F · 1S · 9N/A |
| [smoke_hidroponias_20260529_145657](hidroponias/smoke_hidroponias_20260529_145657/) | hidroponias | 2026-05-29 | 9/10 (sin consolidado) | 103P · 3F — ver módulos individuales |
| [smoke_hidroponias_20260602_retest-cobros](hidroponias/smoke_hidroponias_20260602_retest-cobros/) | hidroponias | 2026-06-02 | retest cobros | parcial |
| [smoke_insumar_20260602_180248](insumar/smoke_insumar_20260602_180248/) | insumar | 2026-06-02 | 1/10 (solo login) | parcial |
| [smoke_insumar_20260603_093706](insumar/smoke_insumar_20260603_093706/consolidado.md) | insumar | 2026-06-03 | 10/10 | 93P · 2F · 4S · 14N/A |
| [smoke_romher_20260604_122859](romher/smoke_romher_20260604_122859/consolidado.md) | romher | 2026-06-04 | 10/10 | 93P · 4F · 1S · 8N/A |
| [smoke_globalmp_20260605_162806](globalmp/smoke_globalmp_20260605_162806/consolidado.md) | globalmp | 2026-06-05/08 | 10/10 | 96P · 1F · 3S · 21N/A |
| [smoke_insumar_20260609_132051](insumar/smoke_insumar_20260609_132051/consolidado.md) | insumar | 2026-06-09 | 10/10 | 115P · 1F · 3S · 15N/A |
| [smoke_dm-electronica_20260713_115814](dm-electronica/smoke_dm-electronica_20260713_115814/consolidado.md) | dm-electronica (BOTZ) | 2026-07-13 | 10/10 | 117P · 0F · 0S · 20N/A |

## Rezagados — revisar manualmente

*(ninguno — todos los archivos existentes fueron agrupados en sus corridas)*
