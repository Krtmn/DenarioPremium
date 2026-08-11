# Smoke Test — Módulo VENDEDORES
**RUN_ID:** 20260529_145657_smoke-completo  
**Fecha ejecución:** 2026-05-29  
**App:** com.kiberno.denarioPremiumPro — Ionic 6 + Angular 19 + Capacitor 6 (Android WebView)  
**Cuenta QA:** Yaque / usuario 001 — `esVendedor=true`, `enterpriseEnabled=true`  
**Estado inicial:** Home principal | **Estado final:** Home principal

---

## Resumen

| PASS | FAIL | SKIP | N/A |
|------|------|------|-----|
| 2    | 0    | 0    | 1   |

---

## Tabla de resultados

| ID | Resultado | Evidencia |
|----|-----------|-----------|
| DM-VND-001 | PASS | `app-vendedores` visible en `/vendedores`; `ion-loading` ausente al terminar carga; 1 acordeón visible con empresa "HIDROPONIAS VENEZOLA" |
| DM-VND-002 | PASS | Acordeón expandido (`accordion-expanded`), contenido vacío por ausencia de datos API → N/A para KPIs; acordeón contraído (`accordion-collapsed`), cabecera legible en ambos estados |
| DM-VND-007 | PASS | `img.fechaAtras` clickeado desde `/vendedores` → navegación a `/home`; `app-home` visible al terminar |

---

## Notas

- **DM-VND-002 — contenido vacío:** El acordeón de empresa "HIDROPONIAS VENEZOLA" expandió correctamente (clase `accordion-expanded`), pero los 3 bloques `*ngIf` del slot `content` se renderizaron vacíos (comentarios Angular `<!---->`). La app no devolvió error; la estructura DOM es correcta. Clasificado como **N/A por ausencia de datos API** según criterio del guion (supuesto 2) y `SKILLS.md`. El toggle expand/collapse funcionó sin defecto.
- **esVendedor=true** confirmado: el icono "Vendedores" apareció en Home y la navegación a `/vendedores` fue exitosa.
- **enterpriseEnabled=true** confirmado: empresa "HIDROPONIAS VENEZOLA" visible como cabecera de acordeón.
- Módulo de solo lectura — no se generaron registros.

---

*Generado por agente QA CDP · Claude Sonnet 4.6 · RUN_ID 20260529_145657_smoke-completo*
