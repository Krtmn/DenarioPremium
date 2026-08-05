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
