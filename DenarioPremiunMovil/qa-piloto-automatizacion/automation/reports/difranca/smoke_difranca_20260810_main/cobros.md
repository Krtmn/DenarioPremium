# Smoke Test — Módulo COBROS (SOLO LECTURA)

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `smoke_difranca_20260810_main` |
| Módulo | COBROS — **solo lectura por decisión de QA** (0 cobros creados / editados / borrados) |
| App | `com.kiberno.denarioPremiumPro` — build **main**, commit `99b138fa`, app v1.0 / db19 |
| Playa · tenant | **EL YAQUE** · `difranca` |
| Empresas vistas | DDHP_A12 (2) · DIF_A12 (3) · DHVITAL01_A (4) |
| `window.ng` | **true** · `sqlitePlugin` disponible |
| Resultado | **7 PASS · 2 FAIL · 0 BLOCKED · 30 N/A** |
| Estado final | HOME, sin alerts ni modales |

> ⚠ El YAML del cliente abre declarándose "GO/NO-GO AL TAG 20". **Eso no aplica a esta corrida** (indicación
> del orquestador): el objetivo acá es **cazar defectos nuevos en `main`** antes del tag de la 21.

---

## Alcance y método

- **No se creó, editó ni borró ningún cobro.** Todos los casos del smoke que implican creación van 🚫 N/A
  con motivo *"cobros solo lectura por decisión de QA"*.
- El material de verificación son los **7 cobros que la QA creó hoy a mano** (21837-21843, uno por tipo),
  más **2 cobros de control del 07/08** (21834, 21824) usados para reproducir los hallazgos.
- **9 cobros abiertos en el móvil**, cada uno cotejado campo a campo contra la BD de nube
  (`node automation/db/query.js difranca …`). Tolerancia 0,01.
- ⚠ El tenant está vivo: el `count` de `collection` pasó de **19.782** (baseline) a **19.782** con los 7 de
  hoy ya incluidos. **Ningún incremento de esa tabla es atribuible a esta corrida** — no se creó nada.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Menú Cobros: `COBRO` · `ANTICIPO/PREPAGO` · `RETENCIÓN` · `IGTF` · `BUSCAR`, los 5 habilitados. **Sin botón 25% IVA** ⇒ coherente con `userCanCollectIva=false` |
| DM-COB-014 | ✅ PASS | Tab Total renderiza en los 9 cobros: cabecera de totales + tabla de documentos + acordeones por método de pago (Depósitos / Transferencias), todos con montos no nulos |
| DM-COB-015 | ✅ PASS | Línea `Total General <moneda>: X` presente y correcta en los 9 (ej. 21837 `Total General BSD: 200.000,00`) |
| DM-COB-022 | ✅ PASS | BUSCAR abre `app-cobros-list` con **105 cobros** + searchbar. Botón eliminar **ausente** en los 105 (todos `Estatus: Enviado`) ⇒ correcto |
| DM-COB-V02 | ✅ PASS | **🔴 DATO DECISIVO — el móvil NO sufre `COB-LISTA-RENDER-VACIO`.** Detalle abajo |
| DM-COB-V03 | ✅ PASS | Tasa: el móvil usa y muestra **752,09** (fecha tasa 4/8/2026) en los 9 cobros; **ignora** las 3 filas corruptas de `conversion_type` con fecha 2056 / valor 721,35 |
| DM-COB-V04 | ✅ PASS | El BUSCAR descarga del servidor; criterio de recorte **acotado y corregido** (ver "Patrones") |
| **DM-COB-V01a** | ❌ **FAIL** | **Cobro en moneda `USD` — la conversión a BSD de la cabecera del Tab Total está INVERTIDA** (divide en vez de multiplicar) |
| **DM-COB-V01b** | ❌ **FAIL** | **Cobro con IGTF embebido — el IGTF no entra en "Monto total a Pagar" ⇒ el Tab Total muestra Diferencia ≠ 0** en un cobro que cierra en cero |
| DM-COB-002 · 004 · 006 · 007 · 008 · 009 · 012 · 016 · 018 · 019 · 020 · 021 · 026 · 028 · 029 · 033 · 034 · 036 · 038 · 039 · 040 · 041 · 042 · 043 · 044 · 045 · 046 · 047 | 🚫 N/A ×28 | **cobros solo lectura por decisión de QA** — todos exigen crear, editar, guardar, enviar o borrar un cobro |
| DM-COB-037 | 🚫 N/A | Doble motivo: solo lectura **+** `userCanCollectIva=false` (0 cobros `co_type=4` en 19.782) |
| DM-COB-024 | 🚫 N/A | Requiere un cobro en **Guardado**; los 105 visibles están **Enviado** (`st_collection=1`). Sin material, no por defecto |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | **ninguno** — módulo en solo lectura | — |

