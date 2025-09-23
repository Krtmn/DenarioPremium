export class PendingTransaction {

    static pendingTransactionJson(obj: PendingTransaction) {
        return new PendingTransaction(
            obj['coTransaction'],
            obj['idTransaction'],
            obj['type']
            );
    }

    constructor(
        public coTransaction: string,
        public idTransaction: number | null,
        public type: string,

    ) { }
}