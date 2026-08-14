# Validación del FIX de saldos de clientes — `CLT-LISTA-SALDOS-CRUZADOS`

| Parámetro | Valor |
|-----------|-------|
| Cliente / Playa | `el_palmar` · **ISLA COCHE** |
| Fecha | 2026-08-06 |
| App | `com.kiberno.denarioPremiumPro` — build v1.0 / db19, `window.ng=true` |
| Sesión | coUser 1276 / idUser 266 · `hardCurrency=USD` · `localCurrency=VES` · precisión 4 |
| Empresa de la corrida | **1002 — CENTRAL EL PALMAR, S.A.** |
| Modo | **SOLO LECTURA** — no se creó, guardó ni envió ningún registro |
| Veredicto global | ✅ **EL FIX PASA** (3/3 casos) · ⚠ 1 defecto **residual y distinto** en *Crédito Disponible* |

---

## 1. Tasa vigente leída en la app

**`710,0000`** — confirmada por **tres fuentes independientes**:

| Fuente | Lectura |
|---|---|
| Componente Angular `app-client-list` → `currencyService.localValue` | `710` |
| Columna **Tasa** del tab *Doc. de Venta* (doc `0013000419`) | `710,0000 VES` |
| Cliente de control `1000000803` en el listado | `25.800,13 USD × 710 = 18.318.092,30 VES` ✔ (la corrida anterior mostraba `16.846.777,9664`, que es `× 652,9726`) |

`currencyService`: `multimoneda=true`, `localCurrency={VES, id 2}`, `hardCurrency={USD, id 1}`, `currencyRelation=1`, `precision=4`, `coEnterprise=1002`.

⇒ **Aplica la columna de 710,0000 de las tablas del encargo.**

---

## 2. 🔴 Desviación del encargo: los 3 clientes designados NO existen en este dispositivo

Los 3 códigos del encargo **no están sincronizados** en el device. Verificado contra la BD **local** (`window.sqlitePlugin`, tabla `clients`), que es la única fuente de lo que la app puede mostrar:

```sql
SELECT co_client, na_client, co_enterprise FROM clients
WHERE co_client IN ('1000001917','1000001740','1000001675')   -- → 0 filas
```

| Dato | Valor |
|---|---|
| Filas en `clients` (local) | **288** = 144 en empresa `1002` + 144 en `1003` |
| Rango de códigos sincronizados | `1000000719` … `1000003214` |
| `1000001917` FARMATODO, C.A | ❌ ausente (búsqueda UI: *"No hay clientes disponibles"*) |
| `1000001740` DULCES FLOWER, C.A | ❌ ausente |
| `1000001675` DISTRIBUIDORA SAO VICENTE C.A | ❌ ausente |

Los 3 **sí** existen en la nube (se resolvieron sus nombres con `query.js "el palmar"`), pero **no están asignados a este vendedor**. Es el patrón ya documentado **"sync parcial por vendedor"** (`[dm-electronica-20260713][latino_cosmetica-20260714][el_palmar-20260805]`) — **no es un defecto del fix**.

### Decisión tomada

En vez de bloquear, se validó el fix con **sustitutos residentes en el dispositivo que reproducen las 3 formas exactas** del encargo, y se calculó el esperado **a partir de los documentos que la app realmente ve** (BD local = fuente del render), no de la nube. Inventario del device en empresa 1002: **48 clientes con documentos** → 1 solo-VES, 43 solo-USD, **4 mixtos**.

| Caso del encargo | Forma | Sustituto usado |
|---|---|---|
| CASO 1 · solo VES | regresión del camino que ya andaba | **`1000001673` FERNAND GARLIN SUCRS C A** — 1 doc, VES 468,13 |
| CASO 2 · mixto, bucket VES **grande** | el más frágil | **`1000001977` PEPSI-COLA VENEZUELA, C.A.** — 144 docs USD 3.191.087,24 + 4 docs VES 7.786.973,21 |
| CASO 3 · mixto, bucket VES **chico** | | **`1000001897` NESTLE VENEZUELA, S.A.** — 91 docs USD 1.233.727,75 + 6 docs VES 25.688,32 |

