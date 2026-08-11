# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260729_133234_smoke-completo` |
| Módulo | PRODUCTOS (solo lectura) |
| Dispositivo | Android · WebView PID 21744 · CDP `:9220` |
| App | `com.kiberno.denarioPremiumPro` — app_version `1.0` · db_version 19 · `window.ng=true` |
| Playa | isla_coche — `http://denarioislacoche.ddns.net:8081/PremiumWS` |
| Empresa / Usuario | LATINOCOSMETICA C.A. (co 00001, única) · co_login 100 — NEIMY PARRA (id_user 477) |
| Resultado | **9 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |
| Watchdog | `moduleMs` 45 min · 0 cuelgues · 0 reconexiones |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | Tile Productos → `/productos`, `product-structures-list` visible con 2 `ion-select` (sel[0]=empresa "LATINOCOSMETICA C.A." 1 opción · sel[1]=tipo "Marca") y 4 estructuras: BELOTTI 74 · BELOTTI COLOR PLUS 0 · PROKPIL 70 · ROIAL 8 |
| DM-PRD-002 | ✅ PASS | sel[1] Marca→**Categoria**: la lista pasa de 4 a **13** estructuras (CERA 6 · CRESPOS 4 · CUIDADO FACIAL 12 · DEPILACION 2 · LINEA CAPILAR 33 · LINEA CEPILLOS 11 · LINEA COLOR 17 · LINEA UÑAS 1 · MANTENIMIENTO COLOR 58 · MASCARILLA 3 · MILKERATIN 3 · RIZOS 1 · THERAPY 1). Vuelta a Marca → 4 estructuras idénticas |
| DM-PRD-004 | ✅ PASS | Click estructura BELOTTI → `product-list` con **50** ítems; cada uno con Nombre, `Código:`, `Precio: N,NN $`, `IVA: 16,00 %`, `Inventario: N` |
| DM-PRD-006 | ✅ PASS | Búsqueda "CEBOLLA" (focus + `keyboard.type` + `Enter`): 50 → **4** resultados, todos coincidentes; incluye el `producto_test` `3058` BELOTTI ACOND CEBOLLA X 300 ML |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ": 0 `ion-item`, `ion-list` vacío y **"No hay productos disponibles"** renderizado como `<p class="search-empty-state">` (patrón La Tortuga, no `ion-item`) |
| DM-PRD-009 | ✅ PASS | Baseline 50 (búsqueda "BELOTTI") → `ionInfinite` 1º = **59** · 2º = 59 sin cambio y `ion-infinite-scroll.disabled=true`, spinner desaparece (catálogo agotado, sin spinner infinito) |
| DM-PRD-012 | ✅ PASS | Detalle de `3058`: Nombre BELOTTI ACOND CEBOLLA X 300 ML · Código 3058 · Estructura Producto LINEA CAPILAR · Unidad de venta UNIDAD · Lista de precio DETAL · Precio **5,23 $** · IVA 16,00 % · Almacén ALMACEN PRINCIPAL · Inventario 23. Campos núcleo completos |
| DM-PRD-013 | 🚫 N/A | **N/A estructural, confirmado con dato vivo:** el `ion-select` "Lista de precio" del detalle trae **1 sola opción ("DETAL") y viene `disabled=true`** (`userCanChangePriceList=false`). No hay 2ª lista a la cual cambiar → no reproduce ni descarta el defecto romher |
| DM-PRD-020 | ✅ PASS | Back desde detalle (`productos-header > a`, coords ~34,51) → vuelve a `product-list` del tipo activo (NO a estructuras) |
| DM-PRD-021 | ✅ PASS | Back desde `product-structures-list` (coords ~32,47) → `/home` con `app-home` y los 10 tiles |

## Registros creados en sistema

Ninguno — módulo de **solo lectura**. `BD-N/A` (RUNTIME §10 no aplica).

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | — | — |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Back de PRODUCTOS: `productos-header > a` **sí** matchea en La Tortuga v6.6.18 | universal (refuerza) | El fallback `img[src*="flecha-blanca"]` no hizo falta. Coords estables: detalle ~(34,51), estructuras ~(32,47). Reconfirma que PRODUCTOS **no** usa `img.fechaAtras` |
| Back desde `product-list` sale **directo a HOME** | universal (reconfirma) | 4ª playa que lo confirma (gmp/ins/dth/dm-electronica). Único nivel de back real: detalle → `product-list`. Para probar DM-PRD-021 hay que **re-entrar** a Productos y hacer back desde estructuras |
| Empty-state de búsqueda = `<p class="search-empty-state">` fuera de `ion-list` | cliente / build La Tortuga (reconfirma) | Reconfirma `[latino_cosmetica-20260714]`. Al validar DM-PRD-007 buscar el texto en **todo** `product-list`, no asumir `ion-item` |
| 🔴 **Limpiar la búsqueda NO restaura la lista de la estructura** | cliente / build La Tortuga (nuevo) | Vaciar el input (Backspace×N) + `Enter` deja la lista en **0 ítems** con el empty-state, en vez de volver a los 50 de la estructura. Se esperó 3,7 s + 3 s extra: no se recupera. **Workaround para automatización:** re-buscar un término amplio ("BELOTTI") o re-entrar a la estructura. Ver Hallazgos |
| La lista muestra `IVA: 16,00 %` por ítem | cliente | `product-list` y detalle muestran **solo precio USD** (sin Bs) + línea de IVA. Reconfirma el patrón de latino_cosmetica/piercar/ferrenuestro |
| `product-list` re-renderiza solo los ítems visibles al volver del detalle | universal (nota) | Tras DM-PRD-020 el DOM trae 9 de los 59 ítems (virtualización de render). **No contar ítems del DOM como oráculo de datos justo después de un back** — medir tras scroll/settle |
| Estructura nueva con conteo 0: "BELOTTI COLOR PLUS 0" | cliente (dato) | El catálogo pasó de 3 a **4** estructuras por Marca vs. el YAML (BELOTTI 74 / PROKPIL 70 / ROIAL 8). La nueva tiene **0 productos** — es dato de servidor, no defecto |

## Hallazgos

Sin FAIL. Se registra una observación de comportamiento que **no corresponde a ningún caso del guión** (por eso no altera los counts) pero es reproducible y visible para QA manual:

**OBS-PRD-01 · Limpiar el campo de búsqueda deja la lista vacía en vez de restaurar la estructura.**
- **Pasos:** Productos → tipo Marca → estructura BELOTTI (50 productos) → escribir "CEBOLLA" + Enter (4 resultados) → borrar el texto del campo → Enter.
- **Esperado:** vuelven a mostrarse los productos de la estructura.
- **Observado:** la lista queda en **0 ítems** con "No hay productos disponibles". Persiste tras ~7 s de espera. Se recupera escribiendo cualquier término válido, o re-entrando a la estructura.
- **Severidad sugerida:** menor/UX — no bloquea ningún flujo transaccional y el módulo es de solo lectura. Sugerido para triaje del equipo; **no** levantado como defecto formal por estar fuera del alcance de los casos DM-PRD asignados.

## Cierre

Los 10 casos asignados se ejecutaron. Nada quedó sin probar por limitación de automatización: el único caso no ejecutado como PASS/FAIL es **DM-PRD-013**, y es **N/A estructural verificado con dato vivo** (una sola lista de precio "DETAL", selector `disabled`), no un bloqueo. 0 cuelgues de CDP, 0 reconexiones, ningún selector consumió más de 1 intento. App devuelta a HOME.
