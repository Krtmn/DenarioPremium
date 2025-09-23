export class ClientChannelOrderType {

    static clientChannelOrderTypeJson(obj: ClientChannelOrderType) {
        return new ClientChannelOrderType(
            obj['idClientChannelOrderType'],
            obj['coClientChannelOrderType'],
            obj['idClient'],
            obj['coClient'],
            obj['idDistributionChannel'],
            obj['coDistributionChannel'],
            obj['idOrderType'],
            obj['coOrderType'],
            obj['idEnterprise'],
            obj['coEnterprise'],
        );
    }

    constructor(
        public idClientChannelOrderType: number,
        public coClientChannelOrderType: string,
        public idClient: number,
        public coClient: string,
        public idDistributionChannel: number,
        public coDistributionChannel: number,
        public idOrderType: number,
        public coOrderType: string,
        public idEnterprise: number,
        public coEnterprise: string

    ) { }
}