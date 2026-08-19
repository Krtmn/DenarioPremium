# Reporte de Facturaciones — estatus corregido (rondas 1 y 2)

**Alcance:** El Yaque · Isla Coche · La Tortuga *(Caribe fuera de servicio, excluida por QA)*
**Rondas:** 1ª el 2026-08-13 · 2ª el 2026-08-14 con los mismos días de prueba.
**Sin acceso a Profit:** todo esto es Denario contra Denario.

> 🔴 **ESTE ES EL DOCUMENTO VÁLIDO.** Los otros dos de esta carpeta (`CONSOLIDADO-3-playas.md`
> y `reporte-facturaciones-elyaque.md`) contienen conclusiones que **fueron retiradas** — ver §3.

---

## 0. El criterio del reporte (aportado por QA, 2026-08-14)

```
Cobradas   → solo `invoice`
Pendientes → `document_sale` con FACTURA CREADA y DEUDA ACTIVA
```

**Este criterio no se tenía durante las mediciones**, y es el que reencuadra todo: varias de las
"pérdidas" que se habían reportado son la regla operando, no defectos.

### Verificación del criterio contra las 8 observaciones

| Playa | Día | Documentos | `co_operation` | ¿Factura creada? | ¿Mostrado? |
|---|---|---|---|---|---|
| El Yaque | 27/01/2025 | 40 FACT | I | sí | **sí** |
| El Yaque | 27/01/2025 | 14 NDB | I | **no** | **sí** |
| El Yaque | 27/01/2025 | 4 NDB | **D** | no | **no** |
| El Yaque | 04/09/2024 | 26 FACT | D | sí | **sí** |
| El Yaque | 04/09/2024 | 1 NDB | D | no | **no** |
| Isla Coche | 26/02/2026 | 45 | D | no | **no** |
| La Tortuga | 17/06/2026 | 42 FACT | D | sí | **sí** |
| La Tortuga | 17/06/2026 | 114 FACT | D | no | **no** |

**Una sola regla explica las 8:** se muestra si **tiene factura creada** *o* si **está activo**.
Se oculta solo cuando no tiene factura **y** está borrado. **Las tres playas la aplican igual.**

---

## 1. Los errores confirmados — ninguno se da en las tres playas

| Error | El Yaque | Isla Coche | La Tortuga |
|---|---|---|---|
| **Duplicación por vendedor** | ❌ descartado | ⚪ no comprobable | 🔴 **confirmado** |
| **La descarga no genera archivo** | ❌ descartado | 🔴 **confirmado** | ❌ descartado |
| **El export omite facturas con factura creada** | 🔴 **confirmado** | ⚪ no comprobable | ⚪ sin verificar |

### 1.1 🔴 Duplicación por vendedor — solo La Tortuga (insumar)

En BD hay **una fila** para el documento `20090404` (84,48). En pantalla salen **seis**:
`20090404T001` … `T006`, cada una con un vendedor distinto y **el monto íntegro repetido**.
La "Código facturación" concatena documento + código de vendedor; el origen es el cruce contra
los vendedores asignados al cliente (6-7 por cliente en insumar).

En el archivo se compone con las líneas de producto — documento `14621`: **98 filas = 14 productos
× 7 vendedores**, y los 7 bloques suman **exactamente lo mismo** (639.484,86 cada uno).

**No es rasgo de los datos, es del build:** difranca también tiene clientes multi-vendedor
(342 con 2, 73 con 3) y **no** duplica — en el día probado había 2 documentos de clientes con
2 vendedores y la pantalla mostró **54 = 54**. Si ese build duplicara, habrían salido 56.

⚪ **En Isla Coche no se puede probar:** sus 4.795 clientes tienen **un solo vendedor cada uno**,
así que el defecto no puede manifestarse aunque el build lo tuviera.

### 1.2 🔴 La descarga no genera archivo — solo Isla Coche (el_palmar)

Sin evento de descarga a los 45 s, 60 s, 90 s y 150 s. Probado también con **un solo registro**
en pantalla ⇒ **no es un problema de volumen**. El Yaque y La Tortuga sí descargan.

