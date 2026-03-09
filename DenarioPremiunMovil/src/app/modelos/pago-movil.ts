export class PagoMovil {
  static pagoMovilJson(obj: PagoMovil) {
    return new PagoMovil(
      obj['idBancoEmisor'],
      obj['nombreBancoEmisor'],
      obj['idBancoDestino'],
      obj['nombreBancoDestino'],
      obj['numeroCuentaDestino'],
      obj['tipoDocumento'],
      obj['numeroDocumento'],
      obj['codigoTelefono'],
      obj['numeroTelefono'],
      obj['numeroReferencia'],
      obj['monto'],
      obj['montoConversion'],
      obj['fecha'],
      obj['posCollectionPayment'],
      obj['type'],
      obj['anticipoPrepaid'],
      obj['disabled']
    );
  }

  constructor(
    public idBancoEmisor: number = 0,
    public nombreBancoEmisor: string = '',
    public idBancoDestino: number = 0,
    public nombreBancoDestino: string = '',
    public numeroCuentaDestino: string = '',
    public tipoDocumento: 'V' | 'J' | 'G' = 'V',
    public numeroDocumento: string = '',
    public codigoTelefono: '0414' | '0424' = '0414',
    public numeroTelefono: string = '',
    public numeroReferencia: string = '',
    public monto: number = 0,
    public montoConversion: number = 0,
    public fecha: string = '',
    public posCollectionPayment: number = 0,
    public type = 'pm',
    public anticipoPrepaid: boolean = false,
    public disabled: boolean = true,
    public showDateModal: boolean = false,
  ) { }
}