---

## 🔴 Respuesta a la pregunta abierta: el IGTF **21843 se ve y se abre en el móvil**

`COB-LISTA-RENDER-VACIO` está confirmado **en la web** (el `<tbody>` llega vacío desde el servidor con los
`co_type=3`). **En el móvil NO ocurre**, y esta corrida lo cierra con evidencia directa sobre `main`:

- El **21843 (IGTF)** aparece en la lista, **primera fila**, con su rótulo de tipo correcto:
  `Cliente: CAR473 - COMERCIAL METRO LAS FERIAS 333 · Nro Ref: 21843 · Estatus: Enviado · Fecha: 10/08/2026 · IGTF`
- **Abre sin problema**: click real en el `ion-item` → vista de cobro Enviado con **3 tabs**
  (`default` / `total` / `adjuntos`).
- El Tab Total cotea **exacto** contra BD (ver aritmética abajo).
- No es un caso aislado: la lista trae además los IGTF **21836 y 21835** (07/08), y el 21836 también se
  abrió y coteó bien. **Los `co_type=3` renderizan, se cuentan y se abren.**
- Coherencia de conteo: `filteredItems=105` / `displayedItems=20` / `pageSize=20`, con **20 `ion-item` en el
  DOM** ⇒ pintados = declarados. No hay "N contados / 0 pintados" como en la web.

⇒ **El defecto sigue acotado a la capa web.** No hay razón móvil para bloquear el tag por este ítem.

---

## Aritmética de los 7 cobros — cotejo BD ↔ móvil

Tasa vigente en los 7: **`nu_value_local` = 752,09** (fecha tasa 04/08/2026). `id_conversion_type` = NULL en
los 7. Empresa y cliente de la UI coinciden con `id_enterprise` / `co_client` de BD en los 7.

### 21837 · `co_type=0` normal · **BSD** · DDHP_A12 (2) · CAR064 ✅
```
doc FACT5000085282   saldo 246.234,27
  − Dev/Falt.               234,00
  − Retención IVA        40.000,27
  − Retención ISLR        6.000,00
  = Monto Pago          200.000,00   ✔ exacto (BD nu_amount_paid = 200.000,0000)
Conversión  200.000,00 / 752,09 = 265,9256 → 265,93   ✔ BD nu_amount_total_conversion = 265,9300
            246.234,27 / 752,09 = 327,398  → 327,40   ✔ doc_conversion
             40.000,27 / 752,09 =  53,1857 →  53,19   ✔ iva_conversion
              6.000,00 / 752,09 =   7,9778 →   7,98   ✔ islr_conversion
Pagos: 1 × transferencia BANCARIBE 200.000,00 (= total)  ✔   Diferencia 0,00
UI Tab Total: 200.000,00 / US$ 265,93 · Tasa US$ 752,09 · Total General BSD 200.000,00  ✔ 1:1 con BD
```

### 21838 · `co_type=0` normal · **US$** · DDHP_A12 (2) · CAR082 · **IGTF embebido** ⚠
```
doc FACT5000085111   saldo 370,48  − Dev/Falt. 0,48  = 370,00
IGTF 3 % sobre 370,00 = 11,10        ✔ base = total a pagar (NO cobra de más)
Total del cobro      370,00 + 11,10 = 381,10   ✔ BD nu_amount_total = nu_amount_final = 381,1000
Conversión  381,10 × 752,09 = 286.621,499 → 286.621,50   ✔ BD
            370,48 × 752,09 = 278.634,303 → 278.634,30   ✔ doc_conversion
Pagos: 1 × depósito Amerant Bank 381,10 (= total, IGTF incluido)  ✔   BD nu_difference = 0,0000
UI Tab Total: ❌ "Monto total a Pagar US$ 370,00" (sin IGTF) · "Pago US$ 381,10" · "Diferencia US$ 11,10"
              → ver FAIL DM-COB-V01b. "Total General US$: 381,10" sí es correcto.
```

