# Smoke — VENDEDORES
## Módulo de solo lectura — no crea ni modifica datos
## Estado inicial: HOME | Estado final: HOME

**Inicio:** `h.connectCdp(page)` → `h.waitSyncOverlay(pg)`
**Datos de prueba:** leer `automation/clientes/{QA_CLIENTE}.yaml` → `modules.vendedores`

---

## ⚠ Verificar antes de ejecutar

Leer `modules.vendedores.aplica` del perfil cliente:
- Si `aplica=false` (o `vgs.esVendedor=false`) → módulo no visible en Home → marcar **todos N/A**, navegar a Home.
- Si `aplica=true` → ejecutar normalmente.

---

## Casos (solo si `aplica=true`)

| ID | Acción clave | PASS cuando | FAIL / N/A |
|----|-------------|-------------|------------|
| DM-VND-001 | Click módulo Vendedores desde Home | Overlay desaparece; `app-vendedores` con acordeones de empresa visibles | FAIL: pantalla vacía o overlay permanente |
| DM-VND-002 | Click en acordeón empresa → expandir | Contenido/KPIs visibles; click nuevamente → contraído | N/A si API no devuelve datos (contenido vacío no es FAIL) |
| DM-VND-007 | `h.clickBack(pg)` | Home principal con módulos | FAIL: navega a lugar incorrecto |
