# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `smoke_difranca_20260810_main` |
| Módulo | CLIENTES |
| App | `com.kiberno.denarioPremiumPro` — app v1.0 / db19 · rama **main**, commit `99b138fa` |
| Playa / tenant | EL YAQUE · **difranca** |
| Empresa de la corrida | **DDHP_A12** (`id_enterprise=2`, `*DISTRIBUIDORA DIAZ`) |
| Vendedor QA | `co_user='206'` / `id_user=275` |
| Runtime | `window.ng=TRUE` · `window.sqlitePlugin` disponible · viewport 360×744 |
| Estado inicial / final | HOME → **HOME** ✅ |
| Resultado | **11 PASS · 1 FAIL · 0 BLOCKED · 0 N/A** |

> ⚠ La sección `go_no_go_tag20` del YAML de difranca **no aplica** a esta corrida (es historia del 07/08 bajo tag 20).
> Esta corrida es cacería de defectos nuevos en `main` antes del tag 21.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` con los 3 botones: CLIENTES (180,107) · CLIENTE POTENCIAL (180,176) · BUSCAR CLIENTE POTENCIAL (180,245) |
| DM-CLT-002 | ✅ PASS | 50 ítems con **Saldo BSD** y **Saldo US$**. `multiCurrency=true` real. Ratio BSD/US$ = **752,09** = la tasa ⇒ **no** reproduce `CLT-LISTA-SALDOS-CRUZADOS` |
| DM-CLT-003 | ✅ PASS | `JAKE` → filtra a 1 (MULTIDISTRIBUIDORA JAKE, CAR755). Búsqueda = focus + `keyboard.type` + click `ion-icon[name="search-circle-sharp"]` (317,94) |
| DM-CLT-009 | ❌ **FAIL** | Los campos exigidos por el caso **sí** están (Nombre, Código, RIF, Saldos BSD/US$). **Pero el detalle exhibe un Crédito Disponible incorrecto** — ver H-1. Lista y detalle coinciden; `Σ allDocuments.nuBalance` (149 docs) = `saldoFuerte` = 62.523,87 exacto |
| DM-CLT-013 | ✅ PASS | Tab `docVentas` renderiza `.documents-table-panel--ready`, 149 filas (`documentSalesTotalRows`), 18 columnas, leyendas **Vigente / Vencido / A favor** presentes |
| DM-CLT-016 | ✅ PASS | `clickBack` desde listado → `app-clientes` con los 3 botones (no salta a HOME) |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` (no salta al home principal) |
| DM-CLT-019 | ✅ PASS | 9 `ion-input` (8 `ng-invalid` + `naWebSite` opcional `ng-valid`) + `ion-select[formcontrolname="idEnterprise"]`; **Guardar y Enviar `disabled=true`** |
| DM-CLT-021 | ✅ PASS | Par medido: 8 inputs llenos + select vacío ⇒ ambos botones **siguen** `disabled=true`; tras `s.value=2` (**number**) + `ionChange` ⇒ ambos `disabled=false` en el mismo tick, shadowRoot rotula `*DISTRIBUIDORA DIAZ` |
| DM-CLT-024 | ✅ PASS | Alert **`Denario Cliente` / "¡Cliente Potencial Guardado con exito!"** botón `[OK]`. `Test-CLT-SMOKE-124828` aparece en BUSCAR con **Estatus: Guardado**, Nro. Ref: 0, con trash |
| DM-CLT-026 | ✅ PASS · **BD-OK** | 3 alertas → **"Cliente potencial nro. 62 creado exitosamente"**. Lista pasa a **Estatus: Enviado**, Nro. Ref: 62, sin trash |
| DM-CLT-031 | ✅ PASS | Trash en el Guardado (318,227) → **borrado directo sin confirmación previa**, alert `Denario Clientes` / "¡Cliente Potencial se borro con exito!" `[OK]`. Desaparece de la lista **y** de `potential_clients` local |

