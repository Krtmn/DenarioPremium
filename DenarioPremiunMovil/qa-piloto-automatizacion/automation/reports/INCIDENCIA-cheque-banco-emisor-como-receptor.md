# INCIDENCIA · Cheque: el Banco Emisor se guarda en el campo del Banco Receptor

**Detectado:** 2026-09-04, reconfirmado el 2026-09-07 con el APK vigente
**Cliente / playa:** IMPORTADORA 4K (`DIESE`) · Caribe
**Módulo:** Cobros — método de pago **Cheque**
**Severidad:** media — no afecta montos ni impide cobrar; **se pierde la trazabilidad** del banco de origen

> **Por qué está en una tarjeta aparte.** Se detectó validando el REQ del catálogo de bancos, pero
> **no es de ese requerimiento**: el catálogo entrega el banco correctamente y el selector del móvil
> lo ofrece bien. El problema está en **dónde se guarda ese dato al armar el pago con Cheque**.

---

## Qué pasa

El vendedor elige un banco en el campo **Banco Emisor** del cheque. Ese banco termina guardado en
`na_bank` —el campo del **Banco Receptor**— y el campo del emisor queda **vacío**.

En la web, el detalle del cobro muestra **«Banco Emisor» en blanco** y el banco elegido aparece bajo
**«Banco receptor»**.

### Ref 2618 · las tres capas

| Capa | Qué se observó |
|---|---|
| **Móvil** | El vendedor seleccionó **BANCO DE VENEZUELA** como *Banco Emisor* |
| **Nube** | `na_bank = 'BANCO DE VENEZUELA'` (campo del receptor) · `nu_collection_payment = ''` (emisor, vacío) |
| **Web** | *Banco Emisor* → **en blanco** · *Banco receptor* → **BANCO DE VENEZUELA** |

Un detalle adicional del mismo cobro: `co_client_bank_account` trae **`'BANCO DE VENEZUELA'`**, un
**nombre** en un campo de **código**. En los cobros de Pago Móvil ese campo trae códigos (`555`,
`0105`), lo que confirma que en Cheque el mapeo de campos está cruzado.

## Reproduce de forma consistente

| Cobro | Fecha | APK |
|---|---|---|
| 2612 | 04/09 | anterior |
| 2614 | 04/09 | anterior |
| **2618** | **07/09** | **el vigente** |

## Está ACOTADO a Cheque

No ocurre en los otros métodos, y se comprobó de forma que el resultado no fuera ambiguo:

| Método | Resultado |
|---|---|
| **Pago Móvil** (2616, 2617) | Emisor y receptor en sus campos correctos |
| **Transferencia** (2620, 2621) | Correcto — y el caso **sí discrimina**, porque emisor y receptor son bancos **distintos** |

⚠ El cobro 2619 **no sirve como evidencia** de que Transferencia funcione: ahí emisor y receptor eran
ambos PROVINCIAL, así que un cruce de campos habría pasado inadvertido. Por eso se repitió con
bancos distintos.

## Cómo reproducirlo

1. Móvil → **Cobros** → cliente con documentos → marcar una factura.
2. Pestaña **Pagos** → *Agregar método* → **Cheque**.
3. Elegir cualquier banco en **Banco Emisor**, completar los datos del cheque y **enviar**.
4. Web → **Transacciones → Cobros** → filtrar por `# Ref` → **Consultar** → sección *Tipos de Pago*.
   El banco elegido aparece bajo **Banco receptor** y *Banco Emisor* está vacío.

## Consulta de verificación (solo lectura)

```sql
SELECT c.id_collection,
       cp.co_payment_method,
       cp.na_bank                AS receptor,
       cp.nu_collection_payment  AS emisor,
       cp.co_client_bank_account AS cta_codigo
  FROM collection_payment cp
  JOIN collection c USING (id_collection)
 WHERE cp.co_payment_method = 'ch'
 ORDER BY c.id_collection DESC;
```

En un cheque correcto, `emisor` debería traer el banco y `receptor` quedar vacío —Cheque **no tiene**
Banco Receptor en el formulario del móvil—. Hoy ocurre exactamente al revés.

## Impacto

- **No afecta el dinero:** montos, conversión y diferencia de cobro cuadran (verificado en 2618:
  65.250,00 Bs ÷ 870 = 75,00 USD, diferencia 0,00).
- **Sí afecta la trazabilidad:** no queda registro de qué banco emitió el cheque, y el banco que se
  muestra está en un campo que no le corresponde. Cualquier reporte que agrupe por banco receptor
  contará cheques que en realidad no tienen receptor.

## Evidencia

`automation/reports/4k/req_crud_bancos_20260907/img/B19-cheque-movil.png` (lo que eligió el vendedor)
`automation/reports/4k/req_crud_bancos_20260907/img/B19-cheque-2618-web-H3.png` (cómo lo muestra la web)
Informe completo: `automation/reports/4k/req_crud_bancos_20260907/INFORME-TESTING-CRUD-BANCOS.pdf`
