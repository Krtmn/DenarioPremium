import { ClientStocksDetail } from "./tables/client-stocks";

export class Inventarios {
    static inventariosJson(obj: Inventarios) {
        return new Inventarios(
            obj['idProduct'],
            obj['indexDetail'],
            obj['indexDetailUnit'],
            obj['tipo'],
            obj['cantidad'],
            obj['lote'],
            obj['fechaVencimiento'],
            obj['unidad'],
            obj['validateCantidad'],
            obj['validateLote'],
            obj['idProductList'],
            obj['clientStockDetail'],
        );
    }

    constructor(
        public idProduct: number = 0,
        public indexDetail: number = 0,
        public indexDetailUnit: number = 0,
        public tipo: string = "",
        public cantidad: number = 0,
        public lote: string = "",
        public fechaVencimiento: string = "",
        public unidad: string = "",
        public validateCantidad: Boolean = false,
        public validateLote: Boolean = false,
        public idProductList: number = 0,
        public clientStockDetail: ClientStocksDetail[],
        public showDateModalDep: Boolean = false,
        public showDateModalExh: Boolean = false,
    ) { }
}