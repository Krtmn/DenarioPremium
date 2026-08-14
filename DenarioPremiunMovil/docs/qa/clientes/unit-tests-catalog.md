# Clientes — Catálogo de tests unitarios

**Specs incluidos en `npm run test:clientes`:**
- `src/app/services/clientes/client-logic.service.spec.ts`
- `src/app/clientes/.../client-list.component.spec.ts`
- `src/app/clientes/.../client-detail.component.spec.ts`
- `src/app/clientes/.../client-new-potential-client.component.spec.ts`
- `src/app/clientes/.../client-potential-client.component.spec.ts`
- `src/app/clientes/.../client-container.component.spec.ts`

**Correr:** `npm run test:clientes`  
**CI:** `.github/workflows/clientes-unit.yml`  
**Smoke dispositivo:** [smoke-manual.md](./smoke-manual.md)  
**Guion completo UI:** regresión DM-CLT-001..032 (Android).

Los unitarios validan **lógica de negocio** y ramas de navegación/flags. Overlay, SQLite real, GPS y Home→módulo quedan en smoke manual.

---

## 1. Saldos / lógica (`client-logic.service`)

| ID / caso | Qué hace |
|-----------|----------|
| **CLI-SALDOS-001** | `fixClientListSaldos`: AS04 (BS+docs USD) no 2,84; cliente local sin mutar `coCurrency`. |
| — | `resolveClientBalanceTotals` local/hard; sin tasa → opuesto 0. |
| **DM-CLT-002** | `isDueSoon`: ayer true, mañana false, null false (colores lista/docs). |
| **DM-CLT-032** | `checkUserStatus` lee `user.transportista`; `canShowConversion` exige tasa. |

## 2. Listado (`client-list`)

| ID | Qué hace |
|----|----------|
| **DM-CLT-003** | `runSearch` con texto → `searchClients`. |
| **DM-CLT-006** | `runSearch` vacío → `getClients` (listado completo). |
| **DM-CLT-007** | `onIonInfinite` página++ y API correcta (lista / búsqueda). |
| **DM-CLT-032** | Copia `esTransportista` a flag del componente. |

## 3. Detalle (`client-detail`)

| ID | Qué hace |
|----|----------|
| **DM-CLT-009** / **CLI-SALDOS-001** | `initializeClientBalances` usa `resolveClientBalanceTotals` + `isEnabled`. |
| **DM-CLT-010** | `onChangeAddress` actualiza dirección/coordenada/editable. |
| **DM-CLT-013** | `showDocVentasTab` oculto si transportista. |
| **DM-CLT-014** | `openDoc` setea documento y flags de navegación. |

## 4. Formulario potencial (`client-new-potential-client`)

| ID | Qué hace |
|----|----------|
| **DM-CLT-019** | Controles requeridos del `FormGroup`. |
| **DM-CLT-020** | `checkForm` vacío → cannot save/send. |
| **DM-CLT-021** | Campos válidos → habilita save/send. |
| **DM-CLT-022** | Email inválido → bloquea. |
| **DM-CLT-023** | Teléfono inválido → bloquea. |
| Laguna #4 | `naResponsible` vacío **no** bloquea `checkForm` (documentado). |

## 5. Listado potenciales (`client-potential-client`)

| ID | Qué hace |
|----|----------|
| **DM-CLT-029** | Labels de lista vacía / sin resultados. |
| **DM-CLT-030** | Filtro nombre/RIF/id + ventana de índice. |
| **DM-CLT-031** | Delete OK → splice del arreglo (mock BD). |

## 6. Container / navegación (`client-container`)

| ID | Qué hace |
|----|----------|
| **DM-CLT-016** | Back desde listado → home módulo. |
| **DM-CLT-017** | Back desde detalle → listado + `segment=default`. |
| **DM-CLT-018** | Back desde home clientes → `home`. |
| **DM-CLT-019** | `newPotentialClient` abre formulario. |
| **DM-CLT-029** | `findPotentialClient` abre listado potenciales. |

---

## Fuera de unitarios (manual / N/A)

| IDs | Motivo |
|-----|--------|
| **001** (ruta Home) | Navegación Ionic completa. |
| **002** overlay/SQLite, **004–005** UI template, **008** multiempresa visual | Device / condicional VG. |
| **011–012** GPS, **015** popover, **024–028** save/send/exit modal real | Persistencia / Ionic / GPS. |
| **032** UI completa transportista | Unit cubre flags; UI = smoke condicional. |