### 21839 · `co_type=0` normal · **USD** · DIF_A12 (3) · CAR473 · IGTF **separado** ⚠
```
doc FACT5000002983   saldo 196,04  sin dev/falt, sin retención  = Monto Pago 196,04   ✔
Conversión  196,04 × 752,09 = 147.439,7236 → 147.439,72   ✔ BD nu_amount_total_conversion
Pagos: 3 transferencias  100,00 + 90,00 + 6,04 = 196,04   ✔ exacto
       conversión  75.209,00 + 67.688,10 + 4.542,62 = 147.439,72   ✔ exacto
IGTF: NO embebido (has_igtf=false, nu_amount_igtf=0) → viaja como cobro separado 21843
UI Tab Total: ❌ "Monto total a Pagar BSD 0,26" y "Pago BSD 0,26"  (= 196,04 ÷ 752,09)
              ✔ pero el acordeón de la MISMA pantalla imprime "Total Transferencias: BSD 147.439,72"
              → ver FAIL DM-COB-V01a
```

### 21840 · `co_type=1` **anticipo** · BSD · DHVITAL01_A (4) · CAR003 ✅
```
Sin documentos (correcto para anticipo: collection_detail = 0 filas)
Pagos: transferencia BANCO MERCANTIL 1.000,00 + depósito BANCO PROVINCIAL 2.000,00 = 3.000,00  ✔ = total
Conversión  1.000,00/752,09 = 1,3296 → 1,33   ·  2.000,00/752,09 = 2,6593 → 2,66   ·  suma 3,99
            BD nu_amount_total_conversion = 3,9900   ✔
UI Tab Total: Total Depósitos BSD 2000 / US$ 2,66 · Total Transferencias BSD 1.000,00 / US$ 1,33
              · Total General BSD: 3.000,00   ✔ 1:1 con BD
Etiqueta de fecha del Tab General = "Fecha Anticipo" (varía con co_type — ver Patrones)
```

### 21841 · `co_type=2` **retención** · BSD · DDHP_A12 (2) · CAR064 ✅
```
doc FACT5000086770  Monto Doc 707.603,88   comprobante 1233468
  Retención IVA   1.500,00
  Retención ISLR    700,00
  Total a pagar   2.200,00   ✔ oráculo co_type=2: el saldo NO participa, total = IVA + ISLR
BD: nu_amount_total = 2.200,0000 · pagos = 0 filas  ✔ (correcto: la retención no lleva pagos)
Conversión  IVA 1.500,00/752,09 = 1,99  ·  ISLR 700,00/752,09 = 0,93  ·  suma = 2,92
            BD nu_amount_total_conversion = 2,9200   ✔
            ⓘ 2.200,00/752,09 = 2,9252 → 2,93 "de una". La app convierte COMPONENTE a COMPONENTE y suma
              (1,99+0,93=2,92). Diferencia 0,01 ⇒ **dentro de tolerancia, NO es defecto**; queda anotado
              porque es el criterio de redondeo real de la app.
UI Tab Total: Monto Doc BSD 707.603,88 · IVA 1.500,00 · ISLR 700,00 · Monto total retenido 2.200,00
              · Monto total a Pagar BSD 2.200,00 / US$ 2,92   ✔ 1:1 con BD
```

### 21842 · `co_type=2` **retención** · US$ · DHVITAL01_A (4) · CAR003 · 2 documentos ✅
```
doc FACT5000005008  Monto Doc 2.981,66   IVA 100,00 + ISLR  7,00 = 107,00   ✔
doc FACT5000005267  Monto Doc 1.943,58   IVA  50,00 + ISLR  5,00 =  55,00   ✔
Total a pagar  107,00 + 55,00 = 162,00   ✔ BD nu_amount_total = 162,0000 · pagos = 0 filas  ✔
Conversión  107,00 × 752,09 = 80.473,63  ·  55,00 × 752,09 = 41.364,95  ·  suma 121.838,58
            BD nu_amount_total_conversion = 121.838,5800   ✔ exacto
            por componente: 100×752,09=75.209,00 · 7×752,09=5.264,63 (=80.473,63 ✔)
                            50×752,09=37.604,50 · 5×752,09=3.760,45 (=41.364,95 ✔)
UI Tab Total: los 2 acordeones con sus 4 montos + "Monto total a Pagar US$ 162,00 / BSD 121.838,58" ✔
```