**Bonus no previsto:** los dos mixtos **también tienen documentos en la empresa 1003**, igual que el `1000001740` del encargo ⇒ la verificación de agrupación por empresa se pudo hacer igual (y con más volumen).

---

## 3. Resultados por caso

Fórmula validada: `saldoLocal(BS) = sumaVES + sumaUSD × tasa` · `saldoFuerte(USD) = saldoLocal / tasa`.
Etiquetas literales de la UI: **`Saldo VES:`** y **`Saldo USD:`** (en el listado y en el detalle; **no** dice "Saldo BS").

### CASO 1 · `1000001673` FERNAND GARLIN SUCRS C A — solo VES

Docs que ve la app (empresa 1002): **1 doc · VES 468,13 · USD 0,00**

| Métrica | Listado | Detalle | Esperado (tasa 710) | Diferencia |
|---|---|---|---|---|
| `Saldo VES` | `468,1300` | `468,1300` | `468,1300` | **0** |
| `Saldo USD` | `0,6593` | `0,6593` | `0,6593` | **0** |

- **Listado == Detalle == Esperado** ✔ (los tres coinciden, no solo entre sí)
- **Sin división de más:** el `Saldo VES` es el importe crudo del documento (`468,13`), **no** `468,13 / 710 = 0,6593`. El síntoma original (~700× más chico) **no reproduce**. ✔
- **Tercer testigo (USD):** `21.501,7800 − 21.501,1207 = ` **`0,6593`** = `Saldo USD` ✔
- **Testigo adicional (VES):** `15.266.263,8000 − 15.265.795,6700 = ` **`468,1300`** = `Saldo VES` ✔
- Tab *Doc. de Venta*: el único documento muestra `Saldo 468,1300 VES` / `Saldo Conversión 0,6593 USD` — coherencia interna total.

**Veredicto: ✅ PASA**

---

### CASO 2 · `1000001977` PEPSI-COLA VENEZUELA, C.A. — mixto, bucket VES grande

Docs que ve la app (**empresa 1002**): **148 docs** → 144 USD = `3.191.087,24` + 4 VES = `7.786.973,21`
Docs en **empresa 1003** (deben quedar **fuera**): 62 USD = `1.044.082,08` + 7 VES = `47.269,11`

| Métrica | Listado | Detalle | Esperado (tasa 710) | Diferencia |
|---|---|---|---|---|
| `Saldo VES` | `2.273.458.913,6100` | `2.273.458.913,6100` | `2.273.458.913,6100` | **0** |
| `Saldo USD` | `3.202.054,8079` | `3.202.054,8079` | `3.202.054,8079` | **0** |

- **Listado == Detalle == Esperado** ✔
- **El "falso mismatch" se comporta como debe:** `Saldo USD 3.202.054,8079` **es mayor** que la suma de docs USD (`3.191.087,24`). El exceso es `10.967,5679`, que es **exactamente** `7.786.973,21 / 710` (el bucket VES convertido). ✔ Es el comportamiento correcto descrito en el encargo.
- **🔴 Agrupación por empresa CORRECTA:** los documentos de la empresa 1003 **no** se incluyen. Si se hubieran incluido, el `Saldo VES` habría dado `3.014.804.459,52` en vez de `2.273.458.913,61`. ✔ **No hay defecto de agrupación.**
- **Tercer testigo (USD):** `183.879,0800 − 168.417,0230 = ` **`15.462,0570`** ≠ `Saldo USD 3.202.054,8079` ❌ → ver §4.

**Veredicto: ✅ PASA** (el saldo, que es lo que se validaba). El testigo de crédito falla por un defecto **distinto**, documentado en §4.

---

### CASO 3 · `1000001897` NESTLE VENEZUELA, S.A. — mixto, bucket VES chico

Docs que ve la app (**empresa 1002**): **97 docs** → 91 USD = `1.233.727,75` + 6 VES = `25.688,32`
Docs en **empresa 1003** (deben quedar **fuera**): 6 USD = `2.257,76` + 6 VES = `36.540,90`

