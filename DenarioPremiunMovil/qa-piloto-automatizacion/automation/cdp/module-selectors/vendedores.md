> Parte de `module-selectors/` — leer junto con `_comunes.md` (convención global).

## Módulo VENDEDORES

### Identidad
- Ruta: `/vendedores` · Componente raíz: `app-vendedores`
- Solo lectura · contenido: acordeones por empresa
- **Verificar `modules.vendedores.aplica` / `vgs.esVendedor`**

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Entrada HOME → Vendedores | tile = `app-home a.ion-text-center` que envuelve `<p class="nombreModulos">Vendedores</p>`; click vía `MouseEvent` en el `<a>` | `[dth-2612]` | confirma estructura de tiles de HOME en v6.6.14 |
| Heading rol | `<h1>Vendedor</h1>` en `app-vendedores` | `[gmp-2606]` | confirma `esVendedor=true` (no usar ng.getComponent en prod) |
| Acordeones empresa | `ion-accordion.accordion-collapsed` ↔ `.accordion-expanded`; content en `[slot="content"]`. **Expandir: asignar `grp.value = acc.value` al `app-vendedores ion-accordion-group` + `ionChange`** (contraer con `grp.value = undefined`) | `[gmp-2606][ins-2610][gmp-2611]` | oráculo de expansión por `getBoundingClientRect().height` (0 colapsado, >0 expandido) — no depender de `offsetParent`. ⚠ **`mouse.click` en coords del header NO expande** en este build (queda `accordion-collapsed`) — CORRIGE `[gmp-2606]` ("click header ~180,101"). Misma técnica `grp.value=acc.value` ya usada en COBROS/DEPÓSITOS. Los acordeones no declaran `value` propio: Ionic asigna `ion-accordion-NNN` → leer `acc.value` en runtime. Reconfirmado don-theo y dm-electronica (El Yaque v6.6.18: altura 48↔441; `mouse.click` en header NO expande) `[gmp-2611][dth-2612][dm-electronica-20260713]` |
| Contenido KPIs | `ion-grid`/`ion-col` (puede venir vacío si API no devuelve) | `[gmp-2606]` | vacío = N/A, no FAIL |

### Flujo mínimo probado
```
1. Click Vendedores → app-vendedores (acordeones empresa)
2. Click acordeón → expande/contrae; KPIs si API devuelve
3. clickBack → HOME
```

### Notas por cliente
- globalmp: 2 empresas (COMERCIALIZADORA DE, HC TRADING MARKET 20); KPIs vacíos esta sesión → N/A estructural. `[gmp-2606][gmp-2611]`
- **insumar: 1 sola empresa ("INSUMAR DISTRIBUIDOR") y KPIs SÍ poblan** → DM-VND-002 **PASS pleno, no N/A** (2 corridas: 0610 Cartera 163/Activados 4; 0622 Cartera 164/Activados 6 — los KPIs evolucionan, lo estable es que poblan). `[ins-2610][ins-2622]`
- **don-theo: 1 empresa propia** (acordeón único "COMERCIALIZADORA HNOS TORRES 2017, C.A.", `enterpriseEnabled=true`), **KPIs vacíos** esta sesión (API sin métricas) → DM-VND-002 N/A estructural — coincide con globalmp. `[dth-2612]`
- `esVendedor=true` confirmado en globalmp, romher, insumar, don-theo, piercar, ferrenuestro, dm-electronica, jerez, **latino_cosmetica**. `[gmp-2606][rom-2606][ins-2606][ins-2610][dth-2612][prc-2606][latino_cosmetica-20260714]`
- **latino_cosmetica: 1 empresa "LATINOCOSMETICA C.A." con KPIs VACÍOS** esta sesión (`ion-grid` en `[slot="content"]` renderiza solo `ng-container` placeholders, API sin métricas) → DM-VND-002 N/A estructural (contenido vacío no es FAIL, RUNTIME §4). Alinea con globalmp/don-theo/jerez (vacíos); contrasta insumar/piercar/ferrenuestro/dm-electronica (poblados). Técnica de expansión `grp.value=acc.value`+ionChange vigente en La Tortuga v6.6.18 `window.ng=TRUE` (`contentHeight` 0↔20px). `[latino_cosmetica-20260714]`
- **piercar: 1 empresa "PIERCAR REPUESTOS C." con KPIs poblados** (`infoVendedores=false` autogenerado) — Cartera Clientes 81, Activados 2, Nuevos 0, Días Hábiles 22/Transcurridos 12/Restantes 10. Alinea con insumar (KPIs sí poblan); contrasta con globalmp/don-theo (KPIs vacíos). `[prc-2606]`
- **ferrenuestro: 1 empresa "FERRENUESTRO MAYOR," con KPIs POBLADOS** (`infoVendedores=false` autogenerado por Denario) → DM-VND-002 **PASS pleno, no N/A**: Cartera Clientes 178 · Activados 13 · Nuevos 1 · Nuevos Activados 1 · Días Hábiles 23/Transcurridos 6/Restantes 17 · Venta Real Mes 7.610,09 $. Alinea con insumar/piercar (KPIs sí poblan); contrasta con globalmp/don-theo/jerez (vacíos). Técnica de expansión `grp.value=acc.value`+ionChange vigente en build El Yaque `window.ng=false`; `esVendedor=true` (heading `<h1>Vendedor</h1>`). `[ferrenuestro-2026-07-07]`
- **dm-electronica: 1 empresa "BOTZ" con KPIs POBLADOS** → DM-VND-002 **PASS pleno, no N/A**: Cartera Clientes 80 · Activados 1 · Nuevos 0 · Nuevos Activados 0 · Días Hábiles 23/Transcurridos 9/Restantes 14 · Cuota Mes 0 UNI · Venta Real Mes 2 UNI. Alinea con insumar/piercar/ferrenuestro (KPIs sí poblan); contrasta con globalmp/don-theo/jerez (vacíos). Acordeón único, `enterpriseEnabled=true`, `esVendedor=true` (heading `<h1>Vendedor</h1>`). `[dm-electronica-20260713]`
- **jerez: 3 empresas (acordeones "INV JEREZ MOTORS VALERA/CARACAS/TURMEREMO", idEnterprise 1/2/3), KPIs VACÍOS** → DM-VND-002 N/A estructural (ion-grid presente sin métricas; API no puebla). Alinea con globalmp/don-theo. Antes `[jerez-2026-06-22]` los 3 rótulos eran idéntico "INVERSIONES JEREZ MO..."; ahora distintos por ciudad. La técnica de expansión `grp.value=acc.value`+ionChange **sigue vigente en el build refactorizado El Yaque** (`window.ng=false` no la afecta — skill pura-DOM); `mouse.click` en header NO expande. `esVendedor=true` reconfirmado (heading `<h1>Vendedor</h1>`). `[jerez-2026-07-06]`
