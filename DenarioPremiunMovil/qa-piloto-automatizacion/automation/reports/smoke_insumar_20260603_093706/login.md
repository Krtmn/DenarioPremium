# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260603_093706_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | CDP http://127.0.0.1:9220 |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Cliente | insumar |
| Playa | Isla Coche (denarioislacoche.ddns.net:8081) |
| Resultado | 5 PASS · 0 FAIL · 0 SKIP · 2 N/A |
| Fecha | 2026-06-03 |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Alert "Usuario y/o password no pueden ser vacios" visible al enviar campos vacíos |
| DM-LOG-003 | ✅ PASS | Alert "Usuario y/o contraseña incorrectos." visible tras ingresar contraseña errónea (`***/Test-LOG-003`) |
| DM-LOG-004 | ✅ PASS | `ion-checkbox` toggled `true→false→true`; estado cambia correctamente en cada click |
| DM-LOG-001 | ✅ PASS | `app-synchronization` visible al enviar credenciales correctas (`***/***`) |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` activo; texto "Sincronizando - Unidades de Producto / Por favor espere..." |
| DM-LOG-012 | ✅ PASS | `app-home` visible con módulos tras completar sync; todos los módulos presentes |
| DM-LOG-008/009 | 🚫 N/A | No existe opción de segundo usuario en UI del login (sin ion-select, sin toggle de cuenta) |
| DM-LOG-017 | 🚫 N/A | Requiere reinstalación de APK — fuera de alcance smoke |

---

## Registros creados en sistema

_(Módulo LOGIN no genera transacciones)_

---

## Hallazgos / Notas de primera corrida

### Comportamiento primer login (insumar — primera corrida formal)

Al intentar DM-LOG-003 con usuario `003` (insumar), la app mostró primero un diálogo de confirmación:

> "Está intentando sincronizar con un usuario que es diferente al previamente ingresado, de aceptar la sincronización todos los datos anteriores serán borrados. ¿Está de acuerdo?"
> Botones: [Cancelar] [Aceptar]

**Causa:** El dispositivo tenía datos de una sesión previa con un usuario diferente (cliente Hidroponias).  
**Evaluación:** Comportamiento esperado de primera corrida — NO es FAIL.  
**Acción tomada:** Se aceptó ("Aceptar") para permitir el cambio de usuario. Tras confirmar, el servidor rechazó correctamente la contraseña errónea con el alert esperado.  
**Patrón para futuras corridas insumar:** Una vez sincronizado con usuario `003`, este diálogo NO debería aparecer nuevamente.

### Módulos visibles en HOME (insumar)

Visitas · Inventarios · Pedidos · Devoluciones · Cobros · Depósitos · Vendedores · Productos · Clientes · Sincronizar · SALIR

### Datos para poblar insumar.yaml

| Campo YAML | Valor observado |
|------------|----------------|
| `modules.login.has_second_user` | `false` — no hay UI de segundo usuario |
| `cliente_nombre` | "POWERED BY KIBERNO" — confirmar nombre real en módulo Clientes |
| App version | `6.6.14` |
| Módulos habilitados | Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes |

---

## Estado final

`app-home` visible · usuario `***` logueado · sync completado exitosamente.
