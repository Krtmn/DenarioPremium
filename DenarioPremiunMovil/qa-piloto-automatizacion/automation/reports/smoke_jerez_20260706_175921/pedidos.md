# Smoke Test — Módulo PEDIDOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_175921_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | jerez (El Yaque, INVERSIONES JEREZ MOTORS) |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

Set de datos NUEVO. Sin lectura de BD (§10 omitido). Estatus de "Registros creados" = lo que muestra la UI, sin afirmar persistencia en nube.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Home Pedidos con botones PEDIDO / BUSCAR / COPIAR |
| DM-PED-002 | ✅ PASS | Form app-pedido: GENERAL habilitada; PEDIDO/TOTAL/ADJUNTO `segment-button-disabled`; sin cliente |
| DM-PED-006 | ✅ PASS | Modal 3 clientes cartera; selecciono `JL Motors SE,C.A` (J-506554950, saldo 0). Sin alerta deuda vencida. 4 tabs habilitadas |
| DM-PED-015 | ✅ PASS | Tab Pedido: 8 categorías; expando `Plasticos` (1 prod) → PLAN-001 visible en acordeón |
| DM-PED-017 | ✅ PASS | fillIonInput cantidad=2 → contador=2, badge verde (color=success); sin alerta de inventario (stock 398) |
| DM-PED-024 | ✅ PASS | Tab Total: Base USD 468,00 · IVA 74,88 · Total 542,88 (solo USD, multiCurrencyOrder=false) — no cero |
| DM-PED-026 | ✅ PASS | Trash en acordeón del ítem (Tab Total) → totales recalculan 542,88 → 0,00 (Items 0) |
| DM-PED-029 | ✅ PASS | Sin ítem: Guardar y Enviar `disabled` |
| DM-PED-030 | ✅ PASS | Reagrego ítem + comentario `Test-PED-SMOKE-203715` → Guardar → alert "Denario / Pedido Guardado" |
| DM-PED-031 | ✅ PASS* | Enviar → "¿Desea Enviar el pedido?" ACEPTAR → "Su Pedido será enviado" → navega a home. *Ver nota H1: el pedido quedó **"Por Enviar"** (no "Enviado") |
| DM-PED-032 | ✅ PASS | Atrás con form dirty (ítem sin guardar) → modal "¡Alerta!" 3 opciones (GUARDAR Y SALIR / SALIR SIN GUARDAR / CANCELAR). Tras Guardar el form queda pristine → atrás directo sin modal (esperado) |
| DM-PED-034 | ✅ PASS | Searchbar "JL Motors" filtra realtime 29 → 1 ítem |
| DM-PED-035 | ✅ PASS | Click pedido Guardado → form editable 4 tabs (tabs habilitan ~2s post-apertura). **Oráculo §9 PASS** (ver abajo) |
| DM-PED-037 | ✅ PASS | Trash (botón danger w≈29) en pedido Guardado → "¿Seguro que quieres eliminar este pedido?" ACEPTAR → desaparece de lista |

## Oráculo §9 — round-trip Guardar → reabrir (DM-PED-035)
Reabierto el pedido Guardado (JL Motors SE,C.A) y comparado 1:1 contra lo guardado — sin divergencia silenciosa:
| Campo | Guardado | Reabierto | Match |
|-------|----------|-----------|-------|
| Cliente | JL Motors SE,C.A (J-506554950) | idem | ✅ |
| Comentario | Test-PED-SMOKE-203715 | Test-PED-SMOKE-203715 | ✅ |
| Línea | PLAN-001 PIEZA 2 | PLAN-001 PIEZA 2 | ✅ |
| Total Base USD | 468,00 | 468,00 | ✅ |
| Total IVA USD | 74,88 | 74,88 | ✅ |
| Total Pedido USD | 542,88 | 542,88 | ✅ |

## Registros creados en sistema (estatus UI, sin cotejo BD)
| Ref | Detalle | Estado UI |
|-----|---------|-----------|
| 0 | Pedido A · JL Motors SE,C.A · 1 línea PLAN-001 x2 · 542,88 USD · com. Test-PED-SMOKE-203715 | **Por Enviar** (tras Enviar; no transitó a "Enviado" en ~10s — H1) |
| 0 | Pedido B · JL Motors SE,C.A · 1 línea PLAN-001 x1 · Guardado | **Eliminado** (DM-PED-037) |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Catálogo jerez (set nuevo) | cliente | 8 categorías: Accesorios MJ (179), Carbones (136), HJ-Forza (75), Otras marcas (131), Plasticos (1), Repuestos Jerez (221), Repuestos de Motos (4055), XCORT (31). Conteos subieron vs 2026-06-22; Plasticos sigue 1 prod |
| Producto PLAN-001 (set nuevo) | cliente | "Agro silotubo flex-silon extra PB 8P*50C", 234,00 USD, PIEZA, inventario **398** (era 450) |
| Botón "Pedido Sugerido" en Tab Pedido | cliente | NO aparece en tab Pedido (suggestedOrder botón ausente) pese a suggestedOrder=true. Sin divergencia bloqueante — la discrepancia documentada es en Inventarios |
| Trash pedido Guardado en lista | universal | `app-pedidos-lista ion-item[Estatus: Guardado] ion-button[color="danger"]` w≈29 dcha; coords frescas exactas; confirmación "¿Seguro que quieres eliminar este pedido?" — confirmado en jerez `[jerez-2026-07-06b]` |
| Reabrir Guardado Ref 0: match en lista | universal | filtrar por nombre de cliente en searchbar aísla el Guardado; distinguir de "Por Enviar" con `/Estatus: Guardado/` (ambos Ref 0) `[jerez-2026-07-06b]` |
| Estatus "Por Enviar" (H1) | cliente | tras Enviar, el pedido no muestra "Enviado" ni Ref real; queda **"Por Enviar"** (cola de salida) y no transita en ~10s. Consistente con memoria H1 no-persistencia endpoints jerez |

> ✅ consolidado 2026-07-06

## Hallazgos / observaciones
**H1 no-persistencia (DM-PED-031)** — Conocido, no re-marcado FAIL. El flujo de Enviar es aceptado por la UI (confirmación "¿Desea Enviar el pedido?" → "Su Pedido será enviado" → navega a home Pedidos), moviendo el pedido de "Guardado" a **"Por Enviar"** (cola de salida). NO alcanza el estatus "Enviado" ni asigna Nro.Ref real dentro de la ventana de observación (~10s). Coincide con la memoria [Jerez no-persistencia endpoints]: pedido/cliente-potencial quedan "Por Enviar", no llegan a nube (inv/vis/dep sí sincronizan). ⚠ La corrida previa (20260706_100801) reportó en UI Ref real y "Enviado" — con BD en próxima corrida verificar si es intermitente (conectividad/cola) o el endpoint. Sin lectura de BD esta corrida NO afirma ni descarta persistencia.
