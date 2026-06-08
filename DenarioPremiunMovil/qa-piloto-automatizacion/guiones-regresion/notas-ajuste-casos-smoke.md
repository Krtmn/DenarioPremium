# Notas — Ajuste de casos smoke por módulo

**Propósito:** registrar decisiones módulo a módulo antes de armar el **prompt único a Claude** que sincronice:

- `automation/smoke/smoke-{modulo}.md` (qué corre en smoke)
- `guiones-regresion/guion-{modulo}.md` (catálogo completo manual)
- `guiones-regresion/prompt-orquestador-smoke.md` (tabla de casos por agente)
- `automation/clientes/*.yaml` (`smoke_na_precalculado` / variantes si aplica)

**Estado:** decisiones cerradas — **prompt listo en sección final** (copiar y pegar a Claude Code).  
**Próxima corrida smoke planificada:** Romher (El Yaque); corrida **profunda solo Cobros** prioritaria. APK oficina ya permite login (5-jun-2026).

---

## Reglas generales (para el prompt a Claude)

| # | Regla |
|---|--------|
| R1 | **Excluir de smoke** = quitar del extract `smoke-*.md` y del orquestador; **no** borrar el caso del guion completo salvo pedido explícito de QA. |
| R1b | **Eliminar del guion** (solo si QA lo pide) = quitar fila de la tabla de casos, gherkin asociado y referencias en «Regresión mínima» / smoke del guion. |
| R2 | Casos que siguen en guion pero fuera de smoke: marcar `**Smoke:** no incluido — motivo: …` en la fila o agrupar en «Casos solo regresión completa». |
| R3 | **Incluir en smoke** casos críticos del happy path aunque hoy no se ejecuten. |
| R4 | **Quitar de smoke** casos que siempre N/A o sin valor en corrida habitual (segunda cuenta, reinstalación, etc.). |
| R5 | Tras cada módulo, actualizar conteo smoke en orquestador (total ~130 cambiará). |

---

## Módulo: LOGIN — revisado ✅

**Archivos afectados:**

- `automation/smoke/smoke-login.md` — quitar filas 008/009/010 y 017
- `guiones-regresion/guion-login.md` — **eliminar DM-LOG-017** por completo; marcar 008/009/010 como no smoke; actualizar sección «Regresión mínima»
- `guiones-regresion/prompt-orquestador-smoke.md` — agente 1: `DM-LOG-001, 002, 003, 004, 011, 012` (sin 008, 009, 010, 017)
- `automation/clientes/*.yaml` — quitar `has_second_user` / refs `DM-LOG-008/009` en `smoke_na` si ya no aplican

### Excluir solo del smoke (permanecen en `guion-login.md`)

| ID | Motivo |
|----|--------|
| **DM-LOG-008** | Cambio de usuario (modal). No probamos con 2 usuarios en smoke. |
| **DM-LOG-009** | Confirmar cambio de usuario — depende de 008. |
| **DM-LOG-010** | Cancelar modal cambio de usuario — mismo bloque 008; no en smoke. |

**Acción en guion:** nota `**Smoke:** no incluido — sin segunda cuenta QA en corridas smoke` en filas 008, 009, 010.

### Eliminar del guion en general (smoke + guion completo)

| ID | Motivo |
|----|--------|
| **DM-LOG-017** | Primera instalación / arranque limpio (`pm clear` o reinstalar APK). Fuera de alcance; no se mantiene ni como regresión documentada. |

**Acción en guion:** borrar fila DM-LOG-017, quitar del bloque «Regresión mínima» y cualquier gherkin/nota que lo cite.

### Mantener en smoke (sin cambio)

| ID | Notas |
|----|--------|
| DM-LOG-002 | Campos vacíos |
| DM-LOG-003 | Contraseña incorrecta |
| DM-LOG-004 | Recordar usuario |
| DM-LOG-001 | Happy path login (inicio) |
| DM-LOG-011 | Sync feedback |
| DM-LOG-012 | Llegada a Home |

