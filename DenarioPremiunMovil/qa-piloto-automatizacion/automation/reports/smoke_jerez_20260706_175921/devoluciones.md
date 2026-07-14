# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_175921_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | jerez |
| Resultado | 4 PASS · 0 FAIL · 0 SKIP · 10 N/A · 0 BLOCKED |
| Estado inicial→final | HOME → HOME ✅ |

## Hallazgo central — ¿hay facturas devolvibles bajo el nuevo set?

**NO.** Con el NUEVO set de datos se verificó activamente en las **3 empresas** (validateReturn=true exige seleccionar factura):

| Empresa | Cliente probado (con documentos) | Facturas devolvibles |
|---------|----------------------------------|----------------------|
| emp1 VALERA (00001) | JL Motors SE,C.A (J-506554950) | 0 — modal Factura vacío |
| emp2 CARACAS (00002) | MULTIREPUESTOS DRG (074820707, 6 docs, saldo USD 319) | 0 — modal Factura vacío |
| emp2 CARACAS (00002) | EL PODER DEL MONO (089129288, docs IGTF) — **formulario 100% fresco, 1er cliente** | 0 — modal Factura vacío |
| emp3 TURMEREMO (00003) | DANIELA HERNANDEZ (V161051485, saldo USD 3.491) | 0 — modal Factura vacío |

En **todos** los casos el `#InvoiceeSelectModal` abre con **0 ítems** y su `ion-content` renderiza el texto de estado-vacío *"¡Alerta! Se ha detectado cambio de la factura por lo que deberá iniciar nuevamente la devolución"*. Los documentos que tienen esos clientes son **cuentas por cobrar** (facturas vencidas del módulo Cobros), **NO** facturas de venta sincronizadas devolvibles dentro de `mesesFacturas=3`. Conclusión: **N/A por DATO** (ausencia de facturas devolvibles), no defecto de app. Consistente con corridas jerez previas (2026-06-22 y 2026-07-06). Reintentar cuando exista emisión real de facturas sincronizadas.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Módulo abre; botones DEVOLUCIÓN y BUSCAR visibles (`/devoluciones`) |
| DM-DEV-002 | ✅ PASS | Form abre; tabs **Productos/Adjuntos `disabled`** sin cliente; tab General activo |
| DM-DEV-004 | ✅ PASS | Al seleccionar cliente aparece campo **Factura** (`ion-input#invoiceSelect`) → `validateReturn=true` activo confirmado en UI |
| DM-DEV-006 | ✅ PASS | `#responsable`/`#precinto`/`#comentario` aceptan valores; **Tipo** = Calidad(60,default)/PostVenta(52)/Servicio(59), sin "Cambio X Cambio" |
| DM-DEV-011 | 🚫 N/A | No hay factura devolvible en ninguna empresa → no se puede seleccionar factura → tabs no habilitan (por dato, no defecto) |
| DM-DEV-013 | 🚫 N/A | Tab Productos bloqueado (sin factura) → no se llega a AGREGAR PRODUCTO |
| DM-DEV-014 | 🚫 N/A | Sin producto → no se prueba cantidad `inp-write` |
| DM-DEV-015 | 🚫 N/A | Tab Adjuntos bloqueado (sin factura) → no se verifican acordeones Imágenes/Archivo/Firma |
| DM-DEV-016 | 🚫 N/A | No se puede Guardar sin factura+producto |
| DM-DEV-018 | 🚫 N/A | No se puede Enviar |
| DM-DEV-019 | 🚫 N/A | BUSCAR abre lista con searchbar visible pero **0 devoluciones** (ninguna creada aún). Render correcto → N/A por dato, no FAIL |
| DM-DEV-021 | 🚫 N/A | Searchbar presente pero 0 ítems para filtrar |
| DM-DEV-022 | 🚫 N/A | No hay devolución Guardada para reabrir |
| DM-DEV-024 | 🚫 N/A | No hay devolución Guardada para eliminar |

## Registros creados en sistema
Ninguno. Motivo: **N/A por dato** — sin facturas devolvibles no se puede crear ninguna devolución (validateReturn=true). No se emitió manifiesto BD (`_bd-manifest.jsonl`) porque no se generó ningún `co_return`.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **Selector de empresa DENTRO del formulario Devoluciones** | universal (candidato) | El form tiene un `ion-select` (el **1º** `ion-select` visible de `app-devoluciones`, y≈147) con opciones `idEnterprise` 1/2/3. Cambiarlo `empSel.value=option.value; dispatchEvent(ionChange)` **recarga la cartera de clientes** del `#clienteSelectModal` a la de esa empresa — permite alcanzar clientes emp2/3 **sin** limpiar caché ni gateway. El 2º `ion-select` visible sigue siendo **Tipo** (Calidad/PostVenta/Servicio). |
| Etiquetas de empresa jerez (form devoluciones) | cliente jerez | Las 3 empresas se muestran como **"INV JEREZ MOTORS VALERA/CARACAS/TURMEREMO"** (idEnterprise 1/2/3, coEnterprise 00001/00002/00003, coCurrencyDefault USD). Difiere del YAML que las nombraba "INVERSIONES JEREZ 1/2/3". |
| Estado-vacío del `#InvoiceeSelectModal` | universal | Cuando **no hay facturas devolvibles**, el modal abre (`show-modal`) con `ion-item.length===0` y su `ion-content` muestra el texto *"¡Alerta! Se ha detectado cambio de la factura… Aceptar/Cancelar"* (plantilla de alerta embebida, sin botones portaled reales accionables). Es la señal fiable de "0 facturas", no un bug. Confirmado emp1/2/3, 4 clientes distintos. `[jerez-2026-07-06 re-run]` |
| Modal cliente sin searchbar propio; filtro por `input` no reduce | cliente jerez | El `#clienteSelectModal` tiene un `input` de búsqueda pero teclear en él **no filtró** la lista (8 ítems seguían). Para alcanzar clientes bajo el fold: hacer scroll del `.inner-scroll` del modal y clicar por coords cuando `top` esté en viewport (60–680). |
| Tipo devolución jerez | cliente jerez | Calidad(60, default) / PostVenta(52) / Servicio(59). **Sin** "Cambio X Cambio" (63). Confirma exclusividad de CxC a globalmp/don-theo. Igual a piercar. |

> ✅ consolidado 2026-07-06

## Hallazgos (FAIL)
Ninguno. 0 FAIL, 0 BLOCKED.

## Verificación BD
No aplica en esta corrida (instrucción: SIN lectura de BD, solo estatus UI). No se creó ningún registro → sin `co_return` que cotejar. `BD-N/A`.
