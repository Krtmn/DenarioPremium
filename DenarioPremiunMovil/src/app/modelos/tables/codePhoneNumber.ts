export class CodePhoneNumber {

    static codePhoneNumberJson(obj: CodePhoneNumber) {
        return new CodePhoneNumber(
            obj['idCodePhoneNumber'],
            obj['coCodePhoneNumber'],
            obj['naCodePhoneNumber']
        );
    }

    constructor(
        public idCodePhoneNumber: number,
        public coCodePhoneNumber: string,
        public naCodePhoneNumber: string,
    ) { }
}