| Métrica | Listado | Detalle | Esperado (tasa 710) | Diferencia |
|---|---|---|---|---|
| `Saldo VES` | `875.972.390,8200` | `875.972.390,8200` | `875.972.390,8200` | **0** |
| `Saldo USD` | `1.233.763,9307` | `1.233.763,9307` | `1.233.763,9307` | **0** |

- **Listado == Detalle == Esperado** ✔
- Exceso sobre docs USD = `36,1807` = **exactamente** `25.688,32 / 710` ✔
- **Agrupación por empresa CORRECTA** — 1003 excluida ✔
- **Tercer testigo (USD):** `0,0000 − (−1.773,8255) = ` **`1.773,8255`** ≠ `Saldo USD 1.233.763,9307` ❌ → ver §4.

**Veredicto: ✅ PASA**

---

## 4. ⚠ Defecto RESIDUAL detectado — `Crédito Disponible` mezcla monedas sin convertir

**No es el defecto que se estaba corrigiendo, y no invalida el fix.** Pero es la razón por la que el tercer testigo del encargo falla en los mixtos, así que hay que separarlo con claridad.

### Qué pasa

El `Crédito Disponible` se calcula como `límite − consumido`, y el **consumido** se obtiene con una **suma cruda entre monedas**, sin aplicar la tasa:

```
consumido = sumaVES + sumaUSD          ← ✗ suma bolívares con dólares
consumido = sumaVES + sumaUSD × tasa   ← ✔ lo que debería ser (lo que YA hace el Saldo)
```

### Evidencia — cuadra al céntimo en los 3 clientes

| Cliente | `Crédito − Crédito Disp.` (consumido, VES) | `sumaVES + sumaUSD` (crudo) | `Saldo VES` (correcto) |
|---|---|---|---|
| FERNAND GARLIN (solo VES) | `15.266.263,80 − 15.265.795,67` = **`468,1300`** | `468,13 + 0` = **`468,1300`** ✔ | `468,1300` |
| PEPSI-COLA (mixto) | `130.554.146,80 − 119.576.086,35` = **`10.978.060,4500`** | `7.786.973,21 + 3.191.087,24` = **`10.978.060,4500`** ✔ | `2.273.458.913,6100` |
| NESTLE (mixto) | `0,00 − (−1.259.416,07)` = **`1.259.416,0700`** | `25.688,32 + 1.233.727,75` = **`1.259.416,0700`** ✔ | `875.972.390,8200` |

La coincidencia es **exacta a 4 decimales en los tres**, lo que deja poco margen a otra explicación.

### Consecuencias

1. **El tercer testigo del encargo solo es válido en clientes de UNA sola moneda.** En un cliente solo-VES (o solo-USD) las dos fórmulas dan lo mismo, por eso GARLIN pasa. En un mixto divergen. **Ojo: esto significa que el tercer testigo NO puede usarse como oráculo del fix de saldos en clientes mixtos** — mide otra cosa.
2. **El crédito disponible queda inflado** para clientes con deuda en USD: a PEPSI le quedan "168.417,02 USD disponibles" cuando su deuda real (`3.202.054,81 USD`) supera de largo su límite (`183.879,08 USD`). Si algún flujo (pedidos/cobros) bloquea por crédito, **no bloquearía cuando debería**.
3. Es **el mismo tipo de error** que el `CLT-LISTA-SALDOS-CRUZADOS` original (conversión de moneda mal aplicada), pero en **otro campo**: el fix corrigió el `Saldo` y **no tocó** el `Crédito Disponible`.

### Datos de apoyo

- La tabla local `clients` **ya no tiene columna `nu_balance`** — solo `nu_credit_limit` (guardado en **USD**, `id_currency=1`). Consistente con lo que informó desarrollo: el saldo ya no se lee del cliente, se deriva de los documentos. ✔
- `Crédito VES` = `nu_credit_limit × 710` — correcto: GARLIN `21.501,78 × 710 = 15.266.263,80` ✔ · PEPSI `183.879,08 × 710 = 130.554.146,80` ✔ · NESTLE `0` ✔. **El límite sí se convierte bien; lo que no se convierte es el consumido.**

**Sugerencia de ID:** `CLT-CREDITO-DISP-MEZCLA-MONEDAS`.

---

## 5. Resumen de veredictos

