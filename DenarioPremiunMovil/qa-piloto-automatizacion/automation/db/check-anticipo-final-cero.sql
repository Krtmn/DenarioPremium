-- CENTINELA: anticipos (co_type=1) que perdieron nu_amount_final / nu_amount_total_conversion.
-- Defecto EN OBSERVACION (no reportado, decision QA 2026-08-07): no se reproduce a demanda.
-- Sintoma visible: el detalle web muestra "Monto pagado: 0,0000" teniendo pagos reales.
-- OJO: nu_amount_total SI queda bien; los que se pierden son final y total_conversion.
-- No reprodujo en 5 anticipos consecutivos del build actual (27073, 27087, 27089, 27114, 27115),
-- en VES y en USD. Los afectados conocidos son historicos (ene/mar 2026, tasas 419,98 y 577,55).
-- Uso: node automation/db/query.js "<cliente>" "$(grep -v '^--' automation/db/check-anticipo-final-cero.sql | tr '\n' ' ')"
SELECT c.id_collection, c.co_enterprise, c.co_currency, c.nu_amount_total,
       c.nu_amount_final, c.nu_amount_total_conversion, c.nu_value_local,
       (SELECT round(sum(p.nu_amount_partial),4) FROM collection_payment p
         WHERE p.co_collection = c.co_collection) AS suma_pagos,
       c.tx_comment, c.da_collection
FROM collection c
WHERE c.co_operation <> 'D'
  AND c.co_type = 1
  AND (c.nu_amount_final = 0 OR c.nu_amount_total_conversion = 0)
  AND (SELECT count(*) FROM collection_payment p WHERE p.co_collection = c.co_collection) > 0
ORDER BY c.da_collection DESC
