# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260729_133234_smoke-completo` |
| Módulo | VENDEDORES (solo lectura) |
| Dispositivo | Android · WebView PID 21744 · CDP `:9220` |
| App | `com.kiberno.denarioPremiumPro` — app_version `1.0` · db_version 19 · `window.ng=true` |
| Playa | isla_coche — `http://denarioislacoche.ddns.net:8081/PremiumWS` |
| Empresa / Usuario | LATINOCOSMETICA C.A. (única) · co_login 100 — NEIMY PARRA (id_user 477) |
| Resultado | **2 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |
| Watchdog | `moduleMs` 45 min · 0 cuelgues · 0 reconexiones |

**Precondición verificada:** `modules.vendedores.aplica=true` — el tile "Vendedores" está en HOME y `app-vendedores` monta con heading `<h1>Vendedor</h1>` ⇒ `esVendedor=true` confirmado en esta sesión.

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Tile Vendedores → `app-vendedores` visible, heading **"Vendedor"**, overlay de sync ausente, **1 acordeón** de empresa "LATINOCOSMETICA C.A." (`ion-accordion` value `ion-accordion-8`, estado inicial `accordion-collapsed`) |
| DM-VND-002 | 🚫 N/A (por dato) | **Mecánica de expansión OK; KPIs vacíos.** `grp.value = acc.value` + `ionChange` → `accordion-collapsed` → `accordion-expanded`, altura de `[slot="content"]` **0 → 20 px**; contraer con `grp.value = undefined` → vuelve a `accordion-collapsed`, 0 px. Pero el contenido trae **`ion-grid` presente con `innerText` vacío y 0 `ion-col` con texto** (503 chars de HTML = solo placeholders `ng-container`) ⇒ la API **no devolvió métricas hoy tampoco**. Contenido vacío = N/A, no FAIL (RUNTIME §4) |
| DM-VND-007 | ✅ PASS | Back vía `img.fechaAtras` → `closest('a')` (coords ~34,34) → `/home` con `app-home` y los 10 tiles; 0 alertas y 0 modales residuales |

## Registros creados en sistema

Ninguno — módulo de **solo lectura**. `BD-N/A` (RUNTIME §10 no aplica).

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | — | — |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **KPIs vacíos en latino_cosmetica — 2ª corrida consecutiva** | cliente (refuerza, ya no es "esta sesión") | `[latino_cosmetica-20260714]` los reportó vacíos y `[latino_cosmetica-20260729]` **reproduce el mismo cuadro exacto** (`contentHeight` 0↔20 px, `ion-grid` sin `ion-col` poblados). Deja de ser un accidente de sesión: para este cliente/servidor la API de métricas **no puebla**. Alinea con globalmp/don-theo/jerez; contrasta insumar/piercar/ferrenuestro/dm-electronica |
| Expansión por `grp.value = acc.value` + `ionChange` sigue vigente | universal (reconfirma) | Válida en La Tortuga v6.6.18 con `window.ng=true`. `mouse.click` en el header **no** expande (no reintentado: la vía DOM funcionó al 1er intento) |
| Oráculo de expansión por altura de `[slot="content"]` | universal (reconfirma) | 0 px colapsado ↔ 20 px expandido. Con KPIs vacíos la altura expandida es de solo 20 px — **no usar un umbral alto** (ferrenuestro llega a 393 px con KPIs poblados) para decidir si expandió |
| Back de VENDEDORES **sí** usa `img.fechaAtras` | universal (confirma) | A diferencia de PRODUCTOS. `h.clickBack` es aplicable aquí sin adaptación |

## Hallazgos

Sin FAIL. DM-VND-002 queda **N/A por dato**, no por estructura: el acordeón, el contenedor de KPIs y la mecánica de expandir/contraer funcionan correctamente; lo que falta son las métricas que debe devolver el servidor. Es la 2ª corrida consecutiva de latino_cosmetica con el mismo resultado, por lo que se sugiere al equipo verificar del lado de **configuración/servicio de métricas de vendedor** para este cliente (no es un defecto del móvil observable por UI).

## Cierre

Los 3 casos asignados se ejecutaron. Nada quedó sin probar por limitación de automatización: DM-VND-002 no puede dar PASS pleno porque la API no entrega KPIs, y eso se verificó **con dato vivo** en esta sesión (no se heredó el veredicto de la corrida anterior). 0 cuelgues de CDP, 0 reconexiones. App devuelta a HOME, sin alertas ni modales residuales.
