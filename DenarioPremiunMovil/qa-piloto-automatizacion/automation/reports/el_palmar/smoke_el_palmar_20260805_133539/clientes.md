# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260805_133539_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | 14678405BR003855 (Infinix HOT 60i · X6728 · 360×744) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Playa | Isla Coche (`denarioislacoche.ddns.net:8081`) |
| Cliente | el_palmar · empresa **1002 — CENTRAL EL PALMAR, S.A.** (`id_enterprise=1`) |
| Usuario | coUser 1276 / idUser 266 (Dilcia Duarte) |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Estado final | HOME ✅ |
| Watchdog | 0 cuelgues · 0 `TIMEOUT` · 0 reconexiones |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | Tile Clientes → `app-clientes` con los 3 botones (CLIENTES 180,107 · CLIENTE POTENCIAL 180,176 · BUSCAR CLIENTE POTENCIAL 180,245) |
| DM-CLT-002 | ✅ PASS | `app-client-list` con **50 ítems**, cada uno con `Saldo VES` **y** `Saldo USD` (`multiCurrency=true`). Saldos de lista = saldos de detalle (ver H-0) |
| DM-CLT-003 | ✅ PASS | Búsqueda "SANTA TERESA" → filtra de 50 a **1** ítem exacto (C.A. RON SANTA TERESA, S.A.C.A · 1000000803) |
| DM-CLT-009 | ✅ PASS | `app-client-detail`: Nombre, Código, RIF J000325693, Saldo VES 16.846.777,9664 / USD 25.800,1300, créditos, condición de pago NT15, dirección. **Rotula `Empresa: CENTRAL EL PALMAR, S.A.`** |
| DM-CLT-013 | ✅ PASS | Tab `docVentas` → `.documents-table-panel--ready` con leyenda **Vigente / Vencido / A favor** y 19 columnas; 13 documentos, todos vencidos (Días Venc. 756…376), tasa 652,9726 VES |
| DM-CLT-016 | ✅ PASS | Back desde listado → `app-clientes` con los 3 botones (no salta a HOME) |
| DM-CLT-017 | ✅ PASS | Back desde detalle → `app-client-list` (no salta al home principal) |
| DM-CLT-019 | ✅ PASS | Form potencial: **9 `ion-input` vacíos** (8 `ng-invalid` + `naWebSite` `ng-valid`/opcional); Guardar y Enviar `disabled=true`. Sin botón de adjunto/cámara |
| DM-CLT-021 | ✅ PASS | 8 campos + **empresa** → Guardar/Enviar `disabled=false`. **Oráculo del selector**: con los 8 inputs llenos y empresa vacía los botones seguían `disabled=true` (ver P-1) |
| DM-CLT-024 | ✅ PASS | Guardar → alert `Denario Cliente / ¡Cliente Potencial Guardado con exito!` [**OK**]; aparece en BUSCAR CLIENTE POTENCIAL con `Nro. Ref: 0` · `Estatus: Guardado` · con trash |
| DM-CLT-026 | ✅ PASS | Enviar → 3 alertas → `Cliente potencial nro. **31** creado exitosamente`; ítem pasa a `Nro. Ref: 31` · `Estatus: Enviado` · **sin trash**. **BD-OK** |
| DM-CLT-031 | ✅ PASS | Trash en el Guardado → borrado **directo sin confirmación previa**, alert `Denario Clientes / ¡Cliente Potencial se borro con exito!` [OK]; lista 2 → 1, sobrevive solo el Enviado |

## Registros creados en sistema

| Ref (`id_client`) | epoch (`co_client`) | Detalle | **Empresa efectiva** | Estado |
|---|---|---|---|---|
| **31** | `1785952445854.0` | `Test-CLT-SMOKE-135439` · RIF J987654321 · Resp. Responsable QA · qa@kiberno.com · 04141234567 · Av Principal QA El Palmar | **1002 / id 1 — CENTRAL EL PALMAR, S.A.** ✅ | **Enviado · BD-OK** |
| — (nunca tuvo Ref) | — | `Test-CLT-DEL-135709` · RIF J123456789 — creado para DM-CLT-031 | 1002 / id 1 | Guardado → **BORRADO** (no llegó a nube, correcto) |