### 21843 · `co_type=3` **IGTF** · BSD · DIF_A12 (3) · CAR473 ✅
```
Vínculo con el padre:  co_original_collection = "1786374436178.0" = co_collection del 21839   ✔
Documento: "IGTF-1786374436178.0" (patrón IGTF-<co_collection del padre>)  tipo IGTF   ✔
Monto del documento IGTF  4.422,29 BSD  =  5,88 US$  =  3 % de los 196,04 del 21839   ✔
  (196,04 × 3 % = 5,8812 → 5,88 ; 5,88 × 752,09 = 4.422,29)
Cobrado 4.000,00 de 4.422,29  ⇒ in_payment_partial = TRUE (pago parcial)   ✔ coherente con el total
Conversión  4.000,00 / 752,09 = 5,3185 → 5,32    ✔ BD nu_amount_total_conversion = 5,3200
Pagos: 1 × depósito BANCO DE VENEZUELA 4.000,00   ✔ = total    Diferencia 0,00   ✔
UI Tab Total: Monto total a Pagar BSD 4.000,00 / USD 5,32 · Tasa USD 752,09 · Pago BSD 4.000,00
              · Diferencia 0,00 · fila IGTF | IGTF-1786374436178.0 | 4.422,29 | 4.000,00
              · Total General BSD: 4.000,00   ✔ 1:1 con BD
```

### Resumen del cotejo

| Cobro | Tipo | Moneda | Cabecera | Detalle/doc | Pagos | Conversión | Tasa |
|---|---|---|---|---|---|---|---|
| 21837 | 0 normal | BSD | ✔ | ✔ | ✔ | ✔ | 752,09 ✔ |
| 21838 | 0 + IGTF | US$ | ❌ Diferencia 11,10 | ✔ | ✔ | ✔ | 752,09 ✔ |
| 21839 | 0 normal | **USD** | ❌ BSD 0,26 | ✔ | ✔ | ❌ invertida | 752,09 ✔ |
| 21840 | 1 anticipo | BSD | ✔ | n/a | ✔ | ✔ | 752,09 ✔ |
| 21841 | 2 retención | BSD | ✔ | ✔ | ✔ (0) | ✔ | 752,09 ✔ |
| 21842 | 2 retención | US$ | ✔ | ✔ | ✔ (0) | ✔ | 752,09 ✔ |
| 21843 | 3 IGTF | BSD | ✔ | ✔ | ✔ | ✔ | 752,09 ✔ |

**La BD está bien en los 7.** Los dos ❌ son de **presentación en el Tab Total del móvil**.

---

## Hallazgos

### ❌ FAIL 1 — `COB-USD-CONV-INVERTIDA` · la conversión de un cobro en `USD` está al revés

**Severidad: alta** (financiero y muy visible). **Capa: móvil.** **Nuevo** — no figura en `defectos-conocidos.yaml`.

difranca tiene **dos monedas dólar con el mismo nombre visible**: `US$` (id 2) y `USD` (id 3), ambas
rotuladas *"DOLAR AMERICANO (US$)"*. La app trata `US$` como moneda **fuerte** (multiplica para pasar a
bolívares) pero trata `USD` como si fuera **local** ⇒ **divide**.

**Evidencia — mismo cobro, misma pantalla, dos números distintos:**

| Cobro 21839 (`co_currency = USD`) | Muestra el móvil | Correcto (BD) |
|---|---|---|
| Monto total a Pagar BSD | **0,26** ❌ | 147.439,72 |
| Pago BSD | **0,26** ❌ | 147.439,72 |
| *Total Transferencias (acordeón, misma pantalla)* | *147.439,72* ✔ | 147.439,72 |
| detalle de cada transferencia | 75.209,00 / 67.688,10 / 4.542,62 ✔ | idem |

