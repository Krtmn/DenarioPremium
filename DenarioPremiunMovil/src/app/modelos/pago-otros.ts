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
            // permite explícitamente 0 o null; si no existe, usamos null
            obj.hasOwnProperty('idDifferenceCode') ? obj['idDifferenceCode'] : null,
            obj['coDifferenceCode'],
            obj['fecha'],
            obj['showDateModal']
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
        public idDifferenceCode: number | null = null,
        public coDifferenceCode: string = "",
        public fecha: string = "",
        public showDateModal: boolean = false,
    ) { }
}