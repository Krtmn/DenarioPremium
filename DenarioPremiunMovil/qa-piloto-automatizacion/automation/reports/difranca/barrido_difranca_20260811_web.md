# Barrido WEB pre-tag — difranca / EL YAQUE

`RUN_ID` **barrido_difranca_20260811** · playa `http://denarioelyaque.ddns.net:8080/DenarioPremium`
Contra: `WEB-REPRO-MANUAL.md` + `reverif_difranca_20260811_web.md` (estado de esta mañana).
Guarda de tenant verificada en **todos** los módulos: el combo Empresa lista exactamente
`*DISTRIBUIDORA DIAZ HERNANDEZ *` · `DIFRANCA C.A` · `DISTRIBUIDORA DH VITAL, C.A.`. **`DDH_A12` no aparece.**
Ninguna empresa ajena. No se tocó el dispositivo ni el CDP `:9220`.

---

## 🟢 VEREDICTO PARA EL TAG: **nada impide sacar la 21 mañana**

Los 3 fixes entraron y **ninguno rompió nada alrededor**. Lo que queda abierto ya estaba abierto ayer,
es de **presentación**, y ninguno toca cálculo ni persistencia.

---

## 1 · ¿Los fixes rompieron algo alrededor?

### A · Fix de la tasa (guarda contra fechas futuras) — 🟢 ENTRÓ, sin daño colateral

| Punto | Medición | Veredicto |
|---|---|---|
| Pedido web nuevo, ¿qué tasa toma? | `order_saved` **62** → `nu_value_local` = **752,09** | 🟢 **correcta** |
| Precio de línea | `ACBBKRI300` = 41.605,6188 = **55,32 × 752,09** · `AOBBK1060` = 43.861,8888 = **58,32 × 752,09** | 🟢 exacto |
| ¿Reescribió el pasado? | **200 cobros históricos → 19 tasas distintas** (621,53 … 752,09) | 🟢 **NO** |
| Cotejo contra BD | distribución web ≡ `collection.nu_value_local`, **valor por valor y conteo por conteo** (19/19) | 🟢 exacto |
| Las 3 filas de 2056 | **siguen en BD** (3443/3445/3447, 721,35) ⇒ el fix es guarda de código | ✅ esperado |

🔑 **Prueba de cuándo entró el fix:** los pedidos guardados **52** (12:29) y **57** (15:29) de hoy llevan
`nu_value_local` = **721,35**; el mío de las **21:40** lleva **752,09**. El fix se desplegó entre 15:29 y 21:40.

⇒ **La guarda NO afectó la visualización de históricos.** Cada registro viejo sigue pintando su propia tasa.

### B · Fix de la paginación (IGTF) — 🟢 ENTRÓ, ningún `co_type` roto

**DDHP_A12, 01/06–11/08, `rowCount` = 1.657** (los 3 IGTF `21831`, `21835`, `21846` dentro):

| Escenario | Esta mañana | Ahora |
|---|---:|---:|
| Pág. 1 DESC (con los 3 IGTF) | **0** ❌ | **50** ✅ |
| Pág. 2 · 3 · 34 (última) | 50 · 50 · 5 | **50 · 50 · 7** ✅ |
| ASC pág. 33 (2 IGTF) | **0** ❌ | **50** ✅ |
| ASC pág. 34 (1 IGTF) | **0** ❌ | **7** ✅ |
| **200 filas/pág.** con los 3 IGTF juntos | **0** ❌ | **200** ✅ |
| **DIF_A12** 01/07–11/08 (IGTF `21836`, `21843`) | 63 / **0** ❌ | **65 / 65** ✅ |

Cuadra la aritmética: 33×50 + 7 = **1.657** = `rowCount`. Verificado en **los dos órdenes** y en **dos empresas**.

**Los otros `co_type` — el riesgo clásico — NO se rompieron:**

| Filtro `Tipo Cobro` | Web (contados/pintados) | BD | |
|---|---|---:|---|
| **IGTF** (3) | **3 / 3** *(esta mañana 2/0)* | 3 | 🟢 **cuadra** |
| Retención (2) | 1 / 1 | 1 | 🟢 |
| Anticipo/Prepago (1) | 0 / 0 | 0 | 🟢 |
| Cobro 25% (4) | 0 / 0 | 0 (no existe el tipo) | 🟢 |
| **Cobros (0)** | **1.658 / 200** | **1.654** | 🔴 **ver hallazgo N1** |

Los contadores del servidor coinciden con lo pintado en todos los casos.

### C · Fix del pedido guardado — 🟢 ENTRÓ COMPLETO (escritura **y** lectura **y** envío)

