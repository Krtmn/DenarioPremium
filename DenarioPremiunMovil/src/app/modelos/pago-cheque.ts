import { BancoReceptor } from "./bancoReceptor";

export class PagoCheque {

    static pagoChequeJson(obj: PagoCheque) {
        return new PagoCheque(
            obj['idBank'],
            obj['nombreBanco'],
            obj['fecha'],
            obj['monto'],
            obj['montoConversion'],
            obj['fechaValor'],
            obj['numeroCheque'],
            obj['nuevaCuenta'],
            obj['posCollectionPayment'],
            obj['type'],
            obj['anticipoPrepaid'],
            obj['disabled'],
            obj['bancoReceptor'],
        );
    }

    constructor(
        public idBank: number = 0,
        public nombreBanco: string = "",
        public fecha: string = "",
        public monto: number = 0,
        public montoConversion: number = 0,
        public fechaValor: string = "",
        public numeroCheque: string = "",
        public nuevaCuenta: string = "",
        public posCollectionPayment: number = 0,
        public type = "ch",
        public anticipoPrepaid: boolean = false,
        public disabled: boolean = true,
        public bancoReceptor: BancoReceptor = new BancoReceptor,
//booleanos para controlar la visualizacion de los modales
        public showDateVenceModal: boolean = false, 
        public showDateValorModal: boolean = false,
    ) { }
}