# Lecciones DELTA — Denario Premium Móvil QA
## Solo novedades de la última corrida · Se resetea en cada corrida nueva

**RUN_ID última corrida:** *(actualizar al finalizar)*
**Fecha:** *(actualizar al finalizar)*
**Cliente:** *(actualizar al finalizar)*

---

> **Cómo usar este archivo:**
> - El orquestador lo lee en Paso 0 si existe y tiene contenido.
> - Contiene SOLO lo que no está en `RUNTIME.md` ni en `denario-cdp-helpers.js`.
> - Al iniciar una nueva corrida: borrar el contenido anterior y reescribir con los hallazgos nuevos.
> - Si un patrón se confirma en 2+ corridas consecutivas → mover a `RUNTIME.md` o al helper y eliminar de aquí.

---

## Patrones nuevos (esta corrida)

*(vacío — completar al finalizar la corrida)*

## Defectos nuevos encontrados

*(vacío — completar al finalizar la corrida)*

## N/As nuevos detectados en runtime

*(vacío — completar al finalizar la corrida)*

---

## Historial de graduaciones

| Patrón | Desde DELTA de | Graduó a |
|--------|---------------|----------|
| `mockCameraAdjunto` — mock de Capacitor Camera con Zone.current | RUN 20260529 | `denario-cdp-helpers.js` |
| `fetchCreds` lee archivo directo (sin servidor HTTP) | RUN 20260602 | `denario-cdp-helpers.js` |
| DM-VIS-022: visita ya Guardada se mantiene al salir sin guardar | RUN 20260529 | `RUNTIME.md` |
