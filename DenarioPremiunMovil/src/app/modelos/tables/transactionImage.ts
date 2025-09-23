export class TransactionImage{


    static transactionImageJson(obj: TransactionImage) {
        return new TransactionImage(
            obj['idTransactionImage'],
            obj['naTransaction'],
            obj['coTransaction'],
            obj['naImage']
         
        );
    }

    constructor(
        public idTransactionImage: number,
        public naTransaction: string,
        public coTransaction: string,
        public naImage: string         
    ) { }
}