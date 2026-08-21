/**
 * Longitudes máximas de Visitas según `createTables.json`.
 */
export const VISIT_FIELD_MAX = {
  /** incidences.tx_description VARCHAR(120) — comentario de actividad. */
  incidenceTxDescription: 120,
  /** visits.tx_reassigned_motive VARCHAR(200) — motivo de reagendo. */
  txReassignedMotive: 200,
} as const;
