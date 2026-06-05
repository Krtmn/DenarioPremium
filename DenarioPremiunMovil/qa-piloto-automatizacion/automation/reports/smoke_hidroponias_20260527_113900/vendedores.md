# Smoke Test — Módulo VENDEDORES
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-05-28 |
| **RUN_ID** | `20260527_113900_smoke-completo` |
| **Módulo** | VENDEDORES |
| **Dispositivo** | 14678405BR003855 |
| **App** | `com.kiberno.denarioPremiumPro` — Versión 6.6.14 |
| **Credenciales** | `***`/`***` |
| **Resultado global** | 2 PASS · 0 FAIL · 0 SKIP · 1 N/A |

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-VND-001 | Acceso al módulo desde Home: overlay de carga desaparece, acordeones de empresa visibles | PASS | Icono "Vendedores" visible en Home (`esVendedor = true`). Click ejecutado → URL cambia a `http://localhost/vendedores`. Overlay `ion-loading` ausente al momento de verificación (carga completada). Cabecera con título "Vendedor" (tag `VND_VENDEDOR`). 1 acordeón visible: "HIDROPONIAS VENEZOLA". `ion-accordion-group` renderizado correctamente. |
| DM-VND-002 | Expandir acordeón de empresa → mecanismo UI funciona; contraer → se oculta | N/A (datos) | **Mecanismo UI: PASS** — acordeón responde al toque: al expandir se aplica clase `accordion-expanded` y shadow DOM muestra `part="content expanded"` (`groupValue = "ion-accordion-3"`). Al contraer: `isExpanded: false`, `part="content"` (sin expanded). Cabecera "HIDROPONIAS VENEZOLA" legible en ambos estados. **Contenido vacío** — el slot content muestra solo nodos de comentario Angular (`<!---->`), lo que indica que `@if (showInfo(empresa, info))` no se evaluó como verdadero: el API no devolvió datos para esta empresa. Comportamiento esperado per supuesto 2 del guion → marcado N/A por ausencia de datos, no FAIL de UI. |
| DM-VND-007 | Botón atrás en cabecera → navega a Home principal | PASS | Click en elemento IMG con `routerLink="/home"` (botón atrás cabecera, implementación via imagen con routerLink). URL tras navegación: `http://localhost/home`. App en estado Home confirmado. |

## Hallazgos (solo si hay FAIL u observaciones)

### Observación — DM-VND-002: contenido de acordeón vacío (no FAIL)

- **Empresa:** HIDROPONIAS VENEZOLA
- **Señal:** El slot `content` del acordeón contiene únicamente nodos de comentario Angular (`<!---->`), sin KPIs ni HTML renderizado.
- **Causa probable:** El endpoint `userservice/userinformation` no devolvió datos para esta empresa en el momento de la prueba (modo API activo, `infoVendedores = false` por defecto). El bloque `@if (showInfo(empresa, info))` en `vendedores.component.html:25-83` no renderiza nada cuando no hay datos.
- **Clasificación:** N/A por ausencia de datos (supuesto 2 del guion) — no es FAIL de interfaz. El mecanismo de acordeón (expandir/contraer) funciona correctamente.
- **Recomendación:** Verificar conectividad al endpoint `userservice/userinformation` y que el token de autenticación sea válido para esta empresa. Si se esperaban datos, investigar respuesta del backend.

### Observación — Botón atrás: implementación como IMG con routerLink

- El botón atrás en la cabecera está implementado como un elemento `<img routerLink="/home">` envuelto en un enlace Angular, sin `ion-back-button`. La navegación funciona correctamente. No se considera FAIL, es un patrón de implementación propio del módulo.

---
*Generado por Claude Code · Playwright MCP CDP · 2026-05-28*
