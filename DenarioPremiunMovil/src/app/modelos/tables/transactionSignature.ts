export class TransactionSignature{


    static transactionImageJson(obj: TransactionSignature) {
        return new TransactionSignature(
            obj['idTransactionSignature'],
            obj['naTransaction'],
            obj['coTransaction'],
            obj['naImage']
         
        );
    }

    constructor(
        public idTransactionSignature: number,
        public naTransaction: string,
        public coTransaction: string,
        public naImage: string         
    ) { }
}