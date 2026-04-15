# Memories — Cursor (Denario Premium Móvil)

Contexto estable del proyecto para Chat, Agent, Composer y automatizaciones. Mantener frases cortas y hechos que no cambian cada sprint.

**Uso sugerido:** referenciar con `@memories.md`, incluir en reglas del proyecto (`.cursor/rules`) o adjuntar en automatizaciones según la UI de Cursor.

---

## Estructura del repositorio

- Código de la app en **`DenarioPremiunMovil/`** (nombre exacto de la carpeta).
- Fuentes Angular/Ionic: **`DenarioPremiunMovil/src/`**; salida de build: **`www/`**.
- En `angular.json`: proyecto **`app`**, prefijo de selectores **`app`**.

## Stack

- **Angular** ~19, **Ionic Angular** 8.x, **Capacitor** 6.x, **TypeScript** ~5.8, **RxJS** ~7.8, **SCSS**.
- Conviven **Capacitor** con **Cordova / Awesome Cordova** (SQLite, filesystem, cámara, geolocalización, etc.).

## Comandos (desde `DenarioPremiunMovil/`)

- `npm start` / `ng serve` — desarrollo.
- `npm run build` — producción.
- `npm run lint`, `npm test` — calidad.
- `npm run ios:sync` / `ios:copy` — iOS tras build.
- `npx cap sync` cuando haya que reflejar cambios web en proyectos nativos.

## Entorno en runtime

- **`claves.env`** se empaqueta como asset (ver `angular.json`, entrada desde `..`).
- **`main.ts`** carga el archivo al arranque y define **`window.__env`** (objeto clave-valor).
- URL de API (**`WsUrl`**) y claves (p. ej. **Google Maps**) se leen de `__env` en servicios. No hardcodear secretos en el repo.

## Dónde tocar qué

- HTTP / API: **`DenarioPremiunMovil/src/app/services/`** (p. ej. `ServicesService` y consumo de `getURLService()` / `__env`).
- Sync y base local: **`DenarioPremiunMovil/src/app/services/synchronization/`** (p. ej. `synchronization-db.service.ts`); impacto en offline y colas.
- Modelos: **`src/app/modelos/`** — reutilizar antes de duplicar tipos.

## Nativo

- **`DenarioPremiunMovil/android/`** y **`ios/`** (Capacitor). Cambios en manifest, permisos o red: validar en dispositivo/emulador.

## Convenciones para el agente

- Diffs pequeños y alineados al pedido; sin refactors masivos no solicitados.
- Seguir **ESLint / angular-eslint** y patrones existentes (RxJS, `providedIn: 'root'`).
- Textos y dominio: coherencia con **español** y nomenclatura ya usada en la app.
- No versionar **`claves.env`** ni credenciales.

## Fuente de verdad

- Versiones de dependencias: **`DenarioPremiunMovil/package.json`**.
- Bugs o trabajo puntual: issues/PRs, no este archivo.