`0,26 = 196,04 ÷ 752,09`. Lo correcto es `196,04 × 752,09 = 147.439,72`, que es lo que la propia pantalla
imprime dos líneas más abajo y lo que hay en `collection.nu_amount_total_conversion`.

**Reproducción (2/2 en `USD`, 0/2 en `US$`):**
- 21839 (10/08) → `Monto total a Pagar BSD 0,26`
- **21834** (07/08, cobro independiente, mismo importe) → `Monto total a Pagar BSD 0,26`, con
  `Total Depósitos: USD 196.04 BSD 147.439,72` correcto debajo
- **Control** 21838 (`US$`) → `370,00 → BSD 278.273,30` ✔ y 21824 (`US$`) → `85,89 → BSD 64.597,01` ✔

**Alcance:** la empresa **DIF_A12 (id 3)** tiene `coCurrencyDefault = "USD"` ⇒ **todos** sus cobros en
divisa caen acá. En BD hay cobros `USD` recientes afectados: 21839, 21836, 21834, 21826, 21786, 21727,
21723 (798 cobros `USD` en el histórico). El error de escala es de **tasa²** (~565.000×).

**Pasos:** Cobros → BUSCAR → abrir un cobro de la empresa `DIFRANCA C.A` en moneda `USD` → Tab Total →
comparar la cabecera *"Monto total a Pagar BSD"* contra *"Total Transferencias/Depósitos BSD"* del acordeón.

> ⚠ Anotar siempre el **código** de moneda (`US$` vs `USD`), nunca el rótulo: los dos se leen
> "DOLAR AMERICANO (US$)" en pantalla y el defecto es invisible si se mira la etiqueta.

### ❌ FAIL 2 — `COB-IGTF-DIFERENCIA-FANTASMA` · el IGTF embebido no suma en "Monto total a Pagar"

**Severidad: media-alta** (visible, e induce a creer que el cobro no cerró). **Capa: móvil.** **Nuevo.**

En un cobro con **IGTF embebido** (`has_igtf=true`), el Tab Total calcula *"Monto total a Pagar"* **sin** el
IGTF, pero *"Pago"* **sí** lo incluye ⇒ imprime una **Diferencia igual al IGTF** en un cobro que en BD cierra
en cero (`nu_difference = 0,0000`) y que está **Enviado**.

| Cobro | Monto total a Pagar | Pago | Diferencia mostrada | `nu_amount_igtf` (BD) | `nu_difference` (BD) |
|---|---|---|---|---|---|
| **21838** (US$) | 370,00 | 381,10 | **11,10** / BSD 8.348,20 | 11,10 | **0,00** |
| **21824** (US$, 07/08) | 85,89 | 88,47 | **2,58** / BSD 1.940,39 | 2,58 | **0,00** |

La Diferencia mostrada **es exactamente el IGTF**, en los 2 casos.

**Agravantes observados:**
1. La Diferencia se pinta en **azul** (`rgb(0,0,255)` — el color de "cubierto") pese a no ser 0,00 ⇒ ni
   siquiera se señaliza como descuadre.
2. **El IGTF no aparece en ninguna parte del Tab Total** de estos cobros: no hay línea IGTF en la cabecera y
   la tabla de documentos **no trae columna IGTF** (columnas: Tipo / Nro. Doc. / Monto Doc. / Dev/Falt. /
   Monto Pago). En cambio el 21839 —que lleva el IGTF **separado**— **sí** trae columna IGTF con 5,88.
   El tratamiento es inconsistente entre las dos modalidades de IGTF.
3. `Total General` sí es correcto (381,10 / 88,47) ⇒ conviven en la misma pantalla un total bueno y una
   diferencia falsa.

**Contexto que lo vuelve relevante:** difranca tiene `tolerancia0=false` con ambos rangos en 0 — *"no se
pueden enviar cobros que no cierren en cero"*. Un vendedor que abra un cobro IGTF ya enviado ve una
diferencia de 11,10 que contradice la regla y el dato guardado.

> Esto **no** es el caso de "IGTF que cobra de más": la base del IGTF es correcta (3 % sobre el total a
> pagar: 3 % de 370,00 = 11,10 ✔). El defecto es que el Tab Total no incorpora ese IGTF al total.

