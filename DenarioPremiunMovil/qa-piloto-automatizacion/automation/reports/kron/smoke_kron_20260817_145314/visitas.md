# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_145314_smoke-completo` |
| Módulo | VISITAS |
| Cliente | kron — CHOCOLATES KRON, C.A (`KRON_ADM`, `id_enterprise` 1) |
| Vendedora | `scarlet` · `id_user` 309 · `co_user` `VE0002` |
| Dispositivo | Infinix X6728 (HOT 60i) — `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db19 · `window.ng=true` |
| Playa | **ISLA COCHE** (`denarioislacoche.ddns.net:8081`, confirmado por el host del POST) |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED** |

Estado inicial HOME → estado final HOME. Namespace propio `__qaVIS` (9 skills).
`window.__qaDataHook` **ya venía instalado** por un módulo anterior y con `__qaPayloadsData` poblado ⇒ se consumió
sin reinstalar (1 POST capturado, **0 duplicados**, con `data` completo).

🔴 **Sin adjuntos por instrucción de QA** — no se usó el mock de cámara en ningún caso.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | `/visitas` con los 3 botones: NUEVA VISITA · RUTA DE HOY · Ver mejor ruta |
| DM-VIS-003 | ✅ PASS | `/visita` con tabs ACTIVIDADES/ADJUNTOS `disabled=true`, cliente vacío, Guardar/Enviar `disabled` |
| DM-VIS-004 | ✅ PASS | `/listaVisitas` (`app-lista-visita`) con searchbar; **trajo datos**: Ref 142 BIMBO, Visitado, sin error ni overlay colgado |
| DM-VIS-006 | ✅ PASS | Trash → `¿Desea borrar la visita? Esta acción no se puede deshacer.` [CANCELAR, **Aceptar**] → `Se eliminó la visita de manera exitosa` [OK]; lista 3→2, `visits` local 3→2 |
| DM-VIS-010 | ✅ PASS | `setClientfromSelector` con `co_client` `J504480975` → 3 tabs habilitadas, sucursal **FISCAL** cargada (`id_address_client` 68305) |
| DM-VIS-014 | ✅ PASS | `ion-modal#eventModal` con select Actividad (12 opts), select Motivo, Comentario (`maxlength=255`), botones CANCELAR/Agregar |
| DM-VIS-015 | ✅ PASS | MERCHANDISING → VISIBILIDAD PDV → `QA-VIS-015-KRON`; `listaEventos` 0→1 y el ítem aparece en Tab Actividades. **1.er intento** con `shadowRoot` |
| DM-VIS-019 | ✅ PASS | Alert `Denario` / "La visita se ha guardado" [OK]; el formulario **permanece abierto** en `/visita` |
| DM-VIS-020 | ✅ PASS | 3 alertas → **`Visita nro. 143 enviada exitosamente`**; navega a `/visitas`; la visita pasa a "Visitado". Ver nota de latencia abajo |
| DM-VIS-021 | ✅ PASS | Back con cambios sin guardar → `¡Alerta!` [Guardar y salir, Salir sin guardar, Cancelar] |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" sobre visita **nueva nunca guardada** → **NO persiste**: lista 2 ítems, `visits` local = 2, `incidences.seq` 3→3 |
| DM-VIS-023 | ✅ PASS | Visita Guardada reabierta desde la lista: formulario **editable**, 3 tabs habilitadas, Guardar/Enviar activos, evento íntegro |
| DM-VIS-025 | 🚫 N/A | Sin visitas "No Visitado" en la ruta de hoy — **N/A estructural probado con 3 señales** (ver abajo) |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 |
| DM-VIS-031 | ✅ PASS | Evento VENTA EN RUTA/VENTA EFECTIVA → Back → "Guardar y salir" → "La visita se ha guardado"; en RUTA DE HOY aparece `Nro Ref.: 0 · Estatus: Guardado` y **al reabrirla conserva el evento** |
| DM-VIS-032 | ✅ PASS | Tab ADJUNTOS con acordeones **Imágenes** + **Archivo**; **sin acordeón Firma** y 0 `<canvas>` — coherente con `signatureVisit=false` |

