export class Stock {

    static stockJson(obj: Stock) {
        return new Stock(
            obj['idStock'],
            obj['idProduct'],
            obj['coProduct'],
            obj['quStock'],
            obj['idWarehouse'],
            obj['coWarehouse'],
            obj['daUpdateStock'],
            obj['coEnterprise'],
            obj['idEnterprise'],

        );
    }

    constructor(
        public idStock: number = 0,
        public idProduct: number = 0,
        public coProduct: string = "",
        public quStock: number = 0,
        public idWarehouse: number = 0,
        public coWarehouse: string = "",
        public daUpdateStock: string = "",
        public coEnterprise: string = "",
        public idEnterprise: number = 0,

    ) { }
}