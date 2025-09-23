export class ProductLine {

    static productLineJson(obj: ProductLine) {
        return new ProductLine(
            obj['id'],
            obj['coProductLine'],
            obj['naProductLine'],
            obj['idEnterprise'],
         
        );
    }

    constructor(
        public id: number,
        public coProductLine: string,
        public naProductLine: string,
        public idEnterprise: number,
       
    ) { }
}