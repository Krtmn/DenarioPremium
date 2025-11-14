export class CurrencyModules {

    static currencyModulesJson(obj: CurrencyModules) {
        return new CurrencyModules(
            obj['idCurrencyModules'],
            obj['idModule'],
            obj['localCurrencyDefault'],
            obj['showConversion'],
            obj['currencySelector'],
        );
    }

    constructor(
        public idCurrencyModules: number,
        public idModule: number,
        public localCurrencyDefault: boolean,
        public showConversion: boolean,
        public currencySelector: boolean,

    ) { }
}