**Etiquetas de alert reales medidas** (leídas, no predichas): guardado `[OK]` · envío paso 1 `[Cancelar, Aceptar]` → pasos 2-3 `[OK]` · borrado `[OK]`. Idénticas a `[difranca-20260807]` y `[el_palmar-20260805]`.

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **62** | `Test-CLT-SMOKE-124828` · RIF J987654321 · empresa DDHP_A12 (`id_enterprise=2`) | **Enviado** (persiste en nube) |
| — | `Test-CLT-DEL-125100` · RIF J987654322 · empresa DDHP_A12 | Guardado → **borrado** en DM-CLT-031 (no llegó a nube, correcto) |

---

## Verificación BD (RUNTIME §10)

**Nube** (`node automation/db/query.js difranca …`), tabla `potential_client`:

| Campo | Valor |
|---|---|
| `id_client` | **62** = Nro. Ref de la UI ✅ (correlación reconfirmada) |
| `na_client` | `Test-CLT-SMOKE-124828` ✅ match exacto con lo tipeado |
| `nu_rif` / `nu_phone` | `J987654321` / `04121234567` ✅ |
| `st_potential_client` | **1** (nube) |
| `co_enterprise` / `id_enterprise` | `DDHP_A12` / `2` ✅ la empresa elegida sobrevive el round-trip |
| `co_user` | `206` ✅ |
| `coordenada` | `11.0490653,-63.8650063` (presente pese a `userCanSaveGPS=false` — alcance por módulo ya documentado, **no es hallazgo**) |
| `nu_attachments` | `0` (el form no ofrece adjuntos) |

**Local** (`sqlitePlugin`, tabla PLURAL `potential_clients`): `id_client=62`, `st_potential_client=**2**`.
Reconfirma que **local y nube son dominios distintos** para `st_potential_client` (1 en nube / 2 en local) — **no es mismatch**.

**Colas:** `pending_transactions WHERE type='potentialClient'` = **0** · `failed_transactions` = **0** ⇒ salió de la cola.

**Conclusión guardado→enviado: `BD-OK`.** Lo guardado se envió, íntegro y con la empresa correcta.

**Baseline `client`:** el baseline registra 4.558 filas; hoy la tabla trae **4.597**. El incremento **no es de esta corrida** — CLIENTES solo escribe en `potential_client`, no en el maestro `client`. Coherente con "el tenant está vivo".
**Descuento global:** `qu_discount` = `0.0000` en **0 de 4.597** clientes ✅ y el módulo **no muestra ninguna línea de descuento** en lista ni en detalle. Nada que contradiga el dato.

---

## Hallazgos

### 🔴 H-1 · `CLT-CREDITO-DISPONIBLE-MONEDA-CRUZADA` — el Crédito Disponible resta la deuda en la moneda equivocada (deuda subestimada 752×)

**Severidad: alta** (financiero y operacional, visible al vendedor). **Capa: móvil. Módulo: clientes. Detectado en: `main`.**
**Defecto NUEVO** — chequeado contra `automation/defectos-conocidos.yaml`: no corresponde a `CLT-CREDITO-MULTIPLICADO` ni a `CLT-LISTA-SALDOS-CRUZADOS` (ver "Por qué no es un defecto ya conocido").

**Qué hace la app.** En `app-client-detail`, el Crédito Disponible se calcula restando el saldo **en US$** a un crédito expresado **en BSD**, y después convirtiendo ese resultado a US$:

```
disponible_BSD = credito_BSD  −  saldoFuerte(US$)      ← resta US$ contra un monto en BSD
disponible_US$ = disponible_BSD / tasa
```

Lo correcto sería restar `saldoLocal` (el saldo en BSD) al crédito en BSD, o bien `saldoFuerte` al crédito en US$.

**Evidencia — reproducido en 2 clientes, exacto al centavo** (tasa 752,09 leída del tab Doc. de Venta):

