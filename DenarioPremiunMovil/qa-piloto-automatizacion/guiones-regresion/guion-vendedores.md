# Guion de regresión — Denario Premium móvil (Android)

## Módulo: Vendedores

---

### Alcance y exclusiones

Este guion cubre el módulo de consulta de información del vendedor de Denario Premium móvil en **Android**: acceso desde Home, carga de datos, acordeones por empresa y los dos modos de visualización controlados por la variable global `infoVendedores`.

**El módulo es de solo consulta; no existen acciones de guardar, enviar ni modificar datos.**

**Condición de ejecución del guion completo:**
Este módulo solo es accesible desde Home cuando la cuenta QA corresponde a un **vendedor estándar** (`esVendedor = true`), es decir, la cuenta **no** tiene ninguno de los roles: `transportista`, `cliente`, `promotor` ni `soporte`. Si la cuenta QA activa tiene uno de esos roles, el icono del módulo **no aparece en Home** → todo el guion queda como **N/A por configuración de cuenta**, no como FAIL. Ver supuesto 1.

Constituye un **catálogo completo** de los flujos observables en UI para este módulo. En una corrida real se estima ejecutar ~**70 %** (el resto queda **N/A por configuración**).

**Criterio de aplicabilidad:**
- **`Aplicación: Siempre`** — ejecutable con cualquier cuenta QA vendedor estándar.
- **`Aplicación: Condicional (VG: <clave>)`** — solo cuando esa configuración está activa en la empresa probada; si no aplica, marcar **N/A**.

**Incluye:** acceso al módulo, overlay de carga, acordeones por empresa, modo API (KPIs del vendedor y planes de cuota) y modo BD local (título + HTML libre), navegación atrás a Home.

**Excluye:** validación de cifras exactas ni del contenido HTML renderizado; comportamiento específico ante errores de red o API; cuentas con roles distintos a vendedor estándar (ver supuestos); escenarios que requieran ADB, localStorage o modo avión.

---

### Mapa rápido (inferido desde código / XML)

| Elemento | Detalle |
|---|---|
| Ruta Angular | `vendedores` |
| Componente | `src/app/vendedores/vendedores.component.ts / .html` |
| Acceso desde Home | Solo cuando `esVendedor = true` (`home.page.ts:97`): `!transportista && !cliente && !promotor && !soporte` |
| Fuente de datos (modo API) | `ServicesService.getUserInformation()` → endpoint `userservice/userinformation` (HTTP con autenticación) |
| Fuente de datos (modo BD) | SQLite local — tabla `user_informations` (sincronizada) |
| Selección de modo | `globalConfig.get("infoVendedores") === "true"` → BD local; `false` → API |
| Empresas | `EnterpriseService.setup()` → `empresas[]` — una entrada por empresa accesible |
| Tags | Módulo `VND` en `application_tags` |

**Flujo del módulo (pantallas en orden):**

1. **Acceso desde Home** → toque en icono "Vendedores" → ruta `/vendedores`.
2. **Carga** → overlay "Cargando..." visible; en paralelo: obtiene tags, lista de empresas y datos según modo VG.
3. **Pantalla principal** → grupo de acordeones, uno por empresa. Cada acordeón muestra el nombre de la empresa como cabecera.
4. **Expandir acordeón** → muestra información del vendedor para esa empresa (KPIs o HTML según modo VG).
5. **Navegar atrás** → botón cabecera (`routerLink="/home"`) o botón físico Android → Home.

**Dos modos de visualización (excluyentes por VG):**

| VG `infoVendedores` | Fuente | Contenido visible en acordeón |
|---|---|---|
| `false` (por defecto) | API remota | KPIs: Días Hábiles, Días Transcurridos, Días Restantes, Cartera Clientes, Clientes Activados, Clientes Nuevos, Clientes Nuevos Activados. Sección de planes (condicional: solo si la empresa tiene planes con `plan.id` definido): "Plan por [unidad]", "Cuota Mes: X [unidad]", "Venta Real Mes: X [unidad]". |
| `true` | BD local | Título (`bdUserInfo.title`, etiqueta `<h3>`) + cuerpo HTML libre (`bdUserInfo.content`, renderizado con `[innerHTML]`). |

