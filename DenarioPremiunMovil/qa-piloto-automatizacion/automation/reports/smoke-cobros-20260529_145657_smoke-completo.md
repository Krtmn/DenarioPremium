# Smoke Test — Módulo COBROS
**RUN_ID:** 20260529_145657_smoke-completo  
**Fecha ejecución:** 2026-05-29  
**Agente:** Claude Sonnet 4.6 (CDP vía Playwright MCP)  
**App:** com.kiberno.denarioPremiumPro · Cuenta Yaque  
**Estado inicial → final:** HOME principal → HOME principal

---

## Tabla de resultados

| ID | P/F/S/N | Evidencia |
|----|---------|-----------|
| DM-COB-001 | PASS | Home cobros: botones COBRO, RETENCIÓN, IGTF, COBRO 25% IVA, BUSCAR visibles; sin ANTICIPO (cobroPrepago inactiva, N/A para DM-COB-028) |
| DM-COB-002 | PASS | 5 tabs visibles; General habilitada, Documentos/Pagos/Total/Adjuntos disabled; campo Cliente vacío |
| DM-COB-004 | PASS | Cliente "ALIMENTOS GOURMET CCC, C.A." seleccionado; modal cerrado; tabs habilitadas tras rellenar Comentario (VG requiredComment=true activa) |
| DM-COB-007 | PASS | Tab Documentos con leyenda Vigente/Vencido/A favor y lista de documentos (FACT20110662 USD visible) |
| DM-COB-008 | PASS | Checkbox ionChange sobre primer doc; sticky muestra "Monto total a pagar BS: 66.718,81" |
| DM-COB-009 | PASS | Modal "Seleccione método de cobro..." abierto con "Depósito" (único método habilitado para el cliente); botones CANCELAR y AGREGAR visibles |
| DM-COB-040 | PASS | Acordeón Depósito visible; banco BANCO DE VENEZUELA seleccionado vía alert; Nro. depósito TEST-DEP-040; monto 66.718,81; Diferencia BS: 0,00 en azul |
| DM-COB-012 | PASS | Diferencia BS: 0,00 color rgb(0,0,255) azul confirmado vía getComputedStyle |
| DM-COB-014 | PASS | Tab Total: "Monto total a Pagar BS 66.718,81", tabla FACT20110662, acordeón Total Depósitos, "Total General BS: 66.718,81" |
| DM-COB-016 | FAIL | window.ng no disponible — APK es build de producción, no build de desarrollo. getComponent retorna null. Inyección CDP imposible. Ver detalle abajo. |
| DM-COB-018 | PASS | Alert "El Cobro se ha guardado" recibido; cobro guardado sin adjunto (guardar no requiere adjunto) |
| DM-COB-019 | FAIL | Tras ACEPTAR confirmación de envío: alerta COB_RET_MSJ_COLLECTION_NO_ATTACHMENTS — "Para poder enviar el Cobro, debe agregar al menos un adjunto." Causa raíz: DM-COB-016 no pudo completarse. |
| DM-COB-029 | PASS | Retención: título "Retención"; sin tab Pagos; tabs General/Documentos/Total/Adjuntos; Total muestra "Monto IVA BS: 0,00" y "Monto ISLR BS: 0,00"; alert "La Retención se ha guardado". Envío bloqueado (misma causa que DM-COB-016/019). |
| DM-COB-036 | PASS | IGTF: título "IGTF"; 5 tabs incluyendo Pagos; Tab Documentos muestra selector Moneda BS/USD; guardado exitoso ("El IGTF se ha guardado"). Sin docs IGTF para cliente Yaque — cobertura del selector de tasa condicional a existencia de docs. |
| DM-COB-037 | N/A | COBRO 25% IVA: formulario abre correctamente (título, 5 tabs). Sin clientes disponibles para este tipo en cuenta Yaque — el selector de clientes retorna "No hay clientes disponibles". Condición de datos, no defecto. |
| DM-COB-020 | PASS | Cobro nuevo con cliente + comentario → atrás → alert con "Guardar y salir" / "Salir sin guardar" / "Cancelar" |
| DM-COB-021 | PASS | "Salir sin guardar" → app en home cobros; cobro no guardado |
| DM-COB-022 | PASS | Lista BUSCAR muestra cobros (IGTF, Retención, Cobros normal con "Guardado"); 3 botones trash para Guardados; barra de búsqueda presente |
| DM-COB-024 | PASS | Cobro Guardado abierto desde lista: formulario cargado, botones guardar/enviar visibles y operables |
| DM-COB-026 | PASS | Delete: modal "¿Desea eliminar el Cobro?" → ELIMINAR → cobro desaparece de lista (trash count 4→3) |
| DM-COB-038 | PASS | Cobro nuevo → atrás → "Guardar y salir" → alert "El Cobro se ha guardado" → app en home cobros |
| DM-COB-039 | PASS | Cobro Guardado reabierto; Tasa BS editable (504.91→510.00); Tab Total muestra "Tasa USD: 510,00"; guardado exitoso |