**Smoke login tras ajuste:** **6 casos** (002, 003, 004, 001, 011, 012). Antes: 9 en orquestador (incl. 008, 009, 017).

### Fuera de smoke y sin cambio de alcance (catálogo guion, no orquestador)

DM-LOG-005–007, 013–016 — siguen solo en guion completo / regresión manual extendida.

---

## Módulo: CLIENTES — revisado ✅ (sin cambios)

**Decisión QA:** mantener los **12 casos** actuales sin modificar smoke ni guion.

**Mejora operativa (no cambio de casos):** en `automation/clientes/*.yaml` usar `cliente_detalle` para DM-CLT-009/013 (cliente con documentos de venta); `cliente_busqueda` solo para DM-CLT-003. Documentado en perfiles insumar/romher.

**Archivos:** `automation/smoke/smoke-clientes.md`, `guiones-regresion/guion-clientes.md`, orquestador agente 2, `automation/clientes/*.yaml`

### Smoke actual (12 casos — sin cambio)

| ID | Resumen |
|----|---------|
| DM-CLT-001 | Acceso módulo → home 3 botones |
| DM-CLT-002 | Listado clientes + saldo |
| DM-CLT-003 | Búsqueda por texto |
| DM-CLT-009 | Detalle cliente |
| DM-CLT-013 | Tab Doc. de venta |
| DM-CLT-016 | Atrás listado → home clientes |
| DM-CLT-017 | Atrás detalle → listado |
| DM-CLT-019 | Formulario cliente potencial vacío |
| DM-CLT-021 | Rellenar obligatorios → botones habilitados |
| DM-CLT-024 | Guardar potencial |
| DM-CLT-026 | Enviar potencial |
| DM-CLT-031 | Eliminar potencial guardado |

### En guion completo pero NO en smoke hoy (20 casos — candidatos a decisión)

| ID | Resumen | Nota típica |
|----|---------|-------------|
| DM-CLT-004 | Búsqueda sin resultados | Siempre ejecutable |
| DM-CLT-005 | Botón búsqueda deshabilitado vacío | S3 |
| DM-CLT-006 | Borrar búsqueda → listado completo | S3 |
| DM-CLT-007 | Scroll infinito | Requiere 20+ clientes |
| DM-CLT-008 | Selector multiempresa | **N/A** si no multiempresa |
| DM-CLT-010 | Selector dirección en detalle | S3 |
| DM-CLT-011 | Añadir coordenada | Depende cliente editable |
| DM-CLT-012 | Ver coordenada | Depende coordenada registrada |
| DM-CLT-014 | Abrir documento individual | Más profundo que 013 |
| DM-CLT-015 | Popover leyenda DocVentas | S4 |
| DM-CLT-018 | Atrás home clientes → Home principal | Navegación (no en smoke) |
| DM-CLT-020 | Botones deshabilitados form vacío | Cubierto en parte por 019 |
| DM-CLT-022 | Email inválido | Validación |
| DM-CLT-023 | Teléfono inválido | Validación |
| DM-CLT-025 | Reabrir potencial guardado | Encadena 024 |
| DM-CLT-027 | Salir con cambios → modal | Flujo largo |
| DM-CLT-028 | Salir sin guardar | Depende 027 |
| DM-CLT-029 | Listado potenciales | Precondición para 031 |
| DM-CLT-030 | Búsqueda en potenciales | S3 |
| DM-CLT-032 | Vista transportista | **N/A** salvo cuenta transportista |

---

## Módulo: PEDIDOS — revisado ✅ (sin cambios)

**Decisión QA:** mantener smoke actual. **DM-PED-032** marcó FAIL en Romher (modal atrás con formulario pristine); probado **manual → OK**.

**Acción en prompt Claude:** anotar en `smoke-pedidos.md` y `guion-pedidos.md` que el modal atrás solo aplica con formulario **dirty** (cambios sin guardar), no al reabrir Guardado sin editar.

