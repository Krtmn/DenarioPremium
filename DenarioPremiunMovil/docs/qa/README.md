# QA — Denario Premium Móvil

Documentación de **pruebas por módulo**: qué cubre cada test unitario, qué queda en smoke manual y backlog de blindaje.

## Convención (usar en cada módulo)

```
docs/qa/
  README.md                 ← este índice
  <modulo>/
    unit-tests-catalog.md   ← qué hace cada caso unitario (para humanos / QA)
    hardening-backlog.md    ← gaps, prioridades, pirámide de pruebas
```

| Qué | Dónde |
|-----|--------|
| Catálogo de casos unitarios + IDs (DM-*, COB-*) | `docs/qa/<modulo>/unit-tests-catalog.md` |
| Gaps / plan de blindaje QA | `docs/qa/<modulo>/hardening-backlog.md` |
| Post-mortem de bugs (síntoma → causa → fix) | `BUGS.md` (raíz del repo) |
| Checklist corta anti-regresión para la IA | `.cursor/rules/bug-prevention.mdc` |
| Contexto operativo de dominio (Cobros/TR) | `AGENTS.md` |

**No** meter catálogos largos en `AGENTS.md` ni en `BUGS.md`.  
**Sí** linkear desde `AGENTS.md` al módulo cuando haya contexto operativo.

## Módulos

| Módulo | Catálogo | Backlog | Script npm |
|--------|----------|---------|------------|
| Cobros | [cobros/unit-tests-catalog.md](./cobros/unit-tests-catalog.md) | [cobros/hardening-backlog.md](./cobros/hardening-backlog.md) · [smoke](./cobros/smoke-manual.md) | `npm run test:cobros` (**70**) · CI `cobros-unit.yml` |
| Pedidos | _(pendiente)_ | _(pendiente)_ | — |
| Devoluciones | _(pendiente)_ | _(pendiente)_ | — |
| Clientes | _(pendiente)_ | _(pendiente)_ | — |

## Cómo correr unitarios de un módulo

Desde `DenarioPremiunMovil/`:

```bash
npm run test:cobros
```

Al abrir un módulo nuevo: crear carpeta `docs/qa/<modulo>/`, script `test:<modulo>` en `package.json`, y actualizar esta tabla.
