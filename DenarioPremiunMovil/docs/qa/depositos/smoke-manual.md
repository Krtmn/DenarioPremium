# Depósitos — Smoke manual (dispositivo)

Checklist corta. No automatizar todavía.

1. **DEP-SAVE-001:** Nuevo depósito → Guardar y Enviar visibles/activos de entrada (sin exigir banco aún en el botón).
2. **DEP-SAVE-001:** Pulsar Guardar sin banco → alerta de banco; con banco y sin cobros/firma → permite guardar borrador.
3. **DEP-SEND-001:** Pulsar Enviar incompleto → alerta con lo que falta + salto a pestaña; Enviar se apaga y al editar reactiva.
4. **DEP-SAVE-001:** Completar banco + cobros + plantilla → Guardar → confirmación → éxito → Guardar OFF.
5. **DEP-SAVE-002:** Tras guardar → Guardar OFF → editar comentario o cobro → Guardar ON → guardar de nuevo → OFF.
6. **DEP-SAVE-002:** Reabrir depósito guardado → Guardar OFF hasta primer cambio de usuario.
7. **DEP-SEND-001:** Enviar ON aunque falten cobros → pulsar Enviar → modal + hint en pestaña Cobros.
8. **Firma (`signatureCollection`):** en depósito solo muestra el panel; no exige adjuntos (no hay `requiredDepositAttachments`; Cobros sí usa `requiredCollectionAttachments`).
9. **GPS (`userMustActivateGPS`):** sin coordenada → modal al Guardar/Enviar.