---

## Detalle de FAILs

### DM-COB-016 — FAIL: window.ng no disponible (build de producción)

**Severidad:** S1 — bloquea DM-COB-019 y el envío de todos los tipos de cobro.

**Descripción:** La técnica de inyección de adjunto documentada en `lecciones-aprendidas-cdp.md §3.9` requiere que el APK sea un **build de desarrollo** (angular con `ng` global expuesto). En este entorno, `window.ng` retorna `undefined`; `window.ng?.getComponent(el)` retorna `null`; `el.__ngContext__` es numérico (producción). Ninguna alternativa (símbolos, WeakMap, Zone, Angular DevTools hook) funcionó.

**Impacto:** `adjuntoService.hasItems()` siempre retorna `false`. Al intentar enviar (DM-COB-019), la app muestra `COB_RET_MSJ_COLLECTION_NO_ATTACHMENTS` y no envía. El mismo bloqueo afecta DM-COB-029 (Retención envío) y potencialmente DM-COB-018 si el guardar también verificara adjunto (en este caso guardar no verifica — solo envío).

**Acción requerida:** Reinstalar la APK con build de desarrollo (`ionic capacitor build android --configuration=development`) que exponga `window.ng`. Alternativamente, en el servidor de credenciales exponer un endpoint que inyecte el adjunto vía API REST interna.

### DM-COB-019 — FAIL: COB_RET_MSJ_COLLECTION_NO_ATTACHMENTS tras ACEPTAR envío

**Causa raíz:** DM-COB-016 no completado (ver arriba). El cobro permanece en estado Guardado sin enviarse.

---

## Notas de ejecución

- **VG requiredComment=true activa:** el campo Comentario es obligatorio para habilitar las tabs (DM-COB-004). Se rellena en todos los cobros de prueba.
- **Método de pago único:** cliente ALIMENTOS GOURMET solo admite Depósito. DM-COB-009 PASS con este método.
- **Monto ion-input:** el campo Monto del acordeón Depósito usa un "cents map" con formato venezolano (coma decimal). Técnica correcta: evento `ionInput` con `inputType: 'insertFromPaste'` y valor `'66718,81'`.
- **DM-COB-028:** N/A — botón ANTICIPO/PREPAGO ausente en cuenta Yaque (VG cobroPrepago inactiva).
- **DM-COB-037:** N/A — sin clientes disponibles para COBRO 25% IVA en Yaque.

---

## Conteos

| Estado | Cantidad |
|--------|----------|
| PASS | 17 |
| FAIL | 2 |
| SKIP | 0 |
| N/A | 3 |
| **Total** | **22** |

*FAILs: DM-COB-016 (raíz), DM-COB-019 (dependencia). N/As: DM-COB-028 (VG inactiva), DM-COB-037 (sin datos), DM-COB-029 envío (documentado como PASS del guardar, FAIL del envío subsumido en DM-COB-016/019).*

---

*Generado por agente QA CDP · RUN_ID 20260529_145657_smoke-completo · 2026-05-29*
