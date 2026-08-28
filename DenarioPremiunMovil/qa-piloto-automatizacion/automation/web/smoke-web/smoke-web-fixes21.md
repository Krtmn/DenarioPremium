# Smoke WEB — FIXES-21 · puntos 1 y 4

> Casos para el **tag especial de la v21** pedido por 3 clientes que vieron cambios de comportamiento
> respecto a su versión anterior. De los 4 puntos a validar, **estos 2 son de la WEB**; los otros dos
> (saldo en $ del selector de clientes, y conversión en el detalle de productos) son de la móvil y
> viven en la rama `Fixes-21`.
>
> **Cliente de prueba:** `globalmp` — COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A. · **Isla Coche**
> **Solicitante:** globalmp pidió todo menos el Excel, que lo pidió otro cliente.

---

## 🔴 Estado del despliegue medido el 2026-08-27

**Antes de correr, saber esto:** el despliegue de Isla Coche está **parcial**.

| Punto | ¿Desplegado? | Cómo se comprobó |
|---|---|---|
| **1 · Excel General/Detalle** | ✅ **SÍ** | El menú con las dos opciones existe y abre |
| **4 · Filtros al volver atrás** | ❌ **NO** | Se reprodujo el defecto: el filtro se pierde |

⇒ El punto 4 **todavía no se puede dar por validado**: hay que esperar el despliegue. Los casos quedan
escritos para cuando llegue.

---

## ⚠ Bloqueo de oráculo: sin acceso a BD

La base `global_mp` **existe y conecta, pero `user_read` no tiene permiso sobre ninguna tabla**
(probadas 6, todas `permission denied`). **Acción DBA:** aplicar el `GRANT SELECT` read-only.

**Qué implica:** los casos marcados 🔵 **necesitan BD** para cotejar conteos y no se pueden dictaminar
sin el grant. Los demás se validan solo con la UI.

---

## Datos de la pantalla (medidos)

| Elemento | Selector | Nota |
|---|---|---|
| Botón Excel | `form:pedidosDT:btnExcelPedidos` | icono verde, `title="Exportar Reporte"` |
| Opción **General** | `form:pedidosDT:j_idt188` | aparece al pulsar el botón Excel |
| Opción **Detalle** | `form:pedidosDT:j_idt190` | ídem |
| Filtro `# Ref` | `form:j_idt115:n_ref` | |
| Botón Buscar | `form:j_idt115:ajax` | |
| Consultar (fila 0) | `form:pedidosDT:0:consultar` | lleva a `/pages/detallePedido` |
| Tabla | `form:pedidosDT` | |

⚠ Los ids `j_idt###` los **genera JSF y cambian entre despliegues**. Anclar por **texto** cuando se pueda
(`getByRole('link', { name: 'Detalle' })`) y usar estos ids solo como pista.

⚠ `globalmp` es **multiempresa**: `HC TRADING MARKET 2021, C.A` y `COMERCIALIZADORA DE ALIMENTOS GLOBAL
M&P, C.A.` (esta última es la que trae por defecto). Fijar la empresa **antes** de filtrar, y anotar cuál
se usó: casi todo en esta BD es por empresa.

---

## PUNTO 1 · Excel de pedidos con selector General / Detalle

**Qué se pidió:** que al exportar se pueda elegir entre dos formatos.
- **General** → una línea por **pedido** (como los datos de cabecera)
- **Detalle** → una línea por **producto** de cada pedido

| ID | Caso | PASS cuando | Nivel |
|----|------|-------------|-------|
| **DW-X21-E01** | Pulsar el botón Excel | Se despliega un menú con **exactamente dos** opciones: `General` y `Detalle` | 🔴 |
| **DW-X21-E02** | Elegir **General** | Se dispara la descarga; el evento `download` se captura y `download.failure()` es `null` | 🔴 |
| **DW-X21-E03** | Elegir **Detalle** | Ídem — descarga un archivo distinto del anterior | 🔴 |
| **DW-X21-E04** | Abrir el archivo **General** | **1 fila por pedido**; el nº de filas == `Total de Resultados` de la pantalla | 🔴 |
| **DW-X21-E05** | Abrir el archivo **Detalle** | **1 fila por producto**; el nº de filas == Σ de líneas de los pedidos exportados | 🔴 |
| **DW-X21-E06** | 🔑 **Contraste entre los dos** | `filas(Detalle) > filas(General)` salvo que todo pedido tenga 1 solo producto. **Los dos archivos deben cubrir los MISMOS pedidos** | 🔴 |
| **DW-X21-E07** | Exportar **con un filtro aplicado** (ej. un vendedor) | El archivo respeta el filtro: no trae pedidos de fuera | 🔴 |
| **DW-X21-E08** | Cabeceras de cada formato | `General` trae columnas de cabecera; `Detalle` **añade** las de producto (código, descripción, cantidad, precio) | 🟡 |
| **DW-X21-E09** 🔵 | Conteo contra BD | filas de `General` == pedidos en BD con esos filtros; filas de `Detalle` == líneas de `order_detail` | 🔴 |
| **DW-X21-E10** | Exportar con **0 resultados** | No rompe: archivo vacío con cabeceras, o aviso claro. **Nunca un error de servidor** | 🟡 |

### Cómo capturar la descarga

Ya está resuelto y probado en este proyecto (ver `smoke-web/README.md`): el patrón del botón
`Descargar adjuntos` sirve igual. Esperar el evento `download` de Playwright, comprobar
`download.failure() === null` y guardar el archivo en el `RUN_DIR`.

⚠ **Verificar los magic bytes**: un `.xlsx` es un ZIP y empieza con **`PK`**. Si el archivo abre pero
empieza con `<html`, lo que descargó fue una página de error. Es el falso PASS clásico de este caso.