### ⓘ Conocidos que reproducen (NO se re-levantan)

| Defecto | Estado en el registro | Qué se observó ahora |
|---|---|---|
| `COB-CONTADOR-ADJUNTOS` | `en_observacion` | **Reproduce en `main`, 7/7 y en los 15 cobros más recientes**: `collection.nu_attachments = 3` con **2** filas reales en `transaction_image` (`21843_0.jpeg`, `21843_1.jpeg`). 0 filas en `transaction_image_saved`. El contador siempre suma 1 de más |
| `Total Depósitos` sin formato de miles | **descartado por QA** (2026-07-30) | Sigue igual: `Total Depósitos: BSD 4000` / `US$ 381.1` mientras el detalle formatea `BSD 4.000,00`. **No se reporta** |
| Fecha del documento como timestamp ISO crudo | **descartado por QA** | Sigue igual en la retención 21842: `Fecha del documento: 2026-08-10T04:00:00.000+00:00`. **No se reporta** |

---

## Verificación BD

Sin creación ⇒ no hay marca guardado→enviado que emitir. El cotejo fue **nube → UI** sobre registros ajenos.

| Registro | Marca | Fila nube | Conclusión |
|---|---|---|---|
| 21837 | `BD-OK` | `co_type=0`, `st=1`, 1 doc, 1 pago, suma = total | UI 1:1 con BD |
| 21838 | `BD-MISMATCH` (UI) | `co_type=0`, `st=1`, 1 doc, 1 pago, `nu_amount_igtf=11,10`, `nu_difference=0` | **BD correcta**; la UI muestra Diferencia 11,10 |
| 21839 | `BD-MISMATCH` (UI) | `co_type=0`, `st=1`, 1 doc, 3 pagos, `tot_cv=147.439,72` | **BD correcta**; la UI muestra BSD 0,26 |
| 21840 | `BD-OK` | `co_type=1`, `st=1`, **0 docs**, 2 pagos, suma = total | correcto para anticipo |
| 21841 | `BD-OK` | `co_type=2`, `st=1`, 1 doc, **0 pagos**, IVA+ISLR = total | correcto para retención |
| 21842 | `BD-OK` | `co_type=2`, `st=1`, 2 docs, **0 pagos**, Σ(IVA+ISLR) = total | correcto para retención |
| 21843 | `BD-OK` | `co_type=3`, `st=1`, 1 doc IGTF, 1 pago, parcial | vínculo al padre 21839 correcto |

