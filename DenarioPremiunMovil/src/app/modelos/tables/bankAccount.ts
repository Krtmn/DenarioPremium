export class BankAccount {

    static bankAccountJson(obj: BankAccount) {
        return new BankAccount(
            obj['idBankAccount'],
            obj['coBank'],
            obj['idBank'],
            obj['coAccount'],
            obj['nuAccount'],
            obj['coType'],
            obj['coCurrency'],
            obj['idCurrency'],
            obj['coEnterprise'],
            obj['idEnterprise'],
            obj['nameBank'],
        );
    }

    constructor(
        public idBankAccount: number,
        public coBank: string,
        public idBank: number,
        public coAccount: string,
        public nuAccount: string,
        public coType: string,
        public coCurrency: string,
        public idCurrency: number,
        public coEnterprise: string,
        public idEnterprise: number,
        public nameBank: string,
    ) { }
}