export class ClientStockTotal {
    static clientStockTotalJson(obj: ClientStockTotal) {
        return new ClientStockTotal(
            obj['idEnterprise'],
            obj['coEnterprise'],
            obj['idProduct'],
            obj['coProduct'],
            obj['naProduct'],
            obj['naUnit'],
            obj['idUnit'],
            obj['coUnit'],
            obj['totalUnits'],
            obj['totalExh'],
            obj['totalDep'],
            obj['ubicacion'],
        );
    }

    constructor(
        public idEnterprise: number = 0,
        public coEnterprise: string = "",
        public idProduct: number = 0,
        public coProduct: string = "",
        public naProduct: string = "",
        public naUnit: string = "",
        public idUnit: number = 0,
        public coUnit: string = "",
        public totalUnits: number = 0,
        public totalExh: number = 0,
        public totalDep: number = 0,
        public ubicacion: string = "",

    ) { }
}
