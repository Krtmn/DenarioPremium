# Smoke Test — Módulo COBROS · 🔒 CORRIDA DE SOLO LECTURA

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260805_133539_smoke-completo` |
| Módulo | COBROS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Playa | Isla Coche (`denarioislacoche.ddns.net:8081`) |
| Cliente | el_palmar (1ª corrida) · Empresa de la corrida **1002 CENTRAL EL PALMAR, S.A.** |
| Usuario | coUser 1276 / idUser 266 |
| Resultado | **0 PASS · 0 FAIL · 0 BLOCKED · 34 🚫 N/A por alcance de corrida** |
| Registros creados | 🔴 **NINGUNO** — ver constancia al pie |
| Verificación BD | `BD-INFO` — lectura y contraste nube ↔ BD local, sin escrituras |

> 🔴 **Alcance decidido por la QA:** en esta corrida está **prohibido crear, guardar o enviar cobros**.
> Los 34 casos del smoke (DM-COB-001…047) van **🚫 N/A por alcance de corrida** — no se ejecutaron, y su
> N/A **no dice nada** sobre la salud del módulo (no es N/A por VG ni por falta de datos).
> El trabajo real de este módulo fue de **lectura y contraste**, en las secciones siguientes.

---

## Casos — 34 🚫 N/A por alcance de corrida

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | 🚫 N/A por alcance | *(único observado sin crear: menú COBROS con sus 6 botones — ver §5)* |
| DM-COB-002 | 🚫 N/A por alcance | requiere abrir formulario de cobro nuevo |
| DM-COB-004 | 🚫 N/A por alcance | requiere seleccionar cliente en cobro nuevo |
| DM-COB-006 | 🚫 N/A por alcance | validación de Comentario obligatorio — requiere formulario |
| DM-COB-007 | 🚫 N/A por alcance | Tab Documentos de un cobro nuevo |
| DM-COB-008 | 🚫 N/A por alcance | checkbox de documento |
| DM-COB-009 | 🚫 N/A por alcance | modal métodos de pago |
| DM-COB-012 | 🚫 N/A por alcance | color de Diferencia |
| DM-COB-014 | 🚫 N/A por alcance | Tab Total de cobro nuevo |
| DM-COB-015 | 🚫 N/A por alcance | Total General de cobro nuevo |
| DM-COB-016 | 🚫 N/A por alcance | Tab Adjuntos |
| DM-COB-018 | 🚫 N/A por alcance | **Guardar — prohibido** |
| DM-COB-019 | 🚫 N/A por alcance | **Enviar — prohibido** |
| DM-COB-020 | 🚫 N/A por alcance | dirty-guard con cobro nuevo |
| DM-COB-021 | 🚫 N/A por alcance | "Salir sin guardar" |
| DM-COB-022 | 🚫 N/A por alcance | *(lista BUSCAR sí se recorrió — ver §1; el caso igual va N/A porque no se creó el cobro que exige)* |
| DM-COB-024 | 🚫 N/A por alcance | reabrir cobro **Guardado** — no hay ninguno en el device (los 5 locales están Enviados) |
| DM-COB-026 | 🚫 N/A por alcance | **Eliminar — prohibido** |
| DM-COB-028 | 🚫 N/A por alcance | crear Anticipo/Prepago |
| DM-COB-029 | 🚫 N/A por alcance | crear Retención |
| DM-COB-033 | 🚫 N/A por alcance | cambio de moneda del cobro |
| DM-COB-034 | 🚫 N/A por alcance | Moneda documento |
| DM-COB-036 | 🚫 N/A por alcance | crear cobro IGTF |
| DM-COB-037 | 🚫 N/A por alcance | crear cobro 25% IVA |
| DM-COB-038 | 🚫 N/A por alcance | "Guardar y salir" |
| DM-COB-039 | 🚫 N/A por alcance | cambio de tasa sobre Guardado |
| DM-COB-040 | 🚫 N/A por alcance | método de pago + banco + monto |
| DM-COB-041 | 🚫 N/A por alcance | retención por detalle de documento |
| DM-COB-042 | 🚫 N/A por alcance | persistencia de retención (round-trip) |
| DM-COB-043 | 🚫 N/A por alcance | color de diferencia parcial/total |
| DM-COB-044 | 🚫 N/A por alcance | persistencia tasa IGTF (default) |
| DM-COB-045 | 🚫 N/A por alcance | persistencia tasa IGTF (alterna) |
| DM-COB-046 | 🚫 N/A por alcance | pago parcial |
| DM-COB-047 | 🚫 N/A por alcance | recálculo por Fecha tasa |

---

## 🔴 §1 · CONTRASTE CLAVE — cuántos cobros muestra el móvil

**Respuesta corta: el móvil muestra 5. La nube tiene 25 hoy (no 18).**

### Lo que muestra la app (Cobros → BUSCAR)

| # | Nro. Ref | Estatus (móvil) | Tipo (móvil) | Cliente | `co_type` | Empresa |
|---|---------|------------------|--------------|---------|-----------|---------|
| 1 | **27085** | Enviado | Cobros | C.A. RON SANTA TERESA, S.A.C.A (1000000803) | 0 | 1002 |
| 2 | **27084** | Enviado | Cobros | C.A. RON SANTA TERESA | 0 | 1002 |
| 3 | **27083** | Enviado | **IGTF** | C.A. RON SANTA TERESA | 3 | 1002 |
| 4 | **27082** | Enviado | Cobros | C.A. RON SANTA TERESA | 0 | 1002 |
| 5 | **27081** | Enviado | **Retención** | C.A. RON SANTA TERESA | 2 | 1002 |

### El universo real en la nube

```sql
SELECT ... FROM collection WHERE da_collection >= '2026-08-05' AND co_operation <> 'D';
```
**25 cobros — ids 27068 … 27092**, todos `id_user=266`, todos `st_collection=1`.
⚠ Son **25, no 18**: después de que la capa web verificó los 18 (27068-27085) se registraron **7 más**
(27086-27092, entre 15:00 y 15:21 hora local) que la web todavía no había mirado.

| Bloque | Ids | ¿En el móvil? |
|---|---|---|
| Primeros 13 de la tanda de la QA | 27068 – 27080 | ❌ **NO** (0 de 13) |
| Últimos 5 de la tanda de la QA | 27081 – 27085 | ✅ **SÍ** (5 de 5) |
| Los 7 posteriores | 27086 – 27092 | ❌ **NO** (0 de 7) |

### 📊 Cuantificación pedida

- De los **18** cobros del enunciado (27068-27085): el móvil muestra **5** y **no muestra 13** → **27,8 %**.
- Del universo real de **25** de hoy: el móvil muestra **5** y **no muestra 20** → **20,0 %**.

**Refs visibles:** `27081, 27082, 27083, 27084, 27085`.
**Refs ausentes (20):** `27068, 27069, 27070, 27071, 27072, 27073, 27074, 27075, 27076, 27077, 27078, 27079, 27080, 27086, 27087, 27088, 27089, 27090, 27091, 27092`.

---

## 🔴 §2 · EL CRITERIO DEL FILTRO — **no hay filtro: la lista es 100 % LOCAL**

Éste es el dato de valor del módulo. **No filtra por empresa, ni por estado, ni por fecha, ni por `co_type`.**
La lista BUSCAR **no consulta la nube**: pinta exactamente lo que hay en la tabla SQLite local `collections`,
y el sync **nunca descarga cobros del servidor**. El móvil solo puede mostrar cobros que **ese mismo
dispositivo creó** y que aún conserva localmente.

### Cadena de evidencia

**(a) La UI es fiel a su modelo — no es un bug de render ni de paginación.**
`window.ng.getComponent(document.querySelector('app-cobros-list'))` →
`pageSize: 20` · `currentPage: 0` · `filteredItems: 5` · `displayedItems: 5` · `scrollDisable: true` ·
`ion-infinite-scroll.disabled = true`.
Con `pageSize=20` y solo 5 ítems **no hay segunda página que cargar** ⇒ queda descartado el quirk de
paginación (el que sí aplica al modal de clientes, 144 asignados).

**(b) La BD local tiene exactamente las mismas 5 filas.**
Vía `window.sqlitePlugin` (tabla en plural `collections`):
`count(*) = 5`, `count(DISTINCT co_collection) = 5` (sin duplicados),
`pending_transactions WHERE type='collect' = 0` (nada en cola). Las 5 filas traen `st_delivery = 1` e
`id_collection > 0` ⇒ **BD-OK**: son cobros creados **y** enviados por este teléfono.
⇒ **UI = BD local.** El recorte no ocurre al pintar, ocurre antes.

**(c) La BD local nunca tuvo más de 11 cobros — nunca 18 ni 25.**
`SELECT seq FROM sqlite_sequence WHERE name='collections'` → **11**.
Los `local_id` supervivientes son **1, 4, 6, 9, 11** (faltan 2, 3, 5, 7, 8, 10 → 6 filas borradas).
Que el contador arranque en 1 dice que la tabla `collections` **se creó/reconstruyó desde cero** poco antes
de las 13:15 (login limpio, limpieza de caché o reinstalación). Los 5 supervivientes son consecutivos en el
tiempo: **13:15:25 → 13:24:46** hora local, todos posteriores a esa reconstrucción.

**(d) Los 13 primeros son ANTERIORES a la reconstrucción; los 7 últimos NUNCA existieron localmente.**

| Bloque | Ventana (hora local UTC-4) | Por qué no está |
|---|---|---|
| 27068-27080 | 12:20 – 13:08 | creados **antes** de que la BD local se reconstruyera (~13:1x) — se perdieron con ella |
| 27081-27085 | 13:15 – 13:24 | ✅ creados después → sobreviven (`local_id` 1-11) |
| 27086-27092 | 15:00 – 15:21 | creados **fuera de este device**; con el teléfono encendido y sincronizando toda la corrida, **jamás bajaron** (`sqlite_sequence` sigue en 11) |

El bloque (d) es el que cierra el argumento: los 27086-27092 nacieron **durante** esta corrida, con el device
activo y sincronizando, y aun así no aparecen ni en la BD local ni en la lista ⇒ **el sync no trae cobros
de la nube en ningún sentido.**

**(e) Se descartan explícitamente los filtros candidatos:**

| Hipótesis | Veredicto | Contraejemplo |
|---|---|---|
| Filtra por **empresa** (solo 1002) | ❌ descartada | 27070, 27073-27080, 27086-27091 son **todos 1002** y tampoco aparecen |
| Filtra por **estado** | ❌ descartada | los 25 tienen `st_collection=1` idéntico |
| Filtra por **fecha** | ❌ descartada | los 25 son del **mismo día** (2026-08-05) |
| Filtra por **`co_type`** | ❌ descartada | los 5 visibles son de 3 tipos distintos (0, 2, 3) y hay ausentes de esos mismos tipos |
| Es **paginación** / scroll infinito | ❌ descartada | `pageSize=20 > filteredItems=5`, infinite-scroll `disabled` |
| **La lista es puramente local** | ✅ **confirmada** | (a)+(b)+(c)+(d) |

### Consecuencia práctica para la QA

Que "no todos los cobros salgan en el móvil" **no es un defecto de la lista**: es el diseño de la app —
BUSCAR es un historial **del dispositivo**, no un consultor de la cartera de cobros del servidor. Dos
corolarios operativos:

1. **Cualquier login limpio / limpieza de caché borra el historial visible de cobros** del teléfono, aunque
   los cobros estén sanos en la nube. Fue lo que se llevó los 13 de la mañana.
2. **Un cobro hecho en otro device o en la web nunca aparecerá** en este teléfono.

⇒ La pregunta abierta para producto es si esto es **intencional**. Se documenta como hallazgo **H-COB-1**
(abajo) sin marcarlo FAIL: ningún caso del smoke especifica que BUSCAR deba traer la cartera del servidor,
y la app hace de forma consistente lo que su modelo de datos permite.

---

## 🔴 §3 · Detalle de 3 cobros cotejado contra la nube — **3/3 exactos**

Se abrieron 3 de tipos distintos. ⚠ Un cobro **Enviado** abre con **solo 3 tabs** (`default` / `total` /
`adjuntos`): sin Tab Documentos ni Tab Pagos — todo el detalle se lee en el Tab Total (reconfirma
`[gmp-20260730]`).

### 3.a · Ref 27085 — cobro normal (`co_type=0`, USD)

| Campo | Móvil | Nube | ✓ |
|---|---|---|---|
| Cliente | C.A. RON SANTA TERESA, S.A.C.A (1000000803) | id_client 85, `na_client` idem | ✅ |
| Empresa | CENTRAL EL PALMAR, S.A. | `co_enterprise` 1002 / `idEnterprise` 1 | ✅ |
| Moneda | USD | `co_currency` USD | ✅ |
| Tasa VES | 652,9726 | `nu_value_local` 652.9726 | ✅ |
| Fecha Cobro | 5/8/2026, 1:24 P. M. | `da_collection` 17:24:46 UTC (=13:24 local) | ✅ |
| Comentario | "gv" (2/255) | `tx_comment` "gv" | ✅ |
| Documento | 0092002922 · Monto Doc. 2.621,6000 · Monto Pago 2.350,4000 | `co_document` 0092002922 · `nu_amount_doc` 2621.60 · `nu_amount_paid` 2350.40 | ✅ |
| Pagos | Total Transferencias USD 2.350,4000 | 1 pago, suma 2350.40 | ✅ |
| Diferencia | 0,0000 | — (cubre) | ✅ |
| Estado | **Enviado** | `st_collection=1` | ✅ |

### 3.b · Ref 27083 — IGTF (`co_type=3`, VES)

| Campo | Móvil | Nube | ✓ |
|---|---|---|---|
| Cliente / Empresa / Tasa | RON SANTA TERESA · CENTRAL EL PALMAR · 652,9726 | idem | ✅ |
| Moneda | VES | VES | ✅ |
| Fecha | 5/8/2026, 1:19 P. M. | 17:19:45 UTC | ✅ |
| Comentario | "tv" | `tx_comment` "tv" | ✅ |
| Documento | Tipo **IGTF** · `IGTF-1785949364757.0` · Monto Doc. 16.820,4436 · Monto Pago 16.820,4436 | `co_document` `IGTF-1785949364757.0` · `nu_amount_doc`/`nu_amount_paid` 16820.4436 | ✅ |
| Pagos | Total Efectivo VES 6.820,4436 + Total Depósitos VES 10000 = 16.820,4436 | **2 pagos**, `sum(nu_amount_partial)` = 16820.4436 | ✅ |
| Total General VES | 16.820,4436 | `nu_amount_total` 16820.4436 | ✅ |
| Estado | **Enviado** | `st_collection=1` | ✅ |

### 3.c · Ref 27081 — Retención (`co_type=2`, VES)

| Campo | Móvil | Nube | ✓ |
|---|---|---|---|
| Cliente / Empresa / Moneda / Tasa | RON SANTA TERESA · CENTRAL EL PALMAR · VES · 652,9726 | idem | ✅ |
| Etiqueta de fecha | **"Fecha Retención"** (no "Fecha Cobro") — la UI se adapta al tipo | `co_type=2` | ✅ |
| Fecha | 5/8/2026, 1:15 P. M. | 17:15:25 UTC | ✅ |
| Nro. Doc. | 0091021644 | `co_document` 0091021644 | ✅ |
| Fecha del documento | 2026-08-01 | — | ✅ (formateada, **sin** el timestamp ISO crudo de globalmp) |
| Monto IVA VES | 500,0000 | `nu_amount_retention` 500.00 | ✅ |
| Monto ISLR VES | 200,0000 | `nu_amount_retention2` 200.00 | ✅ |
| Monto total retenido VES | 700,0000 | `nu_amount_total`/`final` 700.00 | ✅ |
| Pagos | *(sin Tab Pagos — correcto para retención)* | **0 pagos** en `collection_payment` | ✅ |
| Estado | **Enviado** | `st_collection=1` | ✅ |

**Conclusión §3: el móvil muestra correctamente TODO lo que sí tiene.** Cero divergencias de contenido en 3
cobros de 3 tipos distintos. El problema es de **cobertura** (§1/§2), no de fidelidad.

---

## 🔴 §4 · El estado que rotula el móvil — **"Enviado", igual que la web** ✅

**Qué rotula:** los 5 ítems muestran `Estatus: Enviado`. **Coincide exactamente con la web.**

**Por qué es interesante:** el `st_collection=1` de los 18/25 **no existe en el catálogo `statuses` de `cob`**
de ninguna de las 2 empresas — y aun así el móvil rotula bien. La explicación se midió en runtime:

1. La tabla local `statuses` está **VACÍA** (`count(*) = 0`) ⇒ el móvil **no tiene catálogo que consultar**.
2. `app-cobros-list` resuelve la etiqueta con **constantes hardcodeadas** en el componente:
   `COLLECT_STATUS_NEW=0` · `COLLECT_STATUS_SENT=1` · `COLLECT_STATUS_TO_SEND=2` · `COLLECT_STATUS_SAVED=3`.

⇒ **El hueco del catálogo `cob` no afecta al móvil**: el rotulado no depende de él. Móvil y web coinciden en
"Enviado" por caminos distintos (la web por catálogo, el móvil por constante). No hay defecto que reportar en
el estado. Se deja anotado porque **cambia el diagnóstico**: si algún día el catálogo se corrige, el móvil
seguirá igual — cualquier discrepancia futura de estado habrá que buscarla en las constantes, no en `statuses`.

Verificaciones colaterales de la lista, todas correctas:
- **Tipo** bien rotulado por `co_type`: `0 → "Cobros"` · `2 → "Retención"` · `3 → "IGTF"` ✅
- **Botón de eliminar ausente** en los 5 (todos Enviados) ✅ — coherente con "trash solo en Guardado"
- **Searchbar presente** ✅

---

## §5 · VGs observadas en la UI (sin crear nada)

El menú COBROS renderiza **6 botones**, todos habilitados:
`COBRO` · `ANTICIPO/PREPAGO` · `RETENCIÓN` · `IGTF` · `COBRO 25% IVA` · `BUSCAR`.

| VG del perfil | Valor esperado | Observación en UI | ✓ |
|---|---|---|---|
| `cobroPrepago` | true | botón **ANTICIPO/PREPAGO** presente y habilitado | ✅ coincide |
| `cobroRetencion` | true | botón **RETENCIÓN** presente y habilitado | ✅ coincide |
| `userCanSelectIGTF` | true | botón **IGTF** presente y habilitado | ✅ coincide |
| `userCanCollectIva` | true | botón **COBRO 25% IVA** presente y habilitado | ✅ coincide |
| `retencion` (retención **dentro** del cobro normal) | true | **no observable sin crear** — vive en el detalle de documento de un cobro nuevo, y un cobro Enviado no tiene Tab Documentos. Nota indirecta: la nube tiene 6 cobros `co_type=2` hoy, que corresponden a la otra vía (`cobroRetencion`) | ⏭ no observable |
| `requiredCollectionAttachments` | false | no observable sin crear (Tab Adjuntos de cobro nuevo) | ⏭ no observable |
| `requiredComment` (`tipo=C`, alcance COBROS) | true | **parcial** — el 2.º `ion-input` del Tab General (Comentario) llega con **`required=true`** en el DOM ✅, pero el texto de ayuda dice **"Mín. 0 - Máx. 255 caracteres"**. Ver H-COB-3 | ⚠ ver hallazgo |
| Métodos de pago ofrecidos | — | `collectService.paymentMethodList` está **vacío** fuera del formulario (se puebla al abrir un cobro nuevo → no observable). **Sí observados en uso** en los cobros existentes: **Efectivo**, **Depósito**, **Transferencia** | ⚠ parcial |
| Multi-moneda | — | cobros existentes en **VES** y **USD**; tasa 652,9726 | ✅ |
| Empresa | 2 empresas | `ion-select` de Empresa con **2 opciones**, `disabled=true` en cobro Enviado (solo lectura) | ✅ |

---

## Hallazgos

### H-COB-1 · (el principal) BUSCAR es un historial LOCAL — 20 de 25 cobros del día no son visibles
Detalle completo y cadena de evidencia en **§2**. Impacto operativo: un login limpio borra el historial de
cobros visible, y ningún cobro creado en otro device o en la web aparece nunca. **No se marca FAIL**: ningún
caso del smoke exige que BUSCAR consulte el servidor, y la app es consistente con su modelo de datos.
**Requiere confirmación de producto** de si el comportamiento es intencional.

### H-COB-2 · `Total Depósitos:` sin formato de miles/decimales — **reproduce el defecto de globalmp en 2º cliente**
En el Tab Total del cobro **27083** (IGTF):
`Total Efectivo: VES 6.820,4436` (bien formateado) vs **`Total Depósitos: VES 10000`** (crudo, sin separador
de miles ni decimales), en la misma pantalla. Es exactamente el defecto anotado en `[gmp-20260730]`
(globalmp / La Tortuga), ahora **reproducido en el_palmar / Isla Coche** ⇒ deja de ser específico de una
playa. `Total Transferencias:` sí formatea (visto en 27085: `USD 2.350,4000`).
✅ **No reproduce** el otro defecto de globalmp: `Fecha del documento` sale bien formateada (`2026-08-01`),
no como timestamp ISO crudo.

### H-COB-3 · `requiredComment=true` pero el hint dice "Mín. 0 … caracteres"
El campo Comentario del Tab General llega con `required=true` en el DOM (coherente con la VG), pero su texto
de ayuda es **"Mín. 0 - Máx. 255 caracteres"**. **No se eleva a FAIL** porque solo se pudo observar en cobros
**Enviados** (vista de solo lectura), donde los mensajes de validación no son representativos. **Verificar en
la próxima corrida con permiso de crear**, junto con DM-COB-006.
Nota adicional: el máximo real observado es **255**, no los 120 de `TEXT_COMMENT_MAX_LENGTH` de la APK
El Yaque `[alipascua-20260804]` — el límite del comentario de **cobros** es distinto al de inventarios.

### H-COB-4 · `nu_amount_total = 0` en la nube para los cobros normales en USD (dato, no render)
El Tab Total de **27085** imprime `Total General USD: 0,0000` mientras `Monto total a Pagar USD` es
`2.350,4000`. **La app no miente**: `Total General` está bindeado a `nu_amount_total`, que en la nube vale
efectivamente `0.0000` para ese cobro. El patrón se repite en la nube en **27076, 27077, 27082, 27085 y
27086** (todos con `nu_amount_final` correcto y `nu_amount_total = 0`). Contraprueba: en 27083 y 27081
`nu_amount_total` está bien y la app imprime el valor correcto.
⇒ El origen está en **cómo se grabó el cobro**, no en la lectura del móvil. Como esos cobros los creó la QA
fuera de esta corrida, **no se pudo reproducir el momento de la escritura**. Se deja como `BD-INFO` para
cotejar con la capa web.

---

## Verificación BD (§10) — lectura, sin escrituras

**Nube** — 25 cobros hoy (27068-27092), `id_user=266`, `st_collection=1`, `co_operation<>'D'`.
Reparto: por empresa **21× 1002 / 4× 1003**; por tipo **12× `0` cobro · 6× `2` retención · 3× `1` anticipo ·
3× `4` cobro 25% · 1× `3` IGTF**.

**Local** (`window.sqlitePlugin`, tablas en plural):

| Consulta | Resultado | Marca |
|---|---|---|
| `count(*)` / `count(DISTINCT co_collection)` de `collections` | 5 / 5 | ✅ sin duplicados |
| `st_delivery` + `id_collection` de las 5 | `1` y `>0` en las 5 | **BD-OK** (guardado **y** enviado) |
| `pending_transactions WHERE type='collect'` | 0 | ✅ nada en cola |
| `failed_transactions` | 0 filas de cobro | ✅ nada rechazado |
| `sqlite_sequence` de `collections` / `collection_details` / `collection_payments` | 11 / 11 / 11 | **BD-INFO** — techo histórico de inserts locales |
| `statuses` | **0 filas** | **BD-INFO** — catálogo vacío; el móvil rotula por constantes (§4) |

**Conclusión:** las 5 transacciones que el device conserva están **guardadas y enviadas** (BD-OK), sin colas,
rechazos ni duplicados. Los 20 cobros restantes de la nube **nunca estuvieron** en esta BD local (§2).

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **Back de `app-cobros-header` = `img.fechaAtras` con `src=flecha-blanca.png`** | **universal — corrige el filtro vigente** | El filtro recomendado `/atras/i.test(src)` (heredado de vendedores/pedidos) **descarta este back** y se lee como "no existe botón atrás". Acá el `src` es `flecha-blanca.png` y **sí** tiene `<a>` padre. La 2ª `img.fechaAtras` (x=302) es `cobrosNuevoBlanco.svg`, decorativa. **Regla robusta: filtrar por `rect.width>0 && rect.x<100`, NO por `src`.** Coords ≈(31,31) |
| 🔴 **Oráculo de cobertura de la lista: `pageSize` vs `filteredItems`** | **universal** | Antes de concluir "la lista no muestra X", leer `window.ng.getComponent(document.querySelector('app-cobros-list'))`: si `filteredItems < pageSize` y `ion-infinite-scroll.disabled=true`, **no hay página siguiente** ⇒ el recorte no es de paginación. Evita el falso "hay que hacer scroll infinito" |
| 🔴 **`sqlite_sequence` distingue "se borró" de "nunca llegó"** | **universal** | `SELECT seq FROM sqlite_sequence WHERE name='<tabla>'` da el techo histórico de inserts. Comparado con `count(*)` y con los `local_id` supervivientes (huecos = borrados) reconstruye la historia de la tabla sin logs. Fue **la evidencia decisiva** del criterio del filtro de cobros |
| **BUSCAR de Cobros no consulta la nube — historial puramente local** | cliente (a confirmar universal) | El sync no descarga `collection` del servidor. Consecuencia para el smoke: **nunca marcar FAIL "la lista está vacía / faltan cobros"** sin antes contrastar contra la BD local. Confirmar en la próxima playa antes de graduar a universal |
| **Tabla local `statuses` VACÍA; el estado se rotula por constantes del componente** | **universal** | `COLLECT_STATUS_NEW=0/SENT=1/TO_SEND=2/SAVED=3` en `app-cobros-list`. Un hueco en el catálogo `statuses` del servidor **no** afecta el rotulado del móvil — no diagnosticar por ahí |
| **Un cobro Enviado abre con 3 tabs** (`default`/`total`/`adjuntos`) | universal (reconfirma `[gmp-20260730]`) | Sin Tab Documentos ni Pagos. Reconfirmado en v1.0/db19 Isla Coche. Navegar con `ion-segment.value='total'`+`ionChange` funciona |
| **Retención (`co_type=2`): un `ion-accordion` por documento en el Tab Total** | universal (reconfirma) | Expandir con `grp.value=[values]`+`ionChange`. Contiene Nro. Doc. / Fecha del documento / Monto Doc. / Monto IVA / Monto ISLR / Monto total retenido |
| ⚠ **"Monto Doc." del acordeón de retención muestra el SALDO, no el monto de la factura** | **universal** | En 27081 la UI rotula `Monto Doc. VES: 103.006,4277` = `nu_balance_doc`; el `nu_amount_doc` real es **114.270,2050**. El rótulo induce a error al cotejar contra la nube: **comparar contra `nu_balance_doc`** |
| **Etiqueta de fecha del Tab General varía con `co_type`** | universal | "Fecha Cobro" en `co_type=0/3`, **"Fecha Retención"** en `co_type=2`. No usar la etiqueta como selector estable |
| **Valores del Tab General viven en `.value` / shadowRoot, no en `innerText`** | universal | `innerText` devuelve `"Empresa: | Cliente: | Cliente: |"` con los valores **vacíos**. Leer `ion-input.value` y `ion-select.shadowRoot.querySelector('.select-text').textContent` |
| Abrir un cobro de la lista = **click REAL** en el `ion-item` | universal (reconfirma) | `scrollIntoView({block:'center'})` + esperar + re-leer rect + validar viewport (360×744) + `mouse.click(...,{delay:120})`. Un back devuelve al **menú COBROS**, no a la lista → volver a pulsar BUSCAR |
| Comentario de cobros: máximo **255** (≠ 120 de inventarios) | cliente | Hint "Mín. 0 - Máx. 255 caracteres", contador `2/255`. El `TEXT_COMMENT_MAX_LENGTH=120` de `[alipascua-20260804]` aplica a inventarios, no a cobros |

---


> ✅ consolidado 2026-08-05
## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | **NINGUNO** | — |

🔴 **Constancia explícita:** durante este módulo **no se creó, guardó, envió, modificó ni eliminó ningún
cobro**. No se abrió ningún formulario de cobro nuevo (`COBRO`/`ANTICIPO`/`RETENCIÓN`/`IGTF`/`25% IVA`), no se
pulsó Guardar, Enviar ni el botón de eliminar. Toda la interacción fue **navegación y lectura**: menú COBROS →
BUSCAR → apertura en solo lectura de 3 cobros ya existentes (27085, 27083, 27081) → back a HOME.
Prueba objetiva: la BD local cierra con las **mismas 5 filas** en `collections` y `sqlite_sequence` **sin
avanzar (11)**, y la nube no registró ningún `id_collection > 27092` durante la ventana del módulo.

**Estado final: HOME** ✅
