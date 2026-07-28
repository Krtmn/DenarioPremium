# Smoke — LOGIN
## Estado inicial: pantalla LOGIN | Estado final: HOME principal

**Inicio:** `h.connectCdp(page)` → credenciales (ver abajo) → `h.waitSyncOverlay(pg)`

> **Credenciales (RUNTIME §1/S4):** leer `secrets/qa-credentials.env` con **Read** y parsear **el bloque
> `# Cliente: {QA_CLIENTE}`** en línea. **NO** `h.fetchCreds()` (usa `fs`/`require` → revienta en contexto unsafe).
> ⚠ **NO tomar el primer `QA_USER=` del archivo:** el primer bloque es `# USUARIO WEB` (credenciales de la web,
> no de la app). Si el login usa ese usuario, falla en todos los clientes.
Si la app está en HOME al iniciar → click en "Salir" primero.

---

## Casos

| ID | Acción clave | PASS cuando | FAIL / N/A |
|----|-------------|-------------|------------|
| DM-LOG-002 | Click enviar sin llenar campos | Alert "Usuario y/o password no pueden ser vacios" visible | FAIL: no aparece alert |
| DM-LOG-003 | `h.fillIonInput` usuario + contraseña incorrecta (`creds.badPass`) → enviar | Alert "Usuario y/o contraseña incorrectos." visible | FAIL: permite login |
| DM-LOG-004 | Click en checkbox "Recordar usuario" | Checkbox queda `checked=true` | FAIL: no cambia estado |
| DM-LOG-001 | `h.fillIonInput` usuario (`creds.user`) + contraseña (`creds.pass`) → enviar | Overlay sync aparece | FAIL: no inicia sync |
| DM-LOG-011 | (continúa DM-LOG-001) | `app-synchronization` visible con progress-bar activo | FAIL: sync no arranca |
| DM-LOG-012 | (continúa, esperar `h.waitSyncOverlay`) | `app-home` visible con módulos | FAIL: no llega a Home |

**Selectores clave:**
- Campo usuario: `ion-input[name="username"]` o primer `ion-input` visible
- Campo contraseña: `ion-input[name="password"]` o segundo `ion-input` visible
- Botón enviar: `ion-button[type="submit"]` o botón con texto "INICIAR"
- Checkbox recordar: `ion-checkbox` visible
