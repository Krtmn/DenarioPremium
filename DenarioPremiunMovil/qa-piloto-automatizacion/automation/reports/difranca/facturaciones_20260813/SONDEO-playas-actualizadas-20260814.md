# Sondeo tras la actualización de playas — ¿data o versión 21?

**Fecha:** 2026-08-14 · **Pantalla:** `/pages/facturaciones` · **Modo:** READ-ONLY
**Criterio de referencia:** *cobradas = solo `invoice`; pendientes = `document_sale` con factura
creada y deuda activa* (aportado por QA).

## El experimento

El cambio de playas creó una comparación natural: **mismos servidores, tenants distintos**.

| Playa | Tenant ayer (13/08) | Tenant hoy (14/08) |
|---|---|---|
| El Yaque | difranca | **GRUPO FIEL** |
| Isla Coche | el_palmar | **CHOCOLATES KRON** |
| La Tortuga | insumar | insumar *(sin cambio → **control**)* |

---

## Resultado 1 — La descarga: sigue a la actualización, no al dato

| Playa | Tenant | ¿Genera archivo? |
|---|---|---|
| El Yaque | difranca (ayer) | ✅ **Sí** |
| **El Yaque** | **GRUPO FIEL (hoy)** | 🔴 **No** |
| Isla Coche | el_palmar (ayer) | 🔴 No |
| **Isla Coche** | **KRON (hoy)** | 🔴 **No** |
| **La Tortuga** | insumar (ayer y hoy) | ✅ **Sí** |

### Qué queda descartado

- **No es el volumen ni un registro corrupto.** En El Yaque se probó con un **rango vacío
  (0 resultados)** y tampoco genera archivo. En Isla Coche, con **1 solo registro**, tampoco.
- **No es el tenant.** Isla Coche falla con **dos tenants distintos** (el_palmar y KRON).
- **No es el servidor por sí solo.** El Yaque **funcionaba ayer y hoy no**, siendo el mismo servidor.
- **No es la versión 21 en general.** difranca ya estaba en la 21 y descargaba.

### 🔴 CORRECCIÓN (2026-08-14) — la causa sigue SIN determinar

Una primera versión de este documento atribuía la falla a "las playas actualizadas". **Esa
conclusión se retira**, por dos motivos:

1. **Se apoyaba en un supuesto no verificado:** que La Tortuga corre un build anterior *porque no le
   cambió el cliente*. El despliegue del software y la asignación de tenant son **independientes**;
   si las tres corren la misma versión, que La Tortuga funcione **descarta** que sea la versión.
   No se pudo comprobar: la web **no expone la versión** (las tres sirven los mismos recursos
   PrimeFaces 11.0.0).
2. **Tampoco lo explica ningún atributo de los datos.** Se probó la hipótesis del tipo de documento
   y **se cayó**:

| Tenant | Tipos en `document_sale` | ¿Exporta? |
|---|---|---|
| difranca | ADEL FACT IGTF NCR NDB | ✅ |
| insumar | FACT IGTF NCR | ✅ |
| **kron** | **FACT** | 🔴 **No** |
| el_palmar | 01 02 04 06 11 15 17 19 IGTF | 🔴 No |
| grupo_fiel | A C | 🔴 No |

kron tiene `FACT` —igual que los dos que sí exportan— y falla. **Ningún dato medido separa los
casos.**

### Lo que sí queda establecido

- La exportación funciona en **La Tortuga** y falla en **El Yaque** e **Isla Coche**.
- **El Yaque cambió de funcionar a fallar** el 14/08, al cambiarle el tenant. Es la **única
  transición observada**, y por tanto el mejor punto de anclaje: *¿qué más cambió en El Yaque en
  ese momento, además del tenant?*
- La falla ocurre **con rango vacío (0 resultados)** ⇒ es una **excepción al generar el archivo**,
  no un problema de la consulta ni de un registro concreto.

⇒ **El diagnóstico está del lado del servidor, no de QA:** el log al pulsar *Exportar Reporte* con
rango vacío debería mostrar la traza y nombrar la causa de inmediato.

---

## Resultado 2 — 🔴 NUEVO: el mismo documento se cuenta DOS veces

