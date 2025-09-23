export class IvaList {

    static ivaJson(obj: IvaList) {
        return new IvaList(
            obj['idIvaList'],
            obj['priceIva'],
            obj['txDescripcion'],
            obj['defaultIVA'],

        );
    }

    constructor(
        public idIvaList: number,
        public priceIva: number,
        public txDescripcion: string,
        public defaultIVA: boolean,

    ) { }
}