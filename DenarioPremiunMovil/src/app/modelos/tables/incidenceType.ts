export class IncidenceType {

    static incidenceTypeJson(obj: IncidenceType) {
        return new IncidenceType(
            obj['idType'],
            obj['naType'],
            obj['requiredEvent'],
            obj['requiredSignature']
        );
    }

    constructor(
        public idType: number,
        public naType: string,
        public requiredEvent: boolean,
        public requiredSignature: boolean
    ) { }
}