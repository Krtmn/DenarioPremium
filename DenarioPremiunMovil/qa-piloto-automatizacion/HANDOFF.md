# Handoff — puesta en marcha del piloto QA en otra máquina

> **Para quien recibe la rama `feature/qa-guiones-regresion` por primera vez.**
> Esto cubre **solo lo que NO viaja por git**. Una vez terminado, seguí con
> `MANUAL-CORRIDAS.md`, que es el manual de verdad (requisitos, cómo lanzar una corrida, arquitectura).

**Tiempo estimado:** 15–20 min, casi todo esperando descargas.

---

## 0. Antes que nada: dos reglas

1. 🔴 **No mergear esta rama a `main`.** `main` lo toca **solo desarrollo**. Esta rama es material de QA
   y debe mantenerse como *reflejo de main + carpeta QA*, nada más.
2. 🔴 **Los archivos que te pasaron aparte NUNCA se commitean.** El `.gitignore` ya te cubre, pero si
   alguna vez ves un `.env` en `git status`, **pará y avisá** — algo se rompió.

---

## 1. Traerte la rama

```bash
git clone https://github.com/KibernoDevs/DenarioPremiumMovil.git
cd DenarioPremiumMovil
git checkout feature/qa-guiones-regresion
```

> ⚠ Si el repo ya lo tenías clonado de antes con la dirección vieja (`Krtmn/DenarioPremium`),
> actualizá el remote:
> `git remote set-url origin https://github.com/KibernoDevs/DenarioPremiumMovil.git`

**Verificación:** `git log --oneline -3` tiene que mostrarte commits de la corrida web de Caribe.

---

## 2. Colocar los archivos que te pasaron aparte

Vienen en un `.zip` por canal seguro (**no** por el repo). Cada uno va en un lugar exacto:

| Archivo del zip | Dónde va (desde la raíz del repo) | Para qué sirve |
|---|---|---|
| `qa-credentials.env` | `DenarioPremiunMovil/qa-piloto-automatizacion/secrets/` | Login de QA en la app y en la web |
| `qa-db.env` | `DenarioPremiunMovil/qa-piloto-automatizacion/secrets/` | Conexiones a las bases (el oráculo de toda la validación) |
| `claves.env` | **raíz del repo**, al lado de `DenarioPremiunMovil/` | Define contra qué servidor apunta la app (`WsUrl`) |
| `Config/*.bat` y `Config/*.txt` | `Config/` (creala si no existe) | Scripts para compilar la APK debug |

**Verificación:** los tres `.env` tienen que estar en su sitio **y no aparecer** en `git status`.
Si aparecen, no los commitees: avisá.

---

## 3. Ajustar el script de la APK ⚠

`Config/createAPK_DEBUG.bat` trae **rutas absolutas de la máquina donde se escribió**. Si no las cambiás,
te compila contra carpetas que no existen. Editá estas tres líneas y poné **tus** rutas:

| Línea | Variable | Qué poner |
|---|---|---|
| 4 | `ANDROID_DIR` | `<tu-ruta>\DenarioPremiunMovil\android` |
| 5 | `PROJECT_DIR` | `<tu-ruta>\DenarioPremiunMovil` |
| 8 | `OUTPUT_DIR` | dónde querés que te deje el `.apk` |

*(El zip **no** incluye el keystore de firma: no hace falta para APKs debug.)*

---

## 4. Comprobar que la base responde

Es la mejor prueba de que los secretos quedaron bien. Los `node_modules` ya vienen en el repo,
así que **no hace falta `npm install`**:

```bash
cd DenarioPremiunMovil/qa-piloto-automatizacion
node automation/db/query.js el_valle "SELECT count(*) FROM collection"
```

Tiene que devolverte un JSON con un número. Si da error de conexión → revisá `secrets/qa-db.env`.

---

## 5. Compilar e instalar la APK (solo si vas a correr móvil)

Con el teléfono conectado y **depuración USB activa**:

```
Config\createAPK_DEBUG.bat mi-apk-qa
```

El flujo que corre por dentro es el de Capacitor 6:
`npm run build` → `npx cap sync android` → `gradlew assembleDebug`, y al final te la instala con `adb`.

> ⚠ **Verificación puntual la primera vez.** Se revirtieron unos archivos de producto que esta rama
> arrastraba de más (ver `git log` del 04/08/2026). Al compilar tu primera APK, probá **una foto adjunta
> y un mapa** en cualquier transacción:
> - **Los mapas** deben cargar. Antes no cargaban: la rama había perdido la API key de Google Maps.
>   Con el revert vuelve, y esta prueba lo confirma.
> - **La cámara y los adjuntos** deben seguir funcionando. Los permisos `CAMERA` y `READ_MEDIA_*` ahora
>   los tienen que inyectar los plugins de Capacitor por *manifest merge*, que es como funciona la APK
>   de producción. Si fallaran, **es tema de `main` y va a desarrollo** — no se vuelve a parchear el
>   manifest desde esta rama.

---

## 6. De acá en adelante

Seguí con **`MANUAL-CORRIDAS.md`** §2 (requisitos de tu máquina: node, adb, scrcpy, el MCP de Playwright)
y §3 (cómo lanzar una corrida, con checklist para la primera).

Otras lecturas útiles, en orden:

| Documento | Para qué |
|---|---|
| `README.md` | Mapa de la carpeta y qué es cada cosa |
| `CLAUDE.md` | Reglas de edición y alcance — **qué NO se toca** |
| `automation/cdp/RUNTIME.md` | Reglas operativas de las corridas móviles |
| `automation/web/WEB-RUNTIME.md` | Ídem para las corridas web (read-only sobre producción) |
| `guiones-regresion/guia-sync-git-rama-qa.md` | Cómo traerte cambios de `main` sin ensuciar la rama |

---

## 7. Estado al momento del handoff (04/08/2026)

- **Corrida web de la playa Caribe: en pausa.** Pedidos y Facturaciones cerrados; **Cobros quedó a
  medias** y sin veredictos. Motivo: van a cambiar el cliente montado en esa playa, así que los
  hallazgos de datos nacían invalidados. Detalle en
  `automation/reports/web-caribe_20260803_182108/` — leer primero el `BRIEF-ARRANQUE.md`.
- **Caribe está lenta y desarrollo ya lo sabe** (lo ajustan cuando salgan de otras prioridades).
  Medido: `Buscar` en Cobros tardó **33,5 s para devolver 17 filas**, sin indicador de carga.
- **Pendiente de nuestro lado:** registrar en `automation/defectos-conocidos.yaml` los 4 hallazgos de
  Caribe (`CAR-PED-006`, `CAR-PED-007`, `CAR-FAC-005`, `CAR-PED-PERF`).
- ⚠ `guiones-regresion/README_CAPACITOR_ANDROID.md` está **desactualizado**: describe un manifest que
  "solo tenía INTERNET", y el de `main` hoy ya trae ubicación, storage y la key de Maps. Tomalo como
  referencia histórica, no como instructivo.

---

*Escrito el 04/08/2026, al publicar la rama.*
