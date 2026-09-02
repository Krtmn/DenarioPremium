/**
 * Longitudes maximas de collection_payments segun createTables.json + migraciones (v5).
 */
export const COLLECTION_PAYMENT_FIELD_MAX = {
  /** nu_payment_doc VARCHAR(50): recibo, cheque, deposito, referencia TR/PM, Otros. */
  nuPaymentDoc: 50,
  /** nu_client_bank_account VARCHAR(50): nueva cuenta. */
  nuClientBankAccount: 50,
  /** nu_document VARCHAR(50): numero de documento en Pago Movil. */
  nuDocument: 50,
  /** nu_phone_number VARCHAR(50) en BD; el UI local (sin prefijo) exige 7 digitos. */
  nuPhoneNumber: 50,
  /** Digitos del telefono local en Pago Movil (sin codigo de area/pais del selector). */
  pagoMovilLocalPhone: 7,
} as const;