### 1.3 🔴 El export omite facturas que sí cumplen el criterio — confirmado en El Yaque

Caso 27/01/2025: pantalla 54, archivo **30**. De los 24 ausentes:

- **14 NDB — ausencia CORRECTA.** No tienen factura creada y el archivo se arma desde `invoice`.
- **10 FACT — ausencia INCORRECTA.** Tienen factura creada y líneas de detalle.

Reproducible: en el export **mensual** de enero (6.079 filas / 572 documentos) el día 27/01 sigue
aportando exactamente los mismos 30, y esos 10 tampoco están.

**Pista para desarrollo:** en ese día la separación es perfecta por **condición de pago** —
ausentes `CON` (Contado, 8) y `CRE7` (Crédito a 7, 2); presentes `CRE21` (12) y `CRE30` (18).
A escala mensual la correlación se acerca pero no cierra (esperado 586, archivo 572), así que
**no es la regla exacta**: sirve como pista, no como diagnóstico.

⚪ **Sin verificar en La Tortuga:** su archivo trae los mismos 43 documentos que la pantalla, pero
no se comparó contra BD cuáles *deberían* estar. **Si ahí también se pierden, pasa a ser error de
producto y no de una playa.** Es una consulta y una descarga.

---

## 2. Lo que está bien

**El filtrado por factura creada no es un error en ninguna playa.** Las tres aplican el criterio de
§0 de forma consistente.

**Cotejo exacto (El Yaque, 01–13/08/2026):** 18 documentos · FACT 13 · 29.893,84 · NDB 5 · 269,97 ·
**total 30.163,81 contra 30.163,81 en BD**, sumando las 18 filas una a una. Cuando el build es el
correcto y no hay multi-vendedor de por medio, **la pantalla es fiel al céntimo**.

**Reglas comunes medidas:** se arma sobre `document_sale`; muestra solo tipos de cargo (FACT/NDB —
excluye NCR y ADEL); el filtro *Consolidado / Cobradas / Pendientes* es por **estado de cobro**.

**Estabilidad entre rondas:** ninguna medición se movió en 24 h (26/27, 0/45, 63 filas/43 docs,
256 filas/30 docs, 481 filas/43 docs). Se reverificó en BD que los días de prueba no hubieran
cambiado de estado.

---

## 3. 🔴 Conclusiones RETIRADAS (estaban en los otros dos documentos)

| Se dijo | Por qué era incorrecto |
|---|---|
| *"El ajuste no está desplegado en Isla Coche"* | Los 45 documentos de ese día **no tienen factura creada**; con el criterio de §0 corresponde que no salgan. El 0 es correcto. |
| *"La Tortuga pierde el 73% de los documentos"* | Los 114 ocultos **no tienen factura creada**. Es la regla operando. |
| *"Las tres playas se comportan distinto"* | En el **filtrado** se comportan **igual**. Lo que difiere es la duplicación (La Tortuga) y la descarga (Isla Coche). |
| *"Asimetría FACT/NDB con el flag de borrado"* | Las NDB no salían por **no tener factura**, no por ser NDB ni por estar borradas. |
| *"Tope de 256 filas en el export"* | **Falso.** El Yaque exporta 6.079 filas sin problema. La omisión existe, pero no es un tope. |

**Causa del error de lectura:** se eligieron días donde *todo* estaba borrado y se tomó
`co_operation` como la variable explicativa, cuando la que mandaba era la **factura creada**.
El criterio no se conocía al medir.

---

## 4. Pendientes

1. **Verificar el error 1.3 en La Tortuga** — es lo que decide si es error de producto o de playa.
2. **Mecanismo exacto del error 1.3** — la pista de la condición de pago no cierra a escala mensual.
3. **El Yaque, prueba semanal 01–07/09/2024:** BD 230, pantalla 226. Quedan **2 filas** sin explicar.

## Evidencia en esta carpeta

| Archivo | Qué es |
|---|---|
| `export_27ene2025_DDHP_A12.xls` | Export de El Yaque: 256 filas, 30 de 54 documentos |
| `latortuga_export_17jun2026_INSUM_A.xls` | Export de La Tortuga: 481 filas, 43 documentos, 7 bloques idénticos |
