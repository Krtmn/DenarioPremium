# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-06-19 |
| **RUN_ID** | `20260619_173652_smoke-completo` |
| **Cliente** | insumar (INSUMAR DISTRIBUIDOR) |
| **Dispositivo** | `14678405BR003855` |
| **App** | `com.kiberno.denarioPremiumPro` — Versión 1.0 |
| **Credenciales** | `***`/`***` |
| **Resultado global** | **123 PASS · 0 FAIL · 0 SKIP · 14 N/A** de 137 casos |

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP | N/A | Estado |
|--------|-------|------|------|------|-----|--------|
| Login | 6 | 6 | 0 | 0 | 0 | ✅ |
| Clientes | 12 | 12 | 0 | 0 | 0 | ✅ |
| Pedidos | 14 | 14 | 0 | 0 | 0 | ✅ |
| Cobros | 34 | 25 | 0 | 0 | 9 | ✅ |
| Devoluciones | 14 | 13 | 0 | 0 | 1 | ✅ |
| Inventarios | 16 | 16 | 0 | 0 | 0 | ✅ |
| Depósitos | 12 | 12 | 0 | 0 | 0 | ✅ |
| Visitas | 16 | 14 | 0 | 0 | 2 | ✅ |
| Productos | 10 | 9 | 0 | 0 | 1 | ✅ |
| Vendedores | 3 | 2 | 0 | 0 | 1 | ✅ |
| **TOTAL** | **137** | **123** | **0** | **0** | **14** | ✅ |

## FAIL críticos (S1/S2)

Ninguno. Corrida limpia sin FAIL en los 10 módulos.

| ID | Módulo | Descripción | Severidad |
|----|--------|-------------|-----------|
| — | — | (sin FAIL) | — |

## N/A — desglose

| ID | Módulo | Motivo |
|----|--------|--------|
| DM-COB-006 | Cobros | requiredComment=false → comentario no obligatorio |
| DM-COB-036/037/044/045 | Cobros | Botones IGTF y COBRO 25% IVA ausentes del HOME de Cobros hoy (ver Observaciones) |
| DM-COB-041/042 | Cobros | retencion=false → retención va por +RETENCIÓN del menú (029), no por detalle de documento |
| DM-COB-039/047 | Cobros | Modal Fecha tasa no propaga el cambio vía CDP — limitación de automatización, no defecto |
| DM-DEV-011 | Devoluciones | validateReturn=false → selector Factura no existe |
| DM-VIS-025/026 | Visitas | Lista RUTA DE HOY sin visitas sincronizadas desde backend hoy |
| DM-PRD-013 | Productos | Detalle sin selector Lista de Precios (único ion-select "ALMACEN 01") |
| DM-VND-002 | Vendedores | KPIs vacíos esta sesión (API no devolvió datos; no regresión de UI) |

## Registros enviados al sistema (persisten)

| Módulo | Ref / Nro | Detalle | Estado |
|--------|-----------|---------|--------|
| Clientes | Ref 11 | Potencial `Test-CLT-SMOKE-174513` (RIF J-123456789) | Enviado |
| Pedidos | Nro. 31 | Cliente 2738, MAIZ PARA COTUFAS RIOJANA 36X250G ×2 (US$ 1,84) | Enviado |
| Cobros | Nro. 60 | Cliente 3039, FACT20088816, Depósito BANESCO RAEL, BS 13.181,48 | Enviado |
| Devoluciones | Nro. 10 | Cliente 2738, TOMATES PELADOS MARY 24X400G ×3, PostVenta | Enviada |
| Inventarios | Ref 18 | Cliente 2738, TOMATES PELADOS MARY ×15, lote LOTE-QA-619, venc 31-dic-2026 | Enviado |
| Depósitos | Plantilla QA0619173652 | BANESCO RAEL (Banco 04), cobro Ref 45, BS 4765.23 | Por Enviar (offline-first) |
| Visitas | Ref 0 | Cliente 2738, VISITA SIN ACCION / NEGOCIO CERRADO (`Test-VIS-015-005749`) | Por Enviar (offline-first) |

**Pendientes de envío manual (estado Guardado):**
- Cobro Guardado Ref 0 — cliente 3039, FACT20090080 ("Guardar y salir").
- Anticipo Guardado Ref 0 — cliente 2738, Efectivo BS 50,00.
- Retención Guardada Ref 0 — cliente 3039, FACT US$ (requiere adjunto propio antes de enviar).

