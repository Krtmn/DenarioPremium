-- CENTINELA: cobros que perdieron nu_amount_total teniendo pagos reales.
-- Defecto EN OBSERVACION (no reportado, decision QA 2026-08-06): no se reproduce a demanda.
-- Origen: el_palmar 2026-08-05, 5 casos (27076, 27077, 27082, 27085, 27086), ventana 12:48-15:00.
-- Sintoma visible: en el LISTADO web de /pages/cobros, columnas `Monto conv.` y `Tasa conv.`
--   muestran "N/A". El detalle sale bien.
--
-- IMPORTANTE - el filtro de PAGOS es imprescindible:
--   en co_type=2 (retencion) nu_amount_total=0 es NORMAL (no llevan filas de pago).
--   Sin ese filtro salen 44 falsos positivos historicos.
--
-- Uso:  node automation/db/query.js "<cliente>" "$(grep -v '^--' automation/db/check-total-cero.sql | tr '\n' ' ')"
SELECT c.id_collection, c.co_type, c.co_enterprise, c.co_client, c.co_currency,
       c.nu_amount_total, c.nu_amount_final, c.nu_difference, c.nu_value_local,
       (SELECT count(*) FROM collection_payment p WHERE p.co_collection = c.co_collection) AS n_pagos,
       c.tx_comment, c.da_collection
FROM collection c
WHERE c.co_operation <> 'D'
  AND c.nu_amount_total = 0
  AND c.nu_amount_final > 0
  AND (SELECT count(*) FROM collection_payment p WHERE p.co_collection = c.co_collection) > 0
ORDER BY c.da_collection DESC
