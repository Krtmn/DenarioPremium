export class UserAddresClients {

    static userAddresClientsJson(obj: UserAddresClients) {
        return new UserAddresClients(
            obj['idUserAddressClient'],
            obj['coUserAddressClient'],
            obj['idAddressClient'],
            obj['coAddressClient'],
            obj['txComment'],
            obj['idUser'],
            obj['idEnterprise'],
            obj['coordenada'],
            obj['status']
        );
    }

    constructor(
        public idUserAddressClient: number | null,
        public coUserAddressClient: string,
        public idAddressClient: number,
        public coAddressClient: string,
        public txComment: string,
        public idUser: number,
        public idEnterprise: number,
        public coordenada: string,
        public status: number
    ) { }
}