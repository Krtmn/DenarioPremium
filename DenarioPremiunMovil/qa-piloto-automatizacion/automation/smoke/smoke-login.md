# Smoke — LOGIN
## Estado inicial: pantalla LOGIN | Estado final: HOME principal

**Inicio:** `h.connectCdp(page)` → `creds = await h.fetchCreds()` → `h.waitSyncOverlay(pg)`
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
| DM-LOG-008/009 | Segunda cuenta QA_USER2 | — | N/A si `has_second_user=false` en perfil cliente |
| DM-LOG-017 | Arranque limpio | — | N/A siempre (requiere reinstalación) |

**Selectores clave:**
- Campo usuario: `ion-input[name="username"]` o primer `ion-input` visible
- Campo contraseña: `ion-input[name="password"]` o segundo `ion-input` visible
- Botón enviar: `ion-button[type="submit"]` o botón con texto "INICIAR"
- Checkbox recordar: `ion-checkbox` visible
