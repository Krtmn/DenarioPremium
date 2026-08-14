# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260805_133539_smoke-completo` |
| Módulo | VENDEDORES |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Playa | Isla Coche (`denarioislacoche.ddns.net:8081`) |
| Cliente | el_palmar (1ª corrida) |
| Usuario | coUser 1276 / idUser 266 — Dilcia Duarte |
| Resultado | **3 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Registros creados | **ninguno** (módulo de solo lectura) |
| Verificación BD | `BD-N/A` (solo lectura) — se usó la nube solo para **contrastar** los KPIs |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Tile Vendedores → `/vendedores`, `app-vendedores` visible con `<h1>Vendedor</h1>` (confirma `esVendedor=true`) y **2 acordeones de empresa** renderizados. 3,1 s |
| DM-VND-002 | ✅ PASS **pleno** (no N/A) | Expandir con `grp.value=acc.value`+`ionChange`: `[slot=content]` pasa de **0 → 281 px** y muestra 7 KPIs poblados. Idem para el 2º acordeón. Contraer con `grp.value=undefined` → ambos vuelven a `accordion-collapsed`, altura 0 |
| DM-VND-007 | ✅ PASS | Click en `img.fechaAtras` (≈32,31) → `/home` con los 10 tiles. Estado final HOME ✅ |

---

## Qué muestra el módulo con `infoVendedores=false` (autogenerado)

`infoVendedores=false` **confirmado en runtime** leyendo el componente:
`window.ng.getComponent(document.querySelector('app-vendedores')).infoVendedores === false`.
⇒ La información **no** viene del administrativo: la calcula/arma Denario. Es la primera vez en la serie que
se documenta este valor con **2 empresas**, así que va el detalle completo.

### Estructura
- **Lista un solo vendedor**: el usuario logueado (`idUser 266` / `coUser "1276"`). No hay lista de vendedores
  ni selector de otro vendedor. El `<h1>Vendedor</h1>` es el único encabezado.
- **El desglose es por EMPRESA, no por vendedor**: un `ion-accordion` por cada empresa del perfil —
  `CENTRAL EL PALMAR, S.A.` (id 1 / co 1002) y `C.A. DESTILERIA YARACUY` (id 2 / co 1003).
- Cada acordeón pinta **una sola `ion-col` size=12** con 7 `<p>`, cada uno `<span class="titulosBold">Etiqueta:</span> valor`.

### Campos mostrados (los 7, idénticos en ambos acordeones)

| Campo UI | CENTRAL EL PALMAR (1002) | DESTILERIA YARACUY (1003) |
|---|---|---|
| Días Hábiles | 21 | 21 |
| Días Transcurridos | 3 | 3 |
| Días Restantes | 18 | 18 |
| Cartera Clientes | **144** | **144** |
| Clientes Activados | 1 | 1 |
| Clientes Nuevos | 0 | 0 |
| Clientes Nuevos Activados | 0 | 0 |

### De dónde salen los datos
Del array `comp.userInfo` — **2 entradas, una por empresa** (`id:49` → coEnterprise `1002`; `id:50` → `1003`),
ambas con `idUser:266`, `coUser:"1276"`, `mes:"Agosto"`. Se alimenta de la tabla local `user_informations`,
que el sync puebla desde el servidor. La UI mapea 1:1 `userInfo[i]` → acordeón `i`.

---

## 🔎 Contraste con la nube — el "144 / 144" es CORRECTO (no es el bug H1 de globalmp)

Que los dos acordeones muestren **exactamente los mismos números** dispara la sospecha del hallazgo **H1**
abierto en `[gmp-20260730]` (KPIs no segmentados por empresa). **Acá NO aplica — se probó:**

```sql
SELECT c.co_enterprise, count(DISTINCT ctu.id_client)
FROM client_template_user ctu JOIN client c ON c.id_client=ctu.id_client
WHERE ctu.id_user=266 GROUP BY c.co_enterprise;
--  1002 → 144   ·   1003 → 144   ·   total distintos = 288
```

El usuario 266 tiene **144 clientes asignados en CADA empresa** (288 en total). El `144/144` es una
**coincidencia legítima del dato**, no una falta de segmentación. ✅ **`Cartera Clientes` está bien segmentada.**

Prueba adicional de que el servicio **sí** segmenta por empresa: `userInfo[i].planesCuotaEmpresa` (10 unidades
por empresa) trae valores **distintos** por empresa —

| Empresa | Venta Real Mes por unidad (cuota = 0 en todas) |
|---|---|
| 1002 CENTRAL EL PALMAR | USD **133,40** · VES **87.106,54** · SC (Saco) **2** · resto 0 |
| 1003 DESTILERIA YARACUY | todas en **0** |

⇒ El payload por empresa es correcto. La única duda que queda abierta es `Clientes Activados: 1` en 1003,
cuya `ventaRealMes` es 0 en las 10 unidades (ver H-VND-2).

