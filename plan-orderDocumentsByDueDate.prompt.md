## Plan: Ordenar documentos por vencimiento

Actualizar `getDocumentsSales` para que la consulta SQL priorice documentos vencidos y luego no vencidos, ambos grupos ordenados por `da_due_date` descendente. La recomendación es mover esta lógica a `buildDocsQuery`, replicando en SQL el criterio de `this.isDueSoon(doc.daDueDate)` con `DATE(d.da_due_date) < DATE('now')`, y dejar el orden por moneda solo como desempate opcional.

**Steps**
1. Revisar y ajustar `buildDocsQuery` en `c:\Users\franc\Documents\Repositorios\DenarioPremiumMovil\DenarioPremiunMovil\src\app\services\collection\collection-logic.service.ts` para reemplazar el `ORDER BY` actual (centrado en moneda) por un orden principal por vencimiento y fecha.
2. Definir un `ORDER BY` común reutilizable para todas las ramas de consulta:
   - primero `CASE WHEN DATE(d.da_due_date) < DATE('now') THEN 0 ELSE 1 END ASC`
   - después `DATE(d.da_due_date) DESC`
   - opcionalmente mantener `CASE WHEN d.co_currency = enterprise default THEN 0 ELSE 1 END` como tercer criterio de desempate.
3. Aplicar ese orden en las 4 salidas de `buildDocsQuery`:
   - módulo `0/2/4` con moneda vacía
   - módulo `0/2/4` con moneda específica
   - módulo `3` (IGTF) con moneda vacía
   - módulo `3` con moneda específica
4. Verificar que el cambio no afecte la lógica posterior de `getDocumentsSales`, especialmente `mapRowToDocumentSale`, `convertDocumentSales()` y `getColorRowDocumentSale()`, que seguirán usando `isDueSoon` solo para UI/color, no para el orden.
5. Validar visualmente en la pantalla de cobros con un cliente que tenga mezcla de facturas vencidas y no vencidas, confirmando que:
   - todas las vencidas aparecen primero
   - dentro de cada grupo las fechas van de mayor a menor
   - no se duplican ni desaparecen documentos por el `OR d.co_document IN (...)`.

**Relevant files**
- `c:\Users\franc\Documents\Repositorios\DenarioPremiumMovil\DenarioPremiunMovil\src\app\services\collection\collection-logic.service.ts` — actualizar `buildDocsQuery`, usado por `getDocumentsSales`.
- `c:\Users\franc\Documents\Repositorios\DenarioPremiumMovil\DenarioPremiunMovil\src\app\services\clientes\clientes-database-services.service.ts` — referencia útil: ya usa `da_due_date < DATE("now")`, lo que confirma que la comparación SQL por vencimiento es consistente en el proyecto.

**Verification**
1. Ejecutar la app y abrir el flujo de cobros con documentos mezclados (vencidos/no vencidos).
2. Confirmar manualmente el orden de `documentSales` en pantalla y, si hace falta, con un `console.log(this.documentSales.map(d => ({ due: d.daDueDate, expired: this.isDueSoon(d.daDueDate) })))` temporal.
3. Probar al menos un caso con `coCurrency` vacío y otro con `coCurrency` específico para cubrir ambas ramas de `buildDocsQuery`.

**Decisions**
- Recomendación: el criterio principal debe ser `vencida -> no vencida`, no moneda.
- Si se desea conservar la preferencia por moneda por compatibilidad, dejarla solo como desempate terciario.
- Alcance: solo orden de consulta en `getDocumentsSales`; no cambia colores, filtros ni reglas de selección de documentos.

**Further Considerations**
1. Si apareciera alguna base con `da_due_date` no normalizada, el fallback sería ordenar en TypeScript después del fetch usando `this.isDueSoon(doc.daDueDate)` y `parseDate`, pero la evidencia del repo indica que el enfoque SQL debería funcionar correctamente.