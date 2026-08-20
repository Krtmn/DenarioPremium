# Clientes — Hardening backlog

## Pirámide

| Capa | Estado | Notas |
|------|--------|--------|
| Unit (lógica / flags) | Activo | `npm run test:clientes` |
| Smoke manual | Activo | [smoke-manual.md](./smoke-manual.md) |
| E2E dispositivo | Pendiente | No automatizar overlay/SQLite/GPS aún |

## Gaps / siguientes tramos

1. ~~**Header** (`client-header`): DM-CLT-027/028 (modal salir con cambios), send confirm.~~ Cubierto por POT-SAVE-001 (validación Guardar/Enviar + confirmaciones).
2. ~~**CLI-SALDOS-001** blindaje display-from-docs~~ (app). Maestro `co_currency` sigue recomendado.
3. **Share modal / coordenadas internas / adjuntos / firma** — fuera del guion actual.
4. Specs scaffold restantes (`clientes.component`, document-sale, location, DB services) — no incluir en CI hasta reescribirlos.
5. ~~Documentar/decidir laguna #4 (`naResponsible` en FormGroup pero no en `checkForm`).~~ Incluido en `hasPotentialClientFieldErrors()` (POT-SAVE-001).
6. Laguna #5: modal salir con `newPotentialClientChanged` en cualquier edición — revisar en dispositivo.

## Prioridad sugerida

P0: mantener verdes unitarios de saldos + form validation + back flags.  
P1: header exit/send.  
P2: E2E smoke automatizado solo si hay harness estable.