Ciclo completo con registro nuevo, empresa `DDHP_A12`, cliente `CAR931`, vendedor Jose Raad (275):

| Paso | Resultado |
|---|---|
| Crear + 2 líneas + **Guardar** | `order_saved` **62** · `order_detail_saved` **2 filas** · total 85.467,5076 = suma exacta |
| Salir → **Editar** | 🟢 **el carrito vuelve con las 2 líneas** *(esta mañana: "No existe registro")* |
| **Enviar** | 🟢 sin el error "seleccione un producto"; confirma y envía |
| Consumo en BD | `order_saved` 62 **borrado** · detalle **borrado** · `order` **39808** creado, `st_order`=1, **2 líneas** |

⇒ **W2 cerrado de punta a punta.**

🔴 **El caso que nadie mira — las guardadas viejas sin líneas:** **no se pueden abrir, porque no aparecen.**
La lista de `Status = Guardado` devuelve **solo las guardadas que tienen líneas** (2 de 29, con rango
01/01/2015–31/12/2026, medido dos veces). No revienta ni muestra líneas ajenas: sencillamente **no las lista**.
**Es pre-existente** (esta mañana: 1 visible = la única que tenía líneas), **no lo introdujo el fix**.
Detalle en el hallazgo N2.

---

## 2 · Estado de lo que quedó abierto

| # | Defecto | Veredicto | Evidencia de hoy |
|---|---|---|---|
| **W7** | `salesman_view` saltea al `id_user` 283 | 🟠 **SIGUE** | combo con **17** opciones, salta **282 → 284**; BD: 15.529 pedidos `DDHP_A12`, **78** del 283, y el 283 es el **único** usuario fuera de la vista. **Nuevo: también tapa inventarios** (ver N3) |
| **W9** | Estatus de devoluciones | 🟠 **SIGUE (el detalle)** | lista: 3 de 35 con estatus (880/879/878, las nuevas); 873 vacía. Detalle de la **879 (nueva)**: **0 ocurrencias de "Estatus"** en toda la página ⇒ no es maduración de datos, **el arreglo del detalle no entró** |
| **W10** | El visor no muestra los PDF | 🟠 **SIGUE** | cobro **21844**: BD **3** (2 img + 1 pdf) · visor **2 jpeg, 0 pdf**, sin ningún indicio de que exista |
| **W3** | Adjuntos que fallan en silencio | 🟠 **SIGUE** | cobro **21823**: postback completo, **20 s**, **0 growl · 0 diálogos · 0 mensajes**, **0 archivos en disco**. Sigue sin avisar |
| **W12a** | Campos en blanco cuando valen 0 | 🟡 SIGUE | en el pedido **nuevo 39808**: `Descuento Global` · `IVA` · `Descuento` **vacíos**, `Descuento bonif.` = `0,00 BSD` |
| **W12b** | Precio crudo en el carrito | 🟡 SIGUE (mejorado) | carrito: `41605.618800000004` / `43861.8888` **crudo**. La **ficha del producto** ahora sí redondea (`41605.62`) ⇒ media mejora |
| **W12d** | El alta no muestra totales | 🟡 SIGUE | `nuevoPedido` sin ningún total en pantalla |
| **W12c** | Modal fantasma `Si, Borrar` | ⚪ **NO MEDIDO** | se evitó escribir en `Responsable` para no arriesgar el ciclo de guardado |

Totales del pedido 39808 verificados: `Subtotal bruto` = `Monto Base` = `Monto Total` = **85.467,51 BSD** = BD. ✅

---

## 3 · Hallazgos nuevos

### 🟠 N1 — `Tipo Cobro = Cobros` no filtra: devuelve TODO — **no bloquea el tag**

`Cobros` tiene `value="0"` y el backend lo trata como "sin filtro" (**falsy-zero**).

| Selección | `value` enviado | Contados |
|---|---|---:|
| `Cobros` | `0` | **1.658** |
| placeholder `Tipo Cobro` | `""` | **1.658** ← *idéntico* |
| BD `co_type = 0` | — | **1.654** |

Medido **desde un estado filtrado** (`Cobro 25%`, 0 filas → 1.658), así que el filtro **sí se ejecutó**.
Las filas devueltas **incluyen los 3 documentos IGTF y la Retención 21841**, que no son `co_type=0`.
Es el **mismo patrón ya documentado** para el placeholder de `Status` (`value=0` que no filtra).

⚠ **No pude establecer si es regresión.** Esta mañana se anotó "`Cobros` 59/50" sin dejar registrado el rango,
y ese 59 no reconcilia con ningún conteo de BD de hoy ⇒ **no sirve de línea base**. Lo que sí es seguro es que
**hoy está mal**. Devuelve de más (nunca de menos) y no afecta importes ⇒ **severidad media, no bloqueante**.

