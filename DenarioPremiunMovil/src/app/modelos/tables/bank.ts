export class Bank {

    static bankJson(obj: Bank) {
        return new Bank(
            obj['idBank'],
            obj['coBank'],
            obj['nameBank'],
            obj['coEnterprise'],
            obj['idEnterprise'],
        );
    }

    constructor(
        public idBank: number,
        public coBank: string,
        public nameBank: string,
        public coEnterprise: string,
        public idEnterprise: number,
    ) { }
}
