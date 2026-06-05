# Guía: actualizar la rama QA con `main` del equipo (sin perder progreso)

**Proyecto:** Denario Premium Móvil — piloto `qa-piloto-automatizacion`  
**Rama de trabajo:** `feature/qa-guiones-regresion` (local; experimental)  
**Rama del equipo:** `main` en `origin` (GitHub: `Krtmn/DenarioPremium`)  
**Fecha de referencia:** Junio 2026 (última sync: 5-jun-2026)  

---

## Objetivo

Traer a tu máquina **el código más reciente** que el equipo subió a `main` (por ejemplo cambios en `DenarioPremiunMovil/src/app/...`), **sin**:

- Modificar `main` en GitHub ni el trabajo del equipo.
- Perder el piloto de automatización (guiones, smoke CDP, reportes, perfiles playa/cliente).

---

## Reglas de oro (memorizar)

| Regla | Por qué |
|-------|---------|
| **Trabajar siempre en `feature/qa-guiones-regresion`** | El piloto QA vive ahí; `main` es del equipo de desarrollo. |
| **Nunca `git push origin main`** | Eso cambiaría la rama del equipo en GitHub. |
| **Commitear (o stash) tu progreso ANTES del merge** | Si no, Git puede bloquear el merge o mezclar cambios sin guardar. |
| **Usar `git merge origin/main` (no checkout a main para “probar”)** | El merge trae `main` **hacia tu feature**; no al revés. |
| **No commitear credenciales** | `secrets/qa-credentials.env`, `claves.env` → ignorados / fuera del commit. |
| **No commitear artefactos temporales** | `.playwright-mcp/`, `.angular/cache`, logs locales. |
| **`android/` suele estar en `.gitignore`** | Tus cambios locales en manifest/iconos pueden quedar solo en disco; lo normal en Capacitor. |
| **Tras el merge, seguir en la misma feature** | Ahí tienes **código del equipo + piloto QA**. |

---

## Qué hace cada comando (en una frase)

| Comando | Efecto |
|---------|--------|
| `git fetch origin` | Descarga novedades de GitHub **sin** cambiar tus archivos. |
| `git merge origin/main` | Mezcla el `main` del equipo **en la rama donde estás** (la feature). |
| `git commit` en la feature | Guarda **solo tu rama**; `main` remoto no se toca. |
| `git push origin feature/qa-guiones-regresion` | Sube **solo tu rama** (opcional); `main` sigue igual. |

---

## Flujo recomendado (repetir en el futuro)

> **Orden fijo:** commit QA → `fetch` → `merge origin/main` → verificar.  
> Nunca al revés. Nunca en `main`.

### Paso 0 — Comprobar dónde estás

```powershell
cd "C:\Users\Personal\OneDrive\Documentos\kiberno\DenarioPremium"

git branch --show-current
# Debe decir: feature/qa-guiones-regresion

git status -sb
```

Si no estás en la feature:

```powershell
git checkout feature/qa-guiones-regresion
```

---

### Paso 1 — Guardar tu progreso QA (obligatorio)

Tienes cambios sin commitear en `qa-piloto-automatizacion/`, guiones, reportes, etc. **Guárdalos antes de traer `main`.**

**Opción A — Commit (recomendado)**

```powershell
git add DenarioPremiunMovil/qa-piloto-automatizacion/
git status -sb
# Confirmar que NO entran: secrets/, claves.env, .playwright-mcp/

git commit -m "qa: descripcion breve del avance (ej. reportes smoke, guiones, perfiles playa)"
```

Solo versionar la carpeta del piloto. **No** incluir `Config/` ni `DenarioPremiunMovil/src/` salvo acuerdo explícito con el equipo.

**Opción B — Stash temporal** (si aún no quieres commit)

```powershell
git stash push -u -m "WIP QA antes de merge main"
# Recuperar después: git stash pop
```

> **No incluir** en el commit: `secrets/qa-credentials.env`, `claves.env`, `.playwright-mcp/`.

---

### Paso 2 — Traer referencias del remoto

```powershell
git fetch origin
```

Comprueba si hay commits nuevos en `main`:

