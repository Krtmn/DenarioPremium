export class PlanCuotaEmpresaView {

    static PlanCuotaEmpresaViewJson(obj: PlanCuotaEmpresaView){
        return new PlanCuotaEmpresaView(
            obj['id'],
            obj['idPresupuesto'],
            obj['coEnterprise'],
            obj['naEnterprise'],
            obj['coUser'],
            obj['daBudget'],
            obj['coUnit'],
            obj['naUnit'],
            obj['cuotaMes'],
            obj['ventaRealMes']
        )
    }
    
    constructor(
        public id: number,
        public idPresupuesto: number,
        public coEnterprise: String,
        public naEnterprise: String,
        public coUser: String,
        public daBudget: String,
        public coUnit: String,
        public naUnit: String,
        public cuotaMes: number,
        public ventaRealMes: number
    ) {}
}