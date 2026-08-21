# Cobros — Smoke manual (dispositivo)

Checklist corta P3. No automatizar todavía.

1. Cobro normal → 1 doc completo → efectivo exacto → Enviar ON → guardar → reabrir → Enviar sigue coherente.
2. Transferencia + `clientBankAccount` → cuenta existente → exacto → Enviar ON; bajar monto → Enviar OFF (COB-TR-002).
3. Guardar TR → reabrir → campos receptor/emisor correctos y Enviar ON si monto completo (COB-TR-003).
4. Documentos: parcial página 1 → página 2 → volver → total Pagos intacto (COB-DOCS-001).
5. Anticipo / Retención / Cobro 25%: pestañas correctas.
6. Adjunto + GPS (si aplica config).
7. Lista: borrador vs enviado.
8. `tolerancia0` OFF → no enviar con faltante; ON + rango− alto → sí (documentado, no bug TR).
9. COB-PREPAID-002: cobro normal con excedente ≥ `prepaidRangeAmount` + `automatedPrepaid` → Enviar → online: loading solo al persistir/encolar, se cierra y luego alertas AutoSend (cobro → anticipo), sin “Su Cobro será enviado”; offline: aviso “al tener conexión” + ambos Por Enviar. Sin adjuntos en el anticipo automático.
10. COB-UX-SEND-002: cobro nuevo → Enviar OFF; solo doc o solo pago → OFF; doc + pago → ON; quitar último doc/pago → OFF; anticipo solo pago; retención solo doc; reabrir borrador con doc+pago → ON.
11. COB-RET-SEND-001: Retención → seleccionar doc sin asignar retención → Enviar → modal explicativo + hint en fila + apertura automática del documento.
12. COB-SAVE-002: General OK → Guardar ON → guardar → Guardar OFF → editar comentario/pago/doc → Guardar ON → guardar de nuevo → OFF. Reabrir borrador guardado: Guardar OFF hasta primer cambio.
