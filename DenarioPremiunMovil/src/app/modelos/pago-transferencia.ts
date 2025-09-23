import { BancoReceptor } from "./bancoReceptor";

export class PagoTransferencia {
    static pagoTransferenciaJson(obj: PagoTransferencia) {
        return new PagoTransferencia(
            obj['idBanco'],
            obj['nombreBanco'],
            obj['numeroTransferencia'],
            obj['numeroCuenta'],
            obj['monto'],
            obj['montoConversion'],
            obj['fecha'],
            obj['nuevaCuenta'],
            obj['posCollectionPayment'],
            obj['type'],
            obj['anticipoPrepaid'],
            obj['disabled'],
            obj['bancoReceptor']
        );
    }

    constructor(
        public idBanco: number = 0,
        public nombreBanco: string = "",
        public numeroTransferencia: string = "",
        public numeroCuenta: string = "",
        public monto: number = 0,
        public montoConversion: number = 0,
        public fecha: string = "",
        public nuevaCuenta: string = "",
        public posCollectionPayment: number = 0,
        public type = "tr",
        public anticipoPrepaid: boolean = false,
        public disabled: boolean = true,
        public bancoReceptor: BancoReceptor = new BancoReceptor,
        //booleanos para controlar la visualizacion de los modales
        public showDateModal: boolean = false,
    ) { }
}

