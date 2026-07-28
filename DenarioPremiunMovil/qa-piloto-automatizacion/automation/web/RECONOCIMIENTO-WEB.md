# F0 — Reconocimiento de la web (Denario Premium)

**Fecha:** 2026-07-28 · **Playa:** Isla Coche · **Empresa:** CAPITALINA DE ALIMENTOS 212, C.A.
**Usuario:** `admin` (bloque `# USUARIO WEB` de `secrets/qa-credentials.env`) · **Modo:** READ-ONLY (no se creó, editó ni borró nada)
**Estado:** ✅ **los 7 módulos del alcance recorridos** (lista + filtros + tabla). Detalle abierto en cobros.

---

## 1. Resumen: el terreno es MUCHO mejor de lo que la propuesta asumía

La `PROPUESTA-QA-WEB.md` asumió el peor caso de JSF (IDs `j_idt*` inestables, navegación atada al `ViewState`).
El reconocimiento lo desmiente en tres puntos que **bajan el esfuerzo estimado**:

| Supuesto de la propuesta | Realidad medida | Efecto |
|---|---|---|
| IDs auto-generados en todas partes → selectores frágiles | **IDs semánticos** en lo que importa: `form:cobrosDT`, `form:documentosPagadosDT`, `form:cobrosDT:0:consultar`. Los `j_idt*` quedan en el login y en tablas sueltas | Riesgo #1 **muy reducido** |
| Navegar solo por clicks (riesgo de `ViewExpired`) | **La navegación directa por URL funciona** con sesión activa: `/pages/cobros` carga limpio | **Sin recorrido de menú** por módulo → más rápido y más simple |
| Habría que descubrir cómo localizar cada registro | Cada lista trae filtro **`# Ref`** — exactamente la llave que el móvil ya deja en el manifiesto | El cotejo se engancha **sin discovery** |

---

## 2. Mapa de navegación (verificado)

Los 7 módulos del alcance existen y son alcanzables. Rutas completas en `automation/web/playas.yaml`.

| Módulo (alcance) | Ruta | Menú |
|---|---|---|
| Pedidos | `/pages/pedidos` | Transacciones |
| Cobros | `/pages/cobros` | Transacciones |
| Devoluciones | `/pages/devoluciones` | Transacciones |
| Depósitos | `/pages/depositos` | Transacciones |
| Clientes Potenciales | `/pages/clientesPotenciales` | Transacciones |
| Inventarios | `/pages/inventarios` | Transacciones |
| Visitas | `/pages/visitas` | Visitas → Reporte de Visitas |

**Fuera de alcance** (existen, no se validan): Facturaciones · Datos Maestros (productos/clientes/documentos) ·
Reportes · Indicadores · Empresa · Estructura Comercial · Usuarios/Dispositivos/Licencias.

> El login **no pide seleccionar empresa**: entra directo a `/pages/main` y los datos ya vienen
> alcanzados a la empresa del servidor (aquí, CAPITALINA). ⚠ **Falta confirmar** qué pasa en una playa
> que aloje más de una empresa (§6).

---

## 3. Cobros — recorrido a fondo

### Lista `/pages/cobros`

- Tabla `form:cobrosDT` · **36 columnas** · 50 filas por página · botones `Buscar` · `Limpiar` · `Columnas`.
- **Filtros:** `# Ref` · Vendedor · Cliente · Tipo Cobro · Fecha Inicio/Final · Depositado · Moneda (BS) ·
  Tiene Adjunto · Status (Por aprobar / Aprobado).
- **Columnas con valor de oráculo:** Monto cobrado · Total por cobrar · **Diferencia cobro** · **Monto conv.** ·
  **Por cobrar conv.** · **Diferencia cambiaria** · **Tasa conv.** · Nro Retención · Banco receptor · Depósito.

### Detalle `/pages/detalleCobro` (botón `Consultar` de la fila)

Dos tablas hijas — **es el nivel donde vive el cotejo campo-a-campo**:

