export class PagoOtros {
    static pagoOtrosJson(obj: PagoOtros) {
        return new PagoOtros(
            obj['nombre'],
            obj['monto'],
            obj['montoConversion'],
            obj['posCollectionPayment'],
            obj['type'],
            obj['anticipoPrepaid'],
            obj['disabled'],
            obj['fecha'],
            obj['showDateModal'],
            obj['differenceCode']
        );
    }

    constructor(
        public nombre: string = "",
        public monto: number = 0,
        public montoConversion: number = 0,
        public posCollectionPayment: number = 0,
        public type = "ot",
        public anticipoPrepaid: boolean = false,
        public disabled: boolean = true,
        public fecha: string = "",
        public showDateModal: boolean = false,
        public differenceCode: {
            idDifferenceCode: number | null,
            coDifferenceCode: string | null;
        }
    ) { }
}