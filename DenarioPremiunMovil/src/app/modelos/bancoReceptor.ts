export class BancoReceptor {
    static bancoReceptorJson(obj: BancoReceptor) {
        return new BancoReceptor(
            obj['coAccount'],
            obj['coBank'],
            obj['coCurrency'],
            obj['coEnterprise'],
            obj['coType'],
            obj['idBank'],
            obj['idBankAccount'],
            obj['idCurrency'],
            obj['idEnterprise'],
            obj['nameBank'],
            obj['nuAccount'],
        );
    }

    constructor(
        public coAccount: string = "",
        public coBank: string = "",
        public coCurrency: string = "",
        public coEnterprise: string = "",
        public coType: string = "",
        public idBank: number = 0,
        public idBankAccount: string = "",
        public idCurrency: string = "",
        public idEnterprise: string = "",
        public nameBank: string = "",
        public nuAccount: string = "",
    ) { }
}