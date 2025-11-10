export class CurrencyModules {

    static currencyModulesJson(obj: CurrencyModules) {
        return new CurrencyModules(
            obj['idCurrencyModule'],
            obj['idModule'],
            obj['localCurrencyDefault'],
            obj['showConversion'],
        );
    }

    constructor(
        public idCurrencyModule: number,
        public idModule: number,
        public localCurrencyDefault: boolean,
        public showConversion: boolean,
   
    ) { }
}