**Tags del módulo:**

| Tag | Valor por defecto |
|---|---|
| `VND_VENDEDOR` | Vendedor (título del módulo) |
| `VND_DIAS_HABILES` | Días Hábiles |
| `VND_DIAS_TRANS` | Días Transcurridos |
| `VND_DIAS_RESTAN` | Días Restantes |
| `VND_CARTERA` | Cartera Clientes |
| `VND_CLIENTES_ACTIVOS` | Clientes Activados |
| `VND_CLIENTES_NUEVOS` | Clientes Nuevos |
| `VND_CLIENTES_NUEVOSACT` | Clientes Nuevos Activados |
| `VND_TIPO_PLAN` | Plan por |
| `VND_CUOTA_MES` | Cuota Mes |
| `VND_VENTA_REAL` | Venta Real Mes |

---

### Casos de prueba

| ID | Escenario | Precondiciones | Pasos | Datos / ejemplo | Resultado esperado | Fallo observable (PASS/FAIL) | Severidad | Soporte en código |
|---|---|---|---|---|---|---|---|---|
| DM-VND-001 | Acceso al módulo vendedores desde Home → overlay de carga visible y acordeones por empresa visibles al completar | Sesión iniciada con cuenta QA vendedor estándar (`esVendedor = true`). App en pantalla Home. **Aplicación: Siempre** | 1. Localizar el icono del módulo "Vendedores" en Home. 2. Pulsarlo. 3. Observar la pantalla durante la carga y tras completar. | N/A | El icono "Vendedores" es visible en Home. Al pulsarlo: aparece overlay "Cargando..." que desaparece tras la carga. La pantalla muestra la cabecera con el título del módulo (tag `VND_VENDEDOR`) y, debajo, uno o más acordeones, cada uno con el nombre de una empresa como cabecera (cerrados por defecto). | FAIL: Icono no visible para cuenta vendedor estándar; pantalla en blanco tras overlay; overlay no desaparece; acordeones ausentes; app colapsa. | S1 — impide toda consulta del módulo | `src/app/vendedores/vendedores.component.ts:51-71`, `src/app/home/home.page.ts:95-98` (`esVendedor`) |
| DM-VND-002 | Expandir acordeón de empresa → muestra información; contraer → oculta | Módulo vendedores abierto con al menos un acordeón visible. **Aplicación: Siempre** | 1. Tocar el acordeón de una empresa (cabecera) para expandirlo. 2. Observar el contenido que aparece. 3. Tocar la cabecera de nuevo para contraerlo. | N/A | Al expandir: el acordeón se abre y muestra algún contenido (KPIs o HTML según modo VG). Al contraer: el acordeón se cierra y el contenido queda oculto. El nombre de la empresa en la cabecera es legible en ambos estados. | FAIL: El acordeón no responde al toque; el contenido no aparece; el acordeón no se puede contraer; la cabecera muestra texto incorrecto o vacío. | S1 — impide consultar cualquier dato del módulo | `src/app/vendedores/vendedores.component.html:25-83` |
| DM-VND-003 | Modo API (`infoVendedores = false`): etiquetas KPI visibles con sus valores bajo el acordeón de empresa | Módulo vendedores abierto. VG `infoVendedores = false`. Acordeón expandido para una empresa con datos en el API. **Aplicación: Condicional (VG: `globalConfig.get("infoVendedores") = false`)** | 1. Expandir el acordeón de una empresa. 2. Observar las líneas de información mostradas. | N/A | Se muestran las siguientes etiquetas en negrita seguidas de su valor: "Días Hábiles", "Días Transcurridos", "Días Restantes", "Cartera Clientes", "Clientes Activados", "Clientes Nuevos", "Clientes Nuevos Activados". No se valida el valor numérico exacto, solo que las etiquetas sean visibles y que los campos no estén vacíos cuando el API devuelve datos. | FAIL: Alguna etiqueta KPI ausente; etiquetas sin valor (todos muestran vacío o `undefined`); se muestra HTML libre en lugar de KPIs (sugiere VG incorrecta). | S2 | `src/app/vendedores/vendedores.component.html:37-68`, `vendedores.component.ts:87-107` (`getUserInfo`) |
| DM-VND-004 | Modo API: sección de planes de cuota visible cuando la empresa tiene planes configurados | Modo API activo (`infoVendedores = false`). Acordeón expandido para una empresa que tenga planes de cuota en sus datos. **Aplicación: Condicional (VG: `globalConfig.get("infoVendedores") = false` y empresa con planes)** | 1. Expandir el acordeón de una empresa con planes. 2. Observar si aparece la sección de planes debajo de los KPIs. | N/A | Aparece al menos un bloque con: título "Plan por [unidad]" (etiqueta `VND_TIPO_PLAN`), línea "Cuota Mes: X [unidad]" y línea "Venta Real Mes: X [unidad]". Las etiquetas son legibles; no se valida el valor exacto. | FAIL: Sección de planes ausente para una empresa que tiene planes configurados; etiquetas de plan vacías; solo se muestran las etiquetas sin los valores. | S3 | `src/app/vendedores/vendedores.component.html:57-66` (bloque `planesCuotaEmpresa`) |
| DM-VND-005 | Modo BD (`infoVendedores = true`): título e información HTML renderizados bajo el acordeón de empresa | Módulo vendedores abierto. VG `infoVendedores = true`. Tabla `user_informations` en BD local con datos sincronizados. **Aplicación: Condicional (VG: `globalConfig.get("infoVendedores") = true`)** | 1. Expandir el acordeón de una empresa. 2. Observar el contenido renderizado. | N/A | El acordeón muestra un título (etiqueta `<h3>`) con el texto guardado en `bdUserInfo.title`, seguido de contenido HTML renderizado (texto, listas u otros elementos HTML del campo `bdUserInfo.content`). No se valida el texto exacto ni el HTML correcto; solo se verifica que ambos sean visibles y que el área de contenido no esté en blanco. | FAIL: Acordeón vacío cuando existen datos en BD; se muestran KPIs en lugar de HTML libre (sugiere VG incorrecta); app colapsa al renderizar HTML. | S2 | `src/app/vendedores/vendedores.component.html:70-75`, `vendedores.component.ts:130-153` (`getUserInfoBD`) |
| DM-VND-006 | Modo API: múltiples empresas → un acordeón por empresa con KPIs distintos por empresa | Módulo abierto. VG `infoVendedores = false` (modo API). Cuenta con acceso a ≥2 empresas y datos API por empresa. **Aplicación: Condicional (VG: `globalConfig.get("infoVendedores") = false` y cuenta multiempresa)** | 1. Contar acordeones (uno por empresa). 2. Expandir empresa A y observar KPIs. 3. Contraer y expandir empresa B. | ≥2 empresas con datos en API | Un acordeón por empresa con nombre correcto en cabecera. Empresa A y B muestran **KPIs correspondientes a cada una** (filtrado por `coEnterprise`). | FAIL: Falta acordeón; KPIs de A aparecen en B; nombres incorrectos; app colapsa. **No aplica en modo BD** (`infoVendedores = true`): mismo HTML en todos los acordeones es comportamiento actual, no FAIL → marcar **N/A**. | S2 | `vendedores.component.html:37-68`, `showInfo(empresa, info)` en `vendedores.component.ts:155-157` |
| DM-VND-007 | Botón atrás en cabecera → navega a Home | Módulo vendedores abierto en cualquier estado. **Aplicación: Siempre** | 1. Pulsar la flecha atrás en la cabecera del módulo. | N/A | App navega a la pantalla Home de Denario. | FAIL: Permanece en la pantalla de vendedores; navega a una pantalla incorrecta; botón no responde. | S2 | `src/app/vendedores/vendedores.component.html:7` (`routerLink="/home"`), `vendedores.component.ts:46-49` (back button subscription) |

