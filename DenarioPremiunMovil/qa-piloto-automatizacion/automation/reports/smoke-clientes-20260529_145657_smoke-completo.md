# Smoke Test — Módulo CLIENTES
**RUN_ID:** 20260529_145657_smoke-completo  
**Fecha:** 2026-05-29  
**Agente:** Claude Sonnet 4.6 (subagente módulo Clientes)  
**App:** com.kiberno.denarioPremiumPro · Ionic 6 + Angular 19 + Capacitor 6  
**Cuenta QA:** Yaque (usuario 001) — empresa HIDROPONIAS VENEZOLA  
**Estado inicial:** app-home (`/home`) | **Estado final:** app-home (`/home`)

---

## Resumen ejecutivo

| Resultado | Cant. |
|-----------|-------|
| PASS      | 11    |
| FAIL      | 0     |
| SKIP      | 0     |
| N/A       | 0     |
| **TOTAL** | **11**|

---

## Tabla de resultados

| ID | Resultado | Evidencia |
|----|-----------|-----------|
| DM-CLT-001 | PASS | `app-clientes` visible con 3 botones: CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL |
| DM-CLT-002 | PASS | `app-client-list` cargó 50 ítems; primera fila: "ALIMENTOS GOURMET CCC" Saldo BS: 278.907,23 / USD: 552 |
| DM-CLT-003 | PASS | Búsqueda "MACO" → 1 resultado "ALIMENTOS MACO 2020, C.A." (filtrado correcto) |
| DM-CLT-009 | PASS | Detalle ALIMENTOS MACO 2020: Nombre, Código 2602, Saldo BS 4.758.852,49, Saldo USD 9.425,15 visibles |
| DM-CLT-013 | PASS | Tab "Doc. de Venta" activo; leyenda Vigente / Vencido / A favor visible; documento NDB4411 presente |
| DM-CLT-016 | PASS | Atrás desde listado → `app-clientes` con 3 botones (home clientes) |
| DM-CLT-017 | PASS | Atrás desde detalle → `app-client-list` |
| DM-CLT-019 | PASS | Formulario nuevo potencial: 9 ion-input vacíos, botones Guardar y Enviar disabled |
| DM-CLT-021 | PASS | Rellenados 8 campos obligatorios (incl. Teléfono 04121234657); ambos botones habilitados (disabled: false) |
| DM-CLT-024 | PASS | Alert "¡Cliente Potencial Guardado con exito!" → OK; cliente "Test-CLT-SMOKE-145657" en lista con Estatus: Guardado |
| DM-CLT-026 | PASS | Enviar → alert "¿Desea enviar nuevo Cliente Potencial?" → ACEPTAR → alert "El cliente potencial será enviado" → Estatus: Enviado |
| DM-CLT-031 | PASS | Botón danger (trash) clickeado sobre "Test-CLT-DELETE-145657" (Guardado); lista pasó de 3 a 2 ítems |

---

## Notas técnicas

### Selectores relevantes descubiertos

- Búsqueda en listado: `input[type="text"]` nativo dentro de `.search-input-wrap` (NO ion-input ni ion-searchbar).  
- Botón buscar: `button.clear-search` (ícono lupa, coordenadas reales con `getBoundingClientRect`).  
- Botón Guardar: `ion-button.imagenGuardar` | Enviar: `ion-button.imagenEnviar`.  
- Botón eliminar: `ion-button[color="danger"]` dentro de `app-client-potential-client`.  
- Navegación atrás: `img.fechaAtras → closest('a')` — patrón estándar confirado.

### Comportamiento observado

- Tras guardar un cliente potencial, el formulario se reinicia (campos vacíos) pero **permanece visible** — el usuario debe pulsar Atrás para volver al home de clientes. Comportamiento esperado según código (`client-new-potential-client.component.ts:173-220`).
- La alerta de "guardar y salir / salir sin guardar" aparece aunque el formulario parezca vacío si el componente Angular mantiene estado previo (`newPotentialClientChanged = true`). No es un defecto — es consistente con el supuesto 5 del guion.
- DM-CLT-026: La app muestra DOS alerts sucesivos: (1) confirmación "¿Desea enviar…?" y (2) confirmación final "El cliente potencial será enviado". Flujo correcto.
- Se crearon 2 clientes "Test-CLT-DELETE-145657" por duplicación en el flujo de prueba (se eliminaron ambos durante la ejecución del caso DM-CLT-031 para dejar ambiente limpio).

### Ambiente al finalizar

- Únicamente queda en lista de potenciales: "Test-CLT-SMOKE-145657" con Estatus: **Enviado** (no se puede eliminar por diseño).
- App en `http://localhost/home` — estado inicial restaurado correctamente.

---

*Generado por agente QA automático · Claude Sonnet 4.6 · RUN_ID 20260529_145657_smoke-completo*