| | **CAR755** MULTIDISTRIBUIDORA JAKE | **CAR064** MAXICENTER MIRANDA |
|---|---|---|
| Saldo BSD (UI) | 47.023.577,39 | 3.041.948,34 |
| Saldo US$ (UI) | 62.523,87 | 4.044,66 |
| Crédito BSD (UI) | 2.262.570.408,35 | 367.667.695,12 |
| Crédito Disp. BSD (UI) | 2.262.507.884,48 | 367.663.650,46 |
| **Crédito BSD − Disp. BSD** | **62.523,87** ← es el Saldo **US$** | **4.044,66** ← es el Saldo **US$** |
| *debería ser* | *47.023.577,39* | *3.041.948,34* |
| Crédito US$ (UI) | 3.008.377,20 | 488.861,30 |
| Crédito Disp. US$ (UI) | 3.008.294,07 | 488.855,92 |
| **Crédito US$ − Disp. US$** | **83,13** = 62.523,87 / 752,09 | **5,38** = 4.044,66 / 752,09 |
| *Disponible correcto US$* | *2.945.853,33* | *484.816,64* |
| **Crédito fantasma** | **62.440,74 US$** | **4.039,28 US$** |

Verificación cruzada de la fórmula: `367.663.650,46 / 752,09 = 488.855,92` ✅ y `2.262.507.884,48 / 752,09 = 3.008.294,07` ✅ — la conversión arrastra el error, no lo introduce.

**El límite de crédito NO está mal** (eso descarta `CLT-CREDITO-MULTIPLICADO`). Cotejo contra nube:

| Cliente | `client.nu_credit_limit` (nube) | Crédito US$ (UI) |
|---|---|---|
| CAR755 / DDHP_A12 | 3.008.377,20 | **3.008.377,20** ✅ exacto |
| CAR064 / DDHP_A12 | 488.861,30 | **488.861,30** ✅ exacto |

**El dato no viene mal del servidor: lo calcula la app.** La tabla `client` de la nube solo tiene `nu_balance`, `qu_discount` y `nu_credit_limit` — **no existe columna de crédito disponible**. El modelo Angular (`ng.getComponent(app-client-detail)`) tampoco recibe un `nuAvailableCredit`: expone `availableCreditConversion` ya calculado.

**Por qué no es un defecto ya conocido:**
- `CLT-CREDITO-MULTIPLICADO` es sobre el **límite** inflado por la tasa. Acá el límite coincide **exacto** con BD en los 2 clientes ⇒ no reproduce (consistente con lo medido el 07/08).
- Esa misma ficha dice textualmente: *"la resta `Crédito USD − Crédito Disponible USD` **SÍ da el saldo correcto** (2.096,23)"*. En `main` **ya no lo da** ⇒ es una **regresión** respecto del comportamiento observado en globalmp / v6.6.18, y afecta justamente la resta que allí servía como evidencia de control.
- `CLT-LISTA-SALDOS-CRUZADOS` es del **listado** y acá el listado está correcto (ratio = tasa, lista = detalle).

**Impacto operacional.** El vendedor decide si le sigue vendiendo a un cliente mirando el Crédito Disponible. CAR755 tiene **120 documentos, 100 % vencidos**, y la app le muestra prácticamente el límite completo como disponible. En estos dos clientes el límite es muy grande y el error relativo queda diluido, **pero la fórmula está mal en términos absolutos**: en un cliente con límite ajustado el efecto es severo — con límite 5.000 US$ y deuda 4.000 US$, la app mostraría **4.994,68** disponibles en lugar de **1.000**. Conviene verificarlo en un cliente de límite chico antes de dimensionar la severidad final.

