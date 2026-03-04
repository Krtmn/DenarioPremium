# Denario Premium Móvil — Características, propósito y funcionamiento

## 1) Propósito de la aplicación

Denario Premium Móvil es una app de **fuerza de ventas en campo** orientada a operación comercial con soporte **offline-first**.

Su objetivo principal es permitir que usuarios (vendedores y perfiles relacionados) gestionen procesos comerciales desde el dispositivo móvil, incluso sin conexión, y luego sincronicen contra servicios backend.

Procesos principales soportados:

- Gestión de clientes
- Catálogo y consulta de productos
- Pedidos
- Cobros
- Devoluciones
- Inventarios
- Depósitos
- Visitas/Despachos
- Sincronización de datos

---

## 2) Características principales

### 2.1 Operación offline-first

- Persistencia local con SQLite (`cordova-sqlite-storage` + `@awesome-cordova-plugins/sqlite`)
- Lectura/escritura de datos críticos en base local
- Cola de transacciones pendientes para envío posterior

### 2.2 Sincronización con backend

- Descarga de catálogos, tablas maestras y datos operativos
- Subida de transacciones generadas en el dispositivo
- Versionado y control de tablas de sincronización

### 2.3 Arquitectura por módulos de negocio

La app organiza la operación por módulos funcionales:

- Visitas/Despachos
- Inventarios
- Pedidos
- Devoluciones
- Cobros
- Depósitos
- Vendedores
- Productos
- Clientes
- Sincronización

### 2.4 Menú dinámico por perfil de usuario

La pantalla principal filtra módulos según el rol del usuario (por ejemplo: cliente, transportista, promotor, vendedor), mostrando solo opciones aplicables.

### 2.5 Configuración por entorno en tiempo de ejecución

- Carga `claves.env` al iniciar la app
- Expone variables en `window.__env`
- Obtiene URL del backend (`WsUrl`) y API Key de Google Maps sin recompilar

### 2.6 Integración móvil nativa

- SQLite nativo (Android/iOS)
- Cámara/archivos/geolocalización (vía Capacitor/Cordova)
- Soporte de carga de adjuntos/imágenes

---

## 3) ¿Cómo funciona la app? (flujo general)

### Paso 1: Inicio y carga de configuración

1. En `main.ts` se carga `claves.env`
2. Se asignan variables a `window.__env`
3. Se inicializa Angular/Ionic
4. Se intenta cargar Google Maps si existe `API_KEY_GOOGLE_MAPS`

### Paso 2: Login

1. El usuario inicia sesión
2. Se envían credenciales y metadata del dispositivo al backend
3. Se guarda contexto de usuario/sesión localmente

### Paso 3: Inicialización de base local

1. Se crea/abre SQLite (`denarioPremium`)
2. Se crean tablas locales si no existen
3. Se aplican migraciones/versionado
4. Se inicializan tags y configuraciones

### Paso 4: Operación diaria

1. El usuario trabaja en módulos (pedidos, cobros, etc.)
2. La app consulta y actualiza SQLite local
3. Se preparan transacciones pendientes

### Paso 5: Sincronización

1. Se descargan actualizaciones desde backend
2. Se suben transacciones locales pendientes
3. Se actualizan estados, tablas y datos de referencia

---

## 4) Componentes técnicos relevantes

- Framework UI: Ionic + Angular
- Runtime móvil: Capacitor/Cordova
- Persistencia local: SQLite nativo
- Comunicación HTTP: `CapacitorHttp` + `HttpClient`
- Config runtime: `claves.env` (cargado en `main.ts`)
- Navegación: rutas Angular por módulo

---

## 5) Rutas/módulos principales de navegación

- `/login`
- `/home`
- `/clientes`
- `/productos`
- `/pedidos`
- `/cobros`
- `/devoluciones`
- `/inventarios`
- `/depositos`
- `/visitas`
- `/synchronization`

---

## 6) Consideraciones importantes

1. **Dependencia nativa de SQLite**
   - Parte del comportamiento depende de plugin móvil nativo; en navegador web no replica exactamente el entorno móvil.

2. **Entorno y configuración**
   - `WsUrl` y otras claves deben estar correctamente definidas en `claves.env`.

3. **Sincronización**
   - Para consistencia de datos, se recomienda sincronizar al inicio y al cierre de jornada operativa.

4. **Perfil de usuario**
   - Los módulos visibles pueden cambiar según el tipo de usuario.

---

## 7) Resumen ejecutivo

Denario Premium Móvil es una plataforma móvil de gestión comercial en campo, diseñada para operar con o sin conectividad, apoyada en SQLite local y sincronización con servicios remotos. Su arquitectura modular y su menú por perfil permiten adaptar la experiencia a distintos roles operativos dentro del proceso comercial.
