# PENDIENTE — Pedidos que existen pero no se listan (`salesman_view`)

> 🕐 **Estado: EN PAUSA por decisión de QA (2026-08-07). Retomar el lunes 2026-08-10.**
> Este archivo existe para que la evidencia no se pierda: la medición multi-tenant
> se hizo en sesión y **no está en ningún otro reporte**.
> Detectado durante `web-pedidos-latortuga-20260807.md` (hallazgo H1 de ese reporte).

## Qué pasa

El listado de pedidos de la web hace **join contra `salesman_view`**. Esa vista excluye a los
usuarios dados de baja, así que **los pedidos de un vendedor dado de baja desaparecen del listado**.

**No es un borrado:** los pedidos existen, están `Enviado`, y **se abren normalmente buscándolos
por `# Ref`** — la ficha hasta muestra el nombre del vendedor de baja. Solo dejan de listarse.

Verificado contra la UI en La Tortuga/alipascua, rango 01/07–07/08:

```
BD (co_operation<>'D') ...... 1.831
Lista web ................... 1.725
Diferencia .................. 106   ← exactamente el NOT EXISTS contra salesman_view
```

🔴 **El join correcto es por `id_user`, NO por `co_user`.** Contar por `co_user` da un número
menor y equivocado (233 en vez de 385 en alipascua), porque **los códigos se reciclan** — ver abajo.

## Alcance medido (4 tenants, 2026-08-07)

| Tenant | Usuarios de baja | Pedidos ocultos | % | Monto |
|---|---:|---:|---:|---:|
| alipascua | 8 | **385** / 4.039 | 9,5 % | 297.700,09 |
| globalmp | 7 | **646** / 15.159 | 4,3 % | 194.170,55 |
| difranca | 1 | **93** / 16.560 | 0,6 % | 100.420,72 |
| el palmar | **0** | **0** / 13.772 | 0 % | — |

**Total: 1.124 pedidos · 592.291,36**

**el palmar NO es un contraejemplo, es el caso de control:** es el único tenant que nunca dio de
baja a un usuario, y es el único sano. La correlación es exacta. En cuanto den de baja a su primer
vendedor heredan el problema.

## El mecanismo (por qué es más amplio que "dar de baja a un vendedor")

```sql
-- pg_get_viewdef('salesman_view')
FROM users_data ud
  JOIN users u            ON ud.id_user = u.id_user
  JOIN users_enterprise ue ON ud.id_user = ue.id_user
  JOIN role_user ru        ON ud.id_user = ru.id_user
WHERE ud.co_operation <> 'D' AND u.co_operation <> 'D'
  AND ue.co_operation <> 'D' AND ru.co_operation <> 'D';
```

Son **cuatro tablas encadenadas**, y basta con que **una** marque `'D'` para que el usuario salga
de la vista. Quitarle el rol, o desasignarlo de la empresa, **borra su histórico del listado sin
que nadie haya dado de baja a nadie**. Por eso el problema es del producto, no de los datos.

## Agravante: los códigos de vendedor se reciclan

En alipascua, `co_user = '006'` corresponde a **dos** usuarios distintos:

| `id_user` | `co_user` | `co_operation` | pedidos |
|---:|---|---|---:|
| 471 | 006 | **D** (baja) | 152 |
| 487 | 006 | I (activo) | — |
| 472 | 007 | **D** (baja) | 233 |

Los 152 pedidos del `006` viejo no solo desaparecen del listado: **cualquier reporte que agrupe por
código se los atribuye al `006` actual**, que es otra persona.

## Lo que FALTA verificar el lunes

- [ ] **¿Otros módulos hacen el mismo join?** En alipascua hay **2 de 1.126 cobros** cuyo usuario no
      está en la vista. La aritmética de BD **no prueba** que el listado web de cobros use ese join
      — para pedidos sí se probó contra la UI, para cobros sería inferencia. **Hay que medirlo en la
      UI igual que se hizo con pedidos.**
- [ ] Devoluciones / visitas / depósitos dan 0 en alipascua, pero con volúmenes de 11, 5 y 1
      registro **eso no prueba nada**. Medir en un tenant con volumen.
- [ ] ¿La app **móvil** tiene el mismo hueco, o es solo la web?
- [ ] Confirmar el impacto real de negocio con la QA antes de redactar la tarjeta.

## Consultas para retomar

```bash
# ocultos por tenant (OJO: join por id_user)
node automation/db/query.js <tenant> "SELECT count(*) AS ocultos, round(sum(nu_amount_final),2) AS monto
  FROM \"order\" o WHERE o.co_operation<>'D'
  AND NOT EXISTS (SELECT 1 FROM salesman_view s WHERE s.id_user = o.id_user)"

# quiénes son
node automation/db/query.js <tenant> "SELECT o.id_user, o.co_user, count(*) FROM \"order\" o
  WHERE o.co_operation<>'D'
  AND NOT EXISTS (SELECT 1 FROM salesman_view s WHERE s.id_user = o.id_user)
  GROUP BY 1,2 ORDER BY 3 DESC"

# definición de la vista
node automation/db/query.js <tenant> "SELECT pg_get_viewdef('salesman_view'::regclass, true)"
```
