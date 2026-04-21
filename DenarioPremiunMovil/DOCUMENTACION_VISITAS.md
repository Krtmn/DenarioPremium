# Módulo de Visitas / Despachos

## 1) Objetivo del módulo

El módulo de **Visitas** permite planificar, registrar y enviar visitas realizadas a clientes.

Cuando el usuario tiene perfil de transportista, el mismo módulo se presenta como **Despachos** y habilita comportamientos específicos (por ejemplo, reagendar y acceso a guías PDF).

---

## 2) Pantallas que forman el módulo

El módulo está compuesto por estas rutas principales:

- `visitas` → Menú principal del módulo.
- `listaVisitas` → Listado y búsqueda de visitas.
- `visita` → Formulario de detalle para crear, editar, guardar o enviar una visita.

Componentes clave:

- `VisitasComponent`
- `ListaVisitaComponent`
- `VisitaComponent`
- `VisitaPdfModalComponent` (modal de PDFs de despacho para transportistas)

---

## 3) Flujo funcional del proceso de visitas

### 3.1 Ingreso al módulo

Al abrir `visitas`, el sistema:

1. Carga textos/etiquetas (`getTags`).
2. Carga listas de actividades y motivos (`getLists`).
3. Lee configuración global (`getConfiguration`).
4. Si GPS es obligatorio, intenta obtener coordenadas actuales.

Desde esta pantalla el usuario puede:

- Crear **Nueva visita**.
- Ver **Lista de visitas**.
- Abrir **Ver mejor ruta** (Google Maps).

---

### 3.2 Crear nueva visita

Al presionar **Nueva visita**:

- Se inicializa una visita nueva con estado **No visitado**.
- Si el GPS es obligatorio, solo permite avanzar si se logran coordenadas.
- Luego navega a la pantalla `visita`.

---

### 3.3 Ver listado de visitas

En `listaVisitas`:

- Se consulta la base local y se muestra la lista de visitas.
- Hay búsqueda por referencia y por nombre de cliente.
- Se puede abrir una visita para verla/editarla.
- Se puede eliminar solo si está en estado **Guardado**.

Además, para transportistas:

- Se muestra un acceso rápido al listado de guías PDF.

---

### 3.4 Completar una visita (pantalla de detalle)

En `visita`, el usuario trabaja por secciones:

1. **General**: empresa (si aplica), cliente, dirección y fecha.
2. **Actividades**: registro de actividad, motivo y observación.
3. **Adjuntos**: fotos y firma (según configuración).

Comportamientos importantes:

- Puede requerir iniciar visita con GPS según configuración.
- Puede advertir cambios de dirección según configuración.
- Puede abrir ruta hacia cliente en Google Maps.
- Puede guardar avance sin enviar o enviar para sincronización.

---

### 3.5 Guardar y enviar

Cuando el usuario guarda:

- Se persiste la visita en SQLite local (`visits`).
- Se guardan incidencias/eventos (`incidences`).
- Se guardan adjuntos de la visita.

Cuando el usuario envía:

- La visita pasa a estado **Por enviar**.
- Se crea transacción pendiente de tipo `visit`.
- El servicio de autoenvío intenta sincronizar cuando corresponda.

---

### 3.6 Mejor ruta (Google Maps)

La opción **Ver mejor ruta**:

1. Obtiene coordenada actual del usuario.
2. Busca visitas pendientes del día.
3. Toma coordenadas destino por dirección de cliente.
4. Ordena destinos por cercanía (nearest-neighbor).
5. Abre Google Maps con origen, destino y waypoints.

Nota: por límite de Google Maps, se usa un máximo de 24 destinos en la URL.

---

### 3.7 Flujo especial de transportista (Despachos)

Si el usuario es transportista:

- El título/textos del módulo se muestran como **Despachos**.
- Se habilita gestión de guías PDF.
- Se permite **Reagendar despacho** con fecha y motivo.
- El listado de visitas usa reglas de consulta específicas para transportista.

---

## 4) Estados de visita usados por el módulo

El módulo utiliza estos estados internos:

- `0` → **Guardado**
- `1` → **Por enviar**
- `2` → **Visitado**
- `3` → **No visitado**

Estos valores gobiernan qué acciones están disponibles (edición, borrado, envío, solo lectura, etc.).

---

## 5) Variables de configuración del módulo de visitas

Estas variables se leen desde configuración global y afectan el comportamiento del módulo.

| Variable | Opción | Comportamiento en Visitas |
|---|---|---|
| `userMustActivateGPS` | `true` | Obliga a obtener coordenadas para iniciar/continuar acciones clave (nueva visita, abrir visita pendiente, iniciar visita). Si no hay coordenadas, bloquea el avance. |
| `userMustActivateGPS` | `false` | Permite continuar sin bloquear. El sistema intenta obtener coordenadas en segundo plano cuando sea posible. |
| `transportRole` | `true` | Activa lógica de rol transportista: uso de modo Despachos cuando el usuario tenga bandera `transportista` en sesión. |
| `transportRole` | `false` | Desactiva lógica de transportista y usa comportamiento estándar de Visitas. |
| `enterpriseEnabled` | `true` | Permite seleccionar empresa (en ambientes multiempresa). |
| `enterpriseEnabled` | `false` | Mantiene deshabilitado el selector de empresa en la pantalla de visita. |
| `checkAddressClient` | `true` | Al cambiar dirección del cliente, solicita confirmación antes de aplicar el cambio. |
| `checkAddressClient` | `false` | No pide confirmación de cambio de dirección. |
| `signatureVisit` | `true` | Habilita manejo de firma en adjuntos para visitas. |
| `signatureVisit` | `false` | No exige/usa firma en flujo de adjuntos de visitas. |

---

## 6) Datos que guarda el módulo

Persistencia local principal:

- Tabla `visits`: datos generales de la visita.
- Tabla `incidences`: actividades/motivos/comentarios asociados.
- Adjuntos/firma de visita: gestionados por el servicio de adjuntos.

También crea transacciones pendientes para sincronización posterior con backend.

---

## 7) Resumen en lenguaje simple

El módulo de Visitas/Despachos permite:

- Registrar una visita con cliente, dirección, actividades y evidencias.
- Guardar el trabajo aunque no haya internet.
- Enviar la visita para sincronizarla después.
- Controlar GPS, firma, empresa y dirección según configuración.
- En transportistas, operar con vista de despachos y reagendamiento.

En resumen: centraliza todo el ciclo operativo de visitas en campo, con soporte offline y reglas configurables.
