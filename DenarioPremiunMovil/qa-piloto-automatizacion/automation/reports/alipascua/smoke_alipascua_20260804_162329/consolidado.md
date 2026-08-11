# Smoke Test Consolidado — Denario Premium Móvil · ALIPASCUA
## Corrida PARCIAL (7 de 10 módulos) · Android USB · Playwright MCP + CDP · capa web activa

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-08-04 (cierre 2026-08-05) |
| **RUN_ID** | `20260804_162329_smoke-completo` |
| **Cliente** | alipascua — ALIPASCUA, C.A. (`ALIP_BSD`, id_enterprise 2) |
| **Playa** | **El Yaque** al momento de la corrida · ⚠ el cliente fue **migrado de playa** el 05/08 |
| **Dispositivo** | 14678405BR003855 (Infinix X6728, Android 15) |
| **App** | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 |
| **Usuario** | `***` — coUser 002 / idUser 468 ("Wilmen Lara" en la web) |
| **Tasa del día** | 746,6297 |
| **Resultado global** | **70 PASS · 2 FAIL · 0 SKIP · 36 N/A · 0 BLOCKED** de 108 casos ejecutados (29 no ejecutados) |

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP | N/A | BLK | Estado |
|--------|-------|------|------|------|-----|-----|--------|
| Login | 6 | 5 | 1 | 0 | 0 | 0 | ⚠️ |
| Clientes | 12 | 12 | 0 | 0 | 0 | 0 | ✅ |
| Pedidos | 14 | 14 | 0 | 0 | 0 | 0 | ✅ |
| Cobros | 34 | 0 | 0 | 0 | 34 | 0 | 🔒 solo lectura (por decisión de QA) |
| Devoluciones | 14 | 13 | 0 | 0 | 1 | 0 | ✅ |
| Inventarios | 16 | 15 | 0 | 0 | 1 | 0 | ✅ |
| Depósitos | 12 | 11 | 1 | 0 | 0 | 0 | ⚠️ |
| **Visitas** | 16 | — | — | — | — | — | ⛔ **no ejecutado** (migración de playa) |
| **Productos** | 10 | — | — | — | — | — | ⛔ **no ejecutado** |
| **Vendedores** | 3 | — | — | — | — | — | ⛔ **no ejecutado** |
| **TOTAL ejecutado** | **108** | **70** | **2** | **0** | **36** | **0** | parcial |

> **Corrida PARCIAL** → según la guarda de completitud del orquestador, **no se lanza el Agente 11** de
> consolidación de memoria. Los patrones nuevos quedan en los reportes de módulo y se consolidan en la
> próxima corrida completa (o a mano con `prompt-consolidar-hallazgos.md`).

**Motivo del corte:** el cliente **alipascua fue migrado de playa** el 2026-08-05. El host
`denarioelyaque.ddns.net` pasó a servir otro tenant (DIAZ HERNANDEZ / DIFRANCA / DH VITAL), sin el vendedor
468 y con refs de otro orden de magnitud. Seguir habría significado **escribir registros de prueba en la
producción de otro cliente**.

## FAIL

| ID | Módulo | Descripción | Severidad propuesta |
|----|--------|-------------|---------------------|
| **DM-DEP-017** | Depósitos | El depósito Enviado **nunca sale del dispositivo**: 0 POST a `depositservice/deposit`, queda en `pending_transactions` con `st_delivery=2` e `id_deposit=0`. Confirmado ~24 h después: la nube sigue con 1 sola fila (la preexistente). **Inmoviliza el cobro vinculado** y no tiene remedio desde la UI | **S1/S2** |
| **DM-LOG-003** | Login | Con contraseña incorrecta la app **no muestra alert ni feedback**. No entra a Home (correcto), pero deja al usuario sin saber que falló | **S2** |

## Hallazgos de dinero (capa BD + web)

| ID | Dónde | Descripción | ¿Visible al usuario? |
|---|---|---|---|
| **H1** | cobro 39236, hija FACT46964 | **Conversión INVERTIDA**: `755,00 × 746,6297 = 563.705,4235` donde corresponde `755,00 / 746,6297 = 1,0112`. La fila hermana del mismo cobro divide bien ⇒ es bug, no criterio. Error de escala ~557.400× | 🔴 **SÍ** — columna `Descuento conversión` del detalle web |
| **H2** | cobro 39236 | Descuento de 755,00 en la hija que **no sube a la cabecera** (`nu_amount_discount_total`=0, `has_discount`=false, tabla de descuentos vacía). La web se contradice: pie `0,0000 US$` vs fila `563.705,4235 US$` | 🔴 SÍ |
| **H3** | cobros 39238 y 39239 | **Defecto que QA reportaba:** se puede ENVIAR una retención con 2 documentos y solo uno configurado. El documento sin retención persiste `nu_amount_paid` **espurio** (su saldo íntegro: 237,82 US$ y 1.092.991,22 BSD). `missing_retention`=false no lo delata | 🟠 SÍ (renglón de 1M en un cobro de 1.800) |
| **H4** | cobro 39238, hija 39607 | `nu_amount_paid_conversion` = 237,8200 **sin convertir** (debería ser 177.563,4753). La hermana 39609 sí convierte bien | 🟡 No (persistencia) |
| **H6** | cobro 39236 | Diferencia de 5.936,5247 BSD registrada **sin `id_difference_code`** en los 3 pagos | 🟡 A confirmar con QA |

