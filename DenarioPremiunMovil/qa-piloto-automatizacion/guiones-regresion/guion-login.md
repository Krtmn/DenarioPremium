# Guion de regresión — Denario Premium móvil (Android)

## Módulo: Login

---

### Alcance y exclusiones

Este guion cubre el módulo de **login** en **Android** con casos **reproducibles por un operador solo con la app** (toques, credenciales QA, cerrar/reabrir la app, rotar el dispositivo, dos usuarios QA cuando aplique).

**No incluye filas en la tabla** para ramas de código que exigen manipular el servidor, editar `localStorage`/ADB, cuentas backend especiales (403, cliente/estándar forzado) o ausencia de red como único disparador. Esas ramas se documentan en **«Supuestos y lagunas — Cobertura fuera de este guion»** por si el equipo las prueba aparte.

**Criterio por caso:** todos los de la tabla llevan **`Aplicación: Siempre`** (ejecutables en corrida habitual con conectividad normal).

**Incluye:** login exitoso y sincronización → Home; validación campos vacíos; credenciales incorrectas (104); recordar usuario; toggle contraseña; cambio de usuario (modal, confirmar, cancelar); UI de sincronización; footer, teclado, Salir, portrait; primera instalación / datos de app borrados.

**Excluye (diseño de casos):** pentest; modo avión o corte de red deliberado; permisos SO revocados; botón atrás del sistema; pruebas cuyo único disparador sea un `errorCode` o HTTP que el tester no puede provocar desde la UI.

---

### Mapa rápido (inferido desde código / XML)

| Elemento | Detalle |
|---|---|
| Ruta Angular | `login` (ruta raíz `''` redirige a `login`, sin guards) |
| Componente | `src/app/login/login.component.ts` / `login.component.html` |
| Llamada de autenticación | `src/app/services/services.service.ts` → `onLogin()` |
| Lógica auxiliar | `src/app/services/login/login-logic.service.ts` |
| Sincronización post-login | `src/app/services/synchronization/synchronization-db.service.ts` |
| Pantalla de sincronización | `src/app/synchronization/synchronization.component.html` |
| Mensajes / loading | `src/app/services/messageService/message.service.ts` |

**Flujo habitual:** Login → Sincronización → Home.

---

### Casos de prueba