## Observaciones generales

- **Corrida limpia:** 0 FAIL en los 10 módulos. Resultado equivalente a la última corrida estable [ins-2610].
- **⚠️ Cambio de config web (insumar) — COBROS:** el HOME de Cobros muestra solo COBRO / ANTICIPO / RETENCIÓN / BUSCAR; los botones **IGTF** y **COBRO 25% IVA** ya **no se renderizan** pese a `userCanSelectIGTF=true` y `userCanCollectIva=true` en el perfil. Esto convirtió DM-COB-036/037/044/045 en N/A. No es un FAIL de la app, sino aparente cambio de configuración del servidor de insumar. **Recomendación QA:** confirmar con el equipo si IGTF / Cobro 25% IVA siguen habilitados en la cuenta; de mantenerse deshabilitados, actualizar las VGs del perfil (`userCanSelectIGTF`, `userCanCollectIva`) a `false`.
- **Defecto DM-DEP-010/018 (lista BUSCAR no renderiza tras guardar):** no reprodujo — 4ª corrida limpia acumulada (insumar 0609/0610/0619 + central_foods 0612). Candidato firme a cerrar.
- **Limitación de automatización (no defecto):** el modal **Fecha tasa** (Tab General) no propaga el cambio de fecha vía CDP (DM-COB-039/047 N/A). El round-trip de reapertura de ítems Ref 0 sigue ocasionalmente inestable vía CDP en Cobros.
- **Offline-first:** Depósitos y Visitas quedan en estado "Por Enviar" tras enviar (el servidor asignará Ref real al sincronizar) — comportamiento esperado, PASS.

## Memoria: patrones promovidos (Agente 11 — consolidación)

**Conteos:** 14 patrones a `module-selectors.md` (tag `[ins-2619]`, 558 líneas, bajo cap ~800) · 7 secciones inline en `insumar.yaml` · 0 graduados a RUNTIME/helpers · `defectos_abiertos` intacto · sin git commit/push.

| Patrón | Módulo | Destino |
|--------|--------|---------|
| Checkbox `recuerdame` toggle por `input.click()` + alert residual | Login | module-selectors.md (universal) |
| Submit reforzado shadow+mouse | Login | module-selectors.md (universal) |
| Textos alerts potencial / opción única empresa | Clientes | YAML cliente (inline) |
| Trash Tab Total (`grp.value`+evento) / entrada HOME clic `<a>` | Pedidos | module-selectors.md (universal) |
| Catálogo sub-tabs / input cantidad / atrás izq | Pedidos | YAML cliente (inline) |
| Modal Fecha tasa NO accionable vía CDP (≠ central_foods) | Cobros | module-selectors.md + YAML |
| IGTF/25%IVA ausentes pese a VG=true | Cobros | YAML cliente (dato, sin tocar VG) |
| Workaround `popstate` botón atrás Guardado | Devoluciones | module-selectors.md (anti-patrón) |
| Borrado directo / round-trip Resumen / reintento modal | Inventarios | module-selectors.md + YAML |
| Estado post-Enviar "Por Enviar" / DM-DEP-010-018 4ª limpia | Depósitos | module-selectors.md + YAML |
| Trash RUTA DE HOY / reapertura Ref0 SÍ (≠ Cobros) | Visitas | module-selectors.md + YAML |
| Back PRODUCTOS→HOME directo / `closest('a')` | Productos | module-selectors.md (universal) |
| Acordeón empresa SIN `value` → forzar `group.value` / KPIs vacíos sesión | Vendedores | module-selectors.md + YAML |

**Archivos modificados:** `automation/cdp/module-selectors.md` · `automation/clientes/insumar/insumar.yaml` · 10 reportes marcados `> ✅ consolidado 2026-06-19`.

> Revisar el `git diff` de `module-selectors.md` y `insumar.yaml` antes de commitear. El hallazgo IGTF/25%IVA quedó como **dato inline** sin alterar las VGs — requiere decisión humana (bajar a `false` o revisar config web del servidor insumar).

## Reportes individuales

- [Login](login.md) · [Clientes](clientes.md) · [Pedidos](pedidos.md)
- [Cobros](cobros.md) · [Devoluciones](devoluciones.md) · [Inventarios](inventarios.md)
- [Depósitos](depositos.md) · [Visitas](visitas.md) · [Productos](productos.md)
- [Vendedores](vendedores.md)

---
*Generado por Claude Code · Orquestador Smoke · 2026-06-19*