| Caso | Cliente validado | Listado | Detalle | vs Esperado | Agrup. empresa | 3er testigo | **Veredicto** |
|---|---|---|---|---|---|---|---|
| 1 · solo VES | `1000001673` FERNAND GARLIN | ✔ | ✔ | **0 dif** | n/a (solo 1002) | ✔ `0,6593` | ✅ **PASA** |
| 2 · mixto VES grande | `1000001977` PEPSI-COLA | ✔ | ✔ | **0 dif** | ✔ 1003 excluida | ❌ defecto §4 | ✅ **PASA** |
| 3 · mixto VES chico | `1000001897` NESTLE | ✔ | ✔ | **0 dif** | ✔ 1003 excluida | ❌ defecto §4 | ✅ **PASA** |

### Veredicto global del fix: ✅ **PASA**

`CLT-LISTA-SALDOS-CRUZADOS` está **corregido de raíz**, no maquillado:

- El listado y el detalle **coinciden entre sí Y con el valor derivado de los documentos** — no es el falso-fix anterior, que alineó el detalle al listado roto.
- La conversión por buckets `sumaVES + sumaUSD × tasa` es **exacta al céntimo** en las 3 formas (solo-VES, mixto con VES grande, mixto con VES chico).
- La **agrupación por empresa** funciona: en los dos mixtos, los documentos de la empresa 1003 quedan correctamente fuera del saldo de la 1002.
- El síntoma original (deuda ~700× más chica por división de más) **no reproduce**.
- Las etiquetas **no** están cruzadas: `Saldo VES` es el importe grande en bolívares y `Saldo USD` el chico en dólares, en la relación correcta de la tasa.

**Reserva explícita:** la validación se hizo sobre **clientes sustitutos**, porque los 3 designados no están sincronizados en este dispositivo (§2). Los sustitutos cubren las mismas 3 formas y con más volumen documental (148 y 97 documentos frente a los 20 del caso 1 original), así que la cobertura es equivalente o mejor. Si QA necesita el veredicto sobre **esos códigos exactos**, hay que **asignar los 3 clientes al vendedor 1276 y re-sincronizar** el dispositivo.

---

## 6. Otras observaciones

| # | Observación |
|---|---|
| O-1 | **Las etiquetas de la UI dicen `Saldo VES:` / `Saldo USD:`**, no "Saldo BS". Idénticas en listado y detalle. Sin cruces ni moneda invertida. |
| O-2 | **El saldo NO se repite entre empresas:** cada cliente aparece una sola vez en el listado, con el saldo de la empresa activa (1002). 18 de los clientes del device tienen documentos en ambas empresas y ninguno mostró contaminación cruzada. |
| O-3 | El buscador del listado **filtra por nombre (`na_client`), no por código** — reconfirma `[dm-electronica-20260713][latino_cosmetica-20260714]`. Buscar `"FARMATODO"` devuelve *"No hay clientes disponibles"* igual que buscar su código: hay que resolver el nombre antes de concluir "no está". La ausencia se confirmó por BD local, no por la búsqueda. |
| O-4 | La tabla de documentos **local** se llama **`document_sales`** (plural), frente a `document_sale` (singular) en la nube — coherente con el quirk de plurales de `_comunes.md`. Columnas útiles: `nu_balance`, `co_currency`, `co_enterprise`, `nu_value_local`. |
| O-5 | El tab *Doc. de Venta* trae columnas pareadas `Monto/Monto Conversión` y `Saldo/Saldo Conversión`, y una columna **`Tasa`** por documento — es la vía más barata de leer la tasa vigente sin abrir cobros ni pedidos. |
| O-6 | No hizo falta paginar con `onIonInfinite()`: el buscador por nombre alcanzó los 3 sustitutos directamente. El listado carga 50 ítems iniciales de los 144 asignados. |

---

## 7. Estado final

- App en **HOME**, sesión intacta.
- **Nada creado, guardado ni enviado** — la corrida fue estrictamente de lectura (UI + `SELECT` sobre la BD local vía `window.sqlitePlugin` + `SELECT` de nombres en la nube).
- No se modificaron otros reportes ni el ledger de la corrida.
