# Smoke WEB — Módulo VISITAS (Reporte de Visitas)

**Ruta:** `/pages/visitas` · **Tabla:** `form:tablaVisit` ✅ **única** · **Detalle:** `/pages/protected/visitas/detalleVisita.xhtml` ⚠ **forma de URL distinta** (legacy, con `/protected/` y `.xhtml`)
**Reglas:** `../WEB-RUNTIME.md` · **Selectores:** `../web-selectors/_comunes.md` · **Modo:** 🔴 READ-ONLY

## 🔴🔴 La superficie MÁS PELIGROSA de toda la web

**Cada fila trae botones `Editar` y `Eliminar`.** Un click accidental **borra una visita real en producción**.

**Regla dura:** el único control que se toca en una fila es **`Consultar`**. Antes de cualquier click por
coordenadas, verificar con `document.elementFromPoint(x,y)` que el elemento bajo el cursor es el esperado.
Ante la mínima duda → **⛔ BLOCKED**, nunca "probar a ver".

## Particularidad: el detalle NO alcanza, hay que leer lista **y** detalle

| Campo | ¿Dónde vive? |
|---|---|
| Nro.Ref, vendedor, fecha **planeada**, empresa, cliente, orden de visita, ubicación, título | **detalle** |
| **Estatus**, **Fecha Iniciada**, **Fecha Enviada**, **Geo**, actividad, motivo, descripción | **lista** |

⇒ El detalle **no tiene** `Observaciones`, ni `Estatus`, ni fechas de inicio/envío. Cotejar solo el detalle
deja fuera la mitad de los campos.

⚠ **Corrección a la doc previa:** visitas **SÍ tiene filtro `# Ref`** (`input[placeholder="# Ref"]`) —
no hace falta barrer filas.

## Familias
`C##` cotejo · `F##` filtros · `M##` muestreo BD↔web · `D##` comportamiento

---

## COTEJO (`C##`)

| ID | Verifica | PASS cuando |
|----|----------|-------------|
| **DW-VIS-C01** | Presencia por filtro `# Ref` | 1 fila y coincide |
| **DW-VIS-C02** | Cabecera del **detalle**: vendedor, empresa, cód. y nombre del cliente, **orden de visita** | `cotejarCampos` → 0 diffs |
| **DW-VIS-C03** | **Las 3 fechas** (Programada / Iniciada / Enviada) desde la **lista** | veredicto por día; hora distinta = nota |
| **DW-VIS-C04** | **Estatus** (ej. `visitado`) desde la lista | coincide con lo enviado |
| **DW-VIS-C05** | **Actividades** (`form:visitasDT`): actividad, motivo, descripción | 1:1, incluida la descripción completa |
| **DW-VIS-C06** | **Coordenada** | ⚠ **no es texto visible**: está en el HTML del mapa. Quedarse con la variante de **más decimales** |
| **DW-VIS-C07** | 📝 **`Título`** | ⚠ **NO cotejar literalmente**: lo **genera el móvil** con el patrón `{YYYY-MM-DD}-{cliente}` y la web lo muestra fiel. Verificar que **respeta ese patrón**, no que sea igual a una etiqueta descriptiva |
| **DW-VIS-C08** | Campos que la web **enriquece** | ⚠ nota, no mismatch: vendedor `001`→`001 001`, empresa `00001`→razón social |
| **DW-VIS-C09** | **`Geo`** de la lista | ⚠ es una **clasificación de la web** (`Fuera de Rango` según `transactionCoordinateRadius=50 m`), **no** la coordenada. Verificar que la clasificación sea **coherente** con la distancia real, no que coincida con lo que mandó el móvil |

**Datos reales** (`el_valle-20260728`): **Ref 51** — ABASTOS Y CARNICERIA HERMANOS FLORES CA (`J309901710`) ·
`COBRANZA` / `COBRANZA EFECTIVA` · coord `11.0490583,-63.8649814` · **Visitado** · las 3 fechas coincidieron
**al segundo** (sin desfase UTC).

⚠ **Trampa de la regla de cabecera:** `Titulo:` es el **último campo antes de la tabla hija**, así que la regla
"hoja siguiente" toma el encabezado `N°` como valor. **Usar `__qaW.leerCabecera()`** (padre-primero).

---

## FILTROS (`F##`) — el módulo con más filtros de todos

