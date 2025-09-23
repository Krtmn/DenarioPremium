export class ProductUnit {

    static productUnitJson(obj: ProductUnit) {
        return new ProductUnit(
            obj['idProductUnit'],
            obj['coProductUnit'],
            obj['coProduct'],
            obj['idProduct'],
            obj['coUnit'],
            obj['idUnit'],
            obj['quUnit'],
            obj['coEnterprise'],
            obj['idEnterprise'],
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
    ) { }
}