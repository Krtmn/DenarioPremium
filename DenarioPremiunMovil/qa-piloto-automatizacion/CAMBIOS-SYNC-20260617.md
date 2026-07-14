# Documento de sincronización QA — para igualar carpetas

**Fecha:** 2026-06-17
**Base comparada:** versión inicial de la compañera (`qa-piloto-automatizacion (1).zip`, ~11/jun/2026)
**Objetivo:** que ambas carpetas `qa-piloto-automatizacion/` queden **idénticas**.

> Este documento explica **qué cambió** respecto de la versión inicial y **cómo sincronizar**. El changelog de decisiones de diseño está además en `PROPUESTAS-CAMBIOS.md`.

---

## ★ EMPEZÁ POR ACÁ (lo más nuevo e importante)

- **`LEEME-HANDOFF.md`** (raíz) → **paso a paso** para integrar esta carpeta y **correr la corrida** con el sistema nuevo. **Leerlo primero.**
- **`automation/db/COTEJO-BD.md`** → referencia técnica del **cotejo BD por payload** (verifica campo por campo que *lo enviado == lo guardado*), estado por módulo y plan de pendientes.

**La gran adición desde tu versión:** el **cotejo BD por payload** (modelo de 2 agentes: UI captura el payload + BD coteja contra la nube, **en paralelo**). Archivos clave nuevos: `automation/db/cotejo-payload.js` (motor), helpers de captura en `denario-cdp-helpers.js` (`installPayloadCapture`/`getCapturedPayloads`), y el cableado en `prompt-orquestador-smoke.md`. Estado: 6 módulos calibrados; pendiente cobros-tipos + depósitos (ver `COTEJO-BD.md`).

---

## 1. Cómo igualar las carpetas (recomendado)

La divergencia es grande (~600 líneas en 13 archivos + 1 directorio nuevo completo). Aplicar cambio por cambio a mano es propenso a error.

**Recomendación: REEMPLAZAR la carpeta** — la compañera extrae esta carpeta comprimida y reemplaza la suya, **EXCEPTO la carpeta `secrets/`** (ver §4: las credenciales no se comparten; cada una usa las suyas).

Pasos para la compañera:
1. Respaldar su carpeta actual (por las dudas).
2. Extraer la carpeta nueva encima.
3. **No pisar `secrets/qa-db.env` ni `secrets/qa-credentials.env`** con los míos — usar los `.example` para crear los propios (§4).
4. Dentro de `automation/db/` correr `npm install` (regenera `node_modules` de `pg`) — o dejar el `node_modules` que viene.

Si prefiere conservar cambios propios y aplicar manual, este documento lista todo lo necesario (§3).

---

## 2. Resumen de la divergencia

| # | Bloque | Tipo | Archivos |
|---|--------|------|----------|
| A | **Oráculo / cotejo BD v2** | NUEVO | `automation/db/*` + `RUNTIME.md §10` + sección "Verificación BD" en los 7 smoke transaccionales + `secrets/qa-db.env(.example)` |
| B | **Perfiles de cliente nuevos** | NUEVO | `automation/clientes/piercar.yaml`, `don-theo.yaml`, `alta-cliente.md` |
| C | **Helpers CDP evolucionados** | MODIF | `automation/cdp/denario-cdp-helpers.js` (415 → 628 líneas) |
| D | **Selectores por módulo** | MODIF | `automation/cdp/module-selectors.md` (512 → 604) |
| E | **Smoke extracts** | MODIF | `smoke-cobros.md` (+90) y notas + BD en los otros 6 |
| F | **Reglas operativas** | MODIF | `RUNTIME.md` (181 → 228): §9 round-trip + §10 BD |
| G | **Orquestador** | MODIF | `prompt-orquestador-smoke.md`: pre-vuelo BD + verificación BD inline |
| H | **Changelog/guía** | MODIF | `PROPUESTAS-CAMBIOS.md` (tabla de decisiones) |
| I | **Config Claude** | NUEVO | `.claude/` (settings del entorno) |

---

## 3. Detalle por bloque

### A. Oráculo / cotejo BD v2 (lo agregó QA / Grecia)
**Directorio NUEVO `automation/db/`:**
- `query.js` — lector **read-only de la nube** (Postgres del servidor): `node automation/db/query.js {cliente} "SELECT ..."`.
- `local-query.js` — lector **read-only de la BD local del dispositivo** (SQLite vía `adb run-as`): `node automation/db/local-query.js "SELECT ..."`.
- `modelo-datos-denario.md` — modelo de datos (mapa de tablas por módulo).
- `package.json` / `package-lock.json` / `node_modules/` — dependencia `pg`.

**`RUNTIME.md §10` (NUEVO):** "Oráculo BD v2 — cotejo *lo guardado se envía*". 5 estados (`BD-OK / BD-SAVED / BD-QUEUED / BD-MISMATCH / BD-N/A`), baseline-diff, verificación por items co_type-aware, blindaje (la BD nunca tumba el smoke). También se reforzó **§9 round-trip** (Guardar→reabrir→comparar 1:1).

