# Archivo histórico

Documentos que **cumplieron su ciclo de vida** y salieron de la carpeta activa
(política de limpieza de `CLAUDE.md`). Se conservan por valor histórico; **no son referencia vigente**.

| Archivo | Qué era | Por qué salió |
|---|---|---|
| `bdd-schema.md` | Primera documentación del esquema PostgreSQL (2026-06-23, capturas DBeaver) | **Supersedido por `automation/db/modelo-datos-denario.md`**, que cubre las mismas tablas, es más completo (inventario de 180 tablas, modelo por dominio, VGs, mapa "módulo QA → tablas") y es el que referencian `RUNTIME §10` y `alta-cliente.md`. Nadie referenciaba `bdd-schema.md`. **Sus queries útiles se rescataron** a `modelo-datos-denario.md §10` antes de archivarlo |

## Eliminados (recuperables desde git)

Los 4 documentos del **handoff por ZIP** entre las dos QA (junio 2026) se **eliminaron** el 2026-07-28:
`CAMBIOS-SYNC-20260617.md` · `CAMBIOS-SYNC-20260623.md` · `LEEME-HANDOFF.md` · `INTEGRACION.md`.

Describían un traspaso puntual por archivo comprimido ("para la compañera que recibe esta carpeta
comprimida", "si recibís el zip nuevo y reemplazás encima"). Hoy el equipo trabaja sobre la rama git
compartida, así que ese flujo **ya no existe**, y sus decisiones de diseño están en `PROPUESTAS-CAMBIOS.md`
—los propios documentos lo decían—. Además habían quedado **desactualizados**: presentaban como novedades a
integrar cosas que llevan un mes en el sistema (el allowlist de `.claude/settings.json`, el agente BD que
devuelve en vez de escribir). Una instrucción vieja confunde más de lo que ayuda.

Recuperarlos: `git log --diff-filter=D --name-only -- '*LEEME-HANDOFF*'` y `git show <commit>^:<ruta>`.
