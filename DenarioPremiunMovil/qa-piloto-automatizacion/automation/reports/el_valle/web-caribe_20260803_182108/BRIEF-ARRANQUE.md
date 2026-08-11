# Brief de arranque — corrida web Caribe (transaccional + datos maestros)

> Pegar esto como primer mensaje de la conversación nueva.
> **La corrida YA ESTÁ EMPEZADA.** Leer primero `transacciones.md` (411 líneas, Pedidos y Facturaciones
> cerrados) y `_web-results.jsonl` (21 casos). Esto es una **continuación**, no un arranque limpio.

## Qué quiero

Corrida **solo web**, sin móvil, sobre la playa **Caribe** (`http://denariocaribe.ddns.net:8080/DenarioPremium`),
cliente **PROCESADORA DE ALIMENTOS COVADONGA, C.A** (= el mismo COVADONGA de El Valle).

Es una playa **nueva** (informada el 03/08/2026). El objetivo doble:

1. **Verificar que está bien desplegada** — que los módulos transaccionales y de datos maestros
   responden, listan y filtran como corresponde.
2. **Encontrar lo que se vea raro** — filtros, registros y consultas.

**Solo lectura** — no crear ni modificar registros. Configuración no se toca.

## Estado: qué está hecho y qué falta

| Módulo | Estado | Veredicto |
|---|---|---|
| **Transacciones · Pedidos** | ✅ cerrado (12 casos + perf) | `WEB-FIELD-MISMATCH` — 2 hallazgos de datos |
| **Transacciones · Facturaciones** | ✅ cerrado (8 casos) | `WEB-OK` con salvedad + `WEB-N/A` en detalle |
| Transacciones · Cobros | ⏸ **suspendido 04/08** | sin veredicto — ver `transacciones.md §3` |
| Transacciones · Devoluciones | ⬜ pendiente | — |
| Transacciones · Depósitos | ⬜ pendiente | — |
| Transacciones · Clientes Potenciales | ⬜ pendiente | — |
| Transacciones · Inventarios | ⬜ pendiente | — |
| **Datos Maestros · Productos** | ⬜ pendiente | — |
| **Datos Maestros · Clientes** | ⬜ pendiente | — |
| **Datos Maestros · Documentos de Venta** | ⬜ pendiente | — |

**Continuar por Cobros** y seguir la tabla. Escribir **anexando** a `transacciones.md` y
`_web-results.jsonl`, sin reescribir lo ya cerrado.

> ⏸ **04/08/2026 — corrida EN PAUSA.** QA informó que **van a cambiar el cliente montado en Caribe**,
> así que cualquier hallazgo de datos nacería invalidado. Cobros quedó a medias: lo reutilizable
> (selectores, driver, rendimiento) está en `transacciones.md §3.1–3.2`; las pistas que dependen de
> los datos, marcadas como provisionales, en `§3.3`. **Retomar cuando haya un cliente estable**, y
> rehacer Cobros desde cero — no dar por bueno nada de `§3.3`.

### Hallazgos ya levantados (no re-levantar)

- **CAR-PED-006** `WEB-FIELD-MISMATCH` — el filtro `Tipo Pedido` no alcanza 34 de 440 pedidos.
  Causa: `order_type` id 1 tiene `id_enterprise = NULL` (el combo lista por empresa y lo omite), más dos
  duplicados "PEDIDO ESTANDAR" (ids 4 y 5) creados el 28/07/2026 que ningún pedido usa y siempre dan 0.
- **CAR-PED-007** `WEB-FIELD-MISMATCH` — 5 de 7 pedidos con `has_attachments=true` no tienen el archivo en
  `/denario/resources/images/pedidos/` (404). Galería con imágenes rotas, sin mensaje. Los únicos 2 que sí
  existen (439, 440) se crearon el 03/08 desde el móvil ⇒ las imágenes viejas no se migraron a la playa nueva.
- **CAR-FAC-005** `WEB-FIELD-MISMATCH` — columna y filtro `Vendedor` de Facturaciones inutilizables:
  `document_sale.id_user` es NULL en los 2.783 registros; cualquier vendedor devuelve 0 y la columna va vacía.
- **CAR-PED-PERF** — `Buscar` en pedidos tarda ~25 s sin spinner (ver abajo).
- **Filtro `Coordenadas = No Realizado` en Visitas** — ya reproducido acá: devuelve 0 con 29 filas visibles.

## Oráculo: la base de El Valle

Caribe corre sobre los datos de COVADONGA, así que la base `el_valle` sirve de contraste:

```
node automation/db/query.js el_valle "SELECT ..."
```

