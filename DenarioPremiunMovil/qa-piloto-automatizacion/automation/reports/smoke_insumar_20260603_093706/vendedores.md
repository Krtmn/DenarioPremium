# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260603_093706_smoke-completo` |
| Módulo | VENDEDORES |
| Fecha | 2026-06-03 |
| Cliente | insumar |
| App | `com.kiberno.denarioPremiumPro` — Ionic + Angular + Capacitor (Android WebView) |
| Cuenta QA | INSUMAR DISTRIBUIDOR — `esVendedor=true`, `aplica=true` |
| Estado inicial | HOME |
| Estado final | HOME |
| Resultado | 3 PASS · 0 FAIL · 0 SKIP · 0 N/A |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Click en `ION-COL[text=Vendedores]` coords (74, 428) → `app-vendedores` visible en `/vendedores`; overlay desaparece; 1 acordeón "INSUMAR DISTRIBUIDOR" visible |
| DM-VND-002 | ✅ PASS | Click en header acordeón → `accordion-expanded=true`; KPIs visibles: Días Hábiles 22, Días Transcurridos 3, Días Restantes 19, Cartera Clientes 163, Clientes Activados 4, Clientes Nuevos 0, Clientes Nuevos Activados 0; segundo click → `accordion-expanded=false`, solo cabecera visible |
| DM-VND-007 | ✅ PASS | `img.fechaAtras` clickeado desde `/vendedores` → `app-home` activo; HOME con todos los módulos visible |

---

## Hallazgos de configuración

- **`aplica=true`** confirmado: módulo "Vendedores" visible en menú HOME; navegación a `/vendedores` exitosa.
- **`esVendedor=true`** confirmado: la pantalla muestra encabezado "Vendedor" (singular) con un único acordeón para la empresa propia "INSUMAR DISTRIBUIDOR" — rol de vendedor individual, no supervisor.
- **KPIs con datos reales:** el acordeón devolvió contenido poblado (Días Hábiles: 22, Cartera: 163 clientes, Activados: 4). A diferencia de la corrida Hidroponias (datos vacíos), Insumar sí retorna métricas en esta corrida.
- Módulo de solo lectura — no se generaron registros en el sistema.

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Ninguno (módulo solo lectura) | — |

---

*Generado por agente QA CDP · Claude Sonnet 4.6 · RUN_ID 20260603_093706_smoke-completo*
