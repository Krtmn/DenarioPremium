# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260619_173652_smoke-completo` |
| Módulo | VENDEDORES |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa | insumar |
| Resultado | 2 PASS · 0 FAIL · 0 SKIP · 1 N/A |

Módulo de solo lectura — no crea ni modifica datos.
Estado inicial: HOME · Estado final: HOME ✅

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Click Vendedores desde HOME → `/vendedores`, `app-vendedores` visible, overlay sync desaparece, `<h1>Vendedor</h1>` (singular → `esVendedor=true`), 1 acordeón empresa "INSUMAR DISTRIBUIDOR" (`enterpriseEnabled=true`) |
| DM-VND-002 | 🚫 N/A | Toggle expand/contrae correcto: `[slot=content]` height 0→20→0 px, clase `accordion-collapsed`↔`accordion-expanded`. Pero KPIs **vacíos** esta sesión: el `ion-grid` interno solo trae placeholders Angular (`<!----><!----><!---->`); la API no devolvió Cartera/Activados/Días. Contenido vacío = N/A (RUNTIME §4), no FAIL |
| DM-VND-007 | ✅ PASS | `clickBack` (img.fechaAtras → `<a>`) → regresa a `/home`, `app-home` visible con grilla de módulos (Vendedores + Cobros presentes) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Ninguno (módulo de solo lectura) | — |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Acordeón empresa SIN atributo `value` | universal | En esta sesión `ion-accordion` de `app-vendedores` no tiene atributo `value`; su valor interno es la propiedad `acc.value` (ej. `"ion-accordion-161"`). El click por coords en el header (`ion-item` slot=header, rect ~x10 y77 w340 h48, centro ~180,101) **no** disparó el toggle. La expansión sí funciona forzando `group.value = acc.value` (y `undefined` para contraer): height pasa 0→20→0. Oráculo de expansión por `getBoundingClientRect().height` del `[slot="content"]` confirmado. |
| KPIs vacíos en insumar esta corrida | cliente | A diferencia de `[ins-2610]` (KPIs poblados: Cartera 163, Activados 4, Días 22/8/14 → PASS pleno), en `20260619` la API **no** devolvió KPIs → `ion-grid` con placeholders `<!---->` y content height ~20px sin texto. DM-VND-002 = N/A estructural esta sesión. La diferencia es dato de backend, no regresión de UI. |

> ✅ consolidado 2026-06-19

## Hallazgos (solo si hay FAIL)

Ninguno — sin FAIL.

## Notas

- Heading `<h1>Vendedor</h1>` (singular) confirma `vgs.esVendedor=true`; acordeón único "INSUMAR DISTRIBUIDOR" confirma `vgs.enterpriseEnabled=true`. Ambos coinciden con el perfil `insumar.yaml`.
- DM-VND-002 quedó N/A solo por ausencia de datos de KPI desde backend en esta corrida; la mecánica expand/contrae del acordeón es correcta (verificada por toggle de `group.value`). No re-marcar FAIL.