| Entidad | BD el_valle | UI Caribe | ¿Cuadra? |
|---|---|---|---|
| Pedidos | 440 | 440 | ✅ exacto, verificado en 4 rangos |
| Cobros | 17 | 17 | ✅ exacto |
| Visitas | 53 | 35 en 2026 (# Ref más alto 53) | ✅ consistente |
| Productos | 80 | — | por verificar |
| **Documentos** | **735 vigentes** (2.783 crudos) | 735 | ✅ exacto en 5 rangos — ver abajo |
| Clientes | 5.382 | 5.384 | ⚠ diferencia de 2 |

⚠ **Las diferencias chicas son deriva, no defectos.** Solo levantar hallazgo cuando el desvío sea
estructural, no cuando sean unidades sueltas.

🔑 **`document_sale`: medir SIEMPRE con `WHERE co_operation <> 'D'`.** De los 2.783 registros, **2.048
(73,6 %) están borrados lógicamente**. Los 735 vigentes son exactamente lo que la web muestra — verificado
en 5 rangos y, para el 15/07, comparando el **conjunto completo** de los 28 códigos uno a uno.
⇒ Esto además **explica el defecto D-02 de El Valle** ("Documentos lista 2.783 vs 735 vigentes"): la web
hace lo correcto, oculta los borrados. Candidato a descartar.

## Trampas propias de esta playa (leer antes de tocar nada)

- ⚠ **RUTAS SIN EXTENSIÓN:** `/pages/pedidos` funciona · `/pages/pedidos.xhtml` da **HTTP 404**.
  El login sí es `/pages/login.xhtml`.
- 🔑 **El "`Buscar` atrasado" NO EXISTE — era un artefacto de medición.** Instrumentando el fin real del
  ajax (hook sobre `XMLHttpRequest` → `loadend`), el filtro de fechas **acierta al primer `Buscar`, siempre**.
  Lo que pasa es que la consulta de pedidos tarda **~25 s** sin spinner: con una espera fija de 4 s se lee la
  tabla antes de que llegue la respuesta y se ve el resultado anterior — que es real, y por eso parecía
  coherente. **Regla: enganchar el fin del ajax, nunca dormir un tiempo fijo.**
  - Dos artefactos de automatización descubiertos de paso, **no son defectos del producto**:
    1. Setear la fecha con `el.value = ...` **no funciona**: el widget PrimeFaces conserva su fecha interna y
       revierte el input. Usar `widget.setDate()` o el calendario.
    2. `jQuery(document).ajaxComplete` **no dispara** en esta página; hay que enganchar `XMLHttpRequest`.
  - Lo que sí queda como observación real: 4 s con 2 filas · 25,1 s con 205 · 24,5 s con 440.
    Facturaciones responde en ~2 s con más registros ⇒ es puntual de pedidos, no del servidor.
- **El código de empresa cambia según la pantalla:** vale `00001` en `/pages/pedidos` y `1` en
  `/pages/cobros`, `/pages/clientes` y `/pages/visitas`. Mismo nombre, distinto value.
- **Anclar en `[id$=":idEnterprise_input"]`**, no en `idEnterprise` (IDs `j_idt*` de JSF cambian entre despliegues).
- **El placeholder "Seleccione Empresa"** existe en Clientes y Visitas, pero NO en Pedidos ni Cobros.
- **`p:selectOneMenu` es panel perezoso:** esperar ≥2 s tras seleccionar, o el backend usa el valor anterior.
  (Esto causó 6 falsos positivos en una corrida previa.)
- ⚠ **Zona horaria:** `gmap.js` reporta 6 h exactas de diferencia contra las otras dos playas. Importa
  si se cotejan fechas y horas.
- Build de Caribe: `common.css` del **31/07/2026** — el más nuevo de las tres playas.
  Huella: `/DenarioPremium/javax.faces.resource/common.css.xhtml?ln=css` (SIN el `css/` intermedio, que da 404).

### Trampas que en esta playa NO se reproducen (verificado en pedidos/facturaciones)

- `Limpiar` **no** deja la pantalla inutilizable acá; deja los controles neutros y repone el rango por defecto.
  Dos `Limpiar` seguidos tampoco desincronizan. *(Igual verificarlo en cada pantalla nueva.)*
- El estado JSF **sí se resetea** tras `page.goto()` en pedidos. *(Verificar antes de cada lectura igual.)*
- **Caracteres corruptos: no se observan.** "ZEDEÑO", "Canal de distribución" renderizan bien.
- El defecto de "la web muestra documentos borrados" **no se reproduce**: los excluye correctamente.

## Defectos de El Valle a chequear de paso (oportunista)

D-01 Morosidad en 0 · **D-02 Documentos 2.783 vs 735 → ya explicado, ver arriba, candidato a descartar** ·
D-07 Cobranzas en 0 · S-05 títulos duplicados.

❌ **NO re-levantar:** la discrepancia "722 vs 5.384 clientes" — ya está explicada, es el filtro `Activo`.

## Operativa

- Escribir **incrementalmente** a `automation/reports/web-caribe_20260803_182108/`.
  (Dos agentes murieron a mitad de corrida por errores de API; el de esta corrida también se cortó tras
  Facturaciones. Si el agente no escribe sobre la marcha, se pierde todo.)
- Al cerrar, tabla de documentos/refs tocados.
- Registrar los hallazgos nuevos en `automation/defectos-conocidos.yaml` (hoy tiene 38 entradas).

## Contexto que conviene tener a mano

- `automation/web/playas.yaml` — Caribe registrada con todo lo de arriba
- `automation/defectos-conocidos.yaml` — registro maestro
- `C:\Users\Personal\OneDrive\Documentos\kiberno\informe-hallazgos-web-denario.md` — el informe por pantalla

## Incidencias vivas al 03/08/2026 (no confundir con hallazgos nuevos)

1. Saldos de clientes (tarjeta devuelta — la lista y el detalle coinciden pero el monto sigue mal)
2. Total desc. conversión en cobro — multiplica en vez de dividir
3. Descuento conversión en cobro — mismo problema
4. Visitas de ruta precargada: el adjunto llega al detalle pero falta el ícono de clip en el listado
   (y el filtro "tiene adjunto" tampoco la toma)
5. Filtro de Coordenadas en Reporte de Visitas
6. Botón Limpiar deja la pantalla inutilizable (ocurre en AMBAS playas)

Todo lo demás ya fue resuelto.