```powershell
git rev-list --count HEAD..origin/main
git log --oneline HEAD..origin/main
```

Si el contador es **0**, ya estás al día con el equipo.

---

### Paso 3 — Mezclar `main` del equipo en tu feature

```powershell
git merge origin/main
```

- Si termina sin mensajes de conflicto → listo.
- Si Git pide mensaje de merge → acepta el predeterminado o cierra el editor.

**Esto no toca `main` en GitHub.** Solo actualiza tu rama local `feature/qa-guiones-regresion`.

---

### Paso 4 — Si hay conflictos

Git marcará archivos con `<<<<<<<`.

1. Abre cada archivo en conflicto.
2. Elige qué conservar (código del equipo vs tu cambio QA).
3. En `qa-piloto-automatizacion/` casi nunca hay conflicto (carpeta vuestra).
4. Los conflictos frecuentes son en `src/app/...` si alguien tocó lo mismo (poco habitual en piloto QA).

```powershell
git add <archivos-resueltos>
git commit
# (si el merge no completó solo)
```

Si quieres **cancelar** el merge:

```powershell
git merge --abort
```

---

### Paso 5 — Verificar que todo quedó bien

```powershell
# Sigues en la feature
git branch --show-current

# Tu rama incluye todo origin/main
git merge-base --is-ancestor origin/main HEAD
# En PowerShell, si no hay error, está OK. Alternativa:
git log -1 --oneline origin/main
git log -1 --oneline HEAD
# HEAD debe ser tu merge o un commit posterior; origin/main debe estar en el historial.

git status -sb
```

**Comprobación mental:**

- Carpeta `qa-piloto-automatizacion/` → sigue con tus guiones y automatización.
- `DenarioPremiunMovil/src/app/...` → código **nuevo del equipo** tras el merge.

---

### Paso 6 — (Opcional) Subir solo tu rama a GitHub

Solo si quieres backup o compartir con el equipo **sin tocar `main`**:

```powershell
git push -u origin feature/qa-guiones-regresion
```

La primera vez crea la rama remota; las siguientes: `git push`.

---

### Paso 7 — (Opcional) Actualizar tu `main` local

No es obligatorio para seguir trabajando en la feature. Sirve para tener `main` local al día **solo en tu PC**:

```powershell
git checkout main
git pull origin main
git checkout feature/qa-guiones-regresion
```

Esto **tampoco** cambia el `main` del equipo en GitHub de forma distinta a un `pull` normal.

---

## Qué NO hacer

| Acción | Riesgo |
|--------|--------|
| `git push origin main` | Subes cambios a la rama del equipo. |
| Trabajar días sin commit y luego merge | Conflictos difíciles o pérdida de trabajo. |
| `git reset --hard` sin saber | Borras commits o cambios locales. |
| Commitear `qa-credentials.env` o `claves.env` | Filtración de credenciales. |
| Mezclar en `main` local y seguir en `main` | Mezclas piloto QA con rama de producción del equipo. |
| `git pull origin main` estando en `main` pensando que actualiza la feature | Actualiza `main`, no la feature. |

---

## Qué se versiona vs qué queda local

| Ruta / tema | En commits QA | Notas |
|-------------|---------------|--------|
| `qa-piloto-automatizacion/` | Sí | Guiones, smoke CDP, reportes, perfiles cliente. |
| `secrets/qa-credentials.env` | **No** (gitignore) | Solo `qa-credentials.env.example`. |
| `../../claves.env` (raíz repo) | **No** (gitignore) | WsUrl y claves servidor. |
| `DenarioPremiunMovil/.playwright-mcp/` | No | Temporal MCP. |
| `DenarioPremiunMovil/android/` | Casi siempre **no** | Ignorado por `.gitignore`; cambios locales para builds. |
| `DenarioPremiunMovil/src/app/` | Viene del **merge de `main`** | Código del equipo, no lo editáis salvo acuerdo explícito. |

---

## Resumen visual del historial

