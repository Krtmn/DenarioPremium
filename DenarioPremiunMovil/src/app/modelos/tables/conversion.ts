export class Conversion {
    static conversionJson(obj: Conversion) {
        return new Conversion(
            obj['idConversion'],
            obj['coConversion'],
            obj['naConversion'],
            obj['primaryCurrency'],
            obj['idEnterprise'],

        );
    }

    constructor(
        public idConversion: number,
        public coConversion: string,
        public naConversion: string,
        public primaryCurrency: string,
        public idEnterprise: number,

    ) { }
}