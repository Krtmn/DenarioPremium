# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260710_084522_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Dispositivo | Infinix HOT 60i (X6728) · android · UUID da9f78b6e785fffc |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 (Isla La Tortuga) |
| Playa / Cliente | hidroponias — HIDROPONIAS VENEZOLA |
| Servidor | `denariolatortuga.ddns.net:8081` |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

VGs activas: validateReturn=true, signatureReturn=true, userCanUploadFiles=true → módulo plenamente conducible (factura devolvible SÍ disponible en La Tortuga, NO N/A).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Módulo abre; botones DEVOLUCIÓN (180,107) y BUSCAR (180,176) visibles |
| DM-DEV-002 | ✅ PASS | Form abre; tabs Productos/Adjuntos con `segment-button-disabled` sin cliente; General activo |
| DM-DEV-004 | ✅ PASS | Cliente ALIMENTOS GOURMET CCC (100146) seleccionado; campo Factura (`#invoiceSelect`) aparece (VG validateReturn) |
| DM-DEV-006 | ✅ PASS | Responsable/Precinto/Comentario aceptan valores; Tipo popover con Calidad/Distribución/PostVenta/Servicio |
| DM-DEV-011 | ✅ PASS | Factura 20110662 seleccionada (10 facturas devolvibles listadas); tabs Productos/Adjuntos se habilitan |
| DM-DEV-013 | ✅ PASS | Agregar Producto → CAMPROLEC012BOL; acordeón (colapsado) se expande con Lote/NroFactura/Cantidad/Unidad/Motivo |
| DM-DEV-014 | ✅ PASS | Cantidad=2 en `inp-write`; NroFactura precargado (20110662); Enviar pasa de disabled→enabled |
| DM-DEV-015 | ✅ PASS | Tab Adjuntos: acordeones Imágenes(images) + Archivo(file) + Firma(sign) — 3 VGs presentes |
| DM-DEV-016 | ✅ PASS | Alert "¡Su Devolución se ha guardado!" |
| DM-DEV-018 | ✅ PASS | Confirm "¿Desea enviar la devolución?" → Aceptar → "¡Su Devolución será enviada!"; vuelve a home módulo |
| DM-DEV-019 | ✅ PASS | BUSCAR: fila Nro.Ref 22 / Cliente 100146 ALIMENTOS GOURMET / Estatus Enviado / Fecha 10/07/2026 |
| DM-DEV-021 | ✅ PASS | Searchbar "GOURMET" filtra en tiempo real (22→refs 22,18,12,7,1 solo GOURMET); 0 botón eliminar (todas Enviado) |
| DM-DEV-022 | ✅ PASS | Devolución Guardada abre editable; 3 tabs accesibles; cliente + factura 20110662 precargados |
| DM-DEV-024 | ✅ PASS | Basura (solo en Guardado) → confirm "¿Desea eliminar la devolución?" Cancelar/Eliminar → ítem desaparece |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| 22 | ALIMENTOS GOURMET CCC (100146) · factura 20110662 · CAMPROLEC012BOL x2 · Tipo Calidad(60) · co_return 1783693622836.0 | Enviado (nube id_return=22, BD-OK) |
| 0 | ALIMENTOS GOURMET CCC (100146) · factura 20110662 · CAMPROLEC012BOL x3 · Guardado (para DM-DEV-022/024) | Eliminado en DM-DEV-024 |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Tipos de devolución hidroponias | cliente | Calidad(60,default) / **Distribución** / PostVenta / Servicio — "Distribución" es nuevo, no visto en otros clientes; sin "Cambio X Cambio" |
| Selector empresa cabecera | universal | 1er `ion-select` visible (y≈147) = empresa (HIDRO_A idEnterprise=1); 2º (y≈627) = Tipo — confirma nota `[jerez-2026-07-06]` |
| `#InvoiceeSelectModal` (doble 'e') | universal | Confirmado en hidroponias/La Tortuga: 10 facturas devolvibles del cliente listadas con "Nro Factura / Fecha"; click en `ion-input#invoiceSelect` abre el modal |
| Lista productos ligada a factura | universal | Con validateReturn=true, "Agregar Producto" muestra SOLO los productos de la factura seleccionada (4 items para 20110662), no catálogo completo |
| Lista BUSCAR formato fila | universal | "Nro. Ref: N" / "Cliente: cod - nombre" / "Estatus: Enviado\|Guardado" / "Fecha: dd/mm/yyyy"; searchbar filtra en vivo |
| Nro.Ref UI = id_return | universal | Ref 22 = id_return 22 (nube). Ref 0 = Guardado local sin sincronizar (confirma `[ins-2610]`) |
| Payload capture `returnservice/return` | universal | `nativePromise` SÍ captura el POST completo (returns cabecera + details) en build La Tortuga v6.6.18 — 4 reintentos idénticos; coherente con `[ferrenuestro-2026-07-07]` |
| Back del form dispara dirty-guard | universal | En form editable/sucio, `img.fechaAtras`+MouseEvent dispara alert "Guardar y salir / Salir sin guardar / Cancelar" — consistente con `[gmp-2611][prc-2606]`; en hidroponias SÍ engancha vía CDP |

*Nota operativa: navegar de la lista BUSCAR a un ítem editable y luego atrás dispara el dirty-guard; manejar el alert (Salir sin guardar) antes de re-intentar navegación — evita quedar atascado en detalle.*

> ✅ consolidado 20260710

## Verificación BD
Modelo 2-agentes: agente UI emitió manifiesto `_bd-manifest.jsonl` con `co_return` 1783693622836.0 (action: sent). Cotejo profundo lo hace el agente BD.

Cotejo inline (fallback §10):
- **Nube:** `return` id_return=22, co_return=1783693622836.0, st_return=1 (Enviado), det=1 (1 return_detail = 1 producto agregado). Baseline previo max id=21 → diff limpio: solo la fila esperada. **BD-OK** (guardado→enviado confirmado).
- **Local (SQLite):** `sqlite3` no disponible en el device (`run-as: exec failed for sqlite3`) → **BD-N/A** local (blindaje §10, no tumba smoke).
- **Payload enviado (captura `nativePromise`):** cabecera coincide 1:1 con UI — naResponsible="QA RESPONSABLE", nuSeal="PREC-001", idType=60 (Calidad), txComment="Devolucion QA smoke", coClient="100146", coInvoice="20110662", idEnterprise=1 (HIDRO_A); detalle: idProduct=17 coProduct=CAMPROLEC012BOL quProduct=2 UNI idMotive=49 coDocument=20110662. **BD-FIELD-OK** (todo lo lleno cuadra).

Conclusión: lo guardado se envió y llegó a la nube íntegro. Correlación Nro.Ref UI (22) = id_return (22) confirmada → BD-INFO.

## Hallazgos
Ninguno (0 FAIL).

## Verificación BD (payload ↔ nube) — Agente BD (cotejo campo-a-campo)

| co_x | Marca | Campos cabecera | Hijas | Mismatches | Notas |
|------|-------|-----------------|-------|------------|-------|
| 1783693622836.0 | BD-FIELD-OK | 10/10 OK | return_detail 1/1 | 0 | `da_return` difiere solo en hora (UTC-4→UTC); rename `txComment`→`tx_description` confirmado |

**Conclusión:** devolución Ref 22 enviada íntegra a la nube — cabecera (10 campos: responsable, precinto PREC-001, tipo 60, cliente 100146, factura 20110662) y línea (CAMPROLEC012BOL x2, motivo 49), 0 mismatches.
