export class Unit {

    static unitJson(obj: Unit) {
        return new Unit(
            obj['idUnit'],
            obj['coUnit'],
            obj['naUnit'],
            obj['coEnterprise'],
            obj['idEnterprise'],
            obj['idProductUnit'],
            obj['coProductUnit'],
            obj['quUnit'],
        );
    }

    constructor(
        public idUnit: number,
        public coUnit: string,
        public naUnit: string,
        public coEnterprise: string,
        public idEnterprise: number,
        public idProductUnit: number,
        public coProductUnit: string,        
        public quUnit: number
    ) { }
}