- **Duplicados:** 0 — `count(*)` = `count(DISTINCT co_collection)` en los 7.
- **Baseline:** `collection` = 19.782, con los 7 de hoy ya dentro. **La corrida no agregó ninguna fila.**
- `BD-INFO`: los 7 cobros son de `id_user = 275` (VEND206), el vendedor QA. Ningún tercero escribió durante la ventana.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **El criterio del BUSCAR de cobros NO son "los 100 más recientes": es una VENTANA DE `historyMonths`** | universal (corrige `[difranca-20260807]`) | El móvil trae **105** cobros y el conteo cuadra **exacto** con `count(*) WHERE id_user=275 AND da_created >= now() - interval '1 month'` = **105** (`historyMonths=1`). El rango observado va del **10/07** al **10/08**, un mes justo. La nota previa ("los 100 más recientes del vendedor") era **coincidencia**: el 07/08 la ventana de 1 mes valía 100. **Verificar contra la ventana de `historyMonths`, nunca contra un N fijo** — y jamás contra el total de la tabla (2.390 del vendedor, 19.782 en total) |
| **El rótulo de fecha del Tab General varía con `co_type` — ahora con el 4.º valor** | universal (amplía `[el_palmar-20260805]`) | `Fecha Cobro` (`co_type=0` y `3`) · `Fecha Retención` (`2`) · **`Fecha Anticipo` (`1`)** ← nuevo. Confirma que la etiqueta **no sirve como selector estable** |
| **La tabla de documentos del Tab Total gana/pierde columnas según el modo de IGTF** | universal | IGTF **separado** (21839) → columnas `Tipo·Nro. Doc.·Monto Doc.·IGTF·Monto Pago`. IGTF **embebido** (21838/21824) → **sin** columna IGTF. Retención (21837) → `…·Dev/Falt.·Retención IVA·Retención ISLR·Monto Pago`. **Mapear celdas contra la fila de encabezado, nunca por índice fijo** (refuerza `[gmp-20260730]`) |
| **La conversión de retención (`co_type=2`) se calcula COMPONENTE A COMPONENTE y se suma** | universal | 21841: `1.500/752,09 = 1,99` + `700/752,09 = 0,93` = **2,92**, no `2.200/752,09 = 2,93`. Da hasta 0,01 de diferencia contra la conversión "de una". **No levantar como defecto de redondeo**: es el criterio real de la app |
| **Recorrido lista→detalle→lista reconfirmado 9 veces sin un fallo** | universal | `back` = `img.fechaAtras` filtrando `width>0 && x<100` → cae en el **menú COBROS** (no en la lista) ⇒ re-pulsar `BUSCAR`. `BUSCAR` = `app-cobros ion-button` con `textContent==='BUSCAR'`, disparado con Pointer(down/up) + `shadowRoot button.click()` + `mouse.click(delay:130)`. Abrir el ítem: localizar por `/Nro Ref:\s*<ref>\b/` en el `innerText` → `scrollIntoView({block:'center'})` → **re-leer** rect → validar centro en viewport 360×744 → `mouse.click(delay:130)` |
| **Localizar un cobro por Nro. Ref en la lista** | universal | `Array.from(document.querySelectorAll('app-cobros-list ion-item')).find(e => /Nro Ref:\s*21843\b/.test(e.innerText))`. El `innerText` del ítem **termina** con el tipo (`Cobros`/`IGTF`/`Retención`/**`Anticipo`**) ⇒ se puede armar una muestra por `co_type` sin abrir nada. **`Anticipo` es el rótulo nuevo** (`co_type=1`) |
| **Paginar la lista de cobros por código** | universal | `c = ng.getComponent(document.querySelector('app-cobros-list')); c.onIonInfinite({target:{complete(){}}}); ng.applyChanges(c)` + ~1,2 s por vuelta. Sin `applyChanges` el modelo crece y el DOM no (reconfirma `[difranca-20260807]`) |
| **Color de la Diferencia legible con `getComputedStyle` sobre el leaf del `ion-col`** | universal | `rgb(0, 0, 255)` = azul (cubierto) · rojo = insuficiente. ⚠ **Sirvió para probar que el móvil pinta AZUL una diferencia ≠ 0** en los cobros con IGTF embebido |
| 🔴 **Las dos monedas dólar (`US$` id 2 / `USD` id 3) reciben trato distinto en la conversión** | **cliente (difranca), con riesgo universal** | Ver FAIL `COB-USD-CONV-INVERTIDA`. Regla operativa: en cualquier veredicto de moneda **leer `co_currency` de BD**, nunca el rótulo de pantalla (los dos dicen "DOLAR AMERICANO (US$)"), y **cotejar la cabecera del Tab Total contra el acordeón de la misma pantalla** — el acordeón es el que está bien |
| **El móvil ignora las filas corruptas de `conversion_type`** | cliente (difranca) | Las 3 filas con `date_conversion = 2056-07-25` y `nu_value_local = 721,35` (una por empresa activa: ids 3445/3443/3447) **no** las toma el móvil: los 9 cobros muestran **752,09** con `Fecha Tasa 4/8/2026`. Contrasta con la web, que sí las agarra |
| ⚠ **El hint del Comentario de cobro dice "Mín. 0 - Máx. 255"** | cliente | En difranca/El Yaque el Tab General rotula **255** (no los 120 que el perfil documenta para otros campos). Coincide con el_palmar. **El tope es por campo** — no cruzarlo con `longitudComentario=200` |

---

## Notas de ejecución

- 0 cuelgues de CDP, 0 reintentos por selector, 0 BLOCKED. 9 cobros abiertos y cerrados limpio.
- No se ejecutó login ni cambio de usuario en ningún momento (la app no cayó a `/login`).
- El bundle `__qaH` heredado se dejó intacto; las skills propias se registraron bajo `window.__qaC`.
- Modo RECORD no solicitado ⇒ no se grabó traza.