### 🟠 N2 — 11 pedidos guardados de vendedores válidos son inalcanzables — **no bloquea el tag**

La lista `Status = Guardado` solo devuelve guardados **con líneas**. Reparto real de las 29 filas de `order_saved`:

| Grupo | Filas | ¿Se ve? |
|---|---:|---|
| `DDHP_A12`, vendedor en vista, **con** líneas | **2** | ✅ sí (52, 57) |
| `DDHP_A12`, vendedor **en vista**, sin líneas | **11** | ❌ **no — y deberían** |
| `DDHP_A12`, vendedor fuera de vista (236, 283) | 2 | ❌ no (tapadas por **W7**) |
| `DDH_A12` (empresa borrada) | 3 | ❌ no |
| **`LMP01` (tenant ajeno)** | **11** | ❌ no — ver N4 |

Esos **11** son pedidos que un vendedor activo guardó y **no puede recuperar por ninguna vía de la pantalla**.
**Pre-existente**, no lo introdujo el fix. Conviene decidir si se recuperan o se purgan.

### 🟠 N3 — W7 no es solo de pedidos: también tapa inventarios

`client_stock` de `DDHP_A12` tiene **3** filas; la web muestra **2** con rango 2015–2026.
La que falta es la `id_client_stock` **14**, del `id_user` **238**, **fuera de `salesman_view`** ⇒ **misma causa
raíz que W7**. Amplía el alcance del defecto ya conocido; **no es un defecto nuevo**.

### ⚪ N4 — Contaminación de tenants confirmada también en `order_saved` (aviso al equipo de datos)

Además de lo ya sabido de `client_stock` / `potential_client`, **`order_saved` tiene 11 filas de `LMP01` y 3 de
`DDH_A12`** dentro de la base de difranca. **Hoy no se ven** en la web (las tapan los mismos filtros).
Es la advertencia de **W11**: si algún día se arregla W7 sin limpiar esto, **quedan a la vista bajo empresa ajena**.
No es reproducible desde pantalla ⇒ no se reporta como defecto, pero **conviene avisarlo antes de tocar W7**.

### ℹ️ N5 — Nota de selectores (para la memoria del agente)

En este build el login **volvió a exponer** `#j_idt12` / `#j_idt14` / `#j_idt16`, que `_comunes.md` daba por
derogados. **Sigue sin ser seguro anclarlos.** Vía estable usada hoy: `input[placeholder="Usuario"]` /
`input[placeholder="Clave"]` (el árbol de accesibilidad no resolvió con `browser_type`).

---

## 4 · Qué quedó sin mirar

| Área | Motivo |
|---|---|
| **W12c** (modal `Si, Borrar` en `Responsable`) | no determinista, exige 4-5 altas seguidas; se priorizó no arriesgar el ciclo de guardado |
| **Depósitos · clientes potenciales · productos · vendedores** | no alcanzó el tiempo; **ninguno** estaba en la lista de defectos abiertos |
| Cotejo de importes de **cobros** uno a uno | se cotejó la **tasa** de 200 cobros contra BD (exacto); no los montos/pagos fila por fila |
| **DHVITAL01_A** como empresa principal | la paginación se validó en `DDHP_A12` y `DIF_A12`, que son las que tienen los 5 IGTF |
| Regresión de **N1** | sin línea base fiable de esta mañana (ver N1) |

---

## Método (para que el resultado sea auditable)

- Filtros **releídos** (todos los `<select>` + fechas + `# Ref`) **antes** de cada `Buscar`; nunca se pobló,
  buscó y leyó en la misma `evaluate`.
- Toda página que dio vacío o sospechosa se midió **dos veces** con settle. **Cazó un falso positivo:** una
  lectura de cobros dio `1 contado` y al reasentarse dio **1.658 / 200** ⇒ era render rezagado, se descartó.
- Fechas seteadas **después** del último cambio de `<select>` (el ajax de Empresa las repuebla).
- Anclaje por **texto de cabecera** y `# Ref`, nunca por índice de fila ni por `j_idt*`.
- Conteos: siempre **contados** (`paginator.cfg.rowCount`) **y** pintados (`<tr>` reales), leídos tras ajax.
- Escrituras: **solo pedidos**, autorizadas por la QA. Cobros **solo lectura**. Se creó el pedido **39808**
  (enviado) y ningún otro registro. Estado de filtros devuelto como se encontró.
- **0 archivos descargados**; barrido de disco confirma 0 `.zip`/`.pdf`/`.jpeg`.
