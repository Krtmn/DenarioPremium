# Smoke — PRODUCTOS
## Módulo de solo lectura — no crea ni modifica datos
## Estado inicial: HOME | Estado final: HOME

**Inicio:** `h.connectCdp(page)` → `h.waitSyncOverlay(pg)`
**Datos de prueba:** leer `automation/clientes/{QA_CLIENTE}.yaml` → `modules.productos`

---

## Casos

| ID | Acción clave | PASS cuando | FAIL / N/A |
|----|-------------|-------------|------------|
| DM-PRD-001 | Click módulo Productos | Estructuras visibles con selector tipo + lista | FAIL: pantalla vacía |
| DM-PRD-002 | `h.selectIonPopover` selector tipo → cambiar a otro tipo | Lista de estructuras actualiza | FAIL: lista no cambia |
| DM-PRD-004 | Click en estructura (`h.clickIonItem`) | Lista de productos visible con código y precio | FAIL: lista vacía |
| DM-PRD-006 | `h.fillIonInput` texto en searchbar (`texto_busqueda`) | Resultados filtrados | FAIL: no filtra |
| DM-PRD-007 | `h.fillIonInput` texto sin coincidencias ("ZZZZZZZ") | Mensaje "No hay productos disponibles" | FAIL: lista no vacía |
| DM-PRD-009 | `h.scrollInfinite(pg)` | Más productos cargan (o spinner desaparece si no hay más) | FAIL: spinner infinito |
| DM-PRD-012 | Click en producto | Detalle con nombre, código, precio USD y BS, unidad | FAIL: detalle vacío |
| DM-PRD-013 | `h.selectIonPopover` selector lista de precios | Precio se actualiza al cambiar lista | FAIL: precio no cambia |
| DM-PRD-019 | Click botón "Volver" (arrow-back en header) | Regresa a lista de estructuras | FAIL: navega a otro lugar |
| DM-PRD-020 | `h.clickBack(pg)` desde detalle | Lista de productos del tipo activo | FAIL: va a estructuras |
| DM-PRD-021 | `h.clickBack(pg)` desde estructuras | Home principal | FAIL: queda en módulo |
