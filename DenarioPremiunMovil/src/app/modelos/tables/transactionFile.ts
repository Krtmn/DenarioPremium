export class TransactionFile{


    static transactionImageJson(obj: TransactionFile) {
        return new TransactionFile(
            obj['idTransactionFile'],
            obj['naTransaction'],
            obj['coTransaction'],
            obj['naFile']
         
        );
    }

    constructor(
        public idTransactionFile: number,
        public naTransaction: string,
        public coTransaction: string,
        public naFile: string         
    ) { }
}