| Tabla | ID | Columnas |
|---|---|---|
| Pagos | `form:j_idt177` ⚠ *auto-generado — anclar por estructura* | N° · Forma de pago · Banco receptor · Número de Cuenta · Fecha valor · Nro Documento · Fecha documento · Monto cobrado · Monto conv. |
| Documentos pagados | `form:documentosPagadosDT` ✅ | N° · Fecha documento · Tipo documento · Nro Factura · Pago parcial · Monto doc · Saldo doc. · Total descuento · Monto a pagar · Doc Retención · Fecha Comprobante · **Retención IVA** · **Retención ISLR** · Diferencia/Faltante · Moneda · + 6 columnas de conversión |

### ✅ El oráculo de cálculo ya quedó demostrado con datos reales

Tomando 3 cobros de capitalina y la tasa que muestra la propia fila (724,00 BS = 1 US$):

| # Ref | Monto cobrado | ÷ tasa | Monto conv. mostrado | ✓ |
|---|---|---|---|---|
| 526 | 50.687,24 BS | 70,0100… | **70,01 US$** | ✅ |
| 525 | 2.000.000,00 BS | 2.762,4309… | **2.762,43 US$** | ✅ |
| 519 | 47.950,52 BS | 66,2299… | **66,23 US$** | ✅ |

⇒ La conversión es verificable **desde la lista misma**, sin abrir el detalle. Es el patrón que replicarán
los demás derivados (IGTF, retención, descuentos, saldos).

---

## 3.b Los 7 módulos — mapa medido

| Módulo | Ruta | ID de tabla | Acción de fila | Filtro `# Ref` | Filas vistas (capitalina) |
|---|---|---|---|:---:|---:|
| **Cobros** | `/pages/cobros` | `form:cobrosDT` ✅ único | `form:cobrosDT:0:consultar` | ✅ | 50+ |
| **Pedidos** | `/pages/pedidos` | `form:pedidosDT` | `form:pedidosDT:0:consultar` | ✅ | 50+ |
| **Devoluciones** | `/pages/devoluciones` | `form:pedidosDT` ⚠ | `form:pedidosDT:0:consultar` | ✅ | 3 |
| **Depósitos** | `/pages/depositos` | `form:pedidosDT` ⚠ | `form:pedidosDT:0:consultar` | ✅ | 2 |
| **Clientes Potenciales** | `/pages/clientesPotenciales` | `form:pedidosDT` ⚠ | `form:pedidosDT:0:consultar` | ❌ | 2 |
| **Inventarios** | `/pages/inventarios` | `form:pedidosDT` ⚠ | `form:pedidosDT:0:consultar` | ✅ | 1 |
| **Visitas** | `/pages/visitas` | `form:tablaVisit` ✅ único | `form:tablaVisit:0:consultar` | ❌ (col. `Ref`) | 50+ |

### Tres hallazgos operativos de este barrido

1. **⚠ `form:pedidosDT` NO es único: lo reutilizan 5 módulos.** Devoluciones, depósitos, clientes potenciales e
   inventarios usan el mismo ID que pedidos. **Un selector por ID solo no identifica el módulo** — el helper debe
   verificar primero `location.pathname` (o `document.title`) y recién entonces leer la tabla. Es el gotcha #1 de la web.
2. **El patrón de acción de fila `{idTabla}:{i}:consultar` se cumple en 7/7.** Es la regla más sólida del sitio.
3. **El filtro `# Ref` existe en 5/7.** Faltan en **clientes potenciales** (no hay filtro, aunque sí columna `# Ref`)
   y **visitas** (columna `Ref`, sin filtro). Para esos dos, la búsqueda del registro es por **vendedor + rango de
   fechas** y luego barrido de filas por Ref → más caro; hay que preverlo en el guión.

### Columnas por módulo (lo que alimenta el oráculo)

