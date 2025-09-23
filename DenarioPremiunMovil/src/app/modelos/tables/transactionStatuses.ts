export class TransactionStatuses {

    static transactionStatusesJson(obj: TransactionStatuses) {
        return new TransactionStatuses(
            obj['idTransactionStatus'],
            obj['daTransactionStatuses'],
            obj['idTransactionType'],
            obj['coTransactionType'],
            obj['coTransaction'],
            obj['idTransaction'],
            obj['idStatus'],
            obj['coStatus'],

        );
    }

    constructor(

        public idTransactionStatus: number,
        public daTransactionStatuses: string,
        public idTransactionType: number,
        public coTransactionType: string,
        public coTransaction: string,
        public idTransaction: number,
        public idStatus: number,
        public coStatus: string
    ) { }
}