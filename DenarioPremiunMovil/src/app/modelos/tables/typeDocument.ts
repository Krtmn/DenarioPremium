export class TypeDocument {

    static typeDocumentJson(obj: TypeDocument) {
        return new TypeDocument(
            obj['idTypeDocument'],
            obj['coTypeDocument'],
            obj['naTypeDocument']
        );
    }

    constructor(
        public idTypeDocument: number,
        public coTypeDocument: string,
        public naTypeDocument: string,
    ) { }
}
