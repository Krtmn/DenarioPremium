# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260730_094753_smoke-completo` |
| Módulo | CLIENTES |
| Cliente / playa | globalmp · **la_tortuga** (`http://denariolatortuga.ddns.net:8081/PremiumWS`) |
| App | `com.kiberno.denarioPremiumPro` — versionApp 1.0 · db_version 19 · `window.ng=true` |
| Dispositivo | Infinix X6728 (HOT 60i) · UUID `da9f78b6e785fffc` |
| Usuario | **YC01** YUSNEIDI CLEMENTE (id_user 307) |
| Empresa usada | **00002 COMERCIALIZADORA GLOBAL M&P** (`idEnterprise=2`) |
| Resultado | **11 PASS · 1 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Estado final | HOME · DOM limpio (0 alerts, 0 modales) |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | Tile Clientes → `app-clientes` con los 3 botones (CLIENTES y≈107 · CLIENTE POTENCIAL y≈176 · BUSCAR CLIENTE POTENCIAL y≈245) |
| DM-CLT-002 | ❌ **FAIL** | Lista renderiza 50 clientes, pero **los saldos están mal**: la etiqueta "Saldo BS" muestra el importe en **USD** y "Saldo USD" muestra ese importe dividido otra vez por la tasa. Ver Hallazgo H-1 |
| DM-CLT-003 | ✅ PASS | `"BIG"` → 2 coincidencias (BIG BANG IMPORT CB10 · INVERSIONES BIG PANDA 888 IB09). Filtro por `na_client` substring, requiere click en el botón search |
| DM-CLT-009 | ✅ PASS | Detalle `BIG BANG IMPORT, C.A (CB10)` — Nombre, Código, RIF J501317623, Saldo BS 338.354,87 / Saldo USD 458,55, Crédito, Condición de pago, Dirección y Coordenada |
| DM-CLT-013 | ✅ PASS | Tab `docVentas` → `.documents-table-panel--ready` con leyenda Documento vigente/vencido y tabla de 18 columnas (Tipo/Nº Doc/Moneda/Días Venc/**Tasa 737,88**/Montos/Saldo/Fechas/Comentario) |
| DM-CLT-016 | ✅ PASS | `clickBack` desde listado → `app-clientes` con los 3 botones |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` (no salta al HOME principal) |
| DM-CLT-019 | ✅ PASS | Form potencial: 9 `ion-input` vacíos (8 `ng-invalid` + `naWebSite` `ng-valid`), `idEnterprise` `ng-invalid`, Guardar/Enviar `disabled=true` |
| DM-CLT-021 | ✅ PASS | 8 obligatorios + `idEnterprise=2` (number) → los 9 controles `ng-valid`, Guardar/Enviar `disabled=false`. `naWebSite` quedó vacío ⇒ **opcional reconfirmado** |
| DM-CLT-024 | ✅ PASS | Alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!" [OK] → aparece en BUSCAR CLIENTE POTENCIAL con **Nro. Ref: 0 · Estatus: Guardado** y trash visible. BD local `id_client=0`, `st_potential_client=0` → **BD-SAVED** |
| DM-CLT-026 | ✅ PASS | 3 alertas → **"Cliente potencial nro. 184 creado exitosamente"**. Estatus pasa a **Enviado**, trash desaparece. BD local `id_client=184`, `st=2`, colas vacías. POST `potentialclientservice/potentialclient` capturado (1 solo, sin duplicado) |
| DM-CLT-031 | ✅ PASS | Trash en el Guardado → **borrado directo sin confirmación previa** → "Denario Clientes / ¡Cliente Potencial se borro con exito!" [OK]; desaparece de la lista **y de `potential_clients`** |

---

## Registros creados en sistema

| Ref | epoch (`co_client`) | Detalle | Empresa | Estado |
|-----|---------------------|---------|---------|--------|
| **184** | `1785421775750.0` | `Test-CLT-SMOKE-103002` · RIF J987654321 · Tel 04121234567 · vendedor YC01 / YUSNEIDI CLEMENTE · 2026-07-30 10:31:44 | 00002 COMERCIALIZADORA GLOBAL M&P | **Enviado** |
| — | `1785421985886.0` | `Test-CLT-DEL-103308` — creado a propósito para DM-CLT-031 | 00002 | **Borrado** (ya no existe) |

**Guardados pendientes de envío manual:** ninguno.

Manifiesto: 1 línea en `_bd-manifest.jsonl` (Ref 184). Payload: 1 línea en `_payloads.jsonl`.

---

## Verificación BD

- **Nube (`global_mp`): `BD-N/A`** — sin GRANT (decisión de QA: correr sin ella). La llegada a la nube la prueba la capa web por **Nro. Ref 184** y por `co_client=1785421775750.0`.
- **Local del device (vía `window.sqlitePlugin`, tabla `potential_clients`):**

| Momento | `id_client` | `st_potential_client` | `pending_transactions` | `failed_transactions` | Marca |
|---------|-------------|------------------------|------------------------|------------------------|-------|
| Baseline del módulo | — | — | 0 | 0 | — |
| Tras Guardar (DM-CLT-024) | 0 | 0 | 0 | 0 | `BD-SAVED` |
| Tras Enviar (DM-CLT-026) | **184** | **2** | 0 | 0 | salió de la cola ✅ |
| Tras Borrar (DM-CLT-031) | fila eliminada | — | 0 | 0 | `BD-OK` |

**Conclusión guardado→enviado:** lo guardado se envió. `id_client` local = **Nro. Ref de la UI (184)** — reconfirma la correlación `[prc-2606][ferrenuestro-20260723]`. El payload capturado coincide campo a campo con lo tipeado y con la fila local (`coEnterprise "00002"`, `idUser 307`, `coUser "YC01"`).

⚠ `st_potential_client=2` para Enviados en la tabla **local** — reconfirma `[latino_cosmetica-20260729]` y sigue contrastando con la nota `[prc-2606]` (`=1` en servidor). Dominio distinto local↔nube: **a dirimir en la capa web**.

**Oráculo de persistencia §9 (round-trip Guardar → reabrir):** ✅ los 9 campos y `idEnterprise=2` se releyeron **idénticos** al reabrir el Guardado. Sin divergencias silenciosas.

---

## Hallazgos

### H-1 · ❌ FAIL — El LISTADO de clientes muestra saldos con etiqueta cruzada y una conversión de más

**Caso:** DM-CLT-002 · **Severidad: alta** (dato de negocio que el vendedor lee en campo).

En el listado de clientes, lo rotulado **"Saldo BS"** es en realidad el saldo en **USD**, y lo rotulado **"Saldo USD"** es ese mismo importe **dividido otra vez** por la tasa — un número sin significado contable. El **detalle** del cliente sí es correcto.

Confirmado en 2 clientes, con la tasa 737,88 leída del propio tab Doc. de Venta:

| Cliente | Lista (lo que ve el vendedor) | Detalle (correcto) | Comprobación |
|---------|-------------------------------|--------------------|--------------|
| ABASTO EL SITIO DSG (AS04) | Saldo USD **2,84** · Saldo BS **2.096,23** | Saldo USD **2.096,23** · Saldo BS **1.546.766,19** | 1.546.766,19 / 2.096,23 = 737,88 ✓ · 2.096,23 / 737,88 = 2,84 ✓ |
| BIG BANG IMPORT (CB10) | Saldo USD **0,62** · Saldo BS **458,55** | Saldo USD **458,55** · Saldo BS **338.354,87** | 338.354,87 / 458,55 = 737,88 ✓ · 458,55 / 737,88 = 0,62 ✓ |

**Cuál es el correcto:** el detalle. Triangulado contra el tab Doc. de Venta de BIG BANG IMPORT, donde un **solo** documento ya arrastra un saldo de 22,24 USD (y hay varios más) — un saldo total de 0,62 USD es imposible; 458,55 USD es coherente.

**Impacto:** un vendedor que consulta la cartera desde el listado ve la deuda del cliente **subestimada ~738×** en la columna USD, y el importe en USD presentado como si fueran bolívares. Puede habilitar ventas a crédito a clientes que no deberían tenerlas.

**Reproducción manual (~2 min):** Clientes → CLIENTES → anotar "Saldo USD" y "Saldo BS" de cualquier cliente con saldo ≠ 0 → abrir ese cliente → comparar con los saldos del detalle. Los pares aparecen corridos un lugar.

### H-2 · ⓘ Hallazgo menor — la lista de potenciales no refresca tras "Guardar y salir"

Al salir del formulario por el dirty-guard con **"Guardar y salir"**, la app deja al usuario en la lista de clientes potenciales, pero **el registro recién guardado no aparece** en ella. Sí persistió: quedó en `potential_clients` (rowid 3, `id_client=0`) y se hizo visible al salir de la lista y volver a entrar. Es un fallo de refresco de vista, no de persistencia — mismo patrón que el defecto conocido de DEPÓSITOS DM-DEP-018/019/020. No bloquea, pero induce a pensar que el guardado se perdió. **No se marcó FAIL** porque la ruta normal (Guardar → OK → navegar) sí lista correctamente (DM-CLT-024 PASS).

---

## Datos de prueba — desactualizados en el YAML

| Dato del YAML | Estado real 2026-07-30 |
|---------------|------------------------|
| `cliente_busqueda: "BIG"` | ✅ sigue sirviendo, pero ahora devuelve **2** coincidencias (antes 1) |
| `cliente_detalle: "BIG MARKET 22, C.A"` (BM17) | ❌ **ya no está sincronizado en el device** — reemplazar por `BIG BANG IMPORT, C.A` (CB10) o `ABASTO EL SITIO DSG, C.A.` (AS04) |
| `potencial_enviado_ref: 141` | correlativo avanzó a **184** |
| `vgs.signatureClient` (no registrado) | **no pide firma** — Guardar y Enviar sin firma |
| `vgs.multiCurrency: false` | la UI **sí** muestra doble moneda en lista y detalle (BS + USD) |

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `idEnterprise` **multi-empresa activo** con `enterpriseEnabled=true` | cliente (globalmp) | 2 opciones `value` **numérico** (1=HC TRADING MARKET 20 · 2=COMERCIALIZADORA DE); `sel.disabled=false` ⇒ aplica la regla `sel.value=2` (number) + `ionChange`. Confirma la fila "value numérico" y **no** la variante `select-disabled` de Isla Coche |
| Botones home de clientes: coords estables | universal | CLIENTES (180,107) · CLIENTE POTENCIAL (180,176) · BUSCAR CLIENTE POTENCIAL (180,245); Guardar (267,32) · Enviar (326,32) |
| Dirty-guard "Guardar y salir" **deja en la lista de potenciales, no en el home de clientes** | universal | Y la lista **no refresca** (ver H-2). Reabrir la lista para verla |
| `potential_clients` local: `has_attachments` llega como **string** `"false"` | universal | Consistente con el quirk de booleanos-como-string `[gmp-20260730]` |
| Lista de clientes: saldos con etiqueta cruzada + doble conversión | **a determinar** (1ª detección) | Ver H-1 — verificar en la próxima playa si es del build v6.6.18/La Tortuga o de este cliente |

---

*Agente CLIENTES · 12/12 casos ejecutados · 0 cuelgues de CDP · 0 reintentos por selector.*
