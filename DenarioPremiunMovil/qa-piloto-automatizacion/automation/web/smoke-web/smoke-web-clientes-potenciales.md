# Smoke WEB — Módulo CLIENTES POTENCIALES

**Ruta:** `/pages/clientesPotenciales` · **Tabla:** `form:pedidosDT` ⚠ **compartida** · **Detalle:** `/pages/detalleClientePotencial`
**Reglas:** `../WEB-RUNTIME.md` · **Selectores:** `../web-selectors/_comunes.md` · **Modo:** 🔴 READ-ONLY

## 🔑 Particularidad crítica: el detalle **NO expone `No. de Ref.`**

Es el **único módulo** donde la cabecera del detalle **no trae el Nro.Ref**. Solo muestra **`Código`**, que es
el **epoch `co_potential_client`**.

⇒ **El epoch es la única llave dentro del detalle.** El `# Ref` **sí** está en la **columna de la lista**, así
que la localización se hace en la lista y la identificación dentro del detalle, por epoch.
Sin el `epoch` en el manifiesto, este módulo **no se puede cotejar a nivel detalle**.

⚠ **Y no tiene FILTRO por `# Ref`** (aunque sí la columna) → localizar por **vendedor + rango de fechas** y
**barrer filas** comparando la columna `# Ref`. Es el módulo más caro de localizar.

⚠ `verificarContexto(ctx, 'clientes_potenciales', esDetalle, playa)` antes de leer.

## Particularidad 2: **sin montos**
No hay importes ⇒ **no hay oráculo de cálculo**. Se verifica **integridad de datos fiscales y de contacto**,
que es donde un error se paga caro (un RIF mal cargado bloquea la facturación del cliente).

## Familias
`C##` cotejo · `F##` filtros · `M##` muestreo BD↔web · `D##` comportamiento

---

## COTEJO (`C##`)

El detalle se organiza en 3 secciones: **Datos Básicos · Contacto · Dirección**.

| ID | Verifica | PASS cuando |
|----|----------|-------------|
| **DW-CLT-C01** | Presencia: barrer la lista por la columna `# Ref` | la fila existe y su `# Ref` coincide |
| **DW-CLT-C02** | 🔑 **Llave del detalle**: `Código` == **epoch** del manifiesto | coincide exacto |
| **DW-CLT-C03** | **Datos Básicos**: `Nombre`, `Fecha de Registro`, `Vendedor`, **`Cédula`/RIF**, `Comentario` | `cotejarCampos` → 0 diffs ⚠ la etiqueta puede venir como `Cédula::` (doble `:`) → normalizar |
| **DW-CLT-C04** | **Contacto**: `Responsable`, `Correo`, `Teléfono` | exactos |
| **DW-CLT-C05** | **Dirección**: `Dirección` y `Dirección Entrega` | exactas, sin truncar |
| **DW-CLT-C06** | 📋 **RIF/Cédula en la LISTA** (columna `Rif. Cliente`) == el del detalle | consistencia lista↔detalle |
| **DW-CLT-C07** | **Coordenada de transacción** (`lat,lng`) | coincide con la enviada |
| **DW-CLT-C08** | Adjuntos y **firma** si el móvil los mandó | presentes |
| **DW-CLT-C09** | ⚠ **Trampa de etiqueta vacía**: `Web:` sin valor **absorbe el título de la sección siguiente** (`Contacto`) | el lector **no** debe reportar `Web = "Contacto"`. Usar `__qaW.leerCabecera()` (padre-primero) |
| **DW-CLT-C10** | **Estatus de aprobación** si la web lo muestra | coherente con `st_potential_client` |

**Datos reales** (`el_valle-20260728`): **Ref 2** · epoch `1785244841833` ·
`Test-CLT-SMOKE-133515` · RIF `J987654321` · tel `04123053302` · responsable `QA Automation` ·
correo `qa.smoke@kiberno.com` · dirección `AV PRINCIPAL QA SMOKE EL VALLE`.

---

## FILTROS (`F##`)

⚠ **Sin filtro de `# Ref`** — es la limitación del módulo. Los filtros disponibles son pocos.

| ID | Filtro | PASS | Nivel |
|----|--------|------|-------|
| **DW-CLT-F01** | Vendedor | conteo == BD | 🔴 |
| **DW-CLT-F02** | Rango de fechas | ninguno fuera del rango | 🔴 |
| **DW-CLT-F03** | `Limpiar` | vuelve al total | 🔴 |
| **DW-CLT-F04** | Vendedor **+** rango de fechas | **intersección**, no unión | 🔴 |
| **DW-CLT-F05** | Tiene Adjunto | coherente | 🟢 |
| **DW-CLT-F06** | 🔎 **Ausencia de filtro por `# Ref`** | documentarlo como **limitación de la web**, no como fallo. Es lo que encarece la localización |

---

## MUESTREO BD ↔ WEB (`M##`)

```sql
SELECT pc.id_potential_client, pc.co_potential_client, pc.na_client, pc.nu_rif,
       pc.em_client, pc.nu_phone, pc.tx_address, pc.st_potential_client, pc.da_potential_client
FROM potential_client pc ORDER BY pc.id_potential_client DESC LIMIT 30;
```

| ID | Verifica |
|----|----------|
| **DW-CLT-M01** | Los de BD aparecen filtrando por un rango que los abarque |
| **DW-CLT-M02** | 🆔 **RIF/Cédula** de la lista == `nu_rif` de BD, en **todos** los muestreados |
| **DW-CLT-M03** | En **5 detalles**: correo, teléfono y direcciones == BD, **sin truncar** |
| **DW-CLT-M04** | **Consistencia lista ↔ detalle** (nombre, RIF, responsable, fecha) |
| **DW-CLT-M05** | **Ningún RIF duplicado** entre potenciales, y ninguno que ya exista en `client` |

> 💡 `M02` y `M05` son los de mayor valor de negocio: un RIF mal cargado o duplicado **bloquea la
> facturación** del cliente cuando lo aprueben. Se detecta gratis con este contraste.

---

## COMPORTAMIENTO (`D##`)

| ID | Verifica |
|----|----------|
| **DW-CLT-D01** | Paginación *(⚠ en `el_valle` había 2 registros: si no hay volumen, `WEB-N/A` por falta de datos)* |
| **DW-CLT-D02** | Orden por `# Ref` (numérico) y por `Fecha` |
| **DW-CLT-D03** | Selector `Columnas` |
| **DW-CLT-D04** | Lista vacía → mensaje, sin error |
| **DW-CLT-D05** | El mapa del detalle no bloquea la lectura si no carga |

---

## Veredictos y ledger

`WEB-OK` · `WEB-MISSING` · `WEB-FIELD-MISMATCH` · `WEB-N/A`
⚠ **`WEB-CALC-MISMATCH` no aplica**: el módulo no maneja montos.

```json
{"run_id":"<RUN_ID>","capa":"web","modulo":"clientes_potenciales","caso":"DW-CLT-C03","ref":"2","marca":"WEB-OK","ms":0}
```

> ⚠ El manifiesto móvil rotula este módulo como `"modulo":"clientes"`, pero en la web es
> **`clientes_potenciales`** (`/pages/clientesPotenciales`). Tenerlo en cuenta al hacer el join.
