# Reporte de Facturaciones — barrido de las 3 playas

> 🔴 **DOCUMENTO SUPERADO — NO USAR SUS CONCLUSIONES.**
> QA aportó el 2026-08-14 el criterio real del reporte (*cobradas = solo `invoice`; pendientes = `document_sale` con factura creada y deuda activa*), y con él **varias conclusiones de este archivo quedaron retiradas** (entre ellas "el ajuste no está desplegado en Isla Coche", "La Tortuga pierde el 73%" y el "tope de 256 filas").
> **Estatus válido: `RONDA-2-estatus-20260814.md`** (§3 lista lo retirado y por qué).

---


**Fecha:** 2026-08-13 · **Pantalla:** `/pages/facturaciones` · **Modo:** READ-ONLY
**Alcance:** El Yaque · Isla Coche · La Tortuga. *(Caribe fuera de servicio — ver §5.)*
**Oráculo:** BD de cada tenant. **Sin acceso a Profit**: esto valida Denario contra Denario.

---

## Veredicto: las 3 playas se comportan distinto

**El ajuste no está desplegado de forma uniforme.** La misma pantalla, con el mismo dato, da tres
resultados diferentes según el servidor.

| | **El Yaque** | **Isla Coche** | **La Tortuga** |
|---|---|---|---|
| Tenant | difranca | el_palmar | insumar |
| Empresa probada | DDHP_A12 | 1003 · DESTILERIA YARACUY | INSUM_A |
| **¿Muestra los `co_operation='D'`?** | ✅ **Sí** | ❌ **No** | ✅ Sí |
| **¿Duplica por vendedor?** | ✅ No | — *(1 vendedor/cliente)* | 🔴 **Sí** |
| **¿La descarga funciona?** | ⚠️ Sí, pero **pierde registros** | 🔴 **No genera archivo** | ⚠️ Sí, con la duplicación |

---

## 1. El filtro de borrados: desplegado en dos playas, no en la tercera

Prueba idéntica en cada playa: se elige **un día en el que TODOS los documentos están marcados
`co_operation='D'`**, para que el resultado sea inequívoco.

| Playa | Día | En BD | En pantalla | Lectura |
|---|---|---|---|---|
| **El Yaque** | 04/09/2024 | 27, todos `'D'` | **26** | Los muestra ✅ |
| **Isla Coche** | 26/02/2026 | 45, todos `'D'` | **0** + empty-state | **Los oculta** ❌ |
| **La Tortuga** | 17/06/2026 | 159, todos `'D'` | 63 filas | Los muestra ✅ |

**Isla Coche sigue con el comportamiento viejo.** Si un cliente montado ahí compara contra Profit,
va a seguir viendo faltantes por más que el ajuste exista: en ese servidor no está aplicado.

> Esto explica que "varios clientes" sigan reportando descuadres aunque el ajuste ya esté hecho:
> **depende de en qué playa esté cada cliente el día que mira el reporte.**

---

## 2. 🔴 La Tortuga: cada documento se repite una vez por vendedor, con el monto completo

En BD hay **una sola fila** para el documento `20090404` (84,48). En pantalla aparecen **seis**:
`20090404T001` … `T006`, cada una con un vendedor distinto y **los 84,48 íntegros**.

| Documento | Vendedores asignados al cliente | Filas en pantalla |
|---|---|---|
| `20090404` | 6 | 6 |
| `14621` | 6 | 6 + 1 sin sufijo |
| `14610` | 7 | `T001`–`T006`, `V01`, `INS`, `ENT` |

La "Código facturación" concatena **documento + código de vendedor**. El origen es el cruce contra
los vendedores asignados al cliente (`client_template_user`), que en insumar son 6-7 por cliente.

### En la descarga se multiplica aún más

Export de un solo día (17/06/2026): **481 filas** para **43 documentos**.

Documento `14621` — **98 filas** = **14 productos × 7 vendedores**:

| Vendedor | Suma de *Total Producto* |
|---|---|
| ARMANDO ROSAS | 639.484,86 |
| JOSE MUÑOZ | 639.484,86 |
| LEANDRO MUÑOZ | 639.484,86 |
| SAUL PENOTT | 639.484,86 |
| VACANTE VACANTE | 639.484,86 |
| YONI MILANO | 639.484,86 |
| *(null null)* | 639.484,86 |

