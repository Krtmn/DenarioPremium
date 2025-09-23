import { PlanCuotaEmpresaView } from "./planCuotaEmpresaView";

export class UserInfoView {

    static userInfoJson(obj: UserInfoView) {
        return new UserInfoView(
            obj['id'],
            obj['idUser'],
            obj['coUser'],
            obj['mes'],
            obj['diasHabiles'],
            obj['diasTranscurridos'],
            obj['diasRestantes'],
            obj['carteraClientes'],
            obj['clientesActivados'],
            obj['clientesNuevos'],
            obj['clientesNuevosActivados'],
            obj['coEnterprise'],
            obj['naEnterprise'],
            obj['planesCuotaEmpresa']
          
        );
    }
  
    constructor(
        public id: number,
        public idUser: number,
        public coUser: String,
        public mes: String,
        public diasHabiles: number,
        public diasTranscurridos: number,
        public diasRestantes: number,

        public carteraClientes: number,
        public clientesActivados: number,
        public clientesNuevos: number,
        public clientesNuevosActivados: number,

        public coEnterprise: String,
        public naEnterprise: String,

        public planesCuotaEmpresa: PlanCuotaEmpresaView[]

    ) { }
  }