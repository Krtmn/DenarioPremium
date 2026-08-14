# Observaciones técnicas del cotejo web — pedido sugerido (2026-08-11)

> **Fuera del PDF a propósito.** El reporte `Reporte_QA_REQ_Pedido_Sugerido_Hidroponias.pdf` es un documento
> presentable al cliente; estas observaciones son internas y no entran ahí.
> Ninguna de ellas invalida el cierre del requerimiento: **la fórmula calcula bien y está verificada término
> por término.** Lo que sigue es sobre **persistencia y superficie administrativa**, no sobre el cálculo.

## 1. La cantidad sugerida no se persiste — `qu_suggested = 0`

- En los **dos pedidos nuevos** (48 y 49), `order_detail.qu_suggested` vale **0 en las 8 líneas**, pese a que
  ambos nacieron de un inventario con sugerido > 0 (4/8/3/13 y 3/8/3/2).
- La tabla **`suggested`** del tenant sigue **vacía** (0 filas).
- Efecto: en el sistema queda registrado **lo que se pidió**, nunca **lo que se sugirió**. La sugerencia vive
  solo en la pantalla del móvil y se pierde al cerrar el modal.
- Consecuencia para QA: **no hay forma de auditar el sugerido desde el lado administrativo** a posteriori. La
  única verificación posible es la del agente móvil contra BD en el momento, que es la que se hizo.

## 2. La web no muestra los días de la fórmula

`client_stock.days_since_last` y `days_until_next` están correctamente guardados
(48 → 15/10 · 49 → 8/4 · 50 → 8/4), pero **ninguna pantalla web los pinta**: ni la lista de inventarios ni
`/pages/detalleInventario`. Son el divisor y el multiplicador de la fórmula ⇒ sin ellos el administrativo no
puede reproducir el cálculo. Verificado por texto completo del detalle de los 3 inventarios: 0 coincidencias
de "días".

Tampoco aparece la palabra "sugerido" en ninguna de las pantallas recorridas (detalle de inventario y de
pedido).

## 3. Corrección al reporte móvil §9 — la UI **sí** expone los términos intermedios

El reporte móvil dice que el modal *"sólo pinta días + nombres de producto"* y que los términos hay que
leerlos del modelo del componente. **Eso es cierto solo con el acordeón colapsado.**

Al **desplegar el producto** en el modal `Pedido Sugerido`, la app muestra en pantalla:

```
Sugerido UNIDAD: 4
Inv. Inicial | Inv. Anterior | Despacho | Cambio por cambio   →  9 | 1 | 5 | 3
Venta S/Devo Calidad | Inv. Inicial | Inv. Actual | Dev. Distribución  →  6 | 9 | 1 | 2
Ventas Diarias Estimadas: 0,40
```

Las dos mini-tablas tienen **scroll horizontal** (`ion-grid.tablaDocVentasGrip`, `scrollWidth` ≈ 555 vs
`clientWidth` 264), por eso a simple vista solo se ven 2 de las 4 columnas de cada una. Hay que hacer
`scrollLeft = scrollWidth` para ver Despacho / Cambio por cambio / Inv. Actual / Dev. Distribución.

⇒ **El desglose SÍ tiene evidencia visual**, y así quedó en el PDF (Fig. 3 y 4). Conviene corregir el patrón
en `module-selectors/` para que futuras corridas no lo den por ausente.

## 4. Dato operativo: el modal del sugerido se puede reabrir en un inventario ya enviado

Desde `Inventarios → BUSCAR → Ref 48 → RESUMEN` el botón **PEDIDO SUGERIDO** abre el modal y **recalcula**,
aun con el inventario en estado Enviado. El botón **ACEPTAR aparece deshabilitado**, así que la lectura es
segura: sirve para tomar evidencia sin crear nada. Verificado tras la corrida: `max(id_order)` siguió en 49 y
`max(id_client_stock)` en 50.

## 5. Lo verificado en la web (resumen del cotejo)

Los 5 registros (inventarios 48/49/50, pedidos 48/49) aparecen en sus listados dentro del rango por defecto
01/08–11/08/2026, bajo `HIDROPONIAS VENEZOLANAS C.A`. **73 campos cotejados, 0 diferencias**: cliente,
sucursal, fecha, vendedor, cantidad de líneas, cantidades por producto, montos y el enlace cruzado
inventario ↔ pedido (48↔48, 50↔49; el inventario 49, sin pedido, no muestra el enlace).
