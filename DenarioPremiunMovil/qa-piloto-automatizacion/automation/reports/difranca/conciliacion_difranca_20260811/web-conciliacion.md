# REGRESIÓN — Conciliación Bancaria (web) · difranca / EL YAQUE

| Parámetro | Valor |
|---|---|
| RUN_ID | `conciliacion_difranca_20260811` |
| Playa | **EL YAQUE** — `denarioelyaque.ddns.net:8080/DenarioPremium` |
| Empresa | **DDHP_A12** — `*DISTRIBUIDORA DIAZ HERNANDEZ *` (`id_enterprise=2`) |
| Guarda de tenant | ✅ verificada por TEXTO: las 3 empresas esperadas (`*DISTRIBUIDORA DIAZ HERNANDEZ *`, `DIFRANCA C.A`, `DISTRIBUIDORA DH VITAL, C.A.`) y la de la prueba activa |
| Usuario web | bloque `# USUARIO WEB` (no se transcribe) |
| Fecha | 2026-08-11 |

## 🟢 VEREDICTO: LA CONCILIACIÓN BANCARIA **NO ESTÁ ROTA**

**Los 8 pagos esperados cruzaron, los 8 con coincidencia PLENA (Fecha + Referencia + Monto).**
Los 4 extractos se aceptaron, **incluidos los 3 PDF**. Cero falsos positivos: en toda la tabla
`collection_reconciliation` hay **exactamente 8 coincidencias plenas**, y son las 8 esperadas.

---

## 1. ¿Se aceptaron los PDF? — **SÍ, los 3**

| Archivo | Formato elegido | ¿Se aceptó? | ¿Se procesó? |
|---|---|---|---|
| `Detalle_de_cuenta_Mercantil.xlsx` | `BANCO MERCANTIL - Mercantil` (`id_bank=16`) | ✅ | ✅ 5 filas de cruce |
| `Banesco_…-MDQyMDI2.pdf` | `BANESCO - Banesco` (`id_bank=28`) | ✅ **PDF OK** | ✅ 21 filas de cruce |
| `bancamiga.pdf` | `BANCAMIGA … - Bancamiga` (`id_bank=26`) | ✅ **PDF OK** | ✅ cruce completo |
| `bdv.pdf` | `BANCO VENEZUELA - Banco de Venezuela` (`id_bank=17`) | ✅ **PDF OK** | ✅ 15 filas, **0 plenas** |

**No hay regresión de formato.** Ningún archivo fue rechazado, ni por extensión ni por contenido.
El `input[type=file]` no declara `accept`, y el servidor procesó los 3 PDF sin error.

---

## 2. Los 8 movimientos — **8 cruzaron / 0 no cruzaron**

Semáforo de la columna **Pagos/Conciliaciones**: 3 círculos por pago = Fecha · Referencia · Monto.
Verde = campo encontrado en el extracto.

| # | Banco | Referencia | Monto | Fecha | `id_collection` | Semáforo | BD (`match_date/ref/amount`) | Resultado |
|---|---|---|---:|---|---|---|---|---|
| 1 | Mercantil | `0000000000000029` | 1.000,00 | 30/06/2026 | 21854 | 🟢🟢🟢 | true/true/true | ✅ **CRUZÓ** |
| 2 | Banesco | `61073923961` | 1.000,00 | 17/04/2026 | 21855 | 🟢🟢🟢 | true/true/true | ✅ **CRUZÓ** |
| 3 | Banesco | `61074809996` | 6.000,00 | 17/04/2026 | 21855 | 🟢🟢🟢 | true/true/true | ✅ **CRUZÓ** |
| 4 | Banesco | `61073794952` | 9.000,00 | 17/04/2026 | 21856 | 🟢🟢🟢 | true/true/true | ✅ **CRUZÓ** |
| 5 | Banesco | `61056592463` | 32.000,00 | **15/04/2026** | **21859** | 🟢🟢🟢 | true/true/true | ✅ **CRUZÓ** |
| 6 | Bancamiga | `417037338015` | 102.000,00 | 19/06/2026 | 21857 | 🟢🟢🟢 | true/true/true | ✅ **CRUZÓ** |
| 7 | Bancamiga | `985909344` | 71.519,65 | 26/06/2026 | 21858 | 🟢🟢🟢 | true/true/true | ✅ **CRUZÓ** |
| 8 | Bancamiga | `986707536` | 77.320,10 | 26/06/2026 | 21858 | 🟢🟢🟢 | true/true/true | ✅ **CRUZÓ** |
| — | Banesco | `61056592463` | 32.000,00 | 11/08/2026 | 21855 | ⚪⚪⚪ | *(sin fila)* | ⛔ **descarte, correctamente NO cruzó** |

**Ninguno falló por la restricción de la descripción.** Esa validación (la que en su día rechazó
`ABONO DE INTERESES` y obligó a usar `TRF ABONO`) **no se activó en esta corrida**: los 8 movimientos
traían descripciones aceptadas. No hay nada que reportar como defecto por ese lado — tampoco quedó
re-verificada, simplemente no se pasó por ese camino.

