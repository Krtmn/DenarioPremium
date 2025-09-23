export class Zone {

    static zoneJson(obj: Zone) {
        return new Zone(
            obj['id'],
            obj['coZone'],
            obj['naZone'],
            obj['idEnterprise'],
        );
    }

    constructor(
        public id: number,
        public coZone: string,
        public naZone: string,
        public idEnterprise: number,
    ) { }
}