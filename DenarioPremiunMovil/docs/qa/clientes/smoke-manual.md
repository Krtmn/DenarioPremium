# Clientes — Smoke manual (dispositivo)

Checklist de regresión mínima del guion DM-CLT (Android). Marcar N/A si la VG no aplica.

1. **DM-CLT-001** — Acceso al módulo desde Home → 3 botones (o 1 si transportista).
2. **DM-CLT-002** — Listado carga con nombre, código y saldo coloreado.
3. **DM-CLT-003** — Búsqueda con resultados.
4. **DM-CLT-009** — Abrir detalle (tab Detalle con campos).
5. **DM-CLT-013** — Tab Documentos de venta visible (!transportista).
6. **DM-CLT-016** — Atrás: listado → home clientes.
7. **DM-CLT-017** — Atrás: detalle → listado.
8. **DM-CLT-019** — Abrir formulario nuevo potencial.
9. **DM-CLT-021** — Empresa OK → Guardar y Enviar activos aunque form incompleto; completar campos obligatorios (incl. Responsable).
10. **DM-CLT-024** — Guardar potencial → confirmación → éxito → Guardar OFF hasta editar.
11. **DM-CLT-026** — Enviar potencial → validación al click → confirmación → éxito **después** de persistir → estatus Por Enviar/Enviado.
12. **DM-CLT-031** — Eliminar potencial Guardado.

**Extra GLOBAL MP / CLI-SALDOS-001:** AS04 lista+detalle Saldo USD ≈ suma `document_sales.nu_balance` USD de esa empresa (≈2.096,23), BS ≈ × tasa; no 2,84. Segundo cliente con docs en BS: Saldo BS ≈ suma docs BS (sin regresión).

**CLI-CREDIT-001:** En el mismo detalle AS04, Crédito Bs primero y Crédito $ después (mismo orden que Saldo). Si el límite está en USD, $ ≈ `nu_credit_limit` y Bs ≈ × tasa; disponible = crédito − saldo de esa moneda. No debe verse el monto USD en la fila Bs.
