export class TransactionTypes {

    static transactionTypesJson(obj: TransactionTypes) {
        return new TransactionTypes(
            obj['idTransactionType'],
            obj['coTransactionType'],
            obj['naTransactionType'],
         
        );
    }

    constructor(
        public idTransactionType: number,
        public coTransactionType: string,
        public naTransactionType: string,
    ) { }
}