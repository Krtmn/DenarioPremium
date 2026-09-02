# INCIDENCIA · `Monto doc. conversión` llega sin convertir

**Detectado:** 2026-09-02 · corrida `4k/req_crud_bancos_20260902`
**Cliente / playa:** GRUPO 4K (`DIESE`) · Isla Coche
**Dónde se ve:** web → Transacciones → Cobros → Consultar → tabla **Documentos Pagados**
**Campo:** `collection_detail.nu_amount_doc_conversion`
**Severidad:** media — **no afecta importes cobrados**, sí afecta lectura y cualquier reporte que sume esa columna

---

## Qué pasa

En un cobro en **divisa**, la columna **Monto doc. conversión** repite el monto en divisa en
vez de convertirlo a la moneda de conversión. En el **mismo renglón**, `Saldo doc. conversión`
sí viene convertido — de ahí que la inconsistencia salte a la vista.

REF **2679** (02/09/2026, 21,00 USD, tasa 905):

| Columna | Valor | Debería ser |
|---|---|---|
| Monto doc | 21,00 USD | — |
| **Monto doc. conversión** | **21,00** | **19.005,00 Bs** |
| Saldo doc | 21,00 USD | — |
| Saldo doc. conversión | 19.005,00 Bs | ✅ correcto |

**No es un defecto de la web.** El valor llega así a la nube: la web pinta fielmente lo que
recibió. El origen está en lo que envía el móvil.

## Por qué se reporta como regresión (y no como dato viejo)

Barrido sobre los **2.338** renglones de cobro en divisa de toda la base de 4K:

- **10 renglones afectados**: `2671 … 2680`, es decir **todos** los cobros creados el 01 y el
  02/09/2026, seguidos y sin una sola excepción.
- Último renglón **correcto**: 24/08/2026. Primero **afectado**: 01/09/2026.
- Misma moneda (USD), misma tasa (905), mismo tenant; entre los del 24/08 y los del 01/09
  hay incluso vendedores repetidos.

| # Ref | Fecha | Monto doc | Monto doc. conversión | Saldo doc. conversión | |
|---|---|---|---|---|---|
| 2667 | 24/08/2026 | 308,00 USD | 278.740,00 | 278.740,00 | ✅ |
| 2664 | 24/08/2026 | 1.168,00 USD | 1.057.040,00 | 646.622,50 | ✅ |
| 2671 | 01/09/2026 | 609,00 USD | **609,00** | 551.145,00 | ❌ |
| 2676 | 02/09/2026 | 375,00 USD | **375,00** | 339.375,00 | ❌ |
| 2679 | 02/09/2026 | 21,00 USD | **21,00** | 19.005,00 | ❌ |
| 2680 | 02/09/2026 | 30,00 USD | **30,00** | 27.150,00 | ❌ |

Los renglones del 24/08 se crearon con el build que el cliente tenía entonces; los del
01–02/09, con el APK compilado para este ciclo. **Sano antes, roto ahora**, con todo lo demás
igual. No se puede afirmar *qué* cambio lo introdujo — sí que **reproduce hoy** y que antes no.

## Qué NO rompe

El dinero está bien. Cuadran el monto cobrado, la suma de pagos, el total a pagar, la conversión
del total, el saldo del documento y la diferencia de cobro. El daño es de **lectura**: quien mire
esa columna —o un reporte que la sume— verá el importe en divisa rotulado como bolívares.

## Cómo reproducirlo

1. Móvil, cliente con moneda de cobro en **divisa** (4K: `C.0010`, USD, tasa 905).
2. Cobrar cualquier factura, enviar.
3. Web → Cobros → filtrar por `# Ref` → **Consultar** → desplazar la tabla *Documentos Pagados*
   hasta las columnas de conversión.

## Consulta de verificación (read-only)

```sql
SELECT c.id_collection, c.da_collection::date AS fecha, cd.co_document,
       cd.nu_amount_doc, cd.nu_amount_doc_conversion,
       cd.nu_balance_doc, cd.nu_balance_doc_conversion
FROM collection_detail cd
JOIN collection c USING (id_collection)
WHERE c.co_currency <> 'BS'
  AND cd.nu_balance_doc_conversion <> cd.nu_balance_doc   -- el renglón sí tiene conversión
  AND cd.nu_amount_doc_conversion  =  cd.nu_amount_doc    -- pero el monto no se convirtió
  AND cd.nu_amount_doc <> 0
ORDER BY c.id_collection DESC;
```

## Evidencia

`automation/reports/4k/req_crud_bancos_20260902/12-web-monto-doc-conversion.png`
y el informe `INFORME-CRUD-BANCOS.pdf` de esa misma carpeta.
