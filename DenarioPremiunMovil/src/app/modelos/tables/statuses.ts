export class Statuses {

    static statusesBatchJson(obj: Statuses) {
        return new Statuses(
            obj['idStatus'],
            obj['coStatus'],
            obj['naStatus'],
            obj['statusAction'],

        );
    }

    constructor(
        public idStatus: number,
        public coStatus: string,
        public naStatus: string,
        public statusAction: number,

    ) { }
}