### Cómo lo muestra la lista de Cobros

| # Ref | Conciliado |
|---|---|
| 21854 | **Campos: 3/3 (100%) · Monto: 100%** |
| 21855 | Campos: 6/9 (67%) · Monto: 18% ← los 3 grises son el pago de descarte |
| 21856 | **Campos: 3/3 (100%) · Monto: 100%** |
| 21857 | **Campos: 3/3 (100%) · Monto: 100%** |
| 21858 | **Campos: 6/6 (100%) · Monto: 100%** |
| 21859 | **Campos: 3/3 (100%) · Monto: 100%** |

El `Monto: 18%` del 21855 es **correcto**: cruzaron 7.000 de 39.000 BSD = 17,9 %. El porcentaje pondera
por importe, no por cantidad de pagos. No es un defecto.

---

## 3. 🔴 La referencia duplicada — **desempató BIEN**

La referencia `61056592463` existe dos veces. La conciliación tomó **una sola**, y la correcta:

- `id_collection` **21859**, fecha **15/04/2026** → **cruzó 3/3**, coincidiendo con el extracto.
- `id_collection` **21855**, fecha **11/08/2026** → **no generó ninguna fila** en
  `collection_reconciliation` (los 3 campos vienen `null`, no `false`): el motor **ni siquiera lo
  consideró candidato**.

⇒ **No marcó las dos, ni tomó la equivocada.** El desempate es por **fecha**: el registro cuya
`da_value` no coincide con la del movimiento del extracto queda fuera, aunque la referencia y el monto
sean idénticos. Es el comportamiento deseable y es el resultado más valioso de la corrida, porque el
caso se dio de forma involuntaria y no estaba diseñado.

⚠ Matiz honesto: esto prueba que **con fechas distintas** desempata bien. **No** prueba qué haría con
dos pagos de referencia, monto **y fecha** idénticos — ese escenario no se probó.

---

## 4. 🔴 ¿Concilia por banco o por número de cuenta? — **POR BANCO** (`id_bank` del pago)

Medido, no inferido. Al subir `bdv.pdf` con el formato *Banco de Venezuela*, el motor generó 15 filas
de coincidencia parcial y **las 15 son de pagos con `id_bank = 17 / BANCO VENEZUELA`**. Ni un solo pago
de otro banco fue tocado. El propio modal lo enuncia:

> *"Seleccione General para conciliar sin filtro de banco, o un banco específico para limitar los pagos
> a ese banco."*

**La desnormalización de `co_bank` NO afectó a esta prueba, y conviene explicar por qué.** El selector
de la conciliación lista los bancos del catálogo `bank` de la empresa **por `id_bank`**, y esos
`id_bank` son justamente los que llevan los pagos:

| Opción del selector | `id_bank` | `co_bank` en `bank` | Cuenta receptora usada en el móvil |
|---|---|---|---|
| BANCO MERCANTIL - Mercantil | 16 | `001` | Mercantil `0105…2995` |
| BANCO VENEZUELA - Banco de Venezuela | 17 | `002` | *(sin pagos)* |
| BANCAMIGA … - Bancamiga | 26 | `0117` | Bancamiga `0172…9645` |
| BANESCO - Banesco | 28 | `0134` | Banesco `0134…6990` |

El vínculo pago↔banco viaja por `id_bank` (clave interna), **no** por `co_bank` ni por el número de
cuenta. Por eso Mercantil cruza aunque su `co_bank` sea `001` en vez del `0105` oficial, y Bancamiga
cruza con `0117` en vez de `0172`.

⇒ **Para desarrollo:** el riesgo de la desnormalización sigue latente pero **no está en la
conciliación**. Los duplicados del catálogo (`0105` Mercantil y `0172` Bancamiga, ambos sin cuenta
asociada) **no aparecen en el selector**, así que no hay forma de elegir el banco "equivocado" desde
esta pantalla. El formato de extracto se resuelve por una tabla aparte, `bank_reconciliation`
(`GENERAL`, `BDV`, `BANESCO`, `MERCANTIL`, `BANCAMIGA`), y el label del combo es la concatenación de
ambas: `{bank.na_bank} - {bank_reconciliation.na_bank}`.

---

## 5. `bdv.pdf` — caso especial: **el PDF se acepta, y da 0 coincidencias**

Exactamente el resultado esperado, y sirve para lo que se pedía: **separa "el PDF se rechaza" de "no hay
con qué cruzar"**.

- El archivo **se aceptó y se procesó**: generó **15 filas** nuevas en `collection_reconciliation`.
- **0 de las 15 son coincidencias plenas**: las 15 traen `match_reference = false`. Son cuadres sueltos
  de fecha o de monto contra pagos históricos de BDV, ninguno es una conciliación real.
- Ningún cobro de la corrida cambió su estado tras subirlo.

