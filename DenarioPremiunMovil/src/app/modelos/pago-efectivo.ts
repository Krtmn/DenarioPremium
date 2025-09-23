export class PagoEfectivo {
    static pagoEfectivoJson(obj: PagoEfectivo) {
        return new PagoEfectivo(
            obj['monto'],
            obj['montoConversion'],
            obj['nuRecibo'],
            obj['fecha'],
            obj['posCollectionPayment'],
            obj['type'],
            obj['anticipoPrepaid'],
            obj['disabled']
        );
    }

    constructor(
        public monto: number = 0,
        public montoConversion: number = 0,
        public nuRecibo: string = "",
        public fecha: string = "",
        public posCollectionPayment: number = 0,
        public type = "ef",
        public anticipoPrepaid: boolean = false,
        public disabled: boolean = true,
    ) { }
}
