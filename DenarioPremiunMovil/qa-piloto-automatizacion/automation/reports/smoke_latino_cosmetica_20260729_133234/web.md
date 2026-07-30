# Capa WEB — smoke latino_cosmetica · Isla Coche

**RUN_ID:** `20260729_133234_smoke-completo`
**Base:** `http://denarioislacoche.ddns.net:8080/DenarioPremium` · **Empresa:** LATINOCOSMETICA C.A.
**Modo:** READ-ONLY (solo `Consultar`, `Buscar`, `Limpiar`, `Columnas`, `Descargar Adjunto`, `Ver adjuntos`).
**⚠ Oráculo degradado:** la BD **nube** de `latino_cosmetica` está **sin GRANT** (0 de 185 tablas legibles
para `user_read`) ⇒ los cotejos contra BD quedan a medias; el oráculo efectivo es la propia web
(lista ↔ detalle ↔ galería) más el manifiesto del móvil.

---

## WEB · Módulo CLIENTES POTENCIALES

**Guarda de playa:** `verificarContexto({host:'denarioislacoche.ddns.net:8080', pathname:'/DenarioPremium/pages/clientesPotenciales'}, 'clientes_potenciales', false, 'isla_coche')` → `{ok:true, playa:'isla_coche'}`
**Confirmación extra de empresa:** el `<select>` de empresa del filtro trae **una sola opción**: `LATINOCOSMETICA C.A.` → imposible estar en otra playa/empresa.
**Universo del módulo:** 4 clientes potenciales en total (sin filtro de fechas).

### Gate de precondición

| Ref | marca_bd | Gate | Vía |
|---|---|---|---|
| 4 | `BD-N/A` (nube sin GRANT) | **evaluar: true** | `ref-servidor` — Nro.Ref 4 asignado por el servidor |

### Registro creado por el móvil — Ref 4 (DM-CLT-026)

Localizado **barriendo la columna `# Ref`** con filtro vendedor 100/NEIMY PARRA + fecha 29/07/2026 (el módulo no tiene filtro de `# Ref`).

| Campo | Móvil (manifiesto) | Web (detalle) | Veredicto |
|---|---|---|---|
| `Código` (epoch `co_client`) | `1785347054572.0` | `1785347054572.0` | ✅ exacto (llave del detalle) |
| Nombre | Test-CLT-SMOKE-134438 | Test-CLT-SMOKE-134438 | ✅ |
| Cédula/RIF | J987654321 | J987654321 | ✅ |
| Fecha de Registro | 2026-07-29 13:46:13 | 29/07/2026 13:46:13 | ✅ mismo día **y misma hora** (sin desfase UTC) |
| Comentario | CLIENTE QA SMOKE | CLIENTE QA SMOKE | ✅ |
| Responsable | NEIMY PARRA | NEIMY PARRA | ✅ |
| Correo | qa.smoke@kiberno.com | qa.smoke@kiberno.com | ✅ |
| Teléfono | 04149161796 | 04149161796 | ✅ |
| Dirección | AV PRINCIPAL QA CIUDAD GUAYANA | AV PRINCIPAL QA CIUDAD GUAYANA | ✅ sin truncar |
| Dirección Entrega | AV PRINCIPAL QA DESPACHO | AV PRINCIPAL QA DESPACHO | ✅ sin truncar |
| Coordenada de transacción | 11.0490573,-63.864981 | 11.0490573,-63.864981 | ✅ exacta |
| Vendedor | 100 / NEIMY PARRA | NEIMY | ⚠ **nota**, no mismatch — la web muestra el nombre corto. Verificado: el filtro `Vendedor = NEIMY PARRA` devuelve esta fila ⇒ misma identidad |
| Web (sitio) | `null` | `` (vacío) | ⏭ vacío en móvil → se saltea. **Trampa C09 NO se activó**: no absorbió el título `Contacto` |

`cotejarCampos(movil, web, {fechas:['Fecha de Registro']})` → **`{marca:'WEB-OK', comparados:11, diffs:[], notas:[]}`**

### Casos

| Caso | Verifica | Resultado | Marca |
|---|---|---|---|
| DW-CLT-C01 | Presencia por columna `# Ref` | Ref 4, 1ª fila | WEB-OK |
| DW-CLT-C02 | `Código` == epoch | `1785347054572` == `1785347054572` | WEB-OK |
| DW-CLT-C03 | Datos Básicos | 5/5 (Vendedor con nota) | WEB-OK |
| DW-CLT-C04 | Contacto | 3/3 | WEB-OK |
| DW-CLT-C05 | Direcciones | 2/2 sin truncar | WEB-OK |
| DW-CLT-C06 | RIF lista == detalle | `J987654321` == `J987654321` | WEB-OK |
| DW-CLT-C07 | Coordenada | exacta | WEB-OK |
| DW-CLT-C08 | Adjuntos/firma del móvil | móvil mandó `nu_attachments:0`; web: ambos botones **deshabilitados**, sin firma → coherente | WEB-OK |
| DW-CLT-C09 | Trampa `Web:` vacío | devolvió `''`, no `"Contacto"` | WEB-OK |
| DW-CLT-C10 | Estatus de aprobación | **la web no lo expone** — ni columna en lista ni campo en detalle. `st_potential_client=2` no verificable | WEB-N/A |
| DW-CLT-F01 | Filtro Vendedor | `NEIMY PARRA` → 2 filas (Refs 4, 3), ambas Vendedor=NEIMY | WEB-OK |
| DW-CLT-F02 | Rango de fechas | `20/07–25/07` → Refs 2 (25/07) y 1 (20/07). Ninguno fuera. **Límites inclusivos en ambos extremos** | WEB-OK |
| DW-CLT-F03 | `Limpiar` | 🔴 **DEFECTO** — ver hallazgo #2 | WEB-FIELD-MISMATCH |
| DW-CLT-F04 | Vendedor + rango = intersección | `NEIMY PARRA` ∩ `20/07–25/07` → **0 registros**. Unión habría dado 4 ⇒ es intersección | WEB-OK |
| DW-CLT-F05 | `Tiene Adjunto` | 🔴 **DEFECTO** — ver hallazgo #3 | WEB-FIELD-MISMATCH |
| DW-CLT-F06 | Ausencia de filtro `# Ref` | Confirmado: filtros = Empresa, Vendedor, Desde, Hasta, Tiene Adjunto. **Limitación de la web**, no fallo | WEB-OK |
| DW-CLT-M01 | Los registros aparecen con rango que los abarca | 4/4 (fechas vacías = sin acotar) | WEB-OK |
| DW-CLT-M02 | RIF lista == origen | Sin GRANT no hay BD ⇒ contrastado **lista ↔ detalle**: 4/4 idénticos | WEB-OK (parcial, sin BD) |
| DW-CLT-M03 | 5 detalles sin truncar | El universo son **4** (< 5): los 4 leídos. El más largo (Ref 1, Dirección Entrega, 137 car.) se muestra **completo** | WEB-OK (universo < 5) |
| DW-CLT-M04 | Consistencia lista ↔ detalle | 4/4 en nombre, RIF, vendedor, responsable y fecha | WEB-OK |
| DW-CLT-M05 | RIF duplicados | 0 duplicados entre los 4 potenciales. Contraste contra tabla `client` **no evaluable sin GRANT** | WEB-OK (parcial) |
| DW-CLT-D01 | Paginación | 4 registros, 50 por página ⇒ sin paginador. Falta de volumen | WEB-N/A |
| DW-CLT-D02 | Ordenamiento | 🔴 **DEFECTO** — ver hallazgo #1 | WEB-FIELD-MISMATCH |
| DW-CLT-D03 | Selector `Columnas` | Lista las 7 columnas; al desmarcar `Responsable`, `th` y `td` pasan a `display:none`; al remarcar, vuelve | WEB-OK |
| DW-CLT-D04 | Lista vacía | `"No se encontraron registros."`, sin error ni traza | WEB-OK |
| DW-CLT-D05 | Mapa no bloquea | Tiles de Google cargaron; la lectura de cabecera no depende del mapa | WEB-OK |
| DW-CLT-A01 | Descarga dispara | `download` capturado, `failure()` = `null`, `200 application/zip` | WEB-OK |
| DW-CLT-A02 | Patrón del nombre | 🆕 **`cliente_<ref>.zip`** → `cliente_3.zip` (en cobros es `cobro_<ref>.zip`) | WEB-OK |
| DW-CLT-A03 | Es ZIP real | magic `50 4B 03 04` (`PK\x03\x04`), **148.057 bytes**, no HTML, no 0 bytes | WEB-OK |
| DW-CLT-A04 | Contenido == lo que lista la web | 3 entradas — ver aritmética | WEB-OK |
| DW-CLT-A05 | Nombres 1:1 | `3_0.jpeg`, `3_1.jpeg` == los 2 de la galería. `3_0.pdf` **no** aparece en la galería (la galería solo muestra imágenes) | WEB-OK (con nota) |
| DW-CLT-A06 | Firma fuera del ZIP | El registro **sí** tiene firma (`/denario/resources/images/firmas/clientes/3_0.jpg`, 280×220) y **no** viene en el ZIP → **mismo comportamiento que cobros**, confirmado en 2º módulo | WEB-OK |
| DW-CLT-A07 | Transacción sin adjuntos | Ref 4: los botones **existen pero están `disabled`** (no desaparecen). Coherente con `has_attachments:false` del móvil | WEB-OK |
| DW-CLT-A08 | `Ver adjuntos` | Abre `form:galeriaDLG` (PrimeFaces Galleria, no `ui-dialog`) con 2 ítems, sin romper la vista | WEB-OK |

### Aritmética explícita

El módulo **no maneja montos** ⇒ no hay oráculo de conversión/total. Los cálculos verificables son de **conteo**:

1. **Partición del filtro de adjuntos (consistencia interna):**
   `SI = 3` (Refs 3,2,1) `+` `NO = 1` (Ref 4) `= 4` `==` total sin filtro `= 4` ✅ la partición cierra.
