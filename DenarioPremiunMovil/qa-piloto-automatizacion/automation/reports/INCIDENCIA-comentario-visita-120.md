# INCIDENCIA — El comentario de una visita se pierde o se trunca a 120 caracteres

| | |
|---|---|
| **Detectado en** | Corrida smoke `run_vzla` (CORPORACION FERRE 19) · playa **La Tortuga** · 2026-08-18 |
| **Versión** | la 21 |
| **Severidad propuesta** | 🔴 **Alta** — pérdida silenciosa de datos del vendedor |
| **Módulo** | Visitas (aplica a la actividad/incidencia, no a la cabecera de la visita) |
| **Reproduce con registros de hoy** | ✅ Sí (gate `RUNTIME §4.b` / `WEB-RUNTIME §5.a`) |

---

## Resumen

El campo de comentario de una **actividad de visita** acepta hasta **255 caracteres** en la app, pero la
columna que lo recibe en la nube es **`incidence.tx_description varchar(120)`**. El desajuste produce **dos
daños distintos**, ambos silenciosos para el vendedor:

1. **Pérdida total del registro** cuando el texto es largo: la visita **nunca llega al servidor**, se queda
   "Por Enviar" y el POST se reintenta en bucle. **La app no muestra ningún error.**
2. **Truncamiento del texto** a 120 caracteres: hay **8 casos reales en producción**, todos **cortados a
   mitad de palabra**, repartidos entre el **08/07** y el **07/08/2026**.

**Tres fuentes declaran tres límites distintos:** columna **120** · input de la app **255** · variable global
`longitudComentario` **250**.

---

## Evidencia 1 — pérdida total (experimento controlado, 3 visitas, 2026-08-18)

Se varió **una sola cosa por vez** para aislar la causa:

| Visita (epoch) | Actividades | Largo del comentario | ¿Llegó a la nube? |
|---|---|---|---|
| `1787088154545.0` | 2 | **255** | 🔴 **NO** — atascada en cola |
| `1787088554798.0` | 1 | 60 | ✅ Sí — Ref **2084** (~14 s) |
| `1787088727281.0` | **2** | 18 + 18 | ✅ Sí — Ref **2086** (~7 s) |

La tercera fila **descarta que la causa sea tener varias actividades**: con dos actividades y textos cortos
la visita sí llega. La única variable que cambia el resultado es **el largo del comentario**.

**Comportamiento observado en el caso que falla:**
- Salen **2 de las 3 alertas** habituales — *la 3.ª alerta es el único acuse real del servidor*.
- La app **navega igual** a la lista de visitas, como si hubiera funcionado.
- El ítem queda **"Por Enviar"**; `pending_transactions` seguía con 1 fila **13 minutos después**.
- 🔴 **`failed_transactions` se queda en `0`** — el fallo **no se registra como fallo**.
- Se observaron **5 POST reintentados en bucle** para el mismo registro.

---

## Evidencia 2 — 🔴 CONFIRMACIÓN MANUAL E INDEPENDIENTE DE LA QA (2026-08-19)

La responsable QA reprodujo el ciclo completo **a mano, en el dispositivo, sin conocer el diagnóstico**:
tomó la visita atascada, **acortó la observación**, y la visita **se envió de inmediato**.

| Momento | Largo del comentario | Resultado |
|---|---|---|
| Envío original (agente, 18/08 ~21:18) | **255** | 🔴 Se quedó en "Por Enviar", sin aviso |
| **Edición manual de la QA** (19/08) | **9** (`"QA VISITA"`) + una actividad vacía | ✅ **Enviada — `id_visit 2152`**, mismo `co_visit 1787088154545.0` |

Esto es determinante: **la única variable que cambió fue el largo del texto**. Mismo dispositivo, mismo
usuario, mismo cliente, misma visita, mismo epoch. Descarta red, sesión, cola y datos del registro.

⇒ **El registro ya NO está atascado**: llegó como `id_visit 2152`. No queda nada que limpiar.

---

## Evidencia 3 — truncamiento en PRODUCCIÓN (8 casos reales)

`incidence`: **2.157 filas**, `max(length(tx_description))` = **120** exacto, y **8 filas de exactamente 120**.
En texto libre eso no es casualidad. Los últimos 40 caracteres de cada una, **todas cortadas a mitad de palabra**:

| Fin del comentario (truncado) | Fecha |
|---|---|
| `… nuestra marca, ha teknido muy poca rota` | 2026-08-07 |
| `…dido y solicitó ser visitado la próxevam` | 2026-07-31 |
| `…ecios de mercancia run estan casi a prec` | 2026-07-27 |
| `…s el hierro, sin embargo le ofreci elect` | 2026-07-23 |
| `…a comprando nada de ferreteria por los m` | 2026-07-22 |
| `…n tiempo real, el aplicativo no cargaba ` | 2026-07-14 |
| `…pero prefiere cancelar para tomar nuevo ` | 2026-07-13 |
| `…ue visitarlo la próxima semana nuevament` | 2026-07-08 |

