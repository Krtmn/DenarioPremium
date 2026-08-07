# Selectores web — módulo COBROS (`/pages/cobros` · `/pages/detalleCobro`)

> Parte de `web-selectors/` — leer junto con `_comunes.md` (regla de oro de IDs, guarda de tenant,
> filtro Empresa, reglas de lectura del detalle).
> Mantener bajo ~120 líneas. Todo patrón nuevo confirmado en 1 corrida entra acá con su tag.
>
> Origen: `[el_palmar-20260805]` — playa **Isla Coche**, **25 cobros verificados** (27068-27092) en 4 tandas
> read-only, cotejando UI web ↔ BD nube. Es la 1ª corrida que cubre los 5 `co_type`.

---

## 🔑 El catálogo de `co_type` sale GRATIS del propio filtro, sin BD

El `<select id$=":idTipo_input">` de `/pages/cobros` expone el **enum completo con sus rótulos**. Es la forma
barata de resolver un `co_type` desconocido — **mejor que el catálogo `statuses`**, que además puede no traducir
(ver `clientes/el_palmar.yaml`). Los 5 valores confirmados:

| `co_type` | Rótulo |
|---|---|
| `0` | Cobros |
| `1` | Anticipo / Prepago |
| `2` | Retención |
| `3` | IGTF |
| `4` | Cobro 25% |

## 🔴 Oráculo de la cabecera — es DISTINTO por `co_type` (usar el equivocado = falso positivo)

```
co_type 0:  Total a pagar = Σ(Saldo doc) − Total dcto − (Ret.IVA + Ret.ISLR) − Σ(Dif/Faltante) + IGTF
co_type 2:  Total a pagar = Σ(Monto a pagar por doc) = Ret.IVA + Ret.ISLR      ← el SALDO no participa
```

Validado contra los 25 cobros de la corrida. Aplicar el de `co_type 0` a una retención produce un
`WEB-CALC-MISMATCH` inexistente.

## Lectura del detalle — DOS reglas opuestas y un pie de forma variable

- **Cabecera** (`No. de Ref.`, `Estatus`, `Fecha`, `Nombre del cliente`, `Vendedor`, `Empresa`, `Responsable`,
  `Diferencia de cobro`, `Comentario`, `Ubicación`) → **`leerHojas` + hoja-siguiente** (emparejar).
- **Pie de totales** (`Monto total base`, `… descuento`, `Retención IVA/ISLR`, `Monto total IGTF`,
  `Total Monto a pagar`, `Tasa de conversión` + sus `… conversión`) → **mismo padre (`leerCabecera`)**.
  Con la regla de cabecera el pie sale **vacío** y `Tasa de conversión` se contamina con `"Documentos Pagados"`.

**El pie CAMBIA DE FORMA según el tipo — no asumir campos fijos. Leer con `??`, nunca asumir presencia:**

| Tipo | Forma del pie |
|---|---|
| Anticipo (`co_type=1`) | pie **reducido** a `Monto pagado` / `… conversión` / `Tasa`; **`documentosPagadosDT` AUSENTE** |
| Retención (`co_type=2`) | aparecen `Retención IVA` / `ISLR`; la tabla de pagos dice `"No se encontraron registros."` |
| Cualquiera con IVA o ISLR en **0** | 🔴 **la etiqueta directamente NO se renderiza** (27069 y 27080 no tienen `Retención ISLR`) |

## Tablas y anclajes

| Elemento | ID real | Cómo anclarlo |
|---|---|---|
| Lista de cobros | `form:cobrosDT` | semántico, estable (único del módulo) |
| Documentos pagados (detalle) | `form:documentosPagadosDT` | **semántico y estable**, 22 columnas |
| Formas de pago (detalle) | `form:j_idt177` | ❌ auto-generado → `tablaPorColumnas(['Forma de pago','Monto cobrado'])` |
| Botón de detalle de la fila | `form:cobrosDT:N:consultar` | 🔴 **anclar al `# Ref`, NUNCA a `N`** — ver `_comunes.md` |

- El **descuento del documento** se muestra en la columna **`Diferencia/Faltante`**.
- 🔑 **`browser_navigate` a `/pages/cobros` NO pierde el filtro en esta playa** (contra lo documentado): el estado
  (empresa, fechas, moneda) **sobrevive en la sesión JSF** y la lista vuelve con las mismas filas. Permitió el
  ciclo barato `navigate → click → leer` **15 veces seguidas**. ⚠ Cambiar el `<select>` **Empresa sí** obliga a
  `Buscar` de nuevo, y **entrar fresco al módulo resetea Empresa** (ver `_comunes.md`).

## 🔴 Notas de BD imprescindibles para el oráculo

- **`collection_payment.nu_collection_payment` = NÚMERO DE CUENTA, no el importe.** El importe está en
  **`nu_amount_partial`**. Contarlo como importe da falsos *"pagos vacíos"*.
- **`erp_in_collection_payment` es un ESPEJO del ERP ⇒ EXCLUIRLA** de todo conteo de pagos, o se cuentan dobles.
- **`collection.co_original_collection` es la llave cobro↔anticipo** (`id_original_collection` viene **NULL**).
  Es la **única** forma de correlacionar el par: **la web no expone el vínculo en ninguna pantalla.**
- La forma de pago **`Prepago Automático`** es un **marcador semántico**: identifica un anticipo **generado por el
  sistema** desde el vuelto de otro cobro.
- `collection_detail` de un `co_type=3` trae `co_type_doc='IGTF'` y `co_document='IGTF-<epoch>'`.
- `nu_amount_paid_conversion` sin convertir (visto en 27075: 375,0000 en vez de 244.864,7250) **no es visible en
  la web** — no existe columna `Monto a pagar conversión` ⇒ **nota de BD, no defecto web**.
- ⚠ **`Monto conv.` de la lista NO es derivable de `Monto cobrado`** — ver el anti-patrón en `_comunes.md`.

## 🔑 Los comentarios que deja el móvil son un oráculo barato

QA dejó marcas semánticas en el campo `Comentario` (`igtf_cob`, `igtf_sep`, `ret`, `antici`, `cob25`, `cob4`)
que resolvieron dos hipótesis **más rápido que la BD**. **Vale pedirlas siempre** al planificar una corrida móvil
que después se va a verificar en web.

---
*Creado por la consolidación de `[el_palmar-20260805]`.*