## Verificación BD

**Baseline** (inicio de módulo): `potential_client` → `count=30`, `max(id_client)=30`.

**Diff post-Enviar** (`WHERE id_client > 30`) — **una sola fila nueva, cero duplicados**:

| Campo | Valor en nube | Cotejo vs UI/form |
|---|---|---|
| `id_client` | **31** | = Nro. Ref de la UI ✅ |
| `co_client` | `1785952445854.0` | = `coClient` del payload ✅ |
| `na_client` | `Test-CLT-SMOKE-135439` | = lo tipeado ✅ |
| `nu_rif` | `J987654321` | ✅ |
| `tx_address` | `Av Principal QA El Palmar` | ✅ |
| `na_responsible` | `Responsable QA` | ✅ |
| `em_client` | `qa@kiberno.com` | ✅ |
| `nu_phone` | `04141234567` | ✅ |
| **`co_enterprise`** | **`1002`** | ✅ **empresa de la corrida — NO se coló el `enterprise_default` 1003** |
| **`id_enterprise`** | **`1`** | ✅ |
| `st_potential_client` | `1` | Enviado |
| `co_user` | `1276` | = coUser de la sesión ✅ |
| `da_created` | `2026-08-05T17:56:15.284Z` | ✅ |

**Marca: `BD-OK`** — guardado → enviado confirmado. El registro Guardado que se borró (DM-CLT-031) nunca llegó a la nube, que es lo correcto.

**Payload** (`__qaH.getPayloadData()`, hook heredado del agente LOGIN): el POST
`potentialclientservice/potentialclient` se capturó **1 sola vez, con `data` completo** (0 duplicados —
la guarda `__qaDataHook` funcionó). Volcado en `_payloads.jsonl`.

⚠ **`st_potential_client=1` en NUBE para Enviados** — confirma la nota candidata `[prc-2606]` (=1 en
servidor) y contrasta con el `=2` observado en la tabla **local** de latino_cosmetica/globalmp. Son
dominios distintos local↔nube; con esta 2ª confirmación en servidor la nota de piercar queda graduada.

### BD-INFO — el device sincroniza un SUBCONJUNTO de los documentos del cliente

Los datos de perfil que llegaron al agente decían "1000000803 — 26 documentos, 51.600,26 USD". Lo medido:

| Fuente | Docs con saldo | Saldo USD |
|---|---|---|
| UI del device (tab Doc. de Venta) | **13** | **25.800,13** |
| Nube, empresa **1002**, moneda USD | 40 | 79.542,42 |
| Nube, empresa 1003 (fuera de alcance) | 17 | 180.314,50 |

**No es defecto y no contamina ningún caso:** la app es **internamente consistente** — la suma de los
13 saldos de la tabla da **exactamente 25.800,1300 USD**, que es el Saldo USD que muestran tanto la
lista como el detalle. Es el patrón ya documentado de **sync parcial por vendedor**. Lo que sí conviene
corregir es el **dato del perfil** (`26 docs / 51.600,26`), que no corresponde a lo que ve este usuario.

### H-0 — NO reproduce el defecto de saldos cruzados de globalmp