---

```gherkin
# DM-VND-001 / DM-VND-002 — Happy path: acceso y consulta
Dado que tengo sesión activa con cuenta vendedor estándar
  Y el módulo Vendedores es visible en Home
Cuando pulso el icono Vendedores
Entonces aparece el overlay de carga y, al completar, se muestran acordeones por empresa
Cuando expando el acordeón de una empresa
Entonces aparece información del vendedor para esa empresa
```

```gherkin
# DM-VND-003 — Modo API: KPIs visibles
Dado que el módulo está en modo API (infoVendedores = false)
  Y he expandido el acordeón de una empresa con datos
Entonces veo las etiquetas en negrita: "Días Hábiles", "Días Transcurridos", "Días Restantes",
  "Cartera Clientes", "Clientes Activados", "Clientes Nuevos", "Clientes Nuevos Activados"
  con sus respectivos valores
```

---

### Regresión mínima (smoke rápido)

Lista de IDs imprescindibles antes de cerrar un release (**no sustituye la ejecución de la tabla completa**):

1. **DM-VND-001** — Acceso al módulo: icono visible en Home, overlay y acordeones
2. **DM-VND-002** — Expandir/contraer acordeón de empresa
3. **DM-VND-007** — Botón atrás → Home

Si la corrida incluye cuentas con configuración VG activa, agregar al smoke:
- **DM-VND-003** (modo API activo)
- **DM-VND-005** (modo BD activo)