---

## Hallazgos (observaciones — ninguno se eleva a FAIL)

### H-VND-1 · La UI **no pinta** Cuota Mes / Venta Real Mes aunque el modelo trae los datos
El `[slot=content]` cierra con **17 `<!--container-->`** (17 `ng-container` con `*ngIf` que no renderizan),
y el modelo tiene `planesCuotaEmpresa` con **10 unidades pobladas** para 1002 (Venta Real Mes USD 133,40 /
VES 87.106,54 / 2 Sacos). En `[ferrenuestro-20260723]` y `[dm-electronica-20260713]` —mismo
`infoVendedores=false`— la UI **sí** rotulaba `Cuota Mes` y `Venta Real Mes`.
**Por qué no es FAIL:** no se identificó qué condición gobierna el `*ngIf` (podría ser una VG legítima de este
perfil, p. ej. mostrar el bloque solo con cuota/presupuesto cargado — todas las `cuotaMes` acá son 0). Se
reporta para que producto confirme la regla. **Evidencia:** `htmlLen` del contenido = 1.543 chars, 7 `<p>`
renderizados + 17 `ng-container` vacíos.

### H-VND-2 · `Clientes Activados: 1` en DESTILERIA YARACUY con venta 0
La empresa 1003 reporta `clientesActivados: 1` mientras sus 10 líneas de `planesCuotaEmpresa` están en 0.
Lecturas posibles: (a) "activado" cuenta cualquier transacción y en 1003 sí hubo movimiento hoy (4 cobros a
CAYETANO FARIAS E HIJOS, ids 27068/27071/27072/27092); (b) inconsistencia del servicio de métricas.
La definición de "cliente activado" no está documentada ⇒ **no se emite veredicto**, se deja el dato crudo.
Nota simétrica: 1002 reporta `activados: 1` habiendo tenido cobros hoy a **4 clientes distintos**
(RON SANTA TERESA, ALCOHOLES DEL CARIBE, INDUMAC, COCA-COLA FEMSA).

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `infoVendedores` legible en runtime | **universal** | `window.ng.getComponent(document.querySelector('app-vendedores')).infoVendedores` — evita deducir la VG desde la UI. En builds `window.ng=true` es el modo directo de confirmarla |
| `comp.userInfo` = **1 entrada por EMPRESA**, no por vendedor | **universal** | Con N empresas hay N entradas (`id` 49/50 acá), todas con el mismo `idUser`/`coUser`. Es el modelo que alimenta los acordeones 1:1 — usarlo como oráculo en vez de parsear `innerText` |
| Oráculo del bug de segmentación de KPIs: **contrastar contra `client_template_user`, no asumir** | **universal** | KPIs idénticos entre empresas **NO** implican el H1 de globalmp. La query `count(DISTINCT id_client) GROUP BY co_enterprise` decide. En el_palmar dio 144/144 → coincidencia real. Complemento: `planesCuotaEmpresa` sirve de segunda prueba de segmentación (si difiere por empresa, el servicio sí segmenta) |
| `[slot=content]` con `ng-container` vacíos ⇒ contar `<!--container-->` | **universal** | El bloque Cuota/Venta Real Mes existe siempre en el template; si no aparece, quedan `<!--container-->` en el HTML. Contarlos distingue "el template no lo tiene" de "un `*ngIf` lo suprime" |
| Altura expandida con KPIs poblados en v1.0/db19 = **281 px** | cliente | Escala acumulada: 0 colapsado · ~20 px expandido-vacío (latino_cosmetica) · **281 px** (el_palmar, globalmp) · 393 px (ferrenuestro). Confirma: **no usar umbrales altos** |
| Back de `app-vendedores` = `img.fechaAtras` **sin `<a>`** (≈32,31) | universal (reconfirma `[gmp-20260730]`) | `src=iconosatras.png`, `closest('a')===null` ⇒ `h.clickBack` falla. La 2ª `img.fechaAtras` en **x=302** es `vendedoresNuevoBlanco.svg` (decorativa) → discriminar por `src` o por `x<100`. Reconfirmado en v1.0/db19 Isla Coche |
| Expansión por `grp.value=acc.value`+`ionChange` vigente en v1.0/db19 | universal | Los `ion-accordion` no declaran `value` propio: Ionic asigna `ion-accordion-69/70` → leerlo en runtime. `mouse.click` en el header sigue **sin** expandir |
| ⚠ Al entrar a `/vendedores` queda **1 `ion-loading` visible** | cliente | Hacer `dismiss()` de los loadings **visibles** antes de operar (nunca en bucle sobre todos — §quirk 2) |

---


> ✅ consolidado 2026-08-05
## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | **Ninguno.** VENDEDORES es un módulo de solo lectura: no crea, modifica ni elimina datos | — |
