export class UnitPriceList {

    static unitPriceListJson(obj: UnitPriceList) {
        return new UnitPriceList(
            obj['idUnitPriceList'],
            obj['coUnitPriceList'],
            obj['idUnit'],
            obj['coUnit'],
            obj['idList'],
            obj['coList'],
            obj['coEnterprise'],
            obj['idEnterprise']
        );
    }

    constructor(
        public idUnitPriceList: number,
        public coUnitPriceList: string,
        public idUnit: number,
        public coUnit: string,
        public idList: number,
        public coList: string,
        public coEnterprise: string,
        public idEnterprise: number,
    ) { }
}