⇒ Queda **descartado** que los PDF sean el problema: el mismo motor que no encontró nada en BDV
encontró los 8 de Banesco y Bancamiga, también en PDF.

---

## 6. Defectos nuevos

**Ninguno.** La funcionalidad se comporta como debe en los 4 formatos probados.

### Observaciones (no son defectos, son datos para desarrollo)

| # | Observación | Severidad |
|---|---|---|
| O-1 | **La conciliación ignora el rango de fechas del filtro de la lista.** Con el filtro en `01/01/2026–31/12/2026`, el proceso de BDV cruzó pagos de **2024 y 2025**. Barre todo el histórico del banco, no la ventana consultada. No produjo error acá, pero en una empresa con años de histórico el barrido es mucho mayor de lo que el usuario cree estar pidiendo. | 🟡 informativa |
| O-2 | **No hay confirmación en pantalla al terminar de procesar el extracto**: ni growl, ni resumen, ni "N movimientos conciliados". La tabla se refresca en silencio y el usuario debe deducir el resultado leyendo la columna *Conciliado*. Con un extracto que no cruza nada (el caso BDV) es indistinguible de "no pasó nada". | 🟡 UX |
| O-3 | Se registran **coincidencias parciales** (solo fecha, o solo monto) como filas de `collection_reconciliation` con `match_reference=false`. Es útil como traza, pero infla la tabla: 41 filas para 8 conciliaciones reales. | 🟢 nota |

### Fuera de alcance de esta corrida

- **Opción `General` (Excel: Fecha, Referencia, Monto)**: no se probó — el encargo no asignaba archivo
  a ese formato. Queda pendiente si se quiere cobertura de los 5.
- **Restricción de la descripción**: no se ejercitó (ningún movimiento fue rechazado por ese motivo).

---

## 7. Cómo se operó (reproducible)

1. Login por árbol de accesibilidad → `/pages/cobros`. Guarda de tenant por TEXTO de empresa.
2. **Ampliar el rango de fechas** con el widget PrimeFaces (`setDate`) a `01/01/2026–31/12/2026` y
   `Buscar` — con el rango por defecto (`01/08–11/08`) los cobros no se ven y se lee un falso vacío.
   *(Nota: el rango afecta a lo que se VE en la lista; a lo que el motor CRUZA, no — ver O-1.)*
3. Abrir **Conciliación Bancaria** → seleccionar formato → `Aceptar` → se abre el selector de archivo
   del navegador → subir.
4. Esperar el ajax (`jq.active===0` + settle) y releer la tabla. Verificar contra BD.

### Selectores nuevos (para `web-selectors/cobros.md`)

| Elemento | Selector | Nota |
|---|---|---|
| Enlace Conciliación Bancaria | `a.ui-commandlink` cuyo texto matchea `/Conciliaci/i` | el id es `j_idt*` ⇒ **anclar por texto**. Está junto a *Exportar Reporte* |
| Modal | `#form\:reconciliationBankDlg` | **ID semántico y estable** |
| Selector de formato | `#form\:reconciliationBankSelect_label` / `_panel` / `_input` | values = `id_bank`; `-1` = General |
| Aceptar / Cancelar | `#form\:reconciliationBankOk` / `#form\:reconciliationBankCancel` | semánticos |
| Subida | `Aceptar` **dispara directamente el file chooser** del navegador (`browser_file_upload`) — no hay un paso intermedio de "elegir archivo" en la página | |
| Semáforo por pago | `.semaforo-circle.green` / `.gray` dentro de la celda *Pagos/Conciliaciones* | 3 por pago: fecha, referencia, monto |
| Columna Conciliado | texto `Campos: n/m (x%)` + `Monto: y%` | `Monto` pondera por importe, no por cantidad |

⚠ **El MCP de Playwright restringe la subida a sus roots permitidos**: los extractos hubo que copiarlos
dentro de `DenarioPremiunMovil/` para poder subirlos, y **se borraron al terminar** (traen datos
bancarios reales).

### Oráculo de BD (el que resuelve la ambigüedad de la UI)

```sql
SELECT p.id_collection, p.nu_payment_doc, p.nu_amount_partial, p.da_value::date, p.na_bank,
       r.match_date, r.match_reference, r.match_amount
FROM collection_payment p
LEFT JOIN collection_reconciliation r ON r.id_collection_payment = p.id_collection_payment
WHERE p.id_collection BETWEEN 21854 AND 21859
ORDER BY p.id_collection, p.id_collection_payment;
```

`collection_reconciliation` estaba **vacía (0 filas) antes de empezar** ⇒ todo lo medido es de esta
corrida. Al cierre: **41 filas, 8 plenas** (`match_date AND match_reference AND match_amount`).

---

*Agente web · read-only salvo la subida de extractos, que es el objeto de la prueba. No se tocó ningún
`Estatus del Cobro`, `Aprobar` ni control de escritura de fila. Números de cuenta enmascarados.*