Son **notas de vendedores reales sobre clientes reales**, ya perdidas. Un mes de ocurrencias.

---

## Esperado — y hacia dónde debe ir el arreglo

🔴 **La app NO está mal: la columna sí.** El límite de 255 no es un descuido de la pantalla de visitas, es una
**constante compartida y deliberada** — `TEXT_COMMENT_MAX_LENGTH = 255` en
`src/app/utils/text-comment-field.constants.ts` — que usan **los 7 módulos** con campo de comentario
(visitas, pedidos, cobros, depósitos, devoluciones, inventarios y cliente potencial), y que además se le
muestra al usuario en el contador *"Mín. 0 - Máx. 255 caracteres"*.

Cruzando esa constante con el ancho real de cada columna:

| Módulo | Columna que recibe el comentario | Ancho | ¿Honra los 255? |
|---|---|---|---|
| devoluciones | `return.tx_description` | `varchar(500)` | ✅ |
| pedidos | `order.tx_comment` | `text` | ✅ |
| cobros | `collection.tx_comment` | `text` | ✅ |
| inventarios | `client_stock.tx_comment` | `text` | ✅ |
| depósitos | `deposit.tx_comment` | `text` | ✅ |
| cliente potencial | `potential_client.tx_client` | `text` | ✅ |
| **visitas** | **`incidence.tx_description`** | **`varchar(120)`** | 🔴 **NO** |

**De los 7 módulos que comparten el contrato de 255, exactamente uno tiene la columna más estrecha.** El
vendedor que escribe 250 caracteres está haciendo justo lo que la app le invita a hacer.

⇒ **Arreglo propuesto: ensanchar `incidence.tx_description` a `varchar(255)` o `text`**, alineándola con las
otras seis. Capar la app sería resolverlo al revés y degradaría una funcionalidad que hoy se ofrece.

⇒ **Alinear también la VG `longitudComentario`, que dice 250** — es un tercer número que hoy no lo usa el
contador (el contador va contra la constante 255). Los tres valores deben coincidir.

⇒ **Independientemente del ancho: un envío rechazado debe reportarse como error visible** y quedar en
`failed_transactions`, no en un reintento mudo con la app navegando como si todo hubiera salido bien. Ese
silencio es la mitad del defecto y sobrevive a cualquier cambio de tamaño.

## Actual

Se puede escribir hasta 255. Con textos largos la visita **no llega y no se avisa**; con textos de poco más de
120 el comentario **llega cortado a mitad de palabra**.

---

## Precondiciones

- Módulo Visitas con al menos una actividad disponible.
- Usuario de ventas cualquiera (reproducido con el usuario QA `001` / `co_user 000208`).

## Pasos para reproducir

1. Entrar a **Visitas → Nueva Visita** y elegir un cliente.
2. Agregar una actividad.
3. En el comentario de la actividad escribir **más de 120 caracteres** (la app deja llegar a 255).
4. Guardar y **Enviar**.
5. Observar que salen solo 2 alertas y que la app navega a la lista **sin ningún error**.
6. El ítem queda **"Por Enviar"** y nunca cambia de estado.

---

## Consultas de verificación

**A. ¿Cuál es el ancho real de la columna?** (la raíz del problema)

```sql
SELECT table_name, column_name, data_type, character_maximum_length AS ancho
FROM information_schema.columns
WHERE table_name = 'incidence' AND column_name = 'tx_description';
-- Devuelve: character varying, 120
```

**B. ¿Hay comentarios truncados en producción?**

```sql
SELECT count(*)                                        AS total_incidencias,
       max(length(tx_description))                     AS largo_maximo,
       count(*) FILTER (WHERE length(tx_description) = 120) AS exactamente_120,
       count(*) FILTER (WHERE length(tx_description) >= 110) AS entre_110_y_120
FROM incidence
WHERE co_operation IS DISTINCT FROM 'D';
-- run_vzla 2026-08-18: 2157 / 120 / 8 / 24
```

**C. Ver los truncados y comprobar que están cortados a mitad de palabra**

```sql
SELECT right(tx_description, 40) AS final_del_comentario, da_update
FROM incidence
WHERE co_operation IS DISTINCT FROM 'D'
  AND length(tx_description) = 120
ORDER BY da_update DESC;
```

**D. Comprobar que la visita larga NO llegó** (sustituir el epoch por el del intento)