**Reproducción manual (sin herramientas):** Clientes → CLIENTES → abrir cualquier cliente con saldo → en el tab Detalle restar `Crédito US$ − Crédito Disp. US$` y comparar contra `Saldo US$`. Deberían ser iguales; hoy la resta da el saldo **dividido por la tasa**.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **CLIENTES tiene DOS selectores de empresa distintos, no uno** | universal (amplía la tabla de variantes por módulo) | En `app-client-list` (la LISTA) hay un `ion-select` **SIN `formcontrolname`**, `disabled=false`, `ng-valid`, **preseleccionado** y con el **OBJETO empresa completo** como `value` (`{idEnterprise:2, coEnterprise:"DDHP_A12", lbEnterprise:"*DISTRIBUIDORA DIAZ", coCurrencyDefault:"US$", prioritySelection:0, enterpriseDefault:"true", …}`). En el FORM POTENCIAL, en cambio, es `formcontrolname="idEnterprise"`, **vacío, `ng-invalid` y obligatorio**, con `value` **numérico**. ⇒ La tabla de variantes de `_comunes.md` decía "CLIENTES = idEnterprise/number/obligatorio"; **hay que desdoblar la fila en LISTA y FORM**. Aplicar `s.value=<number>` al de la lista rompería el control. |
| **Guardar/Enviar NO viven dentro de `app-client-new-potential-client`** | universal | `root.querySelector('ion-button.imagenGuardar')` devuelve **`null`** — los botones están en el header fijo, fuera del root del componente. Hay que anclarlos con `document.querySelector`. Costó una llamada (`TypeError: Cannot read properties of null (reading 'disabled')`). Hermano del quirk de `querySelectorAll('ion-input')` que arrastra `app-login`: **anclar al componente sirve para los inputs, pero rompe para los botones del header**. |
| ✅ **Oráculo barato de crédito, ya formateado** | universal | `ng.getComponent(document.querySelector('app-client-detail'))` expone **`nuCreditLimitConversion`** y **`availableCreditConversion`** como strings ya formateados (`"3.008.377,20"` / `"3.008.294,07"`), más `localCurrency`/`hardCurrency`/`decimales`. Evita parsear el `innerText`. Complementa el oráculo `allDocuments`/`saldoFuerte`/`saldoLocal` de `[difranca-20260807]`. **Es lo que destapó H-1 en una sola llamada.** |
| ⚠ **`client.nuCreditLimit` del modelo NO es `nu_credit_limit` de la nube: viene ×tasa** | universal | Modelo `2.262.570.408,348` vs nube `3.008.377,20` (= ×752,09). El modelo trae el crédito **en BSD**; `nuCreditLimitConversion` lo devuelve a US$. **Cotejar contra BD usando `nuCreditLimitConversion`, no `client.nuCreditLimit`**, o se levanta un falso `CLT-CREDITO-MULTIPLICADO`. |
| ⚠ **`sqlite_sequence` NO tiene fila para `potential_clients`** | universal | `SELECT seq FROM sqlite_sequence WHERE name='potential_clients'` devuelve **`[]`** (la tabla no es AUTOINCREMENT) ⇒ el oráculo de idempotencia por `seq` de `[difranca-20260807]` **no aplica en CLIENTES**. No gastar intentos ahí. |
| ⚠ **`__qaH.getPayloadData()` capturó el POST con `data` VACÍO** | cliente / corrida | El POST `potentialclientservice/potentialclient` se capturó **1 sola vez** (sin duplicados ✅, la guarda funciona) pero `data` llegó `{}`. La verificación se resolvió por **nube + BD local**, que fueron concluyentes. Revisar el hook del agente LOGIN de esta corrida: registra la `url` pero no el body. |
| 4.ª confirmación: `idEnterprise` **editable + vacío + obligatorio** en el FORM potencial | universal | `disabled=false`, `value=null`, `ng-invalid`, 3 opciones `value` **number** (2/3/4) rotuladas truncadas a 19 chars (`lb_enterprise`). Par medido antes/después. Tras el_palmar (2 empresas) y difranca 07/08 (3 empresas), **la variante la fija el FORMULARIO**. |
| ✅ La lista de potenciales **SÍ refresca** tras guardar / enviar / borrar | cliente | No reproduce el defecto de render de `[gmp-20260730]`. Reconfirma 07/08. |
| ✅ Round-trip §9 perfecto en el form potencial | cliente | Reapertura por la zona izquierda (**129,228** = `rect.x + 0.35·w`): vuelven los 9 campos **y** la empresa como `2` (number), con Guardar/Enviar habilitados. |

---

## Notas de disciplina

- **0 BLOCKED**: ningún selector requirió más de 2 intentos. El único reintento fue por un error propio de anclaje (Guardar/Enviar en el header), no por la app.
- Todas las etiquetas de alert se **leyeron** del DOM y se clickearon por **igualdad exacta case-insensitive** recorriendo `['Aceptar','OK','Eliminar']` — 0 reintentos en los ~7 alerts del módulo.
- Credenciales: no se hizo login ni se leyó `secrets/`. Ningún valor sensible en este reporte.
- Dispositivo devuelto a **HOME** con 0 alerts y 0 modales residuales.
