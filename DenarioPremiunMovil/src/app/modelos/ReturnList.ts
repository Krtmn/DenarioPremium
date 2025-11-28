export class ReturnList {

    static returnListJson(obj: ReturnList) {
        return new ReturnList(
            obj['idReturn'],
            obj['coReturn'],
            obj['coClient'],
            obj['naClient'],
            obj['stReturn'],
            obj['daReturn'],
            obj['stDelivery'],
        );
    }

    constructor(
        public idReturn: number,
        public coReturn: string,
        public coClient: string,
        public naClient: string,
        public stReturn: number,
        public daReturn: string,        
        public stDelivery: number,
    ) { }
}