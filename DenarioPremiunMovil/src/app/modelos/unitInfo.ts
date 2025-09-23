export class UnitInfo {

    static productUnitJson(obj: UnitInfo) {
        return new UnitInfo(
            /*
             * Ayudante de unidades de producto para pedidos
             * literalmente productUnit con monto y nombre
             */

            obj['idProductUnit'],
            obj['coProductUnit'],
            obj['coProduct'],
            obj['idProduct'],
            obj['coUnit'],
            obj['idUnit'],
            obj['quUnit'],
            obj['coEnterprise'],
            obj['idEnterprise'],
            obj['naUnit'],
            obj['quAmount'],

        );
    }

    constructor(
        public idProductUnit: number,
        public coProductUnit: string,
        public coProduct: string,
        public idProduct: number,
        public coUnit: string,
        public idUnit: number,
        public quUnit: number,
        public coEnterprise: string,
        public idEnterprise: number,
        public naUnit: string,
        public quAmount: number
    ) { }
}