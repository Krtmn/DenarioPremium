# Smoke Test — Módulo PEDIDOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_100801_smoke-completo` |
| Módulo | PEDIDOS |
| Cliente / Playa | jerez (El Yaque) |
| App | `com.kiberno.denarioPremiumPro` |
| Cliente test | JL Motors SE,C.A (J-506554950, saldo 0,00) |
| Producto | PLAN-001 "Agro silotubo flex-silon extra PB 8P*50C" · 234,00 USD · categoría Plasticos |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Cotejo BD | OMITIDO (por diseño de esta corrida) |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Home Pedidos con botones PEDIDO / BUSCAR / COPIAR |
| DM-PED-002 | ✅ PASS | Form `app-pedido`: General habilitada, Pedido/Total/Adjunto `segment-button-disabled`, sin cliente |
| DM-PED-006 | ✅ PASS | Cliente JL Motors seleccionado; sin alerta deuda (saldo 0 → correcto); 4 tabs habilitadas |
| DM-PED-015 | ✅ PASS | Categoría Plasticos (1) expandida → producto PLAN-001 visible en acordeón |
| DM-PED-017 | ✅ PASS | Cantidad=2 vía fillIonInput → contador=2, badge success verde, sin alerta inventario (stock 450) |
| DM-PED-024 | ✅ PASS | Tab Total: Base 468,00 · IVA 74,88 · Total Pedido 542,88 USD (multiCurrencyOrder=false → solo USD) |
| DM-PED-026 | ✅ PASS | Basura en Tab Total (borrado directo sin confirmación) → totales 542,88→0,00, Items 1→0 |
| DM-PED-029 | ✅ PASS | Sin ítems: `.imagenGuardar` y `.imagenEnviar` deshabilitados |
| DM-PED-030 | ✅ PASS | Guardar → alert "Denario / Pedido Guardado"; aparece en BUSCAR como Ref 0 Estatus Guardado; comentario `Test-PED-SMOKE-103200` |
| DM-PED-031 | ✅ PASS | Enviar → "¿Desea Enviar el pedido?" → "Su Pedido será enviado" → "Pedido nro. **19** enviado exitosamente"; navega a home Pedidos |
| DM-PED-032 | ✅ PASS | Atrás con form dirty → modal 3 opciones (Guardar y salir / Salir sin guardar / Cancelar) |
| DM-PED-034 | ✅ PASS | Searchbar "DANIELA" filtra realtime 16→9 (todas Daniela) → limpiar → 16 |
| DM-PED-035 | ✅ PASS | Reabrir Guardado Ref 0 → form editable con 4 tabs habilitadas; comentario persistió (round-trip §9 OK) |
| DM-PED-037 | ✅ PASS | Basura en lista → "¿Seguro que quieres eliminar este pedido?" → Aceptar → 17→16 filas, Guardado desaparece |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. 19 | Pedido JL Motors · PLAN-001 × 2 · Total 542,88 USD · comentario `Test-PED-SMOKE-103200` | **Enviado** (UI asignó correlativo 19; sin residuo "Por Enviar") |
| Ref 0 (2º) | Pedido JL Motors · PLAN-001 × 3 (creado para DM-PED-037) | **Eliminado** desde lista |

### Observación H1 (no-persistencia El Yaque)
El pedido enviado alcanzó estado **Enviado** en la UI con correlativo de servidor **19** (no quedó "Por Enviar"). Cotejo con nube omitido en esta corrida, por lo que no se confirma persistencia en BD del endpoint `order`; la evaluación UI del caso de envío es PASS (correlativo asignado, validaciones y navegación correctas).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Match Ref 0 en lista | universal | tras `replace(/\s+/g,' ')` el texto es `Ref.: 0Cliente:` (0 pegado a C) → `\b` NO funciona; usar `/Ref\.: 0[^0-9]/` |
| Reabrir Guardado: tabs cargan async | cliente/jerez | al reabrir Ref 0, tabs Pedido/Total/Adjunto salen `disabled` en snapshot inmediato y se habilitan ~2s después (carga `listaDirecciones`); no marcar FAIL sin esperar. Consistente con nota `[prc-2606]` |
| Dirty-guard jerez PEDIDOS | cliente/jerez | modal "¡Alerta!" 3 opciones dispara al 1er intento con `img.fechaAtras`+`mouse.click` real; Guardar deja form pristine → atrás sale directo sin modal (confirma notas previas) |
| Comentario `#txComment` | universal | round-trip §9 confirmado: comentario sobrevive Guardar→reabrir en jerez |

> ✅ consolidado 2026-07-06

## Hallazgos (solo si hay FAIL)
Ninguno — 14/14 PASS.
