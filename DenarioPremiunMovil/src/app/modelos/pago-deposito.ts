export class PagoDeposito {
    static pagoDepositoJson(obj: PagoDeposito) {
        return new PagoDeposito(
            obj['idBanco'],
            obj['nombreBanco'],
            obj['numeroCuenta'],
            obj['numeroDeposito'],
            obj['fecha'],
            obj['monto'],
            obj['montoConversion'],
            obj['posCollectionPayment'],
            obj['type'],
            obj['anticipoPrepaid'],
            obj['disabled']
            

        );
    }

    constructor(
        public idBanco: number = 0,
        public nombreBanco: string = "",
        public numeroCuenta: string = "",
        public numeroDeposito: string = "",
        public fecha: string = "",
        public monto: number = 0,
        public montoConversion: number = 0,
        public posCollectionPayment: number = 0,
        public type = "de",
        public anticipoPrepaid: boolean = false,
        public disabled: boolean = true,
        //variable para mostrar modal de fecha
        public showDateModal: boolean = false,
    ) { }
}
