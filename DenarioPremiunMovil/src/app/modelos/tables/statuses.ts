export class Statuses {

    static statusesBatchJson(obj: Statuses) {
        return new Statuses(
            obj['idStatus'],
            obj['coStatus'],
            obj['naStatus'],
         
        );
    }

    constructor(
        public idStatus: number,
        public coStatus: string,
        public naStatus: string,
       
    ) { }
}