| ID | Filtro | PASS | Nivel |
|----|--------|------|-------|
| **DW-VIS-F01** | `# Ref` existente | 1 fila | 🔴 |
| **DW-VIS-F02** | `# Ref` inexistente | 0 filas, sin error | 🔴 |
| **DW-VIS-F03** | `Limpiar` | vuelve al total | 🔴 |
| **DW-VIS-F04** | Vendedor | conteo == BD | 🔴 |
| **DW-VIS-F05** | Rango de fechas *(por defecto trae un rango preseleccionado)* | ninguna fuera del rango | 🔴 |
| **DW-VIS-F06** | **Actividad** | solo visitas con esa actividad | 🟡 |
| **DW-VIS-F07** | **Motivo** | solo ese motivo | 🟡 |
| **DW-VIS-F08** | Estatus | solo ese estatus | 🟡 |
| **DW-VIS-F09** | Cliente | solo ese cliente | 🟢 |
| **DW-VIS-F10** | **Coordenadas** (con/sin) | coherente con las que tienen geo | 🟢 |
| **DW-VIS-F11** | **Despachado** | coherente | 🟢 |
| **DW-VIS-F12** | Adjuntos | coherente | 🟢 |
| **DW-VIS-F13** | Roles | coherente | 🟢 |
| **DW-VIS-F14** | Actividad **+** rango de fechas | intersección | 🟡 |

Anclas confirmadas: `input[placeholder="# Ref"]` · `button[id$=":btnBuscar"]` · `button[id$=":botonLimpiar"]` ·
`[id$=":idSalesman_input"]` · `[id$=":dateB_input"]` / `[id$=":dateF_input"]` · `[id$=":idType_input"]` (actividad) ·
`[id$=":idMotive_input"]` · `[id$=":idEstatus_input"]`.
⚠ El panel de filtros es `form:j_idt116` (auto-generado) → **anclar por sufijo de id**, nunca por el contenedor.

---

## MUESTREO BD ↔ WEB (`M##`)

```sql
SELECT v.id_visit, v.co_visit, v.co_client, v.st_visit, v.is_visited,
       v.da_visit_planned, v.da_visit_start, v.da_visit_end, v.nu_latitude, v.nu_longitude
FROM visit v ORDER BY v.id_visit DESC LIMIT 30;
```

| ID | Verifica |
|----|----------|
| **DW-VIS-M01** | Las 30 aparecen filtrando por un rango que las abarque |
| **DW-VIS-M02** | Estatus y las 3 fechas de la lista == BD |
| **DW-VIS-M03** | En **5 detalles**: actividades y motivos == `visit_incidence` |
| **DW-VIS-M04** | **Coordenadas** == `nu_latitude`/`nu_longitude` en los que las tengan |
| **DW-VIS-M05** | **Consistencia lista ↔ detalle** (cliente, vendedor, orden de visita) |
| **DW-VIS-M06** | El **patrón del título** `{fecha}-{cliente}` se cumple en las visitas de origen móvil |

---

## COMPORTAMIENTO (`D##`)

| ID | Verifica |
|----|----------|
| **DW-VIS-D01** | Paginación (la lista trae 50) |
| **DW-VIS-D02** | Orden por `Ref` (numérico) y por las 3 fechas |
| **DW-VIS-D03** | Lista vacía → mensaje, sin error |
| **DW-VIS-D04** | ⚠ **El filtro PERSISTE entre navegaciones por URL** — volver a `/pages/visitas` conserva el filtro anterior. Verificar el `value` del input antes de confiar en un listado |
| **DW-VIS-D05** | ❌ **NO** se prueban `Editar` ni `Eliminar` — documentarlo como decisión, no como cobertura faltante |

> ℹ **Defecto conocido** `DM-VIS-020` (permite Enviar sin firma pese a `signatureVisit=true`) es **del móvil**;
> reconfirmado en 4 playas. No es fallo web.

---

## Veredictos y ledger

`WEB-OK` · `WEB-MISSING` · `WEB-FIELD-MISMATCH` · `WEB-N/A`
⚠ **`WEB-CALC-MISMATCH` no aplica**: visitas no maneja montos.

```json
{"run_id":"<RUN_ID>","capa":"web","modulo":"visitas","caso":"DW-VIS-C05","ref":"51","marca":"WEB-OK","ms":0}
```
