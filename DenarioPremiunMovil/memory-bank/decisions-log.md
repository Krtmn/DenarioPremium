# Decisions Log

## 2026-03-04 — Configuración MCP segura para TestSprite
- **Decisión**: usar variable de entorno (`TESTSPRITE_API_KEY`) en lugar de key hardcodeada.
- **Motivo**: reducir exposición de secretos y permitir rotación de credenciales.
- **Impacto**: mayor seguridad operativa y configuración reutilizable entre entornos.

## 2026-03-04 — Mantener un solo archivo MCP en la raíz del workspace
- **Decisión**: consolidar configuración en `.vscode/mcp.json` de la raíz.
- **Motivo**: evitar ambigüedad por configuraciones duplicadas.
- **Impacto**: menor riesgo de errores de carga de servidor MCP.

## 2026-03-04 — Priorizar pruebas backend/móvil sobre web para este proyecto
- **Decisión**: no depender de pruebas web para validar comportamiento SQLite nativo.
- **Motivo**: el plugin SQLite requiere runtime móvil y no replica totalmente en browser.
- **Impacto**: estrategia de pruebas más alineada al entorno real de producción.
