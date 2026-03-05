export class ProductSuggestedUtil {

    static returnProductSuggestedJson(obj: ProductSuggestedUtil) {
        return new ProductSuggestedUtil(
            obj['idProduct'],
            obj['unitsSuggested'],
        );
    }
    constructor(
        public idProduct: number,
        public unitsSuggested: UnitSuggestedUtil[]
    ) { }
}

export class UnitSuggestedUtil {

    static returnUnitSuggestedJson(obj: UnitSuggestedUtil) {
        return new UnitSuggestedUtil(
            obj['idUnit'],
            obj['idProductUnit'],
            obj['quUnitSuggested'],
            obj['previousStock'],
            obj['currentStock'],
            obj['dispatchedStock'],
            obj['straightSwapStock'],
            obj['returnedStock'],
        );
    }
    
    constructor(
        public idUnit: number,
        public idProductUnit: number,
        public quUnitSuggested: number,
        public previousStock: number,
        public currentStock: number,
        public dispatchedStock: number,
        public straightSwapStock: number,
        public returnedStock: number,
    ) { }
}