# Guión transversal — CONFORMIDAD CON LA CONFIGURACIÓN (familia `K##`)

> **Nace de los escapes de la v21** (2026-08-25). Cuatro defectos llegaron a producción con el visto
> bueno del ciclo. Ninguno fue un descuido: **todos los casos que los tocaban dieron PASS, y con razón.**
> El problema es qué preguntaban.

---

## 1. La regla que faltaba: presencia ≠ conformidad

Los guiones —móvil y web— validan **presencia**:

> *«el detalle muestra precio»* · *«el filtro devuelve filas de ese vendedor»* · *«el indicador trae un número»*

Ninguno validaba **conformidad**:

> *«el precio está en la moneda que ESTE módulo tiene configurada»* · *«el combo dependiente se acotó»* ·
> *«el indicador está en la moneda de los documentos que resume»*

Un módulo mal configurado **muestra datos perfectamente**. Por eso `DM-PRD-012` («detalle con precio USD
y BS») dio PASS durante toda la v21 mientras el detalle mostraba una sola moneda: había un precio, y el
caso solo pedía que hubiera un precio.

🔴 **Regla de oro de la familia `K##`:** *no se valida contra lo que se ve; se valida contra lo que la
configuración del cliente OBLIGA a ver.* Y eso exige leer la configuración **antes** de correr.

> ⚠ **El mismo error se repitió el 26/08 en Cobros**, con otra cara: se validó
> `Monto Doc. − Monto Pago = Monto Saldo`, que es **literalmente la fórmula del código**. Se comprobó el
> cálculo contra sí mismo en vez de contra la deuda real del cliente, y se dejó pasar que el saldo no
> descontaba la retención. **El oráculo nunca puede ser la implementación.**

---

## 2. El oráculo: la matriz de monedas por módulo

Se configura en la web en **`Empresa > Configuración > Módulos`** y define, **por cada uno de los 9 módulos**:

| Campo BD (`currency_modules`) | Qué manda |
|---|---|
| `local_currency_default` | moneda por defecto: `true` = LOCAL · `false` = FUERTE |
| `show_conversion` | `true` = deben verse **los dos** montos + la tasa · `false` = **uno solo** |
| `currency_selector` | `true` = el selector **existe** · `false` = **no debe existir** |

Y dos VGs maestras por encima:

| VG | Efecto |
|---|---|
| `multiCurrency = false` | tenant **monomoneda**: nunca deben verse dos montos |
| `currencyModule = false` | la matriz **no se aplica**; manda la moneda por defecto de la empresa |

### Cómo obtenerla — 2 segundos, antes de cada corrida

```bash
node automation/db/currency-matrix.js {QA_CLIENTE}          # tabla legible + cruces detectados
node automation/db/currency-matrix.js {QA_CLIENTE} --yaml   # bloque para pegar en clientes/<slug>.yaml
```

⚠ **Regenerarla en cada corrida.** El cliente la cambia desde la web sin avisar. Una matriz de hace un
mes es peor que ninguna: da confianza falsa.

### 🔴 «LOCAL» no quiere decir «bolívares»

`local_currency_default` dice **cuál de las dos monedas de la empresa** manda, no cuál divisa es:

| Tenant | `local` | `fuerte` |
|---|---|---|
| `el_palmar` | `VES` | `USD` |
| `kron`, `hidroponias`, `el_eden` | `BS` | `USD` / `US$` |
| `difranca` | `BSD` | `US$` |
| **`run_vzla`** | **`US$`** | *(no tiene)* |

⇒ En `run_vzla`, `moneda_defecto: LOCAL` significa **dólares**. **Leer siempre `_monedas_por_empresa`;
nunca deducir la divisa de la etiqueta.**

⚠ `currency_modules` **no tiene columna de empresa** → la matriz es **única por tenant**. Lo que cambia
por empresa es cuál moneda es local y cuál fuerte.

---

## 3. Los casos `K##`

Se corren **sobre el módulo que ya se está probando** — no son una corrida aparte. Cuestan segundos
porque la pantalla ya está abierta.

**Prefijo:** `DM-<MOD>-K##` en móvil, `DW-<MOD>-K##` en web.

### K01 · Moneda por defecto
Abrir el módulo sin tocar el selector y leer el rótulo del primer monto.
**PASS:** coincide con la matriz, traducido con `_monedas_por_empresa`. **FAIL:** cualquier otro rótulo.

### K02 · Conversión — presencia **y ausencia**

| `show_conversion` | PASS | FAIL |
|---|---|---|
| `true` | Se ven **los dos** montos **y la tasa**; `local == fuerte × tasa` (±1 en el último decimal) | Falta uno, falta la tasa, o el segundo sale `0,00` |
| `false` | Se ve **exactamente un** monto | 🔴 **Aparecen dos** — aunque los números sean correctos |

🔴 **El caso de ausencia nunca se corrió** y es la mitad de la familia. `run_vzla` tiene
`show_conversion = false` en los 9 módulos; `el_eden` lo tiene apagado en Pedidos.

### K03 · Selector de monedas — presencia **y ausencia**

