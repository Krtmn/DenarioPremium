export class Bank {

    static bankJson(obj: Bank) {
        return new Bank(
            obj['idBank'],
            obj['coBank'],
            obj['naBank'],
            obj['coEnterprise'],
            obj['idEnterprise'],
        );
    }

    constructor(
        public idBank: number,
        public coBank: string,
        public naBank: string,
        public coEnterprise: string,
        public idEnterprise: number,
    ) { }
}