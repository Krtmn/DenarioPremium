export class ClientBankAccount {

    static clientBankAccountJson(obj: ClientBankAccount) {
        return new ClientBankAccount(
            obj['idBank'],
            obj['idClient'],
            obj['idClientBankAccount'],
            obj['idCurrency'],
            obj['idEnterprise'],
            obj['coBank'],
            obj['coClient'],
            obj['coClientBankAccount'],
            obj['coCurrency'],
            obj['coEnterprise'],
            obj['coType'],
            obj['naBank'],
            obj['nuAccount'],
        );
    }

    constructor(
        public idBank: number,
        public idClient: number,
        public idClientBankAccount: number,
        public idCurrency: number,
        public idEnterprise: number,
        public coBank: string,
        public coClient: string,
        public coClientBankAccount: string,
        public coCurrency: string,
        public coEnterprise: string,
        public coType: string,
        public naBank: string,
        public nuAccount: string,



    ) { }
}