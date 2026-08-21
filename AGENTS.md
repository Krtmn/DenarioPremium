# AGENTS.md — Denario Premium Mobile

Guía operativa para agentes de IA. Estándares de código detallados: [`.cursor/rules/programming-standards.mdc`](.cursor/rules/programming-standards.mdc).

## Propósito

App de **fuerza de ventas en campo**, **offline-first**: catálogo, clientes, pedidos, cobros, devoluciones, inventarios, depósitos, visitas/despachos y sincronización contra PremiumWS.

Código de la app: `DenarioPremiunMovil/`.  
Documentación funcional: `DenarioPremiunMovil/DOCUMENTACION_APP.md`.

## Stack

Angular 19.2 | Ionic 8.6 | Capacitor 6.2 | TypeScript 5.8 | RxJS 7.8 | SCSS  
SQLite (`@awesome-cordova-plugins/sqlite` + `cordova-sqlite-storage`)

## Arquitectura (no romper)

- **NgModule clásico** — componentes con `standalone: false`, declarados en módulos. **No** migrar a standalone.
- Servicios: `providedIn: 'root'`; DI preferida con `inject()`.
- Routing: `AppRoutingModule`, `PreloadAllModules`, lazy donde ya exista.
- Offline-first: UI lee/escribe SQLite; envío de transacciones vía cola / `AutoSendService` (POST); listados maestros vía sync (`syncservice/getsync`), no GET por recurso.

## Estructura relevante

```
DenarioPremiunMovil/src/app/
  modelos/tables/     # 1 modelo por tabla local
  services/           # dominio + synchronization/ + autoSend/
  pedidos|cobros|devoluciones|clientes|.../   # features
  utils/
```

## Cómo trabajar (impacto mínimo)

1. **Cambios pequeños y localizados** — no refactors amplios ni “limpiezas” colaterales salvo pedido explícito.
2. **Leer el archivo (y usos) antes de editar** — buscar patrones existentes en el mismo módulo.
3. **Reutilizar** servicios/helpers del dominio; no inventar capas nuevas.
4. Funciones: una responsabilidad; nombres `verbo + contextoDeDominio` (ej. `buildCollectionPayload`).
5. Complejidad: preferir 20–40 líneas; si crece, extraer helpers privados con mini-plan.
6. TypeScript estricto: tipar parámetros/retorno; evitar `any`; `const` por defecto; `?.` / `??`.
7. Preferir `async/await` sobre cadenas `.then()` nuevas.
8. UI en español; Ionic (`ion-*`) + SCSS del tema (`src/theme/variables.scss`).
9. **No borrar código** sin confirmar quién lo consume.
10. Tests: Jasmine/Karma; seguir specs vecinos (`waitForAsync`). Lint: `npm run lint` — no desactivar reglas a la ligera.

## Offline, sync y envío

- Queries SQL: en sync y servicios de dominio. **No** cambiar SQL sin alinear `modelos/tables/` y esquema real.
- No asumir filas en SQLite: el dato puede faltar hasta sync.
- Cobros/pedidos/etc. visibles en UI = datos locales (sync + creados en dispositivo).
- Envío: POST a `…/PremiumWS/services/…` (order, collection, return, …) con payload tipado; campos numéricos no deben ir `null` si el backend espera número.
- Adjuntos/listados de archivos: endpoints propios (`listfilespremium`, download); no confundir con sync de tablas.

## HTTP y secretos

- Runtime: `claves.env` → `window.__env` (carga en `main.ts`). **No** usar `environment.ts` ni hardcodear URLs/tokens.
- Preferir `CapacitorHttp` en flujos nativos/producción; `HttpClient` solo donde el proyecto ya lo usa de forma deliberada.
- **Nunca** versionar `claves.env`, credenciales ni dumps de BD del dispositivo.
- Herramientas locales (Bruno, scratch): bajo `.local/` (gitignored).

## Git (solo si el usuario lo pide)

- Commit solo con pedido explícito; mensajes **siempre en español** (ver `.cursor/rules/commits-espanol.mdc` y `.cursorrules` para el botón sparkle de Source Control).
- Estilo: Conventional Commits (`fix`, `feat`, …) con subject orientado al porqué, no al listado de archivos.
- No `push --force`, no `--no-verify`, no tocar `git config`.
- No incluir `local.properties`, secrets ni ruido CRLF de Android.

## Comandos (cwd: `DenarioPremiunMovil/`)

| Comando | Uso |
|---------|-----|
| `npm start` | Dev (`ng serve`) |
| `npm run build` | Build producción |
| `npm test` | Unit tests |
| `npm run test:cobros` | Unit tests del módulo Cobros (`collection-logic`) |
| `npm run lint` | ESLint |

Catálogo QA por módulo (qué prueba cada caso + backlog de blindaje): `DenarioPremiunMovil/docs/qa/`. Cobros: `docs/qa/cobros/`.

## Errores frecuentes

