> Parte de `module-selectors/` — leer junto con `_comunes.md` (convención global).

## Módulo LOGIN

### Identidad
- Ruta Angular: `/login` → `/home`
- Componente raíz: `app-login`
- Overlay sincronización: `app-synchronization` (contiene `ion-progress-bar`)

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Input Usuario | `app-login ion-input[placeholder="Usuario"]` / idx 0 | `[gmp-2606][ins-2610][dth-2612]` | **Sin atributo `name`** — identificar por placeholder o índice global. ⚠ los dos ion-input viven en `ion-col` distintos → `nth-of-type(2)` NO funciona; usar placeholder o índice 0/1 `[dth-2612]` |
| Input Contraseña | `app-login ion-input[placeholder="Contraseña"]` / idx 1 | `[gmp-2606][ins-2610][dth-2612]` | Sin `name` |
| Botón submit | `ion-button[type="submit"]` (texto "Aceptar") | `[gmp-2606][ins-2610][gmp-2611]` | click vía `pg.mouse.click` sobre centro del `getBoundingClientRect` basta — sin Pointer+Mouse combinado en este build `[gmp-2611]` |
| Botón secundario | `ion-button` (texto "Salir") | `[gmp-2606]` | |
| Checkbox recordar | `ion-checkbox` | `[gmp-2606][ins-2610]` | toggle `checked` por `mouse.click` en centro del bounding rect; `.checked` refleja el toggle |
| Alert login | `.alert-title` (título) + `.alert-message` (mensaje) | `[ins-2610]` | el texto puede venir vacío durante la animación de apertura — pollear hasta que `.alert-message` tenga contenido |
| Overlay sync | `app-synchronization` + `ion-progress-bar` | `[gmp-2606]` | usar `h.waitSyncOverlay` |

### Flujo mínimo probado

> ⚠ `h.waitSyncOverlay` NO basta como única señal de HOME: el overlay `app-synchronization` muestra `offsetParent === null` momentáneamente **entre fases de sync** (Etiquetas → Clientes → …), por lo que `waitSyncOverlay` puede retornar con la URL aún en `/synchronization`. Confirmar HOME con `waitForFunction`: `location.href.includes('/home') && app-home.offsetParent !== null`. `[gmp-2611]`

```
1. fillIonInput Usuario + Contraseña (creds via h.fetchCreds)
2. Click ion-button[type=submit] "Aceptar"
3. Esperar app-synchronization ("Sincronizando - Clientes...") → h.waitSyncOverlay
4. Verificar app-home con módulos visibles; app-login no visible
```

### Anti-patrones confirmados
- No asumir `name="username"`/`name="password"` — esos inputs no tienen `name`. `[gmp-2606]`

### Notas por cliente
- HOME no muestra `ion-title` con nombre de empresa/usuario en globalmp. No hay selector de empresa post-login. Confirmado también en don-theo — no se puede leer `cliente_nombre` por UI post-login. `[gmp-2606][dth-2612]`
- piercar: login y sync completos en corrida 1ª sin cambios en selectores — todos los selectores estándar (placeholder, submit, checkbox) funcionaron sin modificaciones. `[prc-2606]`
- jerez: bajo NUEVO set de datos, todos los selectores estándar (Usuario/Contraseña por placeholder sin `name`, submit "Aceptar" con `pg.mouse.click` simple, checkbox `.checked` por mouse.click) funcionaron sin cambios; overlay `app-synchronization`+`ion-progress-bar` OK. `[jerez-2026-07-06]`
- **ferrenuestro (La Tortuga v6.6.18): el `ion-alert` de credenciales incorrectas cierra con botón "OK", NO "Aceptar"** — `alertButtonCoords('Aceptar')` devolvió `null`; hubo que usar `alertButtonCoords('OK')`. ⚠ Recomendación: al cerrar un alert de login, **leer el texto real del botón** o probar ambos ("Aceptar" y "OK") antes de calcular coords (los alerts informativos de flujo usan "OK" en este build; los confirm aún usan Aceptar/Cancelar). `[ferrenuestro-20260723]`
- **ferrenuestro: alert residual intercepta clicks fuera del diálogo (reconfirma RUNTIME S5)** — un `ion-alert` activo (`offsetParent!==null`, sin `overlay-hidden`) intercepta clicks en CUALQUIER coordenada (`elementFromPoint` devuelve `.alert-button-group`). Si un click a un control (ej. checkbox "Recordar usuario") no responde tras 1 intento, **diagnosticar con `elementFromPoint` ANTES de reintentar** — la causa suele ser un alert no cerrado (por el texto de botón equivocado), no el selector del control. `[ferrenuestro-20260723]`
- **ferrenuestro: el submit tras `fillIonInput` puede requerir gesto compuesto** — el `pg.mouse.click(x,y)` simple (que sí funciona con formulario vacío) a veces no dispara el submit tras llenar campos vía `fillIonInput`; el gesto `mouse.move → mouse.down → wait ~80ms → mouse.up` sí lo disparó. Posible timing/layout-shift tras `fillIonInput` → recalcular coords justo antes del click y, si falla, probar el gesto compuesto antes de declarar BLOCKED. `[ferrenuestro-20260723]`

---