```sql
SELECT co_visit, id_visit, da_visit
FROM visit
WHERE co_visit = '1787088154545.0';
-- Devuelve 0 filas: la visita nunca llegó a la nube.
```

> ⚠ `co_operation` es NULL en varias tablas ⇒ usar siempre `IS DISTINCT FROM 'D'`, nunca `<> 'D'`.

---

## 🔴 SEGUNDO CASO CONFIRMADO — la Dirección del cliente potencial, y es PEOR

> Se barrieron **los 10 módulos** el 19/08 a petición de la QA. Resultado: **los 6 campos de *comentario*
> alcanzables aceptan sus 255 caracteres sin perder ni truncar nada.** Pero apareció **otro campo que sí
> pierde el registro**, y con un comportamiento más dañino que el de visitas.

En el formulario de **cliente potencial**, **Dirección** (`txAddress`) y **Dirección de entrega**
(`txAddressDispatch`) **no declaran `maxlength` ni contador** — entrada ilimitada — contra columnas
**`varchar(150)`**.

**Experimento con una sola variable** (misma observación de 255 en los dos registros):

| Largo de las direcciones | Alerta de la app | ¿Llegó? |
|---|---|---|
| **170** | *"Cliente potencial nro. **null** creado exitosamente"* | 🔴 **NO** |
| **150** | *"Cliente potencial nro. **203** creado exitosamente"* | ✅ Sí — `150 / 150 / 255` completos |

**El borde es el ancho de la columna: hasta 150 pasa, por encima se pierde.**

### Por qué es peor que el de visitas

| | Visitas (comentario) | **Cliente potencial (dirección)** |
|---|---|---|
| ¿La app declara un tope? | Sí, 255 (contador visible) | 🔴 **No: ninguno, ni contador** |
| Estado del registro | "Por Enviar" | 🔴 **"Enviado", con Nro. Ref vacío** |
| ¿Se reintenta? | Sí (`pending_transactions = 1`, POST en bucle) | 🔴 **No** (`pending_transactions = 0`) |
| ¿Se puede rescatar o borrar? | Sí — editando y acortando | 🔴 **No: sin trash, no editable** |
| `failed_transactions` | 0 | 0 |

⇒ En visitas la QA pudo **destrabarlo acortando el texto**. Acá el registro queda **muerto y no borrable**: el
vendedor lo ve como "Enviado" y no tiene forma de recuperarlo ni de eliminarlo.

**Indicio corroborante:** falta el **`id_client 202`** en la secuencia (la corrida saltó de 201 a 203),
compatible con un INSERT abortado. *No es concluyente por sí solo* — había otra sesión QA activa con el mismo
usuario—, pero coincide con que el registro de 170 caracteres no está en la nube (`count = 0`).

**Producción aún no ha mordido:** 195 clientes potenciales, máximo **136** de 150, ninguno en 150.

## 🟡 Riesgo adicional detectado, NO provocado

En las **líneas de devolución**, los campos **Nro. Factura** (`return_detail.co_document`) y **Lote**
(`return_detail.nu_lote`) tampoco declaran `maxlength`, contra columnas **`varchar(30)`**. Mismo mecanismo, y
**escala por línea**: con `multiInvoices=true` una devolución puede llevar varias facturas.

## ✅ Contraste positivo — Devoluciones es el módulo mejor alineado

Comentario 255 → `varchar(500)` · Responsable 80 → 80 · Precinto 30 → 30: **los tres frenan en el tope
correcto**. Sirve de referencia de cómo debería estar el resto.

---

## Nota de estado

✅ **Nada pendiente de limpiar.** El registro que se había dejado atascado como evidencia viva
(`co_visit = 1787088154545.0`) **ya llegó a la nube como `id_visit 2152`** después de que la QA acortara la
observación a mano el 19/08. El propio destrabe es ahora la mejor pieza de evidencia del reporte.

## Umbral — acotado por medición, no por deducción

| Largo | Resultado | Quién lo midió |
|---|---|---|
| **255** | 🔴 **No envía** | Agente (18/08) |
| **120** | ✅ **Envía** | 🔴 **QA, prueba manual (19/08)** |
| 60 · 36 · 9 | ✅ Envían | Agente + QA |

⇒ **El límite es exactamente el ancho de la columna: hasta 120 pasa, por encima de 120 se pierde.**
La prueba de la QA con **exactamente 120** es la que cierra el borde por arriba: descarta que el corte
estuviera en un valor intermedio arbitrario y confirma que la causa es `varchar(120)` y nada más.

No se bisectó el rango 121-254 y no hace falta: con 120 dentro y 255 fuera, y con la columna declarando 120,
el mecanismo queda determinado.

---

*Generado durante la corrida `smoke_run_vzla_20260818_152824` · Claude Code*
