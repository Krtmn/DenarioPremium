export class OrderTypeProductStructure {

    static orderTypeProductStructureJson(obj: OrderTypeProductStructure) {
        return new OrderTypeProductStructure(
            obj['idOrderTypeProductStructure'],
            obj['coOrderTypeProductStructure'],
            obj['idOrderType'],
            obj['coOrderType'],
            obj['idProductStructure'],
            obj['coProductStructure'],
            obj['idEnterprise'],
            obj['coEnterprise'],
        );
    }

    constructor(
        public idOrderTypeProductStructure: number,
        public coOrderTypeProductStructure: string,
        public idOrderType: number,
        public coOrderType: string,
        public idProductStructure: number,
        public coProductStructure: string,
        public idEnterprise: number,
        public coEnterprise: string

    ) { }
}