| ID | Escenario | Precondiciones | Pasos | Datos / ejemplo | Resultado esperado | Fallo observable (PASS/FAIL) | Severidad | Soporte en código |
|---|---|---|---|---|---|---|---|---|
| DM-LOG-001 | Login exitoso — sincronización y llegada a Home | Android con internet (WiFi o datos). Pantalla de login visible. **Aplicación: Siempre** | 1. Abrir la app. 2. Ingresar credenciales QA válidas en "Usuario" y "Contraseña". 3. Pulsar "Aceptar". 4. Observar sincronización hasta el final. | Credenciales QA válidas (cuenta con acceso a todos los módulos) | Overlay "Cargando..." breve. Pantalla de sincronización con barra de progreso, texto de tabla y spinner. Al terminar, navegación a Home. | FAIL: No llega a sincronización o Home; loading infinito; error inesperado. | S1 | `login.component.ts` `validateConnection` / `onLogin`; `synchronization-db.service.ts` |
| DM-LOG-002 | Ambos campos vacíos | Pantalla de login; campos vacíos. **Aplicación: Siempre** | 1. Sin rellenar campos, pulsar "Aceptar". | Sin datos | Modal "Usuario y/o password no pueden ser vacios". Permanece en login. Loading no queda colgado. | FAIL: Sin modal; intenta login al servidor; loading infinito. | S2 | `login.component.ts:223-230` |
| DM-LOG-003 | Credenciales incorrectas (error 104) | Pantalla de login; internet activo. **Aplicación: Siempre** | 1. Usuario QA válido en "Usuario". 2. Contraseña incorrecta en "Contraseña". 3. Pulsar "Aceptar". | Contraseña ficticia: `Test-LOG-003` | Modal "Usuario y/o contraseña incorrectos." Permanece en login. Loading se cierra. | FAIL: Entra a sync/Home; mensaje distinto; loading infinito. | S2 | `login.component.ts:270-277` |
| DM-LOG-004 | Activar "Recordar usuario" y persistencia al reabrir | Checkbox desmarcado; campos vacíos al abrir. **Aplicación: Siempre** | 1. Ingresar credenciales QA válidas. 2. Marcar "Recordar usuario". 3. Pulsar "Aceptar" y completar hasta Home. 4. Cerrar la app por completo (administrador de tareas). 5. Reabrir la app y observar login. | Credenciales QA válidas | Al reabrir: usuario y contraseña precargados (contraseña oculta), checkbox marcado. | FAIL: Campos vacíos; solo un campo precargado; checkbox desmarcado. | S3 | `login.component.ts:247-253`, `354-367`, `initLogin` |
| DM-LOG-005 | Desmarcar "Recordar usuario" — no persistir al reabrir | Tras DM-LOG-004 (campos precargados, checkbox marcado). **Aplicación: Siempre** | 1. Desmarcar "Recordar usuario". 2. Pulsar "Aceptar" y completar login. 3. Cerrar y reabrir la app. | Credenciales QA válidas | Campos vacíos y checkbox desmarcado al reabrir. | FAIL: Siguen precargados los datos. | S3 | `login.component.ts:354-366` |
| DM-LOG-006 | Pantalla inicial con "Recordar usuario" ya activo | Tras DM-LOG-004, app cerrada y por reabrir (sin login aún). **Aplicación: Siempre** | 1. Reabrir la app. 2. Observar login sin tocar campos. | — | Usuario y contraseña precargados; checkbox marcado; "Aceptar" usable. | FAIL: Campos vacíos o checkbox desmarcado. | S3 | `login.component.ts:120-126` |
| DM-LOG-007 | Toggle visibilidad de contraseña | Pantalla de login. **Aplicación: Siempre** | 1. Escribir en "Contraseña". 2. Tocar ícono de ojo. 3. Tocar de nuevo. | `Test-LOG-007` | Oculto → visible en claro → oculto; ícono cambia entre `eye-outline` y `eye-off-outline`. | FAIL: No cambia visibilidad ni ícono. | S3 | `login.component.html:17-24` |
| DM-LOG-008 | Cambio de usuario — modal de advertencia | Sesión previa con **usuario A** (login completado al menos una vez). Internet activo. **Aplicación: Siempre** — **Smoke:** no incluido — sin segunda cuenta QA en corridas smoke | 1. En login, ingresar **usuario B** (distinto de A) y su contraseña. 2. Pulsar "Aceptar". | Usuario A y B: credenciales QA válidas distintas | Modal de advertencia sobre borrado de datos previos, con opciones confirmar y cancelar. | FAIL: Sin modal; borra datos sin preguntar. | S2 | `login.component.ts:231-239` |
| DM-LOG-009 | Cambio de usuario — confirmar | Continuación de DM-LOG-008 (modal visible). **Aplicación: Siempre** — **Smoke:** no incluido — depende de DM-LOG-008 | 1. Pulsar confirmar/aceptar en el modal. 2. Esperar sync y llegada a Home. | Usuario B válido | Sync completa; Home operativo para B. | FAIL: Error en pantalla; no llega a Home; datos mezclados de A. | S1 | `login.component.ts:134-163`; `login-logic.service.ts` |
| DM-LOG-010 | Cambio de usuario — cancelar | Continuación de DM-LOG-008 (modal visible). **Aplicación: Siempre** — **Smoke:** no incluido — sin segunda cuenta QA en corridas smoke | 1. Pulsar cancelar/cerrar en el modal. 2. Observar pantalla. | — | Permanece en login con campos de B; no navega; no borra datos de A. | FAIL: Borra datos o navega a Home igualmente. | S2 | `login.component.ts:134`; `message.service.ts:116-119` |
| DM-LOG-011 | Sincronización — feedback visual | Tras DM-LOG-001 en pantalla de sincronización. **Aplicación: Siempre** | 1. Durante la sync, observar la pantalla. | — | Título con tabla actual, barra que avanza, "Por favor espere...", spinner. | FAIL: Sin feedback; barra congelada >15 s sin avance visible. | S2 | `synchronization.component.html` |
| DM-LOG-012 | Sincronización completada → Home | Sync en curso tras login exitoso. **Aplicación: Siempre** | 1. Esperar fin de la barra de progreso. | — | Navegación automática a Home; módulos usables. | FAIL: Queda en sync; vuelve a login con error. | S1 | `synchronization.component.ts:744-752` |
| DM-LOG-013 | Footer copyright y versión | Login visible; teclado cerrado. **Aplicación: Siempre** | 1. Observar parte inferior de la pantalla. | — | Copyright Kiberno y número de versión del build (ej. Versión 6.6.14). | FAIL: Footer ausente; versión vacía o "undefined". | S4 | `login.component.html:50-58` |
| DM-LOG-014 | Footer con teclado | Login visible. **Aplicación: Siempre** | 1. Ver footer. 2. Tocar "Usuario" (abrir teclado). 3. Cerrar teclado. | — | Footer se oculta con teclado y reaparece al cerrarlo. | FAIL: Superposición o footer no vuelve. | S4 | `login.component.ts:171-176` |
| DM-LOG-015 | Botón "Salir" (Android) | Dispositivo Android. **Aplicación: Siempre** | 1. Ver botón "Salir". 2. Pulsarlo. | — | App se cierra y vuelve al launcher. | FAIL: Botón ausente o no cierra la app. | S3 | `login.component.html:38-41`; `App.exitApp()` |
| DM-LOG-016 | Orientación portrait bloqueada | Login visible; auto-rotación del SO activada. **Aplicación: Siempre** | 1. Rotar dispositivo a horizontal. | — | Pantalla sigue en portrait. | FAIL: Pasa a landscape. | S4 | `login.component.ts:131` |

