export class Currencies {

    static currenciesJson(obj: Currencies) {
        return new Currencies(
            obj['idCurrencyEnterprise'],
            obj['idCurrency'],
            obj['coCurrency'],
            obj['localCurrency'],
            obj['hardCurrency'],
            obj['coEnterprise'],
            obj['idEnterprise'],
        );
    }

    constructor(
        public idCurrencyEnterprise: number,
        public idCurrency: number,
        public coCurrency: string,
        public localCurrency: boolean,
        public hardCurrency: boolean,
        public coEnterprise: string,
        public idEnterprise: number,
    ) { }

}