---

## Módulo: COBROS — revisado ✅ (ampliar smoke — corrida profunda)

**Decisión QA:** el smoke de Cobros debe ser **más profundo** que el resto de módulos: no solo happy path, sino **retenciones en detalle de documento**, **pagos parciales** y **persistencia tras guardar + reabrir**. Prioridad alta: el bug real descrito abajo.

**Contexto Romher/Insumar:** agente no cubre bien varios flujos; **DM-COB-039** N/A en Romher/Insumar (`enabledManualRate=false`) — solo ejecutar cuando `enabledManualRate=true` en YAML (ej. Hidroponias), N/A sin FAIL en resto.

**Smoke actual (~22 casos):** 001, 002, 004, 007, 008, 009, 040, 012, 014, 016, 018, 019, 029, 036, 037, 020, 021, 022, 024, 026, 038, 039, 028 (N/A check).

### Bug conocido (QA manual — reproducir en smoke)

**Escenario:** Cobro **normal** (no tipo Retención home), moneda **USD o BS** (no excluyente).

1. Cobro nuevo → seleccionar cliente → moneda **$** (o Bs).
2. Tab Documentos → seleccionar **1 factura en rojo** (ej. saldo 51 $).
3. Abrir **detalle del documento** → retención:
   - **Nro. comprobante retención:** longitud según cliente/VG (`sizeRetention`: 8, 14 o 16). El agente debe **leer el mensaje de validación en UI** y generar un comprobante con esa longitud.
   - Al comprobante válido → se habilita **fecha retención** → seleccionar.
   - **Monto retenido** (IVA) + **ISLR** (ej. 10 $ + 1 $) → monto a pagar neto = saldo − retenciones (ej. **40 $**).
4. Guardar detalle → Tab **Pagos** → sticky «Monto total a pagar» = **40 $** ✓.
5. Completar método de pago, **guardar cobro**, salir del flujo.
6. **Reabrir cobro Guardado** (lista BUSCAR):
   - **FAIL observado:** el monto total en Pagos **ya no resta** la retención (muestra 51 $ o similar).
   - **Esperado:** mismo neto que antes de guardar (40 $); detalle documento debe seguir mostrando 10 $ + 1 $ ISLR.

**Código de referencia:** `cobro-documents.component`, `collection-logic.service.ts` (`retencion`, `formatRetention`, `sizeRetention`).

### Casos nuevos propuestos (redactar en guion + smoke — IDs provisionales)

| ID | Qué prueba | Criterio PASS |
|----|------------|---------------|
| **DM-COB-041** *(nuevo)* | Retención en **detalle de documento** (cobro normal, VG `retencion=true`) | Comprobante longitud correcta → fecha → montos IVA/ISLR → Pagos muestra total **neto** (saldo − retenciones) |
| **DM-COB-042** *(nuevo)* | **Persistencia** tras guardar cobro con retención (**DM-COB-041** previo) | Reabrir Guardado: Pagos/Total mantienen **mismo monto neto**; detalle documento conserva retenciones |
| **DM-COB-043** *(nuevo)* | **Pago parcial** | Método de pago con monto **menor** al total → Diferencia **roja**; al completar monto → **azul** (extiende lógica 012 en flujo real con documento) |

**Perfil YAML:** `vgs.retencion=true`, `sizeRetention` (8/14/16), `cliente_cobro` con factura en rojo y saldo conocido; opcional `moneda_cobro: USD`.

### Incluir además en smoke ampliado (del guion)

| ID | Qué prueba | Nota |
|----|------------|------|
| **DM-COB-006** | Comentario obligatorio (`requiredComment`) | Crítico en Romher |
| **DM-COB-015** | Total General al final Tab Total | Complementa 014 |
| **DM-COB-033** | Selector moneda cobro (`multiCurrency`) | Romher/Insumar |
| **DM-COB-034** | Selector moneda documentos | Romher/Insumar |
| **DM-COB-024** | Reabrir cobro Guardado | Ampliar criterio: verificar **montos y retenciones**, no solo que abre |
| **DM-COB-028** | Anticipo/prepago | Flujo completo si perfil tiene `cobroPrepago` + cliente elegible; si no → N/A botón |