⚠ `DM-VIS-020` — el defecto conocido (modal de confirmación antes de validar actividades) **no se re-marca FAIL** (RUNTIME §5).
⚠ Enviar sin firma **no es defecto** y acá además `signatureVisit=false`.

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **143** | Visita `co_visit` 1787000414615.0 · cliente `J504480975` MINIMARKET BICENTENARIA CCS, C.A. (id 524) · sucursal FISCAL (68305) · `nu_sequence` 1 · 1 actividad: **MERCHANDISING (47) / VISIBILIDAD PDV (184)** · obs. `QA-VIS-015-KRON` | **Enviado** (`st_visit`=2, `is_visited`=true) — **BD-OK** |
| — | Visita `co_visit` 1787000815319.0 · mismo cliente · actividad **VENTA EN RUTA (85) / VENTA EFECTIVA (211)** · obs. `QA-VIS-031-KRON` | Guardada (DM-VIS-031) y **borrada** en DM-VIS-006 — no queda pendiente |
| — | Visita nueva de DM-VIS-021/022 (COBRANZA / COBRANZA EFECTIVA, comentario vacío) | **Descartada** por "Salir sin guardar" — no se insertó nada |

**No queda ninguna visita Guardada pendiente**: la ruta de hoy cierra con 2 filas, ambas Visitado (142 de la QA, 143 de esta corrida).

---

## Verificación BD

**Baseline** (filtrado por vendedor): `count=8`, `max(id_visit)=142` para `id_user=309`.

| Registro | Marca | Nube | Local | Conclusión |
|---|---|---|---|---|
| Ref **143** | **BD-OK** | `visit` id 143 · `id_user` 309 · `id_client` 524 · `id_address_client` 68305 · `nu_sequence` 1 · `st_visit` 2 · `is_visited` true · `is_dispatched` false · `da_visit` 20:57:33Z · `da_initial` 20:57:33Z · `da_real` 21:03:08Z | `visits`: `id_visit` 143, `st_visit` 2, `is_visited` true · `pending_transactions`=0 · `failed_transactions`=0 · sin duplicados | **guardado → enviado ✅** |

**Cotejo campo-a-campo cabecera: 13/13** contra el payload `visitservice/visit` (las fechas cuadran con el desfase TZ local UTC-4 → nube UTC, que RUNTIME §10.b trata como nota, no mismatch).

🔑 **Corrección al supuesto del prompt: la hija SÍ es cotejable en kron.** No existe `visit_incidence` y `visit_view`
es ilegible (`permission denied for sequence visit_view_seq`), pero la tabla **`incidence` sí tiene GRANT**:

| `co_incid` | `id_visit` | `co_type` | `co_cause` | `tx_description` |
|---|---|---|---|---|
| 149 | **143** | 47 (MERCHANDISING) | 184 (VISIBILIDAD PDV) | `QA-VIS-015-KRON` |

⇒ **la actividad/motivo cuadra 1:1 con la UI y con el payload — BD-FIELD-OK, no BD-N/A.**
(De paso quedó cotejada la Ref 142 de la QA: 2 filas `incidence`, `co_type` 71/154 y 75/173, ambas `v1`.)

**Sync a nube: INMEDIATA** — la fila estaba en la nube en la primera ventana de poll.

---

## Respuestas a las preguntas del orquestador

**¿"Ruta de hoy" trajo datos y de qué vendedor?**
**Sí.** Trajo la visita **Ref 142** (BIMBO, `J000469199`) y pertenece a **mi vendedora**: `id_user` **309** (`scarlet`/`VE0002`).
**No se repite el reparto de datos de grupo_fiel** — acá las visitas de ruta son propias, así que 025/026 **no** son N/A
por vendedor ajeno, sino por no haber ninguna "No Visitado".

⚠ **La lista móvil muestra UNA fila por visita**, aunque la Ref 142 tenga 2 actividades (la web muestra una fila por
actividad). Las 2 filas de la web **no** son un duplicado y el móvil **no** las duplica.

**Catálogo real de actividades: 12** (el perfil del YAML decía 5 — se repite el desfase de grupo_fiel).
Todas con `requiredEvent="true"` y `requiredSignature="false"`:

| idType | Actividad | idType | Actividad |
|---|---|---|---|
| 2 | NO VISITO | 83 | INFO DE CLIENTES |
| 47 | MERCHANDISING | 84 | COBRANZA NO EFECTIVA |
| 71 | NO COMPRO | 85 | VENTA EN RUTA |
| 75 | VISITA FUERA DE RUTA | 86 | EVENTOS |
| 82 | COBRANZA | 87 | REUNION CON CLIENTE |
| | | 90 | Cuestonario |
| | | 92 | Cambio X Cambio |

