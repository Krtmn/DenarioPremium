export class Retention {
    static retentionJson(obj: Retention) {
        return new Retention(
            obj['coDocument'],
            obj['nuVoucherRetention'],
            obj['nuAmountRetention'],
            obj['nuAmountRetention2'],
            obj['nuAmountPaid'],
            obj['nuAmountDoc'],
        );
    }

    constructor(
        public coDocument: string = "",
        public nuVoucherRetention: string = "",
        public nuAmountRetention: number = 0,
        public nuAmountRetention2: number = 0,
        public nuAmountPaid: number = 0,
        public nuAmountDoc: number = 0,

    ) { }
}
