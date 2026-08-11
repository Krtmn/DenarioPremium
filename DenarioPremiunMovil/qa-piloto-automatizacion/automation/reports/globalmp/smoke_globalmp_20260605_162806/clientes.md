# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260605_162806_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | CDP 127.0.0.1:9220 (PID 8880) |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | globalmp |
| Resultado | **11 PASS · 0 FAIL · 0 SKIP · 0 N/A** |

---

## Datos descubiertos — globalmp

| Campo | Valor |
|-------|-------|
| cliente_busqueda | `BIG` (término corto, 1 resultado exacto) |
| cliente_detalle · nombre | BIG MARKET 22, C.A |
| cliente_detalle · código | BM17 |
| cliente_detalle · saldo BS | 1.694.224,12 |
| cliente_detalle · saldo USD | 3.083,94 |
| multiCurrency | **true** (Saldo BS y USD en lista y detalle) |
| enterpriseEnabled | **true** — ion-select `idEnterprise` requerido en formulario cliente potencial |
| Empresas disponibles | 1 = HC TRADING MARKET 20 / 2 = COMERCIALIZADORA DE |

---

## Patrones específicos de globalmp (NUEVOS)

| # | Patrón | Descripción |
|---|--------|-------------|
| P1 | **Búsqueda requiere click en botón** | La lista no filtra con solo escribir en el input `[placeholder="Clientes..."]`. Se debe enfocar el input + `keyboard.type()` + click en `ion-icon[name="search-circle-sharp"]` (coords ~317,95). Igual que patrón conocido documentado. |
| P2 | **Formulario cliente potencial: idEnterprise obligatorio** | El ion-select `[formcontrolname="idEnterprise"]` es campo requerido (ng-invalid cuando vacío). No es visible como ion-input en la lista de ion-inputs; hay que tratarlo con selectIonPopover. Sin seleccionarlo, los botones Guardar/Enviar permanecen disabled aunque todos los ion-inputs estén valid. |
| P3 | **Flujo Enviar: doble alerta + navega a HOME** | Clic en imagenEnviar → alert "¿Desea enviar?" → ACEPTAR → alert "será enviado" → OK → alert "creado exitosamente nro. {ref}" en HOME. La app navega automáticamente a HOME después del envío. |
| P4 | **Trash solo en clientes Guardado** | El botón `ion-button[color="danger"]` solo aparece en ítems con Estatus: Guardado. Clientes Enviados no tienen botón de borrado. |
| P5 | **Borrado directo sin confirmación previa** | El trash button elimina inmediatamente mostrando alert de éxito — no hay alert de confirmación "¿Está seguro?" previo. |
| P6 | **Edición de Guardado via click en ítem** | Hacer click en un ítem Guardado abre el formulario prerrelleno con botones enabled. Es el flujo correcto para DM-CLT-026. |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` visible con 3 botones: CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL |
| DM-CLT-002 | ✅ PASS | `app-client-list` · 50 ítems · Saldo BS y USD presentes → multiCurrency=true |
| DM-CLT-003 | ✅ PASS | Búsqueda "BIG" → 1 resultado (BIG MARKET 22, C.A / BM17). Requiere focus+keyboard.type+click botón search |
| DM-CLT-009 | ✅ PASS | `app-client-detail` · Nombre: BIG MARKET 22, C.A · Código: BM17 · Saldo BS: 1.694.224,12 · Saldo USD: 3.083,94 |
| DM-CLT-013 | ✅ PASS | Tab "Doc. de Venta" (ion-segment-button value=docVentas) · leyendas Vigente/Vencido/A favor · 3+ docs tipo "A" en USD |
| DM-CLT-017 | ✅ PASS | `clickBack` desde `app-client-detail` → `app-client-list` visible (50 ítems) — no salta a HOME |
| DM-CLT-016 | ✅ PASS | `clickBack` desde `app-client-list` → `app-clientes` con 3 botones |
| DM-CLT-019 | ✅ PASS | Formulario "Clientes Potenciales" · 9 ion-inputs + 1 ion-select (idEnterprise) · imagenGuardar/imagenEnviar disabled |
| DM-CLT-021 | ✅ PASS | Tras fillIonInput en 8 campos + selectIonPopover en idEnterprise → imagenGuardar/imagenEnviar disabled=false |
| DM-CLT-024 | ✅ PASS | Click imagenGuardar → alert "¡Cliente Potencial Guardado con exito!" → OK → cliente en BUSCAR lista con Estatus: Guardado |
| DM-CLT-026 | ✅ PASS | Abrir ítem → click imagenEnviar → "¿Desea enviar?" → ACEPTAR → "será enviado" → OK → HOME alert "creado exitosamente nro. 140" → Estatus: Enviado |
| DM-CLT-031 | ✅ PASS | Click trash en Test-CLT-DELETE-162806 (Guardado) → alert "¡se borro con exito!" → OK → cliente desaparece de lista |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. 140 | Test-CLT-SMOKE-162806 · RIF J000000001 · Empresa HC TRADING MARKET 20 | Enviado al servidor |
| N/A | Test-CLT-DELETE-162806 · RIF J000000002 (creado y eliminado) | Eliminado |

---

## Hallazgos (solo si hay FAIL)

*Sin FAIL en esta corrida.*

---

## Notas de ejecución

- El formulario "Clientes Potenciales" tiene **10 campos requeridos** (no 9 como indica el smoke extract): 8 ion-inputs + 1 ion-select (idEnterprise). La descripción en smoke-clientes.md dice "9 ion-input vacíos" — idEnterprise es un ion-select adicional no documentado previamente.
- La búsqueda en la lista de clientes usa `input[type="text"][placeholder="Clientes..."]` (plain input, no ion-input). El patrón es: focus nativo + `pg.keyboard.type()` + click en botón search. El fillIonInput estándar no es suficiente solo.
- `app-client-list` vs `app-client-home`: El componente activo durante todo el módulo es `app-clientes` (no se crea un componente separado `app-client-home`).

---

*Agente: claude-sonnet-4-6 · RUN_ID: 20260605_162806 · Módulo completado: 2026-06-05*
