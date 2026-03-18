# System Patterns

## Patrones observados

### 1) Offline-first con sincronización diferida
- Operación principal contra SQLite local.
- Envío/recepción de datos en procesos de sincronización.

### 2) Servicios por dominio
- Servicios dedicados por módulo (pedidos, cobros, inventarios, etc.).
- `SynchronizationDBService` como núcleo de inicialización/sincronización de BD.

### 3) Configuración runtime
- Variables cargadas en arranque (`main.ts`) desde `claves.env`.
- Acceso central a backend vía `ServicesService`.

### 4) Navegación modular
- Rutas por componente para cada módulo operativo.
- Menú home condicionado por rol/perfil de usuario.

## Riesgos técnicos conocidos
- Acoplamiento alto a plugin SQLite en capas de negocio.
- Diferencia de comportamiento entre entorno web y móvil nativo.