| `currency_selector` | PASS | FAIL |
|---|---|---|
| `true` | Existe, abre, y al cambiar la moneda **cambian rótulo y valor** | No está, no abre, o cambia el rótulo sin cambiar el valor |
| `false` | **No se renderiza** | 🔴 Aparece (`el_eden`, `kron`, `hidroponias` lo tienen apagado en Pedidos) |

### 🔴 EL SELECTOR LO CONTROLAN **DOS** FUENTES, Y MANDA LA QUE DIGA QUE SÍ

Medido en piercar el **2026-08-28**. ⚠ **Esta nota estaba escrita AL REVÉS y habría producido reportes
falsos.** Corregida con evidencia:

| Fuente | Dónde se ve |
|---|---|
| `currency_modules.<mod>.currency_selector` | Empresa → Configuración → **Módulos** |
| `multiCurrencyOrder` · `multiCurrencyCollection` · `multiCurrencyDeposit` | Empresa → Configuración → **Cobros/Pedidos** (VGs) |

**La regla real es un OR: basta que UNA diga «sí» para que el selector aparezca.**
Para que NO aparezca, **las dos tienen que estar en «no»**.

**Caso medido:** en piercar, `cob.currency_selector = false` desde el 24/08, pero
`multiCurrencyCollection = true` ⇒ **el selector aparecía**. Al poner la VG en `false` (28/08 16:56),
desapareció. Las dos apagadas ⇒ oculto.

⇒ 🔑 **Antes de cantar un `K03` de ausencia, LEER LAS DOS FUENTES.** Si solo se mira
`currency_modules`, un selector legítimo se reporta como defecto — que es exactamente lo que estuvo a
punto de pasar el 28/08.

⚠ **Y no es solo cosmético cuando divergen:** con el selector visible, un cobro que nace en la moneda por
defecto puede enviarse en la otra (pasó: el cobro Ref 6 de piercar nació en BS y se envió en USD).

💡 **Recomendación para el perfil del cliente:** las dos deberían estar en el mismo valor. Cuando
divergen, anotarlo en el YAML — es configuración, no defecto.

### K04 🔴 · CRUCE DE MÓDULOS — el caso que ningún guión tenía

La matriz se configura por módulo pero **las pantallas se mezclan**: el selector de clientes vive dentro
de Pedidos; la lista de productos vive dentro de Pedidos, Inventarios y Devoluciones. Cada
sub-componente lee la configuración de **su propio** módulo, no la de la pantalla que lo contiene.

**Probar cada módulo aislado no encuentra esto jamás** — por eso escapó.

`currency-matrix.js` **imprime los cruces ya detectados**. Los pares que vigila:

| Pantalla | Sub-componente | Qué mirar |
|---|---|---|
| Pedidos | `cli` | el **saldo del cliente** en el selector |
| Pedidos | `pro` | los **precios** de la lista de productos |
| Cobros | `cli` | los **documentos por cobrar** |
| Devoluciones · Inventarios | `pro` | los precios de los productos |
| Depósitos | `cob` | los montos de los cobros agrupados |

> ⚠ **Pregunta de diseño abierta.** No está definido si el sub-componente debe seguir la moneda de **su**
> módulo o la de la **pantalla que lo contiene**. El código hoy hace la primera. **El hallazgo se reporta
> igual** (el vendedor viendo Bs dentro de un pedido en $ es confuso), pero como *«definir la regla»*, no
> como *«está roto»*. Cuando producto la defina, este caso pasa a PASS/FAIL duro.

### K05 · Coherencia de indicadores con la moneda de los documentos

Aplica a **web**: cabeceras de lista, indicadores y reportes que resumen montos.
**PASS:** cada indicador == la suma en BD **de su propia moneda**.
**FAIL:** un indicador en `0,00` con documentos en esa moneda; o el monto de una moneda bajo el rótulo
de la otra.

🔴 **Antes de aceptar un `0,00`, consultar la BD.** Ver §5.

---

## 4. El otro gap: filtros en cascada (familia `F##`)

Los `F##` validan **el resultado** del filtro:

> `DW-COB-F04` — *«todas las filas son de ese vendedor; el conteo coincide con BD»* ✅ correcto, da PASS

Lo que **ningún caso validaba** es el **poblado de los combos dependientes**: al elegir un vendedor, el
combo de **Clientes** debe repoblarse con los suyos. Traía la data maestra completa. El filtro funciona;
lo roto es el catálogo que lo alimenta — y como la salida sale bien, el caso pasa.

**Caso nuevo, uno por módulo con filtro de vendedor:**

| ID | Acción | PASS | Nivel |
|---|---|---|---|
| `DW-<MOD>-F##` **cascada** | `Limpiar` → elegir **Vendedor** → **abrir el combo de Clientes sin escribir** | Lista **solo** los clientes de ese vendedor; conteo == BD; **se repuebla** al cambiar de vendedor | 🔴 crítico |

⚠ **Contar el COMBO, no la tabla de resultados.** El defecto vive en el desplegable.
⚠ Join por **`id_user`**, no por `co_user` (ver el defecto de pedidos ocultos por `salesman_view`).

---

