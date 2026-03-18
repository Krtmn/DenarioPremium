# Product Context

## Flujo de uso (alto nivel)
1. Login del usuario.
2. Inicialización de base local y configuración.
3. Operación diaria por módulos de negocio.
4. Registro de transacciones locales.
5. Sincronización de entrada/salida con backend.

## Módulos y valor de negocio
- **Clientes**: consulta y gestión de información comercial.
- **Productos**: exploración de catálogo y detalle.
- **Pedidos**: creación y seguimiento de pedidos.
- **Cobros**: registro de cobranzas y estados asociados.
- **Devoluciones**: gestión de devoluciones y motivos.
- **Inventarios**: captura y consulta de inventario en campo.
- **Depósitos**: registro y control de depósitos.
- **Visitas/Despachos**: actividad operativa por ruta/proceso.
- **Sincronización**: consistencia de datos con servicios remotos.

## Dependencias funcionales
- Tags/mensajes por módulo desde base local.
- Configuración dinámica desde `claves.env` (`WsUrl`, `API_KEY_GOOGLE_MAPS`).
- Persistencia y lectura local en SQLite.
