# Tech Context

## Stack principal
- Angular 19
- Ionic 8
- Capacitor 6
- Cordova plugins (incluyendo SQLite)
- SQLite local (`cordova-sqlite-storage`, `@awesome-cordova-plugins/sqlite`)

## Configuración y entorno
- Archivo de configuración runtime: `claves.env`
- Carga de variables en `src/main.ts` hacia `window.__env`
- URL backend consumida por `ServicesService` mediante `WsUrl`

## Comandos frecuentes
- Desarrollo web: `npm start`
- Build: `npm run build`
- Tests unitarios: `npm test`
- Android (según flujo local): scripts de `Config/createAPK_windows.bat`

## Consideraciones técnicas críticas
- SQLite es nativo: en web se requieren mocks para pruebas de UI/lógica.
- Sincronización depende de conectividad y estado de tablas/versiones.
- Evitar exponer keys en repositorio o documentación.