- **Pedidos:** Total items · Monto Base · **Monto Total** · **Monto conv.** · **Tasa conv.** · Fecha creación/envío.
- **Depósitos:** Banco · N° Planilla · **Monto depositado** · **Monto depositado conv.** · **Tasa conv.**
- **Devoluciones:** solo cabecera en la lista (Ref · Estatus · Fecha · Vendedor · Cliente) → **los montos viven en el detalle**.
- **Inventarios:** solo cabecera en la lista → **cantidades/lote/ubicación en el detalle**.
- **Clientes Potenciales:** **Rif. Cliente** · Cliente · Responsable · Fecha.
- **Visitas:** Título · **Fecha Programada / Iniciada / Enviada** · Status · **Geo** · Actividad · Motivo · Descripción.
  Filtros ricos: Roles · Actividad · Motivo · Adjuntos · Despachado · **Coordenadas**.

### ⚠ Superficie de escritura por módulo (el agente es READ-ONLY)

| Módulo | Controles de ESCRITURA en la pantalla |
|---|---|
| **Visitas** | **`Editar` y `Eliminar` por fila** — la superficie más peligrosa del sitio |
| Pedidos | `Nuevo Pedido` · `Copiar` (por fila) |
| Cobros | `<select>` **"Estatus del Cobro" editable en la fila** |
| Devoluciones · Depósitos · Clientes Pot. · Inventarios | solo `Consultar` (sin riesgo aparente) |

⇒ Regla dura para los guiones `DW-`: **el único control que se toca en una fila es `Consultar`.** Nada más.

---

## 4. Hallazgos que cambian el diseño de los helpers

1. **`browser_snapshot` no sirve como observación por defecto.** El de `/pages/cobros` devolvió
   **76.000 caracteres** y reventó el límite de tokens. Regla: `browser_evaluate` devolviendo **solo el JSON
   del oráculo**. (Es la palanca P3 de `PROPUESTA-ARQUITECTURA-OPTIMIZACION.md`, aquí obligatoria desde el día 1.)
2. **Las celdas traen el encabezado pegado** (`"# Ref526"`, `"Monto cobrado 50.687,24 BS"`) porque PrimeFaces
   duplica el `th` dentro del `td`. El lector tiene que quitar ese prefijo.
3. **Las celdas con `<select>` concatenan todas las opciones**; el valor real es el último token.
4. **⚠ Riesgo de escritura accidental:** la columna "Estatus del Cobro" es un `<select>` **editable en la fila**.
   Tocarlo cambia el estatus del documento **en producción**. Queda como anti-patrón explícito en
   `web-selectors/_comunes.md`.
5. **Formato es-VE:** `.` miles, `,` decimales; fechas `DD/MM/YYYY HH:mm:ss`.

---

## 5. Incidencia operativa

La clave del bloque `# USUARIO WEB` no era la de Isla Coche en el primer intento (`USUARIO INVALIDO`);
QA la corrigió y el acceso funcionó. **Confirma el riesgo anticipado:** si la clave llega a diferir **por playa**,
un solo bloque no alcanza y habrá que partirlo por playa. Hoy es una sola → se deja simple.

---

## 6. Qué falta para cerrar F0

- [x] ~~Recorrer los otros 6 módulos~~ — **hecho** (§3.b): los 7 tienen ruta, ID de tabla, filtros y columnas mapeados.
- [ ] Abrir el **detalle** de los 6 módulos restantes (solo cobros está abierto). Es donde viven los montos de
      devoluciones e inventarios, que no aparecen en la lista.
- [ ] Confirmar el comportamiento en una playa con **más de una empresa** (¿selector de empresa? ¿filtro?).
- [ ] Probar el **aislamiento de contextos del MCP**: navegador web + CDP del dispositivo a la vez.
      **De esto depende** que la corrida web sea gratis en wall-clock (en paralelo) o cueste 30–45 min (al cierre).
- [ ] Cotejo end-to-end con un `# Ref` salido de una corrida **del agente** (los de aquí son de corridas manuales de QA).

---

*F0 · reconocimiento read-only · no se modificó ningún dato de la web*
