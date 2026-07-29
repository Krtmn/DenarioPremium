# Smoke Test Consolidado — Denario Premium Móvil + **Web**

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260728_130612_smoke-completo` |
| Cliente | **el_valle** — EL VALLE (COVADONGA) · empresa `PROCESADORA DE ALIMENTOS COVADONGA,C.A` |
| Servidor | **La Tortuga** — `denariolatortuga.ddns.net:8081/PremiumWS` (descubierto en runtime, no fijado en el perfil) |
| Build | v1.0 · `db_version=19` · **`window.ng=true`** |
| Dispositivo | 14678405BR003855 — Infinix X6728, Android 15 |
| Fecha | 2026-07-28 |
| Modo | `QA_MODE=record` (traza grabada) + **capa web en paralelo** (primera corrida con las dos capas) |

---

## Resultado

**97 PASS · 0 FAIL · 5 N/A · 1 BLOCKED** sobre **103 casos**, 10/10 módulos.

| Módulo | PASS | N/A | BLOCKED | Total | Registro creado |
|---|---:|---:|---:|---:|---|
| Login | 6 | — | — | 6 | — |
| Clientes | 11 | 1 | — | 12 | Cliente potencial **Ref 2** |
| Pedidos | 14 | — | — | 14 | Pedido **Ref 437** |
| **Cobros** | — | — | — | — | **Ref 119** (anticipo) · **120** · **121** · **122** (retención) ⚠ ver nota |
| Devoluciones | 13 | 1 | — | 14 | Devolución **Ref 177** |
| Inventarios | 15 | — | 1 | 16 | Inventario **Ref 2** |
| Depósitos | 12 | — | — | 12 | Depósito **Ref 1** |
| Visitas | 14 | 2 | — | 16 | Visita **Ref 51** |
| Productos | 9 | 1 | — | 10 | — (solo lectura) |
| Vendedores | 3 | — | — | 3 | — (solo lectura) |

> ⚠ **Cobros no tiene casos en el ledger.** El módulo se bloqueó por un defecto de producto y la QA lo
> completó **manualmente** fuera del flujo del agente. Los 4 cobros existen y **fueron verificados en la web**,
> pero **los 34 casos del alcance no tienen veredicto individual**. Es el hueco conocido de esta corrida.

---

## Capa WEB — verificación cruzada móvil → web

**9 registros cotejados en La Tortuga, read-only: 8 `WEB-OK` · 1 `WEB-CALC-MISMATCH` · 0 `WEB-MISSING`.**
28 de 29 aserciones de cálculo exactas.

| Módulo | Ref | Marca |
|---|---|---|
| Clientes potenciales | 2 | WEB-OK |
| Pedidos | 437 | WEB-OK |
| Devoluciones | 177 | WEB-OK |
| Inventarios | 2 | WEB-OK |
| Depósitos | 1 | WEB-OK |
| Cobros | 119 · 120 · 121 | WEB-OK |
| Cobros | **122** (retención) | **WEB-CALC-MISMATCH** |
| Visitas | 51 | WEB-OK |

**Oráculos cotejados por primera vez:**
- **Retención:** `IVA 10,00 + ISLR 2,00 = 12,00` == neto del documento ✅
- **Depósito ↔ cobros:** `Σ(cobros hijos) = 20,00` == monto depositado, vinculando el cobro 119 ✅
  (y la fila 119 muestra "Consultar Depósito" → enlace íntegro en ambos sentidos)
- **Anticipo:** sin documentos aplicados, solo pagos ✅
- **Conversión:** 17 aserciones exactas (`monto × 725,75`)

---

## Defectos encontrados

### 🐞 1 · Cobro por RETENCIÓN muestra "Total: 0,00" en el detalle web — *lo cazó la capa web*

En el detalle web del cobro **Ref 122** (`co_type=2`), la cabecera muestra `Total Monto a pagar: 0,0000 USD`
cuando el valor real es **12,00**. La **lista**, la **línea del documento** y la **BD** (`nu_amount_final`)
traen 12,00 correctamente — solo falla el campo de cabecera del detalle.

Comparando con los otros 3 cobros (donde ese campo reproduce exacto `nu_amount_final`), la cabecera parece
calcular **Σ(pagos)** en vez de leer `nu_amount_final`; un cobro por retención **no tiene filas de pago**
(se salda con las retenciones) ⇒ da 0. Es defecto de **presentación**: el móvil mandó bien y la nube guardó bien.

**Impacto:** quien abra un cobro por retención lee «Total: 0,00» y concluye que no tiene importe.

> **Este defecto no era visible desde el móvil ni desde el cotejo BD.** Solo aparece cruzando lo enviado contra
> lo que la web muestra. Justifica por sí solo la capa web.

### 🐞 2 · Sincronización de cobros diferida (corregido el mismo día)

Los cobros tardaban **~28–75 min** en llegar a la nube (Ref 119: 75 min · Ref 120: 28 min), mientras que
pedidos, devoluciones, inventarios y depósitos sincronizaban **de inmediato en la misma sesión y servidor**
⇒ el retraso era **específico del endpoint de cobros**. El hook sobre `nativePromise` capturó **4 POST
repetidos a `collectionservice/collection`**, lo que probaba que el cobro se guardaba local, entraba en cola
y el POST se disparaba: el problema estaba en la persistencia del lado del servidor.
**Desarrollo aplicó un arreglo.** ⚠ **Falta re-medir la latencia para confirmarlo con datos.**

### 🐞 3 · `guardar()` de visitas no es idempotente
Un doble evento de guardado sobre una visita aún no persistida crea **dos** visitas Guardadas.
Sugerido: guard de reentrada mientras el guardado está en vuelo.

### 🐞 4 · Buscador de productos no repuebla la lista al vaciarse
Queda en 0 con "No hay productos disponibles" y sigue en 0 tras 8 s. Reproducido 2 veces.
Contradice la nota de insumar de que el 0 es transitorio.

### Defectos conocidos — estado
- **DM-DEP-018/019/020** (lista BUSCAR no renderiza tras guardar): **NO reprodujo** — renderizó limpia en los 3 accesos.
- **DM-INV-026** (reabre en tab General): **no observable** — el ítem de lista no navega por CDP ⇒ BLOCKED de automatización, ni re-marcado ni descartado.
- **DM-VIS-020** permite Enviar sin firma pese a `signatureVisit=true` — **4.ª playa**, reconfirmado sin re-marcar.

---

## VGs en conflicto entre dumps — resueltas en corrida

El perfil se construyó de 2 dumps con conflictos (`global_configuration` 2025-2026 vs `global_configuration_client` 2023).
La corrida dirimió las que importaban:

| VG | Dump viejo | Veredicto en UI |
|---|---|---|
| `expirationBatch` | `false` | ✅ **`true`** — lote y fecha **OBLIGATORIOS** (*"Complete cantidad, unidad, fecha y lote"*) |
| `validateWarehouses` | `false` | ✅ **`true`** — almacén visible en el ítem y `co_warehouse=010` en BD |
| `userCanSelectProductDiscount` | conflicto 2026 vs 2026 | ✅ **`false`** — ningún control de descuento por producto |
| `orderEnterpriseEnabled` | `false` | ✅ **`false` con matiz** — el campo Empresa **sí se renderiza**, pero *deshabilitado* con COVADONGA preseleccionada |
| `esVendedor` | (no venía en los dumps) | ✅ **`true`** — tile en HOME + `<h1>Vendedor</h1>` + KPIs con Cartera 480 |

**Hallazgo transversal que corrige una creencia del proyecto:** `expirationBatch` gobierna la **validación**,
no la **visibilidad**. Los campos se renderizan siempre; la VG decide si son obligatorios. Esto **cierra la
supuesta "divergencia UI-vs-config"** que se arrastraba desde piercar: no había divergencia, se estaba mirando
la visibilidad en vez de la validación.

---

## Correcciones a la infraestructura (encontradas corriendo, no en teoría)

| Qué | Impacto |
|---|---|
| **Mock de cámara al Proxy equivocado** | `Plugins.Camera` es un **Proxy**: parchearlo daba **falso OK**, abría la cámara NATIVA y colgaba la app **sin salida automática**. Costó un módulo y un cobro. Fix: interceptar `Capacitor.nativePromise`. Verificado: `getPhoto` 7 ms |
| **`setTimeout` no existe en el sandbox** | El watchdog reventaba con `ReferenceError` al inlinarse. El self-test no lo cazaba porque validaba Node, no el sandbox. Fix: `page.waitForTimeout` |
| **Guarda de PLAYA ausente** | Las 3 playas comparten las MISMAS rutas: se operó sobre Isla Coche creyendo que era La Tortuga. Fix: `verificarContexto` valida **host + pathname** |
| **`verificarConversion` asumía división** | BS→US$ divide, **US$→BS multiplica**. Daba falsos `WEB-CALC-MISMATCH` en toda playa que opere en US$ |
| **Regla de cabecera web daba valores FALSOS** | `Titulo:` tomaba el encabezado `N°` de la tabla siguiente. Fix: `leerCabecera` lee del **padre**, no de la hoja siguiente |
| **Credenciales web por playa** | La clave es **distinta por playa** (la de Isla Coche da `USUARIO INVALIDO` en La Tortuga) |
| **`invoice` vacía / falta filtro por vendedor** | La guía de alta consultaba `invoice` (0 filas) en vez de `document_sale`, y sin filtrar por `client_template_user` traía clientes que la app no muestra |

---

## Trazas grabadas (`QA_MODE=record`)

**9 de 10 módulos** dejaron traza válida (`validateTrace() = []`): login 21 ops · clientes 29 · pedidos 75 ·
devoluciones 48 · inventarios 52 · depósitos 43 · visitas 101 · productos 31 · vendedores 10.

⚠ **Limitación conocida:** los clicks de Guardar/Enviar se hacen por coordenadas y **no quedan grabados**, así
que las trazas cubren navegación y llenado pero **se cortan antes de persistir**. No son reproducibles
end-to-end todavía. **`vendedores` es la excepción y el mejor candidato al primer REPLAY**: 100% pura-DOM,
cero coordenadas, y no hardcodea el nombre de la empresa.

⚠ **`window.__qaTrace` persiste entre agentes** → hay que resetearlo al instalar el grabador o la traza sale
contaminada con ops del módulo anterior.

---

## Pendientes

1. **Re-correr COBROS completo** — es el hueco real de esta corrida: 34 casos sin veredicto individual
   (adjunto obligatorio, comentario obligatorio, retención por detalle 041/042, pago parcial, anticipo,
   tasa histórica, y confirmar si aparece **Pago Móvil**).
2. **Re-medir la latencia de sync de cobros** para confirmar el arreglo de desarrollo con datos.
3. **Verificar en web** los cobros que produzca esa re-corrida (el módulo con más cálculos).
4. **DM-INV-026** quedó sin observar — pendiente de verificación manual.
5. **DM-VIS-025/026**: requieren una corrida con **ruta planificada del día**.

---

*Generado por Claude Code · Orquestador Smoke · 2026-07-28*
