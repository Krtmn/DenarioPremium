# Notas — Ajuste de casos smoke por módulo

**Propósito:** registrar decisiones módulo a módulo antes de armar el **prompt único a Claude** que sincronice:

- `automation/smoke/smoke-{modulo}.md` (qué corre en smoke)
- `guiones-regresion/guion-{modulo}.md` (catálogo completo manual)
- `guiones-regresion/prompt-orquestador-smoke.md` (tabla de casos por agente)
- `automation/clientes/*.yaml` (`smoke_na_precalculado` / variantes si aplica)

**Estado:** en revisión — **no ejecutar cambios en repo hasta prompt final acordado.**

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

## Módulo: CLIENTES — en revisión

**Archivos:** `automation/smoke/smoke-clientes.md`, `guiones-regresion/guion-clientes.md`, orquestador agente 2, `automation/clientes/*.yaml`

### Smoke actual (12 casos — orquestador y `smoke-clientes.md`)

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

### Preguntas para QA (CLIENTES)

| # | Pregunta |
|---|----------|
| C1 | ¿Mantener el bloque **cliente potencial** en smoke (019, 021, 024, 026, 031)? Escribe datos en BD y alarga la corrida. |
| C2 | ¿Quitar **DM-CLT-031** (eliminar) del smoke y dejar limpieza manual / solo regresión completa? |
| C3 | ¿Incluir **DM-CLT-018** (atrás a Home principal) o **DM-CLT-029** (abrir listado potenciales) en smoke? |
| C4 | ¿Algún caso del smoke actual se quita? (ej. 013 si no hay documentos, 017 si navegación frágil en CDP) |
| C5 | ¿Algún caso se **elimina del guion** (como DM-LOG-017) o solo «fuera de smoke»? |

_(Completar tablas «Excluir / Incluir / Eliminar guion» cuando QA responda.)_

---

## Módulo: PEDIDOS — pendiente

---

## Módulo: COBROS — pendiente

---

## Módulo: DEVOLUCIONES — pendiente

---

## Módulo: INVENTARIOS — pendiente

---

## Módulo: DEPÓSITOS — pendiente

---

## Módulo: VISITAS — en revisión

**Archivos:** `automation/smoke/smoke-visitas.md`, `guiones-regresion/guion-visitas.md`, orquestador agente 8, `automation/clientes/*.yaml`

**Smoke actual:** 17 casos (001, 002, 003, 004, 006, 010, 014, 015, 019, 020, 021, 022, 023, 025, 026, 031, 032)

### Excluir solo del smoke (decisión QA — parcial)

| ID | Motivo |
|----|--------|
| **DM-VIS-002** | Click "Ver mejor ruta" sin visitas pendientes → alert esperado. **Quitar del smoke** (QA, en curso). |

**Acción en guion:** nota `**Smoke:** no incluido` en fila DM-VIS-002 (permanece en guion completo).

**Smoke visitas tras este ajuste (provisional):** **16 casos** (sin 002). Pendiente más exclusiones/inclusiones de QA.

### Mantener en smoke (sin cambio por ahora)

001, 003, 004, 006, 010, 014, 015, 019, 020, 021, 022, 023, 025, 026, 031, 032

### Pendiente decisión QA

_(Añadir aquí más casos a quitar/incluir según indique QA.)_

---

## Módulo: PRODUCTOS — pendiente

---

## Módulo: VENDEDORES — pendiente

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

*Última actualización: VISITAS — DM-VIS-002 fuera smoke (parcial) — Jun 2026*