### Respuestas QA (cerradas para prompt)

| # | Decisión |
|---|----------|
| K1 | **Sí** — incluir 006, 015, 033, 034 en smoke ampliado |
| K2 | **Sí** — casos **041 + 042** (retención documento + persistencia); perfiles con `retencion=true` |
| K3 | **028** flujo completo cuando VG + datos; si no → N/A |
| K4 | **029** mantiene guardar + SKIP envío si `requiredCollectionAttachments=true` |
| K5 | **039** solo `enabledManualRate=true` en YAML; N/A sin FAIL |

### Smoke Cobros objetivo (orden sugerido para corrida profunda)

**Bloque base (mantener):** 001 → 002 → 004 → 007 → 008 → 009 → 040 → 012 → 014 → 016 → 018 → 019 → 022 → 024 → 026 → 020 → 021 → 038

**Bloque profundo (añadir):** 006 → 015 → 033 → 034 → **041** → **042** → **043** → 029 (N/A check) → 028 (N/A check) → 039 (N/A check)

**Total estimado:** ~30 casos (varía por N/A de VG).

---

## Módulo: DEVOLUCIONES — revisado ✅ (sin cambios)

Corrida Romher estable. Sin ajustes smoke.

---

## Módulo: INVENTARIOS — revisado ✅ (sin cambios)

Corrida Romher estable. Sin ajustes smoke.

---

## Módulo: DEPÓSITOS — sin decisión nueva

Defecto conocido DM-DEP-010/018 (`deposit.service.ts`) — no cambiar criterio FAIL hasta fix del equipo. Sin cambio de casos smoke por ahora.

---

## Módulo: VISITAS — revisado ✅ (ajuste parcial)

**Archivos:** `automation/smoke/smoke-visitas.md`, `guiones-regresion/guion-visitas.md`, orquestador agente 8, `automation/clientes/*.yaml`

**Smoke actual:** 17 casos (001, 002, 003, 004, 006, 010, 014, 015, 019, 020, 021, 022, 023, 025, 026, 031, 032)

### Excluir solo del smoke (decisión QA — parcial)

| ID | Motivo |
|----|--------|
| **DM-VIS-002** | Click "Ver mejor ruta" sin visitas pendientes → alert esperado. **Quitar del smoke** (QA, en curso). |

**Acción en guion:** nota `**Smoke:** no incluido` en fila DM-VIS-002 (permanece en guion completo).

**Smoke visitas tras ajuste:** **16 casos** (sin 002).

### Mantener en smoke (sin cambio por ahora)

001, 003, 004, 006, 010, 014, 015, 019, 020, 021, 022, 023, 025, 026, 031, 032

---

## Módulo: PRODUCTOS — revisado ✅ (ajuste smoke, no guion)

| ID | Decisión |
|----|----------|
| **DM-PRD-013** | **Mantener en smoke.** FAIL válido como alerta; si precio numérico igual en ambas listas → PASS con nota data, no FAIL. |
| **DM-PRD-019** | **Corregir smoke:** caso = botón Volver **desde lista de productos** → estructuras (guion correcto). Romher FAIL fue pantalla equivocada (agente en detalle = comportamiento de 020). |
| **DM-PRD-020** | Sin cambio — atrás desde detalle → lista. |

---

## Módulo: VENDEDORES — revisado ✅ (sin cambios)

Corrida Romher estable. Sin ajustes smoke.

---

## Plantilla por módulo (copiar al revisar)

```markdown
## Módulo: {NOMBRE} — revisado / pendiente

**Archivos:** smoke-*.md, guion-*.md, prompt-orquestador, clientes/*.yaml

### Excluir solo del smoke
| ID | Motivo |

### Eliminar del guion en general
| ID | Motivo |

### Incluir en smoke (nuevo)
| ID | Motivo |

### Mantener sin cambio
| ID | Notas |
```

