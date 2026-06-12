# Smoke — CLIENTES
## Estado inicial: HOME | Estado final: HOME

**Inicio:** `h.connectCdp(page)` → `h.waitSyncOverlay(pg)`
**Datos de prueba:** leer `automation/clientes/{QA_CLIENTE}/{QA_CLIENTE}.yaml` → `modules.clientes`

---

## Casos

| ID | Acción clave | PASS cuando | FAIL / N/A |
|----|-------------|-------------|------------|
| DM-CLT-001 | Click módulo Clientes desde Home | `app-client-home` visible con 3 botones (CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL) | FAIL: pantalla vacía |
| DM-CLT-002 | Click CLIENTES → lista | 50+ ítems con saldo BS y USD (`multiCurrency=true`) | FAIL: lista vacía |
| DM-CLT-003 | Ingresar `cliente_busqueda` en searchbar | Lista filtrada con coincidencias | FAIL: no filtra |
| DM-CLT-009 | Click en cliente → detalle | Nombre, Código, Saldo BS/USD visibles en `app-client-detail` | FAIL: detalle vacío |
| DM-CLT-013 | Tab "Doc. de Venta" | Documentos con leyenda Vigente/Vencido/A favor | FAIL: tab vacía |
| DM-CLT-016 | `h.clickBack(pg)` desde listado | `app-client-home` con 3 botones | FAIL: no navega a home clientes |
| DM-CLT-017 | `h.clickBack(pg)` desde detalle | `app-client-list` visible | FAIL: salta al home principal |
| DM-CLT-019 | Click CLIENTE POTENCIAL | Formulario con 9 `ion-input` vacíos; botones Guardar/Enviar `disabled=true` | FAIL: botones habilitados sin datos |
| DM-CLT-021 | `h.fillIonInput` campos obligatorios (nombre: `Test-CLT-SMOKE-<HHMMSS>`, teléfono, etc.) | Botones Guardar/Enviar `disabled=false` | FAIL: botones siguen deshabilitados |
| DM-CLT-024 | Click Guardar | Alert "¡Cliente Potencial Guardado!" → cliente en lista con Estatus: Guardado | FAIL: sin alert o no aparece en lista |
| DM-CLT-026 | Click Enviar → ACEPTAR en modal | Estatus cambia a "Enviado" | FAIL: sigue en Guardado |
| DM-CLT-031 | Click basura en cliente Guardado → confirmar | Cliente desaparece de lista | FAIL: persiste en lista |

**Notas:**
- Alert de guardado: usar `h.clickAlertButton(pg, 'OK')` o `'Aceptar'`
- Botón atrás: siempre `h.clickBack(pg)` — no `window.history.back()`