```text
origin/main (GitHub)     ... ──► f3c51eb4  (equipo; NO hacemos push aquí)

feature/qa-guiones-regresion (local):
  ... ──► 23c914c8   commit QA inicial
  ... ──► 708324d7   merge origin/main (1ª sync)
  ... ──► 61986088   commit QA (reportes, perfiles, notas smoke)
  ... ──► 0effe59e   merge origin/main (2ª sync, sin conflictos)
        = código del equipo + piloto QA
```

Tu rama local `main` puede quedar **desactualizada** (`behind origin/main`). Eso es normal si solo trabajas en la feature.

---

## Checklist rápido (copiar antes de cada sync)

- [ ] Estoy en `feature/qa-guiones-regresion`
- [ ] `git status` limpio o commit / stash hecho
- [ ] `git fetch origin`
- [ ] Revisé `git log HEAD..origin/main` (¿hay novedad?)
- [ ] `git merge origin/main`
- [ ] Resolví conflictos si los hubo
- [ ] Verifiqué `qa-piloto-automatizacion/` intacto
- [ ] **No** hice `push` a `main`
- [ ] (Opcional) `push` solo a `feature/qa-guiones-regresion`

---

## Sesiones de referencia (replicar igual)

### Sync 1 — Abr/May 2026

1. Rama `feature/qa-guiones-regresion` · remoto `github.com/Krtmn/DenarioPremium`.
2. Commit QA `23c914c8` — piloto inicial.
3. `git fetch` + `git merge origin/main` → `708324d7` sin conflictos.
4. Sin `push` a `main`.

### Sync 2 — 5-jun-2026 (proceso estándar)

1. **Commit QA** `61986088` — reportes por carpeta `smoke_{cliente}_{fecha}/`, perfiles `insumar.yaml` / `romher.yaml`, `notas-ajuste-casos-smoke.md`, lecciones CDP.
   ```powershell
   git add DenarioPremiunMovil/qa-piloto-automatizacion/
   git commit -m "qa: reportes por corrida, perfiles insumar/romher y notas smoke"
   ```
2. **`git fetch origin`** — `origin/main` en `f3c51eb4` (~29 commits nuevos).
3. **`git merge origin/main`** → merge `0effe59e` **sin conflictos** (cobros, collection, visitas, productos, clientes, migración DB v10).
4. **Verificación:** `git status -sb` limpio; `origin/main` incluido en el historial de la feature.
5. **No** `push` a `main`. Rama feature sigue solo local (hasta que decidan subirla).

---

## Después del merge: impacto en QA

| Área | Acción sugerida |
|------|-----------------|
| Guiones / smoke | Revisar si cambios en cobros, pedidos, depósitos exigen actualizar casos o selectores. |
| APK debug | Tras merge, recompilar con `Config/createAPK_DEBUG.bat` (rutas locales + `WsUrl` en `claves.env`). Ver `guia-qa-chrome-inspect-builds.md`. |
| Corridas CDP | Misma infra (`adb forward`, creds); validar que la app arranca tras cambios en `src/`. |
| `denario-movil-para-claude.xml` | Regenerar o actualizar si el equipo cambió mucho `src/` (no automático con el merge). |

---

## Ayuda rápida

```powershell
# ¿Remoto configurado?
git remote -v

# ¿Cuántos commits me falta de main?
git rev-list --count HEAD..origin/main

# ¿Qué archivos cambió el equipo en src?
git diff --stat HEAD~1..HEAD -- DenarioPremiunMovil/src
# (ajustar HEAD~1 al commit previo al merge si hace falta)

# ¿Incluye mi feature todo main?
git log --oneline origin/main -1
git merge-base --is-ancestor origin/main HEAD; echo $LASTEXITCODE
# 0 = sí está incluido
```

---

## Documentación relacionada

| Archivo | Contenido |
|---------|-----------|
| `CLAUDE.md` | Reglas del piloto QA para agentes |
| `README.md` | Inventario del piloto |
| `guia-qa-chrome-inspect-builds.md` | APK debug/release e inspección Chrome |
| `README_CAPACITOR_ANDROID.md` | Build e instalación Android |

---

*Guía para el equipo QA Denario Premium Móvil — sincronizar con `main` sin perder el piloto de automatización. Última actualización: sync 5-jun-2026.*