2. **Contradicción del mismo filtro contra el detalle (hallazgo #3):**
   `SI = 3` registros, pero con adjuntos reales (botón habilitado) = **1** (solo Ref 3) → `3 − 1 = 2` **falsos positivos**.
   Calibración del oráculo "botón habilitado ⇔ tiene adjuntos": Ref 4 tiene `nu_attachments:0` en el móvil y sale `disabled`; Ref 3 sale habilitado y su ZIP trae 3 archivos. El indicador es fiable en ambos sentidos.
3. **Contenido del ZIP (Ref 3):**
   `2 imágenes` (galería web: `3_0.jpeg`, `3_1.jpeg`) `+ 1 documento` (`3_0.pdf`, no listado en galería) `= 3 entradas` == entradas reales del ZIP ✅
   Bytes sin comprimir: `93.205 + 90.227 + 9.120 = 192.552` → comprimido `148.057` (76,9 %; coherente: los JPEG casi no comprimen).
4. **Firma excluida:**
   archivos del registro `= 3 (ZIP) + 1 (firma 3_0.jpg) = 4`, pero el ZIP trae `3` ⇒ la firma queda fuera, igual que en cobros.
5. **Intersección de filtros (F04):**
   `NEIMY PARRA = {4,3}` ∩ `20/07–25/07 = {2,1}` `= ∅` → 0 filas. Una unión habría dado 4.

### 🔴 Hallazgos

**#1 — El ordenamiento de la lista no ordena (DW-CLT-D02).**
Se hicieron 3 clics sobre `# Ref` y 1 sobre `Fecha`. El indicador `aria-sort` cambia correctamente (`ascending` ↔ `descending`) y cada clic dispara un `POST` que responde `200`, pero **las filas nunca se reordenan**: quedan siempre `4,3,2,1`. Con `aria-sort="ascending"` en `# Ref` se esperaba `1,2,3,4`; se muestreó el DOM durante 3 s (12 muestras cada 250 ms) y no hubo cambio en ningún momento — no es una carrera del ajax. Igual en `Fecha` ascendente: sigue 29/07 → 20/07. El único error de consola es de un plugin de charts servido por CDN, ajeno a esto. ⇒ **El servidor recibe el orden y devuelve el conjunto sin ordenar.** Con 4 registros es cosmético; con volumen real vuelve la lista inmanejable.

**#2 — `Limpiar` deja un filtro vivo (DW-CLT-F03).**
Con `Tiene Adjunto = NO` aplicado, `Limpiar` **sí** vacía Desde/Hasta pero **no** restablece `Tiene Adjunto`, que queda en `NO`. Al pulsar `Buscar` acto seguido, la lista sigue mostrando **1 de 4** registros. El usuario cree estar viendo el total y está viendo un subconjunto, sin ninguna señal visual de que hay un filtro activo. Es el caso "un número que da de menos".

**#3 — `Tiene Adjunto = SI` devuelve registros sin adjuntos (DW-CLT-F05).**
`SI` → Refs **3, 2, 1**. Al abrir los tres detalles: solo la Ref 3 tiene adjuntos (botones habilitados, ZIP con 3 archivos). En **Ref 2** y **Ref 1** los botones `Descargar Adjunto` y `Ver adjuntos` están **`disabled`** y no hay ninguna imagen bajo `/denario/resources/images/` — ni adjuntos ni firma. ⇒ **2 falsos positivos de 3**; la web se contradice a sí misma entre la lista y el detalle. (Lectura alternativa descartada: no es que el filtro cuente firmas, porque Ref 2 y Ref 1 tampoco tienen firma.)

> ⚠ **Nota de vocabulario:** F03, F05 y D02 son **defectos de comportamiento de la web**, no diferencias de dato del móvil. Se marcan `WEB-FIELD-MISMATCH` por ser la única marca de fallo aplicable (`WEB-CALC-MISMATCH` está excluida en este módulo por no haber montos). Re-etiquetar si el vocabulario incorpora una marca de comportamiento.

### Limitaciones de esta corrida
- **Sin GRANT en la nube** ⇒ M02 y M05 quedaron a medias: el contraste RIF-contra-BD y "RIF que ya existe en `client`" no se pudieron ejecutar. El oráculo usado fue la propia web (lista ↔ detalle ↔ galería), que es más débil pero detectó igual los 3 hallazgos.
- Universo de 4 registros: paginación no ejercitable y M03 pedía 5 detalles.
- 🔴 El ZIP descargado (`cliente_3.zip`, adjuntos reales de producción) fue **borrado de las 2 ubicaciones**; barrido posterior del repo: sin residuos.

---

## WEB · PEDIDOS

**Playa verificada:** `denarioislacoche.ddns.net:8080` · `/pages/pedidos` · Empresa `LATINOCOSMETICA C.A.` (opción única en el `<select>`) → `verificarContexto(...,'pedidos',false,'isla_coche').ok = true`
**Gate BD:** `gatePorBD('BD-N/A', {refServidor:'123'})` → `{evaluar:true, via:'ref-servidor'}`
**Universo:** 123 pedidos (refs 1–123, sin huecos ni duplicados), todos en **US$**, tasa única **737,2321 BSD = 1 $**.
**Read-only:** solo `Consultar`, `Buscar`, `Limpiar`, `Columnas`, paginación, ordenamiento y `Descargar/Ver adjuntos`. **No** se tocó `Nuevo Pedido`, `Copiar` ni ningún submit.

### A) El pedido creado por el móvil — Ref 123

| Campo | Móvil (manifiesto) | Web | Veredicto |
|---|---|---|---|
| Nro. Ref | 123 | `No. de Ref.: 123` | ✅ |
| Epoch `co_order` | 1785347664353.0 | `Código pedido: 1785347664353.0` | ✅ |
| Cliente | ANNELI CA (co 13) | `ANNELI CA` / `Codigo del cliente: 13` | ✅ |
| Vendedor | NEIMY PARRA | `NEIMY PARRA` | ✅ |
| Empresa | co 00001 | `LATINOCOSMETICA C.A.` | ✅ |
| Fecha pedido | 2026-07-29 14:00:23 | `29/07/2026 14:00:23` | ✅ (mismo día **y** misma hora) |
| Fecha despacho | 2026-07-31T04:00:00 | `31/07/2026` | ✅ por día |
| Comentario | Test-PED-SMOKE-135551 | `Test-PED-SMOKE-135551` | ✅ |
| Coordenada | 11.0490588,-63.8649817 | `11.0490588,-63.8649817` | ✅ exacta |
| `st_order=1` | — | Estatus **`Enviado`** · `¿Por Aprobar?: NO` | ✅ (se reporta lo que muestra la web) |
| Producto | 3058 BELOTTI ACOND CEBOLLA X 300 ML | `3058` / mismo nombre | ✅ |
| Cantidad | 2 UND | `2 UNIDAD` | ✅ (enriquecido) |
| Lista precio | co 013058 | `01 - DETAL` | ✅ (enriquecido) |
| Cond. pago | co `1` | `CREDITO` | ✅ (enriquecido) |
| Tipo pedido | id 2 | `PEDIDO ESTANDAR` | ✅ |
| Almacén (co `01`) | presente en móvil | **la tabla de líneas no expone columna Almacén** | ⓘ no comparable |

`cotejarCampos(movil, web, {fechas:['Fecha del pedido','Fecha de despacho'], numeros:[...]})` → **0 diffs, 0 notas**.

#### 🧮 Aritmética explícita — Ref 123 (tasa T = 737,2321)

| Oráculo | Cálculo | Web | ✔ |
|---|---|---|---|
| Base = cant × precio | 2 × 5,2328 = **10,4656** → 10,47 | `Monto Base Pedido 10,47 $` | ✅ |
| IVA unitario | 5,2328 × 0,16 = **0,837248** → 0,84 | `IVA 16.0% : 0,84 $` | ✅ |
| Importe+IVA unit. | 5,2328 + 0,837248 = **6,070048** → 6,07 | `Importe + IVA: 6,07 $` | ✅ |
| Subtotal línea | 2 × 6,070048 = **12,140096** → 12,14 | `Subtotal: 12,14 $` | ✅ |
| **Base + IVA = Total** | 10,4656 + 1,674496 = **12,140096** → 12,14 | `Monto Total Pedido 12,14 $` | ✅ |
| Σ líneas = Total | 12,14 = 12,14 | ✅ | ✅ |
| Subtotal bruto − Desc.bonif. = Base | 10,47 − 0,00 = 10,47 | ✅ | ✅ |
| Conv. **US$→BS multiplica** total | 12,140096 × 737,2321 = **8.950,07** | `8.950,07 BSD` | ✅ |
| Conv. base | 10,4656 × 737,2321 = **7.715,58** | `7.715,58 BSD` | ✅ |
| Conv. IVA (cabecera) | 1,674496 × 737,2321 = **1.234,49** | `1.234,49 BSD` | ✅ |
| Conv. precio base (línea) | 5,2328 × 737,2321 = **3.857,79** | `3.857,79 BSD` | ✅ |
| **Conv. IVA (línea)** | 0,837248 × 737,2321 = **617,25** | `308,62 BSD` | ❌ **= 617,25 ÷ 2 (la cantidad)** |
| **Conv. Importe+IVA (línea)** | 3.857,79 + 617,25 = **4.475,03** | `4.166,41 BSD` | ❌ (arrastra el IVA errado) |

> ⚠ Se recalculó desde el precio crudo del payload (`nu_price_base = 5,2328`), no desde el precio presentado: la diferencia **no** es redondeo de 1 céntimo, es un factor entero.

**Veredicto Ref 123: `WEB-CALC-MISMATCH`** — todos los campos y todos los totales de cabecera cuadran; falla únicamente el sub-bloque de conversión de la **línea**.

### 🔴 Defecto D1 — IVA convertido de la línea dividido entre la cantidad

Reproducido en **5/5 líneas de 3 pedidos distintos**, con factor **exactamente igual a la cantidad pedida**:

| Pedido | Línea | Cant. | IVA unit. US$ | Conv. correcto (×737,2321) | Web muestra | Factor |
|---|---|---|---|---|---|---|
| 123 | 3058 | 2 | 0,837248 | 617,25 | **308,62** | ÷2 |
| 121 | CER2074 | 7 | 1,60 | 1.179,57 | **168,51** | ÷7 |
| 121 | 3055 | 12 | 0,463472 | 341,69 | **28,47** | ÷12 |
| 121 | 3057 | 5 | 3,68 | 2.713,01 | **542,60** | ÷5 |
| 122 | 3059 | 4 | 0,75 | 552,92 | **138,30** | ÷4 |

- **Fórmula observada:** `IVA_conv_mostrado = (IVA_unitario_US$ × tasa) ÷ cantidad`. Lo correcto es sin dividir.
- **Arrastre:** `Importe + IVA` conv. = `precio_base_conv + IVA_conv_errado` en los 5 casos.
- **Incoherencia interna comprobable sin BD:** en el bloque US$ `Importe+IVA × cant = Subtotal` (6,07 × 2 = 12,14 ✅); en el bloque convertido **no** (4.166,41 × 2 = 8.332,82 ≠ 8.950,07 ❌).
- **Alcance acotado:** cabecera del detalle ✅, lista ✅ (**123/123 filas** cumplen `Monto Total × Tasa = Monto conv.`), `Subtotal` conv. de la línea ✅. **Solo** fallan `IVA 16.0%` e `Importe + IVA` de la columna `Monto conv.`.

### 🟡 Defecto D2 — `Limpiar` no restablece el filtro "Tiene Adjunto"

Reproducido **2/2** (con `SI` y con `NO`). Tras `Limpiar`: el control sigue en su valor y el listado sigue filtrado (40 y 83 filas resp., en vez de 123), **sin ninguna indicación visual**.

| Control | ¿`Limpiar` lo restablece? |
|---|---|
| `# Ref` · Vendedor · Fechas · Status | ✅ sí |
| **Tiene Adjunto** | ❌ **no** |

> **Patrón sistémico:** 2.º módulo de esta corrida donde `Limpiar` deja controles pegados (también en clientes potenciales). Riesgo real: el usuario cree ver el universo completo.
> **En cambio, el ordenamiento SÍ funciona en pedidos** (D02/D03) → el defecto de ordenamiento de clientes potenciales **no** es sistémico.

### 🟢 D3 — Formato de decimales inconsistente en la línea del detalle
`IVA 16.0% : 1,6 $` · `Importe + IVA: 11,6 $` · `542,6 BSD` · `138,3 BSD` · `3.595,7 BSD` → **1 decimal**, contra 2 decimales en todo el resto de la pantalla.

### 🟢 D4 — El filtro `Moneda` viene preseleccionado en `$`
Al cargar la página y tras `Limpiar`, `Moneda` queda en `$` (no en la opción neutra). Hoy no oculta nada (los 123 pedidos son US$), pero ocultaría pedidos en BSD si existieran.

### B) Casos del guión

| Caso | Verifica | Evidencia | Marca |
|---|---|---|---|
| DW-PED-C01 | Presencia por `# Ref` | 1 fila exacta, ref 123 | WEB-OK |
| DW-PED-C02 | Doble llave Ref + epoch | 123 + 1785347664353.0 | WEB-OK |
| DW-PED-C03 | Cabecera | `cotejarCampos` 0 diffs | WEB-OK |
| DW-PED-C04 | `¿Por Aprobar?` / Estatus | `NO` / `Enviado` | WEB-OK |
| DW-PED-C05 | Líneas | prod/unid/precio/subtotal/lista ✅; almacén no expuesto | WEB-OK |
| DW-PED-C06 | `Total items` == nº líneas == `nu_details` | 1 == 1 == 1 | WEB-OK |
| DW-PED-C07 | Σ líneas == Monto Total | 12,14 == 12,14 | WEB-OK |
| DW-PED-C08 | Línea = cant × precio | 2 × 6,070048 = 12,140096 | WEB-OK |
| DW-PED-C09 | Conversión | cabecera ✅ · **línea ❌ (÷cantidad)** | **WEB-CALC-MISMATCH** |
| DW-PED-C10 | Σ conv. líneas == Monto conv. | 8.950,07 == 8.950,07 | WEB-OK |
| DW-PED-C11 | Bruto − Desc.bonif. == Base | 10,47 − 0,00 = 10,47 | WEB-OK |
| DW-PED-C12 | Enriquecimiento código→descripción | `1`→CREDITO · UND→UNIDAD · 013058→`01 - DETAL` | WEB-OK (nota) |
| DW-PED-F01 | `# Ref` existente | 1 fila, la correcta | WEB-OK |
| DW-PED-F02 | `# Ref` inexistente (999999) | 0 filas, "No se encontraron registros.", sin error | WEB-OK |
| DW-PED-F03 | `Limpiar` tras F01 | `# Ref` vacío, vuelve a 123 filas | WEB-OK |
| DW-PED-F03b *(nuevo)* | `Limpiar` restablece **todos** los controles | **"Tiene Adjunto" queda pegado (2/2)** | **WEB-FIELD-MISMATCH** |
| DW-PED-F04 | Vendedor (NEIMY PARRA) | 6 filas, 100 % del vendedor | WEB-OK¹ |
| DW-PED-F05 | Rango de fechas (29/07–29/07) | 3 filas, ninguna fuera de rango | WEB-OK |
| DW-PED-F06 | Status (Procesado) | 3 filas, todas `Procesado` | WEB-OK |
| DW-PED-F07 | Tipo Pedido (Promotor) | 41 filas, todas `Promotor`; incluye 122, excluye 123 | WEB-OK |
| DW-PED-F08 | Cliente (ANNELI CA) | 1 fila = ref 123 | WEB-OK |
| DW-PED-F09 | Moneda | los 123 pedidos son `$`: sin contraste posible | WEB-N/A |
| DW-PED-F10 | Tiene Adjunto | SI=40 · NO=83 · **40+83=123** ✅; ref 123 solo en `NO`, coherente con botones disabled | WEB-OK |
| DW-PED-F11 | Vendedor **+** fechas | 3 filas = **intersección** exacta (123,122,121) | WEB-OK |
| DW-PED-M01/M02/M03 | Muestreo contra BD | BD nube sin GRANT | WEB-N/A |
| DW-PED-M04 | Σ líneas == total en varios detalles | 123, 121, 122 → 3/3 cuadran | WEB-OK |
| DW-PED-M05 | Consistencia lista ↔ detalle | 123, 121, 122 → base/total/conv/items idénticos | WEB-OK |
| DW-PED-M06 *(nuevo)* | Conversión a nivel lista sobre el universo | **123/123** cumplen `Total × Tasa = conv.` | WEB-OK |
| DW-PED-D01 | Paginación | pág.1 refs 123–74 · pág.2 refs 73–24 · 0 solapamiento, contigua | WEB-OK |
| DW-PED-D02 | Orden por `# Ref` | 1,2,3…50 → **numérico**, no lexicográfico | WEB-OK |
| DW-PED-D03 | Orden por Monto Total y Fecha | 2,03→178,20 ✅ · 20/07 11:18→22/07 16:43 ✅ | WEB-OK |
| DW-PED-D04 | Selector `Columnas` | oculta `Tasa conv.` (14→13) sin descolocar datos; restaura | WEB-OK |
| DW-PED-D05 | Lista vacía | mensaje de vacío, sin error ni tabla rota | WEB-OK |
| DW-PED-D06 | Ida y vuelta lista→detalle→volver | conserva filtro y resultado | WEB-OK |

¹ conteo no contrastado contra SQL (sin GRANT); se verificó homogeneidad total del conjunto.

### C) Adjuntos (`A##`) — pedido **121**

| Caso | Verifica | Resultado | Marca |
|---|---|---|---|
| DW-PED-A01 | Dispara la descarga | evento capturado en **276 ms**, `download.failure() = null` | WEB-OK |
| DW-PED-A02 | Patrón del nombre | **`pedido_<ref>.zip`** → `pedido_121.zip` | WEB-OK |
| DW-PED-A03 | ZIP real | magic `50 4B 03 04` · **144.261 bytes** · no HTML, no 0 bytes | WEB-OK |
| DW-PED-A04 | Nº entradas vs BD | **3 entradas**: `121_0.jpeg`, `121_1.jpeg`, `121_0.pdf`. Sin GRANT no se pudo contar `transaction_image`+`transaction_files` | WEB-N/A |
| DW-PED-A05 | Nombres de entradas | galería lista `121_0.jpeg`+`121_1.jpeg` → coinciden 1:1 con el ZIP | WEB-OK |
| DW-PED-A06 | Firma no viene en el ZIP | ninguna entrada con aspecto de firma (2 img + 1 pdf), consistente con cobros; no verificable sin BD | WEB-N/A |
| DW-PED-A07 | Transacción **sin** adjuntos (ref 123, `nu_attachments=0`) | **ambos botones presentes pero `disabled=true`** → esperado definido | WEB-OK |
| DW-PED-A08 | `Ver adjuntos` abre el visor | galería `form:galeriaDLG` abre y cierra sin romper la vista | WEB-OK |

🔑 **Oráculo confirmado también en pedidos:** el ZIP trae `transaction_image` + `transaction_files`; **la galería lista solo imágenes** (2) y el `.pdf` no aparece → **contar solo la galería subestima** (2 vs 3).
🔴 ZIP y adjuntos **borrados del disco** tras la verificación (0 archivos residuales).

---

## WEB · Módulo COBROS — isla_coche · LATINOCOSMETICA C.A. (co 00001)

**Playa verificada:** `verificarContexto({host:'denarioislacoche.ddns.net:8080', pathname:'/DenarioPremium/pages/cobros'}, 'cobros', false, 'isla_coche').ok = true`
**Oráculo secundario:** el `<select>` de empresa del filtro trae **una sola opción** — `LATINOCOSMETICA C.A.` ✅
**Sin BD:** nube de latino_cosmetica sin GRANT ⇒ todo caso que exige SQL va `WEB-N/A`. Oráculo usado: **coherencia interna lista ↔ detalle ↔ galería ↔ aritmética**.
**Sin manifiesto de cobros** (módulo móvil cancelado por `requiredCollectionAttachments=true`) — su ausencia no se reporta como hallazgo.

### Refs elegidas y criterio

Filtro **fecha 29/07/2026 → 29/07/2026** con **Moneda en neutro** → **exactamente 5 cobros, todos de NEIMY PARRA**:

| # Ref | Fecha | Tipo | Importe (lista) | Cliente | Estatus (literal web) |
|---|---|---|---|---|---|
| **102** | 29/07 13:04:33 | IGTF | 5.308,07 BSD | 1.000 Y UNA BELLEZA, C.A. | Por aprobar |
| **101** | 29/07 12:29:02 | Retención | *(celda vacía)* / total 1.200,00 BSD | A DOLAR BOUTIQUE CA | Por aprobar |
| **100** | 29/07 12:24:36 | Anticipo/Prepago | 1.000,00 BSD | 1.000 Y UNA BELLEZA, C.A. | Por aprobar |
| **99** | 29/07 11:47:19 | Cobros | 200,00 $ + 40,00 $ | 1.000 Y UNA BELLEZA, C.A. | Por aprobar |
| **98** | 29/07 10:41:52 | Retención | *(celda vacía)* / total 550,00 BSD | A DOLAR BOUTIQUE CA | Por aprobar |

**Criterio y evidencia de que son los de QA:**
1. Son los 5 cobros **más recientes** del sistema (Refs 98–102, tope de la secuencia).
2. **Todos** del vendedor esperado **NEIMY PARRA**; ninguno de otro vendedor cae en el día.
3. El filtro **Vendedor = NEIMY PARRA sobre 01/07–29/07** devuelve **estas mismas 5 y nada más**.
4. Cubren **4 tipos distintos** (Cobros, Anticipo, Retención ×2, IGTF) — consistente con un envío manual de prueba.
5. Los 5 **tienen adjuntos**.

**Excluido:** **Ref 97** (28/07/2026 16:03:49, **VANESSA VILLALONGA**, 260,81 $) — otro vendedor, otro día.

🔴 **Trampa de descubrimiento que casi ocultó un cobro:** al entrar, el filtro **Moneda viene preseleccionado en `BSD`** (`monedaRaw="2"`). Con ese default **Ref 99 no aparece** (está en `$`). Hay que **neutralizar Moneda** antes de dar por cerrado el universo del día.

**Tasa vigente:** la web **muestra** `737,23` pero **calcula con `737,2321`**. Toda la aritmética de abajo cuadra al céntimo con 737,2321; con el valor mostrado da falsos mismatch (Ref 99: `240 × 737,23 = 176.935,20` vs `176.935,70` mostrado — 0,50 BSD de desvío).

---

### Cotejo por registro, con aritmética explícita

#### Ref 102 · IGTF · BSD → `WEB-OK`
Cabecera: base `5.308,07 BSD` → `7,20 $` · dcto `0,00` · IGTF `0,00` · **Total a pagar `5.308,07 BSD` → `7,20 $`** · tasa `737,23`
Pagos (1): `Prepago Automático` · BANCO DEL TESORO · doc `1234_igtf` · `5.308,07 BSD` → `7,20 $`
Documentos (1): `IGTF` · `IGTF-1785340041060.0` · monto `5.308,07` · saldo `5.308,07` · a pagar `5.308,07` · faltante `0,00`

| Cálculo | Aritmética | Resultado |
|---|---|---|
| Σ pagos == monto cobro | `5.308,07 == 5.308,07` | ✅ |
| Σ(a pagar docs) == monto cobro | `5.308,07 == 5.308,07` | ✅ |
| Conversión cabecera (**BS→$ divide**) | `5.308,07 / 737,2321 = 7,20026` → `7,20` | ✅ |
| Conversión línea pago | `5.308,07 / 737,2321` → `7,20` | ✅ |
| Conversión línea doc (monto y saldo) | `5.308,07 / 737,2321` → `7,20` y `7,20` | ✅ |
| base − dcto + IGTF == total | `5.308,07 − 0,00 + 0,00 = 5.308,07` | ✅ |
| Diferencia cobro | `5.308,07 − 5.308,07 = 0,00` | ✅ |
| **Trazabilidad IGTF** | `240,00 $ (Ref 99) × 3,00% = 7,20 $`; `7,20 × 737,2321 = 5.308,07 BSD` | ✅ exacto |

Lista ↔ detalle: monto, moneda, estatus (`Por aprobar`) y fecha **coinciden** ✅

#### Ref 101 · Retención · BSD → 🐞 `WEB-CALC-MISMATCH`
Cabecera: base `255.310,85 BSD` → `346,31 $` · Ret IVA `1.000,00` → `1,36 $` · Ret ISLR `200,00` → `0,27 $` · **Total Monto a pagar `0,00 BSD` → `0,00 $`**
Pagos: **0 filas** ("No se encontraron registros.") ✅ esperado en `co_type=2`
Documento: tipo `03` · Nro Factura `1984` · 15/07/2026 · monto `255.310,85` · saldo `255.310,85` · **a pagar `1.200,00`** · Doc Retención `88888888888885` (**14 dígitos** ✅) · Fecha Comprobante 20/07/2026 · IVA `1.000,00` · ISLR `200,00` · faltante `0,00`

| Cálculo | Aritmética | Resultado |
|---|---|---|
| Ret IVA + Ret ISLR == a pagar línea | `1.000,00 + 200,00 = 1.200,00` | ✅ |
| **Total a pagar cabecera == a pagar línea** | `0,00 ≠ 1.200,00` | 🐞 **falta el 100 %** |
| **Lista ↔ detalle** | lista `Total por cobrar 1.200,00 BSD` vs detalle `0,00 BSD` | 🐞 |
| Conv base | `255.310,85 / 737,2321 = 346,3128` → `346,31` | ✅ |
| Conv Ret IVA | `1.000 / 737,2321 = 1,35643` → `1,36` | ✅ |
| Conv Ret ISLR | `200 / 737,2321 = 0,271287` → `0,27` | ✅ |
| Conv del total (lista) | `1.200 / 737,2321 = 1,62762` → `1,63` == `Monto conv.` de la lista | ✅ |
| Coherencia de céntimos | `1,36 + 0,27 = 1,63` | ✅ |

**Prueba de que el valor real es 1.200,00 y el `0,00` es el bug:** (i) la **lista** muestra `1.200,00` y su conversión `1,63 $`; (ii) `Diferencia cobro = 0,00` — si el monto cobrado fuese realmente 0, la diferencia debería ser `1.200,00`.

#### Ref 98 · Retención · BSD → 🐞 `WEB-CALC-MISMATCH` (2/2 retenciones)
Cabecera: base `255.310,85` → `346,31 $` · Ret IVA `500,00` → `0,68 $` · Ret ISLR `50,00` → `0,07 $` · **Total Monto a pagar `0,00 BSD`**
Pagos: **0 filas** ✅ · Documento: `03` · `1984` · a pagar **`550,00`** · Doc Retención `12345612345685` (14 ✅) · Comprobante 29/07/2026 · IVA `500,00` · ISLR `50,00` · faltante `0,00`

| Cálculo | Aritmética | Resultado |
|---|---|---|
| Ret IVA + Ret ISLR == a pagar línea | `500,00 + 50,00 = 550,00` | ✅ |
| **Total a pagar cabecera** | `0,00 ≠ 550,00` | 🐞 |
| **Lista ↔ detalle** | lista `550,00 BSD` vs detalle `0,00 BSD` | 🐞 |
| Conv Ret IVA / ISLR | `500/737,2321 = 0,678` → `0,68` · `50/737,2321 = 0,0678` → `0,07` | ✅ |
| Conv del total (lista) | `550/737,2321 = 0,74604` → `0,75`; y `0,68 + 0,07 = 0,75` | ✅ |

Nota de trazabilidad: `Responsable = am` (los otros 4 cobros: `gv`).

#### Ref 100 · Anticipo/Prepago · BSD → `WEB-OK`
Cabecera con **estructura propia** (sin bloque base/retenciones/total): `Monto pagado 1.000,00 BSD` → `1,36 $` · tasa `737,23`
Pagos (1): `Deposito` · BANCO DEL TESORO · doc `12345` · `1.000,00 BSD` → `1,36 $`
**Tabla de documentos ausente** ✅ (`co_type=1` no aplica documentos)

| Cálculo | Aritmética | Resultado |
|---|---|---|
| Σ pagos == Monto pagado | `1.000,00 == 1.000,00` | ✅ |
| Conversión cabecera y línea | `1.000 / 737,2321 = 1,35643` → `1,36` (ambas) | ✅ |
| Lista ↔ detalle | `1.000,00 BSD` / `1,36 $` / `Por aprobar` / 29/07 12:24:36 | ✅ |

#### Ref 99 · Cobros · **$** → `WEB-OK` en aritmética · 2 defectos de presentación
Cabecera: base `260,81 $` → `192.277,50 BSD` · dcto `10,00 $` → `7.372,32` · Ret IVA `6,00 $` → `4.423,39` · Ret ISLR `4,00 $` → `2.948,93` · IGTF `0,00 $` · **Total a pagar `240,00 $` → `176.935,70 BSD`**
Pagos (2): `Pago Movil` · VENEZOLANO DE CRÉDITO · cta `4019076526` · doc `123456` · `40,00 $` → `29.489,28 BSD` — `Efectivo` · doc `efect1` · `200,00 $` → `147.446,42 BSD`
Documento: `03` · `1868` · 07/07/2026 · monto `277,76` · saldo `260,81` · dcto `10,00` · a pagar `240,00` · Doc Retención `12345612345612` (14 ✅) · IVA `6,00` · ISLR `4,00` · **faltante `0,81`**
Descuentos: `1868` · `% - Descuento manual` · `10,00 $` → `7.372,32 BSD` · comentario `desc1_test`

| Cálculo | Aritmética | Resultado |
|---|---|---|
| Σ pagos == Total a pagar | `40,00 + 200,00 = 240,00` | ✅ |
| Σ conversiones de pagos | `29.489,28 + 147.446,42 = 176.935,70` == conv cabecera | ✅ |
| Conversión (**US$→BS multiplica**) | `240 × 737,2321 = 176.935,704` → `176.935,70` | ✅ |
| Conv pago 1 / pago 2 | `40 × 737,2321 = 29.489,28` · `200 × 737,2321 = 147.446,42` | ✅ |
| **Neto con faltante** | `260,81 − 10,00 − 6,00 − 4,00 = 240,81`; `240,81 − 240,00 = 0,81` == faltante | ✅ exacto |
| Conv monto doc | `277,76 × 737,2321 = 204.773,58` vs `204.773,59` | ✅ (0,01, tolerancia) |
| Conv saldo doc | `260,81 × 737,2321 = 192.277,51` vs `192.277,50` | ✅ (0,01, tolerancia) |
| Conv descuento | `10 × 737,2321 = 7.372,32` | ✅ |
| Conv Ret IVA / ISLR | `6 × 737,2321 = 4.423,39` · `4 × 737,2321 = 2.948,93` | ✅ |
| **Enlace al depósito** | Depósito Ref `1` · 29/07 13:14:55 · banco `039` · cta `9999999999` · NEIMY PARRA · `240,00 $`; **2 líneas hijas, ambas `N° Ref cobro = 99`**: `40,00 + 200,00 = 240,00` == Monto depositado | ✅ |

Lista ↔ detalle: `200,00 $ 40,00 $` / total `240,00 $` / dif `0,00 $` / conv `176.935,70 BSD` / `Por aprobar` / 29/07 11:47:19 — **todo coincide** ✅

---

### 🔴 Defectos encontrados

| # | Defecto | Refs / alcance | Marca | Evidencia |
|---|---|---|---|---|
| **1** | 🐞 **`Total Monto a pagar` = 0,00 en cobros de Retención** — la cabecera del detalle parece calcular Σ(pagos), y una retención no tiene pagos | **101** (real 1.200,00) y **98** (real 550,00) — **2/2 retenciones** | `WEB-CALC-MISMATCH` | La **lista** muestra el valor correcto y su conversión; `Diferencia cobro = 0,00` sólo es coherente con el valor real. Reconfirmado con lectura DOM dirigida. **Reproducido en Isla Coche/LATINOCOSMETICA ⇒ no depende de playa ni cliente** (antes visto en La Tortuga: 12,00 → 0,00) |
| **2** | 🐞 **`Limpiar` no restablece "Tiene Adjunto"** — queda pegado y el listado sigue filtrado sin señal visual | módulo cobros (**3.º de 3 módulos**) | `WEB-FIELD-MISMATCH` | Con `NO` en 01/07–29/07: **0 filas**. Tras `Limpiar`: **sigue 0 filas** y el control sigue en `NO` (`value=2`), con **fechas idénticas** al estado neutro que da **50 filas**. **En cobros es más severo: deja la pantalla vacía.** La propia automatización quedó atrapada por él a mitad de la corrida |
| **3** | 🐞 **Columna mal rotulada en el detalle**: `Descuento conversión` contiene en realidad la conversión de `Diferencia/Faltante` | **99** | `WEB-FIELD-MISMATCH` | `597,16 = 0,81 × 737,2321` (el faltante). El descuento real (`10,00 $`) ya está en `Total dcto. conversion = 7.372,32`. Falta el encabezado `Diferencia/Faltante conversión` |
| **4** | 🐞 **Encoding: `U+FFFD` en datos maestros con acentos** — `VENEZOLANO DE CR�DITO` (debe ser `CRÉDITO`) | **99** (lista, detalle de pagos y detalle de depósito — 3 pantallas) | `WEB-FIELD-MISMATCH` | `charCodeAt` = **65533** en el DOM, con `document.characterSet = "UTF-8"` ⇒ el dato llega mal decodificado, no es artefacto del lector |
| **5** | 🐞 **`Ver cobro original` no lleva al cobro original** | **102** (botón sólo presente en el cobro IGTF) | `WEB-FIELD-MISMATCH` | Desde el IGTF 102 navega a `/pages/protected/cobranzas/detalleCobro.xhtml` mostrando **el mismo Ref 102**, no el cobro padre **99** que lo generó. El botón **no aparece** en 99/101/100/98 ⇒ la intención es enlazar al padre. *(Alternativa: el rótulo significa "ver en la pantalla original/legacy" — en ese caso es un rótulo engañoso.)* |
| **6** | 🐞 **Orden por importe ignora la moneda** | módulo (`Total por cobrar`) | `WEB-FIELD-MISMATCH` | Ascendente: `1,19 BSD < 10,00 $ < 20,00 $ < 30,00 $ < 61,74 BSD < 126,20 $`. `10,00 $` ≈ `7.372 BSD` debería ir muy por encima de `61,74 BSD`. Debería ordenar por el importe convertido |

### ✅ Base del IGTF (Ref 102) — RESUELTO por QA, NO es defecto

**QA confirmó el 29/07/2026: «el IGTF va sobre el TOTAL A PAGAR».**

- Base correcta = `240,00 $` (Total a pagar del cobro Ref 99) → `240,00 × 3 % = 7,20 $` = `5.308,07 BSD`
  ← **es exactamente lo que muestra la web** ⇒ `WEB-OK`.
- La lectura alternativa que se había planteado (3 % sólo sobre los `200,00 $` en efectivo → `6,00 $`) es
  **incorrecta** y queda descartada.

⚠ **Origen de la duda, para que no se repita:** la memoria del proyecto registraba `IGTF efectivo=true`, que
indica **cuándo aplica** el IGTF — no **sobre qué monto** se calcula. Son cosas distintas.

Nota relacionada, tampoco defecto: el cobro padre 99 muestra `Monto total IGTF: 0,00 $` porque el IGTF se
contabiliza como un **cobro aparte** (Ref 102), con el epoch del padre embebido en su `Nro Factura`
(`IGTF-1785340041060.0`).

### Otras observaciones (no defecto)

- **`Monto cobrado` vacío en la lista** para 101 y 98 (Σ pagos sobre 0 filas). Misma causa raíz que el defecto 1, manifestada como celda vacía en vez de `0,00`.
- **Saldo del documento no se reduce entre retenciones:** 98 (10:41, retiene 550) y 101 (12:29, retiene 1.200) aplican al **mismo documento `1984`** y ambos muestran `Saldo doc. 255.310,85`. Coherente con que ambos estén `Por aprobar`.
- **`Pago parcial = NO`** en 101/98 aunque se aplican `550,00` y `1.200,00` sobre un documento de `255.310,85`. Verificar el significado del flag en retenciones.
- **`Limpiar` tampoco devuelve Moneda a su default de carga** (`BSD`): la deja en neutro. Es mejor comportamiento, pero es una inconsistencia entre "estado inicial" y "estado tras Limpiar".
- **`Código cobro` (epoch) no existe en el detalle de cobro.** La única llave es `No. de Ref.`. El epoch sólo asoma indirectamente en el `Nro Factura` del IGTF (`IGTF-1785340041060.0`) ⇒ la doble llave no es evaluable en este módulo.
- **No existe ningún cobro sin adjuntos** en todo 2026 (`Tiene Adjunto = NO` sobre 01/01–29/07 → 0 filas), coherente con `requiredCollectionAttachments=true` ⇒ el esperado "botones deshabilitados" **no se puede probar en este cliente**.

### Adjuntos (A##)

| Ref | Galería | ZIP | Tamaño | Entradas |
|---|---|---|---|---|
| **102** | 2 imgs (`102_0.jpeg`, `102_1.jpeg`) | `cobro_102.zip` (2,0 s) | 144.261 B, magic `50 4B 03 04` | **3**: `102_0.jpeg` (93.205), `102_1.jpeg` (90.227), `102_0.pdf` (5.013) |
| **99** | 2 imgs (`99_0.jpeg`, `99_1.jpeg`) | `cobro_99.zip` (1,7 s) | 144.255 B, magic `50 4B 03 04` | **3**: `99_0.jpeg` (93.205), `99_1.jpeg` (90.227), `99_0.pdf` (5.013) |

- Patrón `cobro_<ref>.zip` ✅ · `download.failure() = null` ✅ · ni 0 bytes ni HTML de error ✅
- **Galería 2 vs ZIP 3 en ambos**: la galería **no lista los `.pdf`** ⇒ contar sólo la galería subestima. La unión galería + PDF == entradas del ZIP ✅
- **Sin firmas en el ZIP** ✅ (coincide con clientes potenciales y pedidos)
- 🔴 Ambos ZIP **borrados del disco**. **Además se borraron 2 residuos de los agentes web previos**: `pedido 121` (144.261 B) y `cliente potencial 3` (148.057 B) — adjuntos reales de producción que habían quedado sin limpiar en `%TEMP%\playwright-artifacts-*`.

### Casos de comportamiento y filtros

| Caso | Resultado |
|---|---|
| F01 `# Ref` existente | 1 fila exacta ✅ |
| F02 `# Ref` inexistente (999999) | 0 filas + "No se encontraron registros.", sin error ✅ |
| F03 `Limpiar` | 🐞 ver defecto 2 |
| F04 Vendedor NEIMY PARRA | 5 filas, todas NEIMY ✅ |
| F05 Rango de fechas | 29/07 → 5 filas; 28/07 → 1 fila (Ref 97), ninguna fuera de rango ✅ |
| F06 Tipo = Retención | 2 filas (101, 98), todas Retención ✅ |
| F07 Tipo = Anticipo/Prepago | 11 filas, todas Anticipo ✅ |
| F08 Status = Aprobado | 33 filas, todas Aprobado ✅ |
| F11 Tiene Adjunto SI/NO | `SI`→5 · `NO`→0 sobre 29/07; coherente ✅ (el defecto está en `Limpiar`, no en el filtro) |
| F12 Vendedor + fechas | NEIMY+28/07 → **0** · NEIMY+29/07 → **5** ⇒ **intersección, no unión** ✅ |
| **F13 (nuevo)** `# Ref` vs Moneda | 🐞 **el filtro `# Ref` ignora el de Moneda**: con `Moneda=BSD` devuelve el Ref 99 (en `$`), y con `Moneda=$` devuelve el Ref 102 (en `BSD`). No intersecta |
| D01 Paginación | 3 páginas × 50; pág. 2 = Refs 51+, sin repetir ni saltar ✅ |
| D02 Orden `# Ref` | **numérico, no textual**: asc → `1,2,3,…,10` ✅ |
| D03 Orden `Fecha Cobro` / importes | Fecha ✅ cronológica; importes 🐞 ver defecto 6. `Monto cobrado` **no es ordenable** (el `th` no reacciona, `aria-sort` no cambia; el `reflowDD` sólo ofrece `# Ref`, `Fecha Cobro`, `Diferencia cobro`, `Total por cobrar`) — es diseño, no fallo |
| D04 Selector `Columnas` | Oculta `Banco receptor` y **los 18 pares encabezado↔valor siguen alineados**; se restaura bien ✅ |
| D05 Lista vacía | Mensaje limpio, sin error ✅ |
| D06 `<select>` "Estatus del Cobro" | **NO se tocó** — control de escritura en producción. Decisión documentada ✅ |

> 🔴 **cobros cae del lado bueno del ordenamiento** (como pedidos, a diferencia de clientes potenciales): el `aria-sort` cambia **y las filas se reordenan de verdad**.

**Resumen del módulo:** 86 casos · **68 WEB-OK** · **4 WEB-CALC-MISMATCH** · **6 WEB-FIELD-MISMATCH** · **18 WEB-N/A** (todos por falta de GRANT o por no existir el dato) · **0 BLOCKED**.

---

## WEB · INVENTARIOS

Playa verificada: `denarioislacoche.ddns.net:8080` → `isla_coche` ✓ · `/pages/inventarios` ✓
Oráculo secundario: el `<select>` de empresa trae **1 sola opción** ("LATINOCOSMETICA C.A.") ✓
Universo: **18 inventarios** (Refs 1–18), sin paginador.

### (A) Los tres inventarios del móvil — gate `BD-N/A` + `refServidor` ⇒ evaluados vía `ref-servidor`

| Ref | Epoch (`Código inventario`) | Fecha web | Cliente | Cant. / Ubicación | Campos cotejados | Diffs | Marca |
|---|---|---|---|---|---|---|---|
| **18** | 1785360333631.0 ✓ | 29/07/2026 17:25:33 ✓ | 13 · ANNELI CA ✓ | **6.00 UNIDAD en Exhibición** ✓ | 10 | 0 | **WEB-OK** |
| **17** | 1785353426119.0 ✓ | 29/07/2026 15:30:26 ✓ | 13 · ANNELI CA ✓ | **6.00 UNIDAD en Exhibición** ✓ | 10 | 0 | **WEB-OK** |
| **16** | 1785350375535.0 ✓ | 29/07/2026 14:39:35 ✓ | 13 · ANNELI CA ✓ | **5.00 UNIDAD en Exhibición** ✓ | 10 | 0 | **WEB-OK** |

Campos cotejados en los 3: `No. de Ref.`, `Código inventario` (doble llave), `Fecha de inventario`,
`Vendedor` (NEIMY PARRA), `Codigo del cliente` (13), `Nombre del cliente`, `Empresa`, `Cod. producto` (3058),
`Producto` (BELOTTI ACOND CEBOLLA X 300 ML), cantidad+unidad por ubicación.
`Depósito` = "-" en los 3 y la cantidad íntegra en `Exhibición` ⇒ **la separación por ubicación se respeta**.

🟢 **Refs 16 y 17 llegaron completas y correctas.** El reinicio de la app que cortó los dos intentos previos
**no perdió nada**: ambos envíos están en el servidor con su epoch exacto, cantidad correcta (5 y 6) y estatus
"Enviado". Las 3 Refs son inventarios independientes, no duplicados de uno solo.

### 🔴 DEFECTO 1 — el detalle de inventario NO muestra Lote ni Fecha de vencimiento

| Caso | Móvil envió | Web muestra | Marca |
|---|---|---|---|
| **DW-INV-C06** (Refs 16·17·18) | lote `QA0729` · venc. `29-07-2026` | **nada** | **WEB-FIELD-MISMATCH** |

> ⚠ **Corrección de marca (29/07/2026).** Estos 3 casos se habían marcado `WEB-MISSING`. Es la marca
> equivocada: `WEB-MISSING` significa **«el registro del móvil no llegó a la web»**, y las Refs 16/17/18
> **sí llegaron** (ver `DW-INV-C01` = `WEB-OK`, con epoch exacto). Lo que falta es un **campo** que la web
> nunca publica ⇒ corresponde `WEB-FIELD-MISMATCH`.
> Importa porque el lector de corridas interpreta `WEB-MISSING` como registro perdido y cerró la corrida
> diciendo *"3 registros no aparecieron en la web"* — falso. El defecto es real, la marca no lo era.

Columnas del detalle: `N° · Cod. producto · Producto · Estructura · Depósito · Exhibición` — **no hay Lote ni
Fecha de expiración**, ni ocultas ni togglables. Búsqueda en **todo el HTML** de la página por
`lote|vencim|expira|batch|QA0729` → **0 coincidencias**. Sin toggler de columnas en el detalle.
Contraste: **Devoluciones sí expone lote y fecha de vencimiento** ⇒ es una carencia específica de inventarios,
no una convención del producto. El dato existe en el móvil y es obligatorio cuando `expirationBatch=true`,
pero **la web no lo publica**: quien audita una toma de inventario no puede verificar el lote.

### 🔴 DEFECTO 2 — `Limpiar` no restablece `Tiene Adjunto` **(4 de 4 módulos)** — y tampoco `Status`

| Paso | Control | Filas | Estado del control |
|---|---|---|---|
| `Tiene Adjunto` = **SI** → `Buscar` | SI | 2 (Refs 14, 1) | SI |
| **`Limpiar`** | — | **2** ❌ | **sigue "SI"** (label *y* `value` del `<select>`) |
| `Tiene Adjunto` = **NO** → `Buscar` | NO | 16 | NO |
| **`Limpiar`** | — | **16** ❌ | **sigue "NO"** |
| Elegir "Tiene Adjunto" a mano → `Buscar` | neutro | 18 ✓ | neutro (único workaround) |

**Marca: WEB-FIELD-MISMATCH (DW-INV-F03b).** Cuarta confirmación consecutiva (clientes potenciales,
pedidos, cobros, inventarios) ⇒ **defecto sistémico de la plantilla de filtros**, no un caso aislado.
Severidad en inventarios: `Limpiar` deja la pantalla en **2 de 18** filas (89 % de los registros ocultos)
sin ninguna señal visual de que sigue filtrando.

🆕 **Hallazgo nuevo que acota el defecto:** `Limpiar` **tampoco restablece `Status`** (queda en "Enviado").
Sí restablece correctamente `# Ref`, `Vendedor`, `Cliente` y las **dos fechas**.
⇒ El fallo golpea a **2 de los 4 `p:selectOneMenu`**, no solo al de adjuntos. Acá quedó enmascarado
porque los 18 registros son "Enviado"; en un módulo con estatus mixtos ocultaría datos igual.

### 🔴 DEFECTO 3 — el ordenamiento por `# Ref` está atado al campo equivocado

| Columna | `aria-sort` | ¿Reordena bien? |
|---|---|---|
| **`# Ref`** | cambia ✓ | ❌ **NO** — el único efecto es mover la fila **Ref 15** |
| `Cliente` | ✓ | ✓ alfabético correcto |
| `Fecha creación` | ✓ | ✓ cronológico exacto (21/07 → 29/07 17:25) |
| `Vendedor` | ✓ | ✓ agrupa CESAR SALAS (4) y NEIMY PARRA (14) |
| `Estatus` | ✓ | no evaluable (los 18 son "Enviado") |

Evidencia (dos pasadas, reproducible):
- `# Ref` **asc** → `15, 1, 2, 3, 4, 5, 6, 7, 8, 10, 9, 11, 12, 13, 14, 16, 17, 18`
- `# Ref` **desc** → `1, 2, 3, …, 16, 17, 18, 15`

Las otras 17 filas **conservan el orden previo intacto en ambos sentidos** ⇒ para el motor de orden todas
**comparan iguales** y solo Ref 15 tiene valor. **Causa raíz identificada:** Ref 15 es el **único inventario
con pedido relacionado** (`Ver Pedido Relacionado: Ref.: 121`); los otros 17 lo tienen nulo. El patrón
NULLS-LAST en `ASC` / NULLS-FIRST en `DESC` de PostgreSQL reproduce exactamente lo observado ⇒ **el `sortBy`
de la columna `# Ref` apunta al id del pedido relacionado, no al Nro.Ref.**

⇒ Inventarios cae del lado "sí reordena" (como pedidos y cobros), **salvo la columna `# Ref`**, que es un
tercer comportamiento distinto: *reordena, pero por el campo incorrecto*.

### 🟠 DEFECTO 4 (menor) — la columna `N°` del detalle imprime siempre "1"

En los detalles con más de una línea, **todas las filas muestran `N° = 1`** en vez de 1, 2, 3…
HTML crudo: `<span class="ui-column-title">N°</span>1` en las dos filas.
Verificado en **Ref 15** (2 líneas) y **Ref 14** (2 líneas). En 16/17/18 no se ve porque tienen 1 línea.
**Marca: WEB-FIELD-MISMATCH (DW-INV-D06).** Cosmético, pero impide citar "la línea 2" en una auditoría.

### 🟢 Filtro con valor por defecto — revisado, NO oculta datos (a diferencia de `Moneda` en cobros)

Inventarios **no tiene filtro de Moneda**. El único control no neutro al cargar es el **rango de fechas
`01/07/2026 – 29/07/2026`** (mes en curso). Comprobado ampliando a `01/01/2020 – 31/12/2026`:
**los mismos 18 registros**, ningún inventario anterior escondido. Los otros 4 filtros arrancan neutros.
⇒ **Sin defecto**, pero el rango sí es un default no neutro: en un cliente con historia previa ocultaría
registros de meses anteriores. Comportamiento esperado, documentado.

### (B) Guión — filtros, comportamiento y muestreo

| Caso | Verifica | Resultado | Marca |
|---|---|---|---|
| DW-INV-F01 | `# Ref` = 18 / 17 / 16 | 1 fila exacta cada uno | WEB-OK |
| DW-INV-F02 | `# Ref` = 999999 | 0 registros, mensaje de vacío, sin error | WEB-OK |
| DW-INV-F03 | `Limpiar` tras `# Ref` | limpia el campo, vuelve a 18 | WEB-OK |
| DW-INV-F03b | `Limpiar` tras `Tiene Adjunto` / `Status` | **no restablece** | **WEB-FIELD-MISMATCH** |
| DW-INV-F04 | Vendedor = CESAR SALAS | 4 filas, todas de él (Refs 10,5,4,3) | WEB-OK |
| DW-INV-F05 | Rango 22–23/07 | 7 filas, ninguna fuera del rango | WEB-OK |
| DW-INV-F06 | Cliente = ANNELI CA | **3 filas = Refs 18,17,16** (los del móvil) | WEB-OK |
| DW-INV-F07 | Status Enviado / Por aprobar | 18 / 0, coherente | WEB-OK |
| DW-INV-F08 | Tiene Adjunto SI/NO | **2 + 16 = 18** ✓ aritmética exacta | WEB-OK |
| DW-INV-F09 | Vendedor + fechas | 3 filas (5,4,3) = F04 ∩ F05 exacto | WEB-OK |
| DW-INV-D01 | Paginación | 18 filas; el selector arranca en 50 → no paginable | WEB-N/A |
| DW-INV-D02 | Ordenamiento | `# Ref` roto; Cliente/Fecha/Vendedor OK | **WEB-FIELD-MISMATCH** |
| DW-INV-D03 | Selector `Columnas` | destilda y retilda `Vendedor` correctamente | WEB-OK |
| DW-INV-D04 | Lista vacía | mensaje, sin excepción | WEB-OK |
| DW-INV-D05 | Mapa no bloquea | Refs 16/17 se leyeron con el mapa sin cargar | WEB-OK |
| DW-INV-D06 | Numeración `N°` de líneas | siempre 1 | **WEB-FIELD-MISMATCH** |
| DW-INV-C07 | `Ver Pedido Relacionado` | vacío en 16/17/18 (no hubo pedido) ✓ · **Ref 15 → "Ref.: 121"** | WEB-OK |
| DW-INV-C08 | Estatus | "Enviado" en lista y detalle | WEB-OK |
| DW-INV-C09 | Coordenada | el móvil no la reportó en el manifiesto | WEB-N/A |
| DW-INV-M01…M04 | Muestreo contra BD | nube sin GRANT (0/185 tablas) | WEB-N/A |
| DW-INV-M05 | Consistencia lista ↔ detalle | 5 refs (18,17,16,15,14): Ref/fecha/cliente/vendedor/estatus idénticos | WEB-OK |

**Nota C09:** el mapa de Ref 18 trae `11.0490594,-63.8650003`. No es exigible (el manifiesto de inventarios
no reporta coordenada), pero **coincide hasta el 5º decimal** con la del resto de la corrida
(pedido `11.0490588,-63.8649817`) ⇒ corrobora que las 3 tomas salieron del mismo dispositivo y sesión.

### (C) Adjuntos — Ref 14 (`A DOLAR BOUTIQUE CA`)

| Caso | Verifica | Resultado | Marca |
|---|---|---|---|
| DW-INV-A01 | Dispara la descarga | evento `download` capturado, `failure()` = **null** | WEB-OK |
| DW-INV-A02 | Patrón del nombre | **`inventario_14.zip`** → `<singular>_<ref>.zip` **confirmado 4/4** | WEB-OK |
| DW-INV-A03 | ZIP real | magic **`50 4B 03 04`** · **1.792.417 bytes** · abre correctamente | WEB-OK |
| DW-INV-A04 | Entradas vs. BD | sin GRANT; **galería 1 imagen == ZIP 1 entrada** (coherencia interna) | WEB-N/A + coherente |
| DW-INV-A05 | Nombres 1:1 | ZIP `14_0.jpg` (1.800.009 b) == galería `…/inventarios/14_0.jpg` | WEB-OK |
| DW-INV-A06 | Firma fuera del ZIP | Ref 14 tiene `Firma:` **vacía** → no confirmable acá | WEB-N/A |
| DW-INV-A07 | **Sin** adjuntos | Refs 15·16·17·18: ambos botones **existen y quedan `disabled`** | WEB-OK |
| DW-INV-A08 | `Ver adjuntos` | galería `#form:galeriaDLG` abre con 1 imagen, sin romper la vista | WEB-OK |

La ruta servida es `/denario/resources/images/**inventarios**/14_0.jpg` (plural) — el `na_transaction` exacto
queda a confirmar cuando haya GRANT.

🔴 **Limpieza de disco — hecha y verificada.** Borrados **5 ZIP**: el propio (`inventario_14.zip`) **más los 4
que habían quedado de agentes anteriores** (`cliente_3.zip`, `pedido_121.zip`, `cobro_99.zip`, `cobro_102.zip`),
más la copia temporal de Playwright. Reconteo posterior: **0 ZIP** en disco. El ZIP **sobrevive** a
`download.path()` y Playwright deja una **segunda copia** en `.playwright-mcp/` ⇒ hay que borrar las dos.

---


---

# BARRIDO DE CIERRE — WEB · latino_cosmetica · Isla Coche · 29/07/2026

RUN_ID `20260729_133234_smoke-completo` · empresa LATINOCOSMETICA C.A. (co 00001) · READ-ONLY
Filtro aplicado en los 5 módulos: fecha 29/07/2026 → 29/07/2026, resto en neutro (verificado control por control).
Tasa: **737,2321 BSD = 1 $** (la web *muestra* 737,23 redondeada).

## INVENTARIO COMPLETO DE LAS TRANSACCIONES DEL 29/07/2026

| Módulo | # Ref | Hora | Cliente | Vendedor | Monto | Estatus (literal web) | Lista↔Detalle | Adjuntos | Veredicto |
|---|---|---|---|---|---|---|---|---|---|
| Pedidos | **123** | 14:00:23 | ANNELI CA | NEIMY PARRA | 12,14 $ / 8.950,07 BSD | `Enviado` | coherente | no | WEB-CALC-MISMATCH |
| Pedidos | **122** | 10:56:48 | A DOLAR BOUTIQUE CA | NEIMY PARRA | 21,76 $ / 16.042,32 BSD | `Enviado` | coherente | **sí** | WEB-CALC-MISMATCH |
| Pedidos | **121** | 10:54:24 | 1.000 Y UNA BELLEZA | NEIMY PARRA | 238,16 $ / 175.578,61 BSD | `Enviado` | coherente | **sí** | WEB-CALC-MISMATCH |
| Cli. potenciales | **4** | 13:46:13 | Test-CLT-SMOKE-134438 | NEIMY | — | (sin estatus en el módulo) | coherente | no | WEB-OK |
| Cli. potenciales | **3** | 13:16:17 | Elinor D | NEIMY | — | (sin estatus en el módulo) | coherente | **sí** | WEB-OK |
| Inventarios | **18** | 17:25:33 | ANNELI CA | NEIMY PARRA | — (exhib. 6,00 UND) | `Enviado` | coherente | no | WEB-OK |
| Inventarios | **17** | 15:30:26 | ANNELI CA | NEIMY PARRA | — (exhib. 6,00 UND) | `Enviado` | coherente | no | WEB-OK |
| Inventarios | **16** | 14:39:35 | ANNELI CA | NEIMY PARRA | — (exhib. 5,00 UND) | `Enviado` | coherente | no | WEB-OK |
| Inventarios | **15** | 10:52:26 | 1.000 Y UNA BELLEZA | NEIMY PARRA | — (2 ítems) | `Enviado` | coherente + enlace ↔ Pedido 121 | no | WEB-OK |
| Inventarios | **14** | 10:36:45 | A DOLAR BOUTIQUE CA | NEIMY PARRA | — (2 ítems) | `Enviado` | coherente | **sí** | WEB-OK |
| Visitas | **209** | 18:27:07 → 18:50:45 | ANNELI CA | NEIMY PARRA | — | `visitado` · Geo `Falta Coordenada (Sucursal)` | coherente | no | WEB-OK |
| Visitas | **208** | (sin inicio) → 18:22:07 | ANNELI CA | NEIMY PARRA | — | `visitado` · Geo `Falta Coordenada (Sucursal)` | coherente | no | WEB-OK |
| Visitas | **207** | 10:51:16 → 10:52:15 | 1.000 Y UNA BELLEZA | NEIMY PARRA | — | `visitado` · Geo `Falta Coordenada (Sucursal)` | coherente (**la lista lo duplica**) | **sí: firma + 2 fotos** | WEB-OK |
| Depósitos | **1** | 13:14:55 | (2 cobros de 1.000 Y UNA BELLEZA) | NEIMY PARRA | 240,00 $ / 176.935,70 BSD | `Enviado` | coherente | **sí: firma + 2 fotos** | WEB-OK |
| Cobros | **98–102** | — | A DOLAR / 1.000 Y UNA BELLEZA | NEIMY PARRA | (pase previo) | los 5 en `Por aprobar` | — | — | WEB-OK (sin cambios) |

**Totales del día:** 3 pedidos · 2 clientes potenciales · 5 inventarios · **3 visitas realizadas**
(+21 programadas nunca ejecutadas, de RICARDO ROMERO / JUAN DANIEL RAMIREZ / NIULKA CASTILLO) · 1 depósito · 5 cobros.
**Detalles abiertos: 15 de 15. Ninguna transacción quedó sin abrir.**

## Aritmética verificada

- **Depósito Ref 1 ↔ cobros:** 40,00 $ (Pago Móvil) + 200,00 $ (Efectivo), ambos del **cobro Ref 99** ⇒ Σ = **240,00 $ = monto depositado ✓ exacto**. En BSD: 29.489,28 + 147.446,42 = **176.935,70 ✓ exacto** (240 × 737,2321).
- **Pedidos, conversión de cabecera:** en 3/3, `Base conv + IVA conv = Total conv` al céntimo (ej. 121: 162.013,54 + 13.565,07 = 175.578,61 ✓).
- **Pedido 121:** Σ subtotales de línea (70,00 + 34,76 + 133,40) = **238,16 = Total de cabecera ✓**; Σ conv (51.606,25 + 25.625,60 + 98.346,76) = **175.578,61 ✓**.
- Las diferencias residuales de 0,6–3,3 BSD provienen de redondear el importe en $ a 2 decimales; **no** son defecto.

## Hallazgos NUEVOS del barrido

### N1 · 🔴 Pedido 121: la línea muestra un IVA que el documento NO cobra

En el mismo pedido, dos líneas imprimen `IVA 16.0%` con importe, pero ese IVA **no entra ni en el subtotal de la línea ni en el IVA de cabecera**:

| Línea | Cant | Precio base | IVA impreso | Importe+IVA impreso | Subtotal real | ¿IVA cobrado? |
|---|---|---|---|---|---|---|
| CERA DEPILADORA (`CER2074`) | 7 | 10,00 $ | 1,60 $ | 11,60 $ | **70,00 $** (=10,00×7, sin IVA) | **NO** |
| BELOTTI TOALLITAS (`3055`) | 12 | 2,90 $ | 0,46 $ | 3,36 $ | **34,76 $** (=2,8967×12, sin IVA) | **NO** |
| BELOTTI ABLANDA CANAS (`3057`) | 5 | 23,00 $ | 3,68 $ | 26,68 $ | **133,40 $** (=26,68×5, con IVA) | SÍ |

IVA de cabecera = **18,40 $**, que es exactamente el de la tercera línea sola. Si las tres tributaran serían **35,16 $**.
Quien lee la línea 1 calcula `11,60 × 7 = 81,20 $` y el sistema cobra **70,00 $**.
⇒ **16,76 $ (≈12.354 BSD) de IVA mostrado y no cobrado en un solo pedido.**

En los pedidos **123 y 122 el IVA en $ está correcto** (16 % exacto por línea y multiplicado por la cantidad en cabecera).

---

## 🔴 RESUELTO 29/07/2026 — NO es exención. El pedido se guardó SIN IVA en 2 de sus 3 líneas.

La BD **nube** de `latino` sigue sin GRANT, pero la **BD local del dispositivo** (legible por CDP vía
`window.sqlitePlugin`) responde la pregunta de forma concluyente.

**1 · No hay ningún producto exento.** Los **152 productos** del catálogo tienen `products.nu_tax = 16`,
incluidos `CER2074` y `3055`. (`iva_lists` sólo define dos tasas: `0` y `16`, esta última `default_iva=true`;
ningún producto usa la de 0.)

**2 · El pedido 121 se guardó con el IVA ausente en 2 líneas** (`order_details`):

| Pos | Producto | `nu_price_base` | `iva` | `nu_amount_tax` | `nu_amount_total` |
|---|---|---|---|---|---|
| 0 | CER2074 | 10,0000 | **NULL** | **0** | 70,0000 |
| 1 | 3055 | 2,8966 | **NULL** | **0** | 34,7592 |
| 2 | 3057 | 23,0000 | 16 | 18,4000 | 133,4000 |

Cabecera: `nu_amount_total_base` = 219,7592 · `nu_amount_tax` = **18,40** · `nu_amount_total` = 238,1592.
Lo correcto sería `219,7592 × 0,16 =` **35,1615**.
**Faltan 16,7615 $ de IVA** (11,20 de la línea 0 + 5,5615 de la línea 1) ≈ **12.354 BSD**.

**3 · El dato malo llegó a la nube.** La web muestra `IVA 18,40 $` en cabecera — es fiel a lo guardado.
⇒ **El defecto NO es de la web: es del documento.** El pedido está sub-facturado.

**4 · No es un fallo general de pedidos multi-línea.** En la misma BD local:

| Pedido | Líneas | Líneas con `iva` | `nu_amount_tax` | Esperado (base × 16 %) | |
|---|---|---|---|---|---|
| 121 | 3 | **1** (sólo pos 2) | 18,4000 | **35,1615** | ❌ |
| 71 | 5 | 5 | 2,1062 | 2,1062 | ✅ |
| 56 | 12 | 12 | 8,8828 | 8,8828 | ✅ |
| 123 / 122 / 47 | 1 | 1 | — | — | ✅ |

Pedidos de 5 y de 12 líneas guardan el IVA en **todas**. **1 de 6 pedidos** salió mal ⇒ es **intermitente**,
no determinista por cantidad de líneas. Las 3 líneas del 121 comparten el mismo epoch de creación
(`1785336864943.{0,1,2}`), así que se crearon en la misma operación.

### En qué se divide el defecto

| | Defecto | Gravedad |
|---|---|---|
| **A** | **La app guarda el pedido con `iva = NULL` y `nu_amount_tax = 0` en algunas líneas** de productos gravados al 16 %, y lo envía así a la nube. El documento cobra de menos. | 🔴 **Alta — toca facturación** |
| **B** | El detalle web **imprime «IVA 16.0%» e «Importe + IVA» calculados desde la tasa del producto**, no desde el valor guardado en la línea. Muestra `1,60 $` donde el documento lleva `0`. **Enmascara el defecto A**: quien revisa el pedido en pantalla ve un IVA que no existe. | 🟠 Media — oculta el anterior |

⚠ **Falta el disparador.** Se sabe *qué* pasó y *cuánto* cuesta, pero no *bajo qué condición* se pierde el IVA.
El pedido 121 lo creó QA a mano el 29/07 14:54 (`na_responsible='gv'`, comentario `ped1`). Reconstruir esos pasos
—orden en que se agregaron los productos, si se editó o eliminó alguna línea, si se cambió cliente/lista de
precio a mitad— es el camino más corto a un repro determinista.

### N2 · 🔴 Depósitos: `Limpiar` deja Moneda en un valor no neutro y OCULTA el registro real (probado A/B)

Tras pulsar `Limpiar`, `Moneda` queda en **BSD** (y las fechas vuelven a 01/07–29/07, no se vacían).
Con Moneda=BSD y fecha 29/07 la web responde **«No se encontraron registros»** — el depósito Ref 1 (240,00 $)
desaparece. Al devolver Moneda a neutro reaparece de inmediato.
Es el defecto conocido de `Limpiar` combinado con el del filtro `Moneda` preseleccionado, **ahora demostrado con
pérdida real de datos, no sólo potencial**. Mismo comportamiento en **Pedidos**: `Limpiar` deja Moneda en `$`.

### N3 · 🟢 Visitas es el CONTRAEJEMPLO: ahí `Limpiar` SÍ funciona

En Visitas, `Limpiar` restablece `Adjuntos` a neutro **y** vacía ambas fechas. El filtro se llama `selectAttach`
(los otros 4 módulos usan `attachStatus`). **Hay una implementación correcta dentro del propio producto que el
equipo puede copiar** — eso convierte N2 en un arreglo barato.

### N4 · 🔴 Visitas: la lista duplica la fila una vez por actividad

La visita **Ref 207** aparece **dos veces** en el listado, con los mismos Ref/fechas/cliente y distinta
Actividad/Motivo. Ambas filas abren **el mismo detalle**, que muestra las 2 actividades en su tabla hija.
Consecuencia: quien cuente filas ve 4 visitas donde hay **3**. Afecta cualquier conteo o indicador de cobertura.

### N5 · 🔴 `detalleVisita.xhtml`: clase CSS mal escrita `font.-bold` (con punto)

Todas las etiquetas de la cabecera de visita usan `class="font.-bold"` en vez de `font-bold` — clase inexistente,
así que **las etiquetas no se ven en negrita**. Sólo `Titulo:` y el pie usan la clase correcta. Es un typo de una
línea. (En depósitos, pedidos e inventarios la clase está bien.)

### N6 · Visitas: el detalle omite datos que sí están en la lista

No muestra **Status**, **Fecha Iniciada**, **Fecha Enviada**, **Geo** ni la coordenada numérica (sólo el mapa).
Además rotula `Fecha planeada de visita: 29/07/2026 18:27:06` — con hora, y esa hora coincide con el inicio real
(18:27:07), no con una planificación.

### N7 · Datos maestros: las 3 visitas del día quedaron con Geo `Falta Coordenada (Sucursal)`

Ninguna pudo validar geocerca porque **la sucursal del cliente no tiene coordenada cargada**, aunque la app sí
envió la coordenada del vendedor. Es dato maestro, no app — pero inutiliza el control de geolocalización de visitas.

### N8 · Visita 208: llegó con Status `visitado` y **sin Fecha Iniciada**

Sí tiene Fecha Enviada (18:22:07). Una visita marcada como realizada sin registro de inicio.

### N9 · Encoding `U+FFFD` fuera de cobros → es sistémico

`VENEZOLANO DE CR<?>DITO` en el detalle del **depósito**, y `FERRE REPUESTOS ... COMPA<?>IA ANONIMA` en la lista
de **visitas**. Ya estaba reportado en cobros; ahora son **3 módulos**.

### N10 · Menores

- El `Monto conv.` de línea imprime a veces **1 solo decimal** (`138,3 BSD`, `3.595,7 BSD`, `542,6 BSD`).
- La lista de depósitos muestra el **código** de banco (`039`) en vez del nombre.
- El detalle del depósito **no expone la forma de pago** (QA lo registró como **ZELLE** y esa palabra no aparece
  en ninguna parte — conviene confirmar dónde debería verse).
- El detalle de inventario **no muestra el Estatus** que sí trae la lista.

**Defectos conocidos re-confirmados** (sin re-reportar): IVA convertido a BSD de cada línea **dividido entre la
cantidad** en **5/5 líneas** de los 3 pedidos (÷2, ÷4, ÷7, ÷12, ÷5) y arrastrado al «Importe + IVA» convertido —
el IVA convertido de **cabecera** está bien en 3/3; columna `N°` siempre imprime 1 (ahora también en **visitas**);
clientes potenciales sin `No. de Ref.` en el detalle; inventarios sin lote ni vencimiento.

## Patrones/selectores nuevos para la memoria web

- Cabecera de **visitas**: los dos lectores estándar fallan por N5. Usar `span[class*="bold"]` → `sp.closest('div').nextElementSibling`.
- 🔑 **Adjuntos y firmas se verifican SIN descargar nada**, leyendo los `src`: `/denario/resources/images/firmas/{modulo}/{ref}_0.jpg` y `/denario/resources/images/{modulo}/{ref}_N.jpeg`. Confirmado en visita 207 y depósito 1.
- 🔑 Presencia de adjuntos sin abrir la galería: `button:has-text("Ver adjuntos").disabled` (true = sin adjuntos). Confirmado en **15/15** registros. Cero descargas, cero residuos en disco.
- Visitas usa `[id$=":btnBuscar"]`, **no** `[id$=":ajax"]` como los otros 4 módulos.
- Fijar fechas por JS (`input.value` + `dispatchEvent(new Event('change',{bubbles:true}))`) + ocultar `.ui-datepicker` antes de pulsar Buscar: funcionó en 5/5 módulos, cero interferencias.

## Veredicto del barrido

**¿Llegó todo lo del día? Sí — no falta ninguna transacción.** Los 3 esperados aparecieron (Pedido 123,
Cliente potencial 4, Inventarios 16/17/18) y además llegaron **7 que no estaban en ningún manifiesto**
(Pedidos 121-122, Cliente potencial 3, Inventarios 14-15, Visitas 207/208/209). El depósito Ref 1 hecho a mano
por QA llegó y **cuadra exacto** con su cobro Ref 99 (40 + 200 = 240,00 $).

**Lo que no está bien no es que falte algo, sino lo que la web muestra de más:** el IVA impreso en 2 líneas del
pedido 121 que el documento no cobra (**16,76 $**), y el `Limpiar` de Depósitos que esconde el depósito real
detrás de un filtro de moneda que él mismo deja mal puesto.

---

# PEDIDO 124 — prueba de control del 29/07/2026 (enviado por QA a pedido del análisis)

Cliente A DOLAR BOUTIQUE CA (co 5 / id 441) · NEIMY PARRA · 19:39:21 · comentario `pedido_iva` · 3 líneas · Enviado.

## 1 · El defecto del IVA perdido (defecto A) NO se reprodujo

La BD **local** del dispositivo muestra las 3 líneas **con su IVA correctamente guardado**:

| Pos | Producto | Precio base × Cant | `iva` | `nu_amount_tax` | Comprobación |
|---|---|---|---|---|---|
| 0 | `3059` | 4,6897 × 4 = 18,7588 | **16** | 3,001408 | 18,7588 × 0,16 = 3,001408 ✅ |
| 1 | `PT005` | 8,2586 × 10 = 82,586 | **16** | 13,21376 | 82,586 × 0,16 = 13,21376 ✅ |
| 2 | `PT031-S` | 1,75 × 6 = 10,50 | **16** | 1,68 | 10,50 × 0,16 = 1,68 ✅ |

Cabecera: Base **111,8448** · IVA **17,895168** (= 111,8448 × 0,16, exacto) · Total **129,739968**.
Conversión: total 95.648,4691 · IVA 13.192,8923 — ambas exactas con tasa 737,2321.
`st_delivery = 1`, `pending_transactions` = 0, `failed_transactions` = 0.

⇒ **El defecto A es INTERMITENTE.** El 124 tiene las mismas 3 líneas, el mismo `id_order_type = 2`, el mismo
usuario y el mismo flujo manual que el 121, y salió bien. **El disparador NO es** la cantidad de líneas, ni el
tipo de pedido, ni armar un pedido con varios productos.

**Pista abierta (hipótesis, sin confirmar — muestra de 3):** los epoch de `co_order_detail` se agrupan distinto.
- **121 (roto):** las 3 líneas comparten un único epoch → `…943.0`, `…943.1`, `…943.2`
- **124 (bien):** línea 0 con epoch propio (`…626.0`), líneas 1-2 comparten otro (`…628.1`, `…628.2`)
- **71 (bien):** mismo patrón que el 124 → `…464.0` y `…465.{1,2,3,4}`
Sugiere que el IVA se asigna en un paso **posterior** al alta de la línea, y que cuando todo ocurre en el mismo
instante ese paso se pierde para las que ya estaban. **Falta reproducirlo para confirmarlo o descartarlo.**

## 2 · El defecto B (IVA convertido ÷ cantidad) SÍ se reprodujo — 3/3, y ahora sin necesidad de BD

⚠ **Clave para leer la pantalla:** en el detalle, la columna en **US$** es **UNITARIA** (`Precio base`, `IVA`,
`Importe + IVA` son *por unidad*); **solo `Subtotal` es de la línea completa**. La columna `Monto conv.` respeta
esa misma estructura… salvo en las dos celdas del defecto.

| Línea | Cant | IVA $ (unit) | IVA conv. **mostrado** | IVA conv. **correcto** | Divisor |
|---|---|---|---|---|---|
| `3059` | 4 | 0,75 | **138,3** | 553,18 | **÷4** |
| `PT005` | 10 | 1,32 | **97,42** | 974,11 | **÷10** |
| `PT031-S` | 6 | 0,28 | **34,4** | 206,42 | **÷6** |

El divisor es **exactamente la cantidad pedida**. El `Importe + IVA` convertido **arrastra** el error:
`3.457,40 + 138,3 = 3.595,7`, cuando lo correcto es `5,4401 × 737,2321 = 4.010,58`.

### 🔑 Prueba autocontenida: la fila se desmiente sola

No hace falta BD, ni tasa, ni el móvil — basta una multiplicación dentro de la misma fila:

| | Cálculo | Resultado |
|---|---|---|
| En **US$** | `Importe + IVA × Cant = Subtotal` → 5,44 × 4 | **21,76 = Subtotal** ✅ |
| En **conversión** | `Importe + IVA conv × Cant` → 3.595,7 × 4 | **14.382,8 ≠ 16.042,32** ❌ |

Los dos números están uno al lado del otro y no pueden ser ambos ciertos.

### Qué está BIEN (para acotar el defecto)

- `Precio base` conv.: 4,6897 × 737,2321 = **3.457,40** ✅
- `Subtotal` conv.: 21,760208 × 737,2321 = **16.042,32** ✅ (en las 3 líneas)
- **IVA de cabecera** conv.: **13.192,89** ✅ exacto

⇒ El bug vive **únicamente** en las celdas `IVA` e `Importe + IVA` de la columna de **conversión**, en la grilla
de líneas. Una sola función de render, con una división por cantidad de más.

**Corroboración de formato:** los tres valores afectados (`138,3`, `3.595,7`, `34,4`) se imprimen con **1 decimal**
mientras el resto de la pantalla usa 2. Los truncados son exactamente los que pasan por el cálculo malo.

**Alcance acumulado del defecto B:** 8 de 8 líneas verificadas, en **4 pedidos distintos** (121, 122, 123 y 124),
con divisores ÷2, ÷4, ÷5, ÷6, ÷7, ÷10, ÷12. Determinista.

### Rarezas menores observadas de paso
- Dentro de la misma celda conviven valores **unitarios** (Precio base, IVA, Importe+IVA) con uno **de línea**
  (Subtotal), sin ninguna indicación. Es lo que hace que el defecto pase desapercibido a ojo.
- Etiquetas con typo en la cabecera: `Conversiòn Monto Total` (acento invertido), `Descuento :` e `IVA :` con
  espacio antes de los dos puntos.
- El detalle del pedido **no muestra la tasa** (sí está en el listado: `737,23`).
