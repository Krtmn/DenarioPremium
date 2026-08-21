/**
 * Longitudes máximas de `collection_payments` según `createTables.json` + migraciones (v5).
 */
export const COLLECTION_PAYMENT_FIELD_MAX = {
  /** nu_payment_doc VARCHAR(50): recibo, cheque, depósito, referencia TR/PM, Otros. */
  nuPaymentDoc: 50,
  /** nu_client_bank_account VARCHAR(50): nueva cuenta. */
  nuClientBankAccount: 50,
  /** nu_document VARCHAR(50): número de documento en Pago Móvil. */
  nuDocument: 50,
  /** nu_phone_number VARCHAR(50) en BD; el UI local (sin prefijo) exige 7 dígitos. */
  nuPhoneNumber: 50,
  /** Dígitos del teléfono local en Pago Móvil (sin código de área/país del selector). */
  pagoMovilLocalPhone: 7,
} as const;
