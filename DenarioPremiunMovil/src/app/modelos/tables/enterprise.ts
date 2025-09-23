export class Enterprise {

    static enterpriseJson(obj: Enterprise) {
        return new Enterprise(
            obj['idEnterprise'],
            obj['lbEnterprise'],
            obj['coEnterprise'],
            obj['coCurrencyDefault'],
            obj['prioritySelection'],
            obj['enterpriseDefault'],
        );
    }

    constructor(
        public idEnterprise: number,
        public lbEnterprise: string,
        public coEnterprise: string,
        public coCurrencyDefault: string,
        public prioritySelection: number,
        public enterpriseDefault: boolean,

    ) { }
}