# Active Context

## Estado actual (2026-03-04)
- MCP de TestSprite configurado en el workspace con variable de entorno.
- Documentación funcional creada (`DOCUMENTACION_APP.md`).
- Resumen ejecutivo creado (`DOCUMENTACION_APP_EJECUTIVA.md`).
- Build del proyecto reportado en verde (`npm run build`).

## Foco inmediato
1. Definir estrategia de pruebas para entorno móvil real (sin depender de web para SQLite).
2. Implementar (si aplica) capa mock de SQLite para pruebas web controladas.
3. Formalizar pipeline de pruebas E2E móvil (Appium/Detox).

## Bloqueadores observados
- Flujo CLI directo de TestSprite no reemplaza completamente el flujo MCP del chat.
- SQLite nativo limita pruebas web end-to-end del comportamiento real de producción.

## Próximas acciones sugeridas
- Crear carpeta `mobile-e2e/` con baseline Appium.
- Definir smoke tests críticos (login, sync, pedido, cobro).
- Acordar política de sincronización y reintentos en escenarios offline.
