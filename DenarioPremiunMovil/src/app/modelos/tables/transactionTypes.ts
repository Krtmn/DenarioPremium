export class TransactionTypes {

    static transactionTypesJson(obj: TransactionTypes) {
        return new TransactionTypes(
            obj['idTransactionType'],
            obj['coTransactionType'],
            obj['naTransactionType'],
            obj['requireApproval'],

        );
    }

    constructor(
        public idTransactionType: number,
        public coTransactionType: string,
        public naTransactionType: string,
        public requireApproval: boolean,
    ) { }
}