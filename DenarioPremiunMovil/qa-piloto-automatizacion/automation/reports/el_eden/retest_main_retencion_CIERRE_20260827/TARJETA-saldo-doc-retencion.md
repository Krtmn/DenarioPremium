# El «Saldo doc.» no descuenta la retención

**Versión:** main (v22) · también presente en 6.6.21.1
**Módulo:** Transacciones → Cobros → Detalle del cobro (web) · con origen en el dato que envía la móvil
**Prioridad:** Alta — afecta el saldo pendiente del cliente
**Detectado por:** QA · 26-27/08/2026

---

## Qué pasa

Cuando un cobro lleva **retención** y **pago parcial** sobre el mismo documento, el **«Saldo doc.»**
del detalle del cobro muestra el saldo **sin descontar el monto retenido**. Queda inflado exactamente
en lo que se retuvo.

La deuda del cliente baja por **el pago más lo retenido**, pero el saldo solo descuenta el pago.

---

## Reproducido 3 veces, en 2 clientes y 2 versiones

| # | Cliente · versión | Documento | Retenido | **Muestra** | **Debería** | Infla |
|---|---|---|---:|---:|---:|---:|
| 1 | EL PALMAR · 6.6.21.1 | `010000016710032023` | 25,00 | 37.581,82 | 37.556,82 | **25,00** |
| 2 | EL EDEN · main | `AJPM50001785` (cobro **1037**) | 25,00 | 79,00 | 54,00 | **25,00** |
| 3 | EL EDEN · main · **manual** | `AJPM50001336` (cobro **1043**) | 15,00 | 51,58 | 36,58 | **15,00** |

La diferencia es **siempre exactamente el monto retenido**. El caso 3 se hizo a mano, sin automatización.

---

## Alcance: solo la combinación falla

| Escenario | Resultado |
|---|---|
| Pago parcial **sin** retención (cobro 1034) | ✅ correcto — `687.558,45 − 5.000,00 = 682.558,45` |
| Retención **sin** pago parcial | el campo guarda el saldo del documento, sin tocarlo |
| **Pago parcial + retención** | ❌ **inflado en el monto retenido** |

---

## 🔴 Dato clave: el campo cambió de significado

Se revisó qué guarda `collection_detail.nu_balance_doc` en toda la base de EL EDEN:

| Tipo de fila | Total | Guarda el **saldo del documento** | Guarda el **remanente** |
|---|---:|---:|---:|
| Sin pago parcial | 779 | **756** | 0 |
| Con pago parcial | 15 | **12** | **3** |

**Solo 3 filas en toda la base guardan el remanente — y las 3 son de esta semana** (cobros 1034, 1037 y
1043, creados con los builds recientes).

⇒ **Históricamente ese campo siempre fue una foto del saldo del documento al momento del cobro.**
Calcular el remanente ahí es comportamiento **nuevo**, introducido por los cambios recientes de Cobros.

---

## Propuesta de corrección

**El campo `nu_balance_doc` debe volver a ser lo que siempre fue: el saldo del documento al momento del
cobro.** La móvil no debería escribir remanentes ahí — rompe la coherencia con el 97% del histórico.

**El remanente lo calcula la web**, al presentar el detalle:

```
Saldo pendiente = Saldo doc. − Monto a pagar − Retención IVA − Retención ISLR
```

Todos esos valores ya están en la misma fila del detalle, no hace falta dato nuevo.

### ⚠ Advertencia para quien implemente

**El monto pagado no significa lo mismo en todos los tipos de cobro.**
En un cobro normal (`co_type = 0`) excluye las retenciones, así que hay que restarlas aparte.
En un **cobro de tipo Retención (`co_type = 2`) el monto pagado YA equivale a lo retenido**: restarlas de
nuevo las duplicaría.
⇒ La fórmula **debe ramificar por `co_type`**.

### Observación aparte (menor prioridad)

Hoy la columna «Saldo doc.» tiene **significado mixto** en la misma tabla: en las filas con pago parcial
muestra el remanente y en las demás el saldo previo. Conviene definir qué debe significar y unificarlo.

---

## Pasos para reproducirlo a mano

1. Cobros → **COBRO** → cliente `00069` (AUTOMERCADOS FRESCO MARKET AFN - CLUB DE CAMPO)
2. Cambiar la moneda del cobro a **US$** (nace en BS; hacerlo **antes** de elegir documentos)
3. Tab **Documentos** → marcar un documento con saldo (ej. `AJPM50001336`, saldo 951,58)
4. Abrirlo con la **lupa** → cargar **retención** (IVA 10 · ISLR 5) → activar **Pago parcial** →
   *Monto a pagar* **900** → **Guardar**
5. Tab **TOTAL** → «Monto Saldo» muestra **36,58** ✅ *(la app calcula bien)*
6. Tab **PAGOS** → método Efectivo **900,00** → Tab **ADJUNTOS** → adjuntar imagen → **Enviar**
7. Web → **Transacciones → Cobros** → filtrar por `# Ref` → **Consultar**
8. Tabla **«Documentos Pagados»** → columna **«Saldo doc.»** muestra **51,58** ❌
   *(debería ser 36,58 — inflado en los 15,00 retenidos)*

---

## Lo que NO se ha validado todavía

1. **Cobro de tipo Retención (`co_type = 2`)** en la capa del dato guardado — es justo el caso donde una
   corrección mal planteada duplicaría el descuento. **Probarlo antes de dar el arreglo por bueno.**
2. Si hay documentos históricos ya afectados que requieran corrección de datos.

---

## Nota sobre la app móvil

En **main** la app **ya muestra el saldo correcto en pantalla** (36,58): eso se corrigió y funciona.
El problema es que **el dato que se guarda sigue siendo el inflado**, así que la app y el sistema
muestran números distintos para la misma transacción.

⚠ Eso es lo que hace este defecto más peligroso que antes: el vendedor valida contra su teléfono, ve el
número correcto y lo da por bueno; la diferencia solo aparece aguas abajo, sin ningún punto donde
detectarla.

---

**Evidencia adjunta:** informe con capturas de las dos pantallas (app y web) sobre la misma transacción,
mediciones por capa y comparativa entre versiones.