---

### Supuestos y lagunas — Cobertura fuera de este guion

1. **Acceso al módulo por tipo de cuenta**: el icono "Vendedores" solo aparece en Home cuando `esVendedor = true`, es decir, la cuenta activa **no** es `transportista`, `cliente`, `promotor` ni `soporte` (`home.page.ts:97`). Si la cuenta QA tiene alguno de esos roles, el icono no aparece y **todo el guion queda como N/A**, no como FAIL. En corridas con cuentas no-vendedor, documentar el módulo como "No aplica — cuenta sin rol vendedor" en el informe.

2. **Acordeón expandido sin datos para la empresa**: si el API (modo `!infoVendedores`) no devuelve información para una empresa concreta, el `@if (showInfo(empresa, info))` no produce ningún bloque de KPIs → el acordeón aparece vacío pero sin error. Similarmente en modo BD: si `bdUserInfo` es `undefined` (tabla vacía), el acordeón queda vacío. Este escenario es observable pero no reproducible de forma controlada sin datos específicos. Si ocurre en una corrida real, documentar como "N/A por ausencia de datos" y reportar al backend si se esperaba información.

3. **Error en llamada API (`getUserInfo`)**: si la llamada HTTP a `userservice/userinformation` falla, el bloque `catch` registra el error en consola y el `finally` oculta el loading (`vendedores.component.ts:100-107`). El resultado visible es: acordeones vacíos sin mensaje de error al usuario. No se incluye como caso de tabla por depender de condiciones de servidor. Si se observa en corrida real, investigar conectividad y token de autenticación.

4. **Cuenta con una sola empresa** (no multiempresa): hay un único acordeón. El comportamiento es idéntico a DM-VND-002; no se duplica el caso.

4b. **DM-VND-006 y modo BD (`infoVendedores = true`)**: la app muestra el mismo `bdUserInfo` (título + HTML) en cada acordeón de empresa; no hay datos distintos por empresa en UI. Por eso **006 es N/A** en ese modo; usar **005** para validar contenido BD.

5. **Modo API: empresa sin planes de cuota** (`planesCuotaEmpresa` vacío o sin `plan.id`): la sección "Plan por" simplemente no se renderiza. El usuario ve solo los KPIs base. No genera error; no se incluye caso de tabla porque depende de los datos sincronizados.

6. **Contenido HTML potencialmente dañino en modo BD**: el componente renderiza `bdUserInfo.content` con `[innerHTML]`. Angular sanitiza el HTML por defecto (XSS). No se incluye caso de seguridad ofensiva per CLAUDE.md.

7. **Selector de empresa (`onEnterpriseSelect`)**: en el código hay un método `onEnterpriseSelect()` que llama a `getUserInfoBD()`, pero en la plantilla HTML no hay ningún `ion-select` asociado a este evento en la versión analizada. Posiblemente sea una funcionalidad futura o eliminada. No se incluye caso de tabla.