---

## Anexo — APK debug local y `network_security_config.xml`

**Archivo (local, gitignore):** `DenarioPremiunMovil/android/app/src/main/res/xml/network_security_config.xml`  
**Guía equipo:** `Config/guia_network_security_config.txt`  
**Build:** `Config/createAPK_DEBUG.bat` · salida: `Escritorio\DenarioApks\{nombre}\`

### Mapeo dominio ↔ `claves.env` (HTTP permitido en Android)

| Isla / uso | Dominio en XML | `WsUrl` típica |
|------------|----------------|----------------|
| El Yaque (romher, hidroponias) | `denarioelyaque.ddns.net` | `:8081/...` |
| Isla Coche (insumar) | `denarioislacoche.ddns.net` | `:8081/...` |
| Oficina / soporte | `soportepremium.ddns.net` | `:9999/...` |

**Regla:** cambiar solo `claves.env` no basta — el dominio debe estar en el XML y **recompilar APK**.

### Prueba oficina (5-jun-2026) — resuelto ✅

| Paso | Resultado |
|------|-----------|
| Antes (solo Yaque en XML) | Error de servidor / bloqueo HTTP |
| Tras añadir `soportepremium.ddns.net` + APK `oficina-debug` | Sync/login cargando (config servidor) |
| Reintento tras fix equipo | **Login OK** — ya entra a Denario |
| Acción | Mantener XML local; oficina disponible para pruebas puntuales; smoke principal sigue en Romher/Yaque |

### Live reload (referencia)

Bloque comentado en XML para IP LAN del PC (`192.168.0.XXX`) — solo si `capacitor.config.ts` usa `server.url`. No aplica al APK empaquetado con `createAPK_DEBUG.bat`.

---

## Resumen conteo smoke tras ajustes acordados (provisional)

| Módulo | Antes | Después | Δ |
|--------|-------|---------|---|
| Login | 9 | **6** | −3 smoke; −1 eliminado guion (017) |
| Visitas | 17 | **16** | −002 |
| Clientes | 12 | **12** | — |
| Cobros | ~22 | **~30** | +006,015,033,034,041,042,043; ampliar 024 |
| Productos | 11 | **11** | aclarar texto 019/013 |
| Resto | — | sin cambio | — |
| **Total smoke** | **~130** | **~134** | ver tabla en prompt |

**Listo para Claude:** copia el bloque de abajo (**「COPIAR DESDE AQUÍ」**) en una sesión de Claude Code. Solo edición de docs; la corrida smoke la harás después en otro mensaje.

---

## COPIAR DESDE AQUÍ → pegar en Claude Code

```
Tarea: actualizar documentación smoke en DenarioPremiunMovil/qa-piloto-automatizacion/.
Solo EDITAR archivos markdown/yaml. NO ejecutar corridas, NO Playwright, NO adb, NO commit.

Lee primero: guiones-regresion/notas-ajuste-casos-smoke.md (decisiones QA completas).

Reglas: quitar de smoke ≠ borrar guion | borrar guion solo DM-LOG-017 | fuera de smoke → nota **Smoke:** no incluido en guion | N/A ≠ FAIL.
No tocar: secrets/, claves.env, network_security_config.xml, src/app/.

ARCHIVOS A EDITAR:
- automation/smoke/smoke-*.md (los que cambien abajo)
- guiones-regresion/guion-*.md (los que cambien abajo)
- guiones-regresion/prompt-orquestador-smoke.md (tabla casos + total ~134)
- automation/clientes/_schema.yaml + romher.yaml + insumar.yaml + hidroponias.yaml

