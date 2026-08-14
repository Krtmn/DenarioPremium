# Smoke manual — gzip JSON (Spring Boot server.compression)

Verificar que PremiumWS con `server.compression.enabled: true` sigue funcionando en la app móvil.

## Precondiciones

- PremiumWS con compresión activa (`application/json`, `min-response-size` según yml del servidor).
- `claves.env` apunta al entorno a probar (HTTPS prod Heinz o dev).
- Build Android nativo (`npm run build && npx cap sync android`), no solo `ng serve`.

## Casos

| ID | Flujo | Esperado |
|----|-------|----------|
| GZIP-001 | Login (`authservice/auth`) | `errorCode` `000`, token guardado. Respuesta puede ser sin gzip si payload < min-size. |
| GZIP-002 | Sync completa (`syncservice/getsync`) | Tablas descargan; SQLite se actualiza; sin JSON corrupto ni `\u001f` en logs. |
| GZIP-003 | AutoSend (ej. cobro/pedido pendiente) | POST responde objeto con `errorCode`; cola avanza. |
| GZIP-004 | `userservice/userinformation` | Datos de vendedor cargan en home. |

## Fallo típico (regresión)

- `resp.data` string binario (`\u001f\ufffd...`) en Android.
- Sync falla al parsear tablas.
- Causa habitual: header `Accept-Encoding: gzip` añadido en TypeScript (no hacerlo).

## Diagnóstico rápido

1. Logcat: buscar errores JSON en CapacitorHttp.
2. Confirmar response headers incluyen `Content-Encoding: gzip` solo en payloads grandes.
3. Confirmar [`services.service.ts`](../../../src/app/services/services.service.ts) no envía `Accept-Encoding`.

## Referencia

- Patch Android: `scripts/apply-capacitor-gzip-patch.js` (GZIPInputStream en `HttpRequestHandler`, corre en `postinstall`).
- Plan: no añadir `pako` en TypeScript; descompresión nativa.
