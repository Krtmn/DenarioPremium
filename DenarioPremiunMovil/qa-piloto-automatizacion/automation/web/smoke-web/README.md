# Guiones smoke WEB — índice

Especificación de qué valida la capa web y con qué oráculo. Los agentes leen **`WEB-RUNTIME.md`**
(cómo operar) **+ el guión del módulo** (qué validar).

## Los 7 transaccionales — corrida normal (`QA_WEB=1`)

| Guión | Módulo | Distintivo |
|---|---|---|
| `smoke-web-cobros.md` | Cobros | **el más rico**: ramifica por `co_type` (normal / anticipo / retención), cada uno con estructura distinta |
| `smoke-web-pedidos.md` | Pedidos | Σ líneas, descuentos, conversión, totales de cabecera |
| `smoke-web-depositos.md` | Depósitos | 💎 oráculo cerrado: **Σ(cobros hijos) == monto depositado** |
| `smoke-web-devoluciones.md` | Devoluciones | ⚠ **sin montos**: se valida cantidad, lote, factura, motivo |
| `smoke-web-inventarios.md` | Inventarios | cantidad **separada por ubicación** (Depósito / Exhibición) |
| `smoke-web-visitas.md` | Visitas | 🔴 **`Editar`/`Eliminar` por fila** — la superficie más peligrosa |
| `smoke-web-clientes-potenciales.md` | Clientes potenciales | 🔑 el detalle **no expone `No. de Ref.`**: el epoch es la única llave |

## Corrida alterna — solo a pedido explícito de QA

| Guión | Qué cubre |
|---|---|
| `smoke-web-extendido.md` | **Todo lo que los 7 anteriores NO cubren**: reportes, indicadores, facturaciones, datos maestros, estructura comercial y configuración. **No necesita dispositivo ni corrida móvil.** Se lanza con `guiones-regresion/prompt-web-extendido.md` |

---

## Las 4 familias de casos

Cada guión transaccional organiza sus casos en cuatro familias. **Solo una depende del móvil**, y eso
determina cuándo puede correr cada una:

| Prefijo | Qué valida | ¿Depende del móvil? | Cuándo corre |
|---|---|---|---|
| **`C##`** | **Cotejo** — que lo que el móvil envió llegó bien y los cálculos cuadran | ✅ sí (manifiesto) | en *offset*, tras el módulo móvil |
| **`F##`** | **Filtros** — que la web encuentra lo que se le pide | ❌ no | desde el minuto 0 |
| **`M##`** | **Muestreo BD ↔ web** — 20-30 registros históricos contra la BD | ❌ no | relleno |
| **`D##`** | **Comportamiento** — paginación, orden, columnas, lista vacía | ❌ no | relleno |

**Por qué importa la separación:** solo `C##` necesita esperar al móvil. Las otras tres **llenan los huecos**
de la ventana de 3 h y pueden arrancar junto con el login. Es lo que permite meter ~2 h de trabajo web
sin sumar wall-clock.

⚠ **Los `F##` corren primero.** El cotejo entero depende de que el filtro `# Ref` funcione: si está roto,
todos los `C##` darían `WEB-MISSING` falso.

💎 **Los `M##` son los que más defectos encuentran.** El único defecto de producto que la capa web halló
—`COB-RET-TOTAL-CERO`— apareció comparando **un** registro contra la BD. Con 20-30 por módulo, la misma
técnica cubre muchísimo más, y es barata: lectura masiva, sin crear nada.

## Niveles de los filtros

🔴 **crítico** (siempre — de ellos depende el cotejo) · 🟡 **módulo** (si hay presupuesto) ·
🟢 **opcional** (solo en validación profunda de la web).

## Reglas que valen para todos

- 🔴 **READ-ONLY.** Solo `Buscar` / `Limpiar` / `Consultar`. La web es producción.
- 🔴 **Guarda de playa antes de leer**: las 3 playas exponen **las mismas rutas**.
- 🔴 **`form:pedidosDT` lo comparten 5 módulos** (y algunos detalles) → nunca identificar el contexto por el ID de la tabla.
- **Observación mínima**: nada de `browser_snapshot` para operar; solo el JSON del oráculo.
- **Números**: `parseNumeroFlexible`. **Conversión**: la dirección depende de la moneda (BS→US$ divide · US$→BS multiplica).
- **Fechas**: veredicto por día; hora distinta = nota.
- **Estatus**: leerlo de la web o vía `transaction_statuses`; **nunca** interpretar `st_*` con el catálogo `statuses`.
- **Local-driven**: campo lleno en el origen se compara; vacío se saltea.

*Escritos sobre oráculos verificados en la corrida `el_valle-20260728` · 2026-07-28*
