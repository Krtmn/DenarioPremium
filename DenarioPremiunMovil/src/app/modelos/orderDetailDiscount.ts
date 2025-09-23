export class OrderDetailDiscount {
    static OrderDetailDiscountJSON(obj: OrderDetailDiscount) {
        return new OrderDetailDiscount(
        obj['idOrderDetailDiscount'],
        obj['coOrderDetailDiscount'],
        obj['coOrderDetail'],
        obj['idOrderDetail'],
        obj['idDiscount'],
        obj['quDiscount'],
        obj['nuPriceFinal'],
        obj['coEnterprise'],
        obj['idEnterprise'],

        )
    }

    constructor(
        public idOrderDetailDiscount: number | null,
        public coOrderDetailDiscount: string,
        public coOrderDetail: string,
        public idOrderDetail: number | null,
        public idDiscount: number,
        public quDiscount: number,
        public nuPriceFinal: number,
        public coEnterprise: string,
        public idEnterprise: number,
    ){

    }
}