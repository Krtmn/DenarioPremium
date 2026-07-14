# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260714_130727_smoke-completo` |
| Módulo | CLIENTES |
| Cliente / Playa | latino_cosmetica (usuario 001) · servidor La Tortuga (`denariolatortuga.ddns.net:8081`) |
| App | `com.kiberno.denarioPremiumPro` · Infinix HOT 60i (X6728) · dbVersion 16 |
| `window.ng` | **true** |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` visible con 3 botones (CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL) |
| DM-CLT-002 | ✅ PASS | Lista 50 ítems; **cada ítem muestra "Saldo BSD" Y "Saldo $"** → multiCurrency=true real (2 monedas) |
| DM-CLT-003 | ✅ PASS | Searchbar filtra: "LOOKS"→0 (no sincronizado); "ANNELI"→1 resultado. Mecánica de filtrado correcta |
| DM-CLT-009 | ✅ PASS | `app-client-detail`: Empresa LATINOCOSMETICA C.A., Nombre ANNELI CA (13), RIF J412661841, Saldo BSD 248.983,08 / Saldo $ 373,26 |
| DM-CLT-013 | ✅ PASS | Tab Doc. de Venta renderiza `.documents-table-panel--ready` con leyenda Vigente/Vencido/A favor + 1 documento (Tipo 03, Nº 1757, montos/saldos/fechas) |
| DM-CLT-016 | ✅ PASS | `clickBack` desde lista → `app-clientes` (3 botones) |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` |
| DM-CLT-019 | ✅ PASS | Form potencial: 9 ion-input vacíos + idEnterprise (ion-select); Guardar/Enviar `disabled=true` |
| DM-CLT-021 | ✅ PASS | Llenados 8 inputs + idEnterprise=1 (numérico) → Guardar/Enviar `disabled=false` |
| DM-CLT-024 | ✅ PASS | Guardar → alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!"; ítem en lista con Nro.Ref 0 + trash. **Sin firma** |
| DM-CLT-026 | ✅ PASS | Enviar → 3 alertas → "Cliente potencial nro. **9** creado exitosamente"; ítem pasa a Nro.Ref 9, sin trash. **Sin firma** |
| DM-CLT-031 | ✅ PASS | Trash en Guardado (Test-CLT-DEL) → "¡Cliente Potencial se borro con exito!" (directo, sin confirmación previa) → desaparece de lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| **9** (id_client=9) | Cliente potencial **Test-CLT-SMOKE-131916** (RIF J987654321, empresa LATINOCOSMETICA C.A. idEnterprise=1) | **Enviado** (nube BD-OK) |
| 0 → borrado | Test-CLT-DEL-132139 (throwaway para DM-CLT-031) | Guardado → **Borrado** |

## Verificación BD
- Query `potential_client` (nube): fila nueva `id_client=9`, `na_client="Test-CLT-SMOKE-131916"`, `st_potential_client=1` (Enviado), `co_client="1784049524213.0"` (coincide con `coClient` del payload). Baseline top era id 8 → ahora 9.
- **Correlación confirmada:** Nro.Ref UI (9) = `id_client` (9) = `coTransaction`/`co_client` epoch en payload.
- Payload interceptado (`potentialclientservice/potentialclient`) volcado a `_payloads.jsonl`.
- **Marca: BD-OK** (guardado→enviado, llegó a la nube).

## Descubrimientos solicitados
- **NOMBRE(S) DE EMPRESA (idEnterprise):** **1 sola empresa → "LATINOCOSMETICA C.A." (value=1, tipo number)**. Confirma que aún con opción única NO se auto-selecciona y exige `value` numérico explícito + `ionChange`.
- **multiCurrency observado:** **2 monedas (BS + USD)** — lista y detalle muestran "Saldo BSD" y "Saldo $" simultáneos → multiCurrency=true es el real (el override 2022=false NO aplica aquí).
- **¿Firma requerida en potencial?** **NO.** signatureClient=true en config, pero ni Guardar ni Enviar solicitaron firma; ambos procedieron directo. Anotado.
- **Cliente LOOKS no sincronizado:** "DISTRIBUIDORA LOOKS 4 CA" (co 149) NO aparece en el device del usuario 001 ("No hay clientes disponibles"). Coherente con sync parcial por vendedor. **Cliente real usado para detalle: ANNELI CA (código 13)** — sincronizado, con saldo BSD 248.983,08 / $373,26 y 1 documento en Doc. de Venta.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| idEnterprise 1 empresa "LATINOCOSMETICA C.A." value=1 | cliente (latino_cosmetica) | reconfirma anti-patrón: opción única no auto-selecciona, exige number explícito |
| multiCurrency BS+USD activo | cliente (latino_cosmetica) | lista y detalle con doble moneda |
| Búsqueda por nombre (no código); "LOOKS" no sincronizado | cliente | usuario 001 no tiene LOOKS; usar ANNELI CA (13) como cliente con documentos |
| signatureClient=true pero SIN firma en Guardar/Enviar | cliente | el flag no se materializa en el formulario de potencial |
| Reapertura Guardado por click zona izquierda (x≈115 de item x=10 w=340) | universal (confirma) | reabre form con Enviar habilitado; navegó bien |

*(sin FAIL — no hay sección Hallazgos)*

> ✅ consolidado 20260714

## Baseline (Ola 0)
- **TOOL-USES aprox:** ~40 (≈28 `browser_run_code_unsafe` + ~8 Read + 2 Bash)
- **MS aprox del módulo:** ~900000 ms (~15 min, 13:07 → 13:22)

## Verificación BD (payload ↔ nube · campo-a-campo · Agente BD)

| co_x | Marca | Cabecera | Hijas | Mismatches | Notas |
|------|-------|----------|-------|------------|-------|
| 1784049524213.0 | BD-FIELD-OK | 17/17 OK | 0 | 0 | Zona horaria da_client (local UTC-4 → nube UTC); veredicto por día = igual |

**17/17 campos coinciden** (co_client, na_client=Test-CLT-SMOKE-131916, nu_rif=J987654321, id_enterprise=1, coordenada, nu_attachments=0, has_attachments=false, etc.). **Cero mismatches reales.** Única nota: hora del timestamp (esperada por zona horaria UTC-4↔UTC).