── LOGIN ──
smoke-login.md: 6 casos en orden DM-LOG-002,003,004,001,011,012. Eliminar filas 008,009,017.
guion-login.md: borrar DM-LOG-017 (fila+gherkin+refs). En 008–010 añadir **Smoke:** no incluido — sin segunda cuenta QA.
orquestador agente 1: mismos 6 IDs. YAML: quitar has_second_user si ya no aplica.

── CLIENTES ── sin cambio (12 casos actuales).

── PEDIDOS ── sin cambio de IDs. En smoke-pedidos.md y guion-pedidos.md: nota DM-PED-032 — modal atrás solo si formulario dirty; reabrir Guardado sin editar → atrás sin modal.

── VISITAS ──
smoke-visitas.md: quitar DM-VIS-002. Quedan 16: 001,003,004,006,010,014,015,019,020,021,022,023,025,026,031,032.
guion-visitas.md: DM-VIS-002 → **Smoke:** no incluido. orquestador agente 8: sin 002.

── PRODUCTOS ── sin cambio de IDs. smoke-productos.md: DM-PRD-019 = volver desde LISTA de productos → estructuras (no desde detalle). DM-PRD-013 = si precio igual en ambas listas → PASS con nota, no FAIL.

── COBROS (prioridad) ──
smoke-cobros.md + guion-cobros.md + orquestador agente 4.

Lista smoke (~30, este orden):
DM-COB-001,002,004,006,007,008,015,033,034,041,042,009,040,012,043,014,016,018,019,022,024,026,020,021,038,029,028,036,037,039

VG clave: cobroRetencion → DM-COB-029 (botón RETENCIÓN home). retencion → DM-COB-041/042 (retención en detalle de documento, cobro normal COBRO). sizeRetention/formatRetention = longitud/tipo comprobante (leer UI «Debe tener N caracteres»).

Casos NUEVOS en guion + smoke (redactar filas al estilo del guion + filas tabla en smoke):

DM-COB-041 — Cobro normal, retencion=true, 1 factura en rojo (ej. saldo 51$). Detalle documento: comprobante longitud válida según UI, fecha retención, montos IVA+ISLR (ej. 10+1), guardar detalle. PASS: Pagos muestra neto (ej. 40$). N/A si retencion=false. Comentario Test-COB-041.

DM-COB-042 — Encadena 041: completar pago=neto, guardar cobro, salir, BUSCAR→reabrir Guardado. PASS: mismo neto en Pagos; detalle conserva retenciones. FAIL conocido QA: total vuelve al bruto (51$) aunque detalle tiene retenciones.

DM-COB-043 — Pago parcial: monto método < total → Diferencia roja; monto = total → azul. Extiende 012.

También en smoke: añadir 006,015,033,034. Ampliar criterio 024 (verificar montos al reabrir). Mantener notas adjunto SKIP 019/029 si requiredCollectionAttachments. 041→042 mismo cobro en secuencia.

Gherkin 041/042 al final de guion-cobros.md. Actualizar sección Regresión mínima.

_schema.yaml vgs: retencion, sizeRetention, formatRetention.
modules.cobros: documento_retencion, monto_retencion_iva, monto_retencion_islr, moneda_cobro.
Perfiles: añadir campos; si TBD comentar y poner 041,042 en smoke_na_estructural.

── DEVOLUCIONES, INVENTARIOS, DEPÓSITOS, VENDEDORES ── sin cambio.

── ORQUESTADOR ──
Actualizar tabla «ORDEN DE EJECUCIÓN»: Login 6 | Clientes 12 | Pedidos 14 | Cobros ~30 | Dev 14 | Inv 16 | Dep 12 | Visitas 16 | Productos 11 | Vendedores 3 | TOTAL ~134. Cambiar «~130 casos» por «~134» donde aparezca.

Al terminar: lista archivos modificados y resumen de cambios por módulo. No ejecutar tests.
```

## Hasta aquí — no copies esto

Después, en **otro mensaje** (cuando los docs estén listos), le pides la corrida smoke con Playwright MCP.

---

*Última actualización: un solo prompt docs-only — Jun 2026*
