export class PagoOtros {
    static pagoOtrosJson(obj: PagoOtros) {
        return new PagoOtros(
            obj['nombre'],
            obj['monto'],
            obj['montoConversion'],
            obj['posCollectionPayment'],
            obj['type'],
            obj['anticipoPrepaid'],
            obj['disabled']
        );
    }

    constructor(
        public nombre: string = "",
        public monto: number = 0,
        public montoConversion: number = 0,
        public posCollectionPayment: number = 0,
        public type = "de",
        public anticipoPrepaid: boolean = false,
        public disabled: boolean = true,
    ) { }
}
