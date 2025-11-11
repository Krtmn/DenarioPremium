export class Conversion {
    static conversionJson(obj: Conversion) {
        return new Conversion(
            obj['idConversion'],
            obj['coConversion'],
            obj['naConversion'],
            obj['primaryCurrency'],
            obj['idEnterprise'],
            obj['nuValueLocal']

        );
    }

    constructor(
        public idConversion: number,
        public coConversion: string,
        public naConversion: string,
        public primaryCurrency: string,
        public idEnterprise: number,
        public nuValueLocal?: number
    ) { }
}