**Sección "## Verificación BD"** agregada en los 7 smoke transaccionales: `smoke-clientes / pedidos / cobros / devoluciones / inventarios / depositos / visitas`. (Login/Productos/Vendedores NO la llevan: son solo lectura.)

### B. Perfiles de cliente nuevos
- `piercar.yaml` — cliente activo (VGs desde CSV + datos por módulo).
- `don-theo.yaml` — cliente Isla Coche.
- `alta-cliente.md` — guía de alta de cliente (CSV `global_configuration`→`vgs`; BD→`modules.*`).

### C. Helpers CDP (`denario-cdp-helpers.js`, +213 líneas)
Funciones agregadas respecto de la versión inicial:
- `openNuevoCobro(pg, tipo)` — abre cobro por el flujo REAL (`nuevoCobro(N)` + espera `paymentMethodList>0`). Reemplaza el atajo `goToNuevoCobro` que dejaba la lista vacía.
- `mockCameraAdjunto(pg)` / `ensureAdjunto(pg)` — inyectan foto mock para ENVIAR cobros con adjunto obligatorio (con fail-fast).
- `openDocumentDetail(pg, {match})` / `waitDocDetailOpen(pg)` — **(HOY)** abren el modal "Detalle del documento" (seleccionan checkbox primero → click real en la lupa → fallback `window.ng`).
- Más helpers de apoyo (selección, datetime, etc.).

### D. Selectores (`module-selectors.md`, +168 líneas)
Selectores probados por módulo, anti-patrones, y **(HOY)** la fila "Abrir detalle de documento (lupa)" con la precondición `disabled` hasta seleccionar.

### E. Smoke extracts
- `smoke-cobros.md` (+90): apertura por flujo real, adjunto (con atajo `mock_camara_funciona`), retención por documento, persistencia IGTF, pago parcial, y **(HOY)** **descubrimiento dinámico de cliente con documentos** vía query BD local.
- Otros 6: notas críticas por módulo + sección Verificación BD.

### F–H. RUNTIME / Orquestador / Changelog
- `RUNTIME.md`: §9 y §10 (arriba).
- `prompt-orquestador-smoke.md`: pre-vuelo BD no bloqueante + verificación BD inline por agente + formato de reporte con sub-sección BD.
- `PROPUESTAS-CAMBIOS.md`: tabla de decisiones (Grupo 1 Cobros, Grupo 2 Oráculo BD v2, alta-cliente, descartar pruebas negativas dedicadas).

---

## 4. Config de variables / secrets (IMPORTANTE)

La carpeta `secrets/` ahora tiene **4 archivos** (antes 1):

| Archivo | Qué es | ¿Compartir? |
|---------|--------|-------------|
| `qa-credentials.env` | Login QA por cliente (bloques `# Cliente: X`) | ❌ **No** — cada una usa el suyo |
| `qa-credentials.env.example` | Plantilla de credenciales | ✅ Sí |
| `qa-db.env` | **Conexiones a BD por cliente** (DSN/host/usuario read-only, bloques `# Cliente: X`) | ❌ **No** — datos sensibles |
| `qa-db.env.example` | Plantilla de conexión BD | ✅ Sí |

**Cómo lo configura la compañera (esto es "el tema de config de variables"):**
1. Copiar `qa-db.env.example` → `qa-db.env` y `qa-credentials.env.example` → `qa-credentials.env`.
2. Completar **sus** valores: por cada cliente, un bloque `# Cliente: {slug}` con el DSN de la BD (read-only) y las credenciales de login.
3. El DSN del cliente lo confirma QA antes de cada corrida (la playa/servidor varía).
4. Si `qa-db.env` no tiene el bloque del cliente → el cotejo BD reporta `BD-N/A` y la corrida sigue igual (es aditivo, no bloqueante).

> Por eso **no se comprime `secrets/` con valores reales** — viajan solo los `.example`.

---

## 5. Lo agregado HOY (2026-06-17) — sesión Cobros

1. `openDocumentDetail` + `waitDocDetailOpen` en helpers (validado en vivo: abre el modal de detalle).
2. Patrón documentado en `module-selectors.md` (precondición checkbox).
3. `piercar.yaml`: flag `mock_camara_funciona: false` (evita reintentos de adjunto inútiles) + `clientes_con_documentos` ahora es **solo referencia** (se descubre en runtime).
4. `smoke-cobros.md`: descubrimiento dinámico de cliente (query BD local) + atajo de adjunto.

---

## 6. Carpetas que NO hace falta sincronizar
- `automation/reports/*` — son **salidas de corridas** (una carpeta por corrida); no son framework. Cada una genera las suyas.
- `node_modules/` — se regenera con `npm install` dentro de `automation/db/`.

---

*Generado por Claude Code · sincronización de carpeta QA · 2026-06-17*
