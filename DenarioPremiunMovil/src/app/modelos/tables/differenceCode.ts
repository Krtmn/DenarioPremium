export class DifferenceCode {

    static differenceCodeJson(obj: DifferenceCode) {
        return new DifferenceCode(
            obj['idDifferenceCode'],
            obj['coDifferenceCode'],
            obj['naDifferenceCode'],
            obj['txDescription'],
        );
    }

    constructor(
        public idDifferenceCode: number,
        public coDifferenceCode: string,
        public naDifferenceCode: string,
        public txDescription: string,

    ) { }
}