Es el **set El Yaque estándar (11) + `Cuestonario` (90) + `Cambio X Cambio` (92)** — idéntico a ferrenuestro/don-theo.
Motivos medidos: MERCHANDISING(47) → **5** (ENTREGA DE MUESTRAS, LEVANTAMIENTO DATA ISSY, **VISIBILIDAD PDV 184**,
PLAN SLIP, MUESTRA NUEVO CATALOGO) · COBRANZA(82) → **4** (COBRANZA EFECTIVA, COBRANZA PARCIAL, RETENCION,
COBRANZA + RETENCION) · VENTA EN RUTA(85) → **2** (VENTA EFECTIVA 211, VENTA NO EFECTIVA).

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **El `disabled` del selector de EMPRESA en VISITAS lo fija el nº de empresas, NO la VG `enterpriseEnabled`** | universal | kron tiene **`enterpriseEnabled=TRUE`** con **UNA** empresa y el `ion-select` llega **`disabled=true`**, sin `formcontrolname`, `value`=objeto de 8 claves, shadowRoot `CHOCOLATES KRON, C.A`, fuera de la validación. Idéntico a grupo_fiel, que tenía la VG en **false** ⇒ **la VG no es el predictor**; el predictor sigue siendo *1 empresa ⇒ disabled / 2-3 ⇒ editable* (el_palmar, difranca). **6.ª confirmación** de la variante "objeto + sin formcontrolname + fuera de validación" |
| 🔴 **`listaMotivos` del componente trae el CATÁLOGO MAESTRO, no el filtrado — leer los `ion-select-option` del DOM** | universal | Tras elegir MERCHANDISING, `comp.listaMotivos.length` = **94**, pero el `ion-select` renderiza los **5** correctos. Leer el componente hace parecer que el filtro por actividad está roto. **El oráculo es el DOM (`s.querySelectorAll('ion-select-option')`), no el modelo.** |
| 🔴 **El 1.er `mouse.click` en "AÑADIR ACTIVIDAD/EVENTO" tras entrar al form NO abre el modal; el 2.º sí** | universal (candidato) | Reproducido **2 de 3 veces** en esta corrida, con rect válido y estable (x180,y147), sin loading ni backdrop, `showEventModal=false` tras el click. **Verificar `ion-modal#eventModal.show-modal` y reintentar 1 vez antes de contar el intento como fallido** — no es motivo de BLOCKED |
| ⚠ **El envío de la visita puede tardar ~90 s y deja 2 `ion-loading` visibles + `.imagenEnviar` `disabled`** | cliente (kron / Isla Coche) | Tras Aceptar el 1.er alert no salió la 2.ª alerta en ~12 s y quedaron **2 `ion-loading`** colgados; `dismiss()` los quitó pero el POST aún no había salido. **El envío SÍ se completó solo** (~90 s después): `id_visit` 143 + las 2 alertas restantes. 🔑 **`.imagenEnviar` en `disabled` es el estado "enviando", no un botón roto** — leerlo antes de reintentar evita un 2.º envío y un falso BLOCKED |
| **Envío = 3 alertas con la Ref en la 3.ª — 6.ª confirmación** | universal | `¿Desea enviar la visita?` [CANCELAR, Aceptar] → `Su Visita será enviada` [OK] → **`Visita nro. 143 enviada exitosamente`** [OK]. La Ref del servidor se lee del texto, sin ir a BD |
| **`incidence` es legible en kron aunque `visit_view` no lo sea** | cliente (kron) | `visit_view` da `permission denied for sequence visit_view_seq` y no hay `visit_incidence`, pero `SELECT ... FROM incidence WHERE id_visit=…` **funciona** ⇒ el cotejo de la hija **no es BD-N/A**. Probar tabla por tabla antes de declarar el gap |
| ⚠ **3.ª confirmación de la INCIDENCIA HUÉRFANA al borrar una visita Guardada** | universal | Borrada `co_visit` 1787000815319.0, la fila sale de `visits` pero `incidences.co_incidence=4` **sobrevive**. Ahora en **Isla Coche**; antes La Tortuga `[gmp-20260730]` y El Yaque `[grupo_fiel-20260817]` ⇒ **3 servidores, 3 builds. Candidato a defecto formal** (basura acumulativa en BD local; sin impacto en la nube) |
| **`requiredComment=false` no bloquea — 2.ª confirmación** | universal | `Agregar` con Comentario **vacío** agregó el evento (COBRANZA/COBRANZA EFECTIVA, `Observación:` en blanco) y la visita quedó Guardable/Enviable |
| **`comp.textCommentMaxLength` = 255 Y `maxlength="255"` en el `ion-input`** | cliente | Coincide con grupo_fiel; contrasta con los 120 de difranca (mismo build). **Leer ambas fuentes, no memorizar** |
| **`sqlite_sequence` sin fila para `visits`, sí para `incidences`** | universal | 2.ª confirmación: la prueba negativa de DM-VIS-022 se hace sobre `incidences` (`seq` 3→3) |
| **Back: 1 sola `img.fechaAtras` en `/visita` y `/listaVisitas`**, `mouse.click(≈32,31)` engancha | cliente | Patrón ferrenuestro/insumar/grupo_fiel; no las 2 apiladas de difranca/jerez |
| **Reparto de etiquetas de alert** | cliente | Guardado `[OK]` (`Denario`) · Envío `[CANCELAR, Aceptar]`→`[OK]` (`Denario Visitas`)→`[OK]` (`Denario Premium`) · Borrado `[CANCELAR, Aceptar]` (`Denario - Visita`) + `[OK]` · Dirty-guard `[Guardar y salir, Salir sin guardar, Cancelar]` (msg **vacío**) · Coordenadas `["", "Agregar"]` (idx0 vacío = Cancelar, **resolver por índice**) |
| **Alert de coordenadas dispara al SELECCIONAR el cliente y al REABRIR, no antes del dirty-guard** — 4.ª confirmación | universal | El Back sale directo al dirty-guard. No bloquea Guardar/Enviar. Sucursal FISCAL de `J504480975` **sin coordenadas** ⇒ el payload viaja con `coordenada:""` y `coordenadaSaved:false`, lo cual es **correcto** (no es incumplimiento de `userCanSaveGPS`) |
| **`.imagenGuardar` pasa a `disabled` tras guardar** (anti-doble-guardado) | universal | 2.ª confirmación tras difranca; vuelve a habilitarse al reabrir el registro |
| **N/A estructural de DM-VIS-025/026 probado con 3 señales** | universal | `comp.listaVisitas` (1 ítem, Visitado) + `visits` local (1 fila) + nube (`is_visited=true` en las 8 visitas de `id_user=309`, ninguna pendiente). Las 3 coinciden ⇒ **probado, no supuesto** |