### 39236 — el delta NO era un documento editado

La premisa de la corrida (`total 185.000,00 ≠ final 179.063,4753 ⇒ documento editado`) quedó **desmentida**:

```
Σ métodos de pago       185.000,0000  = nu_amount_total           (3 pagos: 170.000 tr + 5.000 ef + 10.000 de)
Σ aplicado a documentos 179.063,4753  = nu_amount_final           (FACT46964 parcial 1.500 + FACT46965 completo)
                        ─────────────
delta                     5.936,5247  = nu_difference             ✅ campo a campo
```

Es **sobrante de pago no aplicado**. `da_created` = `da_update` **al milisegundo** en cabecera y en las 2
hijas, `co_operation='I'`, y los documentos origen en `document_sale` sin tocar ⇒ **nadie lo editó después
del envío**.

## Defectos conocidos re-verificados

| Defecto | Veredicto en este build (El Yaque v1.0) |
|---|---|
| `COB-RET-TOTAL-CERO` (web, cobros retención muestran `Total Monto a pagar: 0,00`) | 🔴 **REPRODUCE** ⇒ este build **no** trae el fix del tag 21. Caso de regresión DW-COB-C09 |
| `PED-IVA-CONV-DIV-CANTIDAD` (web, IVA de línea convertido ÷ cantidad) | ✅ **NO reproduce** — ratio conv/US$ = tasa exacta en las 4 celdas. ⚠ Salvedad: el pedido tenía **IVA 0**; re-probar con IVA ≠ 0 |
| `DM-DEP-018/019/020` (lista BUSCAR no renderiza tras guardar) | ✅ **NO reprodujo** en 3 accesos consecutivos — sigue siendo intermitente |
| `DM-INV-026` (form Guardado abre en tab General) | conocido, no re-marcado |

## Verificación de VGs contra la UI (encargo de QA)

| VG | Perfil decía | **Verificado en UI** | Acción |
|---|---|---|---|
| `userCanSelectProductDiscount` | `false` (dump cliente 2026-02-24) | 🔴 **`true`** — el `ion-select` "Descuento" por producto existe, habilitado (5/7/8/10/3), mueve el total (US$ 3,1453 → 2,9797) y persiste en BD (`order_detail.id_discount=9547`) | **YAML corregido** — gana el global 2026-02-20 |
| `validateWarehouses` | `false` | ✅ **`false` confirmado** — 999 unidades sobre inventario de 30 se aceptaron sin alerta ni bloqueo | perfil correcto |
| `userCanChangeWarehouse` | `false` | ✅ confirmado — el select "Almacén" llega `disabled` | — |
| `requiredComment` / `longitudComentario:200` | globales | ⚠ **NO aplican a inventarios ni a depósitos** (comentario vacío y Guardar/Enviar habilitados). El tope real lo fija una constante de producto (**120** en esta APK, no 200). Gobiernan cobros/pedidos | corregir alcance en el perfil |
| `esVendedor` / `enterpriseEnabled=false` | — | ✅ 1 sola empresa, select `disabled` con ALIPASCUA preasignada | — |
| `userMustActivateGPS` | `true` | ✅ GPS activo toda la corrida; coordenadas reales persistidas en los 5 módulos transaccionales. **0 BLOCKED por GPS** | — |

## Registros enviados al sistema (persisten)

