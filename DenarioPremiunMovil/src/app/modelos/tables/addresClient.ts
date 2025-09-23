export class AddresClient {

    static addresClientJson(obj: AddresClient) {
        return new AddresClient(
            obj['idAddress'],
            obj['coAddress'],
            obj['naAddress'],
            obj['idClient'],
            obj['idAddressType'],
            obj['coAddressType'],
            obj['txAddress'],
            obj['nuPhone'],
            obj['naResponsible'],
            obj['coEnterpriseStructure'],
            obj['idEnterpriseStructure'],
            obj['coClient'],
            obj['coEnterprise'],
            obj['idEnterprise'],
            obj['coordenada'],
            obj['editable'],
        );
    }

    constructor(
        public idAddress: number,
        public coAddress: string,
        public naAddress: string,
        public idClient: number,
        public idAddressType: number,
        public coAddressType: string,
        public txAddress: string,
        public nuPhone: string,
        public naResponsible: string,
        public coEnterpriseStructure: string,
        public idEnterpriseStructure: number,
        public coClient: string,
        public coEnterprise: string,
        public idEnterprise: number,
        public coordenada: string,
        public editable: boolean,
    ) { }
}