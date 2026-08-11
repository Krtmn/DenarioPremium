# Smoke Test — Módulo CLIENTES
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260604_122859_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | CDP http://127.0.0.1:9220 |
| App | `com.kiberno.denarioPremiumPro` — Denario Premium Movil |
| Playa | romher (El Yaque) |
| Fecha | 2026-06-04 |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A** |

---

## Datos descubiertos (primera corrida exploratoria)

| Campo | Valor |
|-------|-------|
| `cliente_busqueda` | `SIDON` |
| `cliente_detalle` nombre | SUPERMERCADO SIDON, C.A. |
| `cliente_detalle` código | 0001000111 |
| `cliente_detalle` saldo VED | 72.385,49 |
| `cliente_detalle` saldo USD | 132,92 |
| `multiCurrency` | **true** — lista muestra "Saldo VED" + "Saldo USD" |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` + `app-client-container` visibles · URL `/clientes` · 3 botones: CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL |
| DM-CLT-002 | ✅ PASS | `app-client-list` con 50 ítems + `ion-infinite-scroll` · Saldo VED y Saldo USD presentes en cada ítem (multiCurrency=true) |
| DM-CLT-003 | ✅ PASS | Tipear "SIDON" + click en `button.clear-search` → lista filtrada a 1 resultado (SUPERMERCADO SIDON, C.A.) · **NO filtra on-keyup, requiere click explícito en botón search** |
| DM-CLT-009 | ✅ PASS | `app-client-detail` visible · Nombre: SUPERMERCADO SIDON, C.A. · Código: 0001000111 · Saldo VED: 72.385,49 · Saldo USD: 132,92 · Tabs: Detalle, Doc. de Venta |
| DM-CLT-013 | ✅ PASS | Tab "Doc. de Venta" muestra leyendas Vigente / Vencido / A favor · FA 0201375108 USD 20 días · saldo consistente |
| DM-CLT-017 | ✅ PASS | `h.clickBack` desde detalle → `app-client-list` visible, `app-client-detail` desaparece |
| DM-CLT-016 | ✅ PASS | `h.clickBack` desde lista → `app-client-container` con 3 botones (CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL) |
| DM-CLT-019 | ✅ PASS | `app-client-new-potential-client` · 9 ion-input visibles · `imagenGuardar` disabled=true · `imagenEnviar` disabled=true |
| DM-CLT-021 | ✅ PASS | Todos los campos requeridos ng-valid tras `fillIonInput` · `imagenGuardar` disabled=false · `imagenEnviar` disabled=false |
| DM-CLT-024 | ✅ PASS | Alert: "¡Cliente Potencial Guardado con exito!" (header: "Denario Cliente") · botón OK · cliente aparece en BUSCAR con Estatus: Guardado |
| DM-CLT-026 | ✅ PASS | Alert confirmación "¿Desea enviar nuevo Cliente Potencial?" → Aceptar → alert info "El cliente potencial será enviado" → Estatus cambia a **Enviado** · Nro. Ref: 6 asignado |
| DM-CLT-031 | ✅ PASS | Click en trash (danger) sobre cliente Guardado → alert "¡Cliente Potencial se borro con exito!" → cliente desaparece de lista; solo queda el Enviado |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Test-CLT-SMOKE-122859 | Cliente Potencial · RIF J-00000000-0 · Tel 04140000000 | **Enviado** · Nro. Ref: 6 |
| Test-CLT-DEL-122900 | Cliente Potencial · RIF J-99999999-9 · Tel 04140000001 (creado para DM-CLT-031) | **Eliminado** |

---

## Patrones descubiertos (romher — primera corrida)

### P-ROM-CLT-001: Búsqueda NO filtra on-keyup — requiere click explícito en botón
- El campo de búsqueda es un `<input type="text" class="search-input inputsSearch ng-valid">` (ngModel, NO ion-input).
- El botón `button.clear-search` está **disabled** mientras el campo está vacío; se habilita automáticamente al escribir.
- La lista **no** se filtra al teclear — requiere click explícito en `button.clear-search` (icono `search-circle-sharp`).
- Patrón: click en input → `pg.keyboard.type(valor)` → click en `button.clear-search`.
- Confirma patrón conocido de corridas anteriores (ver RUNTIME.md).

### P-ROM-CLT-002: Selector de componente root es `app-clientes` (no `app-client-home`)
- El smoke extract usa `app-client-home` pero el componente real en romher es `app-clientes` + `app-client-container`.
- `getActiveView(pg, ['app-client-home'])` devuelve null; usar `app-clientes` o verificar URL `/clientes`.

### P-ROM-CLT-003: Enviar cliente potencial — flujo de dos alertas
1. Click Enviar → alert "¿Desea enviar nuevo Cliente Potencial?" (Cancelar / Aceptar)
2. Click Aceptar → alert info "El cliente potencial será enviado" (OK)
- Después navega a `app-client-container`.

### P-ROM-CLT-004: Botón eliminar solo aparece en clientes con Estatus: Guardado
- Clientes con Estatus: Enviado no muestran el botón trash.
- La eliminación es directa (sin confirm dialog) → alert de éxito inmediato.

---

## VGs confirmadas

| VG | Valor |
|----|-------|
| `multiCurrency` | **true** |
| `modules.clientes.cliente_busqueda` | `SIDON` |
| `modules.clientes.cliente_detalle` | SUPERMERCADO SIDON, C.A. · 0001000111 |

---

## Estado final
App en **HOME** (`http://localhost/home` · `app-home` visible).
