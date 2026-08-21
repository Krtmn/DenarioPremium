# Devoluciones — Smoke manual (dispositivo)

Checklist corta. No automatizar todavía.

1. **DEV-SAVE-001:** Nueva devolución → seleccionar cliente → Guardar y Enviar visibles/activos (sin productos aún).
2. **DEV-BACK-001:** Con General iniciada o datos/firma → Atrás → modal Guardar y salir / Salir sin guardar (no pierde datos).
3. **DEV-SAVE-001:** Con `validateReturn`: sin factura → pestañas Productos/Adjuntos bloqueadas; Enviar OFF.
4. **DEV-SAVE-001:** Pulsar Guardar con General OK sin productos → permite borrador; Enviar sin productos → modal + salto a Productos.
5. **DEV-SAVE-001:** Añadir productos + completar qty/doc → Guardar → confirmación → éxito → Guardar OFF.
6. **DEV-SAVE-002:** Tras guardar → Guardar OFF → editar comentario o línea → Guardar ON → guardar de nuevo → OFF.
7. **DEV-SAVE-002:** Reabrir devolución guardada → Guardar OFF hasta primer cambio; Atrás sin dirty → sale sin modal.
7. **DEV-SEND-001:** General OK → Enviar ON aunque falten productos → pulsar Enviar → modal + hint en filas incompletas.
8. **Modo factura (`validateReturn`):** qty fuera de rango → alerta inline al blur + modal al Guardar/Enviar.
9. **Firma (`signatureReturn`):** solo muestra el panel; no exige adjuntos al Enviar (sin `requiredReturnAttachments`).
10. **GPS (`userMustActivateGPS`):** sin coordenada → modal al Guardar/Enviar.
11. **Peso adjuntos:** límite excedido → Guardar y Enviar OFF.
