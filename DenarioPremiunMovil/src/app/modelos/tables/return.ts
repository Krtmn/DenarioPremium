import { ReturnDetail } from "./ReturnDetail";
import { DocumentSale } from "./documentSale";
import { Unit } from "./unit";

export class Return {

    static returnJson(obj: Return) {
        return new Return(
            obj['idReturn'],
            obj['coReturn'],
            obj['stReturn'],
            obj['daReturn'],
            obj['naResponsible'],
            obj['nuSeal'],
            obj['idType'],
            obj['txComment'],
            obj['coUser'],
            obj['idUser'],
            obj['coClient'],
            obj['idClient'],
            obj['lbClient'],
            obj['naClient'],
            obj['coInvoice'],
            obj['idInvoice'],
            obj['coordenada'],
            obj['details'],
            obj['invoicedetailUnits'],
            obj['coEnterprise'],
            obj['idEnterprise'],
            obj['hasAttachments'],
            obj['nuAttachments'],
        );
    }

    constructor(
        public idReturn: number | null = 0,
        public coReturn: string = "",
        public stReturn: number = 0,
        public daReturn: string = "",
        public naResponsible: string = "",
        public nuSeal: string = "",
        public idType: number = 0,
        public txComment: string = "",
        public coUser: string = "",
        public idUser: number = 0,
        public coClient: string = "",
        public idClient: number = 0,
        public lbClient: string = "",
        public naClient: string="",
        public coInvoice: string = "",
        public idInvoice: number = 0,
        public coordenada: string = "",
        public details: ReturnDetail[],
        public invoicedetailUnits: Unit[],
        public coEnterprise: string = "",
        public idEnterprise: number = 0,
        public hasAttachments: boolean,
        public nuAttachments: number,
    ) { }
}

// export class ReturnDetail {
//     static returnDetailJson(obj: ReturnDetail) {
//         return new ReturnDetail(
//             obj['idReturnDetail'],
//             obj['coReturnDetail'],
//             obj['coReturn'],
//             obj['coProduct'],
//             obj['idProduct'],
//             obj['quProduct'],
//             obj['nuLote'],
//             obj['daDueDate'],
//             obj['coDocument'],
//             obj['idMotive'],
//             obj['coProductUnit'],
//             obj['idProductUnit'],
//             obj['coEnterprise'],
//             obj['idEnterprise'],
//         );
//     }

//     constructor(
//         public idReturnDetail: number = 0,
//         public coReturnDetail: string = "",
//         public coReturn: string = "",
//         public coProduct: string = "",
//         public idProduct: number = 0,
//         public quProduct: number = 0,
//         public nuLote: string = "",
//         public daDueDate: string = "", 
//         public coDocument: string = "",
//         public idMotive: number = 0,
//         public coProductUnit: string = "",
//         public idProductUnit: number = 0,
//         public coEnterprise: string = "",
//         public idEnterprise: number = 0,
//     ) { }
// }