-- ═══════════════════════════════════════════════════════════════════════════════
-- INCIDENCIA · Móvil — "Crédito Disp." muestra la moneda equivocada
--
-- SÍNTOMA
--   En el detalle de cliente, las dos líneas de "Crédito Disp." están cruzadas:
--     · lo rotulado BS  es en realidad el importe en USD
--     · lo rotulado USD es ese mismo importe DIVIDIDO otra vez por la tasa
--   Los saldos propiamente dichos SÍ están correctos: el problema está acotado a esa línea.
--
-- CAUSA IDENTIFICADA
--   La app asume que el saldo del cliente está SIEMPRE en la moneda local (BS) e
--   IGNORA `client.co_currency`. En los tenants cuyos documentos están en USD la
--   premisa se rompe: rotula mal Y convierte en el sentido contrario (divide en vez
--   de multiplicar).
--
-- PRUEBA CRUZADA (lo que confirma la causa)
--   · KRON        -> documentos en USD -> la premisa se rompe -> SE VE el defecto
--   · GRUPO FIEL  -> documentos en BS  -> la premisa se cumple -> NO se ve
--   Es la misma lógica dando bien en un caso y mal en el otro, según la moneda del tenant.
--
-- Detectado: corrida QA 2026-08-17 · RUN_ID 20260817_145314_smoke-completo (kron / Isla Coche)
-- ═══════════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────────
-- 1) DEMOSTRACIÓN — un cliente concreto
--    Cambiar el `co_client` del WHERE por el que se quiera revisar.
--    Ejemplo usado en el reporte: ONCE ONCE, C.A  (J075129342, tenant kron)
-- ───────────────────────────────────────────────────────────────────────────────
WITH tasa AS (
  -- la tasa vigente: la del último cobro registrado
  SELECT nu_value_local AS valor
  FROM collection
  WHERE co_operation IS DISTINCT FROM 'D' AND nu_value_local > 0
  ORDER BY da_collection DESC
  LIMIT 1
),
saldo AS (
  -- el saldo REAL del cliente = suma de los documentos pendientes
  SELECT co_client,
         co_currency     AS moneda_documentos,
         sum(nu_balance) AS saldo_real
  FROM document_sale
  WHERE nu_balance > 0
    AND co_operation IS DISTINCT FROM 'D'
  GROUP BY co_client, co_currency
)
SELECT
  c.co_client                                             AS cliente,
  c.na_client                                             AS nombre,
  c.co_currency                                           AS moneda_del_saldo,   -- <-- la app NO lee esto
  s.moneda_documentos,
  c.nu_credit_limit                                       AS limite_credito,
  s.saldo_real,
  t.valor                                                 AS tasa,
  -- lo que DEBERÍA mostrar
  round(c.nu_credit_limit - s.saldo_real, 2)              AS correcto_en_usd,
  round((c.nu_credit_limit - s.saldo_real) * t.valor, 2)  AS correcto_en_bs,
  -- lo que MUESTRA hoy
  round(c.nu_credit_limit - s.saldo_real, 2)              AS app_muestra_rotulado_bs,
  round((c.nu_credit_limit - s.saldo_real) / t.valor, 2)  AS app_muestra_rotulado_usd
FROM client c
JOIN saldo s ON s.co_client = c.co_client
CROSS JOIN tasa t
WHERE c.co_client = 'J075129342';

-- RESULTADO OBTENIDO (kron, 2026-08-17, tasa 771,07):
--
--   cliente     nombre           moneda_del_saldo  limite  saldo_real   tasa
--   J075129342  ONCE ONCE, C.A   USD               0,00    38.535,92    771,07
--
--   correcto_en_usd            =        -38.535,92
--   correcto_en_bs             =    -29.713.891,83
--   app_muestra_rotulado_bs    =        -38.535,92   <-- es el USD, mal rotulado
--   app_muestra_rotulado_usd   =            -49,98   <-- 771 veces más chico de lo real
--
-- Es decir: la pantalla dice que el cliente debe 50 dólares cuando debe 38.535,
-- y que debe 38.535 bolívares cuando son casi 30 millones.


-- ───────────────────────────────────────────────────────────────────────────────
-- 2) ALCANCE — cuántos clientes del tenant quedan afectados
--    Correr esto en CADA base para dimensionar el impacto.
-- ───────────────────────────────────────────────────────────────────────────────
SELECT
  co_currency                    AS moneda_del_saldo,
  count(*)                       AS clientes_con_saldo,
  CASE WHEN co_currency IN ('USD', 'US$')
       THEN 'AFECTADO'
       ELSE 'no afectado' END    AS estado
FROM client
WHERE nu_balance > 0
  AND co_currency IS NOT NULL
GROUP BY co_currency
ORDER BY count(*) DESC;

-- MEDIDO EL 2026-08-17 (4 de 5 tenants consultados están afectados):
--
--   el_palmar     USD        2.489 clientes   AFECTADO
--   difranca      US$ / USD    883 clientes   AFECTADO
--   kron          USD          517 clientes   AFECTADO
--   hidroponias   USD          453 clientes   AFECTADO
--   grupo_fiel    BS           914 clientes   no afectado
--
--   ~4.300 clientes afectados solo en estos cuatro.


-- ───────────────────────────────────────────────────────────────────────────────
-- NOTAS PARA QUIEN CORRA ESTO
-- ───────────────────────────────────────────────────────────────────────────────
--
-- (a) NO usar `client.nu_balance` como saldo: es un campo acumulado histórico que
--     NO está mantenido. Medido en kron: para ONCE ONCE vale 23.336.492,03 mientras
--     el saldo real de sus documentos es 38.535,92. La relación entre ambos NO es
--     constante (va de 36,6 a 439,4 según el cliente), así que tampoco es una
--     conversión. La app hace bien en no usarlo: usa la suma de documentos.
--
-- (b) `co_operation IS DISTINCT FROM 'D'` en vez de `<> 'D'`:
--     en kron hay tablas donde `co_operation` viene NULL, y `NULL <> 'D'` es NULL,
--     así que el filtro clásico OCULTA filas válidas.
--
-- (c) ⚠ En algunos tenants `nu_credit_limit` vale 1e16 como centinela de
--     "sin límite" (visto en grupo_fiel). En esos casos el cálculo de crédito
--     disponible da números absurdos: filtrar con `nu_credit_limit < 1e15`
--     o tratar ese valor como "ilimitado".
--
-- (d) La tasa del CTE es la del último cobro. Si se quiere reproducir la pantalla
--     en una fecha concreta, reemplazar por la tasa de ese día.