**Siete bloques idénticos.** Las mismas 14 líneas se repiten una vez por vendedor ⇒ **cualquier
total calculado sobre el archivo queda multiplicado por 7** para ese documento.

⚠ Aparece además un vendedor **`null null`** (la fila sin sufijo), que suma otra vez el bloque completo.

### No es un rasgo de los datos: es del build

difranca **también tiene clientes multi-vendedor** (342 con 2, 73 con 3) y **no** duplica: en el día
probado había 2 documentos de clientes con 2 vendedores y la pantalla mostró **54 = 54**, exacto.
Si ese build duplicara, habrían salido 56.

⇒ **Mismo dato, distinto resultado según el servidor.**

---

## 3. La descarga, playa por playa

| Playa | Resultado |
|---|---|
| **El Yaque** | Genera el archivo, pero **trae 30 de 54 documentos** (detalle en `reporte-facturaciones-elyaque.md` §4): 14 NDB que **no pueden** salir porque el archivo se arma desde `invoice`, + 10 FACT perdidas por un **tope de 256 filas** |
| **Isla Coche** | 🔴 **No genera archivo.** Sin evento de descarga a los 45 s, 90 s y 150 s. Probado con **1 solo registro** en pantalla ⇒ **no es un problema de volumen** |
| **La Tortuga** | Genera el archivo, pero arrastra la duplicación por vendedor (§2) |

**Ninguna de las tres descarga produce un archivo fiel a lo que muestra la pantalla.**

Y en los tres casos el archivo se presenta como completo: cabecera de *Parámetros de Búsqueda* con
el rango y la empresa, sin aviso de recorte ni de duplicación. Quien lo use para conciliar contra
Profit va a creer que tiene la facturación del período.

---

## 4. Lo que sí está bien (El Yaque, cotejo exacto)

| | Web | BD | |
|---|---|---|---|
| Documentos (01–13/08/2026) | 18 | 18 | ✅ |
| FACT | 13 · 29.893,84 | 13 · 29.893,84 | ✅ |
| NDB | 5 · 269,97 | 5 · 269,97 | ✅ |
| **Total** | **30.163,81** | **30.163,81** | ✅ |

Sumadas las 18 filas una a una. Cuando el build es el correcto y no hay multi-vendedor de por
medio, **la pantalla es fiel a `document_sale` al céntimo**.

Reglas medidas (comunes a las 3): se arma sobre **`document_sale`** (no `invoice`); muestra solo
tipos de cargo (FACT/NDB — excluye NCR y ADEL); el filtro *Consolidado / Cobradas / Pendientes* es
por **estado de cobro**, no por tipo.

---

## 5. Caribe — fuera de alcance

`denariocaribe.ddns.net:8080` responde **HTTP 404** (Tomcat 9.0.120 arriba, aplicación no
desplegada), ni en `/DenarioPremium` ni en la raíz. **QA confirmó que está fuera de servicio y que
no se incluye salvo indicación explícita.** Anotado en `automation/web/playas.yaml`.

---

## 6. Prioridad sugerida

1. 🔴 **Duplicación por vendedor en La Tortuga** — es la que produce cifras infladas, y una cifra
   inflada es peor que una faltante: no se nota al mirarla.
2. 🔴 **Descarga rota en Isla Coche** — no genera archivo en ningún escenario.
3. 🔴 **Desplegar el ajuste de borrados en Isla Coche** — mientras no esté, sus clientes seguirán
   viendo faltantes contra Profit.
4. ⚠️ **Fuente distinta entre pantalla y descarga** (`document_sale` vs `invoice`) y el **tope de
   256 filas** — afecta a todas.

**Y lo de siempre:** todo esto es la capa de presentación. Los documentos que nunca llegaron a
Denario no están en ninguna tabla, y ningún arreglo del reporte los va a mostrar.

## Método

En cada playa se eligió un día donde el resultado fuera inequívoco (todos los documentos borrados),
en vez de rangos grandes donde un conteo admite varias explicaciones. Los códigos de pantalla se
cotejaron uno a uno contra BD; los `.xls` se parsearon y se cruzaron documentos, vendedores y
líneas. Tenant y empresa de cada playa se descubrieron en runtime, no se leyeron de ningún perfil.
