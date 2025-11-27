export class PaymentPartials {
    constructor(
        public idCollection: number,
        public daCollection: string,
        public coCurrency: string,
        public nuAmountPaid: string,
        public nuBalanceDoc: string,
        public coPaymentMethod: string,
        public stCollection: string,
        public nuPaymentDoc: string,
        public stDelivery: string,

    ) { }
}