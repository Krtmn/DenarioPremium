/**
 * Longitudes máximas de `potential_clients` según `createTables.json`.
 */
export const POTENTIAL_CLIENT_FIELD_MAX = {
  naClient: 80,
  nuRif: 15,
  txAddress: 150,
  txAddressDispatch: 150,
  txClient: 160,
  naResponsible: 80,
  emClient: 80,
  nuPhone: 80,
  naWebSite: 150,
} as const;

export type PotentialClientTextField = keyof typeof POTENTIAL_CLIENT_FIELD_MAX;
