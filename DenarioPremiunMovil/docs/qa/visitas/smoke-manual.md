# Visitas — Smoke manual (dispositivo)

Checklist corta. No automatizar todavía.

1. **VIS-SAVE-001:** Nueva visita → seleccionar cliente + sucursal → Guardar y Enviar visibles/activos (sin actividades aún).
2. **VIS-SAVE-001:** Visita sync (`fromWeb`): sin iniciar → pestañas bloqueadas; Enviar OFF.
3. **VIS-SAVE-001:** Pulsar Guardar/Enviar sin actividades → modal de error; no abre confirmación.
4. **VIS-SAVE-001:** Añadir actividad → Guardar → confirmación `VIS_MSJ_SAVE_QUESTION` → éxito → Guardar OFF.
5. **VIS-SAVE-002:** Tras guardar → Guardar OFF → editar línea o comentario → Guardar ON → guardar de nuevo → OFF.
6. **VIS-SAVE-002:** Reabrir visita guardada → Guardar OFF hasta primer cambio; Enviar ON si General OK.
7. **VIS-SEND-001:** General OK → Enviar ON aunque falten actividades → pulsar Enviar → modal + hint en pestaña Actividades.
8. **Firma (`signatureVisit`):** sin adjuntos → modal al Guardar/Enviar.
9. **Transportista + actividad con firma:** sin firma → modal al Enviar.
10. **GPS (`userMustActivateGPS`):** sin coordenada → modal al Guardar/Enviar.
11. **Peso adjuntos:** límite excedido → Guardar y Enviar OFF.
