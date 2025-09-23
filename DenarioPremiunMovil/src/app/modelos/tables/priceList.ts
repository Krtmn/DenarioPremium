export class PriceList {

    static priceListJson(obj: PriceList) {
        return new PriceList(
            obj['idPriceList'],
            obj['coPriceList'],            
            obj['idProduct'],
            obj['idList'],
            obj['nuMeasureUnitPrice'],
            obj['nuPrice'],
            obj['coCurrency'],
            obj['idCurrency'],
            obj['coEnterprise'],
            obj['idEnterprise'],

        );
    }

    constructor(
        public idPriceList: number,
        public coPriceList: string,
        public idProduct: number,
        public idList: number,
        public nuMeasureUnitPrice: number,
        public nuPrice: number,
        public coCurrency: string,
        public idCurrency: number,
        public coEnterprise: string,
        public idEnterprise: number,

    ) { }
}