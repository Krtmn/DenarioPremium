export class DistributionChannel {

    static distributionChannelJson(obj: DistributionChannel) {
        return new DistributionChannel(
            obj['idChannel'],
            obj['coChannel'],
            obj['naChannel'],
            obj['shortNaChannel'],
            obj['coEnterprise'],
            obj['idEnterprise'],
        );
    }

    constructor(
        public idChannel: number,
        public coChannel: string,
        public naChannel: string,
        public shortNaChannel: string,
        public coEnterprise: string,
        public idEnterprise: number,
    ) { }
}
