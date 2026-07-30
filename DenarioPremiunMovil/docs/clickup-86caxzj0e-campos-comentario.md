# ClickUp 86caxzj0e — Campos comentario/observación

Tarea: **Revision Campos Comentario/Observacion**

## Resumen

Se estandarizaron los campos de texto libre tipo comentario, observación o explicación con:

- Hint visible: `Mín. 0 - Máx. 255 caracteres`
- Contador en vivo: `actual/máximo` (ej. `12/255`)
- Límite duro con `maxlength="255"` y truncado en `ionInput` para pegado de texto

## Constantes y utilidades nuevas

| Archivo | Descripción |
|---------|-------------|
| `src/app/utils/text-comment-field.constants.ts` | `TEXT_COMMENT_MIN_LENGTH = 0`, `TEXT_COMMENT_MAX_LENGTH = 255` |
| `src/app/utils/text-comment-field.util.ts` | Helpers de hint, contador y truncado |
| `src/app/components/text-comment-counter/text-comment-counter.component.ts` | Componente reutilizable `<app-text-comment-counter>` |

## Campos editables actualizados

| Módulo | Componente | Campo / etiqueta | Límite anterior | Límite nuevo |
|--------|------------|------------------|-----------------|--------------|
| Pedidos | `pedido.component` | `txComment` / `PED_COMENTARIO` | Sin límite UI | 255 |
| Cobros | `cobro-general.component` | `collection.txComment` / `COB_COMENTARIO` | Sin límite UI | 255 |
| Cobros | `cobro-documents.component` | `discountComment` / `COB_COMENTARIO` (descuentos) | Sin límite UI | 255 |
| Inventarios | `inventario-general.component` | `txComment` / `INV_COMENTARIO` | 120 | 255 |
| Depósitos | `deposito-general.component` | `txComment` / `DEP_COMENTARIO` | Sin límite UI | 255 |
| Devoluciones | `devolucion-general.component` | `newReturn.txComment` / `DEV_COMENTARIO_DEV` | 500 | 255 |
| Visitas | `visita.component` | `comentario` / `VIS_COMENTARIO` | 120 | 255 |
| Visitas | `visita.component` | `motivoReagendo` / Motivo reagendar | Sin límite UI | 255 |
| Clientes | `client-new-potential-client.component` | `txClient` / `CLI_NEW_POT_OBSERVACION` | Sin límite UI | 255 |

## Campos revisados sin cambio (solo lectura o no aplican)

| Módulo | Componente | Motivo |
|--------|------------|--------|
| Cobros | `cobro-documents.component` | `COB_COMENTARIO_DOCUMENTO` es solo lectura |
| Cobros | `cobros-list.component` | Botón para ver comentario, no edición |
| Clientes | `client-document-sale`, `client-detail` | Visualización de comentario de documento |
| Clientes | `cliente-selector` | Visualización de comentario |

## Rama

`feature/clickup-86caxzj0e-5191725991290820761`