`[gmp-20260730]` levantó que la LISTA rotula "Saldo BS" sobre el importe USD y divide otra vez por la
tasa. **Acá no ocurre**: lista y detalle muestran los mismos valores (VES 16.846.777,9664 / USD
25.800,1300) y se verifica `VES = USD × 652,9726` (tasa del día). Dato útil para acotar aquel defecto
a la familia globalmp / build v6.6.18.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **P-1 · El `idEnterprise` editable BLOQUEA la validación — oráculo medido** | universal (multi-empresa) | Con los **8 `ion-input` obligatorios llenos** y `idEnterprise` en `null`, `imagenGuardar`/`imagenEnviar` siguen `disabled=true`. Tras `s.value = 1` (**number**) + `ionChange`, `ng-invalid` cae, el shadowRoot rotula la empresa y **ambos botones habilitan en el mismo tick**. Confirma la receta de login con medición antes/después. **No hace falta abrir el popover.** |
| **P-2 · La empresa elegida SOBREVIVE al round-trip Guardar→reabrir** | universal (multi-empresa) | Al reabrir el potencial Guardado, `idEnterprise` vuelve como `1` (number) con label `CENTRAL EL PALMAR, S.A.` y Enviar habilitado. **La "trampa" del `enterprise_default=1003` NO se materializó** en ningún punto: ni al crear, ni al reabrir, ni en el payload, ni en la fila de nube. |
| **P-3 · Alertas de CLIENTES en el_palmar: todas cierran con "OK" salvo el 1er paso del envío** | cliente (build v1.0/db19 Isla Coche) | Guardado `[OK]` · Envío paso 1 `[Cancelar, **Aceptar**]` · pasos 2 y 3 `[OK]` · Borrado `[OK]`. ⚠ Contradice el quirk que anunciaba "guardado y borrado usan Aceptar": **acá guardado y borrado usan OK**. El recorrido por preferencia `Aceptar → OK` con **igualdad exacta** resolvió los 5 alerts sin un solo reintento. |
| **P-4 · Reapertura del Guardado por zona izquierda: coords que funcionaron** | universal | `x = rect.x + 0.35·rect.width`, `y` = centro del `ion-item` (real: 129,228). Reabre el form con los 9 campos y la empresa precargados. Reconfirma `[ins-2622]…[latino_cosmetica-20260714]`. |
| **P-5 · El form de cliente potencial NO ofrece adjuntos** | cliente | 0 botones/iconos de cámara o adjunto en `app-client-new-potential-client`; el payload viaja con `nuAttachments:0`, `hasAttachments:false`. ⇒ `userCanUploadFiles`/`showCamera` son **N/A en este módulo** — no hay nada que bloquee el Enviar. |
| **P-6 · `userCanSaveGPS`: guarda coordenada aun con `userMustActivateGPS=false`** | cliente (VG) | El payload lleva `coordenada:"11.0490651,-63.865006"` (`coordenadaClient:null`). **No hubo alert ni exigencia de GPS** en ningún momento del flujo, coherente con `userMustActivateGPS=false`. |
| **P-7 · `requiredComment` no aplica a CLIENTES** | cliente (VG) | El form no tiene campo comentario y nada lo exigió. Confirma que el alcance de la VG es COBROS (`tipo=C`). 🚫 sin efecto acá. |
| **P-8 · Destino post-envío = home de clientes** | universal | Tras la 3ª alerta queda en `app-clientes` (3 botones), **no** en HOME principal. Reconfirma `[ins-2610][gmp-2611]`. |
| **P-9 · Tras Guardar el form NO navega** | universal | Queda en `app-client-new-potential-client`; el Guardado solo se ve entrando a BUSCAR CLIENTE POTENCIAL. Reconfirma `[dth-2612][hidroponias-20260710][ferrenuestro-20260723]`. |
| **P-10 · Sin dirty-guard al salir de un form ya Guardado** | universal | El back desde el form recién guardado sale **directo** a `app-clientes`, sin la alerta de 3 botones. El dirty-guard es de cambios **sin** guardar. |
| **P-11 · La lista de potenciales SÍ refresca en este build** | cliente | Tanto el Guardado como el Enviado y el borrado se vieron **sin** salir y re-entrar. **No reproduce** el defecto de render de `[gmp-20260730]`. |


> ✅ consolidado 2026-08-05
## Hallazgos (FAIL)

**Ninguno.** 12/12 PASS.

---

### Notas de conducción (economía)

- 12 casos en **12 llamadas** de `browser_run_code_unsafe`, 0 exploración a ciegas: los selectores de
  `clientes.md` + las coords `[gmp-20260730]` (180,107 / 180,176 / 180,245 / Guardar 267,32 / Enviar 326,32)
  valieron **tal cual** en este device.
- `page.__qa` (patrón `[gmp-20260730]`) evitó reinlinar `connectCdp`/`makeWatchdog` en cada llamada.
- Hook de payload **heredado, no reinstalado** (instrucción del orquestador) → 0 duplicados.
- `img.fechaAtras` filtrado por `width>0` en todos los back — coords estables (32,47).