## 5. 🔴 Desarmar el silenciador de los `0,00`

`web/web-selectors/depositos.md` dice: *«Los indicadores en `0,00` NO son un defecto de la web en este
tenant»*. **Es correcta** —ahí los depósitos tienen `nu_amount_doc = 0` en BD— pero **su alcance no**.

**Cómo se aplica de ahora en más:**

1. Vale **solo para depósitos** y **solo tras comprobar `nu_amount_doc = 0`** en esa corrida.
2. Para cualquier otro `0,00`: **consultar la BD primero**. Si la BD tiene monto y la pantalla muestra
   `0,00` → **es defecto**.
3. Un `0,00` en **una** moneda mientras **la otra** trae monto **no es un cero**: es el monto bajo el
   rótulo equivocado. Contrastar **las dos** monedas siempre.

---

## 6. Los 4 escapes de la v21, mapeados

| # | Síntoma | Caso que lo caza | Por qué escapó |
|---|---|---|---|
| 1 | Web · facturaciones en `$`: el indicador de Bs trae monto y el de `$` sale `0,00` | `K05` | No había caso de indicadores por moneda; la regla del `0,00` lo cerraba |
| 2 | Web · al filtrar por vendedor, el combo de clientes trae toda la data maestra | `F##` cascada | Los `F##` validaban el resultado, que estaba bien |
| 3 | Móvil · el detalle de producto nunca muestra las dos monedas (la lista sí) | `K02` | `DM-PRD-012` aceptaba un solo precio |
| 4 | Móvil · Pedidos en `$` muestra el saldo de los clientes en Bs | `K04` | Nadie probaba dos módulos en la misma pantalla |

### Causa raíz del #3 — confirmada en código

En `product-detail.component.html`, las filas del precio en la segunda moneda y de la tasa están
**anidadas dentro del `@if` de `userCanSelectIVA`** ⇒ la conversión del detalle depende de una variable
de **IVA** sin relación con monedas. En la lista no ocurre porque es otro componente.

---

## 7. Estado medido — tenants en playa (2026-08-26)

Foto, no oráculo: **remedir antes de cada corrida**.

| Tenant | Playa · versión | Configuración destacada | Por qué importa |
|---|---|---|---|
| **`difranca`** | La Tortuga · **main** | **3 empresas**; 5 cruces activos | 💎 **El mejor banco de pruebas**: el único multiempresa en main ⇒ el único donde se puede demostrar el fan-out del REQ de Bancos |
| **`el_eden`** | La Tortuga · **main** | Pedidos = FUERTE **sin conversión ni selector**; Productos y Clientes = LOCAL | Reúne los escapes #3 y #4 en una pantalla |
| **`el_palmar`** | Isla Coche · 6.6.21.1 | Pedidos y Productos = FUERTE; Clientes, Cobros e Inventarios = LOCAL | 3 cruces activos |
| `run_vzla` | — | `multiCurrency = false`; los 9 módulos sin conversión ni selector | El caso espejo: valida los `K02`/`K03` de **ausencia** |
| *mioparts* | El Yaque · mantenimiento | sin medir | Correr `currency-matrix.js` cuando vuelva |

⚠ **El cruce Pedidos=FUERTE / Clientes=LOCAL aparece en los 6 tenants multimoneda medidos** ⇒ el escape
#4 no es de un cliente: es de casi toda la base migrada.

---

## 8. Integración con la corrida

**Pre-vuelo (una vez, antes de arrancar):**

```bash
node automation/db/currency-matrix.js {QA_CLIENTE}          # leer tabla y cruces
node automation/db/currency-matrix.js {QA_CLIENTE} --yaml   # actualizar clientes/<slug>.yaml
```

- `multiCurrency = false` → los `K##` se reducen a verificar **ausencia**. Anotarlo.
- `currencyModule = false` → la matriz no aplica; el oráculo es la moneda por defecto de la empresa.
- **Anotar los cruces en el plan** antes de empezar: son los `K04` obligatorios.

**Durante:** `K01`–`K03` se resuelven en la pantalla ya abierta. `K04` requiere entrar a la pantalla
contenedora y mirar el sub-componente.

**En el reporte:** una sección `CONFORMIDAD` con la matriz usada y el resultado por módulo. **La matriz
va siempre**, aunque todo dé PASS: es lo que permite saber, cuando aparezca un defecto en producción, si
esa combinación se había probado.

---

## 9. Lo que este guión NO cubre todavía

Honestidad sobre el alcance, para no crear la misma confianza falsa que se está corrigiendo:

- **Solo cubre monedas.** `Empresa > Configuración` tiene más ejes (impuestos, listas de precio,
  permisos por rol). El mismo agujero probablemente existe ahí. Esto es el patrón a replicar, no la
  cobertura completa.
- **`K04` no tiene PASS/FAIL duro** hasta que producto defina la regla.
- **Facturaciones** (web) no está en la matriz de 9 módulos; su oráculo es la moneda de los documentos.
- **No hay verificación de la tasa** contra la fuente oficial: `K02` valida coherencia interna (que los
  dos montos cuadren entre sí), no que la tasa sea la correcta del día.