En las dos playas actualizadas el reporte muestra **las dos ramas del criterio**, y un documento que
cumple ambas **aparece duplicado**.

**Caso testigo — El Yaque / GRUPO FIEL, 13/08/2026, documento `B066127`:**

| Tipo en pantalla | Vendedor | Monto |
|---|---|---|
| **Facturas cobradas** | Johana Belandria | **15.260,52 BS** |
| **Pendientes por cobrar** | *(vacío)* | **17.702,20 BS** |

Es el mismo código, con **montos distintos**. En BD el documento tiene **17.702,20 en las dos
tablas** (`invoice.nu_amount_final` y `document_sale.nu_amount_total`), así que el 15.260,52 de la
fila "cobradas" no sale de ninguna de las dos: **es un tercer número**.

### Alcance del día completo

| | |
|---|---|
| Filas en pantalla | **198** |
| Códigos distintos | **143** |
| Documentos duplicados | **55** |
| En BD ese día | 82 documentos (77 activos + 5 borrados) |

Aritmética: 121 facturas (`invoice`) + 77 documentos activos con deuda = **198 filas**; el
solapamiento de 55 explica los 143 distintos. **Cuadra exacto.**

### El control confirma que es de la actualización

| Playa | Ramas que muestra |
|---|---|
| El Yaque (actualizada) | cobradas **+** pendientes → duplica |
| Isla Coche (actualizada) | cobradas **+** pendientes |
| **La Tortuga (sin actualizar)** | **solo cobradas** → no duplica |

Y ayer, **antes** de actualizar El Yaque, difranca cuadraba al céntimo sin duplicar (18 = 18,
54 = 54). Hoy, el mismo servidor con el tenant nuevo duplica.

⚠ En Isla Coche/KRON se confirmó que aparecen las dos ramas, pero **no se aisló un documento
duplicado**: los 19 clientes multi-vendedor son pocos frente a 717 y no cayeron en la muestra.

---

## Resultado 3 — La duplicación por vendedor no se pudo re-probar

| Tenant | Clientes con más de 1 vendedor | ¿Prueba posible? |
|---|---|---|
| GRUPO FIEL | **0** (los 1.036 tienen 1) | ⚪ no |
| KRON | 19 (18 con 2 · 1 con 3) | ✅ sí, pero no se aisló |
| insumar | 6-7 por cliente | ya confirmado ayer |

---

## Hallazgos de datos encontrados de paso

**1. 🔴 `nu_document` con el texto literal `'NULL'` en GRUPO FIEL.** Las **6.150 filas** de
`document_sale` traen la cadena `'NULL'` (cuatro caracteres), no un NULL de SQL. El código real
vive en `co_document_sale`.

**2. Cada tenant cruza con `invoice` por una columna distinta.** Cotejar con la equivocada da 0
coincidencias y hace creer que ningún documento tiene factura:

| Tenant | Clave que cruza | Documentos con factura |
|---|---|---|
| GRUPO FIEL | `co_document_sale` | 777 de 1.810 |
| KRON | `nu_document` | 1.068 de 2.511 |

**3. La clave de la web de El Yaque cambió** de `1234567` a `123456` con el cambio de tenant.
Las tres playas usan hoy `123456`.

**4. Los tipos de documento cambian por tenant:** `A` (GRUPO FIEL), `01` (el_palmar),
`FACT/NDB/NCR/ADEL` (difranca), `FACT/NCR` (insumar). Ningún guión debe asumir `FACT`.

---

## Qué le pediría a desarrollo

1. **Comparar el WAR desplegado en las tres playas.** Es lo que convierte la inferencia de §1 en
   dato, y son cinco minutos.
2. **Exportación:** falla incluso con rango vacío en las dos playas actualizadas ⇒ mirar la
   generación del archivo, no la consulta.
3. **Doble conteo:** las dos ramas se unen sin deduplicar. Y revisar de dónde sale el monto de la
   fila "cobradas", que no coincide con ninguna de las dos tablas.

## Método

Cada prueba se hizo con rangos donde el resultado fuera inequívoco (rango vacío para separar
"mecanismo roto" de "dato que lo rompe"; día completo paginado para contar duplicados). La Tortuga
se usó como control por conservar el tenant. Tenant y empresa se descubrieron en runtime.