---

```gherkin
# DM-LOG-001 — Login exitoso
Dado que tengo conexión a internet en Android
  Y estoy en la pantalla de login
Cuando ingreso credenciales QA válidas
  Y pulso "Aceptar"
Entonces veo la pantalla de sincronización con progreso
  Y al terminar la app navega a Home
```

```gherkin
# DM-LOG-003 — Credenciales incorrectas
Dado que estoy en la pantalla de login con internet
Cuando ingreso usuario válido con contraseña incorrecta
  Y pulso "Aceptar"
Entonces aparece "Usuario y/o contraseña incorrectos."
  Y permanezco en login
```

```gherkin
# DM-LOG-008 — Cambio de usuario
Dado que la sesión anterior fue con usuario A
  Y ingreso credenciales de usuario B
Cuando pulso "Aceptar"
Entonces aparece el modal de advertencia de borrado de datos
  Y puedo confirmar o cancelar
```

---

### Regresión mínima (smoke rápido)

1. **DM-LOG-002** — Campos vacíos
2. **DM-LOG-003** — Contraseña incorrecta
3. **DM-LOG-004** — Recordar usuario
4. **DM-LOG-001** — Happy path login → Home
5. **DM-LOG-011** / **DM-LOG-012** — Sync visible y llegada a Home

*DM-LOG-008/009/010 (cambio de usuario) — solo en corrida manual completa; requiere segunda cuenta QA — **no incluidos en smoke**.*
*DM-LOG-017 (arranque limpio) — eliminado del guion; requiere reinstalación de APK.*

---

### Supuestos y lagunas

#### Cobertura fuera de este guion (no son FAIL si no se ejecutan)

| Tema | Referencia código | Por qué no está en la tabla |
|---|---|---|
| WiFi vs datos por separado | `validateConnection` + `connectionType` | Mismo flujo visible para el usuario; no controlable sin herramientas |
| Re-login con BD ya creada | `synchronization-db.service.ts` | Difícil verificar sin inspección interna; cubierto en parte por DM-LOG-001 |
| Validación usuario/contraseña vacíos por separado | `login.component.ts:223` | Mismo mensaje que DM-LOG-002 |
| Trim en usuario | `trim()` | Reproducible, opcional; se puede añadir si el equipo lo pide |
| Error 403 / errorCode genérico / HTTP catch | `onLogin` switch / `error` | Requieren servidor o entorno especial |
| Token expirado al abrir | `ngOnInit` + `tokenExpired` | Requiere sesión previa con 401 o editar almacenamiento |
| Actualización semver mayor | `compareSemVer` | Requiere instalar versión anterior o truco técnico |
| Cuenta cliente vs estándar (VG) | `globalConfig.setVars` | Misma UI de login; la VG se valida en otros módulos |
| Login sin red | `validateConnection` else | Excluido por política de alcance (red deliberada) |
| Sync congelada >60 s | Sin timeout en código | Observar durante DM-LOG-011; abrir incidencia si ocurre |

#### Otras lagunas

1. **Modal cambio de usuario:** botones confirmar/cancelar viven en componente global de mensajes (`alertModalModule`). Si no responden, revisar `app-message` / `app.component.html`.

2. **Posible defecto sin red:** en `validateConnection` rama sin conexión (`login.component.ts:207-212`) podría no llamarse `hideLoading()` antes del modal.

3. **Usuario transportista:** la sync puede omitir descarga de imágenes; depende de la cuenta QA en backend.

4. **Versión en footer:** valor en código (`6.6.14`); puede diferir si el build cambia.

---
