export class ReturnType {

    static returnTypeJson(obj: ReturnType) {
        return new ReturnType(
            obj['idType'],
            obj['naType'],
        );
    }

    constructor(
        public idType: number,
        public naType: string,
    ) { }
}