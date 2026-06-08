# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260605_162806_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | CDP 127.0.0.1:9220 (PID 8880) |
| App | `com.kiberno.denarioPremiumPro` — WebView http://localhost |
| Playa | globalmp |
| Resultado | **11 PASS · 0 FAIL · 0 SKIP · 0 N/A** |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | `app-pedidos` visible; botones PEDIDO, BUSCAR, COPIAR presentes |
| DM-PED-002 | ✅ PASS | Tabs Pedido/Total/Adjunto con `segment-button-disabled`; solo General activo; ion-select Empresa preseleccionado (idEnterprise:2) |
| DM-PED-006 | ✅ PASS | Alert "Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" apareció al seleccionar BIG MARKET 22; ACEPTAR → tabs habilitados; cliente BIG MARKET 22, C.A cargado (coClient: BM17) |
| DM-PED-015 | ✅ PASS | Tab Pedido activo; lista de categorías visible: ACEITE(8), ALBECA(30), CAPRI(60), CAPRI 2(28), COLGATE(205), HEINZ 1(96), NESTLE(101), PANTERA(56), etc. |
| DM-PED-017 | ✅ PASS | Click PCE01 expandió campo cantidad; `fillIonInput` cantidad=2 → badge verde "2" (contadorProductos); inventario PCE01 97.25→95.25 |
| DM-PED-024 | ✅ PASS | Tab Total: Límite Crédito 600,00; Total Items:1; Total Base USD:46,78; Total Pedido USD:46,78 (solo USD — multiCurrency=false o sin tasa BS activa) |
| DM-PED-026 | ✅ PASS | Abrir acordeón PCE01 en Tab Total → botón trash visible → click → Total Items:0, Total USD:0,00 (eliminación directa sin alerta adicional) |
| DM-PED-029 | ✅ PASS | Sin ítems: `imagenGuardar` y `imagenEnviar` ambos `disabled:true` |
| DM-PED-030 | ✅ PASS | Agregar PCE01 qty=2, comentario="Test-PED-SMOKE-170118" → click imagenGuardar → alert "Pedido Guardado" + OK → lista BUSCAR muestra Nro.Ref.:0, Cliente:BIG MARKET 22, Estatus:Guardado |
| DM-PED-031 | ✅ PASS | Abrir pedido Guardado → click imagenEnviar → alert Cancelar/Aceptar → Aceptar → alert "Su Pedido será enviado" → navega a /pedidos → lista muestra Nro.Ref.:10110, BIG MARKET 22, Estatus:Enviado |
| DM-PED-032 | ✅ PASS | Nuevo pedido con PCE01 qty=1 (dirty) → click back → alert con 3 opciones: "Guardar y salir / Salir sin guardar / Cancelar" → "Salir sin guardar" → /pedidos |
| DM-PED-034 | ✅ PASS | Searchbar "Pedidos..." → texto "BIG MARKET" → lista filtra a 4 resultados (todos BIG MARKET 22, C.A) en tiempo real |
| DM-PED-035 | ✅ PASS | Click en pedido Guardado → formulario editable con 4 tabs (General/Pedido/Total/Adjunto) todos habilitados; imagenGuardar y imagenEnviar activos |
| DM-PED-037 | ✅ PASS | Trash en pedido Guardado → alert Cancelar/Aceptar → Aceptar → pedido desaparece (195→194 ítems) |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. Ref. 10110 | Pedido BIG MARKET 22, C.A — PCE01 CAJA:2 (23,39 USD), Total:46,78 USD, Comentario: Test-PED-SMOKE-170118 | Enviado |
| Nro. Ref. 0 (eliminado) | Pedido BIG MARKET 22, C.A — PCE01 CAJA:1 — creado y eliminado durante DM-PED-037 | Eliminado |

---

## Hallazgos

### Datos descubiertos globalmp (primera corrida exploratoria)

| Campo | Valor |
|-------|-------|
| `cliente_test` | BIG MARKET 22, C.A |
| `cliente_code` | BM17 |
| `alerta_deuda_vencida` | `true` — mensaje: "Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" |
| `estructura_producto` | Categorías por marca (ej. CAPRI, COLGATE, HEINZ 1, NESTLE, PANTERA) — conteo al costado |
| `enterpriseEnabled` | `true` — ion-select Empresa obligatorio (idEnterprise:2 "COMERCIALIZADORA DEHC TRADING MARKET 20") |
| `multiCurrency` | `false` o tasa BS inactiva — Tab Total muestra solo USD (sin Bs.) |
| `Empresa` | idEnterprise:2, coEnterprise:"00002", coCurrencyDefault:"USD" |

### Notas operativas

- **Patrón de navegación en pedidosLista:** ion-item.click() con dispatchEvent NO navega; usar `pg.mouse.click(coords)` con getBoundingClientRect.
- **Patrón búsqueda clientes:** input[placeholder="Clientes..."] responde a setter+Event('input') — sin necesidad de botón search explícito en este flujo (a diferencia de módulo Clientes).
- **DM-PED-031 wording:** Alert de envío dice "Su Pedido será enviado" (no "Pedido nro. X enviado exitosamente") — funcionalidad correcta, solo diferencia de texto.
- **DM-PED-026:** Eliminación desde Tab Total es directa (sin alerta de confirmación) al hacer click en trash; contrariamente DM-PED-037 (desde lista) SÍ muestra alerta de confirmación.
- **Categorías producto observadas:** ACEITE, ALBECA, BAHIA, CAFE, CAPRI, CAPRI 2, CARABOBO, CARABOBO 2, CEMIL, COLGATE, DEL CAMPO, EL PUERTO, ESPECIALIDADES, HEINZ 1, HEINZ 2, KELLOGGS, KRAKIN FLAKES, LAS DELICIAS, LOS ANDES, MARES, MI BRISA, MONTALAR, MONTALBAN 1, NAZARE, NESTLE, OLYMPIA, PANTERA, PASTORA, PAVECA, PROLLAVE/KIANA, SAL, SILSA, UNDERWOOD.

---

*Generado: 2026-06-05 | Agente QA CDP | RUN_ID: 20260605_162806_smoke-completo*