- Asumir standalone components.
- Usar `HttpClient` donde el flujo nativo ya usa `CapacitorHttp`.
- Cambiar SQL/sync sin revisar modelos.
- Hardcodear `WsUrl` / tokens.
- Tratar listados de pedidos/cobros como GET REST (son sync + SQLite).
- Refactor “de pasada” fuera del archivo/tarea pedida.
- Commit de `.local/`, `claves.env` o datos de dispositivo.
- En Cobros: asumir que Enviar ON/OFF es solo “monto exacto” sin revisar `tolerancia0`, rangos y completitud del método.
- En Transferencia: invertir emisor/receptor al rehidratar desde SQLite (`nuBankAccount` vs `nuClientBankAccount`).

## Cobros — Transferencia y botón Enviar (contexto operativo)

Catálogo unitarios + plan de blindaje QA: `DenarioPremiunMovil/docs/qa/cobros/`.  
Bugs: `BUGS.md` (`COB-*`). Checklist corta: `.cursor/rules/bug-prevention.mdc`.

Referencia para no re-diagnosticar síntomas ya entendidos. Código clave:

- `cobro-general.component.ts` — hidratación al reabrir (`loadPayments`, `buildHydratedTransferenciaPayment`)
- `cobro-pagos.component.ts` — UI de métodos de pago / `setMonto`
- `collection-logic.service.ts` — `validateToSend`, `checkTolerancia`, `isTransferenciaPaymentComplete`, `hasIncompletePaymentMethods`, `onCollectionValidToSend`

### Contrato de campos Transferencia (persistido vs UI)

| Rol | SQLite / `CollectionPayment` | UI `PagoTransferencia` |
|-----|------------------------------|-------------------------|
| Receptor (cuenta empresa) | `nuBankAccount`, `idBank`, `naBank` | `numeroCuenta`, `bancoReceptor` |
| Emisor (cuenta cliente) | `nuClientBankAccount`, `coClientBankAccount` | `numeroCuentaCliente` |
| Nueva cuenta (texto libre) | `newNuClientBankAccount` (+ flags co/nu = "Nueva Cuenta") | `nuevaCuenta`, `showNuevaCuenta` |

Al **reabrir**, `loadPayments` case `'tr'` debe mapear receptor ← `nuBankAccount` y cliente ← `nuClientBankAccount`, y reconstruir `bankAccountSelected` / `clientBankAccountSelected`. Invertir esos campos deja Enviar en OFF tras guardar aunque SQLite esté bien.

Si `clientBankAccount` (config) es **false**, no se exige emisor ni "Nueva Cuenta" para completar el método TR.

### Completitud vs monto (síntomas ya corregidos)

1. **Monto exacto no habilitaba Enviar** con `clientBankAccount=true` si se exigía siempre `nuevaCuenta` → corregido en `isTransferenciaPaymentComplete`.
2. **Bajar el monto dejaba Enviar ON** → al cambiar monto no forzar ON; revalidar tolerancia/completitud.
3. **Guardar → reabrir Enviar OFF** → mapeo invertido en hidratación TR (fase 1 en `cobro-general`).

### Tolerancia: por qué Enviar se activa con montos muy bajos (ej. 0.1)

No es umbral mínimo de UI. Si `tolerancia0=true`, `TipoTolerancia=0` (importe absoluto), `RangoToleranciaNegativa` alto (ej. 100000) y `MonedaTolerancia` = moneda del cobro, entonces `checkTolerancia()` hace `amount = montoTotalPagado - montoTotalPagar` y, si `amount < 0`, habilita Enviar cuando `Math.abs(amount) <= RangoToleranciaNegativa` (deshabilita solo si el faltante **supera** el rango). Solo bloquea montos `<= 0`.

Ejemplo: pagar `0.1` de una factura de `500` → faltante `499.9` < `100000` → Enviar ON si el método está completo. Eso es config/negocio, no bug de Transferencia.

Notas:

- `automatedPrepaid` / `prepaidRangeAmount` aplican a **sobrante**, no a subpago.
- `onCollectionValidToSend(false)` puede forzarse a true si `createAutomatedPrepaid` está activo (bypass de completitud/tolerancia en exceso).
- `requiredComment` / `requiredCollectionAttachments` pueden no apagar el botón Enviar; a menudo bloquean al pulsar enviar.

### Config de prueba típica (cliente)

- `clientBankAccount`: false
- `tolerancia0`: true, `TipoTolerancia`: 0
- `RangoToleranciaPositiva` / `RangoToleranciaNegativa`: 100000
- `MonedaTolerancia`: `$`
- `automatedPrepaid`: true, `prepaidRangeAmount`: 1
- `colletionPayment`: métodos habilitados según flags `ef-ch-de-tr-ot-pm` (ej. sin cheque)
- `requiredComment` / `requiredCollectionAttachments`: true

### Pendiente conocido (no mezclar en hotfixes de mapeo)

- Fase 2: persistencia/UI de "Nueva Cuenta" al reabrir y posibles carreras con `validateReferencePayment` / `refreshSendStateAfterPaymentsHydrated` cuando `clientBankAccount=true`.

## Referencias

- Estándares siempre aplicados: `.cursor/rules/programming-standards.mdc`
- Prevención bugs (checklist): `.cursor/rules/bug-prevention.mdc`
- Historial de bugs mapeados: [`BUGS.md`](BUGS.md)
- Funcional / flujos: `DenarioPremiunMovil/DOCUMENTACION_APP.md`