### 🔴 Lo que de verdad hay que demostrar

No basta con que las dos opciones descarguen algo. **El caso es que descarguen cosas DISTINTAS y ambas
correctas.** El riesgo real es que las dos opciones bajen el mismo archivo (el selector no hace nada) o
que `Detalle` traiga cabeceras repetidas sin las líneas de producto. Por eso `DW-X21-E06` es el caso
central: hay que **abrir los dos archivos y compararlos**, no solo verificar que se descargaron.

---

## PUNTO 4 · Los filtros se pierden al volver atrás

**Qué se reportó:** se aplica un filtro, se entra a un registro y al volver **se pierde la búsqueda**.

### 🔴 Reproducido el 2026-08-27 — el defecto está vivo, y es SOLO DE PEDIDOS

**Hallazgo que acota el reporte: el defecto NO es de toda la web.** Medido el mismo día, con el mismo
método (filtrar → `Consultar` → back del navegador):

| Módulo | Filtro tras volver | Filas | Veredicto |
|---|---|---|---|
| **Cobros** | `11199` conservado | 1 | 🟢 **conserva** |
| **Pedidos** | **vacío** | **50 de 2.289** | 🔴 **pierde** |

⇒ **Reportarlo como defecto de PEDIDOS, no de «los filtros de la web».** Si la tarjeta dice "la web
pierde los filtros", desarrollo revisa el comportamiento general, lo ve funcionar en Cobros y la
devuelve como *no reproduce*.

Pasos exactos y resultado medido en Pedidos (reproducido **2 veces**, con `18569` y con `18568`):

```
1. /pages/pedidos  →  filtro # Ref = 18568  →  Buscar
   ✓ tabla = 1 fila (la correcta)
2. Consultar en esa fila  →  /pages/detallePedido
3. Volver atrás (back del navegador)
   ✗ input # Ref = VACÍO
   ✗ tabla   = 50 filas
   ✗ total   = 2.289  (la lista completa)
```

⚠ **En el detalle NO hay botón «Volver»**: la única vía es el back del navegador o el breadcrumb.
Eso hace el defecto más molesto — el usuario no tiene alternativa.

⚠ **Inventarios y Devoluciones no se pudieron medir**: no tienen registros en el rango de fechas por
defecto, así que no hay fila que consultar. Quedan pendientes para cuando haya datos.

| ID | Caso | PASS cuando | Nivel |
|----|------|-------------|-------|
| **DW-X21-F01** | Filtrar → `Consultar` → **back del navegador** | El filtro **se conserva** en el input y la tabla sigue mostrando el resultado filtrado | 🔴 |
| **DW-X21-F02** | Ídem con el **breadcrumb** (`Transacciones → Pedidos`) | Ídem | 🔴 |
| **DW-X21-F03** | Filtro **combinado** (vendedor + rango de fechas) → detalle → volver | Se conservan **todos** los filtros, no solo uno | 🔴 |
| **DW-X21-F04** | Filtro + **paginar a la página 3** → detalle → volver | Se conserva el filtro **y la página** en la que estaba | 🟡 |
| **DW-X21-F05** | `Limpiar` tras volver | Limpia de verdad y vuelve al total | 🔴 |
| **DW-X21-F06** | Repetir en **otros módulos** (cobros, inventarios, devoluciones, visitas) | Mismo comportamiento — el fix no debe quedar solo en pedidos | 🔴 |
| **DW-X21-F07** 🔵 | Conteo tras volver | El conteo de la tabla == el que había antes de entrar al detalle | 🟡 |

### ⚠ Ojo con este contraste — puede dar un falso PASS

`web-selectors/cobros.md` documenta que **el filtro JSF PERSISTE entre navegaciones por URL**: volver a
`/pages/cobros` escribiendo la URL conserva el filtro anterior.

⇒ **Navegar por URL NO sirve para validar este caso**: haría parecer que el filtro se conserva cuando lo
que se está viendo es un filtro pegado del servidor. **Hay que volver con el back real o el breadcrumb**,
que es lo que hace el usuario.

⚠ Y al revés: esa persistencia puede **ensuciar los casos siguientes**. Tras cada caso, `Limpiar` y
verificar que el input quedó vacío antes de seguir.

---

## Alcance y reservas

- **La web es PRODUCCIÓN y estos casos son SOLO LECTURA.** Los únicos controles que se tocan son
  `Buscar`, `Limpiar`, `Consultar`, el paginador y el botón de Excel. Nada de Guardar, Aprobar, Editar,
  Eliminar ni el selector de estatus de la fila.
- **Descargar sí está permitido**: no modifica datos.
- Los casos 🔵 quedan **BLOQUEADOS** hasta que apliquen el `GRANT` sobre `global_mp`.
- El punto 4 queda **pendiente de despliegue**: hoy reproduce.

## Lo que estos casos NO cubren

- El formato interno del Excel más allá del conteo de filas y las cabeceras (no se validan fórmulas,
  formatos de celda ni estilos).
- Los otros dos puntos del tag (saldo en $ y conversión en productos): son de la **móvil**, van con el
  APK de `Fixes-21` y con el guión de conformidad `K##`.
- Un dato observado que **queda por verificar y no es parte de estos casos**: la cabecera de pedidos
  muestra `Monto total en USD: 0,00` con 2284 resultados. Puede ser fiel (si todos son en BS) o el mismo
  patrón del escape de facturaciones de la v21. **Necesita BD para dictaminarse** — ver
  `GUION-CONFORMIDAD-CONFIG.md` §5, y no aceptar un `0,00` sin consultar la base.