> ✅ consolidado 2026-08-17

---

## Hallazgos

**Ninguno.** 0 FAIL.

Dos observaciones **que no son defecto** y quedan documentadas arriba:
1. La latencia de ~90 s del envío con 2 `ion-loading` visibles — el flujo **se completó correctamente por sí solo**,
   con Ref, persistencia y colas en 0. Es lentitud, no pérdida de datos.
2. La incidencia huérfana al borrar — reproduce, pero solo en **BD local** y sobre una visita que nunca llegó a la nube.
   Va como candidato a defecto formal (3.ª confirmación), no como FAIL de esta corrida.

---

## Verificación BD (payload ↔ nube) — Agente BD, cotejo campo-a-campo automático

| co_x | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| `1787000414615.0` (Ref 143) | **BD-FIELD-OK** | **20/20 OK** | `incidence` **1/1** (3/3 campos) | **0** | 3 (zona horaria) |

**Cabecera (20/20):** `co_visit`, `da_visit`, `id_client`, `co_client`, `na_client`, `nu_sequence`, `id_user`,
`co_user`, `co_enterprise`, `id_enterprise`, `da_initial`, `da_real`, `id_address_client`,
`co_address_client`, `coordenada_saved`, `has_attachments`, `nu_attachments`, `is_reassigned`,
`is_dispatched`, `is_visited` — todos coinciden payload↔nube.

**Hija `incidence` (1/1 línea, 3/3 campos):** `co_type` 47 · `co_cause` 184 ·
`tx_description` `QA-VIS-015-KRON` — coincide exacto con lo cotejado a mano por el agente UI (`co_incid` 149).

### 🔴 Corrección a un supuesto del brief

Se había indicado al agente que **la hija NO era cotejable** porque `visit_view` es ilegible
(`permission denied for sequence visit_view_seq`). **Era falso:** la tabla **`incidence` sí tiene GRANT**, y el
motor la resolvió **automáticamente** vía `headerLink id_visit` — sin necesidad de cotejo manual con `query.js`.
⇒ El error de permiso sobre `visit_view` **no implica** que las visitas no se puedan cotejar.

### Notas

- Las 3 notas de hora (`da_visit`, `da_initial`, `da_real`) son **zona horaria** (local UTC-4 vs nube UTC).
- La visita **Guardada y borrada** no aparece en `_payloads.jsonl` ⇒ nunca se envió, nada que descartar.
- ⚠ **Calibración pendiente (no bloqueante):** el `match` de `incidence` es `["co_type","co_cause"]`, que **no es
  una PK real**. Acá había **1 sola incidencia**, sin ambigüedad posible. Pero una visita con **dos incidencias
  del mismo par tipo+motivo** produciría un emparejamiento ambiguo — **el mismo patrón que se corrigió hoy en
  `client_stock_detail_unit`**. Queda anotado para cuando aparezca el caso.
- 🆕 **6.ª corrida del motor contra el esquema de `kron`, y la sexta sin ajustes.**

**Conteo por marca:** BD-FIELD-OK 1 · BD-FIELD-MISMATCH 0 · BD-SAVED 0 · BD-N/A 0.
