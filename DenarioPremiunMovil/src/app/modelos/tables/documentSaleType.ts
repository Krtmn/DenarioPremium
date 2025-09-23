export class DocumentSaleType {

    static documentSaleTypeJson(obj: DocumentSaleType) {
        return new DocumentSaleType(
            obj['idDocumentSaleType'],
            obj['coType'],
            obj['naType'],
            obj['coEquiv'],
            obj['coEnterprise'],
            obj['idEnterprise'],

        );
    }

    constructor(
        public idDocumentSaleType: number,
        public coType: string,
        public naType: string,
        public coEquiv: string,
        public coEnterprise: string,
        public idEnterprise: number,
        
    ) { }
}