export class PaymentCondition {

    static paymentConditionJson(obj: PaymentCondition) {
        return new PaymentCondition(
            obj['idPaymentCondition'],
            obj['coPaymentCondition'],
            obj['naPaymentCondition'],
            obj['coEnterprise'],
            obj['idEnterprise'],
          
        );
    }

    constructor(
        public idPaymentCondition: number,
        public coPaymentCondition: string,
        public naPaymentCondition: string,
        public coEnterprise: string,
        public idEnterprise: number,
        
    ) { }
}