export class Incidence {
    static incidenceJSON(obj: Incidence) {
        return new Incidence(
            obj['idVisit'],
            obj['coVisit'],
            obj['coIncid'],
            obj['coType'],
            obj['coCause'],
            obj['txDescription'],
        )
    }

    constructor(
        public idVisit: number | null,
        public coVisit: string,
        public coIncid: number,
        public coType: number,
        public coCause: number | null,
        public txDescription: string,
    ) { }
}