| Módulo | Ref | Detalle | Estado | BD | Web |
|--------|-----|---------|--------|----|-----|
| Clientes | **1** | `Test-CLT-SMOKE-163935` · RIF J987654321 · epoch `1785875941285.0` | Enviado | BD-OK (16/16 campos) | WEB-OK (14/14) |
| Pedidos | **4309** | V28556138 · CEREZA ×2 · desc. 5 % prod + 7 % global · **US$ 3,1453** | Enviado | BD-OK | WEB-OK |
| Devoluciones | **73** | V28556138 · PostVenta · ACEITE OLIVA ×2 · factura 46986 | Enviada | BD-OK | WEB-OK |
| Inventarios | **5** | V28556138 · CLORO BLANCURA ×12 UNIDAD · exh | Enviado | BD-OK | ⛔ WEB-N/A (migración) |
| Depósitos | **0** | Banco Provincial · `DEP-QA-0804` · 5.000,00 BSD · cobro 39236 | 🔴 **Por Enviar — nunca llegó** | BD-QUEUED | WEB-N/A |

**Pendientes de envío manual:** el depósito `DEP-QA-0804` **no es recuperable desde la UI** (el ítem "Por
Enviar" no ofrece botones ni trash). Requiere intervención de desarrollo.

## Cobros verificados (solo lectura — no se creó ninguno)

| Ref | co_type | Monto | Marca BD | Marca WEB | Estatus que muestra la web |
|---|---|---|---|---|---|
| 39236 | 0 normal | 185.000,00 BSD → final 179.063,4753 | BD-FIELD-MISMATCH | **WEB-CALC-MISMATCH** | "Por aprobar" |
| 39237 | 1 anticipo | 3.000,00 BSD | BD-FIELD-OK | WEB-OK | "Por aprobar" |
| 39238 | 2 retención | 1.800,00 US$ | BD-FIELD-MISMATCH | WEB-OK | "Por aprobar" |
| 39239 | 2 retención | 1.800,00 BSD | BD-INFO | WEB-OK | "Por aprobar" |

> **39239** lo creó la QA a propósito para reportar H3 (retención con 2 documentos y uno sin configurar).
> No es un registro huérfano: es la **2ª muestra independiente** de ese defecto.
>
> ⚠ Los 4 muestran **"Por aprobar"** en la web aunque `st_collection=3` y el catálogo `statuses` de alipascua
> dice `3='env'='Enviado'`. **El mapeo de `st_*` es por playa** — confirmado el caveat de RUNTIME §10.

## Capa WEB — verificación cruzada móvil → web

Playa: **El Yaque** (`denarioelyaque.ddns.net:8080`) · Empresa: **ALIPASCUA, C.A.** · Modo **READ-ONLY**

**Resumen:** 9 registros cotejados — **6 WEB-OK · 1 WEB-CALC-MISMATCH · 2 WEB-N/A** · 0 MISSING · 0 FIELD-MISMATCH.

⚠ **Cobertura faltante:** inventarios Ref 5 es el único `BD-OK` sin cotejo web, por la migración de playa.
Queda **abierto** verificar si la web renderiza un lote/vencimiento espurio (el manifiesto trae
`da_expiration:"2026-08-04"` con `nu_batch:""`).

## Observaciones generales

1. **Sync a la nube: INMEDIATA** para clientes, pedidos, devoluciones e inventarios (contradice el patrón de
   sync diferida de otros clientes). El **único** tipo que no se despachó es `deposit`.
2. **Cola de salida con un pendiente zombi:** un `clientStock` (`co_transaction 1785872185773.0`) previo a la
   corrida **ya está en la nube** (`id_client_stock=4`) y aun así se re-postea sin fin — **56 POST idénticos**
   capturados en ~2,7 h. No bloquea la cola (los demás envíos pasan por encima) y el servidor deduplica, pero
   **el pendiente nunca cierra**. Mismo estado `st_delivery=2` que el depósito atascado.
3. **Etiquetas de `ion-alert` MIXTAS en el mismo build:** informativos de envío usan **"OK"**, pero guardado y
   borrado usan **"Aceptar"**. Cualquier helper debe probar ambas por igualdad exacta.
4. **El modal de cliente está paginado** (50 de 64): sin `onIonInfinite()` el cliente objetivo "no existe" sin
   ninguna señal. Le costó tiempo a 2 módulos.
5. **La guarda de playa por host NO detecta un cambio de tenant** — es la lección de método más valiosa de la
   corrida. Hace falta una **guarda de EMPRESA** contra el YAML antes de leer cualquier tabla.
6. **Catálogos del perfil desactualizados:** los motivos/tipos de devolución del YAML no coinciden con los que
   expone la app (24 motivos ids 34-59, no los 28-35 del perfil; no existe el tipo 53 "Despacho"). No es
   defecto de la app — hay que corregir el dato de prueba.

## Reportes individuales

- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md) · [Cobros](cobros.md)
- [Devoluciones](devoluciones.md) · [Inventarios](inventarios.md) · [Depósitos](depositos.md)
- [Capa WEB](web.md)

---
*Generado por Claude Code · Orquestador Smoke · 2026-08-05*
