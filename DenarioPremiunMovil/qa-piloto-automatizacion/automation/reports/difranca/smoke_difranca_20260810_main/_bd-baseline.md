# Baseline de BD — difranca en `main`

Tomado por el orquestador **antes** de que ningún agente creara transacciones.
`RUN_ID`: `smoke_difranca_20260810_main` · **2026-08-10 16:30 UTC** · base `difranca` (El Yaque).

Sin esta foto previa, el diff posterior no prueba nada: no se puede distinguir lo que creó
la corrida de lo que ya estaba.

| Tabla | Filas (`co_operation<>'D'`) | Último `da_created` |
|---|---:|---|
| `order` | **16.560** | 2026-08-07 18:03 |
| `collection` | **19.782** | **2026-08-10 16:06** ← hoy |
| `return` | **795** | 2026-08-07 17:47 |
| `visit` | **26.072** | 2026-08-07 18:18 |
| `client_stock` | **16** | 2026-08-07 14:00 |
| `client` | **4.558** | 2026-07-30 |

## 🔴 El tenant está VIVO: 7 cobros creados hoy

| Tabla | Creados hoy |
|---|---:|
| `collection` | **7** |
| `order` / `return` / `visit` | 0 |

**Dos consecuencias para la corrida:**

1. **El conteo de `collection` se mueve solo.** Cualquier diff contra 19.782 puede incluir cobros
   que no creamos nosotros. Cobros es **solo lectura** en esta corrida, así que **todo** incremento
   es ajeno — pero hay que decirlo explícitamente en el reporte, no asumirlo.
2. **Son cobros recién hechos sobre `main`** ⇒ material de validación gratis y fresco: sirven para
   verificar cálculos y para el cotejo con el listado web sin tener que crear nada.

## 🔴🔴 CORRECCIÓN AL PERFIL — INVENTARIOS **SÍ** SE PRUEBA

`difranca.yaml` trae `inventarios.aplica: false` con motivo *"N/A ESTRUCTURAL — `clientStock=false` ⇒ el
módulo no debería existir"*. **Eso es INCORRECTO y queda derogado para esta corrida.**

**Instrucción explícita de la QA (2026-08-10):** *"inventarios por supuesto que hay que probarlo en el
móvil, con su guion smoke"*. ⇒ El agente de INVENTARIOS ejecuta `automation/smoke/smoke-inventarios.md`
**completo**. **Prohibido marcar el módulo N/A por la VG o por ausencia de UI.**

Evidencia que respalda la corrección:
1. **El tile de Inventarios ESTÁ presente en HOME** — verificado por el agente de login sobre este build.
2. `client_stock` tiene **16 filas, y la última es del 2026-08-07 14:00** — de hace tres días, **no**
   residuales de 2023 como suponía el perfil (el rango real va de 2023-02-08 a 2026-08-07).

⇒ Al cerrar la corrida hay que **corregir `clientStock` a `true`** en el perfil, con esta evidencia. Es
exactamente la trampa documentada: *si el módulo aparece, todo el mapa de N/A cambia*. El propio YAML lo
había marcado `⚠️VERIFICAR` — y la verificación dice que la predicción estaba mal.

⚠ Ojo al interpretar: `requireClientStock=false` sigue siendo plausible (no obliga toma de inventario
**antes** del pedido). Que el módulo exista no implica que sea obligatorio.

## Nombres de tabla (ya resueltos, no re-descubrir)

- Devoluciones ⇒ **`return`** (no `returns`). También existen `return_view`, `return_detail`,
  `return_type`, `return_motive`, `return_category`.
- `collection` **no tiene `co_user`** — para agrupar por vendedor hay que usar otra columna.
- Descuento global del cliente ⇒ `client.qu_discount` (**no** `nu_discount`).
  🔴 En difranca: **0 de 4.558 clientes** tienen descuento en ficha (todos `0.0000`), y QA confirmó
  que no manejan descuentos globales ⇒ **cualquier descuento global en un pedido es del sistema,
  no del dato.** Es el control limpio para el defecto candidato de descuento automático en la web.
